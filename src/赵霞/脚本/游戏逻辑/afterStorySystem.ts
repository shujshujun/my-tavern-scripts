/**
 * 赵霞游戏 - 后日谈系统
 *
 * 后日谈是游戏结局触发后的"奖励模式"，让玩家体验结局后的日常。
 *
 * 核心设计：
 * - 时长：2轮对话
 * - 触发：结局完成后 +1小时（由结局系统标记后日谈已解锁）
 * - 完成后：解锁自由模式，可无限制继续对话
 *
 * 不同结局的后日谈：
 * - 完美真爱结局：苏文主动成全，成为绿帽癖苦主，打断系统关闭（一周后）
 * - 真好结局：苏文成为植物人，永远无法醒来，打断系统关闭（一个月后）
 * - 假好结局：苏文还在家怀疑中，偷情氛围，打断系统中等强度（三天后）
 * - 坏结局/普通结局：无后日谈
 *
 * 状态栏切换：
 * - 游戏中：显示 "Day X 剩余X天"
 * - 后日谈/自由模式：显示玩家电脑真实日期 {{datetimeformat::YYYY年M月D日}}
 */

import type { Schema as SchemaType } from '../../schema';

// ============================================
// 后日谈类型定义
// ============================================

export type AfterStoryType = '完美真爱' | '真好结局' | '假好结局' | null;

export interface AfterStoryState {
  已触发: boolean;
  当前轮数: number;
  已完成: boolean;
  自由模式: boolean;
}

// ============================================
// 后日谈内容配置
// ============================================

/**
 * 完美真爱结局后日谈配置
 * 苏文知道一切，选择接受，发展出绿帽癖好
 */
const PERFECT_TRUE_AFTER_STORY = {
  type: '完美真爱' as const,
  husbandStatus: '主动成全，成为苦主',
  interruptionLevel: 0, // 关闭打断

  // 第1轮场景
  round1: {
    title: '一周后的清晨',
    setting: `【一周后】

清晨的阳光透过窗帘洒进房间。
赵霞靠在{{user}}的肩上，脸上带着满足的笑容。
苏文站在门口，手里端着早餐托盘，表情复杂但平静。
这已经是婚礼后的第七天了——新的"家庭规则"逐渐成型。`,
    aiGuidance: `【完美真爱结局后日谈 - 第1轮】

【时间】一周后

苏文的设定：
- 他已经知道妻子和儿子的关系
- 他选择了接受，甚至发展出了特殊癖好
- 他愿意在旁边服务，表现出服从
- 他可能会说一些自我贬低的话

赵霞的状态：
- 完全沦陷，对{{user}}有绝对的依赖和爱
- 在苏文面前也不再掩饰
- 可能会当着苏文的面和{{user}}亲密

【AI任务】
1. 描写一周后的清晨，新秩序已经建立
2. 苏文送来早餐，态度恭敬
3. 赵霞对苏文的态度冷淡但不残忍
4. 体现三人关系的新平衡
5. 这是一个扭曲但"幸福"的家庭`,
  },

  // 第2轮场景
  round2: {
    title: '苏文与录像',
    setting: `晚上，{{user}}路过客厅，发现苏文独自坐在沙发上。
电视屏幕上播放着什么...
定睛一看——是婚礼的录像。`,
    aiGuidance: `【完美真爱结局后日谈 - 第2轮（最终轮）】

苏文的设定：
- 他在独自观看婚礼录像
- 录像中赵霞穿着婚纱走向{{user}}
- 他的表情难以捉摸，但隐约带着某种...满足？
- 被发现时会慌张，但也可能邀请{{user}}一起看

赵霞可能的反应：
- 如果赵霞出现，她可能会靠在{{user}}身上一起看
- 或者嘲笑苏文"又在看这个"

【AI任务】
1. 描写苏文独自看录像的场景
2. {{user}}发现他时的反应
3. 暗示苏文对这种关系的"接受"甚至"享受"
4. 可以有三人一起看录像的发展
5. 结束时体现这个家庭的"新常态"

【结束标记】
这是后日谈的最后一轮。
描写完成后，游戏将进入自由模式。`,
  },
};

/**
 * 真好结局后日谈配置
 * 苏文因头孢+酒反应成为植物人，永远无法醒来
 */
