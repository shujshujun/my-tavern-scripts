import type { SchemaType } from '../../schema';
import { 有地点动作剧情冲突 } from './场景剧情事务';
import { 许曼君离婚场景ID, 许曼君离婚新锁芯ID, 许曼君离婚新钥匙ID } from '../../stageConfig';
import { 当前时段, 每天时段数, 妻位置推算 } from './楼层时钟';
import { 处于医院硬锁 } from './生产系统';

export { 许曼君离婚场景ID, 许曼君离婚新锁芯ID, 许曼君离婚新钥匙ID } from '../../stageConfig';
/** 《离婚》的真实商品、状态机与唯一完成记录共用同一个稳定 ID。 */
export const 许曼君离婚商品ID = 许曼君离婚场景ID;
export const 许曼君离婚邀请消息键 = '许曼君离婚:最后一笔邀请';

export const 许曼君离婚终幕目标列表 = ['红本', '婚戒', '戒印'] as const;
export type 许曼君离婚终幕目标 = (typeof 许曼君离婚终幕目标列表)[number];
export type 许曼君离婚公开选择 = '当着赵国强牵住她' | '等赵国强离开再抱她';
export type 许曼君结局后亲密开场选择 = '由我开始' | '让她开始';

export type 许曼君离婚动作ID =
  | '使用红色封存盒'
  | '陪她去办最后手续'
  | 许曼君离婚公开选择
  | '归档201前住户旧钥匙'
  | '确认201继续由她居住'
  | '领取201新锁芯和钥匙'
  | '更换201锁芯'
  | '开始最后一笔'
  | '打开红色封存盒'
  | '选择红本'
  | '选择婚戒'
  | '选择戒印'
  | '摆好锁定目标'
  | '确认射在这里'
  | '停下，今晚不封存'
  | '完成H8结果演出'
  | '封存选定物件'
  | '把戒指压进红色封皮'
  | '戒印长按失败'
  | '让许曼君按下去'
  | '完成非成人收束'
  | '和她亲密'
  | 许曼君结局后亲密开场选择;

export interface 许曼君离婚动作选项视图 {
  id: 许曼君离婚动作ID;
  kicker: string;
  文案: string;
  提示?: string;
  长按毫秒?: number;
  短按动作?: 许曼君离婚动作ID;
}

export interface 许曼君离婚地点动作视图 {
  id: 许曼君离婚动作ID;
  kicker: string;
  icon: 'story' | 'home' | 'edit' | 'tool' | 'heart';
  文案: string;
  提示?: string;
  选项?: readonly 许曼君离婚动作选项视图[];
}

export interface 许曼君离婚结果 {
  成功: boolean;
  提示: string;
  变动?: boolean;
  事件?: string;
  CG?: string;
  目标?: 许曼君离婚终幕目标;
  需普通亲密回合?: boolean;
  需H8收尾?: '确认' | '停止';
}

type 离婚剧情动作 =
  | '预约办理'
  | '办理等待'
  | '办理见证'
  | '归档确认'
  | 'H1婚纱开门'
  | 'H2开盒'
  | 'H7摆目标'
  | 'H8结果'
  | 'H9封存'
  | '非成人收束';
type 离婚阶段 = SchemaType['系统']['_许曼君离婚']['阶段'];

export interface 许曼君离婚剧情票 {
  动作: 离婚剧情动作;
  预期阶段: 离婚阶段;
  请求时段: number;
  拍: number;
  载荷: string;
}

const CG标题表 = Object.freeze({
  'XMJ-DIV-01': '办理结束',
  'XMJ-DIV-02': '旧钥匙归档',
  'XMJ-DIV-03': '换锁交新钥匙',
  'XMJ-DIV-04': '离婚后201 · 白天',
  'XMJ-DIV-05': '离婚后201 · 夜晚',
  'XMJ-DIV-06': '最后一笔 · 婚纱开门',
  'XMJ-DIV-07': '最后一笔 · 红色封存盒',
  'XMJ-DIV-08': '最后一笔 · 红本',
  'XMJ-DIV-09': '最后一笔 · 婚戒',
  'XMJ-DIV-10': '最后一笔 · 戒印',
  'XMJ-DIV-11': '最后一笔 · 红本结果',
  'XMJ-DIV-12': '最后一笔 · 婚戒结果',
  'XMJ-DIV-13': '最后一笔 · 戒印结果',
  'XMJ-DIV-14': '最后一笔 · 她亲手封盒',
  'XMJ-DIV-15': '离婚后201 · 次晨',
} as const);

export const 许曼君离婚全部CGID = Object.freeze(Object.keys(CG标题表));

function 路线(data: SchemaType): SchemaType['系统']['_许曼君离婚'] {
  return data.系统._许曼君离婚;
}

function 分居完成(data: SchemaType): boolean {
  const r = data.系统._许曼君分居;
  return (
    r.阶段 === '已完成' &&
    r.工资卡状态 === '已归还赵国强' &&
    r.丈夫已知玩家关系 &&
    r.丈夫已选择外住 &&
    r.生活用品已取完 &&
    r.许曼君已拒绝恢复共同生活 &&
    r.双方同意进入办理 &&
    r.钥匙位置 === '管理员室201钥匙格' &&
    r.钥匙用途 === '待离婚交接' &&
    ['继续关系', '退出关系', '暂不承诺'].includes(r.玩家最终关系选择)
  );
}

function 已完成ID(data: SchemaType): boolean {
  return data.系统._已完成特殊场景.includes(许曼君离婚场景ID);
}

export function 许曼君离婚已完成(data: SchemaType): boolean {
  return 路线(data).阶段 === '已完成' || 已完成ID(data);
}

function 唯一背包数量(data: SchemaType, id: string): number {
  return data.背包.filter(item => item === id).length;
}

function 移除全部背包项(data: SchemaType, id: string): boolean {
  const before = data.背包.length;
  data.背包 = data.背包.filter(item => item !== id);
  return data.背包.length !== before;
}

function 补唯一背包项(data: SchemaType, id: string): boolean {
  const indexes = data.背包.reduce<number[]>((items, item, index) => (item === id ? [...items, index] : items), []);
  if (!indexes.length) {
    data.背包.push(id);
    return true;
  }
  for (let i = indexes.length - 1; i >= 1; i -= 1) data.背包.splice(indexes[i], 1);
  return indexes.length > 1;
}

/**
 * 2026-09-04落地期间的短暂本地实现曾在换锁后把唯一新钥匙留在玩家背包。
 * 当前产品语义是玩家只负责运输与安装，完成后由许曼君保管；只迁移这一种已成立硬事实，
 * 不为仅有完成ID的旧档猜测或生成钥匙。
 */
function 修正换锁后新钥匙归属(data: SchemaType): boolean {
  const state = 路线(data);
  if (!state.换锁完成 || state.新钥匙位置 !== '玩家背包') return false;
  移除全部背包项(data, 许曼君离婚新钥匙ID);
  state.新钥匙位置 = '许曼君保管';
  return true;
}

function 登记CG(data: SchemaType, id: keyof typeof CG标题表): void {
  if (!路线(data).CG回忆.includes(id)) 路线(data).CG回忆.push(id);
}

export function 许曼君离婚CG标题(id: string): string {
  return CG标题表[id as keyof typeof CG标题表] ?? '许曼君 · 离婚';
}

export function 许曼君离婚目标CG(目标: 许曼君离婚终幕目标): string {
  return 目标 === '红本' ? 'XMJ-DIV-08' : 目标 === '婚戒' ? 'XMJ-DIV-09' : 'XMJ-DIV-10';
}

export function 许曼君离婚结果CG(目标: 许曼君离婚终幕目标): string {
  return 目标 === '红本' ? 'XMJ-DIV-11' : 目标 === '婚戒' ? 'XMJ-DIV-12' : 'XMJ-DIV-13';
}

export function 许曼君离婚结局背景CG(data: SchemaType, 地点: string): string {
  if (地点 !== '201' || !许曼君离婚已完成(data)) return '';
  return ['早上', '中午', '下午'].includes(当前时段(data)) ? 'XMJ-DIV-04' : 'XMJ-DIV-05';
}

export function 许曼君离婚次晨CG(data: SchemaType): string {
  return 许曼君离婚已完成(data) ? 'XMJ-DIV-15' : '';
}

/** 刷新、重载或重新进入201时，只从持久检查点恢复当前应在场的横向事件CG。 */
export function 许曼君离婚检查点CG(data: SchemaType, location: string): string {
  const state = 路线(data);
  if (location !== '201' || state.阶段 !== '最后一笔中') return '';
  if (state.H阶段 === 'H2') return 'XMJ-DIV-06';
  if (state.H阶段 === '待H3') return 'XMJ-DIV-07';
  const target = state.终幕目标 as 许曼君离婚终幕目标;
  if (!许曼君离婚终幕目标列表.includes(target)) return '';
  if (state.H阶段 === 'H8') return 许曼君离婚目标CG(target);
  if ((state.H阶段 === 'H8结果待演' || state.H阶段 === 'H9') && state.H8状态 === '已确认') {
    return 许曼君离婚结果CG(target);
  }
  return '';
}

function 下一日下午(当前绝对时段: number): number {
  const 当前日首 = Math.floor(Math.max(0, 当前绝对时段) / 每天时段数) * 每天时段数;
  return 当前日首 + 每天时段数 + 2;
}

function 下一个下午(当前绝对时段: number): number {
  const 当前 = Math.max(0, Math.floor(当前绝对时段));
  const 当日序号 = 当前 % 每天时段数;
  return 当前 + (当日序号 <= 2 ? 2 - 当日序号 : 每天时段数 - 当日序号 + 2);
}

function 妻在201(data: SchemaType): boolean {
  const node = data.户['201'];
  return Boolean(node && 妻位置推算('201', data.系统._绝对时段, node) === '201');
}

function 自有剧情票(text: string): boolean {
  return String(text ?? '').includes('【许曼君离婚提交:');
}

function 普通强剧情冲突(data: SchemaType, location: string): boolean {
  return 有地点动作剧情冲突(data, location, 自有剧情票);
}

