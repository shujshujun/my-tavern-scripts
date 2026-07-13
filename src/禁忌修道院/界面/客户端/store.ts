import { defineMvuDataStore } from '@/util/mvu';
import { Schema } from '../../schema';

/**
 * 禁忌修道院客户端 Store
 * 固定 0 楼架构:客户端 iframe 常驻 0 楼,但最新变量永远在最后一楼(回合引擎静默落库),
 * 因此绑定 message_id:-1 —— getVariables 每次轮询时动态解析,新楼落库后 500ms 内自动同步。
 * 注意(iframe MVU 陷阱):按钮要让 AI 下轮读到的写入,必须直写 message_id=-1,不能靠 store flush。
 */
export const useDataStore = defineMvuDataStore(Schema, {
  type: 'message',
  message_id: -1,
});
