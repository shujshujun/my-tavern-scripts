/**
 * 房内操作抽屉状态机（纯逻辑，不依赖 Vue 运行时，便于 node:test 直测）。
 *
 * 只负责「手机端抽屉展开 / 自动收起 / 新增操作提示」这些临时 UI 状态。桌面展示、
 * 动作生成、事件载荷、堕落值、垃圾选择弹窗等业务全部留在 App / useRoomActions 原状；
 * 动作点击后由组件直接调用原回调并立刻收起，本机不包装、不等待、不重放回调。
 *
 * 时序约定：`更新` 每次拿到完整输入自行比对（进入房间与 actionCount 可能同一 tick
 * 更新），因此不依赖 Vue watcher 的触发顺序；同 tick 换房优先按换房处理，不会误判成
 * 同房新增提示。所有计时在房间为空 / 动作归零 / 抑制 / 切桌面 / 卸载时清理。
 */

/** 状态机每次接收的完整可见性输入。 */
export interface 房内抽屉输入 {
  /** 手机断点（max-width:540px）；false 表示桌面，走流内布局，不启动任何计时。 */
  mobile: boolean;
  /** 当前房间 id；离开房间为 null。 */
  roomId: string | null;
  /** 当前实际可见动作数 = 普通动作(非录像带中) + 垃圾入口(垃圾房且有袋)计 1。 */
  actionCount: number;
  /** 统一抑制：发送中 || 静音会议正式中 || (移动端 && 键盘打开)。抑制时隐藏并取消自动计时。 */
  suppressed: boolean;
}

/** 计时器依赖注入：组件传 setTimeout/clearTimeout，测试传可控假时钟。 */
export interface 抽屉计时器 {
  设: (fn: () => void, ms: number) => unknown;
  清: (handle: unknown) => void;
}

/** 可直接传给 Vue reactive() 的普通状态对象；测试传普通对象即可读。 */
export interface 抽屉状态 {
  展开: boolean;
  新增提示: boolean;
}

export interface 抽屉状态机 {
  readonly 状态: 抽屉状态;
  更新(输入: 房内抽屉输入): void;
  /** 玩家手动展开：不启动自动收起计时。 */
  手动展开(): void;
  /** 玩家手动收起；动作点击后也走这里立即收起。 */
  手动收起(): void;
  /** 自动展开期间对把手/面板的 pointer/focus 交互：取消自动收起，保持当前展开。 */
  交互取消自动计时(): void;
  /** 组件作用域销毁时清理全部计时。 */
  销毁(): void;
}

/** 组件生命周期内第一次手机展示（含初始在桌面、首次切到手机）自动展开时长；之后不再复用。 */
export const 首次自动展开时长 = 5000;
/** 后续真实换房自动展开时长。 */
export const 换房自动展开时长 = 3000;
/** 同房新增操作提示时长。 */
export const 新增提示时长 = 3000;

