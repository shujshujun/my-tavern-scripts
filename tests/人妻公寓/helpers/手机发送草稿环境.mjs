/* eslint-disable import-x/no-nodejs-modules -- 仅使用隔离内存宿主，不访问玩家存档、网络或模型。 */
import assert from 'node:assert/strict';
import { createHost } from './微信事务恢复环境.mjs';

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}

/** 受控DOM适配器，只验证真实渲染函数的事件/草稿生命周期，不宣称浏览器布局验收。 */
class Element {
  constructor(tag = 'div', className = '', html = '') {
    this.tagName = tag.toUpperCase();
    this.className = className;
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.style = {};
    this.dataset = {};
    this.value = '';
    this.disabled = false;
    this.scrollHeight = 100;
    this.scrollTop = 0;
    this.classList = {
      contains: c => this.className.split(/\s+/).includes(c),
      add: (...cs) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...cs])].join(' '); },
      remove: (...cs) => { this.className = this.className.split(/\s+/).filter(c => !cs.includes(c)).join(' '); },
      toggle: (c, force) => {
        const on = force ?? !this.classList.contains(c);
        if (on) this.classList.add(c); else this.classList.remove(c);
        return on;
      },
    };
    this.innerHTML = html;
  }
  set innerHTML(html) {
    for (const child of this.children ?? []) child.parentElement = null;
    this.children = [];
    this.textContent = '';
    const stack = [this];
    for (const token of String(html).match(/<[^>]+>|[^<]+/g) ?? []) {
      if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
      if (token.startsWith('<')) {
        const tag = /^<([\w-]+)/.exec(token)?.[1];
        if (!tag) continue;
        const child = new Element(tag, /class="([^"]*)"/.exec(token)?.[1] ?? '');
        stack.at(-1).appendChild(child);
        if (!['img', 'br', 'input', 'hr'].includes(tag) && !token.endsWith('/>')) stack.push(child);
      } else stack.at(-1).textContent += token;
    }
  }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  remove() {
    if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(x => x !== this);
    this.parentElement = null;
  }
  contains(child) { return child === this || this.children.some(x => x.contains(child)); }
  matches(selector) {
    return selector.startsWith('.') ? this.classList.contains(selector.slice(1)) : this.tagName === selector.toUpperCase();
  }
  querySelector(selector) {
    for (const child of this.children) {
      if (child.matches(selector)) return child;
      const found = child.querySelector(selector);
      if (found) return found;
    }
    return null;
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type, more = {}) {
    const event = { type, preventDefault() {}, stopPropagation() {}, ...more };
    for (const fn of this.listeners.get(type) ?? []) fn(event);
  }
  click() { if (!this.disabled) this.dispatch('click'); }
  focus() { this.dispatch('focus'); }
  setAttribute(name, value) { this[name] = value; }
}

