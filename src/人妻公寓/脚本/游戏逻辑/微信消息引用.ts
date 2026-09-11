import type { 微信消息定位, 微信消息记录 } from './微信消息撤回';

export interface 微信引用展示 {
  发送者: string;
  摘要: string;
  已撤回: boolean;
}

export interface 微信引用解析结果 {
  正文: string;
  引用?: 微信消息定位;
  /** 仅供调用方决定是否需要更严格验收；不会写入微信消息库。 */
  引用已降级?: true;
}

export interface 微信引用解析选项 {
  /** 引用目标不存在、失效或被模型改写时，剥掉前缀并保留后续角色回复。 */
  引用失配时保留回复?: boolean;
  /** 识别模型遗漏“引用”二字的 `「发送者: 内容」回复` 兼容格式。 */
  识别无标记引用?: boolean;
}

interface 微信前置引用片段 {
  发送者: string;
  被引用内容: string;
  正文: string;
}

export interface 群聊引用响应约束 {
  /** 被玩家引用、必须回复的群成员。 */
  必答角色: string;
  /** 被引用角色的当前结构化画像，只供模型决定如何回应。 */
  必答画像: string;
  /** 按角色状态概率选中的另一位跟聊者；没有命中时为空。 */
  跟聊角色?: string;
  /** 只供提示词塑造本轮跟聊口吻，不改变任何数值。 */
  跟聊画像?: string;
  /** 标在实际跟聊气泡上，用于同群最近十条消息硬冷却。 */
  跟聊事件键?: string;
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
  if (
    消息.会话 === '父亲' &&
    (消息.键 === '回国:父亲会话:母亲确认无需收尾' ||
      消息.键 === '回国:父亲会话:母亲确认准备交接' ||
      消息.键 === '回国:父亲会话:母亲确认回国日')
  )
    return '母亲';
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

function 拆微信前置引用(文: string, 显式引用: boolean): 微信前置引用片段 | null {
  const 匹配 = 显式引用
    ? 文.match(/^「引用\s*([^:：」]{1,24})[:：]\s*([^」]+)」\s*(.+)$/u)
    : 文.match(/^「\s*([^:：」]{1,24})[:：]\s*([^」]+)」\s*(.+)$/u);
  if (!匹配) return null;
  const 发送者 = 规范比较文本(匹配[1]);
  const 被引用内容 = 规范比较文本(匹配[2]);
  const 正文 = 匹配[3].trim();
  return 发送者 && 被引用内容 && 正文 ? { 发送者, 被引用内容, 正文 } : null;
}

function 查找微信引用目标(
  提示历史: readonly 微信消息记录[],
  会话: string,
  玩家姓名: string,
  私聊对方名: string,
  发送者: string,
  被引用内容: string,
): 微信消息记录 | undefined {
  return [...提示历史]
    .reverse()
    .find(
      消息 =>
        消息.会话 === 会话 &&
        微信消息可引用(消息) &&
        微信消息发送者(消息, 玩家姓名, 私聊对方名) === 发送者 &&
        规范比较文本(微信消息正文(消息)) === 被引用内容,
    );
}

function 同会话存在发送者(
  提示历史: readonly 微信消息记录[],
  会话: string,
  玩家姓名: string,
  私聊对方名: string,
  发送者: string,
): boolean {
  const 规范发送者 = 规范比较文本(发送者);
  if (规范发送者 === 规范比较文本(玩家姓名)) return true;
  if (私聊对方名 && 规范发送者 === 规范比较文本(私聊对方名)) return true;
  return 提示历史.some(
    消息 =>
      消息.会话 === 会话 &&
      消息.发 !== '系统' &&
      消息.类 !== '撤回' &&
      消息.类 !== '通话' &&
      规范比较文本(微信消息发送者(消息, 玩家姓名, 私聊对方名)) === 规范发送者,
  );
}

/**
 * 解析 AI 的 `「引用 发送者: 内容」回复`。
 *
 * 只有同会话、真实存在且具备稳定定位的原消息才会生成引用卡。默认仍保持群聊／阶段验收
 * 的严格语义：幻造、失效或跨会话引用整条拒绝。普通私聊可显式开启降级，只丢弃不可信
 * 的引用前缀并保留后续角色回复；还可兼容模型遗漏“引用”二字的 `「发送者: 内容」回复`，
 * 但仅在发送者确实出现在当前会话时识别，避免误剥普通标签引文。
 */
export function 解析微信AI引用前缀(
  原: string,
  提示历史: readonly 微信消息记录[],
  会话: string,
  玩家姓名: string,
  私聊对方名 = '',
  选项: 微信引用解析选项 = {},
): 微信引用解析结果 | null {
  const 文 = String(原 ?? '').trim();
  if (!文) return null;

  const 显式引用 = 文.startsWith('「引用');
  const 兼容无标记引用 = !显式引用 && 选项.识别无标记引用 === true && 文.startsWith('「');
  if (!显式引用 && !兼容无标记引用) return { 正文: 文 };

  const 片段 = 拆微信前置引用(文, 显式引用);
  if (!片段) {
    if (!显式引用 || !选项.引用失配时保留回复) return 显式引用 ? null : { 正文: 文 };
    // 引用标签或冒号被模型写坏时，只要还能可靠找到闭合引号与后续回复，就降级保留正文。
    const 可剥离前缀 = 文.match(/^「引用[^」]*」\s*(.+)$/u)?.[1]?.trim() ?? '';
    return 可剥离前缀 ? { 正文: 可剥离前缀, 引用已降级: true } : null;
  }

  if (!显式引用 && !同会话存在发送者(提示历史, 会话, 玩家姓名, 私聊对方名, 片段.发送者)) {
    return { 正文: 文 };
  }

  const 目标 = 查找微信引用目标(提示历史, 会话, 玩家姓名, 私聊对方名, 片段.发送者, 片段.被引用内容);
  const 定位 = 创建微信消息定位(目标);
  if (定位) return { 正文: 片段.正文, 引用: 定位 };
  return 选项.引用失配时保留回复 ? { 正文: 片段.正文, 引用已降级: true } : null;
}

function 拆群消息(消息: string): { 发言人: string; 正文: string } | null {
  const 匹配 = String(消息 ?? '').match(/^([^:：\n]{1,20})[:：]\s*(.+)$/u);
  return 匹配 ? { 发言人: 匹配[1].trim(), 正文: 匹配[2].trim() } : null;
}

/** 指定角色是模型输出的硬验收条件；任一缺失就整批拒绝，绝不改写说话人或本地补台词。 */
export function 确保群聊指定角色发言(
  消息们: readonly string[],
  约束: 群聊引用响应约束 | undefined,
  最多条数: number,
): string[] {
  const 上限 = Math.max(0, Math.floor(最多条数));
  if (上限 === 0) return [];
  const 结果 = 消息们.map(拆群消息).filter((项): 项 is { 发言人: string; 正文: string } => !!项);
  if (!约束) return 结果.slice(0, 上限).map(项 => `${项.发言人}:${项.正文}`);
  if (!结果.some(消息 => 消息.发言人 === 约束.必答角色)) return [];
  if (约束.跟聊角色 && !结果.some(消息 => 消息.发言人 === 约束.跟聊角色)) return [];
  const 必答位 = 结果.findIndex(消息 => 消息.发言人 === 约束.必答角色);
  if (必答位 > 0) 结果.unshift(...结果.splice(必答位, 1));
  if (约束.跟聊角色) {
    const 跟聊位 = 结果.findIndex(消息 => 消息.发言人 === 约束.跟聊角色);
    if (跟聊位 >= 0 && 跟聊位 !== 1) 结果.splice(1, 0, ...结果.splice(跟聊位, 1));
  }
  return 结果.slice(0, 上限).map(项 => `${项.发言人}:${项.正文}`);
}
