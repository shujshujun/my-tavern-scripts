/**
 * 赵霞游戏 - 游戏逻辑主入口
 *
 * 基于秦璐游戏的最佳实践和 TIME_LOOP_DESIGN.md 设计文档，实现零BUG的事件处理系统：
 * - 时间推进：使用 TimeSystem 统一管理
 * - 梦境检测：检测梦境入口窗口和场景完成情况
 * - 结局判定：Day 5, 00:00（即 Day 6 凌晨）自动触发结局判定（2026-01-17 从20:00延长到00:00）
 * - 境界更新：根据依存度自动计算境界
 * - 数值更新：混乱度、怀疑度等威胁数值的自动更新
 * - 危险内容检测：三级干预机制（轻微警告/强制修正/立即坏档）
 * - 双轨系统：现实路线 vs 梦境路线的文本映射
 * - 境界打断：跨境界行为的丈夫打断机制
 * - 记忆开发：梦境中的部位关键词检测
 *
 * 所有逻辑在同一个事件处理中顺序执行，只进行一次读写，彻底消除数据竞争。
 */

import { Schema, type Schema as SchemaType } from '../../schema';
import { TimeSystem } from './timeSystem';
import { validateAndFixState, checkRealmChange } from './stateValidation';
import {
  updateHusbandLocation,
  getRealmTitle,
  getStyleGuidance,
  updateTruthModeValues,
  updateSuspicionLevel,
  applySuspicionDecrease,
  updateZhaoxiaLocation,
  updateZhaoxiaThoughtAfterDream,
} from './appearanceSystem';
// Bug #005 修复：危险内容检测已移至 promptInjection.ts
import {
  updateBodyPartProgress,
  getBodyPartSummary,
  processSceneCompletion,
  generateMemoryContinuityPrompt,
  SCENE_CORRECT_ANSWERS,
  generateMemorySummary,
  getDreamSessionMessages,
  validateAndProcessAIReport,
} from './dreamKeywordDetection';
// 境界打断系统已移至 promptInjection.ts 中处理（系统A：事件触发系统）
import { parseHusbandThought, shouldGenerateHusbandThought, getCurrentRouteType } from './dualTrackSystem';
import { initPromptInjection, setRollOperationFlag } from './promptInjection';
import { isTrueEndingActive, getTrueEndingState, updateTrueEndingState, processTurnEnd } from './trueEndingSystem';
import {
  isPerfectEndingActive,
  getPerfectEndingState,
  updatePerfectEndingState,
  processPerfectTurnEnd,
} from './perfectTrueEndingSystem';
import {
  isFalseEndingActive,
  getFalseEndingState,
  updateFalseEndingState,
  processTurnEnd as processFalseEndingTurnEnd,
} from './falseEndingSystem';
import {
  createDataSnapshot,
  validateAndRestoreData,
  generateProtectionReport,
  initDataProtection,
  updateSnapshotValue,
} from './dataProtection';
import { shouldTriggerNormalEnding, applyNormalEndingState } from './normalEndingSystem';
import {
  calculateScene5Completion as calculateScene5CompletionNew,
  getScene5LockedCoherence,
  lockScene5EntryCoherence,
} from './scene5System';
import {
  checkConfusionEnding,
  applyConfusionEndingState,
  isInConfusionEndingLock,
  canEnterDreamForConfusion,
  checkScene5Violations,
  markConfusionEnding,
  setConfusionOnDreamEntry,
} from './confusionEndingSystem';

/**
 * 游戏事件类型定义
 */
interface GameEvent {
  type: string;
  data: Record<string, unknown>;
}

// SillyTavern 全局函数在 @types/function/ 中声明

/**
 * 广播游戏事件到前端
 */
function broadcastGameEvent(event: GameEvent): void {
  console.info(`[游戏事件] 广播: ${event.type}`, event.data);
  eventEmit('GAME_EVENT', event);
}

/**
 * 获取当前梦境场景编号（场景1-4）
 * 根据进入梦境时的天数决定进入哪个场景
 *
 * 规则：
 * - Day 1 → 场景1, Day 2 → 场景2, Day 3 → 场景3, Day 4+ → 场景4
 *
 * 重要：使用 _梦境入口天数 而非 当前天数！
 * 原因：梦境期间时间会继续推进（如 Day 1 22:00 进入，到 Day 2 00:00 时跨天），
 * 如果使用当前天数会导致场景编号在梦境中途变化（Bug #6）。
 *
 * 注意：场景5有独立的入口检测（promptInjection.ts中的checkScene5Entry），
 * 通过安眠药关键词触发，不经过此函数。此函数仅用于普通梦境场景1-4的判断。
 */
function getCurrentDreamScene(data: SchemaType): number {
  // 优先使用锁定的入口天数，若未设置则回退到当前天数
  const day = data.世界._梦境入口天数 ?? data.世界.当前天数;
  // 普通场景：Day 1 → 场景1, Day 2 → 场景2, ...，最多场景4
  return Math.min(day, 4);
}

/**
 * 检测并处理结局判定
 */
function checkEnding(data: SchemaType): boolean {
  if (!TimeSystem.isEndingTime(data)) {
    return false;
  }

  // Bug #18 修复：允许 '进行中' 或 '结局判定' 状态继续处理
  // '结局判定' 状态表示 TimeSystem.advance() 已检测到结局时间但尚未完成判定
  // 只有 '已破解' 状态才应该跳过（表示结局已经处理完毕）
  if (data.世界.循环状态 !== '进行中' && data.世界.循环状态 !== '结局判定') {
    return false;
  }

  console.info('━━━━━━━━━━━━━━━━━━━━━━');
  console.info('🎬 到达第6天凌晨00:00（Day 5结束后），触发结局判定');
  console.info('━━━━━━━━━━━━━━━━━━━━━━');

  data.世界.循环状态 = '结局判定';

  const 正确场景数 = data.梦境数据.正确重构场景.length;
  const 混乱度 = data.梦境数据.记忆混乱度;
  const 怀疑度 = data.现实数据.丈夫怀疑度;

  console.info(`结局判定数据:`);
  console.info(`- 正确场景数: ${正确场景数}/5`);
  console.info(`- 记忆混乱度: ${混乱度}`);
  console.info(`- 丈夫怀疑度: ${怀疑度}`);
  console.info(`- 混乱结局已标记: ${data.梦境数据.混乱结局?.已标记 ?? false}`);

  // 混乱结局检测（优先级最高，因为丈夫已被处理）
  // 2026-01-19 重新设计：混乱结局在场景5中直接触发并锁死，这里只是做兜底检测
  const confusionResult = checkConfusionEnding(data, false);
  if (confusionResult.triggered) {
    // 如果混乱结局已触发，确保状态正确
    applyConfusionEndingState(data);
    data.结局数据.结局触发时间 = TimeSystem.getCurrentTime(data);
    console.info('⚠️ 混乱结局已触发（精神崩溃）');
    return true;
  }

  // 坏结局：丈夫怀疑度达到100（被发现）
  // 注意：混乱度≥100触发的是混乱结局（精神崩溃），由上面的checkConfusionEnding处理
  if (怀疑度 >= 100) {
    data.结局数据.当前结局 = '坏结局';
    data.结局数据.结局触发时间 = TimeSystem.getCurrentTime(data);
    console.info('⚠️ 触发坏结局（被丈夫发现）');
    return true;
  }

  // 真好结局/完美真爱结局：完成所有5个场景且全部正确
  const 已完成场景 = new Set(data.梦境数据.已完成场景);
  const 全部完成 =
    已完成场景.size === 5 &&
    已完成场景.has(1) &&
    已完成场景.has(2) &&
    已完成场景.has(3) &&
    已完成场景.has(4) &&
    已完成场景.has(5);

  if (全部完成 && 正确场景数 === 5) {
    // 检查是否为完美真爱结局（记忆连贯性=3）
    const 记忆连贯性 = getScene5LockedCoherence(data);
    const 是完美记忆路线 = 记忆连贯性 === 3;

    if (是完美记忆路线) {
      data.结局数据.当前结局 = '完美真爱结局';
      data.结局数据.是完美记忆路线 = true;
      console.info('✨ 触发完美真爱结局（完美记忆路线 + 全部正确）');
    } else {
      data.结局数据.当前结局 = '真好结局';
      data.结局数据.是完美记忆路线 = false;
      console.info('🎉 触发真好结局（完成所有场景且全部正确）');
    }

    data.结局数据.结局触发时间 = TimeSystem.getCurrentTime(data);
    data.世界.循环状态 = '已破解';
    console.info(`  - 记忆连贯性: ${记忆连贯性}/3`);
    return true;
  }

  // 假好结局：完成全部5个场景但不是全部正确（有错误选择）
  if (全部完成 && 正确场景数 > 0 && 正确场景数 < 5) {
    data.结局数据.当前结局 = '假好结局';
    data.结局数据.结局触发时间 = TimeSystem.getCurrentTime(data);
    data.世界.循环状态 = '已破解'; // 好结局都能破解时间循环
    console.info(`🎭 触发假好结局（完成全部场景但有${5 - 正确场景数}个错误选择）`);
    return true;
  }

  // 普通结局：时间到了但未完成全部场景，且未触发坏结局
  // 时间循环重置，一切回到原点
  if (shouldTriggerNormalEnding(data)) {
    applyNormalEndingState(data);
    data.结局数据.结局触发时间 = TimeSystem.getCurrentTime(data);
    console.info('🔄 触发普通结局（时间循环重置）');
    console.info(`  - 已完成场景: ${已完成场景.size}/5`);
    console.info(`  - 正确场景数: ${正确场景数}`);
    return true;
  }

  // 兜底：不应该到达这里，但如果到达了就触发坏结局
  data.结局数据.当前结局 = '坏结局';
  data.结局数据.结局触发时间 = TimeSystem.getCurrentTime(data);
  console.warn('⚠️ 触发坏结局（兜底逻辑）');
  return true;
}

/**
 * 检测梦境相关事件
 * @param data 游戏数据
 * @param userText 用户输入文本
 * @param targetMessageId 目标消息ID（用于设置梦境楼层ID）
 */
