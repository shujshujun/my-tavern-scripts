import type { SchemaType } from '../../schema';
import { 门牌列表 } from '../../stageConfig';
import { 当前时段, 妻位置推算 } from './楼层时钟';
import { 处于医院硬锁 } from './生产系统';
import { 许曼君离婚已完成 } from './许曼君离婚系统';

export const 许曼君离婚后日常主题列表 = ['给自己改衣服', '重排201', '给自己留一笔生活钱'] as const;
export type 许曼君离婚后日常主题 = (typeof 许曼君离婚后日常主题列表)[number];

export const 许曼君离婚后日常选择列表 = [
  '陪她把这件事做完',
  '把决定留给她',
  '只处理201房务',
  '听她把边界说清',
] as const;
export type 许曼君离婚后日常选择 = (typeof 许曼君离婚后日常选择列表)[number];
export type 许曼君离婚后日常关系 = '继续关系' | '暂不承诺' | '退出关系';
export type 许曼君离婚后日常拍 = 'D1' | 'D2';
export type 许曼君离婚后日常动作ID = 许曼君离婚后日常选择 | '把今天这件事做完';

export interface 许曼君离婚后日常选项视图 {
  id: 许曼君离婚后日常选择;
  kicker: string;
  icon: string;
  文案: string;
  提示: string;
}

export interface 许曼君离婚后日常地点动作视图 {
  id: '看看她今天在忙什么' | '把今天这件事做完';
  主题: 许曼君离婚后日常主题;
  kicker: string;
  icon: string;
  文案: string;
  提示: string;
  选项?: readonly 许曼君离婚后日常选项视图[];
}

export interface 许曼君离婚后日常结果 {
  成功: boolean;
  变动: boolean;
  提示: string;
  事件?: string;
  主题?: 许曼君离婚后日常主题;
  选择?: 许曼君离婚后日常选择;
  期望次数?: number;
}

export interface 许曼君离婚后日常票 {
  拍: 许曼君离婚后日常拍;
  事件ID: string;
  期望次数: number;
  请求时段: number;
  请求楼层: number;
  关系: 许曼君离婚后日常关系;
  主题: 许曼君离婚后日常主题;
  选择: 许曼君离婚后日常选择;
}

const 允许时段 = new Set(['中午', '下午', '傍晚', '晚上']);
const 事件记录上限 = 8;
const 近期主题上限 = 3;
const 冷却时段数 = 6;

function 状态(data: SchemaType): SchemaType['系统']['_许曼君离婚后日常'] {
  return data.系统._许曼君离婚后日常;
}

function 当前关系(data: SchemaType): 许曼君离婚后日常关系 | '' {
  const choice = data.系统._许曼君分居.玩家最终关系选择;
  return choice === '继续关系' || choice === '暂不承诺' || choice === '退出关系' ? choice : '';
}

function 选项属于关系(choice: 许曼君离婚后日常选择, relation: 许曼君离婚后日常关系): boolean {
  return relation === '退出关系'
    ? choice === '只处理201房务' || choice === '听她把边界说清'
    : choice === '陪她把这件事做完' || choice === '把决定留给她';
}

function 当前201其他妻(data: SchemaType): string[] {
  return 门牌列表.filter(
    门牌号 =>
      门牌号 !== '201' &&
      Boolean(data.户[门牌号]) &&
      妻位置推算(门牌号, data.系统._绝对时段, data.户[门牌号]!) === '201',
  );
}

