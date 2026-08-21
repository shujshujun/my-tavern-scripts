/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
// P7A:壳资源皮肤(ROOT_ID/素材基址/私聊图片地址/手机图标路径与图标/手机CSS/头像块/群消息头像名/根文档/el)
// 的唯一所有者是 ./壳/资源与皮肤；P8:其业务消费点(撤回菜单 DOM 创建)迁至 ./交互/邀约与发消息。
const 资源与皮肤源码 = readFileSync(new URL('./壳/资源与皮肤.ts', 手机目录), 'utf8');
// P7A:会话瞬态(输入租约/待回复上下文/草稿/输入聚焦/渲染世代与计时器/批次控制器/发送租约/静音会议硬门)
// 的唯一所有者是 ./壳/会话瞬态；P8:交互业务经显式 API 访问，不持有第二份 Map/Set。
const 会话瞬态源码 = readFileSync(new URL('./壳/会话瞬态.ts', 手机目录), 'utf8');
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
// P8:交互业务(撤回绑定/邀约/发送/批次/妻回复)迁至 ./交互/邀约与发消息,相关断言改读新所有者。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 门面源码 = readFileSync(new URL('../手机系统.ts', 手机目录), 'utf8');

/** 从源码按起止锚截取片段（与 tests/人妻公寓/手机系统拆分P2.test.mjs 同款）。 */
function 截源(源码, 开始, 结束) {
  const 起 = 源码.indexOf(开始);
  const 止 = 源码.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源码.slice(起, 止);
}

/** 把无 import 的 TS 片段转译为 CommonJS 并在隔离作用域执行（transpile-only）。 */
function 执行TS片段(片段, 导出名) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

/** 资源与皮肤源码去掉 import 行的可执行主体（头像块/群消息头像名 依赖 stageConfig 符号，以 stub 注入）。 */
function 资源主体() {
  const 主体 = 资源与皮肤源码.slice(资源与皮肤源码.indexOf('export const ROOT_ID'));
  const 数据桩 = `
const 门牌列表 = ['101', '102', '103'];
const 户静态表 = {
  '101': { 妻名: '夏乔', 夫名: '阿远' },
  '102': { 妻名: '苏晚', 夫名: '大刘' },
  '103': { 妻名: '乔思', 夫名: '' },
};
`;
  return `${数据桩}\n${主体}`;
}

