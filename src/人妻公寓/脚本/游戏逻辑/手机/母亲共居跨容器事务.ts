import {
  母亲共居已开启,
  提交母亲共居朋友圈反馈,
} from '../302共居系统';
import { 捕获保护快照 } from '../守护系统';
import { 读取, 排队MVU操作, 脚本写入 } from '../mvuIO';
import { 创建手机时间线租约, 手机时间线租约仍有效 } from '../手机时间线租约';
import { 构造朋友圈长期记忆事件键 } from './朋友圈长期记忆';
import { 读库, 朋友圈稳定事件键 } from './数据层';
import { 当前聊天ID, 当前手机绝对时段, 末楼 } from './运行时上下文';

/**
 * 朋友圈与MVU属于两个持久容器。手机记录先成功落库，随后这里把真实存在的当前分支记录
 * 当成收据清除 `_302共居.待反馈事件`；中途失败时不回滚朋友圈，下个手机节拍会幂等补交。
 */
export function 恢复母亲共居朋友圈反馈主状态(): Promise<boolean> {
  const 聊天ID = 当前聊天ID();
  const 楼 = 末楼();
  const 绝对时段 = 当前手机绝对时段();
  const 租约 = 创建手机时间线租约(聊天ID, 楼, SillyTavern.chat ?? [], 绝对时段);
  if (!租约) return Promise.resolve(false);
  const 仍有效 = () =>
    手机时间线租约仍有效(租约, 当前聊天ID(), SillyTavern.chat ?? [], 当前手机绝对时段());

  return 排队MVU操作(async () => {
    if (!仍有效()) return false;
    const { raw, data } = 读取();
    if (!母亲共居已开启(data)) return false;
    const 持久键 = new Set(读库().圈.map(朋友圈稳定事件键).filter(Boolean));
    const 已送达 = data.系统._302共居.待反馈事件
      .filter(事件 => 持久键.has(构造朋友圈长期记忆事件键('302共居', 事件.id)))
      .map(事件 => 事件.id);
    if (!已送达.length || !仍有效()) return false;

    let 变动 = false;
    for (const 事件ID of 已送达) 变动 = 提交母亲共居朋友圈反馈(data, 事件ID) || 变动;
    if (!变动 || !仍有效()) return false;
    await 脚本写入(raw, data, { 记录成长: false, 当前绝对时段: data.系统._绝对时段 });
    if (!仍有效()) return false;
    捕获保护快照(data);
    return true;
  });
}
