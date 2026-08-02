/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('普通正文只有身体开发增长时仍登记亲密风闻', () => {
  for (const 文件 of ['回合引擎.ts', 'index.ts']) {
    const source = readFileSync(`src/人妻公寓/脚本/游戏逻辑/${文件}`, 'utf8');
    const start = source.indexOf('const 成长结果 = 记录全楼有效成长');
    const segment = source.slice(start, start + 850);
    assert.ok(start >= 0, `${文件} 必须消费有效成长结果`);
    assert.match(segment, /身体开发/, `${文件} 必须识别身体开发成长`);
    assert.match(segment, /身体开发[\s\S]*登记攻略风闻[\s\S]*'亲密'/, `${文件} 必须把身体开发登记为亲密风闻`);
  }
});

test('特殊剧情的固定成长不登记攻略风闻', () => {
  for (const 文件 of ['回合引擎.ts', 'index.ts']) {
    const source = readFileSync(`src/人妻公寓/脚本/游戏逻辑/${文件}`, 'utf8');
    const start = source.indexOf('const 成长结果 = 记录全楼有效成长');
    const segment = source.slice(start, start + 900);
    assert.match(segment, /if \(!特殊场景id\)/, `${文件} 必须让特殊剧情绕过攻略风闻登记`);
  }
});
