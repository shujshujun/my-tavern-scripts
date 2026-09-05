import type { SchemaType } from '../../schema';
import { 当前时段, 取绝对时段, 妻位置推算 } from './楼层时钟';
import { 阶段性癖已完成 } from './阶段性癖状态';
import { 读取医院内容策略 } from './生产系统';
import { 应使用怀孕CG } from './怀孕系统';
import { 拼接待发送事件队列, 读取待发送事件队列, 有普通场景剧情阻塞, 清空场景剧情事务 } from './场景剧情事务';

export const 安若妍换掉商品ID = '角色路线:301:结局剧情';
export const 安若妍拍立得ID = '301拍立得套装';
export const 安若妍换掉价格 = 1500;
export const 安若妍拍立得价格 = 600;
type 状态 = SchemaType['系统']['_安若妍换掉'];
export type 安若妍换掉场景 = Exclude<状态['当前场景'], ''>;
export type 安若妍换掉动作ID =
  | '使用换掉'
  | '购买拍立得'
  | '交付拍立得'
  | '预约江辰'
  | '登记江辰到访'
  | '等江辰回来'
  | '递相机'
  | '开始镜头前'
  | '暂缓预约夜'
  | '拍第一张'
  | '拍最终照'
  | '等照片显影'
  | '回到客厅'
  | '询问换照'
  | '换掉结婚照';
export interface 安若妍换掉结果 {
  成功: boolean;
  提示: string;
  变动?: boolean;
  事件?: string;
  CG序列?: string[];
  需普通亲密开场?: boolean;
}

export function 安若妍结局后亲密可用(data: SchemaType, 地点: string): boolean {
  return (
    地点 === '301' &&
    已完成(data) &&
    !外部阻断(data) &&
    妻位置推算('301', 取绝对时段(data), data.户['301']) === '301' &&
    data.系统._性爱场景.状态 === '空闲' &&
    data.玩家资源.体力.当前值 > 0
  );
}
export function 安若妍结局后亲密行动(选择: '由我开始' | '让她开始'): string {
  return `【301结局后亲密开场】【${选择}】（301客厅相框已经换好。${选择 === '由我开始' ? '玩家向安若妍靠近' : '安若妍主动来到玩家身边'}，演出这一楼开场后，将下一步交回玩家。）`;
}
export function 解析安若妍结局后亲密行动(value: string): boolean {
  return /【301结局后亲密开场】【(?:由我开始|让她开始)】/u.test(value);
}
export interface 安若妍换掉动作视图 {
  id: 安若妍换掉动作ID;
  文案: string;
  可执行: boolean;
  原因: string;
  icon: string;
  kicker: string;
}

