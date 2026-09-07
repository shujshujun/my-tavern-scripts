import type { SchemaType } from '../../schema';
import { 第二机位已完成, 第二机位母带封存键 } from './第二机位系统';
import { 不再留门已完成 } from '../../不再留门契约';
import { 有普通场景剧情阻塞 } from './场景剧情事务';
import { 处于医院硬锁 } from './生产系统';

export const 录像带V4版本 = 4 as const;
export const 录像带V4完成ID = '录像带结局' as const;
export const 录像带V4路线ID = '丈夫结局:录像带V4' as const;
/** 周小满承接尚由独立《不再留门》系统生产；V4只消费这些脚本硬凭据，绝不以L4或丈夫轨道字符串替代。 */
export const 录像带V4周小满承接完成ID = '不再留门' as const;
export const 录像带V4周小满母带封存键 = '录像带结局:周母带封存' as const;
export const 录像带V4周小满丈夫钥匙入盒键 = '录像带结局:202丈夫钥匙入盒' as const;
export const 录像带V4每日日时段数 = 6 as const;
export const 录像带V4固定日常结果摘要 =
  '两户丈夫已在知情自愿条件下完成录像观看；锁具均由本人复锁并经无接触目视核验，两位妻子完成交接后离场。' as const;

export type 录像带V4房间 = '102' | '202';
export type 录像带V4操作类型 = '开始' | '切房' | '下一幕';
export type 录像带V4锁具硬状态 =
  | 'idle'
  | 'locked'
  | 'self-unlocked'
  | 'full-tape-playing'
  | 'husband-completed'
  | 'self-relocked'
  | 'visually-verified'
  | 'settled';

export const 录像带V4微信消息键 = Object.freeze({
  '102': Object.freeze({
    戴锁: '录像带V4:微信:102:戴锁确认',
    同意: '录像带V4:微信:102:知情同意',
  }),
  '202': Object.freeze({
    戴锁: '录像带V4:微信:202:戴锁确认',
    同意: '录像带V4:微信:202:知情同意',
  }),
  联合出发: '录像带V4:微信:联合出发',
});

export interface 录像带V4消息凭据 {
  会话?: unknown;
  发?: unknown;
  类?: unknown;
  键?: unknown;
  标识?: unknown;
}

export interface 录像带V4状态结果 {
  成功: boolean;
  变动: boolean;
  提示: string;
  重复?: boolean;
}

export interface 录像带V4操作计划 {
  路线: typeof 录像带V4路线ID;
  版本: typeof 录像带V4版本;
  场次标识: string;
  操作标识: string;
  操作键: string;
  类型: 录像带V4操作类型;
  基线世代: number;
  基线幕次: number;
  基线房间: 录像带V4房间;
  目标幕次: number;
  目标房间: 录像带V4房间;
  画面键: string;
  需要生成: boolean;
}

export interface 录像带V4规划结果 extends 录像带V4状态结果 {
  计划?: 录像带V4操作计划;
}

const 房间们 = ['102', '202'] as const;

function 结果(成功: boolean, 变动: boolean, 提示: string, 重复 = false): 录像带V4状态结果 {
  return { 成功, 变动, 提示, ...(重复 ? { 重复: true } : {}) };
}

function 是录像带V4房间(值: unknown): 值 is 录像带V4房间 {
  return 值 === '102' || 值 === '202';
}

function 旧录像带已完成(data: SchemaType): boolean {
  return data.系统._已完成特殊场景.some(id => id === '录像带' || id === 录像带V4完成ID);
}

function 旧录像带正在运行(data: SchemaType): boolean {
  if (['录像带前置', '录像带', '录像带双承接'].includes(data.系统._特殊场景.id)) return true;
  return data.系统._录像带双承接.状态 !== '未开始';
}

function V4已完成(data: SchemaType): boolean {
  return data.系统._录像带V4.阶段 === '已完成' || data.系统._录像带V4.场景.状态 === '已完成';
}

function 录像带V4不可新开(data: SchemaType): boolean {
  return Boolean(data.系统._坏结局 || 旧录像带已完成(data) || 旧录像带正在运行(data) || V4已完成(data));
}

export function 录像带V4承接条件已完成(data: SchemaType): boolean {
  const 沈静仪承接完成 = 第二机位已完成(data) && data.系统._特殊场景前置.includes(第二机位母带封存键);
  const 周小满承接完成 = 不再留门已完成(data);
  return 沈静仪承接完成 && 周小满承接完成;
}

