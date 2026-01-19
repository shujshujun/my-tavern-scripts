import type { Schema as SchemaType } from '../../schema';

/**
 * 界面文本映射系统
 *
 * 基于"已进入过梦境"变量，动态切换界面显示文本：
 * - 纯爱模式（未进入梦境）：伪装成纯爱恋爱游戏
 * - 真相模式（进入梦境后）：显示真实的NTR术语
 *
 * 游戏逻辑完全不变，只是显示的文字不同，实现认知落差效果。
 */

/**
 * 文本映射表
 */
export const 文本映射表 = {
  // 核心数值名称
  依存度: { 纯爱: '好感度', 真相: '对主角依存度' },
  道德底线: { 纯爱: '矜持度', 真相: '道德底线' },
  对丈夫依存度: { 纯爱: '家庭责任感', 真相: '对丈夫依存度' },

  // 境界名称（5个境界）- 纯爱模式伪装成母子关系修复游戏
  境界1: { 纯爱: '陌生', 真相: '初染' },
  境界2: { 纯爱: '破冰', 真相: '迷途' },
  境界3: { 纯爱: '信任', 真相: '溺深' },
  境界4: { 纯爱: '依恋', 真相: '归虚' },
  境界5: { 纯爱: '羁绊', 真相: '焚誓' },

  // 部位开发进度名称
  嘴巴认知: { 纯爱: '亲密度·嘴', 真相: '嘴巴认知开发度' },
  胸部认知: { 纯爱: '亲密度·胸', 真相: '胸部认知开发度' },
  下体认知: { 纯爱: '亲密度·下', 真相: '下体认知开发度' },
  后穴认知: { 纯爱: '亲密度·后', 真相: '后穴认知开发度' },
  精神认知: { 纯爱: '精神连结', 真相: '精神认知开发度' },

  // 威胁数值（只在真相模式显示）
  记忆混乱度: { 纯爱: null, 真相: '记忆混乱度' },
  丈夫怀疑度: { 纯爱: null, 真相: '丈夫怀疑度' },
} as const;

/**
 * 获取显示文本
 * @param key 映射键名
 * @param data 游戏数据
 * @returns 显示文本（纯爱模式 or 真相模式）
 */
export function getDisplayText(key: keyof typeof 文本映射表, data: SchemaType): string | null {
  const 当前模式 = data.世界.已进入过梦境 ? '真相' : '纯爱';
  return 文本映射表[key][当前模式];
}

/**
 * 获取境界显示名称
 * @param 境界等级 1-5
 * @param data 游戏数据
 * @returns 境界显示名称
 */
export function getRealmName(境界等级: number, data: SchemaType): string {
  const key = `境界${境界等级}` as keyof typeof 文本映射表;
  return getDisplayText(key, data) ?? `境界${境界等级}`;
}

/**
 * 获取部位显示名称
 * @param 部位名称 嘴巴 | 胸部 | 下体 | 后穴 | 精神
 * @param data 游戏数据
 * @returns 部位显示名称
 */
export function getBodyPartName(部位名称: '嘴巴' | '胸部' | '下体' | '后穴' | '精神', data: SchemaType): string {
  const key = `${部位名称}认知` as keyof typeof 文本映射表;
  return getDisplayText(key, data) ?? 部位名称;
}

/**
 * 检查是否应该显示威胁数值
 * @param data 游戏数据
 * @returns 是否显示（只在真相模式显示）
 */
export function shouldShowThreatValues(data: SchemaType): boolean {
  return data.世界.已进入过梦境;
}

/**
 * 生成系统提示文本（根据模式切换）
 */
export const 系统提示映射 = {
  依存度提升: {
    纯爱: (value: number) => `赵霞对你的好感提升了！(+${value})`,
    真相: (value: number) => `赵霞对你的依存度提升，她越来越需要你。(+${value})`,
  },
  部位开发: {
    纯爱: (_部位: string, _value: number) => `你们的关系更加亲密了。`,
    真相: (部位: string, value: number) => `${部位}认知开发度 +${value}`,
  },
  道德下降: {
    纯爱: (_value: number) => `她对你的信任增加了。`,
    真相: (value: number) => `道德底线 -${value}（越来越能接受禁忌行为）`,
  },
  境界提升: {
    纯爱: (旧境界: string, 新境界: string) => `关系提升：${旧境界} → ${新境界}`,
    真相: (旧境界: string, 新境界: string) => `境界提升：${旧境界} → ${新境界}`,
  },
  丈夫打断: {
    纯爱: () => `赵霞突然想起了一些事情...`,
    真相: () => `【丈夫打断】苏文突然回家，行为被迫中断。`,
  },
};

/**
 * 获取系统提示文本
 */
export function getSystemHint(type: keyof typeof 系统提示映射, data: SchemaType, ...args: unknown[]): string {
  const 当前模式 = data.世界.已进入过梦境 ? '真相' : '纯爱';
  const hintFn = 系统提示映射[type][当前模式] as (...args: unknown[]) => string;
  return hintFn(...args);
}
