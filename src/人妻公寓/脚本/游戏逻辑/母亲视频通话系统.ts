import type { SchemaType } from '../../schema';
import { 是提供方拒答正文 } from './正文生成完整性';
import {
  母亲视频通话接通入场CG,
  母亲视频通话终幕CG,
  推进母亲视频通话普通CG,
  读取母亲视频通话CG,
  选择母亲视频通话结束衔接CG,
  type 母亲视频通话CG语义,
} from './母亲视频通话CG语义';

export const 母亲视频通话模式 = '双重继承视频';

export type 母亲视频通话状态 =
  | ''
  | '待接听'
  | '通话中'
  | '等待现场正文'
  | '正文生成中'
  | '正文失败'
  | '结束衔接'
  | '等待最终回答'
  | '终幕中'
  | '已完成';

export type 母亲视频通话终幕态 = SchemaType['系统']['_母亲视频通话终幕'];

export interface 母亲视频通话操作结果 {
  成功: boolean;
  提示: string;
}

export interface 母亲视频通话现场正文票 {
  成功: boolean;
  提示: string;
  标识: string;
  序号: number;
  CG: 母亲视频通话CG语义 | null;
}

export function 空母亲视频通话终幕(): 母亲视频通话终幕态 {
  return {
    标识: '',
    状态: '',
    当前CG: '',
    微信轮次: 0,
    待现场正文序号: 0,
    现场正文请求世代: 0,
    已完成现场正文序号: 0,
    上轮现场正文: '',
    现场正文记录: [],
    现场正文失败: '',
    结束请求: false,
    最终交接已出现: false,
    玩家最终回答已保存: false,
    父亲已挂断: false,
    终幕CG序号: 0,
    启动楼层: -1,
    启动绝对时段: -1,
  };
}

export function 读取母亲视频通话终幕(data: SchemaType | null | undefined): 母亲视频通话终幕态 | null {
  const 状态 = data?.系统._母亲视频通话终幕;
  return 状态?.标识 && 状态.状态 ? 状态 : null;
}

export function 母亲视频通话待接听(data: SchemaType | null | undefined): boolean {
  return 读取母亲视频通话终幕(data)?.状态 === '待接听';
}

export function 母亲视频通话活动中(data: SchemaType | null | undefined): boolean {
  const 状态 = 读取母亲视频通话终幕(data)?.状态;
  return !!状态 && 状态 !== '已完成';
}

export function 母亲视频通话已接通(data: SchemaType | null | undefined): boolean {
  const 状态 = 读取母亲视频通话终幕(data)?.状态;
  return !!状态 && !['待接听', '已完成'].includes(状态);
}

export function 是母亲视频父亲通话(data: SchemaType | null | undefined): boolean {
  const 视频 = 读取母亲视频通话终幕(data);
  const 通话 = data?.系统._父亲通话;
  return Boolean(视频 && 通话?.标识 && 通话.标识 === 视频.标识 && 通话.模式 === 母亲视频通话模式 && 通话.期 >= 0);
}

export interface 母亲视频通话已保存往返 {
  玩家说: string;
  父亲说: string;
}

/** 父亲开场白不配对；只有相邻的“我→父”才是一轮已经真实落库的微信往返。 */
function 读取母亲视频通话已保存往返(data: SchemaType): 母亲视频通话已保存往返[] {
  const 记录 = data.系统._父亲通话.记录;
  const 往返: 母亲视频通话已保存往返[] = [];
  for (let i = 0; i < 记录.length - 1; i += 1) {
    const 我 = 记录[i];
    const 父 = 记录[i + 1];
    if (我.谁 !== '我' || 父.谁 !== '父') continue;
    往返.push({ 玩家说: 我.文, 父亲说: 父.文 });
    i += 1;
  }
  return 往返;
}

/**
 * 修复“父亲气泡已保存、CG／现场正文票尚未来得及登记便刷新”的断点。
 * 只接受恰好多出一轮的单一缺口；更复杂的损坏不靠猜测跳轮。
 */
export function 读取母亲视频通话未登记父亲回复(data: SchemaType | null | undefined): 母亲视频通话已保存往返 | null {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!data || !视频 || !是母亲视频父亲通话(data)) return null;
  if (!['通话中', '结束衔接'].includes(视频.状态) || data.系统._父亲通话.待回复.序号 > 0) return null;
  const 往返 = 读取母亲视频通话已保存往返(data);
  return 往返.length === 视频.微信轮次 + 1 ? (往返.at(-1) ?? null) : null;
}