/** 完整加载实际chat、业务注册、发送函数、会话瞬态、批次/租约、数据层/镜像。 */
export function createPhone(options = {}) {
  const e = createHost(options);
  e.events = [];
  e.externalCalls = 0;
  e.redraws = 0;
  e.sends = [];
  e.root = new Element('div', 'open');
  e.screen = new Element('div');
  e.root.appendChild(e.screen);
  const doc = { activeElement: null, contains: n => e.root.contains(n) };
  e.globals.document = doc;
  e.globals.queueMicrotask = queueMicrotask;
  e.globals.eventEmit = (...args) => e.events.push(args);
  e.globals.stopGenerationById = id => e.events.push(['stop', id]);
  const forbidden = () => { e.externalCalls++; throw new Error('EXTERNAL_MODEL_OR_DATABASE_FORBIDDEN'); };
  // 此专项不进入正文模型/记忆数据库/自动节拍；意外进入即失败，绝不返回假成功。
  for (const [file, names] of [
    ['snapshotSystem.ts', ['妻状态包']],
    ['数据库桥.ts', ['同步社交轨迹']],
    ['手机/生成引擎.ts', ['小生成', '微信短文本', '微信群文本', '手机小生成仍有效', '称呼纪律', '家庭事实', '口吻纪律', '攻略私聊提示']],
    ['手机/摘要系统.ts', ['有效楼务任务id集合', '排队刷新群聊进展摘要', '排队刷新微信进展摘要']],
    ['手机/微信记忆上下文.ts', ['读取私聊记忆上下文', '读取群聊记忆上下文']],
    ['手机/节拍引擎.ts', ['姐妹群一拍']],
    ['手机/录像带V4微信.ts', ['尝试录像带V4专用私聊回复']],
  ]) e.adapt(file, Object.fromEntries(names.map(name => [name, forbidden])));
  e.adapt('手机/壳/资源与皮肤.ts', {
    el: (tag, cls = '', html = '') => new Element(tag, cls, html),
    根文档: () => doc,
    头像块: () => '',
    群消息头像名: (_room, _text, fallback) => fallback,
    私聊图片地址: id => `isolated:${id}`,
    手机图标: {},
  });
  // 页头装饰不参与发送；保留实际chat创建的输入/引用/气泡及全部事件。
  e.adapt('手机/壳/渲染/共享.ts', { 渲染头() {} });
  e.transient = e.load('手机/壳/会话瞬态.ts');
  e.leases = e.load('生成通道互斥.ts');
  e.timeline = e.load('手机时间线租约.ts');
  e.quotes = e.load('微信消息引用.ts');
  e.portModule = e.load('手机/壳/渲染/业务端口.ts');
  if (options.registerBusiness !== false) {
    e.load('手机/交互/邀约与发消息.ts');
    e.port = e.portModule.取渲染业务端口();
    assert.ok(e.port?.发消息, '必须由真实业务模块注册发送端口');
    const send = e.port.发消息;
    e.port.发消息 = (...args) => {
      const promise = send(...args);
      e.sends.push({ args, promise });
      return promise;
    };
  }
  const renderer = e.load('手机/壳/渲染/chat.ts');
  e.page = { 名: 'chat', 会话: '101' };
  e.key = () => e.transient.当前会话批次键(e.page.会话);
  e.render = () => {
    e.redraws++;
    e.screen.innerHTML = '';
    const generation = e.transient.开始新手机聊天渲染世代();
    renderer.渲染chat({
      屏: e.screen, root: e.root, data: e.st.chat.at(-1).stat_data, 库: e.api.读库(),
      楼: e.st.chat.length - 1, 当前绝对时段: e.clock(), 在当前时间线: () => true,
      会议手机: { 场景中: false }, 本次渲染世代: generation,
      读取当前页: () => e.page, 写入当前页: page => { e.page = page; },
      结束当前聊天输入: () => {
        e.transient.删除会话引用草稿(e.key());
        e.transient.收口手机聊天输入键(e.key());
      },
      重绘: () => e.render(),
    });
  };
  e.textarea = () => e.screen.querySelector('textarea');
  e.button = () => e.screen.querySelector('.rqp-input')?.children.at(-1);
  e.type = text => { const ta = e.textarea(); assert.ok(ta); ta.value = text; ta.dispatch('input'); };
  e.draft = (key = e.key()) => e.transient.取会话草稿(key);
  e.playerMessages = () => e.api.读库().消息.filter(m => m.发 === '我');
  e.settle = async () => { for (let i = 0; i < 100; i++) await Promise.resolve(); };
  e.addQuote = async (text = '请确认维修时间。') => {
    const message = { 楼: 4, 时: 20, 会话: e.page.会话, 发: '对方', 文: text };
    assert.equal(await e.api.写库增量({ 新圈: [], 新消息: [message], 节拍改: {} }), true);
    const messages = e.api.读库().消息;
    const locator = e.quotes.创建微信引用定位(messages, messages.length - 1);
    assert.ok(locator);
    e.transient.写会话引用草稿(e.key(), locator);
    e.render();
    return locator;
  };
  e.render();
  return e;
}
