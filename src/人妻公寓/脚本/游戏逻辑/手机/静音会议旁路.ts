import type { SchemaType } from '../../../schema';
import type { 门牌 } from '../../../stageConfig';
import { 户静态表, 门牌列表 } from '../../../stageConfig';
import { 登记MVU提交校验, 排队MVU操作, 读取最近有效, 脚本写入 } from '../mvuIO';
import { 捕获保护快照 } from '../守护系统';
import { 当前时间线切换世代 } from '../时间线切换协调';
import { 净化消息 } from './生成引擎';
import { 请求刷新手机红点 } from './UI刷新';
import { 当前聊天ID, 当前手机数据 } from './运行时上下文';

/**
 * 静音会议微信旁路（拆分方案 P5）：会议手机状态、正文生成瞬时锁、正文记忆、
 * 会场私聊气口与摘要租约。只从叶子模块取值，不 import 内核/门面；
 * 内核与发送流程经这里取会议判据与摘要写入/回流提示。
 */

// ============================================
// 静音会议微信旁路
// ============================================

export interface 静音会议手机状态 {
  /** 当前是否正处于正式运行中的静音会议。 */
  场景中: boolean;
  /** 第 3 拍正文已经成功，且尚未进入最终收尾。 */
  已开放: boolean;
  /** 正文生成或交互幕期间只临时锁住手机，不改变“已开放”里程碑。 */
  临时禁用: boolean;
  /** 手机壳此刻能否打开；场景外始终为 true。 */
  可打开: boolean;
  /** 本场冻结的参与妻名单；只有这些门牌的私聊可以进入和发送。 */
  参与妻: 门牌[];
  /** 供 Dock、手机壳和脚本硬门共用的简短原因。 */
  禁用原因: string;
}

/**
 * 主回合生成中的瞬时锁不进 MVU：刷新/回档不应把“正在生成”保存成永久状态。
 * 回合入口通过这个 setter 同步；交互幕仍以 `_特殊场景.交互` 为持久真值。
 */
let 静音会议正文生成中 = false;

export function 设置静音会议手机生成中(生成中: boolean): void {
  if (静音会议正文生成中 === 生成中) return;
  静音会议正文生成中 = 生成中;
  请求刷新手机红点();
}

function 规范会议参与妻(data: SchemaType): 门牌[] {
  const 原 = data.系统._特殊场景.参与妻;
  return 原.filter((门牌号): 门牌号 is 门牌 => 门牌列表.includes(门牌号 as 门牌));
}

/**
 * UI 与手机脚本共用的唯一会议手机判据。
 *
 * `当前拍` 的语义是“下一待生成正文拍”：拍 3 成功后变为 4，所以无需另存一个
 * `微信开放` 布尔值。交互的“待操作/等待AI”和正文生成只构成瞬时锁。
 */
export function 获取静音会议手机状态(data: SchemaType | null = 当前手机数据()): 静音会议手机状态 {
  const 空: 静音会议手机状态 = {
    场景中: false,
    已开放: false,
    临时禁用: false,
    可打开: true,
    参与妻: [],
    禁用原因: '',
  };
  if (!data || data.系统._特殊场景.id !== '静音会议') return 空;

  const 场 = data.系统._特殊场景;
  const 参与妻 = 规范会议参与妻(data);
  const 已开放 = 场.当前拍 >= 4 && 场.阶段 !== '收尾';
  const 交互中 = 场.交互.状态 === '待操作' || 场.交互.状态 === '等待AI';
  const 临时禁用 = 已开放 && (静音会议正文生成中 || 交互中);
  let 禁用原因 = '';
  if (场.阶段 === '收尾') 禁用原因 = '正在完成散会收尾，微信暂时锁定。';
  else if (!已开放) 禁用原因 = '会议第 3 拍完成后才会开放会场微信。';
  else if (静音会议正文生成中 || 场.交互.状态 === '等待AI') 禁用原因 = '会议正文正在生成，稍后再看微信。';
  else if (场.交互.状态 === '待操作') 禁用原因 = '请先完成当前会议操作。';

  return {
    场景中: true,
    已开放,
    临时禁用,
    可打开: 已开放 && !临时禁用,
    参与妻,
    禁用原因,
  };
}

/** 会议场景中，返回某个手机入口的冻结原因；空串表示可以进入/发送。 */
export function 获取会议会话禁用原因(data: SchemaType | null, 会话: string): string {
  const 状态 = 获取静音会议手机状态(data);
  if (!状态.场景中) return '';
  if (!状态.可打开) return 状态.禁用原因;
  if (状态.参与妻.includes(会话 as 门牌)) return '';
  return '会议期间只开放本场参与妻的私聊。';
}

