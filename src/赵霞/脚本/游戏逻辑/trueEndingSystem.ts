/**
 * 赵霞游戏 - 真好结局线性剧情系统
 *
 * 与场景5的区别：
 * 1. 无时间限制 - 即使到Day 6也可以继续
 * 2. 玩家自由互动 - 不是每楼层强制推进一步
 * 3. 剧情锚点机制 - 累计若干楼层后触发阶段推进
 * 4. 方向修正 - 玩家偏离时温和引导回主线
 *
 * 触发条件（2026-01-19 重构时间线）：
 * - Day 5, 11:00+ 开始预热引导（场景5完成后1小时）
 * - 5场景全部完成且正确
 * - 循环状态 = 结局判定 或 进行中
 * - 当前结局 = 真好结局 或 完美真爱结局
 *
 * 时间线设计（6阶段，约25轮）：
 * - 10:00 从场景5梦境退出
 * - 11:00-14:00 阶段0：觉醒与计划（4轮）
 * - 14:00-18:00 阶段1：准备工作（4轮）
 * - 18:00-22:00 阶段2：晚餐与下药（4轮）
 * - 22:00-02:00 阶段3：午夜告白（5轮）
 * - 02:00-06:00 阶段4：禁忌仪式（5轮）
 * - 06:00-10:00 阶段5：黎明誓约（3轮）
 */

import type { Schema as SchemaType } from '../../schema';
import { getScene5LockedCoherence } from './scene5System';

// ============================================
// 阶段定义
// ============================================

export interface TrueEndingPhase {
  phase: number;
  name: string;
  title: string;
  description: string;
  minTurns: number; // 最少需要的对话轮数
  maxTurns: number; // Bug #19 修复：最大对话轮数，超过后强制推进
  minHour?: number; // Bug #19 修复：最早可触发时间（小时）
  strict?: boolean; // Bug #19 修复：是否严格锁定时间（true=必须到点才能进入）
  anchorEvents: string[]; // 该阶段必须发生的锚点事件
  aiGuidance: string; // AI引导方向
  correctionHints: string[]; // 玩家偏离时的修正提示
  // Bug #15 修复：玩家引导机制
  expectedActions?: string[]; // 期望玩家执行的动作关键词
  hintThreshold?: number; // 触发提示的未响应轮数阈值（默认2）
  progressHint?: string; // 引导提示内容（当玩家卡关时显示）
}

