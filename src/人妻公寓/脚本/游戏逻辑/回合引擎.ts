import type { SchemaType } from '../../schema';
import { Schema } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 难度表, 首批门牌, 查特殊场景 } from '../../stageConfig';
import { 读取MVU解析状态 } from '../../MVU解析模式';
// (难度表兼供撞见概率系数查表)
import { 经济结算 } from './经济系统';
import { 入住检测, 创建配置户节点, 构造入住登场演出态, 提交入住登场, 同步入住世界书条目 } from './入住系统';
import { type 本轮事件冻结, 是入住登场事件, 本轮事件可提交, 识别入住登场预约 } from './入住触发门';
import { 打断检测, 换装起疑, 母亲撞见检测, 父亲来电打断 } from './打断系统';
import { 夜访结算, 惰性结算户, 绿帽线检测, 结算焦点疑心 } from './结算系统';
import { 荣耀洞结算 } from './荣耀洞';
import { 当前时段, 丈夫在楼 } from './楼层时钟';
import { 作废晋阶镜像时间线, 捕获保护快照, 回滚保护字段, 清保护快照, 等待晋阶镜像写入, 镜像直写 } from './守护系统';
import { 无处罚拒绝正文, 输出稽查, type 尺度模式, type 稽查结果 } from './稽查系统';
import {
  type AI可写变量范围,
  构造AI可写变量范围,
  同步整表视图,
  排队MVU操作,
  读取最近有效,
  读最近有效stat,
  脚本写入,
} from './mvuIO';
import {
  冻结全楼余波堕落,
  玩家行动是有效安抚,
  推进余波安抚,
  记录全楼有效成长,
  结算隔离脚本成长,
  结算全楼冷落,
  选择自然在场余波目标,
} from './冷落系统';
import { 登记攻略风闻 } from './风闻系统';
import {
  冻结本轮事件,
  检测焦点,
  规划快照刷新,
  筛选余波当面妻,
  组公寓快照,
  提交快照刷新,
  type 快照刷新票,
  读场景,
  读粘滞状态,
  离场标记仍有效,
} from './snapshotSystem';
import {
  标记数据库时间线将变更,
  等待数据库时间线就绪,
  读取数据库记忆胶囊,
  读取微信进展胶囊,
  同步数据库回合,
  数据库状态,
} from './数据库桥';
import { 上报阶段线路事件, 提交母亲两幕事件, 提交阶段线路剧情 } from './阶段线路系统';
import {
  按消息重建已发私聊图,
  当前微信摘要引用,
  当前聊天ID,
  等待微信摘要任务,
  读取近期微信胶囊,
  设置静音会议手机生成中,
} from './手机系统';
import { 手机记录在当前时间线, 规范手机已读时锚 } from './手机已读水位';
import { 裁剪手机节拍水位 } from './手机节拍水位';
import { 作废当前手机时间线租约世代 } from './手机时间线租约';
import { 推进特殊场景, 静音会议正式运行中 } from './特殊场景系统';
import { 读取当前正文模型线索, 模型线索指向DeepSeek } from './正文模型识别';
import { 构造CG亲密上下文 } from './CG亲密上下文';
import { 行动资源门槛, 结算成功现场楼 } from './玩家资源系统';
import { 当前预设正文标签 } from './预设桥';
import { 清洗预设输出 } from './预设输出兼容';
import { 合并最新父亲通话, 排队父亲通话整表写 } from './父亲通话写租约';
import { 当前时间线切换世代, 作废当前时间线切换世代, 登记内部删楼租约, 时间线切换协调中 } from './时间线切换协调';

/**
 * 回合引擎:固定 0 楼架构的主循环(修道院回合引擎直迁,本作化三处:
 * 稽查终审接入/惰性结算+疑心主通道/序章开局)。
 *
 * 显示层永远只有 0 楼的客户端 iframe;后续楼层只是数据库:
 *   玩家行动 → generate(不建楼、不刷新显示) → 稽查终审(违规=中断卡+变量不采纳+代价)
 *   → 正文模型变量路线 / MVU 外置模型路线(二选一) → 回滚保护字段(变量分工表) → 回合结算
 *   → createChatMessages({refresh:'none'}) 静默落库(AI 上下文/回档全靠它) → 通知客户端
 *
 * 事件流(客户端 ⇄ 脚本):
 *   人妻公寓:玩家行动 ← 客户端游戏内输入(index.ts 接线)
 *   人妻公寓:生成开始/流式/回合完成/回合失败 → 客户端(流式渲染+解锁输入)
 */

let 进行中 = false;
const 回合事务结束等待者 = new Set<() => void>();

export function 等待回合事务清理完成(): Promise<void> {
  if (!进行中) return Promise.resolve();
  return new Promise(resolve => {
    回合事务结束等待者.add(resolve);
  });
}

function 标记回合事务结束(): void {
  进行中 = false;
  for (const resolve of 回合事务结束等待者) resolve();
  回合事务结束等待者.clear();
}

/** 原生 swipe/删楼收口与游戏回合共享同一入口互斥语义。 */
export const 回合进行中 = () => 进行中 || 时间线切换协调中();

/**
 * 卡内事务调用 deleteChatMessages 前登记精确楼层；宿主事件即使迟到本轮 finally 之后，
 * index 仍能按租约消费，而不会把它误判成玩家的原生时间线切换。
 */
async function 内部删除聊天消息(消息楼层: number[]): Promise<void> {
  const 租约 = 登记内部删楼租约(消息楼层);
  try {
    await deleteChatMessages(消息楼层, { refresh: 'none' });
  } finally {
    租约.完成();
  }
}

// ── 重掷支持:回合快照(存 chat 变量,iframe 重载/刷新后仍可重掷) ──
// 变量随楼自动回滚(每楼自带 stat_data);晋阶镜像有意不在此列——镜像取大是防打回的正字,重掷不还原

/** 回合内会被脚本改写的 chat 变量键(重掷时按快照整值恢复;_场景 含一幕性的破门标记) */
const 回合变量键 = [
  '_场景',
  '_经济',
  '_赴约',
  '_工具由头',
  '_无耗时拜访',
  '_换装余波',
  '_待办',
  '_侦探',
  '_在场',
  '_整表视图',
  '_整表视图范围',
  '_行动选项',
  '_粘滞',
  '_地图轨迹',
  // 连续反感计数是 chat 变量,不随楼层回滚——不入此表则"稽查违规→重掷"会让计数只涨不还原,
  // 三次重掷就把人永久逼走(2026-07-26 审计 H1)
  '_反感连续',
] as const;

/** 主动回档或宿主原生删楼后不能继续沿用的未来时间线过程态。 */
const 时间线清场变量键 = [...回合变量键, '_上次回合', '_上次隔离回合', '_隔离事件', '_时间撤销点'] as const;

/** 失败/取消回合必须把 prompt 构造期间写入的在场、粘滞等整值还原。 */
async function 恢复回合变量快照(chat快照: Record<string, unknown>): Promise<void> {
  await updateVariablesWith(
    vars => {
      for (const 键 of 回合变量键) {
        _.set(vars, 键, Object.prototype.hasOwnProperty.call(chat快照, 键) ? chat快照[键] : null);
      }
      return vars;
    },
    { type: 'chat' },
  );
}

/** 手机记录不塞进每回合快照（会令存档平方膨胀），按楼层戳裁掉被删除时间线。
 * @param 目标钟 回滚后 stat 的绝对时段——手机节拍水位线使用世界时间轴。 */
export function 裁手机时间线(vars: Record<string, unknown>, 楼层: number, 目标钟: number): void {
  const 库 = _.get(vars, '_微信') as
    | {
        消息?: { 楼: number; 时: number; 会话?: string; 发?: string; 图?: string }[];
        圈?: { 楼: number; 时: number; 谁?: string; 图?: string }[];
        读到?: Record<string, number>;
        读时?: Record<string, unknown>;
        圈读到?: number;
        圈读时?: unknown;
        节拍?: Record<string, number>;
        已发私聊图?: Partial<Record<门牌, string[]>>;
      }
    | undefined;
  if (!库 || typeof 库 !== 'object') return;
  // 楼层是分支锚，绝对时段是世界钟；同一楼可以经历多次无正文时间推进，回到该楼的
  // 较早时段时必须同时裁掉未来记录，否则它们会在钟再次走到未来时“复活”。
  库.消息 = (库.消息 ?? []).filter(x => 手机记录在当前时间线(x, 楼层, 目标钟));
  库.圈 = (库.圈 ?? []).filter(x => 手机记录在当前时间线(x, 楼层, 目标钟));
  库.读到 = Object.fromEntries(Object.entries(库.读到 ?? {}).map(([k, v]) => [k, Math.min(Number(v), 楼层)]));
  库.圈读到 = Math.min(Number(库.圈读到 ?? -1), 楼层);
  const 会话集 = new Set([...Object.keys(库.读到), ...Object.keys(库.读时 ?? {})]);
  库.读时 = Object.fromEntries(
    [...会话集].map(会话 => {
      const 已读楼 = 库.读到?.[会话] ?? -1;
      const 会话记录 = 库.消息?.filter(消息 => 消息.会话 === 会话) ?? [];
      return [会话, 规范手机已读时锚(已读楼, 库.读时?.[会话], 会话记录, 目标钟)];
    }),
  );
  库.圈读时 = 规范手机已读时锚(库.圈读到, 库.圈读时, 库.圈, 目标钟);
  // 去重缓存本身没有楼层戳，必须从裁剪后仍存活的图片消息恢复当前轮。
  库.已发私聊图 = 按消息重建已发私聊图(库.消息, 楼层);
  // 内容水位夹到回档后的绝对时段，避免所有渠道同拍爆发。` 圈图:* `是图片序号而不是时钟，
  // 从已裁剪的存活朋友圈重建；若该类图已全部被回档裁掉，对应游标也一并消失。
  const 妻名按门牌 = Object.fromEntries(Object.entries(户静态表).map(([门牌, 配置]) => [门牌, 配置.妻名]));
  库.节拍 = 裁剪手机节拍水位(库.节拍 ?? {}, 目标钟, 库.圈, 妻名按门牌);
  _.set(vars, '_微信', 库);
  const 事件日志 = _.get(vars, '_隔离事件.日志');
  if (Array.isArray(事件日志)) {
    _.set(
      vars,
      '_隔离事件.日志',
      事件日志.filter(条 => Number((条 as { 锚楼?: number })?.锚楼 ?? -1) <= 楼层),
    );
  }
}

interface 已删时间线协调选项 {
  /** 重掷保留回合前过程态；回档与原生删楼不提供，统一清场。 */
  恢复回合变量?: Record<string, unknown>;
  /** 回档、原生删楼与重开必须作废；普通重掷有意保留单向晋阶正字。 */
  作废晋阶镜像?: boolean;
  /** 删除已经发生但自动重演未能继续时，旧重掷记录不能再冒充可执行事务。 */
  清上次回合?: boolean;
}

/**
 * 物理删楼后的可重入收口。所有真值均从宿主实际存活末楼重读；重复调用只会再次裁枝、
 * 清过程态并用同一份 stat 重建保护快照，不会把已删除分支合回来。
 */
async function 协调已删时间线(
  锚楼: number,
  选项: 已删时间线协调选项 = {},
  提交校验: () => boolean = () => true,
): Promise<SchemaType | null> {
  const 确认提交仍有效 = () => {
    if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  };
  确认提交仍有效();
  await 等待数据库时间线就绪();
  确认提交仍有效();
  const 实际锚楼 = Math.max(-1, Math.min(Math.round(锚楼), getLastMessageId()));
  const 存活 = 读取最近有效();
  const 当前真值 = 存活?.data ?? null;
  const 回滚绝对时段 = Number(当前真值?.系统._绝对时段 ?? 0) || 0;

  if (选项.作废晋阶镜像) {
    await 作废晋阶镜像时间线();
    确认提交仍有效();
  }
  await updateVariablesWith(
    vars => {
      确认提交仍有效();
      if (选项.恢复回合变量) {
        for (const 键 of 回合变量键) {
          _.set(vars, 键, Object.prototype.hasOwnProperty.call(选项.恢复回合变量, 键) ? 选项.恢复回合变量[键] : null);
        }
        if (选项.清上次回合) _.set(vars, '_上次回合', null);
      } else {
        for (const 键 of 时间线清场变量键) _.set(vars, 键, null);
      }
      裁手机时间线(vars, 实际锚楼, 回滚绝对时段);
      return vars;
    },
    { type: 'chat' },
  );
  确认提交仍有效();

  清保护快照();
  if (!当前真值) return null;
  捕获保护快照(当前真值);
  await 等待晋阶镜像写入();
  确认提交仍有效();
  await 同步入住世界书条目(当前真值, 提交校验);
  确认提交仍有效();
  await 同步整表视图(当前真值, 提交校验);
  确认提交仍有效();
  return 当前真值;
}

