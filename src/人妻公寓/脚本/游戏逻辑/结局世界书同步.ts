import type { SchemaType } from '../../schema';
import { 共居阶段世界书条目名, 构造302阶段世界书投影 } from './302共居世界书';
import { 构造201阶段世界书投影 } from './201离婚世界书';
import { 构造301阶段世界书投影 } from './301换掉世界书';
import { 构造其他角色阶段世界书投影 } from './其他角色阶段世界书';
import { 同步阶段世界书投影, 作废阶段世界书缓存 } from './阶段世界书同步器';

/** 保留旧标识供既有调用者识别；六户使用各自稳定条目名。 */
export const 结局世界书条目名 = 共居阶段世界书条目名;
export const 结局世界书标记 = 'rqgy-current-ending-stage-v1' as const;
export function 同步全部角色阶段世界书(data: SchemaType, 仍有效: () => boolean = () => true, 强制 = false): Promise<boolean> {
  try {
    return 同步阶段世界书投影([
      构造201阶段世界书投影(data), 构造302阶段世界书投影(data), 构造301阶段世界书投影(data),
      ...构造其他角色阶段世界书投影(data),
    ], 仍有效, 强制);
  } catch (error) {
    console.warn('[人妻公寓·阶段世界书] 当前投影等待重建：', error);
    return Promise.resolve(false);
  }
}
export function 作废全部角色阶段世界书缓存(): void {
  作废阶段世界书缓存();
}
export function 同步结局世界书条目(data: SchemaType, 仍有效: () => boolean = () => true): Promise<boolean> {
  return 同步全部角色阶段世界书(data, 仍有效, true);
}
