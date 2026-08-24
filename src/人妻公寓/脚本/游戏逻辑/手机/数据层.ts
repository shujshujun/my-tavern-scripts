import type { 门牌 } from '../../../stageConfig';
import { 户静态表, 门牌列表 } from '../../../stageConfig';
import { 同一换装余波事件, type 换装余波 } from '../雌竞系统';
import { 建私聊图库地址索引, 重建已发私聊图, type 私聊图片消息记录, type 已发私聊图缓存 } from '../私聊图片轮换';
import { 私聊图库清单 } from '../私聊图库清单';
import {
  创建手机已读时锚,
  较晚手机已读时锚,
  手机分支变更后已读时锚,
  手机记录晚于已读,
  手机记录在当前时间线,
  规范手机已读时锚,
  最后手机时间记录,
  type 手机已读时锚,
} from '../手机已读水位';
import { 附手机分支锚, 裁删楼后记录, 裁同楼切分支记录, 手机记录属于当前分支 } from '../手机分支隔离';
import { 验收单条群消息 } from '../手机群聊格式';
import { 规范手机单气泡 } from '../手机文本格式';
import { 创建手机时间线租约, 手机时间线租约仍有效 } from '../手机时间线租约';
import { 时间线切换协调中 } from '../时间线切换协调';
import { 合并微信撤回状态, type 微信消息记录 } from '../微信消息撤回';
import { 构造微信联系保护表, type 微信联系保护表 } from '../微信每日联系';
import { 压缩微信会话消息 } from '../微信消息压缩';
import {
  多人邀约地点合法,
  合并手机邀约计划,
  手机邀约计划可提交,
  手机邀约计划成员,
  手机邀约计划键,
  type 手机邀约计划,
} from './邀约计划';
import { 末楼, 当前聊天ID, 当前手机绝对时段 } from './运行时上下文';
import { 请求刷新手机红点 } from './UI刷新';
import { 朋友圈允许公开互动 } from './朋友圈隐私';
import type { 朋友圈主题 } from './内容素材表';
import { 合并手机记录投影 } from './原始库投影';

/**
 * 手机数据层（拆分方案 P3）：`_微信` 数据块的真实所有者。
 * 只读宿主/MVU 与手机叶子模块，不 import 内核；UI 刷新经 ./UI刷新 注册表请求，
 * 不直接依赖内核的 渲染/刷新红点。
 */

// ============================================
// 共享基础
// ============================================

/** 玩家可见的手机内容只保留宽松安全门；不再要求模型把自然表达压进20～60字。 */
export const 手机可见单条硬上限 = 150;

/** 玩家名(酒馆 persona 名;手机生成不知道玩家叫啥时会自创"王师傅"式称呼——一律显式传入) */
export function 玩家名(): string {
  return (SillyTavern as unknown as { name1?: string })?.name1 || '管理员';
}

/** 单气泡允许模型的无害排版折行与自己的中英文冒号标签；合并后再执行硬上限。
 * 名册上其他人的"人名:"行=模型混入第二说话人,整条拒收——否则别人的台词会并进
 * 当前角色的气泡里冒充她说的话(2026-08-03 审计 M4);自己的首标签照旧可剥。 */
export function 验收短文本(原: string, 最大字数: number, 可剥首标签: readonly string[] = []): string | null {
  const 自称 = new Set(可剥首标签.map(名 => 名.trim()).filter(Boolean));
  const 他人 = new Set<string>();
  for (const m of Object.keys(户静态表) as 门牌[]) {
    const 配 = 户静态表[m];
    for (const 名 of [配?.妻名, 配?.夫名]) if (名 && !自称.has(名)) 他人.add(名);
  }
  const 玩家 = 玩家名().trim();
  if (玩家 && !自称.has(玩家)) 他人.add(玩家);
  return 规范手机单气泡(原, {
    最大汉字: 最大字数,
    可剥首标签,
    已知说话人: [...他人],
    禁止多说话人: true,
  });
}

const 私聊图库地址索引 = 建私聊图库地址索引(私聊图库清单);

/** 统一供手机读库与回合回档裁剪使用，避免两处各自猜测图片轮换语义。 */
export function 按消息重建已发私聊图(消息: readonly 私聊图片消息记录[], 截止楼: number): 已发私聊图缓存 {
  return 重建已发私聊图(消息, 截止楼, 私聊图库地址索引);
}

// ============================================
// 数据(chat 变量 _微信)
// ============================================

export type 微信消息 = 微信消息记录;

export interface 朋友圈条 {
  楼: number;
  /** 发布时的绝对时段；真实消息楼只负责回档裁剪。 */
  时: number;
  /** v0.80 可选单调顺序：同楼同时段内区分先后；旧无序记录保持原楼/时解释。 */
  序?: number;
  /** 创建时所在酒馆消息分支的签名；同楼 swipe 后旧分支动态不得继续可见。 */
  锚签名?: string;
  谁: string; // 妻名 | '附近的人'
  文: string;
  评: { 谁: string; 文: string }[];
  /** 配图(2026-07-19 用户拍板):`{妻名}/{类}_{n}` → 素材基址/微信圈/…webp;
   *  AI 只用 [图:类] marker 选类型,选哪张归脚本;图不存在 onerror 自净=图库可后补 */
  图?: string;
  /** 脚本预选主题，用于跨角色/跨回合去重；无显式主题的纯文本动态可从图片路径推断。 */
  题?: 朋友圈主题;
  /** 仅你可见(P5;spec:L4解锁低频,公开流永远贤妻——这条只有玩家刷得到);
   *  图走独立池 素材基址/微信圈/仅你可见/{角色}_{n}.webp(档位=堕落分档,母亲最厚1~5) */
  私?: { 图序: number };
}

