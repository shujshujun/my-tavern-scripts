import type { 修女职位 } from '../../schema';
import { 修女职位列表 } from '../../schema';
import { 晋阶堕落门槛, 修女表, 阶段标题列表, 专线表 } from '../../stageConfig';
import { 读取, 脚本写入 } from './mvuIO';

/**
 * 事件系统:预投骰 / 冷落计时器 / 晋阶 / 专线里程碑 / 警戒接口
 *
 * 原则:
 * - 所有"该随机但由 AI 演"的分岔吃预投骰——脚本掷骰后把结果直接烤进指令,AI 无骰可掷
 * - 大额涨幅(晋阶+10/里程碑+8/首夜+5)只走本模块,AI 的 ±3 由安检机管
 * - 事件指令零示例(教训 7):只给要求与已掷定的分岔,不给模板
 */

// ============================================
// 预投骰
// ============================================

/** 脚本侧掷骰:从选项中掷定一个(演出侧随机的唯一来源) */
export function 掷选<T>(选项: readonly T[]): T {
  return 选项[Math.floor(Math.random() * 选项.length)];
}

// ============================================
// 冷落计时器
// ============================================

const 冷落阈值 = 25; // 超过 N 楼未互动 → 排队"她主动来找你"
const 主动事件形式 = ['来告解室找你', '借故给你送东西', '拿一个问题来请教你', '在你必经之处"偶遇"'] as const;

interface 主动事件 {
  职位: 修女职位;
  形式: string;
}

function 读主动事件(): 主动事件 | undefined {
  return _.get(getVariables({ type: 'chat' }), '_主动事件') as 主动事件 | undefined;
}

/** 每 AI 楼调用:挑最久未互动且超阈值的修女排队(一次只排一人) */
export function 冷落检测() {
  if (读主动事件()) return; // 已有待演事件
  const { data } = 读取();
  if (data.会议.状态 !== '日常') return;
  const 当前楼 = getLastMessageId();
  const 候选 = 修女职位列表
    .filter(职位 => !修女表[职位].隐藏 || data.修女[职位].情报可见)
    .map(职位 => ({ 职位, 距离: 当前楼 - data.修女[职位].上次互动楼层 }))
    .filter(x => x.距离 >= 冷落阈值)
    .sort((a, b) => b.距离 - a.距离);
  if (!候选.length) return;

  const 职位 = 候选[0].职位;
  insertOrAssignVariables(
    { _主动事件: { 职位, 形式: 掷选(主动事件形式) } satisfies 主动事件 },
    { type: 'chat' },
  );
  console.info(`[禁忌修道院] 冷落计时器:${修女表[职位].显示名} 主动事件已排队`);
}

/** 主动事件注入指令(有则返回) */
export function 取主动事件指令(): string | undefined {
  const 事件 = 读主动事件();
  if (!事件) return undefined;
  const 配 = 修女表[事件.职位];
  return [
    `<修女主动事件>`,
    `${配.显示名}(${事件.职位})已许久没和神父说上话。本楼由她主动出现:${事件.形式}。`,
    `她此行的真实动机由她当前的处境与心事自然决定(参考快照的感知与心理行),与她的罪恶感状态咬合——罪越重的人,越需要一个来找神父的理由。不抢玩家正在进行的事,若玩家正忙,她可以等在边上。`,
    `</修女主动事件>`,
  ].join('\n');
}

/** 主动事件已演,结算:清标记 + 刷新她的互动楼层 */
export function 清主动事件() {
  const 事件 = 读主动事件();
  if (!事件) return;
  const { raw, data } = 读取();
  data.修女[事件.职位].上次互动楼层 = getLastMessageId();
  脚本写入(raw, data);
  insertOrAssignVariables({ _主动事件: null }, { type: 'chat' });
}

/** 焦点修女互动楼层刷新(每 AI 楼,由 index.ts 传入本轮焦点) */
export function 刷新互动楼层(焦点: 修女职位[]) {
  if (!焦点.length) return;
  const { raw, data } = 读取();
  const 楼 = getLastMessageId();
  for (const 职位 of 焦点) data.修女[职位].上次互动楼层 = 楼;
  脚本写入(raw, data);
}

// ============================================
// 晋阶(堕落度达标只是资格,正戏演完脚本 +1)
// ============================================

interface 晋阶事件 {
  职位: 修女职位;
  目标阶段: number;
}

function 读晋阶(): 晋阶事件 | undefined {
  return _.get(getVariables({ type: 'chat' }), '_晋阶') as 晋阶事件 | undefined;
}

