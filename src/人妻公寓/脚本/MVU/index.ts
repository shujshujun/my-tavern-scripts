import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';

import { 读取MVU解析状态 } from '../../MVU解析模式';

/**
 * getButtonEvent 会把当前脚本 id 编进事件名。游戏逻辑与 MVU 是两支独立脚本，
 * 因而只能先发稳定的跨脚本事件，再由 MVU 在自己的上下文里触发官方按钮。
 */
$(() => {
  eventOn('人妻公寓:MVU外置模型重试', async () => {
    // 内置变量解析开着时由引擎自己请求解析模型，桥绝不再按官方按钮，
    // 避免同一楼被解析两次。手动兜底请直接点 MVU 面板的「重试额外模型解析」。
    const 状态 = 读取MVU解析状态();
    if (状态.外置模式 && 状态.内置解析) {
      console.info('[人妻公寓·MVU桥] 内置变量解析已接管，跳过官方外置按钮');
      return;
    }
    await eventEmit(getButtonEvent('重试额外模型解析'));
  });
});
