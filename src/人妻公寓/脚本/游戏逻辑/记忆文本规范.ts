/**
 * 记忆/摘要文本的规范化边界。
 *
 * 历史实现直接把 `normalize('NFKC')` 的结果当成保存值，导致中文全角标点被折叠成半角
 * （`，`→`,`、`？`→`?`、`：`→`:`），玩家在数据库面板里看到的就是“中文配 ASCII 标点”
 * 的乱码感文本。NFKC 的真实用途只是让“全角伪装的指令”无法绕过检测，因此这里拆成两层：
 *
 * - `规范可读文本`：保存与展示用。只做控制字符清理与空白折叠，不改任何可见字形。
 * - `折叠检测文本`：安全检测用。做 NFKC + 兼容折叠，仅供正则匹配，绝不写回存储。
 */

/** 控制字符（保留常规空白由调用方决定）→ 空格，随后折叠连续空白。 */
export function 规范可读文本(值: unknown): string {
  return [...String(值 ?? '')]
    .map(字符 => {
      const code = 字符.codePointAt(0) ?? 0;
      // C0/C1 控制字符、DEL、零宽与方向控制符都不该出现在记忆文本里。
      if (code < 32 || code === 127 || (code >= 0x80 && code <= 0x9f)) return ' ';
      if (code === 0x200b || code === 0x200c || code === 0x200d || code === 0xfeff) return '';
      if (code >= 0x202a && code <= 0x202e) return '';
      if (code >= 0x2066 && code <= 0x2069) return '';
      return 字符;
    })
    .join('')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** 仅用于指令注入检测的折叠副本；含全角→半角，不可用作保存值。 */
export function 折叠检测文本(值: unknown): string {
  return String(值 ?? '')
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .trim();
}
