/* eslint-disable import-x/no-nodejs-modules -- Node-only historical release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91.2 历史发布门禁仍能精确识别原标签和客户端标记', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91.2', 标签: 'rq0.91.2' }), 'RQGY_GAME_VERSION:0.91.2');
  assert.equal(
    校验客户端构建版本('RQGY_GAME_VERSION:0.91.2', '0.91.2'),
    'RQGY_GAME_VERSION:0.91.2',
  );
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91', '0.91.2'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91 RQGY_GAME_VERSION:0.91.2', '0.91.2'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91.2', 标签: 'rq0.91' }), /不一致/);
});

test('0.91.2 历史发布说明、闭环记录和数据版本保持冻结', () => {
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.2_2026-09-09.md');
  const 闭环记录 = 读('src/人妻公寓/正式发布闭环_v0.91.2_2026-09-09.md');
  assert.match(发布说明, /发布标签：`rq0\.91\.2`/);
  assert.match(发布说明, /角色卡版本：`0\.91\.2`/);
  assert.match(发布说明, /存档数据版本：`9`/);
  assert.match(闭环记录, /正式产物提交：`8bd572bf6d9b6a9daf9525ee0193a64fd73ef212`/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.91.2 的内部删楼跨界面时间线热修继续保留', () => {
  const 数据库桥 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  assert.match(数据库桥, /已有共享栅栏覆盖时不重标/);
  assert.match(
    数据库桥,
    /MESSAGE_DELETED[\s\S]{0,500}标记数据库时间线将变更\(当前末楼\(\), '删除消息', \{ 已有共享栅栏覆盖时不重标: true \}\)/,
  );
  assert.match(数据库桥, /即使共享栅栏已经由另一个 iframe 建立，本实例自己的异步写世代仍必须单独作废/);
});
