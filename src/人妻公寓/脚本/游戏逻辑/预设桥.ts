/**
 * 预设桥(2026-07-27 用户点单"手机读酒馆预设"):
 * 手机/隔离事件的独立小生成原本裸发两三条提示词——Gemini 一见敏感内容就安全截断
 * (朋友圈断半截的根因,不是 max_tokens)。正文不断是因为预设破限词条在护航。
 * 这里把当前预设里启用的普通/系统词条按原顺序取出,以 chatHistory 占位符为界拆成
 * 前后两段;各生成器把自家内容夹在中间=与正文同一套通行证,三条通道(数据库代发/
 * 正文API/自定义API)统一垫上。
 *
 * 占位词条(世界书/角色卡/示例/玩家人设)不取:手机内容自带人设包,整卡跟上既漏底又爆量。
 * 词条内容过一遍宏替换({{user}}/{{char}});读取失败或预设为空=返回空段,行为退回裸发。
 *
 * 独立时间事件(晨跑/健身/睡眠)不会创建真实临时玩家楼,预设里的 {{lastUserMessage}} 会被
 * substitudeMacros 按真实聊天尾楼展开成上一楼玩家指令——与回合引擎必须先建临时 user 楼
 * 是同一问题,但独立事件不能建正文楼。预设破限段因此接受可选的本拍玩家输入:在宏展开前
 * 精确覆写这个历史宏,让预设读到的是本拍行动,而非真实聊天的上一楼指令。
 */

import type { 外部正文标签 } from './正文输出边界';

interface 可识别预设词条 {
  identifier?: string;
  id?: string;
  enabled?: boolean;
  content?: string;
  role?: string;
}

interface 预设结构 {
  prompts?: 可识别预设词条[];
  prompt_order?: Array<{
    character_id?: number;
    order?: Array<{ identifier?: string; enabled?: boolean }>;
  }>;
}

export interface 预设流式边界 {
  期望正文标签: 外部正文标签 | null;
  等待思维闭标签: boolean;
}

function 含未闭合私有开标签(文本: string): boolean {
  const 开标签 = /<([A-Za-z_:~-]*(?:think|reason|analysis|thought|draft|cot|plan)[A-Za-z_:~-]*|metacognition|original|bginfor|CEstuff|fox_selc|fox_tip|tucao|思考)(?=\s|\/?>)[^>]*>/gi;
  for (const 匹配 of 文本.matchAll(开标签)) {
    const 标签 = 匹配[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`</${标签}\\s*>`, 'i').test(文本.slice((匹配.index ?? 0) + 匹配[0].length))) return true;
  }
  return false;
}

/** SillyTavern 的真实启用状态在 prompt_order；prompts.enabled 可能仍是导出时的旧默认值。 */
export function 读取预设启用词条(预设: 预设结构 | null | undefined): 可识别预设词条[] {
  const 词条们 = Array.isArray(预设?.prompts) ? 预设.prompts : [];
  const 顺序组 = Array.isArray(预设?.prompt_order) ? 预设.prompt_order : [];
  const 当前顺序 = 顺序组.find(项 => 项?.character_id === 100001) ?? 顺序组.at(-1);
  if (!Array.isArray(当前顺序?.order)) return 词条们.filter(词条 => 词条?.enabled);
  const 词条表 = new Map(
    词条们
      .map(词条 => [词条.identifier ?? 词条.id, 词条] as const)
      .filter((项): 项 is readonly [string, 可识别预设词条] => typeof 项[0] === 'string'),
  );
  return 当前顺序.order
    .filter(项 => 项?.enabled && typeof 项.identifier === 'string')
    .map(项 => 词条表.get(项.identifier!))
    .filter((词条): 词条 is 可识别预设词条 => Boolean(词条))
    .map(词条 => ({ ...词条, enabled: true }));
}

/**
 * 只检测启用提示词里的强输出协议组合，供流式显示在正文封套出现前隐藏裸思考文字。
 * 不读取预设名称；单独提到一个标签也不算协议，避免普通设定误关流式正文。
 */
