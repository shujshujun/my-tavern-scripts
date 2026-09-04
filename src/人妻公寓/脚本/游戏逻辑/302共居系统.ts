import type { SchemaType } from '../../schema';
import { 门牌列表, type 门牌 } from '../../stageConfig';
import { 当前时段, 妻位置推算 } from './楼层时钟';

export const 共居事件记录上限 = 12 as const;
export const 共居自由历史上限 = 24 as const;

export type 共居时间推进方式 = '推进一时段' | '睡到次日早晨';
export type 共居朋友圈范围 = '公开' | '仅你可见' | '不发布';

/**
 * 结局后的房间入口只决定开场由谁发起；第一楼成功后立即交给既有普通亲密场景。
 * 不在这里复制体力、满意度、CG五阶段、保护状态或收尾系统。
 */
export const 共居动作列表 = ['由我开始', '让她开始'] as const;
export type 共居动作ID = (typeof 共居动作列表)[number];
export const 共居亲密开场标记 = '【302结局后亲密开场】' as const;

export function 是母亲共居动作ID(值: unknown): 值 is 共居动作ID {
  return typeof 值 === 'string' && (共居动作列表 as readonly string[]).includes(值);
}

export interface 共居地点动作选项 {
  id: 共居动作ID;
  kicker: string;
  icon: string;
  文案: string;
  提示: string;
}

export interface 共居地点动作 {
  id: '和她亲密';
  kicker: string;
  icon: string;
  文案: string;
  可执行: boolean;
  原因: string;
  选项: readonly 共居地点动作选项[];
}

export interface 共居提交结果 {
  成功: boolean;
  变动: boolean;
  提示: string;
  推进方式?: 共居时间推进方式;
}

