/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  验收邀约裁定回复,
  验收报孕硬事实,
  验收预产硬事实,
  验收生产硬事实,
  验收合照硬事实,
  验收住院硬事实,
  验收家庭计划硬事实,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/叙事硬事实.ts');

test('报孕、预产与生产必须带齐脚本裁定的硬事实', () => {
  assert.equal(验收报孕硬事实('检查确认怀孕了，这是第二胎。', 2), true);
  assert.equal(验收报孕硬事实('检查确认怀孕了。', 2), false);
  assert.equal(验收报孕硬事实('检查说没有怀孕，原本以为是第二胎。', 2), false);
  assert.equal(验收预产硬事实('我已经到医院待产了。'), true);
  assert.equal(验收预产硬事实('我还没去医院待产。'), false);
  assert.equal(验收预产硬事实('我没有去医院，但快要生产了。'), false);
  assert.equal(验收预产硬事实('我不去医院待产。'), false);
  assert.equal(验收预产硬事实('我还没到医院，已经快要生产了。'), false);
  assert.equal(验收预产硬事实('我今天有些累。'), false);
  assert.equal(验收生产硬事实('女儿已经出生了，我们都平安。', '女'), true);
  assert.equal(验收生产硬事实('儿子已经出生了，我们都平安。', '女'), false);
  assert.equal(验收生产硬事实('儿子已经出生了，不是女儿。', '女'), false);
  assert.equal(验收生产硬事实('不是儿子，是女儿，已经平安出生了。', '女'), true);
  assert.equal(验收生产硬事实('女儿还没出生。', '女'), false);
});

test('母婴合照既要像照片消息，也不能把缺席篡改成陪产', () => {
  assert.equal(验收合照硬事实('给你看看我和女儿刚拍的照片。', '完全缺席'), true);
  assert.equal(验收合照硬事实('给你看看照片，也谢谢你一直陪着。', '完全缺席'), false);
  assert.equal(验收合照硬事实('给你看看我和宝宝的合照。', '陪产'), true);
  assert.equal(验收合照硬事实('你一次都没来，给你看看宝宝。', '陪产'), false);
});

test('住院恢复、近况、出院预告和已出院不会互相冒充', () => {
  assert.equal(验收住院硬事实('身体还在慢慢恢复。', '恢复'), true);
  assert.equal(验收住院硬事实('女儿今天很安静。', '近况'), true);
  assert.equal(验收住院硬事实('医生说准备出院了。', '出院预告'), true);
  assert.equal(验收住院硬事实('医生说还不可以出院。', '出院预告'), false);
  assert.equal(验收住院硬事实('医生说暂时不能出院。', '出院预告'), false);
  assert.equal(验收住院硬事实('我暂时不出院，继续观察。', '出院预告'), false);
  assert.equal(验收住院硬事实('医生说还不能出院。', '出院'), false);
  assert.equal(验收住院硬事实('今天还没有出院。', '出院'), false);
  assert.equal(验收住院硬事实('今天已经出院到家了。', '出院'), true);
});

test('家庭计划邀请与邀约裁定必须保持地点、主题和接受结果一致', () => {
  assert.equal(验收家庭计划硬事实('他想请你来101见面，当面谈谈孩子的事。'), true);
  assert.equal(验收家庭计划硬事实('来101坐坐吧。'), false);
  assert.equal(验收家庭计划硬事实('他不想让你来101见面，也不谈孩子。'), false);
  assert.equal(验收邀约裁定回复('好，到时见。', '接受'), true);
  assert.equal(验收邀约裁定回复('抱歉，我去不了。', '接受'), false);
  assert.equal(验收邀约裁定回复('我不答应去见面。', '接受'), false);
  assert.equal(验收邀约裁定回复('我答应不去见面。', '接受'), false);
  assert.equal(验收邀约裁定回复('好，我不去了。', '接受'), false);
  assert.equal(验收邀约裁定回复('今天不方便，改天吧。', '拒绝'), true);
  assert.equal(验收邀约裁定回复('好，到时见。', '改口拒绝'), false);
  assert.equal(验收邀约裁定回复('家里有事，但我会去。', '改口拒绝'), false);
});
