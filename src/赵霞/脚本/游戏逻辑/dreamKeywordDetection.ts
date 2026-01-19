import type { Schema as SchemaType } from '../../schema';
import { safeIncreaseMemoryConfusion } from './scene5System';

/**
 * 记忆开发判定系统（梦境关键词检测）
 *
 * 基于 TIME_LOOP_DESIGN.md 的设计：
 * - 实时检测玩家输入涉及的部位
 * - 多线并进：所有5个部位同时累积进度
 * - 透明反馈：前端实时显示各部位的开发进度条
 *
 * 【数值平衡设计】（确保4天刚好完成4个部位）
 * - 每个关键词+2%，单次上限5%
 * - 每回合（玩家+AI）合并后上限8%
 * - 每晚总计上限25%（约3-4回合有效互动）
 * - 4晚专注同一部位 = 80-100%
 * - 4晚分散开发 = 每部位约20-25%
 * - 精神部位只能在场景5（需安眠药）大量开发
 */

/**
 * 5个部位的关键词库（写在脚本中，不占变量空间）
 *
 * 【2026-01-15 优化】
 * 问题：之前的关键词过于宽泛，导致大量误触发
 * - 单字词（"口"、"乳"、"胸"）在正常对话中极易出现
 * - 情绪词（"心跳"、"呼吸"、"意识"、"恍惚"）在场景描写中常见
 * - 方位词（"后面"、"下面"、"那里"）太过模糊
 *
 * 优化原则：
 * 1. 移除所有单字关键词
 * 2. 移除情绪/生理描写常用词
 * 3. 保留明确的亲密接触相关短语
 * 4. 使用组合词增加特异性（如"舔嘴"而非"舔"）
 * 5. 精神部位只保留强烈的改造相关词汇
 */
/**
 * Bug #37 修复：扩展关键词库
 * 问题：玩家使用俚语表达（如"嗦嗦大肉棒"）时，关键词库无法匹配
 * 解决：添加更多俚语、网络用语和常见变体
 *
 * 设计原则：
 * 1. 宽泛但不过于宽泛 - 避免单字词误触发
 * 2. 覆盖常见俚语和网络用语
 * 3. 包含动作+部位的组合形式
 */
const BODY_PART_KEYWORDS = {
  嘴巴: [
    // 基础词汇
    '舔嘴',
    '舔唇',
    '吮吸',
    '咬唇',
    '亲吻',
    '深吻',
    '舌吻',
    '口交',
    '舌尖触碰',
    '嘴唇相',
    '唇齿',
    '湿润的唇',
    '嘴里',
    '含住',
    '吻上',
    '吻住',
    // 常见变体
    '吻她',
    '亲她',
    '亲上',
    '接吻',
    '热吻',
    '唇瓣',
    '嘴唇',
    '初吻',
    // Bug #37 新增：俚语和网络用语
    '嗦',     // "嗦嗦"、"帮我嗦"等
    '吸吮',
    '舔舐',
    '含着',
    '口里',
    '嘴中',
    '用嘴',
    '张嘴',
    '口活',
    '深喉',
    '吞吐',
    '舌头',
    '伸舌',
  ],
  胸部: [
    // 基础词汇
    '乳房',
    '乳头',
    '胸部',
    '乳沟',
    '胸罩',
    '揉胸',
    '摸胸',
    '吮乳',
    '舔乳',
    '胸前隆起',
    '饱满的胸',
    '柔软的乳',
    '触碰胸',
    '抚摸乳',
    // 常见变体
    '触摸胸',
    '抚摸胸',
    '手摸胸',
    '摸她胸',
    '碰她胸',
    '捏胸',
    '握胸',
    '托住胸',
    '贴在胸',
    '靠在胸',
    '埋在胸',
    // 奶子相关词汇
    '奶子',
    '摸奶',
    '揉奶',
    '捏奶',
    '舔奶',
    '吸奶',
    '奶头',
    '大奶',
    '双乳',
    '酥胸',
    // Bug #37 新增：俚语和网络用语
    '咪咪',
    '巨乳',
    '丰满',
    '胸器',
    '乳交',
    '夹住',
    '乳肉',
    '乳尖',
  ],
  下体: [
    // 基础词汇
    '下体',
    '私处',
    '腿间',
    '花瓣',
    '花蕊',
    '秘密花园',
    '大腿内侧',
    '花穴',
    '蜜穴',
    '湿润的私',
    '私密部位',
    '触碰下',
    '抚摸腿间',
    // Bug #37 新增：俚语和网络用语（男性器官）
    '肉棒',
    '阳具',
    '鸡巴',
    '鸡儿',
    '大肉棒',
    '肉茎',
    '龟头',
    '茎身',
    '阴茎',
    '硬挺',
    '勃起',
    '套弄',
    '撸动',
    '手冲',
    // Bug #37 新增：俚语和网络用语（女性器官）
    '阴道',
    '阴蒂',
    '小穴',
    '蜜洞',
    '花径',
    '玉门',
    '肉缝',
    '阴唇',
    '豆蒂',
    '抠穴',
    '玩穴',
    '舔穴',
    '插穴',
    // Bug #37 新增：动作词
    '插入',
    '进入她',
    '插进',
    '顶入',
    '深入',
    '抽插',
    '抽送',
    '律动',
    '挺进',
    '进出',
  ],
  后穴: [
    // 基础词汇
    '后穴',
    '菊花',
    '后庭',
    '翘臀',
    '股沟',
    '肛门',
    '后门',
    '臀缝',
    '触碰后',
    '抚摸臀',
    // Bug #37 新增：俚语和网络用语
    '屁股',
    '臀部',
    '小菊',
    '肛交',
    '后入',
    '臀肉',
    '臀瓣',
    '屁屁',
    '玉臀',
    '浑圆的臀',
    '翘起的臀',
    '掰开',
    '扒开',
  ],
  精神: [
    '精神沦陷',
    '灵魂臣服',
    '意识模糊',
    '完全失控',
    '精神崩溃',
    '彻底沉沦',
    '堕落深渊',
    '精神依赖',
    '灵魂归属',
    '潜意识改写',
    '记忆改写',
    '精神控制',
    '心灵臣服',
    '完全屈服',
  ],
};

