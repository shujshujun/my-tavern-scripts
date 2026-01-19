/**
 * 赵霞游戏 - 状态栏显示
 *
 * 核心功能：
 * - 显示当前时间、境界、数值
 * - 根据"已进入过梦境"切换显示文本（纯爱 vs 真相）
 * - 真相模式额外显示：威胁数值、苦主视角
 */

import type { Schema as SchemaType } from '../../schema';
import { getDisplayText, getRealmName, getBodyPartName, shouldShowThreatValues } from './textMapping';
import { TimeSystem } from '../游戏逻辑/timeSystem';
import { shouldGenerateHusbandThought } from '../游戏逻辑/dualTrackSystem';
import {
  shouldShowRealDate,
  isInAfterStory,
  isInFreeMode,
  getAfterStoryType,
  generateDateDisplay,
} from '../游戏逻辑/afterStorySystem';

/**
 * 生成进度条
 */
function renderProgressBar(value: number, max: number = 100, width: number = 20): string {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${value}/${max}`;
}

/**
 * 生成苦主视角文本（只在真相模式、日常阶段、苏文在家时显示）
 *
 * Bug #9 修复：
 * - 使用统一的条件判断 shouldGenerateHusbandThought
 * - 显示 AI 生成的丈夫心理活动（而非固定模板）
 * - 苦主视角只在状态栏显示，不在正文尾部显示
 */
function renderHusbandPerspective(data: SchemaType): string {
  // 使用统一的条件判断：真相模式 + 境界2+ + 日常阶段 + 苏文在家
  if (!shouldGenerateHusbandThought(data)) {
    return '';
  }

  const 怀疑度 = data.现实数据.丈夫怀疑度;
  const 丈夫位置 = data.现实数据.丈夫当前位置;

  // 使用 AI 生成的丈夫心理活动
  const 丈夫心理 = data.现实数据.丈夫心理活动;

  let 风险等级 = '低风险';
  if (怀疑度 >= 80) {
    风险等级 = '危险';
  } else if (怀疑度 >= 60) {
    风险等级 = '高风险';
  } else if (怀疑度 >= 30) {
    风险等级 = '中风险';
  }

  // 位置文本
  const 位置文本映射: Record<string, string> = {
    客厅: '客厅',
    书房: '书房',
    卧室: '卧室',
    厨房: '厨房',
    外出: '外出',
  };
  const 位置显示 = 位置文本映射[丈夫位置] ?? '未知';

  // Bug 修复：如果没有 AI 生成的心理活动，不显示苦主视角区域
  // 原因：避免显示固定模板，只使用正文提取的苦主视角
  if (!丈夫心理) {
    return '';
  }
  const 心理内容 = 丈夫心理;

  return `
┌────────────────────────────────────────┐
│ 【苦主视角】苏文 @ ${位置显示.padEnd(6, ' ')}  怀疑度:${怀疑度}%（${风险等级}）│
├────────────────────────────────────────┤
│ ${truncateAndPad(心理内容, 38)} │
└────────────────────────────────────────┘
`;
}

/**
 * 截断并填充字符串到指定长度
 */
function truncateAndPad(text: string, maxLen: number): string {
  // 移除换行符，只取第一行
  const firstLine = text.split('\n')[0].trim();

  if (firstLine.length <= maxLen) {
    return firstLine.padEnd(maxLen, ' ');
  }
  return firstLine.slice(0, maxLen - 3) + '...';
}

/**
 * 渲染主状态栏
 */
export function renderMainStatus(data: SchemaType): string {
  // 后日谈/自由模式时使用真实日期，否则使用游戏时间
  const 时间显示 = shouldShowRealDate(data) ? generateDateDisplay(data) : TimeSystem.getCurrentTime(data);

  const 依存度显示名 = getDisplayText('依存度', data) ?? '依存度';
  const 道德显示名 = getDisplayText('道德底线', data) ?? '道德底线';
  const 境界显示名 = getRealmName(data.赵霞状态.当前境界, data);

  const 依存度 = data.赵霞状态.依存度;
  const 道德底线 = data.赵霞状态.道德底线;

  // 生成状态标题（后日谈/自由模式有特殊标题）
  let 状态标题 = '【赵霞状态】';
  if (isInFreeMode(data)) {
    const 结局类型 = getAfterStoryType(data);
    状态标题 = `【自由模式】${结局类型 ?? ''}`;
  } else if (isInAfterStory(data)) {
    const 结局类型 = getAfterStoryType(data);
    const 当前轮数 = data.结局数据.后日谈?.当前轮数 ?? 1;
    状态标题 = `【后日谈 ${当前轮数}/2】${结局类型 ?? ''}`;
  }

  let statusBar = `
┌────────────────────────────────────────┐
│ ${状态标题.padEnd(38, ' ')} │
│                                        │
│ 日期：${时间显示.padEnd(30, ' ')} │
│                                        │
│ ${依存度显示名}：${renderProgressBar(依存度).padEnd(25, ' ')} │
│ ${道德显示名}：${renderProgressBar(道德底线).padEnd(25, ' ')} │
│ 当前境界：${境界显示名.padEnd(28, ' ')} │
│                                        │`;

  // 部位进度
  const 部位列表: Array<'嘴巴' | '胸部' | '下体' | '后穴' | '精神'> = ['嘴巴', '胸部', '下体', '后穴', '精神'];
  statusBar += `│ 身体进度：${' '.repeat(30)} │\n`;

  for (const 部位 of 部位列表) {
    const 部位显示名 = getBodyPartName(部位, data);
    const 进度 = data.赵霞状态.部位进度[部位];
    statusBar += `│  · ${部位显示名}：${renderProgressBar(进度, 100, 15).padEnd(28, ' ')} │\n`;
  }

  // 威胁数值（只在真相模式显示）
  if (shouldShowThreatValues(data)) {
    statusBar += `│                                        │\n`;
    statusBar += `│ 威胁状态：${' '.repeat(30)} │\n`;
    statusBar += `│  · 记忆混乱度：${renderProgressBar(data.梦境数据.记忆混乱度, 100, 15).padEnd(24, ' ')} │\n`;
    statusBar += `│  · 丈夫怀疑度：${renderProgressBar(data.现实数据.丈夫怀疑度, 100, 15).padEnd(24, ' ')} │\n`;
  }

  statusBar += `└────────────────────────────────────────┘`;

  return statusBar;
}

/**
 * 渲染完整状态栏（主状态 + 苦主视角）
 */
export function renderFullStatus(data: SchemaType): string {
  let output = renderMainStatus(data);

  // 添加苦主视角（只在真相模式显示）
  const 苦主视角 = renderHusbandPerspective(data);
  if (苦主视角) {
    output += '\n' + 苦主视角;
  }

  return output;
}
