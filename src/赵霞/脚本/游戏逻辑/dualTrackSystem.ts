import type { Schema as SchemaType } from '../../schema';

/**
 * 双轨开发系统 + 显示文本映射
 *
 * 基于 TIME_LOOP_DESIGN.md 的设计：
 * - 表面层：玩家看到的是简化版游戏
 * - 核心层：真正的玩法是梦境记忆重构
 *
 * 两个路线完全共用数据结构，只是显示文本不同
 */

// ============================================
// 苦主视角解析（从AI输出中提取）
// ============================================

/**
 * 清理文本中的AI思维链和内部标记
 * BUG-011 修复：过滤掉可能混入苦主视角的AI内部内容
 * @param text 原始文本
 * @returns 清理后的文本
 */
function cleanThinkingContent(text: string): string {
  let cleaned = text;

  // 移除 <think> 标签及其内容
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 移除 <core_memory> 标签及其内容
  cleaned = cleaned.replace(/<core_memory>[\s\S]*?<\/core_memory>/gi, '');

  // 移除 <!-- ... --> HTML注释（包括 writing antThinking 等）
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 移除可能的法语/英语思考内容标记
  cleaned = cleaned.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '');

  // 移除 WAIT: 或 UPDATE: 等内部指令
  cleaned = cleaned.replace(/(?:^|\n)\s*(?:WAIT|UPDATE|IMPORTANT|NOTE|TODO):\s*[^\n]*/gi, '');

  // 移除以 - 开头的连续列表项（可能是AI的分析列表）
  // 但保留正常的短列表（少于3项）
  const listMatches = cleaned.match(/(?:^|\n)\s*-\s+[^\n]+/g);
  if (listMatches && listMatches.length > 5) {
    // 超过5个列表项，可能是AI的分析内容，移除
    cleaned = cleaned.replace(/(?:^|\n)\s*-\s+[^\n]+/g, '');
  }

  // 移除变量检查相关内容
  cleaned = cleaned.replace(/Variable check:[\s\S]*?(?=\n\n|\n[^\n-]|$)/gi, '');
  cleaned = cleaned.replace(/Update Variable check:[\s\S]*?(?=\n\n|\n[^\n-]|$)/gi, '');

  // 移除 So we are in 等分析性语句
  cleaned = cleaned.replace(/So we are in[\s\S]*?(?=\n\n|$)/gi, '');

  // 移除 Key constraint 等提示
  cleaned = cleaned.replace(/Key constraint:[\s\S]*?(?=\n\n|$)/gi, '');

  // 移除多余的空白行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * 验证内容是否像是合法的苦主视角（而非AI思维链）
 * @param text 待验证文本
 * @returns 是否合法
 */
function isValidHusbandThought(text: string): boolean {
  // 如果太长（超过500字符），可能是思维链
  if (text.length > 500) {
    console.warn(`[苦主视角] 内容过长(${text.length}字符)，可能是AI思维链，拒绝使用`);
    return false;
  }

  // 如果包含明显的AI内部标记，拒绝
  const invalidPatterns = [
    /<think>/i,
    /<core_memory>/i,
    /<!--.*-->/,
    /\[thinking\]/i,
    /Variable check:/i,
    /Key constraint:/i,
    /So we are in/i,
    /WAIT:/i,
    /writing antThinking/i,
    /Let me/i, // AI自我指令
    /I should/i, // AI自我指令
    /I need to/i, // AI自我指令
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(text)) {
      console.warn(`[苦主视角] 检测到AI内部标记，拒绝使用: ${pattern}`);
      return false;
    }
  }

  // 如果中英文/法语混杂过多，可能是AI思考
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = text.length;
  const chineseRatio = chineseChars / totalChars;

  // 正常的苦主视角应该主要是中文（至少50%）
  if (chineseRatio < 0.3 && totalChars > 50) {
    console.warn(`[苦主视角] 中文比例过低(${(chineseRatio * 100).toFixed(1)}%)，可能是AI思维链，拒绝使用`);
    return false;
  }

  return true;
}

/**
 * 从AI回复中解析苦主视角（丈夫心理活动）
 * @param aiText AI的回复文本
 * @returns 解析出的心理活动文本，如果没有则返回null
 */
export function parseHusbandThought(aiText: string): string | null {
  const match = aiText.match(/<HusbandThought>([\s\S]*?)<\/HusbandThought>/i);
  if (match && match[1]) {
    let thought = match[1].trim();

    // BUG-011 修复：清理可能混入的AI思维链内容
    thought = cleanThinkingContent(thought);

    if (thought.length > 0) {
      // 验证内容是否合法
      if (!isValidHusbandThought(thought)) {
        console.warn(`[苦主视角] 内容未通过验证，返回null`);
        return null;
      }

      console.info(`[苦主视角] 解析到AI生成的心理活动: ${thought}`);
      return thought;
    }
  }
  return null;
}