export interface 共居历史提示 {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

export interface 共居请求消息 {
  role: string;
  content?: unknown;
}

export type 共居亲密开场CG时段 = '晨间' | '夜晚';

export interface 共居亲密开场CG {
  文件: string;
  标题: string;
  时段: 共居亲密开场CG时段;
}

/** 五张302时段底图只承担稳定共居的环境氛围。 */
export type 共居背景状态 =
  | '结局前'
  | '早晨共居'
  | '中午个人生活'
  | '傍晚等人'
  | '晚饭后客厅'
  | '深夜共同休息';

function 双重继承完成事实(data: SchemaType): boolean {
  return data.系统._双重继承.阶段 === '已完成' || data.系统._已完成特殊场景.includes('双重继承');
}

function 共居账(data: SchemaType): SchemaType['系统']['_302共居'] {
  return data.系统._302共居;
}

function 清空共居账(data: SchemaType): void {
  const 账 = 共居账(data);
  账.版本 = 1;
  账.状态 = '未开启';
  账.开始绝对时段 = -1;
  账.最近事件 = '';
  账.最近事件时段 = -1;
  账.里程碑 = [];
  账.事件序号 = 0;
  账.事件记录 = [];
  账.待反馈事件 = [];
}

function 当前母亲位置(data: SchemaType): string {
  return data.户['302'] ? 妻位置推算('302', data.系统._绝对时段, data.户['302']) : '';
}

function 当前302其他妻(data: SchemaType): 门牌[] {
  return 门牌列表.filter(
    门牌号 =>
      门牌号 !== '302' &&
      Boolean(data.户[门牌号]) &&
      妻位置推算(门牌号, data.系统._绝对时段, data.户[门牌号]!) === '302',
  );
}

function 加里程碑(data: SchemaType, 里程碑: string): void {
  if (!里程碑) return;
  const 账 = 共居账(data);
  if (!账.里程碑.includes(里程碑)) 账.里程碑.push(里程碑);
  账.里程碑 = 账.里程碑.slice(-18);
}

function 记录共居事件(
  data: SchemaType,
  类型: string,
  摘要: string,
  朋友圈范围: 共居朋友圈范围,
  发生时段 = data.系统._绝对时段,
): void {
  const 账 = 共居账(data);
  const 已有 = 账.事件记录.find(
    事件 => 事件.类型 === 类型 && 事件.发生时段 === 发生时段 && 事件.摘要 === 摘要 && 事件.朋友圈范围 === 朋友圈范围,
  );
  if (已有) {
    账.最近事件 = 摘要;
    账.最近事件时段 = 发生时段;
    return;
  }
  账.事件序号 += 1;
  const 事件 = {
    id: `302共居:${账.开始绝对时段}:${账.事件序号}:${发生时段}:${类型}`,
    类型,
    发生时段,
    摘要,
    朋友圈范围,
  } satisfies SchemaType['系统']['_302共居']['事件记录'][number];
  账.事件记录.push(事件);
  账.事件记录 = 账.事件记录.slice(-共居事件记录上限);
  if (朋友圈范围 !== '不发布' && !账.待反馈事件.some(待发 => 待发.id === 事件.id)) {
    账.待反馈事件.push({ ...事件 });
  }
  账.最近事件 = 摘要;
  账.最近事件时段 = 发生时段;
}

function 清理302旧攻略冷落(data: SchemaType): boolean {
  const 妻 = data.户['302']?.妻;
  if (!妻 || 妻._冷落余波.状态 === '无') return false;
  妻._冷落余波 = {
    状态: '无',
    触发钟楼: -1,
    需安抚楼: 0,
    已安抚楼: 0,
    上次安抚正文楼: -1,
    送礼安抚日: -1,
    当日送礼安抚次数: 0,
  };
  妻._成长账.上次有效成长钟楼 = data.系统._绝对时段;
  妻._成长账.已结算冷落日 = Math.max(0, Math.floor(data.系统._绝对时段 / 6) - 1);
  return true;
}

function 开启共居(data: SchemaType): boolean {
  if (!双重继承完成事实(data)) return false;
  const 账 = 共居账(data);
  if (账.状态 === '共居') return 清理302旧攻略冷落(data);
  账.状态 = '共居';
  账.开始绝对时段 = data.系统._绝对时段;
  账.最近事件 = '母亲主动留在302，结局后的专属亲密入口已经开放。';
  账.最近事件时段 = data.系统._绝对时段;
  账.里程碑 = [];
  账.事件序号 = 0;
  账.事件记录 = [];
  账.待反馈事件 = [];
  清理302旧攻略冷落(data);
  return true;
}

/** 当前存档仍是唯一真值；未发布的旧日常试作不进入运行时兼容。 */
export function 同步302共居状态(data: SchemaType): boolean {
  const 账 = 共居账(data);
  if (!双重继承完成事实(data)) {
    if (账.状态 === '未开启' && 账.开始绝对时段 < 0 && !账.事件记录.length && !账.里程碑.length) return false;
    清空共居账(data);
    return true;
  }
  return 开启共居(data);
}

export function 母亲共居已开启(data: SchemaType): boolean {
  return 双重继承完成事实(data) && data.系统._302共居.状态 === '共居';
}

function 通用动作阻断(data: SchemaType): string {
  if (!双重继承完成事实(data)) return '《双重继承》完成后才会开放结局后的专属亲密入口。';
  if (!data.户['302']) return '302的母亲住户状态尚未建立。';
  if (!母亲共居已开启(data)) return '302共居状态尚未同步完成。';
  if (data.系统._坏结局) return '当前结局已经锁定。';
  if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) return '先结束当前特殊场景。';
  if (data.系统._性爱场景.状态 !== '空闲') return '当前已经在亲密场景中，请直接使用亲密场景界面。';
  if (data.系统._父亲通话.标识 || data.系统._父亲通话.状态) return '先完成当前电话。';
  if (data.户['302'].妻.当前阶段 < 3) return '当前关系阶段还不能进入完整亲密场景。';
  if (data.玩家资源.体力.当前值 <= 0) return '体力已经耗尽，请先休息再开始新的亲密场景。';
  if (当前母亲位置(data) !== '302') return '母亲当前不在302。';
  if (当前302其他妻(data).length) return '等302里只剩你和母亲时再开始。';
  return '';
}

export function 母亲共居地点动作(data: SchemaType, 地点: string): 共居地点动作[] {
  if (地点 !== '302' || !双重继承完成事实(data)) return [];
  const 原因 = 通用动作阻断(data);
  if (原因) return [];
  return [
    {
      id: '和她亲密',
      kicker: 'PRIVATE',
      icon: 'favor',
      文案: '和她亲密',
      可执行: true,
      原因: '',
      选项: [
        {
          id: '由我开始',
          kicker: 'YOUR LEAD',
          icon: 'favor',
          文案: '由我开始',
          提示: '先用一张等待你的开场CG建立情境，随后由现有亲密场景界面接管。',
        },
        {
          id: '让她开始',
          kicker: 'HER LEAD',
          icon: 'favor',
          文案: '让她开始',
          提示: '她先用反锁、靠近、整理衣物或等待姿态完成无接触开场，随后由现有亲密场景界面接管。',
        },
      ],
    },
  ];
}