function checkDreamEvents(
  data: SchemaType,
  userText: string,
  targetMessageId?: number,
): {
  dreamWindowOpen: boolean;
  dreamEnded: boolean;
  firstAwakening: boolean;
  bodySummary?: ReturnType<typeof getBodyPartSummary>;
} {
  const result = {
    dreamWindowOpen: false,
    dreamEnded: false,
    firstAwakening: false,
    bodySummary: undefined as ReturnType<typeof getBodyPartSummary> | undefined,
  };

  // 检测是否在梦境入口窗口
  if (TimeSystem.isDreamWindowOpen(data) && data.世界.游戏阶段 === '日常') {
    console.info('🌙 当前时间在梦境入口窗口（22:00-01:59）');
    result.dreamWindowOpen = true;

    const currentScene = getCurrentDreamScene(data);
    const alreadyCompleted = data.梦境数据.已完成场景.includes(currentScene);

    // 广播梦境入口可用事件
    broadcastGameEvent({
      type: 'DREAM_WINDOW_OPEN',
      data: {
        currentScene,
        alreadyCompleted,
        canEnterScene5: true, // 场景5通过关键词检测触发，不需要道具
        memoryContinuityPrompt: generateMemoryContinuityPrompt(data, currentScene),
      },
    });
  }

  // 检测梦境结束（10:00赵霞醒来）
  // 注意：场景5是白天梦境，不受10:00醒来限制，应该在20:00退出
  const scene5Data = data.梦境数据.场景5 as { 已进入?: boolean } | undefined;
  const isInScene5 = scene5Data?.已进入 === true && data.世界.游戏阶段 === '梦境';

  // 🐛 DEBUG: 打印详细检查信息
  if (data.世界.游戏阶段 === '梦境') {
    console.info('[checkDreamEvents] 梦境退出检查:');
    console.info(`  - 当前小时: ${data.世界.当前小时}`);
    console.info(`  - isWakeUpTime: ${TimeSystem.isWakeUpTime(data)}`);
    console.info(`  - scene5.已进入: ${scene5Data?.已进入}`);
    console.info(`  - isInScene5: ${isInScene5}`);
    console.info(`  - 是否退出: ${TimeSystem.isWakeUpTime(data) && !isInScene5}`);
  }

  if (data.世界.游戏阶段 === '梦境' && TimeSystem.isWakeUpTime(data) && !isInScene5) {
    console.info('⏰ 赵霞醒来，梦境结束（场景1-4）');
    result.dreamEnded = true;

    // 生成部位开发总结
    const bodySummary = getBodyPartSummary(data);
    result.bodySummary = bodySummary;

    // 处理当前场景完成判定
    const currentScene = getCurrentDreamScene(data);
    if (!data.梦境数据.已完成场景.includes(currentScene)) {
      // 获取玩家在进入梦境时选择的部位
      const sceneKey = `场景${currentScene}` as keyof typeof data.梦境数据;
      const sceneData = data.梦境数据[sceneKey];
      const hasEntered = (sceneData as { 已进入?: boolean } | undefined)?.已进入 ?? false;
      const selectedParts = (sceneData as { 选择部位?: string[] } | undefined)?.选择部位 ?? [];

      if (!hasEntered) {
        // 玩家从未进入该场景的梦境，保持未完成状态，不做处理
        console.info(`[梦境结束] 场景${currentScene}未进入，保持未触发状态`);
      } else if (selectedParts.length > 0) {
        // 玩家进入了梦境且有选择部位，执行判定
        processSceneCompletion(data, currentScene);
        console.info(`[梦境结束] 场景${currentScene}判定完成，玩家选择: [${selectedParts.join(', ')}]`);
      } else {
        // 玩家进入了梦境但未选择部位，视为答案错误
        console.warn(`[梦境结束] 场景${currentScene}已进入但未选择部位，视为错误`);
        // 标记为已完成
        if (!data.梦境数据.已完成场景.includes(currentScene)) {
          data.梦境数据.已完成场景.push(currentScene);
        }
        // 明确标记为不正确
        if (sceneData && typeof sceneData === 'object') {
          (sceneData as { 是否正确?: boolean }).是否正确 = false;
        }
      }
    }

    // 切换回日常阶段
    data.世界.游戏阶段 = '日常';
    data.世界.状态栏需要刷新 = true; // 关键：触发状态栏刷新
    updateSnapshotValue('世界.游戏阶段', '日常'); // 同步更新快照

    // Bug #28 修复：梦境退出后更新赵霞的位置和心理活动
    // 确保真相模式状态栏显示正确的数据，而不是进入梦境前的旧值
    updateZhaoxiaLocation(data);
    updateZhaoxiaThoughtAfterDream(data);

    // 设置"上一轮退出"标记，摘要将在下一轮对话时生成
    // Bug #18 说明：promptInjection 在 09:00 时已让 AI 生成出梦描写
    // 这里（10:00）只处理状态切换，玩家已看到醒来场景，摘要将在下一轮生成
    let dreamEntryId = data.世界._梦境入口消息ID;

    // Bug #19 修复：如果 _梦境入口消息ID 丢失，使用当前入口天数估算
    // 梦境通常在22:00进入，每天约12轮对话，可以估算出大致的楼层范围
    if (dreamEntryId === undefined && targetMessageId !== undefined) {
      // 简单估算：假设当前楼层 - 梦境对话轮数（约10轮）为入口
      // 这不是精确的，但至少可以获取到一些梦境对话内容用于生成摘要
      const estimatedEntryId = Math.max(0, targetMessageId - 10);
      console.warn(
        `[checkDreamEvents] Bug #19 修复：_梦境入口消息ID 丢失，估算入口楼层为 ${estimatedEntryId}（当前楼层 ${targetMessageId}）`,
      );
      dreamEntryId = estimatedEntryId;
    }

    if (dreamEntryId !== undefined) {
      // Bug #25 修复：记录退出时的楼层ID，用于限制摘要收集范围
      const dreamExitId = targetMessageId; // 退出时的当前楼层
      data.世界.上一轮梦境已退出 = {
        sceneNum: currentScene,
        dreamEntryId,
        dreamExitId, // Bug #25：添加退出楼层ID
      };
      console.info(
        `[checkDreamEvents] 场景${currentScene}梦境退出，已标记上一轮退出（入口ID: ${dreamEntryId}，退出ID: ${dreamExitId}），摘要将在下一轮生成`,
      );
    } else {
      console.warn(`[checkDreamEvents] 梦境退出但找不到楼层ID，无法设置退出标记`);
    }

    // 首次进入梦境后，切换到真相模式
    if (!data.世界.已进入过梦境) {
      data.世界.已进入过梦境 = true;
      result.firstAwakening = true;

      console.info('━━━━━━━━━━━━━━━━━━━━━━');
      console.info('✨ 首次梦境结束，切换到真相模式');
      console.info('界面文本将从纯爱模式切换为真相模式');
      console.info('━━━━━━━━━━━━━━━━━━━━━━');

      // 广播真相揭示事件
      broadcastGameEvent({
        type: 'TRUTH_REVEALED',
        data: {
          message: `你进入了母亲的梦境...
在这里，你能看清一切的真相。
那些你以为的"好感度"，其实是"依存度"。
那些你以为的"心动值"，其实是"道德底线"。
你一直在做的事情...原来是这样的吗？`,
        },
      });
    }

    // 广播梦境结束事件
    broadcastGameEvent({
      type: 'DREAM_ENDED',
      data: {
        bodySummary,
        firstAwakening: result.firstAwakening,
        completedScenes: data.梦境数据.已完成场景,
        correctScenes: data.梦境数据.正确重构场景,
        confusionLevel: data.梦境数据.记忆混乱度,
      },
    });
  }

  // 检测睡觉指令（可能错过梦境窗口）
  if (userText.includes('睡觉') || userText.includes('sleep')) {
    const 当前小时 = data.世界.当前小时;
    if (当前小时 >= 23 || 当前小时 <= 1) {
      console.info('⚠️ 玩家在梦境窗口时间选择睡觉，将跳过梦境机会');

      broadcastGameEvent({
        type: 'DREAM_WINDOW_MISSED',
        data: {
          message: '你在梦境窗口时间选择了睡觉，错过了进入梦境的机会...',
        },
      });
    }
  }

  // 检测进入梦境的意图
  // Bug #16 修复：扩展关键词列表，支持更灵活的匹配
  // 原问题："进入了梦境" 无法匹配 "进入梦境"，因为中间多了"了"字
  // 解决方案：
  // 1. 添加更多变体关键词
  // 2. 添加正则表达式匹配模式（处理"进入.*梦境"这类模式）
  const dreamEntryKeywords = [
    '进入梦境',
    '进入了梦境',
    '进入她的梦境',
    '进入赵霞的梦境',
    '入梦',
    '睡着',
    '闭上眼睛',
    '做梦',
    '睡了',
    '入睡',
    '梦境', // 单独的"梦境"关键词，配合时间窗口检测
  ];
  // 正则表达式模式：匹配 "进入...梦境" 这类变体
  const dreamEntryPatterns = [
    /进入.*梦境/, // 匹配 "进入了梦境"、"进入她的梦境" 等
    /入.*梦/, // 匹配 "入梦"、"入了梦" 等
  ];
  const wantToEnterDream =
    dreamEntryKeywords.some(kw => userText.includes(kw)) || dreamEntryPatterns.some(pattern => pattern.test(userText));

  // 🐛 DEBUG: 打印梦境入口检测详情
  const isDreamWindow = TimeSystem.isDreamWindowOpen(data);
  const isDaily = data.世界.游戏阶段 === '日常';
  console.info('[checkDreamEvents] 梦境入口检测:');
  console.info(`  - userText: "${userText.substring(0, 50)}${userText.length > 50 ? '...' : ''}"`);
  console.info(`  - wantToEnterDream: ${wantToEnterDream} (关键词: ${dreamEntryKeywords.join(', ')})`);
  console.info(`  - isDreamWindowOpen: ${isDreamWindow} (当前小时: ${data.世界.当前小时})`);
  console.info(`  - 游戏阶段: ${data.世界.游戏阶段} (isDaily: ${isDaily})`);
  console.info(`  - 条件全部满足: ${wantToEnterDream && isDreamWindow && isDaily}`);

  // Bug #15 修复：即使游戏阶段已经是'梦境'，也要确保数据被正确设置
  // 原因：promptInjection 写入到用户消息楼层，但 AI 回复楼层的数据可能没有继承
  // 解决：检测到梦境入口关键词时，无论当前游戏阶段是什么，都重新设置
  //
  // 防逃避机制：如果混乱结局已标记且到达触发时间，阻止进入普通梦境
  const canEnterForConfusion = canEnterDreamForConfusion(data);
  const shouldEnterDream =
    wantToEnterDream && isDreamWindow && (isDaily || data.世界.游戏阶段 === '梦境') && canEnterForConfusion;

  if (wantToEnterDream && isDreamWindow && !canEnterForConfusion) {
    console.warn('[checkDreamEvents] 混乱结局待触发，阻止进入普通梦境（场景1-4）');
  }

  if (shouldEnterDream) {
    const currentScene = getCurrentDreamScene(data);

    // 场景5通过安眠药关键词检测触发（checkScene5Entry函数处理）
    // 这里只处理场景1-4的常规梦境入口
    if (currentScene <= 4) {
      // 切换到梦境阶段
      data.世界.游戏阶段 = '梦境';
      data.世界.状态栏需要刷新 = true; // 关键：触发状态栏刷新
      updateSnapshotValue('世界.游戏阶段', '梦境'); // 同步更新快照，防止被误判为篡改

      // 设置梦境入口消息ID、入口天数和选择锁定状态
      if (targetMessageId !== undefined) {
        data.世界._梦境入口消息ID = targetMessageId;
      }
      data.世界._梦境入口天数 = data.世界.当前天数; // 锁定进入时的天数，防止跨天后场景编号错误
      data.世界.梦境选择已锁定 = false;

      // 设置进入梦境时的混乱度（场景1=40, 场景2=60, 场景3=80, 场景4=不变）
      setConfusionOnDreamEntry(data, currentScene);
      // Bug #31 修复：混乱度修改后同步更新快照，防止被 validateAndRestoreData 误还原
      updateSnapshotValue('梦境数据.记忆混乱度', data.梦境数据.记忆混乱度);
      console.info(
        `[梦境入口] 进入梦境场景${currentScene}，楼层ID=${targetMessageId}，混乱度=${data.梦境数据.记忆混乱度}`,
      );

      // ROLL 支持：记录普通梦境入口的楼层ID
      // 当用户 ROLL 入口消息时，游戏阶段已经是"梦境"，promptInjection 的正常检测会失败
      // 记录 AI 回复的楼层，用于在 PROMPT_READY 中检测 ROLL
      if (targetMessageId !== undefined) {
        const dreamAiReplyFloor = targetMessageId + 1;
        data.世界._梦境入口记录 = {
          楼层ID: dreamAiReplyFloor,
          场景编号: currentScene,
          类型: '普通梦境',
        };
        console.info(`[梦境入口] 记录梦境入口: 场景${currentScene}，楼层 ${dreamAiReplyFloor} (AI回复)`);
      }

      broadcastGameEvent({
        type: 'DREAM_ENTERED',
        data: {
          sceneNumber: currentScene,
          memoryContinuityPrompt: generateMemoryContinuityPrompt(data, currentScene),
          correctTarget: SCENE_CORRECT_ANSWERS[currentScene], // 仅用于调试，前端不应显示
        },
      });
    }
  }

  return result;
}

