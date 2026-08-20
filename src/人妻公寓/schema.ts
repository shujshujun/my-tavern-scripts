import { z } from 'zod';

export const 当前MVU数据版本 = 9;
const 可迁移MVU数据版本 = [7, 8] as const;

const 阶段性癖按门牌 = {
  '101': '孕欲',
  '102': '视奸欲',
  '201': '交易快感',
  '202': '独占印记',
  '301': '镜头高潮',
  '302': '哺育癖',
} as const;

const 旧性癖ID = new Set([
  '露出癖',
  '淫语解禁',
  '拍摄癖',
  '受虐渴望',
  '口奴体质',
  '后穴开发',
  '潮喷体质',
  '阿黑颜',
  '中出执念',
  '隐奸癖',
  '物化认知',
  '窒息快感',
  '尿饮嗜好',
  '舔肛嗜好',
  '寝取展示',
  ...Object.values(阶段性癖按门牌),
]);

type 原始记录 = Record<string, unknown>;

function 是记录(value: unknown): value is 原始记录 {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const 原型 = Object.getPrototypeOf(value) as object | null;
  // 兼容 iframe/父窗口的跨 realm 普通对象：它们的 Object.prototype 身份不同，
  // 但普通对象原型的上一级仍为 null；Date、Map 与 class 实例则还有更深的原型链。
  return 原型 === null || Object.getPrototypeOf(原型) === null;
}

/** v0.85 接受 v0.80(v7)、v0.81/v0.82(v8) 与 v0.83/v0.84(v9)；更早或未来数据版本继续硬拒绝。 */
export function 验证当前MVU存档版本(input: unknown): void {
  if (!是记录(input)) {
    throw new Error('人妻公寓存档结构损坏：stat_data 必须是对象。请新建聊天开始游戏。');
  }
  if (Object.keys(input).length === 0) return;
  const 系统 = 是记录(input.系统) ? input.系统 : undefined;
  const 版本 = 系统?._数据版本;
  if (
    !系统 ||
    !Object.prototype.hasOwnProperty.call(系统, '_数据版本') ||
    (!可迁移MVU数据版本.includes(版本 as (typeof 可迁移MVU数据版本)[number]) && 版本 !== 当前MVU数据版本)
  ) {
    const 显示版本 = typeof 版本 === 'number' && Number.isInteger(版本) ? String(版本) : '未知';
    throw new Error(
      `v0.85 仅兼容数据版本 7、8 和 9：当前存档版本为 ${显示版本}。v0.80/v0.81/v0.82/v0.83/v0.84 存档可直接继承；其他版本请新建聊天开始游戏。`,
    );
  }
}

/**
 * rq0.80-rq0.85 发布初始值共同拥有的稳定持久契约。
 *
 * `Schema.parse({})` 必须继续可用于内部默认构造，因此不能把所有字段改成 zod required；
 * 真实聊天快照则必须先过这道门，防止非空截断对象被 prefault/catch 补成“看似完整的新局”。
 * 这里只要求历代共同存在的骨架，不要求 v9 新字段，旧档仍可由迁移和 Schema 安全补齐。
 */
const 可继续存档顶层字段 = ['户', '现金', '胜任度', '风闻', '玩家资源', '背包', '系统'] as const;
const 可继续存档玩家资源字段 = [
  '精力',
  '体力',
  '保护准备',
  '_晨跑训练日',
  '_体力训练日',
  '_小憩日',
  '_已使用永久道具',
] as const;
const 可继续存档资源节点字段 = ['当前值', '训练经验', '永久上限加成'] as const;
const 可继续存档户字段 = ['妻', '夫', '_入住时段', '_上次收租期', '_欠租笔数'] as const;
// 只取 rq0.80-rq0.85 从一开始就存在的交集；缺失任一叶都不能交给 Schema 默认重建。
const 可继续存档妻核心字段 = [
  '好感值',
  '堕落值',
  '婚姻值',
  '当前阶段',
  '裂缝',
  '当前心理想法',
  '当前情绪',
  '外装',
  '内衣',
  '妆容',
  '_穿戴锁',
  '特殊',
  '身体开发',
  '上次互动楼层',
  '_上次结算楼层',
  '_成长账',
  '_冷落余波',
  '_堕落日账',
  '_阶段线路',
  '_穿着SKU',
  '_要钱次数',
  '_上次要钱楼层',
] as const;
const 可继续存档夫核心字段 = [
  '疑心值',
  '信任值',
  '状态',
  '结局轨道',
  '当前心理想法',
  '当前情绪',
  '_疑心冻结至',
  '_外出至',
  '_上次出差楼',
  '_上次打断档',
] as const;
const 可继续存档系统字段 = [
  '_上次上交期',
  '_上次性爱结果',
  '_上次撞见档',
  '_坏结局',
  '_已完成特殊场景',
  '_已注入事件',
  '_序章完成',
  '_待发送事件',
  '_待接来电',
  '_性爱场景',
  '_提示刷新态',
  '_摄像头布设',
  '_数据版本',
  '_母亲入列',
  '_母亲撞见次数',
  '_母亲首夜第二幕',
  '_父亲通话',
  '_特殊场景',
  '_特殊场景前置',
  '_管理考核',
  '_绝对时段',
  '_荣耀洞上次时段',
  '_荣耀洞动态时段',
  '_荣耀洞动态门牌',
  '_荣耀洞夫',
  '_荣耀洞拍',
  '_荣耀洞点破',
  '_荣耀洞起时段',
  '_荣耀洞门牌',
  '_通牒期',
  '_难度',
  '_风闻账',
] as const;
function 缺少自有字段(value: Record<string, unknown>, fields: readonly string[]): string[] {
  return fields.filter(field => !Object.prototype.hasOwnProperty.call(value, field));
}

function 要求记录骨架(value: unknown, label: string, fields: readonly string[]): 原始记录 {
  if (!是记录(value)) throw new Error(`人妻公寓存档结构损坏：${label}不是普通对象。`);
  const 缺失 = 缺少自有字段(value, fields);
  if (缺失.length) throw new Error(`人妻公寓存档结构损坏：${label}缺少稳定字段 ${缺失.join('、')}。`);
  return value;
}

function 是可归一有限数值(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
}

/**
 * 验证真实持久快照是否足以继续游戏。与“版本是否受支持”分离，供启动与最近有效楼读取使用；
 * 内部单元测试／局部工厂仍可直接 `Schema.parse({})`。
 */
