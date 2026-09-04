/* eslint-disable import-x/no-nodejs-modules -- Node-only wardrobe lifecycle and asset contracts */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.getLastMessageId = () => 0;
globalThis.__RQGY_WARDROBE_ASSET_BASE__ = 'http://wardrobe.test/approved';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 道具表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 读取衣柜造型, 匹配衣柜造型, 穿戴成品键 } = require('../../src/人妻公寓/衣柜造型配置.ts');
const { 执行衣柜动作, 登记衣柜赠礼, 预览固定造型, 衣柜预览穿戴, 读取衣柜物品, 当前可见立绘SKU } = require('../../src/人妻公寓/脚本/游戏逻辑/衣柜系统.ts');
const { 角色立绘候选 } = require('../../src/人妻公寓/界面/客户端/assets.ts');

function 数据() {
  const data = Schema.parse({ 户: Object.fromEntries(Object.keys(户静态表).map(m => [m, 创建户节点(0)])) });
  for (const [m, entry] of Object.entries(data.户)) {
    Object.assign(entry.妻, 户静态表[m].初始, { 当前阶段: 5 });
    entry.妻.裂缝.已确认 = true;
    for (const id of ['猫耳发箍', '烈色口红', '碎花连衣裙', '真丝吊带睡裙', '浓香香水', '遥控跳蛋套装']) 登记衣柜赠礼(entry.妻, id);
  }
  return data;
}
const 动作 = (data, id, 操作 = '套用造型', m = '101') => 执行衣柜动作(data, { 门牌: m, 道具id: id, 操作 });
const 匹配 = (wife, m = '101') => 匹配衣柜造型(户静态表[m].妻名, 当前可见立绘SKU(wife), false, { 妆容SKU: wife._穿着SKU.妆容, 特殊: wife.特殊 });

test('六名角色的固定造型预览与应用一致，图像入口读取同一成品且不影响其他角色', () => {
  for (const m of Object.keys(户静态表)) {
    const data = 数据();
    const wife = data.户[m].妻;
    动作(data, '碎花连衣裙', '穿戴', m);
    动作(data, '真丝吊带睡裙', '穿戴', m);
    const before = lodash.cloneDeep(data);
    const preview = 预览固定造型(wife, m, '猫耳发箍');
    assert.deepEqual(data, before);
    assert.equal(动作(data, '猫耳发箍', '套用造型', m).成功, true);
    for (const key of ['外装', '内衣', '妆容', '特殊', '_穿着SKU', '_穿戴锁']) assert.deepEqual(wife[key], preview[key]);
    assert.equal(wife._穿着SKU.内衣, '真丝吊带睡裙');
    assert.equal(匹配(wife, m).道具id, '猫耳发箍');
    const src = 角色立绘候选(户静态表[m].妻名, 当前可见立绘SKU(wife), false, { 妆容SKU: wife._穿着SKU.妆容, 特殊: wife.特殊 })[0];
    assert.equal(decodeURI(src), `http://wardrobe.test/approved/${户静态表[m].妻名}/猫耳发箍.webp`);
    assert.equal(动作(data, '猫耳发箍', '套用造型', m).变动, undefined);
    for (const other of Object.keys(户静态表).filter(id => id !== m)) assert.deepEqual(data.户[other], before.户[other]);
    const restored = Schema.parse(JSON.parse(JSON.stringify(data)));
    assert.equal(匹配(restored.户[m].妻, m).道具id, '猫耳发箍');
    assert.deepEqual(data.系统, before.系统);
    assert.deepEqual(data.背包, before.背包);
  }
});

