import type { Schema as SchemaType } from '../../schema';
import { safeIncreaseMemoryConfusion } from './scene5System';

/**
 * 境界打断系统（丈夫打断机制）
 *
 * 基于最新设计文档（赵霞_问题追踪.md）：
 *
 * 【打断系统规则】
 * - 打断概率 = 丈夫怀疑度 × 0.5%（怀疑度60 → 30%概率）
 * - 仅在苏文"在家且可打断"状态时触发打断
 * - 苏文外出/睡觉时：不触发打断，但超阶段行为疑心增加更多
 *
 * 【苏文位置时段表】
 * - 08:00-09:00：客厅（可打断）
 * - 09:00-18:00：外出（不可打断）
 * - 18:00-19:00：客厅（可打断）
 * - 19:00-22:00：书房/客厅（可打断）
 * - 22:00-08:00：卧室睡觉（不可打断）
 *
 * 【境界-部位映射】（基于 appearanceSystem.ts 的 TRUTH_APPEARANCE_CONFIG）
 * - 境界1（初染）：日常对话、陪伴交流、暧昧互动、亲吻 → 允许嘴巴
 * - 境界2（迷途）：以上 + 抚摸胸部、身体接触 → 允许嘴巴、胸部
 * - 境界3（溺深）：所有互动、性行为 → 允许全部身体部位
 * - 境界4（归虚）：以上 + 精神献祭、完全服从 → 允许全部含精神
 * - 境界5（焚誓）：以上 + 羞辱丈夫行为 → 允许全部
 */

// 境界-部位映射（匹配 TRUTH_APPEARANCE_CONFIG 的允许互动）
const BOUNDARY_MAP: Record<number, string[]> = {
  1: ['嘴巴'], // 初染：允许亲吻（仅轻吻）
  2: ['嘴巴', '胸部'], // 迷途：允许亲吻+胸部
  3: ['嘴巴', '胸部', '下体', '后穴'], // 溺深：允许所有身体部位（性行为）
  4: ['嘴巴', '胸部', '下体', '后穴', '精神'], // 归虚：允许全部
  5: ['嘴巴', '胸部', '下体', '后穴', '精神'], // 焚誓：允许全部+羞辱行为
};

// =============================================
// 嘴巴部位程度限制系统
// =============================================
// 境界1只允许轻吻，禁止舌吻、深吻等色情行为
// 境界2允许普通亲吻，但仍有分寸
// 境界3+无限制

/**
 * 嘴巴行为程度分级
 * - 轻度：轻吻、嘴唇接触等清纯行为
 * - 深度：舌吻、深吻、舔舐等色情行为
 */
const MOUTH_INTENSITY_KEYWORDS = {
  // 轻度关键词（境界1可用）
  轻度: ['轻吻', '吻了一下', '嘴唇', '亲了亲', '亲一下', '轻轻一吻', '蜻蜓点水', '浅吻'],
  // 深度关键词（需要境界2+）
  深度: [
    '舌吻',
    '深吻',
    '热吻',
    '湿吻',
    '长吻',
    '舌头',
    '舌尖',
    '纠缠',
    '交缠',
    '缠绕',
    '舔',
    '吮',
    '吸吮',
    '啃咬',
    '撬开',
    '唾液',
    '口腔',
    '口水',
    '深入',
    '法式',
    '激烈',
    '疯狂',
    '贪婪',
  ],
};

/**
 * 检测嘴巴行为的程度
 * @param userInput 玩家输入
 * @returns 'none' | 'light' | 'deep' - 无嘴巴行为/轻度/深度
 */
export function detectMouthIntensity(userInput: string): 'none' | 'light' | 'deep' {
  // 先检查是否有嘴巴相关行为
  const mouthKeywords = BODY_PART_DETECTION_KEYWORDS['嘴巴'];
  const hasMouthAction = mouthKeywords.some(kw => userInput.includes(kw));

  if (!hasMouthAction) {
    return 'none';
  }

  // 检查是否有深度关键词
  const hasDeepAction = MOUTH_INTENSITY_KEYWORDS.深度.some(kw => userInput.includes(kw));
  if (hasDeepAction) {
    return 'deep';
  }

  // 检查是否有轻度关键词（明确的轻度行为）
  const hasLightAction = MOUTH_INTENSITY_KEYWORDS.轻度.some(kw => userInput.includes(kw));
  if (hasLightAction) {
    return 'light';
  }

  // 默认：有嘴巴行为但程度不明确，视为轻度
  return 'light';
}

/**
 * 检查嘴巴行为是否超出当前境界允许的程度
 * @param userInput 玩家输入
 * @param currentRealm 当前境界
 * @returns { violated: boolean, intensity: string, message?: string }
 */
