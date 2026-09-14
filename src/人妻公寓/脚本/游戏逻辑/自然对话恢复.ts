import { 读取, 排队MVU操作, 脚本写入, 登记MVU提交校验 } from './mvuIO';
import { 捕获保护快照 } from './守护系统';
import { 取得前台生成租约 } from './生成通道互斥';
import { 手机锚消息签名, 读取当前手机时间线租约世代 } from './手机时间线租约';
import { 当前聊天ID } from './手机/运行时上下文';
import { 读取自然对话记录, 保存自然对话记录, 请求自然对话观察 } from './自然对话接入';
import { 识别已保存对话, 自然对话可提交 } from './自然对话观察';
import { 提交已保存自然对话 } from './回合引擎';

/** 手动补取只读取原回复；失败不消费事件，不重新生成一段剧情。 */
export async function 恢复已保存自然对话(): Promise<void> {
  const 租约 = 取得前台生成租约();
  if (!租约) { eventEmit('人妻公寓:提示', '当前有内容正在处理，请稍后再识别。'); return; }
  try {
    const 初始 = 读取().data, 记录 = 读取自然对话记录(初始), ctx = 记录?.提交上下文;
    if (!记录 || !ctx || 记录.技术状态 === '已识别') return;
    const 聊天 = 当前聊天ID(), 世代 = 读取当前手机时间线租约世代();
    const 楼层 = getLastMessageId(), 锚 = 手机锚消息签名(SillyTavern.chat[楼层]);
    if (ctx.楼层 !== 楼层) throw new Error('已有后续消息，请在当前对话继续处理原事件。');
    const 仍有效 = () => 当前聊天ID() === 聊天 && 世代 === 读取当前手机时间线租约世代() &&
      getLastMessageId() === 楼层 && 手机锚消息签名(SillyTavern.chat[楼层]) === 锚;
    let 基准 = JSON.stringify(初始);
    记录.技术状态 = '识别中';
    await 排队MVU操作(async () => {
      const { raw, data } = 读取();
      if (!仍有效() || JSON.stringify(data) !== 基准) throw new Error('对话状态已经变化');
      保存自然对话记录(data, 记录);
      const 取消校验 = 登记MVU提交校验(仍有效);
      try { await 脚本写入(raw, data, { 记录成长: false, 同步场景剧情: false }); }
      finally { 取消校验(); }
      基准 = JSON.stringify(读取().data);
    });
    await 识别已保存对话(记录, 请求自然对话观察, 仍有效, { 手动: true });
    await 排队MVU操作(async () => {
      const { raw, data } = 读取();
      if (!仍有效() || JSON.stringify(data) !== 基准) throw new Error('对话状态已经变化，未提交旧结果');
      保存自然对话记录(data, 记录);
      const 提交后 = 自然对话可提交(记录) ? 提交已保存自然对话(data, 记录) : [];
      const 取消校验 = 登记MVU提交校验(仍有效);
      try { await 脚本写入(raw, data, { 记录成长: false, 同步场景剧情: false }); }
      finally { 取消校验(); }
      捕获保护快照(data);
      for (const 工作 of 提交后) await 工作();
      eventEmit('人妻公寓:场景剧情状态');
      eventEmit('人妻公寓:提示', 记录.技术状态 === '已识别' ?
        (自然对话可提交(记录) ? '已根据保存的对话更新进度。' : '已识别；当前话题仍待继续，可按自己的想法回应。') : '回复仍已保存，进度识别暂未成功，可稍后重试。');
    });
  } catch (错误) {
    eventEmit('人妻公寓:提示', 错误 instanceof Error ? 错误.message : '进度恢复失败，原对话仍保留。');
  } finally { 租约.释放(); }
}
