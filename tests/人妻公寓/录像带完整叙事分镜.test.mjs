/* eslint-disable import-x/no-nodejs-modules -- Node-only narrative contract test */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const 合同路径 = path.join(仓库根, 'output/imagegen/video-tape-ending/tablet-localization-v2/story-contract.json');
const 分镜路径 = path.join(仓库根, 'src/人妻公寓/录像带_平板母带本地化分镜_v2_2026-09-01.md');
const 旧试播说明路径 = path.join(仓库根, 'output/imagegen/video-tape-ending/tablet-localization-v1/README.md');
const 当前资源路径 = path.join(仓库根, 'src/人妻公寓/界面/客户端/录像带双承接平板资源.ts');
const V4状态路径 = path.join(仓库根, 'src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');
const V4运行时路径 = path.join(仓库根, 'src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');
const V4客户端路径 = path.join(仓库根, 'src/人妻公寓/界面/客户端/App.vue');
const 平板项目目录 = path.join(仓库根, 'output/imagegen/video-tape-ending/tablet-localization-v2');
const 外层项目目录 = path.join(仓库根, 'output/imagegen/video-tape-ending/outer-lifecycle-v2');
const 产品目录 = path.join(仓库根, 'src/人妻公寓/素材/丈夫结局/录像带/v2');

const 合同 = JSON.parse(readFileSync(合同路径, 'utf8'));

function sha256(文件) {
  return createHash('sha256').update(readFileSync(文件)).digest('hex').toUpperCase();
}

test('V2已被V4取代：旧合同仅保留资产证据，生产锁必须保持关闭', () => {
  assert.equal(合同.schemaVersion, 'rqgy-vtr-full-story-contract-v2');
  assert.equal(合同.status, 'visual-revision-v3-in-progress-static-exterior-reuse-rejected');
  assert.equal(合同.productionUnlocked, false);
  assert.ok(合同.supersededVisualReview, '旧V2必须保留被后继方案取代的审计记录');
  assert.equal(合同.legacyPilot.classification, 'five-highlight-technical-pilot');
  assert.equal(合同.legacyPilot.mustNotBePresentedAsCompleteStory, true);
  assert.deepEqual(合同.formalTrack.sequenceRange, [1, 10]);
  assert.equal(合同.formalTrack.tabletBeats.length, 10);
  assert.deepEqual(
    合同.formalTrack.tabletBeats.map(项 => 项.sequence),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );

  for (const 节拍 of 合同.formalTrack.tabletBeats) {
    const 两户 = Object.entries(节拍.rooms);
    assert.deepEqual(
      两户.map(([房间]) => 房间),
      ['102', '202'],
    );
    for (const [房间, 帧] of 两户) {
      const 人物前缀 = 房间 === '102' ? 'SJY' : 'ZXM';
      assert.equal(帧.sourceShotId, `TAPE-${人物前缀}-${String(节拍.sequence).padStart(2, '0')}`);
      assert.equal(帧.assetId, `SCREEN-V2-${房间}-${String(节拍.sequence).padStart(2, '0')}`);
      assert.equal(节拍.provider, 节拍.sequence === 1 ? 'builtin' : 'local-deterministic-composite');
    }
  }
});

test('V2历史平板素材映射仍可考古，但不再代表最终游戏效果', () => {
  const 期望复用 = new Map([
    [1, 1],
    [2, 2],
    [6, 3],
    [9, 4],
    [10, 5],
  ]);
  const 新增 = [];
  for (const 节拍 of 合同.formalTrack.tabletBeats) {
    for (const [房间, 帧] of Object.entries(节拍.rooms)) {
      if (期望复用.has(节拍.sequence)) {
        assert.equal(帧.sourceStatus, 'accepted');
        assert.equal(帧.reuseFrom, `SCREEN-${房间}-${String(期望复用.get(节拍.sequence)).padStart(2, '0')}`);
      } else {
        assert.equal(帧.sourceStatus, 'accepted');
        assert.equal(帧.reuseFrom, null);
        新增.push(帧.sourceShotId);
      }
    }
  }
  assert.equal(新增.length, 10);
  assert.deepEqual(合同.missingAdultSourceShotIds, []);
  assert.equal(合同.tabletAssetDelivery.status, 'accepted-ready-for-runtime');
  assert.equal(合同.tabletAssetDelivery.assetCount, 20);
  assert.equal(合同.tabletAssetDelivery.directOriginalReviewCount, 10);
  assert.equal(合同.tabletAssetDelivery.byteIdenticalInheritedReviewCount, 10);
  assert.equal(合同.tabletAssetDelivery.unexpectedDuplicateCount, 0);
});