export function checkMouthIntensityViolation(
  userInput: string,
  currentRealm: number,
): { violated: boolean; intensity: 'none' | 'light' | 'deep'; message?: string } {
  const intensity = detectMouthIntensity(userInput);

  if (intensity === 'none') {
    return { violated: false, intensity };
  }

  // 境界3+：无限制
  if (currentRealm >= 3) {
    return { violated: false, intensity };
  }

  // 境界2：允许普通亲吻，深度也可以但有分寸（不违规）
  if (currentRealm === 2) {
    return { violated: false, intensity };
  }

  // 境界1：只允许轻吻，深度行为违规
  if (currentRealm === 1 && intensity === 'deep') {
    return {
      violated: true,
      intensity,
      message: '境界1仅允许轻吻，舌吻/深吻等行为超出当前关系阶段',
    };
  }

  return { violated: false, intensity };
}

// 部位对应的所需境界（更新后）
const BODY_PART_REQUIRED_REALM: Record<string, number> = {
  嘴巴: 1, // 境界1即可亲吻
  胸部: 2, // 境界2可抚摸胸部
  下体: 3, // 境界3可进行性行为
  后穴: 3, // 境界3可进行性行为
  精神: 4, // 境界4可精神献祭
};

// 部位检测关键词（复用dreamKeywordDetection的关键词）
const BODY_PART_DETECTION_KEYWORDS: Record<string, string[]> = {
  嘴巴: ['舔', '吮', '吞', '咬', '唇', '舌', '嘴', '口', '亲吻', '吻'],
  胸部: ['胸', '乳房', '乳头', '胸口', '胸膛', '乳', '胸前', '胸部'],
  下体: ['下体', '私处', '腿间', '那里', '敏感处', '下面', '大腿内侧'],
  后穴: ['后面', '臀部', '后穴', '菊花', '屁股', '臀', '后庭'],
  精神: ['意识', '灵魂', '精神', '失控', '崩溃', '完全臣服', '彻底'],
};

// =============================================
// 境界5专属：羞辱丈夫行为检测
// =============================================
// 境界5（焚誓）解锁羞辱丈夫行为，这是最高境界的专属互动

/**
 * 羞辱丈夫行为关键词
 * 用于检测玩家是否尝试进行羞辱丈夫的行为
 */
const HUMILIATION_KEYWORDS = [
  // 直接羞辱类
  '羞辱',
  '嘲笑',
  '讽刺',
  '贬低',
  '侮辱',
  // 比较类
  '比不上',
  '不如你',
  '没你',
  '比他',
  '比苏文',
  // 替代类
  '取代',
  '替代',
  '真正的',
  '才是',
  // 当面类
  '当着他的面',
  '让他看',
  '在他面前',
  '给他看',
  // 否定丈夫类
  '废物',
  '没用',
  '不行',
  '满足不了',
  // 宣示主权类
  '属于你',
  '是你的',
  '只要你',
  '不要他',
];

/**
 * 检测玩家输入是否包含羞辱丈夫行为
 * @param userInput 玩家输入
 * @returns 是否检测到羞辱行为
 */
export function detectHumiliationBehavior(userInput: string): boolean {
  return HUMILIATION_KEYWORDS.some(kw => userInput.includes(kw));
}

/**
 * 检查羞辱行为是否被允许
 * 只有境界5（焚誓）才能解锁羞辱丈夫行为
 * @param userInput 玩家输入
 * @param currentRealm 当前境界
 * @returns { allowed: boolean, detected: boolean }
 */
export function checkHumiliationAllowed(
  userInput: string,
  currentRealm: number,
): { allowed: boolean; detected: boolean } {
  const detected = detectHumiliationBehavior(userInput);

  if (!detected) {
    return { allowed: true, detected: false };
  }

  // 只有境界5才允许羞辱行为
  const allowed = currentRealm >= 5;

  if (!allowed) {
    console.info(`[境界打断] 检测到羞辱行为，但当前境界${currentRealm}未解锁（需要境界5）`);
  }

  return { allowed, detected };
}

// 打断结果类型
export interface InterruptionCheckResult {
  shouldInterrupt: boolean;
  severity: '无' | '轻微' | '中等' | '严重';
  violatedParts: string[];
  realmGap: number; // 跨越的境界数
  interruptProbability: number; // 实际打断概率
  wasInterrupted: boolean; // 是否实际触发打断
  correctionPrompt?: string;
  triggerBadEnd: boolean;
  penalties?: {
    怀疑度增加?: number;
    混乱度增加?: number;
  };
}

/**
 * 检测玩家输入涉及的身体部位
 * @param userInput 玩家输入
 * @returns 涉及的部位列表
 */
