/* eslint-disable import-x/no-nodejs-modules -- Node-only CG provenance regression */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const manifestPath = new URL(
  '../../src/人妻公寓/素材/特殊场景/安若妍不必停/安若妍不必停CG.manifest.json',
  import.meta.url,
);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const evidenceRoot = process.env.RQGY_CG_EVIDENCE_ROOT ? path.resolve(process.env.RQGY_CG_EVIDENCE_ROOT) : repoRoot;
const productRoot = path.join(repoRoot, 'src/人妻公寓/素材/特殊场景/安若妍不必停');

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
}

function webpSize(bytes) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', 'WebP缺少RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', 'WebP签名无效');
  const kind = bytes.subarray(12, 16).toString('ascii');
  if (kind === 'VP8X') {
    return [
      1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    ];
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

test('18张封板源图与WebP产品逐张SHA闭合，生图与拒绝证据继续留在产品目录之外', () => {
  assert.equal(manifest.schemaVersion, 'rqgy-anruoyan-301-no-stop-product-manifest-v2');
  assert.equal(manifest.status, 'product-webp-ready-awaiting-external-publish');
  assert.equal(manifest.runtimeSlots, 14);
  assert.equal(manifest.acceptedFiles, 18);
  assert.equal(manifest.items.length, 18);
  assert.equal(manifest.format, 'webp');
  assert.equal(manifest.encoder.quality, 93);
  assert.equal(manifest.encoder.method, 6);
  assert.equal(manifest.encoder.resize, false);
  assert.equal(manifest.publish.immutableTag, '');
  assert.equal(manifest.publish.runtimeDirectory, 'src/人妻公寓/素材/特殊场景/安若妍不必停');
  assert.equal(new Set(manifest.items.map(item => item.id)).size, 18);
  assert.equal(manifest.sourceEvidence.acceptedOriginalsPreserved, 18);
  assert.equal(manifest.sourceEvidence.supersededOriginalsPreserved, 1);
  assert.equal(manifest.sourceEvidence.technicalFailuresPreserved, 1);
  assert.equal(manifest.sourceEvidence.nonProductionExperimentsRecorded, 1);
  assert.equal(
    sha256(path.join(evidenceRoot, manifest.sourceEvidence.sourceManifest)),
    manifest.sourceEvidence.sourceManifestSha256,
  );
  assert.equal(
    sha256(path.join(evidenceRoot, manifest.sourceEvidence.currentTask)),
    manifest.sourceEvidence.currentTaskSha256,
  );

  const products = readdirSync(productRoot)
    .filter(file => /\.(?:png|webp)$/u.test(file))
    .sort();
  assert.deepEqual(products, manifest.items.map(item => item.productFile).sort());

  for (const item of manifest.items) {
    const source = path.join(evidenceRoot, item.sourcePath);
    const product = path.join(productRoot, item.productFile);
    assert.equal(existsSync(source), true, item.sourcePath);
    assert.equal(existsSync(path.join(evidenceRoot, item.sourceReviewPath)), true, item.sourceReviewPath);
    assert.equal(sha256(source), item.sourceSha256, item.id);
    assert.equal(readFileSync(source).length, item.sourceBytes, item.id);
    assert.equal(existsSync(product), true, item.productFile);
    const productBytes = readFileSync(product);
    assert.deepEqual(webpSize(productBytes), [1536, 1024], item.id);
    assert.equal(sha256(product), item.productSha256, item.id);
    assert.equal(productBytes.length, item.productBytes, item.id);
    assert.equal(item.productFile, `${item.id}.webp`, item.id);
    assert.ok(item.productBytes < item.sourceBytes, `${item.id}产品图必须小于源图`);
    assert.match(item.sourcePath, /^output\/imagegen\/rqgy-reset\/adult-completion\/anruoyan-301-no-stop\//u);
  }
  assert.ok(manifest.qualityEvidence.savedPercent > 80);
});

test('06/09/10/13严格拥有N/P两张，其他运行镜头只保留共享图', () => {
  const byId = new Map(manifest.items.map(item => [item.id, item]));
  for (const slot of ['06', '09', '10', '13']) {
    assert.equal(byId.get(`ARY-NBS-${slot}-N`)?.variant, 'normal');
    assert.equal(byId.get(`ARY-NBS-${slot}-P`)?.variant, 'pregnant');
    assert.equal(byId.has(`ARY-NBS-${slot}`), false);
  }
  for (const slot of ['01', '02', '03', '04', '05', '07', '08', '11', '12', '14']) {
    assert.equal(byId.get(`ARY-NBS-${slot}`)?.variant, 'shared');
    assert.equal(byId.has(`ARY-NBS-${slot}-N`), false);
    assert.equal(byId.has(`ARY-NBS-${slot}-P`), false);
  }
});

test('全部CG保持统一3:2横图规格，代码发布前不会请求虚构不可变标签', () => {
  assert.deepEqual(manifest.dimensions, { width: 1536, height: 1024, aspectRatio: '3:2' });
  const assetsSource = readFileSync(new URL('../../src/人妻公寓/界面/客户端/assets.ts', import.meta.url), 'utf8');
  assert.match(assetsSource, /不可变标签:\s*''/u);
  assert.match(assetsSource, /状态:\s*'待不可变标签'/u);
  assert.match(assetsSource, /__RQGY_ARY_301_NO_STOP_ASSET_BASE__/u);
  assert.match(assetsSource, /\$\{文件\}\.webp/u);
  assert.doesNotMatch(assetsSource, /@rq0\.90\.4\/src\/人妻公寓\/素材\/特殊场景\/安若妍不必停/u);
});