export function 识别预设正文标签(词条们: readonly 可识别预设词条[]): 外部正文标签 | null {
  const 协议文 = 词条们
    .filter(词条 => 词条?.enabled && typeof 词条.content === 'string')
    .map(词条 => 词条.content)
    .join('\n');
  const 有思维协议 = /<(?:[A-Za-z_:~-]*(?:think|reason|analysis|thought|draft|cot|plan)[A-Za-z_:~-]*|metacognition|思考)(?=\s|\/?>)/i.test(协议文);
  if (/(?:DREAM_PLOT_OUTPUT|<dream_plot\b)/i.test(协议文) && /<dream_body\b/i.test(协议文)) return 'dream_body';
  if (/<game\b/i.test(协议文) && (有思维协议 || /正文[^\n]{0,40}<game\b/i.test(协议文))) return 'game';
  if (/<content\b/i.test(协议文) && (有思维协议 || /<output-template\b/i.test(协议文))) return 'content';
  if (/<story_scene\b/i.test(协议文) && 有思维协议) return 'story_scene';
  if (/<正文(?=\s|\/?>)/i.test(协议文) && 有思维协议) return '正文';
  if (/<revised\b/i.test(协议文) && /<(?:original|analysis)\b/i.test(协议文)) return 'revised';
  for (const 标签 of ['response', 'final', 'answer'] as const) {
    if (new RegExp(`<${标签}\\b`, 'i').test(协议文) && 有思维协议) return 标签;
  }
  return null;
}

export function 当前预设正文标签(): 外部正文标签 | null {
  try {
    return 识别预设正文标签(读取预设启用词条(getPreset('in_use') as 预设结构));
  } catch (e) {
    console.warn('[人妻公寓·预设桥] 识别当前预设输出协议失败:', e);
    return null;
  }
}

export function 识别预设流式边界(词条们: readonly 可识别预设词条[]): 预设流式边界 {
  const 期望正文标签 = 识别预设正文标签(词条们);
  const 最后模型边界词条 = [...词条们]
    .reverse()
    .find(
      词条 =>
        词条?.enabled &&
        (词条.role === 'assistant' || 词条.role === 'model' || 词条.role === 'user') &&
        typeof 词条.content === 'string' &&
        词条.content.trim(),
    );
  const 等待思维闭标签 =
    !期望正文标签 &&
    typeof 最后模型边界词条?.content === 'string' &&
    含未闭合私有开标签(最后模型边界词条.content);
  return { 期望正文标签, 等待思维闭标签 };
}

export function 当前预设流式边界(): 预设流式边界 {
  try {
    return 识别预设流式边界(读取预设启用词条(getPreset('in_use') as 预设结构));
  } catch (e) {
    console.warn('[人妻公寓·预设桥] 识别当前预设流式边界失败:', e);
    return { 期望正文标签: null, 等待思维闭标签: false };
  }
}

export interface 预设消息 {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 本拍玩家输入存在时,在 substitudeMacros 之前把预设里的 {{lastUserMessage}} 精确覆写为
 * 本拍行动。独立事件没有真实临时玩家楼,若交给 substitudeMacros 按真实聊天尾楼展开,
 * 会重复真实聊天上一楼的玩家指令。用回调替换避免输入中的 $&/$1 被当成替换模板。
 */
export function 预设破限段(本拍玩家输入?: string): { 前: 预设消息[]; 后: 预设消息[] } {
  try {
    const 预设 = getPreset('in_use');
    const 前: 预设消息[] = [];
    const 后: 预设消息[] = [];
    let 过史 = false;
    for (const p of 预设?.prompts ?? []) {
      if (!p?.enabled) continue;
      if (p.id === 'chatHistory') {
        过史 = true;
        continue;
      }
      if (typeof p.content !== 'string' || !p.content.trim()) continue;
      let 待展开 = p.content;
      if (本拍玩家输入 !== undefined) {
        const 覆写为 = 本拍玩家输入;
        待展开 = 待展开.replace(/\{\{\s*lastUserMessage\s*\}\}/gi, () => 覆写为);
      }
      const 文 = substitudeMacros(待展开);
      if (!文.trim()) continue;
      // in_chat 深度词条本就锚在聊天底部(高权重),与 chatHistory 之后的词条同归后段
      (过史 || p.position?.type === 'in_chat' ? 后 : 前).push({ role: p.role ?? 'system', content: 文 });
    }
    return { 前, 后 };
  } catch (e) {
    console.warn('[人妻公寓·预设桥] 读取预设词条失败,本次裸发:', e);
    return { 前: [], 后: [] };
  }
}
