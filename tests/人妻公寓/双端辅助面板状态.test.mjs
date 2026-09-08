/* eslint-disable import-x/no-nodejs-modules -- Node-only UI state regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 创建抽屉状态机 } = require('../../src/人妻公寓/界面/客户端/composables/抽屉状态机.ts');

for (const mobile of [false, true]) {
  test(`${mobile ? '手机' : '电脑'}统一抽屉：主动收起、重新展开、同房新增提示与抑制恢复`, () => {
    const pending = new Map(); let serial = 0;
    const 机器 = 创建抽屉状态机({ 计时: {
      设: fn => { const id = ++serial; pending.set(id, fn); return id; },
      清: id => pending.delete(id),
    } });
    const input = { mobile, collapsible: true, roomId: '202', actionCount: 4, suppressed: false };
    机器.更新(input);
    assert.equal(机器.状态.展开, true);
    机器.手动收起();
    assert.equal(机器.状态.展开, false);
    assert.equal(pending.size, 0);
    机器.更新({ ...input, actionCount: 5 });
    assert.equal(机器.状态.展开, false);
    assert.equal(机器.状态.新增提示, true);
    机器.手动展开();
    assert.equal(机器.状态.展开, true);
    assert.equal(机器.状态.新增提示, false);
    机器.更新({ ...input, suppressed: true });
    assert.equal(机器.状态.展开, false);
    assert.equal(pending.size, 0);
    机器.更新(input);
    assert.equal(机器.状态.展开, false);
    机器.手动展开();
    assert.equal(机器.状态.展开, true);
    机器.销毁();
    assert.equal(pending.size, 0);
  });
}
test('双端切换保留已收起展示；新房间的自动展示不携带旧房间提示', () => {
  const pending = new Map(); let serial = 0;
  const 机器 = 创建抽屉状态机({ 计时: { 设: fn => { pending.set(++serial, fn); return serial; }, 清: id => pending.delete(id) } });
  const input = { mobile: false, collapsible: true, roomId: '202', actionCount: 3, suppressed: false };
  机器.更新(input); 机器.手动收起();
  机器.更新({ ...input, mobile: true });
  assert.equal(机器.状态.展开, false);
  机器.更新({ ...input, roomId: '301' });
  assert.equal(机器.状态.展开, true);
  assert.equal(机器.状态.新增提示, false);
  机器.更新({ ...input, roomId: null, actionCount: 0 });
  assert.equal(机器.状态.展开, false);
  assert.equal(pending.size, 0);
});