const 提交标记 = '安若妍换掉提交';
const 亲密阶段 = new Set<状态['阶段']>(['前半', '待P1', '中段', '待P2', '后半', '待收尾']);
const 夜间阶段 = new Set<状态['阶段']>(['待递相机', '待开场', ...亲密阶段, '待显影', '待回客厅', '待询问', '待换照']);
const 场景标题: Record<安若妍换掉场景, string> = {
  A1: '墙上的旧照片',
  B1: '先拍一张试试',
  B2: '定下到访时间',
  C1: '他按时间回来',
  C2: '帮我们拍',
  H1: '在镜头前开始',
  P1: '第一张照片',
  P2: '一起做鬼脸',
  H10: '照片正在显影',
  H11: '回到客厅',
  H12: '换掉没问题吧',
};
// 固定拍提供当前动作、数值结算边界和末帧；状态机按持久票提交完成凭据。
const 场景任务: Record<安若妍换掉场景, string> = {
  A1: '安若妍望向301客厅旧结婚照，提出请江辰为她与玩家拍摄亲密合照并换进原相框。末帧是把相机采购要求交给玩家；相机尚未买回，江辰尚未获通知。',
  B1: '玩家交付拍立得套装；安若妍检查电池与相纸并完成一次试机。末帧是可用的相机放在桌上；本拍不通知江辰。',
  B2: '安若妍与江辰约定次日晚间回301。末帧是玩家准备去管理员室登记；尚未完成登记，江辰尚未到场。',
  C1: '江辰按登记时间进入301客厅，看到旧结婚照、桌上的拍立得以及等候的两人。末帧是他的目光落到相机上；他尚未接过相机。',
  C2: '安若妍将拍立得交给江辰，请他为两人拍照。末帧是江辰拿稳相机；尚未按快门。',
  H1: '安若妍将玩家带到镜头前，江辰举好拍立得；本拍完成亲密开场并把下一步交给玩家。场次从零进度开始，拍照和收尾由后续步骤处理。',
  P1: '本拍暂停普通数值结算，保持同一场次和当前现场状态。两人面对镜头调整姿势，江辰按一次快门；末帧停在第一张相纸吐出，第二次拍摄留待后续步骤。',
  P2: '本拍暂停普通数值结算，保持同一场次和当前现场状态。两人望向镜头一起做鬼脸，江辰按一次快门；末帧停在最终相纸吐出，换照和群消息留待后续步骤。',
  H10: '场次已经结束。只呈现整理后等待最终相纸显影，末帧是安若妍拿起照片准备去客厅。不要重演收尾、进入客厅或换照。',
  H11: '只完成三人回到301客厅的转场。安若妍把新照片拿到旧相框旁比较，末帧转头看向江辰；尚未询问或换照。',
  H12: '安若妍询问是否可以更换客厅照片，江辰简短同意；最后将动作交给玩家。末帧旧结婚照仍在原相框内。玩家尚未换照，结局尚未完成。',
};
function 构造换掉剧情事件(场景: 安若妍换掉场景, 票: string): string {
  const 夫在场 = !['A1', 'B1', 'B2'].includes(场景);
  const 演员 = `【事件在场妻:301】${夫在场 ? '【事件在场夫:301】' : '【事件关联夫:301】'}`;
  return `【${提交标记}:${场景}:${票}】${演员}换掉 · ${场景标题[场景]}。${场景任务[场景]}本楼只有这一拍，不合并后续阶段。`;
}

/** 启动或回档时更新尚未完成的本线票文案，原事务元数据和提交标识保持不变。 */
export function 同步安若妍换掉当前剧情票(data: SchemaType): boolean {
  const 路线 = data.系统._安若妍换掉;
  if (已完成(data) || 路线.阶段 !== '固定剧情中' || !路线.当前场景 || !路线.当前票) return false;
  const 标记 = `【${提交标记}:${路线.当前场景}:${路线.当前票}】`;
  const 当前内容 = 构造换掉剧情事件(路线.当前场景, 路线.当前票);
  let changed = false;
  const 更新 = (content: string): string => {
    const start = content.indexOf(标记);
    if (start < 0) return content;
    const next = content.slice(0, start) + 当前内容;
    if (next !== content) changed = true;
    return next;
  };
  const queue = 读取待发送事件队列(data.系统._待发送事件);
  const nextQueue = queue.map(更新);
  if (nextQueue.some((item, index) => item !== queue[index])) data.系统._待发送事件 = 拼接待发送事件队列(nextQueue);
  data.系统._场景剧情事务.内容 = 更新(data.系统._场景剧情事务.内容);
  data.系统._已注入事件.内容 = 更新(data.系统._已注入事件.内容);
  return changed;
}

