/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema } = require('../../src/人妻公寓/schema.ts');
const { 空父亲通话 } = require('../../src/人妻公寓/脚本/游戏逻辑/经济系统.ts');
const {
  母亲视频通话模式,
  读取母亲视频通话终幕,
  母亲视频通话待接听,
  母亲视频通话活动中,
  母亲视频通话已接通,
  是母亲视频父亲通话,
  母亲视频通话可以发送,
  母亲视频通话可以发送结束告别,
  母亲视频通话可以提交最终回答,
  读取母亲视频通话未登记父亲回复,
  读取母亲视频通话未登记最终回答,
  预约母亲视频通话终幕,
  接听母亲视频通话终幕,
  登记母亲视频通话父亲回复,
  开始母亲视频通话现场正文,
  完成母亲视频通话现场正文,
  标记母亲视频通话现场正文失败,
  请求结束母亲视频通话,
  登记玩家最终回答,
  推进母亲视频通话终幕CG,
  登记母亲视频通话父亲挂断,
  完成母亲视频通话终幕,
} = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话系统.ts');
const { 母亲视频通话终幕CG } = require('../../src/人妻公寓/脚本/游戏逻辑/母亲视频通话CG语义.ts');

function 新数据() {
  return Schema.parse({ 系统: { _绝对时段: 88 } });
}

function 写入父亲一轮(data, 玩家说, 父亲说 = '这件事你自己拿稳。') {
  const 通话 = data.系统._父亲通话;
  通话.记录.push({ 谁: '我', 文: 玩家说 }, { 谁: '父', 文: 父亲说 });
  通话.待回复 = { 序号: 0, 玩家说: '' };
  return 父亲说;
}

test('旧档缺少新字段时Schema幂等补齐，普通父亲电话模式仍为空', () => {
  const first = 新数据();
  const second = Schema.parse(first);
  assert.deepEqual(second, first);
  assert.equal(first.系统._父亲通话.模式, '');
  assert.deepEqual(空父亲通话(), first.系统._父亲通话);
  assert.equal(first.系统._母亲视频通话终幕.状态, '');
  assert.equal(first.系统._母亲视频通话终幕.现场正文请求世代, 0);
  assert.deepEqual(first.系统._母亲视频通话终幕.现场正文记录, []);
});

test('预约只建立待接听票，接听后才建立专属父亲视频通话', () => {
  const data = 新数据();
  assert.equal(预约母亲视频通话终幕(data, 'mother-ending-1', 42).成功, true);
  assert.equal(母亲视频通话待接听(data), true);
  assert.equal(母亲视频通话活动中(data), true);
  assert.equal(母亲视频通话已接通(data), false);
  assert.equal(data.系统._父亲通话.标识, '');
  assert.equal(data.系统._母亲视频通话终幕.当前CG, 'MVC-CG-001-draw1');

  assert.equal(接听母亲视频通话终幕(data).成功, true);
  assert.equal(母亲视频通话已接通(data), true);
  assert.equal(是母亲视频父亲通话(data), true);
  assert.equal(data.系统._父亲通话.模式, 母亲视频通话模式);
  assert.equal(data.系统._父亲通话.待回复.玩家说, '(视频通话接通，父亲先开口)');
});

