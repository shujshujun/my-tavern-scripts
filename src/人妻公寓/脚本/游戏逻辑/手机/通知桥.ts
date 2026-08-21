import type { SchemaType } from '../../../schema';
import type { 门牌 } from '../../../stageConfig';
import { 户静态表, 门牌列表 } from '../../../stageConfig';
import { 取绝对时段 } from '../楼层时钟';
import { 编译管理任务通知文案 } from '../管理任务通知';
import { 列出待告知孕情, 怀孕微信键, type 怀孕送达凭据 } from '../怀孕系统';
import { 姐妹群成员 } from '../雌竞系统';
import { 已入住微信妻友门牌 } from '../微信好友规则';
import { 创建手机时间线租约, 手机时间线租约仍有效 } from '../手机时间线租约';
import { 创建手机已读时锚, 手机记录晚于已读 } from '../手机已读水位';
import { 家庭计划微信事件键 } from '../家庭计划系统';
import { 是结构化报孕资料 } from '../孕产叙事系统';
import { 列出预产通知, 预产微信键, type 生产通知凭据 } from '../生产系统';
import { 读库, 写库增量, 立即持久保存手机聊天变量, type 微信消息 } from './数据层';
import { 当前手机绝对时段, 当前聊天ID, 末楼 } from './运行时上下文';
import { 请求手机重绘, 请求刷新手机红点 } from './UI刷新';

/**
 * 手机通知桥（拆分方案 P5）：微信好友表、楼务群公开风闻摘要与报修/投诉微信通知。
 * 只从叶子模块取值，不 import 内核/门面；内核内容节拍与 P6 经这里同步确定性楼务通知。
 */

// ============================================
// 好友表(已入住妻子从阶段0起常驻；父亲/楼群常驻)
// ============================================

export function 微信好友(data: SchemaType): { id: string; 名: string; 类: '妻' | '父亲' | '群' }[] {
  const 友: { id: string; 名: string; 类: '妻' | '父亲' | '群' }[] = [{ id: '父亲', 名: '爸', 类: '父亲' }];
  for (const m of 已入住微信妻友门牌(data)) {
    const 配 = 户静态表[m];
    友.push({ id: m, 名: 配.妻名, 类: '妻' });
  }
  // 姐妹茶话会(2026-07-19 用户拍板):阶段3+的太太≥2人自动成群并把{{user}}拉进去;
  // 没有丈夫没有外人=骂战/拌嘴/攀比都在这;楼务群永远和睦(贤妻公开流)
  if (姐妹群成员(data).length >= 2) 友.push({ id: '姐妹群', 名: '姐妹茶话会', 类: '群' });
  友.push({ id: '群', 名: '梧桐里7号楼务群', 类: '群' });
  return 友;
}

// 快照侧联系方式行与这里共用微信好友规则，避免界面和 AI 认知分叉。

// ============================================
// 楼务微信(确定性通知：报修/投诉与公开风闻，不调用 AI、不排队摘要)
// ============================================

type 管理任务 = SchemaType['系统']['_管理考核']['活跃任务'][number];
type 风闻事件 = SchemaType['系统']['_风闻账']['最近事件'][number];

/**
 * 楼务群只得到所有住户都可能观察到的模糊议题。原始事件摘要可能带具体门牌、亲属身份或
 * 私下关系线索，严禁直接进入群聊提示词。
 */
export function 编译楼务群公开风闻摘要(data: SchemaType): string {
  const 事件 = [...data.系统._风闻账.最近事件]
    .filter(item => item.状态 === '活跃')
    .sort((a, b) => b.时段 - a.时段 || a.id.localeCompare(b.id))[0] as 风闻事件 | undefined;
  if (!事件) return '楼里最近对管理员的出入和楼务处理有些议论';
  if (/偷窃|失窃|门禁|安保/.test(`${事件.类型}`)) return '有住户反映家中物品异常，楼里开始议论门禁和管理';
  if (/夜访|深夜/.test(`${事件.类型}`)) return '有住户留意到管理员夜间出入频繁';
  if (/报修|设施|维修/.test(`${事件.类型}`)) return '有住户议论公共设施和报修处理不够及时';
  return '有住户议论管理员与个别住户往来过于频繁';
}

function 是管理通知任务(任务: 管理任务): boolean {
  return (任务.类型 === '报修' || 任务.类型 === '投诉') && !!任务.id && 门牌列表.includes(任务.门牌 as 门牌);
}