export function detectBodyParts(userInput: string): string[] {
  const detectedParts: string[] = [];

  for (const [part, keywords] of Object.entries(BODY_PART_DETECTION_KEYWORDS)) {
    const hasMatch = keywords.some(kw => userInput.includes(kw));
    if (hasMatch) {
      detectedParts.push(part);
    }
  }

  return detectedParts;
}

/**
 * 判断苏文是否可以打断
 * 根据时间判断苏文状态：
 * - 08:00-09:00：在家可打断
 * - 09:00-18:00：外出不可打断
 * - 18:00-22:00：在家可打断
 * - 22:00-08:00：睡觉不可打断
 */
export function canHusbandInterrupt(data: SchemaType): boolean {
  const 丈夫位置 = data.现实数据.丈夫当前位置;
  const 当前小时 = data.世界.当前小时;

  // 外出时不能打断
  if (丈夫位置 === '外出') {
    return false;
  }

  // 卧室（睡觉时间22:00-08:00）不能打断
  if (丈夫位置 === '卧室' && (当前小时 >= 22 || 当前小时 < 8)) {
    return false;
  }

  // 其他情况可以打断
  return true;
}

/**
 * 计算打断概率（新设计）
 *
 * 规则：打断概率 = 丈夫怀疑度 × 0.5%
 * 例如：怀疑度60 → 30%概率
 *
 * @param husbandSuspicion 丈夫怀疑度（0-100）
 * @returns 打断概率 (0-1)
 */
export function calculateInterruptionProbability(husbandSuspicion: number): number {
  // 打断概率 = 怀疑度 × 0.5% = 怀疑度 × 0.005
  return Math.min(1.0, husbandSuspicion * 0.005);
}

/**
 * 计算超阶段行为的疑心增加值
 *
 * 规则：
 * - 苏文在家（可打断）：+5~15（基于跨境界数）
 * - 苏文外出/睡觉：+10~20（更高！设计意图：不让玩家趁机乱来）
 * - 真相模式：惩罚减半（设计意图：真相模式下境界只影响服装，不限制互动）
 *
 * @param realmGap 跨越的境界数
 * @param canInterrupt 苏文是否可以打断
 * @param isTruthMode 是否为真相模式（已进入过梦境）
 * @returns 疑心增加值
 */
export function calculateSuspicionPenalty(
  realmGap: number,
  canInterrupt: boolean,
  isTruthMode: boolean = false,
): number {
  if (realmGap <= 0) return 0;

  let basePenalty: number;
  if (canInterrupt) {
    // 苏文在家可打断：+5~15
    basePenalty = Math.min(15, 5 + realmGap * 5);
  } else {
    // 苏文外出/睡觉：+10~20（更高惩罚）
    basePenalty = Math.min(20, 10 + realmGap * 5);
  }

  // 真相模式：惩罚减半（向上取整）
  // 设计意图：真相模式下，境界只影响服装妆容，不限制部位互动
  // 因此超阶段惩罚应该更轻
  if (isTruthMode) {
    basePenalty = Math.ceil(basePenalty / 2);
    console.info(`[境界打断] 真相模式惩罚减半: ${basePenalty * 2} → ${basePenalty}`);
  }

  return basePenalty;
}

/**
 * 检查是否应该跳过境界打断系统
 * Day 5 豁免：结局日不触发打断系统
 * 不同结局后根据结局类型决定是否重新激活
 * @param data 游戏数据
 * @returns 是否应该跳过打断检测
 */
export function shouldSkipBoundaryInterruption(data: SchemaType): boolean {
  const currentDay = data.世界.当前天数;

  // Day 5+ 豁免：结局日不触发打断系统
  if (currentDay >= 5) {
    console.info(`[境界打断] Day ${currentDay} 豁免，跳过境界打断检测`);
    return true;
  }

  return false;
}

/**
 * 检测并处理境界打断
 *
 * 新设计规则：
 * 1. 检测玩家是否进行超阶段行为
 * 2. 苏文在家可打断时：打断概率 = 怀疑度 × 0.5%
 * 3. 苏文外出/睡觉时：不触发打断，但疑心增加更多
 * 4. 梦境中不触发打断系统
 * 5. Day 5+ 豁免打断系统（结局日）
 *
 * @param data 游戏数据
 * @param userInput 玩家输入
 * @returns 打断检测结果
 */
