import { 同步社交轨迹, type 数据库社交写入结果, type 社交轨迹条目 } from '../数据库桥';
import { 格式化游戏内时间 } from '../楼层时钟';
import { 读取当前手机时间线租约世代 } from '../手机时间线租约';
import type { 朋友圈条 } from './数据层';
import { 当前聊天ID } from './运行时上下文';

export function 构造朋友圈长期记忆事件键(...片段: readonly unknown[]): string {
  const 安全片段 = 片段
    .map(value =>
      String(value ?? '')
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}._-]+/gu, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48),
    )
    .filter(Boolean);
  return `RQP-朋友圈-${安全片段.join('-')}`.slice(0, 130);
}

/**
 * 只有脚本明确打上长期记忆凭据的动态才进入 RQ_社交轨迹。普通晒饭、天气和同质化日常
 * 仍只留在手机原始库，避免朋友圈高频内容把长期记忆表淹没。
 */
export function 构造朋友圈社交轨迹(动态: 朋友圈条): 社交轨迹条目 | null {
  const 记忆 = 动态.长期记忆;
  if (!记忆) return null;
  const 事件键 = String(记忆.事件键 ?? '').trim();
  const 人物 = String(动态.谁 ?? '').trim();
  const 事件 = String(记忆.事件 ?? '').replace(/\s+/g, ' ').trim();
  const 结果 = String(记忆.结果 ?? '').replace(/\s+/g, ' ').trim();
  if (
    !/^RQP-朋友圈-[^\s]{1,120}$/u.test(事件键) ||
    !人物 ||
    人物 === '附近的人' ||
    !事件 ||
    !结果 ||
    !Number.isSafeInteger(动态.楼) ||
    动态.楼 < 0 ||
    !Number.isSafeInteger(动态.时) ||
    动态.时 < 0
  ) {
    return null;
  }
  return {
    类型: '朋友圈',
    人物,
    事件: Array.from(事件).slice(0, 80).join(''),
    结果: Array.from(结果).slice(0, 80).join(''),
    时间: 格式化游戏内时间(动态.时),
    楼层: 动态.楼,
    事件键,
  };
}

export async function 同步朋友圈长期记忆(
  动态: 朋友圈条,
  仍有效: () => boolean = () => true,
): Promise<数据库社交写入结果 | '无需写入'> {
  const 条目 = 构造朋友圈社交轨迹(动态);
  if (!条目 || !仍有效()) return '无需写入';
  return 同步社交轨迹(条目, 仍有效);
}

const 已确认事件键 = new Set<string>();
const 处理中事件键 = new Set<string>();

export function 构造朋友圈长期记忆执行键(聊天ID: string, 时间线世代: number, 事件键: string): string | null {
  if (!聊天ID || !Number.isSafeInteger(时间线世代) || 时间线世代 < 0 || !事件键) return null;
  return JSON.stringify([聊天ID, 时间线世代, 事件键]);
}

/**
 * 手机核心提交完成后的可选派生副作用；逐条串行，失败不阻塞手机，也不产生额外 AI 请求。
 * 调用方可把当前时间线全部动态重复交进来：内存键按聊天 ID + 手机时间线世代 + 事件键
 * 去重，切聊天或回档后不会沿用旧确认；刷新后自动再扫描持久动态，补偿上次数据库尚未
 * 就绪或提交待确认的窗口。
 */
export function 排队同步朋友圈长期记忆(
  动态们: readonly 朋友圈条[],
  仍有效: () => boolean = () => true,
): void {
  const 聊天ID = 当前聊天ID();
  const 时间线世代 = 读取当前手机时间线租约世代();
  const 批次仍有效 = () =>
    当前聊天ID() === 聊天ID && 读取当前手机时间线租约世代() === 时间线世代 && 仍有效();
  const 待写 = 动态们.flatMap(动态 => {
    const 条目 = 构造朋友圈社交轨迹(动态);
    const 执行键 = 条目 ? 构造朋友圈长期记忆执行键(聊天ID, 时间线世代, 条目.事件键) : null;
    if (!条目 || !执行键 || 已确认事件键.has(执行键) || 处理中事件键.has(执行键)) return [];
    处理中事件键.add(执行键);
    return [{ 动态, 执行键 }];
  });
  if (!待写.length) return;
  void (async () => {
    for (const { 动态, 执行键 } of 待写) {
      if (!批次仍有效()) return;
      const 结果 = await 同步朋友圈长期记忆(动态, 批次仍有效);
      if (结果 === '已确认') 已确认事件键.add(执行键);
      else if (结果 === '失败') {
        console.info(`[人妻公寓·手机] ${动态.谁}的朋友圈长期记忆暂不可用，不影响动态发布。`);
      }
    }
  })()
    .catch(error => console.warn('[人妻公寓·手机] 朋友圈长期记忆同步失败（不影响动态发布）:', error))
    .finally(() => {
      for (const { 执行键 } of 待写) 处理中事件键.delete(执行键);
    });
}
