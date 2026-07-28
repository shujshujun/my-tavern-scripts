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
 */

export interface 预设消息 {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function 预设破限段(): { 前: 预设消息[]; 后: 预设消息[] } {
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
      const 文 = substitudeMacros(p.content);
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