export function 验证可继续MVU存档结构(input: unknown): void {
  验证当前MVU存档版本(input);
  if (!是记录(input) || Object.keys(input).length === 0) {
    throw new Error('人妻公寓存档结构损坏：真实 stat_data 为空，不能按新局默认值继续。');
  }

  const 顶层缺失 = 缺少自有字段(input, 可继续存档顶层字段);
  if (顶层缺失.length) {
    throw new Error(`人妻公寓存档结构损坏：缺少稳定顶层字段 ${顶层缺失.join('、')}。`);
  }
  const 户表 = 要求记录骨架(input.户, '户', []);
  const 玩家资源 = 要求记录骨架(input.玩家资源, '玩家资源', 可继续存档玩家资源字段);
  if (!Array.isArray(input.背包)) throw new Error('人妻公寓存档结构损坏：背包不是数组。');
  if (!Array.isArray(玩家资源._已使用永久道具)) {
    throw new Error('人妻公寓存档结构损坏：玩家资源._已使用永久道具不是数组。');
  }
  for (const 资源名 of ['精力', '体力'] as const) {
    const 资源 = 要求记录骨架(玩家资源[资源名], `玩家资源.${资源名}`, 可继续存档资源节点字段);
    for (const field of 可继续存档资源节点字段) {
      if (!是可归一有限数值(资源[field])) {
        throw new Error(`人妻公寓存档结构损坏：玩家资源.${资源名}.${field}不是可归一的有限数值。`);
      }
    }
  }

  for (const [门牌, 原始户] of Object.entries(户表)) {
    const 户 = 要求记录骨架(原始户, `户.${门牌}`, 可继续存档户字段);
    const 妻 = 要求记录骨架(户.妻, `户.${门牌}.妻`, 可继续存档妻核心字段);
    const 夫 = 要求记录骨架(户.夫, `户.${门牌}.夫`, 可继续存档夫核心字段);
    if (!Array.isArray(妻._穿戴锁) || !Array.isArray(妻.特殊)) {
      throw new Error(`人妻公寓存档结构损坏：户.${门牌}.妻的穿戴列表不是数组。`);
    }
    for (const field of ['裂缝', '身体开发', '_成长账', '_冷落余波', '_堕落日账', '_阶段线路', '_穿着SKU'] as const) {
      if (!是记录(妻[field])) throw new Error(`人妻公寓存档结构损坏：户.${门牌}.妻.${field}不是普通对象。`);
    }
    for (const field of ['_入住时段', '_上次收租期', '_欠租笔数'] as const) {
      if (!是可归一有限数值(户[field])) {
        throw new Error(`人妻公寓存档结构损坏：户.${门牌}.${field}不是可归一的有限数值。`);
      }
    }
    for (const [label, value] of [
      ['妻.好感值', 妻.好感值],
      ['妻.堕落值', 妻.堕落值],
      ['妻.婚姻值', 妻.婚姻值],
      ['妻.当前阶段', 妻.当前阶段],
      ['夫.疑心值', 夫.疑心值],
      ['夫.信任值', 夫.信任值],
    ] as const) {
      if (!是可归一有限数值(value)) {
        throw new Error(`人妻公寓存档结构损坏：户.${门牌}.${label}不是可归一的有限数值。`);
      }
    }
  }
  for (const field of ['现金', '胜任度', '风闻'] as const) {
    if (!是可归一有限数值(input[field])) {
      throw new Error(`人妻公寓存档结构损坏：${field}不是可归一的有限数值。`);
    }
  }

  要求记录骨架(input.系统, '系统', 可继续存档系统字段);
}

/** 空 Schema 构造不是外部存档；其余合法输入中 v7/v8 需要一次性迁移。 */
export function 需要迁移MVU存档(input: unknown): boolean {
  验证当前MVU存档版本(input);
  if (!是记录(input) || Object.keys(input).length === 0) return false;
  return 是记录(input.系统) && input.系统._数据版本 !== 当前MVU数据版本;
}

function 仅在缺失时写入(记录: 原始记录, 键: string, 值: unknown): void {
  if (!Object.prototype.hasOwnProperty.call(记录, 键)) 记录[键] = 值;
}

function 创建未孕默认值(): 原始记录 {
  return {
    状态: '未孕',
    受孕绝对时段: -1,
    预计告知绝对时段: -1,
    告知绝对时段: -1,
    受孕场次标识: '',
    上次判定日: -1,
    连续未中次数: 0,
    告知文案: '',
    已曝光: false,
    丈夫登门: {
      状态: '无',
      排期绝对时段: -1,
      变体标识: '',
      当前拍: 0,
      隐藏圆场: false,
      已结算: false,
    },
  };
}

function 创建生产默认值(): 原始记录 {
  return {
    状态: '无',
    本胎序号: 0,
    家庭计划知情: false,
    确认已读绝对时段: -1,
    预产绝对时段: -1,
    自动生产绝对时段: -1,
    预产通知文案: '',
    预产通知已读: false,
    产前看望: false,
    陪产已选择: false,
    生产结算标识: '',
    生产叙事已完成: false,
    实际生产绝对时段: -1,
    住院结束绝对时段: -1,
    结果: '未定',
    产后看望: false,
    获知生产路径: '',
  };
}

function 原始字符串数组(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((项): 项 is string => typeof 项 === 'string') : [];
}

function 旧阶段性癖节点已完成(门牌: string, 妻: 原始记录): boolean {
  const 当前阶段 = Number(妻.当前阶段);
  if (Number.isFinite(当前阶段) && 当前阶段 >= 5) return true;
  if (!是记录(妻._阶段线路)) return false;
  const 线路 = 妻._阶段线路;
  if (Number(线路.目标阶段) !== 5) return false;
  const 节点 = 门牌 === '302' ? 1 : 0;
  const 位图 = Number(线路.完成位图);
  const 活跃节点 = Number(线路.活跃节点);
  return (Number.isFinite(位图) && (Math.floor(位图) & (1 << 节点)) !== 0) ||
    (Number.isFinite(活跃节点) && Math.floor(活跃节点) > 节点);
}

function 迁移阶段性癖(已迁移: 原始记录): void {
  const 背包 = 原始字符串数组(已迁移.背包);
  if (Array.isArray(已迁移.背包)) 已迁移.背包 = 背包.filter(id => !旧性癖ID.has(id));
  if (!是记录(已迁移.户)) return;

  for (const [门牌, 户] of Object.entries(已迁移.户)) {
    if (!是记录(户) || !是记录(户.妻)) continue;
    const 妻 = 户.妻;
    const 专属 = 阶段性癖按门牌[门牌 as keyof typeof 阶段性癖按门牌];
    const 旧装载 = 原始字符串数组(妻.性癖装载);
    const 旧开发 = 原始字符串数组(妻.曾开发性癖);
    const 已完成 = !!专属 && 旧阶段性癖节点已完成(门牌, 妻);
    const 已支付证据 = !!专属 && (背包.includes(专属) || 旧装载.includes(专属) || 旧开发.includes(专属));

    妻.阶段性癖 = 已完成 ? 专属 : '';
    妻._阶段性癖已支付 = 门牌 !== '302' && !已完成 && 已支付证据;
    delete 妻.性癖装载;
    delete 妻.曾开发性癖;
  }
}

