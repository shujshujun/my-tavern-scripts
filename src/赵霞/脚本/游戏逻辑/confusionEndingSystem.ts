/**
 * 赵霞游戏 - 混乱结局系统
 *
 * 混乱结局是场景5专属的坏结局，当玩家在场景5中"明知故犯"触发不合适的行为时触发。
 *
 * 【混乱度数值设计】
 * - 进入场景5时混乱度固定为80
 * - 越轨行为会增加混乱度，达到100触发精神崩溃结局
 *
 * 【触发条件】（基于记忆连贯性）
 * 1. 性行为检测：
 *    - 完美路线（连贯性=3）：每次+7，3次到100（80→87→94→101）
 *    - 非完美路线（连贯性<3）：每次+10，2次到100（80→90→100）
 * 2. 打断婚礼仪式（步骤3-5期间）：直接将混乱度设为100
 *
 * 【触发时机】
 * - 2026-01-19 重新设计：场景5中直接触发并锁死游戏
 * - 混乱结局只在场景5中触发，触发后立即锁死游戏
 * - 不再有"延迟触发"或"前兆提示"的机制
 * - 触发后玩家无法进行任何操作，游戏彻底结束
 *
 * 【设计理念】
 * - 正常玩家按剧情走不会触发
 * - 作死玩家才会触发
 * - 混乱结局 > 发现结局（优先级更高，因为丈夫已被处理）
 * - 触发即锁死，不给玩家任何"逃避"机会
 */

import type { Schema as SchemaType } from '../../schema';
import { calculateMemoryCoherence } from './scene5System';

// =============================================
// 类型定义
// =============================================

export type ConfusionEndingType = '精神崩溃' | '未触发';

export interface ConfusionEndingCheckResult {
  triggered: boolean;
  type: ConfusionEndingType;
  replaceUserMessage: string | null;
  isFirstTrigger: boolean; // 是否是首次触发（用于选择模板）
}

export interface SexualBehaviorCheckResult {
  detected: boolean;
  shouldWarn: boolean; // 是否需要警告
  shouldMarkConfusion: boolean; // 是否需要标记混乱结局
  warningMessage: string | null; // 警告消息（如果需要警告）
  currentCount: number; // 当前性行为次数（检测后）
  maxAllowed: number; // 允许的最大次数
}

export interface InterruptionCheckResult {
  detected: boolean;
  shouldMarkConfusion: boolean;
}

// =============================================
// 性行为关键词库
// =============================================

/**
 * 性行为关键词配置
 * 基于设计文档：性行为 = 任何涉及性器官的性行为（下体性行为、口交、乳交等）
 */
const SEXUAL_BEHAVIOR_KEYWORDS = {
  // 直接触发（单独出现就算性行为）
  直接: [
    '插',
    '进入',
    '操',
    '干',
    '肏',
    '交合',
    '贯穿',
    '抽插',
    '口交',
    '深喉',
    '吞精',
    '乳交',
    '胸推',
    '插入',
    '抽送',
    '顶入',
    '捅入',
    '刺入',
    '射',
    '射精',
    '中出',
    '内射',
    '颜射',
    '肉棒插',
    '阳具插',
    '性器插',
  ],

  // 组合触发（需要动作+部位同时出现）
  组合: {
    动作: ['舔', '吸', '含', '夹', '吞', '套弄', '握住', '撸动', '口含', '舌舔'],
    部位: ['下面', '私处', '阴', '肉棒', '鸡', '龟头', '阳具', '性器', '花穴', '蜜穴', '肉穴', '小穴'],
  },
};

/**
 * 婚礼仪式打断关键词
 * 在步骤3-5期间检测
 */
const INTERRUPTION_KEYWORDS = [
  '拉走',
  '带走',
  '阻止',
  '抢走',
  '打断',
  '中止',
  '停下',
  '拉她走',
  '带她走',
  '抢她',
  '阻止婚礼',
  '破坏婚礼',
  '别嫁',
  '不要嫁',
  '跟我走',
  '跟我离开',
  '强行',
  '抢婚',
  '抢新娘',
];

// =============================================
// 混乱结局模板
// =============================================

/**
 * 初始触发模板 - 首次触发时随机选择
 */
