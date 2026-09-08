/* eslint-disable import-x/no-nodejs-modules -- 真实票据、演员投影及完整固定回合入口。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { witness, route } from './helpers/离婚事实验收环境.mjs';
import { host, assertReleased } from './helpers/离婚主入口环境.mjs';
const require = createRequire(import.meta.url);
const snapshot = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');

for (const choice of ['当着赵国强牵住她', '等赵国强离开再抱她']) {
  test(`PLAY013 ${choice}：关联资料与实际在场分别校验`, () => {
    const f = witness(choice);
    const present = choice === '当着赵国强牵住她' ? ['201'] : [];
    const actors = snapshot.解析事件角色绑定(f.event, f.data);
    assert.deepEqual(actors.在场夫, present);
    assert.deepEqual(actors.关联夫, ['201']);
    assert.equal(route.许曼君离婚剧情演员错误(f.event, ['201'], present), '');
    assert.notEqual(route.许曼君离婚剧情演员错误(f.event, ['201'], ['102']), '');
    assert.notEqual(route.许曼君离婚剧情演员错误(f.event, ['102'], present), '');
    const missing = f.event.replace(/【事件(?:在场夫|关联夫):[^】]+】/gu, '');
    assert.notEqual(route.许曼君离婚剧情演员错误(missing, ['201'], present), '', '姓名提及不能代替明确丈夫身份绑定');
  });
  test(`PLAY013 ${choice}：完整引擎通过模型与正式保存后才确认办理`, async () => {
    const e = host({ choice });
    assert.equal(await e.run(), true, e.warnings.join('\n'));
    assertReleased(e);
    assert.equal(e.requests.length, 1);
    assert.equal(e.commits, 1);
    assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, true);
    assert.equal(e.read().系统._许曼君离婚.阶段, '待归档旧钥匙');
    assert.ok(e.saves.length > 0);
  });
}
test('PLAY013 旧当面见证票按当前有效选择恢复在场，等待票仍只关联资料', () => {
  const f = witness();
  const legacy = f.event.replace('【事件在场夫:201】', '【事件关联夫:201】');
  assert.deepEqual(snapshot.解析事件角色绑定(legacy, f.data).在场夫, ['201']);
  f.data.系统._绝对时段++;
  assert.deepEqual(snapshot.解析事件角色绑定(legacy, f.data).在场夫, [], '失效旧票不能取得当前在场资格');
  const waiting = '【事件在场妻:201】【事件关联夫:201】【许曼君离婚提交:L1:待办理:3:1:-】';
  assert.equal(route.许曼君离婚剧情演员错误(waiting, ['201'], []), '');
  assert.notEqual(route.许曼君离婚剧情演员错误(waiting, ['201'], ['201']), '');
});
