/**
 * 核心数据保护系统
 *
 * 设计目标：
 * 1. 防止AI随意修改关键数值（部位进度、依存度、境界等）
 * 2. 保护真相模式标记（已进入过梦境）不被篡改
 * 3. 保护时间系统数据一致性
 * 4. 在每次AI回复后验证并还原被篡改的数据
 *
 * 工作原理：
 * - 在AI生成前保存关键数据快照
 * - 在AI生成后对比快照，检测非法修改
 * - 自动还原被AI篡改的数据
 * - 记录篡改日志用于调试
 */

import type { Schema as SchemaType } from '../../schema';

// ============================================
// 受保护字段定义
// ============================================

/**
 * 保护级别定义
 * - ABSOLUTE: 绝对保护，AI永远不能修改（如时间、境界、部位进度）
 * - SCRIPT_ONLY: 只能通过脚本修改（如依存度、道德底线）
 * - READONLY: 只读字段（如已进入过梦境、循环状态）
 */
export enum ProtectionLevel {
  ABSOLUTE = 'ABSOLUTE', // 绝对保护
  SCRIPT_ONLY = 'SCRIPT_ONLY', // 只能脚本修改
  READONLY = 'READONLY', // 只读
}

/**
 * 受保护字段配置
 * 定义哪些字段需要保护，以及保护级别
 */
export const PROTECTED_FIELDS = {
  // 时间系统（脚本控制 - 只能通过TimeSystem脚本修改，AI不能修改）
  '世界.当前天数': ProtectionLevel.SCRIPT_ONLY,
  '世界.当前小时': ProtectionLevel.SCRIPT_ONLY,
  '世界.时间': ProtectionLevel.SCRIPT_ONLY,
  '世界.时间戳': ProtectionLevel.SCRIPT_ONLY,

  // 循环系统（只读）
  '世界.循环状态': ProtectionLevel.READONLY,
  '世界.当前循环轮数': ProtectionLevel.READONLY,

  // 真相模式标记（只读，一旦进入不可逆）
  '世界.已进入过梦境': ProtectionLevel.READONLY,

  // 游戏阶段（脚本控制）
  '世界.游戏阶段': ProtectionLevel.SCRIPT_ONLY,

  // 核心数值（只能脚本修改）
  '赵霞状态.依存度': ProtectionLevel.SCRIPT_ONLY,
  '赵霞状态.道德底线': ProtectionLevel.SCRIPT_ONLY,
  '赵霞状态.对丈夫依存度': ProtectionLevel.SCRIPT_ONLY,
  '赵霞状态.当前境界': ProtectionLevel.SCRIPT_ONLY,

  // 纯爱模式数值：AI可自由修改，通过 applyPureLoveAffectionCap() 软上限保护
  // 不在此处硬保护，让AI能根据互动调整数值

  // 部位进度（绝对保护，只能通过梦境开发脚本修改）
  '赵霞状态.部位进度.嘴巴': ProtectionLevel.ABSOLUTE,
  '赵霞状态.部位进度.胸部': ProtectionLevel.ABSOLUTE,
  '赵霞状态.部位进度.下体': ProtectionLevel.ABSOLUTE,
  '赵霞状态.部位进度.后穴': ProtectionLevel.ABSOLUTE,
  '赵霞状态.部位进度.精神': ProtectionLevel.ABSOLUTE,

  // 梦境数据（脚本控制）
  '梦境数据.已完成场景': ProtectionLevel.SCRIPT_ONLY,
  '梦境数据.正确重构场景': ProtectionLevel.SCRIPT_ONLY,
  '梦境数据.记忆混乱度': ProtectionLevel.SCRIPT_ONLY,

  // 当晚进度记录（绝对保护）
  '梦境数据.当晚进度记录.天数': ProtectionLevel.ABSOLUTE,
  '梦境数据.当晚进度记录.嘴巴': ProtectionLevel.ABSOLUTE,
  '梦境数据.当晚进度记录.胸部': ProtectionLevel.ABSOLUTE,
  '梦境数据.当晚进度记录.下体': ProtectionLevel.ABSOLUTE,
  '梦境数据.当晚进度记录.后穴': ProtectionLevel.ABSOLUTE,
  '梦境数据.当晚进度记录.精神': ProtectionLevel.ABSOLUTE,

  // 威胁数值（脚本控制）
  '现实数据.丈夫怀疑度': ProtectionLevel.SCRIPT_ONLY,

  // 结局数据（脚本控制）
  '结局数据.当前结局': ProtectionLevel.SCRIPT_ONLY,
  '结局数据.后日谈已解锁': ProtectionLevel.SCRIPT_ONLY,
} as const;

