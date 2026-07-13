import type { SchemaType } from '../../schema';
import { 查道具 } from '../../stageConfig';
import { 达成里程碑 } from './eventSystem';
import { 读取, 脚本写入 } from './mvuIO';

/**
 * 黑市系统(圣器事件解锁)
 *
 * 触发:与玛尔大同场聊满 3 楼(互动楼数≥3)、商店未解锁、当轮无更高优先级事件
 *   → 事件「圣器的下落」:{{user}} 撞见玛尔大变卖圣器 → 她以"销赃渠道开放 + 封口钱"换沉默。
 *   不再是回合数强制事件——玩家不去接近玛尔大,黑市就永远不会出现。
 * 结算:商店.解锁 = true + 奉献金 +50(封口钱) + 司库线里程碑「圣器」直接达成
 *   (里程碑语义与事件正戏完全一致:秘密被你知晓——支持+8+情报可见,当场有奖励感)
 * 购买:攻略类入行囊(快照注入,AI 叙事中自然取用);会议类即时改倒计时。
 */

const 触发互动楼数 = 3;

/** 圣器事件指令(零示例——教训7:给事件骨架与落地结果,不给可抄的模板) */
export function 取圣器指令(data: SchemaType): string | undefined {
  if (data.商店.解锁) return undefined;
  if (data.修女.司库.互动楼数 < 触发互动楼数) return undefined;
  return [
    '【强制事件|圣器的下落】本轮必须上演:{{user}}无意撞见司库玛尔大嬷嬷正私下变卖修道院的圣器(时机与地点由你按当前剧情自然安排:深夜账房、后门小径、库房皆可,不要生硬切场)。',
    '落地结果(必须发生,缺一不可):',
    '- {{user}}确凿知晓了她变卖圣器的秘密',
    '- 她为换取沉默,把她的"销赃渠道"向{{user}}开放,并塞给他一笔封口钱',
    '演出要求:她被撞破的反应要贴人设(慌乱掩饰→意识到瞒不住→用交易换沉默);这是她的软肋也是她的投名状,演"从此是共犯"的质感,禁止演成被拿捏后的谄媚投降。',
  ].join('\n');
}

/** 圣器事件结算(回合引擎在该事件注入的回合结束时调用) */
export function 结算圣器() {
  const { raw, data } = 读取();
  if (data.商店.解锁) return;
  data.商店.解锁 = true;
  data.奉献金 += 50; // 封口钱=黑市启动资金
  脚本写入(raw, data);
  // 里程碑走独立读写(内部含幂等),放在写入后避免互相覆盖
  达成里程碑('司库', '圣器');
  console.info('[禁忌修道院] 圣器事件结算:黑市解锁,封口钱+50');
}

/** 购买(客户端黑市页 eventEmit;校验都在脚本侧,UI 只做展示) */
export function 购买(id: string) {
  const 道具 = 查道具(id);
  if (!道具) return console.warn(`[禁忌修道院] 未知道具:${id}`);
  const { raw, data } = 读取();
  if (!data.商店.解锁 || data.奉献金 < 道具.价) return;
  if (道具.类 === '会议' && data.会议.状态 !== '日常') return;

  data.奉献金 -= 道具.价;
  if (道具.类 === '会议') {
    if (道具.效果 === '提前') data.会议.倒计时 = 1;
    if (道具.效果 === '延缓') data.会议.倒计时 += 6;
  } else if (!data.商店.已购.includes(id)) {
    data.商店.已购.push(id);
  }
  脚本写入(raw, data);
  console.info(`[禁忌修道院] 购入:${道具.名称}(-${道具.价})`);
}

/** 行囊一行(快照注入用;只含攻略类) */
export function 编译行囊(data: SchemaType): string {
  const 行囊 = data.商店.已购.map(查道具).filter(Boolean);
  if (!行囊.length) return '';
  return `【神父的行囊】(剧情中可自然取用):${行囊.map(d => `${d!.名称}(${d!.说明})`).join(';')}`;
}