export function 母亲共居动作阻断(data: SchemaType, 动作: 共居动作ID, 地点: string, 预期绝对时段: number): string {
  if (!是母亲共居动作ID(动作)) return '未知的302结局后亲密开场。';
  if (!Number.isInteger(预期绝对时段) || data.系统._绝对时段 !== 预期绝对时段) {
    return '世界时间已经变化，请重新打开302的亲密入口。';
  }
  if (地点 !== '302') return '这项结局奖励只能在302开始。';
  return 通用动作阻断(data);
}

export function 母亲共居行动文本(动作: 共居动作ID): string {
  return 动作 === '由我开始'
    ? `${共居亲密开场标记}【由我开始】（在302靠近母亲；让她以结局后专属的等待姿态把这一场交给玩家。本楼只完成开场CG，不替玩家决定下一步。）`
    : `${共居亲密开场标记}【让她开始】（留在302接受母亲主动发起；让她先完成反锁、靠近、整理衣物、坐到床边或明确邀请中的一个无接触动作。本楼停在双方直接接触之前，只完成主动开场CG。）`;
}

export function 母亲共居动作系统注入(data: SchemaType, 动作: 共居动作ID): string {
  const 开场纪律 =
    动作 === '由我开始'
      ? '由玩家发起。母亲明确接受并以等待、邀请或自行准备的姿态回应；她不能替玩家决定下一项具体行为，结尾必须把下一步留给玩家。'
      : '由母亲发起。她必须真正完成反锁、靠近、整理或脱下部分衣物、坐到床边、躺好或明确邀请中的一个动作，不能只说“听我的”又停下；本楼必须停在双方直接接触之前，只负责无接触开场CG，不能替玩家连续演前戏、正戏和收尾。';
  return (
    `【302结局后专属亲密开场·${动作}】《双重继承》已经完成；父亲已经离开并始终不知道真实关系，母亲主动留在302。` +
    `当前是${当前时段(data)}，本楼只负责用开场演出和开场CG把两人带入现有普通亲密场景。` +
    开场纪律 +
    '保持母亲成熟、熟悉玩家、带有照料习惯但拥有自身欲望和边界的人格；不得退回结局前的关系确认，也不得突然改成通用强势模板。' +
    '不得推进世界时间，不得生成朋友圈或微信，不得宣布满意度、体力、变量或系统状态。正文成功后脚本会直接开启既有亲密场景界面；后续体力、满意度、保护状态、CG五阶段和收尾全部由原系统处理。'
  );
}

/**
 * 专属图是首楼成功后的纯视觉演出，不是存档真值。
 * 早上、中午与下午共用日光版；傍晚、晚上与深夜共用夜景版。
 */
export function 母亲共居亲密开场CG(data: SchemaType, 动作: 共居动作ID): 共居亲密开场CG | null {
  if (!是母亲共居动作ID(动作) || !母亲共居已开启(data)) return null;
  const 世界时段 = 当前时段(data);
  const 时段: 共居亲密开场CG时段 = ['早上', '中午', '下午'].includes(世界时段) ? '晨间' : '夜晚';
  return {
    文件: `302_亲密开场_${动作}_${时段}`,
    标题: `302共居 · ${动作} · ${时段}`,
    时段,
  };
}

/**
 * 普通亲密账本已经在本楼资源结算中建立后，只登记开场来源。
 * 生成失败、取消、拒绝、错场或迟到点击不会走到这里，也不会留下半场。
 */
