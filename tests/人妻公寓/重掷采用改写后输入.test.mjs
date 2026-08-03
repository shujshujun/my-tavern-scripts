/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
// 2026-08-04 玩家实测:用羽笔按钮改写了刚才的输入再重演,重演的却是改写前的旧输入。
// 根因:重掷回合() 一直重演 _上次回合.行动(落库时的原稿),而羽笔只改写了行动楼的
// message 文本——该楼随后又被重掷物理删除,改写被整体丢弃。修复:删楼前先读行动楼
// (user 角色楼,创建时 message === 行动,见 执行回合 的 createChatMessages)的现文本,
// 非空则以它为准重演;纯脚本回合没有玩家楼时仍退回原稿。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

test('重掷必须在删楼前读取行动楼现文本,并以它作为重演行动', () => {
  assert.match(回合源码, /let 重演行动 = 记录\.行动;/, '找不到玩家楼(纯脚本回合)时必须退回原稿');
  assert.match(
    回合源码,
    /const 回合楼层 = getChatMessages\(`\$\{记录\.回合前末楼 \+ 1\}-\$\{末楼\}`\) \?\? \[\];\s*const 行动楼 = 回合楼层\.find\(消息 => 消息\.role === 'user'\);/,
    '重演行动取自本回合区间内的 user 楼——它创建时 message === 行动,现文本即玩家当前意图',
  );
  assert.match(
    回合源码,
    /if \(现行动\) 重演行动 = 现行动;[\s\S]{0,300}内部删除聊天消息\(_\.range\(记录\.回合前末楼 \+ 1, 末楼 \+ 1\)\)/,
    '行动楼文本必须先于物理删楼读取,删完就没了',
  );
  assert.match(回合源码, /await 执行回合\(重演行动\);/, '重演入口必须吃重读后的行动');
  assert.doesNotMatch(回合源码, /await 执行回合\(记录\.行动\);/, '不得再直接重演落库原稿');
});