const TRUE_ENDING_AFTER_STORY = {
  type: '真好结局' as const,
  husbandStatus: '植物人（永久昏迷）',
  interruptionLevel: 0, // 关闭打断

  round1: {
    title: '一个月后',
    setting: `【一个月后】

家里很安静，但和一个月前不同——这种安静现在是永恒的。
苏文躺在医院的特护病房里，已经整整一个月了。
医生说是"严重的双硫仑样反应"——头孢配酒，导致大脑缺氧。
他成了植物人，可能永远都不会醒来了。

赵霞偶尔去医院看一眼，签个字，就回家了。
保险和苏文单位的工伤赔偿加起来，足够支付医疗费用。
而她现在，只想和{{user}}在一起。`,
    aiGuidance: `【真好结局后日谈 - 第1轮】

【时间】一个月后

苏文的状态：
- 在医院ICU，因"意外"服用头孢后饮酒导致脑缺氧
- 成为植物人，医生说可能永远无法醒来
- 需要长期护理，但保险和工伤赔偿覆盖了费用

赵霞的状态：
- 完全沦陷于{{user}}
- 对苏文变成植物人这件事...释然了
- "命运选择了让我们在一起"
- 享受没有丈夫打扰的生活
- 偶尔去医院走个过场

【AI任务】
1. 描写一个月后的家中氛围——安静但温馨
2. 赵霞对苏文状态的淡然态度
3. 两人独处的亲密感，没有任何顾虑
4. 赵霞可能会说"他永远不会回来了"
5. 一种扭曲但"圆满"的幸福感`,
  },

  round2: {
    title: '医院探视',
    setting: `赵霞例行去医院探视苏文。
她让{{user}}陪她一起去——反正苏文也听不见了。
走进特护病房，苏文静静地躺在那里，身上插满了管子。`,
    aiGuidance: `【真好结局后日谈 - 第2轮（最终轮）】

【时间】一个月后

场景设定：
- 赵霞带着{{user}}一起来医院
- 苏文躺在病床上，毫无反应，只有仪器的滴滴声
- 病房里很安静

赵霞的状态：
- 在植物人丈夫面前，牵着{{user}}的手
- 可能会对着苏文说话，但语气冷淡
- "他听不见的"
- 可能会当着苏文的面和{{user}}亲密

【AI任务】
1. 描写医院探视的场景，苏文毫无反应的状态
2. 赵霞带着{{user}}一起来，不再有任何顾虑
3. 赵霞可能会对苏文说"我很幸福"
4. 两人在病房里的亲密举动
5. 暗示这种生活会一直持续下去——苏文永远不会醒来

【结束标记】
这是后日谈的最后一轮。
描写完成后，游戏将进入自由模式。`,
  },
};

/**
 * 假好结局后日谈配置
 * 苏文还在家，怀疑中，打断系统继续运作
 */
const FALSE_ENDING_AFTER_STORY = {
  type: '假好结局' as const,
  husbandStatus: '在家，怀疑中',
  interruptionLevel: 50, // 中等强度打断

  round1: {
    title: '三天后的早晨',
    setting: `【三天后】

苏文刚刚出门上班，但他临走前看了{{user}}好几眼。
那眼神让人不太舒服。
自从那晚的视频通话事件后，他的态度变得很微妙。
赵霞坐在沙发上，神色有些紧张。`,
    aiGuidance: `【假好结局后日谈 - 第1轮】

【时间】三天后

苏文的状态：
- 正常在家/上班
- 对妻子和儿子的关系有所怀疑但不确定
- 会时不时"恰好"出现
- 眼神中偶尔闪过怀疑

赵霞的状态：
- 对{{user}}有好感和依赖，但没有完全沦陷
- 还会顾虑丈夫的存在
- 亲密行为时会紧张、担心被发现
- 有时会犹豫、退缩

【AI任务】
1. 描写三天后的日常，苏文离开后的紧张氛围
2. 赵霞表达对苏文"奇怪行为"的担忧
3. 两人独处但随时可能被打断的刺激感
4. 赵霞在犹豫和渴望之间摇摆
5. 这种关系还远没有到安全的地步

【打断系统】
苏文可能随时：
- 突然回家拿东西
- 打电话确认位置
- 提前下班回来`,
  },

  round2: {
    title: '突然的回家',
    setting: `正当两人独处时，门锁响了。
苏文的声音从门口传来："我忘带文件了..."
赵霞瞬间紧张起来。`,
    aiGuidance: `【假好结局后日谈 - 第2轮（最终轮）】

紧张场景：
- 苏文突然回家
- 赵霞和{{user}}需要快速整理状态
- 苏文的眼神审视着两人

赵霞的反应：
- 快速调整表情和状态
- 找借口解释刚才的情况
- 心跳加速，害怕被发现
- 但也有一丝被发现的刺激感

苏文的行为：
- 拿文件只是借口？
- 他似乎在观察什么
- 离开时说了一句意味深长的话

【AI任务】
1. 描写突然被打断的紧张感
2. 赵霞的慌张和掩饰
3. 苏文的怀疑目光
4. 险些被发现的惊险
5. 苏文离开后两人相视而笑——刺激但危险

【结束标记】
这是后日谈的最后一轮。
描写完成后，游戏将进入自由模式。
假好结局的自由模式中，打断系统会持续运作。`,
  },
};

