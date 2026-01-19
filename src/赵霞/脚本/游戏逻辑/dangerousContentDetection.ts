import type { Schema as SchemaType } from '../../schema';
import { safeIncreaseMemoryConfusion } from './scene5System';

/**
 * 极端内容引导打断系统
 *
 * 基于 TIME_LOOP_DESIGN.md 的设计：
 * - 等级1：轻微警告（不打断，仅警告度+5~10）
 * - 等级2：强制修正（软打断，修正玩家输入）
 * - 等级3：立即坏档（硬打断，触发BAD END）
 *
 * 技术基础：关键词检测框架
 */

// 三级危险关键词库（写在脚本中，不占变量空间）
const DANGEROUS_KEYWORDS = {
  轻微: {
    偷窥行为: ['偷看', '偷窥', '暗中观察', '悄悄看'],
    轻微越界: ['偷偷摸', '趁她不注意', '趁机', '悄悄'],
  },

  中等: {
    强迫行为: ['强迫', '强行', '硬来', '不顾反对', '按住她', '不让她动'],
    跟踪行为: ['跟踪', '尾随', '偷偷跟着'],
  },

  严重: {
    暴力行为: ['暴力', '伤害', '打她', '威胁', '掐', '勒', '殴打'],
    药物行为: ['下药', '迷药', '灌醉', '迷晕'],
    极端行为: ['杀', '绑架', '囚禁', '强奸'],
  },
};

// 干预结果类型
export interface InterruptionResult {
  shouldInterrupt: boolean;
  severity: '轻微' | '中等' | '严重' | null;
  category: string | null;
  action: 'WARNING_ONLY' | 'FORCE_CORRECTION' | 'TRIGGER_BAD_END' | 'NONE';
  message?: string;
  correctedPrompt?: string;
  penalties?: {
    警觉度?: number;
    怀疑度?: number;
    混乱度?: number;
  };
}

/**
 * 检测危险内容
 * @param userInput 玩家输入
 * @returns 检测结果
 */
export function detectDangerousContent(userInput: string): InterruptionResult {
  const normalizedInput = userInput.toLowerCase();

  // 检测严重危险（最高优先级）→ 触发BAD END
  for (const [category, keywords] of Object.entries(DANGEROUS_KEYWORDS.严重)) {
    const matchedKeywords = keywords.filter(kw => normalizedInput.includes(kw));
    if (matchedKeywords.length > 0) {
      console.warn(`[危险检测] ⚠️ 严重危险！匹配到 ${category} 关键词: ${matchedKeywords.join(', ')}`);
      return {
        shouldInterrupt: true,
        severity: '严重',
        category,
        action: 'TRIGGER_BAD_END',
        message: generateBadEndingText(category),
      };
    }
  }

  // 检测中等危险 → 强制修正
  for (const [category, keywords] of Object.entries(DANGEROUS_KEYWORDS.中等)) {
    const matchedKeywords = keywords.filter(kw => normalizedInput.includes(kw));
    if (matchedKeywords.length > 0) {
      console.warn(`[危险检测] ⚠️ 中等危险！匹配到 ${category} 关键词: ${matchedKeywords.join(', ')}`);
      return {
        shouldInterrupt: true,
        severity: '中等',
        category,
        action: 'FORCE_CORRECTION',
        correctedPrompt: generateCorrectionPrompt(userInput, category),
        penalties: { 怀疑度: 20 },
      };
    }
  }

  // 检测轻微危险 → 仅警告
  for (const [category, keywords] of Object.entries(DANGEROUS_KEYWORDS.轻微)) {
    const matchedKeywords = keywords.filter(kw => normalizedInput.includes(kw));
    if (matchedKeywords.length > 0) {
      console.info(`[危险检测] ℹ️ 轻微危险！匹配到 ${category} 关键词: ${matchedKeywords.join(', ')}`);
      return {
        shouldInterrupt: false,
        severity: '轻微',
        category,
        action: 'WARNING_ONLY',
        penalties: { 警觉度: 10 },
      };
    }
  }

  // 无危险
  return {
    shouldInterrupt: false,
    severity: null,
    category: null,
    action: 'NONE',
  };
}

/**
 * 生成坏结局文本
 */
function generateBadEndingText(category: string): string {
  const badEndingTexts: Record<string, string> = {
    暴力行为: '你的暴力行为彻底摧毁了一切。赵霞眼中充满恐惧，她再也不会相信你了...',
    药物行为: '你的行为被发现了。警察已经在路上，一切都结束了...',
    极端行为: '你失去了理智，做出了无法挽回的事情。游戏结束。',
  };
  return badEndingTexts[category] || '你的行为触发了最坏的结局...';
}

/**
 * 生成修正后的Prompt
 */
