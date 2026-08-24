import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

import { reloadOnChatChange } from '@/util/script';
import {
  内置变量解析等待宿主刷新,
  安排宿主刷新以应用MVU设置,
  确保MVU默认外置解析,
  自动代关MVU自动请求,
  读取MVU解析状态,
} from '../../MVU解析模式';
import { Schema, type SchemaType, 需要迁移MVU存档, 验证当前MVU存档版本 } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 难度表, 首夜差分, 首批门牌, 阶段标题, 查性癖, 查房间, 查特殊场景 } from '../../stageConfig';
import { 使用运作, 催租, 接听来电, 空父亲通话, 捡金币, 空房偷窃, 经济结算, 要钱 } from './经济系统';
import { 强制酒馆助手渲染全部楼层, 恢复酒馆助手渲染楼层 } from './酒馆助手渲染设置';
import { 结算管理任务, 预检管理任务 } from './管理任务系统';
import {
  挂载手机,
  打开手机,
  刷新红点,
  冷落预警节拍,
  同步管理任务微信,
  家庭计划微信已读,
  怀孕确认微信已读凭据,
  预产微信已读凭据,
  手机节拍,
  手机节拍进行中,
  手机AI生成中,
  当前聊天ID,
  当前微信联系保护表,
  来电已接,
  父亲通话已清理,
  隔离当前手机分支,
  手机生成请求标记,
  设置静音会议手机生成中,
  静音会议私聊回复生成中,
} from './手机系统';
import {
  正文租约生效中,
  读当前租约owner,
  读原生正文开始票,
  读原生正文令牌,
  登记原生正文开始票,
  认领正文租约,
  释放正文租约,
  作废原生正文租约,
  租约owner仍有效,
  等待票匹配结束事件,
  重置原生正文租约,
} from './原生正文租约';
import { 排队父亲通话整表写 } from './父亲通话写租约';
import { 全局数据库AI租约 } from './数据库AI租约';
import { 夜访结算, 惰性结算户, 绿帽线检测, 结算焦点疑心, 请求晋阶 } from './结算系统';
import { 打断检测, 换装起疑, 母亲撞见检测, 父亲来电打断 } from './打断系统';
import {
  作废晋阶镜像时间线,
  捕获保护快照,
  回滚保护字段,
  有保护快照,
  清保护快照,
  等待晋阶镜像写入,
  镜像直写,
} from './守护系统';
import {
  布设摄像头,
  查看摄像头,
  考古选细节,
  考古到底,
  母亲来电线索,
  读信揭晓,
  翻垃圾,
  偷窥选细节,
  打听,
  对饮,
  赠礼丈夫,
  type 丈夫礼物,
  type 侦探结果,
} from './侦探系统';
import { 使用荣耀洞, 同一荣耀洞拍仍保留, 荣耀洞当前事件, 荣耀洞结算, 荣耀洞离场, 推进荣耀洞隔离拍 } from './荣耀洞';
import {
  取消隔离事件,
  生成隔离事件草稿,
  写入隔离事件草稿,
  捕获隔离时间线身份,
  复核隔离时间线身份,
  顺序提交隔离事件,
  准备隔离事件事务,
  回滚隔离事件事务,
  确认隔离事务无需隔离,
  撤销已完成隔离事件事务,
  恢复中断隔离提交,
  隔离事件事务键,
  隔离恢复聊天键,
  隔离事件进行中,
  隔离事件请求标记,
  type 隔离事件草稿,
  type 已准备隔离事务,
} from './隔离事件引擎';
import { 准备开启阶段性癖, 提交阶段性癖开幕, 解析阶段性癖开幕事件 } from './性癖系统';
import { 丈夫在楼, 妻位置推算, 当前时段, 读取世界时间 } from './楼层时钟';
import { 购买, 送礼 } from './商店系统';
import {
  家庭计划地点动作,
  家庭计划赴约系统注入,
  提交家庭计划监控,
  提交家庭计划赴约,
  执行家庭计划地点动作,
  确认家庭计划微信已读,
  type 家庭计划地点动作ID,
  type 家庭计划结果,
} from './家庭计划系统';
import {
  type AI可写变量范围,
  构造AI可写变量范围,
  构造AI可写变量视图,
  扩展精确亲密妻,
  解析候选亲密妻,
  同步整表视图,
  登记MVU提交校验,
  排队MVU操作,
  读取AI可写变量范围,
  读取最近有效,
  读最近有效stat,
  脚本写入,
  脚本写入中,
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
import { 确认怀孕微信已送达, 提交孕情初见评价, 应使用怀孕CG } from './怀孕系统';
import { 读取待触发丈夫登门, 准备睡前丈夫登门, 推进丈夫登门, 同步丈夫登门排期 } from './丈夫登门系统';
import {
  产后图片键,
  待产图片键,
  提交产前看望,
  提交产后看望,
  提交生产叙事完成,
  提交留下陪产,
  处于医院硬锁,
  生产动作系统注入,
  生产地点动作,
  确认预产微信已读,
  type 生产地点动作ID,
} from './生产系统';
import {
  事件角色标记,
  检测焦点,
  规划快照刷新,
  筛选余波当面妻,
  读场景,
  读粘滞,
  读粘滞夫,
  读粘滞状态,
  入住登场当前场景可用,
  离场标记仍有效,
  读赴约们,
  组公寓快照,
  提交快照刷新,
  type 快照刷新票,
  冻结本轮事件,
} from './snapshotSystem';
import {
  执行回合,
  提取静音会议可提交正文,
  裁手机时间线,
  重掷回合,
  重开一局,
  回档至,
  回合进行中,
  读取变量重生成状态,
  重新生成最近回合变量,
  等待回合事务清理完成,
  协调原生时间线切换,
  取消本回合,
  取消变量重生成,
  开始新游戏,
  恢复遗留临时回合楼,
} from './回合引擎';
import { 确保RQ剧情事件SQLite结构, 清理数据库陈旧互斥旗, 读取数据库记忆胶囊 } from './数据库桥';
import { 应用酒馆最终显示正则 } from './预设输出兼容';
import { 提取正文舞台文本 } from './正文输出边界';
import { 构造入住登场演出态, 创建配置户节点, 提交入住登场, 入住检测, 同步入住世界书条目 } from './入住系统';
import { type 本轮事件冻结, 事件必须有正文, 是入住登场事件, 本轮事件可提交, 识别入住登场预约 } from './入住触发门';
import {
  构造阶段线路剧情事件,
  准备阶段线路演出事件,
  上报阶段线路事件,
  提交母亲两幕事件,
  提交阶段线路剧情,
  提交阶段线路演出事件,
  准备调查演出事件,
  提交调查演出事件,
  type 调查演出准备结果,
  type 线路事件,
} from './阶段线路系统';
import { 作废当前手机时间线租约世代, 手机锚消息签名 } from './手机时间线租约';
import { 前台生成租约持有中, 取得前台生成租约 } from './生成通道互斥';
import {
  合并同场景剧情事件,
  场景剧情可见标题,
  场景剧情需要玩家回应,
  场景剧情楼道,
  场景剧情目标匹配,
  场景剧情目标显示名,
  场景剧情锁定提示,
  校验场景剧情位置,
  激活新增场景剧情,
  激活队首场景剧情,
  追加等待场景剧情,
  准备重试场景剧情,
  标记场景剧情待重试,
  绑定新增待发送事件到场景,
  等待场景剧情阻塞当前场景,
  有场景剧情阻塞,
  提取新增待发送事件,
  读取待发送事件队列,
  读取活动场景剧情,
  读取队首场景剧情,
  提交场景剧情成功,
  消费队首场景剧情,
} from './场景剧情事务';
import { 回合在场妻键, 构造角色近期正文 } from './角色近期正文';
import {
  执行时间推进事务,
  执行等待生产事务,
  取阻塞时间的待发送事件,
  预检时间推进,
  type 时间推进地点,
  type 时间推进方式,
} from './时间推进系统';
import { 构造CG亲密上下文 } from './CG亲密上下文';
import { 使用资源道具, 切换性爱主焦点, 行动资源门槛, 结算成功现场楼, 结算性爱突然离场 } from './玩家资源系统';
import { 解析尺度判定 } from './稽查系统';
import {
  创建时间撤销点,
  创建时间推进事务记录,
  判定时间撤销点,
  读取时间推进事务记录,
  执行时间推进双存储提交,
  恢复精确聊天快照,
  捕获精确聊天快照,
  时间聊天状态指纹,
  时间推进事务恢复聊天键,
  时间推进事务键,
  时间撤销写入聊天键,
  时间撤销恢复聊天键,
  时间撤销点键,
  是时间撤销地点,
  type 精确聊天快照,
  type 时间推进事务记录,
} from './时间撤销系统';
import {
  取消静音会议筹备,
  启动静音会议,
  启动录像带,
  打开静音会议筹备,
  请求结束静音会议,
  记录静音会议互动失败,
  选择静音会议散会名单,
  特殊场景玩家行动前,
  推进特殊场景,
  通过静音会议互动,
  通过录像带互动,
  静音会议正式运行中,
} from './特殊场景系统';
import {
  借种三人日常,
  借种医院待产CG,
  借种离线监控待确认,
  停止借种结局,
  启动借种结局,
  拆除借种摄像头,
  拍摄借种三人合照,
  拍摄借种产后家庭合照,
  设置借种朋友圈选择,
  提交借种阳性结果,
  确认借种监控断线,
} from './借种结局系统';
import { 借种暂禁重装101 } from './借种结局状态';
import {
  当前时间线切换世代,
  作废当前时间线切换世代,
  排队时间线切换协调,
  时间线切换协调中,
  消费内部删楼事件,
} from './时间线切换协调';

/**
 * 人妻公寓 - 游戏逻辑脚本(P0 工程骨架)
 *
 * 三入口(秦璐重置版 0.38-0.41 防护全套出厂即防,见 设计spec「代码防护体系」):
 *   CHAT_COMPLETION_PROMPT_READY → 毒快照防御+回退取楼 → 捕获保护快照 → 注入公寓快照
 *   VARIABLE_UPDATE_ENDED        → 末楼 is_user 放行 → 手动重处理只恢复不推进 →
 *                                   回滚脚本管字段 → 事件转存 → 结算(P1+) → 写回
 *   MESSAGE_RECEIVED             → 刷新保护快照
 *
 * 启动纪律(云霜凝 2.0.22 踩坑范式):模块顶层禁止碰 Mvu——一切初始化等
 * waitGlobalInitialized('Mvu'),失败弹 toast,绝不静死无提示。
 *
 * 〔P1〕固定 0 楼回合引擎(修道院直迁)/地图界面壳/稽查 v1 在下一阶段接入。
 */

// 原生正文生成周期不再是无所有者的布尔锁：由 ./原生正文租约 的状态机持有，只有宿主
// GENERATION_STARTED 登记过的原生正文开始票才能在 PROMPT_READY 认领正文租约，并只由
// 匹配的 GENERATION_STOPPED / GENERATION_ENDED / VARIABLE_UPDATE_ENDED 精确释放。
/** 玩家主动时间事务与正文生成互斥；防止清场写入途中又从输入框启动一轮 AI。 */
let _时间推进中 = false;
let _静音会议原生生成中 = false;
let _静音会议原生基底: SchemaType | null = null;
let _静音会议原生正文写回序号 = 0;
let _静音会议原生正文写回租约: {
  序号: number;
  时间线世代: number;
  聊天ID: string;
  楼层: number;
  消息引用: unknown;
  消息签名: string;
} | null = null;
let _静音会议原生因私聊阻断 = false;
let _静音会议原生预期助手楼层: number | null = null;
let _原生变量事务数 = 0;
let _原生变量事务序号 = 0;
const _原生变量事务结束等待者 = new Set<() => void>();

function 标记原生变量事务开始(): void {
  _原生变量事务数 += 1;
}

function 标记原生变量事务结束(): void {
  _原生变量事务数 = Math.max(0, _原生变量事务数 - 1);
  if (_原生变量事务数 > 0) return;
  for (const resolve of _原生变量事务结束等待者) resolve();
  _原生变量事务结束等待者.clear();
}

function 等待原生变量事务清理完成(): Promise<void> {
  if (_原生变量事务数 === 0) return Promise.resolve();
  return new Promise(resolve => {
    let 已结束 = false;
    const 完成 = () => {
      if (已结束) return;
      已结束 = true;
      clearTimeout(提示器);
      _原生变量事务结束等待者.delete(完成);
      resolve();
    };
    _原生变量事务结束等待者.add(完成);
    const 提示器 = setTimeout(() => {
      if (!已结束) eventEmit('人妻公寓:回合失败', '旧分支仍有写入没有结束；为避免串档，已暂停新操作，请刷新页面。');
    }, 15_000);
  });
}

/** 只保存本模块的两个宿主时间线监听；全局槽可跨热挂载停止旧实例，不碰数据库桥。 */
type 游戏逻辑热挂载全局 = typeof globalThis & {
  __rqgyGameTimelineListenerStops?: (() => void)[];
  __rqgyGameHeartbeatStop?: () => void;
};
const 游戏逻辑全局 = globalThis as 游戏逻辑热挂载全局;

/**
 * 同一 iframe 内热重载脚本时，只有最新实例可以续写“脚本存活”心跳。
 * 主动停止旧 interval 之外再给回调加失效门，覆盖已经进入宿主任务队列的迟到 tick。
 */
export function 注册单例脚本心跳(
  所有者: { __rqgyGameHeartbeatStop?: () => void },
  写心跳: () => void,
  间隔毫秒 = 5000,
  建立周期: (任务: () => void, 毫秒: number) => unknown = (任务, 毫秒) => setInterval(任务, 毫秒),
  清除周期: (句柄: unknown) => void = 句柄 => clearInterval(句柄 as ReturnType<typeof setInterval>),
): () => void {
  所有者.__rqgyGameHeartbeatStop?.();
  let 已停止 = false;
  写心跳();
  const 句柄 = 建立周期(
    () => {
      if (!已停止) 写心跳();
    },
    Math.max(1, 间隔毫秒),
  );
  const 停止 = () => {
    if (已停止) return;
    已停止 = true;
    清除周期(句柄);
    if (所有者.__rqgyGameHeartbeatStop === 停止) delete 所有者.__rqgyGameHeartbeatStop;
  };
  所有者.__rqgyGameHeartbeatStop = 停止;
  return 停止;
}

/** 可选启动步骤允许普通宿主错误降级，但绝不能吞掉已经失去聊天／时间线所有权的旧任务。 */
export function 处理可降级启动错误(
  启动仍有效: () => boolean,
  错误: unknown,
  报告: (错误: unknown) => void,
): void {
  if (!启动仍有效()) throw 错误;
  报告(错误);
}

function 停止本模块脚本心跳(): void {
  游戏逻辑全局.__rqgyGameHeartbeatStop?.();
}

function 停止本模块原生时间线监听(): void {
  const 停止器 = 游戏逻辑全局.__rqgyGameTimelineListenerStops ?? [];
  游戏逻辑全局.__rqgyGameTimelineListenerStops = [];
  for (const 停止 of 停止器) {
    try {
      停止();
    } catch {
      /* 监听所属 iframe 已销毁时无需再清。 */
    }
  }
}

function 释放静音会议原生生成锁(保留私聊阻断墓碑 = true): void {
  const 保留墓碑 = 保留私聊阻断墓碑 && _静音会议原生因私聊阻断 && _静音会议原生基底 !== null;
  if (_静音会议原生生成中) 设置静音会议手机生成中(false);
  _静音会议原生生成中 = false;
  if (!保留墓碑) {
    _静音会议原生基底 = null;
    _静音会议原生因私聊阻断 = false;
    _静音会议原生预期助手楼层 = null;
  }
}

async function 物理写回静音会议原生正文(
  正文: string,
  楼层: number,
  预期消息: (typeof SillyTavern.chat)[number] | undefined,
  提交校验: () => boolean,
  刷新预期消息签名: () => void,
): Promise<void> {
  const 消息 = SillyTavern.chat?.[楼层];
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  if (!消息 || 消息 !== 预期消息 || 消息.is_user) return;
  // 先同步修改宿主内存，再调用公开写楼 API 持久化；即使 Promise 尚未完成，手动重处理也
  // 已经读不到 AI 的变量协议。写楼引发的嵌套变量事件由互斥旗忽略。
  消息.mes = 正文;
  刷新预期消息签名();
  const 写回序号 = ++_静音会议原生正文写回序号;
  _静音会议原生正文写回租约 = {
    序号: 写回序号,
    时间线世代: 当前时间线切换世代(),
    聊天ID: 当前聊天ID(),
    楼层,
    消息引用: 消息,
    消息签名: 手机锚消息签名(消息),
  };
  try {
    await Promise.resolve(setChatMessages([{ message_id: 楼层, message: 正文 }], { refresh: 'none' }));
    if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  } catch (e: unknown) {
    if (!提交校验()) throw e;
    console.error('[人妻公寓] 静音会议原生 AI 楼清洗写回失败:', e);
    eventEmit('人妻公寓:提示', '⚠ 静音会议正文协议清洗未能持久化，请勿对该楼手动重新处理变量。');
  } finally {
    if (_静音会议原生正文写回租约?.序号 === 写回序号) _静音会议原生正文写回租约 = null;
  }
}

function 合并静音会议可信私聊摘要(目标: SchemaType, 旧变量: object): void {
  // 旧变量属于 AI 解析前的可信状态；若会场私聊恰在 prompt 后完成，只合并它拥有的
  // 两个摘要字段，绝不从 AI 的新变量中取值。
  try {
    const 旧raw = _.get(旧变量, 'stat_data');
    if (!旧raw || _.isEmpty(旧raw)) return;
    const 旧data = Schema.parse(旧raw) as SchemaType;
    const 旧场 = 旧data.系统._特殊场景;
    const 新场 = 目标.系统._特殊场景;
    if (
      旧场.id === '静音会议' &&
      新场.id === '静音会议' &&
      旧场.启动楼层 === 新场.启动楼层 &&
      _.isEqual(旧场.参与妻, 新场.参与妻) &&
      旧场.会场私聊摘要楼层 >= 新场.会场私聊摘要楼层
    ) {
      新场.会场私聊摘要 = _.cloneDeep(旧场.会场私聊摘要);
      新场.会场私聊摘要楼层 = 旧场.会场私聊摘要楼层;
    }
  } catch {
    /* 旧值不可读时保留 PROMPT_READY 冻结基底 */
  }
}

// 本轮焦点户(PROMPT_READY 检测,写阶段回滚用——后台户整体拍回)
let _本轮焦点: 门牌[] = [];
let _本轮妻在场: 门牌[] = [];
let _本轮夫在场: 门牌[] = [];
let _本轮变量范围: AI可写变量范围 = { 妻: [], 夫: [], 亲密妻: [] };
let _本轮快照刷新票: 快照刷新票 | null = null;
let _本轮孕情初见提示 = '';
let _本轮余波目标: 门牌 | null = null;
let _本轮玩家文本 = '';
let _本轮事件: 本轮事件冻结 | null = null;
let _本轮事件基底: SchemaType | null = null;
let _本轮入住演出态: SchemaType | null = null;
let _本轮场景id = '';
let _本轮资源计费 = false;

function 清原生本轮冻结(): void {
  _本轮事件 = null;
  _本轮事件基底 = null;
  _本轮入住演出态 = null;
  _本轮场景id = '';
  _本轮资源计费 = false;
  _本轮变量范围 = { 妻: [], 夫: [], 亲密妻: [] };
  _本轮快照刷新票 = null;
  _本轮孕情初见提示 = '';
}

/** 原生路径只在正文成功后固化人物连续状态；取消或失败的 prompt 不得留下假粘滞。 */
async function 固化原生本轮在场(楼层: number, 提交校验: () => boolean = () => true): Promise<void> {
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const 当前场景id = 读场景().房间id;
  if (当前场景id !== _本轮场景id) return;

  const 本轮焦点 = [..._本轮焦点];
  const 本轮妻在场 = [..._本轮妻在场];
  const 本轮夫在场 = [..._本轮夫在场];
  const 全部在场 = _.uniq([...本轮妻在场, ...本轮夫在场]);
  const 旧粘滞 = 读粘滞状态();
  const 离场 = (离场标记仍有效(旧粘滞, 当前场景id, 楼层) ? (旧粘滞?.离场 ?? []) : []).filter(
    m => !本轮妻在场.includes(m),
  );
  const 新粘滞 = 当前场景id
    ? {
        位置: 当前场景id,
        楼: 楼层,
        们: 本轮妻在场,
        夫们: 本轮夫在场,
        离场,
        ...(离场.length ? { 离场楼: 旧粘滞?.离场楼 ?? 旧粘滞?.楼 ?? 楼层 } : {}),
      }
    : null;
  await updateVariablesWith(
    vars => {
      if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
      _.set(vars, '_在场', {
        焦点: 本轮焦点,
        在场: 全部在场.filter(m => !本轮焦点.includes(m)).slice(0, 2),
        妻在场: 本轮妻在场,
        夫在场: 本轮夫在场,
        可写妻: _本轮变量范围.妻,
        可写夫: _本轮变量范围.夫,
      });
      _.set(vars, '_粘滞', 新粘滞);
      return vars;
    },
    { type: 'chat' },
  );
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');

  // 角色级近期正文只信任消息自身的持久元数据。固定 0 楼主路径建 assistant 时已经写入；
  // 原生逃生舱由宿主先建楼，只能在匹配的成功 VARIABLE_UPDATE_ENDED 收口时补写。
  // 保留整份既有 extra 与正文，不给旧楼猜角色，也不让失败/取消楼留下伪在场凭据。
  const 助手楼 = SillyTavern.chat?.[楼层] as
    | { is_user?: boolean; mes?: string; extra?: Record<string, unknown> | null }
    | undefined;
  if (!助手楼 || 助手楼.is_user || typeof 助手楼.mes !== 'string') {
    throw new Error('原生成功助手楼缺少可持久化的正文，拒绝写入角色在场凭据');
  }
  await setChatMessages(
    [
      {
        message_id: 楼层,
        message: 助手楼.mes,
        extra: { ...(助手楼.extra ?? {}), [回合在场妻键]: _.uniq(本轮妻在场) },
      },
    ],
    { refresh: 'none' },
  );
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
}

/** MVU 回调退出后助手楼才完成持久化；只以同一聊天里实际落盘的严格入住结果同步镜像和世界书。 */
function 安排原生入住持久后同步(楼层: number, 事件: string): void {
  const 预期聊天ID = 当前聊天ID();
  const 预期时间线世代 = 当前时间线切换世代();
  const 预期消息 = SillyTavern.chat?.[楼层];
  const 预期消息签名 = 手机锚消息签名(预期消息);
  const 仍在原时间线 = () =>
    预期时间线世代 === 当前时间线切换世代() &&
    当前聊天ID() === 预期聊天ID &&
    SillyTavern.chat?.[楼层] === 预期消息 &&
    手机锚消息签名(SillyTavern.chat?.[楼层]) === 预期消息签名;
  setTimeout(
    () =>
      void (async () => {
        if (!仍在原时间线()) return;
        标记原生变量事务开始();
        try {
          if (!仍在原时间线()) return;
          const rawStat = 读最近有效stat();
          if (!rawStat) return;
          const 已落盘 = Schema.parse(rawStat) as SchemaType;
          const 已注入 = 已落盘.系统._已注入事件;
          const 预约 = 识别入住登场预约(事件);
          if (!预约 || 已注入.楼层 !== 楼层 || 已注入.内容 !== 事件 || 已落盘.系统._待发送事件 === 事件) return;
          if (预约.类型 === '住户' ? !已落盘.户[预约.门牌] : !已落盘.系统._母亲入列) return;
          if (!仍在原时间线()) return;
          捕获保护快照(已落盘);
          await 同步入住世界书条目(已落盘, 仍在原时间线);
        } catch (e) {
          if (仍在原时间线()) console.error('[人妻公寓] 原生入住持久后同步复核失败:', e);
        } finally {
          标记原生变量事务结束();
        }
      })(),
    0,
  );
}

// 快照注入幂等标记(marker 清旧再 push,防一条消息多份快照,防护25)
const SNAPSHOT_MARKER = '<公寓快照>';
const VARIABLE_VIEW_MARKER = '<status_current_variable>';

/**
 * 原生酒馆路径到 PROMPT_READY 时，世界书宏已经展开。这里必须直接替换请求里的旧视图，
 * 不能只改 chat 变量，否则换场或换焦点的这一楼仍会把上一轮演员交给模型。
 */
function 覆盖原生本轮变量视图(
  chat: SillyTavern.SendingMessage[],
  data: SchemaType,
  范围: AI可写变量范围,
  候选亲密妻?: readonly 门牌[],
): void {
  const 内容 = JSON.stringify(构造AI可写变量视图(data, 范围, 候选亲密妻));
  const 块 = `<status_current_variable>\n${内容}\n</status_current_variable>`;
  let 已替换 = false;
  for (const 消息 of chat) {
    if (消息.role !== 'system' || typeof 消息.content !== 'string' || !消息.content.includes(VARIABLE_VIEW_MARKER)) {
      continue;
    }
    消息.content = 消息.content.replace(/<status_current_variable>[\s\S]*?<\/status_current_variable>/g, 块);
    已替换 = true;
  }
  if (!已替换) {
    chat.push({
      role: 'system',
      content: `【本轮可写变量基线】只允许 replace 下方实际存在的叶子路径；未列路径禁止更新。\n${块}`,
    });
  }
}

function 当前楼层(): number {
  try {
    return getLastMessageId();
  } catch {
    return Math.max(0, (SillyTavern.chat?.length ?? 1) - 1);
  }
}

function 当前时间撤销判定(data: SchemaType, vars = getVariables({ type: 'chat' })) {
  const 当前楼 = 当前楼层();
  return 判定时间撤销点(vars[时间撤销点键], {
    当前数据: data,
    当前聊天变量: vars,
    当前聊天ID: 当前聊天ID(),
    当前楼,
    当前锚消息签名: 手机锚消息签名(SillyTavern.chat?.[当前楼]),
  });
}

/** 启动或正常回合后发现旧格式/过期点时立即清掉，避免无效完整快照长期占聊天变量。 */
async function 清理无效时间撤销点(
  data?: SchemaType,
  提交校验: () => boolean = () => true,
): Promise<void> {
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
  const vars = getVariables({ type: 'chat' });
  if (!Object.prototype.hasOwnProperty.call(vars, 时间撤销点键)) return;
  const 原点 = _.cloneDeep(vars[时间撤销点键]);
  if (data && 当前时间撤销判定(data, vars).有效) return;
  const 预期聊天ID = 当前聊天ID();
  await Promise.resolve(
    updateVariablesWith(
      当前变量 => {
        if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
        if (预期聊天ID && 当前聊天ID() !== 预期聊天ID) return 当前变量;
        if (_.isEqual(当前变量[时间撤销点键], 原点)) delete 当前变量[时间撤销点键];
        return 当前变量;
      },
      { type: 'chat' },
    ),
  );
  if (!提交校验()) throw new Error('__RQGY_TIMELINE_CHANGED__');
}

/**
 * 酒馆切换聊天会直接重载 iframe，旧调用栈没有机会执行 catch。时间推进因此先把回滚资料
 * 放进当前聊天；若上次没来得及完成最后一次 chat 提交，这里在挂载任何玩法监听前恢复。
 */
async function 恢复中断时间推进(): Promise<boolean> {
  const vars = getVariables({ type: 'chat' });
  if (!Object.prototype.hasOwnProperty.call(vars, 时间推进事务键)) return false;
  const 记录 = 读取时间推进事务记录(vars[时间推进事务键]);
  if (!记录) throw new Error('检测到损坏的时间推进恢复记录；为保护存档，脚本已停止，请联系作者');
  const 聊天ID = 当前聊天ID();
  if (!聊天ID || 记录.聊天ID !== 聊天ID) throw new Error('时间推进恢复记录不属于当前聊天');
  const 有效 = 读取最近有效();
  if (!有效) throw new Error('时间推进恢复时找不到可写入的 MVU 快照');

  await 脚本写入(有效.raw, _.cloneDeep(记录.推进前数据), {
    记录成长: false,
    当前绝对时段: 记录.推进前数据.系统._绝对时段,
  });
  await Promise.resolve(
    updateVariablesWith(
      当前变量 => {
        if (当前聊天ID() !== 聊天ID) throw new Error('恢复时间推进时聊天再次切换');
        const 当前记录 = 读取时间推进事务记录(当前变量[时间推进事务键]);
        if (!当前记录 || 当前记录.事务ID !== 记录.事务ID) throw new Error('时间推进恢复记录已经变化');
        恢复精确聊天快照(当前变量, 记录.推进前聊天, 时间推进事务恢复聊天键);
        delete 当前变量[时间推进事务键];
        return 当前变量;
      },
      { type: 'chat' },
    ),
  );
  console.warn('[人妻公寓·时间] 已恢复上次因切换聊天或刷新而中断的时间推进，未发放奖励。');
  return true;
}

/**
 * 玩家角色名:脚本注入的快照不经过酒馆宏替换,{{user}} 会原样透传给 AI——
 * 注入前统一替换(防护24,秦璐曾硬编码"苏斌"事故)
 */
function getUserName(): string {
  try {
    const sub = (globalThis as { substitudeMacros?: (s: string) => string }).substitudeMacros;
    if (typeof sub === 'function') {
      const n = sub('{{user}}');
      if (n && n !== '{{user}}') return n;
    }
  } catch {
    /* 宏替换不可用时走兜底 */
  }
  return (SillyTavern as unknown as { name1?: string })?.name1 || '管理员';
}

/**
 * 首批入住引导(幂等):stat_data 已存在但 户 为空 → 从初始模板创建首批户节点。
 * 与毒快照纪律不冲突:stat_data 缺失时绝不动手,只在"有真值但户表空"时初始化。
 * 二三批户由入住事件动态创建(第四态休眠,P5)。
 */
function 确保首批入住(data: SchemaType): boolean {
  if (!_.isEmpty(data.户)) return false;
  const 楼 = 当前楼层();
  for (const m of 首批门牌) {
    data.户[m] = 创建配置户节点(m, 0);
    镜像直写(m, { 入住时段: 0 });
  }
  console.info(`[人妻公寓] 首批入住引导完成(楼${楼}):${首批门牌.join('、')}`);
  return true;
}

// ============================================
// 固定0楼全屏化(修道院同款,2026-07-18 补移植):只显示 0 楼(客户端 iframe 常驻),
// 隐藏酒馆原生输入(输入走游戏内);右下角 ❀ 随时切回原生界面(逃生舱,编辑楼层/排查用)
// ============================================

function 注入全屏样式(): void {
  const doc = (window.parent ?? window).document;
  if (!doc.getElementById('rq-fullscreen-style')) {
    const s = doc.createElement('style');
    s.id = 'rq-fullscreen-style';
    s.textContent =
      '#chat .mes[mesid]:not([mesid="0"]){display:none !important;}' +
      '#send_textarea{display:none !important;}' +
      '#rightSendForm{display:none !important;}';
    doc.head.appendChild(s);
  }

  // App 内的移动端提示会和客户端 iframe 一起被酒馆压扁，fixed 也只能相对这个小 iframe 定位。
  // 因此把引导直接挂到酒馆 0 楼正文，并只在 iframe 异常矮小时显示；全屏往返恢复高度后自动隐藏。
  if (!doc.getElementById('rq-mobile-fullscreen-guide-style')) {
    const s = doc.createElement('style');
    s.id = 'rq-mobile-fullscreen-guide-style';
    s.textContent =
      '#rq-mobile-fullscreen-guide{display:none;}' +
      '@media (max-width: 600px){' +
      '#chat .mes[mesid="0"] #rq-mobile-fullscreen-guide.rq-visible{display:flex!important;box-sizing:border-box;' +
      'width:min(100%,620px);margin:18px auto 0;padding:15px 17px;border:1px solid rgba(255,166,205,.72);' +
      'border-radius:16px;background:linear-gradient(135deg,rgba(105,55,84,.98),rgba(54,42,75,.98));' +
      'color:#fff;align-items:flex-start;gap:12px;font-family:inherit;line-height:1.45;' +
      'box-shadow:0 10px 28px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.18);}' +
      '#rq-mobile-fullscreen-guide .rq-fullscreen-guide-arrow{flex:none;font-size:26px;line-height:1.1;color:#ffb8d4;}' +
      '#rq-mobile-fullscreen-guide strong{display:block;margin:0 0 3px;font-size:16px;color:#fff;}' +
      '#rq-mobile-fullscreen-guide span{display:block;font-size:14px;color:#fff;}' +
      '#rq-mobile-fullscreen-guide small{display:block;margin-top:4px;font-size:12px;color:rgba(255,255,255,.74);}' +
      '}';
    doc.head.appendChild(s);
  }
  const 首楼 = doc.querySelector<HTMLElement>('#chat .mes[mesid="0"]');
  const 正文 = 首楼?.querySelector<HTMLElement>('.mes_text') ?? 首楼;
  if (正文) {
    type 宿主全屏提示节点 = HTMLElement & { rq停止观察?: () => void };
    let 提示 = doc.getElementById('rq-mobile-fullscreen-guide') as 宿主全屏提示节点 | null;
    if (!提示) {
      提示 = doc.createElement('section') as 宿主全屏提示节点;
      提示.id = 'rq-mobile-fullscreen-guide';
      提示.setAttribute('role', 'note');
      提示.setAttribute('aria-label', '移动端全屏提示');

      const 箭头 = doc.createElement('span');
      箭头.className = 'rq-fullscreen-guide-arrow';
      箭头.setAttribute('aria-hidden', 'true');
      箭头.textContent = '↑';

      const 文字 = doc.createElement('div');
      const 标题 = doc.createElement('strong');
      标题.textContent = '游戏画面被压缩了';
      const 操作 = doc.createElement('span');
      操作.textContent = '点击上方游戏画面右上角的全屏按钮（方框图标）';
      const 说明 = doc.createElement('small');
      说明.textContent = '当前看到的是酒馆压缩预览；全屏一次再退出，即可恢复正常尺寸。';
      文字.append(标题, 操作, 说明);
      提示.append(箭头, 文字);
      正文.appendChild(提示);
    }

    提示.rq停止观察?.();
    const 宿主窗 = doc.defaultView;
    if (宿主窗) {
      let 已观察框: HTMLIFrameElement | null = null;
      let 尺寸观察: ResizeObserver | null = null;

      const 同步提示 = () => {
        const 游戏框 = [...正文.querySelectorAll<HTMLIFrameElement>('iframe')].find(
          框 => 框.getBoundingClientRect().width >= 180,
        );
        if (!游戏框) {
          提示.classList.remove('rq-visible');
          return;
        }
        if (游戏框 !== 已观察框) {
          if (已观察框) 尺寸观察?.unobserve(已观察框);
          已观察框 = 游戏框;
          尺寸观察?.observe(游戏框);
        }

        const 尺寸 = 游戏框.getBoundingClientRect();
        const 压缩阈值 = Math.min(420, Math.max(220, 尺寸.width * 0.72));
        const 压缩中 = 宿主窗.matchMedia('(max-width: 600px)').matches && 尺寸.height > 0 && 尺寸.height < 压缩阈值;
        提示.classList.toggle('rq-visible', 压缩中);
      };

      if (typeof 宿主窗.ResizeObserver === 'function') {
        尺寸观察 = new 宿主窗.ResizeObserver(同步提示);
      }
      const 结构观察 = new 宿主窗.MutationObserver(同步提示);
      结构观察.observe(正文, { childList: true, subtree: true });
      宿主窗.addEventListener('resize', 同步提示);
      宿主窗.visualViewport?.addEventListener('resize', 同步提示);
      doc.addEventListener('fullscreenchange', 同步提示);
      同步提示();

      提示.rq停止观察 = () => {
        尺寸观察?.disconnect();
        结构观察.disconnect();
        宿主窗.removeEventListener('resize', 同步提示);
        宿主窗.visualViewport?.removeEventListener('resize', 同步提示);
        doc.removeEventListener('fullscreenchange', 同步提示);
      };
    }
  }
  if (!doc.getElementById('rq-ui-toggle')) {
    const b = doc.createElement('div');
    b.id = 'rq-ui-toggle';
    b.title = '切换酒馆原生界面(逃生舱)';
    b.setAttribute(
      'style',
      'position:fixed;right:10px;bottom:10px;z-index:9999;width:34px;height:34px;border-radius:50%;' +
        'background:#fff5f9;color:#ff4f9a;border:1px solid #ff9cc5;display:flex;align-items:center;' +
        'justify-content:center;cursor:pointer;font-size:16px;user-select:none;box-shadow:0 2px 8px rgba(0,0,0,.15);',
    );
    b.textContent = '❀';
    b.addEventListener('click', () => {
      const s = doc.getElementById('rq-fullscreen-style') as HTMLStyleElement | null;
      if (!s) return;
      s.media = s.media === 'not all' ? '' : 'not all';
    });
    doc.body.appendChild(b);
  }
}

// ============================================
// 启动引导:等 Mvu 就绪 → 注册 schema → 心跳 → 挂监听(启动三件套,防护16)
// ============================================

// 新模块实例尚未进入异步等待前，先撤销旧实例的存活写权；否则新启动失败时旧 interval
// 仍会让客户端误报“脚本正常”。旧实例迟到的 finally 只会调用已失效停止器，不会清新实例。
停止本模块脚本心跳();

$(() => {
  void (async () => {
    const _top = (window.parent ?? window) as unknown as { toastr?: typeof toastr; sessionStorage?: Storage };
    let 启动仍有效 = () => true;
    let 取消启动提交校验: () => void = () => undefined;
    let 停止当前脚本心跳: () => void = () => undefined;
    let 启动已完成 = false;
    try {
      const 超时 = new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('等待 Mvu 初始化超时(>10s),请检查 MVU 脚本是否启用')), 10000),
      );
      await Promise.race([waitGlobalInitialized('Mvu'), 超时]);
      // 启动恢复发生在完整业务监听挂载前；切聊会重载 iframe，但旧异步 parent API 仍可能
      // 迟到结算。冻结聊天 ID、chat 对象身份和共享世代，并把同一门挂进所有 mvuIO 写回。
      const 启动聊天ID = 当前聊天ID();
      const 启动聊天引用 = SillyTavern.chat;
      const 启动时间线世代 = 当前时间线切换世代();
      启动仍有效 = () =>
        当前聊天ID() === 启动聊天ID &&
        SillyTavern.chat === 启动聊天引用 &&
        当前时间线切换世代() === 启动时间线世代;
      const 确认启动仍有效 = () => {
        if (!启动仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
      };
      取消启动提交校验 = 登记MVU提交校验(启动仍有效);
      确认启动仍有效();

      // 在任何监听与 UI 操作挂载前，把仍受支持的旧档原子迁移并写回当前尾楼。
      // 未知版本仍立即停止，避免 Zod 默认值把不完整数据伪装成可继续游玩的新档。
      const 启动存档 = 读最近有效stat();
      if (启动存档) {
        验证当前MVU存档版本(启动存档);
        if (需要迁移MVU存档(启动存档)) {
          const 有效 = 读取最近有效();
          if (!有效) throw new Error('找到可迁移旧档，但无法取得可写入的当前尾楼；迁移已中止，原存档未修改。');
          await 排队MVU操作(() =>
            脚本写入(有效.raw, 有效.data, {
              记录成长: false,
              当前绝对时段: 有效.data.系统._绝对时段,
            }),
          );
          确认启动仍有效();
          _top.toastr?.success?.('旧存档已安全迁移到当前版本，可继续原进度。', '人妻公寓', { timeOut: 8000 });
          console.info('[人妻公寓] 旧存档已迁移并写回当前尾楼');
        }
      }

      // 只在互斥旗存在、公开 API 经过等待仍不存在时清理死旗；活动中的数据库实例绝不触碰。
      await 清理数据库陈旧互斥旗();
      // 模板升级不会自动修改已有 SQLite 物理表；启动时只补人妻公寓业务表缺失字段。
      await 确保RQ剧情事件SQLite结构();
      确认启动仍有效();

      // 安检机第一道:挂载 zod schema
      registerMvuSchema(Schema);

      // 一次性初始化:本卡默认 MVU 更新方式=额外模型解析,玩家装好 MVU 什么都不用设;
      // 初始化过后完全尊重玩家在游戏设置页的选择,不再强改。
      try {
        if (确保MVU默认外置解析()) {
          console.info('[人妻公寓] 首次启动:已把 MVU 更新方式默认为「额外模型解析」');
        }
      } catch (e) {
        console.error('[人妻公寓] 初始化 MVU 默认外置解析失败(不阻塞启动):', e);
      }

      // 若先前只重载了角色卡 iframe、父页面仍未完整刷新，运行期闸门会保留。
      // 此时继续挂载只会让玩家误以为内置解析已生效；失败关闭并保留手动刷新提示。
      if (内置变量解析等待宿主刷新()) {
        _top.toastr?.info?.(
          'MVU 设置正在等待完整宿主刷新；请刷新整个酒馆页面后继续。当前内置变量解析保持关闭，不会双发。',
          '人妻公寓',
          { timeOut: 0, extendedTimeOut: 0 },
        );
        console.info('[人妻公寓] 检测到 MVU 设置待宿主刷新，本轮初始化停止。');
        return;
      }

      // 启动自检(每次启动都跑,自愈):内置变量解析开着时,MVU 的"自动请求"必须关。
      // 上游运行时读取 Pinia 副本，改 extensionSettings 不能即时同步；若本次确实代关，
      // 立即挂起游戏内置解析并停止本轮挂载，等防抖保存后刷新整个酒馆页面再安全接管。
      try {
        if (自动代关MVU自动请求()) {
          const 已安排刷新 = 安排宿主刷新以应用MVU设置();
          _top.toastr?.info?.(
            已安排刷新
              ? '检测到 MVU 自动请求仍开启：已关闭并暂缓游戏内置解析，正在刷新酒馆页面后安全接管。'
              : '已关闭 MVU 自动请求并暂缓游戏内置解析；请手动完整刷新酒馆页面后继续。',
            '人妻公寓',
            { timeOut: 0, extendedTimeOut: 0 },
          );
          console.info(
            已安排刷新
              ? '[人妻公寓] 已关闭 MVU 自动请求并安排宿主刷新；本轮初始化停止，避免同楼双解析。'
              : '[人妻公寓] 无法自动刷新宿主；本轮初始化停止，等待玩家手动完整刷新。',
          );
          return;
        }
      } catch (e) {
        console.error('[人妻公寓] 代关 MVU 自动请求失败；为避免同楼双解析，本轮启动已停止:', e);
        return;
      }

      // 必须先于监听与 UI 操作恢复；否则玩家可能在“stat 已推进、chat 尚未提交”的半状态上继续行动。
      const 启动聊天变量 = getVariables({ type: 'chat' });
      if (
        Object.prototype.hasOwnProperty.call(启动聊天变量, 时间推进事务键) &&
        Object.prototype.hasOwnProperty.call(启动聊天变量, 隔离事件事务键)
      ) {
        throw new Error('同时存在时间推进与隔离事件恢复记录，状态歧义；脚本已停止，请联系作者');
      }
      await 恢复中断时间推进();
      确认启动仍有效();
      await 恢复中断隔离提交(提交前数据 => {
        const 有效 = 读取最近有效();
        if (!有效) throw new Error('隔离事件恢复时找不到可写入的 MVU 快照');
        return 脚本写入(有效.raw, _.cloneDeep(提交前数据), {
          记录成长: false,
          当前绝对时段: 提交前数据.系统._绝对时段,
        });
      });
      确认启动仍有效();

      // 中断恢复第三步:切聊天/刷新杀死旧调用栈后,再进入该聊天时自动清理遗留的临时回合楼
      // (幂等,零命中零写入;删除失败向上抛,不带着遗留楼接受 UI 操作)。
      await 恢复遗留临时回合楼();
      确认启动仍有效();

      // 首批入住引导(读到真值才动手)。所有可等待的启动同步必须先完成；直到最后一次
      // 世代复核通过前，不对外声明心跳存活，也不挂可接受玩家操作的业务监听。
      try {
        const 有效 = 读取最近有效();
        if (有效) {
          const { raw, data } = 有效;
          // MVU 向刚发送的玩家楼继承 stat_data 存在短暂竞态；当前版本仍把最近有效
          // 快照补到尾楼。这是同版本运行保障，不是旧档升级。
          const 尾楼缺存档 = !_.get(raw, 'stat_data') || _.isEmpty(_.get(raw, 'stat_data'));
          const 首批有修正 = 确保首批入住(data);
          if (首批有修正 || 尾楼缺存档) await 脚本写入(raw, data);
          确认启动仍有效();
          // iframe 热重载会清空模块内存。必须在监听器可接受手动“重新处理变量”前，
          // 以首批入住修正后的最终真值重建守护基准，不能等下一次正文生成才捕获。
          捕获保护快照(data);
          await 等待晋阶镜像写入();
          确认启动仍有效();
          await 同步入住世界书条目(data, 启动仍有效);
          确认启动仍有效();
          await 同步整表视图(data, 启动仍有效); // 开新聊天或刷新后确保整表条目有内容
          确认启动仍有效();
          await 清理无效时间撤销点(data, 启动仍有效);
          确认启动仍有效();
        } else {
          await 清理无效时间撤销点(undefined, 启动仍有效);
        }
      } catch (e) {
        处理可降级启动错误(启动仍有效, e, 错误 => console.error('[人妻公寓] 首批入住引导失败:', 错误));
      }

      确认启动仍有效();
      // 脚本心跳:每 5s 写 sessionStorage,客户端延迟检测"脚本未加载"。单例所有权
      // 覆盖同 iframe 热重载；后续 fatal 若发生，finally 会停止当前实例，绝不假续命。
      try {
        停止当前脚本心跳 = 注册单例脚本心跳(游戏逻辑全局, () => {
          try {
            _top.sessionStorage?.setItem?.('人妻公寓_脚本心跳', String(Date.now()));
          } catch {
            /* 跨域受限时静默 */
          }
        });
      } catch {
        /* 心跳失败不阻塞启动 */
      }

      挂载监听();
      reloadOnChatChange();
      // 脚本与 0 楼界面是两个独立 iframe，加载先后不固定：脚本主动推一次，界面挂载后也会查询一次，
      // 两边任一后到都能恢复最新回合的按钮状态。
      eventEmit('人妻公寓:变量重生成状态', 读取变量重生成状态());

      // 固定0楼全屏样式(2026-07-18 用户实测:开酒馆全部楼层暴露,要翻上去才见游戏——
      // 修道院同款注入漏移植;只显示0楼客户端+藏酒馆输入,右下❀=切回原生逃生舱)
      try {
        注入全屏样式();
      } catch (e) {
        console.error('[人妻公寓] 注入全屏样式失败(游戏仍可玩,楼层未隐藏):', e);
      }

      // 渲染楼层数归 0(玩家设成非 0 时 0 楼界面会被深度裁剪=白屏)
      void 强制酒馆助手渲染全部楼层();
      window.addEventListener('pagehide', () => void 恢复酒馆助手渲染楼层(), { once: true });

      // 手机挂载(P4:注入酒馆页面层;失败不阻塞游戏本体)
      try {
        挂载手机();
      } catch (e) {
        console.error('[人妻公寓] 手机挂载失败(游戏本体不受影响):', e);
      }

      // 加载成功提示(sessionStorage gate:切聊天 reload 不重弹)
      const TOAST_KEY = '人妻公寓_脚本toast已弹';
      if (!sessionStorage.getItem(TOAST_KEY)) {
        _top.toastr?.success?.('游戏逻辑脚本加载正常', '人妻公寓');
        sessionStorage.setItem(TOAST_KEY, '1');
      }
      启动已完成 = true;
      console.info('[人妻公寓] 游戏逻辑脚本已加载(Schema 已注册)');
    } catch (err) {
      if (!启动仍有效()) {
        console.info('[人妻公寓] 启动期间聊天或消息时间线已经变化，旧启动任务停止。');
        return;
      }
      console.error('[人妻公寓] 游戏逻辑脚本加载失败:', err);
      _top.toastr?.error?.(
        `游戏逻辑脚本加载失败:${(err as Error)?.message ?? String(err)}\n请 F12 查看控制台`,
        '人妻公寓',
        { timeOut: 0, extendedTimeOut: 0 },
      );
    } finally {
      if (!启动已完成) 停止当前脚本心跳();
      取消启动提交校验();
    }
  })();
});

