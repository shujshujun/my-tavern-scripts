import { Schema, type SchemaType } from '../../schema';

/**
 * 脚本侧 MVU 读写共享模块
 *
 * 铁律(iframe store 陷阱):脚本/按钮要让 AI 下轮读到的写入,必须直写 message_id=-1,
 * 不能靠 store flush。
 */

/** 脚本自己写变量时置 true,VARIABLE_UPDATE_ENDED 据此跳过(防回退循环,防护17) */
export let 脚本写入中 = false;
let 待完成写入数 = 0;

/** 读最新楼 stat_data(经 schema 消毒;毒快照场景请先用 读最近有效stat 判存在性) */
export function 读取(): { raw: object; data: SchemaType } {
  const raw = Mvu.getMvuData({ type: 'message', message_id: -1 }) as object;
  const data = Schema.parse(_.get(raw, 'stat_data') ?? {});
  return { raw, data };
}

/** 带守卫的脚本写入(大额涨幅/机制字段更新只走这里) */
export async function 脚本写入(raw: object, data?: SchemaType): Promise<void> {
  if (data) _.set(raw, 'stat_data', data);
  待完成写入数 += 1;
  脚本写入中 = true;
  try {
    await Mvu.replaceMvuData(raw as Mvu.MvuData, { type: 'message', message_id: -1 });
  } finally {
    待完成写入数 -= 1;
    脚本写入中 = 待完成写入数 > 0;
  }
  await 同步整表视图(_.get(raw, 'stat_data'));
}

/**
 * 整表瘦身(2026-07-27 拍板):酒馆助手的 format_message_variable 只滤 `$` 键,schema 里
 * 注释"AI 不可见"的 `_` 机制字段(荣耀洞位、撞见次数、疑心冻结、已注入事件全文等)其实
 * 每轮原样进 prompt——既膨胀又泄底。世界书整表条目改读 chat 变量 `_整表视图`,由本函数
 * 在每个 stat 变更点同步:只剥 `_`/`$` 前缀键与剥空后的空对象(系统 块整块消失),
 * 其余字段一个不动——AI 可读可写的记账地基与今天完全一致。
 */
function 过滤机制字段(节点: unknown): unknown {
  if (Array.isArray(节点)) return 节点.map(过滤机制字段);
  if (_.isPlainObject(节点)) {
    const 出: Record<string, unknown> = {};
    for (const [键, 值] of Object.entries(节点 as Record<string, unknown>)) {
      if (键.startsWith('_') || 键.startsWith('$')) continue;
      const 滤后 = 过滤机制字段(值);
      if (_.isPlainObject(滤后) && _.isEmpty(滤后)) continue;
      出[键] = 滤后;
    }
    return 出;
  }
  return 节点;
}

/** 同步注入视图(视图在 await 前同步算完,调用方 fire-and-forget 也不怕源对象随后被改) */
export async function 同步整表视图(stat: unknown): Promise<void> {
  if (!stat || _.isEmpty(stat)) return; // 毒快照纪律:无真值绝不写空视图
  try {
    const 视图 = 过滤机制字段(stat);
    // updateVariablesWith + _.set 整值替换(insertOrAssign 深合并会让缩短的数组残留旧尾)
    await Promise.resolve(
      updateVariablesWith(
        vars => {
          _.set(vars, '_整表视图', 视图);
          return vars;
        },
        { type: 'chat' },
      ),
    );
  } catch (e) {
    console.warn('[人妻公寓] 整表视图同步失败(下一个变更点会重试):', e);
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
  const raw = Mvu.getMvuData({ type: 'message', message_id: -1 }) as object;
  return { raw, data: Schema.parse(rawStat) as SchemaType };
}
