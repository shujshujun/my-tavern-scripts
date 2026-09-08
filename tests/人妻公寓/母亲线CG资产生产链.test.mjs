/* eslint-disable import-x/no-nodejs-modules -- Node-only product asset contract test */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import lodash from 'lodash';

globalThis._ = lodash;
delete globalThis.__RQGY_MOTHER_VIDEO_CALL_ASSET_BASE__;
delete globalThis.__RQGY_MOTHER_LINE_STORY_ASSET_BASE__;
delete globalThis.__RQGY_STORY_EVENT_ASSET_BASE__;
delete globalThis.__RQGY_XMJ_201_ASSET_BASE__;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const 视频产品根 = fileURLToPath(
  new URL(
    '../../output/imagegen/rqgy-reset/adult-completion/mother-video-call-sequence/product-v1/cg1/mother-video-call/',
    import.meta.url,
  ),
);
const 视频清单路径 = fileURLToPath(
  new URL(
    '../../output/imagegen/rqgy-reset/adult-completion/mother-video-call-sequence/product-v1/mother-video-call.manifest.json',
    import.meta.url,
  ),
);
const 视频源映射路径 = fileURLToPath(
  new URL(
    '../../output/imagegen/rqgy-reset/adult-completion/mother-video-call-sequence/product-v1/source-map.json',
    import.meta.url,
  ),
);
const 静态清单路径 = fileURLToPath(new URL('../../src/人妻公寓/素材/特殊场景/母亲线剧情CG.manifest.json', import.meta.url));
const 视频语义源码路径 = fileURLToPath(new URL('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts', import.meta.url));
const 客户端资产源码路径 = fileURLToPath(new URL('../../src/人妻公寓/界面/客户端/assets.ts', import.meta.url));
const 小手机资源源码路径 = fileURLToPath(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/母亲视频通话资源.ts', import.meta.url),
);

const { 母亲视频通话全部CG } = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts');
const 共同视频资源 = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话资源.ts');
const 小手机视频资源 = require('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/母亲视频通话资源.ts');
const 客户端资源 = require('../../src/人妻公寓/界面/客户端/assets.ts');
const { 回国全部剧情CGID } = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');
const { 双重继承全部剧情CGID } = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');

function sha256(路径) {
  return createHash('sha256').update(readFileSync(路径)).digest('hex');
}

function 读UInt24LE(缓冲, 偏移) {
  return 缓冲[偏移] | (缓冲[偏移 + 1] << 8) | (缓冲[偏移 + 2] << 16);
}

function 读取WebP尺寸(路径) {
  const 数据 = readFileSync(路径);
  assert.equal(数据.subarray(0, 4).toString('ascii'), 'RIFF', `${路径}不是RIFF`);
  assert.equal(数据.subarray(8, 12).toString('ascii'), 'WEBP', `${路径}不是WebP`);
  let 偏移 = 12;
  while (偏移 + 8 <= 数据.length) {
    const 类型 = 数据.subarray(偏移, 偏移 + 4).toString('ascii');
    const 大小 = 数据.readUInt32LE(偏移 + 4);
    const 内容 = 偏移 + 8;
    if (类型 === 'VP8X') {
      return { 宽: 读UInt24LE(数据, 内容 + 4) + 1, 高: 读UInt24LE(数据, 内容 + 7) + 1 };
    }
    if (类型 === 'VP8 ') {
      assert.equal(数据.subarray(内容 + 3, 内容 + 6).toString('hex'), '9d012a', `${路径}的VP8帧头无效`);
      return { 宽: 数据.readUInt16LE(内容 + 6) & 0x3fff, 高: 数据.readUInt16LE(内容 + 8) & 0x3fff };
    }
    if (类型 === 'VP8L') {
      assert.equal(数据[内容], 0x2f, `${路径}的VP8L签名无效`);
      const 位 = 数据.readUInt32LE(内容 + 1);
      return { 宽: (位 & 0x3fff) + 1, 高: ((位 >>> 14) & 0x3fff) + 1 };
    }
    偏移 = 内容 + 大小 + (大小 % 2);
  }
  assert.fail(`${路径}没有可解析的WebP图像块`);
}