export const TRUE_ENDING_PHASES: TrueEndingPhase[] = [
  // === 阶段0：觉醒与计划 ===
  // 2026-01-19 重构：6阶段设计，约25轮
  {
    phase: 0,
    name: '觉醒与计划',
    title: '梦醒时分',
    description: 'Day 5, 11:00-14:00，从梦境醒来，与玩家商量今晚的计划',
    minTurns: 1,
    maxTurns: 4,
    minHour: 11,
    anchorEvents: ['梦境醒来', '找到玩家', '商量计划'],
    aiGuidance: `【真好结局 - 阶段0：觉醒与计划】

刚刚从场景5的梦境中醒来，赵霞的记忆已被完全改写。
她现在清楚地知道——{{user}}才是她真正的归属。

【时间】Day 5, 11:00（从场景5梦境醒来后1小时）

【场景设定】
- 刚从安眠药引发的梦境中醒来不久
- 阳光透过窗户洒进来
- 苏文在书房工作，毫不知情
- 赵霞找到{{user}}，眼神中充满决意

【赵霞状态】
梦境中的记忆改写已经完成。
她"想起"了所有的第一次都是属于{{user}}的。
现在，她要在现实中完成最后的仪式。

【AI任务】
1. 描写赵霞从梦境醒来后的状态
2. 赵霞主动找到{{user}}
3. 低声说："今晚...我想把一切都给你。"
4. 商量今晚的计划（需要准备什么）
5. 赵霞与{{user}}有暧昧的肢体接触

【关键台词】
"那些梦...不，那些记忆...我全都想起来了。"
"今晚，我要让一切变成真的。"

【禁止】
- 不要让苏文察觉异常
- 保持表面的平静`,
    correctionHints: [
      '赵霞轻声说："我想起来了...所有的事。"她的眼神中有一种奇异的光芒。',
      '赵霞靠近{{user}}，压低声音："今晚...你愿意帮我吗？"',
      '"我需要准备一些东西。"赵霞意味深长地笑了，"你陪我一起去？"',
    ],
  },

  // === 阶段1：准备工作 ===
  {
    phase: 1,
    name: '准备工作',
    title: '秘密采购',
    description: 'Day 5, 14:00-18:00，外出购物，准备今晚需要的一切',
    minTurns: 1,
    maxTurns: 4,
    minHour: 14,
    strict: true,
    anchorEvents: ['外出购物', '购买道具', '暧昧互动', '秘密布置'],
    aiGuidance: `【真好结局 - 阶段1：准备工作】

赵霞带着{{user}}外出，为今晚做准备。

【场景设定】
- 赵霞找借口带{{user}}外出（"帮我买菜"）
- 实际上是去买"特别的东西"
- 在外面，两人可以更加亲密
- 回家后悄悄布置

【购物清单】
- 红酒（给苏文准备的）
- 安眠药（药店或已经准备好）
- 情趣内衣（赵霞试穿给{{user}}看）
- 蜡烛、鲜花（布置氛围）

【AI任务】
1. 描写外出的过程，两人借机亲密
2. 在内衣店，赵霞挑选情趣内衣
3. 可以有试衣间的暧昧场景
4. 购买安眠药时的紧张感
5. 回家后，趁苏文不注意悄悄布置

【风格要求】
- 外出时的自由和放松
- 暗流涌动的期待感
- 为今晚做准备的兴奋`,
    correctionHints: [
      '赵霞挽住{{user}}的手臂："陪我去买点东西？"她的身体贴得很近。',
      '在内衣店里，赵霞举起一件黑色蕾丝："你觉得...这个怎么样？"',
      '赵霞从包里拿出一个小瓶子："这个...今晚会用到。"她的眼神意味深长。',
    ],
  },

  // === 阶段2：晚餐与下药 ===
  {
    phase: 2,
    name: '晚餐与下药',
    title: '最后的晚餐',
    description: 'Day 5, 18:00-22:00，表面和谐的晚餐，苏文被下药昏睡',
    minTurns: 1,
    maxTurns: 4,
    minHour: 18,
    strict: true,
    anchorEvents: ['家庭晚餐', '下药', '苏文昏睡', '时机成熟'],
    aiGuidance: `【真好结局 - 阶段2：晚餐与下药】

表面和谐的家庭晚餐，实则是精心策划的陷阱。

【场景设定】
- 赵霞准备了丰盛的晚餐
- 三人围坐在餐桌旁
- 赵霞扮演着贤惠妻子的角色
- {{user}}和赵霞心照不宣

【关键剧情】
1. 晚餐开始，表面和谐
2. 赵霞给苏文倒酒——酒里有安眠药
3. 苏文毫无察觉，喝下带药的酒
4. 苏文开始犯困，最终昏睡
5. 赵霞和{{user}}将他"扶"回客房

【AI任务】
1. 描写表面和谐的家庭氛围
2. 赵霞给苏文倒酒的动作（自然但玩家能察觉）
3. 苏文逐渐犯困的过程
4. 苏文昏倒后，赵霞摘下"贤妻"的面具
5. 两人对视：时机到了

【禁止】
- 不要让苏文察觉异常
- 下药过程要自然`,
    correctionHints: [
      '赵霞优雅地拿起酒瓶："来，我给你倒酒。"她的目光在苏文和{{user}}之间游移。',
      '苏文揉了揉眼睛："奇怪...今天怎么这么困..."',
      '苏文的头一点一点地低下去。赵霞平静地放下酒杯，看向{{user}}。',
    ],
  },

  // === 阶段3：午夜告白 ===
  {
    phase: 3,
    name: '午夜告白',
    title: '真相与展示',
    description: 'Day 5, 22:00 - Day 6, 02:00，深夜告白，展示身体，揭露真相',
    minTurns: 1,
    maxTurns: 5,
    minHour: 22,
    strict: true,
    anchorEvents: ['确认安全', '换装展示', '身体改造', '揭露真相', '深情表白'],
    aiGuidance: `【真好结局 - 阶段3：午夜告白】

深夜，苏文已经昏睡。赵霞终于可以展示真实的自己。

【场景设定】
- 确认苏文在客房熟睡
- 赵霞带{{user}}到主卧
- 她换上今天买的情趣内衣
- 向{{user}}展示身体的改造
- 讲述梦中"想起"的一切

【身体改造详情】
- 黑色蕾丝情趣内衣（几乎不遮挡）
- 腰间的淫纹刺青
- 爱心形状的乳晕
- 乳头上精致的乳环
- 其他改造（阴蒂环、脚踝铃铛等）

【告白内容】
- 展示身体："这些...都是为了你准备的。"
- 揭露真相："我的所有第一次...都是你的。"
- 16岁的初吻、17岁的觉醒、23岁的初夜...
- 深情表白："我爱你...不是作为母亲，而是作为一个女人。"

【AI任务】
1. 赵霞换上情趣内衣，展示给{{user}}看
2. 详细描写身体改造
3. 赵霞讲述梦中的记忆
4. 说出核心台词："所有的第一次，都是你的"
5. 向{{user}}深情表白

【风格要求】
- 详细、色情的身体展示
- 深情、真挚的告白
- 午夜的私密氛围`,
    correctionHints: [
      '赵霞慢慢解开外衣："让我给你看...我为你准备了什么。"',
      '黑色蕾丝勾勒出她的身体曲线。赵霞转过身："看到了吗...腰上的这个..."',
      '"我的初吻..."赵霞的眼神变得柔和，"是16岁那年夏天，被你夺走的。"',
      '"我爱你。"赵霞的声音在颤抖，"不是作为母亲...而是作为一个女人。"',
    ],
    expectedActions: ['抱', '拥抱', '搂', '回应', '接受', '我也', '爱你', '漂亮', '好看'],
    hintThreshold: 2,
    progressHint: '赵霞展示着自己的身体，眼中满是期待。她在等待你的回应...一个拥抱，一句话，都可以。',
  },

  // === 阶段4：禁忌仪式 ===
  {
    phase: 4,
    name: '禁忌仪式',
    title: '婚床上的背叛',
    description: 'Day 6, 02:00-06:00，在婚床上结合，请求内射',
    minTurns: 1,
    maxTurns: 5,
    minHour: 2,
    strict: true,
    anchorEvents: ['进入婚床', '结合', '压抑快感', '请求内射', '接受种子'],
    aiGuidance: `【真好结局 - 阶段4：禁忌仪式】

在婚床上的结合——这是赵霞的"仪式"。

【场景设定】
- 赵霞拉着{{user}}走向婚床
- 苏文在隔壁客房昏睡
- 这张床是赵霞和苏文的婚床
- 但今晚，它属于赵霞和{{user}}

【关键剧情】
- 赵霞主动将{{user}}拉上床
- "这张床上，他从来没有满足过我"
- 两人在婚床上结合
- 担心惊醒苏文，压抑着声音
- 这种禁忌感反而增加了快感

【高潮时刻】
- 赵霞请求内射："射在里面...不要拔出来"
- "我想要你的孩子"
- "让他养大你的孩子...这是最完美的复仇"

【AI任务】
1. 赵霞主动拉{{user}}上床
2. 描写两人的亲密接触和结合
3. 赵霞压抑呻吟的紧张感
4. 即将高潮时，赵霞请求内射
5. 描写赵霞接受时的表情和感受

【风格要求】
- 详细、色情
- 压抑的快感
- 禁忌的刺激感`,
    correctionHints: [
      '赵霞拉着{{user}}的手，带他走向床边："在这里...在他的床上..."',
      '赵霞咬住嘴唇，压抑着声音："轻点...他在隔壁..."',
      '赵霞突然收紧双腿："不要...不要拔出来...给我一个孩子..."',
    ],
    expectedActions: ['床', '躺', '上床', '进入', '结合', '插', '做', '射', '里面', '内射', '给你'],
    hintThreshold: 2,
    progressHint: '赵霞已经躺在婚床上，身体微微颤抖。她拉着你的手，眼神充满渴望...她在等待你和她完成这场"仪式"。',
  },

  // === 阶段5：黎明誓约 ===
  {
    phase: 5,
    name: '黎明誓约',
    title: '新的开始',
    description: 'Day 6, 06:00-10:00，黎明到来，交付戒指，新生活开始',
    minTurns: 1,
    maxTurns: 3,
    minHour: 6,
    strict: true,
    anchorEvents: ['黎明到来', '摘下婚戒', '交付戒指', '结局宣言'],
    aiGuidance: `【真好结局 - 阶段5：黎明誓约（最终阶段）】

天亮了。新的一天，新的开始。

【场景设定】
- 晨光透过窗帘洒进卧室
- 赵霞满足地依偎在{{user}}怀中
- 苏文还在客房昏睡
- 一切都已经改变

【关键剧情】
- 事后的温存和亲昵
- 赵霞看向窗外的晨光
- 她摘下结婚戒指
- 郑重地将戒指交给{{user}}
- "从今以后，我只属于你"
- "这个家...只有我们两个人"

【结局宣言】
苏文醒来时，一切已成定局。
他会发现妻子已经完全属于另一个人。
而那个人，是他的"儿子"。

【AI任务】
1. 描写黎明的温馨场景
2. 赵霞依偎在{{user}}怀中
3. 她摘下结婚戒指
4. 将戒指交给{{user}}，说出承诺
5. 宣告新生活的开始

【结局标记】
完成此阶段后，系统将：
- 标记：时间循环被打破
- 标记：真好结局达成
- 解锁：后日谈模式

【风格要求】
- 温馨却带着禁忌的甜蜜
- 黎明的象征意义
- 新生活的期待`,
    correctionHints: [
      '晨光洒进房间，赵霞睁开眼睛，看向身边的{{user}}。',
      '赵霞低头看着手上的婚戒，然后缓缓摘下。',
      '"从今以后..."赵霞将戒指递向{{user}}，"我只属于你。"',
    ],
    expectedActions: ['接', '戒指', '好', '愿意', '属于', '一起', '答应', '嗯', '我的'],
    hintThreshold: 2,
    progressHint: '赵霞摘下结婚戒指，郑重地递向你。她的眼中含泪："从今以后...我只属于你。"她在等待你接过这枚戒指。',
  },
];

