/* eslint-disable import-x/no-nodejs-modules -- Node-only asset regression */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const resource = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居资源.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');
const manifest = JSON.parse(readFileSync(new URL('../../src/人妻公寓/素材/特殊场景/许曼君分居CG.manifest.json', import.meta.url), 'utf8'));
const root = new URL('../../', import.meta.url);

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function dataWith(overrides = {}) {
  return {
    系统: {
      _许曼君分居: {
        方案版本: 2,
        阶段: '待最终取物',
        当前场景: '',
        当前拍: 0,
        钥匙位置: '管理员室201钥匙格',
        钥匙用途: '临时外住',
        封条修订: 1,
        封条完整: true,
        独住环境已确认: true,
        生活用品已取完: false,
        共同夜晚状态: '待接受',
        留宿201权限: false,
        玩家最终关系选择: '未决定',
        ...overrides,
      },
    },
  };
}

test('12张本地资源与manifest仍双向闭合，四幕重设计不因弃用步骤删除用户素材', () => {
  assert.equal(manifest.status, 'local-assets-ready-unpublished');
  assert.equal(manifest.items.length, 12);
  assert.deepEqual(new Set(manifest.items.map(item => item.semantic)), new Set(resource.许曼君分居全屏资源语义));
  for (const item of manifest.items) {
    const path = new URL(`../../${item.productPath}`, import.meta.url);
    assert.equal(existsSync(path), true, item.productPath);
    assert.equal(statSync(path).size, item.bytes, item.file);
    assert.equal(sha256(path), item.sha256, item.file);
    assert.equal(resource.许曼君分居资源相对路径(item.semantic), `特殊场景/许曼君/分居/${item.file}`);
  }
});

test('四幕事件语义复用现有画面，但通知与二次离楼图不再决定玩家步骤', () => {
  const cases = [
    ['第一幕初谈', 1, '分居_A1_工资卡入封套'],
    ['第二幕摊牌', 0, '分居_A3_201三人同桌'],
    ['第二幕摊牌', 1, '分居_A3_工资卡归还'],
    ['第三幕独住后', 0, '201_分居_独住'],
    ['共同夜晚开场', 0, '201_留宿_夜'],
    ['第四幕取物提案', 0, '分居_A5_取物与修复'],
    ['第四幕管理员室交接', 0, '分居_A6_钥匙柜前最终会面'],
  ];
  for (const [scene, beat, expected] of cases) {
    assert.equal(route.许曼君分居事件CG语义(dataWith({ 当前场景: scene, 当前拍: beat })), expected);
  }
  assert.equal(route.许曼君分居事件CG语义(dataWith({ 当前场景: '第四幕私下决定' })), null);
});

test('房间背景先显示独住，再在一次取完后切换；育儿生产背景仍拥有优先级', () => {
  assert.equal(route.许曼君分居房间背景语义(dataWith()), '201_分居_独住');
  assert.equal(route.许曼君分居房间背景语义(dataWith({ 生活用品已取完: true })), '201_分居_取物后');
  const visual = resource.读取许曼君分居视觉(dataWith({ 生活用品已取完: true }), {
    基础背景: 'base.webp',
    有生产育儿背景: true,
    hasAsset: () => true,
  });
  assert.equal(visual.语义, null);
  assert.equal(visual.路径, null);
  assert.equal(visual.回退路径, 'base.webp');
});

test('图片缺失只回退画面，不改路线硬状态；轻量层反映一次封存和玩家选择', () => {
  const data = dataWith({
    生活用品已取完: true,
    留宿201权限: true,
    玩家最终关系选择: '退出关系',
    钥匙用途: '待离婚交接',
  });
  const before = lodash.cloneDeep(data);
  const visual = resource.读取许曼君分居视觉(data, {
    基础背景: 'base.webp',
    资源根: 'https://assets.example/rq',
    hasAsset: () => false,
  });
  assert.equal(visual.使用回退, true);
  assert.equal(visual.路径, null);
  assert.match(visual.轻量状态层.join('|'), /一次封存/);
  assert.match(visual.轻量状态层.join('|'), /未来留宿许可已撤销/);
  assert.deepEqual(data, before);
});
