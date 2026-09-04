import { Schema, type SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 处于医院硬锁 } from './生产系统';
import { 丈夫登门需要处理 } from './丈夫登门系统';
import { 丈夫在楼, 妻位置推算, 每天时段数, 读取世界时间 } from './楼层时钟';
import { 读取201留宿可用状态, type 许曼君201留宿状态 } from './许曼君分居系统';

export interface 睡眠地点授权结果 extends 许曼君201留宿状态 {
  地点: string;
  是201留宿: boolean;
}

export interface 许曼君201留宿演出约束 {
  地点: '201';
  同场角色: ['许曼君'];
  禁止自动亲密: true;
  禁止自动数值变化: true;
  夜景: '201_留宿_夜';
  晨景: '201_留宿_晨';
}

export interface 读取201留宿上下文 {
  当前地点: string;
  当前绝对时段: number;
  当前时段名: string;
  许曼君在201: boolean;
  许曼君医院硬锁: boolean;
  赵国强在201: boolean;
  睡醒前预约冲突: boolean;
  当前强事务: boolean;
  其他丈夫登门待办: boolean;
  绑定其他地点的早餐待办: boolean;
  关系硬中止: boolean;
}

type 留宿上下文补充 = Partial<读取201留宿上下文> & { 睡醒绝对时段?: number };

/** 宿主可能传入MVU外壳。只解析现有Schema，不推断另一套分居字段，也不写回默认值。 */
function 读取存档(input: unknown): SchemaType | null {
  const 原始 = input && typeof input === 'object' && 'stat_data' in input ? input.stat_data : input;
  if (!原始 || typeof 原始 !== 'object' || Array.isArray(原始)) return null;
  const 结果 = Schema.safeParse(原始);
  return 结果.success ? 结果.data : null;
}

/** 上下文是当前真值的只读投影；调用方只能补充更严格的阻塞，不能伪造在场或取消医院锁。 */
export function 构建201留宿上下文(data: unknown, overrides: 留宿上下文补充 = {}): 读取201留宿上下文 {
  const 存档 = 读取存档(data);
  const 当前 = 存档?.系统._绝对时段 ?? 0;
  const 当前绝对时段 = overrides.当前绝对时段 ?? 当前;
  const 节点 = 存档?.户['201'];
  const 路线 = 存档?.系统._许曼君分居;
  const 次晨 = 当前绝对时段 - (当前绝对时段 % 每天时段数) + 每天时段数;
  const 睡醒 = Math.max(次晨, overrides.睡醒绝对时段 ?? 次晨);
  return {
    当前地点: overrides.当前地点 ?? '',
    当前绝对时段,
    当前时段名: 读取世界时间(当前绝对时段).时段,
    许曼君在201: Boolean(节点 && 妻位置推算('201', 当前绝对时段, 节点) === '201') && overrides.许曼君在201 !== false,
    许曼君医院硬锁: Boolean(存档 && 处于医院硬锁(存档, '201')) || overrides.许曼君医院硬锁 === true,
    赵国强在201: Boolean(节点 && 丈夫在楼(节点, '201', 当前绝对时段) !== '外出') || overrides.赵国强在201 === true,
    睡醒前预约冲突: Boolean(路线 && 路线.预约状态 === '待到期' && 路线.预约时段 >= 当前绝对时段 && 路线.预约时段 <= 睡醒) || overrides.睡醒前预约冲突 === true,
    当前强事务: Boolean(存档 && (
      存档.系统._性爱场景.状态 !== '空闲' || 存档.系统._特殊场景.id || 存档.系统._荣耀洞拍 >= 0 ||
      存档.系统._场景剧情事务.id || 存档.系统._待发送事件 || 存档.系统._父亲通话.标识 || 存档.系统._父亲通话.状态
    )) || overrides.当前强事务 === true,
    其他丈夫登门待办: Boolean(存档 && Object.keys(存档.户).some(门牌号 => 门牌号 !== '201' && 丈夫登门需要处理(存档, 门牌号 as 门牌))) || overrides.其他丈夫登门待办 === true,
    绑定其他地点的早餐待办: Boolean(存档?.系统._母亲首夜第二幕) || overrides.绑定其他地点的早餐待办 === true,
    关系硬中止: !存档 || Boolean(存档.系统._坏结局) || overrides.关系硬中止 === true,
  };
}

