/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 合成源 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url), 'utf8');
const Index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 撤销源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/时间撤销系统.ts', import.meta.url), 'utf8');

function 截段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

function 断言先后(片段, 前标记, 后标记, 说明) {
  const 前 = 片段.indexOf(前标记);
  const 后 = 片段.indexOf(后标记);
  assert.notEqual(前, -1, `${说明}：缺少“${前标记}”`);
  assert.notEqual(后, -1, `${说明}：缺少“${后标记}”`);
  assert.ok(前 < 后, 说明);
}

test('撤销事件进入 listener 清理名单并由后端完整复核，不信任界面显隐', () => {
  const 清理名单 = 截段(Index源, 'for (const 名 of [', '  ]) {\n    eventClearEvent(名);');
  const 时间段 = 截段(Index源, 'type 时间推进载荷', '\n  // 地点只负责亮出 STORY 按钮');

  assert.match(清理名单, /'人妻公寓:撤销时间推进'/);
  assert.equal((时间段.match(/eventOn\('人妻公寓:撤销时间推进'/g) ?? []).length, 1);
  assert.match(时间段, /判定时间撤销点/);
  assert.match(时间段, /是时间撤销地点\(当前房间\)/);
  assert.match(时间段, /当前聊天ID\(\)/);
  assert.match(时间段, /手机锚消息签名/);
});

test('时间推进把撤销点与清场变量作为同笔聊天写入，失败时同时恢复旧 stat 和旧聊天', () => {
  const 时间段 = 截段(Index源, 'type 时间推进载荷', '\n  // 地点只负责亮出 STORY 按钮');
  const 推进段 = 时间段.slice(时间段.indexOf('function 处理时间推进'), 时间段.indexOf('function 处理撤销时间推进'));

  assert.match(时间段, /创建时间撤销点/);
  assert.match(时间段, /时间撤销点键/);
  assert.match(时间段, /捕获精确聊天快照/);
  assert.match(时间段, /恢复精确聊天快照/);
  assert.match(时间段, /记录成长: false/);
  assert.match(时间段, /时间推进写入聊天键 = 时间推进事务恢复聊天键/);
  assert.match(推进段, /vars\[时间推进事务键\] = _.cloneDeep\(时间事务记录\)/);
  assert.match(推进段, /写时间结束场景\(vars,[\s\S]{0,180}delete vars\[时间撤销点键\]/);
  assert.match(推进段, /执行时间推进双存储提交/);
  assert.match(推进段, /const 清场后聊天基线 = 时间聊天状态指纹/);
  assert.match(推进段, /时间聊天状态指纹\(vars\) !== 清场后聊天基线/);
  assert.ok(
    推进段.indexOf('await 脚本写入(raw, 候选') < 推进段.indexOf('vars[时间撤销点键] = 创建时间撤销点'),
    '只有推进 stat 成功后才能创建新撤销点',
  );
  assert.doesNotMatch(时间段, /createChatMessages|createChatMessage|\/addswipe|\/send/);
});

test('跨聊天重载留下的时间半事务会在挂监听前按持久记录恢复', () => {
  const 恢复段 = 截段(Index源, 'async function 恢复中断时间推进', '/**\n * 玩家角色名');
  assert.match(恢复段, /读取时间推进事务记录/);
  assert.match(恢复段, /await 脚本写入\(有效\.raw, _.cloneDeep\(记录\.推进前数据\)/);
  assert.match(恢复段, /恢复精确聊天快照\(当前变量, 记录\.推进前聊天, 时间推进事务恢复聊天键\)/);
  assert.match(恢复段, /delete 当前变量\[时间推进事务键\]/);

  const 启动恢复 = Index源.indexOf('await 恢复中断时间推进()');
  const 挂监听 = Index源.indexOf('挂载监听();', 启动恢复);
  assert.ok(启动恢复 >= 0 && 挂监听 > 启动恢复, '半事务必须在接受新操作前恢复');
});

test('撤销恢复完整 MVU 与版本2隔离日志快照，并复用手机双轴裁剪后销毁单槽撤销点', () => {
  const 时间段 = 截段(Index源, 'type 时间推进载荷', '\n  // 地点只负责亮出 STORY 按钮');

  assert.match(撤销源, /时间撤销点版本 = 2 as const/);
  assert.match(撤销源, /时间撤销恢复聊天键 = \[[\s\S]{0,500}'_隔离事件'/);
  assert.match(时间段, /推进前数据/);
  assert.match(时间段, /恢复精确聊天快照\(vars, 撤销点\.推进前聊天, 时间撤销恢复聊天键\)/);
  assert.match(时间段, /裁手机时间线/);
  assert.match(时间段, /delete vars\[时间撤销点键\]/);
  assert.match(时间段, /清保护快照\(\)/);
  assert.match(时间段, /同步入住世界书条目/);
  assert.match(时间段, /eventEmit\('人妻公寓:回合完成', \{ 更新正文幕: false \}\)/);
});

test('推进与撤销的每次 stat 改写都在正确边界作废手机租约世代', () => {
  const 时间段 = 截段(Index源, 'type 时间推进载荷', '\n  // 地点只负责亮出 STORY 按钮');
  const 推进段 = 时间段.slice(时间段.indexOf('function 处理时间推进'), 时间段.indexOf('function 处理撤销时间推进'));
  const 撤销段 = 时间段.slice(时间段.indexOf('function 处理撤销时间推进'));
  const 推进写入 = 截段(推进段, '写推进状态: async () => {', '写撤销点: async () => {');
  const 推进补偿 = 截段(推进段, '恢复推进前状态: async () => {', '恢复推进前聊天: async () => {');
  const 撤销写入 = 截段(撤销段, 'stat写入已开始 = true;', 'stat已恢复 = true;');
  const 撤销补偿 = 截段(撤销段, 'if ((stat写入已开始 || stat已恢复)', 'if (聊天已恢复');

  断言先后(推进写入, '作废当前手机时间线租约世代()', 'await 脚本写入(raw, 候选', '推进写 stat 前必须先作废旧租约世代');
  断言先后(
    推进补偿,
    '作废当前手机时间线租约世代()',
    'await 脚本写入(raw, _.cloneDeep(推进前数据)',
    '补偿写回推进前 stat 前必须先作废事务期间产生的租约',
  );
  断言先后(
    撤销写入,
    '作废当前手机时间线租约世代()',
    'await 脚本写入(raw, 推进前数据',
    '撤销写 stat 前必须先作废推进后时间线的租约',
  );
  断言先后(
    撤销补偿,
    '作废当前手机时间线租约世代()',
    'await 脚本写入(raw, _.cloneDeep(推进后数据)',
    '补偿写回推进后 stat 前必须先作废撤销期间产生的租约',
  );
});

test('客户端在室内与原地训练地点且撤销点仍有效时显示按钮，坏结局页也保留救援入口', () => {
  // A6b:房卡动作段已迁入 useRoomActions.ts，模板与撤销资格仍读 App
  const 晨跑动作 = 截段(合成源, "if (id === '晨跑公园')", "if (id === '健身房')");
  const 健身动作 = 截段(合成源, "if (id === '健身房')", "if (房?.类型 === '户'");
  const 三零二动作 = 截段(合成源, "if (id === '302')", '// 管理员室世界时间');
  const 管理员室动作 = 截段(合成源, "if (id === '管理员室')", '// 公共区');
  const 公共区动作 = 截段(合成源, '// 公共区', 'return 动作;');

  for (const 动作段 of [晨跑动作, 健身动作, 三零二动作, 管理员室动作]) {
    assert.match(动作段, /时间撤销可用\.value/);
    assert.match(动作段, /文案: '撤销刚才的时间推进'/);
    assert.match(动作段, /发起时间撤销/);
  }
  assert.doesNotMatch(公共区动作, /撤销刚才的时间推进|发起时间撤销/);
  assert.match(App源, /v-if="时间撤销可用"[\s\S]{0,180}@click="发起时间撤销"/);
  assert.match(App源, /判定时间撤销点/);
  assert.match(App源, /是时间撤销地点\(房间\)/);
  assert.match(App源, /eventEmit\('人妻公寓:撤销时间推进'\)/);
  assert.match(App源, /const 时间撤销刷新版本 = ref\(0\)/);
  assert.match(App源, /eventOn\('人妻公寓:手机状态',[\s\S]{0,120}时间撤销刷新版本\.value \+= 1/);
  assert.match(App源, /eventOn\('人妻公寓:时间推进结束',[\s\S]{0,120}时间撤销刷新版本\.value \+= 1/);
  assert.match(App源, /eventOn\('人妻公寓:手机收起',[\s\S]{0,120}时间撤销刷新版本\.value \+= 1/);
});
