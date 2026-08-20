interface 酒馆脚本 {
  type?: string;
  enabled?: boolean;
  name?: string;
  content?: string;
  info?: string;
  data?: unknown;
  scripts?: 酒馆脚本[];
}
function 展平脚本(树: readonly 酒馆脚本[]): 酒馆脚本[] {
  return 树.flatMap(item => {
    // 文件夹关闭代表整棵子树不参与运行；子脚本即使仍残留 enabled:true，也不能被
    // 版本检测当成当前启用实例，否则旧归档会遮住真正运行的数据库版本。
    if (item.type === 'folder') return item.enabled === false ? [] : 展平脚本(item.scripts ?? []);
    return [item];
  });
}

function 脚本文本(脚本: 酒馆脚本): string {
  return `${脚本.name ?? ''}\n${脚本.info ?? ''}\n${脚本.content ?? ''}`;
}

function 从候选读取版本(候选: readonly 酒馆脚本[]): string {
  for (const 脚本 of 候选) {
    const 文本 = 脚本文本(脚本);
    const 地址版本 = 文本.match(/https?:\/\/[^\s'"]+@(?:spv|v)?(\d+(?:\.\d+){1,3})(?=[/)'"\s]|$)/i)?.[1];
    if (地址版本) return 地址版本;
  }
  for (const 脚本 of 候选) {
    const 文本 = 脚本文本(脚本);
    const 标注版本 = 文本.match(
      /(?:版本|version|(?:^|[\s·_-])(?:spv|v))\s*[:：]?\s*(\d+(?:\.\d+){1,3})(?![\d.A-Za-z_+-])/im,
    )?.[1];
    if (标注版本) return 标注版本;
  }
  return '';
}

/** 从酒馆助手全局脚本的安装 URL（优先）或脚本说明中读取数据库版本。 */
export function 提取数据库脚本版本(树: readonly 酒馆脚本[]): string {
  const 候选 = 展平脚本(树).filter(item => {
    if (item.enabled === false) return false;
    return /数据库|database|shujuku|AutoCardUpdaterAPI|autoCardUpdaterAPI|__ACU_STAR_DB_III_LOADED__/i.test(脚本文本(item));
  });
  const 强身份正则 = /(?:AlbusKen\/shujuku|\bshujuku\b|AutoCardUpdaterAPI|autoCardUpdaterAPI|__ACU_STAR_DB_III_LOADED__)/i;
  const 强身份候选 = 候选.filter(脚本 => 强身份正则.test(脚本文本(脚本)));
  const 强身份版本 = 从候选读取版本(强身份候选);
  if (强身份版本) return 强身份版本;
  return 从候选读取版本(候选.filter(脚本 => !强身份候选.includes(脚本)));
}
