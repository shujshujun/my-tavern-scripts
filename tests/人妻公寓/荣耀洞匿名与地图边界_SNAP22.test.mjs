/* eslint-disable import-x/no-nodejs-modules -- Real index listener, scene producer, generation, core and log transaction. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, clone, ticks } from './helpers/离婚主入口环境.mjs';
import { mountActualHostListeners } from './helpers/完整回合补验环境_PLAY002_022.mjs';

function sceneHost(body, options = {}) {
  const e = host();
  const schema = e.load('src/人妻公寓/schema.ts');
  const stage = e.load('src/人妻公寓/stageConfig.ts');
  e.route = e.load('src/人妻公寓/脚本/游戏逻辑/荣耀洞.ts');
  const clock = e.load('src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
  const room = options.room ?? '101';
  const data = schema.Schema.parse({ 户: { [room]: schema.创建户节点(0) }, 系统: { _序章完成: true, _数据版本: schema.当前MVU数据版本 } });
  data.户[room].妻.当前阶段 = options.revealed ? stage.荣耀洞表[room].点破 : stage.荣耀洞表[room].门槛;
  const time = Array.from({ length: 500 }, (_, i) => i).find(t => clock.seededRandom(t, room, '荣耀洞') < stage.荣耀洞表[room].几率);
  assert.notEqual(time, undefined); data.系统._绝对时段 = time;
  e.vars = { _场景: { 房间id: '洗手间' } };
  const started = e.route.使用荣耀洞(data, 32);
  assert.equal(started.变动, true); assert.equal(data.系统._荣耀洞门牌, room);
  data.系统._荣耀洞夫 = false;
  e.st.chat[32].variables = [{ stat_data: data }];
  e.rawCalls = []; e.ctx.generateRaw = async request => { e.rawCalls.push(request); if (e.provider) return e.provider(request); return body; };
  mountActualHostListeners(e);
  e.mvu = e.load('src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
  e.dispatch = async (action = '继续听隔板那边的动静。') => {
    await e.ctx.eventEmit('人妻公寓:玩家行动', action);
    for (let i = 0; i < 200 && (!e.rawCalls.length || e.mvu.MVU操作进行中()); i++) await ticks(1);
    assert.equal(e.rawCalls.length, 1, e.warnings.join('\n'));
    assert.equal(e.mvu.MVU操作进行中(), false, e.warnings.join('\n'));
  };
  e.logs = () => e.vars._隔离事件?.日志 ?? [];
  return e;
}

test('SNAP22真实匿名继续稿照常推进当前拍和线程日志', async () => {
  const e = sceneHost('隔板那边传来轻轻的脚步声，你仍坐在洗手间的隔间内。');
  await e.dispatch();
  assert.equal(e.read().系统._荣耀洞拍, 1, e.warnings.join('\n'));
  assert.equal(e.logs().length, 2);
});

for (const body of ['隔板对面的人就是夏乔，她低声回应了你。', '隔板对面是101室的太太。', '你已经离开洗手间，回到了大堂。']) test(`SNAP22实际坏稿不入日志、不推进：${body}`, async () => {
  const e = sceneHost(body); const before = clone(e.read().系统);
  await e.dispatch('离开洗手间、回大堂。');
  assert.equal(e.read().系统._荣耀洞拍, 0);
  assert.equal(e.logs().length, 0);
  assert.equal(e.read().系统._荣耀洞上次时段, before._荣耀洞上次时段);
  assert.equal(e.vars._场景.房间id, '洗手间');
});

test('SNAP22点破状态允许姓名，文字离开意向仍不切地图', async () => {
  const e = sceneHost('夏乔轻声回应，你还没有离开洗手间。', { revealed: true });
  await e.dispatch('离开洗手间、回大堂。');
  assert.equal(e.read().系统._荣耀洞拍, 1, e.warnings.join('\n'));
  assert.equal(e.vars._场景.房间id, '洗手间');
  assert.equal(e.logs().length, 2);
});

test('SNAP22真正地图离场仍立即清场、保留冷却、不增加奖励', async () => {
  const e = sceneHost(''); const before = clone(e.read());
  e.vars._场景.房间id = '大堂';
  await e.ctx.eventEmit('人妻公寓:荣耀洞离场');
  for (let i = 0; i < 200 && e.mvu.MVU操作进行中(); i++) await ticks(1);
  assert.equal(e.read().系统._荣耀洞拍, -1);
  assert.equal(e.read().系统._荣耀洞上次时段, before.系统._荣耀洞上次时段);
  assert.equal(e.read().户['101'].妻.好感值, before.户['101'].妻.好感值);
  assert.equal(e.logs().length, 0);
});

for (const [room, name] of [['101','夏乔'],['102','沈静仪'],['201','许曼君'],['202','周小满'],['301','安若妍'],['302','母亲']]) {
  test(`SNAP22六户身份状态/${room}：匿名拒绝明确身份，点破允许`, () => {
    const e = sceneHost('', { room });
    const data = e.read(); data.系统._荣耀洞点破 = false;
    assert.ok(e.route.荣耀洞正文边界原因(data, `隔板对面的人就是${name}。`));
    assert.ok(e.route.荣耀洞正文边界原因(data, `隔板对面是${room}室的太太。`));
    data.系统._荣耀洞点破 = true;
    assert.equal(e.route.荣耀洞正文边界原因(data, `隔板对面的人就是${name}。`), '');
  });
}

for (const body of [
  '你没有离开洗手间，仍在隔间里。', '你还未真正走出洗手间。',
  '你打算回到大堂，脚步却还停在隔间内。', '如果你走出洗手间，就能看到走廊。',
  '你问她是否已经离开洗手间。', '你看着她离开洗手间，自己仍留在原处。',
  '昨天你回到大堂，今天仍在洗手间。', '你回到大堂，那是昨天的事。',
  '她离开洗手间，脚步声消失在门口。', '你拉好衣摆，仍站在隔间内。',
]) test(`SNAP22边界反例保留：${body}`, () => {
  const e = sceneHost(''); assert.equal(e.route.荣耀洞正文边界原因(e.read(), body), '');
});

for (const body of [
  '你刚走出洗手间。', '你已经来到管理员室。', '你返回了101室。',
  '你没有犹豫，便离开了洗手间。', '你没有离开洗手间，你随后已经回到了大堂。',
]) test(`SNAP22明确玩家当前离场必须拒绝：${body}`, () => {
  const e = sceneHost(''); assert.ok(e.route.荣耀洞正文边界原因(e.read(), body));
});

test('SNAP22未演旧场次每次都重建当前地图纪律', async () => {
  const e = sceneHost('你仍留在洗手间内。');
  await e.dispatch('离开洗手间、回大堂。');
  const prompt = JSON.stringify(e.rawCalls[0]);
  assert.match(prompt, /只有实际地图离场才结束场次/);
  assert.doesNotMatch(prompt, /若.*在剧情中离开洗手间,本场就地收束/);
});

for (const oldText of ['旧稿：隔板对面的人就是夏乔。', '旧稿：你已经回到了大堂。']) test(`SNAP22旧偏差历史只退出本次请求上下文，保留原日志：${oldText}`, async () => {
  const e = sceneHost('隔板那边仍只有轻轻的脚步声，你留在洗手间内。');
  const system = e.read().系统;
  const thread = `荣耀洞:${system._荣耀洞起时段}:${system._荣耀洞门牌}`;
  e.vars._隔离事件 = { 日志: [
    { id: 'old-user', 类型: '荣耀洞', 线程: thread, 谁: '玩家', 文本: '旧行动：听着动静。', 锚楼: 32, 序: 0, 房间: '洗手间', 时间: 1 },
    { id: 'old-story', 类型: '荣耀洞', 线程: thread, 谁: '叙事', 文本: oldText, 锚楼: 32, 序: 1, 房间: '洗手间', 时间: 1 },
  ] };
  await e.dispatch();
  const request = JSON.stringify(e.rawCalls[0]);
  assert.equal(request.includes(oldText), false);
  assert.ok(request.includes('旧行动：听着动静。'));
  assert.equal(e.logs().find(x => x.id === 'old-story').文本, oldText);
  assert.equal(e.read().系统._荣耀洞拍, 1);
});