function 排序(值) {
  return [...值].sort((左, 右) => 左.localeCompare(右, 'zh-CN'));
}

test('母亲视频54个运行ID、build-only源映射、产品WebP和manifest保持四向一一闭合', () => {
  const 运行ID = 母亲视频通话全部CG.map(CG => CG.id);
  assert.equal(运行ID.length, 54);
  assert.equal(new Set(运行ID).size, 54, '运行ID不得重复');

  const 源映射 = JSON.parse(readFileSync(视频源映射路径, 'utf8'));
  assert.equal(源映射.entries.length, 54);
  assert.deepEqual(源映射.entries.map(条目 => 条目.id), 运行ID, '源映射必须保持运行拓扑顺序');
  assert.equal(new Set(源映射.entries.map(条目 => 条目.sourceFile)).size, 54, '每个运行ID必须拥有唯一物理源文件');
  for (const 条目 of 源映射.entries) {
    assert.equal(existsSync(`${仓库根}/${条目.sourceFile}`), true, `${条目.id}的获批源文件不存在`);
    assert.match(条目.sourceFile, /^output\/imagegen\/rqgy-reset\/adult-completion\//);
  }

  const 清单 = JSON.parse(readFileSync(视频清单路径, 'utf8'));
  assert.equal(清单.runtimeCount, 54);
  assert.equal(清单.entries.length, 54);
  assert.equal(清单.publishTarget.repository, 'shujun8520-design/qgy-assets');
  assert.equal(清单.publishTarget.path, 'cg1/mother-video-call');
  assert.equal(清单.publishTarget.status, 'pending_immutable_tag_not_published');
  assert.deepEqual(清单.entries.map(条目 => 条目.id), 运行ID);
  assert.deepEqual(
    清单.entries.map(条目 => ({ id: 条目.id, sourceFile: 条目.sourceFile })),
    源映射.entries,
  );

  const 产品文件 = readdirSync(视频产品根).filter(文件 => 文件.endsWith('.webp'));
  assert.deepEqual(排序(产品文件), 排序(运行ID.map(id => `${id}.webp`)), '产品目录不得缺图或残留孤儿WebP');
  for (const 条目 of 清单.entries) {
    const 路径 = `${仓库根}/${条目.productFile}`;
    assert.equal(existsSync(路径), true);
    assert.equal(statSync(路径).size, 条目.productBytes);
    assert.ok(条目.productBytes > 100_000, `${条目.id}不应是空占位`);
    assert.equal(sha256(路径), 条目.productSha256);
    assert.deepEqual(读取WebP尺寸(路径), { 宽: 1536, 高: 2304 });
    assert.equal(条目.productWidth, 1536);
    assert.equal(条目.productHeight, 2304);
    const 源路径 = `${仓库根}/${条目.sourceFile}`;
    assert.equal(statSync(源路径).size, 条目.sourceBytes);
    assert.equal(sha256(源路径), 条目.sourceSha256);
  }
});

test('运行时不再携带本地候选路径，客户端与小手机共用同一视频资源函数和产品路径', () => {
  const 语义源码 = readFileSync(视频语义源码路径, 'utf8');
  const 客户端源码 = readFileSync(客户端资产源码路径, 'utf8');
  const 小手机源码 = readFileSync(小手机资源源码路径, 'utf8');
  assert.doesNotMatch(语义源码, /output\/imagegen|candidates-v2|源文件\s*:/);
  assert.doesNotMatch(客户端源码, /output\/imagegen\/rqgy-reset\/adult-completion\/mother-video-call/);
  assert.doesNotMatch(小手机源码, /output\/imagegen|candidates-v2/);
  assert.match(客户端源码, /from '\.\.\/\.\.\/脚本\/游戏逻辑\/母亲视频通话资源'/);
  assert.match(小手机源码, /from '\.\.\/\.\.\/母亲视频通话资源'/);

  assert.strictEqual(客户端资源.母亲视频通话CG图片, 共同视频资源.母亲视频通话CG图片);
  assert.strictEqual(小手机视频资源.母亲视频通话CG图片, 共同视频资源.母亲视频通话CG图片);
  assert.strictEqual(客户端资源.母亲视频通话CG产品相对路径, 共同视频资源.母亲视频通话CG产品相对路径);
  assert.strictEqual(小手机视频资源.母亲视频通话CG产品相对路径, 共同视频资源.母亲视频通话CG产品相对路径);

  for (const { id } of 母亲视频通话全部CG) {
    assert.equal(
      客户端资源.母亲视频通话CG产品相对路径(id),
      `cg1/mother-video-call/${encodeURIComponent(id)}.webp`,
    );
    assert.equal(客户端资源.母亲视频通话CG图片(id), `https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg5/cg1/mother-video-call/${encodeURIComponent(id)}.webp`);
    assert.equal(小手机视频资源.母亲视频通话CG图片(id), 客户端资源.母亲视频通话CG图片(id));
  }
  assert.equal(共同视频资源.母亲视频通话CG产品相对路径('不存在'), '');
  assert.equal(共同视频资源.母亲视频通话CG图片('不存在'), '');
});

test('视频默认生产配置锁定已发布cg5；可选覆盖只接受共同解析器且不回退main或output', () => {
  const 配置 = 共同视频资源.母亲视频通话素材发布配置;
  assert.equal(配置.仓库, 'shujun8520-design/qgy-assets');
  assert.equal(配置.不可变标签, 'cg5');
  assert.equal(配置.产品目录, 'cg1/mother-video-call');
  assert.equal(配置.状态, '已发布');
  assert.ok(共同视频资源.母亲视频通话待发布素材基址.length > 0, '待发布生产配置不得是空占位');
  assert.match(共同视频资源.母亲视频通话待发布素材基址, /qgy-assets@cg5\/cg1\/mother-video-call$/);
  assert.doesNotMatch(共同视频资源.母亲视频通话待发布素材基址, /@main(?:\/|$)|output\/imagegen/);

  globalThis.__RQGY_MOTHER_VIDEO_CALL_ASSET_BASE__ =
    'https://testingcf.jsdelivr.net/gh/example/assets@0123456789abcdef/cg1/mother-video-call/';
  try {
    const id = 母亲视频通话全部CG[0].id;
    const 期望 = `https://testingcf.jsdelivr.net/gh/example/assets@0123456789abcdef/cg1/mother-video-call/${encodeURIComponent(id)}.webp`;
    assert.equal(共同视频资源.母亲视频通话CG图片(id), 期望);
    assert.equal(客户端资源.母亲视频通话CG图片(id), 期望);
    assert.equal(小手机视频资源.母亲视频通话CG图片(id), 期望);
  } finally {
    delete globalThis.__RQGY_MOTHER_VIDEO_CALL_ASSET_BASE__;
  }
});

test('回国9张与双重继承11张代码映射、manifest和本地产品WebP双向闭合', () => {
  assert.equal(回国全部剧情CGID.length, 9);
  assert.equal(双重继承全部剧情CGID.length, 11);
  const 代码映射 = {
    回国: 排序(回国全部剧情CGID),
    双重继承: 排序(双重继承全部剧情CGID),
  };
  const 清单 = JSON.parse(readFileSync(静态清单路径, 'utf8'));
  assert.equal(清单.runtimeCount, 20);
  assert.equal(清单.entries.length, 20);
  assert.equal(清单.publishTarget.repository, 'shujshujun/my-tavern-scripts');
  assert.equal(清单.publishTarget.status, 'pending_immutable_tag_not_published');

  for (const 路线 of ['回国', '双重继承']) {
    const 清单ID = 排序(清单.entries.filter(条目 => 条目.route === 路线).map(条目 => 条目.id));
    assert.deepEqual(清单ID, 代码映射[路线]);
    const 目录 = `${仓库根}/src/人妻公寓/素材/特殊场景/${路线}`;
    const 实际文件 = 排序(readdirSync(目录).filter(文件 => 文件.endsWith('.webp')));
    assert.deepEqual(实际文件, 代码映射[路线].map(id => `${id}.webp`));
  }

  for (const 条目 of 清单.entries) {
    const 路径 = `${仓库根}/${条目.productFile}`;
    assert.equal(existsSync(路径), true);
    assert.equal(statSync(路径).size, 条目.bytes);
    assert.ok(条目.bytes > 100_000);
    assert.equal(sha256(路径), 条目.sha256);
    assert.deepEqual(读取WebP尺寸(路径), { 宽: 1536, 高: 1024 });
    assert.equal(条目.width, 1536);
    assert.equal(条目.height, 1024);
  }
});

test('母亲静态线拥有独立发布开关，201与第二机位各自保留独立基址', () => {
  const 母亲配置 = 客户端资源.母亲线剧情素材发布配置;
  assert.equal(母亲配置.不可变标签, 'cg5');
  assert.equal(母亲配置.状态, '已发布');
  assert.equal(母亲配置.manifest, '母亲线剧情CG.manifest.json');
  assert.notStrictEqual(母亲配置, 客户端资源.剧情事件素材发布配置);
  assert.notStrictEqual(母亲配置, 客户端资源.许曼君201素材发布配置);
  assert.equal(客户端资源.许曼君201素材发布配置.状态, '已发布');
  assert.ok(客户端资源.母亲线剧情待发布素材基址.length > 0);
  assert.match(客户端资源.母亲线剧情待发布素材基址, /@cg5\/rq091\/story$/);
  assert.doesNotMatch(客户端资源.母亲线剧情待发布素材基址, /@main(?:\/|$)|output\/imagegen/);
  assert.equal(客户端资源.母亲线剧情素材基址, 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg5/rq091/story');
  assert.match(decodeURI(客户端资源.回国图片('回国_01_管理员室整理经营归档')), /@cg5\/rq091\/story\/回国\//);
  assert.match(decodeURI(客户端资源.双重继承图片('双重继承_01_公寓外部检查')), /@cg5\/rq091\/story\/双重继承\//);

  globalThis.__RQGY_MOTHER_LINE_STORY_ASSET_BASE__ = 'https://cdn.example/assets@mother/src/人妻公寓/素材/特殊场景/';
  try {
    assert.match(decodeURI(客户端资源.回国图片('回国_01_管理员室整理经营归档')), /assets@mother\/.*\/回国\//u);
    assert.match(decodeURI(客户端资源.双重继承图片('双重继承_01_公寓外部检查')), /assets@mother\/.*\/双重继承\//u);
    assert.match(decodeURI(客户端资源.第二机位图片('第二机位_01_门缝那一眼')), /@cg5\/rq091\/story\/第二机位\//u);
    assert.match(decodeURI(客户端资源.许曼君分居图片('分居_A1_工资卡入封套')), /@cg5\/rq091\/story\/许曼君分居\//u);
  } finally {
    delete globalThis.__RQGY_MOTHER_LINE_STORY_ASSET_BASE__;
  }
});

test('资产构建脚本是显式可重现入口，不包含发布、tag、push、dist或候选删除动作', () => {
  const 脚本 = readFileSync(`${仓库根}/scripts/build-rqgy-mother-line-assets.py`, 'utf8');
  assert.match(脚本, /build_video_products/);
  assert.match(脚本, /build_static_manifest/);
  assert.match(脚本, /product-v1\/cg1\/mother-video-call/);
  assert.doesNotMatch(脚本, /git\s+(?:tag|push)|@main|shutil\.rmtree|unlink\(|dist\//);
});