/** 最终回答先作为玩家气泡落库；若刷新截断后置事件，用这条未配对的最后气泡恢复。 */
export function 读取母亲视频通话未登记最终回答(data: SchemaType | null | undefined): string | null {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!data || !视频 || !是母亲视频父亲通话(data)) return null;
  if (视频.状态 !== '等待最终回答' || 视频.玩家最终回答已保存 || data.系统._父亲通话.待回复.序号 > 0) {
    return null;
  }
  const 记录 = data.系统._父亲通话.记录;
  const 最后 = 记录.at(-1);
  if (!最后 || 最后.谁 !== '我' || !最后.文.trim()) return null;
  const 往返 = 读取母亲视频通话已保存往返(data);
  const 玩家气泡数 = 记录.filter(条 => 条.谁 === '我').length;
  if (往返.length !== 视频.微信轮次 || 玩家气泡数 !== 往返.length + 1) return null;
  return 最后.文;
}

export function 母亲视频通话当前CG(data: SchemaType | null | undefined): 母亲视频通话CG语义 | null {
  const id = 读取母亲视频通话终幕(data)?.当前CG ?? '';
  return id ? 读取母亲视频通话CG(id) : null;
}

/**
 * 《双重继承》上游在父亲已到机场以后调用。这里只建立来电票，
 * 不自动接听、不生成父亲台词，也不提前推进第一张CG。
 */
export function 预约母亲视频通话终幕(data: SchemaType, 标识: string, 启动楼层: number): 母亲视频通话操作结果 {
  if (!标识.trim()) return { 成功: false, 提示: '视频通话标识为空。' };
  if (!Number.isInteger(启动楼层) || 启动楼层 < 0) return { 成功: false, 提示: '视频通话启动楼层无效。' };
  const 旧 = 读取母亲视频通话终幕(data);
  if (旧 && 旧.状态 !== '已完成') return { 成功: false, 提示: '母亲视频通话已经在进行中。' };
  if (data.系统._父亲通话.标识 || data.系统._待接来电.期 >= 0) {
    return { 成功: false, 提示: '父亲当前已有另一通电话，不能同时建立结局视频通话。' };
  }
  if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0 || data.系统._场景剧情事务.id) {
    return { 成功: false, 提示: '当前还有其他强剧情或特殊场景没有结束。' };
  }
  data.系统._母亲视频通话终幕 = {
    ...空母亲视频通话终幕(),
    标识: 标识.trim(),
    状态: '待接听',
    当前CG: 母亲视频通话接通入场CG[0].id,
    启动楼层,
    启动绝对时段: data.系统._绝对时段,
  };
  return { 成功: true, 提示: '父亲从机场发来微信视频通话。' };
}

/** 接听时原子建立专属父亲通话；普通楼务电话的待接、分数与报表完全不参与。 */
export function 接听母亲视频通话终幕(data: SchemaType): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.状态 !== '待接听') return { 成功: false, 提示: '当前没有等待接听的母亲结局视频通话。' };
  if (data.系统._父亲通话.标识) return { 成功: false, 提示: '父亲的另一通电话仍未结束。' };
  视频.状态 = '通话中';
  data.系统._父亲通话 = {
    标识: 视频.标识,
    模式: 母亲视频通话模式,
    状态: '通话中',
    期: Math.max(0, data.系统._绝对时段),
    分数段: '满意',
    报表: '机场登机前的最后交接确认',
    通牒: false,
    紧急: false,
    母亲圆场: { 触发: false, 事件ID: '', 摘要: '', 仅剧情: false },
    主题: '机场登机前的最后交接确认',
    记录: [],
    待回复: { 序号: 1, 玩家说: '(视频通话接通，父亲先开口)' },
    下次回复序号: 2,
    挂断楼层: -1,
  };
  return { 成功: true, 提示: '微信视频通话已经接通。' };
}

export function 母亲视频通话可以发送(data: SchemaType | null | undefined): boolean {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.状态 !== '通话中' || 视频.待现场正文序号 > 视频.已完成现场正文序号) return false;
  if (读取母亲视频通话未登记父亲回复(data)) return false;
  const 通话 = data?.系统._父亲通话;
  return Boolean(通话?.标识 === 视频.标识 && 通话.状态 === '通话中' && 通话.待回复.序号 === 0);
}

