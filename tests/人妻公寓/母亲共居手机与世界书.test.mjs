/* eslint-disable import-x/no-nodejs-modules -- Node-only compatibility contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('旧手机生产者已经降为无写入兼容门面', () => {
  const source = read('src/人妻公寓/脚本/游戏逻辑/手机/母亲共居手机.ts');
  assert.match(source, /手机硬反馈已经由 `手机\/节拍引擎\.ts`/);
  assert.match(source, /return Promise\.resolve\('无新'\)/);
  assert.doesNotMatch(source, /库\.圈\.(?:push|unshift)|库\.消息\.push/);
});

test('旧世界书导出委托唯一聊天级同步器，不再维护第二套条目', () => {
  const source = read('src/人妻公寓/脚本/游戏逻辑/结局世界书同步.ts');
  assert.match(source, /同步302阶段世界书\(data, 仍有效, true\)/);
  assert.match(source, /结局世界书条目名 = 共居阶段世界书条目名/);
  assert.doesNotMatch(source, /createWorldbookEntries|getWorldbook\(/);
});
