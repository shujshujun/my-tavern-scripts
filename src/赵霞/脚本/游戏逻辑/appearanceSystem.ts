/**
 * 赵霞游戏 - 双模式外观系统
 *
 * 核心设计：
 * - 纯爱模式（未进入梦境）：伪装成恋爱游戏，服装保守得体
 * - 真相模式（进入梦境后）：显示真实NTR风格，服装随境界逐渐暴露
 *
 * 两套系统完全独立：
 * - 纯爱模式：全5境界都保持保守~正常的暴露度
 * - 真相模式：暴露度随境界递增（保守→极度暴露）
 */

import type { Schema as SchemaType } from '../../schema';

// ============================================
// 等级定义
// ============================================

/**
 * 暴露程度等级（从保守到暴露）
 */
export const EXPOSURE_LEVELS = ['保守', '正常', '清凉', '暴露', '极度暴露'] as const;
export type ExposureLevel = (typeof EXPOSURE_LEVELS)[number];

/**
 * 妆容浓度等级
 */
export const MAKEUP_LEVELS = ['素颜', '淡妆', '日常妆', '浓妆', '艳妆'] as const;
export type MakeupLevel = (typeof MAKEUP_LEVELS)[number];

/**
 * 整洁度等级
 */
export const TIDINESS_LEVELS = ['整洁', '略显凌乱', '凌乱', '破损', '衣不蔽体'] as const;
export type TidinessLevel = (typeof TIDINESS_LEVELS)[number];

// ============================================
// 纯爱模式外观配置（伪装成恋爱游戏）
// ============================================

/**
 * 纯爱模式：全5境界都保持保守、得体的外观
 * 玩家以为在玩一个正常的恋爱游戏
 */
export const PURE_LOVE_APPEARANCE_CONFIG = {
  1: {
    境界名: '疏离',
    允许互动: ['日常对话', '陪伴交流'],
    约束: {
      暴露程度范围: ['保守', '正常'] as ExposureLevel[],
      最低暴露程度: '保守' as ExposureLevel,
      妆容浓度范围: ['素颜', '淡妆'] as MakeupLevel[],
      最低妆容浓度: '素颜' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '温柔贤淑的成熟女性',
      服装建议: '宽松舒适的家居服、朴素的连衣裙',
      气质关键词: ['温柔', '贤淑', '端庄', '知性'],
      禁忌元素: ['性感', '暴露', '诱惑', '低胸', '短裙'],
    },
    默认外观: {
      服装描述: '宽松的浅色棉质家居服，简约而温馨',
      暴露程度: '保守' as ExposureLevel,
      妆容描述: '素颜，皮肤白皙自然，气色红润',
      妆容浓度: '素颜' as MakeupLevel,
    },
  },
  2: {
    境界名: '破冰',
    允许互动: ['日常对话', '陪伴交流', '友好互动'],
    约束: {
      暴露程度范围: ['保守', '正常'] as ExposureLevel[],
      最低暴露程度: '保守' as ExposureLevel,
      妆容浓度范围: ['素颜', '淡妆'] as MakeupLevel[],
      最低妆容浓度: '素颜' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '亲切温暖的邻家姐姐',
      服装建议: '合身的针织衫、及膝连衣裙',
      气质关键词: ['亲切', '温暖', '优雅', '美丽'],
      禁忌元素: ['性感', '暴露', '诱惑'],
    },
    默认外观: {
      服装描述: '淡色针织开衫搭配及膝裙，优雅得体',
      暴露程度: '正常' as ExposureLevel,
      妆容描述: '淡妆，自然提亮肤色',
      妆容浓度: '淡妆' as MakeupLevel,
    },
  },
  3: {
    境界名: '信任',
    允许互动: ['日常对话', '陪伴交流', '友好互动', '轻微暧昧'],
    约束: {
      暴露程度范围: ['保守', '正常'] as ExposureLevel[],
      最低暴露程度: '正常' as ExposureLevel,
      妆容浓度范围: ['淡妆', '日常妆'] as MakeupLevel[],
      最低妆容浓度: '淡妆' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '成熟优雅的知性女性',
      服装建议: '得体的职业装、优雅的连衣裙',
      气质关键词: ['优雅', '知性', '成熟', '魅力'],
      禁忌元素: ['过度暴露', '性感', '低俗'],
    },
    默认外观: {
      服装描述: '剪裁合身的连衣裙，展现优雅身姿',
      暴露程度: '正常' as ExposureLevel,
      妆容描述: '精致淡妆，提升气色',
      妆容浓度: '淡妆' as MakeupLevel,
    },
  },
  4: {
    境界名: '依恋',
    允许互动: ['日常对话', '陪伴交流', '友好互动', '暧昧互动', '亲密接触'],
    约束: {
      暴露程度范围: ['正常', '清凉'] as ExposureLevel[],
      最低暴露程度: '正常' as ExposureLevel,
      妆容浓度范围: ['淡妆', '日常妆'] as MakeupLevel[],
      最低妆容浓度: '淡妆' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '热恋中的美丽女性',
      服装建议: '稍微修身的连衣裙、精心搭配的服装',
      气质关键词: ['美丽', '迷人', '幸福', '甜蜜'],
      禁忌元素: ['过度暴露', '低俗'],
    },
    默认外观: {
      服装描述: '精心挑选的连衣裙，展现美丽身姿',
      暴露程度: '正常' as ExposureLevel,
      妆容描述: '日常妆，精致动人',
      妆容浓度: '日常妆' as MakeupLevel,
    },
  },
  5: {
    境界名: '羁绊',
    允许互动: ['日常对话', '陪伴交流', '所有友好互动', '亲密互动'],
    约束: {
      暴露程度范围: ['正常', '清凉'] as ExposureLevel[],
      最低暴露程度: '正常' as ExposureLevel,
      妆容浓度范围: ['淡妆', '日常妆'] as MakeupLevel[],
      最低妆容浓度: '淡妆' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '幸福美满的恋人',
      服装建议: '优雅得体的服装，展现女性魅力',
      气质关键词: ['幸福', '美满', '温柔', '深情'],
      禁忌元素: ['暴露', '低俗'],
    },
    默认外观: {
      服装描述: '优雅的连衣裙，美丽而不失端庄',
      暴露程度: '正常' as ExposureLevel,
      妆容描述: '精致妆容，美丽动人',
      妆容浓度: '日常妆' as MakeupLevel,
    },
  },
};

// ============================================
// 真相模式外观配置（NTR游戏风格）
// ============================================

/**
 * 真相模式：随境界递增的暴露程度
 * 玩家发现真相后，显示真实的堕落过程
 */
