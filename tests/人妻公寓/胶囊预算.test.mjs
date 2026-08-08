/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 胶囊预算选择 } = require('../../src/人妻公寓/脚本/游戏逻辑/胶囊预算.ts');
const { 编译近期微信胶囊 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信正文承接.ts');
const 数据库源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', import.meta.url), 'utf8');
const 承接源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/微信正文承接.ts', import.meta.url), 'utf8');

test('胶囊预算：首个候选超长时整体跳过，后续短候选保留、顺序不变、标签闭合、总长不超限', () => {
  const 开头 = '<head>\n';
  const 结尾 = '\n</head>';
  const 保留 = 胶囊预算选择(开头, 结尾, ['超长'.repeat(2000), '短甲', '短乙'], 100);
  assert.deepEqual(保留, ['短甲', '短乙']);
  const 完整 = 开头 + 保留.join('\n') + 结尾;
  assert.ok([...完整].length <= 100, '总长不得超过上限');
  assert.equal(完整.includes('超长'), false, '超长项不得以半句出现');
  assert.equal(完整.startsWith('<head>'), true, '开标签闭合');
  assert.equal(完整.endsWith('</head>'), true, '闭标签闭合');
});

test('胶囊预算：普通记忆最多保留 8 条，跳过异常项后由后续候选补位', () => {
  const 开头 = '';
  const 结尾 = '';
  const 候选 = ['超长项'.repeat(500), '短1', '短2', '短3', '短4', '短5', '短6', '短7', '短8', '短9'];
  const 保留 = 胶囊预算选择(开头, 结尾, 候选, 1000, 8);
  assert.equal(保留.includes('超长项'.repeat(500)), false, '超长候选应被整体跳过');
  assert.equal(保留.length, 8, '普通记忆最多保留 8 条');
  assert.deepEqual(保留, ['短1', '短2', '短3', '短4', '短5', '短6', '短7', '短8'], '跳过超长项后由后续候选补足');
});

test('胶囊预算：余量不足但后续有更短项时继续检查，不会因单条放不下 break', () => {
  const 开头 = 'x'.repeat(90);
  const 结尾 = '';
  const 保留 = 胶囊预算选择(开头, 结尾, ['很长'.repeat(30), '短'], 100);
  assert.deepEqual(保留, ['短'], '放不下的长项跳过后，后续短项仍能进入');
});

test('编译近期微信胶囊：超长分段整体跳过，后续分段保留、标签闭合', () => {
  const 超长 = Array.from({ length: 6 }, () => ({ 楼: 8, 时: 3, 会话: '101', 发: '对方', 文: '啊'.repeat(300) }));
  const 胶囊 = 编译近期微信胶囊(
    [...超长, { 楼: 8, 时: 3, 会话: '102', 发: '对方', 文: '后续短私聊' }],
    [
      { 门牌: '101', 人物: '夏乔' },
      { 门牌: '102', 人物: '沈静仪' },
    ],
    8,
    3,
  );
  assert.doesNotMatch(胶囊, /啊{20,}/, '超长分段必须整体跳过，不裁半句');
  assert.match(胶囊, /后续短私聊/, '跳过超长项后后续分段仍保留');
  assert.match(胶囊, /<人妻公寓近期私聊>/, '开标签闭合');
  assert.match(胶囊, /<\/人妻公寓近期私聊>/, '闭标签闭合');
  assert.ok([...胶囊].length <= 1200, '总长不得超过 最大胶囊长度');
});

test('三个胶囊调用点共用胶囊预算纯函数', () => {
  assert.match(数据库源, /import \{[\s\S]*胶囊预算选择[\s\S]*\} from '\.\/胶囊预算';/, '数据库桥应 import 预算纯函数');
  assert.match(承接源, /import \{[\s\S]*胶囊预算选择[\s\S]*\} from '\.\/胶囊预算';/, '微信正文承接应 import 预算纯函数');

  const 记忆段 = 数据库源.slice(数据库源.indexOf('export function 读取数据库记忆胶囊'), 数据库源.indexOf('function 取微信进展行'));
  assert.doesNotMatch(记忆段, /\.slice\(0,\s*8\)/, '普通记忆候选不得先裁 8 行再跳过异常项');
  assert.match(记忆段, /胶囊预算选择\(/, '普通数据库记忆应调用预算纯函数');
  assert.match(记忆段, /2200,?\s*8/, '普通数据库记忆由预算函数同时限制总长 2200 与最多 8 个已保留项');

  const 进展段 = 数据库源.slice(数据库源.indexOf('export function 读取微信进展胶囊'));
  assert.match(进展段, /胶囊预算选择\(开头, 结尾, lines, 1600\)/, '私有微信进展由预算函数限制总长');

  const 承接段 = 承接源.slice(承接源.indexOf('export function 编译近期微信胶囊'));
  assert.match(承接段, /胶囊预算选择\(开头, 结尾, 分段, 最大胶囊长度\)/, '近期私聊由预算函数限制总长');
  assert.doesNotMatch(承接段, /\)\s*>\s*最大胶囊长度\)\s*break;/, '不得因单条放不下 break 掉后续分段');
});
