import type { SchemaType } from '../../../schema';
import type { 门牌 } from '../../../stageConfig';
import { 户静态表 } from '../../../stageConfig';
import { 当前时间线切换世代 } from '../时间线切换协调';
import { 读取当前手机时间线租约世代 } from '../手机时间线租约';
import {
  同步社交轨迹,
  刷新SQLite能力缓存,
  探测数据库SQLite模式,
  数据库状态,
  读取微信进展摘要,
  序列化微信进展数据,
  type 微信进展引用,
} from '../数据库桥';
import { 编译近期微信胶囊, 楼务微信消息仍有效, 筛选待正文承接人物 } from '../微信正文承接';
import { 合并本地微信进展摘要 } from '../微信本地进展摘要';
import { 末楼, 当前手机数据, 当前聊天ID } from './运行时上下文';
import { 读配置 } from './配置';
import { 读库, 手机可见单条硬上限 } from './数据层';

/**
 * 手机微信摘要系统（拆分方案 P4）：SQLite 微信进展摘要的状态缓存、检测代次、
 * 事件键/双世代校验、刷新/排队/等待的真实所有者。只从叶子模块取值，
 * 不 import 内核/门面，也不反向依赖生成引擎。
 */

/** 记忆输入按代码单元设安全门，给150汉字及其标点、emoji留出完整空间。 */
const 手机可见记忆输入上限 = 手机可见单条硬上限 * 2;

// ============================================
// 摘要消息/点/快照结构与 SQLite 能力缓存
// ============================================

interface 微信摘要消息 {
  楼: number;
  发: '我' | '对方';
  文: string;
  类: string;
  图: string;
}

interface 微信摘要点 {
  事件键: string;
  截止索引: number;
  楼: number;
}

interface 微信摘要快照 {
  聊天ID: string;
  消息: 微信摘要消息[];
  点: 微信摘要点[];
}

const 微信摘要任务 = new Map<string, Promise<void>>();
const 微信摘要SQLite复检间隔 = 60_000;
let 微信摘要SQLite能力: { 可用: boolean; 检测时间: number } | null = null;
let 微信摘要SQLite检测任务: { 代次: number; promise: Promise<boolean> } | null = null;
let 微信摘要SQLite检测代次 = 0;

export function 重置微信摘要SQLite能力(): void {
  微信摘要SQLite检测代次 += 1;
  微信摘要SQLite能力 = null;
  微信摘要SQLite检测任务 = null;
  刷新SQLite能力缓存();
}

function 标记微信摘要SQLite不可用(): void {
  微信摘要SQLite检测代次 += 1;
  微信摘要SQLite能力 = { 可用: false, 检测时间: Date.now() };
  微信摘要SQLite检测任务 = null;
}

function 微信摘要SQLite近期不可用(): boolean {
  return 微信摘要SQLite能力?.可用 === false && Date.now() - 微信摘要SQLite能力.检测时间 < 微信摘要SQLite复检间隔;
}

export async function 确认微信摘要SQLite可写(): Promise<boolean> {
  if (微信摘要SQLite能力 && Date.now() - 微信摘要SQLite能力.检测时间 < 微信摘要SQLite复检间隔) {
    return 微信摘要SQLite能力.可用;
  }
  const 代次 = 微信摘要SQLite检测代次;
  if (微信摘要SQLite检测任务?.代次 === 代次) return 微信摘要SQLite检测任务.promise;
  const entry = { 代次, promise: Promise.resolve(false) };
  entry.promise = 探测数据库SQLite模式().then(
    可用 => {
      if (微信摘要SQLite检测代次 !== 代次) return false;
      微信摘要SQLite能力 = { 可用, 检测时间: Date.now() };
      if (微信摘要SQLite检测任务 === entry) 微信摘要SQLite检测任务 = null;
      return 可用;
    },
    () => {
      if (微信摘要SQLite检测代次 === 代次) {
        微信摘要SQLite能力 = { 可用: false, 检测时间: Date.now() };
        if (微信摘要SQLite检测任务 === entry) 微信摘要SQLite检测任务 = null;
      }
      return false;
    },
  );
  微信摘要SQLite检测任务 = entry;
  return entry.promise;
}

