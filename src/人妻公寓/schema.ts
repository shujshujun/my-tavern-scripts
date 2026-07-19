import { z } from 'zod';

/**
 * 人妻公寓 - 数据结构定义(变量分工表落码,见 设计spec.md「变量分工表」)
 *
 * 设计要点:
 * 1. 户级结构:`户.101.{妻,夫}` —— **z.record 容忍缺键**(防护10-②):
 *    未入住的户在 stat_data 里无此键(第四态休眠,AI 无法泄露它不知道的事),
 *    入住事件时脚本从初始模板动态创建整户节点(见 创建户节点)。
 * 2. 安检第一道:本 schema 负责类型强转/catch 默认/clamp 绝对范围(防护1)。
 *    第二道(±3 差值裁剪、脚本管字段回滚)在 脚本/游戏逻辑/守护系统.ts。
 * 3. 三轴:好感值(对你)/堕落值(对性,晋阶资格)/婚姻值(对丈夫,防线轴)。
 *    罪恶感 = max(0, 堕落值 - (100 - 婚姻值)) 现算派生,不入变量。
 * 4. 丈夫双轴(疑心值=对妻子/信任值=对你)**全脚本结算,AI 一律不写**(2026-07-16 拍板)。
 * 5. 机制变量一律 `_` 前缀,AI 不可见(快照编译器永不注入)。
 */

/** 0-100 数值:类型强转 + 兜底默认 + 范围夹取 */
const stat = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : _.clamp(v, 0, 100)))
    .prefault(def);

/** 非负整数(现金/计数等) */
const nonNegInt = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : Math.max(0, Math.round(v))))
    .prefault(def);

/** 楼层标记(-1 = 未设置/旧档首见校准) */
const floorMark = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : Math.max(-1, Math.round(v))))
    .prefault(def);

// ============================================
// 妻(每户人妻状态单)
// ============================================

const 身体开发 = z
  .object({
    小嘴: stat(0),
    胸部: stat(0),
    小屄: stat(0),
    屁穴: stat(0),
  })
  .prefault({});

const 裂缝 = z
  .object({
    /** 专属渠道产出的碎片(0-4,集齐=裂缝揭晓;硬门:全部由该户专属渠道产出) */
    碎片进度: z.coerce
      .number()
      .catch(0)
      .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 4)))
      .prefault(0),
    /** 一次性单向锁(防护4):集齐 4 碎片翻真,永不回落 */
    已确认: z.coerce.boolean().catch(false).prefault(false),
  })
  .prefault({});

