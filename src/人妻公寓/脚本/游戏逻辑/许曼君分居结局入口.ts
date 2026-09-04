/**
 * @deprecated 旧调试入口的只读投影。正式《分居》上架由商店系统调用权威状态机，
 * 《离婚》占位由`角色结局占位.ts`展示；本文件不作为第三个生产入口，也不写路线状态。
 */
import { 读取许曼君分居入口资格 } from './许曼君分居玩法';
import { 读取许曼君分居状态, 许曼君分居解锁离婚 } from './许曼君分居系统';

export interface 许曼君路线入口状态 {
  id: '角色路线:201:操作性剧情' | '角色结局:201:离婚';
  名称: string;
  已实现: boolean;
  已解锁: boolean;
  已开始: boolean;
  已完成: boolean;
  入口地点: '201' | '管理员室';
  操作标题: string;
  禁用原因: string;
}

export function 读取许曼君分居入口状态(data: unknown): 许曼君路线入口状态 {
  const state = 读取许曼君分居状态(data);
  const qualification = 读取许曼君分居入口资格(data);
  const started = state.阶段 !== '未开始';
  return {
    id: '角色路线:201:操作性剧情',
    名称: '许曼君承接线《分居》',
    已实现: true,
    已解锁: started || qualification.满足,
    已开始: started,
    已完成: state.阶段 === '已完成',
    入口地点: '201',
    操作标题: started ? '继续《分居》当前断点' : '问她那件一直没说完的事',
    禁用原因: started || qualification.满足 ? '' : qualification.原因,
  };
}

export function 读取许曼君离婚入口状态(data: unknown): 许曼君路线入口状态 {
  const unlocked = 许曼君分居解锁离婚(data);
  return {
    id: '角色结局:201:离婚',
    名称: '许曼君结局《离婚》',
    已实现: false,
    已解锁: unlocked,
    已开始: false,
    已完成: false,
    入口地点: '管理员室',
    操作标题: '处理201剩余物件、旧账与正式离婚手续',
    禁用原因: unlocked
      ? '《离婚》入口已经解锁，但独立结局流程仍待后续实现。'
      : '必须先完整完成《分居》，并把201钥匙改为“待离婚交接”',
  };
}