export function 提交302共居动作(
  data: SchemaType,
  动作: 共居动作ID,
  地点: string,
  预期绝对时段: number,
): 共居提交结果 {
  同步302共居状态(data);
  if (!是母亲共居动作ID(动作)) return { 成功: false, 变动: false, 提示: '未知的302结局后亲密开场。' };
  if (地点 !== '302' || data.系统._绝对时段 !== 预期绝对时段 || 当前母亲位置(data) !== '302') {
    return { 成功: false, 变动: false, 提示: '地点或世界时间已经变化，本次开场没有提交。' };
  }
  const 场景 = data.系统._性爱场景;
  const 参与者 = Object.keys(场景.参与者);
  if (场景.状态 !== '进行中' || 参与者.length !== 1 || 参与者[0] !== '302') {
    return { 成功: false, 变动: false, 提示: '开场正文没有建立唯一的302亲密场景，本次不提交。' };
  }
  const 类型 = 动作 === '由我开始' ? '结局后玩家发起亲密' : '结局后母亲主动亲密';
  const 摘要 =
    动作 === '由我开始'
      ? '玩家在302选择由自己开始，母亲以明确的等待姿态接住了这次亲密开场。'
      : '母亲在302主动迈出第一步，两人随即进入可继续操作的亲密场景。';
  加里程碑(data, '第一次结局后亲密开场');
  if (动作 === '让她开始') 加里程碑(data, '第一次由母亲主动开始');
  记录共居事件(data, 类型, 摘要, '不发布');
  return { 成功: true, 变动: true, 提示: '开场已经完成，继续使用亲密场景界面推进。' };
}

/** 正文与手机共用的轻量自由阶段投影；不包含旧结局逐拍或日常菜单。 */
export function 母亲共居状态提示(data: SchemaType): string {
  if (!双重继承完成事实(data)) {
    return '【当前管理阶段】父亲仍保留公寓管理审核权；母亲与玩家的关系只服从当前剧情进度。';
  }
  const 账 = 共居账(data);
  const 近期 =
    账.最近事件 && data.系统._绝对时段 - 账.最近事件时段 <= 12 ? `【近期302互动】${账.最近事件}` : '';
  return [
    '【302自由阶段】《双重继承》已完成。玩家独立管理公寓；父亲在海外，只作低频家常联系且始终不知道两人的隐秘关系。母亲主动留在302，双方关系已经稳定，不再重复攻略确认。',
    '【结局后奖励】玩家在302可以通过“和她亲密”选择由自己开始或让母亲开始；开场后立即沿用普通亲密场景的体力、满意度、保护、CG和收尾规则。已废弃的日常操作菜单不再加载。',
    近期,
  ]
    .filter(Boolean)
    .join('\n');
}

export function 母亲公开交接最早时段(data: SchemaType): number {
  if (!母亲共居已开启(data)) return Number.POSITIVE_INFINITY;
  const 开始 = data.系统._302共居.开始绝对时段;
  if (!Number.isInteger(开始) || 开始 < 0) return Number.POSITIVE_INFINITY;
  const 完成楼 = data.系统._双重继承.完成楼层;
  const 稳定种子 = Number.isInteger(完成楼) && 完成楼 >= 0 ? 完成楼 : 开始;
  return 开始 + (1 + (稳定种子 % 3)) * 6;
}

export function 母亲共居公开手机提示(data: SchemaType): string {
  if (!双重继承完成事实(data)) return '';
  return (
    '【302共居公开层】父亲已经完成公寓管理交接，玩家正式独立管理公寓；母亲以普通家庭口径继续住在302。' +
    '公开内容只能承接管理交接和社会上可解释的家庭近况，不得提及302亲密入口、开场CG、具体场次、收尾结果或真实关系，也不得让父亲知情。'
  );
}

export function 母亲共居主动私聊主题(data: SchemaType, 盐 = data.系统._绝对时段): string {
  if (!双重继承完成事实(data)) return '';
  const 结果 = data.系统._上次性爱结果;
  const 母亲结果 = 结果.参与者['302'];
  if (母亲结果) {
    if (母亲结果.结束方式 === '突然离场' || 母亲结果.结束方式 === '角色中止') {
      return '承接上一场被突然打断或由她明确中止的真实结果：她可以说明边界、失望或需要玩家当面回应，但私聊不能把问题自动写成已经解决。';
    }
    if (母亲结果.时长评价 === '太短') {
      return '承接上一场没有真正满足的结果：她可以用成熟而直接的方式提醒玩家自己还记得，不把未完成写成圆满，也不远程完成下一场。';
    }
    return '承接上一场已经完成的亲密结果：她可以提到一个只有两人懂的动作、余韵或下次想主动开始的暗示，不复述整场，也不把私密内容升级为公开事实。';
  }
  const 轮换 = [
    '她可以主动问玩家什么时候回302，并用只有两人理解的方式表达今晚想由谁开始；这只是邀请，真实场次仍须在302启动。',
    '她可以从当前衣着、房门或床边留下的一处细节切入，给玩家一个明确但私密的亲密暗示；不得虚构场次已经发生。',
    '她可以直接表达想见玩家或想由自己先开始，不再用吃饭、家务或楼务作为成人邀请的包装。',
  ];
  return 轮换[Math.abs(Math.floor(盐)) % 轮换.length];
}

