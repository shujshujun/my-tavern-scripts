/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  规范手机单气泡,
  解析微信私聊气泡,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机文本格式.ts');

test('单气泡兼容中英文冒号前缀与自然折行，英文单词边界保留空格', () => {
  const 规则 = { 最大汉字: 150, 可剥首标签: ['夏乔'] };
  assert.equal(规范手机单气泡('夏乔：楼道灯坏了，\n晚上麻烦看一下。', 规则), '楼道灯坏了，晚上麻烦看一下。');
  assert.equal(规范手机单气泡('夏乔:hello\nworld', 规则), 'hello world');
  assert.equal(规范手机单气泡('提醒：今晚记得关窗。', 规则), '提醒：今晚记得关窗。');
});

test('单气泡在折行合并后执行150汉字硬上限', () => {
  assert.equal(规范手机单气泡(`${'好'.repeat(100)}\n${'好'.repeat(51)}`, { 最大汉字: 150 }), null);
});

test('私聊一次回复按妻名中英文冒号拆成多气泡，无标签折行回退为一个完整气泡', () => {
  assert.deepEqual(解析微信私聊气泡('夏乔：在呢\n夏乔:怎么啦？', '夏乔', 150, 5), ['在呢', '怎么啦？']);
  assert.deepEqual(解析微信私聊气泡('刚才在做饭，\n没看到消息。', '夏乔', 150, 5), ['刚才在做饭，没看到消息。']);
});

test('私聊混合无标签前句与妻名后句时保留两只气泡，未知说话人整段拒绝', () => {
  assert.deepEqual(解析微信私聊气泡('刚才在做饭。\n夏乔：现在看到啦。', '夏乔', 150, 5), [
    '刚才在做饭。',
    '现在看到啦。',
  ]);
  assert.deepEqual(
    解析微信私聊气泡('夏乔：第一句\n提醒：第二句\n陌生人：不能入库\n仍是陌生人的话\n夏乔：第三句', '夏乔', 150, 5),
    ['第一句提醒：第二句', '第三句'],
  );
  assert.deepEqual(
    解析微信私聊气泡(
      '夏乔：第一句\r这边刚刚有点忙，等一下。秘书：这段不能入库\r仍是秘书的话\r夏乔：第三句',
      '夏乔',
      150,
      5,
    ),
    ['第一句这边刚刚有点忙，等一下。', '第三句'],
  );
  assert.deepEqual(
    解析微信私聊气泡('夏乔：第一句\r这边忙完了。提醒：记得带钥匙', '夏乔', 150, 5),
    ['第一句这边忙完了。提醒：记得带钥匙'],
  );
});