/**
 * 把 v0.80(v7) 或 v0.81/v0.82(v8) 原始数据迁到当前 v9。先深拷贝、后逐字段补缺与清洗，
 * 保证失败不污染原档；v9 原样返回，因此重复调用幂等。最终类型归一仍统一交给当前 Schema。
 */
export function 迁移MVU存档到当前版本(input: unknown): unknown {
  if (!需要迁移MVU存档(input)) return input;

  const 已迁移 = _.cloneDeep(input) as 原始记录;
  const 系统 = 已迁移.系统 as 原始记录;
  const 原版本 = Number(系统._数据版本);
  if (原版本 === 7) {
    仅在缺失时写入(系统, '_孕情初见评价楼', {});

    if (!是记录(系统._上次性爱结果)) 系统._上次性爱结果 = {};
    仅在缺失时写入(系统._上次性爱结果 as 原始记录, '收尾对象门牌', '');

    if (是记录(已迁移.户)) {
      for (const 户 of Object.values(已迁移.户)) {
        if (!是记录(户) || !是记录(户.妻)) continue;
        const 妻 = 户.妻;
        if (!是记录(妻._冷落余波)) 妻._冷落余波 = {};
        仅在缺失时写入(妻._冷落余波 as 原始记录, '送礼安抚日', -1);
        仅在缺失时写入(妻._冷落余波 as 原始记录, '当日送礼安抚次数', 0);
        if (!是记录(妻._怀孕)) 妻._怀孕 = 创建未孕默认值();
      }
    }
  }
  迁移阶段性癖(已迁移);
  系统._数据版本 = 当前MVU数据版本;
  return 已迁移;
}

/** Schema 的局部构造允许省略版本；显式 v7 会先迁移，显式未知版本会硬拒绝。 */
function 补全生产旧档(input: unknown): unknown {
  if (!是记录(input) || !是记录(input.系统) || !是记录(input.户)) return input;
  const 当前绝对时段 = Math.max(0, Math.floor(Number(input.系统._绝对时段) || 0));
  const 家庭文档 = 是记录(input.系统._家庭文档) ? input.系统._家庭文档 : undefined;
  const 孩子 = Array.isArray(家庭文档?.孩子) ? 家庭文档.孩子 : [];
  let 输出 = input;
  let 已复制 = false;
  const 确保副本 = (): 原始记录 => {
    if (!已复制) {
      输出 = _.cloneDeep(input) as 原始记录;
      已复制 = true;
    }
    return 输出 as 原始记录;
  };

  for (const [门牌, 户] of Object.entries(input.户)) {
    if (!是记录(户) || !是记录(户.妻) || !是记录(户.妻._怀孕) || 户.妻._怀孕.状态 !== '已告知') continue;
    const 生产 = 是记录(户.妻._生产) ? 户.妻._生产 : undefined;
    if (生产 && 生产.状态 !== '无' && Number(生产.确认已读绝对时段) >= 0) continue;
    const 已生 = 孩子.filter(项 => 是记录(项) && 项.母亲门牌 === 门牌).length;
    const 副本 = 确保副本();
    const 妻副本 = ((副本.户 as 原始记录)[门牌] as 原始记录).妻 as 原始记录;
    妻副本._生产 = {
      ...创建生产默认值(),
      状态: '孕期',
      本胎序号: Math.min(3, 已生 + 1),
      // 旧档没有“受孕时已知情”的稳定证据；宁可走通用路线，也不能事后伪造陆嘉明同意。
      家庭计划知情: false,
      确认已读绝对时段: 当前绝对时段,
      预产绝对时段: 当前绝对时段 + 126,
    };
  }
  return 输出;
}

function 迁移显式MVU版本(input: unknown): unknown {
  const 已迁移 =
    是记录(input) && 是记录(input.系统) && Object.prototype.hasOwnProperty.call(input.系统, '_数据版本')
      ? 迁移MVU存档到当前版本(input)
      : input;
  return 补全生产旧档(已迁移);
}

/**
 * 人妻公寓 - 数据结构定义(变量分工表落码,见 设计spec.md「变量分工表」)
 *
 * 设计要点:
 * 1. 户级结构:`户.101.{妻,夫}` —— **z.record 容忍缺键**(防护10-②):
 *    未入住的户在 stat_data 里无此键(第四态休眠,AI 无法泄露它不知道的事),
 *    入住事件时脚本从初始模板动态创建整户节点(见 创建户节点)。
 * 2. 安检第一道:本 schema 负责类型强转/catch 默认/clamp 绝对范围(防护1)。
 *    第二道(±3 差值越界整项回滚、脚本管字段回滚)在 脚本/游戏逻辑/守护系统.ts。
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

/** 风闻与胜任是离散规则轴；存档入口先归一为整数，避免核心与 HUD 各自取整。 */
const integerStat = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : _.clamp(Math.round(v), 0, 100)))
    .prefault(def);

/** 非负整数(现金/计数等) */
const nonNegInt = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : Math.max(0, Math.round(v))))
    .prefault(def);

/** 0 基世界时段只允许向下归一，必须与楼层时钟的读取口保持同一规则。 */
const absolutePeriod = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : Math.max(0, Math.floor(v))))
    .prefault(def);

/** 楼层标记(-1 = 未设置/首次校准)。
 * 下限取 min(-1, def):zod 的 .prefault 会让默认值走完整 transform 管道,
 * 固定夹 -1 会把 -999 这类"从未发生"哨兵吃掉(2026-07-26 审计 H4:荣耀洞开局误报冷却)。 */
const floorMark = (def: number) =>
  z.coerce
    .number()
    .catch(def)
    .transform(v => (isNaN(v) ? def : Math.max(Math.min(-1, def), Math.round(v))))
    .prefault(def);

/**
 * 兼容旧 YAML／MVU 遗留布尔：只接受语义明确的 boolean、true/false、1/0。
 * 不能使用 z.coerce.boolean()，因为 JavaScript 会把任何非空字符串（包括 "false"）转成 true。
 */
const bool = (def = false) =>
  z
    .preprocess(value => {
      if (typeof value === 'boolean') return value;
      if (value === 1) return true;
      if (value === 0) return false;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
      }
      return value;
    }, z.boolean())
    .catch(def)
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
    已确认: bool(),
  })
  .prefault({});