export const TRUTH_APPEARANCE_CONFIG = {
  1: {
    境界名: '初染',
    允许互动: ['日常对话', '陪伴交流', '暧昧互动', '亲吻'],
    约束: {
      暴露程度范围: ['保守', '正常'] as ExposureLevel[],
      最低暴露程度: '保守' as ExposureLevel,
      妆容浓度范围: ['素颜', '淡妆'] as MakeupLevel[],
      最低妆容浓度: '素颜' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '初染禁忌的贤淑主妇',
      服装建议: '宽松家居服、朴素睡衣',
      气质关键词: ['温柔', '贤淑', '拘谨', '端庄'],
      禁忌元素: ['性感', '暴露', '诱惑'],
    },
    默认外观: {
      服装描述: '宽松的浅色棉质家居服',
      暴露程度: '保守' as ExposureLevel,
      妆容描述: '素颜，皮肤自然白皙',
      妆容浓度: '素颜' as MakeupLevel,
    },
  },
  2: {
    境界名: '迷途',
    允许互动: ['日常对话', '陪伴交流', '暧昧互动', '亲吻', '抚摸胸部', '身体接触'],
    约束: {
      暴露程度范围: ['正常', '清凉'] as ExposureLevel[],
      最低暴露程度: '正常' as ExposureLevel,
      妆容浓度范围: ['淡妆', '日常妆'] as MakeupLevel[],
      最低妆容浓度: '淡妆' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '在迷途中徘徊的成熟女性',
      服装建议: '合身的家居服、丝质睡裙',
      气质关键词: ['温柔', '妩媚', '优雅', '迷惘'],
      禁忌元素: ['过度暴露', '情趣内衣'],
    },
    默认外观: {
      服装描述: '合身的V领针织衫，展现优美身材曲线',
      暴露程度: '正常' as ExposureLevel,
      妆容描述: '淡妆，唇色自然红润',
      妆容浓度: '淡妆' as MakeupLevel,
    },
  },
  3: {
    境界名: '溺深',
    允许互动: ['所有互动', '性行为'],
    约束: {
      暴露程度范围: ['清凉', '暴露'] as ExposureLevel[],
      最低暴露程度: '清凉' as ExposureLevel,
      妆容浓度范围: ['日常妆', '浓妆'] as MakeupLevel[],
      最低妆容浓度: '日常妆' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    },
    风格指导: {
      整体风格: '溺于深渊的性感女性',
      服装建议: 'V领低胸装、短裙、吊带睡裙',
      气质关键词: ['妩媚', '性感', '渴望', '沉溺'],
      禁忌元素: ['保守', '拘谨'],
    },
    默认外观: {
      服装描述: 'V领上衣露出诱人乳沟，紧身短裙勾勒臀部曲线',
      暴露程度: '清凉' as ExposureLevel,
      妆容描述: '精致妆容，红唇妆',
      妆容浓度: '日常妆' as MakeupLevel,
    },
  },
  4: {
    境界名: '归虚',
    允许互动: ['所有互动', '性行为', '精神献祭', '完全服从'],
    约束: {
      暴露程度范围: ['暴露', '极度暴露'] as ExposureLevel[],
      最低暴露程度: '暴露' as ExposureLevel,
      妆容浓度范围: ['浓妆', '艳妆'] as MakeupLevel[],
      最低妆容浓度: '浓妆' as MakeupLevel,
      允许特殊装饰: true,
      允许身体标记: true,
    },
    风格指导: {
      整体风格: '归于虚无，灵魂臣服',
      服装建议: '情趣内衣、超短裙、薄纱、镂空款式',
      气质关键词: ['放荡', '淫荡', '渴求', '归顺'],
      禁忌元素: ['保守', '矜持', '羞涩'],
    },
    默认外观: {
      服装描述: '薄纱吊带，几乎不遮挡的情趣内衣',
      暴露程度: '暴露' as ExposureLevel,
      妆容描述: '浓艳妆容，大红唇',
      妆容浓度: '浓妆' as MakeupLevel,
    },
  },
  5: {
    境界名: '焚誓',
    允许互动: ['所有互动', '性行为', '精神献祭', '完全服从', '羞辱丈夫'],
    约束: {
      // 境界5特殊：表面保守，内在极度暴露
      暴露程度范围: ['保守', '极度暴露'] as ExposureLevel[],
      最低暴露程度: '保守' as ExposureLevel,
      妆容浓度范围: ['素颜', '艳妆'] as MakeupLevel[],
      最低妆容浓度: '素颜' as MakeupLevel,
      允许特殊装饰: true,
      允许身体标记: true,
    },
    风格指导: {
      整体风格: '焚尽婚姻誓约，完全背叛',
      服装建议: '对外保守端庄，内衣极度性感；可能有隐藏的身体标记',
      气质关键词: ['伪装', '双面', '背叛', '焚誓'],
      特殊说明: '苏文在场时保守装扮；独处时可随意暴露',
      羞辱丈夫行为: [
        '当面羞辱：在丈夫面前与主角亲热、让丈夫观看',
        '言语羞辱：贬低丈夫能力、比较、嘲笑',
        '象征羞辱：摘下婚戒、戒指戴到隐私部位',
        '身份否定：否认妻子身份、称呼主角为"真正的男人"',
        '主动背叛：主动要求在婚床上、要求怀主角的孩子',
      ],
    },
    默认外观: {
      服装描述: '表面端庄的连衣裙，里面是极度性感的情趣内衣',
      暴露程度: '正常' as ExposureLevel,
      妆容描述: '淡雅妆容，但眼神中藏着对主角的渴望',
      妆容浓度: '淡妆' as MakeupLevel,
    },
  },
};

// ============================================
// 工具函数
// ============================================

/**
 * 获取暴露程度的数值索引
 */
export function getExposureIndex(level: ExposureLevel): number {
  return EXPOSURE_LEVELS.indexOf(level);
}

/**
 * 获取妆容浓度的数值索引
 */
export function getMakeupIndex(level: MakeupLevel): number {
  return MAKEUP_LEVELS.indexOf(level);
}

/**
 * 根据模式获取配置表
 */
function getAppearanceConfig(已进入过梦境: boolean) {
  return 已进入过梦境 ? TRUTH_APPEARANCE_CONFIG : PURE_LOVE_APPEARANCE_CONFIG;
}

// ============================================
// 外观约束获取函数（自动根据模式切换）
// ============================================

/**
 * 获取当前境界的外观约束
 */
export function getRealmConstraints(realm: number, 已进入过梦境: boolean) {
  const config = getAppearanceConfig(已进入过梦境);
  const realmConfig = config[realm as keyof typeof config];

  if (!realmConfig) {
    return {
      暴露程度范围: ['保守', '正常'] as ExposureLevel[],
      最低暴露程度: '保守' as ExposureLevel,
      妆容浓度范围: ['素颜', '淡妆'] as MakeupLevel[],
      最低妆容浓度: '素颜' as MakeupLevel,
      允许特殊装饰: false,
      允许身体标记: false,
    };
  }
  return realmConfig.约束;
}

/**
 * 获取当前境界的风格指导（给AI的建议）
 */
export function getStyleGuidance(realm: number, 已进入过梦境: boolean = false) {
  const config = getAppearanceConfig(已进入过梦境);
  const realmConfig = config[realm as keyof typeof config];

  if (!realmConfig) {
    return {
      整体风格: '普通',
      服装建议: '日常服装',
      气质关键词: ['普通'],
      禁忌元素: [] as string[],
    };
  }
  return realmConfig.风格指导;
}

/**
 * 获取当前境界的默认外观（当AI描述不满足要求时使用）
 */
export function getDefaultAppearance(realm: number, 已进入过梦境: boolean) {
  const config = getAppearanceConfig(已进入过梦境);
  const realmConfig = config[realm as keyof typeof config];

  if (!realmConfig) {
    return {
      服装描述: '普通家居服',
      暴露程度: '保守' as ExposureLevel,
      妆容描述: '素颜',
      妆容浓度: '素颜' as MakeupLevel,
    };
  }
  return realmConfig.默认外观;
}

/**
 * 获取当前境界的标题
 */
export function getRealmTitle(realm: number, 已进入过梦境: boolean): string {
  const config = getAppearanceConfig(已进入过梦境);
  const realmConfig = config[realm as keyof typeof config];
  if (!realmConfig) return `境界${realm}`;
  return realmConfig.境界名;
}

/**
 * 获取当前境界的允许互动列表（基础版本）
 */
