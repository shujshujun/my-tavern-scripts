type 松散记录 = Record<string, unknown>;

function 取记录(值: unknown): 松散记录 {
  return 值 && typeof 值 === 'object' ? (值 as 松散记录) : {};
}

function 取字符串(值: unknown): string {
  return typeof 值 === 'string' ? 值.trim() : '';
}

/**
 * 只读取当前生效的 API、来源、模型和端点，不扫描其他来源遗留在设置里的模型字段。
 * 这样玩家从 DeepSeek 切回 Gemini/Claude 后，不会因为 stale deepseek_model 被误判。
 */
export function 收集当前正文模型线索(上下文: unknown): string[] {
  const ctx = 取记录(上下文);
  const mainApi = 取字符串(ctx.mainApi).toLowerCase();
  const 线索: string[] = [mainApi];

  if (mainApi === 'openai') {
    const 设置 = 取记录(ctx.chatCompletionSettings);
    const 来源 = 取字符串(设置.chat_completion_source).toLowerCase();
    let 模型 = '';
    try {
      const 取模型 = ctx.getChatCompletionModel;
      // ST 1.15+ 接收完整 settings；旧版调用失败/返回空时再走当前来源字段回退。
      if (typeof 取模型 === 'function') 模型 = 取字符串(取模型(设置));
    } catch {
      /* 旧版酒馆助手可能没有可调用的模型读取器，下面回退到当前来源对应字段。 */
    }
    if (!模型 && 来源) {
      const 模型键 = 来源 === 'makersuite' ? 'google_model' : `${来源}_model`;
      模型 = 取字符串(设置[模型键]);
    }
    线索.push(来源, 模型);
    if (来源 === 'custom') 线索.push(取字符串(设置.custom_url));
  } else if (mainApi === 'textgenerationwebui') {
    const 设置 = 取记录(ctx.textCompletionSettings);
    const 类型 = 取字符串(设置.type).toLowerCase();
    // ST 的 ooba 类型沿用历史字段 custom_model；其他可选模型类型使用 <type>_model。
    const 模型键 = 类型 === 'ooba' ? 'custom_model' : 类型 ? `${类型}_model` : '';
    const 模型 = 模型键 ? 取字符串(设置[模型键]) : '';
    let 端点 = '';
    try {
      const 取端点 = ctx.getTextGenServer;
      if (typeof 取端点 === 'function') 端点 = 取字符串(取端点(类型 || null));
    } catch {
      /* 端点不是判断必需项。 */
    }
    线索.push(类型, 模型, 端点);
  } else {
    // Kobold/Novel 等没有可靠的活动模型字段；宁可不命中，也不读取其他 API 的遗留设置。
  }

  return [...new Set(线索.filter(Boolean))];
}

export function 模型线索指向DeepSeek(线索: readonly string[]): boolean {
  return 线索.some(值 => /\bdeepseek(?:[-_.:/\s]|$)/i.test(值));
}

function 读取酒馆上下文(): unknown {
  const 本窗酒馆 = (globalThis as typeof globalThis & { SillyTavern?: unknown }).SillyTavern;
  let 宿主酒馆: unknown;
  try {
    宿主酒馆 = (window.parent as Window & { SillyTavern?: unknown })?.SillyTavern;
  } catch {
    /* 跨域时使用本窗。 */
  }
  const 酒馆 = 取记录(宿主酒馆 ?? 本窗酒馆);
  const getContext = 酒馆.getContext;
  return typeof getContext === 'function' ? getContext() : 酒馆;
}

/** 检测不确定时返回 false，保证所有非明确 DeepSeek 模型维持 rq0.62 行为。 */
export function 当前正文模型是DeepSeek(): boolean {
  try {
    const 命中 = 模型线索指向DeepSeek(收集当前正文模型线索(读取酒馆上下文()));
    if (命中) console.info('[人妻公寓] 监控隔离生成启用 DeepSeek 专用兼容路径');
    return 命中;
  } catch (error) {
    console.warn('[人妻公寓] DeepSeek 模型识别失败，隔离生成保持 rq0.62 普通模型路径：', error);
    return false;
  }
}