const 动作配置: Record<安若妍换掉动作ID, { 地点: string; 阶段: 状态['阶段'] | readonly 状态['阶段'][]; 文案: string; 场景?: 安若妍换掉场景 }> = {
  使用换掉: { 地点: '301', 阶段: '已购买', 文案: '使用「安若妍 · 换掉」', 场景: 'A1' },
  购买拍立得: { 地点: '公寓外部', 阶段: '待购买拍立得', 文案: '去摄影器材店购买拍立得' },
  交付拍立得: { 地点: '301', 阶段: '等待试机日', 文案: '把拍立得交给安若妍', 场景: 'B1' },
  预约江辰: { 地点: '301', 阶段: '待预约', 文案: '请安若妍预约江辰', 场景: 'B2' },
  登记江辰到访: { 地点: '管理员室', 阶段: '待登记', 文案: '登记江辰次日晚间到访301' },
  等江辰回来: { 地点: '301', 阶段: '等待预约夜', 文案: '等江辰按约回来', 场景: 'C1' },
  递相机: { 地点: '301', 阶段: '待递相机', 文案: '把拍立得递给江辰', 场景: 'C2' },
  开始镜头前: { 地点: '301', 阶段: '待开场', 文案: '来到镜头前', 场景: 'H1' },
  暂缓预约夜: { 地点: '301', 阶段: ['待递相机', '待开场'], 文案: '本夜先暂缓，改约下个晚上' },
  拍第一张: { 地点: '301', 阶段: '待P1', 文案: '和她一起对着镜头摆姿势', 场景: 'P1' },
  拍最终照: { 地点: '301', 阶段: '待P2', 文案: '和她一起对着镜头做鬼脸', 场景: 'P2' },
  等照片显影: { 地点: '301', 阶段: '待显影', 文案: '等照片显影', 场景: 'H10' },
  回到客厅: { 地点: '301', 阶段: '待回客厅', 文案: '回到301客厅', 场景: 'H11' },
  询问换照: { 地点: '301', 阶段: '待询问', 文案: '听她询问换照', 场景: 'H12' },
  换掉结婚照: { 地点: '301', 阶段: '待换照', 文案: '把客厅结婚照换成刚拍的照片' },
};

function 动作阶段匹配(当前: 状态['阶段'], 需要: 状态['阶段'] | readonly 状态['阶段'][]): boolean {
  return typeof 需要 === 'string' ? 当前 === 需要 : 需要.includes(当前);
}

function 已完成(data: SchemaType): boolean {
  return data.系统._已完成特殊场景.includes(安若妍换掉商品ID);
}
function 前置成立(data: SchemaType): boolean {
  const 承接 = data.系统._安若妍不必停;
  return Boolean(
    data.户['301']?.妻.当前阶段 >= 5 &&
    阶段性癖已完成(data, '301') &&
    (承接.阶段 === '已完成' || data.系统._已完成特殊场景.includes('不必停')) &&
    承接.江辰已明确看见 &&
    承接.江辰已接受互不干涉 &&
    承接.提前通知已约定,
  );
}
function 身体可用(data: SchemaType): boolean {
  return Boolean(data.户['301'] && 读取医院内容策略(data, '301').允许成人特殊场景);
}
function 外部阻断(data: SchemaType): string {
  if (!身体可用(data)) return '安若妍正在医院、待产或产后恢复。';
  if (data.系统._父亲通话.标识 || data.系统._父亲通话.状态 || data.系统._待接来电.期 >= 0) return '请先处理当前来电。';
  if (data.系统._特殊场景.id || 有普通场景剧情阻塞(data)) return '请先完成当前剧情。';
  return '';
}
function 最近安全夜(data: SchemaType, 起点: number): number {
  for (let candidate = 起点; candidate < 起点 + 42; candidate++) {
    if (['晚上', '深夜'].includes(当前时段(candidate)) && 妻位置推算('301', candidate, data.户['301']) === '301')
      return candidate;
  }
  return 起点;
}
function 下一晚(data: SchemaType, 当前: number): number {
  return 最近安全夜(data, Math.floor(当前 / 6) * 6 + 10);
}
function 同一天(a: number, b: number): boolean {
  return Math.floor(a / 6) === Math.floor(b / 6);
}
function 是暂停场景(场景: string): boolean {
  return 场景 === 'P1' || 场景 === 'P2';
}
function 当前步骤需要绑定(路线: 状态): boolean {
  return 亲密阶段.has(路线.阶段) || (路线.阶段 === '固定剧情中' && 是暂停场景(路线.当前场景));
}

export function 安若妍换掉商店已上架(data: SchemaType): boolean {
  return (
    前置成立(data) &&
    身体可用(data) &&
    !已完成(data) &&
    data.系统._安若妍换掉.阶段 === '未开始' &&
    !data.背包.includes(安若妍换掉商品ID)
  );
}
export function 购买安若妍换掉(data: SchemaType): 安若妍换掉结果 {
  if (!安若妍换掉商店已上架(data)) return { 成功: false, 提示: '《换掉》尚未开放或已经持有。' };
  if (data.现金 < 安若妍换掉价格) return { 成功: false, 提示: '现金不足。' };
  data.现金 -= 安若妍换掉价格;
  data.背包.push(安若妍换掉商品ID);
  data.系统._安若妍换掉.阶段 = '已购买';
  return { 成功: true, 变动: true, 提示: '《换掉》已放入背包，请到301主动使用。' };
}

