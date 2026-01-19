/**
 * 赵霞游戏 - 完美真爱结局线性剧情系统
 *
 * 与真好结局的区别：
 * 1. 苏文主动成全，成为"苦主"，而非被药倒
 * 2. 赵霞穿纯白婚纱，无纹身、无乳环展示
 * 3. 12步婚礼仪式，充满仪式感和浪漫
 * 4. 氛围是"真爱的选择"而非"堕落的胜利"
 *
 * 触发条件：
 * - Day 5, 11:00+ 开始预热引导（场景5完成后1小时）
 * - 5场景全部完成且正确
 * - 记忆连贯性 = 3（完美记忆路线：按顺序完成场景1→2→3后进入场景5）
 * - 循环状态 = 结局判定 或 进行中
 * - 当前结局 = 完美真爱结局
 *
 * 时间线设计：
 * - 10:00 从场景5梦境退出
 * - 11:00 开始引导（阶段0-3：序幕→预备）
 * - 20:00 晚餐时刻（赵霞和苏文长谈后的决定）
 * - 21:00 自由时间（暂停引导）
 * - 22:00 恢复引导（仪式准备）
 * - 23:00 自由时间（暂停引导）
 * - 00:00 婚礼仪式开始，触发阶段4-11（仪式→完成）
 */

import type { Schema as SchemaType } from '../../schema';
import { getScene5LockedCoherence } from './scene5System';

// ============================================
// 阶段定义
// ============================================

export interface PerfectEndingPhase {
  phase: number;
  name: string;
  title: string;
  description: string;
  minTurns: number; // 最少需要的对话轮数
  maxTurns: number; // Bug #19：最大对话轮数，超过后强制推进
  minHour?: number; // Bug #19：最早可触发时间（小时）
  strict?: boolean; // Bug #19：是否严格锁定时间（true=必须等到minHour才能进入）
  anchorEvents: string[]; // 该阶段必须发生的锚点事件
  aiGuidance: string; // AI引导方向
  correctionHints: string[]; // 玩家偏离时的修正提示
  // Bug #15 修复：玩家引导机制
  expectedActions?: string[]; // 期望玩家执行的动作关键词
  hintThreshold?: number; // 触发提示的未响应轮数阈值（默认2）
  progressHint?: string; // 引导提示内容（当玩家卡关时显示）
}