export function 母亲共居玩家私聊纪律(data: SchemaType): string {
  if (!双重继承完成事实(data)) return '';
  return (
    '【302共居·玩家主动私聊】先回应玩家当前消息。私聊可以明确讨论想念、成人邀请、上次真实场次的余韵与边界；父亲始终不知情。' +
    '消息只能建立邀请或承接已经发生的结果，不能把尚未进入302的动作写成已经完成，也不能远程创建、推进或收束亲密场景。真正开始仍须玩家回302点击“和她亲密”，或在双方已同场时使用正常自由输入。'
  );
}

export function 母亲共居手机提示(data: SchemaType): string {
  if (!双重继承完成事实(data)) return '';
  const 账 = 共居账(data);
  return (
    '【302共居手机语境】《双重继承》已完成，关系稳定；父亲始终不知道真实关系。' +
    `${账.最近事件 ? `最近真实互动：${账.最近事件}` : ''}` +
    '私聊与仅你可见内容可以承接真实亲密结果、邀请和只有两人懂的暗示；公开朋友圈只允许管理交接与社会上可解释的家庭口径。' +
    '结局后的核心回报只承接亲密开场与真实场次结果；不得恢复已废弃的日常操作菜单，也不得扩写母亲个人外出、共同出游或陪她购物。'
  );
}

export function 母亲共居背景状态(data: SchemaType, 地点: string): 共居背景状态 {
  if (!双重继承完成事实(data) || 地点 !== '302') return '结局前';
  const 时段 = 当前时段(data);
  if (时段 === '早上') return '早晨共居';
  if (时段 === '中午' || 时段 === '下午') return '中午个人生活';
  if (时段 === '傍晚') return '傍晚等人';
  if (时段 === '晚上') return '晚饭后客厅';
  return '深夜共同休息';
}

function 清理历史正文(文本: string): string {
  return String(文本 ?? '')
    .replace(/<BianLiang>[\s\S]*?<\/BianLiang>/giu, '')
    .replace(/<尺度判定[^>]*>[\s\S]*?<\/尺度判定>/giu, '')
    .replace(/<rq_event_summary>[\s\S]*?<\/rq_event_summary>/giu, '')
    .trim();
}

/**
 * 自由阶段只替换发送给正文模型的历史，不隐藏或删除玩家可见楼层，也不改每楼stat_data。
 * 有准确完成楼层时从结局最终收束开始；旧完成ID缺楼戳时只保留最近12条。
 */
export function 构造302自由阶段聊天历史(data: SchemaType, 当前地点: string): 共居历史提示[] | null {
  if (
    当前地点 !== '302' ||
    !双重继承完成事实(data) ||
    Boolean(data.系统._坏结局) ||
    Boolean(data.系统._场景剧情事务.id) ||
    Boolean(String(data.系统._待发送事件 ?? '').trim()) ||
    data.系统._待接来电.期 >= 0 ||
    data.系统._性爱场景.状态 !== '空闲' ||
    Boolean(data.系统._特殊场景.id) ||
    data.系统._荣耀洞拍 >= 0 ||
    typeof getChatMessages !== 'function' ||
    typeof getLastMessageId !== 'function'
  ) {
    return null;
  }
  const 最后楼 = Math.max(0, getLastMessageId());
  const 完成楼 = data.系统._双重继承.完成楼层;
  const 有精确完成楼 = 完成楼 >= 0 && 完成楼 <= 最后楼;
  const 起楼 = 有精确完成楼 ? 完成楼 + 1 : Math.max(0, 最后楼 - 11);
  const 历史 =
    起楼 <= 最后楼
      ? getChatMessages(`${起楼}-${最后楼}`, { hide_state: 'unhidden', include_swipes: false })
          .filter(消息 => 消息.role === 'user' || 消息.role === 'assistant')
          .map(消息 => ({ role: 消息.role as 'assistant' | 'user', content: 清理历史正文(消息.message) }))
          .filter(消息 => !!消息.content)
          .slice(-共居自由历史上限)
      : [];
  return [
    {
      role: 'system',
      content:
        '【已封存章节】《回国》与《双重继承》的检查、交权、三日早餐、机场视频和总钥匙收束已经完成。旧楼仍供玩家查看与回档，但不再作为当前场景继续演出；当前只承接302结局后自由阶段及其他尚未完成的现实线路。',
    },
    ...历史,
  ];
}