export function 解析安若妍换掉剧情事件(value: unknown): { 场景: 安若妍换掉场景; 票: string } | null {
  if (typeof value !== 'string') return null;
  const match = /【安若妍换掉提交:([^:】]+):([^】]+)】/u.exec(value);
  if (!match || !Object.hasOwn(场景标题, match[1])) return null;
  return { 场景: match[1] as 安若妍换掉场景, 票: match[2] };
}
export function 安若妍换掉事件要求H1开场(value: unknown): boolean {
  return 解析安若妍换掉剧情事件(value)?.场景 === 'H1';
}
export function 安若妍换掉真实亲密已绑定(data: SchemaType): boolean {
  const 路线 = data.系统._安若妍换掉;
  const 场景 = data.系统._性爱场景;
  return Boolean(
    路线.绑定亲密场次标识 &&
    场景.状态 !== '空闲' &&
    场景.场次标识 === 路线.绑定亲密场次标识 &&
    Object.keys(场景.参与者).length === 1 &&
    场景.参与者['301'] &&
    !场景.参与者['301'].已退出,
  );
}
export function 绑定安若妍换掉亲密场次(data: SchemaType): boolean {
  const 路线 = data.系统._安若妍换掉;
  const 场景 = data.系统._性爱场景;
  if (
    路线.阶段 !== '前半' ||
    !路线.江辰已持相机 ||
    场景.状态 === '空闲' ||
    Object.keys(场景.参与者).length !== 1 ||
    !场景.参与者['301'] ||
    场景.有效楼数 !== 0
  )
    return false;
  路线.绑定亲密场次标识 = 场景.场次标识;
  场景.参与者['301'].满意目标 = 6;
  return 安若妍换掉真实亲密已绑定(data);
}

function 当前最终照片记录(路线: 状态) {
  if (!路线.P2完成 || !路线.绑定亲密场次标识 || !路线.最终照片素材ID) return undefined;
  return 路线.拍摄历史.findLast(项 =>
    项.场次 === 路线.绑定亲密场次标识 && 项.照片 === 路线.最终照片素材ID && Number.isInteger(项.楼层) && 项.楼层 >= 0,
  );
}

/** 使用已有的拍摄楼和本场登记楼派生，避免另存一套可与回档失同步的阶段计数。 */
function 最终照片后有效楼数(路线: 状态): number {
  const 照片 = 当前最终照片记录(路线);
  if (!照片) return 0;
  return [...new Set(路线.已登记亲密楼层)].filter(楼 => Number.isInteger(楼) && 楼 > 照片.楼层).length;
}

export function 安若妍换掉接管普通收尾(data: SchemaType): boolean {
  const 路线 = data.系统._安若妍换掉;
  if (!安若妍换掉真实亲密已绑定(data)) return false;
  const 项 = data.系统._性爱场景.参与者['301'];
  return !(
    安若妍换掉真实亲密已绑定(data) &&
    路线.阶段 === '待收尾' &&
    路线.P1完成 &&
    路线.P2完成 &&
    路线.最终照片素材ID &&
    最终照片后有效楼数(路线) >= 2 &&
    (项?.有效楼数 ?? 0) >= 7 &&
    (项?.满意度 ?? 0) >= 6
  );
}
export function 安若妍换掉普通回合阻断原因(data: SchemaType, 本楼事件: unknown): string {
  const 路线 = data.系统._安若妍换掉;
  if (!安若妍换掉真实亲密已绑定(data) || 解析安若妍换掉剧情事件(本楼事件)) return '';
  return ['待P1', '待P2', '固定剧情中'].includes(路线.阶段) ? '请先完成当前拍照动作，再继续同一场次。' : '';
}