/** 晋阶按钮入口(UI eventEmit 调用):校验资格,排队正戏 */
export function 请求晋阶(职位: 修女职位) {
  const { data } = 读取();
  const 修女 = data.修女[职位];
  if (修女.当前阶段 >= 5) return console.warn('[禁忌修道院] 已是最终阶段');
  if (修女.堕落度 < 晋阶堕落门槛[修女.当前阶段]) {
    return console.warn('[禁忌修道院] 堕落度未达标,晋阶被拒');
  }
  if (读晋阶()) return console.warn('[禁忌修道院] 已有晋阶正戏排队');
  insertOrAssignVariables(
    { _晋阶: { 职位, 目标阶段: 修女.当前阶段 + 1 } satisfies 晋阶事件 },
    { type: 'chat' },
  );
  console.info(`[禁忌修道院] ${修女表[职位].显示名} 晋阶正戏已排队`);
}

/** 晋阶正戏指令 */
export function 取晋阶指令(): string | undefined {
  const 事件 = 读晋阶();
  if (!事件) return undefined;
  const 配 = 修女表[事件.职位];
  const 旧界 = 配.阶段接受上限[事件.目标阶段 - 2];
  const 新界 = 配.阶段接受上限[事件.目标阶段 - 1];
  return [
    `<晋阶正戏>`,
    `本楼是 ${配.显示名}(${事件.职位})跨过界线的正戏:她将从「${阶段标题列表[事件.目标阶段 - 2]}」踏入「${阶段标题列表[事件.目标阶段 - 1]}」。`,
    `旧的边界:${旧界}`,
    `新的边界:${新界}`,
    `要求:让"跨过去"成为一个有重量的瞬间——她清楚自己在越过什么,越过时的挣扎、决断或沦陷要落在具体的身体与动作上;跨过之后,新边界内的第一次尝试要立刻发生,让玩家即刻尝到晋阶的奖励感。她的性格与专线处境决定这场戏的形状。`,
    `</晋阶正戏>`,
  ].join('\n');
}

/** 晋阶正戏已演,结算:阶段+1,堕落度+10(大额涨幅) */
export function 结算晋阶() {
  const 事件 = 读晋阶();
  if (!事件) return;
  const { raw, data } = 读取();
  const 修女 = data.修女[事件.职位];
  修女.当前阶段 = Math.min(5, 事件.目标阶段);
  修女.阶段标题 = 阶段标题列表[修女.当前阶段 - 1];
  修女.堕落度 = _.clamp(修女.堕落度 + 10, 0, 100);
  修女.上次互动楼层 = getLastMessageId();
  脚本写入(raw, data);
  insertOrAssignVariables({ _晋阶: null }, { type: 'chat' });
  console.info(`[禁忌修道院] ${修女表[事件.职位].显示名} 晋阶完成 → ${修女.阶段标题}`);
}

export const 晋阶待演 = () => !!读晋阶();

// ============================================
// 专线里程碑(达成=脚本事件,大额涨幅入口;触发方式后续接事件/按钮)
// ============================================

export function 达成里程碑(职位: 修女职位, 里程碑id: string) {
  const 线 = 专线表[职位];
  const 碑 = 线.里程碑.find(m => m.id === 里程碑id);
  if (!碑) return console.warn(`[禁忌修道院] 未知里程碑:${职位}/${里程碑id}`);
  const { raw, data } = 读取();
  const 修女 = data.修女[职位];
  if (修女.专线进度[里程碑id]) return; // 幂等:已达成
  修女.专线进度[里程碑id] = `第${getLastMessageId()}楼`;
  修女.支持度 = _.clamp(修女.支持度 + 8, 0, 100);

  // 特殊效果:纠察倒戈 → 全员投票情报透明
  if (职位 === '纠察' && 里程碑id === '倒戈') {
    for (const 各 of 修女职位列表) data.修女[各].情报可见 = true;
  }
  // 情报可见:攻略到一定程度(任一里程碑)即可见该修女倾向
  修女.情报可见 = true;

  脚本写入(raw, data);
  console.info(`[禁忌修道院] 里程碑达成:${修女表[职位].显示名}·${碑.标题}`);
}

// ============================================
// 警戒度接口(涨=事件调用〔语义检测待定〕;回落=每楼自然衰减)
// ============================================

export function 调警戒(增量: number) {
  const { raw, data } = 读取();
  data.警戒度 = _.clamp(data.警戒度 + 增量, 0, 100);
  脚本写入(raw, data);
}

/** 每 AI 楼自然回落 1 点(日常状态) */
export function 警戒回落(data: { 警戒度: number }) {
  if (data.警戒度 > 0) data.警戒度 -= 1;
}