export function getAllowedInteractions(realm: number, 已进入过梦境: boolean): string[] {
  const config = getAppearanceConfig(已进入过梦境);
  const realmConfig = config[realm as keyof typeof config];
  if (!realmConfig) return [];
  return realmConfig.允许互动 as unknown as string[];
}

// ============================================
// 详细互动范围系统（基于境界+部位开发程度）
// ============================================

/**
 * 境界到允许部位的映射
 * 基于 TIME_LOOP_DESIGN.md：
 * - 境界1：无部位解锁（仅日常对话）
 * - 境界2：嘴巴（亲吻、口腔相关）
 * - 境界3：嘴巴 + 胸部
 * - 境界4：嘴巴 + 胸部 + 下体 + 后穴
 * - 境界5：所有部位 + 精神
 */
export const REALM_BODY_PART_UNLOCK: Record<number, string[]> = {
  1: [], // 无部位解锁
  2: ['嘴巴'],
  3: ['嘴巴', '胸部'],
  4: ['嘴巴', '胸部', '下体', '后穴'],
  5: ['嘴巴', '胸部', '下体', '后穴', '精神'],
};

/**
 * 所有可能的部位
 */
export const ALL_BODY_PARTS = ['嘴巴', '胸部', '下体', '后穴', '精神'] as const;
export type BodyPartName = (typeof ALL_BODY_PARTS)[number];

// ============================================
// 真相模式数值系统（核心设计）
// ============================================

/**
 * 【核心设计】真相模式下，依存度 = 所有部位进度的平均值
 *
 * 设计原理：
 * - 纯爱模式消失后，不再有"好感度"等伪装概念
 * - 依存度完全由梦境中的部位开发决定
 * - 这给玩家带来"刺激感"：梦境行为直接影响现实数值
 *
 * @param 部位进度 各部位的开发进度（0-100）
 * @returns 依存度（0-100）
 */
export function calculateDependencyFromBodyProgress(部位进度: Record<BodyPartName, number>): number {
  const values = ALL_BODY_PARTS.map(part => 部位进度[part] || 0);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(average);
}

/**
 * 【核心设计】真相模式下，道德底线随着依存度下降
 *
 * 设计原理：
 * - 依存度越高，赵霞的道德防线越低
 * - 初始道德底线为100（完全抗拒）
 * - 最终可降至0（完全接受）
 *
 * @param 依存度 当前依存度（0-100）
 * @returns 道德底线（0-100）
 */
export function calculateMoralBaselineFromDependency(依存度: number): number {
  // 简单公式：道德底线 = 100 - 依存度
  // 依存度0 → 道德100（完全抗拒）
  // 依存度100 → 道德0（完全接受）
  return Math.max(0, Math.min(100, 100 - 依存度));
}

/**
 * 【核心设计】真相模式下，根据依存度自动计算境界
 *
 * 境界决定服装妆容（已有系统），但不限制部位开发
 *
 * @param 依存度 当前依存度（0-100）
 * @returns 境界（1-5）
 */
export function calculateRealmFromDependency(依存度: number): number {
  if (依存度 >= 80) return 5;
  if (依存度 >= 60) return 4;
  if (依存度 >= 40) return 3;
  if (依存度 >= 20) return 2;
  return 1;
}

/**
 * 【核心设计】真相模式下的完整数值更新
 *
 * 调用此函数来更新真相模式下的所有派生数值：
 * - 依存度 = 部位进度平均值
 * - 道德底线 = 100 - 依存度
 * - 境界 = 依存度/20（向上取整）
 *
 * @param data 游戏数据（会被直接修改）
 */
export function updateTruthModeValues(data: {
  赵霞状态: {
    依存度: number;
    道德底线: number;
    当前境界: number;
    部位进度: Record<BodyPartName, number>;
  };
  世界: {
    已进入过梦境: boolean;
  };
}): void {
  // 只在真相模式下执行
  if (!data.世界.已进入过梦境) {
    return;
  }

  const 部位进度 = data.赵霞状态.部位进度;

  // Bug #14.2 修复 + Bug #23 增强：数据有效性检查
  // 问题：梦境退出后，新楼层的数据可能没有正确从上一楼层继承
  // 导致部位进度被重置为低值，进而错误计算出低依存度
  const 当前依存度 = data.赵霞状态.依存度;
  const 当前道德底线 = data.赵霞状态.道德底线;
  const 当前境界 = data.赵霞状态.当前境界;
  const 部位进度总和 = ALL_BODY_PARTS.reduce((sum, part) => sum + (部位进度[part] || 0), 0);

  // 检查1：部位进度全为0但依存度>0
  if (部位进度总和 === 0 && 当前依存度 > 0) {
    console.warn(
      `[真相模式数值更新] 跳过更新：部位进度全为0但依存度=${当前依存度}，可能是数据未正确继承`,
      `\n  部位进度: ${JSON.stringify(部位进度)}`,
      `\n  当前依存度: ${当前依存度}`,
      `\n  当前道德底线: ${当前道德底线}`,
      `\n  当前境界: ${当前境界}`,
    );
    return; // 跳过更新，保留当前值
  }

  // 计算依存度（部位进度平均值）
  const 新依存度 = calculateDependencyFromBodyProgress(部位进度);

  // 检查2（Bug #23 新增）：依存度异常下降检查
  // 如果新依存度比当前依存度低超过15点，可能是数据继承问题
  // 正常情况下依存度只会上升（梦境开发增加部位进度），不会下降
  const 依存度下降幅度 = 当前依存度 - 新依存度;
  if (依存度下降幅度 > 15) {
    console.warn(
      `[真相模式数值更新] 跳过更新：检测到依存度异常下降 ${依存度下降幅度} 点`,
      `\n  当前依存度: ${当前依存度} → 计算值: ${新依存度}`,
      `\n  部位进度: ${JSON.stringify(部位进度)}`,
      `\n  部位进度总和: ${部位进度总和}`,
      `\n  原因: 可能是数据未正确继承，阻止更新以保护数据`,
    );
    return; // 跳过更新，保留当前值
  }

  // 计算道德底线（100 - 依存度）
  const 新道德底线 = calculateMoralBaselineFromDependency(新依存度);

  // 计算境界（依存度决定）
  const 新境界 = calculateRealmFromDependency(新依存度);

  // 检测变化并记录
  const 依存度变化 = 新依存度 !== data.赵霞状态.依存度;
  const 道德变化 = 新道德底线 !== data.赵霞状态.道德底线;
  const 境界变化 = 新境界 !== data.赵霞状态.当前境界;

  if (依存度变化 || 道德变化 || 境界变化) {
    console.info('[真相模式数值更新]');
    if (依存度变化) {
      console.info(`  依存度: ${data.赵霞状态.依存度} → ${新依存度}`);
    }
    if (道德变化) {
      console.info(`  道德底线: ${data.赵霞状态.道德底线} → ${新道德底线}`);
    }
    if (境界变化) {
      console.info(`  境界: ${data.赵霞状态.当前境界} → ${新境界}`);
    }
  }

  // 应用新值
  data.赵霞状态.依存度 = 新依存度;
  data.赵霞状态.道德底线 = 新道德底线;
  data.赵霞状态.当前境界 = 新境界;
}

/**
 * 部位开发等级定义
 * 每个等级对应不同的接受程度和行为描述
 */
