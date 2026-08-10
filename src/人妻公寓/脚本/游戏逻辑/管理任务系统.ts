import type { SchemaType } from '../../schema';
import { 户静态表, type 门牌 } from '../../stageConfig';
import { 结算风闻投诉完成, 尝试转入风闻投诉, 风闻事件已即时计责 } from './风闻系统';
import { 登记胜任变动 } from './胜任系统';

export type 管理任务类型 = '公共' | '报修' | '投诉';
export type 管理任务级别 = '日常' | '重要' | '紧急';

export interface 管理任务 {
  id: string;
  模板: string;
  类型: 管理任务类型;
  级别: 管理任务级别;
  地点: string;
  门牌: string;
  创建时段: number;
  截止时段: number;
  逾期已扣: boolean;
  来源事件: string;
  公开摘要: string;
}

export interface 管理任务选项定义 {
  id: string;
  名称: string;
  /** UI 按统一动作按钮契约读取此字段；与名称保持同值。 */
  文案: string;
  消耗: '体力' | '精力' | '现金';
  数量: number;
  需要工具箱: boolean;
  行动: string;
  演出: string;
}

export interface 管理任务操作结果 {
  成功: boolean;
  提示: string;
  变动?: boolean;
  行动?: string;
  事件?: string;
  胜任变化?: number;
}

export interface 粉刷公共维护结果 {
  命中: boolean;
  任务id: string;
  胜任变化: number;
  逾期: boolean;
  提示: string;
}

/** 可直接并入经济系统提示队列，同时保留定向测试与调用方需要的结算明细。 */
export type 管理任务逾期结果 = string[] & { 扣分: number; 任务: string[]; 事件: string };

interface 任务模板 {
  id: string;
  类型: 管理任务类型;
  级别: 管理任务级别;
  地点?: string;
  期限: number;
  雇佣价?: number;
  投诉选项?: readonly [string, string];
}

const 公共模板: readonly 任务模板[] = [
  { id: '大堂地面清洁', 类型: '公共', 级别: '日常', 地点: '大堂', 期限: 6, 雇佣价: 100 },
  { id: '楼梯扶手松动', 类型: '公共', 级别: '重要', 地点: '楼梯间', 期限: 4, 雇佣价: 180 },
  { id: '垃圾房异味', 类型: '公共', 级别: '日常', 地点: '垃圾房', 期限: 6, 雇佣价: 120 },
  { id: '天台排水堵塞', 类型: '公共', 级别: '紧急', 地点: '天台', 期限: 2, 雇佣价: 250 },
  { id: '信箱门脱落', 类型: '公共', 级别: '日常', 地点: '信箱区', 期限: 6, 雇佣价: 100 },
] as const;

const 报修模板: readonly 任务模板[] = [
  { id: '水龙头漏水', 类型: '报修', 级别: '日常', 期限: 6, 雇佣价: 160 },
  { id: '插座跳闸', 类型: '报修', 级别: '重要', 期限: 4, 雇佣价: 220 },
  { id: '下水堵塞', 类型: '报修', 级别: '重要', 期限: 4, 雇佣价: 200 },
  { id: '暖气阀漏水', 类型: '报修', 级别: '紧急', 期限: 2, 雇佣价: 250 },
] as const;

const 投诉模板: readonly 任务模板[] = [
  { id: '噪音投诉', 类型: '投诉', 级别: '日常', 期限: 6, 投诉选项: ['温和劝说', '正式警告'] },
  { id: '公共堆物投诉', 类型: '投诉', 级别: '日常', 期限: 6, 投诉选项: ['出面协调', '要求限期清理'] },
  { id: '快递争议', 类型: '投诉', 级别: '日常', 期限: 6, 投诉选项: ['出面调解', '按登记记录处理'] },
  { id: '晾晒纠纷', 类型: '投诉', 级别: '日常', 期限: 6, 投诉选项: ['出面调解', '按公区规则处理'] },
  { id: '设施服务投诉', 类型: '投诉', 级别: '重要', 期限: 4, 投诉选项: ['亲自处理', '安排付费处理'] },
] as const;

/** 只允许由风闻系统跨线创建，不能混入普通周期任务池。 */
const 风闻投诉模板: readonly 任务模板[] = [
  { id: '管理员作风投诉', 类型: '投诉', 级别: '重要', 期限: 4, 投诉选项: ['出面解释', '发布楼务说明'] },
  { id: '风闻危机投诉', 类型: '投诉', 级别: '紧急', 期限: 2, 投诉选项: ['逐户处理投诉', '提交整改说明'] },
] as const;

