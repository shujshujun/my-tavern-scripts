/**
 * 酒馆的流式事件与 `generate()` 最终返回偶尔会不同步：玩家已经看见完整正文，
 * 最终 Promise 却可能只剩空串或变量协议。只有最终返回确实没有可用正文时，才允许
 * 采用同一个正文 generation_id 留下的最后一份完整流式文本；正常最终返回永远优先。
 */
function 有有效正文(原文: string, 提取有效正文: (原文: string) => string): boolean {
  const 已清洗 = 提取有效正文(原文).trim();
  const 仅残缺标签 = /^<\/?[A-Za-z_\u3400-\u9fff][A-Za-z0-9_\u3400-\u9fff~:-]*$/.test(已清洗);
  return Boolean(原文.trim() && 已清洗 && !仅残缺标签);
}

function 是RFC6902数组(文本: string): boolean {
  const 内容 = 文本
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    const 值 = JSON.parse(内容) as unknown;
    return (
      Array.isArray(值) &&
      值.every(
        项 =>
          typeof 项 === 'object' &&
          项 !== null &&
          typeof (项 as Record<string, unknown>).op === 'string' &&
          typeof (项 as Record<string, unknown>).path === 'string',
      )
    );
  } catch {
    return false;
  }
}

function 是纯变量体(变量体: string): boolean {
  const JSON块 = [...变量体.matchAll(/<json_?patch\b[^>]*>([\s\S]*?)<\/json_?patch\s*>/gi)];
  if (JSON块.length) {
    if (JSON块.some(块 => !是RFC6902数组(块[1]))) return false;
    const 剩余 = 变量体.replace(/<json_?patch\b[^>]*>[\s\S]*?<\/json_?patch\s*>/gi, '').trim();
    return !剩余;
  }
  if (是RFC6902数组(变量体)) return true;
  const 命令行 = 变量体
    .split(/\r?\n/)
    .map(行 => 行.trim())
    .filter(Boolean);
  return (
    命令行.length > 0 && 命令行.every(行 => /^_\.(?:set|insert|assign|remove|unset|delete|add)\(.*\)\s*;?$/.test(行))
  );
}

/**
 * 最终 Promise 有时只返回正文之后的控制协议。仅当整段完全由可验证的变量／尺度块和
 * 它们的孤立闭标签组成时才允许保留；思维链、HTML 或夹杂说明文字一律不带回正文流。
 */
export function 提取纯控制协议尾段(候选: unknown): string {
  const 原文 = typeof 候选 === 'string' ? 候选.trim() : '';
  if (!原文) return '';
  let 剩余 = 原文;
  let 有实质控制块 = false;

  while (剩余.trim()) {
    剩余 = 剩余.trimStart();
    const 变量外层 = 剩余.match(/^<UpdateVariable\b[^>]*>([\s\S]*?)<\/UpdateVariable\s*>/i);
    if (变量外层) {
      if (!是纯变量体(变量外层[1])) return '';
      有实质控制块 = true;
      剩余 = 剩余.slice(变量外层[0].length);
      continue;
    }
    const JSON块 = 剩余.match(/^<json_?patch\b[^>]*>([\s\S]*?)<\/json_?patch\s*>/i);
    if (JSON块) {
      if (!是RFC6902数组(JSON块[1])) return '';
      有实质控制块 = true;
      剩余 = 剩余.slice(JSON块[0].length);
      continue;
    }
    const 尺度块 = 剩余.match(/^<尺度判定(?:\s[^>]*)?>[\s\S]*?<\/尺度判定\s*>/i);
    if (尺度块) {
      有实质控制块 = true;
      剩余 = 剩余.slice(尺度块[0].length);
      continue;
    }
    const 孤立闭标签 = 剩余.match(/^<\/(?:UpdateVariable|json_?patch|尺度判定)\s*>/i);
    if (孤立闭标签) {
      剩余 = 剩余.slice(孤立闭标签[0].length);
      continue;
    }
    const 去尾部孤立闭标签 = 剩余.replace(/(?:<\/(?:UpdateVariable|json_?patch)\s*>\s*)+$/gi, '').trim();
    if (是纯变量体(去尾部孤立闭标签)) {
      有实质控制块 = true;
      剩余 = '';
      continue;
    }
    break;
  }

  if (!剩余.trim() && 有实质控制块) return 原文;
  const 去孤立闭标签 = 原文.replace(/(?:<\/(?:UpdateVariable|json_?patch)\s*>\s*)+$/gi, '').trim();
  return 是RFC6902数组(去孤立闭标签) ? 原文 : '';
}

