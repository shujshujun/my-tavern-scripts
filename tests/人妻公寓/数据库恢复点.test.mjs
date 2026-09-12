/* eslint-disable import-x/no-nodejs-modules -- Persistent JSON journal regression. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const api = require('../../src/人妻公寓/脚本/游戏逻辑/数据库恢复点.ts');
const names = ['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹', '纪要表'];
function data() {
  return {
    mate: { type: 'chatSheets', version: 1 },
    ...Object.fromEntries(
      names.map((name, i) => [`sheet_${i}`, { name, content: [['row_id', '内容']], sourceData: { ddl: '' } }]),
    ),
  };
}
const anchor = floor => ({ 聊天: 'A', 楼层: floor, 分支: `branch-${floor}` });

test('差量记录保留新增、修改、删除和空值；JSON落盘后精确恢复历史点', () => {
  const first = data();
  first.sheet_0.content.push(['1', '第一件事']);
  let journal = api.保存数据库恢复点记录(null, anchor(2), first);
  const second = structuredClone(first);
  second.sheet_0.content[1][1] = '已改写';
  second.sheet_1.content.push(['2', null]);
  journal = api.保存数据库恢复点记录(journal, anchor(4), second);
  const third = structuredClone(second);
  third.sheet_0.content.pop();
  delete third.sheet_1.sourceData.ddl;
  journal = JSON.parse(JSON.stringify(api.保存数据库恢复点记录(journal, anchor(6), third)));
  for (const [floor, expected] of [
    [2, first],
    [4, second],
    [6, third],
  ]) {
    assert.deepEqual(api.选择数据库恢复点(journal, 'A', floor, n => `branch-${n}`).数据, expected);
  }
});
test('同楼多次填表保留版本，回档后新分支不引用未来差量', () => {
  const first = data();
  let journal = api.保存数据库恢复点记录(null, anchor(2), first);
  const changed = data();
  changed.sheet_0.content.push(['1', '最新']);
  journal = api.保存数据库恢复点记录(journal, anchor(2), changed);
  assert.equal(journal.点.length, 2);
  const exact = api.选择数据库恢复点(
    JSON.parse(JSON.stringify(journal)),
    'A',
    2,
    n => `branch-${n}`,
    journal.点[0].完整性,
  );
  assert.deepEqual(exact.数据, first);
  assert.equal(exact.保留记录.点.length, 1);
  journal = api.保存数据库恢复点记录(journal, anchor(4), first);
  const selected = api.选择数据库恢复点(journal, 'A', 2, n => `branch-${n}`);
  assert.equal(selected.保留记录.点.length, 2);
  journal = api.保存数据库恢复点记录(selected.保留记录, { ...anchor(4), 分支: 'new-4' }, changed);
  assert.equal(api.选择数据库恢复点(journal, 'A', 4, n => (n === 4 ? 'branch-4' : `branch-${n}`)).楼层, 2);
});
test('缺失历史不造旧档；跨聊天、篡改、无版本和坏差量全部拒绝', () => {
  const journal = api.保存数据库恢复点记录(null, anchor(25), data());
  assert.equal(
    api.选择数据库恢复点(journal, 'A', 24, n => `branch-${n}`),
    null,
  );
  assert.throws(() => api.选择数据库恢复点(journal, 'B', 25, n => `branch-${n}`));
  const corrupt = structuredClone(journal);
  corrupt.点[0].楼层 = 1;
  assert.throws(() => api.选择数据库恢复点(corrupt, 'A', 25, n => `branch-${n}`));
  assert.throws(() => api.保存数据库恢复点记录(null, anchor(25), {}));
});
test('连续追加行的历史规模接近增量，不为每回合存整表', () => {
  const current = data();
  let journal = null,
    fullBytes = 0;
  for (let i = 0; i < 150; i++) {
    current.sheet_0.content.push([String(i), '记录内容'.repeat(30)]);
    journal = api.保存数据库恢复点记录(journal, anchor(i), current);
    fullBytes += JSON.stringify(current).length;
  }
  assert.ok(JSON.stringify(journal).length < fullBytes / 8);
  assert.deepEqual(api.选择数据库恢复点(journal, 'A', 149, n => `branch-${n}`).数据, current);
});
