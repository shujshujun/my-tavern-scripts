/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
// P6:晒装/探针/群议/节拍收尾已迁至 ./节拍引擎,相关断言改读新所有者。
const 节拍引擎源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');

function 截源(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源.slice(起, 止);
}

test('写库增量在同一变量回调内验证并提交余波消费', () => {
  const 增量写 = 截源(数据层源码, 'async function 写库增量(', 'function 赴约仍活动');
  assert.match(增量写, /余波消费\?:\s*手机余波消费/);
  assert.match(增量写, /余波身份相同/);
  assert.match(增量写, /_换装余波/);
  assert.ok(增量写.indexOf('余波身份相同') < 增量写.indexOf("_.set(vars, '_微信', 新鲜)"));
});

test('朋友圈晒装只登记待提交圈晒，不提前写余波', () => {
  const 晒装 = 截源(节拍引擎源码, '// ── 朋友圈近期流', '// ── 主动消息 v1');
  assert.match(晒装, /登记待提交余波\(波!,\s*\{\s*圈晒:\s*true\s*\}\)/);
  assert.doesNotMatch(晒装, /标余波\(\{\s*圈晒:\s*true\s*\}\)/);
});

test('姐妹群议只登记待提交群议，最终写库携带余波消费', () => {
  const 群议 = 截源(节拍引擎源码, '// ── 姐妹群主动拍', '// 只有内容成功入库');
  assert.match(群议, /登记待提交余波\(波3!,\s*\{\s*群议:\s*true\s*\}\)/);
  assert.doesNotMatch(群议, /标余波\(\{\s*群议:\s*true\s*\}\)/);
  const 收尾 = 截源(节拍引擎源码, '// 只有内容成功入库', '// 手机节拍水位');
  assert.match(收尾, /余波消费:\s*待提交余波/);
});

test('楼务群探针与消息在同一增量事务消费，并核对完整余波身份', () => {
  const 群聊 = 截源(节拍引擎源码, '// ── 群聊 v1', '// ── 仅你可见');
  assert.match(群聊, /登记待提交余波\(波2!,\s*\{\s*探针:\s*true\s*\}\)/);
  assert.doesNotMatch(群聊, /标余波\(\{\s*探针:\s*true\s*\}\)/);

  const 增量写 = 截源(数据层源码, 'async function 写库增量(', 'function 赴约仍活动');
  assert.match(增量写, /余波身份相同\(当前余波,\s*增\.余波消费\.预期\)/);
  assert.ok(增量写.indexOf('余波身份相同') < 增量写.indexOf('新鲜.消息.push'));
});
