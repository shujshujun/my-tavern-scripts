/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const {
  强制酒馆助手渲染全部楼层,
  恢复酒馆助手渲染楼层,
} = require('../../src/人妻公寓/脚本/游戏逻辑/酒馆助手渲染设置.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

function 装环境({ 设置, 运行态, 运行态延迟 = false }) {
  const 原window = globalThis.window;
  const 原SillyTavern = globalThis.SillyTavern;
  let 保存次数 = 0;
  let 运行态已就绪 = !运行态延迟;
  const 保存 = async () => {
    保存次数 += 1;
  };
  const 上下文 = { extensionSettings: 设置, saveSettingsDebounced: 保存 };
  const 父接口 = { getContext: () => 上下文 };
  const iframe接口 = { ...上下文, getContext: 父接口.getContext };
  const pinia = {
    state: { value: { global_settings: { settings: { render: 运行态 } } } },
    _s: new Map([['global_settings', { settings: { render: 运行态 } }]]),
  };
  const 宿主document = {
    getElementById: id =>
      id === 'tavern_helper' && 运行态已就绪
        ? { __vue_app__: { config: { globalProperties: { $pinia: pinia } } } }
        : null,
  };
  const 父窗口 = { SillyTavern: 父接口, document: 宿主document };
  globalThis.window = { parent: 父窗口, SillyTavern: iframe接口 };
  delete globalThis.SillyTavern;
  return {
    让运行态就绪: () => {
      运行态已就绪 = true;
    },
    保存次数: () => 保存次数,
    恢复: () => {
      if (原window === undefined) delete globalThis.window;
      else globalThis.window = 原window;
      if (原SillyTavern === undefined) delete globalThis.SillyTavern;
      else globalThis.SillyTavern = 原SillyTavern;
    },
  };
}

test('新版助手：会话内临时同步持久层对象与 Pinia 运行态，离开时恢复原值且只在恢复时保存', async () => {
  const 设置 = { tavern_helper: { render: { depth: 6 } } };
  const 运行态 = { depth: 6 };
  const 环境 = 装环境({ 设置, 运行态 });
  try {
    const 成功 = await 强制酒馆助手渲染全部楼层({ 超时毫秒: 0 });
    assert.equal(成功, true);
    assert.equal(设置.tavern_helper.render.depth, 0);
    assert.equal(运行态.depth, 0);
    assert.equal(环境.保存次数(), 0, '启用兼容层不得把全局偏好 0 持久化');
    assert.equal(await 恢复酒馆助手渲染楼层(), true);
    assert.equal(设置.tavern_helper.render.depth, 6);
    assert.equal(运行态.depth, 6);
    assert.equal(环境.保存次数(), 1, '离开游戏时保存恢复后的用户原值');
  } finally {
    await 恢复酒馆助手渲染楼层();
    环境.恢复();
  }
});

test('新版助手加载稍慢时按真实运行态条件重试，不在第一次缺 Pinia 时静默结束', async () => {
  const 设置 = { tavern_helper: { render: { depth: 4 } } };
  const 运行态 = { depth: 4 };
  const 环境 = 装环境({ 设置, 运行态, 运行态延迟: true });
  let 等待次数 = 0;
  try {
    const 成功 = await 强制酒馆助手渲染全部楼层({
      超时毫秒: 1000,
      等待: async () => {
        等待次数 += 1;
        环境.让运行态就绪();
      },
    });
    assert.equal(成功, true);
    assert.equal(等待次数, 1);
    assert.equal(运行态.depth, 0);
  } finally {
    await 恢复酒馆助手渲染楼层();
    环境.恢复();
  }
});

test('旧版助手只提供 TavernHelper.render.render_depth 时仍兼容，重复启用不覆盖最初快照', async () => {
  const 设置 = { TavernHelper: { render: { render_depth: 3 } } };
  const 运行态 = {};
  const 环境 = 装环境({ 设置, 运行态, 运行态延迟: true });
  try {
    assert.equal(await 强制酒馆助手渲染全部楼层({ 超时毫秒: 0 }), true);
    assert.equal(设置.TavernHelper.render.render_depth, 0);
    assert.equal(环境.保存次数(), 0);
    assert.equal(await 强制酒馆助手渲染全部楼层({ 超时毫秒: 0 }), true);
    assert.equal(环境.保存次数(), 0);
    assert.equal(await 恢复酒馆助手渲染楼层(), true);
    assert.equal(设置.TavernHelper.render.render_depth, 3);
    assert.equal(环境.保存次数(), 1);
  } finally {
    await 恢复酒馆助手渲染楼层();
    环境.恢复();
  }
});

test('切换聊天发生在运行态轮询期间时，恢复会作废旧轮询，旧会话不能再次把设置改回 0', async () => {
  const 设置 = { tavern_helper: { render: { depth: 4 } } };
  const 运行态 = { depth: 4 };
  const 环境 = 装环境({ 设置, 运行态, 运行态延迟: true });
  let 释放等待;
  const 等待门 = new Promise(resolve => {
    释放等待 = resolve;
  });
  try {
    const 启用任务 = 强制酒馆助手渲染全部楼层({
      超时毫秒: 1000,
      等待: async () => 等待门,
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(设置.tavern_helper.render.depth, 0);

    assert.equal(await 恢复酒馆助手渲染楼层(), true);
    assert.equal(设置.tavern_helper.render.depth, 4);
    环境.让运行态就绪();
    释放等待();

    assert.equal(await 启用任务, false, '旧会话的轮询应被恢复动作作废');
    assert.equal(设置.tavern_helper.render.depth, 4);
    assert.equal(运行态.depth, 4);
  } finally {
    释放等待?.();
    await 恢复酒馆助手渲染楼层();
    环境.恢复();
  }
});

test('宿主接口缺失或设置字段不可写时只返回失败，不产生未处理异常阻塞游戏启动', async () => {
  const 原window = globalThis.window;
  const 原warn = console.warn;
  const 警告 = [];
  console.warn = (...args) => 警告.push(args);
  try {
    globalThis.window = { parent: { document: { getElementById: () => null } } };
    assert.equal(await 强制酒馆助手渲染全部楼层({ 超时毫秒: 0 }), false);

    const 设置 = { tavern_helper: { render: {} } };
    Object.defineProperty(设置.tavern_helper.render, 'depth', {
      get: () => 5,
      set: () => {
        throw new Error('只读');
      },
      enumerable: true,
    });
    const 上下文 = { extensionSettings: 设置, saveSettingsDebounced: async () => undefined };
    globalThis.window = {
      parent: { SillyTavern: { getContext: () => 上下文 }, document: { getElementById: () => null } },
      SillyTavern: { ...上下文, getContext: () => 上下文 },
    };
    assert.equal(await 强制酒馆助手渲染全部楼层({ 超时毫秒: 0 }), false);
    assert.ok(警告.length >= 2);
  } finally {
    await 恢复酒馆助手渲染楼层();
    console.warn = 原warn;
    if (原window === undefined) delete globalThis.window;
    else globalThis.window = 原window;
  }
});

test('游戏逻辑入口后台执行修复，不阻塞其余启动流程', () => {
  const 源码 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
  assert.match(源码, /强制酒馆助手渲染全部楼层/);
  assert.match(源码, /恢复酒馆助手渲染楼层/);
  assert.match(源码, /void 强制酒馆助手渲染全部楼层\(\);/);
  assert.match(源码, /CHAT_CHANGED[\s\S]{0,800}恢复酒馆助手渲染楼层/);
  assert.match(源码, /pagehide[\s\S]{0,300}恢复酒馆助手渲染楼层/);
  assert.doesNotMatch(源码, /function 强制渲染全部楼层/);
});
