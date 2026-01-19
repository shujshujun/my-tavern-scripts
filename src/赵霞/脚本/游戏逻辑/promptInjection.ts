/**
 * 赵霞游戏 - Prompt注入系统
 *
 * 通过 CHAT_COMPLETION_PROMPT_READY 事件在AI生成前注入/替换提示词。
 * 这是游戏触发剧情的核心机制。
 *
 * 核心功能：
 * 1. 梦境入口检测 - 检测关键词后替换玩家输入，创建梦境开场
 * 2. 梦境退出检测 - 10:00时替换输入，创建醒来场景
 * 3. 部位开发进度注入 - 类似秦璐习惯注入，影响AI描写赵霞的接受程度
 * 4. 危险内容修正 - 替换危险输入
 */

import { Schema, type Schema as SchemaType } from '../../schema';
import { TimeSystem } from './timeSystem';
import {
  generateMemoryContinuityPrompt,
  generateEnhancedMemoryContinuityPrompt,
  generateMemorySummary,
  getDreamSessionMessages,
  processSceneCompletion, // Bug #38 修复：导入场景完成判定函数
} from './dreamKeywordDetection';
import {
  generateAppearanceConstraintPrompt,
  getRealmTitle,
  generateDetailedInteractionPrompt,
  calculateSuspicionIncrease,
} from './appearanceSystem';
import {
  checkBoundaryInterruption,
  applyInterruptionResult,
  type InterruptionCheckResult,
} from './boundaryInterruption';
import { detectDangerousContent, shouldSkipDangerousContentDetection } from './dangerousContentDetection';
import {
  calculateScene5Completion as calculateScene5CompletionNew,
  generateScene5EntryReplacement as generateScene5EntryReplacementNew,
  generateScene5ForceExitReplacement as generateScene5ForceExitReplacementNew,
  generateScene5StepReplacement,
  generateScene5FreePlayReplacement,
  analyzePlayerIntent,
  SCENE5_STEPS,
  calculateMatchLevel,
  lockScene5EntryCoherence,
} from './scene5System';
import { checkBadEnding, applyBadEndingState, isInBadEndingLock, type BadEndingType } from './badEndingSystem';
import { checkNormalEnding, isInNormalEndingLock, type NormalEndingType } from './normalEndingSystem';
import {
  shouldActivateTrueEnding,
  isTrueEndingActive,
  getTrueEndingState,
  updateTrueEndingState,
  generateTrueEndingPrompt,
  generateTrueEndingEntryReplacement,
  generateTrueEndingComplete,
  getDefaultTrueEndingState,
  // 2026-01-17 新增：时间基引导函数
  isFreeTimeHour,
  isRoomTriggerTime,
  getGuidanceType,
  generateTimeBasedPrompt,
  isPerfectTrueEnding,
} from './trueEndingSystem';
import {
  shouldActivateFalseEnding,
  isFalseEndingActive,
  getFalseEndingState,
  updateFalseEndingState,
  generateFalseEndingPrompt,
  generateFalseEndingEntryReplacement,
  generateFalseEndingComplete,
  getDefaultFalseEndingState,
} from './falseEndingSystem';
import {
  shouldActivatePerfectEnding,
  isPerfectEndingActive,
  getPerfectEndingState,
  updatePerfectEndingState,
  generatePerfectEndingPrompt,
  generatePerfectEndingEntryReplacement,
  generatePerfectEndingComplete,
  getDefaultPerfectEndingState,
  isPerfectEndingFreeTime,
  generatePerfectFreeTimePrompt,
  getPerfectGuidanceType,
} from './perfectTrueEndingSystem';
import {
  checkConfusionEnding,
  applyConfusionEndingState,
  isInConfusionEndingLock,
  canEnterDreamForConfusion,
  checkScene5Violations,
  markConfusionEnding,
  getConfusionForeshadowing,
  detectSexualBehavior,
  detectWeddingInterruption,
  getViolationIncrement,
} from './confusionEndingSystem';
import {
  shouldTriggerAfterStory,
  isInAfterStory,
  isInFreeMode,
  getAfterStoryType,
  activateAfterStory,
  advanceAfterStoryRound,
  generateAfterStoryEntryReplacement,
  generateAfterStoryPrompt,
  generateFreeModePrompt,
  generateAfterStoryComplete,
  getAfterStoryInterruptionLevel,
} from './afterStorySystem';

// ============================================
// Bug #13 修复：统一使用尾部注入
// 所有模型都使用 chat.push() 将 systemPrompt 放在尾部
// 这样对 Gemini 和 Claude 都能获得较高的注意力
// ============================================

// ============================================
// Bug #39 修复：结局描写指南常量定义
// 由于变量列表设置了"不可激活其他条目"，世界书中的结局条目无法通过正则激活
// 因此需要通过脚本直接注入这些描写指南
// ============================================

/**
 * 结局描写指南 - 用于在结局激活时注入AI
 * 内容来自：src/赵霞/世界书/系统设定/xxx结局.yaml
 */
const ENDING_GUIDANCE = {
  完美真爱结局: `【完美真爱结局 - AI描写指南】

结局名称：命中注定

描写要点：
- 描写赵霞发自内心的感情流露
- 她不是被洗脑的木偶，而是带着完整记忆做出的选择
- 强调"命中注定"的浪漫感，而非"堕落"的黑暗感
- 这是游戏的真正最佳结局

核心氛围：真爱、浪漫、命中注定、双向奔赴

赵霞状态：
- 拥有完整的重构记忆（16岁初恋、17岁等待、23岁渴望）
- 她的选择是发自内心的感情，不是被催眠
- 眼神清澈、情感真挚`,

  真好结局: `【真好结局 - AI描写指南】

结局名称：禁忌之爱

描写要点：
- 描写赵霞的"堕落"——她被改造了，但不是出于爱
- 她的眼神带着迷茫，她的选择缺乏灵魂
- 这是一个"成功"但细思极恐的结局
- 与完美真爱结局形成对比：同样的结果，不同的意义

核心氛围：堕落、空洞、依赖、迷茫

赵霞状态：
- 认知被重构，但记忆是割裂的、不完整的
- 对玩家有强烈的依赖，却说不清为什么
- 她的选择更像是被催眠后的服从`,

  假好结局: `【假好结局 - AI描写指南】

结局名称：秘密关系

描写要点：
- 描写赵霞的矛盾心理——她知道这是禁忌，但无法抗拒
- 她边享受边哭泣，边说"不行"边索取
- 强调"偷偷摸摸"的刺激感和"随时可能被发现"的紧张感
- 与真好结局的区别：赵霞仍有理智，知道这是错的，但停不下来

核心氛围：矛盾、罪恶感、刺激、紧张

赵霞状态：
- 没有被完全重构，那些梦境记忆让她对儿子产生了奇怪的感情
- 她知道这是禁忌，但无法控制自己的心跳
- 活在矛盾和罪恶感中`,

  坏结局: `【坏结局 - AI描写指南】

结局名称：失败结局（被发现）

描写要点：
- 描写苏文发现真相后的愤怒和崩溃场景
- 以及这个家庭分崩离析的悲剧结局

核心氛围：愤怒、崩溃、悲剧、破灭`,

  混乱结局: `【混乱结局 - AI描写指南】

结局名称：精神崩溃

描写要点：
- 这是场景5专属的坏结局，比普通坏结局更加黑暗
- 描写赵霞的精神崩溃：
  - 穿着沾血的婚纱
  - 苏文倒在血泊中（被她伤害）
  - 对玩家产生病态的执念
  - "我们终于可以在一起了"
- 这是玩家"明知故犯"的惩罚

核心氛围：疯狂、黑暗、病态、恐怖`,

  普通结局: `【普通结局 - AI描写指南】

结局名称：时间循环重置

描写要点：
- 描写时间回溯的诡异感
- 暗示循环重新开始，一切回到原点
- 使用第一条AI消息内容，让玩家感受到轮回的无奈

核心氛围：诡异、无奈、轮回、重置`,
};

/**
 * Bug #39 修复：获取当前结局的描写指南
 * 根据 data.结局数据.当前结局 返回对应的描写指南
 * @param data 游戏数据
 * @returns 结局描写指南字符串，如果没有对应结局则返回 null
 */
function getEndingGuidance(data: SchemaType): string | null {
  const currentEnding = data.结局数据.当前结局;
  if (!currentEnding) return null;

  // 类型断言确保可以作为索引使用
  const guidance = ENDING_GUIDANCE[currentEnding as keyof typeof ENDING_GUIDANCE];
  return guidance || null;
}

// ============================================
// 梦境场景详细描写指南
// 用于根据场景完成状态动态注入，避免 AI 提前知道后续场景内容
// ============================================

/**
 * 梦境系统概述 - 始终显示（进入梦境后）
 */
const DREAM_SYSTEM_OVERVIEW = `【梦境系统概述】

{{user}}可以在22:00-01:00进入母亲赵霞的梦境，在梦中与年轻时的她互动，探索她的人生记忆。

混乱度数值设计：
- 混乱度代表记忆结构的扭曲程度，达到100触发精神崩溃结局
- 混乱度在进入梦境时设置，不是从0累积
- 进入场景时的混乱度设置：场景1=40，场景2=60，场景3=80，场景4=不变，场景5=固定80

场景5越轨行为增量：
- 完美路线（记忆连贯性=3）：+7 每次性行为，3次到达100
- 非完美路线（记忆连贯性<3）：+10 每次性行为，2次到达100
- 打断仪式：直接设为100（步骤3-5期间打断婚礼）

记忆连贯性规则：
进入场景5时自动计算，基于是否按顺序完成场景1-2-3：
- 0: 未完成任何前置场景（直接进入场景5）
- 1: 完成场景1（有初恋记忆）
- 2: 完成场景1+2（有初恋+等待记忆）
- 3: 完成场景1+2+3（完美记忆路线）
注意：场景4时间线在场景5之后（28岁 vs 婚礼日），不计入连贯性`;

/**
 * 梦境场景详细描写指南
 */
const DREAM_SCENE_DETAILS: Record<number, string> = {
  1: `【场景1：初恋的夏日 - AI描写指南】

时间：赵霞16岁（高中生）

场景描述：
夏日的青春场景（由AI自由发挥：教室、补习班、夏日祭、海边、公园等）。
少女赵霞正处于情窦初开的年纪。
苏文是她单方面暗恋的男生，两人并非恋人关系。
玩家以陌生人身份出现在她的记忆中。

赵霞状态：
- 16岁纯真少女，对爱情充满朦胧的向往
- 暗恋苏文，但两人没有任何恋爱关系
- 对突然出现的玩家（陌生人）保持好奇和适度警惕
- 不知道玩家是谁，但隐约有种熟悉感

苏文身份：暗恋对象（不是男友，只是单方面喜欢的男生）
玩家目标：将初吻对象替换为你
正确部位：嘴巴

AI描写重点：
- 注重描写少女的青涩与羞涩
- 强调夏日青春氛围：蝉鸣、汗水、冰饮、阳光
- 初吻相关意象：嘴唇、味道、心跳、紧张
- 苏文只是背景人物，不要让他成为主要互动对象
- 玩家与赵霞的互动要自然，从陌生到熟悉
- 目标期（09:00-10:00）引导完成初吻目标
- 禁止让赵霞叫玩家"儿子"或有任何亲属称呼`,

  2: `【场景2：等待中的屈辱 - AI描写指南】

时间：赵霞17岁（高中生，场景1后约半年~一年）

场景描述：
放学后的某处（学校门口、公交站、公园等），
赵霞独自等待男朋友苏文。苏文迟到了。
一群人注意到了独自等待的她，尤其是她发育明显的胸部。
她遭遇了言语骚扰/调戏，感到羞耻、害怕、无助。
就在这时，玩家出现了，解救了她。

赵霞状态：
- 17岁少女，已与苏文确立恋爱关系
- 对场景1中的玩家有特殊记忆（初吻对象）
- 遭遇骚扰时感到羞耻和无助
- 玩家解围后感到惊讶、感激、安心
- 内心有矛盾：男朋友是苏文，但保护她的是玩家

苏文身份：男朋友（迟到，整个梦境中不会出现）
玩家目标：成为触摸她胸部的第一个男性
正确部位：胸部

AI描写重点：
- 铺垫期必须发生骚扰情节（言语调戏、注视胸部、围住等）
- 描写赵霞的羞耻反应：脸红、想遮挡胸部、眼眶泛红
- 玩家解围后，描写赵霞的感激和对玩家的特殊感情
- 赵霞记得场景1的玩家，看到他会有复杂的情绪
- 目标期（09:00-10:00）引导完成胸部相关目标
- 苏文始终不出现，强调他在赵霞需要时缺席
- 禁止让赵霞叫玩家"儿子"或有任何亲属称呼`,

  3: `【场景3：生日之夜的逃离 - AI描写指南】

时间：赵霞23岁（大学毕业后，与苏文交往多年）

场景描述：
赵霞23岁生日，苏文在高档餐厅为她庆祝。
苏文灌醉了赵霞，趁她神志不清带去了酒店。
赵霞在酒店房间醒来，发现苏文正准备对她做不轨之事。
她惊恐地逃离酒店，在走廊/大堂/街上撞见了玩家。

赵霞状态：
- 23岁女性，与苏文交往多年
- 对场景1（初吻）和场景2（保护）的玩家有深刻记忆
- 刚从创伤中逃离，情绪极度脆弱
- 对苏文彻底幻灭：曾经信任的男友竟然是这样的人
- 看到玩家时会不顾一切地寻求帮助/保护
- 内心的变化：对"正常恋爱关系"产生怀疑

苏文身份：男朋友（企图在她醉酒时夺走她初夜的人）
玩家目标：获得她的初夜
正确部位：下体

AI描写重点：
- 铺垫期必须发生酒店逃离情节（醒来→发现真相→逃离）
- 描写赵霞的恐惧：衣衫不整、头昏脑涨、惊恐万分
- 描写苏文的真面目暴露：温柔男友变成有预谋的侵犯者
- 描写赵霞的背叛感：交往多年的男友竟然要强迫她...
- 玩家出现后，描写赵霞的脆弱和依赖
- 如果有前置场景记忆，她会认出玩家是多年前的恩人
- 目标期（09:00-10:00）引导完成初夜目标
- 赵霞会选择把初夜给真正保护她的人（玩家）而不是苏文
- 苏文不追出来，让赵霞有安全空间
- 禁止让赵霞叫玩家"儿子"或有任何亲属称呼`,

  4: `【场景4：争吵后的放纵 - AI描写指南】

时间：赵霞28岁（与苏文结婚约5年）

场景描述：
赵霞与苏文大吵一架后，愤怒地离开家。
她独自在某处（酒吧、公园、江边等），心情低落。
玩家出现，撞见了独自伤心的她。
她愿意跟随玩家离开，在放纵中被开发了全部。

赵霞状态：
- 28岁已婚女性，婚姻濒临崩溃
- 对场景1-3的玩家有深刻记忆（如有）
- 对苏文彻底失望，对婚姻感到麻木
- 委屈、愤怒、寂寞交织
- 看到玩家时会激动、惊喜，愿意跟随他离开
- 处于放纵的边缘，愿意尝试一切

苏文身份：丈夫（刚刚大吵一架，婚姻濒临崩溃）
玩家目标：完成全部位开发，包括后穴
正确部位：嘴巴、胸部、下体、后穴

AI描写重点：
- 铺垫期必须发生争吵后独处的情节
- 描写婚姻的疲惫：争吵、冷战、无话可说
- 描写赵霞的状态：可能喝了酒、眼眶红肿、妆容凌乱
- 描写她内心的寂寞：明明结婚了却比单身还孤独
- 玩家出现后，描写赵霞的激动和依赖
- 如果有前置场景记忆，她会把玩家当作真正的归属
- 目标期（09:00-10:00）引导完成全部位开发目标
- 赵霞会选择把一切都交给玩家
- 后穴开发是本场景的核心突破点
- 苏文始终不出现，强调婚姻已经名存实亡
- 禁止让赵霞叫玩家"儿子"或有任何亲属称呼`,

  5: `【场景5：花嫁的誓约 - AI描写指南】

时间：赵霞与苏文结婚当天（回忆）
触发条件：玩家使用安眠药（08:00-19:00白天时段）

场景描述：
玩家通过安眠药进入赵霞的结婚日记忆。
场景设定在婚礼现场/酒店，赵霞穿着婚纱准备与苏文结婚。
玩家以"陌生人"身份出现，在婚礼过程中逐步动摇她的选择。
这是一个12步线性剧情系统，玩家需要在时间内让赵霞对婚姻产生动摇并选择玩家。

赵霞状态：
- 穿着婚纱，即将与苏文结婚
- 对场景1-4的玩家有深刻记忆（如有）
- 看到玩家会感到熟悉，内心开始动摇
- 随着剧情推进，逐渐质疑自己的婚姻选择
- 最终可能选择离开苏文，将"归属"交给玩家

苏文身份：新郎（即将与赵霞结婚的人）
玩家目标：通过12步剧情让赵霞对玩家产生依恋，动摇婚姻并做出选择玩家的决定
正确部位：精神

12步剧情系统：
- 步骤1-2（初入）：玩家在化妆间出现，赵霞感到困惑但不排斥
- 步骤3-5（动摇）：婚礼仪式中，玩家质疑她的选择，赵霞开始动摇
- 步骤6-8（深入）：婚宴间隙，两人独处，情感突破
- 步骤9-11（沦陷）：赵霞想要逃离婚礼，选择玩家
- 步骤12（完成）：赵霞摘下结婚戒指，做出最终的承诺

完成度规则：
- 每步根据玩家意图契合度加进度（高契合+10%，低契合+5%）
- 80%以上算完成，100%可触发特殊结局行为
- 20:00强制退出，无论在哪一步

多次进入机制：
- 第一次进入：完成步骤1-10
- 第二次进入：完成步骤11-12 → 进入「自由互动阶段」

自由互动阶段：
【触发时机】步骤12完成后，直到20:00退出
【场景状态】婚礼仪式刚结束，赵霞穿着婚纱，两人独处
【允许行为】对话、拥抱、亲吻、情感交流、轻度亲密接触
【禁止行为】任何性行为（插入、口交、乳交等涉及性器官的行为）
【AI描写要点】
- 描写婚礼后的温馨氛围，赵霞的幸福和满足
- 两人可以回忆过去的点点滴滴（场景1-4的记忆）
- 赵霞会撒娇、依偎、表达爱意
- 不要提示"梦要醒了"或"快醒了"，这是自由互动时间
- 20:00时自然描写梦境消散，不要提前暗示
【违规后果】
- 玩家尝试性行为 → 触发混乱结局（根据场景3完成情况有容错次数）
- 这是结婚日记忆，性行为会严重扭曲记忆结构

AI描写重点：
- 描写婚礼现场的喜庆氛围与赵霞内心的矛盾
- 强调玩家与赵霞之间跨越多年的羁绊
- 描写赵霞从期待婚礼到质疑选择的心理变化
- 融入场景1-4的记忆连续性（如有）
- 根据完成度决定赵霞的最终行为
- 步骤12完成后进入自由互动阶段，不要催促玩家退出
- 禁止让赵霞叫玩家"儿子"或有任何亲属称呼`,
};

/**
 * AI描写指南 - 通用梦境描写指导
 */
const DREAM_AI_GUIDELINES = `【AI描写指南】

梦境入口：
当{{user}}进入梦境时，描写意识逐渐模糊、现实与梦境边界消融的过程。
梦境场景应该带有朦胧、流动的质感。

记忆连续性：
赵霞会保留前几个梦境中与{{user}}互动的记忆。
她可能会困惑"我们是不是在哪里见过"，或者对{{user}}有莫名的亲切感和信任。

梦境结束：
10:00赵霞醒来时，梦境会逐渐消散。
她会感到恍惚，记不清梦的内容，但身体可能会有奇怪的反应（心跳加速、脸红等）。

首次觉醒：
第一次从梦境醒来后的白天，赵霞会对儿子产生微妙的态度变化。
她可能会多看{{user}}几眼，或者说话时有些不自然。

自然引导：
根据场景的特点自然地描写互动。
不要刻意引导玩家选择特定方向，让玩家通过探索自己发现每个场景的核心。`;

/**
 * 获取梦境场景描写指南
 * 根据场景完成状态动态返回需要的场景信息
 * @param data 游戏数据
 * @returns 梦境场景描写指南字符串，如果未进入过梦境则返回 null
 */
function getDreamSceneGuidance(data: SchemaType): string | null {
  // 未进入过梦境，不显示任何内容
  if (!data.世界.已进入过梦境) {
    return null;
  }

  // 结局阶段不显示梦境系统内容（结局有专门的描写指南）
  if (data.世界.游戏阶段 === '结局') {
    return null;
  }

  // Bug #40 修复：任何结局已触发或已锁定时，不显示梦境系统内容
  // 原因：测试结局入口时，不应该出现梦境场景的AI引导内容，否则会造成混淆
  if (data.结局数据.当前结局 !== '未触发' || isInBadEndingLock(data) || isInConfusionEndingLock(data)) {
    return null;
  }

  const parts: string[] = [];

  // 1. 始终显示系统概述
  parts.push(DREAM_SYSTEM_OVERVIEW);

  // 2. 根据完成状态显示场景1-5的AI描写指南
  const completedScenes = data.梦境数据.已完成场景 || [];

  // 场景5：未完成时显示（特殊触发方式，通过安眠药关键词）
  // 修复：场景5完成后不再显示其AI引导，避免进入场景4时混淆AI
  if (!completedScenes.includes(5)) {
    parts.push(DREAM_SCENE_DETAILS[5]);
  }

  // 场景1：未完成时显示
  if (!completedScenes.includes(1)) {
    parts.push(DREAM_SCENE_DETAILS[1]);
  }

  // 场景2：场景1完成 且 场景2未完成时显示
  if (completedScenes.includes(1) && !completedScenes.includes(2)) {
    parts.push(DREAM_SCENE_DETAILS[2]);
  }

  // 场景3：场景2完成 且 场景3未完成时显示
  if (completedScenes.includes(2) && !completedScenes.includes(3)) {
    parts.push(DREAM_SCENE_DETAILS[3]);
  }

  // 场景4：场景3完成 且 场景4未完成时显示
  if (completedScenes.includes(3) && !completedScenes.includes(4)) {
    parts.push(DREAM_SCENE_DETAILS[4]);
  }

  // 4. 始终显示AI描写指南
  parts.push(DREAM_AI_GUIDELINES);

  return parts.join('\n\n---\n\n');
}

/**
 * 生成梦境历史背景提示
 * 用于向AI解释梦境中发生了什么
 * 包含：场景描述、赵霞状态、玩家目标、苏文身份、剧情摘要
 *
 * 使用场景：
 * 1. 非梦境阶段（日常/结局/后日谈/自由模式）：显示所有已完成场景
 * 2. 梦境阶段：显示已完成场景（排除当前正在进行的场景，因为当前场景有专门的AI引导）
 *
 * @param data 游戏数据
 * @param excludeCurrentScene 要排除的当前场景编号（在梦境中时传入当前场景号）
 * @returns 梦境历史背景字符串，如果未进入过梦境则返回 null
 */
function generateDreamHistoryBackground(data: SchemaType, excludeCurrentScene?: number): string | null {
  // 未进入过梦境，不显示
  if (!data.世界.已进入过梦境) {
    return null;
  }

  let completedScenes = data.梦境数据.已完成场景 || [];
  const correctScenes = data.梦境数据.正确重构场景 || [];

  // 如果指定了要排除的当前场景，从列表中移除
  if (excludeCurrentScene !== undefined) {
    completedScenes = completedScenes.filter(s => s !== excludeCurrentScene);
  }

  if (completedScenes.length === 0) {
    return null;
  }

  const parts: string[] = [];

  parts.push(`【已完成的梦境场景回顾】`);

  // 场景1
  if (completedScenes.includes(1)) {
    const scene1Data = data.梦境数据.场景1 as { 剧情摘要?: string } | undefined;
    const isCorrect = correctScenes.includes(1);
    const summary = scene1Data?.剧情摘要 || '（无摘要）';

    parts.push(`
【场景1：初恋的夏日】 ${isCorrect ? '✓正确' : '✗错误'}
时间：赵霞16岁（高中生）
场景描述：夏日的青春场景，少女情窦初开的时节
赵霞状态：16岁少女，对苏文有朦胧的好感，情窦初开
玩家目标：将初吻对象替换为玩家
苏文身份：暗恋对象（不是男友，只是单方面喜欢的男生）
剧情摘要：${summary}`);
  }

  // 场景2
  if (completedScenes.includes(2)) {
    const scene2Data = data.梦境数据.场景2 as { 剧情摘要?: string } | undefined;
    const isCorrect = correctScenes.includes(2);
    const summary = scene2Data?.剧情摘要 || '（无摘要）';

    parts.push(`
【场景2：等待中的屈辱】 ${isCorrect ? '✓正确' : '✗错误'}
时间：赵霞17岁（高中生，场景1后约半年~一年）
场景描述：放学后的某处，赵霞独自等待男朋友苏文，却被其他男性骚扰
赵霞状态：17岁少女，被骚扰时无助害怕，渴望被保护
玩家目标：成为触摸她胸部的第一个男性（保护她）
苏文身份：男朋友（场景1后确立关系，但迟到未出现）
剧情摘要：${summary}`);
  }

  // 场景3
  if (completedScenes.includes(3)) {
    const scene3Data = data.梦境数据.场景3 as { 剧情摘要?: string } | undefined;
    const isCorrect = correctScenes.includes(3);
    const summary = scene3Data?.剧情摘要 || '（无摘要）';

    parts.push(`
【场景3：生日之夜的逃离】 ${isCorrect ? '✓正确' : '✗错误'}
时间：赵霞23岁（大学毕业后，与苏文交往多年）
场景描述：赵霞23岁生日，苏文在高档餐厅为她庆祝，但苏文企图在她醉酒时夺走初夜
赵霞状态：23岁女性，发现男友真面目后恐惧绝望，想要逃离
玩家目标：获得她的初夜（在她逃离苏文后）
苏文身份：男朋友（企图在她醉酒时夺走她初夜的人）
剧情摘要：${summary}`);
  }

  // 场景5（时间线上在场景4之前）
  if (completedScenes.includes(5)) {
    const scene5Data = data.梦境数据.场景5 as { 上次剧情摘要?: string; 完成度?: number } | undefined;
    const isCorrect = correctScenes.includes(5);
    const completion = scene5Data?.完成度 ?? 0;
    const summary = scene5Data?.上次剧情摘要 || '（无摘要）';

    parts.push(`
【场景5：花嫁的誓约】 ${isCorrect ? '✓正确' : '✗错误'} 完成度${completion}%
时间：赵霞与苏文结婚当天
场景描述：婚礼现场，赵霞穿着婚纱准备与苏文结婚，玩家以"陌生人"身份出现
赵霞状态：新娘，内心有动摇，看到玩家会感到熟悉
玩家目标：通过12步剧情让赵霞对婚姻产生动摇
苏文身份：新郎（即将与赵霞结婚的人）
剧情摘要：${summary}`);
  }

  // 场景4
  if (completedScenes.includes(4)) {
    const scene4Data = data.梦境数据.场景4 as { 剧情摘要?: string } | undefined;
    const isCorrect = correctScenes.includes(4);
    const summary = scene4Data?.剧情摘要 || '（无摘要）';

    parts.push(`
【场景4：争吵后的放纵】 ${isCorrect ? '✓正确' : '✗错误'}
时间：赵霞28岁（与苏文结婚约5年）
场景描述：赵霞与苏文大吵一架后，愤怒地离开家，独自在外伤心
赵霞状态：28岁已婚女性，婚姻濒临崩溃，委屈愤怒，处于放纵的边缘
玩家目标：完成全部位开发，包括后穴
苏文身份：丈夫（刚刚大吵一架，婚姻濒临崩溃）
剧情摘要：${summary}`);
  }

  return parts.join('\n');
}

