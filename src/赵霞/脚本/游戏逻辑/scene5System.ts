/**
 * 赵霞游戏 - 场景5线性剧情系统
 *
 * 场景5是通过安眠药触发的特殊关卡，采用12步线性剧情设计。
 * 核心主题：婚礼的改写 - 玩家在赵霞的结婚日记忆中出现，让她对婚姻产生动摇，最终选择离开苏文。
 *
 * 核心机制：
 * 1. 时间决定步骤数：07:00进入=13步可用（最多12步），19:00进入=1步
 * 2. 玩家意图分析：分析玩家输入的态度/行为/目标，生成定向AI引导
 * 3. 契合度进度：每步根据契合度加进度（高+10%，低+5%）
 * 4. 多次进入：第1次完成步骤1-10，第2次完成步骤11-12+自由互动
 * 5. 19:00触发退出描写，20:00游戏阶段切换为日常
 */

import type { Schema as SchemaType } from '../../schema';

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        场景5：花嫁的誓约 - 12步剧情设计                       ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║  背景：赵霞与苏文结婚当天，玩家通过安眠药进入赵霞的婚礼记忆                    ║
// ║  目标：让赵霞在婚礼中对玩家产生依恋，最终动摇婚姻、做出选择玩家的决定          ║
// ║  玩家身份：以"陌生人"身份出现，但赵霞隐约觉得很熟悉（取决于记忆连贯性）        ║
// ║  核心主题：婚礼的改写 - 从婚姻犹豫到选择逃离                                  ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║  阶段划分：                                                                    ║
// ║    1-2步 [初入]  - 化妆间相遇，建立存在感                                      ║
// ║    3-5步 [动摇]  - 婚礼仪式中，质疑婚姻选择                                    ║
// ║    6-8步 [深入]  - 婚宴间隙，情感突破                                          ║
// ║    9-11步[沦陷]  - 逃离婚礼，背叛选择                                          ║
// ║    12步  [完成]  - 摘下戒指，最终承诺                                          ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║  契合度系统：                                                                  ║
// ║    - 每步分析玩家意图（态度/行为/目标）与最佳匹配对比                          ║
// ║    - 高契合度 +10%，低契合度 +5%                                              ║
// ║    - 80%以上算完成，100%可触发特殊结局行为                                    ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// ============================================
// 12步剧情配置（核心数据结构）
// ============================================

export interface Scene5Step {
  step: number;
  phase: '初入' | '动摇' | '深入' | '沦陷' | '完成';
  title: string;
  description: string;
  bestMatch: {
    态度?: '温柔' | '激进' | '被动';
    行为?: '言语' | '肢体' | '心理';
    目标?: '安慰' | '质疑' | '引诱';
  };
  aiTask: string;
}

export const SCENE5_STEPS: Scene5Step[] = [
  {
    step: 1,
    phase: '初入',
    title: '婚礼前的化妆间',
    description: '赵霞穿着婚纱，独自坐在化妆镜前，玩家以"陌生人"身份出现',
    bestMatch: { 态度: '温柔', 行为: '心理' },
    aiTask: `1. 描写赵霞在化妆间的紧张与期待
2. 玩家以陌生人身份出现，她感到困惑但不排斥
3. 描写她穿着婚纱的美丽形象
4. 以她注意到玩家结束本轮`,
  },
  {
    step: 2,
    phase: '初入',
    title: '第一次对话',
    description: '赵霞注意到玩家，感到困惑但不抗拒，隐约觉得眼前人很熟悉',
    bestMatch: { 态度: '温柔', 行为: '言语' },
    aiTask: `1. 赵霞开口询问玩家身份
2. 描写她隐约觉得眼前人很熟悉的感觉
3. 玩家的话让她感到安心
4. 以她开始愿意交谈结束本轮`,
  },
  {
    step: 3,
    phase: '动摇',
    title: '婚礼仪式前',
    description: '宾客入场，苏文在另一边准备，玩家开始质疑她的选择',
    bestMatch: { 态度: '温柔', 目标: '质疑' },
    aiTask: `1. 描写婚礼现场的喜庆氛围
2. 玩家暗示"他配不上你"或质疑她的选择
3. 赵霞开始内心动摇，但嘴上否认
4. 以她沉默思考结束本轮`,
  },
  {
    step: 4,
    phase: '动摇',
    title: '仪式途中',
    description: '赵霞走向红毯，但目光不自觉看向玩家',
    bestMatch: { 态度: '温柔', 目标: '质疑' },
    aiTask: `1. 描写赵霞走向红毯的场景
2. 她的目光不自觉地寻找玩家
3. 内心独白：为什么会在意那个陌生人？
4. 以她走到苏文身边但心不在焉结束本轮`,
  },
  {
    step: 5,
    phase: '动摇',
    title: '交换戒指',
    description: '经典婚礼场景，但赵霞犹豫了',
    bestMatch: { 态度: '温柔', 目标: '质疑' },
    aiTask: `1. 描写交换戒指的仪式
2. 赵霞接过戒指却没有立刻戴上
3. 她的目光再次投向人群中的玩家
4. 以她勉强戴上戒指但内心动摇结束本轮`,
  },
  {
    step: 6,
    phase: '深入',
    title: '婚宴间隙',
    description: '赵霞借口离开宴会，来到走廊，玩家在那里等她',
    bestMatch: { 态度: '温柔', 行为: '肢体', 目标: '引诱' },
    aiTask: `1. 描写赵霞离开宴会厅的借口
2. 玩家在走廊等她，第一次肢体接触（握手/拥抱）
3. 她的身体有了反应（心跳加速/脸红）
4. 以她没有拒绝玩家的靠近结束本轮`,
  },
  {
    step: 7,
    phase: '深入',
    title: '秘密对话',
    description: '两人在僻静角落交谈，玩家植入"真正的归属"暗示',
    bestMatch: { 态度: '温柔', 目标: '引诱' },
    aiTask: `1. 描写两人在僻静处的对话
2. 玩家植入"你真正的归属"暗示
3. 赵霞开始动摇对婚姻的意义
4. 以她承认"有些话无法对苏文说"结束本轮`,
  },
  {
    step: 8,
    phase: '深入',
    title: '情感突破',
    description: '赵霞情绪崩溃，靠在玩家肩上，承认"结婚是个错误"',
    bestMatch: { 态度: '温柔', 目标: '引诱' },
    aiTask: `1. 描写赵霞的情绪逐渐崩溃
2. 她靠在玩家肩上寻求安慰
3. 她说出"也许结婚是个错误"
4. 以她紧紧抓住玩家的手结束本轮`,
  },
  {
    step: 9,
    phase: '沦陷',
    title: '逃离宴会',
    description: '赵霞想和玩家一起离开，主动拉着玩家的手',
    bestMatch: { 态度: '激进', 目标: '引诱' },
    aiTask: `1. 赵霞主动提出想离开
2. 她拉着玩家的手，想要逃离婚礼
3. 描写她下定决心的过程
4. 以两人一起离开宴会厅结束本轮`,
  },
  {
    step: 10,
    phase: '沦陷',
    title: '新郎寻找',
    description: '苏文发现赵霞不见了，在找她',
    bestMatch: { 态度: '激进', 目标: '引诱' },
    aiTask: `1. 描写苏文发现新娘不见的慌张
2. 赵霞躲在玩家身边，不想被苏文找到
3. 她对苏文的呼唤无动于衷
4. 以她选择继续和玩家在一起结束本轮`,
  },
  {
    step: 11,
    phase: '沦陷',
    title: '最终抉择',
    description: '苏文找到他们，赵霞必须在两人之间做出选择',
    bestMatch: { 态度: '激进', 目标: '引诱' },
    aiTask: `1. 苏文找到了他们，场面紧张
2. 赵霞必须做出选择
3. 她选择玩家，说出"我不爱他"或类似的话
4. 以苏文震惊离开结束本轮`,
  },
  {
    step: 12,
    phase: '完成',
    title: '戒指的归属',
    description: '赵霞摘下结婚戒指，做出最终的承诺',
    bestMatch: {}, // 任意匹配
    aiTask: `1. 赵霞摘下结婚戒指
2. 根据完成度决定后续行为：
   - 低完成度：将戒指还给苏文或丢弃
   - 高完成度：将戒指交给玩家
   - 完美完成度：做出极端承诺（如愿意将戒指戴在私密处）
3. 她向玩家表白，承诺属于玩家
4. 以场景5剧情完成结束本轮`,
  },
];

