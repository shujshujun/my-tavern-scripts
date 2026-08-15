import type { SchemaType } from '../../schema';
import { 夏乔借种占位ID, 户静态表, 查角色剧情占位, type 角色剧情占位配置 } from '../../stageConfig';
import { 阶段性癖已完成 } from './阶段性癖状态';

export { 夏乔借种占位ID };

/**
 * 夏乔的“借种”只在家庭计划完成后出现；其余路线沿用同一后半程门槛：角色达到 L5，
 * 且唯一阶段主题已经永久完成。占位一旦可见也仍然只读，不能反向推进任何状态。
 */
export function 角色剧情占位已上架(data: SchemaType, id: string): boolean {
  const 占位 = 查角色剧情占位(id);
  if (!占位) return false;
  if (占位.id === 夏乔借种占位ID) return data.系统._家庭计划.阶段 === '已完成';
  const 妻 = data.户[占位.门牌]?.妻;
  return !!妻 && 妻.当前阶段 >= 5 && 阶段性癖已完成(data, 占位.门牌);
}

/** 结局占位把“操作性剧情在前”的关系直接写明，但不伪造尚不存在的完成状态。 */
export function 角色剧情占位锁定原因(id: string): string[] {
  const 占位 = 查角色剧情占位(id);
  if (!占位 || 占位.id === 夏乔借种占位ID || 占位.类型 === '操作性剧情') return [];
  return [`先完成${户静态表[占位.门牌].妻名}的操作性剧情（当前待设计）`];
}

export function 角色剧情占位购买提示(占位: 角色剧情占位配置): string {
  const 妻名 = 户静态表[占位.门牌].妻名;
  return `设计待完成：${妻名}的${占位.类型}目前只是路线占位，不会扣款、入包或启动剧情。`;
}

export function 角色剧情占位价格文案(占位: 角色剧情占位配置): string {
  return 占位.类型 === '操作性剧情' ? '操作占位' : '结局占位';
}