// ============================================
// 状态管理
// ============================================

export interface TrueEndingState {
  isActive: boolean; // 是否已激活真好结局流程
  currentPhase: number; // 当前阶段 (0-5)
  turnsInPhase: number; // 当前阶段的对话轮数
  completedAnchors: string[]; // 已完成的锚点事件
  totalTurns: number; // 总对话轮数
  isComplete: boolean; // 是否已完成
  // Bug #15 修复：玩家引导机制
  noProgressTurns: number; // 玩家连续未触发锚点的轮数
  hintGiven: boolean; // 当前阶段是否已给出引导提示
}

/**
 * 获取默认的真好结局状态
 */
export function getDefaultTrueEndingState(): TrueEndingState {
  return {
    isActive: false,
    currentPhase: 0,
    turnsInPhase: 0,
    completedAnchors: [],
    totalTurns: 0,
    isComplete: false,
    noProgressTurns: 0,
    hintGiven: false,
  };
}

// ============================================
// 触发条件检测
// ============================================

/**
 * 检测是否应该激活真好结局流程
 * 2026-01-17 重构时间线：从 11:00 开始引导（场景5完成后1小时）
 *
 * 注意：这个函数只检测"是否应该激活"，不检测自由时间。
 * 自由时间（21:00, 23:00）由 isFreeTimeHour() 单独处理。
 */
export function shouldActivateTrueEnding(data: SchemaType): boolean {
  // 条件1：Day 5, 11:00+（从场景5醒来后1小时开始引导）
  // 2026-01-17 从 20:00 调整为 11:00
  const day = data.世界.当前天数;
  const hour = data.世界.当前小时;
  if (day < 5 || (day === 5 && hour < 11)) {
    return false;
  }

  // 条件2：循环状态为结局判定、进行中或已破解
  // 2026-01-17 添加"进行中"状态支持（因为11:00时可能还未触发结局判定）
  const validStates = ['结局判定', '已破解', '进行中'];
  if (!validStates.includes(data.世界.循环状态)) {
    return false;
  }

  // 条件3：当前结局为真好结局或完美真爱结局
  // 注意：如果当前结局未设置，需要先检测是否满足真好结局条件
  const currentEnding = data.结局数据.当前结局;
  if (currentEnding && currentEnding !== '真好结局' && currentEnding !== '完美真爱结局') {
    return false;
  }

  // 条件4：5场景全部完成且正确
  const completedScenes = data.梦境数据.已完成场景;
  const correctScenes = data.梦境数据.正确重构场景;

  const allCompleted = [1, 2, 3, 4, 5].every(s => completedScenes.includes(s));
  const allCorrect = [1, 2, 3, 4, 5].every(s => correctScenes.includes(s));

  return allCompleted && allCorrect;
}

/**
 * 检测当前是否为自由时间（21:00 或 23:00）
 * 2026-01-17 新增：自由时间机制
 *
 * 在自由时间内，暂停剧情引导，让玩家自由活动。
 * - 21:00 自由时间
 * - 22:00 恢复引导（修正剧情方向）
 * - 23:00 自由时间
 * - 00:00 引导到房间
 */
