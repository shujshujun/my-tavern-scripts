/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
let 聊天变量 = {};
globalThis.getVariables = () => 聊天变量;

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 检测焦点, 组公寓快照 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const {
  构造AI可写变量范围,
  构造AI可写变量视图,
  解析候选亲密妻,
  扩展精确亲密妻,
} = require('../../src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');

const 妻名 = {
  101: '夏乔',
  102: '沈静仪',
  201: '许曼君',
  202: '周小满',
  301: '安若妍',
};

function 建数据(门牌们) {
  const data = Schema.parse({ 户: Object.fromEntries(门牌们.map(门牌 => [门牌, 创建户节点(4)])) });
  for (const 门牌 of 门牌们) data.户[门牌].妻.当前阶段 = 4;
  return data;
}

function 设置场景(房间id, 门牌们) {
  聊天变量 = {
    _场景: { 房间id, 进房末楼: 8 },
    _粘滞: { 位置: 房间id, 楼: 8, 们: [...门牌们], 夫们: [] },
  };
}

function 设置亲密(data, 门牌们, 主焦点门牌) {
  data.系统._性爱场景 = {
    状态: '进行中',
    场次标识: `snapshot-${门牌们.join('-')}`,
    开始楼层: 8,
    有效楼数: 2,
    本场等级加成: 1,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌,
    参与者: Object.fromEntries(
      门牌们.map(门牌 => [门牌, { 满意度: 1, 满意目标: 3, 偏好命中: [], 等级加成已用: false }]),
    ),
  };
}

test('单人亲密只说继续时仍按亲密快照处理，不会落回日常提示', () => {
  const data = 建数据(['101']);
  设置场景('101', ['101']);
  设置亲密(data, ['101'], '101');

  const 快照 = 组公寓快照([{ role: 'user', content: '继续。' }], data, 10);
  assert.match(快照, /【亲密场景·持续】/);
  assert.match(快照, /◆ 夏乔\(101室\)\|本人在场\|阶段:/);
  assert.match(快照, /【夏乔的界线】/);
  assert.match(快照, /【尺度判定·详】/);
  assert.doesNotMatch(快照, /【本轮性质·日常】/);
});

test('双人亲密按持久主焦点排序，同时给两名参与者本人状态与界线', () => {
  const data = 建数据(['101', '102']);
  设置场景('管理员室', ['101', '102']);
  设置亲密(data, ['101', '102'], '102');

  const 快照 = 组公寓快照([{ role: 'user', content: '继续当前节奏。' }], data, 10);
  const 沈位置 = 快照.indexOf('◆ 沈静仪(102室)|本人在场');
  const 夏位置 = 快照.indexOf('◆ 夏乔(101室)|本人在场');
  assert.ok(沈位置 >= 0 && 夏位置 > 沈位置, '主焦点必须排在非焦点参与者之前');
  assert.match(快照, /【沈静仪的界线】/);
  assert.match(快照, /【夏乔的界线】/);
});

test('多人亲密独立退出后不再授予亲密写权，也不进入持续满意度清单', () => {
  const data = 建数据(['101', '102']);
  设置场景('管理员室', ['101', '102']);
  设置亲密(data, ['101', '102'], '102');
  data.系统._性爱场景.参与者['101'].已退出 = true;
  data.系统._性爱场景.参与者['101'].退出方式 = '角色中止';

  const 对话 = [{ role: 'user', content: '继续当前节奏。' }];
  const 人物 = 检测焦点(对话, data, 10);
  assert.equal(人物.焦点[0], '102', '仍在场的主焦点必须保持第一位');
  const 快照 = 组公寓快照(对话, data, 10, '', 人物);
  const 持续行 = 快照.split('\n').find(行 => 行.includes('【亲密场景·持续】')) ?? '';
  assert.match(持续行, /沈静仪1\/3/);
  assert.doesNotMatch(持续行, /夏乔1\/3/, '已退出者只保留历史账本，不得继续出现在有效满意度列表');

  const 范围 = 构造AI可写变量范围(data, 人物.焦点, 人物.妻在场, 人物.夫在场, {
    只读: false,
    亲密场景: true,
  });
  assert.deepEqual(范围.亲密妻, ['102'], '已退出者不能在下一楼重新取得亲密变量写权');
});

