import { Schema, type SchemaType } from '../../../schema';
import type { 门牌 } from '../../../stageConfig';
import { 户静态表, 门牌列表 } from '../../../stageConfig';
import { 当前时段, 取绝对时段 } from '../楼层时钟';
import { 妻状态包 } from '../snapshotSystem';
import { 读最近有效stat } from '../mvuIO';
import { 创建手机时间线租约, 手机时间线租约仍有效 } from '../手机时间线租约';
import { 等待场景剧情阻塞当前场景, 读取活动场景剧情, 读取队首场景剧情 } from '../场景剧情事务';
import {
  构造冷落预警去重键,
  计算妻冷落消息档,
  冷落私聊方向,
  冷落语义指纹,
  余波有冻结效力,
} from '../冷落系统';
import { 构造微信联系保护表 } from '../微信每日联系';
import type { 微信库 } from './数据层';
import { 读库, 手机可见单条硬上限, 私聊节拍键, 写库增量 } from './数据层';
import { 人设段 } from './配置';
import { 称呼纪律, 家庭事实, 口吻纪律, 小生成, 微信短文本 } from './生成引擎';
import { 微信好友 } from './通知桥';
import { 请求手机重绘, 请求刷新手机红点 } from './UI刷新';
import { 当前聊天ID, 当前手机绝对时段, 末楼 } from './运行时上下文';

/**
 * 冷落预警（拆分方案 P5）：冷落指纹/档/候选、扫描私聊、语义租约与单拍一户口径。
 * 只从叶子模块取值，不 import 内核/门面；内核发送流程经这里验冷落语义。
 */

export type 冷落指纹 = NonNullable<ReturnType<typeof 冷落语义指纹>>;
type 冷落档 = Exclude<ReturnType<typeof 计算妻冷落消息档>, 0>;

interface 冷落预警候选 {
  门牌: 门牌;
  档: 冷落档;
  冷落钟楼数: number;
  指纹: 冷落指纹;
  键: string;
}

function 取指纹冷落钟楼数(data: SchemaType, 门牌号: 门牌, 钟: number, 指纹: 冷落指纹): number {
  // 冷落系统新版可直接把跨度带在指纹上；旧签名则集中在这里回读成长账，
  // 手机其余代码不猜 schema 路径。
  const API跨度 = Number((指纹 as 冷落指纹 & { 冷落钟楼数?: number }).冷落钟楼数);
  if (Number.isFinite(API跨度)) return Math.max(0, Math.floor(API跨度));
  const 上次成长钟楼 = Number(_.get(data.户[门牌号], '妻._成长账.上次有效成长钟楼'));
  return Number.isFinite(上次成长钟楼) ? Math.max(0, Math.floor(钟 - 上次成长钟楼)) : 0;
}

export function 冷落指纹相同(a: 冷落指纹, b: 冷落指纹): boolean {
  return (
    a.成长轮次 === b.成长轮次 &&
    a.当前档 === b.当前档 &&
    a.余波状态 === b.余波状态 &&
    a.冷落周期锚 === b.冷落周期锚
  );
}

export function 扫描冷落私聊(
  data: SchemaType,
  库: 微信库,
  楼: number,
  钟: number,
): {
  冷落中门牌: Set<门牌>;
  待发候选: 冷落预警候选[];
} {
  const 冷落中门牌 = new Set<门牌>();
  const 待发候选: 冷落预警候选[] = [];
  const 微信联系保护 = 构造微信联系保护表(库.消息, 钟);
  const 妻好友 = new Set(
    微信好友(data)
      .filter(好友 => 好友.类 === '妻')
      .map(好友 => 好友.id),
  );

  for (const 门牌号 of 门牌列表) {
    const 节点 = data.户[门牌号];
    const 配 = 户静态表[门牌号];
    if (!节点 || !妻好友.has(门牌号) || (配.隐身 && !data.系统._母亲入列)) continue;
    const 档 = 计算妻冷落消息档(data, 门牌号, 微信联系保护);
    // 仍具冷落资格的安抚中不再发催促预警，但关系尚未恢复，普通暧昧/热络主动私聊继续压住。
    // 阶段0/1或未入列302的遗留余波已经失效，不能在下一次结算清账前短暂屏蔽普通私聊。
    if (档 === 0) {
      if (余波有冻结效力(门牌号, 节点.妻, data.系统._母亲入列)) 冷落中门牌.add(门牌号);
      continue;
    }
    冷落中门牌.add(门牌号);

    const 指纹 = 冷落语义指纹(data, 门牌号, 微信联系保护);
    if (!指纹) continue;
    const 键 = 构造冷落预警去重键(门牌号, 指纹.成长轮次, 档, 指纹.冷落周期锚);
    // rq0.83 旧键没有周期锚：仅当本轮锚仍等于真实成长时点时兼容识别，避免更新后
    // 同一冷落周期重复推送；微信已经开启新周期后绝不能让旧键压住新的合法预警。
    const 上次成长锚 = Number.isFinite(节点.妻._成长账.上次有效成长钟楼)
      ? Math.floor(节点.妻._成长账.上次有效成长钟楼)
      : -1;
    const 兼容旧键 = 指纹.冷落周期锚 === 上次成长锚 ? `冷落:${门牌号}:${指纹.成长轮次}:${档}` : '';
    const 已发 = 库.消息.some(
      消息 => (消息.键 === 键 || (兼容旧键 !== '' && 消息.键 === 兼容旧键)) && 消息.楼 <= 楼,
    );
    if (已发) continue;
    待发候选.push({
      门牌: 门牌号,
      档,
      冷落钟楼数: 取指纹冷落钟楼数(data, 门牌号, 钟, 指纹),
      指纹,
      键,
    });
  }

  待发候选.sort((a, b) => b.档 - a.档 || b.冷落钟楼数 - a.冷落钟楼数 || a.门牌.localeCompare(b.门牌));
  return { 冷落中门牌, 待发候选 };
}

