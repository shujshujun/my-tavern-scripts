/**
 * 房内动作生成器（App A6b 从 App.vue 等价外移）。
 *
 * 只负责按地点生成 卡动作 列表、当前房间动作/普通房间动作 两层过滤与破门连点局部状态；
 * 全局业务/事件/时间/场景仍由 App 持有，经 房间动作选项 显式注入。
 * MapPopup 房卡与正文舞台共用同一个 房间动作 入口；确认已到达动作地点 也供 App 的
 * 看监控 等跨区块移动复用。
 */
import { computed, getCurrentScope, onScopeDispose, ref, type Ref } from 'vue';
import type { SchemaType } from '../../../schema';
import { 户静态表, 查房间, 门牌列表, type 门牌 } from '../../../stageConfig';
import { 丈夫在楼 } from '../../../脚本/游戏逻辑/楼层时钟';
import { 查金币 } from '../../../脚本/游戏逻辑/经济系统';
import { 列出地点管理任务, 管理任务选项 } from '../../../脚本/游戏逻辑/管理任务系统';
import { 列出阶段线路候选详情, type 阶段线路候选 } from '../../../脚本/游戏逻辑/阶段线路系统';
import { 玩家当前日 } from '../../../脚本/游戏逻辑/玩家资源系统';
import type { 卡动作, 客户端时间方式 } from '../types';

/** 业务事件回调：App 在回调内保留原事件名与载荷，本模块不直连事件总线。 */
export interface 房间动作事件 {
  对饮: (房间id: string) => void;
  丈夫礼物: (载荷: { 门牌: string; 道具id: '香烟' | '球赛票' }) => void;
  催租: (载荷: { 门牌: string; 选择: '硬催' | '宽限' | '垫上' }) => void;
  空房偷窃: (房间id: string) => void;
  打听: (门牌号: string) => void;
  荣耀洞: () => void;
  捡金币: (房间id: string) => void;
  处理管理任务: (载荷: { 任务id: string; 选项id: string; 地点: string }) => void;
}

export interface 房间动作选项 {
  /** 只读 MVU 主账；动作门控/任务/训练日全走它。 */
  data: Readonly<Ref<SchemaType>>;
  当前房间: Ref<string | null>;
  时段: Readonly<Ref<string>>;
  绝对时段: Readonly<Ref<number>>;
  /** 文本事务锁；楼务瓷砖与到达确认复用。 */
  发送中: Ref<boolean>;
  /** 撤销资格；晨跑/健身/302/管理员室亮撤销动作。 */
  时间撤销可用: Readonly<Ref<boolean>>;
  /** 本次进入是否撬门而入；撬进空屋才有翻现金一说。 */
  已破门进入: Ref<boolean>;
  /** 荣耀洞冷却是否已过；冷却中不摆灰按钮。 */
  荣耀洞可用: Readonly<Ref<boolean>>;
  /** 住户房里是否有人（串门/对饮/催租门）。 */
  房内有人在: (房间id: string) => boolean;
  /** 妻位置显示统一口（催租的“她在家”门）。 */
  妻现位: (门牌号: 门牌) => string;
  /** 移动入口；到达确认被取消或写入失败时返回 false。 */
  进入: (房间id: string, 破门?: boolean, 保持地图?: boolean) => Promise<boolean>;
  /** 以 chat 变量 _场景 为唯一真值重建场景态；到达失败时立刻纠正画面。 */
  同步场景自变量: () => void;
  弹提示: (文本: string, 时长?: number) => void;
  /** 时间推进入口（晨跑/健身/小憩/睡到次日早晨）。 */
  发起时间推进: (方式: 客户端时间方式) => void;
  发起时间撤销: () => void;
  /** 已在地点时直接启动线路剧情。 */
  启动阶段线路剧情: (地点: string, 候选: 阶段线路候选) => void;
  事件: 房间动作事件;
}