test('多人亲密为每名妻独立注入婚姻人格边界，不能拿主焦点规则覆盖全场', () => {
  const data = 建数据(['101', '102']);
  设置场景('管理员室', ['101', '102']);
  设置亲密(data, ['101', '102'], '101');
  data.户['101'].妻.当前阶段 = 5;
  data.户['101'].妻.婚姻值 = 10;
  data.户['102'].妻.当前阶段 = 3;
  data.户['102'].妻.婚姻值 = 90;

  const 快照 = 组公寓快照([{ role: 'user', content: '继续当前安排。' }], data, 10);

  assert.match(快照, /【夏乔的婚姻与人格】[^\n]*已对关系做出自己的选择/);
  assert.match(快照, /【沈静仪的婚姻与人格】[^\n]*婚姻尚未崩塌/);
});

test('五人亲密不会受通用三户焦点上限截断，每位参与者都有本人状态与界线', () => {
  const 门牌们 = ['101', '102', '201', '202', '301'];
  const data = 建数据(门牌们);
  设置场景('管理员室', 门牌们);
  设置亲密(data, 门牌们, '202');

  const 对话 = [{ role: 'user', content: '让所有人维持刚才的安排。' }];
  const 人物 = 检测焦点(对话, data, 10);
  assert.deepEqual(人物.焦点.slice(0, 5), ['202', '101', '102', '201', '301']);
  assert.deepEqual(人物.妻在场.slice(0, 5), ['202', '101', '102', '201', '301']);
  assert.deepEqual(人物.私聊可召回妻.slice(0, 5), ['202', '101', '102', '201', '301']);

  const 快照 = 组公寓快照(对话, data, 10);
  for (const 门牌 of 门牌们) {
    assert.match(快照, new RegExp(`◆ ${妻名[门牌]}\\(${门牌}室\\)\\|本人在场`), 门牌);
    assert.match(快照, new RegExp(`【${妻名[门牌]}的界线】`), 门牌);
  }
  assert.ok(快照.indexOf('◆ 周小满(202室)|本人在场') < 快照.indexOf('◆ 夏乔(101室)|本人在场'));
  assert.ok(快照.length < 20_000, `五人快照不应无界增长，当前 ${快照.length} 字符`);
});

test('普通多人现场第一楼明确点名两人亲密时，两人进入候选判定范围但不提前获得最终写权', () => {
  const data = 建数据(['101', '102']);
  设置场景('管理员室', ['101', '102']);
  const 对话 = [{ role: 'user', content: '我想和夏乔、沈静仪一起做爱。' }];
  const 人物 = 检测焦点(对话, data, 10, '');

  assert.deepEqual(人物.焦点, ['101', '102']);
  assert.deepEqual(人物.妻在场, ['101', '102']);
  const 快照 = 组公寓快照(对话, data, 10, '', 人物);
  assert.match(快照, /【尺度判定·详】/);
  assert.match(快照, /◆ 夏乔\(101室\)\|本人在场\|阶段:/);
  assert.match(快照, /◆ 沈静仪\(102室\)\|本人在场\|阶段:/);
  const 范围 = 构造AI可写变量范围(data, 人物.焦点, 人物.妻在场, 人物.夫在场, {
    只读: false,
    亲密场景: true,
  });
  assert.deepEqual(范围.妻, ['101', '102']);
  assert.deepEqual(范围.亲密妻, [], '第一楼尚无已确认参与者，不得把详判候选提前写成最终权限');

  const 候选妻 = 解析候选亲密妻(范围);
  assert.deepEqual(候选妻, ['101', '102'], '两名焦点妻都进入逐人尺度判定候选');
  const 候选视图 = 构造AI可写变量视图(data, 范围, 候选妻);
  assert.equal(候选视图.户['101'].妻.堕落值, data.户['101'].妻.堕落值);
  assert.equal(候选视图.户['102'].妻.堕落值, data.户['102'].妻.堕落值);

  assert.deepEqual(
    扩展精确亲密妻(范围, { '101': 1, '102': 0 }).亲密妻,
    ['101'],
    '最终逐人判定只给实际参与的角色补权',
  );
  assert.deepEqual(
    扩展精确亲密妻(范围, { '101': 1, '102': 1 }).亲密妻,
    ['101', '102'],
    '两人最终都实际参与时才同时获得精确权限',
  );
});

