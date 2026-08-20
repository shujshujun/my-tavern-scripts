/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  规范变量协议候选,
  标准变量块需要本地应用,
} = require('../../src/人妻公寓/脚本/游戏逻辑/变量块协议.ts');
const 引擎源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

const 标准块 = 数组 => `<UpdateVariable>\n<JSONPatch>\n${JSON.stringify(数组, null, 2)}\n</JSONPatch>\n</UpdateVariable>`;

test('变量结算最终系统令只允许 UpdateVariable 包 JSONPatch 的唯一常驻格式', () => {
  const 起点 = 引擎源码.indexOf('const 变量结算基础令 = [');
  const 终点 = 引擎源码.indexOf('].join', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位变量结算基础令');
  const 基础令 = 引擎源码.slice(起点, 终点);

  assert.match(基础令, /<UpdateVariable>/);
  assert.match(基础令, /<JSONPatch>/);
  assert.match(基础令, /<\/JSONPatch>/);
  assert.match(基础令, /<\/UpdateVariable>/);
  assert.match(基础令, /不得省略|禁止省略/);
  assert.match(基础令, /即使[^\n]{0,40}无[^\n]{0,40}变化[^\n]{0,80}<JSONPatch>[^\n]{0,20}\[\][^\n]{0,20}<\/JSONPatch>/);
  assert.doesNotMatch(
    基础令,
    /只输出一个完整且可解析的 <UpdateVariable>\.\.\.<\/UpdateVariable> 块/,
    '最后系统令不能再把只有外层 UpdateVariable 描述成完整格式',
  );
});

test('严格审计开启时，最终系统消息最后一段仍再次收口到标准双层格式', () => {
  assert.match(引擎源码, /const 变量结算格式收口令\s*=/);
  const 起点 = 引擎源码.indexOf('function 当前变量结算令(): string');
  const 终点 = 引擎源码.indexOf('function 清除变量禁区', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位当前变量结算令');
  const 组合段 = 引擎源码.slice(起点, 终点);
  assert.match(组合段, /严格变量审计令[^;]+变量结算格式收口令/);
  assert.match(组合段, /变量结算基础令[^;]+变量结算格式收口令/);
});

test('回合提取器不会再把只有外层标签的任意内容伪报成成功，现代协议入口统一经过规范器', () => {
  const 起点 = 引擎源码.indexOf('function 取变量块(文本: string)');
  const 终点 = 引擎源码.indexOf('function 取尺度判定块', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位取变量块');
  const 提取器 = 引擎源码.slice(起点, 终点);

  assert.doesNotMatch(提取器, /if \(完整\) return 完整;/, '完整外层不能未经校验直接视为成功');
  assert.match(提取器, /规范变量协议候选\(完整\)/);
  assert.match(提取器, /规范变量协议候选\(裸补丁\)/);
  assert.match(提取器, /规范变量协议候选\(数组\)/);
});

test('标准双层块被规范成唯一标准格式，Analysis 等非必要内容不会进入最终变量块', () => {
  const 输入 = `<UpdateVariable>\n<Analysis>brief</Analysis>\n<JSONPatch>\n[{"op":"replace","path":"/户/101/妻/好感值","value":1}]\n</JSONPatch>\n</UpdateVariable>`;
  assert.equal(
    规范变量协议候选(输入),
    标准块([{ op: 'replace', path: '/户/101/妻/好感值', value: 1 }]),
  );
});

test('Gemini 漏掉内层 JSONPatch、只在 UpdateVariable 中放数组时自动补齐标准结构', () => {
  const 输入 = `<UpdateVariable>\n[\n  {"op":"replace","path":"/户/101/妻/当前情绪","value":"热情"}\n]\n</UpdateVariable>`;
  assert.equal(
    规范变量协议候选(输入),
    标准块([{ op: 'replace', path: '/户/101/妻/当前情绪', value: '热情' }]),
  );
});

test('裸 JSONPatch 与裸 RFC6902 数组只作为容错输入，都会归一为同一个标准双层块', () => {
  const 数组 = [{ op: 'replace', path: '/户/101/妻/好感值', value: 2 }];
  assert.equal(规范变量协议候选(`<JSONPatch>${JSON.stringify(数组)}</JSONPatch>`), 标准块(数组));
  assert.equal(规范变量协议候选(JSON.stringify(数组)), 标准块(数组));
  assert.equal(规范变量协议候选('```json\n[]\n```'), 标准块([]));
});

test('完整外层里是解释、对象、非 replace 操作、危险或损坏路径及损坏数组时不得伪报成功，交给上层重试', () => {
  for (const 输入 of [
    '<UpdateVariable>这里没有 JSON Patch</UpdateVariable>',
    '<UpdateVariable>{"op":"replace","path":"/x","value":1}</UpdateVariable>',
    '<UpdateVariable><JSONPatch>[{"op":"replace"}]</JSONPatch></UpdateVariable>',
    '<UpdateVariable><JSONPatch>[{"op":"add","path":"/户/101/妻/好感值","value":1}]</JSONPatch></UpdateVariable>',
    '<UpdateVariable><JSONPatch>[{"op":"remove","path":"/户/101/妻/当前情绪"}]</JSONPatch></UpdateVariable>',
    '<UpdateVariable><JSONPatch>[{"op":"replace","path":"/__proto__/污染","value":1}]</JSONPatch></UpdateVariable>',
    '<UpdateVariable><JSONPatch>[{"op":"replace","path":"/户/constructor/prototype/污染","value":1}]</JSONPatch></UpdateVariable>',
    '<UpdateVariable><JSONPatch>[{"op":"replace","path":"/户/101/妻/~2非法转义","value":1}]</JSONPatch></UpdateVariable>',
    '<UpdateVariable><JSONPatch>[{"op":"replace","path":"/户//妻/好感值","value":1}]</JSONPatch></UpdateVariable>',
    '<UpdateVariable><JSONPatch>[坏掉的JSON]</JSONPatch></UpdateVariable>',
  ]) {
    assert.equal(规范变量协议候选(输入), null);
  }
});

test('标准 replace 补丁可判断官方外置桥是否已经真实应用，避免漏标签假完成与重复应用', () => {
  const 块 = 标准块([
    { op: 'replace', path: '/户/101/妻/好感值', value: 3 },
    { op: 'replace', path: '/户/101/妻/当前情绪', value: '雀跃' },
  ]);
  const 未应用 = { 户: { 101: { 妻: { 好感值: 1, 当前情绪: '平静' } } } };
  const 已应用 = { 户: { 101: { 妻: { 好感值: 3, 当前情绪: '雀跃' } } }, 系统: { 无关字段: 9 } };

  assert.equal(标准变量块需要本地应用(块, 未应用), true);
  assert.equal(标准变量块需要本地应用(块, 已应用), false);
  assert.equal(标准变量块需要本地应用(标准块([]), 未应用), false, '空补丁是已完成信号但无需再次解析');
});

test('JSON Pointer 转义与数组索引按 RFC 6901 比较，缺失目标必须交给本地解析失败关闭', () => {
  const 块 = 标准块([
    { op: 'replace', path: '/带~1斜杠/~0波浪/1', value: '新值' },
  ]);
  assert.equal(标准变量块需要本地应用(块, { '带/斜杠': { '~波浪': ['旧值', '新值'] } }), false);
  assert.equal(标准变量块需要本地应用(块, { '带/斜杠': { '~波浪': ['旧值'] } }), true);
});

test('官方外置桥在插件未应用但提取器已补齐标签时，会把规范块本地应用一次', () => {
  const 起点 = 引擎源码.indexOf("console.info('[人妻公寓] 调用 MVU 官方外置模型解析')");
  const 终点 = 引擎源码.indexOf('const 父亲电话正文基准', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位官方外置变量解析分支');
  const 官方分支 = 引擎源码.slice(起点, 终点);
  assert.match(官方分支, /标准变量块需要本地应用\(/);
  assert.match(引擎源码, /内置解析变量块已就绪 \|\| 官方外置变量块需本地应用/);
});

test('旧 _.set 命令不再作为当前解析模型的第二套格式，统一失败并触发标准协议重试', () => {
  assert.equal(规范变量协议候选('<UpdateVariable>\n_.set("户.101.妻.好感值", 1);\n</UpdateVariable>'), null);
  assert.doesNotMatch(引擎源码, /命令行 = 可解析文本/);
});