// ============================================
// 互动意图关键词（用于AI报告二次验证）
// ============================================

/**
 * 互动意图关键词库
 *
 * Bug #37 增强：扩展互动意图检测
 *
 * 用于二次验证AI的BODY_PROGRESS报告：
 * - 如果玩家输入完全无关（如"看风景"），忽略AI报告
 * - 如果玩家输入有互动意图（如"靠近她"），接受AI报告
 *
 * 关键词分类：
 * 1. 距离接近类：暗示向目标靠近
 * 2. 物理接触类：暗示身体接触
 * 3. 情感互动类：暗示情感表达
 * 4. 主动行为类：暗示主动行动
 * 5. 命令/请求类（新增）：让对方做某事
 */
const INTERACTION_INTENT_KEYWORDS = {
  // 距离接近类
  距离: [
    '靠近', '接近', '走近', '凑近', '贴近', '挨近',
    '走向', '走过去', '来到', '上前', '迎上',
    '面对', '对着', '看着她', '注视',
  ],

  // 物理接触类
  接触: [
    '抱', '拥抱', '搂', '揽', '拉', '牵', '握', '拽',
    '碰', '触', '摸', '抚', '蹭', '贴',
    '伸手', '伸出手', '双手', '手指',
    '身体', '靠在', '依偎', '倚靠',
  ],

  // 情感互动类
  情感: [
    '温柔', '轻轻', '柔声', '低语', '耳边',
    '安慰', '哄', '逗', '撩', '调戏',
    '表白', '告白', '说爱', '喜欢你',
    '看着眼睛', '对视', '眼神',
  ],

  // 主动行为类
  主动: [
    '主动', '开始', '继续', '不停', '更加',
    '用力', '加深', '深入', '进一步',
    '脱', '解开', '褪下', '掀起', '撩起',
    '带她', '引导', '让她',
  ],

  // Bug #37 新增：命令/请求类 - 让对方做某事
  命令: [
    '帮我', '给我', '让你', '要你', '帮你',
    '跪下', '趴下', '躺下', '站起', '转身',
    '张开', '分开', '抬起', '放下',
    '过来', '来吧', '好好', '乖乖',
    '没问题', '同意', '答应', '愿意',
  ],
};

/**
 * 检测玩家输入是否包含互动意图
 * 用于验证AI的BODY_PROGRESS报告
 *
 * @param userInput 玩家输入
 * @returns 是否有互动意图
 */
export function hasInteractionIntent(userInput: string): boolean {
  if (!userInput || userInput.trim().length === 0) {
    return false;
  }

  const allKeywords = [
    ...INTERACTION_INTENT_KEYWORDS.距离,
    ...INTERACTION_INTENT_KEYWORDS.接触,
    ...INTERACTION_INTENT_KEYWORDS.情感,
    ...INTERACTION_INTENT_KEYWORDS.主动,
    ...INTERACTION_INTENT_KEYWORDS.命令, // Bug #37 新增：命令/请求类
  ];

  const matchedKeywords = allKeywords.filter(kw => userInput.includes(kw));

  if (matchedKeywords.length > 0) {
    console.info(`[互动意图检测] 检测到互动意图关键词: [${matchedKeywords.join(', ')}]`);
    return true;
  }

  return false;
}

/**
 * 验证并处理AI的BODY_PROGRESS报告
 *
 * 二次验证规则：
 * 1. 如果玩家输入包含部位关键词 → 直接使用脚本检测结果，忽略AI报告
 * 2. 如果玩家输入无部位关键词，但有互动意图 → 采纳AI报告
 * 3. 如果玩家输入完全无关 → 忽略AI报告
 *
 * @param userInput 玩家输入
 * @param aiResponse AI回复
 * @returns 验证后的进度增量
 */
export function validateAndProcessAIReport(
  userInput: string,
  aiResponse: string
): BodyPartProgress {
  // 1. 先用脚本检测玩家输入
  const scriptDetected = detectBodyPartProgress(userInput);
  const hasScriptProgress = Object.values(scriptDetected).some(v => v > 0);

  // 如果脚本检测到进度，直接使用，不看AI报告
  if (hasScriptProgress) {
    console.info('[AI报告验证] 脚本已检测到部位关键词，使用脚本结果');
    return scriptDetected;
  }

  // 2. 解析AI报告
  const aiSuggested = parseAIBodyProgressSuggestion(aiResponse);
  const hasAISuggestion = Object.values(aiSuggested).some(v => v > 0);

  if (!hasAISuggestion) {
    console.info('[AI报告验证] AI未提供进度建议');
    return scriptDetected; // 返回全零
  }

  // 3. 二次验证：检查玩家是否有互动意图
  const hasIntent = hasInteractionIntent(userInput);

  if (hasIntent) {
    console.info('[AI报告验证] 玩家有互动意图，采纳AI报告');
    return aiSuggested;
  } else {
    console.info('[AI报告验证] 玩家无互动意图，忽略AI报告');
    return { 嘴巴: 0, 胸部: 0, 下体: 0, 后穴: 0, 精神: 0 };
  }
}

// 部位进度结果类型
export interface BodyPartProgress {
  嘴巴: number;
  胸部: number;
  下体: number;
  后穴: number;
  精神: number;
}

// 开发等级阈值（用于显示）
export const DEVELOPMENT_LEVELS = {
  Lv0: { min: 0, max: 19, 名称: '未开发' },
  Lv1: { min: 20, max: 39, 名称: '初步觉醒' },
  Lv2: { min: 40, max: 59, 名称: '明显敏感' },
  Lv3: { min: 60, max: 79, 名称: '高度敏感' },
  Lv4: { min: 80, max: 100, 名称: '完全开发' },
};

