import type { SchemaType } from '../../schema';

/** 空字符串表示酒馆楼道；null 只用于“旧记录无法可靠确认原场景”。 */
export type 场景剧情目标 = string | null;

export interface 场景剧情元数据 {
  id: string;
  标题: string;
  目标场景: string;
}

export interface 队首场景剧情 {
  id: string;
  标题: string;
  目标场景: 场景剧情目标;
  内容: string;
  剩余: string;
  项数: number;
  总项数: number;
  已结构化: boolean;
}

export interface 激活场景剧情参数 {
  标题?: string;
  目标场景: string | null | undefined;
  行动: string;
  触发楼层: number;
  内容?: string;
}

export type 场景剧情事务 = SchemaType['系统']['_场景剧情事务'];

export interface 场景剧情状态视图 {
  活动: boolean;
  id: string;
  标题: string;
  目标场景: 场景剧情目标;
  状态: string;
  /** 多拍对话的后续票必须由玩家输入真实回应，不能用通用占位动作代替。 */
  需要玩家回应: boolean;
  队列剩余数: number;
  可在当前场景开始: (当前场景: string | null | undefined) => boolean;
}

const 场景剧情标记正则 = /【场景剧情:v1:([^:】]*):([^:】]*):([^】]*)】/;
const 场景剧情标记全局正则 = /【场景剧情:v1:[^】]*】/g;
const 内部标签正则 =
  /^(?:场景剧情:v1:|场景剧情约束|事件(?:在场妻|在场夫|关联妻|关联夫):|阶段线路(?:演出|剧情):|阶段性癖票:|关系线路强制演出|节点0连续性承接|本轮剧情事件)/;

/**
 * 镜像 `入住触发门.ts` 的稳定机器契约，但保持本纯函数模块没有运行时依赖。
 * 只有唯一入住标记与唯一合法妻门牌同时存在才算入住预约；普通对白中的“新住户”不匹配。
 */
function 是入住登场文本(事件: string): boolean {
  const text = String(事件 ?? '');
  if (!text) return false;
  const 新住户标记数 = text.match(/【新住户】/g)?.length ?? 0;
  const 母亲标记数 = text.match(/【那扇门】/g)?.length ?? 0;
  if (新住户标记数 + 母亲标记数 !== 1) return false;

  const 妻标记组 = [...text.matchAll(/【事件在场妻:([\d,]+)】/g)];
  if (妻标记组.length !== 1) return false;
  const 妻门牌 = 妻标记组[0][1].split(',').filter(Boolean);
  if (妻门牌.length !== 1) return false;

  if (母亲标记数 === 1) return 妻门牌[0] === '302';
  return 新住户标记数 === 1 && /^(?:201|202|301)$/.test(妻门牌[0]);
}

export const 场景剧情楼道 = '';

export function 读取待发送事件队列(value: unknown): string[] {
  return String(value ?? '')
    .split('|')
    .map(item => item.trim())
    .filter(Boolean);
}

export function 拼接待发送事件队列(items: readonly string[]): string {
  return items
    .map(item => String(item ?? '').trim())
    .filter(Boolean)
    .join('|');
}

/**
 * 从业务候选里扣除操作开始前已经存在的等待票，只留下本次结算新产生的导演事件。
 * 兼容生产者“尾部追加”“头部插入”和“整串替换”三种旧写法；旧队列始终由调用者
 * 单独保留，不能因为某个生产者赋值 `_待发送事件` 就把远处预约静默覆盖。
 */
export function 提取新增待发送事件(旧队列: unknown, 候选队列: unknown): string {
  const 旧项 = 读取待发送事件队列(旧队列);
  const 候选项 = 读取待发送事件队列(候选队列);
  if (!旧项.length) return 拼接待发送事件队列(候选项);
  const 待扣计数 = new Map<string, number>();
  for (const item of 旧项) 待扣计数.set(item, (待扣计数.get(item) ?? 0) + 1);
  const 新增: string[] = [];
  for (const item of 候选项) {
    const 尚需扣除 = 待扣计数.get(item) ?? 0;
    if (尚需扣除 > 0) {
      待扣计数.set(item, 尚需扣除 - 1);
      continue;
    }
    新增.push(item);
  }
  return 拼接待发送事件队列(新增);
}