export const PERFECT_ENDING_PHASES: PerfectEndingPhase[] = [
  // === 阶段0：序幕 ===
  {
    phase: 0,
    name: '序幕',
    title: '命中注定的早晨',
    description: '11:00，从梦境醒来后，赵霞的眼中有了不一样的光芒——她终于等到了那个人',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层在20-25
    minHour: 11, // 11:00后开始
    anchorEvents: ['记忆觉醒', '心意已决'],
    aiGuidance: `【完美真爱结局 - 阶段0：序幕】

今天是赵霞和苏文的结婚纪念日。
但对赵霞来说，这是一个终于可以坦白一切的日子。

【时间】Day 5, 11:00（从场景5梦境醒来后1小时）

【完美记忆路线】
赵霞拥有完整的记忆重构：
- 16岁那个夏天的初恋
- 17岁在路口的等待
- 20岁生日想要逃离的渴望
- 结婚那天心中真正的人

这些不是被篡改的记忆，而是被唤醒的真相——
她一直在等待的人，终于出现了。

【场景设定】
- 刚从梦境中醒来不久
- 阳光透过窗户洒进来
- 赵霞的眼中有泪光，但那是幸福的泪
- 她终于明白了自己心中真正的感情

【赵霞状态】
不是被洗脑，不是被改造。
而是终于想起了一直被压抑的真实感情。
看向{{user}}的眼神充满了"终于等到你"的感动。

【AI任务】
1. 描写赵霞从梦境醒来后的状态——不是迷茫，而是清醒
2. 她看向{{user}}时，眼中有压抑多年的感情流露
3. 赵霞轻声说："我想起来了...一切都想起来了。"
4. 暗示她今天要做出一个重要的决定
5. 她需要先和苏文谈一谈

【重要】
这不是堕落，而是真爱。
赵霞的选择是发自内心的，不是被催眠的。

【禁止】
- 不要描写赵霞被改造的痕迹（无淫纹、无乳环）
- 不要让赵霞表现出迷茫或被控制感
- 保持"命中注定"的浪漫基调`,
    correctionHints: [
      '赵霞看着{{user}}，眼中有泪光闪烁："我...想起来了。十六岁那年夏天...是你。"',
      '赵霞深吸一口气："今天，我要和苏文好好谈谈。有些事...不能再藏着了。"',
      '"这么多年..."赵霞轻声说，"我一直在等一个人。现在我终于知道，那个人是谁了。"',
    ],
  },

  // === 阶段1：长谈 ===
  {
    phase: 1,
    name: '长谈',
    title: '与苏文的坦白',
    description: '14:00，赵霞决定和苏文坦诚一切，这是她欠他的诚实',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    minHour: 14, // 2026-01-19: 14:00后开始长谈
    strict: true,
    anchorEvents: ['开始谈话', '坦白感情', '苏文反应'],
    aiGuidance: `【完美真爱结局 - 阶段1：长谈】

赵霞决定在结婚纪念日这天，和苏文坦白一切。

【场景设定】
- 赵霞请{{user}}暂时回避
- 她和苏文单独在书房/客厅长谈
- 这是一场漫长而艰难的对话
- {{user}}可以从门外/楼上听到一些

【长谈内容】
赵霞会告诉苏文：
- 她心里一直有一个人
- 那些梦让她终于明白了自己的感情
- 她对苏文的感情...从来不是爱情
- 她很抱歉，但她不想再欺骗自己

【苏文的反应】
苏文会经历：
- 震惊 → 愤怒 → 痛苦 → 沉默 → 某种释然
- "我早就感觉到了...只是不想承认。"
- 他问："是谁？"
- 赵霞没有直接回答，但苏文已经猜到了

【AI任务】
1. 描写赵霞请{{user}}暂时回避的场景
2. 暗示书房里的长谈（可以是{{user}}视角听到的片段）
3. 时间流逝（这场谈话持续了很久）
4. 苏文的沉默...然后是某种决定
5. 赵霞从书房出来，眼眶红红的但表情坚定

【⚠️ 严禁 - 以下内容绝对不能出现】
- ❌ 离婚、协议离婚、分居协议等法律程序
- ❌ 财产分割、房子归属等讨论
- ❌ 苏文搬出去住、离开这个家
- ❌ 摘下婚戒、退还婚戒
- ❌ 任何关于"结束婚姻"的表述

【✓ 正确方向】
- 这不是离婚，而是"重新定义关系"
- 苏文选择留在这个家，但改变自己的角色
- 法律上仍是夫妻，但实际上苏文退居幕后
- 苏文的"成全"是让赵霞和{{user}}在这个家里成为"真正的一对"

【禁止】
- 不要让苏文变成绿帽癖（这个版本的苏文是悲情的成全者）
- 不要详细描写苏文的崩溃
- 保持对苏文的尊重和同情`,
    correctionHints: [
      '赵霞看向{{user}}："给我一点时间...我需要和苏文谈谈。"她的语气很坚定。',
      '书房的门关上了。隐约能听到低沉的对话声...还有什么东西摔碎的声音。',
      '很久之后，门开了。赵霞出来，眼眶有些红，但她的眼神前所未有的清澈。',
    ],
  },

  // === 阶段2：决定 ===
  {
    phase: 2,
    name: '决定',
    title: '苏文的成全',
    description: '16:00，苏文做出了一个艰难的决定——成全他们',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    minHour: 16, // 2026-01-19: 16:00后苏文做出决定
    strict: true,
    anchorEvents: ['苏文决定', '成全宣言'],
    aiGuidance: `【完美真爱结局 - 阶段2：决定】

苏文做出了他的决定。

【场景设定】
- 长谈结束后
- 苏文从书房出来，表情复杂但平静
- 他主动找到{{user}}

【苏文的话】
苏文会对{{user}}说：
- "我知道了...是你，对吧。"
- "说实话，我不是没有察觉。"
- "这些年...她的心从来不在我身上。"
- "我试过让她爱上我，但有些事...勉强不来。"

然后，苏文会说出他的决定：
- "我不会阻止你们。"
- "今晚...是我们的结婚纪念日。"
- "我想给她一个...真正的婚礼。"
- "不是和我的，是和她真正爱的人的。"

【⚠️ 严禁 - 以下内容绝对不能出现】
- ❌ 离婚、协议离婚、分居协议
- ❌ 苏文搬出去住、离开这个家
- ❌ 财产分割、房子归谁
- ❌ 摘下婚戒、退还婚戒（婚戒会在阶段10仪式中处理）
- ❌ 任何法律程序或文件

【✓ 成全的正确含义】
苏文的"成全"具体是指：
1. 他会**留在这个家**，但搬到客房/书房住
2. 他会继续**经济支持**这个家庭
3. 他会为赵霞和{{user}}**举办一场私人婚礼仪式**
4. 从今以后，赵霞和{{user}}才是这个家"真正的夫妻"
5. 法律上的婚姻关系不变，但实际角色重新定义

这是一种"家庭内部的关系重构"，不是离婚。

【AI任务】
1. 描写苏文平静但悲伤的表情
2. 苏文对{{user}}说出那些话
3. 宣布他的决定——为她举办一场婚礼仪式
4. 苏文说："今晚八点，主卧室。我会准备好一切。"
5. 他转身离开时的背影

【重要】
苏文是一个悲情的角色，但他选择了成全。
不是懦弱，而是因为他真的爱赵霞。
"如果让她幸福的不是我...那我至少可以目送她走向幸福。"`,
    correctionHints: [
      '苏文的声音很平静："我知道了。是你，对吧？"他的眼神很复杂。',
      '"我没办法让她爱上我。"苏文苦笑，"十年了...我早就知道。"',
      '"今晚八点。"苏文站起身，"我会给你们...一场婚礼。"',
    ],
  },

  // === 阶段3：准备 ===
  {
    phase: 3,
    name: '准备',
    title: '婚礼的筹备',
    description: '苏文默默准备着一切，赵霞和{{user}}在等待中度过漫长的下午',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['等待时光', '婚礼准备'],
    aiGuidance: `【完美真爱结局 - 阶段3：准备】

漫长的下午，等待着那个时刻的到来。

【场景设定】
- 苏文在主卧室忙碌着，不让任何人进去
- 赵霞换了一身素净的衣服，坐在客厅等待
- {{user}}陪在她身边
- 偶尔能听到楼上传来布置的声音

【赵霞的状态】
- 她有些紧张，但眼中充满期待
- 她会和{{user}}轻声说话
- 回忆那些梦中的场景——现在她知道那不是梦
- "十六岁那年...我就在等你了。"

【时间流逝】
- 下午的阳光慢慢西斜
- 赵霞靠在{{user}}肩头
- 偶尔听到苏文下楼拿东西
- 他们不需要说太多话，只是静静地待在一起

【AI任务】
1. 描写等待的氛围——紧张又温馨
2. 赵霞偶尔说起那些记忆
3. 苏文的身影在楼上忙碌
4. 窗外的阳光渐渐变成暮色
5. 终于，苏文下楼了："准备好了。"

【禁止】
- 这个阶段不要有亲密接触
- 保持婚礼前的神圣感`,
    correctionHints: [
      '赵霞靠在{{user}}肩头，轻声说："你知道吗...十六岁那年，我就梦到过这一天。"',
      '楼上传来细微的响动，苏文在忙碌着什么。赵霞安静地等待，脸上带着淡淡的红晕。',
      '暮色渐沉。苏文从楼梯上走下来："时间到了。"',
    ],
  },

  // === 阶段4：蒙眼 ===
  {
    phase: 4,
    name: '蒙眼',
    title: '蒙眼带入',
    description: '苏文蒙住玩家的眼睛，带他走向准备好的房间',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    minHour: 20, // Bug #19: 仪式20:00后开始
    strict: true, // Bug #19: 严格时间锁定
    anchorEvents: ['蒙眼', '带入房间'],
    aiGuidance: `【完美真爱结局 - 阶段4：蒙眼带入】

婚礼仪式正式开始。

【场景设定】
- 时间：20:00
- 苏文拿着一条丝绸带走向{{user}}
- 他的表情平静，甚至带着一丝微笑
- "让我蒙住你的眼睛。"

【仪式开始】
苏文会说：
- "这是赵霞的愿望。"
- "她想给你一个惊喜。"
- "跟我来。"

然后：
- 柔软的丝绸蒙住{{user}}的眼睛
- 苏文牵着{{user}}的手
- 一步步走上楼梯
- 门打开的瞬间，能闻到花香和蜡烛的气息

【AI任务】
1. 描写苏文拿出丝绸带的动作
2. 他蒙住{{user}}的眼睛
3. 牵着{{user}}的手上楼
4. 描写{{user}}被蒙着眼睛时的感受
5. 门打开，花香和烛光的气息扑面而来

【重要】
苏文的动作是温柔的，没有敌意。
他是一个正在完成承诺的人。`,
    correctionHints: [
      '苏文手中是一条白色的丝绸带："让我蒙住你的眼睛。这是她的愿望。"',
      '视野陷入黑暗，但能感受到苏文的手牵着你。楼梯，一步一步向上。',
      '门开了。花香、蜡烛、还有某种神圣的气息...充满了整个空间。',
    ],
  },

  // === 阶段5：揭幕 ===
  {
    phase: 5,
    name: '揭幕',
    title: '揭开眼罩',
    description: '眼罩被取下，眼前是一个小型的婚礼现场',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['揭开眼罩', '看到场景'],
    aiGuidance: `【完美真爱结局 - 阶段5：揭开眼罩】

看到准备好的一切。

【场景设定】
- 苏文的声音："可以了。"
- 丝绸带被轻轻取下
- 眼前的景象让人屏住呼吸

【婚礼场景】
主卧室被布置成了一个温馨的婚礼现场：
- 白色的纱幔从天花板垂落
- 鲜花装点着每一个角落（百合、玫瑰）
- 蜡烛在角落里摇曳，投下温暖的光影
- 红毯从门口铺向床边
- 房间四角有摄像机，红灯闪烁——记录这一刻

【AI任务】
1. 描写眼罩被取下的瞬间
2. {{user}}看到的婚礼布置
3. 详细描写：纱幔、鲜花、蜡烛、红毯
4. 注意到四角的摄像机
5. 这一切都是苏文一个人准备的

【重要】
场景要温馨、神圣、充满仪式感。
不是色情的布置，而是真正的婚礼。`,
    correctionHints: [
      '"可以了。"丝绸带滑落，眼前的景象让人一瞬间忘记了呼吸。',
      '白色的纱幔，烛光摇曳，鲜花的芬芳...这是一个真正的婚礼现场。',
      '房间四角架着摄像机，红灯闪烁。这一切，都会被记录下来。',
    ],
  },

  // === 阶段6：新娘 ===
  {
    phase: 6,
    name: '新娘',
    title: '看到赵霞',
    description: '赵霞穿着纯白的婚纱，站在房间中央',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['看到新娘', '婚纱描写'],
    aiGuidance: `【完美真爱结局 - 阶段6：看到新娘】

她站在那里，等待着。

【场景设定】
房间中央，站着赵霞。

【赵霞的装扮】
- 一件纯白的婚纱
- 不是低俗的情趣装，而是真正优雅的婚纱
- 蕾丝勾勒出她的身体曲线，若隐若现却不失优雅
- 没有纹身，没有穿环，没有任何淫秽的装饰
- 头纱轻轻遮住她的脸
- 手中捧着一束白色百合

【赵霞的状态】
- 她的眼中含着泪光，但那是幸福的泪
- 嘴角是止不住的笑意
- "你来了。"
- "我等了你...很久很久。"

【AI任务】
1. 描写赵霞穿着婚纱的样子
2. 强调纯洁、优雅、美丽
3. 她眼中的泪光和笑容
4. 她说的话——"你来了。"
5. 这一刻的神圣感

【禁止】
- 不要描写任何色情元素
- 不要提及纹身、乳环等改造痕迹
- 保持婚礼的神圣氛围`,
    correctionHints: [
      '房间中央，赵霞穿着纯白的婚纱，手捧百合，等待着。',
      '她的眼中含着泪光，但嘴角是止不住的笑意。"你来了。"',
      '婚纱的裙摆铺散在地上，像一朵盛开的白色花朵。她美得让人移不开眼。',
    ],
  },

  // === 阶段7：司仪 ===
  {
    phase: 7,
    name: '司仪',
    title: '苏文的宣言',
    description: '苏文作为司仪，宣布仪式开始，并说出他的决定',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['仪式开始', '苏文讲述', '苏文成全承诺'],
    aiGuidance: `【完美真爱结局 - 阶段7：苏文的宣言】

苏文站在你们中间，作为这场婚礼的司仪。

【场景设定】
- 苏文穿着正式的西装
- 他站在赵霞和{{user}}中间
- 表情复杂，但语气平静

【苏文的话】
他会说：
- "今天，在这个特殊的日子里..."
- "我们聚集在这里，见证一段新的关系的开始。"
- "在正式开始之前，请允许我说几句话。"

然后，苏文讲述：
- "昨晚...赵霞和我谈了一整夜。"
- "她告诉了我一切。"
- "关于她的感受...关于她的选择。"
- "说实话，一开始我很愤怒。"
- "但是...看着她的眼神，我明白了。"
- "她爱的人是你。不是我。也许从来都不是我。"
- "我没有办法强迫一个人爱我。"

最后，他宣布：
- "所以——我决定成全你们。"
- "从今以后，你们才是这个家真正的夫妻。"
- "我会搬到原来的房间去住。"
- "经济上，我会继续支持这个家...包括你们将来的孩子。"
- "这是我能做的。希望你能让她幸福。"

【AI任务】
1. 描写苏文作为司仪的样子
2. 他的开场白
3. 讲述昨晚的长谈
4. 承认赵霞爱的不是他
5. 宣布他的成全和承诺

【重要】
苏文是这个故事中的悲情英雄。
他的成全让这个结局有了救赎的意味。`,
    correctionHints: [
      '苏文清了清嗓子："今天，在这个特殊的日子...我们见证一段新关系的开始。"',
      '"她爱的人是你，不是我。"苏文的声音很平静，"也许...从来都不是我。"',
      '"我决定成全你们。"苏文说，"希望你能让她幸福。"',
    ],
  },

  // === 阶段8：告白 ===
  {
    phase: 8,
    name: '告白',
    title: '赵霞的誓言',
    description: '赵霞走向玩家，说出她压抑多年的心声',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['走向玩家', '回忆往事', '告白誓言'],
    aiGuidance: `【完美真爱结局 - 阶段8：赵霞的誓言】

赵霞开始向{{user}}走来。

【场景设定】
- 婚纱的裙摆在地上拖出一道白色的痕迹
- 每一步，她的眼睛都没有离开{{user}}
- 泪水从她的眼角滑落，但她在笑

【赵霞的话】
她会说：
- "我等这一天...等了很久。"
- "在梦里，在记忆里...你一直都在。"
- "十六岁那个夏天的初吻..."
- "十七岁那个路口的等待..."
- "二十岁那个想要逃跑的夜晚..."
- "二十五岁那场本不该属于他的婚礼..."
- "每一次，我心里想的都是你。"

然后，她在{{user}}面前停下，伸手捧住他的脸：
- "现在，我终于可以光明正大地说——"
- "我爱你。"
- "从今以后，我只属于你。"

【AI任务】
1. 描写赵霞向{{user}}走来
2. 她回忆那些场景——但这次不是梦，是真实的感情
3. 每一段记忆都是一次告白
4. 她停在{{user}}面前
5. 说出那句"我爱你"

【重要】
这是发自内心的告白，不是被改造后的服从。
她的眼神清澈，她的选择是清醒的。`,
    correctionHints: [
      '赵霞向{{user}}走来，婚纱在地上拖出一道白色的痕迹。她的眼中有泪，但那是幸福的泪。',
      '"十六岁那个夏天...十七岁那个路口..."她的声音在颤抖，"每一次，我心里想的都是你。"',
      '她捧住{{user}}的脸："我爱你。从今以后，我只属于你。"',
    ],
  },

  // === 阶段9：誓言 ===
  {
    phase: 9,
    name: '誓言',
    title: '玩家的誓言',
    description: '玩家向赵霞说出自己的誓言',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['玩家誓言', '回应告白'],
    aiGuidance: `【完美真爱结局 - 阶段9：玩家的誓言】

轮到{{user}}说出誓言了。

【场景设定】
- 苏文在一旁轻声提示："现在，请新郎...向新娘说出你的誓言。"
- 赵霞期待地看着{{user}}
- 摄像机的红灯闪烁着，记录着这一刻

【这是玩家的时刻】
{{user}}可以自由表达：
- 对赵霞的爱
- 对这段感情的承诺
- 对未来的期待
- 任何想说的话

【AI引导】
无论玩家说什么：
- 赵霞会认真倾听
- 她的眼中满是感动
- 最后她会说："我愿意。"

【AI任务】
1. 苏文提示该{{user}}说誓言了
2. 描写赵霞期待的眼神
3. 等待玩家输入
4. 根据玩家的话，描写赵霞的反应
5. 她的回应——感动、幸福、"我愿意"

【重要】
这是玩家的高光时刻，让他自由发挥。`,
    correctionHints: [
      '苏文轻声说："现在，请新郎...向新娘说出你的誓言。"',
      '赵霞期待地看着{{user}}，等待着。摄像机的红灯闪烁，记录着这一刻。',
      '她的眼中满是感动。无论{{user}}说什么，她都会认真倾听。',
    ],
    // Bug #15 修复：玩家引导机制
    expectedActions: ['爱', '喜欢', '永远', '一辈子', '誓言', '承诺', '愿意', '属于', '在一起'],
    hintThreshold: 2,
    progressHint: '赵霞期待地看着你，等待着你的誓言。苏文轻声提醒："新郎，请向新娘说出你的心意...比如你对她的爱，你的承诺。"',
  },

  // === 阶段10：戒指 ===
  {
    phase: 10,
    name: '戒指',
    title: '交换戒指',
    description: '赵霞摘下原来的戒指，换上属于他们的新戒指',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['摘下旧戒指', '戴上新戒指'],
    aiGuidance: `【完美真爱结局 - 阶段10：交换戒指】

最神圣的时刻。

【场景设定】
- 赵霞从婚纱的口袋里取出一个小盒子
- 里面是两枚银色的戒指——她重新买的
- 只属于他们的戒指

【仪式】
赵霞会：
1. 先摘下自己的结婚戒指（和苏文的）
2. 将它递给苏文（苏文接过，沉默）
3. 然后打开新的戒指盒
4. 将一枚戒指戴在{{user}}的手指上
5. 另一枚戴在自己的手指上

她会说：
- "这是我重新买的...只属于我们的戒指。"
- "愿意接受我吗？"
- "作为你的...妻子。"

【重要说明】
摘戒指只能在这个阶段（阶段10）发生！
- 之前的阶段中，赵霞一直戴着和苏文的婚戒
- 在婚礼仪式中当着苏文的面交接，才有仪式感
- 这是"旧关系的正式交接"，不是离婚

【AI任务】
1. 描写赵霞拿出戒指盒
2. 她摘下旧戒指的动作——有一丝犹豫，但很快坚定
3. 将旧戒指递给苏文
4. 苏文接过戒指的表情
5. 为{{user}}戴上新戒指
6. 她的话和期待的眼神

【重要】
这一幕既有对过去的告别，也有对未来的期待。
苏文接过戒指时的表情要有分量。`,
    correctionHints: [
      '赵霞从口袋里取出一个小盒子。打开——里面是两枚银色的戒指。',
      '她缓缓摘下手上的结婚戒指，将它递给苏文。苏文接过，沉默不语。',
      '"这是只属于我们的戒指。"她将戒指套在{{user}}的手指上，"愿意接受我吗？"',
    ],
    // Bug #15 修复：玩家引导机制
    expectedActions: ['戴', '戒指', '套', '接受', '愿意', '手指', '伸手'],
    hintThreshold: 2,
    progressHint: '赵霞举起戒指盒，里面是一枚银色的戒指。她轻声问："愿意让我为你戴上吗？"她的眼神充满期待，等待你伸出手...',
  },

  // === 阶段11：完成 ===
  {
    phase: 11,
    name: '完成',
    title: '新人之吻',
    description: '苏文宣布仪式完成，新人接吻，真爱结局达成',
    minTurns: 1,
    maxTurns: 2, // Bug #19: 控制总楼层
    anchorEvents: ['宣布完成', '新人之吻', '结局达成'],
    aiGuidance: `【完美真爱结局 - 阶段11：新人之吻（最终阶段）】

仪式的最后一步。

【场景设定】
- 苏文站在一旁
- 摄像机记录着一切
- 烛光摇曳，映照着两个人的身影

【仪式完成】
苏文会说：
- "我宣布——"
- "从今天起，你们正式成为夫妻。"
- "请新人...接吻。"

然后：
- 赵霞仰起头，闭上眼睛
- 泪痕还挂在脸上，但嘴角是幸福的弧度
- 她等待着{{user}}

【亲吻后】
- 两人的嘴唇相触
- 这是属于他们的婚礼之吻
- 苏文在旁边轻轻鼓掌
- 摄像机记录下这一刻

赵霞最后的话：
- "从今以后..."
- "我是你的妻子。"
- "永远。"

【AI任务】
1. 苏文宣布仪式完成
2. 赵霞闭眼等待
3. 描写亲吻的瞬间
4. 苏文的鼓掌
5. 赵霞的最后宣言
6. 结局达成

【结局标记】
完成此阶段后，系统将：
- 标记：时间循环被打破
- 标记：完美真爱结局达成
- 解锁：后日谈模式`,
    correctionHints: [], // 最终阶段不需要修正
    // Bug #15 修复：最终阶段的引导机制
    expectedActions: ['吻', '亲', '接吻', '嘴唇', '靠近', '低头', '抬头'],
    hintThreshold: 2,
    progressHint: '赵霞闭上眼睛，微微仰起头，等待着...苏文轻声说："请新人接吻。"她的睫毛微微颤抖，樱唇轻启，等待着你低下头...',
  },
];