export function 母亲视频通话可以发送结束告别(data: SchemaType | null | undefined): boolean {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.状态 !== '结束衔接' || 读取母亲视频通话未登记父亲回复(data)) return false;
  const 通话 = data?.系统._父亲通话;
  return Boolean(通话?.标识 === 视频.标识 && 通话.状态 === '通话中' && 通话.待回复.序号 === 0);
}

export function 母亲视频通话可以提交最终回答(data: SchemaType | null | undefined): boolean {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.状态 !== '等待最终回答' || !视频.最终交接已出现) return false;
  if (读取母亲视频通话未登记最终回答(data)) return false;
  const 通话 = data?.系统._父亲通话;
  return Boolean(通话?.标识 === 视频.标识 && 通话.状态 === '通话中' && 通话.待回复.序号 === 0);
}

/**
 * 一条真实玩家回答对应的父亲回复保存成功后调用。首个“父亲先开口”占位不是玩家回合，
 * 不能推进CG，也不能创建现场正文票。
 */
export function 登记母亲视频通话父亲回复(data: SchemaType, 玩家说: string, 父亲说 = ''): 母亲视频通话现场正文票 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || !是母亲视频父亲通话(data)) {
    return { 成功: false, 提示: '当前不是母亲结局视频通话。', 标识: '', 序号: 0, CG: null };
  }
  if (/^\(视频通话接通[，,]父亲先开口\)$/.test(玩家说.trim())) {
    return { 成功: false, 提示: '父亲开场白不推进玩家回合。', 标识: 视频.标识, 序号: 0, CG: null };
  }
  if (视频.状态 !== '通话中' && 视频.状态 !== '结束衔接') {
    return { 成功: false, 提示: '上一轮现场正文尚未完成。', 标识: 视频.标识, 序号: 0, CG: null };
  }
  const 最近父 = data.系统._父亲通话.记录.at(-1);
  const 最近我 = data.系统._父亲通话.记录.at(-2);
  if (!最近父 || 最近父.谁 !== '父' || 最近父.文 !== 父亲说 || !最近我 || 最近我.谁 !== '我' || 最近我.文 !== 玩家说) {
    return { 成功: false, 提示: '父亲回复记录与当前现场票不一致。', 标识: 视频.标识, 序号: 0, CG: null };
  }
  // 正常保存广播与刷新恢复共用持久往返账。现场完成会重回“通话中”，因此不能只用状态或文本去重；
  // 只有账上恰好多出的一轮可创建新票，下一轮相同台词仍按新增往返正常登记。
  if (!读取母亲视频通话未登记父亲回复(data)) {
    return { 成功: false, 提示: '当前没有等待登记的父亲回复。', 标识: 视频.标识, 序号: 0, CG: null };
  }
  const 是最终交接回复 = 视频.状态 === '结束衔接' && 视频.结束请求;
  const 当前 = 读取母亲视频通话CG(视频.当前CG) ?? 母亲视频通话接通入场CG[0];
  const 下一张 = 是最终交接回复 ? 当前 : 推进母亲视频通话普通CG(当前.id);
  const 序号 = 视频.微信轮次 + 1;
  视频.当前CG = 下一张.id;
  视频.微信轮次 = 序号;
  视频.待现场正文序号 = 序号;
  if (是最终交接回复) 视频.最终交接已出现 = true;
  视频.状态 = '等待现场正文';
  视频.现场正文失败 = '';
  return {
    成功: true,
    提示: 是最终交接回复 ? '父亲最终交接确认已保存，等待现场正文演绎。' : '父亲回复已保存，等待现场正文演绎。',
    标识: 视频.标识,
    序号,
    CG: 下一张,
  };
}

export function 开始母亲视频通话现场正文(
  data: SchemaType,
  标识: string,
  序号: number,
): 母亲视频通话操作结果 & { 请求世代?: number } {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.标识 !== 标识 || 视频.待现场正文序号 !== 序号) {
    return { 成功: false, 提示: '现场正文票已经失效。' };
  }
  if (!['等待现场正文', '正文失败'].includes(视频.状态)) {
    return { 成功: false, 提示: '当前现场正文不能开始或重复开始。' };
  }
  视频.现场正文请求世代 += 1;
  视频.状态 = '正文生成中';
  视频.现场正文失败 = '';
  return { 成功: true, 提示: '现场正文开始生成。', 请求世代: 视频.现场正文请求世代 };
}