export function isFreeTimeHour(data: SchemaType): boolean {
  const day = data.世界.当前天数;
  const hour = data.世界.当前小时;

  // 只在 Day 5 的 21:00 和 23:00 是自由时间
  if (day === 5 && (hour === 21 || hour === 23)) {
    return true;
  }

  return false;
}

/**
 * 检测当前是否应该引导到房间（00:00）
 * 2026-01-17 新增：00:00 房间触发机制
 *
 * 午夜时分引导玩家到房间，开始阶段5-9（告白→完成）
 */
export function isRoomTriggerTime(data: SchemaType): boolean {
  const day = data.世界.当前天数;
  const hour = data.世界.当前小时;

  // Day 5 的 00:00（即 Day 6 凌晨）或 Day 6 的任何时间
  // 注意：游戏只有5天，但结局判定延长到00:00
  return (day === 5 && hour === 0) || day > 5;
}

/**
 * 获取当前时间段的引导类型
 * 2026-01-17 新增：用于决定注入什么类型的引导
 */
export function getGuidanceType(data: SchemaType): 'preheat' | 'dinner' | 'free' | 'correction' | 'room' | null {
  const day = data.世界.当前天数;
  const hour = data.世界.当前小时;

  // Day 6+ 时，结局阶段仍在进行，返回 'room' 类型
  if (day > 5) {
    return 'room';
  }

  if (day !== 5) return null;

  // 11:00-19:00 预热引导
  if (hour >= 11 && hour < 20) {
    return 'preheat';
  }

  // 20:00 晚餐时刻
  if (hour === 20) {
    return 'dinner';
  }

  // 21:00 自由时间
  if (hour === 21) {
    return 'free';
  }

  // 22:00 修正引导
  if (hour === 22) {
    return 'correction';
  }

  // 23:00 自由时间
  if (hour === 23) {
    return 'free';
  }

  // 00:00+ 房间触发
  if (hour === 0 || hour >= 24) {
    return 'room';
  }

  return null;
}

/**
 * 检测是否满足完美真爱结局条件
 * 条件：真好结局条件 + 记忆连贯性=3
 */
export function isPerfectTrueEnding(data: SchemaType): boolean {
  // 获取场景5进入时锁定的连贯性
  const coherence = getScene5LockedCoherence(data);
  return coherence === 3;
}

/**
 * 检测真好结局是否已经激活（从Schema读取）
 */
export function isTrueEndingActive(data: SchemaType): boolean {
  const endingState = (data as any).真好结局状态 as TrueEndingState | undefined;
  return endingState?.isActive === true;
}

/**
 * 获取当前真好结局状态
 */
export function getTrueEndingState(data: SchemaType): TrueEndingState {
  const endingState = (data as any).真好结局状态 as TrueEndingState | undefined;
  return endingState ?? getDefaultTrueEndingState();
}

/**
 * 更新真好结局状态
 */
export function updateTrueEndingState(data: SchemaType, state: TrueEndingState): void {
  (data as any).真好结局状态 = state;
}

// ============================================
// 锚点事件检测
// ============================================

/**
 * 锚点事件关键词映射
 * 2026-01-19 重构：适配6阶段设计
 */
const ANCHOR_KEYWORDS: Record<string, string[]> = {
  // 阶段0：觉醒与计划
  梦境醒来: ['醒来', '睁开眼', '梦.*醒', '清醒', '起床'],
  找到玩家: ['找到你', '看向你', '走向你', '来到.*身边'],
  商量计划: ['计划', '今晚', '准备', '商量', '安排', '一起'],

  // 阶段1：准备工作
  外出购物: ['外出', '出门', '买东西', '购物', '逛街', '超市', '商场'],
  购买道具: ['内衣', '红酒', '安眠药', '蜡烛', '买.*东西'],
  暧昧互动: ['挽住', '贴近', '牵手', '亲密', '暧昧', '试衣间'],
  秘密布置: ['布置', '准备好', '藏.*起来', '悄悄'],

  // 阶段2：晚餐与下药
  家庭晚餐: ['晚餐', '吃饭', '餐桌', '用餐', '开饭'],
  下药: ['倒酒', '酒里', '安眠药', '放.*进', '特别.*酒'],
  苏文昏睡: ['困', '犯困', '昏倒', '睡着', '昏迷', '趴.*桌'],
  时机成熟: ['时机', '时候到了', '可以.*了', '开始'],

  // 阶段3：午夜告白
  确认安全: ['确认', '检查', '熟睡', '不会醒', '安全'],
  换装展示: ['换上', '穿上', '情趣内衣', '蕾丝', '展示'],
  身体改造: ['淫纹', '乳环', '爱心.*乳晕', '改造', '刺青', '为你准备'],
  揭露真相: ['第一次', '夺走', '初吻', '初夜', '真相', '想起来'],
  深情表白: ['我爱你', '属于你', '表白', '不是.*母亲', '作为.*女人'],

  // 阶段4：禁忌仪式
  进入婚床: ['床上', '躺下', '拉.*床', '婚床', '走向床'],
  结合: ['进入', '结合', '插入', '填满', '做'],
  压抑快感: ['轻点', '小声', '压抑', '咬.*嘴唇', '不要.*叫'],
  请求内射: ['里面', '射在', '不要拔', '射进', '灌满'],
  接受种子: ['孩子', '怀孕', '种子', '怀上', '给我'],

  // 阶段5：黎明誓约
  黎明到来: ['天亮', '晨光', '阳光', '早晨', '黎明'],
  摘下婚戒: ['摘下', '取下', '婚戒', '戒指.*手'],
  交付戒指: ['戒指', '交给你', '给你', '递.*戒指'],
  结局宣言: ['属于你', '只有我们', '新.*开始', '从今以后', '只属于'],
};

/**
 * 检测AI回复中完成了哪些锚点事件
 */
