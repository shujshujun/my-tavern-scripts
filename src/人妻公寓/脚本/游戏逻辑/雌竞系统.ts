import type { SchemaType, 户节点Type } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表 } from '../../stageConfig';

/**
 * 雌竞系统(2026-07-19 用户提案拍板):
 * - 不开新变量:雌竞度=派生现算(阶段资格门+好感/堕落/被冷落折算),零漂移零守护改动
 * - 风格表在 stageConfig 户配置.雌竞(每人竞法不同,沈静仪的"不参与"就是她的竞法;母亲不入局)
 * - 两个演出口:①地图撞场(快照【雌竞】指令,snapshotSystem 调用) ②姐妹群(手机系统,阶段3+专属小群)
 * - 楼务群(有丈夫们)永远一片和睦——公开流贤妻纪律不动
 */

/** 资格门:阶段≥3(越界,2026-07-19 用户改拍从2提到3)——真下过水才有资格吃醋,与姐妹群同线 */
export function 雌竞资格(门牌号: 门牌, 节点: 户节点Type | undefined): boolean {
  return !!节点 && !!户静态表[门牌号]?.雌竞 && 节点.妻.当前阶段 >= 3;
}

/** 姐妹群资格:阶段≥3(越界)——都下过水的人才有资格进"心照不宣"的小群 */
export function 姐妹群成员(data: SchemaType): 门牌[] {
  return (Object.keys(data.户) as 门牌[]).filter(
    m => !户静态表[m]?.隐身 && !!户静态表[m]?.雌竞 && data.户[m].妻.当前阶段 >= 3,
  );
}

/**
 * 雌竞火气感知(派生现算,纯感知语无数值):
 * 在意度 ≈ 好感/2 + 堕落/4 + 冷落加成(他越久没理她,火越旺,封顶20)
 */
export function 雌竞火气(节点: 户节点Type, 楼层: number): string {
  const 度 = 雌竞火气值(节点, 楼层);
  if (度 >= 60) return '妒火已经压不太住,看到他和别人多说一句都刺眼';
  if (度 >= 35) return '明着较劲的程度,嘴上不承认';
  return '淡淡的在意,自己都没太察觉';
}

/** 同一公式的数值口只供脚本排序与逐角色知情反应使用，不写入存档。 */
export function 雌竞火气值(节点: 户节点Type, 楼层: number): number {
  const 妻 = 节点.妻;
  const 冷落 = Math.min(20, Math.max(0, 楼层 - 妻.上次互动楼层) * 0.8);
  return 妻.好感值 / 2 + 妻.堕落值 / 4 + 冷落;
}

/** 撞场演出块(snapshotSystem 调用;竞者≥2 时注入,概率与冷却由调用方管) */
export function 雌竞演出块(竞者: 门牌[], data: SchemaType, 楼层: number, 起因?: string): string {
  const 段 = 竞者.map(m => {
    const 配 = 户静态表[m];
    return `${配.妻名}:${配.雌竞}(此刻:${雌竞火气(data.户[m], 楼层)})`;
  });
  return (
    `【雌竞】在场的太太们同时面对{{user}},空气里有别的东西——按各自的路数演一场暗流:\n  ${段.join('\n  ')}\n` +
    (起因 ? `  眼下的由头:${起因}\n` : '') +
    '  纪律:争的是他的注意力,抢的是话头和位置;点到即止,人人维持表面体面,戏眼全在弦外之音。' +
    '严禁任何人说破自己或猜破别人与{{user}}的秘密(反全知照常);众人不必都发力,按火气大小分配戏份'
  );
}

// ============================================
// 换装余波(2026-07-19 用户拍板1-5全做+阶段4私密件追拍):
// 玩家送出"外显"礼物(或阶段≥4收下私密件)→ 记一条余波,缓冲3楼发酵,18楼过期。
// 消费口:姐妹群阴阳/楼务群探针(仅外显)/撞场起因/朋友圈晒装(仅外显)/丈夫起疑。
// 存 chat 变量(软记录,回档语义=起楼>当前楼作废;同秤 _侦探 范式)
// ============================================

export interface 换装余波 {
  /** 新事件的持久唯一身份；用于区分字段完全相同但先后发生的两次余波。 */
  事件ID?: string;
  门牌: 门牌;
  起楼: number;
  物: string; // 外显/私密外显 感知语
  私密?: boolean; // 私密件:楼务群探针与朋友圈晒装跳过
  群议?: boolean;
  探针?: boolean;
  圈晒?: boolean;
  疑记?: boolean;
}

