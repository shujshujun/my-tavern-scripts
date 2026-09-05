/* eslint-disable import-x/no-nodejs-modules -- Node-only regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const ts = require('typescript');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 门牌列表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 攻略动态方向 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/内容素材表.ts');
const { 汉字数 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机群聊格式.ts');
const { 验收群聊隐私 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');
const { 角色结局期画像, 结局期称呼纪律 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局期语义.ts');
const { 构建结局社交画像, 结局期私密手机纪律 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局社交语义.ts');
const { 许曼君正式离婚完成ID } = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');

// 对大型宿主模块只加载目标纯函数；函数体来自真实源码，所有被验证的下游处理使用生产实现。
function loadFunction(file, name, dependencies = {}) {
  const source = readFileSync(new URL(`../../src/人妻公寓/脚本/游戏逻辑/${file}`, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(declaration, name);
  const code = ts.transpileModule(declaration.getText(ast).replace(/^export /u, ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(dependencies), `${code}; return ${name};`)(...Object.values(dependencies));
}
function fresh() {
  return Schema.parse({ 户: Object.fromEntries(门牌列表.map(m => [m, 创建户节点(0)])) });
}
const sourceFacts = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
const family = loadFunction('手机/生成引擎.ts', '家庭事实', { 户静态表, ...sourceFacts });
const validateFeed = loadFunction('手机/节拍引擎.ts', '校验朋友圈文案', {
  _: lodash, 户静态表, 门牌列表, 攻略动态方向, 汉字数, 验收群聊隐私,
  手机可见单条硬上限: 150, ...sourceFacts,
});

test('201家庭身份从当前法律事实派生，分居、法律离婚和完成旧档分别成立', () => {
  const data = fresh();
  assert.match(family('201', data), /丈夫.*赵国强/u);
  data.系统._许曼君分居.阶段 = '已完成';
  assert.match(family('201', data), /分居/u);
  assert.doesNotMatch(family('201', data), /前夫/u);
  data.系统._许曼君离婚.法律离婚已成立 = true;
  assert.match(family('201', data), /前夫.*赵国强/u);
  data.系统._许曼君离婚.法律离婚已成立 = false;
  data.系统._已完成特殊场景.push(许曼君正式离婚完成ID);
  assert.match(family('201', data), /前夫.*赵国强/u);
  data.系统._已完成特殊场景 = [];
  assert.doesNotMatch(family('201', data), /前夫/u, '回档后重新派生，不缓存未来身份');
  assert.match(family('301', data), /丈夫.*江辰/u, '201变化不修改其他户身份');
});

test('101已公开孕情的生活词可进入普通朋友圈，隐藏期与丈夫隐私保留原资格', () => {
  const data = fresh();
  data.系统._已完成特殊场景.push('借种');
  const text = '今天的叶酸放在水杯旁。';
  assert.equal(validateFeed(text, '夏乔', '101', false, data), '', '只有结局不能提前公开孕情');
  data.户['101'].妻._怀孕.状态 = '已告知';
  assert.equal(validateFeed(text, '夏乔', '101', false, data), text);
  assert.equal(validateFeed('怀孕以后更喜欢坐在窗边。', '夏乔', '101', false, data), '怀孕以后更喜欢坐在窗边。');
  assert.equal(validateFeed('私聊里才说过怀孕的事。', '夏乔', '101', false, data), '');
  assert.equal(validateFeed('许曼君怀孕以后更爱休息了。', '夏乔', '101', false, data), '', '本人公开资格不授予其他人物事实');
  assert.equal(validateFeed('不孕的检查单找到了。', '夏乔', '101', false, data), '', '公开孕情不公开丈夫医疗秘密');
  data.户['101'].妻._怀孕.状态 = '未孕';
  assert.equal(validateFeed(text, '夏乔', '101', false, data), '');
});

test('301专场和普通群画像读取同一已提交照片，撤回、错容器和回档不遗留公开资格', () => {
  const data = fresh();
  data.系统._已完成特殊场景.push('角色路线:301:结局剧情');
  const photo = { 会话: '姐妹群', 键: '301结局:换照:姐妹群照片', 类: '图片' };
  assert.equal(构建结局社交画像(data, '301', [photo]).关系公开级, '群内摊牌');
  assert.equal(角色结局期画像(data, '301', [photo]).群内已公开关系, true);
  for (const messages of [[], [{ ...photo, 会话: '301' }], [{ ...photo, 类: '撤回' }]]) {
    assert.equal(角色结局期画像(data, '301', messages).群内已公开关系, false);
    assert.notEqual(构建结局社交画像(data, '301', messages).关系公开级, '群内摊牌');
  }
  assert.equal(角色结局期画像(data, '201', [photo]).群内已公开关系, false);
});

test('201分居和法律离婚中途有当前生活事实，但不冒充完整结局', () => {
  const data = fresh();
  data.系统._许曼君分居.阶段 = '已完成';
  for (const 法律已离 of [false, true]) {
    data.系统._许曼君离婚.法律离婚已成立 = 法律已离;
    assert.equal(sourceFacts.角色正式结局已完成(data, '201'), false);
    assert.deepEqual(角色结局期画像(data, '201').已完成结局, []);
    assert.equal(构建结局社交画像(data, '201').已完成结局, '');
    assert.ok(sourceFacts.角色阶段私聊基础(data, '201'));
  }
  data.系统._已完成特殊场景.push(许曼君正式离婚完成ID);
  assert.equal(sourceFacts.角色正式结局已完成(data, '201'), true);
});

test('六户的当前关系输入保留不同结局与201已保存选择，不沿用低阶段初见模板', () => {
  const data = fresh();
  data.系统._已完成特殊场景.push('借种', '录像带结局', 许曼君正式离婚完成ID, '角色路线:301:结局剧情', '双重继承');
  for (const m of 门牌列表) assert.ok(sourceFacts.角色阶段私聊基础(data, m));
  for (const choice of ['继续关系', '暂不承诺', '退出关系']) {
    data.系统._许曼君分居.玩家最终关系选择 = choice;
    assert.match(sourceFacts.角色阶段私聊基础(data, '201'), new RegExp(choice === '退出关系' ? '退出私人关系' : choice));
  }
  assert.notEqual(sourceFacts.角色阶段私聊基础(data, '102'), sourceFacts.角色阶段私聊基础(data, '202'));
});

test('201分居过渡也保留实际关系选择，退出选择覆盖L5的通用亲密称呼', () => {
  const data = fresh();
  data.户['201'].妻.当前阶段 = 5;
  data.系统._许曼君分居.阶段 = '已完成';
  data.系统._许曼君分居.玩家最终关系选择 = '暂不承诺';
  assert.equal(sourceFacts.角色当前仅保留事务往来(data, '201'), false);
  assert.match(结局期私密手机纪律(data, '201'), /暂不承诺/u);
  data.系统._许曼君分居.玩家最终关系选择 = '退出关系';
  assert.equal(sourceFacts.角色当前仅保留事务往来(data, '201'), true);
  assert.match(结局期称呼纪律(data, '201', '私聊'), /住户|管理员/u);
  assert.doesNotMatch(结局期称呼纪律(data, '201', '私聊'), /私聊可使用本人已经建立的稳定亲密称呼/u);
  data.系统._许曼君分居.玩家最终关系选择 = '未决定';
  assert.equal(sourceFacts.角色当前仅保留事务往来(data, '201'), true);
  assert.match(结局期称呼纪律(data, '201', '私聊'), /住户|管理员/u);
  assert.equal(sourceFacts.角色当前仅保留事务往来(data, '101'), false);
});
