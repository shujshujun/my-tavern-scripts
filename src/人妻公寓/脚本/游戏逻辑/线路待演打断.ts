import type { SchemaType } from '../../schema';
import { 门牌列表, type 门牌 } from '../../stageConfig';
import { 角色线路无关打断已停用 } from './丈夫线路风险策略';

type 随机打断来源 = { 类型: '丈夫' | '越洋'; 门牌: 门牌 };
const 来源标记 = /【线路随机:(丈夫|越洋):(\d{3})】/gu;

/** 只给未结算剧情事实的随机候选标记来源；撞见、起疑和旧轨道已有硬账，分别收束。 */
export function 线路随机打断标记(类型: 随机打断来源['类型'], 门牌号: 门牌): string {
  return `【线路随机:${类型}:${门牌号}】`;
}

function 识别来源(内容: string): 随机打断来源 | null {
  const 妻 = [...内容.matchAll(/【事件在场妻:([^】]+)】/gu)];
  const 夫 = [...内容.matchAll(/【事件关联夫:([^】]+)】/gu)];
  if (妻.length !== 1 || 夫.length !== 1 || 妻[0][1] !== 夫[0][1]) return null;
  const 门牌号 = 妻[0][1] as 门牌;
  if (!门牌列表.includes(门牌号) || /【事件(?:在场夫|关联妻):/u.test(内容)) return null;
  const 标记 = [...内容.matchAll(来源标记)];
  if (标记.length) {
    if (标记.length !== 1 || 标记[0][2] !== 门牌号) return null;
    const 类型 = 标记[0][1] as 随机打断来源['类型'];
    return (类型 === '越洋') === (门牌号 === '302') ? { 类型, 门牌: 门牌号 } : null;
  }
  // 旧档只识别脚本的演员绑定及紧随其后的固定业务标签，不扫描普通对白中的关键词。
  const 正文 = 内容.replace(/【场景剧情:v1:[^】]*】|【事件(?:在场妻|关联夫):[^】]+】/gu, '').trim();
  if (门牌号 === '302') return 正文.startsWith('【越洋来电】') ? { 类型: '越洋', 门牌: 门牌号 } : null;
  return /^(?:【手机亮了】|【查岗电话】|【兄弟拜托】|【亲密强制中止】【被迫收场】)/u.test(正文)
    ? { 类型: '丈夫', 门牌: 门牌号 }
    : null;
}

/** 纯投影用于开演前复核；同一结构票必须整体可识别才退出，活动事务始终保留。 */
export function 读取线路有效待发送事件(data: SchemaType): string {
  const 原 = data.系统._待发送事件;
  if (data.系统._场景剧情事务.id || data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) return 原;
  const 项 = 原.split('|').map(文 => 文.trim()).filter(Boolean);
  const 保留: string[] = [];
  let 有退出 = false;
  const 票ID = (文: string) => /【场景剧情:v1:([^:】]+):[^】]*】/u.exec(文)?.[1] ?? '';
  for (let i = 0; i < 项.length;) {
    const 起 = i++;
    const id = 票ID(项[起]);
    if (id) while (i < 项.length && 票ID(项[i]) === id) i++;
    const 组 = 项.slice(起, i);
    const 来源 = 组.map(识别来源);
    if (来源.every(项 => 项 && 角色线路无关打断已停用(data, 项.门牌))) 有退出 = true;
    else 保留.push(...组);
  }
  return 有退出 ? 保留.join('|') : 原;
}

/** 仅在调用者已有的存档提交中保存清理结果；不写历史楼、数值或当前活动事务。 */
export function 清理线路失效待演打断(data: SchemaType): boolean {
  const 当前 = 读取线路有效待发送事件(data);
  if (当前 === data.系统._待发送事件) return false;
  data.系统._待发送事件 = 当前;
  return true;
}
