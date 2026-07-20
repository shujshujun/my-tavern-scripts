import type { SchemaType } from '../../schema';
import { Schema, 创建户节点 } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 难度表, 首批门牌 } from '../../stageConfig';
// (难度表兼供撞见概率系数查表)
import { 经济结算 } from './经济系统';
import { 入住检测 } from './入住系统';
import { 打断检测, 换装起疑, 母亲撞见检测, 父亲来电打断 } from './打断系统';
import { 夜访结算, 惰性结算户, 绿帽线检测, 结算焦点疑心, 冷落检测 } from './结算系统';
import { 荣耀洞结算 } from './荣耀洞';
import { 当前时段, 丈夫在楼 } from './楼层时钟';
import { PROMOTE_MIRROR_KEY, 捕获保护快照, 回滚保护字段, 清保护快照, 镜像直写 } from './守护系统';
import { 中断卡文案, 记违规清零, 结算违规代价, 输出稽查, 未遂余波指引 } from './稽查系统';
import { 读取最近有效, 读最近有效stat, 脚本写入 } from './mvuIO';
import { 检测焦点, 组公寓快照, 读场景 } from './snapshotSystem';
import { 读取数据库记忆胶囊, 同步数据库回合 } from './数据库桥';

/**
 * 回合引擎:固定 0 楼架构的主循环(修道院回合引擎直迁,本作化三处:
 * 稽查终审接入/惰性结算+疑心主通道/序章开局)。
 *
 * 显示层永远只有 0 楼的客户端 iframe;后续楼层只是数据库:
 *   玩家行动 → generate(不建楼、不刷新显示) → 稽查终审(违规=中断卡+变量不采纳+代价)
 *   → Mvu.parseMessage 手动解析变量 → 回滚保护字段(变量分工表) → 回合结算
 *   → createChatMessages({refresh:'none'}) 静默落库(AI 上下文/回档全靠它) → 通知客户端
 *
 * 事件流(客户端 ⇄ 脚本):
 *   人妻公寓:玩家行动 ← 客户端游戏内输入(index.ts 接线)
 *   人妻公寓:生成开始/流式/回合完成/回合失败 → 客户端(流式渲染+解锁输入)
 */

let 进行中 = false;
export const 回合进行中 = () => 进行中;

// ── 重掷支持:回合快照(存 chat 变量,iframe 重载/刷新后仍可重掷) ──
// 变量随楼自动回滚(每楼自带 stat_data);晋阶镜像有意不在此列——镜像取大是防打回的正字,重掷不还原

/** 回合内会被脚本改写的 chat 变量键(重掷时按快照整值恢复;_场景 含一幕性的破门标记) */
const 回合变量键 = [
  '_场景',
  '_经济',
  '_赴约',
  '_工具由头',
  '_换装余波',
  '_待办',
  '_侦探',
  '_摄像头',
  '_在场',
  '_行动选项',
  '_粘滞',
] as const;

/** 手机记录不塞进每回合快照（会令存档平方膨胀），按楼层戳裁掉被删除时间线。 */
function 裁手机时间线(vars: Record<string, unknown>, 楼层: number): void {
  const 库 = _.get(vars, '_微信') as
    | {
        消息?: { 楼?: number }[];
        圈?: { 楼?: number }[];
        读到?: Record<string, number>;
        圈读到?: number;
        节拍?: object;
      }
    | undefined;
  if (!库 || typeof 库 !== 'object') return;
  库.消息 = (库.消息 ?? []).filter(x => Number(x?.楼 ?? -1) <= 楼层);
  库.圈 = (库.圈 ?? []).filter(x => Number(x?.楼 ?? -1) <= 楼层);
  库.读到 = Object.fromEntries(Object.entries(库.读到 ?? {}).map(([k, v]) => [k, Math.min(Number(v), 楼层)]));
  库.圈读到 = Math.min(Number(库.圈读到 ?? -1), 楼层);
  // 节拍使用“真实楼+杀时间偏移”的钟楼值，无法只凭目标楼可靠裁剪；清空后由确定性种子重新建水位。
  库.节拍 = {};
  _.set(vars, '_微信', 库);
}

