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
