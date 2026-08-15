import type { SchemaType } from '../../schema';
import { 户静态表, type 门牌 } from '../../stageConfig';
import { 丈夫在楼, 妻位置推算 } from './楼层时钟';
import { 玩家当前日 } from './玩家资源系统';
import { 事件角色标记 } from './snapshotSystem';
import { 阶段性癖已完成 } from './阶段性癖状态';

export const 家庭计划套件ID = '家庭计划套件';
export const 家庭计划微信事件键 = '家庭计划:101:赴约';

export type 家庭计划阶段 = SchemaType['系统']['_家庭计划']['阶段'];
export type 家庭计划地点动作ID = '安装计划板' | '投放匿名资料' | '填写姓名磁贴' | '送出姓名磁贴' | '赴约';
export type 家庭计划监控节点 = '观察资料' | '确认人选';

export interface 家庭计划动作视图 {
  id: 家庭计划地点动作ID;
  文案: string;
  kicker: string;
  icon: 'favor' | 'mail' | 'edit' | 'gift' | 'story';
}

export interface 家庭计划结果 {
  成功: boolean;
  提示: string;
  变动?: boolean;
  CG?: string;
}

export interface 家庭计划监控结果 {
  事件: string;
  拍: number;
  家庭计划节点: 家庭计划监控节点;
  CG: string;
}

/** 家庭计划只在夏乔 L5 且永久取得「孕欲」后上架；一旦开始，后续状态不因数值波动消失。 */
export function 家庭计划已上架(data: SchemaType): boolean {
  const 状态 = data.系统._家庭计划.阶段;
  if (状态 !== '未开始') return true;
  const 夏乔 = data.户['101']?.妻;
  return !!夏乔 && 夏乔.当前阶段 >= 5 && 阶段性癖已完成(data, '101');
}

export function 家庭计划卡状态(data: SchemaType): '可购买' | '筹备中' | '待赴约' | '已完成' | '未解锁' {
  const 状态 = data.系统._家庭计划.阶段;
  if (状态 === '已完成') return '已完成';
  if (状态 === '待赴约') return '待赴约';
  if (状态 !== '未开始') return '筹备中';
  return 家庭计划已上架(data) ? '可购买' : '未解锁';
}

export function 购买家庭计划套件(data: SchemaType, 价格: number): 家庭计划结果 {
  if (!家庭计划已上架(data)) return { 成功: false, 提示: '夏乔的家庭计划还没有准备好。' };
  if (data.系统._家庭计划.阶段 !== '未开始') {
    return { 成功: false, 提示: `家庭计划已经处于「${家庭计划卡状态(data)}」。` };
  }
  if (!Number.isFinite(价格) || 价格 <= 0) return { 成功: false, 提示: '家庭计划套件的价格配置无效。' };
  if (data.现金 < 价格) return { 成功: false, 提示: '钱不够。' };
  data.现金 -= 价格;
  data.系统._家庭计划 = {
    阶段: '待安装',
    最早继续日: 玩家当前日(data),
    完成楼层: -1,
  };
  if (!data.背包.includes(家庭计划套件ID)) data.背包.push(家庭计划套件ID);
  return {
    成功: true,
    提示: '「家庭计划套件」已经送到管理员室。先把计划板带去101安装。',
    变动: true,
  };
}

function 已到继续日(data: SchemaType): boolean {
  return 玩家当前日(data) >= data.系统._家庭计划.最早继续日;
}

export function 家庭计划地点动作(data: SchemaType, 地点: string): 家庭计划动作视图[] {
  const 路线 = data.系统._家庭计划;
  if (!已到继续日(data)) return [];
  if (路线.阶段 === '待安装' && 地点 === '101') {
    return [{ id: '安装计划板', 文案: '安装家庭计划板', kicker: 'PLAN', icon: 'favor' }];
  }
  if (路线.阶段 === '待投资料' && 地点 === '信箱区') {
    return [{ id: '投放匿名资料', 文案: '把第三方辅助生育资料塞进101信箱', kicker: 'PLAN', icon: 'mail' }];
  }
  if (路线.阶段 === '待写磁贴' && 地点 === '管理员室') {
    return [{ id: '填写姓名磁贴', 文案: '在空白磁贴上写下自己的名字', kicker: 'PLAN', icon: 'edit' }];
  }
  if (路线.阶段 === '待送磁贴' && 地点 === '101') {
    return [{ id: '送出姓名磁贴', 文案: '在101门外放下匿名信封', kicker: 'PLAN', icon: 'gift' }];
  }
  if (路线.阶段 === '待赴约' && 地点 === '101') {
    return [{ id: '赴约', 文案: '赴约 · 谈谈孩子的事', kicker: 'STORY', icon: 'story' }];
  }
  return [];
}

