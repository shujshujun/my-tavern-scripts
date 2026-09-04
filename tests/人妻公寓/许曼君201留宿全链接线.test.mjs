/* eslint-disable import-x/no-nodejs-modules -- Node runtime and wiring regression */
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
const { 读取201留宿可用状态 } = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const { 执行时间推进事务 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const { 是时间撤销地点 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间撤销系统.ts');

const files = {
  room: 'src/人妻公寓/界面/客户端/composables/useRoomActions.ts',
  index: 'src/人妻公寓/脚本/游戏逻辑/index.ts',
  time: 'src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts',
  lodging: 'src/人妻公寓/脚本/游戏逻辑/许曼君201留宿.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, 'utf8')]));

test('客户端、宿主门与原子时间事务共用同一睡眠地点授权', () => {
  assert.match(source.room, /读取201留宿可用状态\(data\.value, id, 绝对时段\.value\)/);
  assert.match(source.index, /读取201留宿可用状态\(data, 当前房间\)/);
  assert.match(source.time, /读取201留宿可用状态\(data, 请求\.当前地点, 起始时间\.绝对时段\)/);
  assert.match(source.lodging, /读取201留宿可用状态\(存档, 地点,/);
});

test('201显示专属文案但提交给时间系统的仍是唯一标准命令', () => {
  assert.match(source.room, /在201过夜（睡到次日早晨）/);
  assert.match(source.room, /发起时间推进\('睡到次日早晨'\)/);
  assert.match(source.index, /const 是201留宿 = 方式 === '睡到次日早晨' && 时间结束房间 === '201'/);
});

test('睡眠独立演出、成功醒来地点与撤销入口均已接线', () => {
  assert.match(source.index, /时间动作需要独立演出\(方式\)/);
  assert.match(source.index, /是201留宿\) 播放许曼君分居CG\(\{ CG: '201_留宿_夜'/);
  assert.match(source.index, /if \(是201留宿\) \{/);
  assert.match(source.index, /const 离婚次晨 = 许曼君离婚次晨CG\(候选\)/);
  assert.match(source.index, /if \(离婚次晨\) 播放许曼君离婚CG\(\{ CG: 离婚次晨 \}\)/);
  assert.match(source.index, /else 播放许曼君分居CG\(\{ CG: '201_留宿_晨' \}\)/);
  assert.match(source.index, /归一化睡醒地点/);
  assert.equal(是时间撤销地点('201'), true);
});

test('201睡眠真实推进时间；过期请求和住院失败不改路线、权限或资源', () => {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) } });
  Object.assign(data.系统._许曼君分居, {
    阶段: '已完成',
    留宿201权限: true,
    丈夫已知玩家关系: true,
    钥匙用途: '待离婚交接',
    钥匙位置: '管理员室201钥匙格',
  });
  data.户['201'].夫._居住模式 = '待离婚交接';
  let found = false;
  for (let t = 0; t < 42; t++) {
    data.系统._绝对时段 = t;
    if (读取201留宿可用状态(data, '201').可执行) {
      found = true;
      break;
    }
  }
  assert.equal(found, true);
  const request = { 方式: '睡到次日早晨', 当前地点: '201', 当前消息楼: 90, 预期绝对时段: data.系统._绝对时段 };
  const before = lodash.cloneDeep(data);
  assert.equal(执行时间推进事务(data, { ...request, 预期绝对时段: request.预期绝对时段 + 1 }).成功, false);
  assert.deepEqual(data, before);
  const hospital = lodash.cloneDeep(before);
  hospital.户['201'].妻._生产.状态 = '住院中';
  const hospitalBefore = lodash.cloneDeep(hospital);
  assert.equal(执行时间推进事务(hospital, request).成功, false);
  assert.deepEqual(hospital, hospitalBefore);
  const result = 执行时间推进事务(data, request);
  assert.equal(result.成功, true, result.提示);
  assert.ok(data.系统._绝对时段 > before.系统._绝对时段);
  assert.equal(data.系统._许曼君分居.留宿201权限, true);
  assert.equal(data.户['201'].夫._居住模式, '待离婚交接');
});

test('房间动作同时接入分居地图动作提供器与永久201留宿', () => {
  assert.match(source.room, /许曼君分居地点动作\(data\.value, 地点\)/);
  assert.match(source.room, /事件\.许曼君分居动作\(候选\.id\)/);
  assert.match(source.room, /if \(当前房间\.value !== 地点\) return/);
  assert.match(source.room, /if \(留宿\.已解锁\)/);
  assert.match(source.room, /禁用: !留宿\.可执行/);
});