function 安全解码(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

function 编码(value: string): string {
  return encodeURIComponent(String(value ?? ''));
}

export function 规范场景剧情目标(value: string | null | undefined): string {
  return typeof value === 'string' ? value : '';
}

export function 场景剧情目标匹配(目标场景: string, 当前场景: string | null | undefined): boolean {
  return 目标场景 === 规范场景剧情目标(当前场景);
}

/** 未知旧档必须先人工认领；已到设计地点的等待票必须先处理；远处等待票不打断当前互动。 */
export function 等待场景剧情阻塞当前场景(
  waiting: 队首场景剧情 | null | undefined,
  当前场景: string | null | undefined,
): boolean {
  return Boolean(waiting && (waiting.目标场景 === null || 场景剧情目标匹配(waiting.目标场景, 当前场景)));
}

/**
 * 前台生成所有权的统一判定。普通活动票、已到场等待票、专用特殊场景与荣耀洞都属于
 * 强剧情；手机和数据库后台 AI 必须让路。远处等待票不占当前前台，避免长期冻结日常内容。
 */
export function 场景剧情占用前台生成(data: SchemaType | null | undefined, 当前场景: string | null | undefined): boolean {
  if (!data) return false;
  if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0) return true;
  const 活动 = 读取活动场景剧情(data);
  const 等待 = 读取队首场景剧情(data.系统._待发送事件);
  return Boolean(活动 || 等待场景剧情阻塞当前场景(等待, 当前场景));
}

export function 场景剧情目标显示名(目标场景: 场景剧情目标): string {
  if (目标场景 === null) return '原触发场景';
  return 目标场景 || '楼道';
}

export function 构造场景剧情标记(meta: 场景剧情元数据): string {
  return `【场景剧情:v1:${编码(meta.id)}:${编码(meta.目标场景)}:${编码(meta.标题)}】`;
}

export function 解析场景剧情元数据(item: string): 场景剧情元数据 | null {
  const match = String(item ?? '').match(场景剧情标记正则);
  if (!match) return null;
  const id = 安全解码(match[1]).trim();
  const 目标场景 = 安全解码(match[2]);
  const 标题 = 安全解码(match[3]).trim();
  if (!id || !标题) return null;
  return { id, 标题, 目标场景 };
}

export function 清除场景剧情机器标记(text: string): string {
  return String(text ?? '').replace(场景剧情标记全局正则, '');
}

export function 清除场景剧情内部标签(text: string): string {
  return 清除场景剧情机器标记(text)
    .replace(/【事件(?:在场妻|在场夫|关联妻|关联夫):[\d,]+】/g, '')
    .replace(/【阶段线路(?:演出|剧情):[^】]+】/g, '')
    .replace(/【阶段性癖票:[^】]+】/g, '');
}

/** 多拍对话后续票的显式语义；丈夫登门第 2/3 拍属于真实玩家回应。 */
export function 场景剧情需要玩家回应(content: string): boolean {
  const text = String(content ?? '');
  return /【场景剧情需回应】/.test(text) || /【丈夫登门:\d{3}:[^:】]+:(?:2|3)】/.test(text);
}

function 标签显示名(raw: string): string {
  const tag = raw.trim();
  if (tag === '上一动作·送礼回响') return '送礼后的回应';
  if (tag === '翻垃圾的收获') return '翻垃圾的收获';
  if (tag === '心照不宣') return '读完拼合线索';
  if (tag === '首穿') return '第一次试穿';
  if (tag === '破墙') return '关系转折';
  if (tag === '转折正戏') return '关系阶段转折';
  if (tag === '早饭桌') return '第二天的早饭';
  if (tag === '药物首夜') return '这一夜的转折';
  if (tag === '门缝那一眼') return '门缝外的撞见';
  if (tag === '哑巴亏') return '丈夫察觉异样';
  if (tag.startsWith('丈夫登门:')) return '丈夫登门';
  if (tag.startsWith('特殊场景·')) return tag.replace(/^特殊场景·/, '特殊剧情：');
  if (tag.startsWith('性癖开幕·')) return tag.replace(/^性癖开幕·/, '阶段主题：');
  if (tag.startsWith('新住户')) return '新住户搬入';
  if (tag === '那扇门') return '一次寻常照面';
  return tag.replace(/[:：].*$/, '').trim() || '一段剧情';
}

