/* eslint-disable import-x/no-nodejs-modules -- Node-only asset provenance and routing regression */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import lodash from 'lodash';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const evidence = process.env.RQGY_CG_EVIDENCE_ROOT ? path.resolve(process.env.RQGY_CG_EVIDENCE_ROOT) : repo;
const productRoot = path.join(repo, 'src/人妻公寓/素材/特殊场景/安若妍换掉');
const manifest = JSON.parse(readFileSync(path.join(productRoot, '安若妍换掉CG.manifest.json'), 'utf8'));
const items = new Map(manifest.items.map(item => [item.id, item]));
const digest = bytes => createHash('sha256').update(bytes).digest('hex').toUpperCase();

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const assets = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉资源.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const phone = require('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/资源与皮肤.ts');
const fresh = () => Schema.parse({ 户: { 301: 创建户节点(0) } });

test('31张无损WebP产品与清单逐张SHA、尺寸及文件集合闭合', () => {
  assert.equal(manifest.schemaVersion, 'rqgy-anruoyan-301-replace-product-manifest-v1');
  assert.equal(manifest.status, 'product-webp-ready-awaiting-external-publish');
  assert.equal(manifest.runtimeSlots, 13);
  assert.equal(manifest.acceptedFiles, 31);
  assert.equal(manifest.storyFiles, 19);
  assert.equal(manifest.persistentBackgroundFiles, 12);
  assert.equal(items.size, 31);
  assert.equal(manifest.encoder.lossless, true);
  assert.equal(manifest.encoder.resize, false);
  assert.equal(manifest.qualityEvidence.decodedPixelsIdenticalFiles, 31);
  assert.equal(manifest.qualityEvidence.outsideFrameUnchangedBackgrounds, 8);
  assert.deepEqual(
    readdirSync(productRoot)
      .filter(file => file.endsWith('.webp'))
      .sort(),
    manifest.items.map(item => item.productFile).sort(),
  );
  const hashes = new Set();
  for (const item of items.values()) {
    const bytes = readFileSync(path.join(productRoot, item.productFile));
    assert.equal(item.productFile, `${item.id}.webp`);
    assert.equal(digest(bytes), item.productSha256, item.id);
    assert.equal(bytes.length, item.productBytes, item.id);
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
    assert.equal(bytes.subarray(8, 16).toString(), 'WEBPVP8L');
    assert.equal(bytes[20], 0x2f);
    const packed = bytes.readUInt32LE(21);
    assert.deepEqual([(packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1], [1536, 1024], item.id);
    assert.equal(item.decodedPixelsMatchSource, true);
    assert.equal(item.visualReview.detail, 'original');
    assert.equal(item.visualReview.verdict, 'pass');
    hashes.add(item.productSha256);
  }
  assert.equal(hashes.size, 31, '没有精确重复产品');
});

test('七份生产清单、原图和逐图审核记录与产品来源一致', () => {
  const sourceFinals = new Map();
  assert.equal(manifest.sourceEvidence.manifests.length, 7);
  for (const source of manifest.sourceEvidence.manifests) {
    const bytes = readFileSync(path.join(evidence, source.path));
    assert.equal(digest(bytes), source.sha256, source.path);
    const data = JSON.parse(bytes);
    for (const key of ['acceptedFinals', 'eventFinals', 'photos', 'finals']) {
      for (const entry of data[key] ?? []) {
        assert.equal(sourceFinals.has(entry.id), false, entry.id);
        sourceFinals.set(entry.id, { ...entry, manifest: source.path });
      }
    }
  }
  assert.equal(sourceFinals.size, 31);
  for (const item of items.values()) {
    const source = sourceFinals.get(item.id);
    assert.equal(source.sha256, item.sourceSha256, item.id);
    assert.equal(source.manifest, item.sourceManifest, item.id);
    assert.ok(item.sourcePath.endsWith(`/${source.path}`), item.id);
    const bytes = readFileSync(path.join(evidence, item.sourcePath));
    assert.equal(digest(bytes), item.sourceSha256, item.id);
    assert.equal(bytes.length, item.sourceBytes);
    assert.equal(digest(readFileSync(path.join(evidence, item.sourceReviewPath))), item.sourceReviewSha256);
  }
});

test('11个剧情节点实际生成的13个运行位完整覆盖19张剧情产品', () => {
  const reached = new Set();
  for (const pregnancy of ['未孕', '已告知']) {
    const data = fresh();
    data.户['301'].妻._怀孕.状态 = pregnancy;
    for (const scene of ['A1', 'B1', 'B2', 'C1', 'C2', 'H1', 'P1', 'P2', 'H10', 'H11', 'H12']) {
      const ids = route.安若妍换掉剧情CG(data, `【安若妍换掉提交:${scene}:asset-test】`);
      assert.equal(ids.length, ['P1', 'P2'].includes(scene) ? 2 : 1, scene);
      for (const id of ids) {
        assert.equal(items.get(id)?.kind, 'story', id);
        reached.add(id);
      }
    }
  }
  assert.deepEqual(
    [...reached].sort(),
    manifest.items
      .filter(item => item.kind === 'story')
      .map(item => item.id)
      .sort(),
  );
});

test('全部12张背景覆盖普通与前三胎，完成凭据和P2冻结体态决定换照', () => {
  const reached = new Set();
  for (let births = 0; births <= 3; births++) {
    const data = fresh();
    data.系统._家庭文档.孩子 = Array.from({ length: births }, (_, i) => ({
      母亲门牌: '301',
      胎次: i + 1,
      出生绝对时段: i,
    }));
    const room = births ? `BABY${births}` : 'BASE';
    for (const body of ['普通', '孕态']) {
      data.系统._安若妍换掉.最终照片体态 = body;
      assert.equal(assets.安若妍换掉背景文件(data), `ARY-RPL-BG-${room}-PRE`);
    }
    reached.add(assets.安若妍换掉背景文件(data));
    data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
    for (const [body, suffix] of [
      ['普通', 'N'],
      ['孕态', 'P'],
    ]) {
      data.系统._安若妍换掉.最终照片体态 = body;
      for (const current of ['未孕', '已告知']) {
        data.户['301'].妻._怀孕.状态 = current;
        const id = assets.安若妍换掉背景文件(data);
        assert.equal(id, `ARY-RPL-BG-${room}-POST-${suffix}`);
        assert.equal(items.get(id)?.finalPhotoId, `ARY-RPL-10-${suffix}`);
        assert.equal(items.get(id)?.preBackgroundId, `ARY-RPL-BG-${room}-PRE`);
        reached.add(id);
      }
    }
  }
  assert.deepEqual(
    [...reached].sort(),
    manifest.items
      .filter(item => item.kind === 'persistent_background')
      .map(item => item.id)
      .sort(),
  );
});

test('读档与回档保持冻结照片，缺照片的完成旧档使用既有降级', () => {
  const data = fresh();
  const before = Schema.parse(data);
  data.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
  assert.equal(assets.安若妍换掉背景文件(data), '');
  Object.assign(data.系统._安若妍换掉, { 最终照片体态: '孕态', 最终照片素材ID: 'ARY-RPL-10-P' });
  const restored = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.equal(assets.安若妍换掉背景文件(restored), 'ARY-RPL-BG-BASE-POST-P');
  assert.equal(assets.安若妍换掉背景文件(before), 'ARY-RPL-BG-BASE-PRE');
  for (const scene of ['P2', 'H10']) {
    for (const id of route.安若妍换掉剧情CG(restored, `【安若妍换掉提交:${scene}:asset-test】`)) {
      assert.ok(id.endsWith('-P'));
      assert.ok(items.has(id));
    }
  }
  assert.equal(assets.安若妍换掉背景文件(Schema.parse({})), '');
});

test('发布配置使用cg5，手机与界面同源且非法文件名维持降级', () => {
  const config = assets.安若妍换掉素材发布配置;
  assert.equal(config.产品目录, 'rq091/story/安若妍换掉');
  assert.equal(config.manifest, '安若妍换掉CG.manifest.json');
  assert.equal(config.文件数, manifest.acceptedFiles);
  assert.equal(config.仓库, 'shujun8520-design/qgy-assets');
  assert.equal(config.不可变标签, 'cg5');
  assert.equal(config.状态, '已发布');
  delete globalThis.__RQGY_ARY_REPLACE_ASSET_BASE__;
  assert.equal(decodeURI(assets.安若妍换掉图片('ARY-RPL-10-N')), 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg5/rq091/story/安若妍换掉/ARY-RPL-10-N.webp');
  assert.equal(phone.私聊图片地址('@ending/安若妍换掉/ARY-RPL-10-N'), assets.安若妍换掉图片('ARY-RPL-10-N'));
  try {
    globalThis.__RQGY_ARY_REPLACE_ASSET_BASE__ = 'https://example.test/assets/';
    for (const id of [
      '../ARY-RPL-01',
      'ARY-RPL-01.webp',
      'ARY-RPL-06',
      'ARY-RPL-01-N',
      'ARY-RPL-BG-BABY4-PRE',
      'ARY-RPL-09-N-SRC',
    ]) {
      assert.equal(assets.安若妍换掉图片(id), '', id);
    }
  } finally {
    delete globalThis.__RQGY_ARY_REPLACE_ASSET_BASE__;
  }
});

test('通过实际HTTP基址实取31张产品，手机消费同一资源路由', async t => {
  const server = createServer((request, response) => {
    const id = request.url?.slice('/assets/'.length).replace(/\.webp$/u, '');
    const item = request.url?.startsWith('/assets/') ? items.get(id) : undefined;
    if (!item) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': 'image/webp' });
    response.end(readFileSync(path.join(productRoot, item.productFile)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/assets`;
  globalThis.__RQGY_ARY_REPLACE_ASSET_BASE__ = base;
  try {
    for (const item of items.values()) {
      const url = assets.安若妍换掉图片(item.id);
      assert.equal(url, `${base}/${item.productFile}`);
      assert.equal(phone.私聊图片地址(`@ending/安若妍换掉/${item.id}`), url);
      const response = await fetch(url);
      assert.equal(response.status, 200, item.id);
      assert.equal(digest(Buffer.from(await response.arrayBuffer())), item.productSha256, item.id);
    }
  } finally {
    delete globalThis.__RQGY_ARY_REPLACE_ASSET_BASE__;
  }
});