/** 原生正文在 PROMPT_READY 使用同一份302自由阶段历史替换策略。 */
export function 应用302自由阶段历史到原生请求<T extends 共居请求消息>(
  data: SchemaType,
  当前地点: string,
  chat: T[],
): boolean {
  const 历史 = 构造302自由阶段聊天历史(data, 当前地点);
  if (!历史?.length || !Array.isArray(chat) || !chat.length) return false;

  for (let index = chat.length - 1; index >= 0; index -= 1) {
    const 消息 = chat[index];
    if (消息.role === 'system' && typeof 消息.content === 'string' && 消息.content.startsWith('【已封存章节】')) {
      chat.splice(index, 1);
    }
  }
  const 最后用户索引 = chat.findLastIndex(消息 => 消息.role === 'user');
  if (最后用户索引 < 0) return false;
  const 当前用户消息 = chat[最后用户索引];
  const 对话索引 = chat
    .map((消息, index) => ({ 消息, index }))
    .filter(({ 消息, index }) => index <= 最后用户索引 && (消息.role === 'user' || 消息.role === 'assistant'))
    .map(({ index }) => index);
  if (!对话索引.length) return false;

  const 目标对话 = 历史.slice(1).map(消息 => ({ ...消息 }));
  const 最后目标用户 = 目标对话.findLastIndex(消息 => 消息.role === 'user');
  if (最后目标用户 < 0) {
    目标对话.push({ role: 'user', content: 清理历史正文(String(当前用户消息.content ?? '')) });
  } else {
    目标对话.splice(最后目标用户 + 1);
    目标对话[最后目标用户].content = 清理历史正文(String(当前用户消息.content ?? 目标对话[最后目标用户].content));
  }

  const 丢弃数 = Math.max(0, 对话索引.length - 目标对话.length);
  const 保留索引 = 对话索引.slice(丢弃数);
  const 额外目标 = 目标对话.slice(0, Math.max(0, 目标对话.length - 保留索引.length));
  const 对应目标 = 目标对话.slice(-保留索引.length);
  const 丢弃索引 = new Set(对话索引.slice(0, 丢弃数));
  const 目标按索引 = new Map(保留索引.map((index, 序号) => [index, 对应目标[序号]] as const));
  const 首个保留索引 = 保留索引[0];
  const 重建: T[] = [];

  for (const [index, 原消息] of chat.entries()) {
    if (丢弃索引.has(index)) continue;
    if (index === 首个保留索引) {
      重建.push({ role: 'system', content: 历史[0].content } as T, ...(额外目标 as T[]));
    }
    const 目标 = 目标按索引.get(index);
    if (!目标) {
      重建.push(原消息);
      continue;
    }
    if (index === 最后用户索引 && 目标.role === 'user') {
      重建.push(当前用户消息);
    } else {
      重建.push({ role: 目标.role, content: 目标.content } as T);
    }
  }
  chat.splice(0, chat.length, ...重建);
  return true;
}

/** 供手机按真实事件逐条生成后续动态；公开交接仍使用独立稳定键。 */
export function 母亲共居待反馈事件(data: SchemaType): SchemaType['系统']['_302共居']['待反馈事件'] {
  if (!双重继承完成事实(data)) return [];
  return [...共居账(data).待反馈事件];
}

/** 手机持久库已经存在同一事件键后，才从主MVU待办中移除；重复确认幂等。 */
export function 提交母亲共居朋友圈反馈(data: SchemaType, 事件ID: string): boolean {
  const 账 = 共居账(data);
  const 原数 = 账.待反馈事件.length;
  账.待反馈事件 = 账.待反馈事件.filter(事件 => 事件.id !== 事件ID);
  return 账.待反馈事件.length !== 原数;
}
