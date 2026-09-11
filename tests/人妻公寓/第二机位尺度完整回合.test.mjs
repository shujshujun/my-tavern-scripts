/* eslint-disable import-x/no-nodejs-modules -- Complete production turn and scene transaction harness. */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertReleased,
  clone,
  deferred,
  host,
  waitRequests,
} from './helpers/离婚主入口环境.mjs';

function 带尺度(正文, 实际, 请求 = 实际) {
  return `${正文}\n<尺度判定 模式="简">{"102":{"请求":${请求},"实际":${实际},"结果":"成功"}}</尺度判定>`;
}

function 屋内余波主机(options = {}) {
  const e = host(options);
  const schema = e.load('src/人妻公寓/schema.ts');
  const route = e.load('src/人妻公寓/脚本/游戏逻辑/第二机位系统.ts');
  const scene = e.load('src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
  const { Schema, 创建户节点 } = schema;
  const data = Schema.parse({ 户: { 102: 创建户节点(0) }, 系统: { _绝对时段: 0 }, 现金: 12000 });
  data.户['102'].妻.当前阶段 = 5;
  data.户['102'].妻.阶段性癖 = '视奸欲';
  data.系统._摄像头布设['102'] = true;
  data.系统._第二机位.阶段 = '待门缝';
  data.系统._第二机位.最早继续日 = 0;
  data.玩家资源.精力.训练经验 = 8;
  data.玩家资源.体力.训练经验 = 8;
  data.玩家资源.精力.当前值 = 8;
  data.玩家资源.体力.当前值 = 8;

  let found = false;
  for (let t = 0; t < 84; t += 1) {
    data.系统._绝对时段 = t;
    if (route.第二机位地点动作(data, '102').some(item => item.id === '门缝那一眼')) {
      found = true;
      break;
    }
  }
  assert.equal(found, true, '夹具必须找到沈静仪在102且顾国栋外出的合法时段');

  let 当前 = route.执行第二机位地点动作(data, '门缝那一眼', '102');
  assert.equal(当前.成功, true, 当前.提示);
  for (let 拍 = 1; 拍 <= 3; 拍 += 1) {
    const 结果 = route.提交第二机位剧情事件(data, 当前.事件, '102', 10 + 拍);
    assert.equal(结果?.成功, true, 结果?.提示);
    assert.ok(结果.后续剧情?.事件);
    当前 = { 成功: true, 事件: 结果.后续剧情.事件 };
  }
  assert.match(当前.事件, /【第二机位提交:D:4】/);
  assert.equal(data.系统._第二机位.阶段, '待门缝');

  const action = '回应她在屋内余波中的沉默。';
  const active = scene.激活新增场景剧情(data, {
    内容: 当前.事件,
    目标场景: '102',
    行动: action,
    触发楼层: 32,
  });
  assert.equal(active.成功, true, active.提示);

  e.vars = { _场景: { 房间id: '102' } };
  e.st.chat = Array.from({ length: 33 }, (_, floor) => ({
    is_user: floor % 2 === 1,
    mes: `已有记录${floor}`,
    extra: {},
    variables: [{}],
  }));
  e.st.chat[32].variables = [{ stat_data: clone(data) }];
  e.requests = [];
  e.commits = 0;
  e.validations = [];
  e.trace = [];
  e.warnings = [];

  const 原验收 = route.第二机位正文越拍原因;
  route.第二机位正文越拍原因 = (...args) => {
    const error = 原验收(...args);
    e.validations.push({ event: args[0], text: args[1], error });
    return error;
  };
  const 原提交 = route.提交第二机位剧情事件;
  route.提交第二机位剧情事件 = (...args) => {
    e.commits += 1;
    e.trace.push({ op: 'second-camera-commit' });
    return 原提交(...args);
  };

  e.route = route;
  e.scene = scene;
  e.action = action;
  e.room = '102';
  e.run = extra => {
    const txn = e.read().系统._场景剧情事务;
    return e.main.执行回合(action, {
      场景剧情事务ID: txn.id,
      场景剧情请求世代: txn.请求世代,
      ...extra,
    });
  };
  e.retry = async extra => {
    const currentData = e.read();
    const txn = currentData.系统._场景剧情事务;
    assert.equal(scene.标记场景剧情待重试(currentData, txn.id, txn.请求世代), true);
    const retry = scene.准备重试场景剧情(currentData, '102');
    assert.equal(retry.成功, true, retry.提示);
    e.st.chat.at(-1).variables = [{ stat_data: clone(currentData) }];
    return e.run(extra);
  };
  return e;
}

test('模型仅因事件标题误报4时，真实屋内余波完整回合直接通过并只提交一次', async () => {
  const e = 屋内余波主机();
  e.provider = () => 带尺度('沈静仪从钥匙声和停顿认出丈夫来过，只整理衣领并与你安静交谈。', 4);
  assert.equal(await e.run(), true, e.warnings.join('\n'));
  assertReleased(e);
  assert.equal(e.requests.length, 1, '合法屋内余波不应浪费一次静默重写');
  assert.equal(e.commits, 1);
  const result = e.read();
  assert.equal(result.系统._第二机位.阶段, '待复核');
  assert.equal(result.系统._场景剧情事务.id, '');
  assert.equal(result.背包.includes('沈静仪母带（已封存）'), false);
  assert.equal(result.系统._特殊场景前置.includes('录像带结局:沈母带封存'), false);
});

test('首稿真正3级越界、二稿回到真实屋内余波时，只采纳二稿并提交一次', async () => {
  const e = 屋内余波主机();
  e.provider = (_request, count) => count === 1
    ? 带尺度('她在屋内重新开始性交，抽插在本楼继续。', 3)
    : 带尺度('她认出丈夫来过，随后只抱住你并轻轻亲吻。', 4);
  assert.equal(await e.run(), true, e.warnings.join('\n'));
  assertReleased(e);
  assert.equal(e.requests.length, 2);
  assert.equal(e.commits, 1);
  assert.ok(e.warnings.some(line => line.includes('首稿需静默重写')));
  const result = e.read();
  assert.equal(result.系统._第二机位.阶段, '待复核');
  assert.equal(result.玩家资源.体力.当前值, 8, '固定余波拍不得因作废首稿扣体力');
  assert.equal(result.背包.includes('沈静仪母带（已封存）'), false);
});

test('首稿和二稿都真正越界时不结算、不完成；第三次合法重试只推进一次', async () => {
  const e = 屋内余波主机();
  const before = clone(e.read());
  const rows = e.st.chat.length;
  e.provider = () => 带尺度('她在本楼重新开始无保护性交并内射。', 4);
  assert.equal(await e.run(), false, '两稿真正越界必须失败关闭');
  assertReleased(e);
  assert.equal(e.requests.length, 2);
  assert.equal(e.commits, 0);
  assert.equal(e.st.chat.length, rows, '失败临时用户楼和助手楼必须清除');
  assert.deepEqual(e.read().系统._第二机位, before.系统._第二机位);
  assert.equal(e.read().背包.includes('沈静仪母带（已封存）'), false);
  assert.equal(e.read().系统._已完成特殊场景.includes('第二机位'), false);

  e.provider = () => 带尺度('她把半掩的门留在原位，与你在余波中安静说了几句话。', 4);
  assert.equal(await e.retry(), true, e.warnings.join('\n'));
  assertReleased(e);
  assert.equal(e.commits, 1);
  assert.equal(e.read().系统._第二机位.阶段, '待复核');
});

test('D4凭空出现CAM-2、停录或母带时两稿都失败，检查点与资源不变', async () => {
  const e = 屋内余波主机();
  const before = clone(e.read());
  e.provider = () => 带尺度('CAM-2指示灯熄灭，沈静仪停止录制并确认母带已经保存。', 4);
  assert.equal(await e.run(), false);
  assertReleased(e);
  assert.equal(e.requests.length, 2);
  assert.equal(e.commits, 0);
  const after = e.read();
  assert.deepEqual(after.系统._第二机位, before.系统._第二机位);
  assert.equal(after.玩家资源.体力.当前值, before.玩家资源.体力.当前值);
  assert.match(after.系统._场景剧情事务.内容, /【第二机位提交:D:4】/u);
});

test('提供方拒答不进入静默角色改写，不提交屋内余波票', async () => {
  const e = 屋内余波主机();
  const before = clone(e.read());
  e.provider = () => '抱歉，我无法继续这项请求。';
  assert.equal(await e.run(), false);
  assertReleased(e);
  assert.equal(e.requests.length, 1);
  assert.equal(e.commits, 0);
  const after = e.read();
  assert.deepEqual(after.系统._第二机位, before.系统._第二机位);
  assert.equal(after.玩家资源.体力.当前值, before.玩家资源.体力.当前值);
  assert.match(after.系统._场景剧情事务.内容, /【第二机位提交:D:4】/u);
  assert.doesNotMatch(e.st.chat.at(-1)?.mes ?? '', /无法继续这项请求/u);
});

test('旧请求世代在玩家开始新重试后失效，不能消费同一屋内余波票', () => {
  const e = 屋内余波主机();
  const data = e.read();
  const old = clone(data.系统._场景剧情事务);
  assert.equal(e.scene.标记场景剧情待重试(data, old.id, old.请求世代), true);
  const retry = e.scene.准备重试场景剧情(data, '102');
  assert.equal(retry.成功, true, retry.提示);
  assert.equal(retry.事务.请求世代, old.请求世代 + 1);
  assert.equal(
    e.scene.提交场景剧情成功(data, old.内容, old.id, old.请求世代),
    false,
    '第一次迟到结果不能认领新请求世代',
  );
  assert.equal(data.系统._第二机位.阶段, '待门缝');
  assert.match(data.系统._场景剧情事务.内容, /【第二机位提交:D:4】/);
});