// ============================================
// 状态管理
// ============================================

export interface PerfectEndingState {
  isActive: boolean; // 是否已激活完美真爱结局流程
  currentPhase: number; // 当前阶段 (0-11)
  turnsInPhase: number; // 当前阶段的对话轮数
  completedAnchors: string[]; // 已完成的锚点事件
  totalTurns: number; // 总对话轮数
  isComplete: boolean; // 是否已完成
  // Bug #15 修复：玩家引导机制
  noProgressTurns: number; // 玩家连续未触发锚点的轮数
  hintGiven: boolean; // 当前阶段是否已给出引导提示
}

/**
 * 获取默认的完美真爱结局状态
 */
export function getDefaultPerfectEndingState(): PerfectEndingState {
  return {
    isActive: false,
    currentPhase: 0,
    turnsInPhase: 0,
    completedAnchors: [],
    totalTurns: 0,
    isComplete: false,
    // Bug #15 修复
    noProgressTurns: 0,
    hintGiven: false,
  };
}

// ============================================
// 触发条件检测
// ============================================

/**
 * 检测是否应该激活完美真爱结局流程
 *
 * 条件：
 * 1. Day 5, 11:00+
 * 2. 循环状态为结局判定、进行中或已破解
 * 3. 当前结局为完美真爱结局
 * 4. 5场景全部完成且正确
 * 5. 记忆连贯性 = 3（完美记忆路线）
 */
