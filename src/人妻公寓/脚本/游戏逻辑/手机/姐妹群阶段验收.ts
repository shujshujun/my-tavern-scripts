import { 验收群聊隐私 } from '../手机输出安全';
import type { 微信消息 } from './数据层';
import { 户静态表, 门牌列表, type 门牌 } from '../../../stageConfig';
import { 解析姐妹群公开事实, type 姐妹群公开事实 } from './姐妹群公开事实';
import { 验收姐妹群跨线事实 } from './姐妹群已知事实';
import { 角色可知群消息 } from '../微信跨渠道见闻';
import { 解析微信AI引用前缀 } from '../微信消息引用';

/** 普通群聊继续承接已经发出的301照片；其他话题沿用其实际公开范围。 */
export function 验收姐妹群阶段消息(
  消息: string,
  孕情已公开: boolean,
  既有消息: readonly 微信消息[],
  本轮公开: Partial<姐妹群公开事实> = {},
): boolean {
  const 模式 = 孕情已公开 ? '姐妹孕情' : '姐妹';
  if (!验收姐妹群跨线事实(消息, 既有消息, 本轮公开)) return false;
  if (验收群聊隐私(消息, 模式)) return true;
  const 匹配 = /^([^:：\n]+)[:：]\s*(.+)$/u.exec(消息);
  if (!匹配) return false;
  const [, 发言人, 正文] = 匹配;
  const 已知母亲关系 = 解析姐妹群公开事实(既有消息).母亲关系已公开 || 本轮公开.母亲关系已公开 === true;
  const 玩家已提母亲关系 = 既有消息.some(
    项 =>
      项.发 === '我' &&
      项.会话 === '姐妹群' &&
      项.类 !== '撤回' &&
      /母亲|妈妈|302/u.test(项.文) &&
      /情人|恋人|伴侣|不只是母子|不是普通母子/u.test(项.文),
  );
  const 其他关系人物 = 门牌列表
    .filter(m => m !== '302')
    .flatMap(m => [户静态表[m].妻名, 户静态表[m].夫名])
    .filter(Boolean);
  const 混入本人关系 =
    发言人.trim() !== 户静态表['302'].妻名 && /我(?:和|跟|与|也|是|当)|我们(?:也|是|和|跟|与)/u.test(正文);
  if (
    (已知母亲关系 || 玩家已提母亲关系) &&
    !混入本人关系 &&
    !其他关系人物.some(名 => 正文.includes(名)) &&
    (发言人.trim() === 户静态表['302'].妻名 || /母亲|妈妈|302/u.test(正文))
  ) {
    const 仅关系谓语 = 正文.replace(/情人/gu, '伴侣');
    if (验收群聊隐私(仅关系谓语, 模式)) return true;
  }
  const 其他人物 = 门牌列表
    .filter(m => m !== '301')
    .flatMap(m => [户静态表[m].妻名, 户静态表[m].夫名])
    .filter(Boolean);
  for (const 句 of 正文.split(/[。！？；;\n]/u).filter(Boolean)) {
    if (验收群聊隐私(句, 模式)) continue;
    // 已公开照片只说明301的已见画面，不能给别人的自述或另一张照片授予相同知情。
    if (其他人物.some(姓名 => 句.includes(姓名))) return false;
    if (发言人.trim() !== 户静态表['301'].妻名 && /我(?:和|跟|与|也|的|昨晚|今晚)|我们|咱们/u.test(句)) return false;
    if (!/照片|相框|拍|镜头|那张/u.test(句)) return false;
    if (发言人.trim() !== 户静态表['301'].妻名 && !/安若妍|江辰|301|你们/u.test(句)) return false;
  }
  return 既有消息.some(项 => 项.会话 === '姐妹群' && 项.类 === '照片' && 项.键 === '301结局:换照:姐妹群照片');
}

/** 同一读口负责本人的引用与回复验收；引用原文属于历史数据，不被当成本次新增声明。 */
export function 解析姐妹群阶段回复(
  原文: string,
  成员: readonly 门牌[],
  消息: readonly 微信消息[],
  楼: number,
  时: number,
  玩家姓名: string,
  孕情已公开: boolean,
  本轮公开: Partial<姐妹群公开事实> = {},
): { 发言人: string; 正文: string; 引用?: 微信消息['引用'] } | null {
  const 匹配 = 原文.match(/^([^:：\n]{1,20})[:：]\s*(.+)$/u);
  if (!匹配) return null;
  const 发言人 = 匹配[1].trim();
  const m = 成员.find(门牌 => 户静态表[门牌].妻名 === 发言人);
  if (!m) return null;
  const 已知 = 角色可知群消息(消息, m, 楼, 时);
  const 解析 = 解析微信AI引用前缀(匹配[2], 已知, '姐妹群', 玩家姓名);
  if (!解析 || !验收姐妹群阶段消息(`${发言人}:${解析.正文}`, 孕情已公开, 已知, 本轮公开)) return null;
  return { 发言人, 正文: 解析.正文, ...(解析.引用 ? { 引用: 解析.引用 } : {}) };
}
