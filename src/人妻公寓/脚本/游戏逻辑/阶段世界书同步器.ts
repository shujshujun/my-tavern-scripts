/** 聊天级阶段条目的共用写入生命周期；内容与完成判据由各角色提供。 */
export interface 阶段世界书投影 {
  名称: string;
  内容: string;
  启用: boolean;
  允许建书: boolean;
  顺序: number;
  元数据?: Record<string, unknown>;
}

let 队列: Promise<unknown> = Promise.resolve();
let 序号 = 0;
let 世代 = 0;
const 请求 = new Map<string, number>();
const 缓存 = new Map<string, string>();

function 当前聊天(): string {
  try { return String(SillyTavern.getCurrentChatId?.() ?? ''); } catch { return ''; }
}
function 当前世界书(): string | null {
  return typeof getChatWorldbookName === 'function' ? getChatWorldbookName('current') : null;
}
const 请求键 = (chat: string, name: string) => JSON.stringify([chat, name]);
const 缓存键 = (chat: string, book: string | null, name: string) => JSON.stringify([chat, book, name]);
const 投影签名 = (item: 阶段世界书投影) => JSON.stringify([item.内容, item.启用, item.顺序, item.元数据]);

function 替换条目(entries: WorldbookEntry[], item: 阶段世界书投影): void {
  let entry = entries.find(value => value.name === item.名称);
  if (!entry && !item.启用) return;
  if (!entry) {
    entry = {
      uid: entries.reduce((max, value) => Math.max(max, Number.isInteger(value.uid) ? value.uid : 0), 0) + 1,
      name: item.名称, enabled: true,
      strategy: { type: 'constant', keys: [], keys_secondary: { logic: 'and_any', keys: [] }, scan_depth: 'same_as_global' },
      position: { type: 'after_character_definition', role: 'system', depth: 0, order: item.顺序 },
      content: item.内容, probability: 100,
      recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
      effect: { sticky: null, cooldown: null, delay: null }, extra: {},
    };
    entries.push(entry);
  }
  entry.content = item.内容;
  entry.enabled = item.启用;
  entry.strategy = { ...entry.strategy, type: 'constant' };
  entry.position = { type: 'after_character_definition', role: 'system', depth: 0, order: item.顺序 };
  entry.probability = 100;
  entry.extra = { ...entry.extra, ...item.元数据 };
  for (const duplicate of entries) if (duplicate !== entry && duplicate.name === item.名称) duplicate.enabled = false;
}

/** 多条角色投影一次写回；任何失败都不修改游戏完成状态。 */
export function 同步阶段世界书投影(
  projections: readonly 阶段世界书投影[],
  stillValid: () => boolean = () => true,
  force = false,
): Promise<boolean> {
  const chat = 当前聊天();
  if (!chat || !stillValid() || typeof updateWorldbookWith !== 'function') return Promise.resolve(false);
  let target: string | null;
  try { target = 当前世界书(); } catch { return Promise.resolve(false); }
  const items = projections.map(item => ({ ...item, 元数据: { ...item.元数据 } }));
  if (!target && !items.some(item => item.启用 && item.允许建书)) return Promise.resolve(true);
  if (!target && typeof getOrCreateChatWorldbook !== 'function') return Promise.resolve(false);
  const changed = items.filter(item => force || 缓存.get(缓存键(chat, target, item.名称)) !== 投影签名(item));
  if (!changed.length) return Promise.resolve(true);
  const serial = ++序号, generation = 世代;
  for (const item of changed) {
    请求.set(请求键(chat, item.名称), serial);
    // 解绑后可能重建同名世界书；在途请求会使该聊天此条目在所有旧绑定上的缓存失效。
    for (const key of 缓存.keys()) {
      const [cachedChat, , cachedName] = JSON.parse(key);
      if (cachedChat === chat && cachedName === item.名称) 缓存.delete(key);
    }
  }
  const valid = () => {
    try {
      return stillValid() && 世代 === generation && 当前聊天() === chat &&
        (!target || typeof getChatWorldbookName !== 'function' || 当前世界书() === target);
    } catch { return false; }
  };
  const own = (item: 阶段世界书投影) => 请求.get(请求键(chat, item.名称)) === serial;
  const work = 队列.catch(() => undefined).then(async () => {
    if (!valid() || !changed.some(own)) return false;
    const book = target || 当前世界书() || await getOrCreateChatWorldbook('current');
    target = book;
    if (!book || !valid()) return false;
    await updateWorldbookWith(book, entries => {
      if (!valid()) return entries;
      for (const item of changed) if (own(item)) 替换条目(entries, item);
      return entries;
    }, { render: 'debounced' });
    if (!valid()) return false;
    for (const item of changed) if (own(item)) 缓存.set(缓存键(chat, book, item.名称), 投影签名(item));
    return changed.every(own);
  }).catch(error => {
    console.warn('[人妻公寓·阶段世界书] 同步等待重试：', error);
    return false;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const current = Promise.race([
    work,
    new Promise<boolean>(resolve => {
      timer = setTimeout(() => {
        for (const item of changed) if (own(item)) 请求.delete(请求键(chat, item.名称));
        resolve(false);
      }, 4000);
    }),
  ]).finally(() => clearTimeout(timer));
  队列 = current;
  return current;
}

export function 作废阶段世界书缓存(names?: readonly string[]): void {
  if (names) {
    const selected = new Set(names);
    for (const key of 请求.keys()) if (selected.has(JSON.parse(key)[1])) 请求.delete(key);
    for (const key of 缓存.keys()) if (selected.has(JSON.parse(key)[2])) 缓存.delete(key);
    return;
  }
  世代++;
  请求.clear();
  缓存.clear();
}