/** 管理员室与302沿用原有地点规则；201的基础许可始终由同一权威函数决定。 */
export function 读取睡眠地点授权(data: unknown, location: unknown, overrides: 留宿上下文补充 = {}): 睡眠地点授权结果 {
  const 地点 = String(location ?? '').trim();
  if (地点 === '管理员室' || 地点 === '302') {
    return { 地点, 是201留宿: false, 已解锁: true, 可执行: true, 原因: '' };
  }
  if (地点 !== '201') {
    return { 地点, 是201留宿: false, 已解锁: false, 可执行: false, 原因: '只能在管理员室、302或已解锁的201睡到次日早晨' };
  }
  const 存档 = 读取存档(data);
  if (!存档) return { 地点, 是201留宿: true, 已解锁: false, 可执行: false, 原因: '当前存档尚未就绪。' };
  const 上下文 = 构建201留宿上下文(存档, { ...overrides, 当前地点: 地点 });
  const 权威 = 读取201留宿可用状态(存档, 地点, 上下文.当前绝对时段);
  const 结果 = { 地点, 是201留宿: true, ...权威 };
  if (!权威.可执行) return 结果;
  const 额外阻塞 = 上下文.当前绝对时段 !== 存档.系统._绝对时段 ? '世界时间已经变化。'
    : !上下文.许曼君在201 ? '许曼君此刻不在201。'
      : 上下文.许曼君医院硬锁 ? '许曼君正在医院待产或恢复。'
        : 上下文.赵国强在201 ? '赵国强此刻正在201。'
          : 上下文.睡醒前预约冲突 ? '赵国强的取钥匙预约会在睡醒前到期。'
            : 上下文.当前强事务 ? '当前强制剧情尚未结束。'
              : 上下文.其他丈夫登门待办 ? '先处理其他丈夫的登门。'
                : 上下文.绑定其他地点的早餐待办 ? '先完成绑定其他地点的早餐剧情。'
                  : 上下文.关系硬中止 ? '当前结局或关系状态不允许留宿。' : '';
  return 额外阻塞 ? { ...结果, 可执行: false, 原因: 额外阻塞 } : 结果;
}

export function 读取201留宿演出约束(): 许曼君201留宿演出约束 {
  return { 地点: '201', 同场角色: ['许曼君'], 禁止自动亲密: true, 禁止自动数值变化: true, 夜景: '201_留宿_夜', 晨景: '201_留宿_晨' };
}

/** 睡醒后已不再是夜间，不能重跑睡前的时段门；只保留同笔已授权睡眠的地点。 */
export function 归一化睡醒地点(data: unknown, requestedLocation: unknown, existingFallback: string): string {
  if (String(requestedLocation ?? '') !== '201') return existingFallback;
  const 路线 = 读取存档(data)?.系统._许曼君分居;
  return 路线?.留宿201权限 && ['临时外住', '待离婚交接', '正式退居'].includes(路线.钥匙用途) ? '201' : existingFallback;
}

export function 读取201留宿背景语义(phase: '夜' | '晨' | string): '201_留宿_夜' | '201_留宿_晨' {
  return phase === '晨' ? '201_留宿_晨' : '201_留宿_夜';
}

export function 读取201睡眠地点提示(data: unknown, baseText = '管理员室或302'): string {
  if (!读取睡眠地点授权(data, '201').可执行 || /201/.test(baseText)) return baseText;
  const 原地点 = /管理员室\s*(?:或|\/|／|、)\s*302/;
  return 原地点.test(baseText) ? baseText.replace(原地点, '管理员室、302或201') : baseText + '，或201';
}