/** 只返回玩家可理解的标题，任何角色绑定、票据和线路编码都不能泄漏到界面。 */
export function 场景剧情可见标题(content: string, fallback = '一段待完成剧情'): string {
  const structured = 解析场景剧情元数据(content);
  if (structured?.标题) return structured.标题;

  const tags = [...清除场景剧情机器标记(content).matchAll(/【([^】]+)】/g)].map(match => match[1]);
  const visible = tags.find(tag => !内部标签正则.test(tag));
  if (visible) return 标签显示名(visible);

  const 线路 = String(content ?? '').match(/【阶段线路(?:演出|剧情):(\d{3}):\d+:\d+:([^:】]*):([^】]*)】/);
  if (线路) {
    const 类型 = 安全解码(线路[2]);
    const 标识 = 安全解码(线路[3]);
    const 动作 =
      类型 === '调查' && 标识 === '翻垃圾'
        ? '垃圾房发现'
        : 类型 === '调查'
          ? '调查发现'
          : 类型 === '对饮'
            ? '酒后谈话'
            : 类型 === '送礼'
              ? '送礼后的变化'
              : 类型 === '时段经过'
                ? '时段变化'
                : 类型 === '运作'
                  ? '安排产生变化'
                  : '关系进展';
    return `${线路[1]}室关系剧情：${动作}`;
  }
  return fallback;
}

/**
 * 旧档没有场景元数据时只对证据充分的事件恢复目标；其余返回 null，绝不猜房间。
 */
export function 推断旧场景剧情目标(content: string): 场景剧情目标 {
  const meta = 解析场景剧情元数据(content);
  if (meta) return meta.目标场景;
  const text = String(content ?? '');
  if (/【翻垃圾的收获】/.test(text) || /阶段线路(?:演出|剧情):[^】]*翻垃圾/.test(text)) return '垃圾房';
  if (/【早饭桌】/.test(text)) {
    if (/地点始终是302/.test(text)) return '302';
    if (/地点始终是管理员室/.test(text)) return '管理员室';
  }
  if (/【药物首夜】/.test(text)) return '302';
  if (/【家庭计划专属监控】/.test(text)) return '管理员室';
  if (/【特殊场景·录像带/.test(text)) return '洗手间';
  return null;
}

/** 同一事务产生的连续多条导演指令属于一场；后续事务只能排队，绝不能一楼混演。 */
export function 读取队首场景剧情(value: unknown): 队首场景剧情 | null {
  const items = 读取待发送事件队列(value);
  if (!items.length) return null;
  const firstMeta = 解析场景剧情元数据(items[0]);
  let count = 1;
  if (firstMeta) {
    while (count < items.length && 解析场景剧情元数据(items[count])?.id === firstMeta.id) count += 1;
  }
  const headItems = items.slice(0, count);
  const content = 拼接待发送事件队列(headItems);
  return {
    id: firstMeta?.id ?? '',
    标题: firstMeta?.标题 ?? 场景剧情可见标题(content),
    目标场景: firstMeta?.目标场景 ?? 推断旧场景剧情目标(content),
    内容: content,
    剩余: 拼接待发送事件队列(items.slice(count)),
    项数: count,
    总项数: items.length,
    已结构化: Boolean(firstMeta),
  };
}

export function 包装场景剧情内容(content: string, meta: 场景剧情元数据): string {
  const marker = 构造场景剧情标记(meta);
  const items = 读取待发送事件队列(content);
  const source = items.length ? items : ['【场景行动】请在当前地点完整演出本次行动与人物回应，不得转场。'];
  const 场景名 = meta.目标场景 || '楼道';
  const 约束 = `【场景剧情约束】本轮地点固定在「${场景名}」，只能演出这张剧情票；不得转场，不得混入后续排队剧情。`;
  return 拼接待发送事件队列(
    source.map((item, index) => {
      const existing = 解析场景剧情元数据(item);
      if (existing?.id === meta.id) return item;
      return `${marker}${index === 0 ? 约束 : ''}${清除场景剧情机器标记(item)}`;
    }),
  );
}

function 独立连场活动中(data: SchemaType): boolean {
  return Boolean(data.系统._特殊场景?.id) || (data.系统._荣耀洞拍 ?? -1) >= 0;
}

function 两套场景状态重叠(data: SchemaType): boolean {
  return 独立连场活动中(data) && Boolean(data.系统._场景剧情事务.id);
}

