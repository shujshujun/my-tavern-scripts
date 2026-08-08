import type { 门牌 } from '../../../../../stageConfig';
import type { 微信撤回定位 } from '../../../微信消息撤回';

/**
 * 渲染层业务端口（拆分方案 P7B2）：本轮仍留内核的 P8 业务（玩家微信撤回绑定、赴约条读取、
 * 邀约、发送消息）经此最小显式端口提供给渲染页面；页面不得反向 import 内核。
 * 注册前页面调用安全 no-op。
 */
export interface 手机渲染业务端口 {
  绑定玩家微信撤回(气泡: HTMLElement, 屏: HTMLElement, 定位: 微信撤回定位): void;
  读赴约条(楼: number): { m: 门牌 } | null;
  约出来(m: 门牌): Promise<void>;
  发消息(会话: string, 文: string): Promise<void>;
}

let 已注册业务端口: 手机渲染业务端口 | null = null;

/** 由内核在模块初始化完成后安装真实实现；注册前页面调用安全 no-op。 */
export function 注册手机渲染业务端口(端口: 手机渲染业务端口): void {
  已注册业务端口 = 端口;
}

export function 取渲染业务端口(): 手机渲染业务端口 | null {
  return 已注册业务端口;
}
