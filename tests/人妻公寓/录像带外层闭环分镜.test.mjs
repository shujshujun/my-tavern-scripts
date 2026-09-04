/* eslint-disable import-x/no-nodejs-modules -- Node-only narrative contract test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const 计划路径 = path.join(
  仓库根,
  'output/imagegen/video-tape-ending/outer-lifecycle-v2/plan.json',
);
const 计划 = JSON.parse(readFileSync(计划路径, 'utf8'));

const 期望族 = [
  'LOCKED',
  'AUTHORIZATION',
  'SELF-UNLOCK',
  'VIEW-EARLY',
  'VIEW-ESCALATION',
  'SELF-COMPLETION',
  'SELF-RELOCK',
  'VISUAL-VERIFICATION',
  'HANDOFF',
];

test('每户外层严格九镜并形成锁状态闭环', () => {
  assert.equal(计划.schemaVersion, 'rqgy-vtr-outer-lifecycle-plan-v2');
  assert.equal(计划.shots.length, 18);
  for (const 房间 of ['102', '202']) {
    const 镜头 = 计划.shots.filter(项 => 项.room === 房间).sort((a, b) => a.order - b.order);
    assert.equal(镜头.length, 9);
    assert.deepEqual(
      镜头.map(项 => 项.order),
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );
    assert.deepEqual(
      镜头.map(项 => 项.family),
      期望族,
    );
    assert.deepEqual(
      镜头.map(项 => 项.stateAfter),
      [
        'locked',
        'authorized',
        'self-unlocked',
        'viewing-sequences-2-to-4',
        'viewing-sequences-5-to-9',
        'husband-completed',
        'self-relocked',
        'visually-verified',
        'settled',
      ],
    );
  }
});

test('普通镜只走内置模型，锁具可见或露骨镜只走本地模型', () => {
  const 普通 = 计划.shots.filter(项 => 项.provider === 'builtin');
  const 本地 = 计划.shots.filter(项 => 项.provider === 'local_comfyui');
  assert.equal(普通.length, 6);
  assert.equal(本地.length, 12);
  assert.ok(普通.every(项 => 项.adultExplicit === false && typeof 项.ordinaryPrompt === 'string'));
  assert.ok(本地.every(项 => 项.adultExplicit === true && /^VTR-OUT-\d{3}$/u.test(项.localTaskId)));
  assert.equal(new Set(本地.map(项 => 项.localTaskId)).size, 12);
  assert.deepEqual(
    [...new Set(普通.map(项 => 项.family))].sort(),
    ['AUTHORIZATION', 'HANDOFF', 'VIEW-EARLY'].sort(),
  );
});

test('本人解锁、本人完成、本人复锁、无接触目视核验均为硬门', () => {
  assert.equal(计划.sequenceGuards.authorizationBeforeSelfUnlock, true);
  assert.equal(计划.sequenceGuards.selfUnlockBeforeSequence2, true);
  assert.equal(计划.sequenceGuards.completionRequiresTabletSequence10, true);
  assert.equal(计划.sequenceGuards.selfRelockAfterCleanup, true);
  assert.equal(计划.sequenceGuards.verificationIsVisualAndNoContact, true);
  assert.equal(计划.sequenceGuards.handoffRequiresRelockAndVerification, true);
  for (const 房间 of ['102', '202']) {
    const 核验 = 计划.shots.find(项 => 项.room === 房间 && 项.family === 'VISUAL-VERIFICATION');
    assert.match(核验.narrativeFunction, /目视/u);
    assert.match(核验.composition, /双手背在身后/u);
    assert.match(核验.composition, /空隙/u);
  }
});

test('102回执与202钥匙交接保持不对称，旧五格镜表不得复用', () => {
  const 一零二 = 计划.shots.find(项 => 项.id === 'OUTER-V2-102-09-HANDOFF');
  const 二零二 = 计划.shots.find(项 => 项.id === 'OUTER-V2-202-09-HANDOFF');
  assert.match(一零二.narrativeFunction, /书面回执/u);
  assert.match(二零二.narrativeFunction, /住户钥匙/u);
  assert.equal(计划.legacyShotlist.productionAllowed, false);
  assert.equal(计划.legacyShotlist.acceptedReusableAssetCount, 0);
});
