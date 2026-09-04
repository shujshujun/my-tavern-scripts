import type { SchemaType } from '../../schema';
import { 安若妍换掉商品ID, 安若妍换掉快照提示 } from './安若妍换掉系统';

export const 换掉阶段世界书条目名 = '[人妻公寓]301婚姻与照片阶段';
let 队列: Promise<unknown> = Promise.resolve();
let 世代 = 0;
const 签名 = new Map<string, string>();
const 请求 = new Map<string, number>();
function 聊天ID(): string {
  try {
    return String(SillyTavern.getCurrentChatId?.() ?? '');
  } catch {
    return '';
  }
}
export function 构造301换掉阶段世界书内容(data: SchemaType): string {
  const 结局 = data.系统._已完成特殊场景.includes(安若妍换掉商品ID);
  const 线 = data.系统._安若妍换掉;
  if (结局)
    return [
      '安若妍的《换掉》结局已经完成。安若妍与江辰对外继续保留夫妻身份，私人生活互不干涉；江辰未来到访301仍须提前通知，不恢复普通查岗或随机打断。',
      线.最终照片素材ID
        ? `玩家已经亲手更换301客厅原相框内的照片。照片固定为拍摄时的${线.最终照片体态}版本，之后体态改变不能改写照片。`
        : '此存档仅保留旧结局完成记录，具体照片版本未记录；不得虚构拍摄细节。',
      '群成员只能知道已真实发送到姐妹群的照片消息；结局完成本身不等于全群已收到照片，也不允许公开其他成员的私密事实。',
    ].join('\n');
  return [
    '301正式《换掉》尚未完成，客厅原相框内仍为旧结婚照；AI不能代替玩家完成换照操作。',
    安若妍换掉快照提示(data),
    data.系统._安若妍不必停.江辰已接受互不干涉
      ? '《不必停》已确立互不干涉与提前通知；不得重演首次对质。'
      : '婚姻边界只服从当前真实剧情进度。',
  ]
    .filter(Boolean)
    .join('\n');
}
export function 同步301换掉阶段世界书(
  data: SchemaType,
  stillValid: () => boolean = () => true,
  force = false,
): Promise<boolean> {
  const chat = 聊天ID();
  const content = 构造301换掉阶段世界书内容(data);
  const generation = 世代;
  if (!chat || !stillValid() || typeof updateWorldbookWith !== 'function') return Promise.resolve(false);
  const serial = (请求.get(chat) ?? 0) + 1;
  请求.set(chat, serial);
  if (!force && 签名.get(chat) === content) return Promise.resolve(true);
  // 写入开始后，旧缓存不能证明世界书仍是旧内容；回档必须能排入一次重建。
  签名.delete(chat);
  const valid = () => stillValid() && 世代 === generation && 请求.get(chat) === serial && 聊天ID() === chat;
  const work = 队列
    .catch(() => undefined)
    .then(async () => {
      if (!valid()) return false;
      const existing = typeof getChatWorldbookName === 'function' ? getChatWorldbookName('current') : null;
      if (!existing && data.系统._安若妍换掉.阶段 === '未开始' && !data.户['301']) return true;
      if (!existing && typeof getOrCreateChatWorldbook !== 'function') return false;
      const book = existing || (await getOrCreateChatWorldbook('current'));
      if (!book || !valid()) return false;
      await updateWorldbookWith(
        book,
        entries => {
          if (!valid()) return entries;
          const entry = entries.find(item => item.name === 换掉阶段世界书条目名);
          if (entry) {
            entry.content = content;
            entry.enabled = true;
            entry.strategy.type = 'constant';
            entry.probability = 100;
          } else {
            entries.push({
              uid: entries.reduce((max, item) => Math.max(max, item.uid), 0) + 1,
              name: 换掉阶段世界书条目名,
              enabled: true,
              strategy: {
                type: 'constant',
                keys: [],
                keys_secondary: { logic: 'and_any', keys: [] },
                scan_depth: 'same_as_global',
              },
              position: { type: 'after_character_definition', role: 'system', depth: 0, order: 103 },
              content,
              probability: 100,
              recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
              effect: { sticky: null, cooldown: null, delay: null },
              extra: { rqgy301换掉阶段投影版本: 1 },
            });
          }
          return entries;
        },
        { render: 'debounced' },
      );
      if (!valid()) return false;
      签名.set(chat, content);
      return true;
    })
    .catch(error => {
      console.warn('[人妻公寓·301] 阶段世界书等待重试：', error);
      return false;
    });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const current = Promise.race([
    work,
    new Promise<boolean>(resolve => {
      timer = setTimeout(() => {
        if (valid()) 请求.set(chat, serial + 1);
        resolve(false);
      }, 4000);
    }),
  ]).finally(() => clearTimeout(timer));
  队列 = current;
  return current;
}
export function 作废301换掉阶段世界书同步缓存(): void {
  世代++;
  签名.clear();
  请求.clear();
}
