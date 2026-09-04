export interface 朋友圈稳定键记录 {
  事件键?: string;
  长期记忆?: { 事件键?: string };
}

/** 随机日常没有稳定键；只有脚本硬事件参与最终提交幂等。 */
export function 朋友圈稳定事件键(条: 朋友圈稳定键记录): string {
  return String(条.事件键 ?? 条.长期记忆?.事件键 ?? '').trim();
}

export function 过滤朋友圈稳定事件重复<T extends 朋友圈稳定键记录>(已有: readonly 朋友圈稳定键记录[], 新增: readonly T[]): T[] {
  const 活键 = new Set(已有.map(朋友圈稳定事件键).filter(Boolean));
  return 新增.filter(条 => {
    const 键 = 朋友圈稳定事件键(条);
    if (!键) return true;
    if (活键.has(键)) return false;
    活键.add(键);
    return true;
  });
}
