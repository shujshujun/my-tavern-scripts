import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue';
import type { SchemaType } from '../../../schema';
import { 通关评级列表, type 通关成绩, type 通关评级 } from '../../../通关纪念存档';
import { 构造通关成绩, 通关结算可展示, 待庆祝通关成绩 } from '../../../脚本/游戏逻辑/通关结算';
import type { 通关纪念请求, 通关纪念响应 } from '../../../脚本/游戏逻辑/通关纪念服务';

interface 选项 {
  data: Readonly<Ref<SchemaType>>;
  就绪: Readonly<Ref<boolean>>;
  展示忙碌: () => boolean;
  写入忙碌: () => boolean;
  聊天ID: () => string;
  场景: () => string | null;
}

/** 身份由脚本握手签发；两份webpack入口的模块内世代绝不能互相比较。 */
export function useSettlement(选项: 选项) {
  const 打开 = ref(false);
  const 保存中 = ref(false);
  const 错误 = ref('');
  const 庆祝 = ref<通关成绩 | null>(null);
  const 当前 = computed(() => (选项.就绪.value ? 构造通关成绩(选项.data.value) : null));
  const 首次 = computed(() => (选项.就绪.value ? 选项.data.value.系统._通关纪念.首次成绩 : null));
  const 待记录CG = new Set<string>();
  let 聊天 = 选项.聊天ID();
  let 权威身份 = '';
  let 上次权威身份 = '';
  let 序号 = 0;
  let 在途: { id: string; 查询: boolean; 确认?: 通关评级; 截止: number } | null = null;
  let 待确认: 通关评级 | undefined;
  let 本次已关闭: 通关评级 | undefined;
  let 下次重试 = 0;
  let 定时器: ReturnType<typeof setInterval> | undefined;
  const 分支事件 = [tavern_events.CHAT_CHANGED, tavern_events.MESSAGE_SWIPED];

  function 重置(): void {
    聊天 = 选项.聊天ID();
    权威身份 = '';
    上次权威身份 = '';
    打开.value = false;
    保存中.value = false;
    错误.value = '';
    庆祝.value = null;
    在途 = null;
    待确认 = undefined;
    本次已关闭 = undefined;
    下次重试 = 0;
    待记录CG.clear();
  }

  function 校准身份(): void {
    // 内部临时删楼也会发MESSAGE_DELETED，先重问权威端，确认真分支变化才丢弃待存记录。
    权威身份 = '';
    在途 = null;
    打开.value = false;
    庆祝.value = null;
  }

  function 记录CG(id: string): void {
    if (聊天 !== 选项.聊天ID()) 重置();
    if (id && 选项.就绪.value && !选项.data.value.系统._通关纪念.CG记录.includes(id)) 待记录CG.add(id);
  }

  function 应展示(成绩: 通关成绩 | null | undefined): 成绩 is 通关成绩 {
    return Boolean(成绩 && (!本次已关闭 || 通关评级列表.indexOf(成绩.评级) > 通关评级列表.indexOf(本次已关闭)));
  }

  function 请求(确认评级?: 通关评级): void {
    if (在途 || 选项.写入忙碌() || !选项.就绪.value || Date.now() < 下次重试) return;
    const id = 'settlement-' + Date.now().toString(36) + '-' + ++序号;
    const 查询 = !权威身份;
    在途 = { id, 查询, 确认: 查询 ? undefined : 确认评级, 截止: Date.now() + 10000 };
    const 消息: 通关纪念请求 = {
      id,
      时间线: 权威身份,
      聊天ID: 聊天,
      查询身份: 查询,
      CG: 查询 ? [] : [...待记录CG].slice(0, 256),
      允许展示: !查询 && !打开.value && !选项.展示忙碌(),
      确认评级: 查询 ? undefined : 确认评级,
    };
    void Promise.resolve(eventEmit('人妻公寓:通关纪念请求', 消息)).catch(() => {
      if (在途?.id !== id) return;
      在途 = null;
      下次重试 = Date.now() + 5000;
      错误.value = '纪念记录等待保存，你可以继续游玩。';
    });
  }

  function 接收(结果: 通关纪念响应): void {
    if (!结果 || 聊天 !== 选项.聊天ID() || 结果.id !== 在途?.id) return;
    const 请求记录 = 在途;
    if (结果.状态 === '身份' && 请求记录.查询) {
      if (结果.聊天ID !== 聊天) return;
      if (上次权威身份 && 上次权威身份 !== 结果.时间线) {
        待记录CG.clear();
        待确认 = undefined;
        本次已关闭 = undefined;
      }
      权威身份 = 结果.时间线;
      上次权威身份 = 结果.时间线;
      在途 = null;
      return;
    }
    if (结果.时间线 !== 权威身份) return;
    if (结果.状态 === '失效') {
      重置();
      return;
    }
    在途 = null;
    if (结果.状态 !== '完成') {
      下次重试 = Date.now() + (结果.状态 === '等待' ? 1000 : 5000);
      if (请求记录.确认) 错误.value = '纪念记录等待保存，你可以继续游玩。';
      return;
    }
    下次重试 = 0;
    for (const id of 结果.已记录CG ?? []) 待记录CG.delete(id);
    if (请求记录.确认) {
      if (待确认 === 请求记录.确认) 待确认 = undefined;
      错误.value = '';
      return;
    }
    if (应展示(结果.庆祝) && !打开.value && !选项.展示忙碌()) {
      庆祝.value = 结果.庆祝;
      打开.value = true;
      错误.value = '';
    }
  }

  function 检查(): void {
    if (聊天 !== 选项.聊天ID()) 重置();
    if (!选项.就绪.value) return;
    if (打开.value && 选项.展示忙碌()) {
      打开.value = false;
      庆祝.value = null;
    }
    if (在途 && Date.now() >= 在途.截止) {
      在途 = null;
      // 同一聊天可能经历脚本重挂载或时间线切换；下一次从权威端重新取身份。
      权威身份 = '';
      下次重试 = Date.now() + 1000;
      错误.value = '纪念记录等待保存，你可以继续游玩。';
    }
    if (在途 || 打开.value || 选项.写入忙碌()) return;
    if (!权威身份 || 待确认) {
      请求(待确认);
      return;
    }
    const data = 选项.data.value;
    const 全员完成 = 当前.value?.角色.every(项 => 项.完成) === true;
    const 需登记起点 = 全员完成 && data.系统._通关纪念.全员完成时段 < 0;
    const 可庆祝 =
      !选项.展示忙碌() &&
      通关结算可展示(data, 选项.场景()) &&
      (!data.系统._通关纪念.首次成绩 || 应展示(待庆祝通关成绩(data)));
    if (待记录CG.size || 需登记起点 || 可庆祝) 请求();
  }

  function 查看(): void {
    if (!选项.就绪.value || 选项.展示忙碌() || 选项.写入忙碌()) return;
    const 候选 = 通关结算可展示(选项.data.value, 选项.场景()) ? 待庆祝通关成绩(选项.data.value) : null;
    庆祝.value = 应展示(候选) ? 候选 : null;
    打开.value = true;
  }

  function 关闭(): void {
    if (庆祝.value) {
      待确认 = 庆祝.value.评级;
      本次已关闭 = 庆祝.value.评级;
    }
    // 呈现层即时关闭，确认只在后台重试；持续写入失败也不会锁住游戏。
    打开.value = false;
    庆祝.value = null;
    if (待确认) 请求(待确认);
  }

  onMounted(() => {
    eventOn('人妻公寓:通关纪念响应', 接收);
    for (const 事件 of 分支事件) eventOn(事件, 重置);
    eventOn(tavern_events.MESSAGE_DELETED, 校准身份);
    定时器 = setInterval(检查, 1000);
    检查();
  });
  onUnmounted(() => {
    clearInterval(定时器);
    eventRemoveListener('人妻公寓:通关纪念响应', 接收);
    for (const 事件 of 分支事件) eventRemoveListener(事件, 重置);
    eventRemoveListener(tavern_events.MESSAGE_DELETED, 校准身份);
    重置();
  });
  return { 打开, 当前, 首次, 庆祝, 保存中, 错误, 查看, 关闭, 记录CG, 重置 };
}
