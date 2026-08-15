import type { SchemaType } from '../../schema';
import { 户静态表, 查性癖, 查道具, type 门牌 } from '../../stageConfig';
import { 提交阶段性癖线路节点 } from './阶段线路系统';
import { 阶段性癖可开启, 阶段性癖已完成, 阶段性癖门牌 } from './阶段性癖状态';
import { 事件角色标记 } from './snapshotSystem';
import { 读取医院内容策略 } from './生产系统';

export interface 阶段性癖结果 {
  成功: boolean;
  提示: string;
  事件?: string;
  变动?: boolean;
}

export interface 阶段性癖开幕票 {
  门牌: 门牌;
  id: string;
  旧格式: boolean;
}

function 已有同一开幕事件(data: SchemaType, 门牌号: 门牌, id: string): boolean {
  const 待演 = `${data.系统._待发送事件}|${data.系统._已注入事件.内容}`;
  return (
    待演.includes(`【阶段性癖票:${门牌号}:${id}】`) ||
    (待演.includes(`【性癖开幕·${id}】`) && 待演.includes(`对象:${户静态表[门牌号].妻名}`))
  );
}

/**
 * 开幕入口只冻结一张强剧情票：这里不扣钱、不写永久状态、不推进线路。
 * 真正结算统一在有效助手正文成功提交时执行。
 */
export function 准备开启阶段性癖(data: SchemaType, 门牌号: 门牌): 阶段性癖结果 {
  const 妻 = data.户[门牌号]?.妻;
  const id = 户静态表[门牌号]?.招牌性癖;
  const 配 = id ? 查性癖(id) : undefined;
  if (!妻 || !配 || 配.限定户[0] !== 门牌号) return { 成功: false, 提示: '这段关系主题还不存在。' };
  if (阶段性癖已完成(data, 门牌号)) return { 成功: false, 提示: `「${id}」已经永久完成。` };
  if (已有同一开幕事件(data, 门牌号, id)) return { 成功: false, 提示: `「${id}」已经在等待演出。` };
  if (data.系统._特殊场景.id) return { 成功: false, 提示: '眼下已有一场特殊事件正在进行。' };
  if (data.系统._待发送事件) return { 成功: false, 提示: '眼下已有一桩事在发生——先把它演完。' };
  if (!阶段性癖可开启(data, 门牌号)) return { 成功: false, 提示: '她的阶段线路还没有走到这次开幕。' };
  if (!读取医院内容策略(data, 门牌号).允许普通阶段推进) {
    return { 成功: false, 提示: '她目前正在医院，阶段开幕要等出院后再继续。' };
  }
  const 价格 = 查道具(id)?.价格 ?? 0;
  if (门牌号 !== '302' && !妻._阶段性癖已支付 && data.现金 < 价格) return { 成功: false, 提示: '钱不够。' };

  const 妻名 = 户静态表[门牌号].妻名;
  return {
    成功: true,
    提示: 门牌号 === '302' ? '「哺育主题」已经开启。' : `「${id}」的阶段开幕已经开启。`,
    事件:
      `${事件角色标记({ 在场妻: [门牌号] })}【阶段性癖票:${门牌号}:${id}】【性癖开幕·${id}】对象:${妻名}。` +
      `${配.开幕}。这场戏按她的性格与你们的关系走完整幕；只有正文有效落地后才永久完成并推进线路。`,
  };
}

/** 兼容新机器票据与 v0.82 只有“名称+对象”的旧开幕事件。删除的旧通用事件返回 null。 */
export function 解析阶段性癖开幕事件(事件: string): 阶段性癖开幕票 | null {
  const 新票 = 事件.match(/【阶段性癖票:(101|102|201|202|301|302):([^】]+)】/);
  if (新票) {
    const 门牌号 = 新票[1] as 门牌;
    const id = 新票[2];
    return 户静态表[门牌号].招牌性癖 === id ? { 门牌: 门牌号, id, 旧格式: false } : null;
  }

  const id = 事件.match(/【性癖开幕·([^】]+)】/)?.[1];
  const 门牌号 = id ? 阶段性癖门牌(id) : null;
  if (!id || !门牌号 || !事件.includes(`对象:${户静态表[门牌号].妻名}`)) return null;
  return { 门牌: 门牌号, id, 旧格式: true };
}

/**
 * 有效正文成功后的唯一提交口。线路事件、付款与永久状态在同一份尚未落盘的 stat 上完成；
 * 任一前置不满足就不修改对象，重复观察已经完成的票据也不会二次扣款或推进。
 */
export function 提交阶段性癖开幕(data: SchemaType, 事件: string, _楼层: number): 阶段性癖结果 {
  const 票 = 解析阶段性癖开幕事件(事件);
  if (!票) return { 成功: false, 提示: '' };
  const 妻 = data.户[票.门牌]?.妻;
  if (!妻) return { 成功: false, 提示: '角色状态不存在，阶段开幕未提交。' };
  if (阶段性癖已完成(data, 票.门牌)) return { 成功: true, 提示: '', 变动: false };
  if (!阶段性癖可开启(data, 票.门牌)) return { 成功: false, 提示: '阶段线路已经变化，开幕未提交。' };

  const 价格 = 查道具(票.id)?.价格 ?? 0;
  const 需要付款 = 票.门牌 !== '302' && !妻._阶段性癖已支付;
  if (需要付款 && data.现金 < 价格) return { 成功: false, 提示: '现金状态已变化，开幕未提交。' };

  const 线路消息 = 提交阶段性癖线路节点(data, 票.门牌, 票.id);
  if (!线路消息.length) return { 成功: false, 提示: '阶段节点未接受这次开幕，永久状态未写入。' };

  if (需要付款) data.现金 -= 价格;
  妻.阶段性癖 = 票.id;
  妻._阶段性癖已支付 = false;
  return {
    成功: true,
    提示: `「${票.id}」已经永久完成。${线路消息.length ? `\n${线路消息.join('\n')}` : ''}`,
    变动: true,
  };
}
