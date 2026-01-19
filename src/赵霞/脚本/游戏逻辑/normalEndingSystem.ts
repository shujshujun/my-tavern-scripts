/**
 * 赵霞游戏 - 普通结局系统
 *
 * 普通结局触发条件：
 * - 时间到达 Day 5, 00:00（即 Day 6 凌晨）（2026-01-17 从20:00延长到00:00）
 * - 未触发坏结局（怀疑度<100）
 * - 未触发混乱结局（由 confusionEndingSystem 单独处理）
 * - 未完成全部5个梦境场景
 *
 * 普通结局表现：
 * - 获取聊天记录中第一条AI消息（开局问候）
 * - 显示"时间循环重置"叙述 + 第一条消息内容
 * - 之后锁定游戏，玩家任何输入都会显示"循环已重置"
 *
 * 设计理念：
 * - 玩家没有发现梦境入口，或没有完成足够的场景
 * - 时间循环重置，一切回到原点
 * - 但玩家（作为玩家）并不保留记忆，只是看到循环重置的结果
 */

import type { Schema as SchemaType } from '../../schema';
import { updateSnapshotValue } from './dataProtection';

// =============================================
// 普通结局类型定义
// =============================================

export type NormalEndingType = '时间循环重置' | '未触发';

export interface NormalEndingCheckResult {
  triggered: boolean;
  type: NormalEndingType;
  replaceUserMessage: string | null;
  firstGreeting: string | null; // 第一条AI消息（开局问候）
}

// =============================================
// 普通结局模板
// =============================================

/**
 * 普通结局 - 初始触发模板（梦境路线）
 * 玩家进入过梦境但没完成所有场景，时间循环重置
 * @param firstGreeting 第一条AI消息内容
 */
function generateNormalEndingInitialTemplate(firstGreeting: string): string {
  return `[普通结局 - 时间循环重置]

第五天的正午，阳光透过窗帘洒进房间。

赵霞站在窗前，若有所思地望着外面。
你感觉到一阵眩晕，眼前的景象开始模糊...

"怎么了？"
赵霞转过头来，关切地看着你。

你想说些什么，但话语仿佛被什么力量吞噬了。
空气中弥漫着一种似曾相识的气息...

然后，一切都消失了。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

...

你睁开眼睛。

这是...第一天？

${firstGreeting}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【LOOP RESET】
【NORMAL END: 时间循环重置】

你没有找到打破循环的方法。
时间的齿轮再次转动，一切回到了原点。

也许下一次，你能发现那扇隐藏的门...

---
游戏已结束。如需重新开始，请重置存档。`;
}

/**
 * 纯爱结局 - 初始触发模板（坏结局性质）
 * 玩家从未进入过梦境，无法打破时间循环
 * 时间已重置到 Day 1, 08:00，使用早晨醒来的叙事
 * @param firstGreeting 第一条AI消息内容
 */
function generatePureLoveEndingTemplate(firstGreeting: string): string {
  return `[纯爱结局 - 时间循环重置]

清晨的阳光透过窗帘，洒进了熟悉的房间。

你睁开眼睛，脑海中有一瞬间的恍惚。
仿佛...遗忘了什么重要的事情。

"早饭好了哦～"
厨房传来赵霞温柔的声音。

这是...第一天？

你环顾四周，一切都是那么熟悉，又那么陌生。
那种似曾相识的感觉，像是做了一个很长很长的梦。
但你什么都不记得了。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${firstGreeting}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【LOOP RESET】
【纯爱结局：无法触及的真相】

你选择了温馨的日常，却错过了深夜的真相。
赵霞的记忆中，那些被封印的往事依然沉睡着。
而你，将永远被困在这个循环里——直到你找到那扇门。

提示：在深夜，当她入睡后，尝试进入她的梦境……

---
游戏已结束。如需重新开始，请重置存档。`;
}