export function 读取活动场景剧情(data: SchemaType | null | undefined): 场景剧情事务 | null {
  if (!data) return null;
  // 录像带、静音会议与荣耀洞有自己的地点、拍次、失败与重试状态机。开发期旧档可能
  // 曾把同一导演拍再包成普通票；专用状态机优先，普通读口不得让两套锁互相卡死。
  // 写入口与一致性校验不能依赖本读口，必须先检查原始事务 ID，拒绝制造新的重叠。
  if (独立连场活动中(data)) return null;
  return data.系统._场景剧情事务.id ? data.系统._场景剧情事务 : null;
}

export function 场景剧情事务活动中(data: SchemaType): boolean {
  return Boolean(读取活动场景剧情(data));
}

/** 只判断普通场景票；特殊场景启动器在“筹备态”复核时使用，避免把自己视为阻塞源。 */
export function 有普通场景剧情阻塞(data: SchemaType): boolean {
  return Boolean(data.系统._场景剧情事务.id) || Boolean(读取队首场景剧情(data.系统._待发送事件));
}

/**
 * 通用业务与回合后随机事件使用的总阻塞门。普通票、专用特殊场景与荣耀洞任一存在时，
 * 都不得再预约入住、丈夫打断、撞见等另一段剧情；否则专用场景下一拍会被普通事件抢占队首。
 */
export function 场景剧情占用中(data: SchemaType): boolean {
  return 独立连场活动中(data) || 有普通场景剧情阻塞(data);
}

export const 有场景剧情阻塞 = 场景剧情占用中;

export function 清空场景剧情事务(data: SchemaType): void {
  data.系统._场景剧情事务 = {
    id: '',
    标题: '',
    目标场景: '',
    行动: '',
    内容: '',
    触发绝对时段: -1,
    触发楼层: -1,
    请求世代: 0,
    状态: '',
  };
}

function 下一个场景剧情ID(data: SchemaType): string {
  data.系统._场景剧情序号 += 1;
  const random = Math.random().toString(36).slice(2, 9);
  return `RQSC-${data.系统._绝对时段}-${data.系统._场景剧情序号}-${Date.now().toString(36)}-${random}`;
}

function 建立事务(
  data: SchemaType,
  meta: 场景剧情元数据,
  content: string,
  行动: string,
  触发楼层: number,
  请求世代 = 1,
): 场景剧情事务 {
  data.系统._场景剧情事务 = {
    id: meta.id,
    标题: meta.标题,
    目标场景: meta.目标场景,
    行动,
    内容: content,
    触发绝对时段: data.系统._绝对时段,
    触发楼层,
    请求世代,
    状态: '生成中',
  };
  return data.系统._场景剧情事务;
}

/**
 * 把本次已经完成业务结算的导演事件原子绑定到触发地点。调用者必须把业务状态和票据
 * 一起写入；生成失败只重试这张票，不得重新执行原业务。
 */
export function 激活新增场景剧情(
  data: SchemaType,
  参数: 激活场景剧情参数,
): { 成功: true; 事务: 场景剧情事务 } | { 成功: false; 提示: string } {
  if (独立连场活动中(data)) {
    return { 成功: false, 提示: '当前独立连场尚未结束，不能同时建立普通场景剧情。' };
  }
  const existingQueue = 拼接待发送事件队列(读取待发送事件队列(data.系统._待发送事件));
  const existing = 读取队首场景剧情(existingQueue);
  if (场景剧情事务活动中(data)) {
    const 标题 = data.系统._场景剧情事务.标题 || '当前剧情';
    return { 成功: false, 提示: `「${标题}」尚未完成，不能再建立另一段场景剧情。` };
  }
  const target = 规范场景剧情目标(参数.目标场景);
  // 当前地点已经有一张待演票（或旧档地点未知）时必须先处理它；目标在别处的预约则
  // 原样保留在队尾，不得反向阻止玩家完成眼前主动触发的垃圾、送礼、读信等剧情。
  if (existing && (existing.目标场景 === null || 场景剧情目标匹配(existing.目标场景, target))) {
    return { 成功: false, 提示: `「${existing.标题}」尚未完成，不能再建立另一段场景剧情。` };
  }
  const rawContent = String(参数.内容 ?? '').trim();
  const title = String(参数.标题 ?? '').trim() || 场景剧情可见标题(rawContent, '当前场景剧情');
  const meta = { id: 下一个场景剧情ID(data), 标题: title, 目标场景: target };
  const content = 包装场景剧情内容(
    rawContent || `【场景行动】${参数.行动}。请在当前地点完整演出这次行动及人物回应，不得转场。`,
    meta,
  );
  // 活动票必须成为唯一队首；远处等待票仍按原顺序留在后面，成功只消费当前事务。
  data.系统._待发送事件 = 拼接待发送事件队列([content, existingQueue]);
  return { 成功: true, 事务: 建立事务(data, meta, content, 参数.行动, 参数.触发楼层) };
}