function 硬阻断原因(data: SchemaType, location: string, 检查剧情事务: boolean): string {
  const relation = 当前关系(data);
  if (!许曼君离婚已完成(data)) return '完整《离婚》完成后才开放201的新日常。';
  if (!relation) return '当前存档没有记录《分居》的真实关系选择，不能猜测结局后边界。';
  if (!data.户['201']) return '201住户状态尚未建立。';
  if (location !== '201') return '这项日常只能在201进行。';
  if (data.系统._坏结局) return '当前结局已经锁定。';
  if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) return '先结束当前特殊场景。';
  if (data.系统._性爱场景.状态 !== '空闲') return '当前亲密场景尚未结束。';
  if (data.系统._父亲通话.标识 || data.系统._父亲通话.状态) return '先结束当前电话。';
  if (data.系统._待接来电.期 >= 0) return '先处理当前来电。';
  if (检查剧情事务 && (data.系统._场景剧情事务.id || String(data.系统._待发送事件 ?? '').trim())) {
    return '先完成当前剧情。';
  }
  if (处于医院硬锁(data, '201')) return '许曼君正在医院待产或恢复。';
  if (!允许时段.has(当前时段(data))) return '中午、下午、傍晚或晚上再看看她今天的安排。';
  if (妻位置推算('201', data.系统._绝对时段, data.户['201']) !== '201') return '许曼君当前不在201。';
  if (当前201其他妻(data).length) return '等201里只剩你和许曼君时再处理这件日常。';
  const account = 状态(data);
  if (account.阶段 === '空闲' && account.下次可用时段 >= 0 && data.系统._绝对时段 < account.下次可用时段) {
    return '今天这件日常已经处理过了。';
  }
  return '';
}

export function 许曼君离婚后日常阻断原因(data: SchemaType, location: string): string {
  return 硬阻断原因(data, location, true);
}

export function 许曼君离婚后日常当前主题(data: SchemaType): 许曼君离婚后日常主题 {
  const account = 状态(data);
  if (account.阶段 === '待收针' && 许曼君离婚后日常主题列表.includes(account.当前主题 as 许曼君离婚后日常主题)) {
    return account.当前主题 as 许曼君离婚后日常主题;
  }
  return 许曼君离婚后日常主题列表[account.累计次数 % 许曼君离婚后日常主题列表.length];
}

function 主题提示(theme: 许曼君离婚后日常主题): string {
  if (theme === '给自己改衣服') return '她正在把一件衣服改成只按自己喜好穿的样子。';
  if (theme === '重排201') return '她正在按一个人长期生活的需要重排201。';
  return '她正在明账里固定留下一笔只供自己生活的钱。';
}

function 关系选项(relation: 许曼君离婚后日常关系): readonly 许曼君离婚后日常选项视图[] {
  if (relation === '退出关系') {
    return [
      {
        id: '只处理201房务',
        kicker: 'ROOM ONLY',
        icon: 'home',
        文案: '只处理201房务',
        提示: '只以管理员与住户身份处理现实事项，不恢复私人关系或留宿许可。',
      },
      {
        id: '听她把边界说清',
        kicker: 'BOUNDARY',
        icon: 'chat',
        文案: '听她把边界说清',
        提示: '让她亲口决定201和双方往后的边界；本次不会恢复恋爱或亲密入口。',
      },
    ];
  }
  return [
    {
      id: '陪她把这件事做完',
      kicker: 'TOGETHER',
      icon: 'favor',
      文案: '陪她把这件事做完',
      提示: relation === '暂不承诺' ? '参与眼前这件事，但不把它自动升级成长久独占承诺。' : '帮她完成眼前这件事，最终决定仍由她自己作出。',
    },
    {
      id: '把决定留给她',
      kicker: 'HER CHOICE',
      icon: 'chat',
      文案: '把决定留给她',
      提示: relation === '暂不承诺' ? '尊重她独立决定，也保持双方尚未作长期承诺的真实边界。' : '不替她作主，在场陪她把自己的决定落实。',
    },
  ];
}