function 父亲或其他硬隔离(data: SchemaType): boolean {
  return Boolean(
    data.系统._坏结局 ||
      data.系统._特殊场景.id ||
      data.系统._荣耀洞拍 >= 0 ||
      data.系统._父亲通话.标识 ||
      data.系统._父亲通话.状态 ||
      data.系统._待接来电.期 >= 0,
  );
}

function 医院阻断(data: SchemaType): string {
  return 处于医院硬锁(data, '201') ? '许曼君正在医院待产或恢复，《离婚》保留当前检查点并顺延。' : '';
}

function 入口阻断(data: SchemaType, location: string, 允许绑定亲密 = false): string {
  if (data.系统._坏结局) return '当前坏结局已经锁定。';
  if (!允许绑定亲密 && data.系统._性爱场景.状态 !== '空闲') return '先把当前亲密场景正常收束。';
  if (允许绑定亲密 && !许曼君离婚接管普通收尾(data)) return '当前普通亲密场次不是《最后一笔》绑定场次。';
  if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) return '当前特殊场景尚未结束。';
  if (普通强剧情冲突(data, location)) return '还有一段强剧情没有完成。';
  if (data.系统._父亲通话.标识 || data.系统._父亲通话.状态 || data.系统._待接来电.期 >= 0) return '先处理当前父亲电话。';
  return 医院阻断(data);
}

export function 许曼君离婚商店已上架(data: SchemaType): boolean {
  return Boolean(
    !data.系统._坏结局 &&
      分居完成(data) &&
      路线(data).阶段 === '未开始' &&
      !data.背包.includes(许曼君离婚商品ID) &&
      !许曼君离婚已完成(data),
  );
}

export function 购买许曼君离婚(data: SchemaType, price: number): 许曼君离婚结果 {
  if (!许曼君离婚商店已上架(data)) {
    return { 成功: false, 提示: '《离婚》尚未开放、已经购买、已经启动或已经完成。' };
  }
  if (!Number.isFinite(price) || price <= 0) return { 成功: false, 提示: '《离婚》的价格配置无效。' };
  if (data.现金 < price) return { 成功: false, 提示: '钱不够。' };
  data.现金 -= price;
  data.背包.push(许曼君离婚商品ID);
  const state = 路线(data);
  state.阶段 = '已购买';
  state.道具已购买 = true;
  state.封存盒位置 = '背包';
  return {
    成功: true,
    变动: true,
    提示: '《离婚》·红色封存盒已经放进背包。请在201的傍晚或晚上主动使用；购买本身不会改变婚姻、钥匙或住户状态。',
  };
}

function 目标从选择动作(action: 许曼君离婚动作ID): 许曼君离婚终幕目标 | null {
  if (action === '选择红本') return '红本';
  if (action === '选择婚戒') return '婚戒';
  if (action === '选择戒印') return '戒印';
  return null;
}

function 是安全夜晚(data: SchemaType): boolean {
  return ['傍晚', '晚上'].includes(当前时段(data));
}

function 结局后亲密可用(data: SchemaType, location: string): boolean {
  const node = data.户['201'];
  return Boolean(
    location === '201' &&
      node &&
      许曼君离婚已完成(data) &&
      ['继续关系', '暂不承诺'].includes(data.系统._许曼君分居.玩家最终关系选择) &&
      data.系统._性爱场景.状态 === '空闲' &&
      data.玩家资源.体力.当前值 > 0 &&
      (node.妻.当前阶段 ?? 0) >= 3 &&
      妻在201(data) &&
      !父亲或其他硬隔离(data) &&
      !普通强剧情冲突(data, location) &&
      !处于医院硬锁(data, '201'),
  );
}

export function 许曼君离婚地点动作(data: SchemaType, location: string): 许曼君离婚地点动作视图[] {
  const state = 路线(data);

  if (结局后亲密可用(data, location)) {
    return [
      {
        id: '和她亲密',
        kicker: 'INTIMACY',
        icon: 'heart',
        文案: '和她亲密',
        提示: '只决定第一楼由谁先开场；正文成功后立即进入现有普通亲密场景。',
        选项: [
          { id: '由我开始', kicker: 'PLAYER', 文案: '由我开始', 提示: '由玩家先开场。' },
          { id: '让她开始', kicker: 'HER', 文案: '让她开始', 提示: '由许曼君先发起，但不建立持续主导权。' },
        ],
      },
    ];
  }

  const allowBound = state.阶段 === '最后一笔中' && ['H7', 'H8'].includes(state.H阶段);
  if (入口阻断(data, location, allowBound)) return [];

  if (state.阶段 === '已购买' && location === '201' && 是安全夜晚(data) && 妻在201(data)) {
    return [{ id: '使用红色封存盒', kicker: 'START', icon: 'story', 文案: '使用《离婚》·红色封存盒' }];
  }
  if (
    state.阶段 === '待办理' &&
    location === '大堂' &&
    state.办理预约时段 === data.系统._绝对时段 &&
    当前时段(data) === '下午'
  ) {
    return [{ id: '陪她去办最后手续', kicker: 'DIVORCE', icon: 'story', 文案: '陪她去办最后手续' }];
  }
  if (state.阶段 === '待公开站位' && location === '大堂') {
    return [
      {
        id: '当着赵国强牵住她',
        kicker: 'WITNESS',
        icon: 'heart',
        文案: '选择你在出口处的位置',
        选项: [
          { id: '当着赵国强牵住她', kicker: 'PUBLIC', 文案: '当着赵国强牵住她' },
          { id: '等赵国强离开再抱她', kicker: 'PRIVATE', 文案: '等赵国强离开再抱她' },
        ],
      },
    ];
  }
  if (state.阶段 === '待归档旧钥匙' && location === '管理员室') {
    return [{ id: '归档201前住户旧钥匙', kicker: 'ARCHIVE', icon: 'edit', 文案: '归档201前住户旧钥匙' }];
  }
  if (state.阶段 === '待归档确认' && location === '管理员室') {
    return [{ id: '确认201继续由她居住', kicker: 'CONFIRM', icon: 'story', 文案: '和她确认归档后的201' }];
  }
  if (state.阶段 === '待领取新锁' && location === '管理员室') {
    return [{ id: '领取201新锁芯和钥匙', kicker: 'NEW LOCK', icon: 'tool', 文案: '领取201新锁芯和配套钥匙' }];
  }
  if (state.阶段 === '待换锁' && location === '201' && 妻在201(data)) {
    return [{ id: '更换201锁芯', kicker: 'CHANGE LOCK', icon: 'tool', 文案: '更换201锁芯' }];
  }
  if (
    state.阶段 === '待非成人收束' &&
    location === '201' &&
    妻在201(data) &&
    data.系统._绝对时段 >= state.重试最早时段
  ) {
    return [{ id: '完成非成人收束', kicker: 'CLOSING', icon: 'story', 文案: '和她把今后的边界说清楚' }];
  }
  if (
    state.阶段 === '待最后一笔' &&
    state.邀请状态 === '已送达' &&
    location === '201' &&
    是安全夜晚(data) &&
    妻在201(data) &&
    data.系统._绝对时段 >= state.重试最早时段
  ) {
    return [{ id: '开始最后一笔', kicker: 'FINAL ACT', icon: 'story', 文案: '赴《最后一笔》的邀请' }];
  }
  if (state.阶段 === '最后一笔中' && state.H阶段 === 'H2' && location === '201') {
    return [{ id: '打开红色封存盒', kicker: 'H2', icon: 'edit', 文案: '打开红色封存盒' }];
  }
  if (state.阶段 === '最后一笔中' && state.H阶段 === '待H3' && location === '201') {
    return [
      {
        id: '选择红本',
        kicker: 'TARGET',
        icon: 'heart',
        文案: '选择这次封存目标',
        提示: '目标由脚本冻结，后续不能换目标或合并目标。',
        选项: [
          { id: '选择红本', kicker: 'BOOK', 文案: '红本' },
          { id: '选择婚戒', kicker: 'RING', 文案: '婚戒' },
          { id: '选择戒印', kicker: 'IMPRINT', 文案: '戒印' },
        ],
      },
    ];
  }
  if (state.阶段 === '最后一笔中' && state.H阶段 === 'H7' && location === '201') {
    return [
      {
        id: '摆好锁定目标',
        kicker: 'H7',
        icon: 'edit',
        文案: `摆好锁定目标：${state.终幕目标 || '未记录'}`,
        提示: '从这一步开始，普通脸部、胸部、体内及其他普通收尾入口全部关闭。',
      },
    ];
  }
  if (state.阶段 === '最后一笔中' && state.H阶段 === 'H8' && location === '201') {
    return [
      {
        id: '确认射在这里',
        kicker: 'H8',
        icon: 'heart',
        文案: `当前锁定目标：${state.终幕目标 || '未记录'}`,
        选项: [
          { id: '确认射在这里', kicker: 'CONFIRM', 文案: '确认射在这里' },
          { id: '停下，今晚不封存', kicker: 'STOP', 文案: '停下，今晚不封存' },
        ],
      },
    ];
  }
  if (state.阶段 === '最后一笔中' && state.H阶段 === 'H8结果待演' && location === '201') {
    return [{ id: '完成H8结果演出', kicker: 'H8 RESULT', icon: 'story', 文案: `看清已经留在${state.终幕目标 || '目标'}上的结果` }];
  }
  if (state.阶段 === '最后一笔中' && state.H阶段 === 'H9' && location === '201') {
    if (state.终幕目标 !== '戒印') {
      return [{ id: '封存选定物件', kicker: 'H9', icon: 'edit', 文案: '封存选定物件' }];
    }
    if (state.戒印长按失败次数 >= 2) {
      return [{ id: '让许曼君按下去', kicker: 'ASSIST', icon: 'heart', 文案: '让许曼君按下去' }];
    }
    return [
      {
        id: '把戒指压进红色封皮',
        kicker: 'HOLD 1.2S',
        icon: 'tool',
        文案: '把戒指压进红色封皮',
        选项: [
          {
            id: '把戒指压进红色封皮',
            kicker: 'HOLD',
            文案: '按住1.2秒完成',
            提示: `当前失败 ${state.戒印长按失败次数}/2 次`,
            长按毫秒: 1200,
            短按动作: '戒印长按失败',
          },
        ],
      },
    ];
  }
  return [];
}