/**
 * 根据进度获取开发等级
 */
export function getDevelopmentLevel(progress: number): { level: string; name: string } {
  if (progress >= 80) return { level: 'Lv4', name: '完全开发' };
  if (progress >= 60) return { level: 'Lv3', name: '高度敏感' };
  if (progress >= 40) return { level: 'Lv2', name: '明显敏感' };
  if (progress >= 20) return { level: 'Lv1', name: '初步觉醒' };
  return { level: 'Lv0', name: '未开发' };
}

// ============================================
// 数值平衡常量
// ============================================

/** 每个关键词增加的进度 */
const PROGRESS_PER_KEYWORD = 2;

/** 单次检测的上限（玩家输入或AI回复单独检测） */
const SINGLE_DETECTION_MAX = 5;

/** 每回合合并后的上限（玩家+AI合并） */
const MERGED_PROGRESS_MAX = 8;

/** AI建议的单次上限 */
const AI_SUGGESTION_MAX = 5;

/** 每晚每个部位的开发上限
 * 【平衡性调整 2026-01-16】
 * - 目标：4天梦境中把全部数值做到80-100%
 * - 每晚上限20%，4晚 = 80%
 * - 专注开发某个部位可达100%
 */
const NIGHTLY_PROGRESS_CAP = 20;

/**
 * 检测玩家输入涉及的部位进度
 * @param userInput 玩家输入
 * @returns 各部位的进度增量
 */
export function detectBodyPartProgress(userInput: string): BodyPartProgress {
  const result: BodyPartProgress = { 嘴巴: 0, 胸部: 0, 下体: 0, 后穴: 0, 精神: 0 };

  // Bug #23 调试：显示玩家输入（截取前100字符）
  const inputPreview = userInput.length > 100 ? userInput.substring(0, 100) + '...' : userInput;
  console.info(`[梦境开发] 检测玩家输入: "${inputPreview}"`);

  for (const [part, keywords] of Object.entries(BODY_PART_KEYWORDS)) {
    const matchedKeywords = keywords.filter((kw) => userInput.includes(kw));
    const matchCount = matchedKeywords.length;
    if (matchCount > 0) {
      // 每个关键词+2%，单次上限5%
      const increment = Math.min(SINGLE_DETECTION_MAX, matchCount * PROGRESS_PER_KEYWORD);
      result[part as keyof BodyPartProgress] = increment;
      // 显示匹配到的具体关键词
      console.info(`[梦境开发] 检测到 ${part} 关键词 ${matchCount} 个: [${matchedKeywords.join(', ')}]，进度+${increment}%`);
    }
  }

  // 如果没有检测到任何关键词，记录提示
  const totalProgress = Object.values(result).reduce((sum, v) => sum + v, 0);
  if (totalProgress === 0) {
    console.info(`[梦境开发] 未检测到任何部位关键词`);
  }

  return result;
}

/**
 * 计算当前梦境场景编号
 *
 * Bug #24 修复：schema 中没有 "当前梦境场景" 字段，需要动态计算
 *
 * 规则：
 * - 场景5：检查 场景5.已进入 === true
 * - 场景1-4：根据 _梦境入口天数 计算（Day 1→场景1，Day 2→场景2，...）
 *
 * @param data 游戏数据
 * @returns 场景编号（1-5），如果无法确定返回 undefined
 */
function getCurrentDreamSceneNumber(data: SchemaType): number | undefined {
  // 检查是否在场景5
  const scene5Data = data.梦境数据.场景5 as { 已进入?: boolean } | undefined;
  if (scene5Data?.已进入 === true) {
    return 5;
  }

  // 场景1-4：根据入口天数计算
  // 优先使用锁定的入口天数，若未设置则回退到当前天数
  const day = data.世界._梦境入口天数 ?? data.世界.当前天数;
  if (day >= 1) {
    return Math.min(day, 4);
  }

  return undefined;
}

/**
 * 获取当前场景允许开发的部位列表
 *
 * 设计规则：
 * - 场景5（婚礼改写）只能增加"精神"进度
 * - 场景1-4（记忆重构）只能增加对应的肉体部位进度，不能增加"精神"
 * - 非梦境状态不允许任何部位开发
 *
 * @param data 游戏数据
 * @returns 允许开发的部位列表
 */
export function getAllowedBodyParts(data: SchemaType): (keyof BodyPartProgress)[] {
  // 非梦境状态不允许任何部位开发
  if (data.世界.游戏阶段 !== '梦境') {
    return [];
  }

  // Bug #24 修复：使用动态计算的场景编号
  const currentScene = getCurrentDreamSceneNumber(data);

  // 场景5只能开发精神
  if (currentScene === 5) {
    return ['精神'];
  }

  // 场景1-4只能开发肉体部位（不含精神）
  if (currentScene !== undefined && currentScene >= 1 && currentScene <= 4) {
    return ['嘴巴', '胸部', '下体', '后穴'];
  }

  // 未知场景：记录日志但仍允许开发（容错）
  console.warn(`[梦境开发] 无法确定当前场景（_梦境入口天数=${data.世界._梦境入口天数}，当前天数=${data.世界.当前天数}），允许所有肉体部位`);
  return ['嘴巴', '胸部', '下体', '后穴'];
}

/**
 * 更新游戏数据中的部位进度
 *
 * 【数值平衡】每晚每个部位上限20%，确保4天能完成4个部位
 *
 * 【场景限制】
 * - 场景5（婚礼改写）只能增加"精神"进度
 * - 场景1-4（记忆重构）只能增加肉体部位进度，不能增加"精神"
 *
 * @param data 游戏数据
 * @param progressIncrement 进度增量
 */
