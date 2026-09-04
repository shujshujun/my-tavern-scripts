/* eslint-disable import-x/no-nodejs-modules -- Node-only asset retirement regression */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const V4清单 = JSON.parse(
  readFileSync(path.join(仓库根, 'src/人妻公寓/生产契约/录像带V4/final-candidates-manifest-v2.json'), 'utf8'),
);
const V4产品清单 = JSON.parse(
  readFileSync(path.join(仓库根, 'src/人妻公寓/素材/特殊场景/录像带V4/录像带V4CG.manifest.json'), 'utf8'),
);
const V4运行时 = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');

test('Git产品树只保留V4 WebP视觉入口，v1/v2产品副本全部退场', () => {
  assert.equal(existsSync(path.join(仓库根, 'src/人妻公寓/素材/丈夫结局/录像带')), false);
  assert.equal(existsSync(path.join(仓库根, 'src/人妻公寓/素材/特殊场景/录像带V4')), true);
  assert.equal(existsSync(path.join(仓库根, 'src/人妻公寓/界面/客户端/录像带双承接平板资源.ts')), false);
  assert.equal(existsSync(path.join(仓库根, 'src/人妻公寓/脚本/游戏逻辑/录像带双承接CG路由.ts')), false);
});

test('生产源码不存在旧视觉URL、载荷事件或客户端队列', () => {
  const 文件们 = [
    'src/人妻公寓/界面/客户端/App.vue',
    'src/人妻公寓/界面/客户端/assets.ts',
    'src/人妻公寓/脚本/游戏逻辑/index.ts',
    'src/人妻公寓/脚本/游戏逻辑/回合引擎.ts',
    'src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts',
  ];
  const 源码 = 文件们.map(文件 => readFileSync(path.join(仓库根, 文件), 'utf8')).join('\n');
  assert.doesNotMatch(源码, /人妻公寓:录像带双承接CG/u);
  assert.doesNotMatch(源码, /录像带双承接CG队列/u);
  assert.doesNotMatch(源码, /__RQGY_VTR_ENDING_ASSET_BASE__/u);
  assert.doesNotMatch(源码, /SCREEN-V2-|OUTER-V2-/u);
});

test('V4候选证据、用户确认、WebP产品与唯一图片地址协议保持完整', () => {
  assert.equal(V4清单.records.length, 38);
  assert.equal(V4清单.formalAccepted, true);
  assert.equal(V4清单.installed, true);
  assert.equal(V4清单.productionUnlocked, false);
  assert.equal(V4产品清单.status, 'product-webp-ready-awaiting-external-publish');
  assert.equal(V4产品清单.items.length, 38);
  const 产品 = V4产品清单.items[0];
  assert.equal(path.extname(产品.productFile), '.webp');
  assert.equal(
    V4运行时.录像带V4产品图片地址(产品, 'https://assets.example.test/vtr-v4/'),
    `https://assets.example.test/vtr-v4/${产品.productFile}`,
  );
  assert.equal(V4运行时.录像带V4产品图片地址(undefined, 'https://assets.example.test/vtr-v4'), '');
});