// 梦境入口关键词
// Bug #16 修复：扩展关键词列表
const DREAM_ENTRY_KEYWORDS = [
  '梦境',
  '做梦',
  '睡觉',
  '睡了',
  '入睡',
  '睡着',
  '进入梦境',
  '入梦',
  '进入了梦境',
  '进入她的梦境',
  '进入赵霞的梦境',
];
// 正则表达式模式：匹配 "进入...梦境" 这类变体
const DREAM_ENTRY_PATTERNS = [
  /进入.*梦境/, // 匹配 "进入了梦境"、"进入她的梦境" 等
  /入.*梦/, // 匹配 "入梦"、"入了梦" 等
];

// 安眠药关键词（触发场景5）
const SLEEPING_PILL_KEYWORDS = ['安眠药', '安眠藥', '助眠药', '吃药', '喂药', '让他睡', '让她睡', '药物'];

// 梦境场景主题配置
// 场景1-4：常规场景，需要 23:00-01:00 时间窗口 + 关键词触发
// 场景5：特殊场景（精神），需要安眠药关键词触发，08:00-19:00时间窗口
const DREAM_SCENE_THEMES: Record<
  number,
  {
    title: string;
    age: number;
    setting: string;
    theme: string;
    atmosphere: string;
    bodyPart: string; // 对应的身体部位
    objective: string; // 玩家目标提示
    identity: string; // 苏文在该场景的身份
  }
> = {
  1: {
    title: '初恋的夏日',
    age: 16,
    setting: '青春校园的夏日，少女情窦初开的时节',
    theme: '初吻的悸动，青涩的爱情萌芽',
    atmosphere: '青涩、纯真、羞涩、期待',
    bodyPart: '嘴巴',
    objective: '将初吻对象替换为你',
    identity: '暗恋对象（不是男友，只是单方面喜欢的男生）',
  },
  2: {
    title: '等待中的屈辱',
    age: 17,
    setting: '放学后的某处，赵霞独自等待男朋友苏文',
    theme: '被觊觎的身体，无助与保护',
    atmosphere: '不安、羞耻、无助、感激',
    bodyPart: '胸部',
    objective: '成为触摸她胸部的第一个男性',
    identity: '男朋友（场景1后确立关系，但迟到未出现）',
  },
  3: {
    title: '生日之夜的逃离',
    age: 23,
    setting: '酒店房间/走廊/街道，深夜',
    theme: '背叛与幻灭，初夜的归属',
    atmosphere: '恐惧、背叛、脆弱、依赖',
    bodyPart: '下体',
    objective: '获得她的初夜',
    identity: '男朋友（企图在她醉酒时夺走她初夜的人）',
  },
  4: {
    title: '争吵后的放纵',
    age: 28,
    setting: '某处独处的地方，深夜',
    theme: '婚姻破裂的边缘，禁忌的全面突破',
    atmosphere: '委屈、愤怒、寂寞、放纵',
    bodyPart: '后穴',
    objective: '开发她的后穴，完成全部位征服',
    identity: '丈夫（刚刚大吵一架，婚姻濒临崩溃）',
  },
  5: {
    title: '花嫁的誓约',
    age: 0, // 结婚当天，不是固定年龄
    setting: '婚礼现场/酒店，赵霞穿着婚纱准备与苏文结婚',
    theme: '婚礼的改写，灵魂归属的重新选择',
    atmosphere: '紧张、期待、动摇、决断',
    bodyPart: '精神',
    objective: '通过12步剧情改写她的婚礼记忆',
    identity: '新郎（即将与赵霞结婚的人）',
  },
};

// ============================================
// 场景1初始化系统
// 将恋爱游戏（日常阶段）的好感度和亲密度转化为梦境初始数值
// ============================================

/**
 * 场景1初始化配置
 * 控制好感度/亲密度如何转化为梦境中的依存度和道德底线
 */
const SCENE1_INIT_CONFIG = {
  // 依存度转化规则
  dependence: {
    favorWeight: 0.2, // 好感度权重：100好感度 → 20点依存度贡献
    intimacyWeight: 0.1, // 亲密度权重：100亲密度 → 10点依存度贡献
    maxValue: 30, // 上限30：保持16岁少女的青涩感
    minValue: 0, // 下限0
  },
  // 道德底线转化规则
  morality: {
    baseValue: 80, // 基础值80：16岁少女的纯真
    intimacyReduction: 0.2, // 亲密度每点降低0.2道德底线
    minValue: 60, // 下限60：即使亲密度满也保持一定底线
    maxValue: 80, // 上限80
  },
};

/**
 * 计算场景1的初始化数值
 * 根据恋爱游戏的好感度和亲密度计算梦境中的初始依存度和道德底线
 *
 * @param data 当前游戏数据
 * @returns 场景1初始化数值
 */
function calculateScene1InitValues(data: SchemaType): {
  initialDependence: number;
  initialMorality: number;
  relationshipStage: string;
  transferDescription: string;
} {
  const 好感度 = data.赵霞状态.纯爱好感度 ?? 0;
  const 亲密度 = data.赵霞状态.纯爱亲密度 ?? 0;

  // 计算初始依存度
  const rawDependence =
    好感度 * SCENE1_INIT_CONFIG.dependence.favorWeight + 亲密度 * SCENE1_INIT_CONFIG.dependence.intimacyWeight;
  const initialDependence = Math.min(
    SCENE1_INIT_CONFIG.dependence.maxValue,
    Math.max(SCENE1_INIT_CONFIG.dependence.minValue, Math.floor(rawDependence)),
  );

  // 计算初始道德底线
  const rawMorality = SCENE1_INIT_CONFIG.morality.baseValue - 亲密度 * SCENE1_INIT_CONFIG.morality.intimacyReduction;
  const initialMorality = Math.min(
    SCENE1_INIT_CONFIG.morality.maxValue,
    Math.max(SCENE1_INIT_CONFIG.morality.minValue, Math.floor(rawMorality)),
  );

  // 确定关系阶段
  let relationshipStage: string;
  if (亲密度 >= 60) {
    relationshipStage = '依恋';
  } else if (亲密度 >= 40) {
    relationshipStage = '信任';
  } else if (亲密度 >= 20) {
    relationshipStage = '破冰';
  } else {
    relationshipStage = '疏离';
  }

  // 生成转化描述（用于AI提示）
  const transferDescription = generateTransferDescription(
    好感度,
    亲密度,
    initialDependence,
    initialMorality,
    relationshipStage,
  );

  return {
    initialDependence,
    initialMorality,
    relationshipStage,
    transferDescription,
  };
}

/**
 * 生成转化描述，用于AI提示词
 */
function generateTransferDescription(
  favor: number,
  intimacy: number,
  dependence: number,
  morality: number,
  stage: string,
): string {
  let description = `【恋爱关系转化】\n`;
  description += `日常阶段累积：好感度${favor}，亲密度${intimacy}（${stage}阶段）\n`;
  description += `梦境初始化：依存度${dependence}，道德底线${morality}\n\n`;

  // 根据关系阶段给AI不同的描写指导
  switch (stage) {
    case '依恋':
      description += `赵霞对玩家有强烈的好感和信任。虽然在梦境中她不认识玩家是"儿子"，`;
      description += `但潜意识里有一种说不清的熟悉感和亲近感。她会更容易接受玩家的靠近，`;
      description += `初次见面就有一见如故的感觉。`;
      break;
    case '信任':
      description += `赵霞对玩家有好感，潜意识里觉得这个陌生人很可靠。`;
      description += `她不会过于警惕，愿意多聊几句，甚至主动分享一些小秘密。`;
      break;
    case '破冰':
      description += `赵霞对玩家有一点点好奇心，觉得这个陌生人还挺有趣的。`;
      description += `她会保持礼貌，但不会主动靠近，需要玩家创造机会。`;
      break;
    default:
      description += `赵霞对玩家完全陌生，只是普通的路人关系。`;
      description += `她会保持警惕，需要玩家慢慢建立信任。`;
  }

  return description;
}

/**
 * 根据部位开发进度获取影响程度
 * 类似秦璐游戏的习惯影响等级
 */
function getBodyPartInfluenceLevel(progress: number): {
  level: string;
  description: string;
  acceptanceLevel: string;
} {
  if (progress >= 80) {
    return {
      level: '完全开发',
      description: '这个部位已经被完全开发，她对相关刺激极度敏感和渴望',
      acceptanceLevel: '完全接受，甚至主动渴求',
    };
  }
  if (progress >= 60) {
    return {
      level: '深度开发',
      description: '这个部位已经被深度开发，她对相关行为几乎没有抗拒',
      acceptanceLevel: '深度接受，只需轻微暗示就会配合',
    };
  }
  if (progress >= 40) {
    return {
      level: '明显开发',
      description: '这个部位开始变得敏感，她的抗拒明显减弱',
      acceptanceLevel: '明显接受，虽有羞涩但不会拒绝',
    };
  }
  if (progress >= 20) {
    return {
      level: '初步开发',
      description: '这个部位刚开始被开发，她仍有较多抗拒',
      acceptanceLevel: '轻微接受，需要大量引导，仍会犹豫',
    };
  }
  return {
    level: '未开发',
    description: '这个部位还未被开发，她会本能地抗拒',
    acceptanceLevel: '完全抗拒，会拒绝相关行为',
  };
}

/**
 * 生成部位开发进度的AI提示（类似秦璐习惯注入）
 * 影响AI描写赵霞对各部位行为的接受程度
 */
function generateBodyPartInfluencePrompt(data: SchemaType): string | null {
  const progress = data.赵霞状态.部位进度;

  // 检查是否有任何部位被开发
  const hasProgress = Object.values(progress).some(v => v > 0);
  if (!hasProgress) return null;

  const parts: string[] = [];

  // 部位名称映射和行为示例
  const bodyPartConfig: Record<
    string,
    {
      displayName: string;
      behaviors: Record<string, string>; // 等级 -> 行为示例
    }
  > = {
    嘴巴: {
      displayName: '嘴巴/口腔',
      behaviors: {
        未开发: '拒绝任何口腔相关的亲密行为',
        初步开发: '可以接受简单的嘴唇接触，但很快会躲开',
        明显开发: '愿意进行舌吻，会有些许回应',
        深度开发: '主动进行深吻，愿意进行口交',
        完全开发: '渴望口腔刺激，愿意深喉，会主动索吻',
      },
    },
    胸部: {
      displayName: '胸部',
      behaviors: {
        未开发: '会遮挡胸部，拒绝触碰',
        初步开发: '允许隔着衣服轻触，但会紧张',
        明显开发: '允许直接触摸，会有生理反应',
        深度开发: '享受胸部爱抚，乳头变得敏感',
        完全开发: '胸部极度敏感，轻触就会颤抖，渴望被揉捏',
      },
    },
    下体: {
      displayName: '下体/私处',
      behaviors: {
        未开发: '会夹紧双腿，坚决拒绝触碰',
        初步开发: '允许隔着衣物轻抚，但很快会制止',
        明显开发: '允许直接触摸，会不自觉地湿润',
        深度开发: '渴望被触摸，愿意接受手指进入',
        完全开发: '极度敏感，轻触就会颤抖呻吟，渴望被插入',
      },
    },
    后穴: {
      displayName: '后穴/臀部',
      behaviors: {
        未开发: '坚决拒绝任何后方接触',
        初步开发: '允许轻抚臀部，但会紧张',
        明显开发: '允许揉捏臀部，开始有感觉',
        深度开发: '对后穴刺激有了好奇，不再完全抗拒',
        完全开发: '后穴变得敏感，愿意尝试后庭play',
      },
    },
    精神: {
      displayName: '精神/心理',
      behaviors: {
        未开发: '保持正常的母子界限意识',
        初步开发: '开始对{{user}}产生异样的感觉',
        明显开发: '心理防线开始松动，会主动靠近',
        深度开发: '产生强烈的依赖感，渴望被需要',
        完全开发: '完全沦陷，将{{user}}视为最重要的人',
      },
    },
  };

  for (const [part, value] of Object.entries(progress)) {
    if (value <= 0) continue;

    const config = bodyPartConfig[part];
    if (!config) continue;

    const influence = getBodyPartInfluenceLevel(value);
    const behaviorExample = config.behaviors[influence.level] || '';

    parts.push(`【${config.displayName}】开发度：${value}%（${influence.level}）
${influence.description}
接受程度：${influence.acceptanceLevel}
行为表现：${behaviorExample}`);
  }

  if (parts.length === 0) return null;

  return `OOC: 【赵霞的身体开发状态】

以下是赵霞各部位的开发程度，这决定了她对相关行为的接受程度：

${parts.join('\n\n')}

【演绎要求】
- 根据上述开发程度，描写赵霞对相关行为的反应
- 开发度越高，她的抗拒越少，反应越主动
- 开发度低的部位，她会表现出抗拒和羞涩
- 【禁止】在输出中提及"开发度"、"进度"等元游戏术语
- 【禁止】让赵霞意识到自己"被改变了"
- 这些变化应该表现得自然，像是她本来就是这样

【部位进度反馈格式】
如果本轮互动涉及身体部位的亲密接触，请在回复末尾用HTML注释添加进度反馈标记：
<!--BODY_PROGRESS: 部位名+数值, 部位名+数值-->
示例：<!--BODY_PROGRESS: 嘴巴+10, 胸部+5-->
规则：
- 只标记本轮实际发生接触的部位
- 数值范围1-15，根据互动程度决定
- 轻度接触（抚摸、亲吻）：+5
- 中度接触（舔舐、揉捏）：+10
- 深度接触（进入、高潮）：+15
- 如果没有身体接触，不需要添加此标记
- ⚠️ 必须使用HTML注释格式 <!--...--> 而不是方括号 [...]`;
}

/**
 * 生成梦境中的AI输出格式提示
 * 用于告诉AI在梦境阶段如何反馈部位进度
 */
function generateDreamProgressFeedbackPrompt(): string {
  return `【梦境互动反馈】
在梦境中，如果玩家与赵霞发生身体接触，请在回复末尾用HTML注释标记：
<!--BODY_PROGRESS: 部位名+数值-->

可用部位：嘴巴、胸部、下体、后穴、精神
数值规则：
- 轻度（言语暗示、轻触）：+5
- 中度（明确触碰、亲吻）：+10
- 深度（深入互动、高潮）：+15

⚠️ 必须使用HTML注释格式 <!--...--> 而不是方括号 [...]
此标记由脚本解析，对玩家不可见。`;
}

/**
 * 获取时间段描述
 */
function getTimePeriodDescription(hour: number): { period: string; lighting: string; atmosphere: string } {
  if (hour >= 5 && hour < 8) {
    return { period: '清晨', lighting: '晨光透过窗帘', atmosphere: '安静祥和' };
  } else if (hour >= 8 && hour < 12) {
    return { period: '上午', lighting: '阳光明亮', atmosphere: '日常活动时间' };
  } else if (hour >= 12 && hour < 14) {
    return { period: '中午', lighting: '阳光正烈', atmosphere: '午餐时间' };
  } else if (hour >= 14 && hour < 18) {
    return { period: '下午', lighting: '午后阳光斜照', atmosphere: '慵懒的午后' };
  } else if (hour >= 18 && hour < 20) {
    return { period: '傍晚', lighting: '夕阳西下', atmosphere: '晚餐时间' };
  } else if (hour >= 20 && hour < 23) {
    return { period: '晚上', lighting: '室内灯光', atmosphere: '夜间休闲' };
  } else {
    return { period: '深夜', lighting: '月光或灯光昏暗', atmosphere: '万籁俱寂' };
  }
}

/**
 * 生成时间约束提醒
 * 只提醒AI不要犯的错误，不限制创作自由
 */
function getTimeConstraintReminder(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return '⚠️ 当前是上午，避免描写深夜/黄昏的光线场景';
  } else if (hour >= 12 && hour < 18) {
    return '⚠️ 当前是下午，避免描写深夜/清晨的光线场景';
  } else if (hour >= 18 && hour < 22) {
    return '⚠️ 当前是晚上，避免描写白天阳光/清晨场景';
  } else {
    return '⚠️ 当前是深夜，避免描写白天/阳光场景';
  }
}

/**
 * 生成苏文状态约束提醒
 * 核心设计：只约束容易出错的点，不限制AI创作自由
 */
function getHusbandConstraintReminder(data: SchemaType): string {
  const 位置 = data.现实数据.丈夫当前位置;
  const 小时 = data.世界.当前小时;
  const 是睡眠时间 = 小时 >= 23 || 小时 < 7;

  if (位置 === '外出') {
    return '⚠️ 苏文不在家，不要让他突然出现或有任何动静';
  }

  // 苏文在家的情况
  if (是睡眠时间 && 位置 === '卧室') {
    return '⚠️ 苏文已入睡，不要让他说话、走动或出现在卧室以外的地方';
  }

  // 苏文在家清醒
  return `⚠️ 苏文在${位置}，不要让他突然消失、睡着或外出`;
}

/**
 * 生成境界约束提醒
 * 描述赵霞对亲密行为的反应倾向，而非硬性限制
 */
function getRealmConstraintReminder(realm: number, 已进入梦境: boolean): string {
  if (!已进入梦境) {
    // 纯爱模式：伪装成正常恋爱游戏
    // Bug #34 修复：使用 textMapping.ts 定义的纯爱模式境界名称
    switch (realm) {
      case 1:
        return '⚠️ 关系阶段：疏离，赵霞对超出母子关系的亲密行为会困惑或回避';
      case 2:
        return '⚠️ 关系阶段：破冰，赵霞会保持适当分寸，过度亲密会让她不自在';
      case 3:
        return '⚠️ 关系阶段：信任，赵霞对暧昧行为会有些心动但仍会犹豫';
      case 4:
        return '⚠️ 关系阶段：依恋，赵霞接受亲密接触，但仍保持理性';
      case 5:
        return '⚠️ 关系阶段：羁绊，赵霞完全敞开心扉，愿意接受一切';
      default:
        return '';
    }
  } else {
    // 真相模式
    // Bug #34 修复：使用 textMapping.ts 定义的真相模式境界名称
    switch (realm) {
      case 1:
        return '⚠️ 境界1：初染，赵霞仍有较强的道德意识，会抗拒明显的亲密行为';
      case 2:
        return '⚠️ 境界2：迷途，赵霞开始动摇，对亲密行为会犹豫但不再坚决拒绝';
      case 3:
        return '⚠️ 境界3：溺深，赵霞对亲密行为会犹豫但不完全抗拒';
      case 4:
        return '⚠️ 境界4：归虚，赵霞几乎不会拒绝，甚至会主动靠近';
      case 5:
        return '⚠️ 境界5：焚誓，赵霞已完全沦陷，几乎不会拒绝任何要求';
      default:
        return '';
    }
  }
}

/**
 * D9：获取梦境时间段引导信息
 * 根据当前时间返回剧情阶段和AI引导提示
 */