/** 硬通知只展示脚本任务的短标签，不把任务字段当提示词或富文本解释。 */
function 管理任务显示文本(原: string, 兜底: string, 最大长度 = 12): string {
  const 文 = String(原 ?? '')
    .replace(/^(?:公共|报修|投诉)[_：:\-\s]*/u, '')
    .replace(/[<>{}()`$#*\\/|]+|\[|\]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 最大长度);
  return 文 || 兜底;
}

/**
 * 报修/投诉的微信只是由 MVU 活跃任务编译出的幂等通知；原始任务始终是唯一真相。
 * 不调用 AI、不排队摘要，也不反向解析气泡来修改任务。
 */
export function 编译管理任务微信通知(data: SchemaType, 楼: number, 时: number): 微信消息[] {
  return data.系统._管理考核.活跃任务.flatMap(任务 => {
    if (!是管理通知任务(任务)) return [];
    const 门牌号 = 任务.门牌 as 门牌;
    if (!data.户[门牌号]) return [];
    const 地点 = 管理任务显示文本(任务.地点, `${门牌号}室`, 10);
    const 事项原文 = 任务.类型 === '投诉' ? 任务.公开摘要 || 任务.模板 : 任务.模板;
    const 事项 = 管理任务显示文本(事项原文, 任务.类型 === '报修' ? '房内设施故障' : '住户问题');
    const 文 = 编译管理任务通知文案({
      类型: 任务.类型 === '报修' ? '报修' : '投诉',
      地点,
      事项,
      当前时段: 时,
      截止时段: 任务.截止时段,
    });
    return [{ 楼, 时, 会话: 门牌号, 发: '对方' as const, 文, 类: '文本' as const, 键: `楼务:${任务.id}` }];
  });
}

/** 旧存档兼容：只有旧版已经冻结的真实台词才可直接投递；结构化资料绝不作为正文展示。 */
export function 编译怀孕微信通知(data: SchemaType, 楼: number, 时: number): 微信消息[] {
  return 列出待告知孕情(data).flatMap(凭据 => {
    const 文 = data.户[凭据.门牌]?.妻._怀孕.告知文案.trim();
    if (!文 || 是结构化报孕资料(文)) return [];
    return [
      {
        楼,
        时,
        会话: 凭据.门牌,
        发: '对方' as const,
        文,
        类: '文本' as const,
        键: 怀孕微信键(凭据.门牌, 凭据.场次标识),
      },
    ];
  });
}

/** 必须由真实会话渲染写高已读水位后才返回 true；仅收到通知或打开手机都不算。 */
export function 家庭计划微信已读(): boolean {
  const 库 = 读库();
  const 消息 = 库.消息.find(item => item.会话 === '101' && item.键 === 家庭计划微信事件键);
  if (!消息) return false;
  const 已读楼 = 库.读到['101'] ?? -1;
  const 已读锚 = 库.读时['101'] ?? 创建手机已读时锚(已读楼, -1);
  return !手机记录晚于已读(消息, 已读楼, 已读锚);
}

function 消息已读(会话: string, 键: string): boolean {
  const 库 = 读库();
  const 消息 = 库.消息.find(item => item.会话 === 会话 && item.键 === 键);
  if (!消息) return false;
  const 已读楼 = 库.读到[会话] ?? -1;
  const 已读锚 = 库.读时[会话] ?? 创建手机已读时锚(已读楼, -1);
  return !手机记录晚于已读(消息, 已读楼, 已读锚);
}

/** 只返回当前仍待确认且已经被真实会话页已读水位覆盖的孕情消息。 */
export function 怀孕确认微信已读凭据(data: SchemaType): 怀孕送达凭据[] {
  return 列出待告知孕情(data).filter(凭据 => 消息已读(凭据.门牌, 怀孕微信键(凭据.门牌, 凭据.场次标识)));
}

/** 预产消息即使在未读期间已经自动生产，之后真实读到仍能解锁医院与产后入口。 */
export function 预产微信已读凭据(data: SchemaType): 生产通知凭据[] {
  return 列出预产通知(data).filter(凭据 => 消息已读(凭据.门牌, 预产微信键(凭据)));
}

export async function 同步管理任务微信(data: SchemaType): Promise<boolean> {
  const 楼 = 末楼();
  const 时 = 取绝对时段(data);
  const 时间线租约 = 创建手机时间线租约(当前聊天ID(), 楼, SillyTavern.chat ?? [], 时);
  if (!时间线租约) return false;
  const 库 = 读库();
  const 已有键 = new Set(库.消息.flatMap(消息 => (消息.键 ? [消息.键] : [])));
  const 候选消息 = [
    ...编译管理任务微信通知(data, 楼, 时),
    ...编译怀孕微信通知(data, 楼, 时),
  ];
  const 新消息 = 候选消息.filter(消息 => !已有键.has(消息.键 as string));
  if (!新消息.length) return false;
  const 时间线仍有效 = () => 手机时间线租约仍有效(时间线租约, 当前聊天ID(), SillyTavern.chat ?? [], 当前手机绝对时段());
  const 已写 = await 写库增量({ 新圈: [], 新消息, 节拍改: {} }, 时间线仍有效);
  if (已写) {
    请求刷新手机红点();
    请求手机重绘();
    await 立即持久保存手机聊天变量(时间线租约.聊天标识);
  }
  return 已写;
}