export function 录像带V4录像带可购买(data: SchemaType): boolean {
  if (录像带V4不可新开(data) || !录像带V4承接条件已完成(data)) return false;
  return !data.系统._录像带V4.录像带已购买 && !data.背包.includes('录像带');
}

export function 录像带V4贞操锁可购买数量(data: SchemaType): number {
  if (录像带V4不可新开(data) || !录像带V4已经使用(data) || data.系统._录像带V4.场景.状态 !== '未开始') {
    return 0;
  }
  const 已赠 = 房间们.filter(房间 => data.系统._录像带V4.赠锁[房间].已接收).length;
  const 包内 = data.背包.filter(id => id === '男用贞操带').length;
  return Math.max(0, 2 - 已赠 - 包内);
}

export function 登记购买录像带V4(data: SchemaType): 录像带V4状态结果 {
  if (data.系统._录像带V4.录像带已购买) return 结果(true, false, '录像带已经购买。', true);
  if (!录像带V4录像带可购买(data)) return 结果(false, false, '当前还不能购买这盘录像带。');
  data.系统._录像带V4.录像带已购买 = true;
  data.系统._录像带V4.入口规则版本 = 1;
  data.系统._录像带V4.阶段 = '待使用录像带';
  return 结果(true, true, '录像带已经收进背包。主动使用后开始筹备。');
}

/** 旧版购买会误写“待购赠锁”；仅该阶段不足以证明使用。实物准备、赠送或活动场次才算已进入流程。 */
export function 录像带V4已经使用(data: SchemaType): boolean {
  const v = data.系统._录像带V4;
  if (v.录像带已使用) return true;
  if (v.入口规则版本 !== 0 || !v.录像带已购买) return false;
  return Boolean(
    房间们.some(m => v.赠锁[m].已接收 && v.赠锁[m].接收绝对时段 >= 0) ||
    v.阶段 === '待购赠锁' && data.背包.includes('男用贞操带') ||
    v.场景.场次标识 && v.场景.状态 !== '未开始'
  );
}

export function 录像带V4使用阻断(data: SchemaType): string {
  if (录像带V4已经使用(data)) return '录像带已使用，请从当前筹备或观看进度继续。';
  if (录像带V4不可新开(data)) return '现有结局或现场不能重新开启。';
  if (!data.背包.includes('录像带')) return '背包里没有录像带。';
  if (!录像带V4承接条件已完成(data)) return '先完成两条承接，并把两份母带归档到302。';
  if (data.系统._特殊场景.id || data.系统._性爱场景.状态 !== '空闲' || data.系统._荣耀洞拍 >= 0 || 有普通场景剧情阻塞(data) || data.系统._父亲通话.状态 || data.系统._父亲通话.标识) return '请先完成当前现场或电话。';
  if (处于医院硬锁(data, '102') || 处于医院硬锁(data, '202')) return '参与者目前在医院，恢复后再开始筹备。';
  return '';
}

export function 使用录像带V4(data: SchemaType): 录像带V4状态结果 {
  if (录像带V4已经使用(data)) return 结果(true, false, '录像带已经使用，当前流程保持不变。', true);
  const 错误 = 录像带V4使用阻断(data);
  if (错误) return 结果(false, false, 错误);
  const v = data.系统._录像带V4;
  v.录像带已购买 = true; v.录像带已使用 = true; v.入口规则版本 = 1; v.阶段 = '待购赠锁';
  return 结果(true, true, '录像带筹备已开始。准备两把锁，分别交给沈静仪和周小满。');
}

export interface 录像带V4档案提示视图 {
  状态: string;
  下一步: string;
  补充?: string;
  进度?: string;
  完成?: boolean;
}

