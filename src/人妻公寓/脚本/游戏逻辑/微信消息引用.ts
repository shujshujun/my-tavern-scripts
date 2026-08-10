import type { 微信消息定位, 微信消息记录 } from './微信消息撤回';

export interface 微信引用展示 {
  发送者: string;
  摘要: string;
  已撤回: boolean;
}

export interface 微信引用解析结果 {
  正文: string;
  引用?: 微信消息定位;
}

export interface 群聊引用响应约束 {
  /** 被玩家引用、必须回复的群成员。 */
  必答角色: string;
  /** 按角色状态概率选中的另一位跟聊者；没有命中时为空。 */
  跟聊角色?: string;
  /** 只供提示词塑造本轮跟聊口吻，不改变任何数值。 */
  跟聊画像?: string;
  /** 标在实际跟聊气泡上，用于同群最近十条消息硬冷却。 */
  跟聊事件键?: string;
  /** 模型漏掉指定角色时使用的安全本地兜底。 */
  必答兜底: string;
  跟聊兜底?: string;
}

export interface 微信引用跟聊数值 {
  阶段: number;
  好感: number;
  堕落: number;
  婚姻: number;
}

function 限幅01(值: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(值) ? 值 : 0));
}

/** 楼务群 6%~12%，姐妹群 12%~22%；数值只能在低频区间内加权，绝不突破上限。 */
export function 计算微信引用跟聊概率(会话: '群' | '姐妹群', 候选: readonly 微信引用跟聊数值[]): number {
  const 基础 = 会话 === '姐妹群' ? 0.12 : 0.06;
  const 上限 = 会话 === '姐妹群' ? 0.22 : 0.12;
  if (!候选.length) return 0;
  const 热度 = Math.max(
    ...候选.map(妻 =>
      限幅01(
        (妻.阶段 / 5) * 0.32 +
          限幅01(妻.好感 / 100) * 0.24 +
          限幅01(妻.堕落 / 100) * 0.27 +
          (1 - 限幅01(妻.婚姻 / 100)) * 0.17,
      ),
    ),
  );
  return Math.min(上限, 基础 + 热度 * (上限 - 基础));
}

function 合法序(序: unknown): 序 is number {
  return typeof 序 === 'number' && 序 >= 0 && Number.isSafeInteger(序);
}

