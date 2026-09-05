/* eslint-disable import-x/no-nodejs-modules -- Node-only source matrix test */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const 仓库根 = fileURLToPath(new URL('../../', import.meta.url));
const 源码根 = path.join(仓库根, 'src/人妻公寓');
const App路径 = path.join(源码根, '界面/客户端/App.vue');
const App源码 = readFileSync(App路径, 'utf8');
const 来电渲染路径 = path.join(源码根, '脚本/游戏逻辑/手机/壳/渲染/call.ts');
const 来电渲染源码 = readFileSync(来电渲染路径, 'utf8');

const 已审动态生产事件 = new Set([
  '人妻公寓:推进时段',
  '人妻公寓:睡到次日早晨',
  '人妻公寓:小憩',
  '人妻公寓:晨跑',
  '人妻公寓:健身',
  '人妻公寓:重掷',
  '人妻公寓:隔离事件重掷',
  '人妻公寓:静音会议互动',
  '人妻公寓:静音会议互动补偿',
  '人妻公寓:接听来电',
  '人妻公寓:接听母亲视频通话终幕',
]);

function 递归源码(目录) {
  const 结果 = [];
  for (const 项 of readdirSync(目录, { withFileTypes: true })) {
    const 完整 = path.join(目录, 项.name);
    if (项.isDirectory()) 结果.push(...递归源码(完整));
    else if (项.isFile() && /\.(?:ts|vue)$/u.test(项.name)) 结果.push(完整);
  }
  return 结果;
}

function 事件名们(源码, 方法) {
  const 模式 = new RegExp(方法 + String.raw`\(\s*['"](人妻公寓:[^'"]+)['"]`, 'gu');
  return [...源码.matchAll(模式)].map(匹配 => 匹配[1]);
}

const 全部源码 = 递归源码(源码根).map(文件 => ({ 文件, 源码: readFileSync(文件, 'utf8') }));
const 监听者 = new Map();
const 生产者 = new Map();
for (const { 文件, 源码 } of 全部源码) {
  for (const 名 of 事件名们(源码, 'eventOn')) {
    if (!监听者.has(名)) 监听者.set(名, []);
    监听者.get(名).push(文件);
  }
  for (const 名 of 事件名们(源码, 'eventEmit')) {
    if (!生产者.has(名)) 生产者.set(名, []);
    生产者.get(名).push(文件);
  }
}

test('客户端发出的全部静态业务事件都有脚本消费者，客户端监听的全部事件都有生产者', () => {
  const 客户端发出 = [...new Set(事件名们(App源码, 'eventEmit'))];
  const 客户端监听 = [...new Set(事件名们(App源码, 'eventOn'))];
  assert.equal(客户端发出.length, 76, '新增或删除客户端事件时必须重新审查生产—消费矩阵');
  assert.ok(客户端发出.includes('人妻公寓:不再留门动作'), '照片、设备和母带均通过宿主事务提交');
  assert.ok(客户端发出.includes('人妻公寓:安若妍不必停动作'), '不必停地图动作必须通过宿主事务提交');
  assert.ok(客户端发出.includes('人妻公寓:安若妍换掉动作'));
  assert.ok(客户端发出.includes('人妻公寓:安若妍结局后亲密'));
  assert.ok(客户端发出.includes('人妻公寓:录像带结局后亲密'), '102／202共用载荷携带门牌与开场选择，由脚本再次校验');
  assert.ok(客户端监听.includes('人妻公寓:安若妍换掉CG'));
  assert.ok(客户端发出.includes('人妻公寓:衣柜动作'), '衣柜通过显式安全业务事件提交，不由界面直接写存档');
  const 借种客户端事件 = [
    '人妻公寓:拆除借种摄像头',
    '人妻公寓:确认借种断线',
    '人妻公寓:启动借种',
    '人妻公寓:停止借种',
    '人妻公寓:查看借种阳性结果',
    '人妻公寓:拍摄借种三人合照',
    '人妻公寓:借种三人日常',
    '人妻公寓:借种朋友圈选择',
    '人妻公寓:拍摄借种产后家庭合照',
  ];
  assert.deepEqual(
    客户端发出.filter(事件 => 借种客户端事件.includes(事件)).sort(),
    [...借种客户端事件].sort(),
    '新增的九个借种事件必须全部留在受审矩阵，不能以动态字符串绕过生产—消费检查',
  );
  assert.ok(客户端发出.includes('人妻公寓:第二机位动作'), '第二机位地图动作必须作为显式业务事件纳入生产—消费审计');
  assert.ok(客户端发出.includes('人妻公寓:许曼君分居动作'), '许曼君分居地图动作必须作为显式业务事件纳入生产—消费审计');
  assert.ok(客户端发出.includes('人妻公寓:许曼君离婚动作'), '许曼君离婚地图动作必须作为显式业务事件纳入生产—消费审计');
  assert.ok(客户端发出.includes('人妻公寓:许曼君离婚后日常动作'), '许曼君离婚后日常地图动作必须作为显式业务事件纳入生产—消费审计');
  assert.ok(客户端发出.includes('人妻公寓:使用回国经营归档册'), '回国归档册背包入口必须纳入生产—消费审计');
  assert.ok(客户端发出.includes('人妻公寓:回国动作'), '回国地图动作必须作为显式业务事件纳入生产—消费审计');
  assert.ok(客户端发出.includes('人妻公寓:双重继承动作'), '双重继承地图动作必须作为显式业务事件纳入生产—消费审计');
  assert.ok(客户端发出.includes('人妻公寓:302共居动作'), '302结局后生活动作必须作为显式业务事件纳入生产—消费审计');
  for (const 事件 of [
    '人妻公寓:启动录像带V4监控',
    '人妻公寓:录像带V4操作',
    '人妻公寓:安全中断录像带V4',
    '人妻公寓:完成录像带V4',
  ]) {
    assert.ok(客户端发出.includes(事件), `${事件}必须作为显式V4业务事件纳入生产—消费审计`);
  }
  assert.equal(客户端监听.length, 33, '新增或删除客户端监听时必须重新审查生命周期所有者');
  assert.ok(客户端监听.includes('人妻公寓:不再留门CG'), '不再留门CG只由成功事务生产');
  assert.ok(客户端监听.includes('人妻公寓:安若妍不必停CG'), '不必停CG只由成功事务生产');
  assert.ok(客户端监听.includes('人妻公寓:失败残稿'), '失败残稿必须由主回合生产并由客户端显式消费');
  assert.ok(客户端监听.includes('人妻公寓:第二机位CG'), '第二机位CG必须作为显式客户端监听纳入生命周期审计');
  assert.ok(客户端监听.includes('人妻公寓:许曼君分居CG'), '许曼君分居CG必须作为显式客户端监听纳入生命周期审计');
  assert.ok(客户端监听.includes('人妻公寓:许曼君离婚CG'), '许曼君离婚CG必须作为显式客户端监听纳入生命周期审计');
  assert.ok(客户端监听.includes('人妻公寓:回国CG'), '回国CG必须作为显式客户端监听纳入生命周期审计');
  assert.ok(客户端监听.includes('人妻公寓:双重继承CG'), '双重继承CG必须作为显式客户端监听纳入生命周期审计');
  assert.ok(客户端监听.includes('人妻公寓:302亲密开场CG'), '302专属开场CG只由成功首楼产生并由客户端短暂覆盖');
  assert.ok(客户端监听.includes('人妻公寓:借种CG'), '借种CG 必须作为显式客户端监听纳入生命周期审计');
  assert.ok(客户端监听.includes('人妻公寓:录像带V4状态'), '录像带V4状态刷新必须纳入客户端监听生命周期审计');
  assert.deepEqual(
    客户端发出.filter(事件 => !监听者.has(事件)),
    [],
    '客户端不得发出无人消费的孤儿业务事件',
  );
  assert.deepEqual(
    客户端监听.filter(事件 => !生产者.has(事件)),
    [],
    '客户端不得监听永远不会生产的孤儿状态事件',
  );
});

