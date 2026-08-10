import type { 门牌 } from '../../../../../stageConfig';
import type { 微信撤回定位, 微信消息定位 } from '../../../微信消息撤回';
import type { 手机邀约计划 } from '../../邀约计划';

/**
 * 渲染层业务端口（拆分方案 P7B2）：本轮仍留内核的 P8 业务（玩家微信撤回绑定、赴约条读取、
 * 邀约、发送消息）经此最小显式端口提供给渲染页面；页面不得反向 import 内核。
 * 注册前页面调用安全 no-op。
 * v0.80：`约出来` 携带玩家在 WeUI 安排页选好的定时定点计划，不再发送固定文案。
 */
export interface 手机渲染业务端口 {
  绑定玩家微信撤回(
    气泡: HTMLElement,
    屏: HTMLElement,
    定位: 微信撤回定位 | null,
    批次键?: string,
    引用定位?: 微信消息定位,
  ): void;
  /** 旧即时 `_赴约` 按原生命周期；新计划待赴约/赴约中视为已约（待赴约带标记）。 */
  读赴约条(楼: number): { m: 门牌; 待赴约?: boolean } | null;
  约出来(m: 门牌, 计划: 手机邀约计划): Promise<void>;
  发消息(会话: string, 文: string, 引用?: 微信消息定位): Promise<void>;
}

let 已注册业务端口: 手机渲染业务端口 | null = null;

/** 由内核在模块初始化完成后安装真实实现；注册前页面调用安全 no-op。 */
export function 注册手机渲染业务端口(端口: 手机渲染业务端口): void {
  已注册业务端口 = 端口;
}

export function 取渲染业务端口(): 手机渲染业务端口 | null {
  return 已注册业务端口;
}
