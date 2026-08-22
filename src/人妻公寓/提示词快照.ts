export interface 提示词消息 {
  role: string;
  content: unknown;
  name?: unknown;
}

export interface 提示词快照项 {
  来源: string;
  role: string;
  content: unknown;
  name?: unknown;
}

function 是记录(值: unknown): 值 is Record<string, unknown> {
  return typeof 值 === 'object' && 值 !== null && !Array.isArray(值);
}

/** 多模态消息只展示可读文本和输入类型；图片二进制/长 data URL 不复制进调试弹窗。 */
export function 提示词内容转文本(内容: unknown): string {
  if (typeof 内容 === 'string') return 内容;
  if (内容 === null || 内容 === undefined) return '';
  if (Array.isArray(内容)) {
    return 内容
      .map(部分 => {
        if (typeof 部分 === 'string') return 部分;
        if (!是记录(部分)) return String(部分 ?? '');
        if (typeof 部分.text === 'string') return 部分.text;
        if (typeof 部分.content === 'string') return 部分.content;
        if (部分.type === 'image_url' || 部分.type === 'image' || 'image_url' in 部分) return '[图片输入]';
        if (部分.type === 'video' || 'video_url' in 部分) return '[视频输入]';
        try {
          return JSON.stringify(部分, null, 2);
        } catch {
          return String(部分);
        }
      })
      .filter(Boolean)
      .join('\n');
  }
  if (是记录(内容)) {
    try {
      return JSON.stringify(内容, null, 2);
    } catch {
      return String(内容);
    }
  }
  return String(内容);
}

export function 格式化完整提示词快照(参数: {
  来源: string;
  预设名?: string;
  通道?: string;
  消息: readonly 提示词快照项[];
}): string {
  const 头 = ['【完整提示词快照】', `来源：${参数.来源}`];
  if (参数.预设名?.trim()) 头.push(`预设：${参数.预设名.trim()}`);
  if (参数.通道?.trim()) 头.push(`生成通道：${参数.通道.trim()}`);
  头.push(`消息数：${参数.消息.length}`);

  const 正文 = 参数.消息.map((项, 索引) => {
    const 角色 = String(项.role || 'unknown').toUpperCase();
    const 名称 = typeof 项.name === 'string' && 项.name.trim() ? ` · ${项.name.trim()}` : '';
    return `===== ${String(索引 + 1).padStart(2, '0')} · ${角色} · ${项.来源}${名称} =====\n${提示词内容转文本(项.content)}`;
  });
  return [...头, '', ...正文].join('\n\n');
}

/** SillyTavern itemizedPrompts.rawPrompt 是该楼最终送入请求的数据，数组形态保留每条消息的 role/name。 */
export function 从酒馆原始提示词构造快照(rawPrompt: unknown, presetName?: unknown): string {
  const 消息: 提示词快照项[] = Array.isArray(rawPrompt)
    ? rawPrompt.map(项 =>
        是记录(项)
          ? {
              来源: '酒馆最终请求',
              role: typeof 项.role === 'string' ? 项.role : 'unknown',
              content: 项.content,
              name: 项.name,
            }
          : { 来源: '酒馆最终请求', role: 'unknown', content: 项 },
      )
    : [{ 来源: '酒馆最终请求', role: 'raw', content: rawPrompt }];
  return 格式化完整提示词快照({
    来源: 'SillyTavern 楼层原始请求',
    预设名: typeof presetName === 'string' ? presetName : '',
    消息,
  });
}

export function 构造隔离事件完整提示词快照(参数: {
  通道: '数据库' | '正文';
  预设名?: string;
  前: readonly 提示词消息[];
  核心: readonly 提示词消息[];
  用户输入: string;
  后: readonly 提示词消息[];
  /** DeepSeek generateRaw 把 user_input 放到后置预设之后；其他路线放在核心与后置之间。 */
  用户输入置后: boolean;
}): string {
  const 前 = 参数.前.map((项, 索引): 提示词快照项 => ({ ...项, 来源: `当前预设·前置 ${索引 + 1}` }));
  const 核心 = 参数.核心.map((项, 索引): 提示词快照项 => ({
    ...项,
    来源: 索引 === 0 ? '事件系统' : `线程历史 ${索引}`,
  }));
  const 用户: 提示词快照项 = { 来源: '本拍输入', role: 'user', content: 参数.用户输入 };
  const 后 = 参数.后.map((项, 索引): 提示词快照项 => ({ ...项, 来源: `当前预设·后置 ${索引 + 1}` }));
  const 消息 = 参数.用户输入置后 ? [...前, ...核心, ...后, 用户] : [...前, ...核心, 用户, ...后];
  return 格式化完整提示词快照({
    来源: '独立事件生成时的实际请求顺序',
    预设名: 参数.预设名,
    通道: 参数.通道,
    消息,
  });
}