function actionPayload(action: 离婚剧情动作, payload: string): string {
  if (action === '办理见证' || action === 'H7摆目标' || action === 'H8结果' || action === 'H9封存') return payload;
  return '-';
}

function codeOf(action: 离婚剧情动作): string {
  if (action === '预约办理') return 'S';
  if (action === '办理等待') return 'L1';
  if (action === '办理见证') return 'L2';
  if (action === '归档确认') return 'K1';
  if (action === 'H1婚纱开门') return 'H1';
  if (action === 'H2开盒') return 'H2';
  if (action === 'H7摆目标') return 'H7';
  if (action === 'H8结果') return 'H8';
  if (action === 'H9封存') return 'H9';
  return 'N';
}

function actionOf(code: string): 离婚剧情动作 | null {
  if (code === 'S') return '预约办理';
  if (code === 'L1') return '办理等待';
  if (code === 'L2') return '办理见证';
  if (code === 'K1') return '归档确认';
  if (code === 'H1') return 'H1婚纱开门';
  if (code === 'H2') return 'H2开盒';
  if (code === 'H7') return 'H7摆目标';
  if (code === 'H8') return 'H8结果';
  if (code === 'H9') return 'H9封存';
  if (code === 'N') return '非成人收束';
  return null;
}

function actorMarker(action: 离婚剧情动作, payload = '-'): string {
  if (action === '办理见证' && payload === '当着赵国强牵住她') return '【事件在场妻:201】【事件在场夫:201】';
  return action === '办理等待' || action === '办理见证'
    ? '【事件在场妻:201】【事件关联夫:201】'
    : '【事件在场妻:201】';
}

function storyEvent(data: SchemaType, action: 离婚剧情动作, payload = '-'): string {
  const state = 路线(data);
  const encoded = actionPayload(action, payload);
  const marker =
    `${actorMarker(action, payload)}【许曼君离婚提交:${codeOf(action)}:${state.阶段}:${data.系统._绝对时段}:1:${encoded}】` +
    `【场景剧情连续锁场】【许曼君·离婚·${action}】`;
  if (action === '预约办理') {
    return `${marker}地点固定在201，只有玩家与许曼君。红色封存盒仍在玩家手里，本回合只把正式离婚办理约到第二天下午。不得生成、展示或暗示已经拿到离婚证；不得演赵国强到场、钥匙归档、换锁或婚纱终幕。许曼君明确这是她自己的决定，并亲口确认第二天下午由夫妻本人办理，玩家只陪到现场。`;
  }
  if (action === '办理等待') {
    return `${marker}地图地点固定在大堂，但正文演出的是办事窗口外的等候区。玩家只在外等待，许曼君与赵国强作为夫妻本人进入办理。当前是第1回合，不能生成离婚证、不能让任何人拿证出来、不能提前牵手或拥抱，也不能归档钥匙或换锁。结尾停在办理仍在进行。`;
  }
  if (action === '办理见证') {
    const choice = payload as 许曼君离婚公开选择;
    return `${marker}继续同一办事地点的第2回合。许曼君必须持她本人刚办好的离婚证从里面出来，法律离婚就在本回合真实成立。玩家已经选择“${choice}”，只按这个选择演出出口处的见证：${choice === '当着赵国强牵住她' ? '赵国强仍看得见时，玩家牵住许曼君。' : '先让赵国强离开视线，再由玩家抱住许曼君。'}这个选择只冻结见证方式，不改变《分居》里已经作出的长期关系选择。不得提前归档钥匙、发新钥匙、换锁或开始《最后一笔》。`;
  }
  if (action === '归档确认') {
    return `${marker}地点固定在管理员室，只有玩家与许曼君。201前住户旧钥匙已经由脚本真实归档，赵国强正式退居的硬结果也已经成立，绝对不能把钥匙拿回、撤销归档或恢复丈夫作息。本回合只演归档后的确认：许曼君亲眼确认旧钥匙进入前住户档案，并明确201继续由她独立居住。不得提前领取新锁芯、生成新钥匙、换锁、发送邀请或开始《最后一笔》。`;
  }
  if (action === 'H1婚纱开门') {
    return `${marker}地点固定在201，只有玩家与许曼君。她穿着旧婚纱开门，把玩家迎进已经换锁的201。当前只完成H1婚纱开门：写出她主动选择这身旧婚纱，以及两人进入房内的张力；红色封存盒仍未打开，不能选择红本、婚戒或戒印，不能提前进入性行为、射精、封盒或宣布结局完成。`;
  }
  if (action === 'H2开盒') {
    return `${marker}地点固定在201，只有玩家与许曼君。当前只完成H2：由许曼君或玩家把红色封存盒真正打开，露出红本、婚戒和用于戒印的红色封皮三种候选物件。不得在本回合选择或冻结目标，不得解开婚纱、进入亲密行为、摆放H7目标、出现射精结果、封盒或宣布结局完成。结尾停在三个候选物件已经可见、等待玩家下一步结构化选择。`;
  }
  if (action === 'H7摆目标') {
    const target = payload as 许曼君离婚终幕目标;
    return `${marker}地点固定在201，只有玩家与许曼君。H3～H6四个有效亲密回合已经真实完成，唯一目标早已冻结为“${target}”。当前只演H7：由双方按“${target}”分支把唯一物件摆到脚本指定位置，并明确普通脸部、胸部、体内及其他普通收尾全部关闭。不得更换或增加目标，不得在本回合射精、出现H8结果、封盒或宣布结局完成。`;
  }
  if (action === 'H8结果') {
    const target = payload as 许曼君离婚终幕目标;
    const detail = target === '红本' ? '红本上已经留下唯一结果' : target === '婚戒' ? '婚戒与透明浅皿中已经留下唯一结果' : '用于戒印的婚戒与红色封皮上已经留下唯一结果';
    return `${marker}地点固定在201，只有玩家与许曼君。H8已经由脚本精确结束普通亲密账，目标固定为“${target}”，${detail}，而且本次不会触发受孕。当前只演已经成立的H8结果与双方当下反应；不得再发生第二次射精、再次高潮、换目标、合并目标、提前压出戒印、封盒或宣布结局完成。结尾把唯一结果完整留给H9封存。`;
  }
  if (action === 'H9封存') {
    const target = payload as 许曼君离婚终幕目标;
    const detail =
      target === '红本'
        ? '把已经留下结果的红本装进透明套，再放回红色封存盒。'
        : target === '婚戒'
          ? '把已经留下结果的婚戒连同透明浅皿一起放回红色封存盒。'
          : '戒指已经压进红色封皮留下戒印；把这本戒印红本放回红色封存盒。';
    return `${marker}地点固定在201，只有玩家与许曼君。H8已经由脚本精确结束普通亲密账，结果目标固定为“${target}”，不得换目标、合并目标或再发生一次射精。当前只演H9：${detail}最后必须由许曼君亲手合上并封好红色盒子，把它放进两人的私密抽屉。不得公开到朋友圈、姐妹群或赵国强认知，也不得把系统变量或“完成ID”写进正文。`;
  }
  return `${marker}地点固定在201，只有玩家与许曼君。法律离婚、旧钥匙归档、赵国强正式退居和201换锁都已经成立；玩家在《分居》中选择了退出关系。本回合只完成非成人收束：两人明确今后的边界，许曼君继续独自住201，玩家不恢复恋爱、留宿或亲密权限。不得出现婚纱、红盒终幕或任何性行为。`;
}

export function 解析许曼君离婚剧情事件(event: string): 许曼君离婚剧情票 | null {
  const match = String(event ?? '').match(/【许曼君离婚提交:(S|L1|L2|K1|H1|H2|H7|H8|H9|N):([^:】]+):(\d+):(\d+):([^】]+)】/u);
  if (!match) return null;
  const action = actionOf(match[1]);
  if (!action) return null;
  const time = Number(match[3]);
  const beat = Number(match[4]);
  if (!Number.isInteger(time) || !Number.isInteger(beat) || beat !== 1) return null;
  return { 动作: action, 预期阶段: match[2] as 离婚阶段, 请求时段: time, 拍: beat, 载荷: match[5] };
}

/** 当前事实与引文、条件、疑问分别处理；只供本路线已有事实模板使用。 */
function 离婚事实候选句(text: string): string[] {
  const original = String(text ?? '').normalize('NFKC');
  const body = original.replace(/“[^”]*”|‘[^’]*’|「[^」]*」|『[^』]*』|"[^"]*"/gu, (quote: string, index: number) => {
    const before = original.slice(0, index).split(/[。！？!?；;\n，,]/u).at(-1) ?? '';
    const after = original.slice(index + quote.length).split(/[。！？!?；;\n，,]/u)[0];
    const reported = /引用|复述|转述|回忆|想象|假设|举例|说过|问(?:她|他|你|道|:|：)|(?:昨天|以前|之前|曾经|当时).*(?:说|写|提)|(?:没|没有|并未|不是|不会).*(?:说|表示|确认)/u.test(before);
    const described = /^(?:这句话|这件事|这句|的说法)?(?:只)?(?:是|为).*(?:假设|例子|引文|原话)|不是.*(?:事实|实际发生)/u.test(after);
    // 留下分隔符，不能把引用前的主体与引用后的动作拼成一件从未发生的事。
    return reported || described ? '；' : quote.slice(1, -1);
  });
  return (body.match(/[^。！？!?；;\n]+[。！？!?；;]?/gu) ?? [])
    .map(sentence => sentence.trim()).filter(Boolean);
}