// ============================================
// 记忆连贯性系统（场景5核心机制）
// ============================================

/**
 * 记忆连贯性等级说明：
 *
 * 场景时间线：
 * - 场景1: 16岁（初恋的夏日）
 * - 场景2: 17岁（等待中的屈辱）
 * - 场景3: 23岁（生日之夜的逃离）
 * - 场景5: 结婚当天（花嫁的誓约）
 * - 场景4: 28岁（争吵后的放纵 - 婚后约5年）
 *
 * 场景4的时间在场景5之后，因此不计入连贯性。
 *
 * 连贯性等级：
 * - 0: 直接进入场景5，没有任何前置记忆
 *      → 赵霞对玩家完全陌生，像提线木偶一样做出选择
 * - 1: 只完成了场景1
 *      → 赵霞有初恋的熟悉感，但缺少等待和渴望
 * - 2: 完成了场景1+2
 *      → 赵霞有初恋+等待的记忆，但缺少逃离的渴望
 * - 3: 完成了场景1+2+3（完美记忆路线）
 *      → 赵霞拥有完整的重构记忆，对玩家有"命中注定"的感觉
 */

export interface MemoryCoherenceInfo {
  level: 0 | 1 | 2 | 3;
  hasScene1: boolean;  // 初恋记忆
  hasScene2: boolean;  // 等待记忆
  hasScene3: boolean;  // 逃离记忆
  hasScene4: boolean;  // 放纵记忆（不计入连贯性，但影响剧情）
  description: string;
  aiHint: string;      // 给AI的提示，描述赵霞应该有的反应
}

/**
 * 计算当前的记忆连贯性等级
 *
 * 规则：
 * - 必须按顺序完成：场景1 → 场景2 → 场景3
 * - 跳过任何一个都会中断连贯性
 * - 场景4不计入（时间线在场景5之后）
 *
 * @param data 游戏数据
 * @returns 记忆连贯性信息
 */