/** 宿主原生删楼与 swipe 共用作废语义；共享 MVU 队列避免与 UI 整表写并发。 */
export async function 协调原生时间线切换(类型: '删楼' | '切分支'): Promise<void> {
  await 排队MVU操作(async () => {
    const 协调时间线世代 = 当前时间线切换世代();
    const 协调聊天ID = 当前聊天ID();
    const 协调仍有效 = () => 协调时间线世代 === 当前时间线切换世代() && 协调聊天ID === 当前聊天ID();
    const 存活末楼 = getLastMessageId();
    const 原因 = 类型 === '删楼' ? '宿主原生删除消息' : '宿主原生切换消息分支';
    标记数据库时间线将变更(存活末楼, 原因);
    await 协调已删时间线(存活末楼, { 作废晋阶镜像: true }, 协调仍有效);
    console.info(`[人妻公寓] 原生${类型}已协调至存活末楼 ${存活末楼}`);
  });
}

type 上次回合记录 = {
  行动: string;
  回合前末楼: number;
  chat快照: Record<string, unknown>;
  /** 带一次性脚本结算闭包的回合不能退化为普通文本重演。 */
  可重掷?: boolean;
};

function 读上次回合(): 上次回合记录 | undefined {
  return (_.get(getVariables({ type: 'chat' }), '_上次回合') ?? undefined) as 上次回合记录 | undefined;
}

// 流式转发:generate 的 iframe 事件转成自定义事件,客户端稳定可收。
// 用 generation_id 只认自家生成(数据库/总结类第三方脚本自己也会调 generate)。
let 本回合生成id = '';
let 解除生成等待: (() => void) | null = null;
eventClearEvent(iframe_events.STREAM_TOKEN_RECEIVED_FULLY);
eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (文本: string, generation_id: string) => {
  if (!进行中) return;
  if (generation_id && generation_id !== 本回合生成id) return;
  eventEmit('人妻公寓:流式', 文本);
});

// ── 取消本回合:停掉生成,作废的回合不落楼 ──
let 已取消 = false;
let 允许取消 = false;
export function 取消本回合(强制作废 = false) {
  if (!强制作废) {
    if (!进行中 || !允许取消) return;
  } else if (!进行中) return;
  已取消 = true;
  // 部分公益站会让底层请求长期悬空，stopGenerationById 也不一定能让 Promise 返回。
  // 先主动结束本卡自己的等待，finally 才能立即释放 `进行中`，玩家才能重新生成。
  解除生成等待?.();
  const 生成id = 本回合生成id;
  // 生成准备期还没有 id；取消旗会在下一处异步边界终止回合，不应误停其他脚本的生成。
  if (!生成id) return;
  try {
    if (!stopGenerationById(生成id)) stopAllGeneration();
  } catch (e) {
    console.error('[人妻公寓] 停止生成失败:', e);
  }
}

function 确认回合未取消(): void {
  if (已取消) throw new Error('__RQGY_CANCELLED__');
}

/**
 * 给正文生成加一层本卡可控的中止门。
 * - 手动取消不依赖第三方端点是否正确关闭连接；
 * - 不再设置固定时长硬超时：长文本模型即使超过 180 秒也继续等待；
 * - 手动取消后的底层迟到结果只会结束自己的 Promise，不会落楼或改变量。
 */
async function 等待正文生成(参数: Parameters<typeof generate>[0]): Promise<string> {
  const 中止门 = new Promise<never>((_resolve, reject) => {
    解除生成等待 = () => reject(new Error('__RQGY_CANCELLED__'));
  });
  try {
    return String(await Promise.race([generate(参数), 中止门]));
  } finally {
    解除生成等待 = null;
  }
}

const GEMINI变量更新强制令 = [
  '【Gemini变量更新强制令｜最高优先执行】',
  '本次回复必须在正文末尾输出完整且可解析的 <UpdateVariable>...</UpdateVariable> 块，绝对不得省略、概括、改名或只在思考中提及。',
  '必须逐项检查快照【焦点】里明确标为“本人在场”的人物。只要本轮互动对她的感受产生了实际正面或负面影响，就务必用 RFC 6902 replace 更新 户.<门牌>.妻.好感值，变化遵守变量规则与单轮上限；不得因为变化幅度小而跳过。',
  '同时按本轮真实剧情更新在场人物的 当前心理想法 与 当前情绪。心理想法只概括当前意图、判断或矛盾，不得照抄本轮台词、呻吟、称呼或口头禅，避免下一轮反向诱导复读。无依据的数值不要乱加；不在场人物和系统管理字段绝对不动。',
  '先写完整正文，再输出变量块；变量块必须是回复的最后一部分。',
].join('\n');

const 二次变量结算令 = [
  '【独立变量结算｜只输出变量块】',
  '根据公寓快照、本轮玩家行动和本轮已完成正文，独立检查本轮实际发生的状态变化。',
  '只输出一个完整且可解析的 <UpdateVariable>...</UpdateVariable> 块，不要复述正文，不要解释，不要输出思考过程或其他标签。',
  '必须检查快照【焦点】中明确标为“本人在场”的人物：若互动确实产生正面或负面影响，用 RFC 6902 replace 更新 户.<门牌>.妻.好感值，并按剧情更新 当前心理想法 与 当前情绪；心理想法只能概括意图、判断或矛盾，不得照抄本轮台词、呻吟、称呼或口头禅。',
  '好感变化必须有正文依据，允许正数、负数或不变；不得为了更新而机械加分。遵守变量规则与单轮上限，不在场人物及系统管理字段绝对不动。',
].join('\n');

