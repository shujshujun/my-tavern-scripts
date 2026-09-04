import type { SchemaType } from '../../../schema';
import type { 微信库 } from './数据层';

/**
 * 兼容门面：手机硬反馈已经由 `手机/节拍引擎.ts` 的真实增量事务唯一生产。
 * 保留旧导出只为使热模块安全降级；调用它不会再写第二份朋友圈或私聊。
 */
export type 母亲共居手机拍结果 = '无新' | '有新' | '中止';
export interface 母亲共居手机上下文 {
  data: SchemaType;
  库: 微信库;
  楼: number;
  钟: number;
  时间线仍有效: () => boolean;
}
export function 母亲共居手机必达拍(_上下文: 母亲共居手机上下文): Promise<母亲共居手机拍结果> {
  return Promise.resolve('无新');
}
