/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 清洗预设输出 } = require('../../src/人妻公寓/脚本/游戏逻辑/预设输出兼容.ts');
const { 识别预设正文标签 } = require('../../src/人妻公寓/脚本/游戏逻辑/预设桥.ts');
const { 严格清除协议残留 } = require('../../src/人妻公寓/脚本/游戏逻辑/严格正文清洗.ts');

test('乙酉的 thinking/content 协议只留下正文，截断思考绝不回退泄露', () => {
  const 完整输出 = [
    '<thinking>私有创作分析，不得显示</thinking>',
    '<scene>时间地点元数据</scene>',
    '<content>这是应当显示的剧情正文。</content>',
    '<g>后置定位信息</g>',
  ].join('\n');
  assert.equal(清洗预设输出(完整输出).文本.trim(), '这是应当显示的剧情正文。');
  assert.equal(清洗预设输出('<thinking>被截断的私有创作分析').文本, '');
  assert.equal(清洗预设输出('<content>正文即使漏了闭合标签也要保留').文本.trim(), '正文即使漏了闭合标签也要保留');

  const 正文前流式 = 清洗预设输出('预填充后的私有分析仍在生成', 'content');
  assert.deepEqual(正文前流式, { 文本: '', 正文已开始: false });
});

test('乙酉正文内的font与po只剥标签，规划注释和zv残标签不进入正文', () => {
  const 带内层格式 = [
    '<thinking>私有创作分析</thinking>',
    '<content>',
    '**<po><!--〖第一剧情模块｜这里只是规划提示〗--></po>**',
    "<font color='FF69B4'>粉色段落也是正文。</font>",
    '普通正文。</zv>',
    '**<po>即使正文被po包住，也只能去标签不能删内容。</po>**',
    '<c>*当前输出内容第1次*</c>',
    '</content>',
  ].join('\n');

  assert.equal(
    清洗预设输出(带内层格式).文本.trim(),
    '粉色段落也是正文。\n普通正文。\n即使正文被po包住，也只能去标签不能删内容。',
  );
  assert.equal(清洗预设输出('<content><font color="#ff69b4">正文漏了font闭标签').文本.trim(), '正文漏了font闭标签');
  assert.equal(清洗预设输出('<content><po>漏闭合时后文仍保留').文本.trim(), '漏闭合时后文仍保留');
  assert.equal(清洗预设输出('<content>完整正文。<c>*当前输出内容第2次*').文本.trim(), '完整正文。');
  assert.equal(清洗预设输出('<content>**正常加粗正文**</content>').文本.trim(), '**正常加粗正文**');
});

test('梦鲸的 dream_body 是唯一正文，完整或漏闭合都不显示 think 与外层标签', () => {
  const 完整输出 = [
    '<dream_plot>',
    '<think>私有梦境分析，不得显示</think>',
    '<dream_body>这是梦鲸生成的剧情正文。</dream_body>',
    '<dream_after_format><dream_done/></dream_after_format>',
    '</dream_plot>',
  ].join('\n');
  assert.equal(清洗预设输出(完整输出).文本.trim(), '这是梦鲸生成的剧情正文。');

  const 漏闭合正文 = '<dream_plot>\n<think>分析</think>\n<dream_body>仍要保留的正文';
  assert.equal(清洗预设输出(漏闭合正文).文本.trim(), '仍要保留的正文');
  assert.equal(清洗预设输出('<dream_plot>\n<think>被截断的梦境分析').文本, '');

  const 预填充省略开标签 = '预填充后的私有分析</think>\n<dream_body>正文已经开始';
  assert.equal(清洗预设输出(预填充省略开标签).文本.trim(), '正文已经开始');
  assert.deepEqual(清洗预设输出('预填充后的私有分析仍在生成', 'dream_body'), {
    文本: '',
    正文已开始: false,
  });
});

test('从两个预设的启用提示词识别流式正文门', () => {
  assert.equal(
    识别预设正文标签([
      { enabled: true, content: '<output-template><thinking>...</thinking><content>正文</content></output-template>' },
    ]),
    'content',
  );
  assert.equal(
    识别预设正文标签([
      { enabled: true, content: '严格按照 DREAM_PLOT_OUTPUT 输出：<dream_plot><think>...</think><dream_body>正文</dream_body>' },
    ]),
    'dream_body',
  );
  assert.equal(识别预设正文标签([{ enabled: false, content: '<dream_body>禁用项</dream_body>' }]), null);
});

test('主回合、流式界面、手机与隔离生成都接入同一兼容清洗', () => {
  const 根 = new URL('../../src/人妻公寓/', import.meta.url);
  const 回合源 = readFileSync(new URL('脚本/游戏逻辑/回合引擎.ts', 根), 'utf8');
  const 客户端源 = readFileSync(new URL('界面/客户端/App.vue', 根), 'utf8');
  const 手机源 = readFileSync(new URL('脚本/游戏逻辑/手机系统.ts', 根), 'utf8');
  const 隔离源 = readFileSync(new URL('脚本/游戏逻辑/隔离事件引擎.ts', 根), 'utf8');

  assert.match(回合源, /清洗预设输出\(原文, 当前预设正文标签\(\)\)/);
  assert.match(客户端源, /清洗预设输出\(原文, 流式 \? 当前预设正文标签 : null\)/);
  assert.match(客户端源, /刷新当前预设正文标签/);
  assert.match(手机源, /清洗预设输出\(原/);
  assert.match(隔离源, /清洗预设输出\(原文\)/);
  for (const [名称, 源码] of [
    ['主回合', 回合源],
    ['流式界面', 客户端源],
    ['手机', 手机源],
    ['隔离事件', 隔离源],
  ]) {
    assert.doesNotMatch(源码, /<尺度判定\\b/, `${名称}不得在中文标签后使用无效的单词边界`);
    assert.ok(源码.includes(String.raw`<尺度判定(?:\s[^>]*)?>`), `${名称}应接受无属性和带属性的尺度标签`);
  }
});

test('严格正文判定拒绝纯思维链与纯变量协议，但保留协议前的真实正文', () => {
  assert.equal(严格清除协议残留('<think>只有分析，没有正文'), '');
  assert.equal(严格清除协议残留('<UpdateVariable>_.set("x", 1)'), '');
  assert.equal(严格清除协议残留('<json_patch>[{"op":"replace","path":"/x","value":1}]'), '');
  assert.equal(严格清除协议残留('<行为等级>3'), '');
  assert.equal(严格清除协议残留('<尺度判定 mode="audit">只有判定'), '');
  assert.equal(严格清除协议残留('正文\n<尺度判定>{"101":1}</尺度判定>'), '正文');
  assert.equal(严格清除协议残留('正文\n<尺度判定 模式="简">{"101":1}</尺度判定>'), '正文');
  assert.equal(严格清除协议残留('正文\n<尺度判定 模式="详">{"101":'), '正文');
  assert.equal(严格清除协议残留('<konatan_planning~>只有创作规划'), '');
  assert.equal(严格清除协议残留('晨跑结束时，河风已经暖了。\n<UpdateVariable>_.set("x", 1)'), '晨跑结束时，河风已经暖了。');
  assert.equal(
    严格清除协议残留('她把水杯放回桌面。\n[{"op":"replace","path":"/x","value":1}]'),
    '她把水杯放回桌面。',
  );
});