function 重排夜晚(data: SchemaType, 原因: string): void {
  const 路线 = data.系统._安若妍换掉;
  const 活动 = data.系统._场景剧情事务;
  if (活动.id && 解析安若妍换掉剧情事件(活动.内容)) 清空场景剧情事务(data);
  data.系统._待发送事件 = 拼接待发送事件队列(
    读取待发送事件队列(data.系统._待发送事件).filter(event => !event.includes(`【${提交标记}:`)),
  );
  Object.assign(路线, {
    阶段: '等待预约夜',
    当前场景: '',
    当前票: '',
    预约夜绝对时段: 下一晚(data, 取绝对时段(data)),
    江辰已到场: false,
    江辰已持相机: false,
    绑定亲密场次标识: '',
    已登记亲密楼层: [],
    P1完成: false,
    P2完成: false,
    最终照片体态: '',
    最终照片素材ID: '',
    普通收尾已完成: false,
    亲密结果场次标识: '',
    暂停原因: 原因,
  });
  const 夫 = data.户['301']?.夫;
  if (夫) Object.assign(夫, { _居住模式: '提前通知', _预约回楼起: -1, _预约回楼至: -1, 状态: '外出' });
}
export function 恢复安若妍换掉失效亲密检查点(data: SchemaType): boolean {
  const 路线 = data.系统._安若妍换掉;
  if (已完成(data) || !当前步骤需要绑定(路线) || 安若妍换掉真实亲密已绑定(data)) return false;
  重排夜晚(data, '本次绑定场次已经失效；套装与试机记录保留，请等待重新预约。');
  return true;
}
export function 同步安若妍换掉时间节点(data: SchemaType): void {
  if (已完成(data) || 恢复安若妍换掉失效亲密检查点(data)) return;
  const 路线 = data.系统._安若妍换掉;
  const 当前 = 取绝对时段(data);
  if (
    路线.阶段 === '等待预约夜' &&
    路线.预约夜绝对时段 >= 0 &&
    Math.floor(当前 / 6) > Math.floor(路线.预约夜绝对时段 / 6)
  ) {
    路线.预约夜绝对时段 = 最近安全夜(data, Math.max(当前, Math.floor(当前 / 6) * 6 + 4));
    路线.暂停原因 = '原预约夜已错过，顺延到下一个安全晚上。';
  }
}