/** 102／202角色页共用的只读结局攻略；唯一真值仍由录像带V4状态节点提供。 */
export function 读取录像带V4档案提示(data: SchemaType, 房间: 录像带V4房间): 录像带V4档案提示视图 | null {
  if (!是录像带V4房间(房间) || !data.户[房间]) return null;
  const v = data.系统._录像带V4;
  if (V4已完成(data)) {
    return {
      状态: '《录像带》已完成',
      下一步: '两户录像观看与锁具交接已经安全收束，后续按结局日常继续。',
      补充: v.结果摘要 || undefined,
      进度: '共享幕次 19 / 19',
      完成: true,
    };
  }
  if (旧录像带已完成(data)) {
    return {
      状态: '《录像带》已完成',
      下一步: '该存档的录像带结局已经归档，不会重新上架或重复结算。',
      完成: true,
    };
  }
  if (旧录像带正在运行(data)) return null;
  if (v.阶段 === '未开始' || v.阶段 === '待购录像带') {
    if (!录像带V4承接条件已完成(data) || data.系统._坏结局) return null;
    return { 状态: '共享结局已开放', 下一步: '去商店“特殊场景”页购买《录像带》。' };
  }
  if (v.阶段 === '待使用录像带') {
    return { 状态: '《录像带》已购买', 下一步: '打开背包主动使用《录像带》，启动两户共享筹备。' };
  }
  if (v.阶段 === '待购赠锁') {
    const 未送达 = 房间们.filter(门牌 => !v.赠锁[门牌].已接收);
    const 人名 = 未送达.map(门牌 => (门牌 === '102' ? '沈静仪' : '周小满'));
    return {
      状态: '《录像带》筹备中',
      下一步: 未送达.length
        ? `准备两把锁，分别交给沈静仪和周小满。当前还需交给：${人名.join('、')}。`
        : '两把锁已送达，等待路线进入两日准备期。',
      进度: `锁具送达 ${2 - 未送达.length} / 2`,
    };
  }
  if (v.阶段 === '等待两日') {
    return {
      状态: '两把锁已送达',
      下一步: '送达当日不计；完整经过两个游戏日后，等待沈静仪和周小满分别发来微信。',
      进度: '锁具送达 2 / 2',
    };
  }
  if (v.阶段 === '微信确认中') {
    const 本户 = v.微信[房间];
    const 本户人名 = 房间 === '102' ? '沈静仪' : '周小满';
    const 另一户人名 = 房间 === '102' ? '周小满' : '沈静仪';
    const 完成线程 = 房间们.filter(门牌 => v.微信[门牌].戴锁已确认 && v.微信[门牌].同意已确认).length;
    const 下一步 = !本户.戴锁已确认
      ? `等待${本户人名}的戴锁消息真实送达。`
      : !本户.同意已确认
        ? `打开与${本户人名}的私聊，在戴锁消息之后真实回复。`
        : !v.微信.两户确认完成
          ? `本户已确认，继续等待${另一户人名}完成微信确认。`
          : '两户都已确认，等待联合出发通知真实送达。';
    return { 状态: '微信确认中', 下一步, 进度: `已完成线程 ${完成线程} / 2` };
  }
  if (v.阶段 === '监控就绪') {
    return {
      状态: '联合出发已确认',
      下一步: '点击主界面“监控”；系统会先移动到302，再打开CAM-102第1幕。',
      进度: '共享幕次 0 / 19',
    };
  }
  if (v.阶段 === '观看中') {
    const 幕次 = v.场景.共享幕次;
    return {
      状态: '《录像带》观看中',
      下一步:
        幕次 >= 19
          ? '第19幕已提交，点击“结束监控”完成结局。'
          : `当前为CAM-${v.场景.当前房间}；选择切换房间或继续下一幕。`,
      补充: v.场景.中断原因 ? '上次生成没有提交，共享幕次保持不变，可直接重试。' : undefined,
      进度: `共享幕次 ${幕次} / 19`,
    };
  }
  if (v.阶段 === '已安全中断') {
    return {
      状态: '上次观看已安全退出',
      下一步: '录像带已回到背包；重新点击“监控”，从第1幕开始新场次。',
      补充: v.场景.中断原因 || undefined,
      进度: `上次中断 ${v.场景.共享幕次} / 19`,
    };
  }
  return null;
}

function 计算微信到期绝对时段(第二把送达绝对时段: number): number {
  const 送达日 = Math.floor(第二把送达绝对时段 / 录像带V4每日日时段数);
  // 送达当日不计；后续两个自然日必须完整经过，第三日零点才开放必达微信。
  return (送达日 + 3) * 录像带V4每日日时段数;
}

