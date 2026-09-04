import type { SchemaType } from '../../schema';
import { 户静态表, 查角色剧情占位, type 角色剧情占位配置 } from '../../stageConfig';
import { 阶段性癖已完成 } from './阶段性癖状态';
import { 许曼君分居已完成 } from './许曼君分居系统';
import { 安若妍不必停已完成 } from './安若妍不必停系统';

/**
 * 尚待设计的后半程路线沿用同一门槛：角色达到 L5，且唯一阶段主题已经永久完成。
 * 占位一旦可见也仍然只读，不能反向推进任何状态；夏乔的已实装路线不再经过本模块。
 */
export function 角色剧情占位已上架(data: SchemaType, id: string): boolean {
  const 占位 = 查角色剧情占位(id);
  if (!占位) return false;
  const 妻 = data.户[占位.门牌]?.妻;
  if (!妻 || 妻.当前阶段 < 5 || !阶段性癖已完成(data, 占位.门牌)) return false;
  if (占位.门牌 === '201' && 占位.类型 === '结局剧情') return 许曼君分居已完成(data);
  if (占位.门牌 === '301' && 占位.类型 === '结局剧情') return 安若妍不必停已完成(data);
  return true;
}

/** 结局占位把“操作性剧情在前”的关系直接写明，但不伪造尚不存在的完成状态。 */
export function 角色剧情占位锁定原因(id: string): string[] {
  const 占位 = 查角色剧情占位(id);
  if (!占位 || 占位.类型 === '操作性剧情') return [];
  if (占位.门牌 === '102') return ['先完成沈静仪《第二机位》，并等待周小满承接线完成后合流'];
  if (占位.门牌 === '201') return ['先完成许曼君承接线《分居》'];
  if (占位.门牌 === '301') return ['先完成安若妍承接线《不必停》'];
  return [`先完成${户静态表[占位.门牌].妻名}的操作性剧情（当前待设计）`];
}

export function 角色剧情占位购买提示(占位: 角色剧情占位配置): string {
  const 妻名 = 户静态表[占位.门牌].妻名;
  return `设计待完成：${妻名}的${占位.类型}目前只是路线占位，不会扣款、入包或启动剧情。`;
}

export function 角色剧情占位价格文案(占位: 角色剧情占位配置): string {
  return 占位.类型 === '操作性剧情' ? '操作占位' : '结局占位';
}