export function calculateMemoryCoherence(data: SchemaType): MemoryCoherenceInfo {
  const completedScenes = new Set(data.梦境数据.已完成场景);

  const hasScene1 = completedScenes.has(1);
  const hasScene2 = completedScenes.has(2);
  const hasScene3 = completedScenes.has(3);
  const hasScene4 = completedScenes.has(4);

  // 计算连贯性等级（必须按顺序）
  let level: 0 | 1 | 2 | 3;
  if (hasScene1 && hasScene2 && hasScene3) {
    level = 3;
  } else if (hasScene1 && hasScene2) {
    level = 2;
  } else if (hasScene1) {
    level = 1;
  } else {
    level = 0;
  }

  // 生成描述
  let description: string;
  let aiHint: string;

  switch (level) {
    case 0:
      description = '无前置记忆 - 赵霞对玩家完全陌生';
      aiHint = `【记忆连贯性：0级 - 无前置记忆】
赵霞对眼前的陌生人没有任何记忆。她的反应是机械的、困惑的。
- 她不会有熟悉感，只有纯粹的困惑
- 她的选择像是被牵引的木偶，缺乏情感基础
- 婚礼记忆的改写显得生硬、不自然
- 即使做出选择，也更像是被催眠而非真心`;
      break;

    case 1:
      description = '初恋记忆 - 赵霞隐约觉得眼熟';
      aiHint = `【记忆连贯性：1级 - 仅有初恋记忆】
赵霞有16岁夏天的记忆（场景1），她隐约觉得眼前的人很眼熟。
- 她会有一种似曾相识的感觉，但不确定从何而来
- 她的反应比完全陌生要自然，但缺少深层的渴望
- 缺少场景2：她没有"等待某人"的遗憾，对玩家的出现不会激动
- 缺少场景3：她没有"想要逃离"的压抑渴望`;
      break;

    case 2:
      description = '初恋+等待记忆 - 赵霞感到命运的安排';
      aiHint = `【记忆连贯性：2级 - 初恋+等待记忆】
赵霞有16岁初恋和17岁等待的记忆（场景1+2），她感到这是命运的安排。
- 她认出了那个"她曾经等待过的人"
- 她的心中有遗憾：当年他没有来，现在他出现了
- 她的选择有情感基础，不再像木偶
- 缺少场景3：她没有"想要逃离婚姻"的深层渴望，压抑感不够强烈`;
      break;

    case 3:
      description = '完美记忆路线 - 赵霞感到命中注定';
      aiHint = `【记忆连贯性：3级 - 完美记忆路线】
赵霞有完整的记忆重构（场景1+2+3），她感到这一切都是命中注定。
- 她有16岁的初恋、17岁的等待、20岁逃离失败的遗憾
- 她一直在等待的那个人，终于在结婚当天出现了
- 她的选择不是被催眠，而是发自内心的渴望
- 婚礼改写顺理成章，她的每一个反应都带着积压多年的感情
- 她会说出："终于等到你了" "如果当年是你..." 等触动人心的话`;
      break;
  }

  return {
    level,
    hasScene1,
    hasScene2,
    hasScene3,
    hasScene4,
    description,
    aiHint,
  };
}

/**
 * 获取缺失记忆的差异化提示词
 * 用于场景5中，根据缺失的记忆生成不同的AI引导
 *
 * @param coherence 记忆连贯性信息
 * @returns 缺失记忆的具体影响描述
 */
export function getMissingMemoryEffects(coherence: MemoryCoherenceInfo): string[] {
  const effects: string[] = [];

  if (!coherence.hasScene1) {
    effects.push(`【缺失场景1：初恋的夏日】
赵霞没有16岁那个夏天的记忆。她对玩家毫无熟悉感。
→ 表现：她的眼神是警惕的、陌生的，不会有"似曾相识"的表情
→ 对话：她不会问"我们见过吗？"，只会问"你是谁？"
→ 选择：她的选择完全是当下的冲动，没有过去的铺垫`);
  }

  if (!coherence.hasScene2) {
    effects.push(`【缺失场景2：等待中的屈辱】
赵霞没有17岁在路口等待的记忆。她心中没有"那个没来的人"。
→ 表现：她对苏文的怨恨较浅，因为她没有体验过"被放鸽子"的屈辱
→ 对话：她不会说"我等过一个人"或"他让我空等"
→ 选择：她离开苏文的理由更薄弱，可能只是一时冲动`);
  }

  if (!coherence.hasScene3) {
    effects.push(`【缺失场景3：生日之夜的逃离】
赵霞没有20岁生日想要逃跑的记忆。她心中没有对自由的深层渴望。
→ 表现：她对婚姻没有"被困住"的感觉，压抑感不够强烈
→ 对话：她不会说"我想过逃离"或"这不是我想要的人生"
→ 选择：她跟随玩家离开的动机更弱，可能需要更多说服`);
  }

  return effects;
}

/**
 * 锁定场景5完成时的记忆连贯性
 *
 * Bug #13 修复（2026-01-18）：
 * - 原设计：首次进入场景5时锁定 → 导致试探性进入直接锁定连贯性=0
 * - 新设计：场景5完成时（100%完成度）才锁定 → 允许玩家先试探再完成场景1-2-3
 *
 * 应该在场景5完成时（completionPercent >= 100%）调用
 *
 * @param data 游戏数据
 */
export function lockScene5EntryCoherence(data: SchemaType): void {
  const coherence = calculateMemoryCoherence(data);
  data.梦境数据.记忆连贯性 = coherence.level;
  data.梦境数据.场景5进入时连贯性 = coherence.level;
  console.info(`[记忆连贯性] 场景5完成时锁定连贯性：${coherence.level}级 - ${coherence.description}`);
}

/**
 * 获取场景5进入时锁定的连贯性
 * 如果尚未锁定，返回当前计算的连贯性
 *
 * @param data 游戏数据
 * @returns 锁定的连贯性等级
 */
export function getScene5LockedCoherence(data: SchemaType): 0 | 1 | 2 | 3 {
  const locked = data.梦境数据.场景5进入时连贯性;
  if (locked !== undefined) {
    return locked as 0 | 1 | 2 | 3;
  }
  // 尚未锁定，返回当前计算值
  return calculateMemoryCoherence(data).level;
}

/**
 * 检查是否应该增加记忆混乱度
 *
 * 设计理念（2026-01-16）：
 * - 记忆混乱度不再是惩罚机制，而是"结局指示器"
 * - 只有记忆连贯性 < 3 时，才会增加混乱度
 * - 完美记忆路线（连贯性=3）完全豁免混乱度增加
 * - 这给玩家一个明确的目标：按顺序完成场景1-2-3
 *
 * Bug #13 修复（2026-01-18）：
 * - 连贯性不再在进入时锁定，改为完成时锁定
 * - 因此在场景5中使用【实时计算】的连贯性
 * - 这样玩家可以"试探性进入"场景5，然后完成场景1-2-3后再正式完成
 *
 * @param data 游戏数据
 * @returns 是否应该增加混乱度
 */
