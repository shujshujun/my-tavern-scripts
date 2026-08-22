import {
  场景剧情可见标题,
  绑定新增待发送事件到场景,
  场景剧情目标匹配,
  标记场景剧情待重试,
  准备重试场景剧情,
  读取活动场景剧情,
  提交场景剧情成功,
  消费队首场景剧情,
  校验场景剧情位置,
} from './场景剧情事务';
import type { SchemaType } from '../../schema';
import { Schema, 验证可继续MVU存档结构 } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 难度表, 首批门牌, 查特殊场景 } from '../../stageConfig';
import {
  严格变量审计开启,
  选择变量解析通道,
  读取MVU外置模型配置,
  读取MVU解析状态,
  读取变量解析通道,
  规范OpenAI兼容API地址,
} from '../../MVU解析模式';
// (难度表兼供撞见概率系数查表)
import { 经济结算 } from './经济系统';
import { 入住检测, 创建配置户节点, 构造入住登场演出态, 提交入住登场, 同步入住世界书条目 } from './入住系统';
import { type 本轮事件冻结, 事件必须有正文, 是入住登场事件, 本轮事件可提交, 识别入住登场预约 } from './入住触发门';
import { 丈夫打断会读取疑心, 打断检测, 换装起疑, 母亲撞见检测, 母亲撞见风险, 父亲来电打断 } from './打断系统';
import { 夜访结算, 惰性结算户, 绿帽线检测, 结算焦点疑心 } from './结算系统';
import { 荣耀洞结算 } from './荣耀洞';
import { 当前天数, 当前时段, 丈夫在楼, 格式化游戏内时间, 疑心冻结中 } from './楼层时钟';
import { 作废晋阶镜像时间线, 捕获保护快照, 回滚保护字段, 清保护快照, 等待晋阶镜像写入, 镜像直写 } from './守护系统';
import { 无处罚拒绝正文, 输出稽查, type 尺度模式, type 稽查结果 } from './稽查系统';
import {
  type AI可写变量范围,
  构造AI可写变量范围,
  构造AI可写变量视图,
  扩展精确亲密妻,
  解析候选亲密妻,
  同步整表视图,
  MVU操作进行中,
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
  type 合法正候选表,
} from './冷落系统';
import { 登记攻略风闻, type 攻略风闻档 } from './风闻系统';
import { 推进丈夫登门, 同步丈夫登门排期 } from './丈夫登门系统';
import { 提交孕情初见评价, 应使用怀孕CG } from './怀孕系统';
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
  读取数据库剧情事件已记录楼层,
  检测数据库脚本写入能力,
  同步数据库回合,
  数据库事件待整理摘要,
  数据库状态,
  触发数据库增量更新,
  通过数据库生成,
} from './数据库桥';
import { 取消当前数据库剧情规划, 构造数据库剧情规划输入, 经数据库剧情规划生成 } from './数据库剧情规划桥';
import { 全局数据库AI租约 } from './数据库AI租约';
import { 上报阶段线路事件, 提交母亲两幕事件, 提交阶段线路剧情, 提交阶段线路演出事件 } from './阶段线路系统';
import { 提交阶段性癖开幕, 解析阶段性癖开幕事件 } from './性癖系统';
import {
  按消息重建已发私聊图,
  当前微信摘要引用,
  当前微信联系保护表,
  当前聊天ID,
  等待微信摘要任务,
  读取近期微信胶囊,
  设置静音会议手机生成中,
  手机AI生成中,
  手机节拍进行中,
} from './手机系统';
import { 手机记录在当前时间线, 规范手机已读时锚 } from './手机已读水位';
import { 裁剪手机节拍水位 } from './手机/节拍引擎';
import {
  手机邀约计划成员,
  手机邀约计划需裁剪,
  移除手机邀约计划成员,
  type 手机邀约计划,
} from './手机/邀约计划';
import { 手机锚消息签名, 作废当前手机时间线租约世代 } from './手机时间线租约';
import { 推进特殊场景, 静音会议正式运行中 } from './特殊场景系统';
import { 构造CG亲密上下文 } from './CG亲密上下文';
import { 行动资源门槛, 现场楼身体增长依赖, 结算成功现场楼 } from './玩家资源系统';
import { 应用酒馆最终显示正则 } from './预设输出兼容';
import { 当前预设流式边界 } from './预设桥';
import { 提取正文舞台文本, 提取可提交正文, type 外部正文标签 } from './正文输出边界';
import { 提取末尾裸JSON补丁 } from './正文协议安全';
import { 规范变量协议候选, 标准变量块需要本地应用 } from './变量块协议';
import {
  生成失败时可保留的流式正文,
  判定正文提交,
  提取纯控制协议尾段,
  是当前正文流事件,
  选择正文生成原文,
  更新有效流式正文,
} from './正文生成完整性';
import {
  创建正文生成超时错误,
  判定正文生成超时,
  友好化正文生成错误,
  正文生成超时错误前缀,
} from './正文生成故障';
import { 合并最新父亲通话, 排队父亲通话整表写 } from './父亲通话写租约';
import { 当前时间线切换世代, 作废当前时间线切换世代, 登记内部删楼租约, 时间线切换协调中 } from './时间线切换协调';
import {
  临时楼标记键,
  回合令牌键,
  回合角色键,
  定位本轮临时楼,
  临时楼降序楼层,
  判定可自动清理的遗留临时楼,
  构造转正更新负载,
  校验转正候选,
  持久写入转正标记,
  构造临时楼继承容器,
} from './临时回合楼';
import { 取得前台生成租约, type 生成通道租约 } from './生成通道互斥';
import { 回合在场妻键 } from './角色近期正文';
import {
  三方合并变量重生成对象,
  合并重新生成变量结果,
  提取变量重生成AI结果,
  变量重生成有不可逆派生冲突,
  重算变量重生成派生,
  type 变量重生成AI结果快照,
  type 变量重生成派生票据,
} from './变量重新生成核心';
import {
  创建变量重生成事务门,
  请求取消变量重生成事务,
  尝试进入变量重生成提交,
  标记变量重生成已提交,
  type 变量重生成事务门,
} from './变量重生成事务门';

/**
 * 回合引擎:固定 0 楼架构的主循环(修道院回合引擎直迁,本作化三处:
 * 稽查终审接入/惰性结算+疑心主通道/序章开局)。
 *
 * 显示层永远只有 0 楼的客户端 iframe;后续楼层只是数据库:
 *   玩家行动 → generate(不建楼、不刷新显示) → 稽查终审(违规=中断卡+变量不采纳+代价)
 *   → v0.80 外置变量解析 → 回滚保护字段(变量分工表) → 回合结算
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

/**
 * 幂等中断恢复入口(第 6 项):先扫描当前聊天中“新临时标记严格为 true 且令牌/角色格式
 * 有效”的楼；只有聊天尾部同一令牌的一条 user 或连续 user+assistant 才允许自动删除，
 * 多令牌、非尾部、超过两条或角色倒置一律失败关闭并保留历史。安全命中降序通过
 * 内部删除聊天消息 删除,并沿用数据库时间线冻结/等待。
 * 无命中零写入;删除失败必须向上抛错,绝不吞掉后继续游戏。若物理楼已经删掉,
 * 后续再次扫描必然零命中(每次重新扫描消息表,不缓存旧楼号),不会按旧楼号再删别的消息。
 *
 * 调用点:启动流程(切聊天/刷新杀死旧调用栈后,再进入该聊天自动清理)与每次
 * 执行回合 取得进行中互斥之后(上一次 deleteChatMessages 短暂失败后,不刷新也
 * 不会带着遗留楼开始下一轮)。
 */
export async function 恢复遗留临时回合楼(): Promise<number> {
  const 判定 = 判定可自动清理的遗留临时楼(SillyTavern.chat ?? []);
  if (判定.拒绝原因) {
    const 提示 = `检测到异常临时历史（${判定.拒绝原因}），为保护往事已停止自动删楼。`;
    console.error(`[人妻公寓] ${提示}`);
    eventEmit('人妻公寓:提示', 提示);
    // 启动链必须停止在挂监听之前；执行回合也必须在建新临时楼之前失败。
    // 仅提示后返回 0 会把异常状态当成“没有遗留楼”，继续堆出第二个临时令牌。
    throw new Error(提示);
  }
  const 待删 = 判定.待删;
  if (!待删.length) return 0;
  标记数据库时间线将变更(Math.max(0, Math.min(...待删) - 1), '恢复遗留临时回合楼');
  await 内部删除聊天消息(待删);
  await 等待数据库时间线就绪();
  return 待删.length;
}

/**
 * 查找宿主可选的同步保存接口。酒馆助手 iframe 里的 `SillyTavern` 可能已经是 context，
 * 也可能仍是带 `getContext()` 的包装对象；父窗口在 sandbox/跨域环境下则可能不可访问。
 * 找不到时不在这里报错，由 持久写入转正标记 改走酒馆助手 refresh:'all' 同步保存路线。
 */
function 读取立即持久保存宿主聊天(): (() => Promise<void>) | undefined {
  type ST保存接口 = {
    saveChat?: () => void | Promise<void>;
    getContext?: () => ST保存接口;
  };
  const 候选: ST保存接口[] = [];
  const 加入候选 = (值: ST保存接口 | undefined) => {
    if (值 && !候选.includes(值)) 候选.push(值);
  };
  try {
    // 酒馆助手 predefine 会把已展开的 context 直接挂成 iframe 全局 SillyTavern。
    加入候选(SillyTavern as unknown as ST保存接口);
  } catch {
    /* 极旧运行时未注入时继续找其他入口 */
  }
  try {
    const st = (globalThis as unknown as { SillyTavern?: ST保存接口 }).SillyTavern;
    加入候选(st);
  } catch {
    /* 未注入时继续找宿主窗口 */
  }
  try {
    const st = (window.parent as unknown as { SillyTavern?: ST保存接口 })?.SillyTavern;
    加入候选(st);
  } catch {
    /* 跨域时由 iframe 注入接口兜底 */
  }
  for (const st of 候选) {
    try {
      const 上下文 = st.getContext?.() ?? st;
      if (typeof 上下文.saveChat !== 'function') continue;
      const 保存 = 上下文.saveChat;
      return async () => {
        await Promise.resolve(保存.call(上下文));
      };
    } catch {
      // 某个包装对象取 context 失败时继续尝试其他候选，最终仍可回退 refresh:'all'。
    }
  }
  return undefined;
}

// ── 重掷支持:回合快照(存 chat 变量,iframe 重载/刷新后仍可重掷) ──
// 变量随楼自动回滚(每楼自带 stat_data);晋阶镜像有意不在此列——镜像取大是防打回的正字,重掷不还原