/**
 * 检查是否应该生成苦主视角
 * @param data 游戏数据
 * @returns 是否满足触发条件
 */
export function shouldGenerateHusbandThought(data: SchemaType): boolean {
  // 必须是真相模式
  if (!data.世界.已进入过梦境) return false;
  // 必须是境界2+
  if (data.赵霞状态.当前境界 < 2) return false;

  // 【2026-01-19修复】苦主视角生成条件扩展
  // Day 5 豁免只影响数值增长，不影响苦主视角的生成和更新
  // 苦主视角在以下情况下生成：
  // 1. 日常阶段（包括 Day 5 的日常阶段）
  // 2. 假好结局的自由模式（游戏阶段可能是 '结局' 但仍需要苦主视角）

  const 游戏阶段 = data.世界.游戏阶段;
  const 当前结局 = data.结局数据?.当前结局;

  // 情况1：日常阶段（包括 Day 5）
  if (游戏阶段 === '日常') {
    return true;
  }

  // 情况2：假好结局期间（苏文外出/加班时的自由时间）
  // 假好结局需要苦主视角来体现苏文在外地的心理活动
  if (当前结局 === '假好结局') {
    // 假好结局的自由时间（21:00, 23:00）也需要苦主视角
    const 当前小时 = data.世界.当前小时;
    const 是自由时间 = 当前小时 === 21 || 当前小时 === 23;
    if (是自由时间) {
      return true;
    }
  }

  // 【2026-01-18优化】无论苏文是否在家都输出苦主视角
  // 苏文在家时：描写他亲眼所见的异常
  // 苏文不在家时：描写他在外地时的隐隐不安、电话中的异样、心中的疑虑

  return false;
}

// 路线类型
export type RouteType = '现实' | '梦境';

// 显示文本映射表（唯一区别）
// Bug #34 修复：使用 textMapping.ts 定义的真相模式境界名称
const DISPLAY_TEXT_MAP = {
  // 阶段名称映射
  阶段名称: {
    现实: ['境界1【初染】', '境界2【迷途】', '境界3【溺深】', '境界4【归虚】', '境界5【焚誓】'],
    梦境: ['场景1【初识】', '场景2【禁忌】', '场景3【沉沦】', '场景4【疯狂】', '场景5【归宿】'],
  },

  // 核心数值显示名
  核心数值名: {
    现实: '好感度',
    梦境: '记忆深度',
  },

  // 部位进度条标题
  部位进度标题: {
    现实: '开发进度',
    梦境: '记忆深度',
  },

  // 威胁数值名
  威胁数值名: {
    现实: '丈夫怀疑度',
    梦境: '记忆混乱度',
  },

  // 状态栏图标
  状态栏图标: {
    现实: '🌸',
    梦境: '🌙',
  },
};

// 境界-状态描述
const REALM_DESCRIPTIONS = {
  现实: [
    { 状态描述: '初期抗争，正常家庭主妇形象', 外观描述: '保守的居家服装，素颜或淡妆' },
    { 状态描述: '禁忌萌芽，开始动摇', 外观描述: '正常到清凉的暴露度，淡妆' },
    { 状态描述: '主动靠近，母性崩塌', 外观描述: '清凉到暴露的装扮，日常妆容' },
    { 状态描述: '彻底沦陷，抛弃矜持', 外观描述: '暴露到极度暴露，浓艳妆容' },
    { 状态描述: '完美伪装，内心极致堕落', 外观描述: '表面保守，内在极度性感' },
  ],
  梦境: [
    { 状态描述: '第一次遇见，陌生而好奇', 外观描述: '记忆中的少女装扮' },
    { 状态描述: '保留前一个场景的记忆，开始动摇', 外观描述: '记忆中的装扮，略显慌乱' },
    { 状态描述: '主动靠近，心理防线开始崩塌', 外观描述: '记忆中的装扮，渴望的眼神' },
    { 状态描述: '彻底沦陷，完全接受', 外观描述: '梦境中的理想形象' },
    { 状态描述: '完美融合，记忆与现实交织', 外观描述: '新婚时的装扮' },
  ],
};

/**
 * 根据游戏状态获取当前路线类型
 */
export function getCurrentRouteType(data: SchemaType): RouteType {
  return data.世界.已进入过梦境 ? '梦境' : '现实';
}

/**
 * 获取当前阶段的显示文本
 * @param stage 阶段编号 (1-5)
 * @param routeType 路线类型
 */
export function getStageText(stage: number, routeType: RouteType): string {
  const index = Math.max(0, Math.min(stage - 1, 4));
  return DISPLAY_TEXT_MAP.阶段名称[routeType][index];
}

/**
 * 获取核心数值的显示名
 */
