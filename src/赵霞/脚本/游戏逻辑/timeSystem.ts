import type { Schema as SchemaType } from '../../schema';

/**
 * 时间系统 - 零BUG设计
 *
 * 核心原则（基于TIME_LOOP_DESIGN.md）：
 * 1. 单一入口 - 所有时间修改通过 TimeSystem.advance()
 * 2. 单一数据源 - 所有时间读取从 data.世界.时间
 * 3. 原子更新 - 时间、时间戳、标记一起更新
 * 4. 强制刷新 - 每次时间更新后标记状态栏刷新
 * 5. 楼层追踪 - 记录每个楼层的时间更新
 */

interface TimeUpdateResult {
  success: boolean;
  oldTime: string;
  newTime: string;
  day: number;
  hour: number;
}

export class TimeSystem {
  /**
   * 推进时间（唯一入口）
   * @param data 游戏数据
   * @param hours 推进小时数（默认1小时）
   * @returns 更新结果
   */
  static advance(data: SchemaType, hours: number = 1): TimeUpdateResult {
    console.info(`\n━━━━ 时间推进开始 ━━━━`);
    console.info(`推进小时数: ${hours}`);

    const oldTime = data.世界.时间;
    const oldDay = data.世界.当前天数;
    const oldHour = data.世界.当前小时;

    // Bug #18 修复：先计算原始时间（不重置），用于判断是否触发结局
    // 然后再根据循环状态决定是否重置日期
    const rawTime = this.calculateRawTime(oldDay, oldHour, hours);

    // 检查是否触发结局判定（第6天凌晨00:00，即Day 5的23:59之后）
    // 2026-01-17 调整：从20:00延长到00:00，给真爱结局的现实婚礼仪式留出时间
    // 注意：真好结局引导从Day 5的11:00开始，但正式结局判定在Day 6凌晨00:00
    // Bug #18 修复：使用原始时间判断，避免重置后无法检测到超过Day 5的情况
    // 游戏时间线：Day 1-5 → 第6天凌晨0点触发结局判定
    if (rawTime.day > 5 || (rawTime.day === 6 && rawTime.hour === 0)) {
      if (data.世界.循环状态 === '进行中') {
        console.info(`⚠️ 到达 Day ${rawTime.day}, ${rawTime.hour}:00，触发结局判定`);
        data.世界.循环状态 = '结局判定';
      }
    }

    // 根据循环状态决定最终时间
    // - "进行中"状态：Day > 5 时重置到 Day 1（时间循环）
    // - "结局判定"/"已破解"状态：保持原始日期（用于显示真实日期）
    let finalDay = rawTime.day;
    const finalHour = rawTime.hour;

    if (finalDay > 5 && data.世界.循环状态 === '进行中') {
      console.info(`⚠️ 超过第5天，循环重置到第1天`);
      finalDay = 1;
    }

    // 原子更新：同时更新所有时间相关变量
    data.世界.当前天数 = finalDay;
    data.世界.当前小时 = finalHour;
    data.世界.时间 = this.formatTime(finalDay, finalHour);
    data.世界.时间戳 = Date.now();
    data.世界.状态栏需要刷新 = true; // 关键标记

    const newTime = data.世界.时间;

    console.info(`时间已更新: ${oldTime} → ${newTime}`);
    console.info(`天数: Day ${finalDay}, 小时: ${finalHour}:00`);
    console.info(`循环状态: ${data.世界.循环状态}`);
    console.info(`时间戳: ${data.世界.时间戳}`);
    console.info(`━━━━ 时间推进结束 ━━━━\n`);

    return {
      success: true,
      oldTime,
      newTime,
      day: finalDay,
      hour: finalHour,
    };
  }

