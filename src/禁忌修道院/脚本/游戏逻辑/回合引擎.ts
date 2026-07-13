import type { 修女职位 } from '../../schema';
import { Schema, 修女职位列表 } from '../../schema';
import { 安检裁剪 } from './安检机';
import {
  取主动事件指令,
  取晋阶指令,
  刷新互动楼层,
  警戒回落,
  冷落检测,
  清主动事件,
  结算晋阶,
} from './eventSystem';
import { 取待注入数据卡, 取首夜指令, 清首夜标记 } from './meetingSystem';
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

export type 事件类型 = '数据卡' | '晋阶' | '首夜' | '主动';

let 进行中 = false;
export const 回合进行中 = () => 进行中;

// 流式转发:generate 的 iframe 事件转成自定义事件,客户端稳定可收
eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (文本: string) => {
  if (进行中) eventEmit('禁忌修道院:流式', 文本);
});

/** 事件指令优先级:会议数据卡 > 晋阶正戏 > 新规首夜 > 修女主动事件(互斥,一楼一事) */
export function 选事件指令(): { 文本: string; 类型: 事件类型 } | null {
  const 数据卡 = 取待注入数据卡();
  if (数据卡) return { 文本: 数据卡, 类型: '数据卡' };
  const 晋阶 = 取晋阶指令();
  if (晋阶) return { 文本: 晋阶, 类型: '晋阶' };
  const 首夜 = 取首夜指令();
  if (首夜) return { 文本: 首夜, 类型: '首夜' };
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

/** 快照 + 焦点一次组装(主路径与逃生舱 PROMPT_READY 共用) */
export function 组快照注入(对话尾: { role: string; content: string }[]): {
  快照: string;
  焦点: 修女职位[];
} {
  const { data } = 读取();
  return {
    快照: 组修道院快照(对话尾, data),
    焦点: 检测焦点(对话尾, data).焦点,
  };
}

/** 楼层落库前的清洗:思维链/界面标记/变量块不进楼层文本(prompt 与卷轴双干净) */
function 清洗正文(原文: string): string {
  return 原文
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g, '')
    .replace(/<StatusPlaceHolderImpl\/>/g, '')
    .replace(/【主页】/g, '')
    .trim();
}

/**
 * 回合结算:事件标记清理 + 互动楼层刷新 + 会议倒计时 + 警戒回落 + 冷落检测。
 * 主路径(回合引擎)与逃生舱路径(MESSAGE_RECEIVED)共用。
 */
export function 回合结算(本轮焦点: 修女职位[], 已注入事件: 事件类型 | null) {
  // 事件结算(与注入一一对应;swipe 不重演为骨架取舍)
  if (已注入事件 === '首夜') 清首夜标记();
  if (已注入事件 === '晋阶') 结算晋阶(); // 阶段+1 + 堕落度+10(大额涨幅)
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
        修女职位列表.map(职位 => [
          职位,
          { 支持度: data.修女[职位].支持度, 堕落度: data.修女[职位].堕落度 },
        ]),
      ) as 票值快照;
      insertOrAssignVariables(
        { _会议: { 票值快照: 快照, 触发楼层: getLastMessageId() } },
        { type: 'chat' },
      );
      console.info('[禁忌修道院] 会议触发,票值快照已定格');
    }
  }
  脚本写入(raw, data);

  // 冷落检测:排队"她主动来找你"(一次一人,读写在上面写入之后)
  冷落检测();
}

/** 主循环:玩家行动 → 生成 → 解析 → 落库 → 结算 → 通知客户端 */
export async function 执行回合(行动: string): Promise<void> {
  if (进行中) return;
  进行中 = true;
  try {
    eventEmit('禁忌修道院:生成开始');

    const 对话尾 = 近楼对话(行动);
    const { 快照, 焦点 } = 组快照注入(对话尾);

    const injects: Omit<InjectionPrompt, 'id'>[] = [
      { role: 'system', content: 快照, position: 'in_chat', depth: 0, should_scan: true },
    ];
    const 事件 = 选事件指令();
    if (事件) {
      injects.push({ role: 'system', content: 事件.文本, position: 'in_chat', depth: 0, should_scan: false });
    }

    const 原文 = String(await generate({ user_input: 行动, should_stream: true, injects }));

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

    eventEmit('禁忌修道院:回合完成');
  } catch (e) {
    console.error('[禁忌修道院] 回合执行失败:', e);
    eventEmit('禁忌修道院:回合失败', e instanceof Error ? e.message : String(e));
  } finally {
    进行中 = false;
  }
}
