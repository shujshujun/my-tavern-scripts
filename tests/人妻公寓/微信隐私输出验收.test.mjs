/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';

// Node 的原生 TypeScript loader 不为 ESM 相对导入补 `.ts`；生产构建由 webpack bundler 解析。
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[cm]?[jt]s$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const require = createRequire(import.meta.url);
const { 安全父亲台词, 验收群聊隐私, 群聊安全回退 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts'
);
// P6:父亲生产已迁至 ./手机/交互/父亲通话；朋友圈/评论/仅你可见迁至 ./手机/节拍引擎。
const 父亲通话源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts', import.meta.url),
  'utf8',
);
const 节拍引擎源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');

test('母亲圆场首句必须在输出级出现父亲转述，否则使用本地安全台词', () => {
  assert.equal(安全父亲台词('这期账怎么回事？', true), '你妈已经替你说过话了，这期账我还是要逐项问清。');
  assert.equal(安全父亲台词('你妈替你说过话，这期账怎么回事？', true), '你妈替你说过话，这期账怎么回事？');
  assert.equal(安全父亲台词('母亲：我替他说两句\n父亲：账呢', true), '你妈已经替你说过话了，这期账我还是要逐项问清。');
  assert.equal(安全父亲台词('你妈：我已经替他说过了', true), '你妈已经替你说过话了，这期账我还是要逐项问清。');
  assert.equal(安全父亲台词('父亲说：“这期账呢？”', false), '这期楼里的账和事情，你照实一项项说。');
});

test('父亲来电兼容自己的中英文冒号与自然折行，但仍拒绝第二说话人', () => {
  const 安全回退 = '这期楼里的账和事情，你照实一项项说。';
  assert.equal(安全父亲台词('父亲：这期账你核过没有？\n照实说。', false), '这期账你核过没有？照实说。');
  assert.equal(安全父亲台词('爸爸:这期账你核过没有？', false), '这期账你核过没有？');
  assert.equal(安全父亲台词('父亲：这期账你核过没有？\n母亲：别问了。', false), 安全回退);
  assert.equal(安全父亲台词('父亲：这期账你核过没有？\n秘书：资料还没齐。', false), 安全回退);
  assert.equal(安全父亲台词('父亲：这期账你核过没有？小苏：马上去查。', false), 安全回退);
  assert.equal(安全父亲台词('父亲：这期账你核过没有——母亲：别再问了。', false), 安全回退);
  assert.equal(
    安全父亲台词('父亲：这期账你核过没有？\r这是一个超过十二字符的陌生说话人标签：资料还没齐。', false),
    安全回退,
  );
  assert.equal(安全父亲台词('父亲皱眉看着账本：“这账不对。”', false), 安全回退);
  assert.equal(安全父亲台词('父亲叹了口气：这期账不对。', false), 安全回退);
  assert.equal(安全父亲台词('我只问一件事：账核过没有？', false), '我只问一件事：账核过没有？');
  assert.equal(安全父亲台词('父亲：账核过了。\r重点：收据别漏。', false), '账核过了。重点：收据别漏。');
});

test('父亲生产调用保留原始行边界，先通过严格安全验收再落通话记录', () => {
  const 开始 = 父亲通话源码.indexOf('async function 父亲台词');
  const 结束 = 父亲通话源码.indexOf('/**\n * `待回复.序号`', 开始);
  const 父亲段 = 父亲通话源码.slice(开始, 结束);
  assert.ok(开始 >= 0 && 结束 > 开始);
  assert.doesNotMatch(父亲段, /微信短文本\(/);
  assert.match(父亲段, /安全父亲台词\(候选/);
});

test('群聊输出逐条拒绝私聊、亲密和婚姻隐私，失败时提供无隐私本地回退', () => {
  assert.equal(验收群聊隐私('夏乔:楼道灯又坏了，麻烦看看', '楼务'), true);
  assert.equal(验收群聊隐私('夏乔:我看见你们昨晚在房里接吻', '楼务'), false);
  assert.equal(验收群聊隐私('夏乔:她和管理员最近挺暧昧', '楼务'), false);
  assert.equal(验收群聊隐私('夏乔:我看见她半夜从管理员房间出来', '楼务'), false);
  assert.equal(验收群聊隐私('沈静仪:他私聊里答应今晚来我家', '姐妹'), false);
  assert.equal(群聊安全回退(['夏乔'], '楼务'), '夏乔:收到，有楼务情况我再在群里说。');
});

test('公开朋友圈正文和评论复用楼务隐私门，仅你可见不套公开过滤', () => {
  const 正文开始 = 节拍引擎源码.indexOf('function 校验朋友圈文案');
  const 正文结束 = 节拍引擎源码.indexOf('function 取朋友圈兜底', 正文开始);
  const 评论开始 = 节拍引擎源码.indexOf("const 评论行 =", 正文结束);
  const 评论结束 = 节拍引擎源码.indexOf('if (!时间线仍有效()) return;', 评论开始);
  const 私密开始 = 节拍引擎源码.indexOf('// ── 仅你可见');
  const 私密结束 = 节拍引擎源码.indexOf('// ── 姐妹群主动拍', 私密开始);
  assert.match(节拍引擎源码.slice(正文开始, 正文结束), /验收群聊隐私\(文, '楼务'\)/);
  assert.match(节拍引擎源码.slice(评论开始, 评论结束), /验收群聊隐私\(行, '楼务'\)/);
  assert.doesNotMatch(节拍引擎源码.slice(私密开始, 私密结束), /验收群聊隐私/);
});
