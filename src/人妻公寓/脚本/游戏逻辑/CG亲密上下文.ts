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
}

function 是门牌(value: string): value is 门牌 {
  return (门牌列表 as readonly string[]).includes(value);
}

function 场景焦点(data: SchemaType): 门牌 | null {
  const 场景 = data.系统._性爱场景;
  if (是门牌(场景.主焦点门牌)) return 场景.主焦点门牌;
  return Object.keys(场景.参与者).find(是门牌) ?? null;
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
  const 本楼焦点 =
    旧场景.状态 !== '空闲'
      ? 场景焦点(旧值)
      : 新场景.状态 !== '空闲'
        ? 首名参与者(新场景.参与者)
        : 首名参与者(新值.系统._上次性爱结果.参与者);
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
