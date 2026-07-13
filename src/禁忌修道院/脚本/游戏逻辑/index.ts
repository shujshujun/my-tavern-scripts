import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

import { Schema, 修女职位列表 } from '../../schema';
import { 阶段标题列表 } from '../../stageConfig';
import {
  会议间隔,
  取待注入数据卡,
  取首夜指令,
  离开会议厅,
  开始投票,
  清首夜标记,
} from './meetingSystem';
import {
  取主动事件指令,
  取晋阶指令,
  刷新互动楼层,
  警戒回落,
  请求晋阶,
  达成里程碑,
  冷落检测,
  清主动事件,
  结算晋阶,
} from './eventSystem';
import { 读取, 脚本写入, 脚本写入中 } from './mvuIO';
import { 检测焦点, 组修道院快照 } from './snapshotSystem';
import type { 票值快照 } from './voteEngine';

/**
 * 禁忌修道院(重置版) - 游戏逻辑脚本
 *
 * 事件流(沿用云霜凝范式):
 *   CHAT_COMPLETION_PROMPT_READY → 注入会议数据卡/新规首夜指令(TODO:双通道快照/焦点切片)
 *   VARIABLE_UPDATE_ENDED        → 安检机第二道:±3 差值裁剪 + 脚本管字段回写
 *   MESSAGE_RECEIVED             → 会议倒计时推进 → 归零触发会议+票值快照
 *   禁忌修道院:开始投票/离开会议厅 → 客户端会议场景的 UI 事件(meetingSystem 结算)
 *
 * 安检机分工:
 *   第一道(schema.ts):类型强转/catch 默认/clamp 绝对范围 —— registerMvuSchema 挂载
 *   第二道(本文件):相对变化量(单轮 ±3)/脚本管字段(AI 改动回写)
 */

// ── 安检机第一道:挂载 zod schema ──
registerMvuSchema(Schema);

// ============================================
// 全屏化:注入酒馆主页面样式(伪单楼——聊天区只显示最新楼,历史在客户端卷轴里;
// 隐藏酒馆原生输入框,输入走游戏内)。右下角 ✠ 按钮可随时切回原生界面(逃生舱)。
// ============================================

function 注入全屏样式() {
  try {
    if ($('#xdy-fullscreen-style').length === 0) {
      $('head').append(
        '<style id="xdy-fullscreen-style">' +
          '#chat .mes:not(:last-child){display:none !important;}' +
          '#send_form{display:none !important;}' +
          '</style>',
      );
    }
    if ($('#xdy-ui-toggle').length === 0) {
      $('body').append(
        '<div id="xdy-ui-toggle" title="切换酒馆原生界面(逃生舱)" ' +
          'style="position:fixed;right:10px;bottom:10px;z-index:9999;width:34px;height:34px;' +
          'border-radius:50%;background:#1a1208;color:#c9a227;border:1px solid #c9a227;' +
          'display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;user-select:none;">✠</div>',
      );
      $('#xdy-ui-toggle').on('click', () => {
        const 样式 = $('#xdy-fullscreen-style');
        if (样式.attr('media') === 'not all') 样式.removeAttr('media');
        else 样式.attr('media', 'not all');
      });
    }
  } catch (e) {
    console.error('[禁忌修道院] 注入全屏样式失败:', e);
  }
}
注入全屏样式();

const 三轴 = ['支持度', '堕落度', '信仰值'] as const;
const 单轮封顶 = 3;

// ============================================
// 安检机第二道:VARIABLE_UPDATE_ENDED
// ============================================

