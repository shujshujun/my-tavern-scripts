import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { 创建生成提示词记录器, 生成提示词记录键, 读取消息提示词记录 } = require('../../src/人妻公寓/生成提示词记录.ts');
const { 读取酒馆提示词记录 } = require('../../src/人妻公寓/酒馆提示词读取.ts');
function fixture() {
  const listeners = new Map();
  const r = 创建生成提示词记录器({
    生成id: 'own',
    用户输入: '我听着呢',
    注入文本: ['本轮事件注入'],
    预设名: () => '测试预设',
    监听: (e, f) => {
      listeners.set(e, f);
      return { stop: () => listeners.delete(e) };
    },
  });
  return { r, listeners, emit: (e, ...args) => listeners.get(e)?.(...args) };
}
const request = () => ({
  messages: [
    { role: 'system', content: '预设完整开头\n本轮事件注入\n世界书' },
    { role: 'assistant', content: '历史' },
    { role: 'user', content: '我听着呢' },
    { role: 'system', content: '预设完整结尾' },
  ],
  tools: [{ type: 'function', function: { name: 'final_reply' } }],
  tool_choice: 'auto',
  api_key: 'DO_NOT_SAVE',
  custom_include_headers: 'SECRET_HEADERS',
});
test('完整保存预设前后、世界书、历史、本轮注入与工具定义，并能从消息 extra 重载', () => {
  const { r, emit, listeners } = fixture();
  emit('js_generation_started', 'own');
  const d = request();
  emit('chat_completion_settings_ready', d);
  d.messages.push({ role: 'system', content: '后续钩子' });
  const saved = r.读取();
  r.停止();
  assert.equal(listeners.size, 0);
  const text = 读取消息提示词记录(JSON.parse(JSON.stringify({ [生成提示词记录键]: saved })));
  for (const x of ['预设完整开头', '世界书', '历史', '我听着呢', '预设完整结尾', 'final_reply', '测试预设'])
    assert.ok(text.includes(x));
  assert.match(text, /^【组装提示词快照】/);
  assert.doesNotMatch(text, /后续钩子/);
  assert.ok(text.indexOf('预设完整开头') < text.indexOf('预设完整结尾'));
  assert.doesNotMatch(text, /DO_NOT_SAVE|SECRET_HEADERS/);
});
test('Tauri 发送边界替换早期事件快照，包含防截断最后追加的工具和控制段', () => {
  const original = () => Promise.resolve('unchanged');
  const bridge = { invoke: original };
  globalThis.window = {
    document: {},
    __TAURI_INTERNALS__: Object.freeze({ invoke: original }),
    __TAURITAVERN__: { invoke: { broker: bridge } },
  };
  const { r, emit } = fixture();
  try {
    emit('js_generation_started', 'own');
    const d = request();
    emit('chat_completion_settings_ready', d);
    d.messages.push({ role: 'system', content: '防截断最后追加' });
    d.tools.push({ type: 'function', function: { name: 'emit_complete_response_final' } });
    bridge.invoke('generate_chat_completion', { dto: d });
    const saved = r.读取();
    assert.match(saved.文本, /^【完整提示词快照】/);
    assert.match(saved.文本, /防截断最后追加/);
    assert.match(saved.文本, /emit_complete_response_final/);
  } finally {
    r.停止();
    delete globalThis.window;
  }
  assert.equal(bridge.invoke, original);
});
test('发送边界观察器保留参数、this、原始 Promise，观察失败不影响请求', async () => {
  const { 观察Tauri请求 } = require('../../src/人妻公寓/Tauri提示词观察.ts');
  const reply = Promise.resolve('ok');
  const calls = [];
  const bridge = {
    invoke: function (...a) {
      calls.push({ self: this, a });
      return reply;
    },
  };
  const original = bridge.invoke;
  const subscription = 观察Tauri请求(bridge, () => {
    throw Error('diagnostic failure');
  });
  const args = { dto: request() },
    options = { channel: 1 };
  assert.equal(bridge.invoke('start_chat_completion_stream', args, options), reply);
  assert.equal(calls[0].self, bridge);
  assert.deepEqual(calls[0].a, ['start_chat_completion_stream', args, options]);
  subscription.stop();
  assert.equal(bridge.invoke, original);
  assert.equal(await reply, 'ok');
});
test('只出现 SETTINGS_READY 而没有本次生成开始，不误收后台请求', () => {
  const { r, emit } = fixture();
  emit('chat_completion_settings_ready', request());
  assert.equal(r.读取(), undefined);
});
test('宿主不提供可观察 broker 时仍保存组装快照且不冒充最终请求', () => {
  globalThis.window = { document: {}, __TAURI_INTERNALS__: Object.freeze({ invoke() {} }) };
  globalThis.window.parent = globalThis.window;
  const { r, emit } = fixture();
  try {
    emit('js_generation_started', 'own');
    emit('chat_completion_settings_ready', request());
    assert.match(r.读取().文本, /^【组装提示词快照】/);
  } finally {
    r.停止();
    delete globalThis.window;
  }
});
test('观察结束不覆盖后装扩展，迟到调用仍透明转发', () => {
  const { 观察Tauri请求 } = require('../../src/人妻公寓/Tauri提示词观察.ts');
  let forwarded = 0,
    observed = 0;
  const bridge = {
    invoke() {
      forwarded++;
      return 'ok';
    },
  };
  const s = 观察Tauri请求(bridge, () => observed++);
  const wrapped = bridge.invoke;
  const later = (...args) => wrapped(...args);
  bridge.invoke = later;
  s.stop();
  assert.equal(bridge.invoke, later);
  assert.equal(bridge.invoke('generate_chat_completion', { dto: request() }), 'ok');
  assert.equal(forwarded, 1);
  assert.equal(observed, 0);
});
test('用户输入相同但事件注入不同时不串到其它请求', () => {
  const { r, emit } = fixture();
  emit('js_generation_started', 'own');
  const d = request();
  d.messages[0].content = '另一事件';
  emit('chat_completion_settings_ready', d);
  assert.equal(r.读取(), undefined);
});
test('并行生成归属不清时不保存错误记录', () => {
  const { r, emit } = fixture();
  emit('js_generation_started', 'own');
  emit('js_generation_started', 'phone');
  emit('chat_completion_settings_ready', request());
  assert.equal(r.读取(), undefined);
});
test('重复候选不会把最后一个请求冒充本轮', () => {
  const { r, emit } = fixture();
  emit('js_generation_started', 'own');
  emit('chat_completion_settings_ready', request());
  emit('chat_completion_settings_ready', request());
  assert.equal(r.读取(), undefined);
});
test('取消停止后迟到请求不会形成快照', () => {
  const { r, emit } = fixture();
  emit('js_generation_started', 'own');
  r.停止();
  emit('chat_completion_settings_ready', request());
  assert.equal(r.读取(), undefined);
});
test('游戏注入中的玩家宏展开后仍能保存，正文不因诊断再次执行宏', () => {
  const events = new Map();
  const r = 创建生成提示词记录器({
    生成id: 'macro',
    用户输入: '我听着呢',
    注入文本: ['本轮快照：{{user}}本轮唯一的新行动'],
    预设名: () => '宏预设',
    监听: (e, f) => {
      events.set(e, f);
      return { stop: () => events.delete(e) };
    },
  });
  events.get('js_generation_started')('macro');
  const d = request();
  d.messages[0].content = '本轮快照：诊断玩家本轮唯一的新行动';
  events.get('chat_completion_settings_ready')(d);
  assert.match(r.读取().文本, /本轮快照：诊断玩家本轮唯一的新行动/);
  r.停止();
});
test('宏归属匹配保留静态文本顺序，不把纯宏或改写注入认作本轮', () => {
  const { 请求包含模板文本: match } = require('../../src/人妻公寓/生成提示词记录.ts');
  assert.equal(match('前段内容很明确甲后段内容很明确', '前段内容很明确{{user}}后段内容很明确'), true);
  assert.equal(match('后段内容很明确甲前段内容很明确', '前段内容很明确{{user}}后段内容很明确'), false);
  assert.equal(match('无关正文', '{{user}}'), false);
  assert.equal(match('另一事件的明确内容', '本轮事件的明确内容'), false);
});
test('旧消息没有快照时保持未知，不补造', () => {
  assert.equal(读取消息提示词记录({}), undefined);
  assert.equal(读取消息提示词记录({ [生成提示词记录键]: { 版本: 1, 文本: '核心提示' } }), undefined);
});
test('历史中的工具调用与工具回执关联也保留', () => {
  const { r, emit } = fixture();
  emit('js_generation_started', 'own');
  const d = request();
  d.messages.splice(
    2,
    0,
    {
      role: 'assistant',
      content: '',
      tool_calls: [{ id: 'call-1', function: { name: 'check_schedule', arguments: '{}' } }],
    },
    { role: 'tool', content: '周五', tool_call_id: 'call-1' },
  );
  emit('chat_completion_settings_ready', d);
  assert.match(r.读取().文本, /check_schedule/);
  assert.match(r.读取().文本, /tool_call_id/);
});
const record = { mesId: 8, rawPrompt: [{ role: 'system', content: '旧预设' }], presetName: '当时预设' };
const read = (索引, values, 聊天ID = 'A') =>
  读取酒馆提示词记录({ 楼: 8, 聊天ID, 索引, 存储: async () => ({ getItem: async k => values[k] }) });
