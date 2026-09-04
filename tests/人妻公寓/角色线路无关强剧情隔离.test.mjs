/* eslint-disable import-x/no-nodejs-modules -- Node-only route isolation regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
let currentRoom = '301';
let chatVars = {};
globalThis.getVariables = () => ({ ...chatVars, _场景: { 房间id: currentRoom } });
globalThis.insertOrAssignVariables = () => undefined;
globalThis.updateVariablesWith = async updater => updater(chatVars);
globalThis.getLastMessageId = () => 100;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 丈夫在楼, seededRandom } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const policy = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
const interruptions = require('../../src/人妻公寓/脚本/游戏逻辑/打断系统.ts');
const settlement = require('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts');

function fresh() {
  return Schema.parse({
    户: Object.fromEntries(门牌列表.map(门牌号 => [门牌号, 创建户节点(0)])),
  });
}

function routeSetups() {
  return [
    ['101', data => { data.系统._家庭计划.阶段 = '待投资料'; }],
    ['102', data => { data.系统._第二机位.阶段 = '待对饮'; }],
    ['201', data => { data.系统._许曼君分居.阶段 = '待三人摊牌'; }],
    ['202', data => { data.系统._不再留门.道具已使用 = true; }],
    ['301', data => { data.系统._安若妍不必停.阶段 = 'A2中'; }],
    ['302', data => { data.系统._回国.阶段 = '待父亲回信'; }],
  ];
}

test.beforeEach(() => {
  currentRoom = '301';
  chatVars = {};
});

test('六户都以真实线路进度为隔离凭据，单纯购买或待使用不提前冻结', () => {
  for (const [门牌号, setup] of routeSetups()) {
    const data = fresh();
    data.系统._家庭计划.阶段 = '待安装';
    data.系统._第二机位.阶段 = '待门缝';
    data.系统._许曼君分居.阶段 = '待初谈';
    data.系统._安若妍不必停.阶段 = '已购买';
    data.系统._回国.阶段 = '待使用经营归档册';
    assert.equal(policy.角色线路无关打断已停用(data, 门牌号), false, `${门牌号}仅购票`);
    assert.equal(policy.前台角色线路无关强剧情已冻结(data, [门牌号]), false, `${门牌号}仅购票前台`);

    setup(data);
    assert.equal(policy.角色线路无关打断已停用(data, 门牌号), true, `${门牌号}真实进入线路`);
    assert.equal(policy.前台角色线路无关强剧情已冻结(data, [门牌号]), true, `${门牌号}线路前台`);
    assert.equal(policy.前台角色线路无关强剧情已冻结(Schema.parse(data), [门牌号]), true, '刷新仍保持隔离');
  }
});

test('按户隔离不会扩散：301已进入线路时，普通202前台仍保留自己的世界事件', () => {
  const data = fresh();
  data.系统._安若妍不必停.阶段 = '亲密前半';
  assert.equal(policy.前台角色线路无关强剧情已冻结(data, ['301']), true);
  assert.equal(policy.前台角色线路无关强剧情已冻结(data, ['202']), false);
  assert.equal(policy.前台角色线路无关强剧情已冻结(data, ['not-a-room']), false);
});

test('目标角色进入线路后，母亲撞见概率和结算都归零且不消费撞见水位', () => {
  const data = fresh();
  data.系统._安若妍不必停.阶段 = '亲密前半';
  data.系统._绝对时段 = 10;
  data.户['301'].妻.当前阶段 = 5;
  const before = lodash.cloneDeep(data);
  const risk = interruptions.母亲撞见风险(data, '301', '301', 10);
  assert.equal(risk.概率, 0);
  interruptions.母亲撞见检测(data, '301', 10, 100, 10, '301');
  assert.deepEqual(data, before);
});

test('换装余波不会在承接／结局事实成立后重新制造丈夫起疑，普通阶段仍能触发', () => {
  const normal = fresh();
  normal.户['301'].妻.当前阶段 = 5;
  for (let t = 0; t < 252; t += 1) {
    if (丈夫在楼(normal.户['301'], '301', t) === '在家' && seededRandom(t, '301', '换装起疑') < 0.35) {
      normal.系统._绝对时段 = t;
      break;
    }
  }
  chatVars = {
    _换装余波: {
      事件ID: 'route-isolation-outfit',
      门牌: '301',
      起楼: 90,
      物: '新外装',
      私密: false,
      群议: false,
      探针: false,
      圈晒: false,
      疑记: false,
    },
  };
  assert.equal(typeof interruptions.换装起疑(normal, 100), 'function', '普通阶段保留换装起疑');
  assert.match(normal.系统._待发送事件, /丈夫起疑/);

  const protectedData = fresh();
  protectedData.系统._绝对时段 = normal.系统._绝对时段;
  protectedData.系统._安若妍不必停.阶段 = '亲密后半';
  const before = lodash.cloneDeep(protectedData);
  assert.equal(interruptions.换装起疑(protectedData, 100), null);
  assert.deepEqual(protectedData, before);
});

test('202进入承接后旧“哑巴亏”不开线；回档到承接前恢复原规则', () => {
  const data = fresh();
  data.户['202'].妻.当前阶段 = 5;
  data.户['202'].夫.疑心值 = 100;
  settlement.绿帽线检测(data, 100);
  assert.equal(data.户['202'].夫.结局轨道, '哑巴亏');
  assert.match(data.系统._待发送事件, /哑巴亏/);

  const protectedData = fresh();
  protectedData.户['202'].妻.当前阶段 = 5;
  protectedData.户['202'].夫.疑心值 = 100;
  protectedData.系统._不再留门.道具已使用 = true;
  const before = lodash.cloneDeep(protectedData);
  settlement.绿帽线检测(protectedData, 100);
  assert.deepEqual(protectedData, before);
});

test('自定义回合与原生兼容路径都用同一前台隔离门包住全部无关强剧情生产者', () => {
  const main = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
  const native = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const required = ['入住检测(', '换装起疑(', '打断检测(', '父亲来电打断(', '母亲撞见检测(', '绿帽线检测('];
  for (const [name, source] of [['自定义回合', main], ['原生兼容', native]]) {
    const start = source.indexOf('const 前台线路隔离 = 前台角色线路无关强剧情已冻结');
    assert.ok(start >= 0, `${name}缺少统一隔离门`);
    const block = source.slice(start, source.indexOf('\n  }', start) + 4);
    assert.match(block, /if \(!前台线路隔离\) \{/);
    for (const call of required) assert.ok(block.includes(call), `${name}隔离块缺少${call}`);
  }
});
