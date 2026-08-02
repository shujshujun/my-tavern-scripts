/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
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

const { 阶段行为基调, 阶段接受上限 } = require('../../src/人妻公寓/stageConfig.ts');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 角色成人表现提示 } = require('../../src/人妻公寓/脚本/游戏逻辑/角色表现系统.ts');
const 快照源码 = readFileSync(
  fileURLToPath(new URL('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts', import.meta.url)),
  'utf8',
);

test('L4/L5 只扩大主动选择，不再把归属写成人格和边界消失', () => {
  assert.match(阶段行为基调[4], /主动.*自己|自己.*主动/);
  assert.match(阶段行为基调[5], /人格|判断|选择/);
  assert.doesNotMatch(阶段行为基调[5], /身心已是你的人|婚姻只剩壳/);
  assert.match(阶段接受上限[5], /边界|偏好|同意/);
  assert.doesNotMatch(阶段接受上限[5], /没有界线/);
});

test('五名角色世界书以表达规律取代可被照抄的固定台词', () => {
  for (const 名 of ['夏乔', '沈静仪', '许曼君', '周小满', '安若妍']) {
    const 路径 = fileURLToPath(new URL(`../../src/人妻公寓/世界书/角色/${名}.yaml`, import.meta.url));
    const 内容 = readFileSync(路径, 'utf8');
    assert.doesNotMatch(内容, /^\s+(?:语料|示例语料|日常语料):\s*$/m, `${名}仍包含固定语料字段`);
    assert.match(内容, /措辞纪律/, `${名}缺少非模板化措辞纪律`);
  }
});

test('亲密快照接入逐角色成人表现档案', () => {
  assert.match(快照源码, /角色成人表现提示/);
  assert.match(快照源码, /外部预设/);
});

test('L0-L2 读取人格档案时只获得角色化边界，不会被错写成 L3 许可', () => {
  const 提示 = 角色成人表现提示('102', 1, '沈静仪');
  assert.match(提示, /尚未进入成人关系可发生的阶段/);
  assert.match(提示, /绝不授权任何越阶行为/);
  assert.doesNotMatch(提示, /越界后|允许发生/);
});

test('五名角色的成人表现差分会实际进入亲密快照', () => {
  const 角色 = {
    101: ['夏乔', '热闹'],
    102: ['沈静仪', '秩序'],
    201: ['许曼君', '谈判'],
    202: ['周小满', '被看见'],
    301: ['安若妍', '镜头'],
  };

  for (const [门牌号, [姓名, 差分词]] of Object.entries(角色)) {
    const data = Schema.parse({ 户: { [门牌号]: 创建户节点(0) } });
    data.户[门牌号].妻.当前阶段 = 4;
    data.户[门牌号].妻.阶段标题 = '沉沦';
    data.系统._性爱场景 = {
      ...data.系统._性爱场景,
      状态: '进行中',
      场次标识: `test-${门牌号}`,
      开始楼层: 0,
      有效楼数: 1,
      当前接触部位: '其他',
      当前行为: '其他',
      保护状态: '未使用',
      参与者: {
        [门牌号]: { 满意度: 1, 满意目标: 4, 偏好命中: [], 等级加成已用: false },
      },
    };
    聊天变量 = {
      _场景: { 房间id: 门牌号, 进房末楼: 0 },
      _粘滞: { 位置: 门牌号, 楼: 0, 们: [门牌号] },
    };

    const 快照 = 组公寓快照([{ role: 'user', content: '继续眼前的亲密互动。' }], data, 0);
    assert.match(快照, new RegExp(`【角色成人表现·${姓名}】`));
    assert.match(快照, new RegExp(差分词));
    assert.match(快照, /外部预设只可调整叙述强度与文字风格/);
  }
});