export interface 微信库 {
  消息: 微信消息[];
  圈: 朋友圈条[];
  读到: Record<string, number>; // 会话 → 已读到的楼层戳
  /** 同楼跨绝对时段的复合已读锚；数字 `读到` 供回档裁剪楼层分支。 */
  读时: Record<string, 手机已读时锚>;
  圈读到: number;
  /** 朋友圈与 `圈读到` 配对的绝对时段锚。 */
  圈读时: 手机已读时锚;
  节拍: Record<string, number>; // 内容引擎水位线(`圈:${门牌}`/`私:${门牌}`/`群`)
  /** 每户当前轮的共享图库ID缓存；业务读取始终从带楼层消息重建，避免回档残留。 */
  已发私聊图: Partial<Record<门牌, string[]>>;
}

export interface 手机余波身份 {
  事件ID?: string;
  门牌: 门牌;
  起楼: number;
  物: string;
  私密: boolean;
}

export type 手机余波标记 = Partial<Pick<换装余波, '圈晒' | '群议' | '探针'>>;

export interface 手机余波消费 {
  预期: 手机余波身份;
  标记: 手机余波标记;
}

export interface 手机赴约提交 {
  m: 门牌;
  起楼: number;
  至楼: number;
}

export function 取余波身份(余波: 换装余波): 手机余波身份 {
  return { 事件ID: 余波.事件ID, 门牌: 余波.门牌, 起楼: 余波.起楼, 物: 余波.物, 私密: !!余波.私密 };
}

export function 余波身份相同(a: 手机余波身份 | 换装余波 | null, b: 手机余波身份 | 换装余波): boolean {
  return 同一换装余波事件(a, b);
}

/**
 * 在首次读取与回档裁剪后，依存活记录修正复合锚的楼号和时段。
 * 写库增量必须在追加新内容前调用，否则同楼新时段内容可能被误标已读。
 */
function 规范已读水位(库: 微信库, 当前绝对时段: number): void {
  const 会话集 = new Set([...Object.keys(库.读到), ...Object.keys(库.读时)]);
  for (const 会话 of 会话集) {
    const 锚 = 规范手机已读时锚(
      库.读到[会话],
      库.读时[会话],
      库.消息.filter(m => m.会话 === 会话 && m.发 === '对方'),
      当前绝对时段,
    );
    库.读到[会话] = 锚.楼;
    库.读时[会话] = 锚;
  }
  const 圈锚 = 规范手机已读时锚(库.圈读到, 库.圈读时, 库.圈, 当前绝对时段);
  库.圈读到 = 圈锚.楼;
  库.圈读时 = 圈锚;
}

/** 读取记录的可选单调顺序；只接受非负安全整数，非法/缺失值按无序遍历（不截断小数）。 */
function 记录安全序(记录: { 序?: unknown }): number | null {
  const 序 = 记录.序;
  return typeof 序 === 'number' && 序 >= 0 && Number.isSafeInteger(序) ? 序 : null;
}

function 会话消息未读(库: 微信库, 消息: 微信消息, 当前楼: number, 当前绝对时段: number): boolean {
  if (消息.发 !== '对方' || !手机记录在当前时间线(消息, 当前楼, 当前绝对时段)) return false;
  const 已读楼 = 库.读到[消息.会话] ?? -1;
  const 已读时锚 = 库.读时[消息.会话] ?? 创建手机已读时锚(已读楼, -1);
  return 手机记录晚于已读(消息, 已读楼, 已读时锚);
}

export function 会话有未读(库: 微信库, 会话: string | undefined, 当前楼: number, 当前绝对时段: number): boolean {
  return 库.消息.some(
    消息 => (会话 === undefined || 消息.会话 === 会话) && 会话消息未读(库, 消息, 当前楼, 当前绝对时段),
  );
}

export function 朋友圈有未读(库: 微信库, 当前楼: number, 当前绝对时段: number): boolean {
  return 库.圈.some(c => 手机记录在当前时间线(c, 当前楼, 当前绝对时段) && 手机记录晚于已读(c, 库.圈读到, 库.圈读时));
}

function 是普通对象(值: unknown): 值 is Record<string, unknown> {
  if (值 === null || typeof 值 !== 'object' || Array.isArray(值)) return false;
  const 原型 = Object.getPrototypeOf(值);
  return 原型 === Object.prototype || 原型 === null;
}

function 数组或空<T>(值: unknown): T[] {
  return Array.isArray(值) ? (值 as T[]) : [];
}

function 对象或空<T extends object>(值: unknown): T {
  return (是普通对象(值) ? 值 : {}) as T;
}

/** `_微信` 单条时间记录的共同边界：坏容器/坏条目失败关闭，合法扩展字段原样保留。 */
function 是手机时间记录(值: unknown): 值 is Record<string, unknown> & { 楼: number; 时: number } {
  return (
    是普通对象(值) &&
    typeof 值.楼 === 'number' &&
    Number.isFinite(值.楼) &&
    typeof 值.时 === 'number' &&
    Number.isFinite(值.时)
  );
}

function 手机时间记录数组<T extends { 楼: number; 时: number }>(值: unknown): T[] {
  return 数组或空<unknown>(值).filter((记录): 记录 is T => 是手机时间记录(记录));
}

