/* eslint-disable import-x/no-nodejs-modules -- PLAY-016，真实日常票/提交及宿主入口，外部I/O隔离。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { 装配真实时间事务门 } from './helpers/时间事务门装配.mjs';
import * as ts from 'typescript';
import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 80;
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const daily = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚后日常系统.ts');
const divorce = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
const scenes = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const source = name => readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${name}.ts`, import.meta.url), 'utf8');
const hostSource = source('index');
const engineSource = source('回合引擎');
const engineAst = ts.createSourceFile('engine.ts', engineSource, ts.ScriptTarget.Latest, true);
const hostAst = ts.createSourceFile('host.ts', hostSource, ts.ScriptTarget.Latest, true);
const clone = value => lodash.cloneDeep(value);

function select(ast, predicate) {
  const result = [];
  function visit(node) { if (predicate(node)) result.push(node); ts.forEachChild(node, visit); }
  visit(ast); return result;
}
function functionText(ast, name) {
  const nodes = select(ast, n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.equal(nodes.length, 1, name); return nodes[0].getText(ast);
}
function execute(text, deps, expression = '') {
  const js = ts.transpileModule(`${text}\n${expression ? `module.exports = ${expression};` : ''}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  const runtimeDeps = 装配真实时间事务门(deps);
  Function('module', 'exports', ...Object.keys(runtimeDeps), js)(module, module.exports, ...Object.values(runtimeDeps));
  return module.exports;
}
function declarationText(ast, name) {
  const nodes = select(ast, n => ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(ast) === name));
  assert.equal(nodes.length, 1, name); return nodes[0].getText(ast);
}
function callText(ast, name) {
  const nodes = select(ast, n => ts.isCallExpression(n) && n.expression.getText(ast) === name);
  assert.equal(nodes.length, 1, name); return nodes[0].getText(ast);
}

function fresh(relation = '继续关系', theme = 0) {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: 3 } });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].夫._居住模式 = '正式退居';
  Object.assign(data.系统._许曼君分居, { 阶段: '已完成', 玩家最终关系选择: relation, 留宿201权限: relation !== '退出关系' });
  Object.assign(data.系统._许曼君离婚, { 阶段: '已完成', 法律离婚已成立: true, 赵国强正式退居: true, 换锁完成: true });
  data.系统._许曼君离婚后日常.累计次数 = theme;
  return data;
}
const bodies = {
  D1: { 给自己改衣服: '她检查衣摆，用粉笔标出尺寸。', 重排201: '她用卷尺量柜子与桌面，标出动线。', 给自己留一笔生活钱: '她核对固定支出，在账本旁圈出需要的额度。' },
  D2: { 给自己改衣服: '她把衣摆重新缝好，试穿确认合身。', 重排201: '她挪好柜子，全部物件归位，确认201动线落定。', 给自己留一笔生活钱: '她在明账里固定留下自己的生活钱。' },
};
function prepare(data, action, floor) {
  const result = daily.执行许曼君离婚后日常动作(data, action, '201', floor);
  assert.equal(result.成功, true, result.提示);
  const activation = scenes.激活新增场景剧情(data, { 内容: result.事件, 目标场景: '201', 行动: action, 触发楼层: floor });
  assert.equal(activation.成功, true, activation.提示);
  return activation.事务.内容;
}
function capture(data, event, sourceFloor, resultFloor) {
  // 修前版本没有新提交锚；不替换已有提交器，原生产调用将真实重现错误。
  return daily.冻结许曼君日常提交锚?.(data, event, sourceFloor, resultFloor);
}
function submitFromProduction(data, event, floor, anchor, native = false, body) {
  const ticket = daily.解析许曼君离婚后日常事件(event);
  const deps = {
    ...daily, newStat: data, newData: data, 本楼事件: event,
    正文: body ?? bodies[ticket.拍][ticket.主题], 本轮有效正文: body ?? bodies[ticket.拍][ticket.主题],
    回合场景: '201', _本轮场景id: '201', 楼层: floor, 妻在场: ['201'], 夫在场: [],
    _本轮妻在场: ['201'], _本轮夫在场: [], 日常提交锚: anchor, 原生日常提交锚: anchor,
    读场景: () => ({ 房间id: '201' }),
  };
  return execute('', deps, callText(native ? hostAst : engineAst, '提交许曼君离婚后日常事件'));
}

for (const relation of ['继续关系', '暂不承诺', '退出关系']) {
  for (const theme of [0, 1, 2]) {
    test(`PLAY-016 真实生产调用 D1 80→82、D2 82→84：${relation}/${theme}`, () => {
      const data = fresh(relation, theme);
      const action = relation === '退出关系' ? '只处理201房务' : '把决定留给她';
      const event = prepare(data, action, 80);
      const id = daily.解析许曼君离婚后日常事件(event).事件ID;
      const anchor = capture(data, event, 80, 82);
      const result = submitFromProduction(data, event, 82, anchor);
      assert.equal(result.成功, true, result.提示);
      assert.equal(data.系统._许曼君离婚后日常.开始楼层, 82);
      assert.equal(data.系统._许曼君离婚后日常.累计次数, theme);
      assert.equal(data.系统._许曼君离婚后日常.生活整备可用, false);
      const txn = clone(data.系统._场景剧情事务);
      assert.equal(scenes.提交场景剧情成功(data, event, txn.id, txn.请求世代), true);
      data.系统._绝对时段 = 4;
      const second = prepare(data, '把今天这件事做完', 82);
      assert.equal(daily.解析许曼君离婚后日常事件(second).事件ID, id, 'D2承接D1同一事件，不重建ID');
      const secondAnchor = capture(data, second, 82, 84);
      const done = submitFromProduction(data, second, 84, secondAnchor);
      assert.equal(done.成功, true, done.提示);
      const account = data.系统._许曼君离婚后日常;
      assert.equal(account.累计次数, theme + 1);
      assert.equal(account.最近事件楼层, 84);
      assert.equal(account.事件记录[0].发生楼层, 84);
      assert.equal(account.待反馈事件.length, 1);
      assert.equal(account.下次可用时段, 10);
      assert.equal(account.生活整备可用, true);
      const before = clone(data);
      assert.equal(submitFromProduction(data, second, 84, secondAnchor).成功, false);
      assert.deepEqual(data, before);
    });
  }
}

test('PLAY-016 修前正常同楼纯函数对照仍保持，不能拿它替代宿主楼号链', () => {
  const data = fresh();
  const result = daily.执行许曼君离婚后日常动作(data, '把决定留给她', '201', 80);
  assert.equal(daily.提交许曼君离婚后日常事件(data, result.事件, bodies.D1.给自己改衣服, '201', 80, ['201'], []).成功, true);
});

for (const variation of ['错误结果楼', '结果等于来源', '无锚', '空锚', '改来源', '换票', '换事务', '新重试', '转待重试', '改激活楼', '改队首', '时钟变', '关系变']) {
  test(`PLAY-016 失效反例不写任何日常账：${variation}`, () => {
    const data = fresh(); let event = prepare(data, '把决定留给她', 80);
    let anchor = capture(data, event, 80, 82), floor = 82;
    if (variation === '错误结果楼') floor = 83;
    if (variation === '结果等于来源') floor = 80;
    if (variation === '无锚') anchor = undefined;
    if (variation === '空锚') anchor = null;
    if (variation === '改来源') anchor = { ...anchor, 来源楼层: 79 };
    if (variation === '换票') event = event.replace('XMJDAILY-', 'XMJDAILY-other-');
    if (variation === '换事务') data.系统._场景剧情事务.id = 'other-transaction';
    if (variation === '新重试') scenes.准备重试场景剧情(data, '201');
    if (variation === '转待重试') scenes.标记场景剧情待重试(data, data.系统._场景剧情事务.id);
    if (variation === '改激活楼') data.系统._场景剧情事务.触发楼层 = 81;
    if (variation === '改队首') data.系统._待发送事件 = '另一份待演内容';
    if (variation === '时钟变') data.系统._绝对时段 = 4;
    if (variation === '关系变') data.系统._许曼君分居.玩家最终关系选择 = '退出关系';
    const before = clone(data);
    assert.equal(submitFromProduction(data, event, floor, anchor).成功, false);
    assert.deepEqual(data, before);
  });
}

for (const [before, result] of [[79, 82], [80, 80], [80, 79], [NaN, 82], [80, Infinity], [80.5, 82], [80, Number.MAX_SAFE_INTEGER + 1]]) {
  test(`PLAY-016 来源被裁掉或无效目标拒绝冻结：${before}/${result}`, () => {
    const data = fresh(), event = prepare(data, '把决定留给她', 80), saved = clone(data);
    assert.equal(capture(data, event, before, result), null);
    assert.deepEqual(data, saved);
  });
}

for (const altered of ['空正文', '错角色', '丈夫在场', '错地点', 'D1提前完成']) {
  test(`PLAY-016 楼号修复不放宽业务边界：${altered}`, () => {
    const data = fresh(), event = prepare(data, '把决定留给她', 80), anchor = capture(data, event, 80, 82);
    const before = clone(data);
    const result = daily.提交许曼君离婚后日常事件(data, event,
      altered === '空正文' ? '' : altered === 'D1提前完成' ? '她已经把衣服改好。' : bodies.D1.给自己改衣服,
      altered === '错地点' ? '大堂' : '201', 82, altered === '错角色' ? ['101'] : ['201'], altered === '丈夫在场' ? ['201'] : [], anchor);
    assert.equal(result.成功, false); assert.deepEqual(data, before);
  });
}

for (const laterFloor of [80, 83]) {
  test(`PLAY-016 旧票刷新/重试保留原ID，冻结新的结果楼：${laterFloor}`, () => {
    let data = fresh(); const event = prepare(data, '把决定留给她', 80);
    const oldAnchor = capture(data, event, 80, 82);
    const oldID = daily.解析许曼君离婚后日常事件(event).事件ID;
    scenes.标记场景剧情待重试(data, data.系统._场景剧情事务.id);
    data = Schema.parse(JSON.parse(JSON.stringify(data)));
    const retry = scenes.准备重试场景剧情(data, '201'); assert.equal(retry.成功, true);
    assert.equal(retry.事务.内容, event);
    assert.equal(daily.解析许曼君离婚后日常事件(event).事件ID, oldID);
    assert.equal(submitFromProduction(data, event, 82, oldAnchor).成功, false, '旧生成不得认领新世代');
    const anchor = capture(data, event, laterFloor, laterFloor + 2);
    assert.equal(anchor.来源楼层, 80);
    assert.equal(submitFromProduction(data, event, laterFloor + 2, anchor).成功, true);
    assert.equal(data.系统._许曼君离婚后日常.开始楼层, laterFloor + 2);
  });
}

test('PLAY-016 旧未完成等待票通过原场景恢复后继续，不改票号或补造D1', () => {
  const data = fresh(); const start = daily.执行许曼君离婚后日常动作(data, '把决定留给她', '201', 80);
  data.系统._待发送事件 = start.事件;
  const restored = scenes.激活队首场景剧情(data, '201', '继续原日常', 83, true);
  assert.equal(restored.成功, true);
  const event = restored.事务.内容, anchor = capture(data, event, 83, 85);
  assert.equal(daily.解析许曼君离婚后日常事件(event).请求楼层, 80);
  assert.equal(data.系统._许曼君离婚后日常.阶段, '空闲');
  assert.equal(submitFromProduction(data, event, 85, anchor).成功, true);
});

test('PLAY-016 原生消费者使用冻结基底与自身租约，非固定结果间距不硬加2', () => {
  for (const expected of [82, 84]) {
    const data = fresh(); const result = daily.执行许曼君离婚后日常动作(data, '把决定留给她', '201', 80);
    const event = result.事件;
    const anchor = execute(declarationText(hostAst, '原生日常提交锚'), {
      ...daily, _本轮事件基底: clone(data), 本楼事件: event,
      原生租约: { 用户楼层: 81, 预期助手楼层: expected },
    }, '原生日常提交锚');
    assert.equal(anchor.来源楼层, 80); assert.equal(anchor.结果楼层, expected);
    const before = clone(data);
    assert.equal(submitFromProduction(data, event, expected + 1, anchor, true).成功, false);
    assert.deepEqual(data, before);
    assert.equal(submitFromProduction(data, event, expected, anchor, true).成功, true);
  }
});

/** 完整原回合结算函数；非本专题的经济/角色副作用显式隔离，日常及场景队首消费不替换。 */
function settlementApi() {
  const gate = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');
  const deps = { _: lodash, ...daily, ...scenes, ...gate, eventEmit() {},
    静音会议正式运行中: () => false, 前台角色线路无关强剧情已冻结: () => true,
    提交入住登场: () => null, 提交母亲两幕事件: () => [], 提交阶段线路剧情: () => [],
    经济结算: () => [], 同步双重继承时间节点: () => ({}), 同步安若妍不必停时间节点: () => ({}),
    同步安若妍换掉时间节点: () => ({}), 同步许曼君离婚时间节点: () => ({}),
    安若妍不必停事件要求H1开场: () => false, 安若妍换掉事件要求H1开场: () => false,
  };
  for (const name of ['解析阶段性癖开幕事件', '解析不再留门剧情事件', '解析第二机位剧情事件',
    '解析安若妍换掉剧情事件', '解析安若妍不必停剧情事件', '解析许曼君分居剧情事件',
    '解析许曼君离婚剧情事件', '解析回国剧情事件', '解析双重继承剧情事件']) deps[name] = () => null;
  for (const name of ['排入第二机位后续剧情', '排入不再留门后续剧情', '排入安若妍不必停后续剧情',
    '排入许曼君分居后续剧情', '排入回国后续剧情', '排入双重继承后续剧情', '同步302共居状态',
    '同步许曼君离婚完成后状态', '夜访结算', '荣耀洞结算']) deps[name] = () => {};
  return execute(functionText(engineAst, '回合结算'), deps, '回合结算');
}

