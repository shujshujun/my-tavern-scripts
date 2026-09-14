import type { SchemaType } from '../../schema';

export type 剧情线ID = '家庭计划' | '第二机位' | '不再留门' | '分居' | '离婚' | '不必停' | '换掉' | '回国' | '双重继承' | '录像带' | '借种' | '静音会议';

/** 2026-09-14 用户规则：购买不占线，首次使用至线路结束独占；等待日和通讯交接也属于进行中。 */
export function 进行中的剧情线(data: SchemaType): 剧情线ID[] {
  const s = data.系统;
  const done = (ids: string[]) => ids.some(id => s._已完成特殊场景.includes(id));
  const result: 剧情线ID[] = [];
  const add = (id: 剧情线ID, stage: string, unused: string[], completed: string[] = [id]) => {
    if (stage !== '已完成' && !unused.includes(stage) && !done(completed)) result.push(id);
  };
  add('家庭计划', s._家庭计划.阶段, ['未开始']);
  add('第二机位', s._第二机位.阶段, ['未开始']);
  add('不再留门', s._不再留门.阶段, ['未开始']);
  add('分居', s._许曼君分居.阶段, ['未开始']);
  add('离婚', s._许曼君离婚.阶段, ['未开始', '已购买'], ['角色路线:201:结局剧情']);
  add('不必停', s._安若妍不必停.阶段, ['未开始', '已购买']);
  add('换掉', s._安若妍换掉.阶段, ['未开始', '已购买'], ['角色路线:301:结局剧情']);
  add('回国', s._回国.阶段, ['未开始', '待使用经营归档册']);
  add('双重继承', s._双重继承.阶段, ['未开始', '待使用双重继承']);

  const v = s._录像带V4;
  const vUsed = v.录像带已使用 || (v.入口规则版本 === 0 && v.录像带已购买 && (
    Object.values(v.赠锁).some(g => g.已接收 && g.接收绝对时段 >= 0) ||
    v.阶段 === '待购赠锁' && data.背包.includes('男用贞操带') ||
    Boolean(v.场景.场次标识 && v.场景.状态 !== '未开始')
  ));
  // 新承接完成后遗留的旧钥匙不代表另一场已启动的旧录像带。
  const modernComplete = s._第二机位.阶段 === '已完成' && s._不再留门.阶段 === '已完成';
  const legacyUsed = Boolean(s._录像带双承接.场次标识 && !['未开始', '已完成'].includes(s._录像带双承接.状态)) ||
    !modernComplete && s._特殊场景前置.some(k => k === '录像带:102' || k === '录像带:202');
  if (!done(['录像带', '录像带结局']) && v.阶段 !== '已完成' && v.场景.状态 !== '已完成' && (vUsed || legacyUsed)) result.push('录像带');
  if (!done(['借种']) && s._特殊场景前置.some(k => k === '借种:摄像头已拆' || k === '借种:断线已确认')) result.push('借种');
  const special = s._特殊场景.id;
  if (special) {
    const id = special.startsWith('录像带') ? '录像带' : special;
    if (id === '录像带' || id === '借种' || id === '静音会议') result.push(id);
  }
  return [...new Set(result)];
}

/** 仅检查新线入口。旧档已并行的线路可继续收尾，避免彼此永久锁死。无状态写入。 */
export function 剧情线使用阻断(data: SchemaType, target: 剧情线ID): string {
  const active = 进行中的剧情线(data);
  if (active.includes(target)) return '';
  return active.length ? `请先完成当前剧情线${active.map(id => `《${id}》`).join('、')}，再使用《${target}》剧情道具。道具仍保留在背包中。` : '';
}

export const 待使用承接票 = {
  家庭计划套件: '家庭计划',
  第二机位: '第二机位',
  许曼君分居: '分居',
} as const;

export function 承接票线路(id: string): 剧情线ID | undefined {
  return Object.hasOwn(待使用承接票, id) ? 待使用承接票[id as keyof typeof 待使用承接票] : undefined;
}

export function 剧情道具线路(id: string): 剧情线ID | undefined {
  const map: Record<string, 剧情线ID> = {
    ...待使用承接票, 不再留门: '不再留门', '角色路线:201:结局剧情': '离婚',
    '角色路线:301:操作性剧情': '不必停', '角色路线:301:结局剧情': '换掉',
    公寓经营归档册: '回国', 双重继承: '双重继承', 录像带: '录像带', 借种: '借种', 静音会议: '静音会议',
  };
  return Object.hasOwn(map, id) ? map[id] : undefined;
}
