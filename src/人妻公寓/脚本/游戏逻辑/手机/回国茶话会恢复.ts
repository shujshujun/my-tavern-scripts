import { 读取, 排队MVU操作, 脚本写入, 登记MVU提交校验 } from '../mvuIO';
import { 捕获保护快照 } from '../守护系统';
import { 手机锚消息签名, 读取当前手机时间线租约世代 } from '../手机时间线租约';
import { 提交回国茶话会批次, type 回国茶话会批次提交 } from '../回国系统';
import { 验收回国茶话会实存 } from './回国茶话会验收';
import { 读库, type 微信消息 } from './数据层';
import { 当前聊天ID } from './运行时上下文';
import { 补取最新群聊进度 } from './群聊进度补取';

/** 刷新时只补交仍在当前分支的完整新协议批次；不重新生成，不从历史台词猜测进度。 */
export async function 恢复回国茶话会主状态(手动识别 = false): Promise<boolean> {
  const 聊天ID = 当前聊天ID();
  const 世代 = 读取当前手机时间线租约世代();
  await 补取最新群聊进度(手动识别);
  return 排队MVU操作(async () => {
    if (当前聊天ID() !== 聊天ID || 读取当前手机时间线租约世代() !== 世代) return false;
    const { raw, data } = 读取();
    if (data.系统._回国.阶段 !== '姐妹茶话会进行中') return false;
    const 消息 = 读库().消息;
    const 批次们 = new Map<string, 微信消息[]>();
    for (const 项 of 消息) {
      if (项.会话 !== '姐妹群' || (项.发 !== '对方' && !项.事件进度?.待确认发言) || !项.事件进度 ||
        !项.键?.startsWith('回国茶话会:') || !项.锚签名 ||
        项.时 > data.系统._绝对时段 || 项.楼 < 0 || 项.楼 >= (SillyTavern.chat ?? []).length ||
        手机锚消息签名(SillyTavern.chat[项.楼]) !== 项.锚签名) continue;
      const 键 = 项.键.replace(/:\d+$/u, '');
      const 批次 = 批次们.get(键) ?? [];
      批次.push(项);
      批次们.set(键, 批次);
    }
    let 变动 = false;
    // 同一任务只看最新批次。后续转题或尚未识别时，不能重放更早的同意。
    const 最新任务批次 = new Map<string, 微信消息[]>();
    for (const 批次 of 批次们.values()) 最新任务批次.set(`${批次[0].事件进度!.任务}:${批次[0].事件进度!.目标}`, 批次);
    for (const 批次 of 最新任务批次.values()) {
      const 首 = 批次[0];
      const 进度 = 首.事件进度!;
      const 玩家已发言 = 消息.slice(0, 消息.indexOf(首)).some(项 =>
        项.会话 === '姐妹群' && 项.发 === '我' && 项.类 !== '撤回' && 项.楼 === 首.楼 && 项.时 === 首.时);
      if (进度.任务 !== '改名反应' && !玩家已发言) continue;
      const 提交: 回国茶话会批次提交 = {
        任务: 进度.任务 as 回国茶话会批次提交['任务'], 目标: 进度.目标,
        回应成员: 进度.任务 === '回应回国' ? 进度.目标.split(',') : [], 玩家已发言,
        摘要: 批次.map(项 => 项.文).join('\n').slice(0, 1200),
      };
      if (!验收回国茶话会实存(批次, 提交, SillyTavern.name1, data.系统._回国.茶话会成员快照)) continue;
      const 结果 = 提交回国茶话会批次(data, 提交, 批次, SillyTavern.name1);
      变动 ||= Boolean(结果.成功 && 结果.变动);
    }
    const 消息签名 = JSON.stringify(消息);
    const 仍有效 = () => 当前聊天ID() === 聊天ID && 读取当前手机时间线租约世代() === 世代 &&
      JSON.stringify(读库().消息) === 消息签名 && [...批次们.values()].every(批次 =>
        批次.every(项 => 手机锚消息签名(SillyTavern.chat?.[项.楼]) === 项.锚签名));
    if (!变动 || !仍有效()) return false;
    const 解除校验 = 登记MVU提交校验(仍有效);
    try { await 脚本写入(raw, data, { 记录成长: false, 当前绝对时段: data.系统._绝对时段 }); }
    finally { 解除校验(); }
    捕获保护快照(data);
    return true;
  });
}
