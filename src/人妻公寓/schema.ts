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

/** 当前版本接受数据版本 7、8、9；角色卡小版本升级不改变这道持久数据门。 */
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
      `当前版本仅兼容数据版本 7、8 和 9：当前存档版本为 ${显示版本}。受支持的旧存档可直接继承；其他数据版本请新建聊天开始游戏。`,
    );
  }
}

/**
 * rq0.80-rq0.86 发布初始值共同拥有的稳定持久契约。
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
// 只取 rq0.80-rq0.86 从一开始就存在的交集；缺失任一叶都不能交给 Schema 默认重建。
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
  return (
    (Number.isFinite(位图) && (Math.floor(位图) & (1 << 节点)) !== 0) ||
    (Number.isFinite(活跃节点) && Math.floor(活跃节点) > 节点)
  );
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

const 旧许曼君分居阶段 = new Set([
  '未开始', '待A1', '待A1封套动作', '待A1通知动作', '待A2', '待A3取袋', '待A3大堂', '待A3进入201',
  '待A3工资卡动作', 'A3进行中', '待第一次接钥匙', '待第一次离楼', '待第一次封存', '待A4独住对话',
  '待独住离场动作', '待独住夜完成', '待收起出车表', '待亲密邀请', '亲密进行中', 'A4事后进行中',
  '待A4事后重答', '待A5取袋', '待A5大堂', '待A5进入201', '待A5取物动作', 'A5进行中',
  '待第二次接钥匙', '待第二次离楼', '待第二次封存', '待A6', 'A6进行中', '待交接状态', '待最终离楼', '已完成',
]);

function 旧路线布尔(value: unknown): boolean {
  return value === true || value === 1 || value === 'true' || value === '1';
}

function 旧路线时段(value: unknown, fallback = -1): number {
  const result = Number(value);
  return Number.isFinite(result) ? Math.round(result) : fallback;
}

function 完整世界日后最早时段(绝对时段: number, 完整日数: number): number {
  const 每天时段数 = 6;
  return Math.floor(Math.max(0, 绝对时段) / 每天时段数) * 每天时段数 + (完整日数 + 1) * 每天时段数;
}

/**
 * 把2026-09-03封板前的33阶段《分居》草稿收敛到四幕检查点。草稿从未作为正式外部版本发布，
 * 但本地试玩档仍可能保存其中任一断点；迁移只消费已成立硬事实，不重放已经归还的工资卡、
 * 已知关系、真实外住、共同夜晚或双方同意办理。旧通知、封存袋与旧剧情票不再是新路线凭据。
 */