test('猫耳与口红作为不同完整造型切换，隐藏内衣和隐蔽物品不会制造组合数量', () => {
  const data = 数据();
  const wife = data.户['101'].妻;
  动作(data, '真丝吊带睡裙', '穿戴');
  动作(data, '遥控跳蛋套装', '穿戴');
  动作(data, '浓香香水', '穿戴');
  动作(data, '猫耳发箍');
  assert.equal(匹配(wife).道具id, '猫耳发箍');
  assert.equal(wife._穿着SKU.妆容, '浓香香水');
  assert.equal(动作(data, '烈色口红').成功, true);
  assert.equal(匹配(wife).道具id, '烈色口红');
  assert.ok(!wife.特殊.includes(道具表.猫耳发箍.服饰.穿着描述));
  assert.ok(wife.特殊.includes(道具表.遥控跳蛋套装.服饰.穿着描述));
  assert.equal(wife._穿着SKU.内衣, '真丝吊带睡裙');
  assert.ok(wife._衣柜.includes('猫耳发箍'));
  assert.equal(穿戴成品键('夏乔', '', false, { 特殊: [道具表.猫耳发箍.服饰.穿着描述] }),
    穿戴成品键('夏乔', '', false, { 妆容SKU: '浓香香水', 特殊: [道具表.猫耳发箍.服饰.穿着描述, 道具表.遥控跳蛋套装.服饰.穿着描述] }));
});

test('换内衣被外衣遮挡时造型保留，换外衣或脱外衣则结束可见造型，预览与落地相同', () => {
  for (const id of ['猫耳发箍', '烈色口红']) {
    const data = 数据();
    const wife = data.户['101'].妻;
    动作(data, id);
    动作(data, '真丝吊带睡裙', '穿戴');
    assert.equal(匹配(wife).道具id, id);
    const outfit = 读取衣柜物品(data, '101').find(item => item.id === '碎花连衣裙');
    const preview = 衣柜预览穿戴(wife, outfit);
    动作(data, '碎花连衣裙', '穿戴');
    assert.equal(匹配(wife), undefined);
    assert.equal(当前可见立绘SKU(wife), preview.主立绘SKU);
    assert.deepEqual(wife.特殊, preview.特殊);
    assert.ok(wife._衣柜.includes(id));
    动作(data, id);
    assert.equal(动作(data, '初始外装_夏乔', '脱下外装').成功, true);
    assert.equal(匹配(wife), undefined);
    assert.equal(当前可见立绘SKU(wife), '真丝吊带睡裙');
  }
});

test('缺少库存、未提供的孕态、绑定穿戴与满容量都不得部分应用造型', () => {
  for (const block of [
    data => { data.户['101'].妻._衣柜 = []; },
    data => { data.户['101'].妻._怀孕.状态 = '已告知'; },
    data => { data.户['101'].妻.特殊 = ['剧情甲', '剧情乙', '剧情丙', '剧情丁']; },
  ]) {
    const data = 数据(); block(data);
    const before = lodash.cloneDeep(data);
    assert.equal(动作(data, '猫耳发箍').成功, false);
    assert.deepEqual(data, before);
  }
  const data = 数据();
  动作(data, '碎花连衣裙', '穿戴');
  delete data.户['101'].妻._穿着SKU.外装; // 有锁定描述但无 SKU 的旧档。
  道具表.碎花连衣裙.服饰.不可卸下 = true;
  try {
    const before = lodash.cloneDeep(data);
    assert.equal(动作(data, '猫耳发箍').成功, false);
    assert.deepEqual(data, before);
  } finally { delete 道具表.碎花连衣裙.服饰.不可卸下; }
});

test('剧情绑定佩饰不能被套用造型或普通换衣绕过，未知记录原样保留', () => {
  const data = 数据(); const wife = data.户['101'].妻;
  wife.特殊 = ['剧情甲'];
  动作(data, '猫耳发箍');
  道具表.猫耳发箍.服饰.不可卸下 = true;
  try {
    const before = lodash.cloneDeep(data);
    assert.equal(动作(data, '烈色口红').成功, false);
    assert.equal(动作(data, '碎花连衣裙', '穿戴').成功, false);
    assert.deepEqual(data, before);
  } finally { delete 道具表.猫耳发箍.服饰.不可卸下; }
  assert.ok(wife.特殊.includes('剧情甲'));
});

