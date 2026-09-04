/** 商店、路线、档案和共享结局共用的定价；无运行时业务依赖。 */
export const 不再留门价格 = Object.freeze({ 剧情道具: 480, 便携录制套件: 180, 共享录像带: 1200 });
export const 不再留门任务ID = '不再留门';
export const 不再留门套件ID = '便携录制套件';
export const 不再留门照片ID = '何俊生的街外照片';
export const 不再留门母带ID = '周小满母带（已封存）';
export const 不再留门母带归档键 = '录像带结局:周母带封存';

/** 手机各入口只消费设备占用事实，不引入剧情演出或世界写入依赖。 */
export function 不再留门手机只读原因(data: { 系统?: { _不再留门?: { 阶段?: string } } } | null | undefined): string {
  return data?.系统?._不再留门?.阶段 === '录制中' ? '手机正在用于202本次录制，停机后可以继续。' : '';
}

export interface 不再留门完成依据 {
  版本: number;
  实例: string;
  来源时间线: string;
  阶段: string;
  道具已使用: boolean;
  动机已表达: boolean;
  录制提议: boolean;
  许可: string;
  停止默认等待: boolean;
  照片: {
    id: string;
    时间线: string;
    拍摄时段: number;
    地点: string;
    画面: string;
    原件位置: string;
    已看过: boolean;
    副本持有人: string;
  };
  记录: {
    id: string;
    场次标识: string;
    来源实例: string;
    地点: string;
    参与者: string[];
    正常完成: boolean;
    完成楼层: number;
    正文楼层: number[];
    位置: string;
  };
  母带: { id: string; 来源记录: string; 位置: string; 封存楼层: number; 归档楼层: number };
}

/** 历史完成字符串只作显示镜像；不能签发本版照片或母带。 */
export function 不再留门已完成(data: { 系统: { _不再留门?: 不再留门完成依据 } }): boolean {
  const r = data.系统._不再留门;
  if (!r || r.版本 !== 1 || !r.实例 || !r.来源时间线 || r.阶段 !== '已完成' || !r.道具已使用) return false;
  const p = r.照片;
  const v = r.记录;
  const m = r.母带;
  return Boolean(
    p.id === `${r.实例}:photo` &&
    p.时间线 === r.来源时间线 &&
    p.拍摄时段 >= 0 &&
    p.地点 === '公寓外部' &&
    p.画面 === 'ZXM-NMD-02' &&
    p.原件位置 === '玩家手机' &&
    p.已看过 &&
    p.副本持有人 === '周小满' &&
    r.动机已表达 &&
    r.录制提议 &&
    r.许可 === '同意本次' &&
    r.停止默认等待 &&
    v.id &&
    v.来源实例 === r.实例 &&
    v.场次标识.startsWith(`${r.实例}:session:`) &&
    v.地点 === '202' &&
    v.参与者.length === 2 &&
    v.参与者[0] === '玩家' &&
    v.参与者[1] === '周小满' &&
    v.正常完成 &&
    v.正文楼层.length > 0 &&
    v.完成楼层 >= Math.max(...v.正文楼层) &&
    v.位置 === '封盒' &&
    m.id === `${v.id}:master` &&
    m.来源记录 === v.id &&
    m.位置 === '302资料柜' &&
    m.封存楼层 >= v.完成楼层 &&
    m.归档楼层 >= m.封存楼层,
  );
}
