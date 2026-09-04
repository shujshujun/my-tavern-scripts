/* eslint-disable import-x/no-nodejs-modules -- Node-only schedule regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '201' } });
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 丈夫在楼 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const schemaSource = readFileSync(new URL('../../src/人妻公寓/schema.ts', import.meta.url), 'utf8');
const clockSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts', import.meta.url), 'utf8');

function fresh() {
  return Schema.parse({ 户: { 201: 创建户节点(0) } });
}

test('Schema持久保存四幕状态与统一丈夫居住镜像', () => {
  for (const field of [
    '_许曼君分居', '方案版本', '共同夜晚状态', '私下决定最早时段', '玩家最终关系选择',
    '_居住模式', '_预约回楼起', '_预约回楼至',
  ]) assert.match(schemaSource, new RegExp(field), `schema missing ${field}`);
});

test('统一丈夫在楼函数优先消费路线外住、预约回楼与待离婚交接', () => {
  assert.match(clockSource, /居住模式 === '预约回楼'/);
  assert.match(clockSource, /居住模式 === '路线外住' \|\| 居住模式 === '待离婚交接'/);
  const data = fresh();
  const husband = data.户['201'].夫;
  husband._居住模式 = '路线外住';
  assert.equal(丈夫在楼(data.户['201'], '201', 10), '外出');
  husband._居住模式 = '预约回楼';
  husband._预约回楼起 = 10;
  husband._预约回楼至 = 11;
  assert.equal(丈夫在楼(data.户['201'], '201', 10), '在家');
  assert.equal(丈夫在楼(data.户['201'], '201', 11), '外出');
  husband._居住模式 = '待离婚交接';
  assert.equal(丈夫在楼(data.户['201'], '201', 10), '外出');
});

test('丈夫作出外住决定后仍需管理员室硬动作；一次入柜才切换统一作息', () => {
  const data = fresh();
  Object.assign(data.系统._许曼君分居, {
    阶段: '待登记外住',
    丈夫已知玩家关系: true,
    丈夫已选择外住: true,
    工资卡状态: '已归还赵国强',
  });
  data.系统._绝对时段 = 4;
  assert.equal(data.户['201'].夫._居住模式, '普通作息');
  assert.equal(route.执行许曼君分居地点动作(data, '登记外住并封存钥匙', '管理员室').成功, true);
  assert.equal(data.户['201'].夫._居住模式, '路线外住');
  assert.equal(data.系统._许曼君分居.钥匙位置, '管理员室201钥匙格');
  assert.equal(data.系统._许曼君分居.封条修订, 1);
  assert.equal(丈夫在楼(data.户['201'], '201', data.系统._绝对时段), '外出');
});

test('唯一取物预约临时让丈夫到201，收束后恢复外住且钥匙从未交还', () => {
  const data = fresh();
  const state = data.系统._许曼君分居;
  Object.assign(state, {
    阶段: '待最终取物',
    钥匙位置: '管理员室201钥匙格',
    钥匙用途: '临时外住',
    封条修订: 1,
    封条完整: true,
    丈夫已知玩家关系: true,
    丈夫已选择外住: true,
    外住起点: 0,
    独住夜已完成: true,
    独住环境已确认: true,
    预约用途: '赵国强回201取物并提出修复',
    预约状态: '待到期',
  });
  data.户['201'].夫._居住模式 = '路线外住';
  let window = -1;
  for (let abs = 0; abs < 252; abs += 1) {
    state.预约时段 = abs;
    state.预约截止时段 = abs;
    data.系统._绝对时段 = abs;
    if (route.许曼君分居地点动作(data, '201').some(item => item.id === '开始第四幕取物提案')) {
      window = abs;
      break;
    }
  }
  assert.ok(window >= 0, '必须找到许曼君在201的唯一取物预约窗口');
  assert.equal(route.执行许曼君分居地点动作(data, '开始第四幕取物提案', '201').成功, true);
  assert.equal(data.户['201'].夫._居住模式, '预约回楼');
  assert.equal(丈夫在楼(data.户['201'], '201', window), '在家');
  assert.equal(state.钥匙位置, '管理员室201钥匙格');
  const p1 = route.提交许曼君分居剧情事件(data, '【许曼君分居提交:第四幕取物提案:1】', '201', 1, '我在听。');
  const p2 = route.提交许曼君分居剧情事件(data, p1.后续剧情.事件, '201', 2, '我在听。');
  route.提交许曼君分居剧情事件(data, p2.后续剧情.事件, '201', 3, '我在听。');
  assert.equal(data.户['201'].夫._居住模式, '路线外住');
  assert.equal(state.钥匙位置, '管理员室201钥匙格');
  assert.equal(state.封条修订, 1);
});
