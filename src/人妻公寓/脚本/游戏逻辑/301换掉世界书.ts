import type { SchemaType } from '../../schema';
import { 安若妍换掉商品ID, 安若妍换掉快照提示, 读取安若妍游戏阶段 } from './安若妍换掉系统';

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
  const 阶段 = 读取安若妍游戏阶段(data);
  const 阶段说明 = `安若妍当前游戏阶段：${阶段}。`;
  if (阶段 === '未入住') return 阶段说明;
  const 结局 = data.系统._已完成特殊场景.includes(安若妍换掉商品ID);
  const 线 = data.系统._安若妍换掉;
  if (结局)
    return [
      阶段说明,
      '安若妍的《换掉》结局已经完成。安若妍与江辰对外继续保留夫妻身份，私人生活互不干涉；江辰未来到访301仍须提前通知，不恢复普通查岗或随机打断。',
      '人物资料中的初见关系与婚姻展示是过去背景，当前关系按结局后事实延续。《不必停》的首次撞见与《换掉》的采购、预约、拍照及换照流程已经收束。',
      线.最终照片素材ID
        ? `玩家已经亲手更换301客厅原相框内的照片。照片固定为拍摄时的${线.最终照片体态}版本，之后体态改变不能改写照片。`
        : '此存档仅保留旧结局完成记录，具体照片版本未记录；不得虚构拍摄细节。',
      '群内照片认知由已发送消息建立；结局完成本身不等于全群已收到照片。其他成员的经历按各自已公开记录与当前阶段承接。',
      '现在可继续301的日常生活；“和她亲密”只负责开场，后续由同一套普通亲密玩法推进。',
    ].join('\n');
  return [
    阶段说明,
    '301正式《换掉》尚未完成，客厅原相框内仍为旧结婚照；AI不能代替玩家完成换照操作。',
    阶段 === '结局筹备中' ? '《换掉》剧情票已经购买，等待玩家到301主动使用。' : '',
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
  const phase = 读取安若妍游戏阶段(data);
  const enabled = Boolean(data.户['301']);
  let targetBook = typeof getChatWorldbookName === 'function' ? getChatWorldbookName('current') : null;
  const contentSignature = (name: string | null) => `${name ?? ''}\u0000${enabled}\u0000${content}`;
  const generation = 世代;
  if (!chat || !stillValid() || typeof updateWorldbookWith !== 'function') return Promise.resolve(false);
  const serial = (请求.get(chat) ?? 0) + 1;
  请求.set(chat, serial);
  if (!force && 签名.get(chat) === contentSignature(targetBook)) return Promise.resolve(true);
  // 写入开始后，旧缓存不能证明世界书仍是旧内容；回档必须能排入一次重建。
  签名.delete(chat);
  const valid = () => stillValid() && 世代 === generation && 请求.get(chat) === serial && 聊天ID() === chat &&
    (!targetBook || typeof getChatWorldbookName !== 'function' || getChatWorldbookName('current') === targetBook);
  const work = 队列
    .catch(() => undefined)
    .then(async () => {
      if (!valid()) return false;
      const existing = typeof getChatWorldbookName === 'function' ? getChatWorldbookName('current') : null;
      if (!existing && !enabled) return true;
      if (!existing && typeof getOrCreateChatWorldbook !== 'function') return false;
      const book = existing || (await getOrCreateChatWorldbook('current'));
      targetBook = book;
      if (!book || !valid()) return false;
      await updateWorldbookWith(
        book,
        entries => {
          if (!valid()) return entries;
          const entry = entries.find(item => item.name === 换掉阶段世界书条目名);
          if (entry) {
            entry.content = content;
            entry.enabled = enabled;
            entry.strategy = { ...entry.strategy, type: 'constant' };
            entry.position = { type: 'after_character_definition', role: 'system', depth: 0, order: 103 };
            entry.probability = 100;
            entry.extra = { ...entry.extra, rqgy301换掉阶段投影版本: 2, rqgy301游戏阶段: phase };
            for (const duplicate of entries) {
              if (duplicate !== entry && duplicate.name === 换掉阶段世界书条目名) duplicate.enabled = false;
            }
          } else if (enabled) {
            entries.push({
              uid: entries.reduce((max, item) => Math.max(max, Number.isInteger(item.uid) ? item.uid : 0), 0) + 1,
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
              extra: { rqgy301换掉阶段投影版本: 2, rqgy301游戏阶段: phase },
            });
          }
          return entries;
        },
        { render: 'debounced' },
      );
      if (!valid()) return false;
      签名.set(chat, contentSignature(book));
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