/** 队首等待事件抵达目标地点后建立唯一活动事务。 */
export function 激活队首场景剧情(
  data: SchemaType,
  当前场景: string | null | undefined,
  行动: string,
  触发楼层: number,
  允许未知目标 = false,
): { 成功: true; 事务: 场景剧情事务 } | { 成功: false; 提示: string } {
  if (独立连场活动中(data)) {
    return { 成功: false, 提示: '当前独立连场尚未结束，不能同时激活普通场景剧情。' };
  }
  if (场景剧情事务活动中(data)) {
    const txn = data.系统._场景剧情事务;
    if (!场景剧情目标匹配(txn.目标场景, 当前场景)) {
      return { 成功: false, 提示: `「${txn.标题}」必须回到原场景后才能继续。` };
    }
    return { 成功: true, 事务: txn };
  }

  const head = 读取队首场景剧情(data.系统._待发送事件);
  if (!head) return { 成功: false, 提示: '当前没有等待演出的场景剧情。' };
  const current = 规范场景剧情目标(当前场景);
  if (head.目标场景 !== null && head.目标场景 !== current) {
    return { 成功: false, 提示: `「${head.标题}」应在原定场景发生，当前地点不对。` };
  }
  if (head.目标场景 === null && !允许未知目标) {
    return { 成功: false, 提示: `旧记录「${head.标题}」缺少可靠的原场景信息，不能在这里擅自改演。` };
  }

  const target = head.目标场景 ?? current;
  const id = head.id || 下一个场景剧情ID(data);
  const meta = { id, 标题: head.标题, 目标场景: target };
  const content = head.已结构化 ? head.内容 : 包装场景剧情内容(head.内容, meta);
  if (!head.已结构化) data.系统._待发送事件 = 拼接待发送事件队列([content, head.剩余]);
  return { 成功: true, 事务: 建立事务(data, meta, content, 行动, 触发楼层) };
}

export type 场景剧情队首恢复结果 = '无活动' | '一致' | '已恢复' | '不可恢复';

function 队首匹配活动事务(head: 队首场景剧情 | null, active: 场景剧情事务): boolean {
  return Boolean(head && head.内容 === active.内容 && (!head.id || head.id === active.id));
}

/**
 * 旧版本若在首次生成失败后又排入后续强剧情，活动事务对应的结构票可能仍完整存在于队列
 * 中段。只在“事务 ID 相同、整组内容逐字相同、且唯一命中”时把该组移回队首；其余积压票
 * 原顺序保留。正文遗失、重复副本或 ID 冲突一律拒绝猜测，不删除任何票。
 */
export function 恢复活动场景剧情队首(data: SchemaType): 场景剧情队首恢复结果 {
  const active = 读取活动场景剧情(data);
  if (!active) return '无活动';
  const items = 读取待发送事件队列(data.系统._待发送事件);
  const head = 读取队首场景剧情(拼接待发送事件队列(items));
  if (队首匹配活动事务(head, active)) return '一致';

  const 候选: Array<{ 起: number; 止: number }> = [];
  for (let 起 = 0; 起 < items.length; 起 += 1) {
    const meta = 解析场景剧情元数据(items[起]);
    if (meta?.id !== active.id) continue;
    if (起 > 0 && 解析场景剧情元数据(items[起 - 1])?.id === active.id) continue;
    let 止 = 起 + 1;
    while (止 < items.length && 解析场景剧情元数据(items[止])?.id === active.id) 止 += 1;
    if (拼接待发送事件队列(items.slice(起, 止)) === active.内容) 候选.push({ 起, 止 });
  }
  if (候选.length !== 1) return '不可恢复';

  const [{ 起, 止 }] = 候选;
  const 活动组 = items.slice(起, 止);
  const 其余 = [...items.slice(0, 起), ...items.slice(止)];
  data.系统._待发送事件 = 拼接待发送事件队列([...活动组, ...其余]);
  return 队首匹配活动事务(读取队首场景剧情(data.系统._待发送事件), active) ? '已恢复' : '不可恢复';
}

