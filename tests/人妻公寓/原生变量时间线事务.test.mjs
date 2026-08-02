/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 入住源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/入住系统.ts', import.meta.url), 'utf8');

function 截源(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源.slice(起, 止);
}

test('原生变量回调冻结轮令牌、世代、聊天与消息双身份，并让所有异步写受同一校验', () => {
  const 回调 = 截源(index源, 'eventOn(Mvu.events.VARIABLE_UPDATE_ENDED', '// 原生酒馆生成被玩家停止时');

  for (const 片段 of [
    'const 原生本轮令牌 = _原生本轮令牌',
    'const 原生时间线世代 = 当前时间线切换世代()',
    'const 原生聊天ID = 当前聊天ID()',
    'const 末楼层 = 当前楼层()',
    'const 末楼 = SillyTavern.chat?.[末楼层]',
    'let 预期末楼消息签名 = 手机锚消息签名(末楼)',
  ]) {
    assert.match(回调, new RegExp(片段.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(回调, /本次原生变量事务 === _原生变量事务序号/);
  assert.match(回调, /SillyTavern\.chat\?\.\[末楼层\] === 末楼/);
  assert.match(回调, /手机锚消息签名\(SillyTavern\.chat\?\.\[末楼层\]\) === 预期末楼消息签名/);
  assert.doesNotMatch(回调, /void 同步整表视图/);
  assert.match(
    回调,
    /await 同步整表视图\(\s*data,\s*原生事务仍有效,\s*_isInAiCycle \? _本轮变量范围 : undefined,\s*_isInAiCycle \? 末楼层 : undefined/,
  );
  assert.doesNotMatch(回调, /(?<!await )物理写回静音会议原生正文\(/);
  assert.match(回调, /await 固化原生本轮在场\(楼层, 原生事务仍有效\)/);
  assert.match(回调, /标记原生变量事务开始\(\)/);
  assert.match(回调, /finally[\s\S]*标记原生变量事务结束\(\)/);
});

test('静音正文物理写回持有精确租约，自己的正文改写会同步刷新预期签名', () => {
  const 写回 = 截源(index源, 'async function 物理写回静音会议原生正文(', 'function 合并静音会议可信私聊摘要');
  assert.match(写回, /if \(!提交校验\(\)\) throw/);
  assert.match(写回, /消息 !== 预期消息/);
  assert.match(写回, /消息\.mes = 正文;[\s\S]*刷新预期消息签名\(\)/);
  assert.match(写回, /await Promise\.resolve\(setChatMessages/);
  assert.match(写回, /_静音会议原生正文写回租约\?\.序号 === 写回序号/);
  assert.doesNotMatch(写回, /void Promise\.resolve\(setChatMessages/);
});

test('原生入住延时任务冻结世代和消息身份，世界书回调内部也复核提交资格', () => {
  const 延时 = 截源(index源, 'function 安排原生入住持久后同步(', '// 快照注入幂等标记');
  assert.match(延时, /const 预期时间线世代 = 当前时间线切换世代\(\)/);
  assert.match(延时, /const 预期消息 = SillyTavern\.chat\?\.\[楼层\]/);
  assert.match(延时, /手机锚消息签名/);
  assert.match(延时, /标记原生变量事务开始\(\)/);
  assert.match(延时, /await 同步入住世界书条目\(已落盘, 仍在原时间线\)/);
  assert.match(延时, /finally[\s\S]*标记原生变量事务结束\(\)/);

  const 世界书 = 截源(入住源, 'export async function 同步入住世界书条目(', 'function 取严格入住预约');
  assert.match(世界书, /if \(!提交校验\(\)\) return/);
  assert.match(世界书, /updateWorldbookWith\(primary, 条目们 => \{\s*if \(!提交校验\(\)\) return 条目们/);
});

test('宿主切分支先作废原生轮，再等待主回合和原生变量事务全部退栈', () => {
  const 原生协调 = 截源(index源, 'function 排队宿主原生时间线切换', 'const 滑动监听');
  const 停止 = 截源(index源, 'eventOn(tavern_events.GENERATION_STOPPED', '// 宿主原生 swipe/删楼');
  assert.match(原生协调, /_原生本轮令牌 \+= 1/);
  assert.match(原生协调, /await 等待回合事务清理完成\(\)/);
  assert.match(原生协调, /await 等待原生变量事务清理完成\(\)/);
  assert.ok(
    原生协调.indexOf('等待原生变量事务清理完成') < 原生协调.indexOf('协调原生时间线切换'),
    '旧原生写未结束前不得开始新分支收口',
  );
  assert.match(停止, /_原生本轮令牌 \+= 1/);
});
