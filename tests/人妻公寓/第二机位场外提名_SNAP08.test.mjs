/* eslint-disable import-x/no-nodejs-modules -- 真实分拍解析与正文验收边界。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const { 第二机位正文越拍原因, 解析第二机位剧情事件 } = require('../../src/人妻公寓/脚本/游戏逻辑/第二机位系统.ts');

const cases = [
  ['仅谈及工作', false, '沈静仪说起顾国栋最近的工作，话题仍停在屋内。'],
  ['否定在场', false, '沈静仪说顾国栋不在这里，她把水杯放在桌边。'],
  ['真实进场', true, '顾国栋推门走进来。'],
  ['普通对话', false, '沈静仪把水杯放在桌边，继续屋内的谈话。'],
  ['历史到场', false, '沈静仪回忆昨天顾国栋推门走进来的样子。'],
  ['否定进场', false, '顾国栋没有推门走进来。'],
  ['期待到场', false, '顾国栋明天才会推门进来。'],
  ['条件进场', false, '如果顾国栋推门进来，她会先放下水杯。'],
  ['是否到场', false, '顾国栋推门进来了吗？'],
  ['先否定后真的进场', true, '顾国栋并没有走进来，但现在顾国栋推门进入102。'],
  ['旧事后当前进场', true, '昨天顾国栋曾经走进来；此刻顾国栋又推门进入102。'],
  ['门外确有脚步', [true, false], '门外响起脚步，钥匙在锁孔里转动。'],
  ['门外没有脚步', false, '门外没有脚步声，钥匙也没有转动。'],
  ['设想引文', false, '“顾国栋推门进来。”只是她的设想，门外始终安静。'],
];
for (const beat of [1, 2]) {
  const event = `【第二机位提交:D:${beat}】`;
  test(`SNAP08 第${beat}拍仅拒绝真实进场或当前门外动作`, () => {
    assert.equal(解析第二机位剧情事件(event)?.拍, beat);
    const failures = [];
    for (const [name, expectation, body] of cases) {
      const blocked = Array.isArray(expectation) ? expectation[beat - 1] : expectation;
      const actual = Boolean(第二机位正文越拍原因(event, body));
      if (actual !== blocked) failures.push({ name, body, blocked, actual });
    }
    assert.deepEqual(failures, []);
  });
}
