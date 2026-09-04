/* eslint-disable import-x/no-nodejs-modules -- Node-only regression harness */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = lodash;

const schemaModule = require('../../src/人妻公寓/schema.ts');
const { Schema, 创建户节点 } = schemaModule;
const schemaAliasPath = require.resolve('../../src/人妻公寓/schema');
require.cache[schemaAliasPath] = {
  id: schemaAliasPath,
  filename: schemaAliasPath,
  loaded: true,
  exports: schemaModule,
};

const 日常 = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚后日常系统.ts');
const 离婚 = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts');
const 资源 = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function 数据(choice = '继续关系', time = 3) {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 系统: { _绝对时段: time } });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.好感值 = 90;
  data.户['201'].妻.堕落值 = 95;
  data.户['201'].夫._居住模式 = '正式退居';
  data.系统._许曼君分居.方案版本 = 2;
  data.系统._许曼君分居.阶段 = '已完成';
  data.系统._许曼君分居.玩家最终关系选择 = choice;
  data.系统._许曼君分居.留宿201权限 = choice !== '退出关系';
  data.系统._许曼君分居.钥匙位置 = '管理员室201钥匙格';
  data.系统._许曼君分居.钥匙用途 = '正式退居';
  data.系统._许曼君离婚.阶段 = '已完成';
  data.系统._许曼君离婚.法律离婚已成立 = true;
  data.系统._许曼君离婚.赵国强正式退居 = true;
  data.系统._许曼君离婚.换锁完成 = true;
  data.系统._许曼君离婚.完成楼层 = 10;
  data.系统._已完成特殊场景.push(离婚.许曼君离婚场景ID);
  return data;
}

const D1正文 = {
  给自己改衣服: '许曼君把衣服铺平，先检查接缝和衣摆，再用粉笔标出准备拆线的位置。她让玩家只压住布边，最后停在尚未落针的尺寸线上。',
  重排201: '许曼君站在201中央逐处查看柜子、桌面和空位，用卷尺标出新的动线。玩家只按她说的扶住柜角，房间还没有真正归位。',
  给自己留一笔生活钱: '许曼君翻开账本，先把固定支出和自己的需要逐项列出来。她在准备保留的额度旁画线，但本回合还没有把数字正式写进明账。',
};

const D2正文 = {
  给自己改衣服: '许曼君按刚才标好的尺寸拆线、收窄衣身并重新缝好，熨平后亲自试穿，确认这件衣服终于按她自己的喜好改完。',
  重排201: '许曼君按已经量好的动线重新安排柜子和桌面，玩家照她的指示搭手；最后常用物件全部归位，她确认201现在住着顺手。',
  给自己留一笔生活钱: '许曼君按核好的数字在明账里固定留出一笔只供自己生活使用的钱，并亲手写明不会再把它挪去填别人的账。',
};

function 当前父动作(data) {
  const actions = 日常.许曼君离婚后日常地点动作(data, '201');
  assert.equal(actions.length, 1);
  return actions[0];
}

function 开始D1(data, choice, floor = 20) {
  const parent = 当前父动作(data);
  assert.equal(parent.id, '看看她今天在忙什么');
  const result = 日常.执行许曼君离婚后日常动作(data, choice, '201', floor);
  assert.equal(result.成功, true, result.提示);
  assert.match(result.事件, /【许曼君离婚后日常提交:D1:/u);
  return { parent, result };
}

function 提交D1(data, start, floor = 20) {
  const result = 日常.提交许曼君离婚后日常事件(data, start.事件, D1正文[start.主题], '201', floor, ['201'], []);
  assert.equal(result.成功, true, result.提示);
  return result;
}

function 完成D2(data, floor = 21) {
  const action = 当前父动作(data);
  assert.equal(action.id, '把今天这件事做完');
  const start = 日常.执行许曼君离婚后日常动作(data, action.id, '201', floor);
  assert.equal(start.成功, true, start.提示);
  assert.match(start.事件, /【许曼君离婚后日常提交:D2:/u);
  const result = 日常.提交许曼君离婚后日常事件(data, start.事件, D2正文[action.主题], '201', floor, ['201'], []);
  assert.equal(result.成功, true, result.提示);
  return { action, start, result };
}

function 成功一次(data, choice, floor = 20) {
  const { parent, result: start } = 开始D1(data, choice, floor);
  提交D1(data, start, floor);
  const done = 完成D2(data, floor + 1);
  return { parent, done };
}