export function 赠送录像带V4贞操锁(data: SchemaType, 房间: 录像带V4房间, 当前绝对时段: number): 录像带V4状态结果 {
  if (!是录像带V4房间(房间)) return 结果(false, false, '这把锁只能分别交给沈静仪或周小满。');
  if (!Number.isInteger(当前绝对时段) || 当前绝对时段 < 0)
    return 结果(false, false, '当前游戏时间无效，不能送出锁具。');
  if (录像带V4不可新开(data) || !录像带V4已经使用(data)) {
    return 结果(false, false, '必须先购买并主动使用录像带，才能安排这两把锁。');
  }
  if (!data.背包.includes('男用贞操带')) return 结果(false, false, '背包里没有可送出的男用贞操锁。');
  const 目标 = data.系统._录像带V4.赠锁[房间];
  if (目标.已接收) return 结果(false, false, '她已经收过这一把；第二把必须交给另一位妻子。');
  if (data.系统._录像带V4.微信.监控就绪 || data.系统._录像带V4.场景.状态 !== '未开始') {
    return 结果(false, false, '录像带安排已经进入后续阶段，不能再改变送锁对象。');
  }

  目标.已接收 = true;
  目标.接收绝对时段 = 当前绝对时段;
  const 已赠数 = 房间们.filter(门牌 => data.系统._录像带V4.赠锁[门牌].已接收).length;
  if (已赠数 < 2) {
    data.系统._录像带V4.阶段 = '待购赠锁';
    return 结果(
      true,
      true,
      房间 === '102' ? '沈静仪收下了锁，会亲自交给顾国栋。' : '周小满收下了锁，会亲自交给何俊生。',
    );
  }

  data.系统._录像带V4.第二把送达绝对时段 = 当前绝对时段;
  data.系统._录像带V4.微信到期绝对时段 = 计算微信到期绝对时段(当前绝对时段);
  data.系统._录像带V4.阶段 = '等待两日';
  return 结果(true, true, '两把锁都已分别送达。送达当日不计，完整经过两个游戏日后，她们会在微信里分别确认。');
}

export function 录像带V4等待已届满(data: SchemaType, 当前绝对时段: number): boolean {
  const 截止 = data.系统._录像带V4.微信到期绝对时段;
  return 录像带V4已经使用(data) && Number.isInteger(当前绝对时段) && 截止 >= 0 && 当前绝对时段 >= 截止;
}

function 有效对方消息(消息: 录像带V4消息凭据, 会话: 录像带V4房间, 键: string): boolean {
  return 消息.发 === '对方' && 消息.会话 === 会话 && 消息.类 !== '撤回' && 消息.键 === 键;
}

function 有联合出发消息(消息: 录像带V4消息凭据): boolean {
  return (
    消息.发 === '对方' && 是录像带V4房间(消息.会话) && 消息.类 !== '撤回' && 消息.键 === 录像带V4微信消息键.联合出发
  );
}

export function 录像带V4待发送戴锁线程(
  data: SchemaType,
  当前消息: readonly 录像带V4消息凭据[],
  当前绝对时段: number,
): 录像带V4房间[] {
  if (
    V4已完成(data) ||
    data.系统._录像带V4.场景.状态 !== '未开始' ||
    !房间们.every(房间 => data.系统._录像带V4.赠锁[房间].已接收) ||
    !录像带V4等待已届满(data, 当前绝对时段)
  ) {
    return [];
  }
  return 房间们.filter(房间 => !当前消息.some(消息 => 有效对方消息(消息, 房间, 录像带V4微信消息键[房间].戴锁)));
}

function 消息身份相同(a: 录像带V4消息凭据, b: 录像带V4消息凭据): boolean {
  if (typeof a.标识 === 'string' && a.标识 && typeof b.标识 === 'string') return a.标识 === b.标识;
  return a === b;
}

/** 第四项确认由当前手机分支里最后落库的那条知情同意稳定消息所属线程负责。 */
export function 选择录像带V4联合出发线程(当前消息: readonly 录像带V4消息凭据[]): 录像带V4房间 | null {
  const 有效 = 当前消息.filter(消息 => 消息.类 !== '撤回');
  const 位置 = (房间: 录像带V4房间): number => {
    for (let i = 有效.length - 1; i >= 0; i -= 1) {
      const 消息 = 有效[i];
      if (有效对方消息(消息, 房间, 录像带V4微信消息键[房间].同意)) return i;
    }
    return -1;
  };
  const 一零二 = 位置('102');
  const 二零二 = 位置('202');
  if (一零二 < 0 || 二零二 < 0) return null;
  return 一零二 > 二零二 ? '102' : '202';
}

