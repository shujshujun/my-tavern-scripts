/* eslint-disable import-x/no-nodejs-modules -- Node-only chat worldbook transaction regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';
globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({module:'CommonJS',moduleResolution:'node'});
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require=createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const {Schema,创建户节点}=require('../../src/人妻公寓/schema.ts');
const all=require('../../src/人妻公寓/脚本/游戏逻辑/结局世界书同步.ts');
const xu=require('../../src/人妻公寓/脚本/游戏逻辑/201离婚世界书.ts');
const mother=require('../../src/人妻公寓/脚本/游戏逻辑/302共居世界书.ts');
const ary=require('../../src/人妻公寓/脚本/游戏逻辑/301换掉世界书.ts');
const txn=require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const ts=require('typescript');
const rooms=['101','102','201','202','301','302'];
function data(completed=true){
  const d=Schema.parse({户:Object.fromEntries(rooms.map(id=>[id,创建户节点(0)]))});
  if(completed){
    d.系统._已完成特殊场景.push('借种','录像带结局','角色路线:201:结局剧情','角色路线:301:结局剧情','双重继承');
    d.系统._许曼君分居.玩家最终关系选择='继续关系';
  }
  return d;
}
function host(){
  let chat='a',binding='wb-a',calls=0;
  const books=new Map([['wb-a',[]],['wb-b',[]]]);
  globalThis.SillyTavern={getCurrentChatId:()=>chat};
  globalThis.getChatWorldbookName=()=>binding;
  globalThis.getOrCreateChatWorldbook=async()=>{binding='wb-'+chat;return binding;};
  globalThis.updateWorldbookWith=async(name,update)=>{calls++;books.set(name,update(lodash.cloneDeep(books.get(name)??[])));};
  all.作废全部角色阶段世界书缓存?.();
  xu.作废201离婚阶段世界书同步缓存();mother.作废302阶段世界书同步缓存();ary.作废301换掉阶段世界书同步缓存();
  return {books,calls:()=>calls,setChat:value=>{chat=value;},setBinding:value=>{binding=value;}};
}
test('六户结局完成以一次原子写入更新各自阶段，重复同步幂等',async()=>{
  const h=host(),d=data(),before=lodash.cloneDeep(d);
  assert.equal(await all.同步结局世界书条目(d),true);
  const active=h.books.get('wb-a').filter(e=>e.enabled);
  assert.equal(active.length,6);
  for(const room of rooms) assert.ok(active.some(e=>e.name.includes(room)&&e.content.includes('结局后自由生活')),room);
  assert.match(active.find(e=>e.name.includes('101')).content,/知情.*三人家庭/);
  assert.match(active.find(e=>e.name.includes('102')).content,/顾国栋/);
  assert.match(active.find(e=>e.name.includes('202')).content,/何俊生/);
  assert.equal(h.calls(),1);
  assert.equal(await all.同步全部角色阶段世界书(d),true);
  assert.equal(h.calls(),1);
  assert.deepEqual(d,before);
});
test('承接完成不提前签发正式结局，三户缺口读取独立进度',async()=>{
  const h=host(),d=data(false);
  d.系统._家庭计划.阶段='已完成';
  d.系统._第二机位.阶段='已完成';
  d.系统._不再留门.阶段='已完成';
  d.系统._已完成特殊场景.push('第二机位','不再留门');
  await all.同步全部角色阶段世界书(d);
  for(const room of ['101','102','202']){
    const entry=h.books.get('wb-a').find(e=>e.name.includes(room));
    assert.match(entry.content,/当前游戏阶段：承接完成/);
    assert.doesNotMatch(entry.content,/当前游戏阶段：结局后自由生活/);
  }
  assert.deepEqual(d.系统._已完成特殊场景,['第二机位','不再留门']);
});
for(const [label,module,sync] of [
  ['201',xu,'同步201离婚阶段世界书'],['302',mother,'同步302阶段世界书'],['301',ary,'同步301换掉阶段世界书'],
]){
  test(`${label}兼容入口更换世界书后补写，失效队列不能复活旧阶段`,async()=>{
    const h=host(),d=data();
    assert.equal(await module[sync](d),true);
    h.setBinding('wb-b');
    assert.equal(await module[sync](d),true);
    assert.equal(h.books.get('wb-b').filter(e=>e.enabled).length,1);
    let release;
    globalThis.updateWorldbookWith=async(name,update)=>{
      await new Promise(resolve=>{release=resolve;});
      h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));
    };
    const pending=module[sync](data(false),()=>true,true);
    await new Promise(resolve=>setImmediate(resolve));
    const previous=lodash.cloneDeep(h.books.get('wb-b'));
    if(label==='201') module.作废201离婚阶段世界书同步缓存();
    if(label==='302') module.作废302阶段世界书同步缓存();
    if(label==='301') module.作废301换掉阶段世界书同步缓存();
    release();
    assert.equal(await pending,false);
    assert.deepEqual(h.books.get('wb-b'),previous);
  });
}
test('失败、超时均不污染缓存，迟到结果不覆盖新阶段',async()=>{
  const h=host(),d=data();
  let delayed;
  globalThis.updateWorldbookWith=async(_name,update)=>{delayed=update;return new Promise(()=>{});};
  const realTimer=globalThis.setTimeout;
  globalThis.setTimeout=(fn,delay,...args)=>realTimer(fn,delay===4000?15:delay,...args);
  try {
    assert.equal(await all.同步全部角色阶段世界书(d),false);
    globalThis.updateWorldbookWith=async(name,update)=>{h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));};
    assert.equal(await all.同步全部角色阶段世界书(data(false)),true);
    const before=lodash.cloneDeep(h.books.get('wb-a'));
    assert.deepEqual(delayed(lodash.cloneDeep(before)),before);
    globalThis.updateWorldbookWith=async()=>{throw new Error('保存失败');};
    assert.equal(await all.同步全部角色阶段世界书(d),false);
    globalThis.updateWorldbookWith=async(name,update)=>{h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));};
    assert.equal(await all.同步全部角色阶段世界书(d),true);
  }finally{globalThis.setTimeout=realTimer;}
});
test('回档、新局与缺失角色仅重建自身阶段，其他条目与游戏真值保留',async()=>{
  const h=host(),d=data();
  const other={uid:100,name:'用户自定义条目',content:'用户内容',enabled:true};
  h.books.get('wb-a').push(other);
  await all.同步全部角色阶段世界书(d);
  const originalUIDs=h.books.get('wb-a').filter(e=>e.name!==other.name).map(e=>e.uid);
  const before=data(false);delete before.户['201'];delete before.户['301'];
  await all.同步全部角色阶段世界书(before,()=>true,true);
  const entries=h.books.get('wb-a');
  assert.deepEqual(entries.find(e=>e.name===other.name),other);
  assert.deepEqual(entries.filter(e=>e.name!==other.name).map(e=>e.uid),originalUIDs);
  assert.equal(entries.find(e=>e.name.includes('201')).enabled,false);
  assert.equal(entries.find(e=>e.name.includes('301')).enabled,false);
  assert.ok(entries.filter(e=>e.name!==other.name&&e.enabled).every(e=>!e.content.includes('结局后自由生活')));
});
test('多角色并发兼容调用互不丢写，切聊天后的旧回调失效',async()=>{
  const h=host(),d=data();
  await Promise.all([xu.同步201离婚阶段世界书(d),mother.同步302阶段世界书(d),ary.同步301换掉阶段世界书(d)]);
  assert.equal(h.books.get('wb-a').filter(e=>e.enabled).length,3);
  let release;
  globalThis.updateWorldbookWith=async(name,update)=>{await new Promise(resolve=>{release=resolve;});h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));};
  const pending=all.同步全部角色阶段世界书(data(false),()=>true,true);
  await new Promise(resolve=>setImmediate(resolve));
  const previous=lodash.cloneDeep(h.books.get('wb-a'));
  h.setChat('b');h.setBinding('wb-b');release();
  assert.equal(await pending,false);
  assert.deepEqual(h.books.get('wb-a'),previous);
});
test('普通正文、硬操作、录像带结束与恢复入口都接入统一阶段投影',()=>{
  const read=file=>readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/'+file,import.meta.url),'utf8');
  const index=read('index.ts'),engine=read('回合引擎.ts');
  assert.ok((index.match(/同步全部角色阶段世界书\(/g)??[]).length>=6);
  assert.ok((engine.match(/同步全部角色阶段世界书\(/g)??[]).length>=3);
  const hard=index.slice(index.indexOf('async function 落地('),index.indexOf('const 家庭计划CG标题'));
  assert.match(hard,/await 脚本写入[\s\S]*同步全部角色阶段世界书/);
  const vtr=index.slice(index.indexOf("eventOn('人妻公寓:完成录像带V4'"),index.indexOf("eventOn('人妻公寓:生产动作'"));
  assert.match(vtr,/await 脚本写入[\s\S]*已提交 = true[\s\S]*同步全部角色阶段世界书/);
});

test('真实落地函数只在核心保存成功后写六户阶段，保存失败和切聊不会误写',async()=>{
  const text=readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts',import.meta.url),'utf8');
  const ast=ts.createSourceFile('index.ts',text,ts.ScriptTarget.Latest,true);
  let declaration;
  const visit=node=>{if(ts.isFunctionDeclaration(node)&&node.name?.text==='落地')declaration=node;ts.forEachChild(node,visit);};
  visit(ast);assert.ok(declaration);
  const code=ts.transpileModule(declaration.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  for(const outcome of ['success','failed','switch']){
    const h=host(),d=data();
    let saved=false;
    const context={...txn,
      当前聊天ID:()=>globalThis.SillyTavern.getCurrentChatId(),当前时间线切换世代:()=>0,时间线切换协调中:()=>false,
      读场景:()=>({房间id:'301'}),当前楼层:()=>40,eventEmit:()=>undefined,捕获保护快照:()=>undefined,
      脚本写入:async()=>{if(outcome==='failed')throw new Error('核心写入失败');saved=true;if(outcome==='switch'){h.setChat('b');h.setBinding('wb-b');}},
      同步全部角色阶段世界书:async(...args)=>{assert.equal(saved,true);return all.同步全部角色阶段世界书(...args);},
    };
    const execute=new Function(...Object.keys(context),code+';return 落地;')(...Object.values(context));
    assert.equal(await execute({提示:'操作完成',变动:true},{stat_data:lodash.cloneDeep(d)},d),outcome!=='failed');
    assert.equal(h.books.get('wb-a').length,outcome==='success'?6:0);
    assert.equal(h.books.get('wb-b').length,0);
  }
});

test('同一角色的新请求覆盖旧候选，旧完成内容不会在回档后重现',async()=>{
  const h=host();let release;
  globalThis.updateWorldbookWith=async(name,update)=>{await new Promise(resolve=>{release=resolve;});h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));};
  const old=all.同步全部角色阶段世界书(data(),()=>true,true);
  await new Promise(resolve=>setImmediate(resolve));
  const newer=all.同步全部角色阶段世界书(data(false),()=>true,true);
  const oldRelease=release;
  globalThis.updateWorldbookWith=async(name,update)=>{h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));};
  oldRelease();
  assert.equal(await old,false);assert.equal(await newer,true);
  assert.ok(h.books.get('wb-a').filter(e=>e.enabled).every(e=>!e.content.includes('结局后自由生活')));
});

test('缺少宿主依赖、取消与未开线新局不改变游戏状态或创建空书',async()=>{
  const h=host(),d=data(),snapshot=lodash.cloneDeep(d);
  assert.equal(await all.同步全部角色阶段世界书(d,()=>false),false);
  assert.equal(h.calls(),0);
  delete globalThis.updateWorldbookWith;
  assert.equal(await all.同步全部角色阶段世界书(d),false);
  assert.deepEqual(d,snapshot);
  host();
  globalThis.getChatWorldbookName=()=>null;
  let created=0;
  globalThis.getOrCreateChatWorldbook=async()=>{created++;return 'unused';};
  const fresh=Schema.parse({户:{101:创建户节点(0),102:创建户节点(0),302:创建户节点(0)}});
  assert.equal(await all.同步全部角色阶段世界书(fresh),true);
  assert.equal(created,0);
  delete globalThis.getOrCreateChatWorldbook;
  assert.equal(await all.同步全部角色阶段世界书(d),false);
  assert.deepEqual(d,snapshot);
});

test('解绑后重建同名世界书时，回档仍能覆盖在途内容',async()=>{
  const h=host();
  await all.同步全部角色阶段世界书(data(false));
  h.setBinding(null);
  let release;
  globalThis.updateWorldbookWith=async(name,update)=>{await new Promise(resolve=>{release=resolve;});h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));};
  const old=all.同步全部角色阶段世界书(data());
  await new Promise(resolve=>setImmediate(resolve));
  const newer=all.同步全部角色阶段世界书(data(false));
  globalThis.updateWorldbookWith=async(name,update)=>{h.books.set(name,update(lodash.cloneDeep(h.books.get(name))));};
  release();
  assert.equal(await old,false);assert.equal(await newer,true);
  assert.ok(h.books.get('wb-a').filter(e=>e.enabled).every(e=>!e.content.includes('结局后自由生活')));
});