export function 许曼君离婚后日常地点动作(data: SchemaType, location: string): 许曼君离婚后日常地点动作视图[] {
  if (硬阻断原因(data, location, true)) return [];
  const relation = 当前关系(data);
  if (!relation) return [];
  const account = 状态(data);
  if (account.阶段 === '待收针') {
    if (
      account.当前关系 !== relation ||
      !许曼君离婚后日常主题列表.includes(account.当前主题 as 许曼君离婚后日常主题) ||
      !许曼君离婚后日常选择列表.includes(account.当前选择 as 许曼君离婚后日常选择) ||
      !account.当前事件ID
    ) {
      return [];
    }
    return [
      {
        id: '把今天这件事做完',
        主题: account.当前主题 as 许曼君离婚后日常主题,
        kicker: 'D2 · FINISH',
        icon: 'edit',
        文案: '把今天这件事做完',
        提示: `继续“${account.当前主题}”的第二回合；只有真正收针完成后才结算冷却、记忆与奖励。`,
      },
    ];
  }
  const theme = 许曼君离婚后日常当前主题(data);
  return [
    {
      id: '看看她今天在忙什么',
      主题: theme,
      kicker: 'D1 · 201 NEW LIFE',
      icon: 'home',
      文案: '看看她今天在忙什么',
      提示: `${主题提示(theme)}本回合只定范围，下一回合才真正做完。`,
      选项: 关系选项(relation),
    },
  ];
}

function 关系纪律(relation: 许曼君离婚后日常关系): string {
  if (relation === '退出关系') return '当前真实选择是“退出关系”：只允许中性的住户／管理员互动，不得恢复恋爱、留宿或身体亲密。';
  if (relation === '暂不承诺') return '当前真实选择是“暂不承诺”：不得把这件日常自动写成长久独占、正式同居或永久承诺。';
  return '当前真实选择是“继续关系”：可以自然表现熟悉与关心，但许曼君仍拥有自己的判断、钱和生活规则。';
}

function D1纪律(theme: 许曼君离婚后日常主题): string {
  if (theme === '给自己改衣服') return '只检查面料、接缝和尺寸，标出准备拆线或修改的位置；本楼不能缝好、试穿确认或交付。';
  if (theme === '重排201') return '只检查201现有动线、量位置并决定要移动或清空的范围；本楼不能把家具物件全部归位或宣布重排完成。';
  return '只核对固定支出与她自己的需要，圈出准备保留的额度；本楼不能正式写入明账或宣布这笔钱已经固定。';
}

function D2纪律(theme: 许曼君离婚后日常主题): string {
  if (theme === '给自己改衣服') return '承接上一楼已经标定的尺寸，完成拆线、裁改、缝合与必要试穿，并明确衣服已经按她自己的喜好改好。';
  if (theme === '重排201') return '承接上一楼已经量好的范围，实际挪动、清空并归位201物件，最后确认新动线已经落定。';
  return '承接上一楼已经核好的数字，在明账中固定留出只供许曼君生活使用的钱，并明确不会再挪回别人的账。';
}

function 建立事件ID(data: SchemaType, floor: number): string {
  return `XMJDAILY-${data.系统._绝对时段}-${Math.max(0, floor)}-${状态(data).累计次数 + 1}`;
}

function 建立事件(
  data: SchemaType,
  beat: 许曼君离婚后日常拍,
  eventId: string,
  theme: 许曼君离婚后日常主题,
  choice: 许曼君离婚后日常选择,
  relation: 许曼君离婚后日常关系,
  floor: number,
): string {
  const account = 状态(data);
  const ticket = `【事件在场妻:201】【许曼君离婚后日常提交:${beat}:${eventId}:${account.累计次数}:${data.系统._绝对时段}:${floor}:${relation}:${theme}:${choice}】`;
  const actionRule =
    choice === '陪她把这件事做完'
      ? '玩家可以递东西、搭把手或一起核对，但不能替她决定最后结果。'
      : choice === '把决定留给她'
        ? '玩家留在现场并尊重她自己作主，不能替她给答案。'
        : choice === '只处理201房务'
          ? '双方只以住户与管理员身份完成现实事项。'
          : '许曼君把退出关系后的201边界说清，玩家听完并尊重。';
  return (
    `${ticket}【201离婚后新日常·${beat}·${theme}·${choice}】${主题提示(theme)}` +
    `${beat === 'D1' ? D1纪律(theme) : D2纪律(theme)}${actionRule}${关系纪律(relation)}` +
    '保持许曼君精明、会算账、笑着带刺的说话方式；不得重演《分居》《离婚》、让赵国强返家、进入亲密场景、生成手机消息、推进世界时间或宣告系统变量。'
  );
}