function 离婚事实匹配有效(sentence: string, match: RegExpExecArray, currentOnly: boolean): boolean {
  const start = match.index;
  const end = start + match[0].length;
  const before = sentence.slice(0, start);
  // 否定作用域从本分句开始；不能用上一件事的“没有”否定本件事。
  const prefix = before.split(/[,，]|(?:但是|但现在|而是|却)/u).at(-1) ?? '';
  const suffix = sentence.slice(end).split(/[,，:：]/u)[0];
  const scope = (prefix + match[0]).replace(/(?:没有|并未|未曾|不再)(?:犹豫|迟疑|沉默)/gu, '');
  // 条件可以跨逗号支配后面的动作，不能只看匹配片段之前若干字。
  const governing = sentence.slice(0, end).split(/(?:但现在|但是现在|而现在|然而现在)/u).at(-1) ?? '';
  if (/如果|假如|要是|倘若|万一|除非|也许|或许|假设|想象|幻想|梦见/u.test(governing)) return false;
  if (/[?？]|是否|有没有|能不能|会不会|要不要|(?:了|的)?吗/u.test(scope + suffix)) return false;
  if (/没有|并未|尚未|还没|未曾|不曾|未能|没能|不能|不会|不再|不打算|不想|不愿|并非|不是|拒绝|准备|打算|计划|希望|期待|想要|将要|即将|询问|追问|引用|复述|转述|回忆/u.test(scope)) return false;
  if (/没(?!事)|未(?!来|婚|知)|不(?:拿|捧|持|带|牵|握|抱|离开|走远|确认|穿|身着|打开|掀开|揭开|摆|放|合|关|封|归档|继续|肯)/u.test(scope)) return false;
  if (/(?:昨天|以前|之前|曾经|当时).*(?:说|提|表示|确认)/u.test(scope)) return false;
  if (currentOnly) {
    // 出口见证必须是这一拍；归档等已成立硬事实不套用此时态门。
    const past = Math.max(...['昨天', '以前', '之前', '曾经', '当时', '过去'].map(word => governing.lastIndexOf(word)));
    const current = Math.max(...['现在', '此刻', '这时', '如今', '眼下', '这次', '今天'].map(word => governing.lastIndexOf(word)));
    if (past >= 0 && current < past) return false;
  }
  if (/^(?:这件事|这一幕|这句话|的说法)?(?:并未发生|没有发生|尚未发生|是假设|只是假设|不是事实)/u.test(suffix.trim())) return false;
  return true;
}

function positiveSentence(text: string, pattern: RegExp, currentOnly = false): boolean {
  for (const sentence of 离婚事实候选句(text)) {
    const matcher = new RegExp(pattern.source, pattern.flags.replace(/[gy]/gu, '') + 'g');
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(sentence))) {
      if (离婚事实匹配有效(sentence, match, currentOnly)) return true;
      // 首个否定匹配可能吞到后续肯定句；逐起点继续，不能只查看一次 sentence.match。
      matcher.lastIndex = match.index + ((sentence.codePointAt(match.index) ?? 0) > 0xffff ? 2 : 1);
    }
  }
  return false;
}

export function 许曼君离婚正文越拍原因(event: string, text: string): string {
  const ticket = 解析许曼君离婚剧情事件(event);
  const body = String(text ?? '').trim();
  if (!ticket || !body) return '';
  if (ticket.动作 === '预约办理') {
    if (positiveSentence(body, /离婚证.{0,10}(?:拿到|办好|领到|到手)|(?:已经|正式).{0,6}离婚/u)) return '预约回合提前生成了离婚证或法律离婚事实';
    return '';
  }
  if (ticket.动作 === '办理等待') {
    if (positiveSentence(body, /许曼君.{0,16}(?:拿着|捧着|持着).{0,8}离婚证|离婚证.{0,10}(?:拿到|办好|领到)/u)) return '办理第1回合提前生成了离婚证';
    return '';
  }
  if (ticket.动作 === '办理见证') {
    if (!positiveSentence(body, /许曼君.{0,18}(?:拿着|捧着|持着|带着).{0,10}(?:她本人|自己的)?离婚证|(?:她本人|自己的)?离婚证.{0,12}(?:在|落在).{0,8}许曼君/u, true)) {
      return '办理第2回合没有写出许曼君持本人离婚证出来';
    }
    const choice = ticket.载荷 as 许曼君离婚公开选择;
    if (choice === '当着赵国强牵住她' && !positiveSentence(body, /(?:玩家|你|我).{0,10}(?:牵住|握住).{0,8}(?:许曼君|她).{0,8}(?:手|手指)|(?:许曼君|她).{0,8}(?:手|手指).{0,8}(?:被|让).{0,6}(?:玩家|你|我).{0,6}(?:牵住|握住)/u, true)) {
      return '办理第2回合没有完成公开牵手见证';
    }
    if (choice === '等赵国强离开再抱她' && !positiveSentence(body, /赵国强.{0,16}(?:离开|走远|消失).{0,30}(?:玩家|你|我).{0,10}(?:抱住|拥住).{0,8}(?:许曼君|她)/u, true)) {
      return '办理第2回合没有按选择在赵国强离开后拥抱';
    }
    return '';
  }
  if (ticket.动作 === '归档确认') {
    if (!positiveSentence(body, /(?:201)?(?:前住户)?旧钥匙.{0,16}(?:归档|封存|放进|进入).{0,12}(?:档案|钥匙格|档案袋)|许曼君.{0,18}(?:确认|看着).{0,12}(?:旧钥匙|归档)/u)) {
      return '旧钥匙归档后的确认回合没有写出已成立的归档事实';
    }
    if (!positiveSentence(body, /许曼君.{0,18}(?:继续|仍然|以后|长期).{0,12}(?:住在|居住|使用).{0,6}201|201.{0,18}(?:继续|以后).{0,12}(?:由许曼君|归她|她住)/u)) {
      return '归档确认回合没有确认201继续由许曼君居住';
    }
    if (positiveSentence(body, /领取.{0,8}(?:新锁芯|新钥匙)|更换.{0,6}锁芯|新锁.{0,8}(?:装好|换好)/u)) return '归档确认回合提前领取或安装了新锁';
    return '';
  }
  if (ticket.动作 === 'H1婚纱开门') {
    if (!positiveSentence(body, /许曼君.{0,20}(?:穿着|身着).{0,8}(?:旧)?婚纱/u)) return 'H1没有写出许曼君穿婚纱开门';
    if (positiveSentence(body, /做爱|性交|口交|乳交|肛交|插入|抽插|(?:脱下|褪下).{0,8}(?:婚纱|衣服)/u)) return 'H1提前进入了H3之后的亲密内容';
    if (positiveSentence(body, /打开.{0,8}(?:红色)?封存盒|射在|射到|封好.{0,6}(?:红色)?盒/u)) return 'H1提前越过了开盒、H8或H9';
    return '';
  }
  if (ticket.动作 === 'H2开盒') {
    if (!positiveSentence(body, /(?:打开|掀开|揭开).{0,10}(?:红色)?封存盒|(?:红色)?封存盒.{0,10}(?:打开|掀开|揭开)/u)) return 'H2没有真正打开红色封存盒';
    if (positiveSentence(body, /做爱|性交|口交|乳交|肛交|插入|抽插|(?:解开|脱下|褪下).{0,8}(?:婚纱|衣服)/u)) return 'H2提前进入了目标选择之后的亲密内容';
    if (positiveSentence(body, /(?:选定|锁定|决定).{0,8}(?:红本|婚戒|戒印)|射在|射到|射精|封好.{0,6}(?:红色)?盒/u)) return 'H2提前越过了目标选择、H8或H9';
    return '';
  }
  if (ticket.动作 === 'H7摆目标') {
    const target = ticket.载荷 as 许曼君离婚终幕目标;
    if (!许曼君离婚终幕目标列表.includes(target)) return 'H7锁定目标无效';
    const targetPattern = target === '红本' ? /红本/u : target === '婚戒' ? /婚戒|戒指/u : /戒印|红色封皮|戒指/u;
    if (!targetPattern.test(body) || !positiveSentence(body, /(?:摆好|放好|放到|摆到|对准|压在|置于)/u)) return `H7没有把唯一目标“${target}”摆到位`;
    if (positiveSentence(body, /做爱|性交|口交|乳交|肛交|插入|抽插/u)) return 'H7只能摆放唯一目标，不能继续增加普通亲密动作';
    if (positiveSentence(body, /射精|射在|射到|精液|高潮|封好.{0,6}(?:红色)?盒/u)) return 'H7提前生成了H8结果或H9封存';
    return '';
  }
  if (ticket.动作 === 'H8结果') {
    const target = ticket.载荷 as 许曼君离婚终幕目标;
    if (!许曼君离婚终幕目标列表.includes(target)) return 'H8锁定目标无效';
    const resultOK =
      target === '红本'
        ? positiveSentence(body, /红本.{0,18}(?:留下|沾上|落下|覆着|结果|精液)/u)
        : target === '婚戒'
          ? positiveSentence(body, /(?:婚戒|戒指|透明浅皿|浅皿).{0,18}(?:留下|沾上|落下|覆着|结果|精液)/u)
          : positiveSentence(body, /(?:红色封皮|戒印|戒指).{0,18}(?:留下|沾上|落下|覆着|结果|精液)/u);
    if (!resultOK) return `H8没有演出已经锁定在“${target}”上的唯一结果`;
    if (positiveSentence(body, /(?:玩家|你|我|他).{0,12}(?:射精|射出|射在|射到|内射|中出|灌进)/u)) {
      return 'H8结果回合把已经原子成立的结果重新演成了射精动作';
    }
    if (positiveSentence(body, /(?:第二次|再次|又一次|重新).{0,12}(?:射精|高潮|射在|射到)/u)) return 'H8结果回合重复生成了第二次收尾';
    if (positiveSentence(body, /(?:合上|封好).{0,8}(?:红色)?(?:封存)?盒/u)) return 'H8结果回合提前完成了H9封存';
    return '';
  }
  if (ticket.动作 === 'H9封存') {
    const target = ticket.载荷 as 许曼君离婚终幕目标;
    if (positiveSentence(body, /(?:玩家|你|我|他).{0,12}(?:射精|射出|射在|射到|内射|中出|灌进)/u)) {
      return 'H9只能封存既成结果，不能再次演出射精动作';
    }
    const targetOK =
      target === '红本'
        ? positiveSentence(body, /红本.{0,18}(?:透明套|套中).{0,18}(?:放进|收入|装进).{0,8}(?:红色)?(?:封存)?盒/u)
        : target === '婚戒'
          ? positiveSentence(body, /婚戒.{0,18}(?:透明浅皿|浅皿).{0,18}(?:放进|收入|装进).{0,8}(?:红色)?(?:封存)?盒/u)
          : positiveSentence(body, /戒印.{0,8}红本|红色封皮.{0,12}戒印/u);
    if (!targetOK) return `H9没有完成“${target}”分支的唯一封存物件`;
    if (!positiveSentence(body, /许曼君.{0,18}(?:亲手|自己).{0,8}(?:合上|关上|封好).{0,8}(?:红色)?(?:封存)?盒/u)) return 'H9没有由许曼君亲手封盒';
    return '';
  }
  if (/(?:做爱|性交|口交|乳交|插入|抽插|射精|内射|中出|婚纱|封存盒)/u.test(body)) return '退出关系的非成人收束混入了亲密或终幕内容';
  return '';
}