function 迁移许曼君分居四幕(input: unknown): unknown {
  if (!是记录(input) || !是记录(input.系统) || !是记录(input.系统._许曼君分居)) return input;
  const 旧路线 = input.系统._许曼君分居;
  if (Number(旧路线.方案版本) === 2) return input;
  const 旧阶段 = String(旧路线.阶段 ?? '未开始');
  if (!旧许曼君分居阶段.has(旧阶段)) return input;

  const 副本 = _.cloneDeep(input) as 原始记录;
  const 系统 = 副本.系统 as 原始记录;
  const 路线 = 系统._许曼君分居 as 原始记录;
  const 当前绝对时段 = Math.max(0, Math.floor(Number(系统._绝对时段) || 0));
  const 已完成表 = Array.isArray(系统._已完成特殊场景) ? 系统._已完成特殊场景.map(String) : [];
  const 已完成 = 旧阶段 === '已完成' || 已完成表.includes('许曼君分居') || 已完成表.includes('分居');
  const 工资卡已归还 = 路线.工资卡状态 === '已归还赵国强';
  const 丈夫已知 = 旧路线布尔(路线.丈夫已知玩家关系);
  const 丈夫已选择外住 = 旧路线布尔(路线.丈夫已选择外住);
  const 已有一次封存 =
    旧路线时段(路线.封条修订, 0) >= 1 ||
    路线.钥匙位置 === '管理员室201钥匙格' ||
    路线.封存袋位置 === '管理员室入柜';
  const 独住夜已完成 =
    旧路线布尔(路线.独住夜已验证) ||
    旧路线布尔(路线.出车表已收起) ||
    ['待亲密邀请', '亲密进行中', 'A4事后进行中', '待A4事后重答', '待A5取袋', '待A5大堂',
      '待A5进入201', '待A5取物动作', 'A5进行中', '待第二次接钥匙', '待第二次离楼', '待第二次封存',
      '待A6', 'A6进行中', '待交接状态', '待最终离楼', '已完成'].includes(旧阶段);
  const 生活用品已取完 =
    旧路线布尔(路线.第二批用品已取) ||
    ['待第二次接钥匙', '待第二次离楼', '待第二次封存', '待A6', 'A6进行中', '待交接状态', '待最终离楼', '已完成'].includes(旧阶段);
  const 修复已提出 = 旧路线布尔(路线.修复已提出) || 生活用品已取完;
  const 旧妻拒绝 = 旧路线布尔(路线.许曼君已拒绝修复);
  const 旧玩家已承担 = 旧路线布尔(路线.玩家事后承担);
  const 双方已同意 =
    旧路线布尔(路线.双方同意进入办理) || ['待交接状态', '待最终离楼', '已完成'].includes(旧阶段);
  const 拒绝决定已成立 =
    旧妻拒绝 &&
    (生活用品已取完 || 修复已提出 || ['待A6', 'A6进行中', '待交接状态', '待最终离楼', '已完成'].includes(旧阶段));
  const 共同夜晚已完成 = 旧路线布尔(路线.留宿201权限) || 路线.绑定亲密完整结果 === '完整';
  const 旧亲密进行中 = 路线.绑定亲密完整结果 === '进行中' || 旧阶段 === '亲密进行中';
  const 旧绑定场次 = String(路线.绑定亲密场次标识 ?? '').trim();
  const 当前性爱 = 是记录(系统._性爱场景) ? 系统._性爱场景 : undefined;
  const 当前参与者 = 当前性爱 && 是记录(当前性爱.参与者) ? 当前性爱.参与者 : undefined;
  const 当前201参与 = 当前参与者 && 是记录(当前参与者['201']) ? 当前参与者['201'] : undefined;
  const 当前场次标识 = 当前性爱 ? String(当前性爱.场次标识 ?? '').trim() : '';
  const 旧亲密可续 = Boolean(
    旧亲密进行中 &&
      旧绑定场次 &&
      当前性爱 &&
      String(当前性爱.状态 ?? '') !== '空闲' &&
      当前场次标识 === 旧绑定场次 &&
      String(当前性爱.主焦点门牌 ?? '') === '201' &&
      当前参与者 &&
      Object.keys(当前参与者).length === 1 &&
      当前201参与 &&
      !旧路线布尔(当前201参与.已退出),
  );
  const 已进入外住事实 = 已有一次封存 || 丈夫已选择外住 || 已完成 || 双方已同意;
  const 外住起点 = 已进入外住事实 ? Math.max(0, 旧路线时段(路线.外住起点, 当前绝对时段)) : -1;

  let 新阶段 = '待初谈';
  if (旧阶段 === '未开始') 新阶段 = '未开始';
  else if (已完成) 新阶段 = '已完成';
  else if (双方已同意) 新阶段 = '待钥匙转交接';
  else if (['待A6', 'A6进行中'].includes(旧阶段)) 新阶段 = 旧妻拒绝 ? '待管理员室交接' : '待私下决定';
  else if (生活用品已取完 || 修复已提出 || ['待第二次接钥匙', '待第二次离楼', '待第二次封存'].includes(旧阶段)) {
    新阶段 = '等待私下决定';
  } else if (已有一次封存 && 独住夜已完成) {
    新阶段 = 旧路线布尔(路线.出车表已收起) ? '待最终取物' : '待独住后谈话';
  } else if (已有一次封存) {
    新阶段 = '独住观察中';
  } else if (丈夫已选择外住 || ['待第一次接钥匙', '待第一次离楼', '待第一次封存'].includes(旧阶段)) {
    新阶段 = '待登记外住';
  } else if (旧阶段 !== '待A1') {
    新阶段 = '待三人摊牌';
  }

  let 当前场景 = '';
  let 当前拍 = 0;
  if (拒绝决定已成立 && !双方已同意) {
    if (旧玩家已承担) {
      新阶段 = '待管理员室交接';
    } else {
      // 旧妻子的决定已经成立，只恢复第四幕第二拍让玩家回答两人的以后，不能重演她的拒绝。
      新阶段 = '待私下决定';
      当前场景 = '第四幕私下决定';
      当前拍 = 1;
    }
  }

  const 原预约时段 = 旧路线时段(路线.预约时段);
  const 保留预约 =
    (新阶段 === '待三人摊牌' && String(路线.预约用途).includes('三人')) ||
    (新阶段 === '待最终取物' && String(路线.预约用途).includes('取物')) ||
    (新阶段 === '待管理员室交接' && String(路线.预约用途).includes('最终'));
  const 钥匙用途 = 已完成 || 双方已同意 || 路线.钥匙用途 === '待离婚交接'
    ? '待离婚交接'
    : 已有一次封存
      ? '临时外住'
      : '普通住户';
  const 共同夜晚状态 = 共同夜晚已完成
    ? '已完成'
    : 旧亲密可续
      ? '进行中'
      : 独住夜已完成
        ? '待接受'
        : '未邀请';
  const 私下决定最早时段 = 新阶段 === '等待私下决定'
    ? Math.max(旧路线时段(路线.最早继续时段), 完整世界日后最早时段(当前绝对时段, 1))
    : 新阶段 === '待私下决定'
      ? 当前绝对时段
      : -1;

  系统._许曼君分居 = {
    方案版本: 2,
    阶段: 新阶段,
    当前场景,
    当前拍,
    最早继续时段: 私下决定最早时段,
    初谈参与方式: 旧路线布尔(路线.玩家已当面承担) ? '当面在场' : '未决定',
    工资卡状态: 工资卡已归还 ? '已归还赵国强' : '仍由许曼君保管',
    钥匙位置: 已有一次封存 || 已完成 || 双方已同意 ? '管理员室201钥匙格' : '赵国强持有',
    钥匙用途,
    封条修订: 已有一次封存 || 已完成 || 双方已同意 ? Math.max(1, 旧路线时段(路线.封条修订, 1)) : 0,
    封条完整: 已有一次封存 || 已完成 || 双方已同意,
    预约时段: 保留预约 && 原预约时段 >= 当前绝对时段 ? 原预约时段 : -1,
    预约截止时段: 保留预约 && 原预约时段 >= 当前绝对时段 ? 原预约时段 : -1,
    预约用途: 保留预约
      ? 新阶段预约用途(新阶段)
      : '',
    预约状态: 保留预约 && 原预约时段 >= 当前绝对时段 ? '待到期' : '无',
    丈夫已知玩家关系: 丈夫已知,
    丈夫已选择外住,
    外住起点,
    独住夜起点: 旧路线时段(路线.独住夜起点),
    独住夜已完成,
    独住环境已确认: 旧路线布尔(路线.出车表已收起),
    出车表已收起: 旧路线布尔(路线.出车表已收起),
    共同夜晚状态,
    共同夜晚最早时段: 独住夜已完成 ? 当前绝对时段 : -1,
    绑定亲密场次标识: 旧亲密可续 ? 当前场次标识 : '',
    绑定亲密完整结果: 共同夜晚已完成 ? '完整' : 旧亲密可续 ? '进行中' : 旧亲密进行中 ? '未完整' : '未开始',
    留宿201权限: 共同夜晚已完成,
    取物完成时段: 生活用品已取完 ? Math.max(0, 旧路线时段(路线.第二次离楼时段, 当前绝对时段)) : -1,
    生活用品已取完,
    修复已提出,
    私下决定最早时段,
    许曼君已拒绝恢复共同生活: 拒绝决定已成立 || 双方已同意,
    玩家最终关系选择: 旧玩家已承担 ? '继续关系' : '未决定',
    双方同意进入办理: 双方已同意,
    完成楼层: 旧路线时段(路线.完成楼层),
  };

  if (Array.isArray(副本.背包)) {
    副本.背包 = 副本.背包.filter(item => !['许曼君署名的会面通知', '201临时钥匙封存袋'].includes(String(item)));
  }
  if (typeof 系统._待发送事件 === 'string') {
    系统._待发送事件 = 系统._待发送事件
      .split('|')
      .map(item => item.trim())
      .filter(item => item && !/【许曼君分居提交:(?:A1|A3|A4独住|A4开场|A4事后|A5|A6):\d+】/u.test(item))
      .join('|');
  }
  if (是记录(系统._场景剧情事务) && /【许曼君分居提交:(?:A1|A3|A4独住|A4开场|A4事后|A5|A6):\d+】/u.test(String(系统._场景剧情事务.内容 ?? ''))) {
    系统._场景剧情事务 = {};
  }
  if (是记录(系统._已注入事件) && /【许曼君分居提交:(?:A1|A3|A4独住|A4开场|A4事后|A5|A6):\d+】/u.test(String(系统._已注入事件.内容 ?? ''))) {
    系统._已注入事件 = {};
  }

  const 户表 = 是记录(副本.户) ? 副本.户 : undefined;
  const 户201 = 户表 && 是记录(户表['201']) ? 户表['201'] : undefined;
  const 夫 = 户201 && 是记录(户201.夫) ? 户201.夫 : undefined;
  if (夫) {
    if (钥匙用途 === '待离婚交接') 夫._居住模式 = '待离婚交接';
    else if (已有一次封存) 夫._居住模式 = '路线外住';
    else 夫._居住模式 = '普通作息';
    夫._预约回楼起 = -1;
    夫._预约回楼至 = -1;
  }
  return 副本;
}

