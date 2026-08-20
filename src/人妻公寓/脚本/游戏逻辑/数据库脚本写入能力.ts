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