export function 执行许曼君离婚后日常动作(
  data: SchemaType,
  action: 许曼君离婚后日常动作ID,
  location: string,
  floor: number,
): 许曼君离婚后日常结果 {
  const blocked = 硬阻断原因(data, location, true);
  if (blocked) return { 成功: false, 变动: false, 提示: blocked };
  if (!Number.isInteger(floor) || floor < 0) return { 成功: false, 变动: false, 提示: '当前正文楼层无效。' };
  const relation = 当前关系(data);
  if (!relation) return { 成功: false, 变动: false, 提示: '关系边界缺失，不能启动日常。' };
  const account = 状态(data);

  if (action === '把今天这件事做完') {
    if (
      account.阶段 !== '待收针' ||
      !account.当前事件ID ||
      account.当前关系 !== relation ||
      !许曼君离婚后日常主题列表.includes(account.当前主题 as 许曼君离婚后日常主题) ||
      !许曼君离婚后日常选择列表.includes(account.当前选择 as 许曼君离婚后日常选择)
    ) {
      return { 成功: false, 变动: false, 提示: 'D1检查点已经变化，请重新打开201房间动作。' };
    }
    const theme = account.当前主题 as 许曼君离婚后日常主题;
    const choice = account.当前选择 as 许曼君离婚后日常选择;
    return {
      成功: true,
      变动: false,
      提示: `准备完成“${theme}”的D2收针回合。`,
      主题: theme,
      选择: choice,
      期望次数: account.累计次数,
      事件: 建立事件(data, 'D2', account.当前事件ID, theme, choice, relation, floor),
    };
  }

  if (account.阶段 !== '空闲' || !许曼君离婚后日常选择列表.includes(action) || !选项属于关系(action, relation)) {
    return { 成功: false, 变动: false, 提示: '关系边界、日常检查点或结构化选择已经变化。' };
  }
  const theme = 许曼君离婚后日常当前主题(data);
  const eventId = 建立事件ID(data, floor);
  return {
    成功: true,
    变动: false,
    提示: `准备演出“${theme}”的D1定范围回合。`,
    主题: theme,
    选择: action,
    期望次数: account.累计次数,
    事件: 建立事件(data, 'D1', eventId, theme, action, relation, floor),
  };
}

export function 解析许曼君离婚后日常事件(event: string): 许曼君离婚后日常票 | null {
  const match = String(event ?? '').match(
    /【许曼君离婚后日常提交:(D1|D2):([A-Za-z0-9-]+):(\d+):(\d+):(\d+):(继续关系|暂不承诺|退出关系):(给自己改衣服|重排201|给自己留一笔生活钱):(陪她把这件事做完|把决定留给她|只处理201房务|听她把边界说清)】/u,
  );
  if (!match) return null;
  return {
    拍: match[1] as 许曼君离婚后日常拍,
    事件ID: match[2],
    期望次数: Number(match[3]),
    请求时段: Number(match[4]),
    请求楼层: Number(match[5]),
    关系: match[6] as 许曼君离婚后日常关系,
    主题: match[7] as 许曼君离婚后日常主题,
    选择: match[8] as 许曼君离婚后日常选择,
  };
}

export function 许曼君离婚后日常演员错误(event: string, wives: readonly string[], husbands: readonly string[]): string {
  if (!解析许曼君离婚后日常事件(event)) return '';
  const uniqueWives = [...new Set(wives)];
  const uniqueHusbands = [...new Set(husbands)];
  if (uniqueWives.length !== 1 || uniqueWives[0] !== '201') return '201离婚后日常出现了错误妻子；本楼只允许许曼君在场。';
  if (uniqueHusbands.length) return '201离婚后日常不得让赵国强或其他丈夫在场。';
  return '';
}