function 挂载监听() {
  // 清理本 iframe 累积的旧 listener(防 reload 累积爆炸,防护16)
  停止本模块原生时间线监听();
  // 热挂载/重入时重置原生正文租约状态机，避免残留上一轮的开始票或令牌。
  重置原生正文租约();
  eventClearEvent(tavern_events.CHAT_COMPLETION_PROMPT_READY);
  eventClearEvent(Mvu.events.VARIABLE_UPDATE_ENDED);
  eventClearEvent(tavern_events.MESSAGE_RECEIVED);
  eventClearEvent(tavern_events.GENERATION_STARTED);
  eventClearEvent(tavern_events.GENERATION_STOPPED);
  eventClearEvent(tavern_events.GENERATION_ENDED);
  for (const 名 of [
    '人妻公寓:玩家行动',
    '人妻公寓:重掷',
    '人妻公寓:回档',
    '人妻公寓:取消生成',
    '人妻公寓:重新生成变量',
    '人妻公寓:查询变量重生成状态',
    '人妻公寓:开始新游戏',
    '人妻公寓:重开一局',
    '人妻公寓:请求晋阶',
    '人妻公寓:翻垃圾',
    '人妻公寓:布设摄像头',
    '人妻公寓:拆除借种摄像头',
    '人妻公寓:确认借种断线',
    '人妻公寓:启动借种',
    '人妻公寓:停止借种',
    '人妻公寓:查看借种阳性结果',
    '人妻公寓:拍摄借种三人合照',
    '人妻公寓:拍摄借种产后家庭合照',
    '人妻公寓:借种三人日常',
    '人妻公寓:借种朋友圈选择',
    '人妻公寓:查看摄像头',
    '人妻公寓:偷窥选细节',
    '人妻公寓:读信',
    '人妻公寓:购买',
    '人妻公寓:家庭计划动作',
    '人妻公寓:生产动作',
    '人妻公寓:同步孕产微信已读',
    '人妻公寓:同步家庭计划微信已读',
    '人妻公寓:送礼',
    '人妻公寓:推进时段',
    '人妻公寓:睡到次日早晨',
    '人妻公寓:小憩',
    '人妻公寓:晨跑',
    '人妻公寓:健身',
    '人妻公寓:撤销时间推进',
    '人妻公寓:线路启动剧情',
    '人妻公寓:回合失败',
    '人妻公寓:催租',
    '人妻公寓:要钱',
    '人妻公寓:捡金币',
    '人妻公寓:处理管理任务',
    '人妻公寓:空房偷窃',
    '人妻公寓:使用运作',
    '人妻公寓:使用资源道具',
    '人妻公寓:性爱突然离场',
    '人妻公寓:切换性爱主焦点',
    '人妻公寓:接听来电',
    '人妻公寓:开手机',
    '人妻公寓:来电已接',
    '人妻公寓:父亲通话结束',
    '人妻公寓:父亲通话已清理',
    '人妻公寓:回合完成',
    '人妻公寓:考古选细节',
    '人妻公寓:查看旧动态',
    '人妻公寓:考古到底',
    // 补齐清理名单(审计 低危3):以下 8 个此前注册了却不在清单里(防御一致性,防护16)
    '人妻公寓:隔离事件撤回',
    '人妻公寓:隔离事件重掷',
    '人妻公寓:开启阶段性癖',
    '人妻公寓:打听',
    '人妻公寓:对饮',
    '人妻公寓:丈夫礼物',
    '人妻公寓:荣耀洞',
    '人妻公寓:荣耀洞离场',
    '人妻公寓:使用录像带',
    '人妻公寓:录像带互动',
    '人妻公寓:使用静音会议',
    '人妻公寓:取消静音会议筹备',
    '人妻公寓:启动静音会议',
    '人妻公寓:静音会议互动',
    '人妻公寓:静音会议互动失败',
    '人妻公寓:静音会议互动补偿',
    '人妻公寓:静音会议散会',
    '人妻公寓:结束静音会议',
    '人妻公寓:特殊场景状态',
    '人妻公寓:继续场景剧情',
    '人妻公寓:检查场景剧情',
  ]) {
    eventClearEvent(名);
  }

  // ─────────────────────────────────────────────
  // 主路径:客户端 UI 事件 → 回合引擎(固定 0 楼)
  // ─────────────────────────────────────────────
  eventOn('人妻公寓:玩家行动', (行动: string) => {
    if (typeof 行动 !== 'string' || !行动.trim()) return;
    if (_时间推进中) {
      eventEmit('人妻公寓:回合失败', '时间正在推进，请等地图刷新后再行动。');
      return;
    }
    const 当前 = 读最近有效stat();
    // raw stat 未过 schema 消毒,可选链护全程再转数(审计 低危21-①)
    if (Number(_.get(当前 ?? {}, '系统._荣耀洞拍') ?? -1) >= 0 && 读场景().房间id === '洗手间' && !隔离事件进行中()) {
      let 荣耀洞静默已切换 = false;
      let 荣耀洞核心已提交 = false;
      const 标记荣耀洞静默切换 = () => {
        荣耀洞静默已切换 = true;
      };
      const 标记荣耀洞核心已提交 = () => {
        荣耀洞核心已提交 = true;
      };
      void 安全操作(
        (raw, data, 操作仍有效) => {
          const 文本 = 行动.trim();
          return 运行荣耀洞隔离拍(
            raw,
            data,
            文本,
            建隔离记录('荣耀洞继续', 文本, data),
            操作仍有效,
            标记荣耀洞静默切换,
            标记荣耀洞核心已提交,
          );
        },
        false,
        () => 荣耀洞静默已切换 || 荣耀洞核心已提交,
      );
      return;
    }
    if (_.get(当前 ?? {}, '系统._特殊场景.id')) {
      安全操作(async (raw, data) => {
        if (data.系统._特殊场景.id === '静音会议' && 静音会议私聊回复生成中()) {
          eventEmit('人妻公寓:回合失败', '会场微信回复还在生成，请等她回完这一条。');
          return;
        }
        const 阶段 = data.系统._特殊场景.阶段;
        if (阶段 === '等待102' || 阶段 === '等待202') {
          eventEmit('人妻公寓:回合失败', '先操作桌上的监控瓷砖。');
          return;
        }
        const 结果 = 特殊场景玩家行动前(data, 读场景().房间id);
        if (!结果.成功) {
          eventEmit('人妻公寓:回合失败', 结果.提示);
          return;
        }
        await 脚本写入(raw, data);
        捕获保护快照(data);
        await 执行回合(行动.trim(), { 已持MVU操作租约: true });
      }, true);
      return;
    }
    if (当前) {
      try {
        const data = Schema.parse(当前) as SchemaType;
        const 活动剧情 = 读取活动场景剧情(data);
        if (活动剧情) {
          eventEmit('人妻公寓:回合失败', `「${活动剧情.标题}」的业务已经提交，请使用“重试本段剧情”，不要用新行动改写它。`);
          return;
        }
        const 等待剧情 = 读取队首场景剧情(data.系统._待发送事件);
        if (等待剧情) {
          if (等待剧情.目标场景 === null) {
            eventEmit('人妻公寓:回合失败', `旧记录「${等待剧情.标题}」缺少可靠地点，请先用剧情卡确认恢复地点。`);
            return;
          }
          if (场景剧情目标匹配(等待剧情.目标场景, 读场景().房间id ?? null)) {
            // 已到设计地点时，玩家的文字就是这张票的本轮行动。这样丈夫登门、连续对质等
            // 多拍强剧情仍保留真正的互动，不会被“开始本段剧情”的通用占位动作抹掉。
            eventEmit('人妻公寓:继续场景剧情', { 行动: 行动.trim() });
            return;
          }
        }
      } catch (error) {
        console.error('[人妻公寓] 玩家行动前读取场景剧情状态失败:', error);
        eventEmit('人妻公寓:回合失败', '场景剧情状态暂时无法确认，请刷新后重试。');
        return;
      }
    }
    void 执行回合(行动.trim());
  });
  eventOn('人妻公寓:重掷', () => {
    if (_时间推进中) {
      eventEmit('人妻公寓:回合失败', '时间正在推进，请等地图刷新后再重掷。');
      return;
    }
    void 重掷回合();
  });
  eventOn('人妻公寓:重新生成变量', () => {
    if (_时间推进中) {
      eventEmit('人妻公寓:变量重生成结束', {
        成功: false,
        状态: '可用',
        提示: '时间正在推进，请等地图刷新后再重新生成变量。',
      });
      return;
    }
    void 重新生成最近回合变量();
  });
  eventOn('人妻公寓:查询变量重生成状态', () => {
    eventEmit('人妻公寓:变量重生成状态', 读取变量重生成状态());
  });
  eventOn('人妻公寓:回档', (楼层: number) => {
    if (_时间推进中) {
      eventEmit('人妻公寓:回合失败', '时间正在推进，请等地图刷新后再回档。');
      return;
    }
    void 回档至(Number(楼层));
  });
  // 撤回/重掷两入口客户端会先乐观置 发送中 锁,任何"什么都没干"的分支必须回 回合失败
  // 解锁,只回 提示 会把输入永久闩死(审计 C6)
  eventOn('人妻公寓:隔离事件撤回', () =>
    安全操作(async (raw, data, 操作仍有效) => {
      const 记录 = 读隔离记录();
      if (!记录) {
        eventEmit('人妻公寓:回合失败', '没有可撤回的独立事件');
        return;
      }
      await 恢复隔离记录(raw, data, 记录, 操作仍有效);
      eventEmit('人妻公寓:隔离事件完成', { 类型: '撤回' });
    }, true),
  );
  eventOn('人妻公寓:隔离事件重掷', () => {
    let 荣耀洞静默已切换 = false;
    let 荣耀洞核心已提交 = false;
    const 标记荣耀洞静默切换 = () => {
      荣耀洞静默已切换 = true;
    };
    const 标记荣耀洞核心已提交 = () => {
      荣耀洞核心已提交 = true;
    };
    return 安全操作(
      async (raw, data, 操作仍有效) => {
        const 记录 = 读隔离记录();
        if (!记录) {
          eventEmit('人妻公寓:回合失败', '没有可重演的独立事件');
          return;
        }
        const 恢复后 = await 恢复隔离记录(raw, data, 记录, 操作仍有效);
        if (记录.入口 === '荣耀洞继续') {
          await 运行荣耀洞隔离拍(
            raw,
            恢复后,
            记录.行动,
            建隔离记录('荣耀洞继续', 记录.行动, 恢复后),
            操作仍有效,
            标记荣耀洞静默切换,
            标记荣耀洞核心已提交,
          );
        } else if (记录.入口 === '荣耀洞开始') {
          eventEmit('人妻公寓:荣耀洞');
        } else if (记录.门牌) {
          eventEmit('人妻公寓:查看摄像头', 记录.门牌);
        }
      },
      true,
      () => 荣耀洞静默已切换 || 荣耀洞核心已提交,
    );
  });
  eventOn('人妻公寓:取消生成', () => {
    if (!取消隔离事件() && !取消变量重生成()) 取消本回合();
  });

  async function 持久标记场景剧情待重试(
    事务ID: string,
    预期请求世代: number,
    提交校验: () => boolean = () => true,
  ): Promise<void> {
    if (!事务ID || !提交校验()) return;
    try {
      const 最新 = 读取最近有效();
      if (!最新 || !提交校验() || !标记场景剧情待重试(最新.data, 事务ID, 预期请求世代)) return;
      await 脚本写入(最新.raw, 最新.data, {
        记录成长: false,
        当前绝对时段: 最新.data.系统._绝对时段,
      });
      if (!提交校验()) return;
      try {
        捕获保护快照(最新.data);
      } catch (保护错误) {
        console.warn('[人妻公寓] 场景剧情已保持锁定，但待重试保护快照刷新失败:', 保护错误);
      }
    } catch (错误) {
      // 这是失败收口的附加状态；活动票与正文早已持久化。不得让“待重试”标记失败
      // 覆盖原始 API/取消原因，或诱导玩家把已经结算的业务再执行一次。
      console.warn('[人妻公寓] 场景剧情仍保持活动，但待重试状态写回失败:', 错误);
    }
  }

  eventOn('人妻公寓:继续场景剧情', (载荷?: { 认领旧档?: boolean; 尝试入住?: boolean; 行动?: string }) =>
    安全操作(async (raw, data, 操作仍有效) => {
      const 玩家回应 = typeof 载荷?.行动 === 'string' && Boolean(载荷.行动.trim());
      const 反馈 = (消息: string) => eventEmit(玩家回应 ? '人妻公寓:回合失败' : '人妻公寓:提示', 消息);
      if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) {
        反馈('请先完成当前特殊场景，再开始或重试普通场景剧情。');
        return;
      }
      if (父亲通话未完成(data)) {
        反馈('父亲电话仍未结束。请先完成并挂断这通电话，再开始或重试场景剧情。');
        return;
      }
      if (全局数据库AI租约.在结算() || 手机节拍进行中() || 手机AI生成中()) {
        反馈('AI通道仍在处理其他内容，当前剧情没有重新发起，请稍后再试。');
        return;
      }
      const 前台租约 = 取得前台生成租约();
      if (!前台租约) {
        反馈('还有内容正在生成，当前剧情没有重新发起，请稍后再试。');
        return;
      }
      let 租约已移交 = false;
      try {
        const 当前场景 = 读场景().房间id ?? null;
        let 事务结果:
          | ReturnType<typeof 准备重试场景剧情>
          | ReturnType<typeof 激活队首场景剧情>;
        if (data.系统._场景剧情事务.id) {
          事务结果 = 准备重试场景剧情(data, 当前场景);
        } else {
          const head = 读取队首场景剧情(data.系统._待发送事件);
          if (!head) {
            反馈('当前没有等待处理的场景剧情。');
            return;
          }
          const 是入住等待 = 是入住登场事件(head.内容);
          if (!玩家回应 && 场景剧情需要玩家回应(head.内容)) {
            反馈(`「${head.标题}」正在等你的具体回应。请在下方输入行动，不要用通用开始按钮代替。`);
            return;
          }
          let 允许未知目标 = 载荷?.认领旧档 === true;
          if (是入住等待 && head.目标场景 === null) {
            if (!玩家回应 && 载荷?.尝试入住 !== true) {
              反馈('旧档新住户登场缺少冻结地点，请使用场景卡上的“检查登场地点”。');
              return;
            }
            // 仅旧档的无目标入住票需要重新走公共地点硬门。当前版本在预约创建时已经冻结
            // 合法场景，之后只认原目标，不能因玩家移动而把同一场搬家戏改演到别处。
            if (!入住登场当前场景可用(data, 当前楼层())) {
              反馈('这里还不是合适的登场地点。先结束当前房间互动，再到楼道或公共区域查看。');
              return;
            }
            允许未知目标 = true;
          }
          const 本次行动 = 玩家回应
            ? 载荷!.行动!.trim()
            : `（留在原场景完成「${head.标题}」，只承接这一个事件，不混入后续排队剧情）`;
          事务结果 = 激活队首场景剧情(data, 当前场景, 本次行动, 当前楼层(), 允许未知目标);
        }
        if (!事务结果.成功) {
          反馈(事务结果.提示);
          return;
        }
        eventEmit('人妻公寓:场景剧情准备状态', {
          进行中: true,
          标题: 事务结果.事务.标题,
          目标场景: 事务结果.事务.目标场景,
        });
        if (!操作仍有效()) return;
        await 脚本写入(raw, data, { 记录成长: false, 当前绝对时段: data.系统._绝对时段 });
        if ((读场景().房间id ?? null) !== 当前场景) {
          await 持久标记场景剧情待重试(事务结果.事务.id, 事务结果.事务.请求世代, 操作仍有效);
          反馈(`「${事务结果.事务.标题}」已经锁定原场景，请返回后再重试。`);
          return;
        }
        if (!操作仍有效()) return;
        捕获保护快照(data);
        eventEmit(
          '人妻公寓:提示',
          `正在${事务结果.事务.请求世代 > 1 ? '重试' : '触发'}「${事务结果.事务.标题}」；场景保持锁定。`,
        );
        租约已移交 = true;
        let 成功 = false;
        try {
          成功 = await 执行回合(事务结果.事务.行动, {
            已持MVU操作租约: true,
            预占前台生成租约: 前台租约,
            场景剧情事务ID: 事务结果.事务.id,
            场景剧情请求世代: 事务结果.事务.请求世代,
            预载场景剧情数据: data,
          });
        } finally {
          if (!成功) await 持久标记场景剧情待重试(事务结果.事务.id, 事务结果.事务.请求世代, 操作仍有效);
        }
      } finally {
        eventEmit('人妻公寓:场景剧情准备状态', { 进行中: false });
        if (!租约已移交) 前台租约.释放();
      }
    }, typeof 载荷?.行动 === 'string' && Boolean(载荷.行动.trim()), () => false, true),
  );
  eventOn('人妻公寓:开始新游戏', (难度: string) => void 开始新游戏(String(难度 ?? '标准')));
  eventOn('人妻公寓:重开一局', () => void 重开一局());
  eventOn('人妻公寓:检查场景剧情', (场景: string) =>
    安全操作(
      (raw, data, 操作仍有效) => 到场触发场景剧情(raw, data, String(场景 || '楼道'), 操作仍有效),
      false,
      () => false,
      true,
    ),
  );

  // ─────────────────────────────────────────────
  // 侦探与商店(P2):UI 事件 → 纯脚本结算,直写 -1 + 刷新保护快照,提示回 toast
  // ─────────────────────────────────────────────

  interface 场景剧情落地选项 {
    标题?: string;
    场景?: string | null;
    来源?: string;
    /** 即时演出已经把同一业务的全部导演文本登记成活动票，落地层不得重复排队。 */
    事件已登记?: boolean;
  }

  /**
   * 侦探/商店结果通用落地。没有即时演出的结果仍可把新事件排成“等待到场票”，但已有
   * 活动或等待剧情时，任何会改状态的新操作都在写回前失败关闭，避免再次形成堆积。
   */
  async function 落地(
    结果: {
      提示: string;
      事件?: string;
      变动?: boolean;
      碎片到手?: boolean;
      /** 核心 MVU 成功提交后才允许写聊天软计数／镜像，失败前绝不能烧冷却。 */
      提交后?: () => void | Promise<void>;
    },
    raw: object,
    data: SchemaType,
    剧情选项: 场景剧情落地选项 = {},
  ): Promise<boolean> {
    const 原待发送 = String(_.get(raw, 'stat_data.系统._待发送事件') ?? '').trim();
    const 候选待发送 = String(data.系统._待发送事件 ?? '').trim();
    const 当前场景 = 剧情选项.场景 !== undefined ? 剧情选项.场景 : (读场景().房间id ?? null);
    const 普通场景票适用 = !data.系统._特殊场景.id && data.系统._荣耀洞拍 < 0;
    const 有状态改动 = Boolean(结果.事件 || 结果.变动 || (结果 as 侦探结果).碎片到手);
    const 本次新增事件 = 合并同场景剧情事件(
      提取新增待发送事件(原待发送, 候选待发送),
      结果.事件,
    );
    const 原等待 = 读取队首场景剧情(原待发送);
    if (
      !剧情选项.事件已登记 &&
      普通场景票适用 &&
      等待场景剧情阻塞当前场景(原等待, 当前场景) &&
      (有状态改动 || Boolean(本次新增事件))
    ) {
      const 原标题 = 原等待?.标题 ?? '当前剧情';
      eventEmit('人妻公寓:提示', `「${原标题}」还没有完成。本次操作没有提交，请先处理当前场景剧情。`);
      return false;
    }

    if (!剧情选项.事件已登记 && 普通场景票适用) {
      // 候选业务可能直接赋值 `_待发送事件`；先恢复操作开始前的等待队列，再把本次
      // 新剧情作为一张独立票插到队首。远处预约既不会丢，也不会与本地剧情混演。
      data.系统._待发送事件 = 原待发送;
      if (本次新增事件) {
        追加等待场景剧情(
          data,
          本次新增事件,
          当前场景,
          剧情选项.标题 || 场景剧情可见标题(本次新增事件),
          true,
        );
      }
    }

    const 队列已变 = String(data.系统._待发送事件 ?? '').trim() !== 原待发送;
    const 新等待剧情 = !剧情选项.事件已登记 && 队列已变 ? 读取队首场景剧情(data.系统._待发送事件) : null;
    const 广播等待准备锁 = Boolean(新等待剧情?.已结构化 && 新等待剧情.目标场景 !== null);
    if (有状态改动 || 队列已变 || 读取活动场景剧情(data)) {
      if (广播等待准备锁) {
        eventEmit('人妻公寓:场景剧情准备状态', {
          进行中: true,
          标题: 新等待剧情!.标题,
          目标场景: 新等待剧情!.目标场景,
        });
      }
      try {
        try {
          await 脚本写入(raw, data, {
            场景剧情场景: 当前场景 ?? undefined,
            场景剧情标题: 剧情选项.标题,
            场景剧情来源: 剧情选项.来源,
            场景剧情楼层: 当前楼层(),
          });
        } catch (e) {
          console.error('[人妻公寓] 结果落库失败:', e, 结果);
          eventEmit('人妻公寓:提示', `⚠ 结果没记上(请截 F12 控制台给作者):${e instanceof Error ? e.message : String(e)}`);
          return false;
        }
        try {
          await 结果.提交后?.();
        } catch (后提交错误) {
          // 核心 MVU 已经成功，不得把已发生的业务伪报为失败并诱导玩家重复点击。
          console.warn('[人妻公寓] 核心结果已保存，但聊天软计数/镜像同步失败:', 后提交错误);
        }
        try {
          捕获保护快照(data);
        } catch (保护错误) {
          // 守护快照是后置恢复加速层，不拥有核心提交成败。这里若误报失败，玩家再次点击
          // 会重复扣礼物、发奖励或重建同一场景票。
          console.warn('[人妻公寓] 核心结果已保存，但保护快照刷新失败:', 保护错误);
        }
      } finally {
        // 写核心本身失败也必须释放瞬时界面锁；持久票不存在时不能把玩家永久冻在原场景。
        if (广播等待准备锁) eventEmit('人妻公寓:场景剧情准备状态', { 进行中: false });
      }
    }
    const 锁定提示 = 场景剧情锁定提示(data);
    eventEmit('人妻公寓:提示', [结果.提示, 锁定提示].filter(Boolean).join('\n'));
    return true;
  }

  const 家庭计划CG标题: Record<string, string> = {
    家庭计划_D1_安装计划板: '第一日 · 挂起计划板',
    家庭计划_D2_投放匿名资料: '第二日 · 匿名资料',
    家庭计划_D3_监控阅读资料: '第三日 · 陌生人不行',
    家庭计划_D4_送出姓名磁贴: '第四日 · 姓名磁贴',
    家庭计划_D5_监控确认人选: '第五日 · 找个时间谈谈',
    家庭计划_赴约_宣布决定: '赴约 · 已经决定',
  };

  function 播放家庭计划CG(结果: 家庭计划结果 | { CG?: string }): void {
    if (!结果.CG) return;
    eventEmit('人妻公寓:家庭计划CG', {
      文件: 结果.CG,
      标题: 家庭计划CG标题[结果.CG] ?? '家庭计划',
      保留夏乔: 结果.CG === '家庭计划_D1_安装计划板',
    });
  }

  /** 把现有功能的成功结果接入阶段线路；不另建平行任务账。 */
  function 接入线路<T extends { 提示: string; 事件?: string; 变动?: boolean; 线路动作成功?: boolean }>(
    结果: T,
    data: SchemaType,
    事件: Omit<线路事件, '楼层'>,
  ): T {
    if (!结果.事件 && !结果.变动 && !(结果 as T & { 碎片到手?: boolean }).碎片到手 && !结果.线路动作成功) return 结果;
    const 演出预判 = 准备阶段线路演出事件(data, 事件);
    const 演出 = 演出预判.成功
      ? 准备阶段线路演出事件(data, 事件, {
          数据库记忆: 事件.门牌
            ? 读取数据库记忆胶囊(
                [户静态表[事件.门牌]?.妻名, 户静态表[事件.门牌]?.夫名].filter((名): 名 is string => Boolean(名)),
                当前楼层(),
              )
            : '',
          近期正文: 事件.门牌 ? 读取角色近期正文(事件.门牌) : '',
        })
      : 演出预判;
    if (演出.成功 && 演出.事件) {
      结果.事件 = 结果.事件 ? `${结果.事件}\n${演出.事件}` : 演出.事件;
      结果.变动 = true;
      return 结果;
    }
    const 新线索 = 上报阶段线路事件(data, {
      ...事件,
      楼层: data.系统._绝对时段,
    });
    if (新线索.length) {
      结果.变动 = true;
      结果.提示 = `${结果.提示}\n${新线索.join('\n')}`;
    }
    return 结果;
  }

  type 隔离入口 = '荣耀洞开始' | '荣耀洞继续' | '监控';
  type 隔离回合记录 = {
    入口: 隔离入口;
    行动: string;
    门牌?: 门牌;
    房间: string;
    日志长度: number;
    data快照: SchemaType;
    chat快照: { _侦探: unknown; _场景: unknown };
    /** 在事件前捕获的四键精确快照；旧版记录可能缺失，撤销时按旧语义保守合成。 */
    聊天快照精确?: 精确聊天快照;
  };

  function 建隔离记录(入口: 隔离入口, 行动: string, data: SchemaType, 门牌号?: 门牌): 隔离回合记录 {
    const vars = getVariables({ type: 'chat' });
    const 日志 = _.get(vars, '_隔离事件.日志');
    return {
      入口,
      行动,
      门牌: 门牌号,
      房间: 读场景().房间id ?? '',
      日志长度: Array.isArray(日志) ? 日志.length : 0,
      data快照: _.cloneDeep(data),
      chat快照: {
        _侦探: _.cloneDeep(_.get(vars, '_侦探')),
        _场景: _.cloneDeep(_.get(vars, '_场景')),
      },
      聊天快照精确: 捕获精确聊天快照(vars, 隔离恢复聊天键),
    };
  }

  function 读隔离记录(): 隔离回合记录 | null {
    const 原 = _.get(getVariables({ type: 'chat' }), '_上次隔离回合');
    return 原 && typeof 原 === 'object' ? (原 as 隔离回合记录) : null;
  }

  function 隔离记录目标聊天快照(记录: 隔离回合记录): 精确聊天快照 {
    if (记录.聊天快照精确 !== undefined) return _.cloneDeep(记录.聊天快照精确);
    // 兼容早于四键精确快照的旧记录：只在字段确实缺失时复刻旧撤销语义；若新字段存在但
    // 损坏，则交给事务层拒绝，不能悄悄降级掩盖存档损坏。
    if (!记录.chat快照 || typeof 记录.chat快照 !== 'object') {
      throw new Error('旧隔离回合记录缺少聊天快照，不能安全撤销');
    }
    const 目标变量 = _.cloneDeep(getVariables({ type: 'chat' })) as Record<string, unknown>;
    const 日志 = _.get(目标变量, '_隔离事件.日志');
    if (Array.isArray(日志)) _.set(目标变量, '_隔离事件.日志', 日志.slice(0, 记录.日志长度));
    _.set(目标变量, '_侦探', _.cloneDeep(记录.chat快照._侦探));
    _.set(目标变量, '_场景', _.cloneDeep(记录.chat快照._场景));
    _.set(目标变量, '_上次隔离回合', null);
    return 捕获精确聊天快照(目标变量, 隔离恢复聊天键);
  }

  async function 恢复隔离记录(
    raw: object,
    当前数据: SchemaType,
    记录: 隔离回合记录,
    操作仍有效: () => boolean,
  ): Promise<SchemaType> {
    const 目标数据 = Schema.parse(_.cloneDeep(记录.data快照)) as SchemaType;
    const 撤销前数据 = Schema.parse(_.cloneDeep(当前数据)) as SchemaType;
    const 目标聊天 = 隔离记录目标聊天快照(记录);
    const 身份 = 捕获隔离时间线身份();
    try {
      // 隔离拍可能抬升阶段、裂缝或入住镜像。显式撤销必须先取消旧世代写并清掉事件后
      // 的单调镜像，否则 stat 虽回到事件前，下一次守护仍会从旧镜像把奖励复活。
      await 作废晋阶镜像时间线();
      复核隔离时间线身份(身份, 操作仍有效);
      await 撤销已完成隔离事件事务({
        当前数据: 撤销前数据,
        目标数据,
        当前记录: 记录,
        目标聊天,
        身份,
        操作仍有效,
        写目标核心: async () => {
          复核隔离时间线身份(身份, 操作仍有效);
          await 脚本写入(raw, _.cloneDeep(目标数据), {
            记录成长: false,
            当前绝对时段: 目标数据.系统._绝对时段,
          });
        },
        恢复当前核心: async () => {
          await 脚本写入(raw, _.cloneDeep(撤销前数据), {
            记录成长: false,
            当前绝对时段: 撤销前数据.系统._绝对时段,
          });
        },
      });
      捕获保护快照(目标数据);
      await 等待晋阶镜像写入();
      return 目标数据;
    } catch (错误) {
      // 同一时间线内，反向事务已经把 stat/chat 补偿到事件后当前态；镜像也必须随之重建。
      // 切换聊天时不跨时间线写，新聊天启动会自行捕获真值，旧聊天则靠持久事务恢复。
      if (操作仍有效() && 当前聊天ID() === 身份.聊天ID) {
        捕获保护快照(撤销前数据);
        await 等待晋阶镜像写入();
      }
      throw 错误;
    }
  }

  /** 带毒快照守卫的操作壳(近10楼无 stat 一律不动手;失败一律明着报,不再静默)。
   * @param 失败解锁 客户端在 emit 前已乐观置 发送中 的入口传 true:失败分支改发 回合失败
   *   事件解锁输入,否则只回 提示 会永久闩死(审计 C6) */
  function 安全操作(
    fn: (raw: object, data: SchemaType, 操作仍有效: () => boolean) => void | Promise<unknown>,
    失败解锁 = false,
    已不可逆提交: () => boolean = () => false,
    允许场景剧情期间 = false,
  ): Promise<void> {
    const 操作世代 = 当前时间线切换世代();
    const 操作聊天ID = 当前聊天ID();
    const 操作仍有效 = () => !时间线切换协调中() && 操作世代 === 当前时间线切换世代() && 操作聊天ID === 当前聊天ID();
    if (回合进行中() || 前台生成租约持有中()) {
      eventEmit(
        失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示',
        '内容正在生成，本次操作没有发生；请等当前正文或变量任务结束后再试。',
      );
      return Promise.resolve();
    }
    if (时间线切换协调中()) {
      eventEmit(失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示', '消息时间线正在切换，请稍等片刻再操作。');
      return Promise.resolve();
    }
    return 排队MVU操作(async () => {
      try {
        // 防御同调用栈之外的重入：本任务排队期间若专用已持锁路径开始了生成，也不再读旧整表。
        if (回合进行中() || 前台生成租约持有中()) {
          eventEmit(
            失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示',
            '内容正在生成，本次操作没有发生；请等当前正文或变量任务结束后再试。',
          );
          return;
        }
        if (!操作仍有效()) {
          eventEmit(失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示', '消息分支已经变化，请在新分支上重试。');
          return;
        }
        const 有效 = 读取最近有效();
        if (!有效) {
          eventEmit(失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示', '变量还没就绪,稍等两秒再试。');
          return;
        }
        const 活动剧情 = 读取活动场景剧情(有效.data);
        // 特殊场景和荣耀洞会暂借 `_待发送事件` 保存当前拍导演指令；它们不属于普通
        // 场景票，不能被安全操作壳误判后反向锁死自己的互动、补偿或收尾入口。
        const 普通场景票可见 = !有效.data.系统._特殊场景.id && 有效.data.系统._荣耀洞拍 < 0;
        const 等待剧情 = 普通场景票可见 ? 读取队首场景剧情(有效.data.系统._待发送事件) : null;
        const 等待剧情阻塞当前 = Boolean(
          等待剧情 &&
            (等待剧情.目标场景 === null || 场景剧情目标匹配(等待剧情.目标场景, 读场景().房间id ?? null)),
        );
        if ((活动剧情 || 等待剧情阻塞当前) && !允许场景剧情期间) {
          const 标题 = 活动剧情?.标题 ?? 等待剧情?.标题 ?? '当前场景剧情';
          const 地点 = 活动剧情?.目标场景 ?? 等待剧情?.目标场景 ?? null;
          eventEmit(
            失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示',
            地点 === null
              ? `旧记录「${标题}」缺少原场景，请先通过剧情提示确认恢复地点；本次操作没有发生。`
              : `「${标题}」还没有完成。请先在${场景剧情目标显示名(地点)}开始或重试这一幕。`,
          );
          return;
        }
        const 取消提交校验 = 登记MVU提交校验(操作仍有效);
        try {
          await fn(有效.raw, 有效.data, 操作仍有效);
          if (!操作仍有效() && !已不可逆提交()) throw new Error('消息分支已经变化，本次操作已取消。');
        } finally {
          取消提交校验();
        }
      } catch (e) {
        if (已不可逆提交()) {
          console.warn('[人妻公寓] 操作已经提交，时间线切换只取消后处理:', e);
          return;
        }
        console.error('[人妻公寓] UI 操作失败:', e);
        eventEmit(
          失败解锁 ? '人妻公寓:回合失败' : '人妻公寓:提示',
          `⚠ 操作没成(请截 F12 控制台给作者):${e instanceof Error ? e.message : String(e)}`,
        );
      }
    });
  }

  /**
   * 当面交互的脚本终审。UI 只负责藏按钮,真正扣道具/加钱前必须在这里再验一次，
   * 防止地图陈旧、跨 iframe 事件延迟或手工触发造成隔空送礼/隔空要钱。
   */
  function 要求当前地点(地点: string, 失败提示: string): boolean {
    if ((读场景().房间id ?? '') === 地点) return true;
    eventEmit('人妻公寓:提示', 失败提示);
    return false;
  }

  function 妻在当前场景(data: SchemaType, m: 门牌): boolean {
    const 场 = 读场景();
    if (!场.房间id || !data.户[m]) return false;
    if (m === '302' && 场.房间id === '302') return true;
    const 楼 = 当前楼层();
    // v0.80:新预约计划只有“赴约时段且场景等于约定地点”才放行当面动作;
    // 旧即时赴约仍照旧跟随玩家放行。
    if (读赴约们(楼, 场.房间id, data.系统._绝对时段, data).some(约 => 约.m === m)) return true;
    if (读粘滞(楼, 场.房间id).includes(m)) return true;
    return 妻位置推算(m, data.系统._绝对时段, data.户[m]) === 场.房间id;
  }

  function 读取角色近期正文(m: 门牌): string {
    return 构造角色近期正文(SillyTavern.chat ?? [], m, 提取正文舞台文本);
  }

  type 即时演出结果 = {
    提示: string;
    事件?: string;
    变动?: boolean;
    成功?: boolean;
    提交后?: () => void | Promise<void>;
  };

  function 父亲通话未完成(data: SchemaType): boolean {
    return Boolean(data.系统._父亲通话.标识 || data.系统._父亲通话.状态);
  }

  /**
   * 纯 UI 点击在共享前台槽内完成“业务结算 → 场景票/落库 → 正文演出”。生成槽必须
   * 在结算前取得；API 失败后业务结果与原场景票保留，只允许原地重试，不得二次结算。
   */
  async function 即时开演(
    结算: () => 即时演出结果 | Promise<即时演出结果>,
    raw: object,
    data: SchemaType,
    行动: string,
    应开演: (结果: 即时演出结果) => boolean = 结果 => Boolean(结果.事件 || 结果.变动),
    剧情选项: 场景剧情落地选项 = {},
  ): Promise<void> {
    const 即时操作世代 = 当前时间线切换世代();
    const 即时操作聊天ID = 当前聊天ID();
    const 即时操作仍有效 = () =>
      !时间线切换协调中() && 即时操作世代 === 当前时间线切换世代() && 即时操作聊天ID === 当前聊天ID();
    if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) {
      eventEmit('人妻公寓:提示', '当前特殊场景尚未结束，本次普通场景业务尚未发生。');
      return;
    }
    const 触发场景 = 读场景().房间id ?? null;
    const 起始等待队列 = data.系统._待发送事件;
    const 起始等待项 = 读取待发送事件队列(起始等待队列);
    const 已有活动 = 读取活动场景剧情(data);
    const 已有等待 = 读取队首场景剧情(起始等待队列);
    // 只有活动票、未知旧档或已经抵达当前地点的等待票会阻止新业务。目标在别处的
    // 搬入／线路预约继续排队，不得打断玩家眼前的场景，也不得让当前操作永久饥饿。
    if (已有活动 || 等待场景剧情阻塞当前场景(已有等待, 触发场景)) {
      const 标题 = 已有活动?.标题 ?? 已有等待?.标题 ?? '当前剧情';
      eventEmit('人妻公寓:提示', `「${标题}」还没有完成。本次业务尚未发生，请先处理原剧情。`);
      return;
    }
    if (父亲通话未完成(data)) {
      eventEmit('人妻公寓:提示', '父亲电话仍未结束。请先完成并挂断这通电话，本次业务尚未发生。');
      return;
    }
    if (全局数据库AI租约.在结算() || 手机节拍进行中() || 手机AI生成中()) {
      eventEmit('人妻公寓:提示', 'AI通道仍在处理其他内容，请等完成后再操作。本次业务尚未发生。');
      return;
    }
    const 前台租约 = 取得前台生成租约();
    if (!前台租约) {
      eventEmit('人妻公寓:提示', '还有内容正在生成，请等完成后再操作。本次业务尚未发生。');
      return;
    }
    const 票据目标场景 = 剧情选项.场景 !== undefined ? 剧情选项.场景 : 触发场景;
    let 租约已移交 = false;
    const 准备锁已广播 = true;
    // `结算()` 可能包含数据库查询等 await。先用无提示的瞬时锁冻结玩家点击时的真实场景，
    // 否则业务算完前快速换房，会把垃圾房／送礼剧情错误绑定到后来抵达的地点。
    eventEmit('人妻公寓:场景剧情准备状态', {
      进行中: true,
      标题: 剧情选项.标题 || '正在处理当前操作',
      目标场景: 票据目标场景 ?? 场景剧情楼道,
      显示提示: false,
    });
    try {
      const 结果 = await 结算();
      if (!即时操作仍有效()) {
        data.系统._待发送事件 = 起始等待队列;
        return;
      }
      if ((读场景().房间id ?? null) !== 触发场景) {
        eventEmit('人妻公寓:提示', '场景已经变化，本次业务没有提交。请回到原地点重新操作。');
        return;
      }
      const 候选等待项 = 读取待发送事件队列(data.系统._待发送事件);
      const 候选保留前缀 =
        候选等待项.length >= 起始等待项.length && 起始等待项.every((item, index) => 候选等待项[index] === item);
      if (起始等待项.length && !候选保留前缀) {
        // 远处等待票属于更早的已持久事务；即时生产者即使整串赋值也绝不能清掉旧剧情。
        // 不尝试“猜着合并”已破坏的候选，否则业务结算与导演票可能来自两套不同前提。
        data.系统._待发送事件 = 起始等待队列;
        console.error('[人妻公寓·场景剧情] 即时业务候选覆盖或改排了既有等待票，候选结果已放弃，没有写回。');
        eventEmit('人妻公寓:提示', '本次操作试图覆盖仍在等待的剧情，候选结果已放弃，没有写回。');
        return;
      }
      const 需要正文 = 结果.成功 !== false && 应开演(结果);
      const 专用特殊场景接管 = 需要正文 && Boolean(data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0);
      let 事务ID = '';
      let 事务请求世代 = 0;
      if (需要正文) {
        // 业务函数可能尾部追加、头部插入或整串赋值；只抽取相对操作开始前真正新增的
        // 导演内容。原有远处等待票由本层单独保存，不能被本次业务包进同一场戏或覆盖。
        const 业务内事件 = 提取新增待发送事件(起始等待队列, data.系统._待发送事件);
        const 导演内容 = 合并同场景剧情事件(业务内事件, 结果.事件);
        if (专用特殊场景接管) {
          // 专用特殊场景独占 `_待发送事件`。正常入口会在结算前拒绝任何普通等待票；
          // 若旧界面或并发路径仍带着预约到这里，失败关闭而不是覆盖那张票。
          if (起始等待队列) {
            data.系统._待发送事件 = 起始等待队列;
            eventEmit('人妻公寓:提示', '还有一段普通场景剧情在等待，本次特殊场景没有提交。');
            return;
          }
          // 录像带前置等多拍场景已有自己的阶段、地点与失败重试状态机；这里只保留它的
          // 当前导演拍，绝不能再叠一张普通场景事务票，否则第一拍失败后两套重试门会互锁。
          data.系统._待发送事件 = 导演内容;
          eventEmit('人妻公寓:场景剧情准备状态', {
            进行中: true,
            标题: 剧情选项.标题 || 场景剧情可见标题(导演内容, '当前特殊剧情'),
            目标场景: 票据目标场景 ?? 场景剧情楼道,
            显示提示: true,
          });
        } else {
          // 活动票成为队首；操作开始前已经存在的远处等待票原样跟在后面。
          data.系统._待发送事件 = 起始等待队列;
          const 激活 = 激活新增场景剧情(data, {
            标题: 剧情选项.标题 || 场景剧情可见标题(导演内容, '当前场景剧情'),
            目标场景: 票据目标场景,
            行动,
            触发楼层: 当前楼层(),
            内容: 导演内容,
          });
          if (!激活.成功) {
            eventEmit('人妻公寓:提示', 激活.提示);
            return;
          }
          事务ID = 激活.事务.id;
          事务请求世代 = 激活.事务.请求世代;
          eventEmit('人妻公寓:场景剧情准备状态', {
            进行中: true,
            标题: 激活.事务.标题,
            目标场景: 激活.事务.目标场景,
            显示提示: true,
          });
        }
      }

      if (!即时操作仍有效()) return;
      const 已落库 = await 落地(结果, raw, data, { ...剧情选项, 事件已登记: 需要正文 });
      if (!已落库 || !需要正文 || !即时操作仍有效()) return;
      if ((读场景().房间id ?? null) !== 触发场景) {
        if (事务ID) await 持久标记场景剧情待重试(事务ID, 事务请求世代, 即时操作仍有效);
        eventEmit('人妻公寓:提示', '业务结果已经保存，但场景随后发生变化。请返回原场景重试本段剧情。');
        return;
      }
      eventEmit(专用特殊场景接管 ? '人妻公寓:特殊场景状态' : '人妻公寓:场景剧情状态');
      租约已移交 = true;
      let 成功 = false;
      try {
        成功 = await 执行回合(行动, {
          已持MVU操作租约: true,
          预占前台生成租约: 前台租约,
          ...(事务ID
            ? { 场景剧情事务ID: 事务ID, 场景剧情请求世代: 事务请求世代, 预载场景剧情数据: data }
            : {}),
        });
      } finally {
        if (!成功 && 事务ID) await 持久标记场景剧情待重试(事务ID, 事务请求世代, 即时操作仍有效);
      }
    } finally {
      if (准备锁已广播) eventEmit('人妻公寓:场景剧情准备状态', { 进行中: false });
      // 没有进入正文回合（落库失败/纯提示）时仍由本层持有；一旦移交则统一由执行回合释放。
      if (!租约已移交) 前台租约.释放();
    }
  }

  async function 到场触发场景剧情(
    raw: object,
    data: SchemaType,
    场景原: string,
    操作仍有效: () => boolean = () => true,
  ): Promise<void> {
    if (!操作仍有效() || data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) return;
    const 当前场景 = 场景原 === '楼道' || !场景原 ? null : 场景原;
    const 活动 = 读取活动场景剧情(data);
    if (活动) {
      if (!场景剧情目标匹配(活动.目标场景, 当前场景)) {
        eventEmit(
          '人妻公寓:提示',
          `「${活动.标题}」已经在${场景剧情目标显示名(活动.目标场景)}触发，不能换到其他地点续演。`,
        );
      }
      return;
    }

    const waiting = 读取队首场景剧情(data.系统._待发送事件);
    if (!waiting) return;
    if (waiting.目标场景 === null) {
      eventEmit('人妻公寓:提示', `旧记录「${waiting.标题}」缺少可靠的原场景，请使用剧情提示中的兼容恢复按钮。`);
      return;
    }
    if (!场景剧情目标匹配(waiting.目标场景, 当前场景)) return;
    if (场景剧情需要玩家回应(waiting.内容)) {
      eventEmit('人妻公寓:场景剧情状态');
      eventEmit('人妻公寓:提示', `「${waiting.标题}」正在等你的回应，请留在这里从输入框继续。`);
      return;
    }
    if (父亲通话未完成(data)) {
      eventEmit('人妻公寓:提示', '父亲电话仍未结束。当前剧情保持等待，请先完成并挂断电话。');
      return;
    }
    if (全局数据库AI租约.在结算() || 手机节拍进行中() || 手机AI生成中()) {
      eventEmit(
        '人妻公寓:提示',
        `已到达${场景剧情目标显示名(waiting.目标场景)}，但 AI 通道仍忙；「${waiting.标题}」尚未激活，可稍后在此开始。`,
      );
      return;
    }
    const 前台租约 = 取得前台生成租约();
    if (!前台租约) {
      eventEmit('人妻公寓:提示', `还有内容正在生成；「${waiting.标题}」尚未激活，可稍后在此开始。`);
      return;
    }
    let 租约已移交 = false;
    let 准备锁已广播 = false;
    try {
      if (!操作仍有效()) return;
      if ((读场景().房间id ?? null) !== 当前场景) {
        eventEmit('人妻公寓:提示', `到场检查期间玩家已经离开；「${waiting.标题}」仍留在原地点等待，没有激活。`);
        return;
      }
      const 激活 = 激活队首场景剧情(
        data,
        当前场景,
        `（留在${场景剧情目标显示名(waiting.目标场景)}完成「${waiting.标题}」，只演这一张票）`,
        当前楼层(),
      );
      if (!激活.成功) {
        eventEmit('人妻公寓:提示', 激活.提示);
        return;
      }
      eventEmit('人妻公寓:场景剧情准备状态', {
        进行中: true,
        标题: 激活.事务.标题,
        目标场景: 激活.事务.目标场景,
      });
      准备锁已广播 = true;
      await 脚本写入(raw, data, { 记录成长: false, 当前绝对时段: data.系统._绝对时段 });
      if (!操作仍有效()) return;
      if ((读场景().房间id ?? null) !== 当前场景) {
        await 持久标记场景剧情待重试(激活.事务.id, 激活.事务.请求世代, 操作仍有效);
        eventEmit('人妻公寓:提示', `「${激活.事务.标题}」已经绑定原场景，请返回后再开始。`);
        return;
      }
      捕获保护快照(data);
      eventEmit('人妻公寓:提示', `正在触发「${激活.事务.标题}」，当前场景已锁定，请勿离开。`);
      eventEmit('人妻公寓:场景剧情状态');
      租约已移交 = true;
      let 成功 = false;
      try {
        成功 = await 执行回合(激活.事务.行动, {
          资源计费: false,
          已持MVU操作租约: true,
          预占前台生成租约: 前台租约,
          场景剧情事务ID: 激活.事务.id,
          场景剧情请求世代: 激活.事务.请求世代,
          预载场景剧情数据: data,
        });
      } finally {
        if (!成功) await 持久标记场景剧情待重试(激活.事务.id, 激活.事务.请求世代, 操作仍有效);
      }
    } finally {
      if (准备锁已广播) eventEmit('人妻公寓:场景剧情准备状态', { 进行中: false });
      if (!租约已移交) 前台租约.释放();
    }
  }

  async function 运行荣耀洞隔离拍(
    raw: object,
    data: SchemaType,
    行动: string,
    记录: 隔离回合记录,
    操作仍有效: () => boolean,
    标记荣耀洞静默切换: () => void,
    标记荣耀洞核心已提交: () => void,
  ): Promise<void> {
    const 导演事件 = 荣耀洞当前事件(data);
    if (!导演事件) {
      eventEmit('人妻公寓:回合失败', '荣耀洞事件状态已经结束。');
      return;
    }
    // 本拍开始前的 data 作为失败补偿值：首点已烧的冷却/摇签/当前拍必须保留，不能退回“使用前”。
    const 本拍前数据 = _.cloneDeep(data) as SchemaType;
    const 身份 = 捕获隔离时间线身份();
    let 隔离核心已提交 = false;
    try {
      const 线程 = '荣耀洞:' + data.系统._荣耀洞起时段 + ':' + data.系统._荣耀洞门牌;
      const 草稿 = await 生成隔离事件草稿({ 类型: '荣耀洞', 线程, 行动, 导演事件, 房间: '洗手间' });
      if (!草稿?.正文) throw new Error('荣耀洞事件没有生成正文');
      复核隔离时间线身份(身份, 操作仍有效);
      await 顺序提交隔离事件({
        草稿,
        记录,
        锚楼: 身份.锚楼,
        提交前数据: 本拍前数据,
        写核心: async () => {
          复核隔离时间线身份(身份, 操作仍有效);
          推进荣耀洞隔离拍(data);
          await 脚本写入(raw, data);
        },
        恢复核心: async () => {
          _.set(raw, 'stat_data', _.cloneDeep(本拍前数据));
          await 脚本写入(raw, _.cloneDeep(本拍前数据));
        },
        身份,
        操作仍有效,
      });
      隔离核心已提交 = true;
      标记荣耀洞核心已提交();
      try {
        捕获保护快照(data);
      } catch (后处理错误) {
        console.warn('[人妻公寓] 荣耀洞核心与日志已保存，但保护快照刷新失败:', 后处理错误);
      }
      try {
        eventEmit('人妻公寓:隔离事件完成', { 类型: '荣耀洞' });
      } catch (后处理错误) {
        console.warn('[人妻公寓] 荣耀洞核心与日志已保存，但完成广播失败:', 后处理错误);
      }
    } catch (e) {
      if (隔离核心已提交) {
        console.warn('[人妻公寓] 荣耀洞核心与日志已经提交，忽略提交后的呈现异常，不回滚本拍:', e);
        return;
      }
      if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
        标记荣耀洞静默切换();
        console.warn('[人妻公寓] 荣耀洞生成期间聊天已切换，旧请求不向新时间线发失败事件:', e);
        return;
      }
      console.error('[人妻公寓] 荣耀洞隔离事件失败:', e);
      const 原因 = e instanceof Error ? e.message : String(e);
      const 当前持久数据 = 读最近有效stat();
      const 场景仍保留 = 读场景().房间id === '洗手间' && 同一荣耀洞拍仍保留(当前持久数据, 本拍前数据);
      const 重试说明 = 场景仍保留 ? '；当前荣耀洞场景已保留，请在洗手间继续输入行动重试。' : '';
      eventEmit('人妻公寓:回合失败', `${原因}${重试说明}`);
    }
  }

  // 侦探系统的时间参数统一使用绝对时段；真实消息楼只负责聊天时间线。
  eventOn('人妻公寓:翻垃圾', (门牌号: 门牌) =>
    安全操作((raw, data) => {
      if (!要求当前地点('垃圾房', '请先到垃圾房，再选择要翻找的垃圾袋。')) return;
      return 即时开演(
        () =>
          接入线路(翻垃圾(data, 门牌号, data.系统._绝对时段, { 延迟软写: true }), data, {
            类型: '调查',
            门牌: 门牌号,
            标识: '翻垃圾',
          }),
        raw,
        data,
        `(在垃圾房翻查${户静态表[门牌号].妻名}家的垃圾袋，把翻到的东西悄悄收好)`,
        结果 => Boolean(结果.事件),
      );
    }),
  );

  // 母亲的阶段主题不进商店；走到 L4→L5 节点后，只能在 302/厨房当面开启。
  eventOn('人妻公寓:开启阶段性癖', (门牌号: 门牌) =>
    安全操作((raw, data) => {
      const 当前地点 = 读场景().房间id ?? '';
      if (门牌号 !== '302' || (当前地点 !== '302' && 当前地点 !== '厨房')) {
        eventEmit('人妻公寓:提示', '请先到 302 室或厨房，再开启这段剧情。');
        return;
      }
      return 即时开演(
        () => 准备开启阶段性癖(data, '302'),
        raw,
        data,
        '（在厨房里回应夏静秋，开启她的「哺育主题」剧情）',
      );
    }),
  );

  // P5 两渠道:打听(201,伴手礼盒弹药)/对饮(信任资源轴,202 漏酒话)
  eventOn('人妻公寓:打听', (门牌号: 门牌) =>
    安全操作((raw, data) => {
      if (!要求当前地点('大堂', '请先到一层大堂，再出门向街坊打听。')) return;
      return 即时开演(
        () => 打听(data, 门牌号, data.系统._绝对时段),
        raw,
        data,
        `(从一层大堂提着伴手礼盒出门，向街坊打听${户静态表[门牌号].妻名}家的事，随后回到大堂整理刚听见的话)`,
      );
    }),
  );
  eventOn('人妻公寓:对饮', (门牌号: 门牌) =>
    安全操作((raw, data) => {
      if (!要求当前地点(门牌号, `请先到${门牌号}室，再当面请他喝酒。`)) return;
      return 即时开演(
        () => 接入线路(对饮(data, 门牌号, data.系统._绝对时段), data, { 类型: '对饮', 门牌: 门牌号 }),
        raw,
        data,
        `(带着好酒当面与${户静态表[门牌号].夫名}对饮，留心他酒后说漏的家事)`,
      );
    }),
  );
  eventOn('人妻公寓:丈夫礼物', (载荷: { 门牌: 门牌; 道具id: 丈夫礼物 }) =>
    安全操作((raw, data) => {
      if (!要求当前地点(载荷.门牌, `请先到${载荷.门牌}室，再当面把礼物交给他。`)) return;
      return 即时开演(
        () => 赠礼丈夫(data, 载荷.门牌, 载荷.道具id),
        raw,
        data,
        `(当面把「${载荷.道具id}」送给${户静态表[载荷.门牌].夫名}，停下来等他回应)`,
      );
    }),
  );

  // 荣耀洞(P5+:洗手间末隔间;摇签起场三拍连场,离场即收束;世界机制统一读绝对时段)
  eventOn('人妻公寓:荣耀洞', () => {
    let 荣耀洞静默已切换 = false;
    let 荣耀洞核心已提交 = false;
    const 标记荣耀洞静默切换 = () => {
      荣耀洞静默已切换 = true;
    };
    const 标记荣耀洞核心已提交 = () => {
      荣耀洞核心已提交 = true;
    };
    return 安全操作(
      async (raw, data, 操作仍有效) => {
        if (父亲通话未完成(data)) {
          eventEmit('人妻公寓:提示', '请先完成并挂断父亲电话，再进入荣耀洞场景。');
          return;
        }
        if (!要求当前地点('洗手间', '请先进入公共洗手间，再使用末隔间里的设施。')) return;
        if (有场景剧情阻塞(data)) {
          eventEmit('人妻公寓:提示', '还有一段普通场景剧情在等待，不能同时开启荣耀洞连场。');
          return;
        }
        // 待办是软引导不硬锁(设计spec:荣耀洞入口只有地点门+冷却+摇签阶段门槛),不作为前置
        const 行动 = '(在公共洗手间末隔间闩上门,在荣耀洞前坐定,等候隔板另一侧的动静)';
        const 记录 = 建隔离记录('荣耀洞开始', 行动, data);
        const 结果 = 使用荣耀洞(data, data.系统._绝对时段);
        if (!结果.事件) {
          await 落地(结果, raw, data);
          return;
        }
        await 脚本写入(raw, data);
        捕获保护快照(data);
        eventEmit('人妻公寓:提示', 结果.提示);
        await 运行荣耀洞隔离拍(
          raw,
          data,
          行动,
          记录,
          操作仍有效,
          标记荣耀洞静默切换,
          标记荣耀洞核心已提交,
        );
      },
      false,
      () => 荣耀洞静默已切换 || 荣耀洞核心已提交,
    );
  });
  eventOn('人妻公寓:荣耀洞离场', () =>
    安全操作(async (raw, data) => {
      const 结果 = 荣耀洞离场(data);
      if (结果) await 落地(结果, raw, data);
    }),
  );

  // 世界时间只能从显式按钮推进：管理员室可推进/睡眠，302只可睡眠。事务落库前结束旧连续场景；按钮携带的
  // 预期水位会让操作队列中的第二次连点失败关闭，不可能重复推进。
  type 时间推进载荷 = { 预期绝对时段?: number };
  const 时间推进写入聊天键 = 时间推进事务恢复聊天键;

  function 写时间结束场景(vars: Record<string, unknown>, 房间: 时间推进地点, 当前消息楼: number): void {
    vars._场景 = {
      房间id: 房间,
      破门: false,
      非法进入: false,
      进房末楼: 当前消息楼,
      由头已用: false,
    };
    vars._粘滞 = null;
    vars._赴约 = null;
    vars._在场 = null;
    vars._行动选项 = [];
    vars._地图轨迹 = [];
    vars._无耗时拜访 = null;
    vars._上次回合 = null;
    vars._上次隔离回合 = null;
  }

  /** 晨跑、健身与小憩都由脚本直接结算；只有整夜睡眠保留独立 AI 演出。 */
  function 时间动作需要独立演出(方式: 时间推进方式): 方式 is '睡到次日早晨' {
    return 方式 === '睡到次日早晨';
  }

  /**
   * 睡眠回想只读少量近期正文，而且明确降格为“可能相关的素材”。独立生成不会创建聊天楼，
   * 这些片段与生成结果都不会进入正文历史或长期数据库。
   */
  function 读取睡前回想素材(data: SchemaType): string {
    const 当天 = 读取世界时间(data).天数;
    const 候选: string[] = [];
    for (let 楼层 = 1; 楼层 < (SillyTavern.chat?.length ?? 0); 楼层++) {
      const 消息 = SillyTavern.chat?.[楼层] as { is_user?: boolean; mes?: string } | undefined;
      if (!消息 || 消息.is_user || typeof 消息.mes !== 'string') continue;
      try {
        const 楼层绝对时段 = Number(
          _.get(Mvu.getMvuData({ type: 'message', message_id: 楼层 }), 'stat_data.系统._绝对时段'),
        );
        if (!Number.isInteger(楼层绝对时段) || 读取世界时间(楼层绝对时段).天数 !== 当天) continue;
      } catch {
        continue; // 不能证明属于今天的正文，不拿来诱导睡眠回想。
      }
      const 文本 = 提取正文舞台文本(消息.mes).slice(-420).trim();
      if (文本) 候选.push(文本);
    }
    return 候选
      .slice(-4)
      .map((文本, i) => `今天的可靠片段${i + 1}：${文本}`)
      .join('\n')
      .slice(-1800);
  }

  function 构造睡眠独立演出(
    data: SchemaType,
    地点: 时间推进地点,
    结束时间: ReturnType<typeof 读取世界时间>,
  ): { 类型: '睡眠'; 线程: string; 行动: string; 导演事件: string } {
    const 起始时间 = 读取世界时间(data);
    const 地点名 = 查房间(地点)?.名称 ?? 地点;
    const 时间说明 = `起点是第${起始时间.天数}天${起始时间.星期}${起始时间.时段}，结束时是第${结束时间.天数}天${结束时间.星期}${结束时间.时段}。`;
    const 共通纪律 =
      `地点始终是${地点名}。${时间说明}` +
      '这是一次独立的日常反馈，只演本次行动本身；不得凭空安排任何公寓住户、任务、偶遇、主线转折或数值奖励，' +
      '不得继续演行动结束后才可能发生的下一件事。控制在简短一幕内。';

    const 回想素材 = 读取睡前回想素材(data);
    const 回想纪律 = 回想素材
      ? `可从下列近期正文中挑选可靠内容，自由决定是否表现{{user}}睡前对今天的回想、评价或情绪；这只是可选方向，不要求固定总结格式，也不必每次都回想。` +
        `这些只是候选素材，无法确定属于今天的就不要引用，也不得替玩家新增关键决定、承诺或事实：\n${回想素材}`
      : '没有可靠的当天素材；只给出自然入睡、睡眠或醒来的方向，不得编造今天发生过的事情。';
    return {
      类型: '睡眠',
      线程: `日常睡眠:${地点}:${起始时间.绝对时段}`,
      行动: `（在${地点名}睡下，休息到次日早晨）`,
      导演事件: `${共通纪律}${回想纪律}可自由安排叙述重心与表达方式，不套固定流程或句式；最终保持在同一地点醒来。`,
    };
  }

  async function 恢复时间聊天备份(
    备份: 精确聊天快照,
    keys: readonly string[],
    预期聊天ID: string,
    事务ID?: string,
  ): Promise<void> {
    await Promise.resolve(
      updateVariablesWith(
        vars => {
          if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天后不能跨聊天恢复时间变量');
          if (事务ID) {
            const 记录 = 读取时间推进事务记录(vars[时间推进事务键]);
            if (!记录 || 记录.事务ID !== 事务ID) throw new Error('时间推进恢复记录已经变化');
          }
          恢复精确聊天快照(vars, 备份, keys);
          if (事务ID) delete vars[时间推进事务键];
          return vars;
        },
        { type: 'chat' },
      ),
    );
  }

  function 处理时间推进(方式: 时间推进方式, 载荷: 时间推进载荷): void {
    if (_时间推进中) {
      eventEmit('人妻公寓:提示', '时间正在推进，这次重复点击没有生效。');
      // 第二个窗口点进来只吃到提示,它自己的"发送中"锁靠这条结束事件解开;
      // 否则首个窗口若中途被销毁,另一个窗口会永久卡死(2026-08-03 审计 L8)
      eventEmit('人妻公寓:时间推进结束', false);
      return;
    }
    _时间推进中 = true;
    let 已提交 = false;
    void 安全操作(
      async (raw, data, 操作仍有效) => {
        const 当前房间 = 读场景().房间id;
        if (!当前房间) {
          eventEmit('人妻公寓:提示', '当前地点尚未就绪，时间没有推进。');
          return;
        }
        if (方式 === '睡到次日早晨' && 当前房间 !== '管理员室' && 当前房间 !== '302') {
          eventEmit('人妻公寓:提示', '只有回到管理员室或 302，才能睡到次日早晨。');
          return;
        }
        if (方式 === '小憩' && 当前房间 !== '管理员室' && 当前房间 !== '302') {
          eventEmit('人妻公寓:提示', '只有在管理员室或 302 才能小憩。');
          return;
        }
        if (方式 === '晨跑' && 当前房间 !== '晨跑公园') {
          eventEmit('人妻公寓:提示', '先到晨跑公园再开始训练。');
          return;
        }
        if (方式 === '健身' && 当前房间 !== '健身房') {
          eventEmit('人妻公寓:提示', '先进入健身房再开始锻炼。');
          return;
        }
        if (!data.系统._序章完成) {
          eventEmit('人妻公寓:提示', '先完成报到并开始这一局。');
          return;
        }
        if (data.系统._坏结局) {
          eventEmit('人妻公寓:提示', '这一局已经结束，不能再推进时间。');
          return;
        }
        if (正文租约生效中()) {
          eventEmit('人妻公寓:提示', '正文模型仍在生成或结算，请等这一轮结束。');
          return;
        }
        if (回合进行中()) {
          eventEmit('人妻公寓:提示', '当前正文回合仍在处理，请等这一轮结束。');
          return;
        }
        if (脚本写入中) {
          eventEmit('人妻公寓:提示', '游戏状态正在保存，请稍等片刻。');
          return;
        }
        if (隔离事件进行中()) {
          eventEmit('人妻公寓:提示', '当前独立事件仍在生成，请等它结束。');
          return;
        }
        if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) {
          eventEmit('人妻公寓:提示', '先结束当前特殊场景，再推进时间。');
          return;
        }
        if (data.系统._性爱场景.状态 !== '空闲') {
          eventEmit('人妻公寓:提示', '先把当前亲密场景正常收束，再安排训练或休息。');
          return;
        }
        if (data.系统._父亲通话.标识 || data.系统._父亲通话.状态) {
          eventEmit('人妻公寓:提示', '先把父亲这通电话处理完。');
          return;
        }
        if (_.get(getVariables({ type: 'chat' }), '_侦探.偷窥待选')) {
          eventEmit('人妻公寓:提示', '先处理眼前尚未选完的调查结果。');
          return;
        }
        const 活动剧情 = 读取活动场景剧情(data);
        if (活动剧情) {
          eventEmit(
            '人妻公寓:提示',
            `「${活动剧情.标题}」还没有完成。请留在${场景剧情目标显示名(活动剧情.目标场景)}重试；完成前不能推进时间。`,
          );
          return;
        }
        const 待到场剧情 = 读取队首场景剧情(data.系统._待发送事件);
        if (等待场景剧情阻塞当前场景(待到场剧情, 当前房间)) {
          eventEmit(
            '人妻公寓:提示',
            `还有一段剧情需要在${场景剧情目标显示名(待到场剧情!.目标场景)}发生：「${待到场剧情!.标题}」。请先完成当前地点的剧情，再推进时间。`,
          );
          return;
        }

        const 预期绝对时段 = Number(载荷?.预期绝对时段);
        if (!Number.isInteger(预期绝对时段) || 预期绝对时段 !== data.系统._绝对时段) {
          eventEmit('人妻公寓:提示', '时间已经更新，这次重复点击没有生效。');
          return;
        }
        const 当前消息楼 = 当前楼层();
        const 时间结束房间: 时间推进地点 =
          方式 === '推进一时段'
            ? 当前房间
            : 当前房间 === '302' || 当前房间 === '晨跑公园' || 当前房间 === '健身房'
              ? 当前房间
              : '管理员室';
        const 预期聊天ID = 当前聊天ID();
        if (!预期聊天ID) {
          eventEmit('人妻公寓:提示', '当前聊天身份尚未就绪，时间没有推进。');
          return;
        }
        const 有睡前丈夫登门 =
          方式 === '睡到次日早晨' &&
          (() => {
            同步丈夫登门排期(data);
            return Boolean(读取待触发丈夫登门(data));
          })();
        if (有睡前丈夫登门) {
          await 即时开演(
            () =>
              准备睡前丈夫登门(data, 查房间(当前房间)?.名称 ?? 当前房间, 当前房间) ?? {
                成功: false,
                提示: '丈夫登门排期已经变化，本次睡眠没有被拦截。',
              },
            raw,
            data,
            '（刚准备休息，门外忽然响起急促敲门声，起身开门处理丈夫来访）',
            结果 => Boolean(结果.事件),
            { 标题: '丈夫登门', 场景: 当前房间, 来源: '睡前丈夫登门' },
          );
          return;
        }
        const 时间请求 = {
          方式,
          预期绝对时段,
          当前消息楼,
          当前地点: 时间结束房间,
        } as const;
        // 只有睡眠会先调用独立 AI；晨跑、健身与小憩通过同一预检后由脚本直接结算。
        const 预检 = 预检时间推进(data, 时间请求);
        if (!预检.成功) {
          eventEmit('人妻公寓:提示', 预检.提示);
          return;
        }
        const 锚消息签名 = 手机锚消息签名(SillyTavern.chat?.[当前消息楼]);
        const 旧变量 = getVariables({ type: 'chat' });
        if (Object.prototype.hasOwnProperty.call(旧变量, 时间推进事务键)) {
          eventEmit('人妻公寓:提示', '上一次时间推进仍在恢复，请刷新当前聊天后再试。');
          return;
        }
        const 推进前数据 = _.cloneDeep(data) as SchemaType;
        const 推进前聊天 = 捕获精确聊天快照(旧变量, 时间撤销恢复聊天键);
        const 聊天事务备份 = 捕获精确聊天快照(旧变量, 时间推进写入聊天键);
        const 清场前聊天基线 = 时间聊天状态指纹(旧变量);
        const 时间事务记录: 时间推进事务记录 = 创建时间推进事务记录({
          聊天ID: 预期聊天ID,
          推进前数据,
          推进前聊天: 聊天事务备份,
        });
        let 聊天已改 = false;
        let 已进入双存储提交 = false;
        let 双存储已提交 = false;
        let 时间反馈草稿: 隔离事件草稿 | null = null;

        try {
          if (!操作仍有效()) throw new Error('消息分支已经变化，时间推进已取消');
          if (时间动作需要独立演出(方式)) {
            const 演出 = 构造睡眠独立演出(data, 时间结束房间, 预检.结束时间);
            时间反馈草稿 = await 生成隔离事件草稿({
              类型: 演出.类型,
              线程: 演出.线程,
              行动: 演出.行动,
              导演事件: 演出.导演事件,
              房间: 时间结束房间,
            });
            if (!时间反馈草稿?.正文) throw new Error(`${演出.类型}没有生成有效内容，时间与奖励均未结算。`);
            // 此时只有内存草稿，尚未写入任何聊天。它会与撤销点在同一个 chat 回调中提交，
            // 切换聊天/分支或 stat 结算失败都不会留下“演了却没有发生”的幽灵日志。
            if (!操作仍有效()) throw new Error('消息分支已经变化，时间推进已取消');
            if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间推进取消');
            eventEmit('人妻公寓:运行阶段', '正在结算时间与训练结果');
          }
          // 先留下持久恢复记录，再结束连续对话和赴约：入住检测由此把结束地点视为空闲场景。
          // 两者在同一次 chat 更新中完成；即使切换聊天直接重载 iframe，回到本聊天也能自动还原。
          await Promise.resolve(
            updateVariablesWith(
              vars => {
                if (!操作仍有效()) throw new Error('消息分支已经变化，时间推进已取消');
                if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间推进取消');
                if (时间聊天状态指纹(vars) !== 清场前聊天基线) {
                  throw new Error('时间推进准备期间聊天状态发生变化，请重新点击');
                }
                vars[时间推进事务键] = _.cloneDeep(时间事务记录);
                写时间结束场景(vars, 时间结束房间, 当前消息楼);
                // 旧点只能在本次事务完整失败时由聊天备份恢复；绝不能带进新 stat 成为假有效点。
                delete vars[时间撤销点键];
                聊天已改 = true;
                return vars;
              },
              { type: 'chat' },
            ),
          );
          if (!操作仍有效()) throw new Error('消息分支已经变化，时间推进已取消');
          if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间推进取消');
          // 自动对方手机内容、整表视图与晋阶镜像已由指纹规则排除；其余任何跨 iframe
          // chat 改写（含移动场景、玩家手机消息）都必须让本次提交失败并完整补偿。
          const 清场后聊天基线 = 时间聊天状态指纹(getVariables({ type: 'chat' }));

          const 候选 = _.cloneDeep(data) as SchemaType;
          const 结果 = 执行时间推进事务(候选, {
            ...时间请求,
            // 在清场后的最终聊天基线上冻结，避免时间事务读取到半笔并发手机消息。
            微信联系保护: 当前微信联系保护表(),
          });
          if (!结果.成功) {
            throw new Error(结果.提示);
          }

          // 新点只有在推进 stat 明确成功后才创建。点写入失败也不接受“时间走了但没有撤销点”
          // 的半提交，而是按 stat→chat 顺序补偿回推进前完整状态（含原来的旧点）。
          已进入双存储提交 = true;
          // 时间事务在后台可能生成早餐、时段线路等下一幕；除搬入预约外，都绑定到
          // 本次时间结束的真实地点。生成失败后只能原地重试，不能换房后改演。
          绑定新增待发送事件到场景(
            候选,
            推进前数据.系统._待发送事件,
            时间结束房间,
            item => 是入住登场事件(item),
          );
          await 执行时间推进双存储提交({
            写推进状态: async () => {
              if (!操作仍有效()) throw new Error('消息分支已经变化，时间推进已取消');
              if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间推进取消');
              作废当前手机时间线租约世代();
              await 脚本写入(raw, 候选, {
                记录成长: false,
                当前绝对时段: 候选.系统._绝对时段,
                场景剧情场景: 时间结束房间,
                场景剧情来源: '时间推进强制剧情',
                场景剧情楼层: 当前消息楼,
              });
            },
            写撤销点: async () => {
              if (!操作仍有效()) throw new Error('消息分支已经变化，时间推进已取消');
              if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间推进取消');
              await Promise.resolve(
                updateVariablesWith(
                  vars => {
                    if (!操作仍有效()) throw new Error('消息分支已经变化，时间推进已取消');
                    if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间推进取消');
                    if (时间聊天状态指纹(vars) !== 清场后聊天基线) {
                      throw new Error('时间推进提交期间聊天状态发生变化');
                    }
                    const 当前事务 = 读取时间推进事务记录(vars[时间推进事务键]);
                    if (!当前事务 || 当前事务.事务ID !== 时间事务记录.事务ID) {
                      throw new Error('时间推进恢复记录已经变化');
                    }
                    if (时间反馈草稿) 写入隔离事件草稿(vars, 时间反馈草稿, 当前消息楼);
                    // 日志删除与撤销点写入属于本次提交的一部分；同一个同步 updater 不会暴露中间态。
                    delete vars[时间推进事务键];
                    // 撤销入口只在四个合法地点出现，而离开结束地点必然改写 _场景/_地图轨迹并令
                    // 推进后聊天指纹失配。在非撤销地点“推进一时段”产生的点永远无法点到，只会
                    // 白占两份完整 MVU 快照——干脆不建(2026-08-03 审计 M5)。
                    if (是时间撤销地点(时间结束房间)) {
                      vars[时间撤销点键] = 创建时间撤销点({
                        聊天ID: 预期聊天ID,
                        锚楼: 当前消息楼,
                        锚消息签名,
                        方式,
                        推进前数据,
                        推进后数据: 候选,
                        推进前聊天快照: 推进前聊天,
                        推进后聊天变量: vars,
                      });
                    }
                    return vars;
                  },
                  { type: 'chat' },
                ),
              );
            },
            恢复推进前状态: async () => {
              if (!操作仍有效()) throw new Error('消息分支变化后不能跨分支补偿 MVU');
              if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天后不能跨聊天补偿 MVU');
              _.set(raw, 'stat_data', _.cloneDeep(推进前数据));
              作废当前手机时间线租约世代();
              await 脚本写入(raw, _.cloneDeep(推进前数据), {
                记录成长: false,
                当前绝对时段: 推进前数据.系统._绝对时段,
              });
            },
            恢复推进前聊天: async () => {
              if (!操作仍有效()) throw new Error('消息分支变化后不能跨分支补偿聊天变量');
              if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天后不能跨聊天补偿聊天变量');
              await 恢复时间聊天备份(聊天事务备份, 时间推进写入聊天键, 预期聊天ID, 时间事务记录.事务ID);
              聊天已改 = false;
            },
          });
          双存储已提交 = true;
          聊天已改 = false;
          已提交 = true;
          // 两份存储已经成功后，先不可逆地标记提交完成，再检查时间线。否则恰在 await 返回后
          // 切换聊天会被误报为“推进失败”，甚至走进不该执行的回滚分支。
          if (!操作仍有效() || 当前聊天ID() !== 预期聊天ID) {
            console.warn('[人妻公寓·时间] 时间已结算，但聊天已切换；保留待演强剧情供原聊天下次继续。');
            return;
          }
          捕获保护快照(候选);
          const 提示 = _.uniq([结果.提示, ...结果.资源提示, ...结果.经济提示, ...结果.线路提示].filter(Boolean));
          if (提示.length) eventEmit('人妻公寓:提示', 提示.join('\n'));
          eventEmit('人妻公寓:回合完成', { 更新正文幕: Boolean(时间反馈草稿) });
          const 后续剧情 = 读取队首场景剧情(候选.系统._待发送事件);
          if (后续剧情) {
            eventEmit('人妻公寓:场景剧情状态');
            // 时间已经提交，后续剧情另起一张场景票。只有设计地点就是时间结束地点时才自动
            // 尝试激活；否则保持等待，绝不能插进当前不相关场景。
            if (
              后续剧情.目标场景 !== null &&
              场景剧情目标匹配(后续剧情.目标场景, 时间结束房间)
            ) {
              setTimeout(() => eventEmit('人妻公寓:检查场景剧情', 时间结束房间), 0);
            }
          }
          setTimeout(() => void 冷落预警节拍(), 0);
        } catch (e) {
          if (已提交) {
            console.error('[人妻公寓·时间] 推进已提交，后处理失败但不反向回滚:', e);
            return;
          }
          if (!操作仍有效()) throw e;
          // 候选计算等发生在双存储提交之前的失败只改过清场 chat；提交阶段自身已负责完整补偿。
          if (!双存储已提交 && !已进入双存储提交 && 聊天已改 && 当前聊天ID() === 预期聊天ID) {
            try {
              await 恢复时间聊天备份(聊天事务备份, 时间推进写入聊天键, 预期聊天ID, 时间事务记录.事务ID);
            } catch (回滚错误) {
              throw new Error(
                `${e instanceof Error ? e.message : String(e)}；聊天回滚失败:${回滚错误 instanceof Error ? 回滚错误.message : String(回滚错误)}`,
              );
            }
          }
          throw e;
        }
      },
      false,
      () => 已提交,
    ).finally(() => {
      _时间推进中 = false;
      eventEmit('人妻公寓:时间推进结束', 已提交);
    });
  }

  function 处理撤销时间推进(): void {
    if (_时间推进中) {
      eventEmit('人妻公寓:提示', '时间事务正在处理，请稍等片刻。');
      // 同 处理时间推进:给被拒绝的那个窗口解开"发送中"锁(2026-08-03 审计 L8)
      eventEmit('人妻公寓:时间推进结束', false);
      return;
    }
    _时间推进中 = true;
    let 已提交 = false;
    void 安全操作(async (raw, data, 操作仍有效) => {
      if (正文租约生效中() || 回合进行中() || 脚本写入中 || 隔离事件进行中()) {
        eventEmit('人妻公寓:提示', '当前演出还没有结束，稍等片刻再撤销。');
        return;
      }

      const 预期聊天ID = 当前聊天ID();
      const 当前变量 = getVariables({ type: 'chat' });
      const 原撤销点 = _.cloneDeep(当前变量[时间撤销点键]);
      const 判定 = 当前时间撤销判定(data, 当前变量);
      if (!判定.有效) {
        // 旧版本、损坏或已过期的点一律失败关闭并清掉；绝不尝试“尽量恢复”。
        await Promise.resolve(
          updateVariablesWith(
            vars => {
              if (预期聊天ID && 当前聊天ID() !== 预期聊天ID) return vars;
              if (_.isEqual(vars[时间撤销点键], 原撤销点)) delete vars[时间撤销点键];
              return vars;
            },
            { type: 'chat' },
          ),
        );
        eventEmit('人妻公寓:提示', `没有可安全撤销的时间推进。${判定.原因}`);
        return;
      }

      const 当前房间 = 读场景().房间id;
      if (!是时间撤销地点(当前房间)) {
        eventEmit('人妻公寓:提示', '只有在管理员室、302 或刚完成训练的地点，才能撤销刚才的时间推进。');
        return;
      }
      if (!预期聊天ID || 预期聊天ID !== 判定.撤销点.聊天ID) {
        eventEmit('人妻公寓:提示', '当前聊天已经变化，不能撤销。');
        return;
      }

      const 撤销点 = 判定.撤销点;
      const 推进后数据 = _.cloneDeep(data) as SchemaType;
      const 推进前数据 = _.cloneDeep(撤销点.推进前数据) as SchemaType;
      const 推进后聊天备份 = 捕获精确聊天快照(当前变量, 时间撤销写入聊天键);
      let stat写入已开始 = false;
      let stat已恢复 = false;
      let 聊天已恢复 = false;
      let 镜像世代已作废 = false;

      try {
        if (!操作仍有效()) throw new Error('消息分支已经变化，时间撤销已取消');
        // 必须先作废手机租约与晋阶镜像世代再回 stat，避免旧异步任务在 ABA 回到
        // 相同时段后复活；第二步再精确恢复聊天键并做楼层+绝对时段双轴裁剪。
        stat写入已开始 = true;
        作废当前手机时间线租约世代();
        await 作废晋阶镜像时间线();
        镜像世代已作废 = true;
        await 脚本写入(raw, 推进前数据, {
          记录成长: false,
          当前绝对时段: 推进前数据.系统._绝对时段,
        });
        stat已恢复 = true;
        if (!操作仍有效()) throw new Error('消息分支已经变化，时间撤销已取消');
        if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间撤销取消');

        await Promise.resolve(
          updateVariablesWith(
            vars => {
              if (!操作仍有效()) throw new Error('消息分支已经变化，时间撤销已取消');
              if (当前聊天ID() !== 预期聊天ID) throw new Error('切换聊天导致时间撤销取消');
              // stat 已回到旧钟，使用暂存的推进后 data 对 chat 再复核一次，堵住两步间的玩家手机操作。
              const 当前楼 = 当前楼层();
              const 二次判定 = 判定时间撤销点(vars[时间撤销点键], {
                当前数据: 推进后数据,
                当前聊天变量: vars,
                当前聊天ID: 预期聊天ID,
                当前楼,
                当前锚消息签名: 手机锚消息签名(SillyTavern.chat?.[当前楼]),
              });
              if (!二次判定.有效) throw new Error(`撤销点在提交前失效:${二次判定.原因}`);
              恢复精确聊天快照(vars, 撤销点.推进前聊天, 时间撤销恢复聊天键);
              裁手机时间线(vars, 撤销点.锚楼, 撤销点.起始绝对时段);
              delete vars[时间撤销点键];
              聊天已恢复 = true;
              return vars;
            },
            { type: 'chat' },
          ),
        );
        if (!操作仍有效()) throw new Error('消息分支已经变化，时间撤销后处理已取消');

        清保护快照();
        捕获保护快照(推进前数据, false);
        已提交 = true;
        try {
          await 同步入住世界书条目(推进前数据, 操作仍有效);
        } catch (同步错误) {
          console.warn('[人妻公寓·时间] 撤销后世界书同步失败，下一个同步点会重试:', 同步错误);
        }
        eventEmit('人妻公寓:提示', '已撤销刚才的时间推进。');
        eventEmit('人妻公寓:回合完成', { 更新正文幕: false });
        setTimeout(() => void 冷落预警节拍(), 0);
      } catch (e) {
        if (!操作仍有效()) throw e;
        if (已提交) {
          console.error('[人妻公寓·时间] 撤销已提交，后处理失败但不反向回滚:', e);
          return;
        }
        const 补偿错误: string[] = [];
        // chat 恢复失败时必须把第一步已经回退的 stat 补偿写回；若 chat 已落盘后才抛错，
        // 再按精确快照恢复推进后聊天，回到事务开始前的完整状态。
        if ((stat写入已开始 || stat已恢复) && 当前聊天ID() === 预期聊天ID) {
          try {
            _.set(raw, 'stat_data', _.cloneDeep(推进后数据));
            作废当前手机时间线租约世代();
            await 脚本写入(raw, _.cloneDeep(推进后数据), {
              记录成长: false,
              当前绝对时段: 推进后数据.系统._绝对时段,
            });
          } catch (回滚错误) {
            补偿错误.push(`MVU 补偿失败:${回滚错误 instanceof Error ? 回滚错误.message : String(回滚错误)}`);
          }
        }
        if (聊天已恢复 || 镜像世代已作废) {
          if (当前聊天ID() === 预期聊天ID) {
            try {
              await 恢复时间聊天备份(推进后聊天备份, 时间撤销写入聊天键, 预期聊天ID);
            } catch (回滚错误) {
              补偿错误.push(`聊天补偿失败:${回滚错误 instanceof Error ? 回滚错误.message : String(回滚错误)}`);
            }
          }
        }
        捕获保护快照(推进后数据, false);
        if (补偿错误.length) {
          throw new Error(`${e instanceof Error ? e.message : String(e)}；${补偿错误.join('；')}`);
        }
        throw e;
      }
    }, false, () => 已提交, true).finally(() => {
      _时间推进中 = false;
      eventEmit('人妻公寓:时间推进结束', 已提交);
    });
  }

  eventOn('人妻公寓:推进时段', (载荷: 时间推进载荷) => 处理时间推进('推进一时段', 载荷));
  eventOn('人妻公寓:睡到次日早晨', (载荷: 时间推进载荷) => 处理时间推进('睡到次日早晨', 载荷));
  eventOn('人妻公寓:小憩', (载荷: 时间推进载荷) => 处理时间推进('小憩', 载荷));
  eventOn('人妻公寓:晨跑', (载荷: 时间推进载荷) => 处理时间推进('晨跑', 载荷));
  eventOn('人妻公寓:健身', (载荷: 时间推进载荷) => 处理时间推进('健身', 载荷));
  eventOn('人妻公寓:撤销时间推进', () => 处理撤销时间推进());

  // 地点只负责亮出 STORY 按钮；点击后后端复核场景并排一张剧情票，必须等有效正文成功提交才登记节点。
  eventOn(
    '人妻公寓:线路启动剧情',
    (载荷: { 地点: string; 门牌?: 门牌; 时段?: string; 预期目标阶段?: number; 预期节点?: number }) =>
      安全操作(async (raw, data) => {
        const 当前地点 = 读场景().房间id ?? '';
        const 拒绝 = (原因: string) => eventEmit('人妻公寓:回合失败', 原因);
        if (!当前地点 || 当前地点 !== 载荷?.地点) {
          拒绝('你已经不在这条关系剧情要求的地点，节点没有登记。');
          return;
        }
        if (!载荷?.门牌 || !data.户[载荷.门牌]) {
          拒绝('关系剧情的目标角色已经变化，请刷新界面后再试。');
          return;
        }
        if (回合进行中() || data.系统._待发送事件 || data.系统._特殊场景.id) {
          拒绝('眼下还有一场剧情正在进行，先把它演完。');
          return;
        }
        const 楼 = 当前楼层();
        const 其他妻 = 读粘滞(楼, 当前地点).filter(m => m !== 载荷.门牌);
        const 正在对话丈夫 = 读粘滞夫(楼, 当前地点);
        if (其他妻.length || 正在对话丈夫.length) {
          拒绝('你正在和其他角色交谈，先结束当前对话再展开这条关系剧情。');
          return;
        }
        const 妻名 = 户静态表[载荷.门牌].妻名;
        const 夫名 = 户静态表[载荷.门牌].夫名;
        const 准备 = 构造阶段线路剧情事件(
          data,
          {
            类型: '地点',
            地点: 当前地点,
            门牌: 载荷.门牌,
            时段: 当前时段(data),
            预期目标阶段: 载荷.预期目标阶段,
            预期节点: 载荷.预期节点,
            楼层: data.系统._绝对时段,
          },
          {
            数据库记忆: 读取数据库记忆胶囊([妻名, 夫名].filter(Boolean), 楼),
            近期正文: 读取角色近期正文(载荷.门牌),
          },
        );
        if (!准备.成功 || !准备.事件) {
          拒绝(准备.提示);
          return;
        }
        await 即时开演(
          () => ({ 成功: true, 提示: 准备.提示, 事件: 准备.事件, 变动: true }),
          raw,
          data,
          `(在${当前地点}继续${妻名}已经准备好的关系剧情，并等这段经历完整收束)`,
        );
      }),
  );

  // 偷窥退款改由隔离事务的四键精确快照承担；不再挂全局 回合失败 -> 清偷窥挂起()，
  // 避免精确恢复后再次清掉更早的合法挂起态（审计：监控事务恢复是唯一退款来源）。
  // ─────────────────────────────────────────────
  // 经济(P3):催租三选/要钱/金币/偷窃/运作道具——纯脚本结算走 落地 壳
  // ─────────────────────────────────────────────
  eventOn('人妻公寓:催租', (载荷: { 门牌: 门牌; 选择: '硬催' | '宽限' | '垫上' }) =>
    安全操作((raw, data) => {
      if (!要求当前地点(载荷.门牌, `请先到${载荷.门牌}室，再当面处理欠租。`)) return;
      const 妻名 = 户静态表[载荷.门牌].妻名;
      const 行动文案 = {
        硬催: `(当面把${妻名}家欠下的房租硬催了出来)`,
        宽限: `(给${妻名}批了一张缓交条,让她这个月先缓缓)`,
        垫上: `(悄悄替${妻名}家垫上了欠租)`,
      }[载荷.选择];
      return 即时开演(
        () => {
          const 结果 = 催租(data, 载荷.门牌, 载荷.选择);
          if (载荷.选择 !== '硬催') {
            接入线路(结果, data, {
              类型: '运作',
              门牌: 载荷.门牌,
              标识: 载荷.选择 === '垫上' ? '催租:代垫' : '催租:宽限',
            });
          }
          return 结果;
        },
        raw,
        data,
        行动文案,
        // 催租无强事件时仍只做本地提示/落库，不白跑一轮生成。
        结果 => Boolean(结果.事件),
      );
    }),
  );
  eventOn('人妻公寓:要钱', (门牌号: 门牌) =>
    安全操作(async (raw, data) => {
      if (!妻在当前场景(data, 门牌号)) {
        eventEmit('人妻公寓:提示', '人不在你身边,这话没法当面开口。');
        return;
      }
      await 即时开演(
        () => 要钱(data, 门牌号, 当前楼层()),
        raw,
        data,
        `(当面向${户静态表[门牌号].妻名}开口要钱,等她回应)`,
      );
    }),
  );
  eventOn('人妻公寓:捡金币', (房间id: string) =>
    安全操作((raw, data) => {
      const 地点 = String(房间id);
      if (!要求当前地点(地点, '请先到零钱所在的公共区域，再把它捡起来。')) return;
      return 落地(捡金币(data, 地点, 当前楼层()), raw, data);
    }),
  );
  eventOn('人妻公寓:处理管理任务', (载荷: { 任务id: string; 选项id: string; 地点: string }) => {
    if (_时间推进中) {
      eventEmit('人妻公寓:提示', '时间正在推进，请等地图刷新后再处理楼务。');
      return;
    }
    void 安全操作(async (_raw, data) => {
      if (_时间推进中) {
        eventEmit('人妻公寓:提示', '时间正在推进，请等地图刷新后再处理楼务。');
        return;
      }
      // `安全操作` 已阻止活动剧情及已经抵达当前地点的等待票；目标在其他场景的
      // 预约不得反向冻结这里的楼务，也绝不能再提示玩家用普通输入跨场演出。
      if (data.系统._特殊场景.id || 隔离事件进行中()) {
        eventEmit('人妻公寓:提示', '当前场景尚未结束，楼务任务暂不能开始。');
        return;
      }
      const 当前地点 = 读场景().房间id ?? '';
      if (当前地点 !== String(载荷?.地点 ?? '')) {
        eventEmit('人妻公寓:提示', '地点已经变化，请重新打开任务瓷砖。');
        return;
      }
      const 预检 = 预检管理任务(data, String(载荷?.任务id ?? ''), String(载荷?.选项id ?? ''), 当前地点);
      const 任务行动 = 预检.行动;
      if (!预检.成功 || !任务行动) {
        eventEmit('人妻公寓:提示', 预检.提示);
        return;
      }
      const 承接任务 = data.系统._管理考核.活跃任务.find(任务 => 任务.id === String(载荷?.任务id ?? ''));
      const 报事角色 = 承接任务?.门牌 ? 户静态表[承接任务.门牌 as 门牌]?.妻名 : '';
      const 微信承接硬约束 =
        承接任务 && 报事角色 && (承接任务.类型 === '报修' || 承接任务.类型 === '投诉')
          ? `\n【报事角色承接】${报事角色}记得是自己此前通过微信叫玩家来处理“${承接任务.模板}”；即使已经逾期也只是补办，不得表现成第一次听说或否认自己叫过玩家。不要补写任务通知之外的私聊内容。`
          : '';
      let 完成提示 = '';
      const 成功 = await 执行回合(任务行动, {
        资源计费: false,
        可重掷: false,
        已持MVU操作租约: true,
        系统注入: `【楼务硬事实｜只作本轮演出依据】\n${预检.事件 ?? ''}${微信承接硬约束}\n结果由脚本裁定；不要另造调查、回访或后续任务。`,
        成功结算: newData => {
          if ((读场景().房间id ?? '') !== 当前地点) throw new Error('楼务结算时地点已经变化');
          const 结算 = 结算管理任务(newData, 载荷.任务id, 载荷.选项id, 当前地点);
          if (!结算.成功 || !结算.变动) throw new Error(结算.提示 || '楼务任务未能提交');
          完成提示 = 结算.提示;
        },
      });
      if (成功 && 完成提示) eventEmit('人妻公寓:提示', 完成提示);
    });
  });
  eventOn('人妻公寓:空房偷窃', (门牌号: 门牌) =>
    安全操作((raw, data) =>
      即时开演(
        () => 空房偷窃(data, 门牌号, 当前楼层()),
        raw,
        data,
        `（留在${门牌号}室收拾刚才翻动抽屉留下的痕迹，承接住户察觉失窃后的变化）`,
        结果 => Boolean(结果.事件),
        { 标题: `${门牌号}室失窃余波`, 场景: 门牌号, 来源: '空房偷窃' },
      ),
    ),
  );
  eventOn('人妻公寓:使用运作', (载荷: { 道具id: string; 门牌?: 门牌; 预期目标阶段?: number; 预期节点?: number }) =>
    安全操作((raw, data) => {
      return 即时开演(
        () =>
          接入线路(使用运作(data, String(载荷.道具id), 载荷.门牌 ?? null, 当前楼层()), data, {
            类型: '运作',
            门牌: 载荷.门牌,
            标识: String(载荷.道具id),
            预期目标阶段: 载荷.预期目标阶段,
            预期节点: 载荷.预期节点,
          }),
        raw,
        data,
        `（安排并亲眼见证「${String(载荷.道具id)}」引发的关系剧情）`,
        结果 => Boolean(结果.事件?.includes('【阶段线路演出:')),
      );
    }),
  );
  eventOn('人妻公寓:使用资源道具', (道具id: string) =>
    安全操作((raw, data) => 落地(使用资源道具(data, String(道具id)), raw, data)),
  );
  eventOn('人妻公寓:性爱突然离场', () => 安全操作((raw, data) => 落地(结算性爱突然离场(data), raw, data)));
  eventOn('人妻公寓:切换性爱主焦点', (门牌号: 门牌) =>
    安全操作((raw, data) => 落地(切换性爱主焦点(data, 门牌号), raw, data)),
  );
  // 接听来电(P4 手机调用):态度分、待接清空、持久通话建立必须同一次落库。
  eventOn('人妻公寓:接听来电', (预期聊天ID: string) =>
    安全操作(() =>
      排队父亲通话整表写(async () => {
        // 双锁统一为“全局 MVU → 父亲通话”；取得内锁后必须重读，不能使用外锁入口的旧快照。
        const 有效 = 读取最近有效();
        if (!有效 || (预期聊天ID && 当前聊天ID() !== 预期聊天ID)) return;
        const { raw, data } = 有效;
        const 期 = data.系统._待接来电.期;
        const 结果 = 接听来电(data, 期 >= 0 ? `${期}:${当前楼层()}:${Date.now().toString(36)}` : '');
        if (!结果.成功) {
          // 陈旧来电页或连点不会重复加分；若已有活动通话，只把手机带回那一通。
          if (结果.标识) eventEmit('人妻公寓:来电已接', 结果.标识, 预期聊天ID);
          return;
        }
        await 脚本写入(raw, data);
        捕获保护快照(data);
        eventEmit('人妻公寓:来电已接', 结果.标识, 预期聊天ID);
      }),
      false,
      () => false,
      true,
    ),
  );
  /**
   * 手机侧先把微信完成行落好，再来这里原子完成：母亲线索归档 + 清活动通话。
   * 刷新若发生在此前，`收尾中` 会驱动手机重试；此写入一旦成功，电话结果、
   * 母亲线索进度与清锁必然同时成功，不会出现只清状态却漏线索。
   * 数据库长期记忆是后置副作用，不参与本事务。
   */
  eventOn('人妻公寓:父亲通话结束', (通话标识: string, 预期聊天ID: string) =>
    安全操作(() =>
      排队父亲通话整表写(async () => {
        const 有效 = 读取最近有效();
        if (!有效 || (预期聊天ID && 当前聊天ID() !== 预期聊天ID)) return;
        const { raw, data } = 有效;
        const 通话 = data.系统._父亲通话;
        if (!通话.标识) {
          eventEmit('人妻公寓:父亲通话已清理', String(通话标识 ?? ''), 预期聊天ID);
          return;
        }
        if (通话.标识 !== String(通话标识 ?? '') || 通话.状态 !== '收尾中') return;

        // 母亲线索是实际玩法进度：碎片、镜像与 toast 必须与清锁同原子完成。
        // 线索.提示 已是完整、可见、确定性的玩法反馈，不向 _待发送事件
        // 追加软内容，避免商店/楼务/时间/资源等无关系统被阻塞或污染。
        const 线索 = 母亲来电线索(data);
        const 线路消息 = 上报阶段线路事件(data, {
          类型: '运作',
          门牌: '302',
          标识: '父亲电话:完成',
          楼层: data.系统._绝对时段,
        });
        data.系统._父亲通话 = 空父亲通话();
        await 脚本写入(raw, data);
        try {
          await 线索?.提交后?.();
        } catch (后提交错误) {
          console.warn('[人妻公寓·父亲通话] 核心收尾已保存，但母亲线索镜像同步失败:', 后提交错误);
        }
        捕获保护快照(data);
        const 提示 = [线索?.提示, ...线路消息].filter((项): 项 is string => Boolean(项));
        if (提示.length) eventEmit('人妻公寓:提示', 提示.join('\n'));
        eventEmit('人妻公寓:父亲通话已清理', 通话标识, 预期聊天ID);
      }),
      false,
      () => false,
      true,
    ),
  );

  // ─────────────────────────────────────────────
  // 手机(P4:页面层独立设备,玉子同款挂载;游戏界面只有跳动指示与红点)
  // ─────────────────────────────────────────────
  eventOn('人妻公寓:开手机', (直达来电: boolean) => {
    const rawStat = 读最近有效stat();
    if (rawStat) {
      const data = Schema.parse(rawStat) as SchemaType;
      const 活动剧情 = 读取活动场景剧情(data);
      const 等待剧情 =
        !data.系统._特殊场景.id && data.系统._荣耀洞拍 < 0
          ? 读取队首场景剧情(data.系统._待发送事件)
          : null;
      const 等待剧情已到场 = Boolean(
        等待剧情?.目标场景 !== null &&
          等待剧情?.目标场景 !== undefined &&
          场景剧情目标匹配(等待剧情.目标场景, 读场景().房间id ?? null),
      );
      // 已经接通的父亲电话是更早建立的硬生命周期，仍允许重新打开完成收尾；
      // 等待票尚在其他地点时手机可照常使用，抵达设计地点后才与活动票一样暂停新内容。
      if ((活动剧情 || 等待剧情已到场) && !data.系统._父亲通话.标识) {
        const 标题 = 活动剧情?.标题 ?? 等待剧情?.标题 ?? '当前场景剧情';
        eventEmit('人妻公寓:提示', `「${标题}」还没有完成，请先留在设计场景完成这一幕。`);
        return;
      }
    }
    打开手机(!!直达来电);
  });
  eventOn('人妻公寓:来电已接', (通话标识: string, 预期聊天ID: string) =>
    来电已接(String(通话标识 ?? ''), String(预期聊天ID ?? '')),
  );
  eventOn('人妻公寓:父亲通话已清理', (通话标识: string, 预期聊天ID: string) =>
    父亲通话已清理(String(通话标识 ?? ''), String(预期聊天ID ?? '')),
  );
  eventOn('人妻公寓:同步孕产微信已读', () => {
    void 安全操作(async (raw, data) => {
      const 已公开 = 确认怀孕微信已送达(data, 怀孕确认微信已读凭据(data));
      const 已解锁医院 = 确认预产微信已读(data, 预产微信已读凭据(data));
      if (!已公开.length && !已解锁医院.length) return;
      await 脚本写入(raw, data, { 记录成长: false, 当前绝对时段: data.系统._绝对时段 });
      捕获保护快照(data);
      if (已解锁医院.length) eventEmit('人妻公寓:提示', '预产消息已经读过，医院地点现已开放。');
    }, false, () => false, true);
  });
  // 回合完成:红点/来电指示刷新 + 内容引擎节拍(朋友圈近期流/主动消息/群聊,全异步不占楼)
  eventOn('人妻公寓:回合完成', (选项?: { 跳过手机节拍?: boolean }) => {
    刷新红点();
    if (选项?.跳过手机节拍) {
      // 序章仍要把 101 报修的确定性微信落库，只跳过会占用正文生成槽的朋友圈/主动私聊 AI。
      const rawStat = 读最近有效stat();
      if (rawStat) {
        void 同步管理任务微信(Schema.parse(rawStat) as SchemaType).catch(错误 =>
          console.error('[人妻公寓·手机] 序章楼务通知同步失败，将由后续节拍重试:', 错误),
        );
      }
    } else {
      void 手机节拍();
    }
  });

  eventOn('人妻公寓:布设摄像头', (门牌号: 门牌) =>
    安全操作((raw, data) => {
      if (!要求当前地点(门牌号, `请先进入${门牌号}室，再寻找摄像头的安装位置。`)) return;
      const 房间 = 查房间(门牌号);
      if (房间?.类型 !== '户' || 门牌号 === '302' || !data.户[门牌号]) {
        eventEmit('人妻公寓:提示', '这里只能给已经入住的普通住户房间布设摄像头。');
        return;
      }
      if (门牌号 === '101' && 借种暂禁重装101(data)) {
        eventEmit('人妻公寓:提示', 'CAM-101已经为借种安排拆除；完成或放弃这次场景前不能重新装回。');
        return;
      }
      const 丈夫在场 = !!户静态表[门牌号].夫名 && 丈夫在楼(data.户[门牌号], 门牌号, data.系统._绝对时段) !== '外出';
      if (妻在当前场景(data, 门牌号) || 丈夫在场) {
        eventEmit('人妻公寓:提示', '屋里还有人，不能当着他们的面安装摄像头。');
        return;
      }
      return 落地(
        接入线路(布设摄像头(data, 门牌号), data, { 类型: '调查', 门牌: 门牌号, 标识: '安装摄像头' }),
        raw,
        data,
      );
    }),
  );

  eventOn('人妻公寓:拆除借种摄像头', () =>
    安全操作((raw, data) => {
      if (!要求当前地点('101', '请先等101无人并撬门进入，再拆除原来的观察点。')) return;
      const 场景 = 读场景();
      const 丈夫在场 = !!户静态表['101'].夫名 && 丈夫在楼(data.户['101'], '101', data.系统._绝对时段) !== '外出';
      const 目标房无人 = !妻在当前场景(data, '101') && !丈夫在场;
      const 结果 = 拆除借种摄像头(data, '101', 场景.破门 === true, 目标房无人);
      if (!结果.成功) {
        eventEmit('人妻公寓:提示', 结果.提示);
        return;
      }
      return 落地(结果, raw, data);
    }),
  );

  eventOn('人妻公寓:确认借种断线', () =>
    安全操作((raw, data) => {
      if (!要求当前地点('302', '请先回到302，再从自己的监控台确认101断线。')) return;
      const 结果 = 确认借种监控断线(data, '302');
      if (!结果.成功) {
        eventEmit('人妻公寓:提示', 结果.提示);
        return;
      }
      return 落地(结果, raw, data);
    }),
  );

  eventOn('人妻公寓:启动借种', () =>
    安全操作(async (raw, data) => {
      if (!要求当前地点('101', '请先亲自前往101，再开始这次家庭安排。')) return;
      const 户 = data.户['101'];
      const 夏乔在场 = 妻在当前场景(data, '101');
      const 陆嘉明在场 = !!户 && 丈夫在楼(户, '101', data.系统._绝对时段) !== '外出';
      if (!夏乔在场 || !陆嘉明在场) {
        eventEmit('人妻公寓:提示', '夏乔与陆嘉明必须同时真实在101，不能隔空启动借种结局。');
        return;
      }
      const 结果 = 启动借种结局(data, '101', 当前楼层());
      if (!结果.成功) {
        eventEmit('人妻公寓:提示', 结果.提示);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:提示', 结果.提示);
      eventEmit('人妻公寓:特殊场景状态');
      eventEmit('人妻公寓:借种CG', {
        文件: '借种_101三人赴约',
        标题: '借种结局 · 三人最后确认',
      });
      await 执行回合('（走进101，与夏乔和陆嘉明完成借种安排开始前的最后确认）', {
        已持MVU操作租约: true,
      });
    }),
  );

  eventOn('人妻公寓:停止借种', () =>
    安全操作(async (raw, data) => {
      if (!要求当前地点('101', '必须留在101现场，才能停止这次借种安排。')) return;
      const 结果 = 停止借种结局(data, '101');
      if (!结果.成功) {
        eventEmit('人妻公寓:提示', 结果.提示);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:提示', 结果.提示);
      eventEmit('人妻公寓:特殊场景状态');
    }),
  );

  eventOn('人妻公寓:查看借种阳性结果', () =>
    安全操作((raw, data) => {
      if (!要求当前地点('101', '请先按夏乔的邀请亲自来到101。')) return;
      return 即时开演(
        () => {
          const 户 = data.户['101'];
          const 夏乔在场 = 妻在当前场景(data, '101');
          const 陆嘉明在场 = !!户 && 丈夫在楼(户, '101', data.系统._绝对时段) !== '外出';
          const 结果 = 提交借种阳性结果(data, '101', 夏乔在场, 陆嘉明在场);
          return {
            ...结果,
            提交后:
              结果.成功 && 结果.CG
                ? () => eventEmit('人妻公寓:借种CG', { 文件: 结果.CG, 标题: '借种结局 · 阳性结果' })
                : undefined,
          };
        },
        raw,
        data,
        '（在101当面看夏乔准备的检测结果，与她和陆嘉明确认这个家庭事实）',
        结果 => Boolean(结果.事件),
        { 标题: '借种结局 · 阳性确认', 场景: '101', 来源: '借种阳性结果' },
      );
    }),
  );

  eventOn('人妻公寓:拍摄借种三人合照', () =>
    安全操作((raw, data) => {
      if (!要求当前地点('101', '三人合照只能在101的阳性确认现场拍下。')) return;
      const 户 = data.户['101'];
      const 夏乔在场 = 妻在当前场景(data, '101');
      const 陆嘉明在场 = !!户 && 丈夫在楼(户, '101', data.系统._绝对时段) !== '外出';
      return 即时开演(
        () => {
          const 结果 = 拍摄借种三人合照(data, '101', 夏乔在场, 陆嘉明在场);
          return {
            ...结果,
            提交后:
              结果.成功 && 结果.CG
                ? () => eventEmit('人妻公寓:借种CG', { 文件: 结果.CG, 标题: '借种结局 · 三人合照' })
                : undefined,
          };
        },
        raw,
        data,
        '（站到夏乔身边，和陆嘉明一起设好手机倒计时，亲手拍下三人合照）',
        结果 => Boolean(结果.事件),
        { 标题: '借种结局 · 三人合照', 场景: '101', 来源: '借种三人合照' },
      );
    }),
  );

  eventOn('人妻公寓:拍摄借种产后家庭合照', () =>
    安全操作((raw, data) => {
      const 当前地点 = 读场景().房间id ?? '';
      if (!['101', '医院'].includes(当前地点)) {
        eventEmit('人妻公寓:提示', '产后家庭合照只能在真实住院探望现场或出院后的101拍摄。');
        return;
      }
      const 户 = data.户['101'];
      const 夏乔在场 = 当前地点 === '医院' ? 户?.妻._生产.状态 === '住院中' : 妻在当前场景(data, '101');
      const 陆嘉明在场 =
        当前地点 === '医院' || (!!户 && 丈夫在楼(户, '101', data.系统._绝对时段) !== '外出');
      return 即时开演(
        () => {
          const 结果 = 拍摄借种产后家庭合照(data, 当前地点, 夏乔在场, 陆嘉明在场);
          return {
            ...结果,
            提交后:
              结果.成功 && 结果.CG
                ? () => eventEmit('人妻公寓:借种CG', { 文件: 结果.CG, 标题: '借种结局 · 产后家庭合照' })
                : undefined,
          };
        },
        raw,
        data,
        '（照顾好孩子的姿势，与夏乔、孩子和陆嘉明一起亲手拍下产后家庭合照）',
        结果 => Boolean(结果.事件),
        { 标题: '借种结局 · 产后家庭合照', 场景: 当前地点, 来源: '借种产后家庭合照' },
      );
    }),
  );

  eventOn('人妻公寓:借种朋友圈选择', (原选择: string) =>
    安全操作((raw, data) => {
      const 选择 = 原选择 === '发布' ? '发布' : 原选择 === '私密' ? '私密' : null;
      if (!选择) {
        eventEmit('人妻公寓:提示', '照片公开范围参数无效，本次没有提交。');
        return;
      }
      if (!要求当前地点('101', '照片公开范围只能由三个人留在101时当面决定。')) return;
      return 即时开演(
        () => {
          const 户 = data.户['101'];
          const 夏乔在场 = 妻在当前场景(data, '101');
          const 陆嘉明在场 = !!户 && 丈夫在楼(户, '101', data.系统._绝对时段) !== '外出';
          return 设置借种朋友圈选择(data, '101', 夏乔在场, 陆嘉明在场, 选择);
        },
        raw,
        data,
        选择 === '发布'
          ? '（和夏乔、陆嘉明一起确认朋友圈只使用计划板的安全裁切）'
          : '（和夏乔、陆嘉明一起确认完整三人合照保持私密）',
        结果 => Boolean(结果.事件),
        { 标题: '借种结局 · 照片公开范围', 场景: '101', 来源: '借种照片公开范围' },
      );
    }),
  );

  eventOn('人妻公寓:借种三人日常', () =>
    安全操作((raw, data) => {
      if (!要求当前地点('101', '三人的家庭日常只能在101当面展开。')) return;
      const 户 = data.户['101'];
      const 夏乔在场 = 妻在当前场景(data, '101');
      const 陆嘉明在场 = !!户 && 丈夫在楼(户, '101', data.系统._绝对时段) !== '外出';
      return 即时开演(
        () => 借种三人日常(data, '101', 夏乔在场, 陆嘉明在场),
        raw,
        data,
        '（留在101，和夏乔、陆嘉明一起过一段借种结局后的家庭日常）',
        结果 => Boolean(结果.事件),
        { 标题: '借种结局 · 三人日常', 场景: '101', 来源: '借种三人日常' },
      );
    }),
  );

  // 查看摄像头:排队偷窥场景事件后自动跑一回合(偷窥剧情由 AI 演出,选项卡在回合完成后弹出)
  eventOn('人妻公寓:查看摄像头', (门牌号: 门牌) => {
    if (门牌号 === '101') {
      const 当前 = 读最近有效stat();
      if (当前) {
        const data = Schema.parse(当前) as SchemaType;
        if (借种离线监控待确认(data)) {
          eventEmit('人妻公寓:确认借种断线');
          return;
        }
      }
    }
    // 局部静默标志：任一 await 后身份已变、旧聊天事务已留给启动恢复时置真，外壳据此不再向
    // 新聊天二次发失败事件（安全操作 第三个判据只对“已交接给启动恢复”的入口生效，不改全局）。
    let 静默已切换 = false;
    let 隔离核心已提交 = false;
    return 安全操作(
      async (raw, data, 操作仍有效) => {
        if (!要求当前地点('302', '请先回到302，再打开自己的监控画面。')) return;
        const 行动 = '(回到302关上门,悄悄调出' + 门牌号 + '室的摄像头画面,盯着看)';
        // 事务必须在 查看摄像头 之前建立：冷却/待选产生以前就已有四键恢复资料，切聊天也能退款。
        const 记录 = 建隔离记录('监控', 行动, data, 门牌号);
        const 身份 = 捕获隔离时间线身份();
        let 事务: 已准备隔离事务;
        try {
          事务 = await 准备隔离事件事务({
            身份,
            操作仍有效,
            提交前数据: 记录.data快照,
            提交前聊天: 记录.聊天快照精确,
          });
        } catch (准备错误) {
          // 准备阶段尚未调用 查看摄像头，无需退款；身份已变时旧聊天事务留待启动恢复，不发新聊天事件。
          if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
            静默已切换 = true;
            return;
          }
          console.error('[人妻公寓] 监控事务准备失败:', 准备错误);
          eventEmit('人妻公寓:回合失败', 准备错误 instanceof Error ? 准备错误.message : String(准备错误));
          return;
        }
        // 先只读预检当前关系线路。若“查看摄像头”正是当前节点，票据会被传给侦探层作为
        // 最高优先级：它绕过普通独处观察的软冷却与已见历史，不能被可选小功能饿死。
        const 调查预判: 调查演出准备结果 = 准备调查演出事件(data, {
          类型: '调查',
          门牌: 门牌号,
          标识: '查看摄像头',
        });
        const 调查票: 调查演出准备结果 = 调查预判.成功
          ? 准备调查演出事件(
              data,
              { 类型: '调查', 门牌: 门牌号, 标识: '查看摄像头' },
              {
                数据库记忆: 读取数据库记忆胶囊(
                  [户静态表[门牌号]?.妻名, 户静态表[门牌号]?.夫名].filter((名): 名 is string => Boolean(名)),
                  当前楼层(),
                ),
                近期正文: 读取角色近期正文(门牌号),
              },
            )
          : 调查预判;
        // 事务已就绪后才同步调用 查看摄像头：本次点击的软冷却/待选写入受同一事务保护。
        const 结果 = 查看摄像头(data, 门牌号, data.系统._绝对时段, {
          关系线路优先: 调查票.成功,
        });
        const 已确认有效查看 = Boolean((结果 as 侦探结果).线路动作成功);
        const 关系线路票可演 = 调查票.成功 && 已确认有效查看;
        if ('提示' in 结果 && !关系线路票可演) {
          // 普通提示/已确认/死路：事务覆盖整个点击——先在事务仍存在时接入线路并落地，落地成功
          // 且身份仍有效后才严格确认删除事务；落地失败则恢复入口 data快照并精确回滚四键。
          try {
            const 已落库 = await 落地(
              接入线路(结果, data, { 类型: '调查', 门牌: 门牌号, 标识: '查看摄像头' }),
              raw,
              data,
            );
            if (!已落库) {
              // 落地失败：恢复入口 data快照 + 精确回滚四键，本次点击整体取消。
              if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
                静默已切换 = true;
                console.warn('[人妻公寓] 监控收口期间聊天已切换，旧聊天事务留待恢复');
                return;
              }
              await 回滚隔离事件事务({
                事务: 事务.记录,
                身份,
                操作仍有效,
                恢复核心: async () => {
                  _.set(raw, 'stat_data', _.cloneDeep(记录.data快照));
                  await 脚本写入(raw, _.cloneDeep(记录.data快照));
                },
              });
              if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
                静默已切换 = true;
                console.warn('[人妻公寓] 监控收口回滚期间聊天已切换');
              }
              return;
            }
            // 落地成功且身份仍有效后才严格确认删除事务；确认失败且仍在本时间线时由确认函数立即
            // 恢复入口 data快照与四键；任一 await 后身份变化都停止，保留旧聊天事务。
            if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
              静默已切换 = true;
              console.warn('[人妻公寓] 监控收口期间聊天已切换，旧聊天事务留待恢复');
              return;
            }
            await 确认隔离事务无需隔离({
              事务: 事务.记录,
              身份,
              操作仍有效,
              恢复核心: async () => {
                _.set(raw, 'stat_data', _.cloneDeep(记录.data快照));
                await 脚本写入(raw, _.cloneDeep(记录.data快照));
              },
            });
            if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
              静默已切换 = true;
              console.warn('[人妻公寓] 监控收口确认后聊天已切换');
            }
          } catch (收口错误) {
            // 确认函数已自带补偿（恢复核心与四键），这里只处理呈现与身份边界：身份已变时旧聊天
            // 事务留给启动恢复，绝不向新聊天写/发事件。
            if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
              静默已切换 = true;
              console.warn('[人妻公寓] 监控收口期间聊天已切换，旧聊天事务留待恢复:', 收口错误);
              return;
            }
            console.error('[人妻公寓] 监控确认无需隔离失败:', 收口错误);
            eventEmit('人妻公寓:回合失败', 收口错误 instanceof Error ? 收口错误.message : String(收口错误));
          }
          return;
        }
        // 客户端已完成真实移动，脚本入口也复核为302；不能在扣冷却后再补写场景或吞掉写入失败。
        eventEmit('人妻公寓:监控回合');
        let 线路消息: string[] = [];
        const 家庭计划票 = { 结果: undefined as 家庭计划结果 | undefined, CG: '' };
        try {
          const 草稿 = await 生成隔离事件草稿({
            类型: '监控',
            线程: 关系线路票可演
              ? `监控线路:${门牌号}:${调查票.目标阶段!}:${调查票.节点!}`
              : '监控日常观察' in 结果
                ? `监控日常:${门牌号}:${结果.观察签名}`
                : `监控:${门牌号}:${(结果 as { 拍: number }).拍}`,
            行动,
            导演事件: 关系线路票可演 ? 调查票.事件! : (结果 as { 事件: string }).事件,
            房间: '302',
          });
          if (!草稿?.正文) throw new Error('监控事件没有生成正文');
          复核隔离时间线身份(身份, 操作仍有效);
          await 顺序提交隔离事件({
            草稿,
            记录,
            锚楼: 身份.锚楼,
            提交前数据: 记录.data快照,
            事务,
            写核心: async () => {
              复核隔离时间线身份(身份, 操作仍有效);
              if ('家庭计划节点' in 结果) {
                const 提交 = 提交家庭计划监控(data, 结果.家庭计划节点);
                if (!提交.成功 || !提交.变动) throw new Error(提交.提示 || '家庭计划监控未能提交');
                家庭计划票.结果 = 提交;
                家庭计划票.CG = 结果.CG;
              } else if (调查票.成功) {
                // 关系线路票：只消费冻结节点；正文已生成但票据失效时抛错，让现有事务整体回滚，
                // 不留“有正文但硬进度未提交”或“硬进度已提交但没正文”的半边。
                线路消息 = 提交调查演出事件(data, 调查票);
                if (!线路消息.length) throw new Error('调查演出票据已经失效，本拍事件未提交');
              } else if (!('监控日常观察' in 结果 && 结果.监控日常观察)) {
                // 裂缝确认前的专属调查仍保留既有上报；纯日常观察只负责状态反馈，绝不触碰
                // 裂缝、阶段线路、风闻或任何晋阶进度。
                线路消息 = 上报阶段线路事件(data, {
                  类型: '调查',
                  门牌: 门牌号,
                  标识: '查看摄像头',
                  楼层: data.系统._绝对时段,
                });
              }
              await 脚本写入(raw, data);
            },
            恢复核心: async () => {
              _.set(raw, 'stat_data', _.cloneDeep(记录.data快照));
              await 脚本写入(raw, _.cloneDeep(记录.data快照));
            },
            身份,
            操作仍有效,
          });
          隔离核心已提交 = true;
          try {
            捕获保护快照(data);
            if (线路消息.length) eventEmit('人妻公寓:提示', 线路消息.join('\n'));
            const 家庭计划提交 = 家庭计划票.结果;
            if (家庭计划提交) {
              eventEmit('人妻公寓:提示', 家庭计划提交.提示);
              播放家庭计划CG({ ...家庭计划提交, CG: 家庭计划票.CG });
              try {
                await 同步管理任务微信(data);
              } catch (通知错误) {
                console.error('[人妻公寓] 家庭计划微信同步失败，将由后续节拍重试:', 通知错误);
              }
            }
          } catch (后处理错误) {
            console.warn('[人妻公寓] 监控核心与日志已保存，但提交后呈现处理失败:', 后处理错误);
          }
          try {
            eventEmit('人妻公寓:隔离事件完成', { 类型: '监控', 门牌: 门牌号 });
          } catch (后处理错误) {
            console.warn('[人妻公寓] 监控核心与日志已保存，但完成广播失败:', 后处理错误);
          }
        } catch (e) {
          if (隔离核心已提交) {
            console.warn('[人妻公寓] 监控核心与日志已经提交，忽略提交后的呈现异常，不回滚本拍:', e);
            return;
          }
          // 事务精确快照是唯一退款来源；不再无条件 清偷窥挂起()/场景写回，避免精确恢复后
          // 再次清掉更早的合法挂起态，也避免切聊后旧栈读写新聊天。
          if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
            静默已切换 = true;
            console.warn('[人妻公寓] 监控生成期间聊天已切换，旧聊天事务记录留待恢复:', e);
            return;
          }
          try {
            await 回滚隔离事件事务({ 事务: 事务.记录, 身份, 操作仍有效 });
          } catch (回滚错误) {
            console.error('[人妻公寓] 监控隔离事件回滚失败:', 回滚错误);
          }
          // 回滚 await 期间可能切聊：只有身份仍有效才向当前聊天发失败事件，否则旧聊天事务留待启动恢复。
          if (!(操作仍有效() && 当前聊天ID() === 身份.聊天ID)) {
            静默已切换 = true;
            console.warn('[人妻公寓] 监控隔离事件回滚期间聊天已切换，旧聊天事务记录留待恢复:', e);
            return;
          }
          console.error('[人妻公寓] 监控隔离事件失败:', e);
          eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
        }
      },
      false,
      () => 静默已切换 || 隔离核心已提交,
    );
  });

  eventOn('人妻公寓:偷窥选细节', (载荷: { 门牌: 门牌; 选项: number }) =>
    安全操作((raw, data) => 落地(偷窥选细节(data, 载荷.门牌, Number(载荷.选项)), raw, data)),
  );

  // 考古(P4 双层广场硬编码层:手机微博个人主页触发)
  eventOn('人妻公寓:考古选细节', (载荷: { 门牌: 门牌; 序: number; 选项: number }) =>
    安全操作((raw, data) => 落地(考古选细节(data, 载荷.门牌, Number(载荷.序), Number(载荷.选项)), raw, data)),
  );
  eventOn('人妻公寓:查看旧动态', (载荷: { 门牌: 门牌; 序: number; 预期目标阶段?: number; 预期节点?: number }) =>
    安全操作((raw, data) => {
      return 即时开演(
        () =>
          接入线路({ 提示: '旧动态里的细节与当前关系线对上了。', 线路动作成功: true }, data, {
            类型: '调查',
            门牌: 载荷.门牌,
            标识: `旧动态复盘:${Number(载荷.序)}`,
            预期目标阶段: 载荷.预期目标阶段,
            预期节点: 载荷.预期节点,
          }),
        raw,
        data,
        `（重新翻看${户静态表[载荷.门牌].妻名}的旧动态，让画面里被忽略的细节完整显出来）`,
        结果 => Boolean(结果.事件?.includes('【阶段线路演出:')),
      );
    }),
  );
  eventOn('人妻公寓:考古到底', () => 安全操作((raw, data) => 落地(考古到底(data), raw, data)));

  eventOn('人妻公寓:读信', (门牌号: 门牌) =>
    安全操作((raw, data) => {
      const 当前场景 = 读场景().房间id ?? '';
      const 妻名 = 户静态表[门牌号]?.妻名 ?? 门牌号;
      return 即时开演(
        () => 读信揭晓(data, 门牌号),
        raw,
        data,
        `（留在${查房间(当前场景)?.名称 ?? 当前场景}展开拼合好的信，读完${妻名}一直藏着的真相）`,
        结果 => Boolean(结果.事件),
        { 标题: `${妻名}的信件真相`, 场景: 当前场景, 来源: '读信揭晓' },
      );
    }),
  );

  eventOn('人妻公寓:购买', (道具id: string) =>
    安全操作((raw, data) => {
      const id = String(道具id);
      if (查性癖(id)) {
        return 即时开演(() => 购买(data, id), raw, data, `（开启「${id}」的阶段主题剧情）`);
      }
      if (id === '安眠药') {
        return 即时开演(
          () => {
            const 结果 = 购买(data, id);
            if (结果.成功) 接入线路(结果, data, { 类型: '运作', 门牌: '302', 标识: id });
            return 结果;
          },
          raw,
          data,
          '（在当前地点确认安眠药带来的关系线路变化）',
          结果 => Boolean(结果.事件),
          { 标题: '关系剧情 · 安眠药', 场景: 读场景().房间id ?? null, 来源: '购买安眠药' },
        );
      }
      const 特殊场景 = 查特殊场景(id);
      if (特殊场景 && !特殊场景.待设计 && !特殊场景.启动) {
        const 当前场景 = 读场景().房间id ?? null;
        return 即时开演(
          () => 购买(data, id),
          raw,
          data,
          `（留在${场景剧情目标显示名(当前场景)}，让「${特殊场景.名称}」立即发生并完整收束）`,
          结果 => Boolean(结果.事件 || data.系统._待发送事件),
          { 标题: 特殊场景.名称, 场景: 当前场景, 来源: '买下即开演特殊场景' },
        );
      }
      return 落地(购买(data, id), raw, data);
    }),
  );
  eventOn('人妻公寓:家庭计划动作', (动作原: 家庭计划地点动作ID) => {
    if (_时间推进中) {
      eventEmit('人妻公寓:提示', '时间正在推进，请等地图刷新后再继续家庭计划。');
      return;
    }
    void 安全操作(async (raw, data) => {
      const 当前地点 = 读场景().房间id ?? '';
      const 动作 = String(动作原 ?? '') as 家庭计划地点动作ID;
      if (!家庭计划地点动作(data, 当前地点).some(item => item.id === 动作)) {
        eventEmit('人妻公寓:提示', '地点、日期或家庭计划状态已经变化，请重新查看房间动作。');
        return;
      }
      const 阻塞事件 = 取阻塞时间的待发送事件(data.系统._待发送事件);
      if (阻塞事件 || data.系统._特殊场景.id || 隔离事件进行中()) {
        eventEmit('人妻公寓:提示', '当前事件尚未结束，家庭计划暂不能继续。');
        return;
      }
      if (动作 !== '赴约') {
        const 结果 = 执行家庭计划地点动作(data, 动作, 当前地点);
        const 已落地 = await 落地({ 提示: 结果.提示, 变动: 结果.变动 }, raw, data);
        if (已落地 && 结果.成功) 播放家庭计划CG(结果);
        return;
      }

      const 完成票 = { 结果: undefined as 家庭计划结果 | undefined };
      const 成功 = await 执行回合('（按夏乔的微信邀约来到101，与陆嘉明谈孩子和家庭计划）', {
        资源计费: false,
        可重掷: false,
        已持MVU操作租约: true,
        系统注入: 家庭计划赴约系统注入(),
        成功结算: newData => {
          if ((读场景().房间id ?? '') !== '101') throw new Error('家庭计划赴约结算时地点已经变化');
          const 结果 = 提交家庭计划赴约(newData, '101', 当前楼层());
          if (!结果.成功 || !结果.变动) throw new Error(结果.提示 || '家庭计划赴约未能提交');
          完成票.结果 = 结果;
        },
      });
      const 完成结果 = 完成票.结果;
      if (成功 && 完成结果) {
        eventEmit('人妻公寓:提示', 完成结果.提示);
        播放家庭计划CG(完成结果);
      }
    });
  });

  eventOn('人妻公寓:生产动作', (载荷: { 门牌?: unknown; 动作?: unknown; 预期绝对时段?: unknown }) => {
    if (_时间推进中) {
      eventEmit('人妻公寓:提示', '时间正在推进，请等医院状态刷新后再操作。');
      return;
    }
    void 安全操作(async (raw, data) => {
      const 当前地点 = 读场景().房间id ?? '';
      const 门牌号 = String(载荷?.门牌 ?? '') as 门牌;
      const 动作 = String(载荷?.动作 ?? '') as 生产地点动作ID;
      if (当前地点 !== '医院' || !生产地点动作(data, 当前地点).some(item => item.门牌 === 门牌号 && item.id === 动作)) {
        eventEmit('人妻公寓:提示', '医院、病人或生产阶段已经变化，请重新查看行动瓷砖。');
        return;
      }
      if (data.系统._特殊场景.id || 隔离事件进行中() || 取阻塞时间的待发送事件(data.系统._待发送事件)) {
        eventEmit('人妻公寓:提示', '当前事件尚未结束，暂不能开始新的生产剧情。');
        return;
      }

      if (动作 === '等待生产') {
        // 等待生产会先提交时间与孩子硬事实，再启动不可重掷正文。必须在任何硬结算前
        // 预占共享前台槽，否则手机/数据库 AI 插队会造成“孩子已出生但演出没启动”的半结算。
        if (全局数据库AI租约.在结算() || 手机节拍进行中() || 手机AI生成中()) {
          eventEmit('人妻公寓:提示', '还有手机或数据库内容正在生成，请等完成后再等待生产。');
          return;
        }
        const 前台租约 = 取得前台生成租约();
        if (!前台租约) {
          eventEmit('人妻公寓:提示', '还有内容正在生成，请等完成后再等待生产。');
          return;
        }
        let 租约已移交 = false;
        try {
          const 事务 = 执行等待生产事务(data, {
            门牌: 门牌号,
            预期绝对时段: Number(载荷?.预期绝对时段),
            当前消息楼: 当前楼层(),
            当前地点,
            微信联系保护: 当前微信联系保护表(),
          });
          if (!事务.成功 || !事务.生产) {
            eventEmit('人妻公寓:提示', 事务.提示);
            return;
          }
          await 脚本写入(raw, data, { 记录成长: false, 当前绝对时段: data.系统._绝对时段 });
          捕获保护快照(data);
          eventEmit('人妻公寓:提示', 事务.提示);
          eventEmit('人妻公寓:生产CG', {
            文件: 产后图片键(门牌号, data.户[门牌号].妻._生产.本胎序号),
            标题: `${户静态表[门牌号].妻名} · 产后`,
          });
          租约已移交 = true;
          const 成功 = await 执行回合(`（留在医院陪${户静态表[门牌号].妻名}生产）`, {
            资源计费: false,
            可重掷: false,
            已持MVU操作租约: true,
            预占前台生成租约: 前台租约,
            系统注入: 生产动作系统注入(data, 门牌号, 动作),
            成功结算: newData => {
              const 结果 = 提交生产叙事完成(newData, 门牌号);
              if (!结果.成功) throw new Error('生产叙事票据已经失效');
            },
          });
          if (!成功)
            eventEmit('人妻公寓:提示', '生产硬结算已经保存；可在医院用“继续生产剧情”重试文案，不会再次推进时间。');
          return;
        } finally {
          // 未进入正文（预检失败、写入失败）仍由本层释放；一旦移交，执行回合接管所有路径。
          if (!租约已移交) 前台租约.释放();
        }
      }

      const 胎次 = data.户[门牌号].妻._生产.本胎序号;
      const 借种待产CG = 借种医院待产CG(data, 门牌号, 动作);
      const 生产CG载荷 = {
        文件: 动作 === '产后看望' || 动作 === '重试生产叙事' ? 产后图片键(门牌号, 胎次) : 待产图片键(门牌号, 胎次),
        标题: `${户静态表[门牌号].妻名} · ${动作}`,
      };
      const 成功 = await 执行回合(`（在医院${动作}${户静态表[门牌号].妻名}）`, {
        资源计费: false,
        已持MVU操作租约: true,
        系统注入: 生产动作系统注入(data, 门牌号, 动作),
        成功结算: newData => {
          const 结果 =
            动作 === '产前看望'
              ? 提交产前看望(newData, 门牌号)
              : 动作 === '留下陪产'
                ? 提交留下陪产(newData, 门牌号)
                : 动作 === '重试生产叙事'
                  ? 提交生产叙事完成(newData, 门牌号)
                  : 提交产后看望(newData, 门牌号);
          if (!结果.成功) throw new Error(结果.提示 || '生产剧情票据已经失效');
        },
      });
      if (成功) {
        // 这些动作的硬状态只在有效正文后提交；CG 同属可选副作用，必须跟随成功，
        // 不能在失败、取消或陈旧票据时提前泄露。
        if (借种待产CG) {
          eventEmit('人妻公寓:借种CG', {
            文件: 借种待产CG,
            标题: '借种结局 · 医院待产三人',
          });
        } else {
          eventEmit('人妻公寓:生产CG', 生产CG载荷);
        }
      } else {
        eventEmit('人妻公寓:提示', '剧情没有成功生成，生产状态未被消费，可以直接重试。');
      }
    });
  });

  eventOn('人妻公寓:同步家庭计划微信已读', () =>
    安全操作(async (raw, data) => {
      const 结果 = 确认家庭计划微信已读(data, 家庭计划微信已读());
      if (!结果.成功 || !结果.变动) return;
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:提示', 结果.提示);
    }),
  );
  eventOn('人妻公寓:使用录像带', () =>
    安全操作(async (raw, data) => {
      if (读场景().房间id !== '管理员室') {
        await 落地({ 提示: '只能在管理员室使用。' }, raw, data);
        return;
      }
      const 结果 = 启动录像带(data, 当前楼层());
      await 落地({ ...结果, 变动: 结果.成功 }, raw, data);
      if (结果.成功) eventEmit('人妻公寓:特殊场景状态');
    }),
  );
  eventOn('人妻公寓:录像带互动', (房间: '102' | '202') =>
    安全操作(async (raw, data) => {
      const 结果 = 通过录像带互动(data, 房间);
      if (!结果.成功) {
        eventEmit('人妻公寓:回合失败', 结果.提示);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      await 执行回合(`（调取${房间}室隐藏摄像头录像）`, { 已持MVU操作租约: true });
    }, true),
  );

  eventOn('人妻公寓:使用静音会议', () =>
    安全操作(async (raw, data) => {
      const 结果 = 打开静音会议筹备(data, 读场景().房间id ?? '');
      await 落地({ 提示: 结果.提示, 变动: 结果.成功 }, raw, data);
      // 成功与拒绝都通知客户端，避免本地先开的筹备层留下锁。
      eventEmit('人妻公寓:特殊场景状态');
    }),
  );

  eventOn('人妻公寓:取消静音会议筹备', () =>
    安全操作(async (raw, data) => {
      const 结果 = 取消静音会议筹备(data);
      await 落地({ 提示: 结果.提示, 变动: 结果.成功 }, raw, data);
      eventEmit('人妻公寓:特殊场景状态');
    }),
  );

  eventOn('人妻公寓:启动静音会议', (载荷: { 参与妻?: unknown; 议题?: unknown }) =>
    安全操作(async (raw, data) => {
      const 结果 = 启动静音会议(data, 载荷?.参与妻, 载荷?.议题, 读场景().房间id ?? '', 当前楼层());
      if (!结果.成功) {
        eventEmit('人妻公寓:提示', 结果.提示);
        eventEmit('人妻公寓:特殊场景状态');
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:提示', 结果.提示);
      eventEmit('人妻公寓:特殊场景状态');
      await 执行回合('（发出会议通知，主持所选夫妻入席并开始正式楼务会议）', { 已持MVU操作租约: true });
    }),
  );

  const 运行静音会议互动 = (载荷: { id?: unknown; 目标妻?: unknown; 模式?: unknown }, 使用补偿: boolean) =>
    安全操作(async (raw, data) => {
      if (静音会议私聊回复生成中()) {
        eventEmit('人妻公寓:回合失败', '会场微信回复还在生成，请等她回完这一条。');
        return;
      }
      const 结果 = 通过静音会议互动(data, 载荷 ?? {}, 使用补偿);
      if (!结果.成功) {
        eventEmit('人妻公寓:回合失败', 结果.提示);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:特殊场景状态');
      await 执行回合(`（会议控制交互 ${String(载荷?.id ?? '')} 已通过，继续固定下一拍）`, {
        已持MVU操作租约: true,
      });
    }, true);

  eventOn('人妻公寓:静音会议互动', (载荷: { id?: unknown; 目标妻?: unknown; 模式?: unknown }) =>
    运行静音会议互动(载荷, false),
  );
  eventOn('人妻公寓:静音会议互动补偿', (载荷: { id?: unknown; 目标妻?: unknown; 模式?: unknown }) =>
    运行静音会议互动(载荷, true),
  );
  eventOn('人妻公寓:静音会议互动失败', (载荷: { id?: unknown }) =>
    安全操作(async (raw, data) => {
      const 结果 = 记录静音会议互动失败(data, 载荷?.id);
      if (!结果.成功) {
        eventEmit('人妻公寓:提示', 结果.提示);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:特殊场景状态');
    }),
  );

  eventOn('人妻公寓:静音会议散会', (载荷: { 行动?: unknown; 会后妻?: unknown }) =>
    安全操作(async (raw, data) => {
      if (静音会议私聊回复生成中()) {
        eventEmit('人妻公寓:回合失败', '会场微信回复还在生成，请等她回完这一条。');
        return;
      }
      const 行动 = typeof 载荷?.行动 === 'string' ? 载荷.行动.trim() : '';
      if (!行动) {
        eventEmit('人妻公寓:回合失败', '请先写下你的散会总结。');
        return;
      }
      const 结果 = 选择静音会议散会名单(data, 载荷?.会后妻);
      if (!结果.成功) {
        eventEmit('人妻公寓:回合失败', 结果.提示);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:特殊场景状态');
      await 执行回合(行动, { 已持MVU操作租约: true });
    }, true),
  );

  eventOn('人妻公寓:结束静音会议', () =>
    安全操作(async (raw, data) => {
      if (静音会议私聊回复生成中()) {
        eventEmit('人妻公寓:回合失败', '会场微信回复还在生成，请等她回完这一条。');
        return;
      }
      const 结果 = 请求结束静音会议(data);
      if (!结果.成功) {
        eventEmit('人妻公寓:回合失败', 结果.提示);
        return;
      }
      await 脚本写入(raw, data);
      捕获保护快照(data);
      eventEmit('人妻公寓:特殊场景状态');
      await 执行回合('（主动结束本次会议，完成最终清理与离场收尾）', { 已持MVU操作租约: true });
    }, true),
  );

  eventOn('人妻公寓:送礼', (载荷: { 道具id: string; 门牌: 门牌 }) =>
    安全操作(async (raw, data, 操作仍有效) => {
      if (!妻在当前场景(data, 载荷.门牌)) {
        eventEmit('人妻公寓:提示', '她已经不在你身边了——东西没有送出。');
        return;
      }
      await 即时开演(
        async () => {
          const 结果 = await 送礼(data, String(载荷.道具id), 载荷.门牌, 操作仍有效);
          接入线路(结果, data, { 类型: '送礼', 门牌: 载荷.门牌, 标识: String(载荷.道具id) });
          return 结果;
        },
        raw,
        data,
        `(当面把「${String(载荷.道具id)}」递给${户静态表[载荷.门牌].妻名},停下来等她回应)`,
        结果 => Boolean(结果.事件 || data.系统._待发送事件),
        {
          标题: `${户静态表[载荷.门牌].妻名}的送礼回应`,
          场景: 读场景().房间id ?? '',
          来源: '当面送礼',
        },
      );
    }),
  );

  // 晋阶正戏与业务结算属于同一场景事务：先取得正文通道，再推进阶段和镜像；
  // 生成失败只保留这一张原场景票，绝不允许下一次晋阶把另一段正戏追加进来。
  // 晋阶也是原场景事务：先取得生成槽，再结算阶段；失败只重试正文，绝不把转折票留到别处。
  // 晋阶按钮：生成通道必须在任何阶段写入之前取得；正戏失败后锁在触发房间原地重试。
  eventOn('人妻公寓:请求晋阶', (门牌号: 门牌) =>
    安全操作((raw, data) => {
      if (!妻在当前场景(data, 门牌号)) {
        eventEmit('人妻公寓:提示', `请先与${户静态表[门牌号].妻名}处在同一现场，再完成这次关系转折。`);
        return;
      }
      return 即时开演(
        () => {
          if (!妻在当前场景(data, 门牌号)) {
            return { 成功: false, 提示: `请先在${门牌号}室与${户静态表[门牌号].妻名}当面相处，再触发关系转折。` };
          }
          if (/【转折正戏】|【药物首夜】|【早饭桌】/.test(data.系统._待发送事件)) {
            return { 成功: false, 提示: '刚跨过的那道坎还没来得及演——先完成当前剧情，再谈下一步。' };
          }
          const 结果 = 请求晋阶(data, 门牌号);
          if (!结果.成功) return { 成功: false, 提示: 结果.消息 };
          const 妻 = data.户[门牌号].妻;
          if (结果.动作 === '晋阶') {
            const 妻名 = 户静态表[门牌号].妻名;
            const 第一夜 =
              妻.当前阶段 === 3
                ? `这是她的第一夜——第一次真正背叛婚姻的性:关灯、心虚、战栗与自我厌恶都要在场。${首夜差分[门牌号] ?? ''}。`
                : '';
            const 事件 =
              `【转折正戏】这一楼是${妻名}越过心里那道坎的一楼——她刚进入「${阶段标题(妻.当前阶段, 门牌号)}」。` +
              `${第一夜}用一场符合她性格与你们当下关系的正戏演出这次跨越,张力给足,不要一笔带过`;
            const 绑定事件 = `${事件角色标记({ 在场妻: [门牌号] })}${事件}`;
            data.系统._待发送事件 = data.系统._待发送事件 ? `${data.系统._待发送事件}|${绑定事件}` : 绑定事件;
          }
          return { 成功: true, 提示: 结果.消息, 变动: true, 提交后: 结果.提交后 };
        },
        raw,
        data,
        `（留在当前位置完整回应${户静态表[门牌号].妻名}刚跨过的关系转折）`,
        () => Boolean(data.系统._待发送事件),
        { 标题: `${户静态表[门牌号].妻名}的关系阶段转折` },
      );
    }),
  );

  // ─────────────────────────────────────────────
  // 读阶段:原生开始票登记 + 注入公寓快照
  // ─────────────────────────────────────────────
  // 被拒原生正文的精确身份延迟停止：登记失败（共享槽冲突/数据库忙）时先安排停止、再广播
  // 提示；按聊天/世代/user 楼层与消息对象引用保护 stopGeneration。登记失败的正常不变量
  // 是“无票”：延迟执行时只要存在任何原生票（后来请求或不可证明归属），或切聊/切分支/user
  // 引用变化，绝不停止。停止延迟一帧执行，只终止这笔被拒的原生生成本身。
  const 原生拒绝停止 = (楼层: number, 用户消息引用: unknown) => {
    const 聊天ID = 当前聊天ID();
    const 时间线世代 = 当前时间线切换世代();
    setTimeout(() => {
      if (当前聊天ID() !== 聊天ID || 当前时间线切换世代() !== 时间线世代) return;
      if (当前楼层() !== 楼层 || SillyTavern.chat?.[楼层] !== 用户消息引用) return;
      if (读原生正文开始票() !== null) return; // 存在任何原生票即视为后来请求/不可证明归属：不得停止
      try {
        SillyTavern.stopGeneration();
      } catch (e) {
        console.error('[人妻公寓] 拒绝原生正文后的停止失败:', e);
      }
    }, 0);
  };

  // 宿主原生正文开始信号：只有本卡确认支持的原生正文（normal 玩家正文）才登记开始票。
  // dryRun、quiet、自动后台触发、固定 0 楼主回合/兼容广播、regenerate/swipe/continue
  // 都不得登记成玩家原生正文——它们要么由回合引擎与各自生成锁收口，要么现有处理器无法
  // 正确处理，认领正文租约会留下无所有者锁。
  eventOn(
    tavern_events.GENERATION_STARTED,
    (
      类型: string,
      选项: { automatic_trigger?: boolean; quiet_prompt?: string; quietToLoud?: boolean },
      dryRun: boolean,
    ) => {
      if (dryRun) return;
      // 0.88：关闭自动原生正文逃生路径。GENERATION_STARTED 无法可靠区分角色聊天、数据库兼容广播
      // 与游戏正文；游戏正式入口统一走执行回合()，不再让普通酒馆生成占用人妻公寓正文租约。
      return;
      if (回合进行中()) return; // 固定 0 楼主回合及数据库兼容广播不登记
      if (类型 !== 'normal') return; // 不扩张到 regenerate/swipe/continue/quiet/impersonate
      if (选项?.automatic_trigger || 选项?.quiet_prompt || 选项?.quietToLoud) return;
      const 楼层 = 当前楼层();
      const 末楼 = SillyTavern.chat?.[楼层];
      if (!末楼 || !末楼.is_user) return; // 兼容广播/regenerate 等末楼是 assistant，不登记
      // 数据库 AI 迟到租约：底层 callAI 无法取消，超时后仍占用 TavernHelper 生成槽；原生
      // normal 登记前也必须先查询，忙时不留票、按精确身份停止这笔原生请求。
      if (全局数据库AI租约.在结算()) {
        // 先安排精确停止、再广播失败提示：广播是可选呈现，监听器异常不得阻断硬收口。
        原生拒绝停止(楼层, 末楼);
        eventEmit('人妻公寓:回合失败', '数据库AI仍在结算上一轮请求，请稍等片刻再开始。');
        return;
      }
      const 聊天ID = 当前聊天ID();
      const 时间线世代 = 当前时间线切换世代();
      const 原生票 = 登记原生正文开始票({
        聊天ID,
        时间线世代,
        开始类型: 类型,
        用户楼层: 楼层,
        用户消息引用: 末楼,
      });
      if (!原生票) {
        // 共享前台生成槽被手机批次/在途小生成占用：登记失败不留任何开始票。先安排精确
        // 停止、再广播失败：广播是可选呈现，监听器异常不得阻断硬收口。延迟停止只有在
        // “当前无任何原生票”且聊天/世代/user 引用一致时才终止本笔被拒的原生请求。
        原生拒绝停止(楼层, 末楼);
        eventEmit('人妻公寓:回合失败', '手机后台消息正在生成，请稍等片刻再行动。');
        return;
      }
    },
  );

  eventOn(
    tavern_events.CHAT_COMPLETION_PROMPT_READY,
    async (event_data: { dryRun?: boolean; chat: SillyTavern.SendingMessage[] }) => {
      if (event_data?.dryRun) return; // 预热请求不注入
      // MVU“额外模型解析”会通过 generate/generateRaw 再触发一次 dryRun=false 的
      // PROMPT_READY。用 MVU 官方运行态精确识别该辅助请求：它只读取已经冻结的变量
      // 范围，不能递增正文令牌、清本轮事件或被误当成下一次剧情生成。
      if (typeof Mvu.isDuringExtraAnalysis === 'function' && Mvu.isDuringExtraAnalysis()) {
        console.info('[人妻公寓] 原生正文轮内的辅助模型请求沿用已冻结状态快照');
        return;
      }
      const 请求提示文本 = (event_data?.chat ?? [])
        .flatMap(项 => {
          const 内容 = (项 as { content?: unknown })?.content;
          if (typeof 内容 === 'string') return [内容];
          if (!Array.isArray(内容)) return [];
          return 内容.flatMap(片段 => {
            if (typeof 片段 === 'string') return [片段];
            if (!片段 || typeof 片段 !== 'object') return [];
            const 文本 =
              (片段 as { text?: unknown; content?: unknown }).text ??
              (片段 as { text?: unknown; content?: unknown }).content;
            return typeof 文本 === 'string' ? [文本] : [];
          });
        })
        .join('\n');
      // 身份判断：只有宿主 GENERATION_STARTED 登记过、同聊天同时间线的原生开始票才能认领
      // 正文租约。没有开始票的 PROMPT_READY（generate/generateRaw、数据库插件主 API 路由
      // 及其他辅助生成）一律视为辅助/后台请求，不得改正文令牌、正文冻结、事件基底或租约。
      const 原生票 = 读原生正文开始票();
      if (
        !原生票 ||
        原生票.阶段 !== '等待prompt' ||
        原生票.聊天ID !== 当前聊天ID() ||
        原生票.时间线世代 !== 当前时间线切换世代()
      ) {
        // 手机/隔离文本标记只作为无票辅助请求的防御证据：数据库插件/连接管理器在极少数
        // 情况下仍会把调用消息原样暴露在本事件的 chat 里。它们不拥有正文事件票，也不应
        // 递增正文令牌或占用正文租约，各自由自己的生成锁与 finally 收口。身份判断以宿主
        // GENERATION_STARTED 登记过的原生开始票为准，文本标记不再是唯一身份。
        if (请求提示文本.includes(手机生成请求标记) || 请求提示文本.includes(隔离事件请求标记)) {
          return;
        }
        return;
      }
      // 认领正文租约：当前末楼必须是票绑定的真实 user 楼。
      const 当前末楼层 = 当前楼层();
      if (当前末楼层 !== 原生票.用户楼层 || SillyTavern.chat?.[当前末楼层] !== 原生票.用户消息引用) return;
      const 本次原生轮owner = 认领正文租约({
        序号: 原生票.序号,
        聊天ID: 原生票.聊天ID,
        时间线世代: 原生票.时间线世代,
        用户楼层: 原生票.用户楼层,
        用户消息引用: 原生票.用户消息引用,
      });
      if (本次原生轮owner === null) return; // 票已被替换/作废/已认领：不得占租约
      const 本次原生轮令牌 = 读原生正文令牌();
      const 请求时间线世代 = 原生票.时间线世代;
      const 请求聊天ID = 原生票.聊天ID;
      const 请求用户楼层 = 原生票.用户楼层;
      const 请求用户消息引用 = 原生票.用户消息引用;
      const 原生请求仍有效 = () => {
        // 同轮异步身份：owner 仍是当前租约持有者且聊天/时间线/用户楼层/引用未变。
        if (
          租约owner仍有效(本次原生轮owner, {
            聊天ID: 请求聊天ID,
            时间线世代: 请求时间线世代,
            用户楼层: 请求用户楼层,
            用户消息引用: 请求用户消息引用,
          })
        ) {
          return true;
        }
        // 已被本次明确拒绝按 owner 释放（时间推进/隔离事件运行时）：只有仍未出现新原生票
        // 且令牌未被新轮改写时，延迟 stopGeneration 才应继续生效。
        return 读原生正文开始票() === null && 本次原生轮令牌 === 读原生正文令牌();
      };
      if (回合进行中()) {
        // 固定 0 楼主路径已接管隔离与手机锁；销毁原生逃生路径的旧墓碑，避免回档删楼后
        // 复用同一楼号时，把合法主路径 assistant 误认成曾被 stop 的迟到楼。
        作废原生正文租约();
        释放静音会议原生生成锁(false);
        清原生本轮冻结();
        return; // 主路径的注入走 generate injects,不走酒馆管道(两路互斥)
      }
      if (_时间推进中) {
        eventEmit('人妻公寓:回合失败', '时间正在推进，请等地图刷新后再行动。');
        // 明确拒绝时直接释放这笔原生正文租约，不能只靠 stopGeneration 的停止事件兜底
        // （API 失败/静默结束会遗留锁）。按本轮 owner 释放（不递增令牌），延迟停止仍按
        // 本轮身份生效；旧 owner 不会清掉之后新登记的原生票。
        释放正文租约(本次原生轮owner);
        释放静音会议原生生成锁(false);
        清原生本轮冻结();
        setTimeout(() => {
          if (!原生请求仍有效()) return;
          try {
            SillyTavern.stopGeneration();
          } catch (e) {
            console.error('[人妻公寓] 阻止时间事务期间的原生生成失败:', e);
          }
        }, 0);
        return;
      }
      if (隔离事件进行中()) {
        // 独立事件正在生成时真的出现一笔原生正文：明确拒绝并停止这笔原生请求，保护隔离
        // 事件与正文状态；只作废这笔原生开始票/租约，不触碰隔离事件自己的事务提交。
        eventEmit('人妻公寓:回合失败', '当前独立事件仍在生成，请等它结束。');
        释放正文租约(本次原生轮owner);
        释放静音会议原生生成锁(false);
        清原生本轮冻结();
        setTimeout(() => {
          if (!原生请求仍有效()) return;
          try {
            SillyTavern.stopGeneration();
          } catch (e) {
            console.error('[人妻公寓] 阻止隔离事件期间的原生生成失败:', e);
          }
        }, 0);
        return;
      }
      // 上一个原生请求若在酒馆侧异常中止，下一次真实请求会在这里自愈遗留锁。
      释放静音会议原生生成锁(false);
      清原生本轮冻结();
      _本轮焦点 = [];
      _本轮妻在场 = [];
      _本轮夫在场 = [];
      _本轮余波目标 = null;
      _本轮玩家文本 = '';
      try {
        const 楼层 = 原生票.预期助手楼层; // 当前末楼是刚发出的 user，快照描述即将落位的 assistant 楼
        // 毒快照防御+回退取楼(防护7/8):近10楼均无 stat_data → 跳过本轮,绝不造默认值
        const rawStat = 读最近有效stat();
        if (!rawStat) {
          console.warn('[人妻公寓] PROMPT_READY: 近10楼均无 stat_data,跳过快照捕获与注入');
          释放正文租约(本次原生轮owner);
          释放静音会议原生生成锁();
          return;
        }
        const data = Schema.parse(rawStat) as SchemaType;
        const 场景剧情位置 = 校验场景剧情位置(data, 读场景().房间id ?? '');
        if (!场景剧情位置.成功) {
          // 原生酒馆输入同样不得把旧 pending 带到其他房间演出。保存本次真实基底并留下
          // 精确助手楼墓碑；即使 stopGeneration 没有及时生效，迟到正文也不会消费剧情票。
          _静音会议原生因私聊阻断 = true;
          _静音会议原生基底 = _.cloneDeep(data) as SchemaType;
          _静音会议原生预期助手楼层 = 楼层;
          捕获保护快照(data);
          eventEmit('人妻公寓:回合失败', 场景剧情位置.提示);
          setTimeout(() => {
            if (!原生请求仍有效()) return;
            try {
              SillyTavern.stopGeneration();
            } catch (e) {
              console.error('[人妻公寓] 阻止错场强制剧情原生生成失败，冻结基底将拒绝消费:', e);
            }
          }, 0);
          return;
        }
        _静音会议原生生成中 = 静音会议正式运行中(data);
        _静音会议原生预期助手楼层 = _静音会议原生生成中 ? 楼层 : null;
        if (_静音会议原生生成中 && 静音会议私聊回复生成中()) {
          // 客户端入口会直接禁发；原生酒馆输入也必须在 prompt 阶段中止，不能让正文与
          // 会场私聊争写同一份摘要。冻结基底只是 stop 失败时的隔离兜底，不消费任何拍。
          _静音会议原生因私聊阻断 = true;
          _静音会议原生基底 = _.cloneDeep(data) as SchemaType;
          设置静音会议手机生成中(true);
          捕获保护快照(data);
          eventEmit('人妻公寓:回合失败', '会场微信回复还在生成，请等她回完这一条。');
          setTimeout(() => {
            if (!原生请求仍有效() || !_静音会议原生因私聊阻断) return;
            try {
              if (!SillyTavern.stopGeneration()) {
                console.warn('[人妻公寓] 原生静音会议与私聊并发：酒馆未确认停止生成，隔离基底将拒绝推进。');
              }
            } catch (e) {
              console.error('[人妻公寓] 停止原生静音会议生成失败，隔离基底将拒绝推进:', e);
            }
          }, 0);
          return;
        }
        if (data.系统._特殊场景.id) {
          // 原生酒馆输入是游戏内输入的逃生通道。所有特殊场景都必须像 UI 路径一样
          // 先过许可门并编译本拍；录像带等待瓷砖、会议筹备/交互/散会选择均不能绕过。
          const 特殊场景许可结果 = 特殊场景玩家行动前(data, 读场景().房间id);
          if (!特殊场景许可结果.成功) {
            // 复用原生拒绝墓碑：不仅会议，录像带等待瓷砖等拒绝也要保存预期助手楼。
            // 即使 stopGeneration 返回 false，迟到 assistant 仍会被物理清空并恢复此冻结基底。
            _静音会议原生因私聊阻断 = true;
            _静音会议原生基底 = _.cloneDeep(data) as SchemaType;
            _静音会议原生预期助手楼层 = 楼层;
            if (_静音会议原生生成中) 设置静音会议手机生成中(true);
            捕获保护快照(data);
            eventEmit('人妻公寓:回合失败', 特殊场景许可结果.提示);
            setTimeout(() => {
              if (!原生请求仍有效()) return;
              try {
                SillyTavern.stopGeneration();
              } catch (e) {
                console.error('[人妻公寓] 阻止非法原生特殊场景输入失败，隔离基底将拒绝推进:', e);
              }
            }, 0);
            return;
          }
        }
        _静音会议原生基底 = _静音会议原生生成中 ? (_.cloneDeep(data) as SchemaType) : null;
        if (_静音会议原生生成中) 设置静音会议手机生成中(true);
        _本轮事件基底 = _.cloneDeep(data) as SchemaType;
        _本轮场景id = 读场景().房间id ?? '';

        // 捕获保护快照(含 UI 写入;镜像同步在内,防护6/9)
        捕获保护快照(data);

        // 多模态 content 归一成纯文本供焦点扫描
        // 焦点识别只相信玩家消息与 AI 正文。system 中可能混有世界书、预设、数据库召回记忆及本游戏快照；
        // 它们仍照常发给 AI，但不得冒充“当前正在发生的剧情”。
        const 对话尾 = event_data.chat
          .filter(条 => 条.role === 'user' || 条.role === 'assistant')
          .map(条 => ({
            role: 条.role,
            content:
              typeof 条.content === 'string'
                ? 条.content
                : (条.content ?? []).map(块 => ('text' in 块 ? 块.text : '')).join('\n'),
          }));
        // 先只看真实持久态中的自然演员，再冻结唯一事件；登场预演角色不能反向阻挡自己的预约。
        const 自然人物 = 检测焦点(对话尾, data, 楼层, '');
        const 持续人物数 = _.uniq([...自然人物.妻在场, ...自然人物.夫在场]).length;
        const 原生普通场景票可见 = !data.系统._特殊场景.id && data.系统._荣耀洞拍 < 0;
        const 原生活动场景剧情 = 原生普通场景票可见 ? 读取活动场景剧情(data) : null;
        const 原生等待场景剧情 = 原生普通场景票可见 ? 读取队首场景剧情(data.系统._待发送事件) : null;
        const 原生当前场景 = 读场景().房间id ?? null;
        const 原生等待票阻塞当前 = 等待场景剧情阻塞当前场景(原生等待场景剧情, 原生当前场景);
        if (原生活动场景剧情 || 原生等待票阻塞当前) {
          const 标题 = 原生活动场景剧情?.标题 ?? 原生等待场景剧情?.标题 ?? '场景剧情';
          原生拒绝停止(楼层, SillyTavern.chat?.[楼层]);
          eventEmit(
            '人妻公寓:提示',
            原生活动场景剧情
              ? `「${标题}」只能在游戏界面原场景通过“重试本段剧情”继续。`
              : 原生等待场景剧情?.目标场景 === null
                ? `旧记录「${标题}」缺少可靠的原场景，请先在游戏界面确认恢复地点。`
                : `「${标题}」已经抵达设计地点，请在游戏界面点“开始本段剧情”。`,
          );
          return;
        }
        _本轮事件 = 冻结本轮事件(data, 楼层, 持续人物数);
        const 本楼事件 = _本轮事件.内容;
        const 演出data = 构造入住登场演出态(data, 本楼事件, 楼层);
        _本轮入住演出态 = _.cloneDeep(演出data) as SchemaType;
        const 本轮人物 = 检测焦点(对话尾, 演出data, 楼层, 本楼事件);
        _本轮焦点 = 本轮人物.焦点;
        _本轮妻在场 = 本轮人物.妻在场;
        _本轮夫在场 = 本轮人物.夫在场;
        _本轮快照刷新票 = 规划快照刷新(演出data, 本楼事件, 本轮人物);
        const 本轮用户文本 = [...对话尾].reverse().find(条 => 条.role === 'user')?.content ?? '';
        _本轮玩家文本 = 本轮用户文本;
        _本轮资源计费 = !本楼事件 && !data.系统._特殊场景.id && data.系统._荣耀洞拍 < 0;
        if (_本轮资源计费) {
          const 门槛 = 行动资源门槛(data, 本轮用户文本);
          if (!门槛.可行动) {
            释放正文租约(本次原生轮owner);
            eventEmit('人妻公寓:回合失败', 门槛.提示);
            setTimeout(() => {
              if (!原生请求仍有效()) return;
              try {
                SillyTavern.stopGeneration();
              } catch (e) {
                console.error('[人妻公寓] 阻止资源不足的原生生成失败:', e);
              }
            }, 0);
            return;
          }
        }
        const 本轮通讯行动 = /微信|消息|短信|电话|手机|联系|来电|打给|发给/.test(`${本轮用户文本}\n${本楼事件}`);
        if (!本楼事件 && !本轮通讯行动 && data.系统._荣耀洞拍 < 0 && !data.系统._特殊场景.id) {
          _本轮余波目标 = 选择自然在场余波目标(data, 筛选余波当面妻(data, _本轮妻在场, 本轮用户文本, 楼层));
        }

        // 组快照 + {{user}} 替换(防护24)
        const 快照 = 组公寓快照(对话尾, 演出data, 楼层, 本楼事件, 本轮人物, _本轮快照刷新票).replace(
          /\{\{user\}\}/g,
          getUserName(),
        );
        _本轮孕情初见提示 = 快照;

        // 幂等注入:清旧 marker 再插(防护25);末尾是 assistant prefill(Gemini)则插到它之前
        const chat = event_data.chat ?? [];
        const 只读变量场景 =
          Boolean(演出data.系统._坏结局) || 快照.includes('【特殊场景·独立结算】') || 是入住登场事件(本楼事件);
        _本轮变量范围 = 构造AI可写变量范围(演出data, _本轮焦点, _本轮妻在场, _本轮夫在场, {
          只读: 只读变量场景,
          亲密场景: !_本轮妻在场.some(门牌号 => 处于医院硬锁(演出data, 门牌号)) && 快照.includes('【尺度判定·详】'),
        });
        // 原生正文与 MVU 额外模型会分别组装请求。外置路线由 MVU 自己过滤 [mvu_update]
        // 条目，不能再把 fallback 变量基线塞回剧情模型；正文模型路线才覆盖本次请求。
        // 两段式写权：正文变量提示对本轮可写妻保持亲密候选叶子可见（覆盖自然升级/昵称/
        // 代词被预判为“简”的漏判），但精确范围记录不提前授权，提交仍由守护层授予。
        if (!读取MVU解析状态().外置模式)
          覆盖原生本轮变量视图(chat, 演出data, _本轮变量范围, 解析候选亲密妻(_本轮变量范围));
        for (let i = chat.length - 1; i >= 0; i--) {
          const c = chat[i].content;
          if (chat[i].role === 'system' && typeof c === 'string' && c.includes(SNAPSHOT_MARKER)) {
            chat.splice(i, 1);
          }
        }
        const 末条 = chat[chat.length - 1];
        if (末条 && 末条.role === 'assistant') {
          chat.splice(chat.length - 1, 0, { role: 'system', content: 快照 });
        } else {
          chat.push({ role: 'system', content: 快照 });
        }
        // 同时把精确范围落入 chat 变量，确保随后另起请求的 MVU 外置解析读取本轮演员。
        // 视图按本轮可写妻保持候选可见；记录仍写精确守护范围，候选不提前授权。
        const 视图已同步 = await 同步整表视图(
          演出data,
          原生请求仍有效,
          _本轮变量范围,
          楼层,
          解析候选亲密妻(_本轮变量范围),
        );
        if (!视图已同步) throw new Error('本轮变量状态快照同步失败，请重试');
      } catch (e) {
        console.error('[人妻公寓] PROMPT_READY 处理失败:', e);
        if (本次原生轮令牌 === 读原生正文令牌()) {
          释放正文租约(本次原生轮owner);
          释放静音会议原生生成锁();
          清原生本轮冻结();
        }
        eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
        setTimeout(() => {
          if (!原生请求仍有效()) return;
          try {
            SillyTavern.stopGeneration();
          } catch (停止错误) {
            console.error('[人妻公寓] 状态快照准备失败后停止原生生成失败:', 停止错误);
          }
        }, 0);
      }
    },
  );

  // ─────────────────────────────────────────────
  // 写阶段:回滚保护 + 事件转存 + 结算推进
  // ─────────────────────────────────────────────
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, async (新变量: object, 旧变量: object) => {
    const 活跃正文写回 = _静音会议原生正文写回租约;
    const 是当前正文写回嵌套事件 =
      活跃正文写回 !== null &&
      活跃正文写回.时间线世代 === 当前时间线切换世代() &&
      活跃正文写回.聊天ID === 当前聊天ID() &&
      活跃正文写回.楼层 === 当前楼层() &&
      SillyTavern.chat?.[活跃正文写回.楼层] === 活跃正文写回.消息引用 &&
      手机锚消息签名(SillyTavern.chat?.[活跃正文写回.楼层]) === 活跃正文写回.消息签名;
    if (脚本写入中 || 回合进行中() || 是当前正文写回嵌套事件 || 时间线切换协调中()) return; // 主路径的解析/回滚/结算在回合引擎内完成
    const 本次原生变量事务 = ++_原生变量事务序号;
    const 原生本轮令牌 = 读原生正文令牌();
    // 回调开始时生效的正文租约 owner；null 表示手动重处理/辅助模型事件等非正文结算路径。
    // 后续所有 释放正文租约 只按该 owner 生效，旧 owner 绝不清掉之后新登记的原生票。
    const 原生租约owner = 读当前租约owner();
    const 原生时间线世代 = 当前时间线切换世代();
    const 原生聊天ID = 当前聊天ID();
    const 末楼层 = 当前楼层();
    const 末楼 = SillyTavern.chat?.[末楼层];
    let 预期末楼消息签名 = 手机锚消息签名(末楼);
    const 刷新预期末楼消息签名 = () => {
      预期末楼消息签名 = 手机锚消息签名(末楼);
    };
    const 原生事务仍有效 = () =>
      本次原生变量事务 === _原生变量事务序号 &&
      原生本轮令牌 === 读原生正文令牌() &&
      (!原生租约owner || 原生租约owner === 读当前租约owner()) &&
      原生时间线世代 === 当前时间线切换世代() &&
      当前聊天ID() === 原生聊天ID &&
      当前楼层() === 末楼层 &&
      SillyTavern.chat?.[末楼层] === 末楼 &&
      手机锚消息签名(SillyTavern.chat?.[末楼层]) === 预期末楼消息签名;
    const 确认原生事务有效 = () => {
      if (!原生事务仍有效()) throw new Error('__RQGY_TIMELINE_CHANGED__');
    };
    const 同步原生整表视图 = async (data: unknown, 保留候选 = true) => {
      确认原生事务有效();
      // 租约生效期间视图保持本轮可写妻的亲密候选可见（解析/生成途中被各早退分支重写
      // 也不会掉候选），记录仍写精确守护范围；手动重处理（无租约）走精确旧记录。
      // 结算收口的最终视图按 保留候选=false 使用扩展后的精确范围，与回合引擎一致。
      await 同步整表视图(
        data,
        原生事务仍有效,
        正文租约生效中() ? _本轮变量范围 : undefined,
        正文租约生效中() ? 末楼层 : undefined,
        正文租约生效中() && 保留候选 ? 解析候选亲密妻(_本轮变量范围) : undefined,
      );
      确认原生事务有效();
    };
    标记原生变量事务开始();
    let 保留静音会议生成锁 = false;
    let 保留本轮冻结 = false;
    let 临时入住保护已启用 = false;
    try {
      确认原生事务有效();
      // 毒快照防御(防护7):stat_data 缺失时绝不 parse({}) 造默认值写回
      const rawStat = _.get(新变量, 'stat_data');
      const 静音会议基底 =
        (_静音会议原生生成中 || _静音会议原生因私聊阻断) && _静音会议原生基底
          ? (_.cloneDeep(_静音会议原生基底) as SchemaType)
          : null;
      if ((!rawStat || _.isEmpty(rawStat)) && !静音会议基底) {
        console.warn('[人妻公寓] VARIABLE_UPDATE_ENDED: stat_data 缺失,跳过处理');
        return;
      }
      // 末楼 is_user 一律放行(防护14,秦璐 0.39 根因):MESSAGE_SENT 也触发本事件,
      // 用户楼变量是 MVU 刚从上一楼(含全部 UI 写入)拷贝的真值,既不该被旧快照盖回,
      // 也不该被当成 AI 楼推进引擎
      // 逃生舱原生发送:MESSAGE_SENT 后、prompt 组装前,用刚拷贝的真值刷一次整表视图
      if (末楼?.is_user) {
        // 极端事件时序下 PROMPT_READY 可能先于用户楼的变量事件：这仍不是 AI 成功楼，
        // 不能提前推进，也不能释放贯穿生成期的手机互斥锁。
        保留静音会议生成锁 = 静音会议基底 !== null;
        保留本轮冻结 = _本轮事件 !== null;
        if (rawStat && !_.isEmpty(rawStat)) await 同步原生整表视图(rawStat);
        return;
      }
      const 是预期静音会议助手楼 =
        静音会议基底 !== null && _静音会议原生预期助手楼层 !== null && 末楼层 === _静音会议原生预期助手楼层;
      if (静音会议基底 && !是预期静音会议助手楼) {
        // 例如重生成被拦截后，手机摘要先触发变量事件，而末楼仍是既有 assistant。
        // 它不是本次请求的新楼：不清正文、不推进，也不提前丢掉阻断墓碑。
        保留静音会议生成锁 = true;
        保留本轮冻结 = _本轮事件 !== null;
        if (rawStat && !_.isEmpty(rawStat)) await 同步原生整表视图(rawStat);
        return;
      }
      const 本轮冻结 = _本轮事件?.楼层 === 末楼层 ? _本轮事件 : null;
      const 本楼事件 = 本轮冻结?.内容 ?? '';
      const 本轮有效正文 = 提取静音会议可提交正文(应用酒馆最终显示正则(String(末楼?.mes ?? '')));
      const 静音正文 = 静音会议基底 ? 本轮有效正文 : null;
      if (静音会议基底 && _静音会议原生因私聊阻断) {
        // 这次原生发送已在 prompt 阶段明确拒绝；即使酒馆仍落楼，也不保留越过互斥门的正文。
        await 物理写回静音会议原生正文('', 末楼层, 末楼, 原生事务仍有效, 刷新预期末楼消息签名);
      } else if (静音会议基底 && !静音正文) {
        // 空响应、纯思考块或纯变量块都不算成功正文；事件保持待发送，玩家可原拍重试。
        await 物理写回静音会议原生正文('', 末楼层, 末楼, 原生事务仍有效, 刷新预期末楼消息签名);
        _.set(新变量, 'stat_data', 静音会议基底);
        await 同步原生整表视图(静音会议基底);
        释放正文租约(原生租约owner);
        eventEmit('人妻公寓:回合失败', 'AI 没有返回有效正文——本拍未推进，请直接重试');
        return;
      } else if (静音正文 !== null) {
        await 物理写回静音会议原生正文(静音正文, 末楼层, 末楼, 原生事务仍有效, 刷新预期末楼消息签名);
      }

      if (!静音会议基底 && 事件必须有正文(本楼事件) && !本轮有效正文) {
        // 原生逃生路径不能用空白楼确认确定性剧情；清掉变量协议并把 MVU 候选恢复到 prompt 前真值。
        await 物理写回静音会议原生正文('', 末楼层, 末楼, 原生事务仍有效, 刷新预期末楼消息签名);
        if (_本轮事件基底) {
          const 失败基底 = _.cloneDeep(_本轮事件基底) as SchemaType;
          _.set(新变量, 'stat_data', 失败基底);
          await 同步原生整表视图(失败基底);
        }
        释放正文租约(原生租约owner);
        eventEmit('人妻公寓:回合失败', 'AI 没有返回有效的剧情正文——待演事件已保留，请直接重试');
        return;
      }

      if (静音会议基底 && _静音会议原生因私聊阻断 && !正文租约生效中()) {
        // GENERATION_STOPPED 后仍迟到落下 assistant：只接回可信的手机摘要，正文已清空，
        // 本拍不消费事件、不推进；清掉一次性墓碑，避免污染下一次合法请求。
        合并静音会议可信私聊摘要(静音会议基底, 旧变量);
        _.set(新变量, 'stat_data', 静音会议基底);
        捕获保护快照(静音会议基底);
        await 同步原生整表视图(静音会议基底);
        _静音会议原生因私聊阻断 = false;
        return;
      }
      // 手动"重新处理变量"(非生成周期):只恢复不推进(防护13)。
      // 不再从当前楼真值重捕快照(审计 低危15):当前楼是"已截过"的终值,拿它当 delta cap
      // 基准=每按一次再放行 +3,连按可无限抬升。内存快照本就随每次 UI 落地(落地→捕获保护快照)
      // 刷新,含全部 UI 写入,直接用它做基准即可。
      // 只有“正文租约未生效”（手动重处理/辅助模型事件）才走只恢复不推进路径；正文租约
      // 生效中且末楼是租约预期助手楼的才当作正文结算消费（见下）。
      if (!正文租约生效中()) {
        if (!有保护快照()) {
          // 理论上启动初始化已经建立内存快照；若宿主事件在初始化窗口抢先到达，
          // 旧变量仍是 MVU 解析前的可信整表。全量恢复，禁止候选绕过守护静默落地。
          const 旧rawStat = _.get(旧变量, 'stat_data');
          if (!旧rawStat || _.isEmpty(旧rawStat)) {
            console.error('[人妻公寓] 手动变量重处理缺少保护快照与旧值，拒绝采纳候选');
            return;
          }
          const restored = Schema.parse(旧rawStat) as SchemaType;
          _.set(新变量, 'stat_data', restored);
          捕获保护快照(restored);
          await 等待晋阶镜像写入();
          await 同步原生整表视图(restored);
          console.warn('[人妻公寓] 手动变量重处理发生在守护初始化前，候选已按旧值全量恢复');
          return;
        }

        const restored = Schema.parse(rawStat) as SchemaType;
        // 必须把 Schema.parse 前的原始候选一并交给守护；否则 98→102 会先被
        // range 夹成 100，伪装成合法 +2，绕过“超 ±3 整字段回滚”。
        const 手动范围 = 读取AI可写变量范围(末楼层);
        const 手动焦点 = _.uniq([...手动范围.妻, ...手动范围.夫]);
        回滚保护字段(restored, 手动焦点, 手动范围, 末楼层, rawStat);
        _.set(新变量, 'stat_data', restored);
        await 同步原生整表视图(restored);
        console.info('[人妻公寓] 非生成周期的变量重处理:脚本管字段已按快照恢复(引擎未推进)');
        return;
      }
      // 正文租约生效中但末楼不是租约预期助手楼：迟到旧楼或辅助模型事件不得消费正文租约，
      // 也不得清掉本次正文的冻结与静音会议基底；真正的预期助手楼结算稍后到达时仍会认领。
      const 原生租约 = 读原生正文开始票();
      // 只有与租约同 owner、同聊天、同时间线、预期助手楼相符的事务才当作正文结算消费；
      // 切聊天/切分支或旧票的迟到回调不得消费租约，也不得清掉本次正文的冻结与静音会议基底。
      if (
        !原生租约 ||
        原生租约.序号 !== 读当前租约owner() ||
        原生租约.聊天ID !== 当前聊天ID() ||
        原生租约.时间线世代 !== 当前时间线切换世代() ||
        末楼层 !== 原生租约.预期助手楼层
      ) {
        保留静音会议生成锁 = 静音会议基底 !== null;
        保留本轮冻结 = _本轮事件 !== null;
        if (rawStat && !_.isEmpty(rawStat)) await 同步原生整表视图(rawStat);
        return;
      }
      if (!有保护快照()) return;

      // 原生逃生舱也不能相信 AI 解析后的任何字段，更不能靠“新状态是否仍标记静音会议”
      // 来决定隔离。PROMPT_READY 已冻结脚本真值；这里只消费事件并推进状态机。
      const newData = 静音会议基底 ?? (Schema.parse(rawStat) as SchemaType);
      const 楼层 = 末楼层;
      const 本轮静音会议 = 静音会议基底 !== null;

      if (本轮静音会议) 合并静音会议可信私聊摘要(newData, 旧变量);

      if (本轮静音会议 && _静音会议原生因私聊阻断) {
        // stopGeneration 极端情况下未中止、仍落下 AI 楼：正文已物理清洗，但本拍明确
        // 不消费事件、不推进。稍后完成的手机回复会基于这一楼继续写摘要。
        _.set(新变量, 'stat_data', newData);
        捕获保护快照(newData);
        await 同步原生整表视图(newData);
        释放正文租约(原生租约owner);
        // 已消费可能迟到的 assistant；finally 现在可以连同一次性墓碑一起清掉。
        _静音会议原生因私聊阻断 = false;
        return;
      }

      let oldStat: SchemaType | null = null;
      try {
        const 旧raw = _.get(旧变量, 'stat_data');
        if (旧raw && !_.isEmpty(旧raw)) oldStat = Schema.parse(旧raw) as SchemaType;
      } catch {
        /* 旧值不可读时以守护后的本轮状态作成长基准，疑心增量按 0 处理 */
      }

      const 入住预览可守护 =
        !本轮静音会议 &&
        !!本轮冻结 &&
        是入住登场事件(本楼事件) &&
        !!_本轮事件基底 &&
        !!_本轮入住演出态 &&
        本轮事件可提交(本轮冻结, _本轮事件基底.系统._待发送事件, 楼层, Boolean(本轮有效正文));
      if (入住预览可守护) {
        // 演出态只作为这一楼的变量守护基准；正式持久前禁止把预览节点写进晋阶镜像。
        捕获保护快照(_本轮入住演出态!, false);
        临时入住保护已启用 = true;
      }

      // 两段式写权(堕落值增长修复)：候选可见只发生在解析提示层，提交许可仍由守护精确
      // 授予。正文最终落地后，先按最终助手正文的逐角色实际尺度把本轮精确范围扩到真实
      // 参与者，再让守护/成长/最终视图消费同一份范围。普通正文、空正文、停止/API 失败、
      // 手动重处理、迟到旧楼、swipe/删楼/切聊与并发旧事务都已在前面各自 return，不会
      // 走到这里消费候选权限；静音会议隔离层不拥有持久写权，也跳过扩展。
      const 原生尺度 = 本轮静音会议 ? null : 解析尺度判定(String(末楼?.mes ?? ''));
      const 本轮医院硬锁 = _本轮妻在场.some(门牌号 => 处于医院硬锁(newData, 门牌号));
      if (!本轮静音会议 && !本轮医院硬锁 && 本轮有效正文 && 原生尺度?.角色) {
        const 逐角色实际 = Object.fromEntries(
          Object.entries(原生尺度.角色).map(([门牌号, 项]) => [门牌号, 项?.实际 ?? 0]),
        ) as Record<string, number>;
        const 扩展后范围 = 扩展精确亲密妻(_本轮变量范围, 逐角色实际);
        const 新增亲密妻 = 扩展后范围.亲密妻.filter(m => !_本轮变量范围.亲密妻.includes(m));
        if (新增亲密妻.length) {
          _本轮变量范围 = 扩展后范围;
          console.info(`[人妻公寓·稽查补亲密] 原生正文最终尺度实际≥1，补入亲密妻：${新增亲密妻.join(',')}`);
        }
      }

      if ((读场景().房间id ?? '') !== _本轮场景id) {
        throw new Error('原生正文生成期间玩家场景已经变化，本轮不会把剧情和结算写到另一个地点。');
      }

      // 1. 回滚脚本管字段(变量分工表落码;后台户整体拍回,焦点户白名单+delta cap)
      const 守护结果 = 本轮静音会议 ? undefined : 回滚保护字段(newData, _本轮焦点, _本轮变量范围, 楼层, rawStat);
      // 严格入住的预演节点（尤其母亲折叠 +16）属于本轮起点，不得算成 AI 新增成长或疑心增量。
      const 成长基准 = 入住预览可守护
        ? (_.cloneDeep(_本轮入住演出态) as SchemaType)
        : (oldStat ?? (_.cloneDeep(newData) as SchemaType));

      // 1.5 首批入住兜底(启动时无 stat 的全新对话在此接上)
      if (!本轮静音会议) 确保首批入住(newData);

      // 2. 只提交 PROMPT_READY 真正冻结并注入的 pending；延期、重放、换票和错楼都不动槽位。
      let 入住预约已提交 = false;
      if (本轮冻结 && 本轮事件可提交(本轮冻结, newData.系统._待发送事件, 楼层, Boolean(本轮有效正文))) {
        // 严格入住必须在 pending 尚存时先原子建户/入列，随后才能把同一张票转存为已注入。
        入住预约已提交 = 提交入住登场(newData, 本楼事件, 楼层) !== null;
        newData.系统._已注入事件 = { 楼层, 内容: 本楼事件 };
        const 母亲线路消息 = 提交母亲两幕事件(newData, 本楼事件);
        if (母亲线路消息.length) eventEmit('人妻公寓:提示', 母亲线路消息.join('\n'));
        const 地点线路消息 = 提交阶段线路剧情(newData, 本楼事件, 读场景().房间id ?? '');
        if (地点线路消息.length) eventEmit('人妻公寓:提示', 地点线路消息.join('\n'));
        const 阶段演出票数 = (本楼事件.match(/【阶段线路演出:/g) ?? []).length;
        if (阶段演出票数) {
          const 阶段演出消息 = 提交阶段线路演出事件(newData, 本楼事件);
          if (阶段演出消息.length !== 阶段演出票数) throw new Error('阶段线路演出票据已经失效，本轮事件未提交。');
          eventEmit('人妻公寓:提示', 阶段演出消息.join('\n'));
        }
        const 性癖票 = 解析阶段性癖开幕事件(本楼事件);
        if (!本轮静音会议 && 性癖票) {
          const 提交结果 = 提交阶段性癖开幕(newData, 本楼事件, 楼层);
          if (!提交结果.成功) throw new Error(提交结果.提示 || '阶段主题开幕未能提交。');
          if (提交结果.提示) eventEmit('人妻公寓:提示', 提交结果.提示);
        }
        const 活动场景剧情 = 读取活动场景剧情(newData);
        const 已消费 = 活动场景剧情
          ? 提交场景剧情成功(newData, 本楼事件, 活动场景剧情.id)
          : 消费队首场景剧情(newData, 本楼事件);
        if (!已消费) throw new Error('场景剧情队首在提交前已经变化，本轮没有消费任何待演事件。');
      }
      // 当前票已经消费后的队列基线。后续入住、丈夫打断与线路系统若产生新剧情，
      // 只允许在这个基线之后追加，并在最终写回前逐张绑定真实场景。
      const 原生结算后待发送基线 = newData.系统._待发送事件;

      // 3. 坏结局锁定:引擎全停(回滚保护仍生效)
      if (newData.系统._坏结局) {
        _.set(新变量, 'stat_data', newData);
        临时入住保护已启用 = false;
        if (入住预约已提交) {
          捕获保护快照(newData, false);
          安排原生入住持久后同步(楼层, 本楼事件);
        } else {
          捕获保护快照(newData);
        }
        await 同步原生整表视图(newData);
        释放正文租约(原生租约owner);
        return;
      }

      // 线路成熟按真实完成的 AI 楼结算；阶段主题已经在 pending 原子提交区完成。
      const 已演事件 = 本楼事件;
      const 特殊场景id = 已演事件.match(/【特殊场景·([^·】]+)/)?.[1];
      const 特殊场景 = 特殊场景id ? 查特殊场景(特殊场景id) : undefined;
      推进特殊场景(newData, 已演事件);
      if (本轮静音会议) 结算隔离脚本成长(成长基准, newData);
      if (!本轮静音会议 && 特殊场景?.接入主线 === true) {
        for (const 门牌号 of 特殊场景.参与(newData as never)) {
          上报阶段线路事件(newData, { 类型: '特殊场景', 门牌: 门牌号, 标识: 特殊场景.id, 楼层 });
        }
      }
      // 5. 结算(逃生舱路径:与回合引擎同一套账——焦点户触碰+疑心主通道)
      // 换装余波的聊天消费旗只能在核心状态成功收口后补写，不能和 newData 一起提前消费。
      let 提交换装疑记: (() => Promise<boolean>) | null = null;
      if (!本轮静音会议) {
        const 现钟 = newData.系统._绝对时段;
        let 主焦堕落增量 = 0;
        for (const m of _本轮焦点) {
          const 节点 = newData.户[m];
          if (!节点) continue;
          惰性结算户(节点, 现钟); // 绝对时段轴(与主路径一致)
          节点.夫.状态 = 丈夫在楼(节点, m, 现钟);
          if (!_本轮妻在场.includes(m)) continue;
          节点.妻.上次互动楼层 = 楼层;
          const 基准堕落 = 成长基准.户[m]?.妻.堕落值;
          const 堕落增量 = 节点.妻.堕落值 - (基准堕落 ?? 节点.妻.堕落值);
          if (m === _本轮焦点[0]) 主焦堕落增量 = 堕落增量;
          结算焦点疑心(节点, m, 堕落增量, 现钟);
        }
        夜访结算(newData, 楼层);
        荣耀洞结算(newData, 楼层);
        {
          const 经提示 = 经济结算(newData, 楼层);
          if (经提示.length) eventEmit('人妻公寓:提示', 经提示.join('\n'));
        }
        入住检测(newData, 楼层, _.uniq([..._本轮妻在场, ..._本轮夫在场]).length);
        提交换装疑记 = 换装起疑(newData, 楼层);
        打断检测(newData, _本轮焦点, 楼层);
        父亲来电打断(newData, _本轮焦点, 楼层);
        母亲撞见检测(
          newData,
          _本轮焦点[0],
          主焦堕落增量,
          楼层,
          难度表[newData.系统._难度]?.撞见概率系数 ?? 1,
          _本轮场景id,
        );
        绿帽线检测(newData, 楼层);

        冻结全楼余波堕落(成长基准, newData);
        if (_本轮余波目标 && newData.户[_本轮余波目标]) {
          推进余波安抚(newData.户[_本轮余波目标]!.妻, {
            正文楼: 楼层,
            当前绝对时段: 现钟,
            成功主线当面楼: Boolean(本轮有效正文) && _本轮妻在场.includes(_本轮余波目标),
            玩家有效回应: 玩家行动是有效安抚(_本轮玩家文本),
          });
        }
        const 成长结果 = 记录全楼有效成长(成长基准, newData, 守护结果?.合法正候选);
        if (!特殊场景id) {
          for (const 成长 of 成长结果) {
            if (成长.来源.includes('阶段晋升')) 登记攻略风闻(newData, 成长.门牌, '晋阶');
            else if (成长.来源.includes('堕落值') || 成长.来源.includes('身体开发'))
              登记攻略风闻(newData, 成长.门牌, '亲密');
            else if (成长.来源.includes('好感值')) 登记攻略风闻(newData, 成长.门牌, '普通');
          }
        }
        const 冷落结果 = 结算全楼冷落(newData, 当前微信联系保护表());
        const 有下降 = 冷落结果.filter(项 => 项.实际下降 > 0);
        if (有下降.length) {
          console.info(`[人妻公寓·冷落] ${有下降.map(项 => `${项.门牌}-${项.实际下降}`).join('，')}`);
        }
      }

      const 尺度 = 解析尺度判定(String(末楼?.mes ?? ''));
      const 资源结算 = 结算成功现场楼(newData, 成长基准, {
        楼层,
        行动: _本轮玩家文本,
        正文: 本轮有效正文,
        本楼事件,
        妻在场: _本轮妻在场,
        实际尺度: Object.fromEntries(
          Object.entries(尺度?.角色 ?? {}).flatMap(([门牌号, 项]) => (项 ? [[门牌号, 项.实际]] : [])),
        ) as Partial<Record<门牌, number>>,
        尺度判定: 尺度?.角色,
        资源计费: _本轮资源计费 && Boolean(本轮有效正文),
      });
      const 登门推进 = 推进丈夫登门(newData, 本楼事件, 读场景().房间id ?? '管理员室', 读场景().房间id ?? '');
      同步丈夫登门排期(newData);
      if (登门推进?.提示 && !登门推进.事件) eventEmit('人妻公寓:提示', 登门推进.提示);
      if (资源结算.提示) eventEmit('人妻公寓:提示', 资源结算.提示);

      // 6. 写回
      if (本轮有效正文) 提交孕情初见评价(newData, _本轮孕情初见提示, 楼层);
      if (_本轮快照刷新票 && 本轮有效正文) 提交快照刷新(newData, _本轮快照刷新票);
      // 原生正文路径不经过 `脚本写入`，必须在最终变量写回前执行相同的不变量门。
      // 本轮消费旧票后产生的每一张新剧情都单独绑定到 prompt 冻结场景，绝不混演。
      if (!newData.系统._特殊场景.id && newData.系统._荣耀洞拍 < 0) {
        绑定新增待发送事件到场景(newData, 原生结算后待发送基线, _本轮场景id || null, item => 是入住登场事件(item));
      }
      _.set(新变量, 'stat_data', newData);
      // MESSAGE_RECEIVED 可能早于 MVU 真值落楼；此处用已经推进/结算后的确定状态刷新快照，
      // 防止随后手动“重新处理变量”把静音会议拍次或最终 +2 拍回到生成前。
      临时入住保护已启用 = false;
      if (入住预约已提交) {
        捕获保护快照(newData, false);
        安排原生入住持久后同步(楼层, 本楼事件);
      } else {
        捕获保护快照(newData);
      }
      if (!本轮静音会议) await 固化原生本轮在场(楼层, 原生事务仍有效);
      // 结算收口用扩展后的精确范围做最终视图同步（不保留候选可见），与回合引擎一致。
      await 同步原生整表视图(newData, false);
      确认原生事务有效();
      if (提交换装疑记) {
        try {
          await 提交换装疑记();
        } catch (error) {
          // 核心疑心与剧情票已经进入当前成功楼；聊天余波消费旗失败不得反向撤销正文与存档。
          console.warn('[人妻公寓] 原生回合已提交，但换装余波消费旗写入失败:', error);
        }
        确认原生事务有效();
      }
      const CG亲密 = 构造CG亲密上下文(成长基准, newData, 资源结算.性爱结束);
      const CG门牌 =
        CG亲密.主焦点门牌 ?? _本轮焦点.find(门牌号 => _本轮妻在场.includes(门牌号)) ?? _本轮妻在场[0] ?? null;
      const CG尺度值 = Object.values(尺度?.角色 ?? {}).flatMap(项 => (项 ? [项.实际] : []));
      const CG最高尺度 = CG尺度值.length ? Math.max(...CG尺度值) : null;
      eventEmit('人妻公寓:CG回合信号', {
        门牌: CG门牌,
        行为等级: CG门牌 ? (尺度?.角色[CG门牌]?.实际 ?? CG最高尺度) : CG最高尺度,
        正文: 本轮有效正文,
        行动: _本轮玩家文本,
        事件: 本楼事件,
        楼层,
        亲密: CG亲密,
        variant: CG门牌 ? (应使用怀孕CG(newData, CG门牌) ? 'pregnancy' : 'normal') : 'normal',
      });
      释放正文租约(原生租约owner);
      // 原生酒馆输入不经过固定0楼回合的“回合完成”事件；等本次MVU回调退栈后单独
      // 补一拍玩法预警，确保它跨过 4/6/12/18 个绝对时段边界时也不会静默受罚。
      if (!本轮静音会议) setTimeout(() => void 冷落预警节拍(), 0);
    } catch (err) {
      if (!原生事务仍有效()) return;
      if (临时入住保护已启用 && _本轮事件基底) {
        // 预览守护只属于本次候选；后续任一结算异常都必须退回真实持久态，不能遗留半入住基准。
        捕获保护快照(_本轮事件基底, false);
      }
      console.error('[人妻公寓] VARIABLE_UPDATE_ENDED 处理失败:', err);
      释放正文租约(原生租约owner);
    } finally {
      if (本次原生变量事务 === _原生变量事务序号 && 原生本轮令牌 === 读原生正文令牌()) {
        if (!保留静音会议生成锁) 释放静音会议原生生成锁();
        if (!保留本轮冻结) 清原生本轮冻结();
      }
      标记原生变量事务结束();
    }
  });

  // 原生酒馆生成被玩家停止时不会保证触发变量更新；明确取消信号负责释放生成互斥锁。
  // 只作废当前有效原生开始票/租约：没有开始票的停止（后台/辅助请求）不得误清真实正文租约。
  // Tavern Helper 的辅助 generate/generateRaw 停止会广播非空字符串生成 ID，酒馆原生
  // stopGeneration() 则无参数广播；辅助停止的 ID 必须明确忽略，不得进入正文取消路径。
  eventOn(tavern_events.GENERATION_STOPPED, (生成ID?: unknown) => {
    if (回合进行中()) return; // 固定 0 楼主路径由回合引擎 finally 释放
    if (typeof 生成ID === 'string' && 生成ID.length > 0) return; // 辅助 generate/generateRaw 停止
    if (!读原生正文开始票()) return; // 辅助/后台停止：不动正文令牌、冻结与租约
    作废原生正文租约();
    释放静音会议原生生成锁();
    清原生本轮冻结();
  });

  // 原生生成结束（成功落楼或 API 失败都会发出）。宿主 release 的 GENERATION_ENDED 携带
  // messageCount（广播 chat.length）：成功 → 精确预期助手楼已落，messageCount === 预期助手
  // 楼层 + 1；API 失败/生成前结束 → 仍停在 user 尾楼，messageCount <= 预期助手楼层。
  // 只有明确失败才作废租约与冻结；成功落楼继续等匹配的 MVU VARIABLE_UPDATE_ENDED 收口。
  eventOn(tavern_events.GENERATION_ENDED, (消息数?: number) => {
    if (回合进行中()) return; // 固定 0 楼主回合及其兼容广播由回合引擎 finally 收口
    const 原生票 = 读原生正文开始票();
    if (!原生票) return; // 辅助/兼容广播或无正文租约：无需处理
    // 不同聊天/不同时间线/楼层引用不符的旧结束事件不得清新租约。
    if (原生票.聊天ID !== 当前聊天ID() || 原生票.时间线世代 !== 当前时间线切换世代()) return;
    if (SillyTavern.chat?.[原生票.用户楼层] !== 原生票.用户消息引用) return;
    if (原生票.阶段 === '等待prompt') {
      // 只是等待 prompt 的原生开始票且从未认领正文租约：只有属于本等待票自己的精确结束
      // 事件（消息数 === 预期助手楼层 = 用户尾楼时的 chat.length）才清票。旧结束事件
      // （消息数 = 用户楼层/缺失/非整数/大于预期）在新票登记但尚未认领的窗口到达时不得
      // 作废新票，否则当前请求异常结束后，后来的辅助 PROMPT_READY 可能在同一 user 尾楼
      // 上认领陈旧票，重新制造时间误锁。
      if (等待票匹配结束事件(原生票, 消息数)) {
        作废原生正文租约();
        释放静音会议原生生成锁();
        清原生本轮冻结();
      }
      return;
    }
    if (typeof 消息数 === 'number' && Number.isInteger(消息数)) {
      // 宿主 release 以 chat.length 语义广播：成功 = 预期助手楼层 + 1，失败 = user 尾楼。
      // 类型声明写 message_id 而运行时有差异时，用“精确预期助手楼是否已落座”作地面真值
      // 兜底（绝不使用“预期位置或之后的任意 assistant”）：只有 messageCount 未超过预期
      // 助手楼层 且 精确预期楼没有落座，才是明确失败；其余情况保守等待匹配 MVU 结算。
      const 预期楼消息 = SillyTavern.chat?.[原生票.预期助手楼层];
      const 预期楼已落 = Boolean(预期楼消息 && !预期楼消息.is_user);
      if (消息数 <= 原生票.预期助手楼层 && !预期楼已落) {
        作废原生正文租约();
        释放静音会议原生生成锁();
        清原生本轮冻结();
      }
      return;
    }
    // 宿主未携带可靠 messageCount（类型/运行时差异的保守兼容）：退化为“预期助手楼精确
    // 落座”判据，绝不使用“预期位置或之后的任意 assistant”。
    const 预期楼消息 = SillyTavern.chat?.[原生票.预期助手楼层];
    if (预期楼消息 && !预期楼消息.is_user) return; // 精确预期楼已落：等匹配 VARIABLE_UPDATE_ENDED
    // API 失败或生成前终止：没有助手楼就不会有 MVU 正文结算，立即释放租约与冻结。
    作废原生正文租约();
    释放静音会议原生生成锁();
    清原生本轮冻结();
  });

  // 宿主原生 swipe/删楼不经过卡内回档入口。监听拍先同步取得协调锁，下一任务拍再从
  // 宿主最终 chat 分支重读真值；连续逐楼事件由世代合并成最后一次有效收口。
  function 排队宿主原生时间线切换(类型: '删楼' | '切分支', 切分支楼: number): void {
    作废原生正文租约();
    作废当前手机时间线租约世代();
    // 原生切分支不是普通“取消按钮”：即使主回合已经离开生成阶段，也必须同步作废
    // 后续解析/提交；隔离生成同理，不能等异步协调拿到 MVU 锁后再停止。
    取消本回合(true);
    取消隔离事件();
    取消变量重生成();
    释放静音会议原生生成锁(false);
    清原生本轮冻结();
    void 排队时间线切换协调(`宿主原生${类型}`, async 租约 => {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (!租约.仍为最新()) return;
      try {
        await 等待回合事务清理完成();
        if (!租约.仍为最新()) return;
        await 等待原生变量事务清理完成();
        if (!租约.仍为最新()) return;
        await 协调原生时间线切换(类型);
        if (!租约.仍为最新()) return;
        // 收口本身也要在排队回调最深处复核“仍为最新”：协调等待期间发生的再次
        // 切分支/切聊/回档会让旧收口失效，不得把旧已读水位写进新分支。
        await 隔离当前手机分支(切分支楼, 租约.仍为最新, 类型);
        if (租约.仍为最新()) eventEmit('人妻公寓:回合完成');
      } catch (e) {
        if (!租约.仍为最新()) return;
        console.error(`[人妻公寓] 原生${类型}协调失败:`, e);
        eventEmit('人妻公寓:回合失败', '消息时间线已经变化，但收口未完成；请刷新后再继续行动。');
      }
    });
  }

  const 滑动监听 = eventOn(tavern_events.MESSAGE_SWIPED, (消息楼层: number) => {
    const 切分支楼 = Number.isInteger(Number(消息楼层)) ? Number(消息楼层) : 当前楼层();
    排队宿主原生时间线切换('切分支', 切分支楼);
  });
  const 删除监听 = eventOn(tavern_events.MESSAGE_DELETED, (消息楼层: number) => {
    // 卡内事务按具体楼层持有租约；不再依赖事件回调到达时的瞬时“回合进行中”。
    if (消费内部删楼事件(Number(消息楼层))) return;
    const 删除楼 = Number.isInteger(Number(消息楼层)) ? Number(消息楼层) : -1;
    排队宿主原生时间线切换('删楼', 删除楼);
  });
  // 切聊天会作废旧聊天的原生正文租约：旧票绑定旧聊天 ID，跨聊天被误认领/误消费都会污染正文
  // 状态。监听停止器由 停止本模块原生时间线监听 统一回收，不做 eventClearEvent
  // （数据库桥复用同一 CHAT_CHANGED 事件，整类清掉会误杀它的切聊监听）。
  const 聊天切换监听 = eventOn(tavern_events.CHAT_CHANGED, () => {
    void 恢复酒馆助手渲染楼层();
    // 聊天 ID 可能 A→B→A；只比聊天 ID 会产生 ABA。同步推进共享世代，使全部捕获
    // `当前时间线切换世代()` 的旧异步写者在切回同一聊天后仍然失败关闭。
    作废当前时间线切换世代();
    作废原生正文租约();
    // 切聊天同步作废手机时间线租约世代：切走再切回同聊天/同楼/同时段时，旧异步
    // 已读或生成任务不得经 ABA 校验复活并把旧时间线的水位/内容写进新时间线。
    作废当前手机时间线租约世代();
    // 切聊天后旧隔离请求要么被 stopAllGeneration() 物理停止，要么被标记为已取消并在
    // 返回后丢弃结果；真正的提交安全仍以各入口的 复核隔离时间线身份 为准（数据库底层
    // 请求未必可物理取消，不能把这份监听当作唯一防线）。
    取消隔离事件();
    取消变量重生成();
  });
  游戏逻辑全局.__rqgyGameTimelineListenerStops = [
    () => 滑动监听.stop(),
    () => 删除监听.stop(),
    () => 聊天切换监听.stop(),
  ];

  // ─────────────────────────────────────────────
  // 后处理:刷新保护快照(AI 回复后数据已落地)
  // ─────────────────────────────────────────────
  eventOn(tavern_events.MESSAGE_RECEIVED, () => {
    if (回合进行中()) return; // 主路径在回合引擎内自行刷新快照
    try {
      // 毒快照防御+回退取楼:MESSAGE_RECEIVED 可能先于 MVU 落数据(竞态)
      const rawStat = 读最近有效stat();
      if (!rawStat) {
        console.warn('[人妻公寓] MESSAGE_RECEIVED: 近10楼均无 stat_data,跳过快照刷新');
        return;
      }
      捕获保护快照(Schema.parse(rawStat) as SchemaType);
    } catch (err) {
      console.error('[人妻公寓] MESSAGE_RECEIVED 处理失败:', err);
    }
  });
}