function 清理消息可选字段(原: Record<string, unknown>): 微信消息 {
  const 消息 = { ...原 } as unknown as 微信消息;
  if (原.类 !== undefined && !['文本', '照片', '撤回', '通话'].includes(String(原.类))) delete 消息.类;
  for (const 字段 of ['键', '图', '标识', '锚签名'] as const) {
    if (原[字段] !== undefined && typeof 原[字段] !== 'string') delete 消息[字段];
  }
  if (原.引用 !== undefined) {
    if (!是普通对象(原.引用)) {
      delete 消息.引用;
    } else {
      const 标识 = typeof 原.引用.标识 === 'string' && 原.引用.标识 ? 原.引用.标识 : undefined;
      const 序 =
        typeof 原.引用.序 === 'number' && 原.引用.序 >= 0 && Number.isSafeInteger(原.引用.序)
          ? 原.引用.序
          : undefined;
      if (标识 === undefined && 序 === undefined) delete 消息.引用;
      else 消息.引用 = { ...(标识 !== undefined ? { 标识 } : {}), ...(序 !== undefined ? { 序 } : {}) };
    }
  }
  return 消息;
}

/**
 * 直接写消息的通话/撤回入口也必须复用此边界，不能各自把 `_微信.消息` 强转成数组。
 * 非法顺序值继续原样保留，由顺序比较器按“无序旧记录”处理，避免读库顺手改档。
 */
export function 规范微信消息容器(值: unknown): 微信消息[] {
  return 数组或空<unknown>(值).flatMap(记录 => {
    if (
      !是手机时间记录(记录) ||
      typeof 记录.会话 !== 'string' ||
      !记录.会话 ||
      !['我', '对方', '系统'].includes(String(记录.发)) ||
      typeof 记录.文 !== 'string'
    )
      return [];
    return [清理消息可选字段(记录)];
  });
}

function 规范朋友圈容器(值: unknown): 朋友圈条[] {
  return 数组或空<unknown>(值).flatMap(记录 => {
    if (!是手机时间记录(记录) || typeof 记录.谁 !== 'string' || !记录.谁 || typeof 记录.文 !== 'string') return [];
    const 动态 = { ...记录 } as unknown as 朋友圈条;
    if (记录.图 !== undefined && typeof 记录.图 !== 'string') delete 动态.图;
    return [动态];
  });
}

function 有限数字映射(值: unknown): Record<string, number> {
  const 结果: Record<string, number> = {};
  for (const [键, 项] of Object.entries(对象或空<Record<string, unknown>>(值))) {
    if (typeof 项 === 'number' && Number.isFinite(项)) 结果[键] = 项;
  }
  return 结果;
}

function 已读时锚映射(值: unknown): Record<string, 手机已读时锚> {
  const 结果: Record<string, 手机已读时锚> = {};
  for (const [键, 项] of Object.entries(对象或空<Record<string, unknown>>(值))) {
    if (是普通对象(项)) 结果[键] = 项 as unknown as 手机已读时锚;
  }
  return 结果;
}

function 已发图片映射(值: unknown): 已发私聊图缓存 {
  const 结果: 已发私聊图缓存 = {};
  for (const [键, 项] of Object.entries(对象或空<Record<string, unknown>>(值))) {
    if (Array.isArray(项)) 结果[键 as 门牌] = 项.filter((id): id is string => typeof id === 'string');
  }
  return 结果;
}

type 已归一微信原始库 = Partial<微信库> &
  Pick<微信库, '消息' | '圈' | '读到' | '读时' | '节拍' | '已发私聊图'>;

/**
 * `_微信` 没有 Schema 保护，所有读写入口都先在浅拷贝上归一 JSON-like 容器。
 * 这样不会在只读时偷偷迁移存档，也不会丢掉第三方扩展的未知顶层字段。
 */
function 归一微信原始库(值: unknown): 已归一微信原始库 {
  const 原 = { ...对象或空<Partial<微信库>>(值) };
  return {
    ...原,
    消息: 规范微信消息容器(原.消息),
    圈: 规范朋友圈容器(原.圈),
    读到: 有限数字映射(原.读到),
    读时: 已读时锚映射(原.读时),
    圈读到: typeof 原.圈读到 === 'number' && Number.isFinite(原.圈读到) ? 原.圈读到 : undefined,
    圈读时: 是普通对象(原.圈读时) ? (原.圈读时 as unknown as 手机已读时锚) : undefined,
    节拍: 有限数字映射(原.节拍),
    已发私聊图: 已发图片映射(原.已发私聊图),
  };
}

function 筛当前手机时间线<T extends { 楼: number; 时: number }>(
  记录们: readonly T[],
  当前楼: number,
  当前绝对时段: number,
): T[];
function 筛当前手机时间线<T extends { 楼: number; 时: number }>(
  记录们: unknown,
  当前楼: number,
  当前绝对时段: number,
): T[];
function 筛当前手机时间线<T extends { 楼: number; 时: number }>(
  记录们: unknown,
  当前楼: number,
  当前绝对时段: number,
): T[] {
  // 未就绪哨兵 -1 由 手机记录在当前时间线 内部识别：只放弃时轴比较，楼轴与
  // 分支过滤始终执行——未就绪不清屏，但未来楼/错误分支仍不可见。
  return 手机时间记录数组<T>(记录们).filter(
    记录 => 手机记录在当前时间线(记录, 当前楼, 当前绝对时段) && 手机记录属于当前分支(记录, SillyTavern.chat ?? []),
  );
}

export function 带当前手机分支锚<T extends { 楼: number; 锚签名?: string }>(记录: T): T {
  return 附手机分支锚(记录, SillyTavern.chat ?? []);
}

type 手机宿主保存接口 = {
  saveMetadata?: () => void | Promise<void>;
  saveChat?: () => void | Promise<void>;
  getContext?: () => 手机宿主保存接口 | null | undefined;
};

