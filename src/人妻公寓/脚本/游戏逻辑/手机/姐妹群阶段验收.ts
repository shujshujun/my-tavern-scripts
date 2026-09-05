import { 验收群聊隐私 } from '../手机输出安全';
import { 验收换照群公开事实 } from './安若妍换照姐妹群';
import type { 微信消息 } from './数据层';
import { 户静态表, 门牌列表 } from '../../../stageConfig';

/** 普通群聊继续承接已经发出的301照片；其他话题沿用其实际公开范围。 */
export function 验收姐妹群阶段消息(
  消息: string,
  孕情已公开: boolean,
  既有消息: readonly 微信消息[],
): boolean {
  const 模式 = 孕情已公开 ? '姐妹孕情' : '姐妹';
  if (验收群聊隐私(消息, 模式)) return true;
  const 匹配 = /^([^:：\n]+)[:：]\s*(.+)$/u.exec(消息);
  if (!匹配) return false;
  const [, 发言人, 正文] = 匹配;
  const 其他人物 = 门牌列表.filter(m => m !== '301').flatMap(m => [户静态表[m].妻名, 户静态表[m].夫名]).filter(Boolean);
  for (const 句 of 正文.split(/[。！？；;\n]/u).filter(Boolean)) {
    if (验收群聊隐私(句, 模式)) continue;
    // 已公开照片只说明301的已见画面，不能给别人的自述或另一张照片授予相同知情。
    if (其他人物.some(姓名 => 句.includes(姓名))) return false;
    if (发言人.trim() !== 户静态表['301'].妻名 && /我(?:和|跟|与|也|的|昨晚|今晚)|我们|咱们/u.test(句)) return false;
    if (!/照片|相框|拍|镜头|那张/u.test(句)) return false;
    if (发言人.trim() !== 户静态表['301'].妻名 && !/安若妍|江辰|301|你们/u.test(句)) return false;
  }
  return 验收换照群公开事实(消息, 既有消息);
}
