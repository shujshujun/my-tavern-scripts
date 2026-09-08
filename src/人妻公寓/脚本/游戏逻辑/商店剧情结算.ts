import type { SchemaType } from '../../schema';
import { 查特殊场景, type 门牌 } from '../../stageConfig';
import { 登记脚本正增长候选 } from './冷落系统';

/** 与待演事件一同保存；失败重试沿用同一票，购买不签发完成事实。 */
export function 准备商店剧情结算(data: SchemaType, 商品ID: string, 参与妻: 门牌[], 事件: string): string {
  if (data.系统._商店剧情结算?.状态 === '待演') throw new Error('已有购买剧情尚未完成。');
  const 票号 = `shop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  data.系统._商店剧情结算 = { 票号, 商品ID, 参与妻: [...new Set(参与妻)], 状态: '待演' };
  return `【商店剧情结算:${票号}】${事件}`;
}

/** 只能在有效正文成功消费队首后调用；全部变更随候选状态同一次保存。 */
export function 提交商店剧情结算(data: SchemaType, 已消费事件: string): Partial<Record<门牌, number>> {
  const 标记 = [...已消费事件.matchAll(/【商店剧情结算:([^】]+)】/gu)];
  if (!标记.length) return {}; // 旧票早已按旧规则结算，不造新凭据或重复奖励。
  const 票 = data.系统._商店剧情结算;
  if (标记.length !== 1 || !票 || 票.票号 !== 标记[0][1] || 票.状态 === '无') {
    throw new Error('购买剧情的结算凭据已经变化，本轮未结算。');
  }
  if (票.状态 === '已结算') return {};
  const 场景 = 查特殊场景(票.商品ID);
  if (!场景 || 场景.待设计 || 场景.启动?.方式 === '背包使用' || 票.参与妻.some(m => !data.户[m])) {
    throw new Error('购买剧情配置或参与人物已经变化，本轮未结算。');
  }
  const 参与妻 = [...new Set(场景.参与(data as never))];
  if (票.参与妻.length !== 参与妻.length || 票.参与妻.some(m => !参与妻.includes(m))) {
    throw new Error('购买剧情的参与人物凭据不完整，本轮未结算。');
  }
  const 基准 = Object.fromEntries(票.参与妻.map(m => [m, data.户[m]!.妻.堕落值]));
  场景.结算?.(data as never);
  const 新增堕落: Partial<Record<门牌, number>> = {};
  for (const m of 票.参与妻) {
    const 妻 = data.户[m]!.妻;
    登记脚本正增长候选(data, m, '堕落值');
    妻.堕落值 = Math.min(100, Math.max(0, 妻.堕落值 + 2));
    新增堕落[m] = 妻.堕落值 - 基准[m];
  }
  票.状态 = '已结算';
  return 新增堕落;
}
