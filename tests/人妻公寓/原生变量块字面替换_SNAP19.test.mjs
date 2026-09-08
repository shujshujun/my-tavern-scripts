/* eslint-disable import-x/no-nodejs-modules -- Node-only request transformation regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
globalThis.getVariables = () => ({});
const ts = require('typescript');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 构造AI可写变量视图, 解析候选亲密妻 } = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const target = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === '覆盖原生本轮变量视图');
assert.equal(target.length, 1);
const code = ts.transpileModule(target[0].getText(ast), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const open = '<status_current_variable>';
const close = '</status_current_variable>';
// Full current function and real schema/view producer; no host initialization, model or network.
const transform = new Function('构造AI可写变量视图', 'VARIABLE_VIEW_MARKER', code + '\nreturn 覆盖原生本轮变量视图;')(
  构造AI可写变量视图, open,
);
const stale = '{"户":{"101":{"妻":{"外装":"STALE-VIEW-101"}}}}';
const oldBlock = open + stale + close;
const prefix = '保留前置指令\n';
const suffix = '\n保留后置指令';
const scope = { 妻: ['201'], 夫: [], 亲密妻: [] };

function fixture(value = '灰色外套') {
  const data = Schema.parse({ 户: { 101: 创建户节点(0), 201: 创建户节点(0) } });
  data.户['201'].妻.外装 = value;
  data.户['201'].妻.当前心理想法 = value;
  data.户['201'].夫.当前心理想法 = value;
  return data;
}

function expected(data, range = scope, candidates) {
  return open + '\n' + JSON.stringify(构造AI可写变量视图(data, range, candidates)) + '\n' + close;
}

for (const value of ['灰色外套', '印着$&的外套', '字样$`', "字样$'", '$$徽标', '$1编号', '$<name>字样', '汉字😀与$&并列', '引号"、换行\n和反斜杠\\$&']) {
  for (const shape of ['closed', 'duplicate', 'missing', 'unclosed', 'mixed']) {
    test(`SNAP19 ${shape}/${JSON.stringify(value)}：当前视图逐字插入，旧户不残留`, () => {
      const data = fixture(value);
      const beforeData = _.cloneDeep(data);
      const current = expected(data);
      const oldContent = {
        closed: prefix + oldBlock + suffix,
        duplicate: prefix + oldBlock + '\n中间说明\n' + oldBlock + suffix,
        missing: '只有其它系统规则。',
        unclosed: prefix + open + stale,
        mixed: prefix + oldBlock + '\n中间说明\n' + open + stale,
      }[shape];
      const chat = [{ role: 'system', content: oldContent }];
      transform(chat, data, scope);
      if (shape === 'missing') {
        assert.equal(chat[0].content, oldContent);
        assert.equal(chat.length, 2);
        assert.ok(chat[1].content.endsWith(current));
      } else {
        const wanted = {
          closed: prefix + current + suffix,
          duplicate: prefix + current + '\n中间说明\n' + current + suffix,
          unclosed: prefix + current,
          mixed: prefix + current + '\n中间说明\n' + current,
        }[shape];
        assert.equal(chat.length, 1);
        assert.equal(chat[0].content, wanted);
      }
      const text = chat.map(item => item.content).join('\n');
      assert.equal(text.includes('STALE-VIEW-101'), false);
      for (const match of text.matchAll(/<status_current_variable>\s*([\s\S]*?)\s*<\/status_current_variable>/g)) {
        assert.deepEqual(JSON.parse(match[1]), 构造AI可写变量视图(data, scope));
      }
      assert.deepEqual(data, beforeData);
    });
  }
}

for (const [name, range, candidates] of [
  ['wife', scope, undefined],
  ['husband', { 妻: [], 夫: ['201'], 亲密妻: [] }, undefined],
  ['couple', { 妻: ['201'], 夫: ['201'], 亲密妻: [] }, undefined],
  ['read-only', { 妻: [], 夫: [], 亲密妻: [] }, ['201']],
  ['candidate', scope, ['201']],
  ['foreign-candidate', scope, ['101']],
]) {
  test(`真实权限 ${name} 保留，不借替换扩大后台或只读写权`, () => {
    const data = fixture('字样$&');
    const chat = [{ role: 'system', content: oldBlock }];
    transform(chat, data, range, candidates);
    assert.equal(chat[0].content, expected(data, range, candidates));
    const projected = 构造AI可写变量视图(data, range, candidates);
    assert.equal(Object.hasOwn(projected.户, '101'), false);
    if (name === 'read-only') assert.deepEqual(projected, { 户: {} });
    if (name === 'husband') assert.equal(Object.hasOwn(projected.户['201'], '妻'), false);
    assert.equal(Object.hasOwn(projected, '系统'), false);
    assert.equal(Object.hasOwn(projected, '现金'), false);
  });
}

test('未闭合空块及多次打开但只一次关闭的旧块，按原标签范围修复为当前完整视图', () => {
  const data = fixture();
  for (const content of [prefix + open, prefix + open + stale + open + stale + close]) {
    const chat = [{ role: 'system', content }];
    transform(chat, data, scope);
    assert.deepEqual(chat, [{ role: 'system', content: prefix + expected(data) }]);
  }
});

test('完整旧块之后的不闭合尾块不应被先前成功匹配掩盖', () => {
  const data = fixture();
  const chat = [
    { role: 'system', content: prefix + oldBlock + suffix },
    { role: 'system', content: '另一个前缀\n' + open + stale },
    { role: 'system', content: '其它规则完整保留。' },
  ];
  transform(chat, data, scope);
  assert.equal(chat[0].content, prefix + expected(data) + suffix);
  assert.equal(chat[1].content, '另一个前缀\n' + expected(data));
  assert.equal(chat[2].content, '其它规则完整保留。');
  assert.equal(chat.length, 3);
});

test('user、assistant与多模态system消息保持原样，只有system字符串块可替换', () => {
  const data = fixture('$&');
  const original = [
    { role: 'user', content: oldBlock },
    { role: 'assistant', content: oldBlock },
    { role: 'system', content: [{ type: 'text', text: oldBlock }] },
    { role: 'system', content: null },
  ];
  const chat = _.cloneDeep(original);
  transform(chat, data, scope);
  assert.deepEqual(chat.slice(0, original.length), original);
  assert.equal(chat.length, original.length + 1);
  assert.ok(chat.at(-1).content.endsWith(expected(data)));
});

test('空请求、原本缺块和已经替换后的请求反复执行都只保留原有块数', () => {
  const data = fixture('$&');
  for (const initial of [[], [{ role: 'system', content: '其它规则' }], [{ role: 'system', content: prefix + oldBlock + suffix }]]) {
    const chat = _.cloneDeep(initial);
    transform(chat, data, scope);
    const once = _.cloneDeep(chat);
    transform(chat, data, scope);
    assert.deepEqual(chat, once);
  }
});

test('换聊天或回档使用本次数据与范围，无前一请求缓存或旧演员残留', () => {
  const first = fixture('第一次$&');
  const chatA = [{ role: 'system', content: oldBlock }];
  transform(chatA, first, scope);
  const chatB = [{ role: 'system', content: oldBlock }];
  const second = fixture('回档后普通外套');
  transform(chatB, second, { 妻: [], 夫: ['201'], 亲密妻: [] });
  assert.equal(chatB[0].content, expected(second, { 妻: [], 夫: ['201'], 亲密妻: [] }));
  assert.equal(chatA[0].content, expected(first));
});

test('当前视图构造失败仍抛错，请求不发生半替换，下次可用数据可以重试', () => {
  const data = fixture();
  const chat = [{ role: 'system', content: oldBlock }];
  const before = _.cloneDeep(chat);
  const broken = { get 户() { throw new Error('test-current-view-unavailable'); } };
  assert.throws(() => transform(chat, broken, scope), /test-current-view-unavailable/);
  assert.deepEqual(chat, before);
  transform(chat, data, scope);
  assert.equal(chat[0].content, expected(data));
});

test('当前真实调用门：外置模式不调用，非外置模式才执行原生兼容覆盖', () => {
  const gates = [];
  function visit(node) {
    if (ts.isIfStatement(node) && node.expression.getText(ast) === '!读取MVU解析状态().外置模式' &&
      node.thenStatement.getText(ast).includes('覆盖原生本轮变量视图')) gates.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(gates.length, 1);
  const gateCode = ts.transpileModule(gates[0].getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const gate = new Function('读取MVU解析状态', '覆盖原生本轮变量视图', '解析候选亲密妻', 'chat', '演出data', '_本轮变量范围', gateCode);
  const data = fixture('$&');
  for (const external of [true, false]) {
    const chat = [{ role: 'system', content: oldBlock }];
    gate(() => ({ 外置模式: external }), transform, 解析候选亲密妻, chat, data, scope);
    assert.equal(chat[0].content, external ? oldBlock : expected(data, scope, 解析候选亲密妻(scope)));
  }
});
