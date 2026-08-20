/* eslint-disable import-x/no-nodejs-modules -- Node-only source-wiring regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 合成源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url), 'utf8');
const 房内操作抽屉源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/components/房内操作抽屉.vue', import.meta.url),
  'utf8',
);
const 入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function 事件段(事件名) {
  const 开始 = 入口源码.indexOf(`eventOn('人妻公寓:${事件名}'`);
  assert.ok(开始 >= 0, `缺少事件入口：${事件名}`);
  const 下一个 = 入口源码.indexOf('\n  eventOn(', 开始 + 1);
  return 入口源码.slice(开始, 下一个 >= 0 ? 下一个 : 入口源码.length);
}

function 断言守卫早于业务(事件名, 守卫片段, 业务片段) {
  const 段 = 事件段(事件名);
  const 守卫位置 = 段.indexOf(守卫片段);
  const 业务位置 = 段.indexOf(业务片段);
  assert.ok(守卫位置 >= 0, `${事件名}缺少地点守卫：${守卫片段}`);
  assert.ok(业务位置 >= 0, `${事件名}缺少业务调用：${业务片段}`);
  assert.ok(守卫位置 < 业务位置, `${事件名}必须先验地点，再执行${业务片段}`);
}

test('组合动作只有确认成功到达目标地点后才继续执行，翻垃圾不再上地图房卡', () => {
  // A6b:组合动作与到达确认门随 房间动作 迁入 useRoomActions.ts
  assert.match(
    合成源码,
    /async function 确认已到达动作地点\(地点: string\): Promise<boolean>[\s\S]*?try[\s\S]*?await 进入\(地点, false, true\)[\s\S]*?catch[\s\S]*?同步场景自变量\(\)[\s\S]*?当前房间\.value === 地点/,
  );

  const 动作开始 = 合成源码.indexOf("if (房?.类型 === '户'");
  const 动作结束 = 合成源码.indexOf('function 添加管理任务动作', 动作开始);
  const 组合动作源码 = 合成源码.slice(动作开始, 动作结束);
  const 地点门 = 组合动作源码.match(/if \(!\(await 确认已到达动作地点\(id\)\)\) return;/g) ?? [];
  assert.equal(地点门.length, 5, '对饮、丈夫礼物、催租、打听、捡零钱都必须走同一个到达确认门');
  assert.doesNotMatch(
    组合动作源码,
    /if \(当前房间\.value !== (?:id|'垃圾房')\) await 进入\(/,
    '不得再忽略进入()返回的失败结果',
  );

  // 2026-08-03 用户拍板：翻垃圾从地图房卡下架，只保留人到垃圾房后的房内直显按钮，
  // 点翻找立即开演，不再靠远程一键排队把强制事件闷在队列里锁死时间和楼务。
  assert.doesNotMatch(组合动作源码, /确认已到达动作地点\('垃圾房'\)/, '地图房卡不得再远程一键翻垃圾');
  assert.match(
    App源码,
    /const 垃圾入口可见 = computed\([\s\S]{0,240}当前房间\.value === '垃圾房'[\s\S]{0,80}垃圾袋列表\.value\.length > 0/,
    'App 必须以玩家真实身处垃圾房为前提计算翻垃圾入口',
  );
  assert.match(App源码, /:garbage-visible="垃圾入口可见"/, 'App 必须把地点门结果交给房内操作抽屉');
  assert.match(房内操作抽屉源码, /<div v-if="garbageVisible" class="garbage-pick">/, '抽屉必须消费地点门结果');
});

test('脚本端在扣资源、发奖励或调用AI以前再次复核真实场景', () => {
  assert.match(入口源码, /function 要求当前地点\(地点: string, 失败提示: string\): boolean/);
  断言守卫早于业务('翻垃圾', "要求当前地点('垃圾房'", '翻垃圾(data');
  断言守卫早于业务('打听', "要求当前地点('大堂'", '打听(data');
  断言守卫早于业务('对饮', '要求当前地点(门牌号', '对饮(data');
  断言守卫早于业务('丈夫礼物', '要求当前地点(载荷.门牌', '赠礼丈夫(data');
  断言守卫早于业务('催租', '要求当前地点(载荷.门牌', '催租(data');
  断言守卫早于业务('捡金币', '要求当前地点(地点', '捡金币(data');
});

test('荣耀洞、装摄像头与查看监控也不能绕过真实地点', () => {
  断言守卫早于业务('荣耀洞', "要求当前地点('洗手间'", '使用荣耀洞(data');
  断言守卫早于业务('布设摄像头', '要求当前地点(门牌号', '布设摄像头(data');
  assert.match(事件段('布设摄像头'), /妻在当前场景\(data, 门牌号\)/);
  assert.match(事件段('布设摄像头'), /丈夫在楼\(data\.户\[门牌号\]/);
  断言守卫早于业务('查看摄像头', "要求当前地点('302'", '查看摄像头(data');
  assert.doesNotMatch(事件段('查看摄像头'), /insertOrAssignVariables\([\s\S]*房间id: '302'/);

  const 看监控开始 = App源码.indexOf('async function 看监控');
  const 看监控结束 = App源码.indexOf('const 偷窥待选', 看监控开始);
  const 看监控源码 = App源码.slice(看监控开始, 看监控结束);
  assert.match(看监控源码, /await 确认已到达动作地点\('302'\)/);
  assert.ok(
    看监控源码.indexOf("await 确认已到达动作地点('302')") < 看监控源码.indexOf("eventEmit('人妻公寓:查看摄像头'"),
    '查看监控必须先真实回到302再发业务事件',
  );
  const 监控同步开始 = App源码.indexOf("eventOn('人妻公寓:监控回合'");
  const 监控同步结束 = App源码.indexOf("eventOn('人妻公寓:特殊场景状态'", 监控同步开始);
  assert.doesNotMatch(App源码.slice(监控同步开始, 监控同步结束), /进入\('302'\)/);
});