export function detectCompletedAnchors(aiResponse: string, phase: number): string[] {
  const phaseConfig = TRUE_ENDING_PHASES[phase];
  if (!phaseConfig) return [];

  const completed: string[] = [];

  for (const anchor of phaseConfig.anchorEvents) {
    const keywords = ANCHOR_KEYWORDS[anchor] || [];
    const isCompleted = keywords.some(kw => {
      // 支持简单的正则匹配
      if (kw.includes('.*')) {
        const regex = new RegExp(kw, 'i');
        return regex.test(aiResponse);
      }
      return aiResponse.includes(kw);
    });

    if (isCompleted) {
      completed.push(anchor);
    }
  }

  return completed;
}

// ============================================
// 阶段推进逻辑
// ============================================

/**
 * 检查是否应该推进到下一阶段
 * Bug #19 修复：添加 maxTurns 强制推进逻辑
 * Bug #40 修复：maxTurns 强制推进也必须遵守时间锁定
 */
export function shouldAdvancePhase(state: TrueEndingState, currentHour?: number): boolean {
  const phaseConfig = TRUE_ENDING_PHASES[state.currentPhase];
  if (!phaseConfig) return false;

  // Bug #40 修复：先检查时间锁定，如果下一阶段有时间锁定且当前时间不满足，不推进
  // 无论是 maxTurns 强制推进还是锚点完成推进，都必须遵守时间约束
  if (currentHour !== undefined) {
    const canEnter = canEnterNextPhase(state, currentHour);
    if (canEnter.blocked) {
      // 时间锁定，不允许推进
      return false;
    }
  }

  // Bug #19 修复：超过最大轮数时强制推进（但仍受时间锁定约束）
  if (phaseConfig.maxTurns && state.turnsInPhase >= phaseConfig.maxTurns) {
    console.info(
      `[真好结局] 阶段${state.currentPhase}(${phaseConfig.name}) 达到最大轮数${phaseConfig.maxTurns}，强制推进`,
    );
    return true;
  }

  // 检查最少轮数
  if (state.turnsInPhase < phaseConfig.minTurns) {
    return false;
  }

  // 检查锚点事件是否全部完成
  const allAnchorsComplete = phaseConfig.anchorEvents.every(anchor => state.completedAnchors.includes(anchor));

  return allAnchorsComplete;
}

/**
 * Bug #19 修复：检查下一阶段是否可以进入（时间锁定检查）
 * @returns null 表示可以进入，否则返回阻止原因
 */
export function canEnterNextPhase(
  state: TrueEndingState,
  currentHour: number,
): { blocked: boolean; reason?: string; waitHours?: number } {
  const nextPhase = state.currentPhase + 1;
  if (nextPhase >= TRUE_ENDING_PHASES.length) {
    return { blocked: false }; // 最后一个阶段，不阻止
  }

  const nextConfig = TRUE_ENDING_PHASES[nextPhase];
  if (!nextConfig) return { blocked: false };

  // 检查时间锁定
  if (nextConfig.strict && nextConfig.minHour !== undefined) {
    // 处理跨天情况（minHour=0 表示凌晨）
    if (nextConfig.minHour === 0) {
      // 凌晨阶段：只有 0-6 点可以进入
      if (currentHour > 6) {
        return {
          blocked: true,
          reason: `需要等到凌晨才能进入"${nextConfig.name}"阶段`,
          waitHours: 24 - currentHour,
        };
      }
    } else if (currentHour < nextConfig.minHour) {
      return {
        blocked: true,
        reason: `需要等到${nextConfig.minHour}:00才能进入"${nextConfig.name}"阶段`,
        waitHours: nextConfig.minHour - currentHour,
      };
    }
  }

  return { blocked: false };
}

/**
 * 推进到下一阶段
 */
export function advanceToNextPhase(state: TrueEndingState): TrueEndingState {
  const nextPhase = state.currentPhase + 1;

  // 检查是否已完成所有阶段
  if (nextPhase >= TRUE_ENDING_PHASES.length) {
    return {
      ...state,
      isComplete: true,
    };
  }

  return {
    ...state,
    currentPhase: nextPhase,
    turnsInPhase: 0,
    completedAnchors: [], // 清空锚点，准备新阶段
    noProgressTurns: 0, // Bug #15 修复：重置引导计数
    hintGiven: false, // Bug #15 修复：重置引导标记
  };
}

// ============================================
// Bug #15 修复：玩家引导机制
// ============================================

/**
 * 检查玩家输入是否包含期望的动作关键词
 */
export function hasExpectedAction(userInput: string, phase: number): boolean {
  const phaseConfig = TRUE_ENDING_PHASES[phase];
  if (!phaseConfig || !phaseConfig.expectedActions) {
    return true; // 没有配置期望动作的阶段，默认视为有进展
  }

  const input = userInput.toLowerCase();
  return phaseConfig.expectedActions.some(action => input.includes(action.toLowerCase()));
}

/**
 * 检查是否应该显示引导提示
 */
export function checkProgressHint(state: TrueEndingState, userInput: string): string | null {
  const phaseConfig = TRUE_ENDING_PHASES[state.currentPhase];
  if (!phaseConfig || !phaseConfig.progressHint) {
    return null;
  }

  // 如果已经给过提示，不再重复
  if (state.hintGiven) {
    return null;
  }

  // 如果玩家输入包含期望动作，不需要提示
  if (hasExpectedAction(userInput, state.currentPhase)) {
    return null;
  }

  // 检查是否达到提示阈值
  const threshold = phaseConfig.hintThreshold ?? 2;
  if (state.noProgressTurns >= threshold) {
    return phaseConfig.progressHint;
  }

  return null;
}

/**
 * 更新进度追踪状态
 */
