/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const 预设桥源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/预设桥.ts', import.meta.url), 'utf8');
const 隔离事件源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts', import.meta.url), 'utf8');
const Index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

const 旧楼指令 = '（前一轮真实指令：去酒吧喝酒）';
const 本拍晨跑 = '（在晨跑公园开始今天的晨跑）';

function 截段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

test('预设破限段(本拍行动)把 {{lastUserMessage}} 覆写为本拍行动，{{user}} 仍由 substitudeMacros 展开', () => {
  globalThis.getPreset = () => ({
    prompts: [
      { enabled: true, role: 'system', content: '{{lastUserMessage}} 是本轮唯一的新行动。' },
      { enabled: true, role: 'system', content: '{{  LASTUSERMESSAGE }} 完成后记得 {{user}}。' },
    ],
  });
  // mock 的 substitudeMacros 会按旧行为把 {{lastUserMessage}} 展开成真实聊天上一楼指令；
  // 只有已被本拍行动覆写掉的宏才轮不到它处理。
  globalThis.substitudeMacros = 文 =>
    文.replace(/\{\{user\}\}/g, '沈翊').replace(/\{\{lastUserMessage\}\}/g, 旧楼指令);

  const { 预设破限段 } = require('../../src/人妻公寓/脚本/游戏逻辑/预设桥.ts');
  const { 前 } = 预设破限段(本拍晨跑);

  assert.equal(前[0].content, `${本拍晨跑} 是本轮唯一的新行动。`);
  assert.equal(前[1].content, `${本拍晨跑} 完成后记得 沈翊。`);
  assert.ok(!前[0].content.includes(旧楼指令), '不得出现 mock 的旧楼指令');
  assert.ok(!前[1].content.includes(旧楼指令), '大小写/空白变体也不得展开成旧楼指令');

  // 替换必须走回调：输入里的 $& 不得被 String.replace 当替换模板展开成匹配原文。
  const 带模板符行动 = '（热身 $& 到力竭）';
  const 模板符前 = 预设破限段(带模板符行动).前;
  assert.equal(模板符前[0].content, `${带模板符行动} 是本轮唯一的新行动。`);
});

test('无参数调用预设破限段维持原有宏展开行为', () => {
  globalThis.getPreset = () => ({
    prompts: [{ enabled: true, role: 'system', content: '{{lastUserMessage}} 收尾。' }],
  });
  globalThis.substitudeMacros = 文 => 文.replace(/\{\{lastUserMessage\}\}/g, 旧楼指令);

  const { 预设破限段 } = require('../../src/人妻公寓/脚本/游戏逻辑/预设桥.ts');
  const { 前 } = 预设破限段();

  assert.equal(前[0].content, `${旧楼指令} 收尾。`);
});

test('日常三类型明确排除数据库分支，预设破限段收到本拍行动，荣耀洞/监控数据库条件仍存在', () => {
  // 类型判定必须显式列出晨跑/健身/睡眠，且与荣耀洞/监控的数据库代发分支分开。
  assert.match(
    隔离事件源,
    /类型 === '晨跑'[\s\S]*?类型 === '健身'[\s\S]*?类型 === '睡眠'/,
    '日常时间反馈类型判定必须包含晨跑、健身、睡眠',
  );
  assert.doesNotMatch(隔离事件源, /类型 === '荣耀洞'[\s\S]*?类型 === '晨跑'/, '荣耀洞不得被日常类型判定吞并');

  const 生成段 = 截段(隔离事件源, 'export async function 生成隔离事件草稿', '\nexport function 写入隔离事件草稿');

  // 通道决策必须收口进纯函数 选择隔离事件生成通道，生成草稿只按返回值分派：日常三类型
  // 无论数据库 API 可用与否、正文模型是否 DeepSeek 都走 generateRaw；只有荣耀洞/监控
  // 在 可调用AI && !DeepSeek 时走数据库代发。数据库分支返回空/抛错只失败一次，不回退正文。
  assert.match(
    生成段,
    /选择隔离事件生成通道\(\s*参数\.类型,\s*数据库状态\(\)\.可调用AI,\s*是DeepSeek\s*\)/,
    '生成草稿必须通过纯函数决策通道',
  );
  assert.match(生成段, /通道 === '数据库'[\s\S]{0,60}通过数据库生成\(/, '数据库分支必须显式按通道分派');
  assert.match(生成段, /预设破限段\(参数\.行动\)/, '预设破限段必须收到本拍行动，阻断上一楼指令泄漏');
  assert.match(生成段, /通过数据库生成\(/, '荣耀洞/监控的数据库代发路径必须保留');
  const 数据库分支 = 截段(生成段, "if (通道 === '数据库')", "} else {");
  assert.doesNotMatch(数据库分支, /generateRaw/, '数据库分支不得在失败后自动回退正文 generateRaw（避免二次计费）');
});

test('隔离事件进行中()不再是辅助请求身份旁路；认证原生正文在隔离期间被明确拒绝并释放租约', () => {
  const prompt起 = Index源.lastIndexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY');
  const prompt止 = Index源.indexOf('Mvu.events.VARIABLE_UPDATE_ENDED', prompt起);
  assert.ok(prompt起 >= 0 && prompt止 > prompt起);
  const prompt段 = Index源.slice(prompt起, prompt止);
  // 旧把 隔离事件进行中() 与文本标记并列作全局旁路、放过隔离期间真实原生正文的写法必须撤掉。
  assert.doesNotMatch(
    prompt段,
    /if \(隔离事件进行中\(\) \|\| 请求提示文本\.includes\(手机生成请求标记\) \|\| 请求提示文本\.includes\(隔离事件请求标记\)\)/,
    '隔离事件进行中() 不得再与文本标记并列旁路',
  );
  // 文本标记仍保留为防御证据，且位于正文认领之前。
  const 标记位置 = prompt段.indexOf('请求提示文本.includes(手机生成请求标记)');
  const 隔离标记位置 = prompt段.indexOf('请求提示文本.includes(隔离事件请求标记)');
  const 认领位置 = prompt段.indexOf('认领正文租约(');
  const 隔离拒绝位置 = prompt段.indexOf('if (隔离事件进行中())');
  assert.ok(标记位置 >= 0 && 隔离标记位置 >= 0 && 认领位置 >= 0, '文本标记防御或正文认领缺失');
  assert.ok(标记位置 < 认领位置 && 隔离标记位置 < 认领位置, '文本标记防御必须早于正文认领（短生成不得递增正文令牌）');
  // 隔离运行态只对“已认证的原生正文”拒绝，因此必须在认领之后。
  assert.ok(隔离拒绝位置 > 认领位置, '隔离运行态拒绝必须在认证（认领正文租约）之后，不得再当身份旁路');
  // 拒绝分支必须按本轮 owner 释放这笔租约，不能遗留锁。
  const 隔离拒绝段 = prompt段.slice(隔离拒绝位置, prompt段.indexOf('\n      }\n', 隔离拒绝位置));
  assert.match(隔离拒绝段, /释放正文租约\(/, '被拒的认证原生正文必须释放租约');
  // 无宿主开始票的辅助请求在正文认领之前返回，不得改正文令牌/冻结/租约。
  const 无票检查位置 = prompt段.indexOf("原生票.阶段 !== '等待prompt'");
  assert.ok(无票检查位置 >= 0 && 无票检查位置 < 认领位置, '无宿主开始票的请求不得进入正文认领');
});

test('预设桥头部注释说明独立事件为何需要覆写历史宏', () => {
  assert.match(预设桥源, /lastUserMessage/);
  assert.match(预设桥源, /独立/);
});