// ============================================
// 状态检测函数
// ============================================

/**
 * 获取当前结局对应的后日谈类型
 */
export function getAfterStoryType(data: SchemaType): AfterStoryType {
  const ending = data.结局数据.当前结局;

  switch (ending) {
    case '完美真爱结局':
      return '完美真爱';
    case '真好结局':
      return '真好结局';
    case '假好结局':
      return '假好结局';
    default:
      return null;
  }
}

/**
 * 检测是否应该触发后日谈
 * 条件：结局已完成 + 后日谈已解锁 + 后日谈未触发
 */
export function shouldTriggerAfterStory(data: SchemaType): boolean {
  // 必须有好结局
  const type = getAfterStoryType(data);
  if (!type) return false;

  // 后日谈已解锁
  if (!data.结局数据.后日谈已解锁) return false;

  // 后日谈未触发
  if (data.结局数据.后日谈?.已触发) return false;

  return true;
}

/**
 * 检测是否在后日谈进行中
 */
export function isInAfterStory(data: SchemaType): boolean {
  return data.结局数据.后日谈?.已触发 === true && data.结局数据.后日谈?.已完成 !== true;
}

/**
 * 检测是否在自由模式
 */
export function isInFreeMode(data: SchemaType): boolean {
  return data.结局数据.后日谈?.自由模式 === true;
}

/**
 * 检测是否应该显示真实日期（后日谈或自由模式）
 */
export function shouldShowRealDate(data: SchemaType): boolean {
  const ending = data.结局数据.当前结局;
  // 任何非"未触发"的好结局都显示真实日期
  return ending === '完美真爱结局' || ending === '真好结局' || ending === '假好结局';
}

/**
 * 获取当前后日谈打断强度
 * 0 = 关闭，50 = 中等，100 = 高
 */
export function getAfterStoryInterruptionLevel(data: SchemaType): number {
  const type = getAfterStoryType(data);

  // 自由模式保持结局时的打断强度
  if (isInFreeMode(data) || isInAfterStory(data)) {
    switch (type) {
      case '完美真爱':
        return PERFECT_TRUE_AFTER_STORY.interruptionLevel;
      case '真好结局':
        return TRUE_ENDING_AFTER_STORY.interruptionLevel;
      case '假好结局':
        return FALSE_ENDING_AFTER_STORY.interruptionLevel;
      default:
        return 0;
    }
  }

  return 0;
}

// ============================================
// 后日谈状态管理
// ============================================

/**
 * 触发后日谈开始
 */
export function activateAfterStory(data: SchemaType): void {
  if (!data.结局数据.后日谈) {
    (data.结局数据 as any).后日谈 = {
      已触发: false,
      当前轮数: 0,
      已完成: false,
      自由模式: false,
    };
  }

  data.结局数据.后日谈.已触发 = true;
  data.结局数据.后日谈.当前轮数 = 1;

  console.info('[后日谈系统] 后日谈已激活');
}

/**
 * 推进后日谈轮数
 */