export function updateProgressTracking(
  state: TrueEndingState,
  userInput: string,
): { updatedState: TrueEndingState; hint: string | null } {
  const hasProgress = hasExpectedAction(userInput, state.currentPhase);

  // 检查是否需要显示提示
  const hint = checkProgressHint(state, userInput);

  let updatedState = { ...state };

  if (hasProgress) {
    // 有进展，重置计数
    updatedState.noProgressTurns = 0;
  } else {
    // 无进展，增加计数
    updatedState.noProgressTurns = state.noProgressTurns + 1;
  }

  // 如果显示了提示，标记已给出
  if (hint) {
    updatedState.hintGiven = true;
  }

  return { updatedState, hint };
}

/**
 * 处理一轮对话后的状态更新
 * Bug #19 修复：添加 currentHour 参数用于时间锁定检查
 */
export function processTurnEnd(
  state: TrueEndingState,
  aiResponse: string,
  userInput?: string,
  currentHour?: number, // Bug #19：当前小时，用于时间锁定检查
): {
  newState: TrueEndingState;
  phaseAdvanced: boolean;
  newPhase: number | null;
  timeBlocked?: { reason: string; waitHours: number }; // Bug #19：时间锁定信息
} {
  // 增加轮数
  let newState: TrueEndingState = {
    ...state,
    turnsInPhase: state.turnsInPhase + 1,
    totalTurns: state.totalTurns + 1,
  };

  // 检测本轮完成的锚点
  const newAnchors = detectCompletedAnchors(aiResponse, state.currentPhase);
  const allAnchors = [...new Set([...newState.completedAnchors, ...newAnchors])];
  newState.completedAnchors = allAnchors;

  // Bug #15 修复：更新进度追踪
  if (userInput) {
    const { updatedState } = updateProgressTracking(newState, userInput);
    newState = updatedState;
  }

  // 检查是否推进
  let phaseAdvanced = false;
  let newPhase: number | null = null;

  if (shouldAdvancePhase(newState, currentHour)) {
    // Bug #19 修复：检查下一阶段是否可以进入（时间锁定）
    const hour = currentHour ?? 12; // 默认中午
    const canEnter = canEnterNextPhase(newState, hour);

    if (canEnter.blocked) {
      // 时间锁定，不推进但返回锁定信息
      console.info(`[真好结局] 阶段${newState.currentPhase} 可以推进，但下一阶段时间锁定：${canEnter.reason}`);
      return {
        newState,
        phaseAdvanced: false,
        newPhase: null,
        timeBlocked: { reason: canEnter.reason!, waitHours: canEnter.waitHours! },
      };
    }

    newState = advanceToNextPhase(newState);
    phaseAdvanced = true;
    newPhase = newState.currentPhase;
  }

  return { newState, phaseAdvanced, newPhase };
}

// ============================================
// AI Prompt 生成
// ============================================

/**
 * 生成当前阶段的AI引导Prompt
 * Bug #19 修复：添加 currentHour 参数和剩余轮数提示
 */
export function generateTrueEndingPrompt(
  state: TrueEndingState,
  userInput: string,
  currentHour?: number, // Bug #19：当前小时
): string {
  const phaseConfig = TRUE_ENDING_PHASES[state.currentPhase];
  if (!phaseConfig) return '';

  // 计算剩余锚点
  const remainingAnchors = phaseConfig.anchorEvents.filter(a => !state.completedAnchors.includes(a));

  // Bug #40 修复：检查下一阶段时间锁定
  const hour = currentHour ?? 12;
  const nextPhaseCheck = canEnterNextPhase(state, hour);
  const isTimeLocked = nextPhaseCheck.blocked;

  // Bug #40 修复：当时间锁定时，轮数提示改为"自由探索"
  let turnsWarning: string;
  if (isTimeLocked) {
    // 时间锁定时，不再显示"剩余X轮"，而是提示自由探索
    turnsWarning = `自由探索中（等待${TRUE_ENDING_PHASES[state.currentPhase + 1]?.minHour}:00）`;
  } else {
    const remainingTurns = phaseConfig.maxTurns - state.turnsInPhase;
    turnsWarning =
      remainingTurns <= 2 ? `⚠️ 剩余${remainingTurns}轮后将自动推进到下一阶段` : `剩余约${remainingTurns}轮`;
  }

  // Bug #40 修复：时间锁定的详细提示
  const timeBlockWarning = isTimeLocked
    ? `\n⏰ 时间锁定：下一阶段"${TRUE_ENDING_PHASES[state.currentPhase + 1]?.name}"需要等到${TRUE_ENDING_PHASES[state.currentPhase + 1]?.minHour}:00（当前${hour}:00）
📝 在此之前，请与玩家自由互动，享受这段时光。不要急于推进剧情。`
    : '';

  // 生成进度信息
  const progressInfo = `【进度】
- 当前阶段：${state.currentPhase + 1}/${TRUE_ENDING_PHASES.length}（${phaseConfig.name}）
- 本阶段轮数：${state.turnsInPhase}（${turnsWarning}）
- 待完成事件：${remainingAnchors.length > 0 ? remainingAnchors.join('、') : '全部完成'}
- 总对话轮数：${state.totalTurns}${timeBlockWarning}`;

  // Bug #15 修复：检查是否需要玩家引导提示
  const hint = checkProgressHint(state, userInput);
  const hintSection = hint
    ? `\n\n【玩家引导】
玩家似乎不确定该做什么。请通过赵霞的反应温和地引导：
${hint}`
    : '';

  // Bug #19 修复：添加紧迫感提示
  // Bug #40 修复：时间锁定时不显示紧迫感提示
  let urgencyHint = '';
  if (!isTimeLocked) {
    const remainingTurns = phaseConfig.maxTurns - state.turnsInPhase;
    if (remainingTurns <= 1) {
      urgencyHint = `\n\n【紧急】本阶段即将结束，请确保完成关键剧情后自然过渡到下一阶段。`;
    }
  }

  // 生成引导Prompt
  return `${phaseConfig.aiGuidance}

${progressInfo}${hintSection}${urgencyHint}

【重要提示】
- 回应玩家的输入，同时自然地推进剧情
- 确保触发待完成的锚点事件
- 如果玩家偏离主线，温和地引导回来
- 保持赵霞已被完全改造的状态（主动、热情、毫无愧疚）
- 不要跳跃阶段，按顺序推进
- 每阶段有轮数限制，请高效推进剧情`;
}

