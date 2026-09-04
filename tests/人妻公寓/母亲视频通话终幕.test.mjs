/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema } = require('../../src/人妻公寓/schema.ts');
const {
  母亲视频通话运行时CG总数,
  母亲视频通话最终候选张数,
} = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts');

const 读 = 相对 => readFileSync(new URL(`../../${相对}`, import.meta.url), 'utf8');
const schema源码 = 读('src/人妻公寓/schema.ts');
const initvar源码 = 读('src/人妻公寓/世界书/变量/initvar.yaml');
const index源码 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
const 双重继承源码 = 读('src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
const 父亲通话源码 = 读('src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts');
const 来电页源码 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/call.ts');
const 通话页源码 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/talk.ts');
const 手机资源源码 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/母亲视频通话资源.ts');
const 共同资源源码 = 读('src/人妻公寓/脚本/游戏逻辑/母亲视频通话资源.ts');
const 草稿源码 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/母亲视频通话草稿.ts');
const 客户端源码 = 读('src/人妻公寓/界面/客户端/App.vue');
const 隔离引擎源码 = 读('src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts');
const 权威设计 = 读('src/人妻公寓/母亲微信视频通话终幕_小手机与正文协同权威设计_2026-08-29.md');

function 次数(文本, 片段) {
  return 文本.split(片段).length - 1;
}

test('正式口径是53张最终候选加复用005，共54张运行CG', () => {
  assert.equal(母亲视频通话最终候选张数, 53);
  assert.equal(母亲视频通话运行时CG总数, 54);
  assert.match(权威设计, /53张/);
  assert.match(权威设计, /54张/);
  assert.match(权威设计, /通话主循环\s*\|\s*39|主循环[^\n]*39/);
  assert.match(权威设计, /回到`MVC-CG-005`|回到005/);
});

test('Schema只有一份母亲视频通话状态，旧档可幂等补齐', () => {
  assert.equal(次数(schema源码, '_母亲视频通话终幕: z'), 1);
  assert.equal(次数(initvar源码, '_母亲视频通话终幕:'), 1);
  const first = Schema.parse({});
  const second = Schema.parse(first);
  assert.deepEqual(second, first);
  assert.equal(first.系统._母亲视频通话终幕.状态, '');
  assert.equal(first.系统._母亲视频通话终幕.现场正文请求世代, 0);
  assert.deepEqual(first.系统._母亲视频通话终幕.现场正文记录, []);
});

test('双重继承直接预约终幕，主逻辑只注册真实手机来电与通话事件链', () => {
  for (const 事件 of [
    '人妻公寓:接听母亲视频通话终幕',
    '人妻公寓:母亲视频通话父亲回复已保存',
    '人妻公寓:母亲视频通话请求结束',
    '人妻公寓:母亲视频通话重试现场正文',
    '人妻公寓:母亲视频通话最终回答已保存',
    '人妻公寓:母亲视频通话恢复持久断点',
    '人妻公寓:母亲视频通话继续终幕',
  ]) {
    assert.ok(index源码.includes(`eventOn('${事件}'`) || index源码.includes(`'${事件}',`), `缺少${事件}`);
  }
  assert.doesNotMatch(index源码, /人妻公寓:预约母亲视频通话终幕/u, '不得保留无生产者的平行预约宿主入口');
  assert.match(双重继承源码, /import \{ 母亲视频通话模式, 预约母亲视频通话终幕 \} from '\.\/母亲视频通话系统'/u);
  assert.match(
    双重继承源码,
    /const 预约 = 预约母亲视频通话终幕\(data, 双重继承完成ID, 楼层\)/u,
    '最终检查结算必须直接、原子地预约同一份母亲视频状态',
  );
  assert.match(index源码, /构造母亲视频通话正文注入/);
  assert.match(index源码, /类型: '母亲视频通话'/);
  assert.match(index源码, /现场正文请求世代/);
  assert.match(index源码, /通话\.模式 === 母亲视频通话模式/);
  assert.match(index源码, /读取母亲视频通话未登记父亲回复/);
  assert.match(index源码, /读取母亲视频通话未登记最终回答/);
  assert.match(index源码, /父亲的视频还在等你接听。请先回到302卧室和母亲身边/);
  assert.match(父亲通话源码, /母亲视频通话恢复持久断点/);
  assert.match(index源码, /创建持久终幕驱动/);
  assert.match(index源码, /提交母亲视频终幕帧\(data, 通话标识, 预期帧\)/);
  assert.match(index源码, /then\(\(\) => 继续视频终幕\(通话标识, 预期聊天ID, 预期时间线世代\)\)/);
  assert.match(通话页源码, /继续播放终幕/);
});

test('父亲模型只说父亲台词，真实回复保存后才触发现场正文', () => {
  assert.match(父亲通话源码, /async function 母亲视频父亲台词/);
  assert.match(父亲通话源码, /只输出父亲的下一句话/);
  assert.match(父亲通话源码, /父亲从头到尾不知道/);
  assert.match(父亲通话源码, /母亲视频通话父亲回复已保存/);
  assert.match(父亲通话源码, /母亲视频通话最终回答已保存/);
  assert.match(父亲通话源码, /母亲视频通话可以发送/);
});

test('现有小手机承担视频来电和CG背景，未发布素材不会请求虚构URL', () => {
  assert.match(来电页源码, /微信视频/);
  assert.match(来电页源码, /接听母亲视频通话终幕/);
  assert.match(通话页源码, /rqp-video-talk/);
  assert.match(通话页源码, /母亲视频通话CG图片/);
  assert.match(通话页源码, /重新演绎本轮现场正文/);
  assert.match(通话页源码, /读取母亲视频通话草稿/);
  assert.match(通话页源码, /保存母亲视频通话草稿/);
  assert.match(通话页源码, /清除母亲视频通话草稿/);
  assert.match(通话页源码, /终幕已接管输入/);
  assert.match(草稿源码, /sessionStorage/);
  assert.match(草稿源码, /聊天ID.*通话标识|母亲视频通话草稿键/);
  assert.match(手机资源源码, /from '\.\.\/\.\.\/母亲视频通话资源'/);
  assert.doesNotMatch(手机资源源码, /__RQGY_MOTHER_VIDEO_CALL_ASSET_BASE__|qgy-assets@cg5|output\/imagegen/);
  assert.match(共同资源源码, /__RQGY_MOTHER_VIDEO_CALL_ASSET_BASE__/);
  assert.match(共同资源源码, /母亲视频通话素材发布配置\.状态 === '已发布'/);
  assert.match(共同资源源码, /return 基址 \? `\$\{基址\}/);
  assert.doesNotMatch(共同资源源码, /@main(?:\/|$)|output\/imagegen/);
});

test('视频接通后普通输入和底部功能区退出，主舞台只显示持久现场正文', () => {
  assert.match(客户端源码, /v-if="!母亲视频终幕已接通 && !录像带V4中"/);
  assert.match(客户端源码, /!前台硬决策中 && !母亲视频终幕已接通/);
  assert.match(
    客户端源码,
    /普通场景剧情功能锁\.value \|\|\s*录像带前置中\.value \|\|\s*录像带V4活动\.value \|\|\s*母亲视频终幕已接通\.value/,
  );
  assert.match(客户端源码, /母亲视频现场正文条目/);
  assert.match(客户端源码, /现场正文记录/);
  assert.match(客户端源码, /mother-video-stage/);
  assert.match(客户端源码, /母亲视频终幕CG地址/);
  assert.match(客户端源码, /blur\(8px\) brightness\(0\.44\)/);
  assert.match(客户端源码, /if \(母亲视频终幕已接通\.value\) return 母亲视频现场正文条目\.value/);
  assert.match(客户端源码, /:in-scene="母亲视频终幕已接通 \|\| 在幕中"/);
  assert.match(客户端源码, /mother-video-lock-note/);
  assert.match(客户端源码, /视频通话仍在进行中 · 打开右下角手机继续回应父亲/);
  for (const 弹窗 of ['显示地图', '显示商店', '显示背包', '显示监控', '显示史册']) {
    assert.match(客户端源码, new RegExp(`${弹窗}\\.value = false`));
  }
  assert.match(客户端源码, /清空借种CG序列\(\)/);
  assert.match(客户端源码, /当前生产CG\.value = null/);
  assert.match(客户端源码, /当前家庭计划CG\.value = null/);
});

test('专用正文使用隔离生成通道但不写伪玩家行动日志', () => {
  assert.match(隔离引擎源码, /'母亲视频通话'/);
  assert.match(index源码, /生成隔离事件草稿/);
  assert.doesNotMatch(index源码, /写入隔离事件草稿\([^)]*母亲视频通话/);
  assert.match(index源码, /完成母亲视频通话现场正文/);
  assert.match(index源码, /标记母亲视频通话现场正文失败/);
});