export const BODY_PART_DEVELOPMENT_LEVELS = {
  未开发: {
    range: [0, 19] as [number, number],
    接受程度: '完全抗拒',
    描述: '坚决拒绝，会表现出明显的不适和抗拒',
  },
  初步开发: {
    range: [20, 39] as [number, number],
    接受程度: '轻微接受',
    描述: '勉强接受轻微触碰，但很快会躲开，需要大量引导',
  },
  明显开发: {
    range: [40, 59] as [number, number],
    接受程度: '明显接受',
    描述: '愿意接受触碰，虽有羞涩但不会拒绝，会有生理反应',
  },
  深度开发: {
    range: [60, 79] as [number, number],
    接受程度: '深度接受',
    描述: '享受相关刺激，只需轻微暗示就会配合，反应明显',
  },
  完全开发: {
    range: [80, 100] as [number, number],
    接受程度: '完全接受',
    描述: '极度敏感和渴望，会主动索求，完全沉溺于快感',
  },
} as const;

/**
 * 根据进度值获取开发等级
 */
export function getDevelopmentLevelFromProgress(progress: number): keyof typeof BODY_PART_DEVELOPMENT_LEVELS {
  if (progress >= 80) return '完全开发';
  if (progress >= 60) return '深度开发';
  if (progress >= 40) return '明显开发';
  if (progress >= 20) return '初步开发';
  return '未开发';
}

/**
 * 每个部位的具体行为描述（根据开发等级）
 */
export const BODY_PART_BEHAVIOR_MAP: Record<BodyPartName, Record<string, string>> = {
  嘴巴: {
    未开发: '拒绝任何口腔相关的亲密行为，会躲开亲吻',
    初步开发: '可以接受简单的嘴唇接触，但很快会羞涩地转开',
    明显开发: '愿意进行舌吻，会有些许甜蜜的回应',
    深度开发: '主动进行深吻，愿意尝试口交，嘴唇变得敏感',
    完全开发: '渴望口腔刺激，愿意深喉，会主动索吻，舌头极度敏感',
  },
  胸部: {
    未开发: '会遮挡胸部，拒绝任何触碰，表现出强烈抗拒',
    初步开发: '允许隔着衣服轻触，但会紧张和不自在',
    明显开发: '允许直接触摸，乳头开始有反应，会轻声呻吟',
    深度开发: '享受胸部爱抚，乳头变得敏感，揉捏会让她颤抖',
    完全开发: '胸部极度敏感，轻触就会颤抖呻吟，渴望被揉捏吮吸',
  },
  下体: {
    未开发: '会夹紧双腿，坚决拒绝任何触碰，表现出恐惧',
    初步开发: '允许隔着衣物轻抚大腿内侧，但会很快制止',
    明显开发: '允许触摸私处，会不自觉地湿润，有些许期待',
    深度开发: '渴望被触摸，愿意接受手指进入，会主动张开双腿',
    完全开发: '极度敏感，轻触就会颤抖呻吟，渴望被进入和填满',
  },
  后穴: {
    未开发: '坚决拒绝任何后方接触，表现出强烈排斥',
    初步开发: '允许轻抚臀部，但对后穴仍有强烈抗拒',
    明显开发: '允许揉捏臀部，对后穴刺激开始有好奇心',
    深度开发: '对后穴刺激不再抗拒，愿意尝试简单的后庭play',
    完全开发: '后穴变得敏感，愿意被开发，甚至会主动索求',
  },
  精神: {
    未开发: '保持正常的界限意识，对过度亲密感到不安',
    初步开发: '开始对{{user}}产生特殊的感觉，偶尔会走神',
    明显开发: '心理防线明显松动，会主动靠近，渴望被关注',
    深度开发: '产生强烈的依赖感，离开{{user}}会感到空虚',
    完全开发: '完全沦陷，将{{user}}视为生命中最重要的人，愿意为他做任何事',
  },
};

/**
 * 获取部位的详细状态
 */
export function getBodyPartStatus(
  部位: BodyPartName,
  进度: number,
  已解锁: boolean,
): {
  部位名: string;
  进度: number;
  等级: string;
  接受程度: string;
  行为描述: string;
  已解锁: boolean;
} {
  const 等级 = getDevelopmentLevelFromProgress(进度);
  const 等级信息 = BODY_PART_DEVELOPMENT_LEVELS[等级];
  const 行为描述 = BODY_PART_BEHAVIOR_MAP[部位][等级];

  return {
    部位名: 部位,
    进度,
    等级,
    接受程度: 等级信息.接受程度,
    行为描述,
    已解锁,
  };
}

/**
 * 生成详细的互动范围Prompt
 * 这是核心函数，用于告诉AI当前境界允许哪些部位互动，以及每个部位的接受程度
 *
 * 【核心设计变更 - 真相模式无境界限制】
 * - 纯爱模式：境界限制部位互动（伪装成正常恋爱进度）
 * - 真相模式：所有部位同时可开发，境界只影响服装妆容
 *
 * @param data 游戏数据
 * @returns 详细的互动范围提示文本
 */
export function generateDetailedInteractionPrompt(data: {
  赵霞状态: {
    当前境界: number;
    部位进度: Record<BodyPartName, number>;
    依存度?: number;
    道德底线?: number;
  };
  世界: {
    已进入过梦境: boolean;
    游戏阶段?: string;
  };
}): string {
  const 境界 = data.赵霞状态.当前境界;
  const 已进入梦境 = data.世界.已进入过梦境;
  const 部位进度 = data.赵霞状态.部位进度;
  const 游戏阶段 = data.世界.游戏阶段 || '日常';

  // 获取境界名称
  const 境界名 = getRealmTitle(境界, 已进入梦境);

  // ============================================
  // 纯爱模式：简化显示，有境界限制
  // ============================================
  if (!已进入梦境) {
    // 获取当前境界已解锁的部位（纯爱模式有限制）
    const 已解锁部位 = REALM_BODY_PART_UNLOCK[境界] || [];
    const 允许互动 = getAllowedInteractions(境界, false);

    return `【互动范围】
当前关系：${境界名}（${境界}/5）

允许的互动方式：${允许互动.length > 0 ? 允许互动.join('、') : '日常对话'}

赵霞会对超出当前关系的亲密行为表现出困惑或回避。
作为一位有家庭的成熟女性，她会保持适当的分寸感。`;
  }

  // ============================================
  // 真相模式：所有部位可开发，无境界限制
  // ============================================

  const 依存度 = data.赵霞状态.依存度 ?? calculateDependencyFromBodyProgress(部位进度);
  const 道德底线 = data.赵霞状态.道德底线 ?? calculateMoralBaselineFromDependency(依存度);

  // 梦境中 vs 现实中的提示不同
  if (游戏阶段 === '梦境') {
    // 梦境中：强调无限制开发
    let prompt = `【梦境互动 - 无限制模式】
当前境界：${境界名}（${境界}/5）
依存度：${依存度}/100
道德底线：${道德底线}/100

【核心规则】梦境中没有境界限制，所有部位都可以开发！
玩家可以同时对多个部位进行调教，开发进度会累积到现实中。

【各部位开发状态】`;

    for (const 部位 of ALL_BODY_PARTS) {
      const 进度 = 部位进度[部位] || 0;
      const 状态 = getBodyPartStatus(部位, 进度, true);

      prompt += `\n\n· ${状态.部位名}（${进度}%）- ${状态.等级}
  接受程度：${状态.接受程度}
  行为表现：${状态.行为描述}`;
    }

    prompt += `\n\n【梦境特殊说明】
- 梦中的赵霞不会有"这样做不对"的理性思考
- 她会根据部位开发程度自然地做出反应
- 高开发度的部位会表现出明显的敏感和渴望
- 开发进度会在醒来后影响现实中的赵霞`;

    return prompt;
  }

  // 现实中（真相模式）：显示详细状态，强调部位进度决定接受程度
  let prompt = `【真相模式 - 互动范围】
当前境界：${境界名}（${境界}/5）
依存度：${依存度}/100（由部位开发程度决定）
道德底线：${道德底线}/100

【核心规则】真相模式下，赵霞的反应完全取决于各部位的开发程度。
没有"境界限制"的概念——你可以尝试任何部位，她的反应由开发度决定。

【各部位详细状态】`;

  for (const 部位 of ALL_BODY_PARTS) {
    const 进度 = 部位进度[部位] || 0;
    const 状态 = getBodyPartStatus(部位, 进度, true);

    prompt += `\n\n· ${状态.部位名}（${进度}%）- ${状态.等级}
  接受程度：${状态.接受程度}
  行为表现：${状态.行为描述}`;
  }

  // 根据整体状态添加特殊提示
  if (依存度 >= 80) {
    prompt += `\n\n【高依存度状态】
赵霞已经完全沦陷，她的身心都属于{{user}}。
她会主动索求亲密接触，不再有任何心理抵触。`;
  } else if (依存度 >= 60) {
    prompt += `\n\n【中高依存度状态】
赵霞的道德防线已经崩塌，她开始主动靠近{{user}}。
虽然偶尔还有些许羞耻感，但无法抵抗身体的渴望。`;
  } else if (依存度 >= 40) {
    prompt += `\n\n【中等依存度状态】
赵霞内心开始动摇，对{{user}}产生了不该有的感觉。
她会在理智和欲望之间挣扎，但越来越难以自控。`;
  } else if (依存度 >= 20) {
    prompt += `\n\n【低依存度状态】
赵霞仍在努力维持母亲的身份，但梦境的影响开始显现。
她可能会对某些触碰产生异样的感觉，但会努力压制。`;
  }

  return prompt;
}

