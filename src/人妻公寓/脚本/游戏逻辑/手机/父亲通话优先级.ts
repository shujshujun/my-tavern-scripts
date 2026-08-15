import type { SchemaType } from '../../../schema';

type 父亲手机状态 = {
  系统: Pick<SchemaType['系统'], '_待接来电' | '_父亲通话'>;
};

/** 父亲来电是玩家正在处理的强交互；待接、通话与收尾期间都不启动可选的自动手机 AI。 */
export function 父亲通话占用自动节拍(data: 父亲手机状态): boolean {
  const 待接 = data.系统._待接来电;
  const 活动 = data.系统._父亲通话;
  return 待接.期 >= 0 || Boolean(活动.标识 && 活动.期 >= 0);
}
