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
const { 识别预设正文标签, 识别预设流式边界, 读取预设启用词条 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/预设桥.ts',
);
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

test('未完成思维链既不可见也不可提交，正文出现后才开放业务成功门', () => {
  assert.deepEqual(判定正文提交('<thinking>生成在分析阶段中断', 提取正文舞台文本, 提取可提交正文), {
    显示正文: '',
    成功正文: '',
    失败残稿: '',
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
      显示正文: '',
      成功正文: '',
      失败残稿: '',
      可提交: false,
    },
    '美化正则不能把原始思维残稿改造成可见正文或可提交正文',
  );
  assert.deepEqual(
    判定正文提交('<thinking>内部分析</thinking><p>夏乔把门打开了。</p>', 提取正文舞台文本, 提取可提交正文),
    {
      显示正文: '夏乔把门打开了。',
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

test('Prism 未闭合思维链不能吞掉后续 content，显示门和成功门只保留正文', () => {
  const 原文 = [
    '<analysis>内部规划没有闭合',
    '<content>',
    '<!-- Prism:物理环境与睡前感知。 -->',
    '屋子里暗下来，我闭上眼睛。',
    '<!-- Prism:完成时间跨度，苏醒。 -->',
    '第二天早上我醒了。',
    '</content>',
  ].join('\n');
  const 正文 = '屋子里暗下来，我闭上眼睛。\n\n第二天早上我醒了。';
  assert.equal(提取正文舞台文本(原文), 正文);
  assert.equal(提取可提交正文(原文), 正文);
  assert.deepEqual(判定正文提交(原文, 提取正文舞台文本, 提取可提交正文), {
    显示正文: 正文,
    成功正文: 正文,
    失败残稿: '',
    可提交: true,
  });
});

test('多类正文封套在流式半截和完整回复中都先于思维链裁切', () => {
  for (const [标签, 正文] of [
    ['content', 'Prism 正文'],
    ['story_scene', '场景正文'],
    ['dream_body', '梦境正文'],
    ['正文', '中文封套正文'],
    ['response', '响应封套正文'],
    ['game', '游戏封套正文'],
  ]) {
    const 完整 = `<thinking>未闭合私有推理\n<${标签}>${正文}</${标签}>`;
    const 流式 = `<thinking>未闭合私有推理\n<${标签}>${正文}`;
    assert.equal(提取正文舞台文本(完整), 正文, `${标签} 完整显示`);
    assert.equal(提取可提交正文(完整), 正文, `${标签} 完整提交`);
    assert.equal(提取正文舞台文本(流式), 正文, `${标签} 流式显示`);
    assert.equal(提取可提交正文(流式), 正文, `${标签} 流式缓存`);
  }
});

test('无预填充模型自行输出控制段和 think_nya 时，game 封套仍是唯一正文边界', () => {
  const 原文 = [
    '<|im_start|>gemini',
    '<think_nya~>未闭合私有推理',
    '<|im_end|>',
    '<game>第二天早上我醒了。</game>',
    '<summary>后台总结</summary>',
  ].join('\n');
  assert.equal(提取正文舞台文本(原文), '第二天早上我醒了。');
  assert.equal(提取可提交正文(原文), '第二天早上我醒了。');
  assert.equal(
    识别预设正文标签([
      { enabled: true, role: 'system', content: '正文必须用<game></game>包裹' },
      { enabled: true, role: 'system', content: '思考使用<think_nya~></think_nya~>包裹' },
      { enabled: true, role: 'system', content: '另一个旧配置偶然提到<content></content>' },
    ]),
    'game',
  );
});

test('中文思考协议、梦鲸 revised CDATA 与命名空间思维标签只留下真实正文', () => {
  const 中文协议 = '<验证>校验码</验证>\n<思考>未闭合私有推理\n<正文>第二天早上我醒了。</正文>\n<评估>10</评估>';
  assert.equal(提取正文舞台文本(中文协议), '第二天早上我醒了。');
  assert.equal(提取可提交正文(中文协议), '第二天早上我醒了。');

  const 修订协议 = '<original>原稿</original><analysis>未闭合分析<revised><![CDATA[修订后的正文。]]></revised>';
  assert.equal(提取正文舞台文本(修订协议), '修订后的正文。');
  assert.equal(提取可提交正文(修订协议), '修订后的正文。');

  for (const 私有标签 of ['metacognition', 'lyric:ThinkFormat', 'Chain_of_Thought']) {
    const 原文 = `<${私有标签}>私有推理</${私有标签}>正文继续。`;
    assert.equal(提取正文舞台文本(原文), '正文继续。', `${私有标签} 显示`);
    assert.equal(提取可提交正文(原文), '正文继续。', `${私有标签} 提交`);
  }
});

test('显示正则生成的 reasoning/thinking 折叠块不会把思维内容带进游戏舞台', () => {
  for (const 原文 of [
    '<details class="reasoning"><summary>ARGO</summary><div>私有推理</div></details><p>正文继续。</p>',
    '<details class="st_custom_reasoning"><summary>思考了一会</summary><div>私有推理</div></details><p>正文继续。</p>',
    '<details class="thinking-description"><summary>TGD 思维链</summary><div>私有推理</div></details><p>正文继续。</p>',
  ]) {
    assert.equal(提取正文舞台文本(原文), '正文继续。');
  }
});

test('启用预设声明正文封套时，流式帧在正文开标签出现前保持隐藏', () => {
  const 流式选项 = { 期望正文标签: 'content', 流式: true };
  assert.equal(提取正文舞台文本('assistant prefill 后的裸私有推理', 流式选项), '');
  assert.equal(提取可提交正文('assistant prefill 后的裸私有推理', 流式选项), '');
  assert.equal(提取正文舞台文本('裸私有推理\n</thinking>\n<content>正文开始', 流式选项), '正文开始');
  assert.equal(提取可提交正文('裸私有推理\n</thinking>\n<content>正文开始', 流式选项), '正文开始');
  assert.equal(提取正文舞台文本('不使用封套的普通纯文字'), '不使用封套的普通纯文字');
});

test('assistant prefill 已打开私有规划标签时，流式帧等到闭标签后才显示普通正文', () => {
  const 流式选项 = { 等待思维闭标签: true, 流式: true };
  assert.equal(提取正文舞台文本('assistant prefill 后的裸规划文字', 流式选项), '');
  assert.equal(提取可提交正文('assistant prefill 后的裸规划文字', 流式选项), '');
  const 已进入正文 = 'assistant prefill 后的裸规划文字</konatan_planning~>正文开始。';
  assert.equal(提取正文舞台文本(已进入正文, 流式选项), '正文开始。');
  assert.equal(提取可提交正文(已进入正文, 流式选项), '正文开始。');
});

test('不支持 assistant prefill 时，最后一条 user 尾注打开私有标签也启用同一流式门', () => {
  assert.deepEqual(
    识别预设流式边界([
      { enabled: true, role: 'system', content: '思维协议说明使用<konatan_planning~></konatan_planning~>' },
      { enabled: true, role: 'user', content: '<think>思考完毕</think>现在开始规划。<konatan_planning~>' },
    ]),
    { 期望正文标签: null, 等待思维闭标签: true },
  );
  assert.deepEqual(
    识别预设流式边界([
      { enabled: true, role: 'user', content: '<konatan_planning~>这里只是较早的旧尾注' },
      { enabled: true, role: 'user', content: '当前真正的最后请求不使用预填充。' },
    ]),
    { 期望正文标签: null, 等待思维闭标签: false },
  );
});

test('只用启用提示词中的强协议组合识别流式正文封套', () => {
  assert.equal(
    识别预设正文标签([
      { enabled: true, content: '<output-template><analysis>规划</analysis><content>正文</content></output-template>' },
    ]),
    'content',
  );
  assert.equal(
    识别预设正文标签([{ enabled: true, content: '<thinking>规划</thinking><story_scene>正文</story_scene>' }]),
    'story_scene',
  );
  assert.equal(
    识别预设正文标签([{ enabled: true, content: 'DREAM_PLOT_OUTPUT <dream_plot><dream_body>正文</dream_body>' }]),
    'dream_body',
  );
  assert.equal(识别预设正文标签([{ enabled: true, content: '<思考>规划</思考><正文>故事</正文>' }]), '正文');
  assert.equal(识别预设正文标签([{ enabled: true, content: '<original>原稿</original><analysis>分析</analysis><revised>正文</revised>' }]), 'revised');
  assert.equal(识别预设正文标签([{ enabled: false, content: '<thinking>规划</thinking><content>正文</content>' }]), null);
  assert.equal(识别预设正文标签([{ enabled: true, content: '这里只是在说明文字中偶然提到 content' }]), null);
  assert.deepEqual(
    识别预设流式边界([
      { enabled: true, role: 'assistant', content: '准备开始。<konatan_planning~>裸规划预填充' },
    ]),
    { 期望正文标签: null, 等待思维闭标签: true },
  );
});

test('真实预设以 prompt_order 为准合并启用状态，不被 prompts 内的旧 enabled 值误导', () => {
  const 预设 = {
    prompts: [
      { identifier: 'tail', enabled: false, role: 'system', content: '最后一条普通系统规则。' },
      { identifier: 'disabled-body', enabled: true, role: 'system', content: '<thinking>分析</thinking><content>禁用正文</content>' },
      { identifier: 'prefill', enabled: false, role: 'assistant', content: '准备开始。<konatan_planning~>裸规划预填充' },
    ],
    prompt_order: [
      {
        character_id: 100001,
        order: [
          { identifier: 'prefill', enabled: true },
          { identifier: 'tail', enabled: true },
          { identifier: 'disabled-body', enabled: false },
        ],
      },
    ],
  };
  const 启用词条 = 读取预设启用词条(预设);
  assert.deepEqual(启用词条.map(词条 => 词条.identifier), ['prefill', 'tail']);
  assert.deepEqual(识别预设流式边界(启用词条), {
    期望正文标签: null,
    等待思维闭标签: true,
  });
});

test('无正文封套时仍兼容闭合思维链、预填充孤立闭标签与普通纯文字', () => {
  assert.equal(提取正文舞台文本('<reasoning>私有推理</reasoning>门外响起脚步声。'), '门外响起脚步声。');
  assert.equal(提取可提交正文('<reasoning>私有推理</reasoning>门外响起脚步声。'), '门外响起脚步声。');
  assert.equal(提取正文舞台文本('预填充私有推理</thinking>门外响起脚步声。'), '门外响起脚步声。');
  assert.equal(提取可提交正文('预填充私有推理</thinking>门外响起脚步声。'), '门外响起脚步声。');
  assert.equal(提取正文舞台文本('门外响起脚步声。'), '门外响起脚步声。');
  assert.equal(提取可提交正文('门外响起脚步声。'), '门外响起脚步声。');
});

test('多段正文与思维链交错时保留全部正文段，不只留下最后一段', () => {
  const 原文 = [
    '<thinking>第一段私有推理</thinking>',
    '第一段正文。',
    '<analysis>第二段私有推理</analysis>',
    '第二段正文。',
  ].join('\n');
  assert.equal(提取正文舞台文本(原文), '第一段正文。\n\n第二段正文。');
  assert.equal(提取可提交正文(原文), '第一段正文。\n\n第二段正文。');
});

test('狐系与通用规划标签同样不泄露，content 内的计数元数据也不冒充剧情', () => {
  for (const 标签 of ['draft_notes', 'bginfor', 'CEstuff', 'fox_selc', 'fox_tip', 'konatan_planning~', 'tucao', 'meta_plan']) {
    const 原文 = `<${标签}>私有规划</${标签}>\n正文继续。`;
    assert.equal(提取正文舞台文本(原文), '正文继续。', `${标签} 显示`);
    assert.equal(提取可提交正文(原文), '正文继续。', `${标签} 提交`);
  }
  const 带计数 = '<content>第一段正文。<c>*当前输出内容第2次*</c>第二段正文。</content>';
  assert.equal(提取正文舞台文本(带计数), '第一段正文。第二段正文。');
  assert.equal(提取可提交正文(带计数), '第一段正文。第二段正文。');
});

test('主正文和客户端只检测流式封套，不按预设名称分支、不重跑正则或复制酒馆 HTML', () => {
  const 兼容源 = 读('src/人妻公寓/脚本/游戏逻辑/预设输出兼容.ts');
  const 预设桥 = 读('src/人妻公寓/脚本/游戏逻辑/预设桥.ts');
  const 回合源 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 输出边界源 = 读('src/人妻公寓/脚本/游戏逻辑/正文输出边界.ts');
  const 机器协议源 = 读('src/人妻公寓/脚本/游戏逻辑/游戏机器协议.ts');
  const 客户端源 = 读('src/人妻公寓/界面/客户端/App.vue');
  const 正文卷轴 = 读('src/人妻公寓/界面/客户端/components/正文卷轴.vue');

  assert.match(预设桥, /export function 识别预设正文标签/);
  assert.match(预设桥, /export function 当前预设正文标签/);
  assert.doesNotMatch(`${兼容源}\n${预设桥}\n${回合源}\n${客户端源}`, /Prism|乙酉|梦鲸/);
  assert.doesNotMatch(兼容源, /dream_body|story_scene|output-template|DREAM_PLOT_OUTPUT/);
  assert.doesNotMatch(客户端源, /过酒馆正则|玩家正则表|获取酒馆已渲染消息HTML|净化正文舞台HTML|渲染HTML/);
  assert.doesNotMatch(客户端源, /<UpdateVariable\\b|<json_\?patch\\b|<尺度判定/, '客户端不得再维护机器协议正则副本');
  assert.doesNotMatch(回合源, /function 清洗正文核心|function 提取正文舞台文本|function 提取可提交正文/);
  assert.match(输出边界源, /提取外部预设正文原文/);
  assert.match(输出边界源, /转为正文舞台纯文本\(清除游戏机器协议\(外部正文\)\)/);
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
