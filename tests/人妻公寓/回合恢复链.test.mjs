/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const {
  保存回合恢复记录,
  读取回合恢复记录,
  清除回合恢复记录,
} = require('../../src/人妻公寓/界面/客户端/回合恢复缓存.ts');

const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 回合输入源码 = readFileSync(new URL('./components/回合输入.vue', 客户端目录), 'utf8');

function 内存存储() {
  const 数据 = new Map();
  return {
    getItem: 键 => 数据.get(键) ?? null,
    setItem: (键, 值) => 数据.set(键, String(值)),
    removeItem: 键 => 数据.delete(键),
  };
}

test('失败行动缓存按聊天与时间线锚恢复，清理一个聊天不影响另一个', () => {
  const 存储 = 内存存储();
  const 记录时间 = 1_000_000;
  保存回合恢复记录(存储, {
    聊天ID: 'chat-a',
    行动: '敲门询问情况',
    锚楼: 12,
    锚签名: 'anchor-a',
    时间线世代: 7,
    记录时间,
  });
  保存回合恢复记录(存储, {
    聊天ID: 'chat-b',
    行动: '查看信箱',
    锚楼: 8,
    锚签名: 'anchor-b',
    时间线世代: 3,
    记录时间,
  });

  assert.equal(
    读取回合恢复记录(存储, { 聊天ID: 'chat-a', 锚楼: 12, 锚签名: 'anchor-a', 时间线世代: 7 }, 记录时间 + 100)?.行动,
    '敲门询问情况',
  );
  assert.equal(
    读取回合恢复记录(存储, { 聊天ID: 'chat-a', 锚楼: 13, 锚签名: 'anchor-a', 时间线世代: 7 }, 记录时间 + 100),
    null,
    '楼层变化后不得把旧行动带到新时间线',
  );
  assert.equal(
    读取回合恢复记录(存储, { 聊天ID: 'chat-a', 锚楼: 12, 锚签名: 'other', 时间线世代: 7 }, 记录时间 + 100),
    null,
    '同楼不同分支不得恢复旧行动',
  );

  assert.equal(
    读取回合恢复记录(
      存储,
      { 聊天ID: 'chat-a', 锚楼: 12, 锚签名: 'anchor-a', 时间线世代: 8 },
      记录时间 + 100,
    ),
    null,
    'A→B→A 即使回到同聊天、同楼与同签名，共享世代变化后也不得 ABA 复活旧行动',
  );

  清除回合恢复记录(存储, 'chat-a');
  assert.equal(读取回合恢复记录(存储, { 聊天ID: 'chat-a', 锚楼: 12, 锚签名: 'anchor-a', 时间线世代: 7 }, 记录时间 + 100), null);
  assert.equal(
    读取回合恢复记录(存储, { 聊天ID: 'chat-b', 锚楼: 8, 锚签名: 'anchor-b', 时间线世代: 3 }, 记录时间 + 100)?.行动,
    '查看信箱',
  );
});

test('过期、空行动与损坏缓存失败关闭，不制造跨局重试入口', () => {
  const 存储 = 内存存储();
  const 记录时间 = 2_000_000;
  保存回合恢复记录(存储, {
    聊天ID: 'chat-a',
    行动: '  ',
    锚楼: 1,
    锚签名: 'anchor',
    时间线世代: 1,
    记录时间,
  });
  assert.equal(读取回合恢复记录(存储, { 聊天ID: 'chat-a', 锚楼: 1, 锚签名: 'anchor', 时间线世代: 1 }, 记录时间), null);

  保存回合恢复记录(存储, {
    聊天ID: 'chat-a',
    行动: '继续交谈',
    锚楼: 1,
    锚签名: 'anchor',
    时间线世代: 1,
    记录时间,
  });
  assert.equal(
    读取回合恢复记录(存储, { 聊天ID: 'chat-a', 锚楼: 1, 锚签名: 'anchor', 时间线世代: 1 }, 记录时间 + 24 * 60 * 60 * 1000 + 1),
    null,
    '超过一天的恢复记录必须过期',
  );

  存储.setItem('人妻公寓_回合恢复_v1', '{broken');
  assert.equal(读取回合恢复记录(存储, { 聊天ID: 'chat-a', 锚楼: 1, 锚签名: 'anchor', 时间线世代: 1 }, 记录时间), null);
});

test('App 恢复上下文与行动选项身份包含共享时间线世代，阻止同值 ABA 认领', () => {
  assert.match(
    App源码,
    /import \{ 当前时间线切换世代 \} from '\.\.\/\.\.\/脚本\/游戏逻辑\/时间线切换协调';/,
  );
  assert.match(App源码, /时间线世代: 当前时间线切换世代\(\)/, '恢复上下文必须冻结共享世代');
  const 世代位置 = App源码.indexOf('`${上下文.时间线世代}');
  const 聊天位置 = App源码.indexOf('${上下文.聊天ID}', 世代位置);
  assert.ok(世代位置 >= 0 && 聊天位置 > 世代位置, '行动选项身份必须把共享世代放在首位');
});

test('失败入口优先于旧回合按钮；生成中与成功后都提供明确的重新生成出口', () => {
  const 失败位置 = 回合输入源码.indexOf('failedAction && !sending');
  const 旧回合位置 = 回合输入源码.indexOf('canReroll && !sending');
  assert.ok(失败位置 >= 0 && 旧回合位置 > 失败位置, '新一轮失败必须优先显示其重试入口，不能被旧回合快照遮住');
  assert.match(回合输入源码, /sending && retryAction/, '生成期间在固定输入区提供恢复入口');
  assert.match(回合输入源码, /emit\('abandonAndRetry'\)/, '生成中恢复入口接停止并自动重试');
  assert.match(回合输入源码, /停止并重试/, '生成中按钮文案明确');
  assert.match(回合输入源码, /正文不完整[^\n]*重新生成/, '成功楼仍提供玩家主动判定正文截断的入口');

  assert.match(App源码, /:retry-action="待重试行动"/, 'App 把当前行动接到固定恢复入口');
  assert.match(App源码, /@abandon-and-retry="放弃并重试"/, '固定恢复入口复用原取消后自动重试事务');
});

test('App 在发送前持久化，失败时可从缓存回补，成功与重开时清理', () => {
  assert.match(
    App源码,
    /function 发出\(文本: string\)[\s\S]*?保存待恢复行动\(文本\);[\s\S]*?eventEmit\('人妻公寓:玩家行动', 文本\)/,
  );
  assert.match(App源码, /onMounted\(\(\) => \{[\s\S]*?恢复失败行动\(\);/);
  assert.match(
    App源码,
    /eventOn\('人妻公寓:回合失败'[\s\S]*?待重试行动\.value\.trim\(\) \|\| 读取待恢复行动\(\)/,
    '刷新导致内存行动丢失后，失败收口仍能从会话缓存恢复',
  );
  assert.match(App源码, /eventOn\('人妻公寓:回合完成'[\s\S]*?清除待恢复行动\(\)/, '成功提交后清缓存');
  assert.match(App源码, /eventOn\('人妻公寓:已重开'[\s\S]*?清除待恢复行动\(\)/, '重开新局前清缓存');
});