  /**
   * 计算原始时间（不考虑循环重置）
   * @param currentDay 当前天数
   * @param currentHour 当前小时
   * @param hours 推进小时数
   * @returns 原始的天数和小时
   */
  private static calculateRawTime(
    currentDay: number,
    currentHour: number,
    hours: number,
  ): { day: number; hour: number } {
    let totalHours = currentHour + hours;
    let day = currentDay;

    // 处理跨天
    while (totalHours >= 24) {
      totalHours -= 24;
      day += 1;
    }

    return { day, hour: totalHours };
  }

  /**
   * 格式化时间显示
   * @param day 天数 (1-5)
   * @param hour 小时 (0-23)
   * @returns 格式化字符串 "Day 1, 08:00"
   */
  private static formatTime(day: number, hour: number): string {
    const hourStr = hour.toString().padStart(2, '0');
    return `Day ${day}, ${hourStr}:00`;
  }

  /**
   * 获取当前时间（唯一读取点）
   * @param data 游戏数据
   * @returns 当前时间字符串
   */
  static getCurrentTime(data: SchemaType): string {
    return data.世界.时间;
  }

  /**
   * 检查是否在梦境入口窗口（22:00-01:00）
   * @param data 游戏数据
   * @returns 是否可以进入梦境
   */
  static isDreamWindowOpen(data: SchemaType): boolean {
    const hour = data.世界.当前小时;
    // 22:00-23:59 或 00:00-01:59
    return hour === 22 || hour === 23 || hour === 0 || hour === 1;
  }

  /**
   * 检查是否到达结局判定时间（第6天凌晨00:00，即Day 5的23:59之后）
   * 2026-01-17 调整：从20:00延长到00:00，给真爱结局的现实婚礼仪式留出时间
   * 游戏时间线：Day 1-5 是正常游戏时间，Day 6凌晨0点触发结局判定
   * @param data 游戏数据
   * @returns 是否到达结局时间
   */
  static isEndingTime(data: SchemaType): boolean {
    // 第6天凌晨00:00或超过第5天（day >= 6）
    return (data.世界.当前天数 === 6 && data.世界.当前小时 === 0) || data.世界.当前天数 > 5;
  }

  /**
   * 检查是否到达真好结局引导开始时间（Day 5, 11:00+）
   * 2026-01-17 新增：真好结局从11:00开始预热引导
   * @param data 游戏数据
   * @returns 是否到达引导开始时间
   */
  static isTrueEndingGuidanceTime(data: SchemaType): boolean {
    return data.世界.当前天数 === 5 && data.世界.当前小时 >= 11;
  }

  /**
   * 检查赵霞是否醒来（10:00）
   * @param data 游戏数据
   * @returns 是否醒来时间
   */
  static isWakeUpTime(data: SchemaType): boolean {
    return data.世界.当前小时 === 10;
  }

  /**
   * 检查是否是 Day 5 晚间（禁止进入场景1-4的时间）
   * 2026-01-17 新增
   *
   * 原因：游戏只有5天，Day 5 22:00 进入梦境会持续到 Day 6 10:00，
   *       但不存在 Day 6，会打破时间循环逻辑。
   *
   * @param data 游戏数据
   * @returns 是否是 Day 5 晚间梦境窗口
   */
  static isDay5NightDreamBlocked(data: SchemaType): boolean {
    return data.世界.当前天数 === 5 && this.isDreamWindowOpen(data);
  }

  /**
   * 计算距离结局判定还剩多少小时
   * 结局判定点: Day 5, 00:00（即 Day 6 凌晨，共 120 小时）
   * 2026-01-17 调整：从20:00（116小时）延长到00:00（120小时）
   * @param data 游戏数据
   * @returns 剩余小时数
   */
  static getHoursUntilReset(data: SchemaType): number {
    const currentDay = data.世界.当前天数;
    const currentHour = data.世界.当前小时;

    // 计算当前已过小时数（从Day 1, 00:00开始）
    const currentTotalHours = (currentDay - 1) * 24 + currentHour;

    // 结局判定点在 Day 5, 24:00 = (5-1)*24 + 24 = 120 小时
    // 或者说 Day 6, 00:00
    const resetTotalHours = 5 * 24; // 120小时

    // 剩余小时数
    const remaining = resetTotalHours - currentTotalHours;

    return Math.max(0, remaining);
  }