export function updateBodyPartProgress(data: SchemaType, progressIncrement: BodyPartProgress): void {
  const currentDay = data.世界.当前天数;
  // Bug #24 修复：使用动态计算的场景编号
  const currentScene = getCurrentDreamSceneNumber(data);

  // 获取当前场景允许开发的部位
  const allowedParts = getAllowedBodyParts(data);

  if (allowedParts.length === 0) {
    console.info(`[梦境开发] 当前状态不允许部位开发（阶段=${data.世界.游戏阶段}，场景=${currentScene ?? '未知'}）`);
    return;
  }

  // 检查是否是新的一天，重置当晚进度记录
  if (data.梦境数据.当晚进度记录.天数 !== currentDay) {
    data.梦境数据.当晚进度记录 = {
      天数: currentDay,
      嘴巴: 0,
      胸部: 0,
      下体: 0,
      后穴: 0,
      精神: 0,
    };
    console.info(`[梦境开发] 新的一天（Day ${currentDay}），重置当晚进度记录`);
  }

  for (const part of allowedParts) {
    if (progressIncrement[part] > 0) {
      // 获取当晚已累积的进度
      const nightlyProgress = data.梦境数据.当晚进度记录[part];
      const remainingCap = NIGHTLY_PROGRESS_CAP - nightlyProgress;

      if (remainingCap <= 0) {
        console.info(`[梦境开发] ${part} 已达到当晚上限（${NIGHTLY_PROGRESS_CAP}%），本次增量被忽略`);
        continue;
      }

      // 实际可增加的进度（受当晚上限限制）
      const actualIncrement = Math.min(progressIncrement[part], remainingCap);

      const oldProgress = data.赵霞状态.部位进度[part];
      const newProgress = Math.min(100, oldProgress + actualIncrement);
      data.赵霞状态.部位进度[part] = newProgress;

      // 更新当晚进度记录
      data.梦境数据.当晚进度记录[part] += actualIncrement;

      const oldLevel = getDevelopmentLevel(oldProgress);
      const newLevel = getDevelopmentLevel(newProgress);

      console.info(
        `[梦境开发] 场景${currentScene} ${part}: +${actualIncrement}%` +
          (actualIncrement < progressIncrement[part] ? `（原始+${progressIncrement[part]}%，受当晚上限限制）` : '') +
          `，当晚累计: ${data.梦境数据.当晚进度记录[part]}/${NIGHTLY_PROGRESS_CAP}%`
      );

      if (oldLevel.level !== newLevel.level) {
        console.info(`[梦境开发] ${part} 等级提升: ${oldLevel.level} → ${newLevel.level} (${newLevel.name})`);
      }
    }
  }

  // 记录被场景限制而跳过的部位
  const allParts: (keyof BodyPartProgress)[] = ['嘴巴', '胸部', '下体', '后穴', '精神'];
  const blockedParts = allParts.filter(p => progressIncrement[p] > 0 && !allowedParts.includes(p));

  if (blockedParts.length > 0) {
    console.info(
      `[梦境开发] 场景限制：场景${currentScene}不允许开发 ${blockedParts.join('、')}` +
        `（允许部位: ${allowedParts.join('、')}）`
    );
  }
}

/**
 * 获取所有部位的开发状态摘要
 * @param data 游戏数据
 * @returns 部位状态摘要
 */
export function getBodyPartSummary(
  data: SchemaType
): Record<string, { progress: number; level: string; name: string }> {
  const summary: Record<string, { progress: number; level: string; name: string }> = {};
  const parts: (keyof BodyPartProgress)[] = ['嘴巴', '胸部', '下体', '后穴', '精神'];

  for (const part of parts) {
    const progress = data.赵霞状态.部位进度[part];
    const levelInfo = getDevelopmentLevel(progress);
    summary[part] = {
      progress,
      ...levelInfo,
    };
  }

  return summary;
}

// 5个记忆场景的正确答案配置（隐藏在脚本中，玩家不可见）
// 场景1-4：常规场景，需要 23:00-01:00 时间窗口 + 关键词触发
// 场景5：特殊场景（精神），需要安眠药关键词触发，无时间限制
//
// 【重要】正确答案支持多部位，玩家必须**精确匹配**（不多不少）才算正确重构
// 每个场景有独立的正确答案，由设计者决定
export const SCENE_CORRECT_ANSWERS: Record<number, string[]> = {
  1: ['嘴巴'], // 场景1：初恋的夏日（16岁）→ 初吻
  2: ['嘴巴', '胸部'], // 场景2：等待中的屈辱（17岁）→ 嘴巴+胸部（描述只提胸部，用于混淆玩家）
  3: ['下体'], // 场景3：生日之夜的逃离（23岁）→ 初夜（只有下体）
  4: ['嘴巴', '胸部', '下体', '后穴'], // 场景4：争吵后的放纵（28岁）→ 全部位开发
  5: ['精神'], // 场景5：花嫁的誓约 → 婚礼改写（特殊场景，12步剧情系统）
};

/**
 * 判定玩家选择的部位是否正确
 * 必须**精确匹配**正确答案（不多不少）
 *
 * @param sceneNumber 场景编号
 * @param selectedParts 玩家选择的部位
 * @returns 是否精确匹配正确答案
 */
export function checkCorrectSelection(sceneNumber: number, selectedParts: string[]): boolean {
  const correctAnswers = SCENE_CORRECT_ANSWERS[sceneNumber];
  if (!correctAnswers) {
    console.warn(`[梦境判定] 未找到场景${sceneNumber}的正确答案配置`);
    return false;
  }

  // Bug #39 修复：对玩家选择进行去重处理，防止重复部位导致判定错误
  const uniqueSelectedParts = [...new Set(selectedParts)];

  // 如果去重前后数量不同，记录日志
  if (uniqueSelectedParts.length !== selectedParts.length) {
    console.warn(
      `[梦境判定] 检测到重复部位，已自动去重: [${selectedParts.join(', ')}] → [${uniqueSelectedParts.join(', ')}]`
    );
  }

  // 排序后比较，确保顺序不影响判定
  const sortedSelected = [...uniqueSelectedParts].sort();
  const sortedCorrect = [...correctAnswers].sort();

  // 精确匹配：数量相同且内容完全一致
  const isCorrect =
    sortedSelected.length === sortedCorrect.length &&
    sortedSelected.every((part, index) => part === sortedCorrect[index]);

  console.info(
    `[梦境判定] 场景${sceneNumber}: 玩家选择=[${uniqueSelectedParts.join(', ')}], ` +
    `正确答案=[${correctAnswers.join(', ')}], 结果=${isCorrect ? '✅正确' : '❌错误'}`
  );
  return isCorrect;
}

