/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const 源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/刷新恢复镜像.ts', import.meta.url), 'utf8');

class 内存会话存储 {
  #值 = new Map();

  getItem(键) {
    return this.#值.has(键) ? this.#值.get(键) : null;
  }

  setItem(键, 值) {
    this.#值.set(键, String(值));
  }

  removeItem(键) {
    this.#值.delete(键);
  }

  clear() {
    this.#值.clear();
  }
}

class 写入失败存储 extends 内存会话存储 {
  setItem() {
    throw new Error('QuotaExceededError');
  }
}

function 默认聊天(数量 = 12) {
  return Array.from({ length: 数量 }, (_, 楼) => ({ is_user: 楼 % 2 === 0, swipe_id: 0, extra: {} }));
}

function 加载恢复镜像({
  存储 = new 内存会话存储(),
  本地存储 = new 内存会话存储(),
  integrity = 'chat-integrity-a',
  父窗口,
  chat = 默认聊天(),
} = {}) {
  const 上下文 = {
    chatMetadata: { integrity },
    chatId: 'chat-a',
    characterId: 'character-a',
    chat,
    getContext() {
      return this;
    },
  };
  const parent = 父窗口 ?? {};
  parent.sessionStorage = 存储;
  parent.localStorage = 本地存储;
  parent.SillyTavern = 上下文;
  const window = { parent };
  const globalThis = { SillyTavern: 上下文 };
  const js = ts.transpileModule(源码, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function(
    'module',
    'exports',
    'window',
    'SillyTavern',
    'globalThis',
    js,
  )(module, module.exports, window, 上下文, globalThis);
  return { api: module.exports, 上下文, parent, 存储, 本地存储 };
}

function 微信样本(文 = '已经聊过的内容', 楼 = 8, 时 = 20) {
  return {
    消息: [{ 楼, 时, 会话: '101', 发: '对方', 文 }],
    圈: [],
    读到: { 101: 8 },
    读时: {},
    节拍: { '私:101': 20 },
    已发私聊图: {},
  };
}

test('同一聊天刷新：正式变量缺失或落后时采用更高修订副本，正式变量更新时不倒退', () => {
  const { api } = 加载恢复镜像();
  const 微信 = 微信样本();
  const 修订 = api.推进微信持久修订(微信, 'chat-a', 20);
  assert.equal(修订, 1);
  assert.equal(api.写入微信刷新镜像('chat-a', 微信, 20), true);

  微信.消息[0].文 = '调用方后来改坏';
  const 缺失恢复 = api.选择微信刷新恢复值(undefined, false, 'chat-a', 20);
  assert.equal(缺失恢复.使用镜像, true);
  assert.equal(缺失恢复.镜像修订, 1);
  assert.equal(缺失恢复.值.消息[0].文, '已经聊过的内容', '镜像必须是深副本，不能被调用方后续修改污染');

  const 较新正式库 = 微信样本('服务器已经更新');
  较新正式库[api.微信持久修订字段] = 2;
  const 正式优先 = api.选择微信刷新恢复值(较新正式库, true, 'chat-a', 20);
  assert.equal(正式优先.使用镜像, false);
  assert.equal(正式优先.值.消息[0].文, '服务器已经更新');
});

test('完整网页刷新：父窗口内存消失后仍能从同一 tab 的 sessionStorage 恢复', () => {
  const 存储 = new 内存会话存储();
  const 第一页 = 加载恢复镜像({ 存储, integrity: 'full-refresh-chat' });
  const 微信 = 微信样本('完整刷新前的消息');
  第一页.api.推进微信持久修订(微信, 'chat-a', 20);
  第一页.api.写入微信刷新镜像('chat-a', 微信, 20);

  const 第二页 = 加载恢复镜像({ 存储, integrity: 'full-refresh-chat' });
  const 恢复 = 第二页.api.选择微信刷新恢复值(undefined, false, 'chat-a', 20);
  assert.equal(恢复.使用镜像, true);
  assert.equal(恢复.值.消息[0].文, '完整刷新前的消息');
});

test('关闭页面后重启：父窗口内存与 sessionStorage 消失时仍能从 localStorage 恢复完整微信', () => {
  const 本地存储 = new 内存会话存储();
  const 第一页 = 加载恢复镜像({ 存储: new 内存会话存储(), 本地存储, integrity: 'restart-persistence-chat' });
  const 微信 = 微信样本('关闭页面前的完整上下文');
  api写入(第一页.api, 微信);

  const 第二页 = 加载恢复镜像({ 存储: new 内存会话存储(), 本地存储, integrity: 'restart-persistence-chat' });
  const 恢复 = 第二页.api.选择微信刷新恢复值(undefined, false, 'chat-a', 20);
  assert.equal(恢复.使用镜像, true);
  assert.equal(恢复.值.消息[0].文, '关闭页面前的完整上下文');
  assert.equal(恢复.值.节拍['私:101'], 20);
});

function api写入(api, 微信) {
  assert.equal(api.推进微信持久修订(微信, 'chat-a', 20), 1);
  assert.equal(api.写入微信刷新镜像('chat-a', 微信, 20), true);
}

test('浏览器存储单通道失败时另一通道仍可恢复，双通道失败时保留当前页内存镜像', () => {
  const session失败 = new 写入失败存储();
  const local可用 = new 内存会话存储();
  const local页 = 加载恢复镜像({ 存储: session失败, 本地存储: local可用, integrity: 'storage-fallback-chat' });
  api写入(local页.api, 微信样本('localStorage 兜底'));
  const local重启页 = 加载恢复镜像({
    存储: new 内存会话存储(),
    本地存储: local可用,
    integrity: 'storage-fallback-chat',
  });
  assert.equal(local重启页.api.选择微信刷新恢复值(undefined, false, 'chat-a', 20).值.消息[0].文, 'localStorage 兜底');

  const 双失败页 = 加载恢复镜像({
    存储: new 写入失败存储(),
    本地存储: new 写入失败存储(),
    integrity: 'both-storage-fail-chat',
  });
  const 微信 = 微信样本('仅内存镜像');
  assert.equal(双失败页.api.推进微信持久修订(微信, 'chat-a', 20), 1);
  assert.equal(双失败页.api.写入微信刷新镜像('chat-a', 微信, 20), false);
  const 当前页恢复 = 双失败页.api.选择微信刷新恢复值(undefined, false, 'chat-a', 20);
  assert.equal(当前页恢复.使用镜像, true);
  assert.equal(当前页恢复.值.消息[0].文, '仅内存镜像');
});

test('聊天身份隔离：另一聊天或另一开局绝不读取当前聊天副本', () => {
  const { api, 上下文 } = 加载恢复镜像({ integrity: 'chat-one' });
  const 微信 = 微信样本();
  api.推进微信持久修订(微信, 'chat-a', 20);
  api.写入微信刷新镜像('chat-a', 微信, 20);

  上下文.chatMetadata.integrity = 'chat-two';
  const 另一聊天 = api.选择微信刷新恢复值(undefined, false, 'chat-b', 20);
  assert.equal(另一聊天.使用镜像, false);
  assert.equal(另一聊天.值, undefined);
});

test('联合聊天身份：即使复制聊天暂时复用了同一 integrity，不同宿主 chat ID 也不能串恢复', () => {
  const { api } = 加载恢复镜像({ integrity: 'possibly-cloned-integrity' });
  const 微信 = 微信样本('只属于 chat-a');
  api.推进微信持久修订(微信, 'chat-a', 20);
  api.写入微信刷新镜像('chat-a', 微信, 20);

  assert.equal(api.读取微信刷新镜像('chat-b', 20), null);
  assert.equal(api.选择微信刷新恢复值(undefined, false, 'chat-b', 20).使用镜像, false);
});

test('重开墓碑：旧服务器对象不能复活，新局首条记录以更高修订覆盖墓碑', () => {
  const { api, 上下文 } = 加载恢复镜像({ integrity: 'restart-chat' });
  const 旧微信 = 微信样本('旧局消息');
  const 旧修订 = api.推进微信持久修订(旧微信, 'chat-a', 20);
  api.写入微信刷新镜像('chat-a', 旧微信, 20);

  上下文.chat.splice(1);
  const 清空修订 = api.写入微信清空镜像('chat-a', 0);
  assert.ok(清空修订 > 旧修订);
  const 旧服务器回流 = api.选择微信刷新恢复值(旧微信, true, 'chat-a', 0);
  assert.equal(旧服务器回流.使用镜像, true);
  assert.equal(旧服务器回流.值, null, '更高修订的重开墓碑必须压住旧服务器微信库');

  const 新局微信 = 微信样本('新局首条消息', 0, 0);
  const 新局修订 = api.推进微信持久修订(新局微信, 'chat-a', 0);
  assert.ok(新局修订 > 清空修订);
  api.写入微信刷新镜像('chat-a', 新局微信, 0);
  const 新局正式库 = api.选择微信刷新恢复值(新局微信, true, 'chat-a', 0);
  assert.equal(新局正式库.使用镜像, false);
  assert.equal(新局正式库.值.消息[0].文, '新局首条消息');
});

test('服务器旧 null 可由更高普通镜像恢复；没有镜像时仍保持显式 null', () => {
  const { api } = 加载恢复镜像({ integrity: 'legacy-null-chat' });
  const 微信 = 微信样本();
  api.推进微信持久修订(微信, 'chat-a', 20);
  api.写入微信刷新镜像('chat-a', 微信, 20);

  const 选择 = api.选择微信刷新恢复值(null, true, 'chat-a', 20);
  assert.equal(选择.使用镜像, true);
  assert.equal(选择.值.消息[0].文, '已经聊过的内容');

  const 无镜像页 = 加载恢复镜像({ integrity: 'no-mirror-chat' });
  const 无镜像 = 无镜像页.api.选择微信刷新恢复值(null, true, 'chat-a', 20);
  assert.equal(无镜像.使用镜像, false);
  assert.equal(无镜像.值, null);
});

test('时间线安全门：正常加楼可恢复，回到更早时段、删楼或 swipe 变化都拒绝旧镜像', () => {
  const { api, 上下文 } = 加载恢复镜像({ integrity: 'timeline-guard-chat' });
  const 微信 = 微信样本('原分支消息');
  api.推进微信持久修订(微信, 'chat-a', 20);
  api.写入微信刷新镜像('chat-a', 微信, 20);

  上下文.chat.push({ is_user: false, swipe_id: 0, extra: {} });
  assert.equal(api.选择微信刷新恢复值(undefined, false, 'chat-a', 21).使用镜像, true, '只追加新楼时原前缀仍存活');
  上下文.chat.pop();

  assert.equal(
    api.选择微信刷新恢复值(undefined, false, 'chat-a', 19).使用镜像,
    false,
    '回到镜像以前的世界时段不得恢复未来微信',
  );

  上下文.chat[5].swipe_id = 1;
  assert.equal(
    api.选择微信刷新恢复值(undefined, false, 'chat-a', 20).使用镜像,
    false,
    '锚楼内切换 swipe 后分支指纹必须失配',
  );
  上下文.chat[5].swipe_id = 0;

  上下文.chat.splice(8);
  assert.equal(
    api.选择微信刷新恢复值(undefined, false, 'chat-a', 20).使用镜像,
    false,
    '删到镜像锚楼之前不得复活已删除时间线',
  );
});

test('回档后的新分支修订必须跨过旧镜像，再以新的楼/时锚覆盖同一恢复槽', () => {
  const { api, 上下文 } = 加载恢复镜像({ integrity: 'rollback-revision-chat' });
  const 旧微信 = 微信样本('未来旧分支', 8, 20);
  const 旧修订 = api.推进微信持久修订(旧微信, 'chat-a', 20);
  api.写入微信刷新镜像('chat-a', 旧微信, 20);

  上下文.chat.splice(6);
  const 新微信 = 微信样本('回档后的新分支', 5, 10);
  const 新修订 = api.推进微信持久修订(新微信, 'chat-a', 10);
  assert.ok(新修订 > 旧修订, '即使旧镜像已不属于当前时间线，新分支也必须越过旧修订号');
  assert.equal(api.写入微信刷新镜像('chat-a', 新微信, 10), true);

  const 恢复 = api.选择微信刷新恢复值(undefined, false, 'chat-a', 10);
  assert.equal(恢复.使用镜像, true);
  assert.equal(恢复.值.消息[0].文, '回档后的新分支');
});

test('迟到的低修订事务不能覆盖更高修订镜像', () => {
  const { api } = 加载恢复镜像({ integrity: 'late-write-chat' });
  const 旧微信 = 微信样本('先完成、但迟到写镜像的旧事务');
  const 旧修订 = api.推进微信持久修订(旧微信, 'chat-a', 20);
  assert.equal(api.写入微信刷新镜像('chat-a', 旧微信, 20), true);

  const 新微信 = 微信样本('已经成为真值的新事务');
  const 新修订 = api.推进微信持久修订(新微信, 'chat-a', 20);
  assert.ok(新修订 > 旧修订);
  assert.equal(api.写入微信刷新镜像('chat-a', 新微信, 20), true);

  // 模拟旧事务在新的回档/清空/写库事务之后才恢复执行。存储槽必须保持单调，不能因
  // 这次迟到调用拥有更晚的 Date.now() 就把较低修订重新写成刷新真值。
  assert.equal(api.写入微信刷新镜像('chat-a', 旧微信, 20), true);
  const 恢复 = api.选择微信刷新恢复值(undefined, false, 'chat-a', 20);
  assert.equal(恢复.使用镜像, true);
  assert.equal(恢复.镜像修订, 新修订);
  assert.equal(恢复.值.消息[0].文, '已经成为真值的新事务');
});