test('父亲开场白不推进CG，真实玩家往返才推进并冻结现场正文', () => {
  const data = 新数据();
  预约母亲视频通话终幕(data, 'mother-ending-2', 42);
  接听母亲视频通话终幕(data);

  const 开场 = 登记母亲视频通话父亲回复(data, '(视频通话接通，父亲先开口)', '先把交接的事再对一遍。');
  assert.equal(开场.成功, false);
  assert.equal(data.系统._母亲视频通话终幕.当前CG, 'MVC-CG-001-draw1');

  const 玩家说 = '账本已经放好了。';
  const 父亲说 = 写入父亲一轮(data, 玩家说);
  const 第一轮 = 登记母亲视频通话父亲回复(data, 玩家说, 父亲说);
  assert.equal(第一轮.成功, true);
  assert.equal(第一轮.序号, 1);
  assert.equal(第一轮.CG.id, 'MVC-CG-012-draw1@001-1');
  assert.equal(data.系统._母亲视频通话终幕.状态, '等待现场正文');
  assert.equal(母亲视频通话可以发送(data), false);

  const 开始 = 开始母亲视频通话现场正文(data, 第一轮.标识, 第一轮.序号);
  assert.equal(开始.成功, true);
  assert.equal(开始.请求世代, 1);
  assert.equal(
    完成母亲视频通话现场正文(data, 第一轮.标识, 第一轮.序号, 开始.请求世代, '母亲仍在镜头裁切线下抬眼看着你。').成功,
    true,
  );
  assert.equal(data.系统._母亲视频通话终幕.状态, '通话中');
  assert.equal(data.系统._母亲视频通话终幕.已完成现场正文序号, 1);
  assert.equal(data.系统._母亲视频通话终幕.现场正文记录.length, 1);
  assert.equal(母亲视频通话可以发送(data), true);
});

test('父亲气泡落库后刷新会锁住下一次发送，并从唯一缺口恢复同帧现场票', () => {
  const data = 新数据();
  预约母亲视频通话终幕(data, 'mother-ending-recover-reply', 42);
  接听母亲视频通话终幕(data);
  data.系统._父亲通话.待回复 = { 序号: 0, 玩家说: '' };

  const 玩家说 = '你放心，我会把这里管好。';
  const 父亲说 = 写入父亲一轮(data, 玩家说, '嗯，别只嘴上说。');
  assert.deepEqual(读取母亲视频通话未登记父亲回复(data), { 玩家说, 父亲说 });
  assert.equal(母亲视频通话可以发送(data), false);

  const 恢复票 = 登记母亲视频通话父亲回复(data, 玩家说, 父亲说);
  assert.equal(恢复票.成功, true);
  assert.equal(恢复票.序号, 1);
  assert.equal(读取母亲视频通话未登记父亲回复(data), null);
  assert.equal(登记母亲视频通话父亲回复(data, 玩家说, 父亲说).成功, false);
});

test('页面刷新往返保留CG、聊天、待现场正文票、请求世代与同帧失败状态', () => {
  const data = 新数据();
  预约母亲视频通话终幕(data, 'mother-ending-refresh', 42);
  接听母亲视频通话终幕(data);
  data.系统._父亲通话.待回复 = { 序号: 0, 玩家说: '' };
  const 玩家说 = '交接清单我会再核一遍。';
  const 父亲说 = 写入父亲一轮(data, 玩家说, '别漏了押金和维修账。');
  const 票 = 登记母亲视频通话父亲回复(data, 玩家说, 父亲说);
  const 冻结CG = data.系统._母亲视频通话终幕.当前CG;

  let restored = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.equal(restored.系统._母亲视频通话终幕.状态, '等待现场正文');
  assert.equal(restored.系统._母亲视频通话终幕.当前CG, 冻结CG);
  assert.equal(restored.系统._母亲视频通话终幕.待现场正文序号, 票.序号);
  assert.deepEqual(restored.系统._父亲通话.记录.slice(-2), [
    { 谁: '我', 文: 玩家说 },
    { 谁: '父', 文: 父亲说 },
  ]);

  const 开始 = 开始母亲视频通话现场正文(restored, 票.标识, 票.序号);
  restored = Schema.parse(JSON.parse(JSON.stringify(restored)));
  assert.equal(restored.系统._母亲视频通话终幕.状态, '正文生成中');
  assert.equal(restored.系统._母亲视频通话终幕.现场正文请求世代, 开始.请求世代);
  assert.equal(
    标记母亲视频通话现场正文失败(restored, 票.标识, 票.序号, 开始.请求世代, '刷新中断，需要同帧重试。').成功,
    true,
  );
  restored = Schema.parse(JSON.parse(JSON.stringify(restored)));
  assert.equal(restored.系统._母亲视频通话终幕.状态, '正文失败');
  assert.equal(restored.系统._母亲视频通话终幕.当前CG, 冻结CG);
  assert.equal(restored.系统._母亲视频通话终幕.现场正文失败, '刷新中断，需要同帧重试。');
});