type 上次回合记录 = {
  行动: string;
  回合前末楼: number;
  chat快照: Record<string, unknown>;
};

function 读上次回合(): 上次回合记录 | undefined {
  return (_.get(getVariables({ type: 'chat' }), '_上次回合') ?? undefined) as 上次回合记录 | undefined;
}

// 流式转发:generate 的 iframe 事件转成自定义事件,客户端稳定可收。
// 用 generation_id 只认自家生成(数据库/总结类第三方脚本自己也会调 generate)。
let 本回合生成id = '';
eventClearEvent(iframe_events.STREAM_TOKEN_RECEIVED_FULLY);
eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (文本: string, generation_id: string) => {
  if (!进行中) return;
  if (generation_id && generation_id !== 本回合生成id) return;
  eventEmit('人妻公寓:流式', 文本);
});

// ── 取消本回合:停掉生成,作废的回合不落楼 ──
let 已取消 = false;
export function 取消本回合() {
  if (!进行中 || !本回合生成id) return;
  已取消 = true;
  try {
    if (!stopGenerationById(本回合生成id)) stopAllGeneration();
  } catch (e) {
    console.error('[人妻公寓] 停止生成失败:', e);
  }
}

/** 楼层尾部 + 本次行动 → 伪对话数组(焦点检测/快照组装的扫描源) */
function 近楼对话(行动?: string): { role: string; content: string }[] {
  const 尾: { role: string; content: string }[] = [];
  try {
    const 末楼 = getLastMessageId();
    const 起 = Math.max(0, 末楼 - 3);
    for (const 消息 of getChatMessages(`${起}-${末楼}`) ?? []) {
      尾.push({ role: 消息.role, content: 消息.message ?? '' });
    }
  } catch (e) {
    console.error('[人妻公寓] 读取楼层尾部失败:', e);
  }
  if (行动) 尾.push({ role: 'user', content: 行动 });
  return 尾;
}