const 妻状态 = z
  .object({
    // ── 三轴 ──
    好感值: stat(0), // AI 单轮只可写 ±3；裂缝确认也不放宽，阶段0另受接受上限约束
    堕落值: stat(0), // AI 可写 ±3(性场景楼);晋阶大额走脚本正戏结算
    婚姻值: stat(100), // 脚本专属:防线轴(被动阴跌+关键事件结算),AI 禁写

    // ── 阶段(0=陌生邻里,1-5=贞淑→动摇→越界→沉沦→归属;脚本管,晋阶走正戏) ──
    当前阶段: z.coerce
      .number()
      .catch(0)
      .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 5)))
      .prefault(0),

    // ── 裂缝(攻略入口门;内容在 stageConfig 静态配置,确认前不注入 AI) ──
    裂缝,

    // ── AI 每轮更新的表现字段 ──
    当前心理想法: z.string().prefault(''),
    当前情绪: z.string().prefault('平静'),

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

    // ── 唯一阶段性癖：有效开幕正文成功后永久登记；不再有槽位、卸载或曾开发列表 ──
    阶段性癖: z.string().prefault(''),
    /** 旧档或当前入口已经支付但尚未完成开幕；成功提交后清空，302剧情获得始终不用此字段。 */
    _阶段性癖已支付: bool(),

    // ── 脚本管字段 ──
    上次互动楼层: nonNegInt(0), // 当前正文互动楼；供雌竞争冷落距离使用

    // ── `_` 机制字段(AI 不可见) ──
    _上次结算楼层: floorMark(-1), // 惰性结算水位线(后台户被动账一口气补算)
    /** 最后一次“任一合法数值成长”的统一冷落时钟；手机消息不会更新此账。 */
    _成长账: z
      .object({
        上次有效成长钟楼: floorMark(-1),
        成长轮次: nonNegInt(0),
        已结算冷落日: nonNegInt(0),
      })
      .prefault({}),
    /** 堕落触底后的脚本专属安抚账；仅对仍具冷落资格（阶段≥2，302需入列）的妻，非“无”状态才双向冻结普通 AI 堕落增减。 */
    _冷落余波: z
      .object({
        状态: z.enum(['无', '待诉苦', '安抚中']).catch('无').prefault('无'),
        触发钟楼: floorMark(-1),
        需安抚楼: nonNegInt(0),
        已安抚楼: nonNegInt(0),
        /** 每个正文楼最多计一次安抚；手机私聊不走正文楼，不能推进。 */
        上次安抚正文楼: floorMark(-1),
        /** 每名角色每个世界日最多三件成功礼物可替代安抚；随楼层快照回档。 */
        送礼安抚日: floorMark(-1),
        当日送礼安抚次数: nonNegInt(0),
      })
      .prefault({}),
    /** 同日堕落收益账(2026-07-27 拍板C,根治"关房间刷一天直通下一阶段"):AI 涨幅当日累计,
     *  超每日上限的楼戏照演账不涨;脚本大额结算(正戏/特殊场景)不走此账。随楼层快照回滚自洽 */
    _堕落日账: z.object({ 日: floorMark(-1), 值: nonNegInt(0) }).prefault({}),
    /** 怀孕全生命周期由脚本维护；“已受孕/待告知”均不得进入正文、手机 AI 或界面。 */
    _怀孕: z
      .object({
        状态: z.enum(['未孕', '已受孕', '待告知', '已告知']).catch('未孕').prefault('未孕'),
        受孕绝对时段: floorMark(-1),
        预计告知绝对时段: floorMark(-1),
        告知绝对时段: floorMark(-1),
        受孕场次标识: z.string().prefault(''),
        /** 只有易孕日内的有效无保护阴道内射才占用当天判定。 */
        上次判定日: floorMark(-1),
        /** 有效判定连续失败次数；0/1/2 分别对应下一次 60%/80%/100%。 */
        连续未中次数: z.coerce
          .number()
          .catch(0)
          .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 2)))
          .prefault(0),
        /** 到期瞬间冻结报孕生成资料；新档存结构化数据，旧档可保留已冻结的可见文案。 */
        告知文案: z.string().prefault(''),
        /** 高风闻下孕情已成为公开硬证据；持久保存，避免风闻事件账裁剪后错误恢复为私密认知。 */
        已曝光: bool(),
        /** 曝光后的丈夫登门由脚本独立排期；变体标识保持字符串，给后续丈夫结局注册新演法。 */
        丈夫登门: z
          .object({
            状态: z.enum(['无', '待触发', '进行中', '已完成']).catch('无').prefault('无'),
            排期绝对时段: floorMark(-1),
            变体标识: z.string().prefault(''),
            当前拍: nonNegInt(0),
            /** 玩家在登门开始前把安神助眠剂交给妻子后置真；过程不进入正文。 */
            隐藏圆场: bool(),
            已结算: bool(),
          })
          .prefault({}),
      })
      .prefault({}),
    /** 本胎生产硬账与 `_怀孕` 分离：实际生产后孕肚状态立即关闭，但住院、通知与幂等票据继续存在。 */
    _生产: z
      .object({
        状态: z
          .enum(['无', '孕期', '待产通知', '待产', '陪产中', '住院中', '已出院'])
          .catch('无')
          .prefault('无'),
        本胎序号: z.coerce
          .number()
          .catch(0)
          .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 3)))
          .prefault(0),
        /** 只冻结本次受孕发生时陆嘉明是否已经知情；不得用当前家庭计划状态事后改写旧孕情。 */
        家庭计划知情: bool(),
        确认已读绝对时段: floorMark(-1),
        预产绝对时段: floorMark(-1),
        自动生产绝对时段: floorMark(-1),
        预产通知文案: z.string().prefault(''),
        预产通知已读: bool(),
        产前看望: bool(),
        陪产已选择: bool(),
        /** 每胎稳定票据；孩子追加与世界时间推进只认此票据，AI 文案失败不得重新结算。 */
        生产结算标识: z.string().prefault(''),
        生产叙事已完成: bool(),
        实际生产绝对时段: floorMark(-1),
        住院结束绝对时段: floorMark(-1),
        结果: z.enum(['未定', '陪产', '仅产前看望', '完全缺席']).catch('未定').prefault('未定'),
        产后看望: bool(),
        获知生产路径: z.enum(['', '陪产', '姐妹群', '私聊', '产后看望']).catch('').prefault(''),
      })
      .prefault({}),
    /** 当前阶段攻略线路：每户只保存一条活动线路，不为24条路线扩散布尔变量。完成位图低4位对应四个固定节点。 */
    _阶段线路: z
      .object({
        目标阶段: z.coerce
          .number()
          .catch(1)
          .transform(v => (isNaN(v) ? 1 : _.clamp(Math.floor(v), 1, 5)))
          .prefault(1),
        完成位图: z.coerce
          .number()
          .catch(0)
          .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 15)))
          .prefault(0),
        活跃节点: z.coerce
          .number()
          .catch(0)
          .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 4)))
          .prefault(0),
        节点起始楼: floorMark(-1),
        /** 当前地点节点的周历预约投影；只由阶段线路脚本写入，AI 不参与。 */
        预约星期: z.string().prefault(''),
        预约时段: z.string().prefault(''),
        预约地点: z.string().prefault(''),
        /** 首次开放的绝对时段；错过后每 42 时段在同一星期/时段重新开放。 */
        预约绝对时段: floorMark(-1),
        /** 私密任务可把丈夫状态一并冻结到预约窗口，防止同场穿帮。 */
        预约丈夫状态: z.enum(['', '外出', '在家', '睡眠']).catch('').prefault(''),
      })
      .prefault({}),
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
    // ── P3 运作道具窗口(绝对时段语义;机制不可见,AI 只看到剧情皮) ──
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
    _入住时段: nonNegInt(0),
    // ── P3 经济 ──
    _上次收租期: floorMark(-1), // 期号去重:同期只结一次(重roll/逃生舱双入口防重复入账)
    _欠租笔数: nonNegInt(0), // 天生欠租户(201)累计未收笔数;催租三选归零或转宽限
  })
  .prefault({});

