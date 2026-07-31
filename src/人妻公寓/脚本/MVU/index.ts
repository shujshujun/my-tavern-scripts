import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';

/**
 * getButtonEvent 会把当前脚本 id 编进事件名。游戏逻辑与 MVU 是两支独立脚本，
 * 因而只能先发稳定的跨脚本事件，再由 MVU 在自己的上下文里触发官方按钮。
 */
$(() => {
  eventOn('人妻公寓:MVU外置模型重试', async () => {
    await eventEmit(getButtonEvent('重试额外模型解析'));
  });
});