export function advanceAfterStoryRound(data: SchemaType): void {
  if (!data.结局数据.后日谈) return;

  const currentRound = data.结局数据.后日谈.当前轮数;

  if (currentRound >= 2) {
    // 完成后日谈，进入自由模式
    data.结局数据.后日谈.已完成 = true;
    data.结局数据.后日谈.自由模式 = true;
    console.info('[后日谈系统] 后日谈完成，进入自由模式');
  } else {
    data.结局数据.后日谈.当前轮数 = currentRound + 1;
    console.info(`[后日谈系统] 推进到第${currentRound + 1}轮`);
  }
}

// ============================================
// AI Prompt 生成
// ============================================

/**
 * 获取后日谈配置
 */
function getAfterStoryConfig(type: AfterStoryType) {
  switch (type) {
    case '完美真爱':
      return PERFECT_TRUE_AFTER_STORY;
    case '真好结局':
      return TRUE_ENDING_AFTER_STORY;
    case '假好结局':
      return FALSE_ENDING_AFTER_STORY;
    default:
      return null;
  }
}

/**
 * 生成后日谈入口替换消息
 */
export function generateAfterStoryEntryReplacement(data: SchemaType): {
  userMessage: string;
  prefill: string;
} | null {
  const type = getAfterStoryType(data);
  if (!type) return null;

  const config = getAfterStoryConfig(type);
  if (!config) return null;

  const round1 = config.round1;

  const userMessage = `[系统指令 - 后日谈开始]

【${type}后日谈 - 第1轮：${round1.title}】

${round1.setting}

${round1.aiGuidance}

【重要提示】
- 这是后日谈的第1轮（共2轮）
- 苏文状态：${config.husbandStatus}
- 打断系统：${config.interruptionLevel === 0 ? '已关闭' : '中等强度'}
- 状态栏将显示玩家电脑的真实日期`;

  const prefill = round1.setting.split('\n')[0];

  return { userMessage, prefill };
}

/**
 * 生成后日谈当前轮次的AI引导
 */
export function generateAfterStoryPrompt(data: SchemaType): string | null {
  const type = getAfterStoryType(data);
  if (!type) return null;

  const config = getAfterStoryConfig(type);
  if (!config) return null;

  const currentRound = data.结局数据.后日谈?.当前轮数 ?? 1;
  const roundConfig = currentRound === 1 ? config.round1 : config.round2;

  return `【${type}后日谈 - 第${currentRound}轮：${roundConfig.title}】

${roundConfig.setting}

${roundConfig.aiGuidance}

【进度】
- 当前：第${currentRound}轮 / 共2轮
- 苏文状态：${config.husbandStatus}
- 打断系统：${config.interruptionLevel === 0 ? '已关闭' : '中等强度'}`;
}

/**
 * 自由模式详细设定（根据结局类型）
 */
const FREE_MODE_SETTINGS = {
  完美真爱: {
    timeFrame: '婚礼后数周/数月',
    relationship: '赵霞和{{user}}公开同居，苏文自愿成为家庭中的"服务者"',
    zhaoXiaState: `- 完全沦陷，发自内心的爱（不是被洗脑）
- 在苏文面前也不再掩饰，公开与{{user}}亲密
- 眼神清澈、情感真挚，这是她等待多年的归属
- 偶尔会对苏文表现出轻蔑，但不会刻意羞辱`,
    husbandState: `- 苏文已完全接受自己的角色，成为家庭中的"苦主"
- 他会主动端茶倒水、准备早餐
- 有时会偷偷看婚礼录像，表情复杂但带着满足
- 不会主动打扰两人，但可能被叫去"服务"`,
    suggestedScenes: ['三人家庭日常', '苏文服侍场景', '外出约会（苏文在家等待）', '婚房亲密', '当面羞辱苏文'],
    tone: '扭曲但稳定的"幸福"家庭',
  },
  真好结局: {
    timeFrame: '苏文出事后数月',
    relationship: '赵霞和{{user}}以母子名义同住，实际是恋人关系',
    zhaoXiaState: `- 被改造后的依赖和服从，说不清为什么爱{{user}}
- 记忆被重构，有些割裂和迷茫
- 对苏文变成植物人这件事...释然了，甚至庆幸
- 享受没有丈夫打扰的二人世界`,
    husbandState: `- 苏文在医院ICU，因"意外"成为植物人
- 医生说可能永远无法醒来
- 保险和工伤赔偿覆盖了医疗费用
- 赵霞偶尔去医院走个过场，签字后就回家`,
    suggestedScenes: ['二人日常生活', '医院探视（可选）', '外出伪装母子', '家庭亲密', '在苏文病床前说"我很幸福"'],
    tone: '建立在罪恶上的甜蜜日常',
  },
  假好结局: {
    timeFrame: '结婚纪念日后数天/数周',
    relationship: '偷情关系，苏文仍在怀疑但没有证据',
    zhaoXiaState: `- 没有被完全重构，知道这是禁忌但停不下来
- 边享受边哭泣，边说"不行"边索取
- 活在矛盾和罪恶感中，但无法抗拒{{user}}
- 害怕被发现，但这种刺激感让一切更加诱人`,
    husbandState: `- 苏文还在家，对妻子和儿子的关系有所怀疑
- 会时不时"恰好"出现，眼神中带着审视
- 可能突然回家拿东西、打电话确认位置
- 打断系统持续运作，随时可能被发现`,
    suggestedScenes: [
      '趁苏文上班偷情',
      '差点被发现的惊险',
      '视频通话时的羞辱',
      '苏文在隔壁时的紧张感',
      '背德感中的沉沦',
    ],
    tone: '刺激但危险，随时可能崩盘',
  },
};