export function 创建抽屉状态机(选项: { 状态?: 抽屉状态; 计时?: 抽屉计时器 } = {}): 抽屉状态机 {
  const 状态 = 选项.状态 ?? { 展开: false, 新增提示: false };
  const 计时: 抽屉计时器 = 选项.计时 ?? {
    设: (fn, ms) => setTimeout(fn, ms),
    清: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };

  // ── 内部状态（不直接暴露给组件，避免业务误读） ──
  let 当前房间: string | null = null;
  let 上次动作数 = 0;
  /** 组件生命周期内是否已发生过第一次手机展示；切到桌面不清除，首次 5 秒展示最多一次。 */
  let 首次已展开 = false;
  /** 玩家手动展开或交互接管后置真，自动收起计时不再作用。 */
  let 手动保持 = false;
  let 自动收起timer: unknown;
  let 新增提示timer: unknown;

  const 清自动收起 = () => {
    if (自动收起timer !== undefined) {
      计时.清(自动收起timer);
      自动收起timer = undefined;
    }
  };
  const 清新增提示 = () => {
    if (新增提示timer !== undefined) {
      计时.清(新增提示timer);
      新增提示timer = undefined;
    }
  };

  /** 只在本机持有期间（同房、未抑制、未手动接管）允许自动收起；迟到 timer 不作用新房间。 */
  function 启动自动收起(毫秒: number, 计划房间: string): void {
    清自动收起();
    手动保持 = false;
    自动收起timer = 计时.设(() => {
      自动收起timer = undefined;
      if (当前房间 !== 计划房间 || 手动保持) return;
      状态.展开 = false;
    }, 毫秒);
  }

  function 启动新增提示(): void {
    清新增提示();
    新增提示timer = 计时.设(() => {
      新增提示timer = undefined;
      状态.新增提示 = false;
    }, 新增提示时长);
  }

  function 更新(输入: 房内抽屉输入): void {
    // 桌面断点：清全部临时计时、提示与手机展开态，但不清「首次已展示」生命周期标志，
    // 也不清 当前房间/上次动作数 —— 断点来回不算真实进房，回手机同房只显示收起把手；
    // 真正 roomId 在手机态变化仍按换房走 3 秒。
    if (!输入.mobile) {
      清自动收起();
      清新增提示();
      手动保持 = false;
      状态.展开 = false;
      状态.新增提示 = false;
      // 吸收桌面期间的动作数变化：避免回手机同房时把「桌面已消化」的增长误判成新增提示。
      上次动作数 = 输入.actionCount;
      return;
    }

    // 先跟踪房间：换房（包括离开后再次进入同一房）才算真实换房，优先按换房处理，
    // 避免同一 tick 里 roomId 与 actionCount 同时变化时被误判成同房新增提示。
    const 换房 = 输入.roomId !== 当前房间;
    if (换房) {
      当前房间 = 输入.roomId;
      上次动作数 = 输入.actionCount;
      清新增提示();
      状态.新增提示 = false;

      // 房间为空 / 动作归零 / 抑制：收起并清理计时。
      if (!输入.roomId || 输入.actionCount <= 0 || 输入.suppressed) {
        清自动收起();
        手动保持 = false;
        状态.展开 = false;
        return;
      }

      if (!首次已展开) {
        // 组件生命周期内第一次满足「手机 + 有房间 + 有动作 + 未抑制」→ 5 秒，且只发生一次；
        // 桌面断点来回不重置该标志，因此切回手机同房不再重复 5 秒（只显示收起把手）。
        首次已展开 = true;
        状态.展开 = true;
        启动自动收起(首次自动展开时长, 输入.roomId);
      } else {
        // 后续真实换房 → 3 秒。
        状态.展开 = true;
        启动自动收起(换房自动展开时长, 输入.roomId);
      }
      return;
    }

    // 同一房间：动作数变化只影响「新增操作」提示，不强制展开。
    if (!输入.roomId || 输入.actionCount <= 0 || 输入.suppressed) {
      清自动收起();
      清新增提示();
      手动保持 = false;
      状态.展开 = false;
      状态.新增提示 = false;
      if (输入.actionCount <= 0) 上次动作数 = 0;
      return;
    }

    const 增加 = 输入.actionCount > 上次动作数;
    const 减少 = 输入.actionCount < 上次动作数;
    上次动作数 = 输入.actionCount;
    if (增加) {
      if (状态.展开) {
        清新增提示();
        状态.新增提示 = false;
      } else {
        // 抽屉正收起：短暂显示「新增操作」，打开/换房/归零/抑制后由上层清掉。
        状态.新增提示 = true;
        启动新增提示();
      }
    } else if (减少) {
      清新增提示();
      状态.新增提示 = false;
    }
  }

  function 手动展开(): void {
    清自动收起();
    手动保持 = true;
    清新增提示();
    状态.新增提示 = false;
    状态.展开 = true;
  }

  function 手动收起(): void {
    清自动收起();
    手动保持 = false;
    状态.展开 = false;
  }

  function 交互取消自动计时(): void {
    // 规则 3：自动展开期间的 pointer/focus 交互取消自动收起，当前展开状态保持，
    // 直到玩家手动收起或点动作；已收起时无自动计时可取消，保持原状。
    if (自动收起timer !== undefined) {
      清自动收起();
      手动保持 = true;
    }
  }

  function 销毁(): void {
    清自动收起();
    清新增提示();
  }

  return { 状态, 更新, 手动展开, 手动收起, 交互取消自动计时, 销毁 };
}
