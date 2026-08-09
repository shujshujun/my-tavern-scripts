/**
 * 临时回合楼生命周期(第 6 项):本轮 user/assistant 临时楼的定位、扫描与转正纯函数集。
 *
 * 设计初衷:临时 user 楼让预设的 {{lastUserMessage}} 读到本轮行动并继承上一楼 MVU 快照;
 * 临时 assistant 楼承载正文与变量解析候选。只有最终可信整表已写入 assistant 楼后,
 * 两楼才同时转为正式历史;失败、取消、时间线失效时只删本轮两条,成功则保留两条并转正。
 *
 * 本模块不持有任何全局状态:消息表与副作用全部由调用方注入,保证可被动态测试。
 * 定位纪律(精确定位语义):
 *   1) 登记楼层仍是同一对象 → 直接接受;
 *   2) 否则在当前消息表按对象引用重定位(MVU 外置解析会在“正文已落楼、尚未转正”窗口
 *      自己写/插/删楼,楼层号漂移后按旧号盲删会删掉之前回合的 AI 正文);
 *   3) 宿主重建对象导致引用丢失 → 才允许按 同一精确令牌 + 同一角色 兜底;
 *   4) 找不到 = 消息已不在当前分支,不删除任何同楼替代消息;
 *   5) 不得只因正文/行动文本相同而匹配,不得只按登记楼层盲删。
 *
 * 旧版成功消息只有 `_rqgy回合令牌` 而没有新临时标记,必须视为正式历史,绝不清理。
 */

/** 新临时标记键:只有该键严格为 true 的楼才属于“临时、可恢复清理”状态。 */
export const 临时楼标记键 = '_rqgy回合临时';
/** 回合唯一令牌键(旧版既有键名,保持不变)。 */
export const 回合令牌键 = '_rqgy回合令牌';
/** 楼角色键(旧版既有键名,保持不变)。 */
export const 回合角色键 = '_rqgy回合角色';
/** 合法临时令牌前缀:由 执行回合 以 `rqgy-turn-` 开头生成。 */
export const 合法回合令牌前缀 = 'rqgy-turn-';

export interface 临时楼登记 {
  /** 建楼登记时刻的楼层号;null 表示该角色楼从未成功落位。 */
  楼层: number | null;
  /** 建楼时捕获的对象引用(宿主可能重建对象导致引用失效)。 */
  引用: unknown;
  角色: 'user' | 'assistant';
}

export interface 定位命中 {
  楼层: number;
  角色: 'user' | 'assistant';
}

export interface 遗留临时楼恢复判定 {
  /** 只有满足“当前聊天尾部、同一令牌、合法单 user 或 user+assistant 对”时才允许自动删除。 */
  待删: number[];
  /** 非空表示检测到异常临时标记；调用方必须保留历史并停止自动删除。 */
  拒绝原因: string;
}

/**
 * 转正更新负载:除 message_id 外必须携带无损原正文 `message`。酒馆助手真实 setChatMessages
 * 只会对含 `message` 或 `data` 的项处理 `extra`;纯 {message_id, extra} 会被整项忽略,
 * refresh:'all' 后复核仍读到 临时=true 必失败。
 */
export type 转正更新负载 = Array<{ message_id: number; message: string; extra: Record<string, unknown> }>;
export type 写入转正消息 = (负载: 转正更新负载, 选项: { refresh: 'none' | 'all' }) => void | Promise<void>;

function 消息extra(消息: unknown): Record<string, unknown> | null {
  const extra = (消息 as { extra?: unknown } | null)?.extra;
  return extra && typeof extra === 'object' && !Array.isArray(extra) ? (extra as Record<string, unknown>) : null;
}

/**
 * 读取消息正文:按“明确存在的字符串字段”读取,优先真实宿主 SillyTavern.chat 的 `mes`,
 * 兼容测试/旧对象提供 `message`;两者都非字符串(含缺字段)时返回 null。
 * 空字符串是合法正文,必须逐字保留,不做 trim/净化/截断。
 */
function 消息正文(消息: unknown): string | null {
  const 对象 = 消息 as Record<string, unknown> | null;
  if (对象 && typeof 对象['mes'] === 'string') return 对象['mes'];
  if (对象 && typeof 对象['message'] === 'string') return 对象['message'];
  return null;
}