export function getCoreValueName(routeType: RouteType): string {
  return DISPLAY_TEXT_MAP.核心数值名[routeType];
}

/**
 * 获取部位进度条的标题
 */
export function getBodyProgressTitle(routeType: RouteType): string {
  return DISPLAY_TEXT_MAP.部位进度标题[routeType];
}

/**
 * 获取威胁数值的显示名
 */
export function getThreatValueName(routeType: RouteType): string {
  return DISPLAY_TEXT_MAP.威胁数值名[routeType];
}

/**
 * 获取状态栏图标
 */
export function getStatusBarIcon(routeType: RouteType): string {
  return DISPLAY_TEXT_MAP.状态栏图标[routeType];
}

/**
 * 获取境界描述
 * @param stage 阶段编号 (1-5)
 * @param routeType 路线类型
 */
export function getRealmDescription(stage: number, routeType: RouteType): { 状态描述: string; 外观描述: string } {
  const index = Math.max(0, Math.min(stage - 1, 4));
  return REALM_DESCRIPTIONS[routeType][index];
}

/**
 * 获取当前威胁值
 */
export function getCurrentThreatValue(data: SchemaType): number {
  if (data.世界.已进入过梦境) {
    return data.梦境数据.记忆混乱度;
  }
  return data.现实数据.丈夫怀疑度;
}

/**
 * 生成状态栏显示数据
 */
export function generateStatusBarData(data: SchemaType): {
  routeType: RouteType;
  icon: string;
  stageName: string;
  coreValueName: string;
  coreValue: number;
  threatValueName: string;
  threatValue: number;
  bodyProgressTitle: string;
  bodyProgress: {
    嘴巴: number;
    胸部: number;
    下体: number;
    后穴: number;
    精神: number;
  };
  stateDescription: string;
  appearanceDescription: string;
} {
  const routeType = getCurrentRouteType(data);
  const stage = data.赵霞状态.当前境界;
  const realmDesc = getRealmDescription(stage, routeType);

  return {
    routeType,
    icon: getStatusBarIcon(routeType),
    stageName: getStageText(stage, routeType),
    coreValueName: getCoreValueName(routeType),
    coreValue: data.赵霞状态.依存度,
    threatValueName: getThreatValueName(routeType),
    threatValue: getCurrentThreatValue(data),
    bodyProgressTitle: getBodyProgressTitle(routeType),
    bodyProgress: { ...data.赵霞状态.部位进度 },
    stateDescription: realmDesc.状态描述,
    appearanceDescription: realmDesc.外观描述,
  };
}

// 注意：苦主视角（丈夫心理活动）现在由AI动态生成
// 解析函数：parseHusbandThought(aiText)
// 条件检查：shouldGenerateHusbandThought(data)
// 详见文件顶部的函数定义

/**
 * 获取丈夫心理活动（从数据中读取AI生成的内容）
 * @param data 游戏数据
 * @returns 丈夫心理活动文本，如果没有则返回null
 * @deprecated 此函数保留用于兼容，实际应使用 parseHusbandThought 从AI回复中解析
 */
export function generateHusbandPerspective(data: SchemaType): string | null {
  // 检查条件
  if (!shouldGenerateHusbandThought(data)) return null;

  // 返回已存储的AI生成内容
  return data.现实数据.丈夫心理活动 ?? null;
}

/**
 * 检查是否应该显示丈夫怀疑度（仅现实路线）
 */
export function shouldShowHusbandSuspicion(data: SchemaType): boolean {
  return !data.世界.已进入过梦境;
}

/**
 * 检查是否应该显示记忆混乱度（仅梦境路线）
 */
export function shouldShowMemoryConfusion(data: SchemaType): boolean {
  return data.世界.已进入过梦境;
}

/**
 * 获取双轨系统对比说明（用于调试或帮助界面）
 */
export function getDualTrackComparison(): string {
  return `
┌───────────────────────────────────────────────────────────────┐
│                       双轨开发系统对比                        │
├───────────────────────────────────────────────────────────────┤
│                    现实路线              │      梦境路线       │
├───────────────────────────────────────────────────────────────┤
│ 触发条件       │ 从未进入梦境            │ 发现并进入梦境      │
│ 开发速度       │ 正常（需要多天累积）    │ 快速（1晚可达80%+） │
│ 境界限制       │ 跨境界行为触发打断      │ 打断概率大幅降低    │
│ 打断概率       │ 75%~100%                │ 25%~80%            │
│ 威胁数值       │ 丈夫怀疑度              │ 记忆混乱度         │
│ 显示风格       │ 好感度/境界             │ 记忆深度/场景      │
│ 可达结局       │ 最佳坏结局              │ 真好结局/假好结局  │
│ 苦主视角       │ 无                      │ 有（白天触发）     │
└───────────────────────────────────────────────────────────────┘
`;
}
