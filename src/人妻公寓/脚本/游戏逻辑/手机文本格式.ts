import { 汉字数, 拼接自然折行, 是无害冒号续行标签 } from './手机群聊格式';

export interface 手机单气泡规则 {
  最大汉字: number;
  /** 只剥第一条非空行开头的这些标签，正文内部冒号不受影响。 */
  可剥首标签?: readonly string[];
  /** 用于发现模型混入的第二说话人；普通“提醒：”等内容标签不在此列。 */
  已知说话人?: readonly string[];
  禁止多说话人?: boolean;
  /** 父亲来电等严格单说话人通道：自己的首标签以外，任何“标签:”行都拒绝。 */
  禁止任意说话人标签?: boolean;
}

function 清理单气泡行(原: string): string {
  return 原.trim().replace(/^(?:[-*•]\s+|\d{1,2}[.、)]\s*)/u, '');
}

interface 行内冒号标签 {
  标签: string;
  /** 保留给前一位说话人的文本终点，包含句号等自然分隔符。 */
  前段终点: number;
  正文起点: number;
}

const 行内说话人边界 = /[\s，。！？；;、—–：“”"'‘’（）()【】<>-]|\[|\]/u;
const 行内前句分隔 = /[\s，。！？；;、—–-]/u;

/** 从冒号向左取最近的词组，避免长前句把同行的“秘书:”藏进普通折行。 */
function 找首个非无害行内标签(文本: string): 行内冒号标签 | null {
  for (let 冒号位置 = 0; 冒号位置 < 文本.length; 冒号位置 += 1) {
    if (文本[冒号位置] !== ':' && 文本[冒号位置] !== '：') continue;
    let 边界位置 = 冒号位置 - 1;
    while (边界位置 >= 0 && !行内说话人边界.test(文本[边界位置])) 边界位置 -= 1;
    // 行首自然冒号由调用方按入口协议判断；这里仅负责真正的“同行第二标签”。
    if (边界位置 < 0) continue;
    const 标签 = 文本.slice(边界位置 + 1, 冒号位置).trim();
    if (!标签 || 是无害冒号续行标签(标签)) continue;
    let 正文起点 = 冒号位置 + 1;
    while (/\s/u.test(文本[正文起点] ?? '')) 正文起点 += 1;
    return { 标签, 前段终点: 边界位置 + 1, 正文起点 };
  }
  return null;
}

/** 严格单说话人通道只把句中自然小标题视为正文，其余边界后的“标签:”都按换人拒绝。 */
function 含可疑行内第二标签(文本: string): boolean {
  return 找首个非无害行内标签(文本) !== null;
}

/** 单条手机内容允许无害排版折行，但不改写玩家原句；仅供 AI 输出验收。 */
export function 规范手机单气泡(原: string, 规则: 手机单气泡规则): string | null {
  const 行们 = String(原 ?? '')
    .split(/\r\n?|\n/u)
    .map(清理单气泡行)
    .filter(行 => 行 && !/^```/.test(行));
  if (!行们.length) return null;

  const 可剥 = new Set((规则.可剥首标签 ?? []).map(值 => 值.trim()).filter(Boolean));
  const 已知 = new Set((规则.已知说话人 ?? []).map(值 => 值.trim()).filter(Boolean));
  const 内容行: string[] = [];
  let 已剥首标签 = false;
  for (let i = 0; i < 行们.length; i += 1) {
    const 行 = 行们[i];
    const 匹配 = 行.match(
      规则.禁止任意说话人标签 ? /^([^:：\n]+)[:：]\s*(.*)$/u : /^([^:：\n]{1,12})[:：]\s*(.*)$/u,
    );
    const 标签 = 匹配?.[1]?.trim() ?? '';
    if (i === 0 && 匹配 && 可剥.has(标签)) {
      已剥首标签 = true;
      const 首行内容 = 匹配[2].trim();
      if (规则.禁止任意说话人标签 && 含可疑行内第二标签(首行内容)) return null;
      if (首行内容) 内容行.push(首行内容);
      continue;
    }
    const 任意标签违规 =
      规则.禁止任意说话人标签 && i > 0 && !是无害冒号续行标签(标签);
    if (匹配 && (任意标签违规 || (规则.禁止多说话人 && 已知.has(标签)))) return null;
    if (规则.禁止任意说话人标签 && 含可疑行内第二标签(行)) return null;
    // 首标签独占一行时，下一行仍是同一个气泡正文。
    if (i === 1 && 已剥首标签 && !内容行.length) 内容行.push(行);
    else 内容行.push(行);
  }

  const 文 = 内容行.reduce((累计, 行) => 拼接自然折行(累计, 行), '').trim();
  if (!文 || 汉字数(文) > Math.max(0, 规则.最大汉字)) return null;
  return 文;
}

/**
 * 私聊正常协议为“妻名:一只气泡”逐行输出；协议被预设压掉时，把全部自然折行回退成一只完整气泡。
 */
export function 解析微信私聊气泡(
  原: string,
  发言人: string,
  最大汉字: number,
  最多条数: number,
): string[] {
  const 结果: string[] = [];
  let 当前: string | null = null;
  let 正在拒绝未知说话人 = false;
  const 追加当前 = (片段: string) => {
    const 内容 = 片段.trim();
    if (!内容 || 正在拒绝未知说话人) return;
    当前 = 当前 === null ? 内容 : 拼接自然折行(当前, 内容);
  };
  const 提交当前 = () => {
    const 内容 = 当前?.trim() ?? '';
    if (内容 && 汉字数(内容) <= 最大汉字) 结果.push(内容);
    当前 = null;
  };
  const 处理正文 = (正文: string) => {
    let 剩余 = 正文.trim();
    while (剩余) {
      const 行内标签 = 找首个非无害行内标签(剩余);
      if (!行内标签) {
        追加当前(剩余);
        return;
      }
      追加当前(剩余.slice(0, 行内标签.前段终点));
      提交当前();
      if (行内标签.标签 !== 发言人) {
        正在拒绝未知说话人 = true;
        return;
      }
      正在拒绝未知说话人 = false;
      剩余 = 剩余.slice(行内标签.正文起点).trim();
    }
  };

  for (const 原行 of String(原 ?? '').split(/\r\n?|\n/u)) {
    const 行 = 清理单气泡行(原行);
    if (!行 || /^```/.test(行)) continue;
    const 匹配 = 行.match(/^([^:：\n]{1,12})[:：]\s*(.*)$/u);
    const 标签 = 匹配?.[1]?.trim() ?? '';
    if (匹配 && 标签 === 发言人) {
      提交当前();
      正在拒绝未知说话人 = false;
      处理正文(匹配[2]);
      continue;
    }
    if (匹配 && 是无害冒号续行标签(标签)) {
      处理正文(行);
      continue;
    }
    // 冒号前已经有完整前句时，不把整段误当成一个超长行首标签；交给同行扫描判断末尾标签。
    if (匹配 && 行内前句分隔.test(标签)) {
      处理正文(行);
      continue;
    }
    if (匹配) {
      提交当前();
      正在拒绝未知说话人 = true;
      continue;
    }
    if (正在拒绝未知说话人) continue;
    处理正文(行);
  }
  提交当前();
  return 结果.slice(0, Math.max(0, 最多条数));
}