export type 户节点Type = z.output<typeof 户节点>;

/** 入住事件用:从初始模板动态创建整户节点(休眠户唤醒;人设初始值 P5 在 stageConfig 覆盖) */
export function 创建户节点(入住时段: number): 户节点Type {
  const 节点 = 户节点.parse({});
  const 规范入住时段 = Math.max(0, Math.floor(入住时段));
  节点._入住时段 = 规范入住时段;
  节点.妻._成长账.上次有效成长钟楼 = 规范入住时段;
  return 节点;
}

// ============================================
// 主 Schema
// ============================================

/** 单瓷砖楼务任务：模板决定两个固定方案，存档只保留稳定事实与一次性票据。 */
const 管理任务 = z.object({
  id: z.string().prefault(''),
  模板: z.string().prefault(''),
  类型: z.enum(['公共', '报修', '投诉']).catch('公共').prefault('公共'),
  级别: z.enum(['日常', '重要', '紧急']).catch('日常').prefault('日常'),
  地点: z.string().prefault(''),
  门牌: z.string().prefault(''),
  创建时段: absolutePeriod(0),
  截止时段: absolutePeriod(0),
  逾期已扣: bool(),
  /** 风闻投诉复用楼务任务壳；普通任务保持空字符串。 */
  来源事件: z.string().prefault(''),
  /** 只允许进入投诉瓷砖与手机通知的公开事实，不包含私密攻略内容。 */
  公开摘要: z.string().prefault(''),
});

const 无效管理任务 = {
  id: '',
  模板: '',
  类型: '公共',
  级别: '日常',
  地点: '',
  门牌: '',
  创建时段: 0,
  截止时段: 0,
  逾期已扣: false,
  来源事件: '',
  公开摘要: '',
} as const;

/** 单条坏任务只丢弃自身；空 ID／模板／地点不能成为扣分且无法处理的幽灵任务。 */
const 管理任务列表 = z
  .array(管理任务.catch(无效管理任务))
  .catch([])
  .transform(items => {
    const ids = new Set<string>();
    return items.filter(item => {
      if (!item.id.trim() || !item.模板.trim() || !item.地点.trim() || ids.has(item.id)) return false;
      ids.add(item.id);
      return true;
    });
  });

/**
 * 风闻只保存脚本已经确认的公开压力与来源摘要。它不会注入普通正文，也不代表任一角色
 * 自动知道私密事实；见证与硬证据只作为事件的加速／升级标签。
 */
const 风闻事件 = z.object({
  id: z.string().prefault(''),
  类型: z.string().prefault(''),
  时段: absolutePeriod(0),
  日: nonNegInt(0),
  门牌: z.string().prefault(''),
  地点: z.string().prefault(''),
  摘要: z.string().prefault(''),
  /** 同一稳定事件已经消费的目标水位；即使风闻在100封顶，也不得降低后重领未显示部分。 */
  目标增量: nonNegInt(0),
  增量: nonNegInt(0),
  迹象: z
    .enum(['关系异样', '可疑痕迹', '单人目击', '多人目击', '硬证据', '正式投诉'])
    .catch('关系异样')
    .prefault('关系异样'),
  状态: z.enum(['活跃', '已处理', '自然平息']).catch('活跃').prefault('活跃'),
  父亲责任: z.enum(['无', '未传', '母亲已圆场', '已计责']).catch('无').prefault('无'),
  胜任责任: nonNegInt(0),
});

/** 单条坏账只丢弃自身，不能让 z.array.catch 把整本风闻账清空。 */
const 无效风闻事件 = {
  id: '',
  类型: '',
  时段: 0,
  日: 0,
  门牌: '',
  地点: '',
  摘要: '',
  目标增量: 0,
  增量: 0,
  迹象: '关系异样',
  状态: '自然平息',
  父亲责任: '无',
  胜任责任: 0,
} as const;
const 风闻事件列表 = z
  .array(风闻事件.catch(无效风闻事件))
  .catch([])
  .transform(items => {
    const 迹象序 = ['关系异样', '可疑痕迹', '单人目击', '多人目击', '正式投诉', '硬证据'] as const;
    const 状态序 = ['活跃', '自然平息', '已处理'] as const;
    const 父责序 = ['无', '未传', '母亲已圆场', '已计责'] as const;
    const 结果: (typeof items)[number][] = [];
    const 按ID = new Map<string, (typeof items)[number]>();
    for (const item of items) {
      if (!item.id.trim()) continue;
      const 已有 = 按ID.get(item.id);
      if (!已有) {
        const 副本 = { ...item };
        按ID.set(item.id, 副本);
        结果.push(副本);
        continue;
      }
      const 新强度 = 迹象序.indexOf(item.迹象);
      const 旧强度 = 迹象序.indexOf(已有.迹象);
      if (新强度 > 旧强度) {
        已有.迹象 = item.迹象;
        已有.类型 = item.类型 || 已有.类型;
        已有.门牌 = item.门牌 || 已有.门牌;
        已有.地点 = item.地点 || 已有.地点;
        已有.摘要 = item.摘要 || 已有.摘要;
      }
      已有.时段 = Math.min(已有.时段, item.时段);
      已有.日 = Math.min(已有.日, item.日);
      已有.目标增量 = Math.max(已有.目标增量, item.目标增量);
      已有.增量 = Math.max(已有.增量, item.增量);
      已有.胜任责任 = Math.max(已有.胜任责任, item.胜任责任);
      if (状态序.indexOf(item.状态) > 状态序.indexOf(已有.状态)) 已有.状态 = item.状态;
      if (父责序.indexOf(item.父亲责任) > 父责序.indexOf(已有.父亲责任)) 已有.父亲责任 = item.父亲责任;
    }
    return 结果;
  });

/** 本期已完成楼务的结构化摘要；期末报表直接读取，不从文案或任务 ID 反推。 */
const 管理任务完成摘要 = z.object({
  任务: z.string().prefault(''),
  类型: z.enum(['公共', '报修', '投诉']).catch('公共').prefault('公共'),
  级别: z.enum(['日常', '重要', '紧急']).catch('日常').prefault('日常'),
  地点: z.string().prefault(''),
  门牌: z.string().prefault(''),
  按期: bool(),
  方式: z.string().prefault(''),
});

