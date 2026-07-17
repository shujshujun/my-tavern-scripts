import type { SchemaType, 户节点Type } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 好感封顶表, 阶段标题 } from '../../stageConfig';

/**
 * 守护系统:代码防护体系 A/B 层的通用机械(设计spec「代码防护体系」27条的出厂配置)
 *
 * - 保护快照:PROMPT_READY 从最新楼捕获(含 UI 写入),作回滚基准(防护6)
 * - 逐字段回滚:变量分工表落码——AI 只碰表现层白名单,其余一律拍回(防护2)
 * - delta cap:AI 可写数值 ±3 硬截(防护3;对症放宽±5 归 P2)
 * - 单向锁:情报可见/裂缝已确认/坏结局 新=base||旧||新(防护4)
 * - chat 级镜像取大(防护9):玩家手点的单调状态(阶段/堕落/裂缝确认/入住楼层)
 *   入镜像,重roll/毒快照路径盖不回;回档到镜像楼层前则作废(回档重演语义)
 */

// ============================================
// 变量分工表(AI 可写白名单;白名单外的户字段+全部全局字段=脚本专属,一律回滚)
// ============================================

/** 妻:AI 可写纯文本表现字段 */
const 妻文本白名单 = ['当前心理想法', '当前情绪', '外装', '内衣', '妆容'] as const;
/** 妻:AI 可写数值(单轮 delta cap;〔P2〕对症放宽±5) */
const 妻数值白名单 = { 好感值: 3, 堕落值: 3 } as const;
/** 身体开发四槽:仅 +3,不可衰退(负 delta 回滚,云霜凝范式) */
const 开发单轮上限 = 3;
/** 夫:AI 可写仅心理/情绪(双轴/状态/轨道全脚本) */
const 夫文本白名单 = ['当前心理想法', '当前情绪'] as const;

// ============================================
// 保护快照(模块内存;镜像在 chat 变量里持久兜底)
// ============================================

let _protSnapshot: SchemaType | null = null;

export const 有保护快照 = () => _protSnapshot !== null;

/** 捕获保护快照(整份深拷贝——分工表按字段区分在回滚侧做,捕获侧不挑字段更稳) */
export function 捕获保护快照(data: SchemaType): void {
  _protSnapshot = _.cloneDeep(data);
  同步镜像();
}

/** 重开一局清场:内存快照置空(chat 镜像由回合引擎连同过程变量一起清,此处只管模块态) */
export function 清保护快照(): void {
  _protSnapshot = null;
}

// ============================================
// chat 级镜像(防护9:单调状态取大;回档到镜像楼层之前则作废)
// ============================================

export const PROMOTE_MIRROR_KEY = '人妻公寓_晋阶镜像';

interface 户镜像 {
  阶段: number;
  堕落: number;
  碎片: number; // 裂缝碎片进度(玩家侦探操作,单调;旧镜像无此键 ?? 0 兜底)
  裂缝确认: boolean;
  情报可见: boolean;
  入住楼层: number;
}
interface 镜像结构 {
  楼层: number;
  户: Record<string, 户镜像>;
}

function 当前楼层(): number {
  return SillyTavern.chat?.length ?? 0;
}

/**
 * 镜像同步:先并入内存快照(取大/单向真),再把快照回写镜像。
 * UI 侧抬升(晋阶/送礼开门/性癖装载)须另行调用 镜像直写 即时落账(iframe store 陷阱)。
 */
