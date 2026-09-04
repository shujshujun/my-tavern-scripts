export interface 可分组房间动作 {
  分组?: string;
}

export interface 桌面302共居动作分组<T> {
  普通动作: T[];
  共居动作: T[];
}

/**
 * 只在电脑端302入口启用第二层折叠。手机已有整组房内操作抽屉，不能再套一层；
 * 其他房间或结局前没有共居生产者标记时，原动作顺序与数量完全不变。
 */
export function 划分桌面302共居动作<T extends 可分组房间动作>(
  actions: readonly T[],
  启用: boolean,
  mobile: boolean,
): 桌面302共居动作分组<T> {
  if (!启用 || mobile) return { 普通动作: [...actions], 共居动作: [] };
  const 共居动作 = actions.filter(动作 => 动作.分组 === '302共居');
  if (!共居动作.length) return { 普通动作: [...actions], 共居动作: [] };
  return {
    普通动作: actions.filter(动作 => 动作.分组 !== '302共居'),
    共居动作,
  };
}