function 新阶段预约用途(阶段: string): string {
  if (阶段 === '待三人摊牌') return '201三人摊牌';
  if (阶段 === '待最终取物') return '赵国强回201取物并提出修复';
  if (阶段 === '待管理员室交接') return '管理员室离婚前钥匙交接';
  return '';
}

function 迁移显式MVU版本(input: unknown): unknown {
  const 已迁移 =
    是记录(input) && 是记录(input.系统) && Object.prototype.hasOwnProperty.call(input.系统, '_数据版本')
      ? 迁移MVU存档到当前版本(input)
      : input;
  const 已补生产 = 补全生产旧档(已迁移);
  const 已迁移分居 = 迁移许曼君分居四幕(已补生产);
  if (!是记录(已迁移分居) || !是记录(已迁移分居.系统) || !是记录(已迁移分居.系统._母亲视频通话终幕)) {
    return 已迁移分居;
  }
  const 视频 = 已迁移分居.系统._母亲视频通话终幕;
  const 旧最终交接字段 = ['最终', '托', '付已出现'].join('');
  if (!Object.prototype.hasOwnProperty.call(视频, 旧最终交接字段)) return 已迁移分居;
  const 副本 = _.cloneDeep(已迁移分居) as 原始记录;
  const 视频副本 = ((副本.系统 as 原始记录)._母亲视频通话终幕 ?? {}) as 原始记录;
  if (!Object.prototype.hasOwnProperty.call(视频副本, '最终交接已出现')) {
    视频副本.最终交接已出现 = 视频副本[旧最终交接字段] === true;
  }
  delete 视频副本[旧最终交接字段];
  return 副本;
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
        状态: z.enum(['无', '孕期', '待产通知', '待产', '陪产中', '住院中', '已出院']).catch('无').prefault('无'),
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
    /** 角色个人衣柜，仅存已赠服饰 ID；脚本维护，不进入 AI 变量视图。 */
    _衣柜: z.array(z.string()).prefault([]),
    _要钱次数: nonNegInt(0), // P3:L3 要钱按钮累计(≥2 触发"向丈夫开口"疑心+)
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
    /** 剧情预约使用闭合起点＋右开终点，避免提前写终点后把丈夫从当前时刻一路强制外出。 */
    _剧情外出起: floorMark(-1),
    _剧情外出至: floorMark(-1),
    /** 后半程丈夫路线的统一居住真值；路线外住不得用超长 `_剧情外出至` 冒充。 */
    _居住模式: z
      .enum(['普通作息', '路线外住', '预约回楼', '提前通知', '待离婚交接', '正式退居'])
      .catch('普通作息')
      .prefault('普通作息'),
    /** 预约回楼使用闭合起点＋右开终点；只有居住模式=预约回楼时才生效。 */
    _预约回楼起: floorMark(-1),
    _预约回楼至: floorMark(-1),
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

/**
 * 正式《录像带》双承接只保存已提交的硬进度；单张 CG 是否成功渲染不进入存档。
 * 旧 `_特殊场景.id = 录像带` 与无版本五格试播均不迁入这里。
 */
const 录像带双承接房间状态 = z.object({
  状态: z.enum(['未开始', '进行中', '待复锁', '已安全中断', '已结算']).catch('未开始').prefault('未开始'),
  硬状态: z
    .enum([
      'idle',
      'locked',
      'opening-playing-locked',
      'authorized',
      'self-unlocked',
      'full-tape-playing',
      'husband-completed',
      'self-relocked',
      'visually-verified',
      'settled',
    ])
    .catch('idle')
    .prefault('idle'),
  平板序号: z.coerce
    .number()
    .catch(0)
    .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 10)))
    .prefault(0),
  外层序号: z.coerce
    .number()
    .catch(0)
    .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 9)))
    .prefault(0),
  已提交键: z.array(z.string()).catch([]).prefault([]),
  中断原因: z.string().prefault(''),
  最近提交键: z.string().prefault(''),
});

