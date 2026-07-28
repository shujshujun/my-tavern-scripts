import { defineMvuDataStore } from '@/util/mvu';
import { Schema } from '../../schema';

/**
 * 人妻公寓客户端 Store
 * 固定 0 楼架构:客户端 iframe 常驻 0 楼,最新变量永远在最后一楼——绑定 message_id:-1。
 * 注意(iframe MVU 陷阱):按钮要让 AI 下轮读到的写入,必须直写 message_id=-1,不能靠 store flush。
 */
export const useDataStore = defineMvuDataStore(Schema, {
  type: 'message',
  message_id: -1,
});