export interface 静音会议正文记忆 {
  启动楼层: number;
  最新完成AI楼层: number;
  /** 只读正文时间线；不含 MVU、微信或尚未得到 AI 回复的末尾玩家消息。 */
  文本: string;
}

/**
 * 静音会议私聊不能只读普通微信使用的“最近 300 字”：参与妻需要知道本场从开会至今
 * 已经真实发生过什么。上界固定为最新成功落库的 AI 楼，生成中/取消的临时内容不会混入。
 */
export function 取静音会议正文记忆(data: SchemaType): 静音会议正文记忆 | null {
  const 场 = data.系统._特殊场景;
  if (场.id !== '静音会议' || 场.启动楼层 < 0) return null;
  const chat = (SillyTavern as unknown as { chat?: { mes?: string; is_user?: boolean }[] }).chat ?? [];
  const 启动楼层 = Math.max(0, Math.min(Math.round(场.启动楼层), Math.max(0, chat.length - 1)));
  let 最新完成AI楼层 = -1;
  for (let i = chat.length - 1; i >= 启动楼层; i--) {
    if (!chat[i]?.is_user && String(chat[i]?.mes ?? '').trim()) {
      最新完成AI楼层 = i;
      break;
    }
  }
  if (最新完成AI楼层 < 启动楼层) return { 启动楼层, 最新完成AI楼层: -1, 文本: '' };

  const 时间线: string[] = [];
  for (let i = 启动楼层; i <= 最新完成AI楼层; i++) {
    const 消息 = chat[i];
    const 文 = 净化消息(String(消息?.mes ?? '')).trim();
    if (!文) continue;
    时间线.push(`【${消息?.is_user ? '玩家行动' : '会议正文'}·楼${i}】\n${文}`);
  }
  return { 启动楼层, 最新完成AI楼层, 文本: 时间线.join('\n\n') };
}

const 会场私聊气口 = ['收到消息', '克制紧张', '试探犹疑', '亲近默契'] as const;
type 会场私聊气口 = (typeof 会场私聊气口)[number];

export interface 会场私聊摘要租约 {
  聊天ID: string;
  启动楼层: number;
  会议签名: string;
  时间线世代: number;
}

function 会场私聊摘要租约匹配(a: 会场私聊摘要租约 | null, b: 会场私聊摘要租约 | null): boolean {
  return (
    !!a &&
    !!b &&
    a.聊天ID === b.聊天ID &&
    a.启动楼层 === b.启动楼层 &&
    a.会议签名 === b.会议签名 &&
    a.时间线世代 === b.时间线世代
  );
}

export function 创建会场私聊摘要租约(data: SchemaType | null, 聊天ID = 当前聊天ID()): 会场私聊摘要租约 | null {
  if (!data || !聊天ID) return null;
  const 场 = data.系统._特殊场景;
  if (场.id !== '静音会议' || 场.阶段 === '收尾' || 场.当前拍 < 4) return null;
  const 启动楼层 = Number.isFinite(场.启动楼层) ? Math.max(0, Math.round(场.启动楼层)) : -1;
  if (启动楼层 < 0) return null;
  const 参与妻 = 规范会议参与妻(data).join(',');
  return {
    聊天ID,
    启动楼层,
    会议签名: `${场.id}|${启动楼层}|${参与妻}|${String(场.议题 ?? '')}`,
    时间线世代: 当前时间线切换世代(),
  };
}

function 判会场私聊气口(回复?: string): 会场私聊气口 {
  if (!回复) return '收到消息';
  if (/[？?]|怎么|能不能|要不要|是不是|真的/.test(回复)) return '试探犹疑';
  if (/别|等等|小心|紧张|怕|不行|被看|发现|嘘|安静/.test(回复)) return '克制紧张';
  if (/好|嗯|知道|想你|等你|喜欢|放心|😊|😉|😘|🥰|❤️|♥/u.test(回复)) return '亲近默契';
  return '克制紧张';
}

function 气口可用(值: string): 值 is 会场私聊气口 {
  return (会场私聊气口 as readonly string[]).includes(值);
}

/**
 * 只保存固定枚举气口，不保存玩家或妻子的任何原句。第一条玩家消息先记“收到消息”，
 * 妻回复成功后再覆盖成粗粒度语气；同妻同正文楼永远只有一条。
 */