export function shouldIncreaseMemoryConfusion(data: SchemaType): boolean {
  // Bug #13 修复：始终使用实时计算的连贯性
  // 不再区分"已进入场景5"和"尚未进入"，因为连贯性现在是动态的
  const coherence = calculateMemoryCoherence(data);
  if (coherence.level === 3) {
    console.info('[记忆混乱] 完美记忆路线：豁免混乱度增加');
    return false;
  }
  return true;
}

/**
 * 安全增加记忆混乱度
 * 自动检查是否应该增加，如果连贯性=3则跳过
 *
 * @param data 游戏数据
 * @param amount 增加量
 * @returns 实际增加的量（0表示被豁免）
 */
export function safeIncreaseMemoryConfusion(data: SchemaType, amount: number): number {
  if (!shouldIncreaseMemoryConfusion(data)) {
    console.info(`[记忆混乱] 豁免混乱度增加 ${amount} (完美记忆路线)`);
    return 0;
  }

  const oldValue = data.梦境数据.记忆混乱度;
  data.梦境数据.记忆混乱度 = Math.min(100, oldValue + amount);
  const actualIncrease = data.梦境数据.记忆混乱度 - oldValue;
  console.info(`[记忆混乱] 混乱度 +${actualIncrease} (${oldValue} → ${data.梦境数据.记忆混乱度})`);
  return actualIncrease;
}

// ============================================
// 玩家意图分析系统
// ============================================

export interface IntentAnalysis {
  态度: '温柔' | '激进' | '被动' | '未知';
  行为: '言语' | '肢体' | '心理' | '未知';
  目标: '安慰' | '质疑' | '引诱' | '未知';
  原始输入: string;
  匹配关键词: string[];
}

const INTENT_KEYWORDS = {
  态度: {
    温柔: ['轻轻', '温柔', '柔声', '轻声', '慢慢', '小心', '缓缓', '柔和', '轻抚', '轻触'],
    激进: ['直接', '强行', '用力', '突然', '立刻', '马上', '紧紧', '大力', '猛然', '强硬'],
    被动: ['看着', '注视', '沉默', '不说话', '静静', '等待', '观察', '凝视', '默默'],
  },
  行为: {
    言语: ['说', '告诉', '问', '回答', '低语', '喊', '叫', '道', '讲', '聊', '谈'],
    肢体: ['握', '抱', '摸', '碰', '拉', '推', '吻', '亲', '抚', '搂', '牵', '扶', '触'],
    心理: ['想', '感觉', '觉得', '认为', '希望', '期待', '思考', '考虑'],
  },
  目标: {
    安慰: ['没事', '别怕', '陪你', '保护', '支持', '放心', '相信', '不要怕', '在这里'],
    质疑: ['真的', '确定', '为什么', '值得', '后悔', '是否', '难道', '怎么会', '应该'],
    引诱: ['跟我', '离开', '一起', '属于', '需要你', '只有我', '选择我', '想要', '渴望'],
  },
};

/**
 * 分析玩家输入的意图
 */
export function analyzePlayerIntent(userInput: string): IntentAnalysis {
  const result: IntentAnalysis = {
    态度: '未知',
    行为: '未知',
    目标: '未知',
    原始输入: userInput,
    匹配关键词: [],
  };

  // 分析态度
  for (const [attitude, keywords] of Object.entries(INTENT_KEYWORDS.态度)) {
    for (const keyword of keywords) {
      if (userInput.includes(keyword)) {
        result.态度 = attitude as IntentAnalysis['态度'];
        result.匹配关键词.push(keyword);
        break;
      }
    }
    if (result.态度 !== '未知') break;
  }

  // 分析行为
  for (const [behavior, keywords] of Object.entries(INTENT_KEYWORDS.行为)) {
    for (const keyword of keywords) {
      if (userInput.includes(keyword)) {
        result.行为 = behavior as IntentAnalysis['行为'];
        result.匹配关键词.push(keyword);
        break;
      }
    }
    if (result.行为 !== '未知') break;
  }

  // 分析目标
  for (const [goal, keywords] of Object.entries(INTENT_KEYWORDS.目标)) {
    for (const keyword of keywords) {
      if (userInput.includes(keyword)) {
        result.目标 = goal as IntentAnalysis['目标'];
        result.匹配关键词.push(keyword);
        break;
      }
    }
    if (result.目标 !== '未知') break;
  }

  return result;
}

/**
 * 计算玩家意图与步骤最佳匹配的契合度
 * @returns 'high' | 'low'
 */
export function calculateMatchLevel(
  intent: IntentAnalysis,
  step: Scene5Step
): 'high' | 'low' {
  const best = step.bestMatch;
  let matchCount = 0;
  let totalRequired = 0;

  if (best.态度) {
    totalRequired++;
    if (intent.态度 === best.态度) matchCount++;
  }
  if (best.行为) {
    totalRequired++;
    if (intent.行为 === best.行为) matchCount++;
  }
  if (best.目标) {
    totalRequired++;
    if (intent.目标 === best.目标) matchCount++;
  }

  // 步骤12没有最佳匹配要求，默认高契合
  if (totalRequired === 0) return 'high';

  // 匹配一半以上算高契合
  return matchCount >= totalRequired / 2 ? 'high' : 'low';
}

// ============================================
// 完成度计算
// ============================================

export interface Scene5CompletionInfo {
  completionPercent: number;
  currentStep: number;
  maxAvailableSteps: number;
  isStepsComplete: boolean;
  isComplete: boolean; // 80%以上才算完成
  canTriggerSpecialEnding: boolean;
  entryCount: number;
  stepProgressRecord: number[];
  description: string;
}

/**
 * 计算场景5的完成度（基于步骤）
 */