test('共同赴约后的群体指代可选中全部在场妻；只点名一人时不会把旁观者自动卷入', () => {
  const data = 建数据(['101', '102', '201']);
  设置场景('管理员室', ['101', '102', '201']);

  const 群体 = 检测焦点([{ role: 'user', content: '让她们一起做爱。' }], data, 10, '');
  assert.deepEqual(群体.焦点, ['101', '102', '201']);

  const 单名 = 检测焦点([{ role: 'user', content: '我只想和夏乔做爱。' }], data, 11, '');
  assert.deepEqual(单名.焦点, ['101']);
  assert.deepEqual(new Set(单名.在场), new Set(['102', '201']));

  聊天变量._粘滞.夫们 = ['102'];
  const 丈夫名 = 户静态表['102'].夫名;
  const 丈夫旁观 = 检测焦点([{ role: 'user', content: `我只和夏乔做爱，让${丈夫名}留在旁边。` }], data, 12, '');
  assert.deepEqual(丈夫旁观.焦点, ['101'], '同户丈夫姓名不得借门牌映射把妻误卷入多人亲密');
});

test('普通单人场景保持精简日常快照，不加载亲密状态和详尺度协议', () => {
  const data = 建数据(['101']);
  设置场景('101', ['101']);
  const 快照 = 组公寓快照([{ role: 'user', content: '和夏乔聊聊今天的楼务。' }], data, 10);

  assert.match(快照, /◆ 夏乔\(101室\)\|本人在场\|本轮:日常互动/);
  assert.match(快照, /【本轮性质·日常】/);
  assert.match(快照, /【尺度判定·简】/);
  assert.doesNotMatch(快照, /【亲密场景·持续】|【尺度判定·详】/);
});

test('普通地图多人场景按玩家本轮点名切换焦点，并保留全部真实在场者', () => {
  const 门牌们 = ['101', '102', '201', '202', '301'];
  const data = 建数据(门牌们);
  设置场景('管理员室', 门牌们);
  const 人物 = 检测焦点([{ role: 'user', content: '我转向周小满，问她刚才看见了什么。' }], data, 10, '');

  assert.equal(人物.焦点[0], '202');
  assert.deepEqual(new Set([...人物.焦点, ...人物.在场]), new Set(门牌们));
});

test('多人现场为未孕角色注入逐对一次的孕肚初见反应，姐妹群已聊过则关闭', () => {
  const data = 建数据(['101', '102']);
  Object.assign(data.户['101'].妻._怀孕, { 状态: '已告知', 受孕场次标识: 'snapshot-pregnancy' });
  data.户['102'].妻.当前阶段 = 2;
  data.户['102'].妻.好感值 = 33;
  data.户['102'].妻.堕落值 = 21;
  data.户['102'].妻.婚姻值 = 76;
  设置场景('管理员室', ['101', '102']);

  const 首次快照 = 组公寓快照([{ role: 'user', content: '大家一起聊聊。' }], data, 10);
  assert.match(首次快照, /【孕情初见·一次性现场反应】/);
  assert.match(首次快照, /沈静仪 → 夏乔/);
  assert.match(首次快照, /好感33、堕落21、婚姻76/);

  聊天变量._微信 = {
    消息: [{ 楼: 9, 时: 0, 会话: '姐妹群', 发: '对方', 文: '沈静仪:恭喜呀', 键: '姐妹孕情:101:snapshot-pregnancy:1' }],
  };
  const 群聊后快照 = 组公寓快照([{ role: 'user', content: '大家继续聊。' }], data, 12);
  assert.doesNotMatch(群聊后快照, /【孕情初见·一次性现场反应】/);
});