test('全仓静态业务事件不存在无消费生产者或无生产消费端', () => {
  assert.match(
    App源码,
    /const 事件名 =[\s\S]*?'人妻公寓:睡到次日早晨'[\s\S]*?'人妻公寓:晨跑'[\s\S]*?'人妻公寓:健身'[\s\S]*?'人妻公寓:小憩'[\s\S]*?'人妻公寓:推进时段'[\s\S]*?eventEmit\(事件名,/u,
    '五个时间动作必须由同一受审动态事件名分发器生产',
  );
  assert.match(
    App源码,
    /eventEmit\(隔离可重掷\.value \? '人妻公寓:隔离事件重掷' : '人妻公寓:重掷'\)/u,
    '普通与隔离重掷必须由同一受审条件分发器生产',
  );
  assert.match(
    App源码,
    /eventEmit\(recovery \? '人妻公寓:静音会议互动补偿' : '人妻公寓:静音会议互动', payload\)/u,
    '静音会议普通互动与补偿必须由同一受审条件分发器生产',
  );
  assert.match(
    来电渲染源码,
    /eventEmit\(是母亲终幕视频 \? '人妻公寓:接听母亲视频通话终幕' : '人妻公寓:接听来电', 当前聊天ID\(\)\)/u,
    '普通来电与母亲终幕视频必须由手机来电按钮的同一受审条件分发器生产',
  );

  const 无消费生产者 = [...生产者.keys()].filter(事件 => !监听者.has(事件)).sort();
  const 无生产消费端 = [...监听者.keys()]
    .filter(事件 => !生产者.has(事件) && !已审动态生产事件.has(事件))
    .sort();
  assert.deepEqual(无消费生产者, [], '全仓 eventEmit 不得留下无 eventOn 的内部孤儿事件');
  assert.deepEqual(无生产消费端, [], '全仓 eventOn 不得留下无静态或受审动态生产者的不可达内部入口');
});

test('客户端重复挂载由唯一入口和 App 卸载共同清理监听，多消费者只保留两项明确旁路', () => {
  assert.match(App源码, /onUnmounted\(\(\) => \{[\s\S]*?eventClearAll\(\)/u, 'App 卸载必须清空本 iframe 旧监听');
  const 客户端监听 = [...new Set(事件名们(App源码, 'eventOn'))];
  const 多消费者 = Object.fromEntries(
    客户端监听
      .map(事件 => [事件, 监听者.get(事件) ?? []])
      .filter(([, 文件们]) => 文件们.length > 1)
      .map(([事件, 文件们]) => [事件, 文件们.map(文件 => path.relative(仓库根, 文件).split(path.sep).join('/')).sort()]),
  );
  assert.deepEqual(Object.keys(多消费者).sort(), ['人妻公寓:回合完成', '人妻公寓:特殊场景状态']);
  assert.ok(
    多消费者['人妻公寓:回合完成'].some(文件 => 文件.endsWith('脚本/游戏逻辑/index.ts')),
    '回合完成的脚本消费者负责手机与后处理节拍',
  );
  assert.ok(
    多消费者['人妻公寓:特殊场景状态'].some(文件 => 文件.endsWith('手机/壳/挂载.ts')),
    '特殊场景状态的第二消费者只负责手机旁路刷新',
  );
});