export function calculateScene5Completion(data: SchemaType): Scene5CompletionInfo {
  const scene5Data = data.梦境数据.场景5 as {
    进入次数?: number;
    当前步骤?: number;
    已完成步骤?: boolean;
    完成度?: number;
    步骤进度记录?: number[];
  } | undefined;

  const entryCount = scene5Data?.进入次数 ?? 0;
  const currentStep = scene5Data?.当前步骤 ?? 0;
  const isStepsComplete = scene5Data?.已完成步骤 ?? false;
  const completionPercent = scene5Data?.完成度 ?? 0;
  const stepProgressRecord = scene5Data?.步骤进度记录 ?? [];

  // 计算当前可用的最大步骤数（基于进入时间）
  const currentHour = data.世界.当前小时;
  const maxAvailableSteps = Math.max(0, Math.min(12, 20 - currentHour));

  // 100%完成度才能触发特殊结局
  const canTriggerSpecialEnding = completionPercent >= 100;

  // 80%以上才算完成（因为剧情有连续性，需要完成大部分步骤）
  const isComplete = completionPercent >= 80;

  let description = '';
  if (completionPercent >= 100) {
    description = '场景5已完美完成！赵霞的精神已被完全重塑，结局中会有特殊行为。';
  } else if (completionPercent >= 80) {
    description = `场景5完成度${completionPercent}%，已达成完成标准，赵霞的精神已被深度改造。`;
  } else if (completionPercent >= 60) {
    description = `场景5完成度${completionPercent}%，接近完成但还差一点。`;
  } else if (currentStep > 0) {
    description = `场景5进行中，当前步骤${currentStep}/12，完成度${completionPercent}%，需要80%以上才算完成。`;
  } else {
    description = '场景5尚未开始。';
  }

  return {
    completionPercent,
    currentStep,
    maxAvailableSteps,
    isStepsComplete,
    isComplete, // 80%以上才算完成
    canTriggerSpecialEnding,
    entryCount,
    stepProgressRecord,
    description,
  };
}

/**
 * 计算当前可用的剩余步骤数
 *
 * Bug #13 修复后：19:00 时触发退出（出梦描写），所以最后一步是 18:00
 * - 08:00 进入 → 09:00 步骤1 → ... → 18:00 步骤10 → 19:00 出梦描写
 * - 实际可用步骤：10步（而非12步）
 */
export function getRemainingSteps(data: SchemaType): number {
  const scene5Data = data.梦境数据.场景5 as { 当前步骤?: number } | undefined;
  const currentStep = scene5Data?.当前步骤 ?? 0;
  const currentHour = data.世界.当前小时;

  // Bug #13 修复：19:00 触发退出，所以最多到 18:00 还能走1步
  // 原来是 20 - currentHour，现在改为 19 - currentHour
  const maxStepsFromTime = Math.max(0, 19 - currentHour);

  // 剩余步骤 = min(剧情剩余步骤, 时间允许步骤)
  const storyRemaining = 12 - currentStep;
  return Math.min(storyRemaining, maxStepsFromTime);
}

// ============================================
// 部位开发对场景5的影响
// ============================================

export interface BodyInfluenceInfo {
  hasInfluence: boolean;
  influences: string[];
  avgProgress: number;
}

/**
 * 生成部位开发对场景5的影响描述
 */
export function getBodyInfluenceForScene5(data: SchemaType): BodyInfluenceInfo {
  const progress = data.赵霞状态.部位进度;
  const influences: string[] = [];

  if (progress.嘴巴 >= 60) {
    influences.push('赵霞的嘴唇微微张开，似乎在期待什么');
  }
  if (progress.胸部 >= 60) {
    influences.push('她的胸口起伏加快，婚纱下隐约可见曲线');
  }
  if (progress.下体 >= 60) {
    influences.push('她站立不安，双腿不自觉夹紧');
  }
  if (progress.后穴 >= 60) {
    influences.push('她的羞耻心明显减弱，对禁忌话题不再回避');
  }

  const bodyParts = ['嘴巴', '胸部', '下体', '后穴'] as const;
  const sum = bodyParts.reduce((acc, part) => acc + (progress[part] ?? 0), 0);
  const avgProgress = Math.floor(sum / bodyParts.length);

  return {
    hasInfluence: influences.length > 0,
    influences,
    avgProgress,
  };
}

// ============================================
// AI引导生成
// ============================================

/**
 * 生成场景5当前步骤的AI引导
 */
export function generateScene5StepPrompt(
  data: SchemaType,
  intent: IntentAnalysis
): string {
  const completion = calculateScene5Completion(data);
  const currentStep = completion.currentStep;
  const remainingSteps = getRemainingSteps(data);
  const bodyInfluence = getBodyInfluenceForScene5(data);

  // 如果已完成12步，返回自由发挥提示
  if (completion.isStepsComplete || currentStep >= 12) {
    return generateFreePlayPrompt(data, bodyInfluence);
  }

  // 获取下一步（当前要执行的步骤）
  const nextStep = currentStep + 1;
  const stepConfig = SCENE5_STEPS[nextStep - 1];

  if (!stepConfig) {
    return generateFreePlayPrompt(data, bodyInfluence);
  }

  // 计算契合度
  const matchLevel = calculateMatchLevel(intent, stepConfig);
  const progressGain = matchLevel === 'high' ? 10 : 5;

  // 生成部位影响描述
  let bodyInfluenceText = '';
  if (bodyInfluence.hasInfluence) {
    bodyInfluenceText = `\n【部位开发影响】（融入描写，不要直接提及）\n${bodyInfluence.influences.map(i => `- ${i}`).join('\n')}`;
  }

  // 生成意图分析结果
  const intentSummary = `玩家态度：${intent.态度}，行为：${intent.行为}，目标：${intent.目标}`;
  const matchNote = matchLevel === 'high'
    ? '✅ 高契合度 - 玩家行为与剧情需求匹配'
    : '⚠️ 低契合度 - 按玩家意图推进，但赵霞反应稍弱';

  return `[场景5 - 步骤${nextStep}/12：${stepConfig.title}]

【当前阶段】${stepConfig.phase}
【剩余步骤】${remainingSteps}步（20:00强制退出）
【当前完成度】${completion.completionPercent}%
【本步进度】+${progressGain}%（${matchLevel === 'high' ? '高契合' : '低契合'}）

【场景描述】
${stepConfig.description}

【玩家意图分析】
${intentSummary}
${matchNote}
匹配关键词：${intent.匹配关键词.length > 0 ? intent.匹配关键词.join('、') : '无明确关键词'}
${bodyInfluenceText}

【AI任务】
${stepConfig.aiTask}

【演绎要求】
- 根据玩家的态度（${intent.态度}）调整赵霞的反应强度
- 玩家行为是${intent.行为}类型，重点描写相关互动
- 玩家目标是${intent.目标}，让赵霞对此有相应回应
- 融入部位开发影响（如有），但不要直接提及"开发度"
- 保持剧情连贯性，为下一步做铺垫

【禁止】
- ⚠️ 梦境中赵霞不知道玩家是她儿子，不要让她用任何亲属称呼（儿子、孩子等）
- 不要让赵霞完全意识到这是被操控的记忆
- 不要跳跃剧情，按步骤推进
- 不要提及"步骤"、"完成度"、"契合度"等元游戏术语`;
}

