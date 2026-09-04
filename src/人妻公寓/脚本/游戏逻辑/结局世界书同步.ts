import type { SchemaType } from '../../schema';
import { 共居阶段世界书条目名, 同步302阶段世界书 } from './302共居世界书';

/** 兼容旧导出；当前只允许一条聊天级阶段投影，不再创建第二个结局世界书条目。 */
export const 结局世界书条目名 = 共居阶段世界书条目名;
export const 结局世界书标记 = 'rqgy-current-ending-stage-v1' as const;
export function 同步结局世界书条目(data: SchemaType, 仍有效: () => boolean = () => true): Promise<boolean> {
  return 同步302阶段世界书(data, 仍有效, true);
}