function 推进摘要哈希(hash: number, text: string): number {
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** 活跃任务（包括已扣分但仍可补办者）继续进入短期聊天、SQLite 摘要与本人正文承接。 */
export function 有效楼务任务id集合(data: SchemaType | null = 当前手机数据()): Set<string> {
  if (!data) return new Set();
  return new Set(data.系统._管理考核.活跃任务.map(任务 => 任务.id).filter(Boolean));
}

/**
 * 事件键由“当前聊天 + 当前仍存活的私聊前缀”导出。回档、改写或切档后旧键不会再获授权；
 * 相同楼号重掷出不同内容也会得到新键，不依赖数据库自行理解酒馆分支。
 */
function 取微信摘要快照(门牌号: 门牌, 截止楼 = 末楼(), 有效楼务任务id = 有效楼务任务id集合()): 微信摘要快照 | null {
  const 聊天ID = 当前聊天ID();
  if (!聊天ID) return null;
  const 消息 = 读库()
    .消息.filter(
      item =>
        item.会话 === 门牌号 &&
        item.楼 <= 截止楼 &&
        item.类 !== '撤回' &&
        (item.发 === '我' || item.发 === '对方') &&
        楼务微信消息仍有效(item, 有效楼务任务id) &&
        item.文.trim(),
    )
    .map((item): 微信摘要消息 => ({
      楼: item.楼,
      发: item.发 as '我' | '对方',
      文: item.文.trim(),
      类: item.类 ?? '文本',
      图: item.图 ?? '',
    }));
  let hashA = 推进摘要哈希(2166136261, `${聊天ID}\u0000${门牌号}`);
  let hashB = 推进摘要哈希(2246822507, `${门牌号}\u0000${聊天ID}`);
  let 有待回复玩家消息 = false;
  const 点: 微信摘要点[] = [];
  消息.forEach((item, index) => {
    // 楼务键只负责在映射前筛除失效消息，不进入既有摘要指纹；普通聊天和仍有效任务
    // 因而继续沿用升级前的事件键，只有任务失效、对应消息被移除时才自然换键。
    const token = JSON.stringify([item.楼, item.发, item.文, item.类, item.图]);
    hashA = 推进摘要哈希(hashA, token);
    hashB = 推进摘要哈希(hashB, `${token.length}:${token}`);
    if (item.发 === '我') 有待回复玩家消息 = true;
    else if (有待回复玩家消息) {
      const fingerprint = `${hashA.toString(36)}${hashB.toString(36)}`;
      点.push({
        事件键: `RQP-微信进展-${门牌号}-${item.楼}-${index + 1}-${fingerprint}`,
        截止索引: index,
        楼: item.楼,
      });
      有待回复玩家消息 = false;
    }
  });
  return { 聊天ID, 消息, 点 };
}

/** 给正文读取层的分支授权；数据库里不在这份活动前缀清单中的旧分支行一律不可注入。 */
export function 当前微信摘要引用(门牌号们: readonly 门牌[], 截止楼 = 末楼()): 微信进展引用[] {
  return _.uniq(门牌号们)
    .map(门牌号 => {
      const 快照 = 取微信摘要快照(门牌号, 截止楼);
      return {
        人物: 户静态表[门牌号]?.妻名 ?? '',
        有效事件键: (快照?.点 ?? [])
          .slice(-20)
          .reverse()
          .map(item => item.事件键),
      };
    })
    .filter(item => item.人物 && item.有效事件键.length);
}

/**
 * 数据库摘要是可选的长期层；当面正文还需直接承接当前分支最近私聊，避免未开 SQLite、
 * 摘要失败或刚聊完立即见面时本人失忆。这里只接收焦点检测授予的可靠在场妻名单。
 */
export function 读取近期微信胶囊(
  门牌号们: readonly 门牌[],
  截止楼: number,
  截止时段: number,
  有效楼务任务id们: readonly string[] = [],
  选项: { 仅本楼已完成往返?: boolean } = {},
): string {
  const 消息 = 读库().消息;
  const 可靠在场人物 = _.uniq(门牌号们)
    .map(门牌 => ({ 门牌, 人物: 户静态表[门牌]?.妻名 ?? '' }))
    .filter(item => item.人物);
  const 人物 = 选项.仅本楼已完成往返
    ? 筛选待正文承接人物(消息, 可靠在场人物, 截止楼, 截止时段, 有效楼务任务id们)
    : 可靠在场人物;
  return 编译近期微信胶囊(消息, 人物, 截止楼, 截止时段, 有效楼务任务id们);
}

function 微信摘要快照仍有效(
  门牌号: 门牌,
  聊天ID: string,
  事件键: string,
  时间线世代: number,
  手机租约世代: number,
): boolean {
  const 当前 = 取微信摘要快照(门牌号);
  return (
    时间线世代 === 当前时间线切换世代() &&
    手机租约世代 === 读取当前手机时间线租约世代() &&
    当前?.聊天ID === 聊天ID &&
    当前.点.at(-1)?.事件键 === 事件键
  );
}

async function 刷新微信进展摘要(
  门牌号: 门牌,
  聊天ID: string,
  事件键: string,
  时间线世代: number,
  手机租约世代: number,
): Promise<void> {
  const 微信摘要请求仍有效 = () => 微信摘要快照仍有效(门牌号, 聊天ID, 事件键, 时间线世代, 手机租约世代);
  if (!读配置().微信进展摘要) return;
  const 快照 = 取微信摘要快照(门牌号);
  const 当前点 = 快照?.点.at(-1);
  if (!快照 || 快照.聊天ID !== 聊天ID || 当前点?.事件键 !== 事件键) return;
  const db = 数据库状态();
  if (!db.可写表格 || !db.已装游戏模板) return;
  // 普通行 API 不能保证写到当前分支最新 AI 消息；本地合并后仍只在 SQLite 当前分支写入。
  if (!(await 确认微信摘要SQLite可写()) || !微信摘要请求仍有效()) return;
  const 妻名 = 户静态表[门牌号]?.妻名;
  if (!妻名) return;
  const 活动键 = 快照.点
    .slice(-120)
    .reverse()
    .map(item => item.事件键);
  const 旧记录 = 读取微信进展摘要(妻名, 活动键, 当前点.楼);
  if (旧记录?.事件键 === 当前点.事件键) return;
  const 旧点 = 旧记录 ? 快照.点.find(item => item.事件键 === 旧记录.事件键) : undefined;
  const 起点 = (旧点?.截止索引 ?? -1) + 1;
  const 增量 = 快照.消息
    .slice(起点, 当前点.截止索引 + 1)
    .slice(-24)
    .map(item => ({ 说话者: item.发 === '我' ? '玩家' : 妻名, 内容: item.文.slice(0, 手机可见记忆输入上限) }));
  if (!增量.length) return;
  try {
    const 结果 = 序列化微信进展数据(合并本地微信进展摘要(旧记录?.摘要, 妻名, 增量));
    if (!微信摘要请求仍有效()) return;
    if (!结果) return;
    const 已写入 = await 同步社交轨迹(
      {
        类型: '微信进展',
        人物: 妻名,
        事件: '与管理员的微信沟通进展（当前分支摘要版本）',
        结果,
        楼层: 当前点.楼,
        事件键,
      },
      微信摘要请求仍有效,
    );
    if (!已写入) {
      if (微信摘要请求仍有效()) {
        标记微信摘要SQLite不可用();
        console.warn(`[人妻公寓·手机] ${妻名}的微信进展未写入；脚本摘要已暂停，SQLite 恢复后再从上一成功版本补齐。`);
      }
    }
  } catch (error) {
    console.warn(`[人妻公寓·手机] ${妻名}的微信进展整理失败，不影响本次私聊:`, error);
  }
}

export function 排队刷新微信进展摘要(门牌号: 门牌): void {
  if (!读配置().微信进展摘要) return;
  if (微信摘要SQLite近期不可用()) return;
  const db = 数据库状态();
  if (!db.可写表格 || !db.已装游戏模板) return;
  const 快照 = 取微信摘要快照(门牌号);
  const 当前点 = 快照?.点.at(-1);
  if (!快照 || !当前点) return;
  const 时间线世代 = 当前时间线切换世代();
  const 手机租约世代 = 读取当前手机时间线租约世代();
  const 队列键 = `${快照.聊天ID}\n${时间线世代}\n${手机租约世代}\n${门牌号}`;
  const 前序 = 微信摘要任务.get(队列键) ?? Promise.resolve();
  const 任务 = 前序
    .catch(() => undefined)
    .then(() => 刷新微信进展摘要(门牌号, 快照.聊天ID, 当前点.事件键, 时间线世代, 手机租约世代));
  微信摘要任务.set(队列键, 任务);
  const 清理 = () => {
    if (微信摘要任务.get(队列键) === 任务) 微信摘要任务.delete(队列键);
  };
  void 任务.then(清理, 清理);
}

/** 正文若紧接在手机回复之后开始，只等待当前聊天的任务；超时沿用上一成功版本。 */
export async function 等待微信摘要任务(最长等待毫秒 = 5000): Promise<void> {
  const 聊天ID = 当前聊天ID();
  const 时间线世代 = 当前时间线切换世代();
  const 手机租约世代 = 读取当前手机时间线租约世代();
  const 当前队列前缀 = `${聊天ID}\n${时间线世代}\n${手机租约世代}\n`;
  const 任务们 = [...微信摘要任务.entries()].filter(([key]) => key.startsWith(当前队列前缀)).map(([, task]) => task);
  if (!任务们.length) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.allSettled(任务们).then(() => undefined),
      new Promise<void>(resolve => {
        timer = setTimeout(resolve, 最长等待毫秒);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