/**
 * 生成自由模式AI引导
 */
export function generateFreeModePrompt(data: SchemaType): string | null {
  const type = getAfterStoryType(data);
  if (!type) return null;

  const config = getAfterStoryConfig(type);
  if (!config) return null;

  const settings = FREE_MODE_SETTINGS[type];
  if (!settings) return null;

  return `【${type === '完美真爱' ? '完美真爱结局' : type} - 自由模式】

后日谈已完成，现在是自由模式。
玩家可以自由与赵霞互动，没有时间限制和结局判定。

【时间线】
${settings.timeFrame}

【关系现状】
${settings.relationship}

【赵霞状态】
${settings.zhaoXiaState}

【苏文状态】
${settings.husbandState}
打断系统：${config.interruptionLevel === 0 ? '已关闭' : '中等强度（随时可能被发现）'}

【历史回顾】
请回顾聊天记录中的互动内容（Day 1-5 的日常 + 梦境 + 结局剧情 + 后日谈）。
赵霞的表现应当延续之前积累的关系变化和情感记忆。
梦境中的记忆（参考变量列表「梦境数据.场景X.剧情摘要」）已成为她灵魂的一部分。

【可探索场景建议】
${settings.suggestedScenes.map(s => `- ${s}`).join('\n')}

【整体氛围】
${settings.tone}

【AI任务】
- 回应玩家的任何互动请求
- 保持角色设定的一致性（赵霞、苏文、{{user}}的关系）
- 可以描写日常生活、亲密互动、外出、特殊场景等
- 这是玩家的奖励时间，在角色设定范围内满足他们的幻想
- 状态栏显示真实日期，象征赵霞"逃出了时间循环"`;
}

/**
 * 生成后日谈完成消息
 */
export function generateAfterStoryComplete(data: SchemaType): string {
  const type = getAfterStoryType(data);

  const typeTitle = type === '完美真爱' ? '完美真爱结局' : type === '真好结局' ? '真好结局' : '假好结局';

  return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【后日谈完成】

${typeTitle}的后日谈已结束。

从现在开始，你可以自由地与赵霞互动。
没有时间限制，没有结局判定。
这个世界，只属于你们。

${
  type === '完美真爱'
    ? '苏文已经接受了一切，成为了这个家庭的"苦主"。'
    : type === '真好结局'
      ? '苏文还在医院，这里是你们的二人世界。'
      : '苏文还在怀疑，但这份刺激让一切更加诱人。'
}

🔓 自由模式已解锁

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * 生成状态栏日期显示
 * 后日谈/自由模式使用酒馆宏显示真实日期
 */
export function generateDateDisplay(data: SchemaType): string {
  if (shouldShowRealDate(data)) {
    // 使用酒馆内置宏显示真实日期
    return '{{datetimeformat::YYYY年M月D日}}';
  } else {
    // 游戏中显示游戏日期
    const day = data.世界.当前天数;
    const remaining = Math.max(0, 5 - day);
    return `Day ${day} 剩余${remaining}天`;
  }
}