function 动作阻断(data: SchemaType, id: 安若妍换掉动作ID): string {
  const 路线 = data.系统._安若妍换掉;
  const 配置 = 动作配置[id];
  const 当前 = 取绝对时段(data);
  if (!动作阶段匹配(路线.阶段, 配置.阶段) || 已完成(data)) return '线路状态已经变化。';
  // 改约只撤销尚未开始的本夜安排，身体恢复或来电不能反向封死这个硬操作。
  if (id === '暂缓预约夜') {
    return data.系统._性爱场景.状态 !== '空闲' || data.系统._特殊场景.id || 有普通场景剧情阻塞(data)
      ? '请先完成当前场次或剧情，再调整预约。' : '';
  }
  const 外部 = 外部阻断(data);
  if (外部) return 外部;
  if (配置.地点 === '301' && 妻位置推算('301', 当前, data.户['301']) !== '301') return '安若妍当前不在301。';
  if (id === '使用换掉' && (!前置成立(data) || !data.背包.includes(安若妍换掉商品ID)))
    return '前置状态或背包剧情票已经变化。';
  if (id === '购买拍立得' && data.现金 < 安若妍拍立得价格) return `拍立得套装需要${安若妍拍立得价格}元。`;
  if (id === '交付拍立得') {
    if (!data.背包.includes(安若妍拍立得ID) || 路线.拍立得状态 !== '背包') return '请先带回拍立得套装。';
    if (同一天(当前, 路线.购买绝对时段) || 当前 < 路线.购买绝对时段) return '请在真实跨日后回301试机。';
  }
  if (
    id === '等江辰回来' &&
    (当前 < 路线.预约夜绝对时段 || !同一天(当前, 路线.预约夜绝对时段) || !['晚上', '深夜'].includes(当前时段(当前)))
  )
    return '请在已登记的预约夜回301。';
  if (id === '开始镜头前' && data.玩家资源.体力.当前值 < 7) return '开始前至少需要7点体力。';
  if (是暂停场景(配置.场景 ?? '') && !安若妍换掉真实亲密已绑定(data)) return '原场次已经失效。';
  if (!是暂停场景(配置.场景 ?? '') && data.系统._性爱场景.状态 !== '空闲') return '请先结束当前普通场次。';
  if (id === '换掉结婚照' && (!路线.普通收尾已完成 || !路线.P2完成 || !路线.最终照片素材ID))
    return '本次最终照片与收尾凭据尚未齐全。';
  return '';
}
export function 安若妍换掉地点动作(data: SchemaType, 地点: string): 安若妍换掉动作视图[] {
  // 界面投影不写状态，时间节点由成功事务推进。
  return (Object.entries(动作配置) as [安若妍换掉动作ID, (typeof 动作配置)[安若妍换掉动作ID]][])
    .filter(([, value]) => value.地点 === 地点 && 动作阶段匹配(data.系统._安若妍换掉.阶段, value.阶段) && !已完成(data))
    .map(([id, value]) => {
      const 原因 = 动作阻断(data, id);
      return { id, 文案: value.文案, 可执行: !原因, 原因, icon: 'camera', kicker: '换掉' };
    });
}
export function 执行安若妍换掉地点动作(
  data: SchemaType,
  id: 安若妍换掉动作ID,
  地点: string,
  楼层: number,
  时间线 = '',
): 安若妍换掉结果 {
  if (id === '换掉结婚照' && 地点 === '301' && 已完成(data))
    return { 成功: true, 变动: false, 提示: '客厅照片已经换好。' };
  同步安若妍换掉时间节点(data);
  const 配置 = 动作配置[id];
  if (!配置 || 配置.地点 !== 地点) return { 成功: false, 提示: '当前地点没有这个动作。' };
  const 原因 = 动作阻断(data, id);
  if (原因) return { 成功: false, 提示: 原因 };
  const 路线 = data.系统._安若妍换掉;
  const 当前 = 取绝对时段(data);
  if (id === '暂缓预约夜') {
    重排夜晚(data, '玩家在开场前暂缓预约夜');
    return { 成功: true, 变动: true, 提示: '预约已顺延，拍立得和试机记录保留。可以先休息，再按新预约回301。' };
  }
  if (id === '购买拍立得') {
    data.现金 -= 安若妍拍立得价格;
    data.背包.push(安若妍拍立得ID);
    Object.assign(路线, { 拍立得状态: '背包', 购买绝对时段: 当前, 阶段: '等待试机日' });
    return { 成功: true, 变动: true, 提示: '拍立得套装已购入，次日回301试机。' };
  }
  if (id === '登记江辰到访') {
    Object.assign(路线, { 登记绝对时段: 当前, 预约夜绝对时段: 下一晚(data, 当前), 阶段: '等待预约夜' });
    // 预约只作为线路凭据；到场成功前不放开普通丈夫生产者。
    return { 成功: true, 变动: true, 提示: '江辰的次日晚间到访已登记。' };
  }
  if (id === '换掉结婚照') {
    路线.阶段 = '已完成';
    路线.完成楼层 = Math.max(0, Math.floor(楼层));
    data.系统._已完成特殊场景.push(安若妍换掉商品ID);
    const 夫 = data.户['301'].夫;
    Object.assign(夫, { _居住模式: '提前通知', _预约回楼起: -1, _预约回楼至: -1, 状态: '外出' });
    return { 成功: true, 变动: true, 提示: '你亲手换好了301客厅的照片。《换掉》结局完成。' };
  }
  if (!配置.场景) return { 成功: false, 提示: '剧情动作缺少场景。' };
  if (id === '使用换掉') {
    路线.实例 = `${时间线}:${楼层}:${当前}`;
    路线.来源时间线 = 时间线;
  }
  路线.轮次 += 1;
  路线.当前票 = `${encodeURIComponent(路线.实例)}-${路线.轮次}`;
  路线.当前场景 = 配置.场景;
  路线.阶段 = '固定剧情中';
  const 事件 = 构造换掉剧情事件(配置.场景, 路线.当前票);
  return { 成功: true, 变动: true, 提示: 场景标题[配置.场景], 事件 };
}

