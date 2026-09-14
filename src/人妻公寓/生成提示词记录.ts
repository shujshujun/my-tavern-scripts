import { 从酒馆原始提示词构造快照, 提示词内容转文本 } from './提示词快照';
import { 注册Tauri最终请求观察 } from './Tauri提示词观察';

export const 生成提示词记录键 = '_rqgy_prompt_snapshot';
export type 生成提示词记录 = { 版本: 1; 生成id: string; 文本: string };
type 请求 = {
  messages?: unknown;
  tools?: unknown;
  tool_choice?: unknown;
  response_format?: unknown;
  json_schema?: unknown;
};
type 监听 = (事件: string, 回调: (...参数: any[]) => void) => { stop: () => void };

/** 用宏两侧的原文确认归属；不再次执行可能读写变量或随机取值的酒馆宏。 */
export function 请求包含模板文本(文本: string, 模板: string): boolean {
  if (文本.includes(模板)) return true;
  const 片段 = 模板.split(/\{\{[\s\S]*?\}\}/).filter(Boolean);
  if (片段.length === 0 || 片段.join('').trim().length < 8) return false;
  let 位置 = 0;
  return 片段.every(段 => {
    const 起点 = 文本.indexOf(段, 位置);
    if (起点 < 0) return false;
    位置 = 起点 + 段.length;
    return true;
  });
}

/** 只记录本次正文的请求；不依赖酒馆助手是否替生成结果建立原生提示词记录。 */
export function 创建生成提示词记录器(参数: {
  生成id: string;
  用户输入: string;
  注入文本: string[];
  监听: 监听;
  预设名: () => string;
}) {
  let 已开始 = false;
  let 已停止 = false;
  let 有其他生成 = false;
  let 候选: 请求 | undefined;
  let 候选数 = 0;
  let 预设名 = '';
  let 是最终请求 = false;
  const 监听们: { stop: () => void }[] = [];
  const 停止 = () => {
    已停止 = true;
    for (const 项 of 监听们) {
      try {
        项?.stop?.();
      } catch {
        /* 宿主销毁时清理失败不影响正文。 */
      }
    }
    监听们.length = 0;
  };
  try {
    监听们.push(
      参数.监听('js_generation_started', (id: string) => {
        if (id === 参数.生成id) 已开始 = true;
        else 有其他生成 = true;
      }),
    );
    const 捕获 = (请求: 请求, 最终: boolean) => {
      if (已停止 || !已开始 || 有其他生成 || !Array.isArray(请求?.messages)) return;
      const 消息 = 请求.messages as { role?: string; content?: unknown }[];
      const 文本 = 消息.map(项 => 提示词内容转文本(项?.content));
      // 全局事件没有 generation_id：同时校验本次输入和本次注入，不能只取“最后一个请求”。
      // 宏/正则改变输入而无法精确归属时宁可缺失，不把其他聊天或后台请求当成本轮。
      const 输入 = 参数.用户输入.trim();
      if (!输入 || !消息.some((项, i) => 项?.role === 'user' && 请求包含模板文本(文本[i], 输入))) return;
      if (!参数.注入文本.filter(Boolean).every(段 => 文本.some(文 => 请求包含模板文本(文, 段)))) return;
      if (是最终请求 && !最终) return;
      if (最终 && !是最终请求) 候选数 = 0;
      候选数++;
      是最终请求 = 最终;
      // 只克隆允许展示的提示词字段，不持有带密钥等配置的完整请求对象。
      候选 = Object.fromEntries(
        (['messages', 'tools', 'tool_choice', 'response_format', 'json_schema'] as const)
          .filter(键 => 请求[键] !== undefined)
          .map(键 => [键, JSON.parse(JSON.stringify(请求[键]))]),
      );
      try {
        预设名 = 参数.预设名();
      } catch {
        预设名 = '';
      }
    };
    监听们.push(
      参数.监听('chat_completion_settings_ready', (请求: 请求) => {
        try {
          捕获(请求, false);
        } catch {
          /* 调试捕获不影响生成。 */
        }
      }),
    );
    const 最终观察 = 注册Tauri最终请求观察(请求 => 捕获(请求 as 请求, true));
    if (最终观察) 监听们.push(最终观察);
  } catch {
    停止(); // 调试记录不可使正文生成失败。
  }
  return {
    停止,
    读取(): 生成提示词记录 | undefined {
      if (有其他生成 || 候选数 !== 1 || !候选) return undefined;
      try {
        // Tauri 记录来自发送边界；其它宿主的事件快照明确标为扩展处理前。
        let 文本 = 从酒馆原始提示词构造快照(候选.messages, 预设名);
        const 附件 = Object.fromEntries(
          (['tools', 'tool_choice', 'response_format', 'json_schema'] as const)
            .filter(键 => 候选![键] !== undefined)
            .map(键 => [键, 候选![键]]),
        );
        if (Object.keys(附件).length)
          文本 += `\n\n===== 请求中的工具与输出格式 =====\n${JSON.stringify(附件, null, 2)}`;
        文本 = 文本.replace('来源：SillyTavern 楼层原始请求', '来源：本轮正文生成时的客户端请求');
        if (!是最终请求) 文本 = 文本.replace('【完整提示词快照】', '【组装提示词快照】');
        return { 版本: 1, 生成id: 参数.生成id, 文本 };
      } catch {
        return undefined;
      }
    },
  };
}

export function 读取消息提示词记录(extra: unknown): string | undefined {
  if (!extra || typeof extra !== 'object') return undefined;
  const 记录 = (extra as Record<string, unknown>)[生成提示词记录键] as Partial<生成提示词记录> | undefined;
  return 记录?.版本 === 1 &&
    typeof 记录.文本 === 'string' &&
    (记录.文本.startsWith('【完整提示词快照】') || 记录.文本.startsWith('【组装提示词快照】'))
    ? 记录.文本
    : undefined;
}
