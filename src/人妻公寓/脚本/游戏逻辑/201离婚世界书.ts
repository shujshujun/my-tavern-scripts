import type { SchemaType } from '../../schema';
import { 许曼君离婚已完成 } from './许曼君离婚系统';

export const 离婚阶段世界书条目名 = '[人妻公寓]201婚姻与生活阶段' as const;

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

function 关系边界(data: SchemaType): string {
  const relation = data.系统._许曼君分居.玩家最终关系选择;
  if (relation === '继续关系') {
    return [
      '《分居》中玩家明确选择继续关系。这个选择不会抹掉许曼君对201、钱和自己生活的判断，她也不会因离婚变成依附玩家的人。',
      '完整结局后，玩家可在201使用“和她亲密”选择由自己或由她先开场；开场后仍由既有普通亲密系统接管。',
    ].join('\n');
  }
  if (relation === '暂不承诺') {
    return [
      '《分居》中双方真实选择是“暂不承诺”：关系与亲密许可只服从已经成立的事实，不能把陪伴、日常或一次亲密自动升级为长期独占、正式同居或永久承诺。',
      '完整结局后可以使用201的“和她亲密”入口，但这块入口本身不签发独占关系。',
    ].join('\n');
  }
  if (relation === '退出关系') {
    return [
      '《分居》中玩家明确选择退出关系。完整离婚不会恢复恋爱、留宿或身体亲密；双方只保留201住户与管理员所需的现实往来。',
      '201不开放“和她亲密”，普通正文和手机也不得用离婚完成事实把私人关系写回来。',
    ].join('\n');
  }
  return [
    '这是只有旧完成ID、但关系选择未记录的兼容存档。不得假定玩家与许曼君仍有亲密、留宿、独占或长期承诺。',
    '在关系真值缺失时不开放结局后亲密入口，也不作任何私人关系推断。',
  ].join('\n');
}

function 结局前内容(data: SchemaType): string {
  const separated = data.系统._许曼君分居.阶段 !== '未开始';
  if (!separated) {
    return [
      '当前聊天尚未完成许曼君的正式离婚；她与赵国强的法律婚姻仍然存在。',
      '许曼君、赵国强、201钥匙、居住安排和玩家关系只服从当前剧情已经成立的事实，不得提前套用《分居》完成或正式离婚后的生活。',
    ].join('\n');
  }
  const separationComplete = data.系统._许曼君分居.阶段 === '已完成';
  if (separationComplete) {
    return [
      '当前聊天的《分居》已经完成：赵国强真实外住，工资卡已经归还，他已完成唯一一次个人物品取回；许曼君拒绝恢复共同生活，双方同意进入正式办理。',
      '201的同一枚住户钥匙位于管理员室201钥匙格，用途是“待离婚交接”。赵国强不得按普通丈夫作息回201，也不得重演第一次摊牌、取物或钥匙封存。',
      '法律婚姻尚未解除，不能写成已经领取离婚证、已经正式离婚或已经完成《离婚》终幕。',
      关系边界(data),
    ].join('\n');
  }
  return [
    '当前聊天处于分居过渡，正在推进《分居》；正式离婚尚未完成，法律婚姻仍然存在。',
    '赵国强是否已经外住、是否取完物品、钥匙位于何处以及玩家作出的关系选择，只服从当前stat_data；不得跳过未完成的硬步骤，也不得提前宣布正式离婚。',
  ].join('\n');
}

function 法律离婚待终幕内容(data: SchemaType): string {
  const route = data.系统._许曼君离婚;
  const residence = route.赵国强正式退居
    ? '赵国强已经正式退居，不再拥有201普通丈夫居住权。'
    : '赵国强的最终退居与旧钥匙归档只服从当前已完成步骤，不得恢复普通同住。';
  const lock = route.换锁完成
    ? '201已经更换新锁芯，许曼君继续独立居住。'
    : '201是否已经归档旧钥匙、领取新锁并完成换锁，只服从当前硬状态。';
  return [
    '当前聊天中，许曼君与赵国强的法律离婚已经成立；不得再说“尚未离婚”、恢复法律夫妻状态或让赵国强以丈夫身份查岗。',
    residence,
    lock,
    '完整结局尚未完成：不能提前签发整个《离婚》完成、重演《最后一笔》的结果或把尚未完成的私密收束当作公开事实。',
    关系边界(data),
  ].join('\n');
}

function 完整完成内容(data: SchemaType): string {
  const route = data.系统._许曼君离婚;
  const roomFact =
    route.完成分支 === '旧档未记录' || route.旧钥匙状态 === '旧档未记录' || route.新锁芯位置 === '旧档未记录'
      ? '201继续由许曼君按自己的生活规则使用；这份兼容旧档没有记录具体门锁与物件交接过程，不得替它补写细节。'
      : '201已经完成旧钥匙归档与换锁，由许曼君按自己的生活规则长期使用；普通正文不得重演《分居》四幕、办理流程或《最后一笔》。';
  return [
    '当前聊天的完整《离婚》已经完成。许曼君与赵国强的法律婚姻已经解除，赵国强永久正式退居，不再拥有201普通丈夫居住权，也不会恢复普通作息、查岗、打断或第一次对质。',
    roomFact,
    '离婚后的新生活可以表现她重新安排201、钱和自己的需要，但不能把私密终幕物件、具体成人结果或未公开关系自动传播给赵国强、姐妹群或公开朋友圈。',
    关系边界(data),
  ].join('\n');
}

