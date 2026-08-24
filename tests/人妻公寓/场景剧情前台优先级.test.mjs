/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 场景剧情占用前台生成 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 节拍源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
const 冷落源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/冷落预警.ts', import.meta.url), 'utf8');

function 数据(覆盖 = {}) {
  return {
    系统: {
      _特殊场景: { id: '' },
      _荣耀洞拍: -1,
      _场景剧情事务: { id: '' },
      _待发送事件: '',
      ...覆盖,
    },
  };
}

function 场景票(id, 场景, 标题 = '强制剧情') {
  return `【场景剧情:v1:${encodeURIComponent(id)}:${encodeURIComponent(场景)}:${encodeURIComponent(标题)}】剧情内容`;
}

test('强制剧情前台所有权：活动票、同场等待、专用特殊场景与荣耀洞均优先于可选后台 AI', () => {
  assert.equal(场景剧情占用前台生成(数据({ _场景剧情事务: { id: 'active' } }), '101'), true);
  assert.equal(场景剧情占用前台生成(数据({ _待发送事件: 场景票('wait', '101') }), '101'), true);
  assert.equal(场景剧情占用前台生成(数据({ _待发送事件: 场景票('wait', '101') }), '202'), false);
  assert.equal(场景剧情占用前台生成(数据({ _特殊场景: { id: '静音会议' } }), '管理员室'), true);
  assert.equal(场景剧情占用前台生成(数据({ _荣耀洞拍: 0 }), '洗手间'), true);
});

test('回合后台只保留硬骨架，触发数据库 AI 前必须按最新场景状态给强剧情让路', () => {
  const 起 = 回合源码.indexOf('function 安排数据库回合后处理');
  const 止 = 回合源码.indexOf('/** 静音会议的成功正文', 起);
  assert.ok(起 >= 0 && 止 > 起);
  const 后处理 = 回合源码.slice(起, 止);
  const 前台门 = 后处理.indexOf('场景剧情占用前台生成');
  const 数据库AI = 后处理.indexOf('await 广播生成完成事件');
  assert.ok(前台门 >= 0 && 数据库AI > 前台门, '数据库 AI 必须在强剧情前台门之后，不能抢先制造首轮失败');
  assert.ok(后处理.indexOf('记录数据库回合骨架') < 前台门, '确定性硬骨架可以先落库，不应因后台让路而丢失');
});

test('手机节拍、独立冷落预警与数据库后处理复用同一个前台所有权判定，避免优先级再次漂移', () => {
  const 起 = 节拍源码.indexOf('export async function 手机节拍');
  const 止 = 节拍源码.indexOf('type 孕产群后私聊类型', 起);
  assert.ok(起 >= 0 && 止 > 起);
  assert.match(节拍源码.slice(起, 止), /场景剧情占用前台生成\(data, 当前场景\)/);
  const 冷落起 = 冷落源码.indexOf('export async function 冷落预警节拍');
  assert.ok(冷落起 >= 0);
  assert.match(冷落源码.slice(冷落起), /场景剧情占用前台生成\(data, 当前场景\)/);
});
