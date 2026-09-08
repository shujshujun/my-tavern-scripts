/* eslint-disable import-x/no-nodejs-modules -- Isolated real controller/generator/lease/wait; no player host or model requests. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { clone, createHost } from './helpers/微信事务恢复环境.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const base = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
const mvuSource = readFileSync(new URL('mvuIO.ts', base), 'utf8');
const queueStart = mvuSource.indexOf('let MVU操作队列:');
const queueEnd = mvuSource.indexOf('/** 读最新楼 stat_data', queueStart);
assert.ok(queueStart >= 0 && queueEnd > queueStart);
const queueJS = ts.transpileModule(mvuSource.slice(queueStart, queueEnd).replace(/^export\s+/gmu, ''), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const indexSource = readFileSync(new URL('index.ts', base), 'utf8');
const tree = ts.createSourceFile('index.ts', indexSource, ts.ScriptTarget.Latest, true);
const callbacks = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(tree) === 'eventOn' &&
      ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === '人妻公寓:父亲通话结束') callbacks.push(node.arguments[1]);
  ts.forEachChild(node, visit);
}
visit(tree);
assert.equal(callbacks.length, 1, 'Use the one actual production end callback');
const endJS = ts.transpileModule(`const callback = ${callbacks[0].getText(tree)};`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
const good = '<回复>最近睡得还好吗？记得按时吃饭。</回复>';

function fixture(options = {}) {
  const e = createHost();
  const schema = e.load('../../schema.ts');
  e.id = 'play042-isolated';
  e.epoch = 0;
  e.generations = [];
  e.stops = [];
  e.allStops = 0;
  e.events = [];
  e.endings = [];
  e.writes = 0;
  e.page = 'talk';
  let now = 0, serial = 0;
  const timers = new Map();
  const flush = async () => { for (let i = 0; i < 100; i++) await Promise.resolve(); };
  e.globals.setTimeout = (cb, ms = 0) => { const key = ++serial; timers.set(key, { cb, at: now + ms }); return key; };
  e.globals.clearTimeout = key => timers.delete(key);
  e.advance = async ms => {
    const target = now + ms;
    await flush();
    for (let steps = 0; ; steps++) {
      const next = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      assert.ok(steps < 2000, 'No uncontrolled retry/timer loop');
      now = next[1].at;
      timers.delete(next[0]);
      next[1].cb();
      await flush();
    }
    now = target;
    await flush();
  };
  const override = (file, exports) => e.modules.set(fileURLToPath(new URL(file, base)), { exports });
  const timeline = { 当前时间线切换世代: () => e.epoch };
  override('时间线切换协调.ts', timeline);
  const queueDeps = { ...e.globals, ...e.load('时间事务写入门.ts'), ...timeline };
  const queue = Function(...Object.keys(queueDeps), `${queueJS};return { 排队MVU操作, 登记MVU提交校验, 确认MVU提交仍有效 };`)(...Object.values(queueDeps));
  const mvu = {
    ...queue,
    读最近有效stat: () => clone(e.st.chat.at(-1)?.stat_data),
    读取最近有效: () => ({ raw: {}, data: schema.Schema.parse(e.st.chat.at(-1).stat_data) }),
    脚本写入: async (_raw, data) => {
      e.writes++;
      if (e.failWrite) throw new Error('TEST_MVU_WRITE_FAILED');
      queue.确认MVU提交仍有效();
      e.st.chat.at(-1).stat_data = clone(data);
    },
  };
  e.queue = queue;
  override('mvuIO.ts', mvu);
  override('守护系统.ts', { 捕获保护快照() {} });
  override('手机/静音会议旁路.ts', { 获取静音会议手机状态: () => ({ 场景中: false }) });
  override('手机/配置.ts', { 读配置: () => ({ ai来源: options.source ?? '正文', base: 'https://invalid.example', key: 'isolated', model: 'isolated' }) });
  e.db = e.load('数据库AI租约.ts').全局数据库AI租约;
  const model = payload => {
    const request = { ...deferred(), payload };
    e.generations.push(request);
    return request.promise;
  };
  e.globals.generateRaw = model;
  e.globals.stopGenerationById = id => {
    e.stops.push(id);
    if (options.stop === 'throw') throw new Error('TEST_STOP_FAILED');
    return options.stop !== 'false';
  };
  if (options.stop === 'missing') delete e.globals.stopGenerationById;
  e.globals.stopAllGeneration = () => { e.allStops++; };
  // Actual DB lease preserves the uncancellable provider boundary; only plugin/network I/O is adapted.
  override('数据库桥.ts', {
    数据库状态: () => ({ 可调用AI: options.source === '数据库' }),
    通过数据库生成: (messages, _system, max_tokens) => e.db.执行(messages, { max_tokens }, () => model({ database: true })),
    同步社交轨迹: async () => '已确认',
  });
  e.globals.eventEmit = (name, ...args) => {
    e.events.push([name, ...args]);
    if (name === '人妻公寓:父亲通话结束') e.endings.push(e.endCallback(...args));
    if (name === '人妻公寓:父亲通话已清理') e.phone.父亲通话已清理(...args);
  };
  const policy = e.load('父亲联络策略.ts');
  e.emptyCall = () => schema.Schema.parse({}).系统._父亲通话;
  e.resetCall = (id = 'call-042', kind = options.kind ?? '普通') => {
    const value = e.emptyCall();
    Object.assign(value, { 标识: id, 期: 1, 状态: '通话中', 主题: '父子近况', 报表: '例行联络：没有异常', 待回复: { 序号: 1, 玩家说: '' }, 下次回复序号: 2 });
    if (kind === '家常模式') value.模式 = policy.双重继承后父亲通话模式;
    if (kind === '家常报表') value.报表 = `${policy.双重继承后家常报表前缀}父子近况`;
    if (kind === '旧家常报表') value.报表 = '结局后家常：父子近况';
    e.st.chat.at(-1).stat_data.系统._父亲通话 = value;
    return value;
  };
  e.call = () => e.st.chat.at(-1).stat_data.系统._父亲通话;
  e.resetCall();
  e.leases = e.load('生成通道互斥.ts');
  e.engine = e.load('手机/生成引擎.ts');
  e.phone = e.load('手机/交互/父亲通话.ts');
  const locks = e.load('父亲通话写租约.ts');
  const deps = {
    ...mvu, ...locks, 当前聊天ID: () => e.id,
    // The outer host operation uses the real global MVU queue. Unrelated gameplay awards are isolated.
    安全操作: task => mvu.排队MVU操作(task), 母亲来电线索: () => null, 上报阶段线路事件: () => [],
    空父亲通话: e.emptyCall, 母亲视频通话模式: e.load('母亲视频通话系统.ts').母亲视频通话模式,
    捕获保护快照() {}, eventEmit: e.globals.eventEmit, console: e.globals.console,
  };
  e.endCallback = Function(...Object.keys(deps), `${endJS};return callback;`)(...Object.values(deps));
  e.phone.注册父亲通话UI端口({ 打开通话页: () => { e.page = 'talk'; }, 返回会话页: () => { e.page = 'chats'; }, 正在通话页: () => e.page === 'talk' });
  e.start = async () => { const task = e.phone.恢复父亲通话(); await flush(); return { task }; };
  e.end = async () => { await e.phone.结束通话(); await flush(); await Promise.all(e.endings); await flush(); };
  e.flush = flush;
  e.close = async () => {
    for (const request of e.generations) request.resolve(good);
    await flush();
    timers.clear();
  };
  e.fork = () => {
    e.modules.delete(fileURLToPath(new URL('手机/交互/父亲通话.ts', base)));
    return e.load('手机/交互/父亲通话.ts');
  };
  return e;
}

for (const kind of ['普通', '家常模式', '家常报表', '旧家常报表']) {
  for (const source of ['正文', '自定义']) {
    for (const phase of ['首句', '应答']) {
      test(`PLAY-042 ${kind}/${source}/${phase}：真实挂断后无须等待提供方便释放本请求`, async t => {
        const e = fixture({ kind, source }); t.after(e.close);
        if (phase === '应答') { e.call().待回复 = { 序号: 0, 玩家说: '' }; e.call().记录 = [{ 谁: '父', 文: '最近怎么样？' }]; }
        const task = phase === '首句' ? e.phone.恢复父亲通话() : e.phone.通话应答('最近一切都好。');
        await e.flush();
        assert.equal(e.generations.length, 1);
        assert.equal(e.leases.取得前台生成租约(), null);
        const id = e.generations[0].payload.generation_id;
        await e.end();
        assert.equal(e.call().标识, '');
        assert.equal(e.api.读库().消息.filter(m => m.键 === '父亲通话:call-042').length, 1);
        await e.advance(251);
        assert.equal(e.leases.手机生成租约持有中(), false);
        assert.deepEqual(e.stops, [id]);
        assert.equal(e.allStops, 0);
        const front = e.leases.取得前台生成租约(); assert.ok(front);
        e.generations[0].resolve(good); await task; await e.flush();
        assert.equal(e.call().标识, '');
        assert.equal(e.leases.前台生成租约持有中(), true);
        assert.equal(e.generations.length, 1);
        assert.equal(e.events.some(x => x[0] === '人妻公寓:提示' && /信号断/u.test(x[1])), false);
        front.释放();
      });
    }
  }
}

for (const stop of ['false', 'throw', 'missing']) {
  test(`PLAY-042 按ID停止${stop}：本地仍释放，禁止回退全局停止`, async t => {
    const e = fixture({ stop }); t.after(e.close); const { task } = await e.start();
    await e.end(); await e.advance(251);
    assert.equal(e.leases.手机生成租约持有中(), false);
    assert.equal(e.allStops, 0); await task;
  });
}

for (const change of ['聊天', '时间线', '通话标识', '序号', '玩家原话', '模式']) {
  test(`PLAY-042 ${change}变化：旧请求取消但不写入新通话`, async t => {
    const e = fixture(); t.after(e.close); const { task } = await e.start();
    if (change === '聊天') e.id = 'another-chat';
    if (change === '时间线') e.epoch++;
    if (change === '通话标识') e.resetCall('new-call');
    if (change === '序号') e.call().待回复.序号++;
    if (change === '玩家原话') e.call().待回复.玩家说 = '新的原话';
    if (change === '模式') e.call().模式 = e.load('父亲联络策略.ts').双重继承后父亲通话模式;
    const before = clone(e.call());
    await e.advance(251);
    assert.equal(e.leases.手机生成租约持有中(), false);
    assert.deepEqual(e.call(), before);
    e.generations[0].resolve(good); await task;
    assert.deepEqual(e.call(), before);
  });
}

test('PLAY-042 新通话与其他手机令牌：旧请求释放不得清新请求', async t => {
  const e = fixture(); t.after(e.close); const { task: old } = await e.start();
  const sibling = e.leases.取得手机生成租约(); assert.ok(sibling);
  e.resetCall('new-call'); const { task: next } = await e.start();
  assert.equal(e.generations.length, 2);
  await e.advance(251);
  assert.deepEqual(e.stops, [e.generations[0].payload.generation_id]);
  assert.equal(e.leases.取得前台生成租约(), null);
  e.generations[0].resolve(good); await old;
  e.generations[1].resolve(good); await next;
  assert.equal(e.call().记录.length, 1);
  assert.equal(e.leases.手机生成租约持有中(), true);
  sibling.释放(); assert.equal(e.leases.手机生成租约持有中(), false);
});

test('PLAY-042 相同通话ID与序号重建：旧finally不得清新实例请求身份', async t => {
  const e = fixture(); t.after(e.close); const { task: old } = await e.start();
  await e.end(); e.resetCall(); const { task: next } = await e.start();
  assert.equal(e.generations.length, 2);
  await e.advance(251);
  assert.deepEqual(e.stops, [e.generations[0].payload.generation_id]);
  await old; await e.phone.恢复父亲通话();
  assert.equal(e.generations.length, 2);
  e.generations[1].resolve(good); await next;
  assert.equal(e.call().记录.length, 1);
});

test('PLAY-042 旧新模块并行同一待回复：提交一个序号后另一请求及时失效', async t => {
  const e = fixture(); t.after(e.close); const { task: first } = await e.start();
  const other = e.fork(); const second = other.恢复父亲通话(); await e.flush();
  assert.equal(e.generations.length, 2);
  e.generations[0].resolve(good); await first;
  await e.advance(251);
  assert.equal(e.leases.手机生成租约持有中(), false);
  e.generations[1].resolve(good); await second;
  assert.equal(e.call().记录.length, 1);
});

for (const failure of ['提供方', '写入']) {
  test(`PLAY-042 有效通话${failure}失败：保留原待回复并可重试`, async t => {
    const e = fixture(); t.after(e.close); const { task } = await e.start();
    if (failure === '提供方') e.generations[0].reject(new Error('TEST_PROVIDER_FAILURE'));
    else { e.failWrite = true; e.generations[0].resolve(good); }
    await task; assert.equal(e.call().待回复.序号, 1); assert.equal(e.call().记录.length, 0);
    assert.equal(e.leases.手机生成租约持有中(), false);
    e.failWrite = false; const retry = e.phone.恢复父亲通话(); await e.flush();
    assert.equal(e.generations.length, 2); e.generations[1].resolve(good); await retry;
    assert.equal(e.call().记录.length, 1); assert.equal(e.call().待回复.序号, 0);
  });
}

test('PLAY-042 挂断保存失败：仍有效的通话不能被提前取消', async t => {
  const e = fixture(); t.after(e.close); const { task } = await e.start();
  e.failWrite = true; await e.end(); await e.advance(251);
  assert.equal(e.call().状态, '通话中'); assert.equal(e.stops.length, 0);
  assert.equal(e.leases.手机生成租约持有中(), true);
  e.failWrite = false; e.generations[0].resolve(good); await task;
  assert.equal(e.call().记录.length, 1);
});

test('PLAY-042 硬事实变化：保留原有按新事实重试，不当作挂断取消', async t => {
  const e = fixture(); t.after(e.close); const { task } = await e.start();
  e.call().主题 = '身体近况'; await e.advance(251); assert.equal(e.stops.length, 0);
  e.generations[0].resolve(good); await task; await e.flush();
  assert.equal(e.generations.length, 2); assert.equal(e.call().记录.length, 0);
  e.generations[1].resolve(good); await e.flush();
  assert.equal(e.call().记录.length, 1);
});

test('PLAY-042 旧结果已返回但仍在排队：同ID重开后旧提交不能抢占新待回复', async t => {
  const e = fixture(); t.after(e.close); const { task: old } = await e.start();
  const barrier = deferred();
  const held = e.queue.排队MVU操作(() => barrier.promise);
  await e.flush();
  e.generations[0].resolve(good); await e.flush();
  // Another restored instance clears/recreates the persisted identity while this old write is queued.
  e.st.chat.at(-1).stat_data.系统._父亲通话 = e.emptyCall();
  e.phone.父亲通话已清理('call-042', e.id);
  e.resetCall(); const { task: next } = await e.start();
  assert.equal(e.generations.length, 2);
  barrier.resolve(); await held; await old;
  assert.equal(e.call().记录.length, 0);
  assert.equal(e.call().待回复.序号, 1);
  e.generations[1].resolve(good); await next;
  assert.equal(e.call().记录.length, 1);
});

test('PLAY-042 四分钟真实超时分支：只停本请求，持久待回复仍可重试', async t => {
  const e = fixture({ stop: 'false' }); t.after(e.close); const { task } = await e.start();
  await e.advance(e.engine.手机生成等待上限毫秒 + 1); await task;
  assert.equal(e.leases.手机生成租约持有中(), false);
  assert.equal(e.call().待回复.序号, 1);
  assert.equal(e.allStops, 0); assert.equal(e.stops.length, 1);
});

test('PLAY-042 数据库通道：释放手机等待但不伪造不可取消的数据库底层已结束', async t => {
  const e = fixture({ source: '数据库' }); t.after(e.close); const { task } = await e.start();
  assert.equal(e.db.在结算(), true);
  await e.end(); await e.advance(251);
  assert.equal(e.leases.手机生成租约持有中(), false);
  assert.equal(e.db.在结算(), true);
  assert.equal(e.stops.length, 0); assert.equal(e.allStops, 0);
  e.generations[0].resolve(good); await task; await e.flush();
  assert.equal(e.db.在结算(), false); assert.equal(e.call().标识, '');
});

for (const settle of ['成功', '失败']) {
  test(`PLAY-042 挂断后检查定时器尚未触发，提供方${settle}立即返回也不落库或提示重试`, async t => {
    const e = fixture(); t.after(e.close); const { task } = await e.start();
    await e.end();
    if (settle === '成功') e.generations[0].resolve(good);
    else e.generations[0].reject(new Error('TEST_LATE_FAILURE'));
    await task; await e.advance(251);
    assert.equal(e.call().标识, '');
    assert.equal(e.leases.手机生成租约持有中(), false);
    assert.equal(e.events.some(x => x[0] === '人妻公寓:提示' && /信号断/u.test(x[1])), false);
    assert.equal(e.generations.length, 1); assert.equal(e.allStops, 0);
  });
}

test('PLAY-042 关闭手机页面不是挂断：后台有效回复仍正常保存', async t => {
  const e = fixture(); t.after(e.close); const { task } = await e.start();
  e.page = 'chats'; await e.advance(501);
  assert.equal(e.stops.length, 0); assert.equal(e.leases.手机生成租约持有中(), true);
  e.generations[0].resolve(good); await task;
  assert.equal(e.call().记录.length, 1); assert.equal(e.call().待回复.序号, 0);
});

test('PLAY-042 重复恢复和挂断：一次生成、一个完成键、不重复停止', async t => {
  const e = fixture(); t.after(e.close); const { task } = await e.start();
  await e.phone.恢复父亲通话(); assert.equal(e.generations.length, 1);
  await e.end(); await e.end(); await e.advance(751); await task;
  assert.equal(e.stops.length, 1);
  assert.equal(e.api.读库().消息.filter(m => m.键 === '父亲通话:call-042').length, 1);
});

for (const ending of [false, true]) {
  test(`PLAY-042 机场视频共用台词分支：${ending ? '固定告别不新增模型请求' : '有效首句不被取消'}`, async t => {
    const e = fixture(); t.after(e.close);
    const video = e.load('母亲视频通话系统.ts');
    const data = e.st.chat.at(-1).stat_data;
    data.系统._父亲通话 = e.emptyCall();
    assert.equal(video.预约母亲视频通话终幕(data, 'video-042', 4).成功, true);
    assert.equal(video.接听母亲视频通话终幕(data).成功, true);
    if (ending) {
      // Explicit final-checkpoint fixture; not a full video/CG playthrough.
      Object.assign(data.系统._母亲视频通话终幕, { 状态: '结束衔接', 结束请求: true, 最终交接已出现: false });
    }
    const { task } = await e.start();
    if (!ending) {
      assert.equal(e.generations.length, 1); await e.advance(251); assert.equal(e.stops.length, 0);
      e.generations[0].resolve(good);
    }
    await task;
    assert.equal(e.generations.length, ending ? 0 : 1);
    assert.equal(e.call().记录.length, 1); assert.equal(e.call().待回复.序号, 0);
    assert.equal(e.events.filter(x => x[0] === '人妻公寓:母亲视频通话父亲回复已保存').length, 1);
  });
}

test('PLAY-042 其他未选择精确取消的小生成保持原停止兼容，不被本项全局改写', async t => {
  const e = fixture({ stop: 'false' }); t.after(e.close);
  let valid = true;
  const task = e.engine.小生成('普通通讯测试。', '中性测试。', { 仍有效: () => valid, 允许场景剧情期间: true });
  await e.flush(); valid = false; await e.advance(251); await task;
  assert.equal(e.allStops, 1); assert.equal(e.leases.手机生成租约持有中(), false);
});

test('PLAY-042 数据库取消后迟到拒绝：原占用最终释放且不重复调用提供方', async t => {
  const e = fixture({ source: '数据库' }); t.after(e.close); const { task } = await e.start();
  await e.end(); await e.advance(251); await task;
  assert.equal(e.db.在结算(), true);
  e.generations[0].reject(new Error('TEST_LATE_DB_FAILURE')); await e.flush();
  assert.equal(e.db.在结算(), false); assert.equal(e.generations.length, 1);
  assert.equal(e.allStops, 0);
});
