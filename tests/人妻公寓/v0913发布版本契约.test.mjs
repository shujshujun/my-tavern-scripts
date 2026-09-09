/* eslint-disable import-x/no-nodejs-modules -- Node-only historical release contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 校验发布版本一致, 校验客户端构建版本 } from '../../src/人妻公寓/发布版本门禁.mjs';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('0.91.3 历史发布门禁仍能精确识别原标签和客户端标记', () => {
  assert.equal(校验发布版本一致({ 版本: '0.91.3', 标签: 'rq0.91.3' }), 'RQGY_GAME_VERSION:0.91.3');
  assert.equal(
    校验客户端构建版本('RQGY_GAME_VERSION:0.91.3', '0.91.3'),
    'RQGY_GAME_VERSION:0.91.3',
  );
  assert.throws(() => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.2', '0.91.3'), /不一致/);
  assert.throws(
    () => 校验客户端构建版本('RQGY_GAME_VERSION:0.91.2 RQGY_GAME_VERSION:0.91.3', '0.91.3'),
    /不一致/,
  );
  assert.throws(() => 校验发布版本一致({ 版本: '0.91.3', 标签: 'rq0.91.2' }), /不一致/);
});

test('0.91.3 历史发布说明保持冻结，当前源码与组卡入口前进到0.91.4', () => {
  const 发布说明 = 读('src/人妻公寓/发布说明_v0.91.3_2026-09-09.md');
  const 依赖版本 = 读('src/人妻公寓/脚本/游戏逻辑/依赖版本.ts');
  const 组卡 = 读('src/人妻公寓/组卡.mjs');
  assert.match(发布说明, /发布标签：`rq0\.91\.3`/);
  assert.match(发布说明, /角色卡版本：`0\.91\.3`/);
  assert.match(发布说明, /存档数据版本：`9`/);
  assert.match(依赖版本, /当前游戏版本 = '0\.91\.4'/);
  assert.match(组卡, /const 版本 = '0\.91\.4'/);
  assert.match(组卡, /const TAG = 'rq0\.91\.4'/);
  assert.match(读('src/人妻公寓/schema.ts'), /当前MVU数据版本 = 9/);
});

test('0.91.3 的单微任务手机节拍热修由0.91.4真实空闲调度兼容接管', () => {
  const 接线 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const 调度 = 读('src/人妻公寓/脚本/游戏逻辑/手机/空闲节拍调度.ts');
  const 开始 = 接线.indexOf("eventOn('人妻公寓:请求手机补拍'");
  const 结束 = 接线.indexOf("\n\n  eventOn('人妻公寓:布设摄像头'", 开始);
  assert.ok(开始 >= 0 && 结束 > 开始, '必须能定位回合完成与补拍监听');
  const 监听 = 接线.slice(开始, 结束);
  assert.match(监听, /空闲后手机节拍\.请求/);
  assert.doesNotMatch(监听, /queueMicrotask\(\(\) => void 手机节拍\(\)\)/);
  assert.match(调度, /等到运行期空闲/);
  assert.match(调度, /等待空闲期间到达的请求由即将执行的这一拍共同满足/);
});
