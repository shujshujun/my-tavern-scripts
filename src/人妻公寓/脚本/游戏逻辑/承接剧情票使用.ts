import type { SchemaType } from '../../schema';
import { 家庭计划已上架 } from './家庭计划系统';
import { 第二机位可开启 } from './第二机位系统';
import { 许曼君分居可开启 } from './许曼君分居系统';
import { 有场景剧情阻塞 } from './场景剧情事务';
import { 玩家当前日 } from './玩家资源系统';
import { 承接票线路, 剧情线使用阻断 } from './剧情线使用门';

/** 购买与开始分离；由安全操作提交，失败不扣钱、不消耗票、不推进阶段。 */
export function 使用承接剧情票(data: SchemaType, item: string): { 成功: boolean; 提示: string; 变动?: boolean } {
  const target = 承接票线路(item);
  if (!target || !data.背包.includes(item)) return { 成功: false, 提示: '背包中没有这张可用的剧情票。' };
  const gate = 剧情线使用阻断(data, target);
  if (gate) return { 成功: false, 提示: gate };
  if (data.系统._坏结局 || 有场景剧情阻塞(data) || data.系统._性爱场景.状态 !== '空闲' || data.系统._父亲通话.状态 || data.系统._父亲通话.标识) {
    return { 成功: false, 提示: '请先结束当前现场或电话，再使用剧情票。' };
  }
  if (item === '家庭计划套件') {
    if (!家庭计划已上架(data) || data.系统._家庭计划.阶段 !== '未开始') return { 成功: false, 提示: '家庭计划已开始、已完成或尚未解锁。' };
    data.系统._家庭计划.阶段 = '待安装';
    data.系统._家庭计划.最早继续日 = 玩家当前日(data);
  } else if (item === '第二机位') {
    if (!第二机位可开启(data)) return { 成功: false, 提示: '第二机位已开始、已完成或前置条件已经变化。' };
    data.系统._第二机位.阶段 = '待门缝';
    data.系统._第二机位.最早继续日 = 玩家当前日(data);
    data.背包.splice(data.背包.indexOf(item), 1);
  } else if (item === '许曼君分居') {
    if (!许曼君分居可开启(data)) return { 成功: false, 提示: '分居已开始、已完成或前置条件已经变化。' };
    data.系统._许曼君分居.阶段 = '待初谈';
    data.系统._许曼君分居.最早继续时段 = data.系统._绝对时段;
    data.系统._许曼君分居.初谈参与方式 = '未决定';
    data.背包.splice(data.背包.indexOf(item), 1);
  }
  return { 成功: true, 变动: true, 提示: `《${target}》已开启，请按线路进展前往对应地点继续。` };
}
