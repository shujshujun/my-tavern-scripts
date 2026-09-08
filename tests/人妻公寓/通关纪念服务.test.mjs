/* eslint-disable import-x/no-nodejs-modules -- Node-only settlement service transaction regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 创建通关纪念服务 } = require('../../src/人妻公寓/脚本/游戏逻辑/通关纪念服务.ts');

function deferred() {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function fresh(ready = false) {
  const data = Schema.parse({
    户: Object.fromEntries(['101', '102', '201', '202', '301', '302'].map(id => [id, 创建户节点(0)])),
  });
  data.系统._序章完成 = true;
  if (ready) {
    for (const item of Object.values(data.户)) item.妻.当前阶段 = 5;
    data.系统._已完成特殊场景 = ['借种', '录像带结局', '角色路线:201:结局剧情', '角色路线:301:结局剧情', '双重继承'];
    data.系统._绝对时段 = 12;
    data.系统._通关纪念.全员完成时段 = 10;
  }
  return data;
}

/** Replace only host I/O; the production service and all settlement calculations run unchanged. */
function host(initial = fresh()) {
  let saved = lodash.cloneDeep(initial);
  const responses = [];
  const events = [];
  const guards = new Set();
  const control = {
    chat: 'chat-a',
    timeline: 'chat-a:branch-1',
    busy: false,
    writing: false,
    missing: false,
    queueGate: null,
    writeGate: null,
    writeError: null,
    queues: 0,
    reads: 0,
    writes: 0,
    protected: 0,
    writeEntered: deferred(),
  };
  const service = 创建通关纪念服务({
    聊天ID: () => control.chat,
    时间线: () => control.timeline,
    忙碌: () => control.busy,
    写入忙碌: () => control.writing,
    场景: () => '管理员室',
    读取: () => {
      control.reads += 1;
      return control.missing ? null : { raw: { stat_data: saved, untouched: 'host-envelope' }, data: saved };
    },
    排队: async task => {
      control.queues += 1;
      if (control.queueGate) await control.queueGate.promise;
      await task();
    },
    登记提交校验: guard => {
      guards.add(guard);
      return () => {
        guards.delete(guard);
      };
    },
    写入: async (raw, data) => {
      assert.equal(raw.untouched, 'host-envelope');
      assert.equal(guards.size, 1, 'the service must register its current timeline guard before writing');
      events.push('write-start');
      control.writeEntered.resolve();
      if (control.writeGate) await control.writeGate.promise;
      if (control.writeError) throw control.writeError;
      // This is the existing MVU host write contract: recheck registered guards at commit time.
      if (![...guards].every(guard => guard())) throw new Error('timeline changed before commit');
      saved = lodash.cloneDeep(data);
      control.writes += 1;
      events.push('write-commit');
    },
    捕获保护: data => {
      assert.deepEqual(data, saved, 'protection snapshot must describe the committed save');
      control.protected += 1;
      events.push('protect');
    },
    合法CG: id => /^cg-\d+$/.test(id),
    响应: result => {
      responses.push(lodash.cloneDeep(result));
      events.push(`response:${result.状态}`);
    },
  });
  return {
    control,
    responses,
    events,
    guards,
    read: () => lodash.cloneDeep(saved),
    request: (fields = {}) => ({
      id: 'settlement-request',
      时间线: 'chat-a:branch-1',
      聊天ID: 'chat-a',
      CG: [],
      允许展示: false,
      ...fields,
    }),
    service,
  };
}

for (const key of ['busy', 'writing']) {
  test(`${key}等待不排队、不修改存档、不确认成绩`, async () => {
    const h = host(fresh(true));
    const before = h.read();
    h.control[key] = true;
    await h.service(h.request({ CG: ['cg-1'], 允许展示: true, 确认评级: 'S' }));
    assert.equal(h.responses[0].状态, '等待');
    assert.equal(h.control.queues, 0);
    assert.equal(h.control.writes, 0);
    assert.deepEqual(h.read(), before);
  });
}

test('排队后正文进入忙态仍等待，不落入已失效的空闲窗口', async () => {
  const h = host(fresh(true));
  h.control.queueGate = deferred();
  const pending = h.service(h.request({ CG: ['cg-1'], 允许展示: true }));
  h.control.busy = true;
  h.control.queueGate.resolve();
  await pending;
  assert.deepEqual(
    h.responses.map(item => item.状态),
    ['等待'],
  );
  assert.equal(h.control.writes, 0);
  assert.equal(h.guards.size, 0);
});