function D1范围错误(theme: 许曼君离婚后日常主题, text: string): string {
  const completion =
    theme === '给自己改衣服'
      ? /改好|缝好|重新缝好|试穿.{0,8}(?:合身|完成)|已经完成/u
      : theme === '重排201'
        ? /全部归位|重排完成|已经落定|现在住着顺手|全部安排好/u
        : /正式写进|正式写入|已经固定|不会再挪|已经留出/u;
  const 明确尚未完成 =
    theme === '给自己留一笔生活钱' && /还没有.{0,12}正式写(?:进|入)|尚未.{0,12}正式写(?:进|入)/u.test(text);
  if (!明确尚未完成 && completion.test(text)) return 'D1提前完成了本应留给D2的收针结果。';
  const scoped =
    theme === '给自己改衣服'
      ? /检查|接缝|尺寸|粉笔|标出|量肩|衣摆|布边/u.test(text)
      : theme === '重排201'
        ? /查看|检查|卷尺|量|动线|标出|柜子|桌面|空位/u.test(text)
        : /核对|列出|固定支出|画线|额度|需要|账本/u.test(text);
  return scoped ? '' : 'D1尚未把本次范围与尺寸定清楚。';
}

function D2完成错误(theme: 许曼君离婚后日常主题, text: string): string {
  if (theme === '给自己改衣服') {
    const hasItem = /衣服|衣裳|衣摆|袖口|衣身|布边|针线|缝|裁|裙|上衣/u.test(text);
    const hasDone = /改好|缝好|剪|收窄|收腰|重新缝|试穿|完成/u.test(text);
    return hasItem && hasDone ? '' : 'D2没有完成“给自己改衣服”。';
  }
  if (theme === '重排201') {
    const hasRoom = /201|房间|柜子|桌面|抽屉|动线|空位|物件/u.test(text);
    const hasDone = /重排|重新安排|挪|清空|归位|重新摆|落定|顺手/u.test(text);
    return hasRoom && hasDone ? '' : 'D2没有完成“重排201”。';
  }
  const hasMoney = /生活钱|生活预算|自己的钱|预算|账本|明账|额度/u.test(text);
  const hasDone = /留下|留给|固定|记入|写进|不会再挪|单独/u.test(text);
  return hasMoney && hasDone ? '' : 'D2没有完成“给自己留一笔生活钱”。';
}

export function 许曼君离婚后日常正文越界原因(event: string, text: string): string {
  const ticket = 解析许曼君离婚后日常事件(event);
  if (!ticket) return '';
  const body = String(text ?? '').trim();
  if (!body) return '201离婚后日常正文为空，没有完成当前回合。';
  if (/做爱|性交|口交|插入|抽插|射精|内射|肛交|亲密场景|脱光|上床/u.test(body)) {
    return '201离婚后新日常不能越界进入亲密场景。';
  }
  if (ticket.关系 === '暂不承诺' && /正式同居|一辈子|只属于|独占|永久承诺|永远在一起/u.test(body)) {
    return '“暂不承诺”不能被一次日常自动升级。';
  }
  if (ticket.关系 === '退出关系' && /拥抱|接吻|搂|恋人|复合|留宿|同居|恢复关系|重新在一起/u.test(body)) {
    return '“退出关系”分支不能恢复恋爱、留宿或身体亲密。';
  }
  if (ticket.拍 === 'D1') return D1范围错误(ticket.主题, body);
  if (/不做了|改天再说|以后再弄|拒绝|算了|没有完成|转身离开|不了了之/u.test(body)) {
    return '许曼君拒绝或中止了当前日常，D2没有完成项目。';
  }
  return D2完成错误(ticket.主题, body);
}

function 事件摘要(ticket: 许曼君离婚后日常票): string {
  const relation =
    ticket.关系 === '退出关系'
      ? '双方保留住户与管理员边界'
      : ticket.关系 === '暂不承诺'
        ? '双方没有把这次陪伴升级为长期承诺'
        : '玩家陪她落实了离婚后的新生活安排';
  if (ticket.主题 === '给自己改衣服') return `许曼君把一件衣服按自己的喜好改好；${relation}。`;
  if (ticket.主题 === '重排201') return `许曼君按自己的长期生活需要重排了201；${relation}。`;
  return `许曼君在明账里固定留下一笔自己的生活钱；${relation}。`;
}

