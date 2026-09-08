/* eslint-disable import-x/no-nodejs-modules -- 完整固定引擎的失败、取消与重试，不连接玩家宿主。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, assertReleased, badBody, goodBody } from './helpers/离婚主入口环境.mjs';

for (const failure of ['invalid-body', 'provider-error', 'save-error', 'cancelled']) {
  test(`PLAY013 ${failure}：不签发法律完成，解除占用后可从当前票重试`, async () => {
    const e = host(failure === 'invalid-body' ? { body: badBody } : failure === 'save-error' ? { saveFail: true } : {});
    if (failure === 'provider-error') e.provider = async () => { throw new Error('controlled provider error'); };
    if (failure === 'cancelled') e.provider = async () => {
      e.main.取消本回合();
      return goodBody(e.choice);
    };
    assert.equal(await e.run(), false);
    assertReleased(e);
    assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, false);
    assert.equal(e.read().系统._许曼君离婚.阶段, e.initial.data.系统._许曼君离婚.阶段);
    assert.equal(e.trace.some(item => item.name === '人妻公寓:许曼君离婚CG'), false);
    e.options.saveFail = false;
    e.options.body = goodBody(e.choice);
    e.provider = null;
    assert.equal(await e.retry(), true, e.warnings.join('\n'));
    assertReleased(e);
    assert.equal(e.read().系统._许曼君离婚.法律离婚已成立, true);
    assert.equal(e.trace.filter(item => item.name === '人妻公寓:许曼君离婚CG').length, 1);
  });
}