/**
 * 《录像带》V4 与旧三拍/V2双轨并存但绝不互相迁移。V4只保存可审计硬账、专用摘要与
 * 操作世代；AI原文留在 `vtr:<sceneId>` 隔离线程，不能进入普通正文历史。
 */
const 录像带V4赠锁状态 = z.object({
  已接收: bool(),
  接收绝对时段: floorMark(-1),
});
const 录像带V4微信线程状态 = z.object({
  戴锁已确认: bool(),
  同意已确认: bool(),
});
const 录像带V4锁具状态 = z
  .enum([
    'idle',
    'locked',
    'self-unlocked',
    'full-tape-playing',
    'husband-completed',
    'self-relocked',
    'visually-verified',
    'settled',
  ])
  .catch('idle')
  .prefault('idle');

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
      /**
       * 《录像带》正式 v2 的两户独立轨道与强制复锁生命周期。
       * 它不复用旧特殊场景三拍状态，旧档缺失时安全补成未开始。
       */
      _录像带双承接: z
        .object({
          版本: z.literal(2).catch(2).prefault(2),
          场次标识: z.string().prefault(''),
          状态: z
            .enum(['未开始', '进行中', '待安全收束', '待双路结算', '已安全中断', '已完成'])
            .catch('未开始')
            .prefault('未开始'),
          房间: z
            .object({
              '102': 录像带双承接房间状态.prefault({}),
              '202': 录像带双承接房间状态.prefault({}),
            })
            .prefault({}),
        })
        .prefault({}),
      /**
       * 《录像带》V4：购买/赠锁/两日微信与双房共享19幕的唯一硬状态。
       * 旧 `_特殊场景.id=录像带|录像带双承接` 不会自动写入这里。
       */
      _录像带V4: z
        .object({
          版本: z.literal(4).catch(4).prefault(4),
          阶段: z
            .enum([
              '未开始',
              '待购录像带',
              '待使用录像带',
              '待购赠锁',
              '等待两日',
              '微信确认中',
              '监控就绪',
              '观看中',
              '已安全中断',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          录像带已购买: bool(),
          /** 缺失此版本号的旧实例只按实际赠锁/现场证据继承使用状态。 */
          入口规则版本: z.union([z.literal(0), z.literal(1)]).prefault(0),
          录像带已使用: bool(),
          赠锁: z
            .object({
              '102': 录像带V4赠锁状态.prefault({}),
              '202': 录像带V4赠锁状态.prefault({}),
            })
            .prefault({}),
          第二把送达绝对时段: floorMark(-1),
          微信到期绝对时段: floorMark(-1),
          微信: z
            .object({
              '102': 录像带V4微信线程状态.prefault({}),
              '202': 录像带V4微信线程状态.prefault({}),
              两户确认完成: bool(),
              联合出发已通知: bool(),
              通知线程: z.enum(['', '102', '202']).catch('').prefault(''),
              监控就绪: bool(),
            })
            .prefault({}),
          场景: z
            .object({
              场次标识: z.string().prefault(''),
              状态: z.enum(['未开始', '观看中', '已安全中断', '已完成']).catch('未开始').prefault('未开始'),
              共享幕次: z.coerce
                .number()
                .catch(0)
                .transform(v => (isNaN(v) ? 0 : _.clamp(Math.floor(v), 0, 19)))
                .prefault(0),
              当前房间: z.enum(['102', '202']).catch('102').prefault('102'),
              请求世代: nonNegInt(0),
              已提交画面键: z.array(z.string()).catch([]).prefault([]),
              已提交操作键: z.array(z.string()).catch([]).prefault([]),
              时间码秒: nonNegInt(0),
              失败次数: nonNegInt(0),
              中断原因: z.string().prefault(''),
              锁具状态: z
                .object({
                  '102': 录像带V4锁具状态,
                  '202': 录像带V4锁具状态,
                })
                .prefault({}),
            })
            .prefault({}),
          结果摘要: z.string().prefault(''),
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
      /** 周小满《不再留门》：物件权威位置与逐拍事实随同一楼层快照保存。 */
      _不再留门: z.object({
        版本: z.literal(1).prefault(1),
        实例: z.string().prefault(''),
        来源时间线: z.string().prefault(''),
        道具已使用: bool(),
        阶段: z.enum(['未开始', '开场中', '待目击', '目击中', '可拍', '持有照片', '出示中', '待交付', '待决定', '决定中', '待准备', '待开录', '开录中', '录制中', '待转存', '待封存', '封存中', '待归档', '已完成']).prefault('未开始'),
        当前场景: z.enum(['', 'A1', 'A2', 'A4', 'A5', 'A7', 'A9']).prefault(''),
        当前拍: nonNegInt(0),
        修订: nonNegInt(0),
        已提交票: z.string().prefault(''),
        开场时段: floorMark(-1),
        机会最早时段: floorMark(-1),
        可拍时段: floorMark(-1),
        目击历史: z.array(nonNegInt(0)).prefault([]),
        照片: z.object({
          id: z.string().prefault(''), 时间线: z.string().prefault(''),
          拍摄时段: floorMark(-1), 地点: z.string().prefault(''),
          人物: z.array(z.string()).prefault([]), 画面: z.string().prefault(''),
          原件位置: z.enum(['', '玩家手机']).prefault(''),
          已看过: bool(), 出示楼层: floorMark(-1),
          副本持有人: z.enum(['', '周小满']).prefault(''), 交付楼层: floorMark(-1),
        }).prefault({}),
        动机已表达: bool(), 录制提议: bool(),
        许可: z.enum(['未确认', '同意本次', '已撤回']).prefault('未确认'),
        停止默认等待: bool(), 同意时段: floorMark(-1),
        设备位置: z.enum(['无', '背包', '202']).prefault('无'),
        预约起: floorMark(-1), 预约至: floorMark(-1),
        录制次数: nonNegInt(0),
        记录: z.object({
          id: z.string().prefault(''), 场次标识: z.string().prefault(''), 来源实例: z.string().prefault(''),
          地点: z.string().prefault(''), 参与者: z.array(z.string()).prefault([]),
          开始时段: floorMark(-1), 开始楼层: floorMark(-1),
          造型: z.string().prefault(''), 许可范围: z.string().prefault(''),
          正文楼层: z.array(nonNegInt(0)).prefault([]),
          正常完成: bool(), 完成楼层: floorMark(-1),
          位置: z.enum(['无', '手机', '介质', '封盒', '已放弃']).prefault('无'),
        }).prefault({}),
        放弃记录: z.array(z.string()).prefault([]),
        母带: z.object({
          id: z.string().prefault(''), 来源记录: z.string().prefault(''),
          位置: z.enum(['无', '玩家背包', '302资料柜']).prefault('无'),
          封存楼层: floorMark(-1), 归档楼层: floorMark(-1),
        }).prefault({}),
      }).prefault({}),
      /** 沈静仪《第二机位》：门缝、监控复核、对饮空窗、真实录制与302归档共用的硬生命周期。 */
      _第二机位: z
        .object({
          阶段: z
            .enum([
              '未开始',
              '待门缝',
              '待复核',
              '待对饮',
              '待告知',
              '待购套件',
              '待赴约',
              '待开录',
              '录制中',
              '待封存',
              '待归档',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          最早继续日: floorMark(-1),
          /** 只绑定本次CAM-2真实亲密场次；普通102亲密不能误生成母带。 */
          录制场次标识: z.string().prefault(''),
          完成楼层: floorMark(-1),
        })
        .prefault({}),
      /**
       * 安若妍301承接线《不必停》：卷宗进楼、预约夜、同一普通亲密账的暂停／恢复、
       * 江辰关门接受与次晨管理员室登记共用这一份硬状态。
       */
      _安若妍不必停: z
        .object({
          版本: z.literal(1).catch(1).prefault(1),
          实例: z.string().prefault(''),
          来源时间线: z.string().prefault(''),
          阶段: z
            .enum([
              '未开始',
              '已购买',
              'A2中',
              '等待次日签收',
              '待签收卷宗',
              '待登记取件',
              '待放入书房',
              'B3中',
              '等待预约夜',
              '待核对卷宗',
              'C1核对中',
              '待设置门锁',
              'C1门锁中',
              '待H1开场',
              'H1开场中',
              '亲密前半',
              'H6中',
              'H7中',
              '待H7决定',
              'H8中',
              '亲密后半',
              '待H12收尾',
              '待H13余韵',
              'H13中',
              '待客厅',
              '客厅中',
              '待最终登记',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          当前场景: z
            .enum(['', 'A2', 'B3放卷宗', 'C1核对卷宗', 'C1门没有锁', 'H1开场', 'H6前门打开', 'H7门边看清', 'H8关门', 'H13余韵', 'D1客厅'])
            .catch('')
            .prefault(''),
          当前拍: nonNegInt(0),
          道具已购买: bool(),
          道具已使用: bool(),
          起始绝对时段: floorMark(-1),
          回程通知绝对时段: floorMark(-1),
          预约夜绝对时段: floorMark(-1),
          最早继续时段: floorMark(-1),
          重试最早时段: floorMark(-1),
          卷宗状态: z.enum(['未签收', '玩家背包', '已登记', '301书房', '江辰带走']).catch('未签收').prefault('未签收'),
          取件登记已完成: bool(),
          书房放置绝对时段: floorMark(-1),
          卷宗已核对: bool(),
          前门未反锁: bool(),
          卧室门半开: bool(),
          绑定亲密场次标识: z.string().prefault(''),
          前半有效楼数: nonNegInt(0),
          后半有效楼数: nonNegInt(0),
          已登记亲密楼层: z.array(nonNegInt(0)).catch([]).prefault([]),
          H5高尺度已确认: bool(),
          H6完成: bool(),
          H7看清: bool(),
          H7选择: z.enum(['未选择', '继续', '暂缓']).catch('未选择').prefault('未选择'),
          H8完成: bool(),
          江辰已明确看见: bool(),
          江辰已行动接受: bool(),
          隔墙CG已播放: bool(),
          普通收尾已完成: bool(),
          亲密结果场次标识: z.string().prefault(''),
          H13完成: bool(),
          客厅第一拍完成: bool(),
          江辰已接受互不干涉: bool(),
          对外夫妻身份保留: bool(),
          提前通知已约定: bool(),
          最终登记最早时段: floorMark(-1),
          暂停原因: z.string().prefault(''),
          CG回忆: z.array(z.string()).catch([]).prefault([]),
          完成楼层: floorMark(-1),
        })
        .prefault({}),
      /** 301《换掉》：只在玩家换照时签发结局；照片与可重试副作用分开保存。 */
      _安若妍换掉: z
        .object({
          版本: z.literal(1).catch(1).prefault(1),
          实例: z.string().prefault(''),
          来源时间线: z.string().prefault(''),
          轮次: nonNegInt(0),
          阶段: z.enum([
            '未开始', '已购买', '固定剧情中', '待购买拍立得', '等待试机日', '待预约', '待登记',
            '等待预约夜', '待递相机', '待开场', '前半', '待P1', '中段', '待P2', '后半',
            '待收尾', '待显影', '待回客厅', '待询问', '待换照', '已完成',
          ]).catch('未开始').prefault('未开始'),
          当前场景: z.enum(['', 'A1', 'B1', 'B2', 'C1', 'C2', 'H1', 'P1', 'P2', 'H10', 'H11', 'H12']).catch('').prefault(''),
          当前票: z.string().prefault(''),
          道具已使用: bool(),
          拍立得状态: z.enum(['未购买', '背包', '已交付']).catch('未购买').prefault('未购买'),
          购买绝对时段: floorMark(-1),
          登记绝对时段: floorMark(-1),
          预约夜绝对时段: floorMark(-1),
          江辰已到场: bool(),
          江辰已持相机: bool(),
          绑定亲密场次标识: z.string().prefault(''),
          已登记亲密楼层: z.array(nonNegInt(0)).catch([]).prefault([]),
          P1完成: bool(),
          P2完成: bool(),
          最终照片体态: z.enum(['', '普通', '孕态']).catch('').prefault(''),
          最终照片素材ID: z.string().prefault(''),
          拍摄历史: z.array(z.object({ 场次: z.string(), 照片: z.string(), 楼层: nonNegInt(0) })).catch([]).prefault([]),
          普通收尾已完成: bool(),
          亲密结果场次标识: z.string().prefault(''),
          完成楼层: floorMark(-1),
          暂停原因: z.string().prefault(''),
          CG回忆: z.array(z.string()).catch([]).prefault([]),
        }).prefault({}),
      /** 许曼君承接线《分居》四幕版：一次钥匙封存、真实独住、可选共同夜晚与跨日离婚前交接。 */
      _许曼君分居: z
        .object({
          方案版本: z.literal(2).catch(2).prefault(2),
          阶段: z
            .enum([
              '未开始',
              '待初谈',
              '待三人摊牌',
              '待登记外住',
              '独住观察中',
              '待独住后谈话',
              '待最终取物',
              '等待私下决定',
              '待私下决定',
              '待管理员室交接',
              '待钥匙转交接',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          当前场景: z
            .enum(['', '第一幕初谈', '第二幕摊牌', '第三幕独住后', '共同夜晚开场', '第四幕取物提案', '第四幕私下决定', '第四幕管理员室交接'])
            .catch('')
            .prefault(''),
          当前拍: nonNegInt(0),
          最早继续时段: floorMark(-1),
          初谈参与方式: z.enum(['未决定', '当面在场', '先夫妻谈', '暂缓']).catch('未决定').prefault('未决定'),
          工资卡状态: z.enum(['仍由许曼君保管', '已归还赵国强']).catch('仍由许曼君保管').prefault('仍由许曼君保管'),
          钥匙位置: z.enum(['赵国强持有', '管理员室201钥匙格']).catch('赵国强持有').prefault('赵国强持有'),
          钥匙用途: z.enum(['普通住户', '临时外住', '待离婚交接', '正式退居']).catch('普通住户').prefault('普通住户'),
          封条修订: nonNegInt(0),
          封条完整: bool(),
          预约时段: floorMark(-1),
          预约截止时段: floorMark(-1),
          预约用途: z.string().prefault(''),
          预约状态: z.enum(['无', '待到期', '进行中', '已完成']).catch('无').prefault('无'),
          丈夫已知玩家关系: bool(),
          丈夫已选择外住: bool(),
          外住起点: floorMark(-1),
          独住夜起点: floorMark(-1),
          独住夜已完成: bool(),
          独住环境已确认: bool(),
          出车表已收起: bool(),
          共同夜晚状态: z.enum(['未邀请', '待接受', '进行中', '已完成', '已放弃']).catch('未邀请').prefault('未邀请'),
          共同夜晚最早时段: floorMark(-1),
          绑定亲密场次标识: z.string().prefault(''),
          绑定亲密完整结果: z.enum(['未开始', '进行中', '未完整', '完整']).catch('未开始').prefault('未开始'),
          留宿201权限: bool(),
          取物完成时段: floorMark(-1),
          生活用品已取完: bool(),
          修复已提出: bool(),
          私下决定最早时段: floorMark(-1),
          许曼君已拒绝恢复共同生活: bool(),
          玩家最终关系选择: z.enum(['未决定', '继续关系', '退出关系', '暂不承诺']).catch('未决定').prefault('未决定'),
          双方同意进入办理: bool(),
          完成楼层: floorMark(-1),
        })
        .prefault({}),
      /** 许曼君正式结局《离婚》：法律办理、旧钥匙归档、换锁、《最后一笔》与旧档完成事实共用的唯一硬状态。 */
      _许曼君离婚: z
        .object({
          版本: z.literal(1).catch(1).prefault(1),
          阶段: z
            .enum([
              '未开始',
              '已购买',
              '待办理',
              '待公开站位',
              '待归档旧钥匙',
              '待归档确认',
              '待领取新锁',
              '待换锁',
              '等待邀请',
              '待最后一笔',
              '最后一笔中',
              '待非成人收束',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          当前场景: z
            .enum(['', '预约办理', '办理等待', '办理见证', '归档确认', 'H1婚纱开门', 'H2开盒', 'H7摆目标', 'H8结果', 'H9封存', '非成人收束'])
            .catch('')
            .prefault(''),
          当前拍: nonNegInt(0),
          道具已购买: bool(),
          道具已使用: bool(),
          办理预约时段: floorMark(-1),
          法律离婚已成立: bool(),
          玩家公开站位选择: z
            .enum(['', '当着赵国强牵住她', '等赵国强离开再抱她'])
            .catch('')
            .prefault(''),
          旧钥匙状态: z
            .enum(['待离婚交接', '前住户旧钥匙归档', '旧档未记录'])
            .catch('待离婚交接')
            .prefault('待离婚交接'),
          赵国强正式退居: bool(),
          新锁芯位置: z
            .enum(['未取得', '玩家背包', '201已安装', '旧档未记录'])
            .catch('未取得')
            .prefault('未取得'),
          新钥匙位置: z
            .enum(['未取得', '玩家背包', '许曼君保管', '旧档未记录'])
            .catch('未取得')
            .prefault('未取得'),
          换锁完成: bool(),
          换锁完成时段: floorMark(-1),
          邀请状态: z
            .enum(['未建立', '等待时段', '待发送', '已送达', '旧档未记录'])
            .catch('未建立')
            .prefault('未建立'),
          邀请最早时段: floorMark(-1),
          重试最早时段: floorMark(-1),
          H阶段: z
            .enum(['未开始', 'H1', 'H2', '待H3', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H8结果待演', 'H9', '已完成'])
            .catch('未开始')
            .prefault('未开始'),
          终幕目标: z.enum(['', '红本', '婚戒', '戒印']).catch('').prefault(''),
          绑定亲密场次标识: z.string().prefault(''),
          H有效回合: z.array(nonNegInt(0)).prefault([]),
          H8状态: z.enum(['未到达', '待选择', '已停止', '已确认']).catch('未到达').prefault('未到达'),
          戒印长按失败次数: nonNegInt(0),
          封存盒位置: z
            .enum(['未购买', '背包', '201', '私密抽屉', '旧档未记录'])
            .catch('未购买')
            .prefault('未购买'),
          封存物件: z
            .enum(['', '封存的红本', '封存的婚戒', '戒印红本', '旧档未记录'])
            .catch('')
            .prefault(''),
          CG回忆: z.array(z.string()).prefault([]),
          完成分支: z.enum(['', '成人', '非成人', '旧档未记录']).catch('').prefault(''),
          完成楼层: floorMark(-1),
        })
        .prefault({}),
      /** 正式《离婚》后的独立201日常：真实入口、整日冷却、近期记忆与手机反馈收据。 */
      _许曼君离婚后日常: z
        .object({
          版本: z.literal(2).catch(2).prefault(2),
          阶段: z.enum(['空闲', '待收针']).catch('空闲').prefault('空闲'),
          当前事件ID: z.string().prefault(''),
          当前主题: z.enum(['', '给自己改衣服', '重排201', '给自己留一笔生活钱']).catch('').prefault(''),
          当前选择: z
            .enum(['', '陪她把这件事做完', '把决定留给她', '只处理201房务', '听她把边界说清'])
            .catch('')
            .prefault(''),
          当前关系: z.enum(['', '继续关系', '暂不承诺', '退出关系']).catch('').prefault(''),
          开始时段: floorMark(-1),
          开始楼层: floorMark(-1),
          累计次数: nonNegInt(0),
          最近事件ID: z.string().prefault(''),
          最近主题: z.enum(['', '给自己改衣服', '重排201', '给自己留一笔生活钱']).catch('').prefault(''),
          最近选择: z
            .enum(['', '陪她把这件事做完', '把决定留给她', '只处理201房务', '听她把边界说清'])
            .catch('')
            .prefault(''),
          最近关系: z.enum(['', '继续关系', '暂不承诺', '退出关系']).catch('').prefault(''),
          最近事件时段: floorMark(-1),
          最近事件楼层: floorMark(-1),
          下次可用时段: floorMark(-1),
          最近摘要: z.string().prefault(''),
          近期主题: z
            .array(z.enum(['给自己改衣服', '重排201', '给自己留一笔生活钱']))
            .catch([])
            .prefault([]),
          生活整备可用: bool(),
          生活整备来源事件ID: z.string().prefault(''),
          事件记录: z
            .array(
              z.object({
                id: z.string().prefault(''),
                主题: z.enum(['给自己改衣服', '重排201', '给自己留一笔生活钱']).catch('给自己改衣服').prefault('给自己改衣服'),
                选择: z
                  .enum(['陪她把这件事做完', '把决定留给她', '只处理201房务', '听她把边界说清'])
                  .catch('把决定留给她')
                  .prefault('把决定留给她'),
                关系: z.enum(['继续关系', '暂不承诺', '退出关系']).catch('暂不承诺').prefault('暂不承诺'),
                发生时段: floorMark(-1),
                发生楼层: floorMark(-1),
                摘要: z.string().prefault(''),
              }),
            )
            .catch([])
            .prefault([]),
          待反馈事件: z
            .array(
              z.object({
                事件ID: z.string().prefault(''),
                消息键: z.string().prefault(''),
                可发送时段: floorMark(-1),
                文案: z.string().prefault(''),
              }),
            )
            .catch([])
            .prefault([]),
        })
        .prefault({}),
      /** 母亲承接剧情《回国》：经营归档、父亲延迟微信、姐妹茶话会与口头回国意向共用的硬生命周期。 */
      _回国: z
        .object({
          阶段: z
            .enum([
              '未开始',
              '待使用经营归档册',
              '待父亲回信',
              '待读回国消息',
              '待收纳',
              '待存箱',
              '待看记录',
              '待姐妹茶话会',
              '姐妹茶话会进行中',
              '待旧委托',
              '待夜谈',
              '待父亲询问',
              '待母亲回复父亲',
              '待父亲准备答复',
              '待确认交接意向',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          最早继续日: floorMark(-1),
          父亲最早回信日: floorMark(-1),
          父亲最早回信时段: floorMark(-1),
          茶话会状态: z
            .enum(['未开始', '入群演绎', '逐人调侃', '交代正事', '已完成'])
            .catch('未开始')
            .prefault('未开始'),
          茶话会成员快照: z.array(z.string()).catch([]).prefault([]),
          群名反应已完成: bool(),
          已点评成员: z.array(z.string()).catch([]).prefault([]),
          已回应点评成员: z.array(z.string()).catch([]).prefault([]),
          已回应回国成员: z.array(z.string()).catch([]).prefault([]),
          母亲已坦白: bool(),
          玩家已发言: bool(),
          正事已说明: bool(),
          正事已收束: bool(),
          茶话会结构摘要: z.string().prefault(''),
          后续私聊待触发成员: z.array(z.string()).catch([]).prefault([]),
          后续私聊已触发成员: z.array(z.string()).catch([]).prefault([]),
          后续私聊最早时段: floorMark(-1),
          完成楼层: floorMark(-1),
        })
        .prefault({}),
      /** 母亲结局《双重继承》：商店场景票、公共验收、完全交权、三日早餐、机场视频与终幕后收束。 */
      _双重继承: z
        .object({
          阶段: z
            .enum([
              '未开始',
              '待使用双重继承',
              '待父亲回楼',
              '公共区域检查中',
              '待管理员室交权',
              '管理员室剧情中',
              '待领取公寓楼总钥匙',
              '等待三日早餐',
              '早餐剧情中',
              '待机场视频',
              '视频已预约',
              '待总钥匙归位',
              '已完成',
            ])
            .catch('未开始')
            .prefault('未开始'),
          已检查公共区域: z.array(z.string()).catch([]).prefault([]),
          最早父亲到楼时段: floorMark(-1),
          最早早餐日: floorMark(-1),
          最早视频时段: floorMark(-1),
          群聊余波状态: z.enum(['未建立', '待发送', '已完成']).catch('未建立').prefault('未建立'),
          群聊余波最早时段: floorMark(-1),
          父亲家常联络序号: nonNegInt(0),
          下次父亲家常联络时段: floorMark(-1),
          启动楼层: floorMark(-1),
          完成楼层: floorMark(-1),
        })
        .prefault({}),
      /** 《双重继承》后的302自由阶段：只保存共居真值、亲密开场记录与待反馈收据。 */
      _302共居: z
        .object({
          版本: z.literal(1).catch(1).prefault(1),
          状态: z.enum(['未开启', '共居']).catch('未开启').prefault('未开启'),
          开始绝对时段: floorMark(-1),
          最近事件: z.string().prefault(''),
          最近事件时段: floorMark(-1),
          里程碑: z.array(z.string()).catch([]).prefault([]),
          事件序号: nonNegInt(0),
          事件记录: z
            .array(
              z.object({
                id: z.string().prefault(''),
                类型: z.string().prefault(''),
                发生时段: floorMark(-1),
                摘要: z.string().prefault(''),
                朋友圈范围: z.enum(['公开', '仅你可见', '不发布']).catch('不发布').prefault('不发布'),
              }),
            )
            .catch([])
            .prefault([]),
          /** 只保留尚未被手机持久收据确认的反馈；不受12条近期事件裁剪影响。 */
          待反馈事件: z
            .array(
              z.object({
                id: z.string().prefault(''),
                类型: z.string().prefault(''),
                发生时段: floorMark(-1),
                摘要: z.string().prefault(''),
                朋友圈范围: z.enum(['公开', '仅你可见', '不发布']).catch('不发布').prefault('不发布'),
              }),
            )
            .catch([])
            .prefault([]),
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
          /** 普通楼务电话留空；母亲结局视频固定为“双重继承视频”。 */
          模式: z.string().prefault(''),
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
      /**
       * 《双重继承》机场微信视频终幕。30个旧生成任务最终形成53张用户候选，
       * 加复用005共54张；入场只走一次，普通微信回合只在005起的含入段循环。
       * 全字段均由脚本写入，正文模型只能读取专用最小快照，不能直接更新。
       */
      _母亲视频通话终幕: z
        .object({
          标识: z.string().prefault(''),
          状态: z
            .enum([
              '',
              '待接听',
              '通话中',
              '等待现场正文',
              '正文生成中',
              '正文失败',
              '结束衔接',
              '等待最终回答',
              '终幕中',
              '已完成',
            ])
            .catch('')
            .prefault(''),
          当前CG: z.string().prefault(''),
          微信轮次: nonNegInt(0),
          待现场正文序号: nonNegInt(0),
          现场正文请求世代: nonNegInt(0),
          已完成现场正文序号: nonNegInt(0),
          上轮现场正文: z.string().prefault(''),
          现场正文记录: z
            .array(
              z.object({
                序号: nonNegInt(0),
                CG: z.string().prefault(''),
                文: z.string().prefault(''),
              }),
            )
            .catch([])
            .prefault([]),
          现场正文失败: z.string().prefault(''),
          结束请求: bool(),
          最终交接已出现: bool(),
          玩家最终回答已保存: bool(),
          父亲已挂断: bool(),
          终幕CG序号: nonNegInt(0),
          启动楼层: floorMark(-1),
          启动绝对时段: floorMark(-1),
        })
        .prefault({}),
    })
    .prefault({}),
});

export const Schema = z.preprocess(迁移显式MVU版本, 当前Schema);

export type SchemaType = z.output<typeof Schema>;