export function 录像带V4玩家回复可触发同意(
  当前消息: readonly 录像带V4消息凭据[],
  房间: 录像带V4房间,
  本批玩家消息: readonly 录像带V4消息凭据[],
): boolean {
  if (!是录像带V4房间(房间)) return false;
  const 戴锁位置 = 当前消息.findIndex(消息 => 有效对方消息(消息, 房间, 录像带V4微信消息键[房间].戴锁));
  if (戴锁位置 < 0) return false;
  if (当前消息.some(消息 => 有效对方消息(消息, 房间, 录像带V4微信消息键[房间].同意))) return false;
  return 本批玩家消息.some(玩家消息 => {
    if (玩家消息.会话 !== 房间 || 玩家消息.发 !== '我' || 玩家消息.类 === '撤回') return false;
    const 位置 = 当前消息.findIndex(消息 => 消息身份相同(消息, 玩家消息));
    return 位置 > 戴锁位置;
  });
}

export function 同步录像带V4微信收据(data: SchemaType, 当前消息: readonly 录像带V4消息凭据[]): 录像带V4状态结果 {
  if (!录像带V4已经使用(data)) return 结果(false, false, '录像带尚未主动使用，微信不能启动筹备。');
  const 微信 = data.系统._录像带V4.微信;
  const 原 = JSON.stringify(微信);
  const 原阶段 = data.系统._录像带V4.阶段;
  for (const 房间 of 房间们) {
    微信[房间].戴锁已确认 = 当前消息.some(消息 => 有效对方消息(消息, 房间, 录像带V4微信消息键[房间].戴锁));
    微信[房间].同意已确认 = 当前消息.some(消息 => 有效对方消息(消息, 房间, 录像带V4微信消息键[房间].同意));
  }
  微信.两户确认完成 = 房间们.every(房间 => 微信[房间].戴锁已确认 && 微信[房间].同意已确认);
  const 出发消息 = 当前消息.find(有联合出发消息);
  微信.联合出发已通知 = Boolean(出发消息 && 微信.两户确认完成);
  微信.通知线程 = 微信.联合出发已通知 && 是录像带V4房间(出发消息?.会话) ? 出发消息.会话 : '';
  微信.监控就绪 = 微信.联合出发已通知;

  if (!V4已完成(data) && data.系统._录像带V4.场景.状态 === '未开始') {
    const 已有真实微信凭据 = 房间们.some(房间 => 微信[房间].戴锁已确认 || 微信[房间].同意已确认) || 微信.联合出发已通知;
    if (微信.监控就绪) data.系统._录像带V4.阶段 = '监控就绪';
    else if (已有真实微信凭据) data.系统._录像带V4.阶段 = '微信确认中';
    else if (房间们.every(房间 => data.系统._录像带V4.赠锁[房间].已接收)) data.系统._录像带V4.阶段 = '等待两日';
  }
  const 变动 = 原 !== JSON.stringify(微信) || 原阶段 !== data.系统._录像带V4.阶段;
  return 结果(true, 变动, 变动 ? '录像带微信凭据已按当前时间线同步。' : '录像带微信凭据没有变化。');
}

function 新场景标识合法(场次标识: string): boolean {
  return typeof 场次标识 === 'string' && /^[A-Za-z0-9:_-]{6,160}$/u.test(场次标识);
}

/** V4退出只清理自己占用的通用特殊场景槽，不碰其他剧情可能刚建立的新场次。 */
function 清理录像带V4特殊场景槽(data: SchemaType): void {
  const 特殊 = data.系统._特殊场景;
  if (特殊.id !== '录像带V4') return;
  特殊.id = '';
  特殊.阶段 = '';
  特殊.地点 = '';
  特殊.参与妻 = [];
  特殊.演出妻 = [];
  特殊.演出夫 = [];
  特殊.启动楼层 = -1;
  特殊.当前拍 = 0;
  特殊.议题 = '';
  特殊.重点妻 = '';
  特殊.峰值模式 = '';
  特殊.会后妻 = [];
  特殊.自由循环次数 = 0;
  特殊.交互 = { id: '', 类型: '', 状态: '', 失败次数: 0, 补偿可用: false };
  特殊.会场私聊摘要 = {};
  特殊.会场私聊摘要楼层 = -1;
}