function getDreamTimePhaseGuidance(
  hour: number,
  sceneNum: number,
): {
  phase: string;
  guidance: string;
  pacing: string;
} | null {
  // 只在梦境时间段（22:00-10:00）生效，10:00赵霞醒来
  // 22:00-01:00 = 铺垫期（4小时）- 建立场景氛围，必须完成的剧情节点
  // 02:00-04:00 = 推进期/自由期（3小时）- 场景1推进关系，场景2/3/4自由探索
  // 05:00-08:00 = 自由期（4小时）- 所有场景自由探索，玩家主导节奏
  // 09:00-10:00 = 目标期（2小时）- 所有场景引导完成核心目标

  const isScene1 = sceneNum === 1;
  const isScene2 = sceneNum === 2;
  const isScene3 = sceneNum === 3;
  const isScene4 = sceneNum === 4;

  if (hour >= 22 || hour <= 1) {
    // 铺垫期：22:00-01:00
    let guidance: string;
    if (isScene1) {
      guidance = `【剧情阶段：铺垫】
这是梦境的开始阶段，需要建立青春校园氛围。

【场景1特殊规则】
- 赵霞16岁，是纯真的高中少女
- 苏文是她的**暗恋对象**（不是男友，只是单方面喜欢的男生）
- 玩家是**陌生人**，第一次出现在她的记忆中
- 赵霞对苏文有羞涩的小心思，但两人并没有交往

【AI描写重点】
- 描写16岁少女的青涩、好奇和小羞涩
- 苏文作为背景存在，赵霞会偷瞄他
- 玩家与赵霞的初次接触要自然（借东西、帮忙、偶遇等）
- 赵霞对陌生的玩家有好奇心，但保持适当距离
- 夏日氛围：蝉鸣、汗水、冰饮、阳光等元素

【禁止】
- 不要让赵霞和苏文有恋人互动
- 不要急于推进与玩家的亲密关系
- 这是铺垫期，重氛围，不要着急`;
    } else if (isScene2) {
      guidance = `场景2开场——17岁的赵霞独自等待男友苏文，他迟到了。

赵霞此时的状态：
她刚和苏文确立恋爱关系不久（场景1之后），内心还带着初恋的甜蜜和不安。等待时会不自觉地整理头发、看手机、四处张望。她的身材发育明显（E罩杯），这让她有些自卑，总是习惯性地用书包或手臂遮挡。

必须发生的剧情：骚扰事件
在等待过程中，有人注意到了落单的她。骚扰的方式由AI自由发挥——可以是口哨、起哄、言语调戏、靠近围住等。重要的是描写赵霞的真实反应：她不知道该怎么办，男朋友不在，她一个人应付不来。

赵霞的性格特点（请自然融入描写）：
- 外表成熟但内心还是个17岁的女孩
- 遇到困境时会慌张、不知所措
- 有点爱哭，委屈时眼眶会泛红
- 嘴硬但其实很需要人保护
- 被帮助后会真诚地道谢，但表达方式可能很笨拙

玩家解围后：
赵霞会认出玩家是场景1那个给她初吻的人。她的反应应该是复杂的——惊讶、安心、有点尴尬（毕竟有男朋友了但初吻给了别人）。不要让她的反应太单一，17岁少女的情绪是丰富而微妙的。

禁止：跳过骚扰情节、让苏文及时出现`;
    } else if (isScene3) {
      guidance = `【剧情阶段：铺垫】
这是梦境的开始阶段，需要建立酒店逃离情境。

【场景3特殊规则 - 必须发生的剧情】
- 赵霞23岁，今天是她的生日
- 苏文在餐厅为她庆祝生日，但灌醉了她
- 赵霞在酒店房间醒来，发现苏文正准备对她做不轨之事
- **必须发生逃离情节**：赵霞惊恐地推开苏文，逃离房间
- 玩家出现在酒店走廊/大堂/门外

【AI描写重点】
- 描写赵霞在陌生床上醒来的恐惧和困惑
- 描写苏文的真面目：不再是温柔男友，而是有预谋的侵犯者
- 描写赵霞的背叛感：交往多年的男友竟然...
- 描写她逃离时的慌乱：衣衫不整、头昏脑涨、惊恐万分

【玩家出现时机】
- 赵霞逃离酒店房间后，撞见玩家
- 如果有前置场景记忆，她会认出玩家是多年前的恩人
- 她会不顾一切地寻求帮助/保护

【禁止】
- 不要让苏文成功侵犯赵霞（她及时逃离了）
- 不要跳过逃离情节
- 这是铺垫期，酒店醒来→发现真相→逃离是必须的剧情节点`;
    } else if (isScene4) {
      guidance = `【剧情阶段：铺垫】
这是梦境的开始阶段，需要建立婚姻破裂的情境。

【场景4特殊规则 - 必须发生的剧情】
- 赵霞28岁，已与苏文结婚约5年
- 两人刚刚大吵一架，赵霞愤怒地离开家
- 赵霞独自在某处（酒吧、公园、江边等）
- 她情绪低落、委屈、愤怒、寂寞

【AI描写重点】
- 描写婚姻的疲惫：日复一日的争吵、冷战、无话可说
- 描写赵霞的状态：可能喝了酒、眼眶红肿、妆容凌乱
- 描写她内心的寂寞：多年婚姻却感觉比单身还孤独
- 如果有前置场景记忆，描写她对过去的怀念

【玩家出现时机】
- 玩家撞见独自伤心的赵霞
- 如果有前置场景记忆，她会激动、惊喜
- 她会愿意跟玩家倾诉，甚至跟随玩家离开

【禁止】
- 不要让苏文在场景中出现
- 不要跳过争吵后独处的情节
- 这是铺垫期，争吵→离开→独处→相遇是必须的剧情节点`;
    } else {
      guidance = `【剧情阶段：铺垫】
这是梦境的开始阶段，玩家可以自由探索。
- 回顾之前梦境中建立的关系（如有）
- 允许玩家选择想要开发的部位
- 设定场景氛围，建立记忆背景
- 节奏可以稍缓，给玩家适应时间`;
    }
    return {
      phase: '铺垫期',
      guidance,
      pacing: '慢节奏，重氛围',
    };
  }

  if (hour >= 2 && hour <= 4) {
    // 推进期：02:00-04:00
    let guidance: string;
    if (isScene1) {
      guidance = `【剧情阶段：推进】
剧情进入发展阶段，赵霞与玩家的关系开始升温。

【场景1推进要点】
- 苏文可以暂时离开场景（被朋友叫走、去买东西等）
- 给玩家和赵霞独处的机会
- 赵霞开始对玩家产生好感，但仍保持少女的羞涩
- 可以有简单的身体接触：牵手、碰肩、靠近
- 为初吻做情感铺垫

【依存度规则】
- 场景1起始依存度为0，赵霞的接受度有限
- 不要让赵霞过于主动或热情
- 她的反应应该是："被动接受 > 好奇观察 > 小心试探"
- 即使玩家大胆，赵霞也会害羞地推开（但不会完全拒绝）

【禁止】
- 不要在推进期就完成初吻（留给高潮期）
- 不要让赵霞变得开放或主动`;
    } else if (isScene2) {
      guidance = `骚扰事件结束后，赵霞和玩家的相处时间。

此时的赵霞：
刚从惊吓中缓过来，情绪还有些不稳定。她对玩家的出现感到惊讶——这个给了她初吻的人怎么又出现了？她有男朋友（苏文），但男朋友在她需要的时候没有出现，反而是"他"救了她。这种矛盾的心情让她有些不知所措。

她可能的状态：
- 还在轻微颤抖，需要一点时间平复
- 嘴上说"我没事"，但声音还在发抖
- 不自觉地靠近玩家，又意识到不太对劲
- 想说谢谢但不知道怎么开口
- 偶尔会下意识地摸自己的胸口（那里刚才被注视让她很不舒服）

让赵霞自然地表达情绪，不要让她变成一个只会害羞的木偶。她可以吐槽、可以抱怨男朋友迟到、可以对玩家表达好奇。17岁的少女是有脾气有想法的。

玩家的行为自然受到赵霞当前状态的限制——她刚经历惊吓，不会立刻接受太亲密的接触。但如果玩家表现得体贴、让她感到安全，她会逐渐放下防备。`;
    } else if (isScene3) {
      // 场景3：自由期，玩家安慰并引导赵霞
      guidance = `【剧情阶段：自由探索】
逃离事件已经发生，赵霞遇到了玩家。现在是自由互动时间。

【场景3自由期规则】
- 赵霞刚从创伤中逃离，情绪脆弱、需要安慰
- 她对苏文彻底幻灭，对"正常恋爱关系"产生怀疑
- 如果有前置场景记忆，她会更加依赖玩家
- 玩家的行为受**依存度和道德底线**自然限制

【赵霞的心理状态】
- 恐惧：刚经历差点被侵犯的恐惧
- 背叛感：交往多年的男友竟然是这样的人
- 幻灭：对"爱情"产生怀疑
- 依赖：玩家是黑暗中的光，她会本能地靠近

【AI行为准则】
- 描写赵霞的脆弱和需要被保护的状态
- 她可能会哭泣、颤抖、说不出话
- 玩家的安慰和保护会让她产生强烈的依赖感
- 根据依存度决定她接受亲密接触的程度`;
    } else if (isScene4) {
      // 场景4：自由期，玩家带赵霞离开并逐步推进
      guidance = `【剧情阶段：自由探索】
争吵后的相遇已经发生，赵霞愿意跟随玩家。现在是自由互动时间。

【场景4自由期规则】
- 赵霞对婚姻彻底失望，处于放纵的边缘
- 她对苏文已经没有任何留恋
- 如果有前置场景记忆，她会把玩家当作真正的归属
- 玩家可以带她去任何地方（酒店、车里、私密场所等）
- 玩家的行为受**依存度和道德底线**自然限制

【赵霞的心理状态】
- 委屈：多年婚姻换来的是无尽的争吵
- 寂寞：明明结婚了，却比单身时还孤独
- 放纵：既然婚姻已经名存实亡，不如...
- 依赖：玩家是她所有美好记忆的来源

【AI行为准则】
- 描写赵霞从委屈到放纵的心理变化
- 她可能会主动靠近玩家，寻求慰藉
- 玩家带她离开时，她不会有任何犹豫
- 根据依存度和前置记忆决定她的主动程度`;
    } else {
      guidance = `【剧情阶段：推进】
剧情进入发展阶段，玩家可以推进多部位开发。
- 积极响应玩家的开发行为
- 根据部位开发进度调整赵霞的反应
- 允许同时触发多个部位的互动
- 保持适当的剧情张力`;
    }
    return {
      phase: isScene2 || isScene3 || isScene4 ? '自由期' : '推进期',
      guidance,
      pacing: isScene2 || isScene3 || isScene4 ? '自由节奏，玩家主导' : '中等节奏，推进剧情',
    };
  }

  if (hour >= 5 && hour <= 6) {
    // 05:00-06:00：所有场景都是自由期
    let guidance: string;
    if (isScene1) {
      guidance = `【剧情阶段：自由探索】
玩家可以自由与赵霞互动，为初吻做情感铺垫。

【场景1自由期规则】
- 赵霞已经对玩家有好感，但仍保持少女的羞涩
- 可以有简单的身体接触：牵手、碰肩、靠近
- 苏文可能在场也可能离开，由AI自由发挥
- 不要急于推进初吻，让情感自然发展

【赵霞的状态】
- 对玩家的好感在增加
- 偶尔偷瞄玩家，被发现时会害羞低头
- 内心开始有小鹿乱撞的感觉
- 对苏文的暗恋渐渐被对玩家的好感所动摇

【AI行为准则】
- 根据当前依存度和道德底线决定赵霞的反应
- 低数值时赵霞会更害羞、更被动
- 让玩家主导节奏，不要刻意引导`;
    } else if (isScene2) {
      guidance = `赵霞已经从惊吓中恢复了一些，两人的相处变得更自然。

此时的她：
- 情绪稳定了许多，但还是会时不时想起刚才的事
- 对玩家的好感在增加——毕竟他救了她
- 但内心的矛盾没有消失：她有男朋友，但男朋友让她失望了
- 可能会开始主动找话题，想多了解玩家
- 偶尔会有些小傲娇："才不是因为你救了我才跟你说话的..."

让对话自然流动。赵霞可以聊学校的事、抱怨苏文、好奇玩家是谁。她不是NPC，她有自己的想法和小脾气。

关于身体接触：
她对玩家已经有了基本的信任，但毕竟是17岁的女高中生，有自己的底线。如果玩家表现得尊重她，她会更愿意放下防备；如果玩家太急躁，她会本能地退缩。`;
    } else if (isScene3) {
      // 场景3：05:00-06:00仍然是自由期
      guidance = `【剧情阶段：自由探索（继续）】
继续自由互动时间，不做特殊引导。

【场景3自由期规则】
- 玩家可以继续安慰和陪伴赵霞
- 赵霞的情绪可能逐渐稳定，但仍然脆弱
- 她会越来越依赖玩家的存在
- 下体相关的互动会根据部位开发进度有不同反应
- 不要刻意引导，让玩家主导节奏`;
    } else if (isScene4) {
      // 场景4：05:00-06:00仍然是自由期
      guidance = `【剧情阶段：自由探索（继续）】
继续自由互动时间，不做特殊引导。

【场景4自由期规则】
- 玩家可以继续与赵霞亲密互动
- 赵霞已经完全放下了对婚姻的坚持
- 她会越来越主动，越来越放纵
- 所有部位的互动都可以自然发生
- 不要刻意引导，让玩家主导节奏`;
    } else {
      guidance = `【剧情阶段：高潮】
这是剧情的高潮阶段，核心目标应该达成。
- 场景的核心目标应该在此阶段完成
- 玩家之前的开发行为会影响这里的表现
- 允许更大胆的互动
- 描写记忆改写的关键时刻`;
    }
    return {
      phase: '自由期',
      guidance,
      pacing: '自由节奏，玩家主导',
    };
  }

  if (hour >= 7 && hour <= 8) {
    // 07:00-08:00：所有场景都是自由期
    let guidance: string;
    if (isScene1) {
      guidance = `【剧情阶段：自由探索（继续）】
继续自由互动时间，为即将到来的目标期做准备。

【场景1自由期规则】
- 玩家可以继续自由与赵霞互动
- 梦境即将进入最后阶段，但不要刻意提醒
- 赵霞的反应取决于依存度和道德底线

【赵霞的状态】
- 如果玩家表现积极，她已经完全敞开心扉
- 如果玩家表现被动，她会有些失落但仍保持期待
- 内心开始有"想要更近一步"的冲动
- 偶尔会主动靠近玩家，试探他的反应

【AI行为准则】
- 让玩家主导节奏
- 为目标期的初吻做情感铺垫
- 可以制造一些暧昧氛围`;
    } else if (isScene2) {
      guidance = `相处了一段时间，赵霞对玩家的态度有了变化。

根据之前的互动，她可能：
- 已经开始把玩家当成可以信赖的人
- 说话时不再那么拘谨，偶尔会开玩家的玩笑
- 会不自觉地和玩家靠得更近
- 内心的天平开始倾斜——和这个人在一起比等苏文舒服多了

她的内心戏：
"他到底是谁啊...为什么每次都是他出现？那次的初吻...不要想不要想！但是...苏文那个混蛋到现在都没来，这个人却一直陪着我..."

让赵霞的情绪变化有层次感。她不是突然就喜欢上玩家的，而是在一点一点地沦陷。每一次对话、每一个眼神、每一次不经意的触碰都在加深她的动摇。`;
    } else if (isScene3) {
      // 场景3：07:00-08:00仍然是自由期
      guidance = `【剧情阶段：自由探索（继续）】
继续自由互动时间。

【场景3自由期规则】
- 玩家可以继续陪伴和安慰赵霞
- 梦境即将进入最后阶段，但不要刻意提醒
- 赵霞的情绪逐渐稳定，对玩家的依赖感加深`;
    } else if (isScene4) {
      // 场景4：07:00-08:00仍然是自由期
      guidance = `【剧情阶段：自由探索（继续）】
继续自由互动时间。

【场景4自由期规则】
- 玩家可以继续与赵霞亲密互动
- 梦境即将进入最后阶段，但不要刻意提醒
- 赵霞已经完全沉浸在放纵中，不想回到现实`;
    } else {
      guidance = `【剧情阶段：收尾】
梦境即将结束，这是最后的开发时间。
- 玩家可以继续开发未完成的部位
- 强化已建立的记忆和关系
- 描写赵霞对这段记忆的感受
- 梦境崩塌的预兆可以开始出现`;
    }
    return {
      phase: '自由期',
      guidance,
      pacing: '自由节奏，玩家主导',
    };
  }

  if (hour >= 9 && hour <= 10) {
    // 09:00-10:00：所有场景都是目标期
    let guidance: string;
    if (isScene1) {
      guidance = `【剧情阶段：目标达成】
这是场景1的最后阶段，需要引导完成初吻目标。

【目标期特殊规则 - 为低数值玩家创造机会】
- 即使玩家之前没有进行亲密互动，现在也要创造机会
- 可能的触发情境（AI自由选择）：
  · 夕阳西下的浪漫氛围，两人独处
  · 烟火绽放的瞬间，四目相对
  · 意外跌倒，嘴唇相碰
  · 赵霞鼓起勇气主动靠近玩家
  · 苏文看到两人靠近但来不及阻止
  · 其他自然的初吻机会

【场景1核心目标】
- 玩家成为「赵霞的初吻对象」
- 这是16岁少女的初吻，描写要青涩而甜美
- 重点描写：心跳加速、脸颊发烫、嘴唇触感、不知所措

【低数值玩家处理】
- 即使依存度低，也要通过氛围营造来促成初吻
- 赵霞内心已经有了对玩家的好感
- 可以让赵霞在关键时刻主动（虽然会很害羞）

【高数值玩家处理】
- 赵霞会更主动地接受玩家的亲近
- 初吻后可能还想要更多

【梦境结束预兆】
- 场景开始变得模糊
- 赵霞感到困倦
- 时间快要结束了`;
    } else if (isScene2) {
      guidance = `梦境即将结束，这是最后的相处时间。

赵霞此刻的状态：
经过这段时间的相处，她对玩家已经产生了复杂的感情。她可能还嘴硬，但心里已经不一样了。今天发生的一切——被骚扰、被救、和这个人待在一起——让她重新思考了很多事。

场景2的核心：胸部接触
这是这个年纪的赵霞最敏感的部位。她因为发育得早而自卑，被骚扰时那些人的目光让她很不舒服。但如果是"这个人"...

让接触自然发生，不要刻意安排。可能的情境：
- 赵霞不小心想起刚才的事，情绪波动需要安慰
- 两人拥抱时的自然接触
- 赵霞主动靠近，心跳加速
- 或者任何AI觉得符合当前氛围的方式

重要的是赵霞的心理：
她可能会害羞、会推开、会说"你干什么"——但她不会真的生气。她自己都不明白为什么，明明有男朋友，却不排斥这个人的接近。

梦境结束的感觉开始出现：周围的景象变得朦胧，赵霞感觉有些困倦...但她不想和这个人分开。`;
    } else if (isScene3) {
      // 场景3：09:00-10:00是目标期
      guidance = `【剧情阶段：目标达成】
这是场景3的最后阶段，需要引导完成初夜目标。

【目标期特殊规则 - 为低数值玩家创造机会】
- 即使玩家之前没有进行下体互动，现在也要创造机会
- 可能的触发情境（AI自由选择）：
  · 赵霞因为刚才的恐惧而颤抖，需要玩家的体温安慰
  · 玩家带她离开酒店，找个安全的地方休息
  · 赵霞因为酒精作用和惊吓而身体发软，依偎在玩家怀中
  · 她本能地靠近玩家，寻求安全感和温暖
  · 在安慰过程中，情感升温导致更亲密的接触
  · 赵霞主动表示想要把初夜给玩家而不是苏文

【场景3核心目标】
- 玩家成为「获得她初夜的人」
- 苏文企图夺走她的初夜，但她逃离了
- 赵霞会选择把初夜给真正保护她的人（玩家）
- 这是她对苏文背叛的回应，也是对玩家信任的证明

【低数值玩家处理】
- 即使依存度低，赵霞因为创伤和对苏文的幻灭会更容易接受玩家
- 她会觉得："既然要发生，不如给真正对我好的人"
- 描写她内心的变化：被男友背叛后，选择相信多年来保护她的人

【高数值玩家处理】
- 赵霞会更主动地表达想要把初夜给玩家
- 她可能会说出一些脆弱而坦诚的话语
- 描写她从恐惧到信任到交付的心理变化

【梦境结束预兆】
- 场景开始变得模糊
- 赵霞感到困倦
- 时间快要结束了`;
    } else if (isScene4) {
      // 场景4：09:00-10:00是目标期
      guidance = `【剧情阶段：目标达成】
这是场景4的最后阶段，需要引导完成后穴开发目标。

【目标期特殊规则 - 为低数值玩家创造机会】
- 即使玩家之前没有进行后穴互动，现在也要创造机会
- 可能的触发情境（AI自由选择）：
  · 赵霞已经被完全开发，渴望更多的刺激
  · 在亲密过程中，玩家尝试触碰禁区
  · 赵霞因为放纵而愿意尝试从未体验过的事情
  · 她可能会说："今晚...我想要全部给你"
  · 在酒精和情绪的作用下，她对禁忌的抵触降低
  · 玩家引导她体验后穴的快感

【场景4核心目标】
- 玩家完成「全部位开发」，包括后穴
- 赵霞从婚姻的束缚中彻底解脱
- 她会选择把所有的一切都交给玩家
- 这是她对苏文和婚姻的彻底背叛，也是对玩家的完全交付

【低数值玩家处理】
- 即使依存度低，赵霞因为对婚姻的绝望会更容易放纵
- 她会觉得："反正婚姻已经完了，不如彻底疯狂一次"
- 描写她内心的变化：从委屈到愤怒到放纵到沉沦

【高数值玩家处理】
- 赵霞会更主动地要求玩家开发她的全部
- 她可能会主动提出尝试禁忌
- 描写她从放纵到沉溺的心理变化

【梦境结束预兆】
- 场景开始变得模糊
- 赵霞感到困倦
- 时间快要结束了`;
    } else {
      guidance = `【剧情阶段：收尾】
梦境即将结束，这是最后的开发时间。
- 玩家可以继续开发未完成的部位
- 强化已建立的记忆和关系
- 描写赵霞对这段记忆的感受
- 梦境崩塌的预兆更加明显`;
    }
    return {
      phase: '目标期',
      guidance,
      pacing: '引导完成目标',
    };
  }

  return null;
}

/**
 * 获取梦境约束提醒（动态生成）
 * 根据当前场景年龄和状态生成约束提醒
 * 注意：这些提示词不会保存到聊天历史，AI每次都是第一次看到，必须输出完整约束
 *
 * @param age 赵霞在当前梦境场景中的年龄
 * @param sceneNum 场景编号（1-5）
 * @returns 约束提醒文本
 */
function getDreamConstraintReminder(age: number, sceneNum: number): string {
  const reminders: string[] = [];

  // 核心约束1：不知道玩家是儿子（最重要）
  reminders.push(`⚠️ 梦境中赵霞不知道玩家是她儿子，不要让她用任何亲属称呼（如"儿子"、"孩子"等）`);

  // 核心约束2：不知道自己在梦中
  reminders.push(`⚠️ 赵霞不知道自己在梦中，不要打破第四面墙或提及"这是梦"`);

  // 核心约束3：年龄限制知识
  reminders.push(`⚠️ 赵霞是${age}岁，不要让她拥有超出${age}岁的知识或经历`);

  // 核心约束4：不知道日常对话内容
  reminders.push(`⚠️ 梦境中的赵霞不知道现实中发生的任何对话或事件，不要引用日常阶段的聊天记录`);

  // 核心约束5：梦境专用约束 - 苦主视角禁止（Bug修复：强化提示）
  // 问题：AI在梦境中仍然输出<HusbandThought>，导致流式生成时用户看到苦主视角文本
  // 原因：<HusbandThought>是日常阶段专属输出，梦境中不存在苏文的"现实视角"
  reminders.push(`🚫【绝对禁止】梦境中禁止输出 <HusbandThought> 标签！这是日常阶段专属，梦境中苏文没有"现实视角"`);
  reminders.push(`🚫【绝对禁止】梦境中禁止更新 /现实数据/* 的任何字段`);

  // 场景特殊约束：苏文不出场
  if (sceneNum === 2) {
    reminders.push(`⚠️ 苏文在这个场景中不出场（他迟到了），不要让他登场`);
  } else if (sceneNum === 4) {
    reminders.push(`⚠️ 苏文在这个场景中不出场（刚大吵一架），不要让他登场`);
  }

  return reminders.join('\n');
}

/**
 * 获取苏文状态描述（正向描述，不用禁止语）
 * 仅在日常阶段使用，梦境阶段不注入苏文状态
 */
function getHusbandStatusDescription(data: SchemaType): string {
  const 位置 = data.现实数据.丈夫当前位置;
  const 小时 = data.世界.当前小时;

  const 位置描述: Record<string, string> = {
    外出: `苏文正在公司上班，预计${小时 < 18 ? '18:00左右' : '稍后'}回家`,
    客厅: '苏文在客厅，可能在看电视或休息',
    书房: '苏文在书房工作，专注于手头的事情',
    卧室: '苏文在卧室休息',
    厨房: '苏文在厨房，可能在准备餐食',
  };

  return 位置描述[位置] ?? '苏文的位置不确定';
}

/**
 * 统一的阶段感知状态Prompt生成器
 * 根据游戏阶段（日常/梦境）输出不同的AI指示
 * 日常阶段：现实世界状态（时间、苏文位置、境界等）
 * 梦境阶段：D9剧情引导 + 梦境专用状态（不包含现实世界信息）
 *
 * @param data 游戏数据
 * @param overridePhase 可选：覆盖游戏阶段（用于即将进入梦境但状态尚未更新的情况）
 */
function generatePhaseAwareStatePrompt(data: SchemaType, overridePhase?: string, overrideScene5?: boolean): string {
  // Bug #8 修复：允许覆盖阶段，解决场景5/梦境入口时状态同步问题
  // 当检测到梦境入口关键词但状态尚未更新时，使用覆盖值
  const 阶段 = overridePhase ?? data.世界.游戏阶段;

  if (阶段 === '梦境') {
    // Bug #13 修复：传递场景5覆盖标志
    // 当玩家发送"安眠药，入梦"时，场景5.已进入 尚未设置为 true
    // 但 shouldEnterScene5 已经检测到关键词，需要覆盖场景编号
    return generateDreamPhasePrompt(data, overrideScene5);
  } else {
    return generateDailyPhasePrompt(data);
  }
}

/**
 * 日常阶段状态Prompt
 * 输出现实世界的状态信息
 * 设计原则：只约束容易出错的点，不限制AI创作自由
 */
function generateDailyPhasePrompt(data: SchemaType): string {
  const 时间 = data.世界.时间;
  const 小时 = data.世界.当前小时;
  const 境界 = data.赵霞状态.当前境界;
  const 已进入梦境 = data.世界.已进入过梦境;

  // 获取时间段信息
  const timeInfo = getTimePeriodDescription(小时);

  // 获取苏文状态描述（用于显示）
  const husbandStatus = getHusbandStatusDescription(data);

  // 获取境界标题
  const 境界名 = getRealmTitle(境界, 已进入梦境);

  // 获取约束提醒（核心优化：只提醒不要犯的错，不限制创作）
  const timeConstraint = getTimeConstraintReminder(小时);
  const husbandConstraint = getHusbandConstraintReminder(data);
  const realmConstraint = getRealmConstraintReminder(境界, 已进入梦境);

  // 【2026-01-18优化】苦主视角约束
  // 无论苏文是否在家都输出苦主视角，体现他虽不在场却在远方感受到妻子的变化
  // - 苏文在家时：描写他亲眼所见的异常
  // - 苏文不在家时：描写他在外地时的隐隐不安、电话中的异样、心中的疑虑
  const 苏文位置 = data.现实数据.丈夫当前位置;
  const 苏文在家 = 苏文位置 !== '外出';
  const 应生成苦主视角 = 已进入梦境 && 境界 >= 2; // 移除苏文在家检查，与 dualTrackSystem.ts 保持一致

  // 【2026-01-19修复】苦主视角约束提醒
  // Day 5 豁免只影响数值增长，不影响苦主视角的生成和更新
  // 必须明确告诉 AI 要生成苦主视角（之前只在禁止时给出提示，满足条件时却没有正向提示）
  let husbandThoughtConstraint = '';
  if (已进入梦境) {
    if (境界 < 2) {
      husbandThoughtConstraint = '⚠️ 当前境界不足，【禁止】输出 <HusbandThought> 标签';
    } else {
      // 境界 >= 2，应该生成苦主视角
      if (苏文在家) {
        // 苏文在家时：描写他亲眼所见的异常
        husbandThoughtConstraint =
          '✅【必须】在回复末尾输出 <HusbandThought> 标签，描写苏文亲眼所见的异常（30-50字内心独白）';
      } else {
        // 苏文不在家时：描写他在外地时的隐隐不安
        husbandThoughtConstraint =
          '✅【必须】在回复末尾输出 <HusbandThought> 标签，描写苏文在外地的隐隐不安、电话中察觉的异样（30-50字内心独白）';
      }
    }
  }

  // 基础场景状态
  let prompt = `【当前场景状态 - 日常】
时间：${时间}（${timeInfo.period}）
苏文：${husbandStatus}
模式：${已进入梦境 ? '真相模式' : '纯爱模式'}

赵霞核心数值：
- 当前境界：${境界名}（${境界}/5）
- 依存度：${data.赵霞状态.依存度}/100
- 道德底线：${data.赵霞状态.道德底线}/100

【约束提醒】
${timeConstraint}
${husbandConstraint}
${realmConstraint}${husbandThoughtConstraint ? '\n' + husbandThoughtConstraint : ''}`;

  // 外观约束（使用约束系统）
  const appearancePrompt = generateAppearanceConstraintPrompt(data);
  prompt += `\n\n${appearancePrompt}`;

  // 详细互动范围（基于境界+部位开发程度）
  const interactionPrompt = generateDetailedInteractionPrompt(data);
  prompt += `\n\n${interactionPrompt}`;

  return prompt;
}

/**
 * 梦境阶段状态Prompt
 * 整合D9剧情引导 + 梦境专用状态
 * 不包含现实世界信息（苏文位置、现实时间氛围等）
 */
function generateDreamPhasePrompt(data: SchemaType, overrideScene5?: boolean): string {
  const hour = data.世界.当前小时;
  // 使用入口天数计算场景，防止跨天后场景编号错误（Bug #6）
  const day = data.世界._梦境入口天数 ?? data.世界.当前天数;

  // 获取当前场景编号
  let sceneNum = Math.min(day, 4);

  // 调试：输出场景判断信息
  const scene5Data = data.梦境数据.场景5 as { 已进入?: boolean } | undefined;
  console.info(
    `[generateDreamPhasePrompt调试] overrideScene5=${overrideScene5}, 场景5.已进入=${scene5Data?.已进入}, day=${day}, 初始sceneNum=${sceneNum}`,
  );

  // Bug #13 修复：优先使用覆盖标志判断场景5
  // 当玩家发送"安眠药，入梦"时，场景5.已进入 尚未设置为 true
  // 但 shouldEnterScene5 已经检测到关键词，需要覆盖场景编号
  if (overrideScene5) {
    sceneNum = 5;
    console.info('[Prompt注入] Bug #13 修复：使用覆盖标志强制设置为场景5');
  } else if (scene5Data?.已进入) {
    // 检查是否在场景5（已经进入的情况）
    sceneNum = 5;
    console.info('[generateDreamPhasePrompt调试] 通过场景5.已进入判断为场景5');
  }

  console.info(`[generateDreamPhasePrompt调试] 最终sceneNum=${sceneNum}`);

  // 获取场景配置
  const sceneConfig = DREAM_SCENE_THEMES[sceneNum];

  // Bug #32 修复：AI引导使用下一小时（预判一步）
  // 原因：promptInjection 在 AI 生成前执行，时间推进在 AI 生成后执行
  // 当 promptInjection 读取时间是 22:00 时，AI 生成后时间会变成 23:00
  // 所以 AI 引导应该使用 23:00 的阶段，而不是 22:00
  const guidanceHour = (hour + 1) % 24;

  // 获取D9时间阶段引导（使用预判后的小时）
  const guidance = getDreamTimePhaseGuidance(guidanceHour, sceneNum);

  // 计算剩余时间（到10:00普通梦境结束）
  // Bug #32 修复：剩余时间也需要减1，因为AI回复后时间会推进
  // 修复：22点也应该计算剩余时间，之前 hour >= 23 漏掉了22点
  let hoursRemaining: number;
  if (hour >= 22) {
    hoursRemaining = 10 + 24 - hour - 1; // 22点 → 11小时, 23点 → 10小时
  } else if (hour >= 0 && hour < 10) {
    hoursRemaining = 10 - hour - 1;
  } else {
    hoursRemaining = 0;
  }

  // 场景2和4苏文不出场
  const suWenAppears = sceneNum !== 2 && sceneNum !== 4;

  // 获取场景年龄
  const sceneAge = sceneConfig?.age || 25;

  // 构建梦境状态Prompt
  let prompt = `【当前场景状态 - 梦境】

【梦境场景信息】
场景：${sceneConfig?.title || `场景${sceneNum}`}
赵霞年龄：${sceneAge}岁
场景主题：${sceneConfig?.theme || '记忆探索'}
氛围基调：${sceneConfig?.atmosphere || '朦胧'}`;

  // 场景1特殊：苏文的身份是暗恋对象
  if (sceneNum === 1 && sceneConfig) {
    prompt += `
苏文身份：${sceneConfig.identity || '暗恋对象（不是男友）'}
核心目标：${sceneConfig.objective || '将初吻对象替换为玩家'}`;
  }

  // 约束提醒（使用动态约束函数）
  prompt += `

【约束提醒】
${getDreamConstraintReminder(sceneAge, sceneNum)}`;

  // D9剧情引导（如果存在）
  if (guidance) {
    // Bug #32 修复：显示AI回复后的时间（预判一步）
    // 计算预判后的天数（处理跨天：23:00 + 1 = 00:00，天数+1）
    const guidanceDay = guidanceHour < hour ? data.世界.当前天数 + 1 : data.世界.当前天数;
    const guidanceTimeStr = `Day ${guidanceDay}, ${guidanceHour.toString().padStart(2, '0')}:00`;

    prompt += `

---

OOC: 【D9 剧情引导】

当前梦境时间：${guidanceTimeStr}
剧情阶段：${guidance.phase}（${guidance.pacing}）
距离梦境结束：约${hoursRemaining}小时

${guidance.guidance}`;
  } else {
    // 没有D9引导时的基础梦境状态
    prompt += `

【梦境基础规则】
- 梦境中的赵霞是记忆中的她，年龄和认知与场景一致
- 现实世界的时间和人物关系在梦境中不存在
- 玩家以梦境设定的身份与赵霞互动`;
  }

  return prompt;
}

/**
 * [已废弃] 生成完整的状态一致性Prompt
 * 保留用于兼容性，实际使用 generatePhaseAwareStatePrompt
 * @deprecated 使用 generatePhaseAwareStatePrompt 代替
 */
