/* eslint-disable import-x/no-nodejs-modules -- Node-only role-guide regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';
import { 填入本版周线完成夹具 } from './不再留门.fixture.mjs';

globalThis._ = lodash;
globalThis.SillyTavern = { chat: [{}] };
globalThis.getVariables = () => ({});
globalThis.updateVariablesWith = async fn => fn({});
globalThis.insertOrAssignVariables = () => undefined;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const 不必停 = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const 录像带 = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');
const 档案卡源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url),
  'utf8',
);

function 新301() {
  const data = Schema.parse({ 户: { 301: 创建户节点(0) } });
  data.户['301'].妻.当前阶段 = 5;
  data.户['301'].妻.阶段性癖 = '镜头高潮';
  data.户['301'].夫._居住模式 = '提前通知';
  data.户['301'].夫.状态 = '外出';
  data.现金 = 5000;
  return data;
}

function 新录像带(完成承接 = true) {
  const data = Schema.parse({ 户: { 102: {}, 202: {} } });
  data.户['102'].妻.当前阶段 = 5;
  data.户['202'].妻.当前阶段 = 5;
  if (完成承接) {
    data.系统._第二机位.阶段 = '已完成';
    data.系统._已完成特殊场景.push('第二机位', 录像带.录像带V4周小满承接完成ID);
    data.系统._特殊场景前置.push('录像带结局:沈母带封存', 录像带.录像带V4周小满母带封存键);
    填入本版周线完成夹具(data);
  }
  return data;
}

test('301《不必停》档案投影覆盖开放、进行、暂缓与完成，且严格只读', () => {
  const data = 新301();
  const 开放前 = Schema.parse({ 户: { 301: 创建户节点(0) } });
  assert.equal(不必停.读取安若妍不必停档案提示(开放前), null, '未开放时不提前剧透');

  const 开放前快照 = JSON.stringify(data);
  const 开放 = 不必停.读取安若妍不必停档案提示(data);
  assert.match(开放?.状态 ?? '', /承接事件已开放/);
  assert.match(开放?.下一步 ?? '', /商店.*不必停/);
  assert.equal(JSON.stringify(data), 开放前快照, '档案读取不得同步或修改路线');

  assert.equal(不必停.购买安若妍不必停(data).成功, true);
  let 提示 = 不必停.读取安若妍不必停档案提示(data);
  assert.match(提示?.下一步 ?? '', /301.*使用/);

  data.系统._安若妍不必停.阶段 = '亲密前半';
  data.系统._安若妍不必停.前半有效楼数 = 2;
  提示 = 不必停.读取安若妍不必停档案提示(data);
  assert.match(提示?.下一步 ?? '', /继续.*301.*亲密/);
  assert.match(提示?.进度 ?? '', /2\s*\/\s*4/u);

  data.系统._安若妍不必停.阶段 = '等待预约夜';
  data.系统._安若妍不必停.预约夜绝对时段 = 42;
  data.系统._安若妍不必停.暂停原因 = '上次现场暂缓';
  提示 = 不必停.读取安若妍不必停档案提示(data);
  assert.match(提示?.下一步 ?? '', /预约夜/);
  assert.match(提示?.补充 ?? '', /上次现场暂缓/);

  data.系统._安若妍不必停.阶段 = '已完成';
  data.系统._已完成特殊场景.push(不必停.安若妍不必停完成ID);
  提示 = 不必停.读取安若妍不必停档案提示(data);
  assert.equal(提示?.完成, true);
  assert.match(提示?.下一步 ?? '', /正式结局.*尚未/);
});

test('102与202共享《录像带》V4档案攻略跟随唯一硬状态', () => {
  const 未开放 = 新录像带(false);
  assert.equal(录像带.读取录像带V4档案提示(未开放, '102'), null);

  const data = 新录像带();
  const 快照 = JSON.stringify(data);
  let 沈 = 录像带.读取录像带V4档案提示(data, '102');
  let 周 = 录像带.读取录像带V4档案提示(data, '202');
  assert.match(沈?.状态 ?? '', /共享结局已开放/);
  assert.equal(沈?.下一步, 周?.下一步, '未分流前两张角色页应显示同一个入口');
  assert.equal(JSON.stringify(data), 快照, '共享结局档案投影必须只读');

  assert.equal(录像带.登记购买录像带V4(data).成功, true);
  data.背包.push('录像带');
  沈 = 录像带.读取录像带V4档案提示(data, '102');
  assert.match(沈?.下一步 ?? '', /背包.*使用/);

  assert.equal(录像带.使用录像带V4(data).成功, true);
  沈 = 录像带.读取录像带V4档案提示(data, '102');
  assert.match(沈?.下一步 ?? '', /两把锁.*沈静仪.*周小满/);
  assert.match(沈?.进度 ?? '', /0\s*\/\s*2/u);

  data.系统._录像带V4.阶段 = '微信确认中';
  data.系统._录像带V4.微信['102'].戴锁已确认 = true;
  沈 = 录像带.读取录像带V4档案提示(data, '102');
  周 = 录像带.读取录像带V4档案提示(data, '202');
  assert.match(沈?.下一步 ?? '', /沈静仪.*私聊.*回复/);
  assert.match(周?.下一步 ?? '', /等待周小满.*戴锁/);

  data.系统._录像带V4.阶段 = '观看中';
  data.系统._录像带V4.场景.状态 = '观看中';
  data.系统._录像带V4.场景.共享幕次 = 8;
  data.系统._录像带V4.场景.当前房间 = '202';
  周 = 录像带.读取录像带V4档案提示(data, '202');
  assert.match(周?.下一步 ?? '', /CAM-202.*下一幕/);
  assert.match(周?.进度 ?? '', /8\s*\/\s*19/u);

  data.系统._录像带V4.阶段 = '已完成';
  data.系统._录像带V4.场景.状态 = '已完成';
  data.系统._已完成特殊场景.push(录像带.录像带V4完成ID);
  沈 = 录像带.读取录像带V4档案提示(data, '102');
  assert.equal(沈?.完成, true);
  assert.match(沈?.进度 ?? '', /19\s*\/\s*19/u);
});

test('档案卡同时消费301承接和102／202共享结局投影', () => {
  assert.match(档案卡源码, /import \{ 读取安若妍不必停档案提示 \} from '[^']+安若妍不必停系统'/u);
  assert.match(档案卡源码, /import \{ 读取录像带V4档案提示 \} from '[^']+录像带V4状态'/u);
  assert.match(档案卡源码, /props\.door === '301'[\s\S]{0,160}读取安若妍不必停档案提示\(props\.data\)/u);
  assert.match(
    档案卡源码,
    /props\.door === '102' \|\| props\.door === '202'[\s\S]{0,180}读取录像带V4档案提示\(props\.data, props\.door\)/u,
  );
  assert.match(档案卡源码, /<b>不必停<\/b>[\s\S]{0,420}选中安若妍不必停提示\.下一步/u);
  assert.match(档案卡源码, /<b>录像带<\/b>[\s\S]{0,520}选中录像带V4提示\.下一步/u);
});