let 手机聊天变量持久化队列: Promise<void> = Promise.resolve();
let 已警告缺少手机硬保存接口 = false;

function 读取手机宿主保存接口(): { 上下文: 手机宿主保存接口; 保存: () => void | Promise<void> } | null {
  const 候选 = new Set<手机宿主保存接口>();
  const 加入候选 = (值: unknown): void => {
    if ((typeof 值 === 'object' && 值 !== null) || typeof 值 === 'function') 候选.add(值 as 手机宿主保存接口);
  };
  try {
    加入候选(SillyTavern);
  } catch {
    /* 极旧运行时未注入时继续找父窗口。 */
  }
  try {
    加入候选((globalThis as unknown as { SillyTavern?: unknown }).SillyTavern);
  } catch {
    /* 全局包装对象不可读时继续。 */
  }
  try {
    加入候选((window.parent as unknown as { SillyTavern?: unknown })?.SillyTavern);
  } catch {
    /* sandbox/跨域时由 iframe 注入接口兜底。 */
  }
  for (const 候选项 of 候选) {
    let 上下文 = 候选项;
    try {
      上下文 = 候选项.getContext?.() ?? 候选项;
    } catch {
      // 包装对象取 context 失败时仍尝试它自身暴露的接口。
      上下文 = 候选项;
    }
    for (const 方法名 of ['saveMetadata', 'saveChat'] as const) {
      const 保存 = 上下文[方法名];
      if (typeof 保存 === 'function') return { 上下文, 保存 };
    }
  }
  return null;
}

/**
 * 酒馆助手的 chat 变量更新只会安排防抖保存；这里把手机提交串行接到宿主立即保存接口，
 * 保证玩家已经看见的气泡在本函数返回前真正落盘。排队期间切聊则失败关闭，绝不把旧聊天
 * 的延迟提交误保存到新聊天。旧宿主没有接口时保留原防抖兼容路径，并只警告一次。
 */
export async function 立即持久保存手机聊天变量(预期聊天ID = 当前聊天ID()): Promise<boolean> {
  const 需要校验聊天 = !!预期聊天ID;
  const 本次保存 = 手机聊天变量持久化队列
    .catch(() => undefined)
    .then(async (): Promise<boolean> => {
      if (需要校验聊天 && 当前聊天ID() !== 预期聊天ID) return false;
      const 接口 = 读取手机宿主保存接口();
      if (!接口) {
        if (!已警告缺少手机硬保存接口) {
          已警告缺少手机硬保存接口 = true;
          console.warn('[人妻公寓·手机] 宿主没有暴露 saveMetadata/saveChat，微信记录只能沿用防抖保存兼容路径。');
        }
        return false;
      }
      await Promise.resolve(接口.保存.call(接口.上下文));
      return !需要校验聊天 || 当前聊天ID() === 预期聊天ID;
    });
  手机聊天变量持久化队列 = 本次保存.then(
    () => undefined,
    () => undefined,
  );
  try {
    return await 本次保存;
  } catch (e) {
    console.error('[人妻公寓·手机] 微信聊天变量立即保存失败:', e);
    return false;
  }
}

/**
 * 宿主明确报告删楼/swipe 后物理裁枝，避免旧分支稳定键在下一次写库时被合并复活。
 * 返回是否真实写入了 `_微信`；可选 允许写入 在 updateVariablesWith 回调最前面复核
 * （原生删楼/swipe 协调传 时间线切换租约.仍为最新），失效时整次收口不改 `_微信`、
 * 不刷新红点，并返回未写结果，避免旧协调收口或推进新分支的已读水位。
 */
export async function 隔离当前手机分支(
  变更楼 = 末楼(),
  允许写入: () => boolean = () => true,
  类型: '切分支' | '删楼' = '切分支',
): Promise<boolean> {
  const 写入聊天ID = 当前聊天ID();
  let 已写 = false;
  await updateVariablesWith(
    vars => {
      // 排队收口与实际改写之间仍可能切聊/回档/再次 swipe：在离提交最近的位置复核，
      // 不能只依赖调用前的瞬时检查。
      if (!允许写入()) return vars;
      const v = 归一微信原始库(_.get(vars, '_微信'));
      const 聊天 = SillyTavern.chat ?? [];
      v.消息 = 类型 === '删楼' ? 裁删楼后记录(v.消息, 变更楼, 聊天) : 裁同楼切分支记录(v.消息, 变更楼, 聊天);
      // 朋友圈没有玩家手动输入例外；明确 swipe 时无锚同楼动态按隐私优先一律裁掉。
      v.圈 = 类型 === '删楼' ? 裁删楼后记录(v.圈, 变更楼, 聊天) : 裁同楼切分支记录(v.圈, 变更楼, 聊天);
      const 当前楼 = 末楼();
      const 当前绝对时段 = 当前手机绝对时段();
      const 读到 = { ...v.读到 };
      const 读时 = { ...v.读时 };
      for (const 会话 of new Set([...Object.keys(读到), ...Object.keys(读时)])) {
        const 锚 = 手机分支变更后已读时锚(
          读到[会话],
          读时[会话],
          v.消息.filter(消息 => 消息.会话 === 会话 && 消息.发 === '对方'),
          当前绝对时段,
          变更楼,
          当前楼,
        );
        读到[会话] = 锚.楼;
        读时[会话] = 锚;
      }
      v.读到 = 读到;
      v.读时 = 读时;
      const 圈锚 = 手机分支变更后已读时锚(v.圈读到, v.圈读时, v.圈, 当前绝对时段, 变更楼, 当前楼);
      v.圈读到 = 圈锚.楼;
      v.圈读时 = 圈锚;
      _.set(vars, '_微信', v);
      已写 = true;
      return vars;
    },
    { type: 'chat' },
  );
  if (已写) {
    await 立即持久保存手机聊天变量(写入聊天ID);
    请求刷新手机红点();
  }
  return 已写;
}