/** 快照 + 焦点一次组装;顺手把在场名单落 chat 变量供客户端头像行点亮 */
export function 组快照注入(
  对话尾: { role: string; content: string }[],
  data: SchemaType,
  楼层: number,
): { 快照: string; 焦点: 门牌[]; 妻在场: 门牌[]; 夫在场: 门牌[] } {
  const { 焦点, 在场, 妻在场, 夫在场 } = 检测焦点(对话尾, data, 楼层);
  insertOrAssignVariables({ _在场: { 焦点, 在场, 妻在场, 夫在场 } }, { type: 'chat' });
  // 对话粘滞落库(2026-07-18 用户拍板):当场的人钉在当场,楼层时钟传送不走;
  // 玩家离开房间(场景清空/换房)后,读侧位置比对自动失效,这里顺手清干净
  {
    const 场 = 读场景();
    // 粘滞记录的是妻的位置；丈夫只按自己家的作息判断，不能借户级焦点把不在家的妻子钉回来
    const 们 = 妻在场;
    if (场.房间id && 们.length) {
      insertOrAssignVariables({ _粘滞: { 位置: 场.房间id, 楼: 楼层, 们 } }, { type: 'chat' });
    } else if (!场.房间id) {
      insertOrAssignVariables({ _粘滞: null }, { type: 'chat' });
    }
  }
  const 记忆人物 = 焦点.flatMap(m => [户静态表[m]?.妻名, 户静态表[m]?.夫名]).filter((name): name is string => !!name);
  const 快照 = 组公寓快照(对话尾, data, 楼层) + 读取数据库记忆胶囊(记忆人物);
  // 内容量审计(2026-07-19 用户点名#5):每楼注入体积落日志,测试期拿真实数据定收敛策略
  console.info(`[人妻公寓·快照] 本楼注入 ${快照.length} 字(焦点${焦点.length}人/在场${在场.length}人)`);
  return { 快照, 焦点, 妻在场, 夫在场 };
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
function 广播生成完成事件() {
  try {
    const 宿主 = window.parent as any;
    const 全局ST = 宿主?.SillyTavern;
    const 上下文 = 全局ST?.getContext?.() ?? 全局ST;
    const 事件源 = 上下文?.eventSource ?? 全局ST?.eventSource;
    // 事件表键名随酒馆版本漂移(eventTypes/event_types),两头兼容,取不到就放弃
    const 事件表 = 上下文?.eventTypes ?? 上下文?.event_types ?? 全局ST?.eventTypes ?? 全局ST?.event_types;
    if (typeof 事件源?.emit !== 'function' || !事件表?.GENERATION_ENDED) return;
    const 末楼 = getLastMessageId();
    void (async () => {
      try {
        if (事件表.GENERATION_STARTED) await 事件源.emit(事件表.GENERATION_STARTED, 'normal', {}, false);
        await 事件源.emit(事件表.GENERATION_ENDED, 末楼);
      } catch (e) {
        console.warn('[人妻公寓] 数据库插件兼容广播失败(不影响游戏):', e);
      }
    })();
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
): Promise<void> {
  const 场 = 读场景();
  const 参与者 = [...妻在场.map(m => 户静态表[m]?.妻名), ...夫在场.map(m => 户静态表[m]?.夫名)].filter(
    (name): name is string => !!name,
  );
  await 同步数据库回合({
    楼层,
    时间: 当前时段(楼层 + data.系统._时段偏移楼),
    地点: 场.房间id || '公寓公共区域',
    参与者,
    玩家行动: 行动,
    结果摘要: 结果,
  });
}

/** 楼层落库前的清洗:思维链/变量块/选项块/行为等级标签不进楼层文本(prompt 与卷轴双干净) */
function 清洗正文(原文: string): string {
  const 闭合清 = 原文
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*-{2,}>?\s*$/gm, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
    .replace(/<options>[\s\S]*?<\/options>/g, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    // 玩家预设夹带的整篇 HTML 组件(2026-07-18 玩家实测:破限预设让模型在正文后附"选项分支"
    // HTML 文档,原生酒馆渲染成卡,固定0楼界面=裸代码墙,还白吃上下文token)——整体剥除
    .replace(/```(?:html|xml)?\s*(?:<!DOCTYPE|<html)[\s\S]*?```/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?<\/html\s*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
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

// 行动选项系统已下线(2026-07-17 用户拍板:序章四条硬编码引导=唯一的选项,点掉即新手引导结束;
// AI 不再被要求输出 <options>,回合完成后 _行动选项 恒清空,选项区自然消失)

/**
 * 回合结算(在落库前对 newStat 就地执行,新楼直接携带结算后数据):
 * 焦点户触碰(惰性补被动账+互动楼层刷新+疑心主通道)+ 事件转存 + 冷落检测。
 */
function 回合结算(
  newStat: SchemaType,
  snapStat: SchemaType,
  焦点: 门牌[],
  妻在场: readonly 门牌[],
  楼层: number,
): void {
  // 焦点户:被触碰=惰性结算生效点
  let 主焦堕落增量 = 0;
  for (const m of 焦点) {
    const 节点 = newStat.户[m];
    if (!节点) continue;
    惰性结算户(节点, 楼层);
    // `夫.状态`是存档里的丈夫状态栏；此前只有界面临时推算，字段本身长期为空，所以回合后看似从不更新。
    节点.夫.状态 = 丈夫在楼(节点, m, 楼层 + newStat.系统._时段偏移楼);
    if (!妻在场.includes(m)) continue;
    节点.妻.上次互动楼层 = 楼层;
    const 堕落增量 = 节点.妻.堕落值 - (snapStat.户[m]?.妻.堕落值 ?? 节点.妻.堕落值);
    if (m === 焦点[0]) 主焦堕落增量 = 堕落增量;
    结算焦点疑心(节点, m, 堕落增量);
  }

  // 一次性事件消费转存(防护10):本轮快照已注入的排队事件挪到已注入档
  if (newStat.系统._待发送事件) {
    newStat.系统._已注入事件 = { 楼层, 内容: newStat.系统._待发送事件 };
    newStat.系统._待发送事件 = '';
  }

  // 深夜杵在低阶段住户门口的代价(演出层纪律在快照,账面在此)
  夜访结算(newStat, 楼层);

  // 荣耀洞三拍推进(本楼确实演了拍才走针;完成才记账,离场由UI即时收束)
  荣耀洞结算(newStat, 楼层);

  // 经济:收租日/上交日/父亲来电/最后通牒(期号去重,杀时间跨期惰性补收)
  {
    const 经提示 = 经济结算(newStat, 楼层);
    if (经提示.length) eventEmit('人妻公寓:提示', 经提示.join('\n'));
  }

  // 母亲首夜第二幕(P5②:早饭桌戏=晋阶正戏固定第二幕,首夜次楼自动排队,优先级最高)
  if (newStat.系统._母亲首夜第二幕 && !newStat.系统._待发送事件) {
    newStat.系统._母亲首夜第二幕 = false;
    newStat.系统._待发送事件 =
      '【早饭桌】第二天一早,妈照常在厨房——照常煎蛋,照常唠叨"趁热吃",围裙照常系得整整齐齐。只有拿筷子的手在抖。' +
      '"什么都没发生"这场戏她演得越用力,越是承认发生了什么。演出这顿早饭:两个人隔着一张桌子各自演"寻常",' +
      '谁都不看谁的眼睛;她给你添饭的那一下,手停了半拍。全程不说破一个字——罪恶感的螺旋从这顿饭开始拧紧';
  }

  // 入住检测(P5 分批唤醒;搬家戏抢事件通道优先级最高——新住户登场是硬剧情)
  入住检测(newStat, 楼层);

  // 换装起疑(换装余波→丈夫侧):她身上的新东西/异样被在家的丈夫注意到,账与戏一起走
  换装起疑(newStat, 楼层);

  // 丈夫打断(优先于冷落抢事件通道):疑心定级别,信任压频率,反讽格走"兄弟拜托"
  打断检测(newStat, 焦点, 楼层);

  // 父亲越洋来电(302专属"丈夫回家"位:亲热中屏幕亮起"老公")
  父亲来电打断(newStat, 焦点, 楼层);

  // 母亲撞见(P5⑥:亲密推进被妈看见——入列前=监督者扣胜任度+暗账;入列后=圆场反转+吃醋)
  母亲撞见检测(newStat, 焦点[0], 主焦堕落增量, 楼层, 难度表[newStat.系统._难度]?.撞见概率系数 ?? 1);

  // 绿帽双线(102观众席"门缝那一眼"/202哑巴亏):开线关键事件,结局轨道单向标记
  绿帽线检测(newStat, 楼层);

  // 冷落检测:排队"她主动来找你"(一次一人)
  冷落检测(newStat, 楼层);
}

/** 主循环:玩家行动 → 生成 → 稽查 → 解析 → 回滚 → 结算 → 落库 → 通知客户端 */
export async function 执行回合(行动: string): Promise<void> {
  if (进行中) return;
  进行中 = true;
  try {
    eventEmit('人妻公寓:生成开始');

    // 重掷快照:回合前末楼号 + 回合内会动的 chat 变量整值
    const 回合前末楼 = getLastMessageId();
    const 生成楼层 = 回合前末楼 + 2; // 本回合 AI 楼的落位(user=+1, assistant=+2)
    const chat快照 = _.cloneDeep(_.pick(getVariables({ type: 'chat' }), 回合变量键));

    // 毒快照防御:末楼无 stat_data(理论上固定 0 楼不会,但逃生舱混用时可能)→ 回退取楼
    const rawStat = 读最近有效stat();
    if (!rawStat) {
      eventEmit('人妻公寓:回合失败', '变量还没就绪——请稍等片刻再试');
      return;
    }
    const data = Schema.parse(rawStat) as SchemaType;
    捕获保护快照(data); // 回滚基准(含镜像取大并入)

    const 对话尾 = 近楼对话(行动);
    const { 快照, 焦点, 妻在场, 夫在场 } = 组快照注入(对话尾, data, 生成楼层);

    const injects: Omit<InjectionPrompt, 'id'>[] = [
      { role: 'system', content: 快照, position: 'in_chat', depth: 0, should_scan: true },
    ];

    已取消 = false;
    本回合生成id = `rqgy-${回合前末楼}-${_.random(1e9)}`;
    const 原文 = String(
      await generate({ user_input: 行动, should_stream: true, injects, generation_id: 本回合生成id }),
    );
    if (已取消) {
      eventEmit('人妻公寓:回合失败', '已取消——这一轮没有发生');
      return;
    }

    const 旧 = Mvu.getMvuData({ type: 'message', message_id: -1 });
    const 焦点妻门牌 = 焦点.find(m => 妻在场.includes(m));
    const 焦点阶段 = 焦点妻门牌 ? (data.户[焦点妻门牌]?.妻.当前阶段 ?? null) : null;

    // ── 稽查终审(提示词是劝告,脚本是法律):违规=中断卡+AI 变量不采纳+代价 ──
    // 词表兜底只扫清洗后正文:思维链的自我提醒/选项块的情色试探条不作数(2026-07-17 误杀修复)
    const 稽查 = 输出稽查(原文, 焦点阶段, false /* 正戏楼免检 P5 场景引擎接入 */, 清洗正文(原文));
    if (稽查.违规 && 焦点妻门牌) {
      console.warn(`[人妻公寓·稽查] 违规拦截:${稽查.原因}`);
      const newStat = _.cloneDeep(data); // 不采纳 AI 的任何变量更新,从快照起步
      结算违规代价(newStat, 焦点妻门牌, 生成楼层);
      // 未遂余波下一楼注入(她怎么拒绝的由 AI 按性格补写,不给示例)
      const 余波 = 未遂余波指引(焦点妻门牌);
      newStat.系统._待发送事件 = newStat.系统._待发送事件 ? `${newStat.系统._待发送事件}|${余波}` : 余波;
      const 新 = _.cloneDeep(旧);
      _.set(新, 'stat_data', newStat);
      await createChatMessages(
        [
          { role: 'user', message: 行动 },
          { role: 'assistant', message: 中断卡文案(户静态表[焦点妻门牌].妻名), data: 新 },
        ],
        { refresh: 'none' },
      );
      捕获保护快照(newStat);
      insertOrAssignVariables(
        { _上次回合: { 行动, 回合前末楼, chat快照 } satisfies 上次回合记录, _行动选项: [] },
        { type: 'chat' },
      );
      await 记录数据库回合(生成楼层, newStat, 行动, 中断卡文案(户静态表[焦点妻门牌].妻名), 妻在场, 夫在场);
      广播生成完成事件();
      eventEmit('人妻公寓:回合完成');
      return;
    }

    // ── 正常路径:手动解析变量 + 分工表回滚 + 结算 ──
    const 新 = ((await Mvu.parseMessage(原文, 旧)) ?? 旧) as Record<string, unknown>;
    const newStat = Schema.parse(_.get(新, 'stat_data') ?? {}) as SchemaType;
    回滚保护字段(newStat, 焦点, { 妻: 妻在场, 夫: 夫在场 }); // 户级焦点内再按实际在场人物分闸
    if (焦点妻门牌) 记违规清零(newStat); // 有焦点妻且未违规:连续违规计数断链
    回合结算(newStat, data, 焦点, 妻在场, 生成楼层);
    _.set(新, 'stat_data', newStat);

    const 正文 = 清洗正文(原文) || '(楼道里安静了一瞬……本轮 AI 未返回正文,可换个说法再试)';
    await createChatMessages(
      [
        { role: 'user', message: 行动 },
        { role: 'assistant', message: 正文, data: 新 },
      ],
      { refresh: 'none' },
    );
    捕获保护快照(newStat);

    // 破门是一幕性的突发标记:演完这一楼即清除(场景保留,玩家还在房里)
    const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as { 破门?: boolean } | undefined;
    if (场景?.破门) {
      await updateVariablesWith(
        vars => {
          _.set(vars, '_场景.破门', false);
          return vars;
        },
        { type: 'chat' },
      );
    }

    // 落重掷记录(回合成功才落);行动选项恒清(序章引导点掉一条后选项区永久消失)
    insertOrAssignVariables(
      {
        _上次回合: { 行动, 回合前末楼, chat快照 } satisfies 上次回合记录,
        _行动选项: [],
      },
      { type: 'chat' },
    );

    await 记录数据库回合(生成楼层, newStat, 行动, 正文, 妻在场, 夫在场);
    广播生成完成事件();
    eventEmit('人妻公寓:回合完成');
  } catch (e) {
    if (已取消) {
      eventEmit('人妻公寓:回合失败', '已取消——这一轮没有发生');
    } else {
      console.error('[人妻公寓] 回合执行失败:', e);
      eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    }
  } finally {
    进行中 = false;
    本回合生成id = ''; // 防回档等无生成的回合被"取消"误伤
  }
}

/**
 * 重掷本回合:删掉上一回合创建的楼层(每楼自带 stat_data 快照,变量随楼自动回滚——
 * 固定 0 楼架构红利;晋阶镜像不还原=取大防打回的正字),chat 变量按回合前快照整值恢复,
 * 然后用原行动重新执行一回合。
 */
export async function 重掷回合(): Promise<void> {
  if (进行中) return;
  const 记录 = 读上次回合();
  const 末楼 = getLastMessageId();
  if (!记录 || 末楼 <= 记录.回合前末楼) {
    eventEmit('人妻公寓:回合失败', '没有可重来的回合');
    return;
  }
  try {
    await deleteChatMessages(_.range(记录.回合前末楼 + 1, 末楼 + 1), { refresh: 'none' });
    // updateVariablesWith + _.set 整值替换(insertOrAssign 对对象是深合并,会残留回合内新增的键)
    await updateVariablesWith(
      vars => {
        for (const 键 of 回合变量键) _.set(vars, 键, (记录.chat快照 as Record<string, unknown>)[键] ?? null);
        裁手机时间线(vars, 记录.回合前末楼);
        return vars;
      },
      { type: 'chat' },
    );
  } catch (e) {
    console.error('[人妻公寓] 重掷回滚失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    return;
  }
  await 执行回合(记录.行动);
}

/**
 * 回档:删掉指定楼层之后的一切。
 * 变量随楼回滚;回合类 chat 变量一律清空(排队于被删时间线,保守清掉最安全);
 * 晋阶镜像不清——守护系统按"镜像楼层>当前楼=回档作废"规则自行处理(防护9)。
 */
export async function 回档至(楼层: number): Promise<void> {
  if (进行中) return;
  const 末楼 = getLastMessageId();
  if (!Number.isInteger(楼层) || 楼层 < 0 || 楼层 >= 末楼) {
    eventEmit('人妻公寓:回合失败', '没有可回退的楼层');
    return;
  }
  进行中 = true;
  try {
    await deleteChatMessages(_.range(楼层 + 1, 末楼 + 1), { refresh: 'none' });
    await updateVariablesWith(
      vars => {
        for (const 键 of [...回合变量键, '_上次回合']) _.set(vars, 键, null);
        裁手机时间线(vars, 楼层);
        return vars;
      },
      { type: 'chat' },
    );
    console.info(`[人妻公寓] 回档至 ${楼层} 楼`);
    eventEmit('人妻公寓:回合完成');
  } catch (e) {
    console.error('[人妻公寓] 回档失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
  } finally {
    进行中 = false;
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
  '"让他先干正事!"父亲在那头听见了,嗓门大了一格,又很快归于公事公办,"信箱里有这个月的租约单子。101 报了水管的修,102 该收租了。都是你的事了。"',
  '',
  '电话挂断。桌上的汤还在冒热气,钥匙串在你手心里沉甸甸的。',
  '',
  '这栋楼,现在是你的了——连同楼里住着的那些人,和他们各自关起门来的日子。',
].join('\n');

/** 序章开局按钮的行动选项(职务引导软引导第一拍;待办清单在客户端) */
const 序章行动选项 = [
  '去信箱区看看这个月的租约单子',
  '去一层大堂检查声控灯和门口的共享伞',
  '去 102 收这个月的房租',
  '去管理员室喝了妈盛的汤,把钥匙和账本理一遍',
];

/**
 * 开始新游戏(客户端难度选择卡调用):写难度档 → 创建第 1 楼固定演出 → 序章完成。
 * 幂等:已完成序章直接拒绝(单向语义随楼层快照走,回档到 0 楼=重开序章)。
 */
export async function 开始新游戏(难度: string): Promise<boolean> {
  if (进行中) return false;
  进行中 = true;
  try {
    const 档 = 难度表[难度] ? 难度 : '标准';
    const 有效 = 读取最近有效();
    if (!有效) throw new Error('变量还没就绪，请稍等两秒再开始');
    const { data } = 有效;
    if (data.系统._序章完成) {
      console.warn('[人妻公寓] 序章已完成,忽略重复开局');
      return false;
    }
    data.系统._难度 = 档;
    data.系统._序章完成 = true;
    data.现金 = 难度表[档].起始资金;
    data.胜任度 = 难度表[档].起始胜任度;
    // 旧版曾在 0 楼预置工具箱；开始新游戏时必须显式清空，不能把旧变量沿用进新局。
    // 工具箱现在只能花 200 元从商店购买。
    data.背包 = [];

    const 旧 = Mvu.getMvuData({ type: 'message', message_id: -1 });
    const 新 = _.cloneDeep(旧);
    _.set(新, 'stat_data', data);
    await createChatMessages([{ role: 'assistant', message: 父亲来电正文, data: 新 }], { refresh: 'none' });
    捕获保护快照(data);
    await insertOrAssignVariables({ _行动选项: 序章行动选项 }, { type: 'chat' });

    console.info(`[人妻公寓] 序章开局完成(难度:${档},起始资金:${难度表[档].起始资金})`);
    await 记录数据库回合(getLastMessageId(), data, '开始新游戏', 父亲来电正文, [], []);
    广播生成完成事件();
    eventEmit('人妻公寓:回合完成');
    return true;
  } catch (e) {
    console.error('[人妻公寓] 序章开局失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
    return false;
  } finally {
    进行中 = false;
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
  if (进行中) return;
  进行中 = true;
  try {
    const 末楼 = getLastMessageId();
    if (末楼 >= 1) await deleteChatMessages(_.range(1, 末楼 + 1), { refresh: 'none' });

    // 过程变量与镜像先清(镜像清在重建首批入住之前,避免旧镜像并入新出厂态)
    await updateVariablesWith(
      vars => {
        for (const 键 of [
          ...回合变量键,
          '_上次回合',
          '_在场',
          '_行动选项',
          '_粘滞',
          '_待办',
          '_侦探',
          '_摄像头',
          '_微信',
          '_经济',
          '_赴约',
          '_工具由头',
          '_换装余波',
          PROMOTE_MIRROR_KEY,
        ]) {
          _.set(vars, 键, null);
        }
        return vars;
      },
      { type: 'chat' },
    );
    清保护快照();

    // 0 楼 stat 重写成出厂态:默认值 + 首批入住(与 index.确保首批入住 同一套模板)
    const 出厂 = Schema.parse({}) as SchemaType;
    for (const m of 首批门牌) {
      出厂.户[m] = 创建户节点(0);
      镜像直写(m, { 入住楼层: 0 });
    }
    const 旧raw = Mvu.getMvuData({ type: 'message', message_id: -1 });
    await 脚本写入(旧raw, 出厂);
    捕获保护快照(出厂);

    console.info('[人妻公寓] 重开一局:楼层已删,0楼 stat 重建为出厂态(首批入住已就位)');
    eventEmit('人妻公寓:已重开');
  } catch (e) {
    console.error('[人妻公寓] 重开一局失败:', e);
    eventEmit('人妻公寓:回合失败', e instanceof Error ? e.message : String(e));
  } finally {
    进行中 = false;
  }
}
