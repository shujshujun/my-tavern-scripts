/* eslint-disable import-x/no-nodejs-modules -- SNAP-28中性换装夹具，只适配提供方和非活动专题。 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { createHost, clone, productionFunction } from './微信事务恢复环境.mjs';

const base = fileURLToPath(new URL('../../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url));
function extract(e, file, name, overrides = {}, locals = {}) {
  const full = path.join(base, file);
  const ast = ts.createSourceFile(full, readFileSync(full, 'utf8'), ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(node, name);
  const identifiers = new Set();
  function walk(n) { if (ts.isIdentifier(n)) identifiers.add(n.text); ts.forEachChild(n, walk); }
  walk(node);
  const deps = { ...e.globals, ...locals, ...overrides };
  for (const declaration of ast.statements) {
    if (!ts.isImportDeclaration(declaration) || !declaration.importClause || declaration.importClause.isTypeOnly) continue;
    const bindings = declaration.importClause.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const used = bindings.elements.filter(x => !x.isTypeOnly && identifiers.has(x.name.text) && !(x.name.text in deps));
    if (!used.length) continue;
    const spec = declaration.moduleSpecifier.text;
    assert.ok(spec.startsWith('.'), `夹具没有外部包适配：${spec}`);
    assert.doesNotMatch(spec, /录像带V4|videoTapeV4/i, '本场景不读取或执行V4内卡');
    const resolved = path.resolve(path.dirname(full), spec);
    const module = e.load(path.relative(base, existsSync(resolved + '.ts') ? resolved + '.ts' : resolved));
    for (const x of used) deps[x.name.text] = module[(x.propertyName ?? x.name).text];
  }
  return productionFunction(file, name, deps);
}

export function consumerKit(e, provider) {
  // 相邻摘要模块的数据库桥在加载时登记pagehide清理；使用本实例事件目标，不触发真实宿主。
  const events = new EventTarget();
  e.window.addEventListener ??= events.addEventListener.bind(events);
  e.window.removeEventListener ??= events.removeEventListener.bind(events);
  e.window.dispatchEvent ??= events.dispatchEvent.bind(events);
  // 本夹具没有数据库手动面板；保留真实扫描/保护逻辑，只提供空DOM查询与事件宿主。
  e.window.document ??= Object.assign(new EventTarget(), { querySelectorAll: () => [], documentElement: null });
  const locals = {};
  const common = {
    小生成: provider,
    读取群聊记忆上下文: () => ({ 近期消息: [], 最近聊天: '', 群内记忆: '' }),
    双重继承结局姐妹群余波一拍: async data => {
      assert.notEqual(data.系统._双重继承.阶段, '已完成'); return null;
    },
  };
  for (const name of ['微信短文本', '微信群文本', '称呼纪律', '家庭事实']) {
    common[name] = extract(e, '手机/生成引擎.ts', name, common);
  }
  for (const name of ['微信好友', '编译楼务群公开风闻摘要']) {
    common[name] = extract(e, '手机/通知桥.ts', name, common);
  }
  common.构造朋友圈长期记忆事件键 = extract(e, '手机/朋友圈长期记忆.ts', '构造朋友圈长期记忆事件键', common);
  for (const name of ['攻略动态提示', '校验朋友圈文案', '选攻略配图', '圈主题', '选发圈主题', '主题配图类',
    '档位标签', '已公开孕情成员', '回国茶话会消息键', '回国茶话会一拍', '姐妹群一拍',
    '朋友圈近期流', '楼务群自动消息', '姐妹群主动拍']) {
    locals[name] = extract(e, '手机/节拍引擎.ts', name, common, locals);
  }
  return locals;
}

export async function createWaveHost({ privateWave = false, age = 3, legacy = false } = {}) {
  const e = createHost();
  for (const message of e.st.chat) for (const household of Object.values(message.stat_data.户)) {
    Object.assign(household.妻, { 当前阶段: 4, 好感值: 60, 堕落值: 40, 上次互动楼层: 4 });
    household.妻.裂缝.已确认 = true;
  }
  e.wave = e.load('雌竞系统.ts');
  await e.wave.记余波('101', '夏乔换上了新外套', privateWave);
  if (legacy) delete e.vars._换装余波.事件ID;
  for (let i = 0; i < age; i++) {
    const message = clone(e.st.chat.at(-1));
    message.extra._rqgy回合令牌 = `wave-${e.st.chat.length}`;
    e.st.chat.push(message);
  }
  await e.api.写库增量({ 新圈: [], 新消息: [], 节拍改: {
    [e.api.朋友圈节拍键('101')]: 20, [e.api.朋友圈节拍键('102')]: 20,
  } });
  await e.api.立即持久保存手机聊天变量(e.id);
  return e;
}

export function provider(kind, calls) {
  return async system => {
    calls.push(kind);
    if (kind === '圈晒') return system.includes('朋友圈的评论')
      ? '沈静仪:新外套的颜色很清爽。' : '新外套穿着很舒服，今天正好试试。';
    if (kind === '探针') return '沈静仪:新外套很合身，是最近买的吗？';
    return '夏乔:新外套穿着很舒服。\n沈静仪:颜色看着挺清爽。';
  };
}

export async function produce(e, kit, kind, valid = () => true) {
  const db = e.api.读库();
  const oldMessages = db.消息.length, oldMoments = db.圈.length, oldBeats = { ...db.节拍 };
  let consumption;
  const outcome = await kit[{ 圈晒: '朋友圈近期流', 探针: '楼务群自动消息', 群议: '姐妹群主动拍' }[kind]]({
    data: clone(e.st.chat.at(-1).stat_data), 库: db, 楼: e.st.chat.length - 1, 钟: e.clock(), 倍: 1,
    冷落中门牌: new Set(), 时间线仍有效: valid,
    登记待提交余波: (wave, flags) => {
      if (consumption && !e.api.余波身份相同(consumption.预期, wave)) return false;
      consumption ??= { 预期: e.api.取余波身份(wave), 标记: {} };
      Object.assign(consumption.标记, flags); return true;
    },
  });
  const delta = {
    新圈: db.圈.slice(0, db.圈.length - oldMoments), 新消息: db.消息.slice(oldMessages),
    节拍改: Object.fromEntries(Object.entries(db.节拍).filter(([key, value]) => value !== oldBeats[key])),
    余波消费: consumption,
  };
  return { outcome, delta, commit: () => outcome === '有新' ? e.api.写库增量(delta, valid) : Promise.resolve(false) };
}