export function 提交安若妍换掉剧情事件(
  data: SchemaType,
  value: unknown,
  地点: string,
  楼层: number,
): 安若妍换掉结果 | null {
  const 票 = 解析安若妍换掉剧情事件(value);
  if (!票) return null;
  const 路线 = data.系统._安若妍换掉;
  if (地点 !== '301' || 路线.阶段 !== '固定剧情中' || 路线.当前场景 !== 票.场景 || 路线.当前票 !== 票.票) {
    return { 成功: false, 提示: '《换掉》剧情票与当前地点或检查点不匹配。' };
  }
  if (是暂停场景(票.场景) && !安若妍换掉真实亲密已绑定(data)) return { 成功: false, 提示: '拍照必须保留同一场次。' };
  if (票.场景 === 'B1' && !data.背包.includes(安若妍拍立得ID)) return { 成功: false, 提示: '拍立得套装已经不在背包。' };
  if (票.场景 === 'A1' && !data.背包.includes(安若妍换掉商品ID)) return { 成功: false, 提示: '剧情票已经不在背包。' };
  const 后续: Record<安若妍换掉场景, 状态['阶段']> = {
    A1: '待购买拍立得',
    B1: '待预约',
    B2: '待登记',
    C1: '待递相机',
    C2: '待开场',
    H1: '前半',
    P1: '中段',
    P2: '后半',
    H10: '待回客厅',
    H11: '待询问',
    H12: '待换照',
  };
  if (票.场景 === 'A1') {
    data.背包.splice(data.背包.indexOf(安若妍换掉商品ID), 1);
    路线.道具已使用 = true;
  }
  if (票.场景 === 'B1') {
    data.背包.splice(data.背包.indexOf(安若妍拍立得ID), 1);
    路线.拍立得状态 = '已交付';
  }
  if (票.场景 === 'C1') {
    路线.江辰已到场 = true;
    Object.assign(data.户['301'].夫, {
      _居住模式: '预约回楼',
      _预约回楼起: 取绝对时段(data),
      _预约回楼至: Math.floor(取绝对时段(data) / 6) * 6 + 6,
      状态: '在家',
    });
  }
  if (票.场景 === 'C2') 路线.江辰已持相机 = true;
  if (票.场景 === 'P1') 路线.P1完成 = true;
  if (票.场景 === 'P2') {
    路线.P2完成 = true;
    路线.最终照片体态 = 应使用怀孕CG(data, '301') ? '孕态' : '普通';
    路线.最终照片素材ID = `ARY-RPL-10-${路线.最终照片体态 === '孕态' ? 'P' : 'N'}`;
    路线.拍摄历史.push({ 场次: 路线.绑定亲密场次标识, 照片: 路线.最终照片素材ID, 楼层: Math.max(0, Math.floor(楼层)) });
  }
  路线.阶段 = 后续[票.场景];
  路线.当前场景 = '';
  路线.当前票 = '';
  const CG序列 = 安若妍换掉剧情CG(data, value);
  路线.CG回忆 = [...new Set([...路线.CG回忆, ...CG序列])];
  return {
    成功: true,
    变动: true,
    提示: `${场景标题[票.场景]}已完成。`,
    CG序列,
    ...(票.场景 === 'H1' ? { 需普通亲密开场: true } : {}),
  };
}

export function 安若妍换掉剧情CG(data: SchemaType, value: unknown): string[] {
  const 票 = 解析安若妍换掉剧情事件(value);
  if (!票) return [];
  const sequence: Record<安若妍换掉场景, number[]> = {
    A1: [1],
    B1: [2],
    B2: [3],
    C1: [4],
    C2: [5],
    H1: [6],
    P1: [7, 8],
    P2: [9, 10],
    H10: [11],
    H11: [12],
    H12: [13],
  };
  const frozen = ['P2', 'H10'].includes(票.场景) ? data.系统._安若妍换掉.最终照片体态 : '';
  const body = frozen ? (frozen === '孕态' ? 'P' : 'N') : 应使用怀孕CG(data, '301') ? 'P' : 'N';
  return sequence[票.场景].map(id => `ARY-RPL-${String(id).padStart(2, '0')}${id >= 6 && id <= 11 ? `-${body}` : ''}`);
}