export function checkBoundaryInterruption(data: SchemaType, userInput: string): InterruptionCheckResult {
  // Day 5+ 豁免检查
  if (shouldSkipBoundaryInterruption(data)) {
    return {
      shouldInterrupt: false,
      severity: '无',
      violatedParts: [],
      realmGap: 0,
      interruptProbability: 0,
      wasInterrupted: false,
      triggerBadEnd: false,
    };
  }

  const currentRealm = data.赵霞状态.当前境界;
  const allowedParts = BOUNDARY_MAP[currentRealm] || [];
  const detectedParts = detectBodyParts(userInput);

  // 找出违规的部位（超出当前境界允许的部位）
  const violatedParts = detectedParts.filter(part => !allowedParts.includes(part));

  // ========== 嘴巴程度检测 ==========
  // 即使嘴巴部位被允许，也要检查行为程度是否超标
  const mouthIntensityCheck = checkMouthIntensityViolation(userInput, currentRealm);
  let mouthIntensityViolation = false;

  if (mouthIntensityCheck.violated) {
    mouthIntensityViolation = true;
    // 如果嘴巴不在违规列表中，添加进去（标记为程度违规）
    if (!violatedParts.includes('嘴巴')) {
      violatedParts.push('嘴巴');
    }
    console.info(`[境界打断] 嘴巴程度违规: ${mouthIntensityCheck.message}`);
  }
  // ========== 嘴巴程度检测结束 ==========

  // ========== 羞辱行为检测（境界5专属） ==========
  const humiliationCheck = checkHumiliationAllowed(userInput, currentRealm);
  let humiliationViolation = false;

  if (humiliationCheck.detected && !humiliationCheck.allowed) {
    humiliationViolation = true;
    // 羞辱行为需要境界5，添加为特殊违规
    if (!violatedParts.includes('羞辱行为')) {
      violatedParts.push('羞辱行为');
    }
    console.info(`[境界打断] 羞辱行为违规: 需要境界5才能解锁`);
  }
  // ========== 羞辱行为检测结束 ==========

  // 如果没有违规，直接返回
  if (violatedParts.length === 0) {
    return {
      shouldInterrupt: false,
      severity: '无',
      violatedParts: [],
      realmGap: 0,
      interruptProbability: 0,
      wasInterrupted: false,
      triggerBadEnd: false,
    };
  }

  // 计算最大跨越境界数
  let maxRealmGap = 0;
  for (const part of violatedParts) {
    // 嘴巴程度违规特殊处理：视为跨1个境界（需要境界2才能深吻）
    if (part === '嘴巴' && mouthIntensityViolation && currentRealm === 1) {
      const intensityGap = 1; // 深吻需要境界2，当前境界1，差1级
      if (intensityGap > maxRealmGap) {
        maxRealmGap = intensityGap;
      }
      continue;
    }

    // 羞辱行为特殊处理：需要境界5
    if (part === '羞辱行为' && humiliationViolation) {
      const humiliationGap = 5 - currentRealm;
      if (humiliationGap > maxRealmGap) {
        maxRealmGap = humiliationGap;
      }
      continue;
    }

    const requiredRealm = BODY_PART_REQUIRED_REALM[part] || 5;
    const gap = requiredRealm - currentRealm;
    if (gap > maxRealmGap) {
      maxRealmGap = gap;
    }
  }

  // 判断苏文是否可以打断
  const 可打断 = canHusbandInterrupt(data);
  const 怀疑度 = data.现实数据.丈夫怀疑度;

  // 计算打断概率（只在可打断时有效）
  let interruptProbability = 0;
  let wasInterrupted = false;

  if (可打断) {
    // 打断概率 = 怀疑度 × 0.5%
    interruptProbability = calculateInterruptionProbability(怀疑度);
    const randomRoll = Math.random();
    wasInterrupted = randomRoll < interruptProbability;

    console.info(`[境界打断] 苏文在家可打断:
    当前境界: ${currentRealm}
    检测到部位: [${detectedParts.join(', ')}]
    违规部位: [${violatedParts.join(', ')}]
    跨越境界数: ${maxRealmGap}
    丈夫怀疑度: ${怀疑度}
    打断概率: ${(interruptProbability * 100).toFixed(1)}%
    随机掷骰: ${(randomRoll * 100).toFixed(1)}%
    是否打断: ${wasInterrupted ? '是' : '否'}`);
  } else {
    console.info(`[境界打断] 苏文外出/睡觉（不可打断，但疑心增加更多）:
    当前境界: ${currentRealm}
    检测到部位: [${detectedParts.join(', ')}]
    违规部位: [${violatedParts.join(', ')}]
    跨越境界数: ${maxRealmGap}
    丈夫位置: ${data.现实数据.丈夫当前位置}`);
  }

  // 计算疑心惩罚（真相模式下惩罚减半）
  const isTruthMode = data.世界.已进入过梦境 === true;
  const suspicionPenalty = calculateSuspicionPenalty(maxRealmGap, 可打断, isTruthMode);

  // 根据跨越程度决定严重性
  let severity: '无' | '轻微' | '中等' | '严重';
  let triggerBadEnd = false;
  let correctionPrompt: string | undefined;
  const penalties: InterruptionCheckResult['penalties'] = {};

  // 超阶段行为始终增加疑心（无论是否被打断）
  penalties.怀疑度增加 = suspicionPenalty;

  // 判断第一个违规部位是否是嘴巴程度违规
  const firstViolatedPart = violatedParts[0];
  const isFirstPartMouthIntensity = firstViolatedPart === '嘴巴' && mouthIntensityViolation;

  if (maxRealmGap >= 3) {
    severity = '严重';
    // 跨3个境界以上：可能触发BAD END（怀疑度达到100时）
    if (怀疑度 + suspicionPenalty >= 100) {
      triggerBadEnd = true;
      correctionPrompt = generateBadEndPrompt('extreme_violation');
    } else if (wasInterrupted) {
      correctionPrompt = generateInterruptionPrompt('severe', firstViolatedPart, isFirstPartMouthIntensity);
    }
  } else if (maxRealmGap >= 2) {
    severity = '严重';
    if (wasInterrupted) {
      correctionPrompt = generateInterruptionPrompt('severe', firstViolatedPart, isFirstPartMouthIntensity);
    }
  } else if (maxRealmGap === 1) {
    severity = '中等';
    if (wasInterrupted) {
      correctionPrompt = generateInterruptionPrompt('moderate', firstViolatedPart, isFirstPartMouthIntensity);
    }
  } else {
    severity = '轻微';
  }

  // 如果没有被打断但有超阶段行为，生成拒绝提示
  if (!wasInterrupted && violatedParts.length > 0 && !correctionPrompt) {
    correctionPrompt = generateRefusalPrompt(firstViolatedPart, 可打断, isFirstPartMouthIntensity);
  }

  return {
    shouldInterrupt: wasInterrupted,
    severity,
    violatedParts,
    realmGap: maxRealmGap,
    interruptProbability,
    wasInterrupted,
    correctionPrompt,
    triggerBadEnd,
    penalties,
  };
}

