/* eslint-disable import-x/no-nodejs-modules -- Node-only review counterexamples. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node', resolveJsonModule: true, esModuleInterop: true });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 读取录像带V4镜头卡 } = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');
const { 录像带V4正文越拍原因 } = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');

for (const [room, husband, recorded] of [['102', '顾国栋', '沈静仪'], ['202', '何俊生', '周小满']]) {
  const early = 读取录像带V4镜头卡(room, 14);
  const due = 读取录像带V4镜头卡(room, 16);
  assert.ok(early && due);
  for (const delimiter of ['，', '。', '；']) {
    for (const reverse of [false, true]) {
      const live = `现场${husband}此刻到达顶点`;
      const past = `平板里仍是${recorded}的过去录像`;
      const text = (reverse ? [past, live] : [live, past]).join(delimiter) + '。';
      test(`PLAY018 ${room} 同句双层 ${delimiter} ${reverse ? '历史在前' : '现场在前'}`, () => {
        assert.match(录像带V4正文越拍原因(early, text), /第16幕之前提前完成/u, text);
        assert.equal(录像带V4正文越拍原因(due, text), '', text);
      });
    }
  }
  for (const text of [
    `平板过去录像里，${recorded}到达顶点，现场${husband}还没有完成。`,
    `平板中${recorded}的过去录像继续，她到达顶点，现场${husband}还没有完成。`,
    `平板里${recorded}到达顶点。现场${husband}仍在等待。`,
  ]) {
    test(`PLAY018 ${room} 历史及其省略主语不冒充当前：${text}`, () => {
      assert.equal(录像带V4正文越拍原因(early, text), '', text);
      assert.match(录像带V4正文越拍原因(due, text), /第16幕没有/u, text);
    });
  }
  test(`PLAY018 ${room} 历史层男性代词不自动变成现场丈夫`, () => {
    const text = `平板里仍是${recorded}的过去录像，他到达顶点。现场${husband}还没有完成。`;
    assert.equal(录像带V4正文越拍原因(early, text), '', text);
    assert.match(录像带V4正文越拍原因(due, text), /第16幕没有/u, text);
  });
  test(`PLAY018 ${room} 明确现场代词可以切回当前房间`, () => {
    const text = `现场${husband}正在等待，平板里仍是${recorded}的过去录像，而现场他此刻到达顶点。`;
    assert.match(录像带V4正文越拍原因(early, text), /第16幕之前提前完成/u, text);
    assert.equal(录像带V4正文越拍原因(due, text), '', text);
  });
  test(`PLAY018 ${room} 无标点的明确现场转场不被历史整块删除`, () => {
    const text = `平板里仍是${recorded}的过去录像而现场${husband}此刻到达顶点。`;
    assert.match(录像带V4正文越拍原因(early, text), /第16幕之前提前完成/u);
    assert.equal(录像带V4正文越拍原因(due, text), '');
  });
}
