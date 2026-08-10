/** 手机记录的正文楼锚、绝对时段与同楼同时段内的可选单调顺序。 */
export interface 手机时间记录 {
  楼: unknown;
  时: unknown;
  /**
   * v0.80 可选单调顺序：同楼同时段内区分先后。
   * 只由 写库增量 在真正落库时分配，不预先给调用方快照；旧无序记录保持原楼/时解释。
   * 值域仅限非负安全整数（`Number.isSafeInteger`），损坏序按无序遍历、不入锚。
   */
  序?: number;
}

/**
 * 与数字楼水位配对的时间锚。
 *
 * 楼字段是自校验锚：回档裁剪旧数字水位后，两者不一致即从存活记录重建。
 * v0.80 起可选 序：带序锚必须能精确对应存活记录，否则从存活记录重建（防回档 ABA）；
 * 序只接受非负安全整数，损坏序按无序锚回退。
 */
export interface 手机已读时锚 {
  楼: number;
  时: number;
  序?: number;
}

function 有效整数(值: unknown): number | null {
  return typeof 值 === 'number' && Number.isFinite(值) ? Math.trunc(值) : null;
}

/** 可选单调顺序的专用校验：只接受非负安全整数；小数/负数/非有限/超安全整数一律按无序遍历、不入锚。 */
function 有效顺序(值: unknown): number | null {
  return typeof 值 === 'number' && 值 >= 0 && Number.isSafeInteger(值) ? 值 : null;
}

function 数字楼水位(值: unknown): number {
  return 有效整数(值) ?? -1;
}

/** 创建同时写入楼水位时使用的复合时锚；记录有序时把序一并锚定。 */
export function 创建手机已读时锚(楼: unknown, 时: unknown, 序?: unknown): 手机已读时锚 {
  const 锚: 手机已读时锚 = { 楼: 数字楼水位(楼), 时: 有效整数(时) ?? -1 };
  const 整序 = 有效顺序(序);
  if (整序 !== null) 锚.序 = 整序;
  return 锚;
}