test('失败重试保持同一CG，并用请求世代拒绝旧请求迟到结果', () => {
  const data = 新数据();
  预约母亲视频通话终幕(data, 'mother-ending-3', 42);
  接听母亲视频通话终幕(data);
  data.系统._父亲通话.待回复 = { 序号: 0, 玩家说: '' };
  const 玩家说 = '我会照顾好家里。';
  const 父亲说 = 写入父亲一轮(data, 玩家说);
  const 票 = 登记母亲视频通话父亲回复(data, 玩家说, 父亲说);
  const 冻结CG = data.系统._母亲视频通话终幕.当前CG;

  const 首次 = 开始母亲视频通话现场正文(data, 票.标识, 票.序号);
  assert.equal(标记母亲视频通话现场正文失败(data, 票.标识, 票.序号, 首次.请求世代, '模型没有返回完整正文').成功, true);
  assert.equal(data.系统._母亲视频通话终幕.状态, '正文失败');
  assert.equal(data.系统._母亲视频通话终幕.当前CG, 冻结CG);

  const 重试 = 开始母亲视频通话现场正文(data, 票.标识, 票.序号);
  assert.equal(重试.请求世代, 2);
  assert.equal(完成母亲视频通话现场正文(data, 票.标识, 票.序号, 首次.请求世代, '旧请求迟到正文。').成功, false);
  assert.equal(完成母亲视频通话现场正文(data, 票.标识, 票.序号, 重试.请求世代, '重试后的现场正文。').成功, true);
  assert.equal(data.系统._母亲视频通话终幕.当前CG, 冻结CG);
  assert.equal(data.系统._母亲视频通话终幕.现场正文记录.length, 1);
});

test('主循环耗尽后只回到005，不会重新播放接通入场', () => {
  const data = 新数据();
  预约母亲视频通话终幕(data, 'mother-ending-loop', 42);
  接听母亲视频通话终幕(data);
  data.系统._父亲通话.待回复 = { 序号: 0, 玩家说: '' };
  data.系统._母亲视频通话终幕.当前CG = 'MVC-CG-024-draw4';

  const 玩家说 = '再说一会。';
  const 父亲说 = 写入父亲一轮(data, 玩家说);
  const 票 = 登记母亲视频通话父亲回复(data, 玩家说, 父亲说);
  assert.equal(票.CG.id, 'MVC-CG-005-reused');
  assert.notEqual(票.CG.id, 'MVC-CG-001-draw1');
});

test('结束衔接中父亲最后一句若只落了气泡，刷新恢复前不能再发第二次告别', () => {
  const data = 新数据();
  预约母亲视频通话终幕(data, 'mother-ending-recover-farewell', 42);
  接听母亲视频通话终幕(data);
  data.系统._父亲通话.待回复 = { 序号: 0, 玩家说: '' };
  assert.equal(请求结束母亲视频通话(data).成功, true);
  assert.equal(母亲视频通话可以发送结束告别(data), true);

  const 告别 = '爸，你先去登机。';
  const 最终确认 = '楼交给你我放心。家里也多上点心，照顾好你妈。';
  写入父亲一轮(data, 告别, 最终确认);
  assert.deepEqual(读取母亲视频通话未登记父亲回复(data), { 玩家说: 告别, 父亲说: 最终确认 });
  assert.equal(母亲视频通话可以发送结束告别(data), false);

  const 恢复票 = 登记母亲视频通话父亲回复(data, 告别, 最终确认);
  assert.equal(恢复票.成功, true);
  assert.equal(data.系统._母亲视频通话终幕.最终交接已出现, true);
});

