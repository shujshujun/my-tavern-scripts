import type { SchemaType } from '../../schema';
import {
  判定CG动作,
  判定亲密场景CG阶段,
  type CG回合信号,
  type 亲密场景CG阶段,
} from '../../脚本/游戏逻辑/成人CG系统';
import {
  借种完成收尾事实有效,
  借种结局已完成,
  是借种受孕场次,
} from '../../脚本/游戏逻辑/借种结局状态';

export interface 借种CG帧 {
  文件: string;
  标题: string;
  保留夏乔?: boolean;
}

export interface 借种CG选择结果 {
  接管: boolean;
  帧: 借种CG帧[];
}

function 当前借种来源(data: SchemaType, 信号: CG回合信号): string {
  // 场内信号只认当前场次。当前场次已经是普通亲密时，绝不能回退到“上一次借种结果”。
  if (信号.亲密?.状态 !== '已结束') return data.系统._性爱场景.场次标识;
  return data.系统._上次性爱结果.场次标识;
}

function 是借种亲密信号(data: SchemaType, 信号: CG回合信号): boolean {
  return 信号.门牌 === '101' && 是借种受孕场次(当前借种来源(data, 信号));
}

function 阶段帧(data: SchemaType, 阶段: 亲密场景CG阶段, 信号: CG回合信号): 借种CG帧[] {
  if (阶段 === 'aftermath') {
    if (!借种结局已完成(data) || !借种完成收尾事实有效(data.系统._上次性爱结果)) return [];
    return [
      { 文件: '借种_成人_确定受孕收尾', 标题: '借种结局 · 确定受孕收尾' },
      { 文件: '借种_成人_事后照料', 标题: '借种结局 · 事后照料' },
      { 文件: '借种_成人_回到客厅', 标题: '借种结局 · 回到三人约定的生活' },
    ];
  }
  const 动作 = 判定CG动作(信号, 阶段);
  // 专属“正面交合”经过素材审核，语义只允许无保护阴道性交；肛交和玩具必须交回通用精确图库。
  if (阶段 === 'active') {
    return 动作 === 'penis_vaginal' ? [{ 文件: '借种_成人_正面交合', 标题: '借种结局 · 进行中' }] : [];
  }
  // 专属前戏图实际是胸前爱抚／泛前戏，不能冒充口交、乳交、玩具或束缚等明确动作。
  if (阶段 === 'deep_foreplay') {
    return 动作 === 'other_foreplay' ? [{ 文件: '借种_成人_前戏', 标题: '借种结局 · 前戏' }] : [];
  }
  if (阶段 === 'light_contact') return [{ 文件: '借种_成人_主动接受', 标题: '借种结局 · 主动接受' }];
  if (信号.亲密?.本楼开始) return [{ 文件: '借种_成人_正式入室', 标题: '借种结局 · 正式入室' }];
  return [{ 文件: '借种_成人_主动接受', 标题: '借种结局 · 主动接受' }];
}

/**
 * 借种关键帧优先使用自己的连续本地 CG；纯对话楼保持接管以沿用上一张专属图。
 * 明确但专属素材不匹配的行为则交回通用精确图库，避免用阴道／胸前画面冒充肛交、口交或玩具。
 */
export function 选择借种CG序列(data: SchemaType | null | undefined, 信号: CG回合信号): 借种CG选择结果 {
  if (!data || !是借种亲密信号(data, 信号)) return { 接管: false, 帧: [] };
  const 阶段 = 判定亲密场景CG阶段(信号);
  if (!阶段) return { 接管: true, 帧: [] };
  const 帧 = 阶段帧(data, 阶段, 信号);
  return { 接管: 帧.length > 0, 帧 };
}
