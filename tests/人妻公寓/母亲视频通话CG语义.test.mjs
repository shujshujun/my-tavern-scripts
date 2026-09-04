/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  母亲视频通话全部CG,
  母亲视频通话接通入场CG,
  母亲视频通话主循环CG,
  母亲视频通话结束衔接CG,
  母亲视频通话终幕CG,
  母亲视频通话最终候选张数,
  母亲视频通话运行时CG总数,
  母亲视频通话主循环起点ID,
  母亲视频通话主循环末帧ID,
  推进母亲视频通话普通CG,
  选择母亲视频通话结束衔接CG,
  构造母亲视频通话正文注入,
} = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts');

test('最终运行序列使用53张用户候选与1张复用样板，共54张', () => {
  assert.equal(母亲视频通话最终候选张数, 53);
  assert.equal(母亲视频通话运行时CG总数, 54);
  assert.equal(母亲视频通话全部CG.length, 54);
  assert.equal(母亲视频通话接通入场CG.length, 5);
  assert.equal(母亲视频通话主循环CG.length, 39);
  assert.equal(母亲视频通话结束衔接CG.length, 3);
  assert.equal(母亲视频通话终幕CG.length, 7);
});

test('54张CG都有唯一运行ID、唯一序号和完整运行语义，构建期物理来源不进入运行对象', () => {
  assert.equal(new Set(母亲视频通话全部CG.map(CG => CG.id)).size, 54);
  assert.equal(new Set(母亲视频通话全部CG.map(CG => CG.序号)).size, 54);
  assert.deepEqual(
    母亲视频通话全部CG.map(CG => CG.序号),
    Array.from({ length: 54 }, (_, index) => index + 1),
  );
  for (const CG of 母亲视频通话全部CG) {
    assert.ok(CG.视觉事实.length >= 20, `${CG.id}缺少详细视觉事实`);
    assert.ok(CG.正文承接.length >= 20, `${CG.id}缺少正文承接说明`);
    assert.equal(Object.hasOwn(CG, '源文件'), false, `${CG.id}不得把本地物理源路径带进运行时对象`);
  }
});

test('用户指定的001-1位于第一张之后，接通入场只播放一次', () => {
  assert.equal(母亲视频通话接通入场CG[0].id, 'MVC-CG-001-draw1');
  assert.equal(母亲视频通话接通入场CG[1].id, 'MVC-CG-012-draw1@001-1');
  assert.equal(推进母亲视频通话普通CG('MVC-CG-001-draw1').id, 'MVC-CG-012-draw1@001-1');
  assert.equal(推进母亲视频通话普通CG('MVC-CG-004-draw1').id, 'MVC-CG-005-reused');
});

test('主循环耗尽后回到含入起点005，绝不回到刚接通的001', () => {
  assert.equal(母亲视频通话主循环起点ID, 'MVC-CG-005-reused');
  assert.equal(母亲视频通话主循环末帧ID, 'MVC-CG-024-draw4');
  assert.equal(推进母亲视频通话普通CG(母亲视频通话主循环末帧ID).id, 母亲视频通话主循环起点ID);
  assert.notEqual(推进母亲视频通话普通CG(母亲视频通话主循环末帧ID).id, 'MVC-CG-001-draw1');
});

test('结束请求按当前连接状态选择浅含、深喉或离口衔接', () => {
  assert.equal(选择母亲视频通话结束衔接CG('浅含').id, 'MVC-CG-025-draw1');
  assert.equal(选择母亲视频通话结束衔接CG('中段含入').id, 'MVC-CG-025-draw1');
  assert.equal(选择母亲视频通话结束衔接CG('深喉').id, 'MVC-CG-025-draw2');
  assert.equal(选择母亲视频通话结束衔接CG('舌尖接触').id, 'MVC-CG-026-draw1');
  assert.equal(选择母亲视频通话结束衔接CG('离口舔舐').id, 'MVC-CG-026-draw1');
});

test('正文专用注入同时携带CG语义、真实微信记录与说话人边界', () => {
  const 当前CG = 母亲视频通话全部CG.find(CG => CG.id === 'MVC-CG-021-draw2');
  assert.ok(当前CG);
  const 注入 = 构造母亲视频通话正文注入({
    当前CG,
    微信记录: [
      { 谁: '我', 文: '楼里的事我会接好。' },
      { 谁: '父', 文: '那就别让我再操心。' },
    ],
    更早通话摘要: '父亲已经确认账本与住户名单。',
    上轮现场正文: '母亲仍跪在玩家面前，维持浅含。',
  });

  assert.match(注入, /MVC-CG-021-draw2/);
  assert.match(注入, /玩家：楼里的事我会接好/);
  assert.match(注入, /父亲：那就别让我再操心/);
  assert.match(注入, /父亲实际只看见玩家肩颈以上/);
  assert.match(注入, /母亲只有两只手|额外手|第三只手/);
  assert.match(注入, /不得复述、改写或新增父亲与玩家的微信台词/);
  assert.match(注入, /不得自行进入下一张CG/);
});