test('婚纱作为完整外装覆盖内衣，脱下或换回初始都不残留婚纱主图', () => {
  const data = 数据(); const wife = data.户['302'].妻;
  登记衣柜赠礼(wife, '婚纱');
  动作(data, '真丝吊带睡裙', '穿戴', '302');
  assert.equal(动作(data, '婚纱', '套用造型', '302').成功, true);
  assert.equal(当前可见立绘SKU(wife), '婚纱');
  assert.equal(匹配(wife, '302').道具id, '婚纱');
  assert.equal(wife._穿着SKU.内衣, '真丝吊带睡裙');
  assert.equal(动作(data, '婚纱', '脱下外装', '302').成功, true);
  assert.equal(当前可见立绘SKU(wife), '真丝吊带睡裙');
  assert.ok(!wife.特殊.includes(道具表.婚纱.服饰.穿着描述));
  assert.ok(wife._衣柜.includes('婚纱'));
  assert.equal(动作(data, '婚纱', '套用造型', '302').成功, true);
  assert.equal(动作(data, '婚纱', '卸下', '302').成功, true);
  assert.equal(当前可见立绘SKU(wife), '');
  assert.equal(wife._穿着SKU.外装, '初始外装_母亲');
  assert.equal(wife._穿着SKU.内衣, '真丝吊带睡裙');
});

test('旧档只在特殊记录中写有婚纱时，不能借婚纱脱除另一件实际外衣', () => {
  const data = 数据(); const wife = data.户['302'].妻;
  动作(data, '碎花连衣裙', '穿戴', '302');
  动作(data, '真丝吊带睡裙', '穿戴', '302');
  wife.特殊.push(道具表.婚纱.服饰.穿着描述);
  const before = lodash.cloneDeep(data);
  assert.equal(动作(data, '婚纱', '脱下外装', '302').成功, false);
  assert.deepEqual(data, before);
  assert.equal(动作(data, '婚纱', '卸下', '302').成功, true);
  assert.equal(当前可见立绘SKU(wife), '碎花连衣裙');
});

test('成品清单引用本地已审核文件和同源预览，不串角色、不引用失败候选', () => {
  const rows = JSON.parse(readFileSync(new URL('../../src/人妻公寓/衣柜造型清单.json', import.meta.url), 'utf8'));
  const keys = new Set();
  for (const row of rows) {
    const key = `${row.角色}|${row.道具id}|${row.孕态}`;
    assert.ok(!keys.has(key)); keys.add(key);
    assert.ok(读取衣柜造型(row.角色, row.道具id, row.孕态));
    for (const [pathKey, shaKey] of [['图片', '图片SHA256'], ['预览', '预览SHA256']]) {
      assert.ok(row[pathKey].startsWith(row.角色 + '/'));
      const bytes = readFileSync(new URL('../../src/人妻公寓/素材/衣柜/成品/' + row[pathKey], import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), row[shaKey]);
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
  }
});

test('全部42套已审造型均可由对应角色库存达到，并解析为清单中的同一完整图片', () => {
  const rows = JSON.parse(readFileSync(new URL('../../src/人妻公寓/衣柜造型清单.json', import.meta.url), 'utf8'));
  assert.equal(rows.length, 42);
  for (const row of rows) {
    const m = Object.keys(户静态表).find(id => 户静态表[id].妻名 === row.角色);
    const data = 数据(); const wife = data.户[m].妻;
    for (const id of [row.道具id, row.主服装, row.妆容SKU, ...row.特殊SKU].filter(Boolean)) 登记衣柜赠礼(wife, id);
    const original = lodash.cloneDeep(data);
    assert.equal(动作(data, row.道具id, '套用造型', m).成功, true, row.角色 + '/' + row.道具id);
    const src = 角色立绘候选(row.角色, 当前可见立绘SKU(wife), false, { 妆容SKU: wife._穿着SKU.妆容, 特殊: wife.特殊 })[0];
    assert.equal(decodeURI(src), 'http://wardrobe.test/approved/' + row.图片);
    assert.deepEqual(data.系统, original.系统);
    assert.deepEqual(data.背包, original.背包);
    assert.equal(动作(data, row.道具id, '套用造型', m).变动, undefined);
  }
});