function 同步镜像(): void {
  if (!_protSnapshot) return;
  try {
    const floor = 当前楼层();
    const mirror = _.get(getVariables({ type: 'chat' }), PROMOTE_MIRROR_KEY) as 镜像结构 | undefined;
    // 镜像楼层 ≤ 当前楼 → 取大并入快照;> 当前楼 = 玩家回档到之前 → 作废,用当前数据覆盖
    if (mirror && mirror.楼层 <= floor) {
      for (const [门牌号, m] of Object.entries(mirror.户 ?? {})) {
        const 节点 = _protSnapshot.户[门牌号];
        if (!节点) continue; // 回档到入住前:MVU 按楼恢复天然无此户,回档重演免费成立
        节点.妻.当前阶段 = Math.max(节点.妻.当前阶段, m.阶段 ?? 0);
        节点.妻.堕落值 = Math.max(节点.妻.堕落值, m.堕落 ?? 0);
        节点.妻.裂缝.碎片进度 = Math.max(节点.妻.裂缝.碎片进度, m.碎片 ?? 0);
        节点.妻.裂缝.已确认 = 节点.妻.裂缝.已确认 || !!m.裂缝确认;
        节点.妻.情报可见 = 节点.妻.情报可见 || !!m.情报可见;
      }
    }
    const 新镜像: 镜像结构 = { 楼层: floor, 户: {} };
    for (const [门牌号, 节点] of Object.entries(_protSnapshot.户)) {
      新镜像.户[门牌号] = {
        阶段: 节点.妻.当前阶段,
        堕落: 节点.妻.堕落值,
        碎片: 节点.妻.裂缝.碎片进度,
        裂缝确认: 节点.妻.裂缝.已确认,
        情报可见: 节点.妻.情报可见,
        入住楼层: 节点._入住楼层,
      };
    }
    // Promise.resolve 包一层:insertOrAssignVariables 部分版本同步返回 undefined,裸链 .catch 会炸
    void Promise.resolve(insertOrAssignVariables({ [PROMOTE_MIRROR_KEY]: 新镜像 }, { type: 'chat' })).catch(
      (e: unknown) => console.error('[人妻公寓] 镜像写入失败', e),
    );
  } catch (e) {
    console.error('[人妻公寓] 镜像同步失败', e);
  }
}

/**
 * 镜像直写(UI 抬升点调用:手动晋阶/送礼开门/裂缝确认/入住):
 * 状态栏按钮写完 message_id=-1 后同步调用,确保"玩家手点的单调状态"即刻入镜像。
 */
export function 镜像直写(门牌号: string, 抬升: Partial<户镜像>): void {
  try {
    const floor = 当前楼层();
    const mirror = (_.get(getVariables({ type: 'chat' }), PROMOTE_MIRROR_KEY) as 镜像结构 | undefined) ?? {
      楼层: floor,
      户: {},
    };
    const m = mirror.户[门牌号] ?? {
      阶段: 0,
      堕落: 0,
      碎片: 0,
      裂缝确认: false,
      情报可见: false,
      入住楼层: 0,
    };
    mirror.户[门牌号] = {
      阶段: Math.max(m.阶段, 抬升.阶段 ?? 0),
      堕落: Math.max(m.堕落, 抬升.堕落 ?? 0),
      碎片: Math.max(m.碎片 ?? 0, 抬升.碎片 ?? 0),
      裂缝确认: m.裂缝确认 || !!抬升.裂缝确认,
      情报可见: m.情报可见 || !!抬升.情报可见,
      入住楼层: Math.max(m.入住楼层, 抬升.入住楼层 ?? 0),
    };
    mirror.楼层 = floor;
    void Promise.resolve(insertOrAssignVariables({ [PROMOTE_MIRROR_KEY]: mirror }, { type: 'chat' })).catch(
      (e: unknown) => console.error('[人妻公寓] 镜像直写失败', e),
    );
  } catch (e) {
    console.error('[人妻公寓] 镜像直写失败', e);
  }
}

// ============================================
// 回滚 + 裁剪(写阶段主闸;数据驱动吃统一结构 户.{妻,夫},加户=加配置代码零改)
// ============================================

/**
 * 回滚脚本专属字段 + AI 可写字段 delta cap。
 * @param 焦点户 本轮焦点(三态机):名单外的户=后台,整体拍回快照(轻逻辑红利);
 *   不传 = 无焦点信息(保守起见全按焦点规则逐字段处理)
 */
export function 回滚保护字段(data: SchemaType, 焦点户?: readonly string[]): void {
  if (!_protSnapshot) return;
  const snap = _protSnapshot;

  // ── 户级 ──
  // AI 私造户节点 = 泄底(入住只走脚本事件)→ 直接删除
  for (const 门牌号 of Object.keys(data.户)) {
    if (!snap.户[门牌号]) {
      delete data.户[门牌号];
      console.warn(`[人妻公寓] AI 私造户节点 ${门牌号},已删除`);
    }
  }
  for (const [门牌号, 快照节点] of Object.entries(snap.户)) {
    const 节点 = data.户[门牌号];
    // AI 删除了存在的户 → 整体恢复
    if (!节点) {
      data.户[门牌号] = _.cloneDeep(快照节点);
      continue;
    }
    // 后台户(非焦点):零 AI 写——整体拍回一行代码
    if (焦点户 && !焦点户.includes(门牌号)) {
      if (!_.isEqual(节点, 快照节点)) data.户[门牌号] = _.cloneDeep(快照节点);
      continue;
    }
    回滚户字段(节点, 快照节点);
  }

  // ── 全局(现金/胜任度/风闻/背包/系统 全部脚本管;脚本自己的结算发生在回滚之后) ──
  data.现金 = snap.现金;
  data.胜任度 = snap.胜任度;
  data.风闻 = snap.风闻;
  data.背包 = [...snap.背包];
  // 坏结局单向锁:base||旧||新(防护4)
  const 坏结局 = snap.系统._坏结局 || data.系统._坏结局;
  data.系统 = _.cloneDeep(snap.系统);
  data.系统._坏结局 = 坏结局;
}

