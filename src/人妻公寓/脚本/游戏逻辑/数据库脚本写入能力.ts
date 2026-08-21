export interface 数据库脚本写入静态能力 {
  已安装: boolean;
  已装游戏模板: boolean;
  有SQL接口: boolean;
  有SQL写入接口: boolean;
}

export type 数据库脚本写入状态 =
  | '数据库未安装'
  | '游戏模板未安装'
  | '缺少SQL写入接口'
  | '缺少SQL查询接口'
  | 'SQLite未就绪'
  | '就绪';

export interface 数据库脚本写入能力结果 {
  可写: boolean;
  状态: 数据库脚本写入状态;
  说明: string;
}

export interface 数据库脚本写入复检选项 {
  最大尝试次数?: number;
  复检间隔毫秒?: number;
  当前仍有效?: () => boolean;
  每次检测前?: (尝试次数: number) => void | Promise<void>;
  等待?: (毫秒: number) => Promise<void>;
}

/**
 * 新版数据库会在聊天切换／SQLite 重建期间暂时隐藏同步查询接口；这两种状态可能自行恢复。
 * 插件、模板或 mutation 接口缺失则不是启动时序问题，必须立即失败，不能用等待掩盖。
 */
export function 数据库脚本写入能力可复检(结果: 数据库脚本写入能力结果): boolean {
  return !结果.可写 && (结果.状态 === '缺少SQL查询接口' || 结果.状态 === 'SQLite未就绪');
}

/**
 * 对“查询接口暂时隐藏／SQLite runtime 尚在重建”做有界复检。调用者负责在每次检测前
 * 刷新自身缓存；达到上限后原样返回最后一次失败，绝不把未就绪伪装成成功。
 */
export async function 等待数据库脚本写入能力稳定(
  检测: () => Promise<数据库脚本写入能力结果>,
  选项: 数据库脚本写入复检选项 = {},
): Promise<数据库脚本写入能力结果> {
  const 最大尝试次数 =
    typeof 选项.最大尝试次数 === 'number' && Number.isFinite(选项.最大尝试次数)
      ? Math.max(1, Math.min(50, Math.floor(选项.最大尝试次数)))
      : 1;
  const 复检间隔毫秒 =
    typeof 选项.复检间隔毫秒 === 'number' && Number.isFinite(选项.复检间隔毫秒)
      ? Math.max(0, Math.min(5000, Math.floor(选项.复检间隔毫秒)))
      : 750;
  const 当前仍有效 = 选项.当前仍有效 ?? (() => true);
  const 等待 =
    选项.等待 ??
    ((毫秒: number) =>
      new Promise<void>(resolve => {
        setTimeout(resolve, 毫秒);
      }));
  let 最后结果: 数据库脚本写入能力结果 | null = null;

  for (let 尝试次数 = 1; 尝试次数 <= 最大尝试次数; 尝试次数 += 1) {
    if (最后结果 && !当前仍有效()) return 最后结果;
    await 选项.每次检测前?.(尝试次数);
    const 结果 = await 检测();
    最后结果 = 结果;
    if (!数据库脚本写入能力可复检(结果) || 尝试次数 >= 最大尝试次数 || !当前仍有效()) return 结果;
    await 等待(复检间隔毫秒);
  }

  return 最后结果!;
}

/**
 * RQ_剧情事件等脚本直写表只能走 SQLite mutation。这里把静态 API 能力与
 * “当前 SQLite 运行时确实可查询”合并成一个权威判定，供首次准备页和回合写入共用。
 */
export function 判定数据库脚本写入能力(
  能力: 数据库脚本写入静态能力,
  SQLite已启用: boolean,
): 数据库脚本写入能力结果 {
  if (!能力.已安装) {
    return { 可写: false, 状态: '数据库未安装', 说明: '未检测到数据库插件。' };
  }
  if (!能力.已装游戏模板) {
    return { 可写: false, 状态: '游戏模板未安装', 说明: '当前聊天尚未安装《人妻公寓》的五张游戏记忆表。' };
  }
  if (!能力.有SQL写入接口) {
    return {
      可写: false,
      状态: '缺少SQL写入接口',
      说明: '当前数据库版本未提供脚本安全写入接口，请更新数据库插件后重新检测。',
    };
  }
  if (!能力.有SQL接口) {
    return {
      可写: false,
      状态: '缺少SQL查询接口',
      说明: 'SQLite 查询接口尚未就绪，可能未开启 SQLite（SQL）或当前数据库版本不支持。',
    };
  }
  if (!SQLite已启用) {
    return {
      可写: false,
      状态: 'SQLite未就绪',
      说明: 'SQLite（SQL）尚未开启或运行时未就绪；请在数据库设置中切换后重新检测。',
    };
  }
  return {
    可写: true,
    状态: '就绪',
    说明: 'SQLite（SQL）已就绪，RQ_剧情事件可以由游戏脚本安全写入。',
  };
}
