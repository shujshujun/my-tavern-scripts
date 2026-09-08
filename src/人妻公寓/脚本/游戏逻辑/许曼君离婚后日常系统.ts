import type { SchemaType } from '../../schema';
import { 门牌列表 } from '../../stageConfig';
import { 当前时段, 妻位置推算 } from './楼层时钟';
import { 处于医院硬锁 } from './生产系统';
import { 许曼君离婚已完成 } from './许曼君离婚系统';
import { 读取队首场景剧情, 有地点动作剧情冲突 } from './场景剧情事务';

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
  /** 发起动作时的来源楼，绝不是之后新增的助手结果楼；旧票保留原字段和事件ID。 */
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
  if (检查剧情事务 && 有地点动作剧情冲突(data, location)) {
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

/** 单次生成的内存凭据；沿既有场景事务/原生租约传递，不增加存档或第二套调度。 */
export interface 许曼君日常提交锚 {
  readonly 事件: string;
  readonly 来源楼层: number;
  readonly 生成前末楼: number;
  readonly 结果楼层: number;
  readonly 场景事务ID: string;
  readonly 请求世代: number;
  readonly 触发楼层: number;
}

/**
 * 从生成前的可信数据冻结来源与结果身份。调用通道提供实际预期结果楼；这里不猜+1/+2。
 * 重试保留旧业务来源楼，结果楼跟随本次生成；旧等待票可由既有场景恢复入口重新激活。
 */
export function 冻结许曼君日常提交锚(
  data: SchemaType,
  event: string,
  生成前末楼: number,
  结果楼层: number,
): 许曼君日常提交锚 | null {
  const ticket = 解析许曼君离婚后日常事件(event);
  if (!ticket || ![ticket.请求楼层, 生成前末楼, 结果楼层].every(value => Number.isSafeInteger(value) && value >= 0) ||
      ticket.请求楼层 > 生成前末楼 || 结果楼层 <= 生成前末楼 ||
      ticket.请求时段 !== data.系统._绝对时段) return null;
  const txn = data.系统._场景剧情事务;
  if (txn.id) {
    const head = 读取队首场景剧情(data.系统._待发送事件);
    if (txn.状态 !== '生成中' || txn.目标场景 !== '201' || txn.内容 !== event ||
        !Number.isSafeInteger(txn.请求世代) || txn.请求世代 < 1 ||
        !Number.isSafeInteger(txn.触发楼层) || txn.触发楼层 < ticket.请求楼层 || txn.触发楼层 > 生成前末楼 ||
        !head || head.id !== txn.id || head.内容 !== event) return null;
  } else if (ticket.请求楼层 !== 生成前末楼) {
    // 无活动事务的兼容票只能属于本次来源楼；不能靠未来任意一条正文认领旧日常。
    return null;
  }
  return Object.freeze({
    事件: event, 来源楼层: ticket.请求楼层, 生成前末楼, 结果楼层,
    场景事务ID: txn.id, 请求世代: txn.id ? txn.请求世代 : 0, 触发楼层: txn.id ? txn.触发楼层 : ticket.请求楼层,
  });
}

function 日常提交楼层有效(
  data: SchemaType,
  event: string,
  ticket: 许曼君离婚后日常票,
  floor: number,
  anchor: 许曼君日常提交锚 | null | undefined,
): boolean {
  if (!Number.isSafeInteger(floor) || floor < 0) return false;
  // 保留无场景事务的旧纯函数同楼调用；两个生产通道均显式传凭据，null不可退化放行。
  if (anchor === undefined) return !data.系统._场景剧情事务.id && floor === ticket.请求楼层;
  if (!anchor || anchor.事件 !== event || anchor.来源楼层 !== ticket.请求楼层 || anchor.结果楼层 !== floor) return false;
  const current = 冻结许曼君日常提交锚(data, event, anchor.生成前末楼, anchor.结果楼层);
  return !!current && current.场景事务ID === anchor.场景事务ID && current.请求世代 === anchor.请求世代 &&
    current.触发楼层 === anchor.触发楼层;
}

export function 许曼君离婚后日常演员错误(event: string, wives: readonly string[], husbands: readonly string[]): string {
  if (!解析许曼君离婚后日常事件(event)) return '';
  const uniqueWives = [...new Set(wives)];
  const uniqueHusbands = [...new Set(husbands)];
  if (uniqueWives.length !== 1 || uniqueWives[0] !== '201') return '201离婚后日常出现了错误妻子；本楼只允许许曼君在场。';
  if (uniqueHusbands.length) return '201离婚后日常不得让赵国强或其他丈夫在场。';
  return '';
}

function 日常谓语被否定(before: string, after: string): boolean {
  return /(?:尚未|还未|仍未|未曾|没有|还没|仍没|并未|未能|没能|不能|不曾|并非|不是|不算|未|没)(?:(?!已经|终于|随后|却|就|还是|仍然).)*$/u.test(before) ||
    /^(?:了)?(?:还谈不上|谈不上|尚未发生|并未发生|是不可能的|没有发生|了吗|了么|没有)/u.test(after);
}

/** 并列后续动作另有自己的时态与宾语，不能反向修饰已经命中的完成谓语。 */
function 日常谓语直接后缀(after: string): string {
  const next = after.search(/(?:并(?:且)?|而且|接着|随后|然后)(?=(?:她|自己)?(?:决定|打算|准备|计划|开始|试穿|检查|核对|列出|单列))/u);
  return next < 0 ? after : after.slice(0, next);
}

/** 后置时间只解释当前谓语，不能因全文含有未来或历史词而抹掉另一项已发生事实。 */
function 日常谓语后置非本次事实(after: string): boolean {
  const tail = 日常谓语直接后缀(after);
  // 包含当前谓语的宾语，例如“写进明账以后”；不跨过“并决定以后试穿”等另一个动作。
  const 时间从句 = /^(?:了)?[^，,。！？!?；;\n—]*?(?:以后|之后|之前|以前)(?=再|才|[。！？!?；;\n]|$)|^(?:了)?(?:后才|后再)/u.test(tail);
  // 单独的“摆妥后，又挪回”仍是先完成后撤销；追溯说明只归属当前谓语。
  const 历史追注 = /^(?:了)?[^，,。！？!?；;\n]*?(?:——|--|（|\()(?:这|那)是(?:昨天|昨日|上次|从前|过去)/u.test(tail);
  return 时间从句 || 历史追注;
}

/** 裸“单列”只有宾语是预算本身才算结果；预算修饰的待办/说明等名词不是这笔钱。 */
function 日常单列预算对象有效(before: string, after: string): boolean {
  const object = 日常谓语直接后缀(after).replace(/^了/u, '').replace(/[。！？!?；;\n]+$/u, '').trim();
  if (object) {
    return /^(?:(?:一|这|那)笔|(?:她|自己|许曼君)的)*(?:生活钱|生活预算|自己的钱|自己.{0,12}(?:生活|开销).{0,8}钱)(?=$|用于|作为|以供|供)/u.test(object);
  }
  // “把自己的生活预算单列”与预算作主语时，沿紧邻谓语的前置名词核对，不借全文关键词猜宾语。
  return /(?:生活钱|生活预算|自己的钱|自己.{0,12}(?:生活|开销).{0,8}钱)(?:现在|已经|已|正式|固定|在明账(?:里|中))*$/u.test(before);
}

/** 只识别本项日常的结果事实，不把动作词出现、计划、旧引文或别的事情完成当作收针。 */
function 日常结果事实(theme: 许曼君离婚后日常主题, text: string): { 曾完成: boolean; 最终完成: boolean } {
  const item = theme === '给自己改衣服'
    ? /衣服|衣裳|衣摆|袖口|衣身|布边|针线|裙|上衣|裁改|缝合|收针/u
    : theme === '重排201'
      ? /201|房间|物件|家具|柜子|桌面|抽屉|动线|重排/u
      : /生活钱|生活预算|自己的钱|自己.{0,12}(?:生活|开销).{0,8}钱|明账|额度/u;
  const predicate = theme === '给自己改衣服'
    ? /改好|改完|缝好|缝完|缝妥|改妥|(?:修改|裁改|缝制|缝合|收针)(?:已经|已|终于)?(?:完成|完毕|妥当|好了)/gu
    : theme === '重排201'
      ? /归位|落定|排好|摆妥|(?:重新布置|重新摆放|重新安排|重新整理|安置)(?:好|妥当)|重排(?:已经|已)?(?:完成|结束|完毕)|现在住着顺手/gu
      : /固定留(?:下|出)|(?:正式|固定|单独)(?:记入|写入|写进)|单列(?:入账)?|留给(?=自己)|已经固定|已经留出/gu;
  // 只屏蔽有明确引用来源的片段；人物直接说出的当前结果仍可作为事实，不要求固定口令。
  const narrative = text.replace(
    /((?:便签|纸条|旧计划|旧记录|旧稿|例句|引用|复述)[^。！？；\n“「『‘"']{0,20})[“「『‘"'][^”」』’"'\n]*[”」』’"']/gu,
    '$1 ',
  );
  let 曾完成 = false, 最终完成 = false, 同项上文 = false;
  for (const sentence of narrative.match(/[^。！？!?；;\n]+[。！？!?；;\n]?/gu) ?? []) {
    let 非本次事实 = false;
    for (const raw of sentence.split(/[，,]|(?=但是|不过|然而|可是|但)/u)) {
      const clause = raw.replace(/[“”「」『』‘’"']/gu, '').trim();
      if (!clause || /[？?]/u.test(clause)) continue;
      if (/^(?:但是|不过|然而|可是|但|现在|此刻|如今)/u.test(clause)) 非本次事实 = false;
      const scope = clause.replace(/(?:按照|按|照着|沿着)(?:昨天|上次|之前|刚才).{0,18}(?:尺寸|标记|动线|范围|数字|位置)/gu, '');
      const modes = /准备(?!好|过)|打算|计划|希望|想要|想(?=把|将|先|再)|正在|如果|假如|要是|明天|改天|以后|将会|就会|也许|可能|似乎|好像|大概|是否|能否|要不要|会不会|问[：:]?|昨天|昨日|上次|从前|曾经|回忆|谎称|假装|想象/gu;
      const mode = [...scope.matchAll(modes)][0];
      const localItem = item.test(clause);
      const otherTask = /报表|报告|另一户|其他户|另一件|别的事|其他事情/u.test(clause);
      if (localItem && !otherTask) 同项上文 = true;
      else if (otherTask) 同项上文 = false;
      const related = localItem || 同项上文;
      for (const match of clause.matchAll(predicate)) {
        const at = match.index;
        const before = clause.slice(0, at), after = clause.slice(at + match[0].length);
        const nonActual = 非本次事实 || (mode !== undefined && mode.index <= at);
        if (!related || otherTask || nonActual || 日常谓语后置非本次事实(after)) continue;
        // 核对本次“单列”的预算宾语；列核对事项不算定额，真正预算仍沿用下方入账门。
        if (theme === '给自己留一笔生活钱' && match[0] === '单列' &&
          !日常单列预算对象有效(before, after)) continue;
        // 否定只作用于当前谓语：不能让“尚未熨平，但已缝好”或另一项未完盖掉真正结果。
        if (日常谓语被否定(before, after)) { 最终完成 = false; continue; }
        if (theme === '重排201' && !/房间|201|动线|全部|所有|常用物件|重排/u.test(clause)) continue;
        曾完成 = true;
        // 留钱必须确实入账；D1即使只提前固定额度，也已经越过“只定范围”的边界。
        if (theme !== '给自己留一笔生活钱' || /明账|入账|记入|写入|写进/u.test(clause)) 最终完成 = true;
      }
      if (mode) 非本次事实 = true;
      if (非本次事实 || !related || otherTask) continue;
      const unfinished = [...clause.matchAll(/完成|挪动|写入|写进|记入|留下/gu)].some(match =>
        日常谓语被否定(clause.slice(0, match.index), clause.slice(match.index + match[0].length)),
      ) || /仍.{0,6}(?:保持原样|停在检查)|还谈不上/u.test(clause);
      const undone = theme === '给自己留一笔生活钱'
        ? /(?:又|重新|全部).{0,8}挪回.{0,8}(?:别人|他人|旧账)|生活钱没有留下/u.test(clause)
        : /(?:又|重新).{0,8}(?:拆开|拆掉|挪回原位|恢复原样)/u.test(clause);
      const cancelled = [...clause.matchAll(/不做了|改天再说|以后再弄|拒绝继续|算了|不了了之/gu)].some(match =>
        !日常谓语被否定(clause.slice(0, match.index), clause.slice(match.index + match[0].length)),
      );
      if (unfinished || undone || cancelled) 最终完成 = false;
    }
  }
  return { 曾完成, 最终完成 };
}

function D1范围错误(theme: 许曼君离婚后日常主题, text: string): string {
  if (日常结果事实(theme, text).曾完成) return 'D1提前完成了本应留给D2的收针结果。';
  const scoped =
    theme === '给自己改衣服'
      ? /检查|接缝|尺寸|粉笔|标出|量肩|衣摆|布边/u.test(text)
      : theme === '重排201'
        ? /查看|检查|卷尺|量|动线|标出|柜子|桌面|空位/u.test(text)
        : /核对|列出|固定支出|画线|额度|需要|账本/u.test(text);
  return scoped ? '' : 'D1尚未把本次范围与尺寸定清楚。';
}

function D2完成错误(theme: 许曼君离婚后日常主题, text: string): string {
  return 日常结果事实(theme, text).最终完成 ? '' : `D2没有完成“${theme}”。`;
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

function 反馈文案(
  ticket: Pick<许曼君离婚后日常票, '主题' | '关系'>,
  回指: '之前' | '昨天' = '之前',
): string {
  const boundary =
    ticket.关系 === '退出关系'
      ? `房里的事按${回指}说的边界来，别多想。`
      : ticket.关系 === '暂不承诺'
        ? `${回指}那件事我记你的好，不过咱们没说过的话，姐也不会替你补上。`
        : `${回指}你在旁边，这件事办得确实顺。`;
  if (ticket.主题 === '给自己改衣服') return `${回指}改的那件衣服我又试了一遍，袖口和衣摆都留着我自己喜欢的样子。${boundary}`;
  if (ticket.主题 === '重排201') return `201${回指}挪过以后顺手多了，空出来的位置我也没再替谁留着。${boundary}`;
  return `${回指}留在明账里的那笔生活钱还在，我没再顺手挪回别人的账。${boundary}`;
}

/** 只兼容九种已知旧模板的未发送票；不猜日期、不改存档或手机里已经送达的历史。 */
const 旧反馈文案映射 = new Map(
  许曼君离婚后日常主题列表.flatMap(主题 =>
    (['继续关系', '暂不承诺', '退出关系'] as const).map(关系 => {
      const ticket = { 主题, 关系 };
      return [反馈文案(ticket, '昨天'), 反馈文案(ticket)] as const;
    }),
  ),
);

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
  提交锚?: 许曼君日常提交锚 | null,
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
  if (!日常提交楼层有效(data, event, ticket, floor, 提交锚)) return { 成功: false, 变动: false, 提示: '正文楼层或时间线租约已经变化。' };
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
  return 状态(data).待反馈事件
    .filter(item => item.可发送时段 >= 0 && data.系统._绝对时段 >= item.可发送时段)
    .map(item => ({ ...item, 文案: 旧反馈文案映射.get(item.文案) ?? item.文案 }));
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