/**
 * 普通结局 - 持续锁定模板
 * 触发后，无论玩家输入什么，都会显示这些内容
 */
const NORMAL_ENDING_LOCKED_TEMPLATES = [
  () => `[游戏已结束]

时间循环已重置。

你站在原点，周围的一切都是那么熟悉。
第一天的阳光，第一天的空气，第一天的她。

但你不记得发生过什么。
因为从未发生过。

【NORMAL END: 时间循环重置】

这就是没有找到出口的代价。
这就是循环的意义。

---
游戏已结束。如需重新开始，请重置存档。`,

  () => `[游戏已结束]

循环。
重复。
永恒。

你困在这个无尽的轮回中。
每一次，都是第一天。
每一次，都是相同的开始。

【NORMAL END: 时间循环重置】

也许，某个地方存在着打破循环的钥匙。
但这一次，你没能找到它。

---
游戏已结束。如需重新开始，请重置存档。`,

  () => `[游戏已结束]

"早安。"

熟悉的声音，熟悉的场景。
这是第一天。
永远是第一天。

【NORMAL END: 时间循环重置】

时间之环已经闭合。
你被困在了里面。

---
游戏已结束。如需重新开始，请重置存档。`,
];

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
 * 获取第一条AI消息（开局问候）
 * 使用酒馆助手的 getChatMessages API
 */
function getFirstAIMessage(): string | null {
  try {
    // 获取第一条消息（楼层0）
    const messages = getChatMessages(0);
    if (messages && messages.length > 0) {
      const firstMessage = messages[0];
      // 确保是AI的消息（assistant角色）
      if (firstMessage.role === 'assistant' && firstMessage.message) {
        console.info('[普通结局系统] 成功获取第一条AI消息');
        return firstMessage.message;
      }
    }
    console.warn('[普通结局系统] 未找到第一条AI消息');
    return null;
  } catch (err) {
    console.error('[普通结局系统] 获取第一条AI消息失败:', err);
    return null;
  }
}

// =============================================
// 核心函数
// =============================================

/**
 * 检测是否应该触发普通结局
 * 在 checkEnding() 中调用，当不满足好结局和坏结局条件时触发
 *
 * @param data 游戏数据
 * @returns 普通结局检测结果
 */
export function checkNormalEnding(data: SchemaType): NormalEndingCheckResult {
  // 检查是否已经在普通结局锁定状态
  const isAlreadyInNormalEnding = isInNormalEndingLock(data);

  if (isAlreadyInNormalEnding) {
    // 已在普通结局状态，使用锁定模板
    const template = randomChoice(NORMAL_ENDING_LOCKED_TEMPLATES);
    const replaceUserMessage = template();
    console.info('[普通结局系统] 普通结局已锁定，无法继续游戏');

    return {
      triggered: true,
      type: '时间循环重置',
      replaceUserMessage,
      firstGreeting: null,
    };
  }

  // 首次触发普通结局
  // 获取第一条AI消息
  const firstGreeting = getFirstAIMessage();
  const greetingText = firstGreeting || '（无法获取开局消息）';

  // 根据是否进入过梦境选择不同的模板和结局类型
  const hasEnteredDream = data.世界.已进入过梦境;
  let replaceUserMessage: string;

  if (hasEnteredDream) {
    // 梦境路线：进入过梦境但没完成所有场景 → 普通结局
    replaceUserMessage = generateNormalEndingInitialTemplate(greetingText);
    console.info('[普通结局系统] 首次触发普通结局（梦境路线 - 时间循环重置）');
  } else {
    // 纯爱路线：从未进入过梦境 → 纯爱结局（坏结局性质）
    replaceUserMessage = generatePureLoveEndingTemplate(greetingText);
    console.info('[纯爱结局系统] 首次触发纯爱结局（坏结局 - 无法触及的真相）');
  }

  return {
    triggered: true,
    type: '时间循环重置',
    replaceUserMessage,
    firstGreeting,
  };
}

