export interface 手机朋友圈图片记录 {
  谁?: unknown;
  图?: unknown;
}

const 圈图键前缀 = '圈图:';
const 圈图路径 = /(?:^|\/)(美食|自拍|居家|窗外|购物)_(\d+)(?:\.webp)?$/;
const 荣耀洞动态键 = /^荣耀洞动态:([^:]+):(\d+)$/;

function 是未来荣耀洞动态键(键: string, 目标时段: number): boolean {
  const 匹配 = 键.match(荣耀洞动态键);
  if (!匹配) return false;
  const 事件时段 = Number(匹配[2]);
  // 只删除能无歧义证明来自未来的新格式键；旧异常键保守保留并仍夹 value。
  return Number.isSafeInteger(事件时段) && 事件时段 > 目标时段;
}

/**
 * `_微信.节拍`历史上同时放了绝对时段水位和图片序号。
 * 回档时只夹时间水位；图片序号必须从已裁剪后的朋友圈事件日志重建。
 */
export function 裁剪手机节拍水位(
  节拍: Readonly<Record<string, unknown>>,
  目标绝对时段: number,
  存活朋友圈: readonly 手机朋友圈图片记录[],
  妻名按门牌: Readonly<Record<string, string>>,
): Record<string, number> {
  const 目标时段 = Number.isFinite(目标绝对时段) ? Math.max(0, Math.floor(目标绝对时段)) : 0;
  const 结果: Record<string, number> = {};

  for (const [键, value] of Object.entries(节拍)) {
    if (键.startsWith(圈图键前缀)) continue;
    if (是未来荣耀洞动态键(键, 目标时段)) continue;
    const 原水位 = Number(value);
    结果[键] = Math.min(Number.isFinite(原水位) ? 原水位 : 0, 目标时段);
  }

  const 门牌按妻名 = new Map(Object.entries(妻名按门牌).map(([门牌, 妻名]) => [妻名, 门牌] as const));
  // 朋友圈库是新到旧；每个类别遇到的第一条就是回档点仍存活的最新游标。
  for (const 条 of 存活朋友圈) {
    if (typeof 条.谁 !== 'string' || typeof 条.图 !== 'string') continue;
    const 门牌 = 门牌按妻名.get(条.谁);
    const 匹配 = 条.图.match(圈图路径);
    if (!门牌 || !匹配) continue;
    const 键 = `${圈图键前缀}${门牌}:${匹配[1]}`;
    if (!Object.prototype.hasOwnProperty.call(结果, 键)) 结果[键] = Number(匹配[2]);
  }

  return 结果;
}