export function 当前冷落指纹(门牌号: 门牌): 冷落指纹 | null {
  const rawStat = 读最近有效stat();
  if (!rawStat) return null;
  try {
    const data = Schema.parse(rawStat) as SchemaType;
    if (!data.户[门牌号]) return null;
    return 冷落语义指纹(data, 门牌号, 构造微信联系保护表(读库().消息, 当前手机绝对时段()));
  } catch {
    return null;
  }
}

let 冷落预警进行中 = false;
let 冷落预警待补 = false;

/**
 * 冷落预警是玩法预示，不受普通手机内容频率总闸影响。它只写 chat 级微信库，
 * 不修改 MVU 成长或安抚进度；一拍最多选一户。
 */
export async function 冷落预警节拍(): Promise<void> {
  if (冷落预警进行中) {
    冷落预警待补 = true;
    return;
  }
  冷落预警进行中 = true;
  try {
    const rawStat = 读最近有效stat();
    if (!rawStat) return;
    const data = Schema.parse(rawStat) as SchemaType;
    if (data.系统._坏结局 || data.系统._特殊场景.id) return;
    // 活动剧情、同场等待票与目标未知的旧票都不能让预警私聊抢生成通道；明确在远处
    // 等待的结构票不占当前场景，不能让冷落预警永久沉默。
    const 活动场景剧情 = 读取活动场景剧情(data);
    const 等待剧情 = 读取队首场景剧情(data.系统._待发送事件);
    let 当前场景: string | null = null;
    try {
      当前场景 = (_.get(getVariables({ type: 'chat' }), '_场景.房间id') as string | null | undefined) ?? null;
    } catch {
      /* 聊天场景不可读时只用活动票硬门；结构票不会被猜成已经到场。 */
    }
    if (活动场景剧情 || 等待场景剧情阻塞当前场景(等待剧情, 当前场景)) return;

    const 楼 = 末楼();
    const 钟 = 取绝对时段(data);
    const 时间线租约 = 创建手机时间线租约(当前聊天ID(), 楼, SillyTavern.chat ?? [], 钟);
    if (!时间线租约) return;
    const 时间线仍有效 = () =>
      手机时间线租约仍有效(时间线租约, 当前聊天ID(), SillyTavern.chat ?? [], 当前手机绝对时段());
    const 库 = 读库();
    const 候选 = 扫描冷落私聊(data, 库, 楼, 钟).待发候选[0];
    if (!候选) return;

    const { 门牌: 门牌号, 档, 指纹, 键 } = 候选;
    const 配 = 户静态表[门牌号];
    const 唯一方向 = 冷落私聊方向(门牌号, 档);
    const 冷落语义仍有效 = (): boolean => {
      if (!时间线仍有效()) return false;
      const 当前指纹 = 当前冷落指纹(门牌号);
      return !!当前指纹 && 冷落指纹相同(指纹, 当前指纹);
    };

    const 原文 = await 小生成(
      '你替一款都市题材游戏生成一条中国已婚女性发给公寓管理员的微信私聊。只输出消息文本(口语,可含emoji),不要引号。' +
        '这是一条关系受冷的预警：只执行本次给出的唯一方向，不得自选其他情绪阶段。禁止照片，禁止撤回，不提数值、天数、下降、档位或系统规则，不得声称对方已经回复或当面解释。',
      `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${家庭事实(门牌号)}${妻状态包(门牌号, data)}${await 人设段(门牌号)}` +
        `时段:${当前时段(钟)}。本条唯一消息方向:${唯一方向}。${称呼纪律()}${口吻纪律}`,
    );
    const 合法私聊 = await 微信短文本(原文, 手机可见单条硬上限, `${配.妻名}的冷落预警私聊`, [配.妻名]);
    // 第一道语义租约：AI返回时已经当面成长、升档或进入安抚，旧消息立即丢弃。
    if (!合法私聊 || !冷落语义仍有效()) return;

    const 已写 = await 写库增量(
      {
        新圈: [],
        新消息: [{ 楼, 时: 钟, 会话: 门牌号, 发: '对方', 文: 合法私聊, 键 }],
        节拍改: { [私聊节拍键(门牌号)]: 钟 },
      },
      // 第二道语义租约：在 updateVariablesWith 真正提交回调内再读一次 MVU。
      冷落语义仍有效,
    );
    if (!已写) return;
    请求刷新手机红点();
    请求手机重绘();
  } catch (e) {
    console.error('[人妻公寓·手机] 冷落预警节拍失败:', e);
  } finally {
    冷落预警进行中 = false;
    if (冷落预警待补) {
      冷落预警待补 = false;
      void 冷落预警节拍();
    }
  }
}