/** 按登记定位本轮临时楼;返回带角色的命中(去重),顺序不代表楼层序。 */
export function 定位本轮临时楼(消息表: readonly unknown[], 令牌: string, 登记: readonly 临时楼登记[]): 定位命中[] {
  const 结果: 定位命中[] = [];
  for (const 项 of 登记) {
    if (项.楼层 === null || 项.引用 === undefined) continue;
    let 实际楼层 = -1;
    const 原位消息 = 消息表[项.楼层];
    if (原位消息 === 项.引用) {
      // 登记楼层仍是同一对象,直接接受(不扫描、不比较文本)。
      实际楼层 = 项.楼层;
    } else {
      const 引用楼层 = 消息表.findIndex(消息 => 消息 === 项.引用);
      if (引用楼层 >= 0) {
        // 楼号漂移:MVU 外置解析插/删楼后按对象引用重定位。
        实际楼层 = 引用楼层;
      } else {
        // 宿主重建了消息对象,引用已丢失;只有此时才允许 精确令牌 + 角色 兜底。
        const 令牌楼层 = 消息表.findIndex(
          消息 => 消息extra(消息)?.[回合令牌键] === 令牌 && 消息extra(消息)?.[回合角色键] === 项.角色,
        );
        if (令牌楼层 >= 0) 实际楼层 = 令牌楼层;
      }
    }
    if (实际楼层 >= 0 && !结果.some(已 => 已.楼层 === 实际楼层)) 结果.push({ 楼层: 实际楼层, 角色: 项.角色 });
  }
  return 结果;
}

/** 命中结果去重并按楼层降序:删楼须从高往低,避免删第一条后第二条移位。 */
export function 临时楼降序楼层(命中: readonly 定位命中[]): number[] {
  return [...new Set(命中.map(项 => 项.楼层))].sort((a, b) => b - a);
}

/**
 * 中断恢复扫描:只认“新临时标记严格为 true 且令牌/角色格式有效”的楼,降序返回。
 * false、缺字段、旧版只有令牌、令牌格式错误、角色错误 一律保留——旧版成功回合
 * 只有令牌没有新临时标记,必须视为正式历史,绝不能清理。
 */
export function 扫描遗留临时楼(消息表: readonly unknown[]): number[] {
  const 命中: number[] = [];
  for (let 楼层 = 消息表.length - 1; 楼层 >= 0; 楼层 -= 1) {
    const extra = 消息extra(消息表[楼层]);
    if (!extra || extra[临时楼标记键] !== true) continue;
    const 令牌 = extra[回合令牌键];
    const 角色 = extra[回合角色键];
    if (typeof 令牌 !== 'string' || !令牌.startsWith(合法回合令牌前缀)) continue;
    if (角色 !== 'user' && 角色 !== 'assistant') continue;
    命中.push(楼层);
  }
  return 命中.sort((a, b) => b - a);
}

/**
 * 自动恢复的失败关闭门。
 *
 * 一次正常中断最多只会在聊天尾部留下同一令牌的一条 user，或连续的 user+assistant 两条。
 * 多令牌、超过两条、非尾部、角色倒置都不可能属于“刚刚中断的一轮”；这类状态宁可保留
 * 半成品并报警，也绝不能把历史上所有仍带 true 标记的完成回合批量删除。
 */
