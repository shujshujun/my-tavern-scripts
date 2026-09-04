/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
globalThis.eventEmit = () => undefined;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: async () => '已存在' },
};

const { 验收父亲模式语义 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机输出安全.ts');
const { 提交父亲通话长期记忆 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts');

function 建通话(覆盖 = {}) {
  return {
    标识: 'call-1',
    模式: '',
    状态: '收尾中',
    期: 1,
    分数段: '平淡',
    报表: '例行联络：本期无异常。',
    通牒: false,
    紧急: false,
    母亲圆场: { 触发: false, 事件ID: '', 摘要: '', 仅剧情: false },
    主题: '父子近况',
    记录: [
      { 谁: '我', 文: '最近还好。' },
      { 谁: '父', 文: '按时吃饭，别总熬夜。' },
    ],
    待回复: { 序号: 0, 玩家说: '' },
    下次回复序号: 2,
    挂断楼层: 12,
    ...覆盖,
  };
}

test('父亲台词按模式做语义验收：普通审核保留楼务能力，机场与结局后家常拒绝知情、追账和恢复审核', () => {
  assert.equal(验收父亲模式语义('把公寓账本发给我，我再看看欠租和维修。', '普通审核', ''), true);

  for (const 模式 of ['母亲机场视频', '双重继承后家常']) {
    assert.equal(验收父亲模式语义('把公寓账本发给我，我再看看欠租和维修。', 模式, ''), false);
    assert.equal(验收父亲模式语义('你和你妈那点事我早就看穿了，只是一直默许。', 模式, ''), false);
    assert.equal(验收父亲模式语义('这楼我还要重新审核，管不好就收回钥匙换人。', 模式, ''), false);
    assert.equal(
      验收父亲模式语义('账本按你现在的规矩留好就行，不用再向我逐项汇报。', 模式, '我把这月账本都整理好了。'),
      true,
      '玩家主动谈公寓后允许父亲作不恢复审批权的简短经验回应',
    );
    assert.equal(验收父亲模式语义('最近按时吃饭，身体不舒服就去看医生。', 模式, ''), true);
  }
});

test('不合格模式台词不会被当成本地兜底推进：语义验收只返回失败，调用层可保留待回复令牌重试', () => {
  assert.equal(验收父亲模式语义('', '双重继承后家常', ''), false);
  assert.equal(验收父亲模式语义('把维修和欠租逐项汇报给我。', '双重继承后家常', ''), false);
});

test('长期记忆真实提交按通话模式分类，家常与机场不再写成“父亲来电问账／很不满”', async () => {
  const 捕获 = [];
  const 写入器 = async 条目 => {
    捕获.push(条目);
    return '已写';
  };
  const 仍有效 = () => true;

  await 提交父亲通话长期记忆(
    建通话({
      标识: 'family-1',
      模式: '双重继承后家常',
      分数段: '家常',
      报表: '双重继承后家常：父亲问儿子最近饮食和身体。',
      主题: '父子饮食与身体近况',
    }),
    '第20天 晚上',
    88,
    仍有效,
    写入器,
  );
  await 提交父亲通话长期记忆(
    建通话({
      标识: 'airport-1',
      模式: '双重继承视频',
      分数段: '',
      报表: '',
      主题: '机场登机前告别',
      记录: [
        { 谁: '我', 文: '路上小心。' },
        { 谁: '父', 文: '楼交给你我放心，照顾好你妈。' },
      ],
    }),
    '第21天 下午',
    89,
    仍有效,
    写入器,
  );
  await 提交父亲通话长期记忆(
    建通话({ 标识: 'audit-1', 模式: '', 分数段: '不满', 报表: '本期应交不足。' }),
    '第22天 下午',
    90,
    仍有效,
    写入器,
  );

  assert.equal(捕获.length, 3);
  assert.equal(捕获[0].事件, '父亲低频家常联络');
  assert.match(捕获[0].结果, /父子饮食与身体近况|按时吃饭/);
  assert.doesNotMatch(`${捕获[0].事件}${捕获[0].结果}`, /问账|很不满|逐条问/);
  assert.equal(捕获[1].事件, '父亲机场视频告别');
  assert.match(捕获[1].结果, /机场|交接|告别|照顾好你妈/);
  assert.doesNotMatch(`${捕获[1].事件}${捕获[1].结果}`, /问账|很不满|逐条问/);
  assert.equal(捕获[2].事件, '父亲来电问账');
  assert.match(捕获[2].结果, /不满|问账/);
  assert.deepEqual(
    捕获.map(条目 => 条目.事件键),
    ['RQP-来电-family-1', 'RQP-来电-airport-1', 'RQP-来电-audit-1'],
  );
});
