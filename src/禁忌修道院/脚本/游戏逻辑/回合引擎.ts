import type { 修女职位 } from '../../schema';
import { Schema, 修女职位列表 } from '../../schema';
import { 安检裁剪 } from './安检机';
import { 取主动事件指令, 取晋阶指令, 刷新互动楼层, 警戒回落, 冷落检测, 清主动事件, 结算晋阶 } from './eventSystem';
import { 取待注入数据卡, 取首夜指令, 清首夜标记 } from './meetingSystem';
import { 结算圣器, 取圣器指令 } from './商店系统';
import { 读取, 脚本写入 } from './mvuIO';
import { 检测焦点, 组修道院快照 } from './snapshotSystem';
import type { 票值快照 } from './voteEngine';

/**
 * 回合引擎:固定 0 楼架构(诡秘剧场式)的主循环。
 *
 * 显示层永远只有 0 楼的客户端 iframe;后续楼层只是数据库:
 *   玩家行动 → generate(不建楼、不刷新显示) → Mvu.parseMessage 手动解析变量
 *   → 安检机裁剪 → createChatMessages({refresh:'none'}) 静默落库(AI 上下文/回档全靠它)
 *   → 回合结算(倒计时/冷落/警戒) → eventEmit 通知客户端刷新
 *
 * 事件流(客户端 ⇄ 脚本):
 *   禁忌修道院:玩家行动 ← 客户端游戏内输入
 *   禁忌修道院:生成开始/流式/回合完成/回合失败 → 客户端(流式渲染+解锁输入)
 */

export type 事件类型 = '数据卡' | '晋阶' | '首夜' | '圣器' | '主动';

let 进行中 = false;
export const 回合进行中 = () => 进行中;

// ── 重掷支持:回合快照(存 chat 变量,iframe 重载/刷新后仍可重掷) ──

/** 回合内会被写的 chat 变量键(重掷时按快照整值恢复) */
const 回合变量键 = ['_会议', '_首夜', '_主动事件', '_晋阶'] as const;

type 上次回合记录 = {
  行动: string;
  回合前末楼: number;
  chat快照: Record<string, unknown>;
};

function 读上次回合(): 上次回合记录 | undefined {
  return (_.get(getVariables({ type: 'chat' }), '_上次回合') ?? undefined) as 上次回合记录 | undefined;
}

// 流式转发:generate 的 iframe 事件转成自定义事件,客户端稳定可收。
// 用 generation_id 只认自家生成——数据库/总结类第三方脚本自己也会调 generate,
// 不过滤的话它们的表格填充内容会被误当正文推给客户端(shujuku 插件冲突根源之一)。
// (iframe_events 是常量,顶层安全;先清防切聊天 reload 后监听累积)
let 本回合生成id = '';
eventClearEvent(iframe_events.STREAM_TOKEN_RECEIVED_FULLY);
eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (文本: string, generation_id: string) => {
  if (!进行中) return;
  // 有 id 且不匹配才过滤(挡第三方插件的 generate);id 缺失=旧版助手不透传,放行以免全程无流式
  if (generation_id && generation_id !== 本回合生成id) return;
  eventEmit('禁忌修道院:流式', 文本);
});

// ── 取消本回合("打断这一笔"):停掉生成,作废的回合不落书页 ──
let 已取消 = false;
export function 取消本回合() {
  if (!进行中 || !本回合生成id) return;
  已取消 = true;
  try {
    if (!stopGenerationById(本回合生成id)) stopAllGeneration();
  } catch (e) {
    console.error('[禁忌修道院] 停止生成失败:', e);
  }
}

/** 事件指令优先级:会议数据卡 > 晋阶正戏 > 新规首夜 > 圣器(黑市解锁) > 修女主动事件(互斥,一楼一事) */
export function 选事件指令(): { 文本: string; 类型: 事件类型 } | null {
  const 数据卡 = 取待注入数据卡();
  if (数据卡) return { 文本: 数据卡, 类型: '数据卡' };
  const 晋阶 = 取晋阶指令();
  if (晋阶) return { 文本: 晋阶, 类型: '晋阶' };
  const 首夜 = 取首夜指令();
  if (首夜) return { 文本: 首夜, 类型: '首夜' };
  const 圣器 = 取圣器指令(读取().data);
  if (圣器) return { 文本: 圣器, 类型: '圣器' };
  const 主动 = 取主动事件指令();
  if (主动) return { 文本: 主动, 类型: '主动' };
  return null;
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
    console.error('[禁忌修道院] 读取楼层尾部失败:', e);
  }
  if (行动) 尾.push({ role: 'user', content: 行动 });
  return 尾;
}

/** 快照 + 焦点一次组装(主路径与逃生舱 PROMPT_READY 共用);顺手把在场名单落 chat 变量供客户端头像行点亮 */
export function 组快照注入(对话尾: { role: string; content: string }[]): {
  快照: string;
  焦点: 修女职位[];
} {
  const { data } = 读取();
  const { 焦点, 背景 } = 检测焦点(对话尾, data);
  insertOrAssignVariables({ _在场: { 焦点, 背景 } }, { type: 'chat' });
  return {
    快照: 组修道院快照(对话尾, data),
    焦点,
  };
}