/**
 * 生成自由发挥阶段的提示（已完成12步或第2次进入）
 *
 * 【2026-01-17 更新】
 * - 根据剩余时间动态决定是否提示"梦要醒了"
 * - 剩余时间充足时，正常自由互动，不提醒退出
 * - 临近19:00时（最后1小时内）才暗示即将退出
 *
 * 【时间说明】
 * - 19:00 触发退出描写（AI生成出梦内容）
 * - 20:00 游戏阶段切换为日常
 * - 所以玩家实际可用时间到19:00为止
 */
function generateFreePlayPrompt(
  data: SchemaType,
  bodyInfluence: BodyInfluenceInfo
): string {
  const completion = calculateScene5Completion(data);
  const currentHour = data.世界.当前小时;
  // 19:00触发退出描写，所以剩余时间基于19:00计算
  const remainingHours = 19 - currentHour;

  let bodyInfluenceText = '';
  if (bodyInfluence.hasInfluence) {
    bodyInfluenceText = `\n【部位开发影响】\n${bodyInfluence.influences.map(i => `- ${i}`).join('\n')}`;
  }

  // 根据剩余时间生成不同的时间提示
  let timeGuidance = '';
  if (remainingHours <= 1) {
    // 最后1小时内（18:00-19:00）：暗示即将结束，但不要频繁提醒
    timeGuidance = `\n【时间提示】
- 婚礼记忆即将消散（19:00触发退出），可以在描写中自然暗示
- 不要每句话都提"快醒了"，只在合适的时机自然带入
- 例如：场景边缘开始模糊、光线变得柔和、有种不舍的预感...`;
  } else if (remainingHours <= 2) {
    // 2小时内（17:00-18:00）：轻微暗示，不强调
    timeGuidance = `\n【时间提示】
- 剩余时间充足（约${remainingHours}小时），不需要提及退出
- 专注于当前的温馨互动`;
  } else {
    // 充足时间（<17:00）：完全不提醒
    timeGuidance = `\n【时间提示】
- 时间充足，自由发挥，完全不要提及"梦要醒了"或任何退出暗示
- 享受婚礼后的温馨时光`;
  }

  return `[场景5 - 自由发挥阶段]

【完成度】${completion.completionPercent}%
${completion.canTriggerSpecialEnding ? '🎯 可触发特殊结局行为' : ''}
【剩余时间】约${remainingHours > 0 ? remainingHours : '<1'}小时（19:00触发退出）

12步剧情已完成，婚礼仪式结束，赵霞已经摘下结婚戒指。
现在是自由互动时间——两人独处，赵霞穿着婚纱，可以聊天、回忆、亲密互动。
${bodyInfluenceText}
${timeGuidance}

【AI任务】
1. 延续场景5的剧情氛围（结婚日记忆 + 赵霞已做出选择）
2. 赵霞已经对玩家产生强烈依赖，可以进行更深入的情感互动
3. 根据玩家输入自由发挥剧情
4. 融入部位开发影响，让赵霞的反应更加主动
5. 可以回忆前置场景的内容（如果有的话）

【允许的互动】
- 对话、聊天、回忆过去
- 情感交流、告白、表达爱意
- 轻度亲密：拥抱、亲吻、牵手、依偎

【禁止】
- ⚠️ 性行为（涉及性器官的行为）→ 会触发混乱结局
- ⚠️ 梦境中赵霞不知道玩家是她儿子，不要让她用任何亲属称呼
- 不要让赵霞突然恢复理智
- 不要提及"完成度"、"步骤"等元游戏术语`;
}

// 场景信息配置（用于生成摘要标题）
const SCENE_INFO: Record<number, { title: string; age: number }> = {
  1: { title: '初恋的夏日', age: 16 },
  2: { title: '等待中的屈辱', age: 17 },
  3: { title: '生日之夜的逃离', age: 23 },
  4: { title: '争吵后的放纵', age: 28 },
  5: { title: '花嫁的誓约', age: 25 }, // 结婚当天
};

/**
 * 生成场景5的前置场景摘要
 * 读取场景1-3的剧情摘要，注入到场景5的AI提示词中
 *
 * @param data 游戏数据
 * @returns 前置场景摘要文本
 */
