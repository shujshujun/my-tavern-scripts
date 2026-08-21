export type 正文生成超时阶段 = '等待首个正文片段' | '正文流式停滞' | '正文总时限';

export interface 正文生成看门狗配置 {
  首包等待毫秒: number;
  流式停滞毫秒: number;
  绝对上限毫秒: number;
}

/**
 * 正文模型可能先经过数据库规划，并且部分预设会先生成较长思考；阈值因此只从“正文请求真正开始”计时，
 * 首包和流式停滞都留足余量。绝对上限只负责兜住上游连接永久 pending，不用于限制正常篇幅。
 */
export const 默认正文生成看门狗配置: Readonly<正文生成看门狗配置> = {
  首包等待毫秒: 240_000,
  流式停滞毫秒: 180_000,
  绝对上限毫秒: 600_000,
};

export const 正文生成超时错误前缀 = '__RQGY_GENERATION_TIMEOUT__:';

export function 判定正文生成超时(
  当前毫秒: number,
  正文开始毫秒: number,
  最后进展毫秒: number,
  已收到正文进展: boolean,
  配置: Readonly<正文生成看门狗配置> = 默认正文生成看门狗配置,
): 正文生成超时阶段 | null {
  const 已运行 = Math.max(0, 当前毫秒 - 正文开始毫秒);
  if (已运行 >= 配置.绝对上限毫秒) return '正文总时限';
  if (!已收到正文进展 && 已运行 >= 配置.首包等待毫秒) return '等待首个正文片段';
  if (已收到正文进展 && Math.max(0, 当前毫秒 - 最后进展毫秒) >= 配置.流式停滞毫秒) {
    return '正文流式停滞';
  }
  return null;
}

export function 创建正文生成超时错误(阶段: 正文生成超时阶段): Error {
  return new Error(`${正文生成超时错误前缀}${阶段}`);
}

function 原始错误文本(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function 提取线路状态码(文本: string): string | null {
  const 指名 = 文本.match(/(?:response\s+status|status|error\s*code|code)\s*[:=]?\s*(502|503|504|520|521|522|523|524|525|526)\b/i);
  if (指名?.[1]) return 指名[1];
  return 文本.match(/\b(502|503|504|520|521|522|523|524|525|526)\b/)?.[1] ?? null;
}

/**
 * 玩家只需要知道“这一轮没发生、线路是否需要更换”；底层原始异常仍由控制台保留。
 * 只把明确的网关／网络错误改成线路提示，游戏内部异常继续原样暴露，便于截图排查。
 */
export function 友好化正文生成错误(error: unknown): string {
  const 文本 = 原始错误文本(error).replace(/^Error:\s*/i, '').trim();
  if (文本.startsWith(正文生成超时错误前缀)) {
    return 'AI 服务长时间没有返回完整正文，系统已自动停止本轮。请重试或更换模型线路。';
  }

  const 状态码 = 提取线路状态码(文本);
  if (
    状态码 ||
    /upstream_server_error|bad\s+gateway|gateway\s+timeout|cloudflare|fetch\s+failed|network\s*error|connection\s+(?:reset|closed)|econn(?:reset|refused|aborted)|socket\s+hang\s+up/i.test(
      文本,
    )
  ) {
    return `AI 线路暂时不可用${状态码 ? `（${状态码}）` : ''}。请稍后重试或更换模型线路。`;
  }

  if (/\b(?:timed?\s*out|timeout)\b|请求超时/i.test(文本)) {
    return 'AI 服务请求超时。请稍后重试或更换模型线路。';
  }
  return 文本 || '未知错误';
}