/**
 * 获取当前阶段的修正提示（当玩家偏离时使用）
 */
export function getCorrectionHint(phase: number): string | null {
  const phaseConfig = TRUE_ENDING_PHASES[phase];
  if (!phaseConfig || phaseConfig.correctionHints.length === 0) {
    return null;
  }

  // 随机选择一个修正提示
  const index = Math.floor(Math.random() * phaseConfig.correctionHints.length);
  return phaseConfig.correctionHints[index];
}

/**
 * 生成入口替换消息（首次激活时）
 * 2026-01-19 重构：6阶段设计，约25轮
 */
export function generateTrueEndingEntryReplacement(data?: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  // 检查是否为完美真爱结局
  const isPerfect = data ? isPerfectTrueEnding(data) : false;
  const endingTitle = isPerfect ? '完美真爱结局「命中注定」' : '真好结局「禁忌之爱」';

  const perfectMemoryNote = isPerfect
    ? `

【完美记忆路线】
玩家在进入场景5之前，按顺序完成了场景1-2-3。
赵霞拥有完整的记忆重构，她对玩家的感情不是被洗脑，而是"命中注定"。
- 她记得16岁那个夏天的初恋
- 她记得17岁在路口的等待
- 她记得20岁生日想要逃跑的渴望
- 她终于等到了那个人

【AI特别指引】
完美记忆路线的赵霞不是"被改造"的，而是"从一开始就在等待"的。
她的选择是发自内心的，不是被催眠的。
描写她时，要体现出"终于等到你"的感动，而不是"我被你改变了"的迷茫。`
    : '';

  const userMessage = `[系统指令 - ${endingTitle}开始]

时间已到达 Day 5, 11:00。
刚刚从场景5的梦境中醒来。赵霞的记忆已被完全改写。
所有条件已满足，${endingTitle}正式开始。

【前情提要】
玩家已完成所有5个梦境场景，且全部选择正确：
- 场景1：初恋的夏日（16岁）- 初吻
- 场景2：等待中的屈辱（17岁）- 胸部觉醒
- 场景3：生日之夜的逃离（23岁）- 初夜
- 场景4：争吵后的放纵（28岁）- 完全开发
- 场景5：花嫁的誓约（结婚日）- 婚礼改写

（详细的梦境剧情摘要请参考变量列表中的「梦境数据.场景X.剧情摘要」字段）

【Day 1-4 日常回顾】
请回顾聊天记录中 Day 1 至 Day 4 的日常互动内容。
赵霞在结局中的表现应当体现出这些天积累的关系变化。
${perfectMemoryNote}

赵霞的记忆已被完全改写，她从灵魂深处认定儿子{{user}}是她的真正归属。

【当前场景】
从安眠药引发的梦境中醒来后的第一个小时。
阳光透过窗户洒进来，赵霞找到{{user}}，眼神中有一种奇异的决意。
苏文在书房工作，对接下来要发生的事毫不知情。

【时间线（6阶段，约25轮）】
- 11:00-14:00 阶段0：觉醒与计划（4轮）- 商量今晚的计划
- 14:00-18:00 阶段1：准备工作（4轮）- 外出购物，准备道具
- 18:00-22:00 阶段2：晚餐与下药（4轮）- 晚餐，给苏文下药
- 22:00-02:00 阶段3：午夜告白（5轮）- 展示身体，揭露真相，深情表白
- 02:00-06:00 阶段4：禁忌仪式（5轮）- 在婚床上结合，请求内射
- 06:00-10:00 阶段5：黎明誓约（3轮）- 交付戒指，新生活开始

【AI任务】
1. 描写赵霞从梦境醒来后的状态
2. 赵霞主动找到{{user}}
3. 低声说出她的计划："今晚...我想把一切都给你。"
4. 商量需要准备什么
5. 与{{user}}有暧昧的肢体接触`;

  // 2026-01-19 重构：prefill 改为醒来后找到玩家的场景
  const prefill = isPerfect
    ? `阳光温柔地洒进卧室，赵霞缓缓睁开眼睛。

那个梦...不，那些记忆，依然清晰如昨。

十六岁那个夏天，她就知道了。
那个人，一直都在。

她轻手轻脚地起身，走出卧室。苏文还在书房里，对即将发生的一切毫不知情。

她找到了{{user}}。

"我全都想起来了。"赵霞轻声说，眼神中有一种奇异的光芒，"那些梦...不，那些记忆。"`
    : `阳光透过窗帘洒进卧室，赵霞缓缓睁开眼睛。

那个梦...那些被改写的记忆，如今已经成为她灵魂的一部分。

她坐起身，嘴角不自觉地上扬。
今晚，将会有一场特别的"庆祝"。

她轻手轻脚地起身，走出卧室。苏文还在书房里，对即将发生的一切毫不知情。

她找到了{{user}}。

"我想起来了...所有的事。"赵霞轻声说，眼神中有一种奇异的光芒，"今晚...你愿意帮我吗？"`;

  return { userMessage, prefill };
}

/**
 * 生成阶段完成时的过渡提示
 */
export function generatePhaseTransitionHint(fromPhase: number, toPhase: number): string {
  const toConfig = TRUE_ENDING_PHASES[toPhase];
  if (!toConfig) return '';

  return `\n\n---\n【剧情推进】进入${toConfig.name}阶段：${toConfig.title}\n---\n`;
}

/**
 * 生成结局完成时的消息
 * 2026-01-16 更新：支持完美真爱结局变体
 */