test('普通地图多人连续对话会保持上一轮仍在场的焦点，显式点名才切换', () => {
  const 门牌们 = ['101', '102', '201', '202', '301'];
  const data = 建数据(门牌们);
  设置场景('管理员室', 门牌们);
  聊天变量._在场 = { 焦点: ['202'], 在场: ['101', '102', '201', '301'] };

  const 继续 = 检测焦点([{ role: 'user', content: '继续问下去。' }], data, 11, '');
  assert.equal(继续.焦点[0], '202');

  const 切换 = 检测焦点([{ role: 'user', content: '我转向安若妍，问问她的意见。' }], data, 12, '');
  assert.equal(切换.焦点[0], '301');
});

test('地图变量明确为空时不从历史姓名复活上一轮演员', () => {
  const data = 建数据(['101', '102']);
  聊天变量 = { _场景: null, _粘滞: null };
  const 人物 = 检测焦点(
    [
      { role: 'assistant', content: '夏乔在门口向你告别。' },
      { role: 'user', content: '我离开夏乔家，回楼道看看。' },
    ],
    data,
    10,
    '',
  );

  assert.deepEqual(人物.焦点, []);
  assert.deepEqual(人物.妻在场, []);
  assert.deepEqual(人物.夫在场, []);
});

test('多角色特殊场景由结构化事件冻结演员，不把未点名人物混入现场', () => {
  const data = 建数据(['101', '102', '201']);
  设置场景('管理员室', []);
  const 事件 = '【事件在场妻:102,201】【特殊场景·审查场景·1】只允许两名冻结演员完成本拍。';
  const 快照 = 组公寓快照([{ role: 'user', content: '执行本拍。' }], data, 10, 事件);

  assert.match(快照, /◆ 沈静仪\(102室\)\|本人在场/);
  assert.match(快照, /◆ 许曼君\(201室\)\|本人在场/);
  assert.doesNotMatch(快照, /◆ 夏乔\(101室\)\|本人在场/);
  assert.match(快照, /【本轮剧情事件/);
  assert.match(快照, /【特殊场景·审查场景·1】/);
  assert.match(快照, /【尺度判定·详】/);
});

test('录像带与静音会议只注入只读演员快照，屏幕或脚本演出不请求普通尺度结算', () => {
  for (const 场景id of ['录像带', '静音会议']) {
    const data = 建数据(['102', '202']);
    设置场景('管理员室', []);
    data.系统._特殊场景.id = 场景id;
    data.系统._特殊场景.阶段 = '正文';
    data.系统._特殊场景.参与妻 = ['102', '202'];
    const 事件 = `【事件在场妻:102,202】【特殊场景·${场景id}·1】屏幕或设备正在演出成人内容。`;
    const 快照 = 组公寓快照([{ role: 'user', content: '继续这一拍。' }], data, 10, 事件);

    assert.match(快照, /【特殊场景·独立结算】/, 场景id);
    assert.match(快照, /◆ 沈静仪\(102室\)\|本人在场/, 场景id);
    assert.match(快照, /◆ 周小满\(202室\)\|本人在场/, 场景id);
    assert.doesNotMatch(快照, /【尺度判定·(?:简|详)】|<尺度判定/, 场景id);
  }
});

test('未完成楼务逐轮注入硬事实，账上清空后不再出现', () => {
  // 2026-08-03 玩家实测：只到过 101 没点维修，回管理员室正文就自称"已修好下水道"。
  // 快照必须亮出未完成楼务清单，禁止 AI 把挂账任务演成已完成。
  const data = 建数据(['101']);
  设置场景('管理员室', []);
  data.系统._管理考核.活跃任务 = [
    {
      id: '管理-0-下水堵塞-101',
      模板: '下水堵塞',
      类型: '报修',
      级别: '重要',
      地点: '101',
      门牌: '101',
      创建时段: 0,
      截止时段: 4,
      逾期已扣: false,
      来源事件: '',
      公开摘要: '',
    },
  ];

  const 快照 = 组公寓快照([{ role: 'user', content: '回管理员室歇口气。' }], data, 10);
  assert.match(快照, /【楼务·尚未处理】/);
  assert.match(快照, /101住户报修：下水堵塞（重要）/);
  assert.match(快照, /不得把它们描写成已完成或已在进行/);

  data.系统._管理考核.活跃任务 = [];
  const 空快照 = 组公寓快照([{ role: 'user', content: '回管理员室歇口气。' }], data, 10);
  assert.doesNotMatch(空快照, /【楼务·尚未处理】/);
});