test('Schema、schema.json与initvar提供两回合检查点、近期记忆、整备奖励和反馈默认值', () => {
  const expected = {
    版本: 2,
    阶段: '空闲',
    当前事件ID: '',
    当前主题: '',
    当前选择: '',
    当前关系: '',
    开始时段: -1,
    开始楼层: -1,
    累计次数: 0,
    最近事件ID: '',
    最近主题: '',
    最近选择: '',
    最近关系: '',
    最近事件时段: -1,
    最近事件楼层: -1,
    下次可用时段: -1,
    最近摘要: '',
    近期主题: [],
    生活整备可用: false,
    生活整备来源事件ID: '',
    事件记录: [],
    待反馈事件: [],
  };
  assert.deepEqual(Schema.parse({}).系统._许曼君离婚后日常, expected);
  const schemaJson = JSON.parse(read('src/人妻公寓/schema.json'));
  assert.deepEqual(Object.keys(schemaJson.properties.系统.properties._许曼君离婚后日常.properties), Object.keys(expected));
  const initvar = read('src/人妻公寓/世界书/变量/initvar.yaml');
  const block = initvar.slice(initvar.indexOf('  _许曼君离婚后日常:'), initvar.indexOf('  _回国:'));
  for (const key of Object.keys(expected)) assert.match(block, new RegExp(`${key}:`, 'u'));
});

test('完整结局与真实关系选择是入口硬门；旧完成ID缺关系时不猜分支', () => {
  const before = 数据();
  before.系统._已完成特殊场景 = [];
  before.系统._许曼君离婚.阶段 = '未开始';
  assert.deepEqual(日常.许曼君离婚后日常地点动作(before, '201'), []);

  const legacy = 数据('未决定');
  assert.deepEqual(日常.许曼君离婚后日常地点动作(legacy, '201'), []);
  assert.deepEqual(离婚.许曼君离婚地点动作(legacy, '201'), [], '关系未知的兼容档不能开放亲密入口');

  for (const choice of ['继续关系', '暂不承诺', '退出关系']) {
    assert.equal(日常.许曼君离婚后日常地点动作(数据(choice), '201').length, 1);
  }
});

test('入口只占一块瓷砖；关系继续/暂不承诺与退出关系使用不同结构化选项', () => {
  for (const choice of ['继续关系', '暂不承诺']) {
    const action = 当前父动作(数据(choice));
    assert.deepEqual(action.选项.map(item => item.id), ['陪她把这件事做完', '把决定留给她']);
  }
  const exit = 当前父动作(数据('退出关系'));
  assert.deepEqual(exit.选项.map(item => item.id), ['只处理201房务', '听她把边界说清']);
});

test('D1只建立持久检查点，不烧冷却、不发反馈、不发奖励；D2才原子完成', () => {
  const data = 数据('继续关系', 3);
  const { parent, result: start } = 开始D1(data, '陪她把这件事做完', 30);
  assert.equal(data.系统._许曼君离婚后日常.阶段, '空闲', '生成前不提前写检查点');
  提交D1(data, start, 30);
  const state = data.系统._许曼君离婚后日常;
  assert.equal(state.阶段, '待收针');
  assert.equal(state.当前主题, parent.主题);
  assert.equal(state.累计次数, 0);
  assert.equal(state.下次可用时段, -1);
  assert.equal(state.待反馈事件.length, 0);
  assert.equal(state.生活整备可用, false);
  assert.equal(当前父动作(data).id, '把今天这件事做完');

  完成D2(data, 31);
  assert.equal(state.阶段, '空闲');
  assert.equal(state.累计次数, 1);
  assert.equal(state.下次可用时段, 9);
  assert.equal(state.事件记录.length, 1);
  assert.equal(state.待反馈事件.length, 1);
  assert.equal(state.待反馈事件[0].可发送时段, 4);
  assert.equal(state.生活整备可用, true);
  assert.equal(state.当前事件ID, '');
});

test('D1检查点可跨时段续接D2，不会因世界时间推进永久卡住', () => {
  const data = 数据('继续关系', 3);
  const { result: start } = 开始D1(data, '把决定留给她', 35);
  assert.equal(提交D1(data, start, 35).成功, true);
  data.系统._绝对时段 = 4;
  const action = 当前父动作(data);
  assert.equal(action.id, '把今天这件事做完');
  const d2 = 日常.执行许曼君离婚后日常动作(data, action.id, '201', 36);
  assert.equal(d2.成功, true, d2.提示);
  const done = 日常.提交许曼君离婚后日常事件(data, d2.事件, D2正文[action.主题], '201', 36, ['201'], []);
  assert.equal(done.成功, true, done.提示);
  assert.equal(data.系统._许曼君离婚后日常.最近事件时段, 4);
  assert.equal(data.系统._许曼君离婚后日常.下次可用时段, 10);
});

