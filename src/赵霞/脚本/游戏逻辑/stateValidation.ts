/**
 * 赵霞游戏 - 状态一致化规则
 *
 * 功能：
 * - 确保所有数值在合理范围内（0-100）
 * - 境界自动更新（根据依存度）
 * - 部位进度限制（不能超过当前境界）
 * - 威胁数值自动触发坏结局
 */

import type { Schema as SchemaType } from '../../schema';

/**
 * 限制数值在指定范围内
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 根据依存度自动计算境界
 */
export function calculateRealm(依存度: number): number {
  if (依存度 < 20) return 1;
  if (依存度 < 40) return 2;
  if (依存度 < 60) return 3;
  if (依存度 < 80) return 4;
  return 5;
}

/**
 * 获取境界名称（纯爱模式）
 */
export function getRealmNamePure(realm: number): string {
  const names = ['初识', '好友', '暧昧', '热恋', '真爱'];
  return names[realm - 1] ?? `境界${realm}`;
}

/**
 * 获取境界名称（真相模式）
 */
export function getRealmNameTruth(realm: number): string {
  const names = ['初染', '迷途', '溺深', '归虚', '焚誓'];
  return names[realm - 1] ?? `境界${realm}`;
}

/**
 * 验证并修正所有数值
 */
export function validateAndFixState(data: SchemaType): {
  fixed: boolean;
  changes: string[];
} {
  const changes: string[] = [];
  let fixed = false;

  // ============================================
  // 1. 核心数值范围检查
  // ============================================

  const 原依存度 = data.赵霞状态.依存度;
  const 原道德底线 = data.赵霞状态.道德底线;
  const 原对丈夫依存度 = data.赵霞状态.对丈夫依存度;

  data.赵霞状态.依存度 = clamp(data.赵霞状态.依存度, 0, 100);
  data.赵霞状态.道德底线 = clamp(data.赵霞状态.道德底线, 0, 100);
  data.赵霞状态.对丈夫依存度 = clamp(data.赵霞状态.对丈夫依存度, -50, 100);

  if (data.赵霞状态.依存度 !== 原依存度) {
    changes.push(`依存度: ${原依存度} → ${data.赵霞状态.依存度}`);
    fixed = true;
  }
  if (data.赵霞状态.道德底线 !== 原道德底线) {
    changes.push(`道德底线: ${原道德底线} → ${data.赵霞状态.道德底线}`);
    fixed = true;
  }
  if (data.赵霞状态.对丈夫依存度 !== 原对丈夫依存度) {
    changes.push(`对丈夫依存度: ${原对丈夫依存度} → ${data.赵霞状态.对丈夫依存度}`);
    fixed = true;
  }

  // ============================================
  // 2. 境界自动更新
  // ============================================

  const 正确境界 = calculateRealm(data.赵霞状态.依存度);
  if (data.赵霞状态.当前境界 !== 正确境界) {
    const 旧境界 = data.赵霞状态.当前境界;
    data.赵霞状态.当前境界 = 正确境界;
    changes.push(`境界: ${旧境界} → ${正确境界}（依存度：${data.赵霞状态.依存度}）`);
    fixed = true;

    console.info(`[状态验证] 境界自动更新: ${getRealmNamePure(旧境界)} → ${getRealmNamePure(正确境界)}`);
  }

  // ============================================
  // 3. 部位进度范围检查 + 场景限制
  // ============================================

  const 部位列表: Array<'嘴巴' | '胸部' | '下体' | '后穴' | '精神'> = ['嘴巴', '胸部', '下体', '后穴', '精神'];

  // 判断当前模式和场景
  const 是纯爱模式 = !data.世界.已进入过梦境;

  for (const 部位 of 部位列表) {
    const 原进度 = data.赵霞状态.部位进度[部位];
    let 修正进度 = clamp(原进度, 0, 100);

    // 【场景限制】精神进度特殊处理
    // 精神只能在场景5开发（需要安眠药），纯爱模式下强制锁定为0
    if (部位 === '精神' && 是纯爱模式 && 原进度 > 0) {
      修正进度 = 0;
      console.info(`[状态验证] 纯爱模式下精神进度被锁定为0（原值: ${原进度}）`);
    }
    // 注意：真相模式下的场景限制由 updateBodyPartProgress 处理
    // 这里不重置已有的精神进度，因为可能是之前场景5开发的

    if (原进度 !== 修正进度) {
      data.赵霞状态.部位进度[部位] = 修正进度;
      changes.push(`${部位}进度: ${原进度} → ${修正进度}`);
      fixed = true;
    }
  }

  // ============================================
  // 4. 威胁数值范围检查
  // ============================================

  const 原混乱度 = data.梦境数据.记忆混乱度;
  const 原怀疑度 = data.现实数据.丈夫怀疑度;

  data.梦境数据.记忆混乱度 = clamp(data.梦境数据.记忆混乱度, 0, 100);
  data.现实数据.丈夫怀疑度 = clamp(data.现实数据.丈夫怀疑度, 0, 100);

  if (data.梦境数据.记忆混乱度 !== 原混乱度) {
    changes.push(`记忆混乱度: ${原混乱度} → ${data.梦境数据.记忆混乱度}`);
    fixed = true;
  }
  if (data.现实数据.丈夫怀疑度 !== 原怀疑度) {
    changes.push(`丈夫怀疑度: ${原怀疑度} → ${data.现实数据.丈夫怀疑度}`);
    fixed = true;
  }

  // ============================================
  // 5. 坏结局自动触发检查
  // ============================================

  // 【梦境豁免】梦境中怀疑度达到100不触发发现结局
  // 原因：赵霞在睡觉做梦，苏文不可能发现她在梦里做什么
  // 但记忆混乱度（精神崩溃）不豁免
  const 是梦境阶段 = data.世界.游戏阶段 === '梦境';

  if (data.梦境数据.记忆混乱度 >= 100) {
    if (data.结局数据.当前结局 === '未触发' && data.世界.循环状态 === '进行中') {
      console.warn('[状态验证] ⚠️ 记忆混乱度达到100，应该触发精神崩溃结局！');
      // 注意：不在这里直接触发结局，由主逻辑处理
    }
  }

  if (data.现实数据.丈夫怀疑度 >= 100 && !是梦境阶段) {
    if (data.结局数据.当前结局 === '未触发' && data.世界.循环状态 === '进行中') {
      console.warn('[状态验证] ⚠️ 丈夫怀疑度达到100，应该触发发现结局！');
      // 注意：不在这里直接触发结局，由主逻辑处理
    }
  }

  // ============================================
  // 6. 天数和小时范围检查
  // ============================================

  const 原天数 = data.世界.当前天数;
  const 原小时 = data.世界.当前小时;

  // Bug #18 修复：结局判定/已破解状态下允许天数超过5（用于显示真实日期）
  // 只有在"进行中"状态下才限制天数在1-5范围内
  const isEndingPhase = data.世界.循环状态 === '结局判定' || data.世界.循环状态 === '已破解';
  const maxDay = isEndingPhase ? 99 : 5; // 结局阶段允许更大的天数
  data.世界.当前天数 = clamp(data.世界.当前天数, 1, maxDay);
  data.世界.当前小时 = clamp(data.世界.当前小时, 0, 23);

  if (data.世界.当前天数 !== 原天数) {
    changes.push(`天数: ${原天数} → ${data.世界.当前天数}`);
    fixed = true;
  }
  if (data.世界.当前小时 !== 原小时) {
    changes.push(`小时: ${原小时} → ${data.世界.当前小时}`);
    fixed = true;
  }

  // 输出日志
  if (fixed) {
    console.info('[状态验证] 检测到不一致数据，已自动修正:');
    changes.forEach(change => console.info(`  - ${change}`));
  }

  return { fixed, changes };
}