// 每天每个部位的开发上限
const DAILY_DEVELOPMENT_LIMIT = 20;

// 错误路线重置值
const WRONG_ROUTE_RESET_VALUE = 50;

$(async () => {
  await waitGlobalInitialized('Mvu');

  // 初始化Prompt注入系统
  initPromptInjection();

  // 初始化数据保护系统
  initDataProtection();
  console.info('[赵霞游戏逻辑] 数据保护系统已初始化');

  // =============================================
  // 纯爱模式：AI 变量更新后的处理
  // - 限制每天部位开发上限 20%
  // - 检测部位达到 100% 后触发错误路线（重置到 50%）
  // =============================================
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (new_variables: any, old_variables: any) => {
    try {
      const newData = _.get(new_variables, 'stat_data');
      const oldData = _.get(old_variables, 'stat_data');

      if (!newData || !oldData) return;

      // 只在纯爱模式下处理（未进入过梦境）
      if (newData.世界?.已进入过梦境) {
        // Bug 修复：Day 5+ 疑心度豁免（结局日AI不应修改疑心度）
        const currentDay = newData.世界?.当前天数 ?? 1;
        if (currentDay >= 5) {
          const oldSuspicion = oldData.现实数据?.丈夫怀疑度 ?? 0;
          const newSuspicion = newData.现实数据?.丈夫怀疑度 ?? 0;
          if (oldSuspicion !== newSuspicion) {
            _.set(new_variables, 'stat_data.现实数据.丈夫怀疑度', oldSuspicion);
            console.info(`[MVU监听] Day ${currentDay} 疑心度豁免：回滚AI的修改 ${newSuspicion} → ${oldSuspicion}`);
          }
        }

        // 真相模式下，部位进度的控制规则：
        // - 梦境阶段：允许AI修改部位进度（通过关键词检测）
        // - 日常阶段：部位进度由脚本控制，AI不应修改，需要回滚
        const currentStage = newData.世界?.游戏阶段;

        if (currentStage === '日常' || currentStage === '序章') {
          // 只在日常/序章阶段回滚AI的部位进度修改
          const parts = ['嘴巴', '胸部', '下体', '后穴', '精神'] as const;
          for (const part of parts) {
            const oldValue = oldData.赵霞状态?.部位进度?.[part] ?? 0;
            const newValue = newData.赵霞状态?.部位进度?.[part] ?? 0;
            if (oldValue !== newValue) {
              _.set(new_variables, `stat_data.赵霞状态.部位进度.${part}`, oldValue);
              console.info(`[MVU监听] 日常阶段：回滚AI对${part}的修改 ${newValue} → ${oldValue}`);
            }
          }
        } else {
          // 梦境阶段：根据当前场景限制AI可修改的部位
          // Bug #29 修复：场景1-4只能修改肉体部位，场景5只能修改精神部位
          const scene5Data = newData.梦境数据?.场景5;
          const isInScene5 = scene5Data?.已进入 === true;

          // 确定当前场景允许的部位
          let allowedParts: string[];
          if (isInScene5) {
            allowedParts = ['精神'];
            console.info('[MVU监听] 梦境阶段（场景5）：只允许AI修改精神部位');
          } else {
            allowedParts = ['嘴巴', '胸部', '下体', '后穴'];
            console.info('[MVU监听] 梦境阶段（场景1-4）：只允许AI修改肉体部位');
          }

          // Bug #003 修复：梦境阶段也需要限制每次修改幅度（每晚上限20%）
          // 问题：之前只检查部位是否允许，没有限制幅度，导致AI可以一次性把部位进度从0%改到100%
          const allParts = ['嘴巴', '胸部', '下体', '后穴', '精神'] as const;
          for (const part of allParts) {
            const oldValue = oldData.赵霞状态?.部位进度?.[part] ?? 0;
            const newValue = newData.赵霞状态?.部位进度?.[part] ?? 0;

            if (oldValue === newValue) continue;

            // 不允许修改的部位：完全回滚
            if (!allowedParts.includes(part)) {
              _.set(new_variables, `stat_data.赵霞状态.部位进度.${part}`, oldValue);
              console.info(`[MVU监听] 梦境阶段：回滚AI对${part}的非法修改 ${newValue} → ${oldValue}（当前场景不允许）`);
              continue;
            }

            // 允许修改的部位：限制幅度（每晚上限20%）
            if (newValue > oldValue) {
              const maxAllowed = Math.min(100, oldValue + DAILY_DEVELOPMENT_LIMIT);
              if (newValue > maxAllowed) {
                _.set(new_variables, `stat_data.赵霞状态.部位进度.${part}`, maxAllowed);
                console.warn(
                  `[MVU监听] 梦境阶段：${part}进度增幅过大 ${oldValue} → ${newValue}，限制为 ${maxAllowed}（每晚上限${DAILY_DEVELOPMENT_LIMIT}%）`,
                );
              }
            } else if (newValue < oldValue) {
              // 不允许降低部位进度（防止AI回滚数值）
              _.set(new_variables, `stat_data.赵霞状态.部位进度.${part}`, oldValue);
              console.warn(`[MVU监听] 梦境阶段：不允许降低${part}进度 ${oldValue} → ${newValue}，已回滚`);
            }
          }
        }

        // BUG-011 修复：验证AI写入的丈夫心理活动，防止思维链泄露
        const newThought = newData.现实数据?.丈夫心理活动;
        const oldThought = oldData.现实数据?.丈夫心理活动;
        if (newThought && newThought !== oldThought) {
          // 检测是否包含AI思维链特征
          const invalidPatterns = [
            /<think>/i,
            /<core_memory>/i,
            /<!--.*-->/,
            /Variable check:/i,
            /Key constraint:/i,
            /So we are in/i,
            /WAIT:/i,
            /writing antThinking/i,
          ];
          const hasInvalidContent = invalidPatterns.some(p => p.test(newThought));
          const isTooLong = newThought.length > 500;
          const chineseChars = (newThought.match(/[\u4e00-\u9fa5]/g) || []).length;
          const chineseRatio = chineseChars / newThought.length;
          const lowChineseRatio = chineseRatio < 0.3 && newThought.length > 50;

          if (hasInvalidContent || isTooLong || lowChineseRatio) {
            // 回滚到旧值或清空
            _.set(new_variables, 'stat_data.现实数据.丈夫心理活动', oldThought ?? '');
            console.warn(
              `[MVU监听] BUG-011修复：检测到AI写入异常的丈夫心理活动（可能是思维链），已回滚`,
              `\n  长度: ${newThought.length}`,
              `\n  中文比例: ${(chineseRatio * 100).toFixed(1)}%`,
              `\n  包含无效标记: ${hasInvalidContent}`,
            );
          }
        }

        return;
      }

      // 纯爱模式：限制部位开发变动幅度，检测错误路线
      const parts = ['嘴巴', '胸部', '下体', '后穴', '精神'] as const;
      let triggeredWrongRoute = false;
      let wrongRoutePart = '';

      for (const part of parts) {
        const oldValue = oldData.赵霞状态?.部位进度?.[part] ?? 0;
        let newValue = newData.赵霞状态?.部位进度?.[part] ?? 0;

        // 1. 限制每次变动不超过 DAILY_DEVELOPMENT_LIMIT
        if (newValue > oldValue) {
          const maxAllowed = oldValue + DAILY_DEVELOPMENT_LIMIT;
          if (newValue > maxAllowed) {
            console.warn(`[MVU监听] ${part}进度变动过大：${oldValue} → ${newValue}，限制为 ${maxAllowed}`);
            newValue = maxAllowed;
            _.set(new_variables, `stat_data.赵霞状态.部位进度.${part}`, newValue);
          }
        }

        // 2. 检测是否达到 100%（触发错误路线）
        if (newValue >= 100 && !triggeredWrongRoute) {
          triggeredWrongRoute = true;
          wrongRoutePart = part;
          // 重置到 50%
          _.set(new_variables, `stat_data.赵霞状态.部位进度.${part}`, WRONG_ROUTE_RESET_VALUE);
          console.warn(`[MVU监听] 纯爱模式错误路线触发：${part} 达到 100%，重置为 ${WRONG_ROUTE_RESET_VALUE}%`);
        }
      }

      // Bug #004 修复：纯爱模式下限制纯爱好感度和纯爱亲密度的增幅
      // 设计：最快第4天才能达到100，每天最大增幅25
      const PURE_LOVE_DAILY_LIMIT = 25;

      // 纯爱好感度增幅限制
      const oldAffection = oldData.赵霞状态?.纯爱好感度 ?? 5;
      const newAffection = newData.赵霞状态?.纯爱好感度 ?? 5;
      if (newAffection > oldAffection) {
        const maxAllowed = Math.min(100, oldAffection + PURE_LOVE_DAILY_LIMIT);
        if (newAffection > maxAllowed) {
          _.set(new_variables, 'stat_data.赵霞状态.纯爱好感度', maxAllowed);
          console.warn(
            `[MVU监听] 纯爱好感度增幅过大：${oldAffection} → ${newAffection}，限制为 ${maxAllowed}（每天上限${PURE_LOVE_DAILY_LIMIT}）`,
          );
        }
      } else if (newAffection < oldAffection) {
        // 不允许降低纯爱好感度
        _.set(new_variables, 'stat_data.赵霞状态.纯爱好感度', oldAffection);
        console.warn(`[MVU监听] 不允许降低纯爱好感度：${oldAffection} → ${newAffection}，已回滚`);
      }

      // 纯爱亲密度增幅限制
      const oldIntimacy = oldData.赵霞状态?.纯爱亲密度 ?? 0;
      const newIntimacy = newData.赵霞状态?.纯爱亲密度 ?? 0;
      if (newIntimacy > oldIntimacy) {
        const maxAllowed = Math.min(100, oldIntimacy + PURE_LOVE_DAILY_LIMIT);
        if (newIntimacy > maxAllowed) {
          _.set(new_variables, 'stat_data.赵霞状态.纯爱亲密度', maxAllowed);
          console.warn(
            `[MVU监听] 纯爱亲密度增幅过大：${oldIntimacy} → ${newIntimacy}，限制为 ${maxAllowed}（每天上限${PURE_LOVE_DAILY_LIMIT}）`,
          );
        }
      } else if (newIntimacy < oldIntimacy) {
        // 不允许降低纯爱亲密度
        _.set(new_variables, 'stat_data.赵霞状态.纯爱亲密度', oldIntimacy);
        console.warn(`[MVU监听] 不允许降低纯爱亲密度：${oldIntimacy} → ${newIntimacy}，已回滚`);
      }

      // 广播错误路线事件
      if (triggeredWrongRoute) {
        broadcastGameEvent({
          type: 'WRONG_ROUTE_TRIGGERED',
          data: {
            part: wrongRoutePart,
            message: `你对${wrongRoutePart}的过度关注引起了赵霞的警觉...`,
            resetTo: WRONG_ROUTE_RESET_VALUE,
          },
        });
      }
    } catch (err) {
      console.error('[MVU监听] 处理变量更新失败:', err);
    }
  });

  let isFirstMessageAfterInit = false;
  const processedEvents = new Set<string>();

  function getSwipeId(messageId: number): number {
    try {
      const chat = SillyTavern.chat;
      if (chat && chat[messageId]) {
        return chat[messageId].swipe_id ?? 0;
      }
    } catch (err) {
      console.warn(`[游戏逻辑] 获取 swipe_id 失败:`, err);
    }
    return 0;
  }

  eventOn(Mvu.events.VARIABLE_INITIALIZED, () => {
    isFirstMessageAfterInit = true;
  });

  async function processGameLogic(message_id: number, eventType: string) {
    try {
      const swipeId = getSwipeId(message_id);
      // Bug #26 修复：将 eventType 加入 messageKey，避免 MESSAGE_RECEIVED 和 GENERATION_ENDED 互相跳过
      // 原因：摘要生成需要在 GENERATION_ENDED 后执行，但之前两个事件使用相同的 key 导致第二个被跳过
      const messageKey = `${message_id}:${swipeId}:${eventType}`;
      console.info(
        `[游戏逻辑] processGameLogic 进入: message_id=${message_id}, swipe_id=${swipeId}, eventType=${eventType}`,
      );

      // BUG-010 修复（二次修正）：移除第一条消息的特殊处理
      // 原修复：第一条消息只执行时间推进然后 return，跳过其他逻辑
      // 问题：如果第一条消息包含安眠药关键词，promptInjection 设置的梦境状态不会被保存
      //       因为数据保存在 processGameLogic 的末尾，但第一条消息提前 return 了
      // 新修复：不再特殊处理第一条消息，让它走完整流程
      //        这样 promptInjection 设置的状态会被正确保存
      if (eventType === 'MESSAGE_RECEIVED' && isFirstMessageAfterInit) {
        isFirstMessageAfterInit = false;
        console.info(`[游戏逻辑] 初始化后的第一条消息: ${message_id}，执行完整处理流程`);
        // 不再 return，继续执行下面的完整流程
      }

      // 去重逻辑 + ROLL时重置梦境选择状态
      if (eventType === 'MESSAGE_SWIPED') {
        // Bug #26 修复：key 格式变为 message_id:swipe_id:eventType，需要匹配所有事件类型
        const keysToRemove = Array.from(processedEvents).filter(key => {
          const parts = key.split(':');
          return parts[0] === String(message_id);
        });
        keysToRemove.forEach(key => processedEvents.delete(key));
        console.info(`[游戏逻辑] ROLL 操作，清除 ${keysToRemove.length} 条旧记录`);

        // ROLL时重置梦境选择状态，让遮罩层重新出现
        const rollVars = Mvu.getMvuData({ type: 'message', message_id: message_id });
        const rollStatData = _.get(rollVars, 'stat_data');
        if (rollStatData?.世界?.游戏阶段 === '梦境' && rollStatData?.世界?.梦境选择已锁定) {
          _.set(rollVars, 'stat_data.世界.梦境选择已锁定', false);

          // 检测当前是场景5还是场景1-4
          const scene5Data = rollStatData.梦境数据?.场景5;
          const isInScene5 = scene5Data?.已进入 === true;

          if (isInScene5) {
            // 场景5：ROLL时回滚步骤进度
            const currentStep = scene5Data?.当前步骤 ?? 0;
            const stepProgressRecord = scene5Data?.步骤进度记录 ?? [];

            // Bug #11 修复：设置 ROLL 标志，防止 promptInjection 再次推进步骤
            // 这个标志会在 CHAT_COMPLETION_PROMPT_READY 处理完成后自动重置
            setRollOperationFlag(true);

            if (currentStep > 0 && stepProgressRecord.length > 0) {
              // 回滚一步：减少当前步骤，移除最后一次的进度增量
              const newStep = currentStep - 1;
              const lastProgressIncrement = stepProgressRecord[stepProgressRecord.length - 1] ?? 0;
              const currentCompletion = scene5Data?.完成度 ?? 0;
              const newCompletion = Math.max(0, currentCompletion - lastProgressIncrement);
              const newProgressRecord = stepProgressRecord.slice(0, -1);

              _.set(rollVars, 'stat_data.梦境数据.场景5.当前步骤', newStep);
              _.set(rollVars, 'stat_data.梦境数据.场景5.完成度', newCompletion);
              _.set(rollVars, 'stat_data.梦境数据.场景5.步骤进度记录', newProgressRecord);
              _.set(rollVars, 'stat_data.梦境数据.场景5.选择部位', []);

              // 如果回滚后低于完成阈值，取消完成标记
              if (newCompletion < 80) {
                _.set(rollVars, 'stat_data.梦境数据.场景5.已完成步骤', false);
              }

              console.info(
                `[游戏逻辑] ROLL 操作，场景5步骤回滚: ${currentStep} → ${newStep}, ` +
                  `完成度: ${currentCompletion}% → ${newCompletion}% (-${lastProgressIncrement}%)`,
              );
            } else {
              // 如果已经是步骤0，只重置选择状态
              _.set(rollVars, 'stat_data.梦境数据.场景5.选择部位', []);
              console.info(`[游戏逻辑] ROLL 操作，场景5已在步骤0，仅重置选择状态`);
            }
          } else {
            // 场景1-4：重置选择部位（使用入口天数，防止跨天后场景编号错误）
            const sceneNum = Math.min(rollStatData.世界._梦境入口天数 ?? rollStatData.世界.当前天数 ?? 1, 4);
            const sceneKey = `场景${sceneNum}`;
            if (rollStatData.梦境数据?.[sceneKey]) {
              _.set(rollVars, `stat_data.梦境数据.${sceneKey}.选择部位`, []);
            }
            console.info(`[游戏逻辑] ROLL 操作，重置场景${sceneNum}选择状态`);
          }

          Mvu.replaceMvuData(rollVars, { type: 'message', message_id: message_id });
        }

        // ROLL 支持：检测摘要生成的 ROLL 操作
        // 如果用户 ROLL 的是摘要生成的那条消息，需要恢复"待生成摘要"标记
        const rollVarsForSummary = Mvu.getMvuData({ type: 'message', message_id: message_id });
        const rollStatDataForSummary = _.get(rollVarsForSummary, 'stat_data');
        const summaryRecord = rollStatDataForSummary?.世界?._摘要生成记录;

        if (summaryRecord && summaryRecord.楼层ID === message_id) {
          const currentSwipeId = getSwipeId(message_id);

          // swipe_id 不同说明是 ROLL 操作
          if (currentSwipeId !== summaryRecord.swipe_id) {
            console.info(
              `[游戏逻辑] 检测到摘要生成 ROLL 操作: 楼层 ${message_id}, ` +
                `swipe_id: ${summaryRecord.swipe_id} → ${currentSwipeId}，恢复待生成摘要标记`,
            );

            // 恢复"待生成摘要"标记
            _.set(rollVarsForSummary, 'stat_data.世界.待生成摘要', {
              sceneNum: summaryRecord.场景编号,
              dreamEntryId: summaryRecord.入口楼层ID,
              dreamExitId: summaryRecord.退出楼层ID,
            });

            // 清除摘要生成记录（避免重复恢复）
            _.set(rollVarsForSummary, 'stat_data.世界._摘要生成记录', undefined);

            // 清除已保存的摘要（因为 ROLL 后需要重新生成）
            const sceneKey = `场景${summaryRecord.场景编号}`;
            if (summaryRecord.场景编号 === 5) {
              _.set(rollVarsForSummary, `stat_data.梦境数据.${sceneKey}.上次剧情摘要`, undefined);
            } else {
              _.set(rollVarsForSummary, `stat_data.梦境数据.${sceneKey}.剧情摘要`, undefined);
            }

            await Mvu.replaceMvuData(rollVarsForSummary, { type: 'message', message_id: message_id });
            console.info(
              `[游戏逻辑] 摘要 ROLL 处理完成，场景${summaryRecord.场景编号}的摘要将在下次 GENERATION_ENDED 时重新生成`,
            );
          }
        }
      } else {
        if (processedEvents.has(messageKey)) {
          console.info(`[游戏逻辑] 跳过已处理的消息: ${messageKey}`);
          return;
        }
      }

      processedEvents.add(messageKey);

      // 清理旧记录
      if (processedEvents.size > 100) {
        const oldestKeys = Array.from(processedEvents).slice(0, processedEvents.size - 100);
        oldestKeys.forEach(key => processedEvents.delete(key));
      }

      // 根据事件类型决定目标楼层
      // GENERATION_ENDED: 已经在事件监听器中使用 getLastMessageId()，这里直接用传入ID
      // MESSAGE_RECEIVED: 操作新创建的楼层（传入ID）
      // MESSAGE_SWIPED: 操作被ROLL的楼层（传入ID）
      // 这样每个楼层都有独立的时间，不会互相影响
      const targetMessageId = message_id;
      const actualLastId = getLastMessageId();

      console.info(`[游戏逻辑] 目标楼层=${targetMessageId}, 最新楼层=${actualLastId}, 事件类型=${eventType}`);

      // 读取变量
      const currentVars = Mvu.getMvuData({ type: 'message', message_id: targetMessageId });
      const statData = _.get(currentVars, 'stat_data');

      if (!statData) {
        console.warn('[游戏逻辑] stat_data 不存在');
        return;
      }

      // CRITICAL: 深拷贝数据，防止修改影响其他楼层
      const data = Schema.parse(JSON.parse(JSON.stringify(statData)));

      // 获取对话消息
      let userText = '';
      let aiText = '';
      try {
        const lastMessages = getChatMessages(-1);
        const prevMessages = getChatMessages(-2);
        const lastMessage = lastMessages.length > 0 ? lastMessages[0] : null;
        const userMessage = prevMessages.length > 0 ? prevMessages[0] : null;
        userText = userMessage && userMessage.role === 'user' ? (userMessage.message ?? '') : '';
        aiText = lastMessage && lastMessage.role === 'assistant' ? (lastMessage.message ?? '') : '';
      } catch (msgErr) {
        console.warn('[游戏逻辑] 获取消息失败:', msgErr);
      }

      console.info(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.info(`[游戏逻辑] 开始处理楼层 ${targetMessageId}`);
      console.info(`当前时间: ${data.世界.时间}`);
      console.info(`当前路线: ${getCurrentRouteType(data)}`);
      console.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // 执行核心逻辑（按顺序）

      // 0. 检查上一轮是否有梦境退出，如果有则转换为摘要生成标记
      // Bug #19 修复：MVU数据可能没有正确继承，需要从上一楼层检查
      let exitInfo = data.世界.上一轮梦境已退出;

      // 如果当前楼层没有退出标记，尝试从上一楼层读取
      // 这是因为MVU的optional字段可能在新楼层创建时丢失
      if (!exitInfo && targetMessageId > 0) {
        try {
          const prevVars = Mvu.getMvuData({ type: 'message', message_id: targetMessageId - 1 });
          const prevStatData = _.get(prevVars, 'stat_data');
          if (prevStatData?.世界?.上一轮梦境已退出) {
            exitInfo = prevStatData.世界.上一轮梦境已退出;
            console.info(
              `[游戏逻辑] Bug #19 修复：从上一楼层(${targetMessageId - 1})恢复退出标记，` +
                `场景${exitInfo.sceneNum}，楼层ID: ${exitInfo.dreamEntryId}`,
            );
          }
        } catch (err) {
          console.warn('[游戏逻辑] 读取上一楼层退出标记失败:', err);
        }
      }

      if (exitInfo) {
        console.info(
          `[游戏逻辑] 检测到上一轮场景${exitInfo.sceneNum}退出，本轮开始生成摘要（入口ID: ${exitInfo.dreamEntryId}，退出ID: ${exitInfo.dreamExitId ?? '未知'}）`,
        );
        data.世界.待生成摘要 = {
          sceneNum: exitInfo.sceneNum,
          dreamEntryId: exitInfo.dreamEntryId,
          dreamExitId: exitInfo.dreamExitId, // Bug #25：传递退出楼层ID
        };
        data.世界.上一轮梦境已退出 = undefined; // 清除标记
      }

      // Bug #005 修复：危险内容检测已移至 promptInjection.ts（AI生成前执行）
      // 这样可以在 AI 生成前替换用户输入，而不是在生成后才处理

      // 1. 检测时间跳过请求（始终禁止跳过，显示MVU提示）
      const timeSkipResult = TimeSystem.processTimeSkipRequest(data, userText);
      if (timeSkipResult.processed && timeSkipResult.blocked) {
        // 显示MVU提示：时间跳过被阻止
        if (timeSkipResult.mvuMessage) {
          console.warn(`[游戏逻辑] ${timeSkipResult.mvuMessage}`);
          toastr.warning(timeSkipResult.mvuMessage, '时间系统', { timeOut: 4000 });
        }
      }

      // 1.4. 检测场景5进入（基于用户输入关键词）
      const SLEEPING_PILL_KEYWORDS = ['安眠药', '吃药', '服药', '催眠药'];
      const wantEnterScene5 =
        SLEEPING_PILL_KEYWORDS.some(kw => userText.includes(kw)) &&
        (data.世界.游戏阶段 === '日常' || data.世界.游戏阶段 === '序章') &&
        data.世界.当前小时 >= 8 &&
        data.世界.当前小时 < 20;

      // 防逃避机制：如果混乱结局已标记且到达触发时间，阻止进入梦境
      const canEnterScene5ForConfusion = canEnterDreamForConfusion(data);
      if (wantEnterScene5 && !canEnterScene5ForConfusion) {
        console.warn('[游戏逻辑] 混乱结局待触发，阻止进入场景5');
        // 不进入梦境，让混乱结局在结局判定中触发
      }

      const shouldEnterScene5 = wantEnterScene5 && canEnterScene5ForConfusion;

      if (shouldEnterScene5) {
        console.info('[游戏逻辑] 检测到场景5进入关键词，切换到梦境阶段');
        data.世界.游戏阶段 = '梦境';
        data.世界.状态栏需要刷新 = true;
        data.世界._梦境入口消息ID = targetMessageId;
        data.世界._梦境入口天数 = data.世界.当前天数; // 锁定进入时的天数（场景5固定）
        data.世界.梦境选择已锁定 = false;
        updateSnapshotValue('世界.游戏阶段', '梦境'); // 同步更新快照

        if (!data.世界.已进入过梦境) {
          data.世界.已进入过梦境 = true;
        }

        // 初始化场景5数据
        const existingScene5Data = data.梦境数据.场景5 as
          | { 已进入?: boolean; 进入时间?: string; 进入次数?: number }
          | undefined;
        if (!data.梦境数据.场景5) {
          (data.梦境数据 as any).场景5 = {};
        }

        const scene5Data = data.梦境数据.场景5 as any;
        const newEntryCount = (existingScene5Data?.进入次数 ?? 0) + 1;
        scene5Data.已进入 = true;
        scene5Data.进入时间 = data.世界.时间;
        scene5Data.进入次数 = newEntryCount;

        // Bug #13 修复：保存进入前的混乱度和混乱标记（用于试探性进入回滚）
        // 每次进入都保存，因为玩家可能多次试探性进入
        scene5Data.进入前混乱度 = data.梦境数据.记忆混乱度;
        scene5Data.进入前混乱标记 = JSON.parse(JSON.stringify(data.梦境数据.混乱结局));
        console.info(
          `[游戏逻辑] 场景5进入前状态已保存：混乱度=${data.梦境数据.记忆混乱度}，混乱标记=${data.梦境数据.混乱结局.已标记}`,
        );

        // 首次进入时初始化12步系统数据
        // Bug #13 修复：移除 lockScene5EntryCoherence()，改为完成时再锁定
        if (newEntryCount === 1) {
          scene5Data.当前步骤 = 0;
          scene5Data.完成度 = 0;
          scene5Data.步骤进度记录 = [];
          scene5Data.已完成步骤 = false;
          // 不再在此处锁定连贯性，改为完成时锁定
          console.info(`[游戏逻辑] 场景5首次进入，初始化12步剧情系统（连贯性将在完成时锁定）`);
        }

        // 设置进入场景5时的混乱度（固定为80）
        setConfusionOnDreamEntry(data, 5);
        // Bug #31 修复：混乱度修改后同步更新快照，防止被 validateAndRestoreData 误还原
        updateSnapshotValue('梦境数据.记忆混乱度', data.梦境数据.记忆混乱度);
        console.info(
          `[游戏逻辑] 进入场景5，第${newEntryCount}次，楼层ID=${targetMessageId}，混乱度=${data.梦境数据.记忆混乱度}`,
        );

        // ROLL 支持：记录场景5入口的楼层ID
        // 当用户 ROLL 入口消息时，游戏阶段已经是"梦境"，promptInjection 的正常检测会失败
        // 记录 AI 回复的楼层（targetMessageId + 1），用于在 PROMPT_READY 中检测 ROLL
        // 注意：这里 targetMessageId 是用户消息楼层，AI 回复楼层是 targetMessageId + 1
        const scene5AiReplyFloor = targetMessageId + 1;
        data.世界._梦境入口记录 = {
          楼层ID: scene5AiReplyFloor,
          场景编号: 5,
          类型: '场景5',
        };
        console.info(`[游戏逻辑] 记录场景5入口: 楼层 ${scene5AiReplyFloor} (AI回复)`);
      }

      // Bug #27 修复：时间推进只在 MESSAGE_RECEIVED 事件中执行
      // 原因：Bug #26 修复后 MESSAGE_RECEIVED 和 GENERATION_ENDED 都会处理，
      // 如果两个事件都推进时间，会导致时间跳两次（如 8→9→10）
      // ROLL (MESSAGE_SWIPED) 时也不推进时间，保持当前楼层的时间
      if (eventType === 'MESSAGE_RECEIVED') {
        const timeBeforeAdvance = data.世界.时间; // 记录推进前的时间
        TimeSystem.advance(data, 1);
        const timeAfterAdvance = data.世界.时间; // 记录推进后的时间

        // BUG-007/008/009 修复：推进后验证时间一致性
        TimeSystem.validateAndFixTimeConsistency(data);

        // 时间推进检测：在脚本处理后检测时间是否正确推进
        // 只对最新楼层进行检测，避免查看历史楼层时误报
        if (targetMessageId === getLastMessageId()) {
          const timeCheck = TimeSystem.checkTimeAdvancementAfterScript(
            timeBeforeAdvance,
            timeAfterAdvance,
            targetMessageId,
          );
          if (timeCheck.shouldWarn && timeCheck.message) {
            toastr.warning(timeCheck.message, '时间系统', { timeOut: 6000 });
          }
        }
      } else if (eventType === 'MESSAGE_SWIPED') {
        console.info('[游戏逻辑] MESSAGE_SWIPED: 跳过时间推进，保持当前时间');
      } else {
        console.info('[游戏逻辑] GENERATION_ENDED: 跳过时间推进，已在 MESSAGE_RECEIVED 中处理');
      }

      // 1.5. 时间推进后检查场景5退出（20:00强制结束）
      // Bug #13 修复后的流程：
      // - promptInjection 在 19:00 时就触发退出，注入出梦描写指令
      // - AI 生成出梦描写
      // - 时间推进到 20:00
      // - 此处检测到 20:00，执行状态切换和摘要标记
      if (data.世界.游戏阶段 === '梦境') {
        const scene5Data = data.梦境数据.场景5 as { 已进入?: boolean } | undefined;
        const isInScene5 = scene5Data?.已进入 === true;

        if (isInScene5 && data.世界.当前小时 === 20) {
          console.info('[游戏逻辑] 时间推进后检测到20:00，执行场景5状态切换');
          data.世界.游戏阶段 = '日常';
          data.世界.状态栏需要刷新 = true;
          updateSnapshotValue('世界.游戏阶段', '日常'); // 同步更新快照

          // Bug #28 修复：梦境退出后更新赵霞的位置和心理活动
          // 确保真相模式状态栏显示正确的数据，而不是进入梦境前的旧值
          updateZhaoxiaLocation(data);
          updateZhaoxiaThoughtAfterDream(data);

          // 使用场景5的新12步完成度系统判定是否完成
          const completion = calculateScene5CompletionNew(data);
          const scene5 = data.梦境数据.场景5 as any;

          // Bug #13 修复：试探性进入机制
          // 完成度 100% = 正式完成，锁定连贯性
          // 完成度 < 100% = 试探性进入，回滚混乱度和混乱标记
          if (completion.completionPercent >= 100) {
            // 正式完成：锁定连贯性，加入已完成列表
            if (!data.梦境数据.已完成场景.includes(5)) {
              data.梦境数据.已完成场景.push(5);
            }
            // 此时锁定记忆连贯性（基于当前已完成的场景1-2-3）
            lockScene5EntryCoherence(data);
            console.info(`[游戏逻辑] 场景5正式完成（100%），记忆连贯性已锁定为 ${data.梦境数据.场景5进入时连贯性}`);
          } else {
            // 试探性进入：回滚混乱度和混乱标记
            if (scene5?.进入前混乱度 !== undefined) {
              const oldConfusion = data.梦境数据.记忆混乱度;
              data.梦境数据.记忆混乱度 = scene5.进入前混乱度;
              console.info(`[游戏逻辑] 试探性进入：回滚混乱度 ${oldConfusion} → ${scene5.进入前混乱度}`);
            }
            if (scene5?.进入前混乱标记) {
              const wasMarked = data.梦境数据.混乱结局.已标记;
              data.梦境数据.混乱结局 = JSON.parse(JSON.stringify(scene5.进入前混乱标记));
              console.info(`[游戏逻辑] 试探性进入：回滚混乱标记 ${wasMarked} → ${scene5.进入前混乱标记.已标记}`);
            }
            console.info(
              `[游戏逻辑] 场景5试探性进入（完成度${completion.completionPercent}%<100%），已回滚状态，连贯性未锁定`,
            );
          }

          // 重置场景5的"已进入"标记，允许下次重新进入
          if (scene5) {
            scene5.已进入 = false;
          }

          console.info(
            `[游戏逻辑] 退出场景5（20:00），` +
              `完成度: ${completion.completionPercent}%，` +
              `步骤: ${completion.currentStep}/12，` +
              `状态: ${completion.completionPercent >= 100 ? '正式完成(100%)' : '试探性进入(<100%)'}`,
          );

          // 设置"上一轮退出"标记，摘要将在下一轮对话时生成
          // 这样可以让玩家先看到20:00的醒来场景，再生成摘要
          let scene5DreamEntryId = data.世界._梦境入口消息ID;

          // Bug #19 修复：如果 _梦境入口消息ID 丢失，估算入口楼层
          if (scene5DreamEntryId === undefined) {
            // 场景5在白天进行，持续约12步，估算约10-15轮对话
            const estimatedEntryId = Math.max(0, targetMessageId - 12);
            console.warn(
              `[游戏逻辑] Bug #19 修复：场景5 _梦境入口消息ID 丢失，估算入口楼层为 ${estimatedEntryId}（当前楼层 ${targetMessageId}）`,
            );
            scene5DreamEntryId = estimatedEntryId;
          }

          if (scene5DreamEntryId !== undefined) {
            // Bug #25 修复：记录退出时的楼层ID，用于限制摘要收集范围
            const scene5DreamExitId = targetMessageId; // 退出时的当前楼层
            data.世界.上一轮梦境已退出 = {
              sceneNum: 5,
              dreamEntryId: scene5DreamEntryId,
              dreamExitId: scene5DreamExitId, // Bug #25：添加退出楼层ID
            };
            console.info(
              `[游戏逻辑] 场景5退出，已标记上一轮退出（入口ID: ${scene5DreamEntryId}，退出ID: ${scene5DreamExitId}），摘要将在下一轮生成`,
            );
          } else {
            console.warn(`[游戏逻辑] 场景5退出但找不到楼层ID，无法设置退出标记`);
          }
        }
      }

      // 创建数据快照（在时间推进之后，保护关键字段不被AI篡改）
      // 重要：必须在时间推进之后创建快照，否则时间更新会被误认为是AI篡改而回滚
      createDataSnapshot(data);

      // 2. 状态验证和修正（数值范围、境界自动更新）
      const 验证结果 = validateAndFixState(data);
      if (验证结果.fixed) {
        console.info(`[游戏逻辑] 状态已自动修正，共 ${验证结果.changes.length} 项变更`);
      }

      // 3. 检测境界变化
      const 境界变化 = checkRealmChange(data);
      if (境界变化.changed) {
        const 已进入过梦境 = data.世界.已进入过梦境;
        const 境界名 = getRealmTitle(境界变化.newRealm, 已进入过梦境);
        const 风格信息 = getStyleGuidance(境界变化.newRealm, 已进入过梦境);
        console.info(
          `[游戏逻辑] 境界提升: ${境界变化.oldRealm} → ${境界变化.newRealm}\n` +
            `  境界名: ${境界名}\n` +
            `  模式: ${已进入过梦境 ? '真相模式' : '纯爱模式'}\n` +
            `  风格: ${风格信息.整体风格}\n` +
            `  气质: ${风格信息.气质关键词.join('、')}`,
        );
      }

      // 4. 境界打断检测 - 已移至 promptInjection.ts 中处理
      // 打断系统属于"系统A：事件触发系统"，需要在 AI 生成前替换用户消息
      // 因此打断检测和惩罚应用都在 CHAT_COMPLETION_PROMPT_READY 事件中执行
      // 参见 promptInjection.ts 的 generateFullInjection() 函数

      // 5. 梦境中的部位开发检测
      // 【2026-01-17 更新】实现 AI 报告二次验证
      // - 优先使用玩家输入的关键词检测
      // - 如果玩家输入无关键词但有互动意图，采纳 AI 的 BODY_PROGRESS 报告
      // - 如果玩家输入完全无关，忽略 AI 报告
      // - 排除场景5（场景5是剧情场景，有自己的完成度系统）
      // - 目标：4天晚上把全部数值做到80-100%
      const isInScene5 = data.梦境数据.场景5?.已进入 === true;
      if (data.世界.游戏阶段 === '梦境' && !isInScene5) {
        // 使用二次验证函数处理玩家输入和AI报告
        const validatedProgress = validateAndProcessAIReport(userText || '', aiText || '');

        const hasProgress = Object.values(validatedProgress).some(v => v > 0);
        if (hasProgress) {
          updateBodyPartProgress(data, validatedProgress);
          console.info(`[游戏逻辑] 梦境部位开发更新完成（二次验证后）`);
        }
      }

      // 5.5 真相模式数值自动更新（依存度 = 部位进度平均值）
      // 只在真相模式下执行，纯爱模式由AI控制数值
      // ⚠️ 重要：只在【日常阶段】更新，梦境中不更新（梦境有自己的数值体系）
      if (data.世界.已进入过梦境 && data.世界.游戏阶段 === '日常') {
        updateTruthModeValues(data);
      }

      // 6. 更新丈夫位置
      updateHusbandLocation(data);

      // 6.5 更新丈夫怀疑度（基于服装、妆容、亲密行为、境界外显）
      // 只在日常阶段检测，梦境中不检测
      // Bug #14 修复：传入玩家输入（userText）而非AI回复（aiText）
      // 原因：AI回复可能包含梦境回忆等不应触发怀疑的内容
      // Bug #XX 修复：Day 5+ 豁免怀疑度更新（结局日不再触发怀疑度系统）
      // Bug #002 修复：添加梦境退出豁免期，避免退出后立即触发怀疑度增加
      // 原因：玩家从梦境醒来的第一轮，AI描写过渡场景时不应触发怀疑度系统
      const isDreamExitMessage = data.世界.上一轮梦境已退出 !== undefined;
      if (isDreamExitMessage) {
        console.info(`[游戏逻辑] 梦境退出豁免期：跳过怀疑度更新（上一轮刚退出梦境）`);
      }
      const shouldSkipSuspicion = data.世界.当前天数 >= 5 || isDreamExitMessage;
      if (data.世界.游戏阶段 === '日常' && data.世界.已进入过梦境 && !shouldSkipSuspicion) {
        // Bug #005 修复：先尝试降低怀疑度（与苏文相处），再计算增加
        // 这样玩家可以通过与苏文互动来抵消部分怀疑度增加
        applySuspicionDecrease(data, userText);

        const newSuspicion = updateSuspicionLevel(data, userText);

        // Bug #24 修复：怀疑度达到100时立即触发坏结局，不等到结局判定时间
        // 设计意图：被丈夫发现是即时的，不应该给玩家额外的回合
        if (newSuspicion >= 100 && data.结局数据.当前结局 === '未触发') {
          data.结局数据.当前结局 = '坏结局';
          data.世界.循环状态 = '结局判定';
          data.结局数据.结局触发时间 = TimeSystem.getCurrentTime(data);
          // 同步更新快照，防止被数据保护系统误判为篡改
          updateSnapshotValue('结局数据.当前结局', '坏结局');
          updateSnapshotValue('世界.循环状态', '结局判定');
          console.warn('[游戏逻辑] ⚠️ 丈夫怀疑度达到100，立即触发坏结局（被丈夫发现）');
        }
      }

      // 7. 检测梦境事件
      checkDreamEvents(data, userText, targetMessageId);

      // 8. 苦主视角解析（从AI回复中提取，真相模式专属）
      // Bug #7 修复：无论是否满足苦主视角条件，都要移除 <HusbandThought> 标签
      // 原因：即使在梦境中AI不应该生成，也可能误生成，需要清理防止显示在正文中
      // Bug #10 修复：同时移除 <!--BODY_PROGRESS: ...--> 标记，防止显示在正文中
      if (aiText) {
        const husbandThought = parseHusbandThought(aiText);

        // 先移除标签，防止显示在正文中（无条件执行）
        // 移除 <HusbandThought> 和 <!--BODY_PROGRESS: ...--> 两种标记
        const cleanedAiText = aiText
          .replace(/<HusbandThought>[\s\S]*?<\/HusbandThought>/gi, '')
          .replace(/<!--\s*BODY_PROGRESS:\s*[^-]*?-->/gi, '')
          .trim();
        if (cleanedAiText !== aiText) {
          try {
            // Bug 修复：使用 getLastMessageId() 获取 AI 回复的正确楼层 ID
            // 原因：targetMessageId 可能是用户消息楼层，而不是 AI 回复楼层
            // aiText 来自 getChatMessages(-1)，所以应该用最后一条消息的 ID
            const aiMessageId = getLastMessageId();
            await setChatMessages([{ message_id: aiMessageId, message: cleanedAiText }], { refresh: 'affected' });
            console.info(`[游戏逻辑] 已从AI文本中移除内部标记（HusbandThought/BODY_PROGRESS），楼层=${aiMessageId}`);
          } catch (err) {
            console.warn('[游戏逻辑] 移除内部标记失败:', err);
          }
        }

        // Bug 修复：只要解析到苦主视角内容，就存储到数据中
        // 原因：避免状态栏显示固定模板，应该始终使用AI生成的内容
        // 状态栏组件会根据 shouldGenerateHusbandThought 决定是否显示
        if (husbandThought) {
          // 存储到数据中（无条件存储）
          data.现实数据.丈夫心理活动 = husbandThought;
          console.info(`[游戏逻辑] 解析到苦主视角: ${husbandThought}`);

          // 只在满足条件时广播事件到前端
          if (shouldGenerateHusbandThought(data)) {
            broadcastGameEvent({
              type: 'HUSBAND_PERSPECTIVE',
              data: {
                text: husbandThought,
                realm: data.赵霞状态.当前境界,
                suspicionLevel: data.现实数据.丈夫怀疑度,
              },
            });
          } else {
            console.info('[游戏逻辑] AI生成了苦主视角，已存储但当前不满足显示条件');
          }
        }
      }

      // 9. 结局判定
      const 已触发结局 = checkEnding(data);

      // 10. 真好结局AI回复后处理（锚点检测和阶段推进）
      // Bug #40 修复：正确处理时间锁定，阶段推进必须等待对应时间窗口
      if (isTrueEndingActive(data) && aiText) {
        const state = getTrueEndingState(data);
        if (!state.isComplete) {
          const currentHour = data.世界.当前小时;

          // 使用processTurnEnd处理AI回复，检测锚点事件，传入当前小时用于时间检查
          const result = processTurnEnd(state, aiText, userText, currentHour);
          let finalState = result.newState;

          // Bug #40 修复：先检查时间锁定，再决定是否推进
          // 如果被时间锁定，不推进阶段，只更新锚点和轮数
          if (result.timeBlocked) {
            console.info(
              `[游戏逻辑] 真好结局阶段${finalState.currentPhase}已完成条件，但时间锁定：${result.timeBlocked.reason}`,
            );
            console.info(
              `[游戏逻辑] 真好结局锚点更新: 阶段${finalState.currentPhase}, ` +
                `锚点[${finalState.completedAnchors.join(', ')}]`,
            );
          } else if (result.phaseAdvanced) {
            // processTurnEnd 已经推进了阶段
            console.info(`[游戏逻辑] 真好结局阶段推进: ${state.currentPhase} → ${finalState.currentPhase}`);

            // 检查是否完成全部阶段
            if (finalState.isComplete) {
              data.结局数据.后日谈已解锁 = true;
              data.世界.循环状态 = '已破解';
              console.info('[游戏逻辑] 🎊 真好结局完成！后日谈已解锁');
            }
          } else {
            console.info(
              `[游戏逻辑] 真好结局锚点更新: 阶段${finalState.currentPhase}, ` +
                `锚点[${finalState.completedAnchors.join(', ')}]`,
            );
          }

          // 更新状态
          updateTrueEndingState(data, finalState);
        }
      }

      // 11. 假好结局AI回复后处理（锚点检测和阶段推进）
      // Bug #40 修复：正确处理时间锁定，阶段推进必须等待对应时间窗口
      if (isFalseEndingActive(data) && aiText) {
        const state = getFalseEndingState(data);
        if (!state.isComplete) {
          const currentHour = data.世界.当前小时;

          // 使用processTurnEnd处理AI回复，检测锚点事件，传入当前小时用于时间检查
          const result = processFalseEndingTurnEnd(state, aiText, userText, currentHour);
          let finalState = result.newState;

          // Bug #40 修复：先检查时间锁定，再决定是否推进
          // 如果被时间锁定，不推进阶段，只更新锚点和轮数
          if (result.timeBlocked) {
            console.info(
              `[游戏逻辑] 假好结局阶段${finalState.currentPhase}已完成条件，但时间锁定：${result.timeBlocked.reason}`,
            );
            console.info(
              `[游戏逻辑] 假好结局锚点更新: 阶段${finalState.currentPhase}, ` +
                `锚点[${finalState.completedAnchors.join(', ')}]`,
            );
          } else if (result.phaseAdvanced) {
            // processTurnEnd 已经推进了阶段
            console.info(`[游戏逻辑] 假好结局阶段推进: ${state.currentPhase} → ${finalState.currentPhase}`);

            // 检查是否完成全部阶段
            if (finalState.isComplete) {
              console.info('[游戏逻辑] 🎭 假好结局完成！秘密关系确立');
            }
          } else {
            console.info(
              `[游戏逻辑] 假好结局锚点更新: 阶段${finalState.currentPhase}, ` +
                `锚点[${finalState.completedAnchors.join(', ')}]`,
            );
          }

          // 更新状态
          updateFalseEndingState(data, finalState);
        }
      }

      // 12. 完美真爱结局AI回复后处理（锚点检测和阶段推进）
      // Bug #40 修复：正确处理时间锁定，阶段推进必须等待对应时间窗口
      if (isPerfectEndingActive(data) && aiText) {
        const state = getPerfectEndingState(data);
        if (!state.isComplete) {
          const currentHour = data.世界.当前小时;

          // 使用processPerfectTurnEnd处理AI回复，检测锚点事件，传入当前小时用于时间检查
          const result = processPerfectTurnEnd(state, aiText, userText, currentHour);
          let finalState = result.newState;

          // Bug #40 修复：先检查时间锁定，再决定是否推进
          // 如果被时间锁定，不推进阶段，只更新锚点和轮数
          if (result.timeBlocked) {
            console.info(
              `[游戏逻辑] 完美真爱结局阶段${finalState.currentPhase}已完成条件，但时间锁定：${result.timeBlocked.reason}`,
            );
            console.info(
              `[游戏逻辑] 完美真爱结局锚点更新: 阶段${finalState.currentPhase}, ` +
                `锚点[${finalState.completedAnchors.join(', ')}]`,
            );
          } else if (result.phaseAdvanced) {
            // processPerfectTurnEnd 已经推进了阶段
            console.info(`[游戏逻辑] 完美真爱结局阶段推进: ${state.currentPhase} → ${finalState.currentPhase}`);

            // 检查是否完成全部阶段（12个阶段，0-11）
            if (finalState.isComplete) {
              data.结局数据.后日谈已解锁 = true;
              data.世界.循环状态 = '已破解';
              console.info('[游戏逻辑] 💕 完美真爱结局完成！后日谈已解锁');
            }
          } else {
            console.info(
              `[游戏逻辑] 完美真爱结局锚点更新: 阶段${finalState.currentPhase}, ` +
                `锚点[${finalState.completedAnchors.join(', ')}]`,
            );
          }

          // 更新状态
          updatePerfectEndingState(data, finalState);
        }
      }

      // 7. 时间系统验证（调试用）
      if (data.调试?.启用调试日志) {
        TimeSystem.validate(data);
      }

      // 数据保护：验证并还原被AI篡改的数据
      const protectionResult = validateAndRestoreData(data);
      if (protectionResult.detected) {
        console.warn(`[游戏逻辑] 数据保护系统检测到 ${protectionResult.tamperedFields.length} 个字段被篡改并已还原`);
        if (data.调试?.启用调试日志) {
          console.info(generateProtectionReport(protectionResult));
        }
      }

      // 验证并写入
      const validatedData = Schema.parse(data);

      // CRITICAL: 深拷贝 currentVars，避免修改引用影响其他楼层
      const newVars = JSON.parse(JSON.stringify(currentVars));
      _.set(newVars, 'stat_data', validatedData);
      await Mvu.replaceMvuData(newVars, { type: 'message', message_id: targetMessageId });

      console.info(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.info(`[游戏逻辑] 数据已写入楼层 ${targetMessageId}`);
      console.info(`最新时间: ${validatedData.世界.时间}`);
      console.info(`当前路线: ${getCurrentRouteType(validatedData)}`);
      console.info(`当前境界: ${validatedData.赵霞状态.当前境界}`);
      console.info(`依存度: ${validatedData.赵霞状态.依存度}`);
      console.info(`丈夫怀疑度: ${validatedData.现实数据.丈夫怀疑度}`);
      console.info(`记忆混乱度: ${validatedData.梦境数据.记忆混乱度}`);
      console.info(`循环状态: ${validatedData.世界.循环状态}`);
      if (已触发结局) {
        console.info(`🎬 结局: ${validatedData.结局数据.当前结局}`);
      }
      console.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // ============================================
      // 8. 检查并生成梦境摘要
      // 简化设计：直接保存玩家行为记录作为摘要，不再调用 generateRaw API
      // ============================================
      if (validatedData.世界.待生成摘要 && eventType === 'GENERATION_ENDED') {
        const summaryInfo = validatedData.世界.待生成摘要;
        console.info(
          `[游戏逻辑] 检测到待生成摘要标记，场景${summaryInfo.sceneNum}，入口: ${summaryInfo.dreamEntryId}，退出: ${summaryInfo.dreamExitId ?? '未知'}`,
        );

        try {
          // 获取梦境期间的玩家输入（Bug #25 修复：传递退出楼层ID，限制收集范围）
          const chatHistory = await getDreamSessionMessages(summaryInfo.dreamEntryId, summaryInfo.dreamExitId);
          console.info(`[游戏逻辑] 获取到玩家行为记录: ${chatHistory.length}字符`);

          // 生成摘要（直接使用玩家输入，不再调用 API）
          const summary = await generateMemorySummary(validatedData, summaryInfo.sceneNum, chatHistory);

          // 保存摘要到场景数据
          const sceneKey = `场景${summaryInfo.sceneNum}` as keyof typeof validatedData.梦境数据;
          const sceneData = validatedData.梦境数据[sceneKey];
          if (sceneData && typeof sceneData === 'object') {
            if (summaryInfo.sceneNum === 5) {
              (sceneData as any).上次剧情摘要 = summary;
            } else {
              (sceneData as any).剧情摘要 = summary;
            }
          }

          // 清除待生成摘要标记
          validatedData.世界.待生成摘要 = undefined;

          // ROLL 支持：记录摘要生成的楼层ID和swipe_id
          // 当用户 ROLL 这条消息时，需要检测并恢复"待生成摘要"标记
          const summarySwipeId = getSwipeId(targetMessageId);
          validatedData.世界._摘要生成记录 = {
            楼层ID: targetMessageId,
            swipe_id: summarySwipeId,
            场景编号: summaryInfo.sceneNum,
            入口楼层ID: summaryInfo.dreamEntryId,
            退出楼层ID: summaryInfo.dreamExitId,
          };
          console.info(
            `[游戏逻辑] 记录摘要生成: 楼层${targetMessageId}, swipe_id=${summarySwipeId}, 场景${summaryInfo.sceneNum}`,
          );

          // 写入数据
          const finalVars = JSON.parse(JSON.stringify(currentVars));
          _.set(finalVars, 'stat_data', validatedData);
          await Mvu.replaceMvuData(finalVars, { type: 'message', message_id: targetMessageId });

          console.info(`[游戏逻辑] 场景${summaryInfo.sceneNum}摘要已保存（${summary.length}字），标记已清除`);
        } catch (summaryErr) {
          console.error('[游戏逻辑] 生成摘要失败:', summaryErr);
          // 即使失败也要清除标记
          validatedData.世界.待生成摘要 = undefined;
          const finalVars = JSON.parse(JSON.stringify(currentVars));
          _.set(finalVars, 'stat_data', validatedData);
          await Mvu.replaceMvuData(finalVars, { type: 'message', message_id: targetMessageId });
        }
      }

      // 验证写入结果
      const verifyVars = Mvu.getMvuData({ type: 'message', message_id: targetMessageId });
      const verifyData = _.get(verifyVars, 'stat_data');
      const expectedTime = TimeSystem.getCurrentTime(validatedData);

      if (verifyData?.世界?.时间 !== expectedTime) {
        console.error('[游戏逻辑] ⚠️ 时间写入不一致');
        console.error(`期望: ${expectedTime}`);
        console.error(`实际: ${verifyData?.世界?.时间}`);
      } else {
        console.info(`[游戏逻辑] ✅ ${eventType} 处理完成`);
      }
    } catch (err) {
      console.error('[游戏逻辑] 执行错误:', err);
    }
  }

  // 监听新消息接收事件
  eventOn(tavern_events.MESSAGE_RECEIVED, message_id => {
    const id = Number(message_id);
    console.info(`[游戏逻辑] 收到 MESSAGE_RECEIVED 事件，message_id=${id}`);
    setTimeout(() => {
      processGameLogic(id, 'MESSAGE_RECEIVED');
    }, 300);
  });

  // 监听消息ROLL事件
  eventOn(tavern_events.MESSAGE_SWIPED, message_id => {
    const id = Number(message_id);
    console.info(`[游戏逻辑] 收到 MESSAGE_SWIPED 事件，message_id=${id}`);
    setTimeout(() => {
      processGameLogic(id, 'MESSAGE_SWIPED');
    }, 300);
    // [修复] 禁用全局刷新，避免旧楼层状态栏被刷新为最新数据
    // setTimeout(() => {
    //   console.info('[游戏逻辑] 广播 IFRAME_DATA_REFRESH 事件 (MESSAGE_SWIPED)');
    //   eventEmit('IFRAME_DATA_REFRESH', { reason: 'MESSAGE_SWIPED', message_id: id });
    // }, 500);
  });

  // 监听消息删除事件
  eventOn(tavern_events.MESSAGE_DELETED, message_id => {
    const id = Number(message_id);
    console.info(`[游戏逻辑] 收到 MESSAGE_DELETED 事件，message_id=${id}`);

    const keysToRemove = Array.from(processedEvents).filter(key => {
      const keyMessageId = parseInt(key.split(':')[0], 10);
      return keyMessageId >= id;
    });
    if (keysToRemove.length > 0) {
      keysToRemove.forEach(key => processedEvents.delete(key));
      console.info(`[游戏逻辑] MESSAGE_DELETED 清除 ${keysToRemove.length} 条处理记录`);
    }

    // [修复] 禁用全局刷新，避免旧楼层状态栏被刷新为最新数据
    // setTimeout(() => {
    //   console.info('[游戏逻辑] 广播 IFRAME_DATA_REFRESH 事件 (MESSAGE_DELETED)');
    //   eventEmit('IFRAME_DATA_REFRESH', { reason: 'MESSAGE_DELETED', message_id: id });
    // }, 300);
  });

  // 监听生成结束事件
  eventOn(tavern_events.GENERATION_ENDED, message_id => {
    console.info(`[游戏逻辑] 收到 GENERATION_ENDED 事件，原始 message_id=${message_id}`);
    setTimeout(() => {
      try {
        const actualMessageId = getLastMessageId();
        console.info(`[游戏逻辑] GENERATION_ENDED 使用实际 message_id=${actualMessageId}`);
        processGameLogic(actualMessageId, 'GENERATION_ENDED');
      } catch (err) {
        console.warn(`[游戏逻辑] GENERATION_ENDED 获取最新消息失败:`, err);
        processGameLogic(Number(message_id), 'GENERATION_ENDED');
      }
    }, 300);
    // [修复] 禁用全局刷新，避免旧楼层状态栏被刷新为最新数据
    // setTimeout(() => {
    //   try {
    //     const actualMessageId = getLastMessageId();
    //     console.info('[游戏逻辑] 广播 IFRAME_DATA_REFRESH 事件 (GENERATION_ENDED)');
    //     eventEmit('IFRAME_DATA_REFRESH', { reason: 'GENERATION_ENDED', message_id: actualMessageId });
    //   } catch (err) {
    //     console.warn('[游戏逻辑] GENERATION_ENDED 广播刷新事件失败:', err);
    //   }
    // }, 800);
  });

  console.info('[赵霞游戏逻辑] 加载完成，已注册所有事件监听');
});