/** 回合内会被脚本改写的 chat 变量键(重掷时按快照整值恢复;_场景 含一幕性的破门标记) */
const 回合变量键 = [
  '_场景',
  '_经济',
  '_赴约',
  // 连续反感离场会在核心提交前移除共同邀约成员；失败／取消／重掷必须整值恢复。
  '_手机邀约计划',
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

/** 主动回档或宿主原生删楼后不能继续沿用的未来时间线过程态。
 * `_隔离事件`不入此表:它是带锚楼的历史日志,由紧随其后的裁手机时间线按锚楼裁掉未来条目,
 * 整体置空会连过去时间线的晨跑/健身/睡眠/荣耀洞反馈一并抹掉(2026-08-03 审计 M1)。 */
const 时间线清场变量键 = [...回合变量键, '_上次回合', '_上次隔离回合', '_时间撤销点'] as const;

/** 失败/取消回合必须把 prompt 构造期间写入的在场、粘滞等整值还原。 */
async function 恢复回合变量快照(
  chat快照: Record<string, unknown>,
  提交校验: () => boolean = () => true,
): Promise<void> {
  await updateVariablesWith(
    vars => {
      if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
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
  // v0.80 新预约计划:创建楼/创建绝对时段在裁剪点之后的计划清掉;创建点仍存活的
  // 未来预约保留,由世界钟派生待赴约/赴约中/过期——时间撤销回到创建之后、目标之前时
  // 自然恢复为待赴约。不放进无条件清场集合,避免任何删楼都抹掉早先已创建的合法预约。
  // 本段独立于 `_微信` 存在性:损坏/部分旧档缺 `_微信` 时,计划的回档裁剪仍须生效,
  // 不能因下方 _微信 缺失的提前返回而漏裁位于回档未来的计划。
  const 邀约计划 = (_.get(vars, '_手机邀约计划') ?? null) as {
    m?: string;
    创建楼?: number;
    创建绝对时段?: number;
  } | null;
  if (手机邀约计划需裁剪(邀约计划 as 手机邀约计划 | null, 楼层, 目标钟)) {
    _.set(vars, '_手机邀约计划', null);
  }
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
  /** 只保留最新成功回合的手动变量重算材料；下一回合覆盖，回档/删楼随 `_上次回合` 清理。 */
  变量重生成?: 变量重生成上下文;
};

interface 变量重生成上下文 {
  版本: 2;
  聊天ID: string;
  助手楼层: number;
  回合令牌: string;
  行动: string;
  快照: string;
  焦点: 门牌[];
  变量范围: AI可写变量范围;
  解析基准: SchemaType;
  原AI结果: 变量重生成AI结果快照;
  派生票据: 变量重生成派生票据;
  风闻票据: 变量重生成风闻票据;
}

interface 变量重生成风闻快照 {
  风闻: number;
  胜任度: number;
  风闻账: SchemaType['系统']['_风闻账'];
  管理考核: SchemaType['系统']['_管理考核'];
  待接来电: SchemaType['系统']['_待接来电'];
  父亲通话: SchemaType['系统']['_父亲通话'];
}

interface 变量重生成风闻票据 {
  派生前: 变量重生成风闻快照;
  /** 原回合只完成成长与资源风闻后的状态。 */
  派生后: 变量重生成风闻快照;
  /** 再并入楼务任务、父亲电话等独立脚本结算后的最终状态。 */
  原回合最终: 变量重生成风闻快照;
  跳过成长风闻: boolean;
  后续调用: { 门牌: 门牌; 档: 攻略风闻档 }[];
}

export type 变量重生成可用状态 = '不可用' | '未配置' | '可用' | '进行中' | '已完成';
export interface 变量重生成状态 {
  状态: 变量重生成可用状态;
  原因?: string;
}

const 变量重生成成功标记键 = '_rqgy变量已重新生成';

function 提取变量重生成风闻快照(data: SchemaType): 变量重生成风闻快照 {
  return {
    风闻: data.风闻,
    胜任度: data.胜任度,
    风闻账: _.cloneDeep(data.系统._风闻账),
    管理考核: _.cloneDeep(data.系统._管理考核),
    待接来电: _.cloneDeep(data.系统._待接来电),
    父亲通话: _.cloneDeep(data.系统._父亲通话),
  };
}

function 应用变量重生成风闻快照(data: SchemaType, 快照: 变量重生成风闻快照): void {
  data.风闻 = 快照.风闻;
  data.胜任度 = 快照.胜任度;
  data.系统._风闻账 = _.cloneDeep(快照.风闻账);
  data.系统._管理考核 = _.cloneDeep(快照.管理考核);
  data.系统._待接来电 = _.cloneDeep(快照.待接来电);
  data.系统._父亲通话 = _.cloneDeep(快照.父亲通话);
}

function 成长对应攻略风闻(成长: ReturnType<typeof 记录全楼有效成长>[number]): 攻略风闻档 | null {
  if (成长.来源.includes('阶段晋升')) return '晋阶';
  if (成长.来源.includes('堕落值') || 成长.来源.includes('身体开发')) return '亲密';
  if (成长.来源.includes('好感值')) return '普通';
  return null;
}

function 变量重生成通道输入(配置 = 读取MVU外置模型配置()) {
  const 自定义可用 = 配置?.模型来源 === '自定义' && !!配置.api地址.trim() && !!配置.模型名称.trim();
  return [读取变量解析通道(), 数据库状态().可调用AI, 自定义可用] as const;
}

function 当前变量重生成解析通道(): ReturnType<typeof 选择变量解析通道> {
  return 选择变量解析通道(...变量重生成通道输入());
}

function 读上次回合(): 上次回合记录 | undefined {
  return (_.get(getVariables({ type: 'chat' }), '_上次回合') ?? undefined) as 上次回合记录 | undefined;
}

// 流式转发:generate 的 iframe 事件转成自定义事件,客户端稳定可收。
// 用 generation_id 只认自家生成(数据库/总结类第三方脚本自己也会调 generate)。
let 本回合生成id = '';
let 正文流式生成id = '';
let 正文流式原文 = '';
let 正文流式预期标签: 外部正文标签 | null = null;
let 正文流式等待思维闭标签 = false;
let 解除生成等待: (() => void) | null = null;
let 正文生成进展回调: (() => void) | null = null;
eventClearEvent(iframe_events.STREAM_TOKEN_RECEIVED_FULLY);
// Tavern Helper 的完整流事件没有等待宿主 EventEmitter 分发完毕就可能让 generate() 返回。
// 若前面挂着异步插件监听，普通 eventOn 会在本回合已经选文、清缓存之后才收到最终流。
// 放到队首后缓存写入在 emit() 的首个同步段完成，界面仍可照常异步转发。
eventMakeFirst(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (文本: string, generation_id: string) => {
  if (!进行中) return;
  if (generation_id && generation_id !== 本回合生成id) return;
  if (是当前正文流事件(正文流式生成id, 本回合生成id, generation_id)) {
    正文生成进展回调?.();
    正文流式原文 = 更新有效流式正文(正文流式原文, 文本, 候选 =>
      提取可提交正文(候选, {
        期望正文标签: 正文流式预期标签,
        等待思维闭标签: 正文流式等待思维闭标签,
        流式: true,
      }),
    );
  }
  eventEmit('人妻公寓:流式', 文本);
});

function 停止当前正文底层请求(): void {
  const 生成id = 本回合生成id;
  if (!生成id) return;
  try {
    if (!stopGenerationById(生成id)) stopAllGeneration();
  } catch (e) {
    console.error('[人妻公寓] 停止生成失败:', e);
  }
}

// ── 取消本回合:停掉生成,作废的回合不落楼 ──
let 已取消 = false;
let 允许取消 = false;
export function 取消本回合(强制作废 = false) {
  if (!强制作废) {
    if (!进行中 || !允许取消) return;
  } else if (!进行中) return;
  已取消 = true;
  // 部分公益站会让底层请求长期悬空，stopGenerationById 也不一定能让 Promise 返回。
  // 数据库正在规划时先让官方中止并等待其钩子退出，避免迟到规划又启动正文；
  // 其余阶段仍主动结束本卡自己的等待，让 finally 立即释放 `进行中`。
  const 数据库规划接管中止 = 取消当前数据库剧情规划();
  if (数据库规划接管中止) return;
  解除生成等待?.();
  // 生成准备期还没有 id；取消旗会在下一处异步边界终止回合，不应误停其他脚本的生成。
  停止当前正文底层请求();
}

function 确认回合未取消(): void {
  if (已取消) throw new Error('__RQGY_CANCELLED__');
}

/**
 * 给正文生成加两层本卡可控的失败门：手动取消立即结束本地等待；正文真正开始后，
 * 首包、流式停滞与十分钟绝对上限共同兜住第三方端点永久 pending。数据库规划有自己的
 * 90 秒降级门，正文看门狗不把规划时间算进去。迟到结果只会结束底层 Promise，不会落楼。
 */
type 正文生成参数 = Parameters<typeof generate>[0] & { automatic_trigger?: boolean };

interface 正文生成等待选项 {
  启用数据库规划: boolean;
  规划输入?: string;
  规划开始?: () => void;
  正文开始?: (已规划: boolean) => void;
  继续前确认?: () => void;
}

async function 等待正文生成(参数: 正文生成参数, 选项?: 正文生成等待选项): Promise<string> {
  const 中止门 = new Promise<never>((_resolve, reject) => {
    解除生成等待 = () => reject(new Error('__RQGY_CANCELLED__'));
  });
  let 正文已开始 = false;
  let 正文开始毫秒 = 0;
  let 最后进展毫秒 = 0;
  let 已收到正文进展 = false;
  let 看门狗timer: ReturnType<typeof setInterval> | undefined;
  let 拒绝超时: (error: Error) => void = () => undefined;
  const 超时门 = new Promise<never>((_resolve, reject) => {
    拒绝超时 = reject;
  });
  const 标记正文开始 = () => {
    const 现在 = Date.now();
    正文已开始 = true;
    正文开始毫秒 = 现在;
    最后进展毫秒 = 现在;
    已收到正文进展 = false;
    if (看门狗timer !== undefined) clearInterval(看门狗timer);
    看门狗timer = setInterval(() => {
      if (!正文已开始) return;
      const 阶段 = 判定正文生成超时(Date.now(), 正文开始毫秒, 最后进展毫秒, 已收到正文进展);
      if (!阶段) return;
      clearInterval(看门狗timer);
      看门狗timer = undefined;
      console.warn(`[人妻公寓] 正文生成看门狗触发：${阶段}，本轮按失败收口。`);
      拒绝超时(创建正文生成超时错误(阶段));
      停止当前正文底层请求();
    }, 1000);
  };
  const 标记正文进展 = () => {
    if (!正文已开始) return;
    已收到正文进展 = true;
    最后进展毫秒 = Date.now();
  };
  正文生成进展回调 = 标记正文进展;
  try {
    let 生成任务: Promise<unknown>;
    if (选项) {
      生成任务 = 经数据库剧情规划生成(参数, {
        启用: 选项.启用数据库规划,
        规划输入: 选项.规划输入,
        规划开始: 选项.规划开始,
        正文开始: 已规划 => {
          标记正文开始();
          选项.正文开始?.(已规划);
        },
        继续前确认: 选项.继续前确认,
        调用正文: 正文参数 => generate(正文参数),
      });
    } else {
      标记正文开始();
      生成任务 = generate(参数);
    }
    return String(await Promise.race([生成任务, 中止门, 超时门]));
  } finally {
    if (看门狗timer !== undefined) clearInterval(看门狗timer);
    if (正文生成进展回调 === 标记正文进展) 正文生成进展回调 = null;
    解除生成等待 = null;
  }
}

const 变量结算基础令 = [
  '【独立变量结算｜只输出唯一标准变量块】',
  '根据公寓快照、本轮玩家行动和本轮已完成正文，独立检查本轮实际发生的状态变化。',
  '最终回复必须以 <UpdateVariable> 换行 <JSONPatch> 开始，并以 </JSONPatch> 换行 </UpdateVariable> 结束；两者之间只能是可解析的 RFC 6902 JSON 数组。<JSONPatch> 是常驻且必需的内层标签，四个开闭标签不得省略、替换、重排或放进代码围栏。',
  'JSON 数组只能写在 <JSONPatch> 与 </JSONPatch> 之间，禁止直接放在 <UpdateVariable> 下。即使本轮确认无任何变化，也必须完整输出 <UpdateVariable><JSONPatch>[]</JSONPatch></UpdateVariable>。',
  '除上述唯一变量块外，不要复述正文，不要解释，不要输出 Analysis、思考过程或其他标签。',
  '必须检查快照【焦点】中明确标为”本人在场”的人物：若互动确实产生正面或负面影响，用 RFC 6902 replace 更新 户.<门牌>.妻.好感值，并按剧情更新 当前心理想法 与 当前情绪；心理想法只能概括意图、判断或矛盾，不得照抄本轮台词、呻吟、称呼或口头禅。',
  '若本轮属于有实质暧昧/亲密/性内容的回合（快照标注【亲密场景】或尺度判定实际≥1），同样检查 户.<门牌>.妻.堕落值：她被越界体验真实触动时 +1~3，明显反感退缩时 -1~3，纯日常不动；单轮超出 ±3 系统会整项回滚。',
  '好感变化必须有正文依据，允许正数、负数或不变；不得为了更新而机械加分。遵守变量规则与单轮上限，不在场人物及系统管理字段绝对不动。',
].join('\n');

/**
 * 可选严格审计只强化“逐叶判断”，绝不照搬通用世界书的时间/NPC/物品联动，
 * 也不要求模型暴露 BianLiang/思维过程。开启只增加本次请求的一段系统提示，不增加请求次数。
 */
const 严格变量审计令 = [
  '【严格变量审计｜仅在内部逐叶核对】',
  '生成最终变量块前，遍历【当前可写变量现值】或 <status_current_variable> 中本轮实际存在的每个叶子；逐项对照本轮玩家行动、已完成正文与字段规则，判断“应变化”或“不变”。',
  '审计只强制判断，不强制改值：没有明确正文依据的叶子保持不变，不得为了显得有更新而机械增减或改写。',
  '有明确依据时只用 RFC 6902 replace 写最终值；禁止 delta/add/remove，禁止写视图外路径，禁止推演时间、阶段、婚姻、资源、背包、NPC 或其他脚本管理状态。',
  '若可写视图中的 户 为空，JSON Patch 必须是 []。审计过程只在内部完成，不得输出 <BianLiang>、检查清单、解释或其他额外标签。',
].join('\n');

/** 放在最终 system 消息最末尾，避免严格审计段把唯一输出结构从模型的近因注意中挤走。 */
const 变量结算格式收口令 = [
  '【最终格式复核】回复只能包含一个标准变量块；<JSONPatch> 是 <UpdateVariable> 内常驻且必需的唯一内容容器，绝不能省略。',
  '有变化时把下方 [] 替换为实际 RFC 6902 数组；无变化时原样保留 []。不得在四个标签之外输出任何字符：',
  '<UpdateVariable>',
  '<JSONPatch>',
  '[]',
  '</JSONPatch>',
  '</UpdateVariable>',
].join('\n');

function 当前变量结算令(): string {
  return 严格变量审计开启()
    ? `${变量结算基础令}\n\n${严格变量审计令}\n\n${变量结算格式收口令}`
    : `${变量结算基础令}\n\n${变量结算格式收口令}`;
}

function 清除变量禁区(文本: string, 吞未闭合尾段 = true): string {
  let 清 = 文本
    .replace(/<think(?:ing)?\b[^>]*>[\s\S]*?<\/think(?:ing)?\s*>/gi, '')
    .replace(/<reason(?:ing)?\b[^>]*>[\s\S]*?<\/reason(?:ing)?\s*>/gi, '')
    .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*?<\/尺度判定\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  if (吞未闭合尾段) {
    清 = 清
      .replace(/<(?:think(?:ing)?|reason(?:ing)?)\b[^>]*>[\s\S]*$/i, '')
      .replace(/<尺度判定(?:\s[^>]*)?>[\s\S]*$/i, '')
      .replace(/<!--[\s\S]*$/, '');
  }
  return 清;
}

/**
 * 防过删兜底(2026-08-04 玩家反馈"变量不更新"):预设思考标签未闭合时,严格禁区清洗会从
 * 该标签一路删到结尾,把其后的真变量块一并杀死。退一步只清已闭合禁区,且仅认完整的
 * <UpdateVariable> 块——半截块/裸补丁仍不认,避免把思维链里的草稿当真。
 */
function 宽松提取完整变量块(文本: string, 严格可解析文本: string): string | null {
  const 宽松文本 = 清除变量禁区(文本, false);
  if (宽松文本 === 严格可解析文本) return null;
  const 候选 = [...宽松文本.matchAll(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable\s*>/gi)].at(-1)?.[0];
  return 候选 ? 规范变量协议候选(候选) : null;
}

function 取变量块(文本: string): string | null {
  const 可解析文本 = 清除变量禁区(文本);
  // 标准形：完整双层块；若 Gemini 漏了内层 JSONPatch、只在外层放数组，也在这里归一。
  const 完整 = [...可解析文本.matchAll(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable\s*>/gi)].at(-1)?.[0];
  if (完整) {
    const 规范块 = 规范变量协议候选(完整);
    if (规范块) return 规范块;
  }
  // 兜底①(2026-07-26 玩家反馈"变量不更新")：模型漏了外层包装，只输出 <JSONPatch> 块。
  const 裸补丁 = [...可解析文本.matchAll(/<json_?patch\b[^>]*>[\s\S]*?<\/json_?patch\s*>/gi)].at(-1)?.[0];
  if (裸补丁) {
    const 规范块 = 规范变量协议候选(裸补丁);
    if (规范块) return 规范块;
  }
  // 兜底②：连标签都没有，只输出了裸 JSON Patch 数组（可能带代码围栏）。
  const 数组 = 提取末尾裸JSON补丁(可解析文本.replace(/(?:<\/(?:UpdateVariable|json_?patch)\s*>\s*)+$/gi, ''));
  if (数组) {
    const 规范块 = 规范变量协议候选(数组);
    if (规范块) return 规范块;
  }
  // 兜底③：变量块被未闭合思考段连坐吞掉时，退回只清已闭合禁区再取完整块。
  // 旧 _.set 命令不再作为当前解析模型的第二套格式；出现时本轮失败并按标准协议重试。
  const 宽松完整 = 宽松提取完整变量块(文本, 可解析文本);
  if (宽松完整) {
    console.warn('[人妻公寓] 变量块位于未闭合思考段之后,已启用防过删兜底提取');
    return 宽松完整;
  }
  return null;
}

function 取尺度判定块(文本: string): string | null {
  return [...文本.matchAll(/<尺度判定(?:\s[^>]*)?>[\s\S]*?<\/尺度判定\s*>/gi)].at(-1)?.[0] ?? null;
}

// 游戏内置外置解析是玩家不可见的后台生成；超时只放弃变量更新并保留正文，绝不作废回合。
const 内置变量解析超时毫秒 = 180_000;

// MVU 外置解析同样是玩家不可见的后台生成:跨脚本桥返回不代表解析完成,完成信号靠轮询
// 楼层变量;超过此时限仍无结果就按"未产生可解析变量"继续走,保正文不作废回合。
const 外置解析等待毫秒 = 120_000;

/** 无预设通道(自定义API/数据库)没有世界书变量规则,须随请求带上最小输出格式契约。 */
const 内置解析格式说明 = [
  '【变量输出格式】只输出一个块，结构如下：',
  '<UpdateVariable>',
  '<JSONPatch>',
  '[{"op":"replace","path":"/户/302/妻/好感值","value":63}]',
  '</JSONPatch>',
  '</UpdateVariable>',
  '路径从根写起，层级以【当前可写变量现值】JSON 为准，如 /户/302/妻/当前情绪；只允许 replace 已存在的字段；确认本轮无任何变化时输出空数组 []。',
  '【可写字段规则】',
  '好感值：{{user}}的言行让她受用/帮到她时 +1~3；冒犯、令她失望时 -1~3；单轮不超过 ±3。',
  '堕落值：仅限本轮有实质暧昧/亲密/性内容时才更新；她被越界体验真实触动时 +1~3，明显反感退缩时 -1~3，纯日常闲聊不动；单轮超出 ±3 系统会整项回滚到回合前数值，不要写超。',
  '身体开发（小嘴/胸部/小屄/屁穴）：仅性场景且对应部位被认真对待时 +1~3，只增不减。',
  '当前心理想法：妻本人在场时更新，一两句第一人称内心独白，只写意图/判断/矛盾，不得照抄台词。',
  '当前情绪：妻本人在场时随剧情更新，如 平静/雀跃/局促/心虚/悸动。',
  '其余字段（当前阶段/婚姻值/裂缝/疑心值/现金/系统等）由脚本管理，严禁写入。',
].join('\n');

/** 内置外置变量解析的可区分结果：成功拿到变量块 / 没有任何可用解析模型 / 请求失败。 */
type 内置外置变量解析结果 =
  | { 结果: '成功'; 变量块: string }
  | { 结果: '未配置' }
  | { 结果: '失败' }
  | { 结果: '已取消' };

/**
 * 引擎自己调用解析模型生成变量块(替代"跨脚本桥按 MVU 官方按钮+轮询楼层"路线)。
 * 通道选择与设置页同一张路由矩阵(选择变量解析通道);正文模型只负责故事,
 * 外置变量解析绝不占用正文 API。
 * - 自动(默认) → 数据库插件 callAI 代发优先(沿用数据库当前配置,不读其密钥与模型),
 *   没有数据库时使用已填写的自定义 API;
 * - 自定义 → generateRaw + custom_api(与 MVU 额外模型解析配置同源,游戏设置页写穿)。
 * 数据库/自定义都不可用时返回"未配置":不发起任何模型请求、保留正文与旧变量;
 * 请求失败返回"失败",由调用方同轮重试一次、再失败只提示本轮结果,绝不抛错作废回合。
 */
async function 内置外置变量解析(参数: {
  行动: string;
  正文: string;
  快照: string;
  可写视图: Record<string, unknown>;
  回合前末楼: number;
  生成id前缀?: string;
  中止门?: Promise<never>;
}): Promise<内置外置变量解析结果> {
  // 只结算本轮:不携带跨轮的行动/正文,避免跨轮、跨角色或跨时间线串账。
  const 用户内容 = `【本轮玩家行动】\n${参数.行动}\n\n【本轮已完成正文】\n${参数.正文}`;
  const 现值视图 = `【当前可写变量现值】以下 JSON 是本轮允许更新字段的当前值，JSONPatch 路径层级以它为准：\n${JSON.stringify(参数.可写视图)}`;
  const 变量结算令 = 当前变量结算令();
  const 配置 = 读取MVU外置模型配置();
  // 通道选择与设置页同一张路由矩阵：自动优先数据库、其次自定义，都没有就返回 null——
  // 绝不回落正文 API（正文模型只负责故事，外置变量解析必须用独立模型）。
  const 通道 = 选择变量解析通道(...变量重生成通道输入(配置));
  if (!通道) {
    console.info('[人妻公寓] 没有可用的外置变量模型，本轮不发起解析请求');
    return { 结果: '未配置' };
  }

  本回合生成id = `${参数.生成id前缀 ?? 'rqgy-mvuvars'}-${参数.回合前末楼}-${_.random(1e9)}`;
  const 生成id = 本回合生成id;
  let 超时句柄: ReturnType<typeof setTimeout> | undefined;
  const 超时门 = new Promise<never>((_resolve, reject) => {
    超时句柄 = setTimeout(() => {
      try {
        stopGenerationById(生成id);
      } catch (e) {
        console.error('[人妻公寓] 停止超时的内置变量解析生成失败:', e);
      }
      reject(new Error('__RQGY_MVUVARS_TIMEOUT__'));
    }, 内置变量解析超时毫秒);
  });
  let 原文: string | null;
  try {
    if (通道 === '自定义' && 配置) {
      console.info('[人妻公寓] 内置变量解析走自定义API通道(与 MVU 额外模型配置同源)');
      原文 = String(
        await Promise.race([
          generateRaw({
            ordered_prompts: [
              { role: 'system', content: 参数.快照 },
              { role: 'system', content: 现值视图 },
              { role: 'system', content: 内置解析格式说明 },
              { role: 'user', content: 用户内容 },
              { role: 'system', content: 变量结算令 },
            ],
            should_stream: false,
            should_silence: true,
            generation_id: 生成id,
            custom_api: {
              apiurl: 规范OpenAI兼容API地址(配置.api地址),
              key: 配置.密钥,
              model: 配置.模型名称,
              max_tokens: 配置.最大回复token数 ?? 8192,
              ...(配置.温度 !== undefined ? { temperature: 配置.温度 } : {}),
              ...(配置.top_p !== undefined ? { top_p: 配置.top_p } : {}),
              source: 'openai',
            },
          }),
          超时门,
          ...(参数.中止门 ? [参数.中止门] : []),
        ]),
      );
    } else {
      console.info('[人妻公寓] 内置变量解析走数据库通道(数据库插件代发,沿用其自身配置)');
      原文 = await Promise.race([
        通过数据库生成(
          [
            { role: 'system', content: 参数.快照 },
            { role: 'system', content: 现值视图 },
            { role: 'system', content: 内置解析格式说明 },
            { role: 'user', content: 用户内容 },
            { role: 'system', content: 变量结算令 },
          ],
          '',
          配置?.最大回复token数 ?? 8192,
        ),
        超时门,
        ...(参数.中止门 ? [参数.中止门] : []),
      ]);
    }
  } catch (e) {
    if (e instanceof Error && e.message === '__RQGY_MVUVARS_CANCELLED__') return { 结果: '已取消' };
    if (e instanceof Error && e.message === '__RQGY_MVUVARS_TIMEOUT__') {
      console.warn(`[人妻公寓] 内置变量解析超过 ${内置变量解析超时毫秒 / 1000} 秒未返回`);
    } else {
      console.warn('[人妻公寓] 内置变量解析请求失败:', e);
    }
    return { 结果: '失败' };
  } finally {
    clearTimeout(超时句柄);
  }
  if (!原文) return { 结果: '失败' };
  const 变量块 = 取变量块(原文);
  return 变量块 ? { 结果: '成功', 变量块 } : { 结果: '失败' };
}

interface 变量重生成运行事务 extends 变量重生成事务门 {
  上下文: 变量重生成上下文;
  触发取消: () => void;
}

let 变量重生成事务: 变量重生成运行事务 | null = null;
let 变量重生成不确定提交令牌 = '';

function 读取变量重生成上下文(): 变量重生成上下文 | null {
  const 上次 = 读上次回合();
  const 上下文 = 上次?.变量重生成;
  if (!上下文 || 上下文.版本 !== 2) return null;
  if (
    !上下文.聊天ID ||
    !Number.isInteger(上下文.助手楼层) ||
    !上下文.回合令牌 ||
    !上下文.行动 ||
    !上下文.快照 ||
    !上下文.解析基准 ||
    !上下文.原AI结果 ||
    !上下文.派生票据 ||
    !上下文.风闻票据 ||
    !上下文.风闻票据.派生后
  ) {
    return null;
  }
  return 上下文;
}

function 变量重生成身份有效(上下文: 变量重生成上下文, 预期签名?: string): boolean {
  if (当前聊天ID() !== 上下文.聊天ID || getLastMessageId() !== 上下文.助手楼层) return false;
  const 当前上次 = 读上次回合()?.变量重生成;
  if (
    !当前上次 ||
    当前上次.助手楼层 !== 上下文.助手楼层 ||
    当前上次.回合令牌 !== 上下文.回合令牌 ||
    当前上次.聊天ID !== 上下文.聊天ID
  ) {
    return false;
  }
  const 消息 = SillyTavern.chat?.[上下文.助手楼层];
  if (
    !消息 ||
    消息.extra?.[回合令牌键] !== 上下文.回合令牌 ||
    消息.extra?.[回合角色键] !== 'assistant' ||
    消息.extra?.[临时楼标记键] !== false
  ) {
    return false;
  }
  return 预期签名 === undefined || 手机锚消息签名(消息) === 预期签名;
}

export function 读取变量重生成状态(): 变量重生成状态 {
  if (变量重生成事务) return { 状态: '进行中' };
  try {
    const 上下文 = 读取变量重生成上下文();
    if (!上下文 || !变量重生成身份有效(上下文)) {
      if (Number((读上次回合()?.变量重生成 as { 版本?: unknown } | undefined)?.版本) === 1) {
        return { 状态: '不可用', 原因: '这是旧版回合，请先正常完成一个新回合再使用变量重生成' };
      }
      return { 状态: '不可用', 原因: '当前没有可重新计算的完整回合' };
    }
    const 消息 = SillyTavern.chat?.[上下文.助手楼层];
    if (消息?.extra?.[变量重生成成功标记键] === true) return { 状态: '已完成' };
    if (变量重生成不确定提交令牌 === 上下文.回合令牌) {
      return { 状态: '不可用', 原因: '上次写入结果无法确认，请先刷新聊天后再判断' };
    }
    if (!上下文.变量范围.妻.length && !上下文.变量范围.夫.length) {
      return { 状态: '不可用', 原因: '最近一回合没有可写变量角色' };
    }
    if (!当前变量重生成解析通道()) {
      return { 状态: '未配置', 原因: '请先在游戏设置 → 变量解析中配置自动通道或自定义 API' };
    }
    const 当前raw = Mvu.getMvuData({ type: 'message', message_id: 上下文.助手楼层 });
    if (!当前raw) return { 状态: '不可用', 原因: '当前回合的变量数据尚未准备好' };
    const 当前stat原始 = _.get(当前raw, 'stat_data');
    验证可继续MVU存档结构(当前stat原始);
    Schema.parse(当前stat原始);
    return { 状态: '可用' };
  } catch {
    return { 状态: '不可用', 原因: '当前回合状态还没有准备好' };
  }
}

function 广播变量重生成状态(): void {
  eventEmit('人妻公寓:变量重生成状态', 读取变量重生成状态());
}

/** 正文卷轴的统一取消按钮也能中止变量重生成；数据库迟到结果只会自行结算，不再落盘。 */
export function 取消变量重生成(): boolean {
  if (!变量重生成事务) return false;
  const 事务 = 变量重生成事务;
  // 提交已经开始时仍由本事务吸收统一取消按钮，避免误落到普通回合取消；
  // 但不得再改写取消旗或停止一个已经按后置条件判定的核心提交。
  if (!请求取消变量重生成事务(事务)) return true;
  事务.触发取消();
  const 生成id = 本回合生成id;
  if (生成id) {
    try {
      stopGenerationById(生成id);
    } catch (e) {
      console.warn('[人妻公寓] 停止变量重生成请求失败，迟到结果仍会被身份门丢弃:', e);
    }
  }
  return true;
}

async function 持久写入变量重生成消息(
  楼层: number,
  正文: string,
  data: Mvu.MvuData,
  extra: Record<string, unknown>,
): Promise<{ 核心已提交: true; 持久化警告?: unknown }> {
  const 负载 = [{ message_id: 楼层, message: 正文, data: _.cloneDeep(data) as Record<string, unknown>, extra }];
  const 立即保存 = 读取立即持久保存宿主聊天();
  let 写入错误: unknown;
  try {
    await setChatMessages(负载, { refresh: 立即保存 ? 'none' : 'all' });
    if (立即保存) await 立即保存();
  } catch (e) {
    写入错误 = e;
  }
  // setChatMessages 或硬保存可能在“已改内存”之后才抛错；以后置条件判断，不能仅凭异常猜测。
  const 已写消息 = getChatMessages(楼层).at(-1);
  const 已写raw = Mvu.getMvuData({ type: 'message', message_id: 楼层 });
  const 核心已提交 =
    已写消息?.message === 正文 &&
    _.isEqual(已写消息?.extra, extra) &&
    _.isEqual(_.get(已写raw, 'stat_data'), _.get(data, 'stat_data'));
  if (核心已提交) return { 核心已提交: true, ...(写入错误 ? { 持久化警告: 写入错误 } : {}) };
  if (写入错误) throw 写入错误;
  throw new Error('__RQGY_VARIABLE_REGEN_MARK_FAILED__');
}

/**
 * 从该回合保存的解析前基线重新请求一次独立变量模型。网络与解析阶段零写入；只有模型块、
 * Schema、守护、聊天身份全部复核通过后才替换末楼变量，并在同一消息上持久标记本回合已用。
 */
export async function 重新生成最近回合变量(): Promise<boolean> {
  const 初始状态 = 读取变量重生成状态();
  if (初始状态.状态 !== '可用') {
    if (初始状态.状态 !== '进行中') {
      eventEmit('人妻公寓:变量重生成结束', {
        成功: false,
        状态: 初始状态.状态,
        提示: 初始状态.原因 ?? '本回合不能再次重新生成变量。',
      });
    }
    return false;
  }
  const 上下文 = 读取变量重生成上下文()!;
  if (MVU操作进行中()) {
    eventEmit('人妻公寓:变量重生成结束', {
      成功: false,
      状态: '可用',
      提示: '另一项楼务操作正在保存，请等它完成后再重新生成变量。',
    });
    return false;
  }
  const 前台租约 = 取得前台生成租约();
  if (!前台租约) {
    eventEmit('人妻公寓:变量重生成结束', {
      成功: false,
      状态: '可用',
      提示: '还有一项内容正在生成，请稍等片刻再试。',
    });
    return false;
  }

  const 时间线世代 = 当前时间线切换世代();
  const 原锚消息 = SillyTavern.chat?.[上下文.助手楼层];
  const 原消息签名 = 手机锚消息签名(原锚消息);
  const 身份仍有效 = () =>
    时间线世代 === 当前时间线切换世代() && 变量重生成身份有效(上下文, 原消息签名);
  let 触发中止!: (错误: Error) => void;
  const 中止门 = new Promise<never>((_resolve, reject) => {
    触发中止 = reject;
  });
  const 事务: 变量重生成运行事务 = {
    ...创建变量重生成事务门(),
    上下文,
    触发取消: () => 触发中止(new Error('__RQGY_MVUVARS_CANCELLED__')),
  };
  变量重生成事务 = 事务;
  eventEmit('人妻公寓:变量重生成开始');
  广播变量重生成状态();

  try {
    if (!身份仍有效()) throw new Error('__RQGY_VARIABLE_REGEN_STALE__');
    const 当前正文 = getChatMessages(上下文.助手楼层).at(-1)?.message ?? '';
    const 基础正文 = 提取正文舞台文本(当前正文);
    if (!基础正文) throw new Error('__RQGY_VARIABLE_REGEN_NO_STORY__');
    const 基准stat = Schema.parse(上下文.解析基准) as SchemaType;
    const 可写视图 = 构造AI可写变量视图(基准stat, 上下文.变量范围);
    const 请求结果 = await 内置外置变量解析({
      行动: 上下文.行动,
      正文: 基础正文,
      快照: 上下文.快照,
      可写视图,
      回合前末楼: 上下文.助手楼层 - 2,
      生成id前缀: 'rqgy-mvuvars-regen',
      中止门,
    });
    if (请求结果.结果 === '已取消' || 事务.已取消) throw new Error('__RQGY_MVUVARS_CANCELLED__');
    if (请求结果.结果 === '未配置') throw new Error('__RQGY_VARIABLE_REGEN_UNCONFIGURED__');
    if (请求结果.结果 !== '成功') throw new Error('__RQGY_VARIABLE_REGEN_FAILED__');
    if (!身份仍有效()) throw new Error('__RQGY_VARIABLE_REGEN_STALE__');

    const 当前候选raw = Mvu.getMvuData({ type: 'message', message_id: 上下文.助手楼层 });
    if (!当前候选raw) throw new Error('__RQGY_VARIABLE_REGEN_NO_DATA__');
    const 候选基准 = _.cloneDeep(当前候选raw) as Mvu.MvuData;
    _.set(候选基准, 'stat_data', _.cloneDeep(基准stat));
    const 候选raw = ((await Mvu.parseMessage(`${基础正文}\n${请求结果.变量块}`, 候选基准)) ?? 候选基准) as Mvu.MvuData;
    const raw候选stat = _.get(候选raw, 'stat_data');
    const 候选stat = Schema.parse(raw候选stat ?? {}) as SchemaType;
    const 重新生成守护 = 回滚保护字段(
      候选stat,
      上下文.焦点,
      上下文.变量范围,
      上下文.助手楼层,
      raw候选stat,
      基准stat,
    );
    const 新AI结果 = 提取变量重生成AI结果(候选stat, 上下文.变量范围);
    const 派生重算 = 重算变量重生成派生(
      上下文.原AI结果,
      新AI结果,
      上下文.派生票据,
      重新生成守护?.合法正候选 as 合法正候选表 | undefined,
    );
    if (变量重生成有不可逆派生冲突(新AI结果, 上下文.派生票据, 派生重算)) {
      throw new Error('__RQGY_VARIABLE_REGEN_IRREVERSIBLE__');
    }

    let 核心持久化有警告 = false;
    await 排队MVU操作(async () => {
      if (事务.已取消) throw new Error('__RQGY_MVUVARS_CANCELLED__');
      if (!身份仍有效()) throw new Error('__RQGY_VARIABLE_REGEN_STALE__');
      const 当前raw = Mvu.getMvuData({ type: 'message', message_id: 上下文.助手楼层 });
      if (!当前raw) throw new Error('__RQGY_VARIABLE_REGEN_NO_DATA__');
      const 当前stat原始 = _.get(当前raw, 'stat_data');
      验证可继续MVU存档结构(当前stat原始);
      const 当前stat = Schema.parse(当前stat原始) as SchemaType;
      const 合并stat = Schema.parse(
        合并重新生成变量结果(
          当前stat,
          上下文.原AI结果,
          新AI结果,
          上下文.变量范围,
          上下文.派生票据,
          派生重算,
        ),
      ) as SchemaType;
      const 风闻重算 = _.cloneDeep(合并stat) as SchemaType;
      应用变量重生成风闻快照(风闻重算, 上下文.风闻票据.派生前);
      if (!上下文.风闻票据.跳过成长风闻) {
        for (const 成长 of 派生重算.成长) {
          const 档 = 成长对应攻略风闻(成长);
          if (档) 登记攻略风闻(风闻重算, 成长.门牌, 档);
        }
      }
      for (const 调用 of 上下文.风闻票据.后续调用) 登记攻略风闻(风闻重算, 调用.门牌, 调用.档);
      const 新派生后 = 提取变量重生成风闻快照(风闻重算);
      const 含原回合独立结算 = 三方合并变量重生成对象(
        上下文.风闻票据.派生后,
        新派生后,
        上下文.风闻票据.原回合最终,
      );
      const 含回合后独立变化 =
        含原回合独立结算 &&
        三方合并变量重生成对象(
          上下文.风闻票据.原回合最终,
          含原回合独立结算,
          提取变量重生成风闻快照(当前stat),
        );
      if (!含回合后独立变化) throw new Error('__RQGY_VARIABLE_REGEN_DERIVED_CONFLICT__');
      应用变量重生成风闻快照(合并stat, 含回合后独立变化);
      const 合并raw = _.cloneDeep(当前raw) as Mvu.MvuData;
      _.set(合并raw, 'stat_data', 合并stat);
      const 当前消息 = SillyTavern.chat?.[上下文.助手楼层];
      const 原正文 = getChatMessages(上下文.助手楼层).at(-1)?.message ?? 当前正文;
      const 原extra = _.cloneDeep((当前消息?.extra ?? {}) as Record<string, unknown>);
      const 新正文 = `${基础正文}\n${请求结果.变量块}`;
      try {
        if (!身份仍有效()) throw new Error('__RQGY_VARIABLE_REGEN_STALE__');
        if (!尝试进入变量重生成提交(事务)) throw new Error('__RQGY_MVUVARS_CANCELLED__');
        // 正文、MVU data 与一次成功标记只交给一次消息更新；硬保存若在写后抛错，
        // 按后置条件认定已完成，绝不给同一回合第二次成功机会。
        const 提交 = await 持久写入变量重生成消息(上下文.助手楼层, 新正文, 合并raw, {
          ...原extra,
          [变量重生成成功标记键]: true,
        });
        if (!标记变量重生成已提交(事务)) throw new Error('__RQGY_VARIABLE_REGEN_COMMIT_UNCERTAIN__');
        核心持久化有警告 = Boolean(提交.持久化警告);
        if (提交.持久化警告) console.error('[人妻公寓] 变量重生成核心已提交，但宿主硬保存返回异常:', 提交.持久化警告);
      } catch (e) {
        try {
          await 持久写入变量重生成消息(上下文.助手楼层, 原正文, _.cloneDeep(当前raw) as Mvu.MvuData, 原extra);
        } catch (回滚错误) {
          变量重生成不确定提交令牌 = 上下文.回合令牌;
          console.error('[人妻公寓] 变量重生成成套写入失败，恢复原消息也失败:', 回滚错误);
          throw new Error('__RQGY_VARIABLE_REGEN_COMMIT_UNCERTAIN__');
        }
        throw e;
      }
      try {
        捕获保护快照(合并stat);
        await 等待晋阶镜像写入();
        await 同步整表视图(合并stat, undefined, 上下文.变量范围, 上下文.助手楼层);
      } catch (e) {
        // 核心消息与 MVU 已原子式完成并带成功标记；镜像/提示视图是可重建副作用，
        // 失败不能反向宣称本次未成功、从而给同回合第二次成功机会。
        console.warn('[人妻公寓] 变量重生成已提交，但派生视图同步失败，将在下一次刷新重建:', e);
      }
    });

    eventEmit('人妻公寓:变量重生成结束', {
      成功: true,
      状态: '已完成',
      提示: 核心持久化有警告
        ? '变量已经成套更新，但宿主保存返回异常；本回合已锁定，请先不要重复操作。'
        : '本回合变量已重新生成，正文没有改变。',
    });
    return true;
  } catch (e) {
    const 代码 = e instanceof Error ? e.message : String(e);
    const 已取消请求 = 代码 === '__RQGY_MVUVARS_CANCELLED__' || 事务.已取消;
    const 提示 = 已取消请求
      ? '已取消重新生成变量，当前数值没有改变。'
      : 代码 === '__RQGY_VARIABLE_REGEN_UNCONFIGURED__'
        ? '没有可用的变量模型。请先在游戏设置 → 变量解析中配置自动通道或自定义 API。'
        : 代码 === '__RQGY_VARIABLE_REGEN_STALE__'
          ? '消息分支或当前回合已经变化，本次结果没有应用。'
          : 代码 === '__RQGY_VARIABLE_REGEN_IRREVERSIBLE__'
            ? '新结果会改变本回合已经判定过的一次性剧情，为避免重复或抹掉剧情，本次没有应用。'
            : 代码 === '__RQGY_VARIABLE_REGEN_DERIVED_CONFLICT__'
              ? '本回合之后已有新的风闻或考核变化，为避免覆盖，本次没有应用。'
              : 代码 === '__RQGY_VARIABLE_REGEN_COMMIT_UNCERTAIN__'
                ? '宿主写入异常，无法确认是否完整保存；已锁定本回合，请刷新聊天后检查。'
          : 代码 === '__RQGY_VARIABLE_REGEN_NO_STORY__'
            ? '最近一回合没有可用于重新计算的正文。'
            : '变量重新生成失败，当前正文和数值没有改变，可以再试一次。';
    if (!已取消请求 && !代码.startsWith('__RQGY_VARIABLE_REGEN_')) {
      console.error('[人妻公寓] 变量重新生成失败:', e);
    }
    const 失败后状态: 变量重生成可用状态 =
      SillyTavern.chat?.[上下文.助手楼层]?.extra?.[变量重生成成功标记键] === true
        ? '已完成'
        : 变量重生成不确定提交令牌 === 上下文.回合令牌
          ? '不可用'
          : 当前变量重生成解析通道()
            ? '可用'
            : '未配置';
    eventEmit('人妻公寓:变量重生成结束', {
      成功: false,
      取消: 已取消请求,
      状态: 失败后状态,
      提示,
    });
    return false;
  } finally {
    if (变量重生成事务 === 事务) 变量重生成事务 = null;
    if (本回合生成id.startsWith('rqgy-mvuvars-regen-')) 本回合生成id = '';
    前台租约.释放();
    广播变量重生成状态();
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
  位置?: string;
  进房末楼?: number;
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
      // “连续”只属于同一次现场对话。玩家换房、去做楼务或穿插新手引导后，旧房间妻子的
      // 负好感链必须断开；否则下一次重访的第一句也会接上几楼前的旧计数，造成未推进时间
      // 却突然离场。删除缺席项也让回档后的记录保持最小、不会跨场景复活。
      const 本轮在场妻 = new Set(妻在场);
      for (const m of Object.keys(记录) as 门牌[]) {
        if (!本轮在场妻.has(m)) delete 记录[m];
      }
      const 当前场景 = 读场景();
      const 当前进房末楼 = Number(当前场景.进房末楼 ?? -1);
      for (const m of 妻在场) {
        const 旧好感 = 旧Stat.户[m]?.妻.好感值;
        const 新好感 = 新Stat.户[m]?.妻.好感值;
        if (旧好感 == null || 新好感 == null) continue;
        const 旧记录 = 记录[m];
        const 仍是同次拜访 =
          !!当前场景.房间id && 旧记录?.位置 === 当前场景.房间id && Number(旧记录.进房末楼 ?? -2) === 当前进房末楼;
        const 上次次数 = 仍是同次拜访 ? Math.max(0, Number(旧记录?.次数 ?? 0)) : 0;
        const 次数 = 新好感 < 旧好感 ? 上次次数 + 1 : 0;
        记录[m] = { 次数, 上次楼: 楼层, 位置: 当前场景.房间id ?? '', 进房末楼: 当前进房末楼 };
        if (次数 >= 3) {
          离场.push(m);
          记录[m] = {
            次数: 0,
            上次楼: 楼层,
            位置: 当前场景.房间id ?? '',
            进房末楼: 当前进房末楼,
          };
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
        // 头像行读取 `_在场`，立绘与“在场人物”读取 `_粘滞`/作息；离场必须在同一笔
        // chat 变量事务里同时收口两边，不能留下“头像亮、人物已走”的半状态。
        const 演员 = (_.get(vars, '_在场') ?? null) as Record<string, unknown> | null;
        if (演员) {
          for (const 键 of ['焦点', '在场', '妻在场', '可写妻'] as const) {
            const 列表 = 演员[键];
            if (Array.isArray(列表)) 演员[键] = 列表.filter(m => !离场.includes(m as 门牌));
          }
          _.set(vars, '_在场', 演员);
        }
        const 赴约 = (_.get(vars, '_赴约') ?? null) as { m?: 门牌 } | null;
        if (赴约?.m && 离场.includes(赴约.m)) _.set(vars, '_赴约', null);
        // 连续反感离场只移除本人：旧单人计划自然清空，共同邀约的其他接受成员继续保留。
        const 邀约计划 = (_.get(vars, '_手机邀约计划') ?? null) as 手机邀约计划 | null;
        if (手机邀约计划成员(邀约计划).some(m => 离场.includes(m))) {
          _.set(vars, '_手机邀约计划', 移除手机邀约计划成员(邀约计划, 离场));
        }
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
  // 生成前候选视图：让本轮可写焦点妻的亲密候选叶子可见，覆盖自然升级/昵称/代词等被预判
  // 为“简”的漏判；供当前独立外置解析以及宿主非外置更新方式的兼容监听消费，兼容监听只读
  // 既有视图，不是受支持的“正文 API 变量解析”路线。候选不提前授权，记录仍写精确守护范围；
  // 只读场景的变量范围.妻 为空，候选随之为空，仍保持完全只读。
  const 视图已同步 = await 同步整表视图(data, 事务仍有效, 变量范围, 楼层, 解析候选亲密妻(变量范围));
  if (!视图已同步) throw new Error('本轮变量状态快照同步失败，请重试');
  if (!事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const 记忆人物 = [...妻在场.map(m => 户静态表[m]?.妻名), ...夫在场.map(m => 户静态表[m]?.夫名)].filter(
    (name): name is string => !!name,
  );
  const 最近行动 = [...对话尾].reverse().find(消息 => 消息.role === 'user')?.content ?? '';
  const 明确追忆 = /记得|上次|以前|之前|曾经|答应|约定|微信|消息|秘密|那天|刚才/.test(最近行动);
  const 需要记忆 = 快照刷新票.模式 === '完整' || 明确追忆;
  const 有效楼务任务id们 = data.系统._管理考核.活跃任务.map(任务 => 任务.id);
  const 私聊引用 = 需要记忆 ? 当前微信摘要引用(私聊可召回妻, 记忆截止楼层) : [];
  // 通用记忆门关闭时，只允许当前正文末楼刚完成“玩家→本人回复”的可靠在场妻
  // 一次性承接近期私聊。正文成功后楼层前进即自然消费；失败/取消/重试仍停在原楼，
  // 不新增跨分支消费状态。完整快照/明确追忆则继续沿用原有的全部可靠在场私聊。
  const 近期微信记忆 = 读取近期微信胶囊(私聊可召回妻, 记忆截止楼层, data.系统._绝对时段, 有效楼务任务id们, {
    仅本楼已完成往返: !需要记忆,
  });
  const 数据库记忆 =
    (需要记忆 ? 读取数据库记忆胶囊(记忆人物, 记忆截止楼层) + 读取微信进展胶囊(私聊引用, 记忆截止楼层) : '') +
    近期微信记忆;
  // 数据库位于快照之后时，模型容易把较近的旧叙述误当当前事实。末位再压一次裁决：
  // 数据库只补长期连续性，绝不参与当前时间、地点和在场判定。
  const 当前场景裁决 = 数据库记忆
    ? '\n【当前场景硬裁决】数据库记忆只补充过去经历；当前时间、当前位置、人物是否在场、丈夫是否外出及当前着装，必须完全服从上方《公寓快照》。若两者冲突，忽略数据库中的旧状态；历史服装只代表当时穿着，禁止与【当前着装·唯一现场事实】叠穿。\n'
    : '';
  const 快照 = 公寓快照 + 数据库记忆 + 当前场景裁决;
  // 内容量审计(2026-07-19 用户点名#5):每楼注入体积落日志,测试期拿真实数据定收敛策略
  console.info(
    `[人妻公寓·快照] ${快照刷新票.模式} ${快照.length}字(焦点${焦点.length}人/在场${在场.length}人；${快照刷新票.原因}${数据库记忆 ? `；${需要记忆 ? '含记忆' : '含本楼微信承接'}` : ''})`,
  );
  return { 快照, 焦点, 妻在场, 夫在场, 尺度模式, 变量范围, 快照刷新票 };
}

const 数据库事件元数据键 = '_rqgy数据库事件';

interface 数据库事件元数据 {
  版本: 1;
  时间: string;
  地点: string;
  参与者: string[];
  玩家行动: string;
}

type 宿主聊天消息 = {
  role?: string;
  is_user?: boolean;
  mes?: unknown;
  message?: unknown;
  extra?: Record<string, unknown>;
};

function 宿主消息文本(message: 宿主聊天消息 | undefined): string {
  return String(message?.mes ?? message?.message ?? '').trim();
}

function 宿主消息是玩家(message: 宿主聊天消息 | undefined): boolean {
  return message?.is_user === true || message?.role === 'user';
}

/**
 * 正式双楼已经提交后才在后台唤醒数据库。优先调用官方 V2 triggerUpdate；旧版才补发
 * GENERATION_STARTED/ENDED。SillyTavern 的 GENERATION_ENDED 参数是 chat.length，不是末楼 ID。
 * 数据库失败、超时或没有接口只记日志，绝不继续占用前台回合与场景移动锁。
 */
async function 广播生成完成事件(
  目标助手楼层: number,
  提交校验: () => boolean = () => true,
): Promise<void> {
  try {
    if (!提交校验() || !数据库状态().已安装) return;
    eventEmit('人妻公寓:运行阶段', '数据库正在后台整理记忆');
    const V2结果 = await 触发数据库增量更新();
    if (!提交校验()) return;
    if (V2结果 !== '无接口') {
      if (V2结果 === '未触发') console.warn('[人妻公寓·数据库] V2 增量更新没有成功触发，本轮骨架保留待后续补写。');
      return;
    }

    const 消息表 = SillyTavern.chat ?? [];
    // 旧版事件桥只允许唤醒当前真实尾楼；若玩家已经开始下一轮，稍后的成功楼会再次触发，
    // 不能对着临时 user 楼或更旧 assistant 楼伪造结束事件，否则数据库会报 no AI message found。
    if (消息表.length - 1 !== 目标助手楼层) return;
    const 宿主 = window.parent as any;
    const 全局ST = 宿主?.SillyTavern;
    const 上下文 = 全局ST?.getContext?.() ?? 全局ST;
    const 事件源 = 上下文?.eventSource ?? 全局ST?.eventSource;
    const 事件表 = 上下文?.eventTypes ?? 上下文?.event_types ?? 全局ST?.eventTypes ?? 全局ST?.event_types;
    if (typeof 事件源?.emit !== 'function' || !事件表?.GENERATION_ENDED) return;
    let 超时器: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        (async () => {
          if (事件表.GENERATION_STARTED) await 事件源.emit(事件表.GENERATION_STARTED, 'normal', {}, false);
          if (!提交校验()) return;
          await 事件源.emit(事件表.GENERATION_ENDED, (SillyTavern.chat ?? []).length);
        })(),
        new Promise<void>(resolve => {
          超时器 = setTimeout(() => {
            console.warn('[人妻公寓] 数据库兼容广播等待超过30秒；前台游戏早已解锁，骨架留待后续批次。');
            resolve();
          }, 30_000);
        }),
      ]);
    } finally {
      if (超时器) clearTimeout(超时器);
    }
  } catch (e) {
    console.warn('[人妻公寓] 数据库插件后台更新失败(不影响游戏):', e);
  }
}

let 数据库记录失败提示签名 = '';

async function 记录数据库回合骨架(
  楼层: number,
  data: SchemaType,
  地点: string,
  行动: string,
  妻在场: readonly 门牌[],
  夫在场: readonly 门牌[],
  提交校验: () => boolean = () => true,
): Promise<boolean> {
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const 参与者 = [...妻在场.map(m => 户静态表[m]?.妻名), ...夫在场.map(m => 户静态表[m]?.夫名)].filter(
    (name): name is string => !!name,
  );
  const 数据库已启用 = 数据库状态().已装游戏模板;
  if (!数据库已启用) return false;
  eventEmit('人妻公寓:运行阶段', '数据库正在记录剧情硬骨架');
  const 写入结果 = await 同步数据库回合(
    {
      楼层,
      时间: 格式化游戏内时间(data),
      地点: 地点 || '公寓公共区域',
      参与者,
      玩家行动: 行动,
      结果摘要: 数据库事件待整理摘要,
    },
    提交校验,
  );
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  if (写入结果 === '已确认') {
    数据库记录失败提示签名 = '';
    eventEmit('人妻公寓:运行阶段', '数据库剧情骨架已记录');
    return true;
  }
  if (写入结果 === '待确认') {
    console.warn(`[人妻公寓·数据库] RQ_剧情事件骨架 ${楼层} 已提交，仍在后台等待 SQLite 确认。`);
    eventEmit('人妻公寓:运行阶段', '数据库剧情骨架后台确认中');
    return true;
  }

  const 能力 = await 检测数据库脚本写入能力();
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const 原因 = 能力.可写
    ? 'SQLite 已就绪，但本次骨架写入没有获得数据库确认；请检查数据库运行状态或 F12 控制台。'
    : 能力.说明;
  const 提示签名 = `${当前聊天ID()}|${能力.状态}|${原因}`;
  console.warn(`[人妻公寓·数据库] RQ_剧情事件骨架 ${楼层} 未写入：${原因}`);
  eventEmit('人妻公寓:运行阶段', '数据库剧情骨架未写入');
  if (提示签名 !== 数据库记录失败提示签名) {
    数据库记录失败提示签名 = 提示签名;
    eventEmit('人妻公寓:提示', `⚠ RQ_剧情事件骨架未写入：${原因} 本轮正文与游戏结算不受影响。`);
  }
  return false;
}

/**
 * v0.85 以前脚本直写偶发漏楼。只扫描当前仍存活的正式 assistant 楼，最近缺口优先，
 * 每次最多补 12 条硬骨架；时间来自该楼 stat_data，未知地点明确标旧记录，不让 AI 猜硬事实。
 */
async function 补齐缺失数据库事件骨架(
  截止楼层: number,
  提交校验: () => boolean = () => true,
): Promise<number> {
  if (!提交校验() || !数据库状态().已装游戏模板) return 0;
  const 已记录 = 读取数据库剧情事件已记录楼层(截止楼层);
  if (!已记录) return 0;
  const 消息表 = (SillyTavern.chat ?? []) as 宿主聊天消息[];
  let 已补写 = 0;
  for (let 楼层 = Math.min(截止楼层, 消息表.length - 1); 楼层 >= 1 && 已补写 < 12; 楼层 -= 1) {
    if (!提交校验() || 已记录.has(楼层)) continue;
    const 消息 = 消息表[楼层];
    if (!消息 || 宿主消息是玩家(消息) || !宿主消息文本(消息)) continue;
    const extra = 消息.extra ?? {};
    if (extra[临时楼标记键] === true) continue;
    const 前楼 = 消息表[楼层 - 1];
    let 绝对时段 = Number.NaN;
    try {
      绝对时段 = Number(_.get(Mvu.getMvuData({ type: 'message', message_id: 楼层 }), 'stat_data.系统._绝对时段'));
    } catch {
      /* 无楼层数据时下面按非游戏消息跳过。 */
    }
    const 是正式游戏楼 =
      extra[回合角色键] === 'assistant' ||
      typeof extra._rqgy开局令牌 === 'string' ||
      (宿主消息是玩家(前楼) && Number.isInteger(绝对时段) && 绝对时段 >= 0);
    if (!是正式游戏楼) continue;

    const 元数据 =
      extra[数据库事件元数据键] && typeof extra[数据库事件元数据键] === 'object'
        ? (extra[数据库事件元数据键] as Partial<数据库事件元数据>)
        : null;
    const 妻门牌 = Array.isArray(extra[回合在场妻键]) ? extra[回合在场妻键] : [];
    const 参与者 = Array.isArray(元数据?.参与者)
      ? 元数据.参与者.filter((name): name is string => typeof name === 'string' && !!name.trim())
      : 妻门牌
          .map(value => 户静态表[String(value) as 门牌]?.妻名)
          .filter((name): name is string => Boolean(name));
    const 玩家行动 =
      (typeof 元数据?.玩家行动 === 'string' && 元数据.玩家行动.trim()) ||
      宿主消息文本(前楼) ||
      (typeof extra._rqgy开局令牌 === 'string' ? '开始新游戏' : '');
    if (!玩家行动) continue;
    const 时间 =
      (typeof 元数据?.时间 === 'string' && 元数据.时间.trim()) ||
      (Number.isInteger(绝对时段) && 绝对时段 >= 0 ? 格式化游戏内时间(绝对时段) : '旧记录（时间未保存）');
    const 地点 =
      (typeof 元数据?.地点 === 'string' && 元数据.地点.trim()) || '历史剧情（地点未保存）';
    const 写入 = await 同步数据库回合(
      {
        楼层,
        时间,
        地点,
        参与者,
        玩家行动,
        结果摘要: 数据库事件待整理摘要,
      },
      提交校验,
    );
    if (写入 === '失败') break;
    已记录.add(楼层);
    已补写 += 1;
  }
  if (已补写) console.info(`[人妻公寓·数据库] 已补齐 ${已补写} 条当前时间线缺失的 RQ 剧情硬骨架。`);
  return 已补写;
}

function 安排数据库回合后处理(参数: {
  楼层: number;
  data: SchemaType;
  地点: string;
  行动: string;
  妻在场: readonly 门牌[];
  夫在场: readonly 门牌[];
  提交校验: () => boolean;
}): void {
  const data快照 = _.cloneDeep(参数.data) as SchemaType;
  const 妻快照 = [...参数.妻在场];
  const 夫快照 = [...参数.夫在场];
  setTimeout(() => {
    void (async () => {
      try {
        if (!参数.提交校验()) return;
        await 记录数据库回合骨架(
          参数.楼层,
          data快照,
          参数.地点,
          参数.行动,
          妻快照,
          夫快照,
          参数.提交校验,
        );
        if (!参数.提交校验()) return;
        await 补齐缺失数据库事件骨架(参数.楼层, 参数.提交校验);
        if (!参数.提交校验()) return;
        // 下一轮已经开始时不对着临时尾楼触发数据库；下一次成功楼会继续处理所有 pending 骨架。
        if (回合进行中() || getLastMessageId() !== 参数.楼层) return;
        await 广播生成完成事件(参数.楼层, 参数.提交校验);
      } catch (error) {
        console.warn('[人妻公寓·数据库] 回合后台记忆处理失败（前台游戏不受影响）:', error);
      } finally {
        if (!回合进行中()) eventEmit('人妻公寓:运行阶段', '');
      }
    })();
  }, 0);
}

/** 静音会议的成功正文还必须拒绝任何可重放的裸变量命令。 */
export function 提取静音会议可提交正文(原文: string): string {
  let 正文 = 提取可提交正文(原文)
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

interface 回合结算结果 {
  入住预约已提交: boolean;
  /** 核心 MVU 与正式楼都提交成功后再执行的聊天软消费旗，失败不得反向撤销核心回合。 */
  提交后任务: Array<() => void | Promise<unknown>>;
}

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
  回合场景: string,
  变量派生票据?: 变量重生成派生票据,
  场景剧情票?: { id: string; 请求世代: number },
): 回合结算结果 {
  const 本楼事件 = 本轮事件.内容;
  let 入住预约已提交 = false;
  const 提交后任务: Array<() => void | Promise<unknown>> = [];
  const 排队提交后提示 = (消息: string) => {
    if (消息) 提交后任务.push(() => eventEmit('人妻公寓:提示', 消息));
  };
  let 结算前待发送基线 = newStat.系统._待发送事件;
  const 提交本轮事件 = () => {
    if (!本轮事件可提交(本轮事件, newStat.系统._待发送事件, 楼层, 有效正文)) return;
    入住预约已提交 = 提交入住登场(newStat, 本楼事件, 楼层) !== null;
    newStat.系统._已注入事件 = { 楼层, 内容: 本楼事件 };
    const 母亲线路消息 = 提交母亲两幕事件(newStat, 本楼事件);
    if (母亲线路消息.length) 排队提交后提示(母亲线路消息.join('\n'));
    const 地点线路消息 = 提交阶段线路剧情(newStat, 本楼事件, 回合场景);
    if (地点线路消息.length) 排队提交后提示(地点线路消息.join('\n'));
    const 阶段演出票数 = (本楼事件.match(/【阶段线路演出:/g) ?? []).length;
    if (阶段演出票数) {
      const 阶段演出消息 = 提交阶段线路演出事件(newStat, 本楼事件);
      if (阶段演出消息.length !== 阶段演出票数) throw new Error('阶段线路演出票据已经失效，本轮事件未提交。');
      排队提交后提示(阶段演出消息.join('\n'));
    }
    const 性癖票 = 解析阶段性癖开幕事件(本楼事件);
    if (性癖票) {
      const 提交结果 = 提交阶段性癖开幕(newStat, 本楼事件, 楼层);
      if (!提交结果.成功) throw new Error(提交结果.提示 || '阶段主题开幕未能提交。');
      if (提交结果.提示) 排队提交后提示(提交结果.提示);
    }
    const 专用场景接管 = Boolean(newStat.系统._特殊场景.id || newStat.系统._荣耀洞拍 >= 0);
    const 活动事务 = newStat.系统._场景剧情事务;
    const 活动事务ID = 专用场景接管 ? '' : 活动事务.id;
    if (
      活动事务ID &&
      (!场景剧情票 || 活动事务ID !== 场景剧情票.id || 活动事务.请求世代 !== 场景剧情票.请求世代)
    ) {
      throw new Error('场景剧情请求世代已经变化，迟到正文不能认领当前重试。');
    }
    const 已消费 = 活动事务ID
      ? 提交场景剧情成功(newStat, 本楼事件, 活动事务ID, 场景剧情票?.请求世代)
      : 消费队首场景剧情(newStat, 本楼事件);
    if (!已消费) throw new Error('场景剧情队首在提交前已经变化，本轮没有消费任何待演事件。');
    结算前待发送基线 = newStat.系统._待发送事件;
  };

  if (静音会议正式运行中(snapStat)) {
    // 隔离场只消费本轮固定事件；经济、作息、疑心、打断、入住、冷落等普通账全部暂停。
    提交本轮事件();
    return { 入住预约已提交, 提交后任务 };
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
    const 疑心冻结 = 疑心冻结中(节点.夫, 现钟);
    const 疑心前 = 节点.夫.疑心值;
    结算焦点疑心(节点, m, 堕落增量, 现钟);
    if (变量派生票据) {
      变量派生票据.疑心[m] = {
        回合前堕落: snapStat.户[m]?.妻.堕落值 ?? 节点.妻.堕落值,
        原贡献: Math.max(0, 节点.夫.疑心值 - 疑心前),
        冻结: 疑心冻结,
      };
    }
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
    if (经提示.length) 排队提交后提示(经提示.join('\n'));
  }

  // 入住检测(P5 分批唤醒;搬家戏抢事件通道优先级最高——新住户登场是硬剧情)
  入住检测(newStat, 楼层, _.uniq([...妻在场, ...夫在场]).length);

  // 换装起疑(换装余波→丈夫侧):疑心与下一幕先进入核心 MVU；聊天余波消费旗
  // 必须等正式楼提交成功后再写，避免最终保存失败却永久压掉这一事件。
  const 提交换装疑记 = 换装起疑(newStat, 楼层);
  if (提交换装疑记) 提交后任务.push(提交换装疑记);

  // 丈夫打断(优先于冷落抢事件通道):疑心定级别,信任压频率,反讽格走"兄弟拜托"
  if (变量派生票据 && 丈夫打断会读取疑心(newStat, 焦点) && 焦点[0]) {
    变量派生票据.不可逆疑心门牌 = 焦点[0];
  }
  打断检测(newStat, 焦点, 楼层);

  // 父亲越洋来电(302专属"丈夫回家"位:亲热中屏幕亮起"老公")
  父亲来电打断(newStat, 焦点, 楼层);

  // 母亲撞见(P5⑥:亲密推进被妈看见——入列前=监督者扣胜任度+暗账;入列后=圆场反转+吃醋)
  const 撞见门牌 = 焦点[0];
  if (
    变量派生票据 &&
    撞见门牌 &&
    撞见门牌 !== '302' &&
    newStat.户[撞见门牌]?.妻.当前阶段 >= 2 &&
    !newStat.系统._待发送事件 &&
    newStat.系统._上次撞见档 < 现钟 &&
    母亲撞见风险(newStat, 撞见门牌, 回合场景, 难度表[newStat.系统._难度]?.撞见概率系数 ?? 1)
      .概率 > 0
  ) {
    变量派生票据.不可逆撞见资格 = { 门牌: 撞见门牌, 原本正向: 主焦堕落增量 > 0 };
  }
  母亲撞见检测(
    newStat,
    焦点[0],
    主焦堕落增量,
    楼层,
    难度表[newStat.系统._难度]?.撞见概率系数 ?? 1,
    回合场景,
  );

  // 绿帽双线(102观众席"门缝那一眼"/202哑巴亏):开线关键事件,结局轨道单向标记
  if (
    变量派生票据?.疑心['202'] &&
    !newStat.系统._待发送事件 &&
    newStat.户['202'] &&
    !newStat.户['202'].夫.结局轨道 &&
    newStat.户['202'].妻.当前阶段 >= 3
  ) {
    变量派生票据.不可逆疑心门牌 = '202';
  }
  绿帽线检测(newStat, 楼层);
  // 本轮消费旧票后，结算链可能新产生入住、丈夫打断或其他强剧情。每一项都单独绑定
  // 本轮真实场景，后续只能逐票演出；特殊场景继续由自己的状态机管理。
  if (!newStat.系统._特殊场景.id && newStat.系统._荣耀洞拍 < 0) {
    绑定新增待发送事件到场景(
    newStat,
    结算前待发送基线,
    回合场景 || null,
    item => 是入住登场事件(item),
  );
  }
  return { 入住预约已提交, 提交后任务 };
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
    /**
     * 纯 UI 强制演出可在业务结算前预占共享前台槽，再把租约移交给本回合。
     * 执行回合一旦收到便取得释放所有权；所有启动拒绝与主 finally 都必须幂等释放。
     */
    预占前台生成租约?: 生成通道租约;
    /** 活动场景剧情只能由首次自动演出或专用重试入口认领，普通输入不得改写原行动。 */
    场景剧情事务ID?: string;
    /** 同一事务的每次重试都有独立世代；旧请求迟到时不得认领新世代。 */
    场景剧情请求世代?: number;
  } = {},
): Promise<boolean> {
  const 释放预占租约 = () => 选项.预占前台生成租约?.释放();
  if (回合进行中()) {
    释放预占租约();
    eventEmit('人妻公寓:回合失败', '上一轮或消息时间线还在收口，请稍等片刻再行动。');
    return false;
  }
  // 普通购买、送礼、调查、时间等整表业务从同步入队起即占用 MVU 忙门。
  // 除非本回合明确由同一安全操作持锁移交，否则不得从排队微任务缝隙读取旧基准抢跑。
  if (!选项.已持MVU操作租约 && MVU操作进行中()) {
    释放预占租约();
    eventEmit('人妻公寓:回合失败', '另一项楼务操作正在保存，请等它完成后再行动。');
    return false;
  }
  // 数据库 AI 迟到租约：底层 callAI 无法取消，超时后仍可能占用 TavernHelper 生成槽。
  // 只要上一笔数据库请求尚未 settle，就不得取回合锁、建临时楼或发生成开始去撞该槽；
  // 命中时发 回合失败 提示并返回 false（回合失败 事件由客户端解锁发送锁，不会遗留锁）。
  if (全局数据库AI租约.在结算()) {
    释放预占租约();
    eventEmit('人妻公寓:回合失败', '数据库AI仍在结算上一轮请求，请稍等片刻再开始。');
    return false;
  }
  // 手机的自动内容拍与手动回复也可能走正文/custom generateRaw；这些路线不会取得数据库租约，
  // 仍与正文共用 TavernHelper 生成槽。前台回合在手机整拍或任一手机 AI 请求在途时失败关闭，
  // 避免供应商返回“AI回复失败”以及迟到手机结果反向污染本轮临时楼。
  if (手机节拍进行中() || 手机AI生成中()) {
    释放预占租约();
    eventEmit('人妻公寓:回合失败', '手机后台消息正在生成，请稍等片刻再行动。');
    return false;
  }
  // 双向生成互斥(rq0.75):前台正文在取得回合锁/任何 await 之前同步占住共享生成槽,
  // 手机手动批次与后续小生成在此窗口内一律拒绝;本租约随主 finally 的
  // 成功/失败/取消路径幂等释放,且释放不早于临时楼/变量回滚完成。
  const 前台租约 = 选项.预占前台生成租约 ?? 取得前台生成租约();
  if (!前台租约) {
    eventEmit('人妻公寓:回合失败', '手机后台消息正在生成，请稍等片刻再行动。');
    return false;
  }
  const 回合时间线世代 = 当前时间线切换世代();
  进行中 = true;
  已取消 = false;
  允许取消 = true;
  const 本轮时间线已改变 = () => 回合时间线世代 !== 当前时间线切换世代();
  const 本轮时间线仍有效 = () => !本轮时间线已改变();
  const 本轮事务仍有效 = () => 本轮时间线仍有效() && !已取消;
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
  let 回合完成已广播 = false;
  let 变量解析已降级 = false;
  let 变量解析降级阶段 = '';
  let 本轮静音会议 = false;
  let chat快照: Record<string, unknown> | null = null;
  let 回合基准data: SchemaType | null = null;
  // 失败事件必须等 finally 完成临时楼删除、chat 变量恢复和事务解锁后再广播。
  // 旧顺序在 catch 里先广播，客户端会抢在回滚前读取临时 assistant 楼：正文先出现后消失，
  // 背包/任务/在场头像也会短暂读取尚未提交的快照，并在删楼后继续停留于假状态。
  let 待广播失败原因: string | null = null;
  let 失败残稿 = '';
  try {
    // 已取得进行中互斥:先清上一次 deleteChatMessages 失败/宿主重建遗留的临时回合楼
    // (幂等,零命中零写入);删除失败向上抛,由 catch 发回合失败、finally 释放互斥,
    // 绝不带着遗留楼开始下一轮。
    await 恢复遗留临时回合楼();
    const 流式边界 = 当前预设流式边界();
    正文流式预期标签 = 流式边界.期望正文标签;
    正文流式等待思维闭标签 = 流式边界.等待思维闭标签;
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
    回合基准data = _.cloneDeep(data) as SchemaType;
    const 回合起始场景 = 读场景().房间id ?? '';
    const 确认回合场景未变化 = (消息: string): void => {
      if ((读场景().房间id ?? '') !== 回合起始场景) throw new Error(消息);
    };
    const 场景剧情位置 = 校验场景剧情位置(data, 回合起始场景);
    if (!场景剧情位置.成功) {
      eventEmit('人妻公寓:回合失败', 场景剧情位置.提示);
      return false;
    }
    本轮静音会议 = 静音会议正式运行中(data);
    // 强制事件、特殊场景控制拍与系统触发回合不占玩家日常行动资源；普通现场输入才计费。
    // 此处只做生成前权限门，真正扣除必须等有效正文成功落楼后进行。
    const 本轮资源计费 =
      选项.资源计费 !== false &&
      !读取活动场景剧情(data) &&
      !data.系统._特殊场景.id &&
      data.系统._荣耀洞拍 < 0;
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
    // 当前尾楼自身可能仍在等待 MVU 继承，容器中的 stat_data 不能作为真值；保留其余
    // MVU 元数据，但显式覆盖为上面已经回退并通过结构闸门的完整 data。
    const 旧 = 构造临时楼继承容器(
      (Mvu.getMvuData({ type: 'message', message_id: -1 }) ?? {}) as Record<string, unknown>,
      data,
    ) as Mvu.MvuData;
    捕获保护快照(data); // 回滚基准(含镜像取大并入)
    const 对话尾 = 近楼对话(行动);
    const 本轮数据库已安装 = 数据库状态().已装游戏模板;
    let 本轮数据库时间线可用 = false;
    if (本轮数据库已安装) {
      eventEmit('人妻公寓:运行阶段', '数据库正在核对当前时间线');
      本轮数据库时间线可用 = await 等待数据库时间线就绪();
      确认本轮事务有效();
      eventEmit(
        '人妻公寓:运行阶段',
        本轮数据库时间线可用 ? '数据库正在读取长期记忆' : '数据库仍在恢复，本轮跳过长期记忆',
      );
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
    确认回合场景未变化('正文生成期间玩家场景已经变化，本轮不会把剧情和结算写到另一个地点。');
    const 本轮事件冻结 = 冻结本轮事件(data, 生成楼层, 持续人物数);
    const 当前场景剧情事务ID = 选项.场景剧情事务ID ?? '';
    const 当前剧情场景 = 回合起始场景;
    const 普通活动场景剧情 = 读取活动场景剧情(data);
    if (普通活动场景剧情) {
      const txn = 普通活动场景剧情;
      if (!当前场景剧情事务ID || 当前场景剧情事务ID !== txn.id) {
        throw new Error(`「${txn.标题 || '当前场景剧情'}」尚未完成，请使用场景中的“重试本段剧情”，不要用新的行动改写它。`);
      }
      if (选项.场景剧情请求世代 !== txn.请求世代) {
        throw new Error('场景剧情请求世代已经变化，旧生成结果不能认领当前重试。');
      }
      if (!场景剧情目标匹配(txn.目标场景, 当前剧情场景)) {
        throw new Error(`「${txn.标题 || '当前场景剧情'}」必须在原定场景继续，当前地点不对。`);
      }
      if (!本轮事件冻结.内容 || 本轮事件冻结.内容 !== txn.内容) {
        throw new Error('活动场景剧情与待演票据已经不一致，为避免串戏，本轮已停止。');
      }
    } else if (
      本轮事件冻结.来源 === '待发送' &&
      本轮事件冻结.内容 &&
      !data.系统._特殊场景.id &&
      data.系统._荣耀洞拍 < 0
    ) {
      throw new Error(
        `「${场景剧情可见标题(本轮事件冻结.内容)}」正在等待设计场景，请从游戏界面的剧情提示开始，不能用普通行动触发。`,
      );
    }
    const 本楼事件 = 本轮事件冻结.内容;
    const 演出data = 构造入住登场演出态(data, 本楼事件, 生成楼层);
    const {
      快照,
      焦点,
      妻在场,
      夫在场,
      尺度模式,
      变量范围: 初始变量范围,
      快照刷新票,
    } = await 组快照注入(对话尾, 演出data, 生成楼层, 回合前末楼, 本楼事件, 本轮事务仍有效);
    确认本轮事务有效();
    // let 声明：稽查事后补亲密妻时可扩展（见稽查块后）
    let 变量范围 = 初始变量范围;
    const 本轮有可写演员 = 变量范围.妻.length > 0 || 变量范围.夫.length > 0;
    // 每回合重新读取一次：玩家可能刚在 MVU 面板切换更新方式。v0.80 的正文模型始终
    // 退出变量处理；即使外部面板被改到非外置模式，也不能重新启用已退役的正文变量路线。
    const MVU解析 = 读取MVU解析状态();
    const 使用MVU外置解析 = MVU解析.外置模式;
    const 正文模型覆盖 = { chat_history: { with_depth_entries: false } };
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
      '严禁重演、复述或把本次正文写成对任何旧行动的回应;若历史楼层存在行动与回应错位,一律以本条为准。)';
    // 正文模型只负责故事与游戏控制协议；RQ_剧情事件的语义摘要改由数据库填表 AI 在同一批次完成。
    const injects: Omit<InjectionPrompt, 'id'>[] = [
      { role: 'system', content: 快照 + 行动锚, position: 'in_chat', depth: 0, should_scan: true },
    ];
    if (选项.系统注入?.trim()) {
      injects.push({ role: 'system', content: 选项.系统注入, position: 'in_chat', depth: 0, should_scan: false });
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
              extra: { [回合令牌键]: 本回合消息令牌, [回合角色键]: 'user', [临时楼标记键]: true },
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
    正文流式生成id = 本回合生成id;
    正文流式原文 = '';
    let 原文: string;
    try {
      原文 = await 等待正文生成(
        {
          user_input: 行动,
          should_stream: true,
          injects,
          overrides: 正文模型覆盖,
          generation_id: 本回合生成id,
        },
        {
          // 回档重建或迟到 SQL 补偿尚未落定时，官方数据库规划同样必须停用；只停本卡
          // 记忆胶囊仍会让插件自己的召回钩子读到旧分支运行态。
          启用数据库规划: 本轮数据库已安装 && 本轮数据库时间线可用,
          规划输入: 构造数据库剧情规划输入(行动, {
            日期: `第${当前天数(演出data)}天`,
            时段: 当前时段(演出data),
            地点: 回合起始场景 || '公寓公共区域',
            当前角色: _.uniq([
              ...妻在场.map(m => 户静态表[m]?.妻名),
              ...夫在场.map(m => 户静态表[m]?.夫名),
            ]).filter((名字): 名字 is string => Boolean(名字)),
            焦点角色: 焦点.map(m => 户静态表[m]?.妻名).filter((名字): 名字 is string => Boolean(名字)),
          }),
          规划开始: () => eventEmit('人妻公寓:运行阶段', '数据库正在进行时间召回'),
          正文开始: () => eventEmit('人妻公寓:运行阶段', 'AI正在生成正文'),
          继续前确认: 确认本轮事务有效,
        },
      );
    } catch (生成错误) {
      确认本轮事务有效();
      // 看门狗说明正文连接已经长期无进展；不能把半截场景伪装成成功回合，但仍保留给玩家查看。
      if (生成错误 instanceof Error && 生成错误.message.startsWith(正文生成超时错误前缀)) {
        失败残稿 = 提取正文舞台文本(应用酒馆最终显示正则(正文流式原文));
        throw 生成错误;
      }
      const 完整流式正文 = 生成失败时可保留的流式正文(正文流式原文, 提取可提交正文);
      if (!完整流式正文) {
        失败残稿 = 提取正文舞台文本(应用酒馆最终显示正则(正文流式原文));
        throw 生成错误;
      }
      console.warn('[人妻公寓] generate 最终 Promise 失败，但同 generation_id 已收到完整流式正文；保留正文继续结算');
      原文 = 完整流式正文;
    }
    确认本轮事务有效();
    const 最终返回原文 = 原文;
    原文 = 选择正文生成原文(最终返回原文, 正文流式原文, 提取可提交正文);
    const 采用流式正文 = 原文 !== 最终返回原文;
    if (采用流式正文) {
      const 最终控制尾段 = 提取纯控制协议尾段(最终返回原文);
      const 最终尺度块 = 取尺度判定块(最终控制尾段);
      if (最终尺度块 && !原文.includes(最终尺度块)) 原文 = `${原文}\n${最终尺度块}`;
      console.warn('[人妻公寓] generate 最终返回未含有效正文，采用同 generation_id 的完整流式结果');
    }
    正文流式生成id = '';
    正文流式原文 = '';
    确认回合场景未变化('正文生成期间玩家场景已经变化，本轮不会把剧情和结算写到另一个地点。');

    // 流式中间帧继续即时呈现；完整回复确定后，酒馆最终显示正则只决定玩家可见文本。
    // 稽查、成功提交与机器协议仍读取原始回复，任何显示美化都不能反向改写业务事实。
    let 最终显示原文 = 应用酒馆最终显示正则(原文);

    // ── 稽查前移：必须审首稿，不能等独立变量结算把临时尺度块清掉后才审 ──
    const 焦点妻们 = 焦点.filter(m => 妻在场.includes(m));
    const 焦点妻门牌 = 焦点妻们[0];
    const 阶段表 = Object.fromEntries(焦点妻们.map(m => [m, data.户[m]?.妻.当前阶段 ?? 0])) as Partial<
      Record<门牌, number>
    >;
    // 脚本自己导演的晋阶/特殊正戏已经有独立许可，不再被普通阶段上限二次拦截。
    const 正戏免检 = /【特殊场景·|【转折正戏】|【药物首夜】|【早饭桌】|【破墙】/.test(本楼事件);
    let 稽查: 稽查结果 = 输出稽查(
      原文,
      焦点妻们,
      阶段表,
      尺度模式,
      正戏免检,
      提取可提交正文(原文),
    );

    if (稽查.状态 === '需重写' && 焦点妻门牌) {
      // 首稿已经作废，重写稿只重新生成故事与尺度判定。
      console.warn(`[人妻公寓·稽查] 首稿需静默重写：${稽查.原因}`);
      eventEmit('人妻公寓:运行阶段', '正在校准角色反应');
      const 校准令 =
        `${快照}${行动锚}${选项.系统注入?.trim() ? `\n${选项.系统注入}\n` : ''}\n` +
        `【本轮重写硬裁决】上一稿作废。脚本复核发现：${稽查.原因}。` +
        '保持玩家原始行动不变，重写完整剧情回应；允许界线内部分自然发生，越过每位角色当前界线的部分必须由她按自身性格拒绝、停住或转开，未遂不得写成已经发生。' +
        '不要提到稽查、等级、规则、重写或系统。仍须按上方格式输出临时尺度判定；不要输出 UpdateVariable、JSONPatch 或任何变量命令，变量由外置解析单独处理。';
      本回合生成id = `rqgy-audit-${回合前末楼}-${_.random(1e9)}`;
      const 重写 = await 等待正文生成({
        user_input: 行动,
        should_stream: false,
        automatic_trigger: true,
        injects: [{ role: 'system', content: 校准令, position: 'in_chat', depth: 0, should_scan: false }],
        overrides: 正文模型覆盖,
        generation_id: 本回合生成id,
      });
      确认本轮事务有效();
      const 重写显示原文 = 应用酒馆最终显示正则(重写);
      const 重写稽查 = 输出稽查(
        重写,
        焦点妻们,
        阶段表,
        尺度模式,
        正戏免检,
        提取可提交正文(重写),
      );
      if (重写稽查.状态 === '通过') {
        原文 = 重写;
        最终显示原文 = 重写显示原文;
        稽查 = 重写稽查;
      } else {
        // 第二次仍不可靠：本地收束为角色拒绝。玩家输入不改、数值不罚、不会再调用模型循环。
        console.warn(`[人妻公寓·稽查] 重写仍未通过，启用无处罚兜底：${重写稽查.原因}`);
        原文 = 无处罚拒绝正文(焦点妻门牌);
        最终显示原文 = 原文;
        稽查 = {
          状态: '通过',
          原因: '二次生成失败后使用无处罚拒绝兜底',
          模式: 尺度模式,
          角色: {},
          最高实际等级: Math.min(Math.max(阶段表[焦点妻门牌] ?? 0, 0), 1),
        };
      }
    }

    确认回合场景未变化('正文生成期间玩家场景已经变化，本轮不会把剧情和结算写到另一个地点。');

    // 稽查事后补亲密妻(2026-08-04 堕落涨值修复):
    // 正则只能命中"她/他"或已知名字，玩家用昵称/自称时可能漏判亲密场景→堕落写门未开。
    // 稽查结果是读懂剧情的模型自报的，实际等级≥1 意味着本轮确实发生了暧昧/亲密——
    // 此时把有实际互动的焦点妻补入亲密妻，让守护系统放行堕落字段。
    // v0.80 两段式写权：两条外置解析路线都按最终被采纳的稽查逐角色结果扩展精确范围。
    // 本地拒绝兜底的角色:{}、实际 0、无有效正文都不新增
    // 权限；首稿作废后按重写稿/兜底的最终稽查为准，不沿用首稿权限。
    // 安全边界不受影响：±3/轮 全回滚、每日+8、线路门、阶段底线均在守护层强制执行。
    if (稽查.状态 === '通过' && 稽查.角色) {
      const 逐角色实际 = Object.fromEntries(
        Object.entries(稽查.角色).map(([门牌号, 项]) => [门牌号, 项?.实际 ?? 0]),
      ) as Record<string, number>;
      const 扩展后范围 = 扩展精确亲密妻(变量范围, 逐角色实际);
      const 新增亲密妻 = 扩展后范围.亲密妻.filter(m => !变量范围.亲密妻.includes(m));
      if (新增亲密妻.length) {
        变量范围 = 扩展后范围;
        console.info(`[人妻公寓·稽查补亲密] 最终尺度实际≥1，补入亲密妻：${新增亲密妻.join(',')}`);
      }
    }

    确认本轮事务有效();

    // ── 正常路径：玩家可见文本与业务成功正文分门判定 ──
    // 显示门只移除游戏机器协议与通用 HTML 外壳，允许失败残稿保留；成功门另外剥除思维链，
    // 只有成功正文非空时才允许创建正式楼、解析变量、提交任务、扣资源或写数据库骨架。
    const 正文判定 = 判定正文提交(最终显示原文, 提取正文舞台文本, 提取可提交正文, 原文);
    const 可提交正文 = 正文判定.成功正文;
    if (!正文判定.可提交) {
      失败残稿 = 正文判定.失败残稿;
      if (本轮静音会议) throw new Error('AI 没有返回有效正文——本拍未推进，请直接重试');
      if (事件必须有正文(本楼事件)) {
        throw new Error('AI 没有返回有效的剧情正文——待演事件已保留，请直接重试');
      }
      if (选项.成功结算) throw new Error('AI 没有返回有效正文——楼务任务没有提交，请重新点击任务瓷砖');
      throw new Error('AI 输出没有形成可提交正文——未完成内容已保留供你查看，本轮没有发生');
    }
    const 基础正文 = 正文判定.显示正文;
    // 正文楼永远只落故事；正文模型偶然输出的变量协议也不采纳，随后由外置模型生成唯一有效变量块。
    let 变量块 = '';
    let 可重处理楼层正文 = 变量块 ? `${基础正文}\n${变量块}` : 基础正文;
    let 解析基准 = _.cloneDeep(Mvu.getMvuData({ type: 'message', message_id: -1 }) ?? 旧) as Mvu.MvuData;
    const 入住预约 = 识别入住登场预约(本楼事件);
    const 入住事件将提交 =
      !!入住预约 && 本轮事件可提交(本轮事件冻结, data.系统._待发送事件, 生成楼层, Boolean(可提交正文));
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
              extra: {
                [回合令牌键]: 本回合消息令牌,
                [回合角色键]: 'assistant',
                [临时楼标记键]: true,
                [回合在场妻键]: [...new Set(妻在场)],
                [数据库事件元数据键]: {
                  版本: 1,
                  时间: 格式化游戏内时间(data),
                  地点: 回合起始场景 || '公寓公共区域',
                  参与者: [
                    ...妻在场.map(m => 户静态表[m]?.妻名),
                    ...夫在场.map(m => 户静态表[m]?.夫名),
                  ].filter((name): name is string => Boolean(name)),
                  玩家行动: 行动,
                } satisfies 数据库事件元数据,
              },
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
    // AI 变量候选只是正文之上的可降级增强。先冻结一份已经通过 Schema 校验、且包含
    // 入住演出态/并发电话合并的可信基准；候选解析器即使原地污染参数后抛错也碰不到它。
    const 变量失败回退基准 = _.cloneDeep(解析基准) as Mvu.MvuData;
    const 降级AI变量解析 = async (阶段: string, 错误: unknown): Promise<void> => {
      确认本轮事务有效();
      变量解析已降级 = true;
      变量解析降级阶段 = 阶段;
      console.error(`[人妻公寓] ${阶段}变量解析失败，降级到可信解析基准，正文继续保留：`, 错误);
      解析基准 = _.cloneDeep(变量失败回退基准) as Mvu.MvuData;
      变量块 = '';
      可重处理楼层正文 = 基础正文;
      const 当前临时正文 = getChatMessages(临时助手楼层!).at(-1)?.message ?? '';
      if (当前临时正文 !== 基础正文) {
        await setChatMessages([{ message_id: 临时助手楼层!, message: 基础正文 }], { refresh: 'none' });
        确认本轮事务有效();
      }
    };

    // refresh:'none' 不会发 MESSAGE_RECEIVED，因而 MVU 的自动监听不会自行运行。
    // 内置解析(游戏开关,默认开)由引擎直接调用解析模型,回合内同步拿到变量块；玩家关掉
    // 内置解析时改走 MVU 当前官方外置桥。两条现行路线都不要补发 MESSAGE_RECEIVED，否则双请求。
    let 内置解析变量块已就绪 = false;
    let 官方外置变量块需本地应用 = false;
    if (!本轮静音会议 && 使用MVU外置解析 && MVU解析.内置解析 && 本轮有可写演员) {
      console.info('[人妻公寓] 内置变量解析启动(复用 MVU 外置模型接口参数)');
      eventEmit('人妻公寓:运行阶段', '正在结算本轮变量');
      try {
        const 可写视图 = 构造AI可写变量视图(_.get(解析基准, 'stat_data'), 变量范围);
        let 内置变量块: string | null = null;
        let 未配置 = false;
        for (let 次 = 1; 次 <= 2 && !内置变量块; 次++) {
          if (次 === 2) console.warn('[人妻公寓] 内置变量解析首次未产出变量块，重试一次');
          const 结果 = await 内置外置变量解析({ 行动, 正文: 基础正文, 快照, 可写视图, 回合前末楼 });
          确认本轮事务有效();
          if (结果.结果 === '未配置') {
            // 没有任何可用的外置解析模型：保留正文与旧值，只提示一次，不进入重试，
            // 也绝不调用正文 API。
            未配置 = true;
            eventEmit(
              '人妻公寓:提示',
              '没有可用的外置变量模型。请在游戏设置 → 变量解析中填写自定义 API；本轮正文已保留，变量暂不更新。',
            );
            break;
          }
          if (结果.结果 === '成功') 内置变量块 = 结果.变量块;
        }
        if (内置变量块) {
          变量块 = 内置变量块;
          可重处理楼层正文 = `${基础正文}\n${变量块}`;
          内置解析变量块已就绪 = true;
          await setChatMessages([{ message_id: 临时助手楼层, message: 可重处理楼层正文 }], { refresh: 'none' });
          确认本轮事务有效();
          console.info('[人妻公寓] 内置变量解析完成');
        } else if (未配置) {
          // 未配置:不调用任何模型,保留正文与旧变量,等待玩家在设置页配置独立模型;
          // 不 throw(那会触发双临时楼全删+快照回滚=正文消失)。
          console.info('[人妻公寓] 没有可用的外置变量模型，本轮保留正文与旧变量');
        } else {
          // 失败链:已重试一次仍无果→保留正文与旧值,本轮不更新,绝不改用正文模型,
          // 也绝不 throw(那会触发双临时楼全删+快照回滚=正文消失)。只提示一次本轮结果,
          // 不再记跨轮待补(避免串角色/时间线),玩家可手动重试本回合。
          eventEmit('人妻公寓:提示', '本轮变量解析失败，数值未更新；可重试本回合');
          console.warn('[人妻公寓] 内置变量解析两次均未产出变量块；本轮保留正文与旧值');
        }
      } catch (e) {
        // 事务失效会在降级入口重新抛出交给外层回滚；其余异常降级=回到可信基准保留旧值。
        await 降级AI变量解析('内置变量', e);
      }
    } else if (!本轮静音会议 && 使用MVU外置解析 && MVU解析.自动请求 && 本轮有可写演员) {
      console.info('[人妻公寓] 调用 MVU 官方外置模型解析');
      eventEmit('人妻公寓:运行阶段', 'MVU外置模型正在解析变量');
      try {
        // 官方外置桥触发前重建最终精确视图：正文前写入的旧 _整表视图是预判结果，外置模型
        // 不能继续读它。此刻 扩展精确亲密妻 已按最终被采纳正文的逐角色实际>=1 把参与妻并入
        // 变量范围.亲密妻，同步不再传候选第五参——记录与视图都只消费该精确范围，实际=0 的
        // 候选妻不再暴露堕落/身体开发叶；最终提交仍只认守护层按精确范围授出的写权。
        await 同步整表视图(_.get(解析基准, 'stat_data'), 本轮事务仍有效, 变量范围, 生成楼层);
        确认本轮事务有效();
        await eventEmit('人妻公寓:MVU外置模型重试');
        确认本轮事务有效();
        // 跨脚本事件桥不保证等到 MVU 外置生成真正完成(2026-08-04 玩家实测:自动解析后
        // 好感值没更新,手动点"重试额外模型解析"才生效——引擎读楼读早了,拿着回合前
        // 数据提交,MVU 迟到的结果被覆盖)。以"楼层变量相对回退基准发生变化"或"楼层
        // 出现完整变量块"为完成信号轮询等待；合法空补丁也代表解析已经完成，不应白等超时。
        const 外置解析截止 = Date.now() + 外置解析等待毫秒;
        const 外置解析基准stat = _.cloneDeep(_.get(变量失败回退基准, 'stat_data'));
        let 外置后正文 = getChatMessages(临时助手楼层).at(-1)?.message ?? 可重处理楼层正文;
        let 外置后数据 = Mvu.getMvuData({ type: 'message', message_id: 临时助手楼层 });
        while (
          Date.now() < 外置解析截止 &&
          !取变量块(外置后正文) &&
          (!外置后数据 ||
            _.get(外置后数据, 'stat_data') === undefined ||
            _.isEqual(_.get(外置后数据, 'stat_data'), 外置解析基准stat))
        ) {
          await new Promise(resolve => setTimeout(resolve, 500));
          确认本轮事务有效();
          外置后正文 = getChatMessages(临时助手楼层).at(-1)?.message ?? 可重处理楼层正文;
          外置后数据 = Mvu.getMvuData({ type: 'message', message_id: 临时助手楼层 });
        }
        变量块 = 取变量块(外置后正文) ?? '';
        // 外置模型只负责变量，不拥有正文。即使插件把消息改成空串或纯变量协议，
        // 也必须用已经验证的基础正文重新拼回，杜绝解析失败反向抹掉剧情。
        可重处理楼层正文 = 变量块 ? `${基础正文}\n${变量块}` : 基础正文;
        let 外置stat: unknown = _.get(变量失败回退基准, 'stat_data');
        if (外置后数据) {
          外置stat = _.get(外置后数据, 'stat_data');
          if (外置stat === undefined) throw new Error('MVU 外置模型没有返回 stat_data');
          Schema.parse(外置stat);
          解析基准 = _.cloneDeep(外置后数据);
        }
        // 官方插件通常已经把标准 JSONPatch 写入 stat_data；但 Gemini 漏掉内层标签时，
        // 插件可能只把原文写回消息而没有应用补丁。规范器已补齐双层块，这里逐项核对
        // replace 最终值，只有尚未落地的补丁才在最新外置数据上本地应用一次。
        官方外置变量块需本地应用 = Boolean(变量块 && 标准变量块需要本地应用(变量块, 外置stat));
        if (官方外置变量块需本地应用) {
          console.warn('[人妻公寓] MVU 外置模型返回了未落地的标准变量块，已切换为本地幂等应用');
        }
        if (外置后正文 !== 可重处理楼层正文) {
          await setChatMessages([{ message_id: 临时助手楼层, message: 可重处理楼层正文 }], { refresh: 'none' });
          确认本轮事务有效();
        }
        if (变量块 || !_.isEqual(解析基准, 变量失败回退基准)) {
          console.info('[人妻公寓] MVU 外置模型变量解析完成');
        } else {
          console.warn('[人妻公寓] MVU 外置模型未产生可解析变量；请检查 MVU 更新方式、自动解析配置和日志');
        }
      } catch (e) {
        await 降级AI变量解析('MVU外置模型', e);
      }
    } else if (!本轮静音会议 && 使用MVU外置解析 && !MVU解析.自动请求 && 本轮有可写演员) {
      console.info('[人妻公寓] MVU 外置模式已选择，但自动请求已关闭；本轮等待玩家手动重试外置解析');
    }

    // 最终提交可能晚于手机接听或挂断。保留正文真正开始解析时的状态，供提交点把电话分支
    // 相对该基准产生的原子增量三方并入，而不是用最新整表覆盖正文自己的合法结算。
    const 父亲电话正文基准 = 本轮静音会议
      ? (_.cloneDeep(data) as SchemaType)
      : (Schema.parse(_.get(变量失败回退基准, 'stat_data') ?? {}) as SchemaType);
    // 官方外置桥通常已经完成“生成变量块 → parse → 写回该楼”，不得无条件再解析；
    // 只有游戏内置解析的新块，或官方桥只写回协议文本却未把标准 replace 补丁落入 stat_data
    // 时，才在最新解析基准上走一次本地 parseMessage。标准协议拒绝 add/remove，重放 replace 幂等。
    let 新 = _.cloneDeep(解析基准) as Mvu.MvuData;
    let newStat: SchemaType;
    let 守护结果: ReturnType<typeof 回滚保护字段> | undefined;
    let 变量重生成原AI结果: 变量重生成AI结果快照 | null = null;
    let 变量重生成派生票据: 变量重生成派生票据 | null = null;
    let 变量重生成风闻票据: 变量重生成风闻票据 | null = null;
    const 本轮微信联系保护 = 当前微信联系保护表();
    if (本轮静音会议) {
      // 静音会议是脚本全权管理的隔离层：即使模型仍输出隐藏变量命令，也不能让解析结果
      // 成为本轮真值。以生成前的已验证状态为唯一基底，之后只允许脚本固定结算。
      newStat = _.cloneDeep(data) as SchemaType;
      守护结果 = undefined;
    } else {
      try {
        if ((内置解析变量块已就绪 || 官方外置变量块需本地应用) && !变量解析已降级) {
          const 候选基准 = _.cloneDeep(解析基准) as Mvu.MvuData;
          新 = ((await Mvu.parseMessage(可重处理楼层正文, 候选基准)) ?? 候选基准) as Mvu.MvuData;
        }
        确认本轮事务有效();
        newStat = Schema.parse(_.get(新, 'stat_data') ?? {}) as SchemaType;
        守护结果 = 回滚保护字段(newStat, 焦点, 变量范围, 生成楼层, _.get(新, 'stat_data'));
      } catch (e) {
        await 降级AI变量解析(内置解析变量块已就绪 ? '内置变量' : 使用MVU外置解析 ? 'MVU外置模型' : '变量基准', e);
        // 内置解析的块在本地 parse/校验阶段被打回同样算失败,走统一降级提示,不重复弹近义消息。
        新 = _.cloneDeep(变量失败回退基准) as Mvu.MvuData;
        newStat = Schema.parse(_.get(新, 'stat_data') ?? {}) as SchemaType;
        守护结果 = 回滚保护字段(newStat, 焦点, 变量范围, 生成楼层, _.get(新, 'stat_data'));
      }
    }
    if (!本轮静音会议 && 本轮有可写演员) {
      // 在任何确定性回合结算之前冻结模型结果。以后重新生成时，当前真值与这份结果之间的
      // 差异全部视为脚本结算/回合后操作并保留，只替换真正属于 AI 的那一部分。
      变量重生成原AI结果 = 提取变量重生成AI结果(newStat, 变量范围);
      变量重生成派生票据 = {
        当前绝对时段: newStat.系统._绝对时段,
        母亲入列: newStat.系统._母亲入列,
        微信联系保护: _.cloneDeep(本轮微信联系保护),
        妻: {},
        疑心: {},
      };
    }
    确认回合场景未变化('生成期间场景已经变化，本轮正文不会在错误地点提交。');
    const { 入住预约已提交, 提交后任务: 回合提交后任务 } = 回合结算(
      newStat,
      本轮结算基准,
      焦点,
      妻在场,
      夫在场,
      生成楼层,
      本轮事件冻结,
      Boolean(可提交正文),
      回合起始场景,
      变量重生成派生票据 ?? undefined,
      当前场景剧情事务ID
        ? { id: 当前场景剧情事务ID, 请求世代: 选项.场景剧情请求世代 ?? 0 }
        : undefined,
    );
    const 回合结算后待发送基线 = newStat.系统._待发送事件;
    const 特殊场景id = 本楼事件.match(/【特殊场景·([^·】]+)/)?.[1];
    const 特殊场景 = 特殊场景id ? 查特殊场景(特殊场景id) : undefined;
    推进特殊场景(newStat, 本楼事件);
    if (本轮静音会议) 结算隔离脚本成长(本轮结算基准, newStat);
    if (!本轮静音会议 && 特殊场景?.接入主线 === true) {
      for (const 门牌号 of 特殊场景.参与(newStat as never)) {
        上报阶段线路事件(newStat, { 类型: '特殊场景', 门牌: 门牌号, 标识: 特殊场景.id, 楼层: 生成楼层 });
      }
    }
    if (变量重生成派生票据 && 变量重生成原AI结果) {
      变量重生成派生票据.不可逆反感资格 = {};
      for (const 门牌号 of 妻在场) {
        const 回合前好感 = data.户[门牌号]?.妻.好感值;
        const 原AI好感 = 变量重生成原AI结果.户[门牌号]?.妻?.好感值;
        const 当前好感 = newStat.户[门牌号]?.妻.好感值;
        if (回合前好感 === undefined || 原AI好感 === undefined || 当前好感 === undefined) continue;
        变量重生成派生票据.不可逆反感资格[门牌号] = {
          回合前好感,
          原AI后脚本差值: 当前好感 - 原AI好感,
          原本下降: 当前好感 < 回合前好感,
        };
      }
    }
    const 反感离场: 门牌[] = 本轮静音会议 ? [] : await 结算连续反感(data, newStat, 妻在场, 生成楼层, 本轮事务仍有效);
    确认本轮事务有效();
    let 变量重生成风闻派生前: 变量重生成风闻快照 | null = null;
    if (!本轮静音会议) {
      const 当前绝对时段 = newStat.系统._绝对时段;
      // 余波中的堕落无论来自AI还是后续脚本都冻结；安抚只在本次快照实际注入并成功
      // 落地的正常当面正文楼推进。完成时的成长复位与本楼其他成长聚合成同一轮。
      const 余波冻结门牌 = 冻结全楼余波堕落(本轮结算基准, newStat);
      if (本轮余波目标 && newStat.户[本轮余波目标]) {
        推进余波安抚(newStat.户[本轮余波目标]!.妻, {
          正文楼: 生成楼层,
          当前绝对时段,
          成功主线当面楼: Boolean(可提交正文) && 妻在场.includes(本轮余波目标),
          玩家有效回应: 玩家行动是有效安抚(行动),
        });
      }
      if (变量重生成派生票据) {
        变量重生成派生票据.当前绝对时段 = 当前绝对时段;
        变量重生成派生票据.母亲入列 = newStat.系统._母亲入列;
        for (const [门牌号, 节点] of Object.entries(newStat.户) as [门牌, SchemaType['户'][门牌]][]) {
          const 旧节点 = 本轮结算基准.户[门牌号];
          if (!节点 || !旧节点) continue;
          变量重生成派生票据.妻[门牌号] = {
            回合前: _.cloneDeep(旧节点.妻),
            派生前: _.cloneDeep(节点.妻),
            原派生后: _.cloneDeep(节点.妻),
            独立合法正候选: [],
            余波冻结: 余波冻结门牌.includes(门牌号),
          };
        }
        变量重生成风闻派生前 = 提取变量重生成风闻快照(newStat);
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
      if (变量重生成派生票据) {
        for (const 成长 of 成长结果) {
          const 项 = 变量重生成派生票据.妻[成长.门牌];
          if (!项) continue;
          const AI候选 = new Set(守护结果?.合法正候选?.[成长.门牌] ?? []);
          项.独立合法正候选 = 成长.合法正候选来源.filter(来源 => !AI候选.has(来源));
        }
      }
      const 冷落结果 = 结算全楼冷落(newStat, 本轮微信联系保护);
      if (变量重生成派生票据) {
        for (const [门牌号, 节点] of Object.entries(newStat.户) as [门牌, SchemaType['户'][门牌]][]) {
          const 项 = 变量重生成派生票据.妻[门牌号];
          if (节点 && 项) 项.原派生后 = _.cloneDeep(节点.妻);
        }
      }
      const 有下降 = 冷落结果.filter(项 => 项.实际下降 > 0);
      if (有下降.length) {
        console.info(`[人妻公寓·冷落] ${有下降.map(项 => `${项.门牌}-${项.实际下降}`).join('，')}`);
      }
    }
    const 变量重生成后续风闻调用: { 门牌: 门牌; 档: 攻略风闻档 }[] = [];
    const 资源实际尺度 = Object.fromEntries(
      Object.entries(稽查.角色).flatMap(([门牌号, 项]) => (项 ? [[门牌号, 项.实际]] : [])),
    ) as Partial<Record<门牌, number>>;
    if (变量重生成派生票据) {
      变量重生成派生票据.不可逆身体增长资格 = 现场楼身体增长依赖(newStat, 本轮结算基准, {
        行动,
        本楼事件,
        妻在场,
        实际尺度: 资源实际尺度,
        资源计费: 本轮资源计费 && Boolean(可提交正文),
      });
    }
    const 资源结算 = 结算成功现场楼(newStat, 本轮结算基准, {
      楼层: 生成楼层,
      行动,
      正文: 基础正文,
      本楼事件,
      妻在场,
      实际尺度: 资源实际尺度,
      // 无效正文只落占位楼,不算"有效正文成功落楼",不得扣玩家资源(2026-08-03 审计 M2)
      资源计费: 本轮资源计费 && Boolean(可提交正文),
      记录攻略风闻调用: (门牌号, 档) => 变量重生成后续风闻调用.push({ 门牌: 门牌号, 档 }),
    });
    if (变量重生成派生票据 && 变量重生成风闻派生前) {
      变量重生成风闻票据 = {
        派生前: 变量重生成风闻派生前,
        派生后: 提取变量重生成风闻快照(newStat),
        原回合最终: 提取变量重生成风闻快照(newStat),
        跳过成长风闻: Boolean(特殊场景id),
        后续调用: 变量重生成后续风闻调用,
      };
    }
    const 登门推进 = 推进丈夫登门(newStat, 本楼事件, 回合起始场景 || '管理员室', 回合起始场景);
    同步丈夫登门排期(newStat);
    if (登门推进?.提示 && !登门推进.事件) {
      回合提交后任务.push(() => eventEmit('人妻公寓:提示', 登门推进.提示));
    }
    // 正文请求结束后仍可能停在 MVU/外置变量解析阶段；取消按钮在整个生成态都可用，
    // 因此一次性脚本事务提交紧前必须再看取消旗，不能只依赖前面的生成等待门。
    if (已取消) throw new Error('__RQGY_CANCELLED__');
    确认本轮事务有效();
    确认回合场景未变化('生成期间场景已经变化，本轮正文不会在错误地点提交。');
    if (可提交正文) 提交孕情初见评价(newStat, 快照, 生成楼层);
    if (可提交正文) 提交快照刷新(newStat, 快照刷新票);
    // 这里是回合的提交点。之后会同步结算一次性票据，再异步写回 MVU；关闭生成 id
    // 让迟到的取消点击不再把已经进入提交阶段的事务标成“已取消”。
    允许取消 = false;
    本回合生成id = '';
    if (资源结算.提示) 回合提交后任务.push(() => eventEmit('人妻公寓:提示', 资源结算.提示));
    // 地图硬任务只在有效正文即将落库时提交；失败、取消和重写异常不会先扣资源或消耗任务。
    确认本轮事务有效();
    选项.成功结算?.(newStat);
    // 回合结算之后，丈夫多拍、特殊主线接线或成功回调仍可能产生下一张强剧情。
    // 普通场景下把这些后置新增逐项绑定当前地点，确保下一楼只处理一张票。
    if (!newStat.系统._特殊场景.id && newStat.系统._荣耀洞拍 < 0) {
      绑定新增待发送事件到场景(newStat, 回合结算后待发送基线, 回合起始场景 || null, item =>
        是入住登场事件(item),
      );
    }
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
        确认回合场景未变化('生成期间场景已经变化，本轮正文不会在错误地点提交。');
        // 生成期间手机可能接听、追加回复或完成收尾。正文不拥有电话原子状态的覆盖权，
        // 必须在同一串行租约内重读，以解析基准做三方合并，再执行最终整表替换。
        const 最新raw = 读最近有效stat();
        if (最新raw) 合并最新父亲通话(newStat, Schema.parse(最新raw) as SchemaType, 父亲电话正文基准);
        if (变量重生成风闻票据) 变量重生成风闻票据.原回合最终 = 提取变量重生成风闻快照(newStat);
        _.set(新, 'stat_data', newStat);
        确认本轮事务有效();
        确认回合场景未变化('生成期间场景已经变化，本轮正文不会在错误地点提交。');
        await Promise.resolve(Mvu.replaceMvuData(新 as Mvu.MvuData, { type: 'message', message_id: 临时助手楼层! }));
        确认本轮事务有效();
        捕获保护快照(newStat);
      });
    // 最终可信整表已写入 assistant 楼:当前分支中同令牌的 user/assistant 两楼持久转正
    // (临时标记→false,保留其余 extra)。必须用精确令牌/角色重新定位两条,少任一条就
    // 拒绝转正并走失败清理;转正成功前内存 临时用户已转正 保持 false,任何中途异常都会
    // 让 finally 按精确令牌/引用清掉本轮,不得伪装成功。转正成功后才允许数据库记忆、
    // 世界书同步、UI 广播等可选/派生副作用——之后它们失败也不得反向删除已核心提交的正式回合。
    const 持久转正本轮临时楼 = async (): Promise<void> => {
      确认本轮事务有效();
      const 消息表 = SillyTavern.chat ?? [];
      const 命中 = 定位本轮临时楼(消息表, 本回合消息令牌, [
        { 楼层: 临时用户楼层, 引用: 临时用户消息引用, 角色: 'user' },
        { 楼层: 临时助手楼层, 引用: 临时助手消息引用, 角色: 'assistant' },
      ]);
      校验转正候选(消息表, 本回合消息令牌, 命中);
      // 批量写入保留每条已有 extra,只更新临时标记为 false。新版宿主用 saveChat 无刷新硬保存；
      // 旧宿主没有该接口时由酒馆助手 refresh:'all' 先同步保存再重载，随后仍按令牌/角色复核。
      await 持久写入转正标记(
        构造转正更新负载(消息表, 命中),
        setChatMessages,
        读取立即持久保存宿主聊天(),
      );
      确认本轮事务有效();
      const 复核表 = SillyTavern.chat ?? [];
      const 复核命中 = 定位本轮临时楼(复核表, 本回合消息令牌, [
        { 楼层: 临时用户楼层, 引用: 临时用户消息引用, 角色: 'user' },
        { 楼层: 临时助手楼层, 引用: 临时助手消息引用, 角色: 'assistant' },
      ]);
      if (
        复核命中.length !== 2 ||
        复核命中.some(项 => 复核表[项.楼层]?.extra?.[临时楼标记键] !== false)
      ) {
        throw new Error('转正失败：宿主持久保存后临时标记复核不通过');
      }
    };
    if (选项.已持MVU操作租约) await 提交最终整表();
    else await 排队MVU操作(提交最终整表);
    确认本轮事务有效();
    await 持久转正本轮临时楼();
    // 持久转正已成功:此后可选/派生副作用失败不得反向删除已核心提交的正式回合。
    临时用户已转正 = true;
    for (const 任务 of 回合提交后任务) {
      if (!本轮事务仍有效()) {
        console.warn('[人妻公寓] 核心回合已提交，但时间线已经变化；跳过当前聊天的软消费旗后处理。');
        break;
      }
      try {
        await 任务();
      } catch (error) {
        console.warn('[人妻公寓] 核心回合已提交，但场景剧情软消费旗后处理失败:', error);
      }
    }
    if (入住预约已提交) {
      await 同步入住世界书条目(newStat, 本轮事务仍有效);
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
          ...(变量重生成原AI结果 && 变量重生成派生票据 && 变量重生成风闻票据
            ? {
                变量重生成: {
                  版本: 2,
                  聊天ID: 当前聊天ID(),
                  助手楼层: 生成楼层,
                  回合令牌: 本回合消息令牌,
                  行动,
                  快照,
                  焦点: [...焦点],
                  变量范围: _.cloneDeep(变量范围),
                  解析基准: Schema.parse(_.get(变量失败回退基准, 'stat_data') ?? {}) as SchemaType,
                  原AI结果: _.cloneDeep(变量重生成原AI结果),
                  派生票据: _.cloneDeep(变量重生成派生票据),
                  风闻票据: _.cloneDeep(变量重生成风闻票据),
                } satisfies 变量重生成上下文,
              }
            : {}),
        } satisfies 上次回合记录);
        _.set(vars, '_上次隔离回合', null);
        _.set(vars, '_行动选项', []);
        _.set(vars, '_地图轨迹', []);
        return vars;
      },
      { type: 'chat' },
    );
    确认本轮事务有效();

    const CG亲密 = 构造CG亲密上下文(本轮结算基准, newStat, 资源结算.性爱结束);
    const CG门牌 = CG亲密.主焦点门牌 ?? 焦点妻门牌 ?? null;
    eventEmit('人妻公寓:CG回合信号', {
      门牌: CG门牌,
      行为等级: CG门牌 ? (稽查.角色[CG门牌]?.实际 ?? 稽查.最高实际等级) : 稽查.最高实际等级,
      正文,
      行动,
      事件: 本楼事件,
      楼层: 生成楼层,
      亲密: CG亲密,
      variant: CG门牌 ? (应使用怀孕CG(newStat, CG门牌) ? 'pregnancy' : 'normal') : 'normal',
    });
    if (变量解析已降级) {
      eventEmit('人妻公寓:提示', `正文已保留；${变量解析降级阶段 || 'AI'}变量本轮未更新，脚本结算已正常完成。`);
    }
    回合完成已广播 = true;
    eventEmit('人妻公寓:回合完成');
    // 占位楼没有真实剧情，不建数据库骨架。有效正文先让前台成功收口；SQLite 骨架、
    // 旧漏楼补齐和数据库 AI 自动填表全部放到下一任务拍，绝不再占住“内容正在生成”。
    if (可提交正文 && 本轮数据库已安装) {
      const 数据库后处理仍有效 = () => {
        const 消息 = SillyTavern.chat?.[生成楼层];
        return (
          本轮时间线仍有效() &&
          消息?.extra?.[回合令牌键] === 本回合消息令牌 &&
          消息.extra[回合角色键] === 'assistant' &&
          消息.extra[临时楼标记键] === false
        );
      };
      安排数据库回合后处理({
        楼层: 生成楼层,
        data: newStat,
        地点: 回合起始场景 || '公寓公共区域',
        行动,
        妻在场,
        夫在场,
        提交校验: 数据库后处理仍有效,
      });
    }
    return true;
  } catch (e) {
    if (临时用户已转正) {
      // 正文、最终 MVU 与两条正式楼已经原子提交。此后的世界书、整表视图、聊天软账、
      // 数据库记忆或广播都只是后处理；它们失败时绝不能把已发生的回合伪报成“没有发生”，
      // 更不能诱导场景剧情调用方重新执行同一业务。
      console.error('[人妻公寓] 核心回合已提交，后处理失败但本轮仍按成功收口:', e);
      待广播失败原因 = null;
      if (!本轮时间线已改变()) {
        eventEmit('人妻公寓:提示', '本轮正文与游戏结算已经保存，但一项后处理没有完成；无需重复本次操作。');
        if (!回合完成已广播) {
          回合完成已广播 = true;
          eventEmit('人妻公寓:回合完成');
        }
      }
      return true;
    }
    if (本轮时间线已改变()) {
      待广播失败原因 = '消息分支已经变化，本轮旧操作未提交。';
    } else if (已取消) {
      待广播失败原因 = '已取消——这一轮没有发生';
    } else {
      console.error('[人妻公寓] 回合执行失败:', e);
      待广播失败原因 = 友好化正文生成错误(e);
    }
    return false;
  } finally {
    if (!临时用户已转正) {
      try {
        // 本轮待删楼一律由纯函数精确定位:登记楼层仍是同一对象→原位;否则按对象引用在
        // 当前 chat 重定位;宿主重建对象导致引用丢失后才按 精确令牌+角色 兜底;定位不到
        // =该消息已不在当前分支,不删除任何同楼替代消息(零删除)。
        // 不得只因正文/行动文本相同而匹配,不得只按登记楼层盲删:MVU 外置模型解析会在
        // “正文已落楼、尚未转正”窗口里自己写/插/删楼(全回合最长的一段),楼层号漂移后
        // 按旧号盲删会删掉现在占据该位置的、属于之前回合的 AI 正文——玩家实测的
        // “外置解析后往事里找不到已经输出完成的正文”正是这条路径。
        const 命中 = 定位本轮临时楼(SillyTavern.chat ?? [], 本回合消息令牌, [
          { 楼层: 临时用户楼层, 引用: 临时用户消息引用, 角色: 'user' },
          { 楼层: 临时助手楼层, 引用: 临时助手消息引用, 角色: 'assistant' },
        ]);
        // 去重并按楼层降序,避免删第一条后第二条移位。
        const 待删 = 临时楼降序楼层(命中);
        if (待删.length) {
          标记数据库时间线将变更(Math.max(0, Math.min(...待删) - 1), '清理失败的临时回合');
          await 内部删除聊天消息(待删);
          await 等待数据库时间线就绪();
        }
      } catch (e) {
        // 删楼失败:消息保留 true 标记与令牌,交给 恢复遗留临时回合楼 在下次启动/下一轮
        // 幂等清理,绝不把消息误标正式;物理楼已删掉时后续恢复扫描必然零命中。
        console.error('[人妻公寓] 清理未完成的临时回合楼层失败(已留给启动/下一轮恢复入口处理):', e);
      }
      if (本轮时间线仍有效() && chat快照) {
        try {
          await 恢复回合变量快照(chat快照, 本轮时间线仍有效);
        } catch (e) {
          if (本轮时间线仍有效()) console.error('[人妻公寓] 恢复失败回合的 chat 变量快照失败:', e);
        }
      }
      if (本轮时间线仍有效() && 回合基准data) 捕获保护快照(回合基准data, false);
    }
    允许取消 = false;
    本回合生成id = ''; // 防回档等无生成的回合被"取消"误伤
    正文流式生成id = '';
    正文流式原文 = '';
    正文流式预期标签 = null;
    正文流式等待思维闭标签 = false;
    if (本轮静音会议) 设置静音会议手机生成中(false);
    标记回合事务结束();
    // 前台生成租约在所有临时楼/变量回滚/事务标记之后幂等释放，手机才允许重新取得；
    // 失败广播必须放在释放之后：同步重试的失败监听器会先看到共享槽已空闲，监听器抛错也不阻塞释放。
    前台租约.释放();
    if (待广播失败原因 !== null) {
      if (!已取消 && 本轮时间线仍有效() && 失败残稿.trim()) eventEmit('人妻公寓:失败残稿', 失败残稿);
      eventEmit('人妻公寓:回合失败', 待广播失败原因);
    }
  }
}

/**
 * 重掷本回合:删掉上一回合创建的楼层(每楼自带 stat_data 快照,变量随楼自动回滚——
 * 固定 0 楼架构红利;晋阶镜像不还原=取大防打回的正字),chat 变量按回合前快照整值恢复,
 * 然后按行动楼的现文本重新执行一回合(玩家可能已用羽笔改写过输入,2026-08-04)。
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
  // 羽笔改写后的重掷必须按改后的输入重演(2026-08-04 玩家实测):行动楼的现文本才是玩家
  // 当前意图,记录.行动 只是落库时的原稿。必须在物理删楼前读取;纯脚本回合没有玩家楼,
  // 或读取失败时,仍按原稿重演。
  let 重演行动 = 记录.行动;
  try {
    await 排队MVU操作(async () => {
      确认重掷仍有效();
      try {
        const 回合楼层 = getChatMessages(`${记录.回合前末楼 + 1}-${末楼}`) ?? [];
        const 行动楼 = 回合楼层.find(消息 => 消息.role === 'user');
        const 现行动 = typeof 行动楼?.message === 'string' ? 行动楼.message.trim() : '';
        if (现行动) 重演行动 = 现行动;
      } catch (e) {
        console.error('[人妻公寓] 读取重掷行动楼失败,按原行动重演:', e);
      }
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

  // 场景强剧情的成功楼被删掉后，MVU 会精确回到“业务已提交、活动票待演”的状态。
  // 普通重演若只带行动文本，会被活动票所有权门拒绝，造成玩家点重掷后停在半途。
  // 这里识别恢复出来的活动票，增加一次请求世代并按原场景事务重演正文；业务绝不重算。
  const 恢复后 = 读取最近有效();
  const 活动剧情 = 恢复后 ? 读取活动场景剧情(恢复后.data) : null;
  if (恢复后 && 活动剧情) {
    const 前台租约 = 取得前台生成租约();
    if (!前台租约) {
      eventEmit('人妻公寓:回合失败', '还有内容正在生成，场景剧情没有开始重演。');
      return;
    }
    let 租约已移交 = false;
    try {
      const 当前场景 = 读场景().房间id ?? null;
      const 重试 = 准备重试场景剧情(恢复后.data, 当前场景);
      if (!重试.成功) {
        eventEmit('人妻公寓:回合失败', 重试.提示);
        return;
      }
      await 排队MVU操作(async () => {
        确认重掷仍有效();
        await 脚本写入(恢复后.raw, 恢复后.data, {
          记录成长: false,
          当前绝对时段: 恢复后.data.系统._绝对时段,
        });
        确认重掷仍有效();
        捕获保护快照(恢复后.data);
      });
      let 重演成功 = false;
      租约已移交 = true;
      try {
        重演成功 = await 执行回合(重试.事务.行动, {
          预占前台生成租约: 前台租约,
          场景剧情事务ID: 重试.事务.id,
          场景剧情请求世代: 重试.事务.请求世代,
        });
      } finally {
        if (!重演成功 && 重掷仍有效()) {
          const 失败后 = 读取最近有效();
          if (
            失败后 &&
            标记场景剧情待重试(失败后.data, 重试.事务.id, 重试.事务.请求世代)
          ) {
            await 排队MVU操作(async () => {
              确认重掷仍有效();
              await 脚本写入(失败后.raw, 失败后.data, {
                记录成长: false,
                当前绝对时段: 失败后.data.系统._绝对时段,
              });
              确认重掷仍有效();
              捕获保护快照(失败后.data);
            });
            eventEmit('人妻公寓:场景剧情状态');
          }
        }
      }
    } finally {
      if (!租约已移交) 前台租约.释放();
    }
    return;
  }

  await 执行回合(重演行动);
}

/**
 * 回档:删掉指定楼层之后的一切。
 * 变量随楼回滚;回合类 chat 变量默认清空(排队于被删时间线,保守清掉最安全);
 * 唯一例外是撤回——目标楼恰为上次成功回合的回合前末楼时,该楼的场景过程态是已知的,
 * 按 _上次回合.chat快照 原位恢复(2026-08-04):否则玩家人还站在垃圾房,_场景 却被清成 null,
 * 舞台残留的旧楼层(如102)记录会显示成"没有识别房间"的错场景;
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
      // 撤回快照必须在删楼前读取:目标楼一旦对不上就退回保守清场,不能拿旧快照冒充。
      const 上次回合 = 读上次回合();
      const 撤回快照 = 上次回合 && 上次回合.回合前末楼 === 楼层 ? 上次回合.chat快照 : undefined;
      // 场景保留(2026-08-04 玩家反馈"回档后聊天框消失"):
      // 协调清场会把 _场景 置 null,玩家被扔进楼道聊天框消失。
      // 删楼前读出当前房间;若进房末楼≤目标楼说明回档后玩家仍在该房间,清场后把
      // 房间id与进房末楼写回(去掉破门/非法进入等一次性标记)。
      // 撤回快照走 恢复回合变量 路径,_场景 会由快照决定,不需要额外写回。
      const 回档前场景 = (() => {
        if (撤回快照) return null; // 快照路径自行恢复
        try {
          const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as
            { 房间id?: string; 进房末楼?: number } | null | undefined;
          if (场景?.房间id && typeof 场景.进房末楼 === 'number' && 场景.进房末楼 <= 楼层) {
            return { 房间id: 场景.房间id, 进房末楼: 场景.进房末楼 };
          }
        } catch {
          /* 读取失败时保守处理:留 null,走楼道 */
        }
        return null;
      })();
      await 内部删除聊天消息(_.range(楼层 + 1, 末楼 + 1));
      已发生物理删楼 = true;
      确认回档仍有效();
      // 撤回是单回合撤销,回到的场景是记录在案的回合起点;晋阶镜像仍作废(回合被整体撤销,
      // 不像重掷那样会原地重演),旧记录同时消费掉,防止已删除回合再被重掷成可执行事务。
      await 协调已删时间线(
        楼层,
        撤回快照 ? { 恢复回合变量: 撤回快照, 清上次回合: true, 作废晋阶镜像: true } : { 作废晋阶镜像: true },
        回档仍有效,
      );
      确认回档仍有效();
      // 清场后补写场景:玩家本来就在该房间,回档后仍在那里
      if (回档前场景) {
        await updateVariablesWith(
          vars => {
            确认回档仍有效();
            _.set(vars, '_场景', 回档前场景);
            return vars;
          },
          { type: 'chat' },
        );
        确认回档仍有效();
      }
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
  '手机在管理员室的值班桌上震动起来的时候,你正在数前任管理员留下的那串钥匙——十六把,每一把都缠着褪色的胶布,门牌号是圆珠笔写的,有几枚已经被手指磨得看不清。桌上摊着住户登记簿和一沓租约复印件,最上面压着 101 的报修单:厨房水管渗漏,日期是两个星期前。手机屏幕就在这些泛黄的纸页中间亮起来,沿着木纹一路震到桌沿。',
  '',
  '来电显示:爸。',
  '',
  '你接起来。那头先是两秒越洋信号的空响,然后是他的声音,还是那种不容你插话的节奏:"东西都交接了?钥匙、账本、报修单,一样一样点清楚。那栋楼是我半辈子的心血,砖是我一块块看着砌起来的,现在归你管。丑话说在前头——房租一分不能少,每期照数打给我;账要清楚,人要认全;楼里要是传出什么闲话,或者租户跑到我这儿来投诉……"',
  '',
  '电话那头顿了顿,你听见他喝了口什么,大概是泡得极浓的茶。杯底磕回桌面,像敲了一记法槌。',
  '',
  '"……你就收拾东西,去你二叔的码头报到。扛包、记磅、看仓库,他那儿常年缺人。我说到做到。"',
  '',
  '你握着钥匙串没吭声。毕业到现在你换过两份工作,每次通话他都只问一句"干得怎么样";这一次,他干脆把半辈子的心血连同警告一起推了过来。楼道里隐约传来油锅的爆响,101 门口的风铃叮了一声;更远一点,102 的方向有人在琴键上轻轻按了两个音,又停住了。十几户人家关起门来的日子,此刻都悬在你手心里这串钥匙上。',
  '',
  '楼上厨房的定时器早就响过了。见你迟迟不上去,妈干脆端着一锅汤下了楼,从你身后经过,往值班桌上摆碗,顺口朝手机的方向喊了一嗓子:"说两句得了啊,饭都要凉了——"又压低声音对你说,"别理他,他就是嘴硬。你刚回来头一天,他电话倒掐着点打。妈给你盛了汤,趁热喝了再忙。"',
  '',
  '"让他先干正事!"父亲在那头听见了,嗓门大了一格,又很快归于公事公办,"信箱里有住户和租约资料,今晚就过一遍。101 报了水管的修,拖了半个月,尽快去看;102 那户也去露个面——人家安安静静的,别让人觉得这楼换了管理员,连个招呼都没有。把人和门牌先认全,记不住就写下来。都是你的事了。"',
  '',
  '他没说再见,他从来不说这两个字。忙音响起来的时候,桌上的汤还在冒热气,妈已经趿着拖鞋上楼去了,楼板在头顶轻轻地响。你把手机扣在登记簿上,钥匙串攥在手心里沉甸甸的——十六把,一把都不能丢。',
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
  let 开局前保护数据: SchemaType | null = null;
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
  const 开局仍属原聊天 = () =>
    开局时间线世代 === 当前时间线切换世代() && 开局聊天ID === 当前聊天ID();
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
      // 后续任一聊天/数据库/保存步骤失败时，序章消息会被精确删除；守护基准也必须同步
      // 回到开局前，否则模块内仍保留“序章已完成/新资金”的幽灵状态，手动变量重处理可能
      // 在下一次正文捕获真值前错误采用它。
      开局前保护数据 = _.cloneDeep(data);
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
          [
            {
              role: 'assistant',
              message: 父亲来电正文,
              data: 新,
              extra: {
                _rqgy开局令牌: 开局消息令牌,
                [数据库事件元数据键]: {
                  版本: 1,
                  时间: 格式化游戏内时间(data),
                  地点: '管理员室',
                  参与者: [],
                  玩家行动: '开始新游戏',
                } satisfies 数据库事件元数据,
              },
            },
          ],
          { refresh: 'none' },
        );
      } finally {
        捕获开局消息();
      }
      确认开局仍有效();
      if (开局消息楼层 !== 开局前末楼 + 1) throw new Error('序章消息没有落在预期楼层');
      捕获保护快照(data);
      await updateVariablesWith(
        vars => {
          确认开局仍有效();
          _.set(vars, '_行动选项', 序章行动选项);
          return vars;
        },
        { type: 'chat' },
      );
      确认开局仍有效();

      console.info(`[人妻公寓] 序章开局完成(难度:${档},起始资金:${难度表[档].起始资金})`);
      开局已提交 = true;
      eventEmit('人妻公寓:回合完成', { 跳过手机节拍: true });
      if (数据库状态().已装游戏模板 && 开局消息楼层 !== null) {
        const 开局数据库后处理仍有效 = () =>
          开局时间线世代 === 当前时间线切换世代() &&
          开局聊天ID === 当前聊天ID() &&
          SillyTavern.chat?.[开局消息楼层!]?.extra?._rqgy开局令牌 === 开局消息令牌;
        安排数据库回合后处理({
          楼层: 开局消息楼层,
          data,
          地点: '管理员室',
          行动: '开始新游戏',
          妻在场: [],
          夫在场: [],
          提交校验: 开局数据库后处理仍有效,
        });
      }
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
      if (开局仍属原聊天()) {
        try {
          await updateVariablesWith(
            vars => {
              if (!开局仍属原聊天()) throw new Error('__RQGY_TIMELINE_CHANGED__');
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
    if (!开局已提交 && 开局前保护数据 && 开局仍属原聊天()) {
      捕获保护快照(开局前保护数据, false);
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
  let 重开核心已提交 = false;
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
            '_手机邀约计划',
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
      // 0 楼出厂 stat 与 chat 清场已经成为当前时间线真值；后面的保护快照、晋阶镜像和
      // 世界书同步都是可重建派生。它们失败时不得把已经完成的重开伪报成未发生。
      重开核心已提交 = true;
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
      return;
    }
    if (重开核心已提交) {
      console.error('[人妻公寓] 重开核心已提交，派生同步失败但仍按已重开收口:', e);
      eventEmit('人妻公寓:提示', '新局核心状态已经保存；页面重新载入后会补齐派生同步。');
      eventEmit('人妻公寓:已重开');
      return;
    }
    console.error('[人妻公寓] 重开一局失败:', e);
    if (已发生物理删楼) {
      try {
        await 排队MVU操作(() => 协调已删时间线(getLastMessageId(), { 作废晋阶镜像: true }, 重开仍有效));
      } catch (恢复错误) {
        console.error('[人妻公寓] 重开删楼后的存活时间线收口失败:', 恢复错误);
      }
    }
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
  } finally {
    标记回合事务结束();
  }
}