/**
 * 处理场景结束判定
 * @param data 游戏数据
 * @param sceneNumber 场景编号
 */
export function processSceneCompletion(data: SchemaType, sceneNumber: number): void {
  const sceneKey = `场景${sceneNumber}` as keyof typeof data.梦境数据;
  const sceneData = data.梦境数据[sceneKey];

  if (!sceneData || typeof sceneData !== 'object') {
    console.warn(`[梦境判定] 场景${sceneNumber}数据不存在`);
    return;
  }

  // 获取玩家选择的部位
  const selectedParts = (sceneData as { 选择部位?: string[] }).选择部位 ?? [];

  // 判定是否正确
  const isCorrect = checkCorrectSelection(sceneNumber, selectedParts);

  // 更新场景数据
  (sceneData as { 是否正确?: boolean }).是否正确 = isCorrect;

  // 更新全局记录
  if (!data.梦境数据.已完成场景.includes(sceneNumber)) {
    data.梦境数据.已完成场景.push(sceneNumber);
  }

  if (isCorrect) {
    if (!data.梦境数据.正确重构场景.includes(sceneNumber)) {
      data.梦境数据.正确重构场景.push(sceneNumber);
    }
    console.info(`[梦境判定] ✅ 场景${sceneNumber}正确重构！`);
  } else {
    // 错误重构：增加混乱度（使用安全函数，完美记忆路线豁免）
    const penalty = 20;
    const actualPenalty = safeIncreaseMemoryConfusion(data, penalty);
    if (actualPenalty > 0) {
      console.warn(`[梦境判定] ❌ 场景${sceneNumber}错误重构，混乱度+${actualPenalty}`);
    } else {
      console.warn(`[梦境判定] ❌ 场景${sceneNumber}错误重构，但完美记忆路线豁免混乱度增加`);
    }
  }

  // 记录结局倾向
  console.info(
    `[梦境判定] 当前状态: 正确场景=${data.梦境数据.正确重构场景.length}/5, 混乱度=${data.梦境数据.记忆混乱度}`
  );
}

/**
 * 解析AI回复中的部位进度建议
 * AI会在回复末尾输出格式：<!--BODY_PROGRESS: 嘴巴+10, 胸部+5-->
 * @param aiResponse AI回复内容
 * @returns 解析出的进度建议（脚本决定是否采纳）
 */
export function parseAIBodyProgressSuggestion(aiResponse: string): BodyPartProgress {
  const result: BodyPartProgress = { 嘴巴: 0, 胸部: 0, 下体: 0, 后穴: 0, 精神: 0 };

  // 匹配 <!--BODY_PROGRESS: ...--> 格式（HTML注释，对玩家不可见）
  const progressMatch = aiResponse.match(/<!--\s*BODY_PROGRESS:\s*([^-]+?)-->/i);
  if (!progressMatch) {
    return result;
  }

  const progressStr = progressMatch[1];
  console.info(`[AI建议解析] 检测到AI进度建议: ${progressStr}`);

  // 解析每个部位的进度，支持格式：嘴巴+10, 胸部+5 或 嘴巴:10, 胸部:5
  const partPatterns = [
    { part: '嘴巴', patterns: ['嘴巴', '口腔', '嘴'] },
    { part: '胸部', patterns: ['胸部', '胸', '乳'] },
    { part: '下体', patterns: ['下体', '私处', '下面'] },
    { part: '后穴', patterns: ['后穴', '后庭', '臀'] },
    { part: '精神', patterns: ['精神', '心理', '意识'] },
  ];

  for (const { part, patterns } of partPatterns) {
    for (const pattern of patterns) {
      // 匹配 "部位+数字" 或 "部位:数字" 或 "部位 数字"
      const regex = new RegExp(`${pattern}\\s*[+:：]?\\s*(\\d+)`, 'i');
      const match = progressStr.match(regex);
      if (match) {
        const value = parseInt(match[1], 10);
        // 限制单次最大+5（与脚本检测一致），防止AI乱报数值
        const clampedValue = Math.min(AI_SUGGESTION_MAX, Math.max(0, value));
        result[part as keyof BodyPartProgress] = clampedValue;
        console.info(`[AI建议解析] ${part}: +${clampedValue}（原始建议: +${value}）`);
        break;
      }
    }
  }

  return result;
}

/**
 * 合并脚本检测和AI建议的进度
 * 脚本检测优先，AI建议作为补充
 *
 * 【数值平衡】每回合合并后上限8%，确保4天能完成4个部位
 *
 * @param scriptDetected 脚本关键词检测结果
 * @param aiSuggested AI建议结果
 * @returns 合并后的进度
 */
export function mergeBodyPartProgress(
  scriptDetected: BodyPartProgress,
  aiSuggested: BodyPartProgress
): BodyPartProgress {
  const result: BodyPartProgress = { 嘴巴: 0, 胸部: 0, 下体: 0, 后穴: 0, 精神: 0 };
  const parts: (keyof BodyPartProgress)[] = ['嘴巴', '胸部', '下体', '后穴', '精神'];

  for (const part of parts) {
    // 取两者中较大的值，但总和不超过 MERGED_PROGRESS_MAX (8%)
    const merged = Math.min(MERGED_PROGRESS_MAX, Math.max(scriptDetected[part], aiSuggested[part]));
    result[part] = merged;

    if (scriptDetected[part] > 0 && aiSuggested[part] > 0) {
      console.info(`[进度合并] ${part}: 脚本=${scriptDetected[part]}, AI建议=${aiSuggested[part]}, 采用=${merged}`);
    } else if (scriptDetected[part] > 0) {
      console.info(`[进度合并] ${part}: 脚本检测=${scriptDetected[part]}`);
    } else if (aiSuggested[part] > 0) {
      console.info(`[进度合并] ${part}: AI建议=${aiSuggested[part]}`);
    }
  }

  return result;
}