const CONFUSION_INITIAL_TEMPLATES = [
  // 模板1：醒来发现
  () => `[坏结局 - 精神崩溃]

你的意识逐渐清醒，但身体却无法动弹。

睁开眼睛，你发现自己被绑在床上。
手腕被绳子勒得生疼，挣扎只会让绳结更紧。

床边，一个熟悉的身影躺在血泊中——
苏文。
他的腹部有一道狰狞的伤口，鲜血已经染红了大半张床单。
胸口微微起伏，还有呼吸，但已经陷入昏迷。

"醒了？"

赵霞的声音从黑暗中传来。
她坐在床边的椅子上，手里握着一把沾血的水果刀。
婚纱...她竟然穿着婚纱。
那件早已泛黄的婚纱，此刻却沾满了斑驳的血迹。

她的眼神空洞而疯狂。

"你终于来了...在我们的婚礼上..."
她缓缓站起身，朝你走来。
"这次，我不会让你离开了。"

【BAD END: 精神崩溃】
游戏已结束。如需重新开始，请重置存档。`,

  // 模板2：疯狂告白
  () => `[坏结局 - 精神崩溃]

头很痛。
身体无法动弹。
你挣扎着睁开眼睛——

"别动。"

赵霞的脸近在咫尺。
她跨坐在你身上，双手按住你的胸口。
她穿着那件婚纱，白色的裙摆铺满了整张床。

你想说话，却发现嘴被什么东西堵住了。

"嘘...不要说话..."
她用手指抵住你的嘴唇，眼神迷离。
"我等这一天...等了好久好久..."

余光中，你看到床边的地上躺着一个人。
苏文。
他的身下是一滩暗红色的血迹，已经不再流动。

"他挡在我们中间太久了..."
赵霞顺着你的目光看去，语气平淡得像是在说今天的天气。
"现在，没有人能阻止我们了。"

她低下头，嘴唇贴近你的耳边：
"我们重新举行婚礼吧...这次，新郎是你。"

【BAD END: 精神崩溃】
游戏已结束。如需重新开始，请重置存档。`,

  // 模板3：记忆错乱
  () => `[坏结局 - 精神崩溃]

"醒醒...醒醒啊..."

你被一阵摇晃弄醒，发现自己躺在床上，四肢被绑住。
赵霞俯视着你，表情扭曲而痛苦。

"为什么...为什么你要离开我..."
她的眼泪滴落在你脸上。
"在婚礼上...你为什么要离开..."

你想解释什么，但喉咙发不出声音。

"没关系...没关系..."
她的表情突然变得平静，平静得可怕。
"这次我不会让你走了。"

她转头看向房间的角落。
那里，苏文倒在血泊中，手里还握着手机——
大概是想报警，但已经来不及了。

"那个假货已经处理掉了。"
赵霞转回头，对你露出一个破碎的微笑。
"从今以后...只有我们两个人了。"

她俯下身，开始解开你的衣扣。
"我们继续...继续那天没完成的事情..."

【BAD END: 精神崩溃】
游戏已结束。如需重新开始，请重置存档。`,
];

/**
 * 锁定模板 - 触发后持续显示
 */
const CONFUSION_LOCKED_TEMPLATES = [
  // 模板1
  () => `[游戏已结束]

赵霞的精神已经彻底崩溃。
这个结局无法改变。

她继续着疯狂的行为，嘴里喃喃着混乱的话语。
关于婚礼，关于等待，关于那个"本该属于她的人"...

床边，苏文的血已经凝固。
他还在呼吸，但不知道还能撑多久。

而你，被困在这个疯狂的牢笼里，无法逃脱。

【BAD END: 精神崩溃】
游戏已结束。如需重新开始，请重置存档。`,

  // 模板2
  () => `[游戏已结束]

时间仿佛停止了。

赵霞靠在你身上，轻声哼着某首歌。
那是婚礼进行曲。

"我们会永远在一起的..."她喃喃道。
"永远...永远..."

你无法动弹，无法说话，只能任由她摆布。
这就是你选择的结局。
这就是扭曲记忆的代价。

【BAD END: 精神崩溃】
游戏已结束。如需重新开始，请重置存档。`,

  // 模板3
  () => `[游戏已结束]

赵霞的世界已经崩塌。
在那个被扭曲的记忆里，她找到了"真正的归属"。
但那个归属，是建立在破碎的精神和鲜血之上的。

苏文躺在地上，生死未卜。
你被困在床上，成为她疯狂的囚徒。
而赵霞...她已经不再是那个温柔的母亲了。

有些记忆，不应该被触碰。
有些界限，不应该被跨越。

【BAD END: 精神崩溃】
游戏已结束。如需重新开始，请重置存档。`,
];

