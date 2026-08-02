/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import test from 'node:test';

const { 安全父亲台词, 验收群聊隐私, 群聊安全回退 } = await import(
  '../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts'
);

test('母亲圆场首句必须在输出级出现父亲转述，否则使用本地安全台词', () => {
  assert.equal(安全父亲台词('这期账怎么回事？', true), '你妈已经替你说过话了，这期账我还是要逐项问清。');
  assert.equal(安全父亲台词('你妈替你说过话，这期账怎么回事？', true), '你妈替你说过话，这期账怎么回事？');
  assert.equal(安全父亲台词('母亲：我替他说两句\n父亲：账呢', true), '你妈已经替你说过话了，这期账我还是要逐项问清。');
  assert.equal(安全父亲台词('你妈：我已经替他说过了', true), '你妈已经替你说过话了，这期账我还是要逐项问清。');
  assert.equal(安全父亲台词('父亲说：“这期账呢？”', false), '这期楼里的账和事情，你照实一项项说。');
});

test('群聊输出逐条拒绝私聊、亲密和婚姻隐私，失败时提供无隐私本地回退', () => {
  assert.equal(验收群聊隐私('夏乔:楼道灯又坏了，麻烦看看', '楼务'), true);
  assert.equal(验收群聊隐私('夏乔:我看见你们昨晚在房里接吻', '楼务'), false);
  assert.equal(验收群聊隐私('夏乔:她和管理员最近挺暧昧', '楼务'), false);
  assert.equal(验收群聊隐私('夏乔:我看见她半夜从管理员房间出来', '楼务'), false);
  assert.equal(验收群聊隐私('沈静仪:他私聊里答应今晚来我家', '姐妹'), false);
  assert.equal(群聊安全回退(['夏乔'], '楼务'), '夏乔:收到，有楼务情况我再在群里说。');
});