const 妻状态 = z
  .object({
    // ── 三轴 ──
    好感值: stat(0), // AI 可写 ±3(对症放宽 ±5,P2);裂缝未发现前被阶段0接受上限封死
    堕落值: stat(0), // AI 可写 ±3(性场景楼);晋阶大额走脚本正戏结算
    婚姻值: stat(100), // 脚本专属:防线轴(被动阴跌+关键事件结算),AI 禁写

    // ── 阶段(0=陌生邻里,1-5=贞淑→动摇→越界→沉沦→归属;脚本管,晋阶走正戏) ──
    当前阶段: z.coerce
      .number()
      .catch(0)
      .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 5)))
      .prefault(0),
    阶段标题: z.string().prefault('陌生邻里'), // 派生字段,脚本按当前阶段重算

    // ── 裂缝(攻略入口门;内容在 stageConfig 静态配置,确认前不注入 AI) ──
    裂缝,

    // ── AI 每轮更新的表现字段 ──
    当前心理想法: z.string().prefault(''),
    当前情绪: z.string().prefault('平静'),
    气质描述: z.string().prefault(''), // 一句话气质锚点,随阶段由脚本改写(秦璐范式)

    // ── 着装四槽(一句话描述;未穿戴装备时 AI 可日常自换,穿戴后该槽脚本锁定——
    //    2026-07-18 用户拍板:商店服饰=核心特色,不能被 AI 随手换下;立绘随服装差分归P5素材波) ──
    外装: z.string().prefault(''),
    内衣: z.string().prefault(''),
    妆容: z.string().prefault('素颜'),
    /** 被脚本锁定的着装槽名单(穿戴你送的服饰时写入;在列槽 AI 改动一律拍回) */
    _穿戴锁: z.array(z.string()).catch([]).prefault([]),
    /** 印记配饰列表(可叠穿,软上限4件;永久件带「不可卸载」语义,标记在 stageConfig) */
    特殊: z.array(z.string()).catch([]).prefault([]),

    // ── 身体开发(仅性场景楼 AI 可 +3,不可衰退,上限挂阶段) ──
    身体开发,

    // ── 性癖槽(P5 启用;3 槽装载中 + 档案卡永久"曾开发"记录) ──
    性癖装载: z.array(z.string()).catch([]).prefault([]),
    曾开发性癖: z.array(z.string()).catch([]).prefault([]),

    // ── 脚本管字段 ──
    情报可见: z.coerce.boolean().catch(false).prefault(false), // 单向锁
    上次互动楼层: nonNegInt(0), // 冷落计时器数据源

    // ── `_` 机制字段(AI 不可见) ──
    _上次结算楼层: floorMark(-1), // 惰性结算水位线(后台户被动账一口气补算)
    /** P5 服饰:槽→穿着中SKU id(立绘差分文件名后缀;脚本写,AI不可见) */
    _穿着SKU: z.record(z.string(), z.string()).catch({}).prefault({}),
    _要钱次数: nonNegInt(0), // P3:L4 要钱按钮累计(≥2 触发"向丈夫开口"疑心+)
    _上次要钱楼层: floorMark(-1),
  })
  .prefault({});

// ============================================
// 夫(每户丈夫状态单;双轴指向不同对象,全脚本结算)
// ============================================

const 夫状态 = z
  .object({
    疑心值: stat(0), // 对妻子:"她不对劲"察觉度,风险轴
    信任值: stat(0), // 对你:把管理员当什么人,资源轴
    /** 在家/外出/夜班/出差——由作息表挂时段推算落地(楼层时钟),AI 禁写 */
    状态: z.string().prefault(''),
    结局轨道: z.string().prefault(''), // 结局"怎么演"由(信任×疑心)格子定
    // 仅丈夫为焦点的楼注入/允许更新(秦璐苏文范式)
    当前心理想法: z.string().prefault(''),
    当前情绪: z.string().prefault('平静'),
    // ── P3 运作道具窗口(钟楼语义=真实楼层+杀时间偏移;机制不可见,AI 只看到剧情皮) ──
    _疑心冻结至: floorMark(-1), // 钓鱼团购券:窗口内疑心只降不涨
    _外出至: floorMark(-1), // 夜班内推/外地项目:窗口内丈夫状态强制外出
    _上次出差楼: floorMark(-1), // 外地项目每户冷却
    _上次打断档: floorMark(-1), // 打断系统频控:同户同时段最多打断一次(存时段档号)
  })
  .prefault({});

// ============================================
// 户节点(妻+夫+入住账)
// ============================================

const 户节点 = z
  .object({
    妻: 妻状态,
    夫: 夫状态,
    /** 收租日基准+回档重演语义锚(进晋阶镜像,单调事件防重roll) */
    _入住楼层: nonNegInt(0),
    // ── P3 经济 ──
    _上次收租期: floorMark(-1), // 期号去重:同期只结一次(重roll/逃生舱双入口防重复入账)
    _欠租笔数: nonNegInt(0), // 天生欠租户(201)累计未收笔数;催租三选归零或转宽限
  })
  .prefault({});

export type 户节点Type = z.output<typeof 户节点>;

/** 入住事件用:从初始模板动态创建整户节点(休眠户唤醒;人设初始值 P5 在 stageConfig 覆盖) */
export function 创建户节点(入住楼层: number): 户节点Type {
  const 节点 = 户节点.parse({});
  节点._入住楼层 = Math.max(0, Math.round(入住楼层));
  return 节点;
}