export function 登记安若妍换掉亲密有效楼(
  data: SchemaType,
  输入: { 场景: string; 楼层: number; 实际尺度: number },
): void {
  const 路线 = data.系统._安若妍换掉;
  if (!安若妍换掉真实亲密已绑定(data)) return;
  if (输入.场景 !== '301' || !['前半', '中段', '后半', '待收尾'].includes(路线.阶段))
    throw new Error('《换掉》当前步骤不能登记普通有效楼。');
  if (路线.已登记亲密楼层.includes(输入.楼层)) return;
  路线.已登记亲密楼层.push(输入.楼层);
  const 项 = data.系统._性爱场景.参与者['301'];
  const 楼数 = 项.有效楼数 ?? 0;
  if (路线.阶段 === '前半' && 楼数 >= 4 && 输入.实际尺度 >= 3) 路线.阶段 = '待P1';
  if (路线.阶段 === '中段' && 楼数 >= 5 && 路线.P1完成) 路线.阶段 = '待P2';
  if (路线.阶段 === '后半' && 楼数 >= 7 && 项.满意度 >= 6 && 路线.P1完成 && 最终照片后有效楼数(路线) >= 2) 路线.阶段 = '待收尾';
}
export function 结算安若妍换掉亲密收尾(data: SchemaType, result: SchemaType['系统']['_上次性爱结果']): void {
  const 路线 = data.系统._安若妍换掉;
  if (!路线.绑定亲密场次标识 || result.场次标识 !== 路线.绑定亲密场次标识) return;
  const 项 = result.参与者['301'];
  if (
    路线.阶段 !== '待收尾' ||
    !路线.P1完成 ||
    !路线.P2完成 ||
    最终照片后有效楼数(路线) < 2 ||
    !项 ||
    !['主动收尾', '体力耗尽'].includes(result.结束方式) ||
    (项.有效楼数 ?? 0) < 7 ||
    项.满意度 < 6
  ) {
    重排夜晚(data, '本次场次未形成合格收尾；保留采购、试机和拍摄历史。');
    return;
  }
  Object.assign(路线, {
    普通收尾已完成: true,
    亲密结果场次标识: result.场次标识,
    绑定亲密场次标识: '',
    阶段: '待显影',
  });
}
export function 安若妍换掉时间动作阻断原因(data: SchemaType): string {
  const 路线 = data.系统._安若妍换掉;
  if (已完成(data) || (当前步骤需要绑定(路线) && !安若妍换掉真实亲密已绑定(data))) return '';
  return 夜间阶段.has(路线.阶段) || (路线.阶段 === '固定剧情中' && 路线.江辰已到场)
    ? '《换掉》的预约夜正在301连续进行，请先完成当前流程。'
    : '';
}
export function 安若妍换掉等待硬操作(data: SchemaType): boolean {
  if (已完成(data)) return false;
  const 阶段 = data.系统._安若妍换掉.阶段;
  return 阶段 === '待换照' || (['待P1', '待P2'].includes(阶段) && 安若妍换掉真实亲密已绑定(data));
}
export function 安若妍换掉剧情演员错误(value: unknown, 妻: readonly string[], 夫: readonly string[]): string {
  const 票 = 解析安若妍换掉剧情事件(value);
  if (!票) return '';
  const 有丈夫 = !['A1', 'B1', 'B2'].includes(票.场景);
  return 妻.length !== 1 || 妻[0] !== '301' || (有丈夫 ? 夫.length !== 1 || 夫[0] !== '301' : 夫.length !== 0)
    ? '《换掉》本拍演员不匹配。'
    : '';
}
export function 安若妍换掉快照提示(data: SchemaType): string {
  const 路线 = data.系统._安若妍换掉;
  if (['未开始', '已购买'].includes(路线.阶段)) return '';
  if (已完成(data))
    return '【301换照后】玩家已亲手换好客厅原相框中的照片。安若妍与江辰对外保留夫妻身份，私人生活互不干涉；江辰今后到访仍须提前通知。相框照片固定为拍摄当时的版本。';
  return `【301换掉】当前步骤：${路线.阶段}；拍立得：${路线.拍立得状态}。只有玩家亲手换照才完成结局，AI不能替玩家换照或提前发群消息。江辰只按预约负责拍摄，不是普通场次参与者；P1和P2只执行各自的一次拍照动作。${路线.暂停原因}`;
}
