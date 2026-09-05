/* eslint-disable import-x/no-nodejs-modules -- Node-only semantic regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const { 父亲被写成已知关系 } = require('../../src/人妻公寓/脚本/游戏逻辑/父亲关系知情.ts');
const {
  验收母亲共居手机内容,
  验收双重继承余波公开事实,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局社交语义.ts');
const { 验收父亲模式语义, 验收群聊隐私 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');
const { 验收姐妹群跨线事实 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/姐妹群已知事实.ts');

test('父亲知道日常事项与管理交接不等于知道隐秘关系，母亲和父亲本人的正常消息均可通过', () => {
  for (const text of ['他爸知道房租已经收齐了。', '你爸知道公寓已经交接给你了。', '爸爸知道我们住在302。']) {
    assert.equal(父亲被写成已知关系(text, '母亲'), false, text);
    assert.equal(验收母亲共居手机内容(text, '私密'), true, text);
    assert.equal(验收母亲共居手机内容(text, '公开朋友圈'), true, text);
    assert.equal(验收双重继承余波公开事实(`母亲:${text}`, []), true, text);
    assert.equal(验收群聊隐私(`母亲:${text}`, '双重继承余波'), true, text);
  }
  assert.equal(验收父亲模式语义('我知道你和你妈一起吃过晚饭了。', '双重继承后家常'), true);
  assert.equal(验收父亲模式语义('我知道公寓已经交接好了。', '双重继承后家常'), true);
});

test('否定、不确定与未执行计划不制造父亲知情；私密消息可以正常说明他仍不知道', () => {
  for (const text of [
    '他爸还不知道我们的真实关系。',
    '父亲并未发现我和你的关系。',
    '爸爸从未看穿我们的秘密关系。',
    '你爸知道我们的真实关系了吗？',
    '如果他爸知道我们的真实关系呢？',
    '我不想让父亲知道我们的真实关系。',
    '别告诉父亲我们的真实关系。',
    '他爸没有装作不知道我们的真实关系，他确实不知道。',
  ]) {
    assert.equal(父亲被写成已知关系(text, '母亲'), false, text);
    assert.equal(验收母亲共居手机内容(text, '私密'), true, text);
  }
  assert.equal(验收父亲模式语义('我不知道你和你妈那点事。', '双重继承后家常'), true);
});

test('所有父亲称呼的明确知情与共谋仍被拒绝，双重否定不能绕过', () => {
  for (const name of ['父亲', '爸爸', '你爸', '他爸']) {
    for (const text of [
      `${name}已经知道我和你的真实关系了。`,
      `${name}早就看穿并默许我和管理员了。`,
      `${name}不是不知道我们的真实关系。`,
      `${name}只是装作不知道我们的真实关系。`,
    ]) {
      assert.equal(父亲被写成已知关系(text, '母亲'), true, text);
      assert.equal(验收母亲共居手机内容(text, '私密'), false, text);
      assert.equal(验收双重继承余波公开事实(`母亲:${text}`, []), false, text);
      assert.equal(验收姐妹群跨线事实(`母亲:${text}`, []), false, text);
    }
  }
  assert.equal(验收父亲模式语义('你和你妈那点事我早就看穿了，只是一直默许。', '双重继承后家常'), false);
});

test('不同分句分别判断：前半句的否定不掩盖后半句肯定，普通事项也不继承隐私话题', () => {
  assert.equal(父亲被写成已知关系('他爸原来不知道我们的真实关系，但其实已经知道了。', '母亲'), true);
  assert.equal(父亲被写成已知关系('他爸不知道我们的真实关系，但知道房租收齐了。', '母亲'), false);
  assert.equal(父亲被写成已知关系('我们的真实关系，他爸已经知道了。', '母亲'), true);
  assert.equal(父亲被写成已知关系('他爸不知道我们的真实关系，但我一直知道。', '母亲'), false);
});

test('父亲说明不再审核时保留正常回应，双重否定的重新介入仍不通过', () => {
  for (const text of ['我不审核公寓账本。', '我不再检查公寓账本。', '我不再考核你的管理。', '我不替你审核公寓账本。']) {
    assert.equal(验收父亲模式语义(text, '双重继承后家常'), true, text);
  }
  assert.equal(验收父亲模式语义('我不能不审核公寓账本。', '双重继承后家常'), false);
  assert.equal(验收父亲模式语义('我不管多晚都要审核公寓账本。', '双重继承后家常'), false);
  assert.equal(验收父亲模式语义('把账本发给我，我要重新审核公寓。', '普通审核'), true);
});

test('否定知情不等于可在朋友圈公开关系，父母的正常夫妻身份仍可说明', () => {
  for (const text of ['他爸还不知道我们的真实关系。', '你爸不知道我和你的特殊关系。']) {
    assert.equal(验收母亲共居手机内容(text, '私密'), true);
    assert.equal(验收母亲共居手机内容(text, '公开朋友圈'), false);
  }
  assert.equal(验收母亲共居手机内容('我和他爸仍是夫妻。', '公开朋友圈'), true);
  assert.equal(验收母亲共居手机内容('我和你爸仍是夫妻。', '公开朋友圈'), true);
  assert.equal(验收母亲共居手机内容('我和你是情人。', '公开朋友圈'), false);
});

test('私人回忆不等于重开已完成章节，也不能顺带让父亲知情或公开隐秘现场', () => {
  for (const text of ['我还记得机场视频那天的事。', '那三日早餐，我一直记得。', '八区验收时你很认真。']) {
    assert.equal(验收母亲共居手机内容(text, '私密'), true, text);
  }
  assert.equal(验收母亲共居手机内容('我还记得机场视频那天的事。', '公开朋友圈'), false);
  assert.equal(验收母亲共居手机内容('机场视频之后，你爸已经知道我们的真实关系。', '私密'), false);
});
