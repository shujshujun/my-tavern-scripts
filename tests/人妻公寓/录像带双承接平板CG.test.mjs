/* eslint-disable import-x/no-nodejs-modules -- Node-only asset and route contract test */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
globalThis.__RQGY_VTR_ENDING_ASSET_BASE__ = 'https://assets.example.test/vtr-ending';

const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const 产品目录 = path.join(仓库根, 'src/人妻公寓/素材/丈夫结局/录像带');
const 项目目录 = path.join(仓库根, 'output/imagegen/video-tape-ending/tablet-localization-v1');
const {
  录像带双承接路线ID,
  录像带双承接平板轨道,
  录像带双承接正式平板轨道,
  录像带双承接正式外层轨道,
  解析录像带双承接CG载荷,
  录像带双承接平板帧地址,
  录像带双承接帧地址,
} = require('../../src/人妻公寓/界面/客户端/录像带双承接平板资源.ts');
const {
  录像带双承接CG路线ID,
  创建录像带双承接CG载荷,
  创建录像带双承接CG正式载荷,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带双承接CG路由.ts');

function sha256(文件) {
  return createHash('sha256').update(readFileSync(文件)).digest('hex').toUpperCase();
}

test('十张平板成品、审核清单与产品副本按字节双向闭合', () => {
  const 审核 = JSON.parse(readFileSync(path.join(项目目录, 'reviews/composite-original-reviews.json'), 'utf8'));
  const 期望 = 审核.composites.map(项 => `${项.id}.png`).sort();
  assert.equal(审核.schemaVersion, 'vtr-tablet-composite-original-review-v1');
  assert.equal(审核.composites.length, 10);
  assert.deepEqual(
    readdirSync(产品目录)
      .filter(文件 => 文件.endsWith('.png'))
      .sort(),
    期望,
  );
  for (const 项 of 审核.composites) {
    const 合成图 = path.join(项目目录, 'composites', `${项.id}.png`);
    const 产品图 = path.join(产品目录, `${项.id}.png`);
    const 溯源 = JSON.parse(readFileSync(path.join(项目目录, 'composites', `${项.id}.provenance.json`), 'utf8'));
    assert.equal(sha256(合成图), 项.outputSha256);
    assert.equal(sha256(产品图), 项.outputSha256, `${项.id}产品副本不得转码或改字节`);
    assert.equal(溯源.verdict, 'accepted_original_review');
    assert.equal(溯源.outputSha256, 项.outputSha256);
    assert.equal(溯源.originalReview.decision, 'accepted');
    assert.equal(溯源.originalReview.imageDetail, 'original');
    assert.doesNotMatch(溯源.source, /(?:PZX-|PSJY-|pregnancy|怀孕|妊娠)/iu);
  }
});

test('新路线只接受102沈静仪盘与202周小满盘的五格合法载荷', () => {
  assert.equal(录像带双承接路线ID, '丈夫结局:录像带双承接');
  assert.equal(录像带双承接CG路线ID, 录像带双承接路线ID, '脚本生产者与客户端消费者不得漂移成两条路线');
  assert.equal(录像带双承接平板轨道.length, 10);
  assert.equal(new Set(录像带双承接平板轨道.map(帧 => 帧.id)).size, 10);
  for (const 帧 of 录像带双承接平板轨道) {
    assert.equal(解析录像带双承接CG载荷({ 路线: 录像带双承接路线ID, 房间: 帧.房间, 序号: 帧.序号 }), 帧);
    assert.equal(帧.房间 === '102', 帧.来源镜头.startsWith('TAPE-SJY-'));
    assert.equal(帧.房间 === '202', 帧.来源镜头.startsWith('TAPE-ZXM-'));
    assert.equal(帧.成人画面, 帧.序号 !== 1);
    assert.equal(帧.提供方, 帧.序号 === 1 ? 'builtin' : 'local-deterministic-composite');
    assert.equal(录像带双承接平板帧地址(帧), `https://assets.example.test/vtr-ending/${帧.id}.png`);
  }
  assert.equal(解析录像带双承接CG载荷({ 路线: '录像带', 房间: '102', 序号: 1 }), null);
  assert.equal(解析录像带双承接CG载荷({ 路线: 录像带双承接路线ID, 房间: '202', 序号: 6 }), null);
  assert.equal(解析录像带双承接CG载荷({ 路线: 录像带双承接路线ID, 房间: '302', 序号: 1 }), null);
  assert.deepEqual(创建录像带双承接CG载荷('202', 5), {
    路线: 录像带双承接路线ID,
    房间: '202',
    序号: 5,
  });
});

test('正式 v2 消费每户十拍平板与九拍外层，文件地址进入版本隔离目录', () => {
  assert.equal(录像带双承接正式平板轨道.length, 20);
  assert.equal(录像带双承接正式外层轨道.length, 18);
  assert.equal(new Set([...录像带双承接正式平板轨道, ...录像带双承接正式外层轨道].map(帧 => 帧.id)).size, 38);
  for (const 帧 of 录像带双承接正式平板轨道) {
    const 载荷 = 创建录像带双承接CG正式载荷(帧.房间, { 轨道: '平板', 序号: 帧.序号 });
    assert.equal(解析录像带双承接CG载荷(载荷), 帧);
    assert.equal(录像带双承接帧地址(帧), `https://assets.example.test/vtr-ending/v2/${帧.id}.png`);
  }
  for (const 帧 of 录像带双承接正式外层轨道) {
    const 载荷 = 创建录像带双承接CG正式载荷(帧.房间, { 轨道: '外层', 序号: 帧.序号 });
    assert.equal(解析录像带双承接CG载荷(载荷), 帧);
    assert.equal(录像带双承接帧地址(帧), `https://assets.example.test/vtr-ending/v2/outer/${帧.id}.png`);
  }
  assert.equal(解析录像带双承接CG载荷({ 路线: 录像带双承接路线ID, 版本: 2, 房间: '102', 序号: 3 }), null);
  assert.equal(
    解析录像带双承接CG载荷({ 路线: 录像带双承接路线ID, 版本: 2, 房间: '102', 轨道: '外层', 序号: 10 }),
    null,
  );
  assert.equal(解析录像带双承接CG载荷({ 路线: 录像带双承接路线ID, 版本: 1, 房间: '102', 序号: 3 }), null);
});

test('App按到达顺序排队消费正式事件，旧录像带舞台继续不认识SCREEN轨道', () => {
  const App = readFileSync(path.join(仓库根, 'src/人妻公寓/界面/客户端/App.vue'), 'utf8');
  const 旧舞台 = readFileSync(path.join(仓库根, 'src/人妻公寓/界面/客户端/components/录像带舞台.vue'), 'utf8');
  const 旧状态 = readFileSync(path.join(仓库根, 'src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts'), 'utf8');
  assert.match(App, /eventOn\('人妻公寓:录像带双承接CG'[\s\S]{0,500}解析录像带双承接CG载荷/u);
  assert.match(App, /来源 === '录像带双承接'[\s\S]{0,100}录像带双承接图片/u);
  assert.match(App, /显示录像带双承接CG\(帧\.文件, 帧\.标题\)/u);
  assert.match(App, /录像带双承接CG队列\.value\.push\(载荷\)/u);
  assert.match(App, /当前家庭计划CG\.value = 录像带双承接CG队列\.value\.shift\(\) \?\? null/u);
  assert.doesNotMatch(旧舞台, /SCREEN-(?:102|202)/u);
  assert.match(旧状态, /场\.id === '录像带'/u);
  assert.match(旧状态, /录像带双承接场景ID/u);
  assert.doesNotMatch(旧状态, /id: '丈夫结局:录像带双承接'/u);
});
