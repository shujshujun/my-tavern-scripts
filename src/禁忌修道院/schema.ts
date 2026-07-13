import { z } from 'zod';

/**
 * 禁忌修道院(重置版) - 数据结构定义
 *
 * 设计要点(详见 设计spec.md):
 * 1. 修女以「职位」为变量 key(稳定标识,显示名在 stageConfig,除特蕾莎外未定名)
 * 2. 安检机第一道:本 schema 负责类型强转/catch 默认/clamp 绝对范围
 *    安检机第二道(±3 差值裁剪、脚本管字段回写)在 脚本/游戏逻辑 的 VARIABLE_UPDATE_ENDED
 * 3. 三轴:支持度(投票意愿)/堕落度(重规钥匙)/信仰值(人格防线,高信仰使堕落增长打折)
 * 4. 当前阶段/上次互动楼层/情报可见 及全部全局机制字段由脚本管理,AI 改动会被回写
 */

/** 0-100 数值:类型强转 + 兜底默认 + 范围夹取 */
const stat = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : _.clamp(v, 0, 100)))
    .prefault(def);

/** 非负整数(奉献金等) */
const nonNegInt = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : Math.max(0, Math.round(v))))
    .prefault(def);

// ============================================
// 修女状态(8 人共用一张变量单)
// ============================================

const 身体开发 = z
  .object({
    小嘴: stat(0),
    胸部: stat(0),
    小屄: stat(0),
    屁穴: stat(0),
  })
  .prefault({});

const 服装 = z
  .object({
    头纱: z.string().prefault('黑色头纱'),
    上装: z.string().prefault('黑色修女长袍'),
    下装: z.string().prefault('及踝长裙'),
    内衣上: z.string().prefault('朴素白棉内衣'),
    内衣下: z.string().prefault('朴素白棉内裤'),
    袜足: z.string().prefault('黑色长袜'),
    鞋: z.string().prefault('低跟黑皮鞋'),
    配饰: z.string().prefault('木质念珠十字架'),
    特殊装饰: z.string().prefault('无'),
  })
  .prefault({});

const 妆容 = z
  .object({
    底妆: z.string().prefault('素颜'),
    唇妆: z.string().prefault('无'),
    眼妆: z.string().prefault('无'),
    香氛: z.string().prefault('无'),
  })
  .prefault({});

const 修女状态 = z
  .object({
    // ── 三轴(AI 小步更新,单轮 ±3 由脚本裁剪) ──
    支持度: stat(0),
    堕落度: stat(0),
    信仰值: stat(100),

    // ── 阶段(脚本管,AI 不要修改) ──
    当前阶段: z.coerce
      .number()
      .catch(1)
      .transform(v => (isNaN(v) ? 1 : _.clamp(Math.floor(v), 1, 5)))
      .prefault(1),
    阶段标题: z.string().prefault('圣洁'),

    // ── 身体开发(全员标配,〔待定项〕若改主线级仅需删字段) ──
    身体开发,

    // ── AI 每轮更新的表现字段 ──
    当前心理想法: z.string().prefault(''),
    当前情绪: z.string().prefault('平静'),
    气质描述: z.string().prefault(''),

    // ── 着装(脚本记账为主) ──
    服装,
    妆容,
    暴露程度: z.string().prefault('遮蔽'),
    整洁度: z.string().prefault('整洁'),

    // ── 专线进度(每人形态不同:把柄线索/利益档/研究借口档/感情里程碑) ──
    专线进度: z.record(z.string(), z.string()).prefault({}),

    // ── 脚本管字段 ──
    情报可见: z.coerce.boolean().catch(false).prefault(false),
    上次互动楼层: nonNegInt(0),
    /** 与她同场的 AI 楼计数(黑市等"聊够 N 楼"类门槛的数据源) */
    互动楼数: nonNegInt(0),
  })
  .prefault({});

// ============================================
// 修女职位(变量 key,顺序即名册顺序)
// ============================================

export const 修女职位列表 = ['院长', '纠察', '司库', '医务', '图书', '厨娘', '见习', '巡查'] as const;
export type 修女职位 = (typeof 修女职位列表)[number];

// ============================================
// 主 Schema
// ============================================

export const Schema = z.object({
  修女: z
    .object({
      院长: 修女状态,
      纠察: 修女状态,
      司库: 修女状态,
      医务: 修女状态,
      图书: 修女状态,
      厨娘: 修女状态,
      见习: 修女状态,
      巡查: 修女状态,
    })
    .prefault({}),

  // ── 全局机制字段(全部脚本管,AI 改动会被回写) ──
  奉献金: nonNegInt(0),
  激进度: nonNegInt(0), // 长线制度风险,累计触发视察,不设上限
  警戒度: stat(0), // 短线行为风险,可回落

  会议: z
    .object({
      倒计时: nonNegInt(18), // 楼数,15-20 由脚本掷骰重置
      状态: z.enum(['日常', '会议中']).catch('日常').prefault('日常'),
      已开届数: nonNegInt(0), // 已开完的会议次数(进度记账;视察/后期系统可用)
    })
    .prefault({}),

  // 规则 id → 当前档(0=原规未篡改),规则定义见 stageConfig.院规表
  院规: z.record(z.string(), nonNegInt(0)).prefault({}),

  视察: z
    .object({
      状态: z.enum(['未触发', '预警', '进行中', '已结束']).catch('未触发').prefault('未触发'),
    })
    .prefault({}),

  // 黑市(圣器事件解锁;道具定义见 stageConfig.道具表)
  商店: z
    .object({
      解锁: z.coerce.boolean().catch(false).prefault(false),
      已购: z.array(z.string()).catch([]).prefault([]),
    })
    .prefault({}),

  // ── AI 每轮即兴一句,只进客户端页缘,严禁进正文 ──
  恶魔低语: z.string().prefault(''),
});

export type SchemaType = z.output<typeof Schema>;
