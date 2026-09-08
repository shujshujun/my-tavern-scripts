import type { SchemaType } from '../../schema';
import { 户静态表, 门牌列表, 道具表, 特殊场景表 } from '../../stageConfig';
import { 静音会议角色结局已完成 } from '../../静音会议配置';
import { 通关评级列表, type 通关成绩, type 通关评级 } from '../../通关纪念存档';
import { 场景剧情占用前台生成, 场景剧情连续锁场, 读取队首场景剧情 } from './场景剧情事务';

export const 通关等待时段 = 2;
export const 通关探索门槛 = { SS: 40, SSS: 80 } as const;
const 服饰ID = new Set(
  Object.values(道具表)
    .filter(项 => 项.类别 === '服饰')
    .map(项 => 项.id),
);
const 特殊剧情ID = new Set([
  ...Object.values(特殊场景表)
    .filter(项 => !项.待设计)
    .map(项 => 项.id),
  '回国',
  '录像带结局',
  '角色路线:102:操作性剧情',
  '角色路线:202:操作性剧情',
  '角色路线:201:操作性剧情',
  '角色路线:301:操作性剧情',
  '角色路线:201:结局剧情',
  '角色路线:301:结局剧情',
]);
const 结局名称 = { '101': '借种', '102': '录像带', '201': '离婚', '202': '录像带', '301': '换掉', '302': '双重继承' };

export function 通关角色结果(data: SchemaType): 通关成绩['角色'] {
  return 门牌列表.map(门牌 => {
    const 完成 =
      Boolean(data.户[门牌]) &&
      (门牌 === '302'
        ? data.系统._双重继承.阶段 === '已完成' || data.系统._已完成特殊场景.includes('双重继承')
        : 静音会议角色结局已完成(data, 门牌));
    let 归宿 = '';
    if (完成) {
      if (门牌 === '101') 归宿 = '家庭计划走到了结局，新的日常已经开始。';
      if (门牌 === '102' || 门牌 === '202') 归宿 = '共同完成《录像带》，各自的生活从此翻开新页。';
      if (门牌 === '201') {
        const 选择 = data.系统._许曼君分居.玩家最终关系选择;
        归宿 =
          选择 === '继续关系'
            ? '告别旧婚姻之后，她选择与你继续这段关系。'
            : 选择 === '退出关系'
              ? '旧婚姻与这段关系都已告别，她开始自己的生活。'
              : 选择 === '暂不承诺'
                ? '旧婚姻已经结束，你们把未来留给时间。'
                : '离婚已经完成，她开始了新的生活。';
      }
      if (门牌 === '301') 归宿 = '新的照片已经换上，她亲手确定了此后的关系。';
      if (门牌 === '302') 归宿 = '交接与托付已经完成，302迎来了共同生活的新篇章。';
    }
    return {
      门牌,
      姓名: 户静态表[门牌].妻名,
      阶段: Math.max(0, Math.min(5, data.户[门牌]?.妻.当前阶段 ?? 0)),
      完成,
      结局: 结局名称[门牌],
      归宿,
    };
  });
}

export function 构造通关成绩(data: SchemaType): 通关成绩 {
  const 角色 = 通关角色结果(data);
  const 完成数 = 角色.filter(项 => 项.完成).length;
  const 特殊剧情 = [
    ...new Set(
      data.系统._已完成特殊场景.filter(id => 特殊剧情ID.has(id)).map(id => (id === '录像带' ? '录像带结局' : id)),
    ),
  ].sort();
  const 服饰数 = 门牌列表.reduce(
    (总数, 门牌) => 总数 + new Set((data.户[门牌]?.妻._衣柜 ?? []).filter(id => 服饰ID.has(id))).size,
    0,
  );
  const CG数 = new Set(data.系统._通关纪念.CG记录).size;
  const 会议数 = data.系统._已完成特殊场景.includes('静音会议') ? 1 : 0;
  const 探索项 = [
    { 名称: '特别演出', 数量: 会议数, 目标: 1, 分数: 会议数 * 20, 上限: 20, 说明: '完整体验静音会议，获得20分。' },
    {
      名称: '服饰收藏',
      数量: 服饰数,
      目标: 40,
      分数: Math.min(40, 服饰数),
      上限: 40,
      说明: '每位角色收到的每款不同服饰计1分，最多40分。',
    },
    {
      名称: '本局CG',
      数量: CG数,
      目标: 120,
      分数: Math.min(40, Math.floor(CG数 / 3)),
      上限: 40,
      说明: '本局每收集3张不同CG计1分，最多40分。',
    },
  ];
  const 探索分 = 探索项.reduce((总分, 项) => 总分 + 项.分数, 0);
  const 阶段总数 = 角色.reduce((总数, 项) => 总数 + 项.阶段, 0);
  const 评级: 通关评级 =
    完成数 === 6
      ? 探索分 >= 通关探索门槛.SSS
        ? 'SSS'
        : 探索分 >= 通关探索门槛.SS
          ? 'SS'
          : 'S'
      : 完成数 >= 3 || 阶段总数 >= 24
        ? 'A'
        : 完成数 >= 1 || 阶段总数 >= 12
          ? 'B'
          : 'C';
  const 时段 = Math.max(0, Math.floor(data.系统._绝对时段));
  return {
    规则版本: 1,
    评级,
    绝对时段: 时段,
    天数: Math.floor(时段 / 6) + 1,
    角色,
    结局线路数: new Set(角色.filter(项 => 项.完成).map(项 => 项.结局)).size,
    特殊剧情,
    服饰数,
    CG数,
    探索分,
    探索项,
  };
}

