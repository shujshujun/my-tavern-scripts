// 从 App.vue 外移的文件级局部类型/接口（行为等价搬移，不承载运行时代码）。
import type { SchemaType } from '../../schema';

export type 风闻账视图 = SchemaType['系统']['_风闻账'];
export type 风闻事件视图 = 风闻账视图['最近事件'][number];

export interface 无耗时拜访记录 {
  房间id: string;
  绝对时段: number;
  进房末楼: number;
  由头已用: boolean;
  非法进入: boolean;
}

export interface 由头日记录 {
  日: number;
  已用: string[];
}

export interface 卡动作 {
  kicker: string;
  icon: string;
  文案: string;
  类?: string;
  做: () => void | Promise<void>;
}

export type 客户端时间方式 = '推进一时段' | '睡到次日早晨' | '小憩' | '晨跑' | '健身';

export type 静音会议互动ID = 'A' | 'B' | 'C';
export type 静音会议峰值模式 = '集中' | '同步';
export type 静音会议筹备步骤 = '' | '选择' | '确认';

export interface 静音会议运行状态 {
  id: string;
  阶段: string;
  地点: string;
  参与妻: string[];
  演出妻: string[];
  演出夫: string[];
  启动楼层: number;
  当前拍: number;
  议题: string;
  重点妻: string;
  峰值模式: string;
  会后妻: string[];
  自由循环次数: number;
  交互: {
    id: string;
    类型: string;
    状态: string;
    失败次数: number;
    补偿可用: boolean;
  };
}

export interface 静音会议活动指针 {
  id: number;
  类型: 静音会议互动ID;
  元素: HTMLElement;
  长按timer?: ReturnType<typeof setTimeout>;
}

export interface 立绘项 {
  src: string;
  style: Record<string, string>;
}

export type 道具视觉类型 = 'product' | 'evidence' | 'scene' | 'action';

export interface 卷轴条 {
  谁: '玩家' | '叙事';
  文本: string[];
  楼?: number;
  可回档?: boolean;
  原文?: string;
  事件id?: string;
  事件提示词?: string;
  _排序?: number;
}

export type 移动端全屏选择 = '全屏' | '窗口';

export type 全屏根 = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
export type 全屏文档 = Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element | null };

export type 酒馆原生提示词模块 = {
  promptItemize: (提示词: unknown[], 楼号: number) => Promise<unknown> | unknown;
  itemizedPrompts: unknown[];
};
