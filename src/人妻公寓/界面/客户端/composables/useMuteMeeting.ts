/**
 * 特殊场景「静音会议」完整状态域（App A7b2 从 App.vue 等价外移）。
 *
 * 只负责静音会议的运行状态（场景/参与者/阶段/拍数派生、筹备与 800/1200ms timer、
 * 手机开放派生、A/B/C Pointer 互动状态机、组合图状态/回退、散会/自由/收尾）与
 * 全部本地资源（Pointer capture/长按/连点/结果 timer、window blur、场景 watch）。
 * MVU 真值（_特殊场景/户）经 data 只读，事件总线 6 个事件名与载荷、发送锁/清流、
 * store pull、toast、跨 UI 锁定（lockMeetingUI）与输入聚焦由 App 注入回调保留。
 * 本模块不 import App/store/事件总线/DOM 组件；Pointer 元素与 window blur 是
 * 状态机自身资源，由本模块持有并在 scope 销毁时自清理。
 */
import {
  computed,
  getCurrentScope,
  nextTick,
  onMounted,
  onScopeDispose,
  ref,
  watch,
  type Ref,
} from 'vue';
import type { SchemaType } from '../../../schema';
import {
  获取静音会议回退状态序列,
  获取静音会议素材相对路径,
  静音会议候选门牌顺序,
  type 静音会议候选门牌,
  type 静音会议画面状态 as 静音会议画面状态类型,
} from '../../../静音会议配置';
import { 户静态表 } from '../../../stageConfig';
// 只读纯业务判定，不能经手机系统组合根把宿主手机渲染副作用带进客户端 iframe。
import { 获取静音会议手机状态 } from '../../../脚本/游戏逻辑/手机/静音会议旁路';
import { 版本素材基址 } from '../assets';
import type {
  静音会议互动ID,
  静音会议峰值模式,
  静音会议筹备步骤 as 静音会议筹备步骤类型,
  静音会议运行状态,
  静音会议活动指针 as 静音会议活动指针类型,
} from '../types';

/** 三道 Pointer 互动的提交载荷；判别联合保证 A/B/C 各自契约精确。 */
export type 静音会议互动载荷 =
  | { id: 'A' }
  | { id: 'B'; 目标妻: string }
  | { id: 'C'; 模式: string };

export interface 静音会议选项 {
  /** 只读 MVU 主账；场景/参与者/门槛/手机判据全走它。 */
  data: Readonly<Ref<SchemaType>>;
  /** 文本事务锁；互动提交/重试/散会/结束收口共用。 */
  sending: Ref<boolean>;
  /** 提交互动时清掉正在流式输出中的正文段。 */
  clearStream: () => void;
  /** 拉取最新 MVU 主账；筹备/启动后的延迟同步用它。 */
  pullState: () => void | Promise<void>;
  /** 提示 toast；筹备门槛/指针失败/重试缺失走它。 */
  toast: (文本: string, 时长?: number) => void;
  /** 正式会议分支的跨 UI 写入：管理员室 + 关弹窗 + 清选中（App 保持集合与顺序）。 */
  lockMeetingUI: () => void;
  /** 输入框聚焦（会后活动继续时）。 */
  focusInput: () => void;
  /** 事件总线接线（App 保留原事件名与载荷）。 */
  useMeeting: () => void;
  cancelPreparation: () => void;
  startMeeting: (载荷: { 参与妻: 静音会议候选门牌[]; 议题: string }) => void;
  reportInteractionFailure: (载荷: { id: 静音会议互动ID }) => void;
  submitInteraction: (载荷: 静音会议互动载荷, recovery: boolean) => void;
  endMeeting: () => void;
}

