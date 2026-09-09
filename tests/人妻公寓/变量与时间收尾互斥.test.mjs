/* eslint-disable import-x/no-nodejs-modules -- source-order lifecycle regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 回合源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 接线源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function 截取(源码, 开始, 结束) {
  const 起 = 源码.indexOf(开始);
  const 止 = 源码.indexOf(结束, 起 + 开始.length);
  assert.ok(起 >= 0, `缺少开始锚：${开始}`);
  assert.ok(止 > 起, `缺少结束锚：${结束}`);
  return 源码.slice(起, 止);
}

test('变量重生成先清事务并释放前台租约，再向客户端广播结束', () => {
  const 函数 = 截取(
    回合源,
    'export async function 重新生成最近回合变量()',
    '/** 楼层尾部 + 本次行动',
  );
  const 已激活 = 函数.indexOf('变量重生成事务 = 事务;');
  const 最终收口 = 函数.lastIndexOf('} finally {');
  const 清事务 = 函数.indexOf('变量重生成事务 = null', 最终收口);
  const 释放租约 = 函数.indexOf('前台租约.释放()', 最终收口);
  const 广播结束 = 函数.indexOf("eventEmit('人妻公寓:变量重生成结束', 结束载荷)", 最终收口);

  assert.ok(已激活 >= 0 && 最终收口 > 已激活);
  assert.equal(
    函数.slice(已激活, 最终收口).includes("eventEmit('人妻公寓:变量重生成结束'"),
    false,
    '运行事务仍持有前台租约时不得提前解锁客户端',
  );
  assert.ok(清事务 > 最终收口 && 清事务 < 释放租约);
  assert.ok(释放租约 < 广播结束, '结束事件必须发生在共享前台槽释放之后');
});

test('回合后手机节拍由真实空闲调度器统一接管', () => {
  const 调度接线 = 截取(
    接线源,
    'const 空闲后手机节拍 = 创建空闲手机节拍调度器',
    '// 数据库公开 table-update 回调',
  );
  for (const 门 of [
    '_时间推进中',
    '回合进行中()',
    'MVU操作进行中()',
    '脚本写入中',
    '时间事务阻止普通写入()',
    '前台生成租约持有中()',
    '手机生成租约持有中()',
    '正文租约生效中()',
    '隔离事件进行中()',
    '手机节拍进行中()',
    '手机AI生成中()',
  ]) {
    assert.ok(调度接线.includes(门), `空闲调度缺少运行期门：${门}`);
  }

  const 手机监听 = 截取(
    接线源,
    "eventOn('人妻公寓:请求手机补拍'",
    "eventOn('人妻公寓:布设摄像头'",
  );
  assert.match(手机监听, /eventOn\('人妻公寓:请求手机补拍', 空闲后手机节拍\.请求\)/);
  assert.match(手机监听, /空闲后手机节拍\.请求\(\)/);
  assert.doesNotMatch(手机监听, /queueMicrotask\(\(\) => void 手机节拍\(\)\)/);
  assert.doesNotMatch(手机监听, /void 手机节拍\(\)/);
});

test('推进与撤销时间在建立时间事务前拒绝仍在运行的手机拍', () => {
  const 推进 = 截取(接线源, 'function 处理时间推进(', 'function 处理撤销时间推进()');
  const 撤销 = 截取(接线源, 'function 处理撤销时间推进()', "eventOn('人妻公寓:推进时段'");

  for (const [名称, 函数] of [['推进', 推进], ['撤销', 撤销]]) {
    const 手机门 = 函数.indexOf('手机生成租约持有中() || 手机节拍进行中() || 手机AI生成中()');
    const 建时间门 = 函数.indexOf('_时间推进中 = true;');
    assert.ok(手机门 >= 0, `${名称}入口缺少手机后台互斥`);
    assert.ok(手机门 < 建时间门, `${名称}入口必须在建立时间事务前检查手机后台`);
    assert.match(函数, /eventEmit\('人妻公寓:时间推进结束', false\)/);
  }
});