export function 准备录像带V4监控(data: SchemaType, 场次标识: string): 录像带V4状态结果 {
  if (!录像带V4已经使用(data)) return 结果(false, false, '录像带尚未主动使用。');
  const 场景 = data.系统._录像带V4.场景;
  if (场景.状态 === '观看中') {
    if (场景.场次标识 === 场次标识) return 结果(true, false, '当前录像带监控场次已经建立。', true);
    return 结果(false, false, '已有录像带监控场次正在运行，不能被第二次点击覆盖。');
  }
  if (V4已完成(data) || 旧录像带已完成(data)) return 结果(false, false, '录像带结局已经完成。');
  if (旧录像带正在运行(data) || (data.系统._特殊场景.id && data.系统._特殊场景.id !== '录像带V4')) {
    return 结果(false, false, '当前另有特殊场景正在运行。');
  }
  if (data.系统._性爱场景.状态 !== '空闲') {
    return 结果(false, false, '请先结束当前普通亲密场景，再启动录像带监控。');
  }
  if (!data.系统._录像带V4.微信.监控就绪) return 结果(false, false, '两条微信还没有完成戴锁、知情同意和联合出发确认。');
  if (!新场景标识合法(场次标识)) return 结果(false, false, '录像带监控场次标识无效。');
  const 录像带索引 = data.背包.indexOf('录像带');
  if (录像带索引 < 0) return 结果(false, false, '背包里的剧情录像带已经不存在。');

  data.背包.splice(录像带索引, 1);
  场景.场次标识 = 场次标识;
  场景.状态 = '观看中';
  场景.共享幕次 = 0;
  场景.当前房间 = '102';
  场景.请求世代 = 0;
  场景.已提交画面键 = [];
  场景.已提交操作键 = [];
  场景.时间码秒 = 0;
  场景.失败次数 = 0;
  场景.中断原因 = '';
  场景.锁具状态 = { '102': 'idle', '202': 'idle' };
  data.系统._录像带V4.阶段 = '观看中';
  data.系统._特殊场景.id = '录像带V4';
  data.系统._特殊场景.阶段 = '等待第1幕';
  data.系统._特殊场景.地点 = '302';
  data.系统._特殊场景.参与妻 = ['102', '202'];
  // 通用特殊场景演员字段始终保存门牌；人物姓名只属于VTR提示胶囊，不能混入通用消费者。
  data.系统._特殊场景.演出妻 = ['102', '202'];
  data.系统._特殊场景.演出夫 = ['102', '202'];
  data.系统._特殊场景.启动楼层 = -1;
  data.系统._特殊场景.当前拍 = 1;
  data.系统._特殊场景.议题 = '';
  data.系统._特殊场景.重点妻 = '';
  data.系统._特殊场景.峰值模式 = '';
  data.系统._特殊场景.会后妻 = [];
  data.系统._特殊场景.自由循环次数 = 0;
  data.系统._特殊场景.交互 = { id: '', 类型: '', 状态: '', 失败次数: 0, 补偿可用: false };
  data.系统._特殊场景.会场私聊摘要 = {};
  data.系统._特殊场景.会场私聊摘要楼层 = -1;
  return 结果(true, true, '监控线路已经建立，位置锁定在302；先打开CAM-102第1幕。');
}

export function 录像带V4画面键(房间: 录像带V4房间, 幕次: number): string {
  return `VTR-V4-${房间}-B${String(幕次).padStart(2, '0')}`;
}

export function 规划录像带V4操作(
  data: SchemaType,
  输入: { 操作标识: string; 类型: 录像带V4操作类型 },
): 录像带V4规划结果 {
  const 场景 = data.系统._录像带V4.场景;
  if (场景.状态 !== '观看中' || !场景.场次标识 || data.系统._特殊场景.id !== '录像带V4') {
    return { ...结果(false, false, '当前没有可操作的录像带V4监控场次。') };
  }
  if (typeof 输入.操作标识 !== 'string' || !/^[A-Za-z0-9:_-]{3,160}$/u.test(输入.操作标识)) {
    return { ...结果(false, false, '录像带操作标识无效。') };
  }
  const 操作键 = `${场景.场次标识}:${输入.操作标识}`;
  if (场景.已提交操作键.includes(操作键)) {
    return { ...结果(true, false, '这次录像带操作已经提交。', true) };
  }

  let 目标幕次 = 场景.共享幕次;
  let 目标房间 = 场景.当前房间 as 录像带V4房间;
  if (输入.类型 === '开始') {
    if (场景.共享幕次 !== 0) return { ...结果(false, false, '录像带监控已经开始，不能再次提交第1幕。') };
    目标幕次 = 1;
    目标房间 = '102';
  } else if (输入.类型 === '切房') {
    if (场景.共享幕次 < 1) return { ...结果(false, false, '第1幕尚未建立，暂时不能切换监控房间。') };
    if (场景.共享幕次 >= 19) return { ...结果(false, false, '第19幕已经完成，请结束监控。') };
    目标幕次 = 场景.共享幕次 + 1;
    目标房间 = 场景.当前房间 === '102' ? '202' : '102';
  } else if (输入.类型 === '下一幕') {
    if (场景.共享幕次 < 1) return { ...结果(false, false, '请先生成第1幕。') };
    if (场景.共享幕次 >= 19) return { ...结果(false, false, '第19幕已经完成，请结束监控。') };
    目标幕次 = 场景.共享幕次 + 1;
  } else {
    return { ...结果(false, false, '未知的录像带监控操作。') };
  }

  const 画面键 = 录像带V4画面键(目标房间, 目标幕次);
  const 计划: 录像带V4操作计划 = {
    路线: 录像带V4路线ID,
    版本: 录像带V4版本,
    场次标识: 场景.场次标识,
    操作标识: 输入.操作标识,
    操作键,
    类型: 输入.类型,
    基线世代: 场景.请求世代,
    基线幕次: 场景.共享幕次,
    基线房间: 场景.当前房间 as 录像带V4房间,
    目标幕次,
    目标房间,
    画面键,
    需要生成: !场景.已提交画面键.includes(画面键),
  };
  return { ...结果(true, false, '录像带操作计划已冻结。'), 计划 };
}