export function shouldActivatePerfectEnding(data: SchemaType): boolean {
  // 条件1：Day 5, 11:00+
  const day = data.世界.当前天数;
  const hour = data.世界.当前小时;
  if (day < 5 || (day === 5 && hour < 11)) {
    return false;
  }

  // 条件2：循环状态为结局判定、进行中或已破解
  const validStates = ['结局判定', '已破解', '进行中'];
  if (!validStates.includes(data.世界.循环状态)) {
    return false;
  }

  // 条件3：当前结局必须是完美真爱结局
  const currentEnding = data.结局数据.当前结局;
  if (currentEnding !== '完美真爱结局') {
    return false;
  }

  // 条件4：5场景全部完成且正确
  const completedScenes = data.梦境数据.已完成场景;
  const correctScenes = data.梦境数据.正确重构场景;

  const allCompleted = [1, 2, 3, 4, 5].every((s) => completedScenes.includes(s));
  const allCorrect = [1, 2, 3, 4, 5].every((s) => correctScenes.includes(s));

  if (!allCompleted || !allCorrect) {
    return false;
  }

  // 条件5：记忆连贯性 = 3（完美记忆路线）
  const coherence = getScene5LockedCoherence(data);
  if (coherence !== 3) {
    return false;
  }

  return true;
}

