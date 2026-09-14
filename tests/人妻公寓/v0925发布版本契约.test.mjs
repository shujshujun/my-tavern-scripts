import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';
const read=p=>readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
test('0.92.5源码、组卡、工作流与更新说明一致，历史工作流冻结',()=>{
 assert.match(read('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts'),/当前游戏版本 = '0\.92\.6'/);
 const pack=read('src/人妻公寓/组卡.mjs');
 assert.match(pack,/const 版本 = '0\.92\.6'/);assert.match(pack,/const TAG = 'rq0\.92\.6'/);
 const workflow=read('.github/workflows/publish-rq0925.yml');
 assert.match(workflow,/ref: rq0\.92\.5/);
 for(const n of ['rqgy-0.92.5.png','rqgy-0.92.5.json','rqgy-0.92.5-checksums.json'])assert.ok(workflow.includes(n));
 assert.match(read('.github/workflows/publish-rq0924.yml'),/ref: rq0\.92\.4/);
 assert.match(read('src/人妻公寓/schema.ts'),/当前MVU数据版本 = 9/);
 const notes=read('src/人妻公寓/发布说明_v0.92.5_2026-09-15.md');
 for(const n of ['茶话会','提示词','防截断','提前购买','无需重开','官方渠道','完整刷新'])assert.ok(notes.includes(n));
});
test('0.92.5拒绝旧构建、混包及错误代码标签',()=>{
 assert.equal(校验发布版本一致({版本:'0.92.5',标签:'rq0.92.5'}),'RQGY_GAME_VERSION:0.92.5');
 assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.92.5','0.92.5'),'RQGY_GAME_VERSION:0.92.5');
 assert.throws(()=>校验客户端构建版本('RQGY_GAME_VERSION:0.92.4','0.92.5'));
 assert.throws(()=>校验客户端构建版本('RQGY_GAME_VERSION:0.92.4 RQGY_GAME_VERSION:0.92.5','0.92.5'));
 assert.throws(()=>校验发布版本一致({版本:'0.92.5',标签:'rq0.92.4'}));
});