test('没有可读取的存档时等待，不创建默认新局或错误成绩', async () => {
  const h = host();
  h.control.missing = true;
  await h.service(h.request({ CG: ['cg-1'], 允许展示: true }));
  assert.deepEqual(
    h.responses.map(item => item.状态),
    ['等待'],
  );
  assert.equal(h.control.writes, 0);
});

for (const [label, timeline] of [
  ['跨聊天', 'chat-b:branch-1'],
  ['回档', 'chat-a:branch-2'],
]) {
  test(`${label}旧请求在入口只返回原token的失效响应，不读取或写入新分支`, async () => {
    const h = host();
    h.control.timeline = timeline;
    await h.service(h.request({ CG: ['cg-1'] }));
    assert.equal(h.control.queues, 0);
    assert.equal(h.control.reads, 0);
    assert.equal(h.control.writes, 0);
    assert.deepEqual(h.responses, [{ id: 'settlement-request', 时间线: 'chat-a:branch-1', 状态: '失效' }]);
  });

  test(`${label}发生在排队期间，队列恢复后不写入`, async () => {
    const h = host(fresh(true));
    const before = h.read();
    h.control.queueGate = deferred();
    const pending = h.service(h.request({ CG: ['cg-1'], 允许展示: true }));
    h.control.timeline = timeline;
    h.control.queueGate.resolve();
    await pending;
    assert.equal(h.control.writes, 0);
    assert.deepEqual(h.responses, []);
    assert.deepEqual(h.read(), before);
    assert.equal(h.guards.size, 0);
  });

  test(`${label}发生在持久写入等待期间，提交守卫阻止旧候选落盘`, async t => {
    t.mock.method(console, 'warn', () => {});
    const h = host(fresh(true));
    const before = h.read();
    h.control.writeGate = deferred();
    const pending = h.service(h.request({ CG: ['cg-1'], 允许展示: true }));
    await h.control.writeEntered.promise;
    h.control.timeline = timeline;
    h.control.writeGate.resolve();
    await pending;
    assert.equal(h.control.writes, 0);
    assert.equal(h.control.protected, 0);
    assert.deepEqual(h.responses, []);
    assert.deepEqual(h.read(), before);
    assert.equal(h.guards.size, 0);
  });
}

test('客户端与服务端模块世代不同，可通过聊天身份取得权威token并正常登记', async () => {
  const h = host();
  h.control.timeline = 'chat-a:server-generation-48';
  const clientToken = 'chat-a:client-generation-0';
  await h.service(h.request({ id: 'identity-1', 查询身份: true, 时间线: clientToken }));
  assert.deepEqual(h.responses, [{ id: 'identity-1', 时间线: h.control.timeline, 聊天ID: 'chat-a', 状态: '身份' }]);
  assert.equal(h.control.queues, 0);
  assert.equal(h.control.reads, 0);
  assert.equal(h.control.writes, 0);
  await h.service(h.request({ id: 'record-1', 时间线: h.responses[0].时间线, CG: ['cg-1'] }));
  assert.equal(h.responses.at(-1).状态, '完成');
  assert.equal(h.responses.at(-1).时间线, h.control.timeline);
  assert.deepEqual(h.read().系统._通关纪念.CG记录, ['cg-1']);
});

test('错误聊天身份握手不泄露当前token，也不读取或写入存档', async () => {
  const h = host();
  const before = h.read();
  for (const 聊天ID of ['chat-b', undefined]) {
    await h.service(h.request({ 查询身份: true, 聊天ID, 时间线: 'independent-client-token' }));
  }
  assert.deepEqual(h.responses, []);
  assert.equal(h.control.queues, 0);
  assert.equal(h.control.reads, 0);
  assert.equal(h.control.writes, 0);
  assert.deepEqual(h.read(), before);
});

test('分支切换令旧token失效，重新握手后只用新token提交', async () => {
  const h = host();
  await h.service(h.request({ id: 'identity-old', 查询身份: true, 时间线: 'client-generation-0' }));
  const oldToken = h.responses.at(-1).时间线;
  h.control.timeline = 'chat-a:branch-2';
  await h.service(h.request({ id: 'stale-record', 时间线: oldToken, CG: ['cg-1'] }));
  assert.deepEqual(h.responses.at(-1), { id: 'stale-record', 时间线: oldToken, 状态: '失效' });
  assert.equal(h.control.reads, 0);
  assert.equal(h.control.writes, 0);
  await h.service(h.request({ id: 'identity-new', 查询身份: true, 时间线: oldToken }));
  const identity = h.responses.at(-1);
  assert.equal(identity.状态, '身份');
  assert.equal(identity.时间线, 'chat-a:branch-2');
  await h.service(h.request({ id: 'new-record', 时间线: identity.时间线, CG: ['cg-2'] }));
  assert.equal(h.responses.at(-1).状态, '完成');
  assert.deepEqual(h.read().系统._通关纪念.CG记录, ['cg-2']);
  assert.equal(h.control.writes, 1);
});

