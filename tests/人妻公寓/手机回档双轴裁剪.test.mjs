/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const { 手机记录在当前时间线, 规范手机已读时锚 } = await import('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');
const 回合源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

test('回到同一消息楼的较早时段会裁掉未来和无时段手机记录', () => {
  const 记录 = [
    { 楼: 10, 时: 2, 文: '过去' },
    { 楼: 10, 时: 5, 文: '同楼未来' },
    { 楼: 11, 时: 1, 文: '未来分支' },
  ];

  assert.deepEqual(
    记录.filter(条 => 手机记录在当前时间线(条, 10, 3)).map(条 => 条.文),
    ['过去'],
  );
});

test('同楼未来已读时锚在回档后从存活记录重建', () => {
  const 存活 = [
    { 楼: 10, 时: 1 },
    { 楼: 10, 时: 2 },
  ];

  assert.deepEqual(规范手机已读时锚(10, { 楼: 10, 时: 5 }, 存活, 3), { 楼: 10, 时: 2 });
});

test('回合引擎物理裁枝同时使用楼锚与绝对时段，并重建复合已读锚', () => {
  const 开始 = 回合源.indexOf('function 裁手机时间线');
  const 结束 = 回合源.indexOf('\ntype 上次回合记录', 开始);
  const 裁枝段 = 回合源.slice(开始, 结束);

  assert.match(裁枝段, /库\.消息 = [\s\S]*?手机记录在当前时间线\(x, 楼层, 目标钟\)/);
  assert.match(裁枝段, /库\.圈 = [\s\S]*?手机记录在当前时间线\(x, 楼层, 目标钟\)/);
  assert.match(裁枝段, /库\.读时 = [\s\S]*?规范手机已读时锚/);
  assert.match(裁枝段, /库\.圈读时 = 规范手机已读时锚/);
});
