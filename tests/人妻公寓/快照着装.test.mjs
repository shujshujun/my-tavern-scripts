/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const 回合引擎源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

test('焦点妻的着装文本会把内衣与外装一起注入 AI 快照', () => {
  const data = Schema.parse({
    户: {
      101: 创建户节点(0),
    },
  });
  data.户['101'].妻.外装 = '居家针织裙';
  data.户['101'].妻.内衣 = '你送的黑色蕾丝内衣';
  data.户['101'].妻.妆容 = '素颜';
  聊天变量 = {
    _场景: { 房间id: '101', 进房末楼: 0 },
    _粘滞: { 位置: '101', 楼: 0, 们: ['101'] },
  };

  const snapshot = 组公寓快照([{ role: 'user', content: '在客厅和她打招呼。' }], data, 0);

  assert.match(snapshot, /【当前着装·唯一现场事实】着装:居家针织裙\|你送的黑色蕾丝内衣/);
});

test('动态着装明确覆盖世界书初始穿衣，正文不得把两套衣服叠穿', () => {
  const data = Schema.parse({
    户: {
      101: 创建户节点(0),
    },
  });
  data.户['101'].妻.外装 = '你送的露背红裙';
  data.户['101'].妻.内衣 = '黑色蕾丝内衣';
  data.户['101'].妻._穿戴锁 = ['外装'];
  聊天变量 = {
    _场景: { 房间id: '101', 进房末楼: 0 },
    _粘滞: { 位置: '101', 楼: 0, 们: ['101'] },
  };

  const snapshot = 组公寓快照([{ role: 'user', content: '看看她换好的衣服。' }], data, 0);

  assert.match(snapshot, /【当前着装·唯一现场事实】着装:你送的露背红裙\|黑色蕾丝内衣/);
  assert.match(snapshot, /覆盖世界书[^\n]*不得把初始服装与当前服装叠穿/);
  assert.match(snapshot, /锁定穿戴,不要换下/);
});

test('数据库历史记忆也必须服从当前着装，不能从旧回合带回旧衣服', () => {
  assert.match(
    回合引擎源码,
    /【当前场景硬裁决】[^'\n]*当前着装[^'\n]*历史服装只代表当时穿着[^'\n]*禁止与【当前着装·唯一现场事实】叠穿/,
  );
});

test('妻角色世界书只描述穿衣偏好，并把当前穿着裁决权交给现场事实', () => {
  for (const 角色 of ['夏乔', '沈静仪', '许曼君', '周小满', '安若妍']) {
    const 源码 = readFileSync(new URL(`../../src/人妻公寓/世界书/角色/${角色}.yaml`, import.meta.url), 'utf8');
    assert.match(源码, /^ {4}穿衣偏好:/m, `${角色}缺少静态穿衣偏好`);
    assert.doesNotMatch(源码, /^ {4}穿衣:/m, `${角色}仍把出厂穿衣伪装成当前事实`);
    assert.match(
      源码,
      /^ {4}着装纪律:.*当前场景明确给出的.*唯一现场事实.*不得叠穿/m,
      `${角色}缺少现场着装优先级`,
    );
    assert.doesNotMatch(源码, /动态快照|每轮快照|脚本.*注入/, `${角色}不应向模型暴露着装实现层`);
  }
});