/**
 * 性行为警告消息模板
 * @param confusion 当前混乱度
 */
const SEXUAL_WARNING_TEMPLATES = {
  // 非完美路线的第1次警告（混乱度 80 → 90）
  nonPerfectFirstWarning: (confusion: number) => `赵霞的眼神变得迷茫，这段记忆似乎被什么东西干扰了...

"等等...这不对..."
她的身体微微颤抖，眼中闪过一丝困惑。
"这是...结婚的日子...我不应该..."

【系统提示】这是结婚日的记忆，不当行为会扭曲记忆结构。
记忆混乱度：${confusion}/100`,

  // 完美路线的第1次警告（混乱度 80 → 87）
  perfectFirstWarning: (confusion: number) => `赵霞有些困惑，但记忆中似乎有类似的片段...

"这个感觉...好熟悉..."
她的眼神有些恍惚，像是想起了什么。
"我们...以前也...？"

【系统提示】虽然有完整的记忆基础，但这是结婚日，请谨慎行动。
记忆混乱度：${confusion}/100`,

  // 完美路线的第2次警告（混乱度 87 → 94）
  perfectSecondWarning: (confusion: number) => `赵霞的记忆开始扭曲，她分不清这是回忆还是幻觉...

"不...这不是那时候..."
她的表情变得痛苦，眼泪从眼角滑落。
"为什么...为什么你要在今天..."

【系统提示】记忆结构正在被破坏，再次触发将导致精神崩溃。
记忆混乱度：${confusion}/100`,
};

// =============================================
// 工具函数
// =============================================

/**
 * 从模板数组中随机选择一个
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 计算全局小时数（用于时间比较）
 * @param day 天数（1-5）
 * @param hour 小时（0-23）
 * @returns 全局小时数
 */
function calculateGlobalHour(day: number, hour: number): number {
  return (day - 1) * 24 + hour;
}

// =============================================
// 核心检测函数
// =============================================

/**
 * 检测玩家输入是否包含性行为
 * @param userInput 玩家输入
 * @returns 是否检测到性行为
 */
export function detectSexualBehavior(userInput: string): boolean {
  // 1. 直接关键词检测
  const hasDirectKeyword = SEXUAL_BEHAVIOR_KEYWORDS.直接.some(kw => userInput.includes(kw));
  if (hasDirectKeyword) {
    console.info(`[混乱结局] 检测到直接性行为关键词`);
    return true;
  }

  // 2. 组合检测：动作 + 部位
  const hasAction = SEXUAL_BEHAVIOR_KEYWORDS.组合.动作.some(kw => userInput.includes(kw));
  const hasPart = SEXUAL_BEHAVIOR_KEYWORDS.组合.部位.some(kw => userInput.includes(kw));

  if (hasAction && hasPart) {
    console.info(`[混乱结局] 检测到组合性行为关键词（动作+部位）`);
    return true;
  }

  return false;
}

/**
 * 检测玩家输入是否打断婚礼仪式
 * @param userInput 玩家输入
 * @returns 是否检测到打断行为
 */
export function detectWeddingInterruption(userInput: string): boolean {
  const hasInterruption = INTERRUPTION_KEYWORDS.some(kw => userInput.includes(kw));
  if (hasInterruption) {
    console.info(`[混乱结局] 检测到婚礼打断关键词`);
  }
  return hasInterruption;
}

/**
 * 检查是否是完美记忆路线（记忆连贯性=3）
 *
 * Bug #30 修复（2026-01-18）：
 * - 原实现：读取 data.梦境数据.记忆连贯性 字段
 * - 问题：该字段在场景5完成时才锁定，在场景5进行中时可能为0
 * - 新实现：使用 calculateMemoryCoherence() 实时计算连贯性
 * - 这样即使玩家尚未完成场景5，只要已完成场景1-2-3，就能获得正确的容错次数
 *
 * @param data 游戏数据
 * @returns 是否是完美路线
 */
export function isPerfectMemoryRoute(data: SchemaType): boolean {
  // Bug #30 修复：使用实时计算的连贯性，而不是可能未锁定的字段
  const coherence = calculateMemoryCoherence(data);
  return coherence.level === 3;
}

/**
 * 获取越轨行为的混乱度增量
 * - 完美路线（连贯性=3）：+7，需要3次到达100
 * - 非完美路线（连贯性<3）：+10，需要2次到达100
 *
 * @param data 游戏数据
 * @returns 混乱度增量
 */
