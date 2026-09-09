import {
  取得界面偏好存储候选,
  界面偏好存储键,
  移除已删除界面偏好字段,
  type 界面偏好存储,
} from '../../界面偏好存储';

export const 设置存储键 = 界面偏好存储键;

const 已删除根类 = ['rq-lite', 'rq-still'] as const;

type 界面根 = { classList: Pick<DOMTokenList, 'remove'> };

export interface 旧界面偏好迁移结果 {
  删除字段: string[];
  已写回: boolean;
  存储错误?: unknown;
  根类错误?: unknown;
}

function 默认界面根(): 界面根 | null {
  try {
    return document.documentElement;
  } catch {
    return null;
  }
}

/**
 * 同步清理已经退场的危险界面偏好。
 *
 * 必须在 DOM ready、MVU/stat_data 等待和 Vue mount 之前调用：旧 iframe 或热重载可能仍带着
 * html.rq-lite/html.rq-still；共享 localStorage 又同时保存变量解析与外观设置，因此只能逐字段删除，
 * 不能清空整键。任何读取、解析或写回失败都只放弃持久迁移，绝不阻塞客户端继续挂载。
 */
export function 清理已删除界面偏好(
  存储: 界面偏好存储 | readonly 界面偏好存储[] | null | undefined = undefined,
  根: 界面根 | null = 默认界面根(),
): 旧界面偏好迁移结果 {
  const 结果: 旧界面偏好迁移结果 = { 删除字段: [], 已写回: false };

  try {
    根?.classList.remove(...已删除根类);
  } catch (错误) {
    结果.根类错误 = 错误;
  }

  const 存储们 =
    存储 === undefined
      ? 取得界面偏好存储候选()
      : Array.isArray(存储)
        ? [...存储]
        : 存储
          ? [存储]
          : [];
  const 已删除 = new Set<string>();

  for (const 当前存储 of 存储们) {
    try {
      const 原文 = 当前存储.getItem(设置存储键);
      if (!原文) continue;

      let 偏好: unknown;
      try {
        偏好 = JSON.parse(原文);
      } catch {
        // 损坏 JSON 保持原样；本次页面的旧 class 已在上方同步清掉，挂载不能因此失败。
        continue;
      }
      const 清理 = 移除已删除界面偏好字段(偏好);
      for (const 字段 of 清理.删除字段) 已删除.add(字段);
      if (!清理.删除字段.length) continue;

      当前存储.setItem(设置存储键, JSON.stringify(清理.偏好));
      结果.已写回 = true;
    } catch (错误) {
      // 父页存储失败时仍继续清理当前 iframe 副本；诊断保留首个错误，绝不阻塞挂载。
      结果.存储错误 ??= 错误;
    }
  }

  结果.删除字段 = [...已删除];
  return 结果;
}