export const 胜任责任类别们 = ['账目亏空', '楼务失职', '失联抗命', '公开丑闻', '母亲事发', '综合失职'] as const;
const 胜任记分类别们 = [...胜任责任类别们, '正向经营'] as const;
const 胜任记分条目 = z.object({
  id: z.string().prefault(''),
  考核期: nonNegInt(0),
  时段: absolutePeriod(0),
  类别: z.enum(胜任记分类别们).catch('综合失职').prefault('综合失职'),
  变动: z.coerce
    .number()
    .catch(0)
    .transform(v => (isNaN(v) ? 0 : Math.round(v)))
    .prefault(0),
  原因: z.string().prefault(''),
});

const 无效胜任记分 = { id: '', 考核期: 0, 时段: 0, 类别: '综合失职', 变动: 0, 原因: '' } as const;
const 胜任记分列表 = z
  .array(胜任记分条目.catch(无效胜任记分))
  .catch([])
  .transform(items => {
    const ids = new Set<string>();
    return items.filter(item => {
      if (!item.id.trim() || item.变动 === 0 || ids.has(item.id)) return false;
      ids.add(item.id);
      return true;
    });
  });

/** 孩子只记录生产系统已经提交的稳定事实；同一母亲同一胎次由业务层幂等追加。 */
const 家庭孩子档案 = z.object({
  id: z.string().prefault(''),
  母亲门牌: z.string().prefault(''),
  胎次: z.coerce
    .number()
    .catch(0)
    .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 3)))
    .prefault(0),
  性别: z.enum(['男', '女']).catch('女').prefault('女'),
  出生绝对时段: floorMark(-1),
  结果: z.enum(['陪产', '仅产前看望', '完全缺席']).catch('完全缺席').prefault('完全缺席'),
  玩家产后看望: bool(),
  获知生产路径: z.enum(['陪产', '姐妹群', '私聊', '产后看望']).catch('私聊').prefault('私聊'),
  叙事最小年龄: nonNegInt(0),
  年龄阶段: z.enum(['新生儿', '一岁以上', '两岁以上']).catch('新生儿').prefault('新生儿'),
  出生场次标识: z.string().prefault(''),
});