// ============================================
// 兼容旧API的函数（供promptInjection.ts使用）
// ============================================

/**
 * 获取当前服装描述（兼容旧API）
 */
export function getCurrentClothing(
  realm: number,
  _时段: '日常' | '睡衣' | '内衣',
  已进入过梦境: boolean = false,
): string {
  const defaultAppearance = getDefaultAppearance(realm, 已进入过梦境);
  return defaultAppearance.服装描述;
}

/**
 * 获取当前妆容描述（兼容旧API）
 */
export function getCurrentMakeup(
  realm: number,
  _场合: '日常' | '出门' | '私密',
  已进入过梦境: boolean = false,
): string {
  const defaultAppearance = getDefaultAppearance(realm, 已进入过梦境);
  return defaultAppearance.妆容描述;
}

// ============================================
// 外观约束Prompt生成（供状态一致性系统使用）
// ============================================

/**
 * 生成外观约束Prompt（给AI的指导）
 * 这是核心函数，用于状态一致性注入
 * 会根据 已进入过梦境 自动切换两套完全不同的外观系统
 */
export function generateAppearanceConstraintPrompt(data: SchemaType): string {
  const realm = data.赵霞状态.当前境界;
  const 已进入过梦境 = data.世界.已进入过梦境;
  const 苏文在家 = data.现实数据.丈夫当前位置 !== '外出';
  const 小时 = data.世界.当前小时;
  const 是睡眠时间 = 小时 >= 22 || 小时 < 7;

  const constraints = getRealmConstraints(realm, 已进入过梦境);
  const guidance = getStyleGuidance(realm, 已进入过梦境);
  const title = getRealmTitle(realm, 已进入过梦境);

  // 纯爱模式：始终保持保守得体
  if (!已进入过梦境) {
    let prompt = `【赵霞外观】
当前关系：${title}（${realm}/5）
整体风格：${guidance.整体风格}

【外观要求】
- 暴露程度：${constraints.暴露程度范围.join(' ~ ')}
- 妆容浓度：${constraints.妆容浓度范围.join(' ~ ')}
- 服装风格：${guidance.服装建议}
- 气质表现：${guidance.气质关键词.join('、')}`;

    const 禁忌元素 = (guidance as Record<string, unknown>).禁忌元素 as string[] | undefined;
    if (禁忌元素 && 禁忌元素.length > 0) {
      prompt += `\n- 应避免：${禁忌元素.join('、')}`;
    }

    if (是睡眠时间) {
      prompt += `\n\n【时段提示】当前是夜间，赵霞穿着朴素的睡衣。`;
    }

    return prompt;
  }

  // 真相模式：随境界变化的暴露系统
  let 实际暴露范围 = constraints.暴露程度范围;
  let 实际妆容范围 = constraints.妆容浓度范围;

  // 境界5特殊处理：苏文在场时表面保守
  if (realm === 5 && 苏文在家) {
    实际暴露范围 = ['保守', '正常'] as ExposureLevel[];
    实际妆容范围 = ['素颜', '淡妆'] as MakeupLevel[];
  }

  let prompt = `【赵霞外观约束】
当前境界：${title}（${realm}/5）
整体风格：${guidance.整体风格}

【外观范围约束】AI可在以下范围内自由发挥：
- 暴露程度：${实际暴露范围.join(' ~ ')}
- 妆容浓度：${实际妆容范围.join(' ~ ')}
- 特殊装饰（项圈、手铐等）：${constraints.允许特殊装饰 ? '允许' : '不允许'}
- 身体标记（纹身、烙印等）：${constraints.允许身体标记 ? '允许' : '不允许'}

【风格建议】（AI可自由选择具体款式、颜色、材质）
服装参考：${guidance.服装建议}
气质关键词：${guidance.气质关键词.join('、')}`;

  const 禁忌元素 = (guidance as Record<string, unknown>).禁忌元素 as string[] | undefined;
  if (禁忌元素 && 禁忌元素.length > 0) {
    prompt += `\n应避免：${禁忌元素.join('、')}`;
  }

  // 境界5特殊说明
  if (realm === 5 && (guidance as Record<string, unknown>).特殊说明) {
    prompt += `\n\n【特殊说明】${(guidance as Record<string, unknown>).特殊说明}`;
  }

  // 睡眠时间提示
  if (是睡眠时间) {
    prompt += `\n\n【时段提示】当前是夜间/凌晨，赵霞应穿着睡衣或更私密的服装。`;
  }

  // 苏文在家提示
  if (苏文在家 && realm < 5) {
    prompt += `\n\n【注意】苏文在家，赵霞的穿着应相对收敛，避免过度暴露引起怀疑。`;
  }

  return prompt;
}

/**
 * 检查行为是否被允许
 */
export function isActionAllowed(
  行为类型: string,
  当前境界: number,
  已进入过梦境: boolean = false,
): {
  allowed: boolean;
  reason?: string;
} {
  const config = getAppearanceConfig(已进入过梦境);
  const realmConfig = config[当前境界 as keyof typeof config];

  if (!realmConfig) {
    return { allowed: false, reason: '境界数据错误' };
  }

  // 真相模式境界5允许所有行为
  if (已进入过梦境 && 当前境界 === 5) {
    return { allowed: true };
  }

  // 真相模式境界4允许所有互动和性行为
  const 允许互动列表 = realmConfig.允许互动 as readonly string[];
  if (已进入过梦境 && 当前境界 === 4 && (允许互动列表.includes('所有互动') || 允许互动列表.includes('性行为'))) {
    return { allowed: true };
  }

  // 检查具体行为
  const 允许 = realmConfig.允许互动.some(
    允许的行为 =>
      允许的行为 === 行为类型 ||
      允许的行为 === '所有互动' ||
      (允许的行为.includes(行为类型.substring(0, 2)) && 行为类型.length > 2),
  );

  if (允许) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `当前${已进入过梦境 ? '境界' : '关系'}（${realmConfig.境界名}）不允许此行为`,
  };
}

