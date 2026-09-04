/* eslint-disable import-x/no-nodejs-modules -- Node-only portrait catalog and resolver regression */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const resourceModule = '../../src/人妻公寓/界面/客户端/穿戴成品图.ts';
delete globalThis.__RQGY_WARDROBE_ASSET_BASE__;
const pendingResources = require('../../src/人妻公寓/界面/客户端/穿戴成品图.ts');
globalThis.__RQGY_WARDROBE_ASSET_BASE__ = 'http://wardrobe.test/approved';
delete require.cache[require.resolve(resourceModule)];
const resources = require('../../src/人妻公寓/界面/客户端/穿戴成品图.ts');
const { 衣柜普通重制图, 衣柜普通重制缩略图 } = require('../../src/人妻公寓/界面/客户端/服装立绘资源.ts');
const { 角色立绘候选, 孕态服装白名单, 孕态服装立绘图, 素材基址 } = require('../../src/人妻公寓/界面/客户端/assets.ts');
const catalog = JSON.parse(readFileSync(new URL('../../src/人妻公寓/衣柜服装重制清单.json', import.meta.url), 'utf8'));
const fixed = JSON.parse(readFileSync(new URL('../../src/人妻公寓/衣柜造型清单.json', import.meta.url), 'utf8'));
const product = new URL('../../src/人妻公寓/素材/衣柜/成品/', import.meta.url);
const hash = relative => createHash('sha256').update(readFileSync(new URL(relative, product))).digest('hex');

test('24张修正版按角色和衣物精确读取，主图与同源预览均有可校验的真实文件', () => {
  assert.equal(catalog.length, 24);
  assert.equal(new Set(catalog.map(r => `${r.角色}/${r.道具id}`)).size, 24);
  for (const row of catalog) {
    assert.equal(row.孕态, false);
    assert.equal(row.主服装, row.道具id);
    assert.equal(decodeURI(衣柜普通重制图(row.角色, row.道具id)), `http://wardrobe.test/approved/${row.图片}`);
    assert.equal(decodeURI(衣柜普通重制缩略图(row.角色, row.道具id)), `http://wardrobe.test/approved/${row.预览}`);
    assert.equal(角色立绘候选(row.角色, row.道具id, false)[0], 衣柜普通重制图(row.角色, row.道具id));
    assert.equal(hash(row.图片), row.图片SHA256);
    assert.equal(hash(row.预览), row.预览SHA256);
  }
});

test('普通修正版不越过既有62张孕态图，也不扩充不存在的孕态资源', () => {
  assert.equal(Object.values(孕态服装白名单).flat().length, 62);
  for (const [role, items] of Object.entries(孕态服装白名单)) {
    for (const id of items) assert.equal(角色立绘候选(role, id, true)[0], 孕态服装立绘图(role, id));
  }
  for (const row of catalog) {
    if (孕态服装立绘图(row.角色, row.道具id)) continue;
    assert.equal(角色立绘候选(row.角色, row.道具id, true)[0], 衣柜普通重制图(row.角色, row.道具id));
  }
});

test('没有修正记录的角色衣物保留原资源，不借用其他角色或相似名称', () => {
  assert.equal(衣柜普通重制图('不存在的角色', '女仆装'), '');
  assert.equal(衣柜普通重制图('母亲', '女仆装_任意组合'), '');
  assert.equal(衣柜普通重制图('母亲', ''), '');
  assert.equal(衣柜普通重制图('夏乔', '牛仔背带裙'), '');
  assert.equal(角色立绘候选('夏乔', '牛仔背带裙', false)[0], `${素材基址}/立绘/夏乔_牛仔背带裙.webp`);
});

test('未发布时不构造失效远端链接，本地验收仅使用明确注入的资源地址', () => {
  assert.equal(pendingResources.衣柜素材发布配置.状态, '待发布');
  assert.equal(pendingResources.衣柜素材基址, '');
  assert.equal(pendingResources.衣柜造型图片(fixed[0]), '');
  assert.equal(pendingResources.衣柜商品修正图('换戒'), '');
  assert.equal(resources.衣柜素材基址, 'http://wardrobe.test/approved');
});

test('戒指商品图已改为素圈且只覆盖换戒这一商品', () => {
  assert.equal(decodeURI(resources.衣柜商品修正图('换戒')), 'http://wardrobe.test/approved/_道具/换戒.webp');
  assert.equal(resources.衣柜商品修正图('choker颈环'), '');
  const provenance = JSON.parse(readFileSync(new URL('../../output/imagegen/wardrobe-visual-reset/inventory-corrections/manifest.json', import.meta.url), 'utf8'));
  assert.equal(hash('_道具/换戒.webp'), provenance.sha256);
});
