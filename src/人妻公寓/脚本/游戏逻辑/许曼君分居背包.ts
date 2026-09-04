/**
 * @deprecated 四幕版没有分居专属背包物件；正式背包直接读取真实背包数组。
 * 本空投影只为旧调试调用兼容，不应接回生产UI或生成通知／封存袋。
 */
export interface 许曼君分居背包物件 {
  id: string;
  名称: string;
  数量: 1;
  类型: '剧情物件';
  描述: string;
  可直接使用: false;
  使用提示: string;
  权威位置: string;
}

/**
 * 四幕版不再把署名通知或钥匙封存袋交给玩家搬运。
 * 旧本地试玩档会在Schema入口清除两项残留；正式钥匙位置只由管理员室状态与钥匙柜展示。
 */
export function 读取许曼君分居背包物件(_data: unknown): 许曼君分居背包物件[] {
  return [];
}