export function 许曼君离婚事件需赵国强在场(event: string): boolean {
  const ticket = 解析许曼君离婚剧情事件(event);
  return ticket?.动作 === '办理见证' && ticket.载荷 === '当着赵国强牵住她';
}

export function 许曼君离婚剧情演员错误(event: string, wives: readonly string[], husbands: readonly string[]): string {
  const ticket = 解析许曼君离婚剧情事件(event);
  if (!ticket) return '';
  const wifeOK = wives.length === 1 && wives[0] === '201';
  if (!wifeOK) return '当前拍的妻子演员必须且只能是许曼君';
  const legal = ticket.动作 === '办理等待' || ticket.动作 === '办理见证';
  if (legal) {
    const related = new Set([...event.matchAll(/【事件(?:在场夫|关联夫):([\d,]+)】/gu)].flatMap(match => match[1].split(',')));
    if (related.size !== 1 || !related.has('201')) return '办理现场必须关联且只能关联赵国强';
    if (许曼君离婚事件需赵国强在场(event)) {
      return husbands.length === 1 && husbands[0] === '201' ? '' : '当面见证必须由赵国强在场';
    }
    return husbands.length ? '等待或离开后见证只关联赵国强，不把他作为当前在场演员' : '';
  }
  return husbands.length ? '当前201私人回合不允许赵国强在场' : '';
}

export function 执行许曼君离婚地点动作(
  data: SchemaType,
  action: 许曼君离婚动作ID,
  location: string,
  _floor = -1,
): 许曼君离婚结果 {
  const state = 路线(data);
  const candidates = 许曼君离婚地点动作(data, location);
  const selectable = candidates.some(item => item.id === action || item.选项?.some(option => option.id === action));
  if (!selectable && action !== '戒印长按失败') return { 成功: false, 提示: '地点、时段、人物、物件或《离婚》状态已经变化。' };

  if (action === '使用红色封存盒') {
    const relation = data.系统._许曼君分居.玩家最终关系选择;
    if (relation !== '退出关系' && data.玩家资源.体力.当前值 < 5) {
      return { 成功: false, 提示: '完整《最后一笔》需要至少5点体力才能安全启动；当前体力不足5点。' };
    }
    return { 成功: true, 提示: '本回合只约定第二天下午办理；正文成功后才会消耗背包里的红色封存盒。', 事件: storyEvent(data, '预约办理') };
  }
  if (action === '陪她去办最后手续') {
    return { 成功: true, 提示: '办理共两回合；第1回合玩家在外等待，夫妻本人完成窗口手续。', 事件: storyEvent(data, '办理等待') };
  }
  if (action === '当着赵国强牵住她' || action === '等赵国强离开再抱她') {
    return { 成功: true, 提示: '这个选择只冻结出口处的见证方式，不会改写《分居》的长期关系选择。', 事件: storyEvent(data, '办理见证', action) };
  }
  if (action === '归档201前住户旧钥匙') {
    if (!state.法律离婚已成立 || data.系统._许曼君分居.钥匙位置 !== '管理员室201钥匙格') {
      return { 成功: false, 提示: '同一枚201旧钥匙或法律离婚事实已经变化。' };
    }
    state.旧钥匙状态 = '前住户旧钥匙归档';
    state.赵国强正式退居 = true;
    data.系统._许曼君分居.钥匙用途 = '正式退居';
    data.户['201']!.夫._居住模式 = '正式退居';
    data.户['201']!.夫._预约回楼起 = -1;
    data.户['201']!.夫._预约回楼至 = -1;
    state.阶段 = '待归档确认';
    登记CG(data, 'XMJ-DIV-02');
    return { 成功: true, 变动: true, CG: 'XMJ-DIV-02', 提示: '同一枚201旧钥匙已归档为前住户旧钥匙；赵国强正式退居已经成立。下一回合由许曼君确认201继续由她居住。' };
  }
  if (action === '确认201继续由她居住') {
    return { 成功: true, 提示: '旧钥匙与正式退居不会回滚；本回合只演归档后的201居住确认。', 事件: storyEvent(data, '归档确认') };
  }
  if (action === '领取201新锁芯和钥匙') {
    if (!state.旧钥匙状态.includes('前住户')) return { 成功: false, 提示: '旧钥匙尚未完成归档。' };
    补唯一背包项(data, 许曼君离婚新锁芯ID);
    补唯一背包项(data, 许曼君离婚新钥匙ID);
    state.新锁芯位置 = '玩家背包';
    state.新钥匙位置 = '玩家背包';
    state.阶段 = '待换锁';
    return { 成功: true, 变动: true, 提示: '唯一201新锁芯与配套钥匙已经交给你。新锁芯必须在201亲手安装。' };
  }
  if (action === '更换201锁芯') {
    if (唯一背包数量(data, 许曼君离婚新锁芯ID) !== 1 || 唯一背包数量(data, 许曼君离婚新钥匙ID) !== 1) {
      return { 成功: false, 提示: '新锁芯或配套钥匙的唯一物件账不完整。' };
    }
    移除全部背包项(data, 许曼君离婚新锁芯ID);
    移除全部背包项(data, 许曼君离婚新钥匙ID);
    state.新锁芯位置 = '201已安装';
    state.新钥匙位置 = '许曼君保管';
    state.换锁完成 = true;
    state.换锁完成时段 = data.系统._绝对时段;
    state.邀请最早时段 = data.系统._绝对时段 + 1;
    state.重试最早时段 = data.系统._绝对时段 + 1;
    state.封存盒位置 = '201';
    登记CG(data, 'XMJ-DIV-03');
    if (data.系统._许曼君分居.玩家最终关系选择 === '退出关系') {
      state.阶段 = '待非成人收束';
      state.邀请状态 = '未建立';
      state.重试最早时段 = data.系统._绝对时段;
    } else {
      state.阶段 = '等待邀请';
      state.邀请状态 = '等待时段';
    }
    return { 成功: true, 变动: true, CG: 'XMJ-DIV-03', 提示: '201锁芯已经原子更换；唯一新钥匙已交给许曼君。下一完整世界时段后，她会发来一次持久私聊邀请。' };
  }
  if (action === '完成非成人收束') {
    return { 成功: true, 提示: '退出关系分支只演一个非成人收束回合。', 事件: storyEvent(data, '非成人收束') };
  }
  if (action === '开始最后一笔') {
    return { 成功: true, 提示: '《最后一笔》从H1婚纱开门开始；本回合不会提前打开红盒。', 事件: storyEvent(data, 'H1婚纱开门') };
  }
  if (action === '打开红色封存盒') {
    return { 成功: true, 提示: 'H2需要一个完整AI回合打开红盒并展示三种候选；正文成功后才进入目标选择。', 事件: storyEvent(data, 'H2开盒') };
  }
  const target = 目标从选择动作(action);
  if (target) {
    if (data.玩家资源.体力.当前值 < 4) return { 成功: false, 提示: '《最后一笔》H3～H6需要连续4个有效回合；当前体力不足4点。' };
    return {
      成功: true,
      提示: `目标“${target}”只会在H3有效正文成功后冻结；生成失败不会留下半完成状态。`,
      目标: target,
      需普通亲密回合: true,
    };
  }
  if (action === '摆好锁定目标') {
    const targetNow = state.终幕目标 as 许曼君离婚终幕目标;
    if (!许曼君离婚终幕目标列表.includes(targetNow)) return { 成功: false, 提示: '终幕目标没有冻结。' };
    return { 成功: true, 提示: `H7需要一个完整AI回合摆好唯一目标“${targetNow}”；正文成功前不会开放H8。`, 事件: storyEvent(data, 'H7摆目标', targetNow) };
  }
  if (action === '确认射在这里') {
    return { 成功: true, 提示: '确认后由脚本精确结束当前普通亲密账，不触发受孕或随机普通收尾。', 需H8收尾: '确认' };
  }
  if (action === '停下，今晚不封存') {
    return { 成功: true, 提示: '本次普通亲密场次将安全停止；法律、钥匙与换锁事实全部保留。', 需H8收尾: '停止' };
  }
  if (action === '完成H8结果演出') {
    const targetNow = state.终幕目标 as 许曼君离婚终幕目标;
    if (!许曼君离婚终幕目标列表.includes(targetNow) || state.H8状态 !== '已确认') {
      return { 成功: false, 提示: 'H8硬结果或唯一目标已经变化。' };
    }
    return { 成功: true, 提示: '普通亲密账已经结束；本回合只演唯一既成结果，失败可以安全重试且不会再次结算。', 事件: storyEvent(data, 'H8结果', targetNow) };
  }
  if (action === '戒印长按失败') {
    if (state.阶段 !== '最后一笔中' || state.H阶段 !== 'H9' || state.终幕目标 !== '戒印') {
      return { 成功: false, 提示: '当前不在戒印长按步骤。' };
    }
    if (state.戒印长按失败次数 >= 2) return { 成功: true, 变动: false, 提示: '已经出现许曼君协助按下的补偿操作。' };
    state.戒印长按失败次数 += 1;
    return {
      成功: true,
      变动: true,
      提示: state.戒印长按失败次数 >= 2 ? '两次长按都未完成。现在可以让许曼君亲手按下去。' : '没有按满1.2秒，戒印尚未形成。再试一次。',
    };
  }
  if (action === '封存选定物件' || action === '把戒指压进红色封皮' || action === '让许曼君按下去') {
    const targetNow = state.终幕目标 as 许曼君离婚终幕目标;
    if (!许曼君离婚终幕目标列表.includes(targetNow)) return { 成功: false, 提示: '终幕目标已经失效。' };
    if (targetNow === '戒印' && action === '封存选定物件') return { 成功: false, 提示: '戒印分支必须完成1.2秒长按或使用两次失败后的等价补偿。' };
    if (targetNow !== '戒印' && action !== '封存选定物件') return { 成功: false, 提示: '当前分支不需要戒印长按。' };
    if (action === '让许曼君按下去' && state.戒印长按失败次数 < 2) return { 成功: false, 提示: '补偿操作尚未开放。' };
    return { 成功: true, 提示: 'H9只封存当前唯一目标；正文成功后才写完成ID。', 事件: storyEvent(data, 'H9封存', targetNow) };
  }
  if (action === '由我开始' || action === '让她开始') {
    return {
      成功: true,
      提示: '第一楼只决定开场方向；正文成功后立即建立零进度普通201亲密场次。',
      需普通亲密回合: true,
    };
  }
  return { 成功: false, 提示: '未知的《离婚》动作。' };
}

