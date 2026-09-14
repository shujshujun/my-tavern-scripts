type 原始记录 = { mesId?: unknown; rawPrompt?: unknown; presetName?: unknown; recordId?: unknown };
type 只读存储 = { getItem: (键: string) => Promise<unknown> };

/** 兼容 SillyTavern 完整记录、TauriTavern 惰性索引，以及仍保留的旧格式记录。只读当前聊天。 */
export async function 读取酒馆提示词记录(参数: {
  楼: number;
  聊天ID: string;
  索引: readonly 原始记录[];
  存储: () => Promise<只读存储 | undefined>;
}): Promise<原始记录 | undefined> {
  if (!Number.isInteger(参数.楼) || 参数.楼 < 0) return undefined;
  const 匹配 = (记录: 原始记录 | undefined) => 记录 && Number(记录.mesId) === 参数.楼;
  const 有正文 = (记录: 原始记录 | undefined) => 匹配(记录) && 记录?.rawPrompt != null;
  const 当前 = 参数.索引.find(记录 => 匹配(记录));
  if (有正文(当前)) return 当前;
  if (!参数.聊天ID) return undefined;
  const 存储 = await 参数.存储();
  if (!存储) return undefined;
  // 内存索引可能尚未恢复；读取同一聊天的持久索引，不以其它楼的提示词兜底。
  const 持久索引 = 当前 ? undefined : await 存储.getItem(`tt_prompts_index:${参数.聊天ID}`);
  const 索引项: 原始记录 | undefined =
    当前 ?? (Array.isArray(持久索引) ? 持久索引.find(记录 => 匹配(记录)) : undefined);
  if (typeof 索引项?.recordId === 'string') {
    const 记录 = (await 存储.getItem(`tt_prompts_record:${参数.聊天ID}:${索引项.recordId}`)) as 原始记录 | undefined;
    if (有正文(记录)) return 记录;
  }
  const 旧记录 = await 存储.getItem(参数.聊天ID);
  return Array.isArray(旧记录) ? 旧记录.find(记录 => 有正文(记录)) : undefined;
}