/**
 * 生成梦境记忆连续性Prompt
 * @param data 游戏数据
 * @param currentScene 当前场景编号
 * @returns AI Prompt注入文本
 */
export function generateMemoryContinuityPrompt(data: SchemaType, currentScene: number): string {
  if (currentScene <= 1) {
    return `【记忆连续性】
- 这是赵霞的第1个记忆场景
- 赵霞没有前置梦境的记忆
- 她对来访者感到陌生和困惑`;
  }

  const completedScenes = data.梦境数据.已完成场景.filter((s) => s < currentScene);
  if (completedScenes.length === 0) {
    return `【记忆连续性】
- 这是赵霞的第${currentScene}个记忆场景
- 玩家跳过了前面的场景，赵霞对来访者没有印象`;
  }

  // 生成前置记忆摘要
  const memorySummary = completedScenes
    .map((sceneNum) => {
      const isCorrect = data.梦境数据.正确重构场景.includes(sceneNum);
      return `  - 场景${sceneNum}: ${isCorrect ? '她记得与你的愉快互动' : '她有些困惑的记忆'}`;
    })
    .join('\n');

  return `【记忆连续性】
- 这是赵霞的第${currentScene}个记忆场景
- 赵霞保留前${completedScenes.length}个梦境中的所有记忆
- 她记得在梦中与玩家发生的一切
- 她会根据之前梦境的经历做出反应

已发生的梦境记忆：
${memorySummary}`;
}

// ============================================
// 场景记忆连续性系统
// 使用 generateRaw 在后台静默生成摘要，玩家完全看不到
// ============================================

/**
 * 梦境场景配置（用于摘要生成）
 */
const DREAM_SCENE_INFO: Record<number, { title: string; age: number; theme: string }> = {
  1: { title: '初恋的夏日', age: 16, theme: '初吻' },
  2: { title: '等待中的屈辱', age: 17, theme: '被骚扰与保护' },
  3: { title: '生日之夜的逃离', age: 23, theme: '背叛与初夜' },
  4: { title: '争吵后的放纵', age: 28, theme: '婚姻破裂与全身心交付' },
  5: { title: '花嫁的誓约', age: 0, theme: '婚礼改写（结婚当天记忆）' }, // age=0表示不是固定年龄
};

/**
 * 梦境对话收集结果
 */
export interface DreamSessionData {
  /** 玩家输入列表（保持原样） */
  playerActions: string;
  /** AI情感反应摘要（从AI输出中提取关键情感描写） */
  emotionalReactions: string;
}

/**
 * 从AI输出中提取赵霞的情感反应
 * 只提取情感相关的描写，忽略动作描写和对话
 *
 * @param aiOutput AI原始输出
 * @returns 情感反应摘要
 */
