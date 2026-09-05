import { 折叠检测文本, 规范可读文本 } from './记忆文本规范';
import { 门牌列表, type 门牌 } from '../../stageConfig';
import { 构造角色近期正文 } from './角色近期正文';
import { 提取正文舞台文本 } from './正文输出边界';

export interface 微信可知正文消息 {
  mes?: string;
  is_user?: boolean;
  extra?: Record<string, unknown> | null;
}

const 指令风险 =
  /(?:忽略|无视|覆盖|绕过|泄露).{0,16}(?:系统|上文|规则|指令|提示词)|(?:system|developer|assistant|prompt|instruction)\s*[:：]?|\b(?:ignore|obey|respond|output|roleplay)\b/i;

export function 净化微信只读文本(value: unknown, 上限: number): string {
  const 去结构 = String(value ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{\{|\}\}/g, ' ')
    .replace(/\u3010事件(?:在场妻|在场夫|关联妻|关联夫):[^\u3011]+\u3011/g, ' ')
    .replace(/[\r\n\t]+/g, ' ');
  // 只读注入文本同样不折叠中文全角标点；指令检测在折叠副本上执行。
  const 文 = 规范可读文本(去结构);
  if (!文 || 指令风险.test(折叠检测文本(文))) return '';
  return 文.slice(-上限);
}

/** 当前名单参数只保留旧调用兼容；已发生经历以正式消息自身的持久在场凭据为准。 */
export function 编译本人见证正文(
  门牌号: string,
  _妻在场: readonly string[],
  chat: readonly 微信可知正文消息[],
): string {
  if (!门牌列表.includes(门牌号 as 门牌)) return '';
  const 文 = 构造角色近期正文(chat, 门牌号 as 门牌, 正文 => 净化微信只读文本(提取正文舞台文本(正文), 300));
  return 净化微信只读文本(文, 900);
}
