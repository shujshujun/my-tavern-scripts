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
import { 合并本地群聊进展摘要, 合并本地微信进展摘要 } from '../微信本地进展摘要';
import { 末楼, 当前手机数据, 当前聊天ID } from './运行时上下文';
import { 读配置 } from './配置';
import { 读库, 压缩微信会话记录, 手机可见单条硬上限 } from './数据层';

/**
 * 手机微信摘要系统（拆分方案 P4）：SQLite 微信进展摘要的状态缓存、检测代次、
 * 事件键/双世代校验、刷新/排队/等待的真实所有者。只从叶子模块取值，
 * 不 import 内核/门面，也不反向依赖生成引擎。
 */

/** 记忆输入按代码单元设安全门，给150汉字及其标点、emoji留出完整空间。 */
const 手机可见记忆输入上限 = 手机可见单条硬上限 * 2;
const 私聊原始消息上限 = 48;
const 群聊原始消息上限 = 60;

// ============================================
// 摘要消息/点/快照结构与 SQLite 能力缓存
// ============================================

interface 微信摘要消息 {
  楼: number;
  时: number;
  发: '我' | '对方';
  文: string;
  类: string;
  图: string;
  序?: number;
}

interface 微信摘要点 {
  事件键: string;
  /** rq0.82 之前的滚动前缀键；只用于读取并升级旧摘要。 */
  兼容事件键: Array<{ 事件键: string; 截止索引: number }>;
  玩家索引: number;
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
      时: item.时,
      发: item.发 as '我' | '对方',
      文: item.文.trim(),
      类: item.类 ?? '文本',
      图: item.图 ?? '',
      ...(Number.isSafeInteger(item.序) && item.序! >= 0 ? { 序: item.序 } : {}),
    }));
  let hashA = 推进摘要哈希(2166136261, `${聊天ID}\u0000${门牌号}`);
  let hashB = 推进摘要哈希(2246822507, `${门牌号}\u0000${聊天ID}`);
  let 最后玩家消息: { 项: 微信摘要消息; 索引: number } | null = null;
  let 当前回复点索引 = -1;
  const 点: 微信摘要点[] = [];
  const 推入本人主动点 = (item: 微信摘要消息, index: number): void => {
    const 稳定串 = JSON.stringify([聊天ID, 门牌号, '本人主动', item]);
    const 稳定A = 推进摘要哈希(2166136261, 稳定串);
    const 稳定B = 推进摘要哈希(2246822507, `${稳定串.length}:${稳定串}`);
    const 稳定序 = Number.isSafeInteger(item.序) ? item.序 : item.时;
    点.push({
      事件键: `RQP-微信进展-${门牌号}-${item.楼}-${稳定序}-${稳定A.toString(36)}${稳定B.toString(36)}`,
      兼容事件键: [],
      玩家索引: index,
      截止索引: index,
      楼: item.楼,
    });
  };
  消息.forEach((item, index) => {
    // 楼务键只负责在映射前筛除失效消息，不进入既有摘要指纹；普通聊天和仍有效任务
    // 因而继续沿用升级前的事件键，只有任务失效、对应消息被移除时才自然换键。
    const token = JSON.stringify([item.楼, item.发, item.文, item.类, item.图]);
    hashA = 推进摘要哈希(hashA, token);
    hashB = 推进摘要哈希(hashB, `${token.length}:${token}`);
    if (item.发 === '我') {
      最后玩家消息 = { 项: item, 索引: index };
      当前回复点索引 = -1;
    } else if (最后玩家消息) {
      // 手机回复沿用玩家点击时冻结的楼/时；不同时间到达的主动消息不是这次回复，不能误接在旧问题后。
      if (item.楼 !== 最后玩家消息.项.楼 || item.时 !== 最后玩家消息.项.时) {
        最后玩家消息 = null;
        当前回复点索引 = -1;
        推入本人主动点(item, index);
        return;
      }
      // 事件键只由“最后一只玩家气泡 + 本轮最后一只回复气泡”生成，
      // 不再依赖可能被安全压缩的整段历史前缀。多气泡回复会原地更新同一点，
      // 确保摘要包含本批最后一只真正落库的回复。
      const 稳定串 = JSON.stringify([聊天ID, 门牌号, 最后玩家消息.项, item]);
      const 稳定A = 推进摘要哈希(2166136261, 稳定串);
      const 稳定B = 推进摘要哈希(2246822507, `${稳定串.length}:${稳定串}`);
      const 稳定序 = Number.isSafeInteger(item.序) ? item.序 : item.时;
      const 旧前缀键 = `RQP-微信进展-${门牌号}-${item.楼}-${index + 1}-${hashA.toString(36)}${hashB.toString(36)}`;
      const 新点: 微信摘要点 = {
        事件键: `RQP-微信进展-${门牌号}-${item.楼}-${稳定序}-${稳定A.toString(36)}${稳定B.toString(36)}`,
        兼容事件键: [{ 事件键: 旧前缀键, 截止索引: index }],
        玩家索引: 最后玩家消息.索引,
        截止索引: index,
        楼: item.楼,
      };
      if (当前回复点索引 >= 0) {
        新点.兼容事件键 = _.uniqBy(
          [...点[当前回复点索引].兼容事件键, { 事件键: 旧前缀键, 截止索引: index }],
          item => item.事件键,
        );
        点[当前回复点索引] = 新点;
      } else {
        点.push(新点);
        当前回复点索引 = 点.length - 1;
      }
    } else {
      // 主动私聊同样是本人真实说过的话；独立成点，不能等玩家以后回复才获得长期记忆。
      推入本人主动点(item, index);
    }
  });
  return { 聊天ID, 消息, 点 };
}

