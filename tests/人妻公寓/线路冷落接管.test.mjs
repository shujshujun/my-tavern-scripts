/* eslint-disable import-x/no-nodejs-modules -- Node-only lifecycle regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 门牌列表, 许曼君离婚场景ID } = require('../../src/人妻公寓/stageConfig.ts');
const cold = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');
const risk = require('../../src/人妻公寓/脚本/游戏逻辑/丈夫线路风险策略.ts');
const guard = require('../../src/人妻公寓/脚本/游戏逻辑/守护系统.ts');

function fresh() {
  const data = Schema.parse({ 户: Object.fromEntries(门牌列表.map(m => [m, 创建户节点(0)])) });
  data.系统._母亲入列 = true;
  data.系统._绝对时段 = 60;
  for (const h of Object.values(data.户)) {
    h.妻.当前阶段 = 5;
    h.妻.堕落值 = 100;
    h.妻._成长账.上次有效成长钟楼 = 0;
    h.妻.当前情绪 = '记得上次没有说完的话';
  }
  return data;
}
const starters = {
  '101': d => { d.系统._家庭计划.阶段 = '待投资料'; },
  '102': d => { d.系统._第二机位.阶段 = '待对饮'; },
  '201': d => { Object.assign(d.系统._许曼君分居, { 阶段: '待初谈', 当前场景: '第一幕初谈', 当前拍: 2 }); },
  '202': d => { d.系统._不再留门.道具已使用 = true; },
  '301': d => { d.系统._安若妍不必停.阶段 = '等待预约夜'; },
  '302': d => { d.系统._回国.阶段 = '已完成'; },
};

for (const m of 门牌列表) {
  test(`${m}承接接管停止旧冷落生产、预警和余波方向，保留记录及情绪，回档恢复`, () => {
    const data = fresh();
    Object.assign(data.户[m].妻._冷落余波, { 状态: '安抚中', 需安抚楼: 4, 已安抚楼: 1 });
    const beforeRoute = lodash.cloneDeep(data);
    starters[m](data);
    const preserved = lodash.cloneDeep(data.户[m].妻);
    assert.equal(risk.角色线路无关打断已停用(data, m), true);
    assert.equal(cold.余波有冻结效力(m, data.户[m].妻, true, data), false);
    assert.equal(cold.计算妻冷落消息档(data, m), 0);
    assert.equal(cold.选择自然在场余波目标(data, [m]), null);
    assert.equal(cold.列出冷落预警候选(data).some(x => x.门牌 === m), false);
    assert.equal(cold.冷落语义指纹(data, m).余波状态, '无');
    const result = cold.结算全楼冷落(data).find(x => x.门牌 === m);
    assert.equal(result.参与, false);
    assert.deepEqual(data.户[m].妻, preserved, '退休的记录保留，日常情绪不改成和解');
    assert.equal(cold.余波有冻结效力(m, beforeRoute.户[m].妻, true, beforeRoute), true);
    assert.equal(cold.选择自然在场余波目标(beforeRoute, [m]), m);
    const refreshed = Schema.parse(data);
    assert.equal(cold.余波有冻结效力(m, refreshed.户[m].妻, true, refreshed), false);
  });
}

test('购买不提前接管冷落；未关联户继续下降；合法成长不再被退休余波拍回', () => {
  const data = fresh();
  data.系统._家庭计划.阶段 = '待安装';
  data.系统._第二机位.阶段 = '待门缝';
  data.系统._安若妍不必停.阶段 = '已购买';
  assert.equal(cold.计算妻冷落消息档(data, '101'), 4);
  starters['101'](data);
  data.户['101'].妻._冷落余波.状态 = '待诉苦';
  const next = lodash.cloneDeep(data);
  next.户['101'].妻.堕落值 -= 1;
  assert.equal(cold.冻结全楼余波堕落(data, next).includes('101'), false);
  assert.equal(next.户['101'].妻.堕落值, 99);
  const results = cold.结算全楼冷落(next);
  assert.equal(results.find(x => x.门牌 === '101').参与, false);
  assert.ok(results.find(x => x.门牌 === '201').实际下降 > 0);
});

test('只有201正式完成ID的旧档也退出旧风险，缺少路线数据不误判为已开始', () => {
  const data = fresh();
  data.系统._已完成特殊场景.push(许曼君离婚场景ID);
  assert.equal(risk.角色线路无关打断已停用(data, '201'), true);
  const minimal = { 户: { 101: { 妻: {} } }, 系统: {} };
  assert.equal(risk.角色线路无关打断已停用(minimal, '101'), false);
});

test('可信快照决定冻结资格，AI伪造路线完成不能解冻；真实开线保留正常数值上限', () => {
  const old = fresh();
  old.户['101'].妻.堕落值 = 95;
  old.户['101'].妻._冷落余波.状态 = '待诉苦';
  const forged = lodash.cloneDeep(old);
  starters['101'](forged);
  forged.户['101'].妻.堕落值 = 94;
  const writers = { 妻: ['101'], 夫: [], 亲密妻: ['101'] };
  guard.回滚保护字段(forged, ['101'], writers, undefined, undefined, old);
  assert.equal(forged.户['101'].妻.堕落值, 95);
  assert.equal(risk.角色线路无关打断已停用(forged, '101'), false);
  starters['101'](old);
  const actual = lodash.cloneDeep(old);
  actual.户['101'].妻.堕落值 = 94;
  guard.回滚保护字段(actual, ['101'], writers, undefined, undefined, old);
  assert.equal(actual.户['101'].妻.堕落值, 94);
  const excessive = lodash.cloneDeep(old);
  excessive.户['101'].妻.堕落值 = 100;
  guard.回滚保护字段(excessive, ['101'], writers, undefined, undefined, old);
  assert.equal(excessive.户['101'].妻.堕落值, 95, '退出冷落不放宽单回合上限');
  const grown = lodash.cloneDeep(old);
  grown.户['101'].妻.堕落值 = 96;
  assert.equal(cold.记录全楼有效成长(old, grown).find(x => x.门牌 === '101').有效, true);
});

test('多人同场由线路演员持有前台，其他角色的旧诉苦候选不抢占', () => {
  const data = fresh();
  starters['101'](data);
  data.户['201'].妻._冷落余波.状态 = '待诉苦';
  assert.equal(cold.选择自然在场余波目标(data, ['201']), '201');
  assert.equal(cold.选择自然在场余波目标(data, ['101', '201']), null);
});

test('即使开线前后均无冷落预警，手机真实指纹比较仍拒绝旧批次', () => {
  const ts = require('typescript');
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/冷落预警.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('cold.ts', source, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(item => ts.isFunctionDeclaration(item) && item.name?.text === '冷落指纹相同');
  const code = ts.transpileModule(node.getText(ast).replace(/^export /u, ''), {}).outputText;
  const compare = new Function(`${code}; return 冷落指纹相同;`)();
  const data = fresh();
  data.系统._绝对时段 = 0;
  const before = cold.冷落语义指纹(data, '101');
  starters['101'](data);
  const after = cold.冷落语义指纹(data, '101');
  assert.equal(before.当前档, 0);
  assert.equal(after.当前档, 0);
  assert.equal(compare(before, after), false);
  assert.equal(compare(after, cold.冷落语义指纹(Schema.parse(data), '101')), true);
});