function lifecycleHost() {
  const e = { state: fresh(), chatID: 'daily-chat', epoch: 0, room: '201', busy: false, held: false,
    chat: Array.from({ length: 81 }, (_, floor) => ({ is_user: floor % 2 === 1, mes: `历史${floor}` })),
    writes: 0, generations: 0, completionWrites: 0, outcome: [], events: [], errors: [], validators: new Set(),
    mode: '', beforeResultWrite: null, beforeGeneration: null,
  };
  const settlement = settlementApi();
  const { 选择本轮事件 } = require('../../src/人妻公寓/脚本/游戏逻辑/入住触发门.ts');
  let queue = Promise.resolve();
  const deps = {
    _: lodash, ...daily, ...divorce, ...scenes, _时间推进中: false, 隔离事件进行中: () => false,
    console: { warn: (...args) => e.errors.push(args), error: (...args) => e.errors.push(args) },
    SillyTavern: { get chat() { return e.chat; } }, getLastMessageId: () => e.chat.length - 1,
    当前聊天ID: () => e.chatID, 当前时间线切换世代: () => e.epoch, 时间线切换协调中: () => false,
    读场景: () => ({ 房间id: e.room }), 回合进行中: () => e.busy, 前台生成租约持有中: () => e.held,
    eventOn: (_name, fn) => { e.action = fn; }, eventEmit: (...args) => e.events.push(args),
    读取最近有效: () => ({ raw: { stat_data: clone(e.state) }, data: clone(e.state) }),
    排队MVU操作: fn => { const p = queue.then(fn); queue = p.catch(() => {}); e.pending = queue; return p; },
    登记MVU提交校验: valid => { e.validators.add(valid); return () => e.validators.delete(valid); },
    父亲通话未完成: () => false, 手机节拍进行中: () => false, 手机AI生成中: () => false,
    全局数据库AI租约: { 在结算: () => false },
    取得前台生成租约: () => {
      if (e.held) return null;
      e.held = true; return { 释放: () => { e.held = false; } };
    },
    脚本写入: async (_raw, data) => {
      if (e.mode === '票保存失败') throw new Error('controlled ticket-save failure');
      if ([...e.validators].some(valid => !valid())) throw new Error('controlled stale write');
      e.state = clone(data); e.writes++;
    },
    同步全部角色阶段世界书: async () => {}, 捕获保护快照: () => {},
    持久标记场景剧情待重试: async (id, epoch, valid) => {
      if (valid && !valid()) return false;
      return scenes.标记场景剧情待重试(e.state, id, epoch);
    },
    // 外部模型、临时消息增删和存储为内存适配器；真实落位计算、冻结表达式、回合结算调用均原样执行。
    执行回合: async (action, options) => {
      e.generations++;
      const origin = { id: e.chatID, epoch: e.epoch, room: e.room, chat: e.chat };
      const valid = () => origin.id === e.chatID && origin.epoch === e.epoch && origin.room === e.room && origin.chat === e.chat;
      const slots = execute(declarationText(engineAst, '回合前末楼') + declarationText(engineAst, '生成楼层'), {
        getLastMessageId: () => e.chat.length - 1,
      }, '({ 回合前末楼, 生成楼层 })');
      const data = clone(e.state), txn = data.系统._场景剧情事务;
      const frozen = 选择本轮事件({ 楼层: slots.生成楼层, 待发送: data.系统._待发送事件,
        活动事务内容: txn.内容, 入住场景可用: false });
      const event = frozen.内容;
      const anchor = execute(declarationText(engineAst, '日常提交锚'), { ...daily, data, 本楼事件: event, ...slots }, '日常提交锚');
      const parsed = daily.解析许曼君离婚后日常事件(event);
      try {
        if (!anchor) throw new Error('invalid generation origin');
        e.chat.push({ is_user: true, mes: action });
        assert.equal(e.chat.length - 1, slots.回合前末楼 + 1);
        if (e.beforeGeneration) await e.beforeGeneration();
        if (['取消', '超时', '模型失败'].includes(e.mode)) throw new Error(`controlled ${e.mode}`);
        if (!valid()) throw new Error('stale generation');
        const text = bodies[parsed.拍][parsed.主题];
        e.chat.push({ is_user: false, mes: text });
        assert.equal(e.chat.length - 1, slots.生成楼层);
        const candidate = clone(data);
        const result = execute('', { 回合结算: settlement, newStat: candidate, 本轮结算基准: data,
          焦点: [], 妻在场: ['201'], 夫在场: [], ...slots, 本轮事件冻结: frozen, 可提交正文: text,
          回合起始场景: '201', 行动: action, 变量重生成派生票据: null,
          当前场景剧情事务ID: txn.id, 选项: options, 日常提交锚: anchor,
        }, callText(engineAst, '回合结算'));
        if (e.beforeResultWrite) await e.beforeResultWrite();
        if (!valid() || [...e.validators].some(check => !check())) throw new Error('stale final storage');
        if (e.mode === '结果保存失败') throw new Error('controlled result-save failure');
        e.state = clone(candidate); e.completionWrites++;
        for (const effect of result.提交后任务) await effect();
        e.outcome.push(true); return true;
      } catch (error) {
        e.errors.push(error); e.outcome.push(false);
        if (origin.chat === e.chat && origin.id === e.chatID) e.chat.splice(slots.回合前末楼 + 1);
        return false;
      } finally { options.预占前台生成租约?.释放(); }
    },
  };
  const names = ['当前楼层', '安全操作', '即时开演', '落地'];
  const listeners = select(hostAst, n => ts.isExpressionStatement(n) && ts.isCallExpression(n.expression) &&
    n.expression.expression.getText(hostAst) === 'eventOn' && n.expression.arguments[0]?.text === '人妻公寓:许曼君离婚后日常动作');
  assert.equal(listeners.length, 1);
  execute(names.map(name => functionText(hostAst, name)).join('\n') + '\n' + listeners[0].getText(hostAst), deps);
  e.run = deps.执行回合;
  e.click = async (action = '把决定留给她') => { e.action(action); await e.pending; };
  e.retry = async () => {
    const retry = scenes.准备重试场景剧情(e.state, '201'); assert.equal(retry.成功, true, retry.提示);
    const success = await e.run(retry.事务.行动, { 场景剧情事务ID: retry.事务.id, 场景剧情请求世代: retry.事务.请求世代 });
    if (!success) scenes.标记场景剧情待重试(e.state, retry.事务.id, retry.事务.请求世代);
    return success;
  };
  return e;
}