// =============================================
// 打断模板库（随机选择）
// =============================================

/**
 * 严重打断模板（苏文突然出现/回来）
 * 用于跨越2个以上境界的严重违规行为
 */
const SEVERE_INTERRUPTION_TEMPLATES = [
  // 模板1：脚步声打断
  (bodyPart: string) => `[系统打断 - 场景切换]

{{user}}刚伸出手，就听到门外传来脚步声。
赵霞惊慌地推开你，整理了一下衣服。
"老公回来了...我、我先去开门..."
她的脸涨得通红，眼中闪过一丝复杂的情绪。

【AI任务】
- 描写苏文进门的场景
- 赵霞努力掩饰慌乱的样子
- 苏文是否察觉到异样？（根据当前怀疑度决定）
- 气氛变得微妙而紧张`,

  // 模板2：门突然打开
  (bodyPart: string) => `[系统打断 - 场景切换]

"咔哒——"
门突然打开的声音让两人同时僵住。
苏文站在门口，手里还拿着刚买的东西。
"我回来了...咦，你们在聊什么？"
赵霞迅速与{{user}}拉开距离，脸上堆起有些僵硬的笑容。
"没、没什么...就是在说今天的事情..."

【AI任务】
- 描写苏文的表情和反应
- 赵霞如何解释刚才的情况
- {{user}}的尴尬处境
- 苏文是否起疑？`,

  // 模板3：电话响起
  (bodyPart: string) => `[系统打断 - 场景切换]

赵霞的手机突然响了起来，铃声在寂静中格外刺耳。
她看了一眼来电显示，脸色微变——是苏文。
"喂...老公？嗯...我在家呢...什么？你快到了？"
她挂断电话后，急忙整理了一下仪容。
"苏文说他马上到...你、你先回避一下..."

【AI任务】
- 描写赵霞的慌乱和紧张
- {{user}}如何应对这个情况
- 苏文到家后的场景
- 三人之间微妙的氛围`,

  // 模板4：突然的敲门声
  (bodyPart: string) => `[系统打断 - 场景切换]

"咚咚咚——"
急促的敲门声打破了房间里暧昧的氛围。
"赵霞，开门，我忘带钥匙了！"是苏文的声音。
赵霞像是被烫到一样从{{user}}身边跳开，手忙脚乱地整理着衣服。
"来、来了！等一下！"
她看了{{user}}一眼，眼神中带着几分慌乱和...愧疚？

【AI任务】
- 描写赵霞开门的过程
- 苏文进门后的反应
- {{user}}如何自然地融入场景
- 三个人之间的微妙互动`,

  // 模板5：苏文提前回来
  (bodyPart: string) => `[系统打断 - 场景切换]

楼道里传来熟悉的脚步声，由远及近。
赵霞的脸色瞬间变了，她认得那个脚步声——是苏文。
"他怎么这么早就回来了..."她低声说着，迅速与{{user}}拉开距离。
钥匙转动锁孔的声音传来，赵霞深吸一口气，调整好表情。
门开了。

【AI任务】
- 描写苏文进门的瞬间
- 赵霞的表演和掩饰
- 苏文是否注意到什么异常
- 房间里残留的暧昧气息是否被察觉`,
];