test('D1提前交付与D2没有真正做完都会被拒绝，失败不跳拍', () => {
  const data = 数据('继续关系');
  const { result: start } = 开始D1(data, '把决定留给她', 40);
  assert.match(日常.许曼君离婚后日常正文越界原因(start.事件, D2正文[start.主题]), /D1|提前|尚未/u);
  const badD1 = 日常.提交许曼君离婚后日常事件(data, start.事件, D2正文[start.主题], '201', 40, ['201'], []);
  assert.equal(badD1.成功, false);
  assert.equal(data.系统._许曼君离婚后日常.阶段, '空闲');

  assert.equal(日常.提交许曼君离婚后日常事件(data, start.事件, D1正文[start.主题], '201', 40, ['201'], []).成功, true);
  const d2 = 日常.执行许曼君离婚后日常动作(data, '把今天这件事做完', '201', 41);
  assert.match(日常.许曼君离婚后日常正文越界原因(d2.事件, '她看了看东西，说以后再弄。'), /没有完成|拒绝/u);
  assert.equal(日常.提交许曼君离婚后日常事件(data, d2.事件, '她看了看东西，说以后再弄。', '201', 41, ['201'], []).成功, false);
  assert.equal(data.系统._许曼君离婚后日常.阶段, '待收针');
  assert.equal(data.系统._许曼君离婚后日常.累计次数, 0);
});

test('错地点、错误演员、丈夫混入、迟到票和重复D2均失败关闭', () => {
  const data = 数据('继续关系');
  const { result: start } = 开始D1(data, '把决定留给她', 50);
  assert.match(日常.许曼君离婚后日常演员错误(start.事件, ['201', '202'], []), /妻子/u);
  assert.match(日常.许曼君离婚后日常演员错误(start.事件, ['201'], ['201']), /丈夫/u);
  assert.equal(日常.提交许曼君离婚后日常事件(data, start.事件, D1正文[start.主题], '大堂', 50, ['201'], []).成功, false);
  data.系统._绝对时段 += 1;
  assert.equal(日常.提交许曼君离婚后日常事件(data, start.事件, D1正文[start.主题], '201', 50, ['201'], []).成功, false);
  data.系统._绝对时段 -= 1;
  assert.equal(日常.提交许曼君离婚后日常事件(data, start.事件, D1正文[start.主题], '201', 50, ['201'], []).成功, true);
  const { start: d2 } = 完成D2(data, 51);
  assert.equal(日常.提交许曼君离婚后日常事件(data, d2.事件, D2正文[start.主题], '201', 51, ['201'], []).成功, false);
  assert.equal(data.系统._许曼君离婚后日常.累计次数, 1);
});

test('主题按成功次数稳定轮换且保存最近三项；刷新、D1失败与重掷不换题', () => {
  const data = 数据('继续关系', 3);
  const seen = [];
  for (let index = 0; index < 4; index += 1) {
    const first = 当前父动作(data).主题;
    assert.equal(当前父动作(data).主题, first);
    seen.push(first);
    成功一次(data, '把决定留给她', 60 + index * 2);
    data.系统._绝对时段 = data.系统._许曼君离婚后日常.下次可用时段;
  }
  assert.deepEqual(seen, ['给自己改衣服', '重排201', '给自己留一笔生活钱', '给自己改衣服']);
  assert.deepEqual(data.系统._许曼君离婚后日常.近期主题, ['重排201', '给自己留一笔生活钱', '给自己改衣服']);
});

test('暂不承诺不升级，退出关系的恋爱、留宿和身体亲密文本被硬拒绝', () => {
  const pending = 数据('暂不承诺');
  const { result: pendingStart } = 开始D1(pending, '陪她把这件事做完', 70);
  assert.match(日常.许曼君离婚后日常正文越界原因(pendingStart.事件, '她要求玩家正式同居，一辈子只属于彼此。'), /暂不承诺/u);
  assert.equal(日常.提交许曼君离婚后日常事件(pending, pendingStart.事件, D1正文[pendingStart.主题], '201', 70, ['201'], []).成功, true);
  完成D2(pending, 71);
  assert.equal(pending.系统._许曼君分居.玩家最终关系选择, '暂不承诺');

  const exit = 数据('退出关系');
  const { result: exitStart } = 开始D1(exit, '只处理201房务', 72);
  assert.match(日常.许曼君离婚后日常正文越界原因(exitStart.事件, '两人拥抱接吻，她邀请玩家留宿复合。'), /退出关系/u);
  assert.equal(exit.系统._许曼君分居.留宿201权限, false);
  assert.deepEqual(离婚.许曼君离婚地点动作(exit, '201'), []);
});