// ============================================
// 主 Schema
// ============================================

export const Schema = z.object({
  /** 门牌号 → 户;未入住无键(休眠),Zod record 容忍缺键(防护10-②) */
  户: z.record(z.string(), 户节点).prefault({}),

  // ── 全局机制字段(全部脚本管,AI 改动会被回滚) ──
  现金: nonNegInt(500), // 〔调参〕起始资金
  胜任度: stat(80), // 〔调参〕"父母的考验"记分牌,跌破红线+通牒期未救回=唯一 Game Over
  风闻: stat(0), // 楼内风闻度(邻里传闲话),替代修道院警戒度

  /** 背包(2026-07-16 定名拍板,不叫行囊):商店购买道具+碎片信才入包,普通垃圾不入 */
  背包: z.array(z.string()).catch([]).prefault([]),

  系统: z
    .object({
      _坏结局: z.string().prefault(''), // 单向锁:非空=全冻结,快照只注入终局指引
      /** 一次性剧情事件队列(| 分隔;写阶段转存 _已注入事件 供同楼重roll重放,防护10) */
      _待发送事件: z.string().prefault(''),
      _已注入事件: z
        .object({
          楼层: floorMark(-1),
          内容: z.string().prefault(''),
        })
        .prefault({}),
      _母亲撞见次数: nonNegInt(0), // 静默暗账:母亲入列时折算初始堕落+破墙正戏差分
      /** P5 母亲入列(2026-07-19):301 到阶段2 时置真——地图头像亮起,302 从背景板转攻略对象 */
      _母亲入列: z.coerce.boolean().catch(false).prefault(false),
      _系统操作中: z.coerce.boolean().catch(false).prefault(false), // 道具使用/模式切换楼跳过轮次推进
      _难度: z.string().prefault('标准'), // 开局三档(轻松/标准/严苛),效果查 stageConfig.难度表
      _序章完成: z.coerce.boolean().catch(false).prefault(false), // 单向语义随楼层快照走(回档到0=重开序章)
      // 摄像头布设名单(2026-07-17 从 chat 变量迁入:与背包同一本账,重掷/撤回删楼时消耗与布设同生共死,
      // 否则"背包里的摄像头随楼层复活+chat 侧已装记录还在"=一次购买无限装)
      _摄像头布设: z.record(z.string(), z.coerce.boolean()).catch({}).prefault({}),
      _连续违规: nonNegInt(0), // 稽查:连续越阶计数(3次→"她开始躲着你"事件)
      _上次违规楼层: floorMark(-1), // 楼层去重旗标(防护12):同楼不重复结算惩罚
      // 杀时间(2026-07-17:管理员室"歇一会儿"静默快进一个时段)——偏移必须进 MVU 随楼层快照走,
      // 回档/同楼重roll 自洽;一切时间读数(时段/天数/作息/位置/侦探冷却)=真实楼层+此偏移
      _时段偏移楼: nonNegInt(0),
      _上次杀时间楼层: floorMark(-1), // 冷却:每真实楼层只准快进一次,连跳要先跟世界说句话
      // ── P3 经济与考验(货币只走脚本结算,AI 不碰钱) ──
      _上次上交期: floorMark(-1), // 上交日期号去重
      _通牒期: floorMark(-1), // 最后通牒发出的期号(-1=无);下一期仍不达标=坏结局
      /** 待接来电(收租/上交日结算生成;P4 手机接听,覆盖=扣胜任度) */
      _待接来电: z
        .object({
          期: floorMark(-1), // -1=无来电
          分数段: z.string().prefault(''),
          报表: z.string().prefault(''),
          通牒: z.coerce.boolean().catch(false).prefault(false),
        })
        .prefault({}),
    })
    .prefault({}),
});

export type SchemaType = z.output<typeof Schema>;
