/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const {
  创建CG信号交接,
  接收CG信号,
  取出待处理CG信号,
  清理越界CG信号,
} = require('../../src/人妻公寓/界面/客户端/composables/useAdultCGHandoff.ts');
const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

function 信号(楼层) {
  return { 楼层, 门牌: '101', 正文: '', 行动: '', 事件: '', 行为等级: 3, variant: 'normal' };
}

test('事件CG遮挡期间暂存最新成人CG信号，最后一张事件图关闭后只恢复一次', () => {
  const 交接 = 创建CG信号交接();
  const 首楼 = 信号(10);
  const 次楼 = 信号(11);

  assert.equal(接收CG信号(交接, 首楼, '可恢复遮挡'), '暂存');
  assert.equal(接收CG信号(交接, 次楼, '可恢复遮挡'), '暂存', '遮挡期间以最新场景状态为准');
  assert.equal(取出待处理CG信号(交接, true, 11), null, '借种序列还有下一张时不能提前恢复');
  assert.equal(取出待处理CG信号(交接, false, 11), 次楼);
  assert.equal(取出待处理CG信号(交接, false, 11), null, '已经恢复的信号不得重复消费');
});

test('医院、荣耀洞与回档属于硬隔离，不能复活被遮挡或已删除楼层的成人CG', () => {
  const 交接 = 创建CG信号交接();
  接收CG信号(交接, 信号(20), '可恢复遮挡');
  assert.equal(接收CG信号(交接, 信号(21), '硬隔离'), '丢弃');
  assert.equal(取出待处理CG信号(交接, false, 21), null, '硬隔离同时作废旧待处理信号');

  接收CG信号(交接, 信号(30), '可恢复遮挡');
  清理越界CG信号(交接, 29);
  assert.equal(取出待处理CG信号(交接, false, 29), null, '回档删除来源楼后不得恢复');
});

test('客户端把接收、事件序列关闭、回档和聊天切换完整接到同一交接状态', () => {
  const 监听段 = App源.slice(
    App源.indexOf("eventOn('人妻公寓:CG回合信号'"),
    App源.indexOf("eventOn('人妻公寓:家庭计划CG'"),
  );
  assert.match(监听段, /接收CG信号\(成人CG信号交接, 信号, 阻塞\)/);
  assert.match(监听段, /交接结果 !== '立即处理'/);

  const 关闭段 = App源.slice(App源.indexOf('function 关闭当前事件CG'), App源.indexOf('function 当前事件CG加载失败'));
  assert.match(关闭段, /尝试恢复待处理成人CG\(\)/, '最后一张与多帧队列每次关闭都尝试交接');
  assert.match(App源, /清理越界CG信号\(成人CG信号交接, getLastMessageId\(\)\)/, '回档清理待处理来源楼');
  assert.match(App源, /function 客户端聊天切换[\s\S]*?清空CG信号交接\(成人CG信号交接\)/, '切聊天清空瞬态');
});