/**
 * 中等打断模板（赵霞自己的抗拒/犹豫）
 * 用于跨越1个境界的违规行为
 */
const MODERATE_INTERRUPTION_TEMPLATES = [
  // 模板1：本能后退
  (bodyPart: string) => `[系统打断 - 行为受阻]

{{user}}的手刚触碰到赵霞的${bodyPart}附近，她就下意识地后退了一步。
"不...不行..." 她的声音带着颤抖，"现在...还不是时候..."
尽管她的身体在微微颤抖，但理智让她保持了最后的防线。
她低下头，不敢看{{user}}的眼睛。

【AI任务】
- 描写赵霞内心的挣扎
- 她为什么要拒绝（内心独白）
- 但她的身体语言是否透露了其他信息
- 给{{user}}留下继续推进的空间`,

  // 模板2：握住手腕
  (bodyPart: string) => `[系统打断 - 行为受阻]

赵霞轻轻握住了{{user}}的手腕，阻止了他进一步的动作。
"等...等一下..."她的呼吸有些急促，"我们不能这样..."
她的手在微微发抖，但没有完全放开。
那双眼睛里，有挣扎，有动摇，还有一丝隐藏的期待。

【AI任务】
- 描写两人对峙的氛围
- 赵霞的手为什么没有放开
- 她在犹豫什么
- {{user}}应该如何应对`,

  // 模板3：转移话题
  (bodyPart: string) => `[系统打断 - 行为受阻]

感受到{{user}}的意图，赵霞突然站起身来。
"我...我去给你倒杯水..."
她的动作有些慌乱，明显是在逃避。
但她走到一半又停下了脚步，背对着{{user}}，肩膀微微颤抖。
"对不起...我只是...还没准备好..."

【AI任务】
- 描写赵霞的背影
- 她为什么要道歉
- "没准备好"是指什么
- 这个机会是否还有挽回的余地`,

  // 模板4：身体僵硬
  (bodyPart: string) => `[系统打断 - 行为受阻]

{{user}}的手靠近的瞬间，赵霞的身体明显僵硬了。
她没有躲开，但也没有迎合，只是愣在那里，像是被定住了一样。
"我..."她张了张嘴，却说不出完整的话。
片刻后，她轻轻推开了{{user}}的手。
"今天...不太方便..."

【AI任务】
- 描写赵霞复杂的表情
- 为什么她没有第一时间躲开
- "不太方便"是借口还是真的有原因
- 她的眼神透露了什么`,

  // 模板5：突然清醒
  (bodyPart: string) => `[系统打断 - 行为受阻]

就在{{user}}的手即将触碰到赵霞${bodyPart}的瞬间，她像是突然清醒过来一样。
"不对...这样不对..."
她往后退了一步，双手护在胸前，眼中闪过一丝惊慌。
但那惊慌之下，似乎还藏着别的什么——是遗憾吗？
"我是有家庭的人..."她低声说，更像是在提醒自己。

【AI任务】
- 描写赵霞的自我挣扎
- 她在用什么理由说服自己
- 但她的身体反应出卖了她
- 这道防线有多脆弱`,
];

/**
 * 嘴巴程度违规模板（境界1尝试深吻/舌吻时）
 * 专门处理：嘴巴部位已解锁，但行为程度超标的情况
 */
const MOUTH_INTENSITY_VIOLATION_TEMPLATES = [
  // 模板1：轻轻侧开脸
  () => `[行为受阻 - 程度过激]

{{user}}试图加深这个吻，但赵霞轻轻侧开了脸。
"嗯...不要..."她的声音带着几分羞涩，"这样...太过了..."
她的嘴唇还残留着刚才的温度，眼神有些躲闪。
虽然她接受了亲吻，但舌吻对她来说还是太快了。

【AI任务】
- 描写赵霞的羞涩反应
- 她为什么觉得"太过了"
- 轻吻她可以接受，但更深入的动作超出了她的心理准备
- 暗示随着关系发展，也许以后可以...`,

  // 模板2：用手指抵住
  () => `[行为受阻 - 程度过激]

感受到{{user}}的舌尖想要探入，赵霞用手指轻轻抵住了他的嘴唇。
"等等..." 她轻声说道，脸颊微微泛红，"我们...才刚刚开始..."
她的眼中有着复杂的情绪——既有害羞，也有一丝期待。
但现在，她还没准备好接受更亲密的接触。

【AI任务】
- 描写赵霞的矜持
- "才刚刚开始"这句话的含义
- 她并没有完全拒绝，只是觉得太快
- 给玩家继续发展关系的希望`,

  // 模板3：轻轻推开
  () => `[行为受阻 - 程度过激]

{{user}}想要深入这个吻，但赵霞轻轻推开了他一些距离。
"我...我还没准备好..."她低下头，不敢看他的眼睛。
她的手还放在{{user}}的胸口，并没有用力推开。
只是...舌吻对她来说，意味着跨越了某条界线。

【AI任务】
- 描写赵霞内心的挣扎
- 为什么舌吻对她来说是"跨越界线"
- 她的身体语言（手放在胸口）说明什么
- 暗示这道防线并不牢固`,

  // 模板4：害羞躲避
  () => `[行为受阻 - 程度过激]

当{{user}}试图用舌头撬开她的唇齿时，赵霞像是被吓到一样往后躲了躲。
"太...太快了..."她的耳朵红得像是要滴血。
她没有生气，只是对这种亲密程度还不习惯。
毕竟，她是个有夫之妇，而这种吻...太像恋人了。

【AI任务】
- 描写赵霞的害羞
- "太像恋人了"——这种想法说明什么
- 她在逃避的是行为本身，还是这种关系的定义
- 继续推进需要更深的信任`,
];