function generatePreviousSceneSummaries(data: SchemaType): string {
  const summaries: string[] = [];

  // 只读取场景1-3（场景4时间线在场景5之后，不计入）
  for (let i = 1; i <= 3; i++) {
    const sceneKey = `场景${i}` as keyof typeof data.梦境数据;
    const sceneData = data.梦境数据[sceneKey] as {
      已进入?: boolean;
      剧情摘要?: string;
    } | undefined;

    const sceneInfo = SCENE_INFO[i];
    const isCorrect = data.梦境数据.正确重构场景.includes(i);

    if (sceneData?.剧情摘要) {
      // 有详细摘要
      summaries.push(`【${sceneInfo.title}（${sceneInfo.age}岁）】
${sceneData.剧情摘要}
→ 记忆状态：${isCorrect ? '清晰、美好' : '有些模糊、困惑'}`);
    } else if (sceneData?.已进入) {
      // 没有摘要但已进入（兼容旧数据）
      summaries.push(`【${sceneInfo.title}（${sceneInfo.age}岁）】
（记忆片段）赵霞记得有个人出现在那段记忆中...
${isCorrect ? '那是一段美好的回忆，虽然细节有些模糊，但感觉很温暖。' : '那段记忆让她有些困惑，像是被什么东西干扰了...'}
→ 记忆状态：${isCorrect ? '模糊但温暖' : '困惑'}`);
    }
  }

  if (summaries.length === 0) {
    return '';
  }

  return `
【前置场景剧情摘要】
以下是赵霞在之前梦境中经历的事情，这些记忆会影响她在场景5中的反应：

${summaries.join('\n\n')}

---
AI应该让赵霞的反应自然地呼应这些前置记忆。她可能会：
- 提起过去的场景片段
- 对玩家有似曾相识的感觉
- 根据记忆连贯性程度表现出不同的情感强度`;
}

/**
 * 生成场景5入口的替换内容
 * 2026-01-16 更新：添加记忆连贯性系统支持 + 前置场景摘要注入
 */
export function generateScene5EntryReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  const completion = calculateScene5Completion(data);
  const bodyInfluence = getBodyInfluenceForScene5(data);
  const currentHour = data.世界.当前小时;
  const maxSteps = Math.max(0, Math.min(12, 20 - currentHour));

  const isFirstEntry = completion.entryCount === 0;
  const isStepsComplete = completion.isStepsComplete;

  // 获取记忆连贯性信息
  const coherence = calculateMemoryCoherence(data);
  const missingEffects = getMissingMemoryEffects(coherence);

  // 生成前置场景摘要（2026-01-16 新增）
  const previousSummaries = generatePreviousSceneSummaries(data);

  // 生成部位影响描述
  let bodyInfluenceText = '';
  if (bodyInfluence.hasInfluence) {
    bodyInfluenceText = `\n【部位开发影响】（融入描写）\n${bodyInfluence.influences.map(i => `- ${i}`).join('\n')}`;
  }

  // 生成记忆连贯性描述
  let coherenceText = `\n【记忆连贯性：${coherence.level}级】\n${coherence.description}\n\n${coherence.aiHint}`;
  if (missingEffects.length > 0) {
    coherenceText += `\n\n【缺失记忆的影响】\n${missingEffects.join('\n\n')}`;
  }

  const userMessage = `[系统指令 - 场景5：结婚日记忆]

玩家使用安眠药，进入赵霞的结婚日记忆场景。

【场景5核心信息】
- 时间设定：赵霞25岁，与苏文结婚当天
- 场景环境：婚礼现场/酒店
- 场景主题：婚礼的改写 - 让赵霞对婚姻产生动摇并选择玩家

【剧情系统】
- 进入次数：第${completion.entryCount + 1}次
- 当前步骤：${completion.currentStep}/12
- 可用步骤：${maxSteps}步
- 当前完成度：${completion.completionPercent}%
- 20:00强制退出
${coherenceText}
${previousSummaries}

${isFirstEntry ? `【首次进入 - 12步线性剧情】
本次将按照12步线性剧情推进：
1-2步：初入阶段 - 建立存在感
3-5步：动摇阶段 - 质疑婚姻
6-8步：深入阶段 - 情感突破
9-11步：沦陷阶段 - 背叛选择
12步：完成阶段 - 戒指归属` :
isStepsComplete ? `【后续进入 - 自由发挥】
12步剧情已完成，本次进入AI可自由发挥，延续剧情氛围。` :
`【继续进入 - 从步骤${completion.currentStep + 1}继续】
上次进行到步骤${completion.currentStep}，本次从步骤${completion.currentStep + 1}继续。`}
${bodyInfluenceText}

【AI任务】
1. 描写药物生效、意识进入记忆的过渡
2. 展现结婚日当天的场景
3. ${isFirstEntry ? '从步骤1开始：赵霞在化妆间' : isStepsComplete ? '自由发挥，延续剧情' : `从步骤${completion.currentStep + 1}继续`}
4. 等待玩家的下一步行动
5. 【重要】根据记忆连贯性等级调整赵霞的反应！

【重要】这是梦境场景，即使 <status_current_variable> 中显示"游戏阶段: 序章"或"游戏阶段: 日常"，实际状态已切换为梦境。

【禁止】
- 【禁止】输出 <HusbandThought> 标签及内容（梦境中苏文是婚礼上的另一个角色，不是现实中的丈夫）
- 【禁止】更新 /现实数据/* 的任何字段
- 【禁止】提及现实世界的丈夫、苦主视角等概念
- ⚠️ 梦境中赵霞不知道玩家是她儿子，不要让她用任何亲属称呼（儿子、孩子等）
- 不要让赵霞意识到这是记忆
- 不要让赵霞拥有超出25岁的知识
- 不要跳跃剧情步骤
- 不要提及"步骤"、"完成度"、"连贯性"等元游戏术语
- 不要继承其他梦境场景的服装/外貌描写，必须根据25岁婚礼设定描写`;

  // 根据记忆连贯性生成不同的开场
  const prefill = isFirstEntry
    ? generateCoherenceBasedPrefill(coherence)
    : `药物再次发挥作用，熟悉的感觉涌来......

这一次，你更快地进入了那段结婚日的记忆。场景比上次更加清晰——

赵霞的身影出现在眼前，`;

  return { userMessage, prefill };
}

