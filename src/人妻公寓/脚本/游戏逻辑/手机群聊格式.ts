/** 微信文案的“字”按汉字计算；英文、数字、标点和 emoji 不占汉字额度。 */
export function 汉字数(文本: string): number {
  return 文本.match(/\p{Script=Han}/gu)?.length ?? 0;
}

function 清理行首装饰(原: string): string {
  return 原.trim().replace(/^(?:[-*•]\s+|\d{1,2}[.、)]\s*)/u, '');
}

/** 这些是气泡正文里的自然小标题，不是新的群聊发言人。 */
export function 是无害冒号续行标签(标签: string): boolean {
  return /^(?:补充|另外|还有|备注|顺便|提醒|注意|时间|地点|原因|重点|安排|说明|PS|P\.S\.)$/iu.test(标签.trim());
}

/** 中文折行直接接回，英文/数字单词被排版折开时补一个空格。 */
export function 拼接自然折行(已有: string, 新行: string): string {
  const 左 = 已有.trimEnd();
  const 右 = 新行.trimStart();
  if (!左) return 右;
  if (!右) return 左;
  const 要空格 = /[A-Za-z0-9]$/u.test(左) && /^[A-Za-z0-9]/u.test(右);
  return `${左}${要空格 ? ' ' : ''}${右}`;
}

interface 群消息草稿 {
  发言人: string;
  内容: string;
}

/**
 * 把模型常见的全角冒号、Markdown 列表和自然折行收束成稳定的「发言人:内容」。
 * 只容忍排版差异；名单、空内容与汉字上限仍是硬门。
 */
export function 解析微信群消息(
  原: string,
  合法发言人: ReadonlySet<string>,
  最大字数: number,
  最多条数: number,
): string[] {
  const 结果: string[] = [];
  let 当前: 群消息草稿 | null = null;

  const 提交当前 = () => {
    if (!当前) return;
    const 内容 = 当前.内容.trim();
    if (内容 && 汉字数(内容) <= 最大字数) 结果.push(`${当前.发言人}:${内容}`);
    当前 = null;
  };

  for (const 原行 of String(原 ?? '').split(/\r\n?|\n/u)) {
    const 行 = 清理行首装饰(原行);
    if (!行 || /^```/.test(行)) continue;
    const 匹配 = 行.match(/^([^:：\n]{1,12})[:：]\s*(.*)$/u);
    if (匹配) {
      const 发言人 = 匹配[1].trim();
      const 内容 = 匹配[2].trim();
      if (合法发言人.has(发言人)) {
        提交当前();
        当前 = { 发言人, 内容 };
        continue;
      }
      // “补充：”“另外：”是同一气泡里的自然小标题，不得误判成名单外说话人。
      if (当前 && 是无害冒号续行标签(发言人)) {
        当前.内容 = 拼接自然折行(当前.内容, 行);
        continue;
      }
      提交当前();
      当前 = null;
      continue;
    }
    // 模型偶尔只因排版宽度把同一气泡折成两行；没有新发言人时接回上一条。
    if (当前) 当前.内容 = 拼接自然折行(当前.内容, 行);
  }
  提交当前();
  return 结果.slice(0, Math.max(0, 最多条数));
}

export function 验收单条群消息(原: string, 合法发言人: ReadonlySet<string>, 最大字数: number): string | null {
  return 解析微信群消息(原, 合法发言人, 最大字数, 1)[0] ?? null;
}