function 从记录重建时锚(楼: number, 记录: readonly 手机时间记录[], 当前绝对时段: number): 手机已读时锚 {
  let 时 = -1;
  let 序: number | undefined;
  // 当前时段 -1 是“MVU/stat 暂不可读”的哨兵而非世界时段 0：此时不设未知时段上界，
  // 直接取该楼可识别的最大时段，避免把存活历史的正时段水位错降成 -1。
  const 未知当前时段 = 当前绝对时段 === -1;
  for (const 项 of 记录) {
    if (有效整数(项.楼) !== 楼) continue;
    const 记录时 = 有效整数(项.时);
    if (记录时 === null) continue;
    if (!未知当前时段 && 记录时 > 当前绝对时段) continue;
    if (记录时 > 时) {
      时 = 记录时;
      序 = 有效顺序(项.序) ?? undefined;
    } else if (记录时 === 时) {
      // 同一最大时段内取最大序：重建水位要精确到玩家实际看到的最后一条，不能只到时段。
      const 项序 = 有效顺序(项.序);
      if (项序 !== null && (序 === undefined || 项序 > 序)) 序 = 项序;
    }
  }
  return 序 === undefined ? { 楼, 时 } : { 楼, 时, 序 };
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
    if (锚楼 === 楼 && 锚时 !== null) {
      // 当前时段 -1 未就绪时不得把匹配的正时段锚降成 -1（-1 不代表世界时段 0）。
      // 已就绪时锚时必须是合法非负值且不超前于世界钟；数字楼/锚时同为 -1 的
      // “从未读”哨兵原样保留，而数字楼非负、锚时 -1 的历史降级态落入下方重建。
      if (当前时 === -1 || (楼 >= 0 && 锚时 >= 0 && 锚时 <= 当前时)) {
        const 锚序 = 有效顺序(原.序);
        if (锚序 === null) return { 楼, 时: 锚时 };
        // v0.80 带序锚：对应记录被回档/swipe 裁掉后从存活记录重建，恢复同值不复活旧水位。
        if (
          已有记录.some(项 => 有效整数(项.楼) === 楼 && 有效整数(项.时) === 锚时 && 有效顺序(项.序) === 锚序)
        ) {
          return { 楼, 时: 锚时, 序: 锚序 };
        }
      }
    }
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

/**
 * 按楼号与绝对时段双重裁剪手机记录。
 *
 * 当前绝对时段为 -1 是“MVU/stat 暂不可读”的哨兵，不是世界时段 0，也不代表
 * “所有记录都在未来”：此时只放弃“记录时 <= 当前时段”这一项比较，楼轴
 * （记录楼、当前楼、记录楼 <= 当前楼）与记录时字段可识别性仍必须验证。
 */
export function 手机记录在当前时间线(记录: 手机时间记录, 当前楼: unknown, 当前绝对时段: unknown): boolean {
  const 记录楼 = 有效整数(记录.楼);
  const 楼 = 有效整数(当前楼);
  if (记录楼 === null || 楼 === null || 记录楼 > 楼) return false;
  const 记录时 = 有效整数(记录.时);
  if (记录时 === null) return false;
  const 当前时 = 有效整数(当前绝对时段);
  if (当前时 === -1) return true;
  return 当前时 !== null && 记录时 <= 当前时;
}

/**
 * 复合比较记录与已读水位：先楼、再时、同值时再比序。
 * 旧锚无序而新记录有序时，新记录视为未读；旧无序记录同楼同时仍保持旧兼容。
 */
export function 手机记录晚于已读(记录: 手机时间记录, 已读楼: unknown, 已读时锚: 手机已读时锚): boolean {
  const 记录楼 = 有效整数(记录.楼);
  if (记录楼 === null) return false;
  const 水位楼 = 数字楼水位(已读楼);
  if (记录楼 !== 水位楼) return 记录楼 > 水位楼;
  const 记录时 = 有效整数(记录.时);
  if (记录时 === null) return false;
  const 锚时 = 已读时锚.楼 === 水位楼 ? (有效整数(已读时锚.时) ?? -1) : -1;
  if (记录时 !== 锚时) return 记录时 > 锚时;
  // 同楼同时：记录有单调序则按序比较；旧锚无序而新记录有序 → 未读；
  // 旧无序记录面对有序锚时按“已读”解释（新有序记录插入在其后）。
  const 记录序 = 有效顺序(记录.序);
  const 锚序 = 已读时锚.楼 === 水位楼 ? 有效顺序(已读时锚.序) : null;
  if (记录序 !== null) return 锚序 === null || 记录序 > 锚序;
  return false;
}

/** 并发已读写入取较晚的复合水位；同楼同时时有序锚较晚。 */
export function 较晚手机已读时锚(a: 手机已读时锚, b: 手机已读时锚): 手机已读时锚 {
  if (a.楼 !== b.楼) return a.楼 > b.楼 ? a : b;
  if (a.时 !== b.时) return a.时 > b.时 ? a : b;
  const a序 = 有效顺序(a.序);
  const b序 = 有效顺序(b.序);
  if (a序 !== null && b序 !== null) return a序 >= b序 ? a : b;
  if (a序 !== null) return a;
  if (b序 !== null) return b;
  return a;
}

/** 取记录们中按 (楼,时,序) 复合顺序最晚的一条；旧无序记录按楼/时参与比较。 */
export function 最后手机时间记录<T extends 手机时间记录>(记录们: readonly T[]): T | undefined {
  let 最后: T | undefined;
  for (const 记录 of 记录们) {
    if (!最后) {
      最后 = 记录;
      continue;
    }
    if (手机记录晚于已读(记录, 最后.楼, 创建手机已读时锚(最后.楼, 最后.时, 最后.序))) 最后 = 记录;
  }
  return 最后;
}