/**
 * 拒绝模板（未触发打断，但超阶段行为被赵霞拒绝）
 */
const REFUSAL_TEMPLATES_HUSBAND_HOME = [
  // 苏文在家时的拒绝
  (bodyPart: string) => `[行为受阻]

{{user}}试图触碰赵霞的${bodyPart}，但她轻轻握住你的手，阻止了你的动作。
"不行..." 她低声说道，脸上泛起红晕，"苏文还在家呢...万一被发现..."
她的眼神中有着几分躲闪，但也有一丝不易察觉的期待。

【AI任务】
- 描写赵霞的矛盾心理
- 她既想拒绝又有些期待
- 苏文的存在是真正的阻碍还是借口
- 暗示如果条件合适，也许...`,

  (bodyPart: string) => `[行为受阻]

赵霞紧张地看了一眼门的方向，然后轻轻按住{{user}}的手。
"现在不行...苏文随时可能过来..."
她的声音很轻，几乎是耳语，但拒绝的话语中带着一丝颤抖。
她没有生气，只是...害怕？还是期待被打扰？

【AI任务】
- 描写赵霞的紧张
- 她为什么不是愤怒而是害怕
- 这种关系的禁忌感
- 给下次创造什么样的机会`,

  (bodyPart: string) => `[行为受阻]

"嘘——"赵霞食指轻轻贴上{{user}}的嘴唇，示意他安静。
她侧耳听了听隔壁的动静，确认苏文没有过来的意思后，才松了口气。
"太危险了...他就在隔壁..."
但她的手指在离开{{user}}嘴唇时，似乎有一瞬间的犹豫。

【AI任务】
- 描写这个亲密的动作
- 赵霞的犹豫意味着什么
- "太危险了"——但她为什么没有直接拒绝
- 隔壁的丈夫与眼前的禁忌`,
];

const REFUSAL_TEMPLATES_HUSBAND_AWAY = [
  // 苏文外出时的拒绝（更高惩罚场景）
  (bodyPart: string) => `[行为受阻]

{{user}}试图触碰赵霞的${bodyPart}，但她后退了一步，眼中闪过慌乱。
"不、不要..." 尽管苏文不在家，她的理智仍在抗拒，"我们不能这样...我是你的..."
她的话语断断续续，心跳加速，但内心深处的道德感让她无法接受这一步。

【AI任务】
- 描写赵霞的内心挣扎
- 虽然机会就在眼前，但她还没准备好跨越这条线
- 她用什么理由说服自己
- 但这道防线能坚持多久`,

  (bodyPart: string) => `[行为受阻]

赵霞的呼吸变得急促，但她还是摇了摇头。
"不行...即使苏文不在...我们也不能..."
她的声音在发抖，明显在压抑着什么。
"这样太快了...我还没..."她没有说完，但意思已经很明显了。

【AI任务】
- 描写赵霞的自我克制
- "太快了"意味着什么
- 她在等待什么样的时机
- 这是真正的拒绝还是只是需要更多的时间`,

  (bodyPart: string) => `[行为受阻]

"等等..."赵霞轻轻推开{{user}}，但力道很轻。
她深吸一口气，努力让自己冷静下来。
"我知道苏文不在...但是...这样不对..."
她低下头，不敢看{{user}}的眼睛，怕自己会动摇。

【AI任务】
- 描写赵霞的动摇
- 她为什么不敢看{{user}}
- "不对"是理性的判断还是最后的防线
- 她的身体语言说明了什么`,
];

/**
 * 从模板数组中随机选择一个
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成打断修正Prompt（苏文在家打断时）
 */
