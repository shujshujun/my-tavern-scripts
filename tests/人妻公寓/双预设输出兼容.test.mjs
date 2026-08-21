/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 清洗预设输出, 应用酒馆最终显示正则, 移除酒馆助手前端块 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/预设输出兼容.ts',
);
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

  // 2026-08-04:期望标签缺失不再整篇清空——文本按通用清洗保留，流式安全门(正文已开始)仍关闭。
  const 正文前流式 = 清洗预设输出('预填充后的私有分析仍在生成', 'content');
  assert.deepEqual(正文前流式, { 文本: '预填充后的私有分析仍在生成', 正文已开始: false });
  assert.equal(清洗预设输出('<thinking>被截断的私有创作分析', 'content').文本, '', '未闭合思考在回退清洗下仍整段丢弃');
  assert.deepEqual(清洗预设输出('<story_scene>混用其他预设的正文</story_scene>', 'content'), {
    文本: '混用其他预设的正文',
    正文已开始: true,
  });
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
    文本: '预填充后的私有分析仍在生成',
    正文已开始: false,
  });
});

test('酒馆助手前端动画块整块隐藏，模块外正文不限段数并保持原顺序', () => {
  const 动画折叠块 = [
    '```html',
    '<html>',
    '<head>',
    '<style>@keyframes fold { from { opacity: 1 } to { opacity: 0 } }</style>',
    '</head>',
    '<body>',
    '<details open><summary>思维链</summary><div class="thinking-animation">私有思考不得显示</div></details>',
    '<div class="summary-card">摘要不得显示</div>',
    '<div class="tucao-card">吐槽不得显示</div>',
    '<script>document.body.classList.add("animated")</script>',
    '</body>',
    '</html>',
    '```',
  ].join('\n');
  const 第二前端块 = [
    '````frontend',
    '<body data-renderer="tavern-helper">',
    '<section>另一个动画组件里的总结不得显示</section>',
    '</body>',
    '````',
  ].join('\n');
  const 原文 = [
    '第一段正文。',
    动画折叠块,
    '第二段正文。',
    第二前端块,
    '第三段正文。',
    '第四段正文。',
  ].join('\n');

  const 预期正文段 = ['第一段正文。', '第二段正文。', '第三段正文。', '第四段正文。'];
  const 取正文段 = 文本 =>
    清洗预设输出(文本)
      .文本.split(/\n+/)
      .map(段 => 段.trim())
      .filter(Boolean);

  assert.deepEqual(取正文段(原文), 预期正文段);
  assert.deepEqual(取正文段(['<content>', 原文, '</content>'].join('\n')), 预期正文段);
  assert.equal(清洗预设输出(动画折叠块).文本, '', '纯酒馆助手前端楼不能冒充有效正文');
  assert.equal(移除酒馆助手前端块(动画折叠块.replace(/\n/g, '\r\n')), '', 'Windows 换行同样整块隐藏');
});

test('闭合 details 折叠块连内容一起隐藏，不能只剥外壳泄露摘要或思维链', () => {
  const 原文 = [
    '正文前。',
    '<details open>',
    '<summary>创作过程</summary>',
    '<details><summary>内层摘要</summary>内层私有内容</details>',
    '外层私有内容',
    '</details>',
    '正文后。',
  ].join('\n');

  assert.deepEqual(
    清洗预设输出(原文)
      .文本.split(/\n+/)
      .map(段 => 段.trim())
      .filter(Boolean),
    ['正文前。', '正文后。'],
  );
});

test('未闭合的酒馆助手前端标签不猜测吞尾，保留原样让玩家自行重新生成', () => {
  const 未闭合 = ['正文前。', '```html', '<body>', '<div class="thinking-animation">生成被截断'].join('\n');
  const 普通代码 = ['```html', '<div>只是普通代码示例，没有闭合 body 对</div>', '```'].join('\n');

  assert.equal(移除酒馆助手前端块(未闭合), 未闭合);
  assert.equal(移除酒馆助手前端块(普通代码), 普通代码);
});

