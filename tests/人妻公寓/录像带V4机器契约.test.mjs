/* eslint-disable import-x/no-nodejs-modules -- Node-only VTR V4 contract regression */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
  resolveJsonModule: true,
  esModuleInterop: true,
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  录像带V4候选清单,
  录像带V4产品清单,
  录像带V4镜头卡们,
  录像带V4上下文策略,
  录像带V4监控覆盖层契约,
  录像带V4微信前置契约,
  校验录像带V4机器契约,
  读取录像带V4候选,
  读取录像带V4产品,
  读取录像带V4镜头卡,
  读取录像带V4微信卡,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');

const 根 = new URL('../../', import.meta.url);
const 根路径 = fileURLToPath(根);
const 证据根路径 = process.env.RQGY_VTR_EVIDENCE_ROOT ? resolve(process.env.RQGY_VTR_EVIDENCE_ROOT) : 根路径;
const 契约目录 = 'src/人妻公寓/生产契约/录像带V4';
const 产品目录 = 'src/人妻公寓/素材/特殊场景/录像带V4';
const 契约哈希 = Object.freeze({
  [`${契约目录}/final-candidates-manifest-v2.json`]: 'f8309ead2bf3c1509d2de9d0aca94f2e4b14462589d5fb4061587bc80a6340a4',
  [`${契约目录}/shot-cards-v8.json`]: '24a983c4ddc5283a55b846863c5f8ed9aae260c49fc1dd5a5579e80e57f8fd16',
  [`${契约目录}/context-isolation-policy-v1.json`]: '323ff6f053d8a5eba0dc9fb8cc464ef87789e3b88840ce337095f4037f03edf0',
  [`${契约目录}/monitor-overlay-contract-v1.json`]: 'a0343da02c4d6255b177d03cb3b2ae2dc3da3070555bf53b66a587f9b5c27c7c',
  [`${契约目录}/wechat-prelude-flow-v2.json`]: '25a88316a05aea34872fb68f89b91e7b0f328f2e76c4bfc5b336a9ea80158a69',
  [`${产品目录}/录像带V4CG.manifest.json`]: '29ca52edd9bcbe19c61d0fd12f75c41bbb029e9468103c7eb5ed9c2dd82c2706',
});

function 规范文本SHA256(相对路径) {
  return createHash('sha256')
    .update(readFileSync(new URL(相对路径, 根), 'utf8').replace(/\r\n?/gu, '\n'))
    .digest('hex');
}

function png尺寸(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG签名无效');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', 'PNG缺少IHDR');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function webp尺寸(bytes) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', 'WebP缺少RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', 'WebP签名无效');
  const kind = bytes.subarray(12, 16).toString('ascii');
  if (kind === 'VP8X') {
    return [1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)];
  }
  if (kind === 'VP8L') {
    assert.equal(bytes[20], 0x2f, 'VP8L特征字节无效');
    return [
      1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    ];
  }
  const marker = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
  assert.notEqual(marker, -1, `无法解析${kind || '未知'} WebP尺寸`);
  return [bytes.readUInt16LE(marker + 3) & 0x3fff, bytes.readUInt16LE(marker + 5) & 0x3fff];
}

function 递归生产源码(目录) {
  const 结果 = [];
  for (const 项 of readdirSync(目录, { withFileTypes: true })) {
    const 路径 = join(目录, 项.name);
    if (项.isDirectory()) 结果.push(...递归生产源码(路径));
    else if (/\.(?:ts|tsx|vue)$/u.test(项.name)) 结果.push(路径);
  }
  return 结果;
}

test('六份src内生产机器契约保持规范换行SHA，本地安装完成但外部发布锁不偷开', () => {
  for (const [路径, 预期] of Object.entries(契约哈希)) assert.equal(规范文本SHA256(路径), 预期, 路径);
  assert.doesNotThrow(() => 校验录像带V4机器契约());
  assert.equal(录像带V4候选清单.formalAccepted, true);
  assert.equal(录像带V4候选清单.installed, true);
  assert.equal(录像带V4候选清单.productionUnlocked, false);
  assert.equal(录像带V4产品清单.status, 'product-webp-ready-awaiting-external-publish');
  assert.equal(录像带V4产品清单.publish.immutableTag, '');
  assert.equal(录像带V4上下文策略.installed, true);
  assert.equal(录像带V4监控覆盖层契约.installed, true);
  assert.equal(录像带V4微信前置契约.installed, true);
});

