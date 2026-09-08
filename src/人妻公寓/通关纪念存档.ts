import { z } from 'zod';

export const 通关评级列表 = ['C', 'B', 'A', 'S', 'SS', 'SSS'] as const;
export const 通关评级Schema = z.enum(通关评级列表);
export type 通关评级 = z.infer<typeof 通关评级Schema>;
const 数量 = z.number().int().nonnegative();

export const 通关成绩Schema = z.object({
  规则版本: z.literal(1),
  评级: 通关评级Schema,
  绝对时段: 数量,
  天数: 数量,
  角色: z.array(
    z.object({
      门牌: z.string(),
      姓名: z.string(),
      阶段: z.number().int().min(0).max(5),
      完成: z.boolean(),
      结局: z.string(),
      归宿: z.string(),
    }),
  ),
  结局线路数: 数量,
  特殊剧情: z.array(z.string()),
  服饰数: 数量,
  CG数: 数量,
  探索分: 数量.max(100),
  探索项: z.array(
    z.object({
      名称: z.string(),
      数量: 数量,
      目标: 数量,
      分数: 数量,
      上限: 数量,
      说明: z.string(),
    }),
  ),
});
export type 通关成绩 = z.infer<typeof 通关成绩Schema>;

/** 随消息快照保存；旧 v9 存档补空，不从浏览器跨局收藏反推本局历史。 */
export const 通关纪念Schema = z
  .object({
    全员完成时段: z.number().int().min(-1).prefault(-1),
    CG记录: z.array(z.string()).catch([]).prefault([]),
    首次成绩: 通关成绩Schema.nullable().catch(null).prefault(null),
    已庆祝评级: z.enum(['', 'S', 'SS', 'SSS']).catch('').prefault(''),
  })
  .prefault({});
export type 通关纪念 = z.infer<typeof 通关纪念Schema>;