export function 构造201离婚阶段世界书内容(data: SchemaType): string {
  if (许曼君离婚已完成(data)) return 完整完成内容(data);
  if (data.系统._许曼君离婚.法律离婚已成立) return 法律离婚待终幕内容(data);
  return 结局前内容(data);
}

function 世界书条目模板(content: string, uid: number): WorldbookEntry {
  return {
    uid,
    name: 离婚阶段世界书条目名,
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
      order: 102,
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
    extra: { rqgy201离婚阶段投影版本: 1 },
  };
}

function 应建立聊天世界书(data: SchemaType): boolean {
  return (
    data.系统._许曼君分居.阶段 !== '未开始' ||
    data.系统._许曼君离婚.阶段 !== '未开始' ||
    data.系统._许曼君离婚.法律离婚已成立 ||
    许曼君离婚已完成(data)
  );
}

/**
 * 只更新当前聊天绑定世界书。stat_data始终是唯一真值；同步失败不会回滚法律、钥匙、换锁、
 * 关系或结局状态，下一个启动、有效回合、时间变化或切聊同步点会按当前真值重试。
 */
export function 同步201离婚阶段世界书(
  data: SchemaType,
  stillValid: () => boolean = () => true,
  force = false,
): Promise<boolean> {
  const chatId = 当前聊天标识();
  const content = 构造201离婚阶段世界书内容(data);
  const signature = [
    data.系统._许曼君分居.阶段,
    data.系统._许曼君分居.玩家最终关系选择,
    data.系统._许曼君分居.钥匙用途,
    data.系统._许曼君离婚.阶段,
    data.系统._许曼君离婚.法律离婚已成立,
    data.系统._许曼君离婚.赵国强正式退居,
    data.系统._许曼君离婚.旧钥匙状态,
    data.系统._许曼君离婚.换锁完成,
    许曼君离婚已完成(data),
    content,
  ].join('|');
  if (!chatId || !stillValid()) return Promise.resolve(false);
  if (!force && 已同步签名.get(chatId) === signature) return Promise.resolve(true);
  if (typeof updateWorldbookWith !== 'function') return Promise.resolve(false);

  const existingBook = typeof getChatWorldbookName === 'function' ? getChatWorldbookName('current') : null;
  if (!existingBook && !应建立聊天世界书(data)) return Promise.resolve(true);
  if (!existingBook && typeof getOrCreateChatWorldbook !== 'function') return Promise.resolve(false);

  const current = 世界书同步队列
    .catch(() => undefined)
    .then(async () => {
      if (!stillValid() || 当前聊天标识() !== chatId) return false;
      const bookName = existingBook || (await getOrCreateChatWorldbook('current'));
      if (!bookName || !stillValid() || 当前聊天标识() !== chatId) return false;
      await updateWorldbookWith(
        bookName,
        entries => {
          if (!stillValid() || 当前聊天标识() !== chatId) return entries;
          const index = entries.findIndex(entry => entry.name === 离婚阶段世界书条目名);
          if (index >= 0) {
            entries[index] = {
              ...entries[index],
              enabled: true,
              strategy: { ...entries[index].strategy, type: 'constant' },
              content,
              probability: 100,
              extra: { ...(entries[index].extra ?? {}), rqgy201离婚阶段投影版本: 1 },
            };
          } else {
            const maxUid = entries.reduce((max, entry) => Math.max(max, Number.isInteger(entry.uid) ? entry.uid : 0), 0);
            entries.push(世界书条目模板(content, maxUid + 1));
          }
          return entries;
        },
        { render: 'debounced' },
      );
      if (!stillValid() || 当前聊天标识() !== chatId) return false;
      已同步签名.set(chatId, signature);
      return true;
    })
    .catch(error => {
      console.warn('[人妻公寓·201离婚] 当前聊天世界书同步失败（不影响游戏真值，下个同步点重试）:', error);
      return false;
    });
  世界书同步队列 = current;
  return current;
}

export function 作废201离婚阶段世界书同步缓存(): void {
  已同步签名.clear();
}

/** 兼容此前已写测试与局部调用；生产入口统一使用带“阶段”的权威命名。 */
export const 构造201离婚世界书内容 = 构造201离婚阶段世界书内容;
export const 同步201离婚世界书 = 同步201离婚阶段世界书;
export const 作废201离婚世界书同步缓存 = 作废201离婚阶段世界书同步缓存;