test('PLAY-016 真实日常listener→即时开演→回合结算：D1/D2跨楼只在成功持久后推进', async () => {
  const e = lifecycleHost(); await e.click();
  assert.deepEqual(e.outcome, [true], e.errors.map(error => String(error?.stack ?? error)).join('\n'));
  assert.equal(e.state.系统._许曼君离婚后日常.开始楼层, 82);
  assert.equal(e.state.系统._许曼君离婚后日常.累计次数, 0);
  assert.equal(e.state.系统._场景剧情事务.id, '');
  await e.click('把今天这件事做完');
  assert.equal(e.state.系统._许曼君离婚后日常.最近事件楼层, 84);
  assert.equal(e.state.系统._许曼君离婚后日常.累计次数, 1);
  assert.equal(e.state.系统._许曼君离婚后日常.待反馈事件.length, 1);
  assert.equal(e.completionWrites, 2); assert.equal(e.held, false);
});

for (const mode of ['票保存失败', '结果保存失败', '取消', '超时', '模型失败']) {
  for (const beat of ['D1', 'D2']) {
    test(`PLAY-016 ${beat}/${mode}保持检查点和原票，修复故障后只完成一次`, async () => {
      const e = lifecycleHost();
      if (beat === 'D2') await e.click();
      const before = clone(e.state.系统._许曼君离婚后日常);
      e.mode = mode; await e.click(beat === 'D1' ? '把决定留给她' : '把今天这件事做完');
      assert.deepEqual(e.state.系统._许曼君离婚后日常, before);
      assert.equal(e.held, false); assert.equal(e.validators.size, 0);
      const txn = clone(e.state.系统._场景剧情事务);
      if (mode !== '票保存失败') assert.equal(txn.状态, '待重试');
      e.mode = ''; e.state = Schema.parse(JSON.parse(JSON.stringify(e.state)));
      if (mode === '票保存失败') await e.click(beat === 'D1' ? '把决定留给她' : '把今天这件事做完');
      else {
        assert.equal(await e.retry(), true);
        assert.equal(daily.解析许曼君离婚后日常事件(txn.内容).请求楼层, beat === 'D1' ? 80 : 82);
      }
      assert.equal(e.state.系统._许曼君离婚后日常.阶段, beat === 'D1' ? '待收针' : '空闲');
      assert.equal(e.state.系统._许曼君离婚后日常.累计次数, beat === 'D1' ? 0 : 1);
      assert.equal(e.state.系统._许曼君离婚后日常.待反馈事件.length, beat === 'D1' ? 0 : 1);
    });
  }
}