export function 执行家庭计划地点动作(data: SchemaType, 动作: 家庭计划地点动作ID, 当前地点: string): 家庭计划结果 {
  const 候选 = 家庭计划地点动作(data, 当前地点).find(item => item.id === 动作);
  if (!候选) return { 成功: false, 提示: '这一步还没到时间，或你已经不在正确地点。' };
  const 路线 = data.系统._家庭计划;
  const 今日 = 玩家当前日(data);
  switch (动作) {
    case '安装计划板': {
      const i = data.背包.indexOf(家庭计划套件ID);
      if (i < 0) return { 成功: false, 提示: '家庭计划套件不在背包里。' };
      const 户 = data.户['101'];
      if (!户) return { 成功: false, 提示: '101现在没有可承接这条计划的住户。' };
      if (妻位置推算('101', data.系统._绝对时段, 户) !== '101') {
        return { 成功: false, 提示: '夏乔这会儿不在家，改天当着她的面把计划板装起来。' };
      }
      data.背包.splice(i, 1);
      路线.阶段 = '待投资料';
      路线.最早继续日 = 今日 + 1;
      return {
        成功: true,
        提示: '计划板已经挂在101。明天再去信箱区投放资料。',
        变动: true,
        CG: '家庭计划_D1_安装计划板',
      };
    }
    case '投放匿名资料':
      路线.阶段 = '待观察资料';
      路线.最早继续日 = 今日 + 1;
      return {
        成功: true,
        提示: '无署名信封已经推进101信箱。明天从302查看监控；若101还没装摄像头，先趁屋里没人进去布设。',
        变动: true,
        CG: '家庭计划_D2_投放匿名资料',
      };
    case '填写姓名磁贴':
      路线.阶段 = '待送磁贴';
      路线.最早继续日 = 今日;
      return { 成功: true, 提示: '姓名磁贴已经写好并装进无署名信封。把它送到101门外。', 变动: true };
    case '送出姓名磁贴':
      路线.阶段 = '待确认人选';
      路线.最早继续日 = 今日 + 1;
      return {
        成功: true,
        提示: '匿名信封已经留在101门外。明天从302确认陆嘉明的决定。',
        变动: true,
        CG: '家庭计划_D4_送出姓名磁贴',
      };
    case '赴约':
      return { 成功: false, 提示: '赴约需要由有效正文完整演出后才能提交。' };
  }
}

/** 返回 null 表示不是家庭计划监控窗口，普通摄像头逻辑继续处理。 */
export function 准备家庭计划监控(data: SchemaType, 门牌号: 门牌): 家庭计划监控结果 | 家庭计划结果 | null {
  if (门牌号 !== '101') return null;
  const 路线 = data.系统._家庭计划;
  const 节点: 家庭计划监控节点 | null =
    路线.阶段 === '待观察资料' ? '观察资料' : 路线.阶段 === '待确认人选' ? '确认人选' : null;
  if (!节点) return null;
  if (!已到继续日(data)) return { 成功: false, 提示: '今天刚布下这一步，至少等到明天再看监控。' };
  const 户 = data.户['101'];
  if (!户) return { 成功: false, 提示: '101现在没有可承接这条计划的住户。' };
  const 丈夫状态 = 丈夫在楼(户, '101', data.系统._绝对时段);
  if (丈夫状态 !== '在家') {
    if (丈夫状态 === '外出') {
      return { 成功: false, 提示: '陆嘉明还没回来，监控里只有空着的计划板。' };
    }
    return { 成功: false, 提示: '陆嘉明已经睡了，等他醒着在家时再看监控。' };
  }
  // D3 与 D5 都服从正常周作息；当天没有自然独处窗口时，路线保留并等待后续窗口。
  if (妻位置推算('101', data.系统._绝对时段, 户) === '101') {
    return { 成功: false, 提示: '夏乔也在101。等陆嘉明独自在家时再观察。' };
  }
  const 妻名 = 户静态表['101'].妻名;
  const 共同 = `${事件角色标记({ 在场夫: ['101'] })}【家庭计划专属监控】{{user}}人在302，只能通过101针孔摄像头看见画面；${妻名}不在场，陆嘉明不知道自己被观察，严禁双方隔空互动。`;
  if (节点 === '观察资料') {
    return {
      事件:
        `${共同}陆嘉明取出匿名辅助生育资料反复阅读，没有扔掉，而是把它钉到家庭计划板旁；` +
        '他用红笔圈出「由双方信任的人提供帮助」，并在旁边写下「陌生人不行」。只演出他开始认真考虑，不能提前出现具体人选或已经作出最终决定。',
      拍: 103,
      家庭计划节点: 节点,
      CG: '家庭计划_D3_监控阅读资料',
    };
  }
  return {
    事件:
      `${共同}陆嘉明已经把写有{{user}}姓名的红边磁贴放在被圈出的「双方信任的人」旁边，` +
      '并写下「找个时间谈谈」。这一拍必须明确表现他已经选定{{user}}，不再是犹豫或候选比较；不要让他当场联系玩家。',
    拍: 105,
    家庭计划节点: 节点,
    CG: '家庭计划_D5_监控确认人选',
  };
}