function 反馈文案(ticket: 许曼君离婚后日常票): string {
  const boundary =
    ticket.关系 === '退出关系'
      ? '房里的事按昨天说的边界来，别多想。'
      : ticket.关系 === '暂不承诺'
        ? '昨天那件事我记你的好，不过咱们没说过的话，姐也不会替你补上。'
        : '昨天你在旁边，这件事办得确实顺。';
  if (ticket.主题 === '给自己改衣服') return `昨天改的那件衣服我又试了一遍，袖口和衣摆都留着我自己喜欢的样子。${boundary}`;
  if (ticket.主题 === '重排201') return `201昨天挪过以后顺手多了，空出来的位置我也没再替谁留着。${boundary}`;
  return `昨天留在明账里的那笔生活钱还在，我没再顺手挪回别人的账。${boundary}`;
}

function 清空当前检查点(data: SchemaType): void {
  const account = 状态(data);
  account.阶段 = '空闲';
  account.当前事件ID = '';
  account.当前主题 = '';
  account.当前选择 = '';
  account.当前关系 = '';
  account.开始时段 = -1;
  account.开始楼层 = -1;
}

export function 提交许曼君离婚后日常事件(
  data: SchemaType,
  event: string,
  text: string,
  location: string,
  floor: number,
  wives: readonly string[],
  husbands: readonly string[],
): 许曼君离婚后日常结果 {
  const ticket = 解析许曼君离婚后日常事件(event);
  if (!ticket) return { 成功: false, 变动: false, 提示: '201离婚后日常票已经失效。' };
  const actorError = 许曼君离婚后日常演员错误(event, wives, husbands);
  if (actorError) return { 成功: false, 变动: false, 提示: actorError };
  const bodyError = 许曼君离婚后日常正文越界原因(event, text);
  if (bodyError) return { 成功: false, 变动: false, 提示: bodyError };
  const blocked = 硬阻断原因(data, location, false);
  if (blocked) return { 成功: false, 变动: false, 提示: blocked };
  const relation = 当前关系(data);
  const account = 状态(data);
  if (data.系统._绝对时段 !== ticket.请求时段) return { 成功: false, 变动: false, 提示: '世界时间已经变化，本次迟到正文不提交。' };
  if (floor !== ticket.请求楼层 || !Number.isInteger(floor) || floor < 0) return { 成功: false, 变动: false, 提示: '正文楼层或时间线租约已经变化。' };
  if (relation !== ticket.关系) return { 成功: false, 变动: false, 提示: '关系选择已经变化，本次正文不提交。' };
  if (!选项属于关系(ticket.选择, ticket.关系)) return { 成功: false, 变动: false, 提示: '结构化选择已经不属于当前关系。' };

  if (ticket.拍 === 'D1') {
    if (account.阶段 !== '空闲' || account.累计次数 !== ticket.期望次数 || 许曼君离婚后日常当前主题(data) !== ticket.主题) {
      return { 成功: false, 变动: false, 提示: 'D1已经提交过，或今日主题与时间线已经变化。' };
    }
    account.阶段 = '待收针';
    account.当前事件ID = ticket.事件ID;
    account.当前主题 = ticket.主题;
    account.当前选择 = ticket.选择;
    account.当前关系 = ticket.关系;
    account.开始时段 = ticket.请求时段;
    account.开始楼层 = floor;
    return {
      成功: true,
      变动: true,
      提示: 'D1只完成定范围并建立检查点；冷却、奖励与手机反馈尚未结算。下一回合继续收针。',
      主题: ticket.主题,
      选择: ticket.选择,
    };
  }

  if (
    account.阶段 !== '待收针' ||
    account.当前事件ID !== ticket.事件ID ||
    account.当前主题 !== ticket.主题 ||
    account.当前选择 !== ticket.选择 ||
    account.当前关系 !== ticket.关系 ||
    account.累计次数 !== ticket.期望次数
  ) {
    return { 成功: false, 变动: false, 提示: 'D2检查点已经提交过或时间线已经变化。' };
  }

  const id = `201离婚后日常:${ticket.事件ID}:${ticket.主题}`;
  if (account.事件记录.some(item => item.id === id)) return { 成功: false, 变动: false, 提示: '这次日常已经登记。' };
  const summary = 事件摘要(ticket);
  account.累计次数 += 1;
  account.最近事件ID = id;
  account.最近主题 = ticket.主题;
  account.最近选择 = ticket.选择;
  account.最近关系 = ticket.关系;
  account.最近事件时段 = ticket.请求时段;
  account.最近事件楼层 = floor;
  account.下次可用时段 = ticket.请求时段 + 冷却时段数;
  account.最近摘要 = summary;
  account.近期主题 = [...account.近期主题, ticket.主题].slice(-近期主题上限);
  account.生活整备可用 = true;
  account.生活整备来源事件ID = id;
  account.事件记录.push({
    id,
    主题: ticket.主题,
    选择: ticket.选择,
    关系: ticket.关系,
    发生时段: ticket.请求时段,
    发生楼层: floor,
    摘要: summary,
  });
  account.事件记录 = account.事件记录.slice(-事件记录上限);
  const messageKey = `许曼君离婚后日常:${id}:收针回执`;
  if (!account.待反馈事件.some(item => item.消息键 === messageKey)) {
    account.待反馈事件.push({
      事件ID: id,
      消息键: messageKey,
      可发送时段: ticket.请求时段 + 1,
      文案: 反馈文案(ticket),
    });
  }
  清空当前检查点(data);
  return {
    成功: true,
    变动: true,
    提示: 'D2已经完成：本次日常、冷却、近期记忆、一次生活整备与下一时段私聊反馈票同步落账。',
    主题: ticket.主题,
    选择: ticket.选择,
  };
}