export function generateTrueEndingComplete(data?: SchemaType): string {
  // 检查是否为完美真爱结局
  const isPerfect = data ? isPerfectTrueEnding(data) : false;

  if (isPerfect) {
    return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【PERFECT TRUE END】命中注定

五段记忆，五次重逢。
但这不是改写——这是回忆。

16岁那个夏天，她遇见了你。
17岁那个路口，她等待着你。
20岁那个夜晚，她渴望逃向你。
25岁结婚那天，她的心里只有你。

她从来不需要被改变。
因为她的心，从一开始就属于你。

赵霞摘下结婚戒指，
眼中含着多年压抑的泪水。

"我等了你很久。"
"十六岁那个夏天，我就知道..."
"你才是我这辈子要等的人。"

时间循环，不是诅咒。
它是命运给你们的第二次机会。

她终于等到了你。
你也终于找到了回家的路。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔓 后日谈模式已解锁
✨ 完美真爱结局达成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【TRUE END】禁忌之爱

五段记忆，被完美改写。
五个第一次，全部属于你。

16岁的初吻，是你。
17岁的觉醒，是你。
23岁的初夜，是你。
28岁的归宿，是你。
结婚那天，站在她心里的人...也是你。

她摘下了结婚戒指，
将它交到你的手中。

"从今以后，我只属于你。"

时间循环，终于被打破。
这个家，从此只有你们两个人。

而苏文...
当他醒来，看到那些录像时，
一切都已经太迟了。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔓 后日谈模式已解锁

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ============================================
// 2026-01-17 新增：自由时间和特殊时段引导
// ============================================

/**
 * 生成自由时间提示（21:00 和 23:00）
 * 在自由时间内，暂停主线引导，让玩家自由活动
 */
export function generateFreeTimePrompt(hour: number): string {
  const nextHour = hour + 1;
  const nextEvent = hour === 21 ? '剧情将在22:00继续推进' : '午夜时分（00:00）将迎来最终时刻';

  return `【自由时间 - ${hour}:00】

现在是自由活动时间。${nextEvent}。

【场景状态】
- 晚餐已经结束
- 苏文因为安眠药已经昏倒
- 赵霞和{{user}}可以自由活动

【AI任务】
1. 不要强制推进主线剧情
2. 回应玩家的自由互动
3. 赵霞可以与{{user}}闲聊、调情、准备接下来的事
4. 保持轻松但暗含期待的氛围
5. 如果玩家主动推进剧情，可以顺势进入下一阶段

【提示】
玩家可以利用这段时间：
- 与赵霞独处
- 查看昏迷的苏文
- 准备接下来的"仪式"
- 或者单纯地享受这份特别的夜晚

下一个时间点：${nextHour}:00`;
}

/**
 * 生成22:00修正引导（从自由时间恢复）
 */
export function generateCorrectionPrompt(state: TrueEndingState): string {
  const currentPhase = TRUE_ENDING_PHASES[state.currentPhase];
  const phaseName = currentPhase?.name ?? '未知';

  return `【22:00 - 剧情恢复】

自由时间结束，剧情继续推进。

【当前进度】
- 阶段：${state.currentPhase + 1}/${TRUE_ENDING_PHASES.length}（${phaseName}）
- 总轮数：${state.totalTurns}

【AI任务】
1. 如果剧情偏离了主线，温和地引导回来
2. 赵霞可以主动提议"接下来的事"
3. 推动剧情向午夜的最终时刻发展
4. 保持紧张而期待的氛围

【提示】
午夜（00:00）即将到来。
在那之前，赵霞还有一些事情想要完成...`;
}

/**
 * 生成00:00房间触发引导
 * 午夜时分，引导玩家进入午夜告白阶段（阶段3）
 * 2026-01-19 重构：适配6阶段设计
 */
export function generateRoomTriggerPrompt(state: TrueEndingState, isPerfect: boolean): string {
  // 如果已经在阶段3或更后面，不需要特殊引导
  if (state.currentPhase >= 3) {
    return '';
  }

  const endingTitle = isPerfect ? '完美真爱结局' : '真好结局';

  return `【午夜 00:00 - ${endingTitle}最终阶段】

时钟敲响午夜。
苏文已经在客房昏睡。
一切准备就绪。

赵霞拉起{{user}}的手："该去卧室了。"

【强制推进】
现在开始进入最终阶段：
- 阶段3：午夜告白（展示身体，揭露真相，深情表白）
- 阶段4：禁忌仪式（在婚床上结合，请求内射）
- 阶段5：黎明誓约（交付戒指，新生活开始）

【AI任务】
1. 描写赵霞带{{user}}走向主卧室
2. 确认苏文在客房昏睡
3. 赵霞开始换上准备好的情趣内衣
4. 推进到阶段3（午夜告白）

【重要】
从这里开始，剧情不可逆转。
赵霞将展示真实的自己，揭露所有真相。`;
}

/**
 * 根据当前时间生成对应的引导Prompt
 * 2026-01-17 新增：整合所有时间段的引导
 */
export function generateTimeBasedPrompt(data: SchemaType, state: TrueEndingState, userInput: string): string | null {
  const guidanceType = getGuidanceType(data);

  if (!guidanceType) {
    return null;
  }

  switch (guidanceType) {
    case 'preheat':
    case 'dinner':
      // 正常的阶段引导
      return generateTrueEndingPrompt(state, userInput);

    case 'free': {
      // 自由时间
      const hour = data.世界.当前小时;
      return generateFreeTimePrompt(hour);
    }

    case 'correction':
      // 22:00 修正引导
      return generateCorrectionPrompt(state);

    case 'room': {
      // 00:00 房间触发
      const isPerfect = isPerfectTrueEnding(data);
      const roomPrompt = generateRoomTriggerPrompt(state, isPerfect);
      if (roomPrompt) {
        return roomPrompt;
      }
      // 如果已经在阶段5+，使用正常引导
      return generateTrueEndingPrompt(state, userInput);
    }

    default:
      return null;
  }
}