/** 楼层落库前的清洗:思维链/界面标记/变量块/行动选项不进楼层文本(prompt 与卷轴双干净) */
function 清洗正文(原文: string): string {
  return (
    原文
      .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
      .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '') // 预设泄漏的注释标记(如 Test Inputs Were Rejected)
      .replace(/^\s*-{2,}>?\s*$/gm, '')
      .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
      .replace(/<行动选项>[\s\S]*?<\/行动选项>/g, '')
      // 生成被截断时的未闭合块也吞掉,否则半截标记块会永久留在楼层原文里(羽笔编辑可见)
      .replace(/<think(?:ing)?>[\s\S]*$/i, '')
      .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
      .replace(/<UpdateVariable>[\s\S]*$/, '')
      .replace(/<行动选项>[\s\S]*$/, '')
      .replace(/<!--[\s\S]*$/, '')
      .replace(/<StatusPlaceHolderImpl\/>/g, '')
      .replace(/【主页】/g, '')
      .trim()
  );
}

/** 行动选项(AI 隐藏块 → 客户端可点即发的选项;最多 4 条)。
 *  块固定在消息末尾,模型常忘写/截断闭合标签——闭合缺失就吃到文末,选项不丢 */
function 提取行动选项(原文: string): string[] {
  const m = 原文.match(/<行动选项>([\s\S]*?)(?:<\/行动选项>|$)/);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map(s => s.replace(/^[-·•*\d.、\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

/**
 * 回合结算:事件标记清理 + 互动楼层刷新 + 会议倒计时 + 警戒回落 + 冷落检测。
 * 主路径(回合引擎)与逃生舱路径(MESSAGE_RECEIVED)共用。
 */
export function 回合结算(本轮焦点: 修女职位[], 已注入事件: 事件类型 | null) {
  // 事件结算(与注入一一对应;swipe 不重演为骨架取舍)
  if (已注入事件 === '首夜') 清首夜标记();
  if (已注入事件 === '晋阶') 结算晋阶(); // 阶段+1 + 堕落度+10(大额涨幅)
  if (已注入事件 === '圣器') 结算圣器(); // 黑市解锁 + 封口钱 + 司库线里程碑
  if (已注入事件 === '主动') 清主动事件();

  // 焦点修女互动楼层刷新(冷落计时器的数据源)
  刷新互动楼层(本轮焦点);

  const { raw, data } = 读取();
  if (data.会议.状态 === '日常') {
    // 警戒度自然回落(涨的语义检测〔待定〕,事件侧走 调警戒 接口)
    警戒回落(data);

    if (data.会议.倒计时 > 0) {
      data.会议.倒计时 -= 1;
    }
    if (data.会议.倒计时 <= 0) {
      data.会议.状态 = '会议中';

      // 票值快照:会议触发楼立即定格全员支持度/堕落度,投票按快照算,
      // 会议楼内的数值变动不影响本次结果(存 chat 变量,AI 不需要看见 → 不进 stat_data)
      const 快照 = Object.fromEntries(
        修女职位列表.map(职位 => [职位, { 支持度: data.修女[职位].支持度, 堕落度: data.修女[职位].堕落度 }]),
      ) as 票值快照;
      insertOrAssignVariables({ _会议: { 票值快照: 快照, 触发楼层: getLastMessageId() } }, { type: 'chat' });
      console.info('[禁忌修道院] 会议触发,票值快照已定格');
    }
  }
  脚本写入(raw, data);

  // 破锁是一幕性的突发标记:演完这一楼即清除(场景保留,玩家还在房里)
  const 场景 = _.get(getVariables({ type: 'chat' }), '_场景') as { 破锁?: boolean } | undefined;
  if (场景?.破锁) {
    updateVariablesWith(
      vars => {
        _.set(vars, '_场景.破锁', false);
        return vars;
      },
      { type: 'chat' },
    );
  }

  // 冷落检测:排队"她主动来找你"(一次一人,读写在上面写入之后)
  冷落检测();
}

/** 主循环:玩家行动 → 生成 → 解析 → 落库 → 结算 → 通知客户端 */
export async function 执行回合(行动: string): Promise<void> {
  if (进行中) return;
  进行中 = true;
  try {
    eventEmit('禁忌修道院:生成开始');

    // 重掷快照:回合前末楼号 + 回合内会动的 chat 变量整值
    const 回合前末楼 = getLastMessageId();
    const chat快照 = _.cloneDeep(_.pick(getVariables({ type: 'chat' }), 回合变量键));

    const 对话尾 = 近楼对话(行动);
    const { 快照, 焦点 } = 组快照注入(对话尾);

    const injects: Omit<InjectionPrompt, 'id'>[] = [
      { role: 'system', content: 快照, position: 'in_chat', depth: 0, should_scan: true },
    ];
    const 事件 = 选事件指令();
    if (事件) {
      injects.push({ role: 'system', content: 事件.文本, position: 'in_chat', depth: 0, should_scan: false });
    }

    已取消 = false;
    本回合生成id = `xdy-${回合前末楼}-${_.random(1e9)}`;
    const 原文 = String(
      await generate({ user_input: 行动, should_stream: true, injects, generation_id: 本回合生成id }),
    );
    if (已取消) {
      eventEmit('禁忌修道院:回合失败', '已取消——这一笔没有落纸');
      return;
    }

    // 楼层由 createChatMessages 静默创建,不经酒馆生成管道 → MVU 不会自动解析,手动 parse + 安检
    const 旧 = Mvu.getMvuData({ type: 'message', message_id: -1 });
    const 新 = ((await Mvu.parseMessage(原文, 旧)) ?? 旧) as Record<string, unknown>;
    const newStat = Schema.parse(_.get(新, 'stat_data') ?? {});
    const oldStat = Schema.parse(_.get(旧, 'stat_data') ?? {});
    安检裁剪(newStat, oldStat);
    _.set(新, 'stat_data', newStat);

    const 正文 = 清洗正文(原文) || '(修道院陷入了短暂的寂静……本轮 AI 未返回正文,可换个说法再试)';
    await createChatMessages(
      [
        { role: 'user', message: 行动 },
        { role: 'assistant', message: 正文, data: 新 },
      ],
      { refresh: 'none' },
    );

    // 结算写在新楼(message_id:-1 已指向它)
    回合结算(焦点, 事件?.类型 ?? null);

    // 落重掷记录(回合成功才落——失败的回合没有楼可删)+ 本轮行动选项
    insertOrAssignVariables(
      {
        _上次回合: { 行动, 回合前末楼, chat快照 } satisfies 上次回合记录,
        _行动选项: 提取行动选项(原文),
      },
      { type: 'chat' },
    );

    eventEmit('禁忌修道院:回合完成');
  } catch (e) {
    if (已取消) {
      eventEmit('禁忌修道院:回合失败', '已取消——这一笔没有落纸');
    } else {
      console.error('[禁忌修道院] 回合执行失败:', e);
      eventEmit('禁忌修道院:回合失败', e instanceof Error ? e.message : String(e));
    }
  } finally {
    进行中 = false;
    本回合生成id = ''; // 防回档等无生成的回合被"取消"误伤
  }
}

/**
 * 重掷本回合("撕掉这页重写"):
 *   删掉上一回合创建的楼层 —— 每楼自带 stat_data 快照,变量随楼自动回滚(固定 0 楼架构红利);
 *   chat 变量按回合前快照整值恢复(会议票值/首夜/主动事件/晋阶排队);
 *   然后用原行动重新执行一回合。
 */
export async function 重掷回合(): Promise<void> {
  if (进行中) return;
  const 记录 = 读上次回合();
  const 末楼 = getLastMessageId();
  if (!记录 || 末楼 <= 记录.回合前末楼) {
    eventEmit('禁忌修道院:回合失败', '没有可重写的回合');
    return;
  }
  try {
    await deleteChatMessages(_.range(记录.回合前末楼 + 1, 末楼 + 1), { refresh: 'none' });
    // updateVariablesWith + _.set 整值替换(insertOrAssign 对对象是深合并,会残留回合内新增的键)
    await updateVariablesWith(
      vars => {
        for (const 键 of 回合变量键) _.set(vars, 键, (记录.chat快照 as Record<string, unknown>)[键] ?? null);
        return vars;
      },
      { type: 'chat' },
    );
  } catch (e) {
    console.error('[禁忌修道院] 重掷回滚失败:', e);
    eventEmit('禁忌修道院:回合失败', e instanceof Error ? e.message : String(e));
    return;
  }
  await 执行回合(记录.行动);
}

/**
 * 时之烛台回档:烧掉指定楼层之后的一切书页。
 *   变量随楼回滚(每楼自带 stat_data 快照);回合类 chat 变量(会议票值/首夜/主动事件/
 *   晋阶排队/重掷记录)一律清空——它们排队于被烧掉的时间线,保守清掉最安全,
 *   玩家可重新触发(晋阶按钮还在,会议倒计时在 stat_data 里随楼恢复)。
 */
export async function 回档至(楼层: number): Promise<void> {
  if (进行中) return;
  const 末楼 = getLastMessageId();
  if (!Number.isInteger(楼层) || 楼层 < 0 || 楼层 >= 末楼) {
    eventEmit('禁忌修道院:回合失败', '没有可烧掉的书页');
    return;
  }
  进行中 = true;
  try {
    await deleteChatMessages(_.range(楼层 + 1, 末楼 + 1), { refresh: 'none' });
    await updateVariablesWith(
      vars => {
        for (const 键 of [...回合变量键, '_上次回合', '_在场', '_行动选项']) _.set(vars, 键, null);
        return vars;
      },
      { type: 'chat' },
    );
    console.info(`[禁忌修道院] 回档至 ${楼层} 楼,之后的书页已烧毁`);
    eventEmit('禁忌修道院:回合完成');
  } catch (e) {
    console.error('[禁忌修道院] 回档失败:', e);
    eventEmit('禁忌修道院:回合失败', e instanceof Error ? e.message : String(e));
  } finally {
    进行中 = false;
  }
}
