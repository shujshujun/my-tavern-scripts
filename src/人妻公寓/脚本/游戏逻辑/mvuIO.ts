import { Schema, type SchemaType, 验证当前MVU存档版本 } from '../../schema';
import { 门牌列表, type 门牌 } from '../../stageConfig';
import { 冻结全楼余波堕落, 记录全楼有效成长, type 合法正候选表 } from './冷落系统';
import { 取绝对时段 } from './楼层时钟';
import { 当前时间线切换世代 } from './时间线切换协调';
import { 规范AI表现文本 } from './AI表现文本安全';

/**
 * 脚本侧 MVU 读写共享模块
 *
 * 铁律(iframe store 陷阱):脚本/按钮要让 AI 下轮读到的写入,必须直写 message_id=-1,
 * 不能靠 store flush。
 */

/** 脚本自己写变量时置 true,VARIABLE_UPDATE_ENDED 据此跳过(防回退循环,防护17) */
export let 脚本写入中 = false;
let 待完成写入数 = 0;

/**
 * 所有“先读最新 MVU、再整表写回”的脚本操作共用同一串行租约。
 *
 * 注意：`脚本写入` 本身不会再次取得这把租约。租约由事务最外层取得，既让同一事务内
 * 的读取与写回不可被另一项整表操作穿插，也避免已持锁的安全操作在调用 `脚本写入` 时
 * 发生不可重入的自等待。
 */
let MVU操作队列: Promise<void> = Promise.resolve();

/**
 * 活动整表事务的提交守卫。任务可以在 await 前读到旧分支；宿主 swipe/delete 会同步
 * 推进时间线世代，因此真正写回前必须重新核对，而不能只依赖“拿锁时检查过一次”。
 */
const MVU提交校验表 = new Map<symbol, () => boolean>();

class MVU提交失效错误 extends Error {}

export function 登记MVU提交校验(校验: () => boolean): () => void {
  const 令牌 = Symbol('rqgy-mvu-commit-guard');
  MVU提交校验表.set(令牌, 校验);
  return () => {
    MVU提交校验表.delete(令牌);
  };
}

function 确认MVU提交仍有效(): void {
  for (const 校验 of MVU提交校验表.values()) {
    if (!校验()) throw new MVU提交失效错误('消息时间线或分支已经变化，本次旧操作不再提交。');
  }
}

export function 排队MVU操作<T>(任务: () => Promise<T> | T): Promise<T> {
  const 入队时间线世代 = 当前时间线切换世代();
  const 本次 = MVU操作队列.catch(() => undefined).then(async () => {
    const 取消提交校验 = 登记MVU提交校验(() => 入队时间线世代 === 当前时间线切换世代());
    try {
      确认MVU提交仍有效();
      return await 任务();
    } finally {
      取消提交校验();
    }
  });
  MVU操作队列 = 本次.then(
    () => undefined,
    () => undefined,
  );
  return 本次;
}

/** 读最新楼 stat_data(经 schema 消毒;毒快照场景请先用 读最近有效stat 判存在性) */
export function 读取(): { raw: object; data: SchemaType } {
  const raw = Mvu.getMvuData({ type: 'message', message_id: -1 }) as object;
  const stat = _.get(raw, 'stat_data') ?? {};
  验证当前MVU存档版本(stat);
  const data = Schema.parse(stat);
  return { raw, data };
}

export interface 脚本写入选项 {
  /** 重开、回档恢复等非玩法写回必须关闭，避免把状态替换误记成成长。 */
  记录成长?: boolean;
  /** 测试或特殊调用可显式提供绝对时段。 */
  当前绝对时段?: number;
  /** 供“合法正候选被上限截住”的脚本入口显式补充，普通UI写入无需提供。 */
  合法正候选?: 合法正候选表;
}

function 写入绝对时段(data: SchemaType, 显式时段?: number): number {
  if (Number.isFinite(显式时段)) return Math.max(0, Math.floor(显式时段!));
  return 取绝对时段(data);
}

/**
 * 带守卫的脚本写入(大额涨幅/机制字段更新只走这里)。
 * UI脚本的真实数值成长也在同一次MVU写入里刷新冷落成长钟；纯手机写入没有合资格
 * 数值差异，因此不会刷新。余波期间任何脚本堕落改写都先冻结，其他成长轴照常生效。
 */