/**
 * 检测当前是否为自由时间（21:00 或 23:00）
 */
export function isPerfectEndingFreeTime(data: SchemaType): boolean {
  const day = data.世界.当前天数;
  const hour = data.世界.当前小时;

  // 只在 Day 5 的 21:00 和 23:00 是自由时间
  if (day === 5 && (hour === 21 || hour === 23)) {
    return true;
  }

  return false;
}

/**
 * 检测完美真爱结局是否已经激活（从Schema读取）
 */
export function isPerfectEndingActive(data: SchemaType): boolean {
  const endingState = (data as any).完美真爱结局状态 as PerfectEndingState | undefined;
  return endingState?.isActive === true;
}

/**
 * 获取当前完美真爱结局状态
 */
export function getPerfectEndingState(data: SchemaType): PerfectEndingState {
  const endingState = (data as any).完美真爱结局状态 as PerfectEndingState | undefined;
  return endingState ?? getDefaultPerfectEndingState();
}

/**
 * 更新完美真爱结局状态
 */
export function updatePerfectEndingState(data: SchemaType, state: PerfectEndingState): void {
  (data as any).完美真爱结局状态 = state;
}

// ============================================
// 锚点事件检测
// ============================================

/**
 * 锚点事件关键词映射
 */
const PERFECT_ANCHOR_KEYWORDS: Record<string, string[]> = {
  // 阶段0
  记忆觉醒: ['想起来了', '记忆', '终于明白', '一直在等', '十六岁', '那个夏天'],
  心意已决: ['决定', '坦白', '告诉', '不能再', '今天'],

  // 阶段1
  开始谈话: ['谈谈', '单独', '回避', '书房', '需要时间'],
  坦白感情: ['心里.*人', '不是爱情', '告诉.*一切', '对不起'],
  苏文反应: ['早就.*感觉', '察觉', '震惊', '愤怒', '沉默'],

  // 阶段2
  苏文决定: ['知道了', '是你', '猜到', '明白'],
  成全宣言: ['成全', '不会阻止', '婚礼', '八点'],

  // 阶段3
  等待时光: ['等待', '下午', '靠在', '陪', '准备'],
  婚礼准备: ['忙碌', '布置', '准备好了', '时间到'],

  // 阶段4
  蒙眼: ['蒙住', '眼睛', '丝绸', '看不见'],
  带入房间: ['跟我来', '上楼', '牵.*手', '门.*开'],

  // 阶段5
  揭开眼罩: ['可以了', '取下', '揭开', '睁开眼'],
  看到场景: ['纱幔', '鲜花', '蜡烛', '婚礼', '布置'],

  // 阶段6
  看到新娘: ['站在', '等待', '房间中央', '赵霞'],
  婚纱描写: ['婚纱', '白色', '纯白', '优雅', '美丽', '百合'],

  // 阶段7
  仪式开始: ['今天', '见证', '开始', '司仪'],
  苏文讲述: ['昨晚', '长谈', '告诉.*一切', '她的感受'],
  苏文成全承诺: ['成全你们', '夫妻', '幸福', '让她幸福', '搬到', '支持这个家'],

  // 阶段8
  走向玩家: ['走来', '走向', '靠近', '停在.*面前'],
  回忆往事: ['十六岁', '十七岁', '二十岁', '那个夏天', '那个路口'],
  告白誓言: ['我爱你', '属于你', '等.*很久'],

  // 阶段9
  玩家誓言: ['誓言', '新郎', '说出'],
  回应告白: ['愿意', '感动', '我愿意'],

  // 阶段10
  摘下旧戒指: ['摘下', '旧.*戒指', '结婚戒指'],
  戴上新戒指: ['新.*戒指', '戴.*上', '套在'],

  // 阶段11
  宣布完成: ['宣布', '正式.*夫妻', '仪式.*完成'],
  新人之吻: ['接吻', '亲吻', '嘴唇.*相触'],
  结局达成: ['从今以后', '永远', '妻子'],
};

/**
 * 检测AI回复中完成了哪些锚点事件
 */