function 规范比较文本(文: string): string {
  return String(文 ?? '')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function 创建微信消息定位(消息: 微信消息记录 | undefined): 微信消息定位 | null {
  if (!消息) return null;
  const 标识 = String(消息.标识 ?? '').trim();
  if (标识) return { 标识 };
  return 合法序(消息.序) ? { 序: 消息.序 } : null;
}

export function 定位微信消息<T extends 微信消息记录>(
  消息们: readonly T[],
  定位: 微信消息定位 | undefined,
): T | undefined {
  if (!定位) return undefined;
  const 标识 = String(定位.标识 ?? '').trim();
  if (标识) return 消息们.find(消息 => 消息.标识 === 标识);
  if (合法序(定位.序)) return 消息们.find(消息 => 消息.序 === 定位.序);
  return undefined;
}

export function 微信消息可引用(消息: 微信消息记录 | undefined): 消息 is 微信消息记录 {
  return !!消息 && 消息.发 !== '系统' && 消息.类 !== '撤回' && 消息.类 !== '通话' && 创建微信消息定位(消息) !== null;
}

export function 创建微信引用定位(消息们: readonly 微信消息记录[], 索引: number): 微信消息定位 | null {
  const 目标 = 消息们[索引];
  return 微信消息可引用(目标) ? 创建微信消息定位(目标) : null;
}

/** 群消息持久正文是“发言人:内容”；其余会话正文原样返回。 */
export function 微信消息正文(消息: 微信消息记录): string {
  if ((消息.会话 === '群' || 消息.会话 === '姐妹群') && 消息.发 === '对方') {
    const 匹配 = 消息.文.match(/^[^:：\n]{1,20}[:：]\s*([\s\S]*)$/u);
    if (匹配) return 匹配[1].trim() || (消息.图 ? '[图片]' : '');
  }
  return 消息.文.trim() || (消息.图 ? '[图片]' : '');
}

export function 微信消息发送者(消息: 微信消息记录, 玩家姓名: string, 私聊对方名 = ''): string {
  if (消息.发 === '我') return 玩家姓名;
  if (消息.发 === '系统') return '系统';
  if (消息.会话 === '群' || 消息.会话 === '姐妹群') {
    return 消息.文.match(/^([^:：\n]{1,20})[:：]/u)?.[1]?.trim() || '群成员';
  }
  return 私聊对方名 || 消息.会话;
}

export function 解析微信引用展示(
  消息们: readonly 微信消息记录[],
  引用: 微信消息定位 | undefined,
  玩家姓名: string,
  私聊对方名 = '',
  摘要上限 = 36,
  限定会话?: string,
): 微信引用展示 | null {
  if (!引用) return null;
  const 目标 = 定位微信消息(消息们, 引用);
  if (!目标 || 目标.类 === '撤回' || 目标.发 === '系统' || (限定会话 !== undefined && 目标.会话 !== 限定会话)) {
    return { 发送者: '', 摘要: '原消息已撤回', 已撤回: true };
  }
  const 原文 = 微信消息正文(目标);
  if (!原文) return { 发送者: '', 摘要: '原消息已撤回', 已撤回: true };
  const 摘要 = 原文.length > 摘要上限 ? `${原文.slice(0, 摘要上限)}…` : 原文;
  return { 发送者: 微信消息发送者(目标, 玩家姓名, 私聊对方名), 摘要, 已撤回: false };
}

/** 把一条真实消息序列化成柚月兼容的提示行；失效引用永不带回旧原文。 */
export function 微信消息提示行(
  消息: 微信消息记录,
  消息们: readonly 微信消息记录[],
  玩家姓名: string,
  私聊对方名 = '',
): string {
  const 发送者 = 微信消息发送者(消息, 玩家姓名, 私聊对方名);
  const 正文 = 微信消息正文(消息);
  const 引用展示 = 解析微信引用展示(消息们, 消息.引用, 玩家姓名, 私聊对方名, Number.MAX_SAFE_INTEGER, 消息.会话);
  const 引用前缀 = 引用展示
    ? 引用展示.已撤回
      ? '「引用 原消息已撤回」'
      : `「引用 ${引用展示.发送者}: ${引用展示.摘要}」`
    : '';
  return `${发送者}:${引用前缀}${正文}`;
}

/**
 * 解析 AI 的 `「引用 发送者: 内容」回复`。引用对象必须在本次提示历史中真实存在，
 * 且具备稳定定位；任何幻造、空回复或跨会话匹配都整条拒绝。
 */
export function 解析微信AI引用前缀(
  原: string,
  提示历史: readonly 微信消息记录[],
  会话: string,
  玩家姓名: string,
  私聊对方名 = '',
): 微信引用解析结果 | null {
  const 文 = String(原 ?? '').trim();
  if (!文.startsWith('「引用')) return 文 ? { 正文: 文 } : null;
  const 匹配 = 文.match(/^「引用\s+([^:：」]{1,24})[:：]\s*([^」]+)」\s*(.+)$/u);
  if (!匹配) return null;
  const 发送者 = 规范比较文本(匹配[1]);
  const 被引用内容 = 规范比较文本(匹配[2]);
  const 正文 = 匹配[3].trim();
  if (!发送者 || !被引用内容 || !正文) return null;

  const 目标 = [...提示历史]
    .reverse()
    .find(
      消息 =>
        消息.会话 === 会话 &&
        微信消息可引用(消息) &&
        微信消息发送者(消息, 玩家姓名, 私聊对方名) === 发送者 &&
        规范比较文本(微信消息正文(消息)) === 被引用内容,
    );
  const 定位 = 创建微信消息定位(目标);
  return 定位 ? { 正文, 引用: 定位 } : null;
}

function 拆群消息(消息: string): { 发言人: string; 正文: string } | null {
  const 匹配 = String(消息 ?? '').match(/^([^:：\n]{1,20})[:：]\s*(.+)$/u);
  return 匹配 ? { 发言人: 匹配[1].trim(), 正文: 匹配[2].trim() } : null;
}

/**
 * 不新增 AI 请求的确定性兜底：保留已生成正文，只把缺失的指定槽位归给指定角色；
 * 若输出条数不足，才追加调用方按角色状态准备的安全短句。
 */
export function 确保群聊指定角色发言(
  消息们: readonly string[],
  约束: 群聊引用响应约束 | undefined,
  最多条数: number,
): string[] {
  const 上限 = Math.max(0, Math.floor(最多条数));
  if (上限 === 0) return [];
  const 结果 = 消息们.map(拆群消息).filter((项): 项 is { 发言人: string; 正文: string } => !!项);
  if (!约束) return 结果.slice(0, 上限).map(项 => `${项.发言人}:${项.正文}`);
  const 指定 = [
    { 姓名: 约束.必答角色, 兜底: 约束.必答兜底 },
    ...(约束.跟聊角色 ? [{ 姓名: 约束.跟聊角色, 兜底: 约束.跟聊兜底 || '我也正想接这句。' }] : []),
  ].filter(项 => 项.姓名);
  const 指定名 = new Set(指定.map(项 => 项.姓名));

  for (const 项 of 指定) {
    if (结果.some(消息 => 消息.发言人 === 项.姓名)) continue;
    const 兜底正文 = 项.兜底.trim();
    if (!兜底正文) continue;
    const 可替换 = 结果.findIndex(消息 => !指定名.has(消息.发言人));
    if (可替换 >= 0) 结果[可替换] = { 发言人: 项.姓名, 正文: 兜底正文 };
    else if (结果.length < 上限) 结果.push({ 发言人: 项.姓名, 正文: 兜底正文 });
    else if (项.姓名 === 约束.必答角色) {
      const 重复槽 = 结果.findIndex((消息, 索引) => 结果.findIndex(前 => 前.发言人 === 消息.发言人) !== 索引);
      const 替换位 = 重复槽 >= 0 ? 重复槽 : Math.max(0, 结果.length - 1);
      结果[替换位] = { 发言人: 项.姓名, 正文: 兜底正文 };
    }
  }
  const 必答位 = 结果.findIndex(消息 => 消息.发言人 === 约束.必答角色);
  if (必答位 > 0) 结果.unshift(...结果.splice(必答位, 1));
  if (约束.跟聊角色) {
    const 跟聊位 = 结果.findIndex(消息 => 消息.发言人 === 约束.跟聊角色);
    if (跟聊位 >= 0 && 跟聊位 !== 1) 结果.splice(1, 0, ...结果.splice(跟聊位, 1));
  }
  return 结果.slice(0, 上限).map(项 => `${项.发言人}:${项.正文}`);
}