export function 许曼君离婚H3行动(target: 许曼君离婚终幕目标): string {
  return `【许曼君离婚H3】【目标:${target}】（目标冻结为${target}；许曼君解开旧婚纱并把它放到椅背，双方进入轻接触。只完成H3，不得提前进入H4～H8、射精或封存。）`;
}

export function 解析许曼君离婚H3行动(action: string): 许曼君离婚终幕目标 | null {
  const match = String(action ?? '').match(/【许曼君离婚H3】【目标:(红本|婚戒|戒印)】/u);
  return match ? (match[1] as 许曼君离婚终幕目标) : null;
}

export function 许曼君结局后亲密行动(choice: 许曼君结局后亲密开场选择): string {
  return choice === '由我开始'
    ? '【201结局后亲密开场】【由我开始】（离婚后的201里，由玩家先开场；只演第一楼，把下一步留给玩家。）'
    : '【201结局后亲密开场】【让她开始】（离婚后的201里，由许曼君先发起；在双方直接接触前停住，不建立持续主导权。）';
}

export function 解析许曼君结局后亲密行动(action: string): 许曼君结局后亲密开场选择 | null {
  const match = String(action ?? '').match(/【201结局后亲密开场】【(由我开始|让她开始)】/u);
  return match ? (match[1] as 许曼君结局后亲密开场选择) : null;
}

export function 许曼君离婚亲密系统注入(data: SchemaType): string {
  const state = 路线(data);
  if (state.阶段 !== '最后一笔中' || !['H3', 'H4', 'H5', 'H6'].includes(state.H阶段)) return '';
  const instructions: Record<string, string> = {
    H3: '许曼君解开旧婚纱并放到椅背，只进入轻接触；不得提前正式交合。',
    H4: '只演前戏，承接玩家本轮输入；不得提前进入深度前戏、正式交合或高潮。',
    H5: '进入深度前戏，但不得提前射精或封存目标。',
    H6: '本回合必须真实进入正式阴道交合并推进到临近高潮，但不得射精；H7会由结构化目标CG接管。',
  };
  return `【许曼君《离婚》·最后一笔${state.H阶段}】地点固定201，演员只有玩家与许曼君，目标固定为“${state.终幕目标}”。${instructions[state.H阶段]}不得改目标、增加目标、触发普通收尾或宣告结局完成。`;
}

export function 绑定许曼君离婚亲密场次(data: SchemaType, target: 许曼君离婚终幕目标, floor: number): boolean {
  const state = 路线(data);
  const scene = data.系统._性爱场景;
  if (
    state.阶段 !== '最后一笔中' ||
    state.H阶段 !== '待H3' ||
    scene.状态 === '空闲' ||
    scene.主焦点门牌 !== '201' ||
    Object.keys(scene.参与者).join(',') !== '201'
  ) {
    return false;
  }
  state.终幕目标 = target;
  state.绑定亲密场次标识 = scene.场次标识;
  state.H阶段 = 'H3';
  state.H有效回合 = [];
  state.H8状态 = '未到达';
  state.戒印长按失败次数 = 0;
  if (Number.isInteger(floor) && floor >= 0) state.当前拍 = 3;
  return true;
}

export function 许曼君离婚绑定亲密有效(data: SchemaType): boolean {
  const state = 路线(data);
  const scene = data.系统._性爱场景;
  return Boolean(
    state.阶段 === '最后一笔中' &&
      state.绑定亲密场次标识 &&
      scene.状态 !== '空闲' &&
      scene.场次标识 === state.绑定亲密场次标识 &&
      scene.主焦点门牌 === '201' &&
      Object.keys(scene.参与者).join(',') === '201' &&
      scene.参与者['201'] &&
      !scene.参与者['201'].已退出,
  );
}

export function 许曼君离婚接管普通收尾(data: SchemaType): boolean {
  const state = 路线(data);
  return 许曼君离婚绑定亲密有效(data) && ['H3', 'H4', 'H5', 'H6', 'H7', 'H8'].includes(state.H阶段);
}

export interface 许曼君离婚亲密回合输入 {
  地点: string;
  楼层: number;
  妻在场: readonly string[];
  实际尺度: number;
  当前行为: string;
  正文: string;
}

export function 提交许曼君离婚亲密有效回合(data: SchemaType, input: 许曼君离婚亲密回合输入): 许曼君离婚结果 | null {
  const state = 路线(data);
  if (!['H3', 'H4', 'H5', 'H6'].includes(state.H阶段)) return null;
  if (!许曼君离婚绑定亲密有效(data)) return { 成功: false, 提示: '《最后一笔》绑定的普通201亲密场次已经失效。' };
  if (input.地点 !== '201' || input.妻在场.length !== 1 || input.妻在场[0] !== '201') {
    return { 成功: false, 提示: '《最后一笔》当前回合的地点或演员已经变化。' };
  }
  if (!Number.isInteger(input.楼层) || input.楼层 < 0 || state.H有效回合.includes(input.楼层)) {
    return { 成功: false, 提示: '《最后一笔》当前回合楼层无效或已经提交。' };
  }
  const exactScale = state.H阶段 === 'H3' || state.H阶段 === 'H4' ? 1 : state.H阶段 === 'H5' ? 2 : null;
  if ((exactScale !== null && input.实际尺度 !== exactScale) || (state.H阶段 === 'H6' && input.实际尺度 < 3)) {
    return { 成功: false, 提示: `${state.H阶段}正文实际尺度没有停在本拍边界，当前回合未推进。` };
  }
  if (state.H阶段 === 'H3') {
    const 婚纱已解开 = positiveSentence(
      input.正文,
      /(?:许曼君|她).{0,16}(?:解开|脱下|褪下).{0,12}(?:旧)?婚纱|(?:旧)?婚纱.{0,12}(?:被|由).{0,6}(?:许曼君|她).{0,8}(?:解开|脱下|褪下)/u,
    );
    const 婚纱已放椅背 = /(?:婚纱.{0,16}(?:椅背|椅子)|(?:椅背|椅子).{0,16}婚纱)/u.test(input.正文);
    if (!婚纱已解开 || !婚纱已放椅背) {
      return { 成功: false, 提示: 'H3必须由许曼君解开旧婚纱并放到椅背，再进入轻接触。' };
    }
  }
  if (state.H阶段 === 'H6' && input.当前行为 !== '阴道插入') {
    return { 成功: false, 提示: 'H6必须真实进入阴道交合，不能用其他行为越过。' };
  }
  if (state.H阶段 === 'H6' && positiveSentence(input.正文, /射精|射出|射在|射到|内射|中出|灌进/u)) {
    return { 成功: false, 提示: 'H6只能推进到临近高潮，唯一射精结果必须留给H8脚本原子结算。' };
  }
  state.H有效回合.push(input.楼层);
  const next = state.H阶段 === 'H3' ? 'H4' : state.H阶段 === 'H4' ? 'H5' : state.H阶段 === 'H5' ? 'H6' : 'H7';
  state.H阶段 = next;
  state.当前拍 = next === 'H7' ? 7 : Number(next.slice(1));
  return { 成功: true, 变动: true, 提示: next === 'H7' ? 'H3～H6四个有效回合已经完成。现在摆好脚本锁定的唯一目标。' : `${state.H有效回合.length}/4个有效亲密回合已提交，进入${next}。` };
}

export function 提交许曼君离婚H8硬结果(data: SchemaType, mode: '确认' | '停止', _floor: number): 许曼君离婚结果 {
  const state = 路线(data);
  if (state.阶段 !== '最后一笔中' || state.H阶段 !== 'H8' || state.H8状态 !== '待选择' || !许曼君离婚绑定亲密有效(data)) {
    return { 成功: false, 提示: 'H8状态、绑定场次或演员已经变化。' };
  }
  const target = state.终幕目标 as 许曼君离婚终幕目标;
  if (!许曼君离婚终幕目标列表.includes(target)) return { 成功: false, 提示: 'H8没有合法的锁定目标。' };
  state.绑定亲密场次标识 = '';
  state.当前拍 = mode === '确认' ? 8 : 0;
  if (mode === '停止') {
    state.H8状态 = '已停止';
    state.H阶段 = '未开始';
    state.终幕目标 = '';
    state.H有效回合 = [];
    state.阶段 = '待最后一笔';
    state.重试最早时段 = data.系统._绝对时段 + 1;
    return { 成功: true, 变动: true, 提示: '今晚没有封存。法律离婚、旧钥匙归档、赵国强正式退居与201换锁全部保留；下一个安全夜晚可重试。' };
  }
  state.H8状态 = '已确认';
  state.H阶段 = 'H8结果待演';
  const cg = 许曼君离婚结果CG(target);
  登记CG(data, cg as keyof typeof CG标题表);
  return { 成功: true, 变动: true, CG: cg, 提示: `H8结果已锁定为“${target}”；普通亲密账已精确结束且不会触发受孕。下一AI回合只演这个既成结果。` };
}

