/** 同次生成的附加信息。可见聊天与事件完成分别处理，未知信息不能推进状态。 */
export interface 手机事件进度 {
  版本: 1;
  任务: string;
  目标: string;
  状态: '完成' | '继续' | '暂缓' | '拒绝' | '转移话题' | '未知';
  玩家意向: '继续' | '暂缓' | '拒绝' | '转移话题' | '未明确';
  依据: string[];
  消息总数: number;
  /** 只读补取所需的原步骤要求；不是新的剧情事实。 */
  观察要求?: string;
  自动识别已尝试?: boolean;
  识别错误?: string;
  /** 保留未确认范围的原回复；前端显示系统提示，手动只复核这份原稿。 */
  待确认发言?: { 消息: string[]; 上下文: string };
}

/** 附加块损坏只影响进度，不把 JSON 泄漏进气泡，也不吞掉此前的完整回复。 */
export function 分离手机事件进度(原: string): { 正文: string; 进度: unknown } {
  const 块 = [...原.matchAll(/<事件进度\s*>([\s\S]*?)<\/事件进度\s*>/gu)];
  let 进度: unknown;
  if (块.length === 1 && [...原.matchAll(/<事件进度\s*>/gu)].length === 1) {
    try { 进度 = JSON.parse(块[0][1]); } catch { /* 仍然保留聊天。 */ }
  }
  const 正文 = 原.replace(/<事件进度\s*>[\s\S]*?(?:<\/事件进度\s*>|(?=<\/回复\s*>)|$)/gu, '');
  return { 正文, 进度 };
}

export function 规范手机事件进度(原: unknown, 任务: string, 目标: string, 消息: readonly string[]): 手机事件进度 {
  const 未知: 手机事件进度 = { 版本: 1, 任务, 目标, 状态: '未知', 玩家意向: '未明确', 依据: [], 消息总数: 消息.length };
  if (!原 || typeof 原 !== 'object' || Array.isArray(原)) return 未知;
  const 值 = 原 as Record<string, unknown>;
  if (值.任务 !== 任务 || 值.目标 !== 目标 ||
    !['完成', '继续', '暂缓', '拒绝', '转移话题', '未知'].includes(String(值.状态)) ||
    !['继续', '暂缓', '拒绝', '转移话题', '未明确'].includes(String(值.玩家意向)) ||
    !Array.isArray(值.依据) || 值.依据.length > 8 ||
    !值.依据.every(项 => typeof 项 === 'string' && 项.trim() && 消息.some(文 => 文.includes(项)))) return 未知;
  return { ...未知, 状态: 值.状态 as 手机事件进度['状态'], 玩家意向: 值.玩家意向 as 手机事件进度['玩家意向'], 依据: [...值.依据] };
}

/** 不做措辞判断；只验证元数据、批次完整性及引用是否来自实际存下的气泡。 */
export function 手机事件进度可提交(消息: readonly { 文: string; 事件进度?: 手机事件进度 }[], 任务: string, 目标: string): boolean {
  const 进度 = 消息[0]?.事件进度;
  if (!进度 || 进度.版本 !== 1 || 进度.消息总数 !== 消息.length) return false;
  const 规范 = 规范手机事件进度(进度, 任务, 目标, 消息.map(项 => 项.文));
  return 规范.状态 === '完成' && ['继续', '未明确'].includes(规范.玩家意向) && 规范.依据.length > 0 &&
    消息.every(项 => JSON.stringify(项.事件进度) === JSON.stringify(进度));
}
