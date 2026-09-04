/* eslint-disable import-x/no-nodejs-modules -- Node-only asset contract */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const 项目根 = new URL('../../', import.meta.url);
const 包根 = new URL(
  'output/imagegen/rqgy-reset/adult-completion/double-inheritance-302-intimacy/',
  项目根,
);
const 产品根 = new URL('approved/', 包根);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', 包根), 'utf8'));

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex').toUpperCase();

function pngSize(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG签名无效');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', 'PNG缺少IHDR');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function webpSize(bytes) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', 'WebP缺少RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', 'WebP签名无效');
  const kind = bytes.subarray(12, 16).toString('ascii');
  if (kind === 'VP8X') {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return [width, height];
  }
  if (kind === 'VP8L') {
    assert.equal(bytes[20], 0x2f, 'VP8L特征字节无效');
    const width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
    const height = 1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10);
    return [width, height];
  }
  const marker = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
  assert.notEqual(marker, -1, `无法解析${kind || '未知'} WebP尺寸`);
  return [bytes.readUInt16LE(marker + 3) & 0x3fff, bytes.readUInt16LE(marker + 5) & 0x3fff];
}

test('302结局后CG产品包精确包含4张开场与5张背景', () => {
  assert.equal(manifest.status, 'validated_pending_external_asset_publish');
  assert.deepEqual(manifest.counts, {
    planned: 9,
    accepted: 9,
    opening: 4,
    background: 5,
    png: 9,
    webp: 9,
    inputRejectedWithoutArtifact: 1,
    rejectedOriginalImages: 0,
  });
  assert.equal(manifest.assets.length, 9);
  assert.deepEqual(
    manifest.assets.map(item => item.id),
    Array.from({ length: 9 }, (_, index) => `DI302-CG-${String(index + 1).padStart(3, '0')}`),
  );
  assert.equal(manifest.assets.filter(item => item.kind === 'opening').length, 4);
  assert.equal(manifest.assets.filter(item => item.kind === 'background').length, 5);

  const 实际文件 = readdirSync(产品根).sort();
  const 期望文件 = manifest.assets.flatMap(item => [item.png, item.webp]).sort();
  assert.deepEqual(实际文件, 期望文件, '产品目录不得缺图或留孤儿文件');
});

test('9对PNG／WebP全部可解析，尺寸与manifest SHA精确一致', () => {
  for (const item of manifest.assets) {
    const png = readFileSync(new URL(item.png, 产品根));
    const webp = readFileSync(new URL(item.webp, 产品根));
    assert.deepEqual(pngSize(png), [item.width, item.height], `${item.id} PNG尺寸漂移`);
    assert.deepEqual(webpSize(webp), [item.width, item.height], `${item.id} WebP尺寸漂移`);
    assert.equal(sha256(png), item.pngSha256, `${item.id} PNG SHA漂移`);
    assert.equal(sha256(webp), item.webpSha256, `${item.id} WebP SHA漂移`);
    assert.ok(webp.length > 100_000, `${item.id} WebP疑似空壳`);
  }
});

test('身份、房间、生产计划与四份原图审核证据均存在', () => {
  for (const path of [manifest.references.identity, manifest.references.identityContinuity, manifest.references.room]) {
    assert.equal(existsSync(new URL(path, 项目根)), true, `参考缺失: ${path}`);
  }
  assert.equal(existsSync(new URL('production-plan.json', 包根)), true);
  for (const item of manifest.assets.filter(entry => entry.kind === 'opening')) {
    assert.equal(existsSync(new URL(item.review, 包根)), true, `审核证据缺失: ${item.review}`);
    assert.equal(item.verdict, 'accepted_target_achieved');
  }
});