export async function 脚本写入(raw: object, data?: SchemaType, 选项: 脚本写入选项 = {}): Promise<void> {
  确认MVU提交仍有效();
  if (data) {
    const 旧raw = _.get(raw, 'stat_data');
    if (选项.记录成长 !== false && 旧raw && !_.isEmpty(旧raw)) {
      try {
        const 旧data = Schema.parse(旧raw) as SchemaType;
        冻结全楼余波堕落(旧data, data);
        const 成长时段 = 写入绝对时段(data, 选项.当前绝对时段);
        // 时段覆盖作为纯参数传入，保持 data 对象身份；封顶脚本奖励暂存在该身份上的一次性候选才不会丢失。
        记录全楼有效成长(旧data, data, 选项.合法正候选, 成长时段);
      } catch (e) {
        // 成长账是附加机制；当前快照异常时不能阻断原 UI 操作。
        console.warn('[人妻公寓] 脚本写入的成长识别失败，本次仅保留原操作:', e);
      }
    }
    _.set(raw, 'stat_data', data);
  }
  确认MVU提交仍有效();
  待完成写入数 += 1;
  脚本写入中 = true;
  try {
    await Mvu.replaceMvuData(raw as Mvu.MvuData, { type: 'message', message_id: -1 });
  } finally {
    待完成写入数 -= 1;
    脚本写入中 = 待完成写入数 > 0;
  }
  确认MVU提交仍有效();
  await 同步整表视图(_.get(raw, 'stat_data'));
}

export interface AI可写变量范围 {
  妻: readonly 门牌[];
  夫: readonly 门牌[];
  /** 只有实际参与亲密行为的妻可见堕落与身体开发；同场旁观者仍只开放日常字段。 */
  亲密妻: readonly 门牌[];
}

const 空AI可写变量范围: AI可写变量范围 = { 妻: [], 夫: [], 亲密妻: [] };
const 有效门牌 = new Set<string>(门牌列表);
type AI可写变量范围记录 = AI可写变量范围 & { 楼层: number };

function 规范AI可写变量范围(范围: Partial<AI可写变量范围> | null | undefined): AI可写变量范围 {
  const 是有效门牌 = (门牌号: unknown): 门牌号 is 门牌 => typeof 门牌号 === 'string' && 有效门牌.has(门牌号);
  const 妻 = _.uniq((范围?.妻 ?? []).filter(是有效门牌));
  const 夫 = _.uniq((范围?.夫 ?? []).filter(是有效门牌));
  const 亲密妻 = _.uniq((范围?.亲密妻 ?? []).filter(是有效门牌)).filter(m => 妻.includes(m));
  return { 妻, 夫, 亲密妻 };
}

function 读取AI可写变量范围记录(): AI可写变量范围记录 {
  try {
    const 原值 = _.get(getVariables({ type: 'chat' }), '_整表视图范围') as
      | (Partial<AI可写变量范围> & { 楼层?: unknown })
      | undefined;
    return {
      ...规范AI可写变量范围(原值),
      楼层: typeof 原值?.楼层 === 'number' && Number.isInteger(原值.楼层) ? 原值.楼层 : -1,
    };
  } catch {
    return { ...空AI可写变量范围, 楼层: -1 };
  }
}

/**
 * 读取随聊天时间线保存的最近一次精确写权限。传入楼层时必须与生成目标楼一致；
 * 失败/停止的原生请求即使留下临时范围，也不能授权当前其他楼的手动重处理。
 */
export function 读取AI可写变量范围(预期楼层?: number): AI可写变量范围 {
  const 记录 = 读取AI可写变量范围记录();
  if (预期楼层 !== undefined && 记录.楼层 !== 预期楼层) return { ...空AI可写变量范围 };
  return { 妻: [...记录.妻], 夫: [...记录.夫], 亲密妻: [...记录.亲密妻] };
}

/** 从同一份人物检测结果构造提示、解析与守护共用的精确范围。 */
export function 构造AI可写变量范围(
  stat: SchemaType,
  焦点: readonly 门牌[],
  妻在场: readonly 门牌[],
  夫在场: readonly 门牌[],
  选项: { 只读: boolean; 亲密场景: boolean },
): AI可写变量范围 {
  if (选项.只读) return { ...空AI可写变量范围 };
  const 妻 = _.uniq(焦点.filter(m => 妻在场.includes(m)));
  const 夫 = _.uniq(焦点.filter(m => 夫在场.includes(m)));
  const 亲密参与者 = new Set(
    stat.系统._性爱场景.状态 === '空闲' ? 妻 : (Object.keys(stat.系统._性爱场景.参与者) as 门牌[]),
  );
  const 亲密妻 = 选项.亲密场景 ? 妻.filter(m => 亲密参与者.has(m)) : [];
  return { 妻, 夫, 亲密妻 };
}

/**
 * 变量解析只需要“本轮可写演员的现值”，不需要整份存档。
 *
 * - 妻本人在场：日常只给好感、心理、情绪与可换装字段；
 * - 亲密楼：额外开放堕落与四项身体开发；
 * - 丈夫本人在场：只给其两个 AI 可写表现字段；
 * - 后台住户、资源、经济、婚姻、阶段与所有脚本字段完全不进入提示。
 */
