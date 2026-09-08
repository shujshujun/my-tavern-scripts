/* eslint-disable import-x/no-nodejs-modules -- Node-only published asset contract */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import lodash from 'lodash';
globalThis._=lodash;
process.env.TS_NODE_COMPILER_OPTIONS=JSON.stringify({module:'CommonJS',moduleResolution:'node'});
const require=createRequire(import.meta.url);require('ts-node/register/transpile-only');
const assets=require('../../src/人妻公寓/界面/客户端/assets.ts');
const ary=require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉资源.ts');
const nmd=require('../../src/人妻公寓/界面/客户端/不再留门资源.ts');
const vtr=require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');
const vtrContract=require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');
const wardrobe=require('../../src/人妻公寓/界面/客户端/穿戴成品图.ts');
const manifest=JSON.parse(readFileSync(new URL('../../src/人妻公寓/素材发布锁定_cg5.json',import.meta.url),'utf8'));
const root='https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg5/';
test('cg5的350张成品全部有与已发布文件一致的生产URL，源码审核清单仍可校验',()=>{
 assert.equal(manifest.count,350);assert.equal(manifest.format,'WebP');
 assert.equal(manifest.files.length,350);
 assert.doesNotThrow(()=>vtrContract.校验录像带V4机器契约());
 const providers={
  '安若妍不必停':assets.安若妍不必停图片,'安若妍换掉':ary.安若妍换掉图片,
  '不再留门':nmd.不再留门图片,'第二机位':assets.第二机位图片,
  '回国':assets.回国图片,'双重继承':assets.双重继承图片,
  '许曼君分居':assets.许曼君分居图片,'许曼君离婚':assets.许曼君离婚图片,
  '母亲视频':assets.母亲视频通话CG图片,
 };
 const cohab={早晨:'早晨共居',白天:'中午个人生活',傍晚归家:'傍晚等人',夜晚:'晚饭后客厅',深夜:'深夜共同休息'};
 for(const row of manifest.files){
  const name=path.posix.basename(row.path),id=name.replace(/\.webp$/,'');
  let url;
  if(providers[row.group])url=providers[row.group](id);
  else if(row.group==='录像带V4'){const m=/VTR-V4-(102|202)-B(\d+)/.exec(id);url=vtr.录像带V4产品图片地址(vtrContract.读取录像带V4产品(m[1],Number(m[2])));}
  else if(row.group==='衣柜成品'){const relative=row.path.replace('rq091/wardrobe/','');url=wardrobe.衣柜造型图片({图片:relative,预览:relative});}
  else if(row.group==='302共居')url=id.startsWith('302_亲密开场_')?assets.共居302亲密开场图(id):assets.共居302背景图(cohab[id.replace('302_共居_','')]);
  else if(row.group==='通关庆典'){
   const component=readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/通关结算.vue',import.meta.url),'utf8');
   assert.ok(component.includes(root+'rq091/settlement/'));
   url=root+row.path;
  }else assert.fail('Missing provider '+row.group);
  assert.equal(decodeURIComponent(url),root+row.path,row.path);
  assert.equal(row.format,'WEBP');assert.equal(row.decoded,true);
  assert.ok(['lossless','lossy'].includes(row.compression));
 }
});
test('已发布资源仍拒绝未知ID与路径逃逸',()=>{
 for(const fn of [assets.安若妍不必停图片,ary.安若妍换掉图片,nmd.不再留门图片,assets.许曼君离婚图片,assets.母亲视频通话CG图片]){
  assert.equal(fn('../unknown'),'');assert.equal(fn('unknown'),'');
 }
 assert.equal(vtr.录像带V4产品图片地址({productFile:'unknown.webp'}),'');
});