export function detectPerfectAnchors(aiResponse: string, phase: number): string[] {
  const phaseConfig = PERFECT_ENDING_PHASES[phase];
  if (!phaseConfig) return [];

  const completed: string[] = [];

  for (const anchor of phaseConfig.anchorEvents) {
    const keywords = PERFECT_ANCHOR_KEYWORDS[anchor] || [];
    const isCompleted = keywords.some((kw) => {
      // 支持简单的正则匹配
      if (kw.includes('.*')) {
        const regex = new RegExp(kw, 'i');
        return regex.test(aiResponse);
      }
      return aiResponse.includes(kw);
    });

    if (isCompleted) {
      completed.push(anchor);
    }
  }

  return completed;
}

// ============================================
// Bug #15 修复：玩家引导机制
// ============================================

/**
 * 检测玩家输入是否包含当前阶段的期望动作
 * @param userInput 玩家输入
 * @param phase 当前阶段
 * @returns 是否包含期望动作
 */
export function hasExpectedAction(userInput: string, phase: number): boolean {
  const phaseConfig = PERFECT_ENDING_PHASES[phase];
  if (!phaseConfig || !phaseConfig.expectedActions || phaseConfig.expectedActions.length === 0) {
    // 没有配置期望动作，默认认为有进展
    return true;
  }

  const lowerInput = userInput.toLowerCase();
  return phaseConfig.expectedActions.some(action => lowerInput.includes(action.toLowerCase()));
}

/**
 * 检查是否应该给出引导提示
 * @param state 当前状态
 * @param userInput 玩家输入
 * @returns 需要显示的提示内容，如果不需要提示则返回 null
 */
export function checkProgressHint(state: PerfectEndingState, userInput: string): string | null {
  const phaseConfig = PERFECT_ENDING_PHASES[state.currentPhase];
  if (!phaseConfig) return null;

  // 如果已经给出过提示，不再重复
  if (state.hintGiven) return null;

  // 如果没有配置提示，跳过
  if (!phaseConfig.progressHint) return null;

  // 检查玩家是否执行了期望动作
  const hasAction = hasExpectedAction(userInput, state.currentPhase);

  // 如果玩家执行了期望动作，不需要提示
  if (hasAction) return null;

  // 检查是否达到提示阈值
  const threshold = phaseConfig.hintThreshold ?? 2;
  if (state.noProgressTurns + 1 >= threshold) {
    return phaseConfig.progressHint;
  }

  return null;
}

/**
 * 更新引导状态（在每轮对话前调用）
 * @param state 当前状态
 * @param userInput 玩家输入
 * @returns 更新后的状态和可能的提示
 */
export function updateProgressTracking(
  state: PerfectEndingState,
  userInput: string
): {
  updatedState: PerfectEndingState;
  hint: string | null;
} {
  const hasAction = hasExpectedAction(userInput, state.currentPhase);

  if (hasAction) {
    // 玩家执行了期望动作，重置计数
    return {
      updatedState: {
        ...state,
        noProgressTurns: 0,
      },
      hint: null,
    };
  }

  // 玩家未执行期望动作，增加计数
  const newNoProgressTurns = state.noProgressTurns + 1;
  const hint = checkProgressHint({ ...state, noProgressTurns: newNoProgressTurns - 1 }, userInput);

  return {
    updatedState: {
      ...state,
      noProgressTurns: newNoProgressTurns,
      hintGiven: hint !== null ? true : state.hintGiven,
    },
    hint,
  };
}

// ============================================
// 阶段推进逻辑
// ============================================

/**
 * Bug #19: 检查是否可以进入下一阶段（时间锁定检查）
 * @param state 当前状态
 * @param currentHour 当前小时
 * @returns 是否被阻挡及原因
 */
export function canEnterNextPerfectPhase(
  state: PerfectEndingState,
  currentHour: number
): { blocked: boolean; reason?: string; waitHours?: number } {
  const nextPhase = state.currentPhase + 1;
  if (nextPhase >= PERFECT_ENDING_PHASES.length) {
    return { blocked: false };
  }

  const nextConfig = PERFECT_ENDING_PHASES[nextPhase];
  if (!nextConfig) return { blocked: false };

  // 检查时间锁定
  if (nextConfig.minHour !== undefined && nextConfig.strict) {
    if (currentHour < nextConfig.minHour) {
      const waitHours = nextConfig.minHour - currentHour;
      return {
        blocked: true,
        reason: `【${nextConfig.name}】阶段需要在 ${nextConfig.minHour}:00 后才能开始`,
        waitHours,
      };
    }
  }

  return { blocked: false };
}

/**
 * 检查是否应该推进到下一阶段
 * Bug #19: 增加 maxTurns 强制推进和时间检查
 * Bug #40 修复：添加时间锁定检查，maxTurns 强制推进也必须遵守时间约束
 */
export function shouldAdvancePerfectPhase(state: PerfectEndingState, currentHour?: number): boolean {
  const phaseConfig = PERFECT_ENDING_PHASES[state.currentPhase];
  if (!phaseConfig) return false;

  // Bug #40 修复：先检查时间锁定，如果下一阶段有时间锁定且当前时间不满足，不推进
  // 无论是 maxTurns 强制推进还是锚点完成推进，都必须遵守时间约束
  if (currentHour !== undefined) {
    const canEnter = canEnterNextPerfectPhase(state, currentHour);
    if (canEnter.blocked) {
      // 时间锁定，不允许推进
      return false;
    }
  }

  // Bug #19: 超过最大轮数时强制推进（但仍受时间锁定约束）
  if (phaseConfig.maxTurns && state.turnsInPhase >= phaseConfig.maxTurns) {
    console.info(
      `[完美真爱结局] 阶段${state.currentPhase}(${phaseConfig.name}) 达到最大轮数${phaseConfig.maxTurns}，强制推进`
    );
    return true;
  }

  // 检查最少轮数
  if (state.turnsInPhase < phaseConfig.minTurns) {
    return false;
  }

  // 检查锚点事件是否全部完成
  const allAnchorsComplete = phaseConfig.anchorEvents.every((anchor) =>
    state.completedAnchors.includes(anchor)
  );

  return allAnchorsComplete;
}

/**
 * 推进到下一阶段
 */
export function advanceToPerfectNextPhase(state: PerfectEndingState): PerfectEndingState {
  const nextPhase = state.currentPhase + 1;

  // 检查是否已完成所有阶段
  if (nextPhase >= PERFECT_ENDING_PHASES.length) {
    return {
      ...state,
      isComplete: true,
    };
  }

  return {
    ...state,
    currentPhase: nextPhase,
    turnsInPhase: 0,
    completedAnchors: [], // 清空锚点，准备新阶段
    // Bug #15 修复：进入新阶段时重置引导状态
    noProgressTurns: 0,
    hintGiven: false,
  };
}