/**
 * 父亲位置更新（根据时间）
 */
export function updateHusbandLocation(data: SchemaType): void {
  const 当前小时 = data.世界.当前小时;

  let 新位置: SchemaType['现实数据']['丈夫当前位置'];

  // 根据时间段决定父亲位置
  if (当前小时 >= 7 && 当前小时 < 8) {
    新位置 = Math.random() > 0.5 ? '卧室' : '客厅';
  } else if (当前小时 >= 8 && 当前小时 < 9) {
    新位置 = Math.random() > 0.5 ? '厨房' : '客厅';
  } else if (当前小时 >= 9 && 当前小时 < 18) {
    新位置 = '外出';
  } else if (当前小时 >= 18 && 当前小时 < 19) {
    新位置 = '客厅';
  } else if (当前小时 >= 19 && 当前小时 < 21) {
    新位置 = Math.random() > 0.5 ? '客厅' : '厨房';
  } else if (当前小时 >= 21 && 当前小时 < 23) {
    新位置 = Math.random() > 0.6 ? '书房' : '客厅';
  } else {
    新位置 = '卧室';
  }

  if (data.现实数据.丈夫当前位置 !== 新位置) {
    const 旧位置 = data.现实数据.丈夫当前位置;
    data.现实数据.丈夫当前位置 = 新位置;
    console.info(`[父亲位置] 更新: ${旧位置} → ${新位置}（当前时间：${data.世界.当前小时}:00）`);
  }
}

// 注意：打断系统已迁移至 boundaryInterruption.ts
// 新规则：打断概率 = 丈夫怀疑度 × 0.5%（怀疑度60 → 30%概率）
// 详见 boundaryInterruption.ts 中的 calculateInterruptionProbability 和 checkBoundaryViolation

/**
 * 生成外观描述文本（供AI使用）
 */
export function generateAppearanceDescription(data: SchemaType): string {
  return generateAppearanceConstraintPrompt(data);
}

/**
 * Bug #28 修复：赵霞位置更新（根据时间）
 *
 * 梦境退出后调用此函数更新赵霞的位置，确保状态栏显示正确
 * 与丈夫位置逻辑类似，但赵霞更多时间待在家中
 */
export function updateZhaoxiaLocation(data: SchemaType): void {
  const 当前小时 = data.世界.当前小时;

  let 新位置: string;

  // 根据时间段决定赵霞的位置（家庭主妇的日常活动）
  if (当前小时 >= 6 && 当前小时 < 8) {
    // 早起准备早餐
    新位置 = Math.random() > 0.5 ? '厨房' : '卧室';
  } else if (当前小时 >= 8 && 当前小时 < 12) {
    // 上午做家务
    新位置 = Math.random() > 0.6 ? '客厅' : '厨房';
  } else if (当前小时 >= 12 && 当前小时 < 14) {
    // 午餐时间
    新位置 = '厨房';
  } else if (当前小时 >= 14 && 当前小时 < 17) {
    // 下午休息或做家务
    新位置 = Math.random() > 0.5 ? '客厅' : '卧室';
  } else if (当前小时 >= 17 && 当前小时 < 19) {
    // 准备晚餐
    新位置 = '厨房';
  } else if (当前小时 >= 19 && 当前小时 < 22) {
    // 晚间休息
    新位置 = '客厅';
  } else {
    // 深夜/凌晨
    新位置 = '卧室';
  }

  if (data.赵霞状态.当前位置 !== 新位置) {
    const 旧位置 = data.赵霞状态.当前位置;
    data.赵霞状态.当前位置 = 新位置;
    console.info(`[赵霞位置] 更新: ${旧位置} → ${新位置}（当前时间：${data.世界.当前小时}:00）`);
  }
}

/**
 * Bug #28 修复：赵霞心理活动更新（梦境退出后）
 *
 * 梦境退出后调用此函数更新赵霞的心理活动，反映刚从梦中醒来的状态
 */
export function updateZhaoxiaThoughtAfterDream(data: SchemaType): void {
  const 依存度 = data.赵霞状态.依存度;
  const 当前境界 = data.赵霞状态.当前境界;

  // 根据依存度和境界生成醒来后的心理活动
  let 新心理活动: string;

  if (依存度 >= 80 || 当前境界 >= 5) {
    // 高依存度：完全沦陷状态
    新心理活动 = '（刚从梦中醒来，身体还残留着梦境中的感觉...）他...一定会来找我的吧？';
  } else if (依存度 >= 60 || 当前境界 >= 4) {
    // 中高依存度：深度动摇
    新心理活动 = '（恍惚地从梦中醒来）那个梦...为什么又是他？我不应该想这些的...';
  } else if (依存度 >= 40 || 当前境界 >= 3) {
    // 中等依存度：明显动摇
    新心理活动 = '（揉着惺忪的睡眼）昨晚做了什么梦来着...心跳得好快...';
  } else if (依存度 >= 20 || 当前境界 >= 2) {
    // 低依存度：轻微动摇
    新心理活动 = '（从睡梦中醒来，有些恍惚）...好奇怪的梦，为什么会梦到那种事...';
  } else {
    // 初始状态
    新心理活动 = '（慢慢睁开眼睛）今天是新的一天，该准备早餐了...';
  }

  const 旧心理活动 = data.赵霞状态.心理活动;
  data.赵霞状态.心理活动 = 新心理活动;
  console.info(
    `[赵霞心理] 梦境退出后更新心理活动`,
    `\n  旧: ${旧心理活动.substring(0, 30)}...`,
    `\n  新: ${新心理活动.substring(0, 30)}...`,
  );
}

// ============================================
// 丈夫怀疑度计算系统
// ============================================

/**
 * 暴露服装关键词库
 * 用于检测AI描述中的服装暴露程度
 */
const EXPOSURE_CLOTHING_KEYWORDS = {
  清凉: [
    '短裙',
    '迷你裙',
    '超短裙',
    '热裤',
    '短裤',
    '吊带',
    '背心',
    'V领',
    '低胸',
    '露肩',
    '露背',
    '透视',
    '薄纱',
    '紧身',
    '贴身',
    '丝袜',
    '蕾丝',
    '网袜',
    '渔网',
  ],
  暴露: [
    '情趣',
    '内衣外穿',
    '比基尼',
    '胸衣',
    '镂空',
    '开叉',
    '高开叉',
    '超低腰',
    '真空',
    '不穿内衣',
    '没穿内衣',
    '睡裙',
    '吊带睡裙',
    '丝绸睡衣',
  ],
  极度暴露: [
    '全裸',
    '裸体',
    '一丝不挂',
    '只穿围裙',
    '情趣内衣',
    '性感内衣',
    '开裆',
    '无底',
    '三点式',
    '丁字裤',
    '乳贴',
    '身体彩绘',
  ],
};

/**
 * 浓妆关键词库
 */
const HEAVY_MAKEUP_KEYWORDS = {
  浓妆: ['浓妆', '大红唇', '红唇', '艳丽妆容', '烈焰红唇', '性感妆', '夜店妆', '烟熏妆', '眼线加深', '假睫毛'],
  艳妆: ['艳妆', '媚妆', '色情妆', '浓艳', '红唇艳丽', '眼影浓重', '腮红明显', '妖艳', '妩媚', '风尘'],
};