const 当前Schema = z.object({
  /** 门牌号 → 户;未入住无键(休眠),Zod record 容忍缺键(防护10-②) */
  户: z.record(z.string(), 户节点).prefault({}),

  // ── 全局机制字段(全部脚本管,AI 改动会被回滚) ──
  现金: nonNegInt(500), // 〔调参〕起始资金
  胜任度: integerStat(80), // 〔调参〕"父母的考验"记分牌,跌破红线+通牒期未救回=唯一 Game Over
  风闻: integerStat(0), // 楼内风闻度(邻里传闲话),替代修道院警戒度

  /** 玩家每日现场资源。等级与上限由训练经验派生，不另存可冲突的等级镜像。 */
  玩家资源: z
    .object({
      精力: z
        .object({
          当前值: nonNegInt(8),
          训练经验: nonNegInt(0),
          永久上限加成: nonNegInt(0),
        })
        .prefault({}),
      体力: z
        .object({
          当前值: nonNegInt(5),
          训练经验: nonNegInt(0),
          永久上限加成: nonNegInt(0),
        })
        .prefault({}),
      /** 背包中安全套被主动拆封后，保留到下一场亲密场景开始；入场时转入场景保护状态。 */
      保护准备: bool(),
      _晨跑训练日: floorMark(-1),
      /** 健身与当天首次圆满场景共享这一常规体力训练日账。 */
      _体力训练日: floorMark(-1),
      _小憩日: floorMark(-1),
      _已使用永久道具: z.array(z.string()).catch([]).prefault([]),
    })
    .prefault({}),

  /** 背包(2026-07-16 定名拍板,不叫行囊):商店购买道具+碎片信才入包,普通垃圾不入 */
  背包: z.array(z.string()).catch([]).prefault([]),

  系统: z
    .object({
      /** 当前存档契约版本；v0.80(v7) 与 v0.81/v0.82(v8) 由入口一次性迁到 v9。 */
      _数据版本: z.literal(当前MVU数据版本).prefault(当前MVU数据版本),
      _坏结局: z.string().prefault(''), // 单向锁:非空=全冻结,快照只注入终局指引
      /**
       * 普通强制剧情的等待队列。每张新票带结构化场景标记；同一时间最多一张活动票，
       * 后续票只等待到达设计地点，绝不能插入当前不相关互动或与队首混演。
       */
      _待发送事件: z.string().prefault(''),
      _场景剧情序号: nonNegInt(0),
      /**
       * 当前已经在设计地点触发的唯一场景剧情。生成失败、超时或取消时随 MVU 留在原分支，
       * 玩家只能在冻结地点重试；旧 v9 存档缺字段时由 prefault 补空，不需要抬数据版本。
       */
      _场景剧情事务: z
        .object({
          id: z.string().prefault(''),
          标题: z.string().prefault(''),
          目标场景: z.string().prefault(''),
          行动: z.string().prefault(''),
          内容: z.string().prefault(''),
          触发绝对时段: floorMark(-1),
          触发楼层: floorMark(-1),
          请求世代: nonNegInt(0),
          状态: z.string().prefault(''),
        })
        .prefault({}),
      _已注入事件: z
        .object({
          楼层: floorMark(-1),
          内容: z.string().prefault(''),
        })
        .prefault({}),
      /** `观察者门牌>孕妇门牌>受孕场次` → 首次当面评价成功楼；同楼重掷重放，后续楼才视为已消费。 */
      _孕情初见评价楼: z.record(z.string(), floorMark(-1)).catch({}).prefault({}),
      _母亲撞见次数: nonNegInt(0), // 静默暗账:母亲入列时折算初始堕落+破墙正戏差分
      /** P5 母亲入列(2026-07-19):301 到阶段2 时置真——地图头像亮起,302 从背景板转攻略对象 */
      _母亲入列: bool(),
      /** P5 母亲药物首夜第二幕:首夜正戏后置真,玩家推进到次日早上时排队早饭桌戏 */
      _母亲首夜第二幕: bool(),
      /** P5 撞见系统频控:上次母亲撞见的时段档号(同时段最多一次) */
      _上次撞见档: z.coerce.number().int().catch(-1).prefault(-1),
      _难度: z.string().prefault('标准'), // 开局三档(轻松/标准/严苛),效果查 stageConfig.难度表
      _序章完成: bool(), // 单向语义随楼层快照走(回档到0=重开序章)
      /** 一次性特殊正戏完成表：供商店防重复与阶段路线判定共用，不为每场戏增设独立布尔值。 */
      _已完成特殊场景: z.array(z.string()).catch([]).prefault([]),
      /** 特殊场景通用前置记录；使用 `场景id:门牌` 短键，避免每场每人扩散布尔字段。 */
      _特殊场景前置: z.array(z.string()).catch([]).prefault([]),
      /** 同一时间只允许一个前置演出或正式特殊场景运行。 */
      _特殊场景: z
        .object({
          id: z.string().prefault(''),
          阶段: z.string().prefault(''),
          地点: z.string().prefault(''),
          参与妻: z.array(z.string()).catch([]).prefault([]),
          演出妻: z.array(z.string()).catch([]).prefault([]),
          演出夫: z.array(z.string()).catch([]).prefault([]),
          启动楼层: floorMark(-1),
          /** 多拍特殊场景中“下一待生成正文拍”；静音会议自由循环固定保持 15。 */
          当前拍: nonNegInt(0),
          议题: z.string().prefault(''),
          重点妻: z.string().prefault(''),
          峰值模式: z.string().prefault(''),
          会后妻: z.array(z.string()).catch([]).prefault([]),
          自由循环次数: nonNegInt(0),
          交互: z
            .object({
              id: z.string().prefault(''),
              类型: z.string().prefault(''),
              状态: z.string().prefault(''),
              失败次数: nonNegInt(0),
              补偿可用: bool(),
            })
            .prefault({}),
          /** 静音会议微信旁路只向下一正文暴露低信息摘要，不把私聊原文写入正文历史。 */
          会场私聊摘要: z.record(z.string(), z.string()).catch({}).prefault({}),
          会场私聊摘要楼层: floorMark(-1),
        })
        .prefault({}),
      /** 夏乔家庭计划：五日筹备、微信已读与一次性赴约共用的硬生命周期。 */
      _家庭计划: z
        .object({
          阶段: z
            .enum([
              '未开始',
              '待安装',
              '待投资料',
              '待观察资料',
              '待写磁贴',
              '待送磁贴',
              '待确认人选',
              '待微信',
              '待赴约',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          最早继续日: floorMark(-1),
          完成楼层: floorMark(-1),
        })
        .prefault({}),
      /** 生产完成后追加的家庭文档；不覆盖旧孩子，也不按世界钟逐时段成长。 */
      _家庭文档: z
        .object({
          孩子: z.array(家庭孩子档案).catch([]).prefault([]),
        })
        .prefault({}),
      // 摄像头布设名单(2026-07-17 从 chat 变量迁入:与背包同一本账,重掷/撤回删楼时消耗与布设同生共死,
      // 否则"背包里的摄像头随楼层复活+chat 侧已装记录还在"=一次购买无限装)
      _摄像头布设: z.record(z.string(), bool()).catch({}).prefault({}),
      /**
       * 唯一持久世界时钟：0=第1天早上，每 +1 推进一个六时段档。消息楼只负责正文
       * 时间线、回档和重掷，严禁参与日期、作息、冷却或随机种子的计算。
       */
      _绝对时段: absolutePeriod(0),
      /**
       * 提示负担节拍：完整提示只在场景／焦点／边界变化时即时刷新，其余成功正文按
       * “完整→最小→最小→完整”循环。只在成功提交点推进，取消、失败和重掷不计数。
       */
      _提示刷新态: z
        .object({
          版本: z.literal(1).catch(1).prefault(1),
          场景签名: z.string().prefault(''),
          焦点签名: z.string().prefault(''),
          角色签名: z.string().prefault(''),
          距完整楼数: z.coerce
            .number()
            .catch(2)
            .transform(v => (isNaN(v) ? 2 : _.clamp(Math.floor(v), 0, 2)))
            .prefault(2),
        })
        .prefault({}),
      /** 当前亲密场景只由脚本维护；空闲时仍保留完整默认结构以支持刷新与回档。 */
      _性爱场景: z
        .object({
          状态: z.enum(['空闲', '进行中', '收尾中']).catch('空闲').prefault('空闲'),
          场次标识: z.string().prefault(''),
          开始楼层: floorMark(-1),
          有效楼数: nonNegInt(0),
          /** 开场时按体力等级与剩余比例冻结；每名参与者只在首次实际参与楼领取一次。 */
          本场等级加成: z.coerce
            .number()
            .catch(0)
            .transform(v => (isNaN(v) ? 0 : _.clamp(Math.round(v), 0, 2)))
            .prefault(0),
          当前接触部位: z.enum(['无', '嘴', '胸部', '小屄', '屁穴', '其他']).catch('无').prefault('无'),
          当前行为: z
            .enum(['无插入', '口交', '乳交', '阴道插入', '肛门插入', '玩具', '其他'])
            .catch('无插入')
            .prefault('无插入'),
          保护状态: z.enum(['未使用', '安全套', '其他']).catch('未使用').prefault('未使用'),
          待收尾位置: z.string().prefault(''),
          /** 多人亲密场景当前优先结算的角色；空字符串表示由脚本选择首名未完成参与者。 */
          主焦点门牌: z.string().prefault(''),
          参与者: z
            .record(
              z.string(),
              z.object({
                满意度: nonNegInt(0),
                满意目标: nonNegInt(3),
                偏好命中: z.array(z.string()).catch([]).prefault([]),
                等级加成已用: bool(),
                /** 本人真实参与的楼数；旧档缺失时由全场历史楼数保守补齐。 */
                有效楼数: z.number().int().nonnegative().optional(),
                /** 多人场景中可独立退出；旧档缺失视为仍在场。 */
                已退出: z.boolean().optional(),
                退出方式: z.enum(['角色中止']).optional(),
              }),
            )
            .catch({})
            .prefault({}),
        })
        .prefault({}),
      _上次性爱结果: z
        .object({
          场次标识: z.string().prefault(''),
          结束方式: z.string().prefault(''),
          最终位置: z.string().prefault(''),
          /** 多人场景冻结收尾时的主焦点；受孕判定只认这一名明确对象。 */
          收尾对象门牌: z.string().prefault(''),
          保护状态: z.string().prefault(''),
          当前行为: z.string().prefault(''),
          有效楼数: nonNegInt(0),
          参与者: z
            .record(
              z.string(),
              z.object({
                满意度: nonNegInt(0),
                满意目标: nonNegInt(0),
                偏好命中: z.array(z.string()).catch([]).prefault([]),
                /** 参与者自己的实际楼数，不能用全场时长覆盖中途加入／退出者。 */
                有效楼数: z.number().int().nonnegative().optional(),
                /** 允许多人场景中某一角色先行退出，最终仍保留她的独立结论。 */
                结束方式: z.string().optional(),
                时长评价: z.enum(['太短', '合适', '过久', '失控']).catch('太短').prefault('太短'),
                结局态度: z.string().prefault(''),
              }),
            )
            .catch({})
            .prefault({}),
        })
        .prefault({}),
      // ── P3 经济与考验(货币只走脚本结算,AI 不碰钱) ──
      _上次上交期: floorMark(-1), // 上交日期号去重
      _通牒期: floorMark(-1), // 最后通牒发出的期号(-1=无);下一期仍不达标=坏结局
      /** 本期经营账与极简楼务任务；全部进入 MVU，撤回、重掷和读档共用同一真值。 */
      _管理考核: z
        .object({
          上次生成期: floorMark(-1),
          活跃任务: 管理任务列表.prefault([]),
          完成票据: z.array(z.string()).catch([]).prefault([]),
          本期完成摘要: z
            .array(
              管理任务完成摘要.catch({
                任务: '',
                类型: '公共',
                级别: '日常',
                地点: '',
                门牌: '',
                按期: false,
                方式: '',
              }),
            )
            .catch([])
            .transform(items => items.filter(item => item.任务.trim() && item.地点.trim()))
            .prefault([]),
          类型冷却: z.record(z.string(), floorMark(-1)).catch({}).prefault({}),
          本期新增应收: nonNegInt(0),
          本期实收: nonNegInt(0),
          本期应上交: nonNegInt(0),
          本期实际上交: nonNegInt(0),
          本期正向: nonNegInt(0),
          /** 所有真实胜任变化的唯一持久账；保留通牒期与最终期以计算真实失败主因。 */
          记分条目: 胜任记分列表.prefault([]),
          /** 粉刷使用期 +3；当前考核期达到此值才可再次使用。 */
          粉刷冷却至期: floorMark(-1),
          通牒主因: z
            .enum(['', ...胜任责任类别们])
            .catch('')
            .prefault(''),
          通牒原因: z.string().prefault(''),
          /** 同一危险轮次只允许母亲介入一次；回到不满或更好并完成一次考核后重置。 */
          母亲圆场: z
            .object({
              危险轮次起期: floorMark(-1),
              上次使用期: floorMark(-1),
              事件ID: z.string().prefault(''),
            })
            .prefault({}),
        })
        .prefault({}),
      /** 单一全局风闻的事件账、去重票据、阈值锁和楼务投诉桥。 */
      _风闻账: z
        .object({
          上次日结日: floorMark(-1),
          最后新增日: floorMark(-1),
          聚餐冷却至: floorMark(-1),
          /** 当前绝对时段攻略基础风闻的独立额度账，不依赖会裁剪的最近事件。 */
          攻略计数时段: floorMark(-1),
          攻略计数: nonNegInt(0),
          投诉跨线锁: bool(),
          危机跨线锁: bool(),
          当前投诉事件: z.string().prefault(''),
          待转投诉事件: z.string().prefault(''),
          危机活跃: bool(),
          去重票据: z.array(z.string()).catch([]).prefault([]),
          最近事件: 风闻事件列表.prefault([]),
        })
        .prefault({})
        .transform(账 => {
          账.去重票据 = [...new Set(账.去重票据.filter(id => id.trim()))];
          const 活跃责任 = 账.最近事件.filter(event => event.状态 === '活跃' && event.胜任责任 > 0);
          const 当前仍有效 = 活跃责任.some(event => event.id === 账.当前投诉事件);
          if (!当前仍有效) 账.当前投诉事件 = 活跃责任[0]?.id ?? '';
          const 排队候选 = 活跃责任.find(event => event.id !== 账.当前投诉事件)?.id ?? '';
          if (!账.待转投诉事件 || !活跃责任.some(event => event.id === 账.待转投诉事件)) {
            账.待转投诉事件 = 排队候选;
          }
          if (账.待转投诉事件 === 账.当前投诉事件) 账.待转投诉事件 = 排队候选;
          const 活跃危机 = 活跃责任.some(event => event.胜任责任 >= 8);
          账.危机活跃 = 活跃危机;
          if (!活跃危机) 账.危机跨线锁 = false;
          return 账;
        }),
      // ── 荣耀洞(2026-07-19 用户点单):三拍连场戏,状态随楼层快照走=回档/重roll自洽 ──
      _荣耀洞上次时段: floorMark(-999), // 绝对时段水位；业务层按一天=6时段判冷却
      _荣耀洞门牌: z.string().prefault(''), // ''=未进行;'空'=空军单拍;门牌=对面是她
      _荣耀洞拍: z.coerce.number().int().catch(-1).prefault(-1), // -1=未进行;0/1/2=三拍进行位
      _荣耀洞起时段: floorMark(-1), // 回档自净:起始时段晚于当前世界时钟时作废
      _荣耀洞点破: bool(), // 她阶段够高=可亮明身份+专属CG
      _荣耀洞夫: bool(), // 复合事件:丈夫恰好在隔间外(铁律不知真相)
      _荣耀洞动态门牌: z.string().prefault(''), // 真人完整服务后留给朋友圈事件钩子
      _荣耀洞动态时段: floorMark(-1), // 绝对时段去重；中途离场/空军不写
      /** 待接来电：周度例行联络或真实问责／危机生成；持续未接只在下一次真实联络周期记责。 */
      _待接来电: z
        .object({
          期: floorMark(-1), // -1=无来电
          分数段: z.string().prefault(''),
          报表: z.string().prefault(''),
          通牒: bool(),
          紧急: bool(),
          母亲圆场: z
            .object({
              触发: bool(),
              事件ID: z.string().prefault(''),
              摘要: z.string().prefault(''),
              仅剧情: bool(),
            })
            .prefault({}),
        })
        .prefault({}),
      /**
       * 已接起但尚未完成收尾的父亲通话。与 `_待接来电` 分账，接听时在同一次 MVU
       * 写入中原子转移；通话记录与待回复令牌随楼层快照走，刷新/回档都能恢复。
       */
      _父亲通话: z
        .object({
          标识: z.string().prefault(''),
          状态: z.string().prefault(''), // ''=空闲；通话中；收尾中
          期: floorMark(-1),
          分数段: z.string().prefault(''),
          报表: z.string().prefault(''),
          通牒: bool(),
          紧急: bool(),
          母亲圆场: z
            .object({
              触发: bool(),
              事件ID: z.string().prefault(''),
              摘要: z.string().prefault(''),
              仅剧情: bool(),
            })
            .prefault({}),
          主题: z.string().prefault(''),
          记录: z
            .array(
              z.object({
                谁: z.enum(['我', '父']).catch('父'),
                文: z.string().prefault(''),
              }),
            )
            .catch([])
            .prefault([]),
          待回复: z
            .object({
              序号: nonNegInt(0), // 0=没有待生成回复
              玩家说: z.string().prefault(''),
            })
            .prefault({}),
          下次回复序号: nonNegInt(1),
          挂断楼层: floorMark(-1),
        })
        .prefault({}),
    })
    .prefault({}),
});

export const Schema = z.preprocess(迁移显式MVU版本, 当前Schema);

export type SchemaType = z.output<typeof Schema>;
