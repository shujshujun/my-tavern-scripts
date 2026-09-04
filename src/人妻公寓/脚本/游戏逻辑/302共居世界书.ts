import type { SchemaType } from '../../schema';

export const 共居阶段世界书条目名 = '[人妻公寓]当前管理与302生活阶段' as const;

let 世界书同步队列: Promise<unknown> = Promise.resolve();
const 已同步签名 = new Map<string, string>();

function 当前聊天标识(): string {
  try {
    const st = SillyTavern as unknown as { getCurrentChatId?: () => string | number | null };
    const id = st.getCurrentChatId?.();
    return id === null || id === undefined ? '' : String(id);
  } catch {
    return '';
  }
}

function 双重继承完成(data: SchemaType): boolean {
  return data.系统._双重继承.阶段 === '已完成' || data.系统._已完成特殊场景.includes('双重继承');
}

export function 构造302阶段世界书内容(data: SchemaType): string {
  if (双重继承完成(data)) {
    return [
      '当前聊天已经完成《双重继承》。',
      '玩家是梧桐里7号唯一实际管理员；父亲已经退出楼务审核，在海外生活，只保留低频家常联系。普通经营问题不能重新变成等待父亲批准、最后通牒或收楼。',
      '母亲以自己的意愿继续留在302，与玩家进入稳定共同生活。她仍是玩家的母亲，也有自己的时间、审美、需要、判断与拒绝权；关系事实不会因一时情绪退回结局前。',
      '父亲始终不知道玩家与母亲的隐秘关系。检查、交权、三日早餐、机场视频和总钥匙收束已经封存，不得作为当前场景继续演出。',
      '结局后的302只保留“和她亲密”这一块核心入口；玩家选择由自己开始或让母亲开始，开场后立即复用既有普通亲密场景。已废弃的日常操作菜单不得恢复，也不得把一次开场写成整场自动播放。',
    ].join('\n');
  }

  const 交接中 = data.系统._回国.阶段 !== '未开始' || data.系统._双重继承.阶段 !== '未开始';
  return 交接中
    ? [
        '当前聊天仍处于母亲线的经营确认或正式交接阶段。',
        '父亲是否已经到楼、暂住、离楼或退出审核，只服从当前剧情中已经成立的事实；不得提前宣布《双重继承》完成。',
        '母亲与玩家的关系只服从当前剧情进度，不得提前套用结局后的稳定共居生活。',
      ].join('\n')
    : [
        '当前聊天尚未完成《双重继承》。父亲仍保留公寓管理审核权，具体电话、楼务与通牒只服从当前剧情中已经成立的事实。',
        '302仍处于当前剧情阶段；母亲与玩家的关系不得提前写成结局后的稳定共居。',
      ].join('\n');
}

function 世界书条目模板(content: string, uid: number): WorldbookEntry {
  return {
    uid,
    name: 共居阶段世界书条目名,
    enabled: true,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      role: 'system',
      depth: 0,
      order: 101,
    },
    content,
    probability: 100,
    recursion: {
      prevent_incoming: true,
      prevent_outgoing: true,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
    extra: { rqgy302阶段投影版本: 1 },
  };
}

/**
 * 只更新当前聊天绑定的世界书，不修改角色卡主世界书。它是可重建派生：失败不回滚结局，
 * 下一次启动、切聊、回档或有效回合会按当前stat再次同步。
 */
export function 同步302阶段世界书(
  data: SchemaType,
  仍有效: () => boolean = () => true,
  强制 = false,
): Promise<boolean> {
  const 聊天标识 = 当前聊天标识();
  const 内容 = 构造302阶段世界书内容(data);
  const 签名 = `${data.系统._双重继承.阶段}|${data.系统._回国.阶段}|${内容}`;
  if (!聊天标识 || !仍有效()) return Promise.resolve(false);
  if (!强制 && 已同步签名.get(聊天标识) === 签名) return Promise.resolve(true);
  if (typeof updateWorldbookWith !== 'function') return Promise.resolve(false);
  const 应建立聊天世界书 =
    双重继承完成(data) || data.系统._回国.阶段 !== '未开始' || data.系统._双重继承.阶段 !== '未开始';
  const 已有聊天世界书 = typeof getChatWorldbookName === 'function' ? getChatWorldbookName('current') : null;
  // 全新聊天尚未进入母亲线时，静态世界书的阶段中性事实已经足够；不为一条“尚未开始”投影制造空世界书。
  if (!已有聊天世界书 && !应建立聊天世界书) return Promise.resolve(true);
  if (!已有聊天世界书 && typeof getOrCreateChatWorldbook !== 'function') return Promise.resolve(false);

  const 本次 = 世界书同步队列
    .catch(() => undefined)
    .then(async () => {
      if (!仍有效() || 当前聊天标识() !== 聊天标识) return false;
      const 世界书名 = 已有聊天世界书 || (await getOrCreateChatWorldbook('current'));
      if (!世界书名 || !仍有效() || 当前聊天标识() !== 聊天标识) return false;
      await updateWorldbookWith(
        世界书名,
        条目们 => {
          if (!仍有效() || 当前聊天标识() !== 聊天标识) return 条目们;
          const 索引 = 条目们.findIndex(条目 => 条目.name === 共居阶段世界书条目名);
          if (索引 >= 0) {
            条目们[索引] = {
              ...条目们[索引],
              enabled: true,
              strategy: { ...条目们[索引].strategy, type: 'constant' },
              content: 内容,
              probability: 100,
              extra: { ...(条目们[索引].extra ?? {}), rqgy302阶段投影版本: 1 },
            };
          } else {
            const 最大uid = 条目们.reduce((最大, 条目) => Math.max(最大, Number.isInteger(条目.uid) ? 条目.uid : 0), 0);
            条目们.push(世界书条目模板(内容, 最大uid + 1));
          }
          return 条目们;
        },
        { render: 'debounced' },
      );
      if (!仍有效() || 当前聊天标识() !== 聊天标识) return false;
      已同步签名.set(聊天标识, 签名);
      return true;
    })
    .catch(error => {
      console.warn('[人妻公寓·302共居] 当前聊天世界书同步失败（不影响游戏真值，下个同步点重试）:', error);
      return false;
    });
  世界书同步队列 = 本次;
  return 本次;
}

export function 作废302阶段世界书同步缓存(): void {
  已同步签名.clear();
}
