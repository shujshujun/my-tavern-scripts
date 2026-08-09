/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

test('失败事件只在临时楼删除、chat 快照恢复和事务解锁后广播', () => {
  const catch位置 = 回合源码.indexOf('} catch (e) {', 回合源码.indexOf('export async function 执行回合'));
  const finally位置 = 回合源码.indexOf('} finally {', catch位置);
  const 恢复位置 = 回合源码.indexOf('await 恢复回合变量快照(chat快照)', finally位置);
  const 解锁位置 = 回合源码.indexOf('标记回合事务结束()', finally位置);
  const 广播位置 = 回合源码.indexOf("eventEmit('人妻公寓:回合失败', 待广播失败原因)", finally位置);

  assert.ok(catch位置 >= 0 && finally位置 > catch位置);
  assert.doesNotMatch(回合源码.slice(catch位置, finally位置), /eventEmit\('人妻公寓:回合失败'/);
  assert.ok(恢复位置 > finally位置 && 解锁位置 > 恢复位置 && 广播位置 > 解锁位置);
});

test('客户端失败收口重拉消息、MVU、行动选项和两套在场真值后才允许自动重试', () => {
  const 开始 = App源码.indexOf("eventOn('人妻公寓:回合失败', async");
  const 结束 = App源码.indexOf("eventOn('人妻公寓:已重开'", 开始);
  const 片段 = App源码.slice(开始, 结束);

  assert.match(片段, /await 取卷轴\(\)/);
  assert.match(片段, /刷新在场\(\)/);
  assert.match(片段, /刷新行动选项\(\)/);
  assert.match(片段, /await Promise\.resolve\([\s\S]{0,120}\.pull\?\.\(\)\)/);
  assert.match(片段, /await nextTick\(\)[\s\S]{0,180}发出\(待重试\)/);
});

test('连续反感按同一次进房标识计数，换房重访不接旧链；真实离场同步熄灭头像', () => {
  const 开始 = 回合源码.indexOf('async function 结算连续反感');
  const 结束 = 回合源码.indexOf('function 补离场正文', 开始);
  const 片段 = 回合源码.slice(开始, 结束);

  assert.match(片段, /旧记录\?\.位置 === 当前场景\.房间id/);
  assert.match(片段, /旧记录\.进房末楼[\s\S]{0,80}当前进房末楼/);
  assert.match(片段, /仍是同次拜访[\s\S]{0,120}上次次数/);
  assert.match(片段, /\['焦点', '在场', '妻在场', '可写妻'\]/);
  assert.match(片段, /演员\[键\] = 列表\.filter\(m => !离场\.includes/);
});
