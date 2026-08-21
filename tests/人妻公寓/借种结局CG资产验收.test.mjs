/* eslint-disable import-x/no-nodejs-modules -- Node-only asset contract test */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const 产品目录 = fileURLToPath(new URL('../../output/imagegen/borrow-seed-ending/final/', import.meta.url));
const 成人项目目录 = fileURLToPath(
  new URL('../../output/imagegen/rqgy-reset/adult-completion/borrow-seed-ending/', import.meta.url),
);
const 父级目录 = fileURLToPath(new URL('../../output/imagegen/rqgy-reset/adult-completion/', import.meta.url));

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

test('借种结局14张产品WebP、编号总表与父级封板保持双向闭合', () => {
  const 实际 = readdirSync(产品目录)
    .filter(文件 => 文件.endsWith('.webp'))
    .sort();
  assert.deepEqual(实际, [...非敏感, ...成人].sort(), '产品目录不得缺图或残留孤儿WebP');
  for (const 文件 of 实际) {
    const 路径 = `${产品目录}/${文件}`;
    assert.ok(statSync(路径).size > 100_000, `${文件}不应是空占位`);
    const 头 = readFileSync(路径).subarray(0, 12);
    assert.equal(头.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(头.subarray(8, 12).toString('ascii'), 'WEBP');
  }

  const 清单 = JSON.parse(readFileSync(`${仓库根}/output/imagegen/borrow-seed-ending/manifest.json`, 'utf8'));
  assert.equal(清单.nonSensitive.status, 'complete_reviewed_and_converted');
  assert.deepEqual([...清单.nonSensitive.approved].sort(), 非敏感);
  assert.deepEqual([...清单.adult.approved].sort(), 成人);

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
    assert.equal(sha256(`${仓库根}/${artifact.productPath}`), artifact.productSha256);
  }

  const 父级封板 = 总表.scope.parentSeal;
  assert.equal(sha256(`${父级目录}/CURRENT_TASK.md`), 父级封板.currentTaskSha256);
  assert.equal(sha256(`${父级目录}/tasks-1050.json`), 父级封板.masterSha256);
});
