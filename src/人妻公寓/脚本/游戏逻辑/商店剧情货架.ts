import type { SchemaType } from '../../schema';
import type { 道具配置 } from '../../stageConfig';
import { 许曼君分居任务ID, 许曼君分居已上架 } from './许曼君分居系统';
import { 许曼君离婚商品ID, 许曼君离婚商店已上架 } from './许曼君离婚系统';
import { 安若妍不必停商品ID, 安若妍不必停商店已上架 } from './安若妍不必停系统';
import { 安若妍换掉商品ID, 安若妍换掉商店已上架 } from './安若妍换掉系统';

/**
 * 四件已经实现的剧情商品共用上架事实，不导入宿主商店或注册业务监听。
 * null表示不属于本模块，继续原货架规则；不能把其他零价证物当成免费商品。
 * 这里只决定上架，不替代购买时的资金、临时互斥与最终事务校验。
 */
export function 剧情商品货架可见(
  data: SchemaType,
  商品: Pick<道具配置, 'id' | '价格'>,
): boolean | null {
  if (商品.id === 许曼君分居任务ID) return 许曼君分居已上架(data);
  const 有价格 = (商品.价格 ?? 0) > 0;
  if (商品.id === 许曼君离婚商品ID) return 有价格 && 许曼君离婚商店已上架(data);
  if (商品.id === 安若妍不必停商品ID) return 有价格 && 安若妍不必停商店已上架(data);
  if (商品.id === 安若妍换掉商品ID) return 有价格 && 安若妍换掉商店已上架(data);
  return null;
}