// ============================================
// 数据快照系统
// ============================================

/**
 * 数据快照类型
 */
interface DataSnapshot {
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * 当前保存的快照
 */
let currentSnapshot: DataSnapshot | null = null;

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径，如 "世界.当前天数"
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * 设置嵌套对象的值
 * @param obj 对象
 * @param path 路径
 * @param value 值
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * 创建数据快照
 * 在AI生成前调用，保存所有受保护字段的当前值
 */
export function createDataSnapshot(data: SchemaType): DataSnapshot {
  const snapshotData: Record<string, unknown> = {};

  for (const path of Object.keys(PROTECTED_FIELDS)) {
    const value = getNestedValue(data as unknown as Record<string, unknown>, path);
    snapshotData[path] = value;
  }

  currentSnapshot = {
    timestamp: Date.now(),
    data: snapshotData,
  };

  console.info('[数据保护] 已创建数据快照，保护字段数:', Object.keys(snapshotData).length);

  return currentSnapshot;
}

/**
 * 获取当前快照
 */
export function getCurrentSnapshot(): DataSnapshot | null {
  return currentSnapshot;
}

/**
 * 更新快照中的值（脚本修改后调用）
 * 当脚本合法修改受保护字段后，需要同步更新快照以避免被误判为篡改
 *
 * @param path 字段路径，如 "世界.游戏阶段"
 * @param value 新值
 */
export function updateSnapshotValue(path: string, value: unknown): void {
  if (currentSnapshot) {
    currentSnapshot.data[path] = value;
    console.info(`[数据保护] 快照已更新: ${path} = ${JSON.stringify(value)}`);
  }
}

// ============================================
// 数据验证与还原
// ============================================

/**
 * 篡改检测结果
 */
export interface TamperDetectionResult {
  detected: boolean;
  tamperedFields: Array<{
    path: string;
    level: ProtectionLevel;
    originalValue: unknown;
    tamperedValue: unknown;
  }>;
  restoredFields: string[];
}

/**
 * 验证数据完整性并还原被篡改的字段
 * 在AI生成后调用
 *
 * @param data 当前游戏数据
 * @param snapshot 之前保存的快照（可选，默认使用当前快照）
 * @returns 检测结果
 */
export function validateAndRestoreData(data: SchemaType, snapshot?: DataSnapshot): TamperDetectionResult {
  const targetSnapshot = snapshot || currentSnapshot;

  if (!targetSnapshot) {
    console.warn('[数据保护] 无可用快照，跳过验证');
    return {
      detected: false,
      tamperedFields: [],
      restoredFields: [],
    };
  }

  const result: TamperDetectionResult = {
    detected: false,
    tamperedFields: [],
    restoredFields: [],
  };

  const dataObj = data as unknown as Record<string, unknown>;

  // 检查是否在梦境中（梦境阶段允许修改部位进度）
  const currentGameStage = getNestedValue(dataObj, '世界.游戏阶段');
  const isInDream = currentGameStage === '梦境';

  // 检查是否在梦境入口时间窗口（22:00-01:59）
  const currentHour = getNestedValue(dataObj, '世界.当前小时') as number;
  const isDreamEntryWindow = currentHour === 22 || currentHour === 23 || currentHour === 0 || currentHour === 1;

  // 检查是否在场景5时间窗口（08:00-19:59）
  const isScene5Window = currentHour >= 8 && currentHour < 20;

  for (const [path, level] of Object.entries(PROTECTED_FIELDS)) {
    const originalValue = targetSnapshot.data[path];
    const currentValue = getNestedValue(dataObj, path);

    // 梦境豁免：如果在梦境中，部位进度和当晚进度记录允许修改
    if (isInDream && (path.startsWith('赵霞状态.部位进度.') || path.startsWith('梦境数据.当晚进度记录.'))) {
      console.info(`[数据保护] 梦境豁免: ${path} (${JSON.stringify(originalValue)} → ${JSON.stringify(currentValue)})`);
      continue; // 跳过检测，允许修改
    }

    // 时间窗口豁免：在梦境入口时间窗口或场景5时间窗口内，游戏阶段可以切换
    // 设计意图：脚本需要在这些时间段把游戏阶段从"日常"切换到"梦境"
    if (path === '世界.游戏阶段' && (isDreamEntryWindow || isScene5Window)) {
      if (!deepEqual(originalValue, currentValue)) {
        console.info(
          `[数据保护] 时间窗口豁免: ${path} (${JSON.stringify(originalValue)} → ${JSON.stringify(currentValue)})`,
        );
      }
      continue; // 跳过检测，允许修改
    }

    // Bug #18 修复：结局阶段循环状态转换豁免
    // 允许 "结局判定" → "已破解" 的合法转换（结局完成时由脚本触发）
    if (path === '世界.循环状态') {
      const validTransitions = [
        { from: '进行中', to: '结局判定' }, // TimeSystem.advance() 触发
        { from: '结局判定', to: '已破解' }, // checkEnding() 或结局系统完成时触发
      ];
      const isValidTransition = validTransitions.some(t => originalValue === t.from && currentValue === t.to);
      if (isValidTransition) {
        console.info(
          `[数据保护] 结局状态转换豁免: ${path} (${JSON.stringify(originalValue)} → ${JSON.stringify(currentValue)})`,
        );
        continue; // 跳过检测，允许修改
      }
    }

    // Bug #26 修复：结局触发豁免
    // 结局一旦触发就不应该被还原，这些是游戏正常流程的一部分
    // 坏结局、普通结局、混乱结局、好结局等都需要立即生效
    if (path === '结局数据.当前结局') {
      // 只允许从 "未触发" 变为其他结局类型，不允许反向变化
      const validEndingTypes = ['坏结局', '普通结局', '真好结局', '假好结局', '完美真爱结局'];
      if (originalValue === '未触发' && validEndingTypes.includes(currentValue as string)) {
        console.info(
          `[数据保护] 结局触发豁免: ${path} (${JSON.stringify(originalValue)} → ${JSON.stringify(currentValue)})`,
        );
        continue; // 跳过检测，允许修改
      }
    }

    // 真相模式豁免：已进入过梦境时，核心数值由脚本计算（依存度=部位平均值）
    // 这些字段由 updateTruthModeValues() 和 updateSuspicionLevel() 更新
    // Bug #25 修复：记忆混乱度也需要豁免，否则混乱结局无法触发
    const isTruthMode = getNestedValue(dataObj, '世界.已进入过梦境') === true;
    const scriptCalculatedFields = [
      '赵霞状态.依存度',
      '赵霞状态.道德底线',
      '赵霞状态.当前境界',
      '现实数据.丈夫怀疑度',
      '梦境数据.记忆混乱度', // Bug #25: 记忆混乱度由脚本计算，需要豁免
    ];
    if (isTruthMode && scriptCalculatedFields.includes(path)) {
      // Bug #14.2 修复：检测是否是异常的数值重置（到默认值）
      // 如果原值>0但新值被重置为默认值（0或100），这通常是数据继承问题导致的
      const 默认值映射: Record<string, number> = {
        '赵霞状态.依存度': 0,
        '赵霞状态.道德底线': 80, // 注意：道德底线的 schema 默认值是 80，但重置时会变成 100（因为 100 - 0 = 100）
        '赵霞状态.当前境界': 1,
        '现实数据.丈夫怀疑度': 0,
        '梦境数据.记忆混乱度': 0, // Bug #25: 记忆混乱度默认为0
      };

      const originalNum = typeof originalValue === 'number' ? originalValue : 0;
      const currentNum = typeof currentValue === 'number' ? currentValue : 0;
      const defaultValue = 默认值映射[path];

      // 检测异常重置：原值有效（>默认值）且新值变为默认值或接近默认值
      // Bug #23 增强：增加对"大幅下降"的检测（如依存度从45降到2）
      // Bug #24 修复：丈夫怀疑度增加到100是正常的（触发坏结局），不应该被阻止
      const isAbnormalReset =
        originalNum > 10 &&
        (currentNum === 0 ||
          currentNum === 1 ||
          // 道德底线异常重置到100（= 100 - 0），但丈夫怀疑度增加到100是正常的
          (currentNum === 100 && path === '赵霞状态.道德底线') ||
          (path === '赵霞状态.道德底线' && currentNum > originalNum + 30) || // 道德底线异常上升超过30
          (path === '赵霞状态.依存度' && originalNum - currentNum > 15) || // 依存度异常下降超过15
          (path === '赵霞状态.当前境界' && originalNum - currentNum >= 2)); // 境界异常下降超过2级

      if (isAbnormalReset) {
        console.warn(
          `[数据保护] 检测到异常重置，阻止修改: ${path}`,
          `\n  原值: ${originalValue}`,
          `\n  异常新值: ${currentValue}`,
          `\n  原因: 可能是数据继承问题导致的核心数值被重置`,
        );
        // 还原为原值
        setNestedValue(dataObj, path, originalValue);
        result.detected = true;
        result.tamperedFields.push({
          path,
          level,
          originalValue,
          tamperedValue: currentValue,
        });
        result.restoredFields.push(path);
        continue; // 不豁免，还原数据
      }

      if (!deepEqual(originalValue, currentValue)) {
        console.info(
          `[数据保护] 真相模式豁免: ${path} (${JSON.stringify(originalValue)} → ${JSON.stringify(currentValue)})`,
        );
      }
      continue; // 正常豁免，允许脚本计算更新
    }

    // 深度比较
    if (!deepEqual(originalValue, currentValue)) {
      result.detected = true;
      result.tamperedFields.push({
        path,
        level,
        originalValue,
        tamperedValue: currentValue,
      });

      // 还原数据
      setNestedValue(dataObj, path, originalValue);
      result.restoredFields.push(path);

      console.warn(
        `[数据保护] 检测到篡改: ${path}`,
        `\n  保护级别: ${level}`,
        `\n  原始值: ${JSON.stringify(originalValue)}`,
        `\n  篡改值: ${JSON.stringify(currentValue)}`,
        `\n  已还原`,
      );
    }
  }

  if (result.detected) {
    console.warn(`[数据保护] 共检测到 ${result.tamperedFields.length} 个字段被篡改，已全部还原`);

    // BUG-007/008/009 修复：时间字段联动回滚
    // 如果任一时间字段被篡改并回滚，确保所有时间字段一致
    const timeFields = ['世界.当前天数', '世界.当前小时', '世界.时间'];
    const timeFieldTampered = result.tamperedFields.some(f => timeFields.includes(f.path));

    if (timeFieldTampered) {
      // 使用快照中的时间数据，确保三者一致
      const snapshotDay = targetSnapshot.data['世界.当前天数'] as number;
      const snapshotHour = targetSnapshot.data['世界.当前小时'] as number;
      const snapshotTime = targetSnapshot.data['世界.时间'] as string;

      // 验证快照数据一致性
      const expectedTime = `Day ${snapshotDay}, ${snapshotHour.toString().padStart(2, '0')}:00`;

      if (snapshotTime !== expectedTime) {
        // 快照本身不一致，以 当前天数 和 当前小时 为准
        console.warn(
          `[数据保护] 时间联动修复：快照不一致，以数值为准`,
          `\n  天数: ${snapshotDay}, 小时: ${snapshotHour}`,
          `\n  快照时间: ${snapshotTime} → 修正为: ${expectedTime}`,
        );
        setNestedValue(dataObj, '世界.时间', expectedTime);
      }

      // 确保当前数据与快照一致
      setNestedValue(dataObj, '世界.当前天数', snapshotDay);
      setNestedValue(dataObj, '世界.当前小时', snapshotHour);
      setNestedValue(dataObj, '世界.时间', snapshotTime !== expectedTime ? expectedTime : snapshotTime);

      console.info(
        `[数据保护] 时间联动回滚完成：Day ${snapshotDay}, ${snapshotHour}:00`,
      );
    }
  } else {
    console.info('[数据保护] 数据完整性验证通过');
  }

  return result;
}

/**
 * 深度比较两个值
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

// ============================================
// 脚本授权修改系统
// ============================================

/**
 * 脚本修改授权令牌
 * 只有持有有效令牌的脚本才能修改 SCRIPT_ONLY 级别的字段
 */
let scriptAuthToken: string | null = null;

/**
 * 生成脚本授权令牌
 * 在脚本需要修改数据前调用
 */
export function generateScriptAuthToken(): string {
  scriptAuthToken = `script_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  console.info('[数据保护] 已生成脚本授权令牌');
  return scriptAuthToken;
}

/**
 * 验证脚本授权令牌
 */
export function validateScriptAuthToken(token: string): boolean {
  return token === scriptAuthToken;
}

/**
 * 清除脚本授权令牌
 * 在脚本修改完成后调用
 */
export function clearScriptAuthToken(): void {
  scriptAuthToken = null;
  console.info('[数据保护] 已清除脚本授权令牌');
}

/**
 * 带授权的数据修改
 * 用于脚本安全地修改 SCRIPT_ONLY 级别的字段
 *
 * @param data 游戏数据
 * @param path 字段路径
 * @param value 新值
 * @param token 授权令牌
 * @returns 是否修改成功
 */
export function authorizedModify(data: SchemaType, path: string, value: unknown, token: string): boolean {
  // 验证令牌
  if (!validateScriptAuthToken(token)) {
    console.error(`[数据保护] 授权失败: 无效的令牌`);
    return false;
  }

  // 检查字段保护级别
  const level = PROTECTED_FIELDS[path as keyof typeof PROTECTED_FIELDS];

  if (level === ProtectionLevel.ABSOLUTE) {
    console.error(`[数据保护] 拒绝修改: ${path} 是绝对保护字段`);
    return false;
  }

  if (level === ProtectionLevel.READONLY) {
    console.error(`[数据保护] 拒绝修改: ${path} 是只读字段`);
    return false;
  }

  // 允许修改
  setNestedValue(data as unknown as Record<string, unknown>, path, value);
  console.info(`[数据保护] 授权修改: ${path} = ${JSON.stringify(value)}`);

  // 更新快照中的值（防止后续误判为篡改）
  if (currentSnapshot) {
    currentSnapshot.data[path] = value;
  }

  return true;
}

// ============================================
// 特殊保护规则
// ============================================

/**
 * 检查真相模式标记的特殊规则
 * 已进入过梦境 只能从 false 变为 true，不能从 true 变为 false
 */
export function validateTruthModeTransition(oldValue: boolean, newValue: boolean): boolean {
  if (oldValue === true && newValue === false) {
    console.error('[数据保护] 违规: 尝试将已进入过梦境从true改为false（不可逆操作）');
    return false;
  }
  return true;
}

/**
 * 检查数值变化是否合理
 * 用于检测AI是否试图大幅修改数值
 *
 * @param path 字段路径
 * @param oldValue 原值
 * @param newValue 新值
 * @param maxChange 最大允许变化量
 */
export function validateNumericChange(
  path: string,
  oldValue: number,
  newValue: number,
  maxChange: number = 10,
): boolean {
  const change = Math.abs(newValue - oldValue);

  if (change > maxChange) {
    console.warn(
      `[数据保护] 可疑变化: ${path} 从 ${oldValue} 变为 ${newValue}（变化量: ${change}，超过阈值: ${maxChange}）`,
    );
    return false;
  }

  return true;
}

// ============================================
// 初始化与清理
// ============================================

/**
 * 初始化数据保护系统
 */
export function initDataProtection(): void {
  currentSnapshot = null;
  scriptAuthToken = null;
  console.info('[数据保护] 系统已初始化');
}

/**
 * 清理数据保护系统
 */
export function cleanupDataProtection(): void {
  currentSnapshot = null;
  scriptAuthToken = null;
  console.info('[数据保护] 系统已清理');
}

// ============================================
// 调试工具
// ============================================

/**
 * 获取所有受保护字段的当前状态
 */
export function getProtectedFieldsStatus(data: SchemaType): Record<string, unknown> {
  const status: Record<string, unknown> = {};
  const dataObj = data as unknown as Record<string, unknown>;

  for (const path of Object.keys(PROTECTED_FIELDS)) {
    status[path] = {
      value: getNestedValue(dataObj, path),
      level: PROTECTED_FIELDS[path as keyof typeof PROTECTED_FIELDS],
    };
  }

  return status;
}

/**
 * 生成保护报告
 */
export function generateProtectionReport(result: TamperDetectionResult): string {
  if (!result.detected) {
    return '数据保护报告: 所有字段完整，无篡改检测';
  }

  let report = '=== 数据保护报告 ===\n';
  report += `检测时间: ${new Date().toISOString()}\n`;
  report += `篡改字段数: ${result.tamperedFields.length}\n`;
  report += `已还原字段数: ${result.restoredFields.length}\n\n`;

  report += '--- 篡改详情 ---\n';
  for (const field of result.tamperedFields) {
    report += `字段: ${field.path}\n`;
    report += `  保护级别: ${field.level}\n`;
    report += `  原始值: ${JSON.stringify(field.originalValue)}\n`;
    report += `  篡改值: ${JSON.stringify(field.tamperedValue)}\n\n`;
  }

  return report;
}

// ============================================
// 纯爱模式好感度软上限保护
// ============================================

/**
 * 纯爱好感度天数软上限配置
 * 设计意图：让玩家永远无法达到"羁绊"阶段(80+)
 */
const PURE_LOVE_AFFECTION_CAPS: Record<number, number> = {
  1: 25, // Day 1：最高到"破冰"中期
  2: 45, // Day 2：最高到"信任"中期
  3: 65, // Day 3：最高到"依恋"初期
  4: 78, // Day 4：最高到"依恋"后期
  5: 78, // Day 5：无法达到"羁绊"
};

/**
 * 获取当前天数的好感度上限
 */
export function getPureLoveAffectionCap(currentDay: number): number {
  return PURE_LOVE_AFFECTION_CAPS[currentDay] ?? 78;
}

/**
 * 应用纯爱好感度软上限保护
 * 在每次AI回复后调用，将好感度压到当前天数上限内
 *
 * @param data 游戏数据
 * @returns 是否进行了修正
 */
export function applyPureLoveAffectionCap(data: SchemaType): boolean {
  const currentDay = data.世界.当前天数;
  const cap = getPureLoveAffectionCap(currentDay);
  const currentAffection = data.赵霞状态.纯爱好感度;

  if (currentAffection > cap) {
    console.info(`[数据保护] 纯爱好感度软上限修正: ${currentAffection} → ${cap} (Day ${currentDay} 上限: ${cap})`);
    data.赵霞状态.纯爱好感度 = cap;

    // 更新快照
    if (currentSnapshot) {
      currentSnapshot.data['赵霞状态.纯爱好感度'] = cap;
    }

    return true;
  }

  return false;
}

/**
 * 计算纯爱模式下对丈夫的好感度
 * 公式：对丈夫好感 = 60 - (纯爱亲密度 × 0.6)
 *
 * @param pureLoveIntimacy 纯爱亲密度
 * @returns 对丈夫的好感度
 */
export function calculateHusbandAffection(pureLoveIntimacy: number): number {
  const result = Math.round(60 - pureLoveIntimacy * 0.6);
  return Math.max(-50, Math.min(100, result)); // 保持在 -50 到 100 范围内
}

/**
 * 获取纯爱模式关系阶段
 * 需要好感度和亲密度都达到阈值才能提升
 *
 * @param affection 纯爱好感度
 * @param intimacy 纯爱亲密度
 * @returns 关系阶段 1-5
 */
export function getPureLoveRelationshipStage(affection: number, intimacy: number): number {
  // 取两者的较小值来决定阶段
  const effectiveValue = Math.min(affection, intimacy);

  if (effectiveValue >= 80) return 5; // 羁绊（纯爱无法达到）
  if (effectiveValue >= 60) return 4; // 依恋
  if (effectiveValue >= 40) return 3; // 信任
  if (effectiveValue >= 20) return 2; // 破冰
  return 1; // 陌生
}

/**
 * 获取关系阶段名称
 */
export function getPureLoveRelationshipName(stage: number): string {
  const names: Record<number, string> = {
    1: '陌生',
    2: '破冰',
    3: '信任',
    4: '依恋',
    5: '羁绊',
  };
  return names[stage] ?? '陌生';
}

/**
 * 获取关系阶段描述
 */
export function getPureLoveRelationshipDescription(stage: number): string {
  const descriptions: Record<number, string> = {
    1: '略显生疏的母子',
    2: '关系明显亲近的母子',
    3: '亲密无间的母子',
    4: '超越母子的暧昧关系',
    5: '彼此深爱的灵魂伴侣',
  };
  return descriptions[stage] ?? '普通母子';
}