export function 读库(): 微信库 {
  const v = 归一微信原始库(_.get(getVariables({ type: 'chat' }), '_微信'));
  const 当前楼 = 末楼();
  const 当前绝对时段 = 当前手机绝对时段();
  const 合法群成员 = new Set(门牌列表.map(m => 户静态表[m].妻名));
  const 消息 = 筛当前手机时间线(v.消息, 当前楼, 当前绝对时段).filter(
    m =>
      m.类 === '撤回' ||
      m.发 !== '对方' ||
      (m.会话 === '群'
        ? 验收单条群消息(m.文, 合法群成员, 手机可见单条硬上限) !== null
        : m.会话 === '姐妹群'
          ? 验收单条群消息(m.文, 合法群成员, 手机可见单条硬上限) !== null
          : 验收短文本(m.文, 手机可见单条硬上限) !== null),
  );
  const 圈 = 筛当前手机时间线(v.圈, 当前楼, 当前绝对时段)
    .filter(x => 验收短文本(x.文, 手机可见单条硬上限) !== null)
    .map(x => ({
      ...x,
      // 仅你可见的动态只有玩家本人能刷到；即使旧档或第三方数据残留评论，也必须按隐私语义归零。
      评: 朋友圈允许公开互动(x)
        ? 数组或空<{ 谁: string; 文: string }>(x.评).filter(
            p => 是普通对象(p) && 验收短文本(p.文, 手机可见单条硬上限) !== null,
          )
        : [],
    }));
  const 库: 微信库 = {
    消息,
    圈,
    读到: { ...v.读到 },
    读时: { ...v.读时 },
    圈读到: v.圈读到 ?? -1,
    // 尚无辅助锚时使用失配哨兵，下方会从当前时间线的朋友圈记录重建。
    圈读时: v.圈读时 ?? 创建手机已读时锚(-1, -1),
    节拍: v.节拍,
    已发私聊图: 按消息重建已发私聊图(消息, 当前楼),
  };
  规范已读水位(库, 当前绝对时段);
  return 库;
}

/** 当前聊天、当前楼层、当前分支中真实存活的玩家一对一私聊所形成的每日联系保护。 */
export function 当前微信联系保护表(): 微信联系保护表 {
  const 当前绝对时段 = 当前手机绝对时段();
  return 构造微信联系保护表(读库().消息, 当前绝对时段);
}

/** 读取 `_手机邀约计划` 原始记录；损坏/旧形状安全返回 null（v0.80 不做旧档迁移）。
 * 小数、NaN、Infinity、负数、非法门牌与畸形对象一律判无效——合法目标必须是整数时段。 */
export function 读手机邀约计划(): 手机邀约计划 | null {
  try {
    const 原 = _.get(getVariables({ type: 'chat' }), 手机邀约计划键) as unknown;
    if (!原 || typeof 原 !== 'object') return null;
    const p = 原 as Partial<手机邀约计划>;
    if (
      typeof p.m !== 'string' ||
      !门牌列表.includes(p.m as 门牌) ||
      !Number.isSafeInteger(p.创建楼) ||
      !Number.isSafeInteger(p.创建绝对时段) ||
      !Number.isSafeInteger(p.目标绝对时段) ||
      p.创建楼! < 0 ||
      p.创建绝对时段! < 0 ||
      p.目标绝对时段! < 0 ||
      typeof p.地点 !== 'string'
    ) {
      return null;
    }
    const 计划: 手机邀约计划 = {
      m: p.m as 门牌,
      创建楼: p.创建楼!,
      创建绝对时段: p.创建绝对时段!,
      目标绝对时段: p.目标绝对时段!,
      地点: p.地点,
      ...(p.版本 === 2 ? { 版本: 2 as const } : {}),
      ...(p.成员 !== undefined ? { 成员: Array.isArray(p.成员) ? [...p.成员] : ([] as 门牌[]) } : {}),
    };
    const 成员 = 手机邀约计划成员(计划);
    if (!成员.length || !多人邀约地点合法(计划.地点, 成员)) return null;
    return 计划;
  } catch {
    return null;
  }
}

/**
 * 手机的唯一持久写入口。调用方只提交本次新增记录与单调水位，回调内重读最新库后合并；
 * 玩家发送、已读、AI 回复和自动节拍因此不会再用陈旧快照覆盖另一条并发操作。
 */