function 锁具状态随幕次(幕次: number): 录像带V4锁具硬状态 {
  if (幕次 <= 0) return 'idle';
  if (幕次 <= 3) return 'locked';
  if (幕次 === 4) return 'self-unlocked';
  if (幕次 <= 15) return 'full-tape-playing';
  if (幕次 === 16) return 'husband-completed';
  if (幕次 === 17) return 'self-relocked';
  if (幕次 === 18) return 'visually-verified';
  return 'settled';
}

function 计划仍匹配当前状态(data: SchemaType, 计划: 录像带V4操作计划): boolean {
  const 场景 = data.系统._录像带V4.场景;
  return (
    计划.路线 === 录像带V4路线ID &&
    计划.版本 === 录像带V4版本 &&
    场景.状态 === '观看中' &&
    场景.场次标识 === 计划.场次标识 &&
    场景.请求世代 === 计划.基线世代 &&
    场景.共享幕次 === 计划.基线幕次 &&
    场景.当前房间 === 计划.基线房间
  );
}

export function 提交录像带V4操作(data: SchemaType, 计划: 录像带V4操作计划): 录像带V4状态结果 {
  const 场景 = data.系统._录像带V4.场景;
  if (场景.场次标识 === 计划?.场次标识 && 场景.已提交操作键.includes(计划?.操作键)) {
    return 结果(true, false, '这次录像带操作已经提交，不会重复推进。', true);
  }
  if (!计划 || !计划仍匹配当前状态(data, 计划)) {
    return 结果(false, false, '录像带场次或操作世代已经变化，迟到结果已丢弃。');
  }
  const 重算 = 规划录像带V4操作(data, { 操作标识: 计划.操作标识, 类型: 计划.类型 });
  if (!重算.计划) return 结果(false, false, 重算.提示);
  if (
    重算.计划.目标房间 !== 计划.目标房间 ||
    重算.计划.目标幕次 !== 计划.目标幕次 ||
    重算.计划.画面键 !== 计划.画面键 ||
    重算.计划.需要生成 !== 计划.需要生成
  ) {
    return 结果(false, false, '录像带操作目标校验失败。');
  }

  场景.已提交操作键.push(计划.操作键);
  if (计划.需要生成 && !场景.已提交画面键.includes(计划.画面键)) {
    场景.已提交画面键.push(计划.画面键);
  }
  场景.当前房间 = 计划.目标房间;
  场景.共享幕次 = 计划.目标幕次;
  场景.请求世代 += 1;
  场景.时间码秒 += 计划.需要生成 ? 8 : 1;
  场景.中断原因 = '';
  const 锁具状态 = 锁具状态随幕次(场景.共享幕次);
  场景.锁具状态['102'] = 锁具状态;
  场景.锁具状态['202'] = 锁具状态;
  data.系统._特殊场景.阶段 = `第${场景.共享幕次}幕:${场景.当前房间}`;
  data.系统._特殊场景.当前拍 = Math.min(19, 场景.共享幕次 + 1);
  return 结果(true, true, `CAM-${场景.当前房间} 第${场景.共享幕次}幕已经原子提交。`);
}