/**
 * 处理一轮对话后的状态更新
 * Bug #19: 增加时间锁定支持
 */
export function processPerfectTurnEnd(
  state: PerfectEndingState,
  aiResponse: string,
  userInput?: string,
  currentHour?: number
): {
  newState: PerfectEndingState;
  phaseAdvanced: boolean;
  newPhase: number | null;
  timeBlocked?: { reason: string; waitHours: number };
} {
  // 增加轮数
  let newState: PerfectEndingState = {
    ...state,
    turnsInPhase: state.turnsInPhase + 1,
    totalTurns: state.totalTurns + 1,
  };

  // 检测本轮完成的锚点
  const newAnchors = detectPerfectAnchors(aiResponse, state.currentPhase);
  const allAnchors = [...new Set([...newState.completedAnchors, ...newAnchors])];
  newState.completedAnchors = allAnchors;

  // 检查是否推进
  let phaseAdvanced = false;
  let newPhase: number | null = null;

  if (shouldAdvancePerfectPhase(newState, currentHour)) {
    // Bug #19: 检查时间锁定
    if (currentHour !== undefined) {
      const timeCheck = canEnterNextPerfectPhase(newState, currentHour);
      if (timeCheck.blocked) {
        // 时间被锁定，不推进，返回等待信息
        return {
          newState,
          phaseAdvanced: false,
          newPhase: null,
          timeBlocked: {
            reason: timeCheck.reason || '时间未到',
            waitHours: timeCheck.waitHours || 1,
          },
        };
      }
    }

    newState = advanceToPerfectNextPhase(newState);
    phaseAdvanced = true;
    newPhase = newState.currentPhase;
  }

  return { newState, phaseAdvanced, newPhase };
}

// ============================================
// AI Prompt 生成
// ============================================

/**
 * 生成当前阶段的AI引导Prompt
 * Bug #19: 增加剩余轮数和紧迫性提示
 * Bug #40 修复：时间锁定时不显示紧迫感提示，改为显示"自由探索"
 * @param state 当前状态
 * @param userInput 玩家输入（用于检测期望动作）
 * @param currentHour 当前小时（用于时间锁定提示）
 */
export function generatePerfectEndingPrompt(state: PerfectEndingState, userInput: string, currentHour?: number): string {
  const phaseConfig = PERFECT_ENDING_PHASES[state.currentPhase];
  if (!phaseConfig) return '';

  // 计算剩余锚点
  const remainingAnchors = phaseConfig.anchorEvents.filter(
    (a) => !state.completedAnchors.includes(a)
  );

  // Bug #40 修复：检查下一阶段时间锁定
  const hour = currentHour ?? 12;
  const nextPhaseCheck = canEnterNextPerfectPhase(state, hour);
  const isTimeLocked = nextPhaseCheck.blocked;

  // Bug #40 修复：当时间锁定时，轮数提示改为"自由探索"
  let turnsWarning: string;
  if (isTimeLocked) {
    turnsWarning = `自由探索中（等待${PERFECT_ENDING_PHASES[state.currentPhase + 1]?.minHour}:00）`;
  } else {
    const remainingTurns = phaseConfig.maxTurns - state.turnsInPhase;
    turnsWarning =
      remainingTurns <= 2
        ? `⚠️ 剩余${remainingTurns}轮后将自动推进到下一阶段`
        : `剩余约${remainingTurns}轮`;
  }

  // Bug #40 修复：时间锁定时不显示紧迫感提示
  let urgencyHint = '';
  if (!isTimeLocked) {
    const remainingTurns = phaseConfig.maxTurns - state.turnsInPhase;
    if (remainingTurns <= 1) {
      urgencyHint = '\n\n【⚠️ 紧迫性提示】本阶段即将结束（剩余1轮），请确保在本轮推进关键剧情！';
    } else if (remainingTurns <= 2) {
      urgencyHint = `\n\n【提示】本阶段剩余 ${remainingTurns} 轮，请适时推进剧情。`;
    }
  }

  // Bug #15 修复：检查是否需要给出引导提示
  let hintSection = '';
  if (phaseConfig.progressHint && state.noProgressTurns >= (phaseConfig.hintThreshold ?? 2) && !state.hintGiven) {
    hintSection = `\n\n【⚠️ 玩家引导提示 - 重要】
玩家似乎不知道该做什么，请在回复中自然地给出以下提示：
"${phaseConfig.progressHint}"

注意：
- 将提示融入角色对话或场景描写中，不要直接复制
- 让赵霞或苏文通过语言/动作暗示玩家应该做什么
- 保持自然，不要打破沉浸感`;
  }

  // Bug #40 修复：时间锁定的详细提示
  const timeBlockWarning = isTimeLocked
    ? `\n⏰ 时间锁定：下一阶段"${PERFECT_ENDING_PHASES[state.currentPhase + 1]?.name}"需要等到${PERFECT_ENDING_PHASES[state.currentPhase + 1]?.minHour}:00（当前${hour}:00）
📝 在此之前，请与玩家自由互动，享受这段时光。不要急于推进剧情。`
    : '';

  // 生成进度信息
  const progressInfo = `【进度】
- 当前阶段：${state.currentPhase + 1}/${PERFECT_ENDING_PHASES.length}（${phaseConfig.name}）
- 本阶段轮数：${state.turnsInPhase}（${turnsWarning}）
- 待完成事件：${remainingAnchors.length > 0 ? remainingAnchors.join('、') : '全部完成'}
- 总对话轮数：${state.totalTurns}${timeBlockWarning}`;

  // 生成引导Prompt
  return `${phaseConfig.aiGuidance}

${progressInfo}${urgencyHint}${hintSection}

【重要提示】
- 回应玩家的输入，同时自然地推进剧情
- 确保触发待完成的锚点事件
- 如果玩家偏离主线，温和地引导回来
- 保持"真爱"的浪漫基调，不是"堕落"
- 赵霞的选择是发自内心的，不是被催眠的
- 不要跳跃阶段，按顺序推进`;
}

/**
 * 获取当前阶段的修正提示（当玩家偏离时使用）
 */
export function getPerfectCorrectionHint(phase: number): string | null {
  const phaseConfig = PERFECT_ENDING_PHASES[phase];
  if (!phaseConfig || phaseConfig.correctionHints.length === 0) {
    return null;
  }

  // 随机选择一个修正提示
  const index = Math.floor(Math.random() * phaseConfig.correctionHints.length);
  return phaseConfig.correctionHints[index];
}

/**
 * 生成入口替换消息（首次激活时）
 */