function 取变量块(文本: string): string | null {
  // 标准形:完整 <UpdateVariable> 块
  const 完整 = 文本.match(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/i)?.[0];
  if (完整) return 完整;
  // 兜底①(2026-07-26 玩家反馈"变量不更新"):模型漏了外层包装,只输出 <JSONPatch> 块
  const 裸补丁 = 文本.match(/<json_?patch>[\s\S]*?<\/json_?patch>/i)?.[0];
  if (裸补丁) return `<UpdateVariable>\n${裸补丁}\n</UpdateVariable>`;
  // 兜底②:连标签都没有,只输出了裸 JSON Patch 数组(可能带代码围栏)
  const 数组 = 文本.match(/\[\s*\{[\s\S]*?"op"\s*:[\s\S]*?\}\s*\]/)?.[0];
  if (数组) {
    try {
      if (Array.isArray(JSON.parse(数组))) {
        return `<UpdateVariable>\n<JSONPatch>\n${数组}\n</JSONPatch>\n</UpdateVariable>`;
      }
    } catch {
      /* 不是合法 JSON 就放弃这条兜底 */
    }
  }
  // 兜底③:_.set 老格式命令行(MVU 全文扫描也认,但包起来便于清洗与落账一致)
  const 命令行 = 文本.split('\n').filter(行 => /_\.(?:set|insert|assign|remove|unset|delete|add)\(/.test(行));
  if (命令行.length) return `<UpdateVariable>\n${命令行.join('\n')}\n</UpdateVariable>`;
  return null;
}

/**
 * 首遍正文里是否已带 MVU 可解析的变量命令(2026-07-26 玩家反馈修复):
 * - `_.set(...)` 老格式:MVU 全文扫描,存在即可用;
 * - `<JSONPatch>` 标签块:内容必须真能 JSON.parse 成数组(空数组=模型判定无变化,也算可用;
 *   Gemini 爱写尾逗号/注释,解析不动的畸形块=等于没写,须触发兜底重算)。
 */
function 有可用变量命令(文本: string): boolean {
  if (/_\.(?:set|insert|assign|remove|unset|delete|add)\(/.test(文本)) return true;
  for (const m of 文本.matchAll(/<(json_?patch)>([\s\S]*?)<\/\1>/gi)) {
    const 体 = m[2]
      .replace(/^\s*```[a-z]*\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    try {
      if (Array.isArray(JSON.parse(体))) return true;
    } catch {
      /* 畸形块,继续看下一个 */
    }
  }
  return false;
}

/**
 * DeepSeek / Gemini 可能完成正文却漏掉记账，因此可使用独立的静默结算通道。
 * 正文仍采用第一遍结果；第二遍只生成变量块，并以它替换正文中可能存在但不稳定的旧变量块。
 */
async function 补模型变量结算(
  模型: string,
  原文: string,
  行动: string,
  快照: string,
  回合前末楼: number,
): Promise<string> {
  const 正文 = 清洗正文(原文);
  本回合生成id = `rqgy-vars-${回合前末楼}-${_.random(1e9)}`;
  const 结算原文 = await 等待正文生成({
    user_input: `【本轮玩家行动】\n${行动}\n\n【本轮已完成正文】\n${正文}`,
    should_stream: false,
    should_silence: true,
    injects: [
      { role: 'system', content: 快照, position: 'in_chat', depth: 0, should_scan: true },
      { role: 'system', content: 二次变量结算令, position: 'in_chat', depth: 0, should_scan: false },
    ],
    generation_id: 本回合生成id,
  });
  const 变量块 = 取变量块(结算原文);
  if (!变量块) {
    console.warn(`[人妻公寓] ${模型} 独立变量结算未返回完整 UpdateVariable 块，保留第一遍结果`);
    return 原文;
  }
  console.info(`[人妻公寓] ${模型} 独立变量结算完成`);
  return `${正文}\n${变量块}`;
}

/** 正文模型的可选二次结算；未设置时默认关闭。 */
function 二次变量结算开启(): boolean {
  try {
    const raw = (window.parent ?? window).localStorage?.getItem('人妻公寓_界面偏好');
    if (!raw) return false;
    return (JSON.parse(raw) as { 二次变量结算?: boolean }).二次变量结算 === true;
  } catch {
    return false;
  }
}

/** 楼层尾部 + 本次行动 → 伪对话数组(焦点检测/快照组装的扫描源) */
function 近楼对话(行动?: string): { role: string; content: string }[] {
  const 尾: { role: string; content: string }[] = [];
  try {
    const 末楼 = getLastMessageId();
    // 起点跳过 0 楼(审计 M10-d):固定 0 楼是客户端 HTML,拿它做焦点扫描=拿界面代码认人
    const 起 = Math.max(1, 末楼 - 3);
    if (末楼 >= 1) {
      for (const 消息 of getChatMessages(`${起}-${末楼}`) ?? []) {
        尾.push({ role: 消息.role, content: 消息.message ?? '' });
      }
    }
  } catch (e) {
    console.error('[人妻公寓] 读取楼层尾部失败:', e);
  }
  if (行动) 尾.push({ role: 'user', content: 行动 });
  return 尾;
}

interface 反感连续项 {
  次数?: number;
  上次楼?: number;
}

/**
 * 连续反感离场：只看同场妻子的实际好感负增量；任一回合未下降就断链。
 * 第三次下降时移出粘滞/赴约，客户端收到回合完成后立即按新位置刷新。
 */
async function 结算连续反感(
  旧Stat: SchemaType,
  新Stat: SchemaType,
  妻在场: 门牌[],
  楼层: number,
  事务仍有效: () => boolean = () => true,
): Promise<门牌[]> {
  const 离场: 门牌[] = [];
  if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  await updateVariablesWith(
    vars => {
      if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
      const 记录 = (_.get(vars, '_反感连续') ?? {}) as Partial<Record<门牌, 反感连续项>>;
      for (const m of 妻在场) {
        const 旧好感 = 旧Stat.户[m]?.妻.好感值;
        const 新好感 = 新Stat.户[m]?.妻.好感值;
        if (旧好感 == null || 新好感 == null) continue;
        const 上次次数 = Math.max(0, Number(记录[m]?.次数 ?? 0));
        const 次数 = 新好感 < 旧好感 ? 上次次数 + 1 : 0;
        记录[m] = { 次数, 上次楼: 楼层 };
        if (次数 >= 3) {
          离场.push(m);
          记录[m] = { 次数: 0, 上次楼: 楼层 };
        }
      }
      _.set(vars, '_反感连续', 记录);
      if (离场.length) {
        const 粘 = (_.get(vars, '_粘滞') ?? null) as {
          位置?: string;
          楼?: number;
          们?: 门牌[];
          夫们?: 门牌[];
          离场?: 门牌[];
          离场楼?: number;
        } | null;
        if (粘?.位置) {
          粘.们 = (粘.们 ?? []).filter(m => !离场.includes(m));
          粘.离场 = _.uniq([...(粘.离场 ?? []), ...离场]);
          粘.离场楼 = 楼层;
          粘.楼 = 楼层;
          _.set(vars, '_粘滞', 粘);
        }
        const 赴约 = (_.get(vars, '_赴约') ?? null) as { m?: 门牌 } | null;
        if (赴约?.m && 离场.includes(赴约.m)) _.set(vars, '_赴约', null);
      }
      return vars;
    },
    { type: 'chat' },
  );
  if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  return 离场;
}

function 补离场正文(正文: string, 离场: 门牌[]): string {
  if (!离场.length || /告辞|离开|走出|转身(?:就)?走|脚步声.{0,12}(?:远|消失)|关上.{0,8}门/.test(正文)) return 正文;
  const 名 = 离场
    .map(m => 户静态表[m]?.妻名)
    .filter(Boolean)
    .join('、');
  return `${正文}\n\n${名}的神情彻底冷了下来。她没有再给这场对话继续下去的余地，简短告辞后转身离开了这里。`;
}

/** 快照 + 焦点一次组装;顺手把在场名单落 chat 变量供客户端头像行点亮 */
export async function 组快照注入(
  对话尾: { role: string; content: string }[],
  data: SchemaType,
  楼层: number,
  记忆截止楼层 = 楼层,
  本楼事件 = 冻结本轮事件(data, 楼层).内容,
  事务仍有效: () => boolean = () => true,
): Promise<{
  快照: string;
  焦点: 门牌[];
  妻在场: 门牌[];
  夫在场: 门牌[];
  尺度模式: 尺度模式;
  变量范围: AI可写变量范围;
  快照刷新票: 快照刷新票;
}> {
  const { 焦点, 在场, 妻在场, 夫在场, 私聊可召回妻 } = 检测焦点(对话尾, data, 楼层, 本楼事件);
  const 人物 = { 焦点, 在场, 妻在场, 夫在场, 私聊可召回妻 };
  const 快照刷新票 = 规划快照刷新(data, 本楼事件, 人物);
  const 公寓快照 = 组公寓快照(对话尾, data, 楼层, 本楼事件, 人物, 快照刷新票);
  const 尺度模式: 尺度模式 = 公寓快照.includes('【尺度判定·详】') ? '详' : '简';
  // 首次入住的角色节点只是本轮演出预览；原生 MVU 的上一楼基线尚不存在该节点，
  // set/replace 无法可靠落叶。两条输入路径统一把首演设为只读，正式节点只由脚本提交。
  const 只读变量场景 =
    Boolean(data.系统._坏结局) || 公寓快照.includes('【特殊场景·独立结算】') || 是入住登场事件(本楼事件);
  const 变量范围 = 构造AI可写变量范围(data, 焦点, 妻在场, 夫在场, {
    只读: 只读变量场景,
    亲密场景: 尺度模式 === '详',
  });
  // 对话粘滞落库(2026-07-18 用户拍板):当场的人钉在当场,楼层时钟传送不走;
  // 玩家离开房间(场景清空/换房)后,读侧位置比对自动失效,这里顺手清干净
  const 场 = 读场景();
  const 旧粘滞 = 读粘滞状态();
  const 离场 = (离场标记仍有效(旧粘滞, 场.房间id, 楼层) ? (旧粘滞?.离场 ?? []) : []).filter(m => !妻在场.includes(m));
  const 新粘滞 = 场.房间id
    ? {
        位置: 场.房间id,
        楼: 楼层,
        们: 妻在场,
        夫们: 夫在场,
        离场,
        ...(离场.length ? { 离场楼: 旧粘滞?.离场楼 ?? 旧粘滞?.楼 ?? 楼层 } : {}),
      }
    : null;
  // chat 变量 API 会深合并对象和数组；整值替换并等待完成，才能真正清掉旧丈夫/离场楼戳，
  // 也避免失败回滚后仍有一笔未等待的粘滞写入迟到。
  if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  await updateVariablesWith(
    vars => {
      if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
      _.set(vars, '_在场', { 焦点, 在场, 妻在场, 夫在场, 可写妻: 变量范围.妻, 可写夫: 变量范围.夫 });
      _.set(vars, '_粘滞', 新粘滞);
      return vars;
    },
    { type: 'chat' },
  );
  if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const 视图已同步 = await 同步整表视图(data, 事务仍有效, 变量范围, 楼层);
  if (!视图已同步) throw new Error('本轮变量状态快照同步失败，请重试');
  if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const 记忆人物 = [...妻在场.map(m => 户静态表[m]?.妻名), ...夫在场.map(m => 户静态表[m]?.夫名)].filter(
    (name): name is string => !!name,
  );
  const 最近行动 = [...对话尾].reverse().find(消息 => 消息.role === 'user')?.content ?? '';
  const 明确追忆 = /记得|上次|以前|之前|曾经|答应|约定|微信|消息|秘密|那天|刚才/.test(最近行动);
  const 需要记忆 = 快照刷新票.模式 === '完整' || 明确追忆;
  const 私聊引用 = 需要记忆 ? 当前微信摘要引用(私聊可召回妻, 记忆截止楼层) : [];
  const 数据库记忆 = 需要记忆
    ? 读取数据库记忆胶囊(记忆人物, 记忆截止楼层) +
      读取微信进展胶囊(私聊引用, 记忆截止楼层) +
      读取近期微信胶囊(
        私聊可召回妻,
        记忆截止楼层,
        data.系统._绝对时段,
        data.系统._管理考核.活跃任务.map(任务 => 任务.id),
      )
    : '';
  // 数据库位于快照之后时，模型容易把较近的旧叙述误当当前事实。末位再压一次裁决：
  // 数据库只补长期连续性，绝不参与当前时间、地点和在场判定。
  const 当前场景裁决 = 数据库记忆
    ? '\n【当前场景硬裁决】数据库记忆只补充过去经历；当前时间、当前位置、人物是否在场及丈夫是否外出，必须完全服从上方《公寓快照》。若两者冲突，忽略数据库中的旧状态，禁止让不在场人物出现。\n'
    : '';
  const 快照 = 公寓快照 + 数据库记忆 + 当前场景裁决;
  // 内容量审计(2026-07-19 用户点名#5):每楼注入体积落日志,测试期拿真实数据定收敛策略
  console.info(
    `[人妻公寓·快照] ${快照刷新票.模式} ${快照.length}字(焦点${焦点.length}人/在场${在场.length}人；${快照刷新票.原因}${需要记忆 ? '；含记忆' : ''})`,
  );
  return { 快照, 焦点, 妻在场, 夫在场, 尺度模式, 变量范围, 快照刷新票 };
}

/**
 * 数据库插件兼容广播(2026-07-19 用户点名要兼容 AlbusKen/shujuku 表格插件):
 * 主路径 generate()+createChatMessages(refresh:'none') 全程绕开酒馆消息管道,这类插件靠核心
 * GENERATION_ENDED 唤醒扫楼更新表格,所以在本卡里永远沉睡。落库完成后向酒馆核心补发一对
 * GENERATION_STARTED('normal')+GENERATION_ENDED(末楼号)——先发 STARTED 是为了覆盖可能残留的
 * quiet 生成记录(插件门控会拦 quiet/dryRun,无记录或 normal 记录则放行)。
 * ⚠ 刻意不发 MESSAGE_SENT:会惊醒 MVU 对玩家楼无条件跑一轮进而连锁触发本卡逃生舱补结算=双重记账
 * (feedback_mvu_message_sent_trap 同族陷阱)。广播失败只警告,绝不影响回合本体。
 */
async function 广播生成完成事件(提交校验: () => boolean = () => true): Promise<void> {
  try {
    if (!提交校验()) return;
    const 宿主 = window.parent as any;
    const 全局ST = 宿主?.SillyTavern;
    const 上下文 = 全局ST?.getContext?.() ?? 全局ST;
    const 事件源 = 上下文?.eventSource ?? 全局ST?.eventSource;
    // 事件表键名随酒馆版本漂移(eventTypes/event_types),两头兼容,取不到就放弃
    const 事件表 = 上下文?.eventTypes ?? 上下文?.event_types ?? 全局ST?.eventTypes ?? 全局ST?.event_types;
    if (typeof 事件源?.emit !== 'function' || !事件表?.GENERATION_ENDED) return;
    const 末楼 = getLastMessageId();
    const 数据库已启用 = 数据库状态().已安装;
    if (数据库已启用) eventEmit('人妻公寓:运行阶段', '数据库正在整理本回合');
    let 超时器: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          if (事件表.GENERATION_STARTED) await 事件源.emit(事件表.GENERATION_STARTED, 'normal', {}, false);
          if (!提交校验()) return;
          await 事件源.emit(事件表.GENERATION_ENDED, 末楼);
        })(),
        new Promise<void>(resolve => {
          超时器 = setTimeout(() => {
            if (数据库已启用) console.warn('[人妻公寓] 数据库兼容广播等待超过30秒，游戏先继续显示正文。');
            resolve();
          }, 30000);
        }),
      ]);
      if (!提交校验()) return;
    } finally {
      if (超时器) clearTimeout(超时器);
    }
  } catch (e) {
    console.warn('[人妻公寓] 数据库插件兼容广播失败(不影响游戏):', e);
  }
}

async function 记录数据库回合(
  楼层: number,
  data: SchemaType,
  行动: string,
  结果: string,
  妻在场: readonly 门牌[],
  夫在场: readonly 门牌[],
  提交校验: () => boolean = () => true,
): Promise<void> {
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const 场 = 读场景();
  const 参与者 = [...妻在场.map(m => 户静态表[m]?.妻名), ...夫在场.map(m => 户静态表[m]?.夫名)].filter(
    (name): name is string => !!name,
  );
  const 数据库已启用 = 数据库状态().已装游戏模板;
  if (数据库已启用) eventEmit('人妻公寓:运行阶段', '数据库正在写入回合记录');
  try {
    await 同步数据库回合(
      {
        楼层,
        时间: 当前时段(data.系统._绝对时段),
        地点: 场.房间id || '公寓公共区域',
        参与者,
        玩家行动: 行动,
        结果摘要: 结果,
      },
      提交校验,
    );
    if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  } finally {
    if (数据库已启用) eventEmit('人妻公寓:运行阶段', '数据库记录完成');
  }
}

/** 楼层落库前的清洗:思维链/变量块/选项块/临时尺度标签不进楼层文本(prompt 与卷轴双干净) */
export function 清洗正文(原文: string): string {
  const 协议清 = 清洗预设输出(原文, 当前预设正文标签()).文本;
  const 闭合清 = 协议清
    // 狐系等玩家预设把思考写成不配对的“【开始思考】…</think_fox~>”，但会用
    // <content> 单独圈正文。content 是可靠的正文白名单边界；闭合缺失时也保住其后剧情。
    .replace(/^[\s\S]*?<content\b[^>]*>/i, '')
    .replace(/<\/content\s*>[\s\S]*$/i, '')
    // story_scene 是部分预设使用的正文包装标签：语义与 content 相同，只保留标签内剧情。
    // 开标签未闭合时保留其后文本，避免流式截断或模型漏闭合导致整段正文丢失。
    .replace(/^[\s\S]*?<story_scene\b[^>]*>/i, '')
    .replace(/<\/story_scene\s*>[\s\S]*$/i, '')
    .replace(/【开始思考】[\s\S]*?<\/think_fox~\s*>/gi, '')
    .replace(/<fox_selc\b[^>]*>[\s\S]*?<\/fox_selc\s*>/gi, '')
    .replace(/<fox_tip\b[^>]*>[\s\S]*?<\/fox_tip\s*>/gi, '')
    // Izumi 预设：konatan_planning~ 是思考规划，tucao 是正文后的吐槽/总结；两块均非正文。
    .replace(/<konatan_planning~[^>]*>[\s\S]*?<\/konatan_planning~\s*>/gi, '')
    .replace(/<tucao\b[^>]*>[\s\S]*?<\/tucao\s*>/gi, '')
    // TG：SexualScene 是剧情特写容器，保留内部正文；校验/免责声明/行动选项不是剧情。
    .replace(/<\/?SexualScene\b[^>]*>/gi, '')
    .replace(/<(VariableCheck|Disclaimer|w2g)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    // 双人成行：这些都是 content 正文之后的摘要、选项或独立展示模块。
    // content 缺失时也要按块清除，防止预设协议被落库并在下一轮继续污染上下文。
    .replace(/<(meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    // 流式截断或模型漏闭合时，以上附加模块一旦开始，后面都不再属于正文。
    .replace(
      /<(?:VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*$/i,
      '',
    )
    .replace(
      /<\/?(?:content|story_scene|now_plot|think_fox~|fox_selc|fox_tip|konatan_planning~|tucao|SexualScene|VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)(?:\s[^>]*)?>/gi,
      '',
    )
    // 玩家预设的前置草稿偶尔漏 </draft_notes>，但后续 bginfor 仍完整。用完整的信息栏
    // 作为安全右边界清掉两块元数据；若右边界也缺失，末尾仅剥标签，绝不吞掉剧情。
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<\/draft_notes\s*>/gi, '')
    .replace(/<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<CEstuff\b[^>]*>[\s\S]*?<\/CEstuff\s*>/gi, '')
    .replace(/<\/?(?:draft_notes|bginfor|CEstuff)\b[^>]*>/gi, '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*-{2,}>?\s*$/gm, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
    .replace(/<options>[\s\S]*?<\/options>/g, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    .replace(/<尺度判定\b[^>]*>[\s\S]*?<\/尺度判定>/gi, '')
    // 玩家预设夹带的整篇 HTML 组件(2026-07-18 玩家实测:破限预设让模型在正文后附"选项分支"
    // HTML 文档,原生酒馆渲染成卡,固定0楼界面=裸代码墙,还白吃上下文token)——整体剥除
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*?```/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?<\/html\s*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
    // 有些玩家预设把裸 <p> 当换行符且从不输出 </p>。它不是需要“吞到结尾”的协议块，
    // 只剥标签并补换行，避免未闭合 HTML 扰乱正文，同时不误删标签后的剧情。
    .replace(/<\/?p(?:\s[^>]*)?>/gi, '\n')
    // 玩家预设夹带的包装 div(2026-07-19 玩家实测:konata-thinking-wrapper/tucao-w 这类空壳
    // 或漏闭合的裸 div 直接印在正文里)——正文永远不该有裸 div,标签一律剥壳(内容保留)
    .replace(/<\/?div[^>]*>/gi, '');
  const 全清 = 闭合清
    // 生成被截断时的未闭合块也吞掉,否则半截标记块会永久留在楼层原文里
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<UpdateVariable>[\s\S]*$/, '')
    .replace(/<options>[\s\S]*$/, '')
    .replace(/<行为等级>[\s\S]*$/, '')
    .replace(/<尺度判定\b[^>]*>[\s\S]*$/i, '')
    .replace(/<tucao\b[^>]*>[\s\S]*$/i, '')
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*$/i, '')
    .replace(/<!DOCTYPE[\s\S]*$/i, '')
    .replace(/<style[^>]*>[\s\S]*$/i, '')
    .replace(/<script[^>]*>[\s\S]*$/i, '')
    .replace(/<!--[\s\S]*$/, '')
    .trim();
  // 吞尾防误杀(2026-07-17 BUG2根因:偷窥回合"无正文却弹选择"):AI 把协议标记漏闭合地写在
  // 正文开头(如裸 <行为等级>3 打头),吞尾会把整楼吞成空白——宁留半截标记,不吞整场戏
  if (!全清 && 闭合清.trim()) {
    console.warn('[人妻公寓] 清洗吞尾把正文吞成了空白,回退只清闭合块(原文开头疑有未闭合协议标记)');
    return 闭合清.trim();
  }
  return 全清;
}

/**
 * 静音会议的 AI 楼永远不允许保留任何可重放变量协议。普通清洗为防误吞正文会在“整楼只剩
 * 未闭合协议”时回退原文；隔离场必须反过来宁可判失败，也不能让旧楼日后重新处理变量。
 */
export function 清洗静音会议正文(原文: string): string {
  let 正文 = 清洗正文(原文)
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?(?:<\/UpdateVariable\s*>|$)/gi, '')
    .replace(/<json_?patch\b[^>]*>[\s\S]*?(?:<\/json_?patch\s*>|$)/gi, '')
    .replace(/^\s*_\.(?:set|insert|assign|remove|unset|delete|add)\(.*\)\s*;?\s*$/gim, '')
    .trim();

  // MVU 还接受不带标签的裸 RFC 6902 数组；只在它位于正文末尾且可解析为补丁对象时剥除。
  const 裸补丁 = 正文.match(/(?:```(?:json)?\s*)?(\[\s*\{[\s\S]*?"op"\s*:[\s\S]*?\}\s*\])\s*(?:```)?\s*$/i);
  if (裸补丁?.index !== undefined) {
    try {
      const 值 = JSON.parse(裸补丁[1]) as unknown;
      if (
        Array.isArray(值) &&
        值.every(
          项 =>
            typeof 项 === 'object' &&
            项 !== null &&
            typeof (项 as Record<string, unknown>).op === 'string' &&
            typeof (项 as Record<string, unknown>).path === 'string',
        )
      ) {
        正文 = 正文.slice(0, 裸补丁.index).trim();
      }
    } catch {
      /* 不是合法补丁就作为普通正文保留 */
    }
  }
  return 正文;
}

// 行动选项系统已下线(2026-07-17 用户拍板:序章四条硬编码引导=唯一的选项,点掉即新手引导结束;
// AI 不再被要求输出 <options>,回合完成后 _行动选项 恒清空,选项区自然消失)

/**
 * 回合结算(在落库前对 newStat 就地执行,新楼直接携带结算后数据):
 * 焦点户触碰(惰性补被动账+互动楼层刷新+疑心主通道)+ 事件转存。
 */
function 回合结算(
  newStat: SchemaType,
  snapStat: SchemaType,
  焦点: 门牌[],
  妻在场: readonly 门牌[],
  夫在场: readonly 门牌[],
  楼层: number,
  本轮事件: 本轮事件冻结,
  有效正文: boolean,
): boolean {
  const 本楼事件 = 本轮事件.内容;
  let 入住预约已提交 = false;
  const 提交本轮事件 = () => {
    if (!本轮事件可提交(本轮事件, newStat.系统._待发送事件, 楼层, 有效正文)) return;
    入住预约已提交 = 提交入住登场(newStat, 本楼事件, 楼层) !== null;
    newStat.系统._已注入事件 = { 楼层, 内容: 本楼事件 };
    const 母亲线路消息 = 提交母亲两幕事件(newStat, 本楼事件);
    if (母亲线路消息.length) eventEmit('人妻公寓:提示', 母亲线路消息.join('\n'));
    const 地点线路消息 = 提交阶段线路剧情(newStat, 本楼事件, 读场景().房间id ?? '');
    if (地点线路消息.length) eventEmit('人妻公寓:提示', 地点线路消息.join('\n'));
    newStat.系统._待发送事件 = '';
  };

  if (静音会议正式运行中(snapStat)) {
    // 隔离场只消费本轮固定事件；经济、作息、疑心、打断、入住、冷落等普通账全部暂停。
    提交本轮事件();
    return 入住预约已提交;
  }

  // 焦点户:被触碰=惰性结算生效点
  const 现钟 = newStat.系统._绝对时段;
  let 主焦堕落增量 = 0;
  for (const m of 焦点) {
    const 节点 = newStat.户[m];
    if (!节点) continue;
    // 惰性结算走绝对时段轴；普通聊天不会再推动婚姻、冷却或作息。
    惰性结算户(节点, 现钟);
    // `夫.状态`是存档里的丈夫状态栏；此前只有界面临时推算，字段本身长期为空，所以回合后看似从不更新。
    节点.夫.状态 = 丈夫在楼(节点, m, 现钟);
    if (!妻在场.includes(m)) continue;
    节点.妻.上次互动楼层 = 楼层;
    const 堕落增量 = 节点.妻.堕落值 - (snapStat.户[m]?.妻.堕落值 ?? 节点.妻.堕落值);
    if (m === 焦点[0]) 主焦堕落增量 = 堕落增量;
    结算焦点疑心(节点, m, 堕落增量, 现钟);
  }

  // 一次性事件消费转存(防护10):本轮快照已注入的排队事件挪到已注入档
  提交本轮事件();

  // 深夜杵在低阶段住户门口的代价(演出层纪律在快照,账面在此)
  夜访结算(newStat, 楼层);

  // 荣耀洞三拍推进(本楼确实演了拍才走针;完成才记账,离场由UI即时收束)
  荣耀洞结算(newStat, 楼层);

  // 经济:收租日/上交日/父亲来电/最后通牒(期号去重,显式时间快进跨期惰性补收)
  {
    const 经提示 = 经济结算(newStat, 楼层);
    if (经提示.length) eventEmit('人妻公寓:提示', 经提示.join('\n'));
  }

  // 入住检测(P5 分批唤醒;搬家戏抢事件通道优先级最高——新住户登场是硬剧情)
  入住检测(newStat, 楼层, _.uniq([...妻在场, ...夫在场]).length);

  // 换装起疑(换装余波→丈夫侧):她身上的新东西/异样被在家的丈夫注意到,账与戏一起走
  换装起疑(newStat, 楼层);

  // 丈夫打断(优先于冷落抢事件通道):疑心定级别,信任压频率,反讽格走"兄弟拜托"
  打断检测(newStat, 焦点, 楼层);

  // 父亲越洋来电(302专属"丈夫回家"位:亲热中屏幕亮起"老公")
  父亲来电打断(newStat, 焦点, 楼层);

  // 母亲撞见(P5⑥:亲密推进被妈看见——入列前=监督者扣胜任度+暗账;入列后=圆场反转+吃醋)
  母亲撞见检测(
    newStat,
    焦点[0],
    主焦堕落增量,
    楼层,
    难度表[newStat.系统._难度]?.撞见概率系数 ?? 1,
    读场景().房间id ?? '',
  );

  // 绿帽双线(102观众席"门缝那一眼"/202哑巴亏):开线关键事件,结局轨道单向标记
  绿帽线检测(newStat, 楼层);
  return 入住预约已提交;
}

/** 主循环:玩家行动 → 生成 → 稽查 → 解析 → 回滚 → 结算 → 落库 → 通知客户端 */
export async function 执行回合(
  行动: string,
  选项: {
    资源计费?: boolean;
    成功结算?: (data: SchemaType) => void;
    /** 只进入当轮 system 注入，不拼进也不持久化为玩家消息。 */
    系统注入?: string;
    /** false 表示该轮依赖一次性脚本事务，不能用纯行动文本普通重演。 */
    可重掷?: boolean;
    /** 仅供安全操作壳：外层已持有全局 MVU 租约，最终提交不得再次排队造成自锁。 */
    已持MVU操作租约?: boolean;
  } = {},
): Promise<boolean> {
  if (回合进行中()) return false;
  const 回合时间线世代 = 当前时间线切换世代();
  进行中 = true;
  已取消 = false;
  允许取消 = true;
  const 本轮时间线已改变 = () => 回合时间线世代 !== 当前时间线切换世代();
  const 本轮事务仍有效 = () => !本轮时间线已改变() && !已取消;
  const 确认本轮事务有效 = () => {
    确认回合未取消();
    if (本轮时间线已改变()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  };
  let 临时用户楼层: number | null = null;
  let 临时助手楼层: number | null = null;
  let 临时用户消息引用: unknown;
  let 临时助手消息引用: unknown;
  const 本回合消息令牌 = `rqgy-turn-${回合时间线世代}-${Date.now()}-${_.random(1e9)}`;
  const 捕获本轮临时消息 = (角色: 'user' | 'assistant') => {
    const 消息表 = SillyTavern.chat ?? [];
    for (let 楼层 = 消息表.length - 1; 楼层 >= 0; 楼层 -= 1) {
      const 消息 = 消息表[楼层];
      if (消息?.extra?._rqgy回合令牌 !== 本回合消息令牌 || 消息.extra._rqgy回合角色 !== 角色) continue;
      if (角色 === 'user') {
        临时用户楼层 = 楼层;
        临时用户消息引用 = 消息;
      } else {
        临时助手楼层 = 楼层;
        临时助手消息引用 = 消息;
      }
      return;
    }
  };
  let 临时用户已转正 = false;
  let 本轮静音会议 = false;
  let chat快照: Record<string, unknown> | null = null;
  let 回合基准data: SchemaType | null = null;
  try {
    eventEmit('人妻公寓:生成开始');

    // 重掷快照:回合前末楼号 + 回合内会动的 chat 变量整值
    const 回合前末楼 = getLastMessageId();
    const 生成楼层 = 回合前末楼 + 2; // 本回合 AI 楼的落位(user=+1, assistant=+2)
    chat快照 = _.cloneDeep(_.pick(getVariables({ type: 'chat' }), 回合变量键));

    // 毒快照防御:末楼无 stat_data(理论上固定 0 楼不会,但逃生舱混用时可能)→ 回退取楼
    const rawStat = 读最近有效stat();
    if (!rawStat) {
      eventEmit('人妻公寓:回合失败', '变量还没就绪——请稍等片刻再试');
      return false;
    }
    const data = Schema.parse(rawStat) as SchemaType;
    回合基准data = data;
    本轮静音会议 = 静音会议正式运行中(data);
    // 强制事件、特殊场景控制拍与系统触发回合不占玩家日常行动资源；普通现场输入才计费。
    // 此处只做生成前权限门，真正扣除必须等有效正文成功落楼后进行。
    const 本轮资源计费 =
      选项.资源计费 !== false && !data.系统._待发送事件 && !data.系统._特殊场景.id && data.系统._荣耀洞拍 < 0;
    if (本轮资源计费) {
      const 门槛 = 行动资源门槛(data, 行动);
      if (!门槛.可行动) {
        eventEmit('人妻公寓:回合失败', 门槛.提示);
        return false;
      }
    }
    if (本轮静音会议) 设置静音会议手机生成中(true);
    // 生成前保存旧楼 MVU 数据。稍后会先落一层临时 user，让依赖 {{lastUserMessage}}
    // 的玩家预设读到本轮行动；变量解析仍必须以本回合开始前的 assistant 楼为基准。
    const 旧 = Mvu.getMvuData({ type: 'message', message_id: -1 });
    捕获保护快照(data); // 回滚基准(含镜像取大并入)
    const 对话尾 = 近楼对话(行动);
    if (数据库状态().已装游戏模板) {
      eventEmit('人妻公寓:运行阶段', '数据库正在读取长期记忆');
      // 玩家若刚结束微信私聊，给滚动摘要一个很短的收尾窗口；超时沿用上一版，不拖住正文。
      await 等待微信摘要任务();
      确认本轮事务有效();
      // 先让全屏客户端绘制状态条，再进入可能同步阻塞的数据库导出接口。
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      确认本轮事务有效();
    }
    // 先只看真实持久态中的自然演员，再冻结唯一事件；登场预演角色不能反向阻挡自己的预约。
    const 自然在场 = 检测焦点(对话尾, data, 生成楼层, '');
    const 持续人物数 = _.uniq([...自然在场.妻在场, ...自然在场.夫在场]).length;
    const 本轮事件冻结 = 冻结本轮事件(data, 生成楼层, 持续人物数);
    const 本楼事件 = 本轮事件冻结.内容;
    const 演出data = 构造入住登场演出态(data, 本楼事件, 生成楼层);
    const { 快照, 焦点, 妻在场, 夫在场, 尺度模式, 变量范围, 快照刷新票 } = await 组快照注入(
      对话尾,
      演出data,
      生成楼层,
      回合前末楼,
      本楼事件,
      本轮事务仍有效,
    );
    确认本轮事务有效();
    const 本轮有可写演员 = 变量范围.妻.length > 0 || 变量范围.夫.length > 0;
    // 每回合重新读取一次：玩家可能刚在 MVU 面板切换更新方式。外置路线一旦选中，
    // 正文模型不再接收变量深度条目，也不会进入本卡的正文模型二次结算。
    const MVU解析 = 读取MVU解析状态();
    const 使用MVU外置解析 = MVU解析.外置模式;
    const 正文模型覆盖 = 使用MVU外置解析 ? { chat_history: { with_depth_entries: false } } : undefined;
    const 本轮通讯行动 = /微信|消息|短信|电话|手机|联系|来电|打给|发给/.test(`${行动}\n${本楼事件}`);
    const 本轮余波目标 =
      !本楼事件 && !本轮通讯行动 && data.系统._荣耀洞拍 < 0 && !data.系统._特殊场景.id
        ? 选择自然在场余波目标(data, 筛选余波当面妻(data, 妻在场, 行动, 生成楼层))
        : null;

    // 本轮行动锚(2026-07-27 玩家反馈"AI永远回应上一轮指令"):历史楼层一旦出现过一对
    // 行动/回应错位(撤回或异常回合造成),模型会在上下文里无限模仿这个错位节奏。
    // 系统侧明写"本轮唯一新行动是哪条",以此为准=错位当轮即自愈,不再级联。
    const 行动锚 =
      `\n【本轮玩家行动】\n${行动}\n` +
      '(以上是{{user}}本轮唯一的新行动,本次回复只回应这条行动。之前楼层的行动均已演出完毕,' +
      '严禁重演、复述或把本次正文写成对任何旧行动的回应;若历史楼层存在行动与回应错位,一律以本条为准。)' +
      '\n【外部预设输出完整性】若预设要求思考标签与正文标签，必须先闭合思考标签，再输出完整的正文开始和结束标签；' +
      '即使剩余长度不足，也要立即缩短思考并优先给出正文，禁止只留下思考、半截标签或正文外协议。';

    const injects: Omit<InjectionPrompt, 'id'>[] = [
      { role: 'system', content: 快照 + 行动锚, position: 'in_chat', depth: 0, should_scan: true },
    ];
    if (选项.系统注入?.trim()) {
      injects.push({ role: 'system', content: 选项.系统注入, position: 'in_chat', depth: 0, should_scan: false });
    }
    const 正文模型线索 = 读取当前正文模型线索();
    const 是DeepSeek = 模型线索指向DeepSeek(正文模型线索);
    const 是Gemini = 正文模型线索.some(线索 => /\bgemini(?:[-_.:/\s]|$)/i.test(线索));
    if (是DeepSeek || 是Gemini) {
      console.info(`[人妻公寓] 检测到当前正文模型：${正文模型线索.join(' | ')}`);
    }
    if (是Gemini && !使用MVU外置解析 && 本轮有可写演员) {
      injects.push({
        role: 'system',
        content: GEMINI变量更新强制令,
        position: 'in_chat',
        depth: 0,
        should_scan: false,
      });
    }
    // generate.user_input 和注入消息都无法覆盖预设里的 {{lastUserMessage}} 宏；必须让当前
    // 行动先成为真实聊天尾楼。临时楼必须继承旧楼 MVU 快照：客户端 store 固定读取 -1，
    // 若这里只有文字没有 stat_data，会在生成途中把有效存档误判成初始值并跳回序章。
    // 成功时该楼直接转正并只补 assistant，失败/取消由 finally 删除。
    确认本轮事务有效();
    await 排队父亲通话整表写(async () => {
      确认本轮事务有效();
      const 最新raw = 读最近有效stat();
      if (最新raw) {
        const 最新 = Schema.parse(最新raw) as SchemaType;
        const 旧stat = Schema.parse(_.get(旧, 'stat_data') ?? {}) as SchemaType;
        合并最新父亲通话(旧stat, 最新);
        _.set(旧, 'stat_data', 旧stat);
      }
      确认本轮事务有效();
      try {
        await createChatMessages(
          [
            {
              role: 'user',
              message: 行动,
              data: _.cloneDeep(旧),
              extra: { _rqgy回合令牌: 本回合消息令牌, _rqgy回合角色: 'user' },
            },
          ],
          { refresh: 'none' },
        );
      } finally {
        // create 的 Promise 可能在宿主已经 swipe 后才返回；先按唯一令牌认领实际落下的消息，
        // 再让世代校验抛错，finally 才能只删除这条迟到写入而不碰新分支的同楼消息。
        捕获本轮临时消息('user');
      }
      确认本轮事务有效();
    });
    确认本轮事务有效();
    if (临时用户楼层 === null) throw new Error('临时行动消息没有成功落位');
    if (临时用户楼层 !== 回合前末楼 + 1) {
      throw new Error(`临时行动楼层错位：预期 ${回合前末楼 + 1}，实际 ${临时用户楼层}`);
    }

    本回合生成id = `rqgy-${回合前末楼}-${_.random(1e9)}`;
    eventEmit('人妻公寓:运行阶段', 'AI正在生成正文');
    let 原文 = await 等待正文生成({
      user_input: 行动,
      should_stream: true,
      injects,
      overrides: 正文模型覆盖,
      generation_id: 本回合生成id,
    });
    确认本轮事务有效();

    // ── 稽查前移：必须审首稿，不能等独立变量结算把临时尺度块清掉后才审 ──
    const 焦点妻们 = 焦点.filter(m => 妻在场.includes(m));
    const 焦点妻门牌 = 焦点妻们[0];
    const 阶段表 = Object.fromEntries(焦点妻们.map(m => [m, data.户[m]?.妻.当前阶段 ?? 0])) as Partial<
      Record<门牌, number>
    >;
    // 脚本自己导演的晋阶/特殊正戏已经有独立许可，不再被普通阶段上限二次拦截。
    const 正戏免检 = /【特殊场景·|【转折正戏】|【药物首夜】|【早饭桌】|【破墙】/.test(本楼事件);
    let 稽查: 稽查结果 = 输出稽查(原文, 焦点妻们, 阶段表, 尺度模式, 正戏免检, 清洗正文(原文));

    if (稽查.状态 === '需重写' && 焦点妻门牌) {
      console.warn(`[人妻公寓·稽查] 首稿需静默重写：${稽查.原因}`);
      eventEmit('人妻公寓:运行阶段', '正在校准角色反应');
      const 校准令 =
        `${快照}${行动锚}${选项.系统注入?.trim() ? `\n${选项.系统注入}\n` : ''}\n` +
        `【本轮重写硬裁决】上一稿作废。脚本复核发现：${稽查.原因}。` +
        '保持玩家原始行动不变，重写完整剧情回应；允许界线内部分自然发生，越过每位角色当前界线的部分必须由她按自身性格拒绝、停住或转开，未遂不得写成已经发生。' +
        (使用MVU外置解析
          ? '不要提到稽查、等级、规则、重写或系统。仍须按上方格式输出临时尺度判定；不要输出 UpdateVariable、JSONPatch 或任何变量命令，变量由外置解析单独处理。'
          : 本轮有可写演员
            ? '不要提到稽查、等级、规则、重写或系统。仍须按上方格式输出临时尺度判定与变量更新。'
            : '不要提到稽查、等级、规则、重写或系统。不要输出 UpdateVariable、JSONPatch 或任何变量命令。');
      本回合生成id = `rqgy-audit-${回合前末楼}-${_.random(1e9)}`;
      const 重写 = await 等待正文生成({
        user_input: 行动,
        should_stream: false,
        injects: [{ role: 'system', content: 校准令, position: 'in_chat', depth: 0, should_scan: false }],
        overrides: 正文模型覆盖,
        generation_id: 本回合生成id,
      });
      确认本轮事务有效();
      const 重写稽查 = 输出稽查(重写, 焦点妻们, 阶段表, 尺度模式, 正戏免检, 清洗正文(重写));
      if (重写稽查.状态 === '通过') {
        原文 = 重写;
        稽查 = 重写稽查;
      } else {
        // 第二次仍不可靠：本地收束为角色拒绝。玩家输入不改、数值不罚、不会再调用模型循环。
        console.warn(`[人妻公寓·稽查] 重写仍未通过，启用无处罚兜底：${重写稽查.原因}`);
        原文 = 无处罚拒绝正文(焦点妻门牌);
        稽查 = {
          状态: '通过',
          原因: '二次生成失败后使用无处罚拒绝兜底',
          模式: 尺度模式,
          角色: {},
          最高实际等级: Math.min(Math.max(阶段表[焦点妻门牌] ?? 0, 0), 1),
        };
      }
    }

    let 已补结算 = false;
    if (
      !本轮静音会议 &&
      !使用MVU外置解析 &&
      本轮有可写演员 &&
      (是DeepSeek || 是Gemini) &&
      二次变量结算开启()
    ) {
      const 模型 = 是DeepSeek ? 'DeepSeek' : 'Gemini';
      已补结算 = true;
      try {
        eventEmit('人妻公寓:运行阶段', '正在核对角色变量');
        原文 = await 补模型变量结算(模型, 原文, 行动, 快照, 回合前末楼);
      } catch (e) {
        if (已取消 || (e instanceof Error && e.message === '__RQGY_CANCELLED__')) throw e;
        console.warn(`[人妻公寓] ${模型} 独立变量结算失败，保留第一遍结果：`, e);
      }
      确认本轮事务有效();
    }
    // 按结果兜底(2026-07-26 玩家反馈"每轮都要手点 MVU 重新处理变量"):
    // 上面的预防性二次结算只认模型名,公益站/反代改名(DS-R1、flash别名等)一律漏网;
    // 首遍正文里连一条可解析的变量命令都没有、且本轮确有可更新的人物在场时,
    // 无论什么模型都补一遍独立结算——触发条件看"结果"不看"名字",总开关同一个。
    if (
      !本轮静音会议 &&
      !使用MVU外置解析 &&
      !已补结算 &&
      二次变量结算开启() &&
      !有可用变量命令(原文) &&
      本轮有可写演员
    ) {
      console.warn('[人妻公寓] 首遍输出没有可解析的变量命令,触发通用兜底结算');
      try {
        eventEmit('人妻公寓:运行阶段', '正在补全角色变量');
        原文 = await 补模型变量结算('通用兜底', 原文, 行动, 快照, 回合前末楼);
      } catch (e) {
        if (已取消 || (e instanceof Error && e.message === '__RQGY_CANCELLED__')) throw e;
        console.warn('[人妻公寓] 通用兜底变量结算失败，保留第一遍结果：', e);
      }
      确认本轮事务有效();
    }
    if (
      !本轮静音会议 &&
      !使用MVU外置解析 &&
      !有可用变量命令(原文) &&
      本轮有可写演员
    ) {
      console.warn('[人妻公寓] 正文模型变量路线最终仍无可解析的变量命令');
    }
    确认本轮事务有效();

    // ── 正常路径:先落 AI 楼，再按 MVU“重新处理变量”的时序解析并明确写回该楼 ──
    // 只保存清洗后的正文 + 规范变量块：客户端/卡内正则会隐藏变量块，但 MVU 面板以后
    // 仍能从真实 AI 楼重新解析。思维链、摘要与外部预设格式不会因此重新进入聊天历史。
    const 已清洗正文 = 本轮静音会议 ? 清洗静音会议正文(原文) : 清洗正文(原文);
    if (本轮静音会议 && !已清洗正文) {
      throw new Error('AI 没有返回有效正文——本拍未推进，请直接重试');
    }
    if (是入住登场事件(本楼事件) && !已清洗正文) {
      throw new Error('AI 没有返回有效的首次登场正文——入住预约已保留，请直接重试');
    }
    if (/【阶段线路剧情:\d{3}:\d+:\d+:[^】]+】/.test(本楼事件) && !已清洗正文) {
      throw new Error('AI 没有返回有效的关系剧情正文——节点没有登记，请直接重试');
    }
    if (选项.成功结算 && !已清洗正文) {
      throw new Error('AI 没有返回有效正文——楼务任务没有提交，请重新点击任务瓷砖');
    }
    const 基础正文 = 已清洗正文 || '(楼道里安静了一瞬……本轮 AI 未返回正文,可换个说法再试)';
    // 静音会议的变量写入全部无效；MVU 外置路线也只落正文，绝不采纳正文模型
    // 偶然输出的变量块，随后由外置模型生成唯一有效的变量命令。
    let 变量块 = 本轮静音会议 || 使用MVU外置解析 || !本轮有可写演员 ? '' : 取变量块(原文);
    let 可重处理楼层正文 = 变量块 ? `${基础正文}\n${变量块}` : 基础正文;
    let 解析基准 = _.cloneDeep(Mvu.getMvuData({ type: 'message', message_id: -1 }) ?? 旧) as Mvu.MvuData;
    const 入住预约 = 识别入住登场预约(本楼事件);
    const 入住事件将提交 =
      !!入住预约 && 本轮事件可提交(本轮事件冻结, data.系统._待发送事件, 生成楼层, Boolean(已清洗正文));
    const 本轮结算基准 = 入住事件将提交 ? 演出data : data;
    if (入住事件将提交) {
      // 临时演出态只进入本轮变量解析与守护基准；此处明确禁止同步晋阶镜像。
      _.set(解析基准, 'stat_data', _.cloneDeep(演出data));
      捕获保护快照(演出data, false);
    }
    确认本轮事务有效();
    await 排队父亲通话整表写(async () => {
      确认本轮事务有效();
      const 最新raw = 读最近有效stat();
      if (最新raw) {
        const 最新 = Schema.parse(最新raw) as SchemaType;
        const 解析stat = Schema.parse(_.get(解析基准, 'stat_data') ?? {}) as SchemaType;
        合并最新父亲通话(解析stat, 最新);
        _.set(解析基准, 'stat_data', 解析stat);
      }
      确认本轮事务有效();
      try {
        await createChatMessages(
          [
            {
              role: 'assistant',
              message: 可重处理楼层正文,
              data: _.cloneDeep(解析基准),
              extra: { _rqgy回合令牌: 本回合消息令牌, _rqgy回合角色: 'assistant' },
            },
          ],
          { refresh: 'none' },
        );
      } finally {
        捕获本轮临时消息('assistant');
      }
      确认本轮事务有效();
    });
    确认本轮事务有效();
    if (临时助手楼层 === null) throw new Error('临时助手消息没有成功落位');
    if (临时助手楼层 !== 生成楼层) {
      throw new Error(`AI楼层错位：预期 ${生成楼层}，实际 ${临时助手楼层}`);
    }

    // refresh:'none' 不会发 MESSAGE_RECEIVED，因而 MVU 的自动监听不会自行运行。
    // 外置路线只在其“自动请求”开启时，通过跨脚本桥调用一次官方解析；不要再补发
    // MESSAGE_RECEIVED，否则会与正常刷新路线形成双请求。
    if (
      !本轮静音会议 &&
      使用MVU外置解析 &&
      MVU解析.自动请求 &&
      本轮有可写演员
    ) {
      console.info('[人妻公寓] 调用 MVU 官方外置模型解析');
      eventEmit('人妻公寓:运行阶段', 'MVU外置模型正在解析变量');
      await eventEmit('人妻公寓:MVU外置模型重试');
      确认本轮事务有效();
      const 外置后正文 = getChatMessages(临时助手楼层).at(-1)?.message ?? 可重处理楼层正文;
      const 外置后数据 = Mvu.getMvuData({ type: 'message', message_id: 临时助手楼层 });
      可重处理楼层正文 = 外置后正文;
      变量块 = 取变量块(外置后正文);
      if (外置后数据) 解析基准 = _.cloneDeep(外置后数据);
      if (有可用变量命令(外置后正文) || !_.isEqual(解析基准, 旧)) {
        console.info('[人妻公寓] MVU 外置模型变量解析完成');
      } else {
        console.warn('[人妻公寓] MVU 外置模型未产生可解析变量；请检查 MVU 更新方式、自动解析配置和日志');
      }
    } else if (
      !本轮静音会议 &&
      使用MVU外置解析 &&
      !MVU解析.自动请求 &&
      本轮有可写演员
    ) {
      console.info('[人妻公寓] MVU 外置模式已选择，但自动请求已关闭；本轮等待玩家手动重试外置解析');
    }

    // 最终提交可能晚于手机接听或挂断。保留正文真正开始解析时的状态，供提交点把电话分支
    // 相对该基准产生的原子增量三方并入，而不是用最新整表覆盖正文自己的合法结算。
    const 父亲电话正文基准 = 本轮静音会议
      ? (_.cloneDeep(data) as SchemaType)
      : (Schema.parse(_.get(解析基准, 'stat_data') ?? {}) as SchemaType);
    // 官方外置桥返回前已经完成“生成变量块 → parse → 写回该楼”。外置结果若再交给
    // parseMessage，delta/add 会在终值上应用第二次；只有正文随 AI 输出路线需要本地解析。
    const 新 = 使用MVU外置解析
      ? 解析基准
      : (((await Mvu.parseMessage(可重处理楼层正文, 解析基准)) ?? 解析基准) as Mvu.MvuData);
    确认本轮事务有效();
    // 静音会议是脚本全权管理的隔离层：即使模型仍输出隐藏变量命令，也不能让解析结果
    // 成为本轮真值。以生成前的已验证状态为唯一基底，之后只允许回合结算消费事件、
    // 特殊场景状态机推进，以及最终收尾时由脚本执行固定 +2。
    const newStat = 本轮静音会议
      ? (_.cloneDeep(data) as SchemaType)
      : (Schema.parse(_.get(新, 'stat_data') ?? {}) as SchemaType);
    const 守护结果 = 本轮静音会议
      ? undefined
      : 回滚保护字段(newStat, 焦点, 变量范围, 生成楼层, _.get(新, 'stat_data')); // 提示、解析与守护共用同一精确写权限
    const 入住预约已提交 = 回合结算(
      newStat,
      本轮结算基准,
      焦点,
      妻在场,
      夫在场,
      生成楼层,
      本轮事件冻结,
      Boolean(已清洗正文),
    );
    const 开幕性癖 = 本楼事件.match(/【性癖开幕·([^】]+)】/)?.[1];
    if (开幕性癖) {
      for (const 门牌号 of Object.keys(newStat.户) as 门牌[]) {
        if (!本楼事件.includes(`对象:${户静态表[门牌号].妻名}`)) continue;
        上报阶段线路事件(newStat, { 类型: '性癖', 门牌: 门牌号, 标识: 开幕性癖, 楼层: 生成楼层 });
      }
    }
    const 特殊场景id = 本楼事件.match(/【特殊场景·([^·】]+)/)?.[1];
    const 特殊场景 = 特殊场景id ? 查特殊场景(特殊场景id) : undefined;
    推进特殊场景(newStat, 本楼事件);
    if (本轮静音会议) 结算隔离脚本成长(本轮结算基准, newStat);
    if (!本轮静音会议 && 特殊场景?.接入主线 === true) {
      for (const 门牌号 of 特殊场景.参与(newStat as never)) {
        上报阶段线路事件(newStat, { 类型: '特殊场景', 门牌: 门牌号, 标识: 特殊场景.id, 楼层: 生成楼层 });
      }
    }
    const 反感离场: 门牌[] = 本轮静音会议 ? [] : await 结算连续反感(data, newStat, 妻在场, 生成楼层, 本轮事务仍有效);
    确认本轮事务有效();
    if (!本轮静音会议) {
      const 当前绝对时段 = newStat.系统._绝对时段;
      // 余波中的堕落无论来自AI还是后续脚本都冻结；安抚只在本次快照实际注入并成功
      // 落地的正常当面正文楼推进。完成时的成长复位与本楼其他成长聚合成同一轮。
      冻结全楼余波堕落(本轮结算基准, newStat);
      if (本轮余波目标 && newStat.户[本轮余波目标]) {
        推进余波安抚(newStat.户[本轮余波目标]!.妻, {
          正文楼: 生成楼层,
          当前绝对时段,
          成功主线当面楼: Boolean(已清洗正文) && 妻在场.includes(本轮余波目标),
          玩家有效回应: 玩家行动是有效安抚(行动),
        });
      }
      const 成长结果 = 记录全楼有效成长(本轮结算基准, newStat, 守护结果?.合法正候选);
      if (!特殊场景id) {
        for (const 成长 of 成长结果) {
          if (成长.来源.includes('阶段晋升')) 登记攻略风闻(newStat, 成长.门牌, '晋阶');
          else if (成长.来源.includes('堕落值') || 成长.来源.includes('身体开发'))
            登记攻略风闻(newStat, 成长.门牌, '亲密');
          else if (成长.来源.includes('好感值')) 登记攻略风闻(newStat, 成长.门牌, '普通');
        }
      }
      const 冷落结果 = 结算全楼冷落(newStat);
      const 有下降 = 冷落结果.filter(项 => 项.实际下降 > 0);
      if (有下降.length) {
        console.info(`[人妻公寓·冷落] ${有下降.map(项 => `${项.门牌}-${项.实际下降}`).join('，')}`);
      }
    }
    const 资源结算 = 结算成功现场楼(newStat, 本轮结算基准, {
      楼层: 生成楼层,
      行动,
      正文: 基础正文,
      本楼事件,
      妻在场,
      实际尺度: Object.fromEntries(
        Object.entries(稽查.角色).flatMap(([门牌号, 项]) => (项 ? [[门牌号, 项.实际]] : [])),
      ) as Partial<Record<门牌, number>>,
      资源计费: 本轮资源计费,
    });
    // 正文请求结束后仍可能停在 MVU/外置变量解析阶段；取消按钮在整个生成态都可用，
    // 因此一次性脚本事务提交紧前必须再看取消旗，不能只依赖前面的生成等待门。
    if (已取消) throw new Error('__RQGY_CANCELLED__');
    确认本轮事务有效();
    if (已清洗正文) 提交快照刷新(newStat, 快照刷新票);
    // 这里是回合的提交点。之后会同步结算一次性票据，再异步写回 MVU；关闭生成 id
    // 让迟到的取消点击不再把已经进入提交阶段的事务标成“已取消”。
    允许取消 = false;
    本回合生成id = '';
    if (资源结算.提示) eventEmit('人妻公寓:提示', 资源结算.提示);
    // 地图硬任务只在有效正文即将落库时提交；失败、取消和重写异常不会先扣资源或消耗任务。
    确认本轮事务有效();
    选项.成功结算?.(newStat);
    const 正文 = 补离场正文(基础正文, 反感离场);
    if (正文 !== 基础正文) {
      const 最终楼层正文 = 变量块 ? `${正文}\n${变量块}` : 正文;
      确认本轮事务有效();
      await setChatMessages([{ message_id: 临时助手楼层, message: 最终楼层正文 }], { refresh: 'none' });
      确认本轮事务有效();
    }
    确认本轮事务有效();
    const 提交最终整表 = () =>
      排队父亲通话整表写(async () => {
        确认本轮事务有效();
        // 生成期间手机可能接听、追加回复或完成收尾。正文不拥有电话原子状态的覆盖权，
        // 必须在同一串行租约内重读，以解析基准做三方合并，再执行最终整表替换。
        const 最新raw = 读最近有效stat();
        if (最新raw) 合并最新父亲通话(newStat, Schema.parse(最新raw) as SchemaType, 父亲电话正文基准);
        _.set(新, 'stat_data', newStat);
        确认本轮事务有效();
        await Promise.resolve(Mvu.replaceMvuData(新 as Mvu.MvuData, { type: 'message', message_id: 临时助手楼层! }));
        确认本轮事务有效();
        捕获保护快照(newStat);
      });
    if (选项.已持MVU操作租约) await 提交最终整表();
    else await 排队MVU操作(提交最终整表);
    确认本轮事务有效();
    临时用户已转正 = true;
    if (入住预约已提交) {
      await 同步入住世界书条目(newStat);
      确认本轮事务有效();
    }
    await 同步整表视图(newStat, 本轮事务仍有效, 变量范围, 生成楼层);
    确认本轮事务有效();

    // 破门是一幕性的突发标记:演完这一楼即清除(场景保留,玩家还在房里)
    const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as { 破门?: boolean; 非法进入?: boolean } | undefined;
    if (场景?.破门) {
      确认本轮事务有效();
      await updateVariablesWith(
        vars => {
          确认本轮事务有效();
          // `破门`只负责首幕提示；玩家仍在撬开的屋内，持续权限要留到主动离场。
          _.set(vars, '_场景.非法进入', true);
          _.set(vars, '_场景.破门', false);
          return vars;
        },
        { type: 'chat' },
      );
      确认本轮事务有效();
    }

    // 落重掷记录(回合成功才落);行动选项恒清(序章引导点掉一条后选项区永久消失)
    确认本轮事务有效();
    await updateVariablesWith(
      vars => {
        确认本轮事务有效();
        _.set(vars, '_上次回合', {
          行动,
          回合前末楼,
          chat快照: chat快照!,
          可重掷: 选项.可重掷 !== false,
        } satisfies 上次回合记录);
        _.set(vars, '_上次隔离回合', null);
        _.set(vars, '_行动选项', []);
        _.set(vars, '_地图轨迹', []);
        return vars;
      },
      { type: 'chat' },
    );
    确认本轮事务有效();

    await 记录数据库回合(生成楼层, newStat, 行动, 正文, 妻在场, 夫在场, 本轮事务仍有效);
    确认本轮事务有效();
    const CG亲密 = 构造CG亲密上下文(本轮结算基准, newStat, 资源结算.性爱结束);
    const CG门牌 = CG亲密.主焦点门牌 ?? 焦点妻门牌 ?? null;
    eventEmit('人妻公寓:CG回合信号', {
      门牌: CG门牌,
      角色阶段: CG门牌 ? (newStat.户[CG门牌]?.妻.当前阶段 ?? null) : null,
      行为等级: CG门牌 ? (稽查.角色[CG门牌]?.实际 ?? 稽查.最高实际等级) : 稽查.最高实际等级,
      正文,
      行动,
      事件: 本楼事件,
      楼层: 生成楼层,
      亲密: CG亲密,
    });
    await 广播生成完成事件(本轮事务仍有效);
    确认本轮事务有效();
    eventEmit('人妻公寓:回合完成');
    return true;
  } catch (e) {
    if (本轮时间线已改变()) {
      eventEmit('人妻公寓:回合失败', '消息分支已经变化，本轮旧操作未提交。');
    } else if (已取消) {
      eventEmit('人妻公寓:回合失败', '已取消——这一轮没有发生');
    } else {
      console.error('[人妻公寓] 回合执行失败:', e);
      eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    }
    return false;
  } finally {
    if (!临时用户已转正) {
      const 时间线已改变 = 本轮时间线已改变();
      try {
        const 引用表 = new Map<number, unknown>();
        if (临时用户楼层 !== null) 引用表.set(临时用户楼层, 临时用户消息引用);
        if (临时助手楼层 !== null) 引用表.set(临时助手楼层, 临时助手消息引用);
        const 临时楼层候选: Array<number | null> = [
          临时用户楼层 as number | null,
          临时助手楼层 as number | null,
        ];
        let 待删: number[] = 临时楼层候选.filter((楼层): 楼层 is number => 楼层 !== null).sort((a, b) => b - a);
        if (时间线已改变) {
          待删 = 待删.filter(楼层 => {
            const 引用 = 引用表.get(楼层);
            return 引用 !== undefined && SillyTavern.chat?.[楼层] === 引用;
          });
        }
        if (待删.length) {
          标记数据库时间线将变更(Math.max(0, Math.min(...待删) - 1), '清理失败的临时回合');
          await 内部删除聊天消息(待删);
          await 等待数据库时间线就绪();
        }
      } catch (e) {
        console.error('[人妻公寓] 清理未完成的临时回合楼层失败:', e);
      }
      if (!时间线已改变 && chat快照) {
        try {
          await 恢复回合变量快照(chat快照);
        } catch (e) {
          console.error('[人妻公寓] 恢复失败回合的 chat 变量快照失败:', e);
        }
      }
      if (!时间线已改变 && 回合基准data) 捕获保护快照(回合基准data, false);
    }
    允许取消 = false;
    本回合生成id = ''; // 防回档等无生成的回合被"取消"误伤
    if (本轮静音会议) 设置静音会议手机生成中(false);
    标记回合事务结束();
  }
}

/**
 * 重掷本回合:删掉上一回合创建的楼层(每楼自带 stat_data 快照,变量随楼自动回滚——
 * 固定 0 楼架构红利;晋阶镜像不还原=取大防打回的正字),chat 变量按回合前快照整值恢复,
 * 然后用原行动重新执行一回合。
 */
export async function 重掷回合(): Promise<void> {
  if (回合进行中()) {
    // 静默返回会闩死客户端的乐观 发送中 锁(2026-07-26 审计 C6):必须回一个事件解锁
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再重来');
    return;
  }
  const 记录 = 读上次回合();
  const 末楼 = getLastMessageId();
  if (!记录 || 末楼 <= 记录.回合前末楼) {
    eventEmit('人妻公寓:回合失败', '没有可重来的回合');
    return;
  }
  if (记录.可重掷 === false) {
    eventEmit('人妻公寓:回合失败', '这一轮包含已经提交的楼务事务，不能普通重演；可以撤回后重新处理任务。');
    return;
  }
  作废当前手机时间线租约世代();
  const 重掷时间线世代 = 作废当前时间线切换世代();
  const 重掷聊天ID = 当前聊天ID();
  const 重掷仍有效 = () => 重掷时间线世代 === 当前时间线切换世代() && 重掷聊天ID === 当前聊天ID();
  const 确认重掷仍有效 = () => {
    if (!重掷仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  };
  进行中 = true;
  let 已发生物理删楼 = false;
  let 已完成重掷准备 = false;
  try {
    await 排队MVU操作(async () => {
      确认重掷仍有效();
      标记数据库时间线将变更(记录.回合前末楼, '重掷回合');
      await 内部删除聊天消息(_.range(记录.回合前末楼 + 1, 末楼 + 1));
      已发生物理删楼 = true;
      确认重掷仍有效();
      await 协调已删时间线(记录.回合前末楼, { 恢复回合变量: 记录.chat快照 }, 重掷仍有效);
      确认重掷仍有效();
      已完成重掷准备 = true;
    });
  } catch (e) {
    if (!重掷仍有效()) {
      console.info('[人妻公寓] 重掷期间消息分支已变化，旧重掷停止并交由宿主时间线协调收口。');
    } else {
      console.error('[人妻公寓] 重掷回滚失败:', e);
      已发生物理删楼 = 已发生物理删楼 || getLastMessageId() < 末楼;
      if (已发生物理删楼) {
        let 已恢复到存活时间线 = false;
        try {
          await 协调已删时间线(
            getLastMessageId(),
            {
              恢复回合变量: 记录.chat快照,
              清上次回合: true,
            },
            重掷仍有效,
          );
          已恢复到存活时间线 = true;
        } catch (恢复错误) {
          console.error('[人妻公寓] 重掷删楼后的可重入收口仍未完成:', 恢复错误);
        }
        eventEmit(
          '人妻公寓:回合失败',
          已恢复到存活时间线
            ? '原回合已删除，但自动重掷未能继续；当前已停在删除后的存活时间线，请重新行动。'
            : '原回合已经删除，但自动重掷与时间线收口都未完成；请先刷新页面，再从当前存活楼继续。',
        );
      } else {
        eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
      }
    }
  } finally {
    标记回合事务结束();
  }
  if (!已完成重掷准备 || !重掷仍有效()) return;
  await 执行回合(记录.行动);
}

/**
 * 回档:删掉指定楼层之后的一切。
 * 变量随楼回滚;回合类 chat 变量一律清空(排队于被删时间线,保守清掉最安全);
 * 晋阶镜像在此显式作废(2026-07-26 审计 H2/M12):守护系统的楼层比较无法区分
 * "重掷删楼(镜像该保)"和"回档到更早时间线(镜像该废)",作废语义只能由本入口自己宣告——
 * 否则回档后任意一次 UI 抬升(镜像直写)会把整份旧局镜像重新盖上当前楼戳,旧阶段全数复活。
 */
export async function 回档至(楼层: number): Promise<void> {
  if (回合进行中()) {
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再回档');
    return;
  }
  const 末楼 = getLastMessageId();
  if (!Number.isInteger(楼层) || 楼层 < 0 || 楼层 >= 末楼) {
    eventEmit('人妻公寓:回合失败', '没有可回退的楼层');
    return;
  }
  作废当前手机时间线租约世代();
  const 回档时间线世代 = 作废当前时间线切换世代();
  const 回档聊天ID = 当前聊天ID();
  const 回档仍有效 = () => 回档时间线世代 === 当前时间线切换世代() && 回档聊天ID === 当前聊天ID();
  const 确认回档仍有效 = () => {
    if (!回档仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  };
  进行中 = true;
  let 已发生物理删楼 = false;
  try {
    await 排队MVU操作(async () => {
      确认回档仍有效();
      标记数据库时间线将变更(楼层, `回档至${楼层}楼`);
      await 内部删除聊天消息(_.range(楼层 + 1, 末楼 + 1));
      已发生物理删楼 = true;
      确认回档仍有效();
      await 协调已删时间线(楼层, { 作废晋阶镜像: true }, 回档仍有效);
      确认回档仍有效();
      console.info(`[人妻公寓] 回档至 ${楼层} 楼`);
      eventEmit('人妻公寓:回合完成');
    });
  } catch (e) {
    if (!回档仍有效()) {
      console.info('[人妻公寓] 回档期间消息分支已变化，旧回档停止并交由宿主时间线协调收口。');
    } else {
      console.error('[人妻公寓] 回档失败:', e);
      已发生物理删楼 = 已发生物理删楼 || getLastMessageId() < 末楼;
      if (已发生物理删楼) {
        const 实际末楼 = getLastMessageId();
        let 已恢复到存活时间线 = false;
        try {
          await 协调已删时间线(实际末楼, { 作废晋阶镜像: true }, 回档仍有效);
          已恢复到存活时间线 = true;
        } catch (恢复错误) {
          console.error('[人妻公寓] 回档删楼后的可重入收口仍未完成:', 恢复错误);
        }
        eventEmit(
          '人妻公寓:回合失败',
          已恢复到存活时间线
            ? `消息已删除到第 ${实际末楼} 楼，但原回档收口中途失败；现已按当前存活时间线重新协调。`
            : `消息已删除到第 ${实际末楼} 楼，但时间线收口仍未完成；请先刷新页面，再从当前存活楼继续。`,
        );
      } else {
        eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
      }
    }
  } finally {
    标记回合事务结束();
  }
}

// ============================================
// 序章开局(开局流程三段之②:父亲来电=第 1 楼固定演出,写死不给 AI)
// 开局=电话,结局=饭桌,首尾对上父亲不在场;妈在旁盛饭插话=背景板首镜
// ============================================

const 父亲来电正文 = [
  '手机在管理员室的值班桌上震动起来的时候,你正在数前任管理员留下的那串钥匙——十六把,每一把都缠着褪色的号码贴纸。',
  '',
  '来电显示:爸。',
  '',
  '"东西都交接了?"他的声音隔着越洋信号,还是那种不容你插话的节奏,"钥匙、账本、报修单。那栋楼是我半辈子的心血,现在归你管。丑话说在前头——房租一分不能少,每期照数打给我;楼里要是传出什么闲话,或者租户跑到我这儿来投诉……"',
  '',
  '电话那头顿了顿,你听见他喝了口什么。',
  '',
  '"……你就收拾东西,去你二叔的码头报到。我说到做到。"',
  '',
  '厨房方向飘来饭菜香。妈端着一锅汤从你身后经过,往桌上摆碗,顺口朝手机的方向喊了一嗓子:"说两句得了啊,饭都要凉了——"又压低声音对你说,"别理他,他就是嘴硬。妈给你盛了汤,喝完再下去忙。"',
  '',
  '"让他先干正事!"父亲在那头听见了,嗓门大了一格,又很快归于公事公办,"信箱里有住户和租约资料。101 报了水管的修,102 那户也去露个面,把人和门牌先认全。都是你的事了。"',
  '',
  '电话挂断。桌上的汤还在冒热气,钥匙串在你手心里沉甸甸的。',
  '',
  '这栋楼,现在是你的了——连同楼里住着的那些人,和他们各自关起门来的日子。',
].join('\n');

/** 序章开局按钮的行动选项(职务引导软引导第一拍;待办清单在客户端) */
const 序章行动选项 = [
  '去信箱区看看这个月的租约单子',
  '去一层大堂检查声控灯和门口的共享伞',
  '去 102 登门认识住户,核对住户资料',
  '去管理员室喝了妈盛的汤,把钥匙和账本理一遍',
];

/**
 * 开始新游戏(客户端难度选择卡调用):写难度档 → 创建第 1 楼固定演出 → 序章完成。
 * 幂等:已完成序章直接拒绝(单向语义随楼层快照走,回档到 0 楼=重开序章)。
 */
export async function 开始新游戏(难度: string): Promise<boolean> {
  if (回合进行中()) {
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再开始');
    return false;
  }
  const 开局时间线世代 = 当前时间线切换世代();
  const 开局聊天ID = 当前聊天ID();
  const 开局前末楼 = getLastMessageId();
  const 开局前末楼引用 = SillyTavern.chat?.[开局前末楼];
  const 开局前行动选项 = _.cloneDeep(_.get(getVariables({ type: 'chat' }), '_行动选项'));
  const 开局消息令牌 = `rqgy-prologue-${开局时间线世代}-${Date.now()}-${_.random(1e9)}`;
  let 开局消息楼层: number | null = null;
  let 开局消息引用: unknown;
  let 开局已提交 = false;
  const 捕获开局消息 = () => {
    const 消息表 = SillyTavern.chat ?? [];
    for (let 楼层 = 消息表.length - 1; 楼层 >= 0; 楼层 -= 1) {
      const 消息 = 消息表[楼层];
      if (消息?.extra?._rqgy开局令牌 !== 开局消息令牌) continue;
      开局消息楼层 = 楼层;
      开局消息引用 = 消息;
      return;
    }
  };
  const 开局仍有效 = () =>
    开局时间线世代 === 当前时间线切换世代() &&
    开局聊天ID === 当前聊天ID() &&
    (开局消息楼层 === null ||
      (getLastMessageId() === 开局消息楼层 && SillyTavern.chat?.[开局消息楼层] === 开局消息引用));
  const 确认开局仍有效 = () => {
    if (!开局仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  };
  进行中 = true;
  try {
    const 开局结果 = await 排队MVU操作(async () => {
      确认开局仍有效();
      if (getLastMessageId() !== 开局前末楼 || SillyTavern.chat?.[开局前末楼] !== 开局前末楼引用) {
        throw new Error('__RQGY_TIMELINE_CHANGED__');
      }
      const 档 = 难度表[难度] ? 难度 : '标准';
      const 有效 = 读取最近有效();
      if (!有效) throw new Error('变量还没就绪，请稍等两秒再开始');
      const { data } = 有效;
      if (data.系统._序章完成) {
        console.warn('[人妻公寓] 序章已完成,忽略重复开局');
        eventEmit('人妻公寓:回合失败', '序章已经开始过了'); // 解锁客户端乐观锁(审计 C6)
        return false;
      }
      data.系统._难度 = 档;
      data.系统._序章完成 = true;
      // 新局世界钟固定从第 1 周星期一早上开始；聊天楼数不参与日期。
      data.系统._绝对时段 = 0;
      data.现金 = 难度表[档].起始资金;
      data.胜任度 = 难度表[档].起始胜任度;
      // 旧版曾在 0 楼预置工具箱；开始新游戏时必须显式清空，不能把旧变量沿用进新局。
      // 工具箱现在只能花 200 元从商店购买。
      data.背包 = [];

      const 旧 = Mvu.getMvuData({ type: 'message', message_id: -1 });
      const 新 = _.cloneDeep(旧);
      _.set(新, 'stat_data', data);
      try {
        await createChatMessages(
          [{ role: 'assistant', message: 父亲来电正文, data: 新, extra: { _rqgy开局令牌: 开局消息令牌 } }],
          { refresh: 'none' },
        );
      } finally {
        捕获开局消息();
      }
      确认开局仍有效();
      if (开局消息楼层 !== 开局前末楼 + 1) throw new Error('序章消息没有落在预期楼层');
      捕获保护快照(data);
      await insertOrAssignVariables({ _行动选项: 序章行动选项 }, { type: 'chat' });
      确认开局仍有效();

      console.info(`[人妻公寓] 序章开局完成(难度:${档},起始资金:${难度表[档].起始资金})`);
      await 记录数据库回合(getLastMessageId(), data, '开始新游戏', 父亲来电正文, [], [], 开局仍有效);
      确认开局仍有效();
      await 广播生成完成事件(开局仍有效);
      确认开局仍有效();
      开局已提交 = true;
      eventEmit('人妻公寓:回合完成');
      return true;
    });
    return 开局结果;
  } catch (e) {
    if (!开局仍有效()) {
      console.info('[人妻公寓] 序章开局期间消息分支已变化，旧开局结果已丢弃。');
    } else {
      console.error('[人妻公寓] 序章开局失败:', e);
      eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    }
    return false;
  } finally {
    if (!开局已提交) {
      捕获开局消息();
      if (开局消息楼层 !== null && SillyTavern.chat?.[开局消息楼层] === 开局消息引用) {
        try {
          await 内部删除聊天消息([开局消息楼层]);
        } catch (清理错误) {
          console.error('[人妻公寓] 清理未完成的序章消息失败:', 清理错误);
        }
      }
      if (开局时间线世代 === 当前时间线切换世代() && 开局聊天ID === 当前聊天ID()) {
        try {
          await updateVariablesWith(
            vars => {
              _.set(vars, '_行动选项', 开局前行动选项 ?? null);
              return vars;
            },
            { type: 'chat' },
          );
        } catch (恢复错误) {
          console.error('[人妻公寓] 恢复未完成序章的行动选项失败:', 恢复错误);
        }
      }
    }
    标记回合事务结束();
  }
}

/**
 * 重开一局(设置弹窗二次确认后调用):删掉 0 楼以上全部楼层 + 把 0 楼 stat 重写成出厂态。
 * 不再假设"0 楼天然纯净"(2026-07-17 双 bug 修复):0 楼的 户 表可能是空的(首批入住是
 * 过程中某一楼才写进去的),_序章完成 也可能残留 true——只删楼会得到户表空+已完成的残缺态,
 * 导致地图没人 + 要重开两次才碰巧刷对。改为显式重建:Schema.parse({}) 出厂默认 + 首批入住,
 * 写回 0 楼(=删楼后的 -1)。chat 过程变量全清,晋阶镜像必须显式清(镜像直写不校验楼层作废,
 * 残留旧局镜像会把旧阶段"取大"进新局,防护9 反向路径)。
 */
export async function 重开一局(): Promise<void> {
  if (回合进行中()) {
    // 静默返回=客户端 发送中 永久闩死只能刷新页面(2026-07-26 审计 C6 最易触发路径)
    eventEmit('人妻公寓:回合失败', '上一轮还没结束,稍等片刻再重开');
    return;
  }
  作废当前手机时间线租约世代();
  const 重开时间线世代 = 作废当前时间线切换世代();
  const 重开聊天ID = 当前聊天ID();
  const 重开仍有效 = () => 重开时间线世代 === 当前时间线切换世代() && 重开聊天ID === 当前聊天ID();
  const 确认重开仍有效 = () => {
    if (!重开仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  };
  进行中 = true;
  let 已发生物理删楼 = false;
  try {
    await 排队MVU操作(async () => {
      确认重开仍有效();
      const 末楼 = getLastMessageId();
      if (末楼 >= 1) {
        标记数据库时间线将变更(0, '重开一局');
        await 内部删除聊天消息(_.range(1, 末楼 + 1));
        已发生物理删楼 = true;
        确认重开仍有效();
        await 等待数据库时间线就绪();
        确认重开仍有效();
      }

      // 世代先作废并等待旧写落定；否则重开前已经起跑的异步镜像会在出厂态之后复活旧阶段。
      await 作废晋阶镜像时间线();
      确认重开仍有效();
      // 过程变量先清(镜像已由上面的串行世代清场，避免旧镜像并入新出厂态)
      await updateVariablesWith(
        vars => {
          确认重开仍有效();
          for (const 键 of [
            ...回合变量键,
            '_上次回合',
            '_上次隔离回合',
            '_隔离事件',
            '_在场',
            '_行动选项',
            '_粘滞',
            '_待办',
            '_侦探',
            '_微信',
            '_经济',
            '_赴约',
            '_工具由头',
            '_换装余波',
          ]) {
            _.set(vars, 键, null);
          }
          return vars;
        },
        { type: 'chat' },
      );
      确认重开仍有效();
      清保护快照();

      // 0 楼 stat 重写成出厂态:默认值 + 首批入住(与 index.确保首批入住 同一套模板)
      const 出厂 = Schema.parse({}) as SchemaType;
      for (const m of 首批门牌) {
        出厂.户[m] = 创建配置户节点(m, 0);
      }
      const 旧raw = Mvu.getMvuData({ type: 'message', message_id: -1 });
      await 脚本写入(旧raw, 出厂, { 记录成长: false });
      确认重开仍有效();
      捕获保护快照(出厂);
      for (const m of 首批门牌) 镜像直写(m, { 入住时段: 0 });
      await 等待晋阶镜像写入();
      确认重开仍有效();
      await 同步入住世界书条目(出厂, 重开仍有效);
      确认重开仍有效();

      console.info('[人妻公寓] 重开一局:楼层已删,0楼 stat 重建为出厂态(首批入住已就位)');
      eventEmit('人妻公寓:已重开');
    });
  } catch (e) {
    if (!重开仍有效()) {
      console.info('[人妻公寓] 重开期间消息分支已变化，旧重开停止并交由宿主时间线协调收口。');
    } else {
      console.error('[人妻公寓] 重开一局失败:', e);
      if (已发生物理删楼) {
        try {
          await 排队MVU操作(() => 协调已删时间线(getLastMessageId(), { 作废晋阶镜像: true }, 重开仍有效));
        } catch (恢复错误) {
          console.error('[人妻公寓] 重开删楼后的存活时间线收口失败:', 恢复错误);
        }
      }
      eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    }
  } finally {
    标记回合事务结束();
  }
}
