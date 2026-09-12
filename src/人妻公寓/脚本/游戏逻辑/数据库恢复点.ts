/** 聊天内的数据库历史。首点保存完整导出，后续只保存 JSON 差量；不读写插件内部状态。 */
export const 数据库恢复点键 = '_rqgy数据库恢复点';
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type 路径 = (string | number)[];
type 差量 =
  { 类型: '写'; 路径: 路径; 值: Json } | { 类型: '删'; 路径: 路径 } | { 类型: '截'; 路径: 路径; 长度: number };
interface 恢复点 {
  楼层: number;
  分支: string;
  来源: string;
  内容指纹: string;
  前值指纹: string;
  结果指纹: string;
  差量: 差量[];
  完整性: string;
}
export interface 数据库恢复记录 {
  版本: 1;
  聊天: string;
  点: 恢复点[];
}
export interface 数据库恢复锚 {
  聊天: string;
  楼层: number;
  分支: string;
  来源?: string;
}

function 对象(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function 克隆<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
function 规范串(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(规范串).join(',')}]`;
  if (对象(value))
    return `{${Object.keys(value)
      .sort()
      .map(k => `${JSON.stringify(k)}:${规范串(value[k])}`)
      .join(',')}}`;
  const result = JSON.stringify(value);
  if (result === undefined) throw new Error('恢复点包含非JSON值');
  return result;
}
export function 数据库恢复指纹(value: unknown): string {
  const text = 规范串(value);
  let a = 0x811c9dc5,
    b = 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 0x01000193);
    b = Math.imul(b ^ (text.charCodeAt(i) + i), 0x85ebca6b);
  }
  return `db1:${text.length}:${(a >>> 0).toString(36)}:${(b >>> 0).toString(36)}`;
}

export function 是数据库完整导出(value: unknown): value is Record<string, Json> {
  if (!对象(value) || !对象(value.mate)) return false;
  const names = ['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹', '纪要表'];
  const tables = Object.entries(value)
    .filter(([k]) => k.startsWith('sheet_'))
    .map(([, v]) => v);
  return (
    names.every(name => tables.filter(v => 对象(v) && v.name === name).length === 1) &&
    tables.every(
      v =>
        对象(v) &&
        typeof v.name === 'string' &&
        Array.isArray(v.content) &&
        v.content.length > 0 &&
        v.content.every(row => Array.isArray(row)),
    )
  );
}

/** 导入器可以规范元数据和表 key；数据内容仍须按表名、列与单元格精确一致。 */
export function 数据库表内容指纹(value: unknown): string {
  if (!是数据库完整导出(value)) return '';
  const tables = Object.entries(value)
    .filter(([key]) => key.startsWith('sheet_'))
    .map(([, table]) => {
      const row = table as { name: string; content: Json[] };
      return { name: row.name, content: row.content };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return 数据库恢复指纹(tables);
}

export function 清空游戏数据库导出(value: unknown): Record<string, Json> | null {
  if (!是数据库完整导出(value)) return null;
  const data = 克隆(value);
  const names = new Set(['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹', '纪要表']);
  for (const [key, table] of Object.entries(data)) {
    if (!key.startsWith('sheet_') || !对象(table) || !names.has(String(table.name))) continue;
    table.content = [(table.content as Json[])[0]];
    if (Array.isArray(table.seedRows)) table.seedRows = [];
  }
  return data;
}

function 制作差量(before: Json, after: Json, path: 路径 = [], out: 差量[] = []): 差量[] {
  if (before === after) return out;
  if (Array.isArray(before) && Array.isArray(after)) {
    for (let i = 0; i < after.length; i++) {
      if (i >= before.length) out.push({ 类型: '写', 路径: [...path, i], 值: after[i] });
      else 制作差量(before[i], after[i], [...path, i], out);
    }
    if (after.length < before.length) out.push({ 类型: '截', 路径: path, 长度: after.length });
  } else if (对象(before) && 对象(after)) {
    for (const k of Object.keys(before)) if (!Object.hasOwn(after, k)) out.push({ 类型: '删', 路径: [...path, k] });
    for (const k of Object.keys(after)) {
      if (!Object.hasOwn(before, k)) out.push({ 类型: '写', 路径: [...path, k], 值: after[k] as Json });
      else 制作差量(before[k] as Json, after[k] as Json, [...path, k], out);
    }
  } else out.push({ 类型: '写', 路径: path, 值: after });
  return out;
}

function 应用差量(before: Json, changes: 差量[]): Json {
  let data = before;
  for (const change of changes) {
    if (!change || !Array.isArray(change.路径)) throw new Error('数据库恢复差量损坏');
    let target: unknown = data;
    const parentPath = change.类型 === '截' ? change.路径 : change.路径.slice(0, -1);
    for (const k of parentPath) {
      if ((!对象(target) && !Array.isArray(target)) || !Object.hasOwn(target, k)) throw new Error('恢复路径不存在');
      target = (target as Record<string | number, unknown>)[k];
    }
    if (change.类型 === '截') {
      if (!Array.isArray(target) || !Number.isInteger(change.长度) || change.长度 < 0 || change.长度 > target.length)
        throw new Error('恢复数组长度损坏');
      target.length = change.长度;
      continue;
    }
    if (!change.路径.length) {
      if (change.类型 !== '写') throw new Error('不能删除恢复根');
      data = 克隆(change.值);
      continue;
    }
    const key = change.路径.at(-1)!;
    if (
      (!对象(target) && !Array.isArray(target)) ||
      (Array.isArray(target) && (typeof key !== 'number' || !Number.isInteger(key) || key < 0 || key > target.length))
    ) {
      throw new Error('恢复目标损坏');
    }
    if (change.类型 === '删') {
      if (Array.isArray(target)) throw new Error('不能在数组中制造空洞');
      delete (target as Record<string, unknown>)[key];
    } else if (change.类型 === '写') {
      Object.defineProperty(target, key, {
        value: 克隆(change.值),
        configurable: true,
        writable: true,
        enumerable: true,
      });
    } else throw new Error('未知恢复操作');
  }
  return data;
}

function 点载荷(point: Omit<恢复点, '完整性'>, chat: string): unknown {
  return { 聊天: chat, ...point };
}
function 解读(value: unknown, chat: string): 数据库恢复记录 {
  if (value == null) return { 版本: 1, 聊天: chat, 点: [] };
  if (!对象(value) || value.版本 !== 1 || value.聊天 !== chat || !Array.isArray(value.点))
    throw new Error('数据库恢复记录身份或版本不符');
  const record = 克隆(value) as unknown as 数据库恢复记录;
  let hash = '',
    floor = -1;
  for (const point of record.点) {
    if (!Number.isInteger(point.楼层) || point.楼层 < floor || !point.分支 || !Array.isArray(point.差量))
      throw new Error('数据库恢复点顺序损坏');
    const { 完整性, ...payload } = point;
    if (数据库恢复指纹(点载荷(payload, chat)) !== 完整性 || point.前值指纹 !== hash)
      throw new Error('数据库恢复点校验失败');
    hash = point.结果指纹;
    floor = point.楼层;
  }
  return record;
}
function 重建(record: 数据库恢复记录, end = record.点.length - 1): Json {
  let data: Json = null;
  for (let i = 0; i <= end; i++) data = 应用差量(data, record.点[i].差量);
  if (end >= 0 && (数据库恢复指纹(data) !== record.点[end].结果指纹 || !是数据库完整导出(data)))
    throw new Error('数据库恢复结果校验失败');
  return data;
}

export function 保存数据库恢复点记录(value: unknown, anchor: 数据库恢复锚, exported: unknown): 数据库恢复记录 {
  if (!anchor.聊天 || !Number.isInteger(anchor.楼层) || anchor.楼层 < 0 || !anchor.分支 || !是数据库完整导出(exported))
    throw new Error('数据库恢复点缺少有效来源');
  const 记录 = 解读(value, anchor.聊天);
  const last = 记录.点.at(-1);
  if (last && (last.楼层 > anchor.楼层 || (last.楼层 === anchor.楼层 && last.分支 !== anchor.分支))) {
    throw new Error('数据库恢复点仍含另一时间线，须先完成回档');
  }
  const before = 重建(记录);
  const data = 克隆(exported) as Json;
  const payload = {
    楼层: anchor.楼层,
    分支: anchor.分支,
    来源: anchor.来源 ?? '',
    内容指纹: 数据库表内容指纹(data),
    前值指纹: 记录.点.at(-1)?.结果指纹 ?? '',
    结果指纹: 数据库恢复指纹(data),
    差量: 制作差量(before, data),
  };
  记录.点.push({ ...payload, 完整性: 数据库恢复指纹(点载荷(payload, anchor.聊天)) });
  return 记录;
}

export function 选择数据库恢复点(
  value: unknown,
  chat: string,
  limit: number,
  branch: (floor: number) => string,
  reference?: string,
): { 数据: Record<string, Json>; 楼层: number; 保留记录: 数据库恢复记录 } | null {
  const 记录 = 解读(value, chat);
  for (let i = 记录.点.length - 1; i >= 0; i--) {
    const point = 记录.点[i];
    if (point.楼层 > limit || point.分支 !== branch(point.楼层) || (reference && point.完整性 !== reference)) continue;
    return {
      数据: 重建(记录, i) as Record<string, Json>,
      楼层: point.楼层,
      保留记录: { ...记录, 点: 记录.点.slice(0, i + 1) },
    };
  }
  return null;
}