/**
 * 检查境界变化
 * @returns 是否发生境界变化
 */
let lastRealm = -1;

export function checkRealmChange(data: SchemaType): {
  changed: boolean;
  oldRealm: number;
  newRealm: number;
} {
  const currentRealm = data.赵霞状态.当前境界;

  // 首次初始化
  if (lastRealm === -1) {
    lastRealm = currentRealm;
    console.info(`[境界检测] 初始化境界记录: 境界${currentRealm}`);
    return { changed: false, oldRealm: currentRealm, newRealm: currentRealm };
  }

  // 检查变化
  if (currentRealm !== lastRealm) {
    const oldRealm = lastRealm;
    lastRealm = currentRealm;

    console.info(
      `[境界检测] ✅ 境界变化: ${oldRealm} → ${currentRealm}\n` +
        `  纯爱模式: ${getRealmNamePure(oldRealm)} → ${getRealmNamePure(currentRealm)}\n` +
        `  真相模式: ${getRealmNameTruth(oldRealm)} → ${getRealmNameTruth(currentRealm)}`,
    );

    return { changed: true, oldRealm, newRealm: currentRealm };
  }

  return { changed: false, oldRealm: currentRealm, newRealm: currentRealm };
}

/**
 * 重置境界追踪（用于测试或重新开始）
 */
export function resetRealmTracking(): void {
  lastRealm = -1;
  console.info('[境界检测] 境界追踪已重置');
}
