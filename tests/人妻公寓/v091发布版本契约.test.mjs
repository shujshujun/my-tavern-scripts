/* eslint-disable import-x/no-nodejs-modules -- Node-only historical release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91 历史发布门禁仍能精确识别原标签和客户端标记', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91', 标签: 'rq0.91' }), 'RQGY_GAME_VERSION:0.91');
  assert.equal(校验客户端构建版本('RQGY_GAME_VERSION:0.91', '0.91'), 'RQGY_GAME_VERSION:0.91');
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.90.4', '0.91'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.90.4 RQGY_GAME_VERSION:0.91', '0.91'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91', 标签: 'rq0.90.4' }), /不一致/);
});

test('0.91 历史发布说明和数据版本记录保持冻结', () => {
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91_2026-09-08.md');
  const 闭环记录 = 读('src/人妻公寓/正式发布闭环_v0.91_2026-09-08.md');
  assert.match(发布说明, /发布标签：`rq0\.91`/);
  assert.match(发布说明, /角色卡版本：`0\.91`/);
  assert.match(发布说明, /存档数据版本：`9`/);
  assert.match(闭环记录, /标签指向提交：`7e03a238de8d541b502bb956e1e8d90003f8a8dd`/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});