export function 完成母亲视频通话现场正文(
  data: SchemaType,
  标识: string,
  序号: number,
  请求世代: number,
  正文: string,
): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.标识 !== 标识 || 视频.待现场正文序号 !== 序号 || 视频.现场正文请求世代 !== 请求世代) {
    return { 成功: false, 提示: '迟到现场正文不能认领当前视频通话。' };
  }
  if (视频.状态 !== '正文生成中') return { 成功: false, 提示: '现场正文并非生成中。' };
  const 文 = 正文.trim();
  if (!文) return { 成功: false, 提示: '现场正文为空。' };
  if (是提供方拒答正文(文)) return { 成功: false, 提示: 'AI服务返回了拒答说明，现场正文未完成。' };
  视频.上轮现场正文 = 文;
  const 已有位置 = 视频.现场正文记录.findIndex(条 => 条.序号 === 序号);
  const 记录 = { 序号, CG: 视频.当前CG, 文 };
  if (已有位置 >= 0) 视频.现场正文记录[已有位置] = 记录;
  else 视频.现场正文记录.push(记录);
  视频.现场正文记录 = 视频.现场正文记录.slice(-80);
  视频.已完成现场正文序号 = 序号;
  视频.现场正文失败 = '';
  if (视频.结束请求 && 视频.最终交接已出现) {
    视频.状态 = '等待最终回答';
    视频.当前CG = 母亲视频通话终幕CG[0].id;
    视频.终幕CG序号 = 1;
  } else {
    视频.状态 = '通话中';
  }
  return { 成功: true, 提示: '现场正文已完成。' };
}

export function 标记母亲视频通话现场正文失败(
  data: SchemaType,
  标识: string,
  序号: number,
  请求世代: number,
  原因: string,
): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.标识 !== 标识 || 视频.待现场正文序号 !== 序号 || 视频.现场正文请求世代 !== 请求世代) {
    return { 成功: false, 提示: '迟到失败结果不能改写当前视频通话。' };
  }
  if (!['等待现场正文', '正文生成中', '正文失败'].includes(视频.状态)) {
    return { 成功: false, 提示: '当前没有可标记失败的现场正文。' };
  }
  视频.状态 = '正文失败';
  视频.现场正文失败 = 原因.trim() || '现场正文没有完成';
  return { 成功: true, 提示: 视频.现场正文失败 };
}

/**
 * 玩家在自由通话窗口请求结束时调用。CG只选择一张衔接图；三张衔接图不是固定连播。
 * 父亲最终交接确认仍由随后一轮父亲回复写入，成功后再进入等待最终回答。
 */
export function 请求结束母亲视频通话(data: SchemaType): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.状态 !== '通话中' || !是母亲视频父亲通话(data) || !母亲视频通话可以发送(data)) {
    return { 成功: false, 提示: '当前不能结束母亲视频通话。' };
  }
  const 当前CG = 读取母亲视频通话CG(视频.当前CG);
  if (!当前CG) return { 成功: false, 提示: '当前CG状态丢失，不能进入终幕。' };
  视频.当前CG = 选择母亲视频通话结束衔接CG(当前CG.连接状态).id;
  视频.结束请求 = true;
  视频.状态 = '结束衔接';
  return { 成功: true, 提示: '已经准备结束交接通话，等待父亲最后确认。' };
}

export function 登记玩家最终回答(data: SchemaType, 玩家回答 = ''): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  const 已保存回答 = 读取母亲视频通话未登记最终回答(data);
  if (
    !视频 ||
    视频.状态 !== '等待最终回答' ||
    !视频.最终交接已出现 ||
    !已保存回答 ||
    (玩家回答.trim() && 已保存回答 !== 玩家回答)
  ) {
    return { 成功: false, 提示: '当前还没有可认领的最终回答气泡。' };
  }
  视频.玩家最终回答已保存 = true;
  视频.状态 = '终幕中';
  视频.当前CG = 母亲视频通话终幕CG[1]?.id ?? 母亲视频通话终幕CG[0].id;
  视频.终幕CG序号 = Math.min(2, 母亲视频通话终幕CG.length);
  return { 成功: true, 提示: '最终回答已保存，进入一次性终幕。' };
}

