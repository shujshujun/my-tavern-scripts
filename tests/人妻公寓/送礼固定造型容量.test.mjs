/* eslint-disable import-x/no-nodejs-modules -- PLAY-010：真实送礼/衣柜容量；不访问玩家存档或模型。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { 装配真实时间事务门 } from './helpers/时间事务门装配.mjs';
import lodash from 'lodash';
import * as ts from 'typescript';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getLastMessageId = () => 4;
globalThis.getVariables = () => ({});
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const 配置 = require('../../src/人妻公寓/stageConfig.ts');
const 造型 = require('../../src/人妻公寓/衣柜造型配置.ts');
const 衣柜 = require('../../src/人妻公寓/脚本/游戏逻辑/衣柜系统.ts');
const { 读取医院内容策略 } = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');
const { 格式化游戏内时间 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const clone = value => lodash.cloneDeep(value);

/** 原样执行完整送礼函数。被测库存、固定造型、最终容量及医院/阶段门均为真实实现。
 * 安抚、余波、数据库及角色标记是边界适配器，不在本测试声明PLAY-041或SNAP恢复已验收。 */
function giftApi() {
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('商店系统.ts', source, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === '送礼');
  assert.ok(node, '必须执行当前真实送礼函数');
  const calls = { 安抚: 0, 余波: 0, 记忆: 0 };
  const deps = {
    _: lodash, ...配置, ...衣柜, ...造型, 读取医院内容策略, 格式化游戏内时间,
    getLastMessageId: () => 4,
    事件角色标记: () => '[中性角色标记]',
    推进送礼安抚: () => { calls.安抚++; return { 已推进: false }; },
    记余波: async () => { calls.余波++; },
    同步社交轨迹: () => { calls.记忆++; },
  };
  const js = ts.transpileModule(node.getText(ast), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const api = Function('deps', `const {${Object.keys(deps).join(',')}} = deps; const exports = {}; ${js}; return 送礼;`)(deps);
  return { api, calls };
}

function dataFor(m = '101', pregnant = false, gift = '婚纱') {
  const data = Schema.parse({ 户: Object.fromEntries(配置.门牌列表.map(id => [id, 创建户节点(0)])) });
  for (const id of 配置.门牌列表) {
    Object.assign(data.户[id].妻, 配置.户静态表[id].初始, { 当前阶段: 5 });
    data.户[id].妻.裂缝.已确认 = true;
  }
  const wife = data.户[m].妻;
  if (pregnant) wife._怀孕.状态 = '已告知';
  wife.特殊 = 造型.衣柜可见佩饰SKU.filter(id => id !== gift).slice(0, 4).map(id => 配置.查道具(id).服饰.穿着描述);
  data.背包 = [gift];
  // 静态初始对象另含展示专用字段；夹具与真实重载一样先经过Schema规范化。
  return Schema.parse(data);
}

for (const m of 配置.门牌列表) {
  for (const pregnant of [false, true]) {
    test(`PLAY-010 ${m}/${pregnant ? '孕态' : '普通'}：五种造型按实际成品与最终容量裁定`, async () => {
      for (const id of 造型.衣柜可见佩饰SKU) {
        const data = dataFor(m, pregnant, id), wife = data.户[m].妻;
        assert.equal(wife.特殊.length, 4);
        const outfit = 造型.读取衣柜造型(配置.户静态表[m].妻名, id, pregnant);
        if (!outfit) {
          // 清单实际未提供的造型不伪造成品：维持共享执行器的缺图/普通追加容量语义。
          const before = clone(data), { api, calls } = giftApi();
          const direct = 衣柜.应用赠礼穿戴(clone(data), m, id);
          assert.equal(direct.成功, false);
          assert.equal((await api(data, id, m)).成功, false);
          assert.deepEqual(data, before); assert.deepEqual(calls, { 安抚: 0, 余波: 0, 记忆: 0 });
          continue;
        }
        for (const needed of [outfit.主服装, outfit.妆容SKU, ...outfit.特殊SKU].filter(x => x && x !== id)) {
          衣柜.登记衣柜赠礼(wife, needed);
        }
        const before = clone(data), originalInventory = 衣柜.读取衣柜库存(wife);
        const expected = clone(data);
        const direct = 衣柜.应用赠礼穿戴(expected, m, id);
        assert.equal(direct.成功, true, '共享造型执行器对同一候选本来就允许替换');
        const { api, calls } = giftApi();
        const result = await api(data, id, m);
        assert.equal(result.成功, true, result.提示);
        assert.equal(data.背包.includes(id), false);
        for (const key of ['外装', '内衣', '妆容', '特殊', '_穿着SKU', '_穿戴锁', '_衣柜']) {
          assert.deepEqual(wife[key], expected.户[m].妻[key], `送礼与共享衣柜执行器的${key}必须一致`);
        }
        assert.ok(wife.特殊.length <= 4);
        for (const oldId of originalInventory) assert.ok(衣柜.读取衣柜库存(wife).includes(oldId));
        for (const other of 配置.门牌列表.filter(x => x !== m)) assert.deepEqual(data.户[other], before.户[other]);
        assert.equal(data.现金, before.现金);
        assert.equal(data.系统._绝对时段, before.系统._绝对时段);
        assert.equal((data.系统._待发送事件.match(/【首穿】/g) ?? []).length, 1);
        assert.deepEqual(calls, { 安抚: 1, 余波: 0, 记忆: 0 }, '提交后副作用尚未运行');
        const saved = Schema.parse(JSON.parse(JSON.stringify(data)));
        assert.deepEqual(saved.户[m].妻.特殊, wife.特殊);
        const repeated = clone(data);
        repeated.背包.push(id);
        const repeatedBefore = clone(repeated);
        assert.equal((await api(repeated, id, m)).成功, false, '重复赠送不能再扣一件或重排首穿');
        assert.deepEqual(repeated, repeatedBefore);
      }
    });
  }
}

for (const count of [0, 3, 4]) {
  test(`PLAY-010 ${count}件未知剧情记录：固定造型只按保留后的容量判断`, async () => {
    const data = dataFor(), wife = data.户['101'].妻;
    wife.特殊 = Array.from({ length: count }, (_, i) => `剧情保留记录${i}`);
    const before = clone(data), { api, calls } = giftApi();
    const result = await api(data, '婚纱', '101');
    assert.equal(result.成功, count < 4);
    if (count === 4) {
      assert.deepEqual(data, before); assert.deepEqual(calls, { 安抚: 0, 余波: 0, 记忆: 0 });
    } else {
      for (const record of before.户['101'].妻.特殊) assert.ok(wife.特殊.includes(record));
      assert.equal(wife.特殊.length, count + 1);
    }
  });
}

test('PLAY-010 普通特殊槽追加第五件仍失败；卸下一件后重试成功', async () => {
  const item = Object.values(配置.道具表).find(x => x.服饰?.槽 === '特殊' && !造型.需要成品造型(x.id));
  assert.ok(item, '必须使用现有普通追加商品');
  const data = dataFor('101', false, item.id), before = clone(data), { api, calls } = giftApi();
  const result = await api(data, item.id, '101');
  assert.equal(result.成功, false);
  assert.deepEqual(data, before); assert.deepEqual(calls, { 安抚: 0, 余波: 0, 记忆: 0 });
  const worn = 衣柜.读取衣柜物品(data, '101').find(x => x.已穿戴 && x.槽 === '特殊' && x.可卸下);
  assert.ok(worn);
  assert.equal(衣柜.执行衣柜动作(data, { 门牌: '101', 道具id: worn.id, 操作: '卸下' }).成功, true);
  assert.equal((await api(data, item.id, '101')).成功, true);
  assert.equal(data.户['101'].妻.特殊.length, 4);
});

for (const lock of ['佩饰', '外装']) {
  test(`PLAY-010 ${lock}剧情绑定仍阻止固定替换，失败不改库存/事件/背包`, async () => {
    const data = dataFor(), wife = data.户['101'].妻;
    const id = lock === '佩饰' ? 'choker颈环' : '碎花连衣裙';
    if (lock === '外装') {
      衣柜.登记衣柜赠礼(wife, id);
      wife._穿着SKU.外装 = id; wife.外装 = 配置.查道具(id).服饰.穿着描述;
    }
    const clothes = 配置.查道具(id).服饰, had = Object.hasOwn(clothes, '不可卸下'), previous = clothes.不可卸下;
    clothes.不可卸下 = true;
    try {
      const before = clone(data), { api, calls } = giftApi();
      assert.equal((await api(data, '婚纱', '101')).成功, false);
      assert.deepEqual(data, before); assert.deepEqual(calls, { 安抚: 0, 余波: 0, 记忆: 0 });
    } finally {
      if (had) clothes.不可卸下 = previous; else delete clothes.不可卸下;
    }
  });
}

for (const condition of ['阶段不足', '没有物品', '已经拥有', '角色未入住']) {
  test(`PLAY-010 ${condition}仍失败关闭`, async () => {
    const data = dataFor(), wife = data.户['101'].妻;
    if (condition === '阶段不足') wife.当前阶段 = 1;
    if (condition === '没有物品') data.背包 = [];
    if (condition === '已经拥有') 衣柜.登记衣柜赠礼(wife, '婚纱');
    if (condition === '角色未入住') delete data.户['101'];
    const before = clone(data), { api } = giftApi();
    assert.equal((await api(data, '婚纱', '101')).成功, false);
    assert.deepEqual(data, before);
  });
}

test('PLAY-010 成品缺失仍由共享执行器拒绝，不因撤销旧容量前置而假装换装', async () => {
  const manifest = require('../../src/人妻公寓/衣柜造型清单.json');
  const index = manifest.findIndex(x => x.角色 === 配置.户静态表['101'].妻名 && x.道具id === '婚纱' && !x.孕态);
  assert.ok(index >= 0);
  const [removed] = manifest.splice(index, 1);
  try {
    const data = dataFor(), before = clone(data), { api } = giftApi();
    const result = await api(data, '婚纱', '101');
    assert.equal(result.成功, false); assert.deepEqual(data, before);
  } finally { manifest.splice(index, 0, removed); }
});

test('PLAY-010 同候选并发双送只成功一次；回档后按旧快照可重新送出', async () => {
  const data = dataFor(), checkpoint = clone(data), { api } = giftApi();
  const results = await Promise.all([api(data, '婚纱', '101'), api(data, '婚纱', '101')]);
  assert.equal(results.filter(x => x.成功).length, 1);
  assert.equal(data.背包.length, 0);
  assert.equal((data.系统._待发送事件.match(/【首穿】/g) ?? []).length, 1);
  const rollback = Schema.parse(JSON.parse(JSON.stringify(checkpoint)));
  assert.equal((await api(rollback, '婚纱', '101')).成功, true);
  assert.deepEqual(rollback, data);
});

/** 执行真实送礼listener、安全操作、即时开演与落地；宿主队列/存储/生成/世界书为适配器。
 * 场景票建立、幂等与重试使用真实场景剧情模块，不用恒成功函数代替容量或提交门。 */
function hostFixture() {
  const scenes = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
  const selected = new Map();
  let listener;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && ['安全操作', '即时开演', '落地'].includes(node.name?.text)) {
      selected.set(node.name.text, node.getText(ast));
    }
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) &&
        node.expression.expression.getText(ast) === 'eventOn' && node.expression.arguments[0]?.text === '人妻公寓:送礼') {
      listener = node.getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast); assert.equal(selected.size, 3); assert.ok(listener);
  const gift = giftApi();
  const e = {
    state: dataFor(), chat: 'gift-test', epoch: 0, room: '101', present: true,
    busy: false, held: false, writes: 0, attempts: 0, generations: 0, retries: 0,
    failWrite: false, failGenerate: false, generateCancelled: false, beforeWrite: null,
    events: [], validators: new Set(), calls: gift.calls, errors: [],
  };
  let queue = Promise.resolve();
  const deps = {
    _: lodash, ...配置, ...scenes,
    console: { error: (...args) => e.errors.push(args), warn: (...args) => e.errors.push(args) },
    eventOn: (_name, fn) => { e.give = fn; },
    eventEmit: (name, value) => { e.events.push([name, value]); e.onEvent?.(name, value); },
    当前聊天ID: () => e.chat, 当前时间线切换世代: () => e.epoch, 时间线切换协调中: () => false,
    回合进行中: () => e.busy, 前台生成租约持有中: () => e.held,
    读场景: () => ({ 房间id: e.room }), 当前楼层: () => 4,
    妻在当前场景: () => e.present,
    读取最近有效: () => ({ raw: { stat_data: clone(e.state) }, data: clone(e.state) }),
    排队MVU操作: fn => { const next = queue.then(fn); queue = next.catch(() => undefined); return next; },
    登记MVU提交校验: fn => { e.validators.add(fn); return () => e.validators.delete(fn); },
    父亲通话未完成: () => false,
    全局数据库AI租约: { 在结算: () => false }, 手机节拍进行中: () => false, 手机AI生成中: () => false,
    取得前台生成租约: () => {
      if (e.held) return null;
      e.held = true; return { 释放: () => { e.held = false; } };
    },
    送礼: gift.api,
    接入线路: () => {}, // 普通服饰夹具没有活动线路；不声称审过线路推进。
    脚本写入: async (_raw, data) => {
      e.attempts++;
      if (e.beforeWrite) await e.beforeWrite();
      if ([...e.validators].some(valid => !valid())) throw new Error('controlled invalid transaction');
      if (e.failWrite) throw new Error('controlled save failure');
      e.state = clone(data); e.writes++;
    },
    同步全部角色阶段世界书: async () => {}, 捕获保护快照: () => {},
    持久标记场景剧情待重试: async (id, epoch, valid) => {
      if (valid && !valid()) return false;
      e.retries++; return scenes.标记场景剧情待重试(e.state, id, epoch);
    },
    执行回合: async (_action, options) => {
      e.generations++; options.预占前台生成租约.释放();
      if (e.failGenerate) throw new Error('controlled provider failure');
      if (e.generateCancelled) return false;
      const ticket = e.state.系统._场景剧情事务;
      assert.equal(scenes.提交场景剧情成功(e.state, ticket.内容, ticket.id, ticket.请求世代), true);
      return true;
    },
  };
  const js = ts.transpileModule([...selected.values(), listener].join('\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const runtimeDeps = 装配真实时间事务门(deps);
  Function(...Object.keys(runtimeDeps), js)(...Object.values(runtimeDeps));
  e.submit = () => e.give({ 门牌: '101', 道具id: '婚纱' });
  return e;
}

for (const mode of ['成功', '保存失败', '忙态', '不在场', '生成失败', '生成取消']) {
  test(`PLAY-010 实际送礼提交壳：${mode}`, async () => {
    const e = hostFixture(), before = clone(e.state);
    e.failWrite = mode === '保存失败'; e.busy = mode === '忙态'; e.present = mode !== '不在场';
    e.failGenerate = mode === '生成失败'; e.generateCancelled = mode === '生成取消';
    await e.submit();
    if (['保存失败', '忙态', '不在场'].includes(mode)) {
      assert.equal(e.writes, 0); assert.deepEqual(e.state, before);
      assert.equal(e.calls.余波, 0); assert.equal(e.calls.记忆, 0); assert.equal(e.generations, 0);
    } else {
      assert.equal(e.writes, 1); assert.equal(e.state.背包.length, 0);
      assert.equal(e.state.户['101'].妻._穿着SKU.外装, '婚纱');
      assert.equal(e.calls.余波, 1); assert.equal(e.calls.记忆, 1);
      assert.equal(e.generations, 1);
      if (mode !== '成功') {
        assert.equal(e.retries, 1);
        assert.equal(e.state.系统._场景剧情事务.状态, '待重试', '演出失败保留已保存业务与同一首穿票，不诱导再次扣礼物');
      }
    }
    assert.equal(e.held, false); assert.equal(e.validators.size, 0);
  });
}

for (const mode of ['切聊', '回档世代', '换房']) {
  test(`PLAY-010 业务候选产生期间${mode}，迟到结果不写新现场`, async () => {
    const e = hostFixture(), before = clone(e.state);
    e.onEvent = (name, value) => {
      if (name !== '人妻公寓:场景剧情准备状态' || !value.进行中 || value.显示提示 !== false) return;
      if (mode === '切聊') e.chat = 'other-chat';
      if (mode === '回档世代') e.epoch++;
      if (mode === '换房') e.room = '大堂';
    };
    await e.submit();
    assert.equal(e.writes, 0); assert.deepEqual(e.state, before);
    assert.equal(e.calls.余波, 0); assert.equal(e.calls.记忆, 0);
    assert.equal(e.held, false); assert.equal(e.validators.size, 0);
  });
}

test('PLAY-010 保存等待期间换分支，最终提交校验拒绝旧候选且可重试', async () => {
  const e = hostFixture(), before = clone(e.state);
  e.beforeWrite = async () => { e.epoch++; };
  await e.submit();
  assert.equal(e.writes, 0); assert.deepEqual(e.state, before);
  assert.equal(e.calls.余波, 0); assert.equal(e.calls.记忆, 0);
  e.beforeWrite = null;
  await e.submit();
  assert.equal(e.writes, 1); assert.equal(e.calls.余波, 1); assert.equal(e.state.背包.length, 0);
});

test('PLAY-010 同步双击经过实际串行安全壳后只扣一次，失败重试也不丢物', async () => {
  const e = hostFixture(), before = clone(e.state);
  e.failWrite = true;
  await e.submit(); assert.deepEqual(e.state, before); assert.equal(e.writes, 0);
  e.failWrite = false;
  await Promise.all([e.submit(), e.submit()]);
  assert.equal(e.writes, 1); assert.equal(e.generations, 1);
  assert.equal(e.calls.余波, 1); assert.equal(e.calls.记忆, 1);
  assert.equal(e.state.背包.length, 0); assert.equal(e.held, false);
});