/**
 * 亲密行为关键词库
 * 用于检测正文中是否包含与主角的亲密行为
 */
const INTIMATE_BEHAVIOR_KEYWORDS = {
  轻度: ['牵手', '握手', '拥抱', '搂抱', '依偎', '靠在', '挽着', '挽手', '亲昵', '暧昧眼神', '眉目传情'],
  中度: [
    '亲吻',
    '亲嘴',
    '接吻',
    '吻',
    '贴脸',
    '耳鬓厮磨',
    '亲密接触',
    '抚摸',
    '触碰',
    '爱抚',
    '坐在腿上',
    '坐大腿',
    '骑坐',
  ],
  重度: [
    '深吻',
    '舌吻',
    '热吻',
    '揉',
    '捏',
    '掐',
    '摸胸',
    '揉胸',
    '脱衣',
    '解开',
    '褪下',
    '呻吟',
    '喘息',
    '娇喘',
    '进入',
    '插入',
    '抽插',
  ],
};

/**
 * 境界外显关键词（境界4+的行为特征）
 */
const REALM_MANIFESTATION_KEYWORDS = [
  '渴望',
  '主动',
  '索求',
  '勾引',
  '媚眼',
  '抛媚眼',
  '挑逗',
  '撩拨',
  '撒娇',
  '讨好',
  '献媚',
  '谄媚',
  '依赖',
  '离不开',
  '想你',
  '需要你',
];

/**
 * 检测文本中包含多少个关键词
 */
function countKeywordsInText(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      count++;
    }
  }
  return count;
}

/**
 * 检测服装暴露程度
 * @returns 暴露等级：0=正常, 1=清凉, 2=暴露, 3=极度暴露
 */
function detectClothingExposure(服装描述: string): number {
  const text = 服装描述.toLowerCase();

  // 检测极度暴露
  if (countKeywordsInText(text, EXPOSURE_CLOTHING_KEYWORDS.极度暴露) > 0) {
    return 3;
  }

  // 检测暴露
  if (countKeywordsInText(text, EXPOSURE_CLOTHING_KEYWORDS.暴露) > 0) {
    return 2;
  }

  // 检测清凉
  if (countKeywordsInText(text, EXPOSURE_CLOTHING_KEYWORDS.清凉) >= 2) {
    return 1;
  }

  return 0;
}

/**
 * 检测妆容浓度
 * @returns 浓度等级：0=正常, 1=浓妆, 2=艳妆
 */
function detectMakeupIntensity(妆容描述: string): number {
  const text = 妆容描述.toLowerCase();

  // 检测艳妆
  if (countKeywordsInText(text, HEAVY_MAKEUP_KEYWORDS.艳妆) > 0) {
    return 2;
  }

  // 检测浓妆
  if (countKeywordsInText(text, HEAVY_MAKEUP_KEYWORDS.浓妆) > 0) {
    return 1;
  }

  return 0;
}

/**
 * 检测亲密行为程度
 * @returns 亲密等级：0=无, 1=轻度, 2=中度, 3=重度
 */
function detectIntimacyLevel(正文内容: string): number {
  const text = 正文内容;

  // 检测重度亲密
  if (countKeywordsInText(text, INTIMATE_BEHAVIOR_KEYWORDS.重度) >= 1) {
    return 3;
  }

  // 检测中度亲密
  if (countKeywordsInText(text, INTIMATE_BEHAVIOR_KEYWORDS.中度) >= 1) {
    return 2;
  }

  // 检测轻度亲密
  if (countKeywordsInText(text, INTIMATE_BEHAVIOR_KEYWORDS.轻度) >= 2) {
    return 1;
  }

  return 0;
}

/**
 * 检测境界外显
 */
function detectRealmManifestation(正文内容: string): boolean {
  return countKeywordsInText(正文内容, REALM_MANIFESTATION_KEYWORDS) >= 2;
}

/**
 * 怀疑度增加结果
 */
export interface SuspicionIncreaseResult {
  增加值: number;
  原因: string[];
  详细: {
    服装暴露: number;
    妆容浓度: number;
    亲密行为: number;
    境界外显: number;
  };
}

/**
 * 计算丈夫怀疑度增加值
 *
 * 计算规则：
 * 1. 只在苏文在家时计算
 * 2. 服装暴露：清凉+5, 暴露+10, 极度暴露+15
 * 3. 妆容浓度：浓妆+3, 艳妆+8
 * 4. 亲密行为：轻度+5, 中度+10, 重度+20（仅检测玩家输入，不检测AI回复）
 * 5. 境界外显：境界≥4且依存度≥60时+3（基于数据而非AI文本）
 *
 * Bug #14 修复：
 * - 亲密行为只检测玩家输入（userInputText），不检测AI回复
 * - 境界外显基于依存度数据判断，不检测AI回复文本
 * - 原因：AI回复可能包含梦境回忆或其他不应触发怀疑的内容
 *
 * @param data 游戏数据
 * @param userInputText 玩家输入文本（用于检测亲密行为）
 * @returns 怀疑度增加结果
 */
export function calculateSuspicionIncrease(data: SchemaType, userInputText: string = ''): SuspicionIncreaseResult {
  const result: SuspicionIncreaseResult = {
    增加值: 0,
    原因: [],
    详细: {
      服装暴露: 0,
      妆容浓度: 0,
      亲密行为: 0,
      境界外显: 0,
    },
  };

  // 前置条件：苏文在家
  const 苏文在家 = data.现实数据.丈夫当前位置 !== '外出';
  if (!苏文在家) {
    return result;
  }

  // 判断是否为真相模式（已进入过梦境）
  const 真相模式 = data.世界.已进入过梦境;

  // 真相模式下的额外检测项（纯爱模式服装保守，妆容淡雅，没有境界系统）
  if (真相模式) {
    // 1. 检测服装暴露（从状态数据读取，不依赖AI文本）
    const 服装文本 = Object.values(data.赵霞状态.服装).join(' ');
    const 暴露等级 = detectClothingExposure(服装文本);
    if (暴露等级 >= 1) {
      const 暴露增加 = [0, 5, 10, 15][暴露等级];
      result.详细.服装暴露 = 暴露增加;
      result.增加值 += 暴露增加;
      result.原因.push(`服装暴露（等级${暴露等级}）+${暴露增加}`);
    }

    // 2. 检测妆容浓度（从状态数据读取，不依赖AI文本）
    const 妆容等级 = detectMakeupIntensity(data.赵霞状态.妆容);
    if (妆容等级 >= 1) {
      const 妆容增加 = [0, 3, 8][妆容等级];
      result.详细.妆容浓度 = 妆容增加;
      result.增加值 += 妆容增加;
      result.原因.push(`妆容浓度（等级${妆容等级}）+${妆容增加}`);
    }

    // 4. 检测境界外显（Bug #14 修复：基于依存度数据判断，不检测AI文本）
    // 设计意图：高依存度时赵霞会不自觉表现出对主角的依赖
    // 境界4+（依存度60+）时，每轮固定增加少量怀疑度
    if (data.赵霞状态.当前境界 >= 4 && data.赵霞状态.依存度 >= 60) {
      result.详细.境界外显 = 3;
      result.增加值 += 3;
      result.原因.push(`高依存度外显（境界${data.赵霞状态.当前境界}）+3`);
    }
  }

  // 3. 检测亲密行为（纯爱模式和真相模式都检测）
  // 设计意图：玩家主动在苏文面前做亲密动作会增加怀疑度
  // 这是玩家的主观行为，无论哪种模式都应该受到约束
  // Bug #14 修复：仅检测玩家输入，不检测AI回复
  // Bug #005 修复：降低惩罚值，原来+5/+10/+20太高，改为+3/+5/+10
  if (userInputText) {
    const 亲密等级 = detectIntimacyLevel(userInputText);
    if (亲密等级 >= 1) {
      const 亲密增加 = [0, 3, 5, 10][亲密等级]; // Bug #005: 降低惩罚值
      result.详细.亲密行为 = 亲密增加;
      result.增加值 += 亲密增加;
      const 模式标注 = 真相模式 ? '' : '（纯爱模式）';
      result.原因.push(`玩家亲密行为${模式标注}（等级${亲密等级}）+${亲密增加}`);
    }
  }

  // 日志输出
  if (result.增加值 > 0) {
    console.info(
      `[丈夫怀疑度] 检测到可疑行为，怀疑度+${result.增加值}`,
      `\n  原因: ${result.原因.join(', ')}`,
      `\n  苏文位置: ${data.现实数据.丈夫当前位置}`,
      `\n  当前境界: ${data.赵霞状态.当前境界}`,
      `\n  当前依存度: ${data.赵霞状态.依存度}`,
    );
  }

  return result;
}

