/** 手机记录的正文楼锚与绝对时段。 */
export interface 手机时间记录 {
  楼: unknown;
  时: unknown;
}

/**
 * 与数字楼水位配对的时间锚。
 *
 * 楼字段是自校验锚：回档裁剪旧数字水位后，两者不一致即从存活记录重建。
 */
export interface 手机已读时锚 {
  楼: number;
  时: number;
}

function 有效整数(值: unknown): number | null {
  return typeof 值 === 'number' && Number.isFinite(值) ? Math.trunc(值) : null;
}

function 数字楼水位(值: unknown): number {
  return 有效整数(值) ?? -1;
}

/** 创建同时写入楼水位时使用的复合时锚。 */
export function 创建手机已读时锚(楼: unknown, 时: unknown): 手机已读时锚 {
  return { 楼: 数字楼水位(楼), 时: 有效整数(时) ?? -1 };
}

function 从记录重建时锚(楼: number, 记录: readonly 手机时间记录[], 当前绝对时段: number): 手机已读时锚 {
  let 时 = -1;
  for (const 项 of 记录) {
    if (有效整数(项.楼) !== 楼) continue;
    const 记录时 = 有效整数(项.时);
    if (记录时 !== null && 记录时 <= 当前绝对时段) 时 = Math.max(时, 记录时);
  }
  return { 楼, 时 };
}

/**
 * 在回档裁剪或同楼时段回退后自动重建时锚。
 * 必须在本次新消息/新朋友圈追加前调用，才不会把同楼新时段内容误认为旧已读。
 */
export function 规范手机已读时锚(
  楼水位: unknown,
  时锚: unknown,
  已有记录: readonly 手机时间记录[],
  当前绝对时段: number,
): 手机已读时锚 {
  const 楼 = 数字楼水位(楼水位);
  const 当前时 = 有效整数(当前绝对时段) ?? -1;
  if (时锚 && typeof 时锚 === 'object') {
    const 原 = 时锚 as Partial<手机已读时锚>;
    const 锚楼 = 有效整数(原.楼);
    const 锚时 = 有效整数(原.时);
    if (锚楼 === 楼 && 锚时 !== null && 锚时 <= 当前时) return { 楼, 时: 锚时 };
  }
  return 从记录重建时锚(楼, 已有记录, 当前时);
}

/**
 * 删楼或同楼 swipe 后，用已经裁过枝的记录重建已读锚。
 *
 * 同楼 swipe 时，旧分支在切换楼留下的“已读到楼 N/时段 T”不能继承给新分支，即使新消息
 * 恰好也是楼 N、时段 T；因此水位强制退到 N-1。普通删楼则只把楼水位压回当前末楼。
 * 两种情况都不信任旧时锚，而是从存活记录重新推导，消除同值 ABA。
 */
export function 手机分支变更后已读时锚(
  楼水位: unknown,
  时锚: unknown,
  存活记录: readonly 手机时间记录[],
  当前绝对时段: number,
  切分支楼: number,
  当前楼: number,
): 手机已读时锚 {
  // 保留参数用于明确调用契约：分支变更一律作废旧时锚，不允许值相同就继续沿用。
  void 时锚;
  const 末楼 = 有效整数(当前楼) ?? -1;
  let 楼 = Math.min(数字楼水位(楼水位), 末楼);
  const 切楼 = 有效整数(切分支楼);
  if (切楼 !== null && 切楼 >= 0) 楼 = Math.min(楼, 切楼 - 1);
  return 从记录重建时锚(楼, 存活记录, 有效整数(当前绝对时段) ?? -1);
}

/** 按楼号与绝对时段双重裁剪手机记录。 */
export function 手机记录在当前时间线(记录: 手机时间记录, 当前楼: unknown, 当前绝对时段: unknown): boolean {
  const 记录楼 = 有效整数(记录.楼);
  const 楼 = 有效整数(当前楼);
  if (记录楼 === null || 楼 === null || 记录楼 > 楼) return false;
  const 记录时 = 有效整数(记录.时);
  if (记录时 === null) return false;
  const 当前时 = 有效整数(当前绝对时段);
  return 当前时 !== null && 记录时 <= 当前时;
}

/** 复合比较记录与已读水位。 */
export function 手机记录晚于已读(记录: 手机时间记录, 已读楼: unknown, 已读时锚: 手机已读时锚): boolean {
  const 记录楼 = 有效整数(记录.楼);
  if (记录楼 === null) return false;
  const 水位楼 = 数字楼水位(已读楼);
  if (记录楼 !== 水位楼) return 记录楼 > 水位楼;
  const 记录时 = 有效整数(记录.时);
  if (记录时 === null) return false;
  const 锚时 = 已读时锚.楼 === 水位楼 ? (有效整数(已读时锚.时) ?? -1) : -1;
  return 记录时 > 锚时;
}

/** 并发已读写入取较晚的复合水位。 */
export function 较晚手机已读时锚(a: 手机已读时锚, b: 手机已读时锚): 手机已读时锚 {
  if (a.楼 !== b.楼) return a.楼 > b.楼 ? a : b;
  return a.时 >= b.时 ? a : b;
}