test('V2历史锁具闭环仍保留为设计证据，正式运行以V4状态机为准', () => {
  assert.deepEqual(
    合同.chastityLifecycle.map(项 => 项.state),
    [
      'locked',
      'opening-playing-locked',
      'authorized',
      'self-unlocked',
      'full-tape-playing',
      'husband-completed',
      'self-relocked',
      'visually-verified',
      'settled',
    ],
  );
  assert.ok(合同.chastityLifecycle.every(项 => 项.required === true));
  assert.equal(合同.sequenceGuards.sequence1RequiresLocked, true);
  assert.equal(合同.sequenceGuards.sequence2RequiresSelfUnlocked, true);
  assert.equal(合同.sequenceGuards.sequences2Through10MustBeContiguous, true);
  assert.equal(合同.sequenceGuards.completionRequiresSequence10, true);
  assert.equal(合同.sequenceGuards.settlementRequiresRelockAndVerification, true);
  assert.equal(合同.sequenceGuards.companionPhysicalContactForbidden, true);
  assert.match(合同.interruptionPolicy.afterUnlockBeforeSettlement, /require-relock-and-verification/u);
});

test('V2旧素材不得删除或重编码：平板与外层副本继续按字节闭合', () => {
  const 平板安装 = JSON.parse(readFileSync(path.join(平板项目目录, 'product-install.json'), 'utf8'));
  const 平板审核 = JSON.parse(readFileSync(path.join(平板项目目录, 'reviews/composite-original-reviews.json'), 'utf8'));
  const 外层安装 = JSON.parse(readFileSync(path.join(外层项目目录, 'product-install.json'), 'utf8'));
  const 外层清单 = JSON.parse(readFileSync(path.join(外层项目目录, 'final-manifest.json'), 'utf8'));
  const 外层计划 = JSON.parse(readFileSync(path.join(外层项目目录, 'plan.json'), 'utf8'));

  assert.equal(平板安装.fileCount, 20);
  assert.equal(平板审核.acceptedCount, 20);
  assert.equal(平板审核.directOriginalReviewCount, 10);
  assert.equal(平板审核.byteIdenticalInheritedReviewCount, 10);
  assert.equal(外层安装.count, 18);
  assert.equal(外层清单.counts.accepted, 18);
  assert.equal(外层清单.counts.rejectedPixelsUsed, 0);
  assert.equal(
    外层清单.storyContractStatusAtMaterialization,
    'tablet-assets-accepted-runtime-not-switched-outer-shots-incomplete',
  );
  assert.equal(
    外层清单.storyContractSha256AtMaterialization,
    '4AFBD36394E06F18900B3EFB393D28A881D596293116478AD90875FE9DB06313',
  );
  assert.equal(sha256(path.join(仓库根, 外层安装.sourceManifest)), 外层安装.sourceManifestSha256);
  assert.equal(
    sha256(path.join(仓库根, 合同.outerAssetDelivery.finalManifest.path)),
    合同.outerAssetDelivery.finalManifest.sha256,
  );
  assert.equal(
    sha256(path.join(仓库根, 合同.outerAssetDelivery.productInstall.path)),
    合同.outerAssetDelivery.productInstall.sha256,
  );
  assert.equal(外层计划.shots.length, 18);
  assert.ok(外层计划.shots.every(镜头 => 镜头.provider === (镜头.adultExplicit ? 'local_comfyui' : 'builtin')));

  assert.deepEqual(
    readdirSync(产品目录)
      .filter(文件 => /^SCREEN-V2-.*\.png$/u.test(文件))
      .sort(),
    平板安装.files.map(项 => `${项.id}.png`).sort(),
  );
  assert.deepEqual(
    readdirSync(path.join(产品目录, 'outer'))
      .filter(文件 => 文件.endsWith('.png'))
      .sort(),
    外层安装.entries.map(项 => `${项.id}.png`).sort(),
  );

  for (const 项 of 平板安装.files) {
    assert.equal(sha256(path.join(仓库根, 项.source)), 项.sha256);
    assert.equal(sha256(path.join(仓库根, 项.destination)), 项.sha256);
    assert.equal(项.copiedWithoutReencoding, true);
  }
  for (const 项 of 外层清单.records) {
    const 溯源路径 = path.join(仓库根, 项.sourceProvenance);
    const 溯源 = JSON.parse(readFileSync(溯源路径, 'utf8'));
    assert.equal(sha256(path.join(仓库根, 项.source)), 项.sourceSha256);
    assert.equal(sha256(path.join(仓库根, 项.installed)), 项.sourceSha256);
    assert.equal(sha256(溯源路径), 项.sourceProvenanceSha256);
    assert.equal(溯源.id, 项.id);
    assert.equal(溯源.usesRejectedPixels, false);
    assert.equal(溯源.output.sha256, 项.sourceSha256);
    assert.equal(溯源.verdict, 'pass');
  }
});