export function 提交家庭计划监控(data: SchemaType, 节点: 家庭计划监控节点): 家庭计划结果 {
  const 路线 = data.系统._家庭计划;
  const 今日 = 玩家当前日(data);
  if (节点 === '观察资料' && 路线.阶段 === '待观察资料' && 已到继续日(data)) {
    路线.阶段 = '待写磁贴';
    路线.最早继续日 = 今日 + 1;
    return { 成功: true, 提示: '陆嘉明没有扔掉资料。明天在管理员室准备姓名磁贴。', 变动: true };
  }
  if (节点 === '确认人选' && 路线.阶段 === '待确认人选' && 已到继续日(data)) {
    路线.阶段 = '待微信';
    路线.最早继续日 = 今日;
    return { 成功: true, 提示: '陆嘉明已经留下“找个时间谈谈”。等夏乔发来消息。', 变动: true };
  }
  return { 成功: false, 提示: '家庭计划监控票据已经过期，当前路线没有推进。' };
}

/** 微信只有真实写入并被前台已读水位覆盖后，才把一次性赴约瓷砖交给地图。 */
export function 确认家庭计划微信已读(data: SchemaType, 消息已读: boolean): 家庭计划结果 {
  if (data.系统._家庭计划.阶段 !== '待微信') return { 成功: false, 提示: '' };
  if (!消息已读) return { 成功: false, 提示: '' };
  data.系统._家庭计划.阶段 = '待赴约';
  return { 成功: true, 提示: '夏乔的消息已经读过。101现在可以赴约。', 变动: true };
}

export function 家庭计划赴约系统注入(): string {
  return [
    事件角色标记({ 在场夫: ['101'] }),
    '【家庭计划·赴约硬事实】地点固定在101，夏乔不在场；陆嘉明亲口告诉{{user}}：他已经决定采用借种，而且已经选定{{user}}。',
    '这不是说服、检定、候选讨论或临时请求。不得让陆嘉明改口、拒绝、继续考虑或把决定交给夏乔；也不得提前演出夏乔反应、借种剧情、性爱、受孕或结局。',
    '完整演出他把既定决定说出口、说明这是夫妻家庭计划的一部分，并让谈话明确收束。不要复述系统标签。',
  ].join('\n');
}

export function 提交家庭计划赴约(data: SchemaType, 当前地点: string, 成功楼层: number): 家庭计划结果 {
  if (当前地点 !== '101' || data.系统._家庭计划.阶段 !== '待赴约') {
    return { 成功: false, 提示: '赴约地点或家庭计划状态已经变化。' };
  }
  data.系统._家庭计划.阶段 = '已完成';
  data.系统._家庭计划.完成楼层 = Number.isInteger(成功楼层) ? 成功楼层 : -1;
  return {
    成功: true,
    提示: '家庭计划完成。「借种」结局剧情占位已在特殊场景货架显示。',
    变动: true,
    CG: '家庭计划_赴约_宣布决定',
  };
}

export function 家庭计划101背景文件(data: SchemaType): string {
  const 阶段 = data.系统._家庭计划.阶段;
  if (['待微信', '待赴约', '已完成'].includes(阶段)) return '101_家庭计划板_03人选';
  if (['待写磁贴', '待送磁贴', '待确认人选'].includes(阶段)) return '101_家庭计划板_02资料';
  if (['待投资料', '待观察资料'].includes(阶段)) return '101_家庭计划板_01初始';
  return '';
}
