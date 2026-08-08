/**
 * 特殊场景「录像带」交互（App A7a 从 App.vue 等价外移）。
 *
 * 只负责录像带双屏交互的本地运行状态（连点计数/5 秒失败窗口/本地结果）与提交动作；
 * MVU 真值（阶段/失败快照）经 data 只读，事件名与载荷、持久化 flush 由 App 注入回调保留。
 * 纯展示派生（当前图/说明文案）归 录像带舞台.vue，本模块不 import 组件/素材/DOM。
 */
import { computed, getCurrentScope, onScopeDispose, ref, type Ref } from 'vue';
import type { SchemaType } from '../../../schema';
import { 读取录像带连点失败状态, 推进录像带连点失败, type 录像带交互记录 } from '../录像带交互状态';

export interface 录像带选项 {
  /** 只读 MVU 主账；阶段与失败快照全走它。 */
  data: Readonly<Ref<SchemaType>>;
  /** 文本事务锁；提交互动前置锁与回合收口解锁都由 App 持有。 */
  发送中: Ref<boolean>;
  /** 提交互动时清掉正在流式输出中的正文段。 */
  清空流式输出: () => void;
  /** 播放录像带（App 内触发原「人妻公寓:使用录像带」）。 */
  请求使用: () => void;
  /** 提交 102/202 互动（App 内触发原「人妻公寓:录像带互动」与原载荷）。 */
  请求互动: (房间: '102' | '202') => void;
  /** 完整失败记账后写入 MVU 快照并 flush 持久化（App 内写 _特殊场景.交互 并 flush）。 */
  保存失败交互: (新交互: 录像带交互记录) => void;
}

export function useVideoTape(options: 录像带选项) {
  const { data, 发送中, 清空流式输出, 请求使用, 请求互动, 保存失败交互 } = options;

  const 录像带阶段 = computed(() => (data.value?.系统?._特殊场景?.id === '录像带' ? data.value.系统._特殊场景.阶段 : ''));
  const 录像带中 = computed(() => !!录像带阶段.value);
  const 录像带本地结果 = ref<'' | '102' | '202'>('');
  const 录像带连点目标 = 10;
  const 录像带连点计数 = ref(0);
  const 录像带失败状态 = computed(() => 读取录像带连点失败状态(data.value?.系统?._特殊场景));
  const 录像带补偿可用 = computed(() => 录像带失败状态.value.补偿可用);
  let 录像带连点开始 = 0;
  let 录像带连点timer: ReturnType<typeof setTimeout> | undefined;

  const 录像带交互幕 = computed(
    () => 录像带中.value && (录像带阶段.value === '等待102' || 录像带阶段.value === '等待202' || !!录像带本地结果.value),
  );

  /** 102 单击：只在等待102 提交。 */
  function 打开102录像() {
    if (录像带阶段.value === '等待102') 提交录像带互动('102');
  }

  function 提交录像带互动(房间: '102' | '202') {
    if (发送中.value) return;
    clearTimeout(录像带连点timer);
    录像带连点计数.value = 0;
    录像带本地结果.value = 房间;
    发送中.value = true;
    清空流式输出();
    请求互动(房间);
  }

  /** 一次完整的 5 秒尝试失败才记账：计数与开始清零，经 推进录像带连点失败 生成新快照写 MVU。 */
  function 记录录像带连点失败() {
    if (录像带阶段.value !== '等待202' || 录像带连点计数.value >= 录像带连点目标) return;
    录像带连点计数.value = 0;
    录像带连点开始 = 0;
    const 新交互 = 推进录像带连点失败(data.value?.系统?._特殊场景);
    if (!新交互) return;
    保存失败交互(新交互);
  }

  /** 202 连点：首击开 5 秒窗口，超窗先记一次完整失败再开新窗口；累计 10 次达标提交。 */
  function 连续点击202录像() {
    if (发送中.value || 录像带阶段.value !== '等待202') return;
    const 现在 = Date.now();
    if (!录像带连点开始) {
      录像带连点开始 = 现在;
      clearTimeout(录像带连点timer);
      录像带连点timer = setTimeout(记录录像带连点失败, 5000);
    } else if (现在 - 录像带连点开始 > 5000) {
      记录录像带连点失败();
      录像带连点开始 = 现在;
      clearTimeout(录像带连点timer);
      录像带连点timer = setTimeout(记录录像带连点失败, 5000);
    }
    录像带连点计数.value += 1;
    if (录像带连点计数.value >= 录像带连点目标) 提交录像带互动('202');
  }

  /** 三次失败后的补偿重连：资格仍由持久快照读取，点击只在可用时提交 202。 */
  function 自动重连202() {
    if (录像带补偿可用.value) 提交录像带互动('202');
  }

  /** 回合完成收口：清本地结果/失败窗口计时/连点计数与开始时间。 */
  function 重置录像带界面() {
    录像带本地结果.value = '';
    clearTimeout(录像带连点timer);
    录像带连点计数.value = 0;
    录像带连点开始 = 0;
  }

  /** 播放录像带入口：App 的 InventoryPopup 接线经 使用录像带() 包装后调用。 */
  function 请求使用录像带() {
    请求使用();
  }

  // 连点计时器随 composable 作用域销毁(App unmount 时自动清理，App 不再持有它)
  if (getCurrentScope()) {
    onScopeDispose(重置录像带界面);
  }

  return {
    录像带阶段,
    录像带中,
    录像带本地结果,
    录像带连点目标,
    录像带连点计数,
    录像带补偿可用,
    录像带交互幕,
    请求使用录像带,
    打开102录像,
    连续点击202录像,
    自动重连202,
    重置录像带界面,
  };
}