test('生活整备只替下一次普通精力行动结算一次，不叠层、不影响亲密体力', () => {
  const data = 数据('继续关系', 3);
  成功一次(data, '陪她把这件事做完', 80);
  data.玩家资源.精力.当前值 = 0;
  const gate = 资源.行动资源门槛(data, '检查楼道灯泡');
  assert.equal(gate.可行动, true);
  assert.equal(gate.种类, '精力');
  assert.match(gate.提示, /整备/u);
  assert.equal(日常.消耗许曼君201生活整备(data), true);
  assert.equal(data.系统._许曼君离婚后日常.生活整备可用, false);
  assert.equal(日常.消耗许曼君201生活整备(data), false);
  assert.equal(资源.行动资源门槛(data, '继续性交').种类, '体力');
});

test('生活整备以零精力放行的普通动作若正文越界成亲密，整轮失败且不吞凭证或借出零体力', () => {
  const data = 数据('继续关系', 3);
  成功一次(data, '陪她把这件事做完', 84);
  data.玩家资源.精力.当前值 = 0;
  data.玩家资源.体力.当前值 = 0;
  const old = lodash.cloneDeep(data);
  assert.equal(资源.行动资源门槛(data, '陪她看看窗边').可行动, true);
  assert.throws(
    () =>
      资源.结算成功现场楼(data, old, {
        场景: '201',
        楼层: 86,
        行动: '陪她看看窗边',
        正文: '许曼君忽然接受了正式性交，两个人开始阴道交合。',
        本楼事件: '',
        妻在场: ['201'],
        实际尺度: { 201: 3 },
        尺度判定: { 201: { 请求: 3, 实际: 3, 许可上限: 5, 越界原因: '' } },
        资源计费: true,
      }),
    /生活整备只允许普通精力行动/u,
  );
  assert.equal(data.系统._许曼君离婚后日常.生活整备可用, true);
  assert.equal(data.玩家资源.体力.当前值, 0);
  assert.equal(data.系统._性爱场景.状态, '空闲');
});

test('反馈到期前不可编译，真实持久送达收据幂等移除待办', () => {
  const data = 数据('继续关系', 3);
  成功一次(data, '把决定留给她', 90);
  assert.deepEqual(日常.许曼君离婚后日常待发送反馈(data), []);
  data.系统._绝对时段 = 4;
  const pending = 日常.许曼君离婚后日常待发送反馈(data);
  assert.equal(pending.length, 1);
  assert.match(pending[0].消息键, /^许曼君离婚后日常:/u);
  assert.equal(日常.提交许曼君离婚后日常反馈已送达(data, pending[0].消息键), true);
  assert.equal(日常.提交许曼君离婚后日常反馈已送达(data, pending[0].消息键), false);
});

test('医院、亲密、电话、强剧情、错误地点和不合适时段全部隐藏入口', () => {
  const cases = [
    d => { d.系统._性爱场景.状态 = '进行中'; },
    d => { d.系统._父亲通话.标识 = 'call'; },
    d => { d.系统._待接来电.期 = 1; },
    d => { d.系统._特殊场景.id = 'other'; },
    d => { d.系统._荣耀洞拍 = 0; },
    d => { d.户['201'].妻._生产.状态 = '住院中'; },
    d => { d.系统._场景剧情事务.id = 'other'; },
  ];
  for (const mutate of cases) {
    const data = 数据();
    mutate(data);
    assert.deepEqual(日常.许曼君离婚后日常地点动作(data, '201'), []);
  }
  assert.deepEqual(日常.许曼君离婚后日常地点动作(数据('继续关系', 0), '201'), []);
  assert.deepEqual(日常.许曼君离婚后日常地点动作(数据(), '大堂'), []);
});

test('生产接线使用独立事件总线、手机持久收据和安全无新增CG设计', () => {
  const source = read('src/人妻公寓/脚本/游戏逻辑/许曼君离婚后日常系统.ts');
  const room = read('src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const phone = read('src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');
  const design = read('src/人妻公寓/许曼君201离婚后新日常_设计与落地_2026-09-04.md');
  assert.doesNotMatch(source, /output\/imagegen|local-insets|presentation-with-inset|XMJ-DIV-06/u);
  assert.doesNotMatch(source, /_性爱场景\s*=|_已完成特殊场景\.push/u);
  assert.match(room, /许曼君离婚后日常动作/u);
  assert.match(index, /人妻公寓:许曼君离婚后日常动作/u);
  assert.match(index, /提交许曼君离婚后日常事件/u);
  assert.match(phone, /编译许曼君离婚后日常手机通知/u);
  assert.match(design, /两个有效AI回合/u);
  assert.match(design, /生活整备/u);
  assert.match(design, /不新增CG/u);
});
