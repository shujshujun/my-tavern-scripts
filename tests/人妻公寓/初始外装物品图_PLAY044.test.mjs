/* eslint-disable import-x/no-nodejs-modules -- Execute the complete thumbnail router; actual local image files. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as ts from 'typescript';

const root = fileURLToPath(new URL('../../', import.meta.url));
const artifactRoot = process.env.RQGY_WARDROBE_ARTIFACT_ROOT
  ? path.resolve(process.env.RQGY_WARDROBE_ARTIFACT_ROOT)
  : process.env.RQGY_TEST_ARTIFACT_ROOT
    ? path.resolve(process.env.RQGY_TEST_ARTIFACT_ROOT)
    : root;
const sourceFile = path.join(root, 'src/人妻公寓/界面/客户端/衣柜素材.ts');
const source = fs.readFileSync(process.env.RQGY_WARDROBE_SOURCE ?? sourceFile, 'utf8');
const module = { exports: {} };
const localRequire = name => {
  if (name.endsWith('?url')) {
    const file = path.resolve(path.dirname(sourceFile), name.slice(0, -4));
    assert.equal(fs.existsSync(file), true, file);
    return { default: file };
  }
  return {
    '../../stageConfig': { 查道具: id => id === 'ordinary-outfit' ? { 服饰: { 槽: '外装' } } : undefined },
    '../../衣柜造型配置': { 需要成品造型: id => id === 'fixed-outfit', 读取衣柜造型: () => ({ id: 'fixed' }) },
    './assets': { 角色立绘候选: (role, id, pregnant) => [`portrait:${role}:${id}:${pregnant}`] },
    './穿戴成品图': { 衣柜造型图片: () => 'fixed-thumbnail' },
    './服装立绘资源': { 衣柜普通重制图: () => '', 衣柜普通重制缩略图: () => '' },
  }[name] ?? assert.fail(name);
};
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
Function('module', 'exports', 'require', js)(module, module.exports, localRequire);
const thumbnail = module.exports.衣柜物品缩略图;
const fallback = id => 'item:' + id;
const roles = ['周小满', '沈静仪', '许曼君', '夏乔', '安若妍', '母亲'];

for (const role of roles) for (const pregnant of [false, true]) test(`PLAY044 ${role}/${pregnant ? '孕态' : '普通'}初始SKU使用独立服装物品图`, () => {
  const image = thumbnail(role, '初始外装_' + role, pregnant, fallback);
  assert.equal(decodeURIComponent(image), 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg6/rq091/ui/初始外装_' + role + '.webp');
  const bytes = fs.readFileSync(path.join(root, 'src/人妻公寓/素材/道具', '初始外装_' + role + '.webp'));
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
});

test('PLAY044切角色和重新调用不沿用上一人的缩略图', () => {
  const images = roles.map(role => thumbnail(role, '初始外装_' + role, false, fallback));
  assert.equal(new Set(images).size, 6);
  assert.equal(thumbnail(roles[0], '初始外装_' + roles[0], false, fallback), images[0]);
});

test('PLAY044普通商品、成品造型及默认内衣妆容仍沿原路径', () => {
  assert.equal(thumbnail('夏乔', 'ordinary-outfit', true, fallback), 'portrait:夏乔:ordinary-outfit:true');
  assert.equal(thumbnail('夏乔', 'fixed-outfit', false, fallback), 'fixed-thumbnail');
  assert.equal(thumbnail('夏乔', 'ring', false, fallback), 'item:ring');
  assert.match(decodeURIComponent(thumbnail('夏乔', '初始内衣_夏乔', false, fallback)), /衣柜_默认内衣状态\.webp$/);
  assert.match(decodeURIComponent(thumbnail('夏乔', '初始妆容_夏乔', true, fallback)), /衣柜_初始妆容\.webp$/);
  assert.equal(thumbnail('夏乔', 'constructor', false, fallback), 'item:constructor');
});

test('PLAY044六张原PNG与无损WebP来源SHA明确，原生尺寸保留', () => {
  const dir = path.join(artifactRoot, 'output/imagegen/wardrobe-initial-20260908');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
  assert.equal(manifest.items.length, 6);
  for (const item of manifest.items) {
    const original = fs.readFileSync(path.join(dir, item.originalFile));
    const product = fs.readFileSync(path.join(root, 'src/人妻公寓/素材/道具', item.productFile));
    assert.equal(createHash('sha256').update(original).digest('hex').toUpperCase(), item.sourceSha256);
    assert.equal(createHash('sha256').update(product).digest('hex'), item.sha256);
    assert.equal(original.readUInt32BE(16), item.width);
    assert.equal(original.readUInt32BE(20), item.height);
    assert.equal(item.width, item.height);
  }
});