test('CG过滤非法值、去重并与本局既有记录合并；重复请求无需写入', async () => {
  const initial = fresh();
  initial.系统._通关纪念.CG记录 = ['cg-2'];
  const h = host(initial);
  const request = h.request({ CG: ['cg-1', 'cg-1', 'cg-2', 'unknown', '', 3, null, { id: 'cg-3' }] });
  await h.service(request);
  assert.deepEqual(h.read().系统._通关纪念.CG记录, ['cg-2', 'cg-1']);
  assert.deepEqual(h.responses[0].已记录CG, ['cg-1', 'cg-2']);
  assert.equal(h.responses[0].当前.CG数, 2);
  assert.equal(h.control.writes, 1);
  await h.service(request);
  assert.equal(h.control.writes, 1);
  assert.equal(h.responses.length, 2);
});

test('单次CG请求最多接受256个合法去重ID，响应只确认实际处理的批次', async () => {
  const h = host();
  const ids = Array.from({ length: 300 }, (_, i) => `cg-${i}`);
  await h.service(h.request({ CG: ids }));
  assert.deepEqual(h.read().系统._通关纪念.CG记录, ids.slice(0, 256));
  assert.deepEqual(h.responses[0].已记录CG, ids.slice(0, 256));
});

test('必须等待写入成功才捕获保护、确认CG和返回首次庆祝', async () => {
  const h = host(fresh(true));
  const before = h.read();
  h.control.writeGate = deferred();
  const pending = h.service(h.request({ CG: ['cg-1'], 允许展示: true }));
  await h.control.writeEntered.promise;
  assert.deepEqual(h.responses, []);
  assert.equal(h.control.protected, 0);
  assert.deepEqual(h.read(), before, 'the candidate must not mutate the object returned by the read dependency');
  h.control.writeGate.resolve();
  await pending;
  assert.deepEqual(h.events, ['write-start', 'write-commit', 'protect', 'response:完成']);
  assert.deepEqual(h.responses[0].首次, h.read().系统._通关纪念.首次成绩);
  assert.equal(h.responses[0].庆祝.评级, 'S');
  assert.equal(h.guards.size, 0);
});

test('写入失败不确认CG、不确认关闭、不发布首次成绩，仍可重试', async t => {
  t.mock.method(console, 'warn', () => {});
  const h = host(fresh(true));
  const before = h.read();
  const request = h.request({ CG: ['cg-1'], 允许展示: true, 确认评级: 'S' });
  h.control.writeError = new Error('simulated storage failure');
  await h.service(request);
  assert.deepEqual(h.responses, [{ id: request.id, 时间线: request.时间线, 状态: '失败' }]);
  assert.deepEqual(h.read(), before);
  assert.equal(h.control.protected, 0);
  assert.equal(h.guards.size, 0);
  h.control.writeError = null;
  await h.service(request);
  assert.equal(h.responses[1].状态, '完成');
  assert.equal(h.read().系统._通关纪念.已庆祝评级, 'S');
  assert.equal(h.control.writes, 1);
});

test('关闭结算仅确认已展示评级，保留首次数值快照和全部玩法状态', async () => {
  const h = host(fresh(true));
  await h.service(h.request({ 允许展示: true }));
  const before = h.read();
  const writes = h.control.writes;
  await h.service(h.request({ 允许展示: true, 确认评级: 'S' }));
  const expected = lodash.cloneDeep(before);
  expected.系统._通关纪念.已庆祝评级 = 'S';
  assert.deepEqual(h.read(), expected);
  assert.equal(h.control.writes, writes + 1);
  assert.equal(h.responses.at(-1).庆祝, null);
  assert.deepEqual(h.responses.at(-1).首次, before.系统._通关纪念.首次成绩);
  await h.service(h.request({ 允许展示: true, 确认评级: 'S' }));
  assert.equal(h.control.writes, writes + 1, 'repeated close confirmation is read-only');
});
