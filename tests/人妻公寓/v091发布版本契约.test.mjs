/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('0.91游戏版本、组卡标签与数据版本保持一致',()=>{
  assert.match(read('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts'),/当前游戏版本 = '0\.91'/);
  const card=read('src/人妻公寓/组卡.mjs');
  assert.match(card,/const 版本 = '0\.91'/);
  assert.match(card,/const TAG = 'rq0\.91'/);
  assert.match(card,/支持继承 v0\.80～v0\.90\.4 存档/);
  assert.match(read('src/人妻公寓/schema.ts'),/当前MVU数据版本 = 9/);
});
test('0.91组卡拒绝旧客户端和混合版本',()=>{
  assert.equal(校验发布版本一致({版本:'0.91',标签:'rq0.91'}),'RQGY_GAME_VERSION:0.91');
  assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.91','0.91'),'RQGY_GAME_VERSION:0.91');
  assert.throws(()=>校验客户端构建版本('RQGY_GAME_VERSION:0.90.4','0.91'),/不一致/);
  assert.throws(()=>校验客户端构建版本('RQGY_GAME_VERSION:0.90.4 RQGY_GAME_VERSION:0.91','0.91'),/不一致/);
  assert.throws(()=>校验发布版本一致({版本:'0.91',标签:'rq0.90.4'}),/不一致/);
});
