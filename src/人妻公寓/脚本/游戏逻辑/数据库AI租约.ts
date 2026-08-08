/**
 * 数据库 AI 迟到租约（v0.74 第 8 项）。
 *
 * 数据库插件的 callAI 一旦发出就不可取消；90 秒 Promise.race 只会拒绝外层调用方，
 * 底层请求仍会占用 TavernHelper 生成槽，直到真正 settle。本模块用一条全局租约保证：
 *
 *   1. 超时只拒绝外层，底层 settle 前租约不释放；
 *   2. 并发第二次调用 fail closed，且绝不调用传入的底层函数（避免双请求/二次计费）；
 *   3. 同步/异步异常都释放租约；
 *   4. 底层迟到 rejection 由 Promise.race 在创建时挂上的处理者接管，不产生未处理 rejection。
 *
 * 数据库桥只经 全局数据库AI租约 调用 callAI；回合引擎在启动正文回合前查询 在结算()。
 * 本模块不依赖任何浏览器全局，纯 Node 可测。
 */

export type 数据库消息 = { role: 'system' | 'user' | 'assistant'; content: string };

export interface 数据库AI调用选项 {
  presetName?: string;
  max_tokens?: number;
}

/** 与 数据库桥.数据库API.callAI 同形；调用方负责 bind 到插件实例。 */
export type 数据库AI底层调用 = (messages: 数据库消息[], options: 数据库AI调用选项) => Promise<string | null>;

export interface 数据库AI租约 {
  /**
   * 执行一次底层数据库 AI 调用。生产默认 90000ms，测试可传短时限。
   * 并发第二次调用直接拒绝且不调用 底层。超时只拒绝外层，租约保持到底层真正 settle。
   */
  执行(
    messages: 数据库消息[],
    options: 数据库AI调用选项,
    底层: 数据库AI底层调用,
    时限Ms?: number,
  ): Promise<string | null>;
  /** 查询底层数据库 AI 调用是否仍在结算（未 settle）。 */
  在结算(): boolean;
}

async function 限时等待<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}超时(${Math.round(ms / 1000)}秒)`)), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function 创建数据库AI租约(): 数据库AI租约 {
  let busy = false;

  return {
    async 执行(messages, options, 底层, 时限Ms = 90000) {
      // 并发第二次调用必须在发起底层之前 fail closed，绝不调用传入函数。
      if (busy) throw new Error('数据库AI仍在结算上一轮请求，本次调用被拒绝。');
      busy = true;
      // 底层同步抛错也由 Promise.resolve().then 收进同一结算链，租约照常释放。
      const 底层结算 = Promise.resolve()
        .then(() => 底层(messages, options))
        .then(
          结果 => {
            busy = false;
            return 结果;
          },
          错误 => {
            busy = false;
            throw 错误;
          },
        );
      // 超时只拒绝外层；底层 settle 前 busy 保持 true。底层迟到 rejection 已被
      // Promise.race 在创建时挂上的处理者接管，不会成为未处理 rejection。
      return await 限时等待(底层结算, 时限Ms, '数据库AI调用');
    },
    在结算: () => busy,
  };
}

/** 人妻公寓全局唯一实例：数据库桥所有 callAI 与回合引擎的迟到租约检查共用。 */
export const 全局数据库AI租约 = 创建数据库AI租约();