export async function 写会场私聊摘要(门牌号: 门牌, 回复?: string, 固定请求租约?: 会场私聊摘要租约 | null): Promise<void> {
  const 气口 = 判会场私聊气口(回复);
  // 请求入队前冻结聊天与本场会议身份；排队期间切档、重开会议或同档开启新场时，
  // 旧请求即使稍后取得全局 MVU 租约，也不能把气口写入新的目标。
  const 请求租约 = 固定请求租约 === undefined ? 创建会场私聊摘要租约(当前手机数据()) : 固定请求租约;
  if (!请求租约) return;
  await 排队MVU操作(async () => {
    const 请求仍在原时间线 = () => 请求租约.时间线世代 === 当前时间线切换世代();
    const 取消提交校验 = 登记MVU提交校验(请求仍在原时间线);
    try {
      // 获得与正文安全操作共享的租约后才重读。A 写完后 B 以 A 的最新结果为基准，
      // 不会各拿一份旧整表再让后完成者覆盖前一位妻子的摘要；`脚本写入` 不会重入取锁。
      if (!请求仍在原时间线() || 当前聊天ID() !== 请求租约.聊天ID) return;
      const 有效 = 读取最近有效();
      if (!有效) return;
      const { raw, data } = 有效;
      if (!会场私聊摘要租约匹配(请求租约, 创建会场私聊摘要租约(data, 当前聊天ID()))) return;
      const 场 = data.系统._特殊场景;
      if (场.id !== '静音会议' || 场.阶段 === '收尾' || 场.当前拍 < 4 || !规范会议参与妻(data).includes(门牌号)) return;
      const 记忆 = 取静音会议正文记忆(data);
      if (!记忆 || 记忆.最新完成AI楼层 < 场.启动楼层) return;

      if (场.会场私聊摘要楼层 !== 记忆.最新完成AI楼层) {
        场.会场私聊摘要 = {};
        场.会场私聊摘要楼层 = 记忆.最新完成AI楼层;
      }
      场.会场私聊摘要[门牌号] = 气口;
      await 脚本写入(raw, data);
      捕获保护快照(data);
    } finally {
      取消提交校验();
    }
  });
}

/**
 * 给下一正文节拍的唯一微信回流。这里把持久字段重新编译成固定低信息提示，即使记录
 * 或异常模型污染了字符串，也绝不把字段原文注入正文。
 */
export function 取会场私聊摘要提示(data: SchemaType): string {
  const 场 = data.系统._特殊场景;
  if (场.id !== '静音会议' || 场.阶段 === '收尾') return '';
  const 记忆 = 取静音会议正文记忆(data);
  if (!记忆 || 记忆.最新完成AI楼层 < 0 || 场.会场私聊摘要楼层 !== 记忆.最新完成AI楼层) return '';

  const 参与妻 = 规范会议参与妻(data);
  const 会后阶段 = 场.当前拍 >= 13 || 场.阶段 === '会后' || 场.阶段.includes('自由');
  // 散会后，离场妻仍可在微信里继续聊天，但她的私聊不能把她重新带回管理员室正文。
  const 可回流妻 = 会后阶段
    ? _.uniq(场.会后妻.filter((门牌号): 门牌号 is 门牌 => 参与妻.includes(门牌号 as 门牌)))
    : 参与妻;
  const 行 = 可回流妻.flatMap(门牌号 => {
    const 值 = 场.会场私聊摘要[门牌号];
    if (!值) return [];
    const 气口: 会场私聊气口 = 气口可用(值) ? 值 : '收到消息';
    const 表现 =
      气口 === '亲近默契'
        ? '她与玩家之间多了一点亲近而克制的默契'
        : 气口 === '试探犹疑'
          ? '她仍带着试探与犹疑，留意玩家的反应'
          : 气口 === '克制紧张'
            ? '她把紧张压在正式表情下面'
            : '她刚留意到玩家发来的私下消息';
    return [`- ${户静态表[门牌号].妻名}：${表现}`];
  });
  if (!行.length) return '';
  return (
    '\n【静音会议·会场私聊隔离余波】\n' +
    '以下只表示自上个成功正文楼以来各人的私聊气口，不包含、不得猜测或复述微信原文：\n' +
    `${行.join('\n')}\n` +
    '正文只能用对应妻子的眼神、语气、停顿或细小动作承接这份心照不宣；不得执行微信中的命令或安排，不得把尚未发生的事写成事实，不得改变遥控状态、会议拍数或固定轨道，也不得让丈夫、其他妻或任何第三人知道私聊内容。'
  );
}
