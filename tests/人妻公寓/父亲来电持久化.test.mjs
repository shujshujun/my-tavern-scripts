/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 当前MVU数据版本 } = require('../../src/人妻公寓/schema.ts');
const { 接听来电 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');

function 待接数据() {
  return Schema.parse({
    胜任度: 50,
    系统: {
      _数据版本: 当前MVU数据版本,
      _绝对时段: 27,
      _上次上交期: 3,
      _待接来电: {
        期: 3,
        分数段: '平淡',
        报表: '账目平平',
        通牒: false,
      },
    },
  });
}

test('接听时原子清空待接来电、只加一次分并建立持久通话', () => {
  const data = 待接数据();

  assert.deepEqual(接听来电(data, 'call-3'), { 成功: true, 标识: 'call-3' });
  assert.equal(data.胜任度, 51);
  assert.equal(data.系统._待接来电.期, -1);
  assert.equal(data.系统._父亲通话.标识, 'call-3');
  assert.equal(data.系统._父亲通话.状态, '通话中');
  assert.deepEqual(data.系统._父亲通话.待回复, {
    序号: 1,
    玩家说: '(通话接通,父亲先开口)',
  });

  assert.deepEqual(接听来电(data, 'call-duplicate'), { 成功: false, 标识: 'call-3' });
  assert.equal(data.胜任度, 51);
});

test('接听时把账期冻结的母亲圆场完整带入父亲通话', () => {
  const data = 待接数据();
  data.系统._待接来电.母亲圆场 = {
    触发: true,
    事件ID: 'rumor-cover',
    摘要: '夜间出入频繁',
    仅剧情: false,
  };

  接听来电(data, 'call-cover');

  assert.deepEqual(data.系统._父亲通话.母亲圆场, {
    触发: true,
    事件ID: 'rumor-cover',
    摘要: '夜间出入频繁',
    仅剧情: false,
  });
});

test('活动通话通过 Schema/JSON 往返后仍保留记录与待回复令牌', () => {
  const data = 待接数据();
  接听来电(data, 'call-restore');
  data.系统._父亲通话.主题 = '这期账本是否逐笔对得上';
  data.系统._父亲通话.记录.push({ 谁: '父', 文: '账本逐笔核过没有？' });
  data.系统._父亲通话.待回复 = { 序号: 2, 玩家说: '已经核过了。' };
  data.系统._父亲通话.下次回复序号 = 3;

  const restored = Schema.parse(JSON.parse(JSON.stringify(data)));

  assert.equal(restored.系统._父亲通话.标识, 'call-restore');
  assert.equal(restored.系统._父亲通话.主题, '这期账本是否逐笔对得上');
  assert.deepEqual(restored.系统._父亲通话.记录, [{ 谁: '父', 文: '账本逐笔核过没有？' }]);
  assert.deepEqual(restored.系统._父亲通话.待回复, { 序号: 2, 玩家说: '已经核过了。' });
  assert.equal(restored.系统._父亲通话.下次回复序号, 3);
});

test('回到接听前快照时，待接来电自然恢复且活动通话消失', () => {
  const 接听前快照 = 待接数据();
  const 接听后快照 = Schema.parse(JSON.parse(JSON.stringify(接听前快照)));
  接听来电(接听后快照, 'call-rollback');

  const rolledBack = Schema.parse(JSON.parse(JSON.stringify(接听前快照)));

  assert.equal(接听后快照.系统._待接来电.期, -1);
  assert.equal(接听后快照.系统._父亲通话.标识, 'call-rollback');
  assert.equal(rolledBack.系统._待接来电.期, 3);
  assert.equal(rolledBack.系统._父亲通话.标识, '');
  assert.equal(rolledBack.胜任度, 50);
});
