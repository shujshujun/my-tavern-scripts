/* eslint-disable import-x/no-nodejs-modules -- 独立宿主，按实际AST装配完整函数和其真实导入。 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { createHost, productionFunction } from './微信事务恢复环境.mjs';

const base = fileURLToPath(new URL('../../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url));
export function extract(e, file, name, overrides = {}) {
  const full = path.join(base, file);
  const ast = ts.createSourceFile(full, readFileSync(full, 'utf8'), ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, name);
  const identifiers = new Set();
  function visit(n) { if (ts.isIdentifier(n)) identifiers.add(n.text); ts.forEachChild(n, visit); }
  visit(node);
  const deps = { ...e.globals, ...overrides };
  for (const declaration of ast.statements) {
    if (!ts.isImportDeclaration(declaration) || declaration.importClause?.isTypeOnly) continue;
    const bindings = declaration.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const used = bindings.elements.filter(x => !x.isTypeOnly && identifiers.has(x.name.text) && !(x.name.text in deps));
    if (!used.length) continue;
    const resolved = path.resolve(path.dirname(full), declaration.moduleSpecifier.text);
    const module = e.load(path.relative(base, existsSync(resolved + '.ts') ? resolved + '.ts' : resolved));
    for (const item of used) deps[item.name.text] = module[(item.propertyName ?? item.name).text];
  }
  return productionFunction(file, name, deps);
}
export function createPhoneHost() {
  const e = createHost();
  const events = new EventTarget();
  e.window.addEventListener = events.addEventListener.bind(events);
  e.window.removeEventListener = events.removeEventListener.bind(events);
  e.window.document = Object.assign(new EventTarget(), { querySelectorAll: () => [], documentElement: null });
  return e;
}
export function pregnancyKit(e, provider) {
  const file = '手机/节拍引擎.ts';
  const source = readFileSync(path.join(base, file), 'utf8');
  const common = {
    小生成: provider,
    读取群聊记忆上下文: () => ({ 近期消息: [], 最近聊天: '', 群内记忆: '' }),
  };
  common.微信群文本 = extract(e, '手机/生成引擎.ts', '微信群文本');
  const kit = {};
  for (const name of ['已公开孕情成员', '借种产后家庭合照姐妹群键', '构建指定生产事件数据', '读取孕产观察者画像', '生成孕产群后私聊', '姐妹群一拍', '孕产姐妹群必达拍']) {
    if (name === '读取孕产观察者画像' && !source.includes('function ' + name + '(')) continue;
    kit[name] = extract(e, file, name, { ...common, ...kit });
  }
  return kit;
}