export function 准备重试场景剧情(
  data: SchemaType,
  当前场景: string | null | undefined,
): { 成功: true; 事务: 场景剧情事务 } | { 成功: false; 提示: string } {
  if (独立连场活动中(data)) {
    return { 成功: false, 提示: '当前独立连场尚未结束，普通场景剧情不能同时重试。' };
  }
  const txn = data.系统._场景剧情事务;
  if (!txn.id) return { 成功: false, 提示: '当前没有需要重试的场景剧情。' };
  if (!场景剧情目标匹配(txn.目标场景, 当前场景)) {
    return { 成功: false, 提示: `「${txn.标题}」必须回到原场景后才能继续。` };
  }
  let head = 读取队首场景剧情(data.系统._待发送事件);
  if (!队首匹配活动事务(head, txn) && 恢复活动场景剧情队首(data) === '已恢复') {
    head = 读取队首场景剧情(data.系统._待发送事件);
  }
  if (!head || head.内容 !== txn.内容 || (head.id && head.id !== txn.id)) {
    return { 成功: false, 提示: '场景剧情票据与待演内容已经不一致，已停止自动重试以免串戏。' };
  }
  txn.请求世代 += 1;
  txn.状态 = '生成中';
  return { 成功: true, 事务: txn };
}

export function 标记场景剧情待重试(data: SchemaType, 事务ID: string, 预期请求世代?: number): boolean {
  const txn = data.系统._场景剧情事务;
  if (!txn.id || txn.id !== 事务ID) return false;
  if (预期请求世代 !== undefined && txn.请求世代 !== 预期请求世代) return false;
  txn.状态 = '待重试';
  return true;
}

/** 无普通活动事务的专用状态机／旧兼容路径只消费当前队首，不影响后续等待票。 */
export function 消费队首场景剧情(data: SchemaType, 已提交内容: string): boolean {
  const head = 读取队首场景剧情(data.系统._待发送事件);
  if (!head || head.内容 !== 已提交内容) return false;
  data.系统._待发送事件 = head.剩余;
  // 专用状态机已经成功消费当前拍时，清理开发期可能遗留的重复普通票。
  if ((data.系统._特殊场景?.id || (data.系统._荣耀洞拍 ?? -1) >= 0) && data.系统._场景剧情事务.id) {
    清空场景剧情事务(data);
  }
  return true;
}

/** 成功正文只消费当前队首事务，后续等待事件原样保留。 */
export function 提交场景剧情成功(
  data: SchemaType,
  已提交内容: string,
  预期事务ID = '',
  预期请求世代?: number,
): boolean {
  const 当前队列 = 拼接待发送事件队列(读取待发送事件队列(data.系统._待发送事件));
  const head = 读取队首场景剧情(当前队列);
  if (!head) return false;
  const txn = data.系统._场景剧情事务;
  // 独立特殊场景沿用旧的“整批固定导演事件”语义，不建立普通场景事务；完整匹配时整批消费。
  if (!预期事务ID && !txn.id && 当前队列 === 已提交内容) {
    data.系统._待发送事件 = '';
    return true;
  }
  if (head.内容 !== 已提交内容) return false;
  if (预期事务ID) {
    if (!txn.id || txn.id !== 预期事务ID) return false;
    if (head.id && head.id !== txn.id) return false;
    if (预期请求世代 !== undefined && txn.请求世代 !== 预期请求世代) return false;
  } else if (txn.id && head.id && txn.id !== head.id) {
    return false;
  }
  if (!消费队首场景剧情(data, 已提交内容)) return false;
  if (!txn.id || !预期事务ID || txn.id === 预期事务ID) 清空场景剧情事务(data);
  return true;
}

/**
 * 一轮正文结算可能在队列尾部产生下一段强剧情。只给“本轮新追加且尚无元数据”的项
 * 绑定当前场景；旧队列、已结构化项与明确跳过的跨场事件保持原样。
 */
