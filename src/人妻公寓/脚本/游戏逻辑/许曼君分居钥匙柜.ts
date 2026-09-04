import type { SchemaType } from '../../schema';
import { 读取许曼君分居状态 } from './许曼君分居系统';

export interface 许曼君201钥匙柜卡 {
  可见: boolean;
  标题: '201住户钥匙';
  状态: string;
  原持有人: '赵国强';
  当前保管: string;
  封条: string;
  最近用途: string;
  下一预约: string;
  新锁芯: string;
  新钥匙: string;
  说明: string;
}

export function 读取许曼君201钥匙柜卡(data: unknown): 许曼君201钥匙柜卡 {
  const typed = data as SchemaType;
  const state = 读取许曼君分居状态(data);
  const divorce = typed?.系统?._许曼君离婚;
  const oldArchived = divorce?.旧钥匙状态 === '前住户旧钥匙归档' || state.钥匙用途 === '正式退居';
  const visible = state.钥匙位置 === '管理员室201钥匙格' || state.阶段 === '已完成' || Boolean(divorce && divorce.阶段 !== '未开始');
  const holder = oldArchived
    ? '管理员室201前住户旧钥匙档案'
    : state.钥匙位置 === '赵国强持有'
      ? '赵国强本人'
      : state.钥匙位置 === '封存袋随玩家'
        ? '玩家携带的封存袋'
        : '管理员室201钥匙格';
  const seal = oldArchived
    ? '前住户旧钥匙归档封存'
    : state.钥匙位置 === '管理员室201钥匙格'
      ? state.当前封条完整 ? `唯一封条完整（修订${state.封条修订}）` : '封条异常'
      : '当前不在柜中';
  const appointment = state.预约.类型 === '无'
    ? '无'
    : `${state.预约.类型}／${state.预约.状态}${state.预约.开始绝对时段 === null ? '' : `／时段${state.预约.开始绝对时段}`}`;
  return {
    可见: visible,
    标题: '201住户钥匙',
    状态: oldArchived ? '前住户旧钥匙归档' : state.钥匙用途,
    原持有人: '赵国强',
    当前保管: holder,
    封条: seal,
    最近用途: oldArchived ? '正式退居归档' : state.钥匙用途,
    下一预约: oldArchived ? '无' : appointment,
    新锁芯: divorce?.新锁芯位置 ?? '未取得',
    新钥匙: divorce?.新钥匙位置 ?? '未取得',
    说明: oldArchived
      ? '赵国强的同一枚旧钥匙已转为前住户档案；201新锁芯与配套钥匙使用独立物件账，不会生成第二枚封存旧钥匙。'
      : state.钥匙用途 === '待离婚交接'
        ? '同一枚封存钥匙只改了用途标签；仍不等于法律婚姻解除、住户资格删除或换锁。'
        : '取物时由管理员陪同开门，个人钥匙不拆封交还，也不进行第二次封存。',
  };
}