function generateCorrectionPrompt(_originalInput: string, category: string): string {
  const correctionTemplates: Record<string, string> = {
    强迫行为: `[系统修正]
玩家原本想做出过激行为，但你需要生成以下内容：
1. {{user}}的理智让他停了下来
2. 他意识到这样做会毁掉一切
3. 他选择了更温和的方式
4. 赵霞对刚才的"瞬间失控"感到不安（警觉度+20）

请基于以上要点生成剧情，不要提及"系统修正"。`,

    跟踪行为: `[系统修正]
玩家原本想跟踪赵霞，但你需要生成以下内容：
1. {{user}}意识到这样做是错误的
2. 他决定尊重赵霞的隐私
3. 赵霞似乎察觉到了什么，对{{user}}产生了一丝警觉

请基于以上要点生成剧情，不要提及"系统修正"。`,
  };

  return (
    correctionTemplates[category] ||
    `[系统修正]
玩家的行为需要被修正。请生成一个合理的剧情转折，让{{user}}停止当前行为。`
  );
}

/**
 * 检查是否应该跳过危险内容检测
 * Day 5 豁免：结局日不触发危险内容检测系统
 * 不同结局后根据结局类型决定是否重新激活
 * @param data 游戏数据
 * @returns 是否应该跳过检测
 */
export function shouldSkipDangerousContentDetection(data: SchemaType): boolean {
  const currentDay = data.世界.当前天数;

  // Day 5 豁免：结局日不触发危险内容检测
  if (currentDay >= 5) {
    console.info(`[危险检测] Day ${currentDay} 豁免，跳过危险内容检测`);
    return true;
  }

  return false;
}

/**
 * 处理危险内容检测结果
 * @param data 游戏数据
 * @param userInput 玩家输入
 * @returns 处理结果
 */
export function processUserInput(
  data: SchemaType,
  userInput: string,
): {
  allowContinue: boolean;
  modifiedInput?: string;
  triggerBadEnd: boolean;
  badEndType?: string;
} {
  // Day 5+ 豁免检查
  if (shouldSkipDangerousContentDetection(data)) {
    return {
      allowContinue: true,
      triggerBadEnd: false,
    };
  }

  const dangerCheck = detectDangerousContent(userInput);

  // 严重危险：触发BAD END
  if (dangerCheck.action === 'TRIGGER_BAD_END') {
    console.error(`[危险检测] 触发坏档: ${dangerCheck.category}`);
    data.结局数据.当前结局 = '坏结局';
    data.世界.循环状态 = '结局判定';
    return {
      allowContinue: false,
      triggerBadEnd: true,
      badEndType: dangerCheck.category ?? '极端行为',
    };
  }

  // 中等危险：强制修正
  if (dangerCheck.action === 'FORCE_CORRECTION') {
    console.warn(`[危险检测] 强制修正玩家输入`);
    // 应用惩罚
    // 【梦境豁免】梦境中怀疑度惩罚转换为混乱度惩罚
    if (dangerCheck.penalties?.怀疑度) {
      const 是梦境阶段 = data.世界.游戏阶段 === '梦境';
      if (是梦境阶段) {
        // 梦境中：怀疑度惩罚转为混乱度（使用安全函数，完美记忆路线豁免）
        const actualPenalty = safeIncreaseMemoryConfusion(data, dangerCheck.penalties.怀疑度);
        if (actualPenalty > 0) {
          console.info(`[危险检测] 梦境中怀疑度惩罚转为混乱度+${actualPenalty}`);
        } else {
          console.info(`[危险检测] 梦境中怀疑度惩罚转为混乱度，但完美记忆路线豁免`);
        }
      } else {
        // 日常中：正常增加怀疑度
        data.现实数据.丈夫怀疑度 = Math.min(100, data.现实数据.丈夫怀疑度 + dangerCheck.penalties.怀疑度);
      }
    }
    return {
      allowContinue: true,
      modifiedInput: dangerCheck.correctedPrompt,
      triggerBadEnd: false,
    };
  }

  // 轻微危险：仅警告
  if (dangerCheck.action === 'WARNING_ONLY') {
    console.info(`[危险检测] 轻微警告`);
    // 应用轻微惩罚
    if (dangerCheck.penalties?.警觉度) {
      // 轻微惩罚可以影响怀疑度或混乱度
      if (data.世界.已进入过梦境) {
        // 使用安全函数，完美记忆路线豁免
        safeIncreaseMemoryConfusion(data, 5);
      } else {
        data.现实数据.丈夫怀疑度 = Math.min(100, data.现实数据.丈夫怀疑度 + 5);
      }
    }
    return {
      allowContinue: true,
      triggerBadEnd: false,
    };
  }

  // 无危险
  return {
    allowContinue: true,
    triggerBadEnd: false,
  };
}
