/* eslint-disable import-x/no-nodejs-modules -- source-order lifecycle regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 回合源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 接线源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const MVU源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts', import.meta.url), 'utf8');

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

test('普通主回合必须在事务标记与共享前台租约释放后才广播成功完成', () => {
  const 函数 = 截取(
    回合源,
    'export async function 执行回合(',
    '/**\n * 重掷本回合',
  );
  const 最终收口 = 函数.lastIndexOf('} finally {');
  const 清事务 = 函数.indexOf('标记回合事务结束();', 最终收口);
  const 释放租约 = 函数.indexOf('前台租约.释放();', 最终收口);
  const 安排数据库 = 函数.indexOf('安排数据库回合后处理({ ...待安排数据库回合后处理 });', 最终收口);
  const 广播完成 = 函数.indexOf("eventEmit('人妻公寓:回合完成'", 最终收口);

  assert.ok(最终收口 >= 0 && 清事务 > 最终收口 && 释放租约 > 清事务);
  assert.equal(
    函数.slice(0, 最终收口).includes("eventEmit('人妻公寓:回合完成'"),
    false,
    '核心已保存但运行期门尚未释放时不得提前让客户端拉取、解锁或触发后续业务',
  );
  assert.ok(释放租约 < 安排数据库, '数据库后处理只能在回合门与共享前台槽释放后排入下一任务拍');
  assert.ok(安排数据库 < 广播完成, '回合完成必须是安排后台数据库处理后的最终开放信号');
});

test('时间推进与撤销必须在持久事务、运行期租约和时间忙旗全部释放后才广播回合完成', () => {
  const 推进 = 截取(接线源, 'function 处理时间推进(', 'function 处理撤销时间推进()');
  const 撤销 = 截取(接线源, 'function 处理撤销时间推进()', "eventOn('人妻公寓:推进时段'");

  for (const [名称, 函数] of [['推进', 推进], ['撤销', 撤销]]) {
    const 外层收口 = 函数.lastIndexOf(').finally(() => {');
    const 释放租约 = 函数.lastIndexOf('释放时间写入();', 外层收口);
    const 清忙旗 = 函数.indexOf('_时间推进中 = false;', 外层收口);
    const 广播完成 = 函数.indexOf("eventEmit('人妻公寓:回合完成'", 外层收口);

    assert.ok(外层收口 >= 0 && 释放租约 >= 0 && 释放租约 < 外层收口, `${名称}必须先归还运行期时间租约`);
    assert.equal(
      函数.slice(0, 外层收口).includes("eventEmit('人妻公寓:回合完成'"),
      false,
      `${名称}不得在安全操作与时间租约仍持有时提前广播完成`,
    );
    assert.ok(清忙旗 > 外层收口 && 清忙旗 < 广播完成, `${名称}成功通知必须发生在时间忙旗清除之后`);
  }
});

test('序章、回档与重开只在回合事务门释放后广播成功', () => {
  const 项目 = [
    {
      名称: '回档',
      函数: 截取(回合源, 'export async function 回档至(', '// ============================================\n// 序章开局'),
      事件: "eventEmit('人妻公寓:回合完成'",
    },
    {
      名称: '序章',
      函数: 截取(回合源, 'export async function 开始新游戏(', '/**\n * 重开一局'),
      事件: "eventEmit('人妻公寓:回合完成'",
    },
    {
      名称: '重开',
      函数: 回合源.slice(回合源.indexOf('export async function 重开一局(')),
      事件: "eventEmit('人妻公寓:已重开'",
    },
  ];

  for (const { 名称, 函数, 事件 } of 项目) {
    const 最终收口 = 函数.lastIndexOf('} finally {');
    const 清事务 = 函数.indexOf('标记回合事务结束();', 最终收口);
    const 广播完成 = 函数.indexOf(事件, 最终收口);
    assert.ok(最终收口 >= 0 && 清事务 > 最终收口, `${名称}缺少最终回合事务收口`);
    assert.equal(函数.slice(0, 最终收口).includes(事件), false, `${名称}不得在事务仍持有时提前广播成功`);
    assert.ok(清事务 < 广播完成, `${名称}成功通知必须发生在回合事务门释放之后`);
  }
});

test('安全操作与原生时间线协调的成功通知发生在各自队列退出后', () => {
  const 换照 = 截取(
    接线源,
    "eventOn('人妻公寓:安若妍换掉动作'",
    "eventOn('人妻公寓:安若妍不必停动作'",
  );
  const 换照退出 = 换照.lastIndexOf('}).then(() => {');
  const 换照完成 = 换照.indexOf("eventEmit('人妻公寓:回合完成'", 换照退出);
  assert.ok(换照退出 >= 0 && 换照完成 > 换照退出);
  assert.equal(
    换照.slice(0, 换照退出).includes("eventEmit('人妻公寓:回合完成'"),
    false,
    '安全操作持有MVU队列时不得提前解锁客户端',
  );

  const 原生切线 = 截取(接线源, 'function 排队宿主原生时间线切换(', 'const 滑动监听 =');
  const 协调退出 = 原生切线.lastIndexOf('}).then(() => {');
  const 协调完成 = 原生切线.indexOf("eventEmit('人妻公寓:回合完成'", 协调退出);
  assert.ok(协调退出 >= 0 && 协调完成 > 协调退出);
  assert.match(原生切线.slice(协调退出), /时间线切换协调中\(\)/, '协调成功通知前必须复核全局协调门已空闲');
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

test('普通自动变量结算只在回合锁与前台生成租约释放后广播完成', () => {
  const 函数 = 截取(
    回合源,
    'export async function 执行回合(',
    '/**\n * 重掷本回合',
  );
  const 最终收口 = 函数.lastIndexOf('} finally {');
  const 结束回合锁 = 函数.indexOf('标记回合事务结束();', 最终收口);
  const 释放前台 = 函数.indexOf('前台租约.释放();', 最终收口);
  const 广播完成 = 函数.indexOf("eventEmit('人妻公寓:回合完成')", 最终收口);

  assert.ok(最终收口 >= 0 && 结束回合锁 > 最终收口);
  assert.ok(结束回合锁 < 释放前台, '先结束回合锁，再释放共享前台槽');
  assert.ok(释放前台 < 广播完成, '客户端收到完成时，普通自动变量回合的前台槽必须已经释放');
  assert.equal(
    函数.slice(0, 最终收口).includes("eventEmit('人妻公寓:回合完成')"),
    false,
    '核心状态成功但运行期租约仍在时不得提前开放客户端操作',
  );
});

test('时间推进与撤销只在安全操作及时间门收口后广播回合完成', () => {
  const 推进 = 截取(接线源, 'function 处理时间推进(', 'function 处理撤销时间推进()');
  const 撤销 = 截取(接线源, 'function 处理撤销时间推进()', "eventOn('人妻公寓:推进时段'");
  const 安全操作 = 截取(接线源, 'function 安全操作(', 'type 录像带V4操作输入');
  const MVU队列 = 截取(MVU源, 'export function 排队MVU操作', 'const 时间解析候选');

  assert.match(安全操作, /return 排队MVU操作\(async \(\) => \{/u, '安全操作必须把真实MVU队列收口Promise返回给外层');
  const 队列收口 = MVU队列.indexOf('const 已收口 = 本次.finally(() => {');
  const 释放队列门 = MVU队列.indexOf('待处理MVU操作数 = Math.max(0, 待处理MVU操作数 - 1);', 队列收口);
  const 返回已收口 = MVU队列.indexOf('return 已收口;', 释放队列门);
  assert.ok(队列收口 >= 0 && 释放队列门 > 队列收口 && 返回已收口 > 释放队列门,
    '安全操作完成Promise必须晚于MVU队列忙计数释放');

  for (const [名称, 函数, 清理记录] of [
    ['推进', 推进, '提交完成: 时间事务写口.清理'],
    ['撤销', 撤销, '提交完成: 撤销写口.清理'],
  ]) {
    const 最终收口 = 函数.lastIndexOf(').finally(() => {');
    const 清理持久事务 = 函数.indexOf(清理记录);
    const 标记已提交 = 函数.indexOf('已提交 = true;', 清理持久事务);
    const 释放时间写入 = 函数.lastIndexOf('释放时间写入();', 最终收口);
    const 释放运行期门 = 函数.indexOf('_时间推进中 = false;', 最终收口);
    const 广播时间结束 = 函数.indexOf("eventEmit('人妻公寓:时间推进结束', 已提交)", 最终收口);
    const 广播回合完成 = 函数.indexOf("eventEmit('人妻公寓:回合完成', 回合完成选项)", 最终收口);
    assert.ok(最终收口 >= 0, `${名称}缺少最外层收口`);
    assert.ok(清理持久事务 >= 0 && 清理持久事务 < 标记已提交,
      `${名称}必须先完成持久恢复记录清理，再承认双存储提交成功`);
    assert.ok(释放时间写入 >= 0 && 释放时间写入 < 最终收口,
      `${名称}必须在安全操作退出前归还内层时间写租约`);
    assert.ok(释放运行期门 > 最终收口, `${名称}必须在MVU队列Promise收口后释放时间运行期门`);
    assert.ok(释放运行期门 < 广播时间结束, `${名称}时间结束事件不能早于运行期门释放`);
    assert.ok(广播时间结束 < 广播回合完成, `${名称}回合完成必须是最终开放客户端与手机的信号`);
    assert.match(
      函数.slice(最终收口),
      /if \(已提交 && 回合完成选项\) eventEmit\('人妻公寓:回合完成', 回合完成选项\)/u,
      `${名称}只能为已提交且保留完成载荷的事务广播成功`,
    );
    assert.equal(
      函数.slice(0, 最终收口).includes("eventEmit('人妻公寓:回合完成'"),
      false,
      `${名称}核心提交阶段不得提前广播回合完成`,
    );
  }
});

test('重开清场物理删除时间恢复键，不把 null own-property 带进新局', () => {
  const 函数 = 截取(
    回合源,
    'export async function 重开一局()',
    '\n}',
  );
  assert.match(函数, /delete vars\[时间推进事务键\]/u);
  assert.doesNotMatch(函数, /_\.set\(vars, 时间推进事务键, null\)/u,
    'hasOwnProperty守卫使用的恢复键不能沿用普通过程变量置null策略');
  const 最后普通置空 = 函数.lastIndexOf('_.set(vars, 键, null);');
  const 删除 = 函数.indexOf('delete vars[时间推进事务键]');
  const 聊天写回结束 = 函数.indexOf('return vars;', 删除);
  const 出厂写回 = 函数.indexOf('const 出厂 = Schema.parse({})');
  assert.ok(最后普通置空 >= 0 && 删除 > 最后普通置空 && 删除 < 聊天写回结束,
    '恢复键必须在同一次聊天变量清场回调中物理删除');
  assert.ok(删除 < 出厂写回, '恢复键必须在新局出厂状态写回前物理清除');
});

test('真实时间事务运行中时重开仍先失败关闭，不能借清场删除绕过补偿', () => {
  const 函数 = 截取(
    回合源,
    'export async function 重开一局()',
    '\n}',
  );
  const 事务守卫 = 函数.indexOf('if (时间事务阻止普通写入())');
  const 作废时间线 = 函数.indexOf('作废当前时间线切换世代()');
  const 标记重开中 = 函数.indexOf('进行中 = true;');
  const 删除恢复键 = 函数.indexOf('delete vars[时间推进事务键]');
  assert.ok(事务守卫 >= 0 && 事务守卫 < 作废时间线 && 事务守卫 < 标记重开中,
    '重开必须在作废时间线或进入清场前拒绝真实未完成时间事务');
  assert.ok(删除恢复键 > 标记重开中,
    '物理删除只属于已获准的新局清场，不能成为运行中事务的旁路');
});
