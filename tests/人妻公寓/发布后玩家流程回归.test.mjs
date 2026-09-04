/* eslint-disable import-x/no-nodejs-modules -- Node-only behavioral regression tests */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const ts = require('typescript');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
const scene = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const returns = require('../../src/人妻公寓/脚本/游戏逻辑/回国系统.ts');
const { 微信消息发送者 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信消息引用.ts');
const read = file => readFileSync(new URL(`../../src/人妻公寓/${file}`, import.meta.url), 'utf8');

function extractFunction(source, name, globals) {
  const ast = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
  let found;
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(found, name);
  const js = ts.transpileModule(found.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return Function(...Object.keys(globals), `${js}; return ${name};`)(...Object.values(globals));
}

function breakfast() {
  const data = Schema.parse({
    户: { 302: 创建户节点(0) },
    系统: { _绝对时段: 36, _双重继承: { 阶段: '等待三日早餐', 最早早餐日: 6 } },
  });
  data.户['302'].妻.当前阶段 = 5;
  data.背包.push(route.公寓楼总钥匙ID);
  const start = route.执行双重继承地点动作(data, '家庭早餐', '302', 40);
  assert.equal(start.成功, true);
  const active = scene.激活新增场景剧情(data, { 目标场景: '302', 行动: '一起吃早餐', 触发楼层: 40, 内容: start.事件 });
  assert.equal(active.成功, true);
  return { data, active };
}

test('早餐真实活动票可提交五拍，失败重试和序列化恢复不吞票', () => {
  let { data, active } = breakfast();
  assert.equal(scene.标记场景剧情待重试(data, active.事务.id, active.事务.请求世代), true);
  data = Schema.parse(JSON.parse(JSON.stringify(data)));
  active = scene.准备重试场景剧情(data, '302');
  let count = 0;
  while (count < 5) {
    const ticket = active.事务;
    const result = route.提交双重继承剧情事件(data, ticket.内容, '302', 41 + count++);
    assert.equal(result?.成功, true, result?.提示);
    assert.equal(scene.提交场景剧情成功(data, ticket.内容, ticket.id, ticket.请求世代), true);
    route.排入双重继承后续剧情(data, result);
    if (!result.后续剧情) break;
    active = scene.激活队首场景剧情(data, '302', '回应当前话题', 41 + count);
    assert.equal(active.成功, true);
  }
  assert.equal(count, 5);
  assert.equal(data.系统._双重继承.阶段, '待机场视频');
  assert.equal(data.系统._待发送事件, '');
});

test('早餐的错地点、变时段、其他活动票与旧重试世代仍被拒绝', () => {
  for (const change of [
    data => {
      data.系统._绝对时段 += 1;
    },
    data => {
      data.系统._场景剧情事务.内容 = '其他剧情';
    },
    data => {
      data.系统._父亲通话.标识 = '其他电话';
    },
  ]) {
    const { data, active } = breakfast();
    const content = active.事务.内容;
    change(data);
    const before = lodash.cloneDeep(data);
    assert.equal(route.提交双重继承剧情事件(data, content, '302', 41)?.成功, false);
    assert.deepEqual(data, before);
  }
  const { data, active } = breakfast();
  assert.equal(route.提交双重继承剧情事件(data, active.事务.内容, '管理员室', 41)?.成功, false);
  assert.equal(scene.提交场景剧情成功(data, active.事务.内容, active.事务.id, active.事务.请求世代 + 1), false);
});

test('总钥匙唯一收束可穿过自有剧情锁，真实忙态与其他地点继续拦截', () => {
  const data = Schema.parse({
    系统: { _双重继承: { 阶段: '待总钥匙归位' }, _母亲视频通话终幕: { 标识: '双重继承', 状态: '已完成' } },
    背包: [route.公寓楼总钥匙ID],
  });
  const options = { 最终收束操作可用: { value: true } };
  const room = { value: '302' };
  let sent = 0;
  const add = extractFunction(read('界面/客户端/composables/useRoomActions.ts'), '添加双重继承动作', {
    当前房间: room,
    发送中: { value: true },
    data: { value: data },
    options,
    双重继承地点动作: route.双重继承地点动作,
    事件: { 双重继承动作: () => sent++ },
  });
  const actions = [];
  add(actions, '302');
  assert.equal(actions.length, 1);
  actions[0].做();
  assert.equal(sent, 1);
  options.最终收束操作可用.value = false;
  actions[0].做();
  assert.equal(sent, 1);
  options.最终收束操作可用.value = true;
  room.value = '大堂';
  actions[0].做();
  assert.equal(sent, 1);
});

test('App给唯一钥匙动作传递明确许可，其他忙态不会被该许可覆盖', () => {
  const app = read('界面/客户端/App.vue');
  assert.match(app, /发送中: 场景操作锁,\s*最终收束操作可用,/);
  assert.match(app, /动作 === '归位总钥匙' && 最终收束操作可用\.value/);
  const declaration = app.match(/const 最终收束操作可用 = computed\(([\s\S]*?)\n\);/)[1].replace(/,\s*$/, '');
  const refs = {
    双重继承最终收束锁: { value: true },
    当前房间: { value: '302' },
    发送中: { value: false },
    界面事务提交中: { value: false },
    普通场景剧情功能锁: { value: false },
    录像带前置中: { value: false },
    母亲视频终幕已接通: { value: false },
  };
  const evaluate = () =>
    Function(...Object.keys(refs), '场景移动中', `return (${declaration})();`)(...Object.values(refs), false);
  assert.equal(evaluate(), true);
  for (const name of ['发送中', '界面事务提交中', '普通场景剧情功能锁', '录像带前置中', '母亲视频终幕已接通']) {
    refs[name].value = true;
    assert.equal(evaluate(), false, name);
    refs[name].value = false;
  }
});

test('母亲两条固定消息的新旧键都保持真实发送者，父亲普通消息不误认', () => {
  for (const key of [returns.回国母亲无需收尾消息键, returns.回国母亲确认准备消息键, '回国:父亲会话:母亲确认回国日']) {
    assert.equal(微信消息发送者({ 会话: '父亲', 发: '对方', 键: key, 文: '测试' }, '玩家', '父亲'), '母亲');
  }
  assert.equal(微信消息发送者({ 会话: '父亲', 发: '对方', 文: '测试' }, '玩家', '父亲'), '父亲');
});

test('数据库保护重复扫描不会再写同值disabled，真实外部解锁仍会恢复保护', () => {
  let writes = 0;
  let disabled = false;
  const checkbox = {
    get disabled() {
      return disabled;
    },
    set disabled(value) {
      disabled = value;
      writes++;
    },
    getAttribute: () => 'false',
    setAttribute: () => {},
  };
  const item = {
    querySelector: selector => (selector.includes('label') ? { textContent: 'RQ_剧情事件' } : checkbox),
    dataset: {},
  };
  const panel = { querySelectorAll: () => [item], querySelector: () => ({}) };
  const doc = { querySelectorAll: () => [panel] };
  const scan = extractFunction(read('脚本/游戏逻辑/数据库桥.ts'), '取消新版手动面板受保护选择', {
    是脚本所有权表名: () => true,
    安全点击数据库面板控件: () => assert.fail('不应点击未选中项'),
  });
  scan(doc);
  scan(doc);
  scan(doc);
  assert.equal(writes, 1);
  disabled = false;
  scan(doc);
  assert.equal(writes, 2);
  assert.equal(disabled, true);
});