function 查找微信摘要点(快照: 微信摘要快照, 事件键: string): { 点: 微信摘要点; 兼容截止索引?: number } | undefined {
  for (const 点 of 快照.点) {
    if (点.事件键 === 事件键) return { 点 };
    const 兼容 = 点.兼容事件键.find(item => item.事件键 === 事件键);
    if (兼容) return { 点, 兼容截止索引: 兼容.截止索引 };
  }
  return undefined;
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
          .flatMap(item => [item.事件键, ...item.兼容事件键.map(兼容 => 兼容.事件键)])
          .slice(0, 20),
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
    .flatMap(item => [item.事件键, ...item.兼容事件键.map(兼容 => 兼容.事件键)])
    .slice(0, 120);
  const 旧记录 = 读取微信进展摘要(妻名, 活动键, 当前点.楼);
  if (旧记录?.事件键 === 当前点.事件键) {
    await 压缩微信会话记录(门牌号, 私聊原始消息上限, 微信摘要请求仍有效);
    return;
  }
  const 旧匹配 = 旧记录 ? 查找微信摘要点(快照, 旧记录.事件键) : undefined;
  // 兼容旧滚动键时从该轮玩家气泡重放：多气泡回复才能由旧首泡摘要升级到最终泡摘要。
  const 起点 = 旧匹配 ? (旧匹配.兼容截止索引 === undefined ? 旧匹配.点.截止索引 + 1 : 旧匹配.点.玩家索引) : 0;
  const 增量 = 快照.消息
    .slice(起点, 当前点.截止索引 + 1)
    .map(item => ({ 说话者: item.发 === '我' ? '玩家' : 妻名, 内容: item.文.slice(0, 手机可见记忆输入上限) }));
  if (!增量.length && !旧记录) return;
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
    if (已写入) {
      await 压缩微信会话记录(门牌号, 私聊原始消息上限, 微信摘要请求仍有效);
      return;
    }
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

function 群聊记忆主体(会话: '群' | '姐妹群'): string {
  return 会话 === '姐妹群' ? '姐妹茶话会' : '公寓住户群';
}

function 取群聊摘要快照(会话: '群' | '姐妹群', 截止楼 = 末楼()): 微信摘要快照 | null {
  const 聊天ID = 当前聊天ID();
  if (!聊天ID) return null;
  const 消息 = 读库()
    .消息.filter(
      item =>
        item.会话 === 会话 &&
        item.楼 <= 截止楼 &&
        item.类 !== '撤回' &&
        (item.发 === '我' || item.发 === '对方') &&
        item.文.trim(),
    )
    .map((item): 微信摘要消息 => ({
      楼: item.楼,
      时: item.时,
      发: item.发 as '我' | '对方',
      文: item.文.trim(),
      类: item.类 ?? '文本',
      图: item.图 ?? '',
      ...(Number.isSafeInteger(item.序) && item.序! >= 0 ? { 序: item.序 } : {}),
    }));
  const 点 = 消息.map((item, index): 微信摘要点 => {
    const token = JSON.stringify([聊天ID, 会话, item]);
    const hashA = 推进摘要哈希(2166136261, token);
    const hashB = 推进摘要哈希(2246822507, `${token.length}:${token}`);
    const 稳定序 = Number.isSafeInteger(item.序) ? item.序 : item.时;
    return {
      事件键: `RQP-微信进展-${会话}-${item.楼}-${稳定序}-${hashA.toString(36)}${hashB.toString(36)}`,
      兼容事件键: [],
      玩家索引: index,
      截止索引: index,
      楼: item.楼,
    };
  });
  return { 聊天ID, 消息, 点 };
}

/** 只授权当前分支仍存在的群摘要版本；私聊事件键不会进入这份清单。 */
export function 当前群聊摘要引用(会话: '群' | '姐妹群', 截止楼 = 末楼()): string[] {
  return (取群聊摘要快照(会话, 截止楼)?.点 ?? [])
    .slice(-20)
    .reverse()
    .map(item => item.事件键);
}

function 群聊摘要快照仍有效(
  会话: '群' | '姐妹群',
  聊天ID: string,
  事件键: string,
  时间线世代: number,
  手机租约世代: number,
): boolean {
  const 当前 = 取群聊摘要快照(会话);
  return (
    时间线世代 === 当前时间线切换世代() &&
    手机租约世代 === 读取当前手机时间线租约世代() &&
    当前?.聊天ID === 聊天ID &&
    当前.点.at(-1)?.事件键 === 事件键
  );
}

function 解析群摘要消息(消息: 微信摘要消息): { 说话者: string; 内容: string } | null {
  if (消息.发 === '我') return { 说话者: '玩家', 内容: 消息.文.slice(0, 手机可见记忆输入上限) };
  const 匹配 = 消息.文.match(/^([^:：\n]{1,20})[:：]\s*(.+)$/u);
  return 匹配 ? { 说话者: 匹配[1].trim(), 内容: 匹配[2].trim().slice(0, 手机可见记忆输入上限) } : null;
}

async function 刷新群聊进展摘要(
  会话: '群' | '姐妹群',
  聊天ID: string,
  事件键: string,
  时间线世代: number,
  手机租约世代: number,
): Promise<void> {
  const 请求仍有效 = () => 群聊摘要快照仍有效(会话, 聊天ID, 事件键, 时间线世代, 手机租约世代);
  if (!读配置().微信进展摘要) return;
  const 快照 = 取群聊摘要快照(会话);
  const 当前点 = 快照?.点.at(-1);
  if (!快照 || 快照.聊天ID !== 聊天ID || 当前点?.事件键 !== 事件键) return;
  const db = 数据库状态();
  if (!db.可写表格 || !db.已装游戏模板) return;
  if (!(await 确认微信摘要SQLite可写()) || !请求仍有效()) return;
  const 主体 = 群聊记忆主体(会话);
  const 活动键 = 快照.点
    .slice(-120)
    .reverse()
    .map(item => item.事件键);
  const 旧记录 = 读取微信进展摘要(主体, 活动键, 当前点.楼);
  if (旧记录?.事件键 === 当前点.事件键) {
    await 压缩微信会话记录(会话, 群聊原始消息上限, 请求仍有效);
    return;
  }
  const 旧点 = 旧记录 ? 快照.点.find(item => item.事件键 === 旧记录.事件键) : undefined;
  const 起点 = (旧点?.截止索引 ?? -1) + 1;
  const 增量 = 快照.消息
    .slice(起点, 当前点.截止索引 + 1)
    .map(解析群摘要消息)
    .filter((item): item is { 说话者: string; 内容: string } => !!item);
  if (!增量.length) return;
  try {
    const 结果 = 序列化微信进展数据(合并本地群聊进展摘要(旧记录?.摘要, 主体, 增量));
    if (!请求仍有效() || !结果) return;
    const 已写入 = await 同步社交轨迹(
      {
        类型: '微信进展',
        人物: 主体,
        事件: `${主体}的群内已公开话题（当前分支摘要版本）`,
        结果,
        楼层: 当前点.楼,
        事件键,
      },
      请求仍有效,
    );
    if (已写入) {
      await 压缩微信会话记录(会话, 群聊原始消息上限, 请求仍有效);
      return;
    }
    if (请求仍有效()) {
      标记微信摘要SQLite不可用();
      console.warn(`[人妻公寓·手机] ${主体}的群内进展未写入；原始消息保持不动，SQLite 恢复后再补。`);
    }
  } catch (error) {
    console.warn(`[人妻公寓·手机] ${主体}的群内进展整理失败，不影响本轮群聊:`, error);
  }
}

export function 排队刷新群聊进展摘要(会话: '群' | '姐妹群'): void {
  if (!读配置().微信进展摘要 || 微信摘要SQLite近期不可用()) return;
  const db = 数据库状态();
  if (!db.可写表格 || !db.已装游戏模板) return;
  const 快照 = 取群聊摘要快照(会话);
  const 当前点 = 快照?.点.at(-1);
  if (!快照 || !当前点) return;
  const 时间线世代 = 当前时间线切换世代();
  const 手机租约世代 = 读取当前手机时间线租约世代();
  const 队列键 = `${快照.聊天ID}\n${时间线世代}\n${手机租约世代}\n群:${会话}`;
  const 前序 = 微信摘要任务.get(队列键) ?? Promise.resolve();
  const 任务 = 前序
    .catch(() => undefined)
    .then(() => 刷新群聊进展摘要(会话, 快照.聊天ID, 当前点.事件键, 时间线世代, 手机租约世代));
  微信摘要任务.set(队列键, 任务);
  const 清理 = () => {
    if (微信摘要任务.get(队列键) === 任务) 微信摘要任务.delete(队列键);
  };
  void 任务.then(清理, 清理);
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
