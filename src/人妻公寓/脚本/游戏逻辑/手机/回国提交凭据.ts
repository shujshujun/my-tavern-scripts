import { 手机锚消息签名, type 手机时间线租约 } from '../手机时间线租约';
import type { 微信消息 } from './数据层';

type 消息凭据 = Pick<微信消息, '会话' | '发' | '文' | '楼' | '时' | '键' | '标识'>;

/** 事件总线只传可序列化凭据，不把当前聊天身份误当作旧请求的身份。 */
export interface 回国提交凭据 {
  聊天ID: string;
  世代: number;
  锚楼: number;
  锚签名: string;
  绝对时段: number;
  消息: 消息凭据[];
}

export function 构造回国提交凭据(租约: 手机时间线租约, 消息: readonly 微信消息[]): 回国提交凭据 {
  return {
    聊天ID: 租约.聊天标识,
    世代: 租约.世代,
    锚楼: 租约.锚楼,
    锚签名: 租约.锚消息签名,
    绝对时段: 租约.锚绝对时段,
    消息: 消息.map(({ 会话, 发, 文, 楼, 时, 键, 标识 }) => ({ 会话, 发, 文, 楼, 时, 键, 标识 })),
  };
}

/** 在取得 MVU 写锁后再验一次；缺凭据的旧异步事件失败关闭，持久消息由下一节拍重新签发。 */
export function 回国提交凭据有效(
  原: unknown,
  当前: { 聊天ID: string; 世代: number; 绝对时段: number; 聊天消息: readonly unknown[]; 微信消息: readonly 微信消息[] },
  允许无消息 = false,
): 原 is 回国提交凭据 {
  if (!原 || typeof 原 !== 'object') return false;
  const 票 = 原 as 回国提交凭据;
  if (
    !票.聊天ID ||
    票.聊天ID !== 当前.聊天ID ||
    !Number.isSafeInteger(票.世代) ||
    票.世代 !== 当前.世代 ||
    !Number.isSafeInteger(票.绝对时段) ||
    票.绝对时段 < 0 ||
    票.绝对时段 !== 当前.绝对时段 ||
    !Number.isSafeInteger(票.锚楼) ||
    票.锚楼 < 0 ||
    票.锚楼 >= 当前.聊天消息.length ||
    !票.锚签名 ||
    手机锚消息签名(当前.聊天消息[票.锚楼]) !== 票.锚签名 ||
    !Array.isArray(票.消息) ||
    (!允许无消息 && !票.消息.length)
  )
    return false;
  return 票.消息.every(
    消息 =>
      消息 &&
      typeof 消息.文 === 'string' &&
      Boolean(消息.键 || 消息.标识) &&
      当前.微信消息.some(
        实存 =>
          实存.会话 === 消息.会话 &&
          实存.发 === 消息.发 &&
          实存.文 === 消息.文 &&
          实存.楼 === 消息.楼 &&
          实存.时 === 消息.时 &&
          实存.键 === 消息.键 &&
          实存.标识 === 消息.标识,
      ),
  );
}