  /**
   * 检测用户输入是否包含跳过时间的意图
   * @param userInput 用户输入
   * @returns 是否有跳过意图和目标时间
   */
  static detectTimeSkipIntent(userInput: string): {
    hasIntent: boolean;
    targetHour?: number;
    skipType?: 'sleep' | 'specific' | 'next_day';
  } {
    const normalizedInput = userInput.toLowerCase();

    // 检测睡觉指令
    const sleepKeywords = ['睡觉', '睡了', '去睡', '入睡', 'sleep', '休息'];
    for (const keyword of sleepKeywords) {
      if (normalizedInput.includes(keyword)) {
        return { hasIntent: true, targetHour: 7, skipType: 'sleep' };
      }
    }

    // 检测跳过到特定时间的指令
    const timeSkipPattern = /跳过到?\s*(\d{1,2})\s*[点时:：]/;
    const match = normalizedInput.match(timeSkipPattern);
    if (match) {
      const targetHour = parseInt(match[1], 10);
      if (targetHour >= 0 && targetHour <= 23) {
        return { hasIntent: true, targetHour, skipType: 'specific' };
      }
    }

    // 检测跳到第二天的指令
    const nextDayKeywords = ['第二天', '明天', '下一天', 'next day'];
    for (const keyword of nextDayKeywords) {
      if (normalizedInput.includes(keyword)) {
        return { hasIntent: true, targetHour: 8, skipType: 'next_day' };
      }
    }

    return { hasIntent: false };
  }

  /**
   * 处理时间跳过请求
   * 注意：时间跳过功能已禁用，检测到跳过意图时会显示MVU提示
   * @param data 游戏数据
   * @param userInput 用户输入
   * @returns 处理结果（始终拒绝跳过）
   */
  static processTimeSkipRequest(
    data: SchemaType,
    userInput: string,
  ): {
    processed: boolean;
    blocked: boolean;
    mvuMessage?: string;
  } {
    const intent = this.detectTimeSkipIntent(userInput);

    if (!intent.hasIntent) {
      return { processed: false, blocked: false };
    }

    // 计算距离时间循环重置的剩余小时数
    const hoursRemaining = this.getHoursUntilReset(data);

    // 构建MVU提示消息
    const mvuMessage = `当前无法跳过时间，时间循环在 ${hoursRemaining} 小时后开始重置`;

    console.warn(`[时间系统] 检测到时间跳过意图: ${intent.skipType}`);
    console.warn(`[时间系统] ${mvuMessage}`);

    return {
      processed: true,
      blocked: true,
      mvuMessage,
    };
  }