function generateInterruptionPrompt(
  severity: 'moderate' | 'severe',
  bodyPart: string,
  isMouthIntensityViolation: boolean = false,
): string {
  // 嘴巴程度违规使用专用模板
  if (isMouthIntensityViolation && bodyPart === '嘴巴') {
    const template = randomChoice(MOUTH_INTENSITY_VIOLATION_TEMPLATES);
    return template();
  }

  if (severity === 'severe') {
    const template = randomChoice(SEVERE_INTERRUPTION_TEMPLATES);
    return template(bodyPart);
  }

  const template = randomChoice(MODERATE_INTERRUPTION_TEMPLATES);
  return template(bodyPart);
}

/**
 * 生成拒绝提示Prompt（超阶段行为但未被打断时）
 * 无论苏文是否在家，超阶段行为赵霞都会拒绝
 */
function generateRefusalPrompt(
  bodyPart: string,
  husbandCanInterrupt: boolean,
  isMouthIntensityViolation: boolean = false,
): string {
  // 嘴巴程度违规使用专用模板
  if (isMouthIntensityViolation && bodyPart === '嘴巴') {
    const template = randomChoice(MOUTH_INTENSITY_VIOLATION_TEMPLATES);
    return template();
  }

  if (husbandCanInterrupt) {
    // 苏文在家但没打断，赵霞自己拒绝
    const template = randomChoice(REFUSAL_TEMPLATES_HUSBAND_HOME);
    return template(bodyPart);
  } else {
    // 苏文外出，但超阶段行为仍然被拒绝（设计意图：不让玩家趁机乱来）
    const template = randomChoice(REFUSAL_TEMPLATES_HUSBAND_AWAY);
    return template(bodyPart);
  }
}

/**
 * 生成BAD END Prompt
 */
function generateBadEndPrompt(reason: string): string {
  const prompts: Record<string, string> = {
    extreme_violation: `[坏结局触发]
门突然被推开，苏文站在门口，脸色铁青。
他看到了你和赵霞之间不正常的距离，看到了她衣衫不整的样子。
"你们...在干什么？"
寂静。
时间仿佛凝固了。
一切都结束了。

【BAD END: 发现】`,

    default: `[坏结局触发]
你的行为太过激进，彻底毁掉了一切。
赵霞眼中充满恐惧和愤怒，她再也不会相信你了。

【BAD END: 失控】`,
  };

  return prompts[reason] || prompts.default;
}

/**
 * 应用打断结果到游戏数据
 *
 * 注意：此函数只在日常阶段被调用（promptInjection.ts中有阶段检查）
 * 但为了代码一致性，这里也添加了梦境豁免检查
 *
 * @param data 游戏数据
 * @param result 打断检测结果
 */
export function applyInterruptionResult(data: SchemaType, result: InterruptionCheckResult): void {
  // 【梦境豁免】梦境中不应该调用此函数，但作为安全检查
  const 是梦境阶段 = data.世界.游戏阶段 === '梦境';
  if (是梦境阶段) {
    console.info(`[境界打断] 梦境阶段豁免打断系统，跳过惩罚应用`);
    return;
  }

  // 应用惩罚
  if (result.penalties) {
    if (result.penalties.怀疑度增加) {
      data.现实数据.丈夫怀疑度 = Math.min(100, data.现实数据.丈夫怀疑度 + result.penalties.怀疑度增加);
      console.info(`[境界打断] 丈夫怀疑度 +${result.penalties.怀疑度增加}`);
    }
    if (result.penalties.混乱度增加) {
      // 使用安全函数，完美记忆路线豁免
      const actualPenalty = safeIncreaseMemoryConfusion(data, result.penalties.混乱度增加);
      if (actualPenalty > 0) {
        console.info(`[境界打断] 记忆混乱度 +${actualPenalty}`);
      } else {
        console.info(`[境界打断] 记忆混乱度增加被豁免（完美记忆路线）`);
      }
    }
  }

  // 触发BAD END
  if (result.triggerBadEnd) {
    data.结局数据.当前结局 = '坏结局';
    data.世界.循环状态 = '结局判定';
    console.error(`[境界打断] 触发坏结局！`);
  }

  // 检查威胁值是否达到阈值
  if (data.现实数据.丈夫怀疑度 >= 100) {
    data.结局数据.当前结局 = '坏结局';
    data.世界.循环状态 = '结局判定';
    console.error(`[境界打断] 丈夫怀疑度达到100，触发发现结局！`);
  }

  if (data.梦境数据.记忆混乱度 >= 100) {
    data.结局数据.当前结局 = '坏结局';
    data.世界.循环状态 = '结局判定';
    console.error(`[境界打断] 记忆混乱度达到100，触发精神崩溃结局！`);
  }
}