export async function 写库增量(
  增: {
    新圈: 朋友圈条[];
    新消息: 微信消息[];
    节拍改: Record<string, number>;
    已发私聊图改?: Partial<Record<门牌, string[]>>;
    读到改?: Record<string, 手机已读时锚>;
    圈读到改?: 手机已读时锚;
    余波消费?: 手机余波消费;
    /** 与接受回复在同一个 chat 变量回调里提交的单例赴约 CAS。 */
    赴约提交?: 手机赴约提交;
    /**
     * 定时定点邀约：与接受回复在同一个 chat 变量回调里提交。仍活动的旧 `_赴约` 会拒绝；
     * 同一批、同锚、同时间地点的多人邀请则把本名接受者原子追加进共同计划。
     */
    邀约计划提交?: 手机邀约计划;
  },
  允许写入: () => boolean = () => true,
): Promise<boolean> {
  // 宿主 swipe/删楼 监听同步取得协调锁、下一任务拍才裁枝。窗口内若允许新分支消息落库，
  // 随后的“同楼旧分支全裁”会把它一并删除。唯一写入口先冻结，并在变量回调内再验一次。
  if (时间线切换协调中()) return false;
  let 已写 = false;
  await updateVariablesWith(
    vars => {
      // AI 生成结束到变量回调真正执行之间仍可能发生回档/切聊；在离提交最近的位置
      // 再验一次时间线租约，不能只依赖调用写库前的那次检查。
      if (时间线切换协调中() || !允许写入()) return vars;
      const 当前楼 = 末楼();
      const 当前绝对时段 = 当前手机绝对时段();
      let 合并后邀约计划: 手机邀约计划 | null = null;
      if (增.赴约提交) {
        const 当前赴约 = (_.get(vars, '_赴约') ?? null) as Partial<手机赴约提交> | null;
        // 接受回复与单例赴约必须同成同败。已有仍活动的赴约时整次回调不写微信，
        // 调用方会改落固定拒绝回复，绝不留下“两个都说好”但状态只认一人的分裂结果。
        if (赴约仍活动(当前赴约, 当前楼)) return vars;
      }
      if (增.邀约计划提交) {
        const 当前赴约 = (_.get(vars, '_赴约') ?? null) as Partial<手机赴约提交> | null;
        const 当前计划 = (_.get(vars, 手机邀约计划键) ?? null) as 手机邀约计划 | null;
        // 新计划与仍活动的旧 `_赴约` 必须互斥：旧赴约只在 赴约提交 分支里检查，
        // 这里必须在同一回调内自己重读兜底——业务层预检不能替代最终 CAS。
        if (赴约仍活动(当前赴约, 当前楼)) return vars;
        // 防御性最终校验：不能只信 UI/业务层——门牌/共同地点/安全整数/当前周目标之外，
        // 同一批成员必须共享精确创建锚。这样接受回复和成员追加仍然同成同败。
        const 计划 = 增.邀约计划提交;
        if (
          !手机邀约计划可提交(计划, 计划.m, 当前绝对时段, 当前楼) ||
          计划.创建楼 !== 当前楼 ||
          计划.创建绝对时段 !== 当前绝对时段
        ) {
          return vars;
        }
        合并后邀约计划 = 合并手机邀约计划(当前计划, 计划, 当前绝对时段, 当前楼);
        if (!合并后邀约计划) return vars;
      }
      const 当前余波 = (_.get(vars, '_换装余波') ?? null) as 换装余波 | null;
      if (增.余波消费) {
        if (!余波身份相同(当前余波, 增.余波消费.预期)) return vars;
        if (Object.keys(增.余波消费.标记).some(键 => !!当前余波?.[键 as keyof 换装余波])) return vars;
      }
      const v = 归一微信原始库(_.get(vars, '_微信'));
      const 原消息投影 = 筛当前手机时间线(v.消息, 当前楼, 当前绝对时段);
      const 原圈投影 = 筛当前手机时间线(v.圈, 当前楼, 当前绝对时段);
      const 新鲜: 微信库 = {
        // 旧投影保留为合并基线；本次增量只修改独立浅数组，不能把“新增”同时写进旧投影。
        消息: [...原消息投影],
        圈: [...原圈投影],
        读到: { ...v.读到 },
        读时: { ...v.读时 },
        圈读到: v.圈读到 ?? -1,
        圈读时: v.圈读时 ?? 创建手机已读时锚(-1, -1),
        节拍: v.节拍,
        已发私聊图: v.已发私聊图,
      };
      // 只能用本次增量到来前已存在的记录校准已读时锚。
      规范已读水位(新鲜, 当前绝对时段);
      // v0.80 单调顺序：只给真正插入的记录分配比当前存活记录更大的序。
      // 在离提交最近的同一个变量回调内重读存活最大序，重试去重掉的消息不重新落库也不分配新序；
      // 调用方快照不预先带序，避免并发写时各自猜一个会互相冲突的序号。
      let 最大序 = 0;
      for (const 项 of [...v.消息, ...v.圈]) {
        const 序 = 记录安全序(项);
        if (序 !== null && 序 > 最大序) 最大序 = 序;
      }
      const 新圈 = 增.新圈.map(条 => 带当前手机分支锚(条));
      // 朋友圈无去重，实际插入的每一条都在回调内重分配单调序（不信任调用方快照里的序）。
      for (const 条 of 新圈) 条.序 = ++最大序;
      新鲜.圈.unshift(...新圈);
      // 脚本事件键是分支内幂等真值。只认当前楼仍存活的键：未裁的未来消息
      // 不能阻止回档后同一事件重演。
      const 活消息键 = new Set(新鲜.消息.filter(消息 => 消息.楼 <= 当前楼 && 消息.键).map(消息 => 消息.键 as string));
      // 玩家消息用稳定标识精确去重。若它已被并发撤回，当前库里保留的是同标识墓碑，
      // 本次迟到增量会直接跳过旧原文，不能把撤回内容复活。
      const 活玩家标识 = new Set(
        新鲜.消息.filter(消息 => 消息.发 === '我' && 消息.标识).map(消息 => 消息.标识 as string),
      );
      const 新消息 = 合并微信撤回状态(
        增.新消息.map(消息 => 带当前手机分支锚(消息)),
        新鲜.消息,
      );
      for (const 消息 of 新消息) {
        if (消息.键 && 活消息键.has(消息.键)) continue;
        if (消息.标识 && 活玩家标识.has(消息.标识)) continue;
        // 去重通过才代表这条真的会插入当前库，此刻才分配单调序（不信任调用方快照里的序）。
        消息.序 = ++最大序;
        新鲜.消息.push(消息);
        if (消息.键) 活消息键.add(消息.键);
        if (消息.发 === '我' && 消息.标识) 活玩家标识.add(消息.标识);
      }
      Object.assign(新鲜.节拍, 增.节拍改);
      if (增.已发私聊图改) Object.assign(新鲜.已发私聊图, 增.已发私聊图改);
      for (const [会话, 读到锚] of Object.entries(增.读到改 ?? {})) {
        const 已有锚 = 新鲜.读时[会话] ?? 创建手机已读时锚(新鲜.读到[会话] ?? -1, -1);
        const 合并锚 = 较晚手机已读时锚(已有锚, 读到锚);
        新鲜.读到[会话] = 合并锚.楼;
        新鲜.读时[会话] = 合并锚;
      }
      if (增.圈读到改) {
        const 合并锚 = 较晚手机已读时锚(新鲜.圈读时, 增.圈读到改);
        新鲜.圈读到 = 合并锚.楼;
        新鲜.圈读时 = 合并锚;
      }
      // 当前投影只负责本分支的去重、已读和新增；回写时合回原始库。刷新期间暂时
      // 失配、其他 swipe 或未来楼的记录都由明确时间线事务裁枝，普通写入无权物理删除。
      v.消息 = 合并手机记录投影(v.消息, 原消息投影, 新鲜.消息, '后');
      v.圈 = 合并手机记录投影(v.圈, 原圈投影, 新鲜.圈, '前');
      v.读到 = 新鲜.读到;
      v.读时 = 新鲜.读时;
      v.圈读到 = 新鲜.圈读到;
      v.圈读时 = 新鲜.圈读时;
      v.节拍 = 新鲜.节拍;
      v.已发私聊图 = 新鲜.已发私聊图;
      _.set(vars, '_微信', v);
      if (增.余波消费 && 当前余波) {
        _.set(vars, '_换装余波', { ...当前余波, ...增.余波消费.标记 });
      }
      if (增.赴约提交) _.set(vars, '_赴约', { ...增.赴约提交 });
      if (合并后邀约计划) _.set(vars, 手机邀约计划键, 合并后邀约计划);
      已写 = true;
      return vars;
    },
    { type: 'chat' },
  );
  return 已写;
}

