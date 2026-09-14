import { 读配置 } from './配置';
import { 数据库状态, 通过数据库生成 } from '../数据库桥';
import { 全局数据库AI租约 } from '../数据库AI租约';
import { 取得手机生成租约 } from '../生成通道互斥';
import { 请求自然对话观察, 最终观察文本 } from '../自然对话接入';
import { 分离自然对话观察, 自然对话观察指令, type 对话观察请求 } from '../自然对话观察';

/** 与手机现有来源选择一致；一次调用失败不切换模型重试。凭证只在当前调用内使用。 */
export async function 请求手机对话观察(请求: 对话观察请求, 信号: AbortSignal): Promise<unknown> {
  if (全局数据库AI租约.在结算()) throw new Error('数据库AI仍在结算');
  const 租约 = 取得手机生成租约();
  if (!租约) throw new Error('正文通道正在使用');
  let 停止: () => void = () => undefined;
  try {
    if (信号.aborted) throw new Error('识别已取消');
    const 调用 = async () => {
      const c = 读配置();
      if (c.ai来源 === '自定义') {
        if (!c.base || !c.key || !c.model) throw new Error('手机自定义模型配置不完整');
        return 请求自然对话观察(请求, 信号, { custom_api: {
          apiurl: c.base.trim().replace(/\/+$/u, ''), key: c.key, model: c.model,
          max_tokens: 8192, temperature: 0.1, source: 'openai',
        } });
      }
      if (c.ai来源 !== '正文' && 数据库状态().可调用AI) {
        const raw = await 通过数据库生成([{ role: 'system', content: 自然对话观察指令 },
          { role: 'user', content: JSON.stringify(请求) }], '', 8192);
        return 分离自然对话观察(最终观察文本(raw)).观察;
      }
      if (c.ai来源 === '数据库') throw new Error('手机选择的数据库模型不可用');
      return 请求自然对话观察(请求, 信号);
    };
    return await Promise.race([调用(), new Promise<never>((_, reject) => {
      停止 = () => reject(new Error('识别已取消'));
      信号.addEventListener('abort', 停止, { once: true });
    })]);
  } finally { 信号.removeEventListener('abort', 停止); 租约.释放(); }
}
