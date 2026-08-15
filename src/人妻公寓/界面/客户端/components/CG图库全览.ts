import { ref } from 'vue';

export const CG全览触发次数 = 5;
export const CG全览连击窗口毫秒 = 3_000;

export interface CG全览连击状态 {
  次数: number;
  首次点击毫秒: number;
}

export interface CG全览连击结果 {
  状态: CG全览连击状态;
  应开启: boolean;
}

/** 仅在当前客户端会话共享，不写入存档，也不改变真实解锁进度。 */
export const CG全览模式 = ref(false);

export function 创建CG全览连击状态(): CG全览连击状态 {
  return { 次数: 0, 首次点击毫秒: 0 };
}

export function 记录CG全览标题点击(当前: CG全览连击状态, 当前毫秒: number): CG全览连击结果 {
  const 仍在窗口内 =
    当前.次数 > 0 && 当前毫秒 >= 当前.首次点击毫秒 && 当前毫秒 - 当前.首次点击毫秒 <= CG全览连击窗口毫秒;
  const 次数 = 仍在窗口内 ? 当前.次数 + 1 : 1;
  const 首次点击毫秒 = 仍在窗口内 ? 当前.首次点击毫秒 : 当前毫秒;
  const 应开启 = 次数 >= CG全览触发次数;

  return {
    状态: 应开启 ? 创建CG全览连击状态() : { 次数, 首次点击毫秒 },
    应开启,
  };
}

export function CG项可查看(已解锁: ReadonlySet<string>, id: string, 全览: boolean): boolean {
  return 全览 || 已解锁.has(id);
}