export function 判定可自动清理的遗留临时楼(消息表: readonly unknown[]): 遗留临时楼恢复判定 {
  const 全部 = 扫描遗留临时楼(消息表);
  if (!全部.length) return { 待删: [], 拒绝原因: '' };

  const 尾楼 = 消息表.length - 1;
  if (全部[0] !== 尾楼) {
    return { 待删: [], 拒绝原因: '临时标记不在聊天尾部' };
  }
  if (全部.length > 2) {
    return { 待删: [], 拒绝原因: `同时命中 ${全部.length} 条临时楼，超过单回合上限` };
  }

  const 升序 = [...全部].sort((a, b) => a - b);
  if (升序[0] !== 消息表.length - 升序.length || 升序.some((楼层, i) => i > 0 && 楼层 !== 升序[i - 1] + 1)) {
    return { 待删: [], 拒绝原因: '临时楼不是聊天尾部的连续单回合' };
  }

  const 信息 = 升序.map(楼层 => {
    const extra = 消息extra(消息表[楼层])!;
    return { 楼层, 令牌: String(extra[回合令牌键]), 角色: extra[回合角色键] };
  });
  if (new Set(信息.map(项 => 项.令牌)).size !== 1) {
    return { 待删: [], 拒绝原因: '聊天尾部存在多个临时回合令牌' };
  }
  if (信息[0].角色 !== 'user' || (信息.length === 2 && 信息[1].角色 !== 'assistant')) {
    return { 待删: [], 拒绝原因: '临时楼角色顺序不是 user → assistant' };
  }

  return { 待删: [...升序].sort((a, b) => b - a), 拒绝原因: '' };
}

/**
 * 构造转正更新负载:批量 setChatMessages 时携带无损原正文 `message`(让酒馆助手进入
 * ChatMessage 分支真正写 extra),保留每条已有 extra,只把临时标记改为 false。
 * 正文必须逐字写回;若命中消息既无字符串 `mes` 也无字符串 `message`,在调用方发起
 * setChatMessages 前失败关闭抛转正错误,绝不发送可能改坏正文的负载。
 */
export function 构造转正更新负载(
  消息表: readonly unknown[],
  命中: readonly 定位命中[],
): 转正更新负载 {
  return 命中.map(项 => {
    const 消息 = 消息表[项.楼层];
    const 正文 = 消息正文(消息);
    if (正文 === null) {
      throw new Error(`转正失败:第 ${项.楼层} 楼缺少字符串正文字段(mes/message),拒绝写入可能改坏正文的负载`);
    }
    const extra = 消息extra(消息) ?? {};
    return { message_id: 项.楼层, message: 正文, extra: { ...extra, [临时楼标记键]: false } };
  });
}

/**
 * 把转正标记同步写入宿主存档。
 *
 * 新版宿主暴露 `saveChat` 时保持无刷新写入，再显式等待硬保存；旧版宿主没有该接口时，
 * 改用酒馆助手 `refresh:'all'` 路线。后者会先等待宿主保存，再重载/刷新消息表，调用方
 * 必须在返回后按精确令牌与角色重新定位复核，不能继续信任建楼时的对象引用或楼层号。
 * 两条路线的异常都向上抛，未持久化成功不得伪装成正式回合。
 */
export async function 持久写入转正标记(
  负载: 转正更新负载,
  写入消息: 写入转正消息,
  立即保存?: () => void | Promise<void>,
): Promise<'saveChat' | 'refresh-all'> {
  if (立即保存) {
    await 写入消息(负载, { refresh: 'none' });
    await 立即保存();
    return 'saveChat';
  }
  await 写入消息(负载, { refresh: 'all' });
  return 'refresh-all';
}

/**
 * 转正前校验:本轮临时 user/assistant 两条必须都定位到,且都仍是严格临时、令牌一致、
 * extra 角色与命中角色一致。少任一条即拒绝转正(调用方据此走失败清理);标记非严格
 * true 拒绝,防止误把旧版无标记的正式回合或非本轮消息改写成正式;extra 角色错位拒绝,
 * 防止宿主异常替换对象/extra 后把角色错位楼转正。
 */
export function 校验转正候选(消息表: readonly unknown[], 令牌: string, 命中: readonly 定位命中[]): void {
  if (命中.length !== 2) {
    throw new Error('转正失败:本轮临时 user/assistant 楼未齐(可能已被删除或分支已变),按失败路径清理');
  }
  if (new Set(命中.map(项 => 项.角色)).size !== 2) {
    throw new Error('转正失败:本轮临时楼角色重复,按失败路径清理');
  }
  for (const 项 of 命中) {
    const extra = 消息extra(消息表[项.楼层]);
    if (!extra || extra[临时楼标记键] !== true || extra[回合令牌键] !== 令牌 || extra[回合角色键] !== 项.角色) {
      throw new Error('转正失败:临时楼标记、令牌或角色异常,拒绝把非本轮消息标为正式');
    }
  }
}