/**
 * 长期摘要已确认写入 SQLite 后的唯一原始消息压缩入口。
 * 调用方必须传入同一摘要版本的时间线校验；校验失效时整次不写。
 * 软上限之外继续保留带键硬事件、撤回/通话墓碑、未读消息和引用目标，
 * 因而不会为减小存档而重放强剧情、吞掉红点或让保留气泡的引用变成“已撤回”。
 */
export async function 压缩微信会话记录(
  会话: string,
  普通气泡上限: number,
  允许写入: () => boolean = () => true,
): Promise<boolean> {
  const 写入聊天ID = 当前聊天ID();
  let 已写 = false;
  let 有变化 = false;
  await updateVariablesWith(
    vars => {
      if (!允许写入()) return vars;
      const 当前楼 = 末楼();
      const 当前绝对时段 = 当前手机绝对时段();
      const v = 归一微信原始库(_.get(vars, '_微信'));
      const 原消息 = 筛当前手机时间线(v.消息, 当前楼, 当前绝对时段);
      const 水位库: 微信库 = {
        消息: 原消息,
        圈: 筛当前手机时间线(v.圈, 当前楼, 当前绝对时段),
        读到: { ...v.读到 },
        读时: { ...v.读时 },
        圈读到: v.圈读到 ?? -1,
        圈读时: v.圈读时 ?? 创建手机已读时锚(-1, -1),
        节拍: v.节拍,
        已发私聊图: v.已发私聊图,
      };
      规范已读水位(水位库, 当前绝对时段);
      // 图片轮换由消息事件日志重建。保留“该户图库容量+1”只最近图库气泡，既足以还原最近一次
      // 重复 ID 开始的新一轮，又不会因为正文压缩把已看缓存清空、导致旧图异常提前重发。
      const 图池容量 = 私聊图库清单.filter(项 => 项.门牌 === 会话).length;
      const 图片轮换保护 = new Set(
        原消息
          .filter(消息 => {
            const 图项 = typeof 消息.图 === 'string' ? 私聊图库地址索引.get(消息.图) : undefined;
            return 消息.会话 === 会话 && 图项?.门牌 === 会话;
          })
          .slice(-(图池容量 + 1)),
      );
      // 冷落保护只需要每户最后一条玩家私聊。显式保留它，避免长期摘要压缩后
      // 当天已经完成的联系从权威消息日志消失、随后被错误追算成冷落。
      const 最新玩家联系 = [...原消息].reverse().find(消息 => 消息.会话 === 会话 && 消息.发 === '我');
      const 新消息 = 压缩微信会话消息(
        原消息,
        会话,
        普通气泡上限,
        消息 =>
          会话消息未读(水位库, 消息, 当前楼, 当前绝对时段) ||
          图片轮换保护.has(消息) ||
          消息 === 最新玩家联系,
      );
      有变化 = 新消息.length !== 原消息.length;
      if (有变化) {
        v.消息 = 合并手机记录投影(v.消息, 原消息, 新消息, '后');
        v.读到 = 水位库.读到;
        v.读时 = 水位库.读时;
        v.已发私聊图 = 按消息重建已发私聊图(新消息, 当前楼);
        _.set(vars, '_微信', v);
      }
      已写 = true;
      return vars;
    },
    { type: 'chat' },
  );
  if (已写 && 有变化) {
    await 立即持久保存手机聊天变量(写入聊天ID);
    请求刷新手机红点();
  }
  return 已写;
}