export function 结算许曼君离婚亲密中止(data: SchemaType, session: string, endedBy: string): boolean {
  const state = 路线(data);
  if (!state.绑定亲密场次标识 || state.绑定亲密场次标识 !== session || !['H3', 'H4', 'H5', 'H6', 'H7', 'H8'].includes(state.H阶段)) return false;
  if (endedBy !== '角色中止' && endedBy !== '突然离场' && endedBy !== '脚本收尾') return false;
  state.绑定亲密场次标识 = '';
  state.H阶段 = '未开始';
  state.终幕目标 = '';
  state.H有效回合 = [];
  state.H8状态 = '未到达';
  state.阶段 = '待最后一笔';
  state.重试最早时段 = data.系统._绝对时段 + 1;
  return true;
}

function complete(data: SchemaType, branch: '成人' | '非成人', floor: number): void {
  const state = 路线(data);
  state.阶段 = '已完成';
  state.H阶段 = '已完成';
  state.完成分支 = branch;
  state.完成楼层 = Number.isInteger(floor) ? floor : -1;
  state.赵国强正式退居 = true;
  state.邀请状态 = state.邀请状态 === '已送达' ? '已送达' : state.邀请状态;
  data.户['201']!.夫._居住模式 = '正式退居';
  data.户['201']!.夫._预约回楼起 = -1;
  data.户['201']!.夫._预约回楼至 = -1;
  data.系统._许曼君分居.钥匙用途 = '正式退居';
  if (branch === '非成人') data.系统._许曼君分居.留宿201权限 = false;
  if (!data.系统._已完成特殊场景.includes(许曼君离婚场景ID)) data.系统._已完成特殊场景.push(许曼君离婚场景ID);
  data.系统._已完成特殊场景 = data.系统._已完成特殊场景.filter((id, index, items) => id !== 许曼君离婚场景ID || items.indexOf(id) === index);
}

export function 提交许曼君离婚剧情事件(
  data: SchemaType,
  event: string,
  location: string,
  floor: number,
): 许曼君离婚结果 | null {
  const ticket = 解析许曼君离婚剧情事件(event);
  if (!ticket) return null;
  const state = 路线(data);
  if (ticket.请求时段 !== data.系统._绝对时段) return { 成功: false, 提示: '世界时间已经变化，旧《离婚》剧情票未提交。' };
  if (ticket.预期阶段 !== state.阶段) {
    if (state.阶段 === '已完成') return { 成功: true, 变动: false, 提示: '' };
    return { 成功: false, 提示: '《离婚》阶段已经变化，旧剧情票未提交。' };
  }
  const expectedLocation =
    ticket.动作 === '办理等待' || ticket.动作 === '办理见证'
      ? '大堂'
      : ticket.动作 === '归档确认'
        ? '管理员室'
        : '201';
  if (location !== expectedLocation) return { 成功: false, 提示: '《离婚》剧情地点已经变化，本拍未提交。' };
  if (医院阻断(data)) return { 成功: false, 提示: 医院阻断(data) };

  if (ticket.动作 === '归档确认' && state.阶段 !== '待归档确认') return { 成功: false, 提示: '旧钥匙归档确认检查点已经变化。' };
  if (ticket.动作 === 'H2开盒' && (state.阶段 !== '最后一笔中' || state.H阶段 !== 'H2')) return { 成功: false, 提示: 'H2检查点已经变化。' };
  if (ticket.动作 === 'H7摆目标' && (state.阶段 !== '最后一笔中' || state.H阶段 !== 'H7')) return { 成功: false, 提示: 'H7检查点已经变化。' };
  if (ticket.动作 === 'H8结果' && (state.阶段 !== '最后一笔中' || state.H阶段 !== 'H8结果待演' || state.H8状态 !== '已确认')) {
    return { 成功: false, 提示: 'H8既成结果检查点已经变化。' };
  }

  state.当前场景 = ticket.动作;
  state.当前拍 = ticket.拍;
  if (ticket.动作 === '预约办理') {
    if (!data.背包.includes(许曼君离婚商品ID) || state.阶段 !== '已购买') return { 成功: false, 提示: '红色封存盒已经不在背包。' };
    data.背包.splice(data.背包.indexOf(许曼君离婚商品ID), 1);
    state.道具已使用 = true;
    state.封存盒位置 = '201';
    state.办理预约时段 = 下一日下午(data.系统._绝对时段);
    state.阶段 = '待办理';
    state.当前场景 = '';
    state.当前拍 = 0;
    return { 成功: true, 变动: true, 提示: '只完成了办理预约。第二天下午到大堂，点击“陪她去办最后手续”。' };
  }
  if (ticket.动作 === '办理等待') {
    if (state.办理预约时段 !== data.系统._绝对时段 || 当前时段(data) !== '下午') return { 成功: false, 提示: '当前已经不是本次办理预约时点。' };
    state.阶段 = '待公开站位';
    state.当前场景 = '';
    state.当前拍 = 1;
    return { 成功: true, 变动: true, 提示: '夫妻本人仍在办理。下一回合先选择你在出口处的位置。' };
  }
  if (ticket.动作 === '办理见证') {
    const choice = ticket.载荷 as 许曼君离婚公开选择;
    if (choice !== '当着赵国强牵住她' && choice !== '等赵国强离开再抱她') return { 成功: false, 提示: '出口见证选择无效。' };
    state.法律离婚已成立 = true;
    state.玩家公开站位选择 = choice;
    state.阶段 = '待归档旧钥匙';
    state.当前场景 = '';
    state.当前拍 = 2;
    登记CG(data, 'XMJ-DIV-01');
    return { 成功: true, 变动: true, CG: 'XMJ-DIV-01', 提示: '法律离婚已经不可逆成立；完整特殊结局尚未完成。请回管理员室归档同一枚201旧钥匙。' };
  }
  if (ticket.动作 === '归档确认') {
    state.阶段 = '待领取新锁';
    state.当前场景 = '';
    state.当前拍 = 0;
    return { 成功: true, 变动: true, 提示: '许曼君已经确认201继续由她居住。现在可在管理员室领取唯一新锁芯与配套钥匙。' };
  }
  if (ticket.动作 === 'H1婚纱开门') {
    state.阶段 = '最后一笔中';
    state.H阶段 = 'H2';
    state.当前场景 = '';
    state.当前拍 = 1;
    登记CG(data, 'XMJ-DIV-06');
    return { 成功: true, 变动: true, CG: 'XMJ-DIV-06', 提示: 'H1完成。现在用一个完整回合打开红色封存盒。' };
  }
  if (ticket.动作 === 'H2开盒') {
    state.H阶段 = '待H3';
    state.当前场景 = '';
    state.当前拍 = 2;
    登记CG(data, 'XMJ-DIV-07');
    return { 成功: true, 变动: true, CG: 'XMJ-DIV-07', 提示: 'H2完成。红本、婚戒与戒印红封皮已经可见；下一步只选择一个结构化目标。' };
  }
  if (ticket.动作 === 'H7摆目标') {
    const target = ticket.载荷 as 许曼君离婚终幕目标;
    if (!许曼君离婚终幕目标列表.includes(target) || state.终幕目标 !== target) return { 成功: false, 提示: 'H7唯一目标已经变化。' };
    if (!许曼君离婚绑定亲密有效(data)) return { 成功: false, 提示: 'H7绑定的唯一普通201亲密场次已经失效。' };
    state.H阶段 = 'H8';
    state.H8状态 = '待选择';
    state.当前场景 = '';
    state.当前拍 = 7;
    const cg = 许曼君离婚目标CG(target);
    登记CG(data, cg as keyof typeof CG标题表);
    return { 成功: true, 变动: true, CG: cg, 提示: `H7完成。唯一目标“${target}”已经摆好，普通收尾入口全部关闭。` };
  }
  if (ticket.动作 === 'H8结果') {
    const target = ticket.载荷 as 许曼君离婚终幕目标;
    if (!许曼君离婚终幕目标列表.includes(target) || state.终幕目标 !== target) return { 成功: false, 提示: 'H8唯一既成结果已经变化。' };
    state.H阶段 = 'H9';
    state.当前场景 = '';
    state.当前拍 = 8;
    return {
      成功: true,
      变动: true,
      CG: 许曼君离婚结果CG(target),
      提示: `H8结果演出完成；“${target}”上的唯一结果保持不变，现在进入H9封存。`,
    };
  }
  if (ticket.动作 === '非成人收束') {
    if (data.系统._许曼君分居.玩家最终关系选择 !== '退出关系') return { 成功: false, 提示: '非成人收束只属于退出关系分支。' };
    state.封存物件 = '';
    state.封存盒位置 = '201';
    complete(data, '非成人', floor);
    return { 成功: true, 变动: true, 提示: '《离婚》完成。法律、退居与换锁保留；玩家关系、留宿和结局后亲密入口均未恢复。' };
  }
  const target = ticket.载荷 as 许曼君离婚终幕目标;
  if (state.H阶段 !== 'H9' || state.H8状态 !== '已确认' || state.终幕目标 !== target) {
    return { 成功: false, 提示: 'H9目标、H8结果或阶段已经变化。' };
  }
  state.封存物件 = target === '红本' ? '封存的红本' : target === '婚戒' ? '封存的婚戒' : '戒印红本';
  state.封存盒位置 = '私密抽屉';
  state.H阶段 = '已完成';
  state.当前场景 = '';
  state.当前拍 = 9;
  登记CG(data, 'XMJ-DIV-14');
  complete(data, '成人', floor);
  return { 成功: true, 变动: true, CG: 'XMJ-DIV-14', 提示: `《离婚》完成。私密抽屉只读投影为“${state.封存物件}”；不会自动公开。` };
}

