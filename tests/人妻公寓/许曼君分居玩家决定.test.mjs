/* eslint-disable import-x/no-nodejs-modules -- Node-only parser regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const main = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const bridge = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居输入桥.ts');

test('第一幕区分当面在场、夫妻先谈、暂缓与未决定', () => {
  assert.equal(main.解析许曼君初谈参与方式('我会在场，亲口承担自己的位置。'), '当面在场');
  assert.equal(main.解析许曼君初谈参与方式('你们夫妻先谈，需要我时再叫我进去。'), '先夫妻谈');
  assert.equal(main.解析许曼君初谈参与方式('现在还不能开始，让我再想想。'), '暂缓');
  assert.equal(main.解析许曼君初谈参与方式('我听见了。'), '未决定');
});

test('第四幕只改变玩家关系，不把退出或暂不承诺误写成继续', () => {
  assert.equal(main.解析许曼君最终关系选择('我会继续留在你选择的生活里。'), '继续关系');
  assert.equal(main.解析许曼君最终关系选择('我不会要求你回去，但我退出我们这段关系。'), '退出关系');
  assert.equal(main.解析许曼君最终关系选择('你的婚姻由你决定，我们之间以后再谈。'), '暂不承诺');
  assert.equal(main.解析许曼君最终关系选择('这是你自己的决定。'), '未决定');
});

test('旧输入桥分类仍可读，但没有第二套阶段写入', () => {
  assert.equal(bridge.解析许曼君分居玩家决定('下次他回来，我不会躲，我会站在这里。'), '承担');
  assert.equal(bridge.解析许曼君分居玩家决定('我们还是继续瞒着他吧，别让我出现。'), '拒绝');
  assert.equal(bridge.解析许曼君分居玩家决定('让我再想想，过几天再谈。'), '暂缓');
  assert.equal(bridge.解析许曼君分居玩家决定('我只是管理员，这是你们夫妻的事。'), '中立');
  assert.equal(bridge.解析许曼君分居玩家决定('我听见了。'), '不明确');
});

test('否定、条件句和无关词不能误判成承诺', () => {
  assert.equal(main.解析许曼君初谈参与方式('我不是说我会在场，我只是问你准备怎么办。'), '未决定');
  assert.equal(main.解析许曼君最终关系选择('如果以后想清楚，也许我会继续。'), '未决定');
  assert.equal(main.解析许曼君最终关系选择('我不会要求你回到旧生活。'), '未决定');
});