/**
 * 根据记忆连贯性生成不同的首次进入开场
 */
function generateCoherenceBasedPrefill(coherence: MemoryCoherenceInfo): string {
  switch (coherence.level) {
    case 0:
      // 无前置记忆 - 赵霞完全陌生，像提线木偶
      return `药物的效果开始发挥，赵霞的意识逐渐变得模糊......

当视野再次清晰时，你发现自己站在一个装饰精美的化妆间里。镜子前，一个穿着洁白婚纱的身影正在整理头饰——

赵霞。

她今天格外美丽。但当她从镜子里看到你的身影时，脸上浮现的是纯粹的困惑。

"你是谁？"她警惕地转过身，"这里是新娘休息室，外人不应该进来……"

她的眼神没有丝毫熟悉感，`;

    case 1:
      // 仅有初恋记忆 - 隐约眼熟
      return `药物的效果开始发挥，赵霞的意识逐渐变得模糊......

当视野再次清晰时，你发现自己站在一个装饰精美的化妆间里。镜子前，一个穿着洁白婚纱的身影正在整理头饰——

赵霞。

她今天格外美丽。当她从镜子里看到你的身影时，手指微微一顿。

"你……"她皱起眉头，"我们……见过吗？"

一丝困惑掠过她的眼底，仿佛在记忆的深处搜寻着什么。那个夏天的影子若隐若现，`;

    case 2:
      // 初恋+等待记忆 - 感到命运的安排
      return `药物的效果开始发挥，赵霞的意识逐渐变得模糊......

当视野再次清晰时，你发现自己站在一个装饰精美的化妆间里。镜子前，一个穿着洁白婚纱的身影正在整理头饰——

赵霞。

她今天格外美丽。当她从镜子里看到你的身影时，整个人僵住了。

"是你……"她的声音微微颤抖，"那个夏天……还有那个路口……"

她转过身来，眼中闪烁着复杂的光芒。那个她曾经等待过的人，在她即将嫁给别人的这一天，竟然出现了。

"为什么……为什么要在今天……"`;

    case 3:
      // 完美记忆路线 - 命中注定的重逢
      return `药物的效果开始发挥，赵霞的意识逐渐变得模糊......

当视野再次清晰时，你发现自己站在一个装饰精美的化妆间里。镜子前，一个穿着洁白婚纱的身影正在整理头饰——

赵霞。

她今天格外美丽。当她从镜子里看到你的身影时，手中的头饰"啪"地掉落在地。

"是你。"她的声音带着颤抖，却没有一丝困惑。

她缓缓转过身，眼眶微微泛红。那是积压了多年的情感，在这一刻决堤。

"我等了你很久。"她的声音哽咽，"十六岁那个夏天……十七岁那个路口……二十岁那个想要逃跑的夜晚……"

她向你走来，婚纱拖曳在地上，如同一条通往命运的白色长路。

"你终于来了……"`;
  }
}

/**
 * 生成场景5强制退出的替换内容
 */
export function generateScene5ForceExitReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} {
  const completion = calculateScene5Completion(data);

  const userMessage = `[系统指令 - 场景5强制结束]

时间已到20:00，安眠药效果消退，场景5自动结束。

【本次完成情况】
- 进入次数：${completion.entryCount}次
- 完成步骤：${completion.currentStep}/12
- 完成度：${completion.completionPercent}%
- 状态：${completion.isStepsComplete ? '✅ 剧情已完成' : '⏳ 剧情未完成'}
${completion.canTriggerSpecialEnding ? '- 🎯 可触发特殊结局行为' : ''}

【AI任务】
1. 描写安眠药效果消退、意识回归现实
2. 描写赵霞醒来后的状态
3. 根据完成度描写她的感受：
   - 未完成（<80%）：做了个奇怪的梦，记不清内容，但心里隐隐有些异样
   - 完成（80-99%）：对婚姻产生明显动摇，苏文的形象开始褪色
   - 完美完成（100%）：精神已被重塑，对苏文的感情已被替换，内心只有玩家

【禁止】
- 不要让赵霞完全记住记忆中发生的事
- 不要提及"完成度"等元游戏术语`;

  const prefill = completion.completionPercent >= 80
    ? `安眠药的效果逐渐消退，但那段关于结婚日的"新记忆"已经深深植入......

赵霞缓缓睁开眼睛，眼神中带着一丝恍惚。她下意识地看向左手的结婚戒指，`
    : `安眠药的效果逐渐消退，那段关于结婚日的记忆开始变得模糊......

赵霞缓缓睁开眼睛，`;

  return { userMessage, prefill };
}

/**
 * 生成场景5中途步骤推进的替换内容
 */
export function generateScene5StepReplacement(
  data: SchemaType,
  userInput: string
): {
  userMessage: string;
  prefill: string;
} {
  const intent = analyzePlayerIntent(userInput);
  const stepPrompt = generateScene5StepPrompt(data, intent);

  const userMessage = `[玩家行动]
${userInput}

---

${stepPrompt}`;

  // 不使用prefill，让AI根据步骤提示自由生成
  const prefill = '';

  return { userMessage, prefill };
}

/**
 * 生成场景5自由发挥阶段的替换内容
 * 在12步完成后使用
 */
export function generateScene5FreePlayReplacement(
  data: SchemaType,
  userInput: string
): {
  userMessage: string;
  prefill: string;
} {
  const bodyInfluence = getBodyInfluenceForScene5(data);
  const freePlayPrompt = generateFreePlayPrompt(data, bodyInfluence);

  const userMessage = `[玩家行动]
${userInput}

---

${freePlayPrompt}`;

  // 不使用prefill，让AI自由发挥
  const prefill = '';

  return { userMessage, prefill };
}