test('壳/资源与皮肤 真实拥有全部资源定义，内核无重复声明', () => {
  // 新所有者真实声明（spec 迁移清单逐项）
  assert.match(资源与皮肤源码, /export const ROOT_ID = 'rq-phone-root';/);
  assert.match(
    资源与皮肤源码,
    /export const 素材基址 = 'https:\/\/testingcf\.jsdelivr\.net\/gh\/shujshujun\/my-tavern-scripts@rq0\.55\/dist\/人妻公寓\/素材';/,
  );
  assert.match(
    资源与皮肤源码,
    /export const 成人素材基址 = 'https:\/\/testingcf\.jsdelivr\.net\/gh\/shujun8520-design\/qgy-assets@cg2\/cg1';/,
  );
  assert.match(资源与皮肤源码, /export function 朋友圈图片地址\(图: unknown\): string \{/);
  assert.match(资源与皮肤源码, /export function 私聊图片地址\(图: string\): string \{/);
  assert.match(资源与皮肤源码, /export function 根文档\(\): Document \{/);
  assert.match(资源与皮肤源码, /export function el\(tag: string, cls: string, html\?: string\): HTMLElement \{/);
  assert.match(资源与皮肤源码, /export const 手机图标路径: Record<string, string> = \{/);
  assert.match(资源与皮肤源码, /export function 手机图标\(name: string\): string \{/);
  assert.match(资源与皮肤源码, /export const 手机CSS = `/);
  assert.match(资源与皮肤源码, /export function 头像块\(名: string\): string \{/);
  assert.match(资源与皮肤源码, /export function 群消息头像名\(会话: string, 文: string, 默认名: string\): string \{/);

  // 内核不再重复声明（值符号匹配声明形态，避免误伤使用点的字符串插值）
  const 内核禁止声明 = [
    /const ROOT_ID = 'rq-phone-root';/,
    /const 素材基址 = /,
    /const 成人素材基址 = /,
    /function 朋友圈图片地址\(/,
    /function 私聊图片地址\(/,
    /function 根文档\(/,
    /function el\(tag: string/,
    /const 手机图标路径/,
    /function 手机图标\(/,
    /const 手机CSS = `/,
    /function 头像块\(/,
    /function 群消息头像名\(/,
  ];
  for (const 模式 of 内核禁止声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }
});

test('资源符号由真实消费者 import：内核/挂载/红点/共享/六页面各自消费所需，所有资源都有真实消费者', () => {
  // P8:撤回菜单 DOM 创建随交互业务迁至 交互/邀约与发消息。
  assert.match(交互源码, /import \{ el \} from '\.\.\/壳\/资源与皮肤';/);
  assert.match(交互源码, /const 层 = el\('div', 'rqp-msg-menu-layer'\);/);
  assert.doesNotMatch(内核源码, /from '\.\/壳\/资源与皮肤'/, '内核不得再消费资源与皮肤');

  // 挂载层：import 并真实使用 ROOT_ID/手机CSS/手机图标/根文档/el（壳 HTML 图标与 DOM 创建）
  assert.match(挂载源码, /import \{ ROOT_ID, 手机CSS, 手机图标, 根文档, el \} from '\.\/资源与皮肤';/);
  assert.match(挂载源码, /style\.textContent = 手机CSS;/);
  assert.match(挂载源码, /手机图标\('phone'\)/);
  assert.match(挂载源码, /手机图标\('resize'\)/);
  assert.match(挂载源码, /const doc = 根文档\(\);/);
  assert.match(挂载源码, /const root = el\('div', ''\);/);

  // 红点与开合：import 并真实使用 ROOT_ID/根文档
  assert.match(红点开合源码, /import \{ ROOT_ID, 根文档 \} from '\.\/资源与皮肤';/);
  assert.match(红点开合源码, /根文档\(\)\.getElementById\(ROOT_ID\)/);

  // 共享层：手机图标/el（头栏齿轮与底栏三签、DOM 创建）
  assert.match(渲染共享源码, /import \{ 手机图标, el \} from '\.\.\/资源与皮肤';/);
  assert.match(渲染共享源码, /手机图标\('gear'\)/);
  assert.match(渲染共享源码, /手机图标\('chat'\)/);
  assert.match(渲染共享源码, /const h = el\('div', 'rqp-head'\);/);

  // 六页面各自消费所需资源符号
  assert.match(渲染chats源码, /import \{ 头像块, el \} from '\.\.\/资源与皮肤';/);
  assert.match(渲染chat源码, /import \{ 头像块, el, 根文档, 群消息头像名, 私聊图片地址 \} from '\.\.\/资源与皮肤';/);
  assert.match(渲染moments源码, /import \{ 头像块, el, 手机图标, 朋友圈图片地址 \} from '\.\.\/资源与皮肤';/);
  assert.match(渲染call源码, /import \{ 头像块, el, 手机图标 \} from '\.\.\/资源与皮肤';/);
  assert.match(渲染talk源码, /import \{ el \} from '\.\.\/资源与皮肤';/);
  assert.match(渲染settings源码, /import \{ el \} from '\.\.\/资源与皮肤';/);
  // 页面真实使用点（不是只 import 不用）
  assert.match(渲染chat源码, /src="\$\{私聊图片地址\(m\.图\)\}"/);
  assert.match(渲染chat源码, /群消息头像名\(会话, m\.文, 对方头像名\)/);
  assert.match(渲染chat源码, /根文档\(\)\.activeElement === ta/);
  assert.match(渲染chats源码, /头像块\(友\.类 === '群'/);
  assert.match(渲染moments源码, /朋友圈图片地址\(c\.图\)/);
  assert.match(渲染moments源码, /朋友圈图片地址\(`仅你可见\/\$\{c\.谁\}_\$\{c\.私\.图序\}`\)/);
  assert.match(渲染moments源码, /朋友圈图片地址\(条\.图\)/);
  assert.match(渲染moments源码, /手机图标\('lock'\)/);
  assert.match(渲染call源码, /头像块\('父亲'\)/);
  assert.match(渲染talk源码, /el\('div', `rqp-line/);

  // 所有资源符号都有真实消费者（资源模块自身 + 内核/挂载/红点/共享/六页面 联合覆盖）
  const 全消费者 =
    `${资源与皮肤源码}\n${内核源码}\n${挂载源码}\n${红点开合源码}\n${渲染共享源码}\n` +
    `${渲染chats源码}\n${渲染chat源码}\n${渲染moments源码}\n${渲染call源码}\n${渲染talk源码}\n${渲染settings源码}`;
  for (const 符号 of ['ROOT_ID', '素材基址', '成人素材基址', '朋友圈图片地址', '私聊图片地址', '手机图标路径', '手机图标', '手机CSS', '头像块', '群消息头像名', '根文档', 'el']) {
    assert.ok(全消费者.includes(符号), `资源符号 ${符号} 应有真实消费者`);
  }
});

test('资源与皮肤 不反向 import 内核/门面，只依赖 stageConfig 叶子', () => {
  assert.doesNotMatch(
    资源与皮肤源码,
    /from '\.\.\/内核'|from '\.\/内核'|from '\.\.\/手机系统'|from '\.\/手机系统'|from '\.\/壳\/会话瞬态'|from '\.\/壳\/挂载'|from '\.\/壳\/红点与开合'|from '\.\/渲染/,
    '资源与皮肤 不得反向 import 内核/门面或任何壳层上层模块',
  );
  assert.match(资源与皮肤源码, /from '\.\.\/\.\.\/\.\.\/\.\.\/stageConfig'/, '资源与皮肤 只依赖 stageConfig 等叶子');
});

test('两个素材基址版本与 @adult/、普通微信圈地址编码/后缀规则保持', () => {
  const { 朋友圈图片地址, 私聊图片地址, 素材基址, 成人素材基址 } = 执行TS片段(资源主体(), [
    '朋友圈图片地址',
    '私聊图片地址',
    '素材基址',
    '成人素材基址',
  ]);
  assert.equal(素材基址, 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材');
  assert.equal(成人素材基址, 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg2/cg1');

  // 普通微信圈：素材基址/微信圈/<图>.<webp>，每段 encodeURIComponent（中文段必须百分号编码），保留 .webp 后缀
  assert.equal(
    私聊图片地址('夏乔/美食_2'),
    `${素材基址}/微信圈/${encodeURIComponent('夏乔')}/${encodeURIComponent('美食_2')}.webp`,
  );
  assert.equal(
    私聊图片地址('名字 带空格/相'),
    `${素材基址}/微信圈/${encodeURIComponent('名字 带空格')}/${encodeURIComponent('相')}.webp`,
  );
  assert.equal(私聊图片地址('纯一级'), `${素材基址}/微信圈/${encodeURIComponent('纯一级')}.webp`);
  assert.equal(朋友圈图片地址('夏乔/美食_2'), 私聊图片地址('夏乔/美食_2'));
  assert.equal(
    朋友圈图片地址('坏图.webp" onerror="x=1'),
    `${素材基址}/微信圈/${encodeURIComponent('坏图.webp" onerror="x=1')}.webp`,
  );
  // 成人：@adult/ 前缀剥除，逐段编码，无 .webp 后缀
  assert.equal(
    私聊图片地址('@adult/苏晚/夜色'),
    `${成人素材基址}/${encodeURIComponent('苏晚')}/${encodeURIComponent('夜色')}`,
  );
  assert.equal(
    私聊图片地址('@adult/苏晚/夜色 一'),
    `${成人素材基址}/${encodeURIComponent('苏晚')}/${encodeURIComponent('夜色 一')}`,
  );
  assert.equal(私聊图片地址('@adult/单段'), `${成人素材基址}/${encodeURIComponent('单段')}`);
  // 地址函数本身仍由新模块声明（拒绝回退为硬编码裸 URL 串）
  assert.match(资源与皮肤源码, /图\.startsWith\('@adult\/'\)/);
  assert.match(资源与皮肤源码, /\.webp`;/);
});

test('手机CSS 模板串从声明到闭合完整迁移，关键选择器与响应式规则保留', () => {
  const 模板起 = 资源与皮肤源码.indexOf('export const 手机CSS = `');
  assert.notEqual(模板起, -1, '手机CSS 应以模板串声明开始');
  const 模板尾 = 资源与皮肤源码.indexOf('`;', 模板起);
  assert.ok(模板尾 > 模板起, '手机CSS 模板串必须闭合');
  const css = 资源与皮肤源码.slice(模板起 + 'export const 手机CSS = `'.length, 模板尾);

  // 模板内部一律用 #${ROOT_ID} 命名空间插值，不得出现裸选择器根
  assert.doesNotMatch(css, /#rq-phone-root/, 'CSS 必须引用 ROOT_ID 插值而非裸根');
  assert.match(css, /#\$\{ROOT_ID\}\{position:fixed;right:18px;bottom:76px;z-index:99990/, '根壳定位规则完整');
  // 手机壳注释与动画帧保留（授权说明与滑入/响铃动画）
  assert.ok(css.includes('yuzuki 授权改造'), '手机壳授权注释应随迁');
  for (const 帧 of ['rqp-ring', 'rqp-meeting-breathe', 'rqp-slidein', 'rqp-chat-red', 'rqp-tp']) {
    assert.ok(css.includes(`@keyframes ${帧}`), `缺少动画帧:${帧}`);
  }

  // 根壳/窗口
  for (const 选择器 of ['rqp-shell', 'rqp-toggle', 'rqp-close', 'rqp-resize', 'rqp-guide', 'rqp-punch', 'rqp-status', 'rqp-screen', 'rqp-batt']) {
    assert.ok(css.includes(`.${选择器}`), `根壳缺少:${选择器}`);
  }
  // 微信聊天
  for (const 选择器 of ['rqp-tabs', 'rqp-row', 'rqp-bubbles', 'rqp-line', 'rqp-b', 'rqp-msg-menu', 'rqp-chat-photo', 'rqp-typing', 'rqp-input', 'rqp-plus', 'rqp-gear', 'rqp-back', 'rqp-chat-state']) {
    assert.ok(css.includes(`.${选择器}`), `聊天缺少:${选择器}`);
  }
  // 朋友圈/考古
  for (const 选择器 of ['rqm-cover', 'rqw-feed', 'rqw-post', 'rqw-name', 'rqw-only', 'rqw-time', 'rqw-dots', 'rqw-text', 'rqw-box', 'rqw-photo', 'rqw-hero', 'rqw-divider', 'rqw-quiz', 'rqw-more']) {
    assert.ok(css.includes(`.${选择器}`), `朋友圈缺少:${选择器}`);
  }
  // 来电
  for (const 选择器 of ['rqp-call', 'rqp-call .rqp-ava', 'rqp-call .acts .ok', 'rqp-call .acts .no']) {
    assert.ok(css.includes(`.${选择器}`), `来电缺少:${选择器}`);
  }
  // 设置
  for (const 选择器 of ['rqp-set', 'rqp-set .save', 'rqp-set .credit', 'rqp-api-section', 'custom-api-fields']) {
    assert.ok(css.includes(`.${选择器}`), `设置缺少:${选择器}`);
  }
  // 头像三类语义框与白字恢复注释保持
  for (const 选择器 of ['avatar-main', 'avatar-shadow', 'avatar-group']) {
    assert.ok(css.includes(`.${选择器}`), `头像语义框缺少:${选择器}`);
  }
  assert.ok(css.includes('-webkit-text-fill-color:currentColor'), '深色主题白字恢复规则保持');
  // 响应式/移动端断点（壳宽高 min() 与安全区）
  assert.ok(css.includes('width:min(320px,92vw)'), '壳宽移动端响应式保持');
  assert.ok(css.includes('height:min(692px,80vh)'), '壳高移动端响应式保持');
  assert.ok(css.includes('env(safe-area-inset-bottom)'), '安全区适配保持');
  assert.ok(css.includes('width:min(176px,100%)'), '聊天气泡图片移动端封顶保持');
});

test('头像块父亲/丈夫影子规则、姐妹群/群头像规则保持', () => {
  const { 头像块 } = 执行TS片段(资源主体(), ['头像块']);
  // 父亲与丈夫共用柯南影子头像
  assert.match(头像块('父亲'), /avatar-shadow/, '父亲头像应使用影子语义框');
  assert.match(decodeURIComponent(头像块('父亲')), /头像\/影子\.webp/, '父亲头像应指向 影子.webp');
  assert.match(头像块('阿远'), /avatar-shadow/, '丈夫头像应使用影子语义框');
  assert.match(头像块('大刘'), /avatar-shadow/);
  assert.match(decodeURIComponent(头像块('阿远')), /头像\/影子\.webp/);
  // 妻子（非夫非父）走本人图，无影子
  assert.doesNotMatch(头像块('夏乔'), /avatar-/);
  assert.match(decodeURIComponent(头像块('夏乔')), /头像\/夏乔\.webp/);
  // 主角特殊框、群/姐妹群群像框
  assert.match(头像块('主角'), /avatar-main/);
  assert.match(头像块('群'), /avatar-group/);
  assert.match(decodeURIComponent(头像块('群')), /头像\/群\.webp/);
  assert.match(头像块('姐妹群'), /avatar-group/);
  assert.match(decodeURIComponent(头像块('姐妹群')), /头像\/姐妹群\.webp/);
  // 陌生名字回退本人图而非影子
  assert.doesNotMatch(头像块('路人'), /avatar-/);
  assert.match(decodeURIComponent(头像块('路人')), /头像\/路人\.webp/);
  // 图挂了只用常量纯文本回退；不得把持久角色名拼进内联事件属性。
  assert.match(头像块('夏乔'), /var p=this\.parentElement;if\(p\)p\.textContent='\?'/, '头像 onerror 使用常量回退');
  assert.doesNotMatch(头像块('夏乔'), /this\.remove\(\);this\.parentElement/, '头像失败不能访问已移除节点的父元素');
  const 异常头像 = 头像块(`x" onerror="globalThis.__rq=1`);
  assert.equal((异常头像.match(/\sonerror=/g) ?? []).length, 1);
  assert.doesNotMatch(异常头像, /onerror="[^"]*globalThis/);
});

test('群消息合法发言人白名单与头像归属规则保持', () => {
  const { 群消息头像名 } = 执行TS片段(资源主体(), ['群消息头像名']);
  // 群/姐妹群正文以「发言人:内容」保存，气泡头像跟发言人走
  assert.equal(群消息头像名('群', '夏乔:今天去商场', '群'), '夏乔');
  assert.equal(群消息头像名('群', '阿远：有人吗', '群'), '阿远', '全角冒号与丈夫白名单都要识别');
  assert.equal(群消息头像名('姐妹群', '苏晚:明天见', '姐妹群'), '苏晚');
  // 白名单外发言人回退群头像，绝不放行路人名
  assert.equal(群消息头像名('群', '路人:你好', '群'), '群');
  assert.equal(群消息头像名('群', '没有冒号的消息', '群'), '群');
  assert.equal(群消息头像名('群', '名字超长到十三个字的发言人:内容', '群'), '群', '超出 12 字截取宽度的头部不得误判');
  // 非群会话一律用默认名，不解析冒号前缀
  assert.equal(群消息头像名('私聊', '夏乔:你好', '林默'), '林默');
  assert.equal(群消息头像名('姐妹群', '无冒号', '姐妹群'), '姐妹群');
});

test('门面仍纯 re-export，无资源定义残留', () => {
  assert.match(门面源码, /export \* from '\.\/手机\/内核';/);
  for (const 模式 of [/const ROOT_ID/, /const 素材基址/, /const 成人素材基址/, /const 手机CSS/, /function 头像块/, /function 群消息头像名/, /function 朋友圈图片地址/, /function 私聊图片地址/, /function 手机图标/]) {
    assert.doesNotMatch(门面源码, 模式, `门面不应定义:${模式}`);
  }
});

// ══════════════════════════════════════════════════════════════════
// P7A 会话瞬态（./壳/会话瞬态）：唯一所有权、显式 API、可执行回归
// ══════════════════════════════════════════════════════════════════

/** 把无 import 的 TS 片段转译为 CommonJS 并注入外部依赖执行（供批次控制器切片使用）。 */
function 执行TS片段带依赖(片段, 导出名, 依赖) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(依赖), js)(module, module.exports, ...Object.values(依赖));
  return module.exports;
}

test('会话瞬态 真实拥有全部瞬态定义，内核无重复声明，且每种只定义一次', () => {
  // 新所有者真实声明（spec 迁移清单逐项）
  assert.match(会话瞬态源码, /const 正在输入会话 = new Map<string, number>\(\)/);
  assert.match(会话瞬态源码, /export interface 会话输入租约 \{/);
  assert.match(会话瞬态源码, /export function 会话输入键\(/);
  assert.match(会话瞬态源码, /export function 开始会话输入\(/);
  assert.match(会话瞬态源码, /export function 结束会话输入\(/);
  assert.match(会话瞬态源码, /export function 会话正在输入\(/);
  assert.match(会话瞬态源码, /export interface 会话待回复上下文 \{/);
  assert.match(会话瞬态源码, /const 会话待回复 = new Map<string, 会话待回复上下文>\(\)/);
  assert.match(会话瞬态源码, /const 会话草稿 = new Map<string, string>\(\)/);
  assert.match(会话瞬态源码, /const 会话输入聚焦 = new Set<string>\(\)/);
  assert.match(会话瞬态源码, /let 手机聊天渲染世代 = 0;/);
  assert.match(会话瞬态源码, /let 手机聊天状态刷新计时: ReturnType<typeof setInterval> \| null = null;/);
  assert.match(会话瞬态源码, /export const 手机聊天批次 = new 手机聊天批次控制器\(/);
  assert.match(会话瞬态源码, /export function 注册手机聊天批次执行器\(/);
  assert.match(会话瞬态源码, /export interface 手机发送租约 \{/);
  assert.match(会话瞬态源码, /export function 手机发送租约仍有效\(/);
  assert.match(会话瞬态源码, /export function 静音会议私聊回复生成中\(\): boolean \{/);
  // 显式 API 覆盖取/设/删/遍历待回复、草稿、聚焦、世代、计时器
  for (const 符号 of ['取会话待回复', '登记会话待回复', '删除会话待回复', '会话待回复键列表', '取会话草稿', '写会话草稿', '删除会话草稿', '标记会话输入聚焦', '取消会话输入聚焦', '会话输入聚焦中', '开始新手机聊天渲染世代', '手机聊天渲染世代仍当前', '替换手机聊天状态刷新计时', '清除手机聊天状态刷新计时', '当前会话批次键', '释放会话待回复', '批次仍在红灯', '取消手机聊天批次键', '取消手机聊天批次', '清理失效手机聊天批次', '收口手机聊天输入键']) {
    assert.match(会话瞬态源码, new RegExp(`export function ${符号}\\(`), `会话瞬态应导出 ${符号}`);
  }

  // 每种可变状态在会话瞬态只定义一次
  for (const 声明 of ['const 正在输入会话 = new Map', 'const 会话待回复 = new Map', 'const 会话草稿 = new Map', 'const 会话输入聚焦 = new Set', 'let 手机聊天渲染世代', 'let 手机聊天状态刷新计时', 'new 手机聊天批次控制器']) {
    assert.equal((会话瞬态源码.match(new RegExp(声明.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length, 1, `${声明} 只允许定义一次`);
  }

  // 内核不再重复声明任何瞬态状态/实例，也不再直接持有 Map/Set 本体
  for (const 模式 of [
    /const 正在输入会话/,
    /interface 会话输入租约 \{/,
    /function 会话输入键\(/,
    /function 开始会话输入\(/,
    /function 结束会话输入\(/,
    /function 会话正在输入\(/,
    /interface 会话待回复上下文 \{/,
    /const 会话待回复 = new Map/,
    /const 会话草稿 = new Map/,
    /const 会话输入聚焦 = new Set/,
    /let 手机聊天渲染世代/,
    /let 手机聊天状态刷新计时/,
    /new 手机聊天批次控制器/,
    /function 释放会话待回复\(/,
    /function 批次仍在红灯\(/,
    /function 取消手机聊天批次键\(/,
    /function 取消手机聊天批次\(/,
    /function 清理失效手机聊天批次\(/,
    /function 收口手机聊天输入键\(/,
    /interface 手机发送租约 \{/,
    /function 手机发送租约仍有效\(/,
    /export function 静音会议私聊回复生成中\(/,
    /const 会话待回复\.|会话待回复\.get\(|会话待回复\.set\(|会话待回复\.has\(|会话待回复\.keys\(|会话待回复\.delete\(/,
    /会话草稿\.get\(|会话草稿\.set\(|会话草稿\.delete\(/,
    /会话输入聚焦\.add\(|会话输入聚焦\.delete\(|会话输入聚焦\.has\(/,
  ]) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明/直接持有:${模式}`);
  }
});

test('会话瞬态 不反向 import 内核/门面/资源皮肤，依赖方向保持叶子向', () => {
  assert.doesNotMatch(
    会话瞬态源码,
    /from '\.\.\/内核'|from '\.\/内核'|from '\.\.\/手机系统'|from '\.\/手机系统'|from '\.\/壳\/资源与皮肤'|from '\.\/壳\/挂载'|from '\.\/壳\/红点与开合'|from '\.\/渲染/,
    '会话瞬态 不得反向 import 内核/门面或任何壳层上层模块',
  );
  // 允许的叶子依赖（spec 清单）：运行时上下文/数据层/UI刷新/静音会议旁路/手机时间线租约/手机聊天批次
  for (const 依赖 of ['../运行时上下文', '../数据层', '../UI刷新', '../静音会议旁路', '../../手机时间线租约', '../../手机聊天批次']) {
    assert.ok(会话瞬态源码.includes(`from '${依赖}'`), `会话瞬态应依赖叶子:${依赖}`);
  }
});

test('瞬态状态只经显式 API 访问：交互模块/调度器/chat 页各自消费所需，无裸 Map/Set 与直写', () => {
  // P8:交互模块继续严格消费会话输入/待回复/批次/租约 API
  assert.match(交互源码, /import \{[\s\S]*取会话待回复,[\s\S]*登记会话待回复,[\s\S]*会话待回复键列表,[\s\S]*\} from '\.\.\/壳\/会话瞬态';/);
  assert.match(交互源码, /import \{[\s\S]*会话输入键,[\s\S]*开始会话输入,[\s\S]*结束会话输入,[\s\S]*会话正在输入,[\s\S]*\} from '\.\.\/壳\/会话瞬态';/);
  // 批次执行器由交互模块在模块初始化收尾处注册真实实现
  assert.match(交互源码, /注册手机聊天批次执行器\(执行待回复批次\);/);

  // 调度器（P7B2 迁入 ./壳/渲染）：渲染世代与失效批次清理、收口改走显式 API
  assert.match(渲染index源码, /import \{[\s\S]*清理失效手机聊天批次,[\s\S]*开始新手机聊天渲染世代,[\s\S]*当前会话批次键,[\s\S]*收口手机聊天输入键[,]?[\s\S]*\} from '\.\.\/会话瞬态';/);
  assert.match(渲染index源码, /const 本次渲染世代 = 开始新手机聊天渲染世代\(\);/);
  assert.match(渲染index源码, /清理失效手机聊天批次\(\);/);

  // chat 页：草稿/聚焦/批次/世代核对/计时器替换与清除
  assert.match(渲染chat源码, /import \{[\s\S]*写会话草稿,[\s\S]*取会话草稿,[\s\S]*删除会话草稿,[\s\S]*标记会话输入聚焦,[\s\S]*会话输入聚焦中,[\s\S]*\} from '\.\.\/会话瞬态';/);
  assert.match(渲染chat源码, /手机聊天渲染世代仍当前\(本次渲染世代\)/);
  assert.match(渲染chat源码, /替换手机聊天状态刷新计时\(setInterval/);
  assert.match(渲染chat源码, /清除手机聊天状态刷新计时\(\);/);
  assert.doesNotMatch(渲染chat源码, /手机聊天状态刷新计时 = setInterval/);
  assert.doesNotMatch(渲染chat源码, /手机聊天渲染世代 \+= 1/);

  // P8:四个所有者都不再自建裸 Map/Set/自增/直写（交互模块只经显式 API 访问）
  for (const [名称, 源码] of [
    ['内核', 内核源码],
    ['交互模块', 交互源码],
    ['调度器', 渲染index源码],
    ['chat 页', 渲染chat源码],
  ]) {
    assert.doesNotMatch(源码, /const 正在输入会话|const 会话待回复 = new Map|const 会话草稿 = new Map|const 会话输入聚焦 = new Set|let 手机聊天渲染世代|let 手机聊天状态刷新计时/, `${名称} 不应自建第二份瞬态状态`);
  }
});

test('输入引用计数可执行回归：同会话加二减一仍为正在输入，不同聊天/世代/会话互不干扰', () => {
  const 计数片段 = 截源(会话瞬态源码, 'const 正在输入会话', 'export interface 会话待回复上下文');
  const { 开始会话输入, 结束会话输入, 会话正在输入 } = 执行TS片段(计数片段, [
    '开始会话输入',
    '结束会话输入',
    '会话正在输入',
  ]);
  const a101 = 开始会话输入('101', 'chat-a', 1);
  const b101 = 开始会话输入('101', 'chat-b', 1);
  const b101另一个 = 开始会话输入('101', 'chat-b', 1);
  const a新世代 = 开始会话输入('101', 'chat-a', 2);
  结束会话输入(a101);
  结束会话输入(b101);
  assert.equal(会话正在输入('101', 'chat-a', 1), false);
  assert.equal(会话正在输入('101', 'chat-a', 2), true, '旧世代 finally 不得释放新分支的同会话输入锁');
  assert.equal(会话正在输入('101', 'chat-b', 1), true, 'A 档完成不得释放 B 档同门牌的剩余任务');
  结束会话输入(b101另一个);
  结束会话输入(a新世代);
  assert.equal(会话正在输入('101', 'chat-b', 1), false);
  // 全部释放后同键彻底清零（加一再减一）
  const 再入 = 开始会话输入('102', 'chat-c', 1);
  结束会话输入(再入);
  assert.equal(会话正在输入('102', 'chat-c', 1), false);
});

test('批次执行器注册前请求安全 no-op 不崩溃，注册后请求准确转发', () => {
  const { 手机聊天批次控制器 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机聊天批次.ts');
  const 片段 = 截源(会话瞬态源码, 'type 批次执行器', 'function 批次仍在红灯');
  const { 注册手机聊天批次执行器, 手机聊天批次 } = 执行TS片段带依赖(
    片段,
    ['注册手机聊天批次执行器', '手机聊天批次'],
    { 手机聊天批次控制器 },
  );
  const 收到 = [];
  // 注册前：批次请求回调经 已注册批次执行器?.() 安全跳过。
  // 控制器在写入中(写入中数>0)时只记 立即请求=true，必须 完成写入 后才允许开始红灯
  // （防止 AI 读取尚未落库气泡），所以每次 开始写入 后都要先 完成写入 再 立即发送。
  手机聊天批次.开始写入('k', 'm1');
  手机聊天批次.完成写入('k', 'm1', true);
  手机聊天批次.立即发送('k');
  assert.equal(收到.length, 0, '注册前批次请求应安全 no-op');
  assert.equal(手机聊天批次.状态('k').灯, '红', '未注册时控制器红灯语义照常');
  手机聊天批次.取消请求('k');

  // 注册后：请求对象（键/消息标识/请求序号）准确转发给执行器
  注册手机聊天批次执行器(请求 => {
    收到.push(请求);
  });
  手机聊天批次.开始写入('k', 'm1');
  手机聊天批次.完成写入('k', 'm1', true);
  手机聊天批次.立即发送('k');
  assert.deepEqual(收到, [{ 键: 'k', 消息标识: ['m1'], 请求序号: 3 }], '注册后应转发完整请求（序号=红灯光 1→取消+1→红灯光 3）');
});

test('手机发送租约 的聊天 ID + 时间线租约 + 绝对时段判据静态不弱化', () => {
  assert.match(会话瞬态源码, /export interface 手机发送租约 \{/);
  assert.match(会话瞬态源码, /会场摘要租约: 会场私聊摘要租约 \| null;/);
  assert.match(会话瞬态源码, /export function 手机发送租约仍有效\(租约: 手机发送租约\): boolean \{/);
  assert.match(
    会话瞬态源码,
    /当前ID === 租约\.聊天ID && 手机时间线租约仍有效\(租约\.时间线租约, 当前ID, SillyTavern\.chat \?\? \[\], 当前手机绝对时段\(\)\)/,
    '仍必须同时校验 聊天ID 一致性与手机时间线租约（含当前绝对时段）有效性',
  );
  // P8:交互模块消费同一判据与类型，不再自建副本
  assert.match(交互源码, /手机发送租约仍有效\(发送租约\)/);
  assert.match(交互源码, /type 手机发送租约,/);
});

test('内核显式 re-export 静音会议私聊回复生成中，门面仍纯 re-export', () => {
  assert.match(内核源码, /export \{ 静音会议私聊回复生成中 \} from '\.\/壳\/会话瞬态';/);
  assert.doesNotMatch(内核源码, /export function 静音会议私聊回复生成中\(/);
  assert.match(门面源码, /export \* from '\.\/手机\/内核';/);
});

// ══════════════════════════════════════════════════════════════════
// P7B1 挂载与红点/开合（./壳/挂载 + ./壳/红点与开合）
// ══════════════════════════════════════════════════════════════════

const 挂载源码 = readFileSync(new URL('./壳/挂载.ts', 手机目录), 'utf8');
const 红点开合源码 = readFileSync(new URL('./壳/红点与开合.ts', 手机目录), 'utf8');

test('挂载与红点/开合 真实拥有各自状态与函数，内核无重复定义', () => {
  // 挂载域
  assert.match(挂载源码, /let 挂好 = false;/);
  assert.match(挂载源码, /let 已挂载拉回视口: \(\) => void = \(\) => \{\};/);
  assert.match(挂载源码, /let 已挂载教程: \(\) => void = \(\) => \{\};/);
  assert.match(挂载源码, /export function 挂载手机\(\): void \{/);
  assert.match(挂载源码, /export function 拉回手机视口\(\): void \{/);
  assert.match(挂载源码, /export function 显示手机教程\(\): void \{/);
  assert.match(挂载源码, /export function 注册手机挂载端口\(端口: 手机挂载端口\): void \{/);
  assert.match(挂载源码, /export interface 手机挂载端口 \{/);
  // 挂载端口职责逐项覆盖
  for (const 职责 of ['结束当前聊天输入', '读取当前页面', '写入当前页面', '恢复父亲通话', '重绘', '刷新红点', '开合防抖', '有来电']) {
    assert.ok(挂载源码.includes(职责), `挂载端口应覆盖职责:${职责}`);
  }
  // 红点/开合域
  assert.match(红点开合源码, /let 上次会议手机渲染键 = '';/);
  assert.match(红点开合源码, /export function 会议手机渲染键\(状态: 静音会议手机状态\): string \{/);
  assert.match(红点开合源码, /export function 记录会议手机渲染键\(状态: 静音会议手机状态\): void \{/);
  assert.match(红点开合源码, /let 上次开合 = 0;/);
  assert.match(红点开合源码, /export function 开合防抖\(\): boolean \{/);
  assert.match(红点开合源码, /export function 有来电\(\): boolean \{/);
  assert.match(红点开合源码, /export function 刷新红点\(\): void \{/);
  assert.match(红点开合源码, /export function 打开手机\(直达来电 = false\): void \{/);
  assert.match(红点开合源码, /export function 收起手机以显示数据库\(\): void \{/);
  assert.match(红点开合源码, /export interface 手机红点开合端口 \{/);

  // 内核不再重复声明
  for (const 模式 of [
    /let 挂好/,
    /let 拉回视口/,
    /let 显示手机教程/,
    /function 挂载手机\(/,
    /let 上次会议手机渲染键/,
    /function 会议手机渲染键\(/,
    /let 上次开合/,
    /function 开合防抖\(/,
    /function 有来电\(/,
    /function 刷新红点\(/,
    /function 打开手机\(/,
    /function 收起手机以显示数据库\(/,
  ]) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }
});

test('挂载与红点/开合 依赖方向无环：红点→挂载→资源/UI注册表，均不反向 import 内核/门面', () => {
  for (const [名称, 源码] of [
    ['挂载', 挂载源码],
    ['红点与开合', 红点开合源码],
  ]) {
    assert.doesNotMatch(
      源码,
      /from '\.\.\/内核'|from '\.\/内核'|from '\.\.\/手机系统'|from '\.\/手机系统'/,
      `${名称} 不得反向 import 内核/门面`,
    );
  }
  // 红点与开合 单向依赖挂载
  assert.match(红点开合源码, /import \{ 挂载手机, 拉回手机视口, 显示手机教程, type 手机页面 \} from '\.\/挂载';/);
  assert.doesNotMatch(挂载源码, /from '\.\/红点与开合'/, '挂载不得反向依赖红点与开合');
  // 挂载经 UI 刷新注册表安装真实实现，且只此一处
  assert.match(挂载源码, /import \{ 注册手机UI刷新实现 \} from '\.\.\/UI刷新';/);
  assert.match(挂载源码, /注册手机UI刷新实现\(端口\.重绘, 端口\.刷新红点\);/);
  // 挂载只依赖资源/UI刷新/旁路/父亲通话等叶子
  for (const 依赖 of ['./资源与皮肤', '../UI刷新', '../静音会议旁路', '../交互/父亲通话']) {
    assert.ok(挂载源码.includes(`from '${依赖}'`), `挂载应依赖叶子:${依赖}`);
  }
});

test('挂载模块保留旧壳清理、DOM 注入、关闭/悬浮/拖拽/缩放与关键事件/localStorage key', () => {
  // 每次 iframe 重载先移除页面残留旧 root/style 再重建
  assert.match(挂载源码, /doc\.getElementById\(ROOT_ID\)\?\.remove\(\);/);
  assert.match(挂载源码, /doc\.getElementById\(`\$\{ROOT_ID\}-css`\)\?\.remove\(\);/);
  assert.match(挂载源码, /style\.textContent = 手机CSS;/);
  assert.match(挂载源码, /root\.innerHTML =/);
  for (const 类 of ['rqp-shell', 'rqp-close', 'rqp-punch', 'rqp-status', 'rqp-screen', 'rqp-toggle', 'rqp-resize']) {
    assert.ok(挂载源码.includes(类), `挂载注入应含:${类}`);
  }
  // 事件订阅/发射与关闭语义
  assert.match(挂载源码, /eventOn\('人妻公寓:特殊场景状态'/);
  assert.match(挂载源码, /eventEmit\('人妻公寓:手机收起'\)/);
  assert.match(挂载源码, /addEventListener\('click', ev => \{\s*ev\.stopPropagation\(\);/);
  assert.match(挂载源码, /addEventListener\('pointerdown'/);
  assert.match(挂载源码, /addEventListener\('pointermove'/);
  assert.match(挂载源码, /addEventListener\('pointerup'/);
  // localStorage key 原样
  for (const 键 of ['人妻公寓_手机操作教程_v1', '人妻公寓_手机位置', '人妻公寓_手机缩放', '人妻公寓_手机钮位置']) {
    assert.ok(挂载源码.includes(`'${键}'`), `挂载应保留 localStorage key:${键}`);
  }
  // 拖拽夹取、缩放范围、教程只显示一次
  assert.match(挂载源码, /Math\.min\(1\.6, Math\.max\(0\.6, 起\.s \+ d \/ 260\)\)/);
  assert.match(挂载源码, /localStorage\.getItem\(首次教程键\) === '1'/);
  // 挂载完成后的刷新/重绘/父亲恢复顺序保持
  const 挂载尾 = 截源(挂载源码, '挂好 = true;', 'console.info');
  assert.match(挂载尾, /已注册端口\?\.刷新红点\(\);/);
  assert.match(挂载尾, /已注册端口\?\.重绘\(\);/);
  assert.match(挂载尾, /已注册端口\?\.恢复父亲通话\(\);/);
});

test('刷新红点 payload、会议门、未读合并与 talk 重绘判据保持', () => {
  const 红点函数 = 截源(红点开合源码, 'export function 刷新红点()', 'export function 打开手机');
  assert.match(红点函数, /清理失效手机聊天批次\(\);/);
  assert.match(红点函数, /const 未读 = 会话有未读\(库, undefined, 楼, 当前绝对时段\);/);
  assert.match(红点函数, /const 圈新 = 朋友圈有未读\(库, 楼, 当前绝对时段\);/);
  assert.match(红点函数, /const 可呈现来电 = 有来电\(\) && !会议手机\.场景中;/);
  // 红点合并聊天未读与朋友圈未读；来电在会议中不可呈现；静音会议呼吸态
  assert.match(红点函数, /root\.classList\.toggle\('has-unread', 未读 \|\| 圈新\);/);
  assert.match(红点函数, /root\.classList\.toggle\('ringing', 可呈现来电\);/);
  assert.match(红点函数, /root\.classList\.toggle\('mute-meeting-phone', 会议手机\.场景中 && 会议手机\.已开放\);/);
  // 手机状态 payload 不变
  assert.match(红点函数, /eventEmit\('人妻公寓:手机状态', \{/);
  assert.match(红点函数, /未读: 未读 \|\| 圈新,/);
  assert.match(红点函数, /来电: 可呈现来电,/);
  assert.match(红点函数, /静音会议: 会议手机,/);
  // 会议状态变化或 talk 页打开时重绘
  assert.match(红点函数, /会议手机状态已变化 \|\| 已注册端口\?\.读取当前页面\(\)\.名 === 'talk'/);
  assert.match(红点函数, /root\.classList\.contains\('open'\)\)\s*已注册端口\?\.渲染\(\);/);
});

test('打开手机 会议/父亲/call 导航优先级、直达来电与普通收起语义保持', () => {
  const 打开段 = 截源(红点开合源码, 'export function 打开手机', 'export function 收起手机以显示数据库');
  assert.match(打开段, /挂载手机\(\);/);
  assert.match(打开段, /if \(!开合防抖\(\)\) return;/);
  // 会议不可打开提示
  assert.match(打开段, /!root\.classList\.contains\('open'\) && 会议手机\.场景中 && !会议手机\.可打开/);
  assert.match(打开段, /eventEmit\('人妻公寓:提示', 会议手机\.禁用原因\);/);
  // 普通再次点击会收起；直达来电不收起已打开手机
  assert.match(打开段, /root\.classList\.contains\('open'\) && !直达来电/);
  assert.match(打开段, /已注册端口\?\.结束当前聊天输入\(\);/);
  assert.match(打开段, /eventEmit\('人妻公寓:手机收起'\)/);
  // 导航优先级：会议强制 chats → 活动父亲通话 talk → 直达来电 call
  const 会议位 = 打开段.indexOf('会议手机.场景中');
  const 写chats = 打开段.indexOf("已注册端口?.写入当前页面({ 名: 'chats' })", 会议位);
  const 父亲位 = 打开段.indexOf('活动父亲通话()');
  const 写talk = 打开段.indexOf("已注册端口?.写入当前页面({ 名: 'talk' })");
  const 直达位 = 打开段.indexOf('直达来电 && 有来电()');
  const 写call = 打开段.indexOf("已注册端口?.写入当前页面({ 名: 'call' })");
  assert.ok(写chats > 会议位 && 父亲位 > 写chats && 写talk > 父亲位 && 直达位 > 写talk && 写call > 直达位, '导航优先级顺序必须保持');
  // 打开后渲染/父亲恢复/拉回/教程
  assert.match(打开段, /已注册端口\?\.渲染\(\);/);
  assert.match(打开段, /void 恢复父亲通话\(\);/);
  assert.match(打开段, /拉回手机视口\(\);/);
  assert.match(打开段, /显示手机教程\(\);/);
});

test('开合 450ms 双触发防抖与收起手机以显示数据库语义保持', () => {
  assert.match(红点开合源码, /450ms 内只认第一发/);
  const 防抖段 = 截源(红点开合源码, 'let 上次开合 = 0;', 'export function 有来电');
  assert.match(防抖段, /if \(now - 上次开合 < 450\) return false;/);
  assert.match(防抖段, /上次开合 = now;/);

  assert.match(
    红点开合源码,
    /export function 收起手机以显示数据库\(\): void \{\s*const root = 根文档\(\)\.getElementById\(ROOT_ID\);\s*if \(!root\?\.classList\.contains\('open'\)\) return;\s*已注册端口\?\.结束当前聊天输入\(\);\s*root\.classList\.remove\('open'\);\s*root\.querySelector\('\.rqp-guide'\)\?\.remove\(\);\s*eventEmit\('人妻公寓:手机收起'\);\s*\}/,
    '收起手机以显示数据库 语义保持',
  );
});

test('内核显式 re-export 三个旧公共 API，门面仍纯 re-export', () => {
  // 旧公共 API 全部显式 re-export（P7B2:端口注册已随 当前页 迁至渲染调度器）
  assert.match(内核源码, /export \{ 挂载手机 \} from '\.\/壳\/挂载';/);
  assert.match(内核源码, /export \{ 刷新红点, 打开手机 \} from '\.\/壳\/红点与开合';/);
  assert.doesNotMatch(内核源码, /注册手机UI刷新实现\(/);
  assert.match(门面源码, /export \* from '\.\/手机\/内核';/);
});

// ══════════════════════════════════════════════════════════════════
// P7B2 渲染调度器与六页面（./壳/渲染）
// ══════════════════════════════════════════════════════════════════

const 渲染index源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 渲染共享源码 = readFileSync(new URL('./壳/渲染/共享.ts', 手机目录), 'utf8');
const 渲染chats源码 = readFileSync(new URL('./壳/渲染/chats.ts', 手机目录), 'utf8');
const 渲染chat源码 = readFileSync(new URL('./壳/渲染/chat.ts', 手机目录), 'utf8');
const 渲染moments源码 = readFileSync(new URL('./壳/渲染/moments.ts', 手机目录), 'utf8');
const 渲染call源码 = readFileSync(new URL('./壳/渲染/call.ts', 手机目录), 'utf8');
const 渲染talk源码 = readFileSync(new URL('./壳/渲染/talk.ts', 手机目录), 'utf8');
const 渲染settings源码 = readFileSync(new URL('./壳/渲染/settings.ts', 手机目录), 'utf8');
const 业务端口源码 = readFileSync(new URL('./壳/渲染/业务端口.ts', 手机目录), 'utf8');

test('渲染 index/共享/六页面 真实拥有对应分支，内核不再声明 当前页/结束当前聊天输入/渲染 或六页面 DOM 主体', () => {
  // 六页面各独立模块
  for (const [文件, 函数] of [
    ['chats', '渲染chats'],
    ['chat', '渲染chat'],
    ['moments', '渲染moments'],
    ['call', '渲染call'],
    ['talk', '渲染talk'],
    ['settings', '渲染settings'],
  ]) {
    assert.match(
      readFileSync(new URL(`./壳/渲染/${文件}.ts`, 手机目录), 'utf8'),
      new RegExp(`export function ${函数}\\(上下文: 渲染上下文\\): void \\{`),
      `${文件} 应真实拥有页面 renderer`,
    );
  }
  // 调度器拥有 当前页/结束当前聊天输入/渲染 与六页分派
  assert.match(渲染index源码, /let 当前页: 手机页面 = \{ 名: 'chats' \};/);
  assert.match(渲染index源码, /export function 结束当前聊天输入\(\): void \{/);
  assert.match(渲染index源码, /export function 渲染\(\): void \{/);
  assert.match(渲染index源码, /else if \(当前页\.名 === 'chat' && 当前页\.会话\) 渲染chat\(上下文\);/);
  // 内核不再声明
  for (const 模式 of [/let 当前页/, /function 结束当前聊天输入\(/, /function 渲染\(/]) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再声明:${模式}`);
  }
});

test('渲染模块均不反向 import 内核/门面，子页不 import 调度器，业务端口唯一且交互模块准确注册四回调', () => {
  for (const [名称, 源码] of [
    ['渲染index', 渲染index源码],
    ['渲染共享', 渲染共享源码],
    ['渲染chats', 渲染chats源码],
    ['渲染chat', 渲染chat源码],
    ['渲染moments', 渲染moments源码],
    ['渲染call', 渲染call源码],
    ['渲染talk', 渲染talk源码],
    ['渲染settings', 渲染settings源码],
    ['业务端口', 业务端口源码],
  ]) {
    assert.doesNotMatch(源码, /from '\.\.\/内核'|from '\.\.\/\.\.\/内核'|from '\.\.\/手机系统'|from '\.\.\/\.\.\/手机系统'/, `${名称} 不得反向 import 内核/门面`);
  }
  // 子页只经上下文/共享/叶子访问调度器能力，不 import 渲染/index
  for (const [名称, 源码] of [
    ['chats', 渲染chats源码],
    ['chat', 渲染chat源码],
    ['moments', 渲染moments源码],
    ['call', 渲染call源码],
    ['talk', 渲染talk源码],
    ['settings', 渲染settings源码],
  ]) {
    assert.doesNotMatch(源码, /from '\.\/index'/, `${名称} 不得 import 渲染调度器`);
  }
  // 业务端口四回调唯一 + P8:交互模块注册（内核只做副作用接线）
  assert.match(业务端口源码, /export interface 手机渲染业务端口 \{/);
  for (const 职责 of ['绑定玩家微信撤回', '读赴约条', '约多人出来', '发消息']) {
    assert.ok(业务端口源码.includes(职责), `业务端口应覆盖:${职责}`);
  }
  assert.match(交互源码, /注册手机渲染业务端口\(\{/);
  assert.match(交互源码, /绑定玩家微信撤回,/);
  assert.match(交互源码, /读赴约条,/);
  assert.match(交互源码, /约多人出来,/);
  assert.match(交互源码, /发消息,/);
  assert.doesNotMatch(内核源码, /注册手机渲染业务端口\(/);
  // 页面经 取渲染业务端口 使用，不直接 import 内核
  assert.match(渲染chat源码, /取渲染业务端口\(\)\?\.绑定玩家微信撤回/);
  assert.match(渲染chat源码, /取渲染业务端口\(\)\?\.发消息/);
  assert.match(渲染chat源码, /取渲染业务端口\(\)\?\.读赴约条/);
  // v0.80:发送入口从单聊"+"面板迁到安排邀约页(WeUI 设置页),仍经同一业务端口发起。
  const 渲染invite源码 = readFileSync(new URL('./壳/渲染/invite.ts', 手机目录), 'utf8');
  assert.match(渲染invite源码, /const 端口 = 取渲染业务端口\(\)/);
  assert.match(渲染invite源码, /void 端口\.约多人出来\(邀请成员, 共享安排\)/);
});

test('调度器保持 -1 未就绪语义、时间线放行、渲染世代/批次清理、父亲/会议页面合法化与六页分派', () => {
  const 调度段 = 截源(渲染index源码, 'export function 渲染()', '注册父亲通话UI端口');
  assert.match(调度段, /const 当前绝对时段 = data \? 取绝对时段\(data\) : -1;/);
  // v0.74 第 7 项：-1 未就绪放行由 手机记录在当前时间线 统一识别（只放弃时轴比较），
  // 渲染层不得再用 当前绝对时段 < 0 整表绕过，否则未来楼/错误分支会在未就绪时可见。
  assert.match(调度段, /手机记录在当前时间线/);
  assert.doesNotMatch(调度段, /当前绝对时段 < 0/, '未就绪放行必须由统一函数内部识别，渲染层不得整表绕过');
  assert.match(调度段, /清理失效手机聊天批次\(\);/);
  assert.match(调度段, /开始新手机聊天渲染世代\(\);/);
  assert.match(调度段, /当前页\.名 === 'talk' && !父亲通话/);
  assert.match(调度段, /会议手机\.参与妻\.includes/);
  assert.match(调度段, /会议手机\.场景中 && !会议手机\.可打开/);
  // 六页分派
  for (const 页 of ['chats', 'chat', 'moments', 'call', 'talk', 'settings']) {
    assert.ok(调度段.includes(`渲染${页}(上下文)`), `调度器应分派 ${页}`);
  }
});

test('共享头/底栏保持导航、会议禁用与未读/来电；已读确认归 chat/moments 渲染层', () => {
  assert.match(渲染共享源码, /export function 渲染头\(/);
  assert.match(渲染共享源码, /export function 渲染底栏\(/);
  assert.match(渲染共享源码, /手机图标\('gear'\)/);
  assert.match(渲染共享源码, /写入当前页\(\{ 名: 'settings' \}\)/);
  // v0.80 已读所有权回 chat/moments 渲染层（前台校验异步确认），共享层/底栏只导航，不预写。
  assert.doesNotMatch(渲染共享源码, /写实时手机已读\s*\(/, '底栏不得调用实时已读入口');
  assert.doesNotMatch(渲染共享源码, /创建手机已读时锚/, '共享层不得裸拼已读锚');
  assert.match(渲染chat源码, /写实时手机已读\(\{ 会话 \}, 前台仍有效\)/);
  assert.match(渲染moments源码, /写实时手机已读\(\{ 朋友圈: true \}, 前台仍有效\)/);
  assert.match(渲染共享源码, /会议期间朋友圈暂时冻结。/);
  assert.match(渲染共享源码, /会议期间只开放参与妻私聊。/);
  assert.match(渲染共享源码, /未读 \|\| 有来电\(\)/);
});

test('chat 页保持批次/草稿/interval/撤回/邀约语义', () => {
  assert.match(渲染chat源码, /当前会话批次键\(会话\)/);
  assert.match(渲染chat源码, /批次状态文案/);
  assert.match(渲染chat源码, /替换手机聊天状态刷新计时\(setInterval/);
  assert.match(渲染chat源码, /手机聊天渲染世代仍当前\(本次渲染世代\)/);
  assert.match(渲染chat源码, /标记会话输入聚焦\(批次键\)/);
  assert.match(渲染chat源码, /写会话草稿\(批次键, ta\.value\)/);
  assert.match(渲染chat源码, /取消手机聊天批次\(会话\)/);
  assert.match(渲染chat源码, /手机聊天批次\.立即发送\(批次键\)/);
  assert.match(渲染chat源码, /创建微信撤回定位/);
  assert.match(渲染chat源码, /rqp-chat-photo/);
  assert.match(渲染chat源码, /邀约节拍键/);
  assert.match(渲染chat源码, /上下文\.结束当前聊天输入\(\);/);
  // 草稿不进入回复批次：发送后即删除草稿
  assert.match(渲染chat源码, /删除会话草稿\(批次键\);/);
});

test('moments 页保持考古混排/滚动恢复/题目展开', () => {
  assert.match(渲染moments源码, /查考古/);
  assert.match(渲染moments源码, /体\.scrollTop = Math\.max\(0, 上下文\.当前页\.滚动 \?\? 0\);/);
  assert.match(渲染moments源码, /rqw-quiz/);
  assert.match(渲染moments源码, /人妻公寓:考古选细节/);
  assert.match(渲染moments源码, /人妻公寓:考古到底/);
  assert.match(渲染moments源码, /列出阶段线路候选详情/);
  assert.match(渲染moments源码, /人妻公寓:查看旧动态/);
});

test('settings 页保持宿主模型列表与数据库收起语义', () => {
  assert.match(渲染settings源码, /getModelList\(\{ apiurl: base, key \}\)/);
  assert.doesNotMatch(渲染settings源码, /\.fetch\(/);
  assert.match(渲染settings源码, /收起手机以显示数据库\(\);/);
  assert.match(渲染settings源码, /安装人妻公寓数据库模板/);
  assert.match(渲染settings源码, /确认微信摘要SQLite可写/);
  assert.match(渲染settings源码, /存配置\(\{/);
});

test('父亲/挂载/红点端口只在渲染 index 注册，UI 刷新仍只在挂载层注册，交互模块注册渲染业务端口与批次执行器', () => {
  assert.match(渲染index源码, /注册父亲通话UI端口\(\{/);
  assert.match(渲染index源码, /注册手机挂载端口\(\{/);
  assert.match(渲染index源码, /注册手机红点开合端口\(\{/);
  assert.doesNotMatch(内核源码, /注册父亲通话UI端口\(/);
  assert.doesNotMatch(内核源码, /注册手机挂载端口\(/);
  assert.doesNotMatch(内核源码, /注册手机红点开合端口\(/);
  assert.doesNotMatch(内核源码, /注册手机UI刷新实现\(/);
  assert.doesNotMatch(内核源码, /注册手机渲染业务端口\(|注册手机聊天批次执行器\(/, '内核不再自行注册任何端口');
  assert.match(挂载源码, /注册手机UI刷新实现\(端口\.重绘, 端口\.刷新红点\);/);
  // P8:两个注册由交互模块持有,内核只经副作用 import 保证其在入口模块初始化时执行。
  assert.match(内核源码, /import '\.\/交互\/邀约与发消息';/);
  assert.match(交互源码, /注册手机渲染业务端口\(\{/);
  assert.match(交互源码, /注册手机聊天批次执行器\(执行待回复批次\);/);
});