export function 记录录像带V4操作失败(data: SchemaType, 计划: 录像带V4操作计划, 原因: string): 录像带V4状态结果 {
  if (!计划 || !计划仍匹配当前状态(data, 计划)) {
    return 结果(false, false, '失败回调对应的场次已经变化，未写入当前录像带状态。');
  }
  const 失败签名 = `${计划.操作键}:${String(原因 ?? '').trim() || '未知失败'}`;
  const 场景 = data.系统._录像带V4.场景;
  if (场景.中断原因 === 失败签名) return 结果(true, false, '同一失败已经记录。', true);
  场景.失败次数 += 1;
  场景.中断原因 = 失败签名;
  return 结果(true, true, '本次正文与画面均未提交；共享幕次保持不变，可直接重试。');
}

/**
 * 玩家主动安全退出：当前场次不结算；若已经发生本人解锁，则按事先约定的固定安全程序
 * 记录为“本人复锁＋陪看人远距核验”。录像带退回背包，保留旧场次幕次、CAM与日志供
 * 考古；下次点击监控使用新场次标识从第1幕重新开始，旧请求世代立即失效。
 */
export function 安全中断录像带V4(data: SchemaType, 原因 = '玩家主动安全退出'): 录像带V4状态结果 {
  const 场景 = data.系统._录像带V4.场景;
  if (V4已完成(data)) return 结果(false, false, '录像带结局已经完成，不能再按中断处理。');
  if (场景.状态 === '已安全中断' && data.系统._录像带V4.阶段 === '已安全中断') {
    const 原有录像带 = data.背包.includes('录像带');
    if (!原有录像带) data.背包.push('录像带');
    清理录像带V4特殊场景槽(data);
    return 结果(true, !原有录像带, '录像带场次已经安全退出；下次点击监控会从第1幕重新开始。', true);
  }
  if (场景.状态 !== '观看中' || data.系统._特殊场景.id !== '录像带V4') {
    return 结果(false, false, '当前没有正在播放的录像带V4场次。');
  }
  if (场景.共享幕次 === 19 && 房间们.every(房间 => 场景.锁具状态[房间] === 'settled')) {
    return 结果(false, false, '第19幕已经完整收束，请直接结束监控，不要放弃已经完成的交接。');
  }

  const 已发生解锁 = 场景.共享幕次 >= 4;
  场景.请求世代 += 1;
  场景.状态 = '已安全中断';
  场景.中断原因 = `${String(原因 || '安全退出').trim().slice(0, 120)}；停在第${场景.共享幕次}幕`;
  场景.锁具状态 = 已发生解锁
    ? { '102': 'visually-verified', '202': 'visually-verified' }
    : { '102': 'locked', '202': 'locked' };
  data.系统._录像带V4.阶段 = '已安全中断';
  data.系统._录像带V4.结果摘要 = '';
  if (!data.背包.includes('录像带')) data.背包.push('录像带');
  清理录像带V4特殊场景槽(data);

  return 结果(
    true,
    true,
    已发生解锁
      ? '播放已停止；两名丈夫已分别自行复锁，并由陪看人远距核验。录像带已收回，本场不结算；下次从第1幕重新开始。'
      : '播放已在解锁前停止；两名丈夫保持锁定。录像带已收回，本场不结算；下次从第1幕重新开始。',
  );
}

export function 完成录像带V4(data: SchemaType): 录像带V4状态结果 {
  if (V4已完成(data)) return 结果(true, false, '录像带V4已经完成。', true);
  const 场景 = data.系统._录像带V4.场景;
  if (场景.状态 !== '观看中' || 场景.共享幕次 !== 19) {
    return 结果(false, false, '必须先成功提交第19幕，才能结束录像带监控。');
  }
  const 当前画面 = 录像带V4画面键(场景.当前房间 as 录像带V4房间, 19);
  if (!场景.已提交画面键.includes(当前画面) || 房间们.some(房间 => 场景.锁具状态[房间] !== 'settled')) {
    return 结果(false, false, '第19幕的交接或锁具收束尚未完整提交。');
  }

  场景.状态 = '已完成';
  data.系统._录像带V4.阶段 = '已完成';
  data.系统._录像带V4.结果摘要 = 录像带V4固定日常结果摘要;
  if (!data.系统._已完成特殊场景.includes(录像带V4完成ID)) data.系统._已完成特殊场景.push(录像带V4完成ID);
  清理录像带V4特殊场景槽(data);
  return 结果(true, true, '录像带监控已经安全收束；日常层只接收固定结果摘要。');
}