/** 时间推进与每次成功正文收口共用；错过预约只顺延，不回滚法律、钥匙或换锁事实。 */
export function 同步许曼君离婚时间节点(data: SchemaType): 许曼君离婚结果 {
  const 新钥匙已修正 = 修正换锁后新钥匙归属(data);
  if (许曼君离婚已完成(data)) {
    const changed = 同步许曼君离婚完成后状态(data);
    return { 成功: true, 变动: changed || 新钥匙已修正, 提示: '' };
  }
  const state = 路线(data);
  if (state.阶段 === '待办理' && state.办理预约时段 >= 0 && data.系统._绝对时段 > state.办理预约时段) {
    state.办理预约时段 = 下一个下午(data.系统._绝对时段);
    return { 成功: true, 变动: true, 提示: '办理时点已经错过，手续顺延到下一个安全下午；既有《分居》事实不重演。' };
  }
  if (
    state.阶段 === '等待邀请' &&
    state.邀请状态 === '等待时段' &&
    state.邀请最早时段 >= 0 &&
    data.系统._绝对时段 >= state.邀请最早时段
  ) {
    state.邀请状态 = '待发送';
    return { 成功: true, 变动: true, 提示: '许曼君已经准备好《最后一笔》的私聊邀请；手机会在当前安全时间线持久写入。' };
  }
  return {
    成功: true,
    变动: 新钥匙已修正,
    提示: 新钥匙已修正 ? '唯一201新钥匙的保管记录已与换锁硬事实对齐。' : '',
  };
}

export function 许曼君离婚邀请待发送(data: SchemaType): boolean {
  return 路线(data).阶段 === '等待邀请' && 路线(data).邀请状态 === '待发送';
}

export function 许曼君离婚邀请文案(): string {
  return '锁已经换好了。今晚你有空的话，回来一趟吧。旧的东西还差最后一笔，我想和你一起把它封起来。';
}

/** 只冻结必须连续收口的现场拍；手续前等待、法律离婚后的跑腿与换锁等待仍可正常过时段。 */
export function 许曼君离婚时间动作阻断原因(data: SchemaType): string {
  const state = 路线(data);
  if (state.阶段 === '待公开站位') return '正式办理仍在同一现场收尾，先完成出口见证选择。';
  if (state.阶段 === '待归档确认') return '201旧钥匙刚完成硬归档，先让许曼君确认201继续由她居住。';
  if (state.阶段 === '最后一笔中') {
    return `《最后一笔》${state.H阶段}尚未收束；先完成当前固定拍、专属结果或安全停止，再推进世界时间。`;
  }
  return '';
}

export function 提交许曼君离婚邀请已送达(data: SchemaType): 许曼君离婚结果 {
  const state = 路线(data);
  if (state.邀请状态 === '已送达' && state.阶段 === '待最后一笔') return { 成功: true, 变动: false, 提示: '' };
  if (state.阶段 !== '等待邀请' || state.邀请状态 !== '待发送') return { 成功: false, 提示: '当前没有待确认送达的《最后一笔》邀请。' };
  state.邀请状态 = '已送达';
  state.阶段 = '待最后一笔';
  state.重试最早时段 = Math.max(state.重试最早时段, data.系统._绝对时段);
  return { 成功: true, 变动: true, 提示: '许曼君的《最后一笔》邀请已经真实写入201私聊。' };
}

function completedFingerprint(data: SchemaType): string {
  return JSON.stringify({
    route: 路线(data),
    completion: data.系统._已完成特殊场景.filter(id => id === 许曼君离婚场景ID),
    husband: data.户['201']?.夫._居住模式,
    separationKey: data.系统._许曼君分居.钥匙用途,
    bag: data.背包.filter(id => [许曼君离婚商品ID, 许曼君离婚新锁芯ID, 许曼君离婚新钥匙ID].includes(id)),
  });
}

/**
 * 只有完成ID的旧档只恢复公开后效：正式离婚、赵国强正式退居与唯一完成标记。
 * 不猜红本/婚戒/戒印，不倒签CG，不凭空制造新锁芯、新钥匙或红色封存盒。
 */
export function 同步许曼君离婚完成后状态(data: SchemaType): boolean {
  if (!已完成ID(data) && 路线(data).阶段 !== '已完成') return false;
  const before = completedFingerprint(data);
  const state = 路线(data);
  const legacyOnly = state.阶段 !== '已完成';
  state.阶段 = '已完成';
  state.法律离婚已成立 = true;
  state.赵国强正式退居 = true;
  if (legacyOnly) {
    state.旧钥匙状态 = '旧档未记录';
    state.新锁芯位置 = '旧档未记录';
    state.新钥匙位置 = '旧档未记录';
    state.邀请状态 = '旧档未记录';
    state.封存盒位置 = '旧档未记录';
    state.封存物件 = '旧档未记录';
    state.完成分支 = '旧档未记录';
    state.终幕目标 = '';
    state.CG回忆 = [];
    state.绑定亲密场次标识 = '';
    state.H有效回合 = [];
    state.H阶段 = '已完成';
  }
  if (!legacyOnly) 修正换锁后新钥匙归属(data);
  data.户['201']!.夫._居住模式 = '正式退居';
  data.户['201']!.夫._预约回楼起 = -1;
  data.户['201']!.夫._预约回楼至 = -1;
  data.系统._许曼君分居.钥匙用途 = '正式退居';
  if (!data.系统._已完成特殊场景.includes(许曼君离婚场景ID)) data.系统._已完成特殊场景.push(许曼君离婚场景ID);
  data.系统._已完成特殊场景 = data.系统._已完成特殊场景.filter((id, index, items) => id !== 许曼君离婚场景ID || items.indexOf(id) === index);
  // 仅清理不应继续存在的启动票和未安装锁芯；旧档不凭空补配套钥匙。
  移除全部背包项(data, 许曼君离婚商品ID);
  if (legacyOnly) 移除全部背包项(data, 许曼君离婚新锁芯ID);
  return before !== completedFingerprint(data);
}

export function 许曼君离婚快照提示(data: SchemaType, location: string): string[] {
  const state = 路线(data);
  const lines: string[] = [];
  if (state.法律离婚已成立) {
    lines.push('【许曼君婚姻硬事实】许曼君与赵国强的法律离婚已经成立；不得再写成尚未离婚、夫妻共同生活或等待第一次摊牌。');
  }
  if (state.赵国强正式退居 || data.户['201']?.夫._居住模式 === '正式退居') {
    lines.push('【201住户硬事实】赵国强已经正式退居，不恢复普通丈夫作息、随机查岗、打断、第一次对质或再次取物。');
  }
  if (location === '201' && state.换锁完成) {
    lines.push('【201门锁硬事实】201已经更换新锁芯；前住户旧钥匙只在管理员室档案中，不能再次开门或生成第二枚封存钥匙。');
  }
  const intimacy = 许曼君离婚亲密系统注入(data);
  if (intimacy) lines.push(intimacy);
  if (state.阶段 === '已完成') {
    lines.push('【许曼君《离婚》已完成】普通正文不得重演《分居》、办理手续或《最后一笔》；私密抽屉物件不会自动公开给朋友圈、姐妹群或赵国强。');
  }
  return lines;
}

export function 许曼君离婚档案提示(data: SchemaType): { 状态: string; 下一步: string; 补充?: string; 完成?: boolean } | null {
  const state = 路线(data);
  if (state.阶段 === '未开始') return 分居完成(data) ? { 状态: '正式结局已开放', 下一步: '去商店特殊场景页购买“许曼君 · 离婚”。' } : null;
  if (state.阶段 === '已购买') return { 状态: '红色封存盒在背包', 下一步: '傍晚或晚上到201主动使用。' };
  if (state.阶段 === '待办理') return { 状态: '已经约定正式办理', 下一步: `在绝对时段${state.办理预约时段}的下午到大堂，点击“陪她去办最后手续”。` };
  if (state.阶段 === '待公开站位') return { 状态: '夫妻本人手续正在收尾', 下一步: '在大堂选择公开牵手，或等赵国强离开后拥抱。' };
  if (state.阶段 === '待归档旧钥匙') return { 状态: '法律离婚已经成立', 下一步: '回管理员室归档同一枚201前住户旧钥匙。' };
  if (state.阶段 === '待领取新锁') return { 状态: '赵国强已经正式退居', 下一步: '在管理员室领取唯一201新锁芯与配套钥匙。' };
  if (state.阶段 === '待换锁') return { 状态: '新锁芯与钥匙在背包', 下一步: '到201执行零回合“更换201锁芯”。' };
  if (state.阶段 === '等待邀请') return { 状态: '201已经换锁', 下一步: '至少经过一个完整世界时段，等待201私聊邀请真实送达。' };
  if (state.阶段 === '待非成人收束') return { 状态: '退出关系分支待收束', 下一步: '到201完成一个非成人边界回合。' };
  if (state.阶段 === '待最后一笔') return { 状态: state.H8状态 === '已停止' ? '今晚没有封存' : '《最后一笔》邀请已送达', 下一步: '在下一个安全傍晚或晚上回201。' };
  if (state.阶段 === '最后一笔中') return { 状态: `《最后一笔》${state.H阶段}`, 下一步: state.H阶段 === 'H2' ? '打开红色封存盒。' : state.H阶段 === '待H3' ? '冻结一个目标并完成H3～H6四个有效回合。' : state.H阶段 === 'H7' ? '摆好唯一锁定目标。' : state.H阶段 === 'H8' ? '确认目标或安全停止。' : state.H阶段 === 'H9' ? '完成唯一物件封存。' : '继续当前亲密回合。' };
  return { 状态: '《离婚》已完成', 下一步: data.系统._许曼君分居.玩家最终关系选择 === '退出关系' ? '201不开放结局后亲密入口。' : '201只保留一块“和她亲密”。', 补充: state.封存物件 || '旧档未记录', 完成: true };
}
