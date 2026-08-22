/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 应用酒馆最终显示正则, 检测AI输出美化正则, 转为正文舞台纯文本 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/预设输出兼容.ts',
);
const { 判定正文提交 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文生成完整性.ts');
const { 提取正文舞台文本, 提取可提交正文 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文输出边界.ts');
const { 清除游戏机器协议, 清除末尾残缺游戏协议标签 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/游戏机器协议.ts',
);
const { 严格清除协议残留 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文协议安全.ts');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('完整回复只调用一次酒馆最终显示正则，正常结果原样采用', () => {
  const 原格式化器存在 = Object.prototype.hasOwnProperty.call(globalThis, 'formatAsTavernRegexedString');
  const 原格式化器 = globalThis.formatAsTavernRegexedString;
  const 调用 = [];
  try {
    globalThis.formatAsTavernRegexedString = (text, source, destination, option) => {
      调用.push({ text, source, destination, option });
      return '预设删除思维链后的最终正文。';
    };
    assert.equal(应用酒馆最终显示正则('<thinking>分析</thinking>正文。'), '预设删除思维链后的最终正文。');
    assert.deepEqual(调用, [
      {
        text: '<thinking>分析</thinking>正文。',
        source: 'ai_output',
        destination: 'display',
        option: { depth: 0 },
      },
    ]);
  } finally {
    if (原格式化器存在) globalThis.formatAsTavernRegexedString = 原格式化器;
    else delete globalThis.formatAsTavernRegexedString;
  }
});

test('最终显示正则把非空回复清成空串时保留原稿，接口异常同样不让正文消失', () => {
  const 原格式化器存在 = Object.prototype.hasOwnProperty.call(globalThis, 'formatAsTavernRegexedString');
  const 原格式化器 = globalThis.formatAsTavernRegexedString;
  try {
    globalThis.formatAsTavernRegexedString = () => '';
    assert.equal(应用酒馆最终显示正则('<thinking>被截断的分析'), '<thinking>被截断的分析');
    globalThis.formatAsTavernRegexedString = () => {
      throw new Error('regex failed');
    };
    assert.equal(应用酒馆最终显示正则('仍要保留'), '仍要保留');
    delete globalThis.formatAsTavernRegexedString;
    assert.equal(应用酒馆最终显示正则('接口缺失也保留'), '接口缺失也保留');
  } finally {
    if (原格式化器存在) globalThis.formatAsTavernRegexedString = 原格式化器;
    else delete globalThis.formatAsTavernRegexedString;
  }
});

test('正文舞台把 HTML/CSS/动画收敛为纯文字，不复制视觉层或折叠状态', () => {
  const 显示结果 = [
    '<style>@keyframes pulse { from { opacity: 0 } }</style>',
    '<section class="card" style="animation:pulse 1s">',
    '<details><summary>创作过程</summary><div>玩家可见文字</div></details>',
    '<script>window.evil = true</script>',
    '</section>',
  ].join('\n');
  assert.equal(转为正文舞台纯文本(显示结果), '创作过程\n玩家可见文字');
  assert.equal(转为正文舞台纯文本('<thinking>未完成的分析仍供玩家判断'), '未完成的分析仍供玩家判断');
  assert.equal(转为正文舞台纯文本('<style>@keyframes 未闭合的视觉代码'), '');
  assert.equal(转为正文舞台纯文本('<p>第一段<br>第二段 &amp; 继续</p>'), '第一段\n第二段 & 继续');
});

test('只提示启用的 AI 输出显示美化正则，纯删除、提取正文和普通文本替换不提示', () => {
  const 基础 = {
    enabled: true,
    source: { ai_output: true },
    destination: { display: true },
  };
  assert.deepEqual(
    检测AI输出美化正则([
      { ...基础, script_name: '[🦋美化]思维链折叠', replace_string: '<details><summary>思考</summary>$1</details>' },
      { ...基础, script_name: '动画卡片', replace_string: '<style>@keyframes fade{}</style><div style="animation:fade">$1</div>' },
      { ...基础, script_name: '纯删除思维链', replace_string: '' },
      { ...基础, script_name: '只取正文', replace_string: '$1' },
      { ...基础, script_name: '普通文字', replace_string: '正文：$1' },
      { ...基础, script_name: '禁用美化', enabled: false, replace_string: '<div>$1</div>' },
      {
        ...基础,
        script_name: '只处理用户输入',
        source: { ai_output: false },
        replace_string: '<span>$1</span>',
      },
      {
        ...基础,
        script_name: '只进提示词',
        destination: { display: false },
        replace_string: '<section>$1</section>',
      },
      { ...基础, script_name: '[🦋美化]思维链折叠', replace_string: '<svg></svg>' },
    ]),
    ['[🦋美化]思维链折叠', '动画卡片'],
  );
});

test('失败残稿可见但不可提交，正文出现后才开放业务成功门', () => {
  assert.deepEqual(判定正文提交('<thinking>生成在分析阶段中断', 提取正文舞台文本, 提取可提交正文), {
    显示正文: '生成在分析阶段中断',
    成功正文: '',
    失败残稿: '生成在分析阶段中断',
    可提交: false,
  });
  assert.deepEqual(
    判定正文提交(
      '<details><summary>思考</summary>美化后的分析</details>',
      提取正文舞台文本,
      提取可提交正文,
      '<thinking>原始分析仍未生成正文',
    ),
    {
      显示正文: '思考\n美化后的分析',
      成功正文: '',
      失败残稿: '思考\n美化后的分析',
      可提交: false,
    },
    '美化正则不能把原始思维残稿改造成可提交正文',
  );
  assert.deepEqual(
    判定正文提交('<thinking>内部分析</thinking><p>夏乔把门打开了。</p>', 提取正文舞台文本, 提取可提交正文),
    {
      显示正文: '内部分析夏乔把门打开了。',
      成功正文: '夏乔把门打开了。',
      失败残稿: '',
      可提交: true,
    },
  );
  assert.deepEqual(判定正文提交('<JSONPatch>[]</JSONPatch>', 提取正文舞台文本, 提取可提交正文), {
    显示正文: '',
    成功正文: '',
    失败残稿: '',
    可提交: false,
  });
});

test('主正文和客户端不再识别具体预设标签、重跑正则或复制酒馆 HTML', () => {
  const 兼容源 = 读('src/人妻公寓/脚本/游戏逻辑/预设输出兼容.ts');
  const 预设桥 = 读('src/人妻公寓/脚本/游戏逻辑/预设桥.ts');
  const 回合源 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 输出边界源 = 读('src/人妻公寓/脚本/游戏逻辑/正文输出边界.ts');
  const 机器协议源 = 读('src/人妻公寓/脚本/游戏逻辑/游戏机器协议.ts');
  const 客户端源 = 读('src/人妻公寓/界面/客户端/App.vue');
  const 正文卷轴 = 读('src/人妻公寓/界面/客户端/components/正文卷轴.vue');

  assert.doesNotMatch(`${兼容源}\n${预设桥}\n${回合源}\n${客户端源}`, /识别预设正文标签|当前预设正文标签/);
  assert.doesNotMatch(兼容源, /dream_body|story_scene|output-template|DREAM_PLOT_OUTPUT/);
  assert.doesNotMatch(客户端源, /过酒馆正则|玩家正则表|获取酒馆已渲染消息HTML|净化正文舞台HTML|渲染HTML/);
  assert.doesNotMatch(客户端源, /<UpdateVariable\\b|<json_\?patch\\b|<尺度判定/, '客户端不得再维护机器协议正则副本');
  assert.doesNotMatch(回合源, /function 清洗正文核心|function 提取正文舞台文本|function 提取可提交正文/);
  assert.match(输出边界源, /转为正文舞台纯文本\(清除游戏机器协议\(原文\)\)/);
  assert.match(机器协议源, /export function 清除游戏机器协议/);
  assert.doesNotMatch(正文卷轴, /v-html/);
  assert.match(回合源, /let 最终显示原文 = 应用酒馆最终显示正则\(原文\)/);
  assert.match(回合源, /判定正文提交\(最终显示原文, 提取正文舞台文本, 提取可提交正文, 原文\)/);
  assert.match(回合源, /eventEmit\('人妻公寓:失败残稿', 失败残稿\)/);
  assert.doesNotMatch(回合源, /楼道里安静了一瞬/);
  assert.match(客户端源, /检测AI输出美化正则/);
  assert.match(客户端源, /删除\/隐藏思维链的正则可以保留/);
  assert.match(正文卷轴, /未完成输出 · 本轮未结算/);
});

test('游戏机器协议由唯一纯函数统一隔离，外部预设标签不在其职责内', () => {
  assert.equal(
    清除游戏机器协议('正文前<UpdateVariable>_.set("x", 1)</UpdateVariable>正文后'),
    '正文前正文后',
  );
  assert.equal(清除游戏机器协议('正文\n<尺度判定 模式="简">{"101":'), '正文\n');
  assert.equal(清除末尾残缺游戏协议标签('正文\n<Upd'), '正文');
  assert.equal(清除游戏机器协议('<thinking>外部预设思维标签</thinking>'), '<thinking>外部预设思维标签</thinking>');
  assert.equal(提取正文舞台文本('正文\n<JSONPatch>[]</JSONPatch>'), '正文');
});

test('游戏自有变量、尺度与数据库机器协议仍会被严格正文门物理移除', () => {
  assert.equal(严格清除协议残留('<think>只有分析，没有正文'), '');
  assert.equal(严格清除协议残留('<analysis>只有分析，没有正文'), '');
  assert.equal(严格清除协议残留('<thought>只有想法，没有正文'), '');
  assert.equal(严格清除协议残留('<content'), '');
  assert.equal(严格清除协议残留('<UpdateVariable>_.set("x", 1)'), '');
  assert.equal(严格清除协议残留('<json_patch>[{"op":"replace","path":"/x","value":1}]'), '');
  assert.equal(严格清除协议残留('<行为等级>3'), '');
  assert.equal(严格清除协议残留('<尺度判定 mode="audit">只有判定'), '');
  assert.equal(严格清除协议残留('正文\n<尺度判定>{"101":1}</尺度判定>'), '正文');
  assert.equal(严格清除协议残留('正文\n<UpdateVariable>_.set("x", 1)'), '正文');
});
