/* eslint-disable import-x/no-nodejs-modules -- Node-only VTR V4 contract regression */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
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
  录像带V4镜头卡们,
  录像带V4上下文策略,
  录像带V4监控覆盖层契约,
  录像带V4微信前置契约,
  校验录像带V4机器契约,
  读取录像带V4候选,
  读取录像带V4镜头卡,
  读取录像带V4微信卡,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');

const 根 = new URL('../../', import.meta.url);
const 根路径 = fileURLToPath(根);
const 契约目录 = 'src/人妻公寓/生产契约/录像带V4';
const 契约哈希 = Object.freeze({
  [`${契约目录}/final-candidates-manifest-v2.json`]:
    'ef3baaf31b93ddf8e69b5f5826cbf7bdaae22a4727ee0248fcf14c757284d4af',
  [`${契约目录}/shot-cards-v8.json`]:
    'f9d89be75e8905e118d6aa51e1ad96dfb2e3b8fb57a1048c5a6c5ab1d0b7d2bb',
  [`${契约目录}/context-isolation-policy-v1.json`]:
    '3a3436368adf1c42ffd732318c6e4e607e7a91210c058017c4cc2813e021b858',
  [`${契约目录}/monitor-overlay-contract-v1.json`]:
    'fafe7d013b0ed6f35888cb503214d6f61e5ffd75463c30fdd387bd56c06db11f',
  [`${契约目录}/wechat-prelude-flow-v2.json`]:
    '03fec2470286401fe031bcf98fd029d0467cef0622be9de5bdf0ff11ed867174',
});

function sha256(相对路径) {
  return createHash('sha256')
    .update(readFileSync(new URL(相对路径, 根)))
    .digest('hex');
}

function png尺寸(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG签名无效');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', 'PNG缺少IHDR');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
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

test('五份src内生产机器契约仍是交接冻结的SHA，安装状态不得被代码接线偷改', () => {
  for (const [路径, 预期] of Object.entries(契约哈希)) assert.equal(sha256(路径), 预期, 路径);
  assert.doesNotThrow(() => 校验录像带V4机器契约());
  assert.equal(录像带V4候选清单.formalAccepted, false);
  assert.equal(录像带V4候选清单.installed, false);
  assert.equal(录像带V4候选清单.productionUnlocked, false);
  assert.equal(录像带V4上下文策略.installed, false);
  assert.equal(录像带V4监控覆盖层契约.installed, false);
  assert.equal(录像带V4微信前置契约.installed, false);
});

test('src内生产TS/Vue不得再静态导入output/imagegen工作目录', () => {
  const 静态越界 = /(?:from\s*|import\s*\(|require\s*\()\s*['"][^'"]*output\/imagegen\//u;
  const 命中 = 递归生产源码(join(根路径, 'src', '人妻公寓')).flatMap(路径 =>
    静态越界.test(readFileSync(路径, 'utf8')) ? [路径.slice(根路径.length).replaceAll('\\', '/')] : [],
  );
  assert.deepEqual(命中, []);
});

test('38张候选与38张逐幕卡严格一一对应，102/202各19幕且哈希唯一', () => {
  assert.equal(录像带V4候选清单.count, 38);
  assert.equal(录像带V4镜头卡们.length, 38);
  const ids = new Set();
  const hashes = new Set();
  for (const 房间 of ['102', '202']) {
    for (let 幕次 = 1; 幕次 <= 19; 幕次 += 1) {
      const 候选 = 读取录像带V4候选(房间, 幕次);
      const 卡 = 读取录像带V4镜头卡(房间, 幕次);
      assert.ok(候选, `${房间}-B${幕次} 缺候选`);
      assert.ok(卡, `${房间}-B${幕次} 缺镜头卡`);
      assert.equal(候选.id, 卡.id);
      assert.equal(候选.outputSha256, 卡.imageSha256);
      assert.equal(卡.room, 房间);
      assert.equal(卡.beat, 幕次);
      ids.add(候选.id);
      hashes.add(候选.outputSha256);
    }
  }
  assert.equal(ids.size, 38);
  assert.equal(hashes.size, 38);
  assert.match(读取录像带V4候选('102', 8).output, /VTR-V4-102-B08-draw2\.png$/u);
  assert.match(读取录像带V4候选('202', 8).output, /VTR-V4-202-B08-draw2\.png$/u);
});

test('38张候选物理存在、SHA与1536×1024匹配，逐图provenance保持未烘焙未安装', () => {
  for (const 候选 of 录像带V4候选清单.records) {
    const bytes = readFileSync(new URL(候选.output, 根));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex').toUpperCase(),
      String(候选.outputSha256).toUpperCase(),
      候选.output,
    );
    assert.deepEqual(png尺寸(bytes), [1536, 1024], 候选.output);
    const provenance = JSON.parse(readFileSync(new URL(候选.provenance, 根), 'utf8'));
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