/** 〔调参〕余波缓冲与过期(真实楼层;街坊的眼睛需要时间,旧闻没人提) */
export const 余波缓冲楼 = 3;
export const 余波过期楼 = 18;
let 换装余波事件序号 = 0;

/** 为每次新余波创建不可复用的持久 nonce；序号保证同一毫秒、随机源异常时仍不重复。 */
export function 创建换装余波事件ID(): string {
  换装余波事件序号 += 1;
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return `rqp-aftereffect-${uuid}`;
  } catch {
    /* 旧 WebView 无 randomUUID 时走下方兼容路径 */
  }
  return `rqp-aftereffect-${Date.now().toString(36)}-${换装余波事件序号.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * 余波 CAS 身份比较。任一侧带新 ID 时必须两侧 ID 完全相同；只有双方都是旧存档记录时，
 * 才回退到原有字段身份，以兼容升级前尚未消费完的余波。
 */
export function 同一换装余波事件(
  a: Partial<换装余波> | null | undefined,
  b: Partial<换装余波> | null | undefined,
): boolean {
  if (!a || !b) return false;
  const aID = typeof a.事件ID === 'string' ? a.事件ID.trim() : '';
  const bID = typeof b.事件ID === 'string' ? b.事件ID.trim() : '';
  if (aID || bID) return !!aID && aID === bID;
  return a.门牌 === b.门牌 && a.起楼 === b.起楼 && a.物 === b.物 && !!a.私密 === !!b.私密;
}

/** 所有余波消费口共用同一发酵边界，避免朋友圈、丈夫起疑各自漂移。 */
export function 余波已发酵(当前楼: number, 起楼: number): boolean {
  return 当前楼 - 起楼 >= 余波缓冲楼;
}

export async function 记余波(门牌号: 门牌, 物: string, 私密?: boolean): Promise<void> {
  const 楼 = getLastMessageId();
  const 新余波 = {
    事件ID: 创建换装余波事件ID(),
    门牌: 门牌号,
    起楼: 楼,
    物,
    私密: !!私密,
    群议: false,
    探针: false,
    圈晒: false,
    疑记: false,
  } satisfies 换装余波;
  await updateVariablesWith(
    vars => {
      // 整值替换，避免 insertOrAssign 的深合并把上一事件的“已消费”标记带进新事件。
      _.set(vars, '_换装余波', 新余波);
      return vars;
    },
    { type: 'chat' },
  );
}

/** 读余波:回档(起楼>当前楼)或过期自动作废 */
export function 读余波(当前楼: number): 换装余波 | null {
  const p = (_.get(getVariables({ type: 'chat' }), '_换装余波') ?? null) as 换装余波 | null;
  if (!p?.门牌 || p.起楼 > 当前楼 || 当前楼 - p.起楼 >= 余波过期楼) return null;
  return p;
}

/**
 * 精确标记调用方冻结的那一条余波。用于“核心 MVU 先提交、聊天消费旗后提交”的事务；
 * 若期间已经产生另一条同字段余波，CAS 失败且绝不把新事件误标成已消费。
 */
export async function 标记指定余波(
  预期: Partial<换装余波>,
  补: Partial<换装余波>,
): Promise<boolean> {
  let 已标记 = false;
  await Promise.resolve(
    updateVariablesWith(
      vars => {
        const 当前 = (_.get(vars, '_换装余波') ?? null) as 换装余波 | null;
        if (!同一换装余波事件(预期, 当前)) return vars;
        _.set(vars, '_换装余波', { ...当前, ...补, 事件ID: 当前?.事件ID });
        已标记 = true;
        return vars;
      },
      { type: 'chat' },
    ),
  );
  return 已标记;
}

/** 标记余波某消费口已用(防重复议论)。旧调用保持 fire-and-forget，但仍走精确 CAS。 */
export function 标余波(补: Partial<换装余波>): void {
  const p = (_.get(getVariables({ type: 'chat' }), '_换装余波') ?? null) as 换装余波 | null;
  if (!p) return;
  void 标记指定余波(p, 补).catch((e: unknown) => console.error('[人妻公寓·雌竞] 余波标记失败', e));
}