test('完整回复先走酒馆最终显示正则，可保留任意数量的交错正文段', () => {
  const 原格式化器存在 = Object.prototype.hasOwnProperty.call(globalThis, 'formatAsTavernRegexedString');
  const 原格式化器 = globalThis.formatAsTavernRegexedString;
  const 调用 = [];
  try {
    globalThis.formatAsTavernRegexedString = (text, source, destination, option) => {
      调用.push({ source, destination, option });
      // 复现玩家预设的“删除”显示正则：外层与每个 thinking 块删除，正文段数量不设上限。
      return String(text).replace(
        /(<Reference_Example>.*?<\/Reference_Example>)|极其|(.*?<Interleaving?>(\n)?)|<\/Interleaving>|(.*?<\/think>(\n)?)|(<thinking>.*?<\/thinking>)/gs,
        '',
      );
    };
    const 原文 = [
      '<Interleaving>',
      '<thinking>第一段思考</thinking>',
      '第一段正文。',
      '<thinking>第二段思考</thinking>',
      '第二段正文。',
      '<thinking>第三段思考</thinking>',
      '第三段正文。',
      '<thinking>第四段思考</thinking>',
      '第四段正文。',
      '</Interleaving>',
    ].join('\n');

    const 显示结果 = 应用酒馆最终显示正则(原文);
    assert.deepEqual(调用, [{ source: 'ai_output', destination: 'display', option: { depth: 0 } }]);
    assert.deepEqual(
      清洗预设输出(显示结果)
        .文本.split(/\n+/)
        .map(段 => 段.trim())
        .filter(Boolean),
      ['第一段正文。', '第二段正文。', '第三段正文。', '第四段正文。'],
    );
  } finally {
    if (原格式化器存在) globalThis.formatAsTavernRegexedString = 原格式化器;
    else delete globalThis.formatAsTavernRegexedString;
  }
});

test('酒馆最终显示正则不可用或报错时原样回退，不让正文消失', () => {
  const 原格式化器存在 = Object.prototype.hasOwnProperty.call(globalThis, 'formatAsTavernRegexedString');
  const 原格式化器 = globalThis.formatAsTavernRegexedString;
  try {
    delete globalThis.formatAsTavernRegexedString;
    assert.equal(应用酒馆最终显示正则('原始正文'), '原始正文');
    globalThis.formatAsTavernRegexedString = () => {
      throw new Error('regex failed');
    };
    assert.equal(应用酒馆最终显示正则('仍要保留'), '仍要保留');
  } finally {
    if (原格式化器存在) globalThis.formatAsTavernRegexedString = 原格式化器;
    else delete globalThis.formatAsTavernRegexedString;
  }
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
  const 原生源 = readFileSync(new URL('脚本/游戏逻辑/index.ts', 根), 'utf8');
  const 客户端源 = readFileSync(new URL('界面/客户端/App.vue', 根), 'utf8');
  const 手机源 = readFileSync(new URL('脚本/游戏逻辑/手机/生成引擎.ts', 根), 'utf8');
  const 隔离源 = readFileSync(new URL('脚本/游戏逻辑/隔离事件引擎.ts', 根), 'utf8');

  assert.match(回合源, /清洗预设输出\(原文, 当前预设正文标签\(\)\)/);
  assert.match(回合源, /let 最终显示原文 = 应用酒馆最终显示正则\(原文\)/);
  assert.match(回合源, /清洗正文\(最终显示原文\)/);
  assert.match(回合源, /const 重写显示原文 = 应用酒馆最终显示正则\(重写\)/);
  assert.match(回合源, /清洗正文\(重写显示原文\)/);
  assert.match(回合源, /原文 = 重写;\s*最终显示原文 = 重写显示原文;/);
  assert.match(
    回合源,
    /const 已清洗正文 =[\s\S]*?清洗严格正文\(最终显示原文\)[\s\S]*?清洗正文\(最终显示原文\)/,
  );
  assert.match(
    原生源,
    /清洗静音会议正文\(应用酒馆最终显示正则\(String\(末楼\?\.mes \?\? ''\)\)\)/,
    '宿主原生备用回合也必须在完整楼完成后采用酒馆最终显示文本',
  );
  assert.match(客户端源, /清洗预设输出\(原文, 流式 \? 当前预设正文标签 : null\)/);
  assert.match(客户端源, /刷新当前预设正文标签/);
  assert.match(手机源, /清洗预设输出\(原/);
  assert.match(隔离源, /净化隔离事件正文\(应用酒馆最终显示正则\(String\(原文 \?\? ''\)\)\)/);

  // 玩家要求保留预设既有流式观感：流事件仍原样转发，客户端继续消费中间帧；本次只改最终完成稿。
  assert.match(回合源, /eventEmit\('人妻公寓:流式', 文本\)/);
  const 流式处理起点 = 客户端源.indexOf("eventOn('人妻公寓:流式'");
  const 流式处理终点 = 客户端源.indexOf("eventOn('人妻公寓:运行阶段'", 流式处理起点);
  const 流式处理 = 客户端源.slice(流式处理起点, 流式处理终点);
  assert.match(流式处理, /清洗\(文本, true\)/);
  assert.doesNotMatch(流式处理, /应用酒馆最终显示正则|过酒馆正则/);
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