test('结束衔接、最终回答、挂断与七张终幕必须全部完成后才能收口', () => {
  const data = 新数据();
  预约母亲视频通话终幕(data, 'mother-ending-final', 42);
  接听母亲视频通话终幕(data);
  data.系统._父亲通话.待回复 = { 序号: 0, 玩家说: '' };
  data.系统._母亲视频通话终幕.当前CG = 'MVC-CG-023-draw2';

  assert.equal(请求结束母亲视频通话(data).成功, true);
  assert.equal(data.系统._母亲视频通话终幕.当前CG, 'MVC-CG-025-draw2');
  assert.equal(data.系统._母亲视频通话终幕.状态, '结束衔接');
  assert.equal(母亲视频通话可以发送结束告别(data), true);

  const 告别 = '爸，你去登机吧。';
  const 最终确认 = '楼交给你我放心。家里也多上点心，照顾好你妈。';
  写入父亲一轮(data, 告别, 最终确认);
  const 票 = 登记母亲视频通话父亲回复(data, 告别, 最终确认);
  assert.equal(票.成功, true);
  assert.equal(data.系统._母亲视频通话终幕.最终交接已出现, true);
  assert.equal(data.系统._母亲视频通话终幕.当前CG, 'MVC-CG-025-draw2');

  const 开始 = 开始母亲视频通话现场正文(data, 票.标识, 票.序号);
  assert.equal(
    完成母亲视频通话现场正文(data, 票.标识, 票.序号, 开始.请求世代, '母亲在深喉位置听完了最后交接确认。').成功,
    true,
  );
  assert.equal(data.系统._母亲视频通话终幕.当前CG, 母亲视频通话终幕CG[0].id);
  assert.equal(data.系统._母亲视频通话终幕.状态, '等待最终回答');

  assert.equal(母亲视频通话可以提交最终回答(data), true);
  const 最终回答 = '我知道了，爸。';
  data.系统._父亲通话.记录.push({ 谁: '我', 文: 最终回答 });
  assert.equal(读取母亲视频通话未登记最终回答(data), 最终回答);
  assert.equal(母亲视频通话可以提交最终回答(data), false);
  assert.equal(登记玩家最终回答(data, 最终回答).成功, true);
  assert.equal(读取母亲视频通话未登记最终回答(data), null);
  assert.equal(data.系统._母亲视频通话终幕.状态, '终幕中');
  assert.equal(data.系统._母亲视频通话终幕.父亲已挂断, false);
  assert.equal(登记母亲视频通话父亲挂断(data).成功, false);
  assert.equal(完成母亲视频通话终幕(data).成功, false);

  while (data.系统._母亲视频通话终幕.终幕CG序号 < 4) {
    assert.equal(推进母亲视频通话终幕CG(data).成功, true);
    assert.equal(data.系统._母亲视频通话终幕.父亲已挂断, false);
  }
  assert.equal(推进母亲视频通话终幕CG(data).成功, true);
  assert.equal(data.系统._母亲视频通话终幕.终幕CG序号, 5);
  assert.equal(data.系统._母亲视频通话终幕.父亲已挂断, true);
  while (data.系统._母亲视频通话终幕.终幕CG序号 < 母亲视频通话终幕CG.length) {
    assert.equal(推进母亲视频通话终幕CG(data).成功, true);
  }
  assert.equal(登记母亲视频通话父亲挂断(data).成功, true);
  assert.equal(完成母亲视频通话终幕(data).成功, true);
  assert.equal(data.系统._母亲视频通话终幕.状态, '已完成');
  assert.equal(data.系统._父亲通话.状态, '收尾中');
});

test('另一通普通父亲电话存在时，预约失败且不污染旧状态', () => {
  const data = 新数据();
  data.系统._父亲通话 = { ...空父亲通话(), 标识: 'ordinary', 状态: '通话中', 期: 2 };
  const before = structuredClone(data.系统._父亲通话);
  const 结果 = 预约母亲视频通话终幕(data, 'blocked', 42);
  assert.equal(结果.成功, false);
  assert.deepEqual(data.系统._父亲通话, before);
  assert.equal(读取母亲视频通话终幕(data), null);
});