eventClearEvent(Mvu.events.VARIABLE_UPDATE_ENDED);
eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (新变量: object, 旧变量: object) => {
  if (脚本写入中) return;
  try {
    const newData = Schema.parse(_.get(新变量, 'stat_data') ?? {});
    const oldData = Schema.parse(_.get(旧变量, 'stat_data') ?? {});
    let changed = false;

    for (const 职位 of 修女职位列表) {
      const n = newData.修女[职位];
      const o = oldData.修女[职位];

      // 三轴单轮 ±3 差值裁剪(大额涨幅只走脚本里程碑事件)
      for (const 轴 of 三轴) {
        const delta = n[轴] - o[轴];
        if (Math.abs(delta) > 单轮封顶) {
          n[轴] = _.clamp(o[轴] + Math.sign(delta) * 单轮封顶, 0, 100);
          changed = true;
        }
      }

      // 脚本管字段:AI 改动一律回写(晋阶走晋阶按钮/事件,不由 AI 直改)
      if (n.当前阶段 !== o.当前阶段) {
        n.当前阶段 = o.当前阶段;
        changed = true;
      }
      if (n.情报可见 !== o.情报可见) {
        n.情报可见 = o.情报可见;
        changed = true;
      }
      if (n.上次互动楼层 !== o.上次互动楼层) {
        n.上次互动楼层 = o.上次互动楼层;
        changed = true;
      }

      // 阶段标题 = 派生字段,永远由脚本按当前阶段重算
      const 标题 = 阶段标题列表[n.当前阶段 - 1];
      if (n.阶段标题 !== 标题) {
        n.阶段标题 = 标题;
        changed = true;
      }
    }

    // 全局机制字段全部脚本管(恶魔低语除外,那是 AI 每轮即兴的)
    for (const key of ['奉献金', '激进度', '警戒度'] as const) {
      if (newData[key] !== oldData[key]) {
        newData[key] = oldData[key];
        changed = true;
      }
    }
    for (const key of ['会议', '院规', '视察'] as const) {
      if (!_.isEqual(newData[key], oldData[key])) {
        newData[key] = oldData[key] as never;
        changed = true;
      }
    }

    if (changed) {
      _.set(新变量 as object, 'stat_data', newData);
      脚本写入(新变量 as object);
      console.info('[禁忌修道院] 安检机第二道:已裁剪/回写越权更新');
    }
  } catch (e) {
    console.error('[禁忌修道院] VARIABLE_UPDATE_ENDED 处理失败:', e);
  }
});

// ============================================
// prompt 注入:会议数据卡 / 新规首夜
// ============================================

let 首夜已注入 = false;
let 晋阶已注入 = false;
let 主动已注入 = false;
let 本轮焦点: ReturnType<typeof 检测焦点>['焦点'] = [];

eventClearEvent(tavern_events.CHAT_COMPLETION_PROMPT_READY);
eventOn(tavern_events.CHAT_COMPLETION_PROMPT_READY, (event_data: { chat: { role: string; content: string }[] }) => {
  try {
    // 双通道快照:院规现状 + 焦点全量(记账+感知+边界) + 背景一行 + 院内空气 + 演出规则
    const { data } = 读取();
    本轮焦点 = 检测焦点(event_data.chat, data).焦点;
    event_data.chat.push({ role: 'system', content: 组修道院快照(event_data.chat, data) });

    // 事件指令优先级:会议数据卡 > 晋阶正戏 > 新规首夜 > 修女主动事件(互斥,一楼一事)
    const 数据卡 = 取待注入数据卡();
    if (数据卡) {
      event_data.chat.push({ role: 'system', content: 数据卡 });
      return;
    }
    const 晋阶 = 取晋阶指令();
    if (晋阶) {
      event_data.chat.push({ role: 'system', content: 晋阶 });
      晋阶已注入 = true;
      return;
    }
    const 首夜 = 取首夜指令();
    if (首夜) {
      event_data.chat.push({ role: 'system', content: 首夜 });
      首夜已注入 = true;
      return;
    }
    const 主动 = 取主动事件指令();
    if (主动) {
      event_data.chat.push({ role: 'system', content: 主动 });
      主动已注入 = true;
    }
  } catch (e) {
    console.error('[禁忌修道院] prompt 注入失败:', e);
  }
});

// ============================================
// 会议倒计时:AI 楼推进,归零触发会议+票值快照
// ============================================