test('src内生产TS/Vue不得再静态导入output/imagegen工作目录', () => {
  const 静态越界 = /(?:from\s*|import\s*\(|require\s*\()\s*['"][^'"]*output\/imagegen\//u;
  const 命中 = 递归生产源码(join(根路径, 'src', '人妻公寓')).flatMap(路径 =>
    静态越界.test(readFileSync(路径, 'utf8')) ? [路径.slice(根路径.length).replaceAll('\\', '/')] : [],
  );
  assert.deepEqual(命中, []);
});

test('38张候选、38张WebP产品与38张逐幕卡严格一一对应，102/202各19幕且双层哈希唯一', () => {
  assert.equal(录像带V4候选清单.count, 38);
  assert.equal(录像带V4产品清单.items.length, 38);
  assert.equal(录像带V4镜头卡们.length, 38);
  const ids = new Set();
  const sourceHashes = new Set();
  const productHashes = new Set();
  for (const 房间 of ['102', '202']) {
    for (let 幕次 = 1; 幕次 <= 19; 幕次 += 1) {
      const 候选 = 读取录像带V4候选(房间, 幕次);
      const 产品 = 读取录像带V4产品(房间, 幕次);
      const 卡 = 读取录像带V4镜头卡(房间, 幕次);
      assert.ok(候选, `${房间}-B${幕次} 缺候选`);
      assert.ok(产品, `${房间}-B${幕次} 缺产品`);
      assert.ok(卡, `${房间}-B${幕次} 缺镜头卡`);
      assert.equal(候选.id, 卡.id);
      assert.equal(候选.id, 产品.id);
      assert.equal(候选.outputSha256, 卡.imageSha256);
      assert.equal(候选.outputSha256, 产品.sourceSha256);
      assert.equal(候选.productSha256, 产品.productSha256);
      assert.equal(候选.productSha256, 卡.productImageSha256);
      assert.equal(候选.productFile, 产品.productFile);
      assert.equal(候选.productPath, 卡.productImage);
      assert.equal(卡.room, 房间);
      assert.equal(卡.beat, 幕次);
      ids.add(候选.id);
      sourceHashes.add(候选.outputSha256);
      productHashes.add(产品.productSha256);
    }
  }
  assert.equal(ids.size, 38);
  assert.equal(sourceHashes.size, 38);
  assert.equal(productHashes.size, 38);
  assert.match(读取录像带V4候选('102', 8).output, /VTR-V4-102-B08-draw2\.png$/u);
  assert.match(读取录像带V4候选('202', 8).output, /VTR-V4-202-B08-draw2\.png$/u);
  assert.equal(读取录像带V4产品('102', 8).productFile, 'VTR-V4-102-B08.webp');
  assert.equal(读取录像带V4产品('202', 8).productFile, 'VTR-V4-202-B08.webp');
});

test('38张候选证据保持原始审核状态，38张WebP产品逐图SHA、尺寸与体积闭合', () => {
  const productRoot = join(根路径, 产品目录);
  const productFiles = readdirSync(productRoot)
    .filter(file => /\.(?:png|webp)$/u.test(file))
    .sort();
  assert.deepEqual(productFiles, 录像带V4产品清单.items.map(item => item.productFile).sort());
  assert.equal(
    createHash('sha256')
      .update(readFileSync(join(证据根路径, 录像带V4产品清单.sourceEvidence.candidateManifest)))
      .digest('hex')
      .toUpperCase(),
    录像带V4产品清单.sourceEvidence.candidateManifestSha256,
  );
  assert.equal(
    createHash('sha256')
      .update(readFileSync(join(证据根路径, 录像带V4产品清单.sourceEvidence.manualReview)))
      .digest('hex')
      .toUpperCase(),
    录像带V4产品清单.sourceEvidence.manualReviewSha256,
  );
  assert.equal(
    createHash('sha256')
      .update(readFileSync(join(根路径, 录像带V4候选清单.productManifest)))
      .digest('hex')
      .toUpperCase(),
    录像带V4候选清单.productManifestSha256,
  );

  for (const 候选 of 录像带V4候选清单.records) {
    assert.equal(候选.userConfirmed, true);
    assert.equal(候选.formalAccepted, true);
    assert.equal(候选.installed, true);
    assert.equal(候选.productionUnlocked, false);
    const bytes = readFileSync(join(证据根路径, 候选.output));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex').toUpperCase(),
      String(候选.outputSha256).toUpperCase(),
      候选.output,
    );
    assert.deepEqual(png尺寸(bytes), [1536, 1024], 候选.output);
    const provenance = JSON.parse(readFileSync(join(证据根路径, 候选.provenance), 'utf8'));
    assert.equal(provenance.id, 候选.id);
    assert.equal(provenance.output, 候选.output);
    assert.equal(String(provenance.outputSha256).toUpperCase(), String(候选.outputSha256).toUpperCase());
    assert.deepEqual(provenance.dimensions, [1536, 1024]);
    assert.equal(provenance.monitorOverlayBaked, false);
    assert.equal(provenance.usesRejectedPixels, false);
    assert.equal(provenance.userConfirmed, false);
    assert.equal(provenance.formalAccepted, false);
    assert.equal(provenance.installed, false);
    assert.equal(provenance.productionUnlocked, false);
  }

  for (const 产品 of 录像带V4产品清单.items) {
    const sourcePath = join(证据根路径, 产品.sourcePath);
    const productPath = join(productRoot, 产品.productFile);
    assert.equal(existsSync(sourcePath), true, 产品.sourcePath);
    assert.equal(existsSync(join(证据根路径, 产品.sourceProvenance)), true, 产品.sourceProvenance);
    assert.equal(
      createHash('sha256').update(readFileSync(sourcePath)).digest('hex').toUpperCase(),
      产品.sourceSha256,
      产品.id,
    );
    assert.equal(readFileSync(sourcePath).length, 产品.sourceBytes, 产品.id);
    assert.equal(existsSync(productPath), true, 产品.productFile);
    const productBytes = readFileSync(productPath);
    assert.deepEqual(webp尺寸(productBytes), [1536, 1024], 产品.id);
    assert.equal(createHash('sha256').update(productBytes).digest('hex').toUpperCase(), 产品.productSha256, 产品.id);
    assert.equal(productBytes.length, 产品.productBytes, 产品.id);
    assert.equal(产品.productFile, `${产品.id}.webp`, 产品.id);
    assert.ok(产品.productBytes < 产品.sourceBytes, `${产品.id}产品图必须小于源图`);
  }
  assert.equal(录像带V4产品清单.qualityEvidence.sourceBytes, 66892443);
  assert.equal(录像带V4产品清单.qualityEvidence.productBytes, 6975484);
  assert.equal(录像带V4产品清单.qualityEvidence.savedPercent, 89.572);
  assert.deepEqual(录像带V4产品清单.userAcceptance.intentionalLegacyPixelReuseIds, [
    'VTR-V4-102-B01',
    'VTR-V4-202-B01',
    'VTR-V4-102-B17',
    'VTR-V4-202-B17',
  ]);
});

test('镜头卡冻结当前CAM、停止边界和两位人妻差异化方向，不把REC覆盖层写进故事AI', () => {
  const 沈侧 = 读取录像带V4镜头卡('202', 10);
  const 周侧 = 读取录像带V4镜头卡('102', 10);
  assert.match(沈侧.runtimeAiPrompt, /CAM-202/u);
  assert.match(周侧.runtimeAiPrompt, /CAM-102/u);
  assert.ok(沈侧.runtimeStopBoundary || 沈侧.stopBoundary);
  assert.ok(周侧.runtimeStopBoundary || 周侧.stopBoundary);
  assert.notEqual(沈侧.currentHumiliationFocus, 周侧.currentHumiliationFocus);
  assert.doesNotMatch(沈侧.runtimeAiPrompt, /(?:叠加|覆盖层).*REC/iu);
  assert.doesNotMatch(周侧.runtimeAiPrompt, /(?:叠加|覆盖层).*REC/iu);
});

test('微信卡覆盖两线程的戴锁、同意和唯一出发，且明确监控点击自动切到302', () => {
  for (const 房间 of ['102', '202']) {
    assert.ok(读取录像带V4微信卡(房间, 'lock-confirmation'));
    assert.ok(读取录像带V4微信卡(房间, 'watch-consent'));
    const 出发 = 读取录像带V4微信卡(房间, 'departure-ready');
    assert.match(出发.aiPrompt, /点击“监控”/u);
    assert.match(出发.aiPrompt, /自动切到302/u);
  }
  assert.equal(录像带V4微信前置契约.gates.monitorDoesNotAutoStart, true);
  assert.equal(录像带V4微信前置契约.gates.manualTravelTo302Required, false);
  assert.equal(录像带V4微信前置契约.gates.monitorClickAutoTransfersTo302, true);
});

test('覆盖层契约对38张无例外：REC、正确CAM、时间码、监控框与失败占位都必须存在', () => {
  assert.equal(录像带V4监控覆盖层契约.coverage.candidateCount, 38);
  assert.deepEqual(录像带V4监控覆盖层契约.coverage.exceptions, []);
  assert.equal(录像带V4监控覆盖层契约.assetPolicy.rawPngOverlayBaked, false);
  assert.equal(录像带V4监控覆盖层契约.assetPolicy.runtimeOverlayRequired, true);
  const ids = 录像带V4监控覆盖层契约.requiredRuntimeElements.map(元素 => 元素.id);
  assert.deepEqual(ids, ['rec', 'cam', 'timecode', 'monitor-frame']);
  assert.equal(录像带V4监控覆盖层契约.layoutSafety.overlayScalesWithContainImageRect, true);
  assert.equal(录像带V4监控覆盖层契约.layoutSafety.fallbackMaintainsMonitorIdentity, true);
});
