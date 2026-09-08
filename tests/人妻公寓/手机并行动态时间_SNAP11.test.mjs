/* eslint-disable import-x/no-nodejs-modules -- 时态与单事件钩子技术验证，模型仅返回普通中性文案。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { clone, productionFunction } from './helpers/微信事务恢复环境.mjs';
import { createTickHost } from './helpers/手机并行动态调度_SNAP11.mjs';

const base = fileURLToPath(new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url));
function extract(e, file, name, overrides = {}) {
  const full = path.join(base, file), ast = ts.createSourceFile(file, readFileSync(full, 'utf8'), ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name); assert.ok(node, name);
  const ids = new Set(); function visit(n) { if (ts.isIdentifier(n)) ids.add(n.text); ts.forEachChild(n, visit); } visit(node);
  const deps = { ...e.globals, ...overrides };
  for (const declaration of ast.statements) {
    if (!ts.isImportDeclaration(declaration) || declaration.importClause?.isTypeOnly) continue;
    const bindings = declaration.importClause?.namedBindings; if (!bindings || !ts.isNamedImports(bindings)) continue;
    const used = bindings.elements.filter(x => !x.isTypeOnly && ids.has(x.name.text) && !(x.name.text in deps)); if (!used.length) continue;
    const resolved = path.resolve(path.dirname(full), declaration.moduleSpecifier.text);
    const module = e.load(path.relative(base, existsSync(resolved + '.ts') ? resolved + '.ts' : resolved));
    for (const item of used) deps[item.name.text] = module[(item.propertyName ?? item.name).text];
  }
  return productionFunction(file, name, deps);
}
function fixture(current = 3, event = 3) {
  const e = createTickHost();
  const data = e.st.chat.at(-1).stat_data; data.系统._绝对时段 = event;
  data.户 = { 101: data.户['101'] }; data.户['101'].妻.当前阶段 = 5; data.户['101'].妻.裂缝.已确认 = true;
  const lifecycle = e.load('荣耀洞.ts');
  lifecycle.使用荣耀洞(data, 4); assert.equal(data.系统._荣耀洞门牌, '101');
  for (let i = 0; i < 6 && data.系统._荣耀洞拍 >= 0; i++) lifecycle.推进荣耀洞隔离拍(data);
  assert.equal(data.系统._荣耀洞动态门牌, '101'); assert.equal(data.系统._荣耀洞动态时段, event);
  data.系统._绝对时段 = current;
  e.st.chat.at(-1).stat_data = e.load('../../schema.ts').Schema.parse(JSON.parse(JSON.stringify(data)));
  e.calls = []; e.active = true;
  const overrides = {
    小生成: async (system, user) => { e.calls.push({ system, user }); await e.onGenerate?.(); return e.empty ? '' : '今天这杯茶的余味很好。'; },
    人设段: async () => '', 妻状态包: () => '',
  };
  overrides.微信短文本 = extract(e, '手机/生成引擎.ts', '微信短文本');
  overrides.校验朋友圈文案 = extract(e, '手机/节拍引擎.ts', '校验朋友圈文案');
  e.producer = extract(e, '手机/节拍引擎.ts', '荣耀洞专属动态', overrides);
  e.specialProducer = e.producer;
  e.run = async () => {
    const db = e.api.读库();
    const outcome = await e.producer({ data: clone(e.st.chat.at(-1).stat_data), 库: db, 楼: 4, 钟: e.clock(), 时间线仍有效: () => e.active });
    return { outcome, db };
  };
  return e;
}
test('SNAP11 即时仍可承接当下余波，记录发生与发布时间', async () => {
  const e = fixture(); const { outcome, db } = await e.run();
  assert.equal(outcome, '有新'); assert.equal(db.圈[0].时, 3);
  assert.match(e.calls[0].user, /刚完整参与/);
  assert.match(e.calls[0].user, /事件发生绝对时段/);
});
test('SNAP11 延迟120时段的实际请求使用回忆口径，仍只保存一次', async () => {
  const e = fixture(123); const { outcome, db } = await e.run();
  assert.equal(outcome, '有新'); assert.equal(db.圈[0].时, 123);
  assert.equal(/刚经历|刚完整参与|身体和情绪的余韵还在/.test(e.calls[0].system + e.calls[0].user), false);
  assert.match(e.calls[0].user, /事件发生绝对时段[^\d]+3/); assert.match(e.calls[0].user, /当前发布绝对时段[^\d]+123/);
  assert.equal(await e.api.写库增量({ 新圈: db.圈, 新消息: [], 节拍改: db.节拍 }), true);
  assert.equal((await e.run()).outcome, '无新'); assert.equal(e.calls.length, 1);
});
test('SNAP11 回档到事件之前不发未来事件，不消费钩子', async () => {
  const e = fixture(2); const { outcome, db } = await e.run();
  assert.equal(outcome, '无新'); assert.equal(e.calls.length, 0); assert.equal(Object.keys(db.节拍).length, 0);
  assert.equal(e.st.chat.at(-1).stat_data.系统._荣耀洞动态时段, 3);
});
test('SNAP11 真实手机调度关闭频率后重开，读取同一钩子的发生时间', async () => {
  const e = fixture(123); e.frequency = '关'; await e.tick();
  assert.equal(e.calls.length, 0); assert.equal(e.api.读库().圈.length, 0);
  e.frequency = '普通'; await e.tick();
  assert.equal(e.calls.length, 1); assert.equal(e.api.读库().圈.length, 1);
  assert.equal(/刚经历|刚完整参与/.test(e.calls[0].system + e.calls[0].user), false);
  await e.tick(); assert.equal(e.calls.length, 1);
});

test('SNAP11 医院按既有规则消费事件水位，出院后不重发且不清钩', async () => {
  const e = fixture(123); const data = e.st.chat.at(-1).stat_data;
  data.户['101'].妻._生产.状态 = '住院中';
  const { outcome, db } = await e.run();
  assert.equal(outcome, '无新'); assert.equal(e.calls.length, 0);
  assert.equal(Object.keys(db.节拍).length, 1);
  await e.api.写库增量({ 新圈: [], 新消息: [], 节拍改: db.节拍 });
  data.户['101'].妻._生产.状态 = '已出院';
  assert.equal((await e.run()).outcome, '无新'); assert.equal(e.calls.length, 0);
  assert.equal(data.系统._荣耀洞动态时段, 3);
});
test('SNAP11 新钩子在请求前覆盖旧钩子，只处理最新事件', async () => {
  const e = fixture(123); e.st.chat.at(-1).stat_data.系统._荣耀洞动态时段 = 123;
  const { outcome, db } = await e.run(); assert.equal(outcome, '有新'); assert.equal(db.圈.length, 1);
  assert.match(e.calls[0].user, /事件发生绝对时段[^\d]+123/);
  assert.equal(Object.hasOwn(db.节拍, e.api.荣耀洞动态节拍键('101', 3)), false);
});
test('SNAP11 请求途中被新钩子覆盖，旧结果不变成历史补发', async () => {
  const e = fixture(123);
  e.onGenerate = () => { e.st.chat.at(-1).stat_data.系统._荣耀洞动态时段 = 123; };
  const { outcome, db } = await e.run();
  assert.equal(outcome, '无新'); assert.equal(db.圈.length, 0); assert.equal(Object.keys(db.节拍).length, 0);
  assert.equal(e.st.chat.at(-1).stat_data.系统._荣耀洞动态时段, 123);
});
test('SNAP11 正常空生成保持原单次去重，不创建永久补发队列', async () => {
  const e = fixture(123); e.empty = true;
  const { outcome, db } = await e.run(); assert.equal(outcome, '无新'); assert.equal(db.圈.length, 0);
  await e.api.写库增量({ 新圈: [], 新消息: [], 节拍改: db.节拍 });
  assert.equal((await e.run()).outcome, '无新'); assert.equal(e.calls.length, 1);
});
test('SNAP11 真实调度的迟到结果不能进入已切换聊天', async () => {
  const e = fixture(123); e.onGenerate = () => { e.id = 'other-chat'; };
  await e.tick(); assert.equal(e.calls.length, 1); assert.equal(e.api.读库().圈.length, 0);
});