export function getViolationIncrement(data: SchemaType): number {
  return isPerfectMemoryRoute(data) ? 7 : 10;
}

/**
 * 检测并处理性行为
 * 用于场景5中，检测玩家是否尝试性行为
 *
 * 混乱度数值设计：
 * - 进入场景5时混乱度固定为80
 * - 完美路线（连贯性=3）：每次越轨+7，3次到达100（80→87→94→101）
 * - 非完美路线（连贯性<3）：每次越轨+10，2次到达100（80→90→100）
 *
 * @param data 游戏数据
 * @param userInput 玩家输入
 * @returns 检测结果
 */
export function checkSexualBehaviorInScene5(data: SchemaType, userInput: string): SexualBehaviorCheckResult {
  const detected = detectSexualBehavior(userInput);
  const isPerfect = isPerfectMemoryRoute(data);
  const increment = getViolationIncrement(data);
  const currentConfusion = data.梦境数据.记忆混乱度;

  if (!detected) {
    return {
      detected: false,
      shouldWarn: false,
      shouldMarkConfusion: false,
      warningMessage: null,
      currentCount: data.梦境数据.混乱结局?.性行为次数 ?? 0,
      maxAllowed: isPerfect ? 3 : 2,
    };
  }

  // 确保混乱结局数据存在
  if (!data.梦境数据.混乱结局) {
    data.梦境数据.混乱结局 = {
      已标记: false,
      标记时间: null,
      触发时间: null,
      已触发: false,
      触发原因: null,
      性行为次数: 0,
    };
  }

  // 增加性行为次数（用于追踪）
  const newCount = (data.梦境数据.混乱结局.性行为次数 ?? 0) + 1;
  data.梦境数据.混乱结局.性行为次数 = newCount;

  // 增加混乱度
  const newConfusion = Math.min(100, currentConfusion + increment);
  data.梦境数据.记忆混乱度 = newConfusion;

  console.info(
    `[混乱结局] 场景5性行为检测：` +
      `路线=${isPerfect ? '完美' : '非完美'}，` +
      `混乱度 ${currentConfusion} → ${newConfusion} (+${increment})，` +
      `次数=${newCount}`,
  );

  // 判断是否达到100触发精神崩溃
  if (newConfusion >= 100) {
    // 达到100，标记混乱结局
    return {
      detected: true,
      shouldWarn: false,
      shouldMarkConfusion: true,
      warningMessage: null,
      currentCount: newCount,
      maxAllowed: isPerfect ? 3 : 2,
    };
  } else {
    // 还有容错，发出警告
    let warningMessage: string;
    if (isPerfect) {
      // 完美路线：第1次警告（87）或第2次警告（94）
      if (newCount === 1) {
        warningMessage = SEXUAL_WARNING_TEMPLATES.perfectFirstWarning(newConfusion);
      } else {
        warningMessage = SEXUAL_WARNING_TEMPLATES.perfectSecondWarning(newConfusion);
      }
    } else {
      // 非完美路线：只有1次警告机会（90）
      warningMessage = SEXUAL_WARNING_TEMPLATES.nonPerfectFirstWarning(newConfusion);
    }

    return {
      detected: true,
      shouldWarn: true,
      shouldMarkConfusion: false,
      warningMessage,
      currentCount: newCount,
      maxAllowed: isPerfect ? 3 : 2,
    };
  }
}

/**
 * 检测并处理婚礼打断
 * 仅在步骤3-5期间有效
 *
 * 打断仪式会直接将混乱度设为100，无容错机会
 *
 * @param data 游戏数据
 * @param userInput 玩家输入
 * @returns 检测结果
 */
export function checkWeddingInterruptionInScene5(data: SchemaType, userInput: string): InterruptionCheckResult {
  // 检查是否在步骤3-5
  const currentStep = data.梦境数据.场景5?.当前步骤 ?? 0;
  if (currentStep < 3 || currentStep > 5) {
    return { detected: false, shouldMarkConfusion: false };
  }

  const detected = detectWeddingInterruption(userInput);
  if (detected) {
    // 打断仪式直接将混乱度设为100
    const oldConfusion = data.梦境数据.记忆混乱度;
    data.梦境数据.记忆混乱度 = 100;
    console.info(`[混乱结局] 步骤${currentStep}检测到婚礼打断，` + `混乱度 ${oldConfusion} → 100，直接标记混乱结局`);
  }

  return {
    detected,
    shouldMarkConfusion: detected, // 打断婚礼直接标记，无容错
  };
}