function extractEmotionalReaction(aiOutput: string): string {
  if (!aiOutput || aiOutput.length < 50) return '';

  // 移除系统标签（如 <HusbandThought> 等）
  let cleaned = aiOutput
    .replace(/<HusbandThought>[\s\S]*?<\/HusbandThought>/gi, '')
    .replace(/<status_update>[\s\S]*?<\/status_update>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  // 情感关键词列表
  const emotionKeywords = [
    '心跳', '脸红', '颤抖', '呼吸', '紧张', '害羞', '期待', '渴望',
    '眼眶', '泪水', '哽咽', '激动', '震惊', '愣住', '僵住', '发抖',
    '心中', '内心', '感觉', '感受', '意识到', '明白', '想起', '记得',
    '熟悉', '陌生', '困惑', '迷茫', '依恋', '依赖', '信任', '安心',
    '幸福', '满足', '温暖', '甜蜜', '羞耻', '罪恶感', '背德', '沦陷'
  ];

  // 找到包含情感关键词的句子
  const sentences = cleaned.split(/[。！？\n]+/).filter(s => s.trim().length > 5);
  const emotionalSentences: string[] = [];

  for (const sentence of sentences) {
    const hasEmotion = emotionKeywords.some(kw => sentence.includes(kw));
    if (hasEmotion && emotionalSentences.length < 3) {
      // 限制每个句子长度
      const trimmed = sentence.trim().slice(0, 60);
      emotionalSentences.push(trimmed + (sentence.length > 60 ? '...' : ''));
    }
  }

  return emotionalSentences.join('；');
}

/**
 * 获取本次梦境的对话历史
 * 从进入梦境的楼层开始，到退出梦境的楼层（如果指定）
 *
 * 【2026-01-16 优化】
 * - 玩家输入：保持原样（作为行为记录）
 * - AI输出：提取情感反应关键句（而非完整内容）
 *
 * 【Bug #25 修复】添加 dreamExitMessageId 参数，限制收集范围
 * 问题：之前收集到数组末尾，导致退出后的日常消息也被收集
 * 解决：如果提供了退出楼层ID，只收集到该楼层为止
 *
 * @param dreamEntryMessageId 梦境入口楼层ID
 * @param dreamExitMessageId 梦境退出楼层ID（可选，如果不提供则收集到数组末尾）
 */
export async function getDreamSessionMessages(
  dreamEntryMessageId: number | undefined,
  dreamExitMessageId?: number | undefined
): Promise<string> {
  if (!dreamEntryMessageId) {
    console.warn('[记忆摘要] 未找到梦境入口楼层ID');
    return '';
  }

  try {
    // 使用 SillyTavern.chat 直接访问消息数组
    const chatMessages = SillyTavern.chat;
    if (!chatMessages || !Array.isArray(chatMessages)) {
      console.warn('[记忆摘要] 无法访问聊天消息数组');
      return '';
    }

    // 找到梦境入口楼层的索引（SillyTavern 使用数组索引作为 message_id）
    const entryIndex = dreamEntryMessageId;
    if (entryIndex < 0 || entryIndex >= chatMessages.length) {
      console.warn(`[记忆摘要] 无效的梦境入口楼层ID: ${dreamEntryMessageId}`);
      return '';
    }

    // Bug #25 修复：确定收集范围的结束位置
    let endIndex: number;
    if (dreamExitMessageId !== undefined && dreamExitMessageId >= entryIndex) {
      // 如果提供了退出楼层ID，收集到退出楼层（包含退出楼层）
      endIndex = Math.min(dreamExitMessageId + 1, chatMessages.length);
      console.info(`[记忆摘要] Bug #25：限制收集范围到退出楼层 ${dreamExitMessageId}`);
    } else {
      // 兼容旧数据：如果没有退出楼层ID，收集到数组末尾
      endIndex = chatMessages.length;
      console.warn(`[记忆摘要] Bug #25：未提供退出楼层ID，收集到数组末尾（可能包含日常消息）`);
    }

    // 获取梦境期间的消息（从入口到退出）
    const dreamMessages = chatMessages.slice(entryIndex, endIndex);

    // 收集玩家输入（保持原样）
    const playerMessages = dreamMessages
      .filter(m => m.is_user && m.mes && typeof m.mes === 'string' && m.mes.trim())
      .map(m => `- ${m.mes.trim()}`)
      .join('\n');

    // 【2026-01-16 新增】收集AI情感反应
    const aiMessages = dreamMessages.filter(m => !m.is_user && m.mes && typeof m.mes === 'string');
    const emotionalReactions: string[] = [];

    for (const msg of aiMessages) {
      const reaction = extractEmotionalReaction(msg.mes);
      if (reaction) {
        emotionalReactions.push(reaction);
      }
    }

    const playerCount = dreamMessages.filter(m => m.is_user).length;
    const aiCount = aiMessages.length;
    console.info(`[记忆摘要] 收集到 ${playerCount} 条玩家输入，${aiCount} 条AI输出（楼层 ${entryIndex} ~ ${endIndex - 1}）`);

    // 组合摘要：玩家行为 + AI情感反应
    let result = playerMessages;
    if (emotionalReactions.length > 0) {
      // 去重并限制数量
      const uniqueReactions = [...new Set(emotionalReactions)].slice(0, 5);
      result += `\n\n【赵霞的情感变化】\n${uniqueReactions.map(r => `→ ${r}`).join('\n')}`;
    }

    return result;
  } catch (err) {
    console.error('[记忆摘要] 获取梦境对话失败:', err);
    return '';
  }
}

/**
 * 生成场景记忆摘要
 *
 * 【2026-01-16 优化】
 * 摘要内容包含两部分：
 * 1. 玩家行为记录（保持原样）
 * 2. 赵霞的情感变化（从AI输出中提取关键情感句）
 *
 * 摘要格式示例：
 * ```
 * 【初恋的夏日】
 * - 我轻轻握住她的手
 * - 在她耳边低语
 *
 * 【赵霞的情感变化】
 * → 心跳加速，脸颊泛红
 * → 感到这个人"很特别"
 * ```
 *
 * @param _data 游戏数据（保留参数兼容性）
 * @param sceneNum 场景编号
 * @param chatHistory 本次梦境的对话历史（包含玩家行为+AI情感反应）
 * @returns 摘要文本
 */
export async function generateMemorySummary(
  _data: SchemaType,
  sceneNum: number,
  chatHistory: string
): Promise<string> {
  const sceneInfo = DREAM_SCENE_INFO[sceneNum] || { title: `场景${sceneNum}`, age: 0, theme: '未知' };

  // 检查内容是否有效
  if (!chatHistory || chatHistory.trim().length < 20) {
    console.warn('[记忆摘要] 玩家行为记录过短，使用默认文本');
    return `【${sceneInfo.title}】\n（记忆内容不完整）`;
  }

  console.info(`[记忆摘要] 场景${sceneNum}（${sceneInfo.title}）摘要生成完成`);
  console.info(`[记忆摘要] 玩家行为记录长度: ${chatHistory.length} 字符`);

  // 直接返回玩家行为记录作为摘要
  // 添加场景标题作为前缀，便于识别
  const summary = `【${sceneInfo.title}】\n${chatHistory}`;

  console.info(`[记忆摘要] 摘要已生成，总长度: ${summary.length} 字符`);

  return summary;
}

/**
 * 增强版记忆连续性Prompt生成器
 * 使用详细的场景摘要而不是简单的"愉快互动/困惑记忆"
 *
 * 时间线说明：
 * - 场景1: 16岁（初恋夏日）
 * - 场景2: 17岁（等待中的屈辱）
 * - 场景3: 23岁（生日之夜）
 * - 场景5: 结婚当天（时间线上在场景4之前）
 * - 场景4: 28岁（婚后争吵）
 *
 * 如果场景5已完成，进入场景4时赵霞会记得结婚当天发生的事
 *
 * @param data 游戏数据
 * @param currentScene 当前场景编号
 * @returns AI Prompt注入文本
 */
export function generateEnhancedMemoryContinuityPrompt(data: SchemaType, currentScene: number): string {
  if (currentScene <= 1) {
    return `【记忆连续性 - 完全记忆模式】
- 这是赵霞的第1个记忆场景（16岁的记忆）
- 赵霞没有前置梦境的记忆
- 玩家是第一次出现在她记忆中的陌生人
- 她对玩家感到好奇，但也保持着少女的警惕`;
  }

  // 场景1-3不受场景5影响（都在结婚之前）
  // 场景4需要检查场景5是否已完成（结婚当天 -> 婚后28岁）
  const completedScenes = data.梦境数据.已完成场景.filter((s) => s < currentScene);

  // 特殊处理：场景4需要包含场景5的记忆（如果已完成）
  const hasScene5Memory = currentScene === 4 && data.梦境数据.已完成场景.includes(5);

  if (completedScenes.length === 0 && !hasScene5Memory) {
    return `【记忆连续性 - 完全记忆模式】
- 这是赵霞的第${currentScene}个记忆场景
- 玩家跳过了前面的场景，赵霞对玩家没有印象
- 对她来说，玩家是一个陌生人`;
  }

  // 收集之前场景的详细摘要
  const previousMemories: string[] = [];

  for (let i = 1; i < currentScene; i++) {
    const sceneKey = `场景${i}` as keyof typeof data.梦境数据;
    const sceneData = data.梦境数据[sceneKey] as {
      已进入?: boolean;
      剧情摘要?: string;
    } | undefined;

    const sceneInfo = DREAM_SCENE_INFO[i] || { title: `场景${i}`, age: 0 };
    const isCorrect = data.梦境数据.正确重构场景.includes(i);

    if (sceneData?.剧情摘要) {
      // 有详细摘要
      previousMemories.push(`【${sceneInfo.title}（${sceneInfo.age}岁）的记忆】
${sceneData.剧情摘要}
记忆状态：${isCorrect ? '清晰、美好' : '有些模糊、困惑'}`);
    } else if (sceneData?.已进入) {
      // 没有摘要但已进入（兼容旧数据）
      previousMemories.push(`【${sceneInfo.title}（${sceneInfo.age}岁）的记忆】
我记得有个人出现在我的记忆中...
${isCorrect ? '那是一段美好的回忆，虽然细节有些模糊，但感觉很温暖。' : '那段记忆让我有些困惑，像是被什么东西干扰了...'}
记忆状态：${isCorrect ? '模糊但温暖' : '困惑'}`);
    }
  }

  // 场景4特殊处理：插入场景5（结婚当天）的记忆
  // 时间线顺序：场景3(23岁) -> 场景5(结婚当天) -> 场景4(28岁婚后)
  if (hasScene5Memory) {
    const scene5Data = data.梦境数据.场景5 as {
      已进入?: boolean;
      上次剧情摘要?: string;
      完成度?: number;
    } | undefined;

    const scene5Info = DREAM_SCENE_INFO[5];
    const scene5Completion = scene5Data?.完成度 ?? 0;
    const isScene5Correct = data.梦境数据.正确重构场景.includes(5);

    if (scene5Data?.上次剧情摘要) {
      // 有详细摘要
      previousMemories.push(`【${scene5Info.title}（结婚当天）的记忆】
${scene5Data.上次剧情摘要}
婚礼改写完成度：${scene5Completion}%
记忆状态：${isScene5Correct ? '清晰、动摇' : '模糊、困惑'}
${scene5Completion >= 60 ? '⚠ 婚姻选择已被严重动摇，对苏文的感情产生了裂痕' : ''}`);
    } else if (scene5Data?.已进入) {
      // 没有摘要但已进入
      previousMemories.push(`【${scene5Info.title}（结婚当天）的记忆】
我记得结婚那天，有一个人出现在婚礼上...
${scene5Completion >= 60 ? '那个人让我对自己的选择产生了深深的怀疑，我是否真的应该嫁给苏文？' : '虽然最终还是完成了婚礼，但心中留下了一丝不安...'}
婚礼改写完成度：${scene5Completion}%
记忆状态：${isScene5Correct ? '清晰但动摇' : '模糊、困惑'}`);
    }
  }

  if (previousMemories.length === 0) {
    return `【记忆连续性 - 完全记忆模式】
- 这是赵霞的第${currentScene}个记忆场景
- 虽然之前有场景完成，但没有形成具体记忆
- 玩家对她来说有些许熟悉感`;
  }

  const currentSceneInfo = DREAM_SCENE_INFO[currentScene] || { title: `场景${currentScene}`, age: 0 };

  // 场景4的特殊指引（如果有场景5记忆）
  let scene4SpecialGuide = '';
  if (hasScene5Memory) {
    const scene5Completion = data.梦境数据.场景5?.完成度 ?? 0;
    scene4SpecialGuide = `
【结婚记忆的影响】
- 赵霞记得结婚当天那个人的出现和对她说的话
- ${scene5Completion >= 80 ? '她对这段婚姻充满了悔意，与苏文的争吵让她想起了那天的动摇' : scene5Completion >= 60 ? '她时常会想起那天的感受，与丈夫的争吵会触发这些记忆' : '虽然最终选择了苏文，但那天的记忆偶尔会浮现'}
- 当前的婚姻困境会让她联想到结婚当天的选择`;
  }

  return `【记忆连续性 - 完全记忆模式】

赵霞在当前记忆场景（${currentSceneInfo.title}，${currentSceneInfo.age}岁）中，完全记得之前梦境中发生的一切。
这些记忆跨越了时间，但在她的心中是连续的。

${previousMemories.join('\n\n')}
${scene4SpecialGuide}
---

【当前场景指引】
- 赵霞会自然地将过去的记忆与当前情境联系起来
- 她对玩家的态度受到之前互动的积累影响
- 身体反应会呼应之前的"开发"进度
- 她可能会主动提起之前的记忆片段

【⚠️ 记忆隔离 - 非常重要】
记忆连续性只继承**心理记忆**，不继承**物理状态**：
✅ 应该继承：对玩家的感情、认识程度、情感变化、互动经历
❌ 不应继承：服装、外貌、妆容、年龄外表、场景环境

当前场景是${currentSceneInfo.age}岁的赵霞：
- 她的外貌、穿着必须符合${currentSceneInfo.age}岁的设定
- 完全忽略对话历史中其他场景的服装描写
- 每个梦境场景的服装由AI根据当前场景年龄自由创作`;
}