export function generatePerfectEndingEntryReplacement(): {
  userMessage: string;
  prefill: string;
} {
  const userMessage = `[系统指令 - 完美真爱结局「命中注定」开始]

时间已到达 Day 5, 11:00。
刚刚从场景5的梦境中醒来。今天是赵霞和苏文的结婚纪念日。
完美记忆路线已达成，完美真爱结局正式开始。

【前情提要】
玩家已完成所有5个梦境场景，且全部选择正确：
- 场景1：初恋的夏日（16岁）- 初吻
- 场景2：等待中的屈辱（17岁）- 胸部觉醒
- 场景3：生日之夜的逃离（23岁）- 初夜
- 场景4：争吵后的放纵（28岁）- 完全开发
- 场景5：花嫁的誓约（结婚日）- 婚礼改写

（详细的梦境剧情摘要请参考变量列表中的「梦境数据.场景X.剧情摘要」字段）

【Day 1-4 日常回顾】
请回顾聊天记录中 Day 1 至 Day 4 的日常互动内容。
赵霞在结局中的表现应当体现出这些天积累的关系变化：
- 玩家与赵霞之间发生过什么互动？
- 赵霞对{{user}}的态度有什么变化？
- 有没有让赵霞印象深刻的温馨时刻？
这些日常记忆是"真实"的，印证了她在梦境中唤醒的感情——一切早有预兆。

【完美记忆路线】
玩家在进入场景5之前，按顺序完成了场景1→2→3。
赵霞拥有完整的记忆重构：
- 16岁那个夏天的初恋
- 17岁在路口的等待
- 20岁生日想要逃离的渴望
- 25岁结婚那天心中真正的人

这不是被篡改的记忆，而是被唤醒的真相——
她一直在等待的人，终于出现了。

【核心区别】
完美真爱结局与真好结局的关键区别：
- 赵霞不是被洗脑，而是发自内心
- 苏文不是被药倒，而是主动成全
- 婚纱是纯白优雅的，没有淫秽装饰
- 氛围是"真爱的选择"而非"堕落的胜利"

【当前场景】
从梦境中醒来后的第一个小时。
阳光透过窗户洒进来，赵霞终于明白了自己心中的感情。
今天，她要做出一个重要的决定。

【时间线】
- 11:00-19:00 序幕阶段：赵霞与苏文长谈
- 20:00 婚礼仪式开始
- 21:00 自由时间
- 22:00 仪式继续
- 23:00 自由时间
- 00:00 仪式完成

【AI任务】
1. 描写赵霞从梦境醒来后的状态——清醒、明白、坚定
2. 她看向{{user}}时，眼中有压抑多年的感情流露
3. 她说："我想起来了...一切都想起来了。"
4. 暗示她今天要做出一个重要的决定`;

  const prefill = `阳光温柔地洒进卧室。

赵霞缓缓睁开眼睛，那些梦中的画面依然清晰如昨——不，那不是梦。那是她一直被压抑的记忆，终于被唤醒了。

十六岁那个夏天。
十七岁那个路口。
每一次心跳加速的瞬间...她都知道是因为谁。

她转头，看向身边的人。眼眶有些湿润，但嘴角却不自觉地上扬。

"我想起来了。"

她的声音很轻，却无比清晰。

"一切都想起来了...原来你一直都在。"

今天是结婚纪念日。但对赵霞来说，这是另一个更重要的日子——
是她终于可以坦白一切的日子。

"`;

  return { userMessage, prefill };
}

/**
 * 生成阶段完成时的过渡提示
 */
export function generatePerfectPhaseTransitionHint(_fromPhase: number, toPhase: number): string {
  const toConfig = PERFECT_ENDING_PHASES[toPhase];
  if (!toConfig) return '';

  return `\n\n---\n【剧情推进】进入${toConfig.name}阶段：${toConfig.title}\n---\n`;
}

/**
 * 生成结局完成时的消息
 */
export function generatePerfectEndingComplete(): string {
  return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【PERFECT TRUE END】命中注定

这不是改写的记忆。
这是一直被压抑的真相。

十六岁那个夏天，她遇见了你。
十七岁那个路口，她等待着你。
二十岁那个夜晚，她渴望逃向你。
二十五岁结婚那天，她的心里只有你。

她从来不需要被改变。
因为她的心，从一开始就属于你。

苏文成全了这段感情。
他站在一旁，看着你们交换誓言。
"希望你能让她幸福。"

赵霞仰起头，泪水从眼角滑落。
那是幸福的泪水。

"我等了你很久。"
"十六岁那个夏天，我就知道..."
"你才是我这辈子要等的人。"

婚礼之吻，落在唇上。
从今以后，她是你的妻子。
永远。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔓 后日谈模式已解锁
✨ 完美真爱结局达成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ============================================
// 自由时间和特殊时段引导
// ============================================

/**
 * 生成自由时间提示（21:00 和 23:00）
 */
export function generatePerfectFreeTimePrompt(hour: number): string {
  const nextHour = hour + 1;
  const nextEvent = hour === 21 ? '婚礼仪式将在22:00继续' : '午夜时分（00:00）将迎来仪式的最终时刻';

  return `【自由时间 - ${hour}:00】

现在是自由活动时间。${nextEvent}。

【完美真爱结局 - 自由时间】
婚礼仪式暂停，让新人有独处的时间。

【场景状态】
- 苏文默默地在一旁
- 赵霞和{{user}}可以单独相处
- 烛光依然摇曳，气氛温馨

【AI任务】
1. 不要强制推进婚礼仪式
2. 赵霞可以和{{user}}轻声说话、回忆往事
3. 保持温馨、浪漫的氛围
4. 如果玩家主动推进，可以顺势进入下一阶段

【提示】
这是属于新人的温馨时刻。
赵霞可能会：
- 依偎在{{user}}身边
- 说起那些记忆中的事
- 表达她的感受

下一个时间点：${nextHour}:00`;
}

/**
 * 根据当前时间获取引导类型
 */
export function getPerfectGuidanceType(data: SchemaType): 'normal' | 'free' | 'ceremony' | null {
  const day = data.世界.当前天数;
  const hour = data.世界.当前小时;

  // Day 6+ 时，结局阶段仍在进行，返回 'ceremony' 类型
  if (day > 5) {
    return 'ceremony';
  }

  if (day !== 5) return null;

  // 11:00-19:00 序幕阶段
  if (hour >= 11 && hour < 20) {
    return 'normal';
  }

  // 20:00 婚礼仪式
  if (hour === 20) {
    return 'ceremony';
  }

  // 21:00 自由时间
  if (hour === 21) {
    return 'free';
  }

  // 22:00 仪式继续
  if (hour === 22) {
    return 'ceremony';
  }

  // 23:00 自由时间
  if (hour === 23) {
    return 'free';
  }

  // 00:00+ 仪式完成
  if (hour === 0 || hour >= 24) {
    return 'ceremony';
  }

  return null;
}