for (const mode of ['切聊', '回档世代', '换房']) {
  for (const phase of ['生成中', '最终存储前']) {
    test(`PLAY-016 ${phase}${mode}后迟到候选不写日常账`, async () => {
      const e = lifecycleHost(), before = clone(e.state.系统._许曼君离婚后日常);
      const change = async () => { if (mode === '切聊') e.chatID = 'other-chat'; if (mode === '回档世代') e.epoch++; if (mode === '换房') e.room = '大堂'; };
      if (phase === '生成中') e.beforeGeneration = change; else e.beforeResultWrite = change;
      await e.click(); assert.deepEqual(e.state.系统._许曼君离婚后日常, before);
      assert.equal(e.completionWrites, 0); assert.equal(e.held, false); assert.equal(e.validators.size, 0);
    });
  }
}

test('PLAY-016 同步双击及忙态不重建日常；回档至D1前可重新完成', async () => {
  const e = lifecycleHost(), original = clone(e.state), oldChat = clone(e.chat);
  e.busy = true; await e.click(); assert.equal(e.generations, 0); assert.deepEqual(e.state, original);
  e.busy = false; e.action('把决定留给她'); e.action('把决定留给她'); await e.pending;
  assert.equal(e.completionWrites, 1);
  await e.click('把今天这件事做完'); assert.equal(e.state.系统._许曼君离婚后日常.累计次数, 1);
  e.epoch++; e.state = Schema.parse(clone(original)); e.chat = clone(oldChat);
  await e.click(); await e.click('把今天这件事做完');
  assert.equal(e.state.系统._许曼君离婚后日常.累计次数, 1);
  assert.equal(e.state.系统._许曼君离婚后日常.事件记录.length, 1);
});

test('PLAY-016 两个消费者缺锚均失败；普通场景原生准入限制没有被改掉', () => {
  const data = fresh(), event = prepare(data, '把决定留给她', 80);
  assert.equal(submitFromProduction(data, event, 82, null).成功, false);
  assert.equal(submitFromProduction(data, event, 82, null, true).成功, false);
  const gate = select(hostAst, n => ts.isIfStatement(n) && n.expression.getText(hostAst) === '原生活动场景剧情 || 原生等待票阻塞当前');
  assert.equal(gate.length, 1);
  for (const active of [true, false]) {
    const calls = [];
    const source = `function gate() { ${gate[0].getText(hostAst)} return '继续'; }`;
    const value = execute(source, {
      原生活动场景剧情: active ? { 标题: '201日常' } : null,
      原生等待票阻塞当前: !active, 原生等待场景剧情: { 标题: '201日常', 目标场景: '201' },
      楼层: 82, SillyTavern: { chat: [] }, 原生拒绝停止: () => calls.push('拒绝'), eventEmit: () => {},
    }, 'gate()');
    assert.equal(value, undefined); assert.deepEqual(calls, ['拒绝']);
  }
});
