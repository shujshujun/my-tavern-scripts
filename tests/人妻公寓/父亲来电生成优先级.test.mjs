/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[cm]?[jt]s$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const require = createRequire(import.meta.url);
const { 父亲通话占用自动节拍 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机/父亲通话优先级.ts'
);
const 节拍源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url),
  'utf8',
);

function 手机父亲状态(待接期 = -1, 活动 = {}) {
  return {
    系统: {
      _待接来电: { 期: 待接期 },
      _父亲通话: { 标识: '', 期: -1, 状态: '', ...活动 },
    },
  };
}

test('待接来电与活动通话都优先于自动朋友圈/私聊AI，空闲时才放行自动节拍', () => {
  assert.equal(父亲通话占用自动节拍(手机父亲状态(2)), true);
  assert.equal(父亲通话占用自动节拍(手机父亲状态(-1, { 标识: 'call-1', 期: 2, 状态: '通话中' })), true);
  assert.equal(父亲通话占用自动节拍(手机父亲状态(-1, { 标识: 'call-1', 期: 2, 状态: '收尾中' })), true);
  assert.equal(父亲通话占用自动节拍(手机父亲状态()), false);
  assert.equal(父亲通话占用自动节拍(手机父亲状态(-1, { 标识: '陈旧残值', 期: -1, 状态: '' })), false);
});

test('手机节拍先落确定性楼务通知，再在任何自动AI入口前给父亲通话让路', () => {
  const 节拍 = 节拍源码.slice(节拍源码.indexOf('export async function 手机节拍'), 节拍源码.indexOf('// ── 姐妹群一拍'));
  const 确定性同步 = 节拍.indexOf('await 同步管理任务微信(data)');
  const 父亲门 = 节拍.indexOf('父亲通话占用自动节拍(data)');
  const 首个自动AI = 节拍.indexOf('await 冷落预警节拍()');
  assert.ok(确定性同步 >= 0 && 父亲门 > 确定性同步 && 首个自动AI > 父亲门);
});
