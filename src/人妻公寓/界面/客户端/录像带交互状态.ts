export interface 录像带交互记录 {
  id: string;
  类型: string;
  状态: string;
  失败次数: number;
  补偿可用: boolean;
}

export interface 录像带场景快照 {
  id?: unknown;
  阶段?: unknown;
  交互?: unknown;
}

export interface 录像带连点失败状态 {
  失败次数: number;
  补偿可用: boolean;
}

const 录像带202连点id = '录像带:202';
const 空失败状态: Readonly<录像带连点失败状态> = { 失败次数: 0, 补偿可用: false };

function 是记录(值: unknown): 值 is Record<string, unknown> {
  return typeof 值 === 'object' && 值 !== null && !Array.isArray(值);
}

function 规范失败次数(值: unknown): number {
  const 数 = Number(值);
  return Number.isFinite(数) && 数 > 0 ? Math.floor(数) : 0;
}

function 是录像带202连点幕(场景: unknown): 场景 is 录像带场景快照 {
  return 是记录(场景) && 场景.id === '录像带' && 场景.阶段 === '等待202';
}

/**
 * 刷新、回档和同楼重掷都只读当前 MVU 楼层快照；其他场景或阶段的通用交互数据不得串入。
 */
export function 读取录像带连点失败状态(场景: unknown): 录像带连点失败状态 {
  if (!是录像带202连点幕(场景) || !是记录(场景.交互) || 场景.交互.id !== 录像带202连点id) {
    return { ...空失败状态 };
  }
  const 失败次数 = 规范失败次数(场景.交互.失败次数);
  return { 失败次数, 补偿可用: 失败次数 >= 3 };
}

/** 一次完整的 5 秒尝试失败时才调用；单次点击计数不写 MVU。 */
export function 推进录像带连点失败(场景: unknown): 录像带交互记录 | null {
  if (!是录像带202连点幕(场景)) return null;
  const 失败次数 = 读取录像带连点失败状态(场景).失败次数 + 1;
  return {
    id: 录像带202连点id,
    类型: '连续点击',
    状态: '待操作',
    失败次数,
    补偿可用: 失败次数 >= 3,
  };
}