export function useMuteMeeting(options: 静音会议选项) {
  const { data, sending, clearStream, pullState, toast, lockMeetingUI, focusInput, useMeeting, cancelPreparation, startMeeting, reportInteractionFailure, submitInteraction, endMeeting } = options;

  const 空静音会议状态: 静音会议运行状态 = {
    id: '',
    阶段: '',
    地点: '',
    参与妻: [],
    演出妻: [],
    演出夫: [],
    启动楼层: -1,
    当前拍: 0,
    议题: '',
    重点妻: '',
    峰值模式: '',
    会后妻: [],
    自由循环次数: 0,
    交互: { id: '', 类型: '', 状态: '', 失败次数: 0, 补偿可用: false },
  };

  const 静音会议场景 = computed<静音会议运行状态>(() => {
    const 场 = data.value?.系统?._特殊场景;
    return 场?.id === '静音会议' ? (场 as 静音会议运行状态) : 空静音会议状态;
  });
  const 静音会议中 = computed(() => 静音会议场景.value.id === '静音会议');
  const 静音会议正式中 = computed(() => 静音会议中.value && 静音会议场景.value.阶段 !== '筹备');
  const 静音会议当前拍 = computed(() => Math.max(0, Number(静音会议场景.value.当前拍) || 0));

  function 是静音会议候选门牌(值: string): 值 is 静音会议候选门牌 {
    return 静音会议候选门牌顺序.includes(值 as 静音会议候选门牌);
  }

  function 规范静音会议妻名单(原值: readonly string[]): 静音会议候选门牌[] {
    return [...new Set(原值.filter(是静音会议候选门牌))].sort(
      (左, 右) => 静音会议候选门牌顺序.indexOf(左) - 静音会议候选门牌顺序.indexOf(右),
    );
  }

  const 静音会议参与妻 = computed(() => 规范静音会议妻名单(静音会议场景.value.参与妻));
  const 静音会议演出妻 = computed(() => {
    if (
      静音会议当前拍.value > 12 ||
      ['会后', '收尾'].includes(静音会议场景.value.阶段) ||
      静音会议场景.value.阶段.includes('自由')
    ) {
      const 会后 = 规范静音会议妻名单(静音会议场景.value.会后妻);
      if (会后.length) return 会后;
    }
    const 演出 = 规范静音会议妻名单(静音会议场景.value.演出妻);
    return 演出.length ? 演出 : 静音会议参与妻.value;
  });
  const 静音会议重点妻名 = computed(() => {
    const 门牌号 = 静音会议场景.value.重点妻;
    return 是静音会议候选门牌(门牌号) ? 户静态表[门牌号].妻名 : '';
  });
  const 静音会议阶段短名 = computed(() => {
    const 阶段 = 静音会议场景.value.阶段;
    if (阶段 === '筹备') return '筹备';
    if (阶段 === '正文') return '固定会议';
    if (阶段 === '散会选择') return '散会';
    if (阶段.includes('自由')) return '会后自由';
    if (阶段 === '会后') return '门后';
    if (阶段 === '收尾') return '最终收尾';
    return '静音会议';
  });
  const 静音会议拍数文案 = computed(() => {
    const 交互 = 静音会议场景.value.交互;
    if (交互.状态 === '待操作' && ['A', 'B', 'C'].includes(交互.id)) return `交互 ${交互.id}`;
    if (静音会议场景.value.阶段.includes('自由')) {
      return `自由循环 ${静音会议场景.value.自由循环次数 + 1}`;
    }
    return 静音会议当前拍.value > 0 ? `第 ${静音会议当前拍.value} 拍` : '准备中';
  });

  const 静音会议筹备步骤 = ref<静音会议筹备步骤类型>('');
  const 静音会议筹备妻 = ref<静音会议候选门牌[]>([]);
  const 静音会议筹备议题 = ref('');
  const 静音会议筹备提交中 = ref(false);
  let 静音会议筹备timer: ReturnType<typeof setTimeout> | undefined;
  const 静音会议议题列表 = ['公共设施维修', '噪音与住户投诉', '物业费及公共账目'] as const;

  const 静音会议候选列表 = computed(() =>
    静音会议候选门牌顺序.map(门牌 => {
      const 户 = data.value?.户?.[门牌];
      const 原因: string[] = [];
      if (!户) 原因.push('尚未入住');
      if (户 && 户.妻.当前阶段 < 4) 原因.push(`当前 L${户.妻.当前阶段}，需要 L4`);
      if (户 && !户.妻.特殊.some(项 => 项.includes('遥控跳蛋'))) 原因.push('未装载遥控跳蛋');
      return {
        门牌,
        妻名: 户静态表[门牌].妻名,
        夫名: 户静态表[门牌].夫名,
        合格: 原因.length === 0,
        原因: 原因.join(' · '),
      };
    }),
  );
  const 静音会议筹备可确认 = computed(
    () =>
      静音会议筹备妻.value.length >= 2 &&
      静音会议筹备妻.value.length <= 3 &&
      !!静音会议筹备议题.value &&
      静音会议筹备妻.value.every(门牌 => 静音会议候选列表.value.find(项 => 项.门牌 === 门牌)?.合格),
  );
  const 静音会议筹备妻名 = computed(() => 静音会议筹备妻.value.map(门牌 => 户静态表[门牌].妻名));
  const 静音会议筹备夫名 = computed(() => 静音会议筹备妻.value.map(门牌 => 户静态表[门牌].夫名).filter(Boolean));

  /** 背包票进入筹备：App wrapper 保 guard/关背包后调用；重置、使用事件与 800ms pull/sync 在此。 */
  function 请求打开静音会议筹备() {
    if (sending.value || 静音会议中.value) return;
    静音会议筹备妻.value = [];
    静音会议筹备议题.value = '';
    静音会议筹备提交中.value = false;
    静音会议筹备步骤.value = '选择';
    useMeeting();
    clearTimeout(静音会议筹备timer);
    静音会议筹备timer = setTimeout(() => {
      try {
        pullState();
      } catch {
        /* 由状态事件优先同步 */
      }
      nextTick(同步静音会议界面);
    }, 800);
  }

  function 取消静音会议筹备() {
    if (静音会议筹备提交中.value) return;
    const 应通知脚本 = 静音会议场景.value.阶段 === '筹备';
    静音会议筹备步骤.value = '';
    clearTimeout(静音会议筹备timer);
    静音会议筹备妻.value = [];
    静音会议筹备议题.value = '';
    if (应通知脚本) cancelPreparation();
  }

  function 切换静音会议筹备妻(门牌: 静音会议候选门牌) {
    if (!静音会议候选列表.value.find(项 => 项.门牌 === 门牌)?.合格) return;
    if (静音会议筹备妻.value.includes(门牌)) {
      静音会议筹备妻.value = 静音会议筹备妻.value.filter(项 => 项 !== 门牌);
      return;
    }
    if (静音会议筹备妻.value.length >= 3) {
      toast('静音会议最多选择 3 名妻子。');
      return;
    }
    静音会议筹备妻.value = 规范静音会议妻名单([...静音会议筹备妻.value, 门牌]);
  }

  function 查看静音会议确认() {
    if (静音会议筹备可确认.value) 静音会议筹备步骤.value = '确认';
  }

  function 发送静音会议通知() {
    if (!静音会议筹备可确认.value || 静音会议筹备提交中.value) return;
    静音会议筹备提交中.value = true;
    startMeeting({
      参与妻: [...静音会议筹备妻.value],
      议题: 静音会议筹备议题.value,
    });
    clearTimeout(静音会议筹备timer);
    静音会议筹备timer = setTimeout(() => {
      try {
        pullState();
      } catch {
        /* 状态事件缺失时仍由本地真值解除提交锁 */
      }
      nextTick(() => {
        同步静音会议界面();
        if (静音会议场景.value.阶段 === '筹备') 静音会议筹备步骤.value = '选择';
      });
    }, 1200);
  }

  const 静音会议手机状态 = computed(() => 获取静音会议手机状态(data.value ?? null));
  const 静音会议手机已开放 = computed(() => 静音会议手机状态.value.场景中 && 静音会议手机状态.value.已开放);
  const 静音会议手机可打开 = computed(() => !静音会议正式中.value || (!sending.value && 静音会议手机状态.value.可打开));
  const 静音会议手机标题 = computed(() => {
    if (!静音会议正式中.value) return '打开手机';
    if (sending.value && 静音会议手机状态.value.已开放) return '会议正文正在生成，稍后再看微信。';
    return 静音会议手机状态.value.可打开 ? '会场微信已开放' : 静音会议手机状态.value.禁用原因 || '会议微信暂不可用';
  });

  const 静音会议互动id = computed<静音会议互动ID>(() => {
    const id = 静音会议场景.value.交互.id;
    return id === 'B' || id === 'C' ? id : 'A';
  });
  const 静音会议互动待操作 = computed(() => 静音会议场景.value.交互.状态 === '待操作');
  const 静音会议等待AI重试 = computed(() => 静音会议场景.value.交互.状态 === '等待AI');
  const 静音会议B目标 = ref<静音会议候选门牌 | ''>('');
  const 静音会议C模式 = ref<静音会议峰值模式 | ''>('');
  const 静音会议长按中 = ref(false);
  const 静音会议连点计数 = ref(0);
  const 静音会议本地失败次数 = ref(0);
  const 静音会议本地画面状态 = ref<静音会议画面状态类型 | ''>('');
  const 静音会议互动结果 = ref<
    | {
        类型: 'success' | 'failure';
        标题: string;
        说明: string;
      }
    | undefined
  >();
  const 静音会议互动失败次数 = computed(() =>
    Math.max(静音会议本地失败次数.value, 静音会议场景.value.交互.失败次数 || 0),
  );
  const 静音会议互动补偿可用 = computed(() => 静音会议场景.value.交互.补偿可用 || 静音会议互动失败次数.value >= 3);
  const 静音会议交互幕 = computed(
    () =>
      静音会议正式中.value &&
      (((静音会议互动待操作.value || 静音会议等待AI重试.value) && ['A', 'B', 'C'].includes(静音会议场景.value.交互.id)) ||
        !!静音会议互动结果.value),
  );
  const 静音会议互动标题 = computed(
    () =>
      ({
        A: '连接全部设备',
        B: '维持第二档',
        C: '执行最终加档',
      })[静音会议互动id.value],
  );
  const 静音会议互动说明 = computed(
    () =>
      ({
        A: '点按一次，令所有参会设备同时进入第一档。',
        B: '先从参会妻子中选定一人，再持续按住控制键 2 秒。',
        C: '先决定集中一人或全体同步，再于 6 秒内完成连续点击。',
      })[静音会议互动id.value],
  );
  const 静音会议连点目标 = computed(() =>
    静音会议C模式.value === '同步' ? Math.max(6, 静音会议参与妻.value.length * 3) : 6,
  );
  const 静音会议连点点亮妻 = computed(() => {
    if (静音会议互动id.value !== 'C' || !静音会议连点计数.value) return [];
    if (静音会议C模式.value === '集中') {
      const 重点 = 静音会议场景.value.重点妻;
      return 是静音会议候选门牌(重点) ? [重点] : [];
    }
    const 已点亮 = Math.min(静音会议参与妻.value.length, Math.floor(静音会议连点计数.value / 3));
    return 静音会议参与妻.value.slice(0, 已点亮);
  });

  let 静音会议活动指针: 静音会议活动指针类型 | null = null;
  let 静音会议连点timer: ReturnType<typeof setTimeout> | undefined;
  let 静音会议结果timer: ReturnType<typeof setTimeout> | undefined;

  function 释放静音会议指针() {
    const 指针 = 静音会议活动指针;
    if (!指针) return;
    clearTimeout(指针.长按timer);
    try {
      if (指针.元素.hasPointerCapture(指针.id)) 指针.元素.releasePointerCapture(指针.id);
    } catch {
      /* 元素已离开文档时只需清本地状态 */
    }
    静音会议活动指针 = null;
    静音会议长按中.value = false;
  }

  function 清理静音会议连点() {
    clearTimeout(静音会议连点timer);
    静音会议连点timer = undefined;
    静音会议连点计数.value = 0;
  }

  function 清理静音会议互动现场(保留结果 = false) {
    释放静音会议指针();
    清理静音会议连点();
    clearTimeout(静音会议结果timer);
    静音会议结果timer = undefined;
    if (!保留结果) 静音会议互动结果.value = undefined;
  }

  function 捕获静音会议指针(event: PointerEvent, 类型: 静音会议互动ID): boolean {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      静音会议活动指针 ||
      !静音会议互动待操作.value ||
      静音会议互动id.value !== 类型 ||
      静音会议互动结果.value
    ) {
      return false;
    }
    const 元素 = event.currentTarget as HTMLElement | null;
    if (!元素) return false;
    try {
      元素.setPointerCapture(event.pointerId);
    } catch {
      return false;
    }
    静音会议活动指针 = { id: event.pointerId, 类型, 元素 };
    return true;
  }

  function 静音会议互动载荷(id = 静音会议互动id.value): 静音会议互动载荷 {
    if (id === 'B') return { id, 目标妻: 静音会议B目标.value || 静音会议场景.value.重点妻 };
    if (id === 'C') return { id, 模式: 静音会议C模式.value || 静音会议场景.value.峰值模式 };
    return { id };
  }

  function 显示静音会议互动失败(说明: string) {
    if (!静音会议互动待操作.value || 静音会议互动结果.value) return;
    const id = 静音会议互动id.value;
    清理静音会议互动现场();
    静音会议本地失败次数.value += 1;
    静音会议互动结果.value = { 类型: 'failure', 标题: '操作未完成', 说明 };
    reportInteractionFailure({ id });
    静音会议结果timer = setTimeout(() => {
      静音会议互动结果.value = undefined;
    }, 720);
  }

  function 提交静音会议互动(补偿 = false) {
    if (!静音会议互动待操作.value || 静音会议互动结果.value) return;
    const id = 静音会议互动id.value;
    if (id === 'B' && !静音会议B目标.value) return;
    if (id === 'C' && !静音会议C模式.value) return;
    清理静音会议互动现场();
    if (id === 'A') 静音会议本地画面状态.value = 'DETAIL';
    if (id === 'C') 静音会议本地画面状态.value = 'PEAK';
    静音会议互动结果.value = {
      类型: 'success',
      标题: 补偿 ? '系统已接管操作' : '控制信号已确认',
      说明:
        id === 'A'
          ? '全部设备已经连接，第一档同步启动。'
          : id === 'B'
            ? `${户静态表[静音会议B目标.value as 静音会议候选门牌].妻名}的第二档保持稳定。`
            : 静音会议C模式.value === '同步'
              ? '所有参会设备同时进入最终档。'
              : '最终档已集中到重点目标。',
    };
    静音会议结果timer = setTimeout(() => {
      sending.value = true;
      clearStream();
      submitInteraction(静音会议互动载荷(id), 补偿);
    }, 520);
  }

  function 静音会议A按下(event: PointerEvent) {
    捕获静音会议指针(event, 'A');
  }

  function 静音会议A抬起(event: PointerEvent) {
    if (静音会议活动指针?.类型 !== 'A' || 静音会议活动指针.id !== event.pointerId) return;
    释放静音会议指针();
    提交静音会议互动();
  }

  function 选择静音会议B目标(门牌: 静音会议候选门牌, event?: PointerEvent) {
    event?.preventDefault();
    if (event && (!event.isPrimary || event.button !== 0)) return;
    if (静音会议互动id.value === 'B' && 静音会议互动待操作.value && !静音会议互动结果.value) {
      静音会议B目标.value = 门牌;
    }
  }

  function 静音会议B按下(event: PointerEvent) {
    if (!静音会议B目标.value || !捕获静音会议指针(event, 'B') || !静音会议活动指针) return;
    静音会议长按中.value = true;
    静音会议活动指针.长按timer = setTimeout(() => {
      释放静音会议指针();
      提交静音会议互动();
    }, 2000);
  }

  function 静音会议B抬起(event: PointerEvent) {
    if (静音会议活动指针?.类型 !== 'B' || 静音会议活动指针.id !== event.pointerId) return;
    释放静音会议指针();
    显示静音会议互动失败('需要持续按住整整 2 秒；现在可以立即重试。');
  }

  function 选择静音会议C模式(模式: 静音会议峰值模式, event?: PointerEvent) {
    event?.preventDefault();
    if (event && (!event.isPrimary || event.button !== 0)) return;
    if (静音会议互动id.value !== 'C' || !静音会议互动待操作.value || 静音会议互动结果.value) return;
    if (静音会议连点计数.value) 清理静音会议连点();
    静音会议C模式.value = 模式;
  }

  function 静音会议C按下(event: PointerEvent) {
    if (!静音会议C模式.value) return;
    捕获静音会议指针(event, 'C');
  }

  function 静音会议C抬起(event: PointerEvent) {
    if (静音会议活动指针?.类型 !== 'C' || 静音会议活动指针.id !== event.pointerId) return;
    释放静音会议指针();
    if (!静音会议连点计数.value) {
      静音会议连点timer = setTimeout(() => {
        显示静音会议互动失败('没有在 6 秒内完成连续点击；计数已经复位。');
      }, 6000);
    }
    静音会议连点计数.value += 1;
    if (静音会议连点计数.value >= 静音会议连点目标.value) 提交静音会议互动();
  }

  function 静音会议指针取消(event?: PointerEvent, 记录失败 = false) {
    if (event && 静音会议活动指针 && 静音会议活动指针.id !== event.pointerId) return;
    const 原类型 = 静音会议活动指针?.类型;
    释放静音会议指针();
    if (原类型 === 'C') 清理静音会议连点();
    if (记录失败 && 原类型) 显示静音会议互动失败('指针离开了控制区域；捕获状态已清理，可以重试。');
  }

  function 静音会议窗口失焦() {
    释放静音会议指针();
    清理静音会议连点();
  }

  function 静音会议互动补偿通过() {
    if (静音会议互动补偿可用.value) 提交静音会议互动(true);
  }

  function 重试静音会议互动续拍() {
    if (!静音会议等待AI重试.value || sending.value) return;
    const 载荷 = 静音会议互动载荷();
    if ((载荷.id === 'B' && !('目标妻' in 载荷 && 载荷.目标妻)) || (载荷.id === 'C' && !('模式' in 载荷 && 载荷.模式))) {
      toast('交互目标状态缺失，无法重放下一拍。');
      return;
    }
    sending.value = true;
    clearStream();
    静音会议互动结果.value = {
      类型: 'success',
      标题: '重新发送控制结果',
      说明: '交互已经通过，正在重新生成后续正文。',
    };
    submitInteraction(载荷, false);
  }

  const 静音会议画面状态 = computed<静音会议画面状态类型>(() => {
    if (静音会议本地画面状态.value) return 静音会议本地画面状态.value;
    const 拍 = 静音会议当前拍.value;
    const 待交互 = 静音会议互动待操作.value ? 静音会议互动id.value : '';
    if (拍 <= 3 || 待交互 === 'A') return 'CLEAN';
    if (拍 <= 10 || 待交互 === 'C') return 'DETAIL';
    return 'PEAK';
  });
  const 静音会议显示组合图 = computed(
    () =>
      静音会议正式中.value &&
      静音会议当前拍.value >= 1 &&
      静音会议当前拍.value <= 12 &&
      (静音会议参与妻.value.length === 2 || 静音会议参与妻.value.length === 3),
  );
  const 静音会议图回退序号 = ref(0);
  const 静音会议图已加载 = ref(false);
  const 静音会议图状态序列 = computed(
    () => 获取静音会议回退状态序列(静音会议画面状态.value) ?? ([] as readonly 静音会议画面状态类型[]),
  );
  const 静音会议当前图地址 = computed(() => {
    if (!静音会议显示组合图.value) return '';
    const 状态 = 静音会议图状态序列.value[静音会议图回退序号.value];
    // 组合图在主仓库随 0.69 Tag 发布,不走 qgy-assets 成人CG仓(那里从未上传过
    // mute-meeting 目录,全部 404)(2026-08-04 M9)
    const 相对路径 = 状态 ? 获取静音会议素材相对路径(静音会议参与妻.value, 状态) : null;
    return 相对路径 ? `${版本素材基址}/${相对路径}` : '';
  });

  function 静音会议图加载成功() {
    静音会议图已加载.value = true;
  }

  function 静音会议图加载失败() {
    静音会议图已加载.value = false;
    if (静音会议图回退序号.value < 静音会议图状态序列.value.length) 静音会议图回退序号.value += 1;
  }

  watch(
    () => `${静音会议参与妻.value.join('-')}|${静音会议画面状态.value}`,
    () => {
      静音会议图回退序号.value = 0;
      静音会议图已加载.value = false;
    },
  );

  watch(
    () => `${静音会议场景.value.id}|${静音会议场景.value.交互.id}`,
    () => {
      清理静音会议互动现场();
      静音会议B目标.value = '';
      静音会议C模式.value = '';
      静音会议本地失败次数.value = 0;
      静音会议本地画面状态.value = '';
    },
  );

  const 静音会议会后选择 = ref<静音会议候选门牌[]>([]);
  const 静音会议继续已选 = ref(false);
  const 静音会议自由行动进行中 = ref(false);
  const 静音会议待散会选择 = computed(
    () =>
      静音会议正式中.value &&
      静音会议场景.value.阶段 === '散会选择' &&
      静音会议当前拍.value === 12 &&
      !静音会议交互幕.value,
  );
  const 静音会议会后选择合法 = computed(
    () =>
      静音会议会后选择.value.length >= 1 &&
      静音会议会后选择.value.length <= 静音会议参与妻.value.length &&
      静音会议会后选择.value.every(门牌 => 静音会议参与妻.value.includes(门牌)),
  );
  const 静音会议会后选择提示 = computed(() =>
    静音会议会后选择合法.value
      ? `将留下 ${静音会议会后选择.value.map(门牌 => 户静态表[门牌].妻名).join('、')}`
      : '请至少选择 1 名妻子',
  );
  const 静音会议自由待选择 = computed(
    () =>
      静音会议正式中.value &&
      静音会议场景.value.阶段.includes('自由') &&
      静音会议当前拍.value >= 15 &&
      !静音会议继续已选.value,
  );
  const 静音会议收尾待重试 = computed(() => 静音会议正式中.value && 静音会议场景.value.阶段 === '收尾');

  watch(
    () => 静音会议场景.value.自由循环次数,
    (新次数, 旧次数) => {
      if (静音会议自由行动进行中.value && 静音会议场景.value.阶段.includes('自由') && 新次数 > 旧次数) {
        静音会议继续已选.value = false;
        静音会议自由行动进行中.value = false;
      }
    },
  );

  function 切换静音会议会后妻(门牌: 静音会议候选门牌) {
    if (!静音会议参与妻.value.includes(门牌)) return;
    静音会议会后选择.value = 静音会议会后选择.value.includes(门牌)
      ? 静音会议会后选择.value.filter(项 => 项 !== 门牌)
      : 规范静音会议妻名单([...静音会议会后选择.value, 门牌]);
  }

  function 继续静音会议会后活动() {
    静音会议继续已选.value = true;
    nextTick(() => focusInput());
  }

  function 请求结束静音会议() {
    if ((!静音会议自由待选择.value && !静音会议收尾待重试.value) || sending.value) return;
    sending.value = true;
    clearStream();
    endMeeting();
  }

  /** 场景阶段/筹备/清场后的统一界面收口；正式会议分支的跨 UI 写入委托 App lockMeetingUI。 */
  function 同步静音会议界面() {
    clearTimeout(静音会议筹备timer);
    静音会议筹备timer = undefined;
    if (!静音会议中.value) {
      静音会议筹备步骤.value = '';
      静音会议筹备提交中.value = false;
      静音会议会后选择.value = [];
      静音会议继续已选.value = false;
      静音会议自由行动进行中.value = false;
      清理静音会议互动现场();
      return;
    }
    if (静音会议场景.value.阶段 === '筹备') {
      if (!静音会议筹备步骤.value) 静音会议筹备步骤.value = '选择';
      静音会议筹备提交中.value = false;
      return;
    }
    静音会议筹备步骤.value = '';
    静音会议筹备提交中.value = false;
    lockMeetingUI();
  }

  /** 回合完成收口：散会选择拍清掉本地会后名单。 */
  function 处理静音会议回合完成前() {
    if (静音会议待散会选择.value) 静音会议会后选择.value = [];
  }

  /** 回合失败收口：清指针/连点/互动结果与本地画面态。 */
  function 处理静音会议回合失败前() {
    释放静音会议指针();
    清理静音会议连点();
    if (静音会议互动待操作.value) {
      静音会议互动结果.value = undefined;
      静音会议本地画面状态.value = '';
    }
  }

  /** 回合失败后的自由循环闩锁复位；主动“放弃并重试”保留闩锁由 App 判断传入。 */
  function 处理静音会议自由回合失败(将自动重试: boolean) {
    if (静音会议正式中.value && 静音会议场景.value.阶段.includes('自由') && !将自动重试) {
      静音会议继续已选.value = false;
      静音会议自由行动进行中.value = false;
    }
  }

  /** 提示事件里的筹备锁处理；App 在开头调用后继续地图结果/toast/pull。 */
  function 处理静音会议提示() {
    if (静音会议筹备提交中.value) {
      静音会议筹备提交中.value = false;
      if (静音会议场景.value.阶段 === '筹备') 静音会议筹备步骤.value = '选择';
      else if (!静音会议中.value) 静音会议筹备步骤.value = '';
    } else if (静音会议筹备步骤.value && !静音会议中.value) {
      clearTimeout(静音会议筹备timer);
      静音会议筹备步骤.value = '';
    }
  }

  /** 发出行动时标记自由循环进行中（时点与 App 原判断一致）。 */
  function 标记静音会议自由行动开始() {
    if (静音会议场景.value.阶段.includes('自由')) 静音会议自由行动进行中.value = true;
  }

  watch(
    () => `${静音会议场景.value.id}|${静音会议场景.value.阶段}`,
    () => nextTick(同步静音会议界面),
    { flush: 'post' },
  );

  // window blur 是状态机自身资源：mount 挂、scope 销毁卸；筹备 timer/指针/长按/连点/结果 timer 一并清。
  onMounted(() => {
    window.addEventListener('blur', 静音会议窗口失焦);
  });
  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearTimeout(静音会议筹备timer);
      清理静音会议互动现场();
      window.removeEventListener('blur', 静音会议窗口失焦);
    });
  }

  return {
    静音会议场景,
    静音会议中,
    静音会议正式中,
    静音会议当前拍,
    是静音会议候选门牌,
    静音会议参与妻,
    静音会议演出妻,
    静音会议重点妻名,
    静音会议阶段短名,
    静音会议拍数文案,

    静音会议筹备步骤,
    静音会议筹备妻,
    静音会议筹备议题,
    静音会议筹备提交中,
    静音会议议题列表,
    静音会议候选列表,
    静音会议筹备可确认,
    静音会议筹备妻名,
    静音会议筹备夫名,
    请求打开静音会议筹备,
    取消静音会议筹备,
    切换静音会议筹备妻,
    查看静音会议确认,
    发送静音会议通知,

    静音会议手机已开放,
    静音会议手机可打开,
    静音会议手机标题,

    静音会议互动id,
    静音会议互动待操作,
    静音会议等待AI重试,
    静音会议B目标,
    静音会议C模式,
    静音会议长按中,
    静音会议连点计数,
    静音会议互动失败次数,
    静音会议互动补偿可用,
    静音会议交互幕,
    静音会议互动标题,
    静音会议互动说明,
    静音会议连点目标,
    静音会议连点点亮妻,
    静音会议互动结果,
    静音会议A按下,
    静音会议A抬起,
    选择静音会议B目标,
    静音会议B按下,
    静音会议B抬起,
    选择静音会议C模式,
    静音会议C按下,
    静音会议C抬起,
    静音会议指针取消,
    静音会议互动补偿通过,
    重试静音会议互动续拍,

    静音会议画面状态,
    静音会议显示组合图,
    静音会议图已加载,
    静音会议当前图地址,
    静音会议图加载成功,
    静音会议图加载失败,

    静音会议会后选择,
    静音会议继续已选,
    静音会议待散会选择,
    静音会议会后选择合法,
    静音会议会后选择提示,
    静音会议自由待选择,
    静音会议收尾待重试,
    切换静音会议会后妻,
    继续静音会议会后活动,
    请求结束静音会议,

    同步静音会议界面,
    处理静音会议回合完成前,
    处理静音会议回合失败前,
    处理静音会议自由回合失败,
    处理静音会议提示,
    标记静音会议自由行动开始,
  };
}