export function useRoomActions(options: 房间动作选项) {
  const {
    data,
    当前房间,
    时段,
    绝对时段,
    发送中,
    时间撤销可用,
    已破门进入,
    荣耀洞可用,
    房内有人在,
    妻现位,
    进入,
    同步场景自变量,
    弹提示,
    发起时间推进,
    发起时间撤销,
    启动阶段线路剧情,
    事件,
  } = options;

  // 连击破门("点的语法":对没人应的户门连点 6 下=撬开;2.5 秒窗口)
  const 破门目标 = ref('');
  const 破门数 = ref(0);
  let 破门计时: ReturnType<typeof setTimeout> | undefined;

  function 敲撬门(房间id: string) {
    if (破门目标.value !== 房间id) {
      破门目标.value = 房间id;
      破门数.value = 0;
    }
    破门数.value += 1;
    clearTimeout(破门计时);
    破门计时 = setTimeout(() => {
      破门数.value = 0;
      破门目标.value = '';
    }, 2500);
    if (破门数.value >= 6) {
      破门数.value = 0;
      破门目标.value = '';
      进入(房间id, true);
    }
  }

  /** 地图房卡允许“一键前往并执行”，但移动被玩家取消或场景写入失败时不得继续发业务事件。 */
  async function 确认已到达动作地点(地点: string): Promise<boolean> {
    try {
      if (当前房间.value !== 地点 && !(await 进入(地点, false, true))) return false;
    } catch (error) {
      // `进入` 先更新本地动效再写宿主变量；持久化失败时立刻以聊天真值纠正画面。
      同步场景自变量();
      弹提示(`没有成功进入目标地点：${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
    return 当前房间.value === 地点;
  }

  function 房间动作(id: string | null): 卡动作[] {
    if (!id) return [];
    const 房 = 查房间(id);
    const 动作: 卡动作[] = [];
    添加管理任务动作(动作, id);

    if (id === '公寓外部') {
      if (当前房间.value !== id) {
        动作.push({
          kicker: 'OUTING',
          icon: 'sun',
          文案: '走出公寓',
          做: async () => {
            await 进入(id);
          },
        });
      } else {
        动作.push({
          kicker: 'RUN',
          icon: 'sun',
          文案: '去河畔晨跑',
          做: async () => {
            await 进入('晨跑公园');
          },
        });
        动作.push({
          kicker: 'GYM',
          icon: 'favor',
          文案: '去公寓健身房',
          做: async () => {
            await 进入('健身房');
          },
        });
        动作.push({
          kicker: 'RETURN',
          icon: 'home',
          文案: '返回公寓大堂',
          做: async () => {
            await 进入('大堂');
          },
        });
      }
      return 动作;
    }

    if (id === '晨跑公园') {
      if (当前房间.value !== id) {
        动作.push({
          kicker: 'RUN',
          icon: 'sun',
          文案: '走到河畔公园',
          做: async () => {
            await 进入(id);
          },
        });
      } else {
        const 今日 = 玩家当前日(data.value);
        if (时段.value === '早上' && data.value.玩家资源._晨跑训练日 !== 今日) {
          动作.push({ kicker: 'TRAIN', icon: 'sun', 文案: '开始晨跑（推进一时段）', 做: () => 发起时间推进('晨跑') });
        }
        if (时间撤销可用.value) {
          动作.push({ kicker: 'UNDO', icon: 'rewind', 文案: '撤销刚才的时间推进', 做: 发起时间撤销 });
        }
        动作.push({
          kicker: 'RETURN',
          icon: 'arrow',
          文案: '回到公寓外',
          做: async () => {
            await 进入('公寓外部');
          },
        });
      }
      return 动作;
    }

    if (id === '健身房') {
      if (当前房间.value !== id) {
        动作.push({
          kicker: 'GYM',
          icon: 'favor',
          文案: '进入健身房',
          做: async () => {
            await 进入(id);
          },
        });
      } else {
        const 今日 = 玩家当前日(data.value);
        if (时段.value !== '深夜' && data.value.玩家资源._体力训练日 !== 今日) {
          动作.push({ kicker: 'TRAIN', icon: 'favor', 文案: '开始锻炼（推进一时段）', 做: () => 发起时间推进('健身') });
        }
        if (时间撤销可用.value) {
          动作.push({ kicker: 'UNDO', icon: 'rewind', 文案: '撤销刚才的时间推进', 做: 发起时间撤销 });
        }
        动作.push({
          kicker: 'RETURN',
          icon: 'arrow',
          文案: '回到公寓外',
          做: async () => {
            await 进入('公寓外部');
          },
        });
      }
      return 动作;
    }

    if (房?.类型 === '户' && id !== '302') {
      if (!data.value.户[id]) return []; // 招租中,没有可做的事
      if (房内有人在(id)) {
        动作.push({
          kicker: 'VISIT',
          icon: 'door',
          文案: '过去串门',
          做: async () => {
            await 进入(id);
          },
        });
        // 丈夫关系道具：好酒走专属对饮调查；香烟与球赛票经营不同幅度的信任轴。
        // 当面动作只在玩家真正站在这户里时出现(2026-08-03 用户拍板:地图远程操作影响体验还产生 BUG)。
        if (当前房间.value === id && 丈夫在楼(data.value.户[id], id as 门牌, 绝对时段.value) === '在家') {
          if ((data.value?.背包 ?? []).includes('好酒')) {
            动作.push({
              kicker: 'DRINK',
              icon: 'gift',
              文案: `请${户静态表[id as 门牌].夫名}喝一杯`,
              做: async () => {
                if (!(await 确认已到达动作地点(id))) return;
                事件.对饮(id);
              },
            });
          }
          for (const 礼物 of ['香烟', '球赛票'] as const) {
            if (!(data.value?.背包 ?? []).includes(礼物)) continue;
            动作.push({
              kicker: 'GIFT',
              icon: 'gift',
              文案: 礼物 === '香烟' ? `递${户静态表[id as 门牌].夫名}一包烟` : `送${户静态表[id as 门牌].夫名}两张球赛票`,
              做: async () => {
                if (!(await 确认已到达动作地点(id))) return;
                事件.丈夫礼物({ 门牌: id, 道具id: 礼物 });
              },
            });
          }
        }
        // 催租三选(P3,天生欠租户):人到她家、她在家且账上挂着欠租才摆得上台面
        if (当前房间.value === id && (data.value.户[id]?._欠租笔数 ?? 0) > 0 && 妻现位(id as 门牌) === id) {
          const 催 = async (选择: '硬催' | '宽限' | '垫上') => {
            if (!(await 确认已到达动作地点(id))) return;
            事件.催租({ 门牌: id, 选择 });
          };
          动作.push({ kicker: 'RENT', icon: 'coin', 文案: '硬催房租', 类: 'risky', 做: () => 催('硬催') });
          动作.push({ kicker: 'RENT', icon: 'coin', 文案: '批张宽限条', 做: () => 催('宽限') });
          动作.push({ kicker: 'RENT', icon: 'coin', 文案: '悄悄垫上', 做: () => 催('垫上') });
        }
      } else {
        动作.push({
          kicker: 'KNOCK',
          icon: 'bell',
          文案: '敲敲门',
          做: async () => {
            await 进入(id);
          },
        });
        动作.push({
          kicker: 'BREAK IN',
          icon: 'lock',
          文案: 破门目标.value === id && 破门数.value > 0 ? `撬门中…再点 ${6 - 破门数.value} 下` : '撬门(连点)',
          类: 'risky',
          做: () => 敲撬门(id),
        });
        // 空房偷窃(P3):撬进空屋才有翻现金一说;冷却与察觉全在脚本
        if (当前房间.value === id && 已破门进入.value) {
          动作.push({
            kicker: 'SEARCH',
            icon: 'coin',
            文案: '翻找明面上的现金',
            类: 'risky',
            做: () => 事件.空房偷窃(id),
          });
        }
      }
      if (当前房间.value === id) 添加地点线路动作(动作, id);
      return 动作;
    }

    if (id === '302') {
      动作.push({
        kicker: 'HOME',
        icon: 'home',
        文案: '回家看看',
        做: async () => {
          await 进入(id);
        },
      });
      if (当前房间.value === id) {
        添加地点线路动作(动作, id);
        if (时段.value !== '深夜') {
          动作.push({
            kicker: 'NAP',
            icon: 'moon',
            文案: '小憩（推进一时段）',
            做: () => 发起时间推进('小憩'),
          });
        }
        动作.push({
          kicker: 'REST',
          icon: 'moon',
          文案: '睡到次日早晨',
          做: () => 发起时间推进('睡到次日早晨'),
        });
        if (时间撤销可用.value) {
          动作.push({
            kicker: 'UNDO',
            icon: 'rewind',
            文案: '撤销刚才的时间推进',
            做: 发起时间撤销,
          });
        }
      }
      return 动作;
    }

    // 管理员室世界时间：只保留有明确休息含义的小憩／睡眠，普通聊天不再改变日期或时段。
    // 两个事件都带预期水位，后端以乐观校验拒绝双击产生的第二次陈旧推进。
    if (id === '管理员室') {
      动作.push({
        kicker: 'GO',
        icon: 'arrow',
        文案: '走过去',
        做: async () => {
          await 进入(id);
        },
      });
      添加地点线路动作(动作, id);
      if (当前房间.value === id) {
        if (时段.value !== '深夜') {
          动作.push({
            kicker: 'NAP',
            icon: 'moon',
            文案: '小憩（推进一时段）',
            做: () => 发起时间推进('小憩'),
          });
        }
        动作.push({
          kicker: 'REST',
          icon: 'moon',
          文案: '睡到次日早晨',
          做: () => 发起时间推进('睡到次日早晨'),
        });
        if (时间撤销可用.value) {
          动作.push({
            kicker: 'UNDO',
            icon: 'rewind',
            文案: '撤销刚才的时间推进',
            做: 发起时间撤销,
          });
        }
      }
      return 动作;
    }

    // 公共区
    动作.push({
      kicker: 'GO',
      icon: 'arrow',
      文案: '走过去',
      做: async () => {
        await 进入(id);
      },
    });
    添加地点线路动作(动作, id);
    // 出门打听(P5:201渠道;人先到大堂,再提着伴手礼盒出门找街坊)
    if (id === '大堂' && 当前房间.value === id && (data.value?.背包 ?? []).includes('伴手礼盒')) {
      for (const m of 门牌列表) {
        if (!data.value.户[m] || 户静态表[m].隐身) continue;
        动作.push({
          kicker: 'ASK',
          icon: 'chat',
          文案: `打听${户静态表[m].妻名}家`,
          做: async () => {
            if (!(await 确认已到达动作地点(id))) return;
            事件.打听(m);
          },
        });
      }
    }
    // 荣耀洞(P5+:洗手间末隔间;人走进去才见瓷砖,冷却中不出现——极简,不摆灰按钮)
    if (id === '洗手间' && 当前房间.value === id && 荣耀洞可用.value) {
      动作.push({
        kicker: 'HOLE',
        icon: 'peep',
        文案: '使用荣耀洞',
        类: 'risky',
        做: () => 事件.荣耀洞(),
      });
    }
    // 公共区零钱(P3:路过的小惊喜;人到现场才捡得着;种子+期号与脚本同一真值,拾没拾过看 chat 计数)
    if (当前房间.value === id) {
      const 零钱 = 查金币(id, 绝对时段.value);
      if (零钱 > 0) {
        动作.push({
          kicker: 'PICK',
          icon: 'coin',
          文案: `捡起零钱(¥${零钱})`,
          做: async () => {
            if (!(await 确认已到达动作地点(id))) return;
            事件.捡金币(id);
          },
        });
      }
    }
    // 翻垃圾不再上地图房卡(2026-08-03 用户拍板:远程一键翻袋排下的强制事件让玩家找不到
    // "要处理的事情"，时间和楼务全锁死)。人到垃圾房后由房内 garbage-pick 直显按钮承载。
    return 动作;
  }

  /** 每个地点只承载一个楼务任务；两个确定性选项直接铺成瓷砖，不再生调查/回访子状态。 */
  function 添加管理任务动作(动作: 卡动作[], 地点: string): void {
    // 地图房卡和房内舞台共用 `房间动作`。楼务只能在玩家真正到达现场后出现，
    // 地图上仅保留“楼务/逾期”角标作为导航提示，不能远程点瓷砖自动进房开工。
    if (当前房间.value !== 地点) return;
    const 任务 = 列出地点管理任务(data.value, 地点)[0];
    if (!任务) return;
    const 剩余时段 = Math.max(0, 任务.截止时段 - 绝对时段.value);
    const 状态文案 = 任务.逾期已扣 ? '逾期补办' : `剩${剩余时段}时段`;
    for (const 选项 of 管理任务选项(任务).slice(0, 2)) {
      动作.push({
        kicker: 任务.逾期已扣 ? 'OVERDUE' : 'DUTY',
        icon: 任务.类型 === '投诉' ? 'ops' : 'tool',
        文案: `${任务.模板} · ${状态文案}｜${选项.文案}`,
        类: 任务.逾期已扣 ? 'risky management-task' : 'management-task',
        做: async () => {
          if (发送中.value) return;
          // 防止开着旧房卡时位置被其他异步动作改变，入口脚本还会再校验一次真实场景。
          if (当前房间.value !== 地点) return;
          if (发送中.value) return;
          事件.处理管理任务({ 任务id: 任务.id, 选项id: 选项.id, 地点 });
        },
      });
    }
  }

  function 添加地点线路动作(动作: 卡动作[], 地点: string): void {
    const 户门牌 = 门牌列表.includes(地点 as 门牌) ? (地点 as 门牌) : undefined;
    const 候选们 = 列出阶段线路候选详情(data.value, {
      类型: '地点',
      门牌: 户门牌,
      地点,
      时段: 时段.value,
      楼层: 绝对时段.value,
    });
    for (const 候选 of 候选们) {
      动作.push({
        kicker: 'STORY',
        icon: 'search',
        文案:
          当前房间.value === 地点
            ? `展开${户静态表[候选.门牌].妻名}的关系剧情`
            : `前往${户静态表[候选.门牌].妻名}的线索地点`,
        做: async () => {
          if (当前房间.value === 地点) 启动阶段线路剧情(地点, 候选);
          else await 进入(地点);
        },
      });
    }
  }

  /**
   * 房内动作(2026-07-17 垃圾房"不能翻"修复):输入门控收紧后,人站在房里满屏无可点——
   * 把非移动类的房间动作(翻垃圾/撬门)晒进场景视图,不开地图也摸得到下级菜单。
   */
  const 当前房间动作 = computed<卡动作[]>(() =>
    房间动作(当前房间.value).filter(a => !['GO', 'VISIT', 'KNOCK', 'HOME'].includes(a.kicker)),
  );
  /** 垃圾袋由一个紧凑选择器承载，避免住户增多后 SEARCH 瓷砖占满正文下半屏。 */
  const 普通房间动作 = computed(() => 当前房间动作.value.filter(a => a.kicker !== 'SEARCH'));

  // 破门连点计时器随 composable 作用域销毁(App unmount 时自动清理，App 不再持有它)
  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (破门计时) clearTimeout(破门计时);
    });
  }

  return { 房间动作, 当前房间动作, 普通房间动作, 确认已到达动作地点 };
}
