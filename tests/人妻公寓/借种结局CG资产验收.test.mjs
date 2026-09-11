/* eslint-disable import-x/no-nodejs-modules -- Node-only asset contract test */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const 证据根 = process.env.RQGY_CG_EVIDENCE_ROOT ? path.resolve(process.env.RQGY_CG_EVIDENCE_ROOT) : 仓库根;
const 产品目录 = path.join(证据根, 'output/imagegen/borrow-seed-ending/final');
const 成人项目目录 = path.join(证据根, 'output/imagegen/rqgy-reset/adult-completion/borrow-seed-ending');
const 父级目录 = path.join(证据根, 'output/imagegen/rqgy-reset/adult-completion');

const 非敏感 = [
  '借种_101三人赴约.webp',
  '借种_阳性结果.webp',
  '借种_三人镜面合照.webp',
  '借种_三人产检.webp',
  '借种_医院待产三人.webp',
  '借种_产后家庭合照.webp',
  '101_借种结局计划板.webp',
].sort();
const 成人 = [
  '借种_成人_正式入室.webp',
  '借种_成人_主动接受.webp',
  '借种_成人_前戏.webp',
  '借种_成人_正面交合.webp',
  '借种_成人_确定受孕收尾.webp',
  '借种_成人_事后照料.webp',
  '借种_成人_回到客厅.webp',
].sort();

function sha256(文件) {
  return createHash('sha256').update(readFileSync(文件)).digest('hex').toUpperCase();
}

function webpSize(bytes) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
  const kind = bytes.subarray(12, 16).toString('ascii');
  if (kind === 'VP8X') {
    return [
      1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    ];
  }
  if (kind === 'VP8L') {
    assert.equal(bytes[20], 0x2f);
    return [
      1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    ];
  }
  const marker = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
  assert.notEqual(marker, -1, `无法解析${kind || '未知'} WebP尺寸`);
  return [bytes.readUInt16LE(marker + 3) & 0x3fff, bytes.readUInt16LE(marker + 5) & 0x3fff];
}

test('借种结局14张产品WebP、编号总表、历史父级封板与当前父级观察保持分层闭合', () => {
  const 实际 = readdirSync(产品目录)
    .filter(文件 => 文件.endsWith('.webp'))
    .sort();
  assert.deepEqual(实际, [...非敏感, ...成人].sort(), '产品目录不得缺图或残留孤儿WebP');
  for (const 文件 of 实际) {
    const 路径 = `${产品目录}/${文件}`;
    assert.ok(statSync(路径).size > 100_000, `${文件}不应是空占位`);
    const bytes = readFileSync(路径);
    assert.deepEqual(webpSize(bytes), 非敏感.includes(文件) ? [1536, 1024] : [1536, 2304]);
  }

  const 清单 = JSON.parse(readFileSync(`${证据根}/output/imagegen/borrow-seed-ending/manifest.json`, 'utf8'));
  assert.equal(清单.nonSensitive.status, 'complete_reviewed_and_converted');
  assert.deepEqual([...清单.nonSensitive.approved].sort(), 非敏感);
  assert.deepEqual([...清单.adult.approved].sort(), 成人);
  const 非敏感总表 = JSON.parse(
    readFileSync(`${证据根}/output/imagegen/borrow-seed-ending/${清单.nonSensitive.taskLedger}`, 'utf8'),
  );
  assert.equal(非敏感总表.status, 'complete_reviewed_and_converted_2026-08-21');
  assert.deepEqual(
    非敏感总表.tasks.map(任务 => 任务.file).sort(),
    非敏感,
  );
  for (const 任务 of 非敏感总表.tasks) {
    assert.equal(任务.review, 'accepted_target_achieved');
    assert.equal(sha256(`${产品目录}/${任务.file}`), 任务.sha256);
  }

  const 总表 = JSON.parse(readFileSync(`${成人项目目录}/tasks-7.json`, 'utf8'));
  assert.equal(总表.tasks.length, 7);
  assert.deepEqual(
    总表.tasks.map(任务 => 任务.id),
    Array.from({ length: 7 }, (_, 索引) => `BSE-ADULT-${String(索引 + 1).padStart(3, '0')}`),
  );
  for (const 任务 of 总表.tasks) {
    assert.equal(任务.artifacts.length, 1);
    const artifact = 任务.artifacts[0];
    assert.equal(sha256(`${成人项目目录}/${artifact.path}`), artifact.sha256);
    assert.equal(sha256(`${证据根}/${artifact.productPath}`), artifact.productSha256);
  }

  const 父级封板 = 总表.scope.parentSeal;
  assert.equal(父级封板.semantics, 'historical_adoption_snapshot');
  assert.equal(父级封板.capturedAt, 总表.createdAt);
  assert.equal(父级封板.unchangedByAdoption, true);
  assert.match(父级封板.currentTaskSha256, /^[A-F0-9]{64}$/u);
  assert.match(父级封板.masterSha256, /^[A-F0-9]{64}$/u);

  const 当前观察 = 总表.scope.parentCurrentObservation;
  const 当前父级总表 = JSON.parse(readFileSync(`${父级目录}/tasks-1050.json`, 'utf8'));
  assert.equal(sha256(`${父级目录}/CURRENT_TASK.md`), 当前观察.currentTaskSha256);
  assert.equal(sha256(`${父级目录}/tasks-1050.json`), 当前观察.masterSha256);
  assert.equal(当前观察.masterUpdatedAt, 当前父级总表.updatedAt);
  assert.equal(当前观察.masterTaskCount, 当前父级总表.tasks.length);
  assert.deepEqual(
    当前观察.postAdoptionTaskIds,
    当前父级总表.tasks.map(任务 => 任务.id).filter(id => id.startsWith('VTR-109-')),
  );
  assert.equal(当前观察.differsFromAdoptionSnapshot, 当前观察.masterSha256 !== 父级封板.masterSha256);
  assert.equal(当前观察.borrowSeedAssetsUnaffected, true);
  assert.equal(
    statSync(`${成人项目目录}/${当前观察.auditReport}`).isFile(),
    true,
    '父级版本语义修复与14图复核报告必须存在',
  );
});
