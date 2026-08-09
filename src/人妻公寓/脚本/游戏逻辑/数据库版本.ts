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
  return 树.flatMap(item => (item.type === 'folder' ? 展平脚本(item.scripts ?? []) : [item]));
}

/** 从酒馆助手全局脚本的安装 URL（优先）或脚本说明中读取数据库版本。 */
export function 提取数据库脚本版本(树: readonly 酒馆脚本[]): string {
  const 候选 = 展平脚本(树).filter(item => {
    if (item.enabled === false) return false;
    const 文本 = `${item.name ?? ''}\n${item.info ?? ''}\n${item.content ?? ''}`;
    return /数据库|database|shujuku|AutoCardUpdaterAPI|autoCardUpdaterAPI|__ACU_STAR_DB_III_LOADED__/i.test(文本);
  });

  for (const 脚本 of 候选) {
    const 文本 = `${脚本.name ?? ''}\n${脚本.info ?? ''}\n${脚本.content ?? ''}`;
    const 地址版本 = 文本.match(/https?:\/\/[^\s'"]+@(?:spv|v)?(\d+(?:\.\d+){1,3})(?=[/)'"\s]|$)/i)?.[1];
    if (地址版本) return 地址版本;
  }
  for (const 脚本 of 候选) {
    const 文本 = `${脚本.name ?? ''}\n${脚本.info ?? ''}\n${脚本.content ?? ''}`;
    const 标注版本 = 文本.match(/(?:版本|version|(?:^|[\s·_-])(?:spv|v))\s*[:：]?\s*(\d+(?:\.\d+){1,3})/im)?.[1];
    if (标注版本) return 标注版本;
  }
  return '';
}