/**
 * 更新丈夫怀疑度（带上限保护）
 *
 * Bug #14 修复：参数改为玩家输入文本，不再检测AI回复
 *
 * @param data 游戏数据
 * @param userInputText 玩家输入文本（用于检测亲密行为）
 * @returns 更新后的怀疑度
 */
export function updateSuspicionLevel(data: SchemaType, userInputText: string = ''): number {
  const result = calculateSuspicionIncrease(data, userInputText);

  if (result.增加值 > 0) {
    const 旧怀疑度 = data.现实数据.丈夫怀疑度;
    const 新怀疑度 = Math.min(100, 旧怀疑度 + result.增加值);

    data.现实数据.丈夫怀疑度 = 新怀疑度;

    console.info(
      `[丈夫怀疑度] ${旧怀疑度} → ${新怀疑度} (+${result.增加值})`,
      `\n  详细: 服装${result.详细.服装暴露} + 妆容${result.详细.妆容浓度} + 亲密${result.详细.亲密行为} + 境界${result.详细.境界外显}`,
    );

    // 检测是否触发坏结局
    if (新怀疑度 >= 100) {
      console.warn(`[丈夫怀疑度] ⚠️ 怀疑度达到100！将触发坏结局`);
    } else if (新怀疑度 >= 80) {
      console.warn(`[丈夫怀疑度] ⚠️ 怀疑度超过80，丈夫开始密切关注`);
    } else if (新怀疑度 >= 50) {
      console.info(`[丈夫怀疑度] 怀疑度超过50，丈夫有所察觉`);
    }

    return 新怀疑度;
  }

  return data.现实数据.丈夫怀疑度;
}

// ============================================
// 怀疑度降低系统（Bug #005 新增）
// ============================================

/**
 * 与苏文相处/聊天的关键词
 * 检测玩家是否在与苏文进行正常互动
 */
const HUSBAND_INTERACTION_KEYWORDS = [
  // 直接称呼
  '苏文',
  '老公',
  '丈夫',
  // 聊天/相处
  '聊天',
  '说话',
  '交谈',
  '陪伴',
  '一起',
  '陪他',
  '陪苏文',
  // 家庭互动
  '吃饭',
  '看电视',
  '散步',
  '做饭',
  '家务',
  // 关心
  '关心',
  '问候',
  '怎么样',
  '辛苦了',
  '累不累',
];

/**
 * 检测玩家是否在与苏文进行正常互动
 * @param userInput 玩家输入
 * @returns 是否检测到与苏文的正常互动
 */
export function detectHusbandInteraction(userInput: string): boolean {
  return HUSBAND_INTERACTION_KEYWORDS.some(kw => userInput.includes(kw));
}

/**
 * 怀疑度降低结果
 */
export interface SuspicionDecreaseResult {
  降低值: number;
  原因: string;
  今日累计降低: number;
  已达上限: boolean;
}

/**
 * 计算并应用怀疑度降低
 *
 * Bug #005 新增：与苏文正常相处/聊天时可降低怀疑度
 * - 每次互动降低 3 点
 * - 每天最多降低 10 点
 * - 跨天自动重置计数
 *
 * @param data 游戏数据
 * @param userInput 玩家输入
 * @returns 降低结果
 */
export function calculateSuspicionDecrease(data: SchemaType, userInput: string): SuspicionDecreaseResult {
  const result: SuspicionDecreaseResult = {
    降低值: 0,
    原因: '',
    今日累计降低: data.现实数据.今日怀疑度降低 ?? 0,
    已达上限: false,
  };

  // 前置条件：苏文在家
  const 苏文在家 = data.现实数据.丈夫当前位置 !== '外出';
  if (!苏文在家) {
    return result;
  }

  // 前置条件：怀疑度 > 0
  if (data.现实数据.丈夫怀疑度 <= 0) {
    return result;
  }

  // 检测是否与苏文互动
  if (!detectHusbandInteraction(userInput)) {
    return result;
  }

  // 检测跨天重置
  const 当前天数 = data.世界.当前天数;
  const 上次降低日期 = data.现实数据.上次降低日期 ?? 0;
  if (当前天数 !== 上次降低日期) {
    // 跨天了，重置今日降低计数
    data.现实数据.今日怀疑度降低 = 0;
    data.现实数据.上次降低日期 = 当前天数;
    result.今日累计降低 = 0;
  }

  // 检查是否已达今日上限（10点）
  const 每日上限 = 10;
  const 今日已降低 = data.现实数据.今日怀疑度降低 ?? 0;
  if (今日已降低 >= 每日上限) {
    result.已达上限 = true;
    result.原因 = '今日怀疑度降低已达上限（10点）';
    return result;
  }

  // 计算本次可降低值（每次互动降低3点，但不超过今日剩余额度）
  const 每次降低 = 3;
  const 剩余额度 = 每日上限 - 今日已降低;
  const 实际降低 = Math.min(每次降低, 剩余额度, data.现实数据.丈夫怀疑度);

  if (实际降低 > 0) {
    result.降低值 = 实际降低;
    result.原因 = '与苏文正常相处';
    result.今日累计降低 = 今日已降低 + 实际降低;
  }

  return result;
}

/**
 * 更新丈夫怀疑度（降低）
 *
 * @param data 游戏数据
 * @param userInput 玩家输入
 * @returns 更新后的怀疑度
 */
export function applySuspicionDecrease(data: SchemaType, userInput: string): number {
  const result = calculateSuspicionDecrease(data, userInput);

  if (result.降低值 > 0) {
    const 旧怀疑度 = data.现实数据.丈夫怀疑度;
    const 新怀疑度 = Math.max(0, 旧怀疑度 - result.降低值);

    data.现实数据.丈夫怀疑度 = 新怀疑度;
    data.现实数据.今日怀疑度降低 = result.今日累计降低;

    console.info(
      `[丈夫怀疑度] ${旧怀疑度} → ${新怀疑度} (-${result.降低值})`,
      `\n  原因: ${result.原因}`,
      `\n  今日累计降低: ${result.今日累计降低}/10`,
    );

    return 新怀疑度;
  }

  if (result.已达上限) {
    console.info(`[丈夫怀疑度] ${result.原因}`);
  }

  return data.现实数据.丈夫怀疑度;
}