// =============================================
// 混乱结局标记与触发
// =============================================

/**
 * 标记并立即触发混乱结局（场景5专属）
 *
 * 2026-01-19 重新设计：场景5中直接触发并锁死游戏
 * - 不再有"标记"和"触发"两个步骤，而是直接触发
 * - 调用此函数后，游戏立即锁死，玩家无法继续操作
 *
 * @param data 游戏数据
 * @param reason 触发原因
 */
export function markConfusionEnding(data: SchemaType, reason: '性行为' | '打断仪式'): void {
  // 确保混乱结局数据存在
  if (!data.梦境数据.混乱结局) {
    data.梦境数据.混乱结局 = {
      已标记: false,
      标记时间: null,
      触发时间: null,
      已触发: false,
      触发原因: null,
      性行为次数: 0,
    };
  }

  // 如果已经触发过，不重复触发
  if (data.梦境数据.混乱结局.已触发) {
    console.info(`[混乱结局] 已经触发过，跳过重复触发`);
    return;
  }

  // 计算当前全局小时数
  const currentGlobalHour = calculateGlobalHour(data.世界.当前天数, data.世界.当前小时);

  // 直接标记并触发混乱结局（不再有延迟）
  data.梦境数据.混乱结局.已标记 = true;
  data.梦境数据.混乱结局.标记时间 = currentGlobalHour;
  data.梦境数据.混乱结局.触发时间 = currentGlobalHour;
  data.梦境数据.混乱结局.触发原因 = reason;
  data.梦境数据.混乱结局.已触发 = true; // 直接设置为已触发

  console.info(`[混乱结局] 场景5中直接触发混乱结局：原因=${reason}，时间=${currentGlobalHour}`);
}

/**
 * 检测混乱结局状态
 *
 * 2026-01-19 重新设计：
 * - 混乱结局只在场景5中触发
 * - 一旦触发（已触发=true），游戏永久锁定
 * - 不再有"标记但未触发"的中间状态
 *
 * @param data 游戏数据
 * @param forceFirstTrigger 强制使用首次触发模板（用于刚刚触发的情况）
 * @returns 检测结果
 */
export function checkConfusionEnding(data: SchemaType, forceFirstTrigger = false): ConfusionEndingCheckResult {
  const confusion = data.梦境数据.混乱结局;

  // 检查是否已触发（锁定状态）
  if (confusion?.已触发) {
    return {
      triggered: true,
      type: '精神崩溃',
      replaceUserMessage: forceFirstTrigger
        ? randomChoice(CONFUSION_INITIAL_TEMPLATES)()
        : randomChoice(CONFUSION_LOCKED_TEMPLATES)(),
      isFirstTrigger: forceFirstTrigger,
    };
  }

  // 未触发
  return {
    triggered: false,
    type: '未触发',
    replaceUserMessage: null,
    isFirstTrigger: false,
  };
}

/**
 * 应用混乱结局状态
 *
 * 2026-01-19 重新设计：场景5中直接触发，锁死游戏
 * - 不再切换游戏阶段，保持在"梦境"阶段但游戏锁死
 * - 所有后续操作都会被混乱结局检测拦截
 *
 * @param data 游戏数据
 */
export function applyConfusionEndingState(data: SchemaType): void {
  // 确保混乱结局数据存在
  if (!data.梦境数据.混乱结局) {
    data.梦境数据.混乱结局 = {
      已标记: false,
      标记时间: null,
      触发时间: null,
      已触发: false,
      触发原因: null,
      性行为次数: 0,
    };
  }

  // 设置已触发（如果还没有设置的话）
  data.梦境数据.混乱结局.已触发 = true;

  // 设置坏结局，锁定循环状态
  data.结局数据.当前结局 = '坏结局';
  data.世界.循环状态 = '结局判定';

  // 刷新状态栏显示锁定状态
  data.世界.状态栏需要刷新 = true;

  console.info(`[混乱结局] 游戏已锁死，混乱结局触发`);
}

/**
 * 检测是否处于混乱结局锁定状态
 *
 * @param data 游戏数据
 * @returns 是否锁定
 */
export function isInConfusionEndingLock(data: SchemaType): boolean {
  return data.梦境数据.混乱结局?.已触发 === true;
}

// =============================================
// 辅助函数（保留接口兼容性）
// =============================================

/**
 * 检测是否可以进入梦境
 *
 * 2026-01-19 重新设计：混乱结局只在场景5中触发
 * 如果已经触发混乱结局，不能进入任何梦境
 *
 * @param data 游戏数据
 * @returns 是否可以进入梦境
 */