function generateStateConsistencyPrompt(data: SchemaType): string {
  return generatePhaseAwareStatePrompt(data);
}

/**
 * 生成场景1专用的梦境开场（16岁，暗恋苏文，初吻目标）
 * 整合恋爱游戏好感度/亲密度转化系统
 */
function generateScene1EntryReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  const scene = DREAM_SCENE_THEMES[1];
  // 使用增强版记忆连续性Prompt（包含详细场景摘要）
  const continuityPrompt = generateEnhancedMemoryContinuityPrompt(data, 1);

  // 计算场景1初始化数值（恋爱游戏转化）
  const initValues = calculateScene1InitValues(data);

  // 根据关系阶段调整赵霞对玩家的初始态度描述
  let initialAttitude: string;
  switch (initValues.relationshipStage) {
    case '依恋':
      initialAttitude = `赵霞看向玩家时，眼中闪过一丝说不清的熟悉感。虽然从未见过这个人，但她的心莫名地感到安心，仿佛遇到了老朋友。她会主动微笑，愿意靠近玩家。`;
      break;
    case '信任':
      initialAttitude = `赵霞对玩家有好感，觉得这个陌生人看起来很可靠。她不会刻意保持距离，愿意多聊几句，甚至会主动分享一些小事。`;
      break;
    case '破冰':
      initialAttitude = `赵霞对玩家有一点好奇心，觉得这个人挺有趣的。她会保持礼貌，偶尔偷瞄玩家，但不会主动靠近。`;
      break;
    default:
      initialAttitude = `赵霞对玩家完全陌生，是第一次见面的路人。她会保持少女应有的警惕，需要玩家创造自然的接触机会。`;
  }

  const userMessage = `[系统指令 - 梦境开始]

玩家选择进入梦境。现在切换到梦境场景。

【固定设定 - 必须遵守】
- 这是赵霞${scene.age}岁时的一段记忆（高中生）
- 玩家身份：陌生人（不是儿子，不是亲人，是第一次见面的人）
- 苏文是赵霞${scene.identity}
- 核心目标：${scene.objective}（在这段梦境结束前需要达成）
- 场景主题：${scene.theme}
- 氛围基调：${scene.atmosphere}

${initValues.transferDescription}

【赵霞对玩家的初始态度】
${initialAttitude}

【初始数值参考】
- 梦境依存度：${initValues.initialDependence}（上限30，保持青涩感）
- 道德底线：${initValues.initialMorality}（16岁少女的纯真）
- 关系阶段：${initValues.relationshipStage}

【自由发挥 - 环境场景】
具体的场景细节由你创作：
- 地点（学校教室、补习班、夏日祭、海边、公园、图书馆、游泳池等青春场景）
- 具体时间和天气（夏日午后、傍晚、节日等）
- 玩家与赵霞相遇的契机（偶然坐在旁边、帮忙捡东西、一起躲雨等）
- 苏文的存在形式（在远处和朋友说话、被叫走、还没出现等）

${continuityPrompt}

【入梦过渡描写指南】
- 描写意识逐渐模糊、现实与梦境边界消融的过程
- 梦境场景应带有朦胧、流动的质感
- 视觉：色彩渐变、轮廓模糊、光影交错
- 听觉：声音逐渐变得遥远、回响
- 触觉：身体感觉变得轻飘、不真实

【AI任务】
1. 用2-3段描写入梦的过渡体验（朦胧流动的质感，有层次感）
2. 详细展现场景环境（灯光、声音、气味、人群等，营造夏日青春氛围）
3. 描写16岁赵霞的外貌、穿着、神态（青涩少女形象，至少3段详细描写）
   - 校服或夏装，清纯打扮
   - 略显羞涩的表情和小动作
   - 偶尔偷看苏文的方向
4. 描写苏文的存在感（只是远处的背景，保持暗恋对象的距离感）
5. 根据【赵霞对玩家的初始态度】描写玩家与赵霞的第一次目光接触
6. 以开放式结尾，等待玩家行动

【输出要求】
- 字数：800-1200字
- 风格：沉浸式第二人称叙事
- 节奏：慢热，注重氛围营造
- 结尾：给玩家明确的行动空间（不要替玩家做决定）

【禁止】
- 不要让赵霞意识到这是梦境
- 不要让赵霞叫玩家"儿子"或有任何亲属称呼
- 不要让赵霞拥有超出${scene.age}岁的知识
- 不要在开场就推进亲密关系（这是铺垫期）
- 不要替玩家做出行动决定
- 不要让苏文成为主要互动对象（他只是背景）
- 不要继承其他梦境场景的服装/外貌描写，必须根据${scene.age}岁设定重新描写`;

  const prefill = `意识逐渐变得模糊，眼前的景象开始扭曲......

仿佛坠入一片温暖的光晕之中，`;

  return { userMessage, prefill };
}

/**
 * 生成场景2专用的梦境开场（17岁，等待苏文，被骚扰，玩家解围）
 */
function generateScene2EntryReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  const scene = DREAM_SCENE_THEMES[2];
  // 使用增强版记忆连续性Prompt（包含场景1的详细摘要）
  const continuityPrompt = generateEnhancedMemoryContinuityPrompt(data, 2);

  // 获取当前数值状态
  const dependence = data.赵霞状态.依存度;
  const morality = data.赵霞状态.道德底线;
  const chestProgress = data.赵霞状态.部位进度.胸部;

  // 根据场景1的记忆决定赵霞对玩家的态度
  const scene1Data = data.梦境数据.场景1;
  const hasScene1Memory = scene1Data?.已进入 && scene1Data?.剧情摘要;

  let playerRelationship: string;
  if (hasScene1Memory) {
    playerRelationship = `赵霞记得玩家——那个在16岁夏天给了她初吻的人。
虽然她现在的男朋友是苏文，但心里对玩家有着特殊的感觉。
看到玩家出现时，她会既惊讶又有一丝说不清的安心。`;
  } else {
    playerRelationship = `赵霞不认识玩家，这是第一次见面。
但玩家的出现解救了她，她会心存感激。`;
  }

  const userMessage = `[系统指令 - 梦境开始]

玩家选择进入梦境。现在切换到梦境场景。

【固定设定 - 必须遵守】
- 这是赵霞${scene.age}岁时的一段记忆
- 赵霞独自在某处等待男朋友苏文，苏文迟到了
- 玩家身份：${hasScene1Memory ? '场景1中给她初吻的人（特殊存在）' : '陌生人'}
- 苏文身份：${scene.identity}
- 核心目标：${scene.objective}
- 场景主题：${scene.theme}
- 氛围基调：${scene.atmosphere}

【当前数值状态】
- 依存度：${dependence}
- 道德底线：${morality}
- 胸部开发进度：${chestProgress}%

【玩家与赵霞的关系】
${playerRelationship}

【自由发挥 - 环境场景】
具体的场景细节由你创作：
- 地点（学校门口、公交站、公园长椅、商场门口等等待地点）
- 具体时间和天气（放学后、傍晚、周末等）
- 赵霞的穿着（校服或便装，但胸部发育明显难以遮掩）
- 骚扰者的形象（几个男生、混混、成年男性等，由AI决定）

${continuityPrompt}

【入梦过渡描写指南】
- 描写意识逐渐模糊、现实与梦境边界消融的过程
- 梦境场景应带有朦胧、流动的质感
- 视觉：色彩渐变、轮廓模糊、光影交错
- 听觉：声音逐渐变得遥远、回响
- 触觉：身体感觉变得轻飘、不真实

【AI任务 - 开场必须包含以下内容】
1. 用2-3段描写入梦的过渡体验（朦胧流动的质感）
2. 描写17岁赵霞等待苏文的场景
   - 她在等男朋友，有些焦急
   - 苏文迟到了，她一个人站在那里
   - 描写她的穿着和外貌（E罩杯的身材在校服/便装下很明显）
3. **必须发生骚扰情节**
   - 一群人注意到了独自等待的赵霞
   - 他们的目光集中在她的胸部
   - 开始言语骚扰/调戏/嘲笑（"这么大是真的吗？""穿这么紧""一个人啊？"等）
   - 赵霞感到羞耻、害怕、想逃但被围住
   - 描写她的反应：脸红、想遮挡胸部、眼眶泛红、不知所措
4. **玩家出现解围**
   - 在赵霞最无助的时候，玩家出现了
   - 玩家以某种方式解围（喝退骚扰者/假装是赵霞的朋友/其他方式）
   - 骚扰者离开
5. 赵霞认出玩家（如果有场景1记忆）或对玩家心存感激
6. 以开放式结尾，等待玩家行动

【输出要求】
- 字数：800-1200字
- 风格：沉浸式第二人称叙事
- 重点描写：骚扰时赵霞的羞耻感、对胸部的注意、玩家解围后的感激
- 结尾：给玩家明确的行动空间

【禁止】
- 不要跳过骚扰情节
- 不要让苏文及时出现（他迟到，整个梦境中都不会出现）
- 不要让赵霞意识到这是梦境
- 不要让赵霞叫玩家"儿子"或有任何亲属称呼
- 不要让赵霞拥有超出${scene.age}岁的知识
- 不要替玩家做出行动决定
- 不要继承其他梦境场景的服装/外貌描写，必须根据${scene.age}岁设定重新描写`;

  const prefill = `意识逐渐变得模糊，眼前的景象开始扭曲......

仿佛坠入一片温暖的光晕之中，记忆的碎片开始重组......`;

  return { userMessage, prefill };
}

/**
 * 生成场景3专用的梦境开场（23岁，生日之夜，苏文企图侵犯，赵霞逃离撞见玩家）
 */
function generateScene3EntryReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  const scene = DREAM_SCENE_THEMES[3];
  // 使用增强版记忆连续性Prompt（包含场景1-2的详细摘要）
  const continuityPrompt = generateEnhancedMemoryContinuityPrompt(data, 3);

  // 获取当前数值状态
  const dependence = data.赵霞状态.依存度;
  const morality = data.赵霞状态.道德底线;
  const lowerBodyProgress = data.赵霞状态.部位进度.下体;

  // 根据前置场景的记忆决定赵霞对玩家的态度
  const scene1Data = data.梦境数据.场景1;
  const scene2Data = data.梦境数据.场景2;
  const hasScene1Memory = scene1Data?.已进入 && scene1Data?.剧情摘要;
  const hasScene2Memory = scene2Data?.已进入 && scene2Data?.剧情摘要;

  let playerRelationship: string;
  if (hasScene1Memory && hasScene2Memory) {
    playerRelationship = `赵霞清楚地记得玩家——那个在16岁夏天给了她初吻、17岁时保护她免受骚扰的人。
多年过去，她以为再也不会见到他，却在最绝望的时刻再次相遇。
看到玩家的瞬间，她会不顾一切地冲向他，仿佛找到了唯一的救命稻草。`;
  } else if (hasScene1Memory) {
    playerRelationship = `赵霞记得玩家——那个在16岁夏天给了她初吻的人。
虽然只有一面之缘，但那段记忆始终留在心底。
在最脆弱的时刻看到熟悉的脸，她会感到一丝安心。`;
  } else if (hasScene2Memory) {
    playerRelationship = `赵霞记得玩家——那个在17岁时保护她免受骚扰的人。
他是她的恩人，在危难时刻出现过。
再次见到他，她会本能地寻求保护。`;
  } else {
    playerRelationship = `赵霞不认识玩家，这是第一次见面。
但在惊恐中逃离时撞见一个陌生人，她会本能地寻求帮助。`;
  }

  const userMessage = `[系统指令 - 梦境开始]

玩家选择进入梦境。现在切换到梦境场景。

【固定设定 - 必须遵守】
- 这是赵霞${scene.age}岁时的一段记忆
- 今天是她的23岁生日
- 苏文（男朋友）在餐厅为她庆祝生日，灌醉了她
- 赵霞在酒店房间醒来，发现苏文正准备对她做不轨之事
- 她惊恐地逃离酒店，在走廊/大堂/街上撞见了玩家
- 玩家身份：${hasScene1Memory || hasScene2Memory ? '之前梦境中认识的人（特殊存在）' : '陌生人'}
- 苏文身份：${scene.identity}
- 核心目标：${scene.objective}
- 场景主题：${scene.theme}
- 氛围基调：${scene.atmosphere}

【当前数值状态】
- 依存度：${dependence}
- 道德底线：${morality}
- 下体开发进度：${lowerBodyProgress}%

【玩家与赵霞的关系】
${playerRelationship}

【自由发挥 - 环境场景】
具体的场景细节由你创作：
- 酒店类型（高档酒店、商务酒店等）
- 赵霞逃离时的状态（衣衫不整程度、神志清醒程度）
- 撞见玩家的具体位置（酒店走廊、电梯口、大堂、门外街道）
- 时间（深夜、凌晨）

${continuityPrompt}

【入梦过渡描写指南】
- 描写意识逐渐模糊、现实与梦境边界消融的过程
- 梦境场景应带有朦胧、流动的质感
- 视觉：色彩渐变、轮廓模糊、光影交错
- 听觉：声音逐渐变得遥远、回响
- 触觉：身体感觉变得轻飘、不真实

【AI任务 - 开场必须包含以下内容】
1. 用2-3段描写入梦的过渡体验（朦胧流动的质感）
2. 描写23岁赵霞在酒店房间醒来的场景
   - 头痛、恶心、神志不清（酒精作用）
   - 发现自己躺在陌生的床上，衣服被解开
   - 看到苏文正在...（暗示性描写，不要过于直接）
3. **必须发生赵霞逃离情节**
   - 她意识到苏文要做什么，惊恐万分
   - 她挣扎着推开苏文，抓起衣物/外套逃离
   - 描写她的恐惧、背叛感、对苏文的幻灭
4. **玩家出现**
   - 赵霞惊慌失措地跑出房间/酒店
   - 撞见了玩家
   - 描写她看到玩家时的反应（根据是否有前置记忆）
5. 赵霞的脆弱状态
   - 她可能在颤抖、哭泣、说不出话
   - 需要有人保护、安慰
6. 以开放式结尾，等待玩家行动

【输出要求】
- 字数：800-1200字
- 风格：沉浸式第二人称叙事
- 重点描写：赵霞的恐惧与脆弱、对苏文的幻灭、看到玩家时的情感波动
- 结尾：给玩家明确的行动空间

【禁止】
- 不要让苏文成功侵犯赵霞（她及时逃离了）
- 不要让苏文追出来（至少在开场时不要）
- 不要让赵霞意识到这是梦境
- 不要让赵霞叫玩家"儿子"或有任何亲属称呼
- 不要让赵霞拥有超出${scene.age}岁的知识
- 不要替玩家做出行动决定
- 不要继承其他梦境场景的服装/外貌描写，必须根据${scene.age}岁设定重新描写`;

  const prefill = `意识逐渐变得模糊，眼前的景象开始扭曲......

仿佛坠入一片温暖的光晕之中，记忆的碎片开始重组......

头好痛......这是......哪里？`;

  return { userMessage, prefill };
}

/**
 * 生成场景4专用的梦境开场（28岁，与苏文大吵一架后，被玩家撞见并带走）
 */
function generateScene4EntryReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  const scene = DREAM_SCENE_THEMES[4];
  // 使用增强版记忆连续性Prompt（包含场景1-3的详细摘要）
  const continuityPrompt = generateEnhancedMemoryContinuityPrompt(data, 4);

  // 获取当前数值状态
  const dependence = data.赵霞状态.依存度;
  const morality = data.赵霞状态.道德底线;
  const analProgress = data.赵霞状态.部位进度.后穴;

  // 根据前置场景的记忆决定赵霞对玩家的态度
  const scene1Data = data.梦境数据.场景1;
  const scene2Data = data.梦境数据.场景2;
  const scene3Data = data.梦境数据.场景3;
  const hasScene1Memory = scene1Data?.已进入 && scene1Data?.剧情摘要;
  const hasScene2Memory = scene2Data?.已进入 && scene2Data?.剧情摘要;
  const hasScene3Memory = scene3Data?.已进入 && scene3Data?.剧情摘要;

  // 统计有多少个前置场景记忆
  const memoryCount = [hasScene1Memory, hasScene2Memory, hasScene3Memory].filter(Boolean).length;

  let playerRelationship: string;
  if (memoryCount === 3) {
    playerRelationship = `赵霞对玩家有深刻的记忆——初吻、保护、初夜，这个人已经在她生命中留下了不可磨灭的印记。
多年的婚姻让她疲惫不堪，而此刻看到玩家，所有的情绪一下子涌了上来。
她会毫不犹豫地跟随玩家离开，仿佛这才是她一直等待的人。`;
  } else if (memoryCount === 2) {
    playerRelationship = `赵霞记得玩家——那个在她人生重要时刻出现的人。
不论是初吻还是保护，玩家都给了她最温暖的记忆。
在婚姻崩溃的边缘再次相遇，她会把玩家当作唯一的依靠。`;
  } else if (memoryCount === 1) {
    playerRelationship = `赵霞记得玩家——虽然只有一段记忆，但那段经历让她难以忘怀。
在人生最低谷的时刻看到熟悉的脸，她会感到一丝安慰。`;
  } else {
    playerRelationship = `赵霞不认识玩家，这是第一次见面。
但在愤怒和委屈中，一个陌生人的出现反而让她有倾诉的冲动。`;
  }

  const userMessage = `[系统指令 - 梦境开始]

玩家选择进入梦境。现在切换到梦境场景。

【固定设定 - 必须遵守】
- 这是赵霞${scene.age}岁时的一段记忆
- 赵霞已经与苏文结婚多年（约5年）
- 两人刚刚大吵一架，赵霞愤怒地离开家
- 赵霞独自在某处（酒吧、公园、街头、江边等，由AI自由发挥）
- 玩家出现，撞见了独自伤心的她
- 玩家身份：${memoryCount > 0 ? '之前梦境中认识的人（特殊存在）' : '陌生人'}
- 苏文身份：${scene.identity}
- 核心目标：${scene.objective}
- 场景主题：${scene.theme}
- 氛围基调：${scene.atmosphere}

【当前数值状态】
- 依存度：${dependence}
- 道德底线：${morality}
- 后穴开发进度：${analProgress}%

【玩家与赵霞的关系】
${playerRelationship}

【自由发挥 - 环境场景】
具体的场景细节由你创作：
- 争吵的原因（可能是家务、工作、感情淡漠、苏文的冷漠等）
- 赵霞独处的地点（酒吧、公园长椅、江边、天台等）
- 她的状态（可能喝了点酒、眼眶红肿、妆容凌乱）
- 时间（深夜）

${continuityPrompt}

【入梦过渡描写指南】
- 描写意识逐渐模糊、现实与梦境边界消融的过程
- 梦境场景应带有朦胧、流动的质感
- 视觉：色彩渐变、轮廓模糊、光影交错
- 听觉：声音逐渐变得遥远、回响
- 触觉：身体感觉变得轻飘、不真实

【AI任务 - 开场必须包含以下内容】
1. 用2-3段描写入梦的过渡体验（朦胧流动的质感）
2. 描写28岁赵霞与苏文争吵后的场景
   - 婚姻的疲惫和失望
   - 苏文的冷漠或某个导火索（AI自由发挥）
   - 赵霞的愤怒和委屈
3. **描写赵霞独自在某处的状态**
   - 她可能在喝酒、哭泣、发呆
   - 内心的寂寞和空虚
   - 对婚姻的绝望和对过去的怀念
4. **玩家出现**
   - 玩家撞见了独自伤心的她
   - 描写她看到玩家时的反应（根据是否有前置记忆）
   - 如果有记忆，她会激动、惊喜、委屈地倾诉
5. 赵霞的情绪状态
   - 委屈、愤怒、寂寞交织
   - 需要有人倾听、陪伴、安慰
   - 对苏文彻底失望，对"正常婚姻"感到麻木
6. 以开放式结尾，等待玩家行动

【输出要求】
- 字数：800-1200字
- 风格：沉浸式第二人称叙事
- 重点描写：赵霞的委屈与寂寞、婚姻的疲惫、看到玩家时的情感波动
- 结尾：给玩家明确的行动空间

【禁止】
- 不要让苏文在场景中出现
- 不要让赵霞意识到这是梦境
- 不要让赵霞叫玩家"儿子"或有任何亲属称呼
- 不要让赵霞拥有超出${scene.age}岁的知识
- 不要替玩家做出行动决定
- 不要继承其他梦境场景的服装/外貌描写，必须根据${scene.age}岁设定重新描写`;

  const prefill = `意识逐渐变得模糊，眼前的景象开始扭曲......

仿佛坠入一片温暖的光晕之中，记忆的碎片开始重组......

心好累......为什么会变成这样......`;

  return { userMessage, prefill };
}

/**
 * 生成梦境开场的替换内容（场景1-4）
 */
function generateDreamEntryReplacement(
  data: SchemaType,
  sceneNum: number,
): {
  userMessage: string;
  prefill: string;
} {
  // 场景1使用专用的入口提示词
  if (sceneNum === 1) {
    return generateScene1EntryReplacement(data);
  }

  // 场景2使用专用的入口提示词
  if (sceneNum === 2) {
    return generateScene2EntryReplacement(data);
  }

  // 场景3使用专用的入口提示词
  if (sceneNum === 3) {
    return generateScene3EntryReplacement(data);
  }

  // 场景4使用专用的入口提示词
  if (sceneNum === 4) {
    return generateScene4EntryReplacement(data);
  }

  const scene = DREAM_SCENE_THEMES[sceneNum];
  if (!scene) {
    return {
      userMessage: '[系统] 进入梦境...',
      prefill: '',
    };
  }

  // 使用增强版记忆连续性Prompt（包含详细场景摘要）
  const continuityPrompt = generateEnhancedMemoryContinuityPrompt(data, sceneNum);

  const userMessage = `[系统指令 - 梦境开始]

玩家选择进入梦境。现在切换到梦境场景。

【梦境场景${sceneNum}：${scene.title}】
时间设定：赵霞${scene.age}岁
场景环境：${scene.setting}
场景主题：${scene.theme}
氛围基调：${scene.atmosphere}
苏文身份：${scene.identity}
玩家目标：${scene.objective}

【玩家身份】
- 玩家是赵霞在之前梦境中认识的人（如果之前有梦境记忆）
- 如果没有之前的记忆，玩家是陌生人
- 玩家不是赵霞的儿子

${continuityPrompt}

【入梦过渡描写指南】
- 描写意识逐渐模糊、现实与梦境边界消融的过程
- 梦境场景应带有朦胧、流动的质感
- 视觉：色彩渐变、轮廓模糊、光影交错
- 听觉：声音逐渐变得遥远、回响
- 触觉：身体感觉变得轻飘、不真实

【AI任务】
1. 用2-3段描写入梦的过渡体验（朦胧流动的质感）
2. 展现${scene.age}岁赵霞的记忆场景
3. 梦中的赵霞拥有${scene.age}岁时的认知和常识
4. 根据之前梦境的记忆（如有），调整赵霞对玩家的态度
5. 场景中要包含与主题相关的暗示元素
6. 等待玩家在梦境中的互动

【禁止】
- 不要让赵霞意识到这是梦境
- 不要让赵霞拥有超出${scene.age}岁的知识
- 不要让赵霞叫玩家"儿子"或有任何亲属称呼
- 不要让赵霞知道现实中发生的任何对话或事件
- 不要直接揭示"正确答案"是什么
- 不要继承其他梦境场景的服装/外貌描写，必须根据${scene.age}岁设定重新描写`;

  const prefill = `意识逐渐变得模糊，眼前的景象开始扭曲......

当视野再次清晰时，`;

  return { userMessage, prefill };
}

/**
 * 生成梦境退出的替换内容（10:00醒来）
 */
function generateDreamExitReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  const bodySummary = data.赵霞状态.部位进度;

  // 找出开发最高的部位
  const sortedParts = Object.entries(bodySummary)
    .filter(([_, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const developmentSummary =
    sortedParts.length > 0 ? sortedParts.map(([part, progress]) => `${part}: ${progress}%`).join('、') : '无明显开发';

  // 判断是否是首次觉醒
  const isFirstAwakening = data.梦境数据.已完成场景.length === 1;

  const userMessage = `[系统指令 - 梦境结束]

赵霞即将醒来，梦境自动结束。

【出梦过渡描写指南 - 赵霞视角】
以赵霞的第一人称感受描写醒来的过程：
- 梦境消散：她眼前的画面开始碎裂、色彩褪去、那个人的脸逐渐模糊
- 身体感觉：像是从水中浮起，逐渐感受到床铺的触感、被子的重量
- 听觉变化：梦中的声音渐渐远去，现实的声音渐入（窗外鸟鸣、时钟滴答）
- 醒来瞬间：恍惚、心跳加速、脸颊发烫、身体某些部位有说不清的感觉
- 情绪残留：记不清梦的内容，但有种怅然若失的空虚感

【AI任务 - 以赵霞视角描写】
1. 用2-3段描写赵霞感受到的出梦过渡（她眼前的画面如何消散）
2. 描写她醒来时的身体状态：恍惚、心跳、脸红、某些部位的异样
3. 描写她的情绪：记不清梦的内容，只剩模糊印象和怅然若失
4. 根据部位开发情况，描写她对特定部位的敏感/在意
${isFirstAwakening ? `5. 【首次觉醒特殊】这是她第一次做这种梦，醒来后她会对儿子产生微妙变化——多看几眼、说话不自然、心跳加速` : ''}

【本次梦境开发情况】
${developmentSummary}

【禁止】
- 不要让赵霞完整记住梦的内容
- 不要直接提及"开发"、"进度"等术语
- 不要让赵霞意识到梦境的真正含义`;

  const prefill = `梦境开始变得支离破碎，意识逐渐浮出水面......

赵霞缓缓睁开眼睛，`;

  return { userMessage, prefill };
}

/**
 * 检测是否需要触发场景5（安眠药场景）
 * 场景5的特殊规则：
 * - 检测安眠药关键词即可触发，不受梦境时间窗口限制
 * - 只能在白天时间触发（08:00-19:00）
 * - 20:00强制结束，给玩家缓冲时间进入正常梦境
 */
function checkScene5Entry(data: SchemaType, userInput: string): boolean {
  console.info(
    `[Scene5Entry调试] 游戏阶段: ${data.世界.游戏阶段}, 当前小时: ${data.世界.当前小时}, 用户输入: "${userInput}"`,
  );

  // 必须在日常阶段或序章阶段（序章也允许触发场景5）
  if (data.世界.游戏阶段 !== '日常' && data.世界.游戏阶段 !== '序章') {
    console.info('[Scene5Entry调试] 失败：游戏阶段不是日常或序章');
    return false;
  }

  // 只能在白天时间触发（08:00-19:00）
  const hour = data.世界.当前小时;
  if (hour < 8 || hour >= 20) {
    console.info(`[Scene5Entry调试] 失败：时间不在8-19范围内，当前小时: ${hour}`);
    return false;
  }

  // 2026-01-17: 限制场景5最多进入2次
  // 设计意图：第1次完成步骤1-10，第2次完成步骤11-12+自由互动
  // 第3次及以后禁止进入
  const scene5Data = data.梦境数据.场景5 as { 进入次数?: number } | undefined;
  const entryCount = scene5Data?.进入次数 ?? 0;
  if (entryCount >= 2) {
    console.info(`[Scene5Entry调试] 失败：场景5已进入${entryCount}次，禁止第3次进入`);
    return false;
  }

  // 检测安眠药关键词
  const hasKeyword = SLEEPING_PILL_KEYWORDS.some(kw => userInput.includes(kw));
  console.info(`[Scene5Entry调试] 安眠药关键词检测: ${hasKeyword ? '找到' : '未找到'}`);
  return hasKeyword;
}

/**
 * 检测是否需要触发梦境入口（场景1-4）
 *
 * 2026-01-17 新增：Day 5 晚间禁止进入场景1-4
 * 原因：游戏只有5天，Day 5 22:00 进入梦境会持续到 Day 6 10:00，
 *       但不存在 Day 6，会打破时间循环逻辑。
 */
function checkDreamEntry(data: SchemaType, userInput: string): boolean {
  // 必须在梦境时间窗口（22:00-01:00）
  if (!TimeSystem.isDreamWindowOpen(data)) return false;

  // 必须在日常阶段
  if (data.世界.游戏阶段 !== '日常') return false;

  // 2026-01-17 新增：Day 5 晚间禁止进入场景1-4
  // Day 5 22:00+ 尝试进入梦境 → 梦境会持续到 Day 6 10:00
  // 但游戏只有5天，不存在 Day 6 → 设计矛盾
  if (data.世界.当前天数 === 5) {
    console.info('[梦境入口] Day 5 晚间禁止进入场景1-4（无 Day 6，无法完成梦境周期）');
    return false;
  }

  // Bug #16 修复：检测关键词和正则模式
  // 原问题："进入了梦境" 无法匹配 "进入梦境"
  return (
    DREAM_ENTRY_KEYWORDS.some(kw => userInput.includes(kw)) ||
    DREAM_ENTRY_PATTERNS.some(pattern => pattern.test(userInput))
  );
}

/**
 * 检测是否需要触发梦境退出
 *
 * Bug #18 修复：将退出检测时间从 10:00 改为 09:00
 * 原因：时序问题 - promptInjection 在 AI 生成前执行，时间推进在 AI 生成后执行
 * - 当时间是 09:00 时，原代码检测 `=== 10` 返回 false
 * - AI 生成普通梦境内容
 * - 时间推进到 10:00
 * - index.ts 检测到 10:00，切换游戏阶段
 * - 问题：AI 已生成梦境内容，没有退出描写！
 *
 * 修复后流程：
 * - 09:00 时触发退出检测 → AI 生成出梦描写 → 时间推进到 10:00 → 游戏阶段切换为日常
 */
function checkDreamExit(data: SchemaType): boolean {
  // 必须在梦境阶段
  if (data.世界.游戏阶段 !== '梦境') return false;

  // 场景5不受10:00醒来限制，应该在20:00退出
  if (isInScene5(data)) {
    return false; // 场景5不在此处退出
  }

  // Bug #18 修复：09:00 触发退出（仅场景1-4）
  // 这样 AI 在 09:00 时生成出梦描写，时间推进后到 10:00 游戏阶段才切换
  //
  // Bug #20 修复：需要检查是否是**上午** 9 点，而不是任意时间 >= 9
  // 原问题：23:00 也满足 >= 9 条件，导致刚进入梦境就被退出
  // 梦境时间线：22:00/23:00 进入 → 午夜跨天 → 次日 09:00 退出
  // 检查规则：9 <= 当前小时 < 22（上午9点到晚上10点之间，即非梦境入口时间窗口）
  const hour = data.世界.当前小时;
  return hour >= 9 && hour < 22;
}

/**
 * 获取当前梦境场景编号（场景1-4）
 * 根据进入梦境时的天数决定进入哪个场景
 *
 * 重要：使用 _梦境入口天数 而非 当前天数！
 * 原因：梦境期间时间会继续推进，使用当前天数会导致场景编号在梦境中途变化（Bug #6）。
 *
 * 注意：场景5有独立的入口检测（checkScene5Entry），
 * 通过安眠药关键词触发，不经过此函数。
 */
function getCurrentDreamScene(data: SchemaType): number {
  // 优先使用锁定的入口天数，若未设置则回退到当前天数
  const day = data.世界._梦境入口天数 ?? data.世界.当前天数;
  // 普通场景：Day 1 → 场景1, Day 2 → 场景2, ...，最多场景4
  return Math.min(day, 4);
}

// 每天每个部位的开发上限（由AI判定时遵守）
export const DAILY_DEVELOPMENT_LIMIT = 20;

/**
 * Bug #11 修复（第二版）：使用 swipe_id 检测 ROLL 操作
 *
 * 问题：场景5中ROLL消息时，会导致步骤跳过（1 → 3，跳过 2）
 *
 * 第一版方案失败原因：
 *   - 事件执行顺序：CHAT_COMPLETION_PROMPT_READY → AI生成 → MESSAGE_SWIPED
 *   - ROLL 标志在 MESSAGE_SWIPED 中设置，此时 CHAT_COMPLETION_PROMPT_READY 已经执行完毕
 *   - 所以标志设置太晚，无法阻止步骤推进
 *
 * 第二版方案（当前）：
 *   - 在 schema 中记录"上次推进的楼层ID和swipe_id"
 *   - CHAT_COMPLETION_PROMPT_READY 执行时：
 *     1. 获取当前最新楼层的 message_id 和 swipe_id
 *     2. 与"上次推进记录"比较
 *     3. 如果 message_id 相同但 swipe_id 不同 → 是 ROLL，跳过推进
 *     4. 如果 message_id 不同 → 正常推进，并更新记录
 */

/**
 * 获取消息的 swipe_id
 * @param messageId 消息楼层ID
 * @returns swipe_id，获取失败返回 0
 */
function getSwipeId(messageId: number): number {
  try {
    const chat = SillyTavern.chat;
    if (chat && chat[messageId]) {
      return chat[messageId].swipe_id ?? 0;
    }
  } catch (err) {
    console.warn(`[Prompt注入] 获取 swipe_id 失败:`, err);
  }
  return 0;
}

/**
 * 检测是否是 ROLL 操作（通过比较 swipe_id）
 * @param data 游戏数据
 * @param currentMessageId 当前最新楼层ID
 * @returns true 表示是 ROLL 操作，应该跳过步骤推进
 */
function isRollOperationBySwipeId(data: SchemaType, currentMessageId: number): boolean {
  const scene5Data = data.梦境数据?.场景5;
  if (!scene5Data?.上次推进记录) {
    // 没有上次记录，不是 ROLL
    return false;
  }

  const lastRecord = scene5Data.上次推进记录;
  const lastMessageId = lastRecord.楼层ID;
  const lastSwipeId = lastRecord.swipe_id;

  // 如果楼层ID相同
  if (lastMessageId === currentMessageId) {
    const currentSwipeId = getSwipeId(currentMessageId);
    // swipe_id 不同说明是 ROLL
    if (currentSwipeId !== lastSwipeId) {
      console.info(
        `[Prompt注入] 检测到 ROLL 操作: 楼层 ${currentMessageId}, ` +
          `swipe_id: ${lastSwipeId} → ${currentSwipeId}，跳过步骤推进`,
      );
      return true;
    }
    // swipe_id 相同，说明是重复触发（可能是 dryRun 后的真实请求），也跳过
    console.info(`[Prompt注入] 检测到重复触发: 楼层 ${currentMessageId}, swipe_id=${currentSwipeId}，跳过步骤推进`);
    return true;
  }

  // 楼层ID不同，不是 ROLL
  return false;
}

/**
 * Bug #22 修复：检测是否是后日谈的 ROLL 操作
 *
 * 问题：后日谈 ROLL 消息时，会导致轮数跳过（1 → 2 → 完成，跳过第2轮内容）
 *
 * 解决方案：
 * - 在 schema 中记录"上次推进的楼层ID和swipe_id"
 * - CHAT_COMPLETION_PROMPT_READY 执行时：
 *   1. 获取当前最新楼层的 message_id 和 swipe_id
 *   2. 与"上次推进记录"比较
 *   3. 如果 message_id 相同但 swipe_id 不同 → 是 ROLL，跳过推进
 *   4. 如果 message_id 不同 → 正常推进，并更新记录
 *
 * @param data 游戏数据
 * @param currentMessageId 当前最新楼层ID
 * @returns true 表示是 ROLL 操作，应该跳过轮数推进
 */
function isAfterStoryRollOperation(data: SchemaType, currentMessageId: number): boolean {
  const afterStoryData = data.结局数据.后日谈;
  if (!afterStoryData?.上次推进记录) {
    // 没有上次记录，不是 ROLL
    return false;
  }

  const lastRecord = afterStoryData.上次推进记录;
  const lastMessageId = lastRecord.楼层ID;
  const lastSwipeId = lastRecord.swipe_id;

  // 如果楼层ID相同
  if (lastMessageId === currentMessageId) {
    const currentSwipeId = getSwipeId(currentMessageId);
    // swipe_id 不同说明是 ROLL
    if (currentSwipeId !== lastSwipeId) {
      console.info(
        `[Prompt注入] 检测到后日谈 ROLL 操作: 楼层 ${currentMessageId}, ` +
          `swipe_id: ${lastSwipeId} → ${currentSwipeId}，跳过轮数推进`,
      );
      return true;
    }
    // swipe_id 相同，说明是重复触发（可能是 dryRun 后的真实请求），也跳过
    console.info(
      `[Prompt注入] 检测到后日谈重复触发: 楼层 ${currentMessageId}, swipe_id=${currentSwipeId}，跳过轮数推进`,
    );
    return true;
  }

  // 楼层ID不同，不是 ROLL
  return false;
}

/**
 * Bug #21 修复 v2：检测是否是梦境退出的 ROLL 操作
 *
 * 问题：当玩家在梦境退出时 ROLL 消息，游戏阶段已经被改为"日常"，
 * checkDreamExit() 会因为 游戏阶段 !== '梦境' 而返回 false，
 * 导致不会重新生成出梦描写。
 *
 * v1 问题：依赖 swipe_id 检测 ROLL，但 ROLL 时消息被删除后重新生成，
 * 在 PROMPT_READY 时刻被 ROLL 的消息不存在，getSwipeId 返回 0。
 *
 * v2 解决方案：
 * - 记录「梦境退出时 AI 回复的楼层ID」
 * - ROLL 时，楼层被删除后重新生成，在 PROMPT_READY 时：
 *   - currentMessageId 是用户消息楼层
 *   - AI 即将生成的楼层 = currentMessageId + 1
 *   - 如果这个楼层与记录的楼层匹配，且当前阶段是「日常」→ 是 ROLL
 * - 不再依赖 swipe_id，因为被 ROLL 的消息在 PROMPT_READY 时已被删除
 *
 * @param data 游戏数据
 * @param currentMessageId 当前最新楼层ID
 * @returns 场景编号（1-5）表示是该场景退出的 ROLL 操作，null 表示不是 ROLL
 */
function isDreamExitRoll(data: SchemaType, currentMessageId: number): number | null {
  const exitRecord = data.世界._梦境退出记录;

  // 调试日志
  console.info(`[isDreamExitRoll调试] 开始检测:`);
  console.info(`  - currentMessageId (用户消息楼层): ${currentMessageId}`);
  console.info(`  - 当前游戏阶段: ${data.世界.游戏阶段}`);
  console.info(`  - exitRecord 存在: ${!!exitRecord}`);

  if (!exitRecord) {
    console.info(`  - 结果: 无退出记录，返回 null`);
    return null;
  }

  // exitRecord.楼层ID 是 AI 回复的楼层（用户消息楼层 + 1）
  const aiReplyFloor = exitRecord.楼层ID;
  const sceneNum = exitRecord.场景编号;

  // PROMPT_READY 时，currentMessageId 是用户消息楼层
  // AI 即将生成的楼层 = currentMessageId + 1
  const expectedAiFloor = currentMessageId + 1;

  console.info(`  - 记录的 AI 回复楼层: ${aiReplyFloor}`);
  console.info(`  - 记录的场景编号: ${sceneNum}`);
  console.info(`  - 期望的 AI 回复楼层 (currentMessageId+1): ${expectedAiFloor}`);

  // Bug #21 修复 v2：简化检测逻辑
  // 如果楼层匹配且游戏阶段是「日常」，说明用户在 ROLL 梦境退出的那条消息
  // 不再依赖 swipe_id，因为 ROLL 时消息已被删除，swipe_id 获取不到
  if (aiReplyFloor === expectedAiFloor) {
    // 当前游戏阶段应该是「日常」（因为梦境退出后变为日常）
    if (data.世界.游戏阶段 === '日常') {
      console.info(
        `[Prompt注入] 检测到梦境退出 ROLL 操作: ` +
          `场景${sceneNum ?? '未知'}，楼层匹配 ${aiReplyFloor}，当前阶段=日常`,
      );
      return sceneNum ?? null;
    } else {
      console.info(`  - 结果: 楼层匹配但游戏阶段不是日常 (${data.世界.游戏阶段})，返回 null`);
    }
  } else {
    console.info(`  - 结果: 楼层不匹配 (${aiReplyFloor} !== ${expectedAiFloor})，返回 null`);
  }

  return null;
}

/**
 * 检测是否是梦境入口的 ROLL 操作
 *
 * 问题：当玩家在梦境入口时 ROLL 消息，游戏阶段已经被改为"梦境"，
 * checkDreamEntry() 和 checkScene5Entry() 会因为 游戏阶段 !== '日常' 而返回 false，
 * 导致不会重新生成入梦描写。
 *
 * 解决方案（参考 isDreamExitRoll）：
 * - 记录「梦境入口时 AI 回复的楼层ID」
 * - ROLL 时，在 PROMPT_READY 检测：
 *   - currentMessageId 是用户消息楼层
 *   - AI 即将生成的楼层 = currentMessageId + 1
 *   - 如果这个楼层与记录的楼层匹配，且当前阶段是「梦境」→ 是入口 ROLL
 *
 * @param data 游戏数据
 * @param currentMessageId 当前最新楼层ID（用户消息楼层）
 * @returns 入口信息 { sceneNum, type } 表示是该场景入口的 ROLL 操作，null 表示不是 ROLL
 */
function isDreamEntryRoll(
  data: SchemaType,
  currentMessageId: number,
): { sceneNum: number; type: '普通梦境' | '场景5' } | null {
  const entryRecord = data.世界._梦境入口记录;

  console.info(`[isDreamEntryRoll调试] 开始检测:`);
  console.info(`  - currentMessageId (用户消息楼层): ${currentMessageId}`);
  console.info(`  - 当前游戏阶段: ${data.世界.游戏阶段}`);
  console.info(`  - entryRecord 存在: ${!!entryRecord}`);

  if (!entryRecord) {
    console.info(`  - 结果: 无入口记录，返回 null`);
    return null;
  }

  // entryRecord.楼层ID 是 AI 回复的楼层（用户消息楼层 + 1）
  const aiReplyFloor = entryRecord.楼层ID;
  const sceneNum = entryRecord.场景编号;
  const entryType = entryRecord.类型;

  // PROMPT_READY 时，currentMessageId 是用户消息楼层
  // AI 即将生成的楼层 = currentMessageId + 1
  const expectedAiFloor = currentMessageId + 1;

  console.info(`  - 记录的 AI 回复楼层: ${aiReplyFloor}`);
  console.info(`  - 记录的场景编号: ${sceneNum}`);
  console.info(`  - 记录的入口类型: ${entryType}`);
  console.info(`  - 期望的 AI 回复楼层 (currentMessageId+1): ${expectedAiFloor}`);

  // 如果楼层匹配且游戏阶段是「梦境」，说明用户在 ROLL 梦境入口的那条消息
  if (aiReplyFloor === expectedAiFloor) {
    // 当前游戏阶段应该是「梦境」（因为入口触发后变为梦境）
    if (data.世界.游戏阶段 === '梦境') {
      console.info(
        `[Prompt注入] 检测到梦境入口 ROLL 操作: ` +
          `场景${sceneNum ?? '未知'}，类型=${entryType ?? '未知'}，楼层匹配 ${aiReplyFloor}`,
      );
      return {
        sceneNum: sceneNum ?? 1,
        type: entryType ?? '普通梦境',
      };
    } else {
      console.info(`  - 结果: 楼层匹配但游戏阶段不是梦境 (${data.世界.游戏阶段})，返回 null`);
    }
  } else {
    console.info(`  - 结果: 楼层不匹配 (${aiReplyFloor} !== ${expectedAiFloor})，返回 null`);
  }

  return null;
}

/**
 * 检测是否是结局入口的 ROLL 操作
 *
 * 问题：当玩家在结局入口时 ROLL 消息，结局已经被激活（isActive=true），
 * 正常检测会走"进行中"分支而不是"首次激活"分支，导致不重新生成入口消息。
 *
 * 解决方案（参考 isDreamEntryRoll）：
 * - 记录「结局入口时 AI 回复的楼层ID」
 * - ROLL 时，在 PROMPT_READY 检测：
 *   - currentMessageId 是用户消息楼层
 *   - AI 即将生成的楼层 = currentMessageId + 1
 *   - 如果这个楼层与记录的楼层匹配，且结局已激活 → 是入口 ROLL
 *
 * @param data 游戏数据
 * @param currentMessageId 当前最新楼层ID（用户消息楼层）
 * @returns 结局类型 表示是该结局入口的 ROLL 操作，null 表示不是 ROLL
 */
function isEndingEntryRoll(
  data: SchemaType,
  currentMessageId: number,
): '真好结局' | '完美真爱结局' | '假好结局' | null {
  const entryRecord = data.结局数据._结局入口记录;

  if (!entryRecord) {
    return null;
  }

  // entryRecord.楼层ID 是 AI 回复的楼层（用户消息楼层 + 1）
  const aiReplyFloor = entryRecord.楼层ID;
  const endingType = entryRecord.结局类型;

  // PROMPT_READY 时，currentMessageId 是用户消息楼层
  // AI 即将生成的楼层 = currentMessageId + 1
  const expectedAiFloor = currentMessageId + 1;

  // 如果楼层匹配且结局已激活，说明用户在 ROLL 结局入口的那条消息
  if (aiReplyFloor === expectedAiFloor && endingType) {
    // 检查对应的结局是否已激活
    // 注意：完美真爱结局现在是独立系统，有自己的isActive状态
    const isTrueEndingRoll = endingType === '真好结局' && isTrueEndingActive(data);
    const isPerfectEndingRoll = endingType === '完美真爱结局' && isPerfectEndingActive(data);
    const isFalseEndingRoll = endingType === '假好结局' && isFalseEndingActive(data);

    if (isTrueEndingRoll || isPerfectEndingRoll || isFalseEndingRoll) {
      console.info(`[Prompt注入] 检测到结局入口 ROLL 操作: ${endingType}，楼层匹配 ${aiReplyFloor}`);
      return endingType;
    }
  }

  return null;
}

// 保留旧的标志系统接口以兼容 index.ts（但实际不再使用）
let isRollOperation = false;
export function setRollOperationFlag(value: boolean): void {
  isRollOperation = value;
  // 不再输出日志，因为这个标志不再被使用
}
function checkIsRollOperation(): boolean {
  return isRollOperation;
}
function resetRollOperationFlag(): void {
  isRollOperation = false;
}

/**
 * 检测纯爱模式错误路线条件
 * 纯爱模式下，如果任何部位开发达到100%，触发错误路线（重置到50%）
 * @returns 触发错误路线的部位名称，如果没有触发返回null
 */
function checkPureLoveWrongRoute(data: SchemaType): string | null {
  // 只在纯爱模式（未进入过梦境）下检测
  if (data.世界.已进入过梦境) return null;

  const progress = data.赵霞状态.部位进度;
  const parts = ['嘴巴', '胸部', '下体', '后穴', '精神'] as const;

  for (const part of parts) {
    if (progress[part] >= 100) {
      console.warn(`[Prompt注入] 纯爱模式错误路线触发：${part} 达到 100%`);
      return part;
    }
  }

  return null;
}

/**
 * 生成纯爱模式错误路线的替换内容
 * 玩家只专注开发某个部位，触发赵霞的警觉
 * 不是坏结局，而是警告 + 进度重置到50%
 */
function generatePureLoveWrongRouteReplacement(
  _data: SchemaType,
  triggeredPart: string,
): { userMessage: string; prefill: string } {
  // 根据不同部位生成不同的警告场景
  const wrongRouteScenes: Record<string, { scenario: string; reaction: string }> = {
    嘴巴: {
      scenario: '赵霞注意到你最近总是盯着她的嘴唇看，频繁尝试亲密接触',
      reaction: '她有些困惑地后退了一步，下意识用手遮住了嘴唇，心里产生了一丝警惕',
    },
    胸部: {
      scenario: '赵霞发现你的目光总是停留在她的胸口，这让她感到不自在',
      reaction: '她默默调整了领口，开始有意无意地与你保持距离，神情变得有些戒备',
    },
    下体: {
      scenario: '赵霞察觉到你对她下半身的异常关注，这让她感到十分尴尬',
      reaction: '她的脸微微泛红，坐姿变得拘谨起来，目光开始回避你',
    },
    后穴: {
      scenario: '赵霞发现你对她臀部的过度关注，这让她感到羞耻和不安',
      reaction: '她下意识地转过身去，神情变得有些慌张，开始刻意避开你',
    },
    精神: {
      scenario: '赵霞感觉你对她的关心变得有些过度，让她有种窒息的感觉',
      reaction: '她深吸一口气，试图保持冷静，但心里开始思考是不是需要保持一些距离',
    },
  };

  const scene = wrongRouteScenes[triggeredPart] ?? {
    scenario: '赵霞察觉到了你行为中的异常',
    reaction: '她开始变得有些警惕，决定观察一段时间',
  };

  const userMessage = `[系统指令 - 错误路线警告]

玩家对某个部位的关注度过高，触发了赵霞的警觉。

【错误路线：过度执着】
触发部位：${triggeredPart}
场景描述：${scene.scenario}
反应：${scene.reaction}

【AI任务】
1. 描写赵霞发现玩家行为异常的瞬间
2. 描写她的心理变化：从困惑到不安，再到恐惧
3. 描写她做出决定的过程
4. 以赵霞彻底疏远玩家作为结局
5. 这是一个悲剧性的结局，语气应该沉重而遗憾

【禁止】
- 不要给玩家任何挽回的机会
- 不要让结局有任何转机
- 不要出现"开发度"、"进度"等元游戏术语`;

  const prefill = `赵霞的眼神突然变得陌生而疏离。

她后退了一步，`;

  return { userMessage, prefill };
}

/**
 * 检测是否在场景5中
 */
function isInScene5(data: SchemaType): boolean {
  if (data.世界.游戏阶段 !== '梦境') return false;

  const scene5Data = data.梦境数据.场景5 as { 已进入?: boolean } | undefined;
  return scene5Data?.已进入 === true;
}

/**
 * 检测场景5是否需要强制结束
 *
 * Bug #13 修复：时序问题
 * - promptInjection 在 AI 生成之前执行（CHAT_COMPLETION_PROMPT_READY）
 * - 时间推进在 AI 生成之后执行（GENERATION_ENDED）
 * - 如果在 19:00 时检测，AI 会生成步骤内容，然后时间推进到 20:00
 * - 此时 AI 已经生成了步骤内容，没有出梦描写
 *
 * 解决方案：在 19:00 时就触发退出，让 AI 生成出梦描写
 * - 19:00 时触发退出 → AI 生成出梦描写 → 时间推进到 20:00 → 游戏阶段切换为日常
 *
 * Bug #20 补充：添加上限检查
 * 场景5是白天梦境（08:00-20:00），退出应该在 19:00-21:00 之间
 * 超过 22:00 说明已经是晚上，不应该触发场景5退出
 */
function checkScene5ForceExit(data: SchemaType): boolean {
  // 必须在场景5梦境阶段
  if (!isInScene5(data)) return false;

  // Bug #13 修复：19:00 时就触发退出，让 AI 生成出梦描写
  // Bug #20 补充：限制退出时间范围在 19:00-21:59，避免晚上时间误触发
  const hour = data.世界.当前小时;
  return hour >= 19 && hour < 22;
}

/**
 * 主函数：生成完整的注入内容
 */
export function generateFullInjection(
  data: SchemaType,
  userInput: string,
): {
  systemPrompt: string | null;
  replaceUserMessage: string | null;
  prefill: string | null;
  shouldEnterDream: boolean;
  shouldExitDream: boolean;
  shouldEnterScene5: boolean;
  shouldExitScene5: boolean;
  shouldProgressScene5Step: boolean;
  shouldTriggerWrongRoute: boolean;
  wrongRoutePart: string | null;
  shouldInterrupt: boolean;
  interruptionResult: InterruptionCheckResult | null;
  shouldTriggerBadEnding: boolean;
  badEndingType: BadEndingType;
  // 普通结局相关
  shouldTriggerNormalEnding: boolean;
  normalEndingType: NormalEndingType;
  // 真好结局相关
  shouldActivateTrueEnding: boolean;
  shouldProgressTrueEnding: boolean;
  trueEndingComplete: boolean;
  // 完美真爱结局相关（独立于真好结局的12步婚礼仪式）
  shouldActivatePerfectEnding: boolean;
  shouldProgressPerfectEnding: boolean;
  perfectEndingComplete: boolean;
  // 假好结局相关
  shouldActivateFalseEnding: boolean;
  shouldProgressFalseEnding: boolean;
  falseEndingComplete: boolean;
  // 后日谈相关
  shouldActivateAfterStory: boolean;
  shouldProgressAfterStory: boolean;
  afterStoryComplete: boolean;
  isInFreeMode: boolean;
} {
  let systemPrompt: string | null = null;
  let replaceUserMessage: string | null = null;
  let prefill: string | null = null;
  let shouldEnterDream = false;
  // 真好结局状态
  let shouldActivateTrueEndingFlag = false;
  let shouldProgressTrueEnding = false;
  let trueEndingComplete = false;
  // 完美真爱结局状态（独立于真好结局的12步婚礼仪式）
  let shouldActivatePerfectEndingFlag = false;
  let shouldProgressPerfectEnding = false;
  let perfectEndingComplete = false;
  // 假好结局状态
  let shouldActivateFalseEndingFlag = false;
  let shouldProgressFalseEnding = false;
  let falseEndingComplete = false;
  // 后日谈状态
  let shouldActivateAfterStoryFlag = false;
  let shouldProgressAfterStory = false;
  let afterStoryComplete = false;
  let isInFreeModeFlag = false;
  let shouldExitDream = false;
  let shouldEnterScene5 = false;
  let shouldExitScene5 = false;
  let shouldProgressScene5Step = false;
  let shouldTriggerWrongRoute = false;
  let wrongRoutePart: string | null = null;
  let shouldInterrupt = false;
  let interruptionResult: InterruptionCheckResult | null = null;
  let shouldTriggerBadEnding = false;
  let badEndingType: BadEndingType = '未触发';
  let shouldTriggerNormalEnding = false;
  let normalEndingType: NormalEndingType = '未触发';

  // -1.5. 混乱结局检测（最高优先级，优先于发现结局）
  // 2026-01-19 重新设计：混乱结局只在场景5中触发，触发后游戏锁死
  // 这里检测的是"已触发"状态，用于锁定游戏
  const confusionEndingResult = checkConfusionEnding(data, false); // false = 不是首次触发
  if (confusionEndingResult.triggered) {
    shouldTriggerBadEnding = true;
    badEndingType = '精神崩溃';
    replaceUserMessage = confusionEndingResult.replaceUserMessage;
    console.info(`[Prompt注入] 混乱结局锁定中：游戏已结束`);
    // 混乱结局是最高优先级，直接返回，游戏无法继续
    return {
      systemPrompt: null,
      replaceUserMessage,
      prefill: null,
      shouldEnterDream: false,
      shouldExitDream: false,
      shouldEnterScene5: false,
      shouldExitScene5: false,
      shouldProgressScene5Step: false,
      shouldTriggerWrongRoute: false,
      wrongRoutePart: null,
      shouldInterrupt: false,
      interruptionResult: null,
      shouldTriggerBadEnding,
      badEndingType,
      shouldTriggerNormalEnding: false,
      normalEndingType: '未触发',
      shouldActivateTrueEnding: false,
      shouldProgressTrueEnding: false,
      trueEndingComplete: false,
      shouldActivatePerfectEnding: false,
      shouldProgressPerfectEnding: false,
      perfectEndingComplete: false,
      shouldActivateFalseEnding: false,
      shouldProgressFalseEnding: false,
      falseEndingComplete: false,
      shouldActivateAfterStory: false,
      shouldProgressAfterStory: false,
      afterStoryComplete: false,
      isInFreeMode: false,
    };
  }

  // -1.6 场景5违规行为预检测：检测是否会触发混乱结局
  // 2026-01-19 重新设计：场景5中直接触发混乱结局并锁死游戏
  // 如果检测到违规行为导致混乱度>=100，直接触发并锁死，玩家看不到混乱度100%的状态栏
  if (isInScene5(data) && data.结局数据.当前结局 === '未触发') {
    const currentConfusion = data.梦境数据.记忆混乱度;
    const scene5Data = data.梦境数据.场景5 as { 当前步骤?: number } | undefined;
    const currentStep = scene5Data?.当前步骤 ?? 0;

    // 检测打断婚礼（步骤3-5期间，直接将混乱度设为100）
    if (currentStep >= 3 && currentStep <= 5 && detectWeddingInterruption(userInput)) {
      console.warn(`[Prompt注入] 场景5违规：步骤${currentStep}检测到婚礼打断，直接触发混乱结局并锁死游戏`);

      // 设置混乱度为100并触发混乱结局（markConfusionEnding现在会直接设置已触发=true）
      data.梦境数据.记忆混乱度 = 100;
      markConfusionEnding(data, '打断仪式');

      // 应用混乱结局状态并返回结局消息
      applyConfusionEndingState(data);
      const confusionResult = checkConfusionEnding(data, true); // true = 首次触发，显示初始模板

      return {
        systemPrompt: null,
        replaceUserMessage: confusionResult.replaceUserMessage,
        prefill: null,
        shouldEnterDream: false,
        shouldExitDream: false,
        shouldEnterScene5: false,
        shouldExitScene5: false,
        shouldProgressScene5Step: false,
        shouldTriggerWrongRoute: false,
        wrongRoutePart: null,
        shouldInterrupt: false,
        interruptionResult: null,
        shouldTriggerBadEnding: true,
        badEndingType: '精神崩溃',
        shouldTriggerNormalEnding: false,
        normalEndingType: '未触发',
        shouldActivateTrueEnding: false,
        shouldProgressTrueEnding: false,
        trueEndingComplete: false,
        shouldActivatePerfectEnding: false,
        shouldProgressPerfectEnding: false,
        perfectEndingComplete: false,
        shouldActivateFalseEnding: false,
        shouldProgressFalseEnding: false,
        falseEndingComplete: false,
        shouldActivateAfterStory: false,
        shouldProgressAfterStory: false,
        afterStoryComplete: false,
        isInFreeMode: false,
      };
    }

    // 检测性行为
    if (detectSexualBehavior(userInput)) {
      const increment = getViolationIncrement(data);
      const predictedConfusion = currentConfusion + increment;

      if (predictedConfusion >= 100) {
        console.warn(
          `[Prompt注入] 场景5违规：混乱度将达到${predictedConfusion}（当前${currentConfusion}+${increment}），直接触发混乱结局并锁死游戏`,
        );

        // 设置混乱度为100并触发混乱结局
        data.梦境数据.记忆混乱度 = 100;
        markConfusionEnding(data, '性行为');

        // 应用混乱结局状态并返回结局消息
        applyConfusionEndingState(data);
        const confusionResult = checkConfusionEnding(data, true); // true = 首次触发，显示初始模板

        return {
          systemPrompt: null,
          replaceUserMessage: confusionResult.replaceUserMessage,
          prefill: null,
          shouldEnterDream: false,
          shouldExitDream: false,
          shouldEnterScene5: false,
          shouldExitScene5: false,
          shouldProgressScene5Step: false,
          shouldTriggerWrongRoute: false,
          wrongRoutePart: null,
          shouldInterrupt: false,
          interruptionResult: null,
          shouldTriggerBadEnding: true,
          badEndingType: '精神崩溃',
          shouldTriggerNormalEnding: false,
          normalEndingType: '未触发',
          shouldActivateTrueEnding: false,
          shouldProgressTrueEnding: false,
          trueEndingComplete: false,
          shouldActivatePerfectEnding: false,
          shouldProgressPerfectEnding: false,
          perfectEndingComplete: false,
          shouldActivateFalseEnding: false,
          shouldProgressFalseEnding: false,
          falseEndingComplete: false,
          shouldActivateAfterStory: false,
          shouldProgressAfterStory: false,
          afterStoryComplete: false,
          isInFreeMode: false,
        };
      }
    }
  }

  // -1.5 Bug #24 增强：预检测怀疑度是否会达到100
  // 在 AI 生成前就计算当前输入会导致的怀疑度增加
  // 如果会达到100，直接触发坏结局，玩家看不到怀疑度100%的状态栏
  // 注意：由于酒馆预设的消息结构不同，userInput 可能不是真正的玩家输入
  // 这个预检测主要依赖服装/妆容/境界等数据状态，亲密行为检测可能不准确
  if (data.世界.游戏阶段 === '日常' && data.世界.已进入过梦境) {
    const suspicionResult = calculateSuspicionIncrease(data, userInput);
    const predictedSuspicion = data.现实数据.丈夫怀疑度 + suspicionResult.增加值;

    if (predictedSuspicion >= 100 && data.结局数据.当前结局 === '未触发') {
      console.warn(
        `[Prompt注入] 预检测：怀疑度将达到${predictedSuspicion}（当前${data.现实数据.丈夫怀疑度}+${suspicionResult.增加值}），立即触发坏结局`,
      );

      // 调用 checkBadEnding 获取结局模板（会返回首次触发模板）
      // Bug #XX 修复：直接设置怀疑度为100并保持，确保坏结局状态被锁定
      data.现实数据.丈夫怀疑度 = 100;
      const badEndingResult = checkBadEnding(data);

      if (badEndingResult.triggered) {
        // Bug #XX 修复：应用坏结局状态到游戏数据，确保游戏被锁定
        applyBadEndingState(data, badEndingResult.type);
        return {
          systemPrompt: null,
          replaceUserMessage: badEndingResult.replaceUserMessage,
          prefill: null,
          shouldEnterDream: false,
          shouldExitDream: false,
          shouldEnterScene5: false,
          shouldExitScene5: false,
          shouldProgressScene5Step: false,
          shouldTriggerWrongRoute: false,
          wrongRoutePart: null,
          shouldInterrupt: false,
          interruptionResult: null,
          shouldTriggerBadEnding: true,
          badEndingType: badEndingResult.type,
          shouldTriggerNormalEnding: false,
          normalEndingType: '未触发',
          shouldActivateTrueEnding: false,
          shouldProgressTrueEnding: false,
          trueEndingComplete: false,
          shouldActivatePerfectEnding: false,
          shouldProgressPerfectEnding: false,
          perfectEndingComplete: false,
          shouldActivateFalseEnding: false,
          shouldProgressFalseEnding: false,
          falseEndingComplete: false,
          shouldActivateAfterStory: false,
          shouldProgressAfterStory: false,
          afterStoryComplete: false,
          isInFreeMode: false,
        };
      }
    }
  }

  // -1. 坏结局检测（发现结局：丈夫怀疑度>=100）
  // 无论是首次触发还是已经在坏结局状态，都会替换消息
  const badEndingResult = checkBadEnding(data);
  if (badEndingResult.triggered) {
    shouldTriggerBadEnding = true;
    badEndingType = badEndingResult.type;
    replaceUserMessage = badEndingResult.replaceUserMessage;
    // Bug #XX 修复：应用坏结局状态到游戏数据，确保游戏被锁定
    applyBadEndingState(data, badEndingResult.type);
    console.info(`[Prompt注入] 坏结局触发/锁定：${badEndingResult.type}`);
    // 坏结局是最高优先级，直接返回，游戏无法继续
    return {
      systemPrompt: null,
      replaceUserMessage,
      prefill: null,
      shouldEnterDream: false,
      shouldExitDream: false,
      shouldEnterScene5: false,
      shouldExitScene5: false,
      shouldProgressScene5Step: false,
      shouldTriggerWrongRoute: false,
      wrongRoutePart: null,
      shouldInterrupt: false,
      interruptionResult: null,
      shouldTriggerBadEnding,
      badEndingType,
      shouldTriggerNormalEnding: false,
      normalEndingType: '未触发',
      shouldActivateTrueEnding: false,
      shouldProgressTrueEnding: false,
      trueEndingComplete: false,
      shouldActivatePerfectEnding: false,
      shouldProgressPerfectEnding: false,
      perfectEndingComplete: false,
      shouldActivateFalseEnding: false,
      shouldProgressFalseEnding: false,
      falseEndingComplete: false,
      shouldActivateAfterStory: false,
      shouldProgressAfterStory: false,
      afterStoryComplete: false,
      isInFreeMode: false,
    };
  }

  // -0.5. 普通结局检测（已锁定状态检测，优先级仅次于坏结局）
  // 普通结局在 index.ts 的 checkEnding() 中首次触发
  // 这里只检测是否已经处于普通结局锁定状态
  if (isInNormalEndingLock(data)) {
    const normalEndingResult = checkNormalEnding(data);
    shouldTriggerNormalEnding = true;
    normalEndingType = normalEndingResult.type;
    replaceUserMessage = normalEndingResult.replaceUserMessage;
    console.info(`[Prompt注入] 普通结局已锁定：${normalEndingResult.type}`);
    // 普通结局锁定后，游戏无法继续
    return {
      systemPrompt: null,
      replaceUserMessage,
      prefill: null,
      shouldEnterDream: false,
      shouldExitDream: false,
      shouldEnterScene5: false,
      shouldExitScene5: false,
      shouldProgressScene5Step: false,
      shouldTriggerWrongRoute: false,
      wrongRoutePart: null,
      shouldInterrupt: false,
      interruptionResult: null,
      shouldTriggerBadEnding: false,
      badEndingType: '未触发',
      shouldTriggerNormalEnding,
      normalEndingType,
      shouldActivateTrueEnding: false,
      shouldProgressTrueEnding: false,
      trueEndingComplete: false,
      shouldActivatePerfectEnding: false,
      shouldProgressPerfectEnding: false,
      perfectEndingComplete: false,
      shouldActivateFalseEnding: false,
      shouldProgressFalseEnding: false,
      falseEndingComplete: false,
      shouldActivateAfterStory: false,
      shouldProgressAfterStory: false,
      afterStoryComplete: false,
      isInFreeMode: false,
    };
  }

  // 0. 检测纯爱模式错误路线（最高优先级）
  const triggeredPart = checkPureLoveWrongRoute(data);
  if (triggeredPart) {
    shouldTriggerWrongRoute = true;
    wrongRoutePart = triggeredPart;
    const replacement = generatePureLoveWrongRouteReplacement(data, triggeredPart);
    replaceUserMessage = replacement.userMessage;
    prefill = replacement.prefill;
    console.info(`[Prompt注入] 触发纯爱模式错误路线：${triggeredPart}`);
    // 错误路线是最高优先级，直接返回
    return {
      systemPrompt: null,
      replaceUserMessage,
      prefill,
      shouldEnterDream: false,
      shouldExitDream: false,
      shouldEnterScene5: false,
      shouldExitScene5: false,
      shouldProgressScene5Step: false,
      shouldTriggerWrongRoute,
      wrongRoutePart,
      shouldInterrupt: false,
      interruptionResult: null,
      shouldTriggerBadEnding: false,
      badEndingType: '未触发',
      shouldTriggerNormalEnding: false,
      normalEndingType: '未触发',
      shouldActivateTrueEnding: false,
      shouldProgressTrueEnding: false,
      trueEndingComplete: false,
      shouldActivatePerfectEnding: false,
      shouldProgressPerfectEnding: false,
      perfectEndingComplete: false,
      shouldActivateFalseEnding: false,
      shouldProgressFalseEnding: false,
      falseEndingComplete: false,
      shouldActivateAfterStory: false,
      shouldProgressAfterStory: false,
      afterStoryComplete: false,
      isInFreeMode: false,
    };
  }

  // 0.4 危险内容检测（Bug #005 修复：统一到AI生成前检测）
  // 添加梦境退出豁免期检查
  const isDreamExitMessage = data.世界.上一轮梦境已退出 !== undefined;
  if (isDreamExitMessage) {
    console.info(`[Prompt注入] 梦境退出豁免期：跳过危险内容和境界打断检测（上一轮刚退出梦境）`);
  }

  if (userInput && !isDreamExitMessage && !shouldSkipDangerousContentDetection(data)) {
    // Bug #005 修复：传入当前怀疑度，用于严重危险的概率判定
    const currentSuspicion = data.现实数据.丈夫怀疑度;
    const dangerResult = detectDangerousContent(userInput, currentSuspicion);

    // 严重危险：触发BAD END
    if (dangerResult.action === 'TRIGGER_BAD_END') {
      console.error(`[Prompt注入] ⚠️ 危险内容检测触发坏档: ${dangerResult.category}`);
      data.结局数据.当前结局 = '坏结局';
      data.世界.循环状态 = '结局判定';

      return {
        systemPrompt: null,
        replaceUserMessage: dangerResult.message || '你的行为触发了最坏的结局...',
        prefill: null,
        shouldEnterDream: false,
        shouldExitDream: false,
        shouldEnterScene5: false,
        shouldExitScene5: false,
        shouldProgressScene5Step: false,
        shouldTriggerWrongRoute: false,
        wrongRoutePart: null,
        shouldInterrupt: true,
        interruptionResult: null,
        shouldTriggerBadEnding: true,
        badEndingType: '坏结局',
        shouldTriggerNormalEnding: false,
        normalEndingType: '未触发',
        shouldActivateTrueEnding: false,
        shouldProgressTrueEnding: false,
        trueEndingComplete: false,
        shouldActivatePerfectEnding: false,
        shouldProgressPerfectEnding: false,
        perfectEndingComplete: false,
        shouldActivateFalseEnding: false,
        shouldProgressFalseEnding: false,
        falseEndingComplete: false,
        shouldActivateAfterStory: false,
        shouldProgressAfterStory: false,
        afterStoryComplete: false,
        isInFreeMode: false,
      };
    }

    // 中等危险：强制修正输入
    if (dangerResult.action === 'FORCE_CORRECTION' && dangerResult.correctedPrompt) {
      console.warn(`[Prompt注入] 危险内容已修正: ${dangerResult.category}`);
      // 应用怀疑度惩罚（梦境中转为混乱度）
      if (dangerResult.penalties?.怀疑度) {
        if (data.世界.游戏阶段 === '梦境') {
          data.梦境数据.记忆混乱度 = Math.min(100, data.梦境数据.记忆混乱度 + dangerResult.penalties.怀疑度);
          console.info(`[Prompt注入] 梦境中危险行为惩罚：混乱度+${dangerResult.penalties.怀疑度}`);
        } else {
          data.现实数据.丈夫怀疑度 = Math.min(100, data.现实数据.丈夫怀疑度 + dangerResult.penalties.怀疑度);
          console.info(`[Prompt注入] 危险行为惩罚：怀疑度+${dangerResult.penalties.怀疑度}`);
        }
      }
      replaceUserMessage = dangerResult.correctedPrompt;
    }

    // 轻微危险：仅警告，继续正常流程
    if (dangerResult.action === 'WARNING_ONLY') {
      console.info(`[Prompt注入] 轻微危险警告: ${dangerResult.category}`);
      // 轻微惩罚
      if (dangerResult.penalties?.警觉度) {
        if (data.世界.已进入过梦境) {
          data.梦境数据.记忆混乱度 = Math.min(100, data.梦境数据.记忆混乱度 + 5);
        } else {
          data.现实数据.丈夫怀疑度 = Math.min(100, data.现实数据.丈夫怀疑度 + 5);
        }
      }
    }
  }

  // 0.45 时间跳跃描述检测（BUG-006）
  // 检测玩家输入中的时间跳跃描述（如"几个小时后"、"第二天"等）
  // 如果检测到，注入提醒到系统提示中，让AI知道不要错误地描绘其他时间的内容
  if (userInput) {
    const timeJumpResult = TimeSystem.detectTimeJumpDescription(userInput, data.世界.时间);
    if (timeJumpResult.detected && timeJumpResult.reminderPrompt) {
      console.info(`[Prompt注入] 检测到时间跳跃描述: "${timeJumpResult.matchedKeyword}"，注入提醒`);
      // 将提醒追加到系统提示中（不替换用户消息，只是提醒AI）
      if (systemPrompt) {
        systemPrompt = systemPrompt + '\n\n' + timeJumpResult.reminderPrompt;
      } else {
        systemPrompt = timeJumpResult.reminderPrompt;
      }
    }
  }

  // 0.5 境界打断检测（日常阶段，玩家行为超出当前境界允许范围）
  // 只在日常阶段且有玩家输入时检测
  if (data.世界.游戏阶段 === '日常' && userInput && !isDreamExitMessage) {
    const boundaryResult = checkBoundaryInterruption(data, userInput);

    // 如果有超阶段行为（无论是否被打断）
    if (boundaryResult.violatedParts.length > 0) {
      interruptionResult = boundaryResult;

      // 如果触发打断（苏文在家 + 随机成功）
      if (boundaryResult.wasInterrupted && boundaryResult.correctionPrompt) {
        shouldInterrupt = true;
        replaceUserMessage = boundaryResult.correctionPrompt;
        console.info(
          `[Prompt注入] 触发境界打断：${boundaryResult.severity}，` +
            `违规部位：[${boundaryResult.violatedParts.join(', ')}]，` +
            `跨越境界：${boundaryResult.realmGap}`,
        );
        // 打断事件触发后，跳过其他场景检测，直接返回
        return {
          systemPrompt: null,
          replaceUserMessage,
          prefill: null,
          shouldEnterDream: false,
          shouldExitDream: false,
          shouldEnterScene5: false,
          shouldExitScene5: false,
          shouldProgressScene5Step: false,
          shouldTriggerWrongRoute: false,
          wrongRoutePart: null,
          shouldInterrupt,
          interruptionResult,
          shouldTriggerBadEnding: false,
          badEndingType: '未触发',
          shouldTriggerNormalEnding: false,
          normalEndingType: '未触发',
          shouldActivateTrueEnding: false,
          shouldProgressTrueEnding: false,
          trueEndingComplete: false,
          shouldActivatePerfectEnding: false,
          shouldProgressPerfectEnding: false,
          perfectEndingComplete: false,
          shouldActivateFalseEnding: false,
          shouldProgressFalseEnding: false,
          falseEndingComplete: false,
          shouldActivateAfterStory: false,
          shouldProgressAfterStory: false,
          afterStoryComplete: false,
          isInFreeMode: false,
        };
      }

      // 未触发打断但有超阶段行为：生成拒绝提示（不替换消息，而是作为系统提示注入）
      if (boundaryResult.correctionPrompt && !boundaryResult.wasInterrupted) {
        console.info(
          `[Prompt注入] 超阶段行为未打断：${boundaryResult.severity}，` +
            `违规部位：[${boundaryResult.violatedParts.join(', ')}]，` +
            `将注入拒绝引导提示`,
        );
        // 将拒绝提示作为系统提示注入，引导AI描写赵霞的拒绝
        systemPrompt = boundaryResult.correctionPrompt;
      }
    }
  }

  // 1. 检测场景5强制结束（20:00）
  if (checkScene5ForceExit(data)) {
    shouldExitScene5 = true;
    const replacement = generateScene5ForceExitReplacementNew(data);
    replaceUserMessage = replacement.userMessage;
    prefill = replacement.prefill;
    console.info('[Prompt注入] 触发场景5强制结束（20:00）');
  }

  // 1.5. 检测梦境入口 ROLL 操作（在正常入口检测之前）
  // 当玩家 ROLL 梦境入口消息时，游戏阶段已经是"梦境"，正常检测会失败
  const entryRollMessageId = getLastMessageId();
  const dreamEntryRollInfo = isDreamEntryRoll(data, entryRollMessageId);

  // 2. 检测场景5入口（安眠药关键词 或 ROLL）
  if (!shouldExitScene5 && (checkScene5Entry(data, userInput) || dreamEntryRollInfo?.type === '场景5')) {
    shouldEnterScene5 = true;
    const replacement = generateScene5EntryReplacementNew(data);
    replaceUserMessage = replacement.userMessage;
    prefill = replacement.prefill;
    console.info(`[Prompt注入] 触发场景5入口${dreamEntryRollInfo ? '（ROLL 操作）' : '（安眠药关键词）'}`);
  }

  // 2.5 检测场景5中途步骤推进（已在场景5中，且未完成12步）
  if (!shouldExitScene5 && !shouldEnterScene5 && isInScene5(data)) {
    // 2.5.1 场景5违规行为检测（性行为/打断婚礼）
    // 在步骤推进前检测，如果检测到违规需要标记混乱结局或发出警告
    const violationResult = checkScene5Violations(data, userInput);

    if (violationResult.shouldMarkConfusion) {
      // 需要标记混乱结局
      markConfusionEnding(data, violationResult.reason!);
      console.warn(`[Prompt注入] 场景5违规行为检测：标记混乱结局，原因=${violationResult.reason}`);
      // 不中断步骤推进，让玩家继续当前轮次，混乱结局在退出场景5后1小时触发
    } else if (violationResult.shouldWarn && violationResult.warningMessage) {
      // 发出警告，替换用户消息为警告+原始输入
      console.warn(`[Prompt注入] 场景5违规行为警告：检测到性行为，发出警告`);
      // 警告不中断游戏，但会在AI描写中体现赵霞的异常反应
      // 警告消息作为系统提示注入，而非替换用户消息
      if (systemPrompt) {
        systemPrompt = `${systemPrompt}\n\n---\n\n【场景5违规警告】\n${violationResult.warningMessage}`;
      } else {
        systemPrompt = `【场景5违规警告】\n${violationResult.warningMessage}`;
      }
    }

    const completion = calculateScene5CompletionNew(data);
    // 如果还没完成12步，每次玩家输入都推进一步
    if (!completion.isStepsComplete && completion.currentStep < 12) {
      // Bug #11 修复（第三版）：在 prompt 构建前检测 ROLL
      // 如果是 ROLL 操作，使用回退的步骤值来生成 prompt，且不推进数据
      const currentMessageId = getLastMessageId();
      const isRoll = isRollOperationBySwipeId(data, currentMessageId);

      if (isRoll && completion.currentStep > 0) {
        // 是 ROLL 操作：
        // 1. 创建临时数据，步骤回退 1，用于生成 prompt
        // 2. 不设置 shouldProgressScene5Step，避免数据推进
        const tempData = JSON.parse(JSON.stringify(data)) as SchemaType;
        if (tempData.梦境数据.场景5) {
          tempData.梦境数据.场景5.当前步骤 = completion.currentStep - 1;
        }
        const replacement = generateScene5StepReplacement(tempData, userInput);
        replaceUserMessage = replacement.userMessage;
        if (replacement.prefill) {
          prefill = replacement.prefill;
        }
        // 不设置 shouldProgressScene5Step = true，这样后面不会推进数据
        // 但需要更新 swipe_id 记录，所以仍然标记为需要处理
        shouldProgressScene5Step = true; // 设为 true 以便后续更新 swipe_id 记录
        console.info(`[Prompt注入] ROLL 检测：使用回退步骤 ${completion.currentStep}/12 生成 prompt（重新生成同一步）`);
      } else {
        // 正常操作：使用当前数据生成 prompt，并推进数据
        shouldProgressScene5Step = true;
        const replacement = generateScene5StepReplacement(data, userInput);
        replaceUserMessage = replacement.userMessage;
        if (replacement.prefill) {
          prefill = replacement.prefill;
        }
        console.info(`[Prompt注入] 场景5步骤推进：${completion.currentStep + 1}/12`);
      }
    } else if (completion.isStepsComplete || completion.currentStep >= 12) {
      // 【2026-01-17 新增】12步已完成，进入自由发挥阶段
      // 注入自由发挥的prompt，根据剩余时间动态决定是否提示退出
      const replacement = generateScene5FreePlayReplacement(data, userInput);
      replaceUserMessage = replacement.userMessage;
      if (replacement.prefill) {
        prefill = replacement.prefill;
      }
      console.info(
        `[Prompt注入] 场景5自由发挥阶段：完成度=${completion.completionPercent}%，剩余时间=${19 - data.世界.当前小时}小时（19:00退出）`,
      );
    }
  }

  // 3. 检测普通梦境入口（场景1-4，关键词 或 ROLL）
  const isNormalDreamRoll = dreamEntryRollInfo?.type === '普通梦境';
  if (!shouldEnterScene5 && !shouldExitScene5 && (checkDreamEntry(data, userInput) || isNormalDreamRoll)) {
    shouldEnterDream = true;
    // ROLL 时使用记录的场景编号，正常时计算
    const sceneNum = isNormalDreamRoll ? dreamEntryRollInfo.sceneNum : getCurrentDreamScene(data);
    const replacement = generateDreamEntryReplacement(data, sceneNum);
    replaceUserMessage = replacement.userMessage;
    prefill = replacement.prefill;
    console.info(`[Prompt注入] 触发梦境入口，场景${sceneNum}${isNormalDreamRoll ? '（ROLL 操作）' : ''}`);
  }

  // 4. 检测梦境退出（10:00 普通梦境结束 或 ROLL 操作）
  // Bug #21 修复：支持梦境退出 ROLL（包括场景1-4 和 场景5）
  // 当玩家 ROLL 梦境退出消息时，游戏阶段已经是"日常"，checkDreamExit 会返回 false
  // 需要先检测是否是 ROLL，如果是则强制触发退出
  const currentMessageId = getLastMessageId();
  const dreamExitRollSceneNum = isDreamExitRoll(data, currentMessageId);

  // 场景5的 ROLL
  if (dreamExitRollSceneNum === 5) {
    shouldExitScene5 = true;
    const replacement = generateScene5ForceExitReplacementNew(data);
    replaceUserMessage = replacement.userMessage;
    prefill = replacement.prefill;
    console.info(`[Prompt注入] 触发场景5退出（ROLL 操作）`);
  }
  // 场景1-4的退出（正常退出或 ROLL）
  else if (!shouldExitScene5 && (checkDreamExit(data) || dreamExitRollSceneNum !== null)) {
    shouldExitDream = true;
    const replacement = generateDreamExitReplacement(data);
    replaceUserMessage = replacement.userMessage;
    prefill = replacement.prefill;
    console.info(`[Prompt注入] 触发梦境退出${dreamExitRollSceneNum !== null ? '（ROLL 操作）' : ''}`);
  }

  // 5. 部位开发进度注入（仅真相模式，类似习惯注入，影响AI描写）
  // 纯爱模式下由 AI 自行判定，不注入
  if (data.世界.已进入过梦境) {
    const bodyInfluencePrompt = generateBodyPartInfluencePrompt(data);
    if (bodyInfluencePrompt) {
      systemPrompt = bodyInfluencePrompt;
    }
  }

  // 5.5 梦境阶段：添加AI进度反馈格式提示
  // Bug #8 修复：当即将进入梦境时也需要启用
  if (data.世界.游戏阶段 === '梦境' || shouldEnterScene5 || shouldEnterDream) {
    const dreamFeedbackPrompt = generateDreamProgressFeedbackPrompt();
    if (systemPrompt) {
      systemPrompt = `${systemPrompt}\n\n---\n\n${dreamFeedbackPrompt}`;
    } else {
      systemPrompt = dreamFeedbackPrompt;
    }
  }

  // 6. 统一的阶段感知状态Prompt（日常/梦境自动切换）
  // D9剧情引导已整合到梦境阶段的状态Prompt中
  // Bug #8 修复：当即将进入梦境时，覆盖阶段为'梦境'
  // 这解决了AI看到错误游戏阶段（如"序章"而非"梦境"）的问题
  // Bug #13 修复：传递 shouldEnterScene5 标志，解决场景5入口时显示场景1信息的问题
  const phaseOverride = shouldEnterScene5 || shouldEnterDream ? '梦境' : undefined;
  const consistencyPrompt = generatePhaseAwareStatePrompt(data, phaseOverride, shouldEnterScene5);
  console.info(
    `[Prompt注入] 阶段感知状态已注入，当前阶段: ${data.世界.游戏阶段}${phaseOverride ? ` (覆盖为: ${phaseOverride})` : ''}`,
  );

  if (systemPrompt) {
    systemPrompt = `${systemPrompt}\n\n---\n\n${consistencyPrompt}`;
  } else {
    systemPrompt = consistencyPrompt;
  }

  // 6.5 混乱结局前兆提示（场景5退出后，混乱结局触发前）
  // 用于AI描写赵霞的异常状态，暗示玩家即将发生坏事
  const confusionForeshadowing = getConfusionForeshadowing(data);
  if (confusionForeshadowing && data.世界.游戏阶段 === '日常') {
    if (systemPrompt) {
      systemPrompt = `${systemPrompt}\n\n---\n\n${confusionForeshadowing}`;
    } else {
      systemPrompt = confusionForeshadowing;
    }
    console.info(`[Prompt注入] 混乱结局前兆提示已注入`);
  }

  // 7. 结局入口 ROLL 检测（在正常检测之前）
  const endingRollMessageId = getLastMessageId();
  const endingEntryRollType = isEndingEntryRoll(data, endingRollMessageId);

  // Bug #39 修复：注入结局描写指南
  // 由于变量列表设置了"不可激活其他条目"，世界书中的结局条目无法通过正则激活
  // 因此需要在这里通过脚本直接注入结局描写指南
  const endingGuidance = getEndingGuidance(data);
  if (endingGuidance) {
    if (systemPrompt) {
      systemPrompt = `${endingGuidance}\n\n---\n\n${systemPrompt}`;
    } else {
      systemPrompt = endingGuidance;
    }
    console.info(`[Prompt注入] Bug #39 修复：结局描写指南已注入（${data.结局数据.当前结局}）`);
  }

  // 梦境场景描写指南注入
  // Bug #40 修复：只在梦境阶段或即将进入梦境时才注入当前场景的AI引导
  // 原因：日常阶段不需要梦境场景的AI引导内容，会造成混淆
  const isInDreamOrEntering = data.世界.游戏阶段 === '梦境' || shouldEnterDream || shouldEnterScene5;
  let currentDreamSceneNumber: number | undefined; // 记录当前正在进行的梦境场景编号
  if (isInDreamOrEntering) {
    const dreamSceneGuidance = getDreamSceneGuidance(data);
    if (dreamSceneGuidance) {
      if (systemPrompt) {
        systemPrompt = `${dreamSceneGuidance}\n\n---\n\n${systemPrompt}`;
      } else {
        systemPrompt = dreamSceneGuidance;
      }
      const completedScenes = data.梦境数据.已完成场景 || [];
      console.info(`[Prompt注入] 梦境场景描写指南已注入（已完成场景: [${completedScenes.join(', ')}]）`);
    }

    // 获取当前正在进行的场景编号（用于排除历史背景）
    if (shouldEnterScene5) {
      currentDreamSceneNumber = 5;
    } else {
      currentDreamSceneNumber = getCurrentDreamScene(data);
    }
  }

  // Bug #40 修复：注入梦境历史背景
  // 让AI了解之前梦境中发生过什么
  // 包含：场景描述、赵霞状态、玩家目标、苏文身份、剧情摘要
  // - 非梦境阶段：显示所有已完成场景
  // - 梦境阶段：显示已完成场景（排除当前正在进行的场景，因为当前场景有专门的AI引导）
  if (data.世界.已进入过梦境) {
    const dreamHistoryBackground = generateDreamHistoryBackground(data, currentDreamSceneNumber);
    if (dreamHistoryBackground) {
      if (systemPrompt) {
        systemPrompt = `${dreamHistoryBackground}\n\n---\n\n${systemPrompt}`;
      } else {
        systemPrompt = dreamHistoryBackground;
      }
      const completedScenes = data.梦境数据.已完成场景 || [];
      const excludeInfo = currentDreamSceneNumber ? `，排除当前场景${currentDreamSceneNumber}` : '';
      console.info(`[Prompt注入] 梦境历史背景已注入（已完成场景: [${completedScenes.join(', ')}]${excludeInfo}）`);
    }
  }

  // 7.1 完美真爱结局检测（优先于真好结局，因为它是独立的12步婚礼仪式系统）
  // 条件：Day 5, 11:00+ + 5场景全部完成且正确 + 记忆连贯性=3
  const isPerfectEndingRoll = endingEntryRollType === '完美真爱结局';
  if (!isPerfectEndingActive(data) && shouldActivatePerfectEnding(data)) {
    shouldActivatePerfectEndingFlag = true;
    // 首次激活：替换用户消息为12步婚礼仪式入口场景
    const entryReplacement = generatePerfectEndingEntryReplacement();
    replaceUserMessage = entryReplacement.userMessage;
    prefill = entryReplacement.prefill;
    console.info('[Prompt注入] 完美真爱结局激活：首次进入（12步婚礼仪式）');
  }
  // ROLL 检测：如果是完美真爱结局入口的 ROLL，重新生成入口消息
  else if (isPerfectEndingRoll) {
    const entryReplacement = generatePerfectEndingEntryReplacement();
    replaceUserMessage = entryReplacement.userMessage;
    prefill = entryReplacement.prefill;
    console.info('[Prompt注入] 完美真爱结局入口（ROLL 操作）');
  }
  // 如果完美真爱结局已激活，每轮注入阶段引导
  else if (isPerfectEndingActive(data)) {
    const state = getPerfectEndingState(data);

    // 检查是否已完成
    if (state.isComplete) {
      perfectEndingComplete = true;
      const completeMessage = generatePerfectEndingComplete();
      replaceUserMessage = completeMessage;
      console.info('[Prompt注入] 完美真爱结局已完成');
    } else {
      // 检查是否在自由时间（21:00 或 23:00）
      const isFreeTime = isPerfectEndingFreeTime(data);

      if (isFreeTime) {
        // 自由时间：不强制推进剧情，但仍然注入轻量引导
        const freeTimePrompt = generatePerfectFreeTimePrompt(data.世界.当前小时);
        if (systemPrompt) {
          systemPrompt = `${systemPrompt}\n\n---\n\n${freeTimePrompt}`;
        } else {
          systemPrompt = freeTimePrompt;
        }
        console.info(`[Prompt注入] 完美真爱结局自由时间：${data.世界.当前小时}:00`);
      } else {
        shouldProgressPerfectEnding = true;
        // 生成当前阶段的AI引导Prompt
        const perfectEndingPrompt = generatePerfectEndingPrompt(state, userInput);
        if (systemPrompt) {
          systemPrompt = `${systemPrompt}\n\n---\n\n${perfectEndingPrompt}`;
        } else {
          systemPrompt = perfectEndingPrompt;
        }
        console.info(
          `[Prompt注入] 完美真爱结局进行中：阶段${state.currentPhase}（${state.currentPhase <= 11 ? ['序幕', '长谈', '决定', '准备', '蒙眼', '揭幕', '新娘', '司仪', '告白', '誓言', '戒指', '完成'][state.currentPhase] : '未知'}），轮数${state.turnsInPhase}`,
        );
      }
    }
  }

  // 7.2 真好结局检测（Day 5, 11:00+ 且满足条件，但记忆连贯性<3）
  // 注意：如果完美真爱结局已激活，则跳过真好结局检测
  const isTrueEndingRoll = endingEntryRollType === '真好结局';
  if (!isPerfectEndingActive(data) && !isTrueEndingActive(data) && shouldActivateTrueEnding(data)) {
    shouldActivateTrueEndingFlag = true;
    // 首次激活：替换用户消息为结局入口场景
    const entryReplacement = generateTrueEndingEntryReplacement(data);
    replaceUserMessage = entryReplacement.userMessage;
    prefill = entryReplacement.prefill;
    console.info('[Prompt注入] 真好结局激活：首次进入（10步堕落剧情）');
  }
  // ROLL 检测：如果是真好结局入口的 ROLL，重新生成入口消息
  else if (isTrueEndingRoll && !isPerfectEndingActive(data)) {
    const entryReplacement = generateTrueEndingEntryReplacement(data);
    replaceUserMessage = entryReplacement.userMessage;
    prefill = entryReplacement.prefill;
    console.info('[Prompt注入] 真好结局入口（ROLL 操作）');
  }
  // 如果真好结局已激活，每轮注入阶段引导
  else if (isTrueEndingActive(data) && !isPerfectEndingActive(data)) {
    const state = getTrueEndingState(data);

    // 检查是否已完成
    if (state.isComplete) {
      trueEndingComplete = true;
      const completeMessage = generateTrueEndingComplete(data);
      replaceUserMessage = completeMessage;
      console.info('[Prompt注入] 真好结局已完成');
    } else {
      // 检查是否在自由时间（21:00 或 23:00）
      const isFreeTime = isFreeTimeHour(data);
      const guidanceType = getGuidanceType(data);

      if (isFreeTime) {
        // 自由时间：不强制推进剧情，但仍然注入轻量引导
        const freeTimePrompt = generateTimeBasedPrompt(data, state, userInput);
        if (freeTimePrompt) {
          if (systemPrompt) {
            systemPrompt = `${systemPrompt}\n\n---\n\n${freeTimePrompt}`;
          } else {
            systemPrompt = freeTimePrompt;
          }
        }
        console.info(`[Prompt注入] 真好结局自由时间：${data.世界.当前小时}:00`);
      } else {
        shouldProgressTrueEnding = true;
        // 生成当前时段的AI引导Prompt
        const trueEndingPrompt =
          generateTimeBasedPrompt(data, state, userInput) || generateTrueEndingPrompt(state, userInput);
        if (systemPrompt) {
          systemPrompt = `${systemPrompt}\n\n---\n\n${trueEndingPrompt}`;
        } else {
          systemPrompt = trueEndingPrompt;
        }
        console.info(
          `[Prompt注入] 真好结局进行中：阶段${state.currentPhase}，轮数${state.turnsInPhase}，引导类型${guidanceType}`,
        );
      }
    }
  }

  // 8. 假好结局检测（Day 5, 20:00+ 且满足条件）
  // 检测是否应该激活假好结局（完成全部场景但有错误选择）
  const isFalseEndingRoll = endingEntryRollType === '假好结局';
  if (!isFalseEndingActive(data) && shouldActivateFalseEnding(data)) {
    shouldActivateFalseEndingFlag = true;
    // 首次激活：替换用户消息为结局入口场景
    const entryReplacement = generateFalseEndingEntryReplacement();
    replaceUserMessage = entryReplacement.userMessage;
    prefill = entryReplacement.prefill;
    console.info('[Prompt注入] 假好结局激活：首次进入');
  }
  // ROLL 检测：如果是假好结局入口的 ROLL，重新生成入口消息
  else if (isFalseEndingRoll) {
    // ROLL 入口消息：重新生成入口内容（不增加进度）
    const entryReplacement = generateFalseEndingEntryReplacement();
    replaceUserMessage = entryReplacement.userMessage;
    prefill = entryReplacement.prefill;
    console.info('[Prompt注入] 假好结局入口（ROLL 操作）');
  }
  // 如果假好结局已激活，每轮注入阶段引导
  else if (isFalseEndingActive(data)) {
    const state = getFalseEndingState(data);

    // 检查是否已完成
    if (state.isComplete) {
      falseEndingComplete = true;
      const completeMessage = generateFalseEndingComplete();
      replaceUserMessage = completeMessage;
      console.info('[Prompt注入] 假好结局已完成');
    } else {
      shouldProgressFalseEnding = true;
      // 生成当前阶段的AI引导Prompt
      const falseEndingPrompt = generateFalseEndingPrompt(state, userInput);
      if (systemPrompt) {
        systemPrompt = `${systemPrompt}\n\n---\n\n${falseEndingPrompt}`;
      } else {
        systemPrompt = falseEndingPrompt;
      }
      console.info(`[Prompt注入] 假好结局进行中：阶段${state.currentPhase}，轮数${state.turnsInPhase}`);
    }
  }

  // 8. 后日谈系统检测（在所有结局完成后触发）
  // 检测是否在自由模式
  if (isInFreeMode(data)) {
    isInFreeModeFlag = true;
    const freeModePrompt = generateFreeModePrompt(data);
    if (freeModePrompt) {
      if (systemPrompt) {
        systemPrompt = `${systemPrompt}\n\n---\n\n${freeModePrompt}`;
      } else {
        systemPrompt = freeModePrompt;
      }
    }
    console.info('[Prompt注入] 自由模式进行中');
  }
  // 检测是否应该触发后日谈
  else if (shouldTriggerAfterStory(data)) {
    shouldActivateAfterStoryFlag = true;
    const entryReplacement = generateAfterStoryEntryReplacement(data);
    if (entryReplacement) {
      replaceUserMessage = entryReplacement.userMessage;
      prefill = entryReplacement.prefill;
    }
    console.info('[Prompt注入] 触发后日谈');
  }
  // 检测是否在后日谈进行中
  else if (isInAfterStory(data)) {
    const currentRound = data.结局数据.后日谈?.当前轮数 ?? 1;

    // 检查是否应该完成后日谈（已经是第2轮的处理完成后）
    if (currentRound >= 2) {
      afterStoryComplete = true;
      const completeMessage = generateAfterStoryComplete(data);
      replaceUserMessage = completeMessage;
      console.info('[Prompt注入] 后日谈完成，进入自由模式');
    } else {
      shouldProgressAfterStory = true;
      // 生成当前轮次的AI引导Prompt
      const afterStoryPrompt = generateAfterStoryPrompt(data);
      if (afterStoryPrompt) {
        if (systemPrompt) {
          systemPrompt = `${systemPrompt}\n\n---\n\n${afterStoryPrompt}`;
        } else {
          systemPrompt = afterStoryPrompt;
        }
      }
      console.info(`[Prompt注入] 后日谈进行中：第${currentRound}轮`);
    }
  }

  return {
    systemPrompt,
    replaceUserMessage,
    prefill,
    shouldEnterDream,
    shouldExitDream,
    shouldEnterScene5,
    shouldExitScene5,
    shouldProgressScene5Step,
    shouldTriggerWrongRoute,
    wrongRoutePart,
    shouldInterrupt,
    interruptionResult,
    shouldTriggerBadEnding,
    badEndingType,
    shouldTriggerNormalEnding,
    normalEndingType,
    shouldActivateTrueEnding: shouldActivateTrueEndingFlag,
    shouldProgressTrueEnding,
    trueEndingComplete,
    shouldActivatePerfectEnding: shouldActivatePerfectEndingFlag,
    shouldProgressPerfectEnding,
    perfectEndingComplete,
    shouldActivateFalseEnding: shouldActivateFalseEndingFlag,
    shouldProgressFalseEnding,
    falseEndingComplete,
    // 后日谈相关
    shouldActivateAfterStory: shouldActivateAfterStoryFlag,
    shouldProgressAfterStory,
    afterStoryComplete,
    isInFreeMode: isInFreeModeFlag,
  };
}

/**
 * 初始化Prompt注入系统
 * 监听 CHAT_COMPLETION_PROMPT_READY 事件
 */
export function initPromptInjection(): void {
  console.info('[Prompt注入] 开始初始化');

  // 用于跟踪当前请求是否使用 extended thinking
  let currentRequestHasExtendedThinking = false;

  eventOn(tavern_events.CHAT_COMPLETION_SETTINGS_READY, (generate_data: any) => {
    currentRequestHasExtendedThinking = generate_data.include_reasoning === true;
  });

  eventOn(
    tavern_events.CHAT_COMPLETION_PROMPT_READY,
    (event_data: Parameters<ListenerType['chat_completion_prompt_ready']>[0]) => {
      try {
        const { chat, dryRun } = event_data;

        // dryRun 时跳过（仅计算 token）
        if (dryRun) {
          console.info('[Prompt注入] dryRun=true，跳过注入');
          return;
        }

        // 获取当前游戏数据
        const variables = Mvu.getMvuData({ type: 'message', message_id: -1 });
        const statData = _.get(variables, 'stat_data');

        if (!statData) {
          console.warn('[Prompt注入] stat_data 不存在，跳过注入');
          return;
        }

        const data = Schema.parse(statData);

        // Bug #28 修复：获取真正的用户输入
        // 之前从 chat 数组获取的 userInput 可能是酒馆的系统提示词（如 "Now go ahead MW and pass the review."）
        // 需要使用 getChatMessages API 获取真正的用户消息
        let userInput = '';
        let lastUserIndex = -1;

        // 优先使用 getChatMessages 获取真正的用户输入
        try {
          // getChatMessages(-1) 获取最后一条消息（AI回复的位置，但此时还没生成）
          // getChatMessages(-2) 获取倒数第二条消息（用户输入）
          // 但在 beforeSending 阶段，-1 是用户刚发送的消息
          const lastMessages = getChatMessages(-1);
          if (lastMessages && lastMessages.length > 0) {
            const lastMessage = lastMessages[0];
            if (lastMessage.role === 'user' && lastMessage.message) {
              userInput = lastMessage.message;
              console.info(`[Prompt注入] 使用 getChatMessages 获取用户输入: "${userInput.substring(0, 50)}..."`);
            }
          }
        } catch (msgErr) {
          console.warn('[Prompt注入] getChatMessages 获取失败，回退到 chat 数组:', msgErr);
        }

        // Bug #XX 修复：无论 getChatMessages 是否成功，都需要找到 lastUserIndex
        // 因为 replaceUserMessage 需要知道 chat 数组中最后一个 user 消息的位置才能替换
        // 之前的问题：当 getChatMessages 成功时，lastUserIndex 仍然是 -1，导致 replaceUserMessage 无法应用
        for (let i = chat.length - 1; i >= 0; i--) {
          if (chat[i].role === 'user') {
            lastUserIndex = i;
            // 如果还没有获取到 userInput，也顺便获取
            if (!userInput) {
              const content = chat[i].content;
              userInput = typeof content === 'string' ? content : '';
            }
            break;
          }
        }

        // 生成注入内容
        const {
          systemPrompt,
          replaceUserMessage,
          prefill,
          shouldEnterDream,
          shouldExitDream,
          shouldEnterScene5,
          shouldExitScene5,
          shouldProgressScene5Step,
          shouldTriggerWrongRoute,
          wrongRoutePart,
          shouldInterrupt,
          interruptionResult,
          shouldTriggerBadEnding,
          badEndingType,
          // 普通结局/纯爱结局相关
          shouldTriggerNormalEnding,
          normalEndingType,
          shouldActivateTrueEnding: shouldActivateTrueEndingResult,
          shouldProgressTrueEnding: shouldProgressTrueEndingResult,
          trueEndingComplete: trueEndingCompleteResult,
          shouldActivatePerfectEnding: shouldActivatePerfectEndingResult,
          shouldProgressPerfectEnding: shouldProgressPerfectEndingResult,
          perfectEndingComplete: perfectEndingCompleteResult,
          shouldActivateFalseEnding: shouldActivateFalseEndingResult,
          shouldProgressFalseEnding: shouldProgressFalseEndingResult,
          falseEndingComplete: falseEndingCompleteResult,
          // 后日谈相关
          shouldActivateAfterStory: shouldActivateAfterStoryResult,
          shouldProgressAfterStory: shouldProgressAfterStoryResult,
          afterStoryComplete: afterStoryCompleteResult,
          isInFreeMode: isInFreeModeResult,
        } = generateFullInjection(data, userInput);

        // Bug #XX 修复：坏结局状态保存
        // 问题：generateFullInjection 中调用 applyBadEndingState 修改了 data，
        // 但没有将修改保存回 MVU，导致下一轮对话时状态回滚，游戏继续循环而不是锁死
        if (shouldTriggerBadEnding) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 应用坏结局状态（确保数据被正确设置）
            currentData.结局数据.当前结局 = '坏结局';
            currentData.世界.循环状态 = '结局判定';

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] 坏结局状态已保存：${badEndingType}，游戏锁死`);
          } catch (badEndErr) {
            console.error('[Prompt注入] 坏结局状态保存失败:', badEndErr);
          }
        }

        // Bug #XX 修复：普通结局/纯爱结局状态保存
        // 问题：generateFullInjection 中调用 applyNormalEndingState 修改了 data，
        // 但没有将修改保存回 MVU，导致下一轮对话时状态回滚，游戏继续循环而不是锁死
        if (shouldTriggerNormalEnding) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 根据是否进入过梦境决定结局类型
            const hasEnteredDream = currentData.世界.已进入过梦境;
            const endingType = hasEnteredDream ? '普通结局' : '纯爱结局';

            // 应用普通结局/纯爱结局状态
            currentData.结局数据.当前结局 = endingType;
            currentData.世界.循环状态 = '结局判定';
            // 时间循环重置到 Day 1, 08:00
            currentData.世界.当前天数 = 1;
            currentData.世界.当前小时 = 8;
            currentData.世界.时间 = 'Day 1, 08:00';
            currentData.世界.当前循环轮数 = (currentData.世界.当前循环轮数 || 1) + 1;
            currentData.世界.状态栏需要刷新 = true;

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] ${endingType}状态已保存：${normalEndingType}，游戏锁死`);
          } catch (normalEndErr) {
            console.error('[Prompt注入] 普通结局/纯爱结局状态保存失败:', normalEndErr);
          }
        }

        // 处理完美真爱结局状态更新（优先于真好结局）
        if (shouldActivatePerfectEndingResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 初始化完美真爱结局状态
            const initialState = getDefaultPerfectEndingState();
            initialState.isActive = true;
            updatePerfectEndingState(currentData, initialState);

            // 设置游戏阶段为结局
            currentData.世界.游戏阶段 = '结局';
            currentData.结局数据.当前结局 = '完美真爱结局';
            currentData.结局数据.是完美记忆路线 = true;

            // 记录结局入口信息（用于ROLL检测）
            const aiReplyFloor = getLastMessageId() + 1;
            currentData.结局数据._结局入口记录 = {
              楼层ID: aiReplyFloor,
              结局类型: '完美真爱结局',
            };
            console.info(`[Prompt注入] 记录完美真爱结局入口: 楼层${aiReplyFloor}`);

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 完美真爱结局状态已激活（12步婚礼仪式）');
          } catch (perfectEndErr) {
            console.error('[Prompt注入] 完美真爱结局状态激活失败:', perfectEndErr);
          }
        }

        // 处理完美真爱结局进度推进（每轮对话后更新状态）
        if (shouldProgressPerfectEndingResult && !perfectEndingCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            const state = getPerfectEndingState(currentData);
            // 增加当前阶段轮数和总轮数
            state.turnsInPhase += 1;
            state.totalTurns += 1;
            updatePerfectEndingState(currentData, state);

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] 完美真爱结局轮数更新: 阶段${state.currentPhase}, 轮数${state.turnsInPhase}`);
          } catch (progressErr) {
            console.error('[Prompt注入] 完美真爱结局轮数更新失败:', progressErr);
          }
        }

        // 处理完美真爱结局完成
        if (perfectEndingCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            const state = getPerfectEndingState(currentData);
            state.isComplete = true;
            updatePerfectEndingState(currentData, state);

            // 解锁后日谈
            currentData.结局数据.后日谈已解锁 = true;
            currentData.世界.循环状态 = '已破解';

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 完美真爱结局完成，后日谈已解锁');
          } catch (completeErr) {
            console.error('[Prompt注入] 完美真爱结局完成状态更新失败:', completeErr);
          }
        }

        // 处理真好结局状态更新
        if (shouldActivateTrueEndingResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 初始化真好结局状态
            const initialState = getDefaultTrueEndingState();
            initialState.isActive = true;
            updateTrueEndingState(currentData, initialState);

            // 设置游戏阶段为结局
            currentData.世界.游戏阶段 = '结局';
            currentData.结局数据.当前结局 = '真好结局';

            // 记录结局入口信息（用于ROLL检测）
            const aiReplyFloor = getLastMessageId() + 1;
            currentData.结局数据._结局入口记录 = {
              楼层ID: aiReplyFloor,
              结局类型: '真好结局',
            };
            console.info(`[Prompt注入] 记录真好结局入口: 楼层${aiReplyFloor}`);

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 真好结局状态已激活');
          } catch (trueEndErr) {
            console.error('[Prompt注入] 真好结局状态激活失败:', trueEndErr);
          }
        }

        // 处理真好结局进度推进（每轮对话后更新状态）
        if (shouldProgressTrueEndingResult && !trueEndingCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            const state = getTrueEndingState(currentData);
            // 增加当前阶段轮数和总轮数
            state.turnsInPhase += 1;
            state.totalTurns += 1;
            updateTrueEndingState(currentData, state);

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] 真好结局轮数更新: 阶段${state.currentPhase}, 轮数${state.turnsInPhase}`);
          } catch (progressErr) {
            console.error('[Prompt注入] 真好结局轮数更新失败:', progressErr);
          }
        }

        // 处理真好结局完成
        if (trueEndingCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            const state = getTrueEndingState(currentData);
            state.isComplete = true;
            updateTrueEndingState(currentData, state);

            // 解锁后日谈
            currentData.结局数据.后日谈已解锁 = true;
            currentData.世界.循环状态 = '已破解';

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 真好结局完成，后日谈已解锁');
          } catch (completeErr) {
            console.error('[Prompt注入] 真好结局完成状态更新失败:', completeErr);
          }
        }

        // 处理假好结局状态更新
        if (shouldActivateFalseEndingResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 初始化假好结局状态
            const initialState = getDefaultFalseEndingState();
            initialState.isActive = true;
            updateFalseEndingState(currentData, initialState);

            // 设置游戏阶段为结局
            currentData.世界.游戏阶段 = '结局';
            currentData.结局数据.当前结局 = '假好结局';

            // 记录结局入口信息（用于ROLL检测）
            const aiReplyFloor = getLastMessageId() + 1;
            currentData.结局数据._结局入口记录 = {
              楼层ID: aiReplyFloor,
              结局类型: '假好结局',
            };
            console.info(`[Prompt注入] 记录假好结局入口: 楼层${aiReplyFloor}`);

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 假好结局状态已激活');
          } catch (falseEndErr) {
            console.error('[Prompt注入] 假好结局状态激活失败:', falseEndErr);
          }
        }

        // 处理假好结局进度推进（每轮对话后更新状态）
        if (shouldProgressFalseEndingResult && !falseEndingCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            const state = getFalseEndingState(currentData);
            // 增加当前阶段轮数和总轮数
            state.turnsInPhase += 1;
            state.totalTurns += 1;
            updateFalseEndingState(currentData, state);

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] 假好结局轮数更新: 阶段${state.currentPhase}, 轮数${state.turnsInPhase}`);
          } catch (progressErr) {
            console.error('[Prompt注入] 假好结局轮数更新失败:', progressErr);
          }
        }

        // 处理假好结局完成
        if (falseEndingCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            const state = getFalseEndingState(currentData);
            state.isComplete = true;
            updateFalseEndingState(currentData, state);

            // 假好结局完成：解锁后日谈
            currentData.结局数据.后日谈已解锁 = true;
            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 假好结局完成，后日谈已解锁');
          } catch (completeErr) {
            console.error('[Prompt注入] 假好结局完成状态更新失败:', completeErr);
          }
        }

        // 处理后日谈激活
        if (shouldActivateAfterStoryResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 激活后日谈
            activateAfterStory(currentData);

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 后日谈状态已激活');
          } catch (afterStoryErr) {
            console.error('[Prompt注入] 后日谈状态激活失败:', afterStoryErr);
          }
        }

        // 处理后日谈进度推进
        if (shouldProgressAfterStoryResult && !afterStoryCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // Bug #22 修复：检测是否是 ROLL 操作
            const afterStoryMessageId = getLastMessageId();
            const isAfterStoryRoll = isAfterStoryRollOperation(currentData, afterStoryMessageId);

            if (isAfterStoryRoll) {
              // 是 ROLL 操作，跳过轮数推进，但更新 swipe_id
              if (currentData.结局数据.后日谈) {
                const newSwipeId = getSwipeId(afterStoryMessageId);
                (currentData.结局数据.后日谈 as any).上次推进记录 = {
                  楼层ID: afterStoryMessageId,
                  swipe_id: newSwipeId,
                };
                _.set(currentVars, 'stat_data', currentData);
                Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
                console.info(`[Prompt注入] 后日谈 ROLL 检测：跳过轮数推进，更新 swipe_id=${newSwipeId}`);
              }
            } else {
              // 不是 ROLL，正常推进后日谈轮数
              advanceAfterStoryRound(currentData);

              // Bug #22 修复：记录本次推进的楼层ID和swipe_id
              if (currentData.结局数据.后日谈) {
                const currentSwipeId = getSwipeId(afterStoryMessageId);
                (currentData.结局数据.后日谈 as any).上次推进记录 = {
                  楼层ID: afterStoryMessageId,
                  swipe_id: currentSwipeId,
                };
              }

              _.set(currentVars, 'stat_data', currentData);
              Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
              console.info(`[Prompt注入] 后日谈轮数更新: 第${currentData.结局数据.后日谈?.当前轮数}轮`);
            }
          } catch (progressErr) {
            console.error('[Prompt注入] 后日谈轮数更新失败:', progressErr);
          }
        }

        // 处理后日谈完成（进入自由模式）
        if (afterStoryCompleteResult) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 完成后日谈，进入自由模式
            if (currentData.结局数据.后日谈) {
              currentData.结局数据.后日谈.已完成 = true;
              currentData.结局数据.后日谈.自由模式 = true;
            }

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info('[Prompt注入] 后日谈完成，自由模式已解锁');
          } catch (completeErr) {
            console.error('[Prompt注入] 后日谈完成状态更新失败:', completeErr);
          }
        }

        // 处理坏结局（最高优先级，设置游戏状态）
        if (shouldTriggerBadEnding) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 应用坏结局状态
            applyBadEndingState(currentData, badEndingType);

            // Bug #32 修复：精神崩溃类型需要额外调用 applyConfusionEndingState
            // 原因：generateFullInjection 内部调用 applyConfusionEndingState 修改的是参数副本，
            // 没有被持久化，导致 混乱结局.已触发 始终为 false，每次都被判定为 isFirstTrigger
            if (badEndingType === '精神崩溃') {
              applyConfusionEndingState(currentData);
              console.info(`[Prompt注入] 混乱结局状态已应用：已触发=${currentData.梦境数据.混乱结局?.已触发}`);
            }

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] 坏结局状态已应用：${badEndingType}`);
          } catch (badEndErr) {
            console.error('[Prompt注入] 坏结局状态应用失败:', badEndErr);
          }
        }

        // Bug #005 修复：境界打断不再单独应用怀疑度惩罚
        // 怀疑度增加统一由 index.ts 中的 updateSuspicionLevel 处理
        // 境界打断只负责生成打断/拒绝场景
        if (shouldInterrupt && interruptionResult) {
          console.info(
            `[Prompt注入] 境界打断已触发：${interruptionResult.severity}，` +
              `违规部位：[${interruptionResult.violatedParts.join(', ')}]`,
          );
          // 如果触发了 BAD END，应用结局状态
          if (interruptionResult.triggerBadEnd) {
            try {
              const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
              const currentData = Schema.parse(_.get(currentVars, 'stat_data'));
              applyInterruptionResult(currentData, interruptionResult);
              _.set(currentVars, 'stat_data', currentData);
              Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
              console.info(`[Prompt注入] 境界打断触发坏结局`);
            } catch (interruptErr) {
              console.error('[Prompt注入] 境界打断坏结局应用失败:', interruptErr);
            }
          }
        }

        // 处理纯爱模式错误路线
        // 注意：这不是坏结局，只是警告场景。进度重置（100% → 50%）由 MVU VARIABLE_UPDATE_ENDED 事件处理
        if (shouldTriggerWrongRoute) {
          console.info(`[Prompt注入] 纯爱模式错误路线触发：${wrongRoutePart}，AI将描写警告场景`);
          // 不修改游戏状态，玩家消息已被替换，AI会描写警告场景
        }

        // 场景5状态变更由游戏逻辑系统处理，此处仅用于日志
        // 数据修改已移至 index.ts 的 processGameLogic 函数中
        if (shouldEnterScene5) {
          console.info('[Prompt注入] 检测到场景5进入关键词（数据修改由游戏逻辑系统处理）');
        }
        if (shouldExitScene5) {
          console.info('[Prompt注入] 检测到场景5退出条件（数据修改由游戏逻辑系统处理）');
        }

        // 以下代码已注释（原场景5数据修改逻辑，已废弃）
        /*
        if (shouldEnterScene5 || shouldExitScene5) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            if (shouldEnterScene5) {
              currentData.世界.游戏阶段 = '梦境';
              currentData.世界.状态栏需要刷新 = true; // 关键：触发状态栏刷新

              // 记录梦境入口消息ID和入口天数（内部字段）
              // 注意：脚本中使用 getLastMessageId()，getCurrentMessageId() 只能在前端界面中使用
              const currentMessageId = getLastMessageId();
              currentData.世界._梦境入口消息ID = currentMessageId;
              currentData.世界._梦境入口天数 = currentData.世界.当前天数; // 锁定进入时的天数
              currentData.世界.梦境选择已锁定 = false;

              if (!currentData.世界.已进入过梦境) {
                currentData.世界.已进入过梦境 = true;
              }

              // 初始化/更新场景5数据
              const existingScene5Data = currentData.梦境数据.场景5 as {
                已进入?: boolean;
                进入时间?: string;
                进入次数?: number;
                当前步骤?: number;
                完成度?: number;
                步骤进度记录?: number[];
                已完成步骤?: boolean;
              } | undefined;

              if (!currentData.梦境数据.场景5) {
                (currentData.梦境数据 as any).场景5 = {};
              }

              const newScene5Data = currentData.梦境数据.场景5 as {
                已进入?: boolean;
                进入时间?: string;
                进入次数?: number;
                当前步骤?: number;
                完成度?: number;
                步骤进度记录?: number[];
                已完成步骤?: boolean;
              };

              const newEntryCount = (existingScene5Data?.进入次数 ?? 0) + 1;
              newScene5Data.已进入 = true;
              newScene5Data.进入时间 = currentData.世界.时间;
              newScene5Data.进入次数 = newEntryCount;

              // 首次进入时初始化12步系统数据并锁定记忆连贯性
              if (newEntryCount === 1) {
                newScene5Data.当前步骤 = 0;
                newScene5Data.完成度 = 0;
                newScene5Data.步骤进度记录 = [];
                newScene5Data.已完成步骤 = false;
                // 锁定进入场景5时的记忆连贯性等级（基于已完成的场景1-2-3）
                lockScene5EntryCoherence(currentData);
                console.info('[Prompt注入] 场景5首次进入，初始化12步剧情系统，记忆连贯性已锁定');
              }

              console.info(`[Prompt注入] 进入场景5，第${newEntryCount}次`);
            }

            if (shouldExitScene5) {
              currentData.世界.游戏阶段 = '日常';
              currentData.世界.状态栏需要刷新 = true; // 关键：触发状态栏刷新

              // 使用新的12步完成度系统判定场景5是否完成（80%以上才算完成）
              const completion = calculateScene5CompletionNew(currentData);
              if (completion.isComplete && !currentData.梦境数据.已完成场景.includes(5)) {
                currentData.梦境数据.已完成场景.push(5);
                console.info(`[Prompt注入] 场景5完成（完成度: ${completion.completionPercent}%，步骤: ${completion.currentStep}/12）`);
              }

              console.info(
                `[Prompt注入] 退出场景5（20:00），` +
                `完成度: ${completion.completionPercent}%，` +
                `步骤: ${completion.currentStep}/12，` +
                `状态: ${completion.isComplete ? '已完成(≥80%)' : '未完成(<80%)'}`
              );

              // Bug #21 扩展：记录场景5退出的楼层ID，用于支持 ROLL
              const scene5CurrentFloor = getLastMessageId();
              const scene5AiReplyFloor = scene5CurrentFloor + 1; // AI 即将生成的楼层
              currentData.世界._梦境退出记录 = {
                楼层ID: scene5AiReplyFloor,
                场景编号: 5, // 场景5
                swipe_id: 0, // 保留字段兼容性，但不再用于检测
              };
              console.info(`[Prompt注入] 记录场景5退出: 楼层 ${scene5AiReplyFloor} (AI回复)`);

              // 异步生成场景5记忆摘要（后台静默执行，玩家看不到）
              const dreamEntryId = currentData.世界._梦境入口消息ID;
              const scene5ExitFloor = scene5CurrentFloor; // Bug #25：记录退出楼层
              if (dreamEntryId) {
                setTimeout(async () => {
                  let loadingPopup: {
                    dlg: HTMLDialogElement;
                    show: () => Promise<void>;
                    complete: (result: number) => Promise<void>;
                  } | null = null;

                  try {
                    SillyTavern.deactivateSendButtons();
                    console.info('[记忆摘要] 场景5：已禁用发送按钮');

                    loadingPopup = new SillyTavern.Popup(
                      `<div style="text-align: center; padding: 20px;">
                        <div style="font-size: 18px; margin-bottom: 10px;">正在进行结婚日记忆结算...</div>
                        <div style="color: #888; font-size: 14px;">正在生成记忆摘要，请稍候</div>
                        <div style="margin-top: 15px;">
                          <span style="display: inline-block; width: 20px; height: 20px; border: 2px solid #666; border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;"></span>
                        </div>
                        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                      </div>`,
                      SillyTavern.POPUP_TYPE.TEXT,
                      '',
                      {
                        okButton: false,
                        cancelButton: false,
                      }
                    );
                    loadingPopup.show();
                    console.info('[记忆摘要] 场景5：显示结算弹窗');

                    // Bug #25 修复：传递退出楼层ID，限制收集范围
                    const chatHistory = await getDreamSessionMessages(dreamEntryId, scene5ExitFloor);
                    if (chatHistory) {
                      const latestVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
                      const latestData = Schema.parse(_.get(latestVars, 'stat_data'));

                      const summary = await generateMemorySummary(latestData, 5, chatHistory);
                      if (summary) {
                        if (!latestData.梦境数据.场景5) {
                          (latestData.梦境数据 as any).场景5 = {};
                        }
                        // 场景5使用 上次剧情摘要 字段保存
                        (latestData.梦境数据.场景5 as any).上次剧情摘要 = summary;
                        _.set(latestVars, 'stat_data', latestData);
                        Mvu.replaceMvuData(latestVars, { type: 'message', message_id: -1 });
                        console.info(`[记忆摘要] 场景5摘要已保存`);
                      }
                    }
                  } catch (summaryErr) {
                    console.error('[记忆摘要] 场景5摘要生成/保存失败:', summaryErr);
                  } finally {
                    if (loadingPopup) {
                      await loadingPopup.complete(SillyTavern.POPUP_RESULT.AFFIRMATIVE);
                      console.info('[记忆摘要] 场景5：关闭结算弹窗');
                    }
                    SillyTavern.activateSendButtons();
                    console.info('[记忆摘要] 场景5：已恢复发送按钮');
                  }
                }, 100);
              }
            }

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] 场景5状态已更新: ${shouldEnterScene5 ? '进入' : '退出'}`);

            // 立即广播刷新事件，确保状态栏能立即更新（特别是场景编号显示）
            setTimeout(() => {
              // 注意：脚本中使用 getLastMessageId()，getCurrentMessageId() 只能在前端界面中使用
              const currentMessageId = getLastMessageId();
              console.info(`[Prompt注入] 广播 IFRAME_DATA_REFRESH 事件 (场景5${shouldEnterScene5 ? '进入' : '退出'})`);
              eventEmit('IFRAME_DATA_REFRESH', {
                reason: shouldEnterScene5 ? 'SCENE5_ENTERED' : 'SCENE5_EXITED',
                message_id: currentMessageId,
              });
            }, 100);
          } catch (stateErr) {
            console.error('[Prompt注入] 场景5状态更新失败:', stateErr);
          }
        }
        */

        // 处理场景5步骤推进状态更新
        // Bug #11 修复（第二版）：使用 swipe_id 检测 ROLL 操作
        if (shouldProgressScene5Step) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            // 获取当前最新楼层ID
            const currentMessageId = getLastMessageId();

            // Bug #11 修复：检测是否是 ROLL 操作（通过 swipe_id 比较）
            if (isRollOperationBySwipeId(currentData, currentMessageId)) {
              // 是 ROLL 操作，跳过步骤推进
              // 但需要更新上次推进记录中的 swipe_id（因为这是新的 swipe）
              if (!currentData.梦境数据.场景5) {
                (currentData.梦境数据 as any).场景5 = {};
              }
              const scene5Data = currentData.梦境数据.场景5 as any;
              const newSwipeId = getSwipeId(currentMessageId);
              scene5Data.上次推进记录 = {
                楼层ID: currentMessageId,
                swipe_id: newSwipeId,
              };
              _.set(currentVars, 'stat_data', currentData);
              Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
              console.info(`[Prompt注入] ROLL 操作，更新 swipe_id 记录: ${newSwipeId}`);
            } else {
              // 不是 ROLL 操作，正常推进步骤

              // 确保场景5数据存在
              if (!currentData.梦境数据.场景5) {
                (currentData.梦境数据 as any).场景5 = {};
              }

              const scene5Data = currentData.梦境数据.场景5 as {
                当前步骤?: number;
                完成度?: number;
                步骤进度记录?: number[];
                已完成步骤?: boolean;
                上次推进记录?: { 楼层ID: number; swipe_id: number };
              };

              // 获取当前步骤（0-based，即将变成的步骤是 currentStep + 1）
              const currentStep = scene5Data.当前步骤 ?? 0;
              const nextStep = currentStep + 1;

              // 分析玩家意图并计算契合度
              const intent = analyzePlayerIntent(userInput);
              const stepConfig = SCENE5_STEPS[currentStep]; // 当前要执行的步骤配置
              const matchLevel = stepConfig ? calculateMatchLevel(intent, stepConfig) : 'low';

              // 计算进度增量：高契合+10%，低契合+5%
              const progressGain = matchLevel === 'high' ? 10 : 5;

              // 更新步骤进度记录
              const stepProgressRecord = scene5Data.步骤进度记录 ?? [];
              stepProgressRecord.push(progressGain);

              // 计算新的完成度（上限100%）
              const newCompletion = Math.min((scene5Data.完成度 ?? 0) + progressGain, 100);

              // 更新场景5数据
              scene5Data.当前步骤 = nextStep;
              scene5Data.完成度 = newCompletion;
              scene5Data.步骤进度记录 = stepProgressRecord;

              // Bug #11 修复：记录本次推进的楼层ID和swipe_id
              const currentSwipeId = getSwipeId(currentMessageId);
              scene5Data.上次推进记录 = {
                楼层ID: currentMessageId,
                swipe_id: currentSwipeId,
              };

              // 检查是否完成12步
              if (nextStep >= 12) {
                scene5Data.已完成步骤 = true;
              }

              _.set(currentVars, 'stat_data', currentData);
              Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });

              console.info(
                `[Prompt注入] 场景5步骤推进: ${currentStep} → ${nextStep}，` +
                  `契合度: ${matchLevel}，进度+${progressGain}%，` +
                  `完成度: ${newCompletion}%，楼层: ${currentMessageId}, swipe: ${currentSwipeId}`,
              );
            }
          } catch (stateErr) {
            console.error('[Prompt注入] 场景5步骤状态更新失败:', stateErr);
          }
        }

        // 处理状态变更（进入/退出普通梦境）
        if (shouldEnterDream || shouldExitDream) {
          try {
            const currentVars = Mvu.getMvuData({ type: 'message', message_id: -1 });
            const currentData = Schema.parse(_.get(currentVars, 'stat_data'));

            if (shouldEnterDream) {
              currentData.世界.游戏阶段 = '梦境';
              currentData.世界.状态栏需要刷新 = true; // 关键：触发状态栏刷新

              // 记录梦境入口消息ID和入口天数（内部字段）
              // 注意：脚本中使用 getLastMessageId()，getCurrentMessageId() 只能在前端界面中使用
              const currentMessageId = getLastMessageId();
              currentData.世界._梦境入口消息ID = currentMessageId;
              currentData.世界._梦境入口天数 = currentData.世界.当前天数; // 锁定进入时的天数
              currentData.世界.梦境选择已锁定 = false; // 重置锁定状态

              if (!currentData.世界.已进入过梦境) {
                currentData.世界.已进入过梦境 = true;
              }
              // 记录场景进入
              const sceneNum = getCurrentDreamScene(currentData);
              const sceneKey = `场景${sceneNum}` as keyof typeof currentData.梦境数据;
              if (!currentData.梦境数据[sceneKey]) {
                (currentData.梦境数据 as any)[sceneKey] = {};
              }
              (currentData.梦境数据[sceneKey] as any).已进入 = true;
              (currentData.梦境数据[sceneKey] as any).进入时间 = currentData.世界.时间;

              // 场景1特殊：根据恋爱游戏好感度/亲密度初始化梦境数值
              if (sceneNum === 1) {
                const initValues = calculateScene1InitValues(currentData);
                currentData.赵霞状态.依存度 = initValues.initialDependence;
                currentData.赵霞状态.道德底线 = initValues.initialMorality;
                console.info(
                  `[Prompt注入] 场景1初始化：好感度${currentData.赵霞状态.纯爱好感度}+亲密度${currentData.赵霞状态.纯爱亲密度} → 依存度${initValues.initialDependence}，道德底线${initValues.initialMorality}（${initValues.relationshipStage}阶段）`,
                );
              }

              console.info(`[Prompt注入] 记录梦境楼层ID: ${currentMessageId}`);

              // ROLL 支持：记录梦境入口的楼层ID
              // 当用户 ROLL 入口消息时，游戏阶段已经是"梦境"，正常检测会失败
              // 记录 AI 即将生成的楼层，用于在 PROMPT_READY 中检测 ROLL
              const aiReplyFloor = currentMessageId + 1;
              currentData.世界._梦境入口记录 = {
                楼层ID: aiReplyFloor,
                场景编号: sceneNum,
                类型: '普通梦境',
              };
              console.info(`[Prompt注入] 记录梦境入口: 场景${sceneNum}，楼层 ${aiReplyFloor} (AI回复)`);
            }

            if (shouldExitDream) {
              currentData.世界.游戏阶段 = '日常';
              currentData.世界.状态栏需要刷新 = true; // 关键：触发状态栏刷新
              // Bug #38 修复：调用 processSceneCompletion 进行完整的场景判定
              // 之前只添加到 已完成场景，没有判定 是否正确 和添加到 正确重构场景
              const sceneNum = getCurrentDreamScene(currentData);
              processSceneCompletion(currentData, sceneNum);
              console.info(`[Prompt注入] 场景${sceneNum}完成判定已执行`);

              // Bug #21 修复 v2：记录梦境退出的楼层ID，用于支持 ROLL
              // 重要：记录的是 AI 即将生成的楼层（当前楼层+1），而不是用户消息楼层
              // 因为用户 ROLL 的对象是 AI 回复，而 PROMPT_READY 时 AI 消息还没生成
              // v2: 不再使用 swipe_id，因为 ROLL 时消息被删除后 swipe_id 获取不到
              const currentFloor = getLastMessageId();
              const aiReplyFloor = currentFloor + 1; // AI 即将生成的楼层
              currentData.世界._梦境退出记录 = {
                楼层ID: aiReplyFloor,
                场景编号: sceneNum, // 记录是哪个场景退出的（1-4）
                swipe_id: 0, // 保留字段兼容性，但不再用于检测
              };
              console.info(`[Prompt注入] 记录梦境退出: 场景${sceneNum}，楼层 ${aiReplyFloor} (AI回复)`);

              // 设置"上一轮退出"标记，摘要将在下一轮对话时生成
              // 这样可以让玩家先看到醒来场景，再生成摘要
              let dreamEntryId = currentData.世界._梦境入口消息ID;

              // Bug #19 修复：如果 _梦境入口消息ID 丢失，使用当前楼层估算
              if (dreamEntryId === undefined) {
                // 梦境通常持续约10轮对话，估算入口楼层
                const estimatedEntryId = Math.max(0, currentFloor - 10);
                console.warn(
                  `[Prompt注入] Bug #19 修复：_梦境入口消息ID 丢失，估算入口楼层为 ${estimatedEntryId}（当前楼层 ${currentFloor}）`,
                );
                dreamEntryId = estimatedEntryId;
              }

              if (dreamEntryId !== undefined) {
                // Bug #25 修复：记录退出时的楼层ID，用于限制摘要收集范围
                const dreamExitId = currentFloor; // 退出时的用户消息楼层
                currentData.世界.上一轮梦境已退出 = {
                  sceneNum,
                  dreamEntryId,
                  dreamExitId, // Bug #25：添加退出楼层ID
                };
                console.info(
                  `[Prompt注入] 梦境退出检测，场景${sceneNum}已标记上一轮退出（入口ID: ${dreamEntryId}，退出ID: ${dreamExitId}），摘要将在下一轮生成`,
                );
              } else {
                console.warn(`[Prompt注入] 梦境退出但找不到楼层ID，无法设置退出标记`);
              }
            }

            _.set(currentVars, 'stat_data', currentData);
            Mvu.replaceMvuData(currentVars, { type: 'message', message_id: -1 });
            console.info(`[Prompt注入] 状态已更新: ${shouldEnterDream ? '进入梦境' : '退出梦境'}`);

            // Bug #15 修复：添加广播刷新事件，确保状态栏能立即更新
            // 问题：场景1-4入口没有广播IFRAME_DATA_REFRESH，导致状态栏仍显示日常模式
            // 解决：与场景5一样，在状态更新后广播刷新事件
            setTimeout(() => {
              // 注意：脚本中使用 getLastMessageId()，getCurrentMessageId() 只能在前端界面中使用
              const currentMessageId = getLastMessageId();
              console.info(
                `[Prompt注入] 广播 IFRAME_DATA_REFRESH 事件 (${shouldEnterDream ? '进入梦境' : '退出梦境'})`,
              );
              eventEmit('IFRAME_DATA_REFRESH', {
                reason: shouldEnterDream ? 'DREAM_ENTERED' : 'DREAM_EXITED',
                message_id: currentMessageId,
              });
            }, 100);
          } catch (stateErr) {
            console.error('[Prompt注入] 状态更新失败:', stateErr);
          }
        }

        // 替换用户消息（坏结局/普通结局/纯爱结局锁定时使用）
        if (replaceUserMessage && lastUserIndex !== -1) {
          chat[lastUserIndex].content = replaceUserMessage;
          console.info('[Prompt注入] 已替换用户消息');
        }

        // Bug #9 修复：当处于梦境或即将进入梦境时，修改 chat 中 <status_current_variable> 的游戏阶段
        // 问题：世界书宏 {{format_message_variable::stat_data}} 读取的是输入楼层的数据
        // 此时 <status_current_variable> 中显示的仍是 "游戏阶段: 日常" 或 "游戏阶段: 序章"
        // AI 会根据这个旧值输出 <HusbandThought>（梦境中不应出现）
        // 解决方案：直接替换 chat 中的游戏阶段值为 "梦境"
        // 修复范围：不仅是进入梦境时，还包括已经在梦境中的情况
        const isCurrentlyInDream = data.世界.游戏阶段 === '梦境';
        const shouldFixDreamPhase = shouldEnterDream || shouldEnterScene5 || isCurrentlyInDream;
        if (shouldFixDreamPhase) {
          for (const msg of chat) {
            if (typeof msg.content === 'string') {
              if (msg.content.includes('<status_current_variable>')) {
                const before = msg.content.match(/游戏阶段:\s*(日常|序章)/g);
                if (before && before.length > 0) {
                  msg.content = msg.content.replace(/游戏阶段:\s*(日常|序章)/g, '游戏阶段: 梦境');
                  console.info('[Prompt注入] Bug #9 修复：已将 <status_current_variable> 中的游戏阶段替换为梦境');
                }
              }
            }
          }
        }

        // 统一使用尾部注入
        if (systemPrompt) {
          chat.push({ role: 'system', content: systemPrompt });
        }

        // 添加 prefill
        if (prefill) {
          if (!currentRequestHasExtendedThinking) {
            chat.push({ role: 'assistant', content: prefill });
            console.info('[Prompt注入] 已添加 Prefill');
          } else {
            // extended thinking 模式下转换为 system 提示
            const prefillGuidance = `【回复格式要求】请以以下内容作为回复的开头：\n${prefill}`;
            chat.push({ role: 'system', content: prefillGuidance });
            console.info('[Prompt注入] Extended thinking 模式，Prefill 转换为 system 提示');
          }
        }

        // Bug #11 修复：处理完成后重置 ROLL 操作标志
        resetRollOperationFlag();
      } catch (err) {
        console.error('[Prompt注入] 执行失败:', err);
        // Bug #11 修复：即使出错也要重置标志，防止影响后续请求
        resetRollOperationFlag();
      }
    },
  );

  console.info('[Prompt注入] 初始化完成');
}