const 全模板 = [...公共模板, ...报修模板, ...投诉模板, ...风闻投诉模板] as const;

/** 普通报修的全楼冷却键，写入 考核.类型冷却；第 N 期生成任一普通报修后，N+1/N+2 两个完整考核期全楼不再生成任何报修，N+3 才恢复。 */
const 全楼报修冷却键 = '类型:报修';

function 模板定义(id: string): 任务模板 | undefined {
  return 全模板.find(模板 => 模板.id === id);
}

function 整数(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

function 夹取(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function 稳定散列(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function 已入住收费门牌(data: SchemaType): 门牌[] {
  return Object.keys(data.户)
    .filter((门牌号): 门牌号 is 门牌 => 门牌号 in 户静态表 && 户静态表[门牌号 as 门牌].月租 > 0)
    .sort() as 门牌[];
}

/** 普通周期任务每期配额：0 户为 0；轻松/标准最多 1 件；严苛按入住规模 1～2 件，不再让公寓每天多处损坏。 */
function 本期任务数(收费户数: number, 难度: string): number {
  if (收费户数 <= 0) return 0;
  if (难度 === '严苛') return 收费户数 >= 3 ? 2 : 1;
  return 1;
}

function 候选任务(data: SchemaType, 期号: number): { 模板: 任务模板; 地点: string; 门牌: string }[] {
  const 收费门牌 = 已入住收费门牌(data);
  const 候选 = 公共模板.map(模板 => ({ 模板, 地点: 模板.地点!, 门牌: '' }));
  for (const 门牌号 of 收费门牌) {
    for (const 模板 of 报修模板) 候选.push({ 模板, 地点: 门牌号, 门牌: 门牌号 });
    for (const 模板 of 投诉模板) 候选.push({ 模板, 地点: '管理员室', 门牌: 门牌号 });
  }
  return 候选.sort((左, 右) => {
    const 左值 = 稳定散列(`${期号}|${左.模板.id}|${左.地点}|${左.门牌}`);
    const 右值 = 稳定散列(`${期号}|${右.模板.id}|${右.地点}|${右.门牌}`);
    return 左值 - 右值 || 左.模板.id.localeCompare(右.模板.id) || 左.门牌.localeCompare(右.门牌);
  });
}

/**
 * 为一个新考核期补足单瓷砖任务。同一期重复调用只返回原任务，不会因刷新或重掷换题。
 */
export function 生成本期管理任务(data: SchemaType, 原期号: number, 原当前时段: number): 管理任务[] {
  const 考核 = data.系统._管理考核;
  const 期号 = Math.max(0, 整数(原期号));
  const 当前时段 = Math.max(0, 整数(原当前时段));
  // 风闻投诉先占用可用槽位；三槽已满时仍留在风闻账排队，不挤掉旧任务。
  尝试转入风闻投诉(data);
  const 上次生成期 = 整数(考核.上次生成期, -1);
  if (上次生成期 >= 期号) return [];

  // -1 只表示本存档尚未建立任务水位；同一期的上交、来电等正向账可能已经发生，不能清空。
  // 只有从一个已知旧期真正进入新期，才初始化新一期正向额度。
  if (上次生成期 >= 0) 考核.本期正向 = 0;
  考核.上次生成期 = 期号;
  // 逾期任务仍是可补办的活跃瓷砖，也继续占用槽位；三个槽都被占满时不再生成新任务。
  const 空位 = Math.max(0, 3 - 考核.活跃任务.length);
  const 收费户数 = 已入住收费门牌(data).length;
  const 目标数 = Math.min(空位, 本期任务数(收费户数, data.系统._难度));
  if (目标数 <= 0) return [];

  const 已占地点 = new Set(考核.活跃任务.map(任务 => 任务.地点));
  // 普通周期报修全楼统一活跃上限：已有一件活跃报修时，本期不再新增另一件报修。
  const 报修上限 = 1;
  let 报修数 = 考核.活跃任务.filter(任务 => 任务.类型 === '报修').length;
  const 新任务: 管理任务[] = [];
  for (const 候选 of 候选任务(data, 期号)) {
    if (新任务.length >= 目标数) break;
    if (候选.模板.类型 === '报修' && 报修数 >= 报修上限) continue;
    const 冷却键 = `模板:${候选.模板.id}`;
    const 旧冷却键 = `${候选.模板.类型}:${候选.地点}`;
    let 上次期 = Math.max(整数(考核.类型冷却[冷却键], -999), 整数(考核.类型冷却[旧冷却键], -999));
    // 普通报修除按模板冷却外，还受全楼报修冷却约束：任一报修生成后两个完整考核期全楼不得再生成报修。
    if (候选.模板.类型 === '报修') 上次期 = Math.max(上次期, 整数(考核.类型冷却[全楼报修冷却键], -999));
    // 生成期后的两个完整考核期都不得复用同模板：N 生成，N+1/N+2 冷却，N+3 才可再现。
    if (已占地点.has(候选.地点) || 期号 - 上次期 < 3) continue;
    const id = `管理-${期号}-${候选.模板.id}-${候选.门牌 || 候选.地点}`;
    if (考核.完成票据.includes(id) || 考核.活跃任务.some(任务 => 任务.id === id)) continue;
    const 任务: 管理任务 = {
      id,
      模板: 候选.模板.id,
      类型: 候选.模板.类型,
      级别: 候选.模板.级别,
      地点: 候选.地点,
      门牌: 候选.门牌,
      创建时段: 当前时段,
      截止时段: 当前时段 + 候选.模板.期限,
      逾期已扣: false,
      来源事件: '',
      公开摘要: '',
    };
    考核.活跃任务.push(任务);
    考核.类型冷却[冷却键] = 期号;
    if (任务.类型 === '报修') {
      // 全楼报修冷却：本期任一普通报修生成后，N+1/N+2 两个完整考核期不再生成任何报修，N+3 才恢复。
      考核.类型冷却[全楼报修冷却键] = 期号;
      报修数 += 1;
    }
    已占地点.add(任务.地点);
    新任务.push(任务);
  }
  return 新任务;
}

function 逾期扣分(task: 管理任务): number {
  if (task.级别 === '紧急') return 6;
  if (task.级别 === '重要') return 4;
  if (task.类型 === '投诉') return 1;
  return 2;
}

/** 到期水位只登记一次；任务保留为补办瓷砖。 */
export function 结算管理任务逾期(data: SchemaType, 原当前时段: number, 归属考核期?: number): 管理任务逾期结果 {
  const 当前时段 = Math.max(0, 整数(原当前时段));
  let 扣分 = 0;
  const 逾期任务: string[] = [];
  for (const 原任务 of data.系统._管理考核.活跃任务) {
    const task = 原任务 as 管理任务;
    if (task.逾期已扣 || 当前时段 <= task.截止时段) continue;
    task.逾期已扣 = true;
    // 危机事件触发瞬间已当场扣过公开丑闻责任,这张衍生投诉逾期不再叠扣,
    // 任务照常转补办瓷砖(2026-08-04 拍板:危机不双重扣罚)
    if (task.来源事件 && 风闻事件已即时计责(data, task.来源事件)) {
      逾期任务.push(task.id);
      continue;
    }
    const 本项扣分 = 逾期扣分(task);
    const 实际扣分 = -登记胜任变动(data, {
      id: `楼务逾期:${task.id}`,
      变动: -本项扣分,
      类别: '楼务失职',
      原因: `${task.地点}${task.模板}逾期`,
      时段: 当前时段,
      考核期: 归属考核期,
    });
    扣分 += 实际扣分;
    逾期任务.push(task.id);
  }
  const 事件 = 逾期任务.length ? `【楼务逾期】${逾期任务.length}项任务转为补办，胜任度已扣${扣分}。` : '';
  const 结果 = (事件 ? [事件] : []) as 管理任务逾期结果;
  结果.扣分 = 扣分;
  结果.任务 = 逾期任务;
  结果.事件 = 事件;
  return 结果;
}

/** 地图只需按当前位置查询，不产生任何状态变化。 */
export function 列出地点管理任务(data: SchemaType, 地点: string): 管理任务[] {
  return data.系统._管理考核.活跃任务.filter(任务 => 任务.地点 === 地点).map(任务 => ({ ...任务 })) as 管理任务[];
}

function 选项(
  task: 管理任务,
  id: string,
  名称: string,
  消耗: '体力' | '精力' | '现金',
  数量: number,
  需要工具箱: boolean,
): 管理任务选项定义 {
  const 报事人 =
    task.门牌 && 户静态表[task.门牌 as 门牌] ? `${task.门牌}住户${户静态表[task.门牌 as 门牌].妻名}` : '未署名住户';
  const 投诉事实 = task.公开摘要 || task.模板;
  const 硬事实 = task.类型 === '投诉' ? `${报事人}报送的“${投诉事实}”` : `“${task.模板}”`;
  return {
    id,
    名称,
    文案: 名称,
    消耗,
    数量,
    需要工具箱,
    行动: `（在${task.地点}${名称}，处理${硬事实}）`,
    演出:
      task.类型 === '投诉'
        ? `完整演出玩家${名称}处理${硬事实}的过程；楼务硬事实仅限报事门牌、报事人与事项模板，不得补写未登记的隐私指控。结果已经由脚本确定为完成，不另造后续步骤。`
        : `完整演出玩家${名称}处理${硬事实}的过程与现场反应；结果已经由脚本确定为完成，不另造后续步骤。`,
  };
}

/** 每项任务始终只有两个确定性方案。 */
export function 管理任务选项(task: 管理任务): [管理任务选项定义, 管理任务选项定义] {
  const 模板 = 模板定义(task.模板);
  if (task.类型 === '投诉') {
    const [方案一, 方案二] = 模板?.投诉选项 ?? ['出面协调', '按管理规则处理'];
    return [选项(task, '方案一', 方案一, '精力', 1, false), 选项(task, '方案二', 方案二, '精力', 1, false)];
  }
  const 雇佣价 = 夹取(整数(模板?.雇佣价, task.类型 === '报修' ? 200 : 120), 100, 250);
  if (task.类型 === '报修') {
    return [
      选项(task, '自己维修', '自己维修', '体力', 1, true),
      选项(task, '请人维修', '请维修人员', '现金', 雇佣价, false),
    ];
  }
  return [
    选项(task, '亲自处理', '亲自处理', '体力', 1, false),
    选项(task, '雇人处理', '雇人处理', '现金', 雇佣价, false),
  ];
}

/** 安全摘要不展开投诉指控，也不泄露私人微信内容。 */
export function 管理任务摘要(task: 管理任务): string {
  if (task.类型 === '投诉') {
    const 妻名 = task.门牌 && 户静态表[task.门牌 as 门牌] ? 户静态表[task.门牌 as 门牌].妻名 : '未署名住户';
    return `${task.地点}收到${task.门牌 || '未知门牌'}住户${妻名}报送的${task.公开摘要 || task.模板}（${task.级别}）`;
  }
  if (task.类型 === '报修') return `${task.门牌 || task.地点}住户报修：${task.模板}（${task.级别}）`;
  return `${task.地点}公共楼务：${task.模板}（${task.级别}）`;
}

export function 预检管理任务(data: SchemaType, 任务id: string, 选项id: string, 地点: string): 管理任务操作结果 {
  const 考核 = data.系统._管理考核;
  if (考核.完成票据.includes(任务id)) return { 成功: true, 变动: false, 提示: '这项任务已经完成，不会重复结算。' };
  const task = 考核.活跃任务.find(任务 => 任务.id === 任务id) as 管理任务 | undefined;
  if (!task) return { 成功: false, 提示: '任务不存在或已经失效。' };
  if (task.地点 !== 地点) return { 成功: false, 提示: `请先到${task.地点}处理这项任务。` };
  if (整数(data.系统._绝对时段) < task.创建时段) return { 成功: false, 提示: '任务尚未开始。' };
  const choice = 管理任务选项(task).find(item => item.id === 选项id);
  if (!choice) return { 成功: false, 提示: '处理方案无效。' };
  if (choice.需要工具箱 && !data.背包.includes('工具箱')) return { 成功: false, 提示: '自己维修需要先准备工具箱。' };
  if (choice.消耗 === '体力' && data.玩家资源.体力.当前值 < choice.数量)
    return { 成功: false, 提示: '体力不足，无法亲自完成。' };
  if (choice.消耗 === '精力' && data.玩家资源.精力.当前值 < choice.数量)
    return { 成功: false, 提示: '精力不足，无法处理投诉。' };
  if (choice.消耗 === '现金' && data.现金 < choice.数量) return { 成功: false, 提示: `现金不足，需要${choice.数量}。` };
  return { 成功: true, 变动: false, 提示: '可以处理。', 行动: choice.行动, 事件: choice.演出 };
}

function 任务奖励(task: 管理任务): number {
  if (task.级别 === '紧急') return 3;
  if (task.级别 === '重要') return 2;
  return 1;
}

function 提交任务完成账(
  data: SchemaType,
  task: 管理任务,
  方式: string,
): { 胜任变化: number; 风闻降低: number } {
  const 考核 = data.系统._管理考核;
  const 奖励 = task.逾期已扣 ? 0 : 任务奖励(task);
  const 实际加分 =
    奖励 > 0
      ? 登记胜任变动(data, {
          id: `楼务完成:${task.id}`,
          变动: 奖励,
          类别: '正向经营',
          原因: `按期完成${task.地点}${task.模板}`,
        })
      : 0;
  考核.本期完成摘要.push({
    任务: task.模板,
    类型: task.类型,
    级别: task.级别,
    地点: task.地点,
    门牌: task.门牌,
    按期: !task.逾期已扣,
    方式,
  });
  考核.完成票据.push(task.id);
  考核.活跃任务 = 考核.活跃任务.filter(任务 => 任务.id !== task.id);
  const 风闻降低 = task.来源事件 ? 结算风闻投诉完成(data, task.来源事件) : 0;
  // 任务腾出槽位时，立即把最早排队的风闻投诉转入；旧任务从不被自动关闭。
  尝试转入风闻投诉(data);
  return { 胜任变化: 实际加分, 风闻降低 };
}

/**
 * 粉刷翻新优先结清一项公共维护，不消耗任务方案里的体力或现金。
 * 逾期、级别、截止时段和稳定 ID 构成确定顺序，避免同一存档刷新后命中不同任务。
 */
export function 结算粉刷公共维护任务(data: SchemaType): 粉刷公共维护结果 {
  const 当前时段 = Math.max(0, 整数(data.系统._绝对时段));
  const 级别序 = { 紧急: 3, 重要: 2, 日常: 1 } as const;
  const task = data.系统._管理考核.活跃任务
    .filter(任务 => 任务.类型 === '公共')
    .sort((a, b) => {
      const a逾期 = a.逾期已扣 || 当前时段 > a.截止时段 ? 1 : 0;
      const b逾期 = b.逾期已扣 || 当前时段 > b.截止时段 ? 1 : 0;
      return b逾期 - a逾期 || 级别序[b.级别] - 级别序[a.级别] || a.截止时段 - b.截止时段 || a.id.localeCompare(b.id);
    })[0] as 管理任务 | undefined;
  if (!task) {
    return {
      命中: false,
      任务id: '',
      胜任变化: 0,
      逾期: false,
      提示: '当前没有可由粉刷翻新完成的公共维护任务。',
    };
  }
  if (当前时段 > task.截止时段 && !task.逾期已扣) 结算管理任务逾期(data, 当前时段);
  const 逾期 = task.逾期已扣;
  const 完成 = 提交任务完成账(data, task, '粉刷翻新');
  return {
    命中: true,
    任务id: task.id,
    胜任变化: 完成.胜任变化,
    逾期,
    提示: `粉刷翻新已完成公共维护“${task.模板}”；${
      逾期 ? '该任务属于逾期补办，不增加胜任度。' : `胜任度 +${完成.胜任变化}。`
    }${完成.风闻降低 > 0 ? ` 风闻 -${完成.风闻降低}。` : ''}`,
  };
}

/** 原子结算资源、票据与胜任；重复提交只返回既有结果，不重复扣资源。 */
export function 结算管理任务(data: SchemaType, 任务id: string, 选项id: string, 地点: string): 管理任务操作结果 {
  const 预检 = 预检管理任务(data, 任务id, 选项id, 地点);
  if (!预检.成功 || (预检.变动 === false && data.系统._管理考核.完成票据.includes(任务id))) return 预检;
  const 考核 = data.系统._管理考核;
  const task = 考核.活跃任务.find(任务 => 任务.id === 任务id) as 管理任务;
  const choice = 管理任务选项(task).find(item => item.id === 选项id)!;

  if (整数(data.系统._绝对时段) > task.截止时段 && !task.逾期已扣) {
    结算管理任务逾期(data, data.系统._绝对时段);
  }
  if (choice.消耗 === '体力') data.玩家资源.体力.当前值 -= choice.数量;
  else if (choice.消耗 === '精力') data.玩家资源.精力.当前值 -= choice.数量;
  else data.现金 -= choice.数量;

  const 完成 = 提交任务完成账(data, task, choice.名称);
  const 实际加分 = 完成.胜任变化;
  const 加分提示 = task.逾期已扣
    ? '这是逾期补办，不再增加胜任度。'
    : 实际加分 > 0
      ? `胜任度 +${实际加分}。`
      : data.胜任度 >= 100
        ? '胜任度已达到上限，本项不再加分。'
        : '本期正向胜任增长已达到上限，本项不再加分。';
  return {
    成功: true,
    变动: true,
    胜任变化: 实际加分,
    提示: `“${task.模板}”已完成；${加分提示}${完成.风闻降低 > 0 ? ` 风闻 -${完成.风闻降低}。` : ''}`,
    行动: choice.行动,
    事件: `【楼务任务完成】地点=${task.地点}；事项=${task.模板}；方式=${choice.名称}；${choice.演出}`,
  };
}