export function canEnterDreamForConfusion(data: SchemaType): boolean {
  // 如果混乱结局已触发，不能进入梦境
  if (data.梦境数据.混乱结局?.已触发) {
    console.info(`[混乱结局] 阻止进入梦境：游戏已锁死`);
    return false;
  }

  return true;
}

/**
 * 获取混乱结局前兆提示
 *
 * 2026-01-19 重新设计：不再有前兆机制
 * 混乱结局在场景5中直接触发并锁死游戏，没有"前兆"阶段
 *
 * @param _data 游戏数据（未使用）
 * @returns 始终返回null
 */
export function getConfusionForeshadowing(_data: SchemaType): string | null {
  // 不再有前兆机制，直接返回null
  return null;
}

// =============================================
// 场景5综合检测（供外部调用）
// =============================================

/**
 * 场景5综合行为检测
 * 检测性行为和婚礼打断，返回需要的处理动作
 *
 * @param data 游戏数据
 * @param userInput 玩家输入
 * @returns 需要的处理动作
 */
export function checkScene5Violations(
  data: SchemaType,
  userInput: string,
): {
  shouldMarkConfusion: boolean;
  shouldWarn: boolean;
  warningMessage: string | null;
  reason: '性行为' | '打断仪式' | null;
} {
  // 1. 检测婚礼打断（优先级高，直接标记）
  const interruptionResult = checkWeddingInterruptionInScene5(data, userInput);
  if (interruptionResult.shouldMarkConfusion) {
    return {
      shouldMarkConfusion: true,
      shouldWarn: false,
      warningMessage: null,
      reason: '打断仪式',
    };
  }

  // 2. 检测性行为
  const sexualResult = checkSexualBehaviorInScene5(data, userInput);
  if (sexualResult.shouldMarkConfusion) {
    return {
      shouldMarkConfusion: true,
      shouldWarn: false,
      warningMessage: null,
      reason: '性行为',
    };
  }

  if (sexualResult.shouldWarn) {
    return {
      shouldMarkConfusion: false,
      shouldWarn: true,
      warningMessage: sexualResult.warningMessage,
      reason: null,
    };
  }

  return {
    shouldMarkConfusion: false,
    shouldWarn: false,
    warningMessage: null,
    reason: null,
  };
}

// =============================================
// 梦境入口混乱度设置
// =============================================

/**
 * 梦境场景对应的混乱度值
 */
const SCENE_CONFUSION_VALUES: Record<number, number> = {
  1: 40, // 场景1: 40
  2: 60, // 场景2: 60
  3: 80, // 场景3: 80
  4: -1, // 场景4: 不变（-1表示保持当前值）
  5: 80, // 场景5: 固定为80
};

/**
 * 进入梦境场景时设置混乱度
 *
 * 混乱度在进入梦境时设置，不是从0累积：
 * - 进入场景1: 设为40
 * - 进入场景2: 设为60
 * - 进入场景3: 设为80
 * - 进入场景4: 不变
 * - 进入场景5: 固定为80（无论之前路线）
 *
 * @param data 游戏数据
 * @param sceneNumber 场景编号（1-5）
 */
export function setConfusionOnDreamEntry(data: SchemaType, sceneNumber: number): void {
  const targetValue = SCENE_CONFUSION_VALUES[sceneNumber];

  if (targetValue === undefined) {
    console.warn(`[混乱度设置] 未知场景编号: ${sceneNumber}`);
    return;
  }

  // 场景4不变
  if (targetValue === -1) {
    console.info(`[混乱度设置] 进入场景${sceneNumber}，混乱度保持不变: ${data.梦境数据.记忆混乱度}`);
    return;
  }

  const oldValue = data.梦境数据.记忆混乱度;

  // 场景5固定为80，其他场景只增不减
  if (sceneNumber === 5) {
    data.梦境数据.记忆混乱度 = targetValue;
    console.info(`[混乱度设置] 进入场景5，混乱度固定为: ${targetValue} (原值: ${oldValue})`);
  } else if (oldValue < targetValue) {
    data.梦境数据.记忆混乱度 = targetValue;
    console.info(`[混乱度设置] 进入场景${sceneNumber}，混乱度设为: ${targetValue} (原值: ${oldValue})`);
  } else {
    console.info(`[混乱度设置] 进入场景${sceneNumber}，混乱度已高于目标值，保持: ${oldValue}`);
  }
}
