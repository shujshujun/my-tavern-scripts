import type { SchemaType } from '../../schema';
import { 门牌列表, type 门牌 } from '../../stageConfig';

export type CG亲密状态 = '空闲' | '进行中' | '收尾中' | '已结束';

export interface CG亲密上下文 {
  状态: CG亲密状态;
  主焦点门牌: 门牌 | null;
  当前行为: string;
  当前接触部位: string;
  结束方式: string;
  最终位置: string;
  /** 本楼是否是旧场景空闲 → 新场景进行中的首个成功楼；只用于首楼开场图。 */
  本楼开始?: boolean;
}

function 是门牌(value: string): value is 门牌 {
  return (门牌列表 as readonly string[]).includes(value);
}

function 场景焦点(data: SchemaType): 门牌 | null {
  const 场景 = data.系统._性爱场景;
  if (是门牌(场景.主焦点门牌) && 场景.参与者[场景.主焦点门牌]?.已退出 !== true) return 场景.主焦点门牌;
  const 候选 = Object.entries(场景.参与者).find(([门牌号, 项]) => 是门牌(门牌号) && 项.已退出 !== true)?.[0];
  return 候选 && 是门牌(候选) ? 候选 : null;
}

function 首名参与者(参与者: Record<string, unknown>): 门牌 | null {
  return Object.keys(参与者).find(是门牌) ?? null;
}

function 行为接触部位(行为: string): string {
  const 部位表: Record<string, string> = {
    口交: '嘴',
    乳交: '胸部',
    阴道插入: '小屄',
    肛门插入: '屁穴',
    玩具: '其他',
    其他: '其他',
    无插入: '无',
  };
  return 部位表[行为] ?? '无';
}

/**
 * 焦点取本楼开始时的旧场景，避免多人场景在楼末自动轮换后把这一楼的图错配给下一人；
 * 行为与部位取结算后的新场景，结束信息取脚本已经确认的最终结果。
 */
export function 构造CG亲密上下文(旧值: SchemaType, 新值: SchemaType, 性爱结束: boolean): CG亲密上下文 {
  const 旧场景 = 旧值.系统._性爱场景;
  const 新场景 = 新值.系统._性爱场景;
  const 旧焦点 = 旧场景.状态 !== '空闲' ? 场景焦点(旧值) : null;
  // 正常自动轮焦仍使用本楼开始时的旧焦点；只有该角色在本楼明确独立退出时，
  // 才切到结算后仍实际参与的新焦点，避免把拒绝楼的 CG 继续画给退出者。
  const 旧焦点本楼已退出 = Boolean(旧焦点 && 新场景.参与者[旧焦点]?.已退出 === true);
  const 本楼焦点 =
    旧场景.状态 !== '空闲'
      ? 旧焦点本楼已退出
        ? 场景焦点(新值)
        : 旧焦点
      : 新场景.状态 !== '空闲'
        ? 场景焦点(新值)
        : 首名参与者(新值.系统._上次性爱结果.参与者);
  const 本楼开始 = !性爱结束 && 旧场景.状态 === '空闲' && 新场景.状态 === '进行中';
  if (性爱结束) {
    const 结果 = 新值.系统._上次性爱结果;
    const 最终行为 = 结果.当前行为 || 旧场景.当前行为;
    return {
      状态: '已结束',
      主焦点门牌: 本楼焦点,
      当前行为: 最终行为,
      当前接触部位: 行为接触部位(最终行为),
      结束方式: 结果.结束方式,
      最终位置: 结果.最终位置,
    };
  }
  if (新场景.状态 !== '空闲') {
    return {
      状态: 新场景.状态,
      主焦点门牌: 本楼焦点,
      当前行为: 新场景.当前行为,
      当前接触部位: 新场景.当前接触部位,
      结束方式: '',
      最终位置: '',
      本楼开始,
    };
  }
  return {
    状态: '空闲',
    主焦点门牌: null,
    当前行为: '无插入',
    当前接触部位: '无',
    结束方式: '',
    最终位置: '',
  };
}
