/* eslint-disable import-x/no-nodejs-modules -- Node-only ownership regression */
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
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const main = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const adapter = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居玩法.ts');
const backpack = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居背包.ts');
const cabinet = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居钥匙柜.ts');
const mainSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts', import.meta.url), 'utf8');
const adapterSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居玩法.ts', import.meta.url), 'utf8');

function fresh() {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) } });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.阶段性癖 = 户静态表['201'].招牌性癖;
  data.系统._已完成特殊场景.push('肉偿账本');
  return data;
}

test('许曼君分居系统是唯一权威写入者，旧玩法文件只做代理调用', () => {
  assert.match(mainSource, /export function 执行许曼君分居地点动作/);
  assert.match(mainSource, /export function 提交许曼君分居剧情事件/);
  assert.match(adapterSource, /兼容适配层/);
  assert.match(adapterSource, /执行许曼君分居地点动作/);
  assert.doesNotMatch(adapterSource, /\.系统\._许曼君分居\.[\p{Script=Han}\w]+\s*=/u);
  assert.doesNotMatch(adapterSource, /待A1|待A3|待A5|待A6|第二次封存/u);
});

test('只读投影把四幕字段映射给旧调试入口，不复活通知或封存袋', () => {
  const data = fresh();
  Object.assign(data.系统._许曼君分居, {
    阶段: '待最终取物',
    工资卡状态: '已归还赵国强',
    钥匙位置: '管理员室201钥匙格',
    钥匙用途: '临时外住',
    封条修订: 1,
    封条完整: true,
    丈夫已知玩家关系: true,
    共同夜晚状态: '待接受',
    预约用途: '赵国强回201取物并提出修复',
    预约状态: '待到期',
    预约时段: 30,
  });
  data.户['201'].夫._居住模式 = '路线外住';
  const state = main.读取许曼君分居状态({ stat_data: data });
  assert.equal(state.阶段, '待最终取物');
  assert.equal(state.会面通知位置, '未生成');
  assert.equal(state.封存袋位置, '管理员室已入柜');
  assert.equal(state.预约.类型, '取物');
  assert.equal(state.共同夜晚状态, '待接受');
  assert.deepEqual(backpack.读取许曼君分居背包物件(data), []);
});

test('钥匙柜只展示同一枚封存钥匙及其用途，不表达拆封再封', () => {
  const data = fresh();
  Object.assign(data.系统._许曼君分居, {
    阶段: '待钥匙转交接',
    钥匙位置: '管理员室201钥匙格',
    钥匙用途: '临时外住',
    封条修订: 1,
    封条完整: true,
  });
  let view = cabinet.读取许曼君201钥匙柜卡(data);
  assert.equal(view.可见, true);
  assert.match(view.封条, /唯一封条完整/);
  assert.match(view.说明, /不拆封交还/);
  data.系统._许曼君分居.钥匙用途 = '待离婚交接';
  view = cabinet.读取许曼君201钥匙柜卡(data);
  assert.match(view.最近用途, /待离婚交接/);
  assert.match(view.说明, /同一枚封存钥匙/);
});

test('兼容地图适配器只转发当前权威动作，旧信箱、大堂和公寓外部动作归零', () => {
  const data = fresh();
  main.购买许曼君分居(data);
  for (let abs = 0; abs < 252; abs += 1) {
    data.系统._绝对时段 = abs;
    if (main.许曼君分居地点动作(data, '201').length) break;
  }
  const context = adapter.构建许曼君分居地图上下文(data, { 地点: '201', 当前楼层: 20 });
  const actions = adapter.读取许曼君分居地图动作(data, context);
  assert.ok(actions.some(item => item.动作 === '开始第一幕初谈'));
  assert.deepEqual(adapter.读取许曼君分居地图动作(data, { ...context, 地点: '信箱区' }), []);
  assert.deepEqual(adapter.读取许曼君分居地图动作(data, { ...context, 地点: '大堂' }), []);
  assert.deepEqual(adapter.读取许曼君分居地图动作(data, { ...context, 地点: '公寓外部' }), []);
});
