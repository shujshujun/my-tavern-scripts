import { computed, ref, type Ref } from 'vue';
import type { SchemaType } from '../../../schema';
import { 构造录像带V4客户端快照, type 录像带V4客户端快照 } from '../../../脚本/游戏逻辑/录像带V4运行时';
import type { 录像带V4房间, 录像带V4操作类型 } from '../../../脚本/游戏逻辑/录像带V4状态';
import { 录像带V4已经使用 } from '../../../脚本/游戏逻辑/录像带V4状态';

interface 录像带V4日志投影 {
  类型?: unknown;
  线程?: unknown;
  谁?: unknown;
  文本?: unknown;
  画面键?: unknown;
}

export interface 录像带V4操作载荷 {
  操作标识: string;
  类型: 录像带V4操作类型;
}

export interface 录像带V4客户端选项 {
  data: Readonly<Ref<SchemaType>>;
  发送中: Readonly<Ref<boolean>>;
  请求操作: (载荷: 录像带V4操作载荷) => void;
  请求完成: () => void;
}

/**
 * 客户端只读当前聊天中已经与硬状态同事务提交的VTR正文。这里不导入宿主隔离引擎，避免把
 * generateRaw、预设桥或监听组合根打进iframe；普通监控、日常正文和其他场次一律不读取。
 */
function 读取当前画面正文(场次标识: string, 画面键: string): string {
  if (!场次标识 || !画面键) return '';
  try {
    const vars = getVariables({ type: 'chat' }) as Record<string, unknown> | null | undefined;
    const 隔离 = vars?._隔离事件 as { 日志?: unknown } | null | undefined;
    const 日志 = Array.isArray(隔离?.日志) ? (隔离.日志 as 录像带V4日志投影[]) : [];
    const 线程 = `vtr:${场次标识}`;
    for (let i = 日志.length - 1; i >= 0; i -= 1) {
      const 条 = 日志[i];
      if (
        条?.类型 === '录像带V4' &&
        条.线程 === 线程 &&
        条.谁 === '叙事' &&
        条.画面键 === 画面键 &&
        typeof 条.文本 === 'string' &&
        条.文本.trim()
      ) {
        return 条.文本.trim();
      }
    }
  } catch {
    /* 聊天变量尚未挂载时只显示持久硬状态；不会借普通正文兜底。 */
  }
  return '';
}

export function useVideoTapeV4(options: 录像带V4客户端选项) {
  const { data, 发送中, 请求操作, 请求完成 } = options;
  const 刷新世代 = ref(0);
  let 操作序号 = 0;

  const 录像带V4监控就绪 = computed(() => {
    const V4 = data.value.系统._录像带V4;
    const 可首次进入 = V4.阶段 === '监控就绪' && V4.场景.状态 === '未开始';
    const 可从头重开 = V4.阶段 === '已安全中断' && V4.场景.状态 === '已安全中断';
    return (
      录像带V4已经使用(data.value) &&
      V4.微信.监控就绪 &&
      data.value.背包.includes('录像带') &&
      (可首次进入 || 可从头重开) &&
      !data.value.系统._特殊场景.id
    );
  });

  const 录像带V4快照 = computed<录像带V4客户端快照>(() => {
    void 刷新世代.value;
    const 场景 = data.value.系统._录像带V4.场景;
    const 画面键 = 场景.共享幕次 >= 1 ? `VTR-V4-${场景.当前房间}-B${String(场景.共享幕次).padStart(2, '0')}` : '';
    const 正文 = 读取当前画面正文(场景.场次标识, 画面键);
    return 构造录像带V4客户端快照(data.value, 正文);
  });

  const 录像带V4中 = computed(() => 录像带V4快照.value.激活);
  const 录像带V4图片地址 = computed(() => 录像带V4快照.value.候选地址);

  function 新操作标识(类型: 录像带V4操作类型): string {
    操作序号 += 1;
    const 场景 = data.value.系统._录像带V4.场景;
    const 类型码: Record<录像带V4操作类型, string> = { 开始: 'start', 切房: 'switch', 下一幕: 'next' };
    return `vtr-ui:${场景.请求世代}:${类型码[类型]}:${Date.now().toString(36)}:${操作序号.toString(36)}`;
  }

  function 请求V4操作(类型: 录像带V4操作类型): void {
    if (发送中.value || !录像带V4中.value) return;
    请求操作({ 操作标识: 新操作标识(类型), 类型 });
  }

  function 选择房间(房间: 录像带V4房间): void {
    const 快照 = 录像带V4快照.value;
    if (发送中.value || !快照.激活) return;
    if (快照.可开始) {
      if (房间 === '102') 请求V4操作('开始');
      return;
    }
    if (快照.可切房 && 房间 !== 快照.当前房间) 请求V4操作('切房');
  }

  function 下一幕(): void {
    if (录像带V4快照.value.可下一幕) 请求V4操作('下一幕');
  }

  function 结束监控(): void {
    if (发送中.value || !录像带V4快照.value.可完成) return;
    请求完成();
  }

  function 刷新录像带V4界面(): void {
    刷新世代.value += 1;
  }

  return {
    录像带V4监控就绪,
    录像带V4快照,
    录像带V4中,
    录像带V4图片地址,
    选择房间,
    下一幕,
    结束监控,
    刷新录像带V4界面,
  };
}