test('V2运行交付字段只保留当时快照；顶层生产锁关闭，V4成为唯一最终效果', () => {
  assert.equal(合同.runtimeDelivery.status, 'formal-v2-enabled-legacy-v1-isolated');
  assert.equal(合同.runtimeDelivery.sceneId, '录像带双承接');
  assert.equal(合同.runtimeDelivery.storySections, 6);
  assert.deepEqual(合同.runtimeDelivery.storySectionFrameCounts, [8, 6, 4, 8, 6, 6]);
  assert.equal(合同.runtimeDelivery.totalFrames, 38);
  assert.deepEqual(合同.runtimeDelivery.perRoom, { tabletFrames: 10, outerFrames: 9, interleavedNodes: 19 });
  assert.equal(合同.runtimeDelivery.completionId, '录像带结局');
  assert.equal(合同.runtimeDelivery.inGameEntry.wired, true);
  assert.equal(合同.runtimeDelivery.inGameEntry.legacyHeldTicketOnly, true);
  assert.equal(合同.runtimeDelivery.inGameEntry.newSaveLegacyShopExposure, false);
  assert.equal(合同.runtimeDelivery.inGameEntry.startBeforeInventoryConsumption, true);
  assert.equal(合同.runtimeDelivery.legacyCompatibility.keptIsolated, true);
  assert.equal(合同.runtimeDelivery.legacyCompatibility.alreadyRunningLegacySceneRemainsLegacy, true);
  assert.equal(合同.runtimeDelivery.legacyCompatibility.legacyGoodsHiddenFromNewSaves, true);
  assert.equal(合同.runtimeDelivery.commitBeforeRender, true);
  assert.equal(合同.runtimeDelivery.atomicStorySectionRollback, true);
  assert.equal(合同.runtimeDelivery.queuedConsumer.deduplicatedFifo, true);
  assert.equal(合同.runtimeDelivery.queuedConsumer.imageErrorAdvancesWithoutStateMutation, true);
  assert.equal(sha256(path.join(仓库根, 合同.runtimeDelivery.diagnostic.path)), 合同.runtimeDelivery.diagnostic.sha256);
  assert.deepEqual(合同.validation.relatedRegression, { testFiles: 8, tests: 60, passed: 60, failed: 0 });
  assert.equal(合同.validation.targetedTypeScript, 'passed');
  assert.equal(合同.validation.targetedEslint, 'passed');
  assert.equal(合同.validation.isolatedProductionBuild.status, 'passed');
  assert.equal(合同.validation.isolatedProductionBuild.officialDistChanged, false);
  assert.equal(
    合同.validation.isolatedProductionBuild.officialDistSha256Before,
    合同.validation.isolatedProductionBuild.officialDistSha256After,
  );
  assert.equal(
    合同.validation.isolatedProductionBuild.repositoryGeneratedSideEffectSha256Before,
    合同.validation.isolatedProductionBuild.repositoryGeneratedSideEffectSha256After,
  );

  const V4状态 = readFileSync(V4状态路径, 'utf8');
  const V4运行时 = readFileSync(V4运行时路径, 'utf8');
  const V4客户端 = readFileSync(V4客户端路径, 'utf8');
  assert.match(V4状态, /录像带V4路线ID = '丈夫结局:录像带V4'/u);
  assert.match(V4状态, /目标幕次 = 场景\.共享幕次 \+ 1/u, '切房与下一幕都必须推进共享V4幕次');
  assert.match(V4运行时, /录像带V4候选图片地址/u);
  assert.match(V4客户端, /useVideoTapeV4/u);
  assert.match(V4客户端, /录像带V4监控就绪/u);
});

test('V2分镜与解析器只保留历史兼容，不得重新冒充最终路线', () => {
  const 分镜 = readFileSync(分镜路径, 'utf8');
  const 旧试播说明 = readFileSync(旧试播说明路径, 'utf8');
  const 当前资源 = readFileSync(当前资源路径, 'utf8');

  assert.match(分镜, /锁仍锁着 → 播放妻子片头 → 宣读条件并明确接受 → 丈夫本人解锁/u);
  assert.match(分镜, /SCREEN-V2-102-01…10/u);
  assert.match(分镜, /不得再从 02 直接跳到 06/u);
  assert.match(旧试播说明, /五格高光试播版.*不是完整母带故事/u);
  assert.match(当前资源, /录像带双承接序号 = 1 \| 2 \| 3 \| 4 \| 5/u);
  assert.match(当前资源, /录像带双承接正式版本 = 2/u);
  assert.match(当前资源, /SCREEN-V2-/u);
  assert.match(当前资源, /OUTER-V2-/u);
  assert.match(当前资源, /值\.版本 === undefined/u);
  assert.match(当前资源, /值\.版本 !== 录像带双承接正式版本/u);

  const V4状态 = readFileSync(V4状态路径, 'utf8');
  assert.match(V4状态, /录像带V4版本 = 4/u);
  assert.match(V4状态, /录像带V4完成ID = '录像带结局'/u);
  assert.doesNotMatch(V4状态, /丈夫结局:录像带双承接/u, 'V4正式路线不得复用旧V2路线ID');
});
