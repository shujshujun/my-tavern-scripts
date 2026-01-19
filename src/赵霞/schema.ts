import { z } from 'zod';

/**
 * 赵霞游戏 - 数据结构定义
 *
 * 核心设计理念：
 * 1. 时间系统：零BUG设计，单一入口、原子更新
 * 2. 双重叙事：通过文本映射实现纯爱/真相模式切换
 * 3. 记忆重构：5个场景，正确重构才能达成真结局
 */

export const Schema = z.object({
  // ============================================
  // 世界状态（全局控制）
  // ============================================
  世界: z
    .object({
      // --- 时间系统（核心，零BUG设计） ---
      // Bug #18 修复：结局阶段允许天数超过5（用于显示真实日期）
      // 注意：stateValidation.ts 会在"进行中"状态下限制天数在1-5范围
      当前天数: z.number().min(1).max(99).default(1), // 1-5天（结局阶段允许>5）
      当前小时: z.number().min(0).max(23).default(8), // 0-23小时
      时间: z.string().default('Day 1, 08:00'), // 显示用，格式："Day 1, 08:00"
      时间戳: z.number().default(0), // Date.now()，用于同步验证
      状态栏需要刷新: z.boolean().default(true), // 关键标记，防止状态栏不同步

      // --- 循环系统 ---
      循环状态: z.enum(['进行中', '结局判定', '已破解']).default('进行中'),
      当前循环轮数: z.number().default(1), // 玩家经历了多少次循环

      // --- 双重叙事系统（文本映射控制） ---
      已进入过梦境: z.boolean().default(false), // false=纯爱模式, true=真相模式

      // --- 游戏状态 ---
      游戏阶段: z.enum(['序章', '日常', '梦境', '结局']).default('序章'),

      // --- 梦境选择状态（首次进入梦境楼层时的UI状态）---
      // 注意：下划线前缀的字段是内部字段，AI请勿依据这些字段判断场景！
      _梦境入口消息ID: z.number().optional(), // 触发梦境的消息楼层ID（内部字段）
      _梦境入口天数: z.number().optional(), // 进入梦境时的天数（内部字段，用于锁定场景编号）
      梦境选择已锁定: z.boolean().default(false), // 是否已完成部位选择

      // --- 摘要生成标记 ---
      待生成摘要: z
        .object({
          sceneNum: z.number().min(1).max(5), // 需要生成摘要的场景编号
          dreamEntryId: z.number(), // 梦境进入时的楼层ID，用于获取聊天记录
          dreamExitId: z.number().optional(), // Bug #25 修复：梦境退出时的楼层ID，用于限制收集范围
        })
        .optional(), // undefined 表示不需要生成摘要

      // --- 梦境退出标记（用于延迟一轮生成摘要） ---
      上一轮梦境已退出: z
        .object({
          sceneNum: z.number().min(1).max(5), // 退出的场景编号
          dreamEntryId: z.number(), // 梦境进入时的楼层ID
          dreamExitId: z.number().optional(), // Bug #25 修复：梦境退出时的楼层ID
        })
        .optional(), // undefined 表示上一轮没有退出

      // --- ROLL 检测系统（Bug #21 修复：梦境退出 ROLL 支持） ---
      // 记录上次梦境退出的楼层ID，用于在 CHAT_COMPLETION_PROMPT_READY 中检测 ROLL
      _梦境退出记录: z
        .object({
          楼层ID: z.number().default(-1), // 上次退出时的 AI 回复楼层ID
          场景编号: z.number().min(1).max(5).optional(), // 退出的场景编号（1-4 或 5）
          swipe_id: z.number().default(-1), // 保留字段兼容性，不再使用
        })
        .optional(),

      // --- ROLL 检测系统（梦境入口 ROLL 支持） ---
      // 记录上次梦境入口的楼层ID，用于在 CHAT_COMPLETION_PROMPT_READY 中检测 ROLL
      _梦境入口记录: z
        .object({
          楼层ID: z.number().default(-1), // 上次入口时的 AI 回复楼层ID
          场景编号: z.number().min(1).max(5).optional(), // 进入的场景编号（1-4 或 5）
          类型: z.enum(['普通梦境', '场景5']).optional(), // 入口类型
        })
        .optional(),

      // --- ROLL 检测系统（摘要生成 ROLL 支持） ---
      // 记录上次摘要生成的楼层ID和swipe_id，用于检测 ROLL 操作
      // 当用户 ROLL 摘要生成的那条消息时，需要恢复"待生成摘要"标记
      _摘要生成记录: z
        .object({
          楼层ID: z.number().default(-1), // 上次摘要生成时的消息楼层ID
          swipe_id: z.number().default(0), // 上次摘要生成时的 swipe_id
          场景编号: z.number().min(1).max(5).optional(), // 生成摘要的场景编号
          入口楼层ID: z.number().optional(), // 梦境入口楼层ID（用于恢复标记）
          退出楼层ID: z.number().optional(), // 梦境退出楼层ID（用于恢复标记）
        })
        .optional(),
    })
    .default({
      当前天数: 1,
      当前小时: 8,
      时间: 'Day 1, 08:00',
      时间戳: 0,
      状态栏需要刷新: true,
      循环状态: '进行中',
      当前循环轮数: 1,
      已进入过梦境: false,
      游戏阶段: '序章',
      梦境选择已锁定: false,
    }),

  // ============================================
  // 赵霞状态（女主角数据）
  // ============================================
  赵霞状态: z
    .object({
      // --- 核心数值（真相模式） ---
      依存度: z.number().min(0).max(100).default(0), // 对主角依存度
      道德底线: z.number().min(0).max(100).default(80), // 越低越容易接受禁忌
      对丈夫依存度: z.number().min(-50).max(100).default(60), // 对丈夫的情感

      // --- 纯爱模式专属数值 ---
      纯爱好感度: z.number().min(0).max(100).default(5), // AI控制，天数软上限保护
      纯爱亲密度: z.number().min(0).max(100).default(0), // 范围内行为增加，决定关系阶段
      // 关系阶段：陌生(0-19) → 破冰(20-39) → 信任(40-59) → 依恋(60-79) → 羁绊(80+，纯爱无法达到)

      // --- 境界系统（真相模式：根据部位进度自动计算） ---
      // 计算链条：部位进度平均值 = 依存度 → 依存度/20 = 境界
      当前境界: z.number().min(1).max(5).default(1), // 1-5境界
      // 境界1 初染: 依存度 0-19
      // 境界2 迷途: 依存度 20-39
      // 境界3 溺深: 依存度 40-59
      // 境界4 归虚: 依存度 60-79
      // 境界5 焚誓: 依存度 80+

      // --- 部位开发进度（梦境和现实共用） ---
      部位进度: z
        .object({
          嘴巴: z.number().min(0).max(100).default(0),
          胸部: z.number().min(0).max(100).default(0),
          下体: z.number().min(0).max(100).default(0),
          后穴: z.number().min(0).max(100).default(0),
          精神: z.number().min(0).max(100).default(0),
        })
        .default({
          嘴巴: 0,
          胸部: 0,
          下体: 0,
          后穴: 0,
          精神: 0,
        }),

      // --- 位置和外观（AI更新） ---
      当前位置: z.string().default('客厅'),
      服装: z
        .object({
          上衣: z.string().default('米色真丝连衣裙上衣部分'),
          下装: z.string().default('米色真丝连衣裙裙摆'),
          内衣: z.string().default('白色蕾丝内衣'),
          内裤: z.string().default('白色蕾丝内裤'),
          袜子: z.string().default('肉色丝袜'),
          鞋子: z.string().default('米色平底鞋'),
        })
        .default({
          上衣: '米色真丝连衣裙上衣部分',
          下装: '米色真丝连衣裙裙摆',
          内衣: '白色蕾丝内衣',
          内裤: '白色蕾丝内裤',
          袜子: '肉色丝袜',
          鞋子: '米色平底鞋',
        }),
      // --- 妆容和配件（AI更新） ---
      妆容: z.string().default('淡妆'), // 纯爱：素颜/淡妆/日常妆/精致妆；真相：+浓妆/媚妆/色情妆
      配件: z.string().default('婚戒'), // 纯爱：日常配件；真相：根据境界解锁情趣配件
      改造: z.array(z.string()).default([]), // 真相模式专属：乳环、阴蒂环、淫纹、烙印等

      心理活动: z.string().default('今天天气不错，该准备午餐了...'),
    })
    .default({
      依存度: 0,
      道德底线: 80,
      对丈夫依存度: 60,
      纯爱好感度: 5,
      纯爱亲密度: 0,
      当前境界: 1,
      部位进度: {
        嘴巴: 0,
        胸部: 0,
        下体: 0,
        后穴: 0,
        精神: 0,
      },
      当前位置: '客厅',
      服装: {
        上衣: '米色真丝连衣裙上衣部分',
        下装: '米色真丝连衣裙裙摆',
        内衣: '白色蕾丝内衣',
        内裤: '白色蕾丝内裤',
        袜子: '肉色丝袜',
        鞋子: '米色平底鞋',
      },
      妆容: '淡妆',
      配件: '婚戒',
      改造: [],
      心理活动: '今天天气不错，该准备午餐了...',
    }),

  // ============================================
  // 记忆数据（梦境系统）
  // ============================================
  梦境数据: z
    .object({
      // --- 当前梦境状态 ---
      当前记忆年龄: z.number().min(16).max(40).optional(), // 梦境中赵霞的记忆年龄（场景1为16岁）
      梦境心理活动: z.string().optional(), // 梦境中赵霞的心理活动（第一人称）
      此次梦境目标: z.string().optional(), // 玩家需要完成的梦境目标描述
      记忆背景故事: z.string().optional(), // 当前记忆场景的背景故事描述

      // --- 记忆场景完成情况 ---
      已完成场景: z.array(z.number()).default([]), // [1, 2, 3, 4, 5]
      正确重构场景: z.array(z.number()).default([]), // 记录哪些场景选择正确

      // --- 场景详细数据 ---
      场景1: z
        .object({
          已进入: z.boolean().default(false),
          选择部位: z.array(z.string()).default([]), // 玩家选择的部位
          是否正确: z.boolean().optional(),
          进入时间: z.string().optional(), // "Day 1, 23:00"
          对话轮数: z.number().default(0),
          剧情摘要: z.string().optional(), // AI生成的完整记忆摘要，用于下一场景的记忆连续性
        })
        .optional(),

      场景2: z
        .object({
          已进入: z.boolean().default(false),
          选择部位: z.array(z.string()).default([]),
          是否正确: z.boolean().optional(),
          进入时间: z.string().optional(),
          对话轮数: z.number().default(0),
          剧情摘要: z.string().optional(), // AI生成的完整记忆摘要，用于下一场景的记忆连续性
        })
        .optional(),

      场景3: z
        .object({
          已进入: z.boolean().default(false),
          选择部位: z.array(z.string()).default([]),
          是否正确: z.boolean().optional(),
          进入时间: z.string().optional(),
          对话轮数: z.number().default(0),
          剧情摘要: z.string().optional(), // AI生成的完整记忆摘要，用于下一场景的记忆连续性
        })
        .optional(),

      场景4: z
        .object({
          已进入: z.boolean().default(false),
          选择部位: z.array(z.string()).default([]),
          是否正确: z.boolean().optional(),
          进入时间: z.string().optional(),
          对话轮数: z.number().default(0),
          剧情摘要: z.string().optional(), // AI生成的完整记忆摘要，用于下一场景的记忆连续性
        })
        .optional(),

      场景5: z
        .object({
          已进入: z.boolean().default(false),
          选择部位: z.array(z.string()).default([]),
          是否正确: z.boolean().optional(),
          进入时间: z.string().optional(),
          对话轮数: z.number().default(0),
          需要安眠药: z.boolean().default(true), // 场景5特殊：需要安眠药

          // --- 场景5特有：12步线性剧情系统 ---
          进入次数: z.number().default(0), // 记录进入场景5的次数
          当前步骤: z.number().min(0).max(12).default(0), // 当前剧情步骤（0=未开始，1-12=对应步骤）
          已完成步骤: z.boolean().default(false), // 是否已完成全部12步
          上次剧情摘要: z.string().optional(), // AI生成的剧情摘要，用于下次进入时保持连续性
          // --- 完成度系统（基于步骤） ---
          // 完成度计算规则：
          // - 每步根据玩家意图契合度加进度（高契合+10%，低契合+5%）
          // - 12步全部高契合 = 120%，上限100%
          // - 40%以上算完成，100%触发特殊结局行为
          完成度: z.number().min(0).max(100).default(0), // 累计完成度（100%可触发特殊结局行为）
          步骤进度记录: z.array(z.number()).default([]), // 每步获得的进度 [10, 5, 10, ...]

          // --- ROLL 检测系统（Bug #11 修复） ---
          // 记录上次步骤推进的楼层和 swipe_id，用于在 CHAT_COMPLETION_PROMPT_READY 中检测 ROLL
          上次推进记录: z
            .object({
              楼层ID: z.number().default(-1), // 上次推进时的消息楼层ID
              swipe_id: z.number().default(-1), // 上次推进时的 swipe_id
            })
            .optional(),

          // --- Bug #13 修复：试探性进入机制 ---
          // 场景5未完成（<100%）退出时，需要回滚混乱度和混乱结局标记
          // 这样玩家可以"试探性"进入场景5，不会因为未完成就锁定坏结局
          进入前混乱度: z.number().min(0).max(100).optional(), // 进入场景5前的混乱度
          进入前混乱标记: z
            .object({
              已标记: z.boolean().default(false),
              标记时间: z.number().nullable().default(null),
              触发时间: z.number().nullable().default(null),
              已触发: z.boolean().default(false),
              触发原因: z.enum(['性行为', '打断仪式']).nullable().default(null),
              性行为次数: z.number().default(0),
            })
            .optional(), // 进入场景5前的混乱结局标记
        })
        .optional(),

      // --- 威胁数值（梦境路线专属） ---
      // 混乱度在进入梦境场景时设置，不是从0开始累积：
      // - 进入场景1: 设为40
      // - 进入场景2: 设为60
      // - 进入场景3: 设为80
      // - 进入场景4: 不变
      // - 进入场景5: 固定为80（无论之前路线）
      // 场景5内越轨行为增加混乱度：完美路线+7，非完美路线+10，打断仪式直接=100
      记忆混乱度: z.number().min(0).max(100).default(0), // 达到100触发精神崩溃结局

      // --- 混乱结局系统（场景5专属坏结局） ---
      // 当玩家在场景5中"作死"（性行为/打断婚礼）时触发
      混乱结局: z
        .object({
          已标记: z.boolean().default(false), // 是否已标记触发
          标记时间: z.number().nullable().default(null), // 标记时的小时数（世界.当前天数 * 24 + 世界.当前小时）
          触发时间: z.number().nullable().default(null), // 应该触发的小时数（标记时间 + 1小时）
          已触发: z.boolean().default(false), // 是否已经触发
          触发原因: z.enum(['性行为', '打断仪式']).nullable().default(null), // 触发原因
          性行为次数: z.number().default(0), // 场景5内检测到的性行为次数
        })
        .default({
          已标记: false,
          标记时间: null,
          触发时间: null,
          已触发: false,
          触发原因: null,
          性行为次数: 0,
        }),

      // --- 记忆连贯性系统 ---
      // 进入场景5时自动计算，基于是否按顺序完成场景1-2-3
      // 0: 未完成任何前置场景（直接进入场景5）
      // 1: 完成场景1（有初恋记忆）
      // 2: 完成场景1+2（有初恋+等待记忆）
      // 3: 完成场景1+2+3（完美记忆路线）
      // 注意：场景4时间线在场景5之后（27岁 vs 25岁），不计入连贯性
      记忆连贯性: z.number().min(0).max(3).default(0),
      // 进入场景5时的连贯性快照（锁定，不会因后续场景完成而改变）
      场景5进入时连贯性: z.number().min(0).max(3).optional(),

      // --- 每晚进度追踪（数值平衡：每晚上限20%） ---
      当晚进度记录: z
        .object({
          天数: z.number().default(0), // 记录是哪一天的进度
          嘴巴: z.number().default(0),
          胸部: z.number().default(0),
          下体: z.number().default(0),
          后穴: z.number().default(0),
          精神: z.number().default(0),
        })
        .default({ 天数: 0, 嘴巴: 0, 胸部: 0, 下体: 0, 后穴: 0, 精神: 0 }),
    })
    .default({
      已完成场景: [],
      正确重构场景: [],
      记忆混乱度: 0,
      混乱结局: {
        已标记: false,
        标记时间: null,
        触发时间: null,
        已触发: false,
        触发原因: null,
        性行为次数: 0,
      },
      记忆连贯性: 0,
      当晚进度记录: { 天数: 0, 嘴巴: 0, 胸部: 0, 下体: 0, 后穴: 0, 精神: 0 },
    }),

  // ============================================
  // 现实数据（日常互动）
  // ============================================
  现实数据: z
    .object({
      // --- 威胁数值（现实路线专属） ---
      丈夫怀疑度: z.number().min(0).max(100).default(0), // 达到100触发坏结局

      // --- 丈夫状态 ---
      丈夫当前位置: z.enum(['客厅', '卧室', '书房', '厨房', '外出']).default('客厅'),

      // --- 丈夫心理活动（真相模式状态栏显示，AI生成） ---
      丈夫心理活动: z.string().optional(), // 基于怀疑度、服装、依存度和剧情生成，约50字
    })
    .default({
      丈夫怀疑度: 0,
      丈夫当前位置: '客厅',
    }),

  // ============================================
  // 结局系统
  // ============================================
  结局数据: z
    .object({
      // 结局类型说明（2026-01-18 更新）：
      // - 未触发：游戏进行中
      // - 真好结局：完成全部5场景+正确重构（原"堕落结局"）
      // - 完美真爱结局：真好结局 + 记忆连贯性=3（完美记忆路线）
      // - 假好结局：完成全部5场景但有错误选择
      // - 坏结局：怀疑度>=100（被丈夫发现）
      // - 混乱结局：混乱度>=100（精神崩溃，由confusionEndingSystem处理）
      // - 普通结局：时间耗尽但未完成（进入过梦境但未完成全部场景）
      // - 纯爱结局：时间耗尽+未进入过梦境（无法突破时间循环，坏结局性质）
      当前结局: z
        .enum(['未触发', '真好结局', '完美真爱结局', '假好结局', '坏结局', '普通结局', '纯爱结局'])
        .default('未触发'),
      结局触发时间: z.string().optional(), // 记录结局触发时的时间
      后日谈已解锁: z.boolean().default(false),
      // 完美真爱结局专属标记
      是完美记忆路线: z.boolean().default(false), // 记忆连贯性=3

      // --- ROLL 检测系统（结局入口 ROLL 支持） ---
      // 记录上次结局入口的楼层ID，用于在 CHAT_COMPLETION_PROMPT_READY 中检测 ROLL
      _结局入口记录: z
        .object({
          楼层ID: z.number().default(-1), // 上次入口时的 AI 回复楼层ID
          结局类型: z.enum(['真好结局', '完美真爱结局', '假好结局']).optional(),
        })
        .optional(),

      // --- 后日谈系统（2026-01-17 新增） ---
      // 后日谈是结局完成后的"奖励模式"，让玩家体验结局后的日常
      后日谈: z
        .object({
          已触发: z.boolean().default(false), // 后日谈是否已开始
          当前轮数: z.number().min(0).max(2).default(0), // 当前对话轮数（0-2）
          已完成: z.boolean().default(false), // 后日谈是否已结束
          自由模式: z.boolean().default(false), // 后日谈完成后解锁自由模式
          // --- ROLL 检测系统（Bug #22 修复） ---
          // 记录上次轮数推进的楼层ID和swipe_id，用于检测 ROLL 操作
          上次推进记录: z
            .object({
              楼层ID: z.number().default(-1), // 上次推进时的消息楼层ID
              swipe_id: z.number().default(0), // 上次推进时的 swipe_id
            })
            .optional(),
        })
        .default({
          已触发: false,
          当前轮数: 0,
          已完成: false,
          自由模式: false,
        }),
    })
    .default({
      当前结局: '未触发',
      后日谈已解锁: false,
      是完美记忆路线: false,
      后日谈: {
        已触发: false,
        当前轮数: 0,
        已完成: false,
        自由模式: false,
      },
    }),

  // ============================================
  // 真好结局线性剧情状态
  // ============================================
  真好结局状态: z
    .object({
      // --- 激活状态 ---
      isActive: z.boolean().default(false), // 是否已激活真好结局流程
      isComplete: z.boolean().default(false), // 是否已完成

      // --- 阶段进度 ---
      currentPhase: z.number().min(0).max(9).default(0), // 当前阶段 (0-9)
      turnsInPhase: z.number().default(0), // 当前阶段的对话轮数
      totalTurns: z.number().default(0), // 总对话轮数

      // --- 锚点事件追踪 ---
      completedAnchors: z.array(z.string()).default([]), // 已完成的锚点事件

      // --- 玩家引导机制（Bug #15 修复） ---
      noProgressTurns: z.number().default(0), // 玩家连续未触发锚点的轮数
      hintGiven: z.boolean().default(false), // 当前阶段是否已给出引导提示
    })
    .optional(),

  // ============================================
  // 完美真爱结局线性剧情状态（12步婚礼仪式）
  // ============================================
  完美真爱结局状态: z
    .object({
      // --- 激活状态 ---
      isActive: z.boolean().default(false), // 是否已激活完美真爱结局流程
      isComplete: z.boolean().default(false), // 是否已完成

      // --- 阶段进度 ---
      currentPhase: z.number().min(0).max(11).default(0), // 当前阶段 (0-11)
      turnsInPhase: z.number().default(0), // 当前阶段的对话轮数
      totalTurns: z.number().default(0), // 总对话轮数

      // --- 锚点事件追踪 ---
      completedAnchors: z.array(z.string()).default([]), // 已完成的锚点事件

      // --- 玩家引导机制（Bug #15 修复） ---
      noProgressTurns: z.number().default(0), // 玩家连续未触发锚点的轮数
      hintGiven: z.boolean().default(false), // 当前阶段是否已给出引导提示
    })
    .optional(),

  // ============================================
  // 假好结局线性剧情状态
  // ============================================
  假好结局状态: z
    .object({
      // --- 激活状态 ---
      isActive: z.boolean().default(false), // 是否已激活假好结局流程
      isComplete: z.boolean().default(false), // 是否已完成

      // --- 阶段进度 ---
      currentPhase: z.number().min(0).max(7).default(0), // 当前阶段 (0-7)
      turnsInPhase: z.number().default(0), // 当前阶段的对话轮数
      totalTurns: z.number().default(0), // 总对话轮数

      // --- 锚点事件追踪 ---
      completedAnchors: z.array(z.string()).default([]), // 已完成的锚点事件

      // --- 玩家引导机制（Bug #15 修复） ---
      noProgressTurns: z.number().default(0), // 玩家连续未触发锚点的轮数
      hintGiven: z.boolean().default(false), // 当前阶段是否已给出引导提示
    })
    .optional(),

  // ============================================
  // 调试数据（可选）
  // ============================================
  调试: z
    .object({
      时间更新历史: z.array(z.string()).default([]), // 记录最近10次时间更新
      楼层时间记录: z.record(z.string(), z.string()).default({}), // {楼层ID: 时间}
      启用调试日志: z.boolean().default(false),
    })
    .optional(),
});

export type Schema = z.output<typeof Schema>;