/** 写入玩法结果的同一事务里建立起点；不播放、不冻结时间，也不重置已有等待钟。 */
export function 同步通关进度(data: SchemaType): boolean {
  const 纪念 = data.系统._通关纪念;
  if (!纪念 || !data.系统._序章完成 || data.系统._坏结局) return false;
  if (!通关角色结果(data).every(项 => 项.完成)) {
    if (纪念.全员完成时段 >= 0 && !纪念.首次成绩) {
      纪念.全员完成时段 = -1;
      return true;
    }
    return false;
  }
  if (纪念.全员完成时段 >= 0) return false;
  纪念.全员完成时段 = Math.max(0, Math.floor(data.系统._绝对时段));
  return true;
}

export function 通关结算可展示(data: SchemaType, 当前场景: string | null): boolean {
  const 纪念 = data.系统._通关纪念;
  return Boolean(
    纪念 &&
    data.系统._序章完成 &&
    !data.系统._坏结局 &&
    通关角色结果(data).every(项 => 项.完成) &&
    纪念.全员完成时段 >= 0 &&
    data.系统._绝对时段 >= 纪念.全员完成时段 + 通关等待时段 &&
    !场景剧情占用前台生成(data, 当前场景) &&
    !场景剧情连续锁场(读取队首场景剧情(data.系统._待发送事件)?.内容) &&
    data.系统._性爱场景.状态 === '空闲' &&
    !data.系统._父亲通话.标识 &&
    !data.系统._父亲通话.状态,
  );
}

export function 准备通关结算(data: SchemaType, 当前场景: string | null): boolean {
  if (data.系统._通关纪念.首次成绩 || !通关结算可展示(data, 当前场景)) return false;
  data.系统._通关纪念.首次成绩 = 构造通关成绩(data);
  return true;
}

export function 待庆祝通关成绩(data: SchemaType): 通关成绩 | null {
  const 纪念 = data.系统._通关纪念;
  if (!纪念.首次成绩 || !通关角色结果(data).every(项 => 项.完成)) return null;
  if (!纪念.已庆祝评级) return 纪念.首次成绩;
  const 当前 = 构造通关成绩(data);
  return 通关评级列表.indexOf(当前.评级) > 通关评级列表.indexOf(纪念.已庆祝评级) ? 当前 : null;
}

export function 确认通关庆祝(data: SchemaType, 评级: 通关评级): boolean {
  const 待庆祝 = 待庆祝通关成绩(data);
  if (
    !待庆祝 ||
    通关评级列表.indexOf(评级) > 通关评级列表.indexOf(待庆祝.评级) ||
    !(['S', 'SS', 'SSS'] as string[]).includes(评级)
  )
    return false;
  if (通关评级列表.indexOf(评级) <= 通关评级列表.indexOf(data.系统._通关纪念.已庆祝评级 as 通关评级)) return false;
  data.系统._通关纪念.已庆祝评级 = 评级 as 'S' | 'SS' | 'SSS';
  return true;
}

/** 已验证属于当前分支且确实加载成功的CG才从调用方进入；同图跨回合去重。 */
export function 登记本局CG(data: SchemaType, ids: readonly string[]): boolean {
  const 已有 = new Set(data.系统._通关纪念.CG记录);
  const 新增 = ids.filter(id => !已有.has(id));
  if (!新增.length) return false;
  data.系统._通关纪念.CG记录 = [...new Set([...已有, ...新增])];
  return true;
}