export function 构造AI可写变量视图(stat: unknown, 输入范围: Partial<AI可写变量范围>): Record<string, unknown> {
  const 范围 = 规范AI可写变量范围(输入范围);
  const 户源 = (_.get(stat, '户') ?? {}) as Record<string, unknown>;
  const 户: Record<string, unknown> = {};
  const 门牌们 = _.uniq([...范围.妻, ...范围.夫]);

  for (const 门牌号 of 门牌们) {
    const 户节点 = 户源[门牌号] as Record<string, unknown> | undefined;
    if (!户节点) continue;
    const 可写户: Record<string, unknown> = {};
    if (范围.妻.includes(门牌号)) {
      const 妻源 = (户节点.妻 ?? {}) as Record<string, unknown>;
      const 妻: Record<string, unknown> = {
        好感值: 妻源.好感值,
        当前心理想法: 规范AI表现文本(妻源.当前心理想法),
        当前情绪: 规范AI表现文本(妻源.当前情绪),
        外装: 规范AI表现文本(妻源.外装),
        内衣: 规范AI表现文本(妻源.内衣),
        妆容: 规范AI表现文本(妻源.妆容),
      };
      if (范围.亲密妻.includes(门牌号)) {
        妻.堕落值 = 妻源.堕落值;
        妻.身体开发 = _.pick((妻源.身体开发 ?? {}) as Record<string, unknown>, ['小嘴', '胸部', '小屄', '屁穴']);
      }
      可写户.妻 = 妻;
    }
    if (范围.夫.includes(门牌号)) {
      const 夫源 = (户节点.夫 ?? {}) as Record<string, unknown>;
      可写户.夫 = {
        当前心理想法: 规范AI表现文本(夫源.当前心理想法),
        当前情绪: 规范AI表现文本(夫源.当前情绪),
      };
    }
    if (!_.isEmpty(可写户)) 户[门牌号] = 可写户;
  }
  return { 户 };
}

/** 同步注入视图(视图在 await 前同步算完,调用方 fire-and-forget 也不怕源对象随后被改) */
export async function 同步整表视图(
  stat: unknown,
  额外提交校验?: () => boolean,
  显式范围?: Partial<AI可写变量范围>,
  显式楼层?: number,
): Promise<boolean> {
  if (!stat || _.isEmpty(stat)) return false; // 毒快照纪律:无真值绝不写空视图
  const 确认视图提交仍有效 = () => {
    确认MVU提交仍有效();
    if (额外提交校验 && !额外提交校验()) {
      throw new MVU提交失效错误('消息时间线或分支已经变化，本次旧视图不再提交。');
    }
  };
  确认视图提交仍有效();
  try {
    const 旧记录 = 读取AI可写变量范围记录();
    const 范围 = 规范AI可写变量范围(显式范围 ?? 旧记录);
    const 范围记录: AI可写变量范围记录 = {
      ...范围,
      楼层: Number.isInteger(显式楼层) ? 显式楼层! : 旧记录.楼层,
    };
    const 视图 = 构造AI可写变量视图(stat, 范围);
    // updateVariablesWith + _.set 整值替换(insertOrAssign 深合并会让缩短的数组残留旧尾)
    await Promise.resolve(
      updateVariablesWith(
        vars => {
          确认视图提交仍有效();
          _.set(vars, '_整表视图范围', 范围记录);
          _.set(vars, '_整表视图', 视图);
          return vars;
        },
        { type: 'chat' },
      ),
    );
    确认视图提交仍有效();
    return true;
  } catch (e) {
    if (e instanceof MVU提交失效错误) throw e;
    console.warn('[人妻公寓] 整表视图同步失败(下一个变更点会重试):', e);
    return false;
  }
}

/**
 * 毒快照防御 + 回退取楼 N=10(防护7/8,秦璐 v0.38/v0.40 血泪范式):
 * 从末楼往前找最近一楼含有效 stat_data 的数据——MVU 往刚发送的用户楼拷贝变量是异步的,
 * 与提示词构建存在竞态;竞态轮末楼为空,旧快照定格在 UI 操作之前,盖回=晋阶被打回。
 * 上一楼(含全部 UI 写入)就是真值,回退拿它:快照恒新鲜。
 * 找不到(全新对话等)返回 undefined,由调用方跳过——绝不 parse({}) 造默认值。
 */
export function 读最近有效stat(): unknown {
  const last = (SillyTavern.chat?.length ?? 0) - 1;
  for (let id = last; id >= 0 && id > last - 10; id--) {
    try {
      const raw = _.get(Mvu.getMvuData({ type: 'message', message_id: id }), 'stat_data');
      if (raw && !_.isEmpty(raw)) {
        if (id !== last) console.info(`[人妻公寓] 末楼 stat_data 未就绪,回退取 ${id} 楼数据(末楼 ${last})`);
        return raw;
      }
    } catch {
      /* 单楼读取异常继续往前找 */
    }
  }
  return undefined;
}

/**
 * 读取可安全继续写回的最近有效数据。
 * stat_data 可以回退取旧楼真值，但容器必须取当前末楼，避免把旧楼的其它 MVU 字段整包盖回。
 */
export function 读取最近有效(): { raw: object; data: SchemaType } | undefined {
  const rawStat = 读最近有效stat();
  if (!rawStat) return undefined;
  验证当前MVU存档版本(rawStat);
  const raw = Mvu.getMvuData({ type: 'message', message_id: -1 }) as object;
  return { raw, data: Schema.parse(rawStat) as SchemaType };
}