/** 主正文请求窗口允许兼容宿主缺失 generation_id；明确属于其他请求的流仍拒绝。 */
export function 是当前正文流事件(正文生成id: string, 当前生成id: string, 事件生成id: unknown): boolean {
  if (!正文生成id || 正文生成id !== 当前生成id) return false;
  return typeof 事件生成id !== 'string' || !事件生成id || 事件生成id === 正文生成id;
}

/**
 * 流式宿主偶尔在完整累计文本之后又补发一帧纯变量尾段。缓存只接受仍含剧情正文的帧，
 * 避免最后一帧把同一 generation 已经收到的完整正文覆盖掉。
 */
export function 更新有效流式正文(当前缓存: unknown, 新流式文本: unknown, 提取有效正文: (原文: string) => string): string {
  const 当前原文 = typeof 当前缓存 === 'string' ? 当前缓存 : '';
  const 新流式原文 = typeof 新流式文本 === 'string' ? 新流式文本 : '';
  // 累计流通常只在末尾增长；当前缓存已通过有效性门时，其前缀仍在即可直接接纳，
  // 避免每个 token 都对越来越长的全文重复执行完整协议清洗。
  if (当前原文.trim() && 新流式原文.startsWith(当前原文)) return 新流式原文;
  if (有有效正文(新流式原文, 提取有效正文)) return 新流式原文;
  return 当前原文;
}

export function 选择正文生成原文(最终返回: unknown, 流式缓存: unknown, 提取有效正文: (原文: string) => string): string {
  const 最终原文 = typeof 最终返回 === 'string' ? 最终返回 : '';
  const 流式原文 = typeof 流式缓存 === 'string' ? 流式缓存 : '';

  if (有有效正文(最终原文, 提取有效正文)) return 最终原文;
  if (有有效正文(流式原文, 提取有效正文)) return 流式原文;
  return 最终原文;
}

export interface 正文提交判定 {
  显示正文: string;
  成功正文: string;
  失败残稿: string;
  可提交: boolean;
}

/**
 * 玩家可见文本与游戏成功正文使用两道独立门：显示门可以保留未完成残稿，成功门仍会
 * 剥除思维链和机器协议。失败残稿永远不会被上层当作任务、资源或变量结算依据。
 */
export function 判定正文提交(
  显示原文: string,
  清洗显示正文: (原文: string) => string,
  清洗成功正文: (原文: string) => string,
  成功判定原文: string = 显示原文,
): 正文提交判定 {
  const 显示正文 = 清洗显示正文(String(显示原文 ?? '')).trim();
  const 成功正文 = 清洗成功正文(String(成功判定原文 ?? '')).trim();
  const 可提交 = Boolean(成功正文);
  return {
    显示正文: 显示正文 || 成功正文,
    成功正文,
    失败残稿: 可提交 ? '' : 显示正文,
    可提交,
  };
}

/**
 * 有些中转在完整累计流已经送达后，最终 Promise 仍以“AI回复失败”拒绝。只有清洗后确实
 * 留下正文且已经以自然句末收口时才允许保住该流；半句、纯协议和思维链仍返回空，让上层
 * 按失败回滚，不能拿玩家刚看见的一截残文冒充完成。
 */
export function 生成失败时可保留的流式正文(流式缓存: unknown, 提取有效正文: (原文: string) => string): string {
  const 原文 = typeof 流式缓存 === 'string' ? 流式缓存 : '';
  if (!有有效正文(原文, 提取有效正文)) return '';
  const 净文 = 提取有效正文(原文).trim();
  return /[。！？!?….](?:[」』”’"'）)\]】》〕〉]*)$/.test(净文) ? 原文 : '';
}
