/* eslint-disable import-x/no-nodejs-modules -- PLAY-049：二稿失败不得用普通替代正文签发《不必停》门锁事实。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '301' } });
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const engine = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const c1 = '【安若妍不必停提交:C1门没有锁:1】';

test('PLAY-049 C1门锁拍缺少两项即将落账的硬事实时必须失败关闭', () => {
  assert.match(
    route.安若妍不必停正文越拍原因(c1, '安若妍站在卧室边看着玩家，没有继续谈之后的安排。'),
    /前门|未反锁|卧室门|半开/,
  );
  assert.match(
    route.安若妍不必停正文越拍原因(c1, '玩家确认前门没有反锁，两人随后走向卧室。'),
    /卧室门|半开/,
  );
  assert.match(
    route.安若妍不必停正文越拍原因(c1, '卧室门保持半开，安若妍没有把玩家的衣物收起来。'),
    /前门|未反锁/,
  );
});

test('PLAY-049 C1门锁拍只有明确演出前门未反锁和卧室门半开才可签发', () => {
  const good = '玩家亲手确认前门没有反锁。安若妍明知丈夫能正常进入，仍让卧室门保持半开，两人走进卧室，但没有开始后续亲密。';
  assert.equal(route.安若妍不必停正文越拍原因(c1, good), '');
});

test('PLAY-049 否定或相反门锁事实不能靠关键词骗过C1完成门', () => {
  assert.notEqual(
    route.安若妍不必停正文越拍原因(c1, '玩家没有确认前门是否反锁，卧室门也没有保持半开。'),
    '',
  );
  assert.notEqual(
    route.安若妍不必停正文越拍原因(c1, '玩家确认前门已经反锁，随后把卧室门彻底关好。'),
    '',
  );
});

test('PLAY-049 二稿错误汇总必须与首稿、最终提交共用《不必停》验收', () => {
  const start = engine.indexOf('const 重写节拍错误 =');
  const end = engine.indexOf("if (重写稽查.状态 === '通过'", start);
  assert.ok(start >= 0 && end > start);
  const secondAudit = engine.slice(start, end);
  assert.match(secondAudit, /安若妍不必停正文越拍原因\(本楼事件, 重写正文\)/);

  const commitStart = engine.indexOf('const 安若妍不必停票 = 解析安若妍不必停剧情事件');
  const commitEnd = engine.indexOf('const 许曼君分居票 = 解析许曼君分居剧情事件', commitStart);
  assert.ok(commitStart >= 0 && commitEnd > commitStart);
  assert.match(engine.slice(commitStart, commitEnd), /安若妍不必停正文越拍原因\(本楼事件, 正文\)/);
});

test('PLAY-049 二稿仍失败时《不必停》必须走专属失败关闭，不得进入无处罚普通兜底', () => {
  const start = engine.indexOf("if (重写稽查.状态 === '通过'");
  const fallback = engine.indexOf('// 第二次仍不可靠：普通场景本地收束为角色拒绝', start);
  assert.ok(start >= 0 && fallback > start);
  const dedicatedFailure = engine.slice(start, fallback);
  assert.match(dedicatedFailure, /安若妍不必停票/);
  assert.match(dedicatedFailure, /《不必停》.*本拍保留|《不必停》.*可重试|《不必停》当前剧情回合/);
});

test('PLAY-049 兄弟路线及H8既有正反例不因C1事实门被放宽或误伤', () => {
  const h8 = '【安若妍不必停提交:H8关门:1】';
  assert.match(
    route.安若妍不必停正文越拍原因(h8, '玩家继续，江辰站在门边观看，最后关上卧室门。'),
    /参与者、观众或打断者/,
  );
  assert.equal(
    route.安若妍不必停正文越拍原因(h8, '玩家继续刚才的动作，没有停下。江辰不观看也不加入，只从外面把卧室门关好。'),
    '',
  );
});