export function 绑定新增待发送事件到场景(
  data: SchemaType,
  旧队列: string,
  当前场景: string | null | undefined,
  跳过: (item: string) => boolean = () => false,
): number {
  if (场景剧情事务活动中(data)) return 0;
  const before = 读取待发送事件队列(旧队列);
  const current = 读取待发送事件队列(data.系统._待发送事件);
  if (current.length < before.length || before.some((item, index) => current[index] !== item)) {
    if (before.length) {
      throw new Error('强制剧情生产者覆盖了尚未完成的等待票，本轮已停止提交以免丢剧情。');
    }
    return 0;
  }
  const target = 规范场景剧情目标(当前场景);
  let changed = 0;
  const tail = current.slice(before.length).map(item => {
    if (解析场景剧情元数据(item) || 跳过(item)) return item;
    const meta = { id: 下一个场景剧情ID(data), 标题: 场景剧情可见标题(item), 目标场景: target };
    changed += 1;
    return 包装场景剧情内容(item, meta);
  });
  if (!tail.length) return changed;

  // 旧队首若正在等待别处，当前回合刚产生的本地硬剧情不能被它长期饿死；把明确属于
  // 当前场景的新票放到旧等待票之前。跨场/专用入住票仍保持原有相对顺序。
  const localTail = tail.filter(item => 解析场景剧情元数据(item)?.目标场景 === target && !跳过(item));
  const otherTail = tail.filter(item => !localTail.includes(item));
  const next = before.length && localTail.length ? [...localTail, ...before, ...otherTail] : [...before, ...tail];
  if (changed || next.some((item, index) => item !== current[index])) {
    data.系统._待发送事件 = 拼接待发送事件队列(next);
  }
  return changed;
}

/** 排入尚未激活的场景票；它只有到目标地点成为队首后才能开始。 */
export function 追加等待场景剧情(
  data: SchemaType,
  content: string,
  目标场景: string | null | undefined,
  标题 = '',
  优先于已有等待 = false,
): { id: string; 内容: string; 标题: string; 目标场景: string } {
  const raw = String(content ?? '').trim();
  const target = 规范场景剧情目标(目标场景);
  const visibleTitle = String(标题 ?? '').trim() || 场景剧情可见标题(raw);
  const meta = { id: 下一个场景剧情ID(data), 标题: visibleTitle, 目标场景: target };
  const wrapped = 包装场景剧情内容(raw, meta);
  data.系统._待发送事件 = 优先于已有等待
    ? 拼接待发送事件队列([wrapped, data.系统._待发送事件])
    : 拼接待发送事件队列([data.系统._待发送事件, wrapped]);
  return { id: meta.id, 内容: wrapped, 标题: visibleTitle, 目标场景: target };
}

export function 读取场景剧情状态(data: SchemaType): 场景剧情状态视图 | null {
  const active = 读取活动场景剧情(data);
  // 静音会议、录像带、荣耀洞等已有独立状态机和界面锁；不得再套一层普通场景事务 UI。
  if (!active && (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0)) return null;
  if (active) {
    const head = 读取队首场景剧情(data.系统._待发送事件);
    return {
      活动: true,
      id: active.id,
      标题: active.标题,
      目标场景: active.目标场景,
      状态: active.状态 || '待重试',
      需要玩家回应: false,
      队列剩余数: Math.max(0, (head?.总项数 ?? 1) - (head?.项数 ?? 1)),
      可在当前场景开始: 当前场景 => 场景剧情目标匹配(active.目标场景, 当前场景),
    };
  }
  if (data.系统._特殊场景?.id || (data.系统._荣耀洞拍 ?? -1) >= 0) return null;
  const head = 读取队首场景剧情(data.系统._待发送事件);
  if (!head) return null;
  return {
    活动: false,
    id: head.id,
    标题: head.标题,
    目标场景: head.目标场景,
    状态: '等待到场',
    需要玩家回应: 场景剧情需要玩家回应(head.内容),
    队列剩余数: Math.max(0, head.总项数 - head.项数),
    可在当前场景开始: 当前场景 => head.目标场景 !== null && 场景剧情目标匹配(head.目标场景, 当前场景),
  };
}

export function 描述场景剧情事件(value: unknown): string {
  let remaining = 拼接待发送事件队列(读取待发送事件队列(value));
  const titles: string[] = [];
  while (remaining) {
    const head = 读取队首场景剧情(remaining);
    if (!head) break;
    if (!titles.includes(head.标题)) titles.push(head.标题);
    remaining = head.剩余;
  }
  return titles.join('、');
}