/** 焦点户:分工表逐字段——白名单 delta cap,其余拍回 */
function 回滚户字段(节点: 户节点Type, 快照节点: 户节点Type): void {
  const 妻 = 节点.妻;
  const 妻快照 = 快照节点.妻;

  // AI 可写数值:±3 硬截(安检之外的脚本兜底,防护3);
  // 对症放宽:开门后(阶段≥1,裂缝三拍走完)好感 cap 升到 ±5——踩中隐痛方向的涨速红利
  for (const [轴, 基础cap] of Object.entries(妻数值白名单) as ['好感值' | '堕落值', number][]) {
    const cap = 轴 === '好感值' && 妻快照.当前阶段 >= 1 && 妻快照.裂缝.已确认 ? 5 : 基础cap;
    const delta = 妻[轴] - 妻快照[轴];
    if (Math.abs(delta) > cap) {
      妻[轴] = _.clamp(妻快照[轴] + Math.sign(delta) * cap, 0, 100);
    }
  }
  // 好感阶段封顶(阶段0"陌生邻里"接受上限封死好感,机制不靠 AI 自觉)
  妻.好感值 = Math.min(妻.好感值, 好感封顶表[_.clamp(妻快照.当前阶段, 0, 5)]);
  // 身体开发:+3 封顶,不可衰退(负 delta 回滚)
  for (const 槽 of ['小嘴', '胸部', '小屄', '屁穴'] as const) {
    const delta = 妻.身体开发[槽] - 妻快照.身体开发[槽];
    if (delta < 0) 妻.身体开发[槽] = 妻快照.身体开发[槽];
    else if (delta > 开发单轮上限) 妻.身体开发[槽] = _.clamp(妻快照.身体开发[槽] + 开发单轮上限, 0, 100);
  }
  // 文本白名单以外的妻字段全部拍回
  妻.婚姻值 = 妻快照.婚姻值;
  妻.当前阶段 = 妻快照.当前阶段;
  妻.阶段标题 = 阶段标题(妻快照.当前阶段); // 派生字段永远脚本重算
  妻.裂缝 = _.cloneDeep(妻快照.裂缝);
  妻.气质描述 = 妻快照.气质描述; // 按阶段脚本改写,AI 禁写
  妻.特殊 = [...妻快照.特殊]; // 装备与永久件=脚本写
  妻.性癖装载 = [...妻快照.性癖装载];
  妻.曾开发性癖 = [...妻快照.曾开发性癖];
  // 单向锁:情报可见
  妻.情报可见 = 妻快照.情报可见 || 妻.情报可见;
  妻.上次互动楼层 = 妻快照.上次互动楼层;
  妻._上次结算楼层 = 妻快照._上次结算楼层;
  妻._要钱次数 = 妻快照._要钱次数;
  妻._上次要钱楼层 = 妻快照._上次要钱楼层;
  void 妻文本白名单; // 文本字段 AI 自由写,无需处理(列表仅作分工表文档锚)

  // 夫:双轴/状态/轨道全脚本,AI 只许心理/情绪
  const 夫 = 节点.夫;
  const 夫快照 = 快照节点.夫;
  夫.疑心值 = 夫快照.疑心值;
  夫.信任值 = 夫快照.信任值;
  夫.状态 = 夫快照.状态;
  夫.结局轨道 = 夫快照.结局轨道;
  void 夫文本白名单;

  节点._入住楼层 = 快照节点._入住楼层;
}

// ============================================
// 户存在性工具(第四态休眠:无键=不存在,存在性 guard 即可)
// ============================================

export function 已入住门牌(data: SchemaType): 门牌[] {
  return Object.keys(data.户) as 门牌[];
}
