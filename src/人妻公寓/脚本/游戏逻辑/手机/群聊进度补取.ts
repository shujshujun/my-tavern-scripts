import { 读库, 修改微信消息容器, 立即持久保存手机聊天变量, type 微信消息 } from './数据层';
import { 当前聊天ID } from './运行时上下文';
import { 手机锚消息签名, 读取当前手机时间线租约世代 } from '../手机时间线租约';
import { 新建对话观察记录, 识别已保存对话 } from '../自然对话观察';
import { 请求手机对话观察 } from './对话观察路由';
import { 规范手机事件进度, type 手机事件进度 } from '../手机事件进度';
import { 复核群聊知情范围 } from './群聊知情复核';

const 请求中 = new Map<string, Promise<void>>();
const 消息签名 = (消息: 微信消息[]) => JSON.stringify(消息);

async function 恢复待确认发言(聊天: string, 手动: boolean): Promise<boolean> {
  const 全部 = 读库().消息;
  const 尾 = 全部.filter(项 => 项.会话 === '姐妹群' && 项.类 !== '撤回').at(-1);
  const 待确认 = 尾?.事件进度?.待确认发言;
  if (!待确认) return true;
  if (!手动 || !尾?.键?.startsWith('回国茶话会:') || !尾.锚签名 ||
    !Array.isArray(待确认.消息) || !待确认.消息.length || 待确认.消息.length > 4 ||
    !待确认.消息.every(文 => typeof 文 === 'string' && 文.length <= 1000) || typeof 待确认.上下文 !== 'string') return false;
  const 签名 = 消息签名(全部), 世代 = 读取当前手机时间线租约世代();
  const 仍有效 = () => 当前聊天ID() === 聊天 && 读取当前手机时间线租约世代() === 世代 &&
    消息签名(读库().消息) === 签名 && 手机锚消息签名(SillyTavern.chat?.[尾.楼]) === 尾.锚签名;
  if (!仍有效()) return false;
  const 复核 = await 复核群聊知情范围(待确认.消息, '回国茶话会', 待确认.上下文, 仍有效);
  if (!复核.已确认 || !仍有效()) return false;
  const 原进度 = 尾.事件进度!;
  const 进度 = { ...规范手机事件进度(null, 原进度.任务, 原进度.目标, 复核.消息), 观察要求: 原进度.观察要求 };
  const 已写 = await 修改微信消息容器(消息 => {
    if (消息签名(消息) !== 签名) return null;
    let 序 = Math.max(0, ...消息.map(项 => Number.isSafeInteger(项.序) ? 项.序! : 0));
    return 消息.flatMap(项 => 项.键 !== 尾.键 ? [项] : 复核.消息.map((文, i) => ({
      ...项, 发: '对方' as const, 文, 序: ++序, 键: 尾.键!.replace(/:\d+$/u, `:${i + 1}`), 事件进度: { ...进度 },
    })));
  }, 聊天, 仍有效);
  if (已写) await 立即持久保存手机聊天变量(聊天);
  return 已写;
}

/** 网络请求不占 MVU 写队列。只补取最新实存批次，回复和整段 RP 均不重新生成。 */
export function 补取最新群聊进度(手动 = false): Promise<void> {
  const 聊天 = 当前聊天ID();
  const 已有 = 请求中.get(聊天);
  if (已有) return 已有;
  const 工作 = Promise.resolve().then(async () => {
    if (!await 恢复待确认发言(聊天, 手动)) return;
    const 全部 = 读库().消息;
    const 群聊 = 全部.filter(项 => 项.会话 === '姐妹群' && 项.类 !== '撤回');
    const 尾 = 群聊.at(-1);
    const 进度 = 尾?.事件进度;
    if (!尾?.键?.startsWith('回国茶话会:') || !进度 || 进度.状态 !== '未知' ||
      !进度.观察要求 || (!手动 && 进度.自动识别已尝试)) return;
    const 批次键 = 尾.键.replace(/:\d+$/u, '');
    const 批次 = 群聊.filter(项 => 项.键?.replace(/:\d+$/u, '') === 批次键);
    if (批次.length !== 进度.消息总数 || !批次.every(项 => 项.锚签名 &&
      手机锚消息签名(SillyTavern.chat?.[项.楼]) === 项.锚签名)) return;
    const 世代 = 读取当前手机时间线租约世代();
    let 原签名 = 消息签名(全部);
    const 仍有效 = () => 当前聊天ID() === 聊天 && 读取当前手机时间线租约世代() === 世代 &&
      消息签名(读库().消息) === 原签名 && 批次.every(项 => 手机锚消息签名(SillyTavern.chat?.[项.楼]) === 项.锚签名);
    const 写进度 = async (值: 手机事件进度) => {
      let 下一签名 = 原签名;
      const 已写 = await 修改微信消息容器(消息 => {
        if (消息签名(消息) !== 原签名) return null;
        const 新消息 = 消息.map(项 => 批次.some(原 => 原.键 === 项.键)
          ? { ...项, 事件进度: { ...值 } } : 项);
        下一签名 = 消息签名(新消息);
        return 新消息;
      }, 聊天, 仍有效);
      if (已写) { 原签名 = 下一签名; await 立即持久保存手机聊天变量(聊天); }
      return 已写;
    };
    if (!await 写进度({ ...进度, 自动识别已尝试: true, 识别错误: '进度识别进行中；中断后可手动重试' })) return;
    const 首位置 = 群聊.indexOf(批次[0]);
    const 玩家消息 = 群聊.slice(0, 首位置).filter(项 => 项.发 === '我' && 项.楼 === 尾.楼 && 项.时 === 尾.时).slice(-6);
    const 记录 = 新建对话观察记录({
      版本: 1, 类别: '群聊进度', 事件: 进度.任务, 阶段: `${进度.任务}:${进度.目标}`,
      分支: `${聊天}:${世代}:${尾.锚签名}`, 批次: 批次键, 要求: 进度.观察要求,
      消息: [
        ...玩家消息.map((项, i) => ({ id: `${批次键}:player:${i}`, 来源: '玩家' as const, 文本: 项.文 })),
        ...批次.map((项, i) => ({ id: `${批次键}:character:${i}`, 来源: '角色' as const, 文本: 项.文 })),
      ],
    });
    await 识别已保存对话(记录, 请求手机对话观察, 仍有效);
    if (!仍有效()) return;
    if (!记录.结果) {
      await 写进度({ ...进度, 自动识别已尝试: true, 识别错误: 记录.错误 || '进度尚未识别' });
      return;
    }
    const 结果 = 记录.结果;
    const 玩家意向 = 结果.意向 === '转题' ? '转移话题' : 结果.意向;
    const 状态 = 结果.状态 === '完成' ? '完成' : ['暂缓', '拒绝', '转移话题'].includes(玩家意向) ? 玩家意向 : '继续';
    const 新进度 = 规范手机事件进度({
      任务: 进度.任务, 目标: 进度.目标, 状态, 玩家意向,
      依据: 结果.依据.filter(引用 => 引用.消息.includes(':character:')).map(引用 => 引用.原文),
    }, 进度.任务, 进度.目标, 批次.map(项 => 项.文));
    await 写进度({ ...新进度, 观察要求: 进度.观察要求, 自动识别已尝试: true,
      识别错误: 新进度.状态 === '未知' ? '进度引用未通过校验，可重新识别' : '' });
  }).finally(() => { if (请求中.get(聊天) === 工作) 请求中.delete(聊天); });
  请求中.set(聊天, 工作);
  return 工作;
}