export function 场景剧情锁定提示(data: SchemaType): string {
  const active = 读取活动场景剧情(data);
  return active
    ? `正在触发「${active.标题}」。当前场景已锁定为${场景剧情目标显示名(active.目标场景)}；生成失败后请原地重试。`
    : '';
}

/**
 * 兼容仍经 `脚本写入` 统一收口的旧生产者。它不猜旧档地点；只有调用者显式提供场景时
 * 才会把尚未结构化的新 pending 绑定到该场景。
 */
export function 同步场景剧情事务(
  data: SchemaType,
  选项: {
    当前场景?: string | null;
    当前楼层?: number;
    标题?: string;
    来源?: string;
  } = {},
): void {
  if (两套场景状态重叠(data)) {
    throw new Error('普通场景剧情与独立连场两套状态机混演，已拒绝写回。');
  }
  const active = 读取活动场景剧情(data);
  if (!active && 独立连场活动中(data)) return;
  let head = 读取队首场景剧情(data.系统._待发送事件);
  if (active) {
    if (!head) {
      // 普通活动票还在但正文队首丢失，说明并发覆盖或存档损坏。无关写入不能静默清票，
      // 否则玩家会看到“业务已结算、剧情却假装完成”。
      throw new Error('活动场景剧情仍在，但待发送正文已经丢失；不能静默解锁，已拒绝写回。');
    }
    if (!队首匹配活动事务(head, active) && 恢复活动场景剧情队首(data) === '已恢复') {
      head = 读取队首场景剧情(data.系统._待发送事件);
    }
    if (!队首匹配活动事务(head, active)) {
      throw new Error('活动场景剧情与待发送队首不一致，已拒绝写回以免串戏。');
    }
    return;
  }
  if (!head || 选项.当前场景 === undefined) return;
  const target = 规范场景剧情目标(选项.当前场景);
  const items = 读取待发送事件队列(data.系统._待发送事件);
  let changed = false;
  const wrapped = items.map(item => {
    if (解析场景剧情元数据(item) || 是入住登场文本(item)) return item;
    const meta = {
      id: 下一个场景剧情ID(data),
      标题: String(选项.标题 ?? '').trim() || 场景剧情可见标题(item),
      目标场景: target,
    };
    changed = true;
    return 包装场景剧情内容(item, meta);
  });
  if (changed) data.系统._待发送事件 = 拼接待发送事件队列(wrapped);
}

export function 校验场景剧情位置(
  data: SchemaType,
  当前场景: string | null | undefined,
): { 成功: true } | { 成功: false; 提示: string } {
  if (两套场景状态重叠(data)) {
    return { 成功: false, 提示: '普通场景剧情与独立连场状态发生重叠，已停止生成以免串戏。' };
  }
  const active = 读取活动场景剧情(data);
  if (!active || 场景剧情目标匹配(active.目标场景, 当前场景)) return { 成功: true };
  return {
    成功: false,
    提示: `「${active.标题}」必须在${场景剧情目标显示名(active.目标场景)}继续，不能换到当前地点改演。`,
  };
}

/** 旧调用兼容：只校验活动事务是否与本楼冻结内容一致，不在此处重复消费。 */
export function 完成场景剧情事务(data: SchemaType, 本楼事件: string): boolean {
  const active = 读取活动场景剧情(data);
  return !active || active.内容 === 本楼事件;
}

export function 登记场景剧情事务(
  data: SchemaType,
  参数: { 事件: string; 场景?: string | null; 标题?: string; 来源?: string; 触发楼层?: number; 行动?: string },
): { 成功: true; 事务: 场景剧情事务 } | { 成功: false; 提示: string } {
  return 激活新增场景剧情(data, {
    内容: 参数.事件,
    目标场景: 参数.场景,
    标题: 参数.标题,
    行动: 参数.行动 ?? `（在${场景剧情目标显示名(规范场景剧情目标(参数.场景))}完成当前剧情）`,
    触发楼层: 参数.触发楼层 ?? -1,
  });
}

export function 合并同场景剧情事件(...items: Array<string | null | undefined>): string {
  const 唯一项: string[] = [];
  for (const item of items.flatMap(item => 读取待发送事件队列(item))) {
    if (!唯一项.includes(item)) 唯一项.push(item);
  }
  return 拼接待发送事件队列(唯一项);
}