/**
 * 应用普通结局/纯爱结局状态到游戏数据
 * 两种结局都是时间循环重置，回到 Day 1
 * @param data 游戏数据
 */
export function applyNormalEndingState(data: SchemaType): void {
  // 根据是否进入过梦境决定结局类型
  const hasEnteredDream = data.世界.已进入过梦境;
  const endingType = hasEnteredDream ? '普通结局' : '纯爱结局';

  data.结局数据.当前结局 = endingType;
  // 普通结局/纯爱结局不设置为 '已破解'，保持 '结局判定'
  // 这样状态栏不会显示真实日期，而是显示循环重置后的 Day 1
  data.世界.循环状态 = '结局判定';

  // 关键：时间循环重置，回到 Day 1, 08:00
  // 不同于好结局（破解循环，显示真实日期）
  data.世界.当前天数 = 1;
  data.世界.当前小时 = 8;
  data.世界.时间 = 'Day 1, 08:00';
  data.世界.当前循环轮数 = (data.世界.当前循环轮数 || 1) + 1;
  data.世界.状态栏需要刷新 = true;

  // 同步更新数据保护快照，防止被误判为篡改
  updateSnapshotValue('世界.当前天数', 1);
  updateSnapshotValue('世界.当前小时', 8);
  updateSnapshotValue('世界.时间', 'Day 1, 08:00');
  updateSnapshotValue('世界.当前循环轮数', data.世界.当前循环轮数);
  updateSnapshotValue('世界.循环状态', '结局判定');
  updateSnapshotValue('结局数据.当前结局', endingType);

  if (hasEnteredDream) {
    console.info('[普通结局系统] 已设置普通结局状态，时间循环重置到 Day 1, 08:00');
  } else {
    console.info('[纯爱结局系统] 已设置纯爱结局状态（坏结局），时间循环重置到 Day 1, 08:00');
  }
  console.info(`[结局系统] 当前循环轮数: ${data.世界.当前循环轮数}`);
}

/**
 * 检测是否处于普通结局/纯爱结局锁定状态
 * 用于判断是否需要持续替换消息
 * @param data 游戏数据
 * @returns 是否处于普通结局或纯爱结局锁定状态
 */
export function isInNormalEndingLock(data: SchemaType): boolean {
  const ending = data.结局数据.当前结局;
  return (ending === '普通结局' || ending === '纯爱结局') && data.世界.循环状态 === '结局判定';
}

/**
 * 判断是否应该触发普通结局（供index.ts的checkEnding调用）
 *
 * 普通结局条件：
 * - 时间到达结局判定时间（Day 5, 00:00 即 Day 6 凌晨）（2026-01-17 从20:00延长到00:00）
 * - 未触发坏结局（怀疑度<100）
 * - 未触发混乱结局（由 confusionEndingSystem 单独处理）
 * - 未完成全部5个梦境场景
 *
 * @param data 游戏数据
 * @returns 是否应该触发普通结局
 */
export function shouldTriggerNormalEnding(data: SchemaType): boolean {
  // 检查坏结局条件（只检查怀疑度，混乱度由 confusionEndingSystem 单独处理）
  const isBadEnding = data.现实数据.丈夫怀疑度 >= 100;

  if (isBadEnding) {
    return false; // 应该触发坏结局（被丈夫发现）
  }

  // 检查好结局条件：是否完成全部5个场景
  const completedScenes = new Set(data.梦境数据.已完成场景);
  const allScenesComplete =
    completedScenes.size === 5 &&
    completedScenes.has(1) &&
    completedScenes.has(2) &&
    completedScenes.has(3) &&
    completedScenes.has(4) &&
    completedScenes.has(5);

  if (allScenesComplete) {
    return false; // 应该触发好结局（真好或假好）
  }

  // 未满足好结局条件，也未触发坏结局 → 普通结局
  return true;
}
