/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 根 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
const 读 = 路径 => readFileSync(new URL(路径, 根), 'utf8');

const 通知桥源码 = 读('./手机/通知桥.ts');
const 孕情AI通知源码 = 读('./手机/孕情AI通知.ts');
const 生产源码 = 读('./生产系统.ts');
const 素材源码 = 读('./手机/内容素材表.ts');
const 节拍源码 = 读('./手机/节拍引擎.ts');
const 邀约源码 = 读('./手机/交互/邀约与发消息.ts');
const 引用源码 = 读('./微信消息引用.ts');

test('孕产与家庭计划只在通知桥保留硬生命周期，角色表达交给结构化 AI 通知', () => {
  for (const 名 of ['编译预产微信通知', '编译产后微信通知', '编译住院微信通知', '编译家庭计划微信通知']) {
    assert.doesNotMatch(通知桥源码, new RegExp(`function\\s+${名}`));
  }
  assert.match(孕情AI通知源码, /同步孕产与家庭计划AI微信/);
  assert.match(孕情AI通知源码, /构建孕产事件数据/);
  assert.match(孕情AI通知源码, /事件主题/);
  assert.match(孕情AI通知源码, /最近本人私聊/);
  assert.match(孕情AI通知源码, /生成失败不落消息键/);
  assert.match(孕情AI通知源码, /生产\.状态 === '住院中'/);
  assert.match(孕情AI通知源码, /补发入院与已经生产的当前通知/);
});

test('预产、生产、合照、住院与家庭计划不再把固定角色台词写进源码', () => {
  const 合并 = `${生产源码}\n${通知桥源码}`;
  for (const 固定台词 of [
    '我今天已经到医院了',
    '已经顺利生了，是个',
    '你一直在，我都记得',
    '你来过，却没有留下',
    '你一次都没有来',
    '我感觉好多了',
    '明天应该就能出院了',
    '我已经办完出院了',
    '今晚有空吗？',
  ]) {
    assert.equal(合并.includes(固定台词), false, `不得保留固定角色台词：${固定台词}`);
  }
});

test('朋友圈和攻略动态生成失败不落本地文案，也不推进发圈水位', () => {
  assert.doesNotMatch(素材源码, /朋友圈兜底文案/);
  assert.doesNotMatch(素材源码, /兜底\s*:/);
  assert.doesNotMatch(节拍源码, /取朋友圈兜底|取攻略兜底/);
  assert.match(节拍源码, /if \(!文\) continue;/);
  assert.match(节拍源码, /只有通过 AI 文案验收才推进角色的朋友圈节拍/);
});

test('邀约裁定与群聊指定角色只提供事实和画像，不再提供固定回复', () => {
  assert.doesNotMatch(邀约源码, /群聊角色兜底|必答兜底|跟聊兜底/);
  assert.doesNotMatch(引用源码, /必答兜底|跟聊兜底|我也正想接这句/);
  assert.match(邀约源码, /生成邀约裁定回复/);
  assert.match(邀约源码, /事件主题/);
  assert.match(邀约源码, /裁定结果/);
  assert.match(邀约源码, /最近本人私聊/);
});