test('旧版内存完整记录不访问数据库', async () => {
  assert.equal(
    await 读取酒馆提示词记录({
      楼: 8,
      聊天ID: 'A',
      索引: [record],
      存储: () => {
        throw Error('must not open storage');
      },
    }),
    record,
  );
});
test('Tauri 惰性索引按点击楼层读取完整记录', async () => {
  assert.equal(await read([{ mesId: 8, recordId: 'r8' }], { 'tt_prompts_record:A:r8': record }), record);
});
test('刷新后内存尚无索引仍能读取同一聊天的持久记录', async () => {
  assert.equal(
    await read([], { 'tt_prompts_index:A': [{ mesId: 8, recordId: 'r8' }], 'tt_prompts_record:A:r8': record }),
    record,
  );
});
test('宿主保留的旧格式聊天记录仍可只读恢复', async () => {
  assert.equal(await read([], { A: [record] }), record);
});
test('不返回其它聊天或其它楼层的记录', async () => {
  assert.equal(await read([{ mesId: 8, recordId: 'r8' }], { 'tt_prompts_record:B:r8': record }), undefined);
  assert.equal(
    await read([{ mesId: 8, recordId: 'r8' }], { 'tt_prompts_record:A:r8': { ...record, mesId: 9 } }),
    undefined,
  );
});