export function 许曼君201生活整备可用(data: SchemaType): boolean {
  return Boolean(许曼君离婚已完成(data) && 状态(data).生活整备可用);
}

export function 消耗许曼君201生活整备(data: SchemaType): boolean {
  const account = 状态(data);
  if (!许曼君201生活整备可用(data)) return false;
  account.生活整备可用 = false;
  account.生活整备来源事件ID = '';
  return true;
}

export function 许曼君离婚后日常待发送反馈(
  data: SchemaType,
): SchemaType['系统']['_许曼君离婚后日常']['待反馈事件'] {
  if (!许曼君离婚已完成(data) || !data.户['201']) return [];
  return 状态(data).待反馈事件.filter(item => item.可发送时段 >= 0 && data.系统._绝对时段 >= item.可发送时段);
}

export function 提交许曼君离婚后日常反馈已送达(data: SchemaType, messageKey: string): boolean {
  const account = 状态(data);
  const before = account.待反馈事件.length;
  account.待反馈事件 = account.待反馈事件.filter(item => item.消息键 !== messageKey);
  return account.待反馈事件.length !== before;
}

export function 许曼君离婚后日常近期提示(data: SchemaType): string {
  const account = 状态(data);
  if (account.阶段 === '待收针' && account.当前主题) {
    return `【201日常检查点】“${account.当前主题}”只完成了D1定范围，下一有效AI回合必须从既有范围继续D2收针；不得当作已经完成。`;
  }
  if (!许曼君离婚已完成(data) || !account.最近摘要 || account.最近事件时段 < 0) return '';
  if (data.系统._绝对时段 - account.最近事件时段 > 12) return '';
  const boundary =
    account.最近关系 === '退出关系'
      ? '这次互动没有恢复私人关系、留宿或亲密许可。'
      : account.最近关系 === '暂不承诺'
        ? '这次互动没有把“暂不承诺”升级为长期独占承诺。'
        : '许曼君仍按自己的判断处理201、钱和生活。';
  return `【近期201日常】${account.最近摘要}${boundary}`;
}