eventClearEvent(tavern_events.MESSAGE_RECEIVED);
eventOn(tavern_events.MESSAGE_RECEIVED, () => {
  try {
    // ── 事件结算(与注入标记一一对应;swipe 不重演为骨架取舍) ──
    if (首夜已注入) {
      首夜已注入 = false;
      清首夜标记();
    }
    if (晋阶已注入) {
      晋阶已注入 = false;
      结算晋阶(); // 阶段+1 + 堕落度+10(大额涨幅)
    }
    if (主动已注入) {
      主动已注入 = false;
      清主动事件();
    }

    // 焦点修女互动楼层刷新(冷落计时器的数据源)
    刷新互动楼层(本轮焦点);

    const { raw, data } = 读取();
    if (data.会议.状态 !== '日常') return;

    // 警戒度自然回落(涨的语义检测〔待定〕,事件侧走 调警戒 接口)
    警戒回落(data);

    if (data.会议.倒计时 > 0) {
      data.会议.倒计时 -= 1;
    }
    if (data.会议.倒计时 <= 0) {
      data.会议.状态 = '会议中';

      // 票值快照:会议触发楼立即定格全员支持度/堕落度,投票按快照算,
      // 会议楼内的数值变动不影响本次结果(存 chat 变量,AI 不需要看见 → 不进 stat_data)
      const 快照 = Object.fromEntries(
        修女职位列表.map(职位 => [
          职位,
          { 支持度: data.修女[职位].支持度, 堕落度: data.修女[职位].堕落度 },
        ]),
      ) as 票值快照;
      insertOrAssignVariables(
        { _会议: { 票值快照: 快照, 触发楼层: getLastMessageId() } },
        { type: 'chat' },
      );
      console.info('[禁忌修道院] 会议触发,票值快照已定格');
    }

    脚本写入(raw, data);

    // 冷落检测:排队"她主动来找你"(一次一人,读写在上面写入之后)
    冷落检测();
  } catch (e) {
    console.error('[禁忌修道院] MESSAGE_RECEIVED 处理失败:', e);
  }
});

// ============================================
// 客户端会议场景 UI 事件
// ============================================

eventClearEvent('禁忌修道院:开始投票');
eventOn('禁忌修道院:开始投票', (payload: { 规则id: string }) => {
  void 开始投票(payload.规则id);
});

eventClearEvent('禁忌修道院:离开会议厅');
eventOn('禁忌修道院:离开会议厅', () => {
  离开会议厅();
});

eventClearEvent('禁忌修道院:晋阶');
eventOn('禁忌修道院:晋阶', (payload: { 职位: Parameters<typeof 请求晋阶>[0] }) => {
  请求晋阶(payload.职位);
});

// 专线里程碑(先给事件入口,自动判定/按钮后续接;也可控制台手动触发调试)
eventClearEvent('禁忌修道院:里程碑');
eventOn('禁忌修道院:里程碑', (payload: { 职位: Parameters<typeof 达成里程碑>[0]; id: string }) => {
  达成里程碑(payload.职位, payload.id);
});

// 序章完成:按选定难度重掷首次会议倒计时(委任状界面 eventEmit)
eventClearEvent('禁忌修道院:序章完成');
eventOn('禁忌修道院:序章完成', () => {
  try {
    const 间隔 = 会议间隔();
    const { raw, data } = 读取();
    data.会议.倒计时 = _.random(间隔[0], 间隔[1]);
    脚本写入(raw, data);
    console.info('[禁忌修道院] 序章完成,首次会议倒计时', data.会议.倒计时);
  } catch (e) {
    console.error('[禁忌修道院] 序章完成处理失败:', e);
  }
});

// ============================================
// TODO(后续按 spec 顺序补全)
// ============================================
// - 警戒度上涨的语义检测〔待定方案〕(回落与接口已通)
// - 讲道 AOE 触发形态〔待拍板〕、视察触发与巡查登场流程
// - 专线里程碑的自动判定/UI 入口(事件接口已通,可控制台调试)
// - 序章全屏界面(难度预设+私癖自填槽)、院规面板投票预测、忏悔录图鉴、商店
