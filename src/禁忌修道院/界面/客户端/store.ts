import { defineMvuDataStore } from '@/util/mvu';
import { Schema } from '../../schema';

/**
 * 禁忌修道院客户端 Store
 * 函数形式 variable_option 确保每个 iframe 获取正确的 message_id。
 * 注意(iframe MVU 陷阱):按钮要让 AI 下轮读到的写入,必须直写 message_id=-1,不能靠 store flush。
 */
export const useDataStore = defineMvuDataStore(Schema, () => ({
  type: 'message',
  message_id: getCurrentMessageId(),
}));
