import type { SchemaType } from '../../schema';
import { 修女职位列表 } from '../../schema';
import { 阶段标题列表 } from '../../stageConfig';

/**
 * 安检机第二道:相对变化量(单轮 ±3)裁剪 + 脚本管字段回写。
 * 第一道(schema.ts zod)负责类型强转/catch 默认/clamp 绝对范围。
 *
 * 两条路径复用:
 *   回合引擎(固定 0 楼主路径)—— Mvu.parseMessage 解析后直接调用
 *   VARIABLE_UPDATE_ENDED(✠ 逃生舱原生玩法)—— MVU 自动解析后调用
 */

const 三轴 = ['支持度', '堕落度', '信仰值'] as const;
const 单轮封顶 = 3;

/** 原地裁剪 newData,返回是否有改动 */
export function 安检裁剪(newData: SchemaType, oldData: SchemaType): boolean {
  let changed = false;

  for (const 职位 of 修女职位列表) {
    const n = newData.修女[职位];
    const o = oldData.修女[职位];

    // 三轴单轮 ±3 差值裁剪(大额涨幅只走脚本里程碑事件)
    for (const 轴 of 三轴) {
      const delta = n[轴] - o[轴];
      if (Math.abs(delta) > 单轮封顶) {
        n[轴] = _.clamp(o[轴] + Math.sign(delta) * 单轮封顶, 0, 100);
        changed = true;
      }
    }

    // 脚本管字段:AI 改动一律回写(晋阶走晋阶按钮/事件,不由 AI 直改)
    if (n.当前阶段 !== o.当前阶段) {
      n.当前阶段 = o.当前阶段;
      changed = true;
    }
    if (n.情报可见 !== o.情报可见) {
      n.情报可见 = o.情报可见;
      changed = true;
    }
    if (n.上次互动楼层 !== o.上次互动楼层) {
      n.上次互动楼层 = o.上次互动楼层;
      changed = true;
    }

    // 阶段标题 = 派生字段,永远由脚本按当前阶段重算
    const 标题 = 阶段标题列表[n.当前阶段 - 1];
    if (n.阶段标题 !== 标题) {
      n.阶段标题 = 标题;
      changed = true;
    }
  }

  // 全局机制字段全部脚本管(恶魔低语除外,那是 AI 每轮即兴的)
  for (const key of ['奉献金', '激进度', '警戒度'] as const) {
    if (newData[key] !== oldData[key]) {
      newData[key] = oldData[key];
      changed = true;
    }
  }
  for (const key of ['会议', '院规', '视察', '商店'] as const) {
    if (!_.isEqual(newData[key], oldData[key])) {
      newData[key] = oldData[key] as never;
      changed = true;
    }
  }

  return changed;
}