  /**
   * 验证时间系统状态（调试用）
   * @param data 游戏数据
   */
  static validate(data: SchemaType): void {
    console.info('\n━━━━ 时间系统状态验证 ━━━━');
    console.info(`时间字符串: ${data.世界.时间}`);
    console.info(`当前天数: ${data.世界.当前天数}`);
    console.info(`当前小时: ${data.世界.当前小时}`);
    console.info(`时间戳: ${data.世界.时间戳}`);
    console.info(`状态栏刷新标记: ${data.世界.状态栏需要刷新}`);
    console.info(`循环状态: ${data.世界.循环状态}`);

    // 一致性检查
    const expectedTime = this.formatTime(data.世界.当前天数, data.世界.当前小时);
    if (data.世界.时间 !== expectedTime) {
      console.error(`⚠️ 时间不一致！期望: ${expectedTime}, 实际: ${data.世界.时间}`);
    } else {
      console.info(`✅ 时间一致性验证通过`);
    }

    console.info('━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * 检测时间是否推进（脚本处理后检测版本）
   *
   * 设计说明：
   * - 在脚本执行 TimeSystem.advance() 之后调用
   * - 比较脚本推进后的时间与推进前的时间
   * - 如果时间相同，说明脚本推进失败（理论上不应该发生）
   * - 如果时间不同，说明正常推进，无需警告
   *
   * @param beforeTime 脚本推进前的时间字符串
   * @param afterTime 脚本推进后的时间字符串
   * @param messageId 当前消息楼层ID（用于日志）
   * @returns 检测结果：是否需要提醒、提醒消息
   */
  static checkTimeAdvancementAfterScript(
    beforeTime: string,
    afterTime: string,
    messageId: number,
  ): {
    shouldWarn: boolean;
    message?: string;
  } {
    // 第一楼或第二楼不需要检测
    if (messageId <= 1) {
      return { shouldWarn: false };
    }

    // 如果推进前后时间相同，说明脚本推进失败
    if (beforeTime === afterTime) {
      console.warn(`[时间系统] ⚠️ 脚本处理后时间仍未推进: ${afterTime} (楼层 ${messageId})`);
      return {
        shouldWarn: true,
        message: `时间未推进（${afterTime}），脚本处理后时间仍然相同，请检查游戏逻辑`,
      };
    }

    // 时间已正确推进
    console.info(`[时间系统] ✅ 时间已正确推进: ${beforeTime} → ${afterTime} (楼层 ${messageId})`);
    return { shouldWarn: false };
  }

  /**
   * 检测用户输入是否包含时间跳跃描述
   * BUG-006：玩家可能输入"几个小时后"、"第二天"等时间描述，AI可能会错误地描绘其他时间的内容
   *
   * 设计说明：
   * - 检测玩家输入中是否包含时间跳跃描述词
   * - 如果检测到，返回提醒内容，用于注入到AI提示中
   * - 提醒AI不要错误地描绘其他时间的内容，要根据当前的游戏时间
   *
   * @param userInput 用户输入
   * @param currentTime 当前游戏时间（格式："Day X, HH:00"）
   * @returns 检测结果
   */
  static detectTimeJumpDescription(
    userInput: string,
    currentTime: string,
  ): {
    detected: boolean;
    matchedKeyword?: string;
    reminderPrompt?: string;
  } {
    // 时间跳跃描述关键词库
    const TIME_JUMP_KEYWORDS = {
      // 小时相关
      小时后: ['小时后', '个小时后', '几小时后', '几个小时后', '一小时后', '两小时后', '三小时后', '数小时后'],
      // 天相关
      天后: ['天后', '几天后', '一天后', '两天后', '三天后', '数天后', '第二天', '第三天', '明天', '后天'],
      // 分钟相关（虽然游戏时间以小时为单位，但玩家可能这样写）
      分钟后: ['分钟后', '几分钟后', '半小时后', '一会儿后', '过了一会'],
      // 其他时间跳跃表达
      时间流逝: ['过了很久', '时间流逝', '不知过了多久', '等到', '直到', '到了晚上', '到了早上', '到了中午'],
    };

    const normalizedInput = userInput.toLowerCase();

    // 遍历所有分类检测
    for (const [category, keywords] of Object.entries(TIME_JUMP_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword)) {
          console.info(`[时间系统] 检测到时间跳跃描述: "${keyword}" (分类: ${category})`);

          // 生成提醒Prompt
          const reminderPrompt = `【系统提醒 - 时间一致性】
玩家输入中包含时间跳跃描述（"${keyword}"），但游戏时间无法跳跃。
当前游戏时间：${currentTime}

请注意：
1. 不要描绘"${keyword}"的场景，游戏时间不会因为玩家描述而跳跃
2. 继续在当前时间（${currentTime}）的背景下描绘场景
3. 如果玩家想要跳过时间，可以委婉地告知时间的流逝需要通过正常的游戏进程
4. 时间只会在每次对话后自动推进1小时，不能被玩家的描述跳过

请基于当前时间继续生成内容，不要提及"系统提醒"。`;

          return {
            detected: true,
            matchedKeyword: keyword,
            reminderPrompt,
          };
        }
      }
    }

    return { detected: false };
  }
}
