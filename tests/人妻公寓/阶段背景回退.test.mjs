/* eslint-disable import-x/no-nodejs-modules -- Node-only background resolver regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const read = path => readFileSync(new URL(`../../src/人妻公寓/界面/客户端/${path}`, import.meta.url), 'utf8');
const app = read('App.vue');
const assets = ts.createSourceFile('assets.ts', read('assets.ts'), ts.ScriptTarget.Latest, true);
const names = new Set([
  '素材基址',
  '许曼君201素材发布配置',
  '规范剧情素材基址',
  '拼剧情事件图片',
  '许曼君分居图片',
  '许曼君离婚素材发布配置',
  '许曼君离婚待发布素材基址',
  '许曼君离婚图片',
  '剧情事件素材发布配置',
  '剧情事件待发布素材基址',
  '第二机位图片',
]);
const parts = assets.statements
  .filter(
    node =>
      names.has(node.name?.text) ||
      (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => names.has(d.name.text))),
  )
  .map(n => n.getText(assets));
const start = app.indexOf('function 背景图(');
const end = app.indexOf('/** 头像文件名', start);
assert.ok(start >= 0 && end > start);
function resolve(overrides = {}, bases = {}) {
  // Scene selectors are explicit branch fixtures; the App resolver and URL builders are the actual production code.
  const env = {
    globalThis: bases,
    data: { value: {} },
    门牌列表: ['101', '102', '201', '202', '301', '302'],
    房间色: { 101: 1, 102: 1, 201: 1, 202: 1, 301: 1, 302: 1 },
    公寓外部背景图: 'outside.webp',
    晨跑公园背景图: 'park.webp',
    健身房背景图: 'gym.webp',
    房间生产背景键: () => '',
    生产图片: key => `production/${key}.webp`,
    借种101持久背景文件: () => '',
    借种结局图片: () => '',
    安若妍换掉背景文件: () => '',
    安若妍换掉图片: () => '',
    家庭计划101背景文件: () => '',
    家庭计划图片: () => '',
    许曼君离婚结局背景CG: () => 'XMJ-DIV-04',
    许曼君分居房间背景文件: () => '201_分居_取物后',
    不再留门背景文件: () => '',
    不再留门图片: () => '',
    第二机位房间背景文件: () => '',
    共居302背景图: () => '',
    母亲共居背景状态: () => '',
    ...overrides,
  };
  // URL可用性是受控依赖输入；背景选择与图片构造仍使用实际实现。
  const availability = parts.map(part => part.replace(/状态: '已发布'/g, "状态: '待不可变标签'"));
  const text = [...availability, app.slice(start, end), 'module.exports = { 背景图 };'].join('\n');
  const js = ts.transpileModule(text, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(env), js)(module, module.exports, ...Object.values(env));
  return module.exports.背景图;
}

test('201阶段素材未发布时仍返回通用房间背景，原始分居与正式结局均不返回空地址', () => {
  for (const divorce of ['', 'XMJ-DIV-04']) {
    const background = resolve({ 许曼君离婚结局背景CG: () => divorce });
    assert.match(background('201'), /@rq0\.55\/dist\/人妻公寓\/素材\/背景\/201\.webp$/u);
  }
});
test('201已配置阶段素材时按离婚、分居顺序选择，孕产背景优先级保持', () => {
  const bases = {
    __RQGY_XMJ_DIVORCE_ASSET_BASE__: 'https://preview.invalid/divorce',
    __RQGY_XMJ_201_ASSET_BASE__: 'https://preview.invalid/separation',
  };
  assert.equal(resolve({}, bases)('201'), 'https://preview.invalid/divorce/XMJ-DIV-04.webp');
  assert.match(
    resolve({ 许曼君离婚结局背景CG: () => '' }, bases)('201'),
    /separation\/.+201_%E5%88%86%E5%B1%85_%E5%8F%96%E7%89%A9%E5%90%8E\.webp$/,
  );
  assert.equal(resolve({ 房间生产背景键: () => '育儿房间' }, bases)('201'), 'production/育儿房间.webp');
});
test('第二机位同类未发布背景继续回退；已配置地址仍使用专属图', () => {
  const fixture = { 第二机位房间背景文件: () => '第二机位_102_已安装' };
  assert.match(resolve(fixture)('102'), /背景\/102\.webp$/u);
  assert.match(
    resolve(fixture, { __RQGY_STORY_EVENT_ASSET_BASE__: 'https://preview.invalid/story' })('102'),
    /^https:\/\/preview\.invalid\/story\//,
  );
});