test('跨户丈夫打断:玩家已明确切到另一户,当前焦点继续作主焦点,原户事件降为次要并注入跨场承接纪律', () => {
  // 2026-08-08 第二批修复:四类丈夫打断事件绑定原夫妻,玩家下一楼已明确切到另一户时,
  // 快照曾把旧事件角色排为主焦点,模型会把旧丈夫问题改写到新焦点户头上。
  const data = 建数据(['101', '102']);
  设置场景('102', ['102']);
  const 玩家文本 = '我下楼走进102,向沈静仪打听楼里最近的事。';
  const 事件 = '【事件在场妻:101】【事件关联夫:101】【查岗电话】夏乔的手机响了,来电人:陆嘉明。她压低声音接起,一边留意着屋里的动静。';

  const 人物 = 检测焦点([{ role: 'user', content: 玩家文本 }], data, 10, 事件);
  assert.equal(人物.焦点[0], '102', '玩家明确行动户必须继续作主焦点');
  assert.ok(人物.焦点.includes('101'), '原丈夫事件绑定户仍作为次要事件演员保留在焦点');
  assert.equal(人物.丈夫打断跨角色, true, '跨户丈夫打断必须置跨角色标志');

  const 快照 = 组公寓快照([{ role: 'user', content: 玩家文本 }], data, 10, 事件);
  assert.ok(
    快照.indexOf('◆ 沈静仪(102室)|本人在场') >= 0 && 快照.indexOf('◆ 沈静仪(102室)|本人在场') < 快照.indexOf('◆ 夏乔(101室)|本人在场'),
    '主焦点必须排在原事件户之前',
  );
  assert.match(快照, /【跨场承接】/);
  assert.match(快照, /身份不可替换/);
  assert.match(快照, /独立短镜头/);
  assert.match(快照, /当前焦点夫妻/);
  assert.match(快照, /◆ 夏乔\(101室\)\|本人在场/, '原绑定户妻子状态包保留');
  assert.match(快照, /陆嘉明/, '原绑定户丈夫状态保留');
  assert.match(快照, /【查岗电话】/);
});

test('同户丈夫打断:事件焦点优先排序不变,且不注入跨场承接纪律', () => {
  const data = 建数据(['101']);
  设置场景('101', ['101']);
  const 事件 = '【事件在场妻:101】【事件关联夫:101】【查岗电话】夏乔的手机响了,来电人:陆嘉明。';

  const 人物 = 检测焦点([{ role: 'user', content: '和夏乔继续刚才的话。' }], data, 10, 事件);
  assert.equal(人物.焦点[0], '101', '同户保持事件焦点优先');
  assert.equal(人物.丈夫打断跨角色, undefined, '同户不置跨角色标志');

  const 快照 = 组公寓快照([{ role: 'user', content: '和夏乔继续刚才的话。' }], data, 10, 事件);
  assert.doesNotMatch(快照, /【跨场承接】/);
  assert.match(快照, /【查岗电话】/);
});

test('非丈夫打断事件(含在场妻)保持原有事件焦点优先,不受跨场纪律影响', () => {
  const data = 建数据(['101', '102']);
  设置场景('102', ['102']);
  const 玩家文本 = '我下楼走进102,向沈静仪打听楼里最近的事。';
  const 事件 = '【事件在场妻:101】【事件关联夫:101】夏乔在路上遇见你,想打听楼里新搬来的住户。';

  const 人物 = 检测焦点([{ role: 'user', content: 玩家文本 }], data, 10, 事件);
  assert.equal(人物.焦点[0], '101', '非丈夫事件仍维持原有事件焦点优先');
  assert.equal(人物.丈夫打断跨角色, undefined);
  const 快照 = 组公寓快照([{ role: 'user', content: 玩家文本 }], data, 10, 事件);
  assert.doesNotMatch(快照, /【跨场承接】/);
});