export function 推进母亲视频通话终幕CG(data: SchemaType): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.状态 !== '终幕中') return { 成功: false, 提示: '当前不在视频终幕演出中。' };
  const 下一序号 = 视频.终幕CG序号 + 1;
  if (下一序号 > 母亲视频通话终幕CG.length) return { 成功: false, 提示: '视频终幕CG已经播放完毕。' };
  // 第4张仍是父亲在线时的完成动作；进入第5张事后帧前才允许确认他已经挂断。
  if (下一序号 === 5 && !视频.父亲已挂断) {
    const 挂断 = 登记母亲视频通话父亲挂断(data);
    if (!挂断.成功) return 挂断;
  }
  视频.终幕CG序号 = 下一序号;
  视频.当前CG = 母亲视频通话终幕CG[下一序号 - 1].id;
  return { 成功: true, 提示: `视频终幕推进到第${下一序号}张。` };
}

export function 登记母亲视频通话父亲挂断(data: SchemaType): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || !视频.玩家最终回答已保存) return { 成功: false, 提示: '最终回答尚未保存，父亲不能完成挂断。' };
  if (视频.状态 !== '终幕中' || 视频.终幕CG序号 < 4) {
    return { 成功: false, 提示: '父亲仍在听玩家完成最后回答，当前还不能提前挂断。' };
  }
  视频.父亲已挂断 = true;
  return { 成功: true, 提示: '父亲已经挂断视频通话。' };
}

/** 终幕内部只完成机场视频；《双重继承》必须回到302处理总钥匙后才可提交最终完成ID。 */
export function 完成母亲视频通话终幕(data: SchemaType): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (!视频 || 视频.状态 !== '终幕中') return { 成功: false, 提示: '当前视频终幕状态不正确。' };
  if (!视频.最终交接已出现 || !视频.玩家最终回答已保存 || !视频.父亲已挂断) {
    return { 成功: false, 提示: '最终交接确认、玩家回答或父亲挂断尚未全部完成。' };
  }
  if (视频.终幕CG序号 < 母亲视频通话终幕CG.length) {
    return { 成功: false, 提示: '母亲的视频终幕动作尚未播放完整。' };
  }
  const 通话 = data.系统._父亲通话;
  const 是当前视频通话 =
    通话.标识 === 视频.标识 &&
    [母亲视频通话模式, '母亲视频通话终幕'].includes(通话.模式) &&
    ['通话中', '收尾中'].includes(通话.状态);
  if (!是当前视频通话) return { 成功: false, 提示: '父亲电话状态已经变化，旧视频终幕不能认领当前通话。' };

  视频.状态 = '已完成';
  // 兼容开发档曾写入的旧模式别名；完成边界统一成唯一生产模式，供后续强剧情门识别“自己的收尾票”。
  通话.模式 = 母亲视频通话模式;
  通话.状态 = '收尾中';
  if (视频.标识 === '双重继承' && data.系统._双重继承.阶段 === '视频已预约') {
    data.系统._双重继承.阶段 = '待总钥匙归位';
  }
  return { 成功: true, 提示: '机场视频已经结束。手机交还母亲后，还要在302亲自处理公寓楼总钥匙。' };
}

/** 自动播放、刷新恢复及手动重试共用逐帧 CAS；重复或迟到回调不能跳过当前帧。 */
export function 提交母亲视频终幕帧(data: SchemaType, 标识: string, 预期帧: number): 母亲视频通话操作结果 {
  const 视频 = 读取母亲视频通话终幕(data);
  if (
    !视频 || 视频.标识 !== 标识 || 视频.状态 !== '终幕中' ||
    !Number.isInteger(预期帧) || 预期帧 < 1 || 预期帧 > 母亲视频通话终幕CG.length ||
    视频.终幕CG序号 !== 预期帧 || !视频.最终交接已出现 || !视频.玩家最终回答已保存
  ) return { 成功: false, 提示: '终幕帧票已经失效。' };
  const 通话 = data.系统._父亲通话;
  const 旧档最终帧收尾 = 预期帧 === 母亲视频通话终幕CG.length && 通话.状态 === '收尾中';
  if (
    通话.标识 !== 标识 || ![母亲视频通话模式, '母亲视频通话终幕'].includes(通话.模式) ||
    (通话.状态 !== '通话中' && !旧档最终帧收尾)
  ) return { 成功: false, 提示: '当前父亲通话已经变化。' };
  return 预期帧 < 母亲视频通话终幕CG.length
    ? 推进母亲视频通话终幕CG(data)
    : 完成母亲视频通话终幕(data);
}