/**
 * 会话/朋友圈前台的实时已读提交（统一入口）：点击瞬间一次性冻结
 * 当前聊天ID、末楼、锚消息引用/签名、当前绝对时段与手机租约世代，并在
 * 写库增量 的允许写入（离提交最近的回调内复核）里原样复用同一租约。
 *
 * 锚点取当前时间线内目标会话最后一条对方消息或朋友圈最后一条实际记录（含其
 * 单调序），而不是“当前楼/当前时段”——同楼同时段的后到内容因此保持未读；
 * 没有目标记录时不预读未来消息（不写水位）。
 *
 * 前台仍有效 由渲染层传入（root 仍 open 且当前页仍是本会话/朋友圈），并与
 * 时间线租约一起在变量回调内复核；切聊、删楼、swipe、回档、世界时段变化、
 * 世代变化或页面已离开都会让本次已读提交静默失效，绝不把旧时间线的已读水位
 * 写进新时间线，也不把“离开后看到一半”误标已读。
 */
export async function 写实时手机已读(
  目标: { 会话: string } | { 朋友圈: true },
  前台仍有效: () => boolean = () => true,
): Promise<boolean> {
  const 聊天ID = 当前聊天ID();
  const 楼 = 末楼();
  const 绝对时段 = 当前手机绝对时段();
  const 租约 = 创建手机时间线租约(聊天ID, 楼, SillyTavern.chat ?? [], 绝对时段);
  if (!租约) return false;
  const 库 = 读库();
  const 锚记录 =
    '会话' in 目标
      ? 最后手机时间记录(库.消息.filter(消息 => 消息.会话 === 目标.会话 && 消息.发 === '对方'))
      : 最后手机时间记录(库.圈);
  if (!锚记录) return false;
  const 仍有效 = () =>
    手机时间线租约仍有效(租约, 当前聊天ID(), SillyTavern.chat ?? [], 当前手机绝对时段()) && 前台仍有效();
  const 锚 = 创建手机已读时锚(锚记录.楼, 锚记录.时, 锚记录.序);
  const 已写 = await 写库增量(
    {
      新圈: [],
      新消息: [],
      节拍改: {},
      ...('会话' in 目标 ? { 读到改: { [目标.会话]: 锚 } } : { 圈读到改: 锚 }),
    },
    仍有效,
  );
  if (已写) await 立即持久保存手机聊天变量(聊天ID);
  return 已写;
}

function 赴约仍活动(赴约: Partial<手机赴约提交> | null, 当前楼: number): boolean {
  return (
    !!赴约?.m &&
    门牌列表.includes(赴约.m as 门牌) &&
    Number.isFinite(赴约.起楼) &&
    Number.isFinite(赴约.至楼) &&
    Math.round(赴约.起楼!) <= 当前楼 &&
    Math.round(赴约.至楼!) >= 当前楼
  );
}

// ============================================
// 节拍键(内容引擎水位线统一构造/解析，杜绝键漂移)
// ============================================

export const 朋友圈节拍键前缀 = '圈:';
export const 私聊节拍键前缀 = '私:';
export const 圈图节拍键前缀 = '圈图:';
export const 邀约节拍键前缀 = '约:';
/** 固定楼务群水位键(与会话 id '群' 同串；语义上它是节拍键)。 */
export const 楼务群节拍键 = '群';
/** 固定姐妹群水位键(与会话 id '姐妹群' 同串；语义上它是节拍键)。 */
export const 姐妹群节拍键 = '姐妹群';
/** 每一次公开孕情各用独立消息键；正文初见与手机节拍共用，避免两边各自猜测“群里是否已经聊过”。 */
export const 孕情姐妹群节拍键前缀 = '姐妹孕情:';
export const 荣耀洞动态节拍键前缀 = '荣耀洞动态:';

export function 孕情姐妹群节拍键(门牌号: 门牌, 场次标识: string): string {
  return `${孕情姐妹群节拍键前缀}${门牌号}:${场次标识}`;
}

export function 孕情姐妹群已触发(
  消息们: readonly Pick<微信消息, '会话' | '键'>[],
  门牌号: 门牌,
  场次标识: string,
): boolean {
  if (!场次标识) return false;
  const 事件键 = 孕情姐妹群节拍键(门牌号, 场次标识);
  return 消息们.some(消息 => 消息.会话 === '姐妹群' && 消息.键?.startsWith(`${事件键}:`));
}

export function 朋友圈节拍键(门牌号: 门牌): string {
  return `圈:${门牌号}`;
}

export function 私聊节拍键(门牌号: 门牌): string {
  return `私:${门牌号}`;
}

export function 圈图节拍键(门牌号: 门牌, 主题: string): string {
  return `圈图:${门牌号}:${主题}`;
}

export function 邀约节拍键(会话: string): string {
  return `约:${会话}`;
}

export function 荣耀洞动态节拍键(门牌号: 门牌, 绝对时段: number): string {
  return `荣耀洞动态:${门牌号}:${绝对时段}`;
}

/** 解析荣耀洞动态节拍键；异常旧键(缺时段/含非数字)返回 null，由裁剪侧保守保留。 */
export function 解析荣耀洞动态节拍键(键: string): { 门牌: string; 绝对时段: number } | null {
  const 匹配 = 键.match(/^荣耀洞动态:([^:]+):(\d+)$/);
  if (!匹配) return null;
  return { 门牌: 匹配[1], 绝对时段: Number(匹配[2]) };
}
