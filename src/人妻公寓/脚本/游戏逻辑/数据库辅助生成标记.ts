import { 临时楼标记键 } from './临时回合楼';

function 写入自动触发标记(选项: unknown): boolean {
  if (!选项 || typeof 选项 !== 'object' || Array.isArray(选项)) return false;
  const 配置 = 选项 as Record<string, unknown>;
  if (配置.automatic_trigger === true) return true;
  try {
    return Reflect.set(配置, 'automatic_trigger', true) && 配置.automatic_trigger === true;
  } catch {
    return false;
  }
}

/**
 * TavernHelper.generateRaw 会在真正请求前广播 GENERATION_AFTER_COMMANDS，但当前实现把
 * 调用配置转换成内部参数时不会透传未知字段。调用方必须在该事件的队首监听中修改同一个
 * options 对象，数据库插件后续监听器才能把睡眠、监控、录像带等识别为辅助生成并跳过填表。
 */
export function 标记脚本辅助生成事件(类型: unknown, 选项: unknown, dryRun = false): boolean {
  if (dryRun || 类型 !== 'normal') return false;
  return 写入自动触发标记(选项);
}

/**
 * 候选正文及变量尚未转正时，原生生成结束不能让通用填表读取这批临时消息。
 * 成功提交会清除临时标记，随后回合引擎的正式广播按原路径触发数据库整理。
 */
export function 标记未提交回合生成事件(消息表: readonly unknown[], 选项: unknown, dryRun = false): boolean {
  if (dryRun) return false;
  const 有临时楼 = 消息表.some(消息 => {
    if (!消息 || typeof 消息 !== 'object') return false;
    const extra = (消息 as { extra?: Record<string, unknown> }).extra;
    return extra?.[临时楼标记键] === true;
  });
  if (!有临时楼) return false;
  return 写入自动触发标记(选项);
}
