/* eslint-disable import-x/no-nodejs-modules -- 真实生产提交入口与状态所有者；语义观察为明确测试夹具，不声称模型实测。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as ts from 'typescript';
import lodash from 'lodash';
import { host, clone } from './helpers/离婚主入口环境.mjs';
import { firstDecision, finalDecision } from './helpers/分居决定验收环境.mjs';

const game = 'src/人妻公寓/脚本/游戏逻辑/';
function extracted(file, names, deps, prefix = '') {
  const text = readFileSync(new URL(file, import.meta.url), 'utf8');
  const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const statements = names.map(name => {
    const item = tree.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
    assert.ok(item, name); return item.getText(tree);
  });
  const js = ts.transpileModule(prefix + statements.join('\n') + `\nreturn {${names.join(',')}};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return Function(...Object.keys(deps), js)(...Object.values(deps));
}
function setup(f, player = '我会按刚才商量的去做。', body = '她听完回应，把眼前这一步处理完。', choices = {}) {
  const e = f.e ?? host();
  const wire = e.load(game + '自然对话接入.ts'), protocol = e.load(game + '自然对话观察.ts');
  const schema = e.load('src/人妻公寓/schema.ts');
  const data = schema.Schema.parse(clone(f.data));
  const source = f.floor ?? 120, resultFloor = source + 2;
  data.系统._数据版本 = schema.当前MVU数据版本;
  data.系统._序章完成 = true;
  const active = e.scene.激活新增场景剧情(data, { 内容: f.event, 目标场景: f.room, 行动: player, 触发楼层: source });
  assert.equal(active.成功, true, active.提示);
  const txn = data.系统._场景剧情事务;
  txn.状态 = '生成中';
  const req = wire.构造自然场景请求(data, txn.内容, player, body, 'fixture:branch', 'fixture:122');
  const quote = m => ({ 消息: m.id, 原文: m.文本 });
  const value = { 版本: 1, 事件: req.事件, 阶段: req.阶段, 分支: req.分支, 批次: req.批次,
    状态: '完成', 意向: '未明确', 依据: [quote(req.消息.at(-1))], 意向依据: [], 已谈主题: [],
    选择: Object.fromEntries(Object.entries(choices).map(([key, 值]) => [key, { 值, 依据: [quote(req.消息[0])] }])) };
  const record = protocol.新建对话观察记录(req, value);
  assert.equal(record.技术状态, '已识别', JSON.stringify(req.选择项));
  record.提交上下文 = { 楼层: resultFloor, 场景: f.room, 时段: data.系统._绝对时段,
    事务ID: txn.id, 请求世代: txn.请求世代, 妻在场: [f.room], 夫在场: f.husbands ?? [],
    事件: { 楼层: resultFloor, 内容: txn.内容, 来源: '待发送', 待发送快照: data.系统._待发送事件 },
    日常提交锚: e.load(game + '许曼君离婚后日常系统.ts').冻结许曼君日常提交锚(data, txn.内容, source, resultFloor), 实际尺度: {}, 资源计费: false };
  txn.状态 = '待续'; wire.保存自然对话记录(data, record);
  return { e, data, record, run: () => e.main.提交已保存自然对话(data, record) };
}

for (const [value, player] of [['当面在场', '你们谈的时候，我就在旁边听着。'], ['先夫妻谈', '你们先聊，我到楼下等消息。']]) {
  test(`分居：当前玩家自由表达映射为${value}，真实所有者保存决定`, () => {
    const s = setup(firstDecision(), player, '她依照这个安排开始谈话。', { 初谈参与方式: value });
    s.run(); assert.equal(s.data.系统._许曼君分居.初谈参与方式, value);
    assert.throws(s.run, /事务已经变化/);
  });
}
for (const value of ['继续关系', '退出关系', '暂不承诺']) {
  test(`分居：最终选择${value}进入真实分支，角色文本不能替换选择`, () => {
    const s = setup(finalDecision(), `我选择${value}。`, '她记下了这个决定。', { 最终关系选择: value });
    s.run(); assert.equal(s.data.系统._许曼君分居.玩家最终关系选择, value);
  });
}

test('不必停：语义完成收束关门节点，待续不伪造完成', () => {
  const e = host(), { Schema, 创建户节点 } = e.load('src/人妻公寓/schema.ts');
  const data = Schema.parse({ 户: { 301: 创建户节点(0) } });
  Object.assign(data.系统._安若妍不必停, { 阶段: 'H8中', 当前场景: 'H8关门', 当前拍: 1 });
  data.系统._安若妍不必停.绑定亲密场次标识 = 'existing-session';
  Object.assign(data.系统._性爱场景, { 状态: '进行中', 场次标识: 'existing-session', 参与者: { 301: {} } });
  const s = setup({ e, data, event: '【安若妍不必停提交:H8关门:1】', room: '301', husbands: ['301'] });
  const before = JSON.stringify(s.data);
  s.record.结果.状态 = '待续'; assert.throws(s.run, /凭据/); assert.equal(JSON.stringify(s.data), before);
  s.record.结果.状态 = '完成'; s.run(); assert.equal(s.data.系统._安若妍不必停.H8完成, true);
});

test('不再留门：真实路线的决定拍接受有当前玩家依据的许可', () => {
  const e = host(), schema = e.load('src/人妻公寓/schema.ts');
  const route = e.load(game + '不再留门系统.ts');
  const f = extracted('./不再留门当前许可_PLAY021.test.mjs', ['act', 'waitFor', 'beat', 'scene', 'atDecision'],
    { assert, lodash, ...schema, route, ...e.load('src/人妻公寓/不再留门契约.ts'), ...e.load(game + '玩家资源系统.ts') }, 'let floor=1;\n').atDecision();
  const s = setup({ e, data: f.d, event: f.event, room: '202' }, '这件事我已经想清楚，就这样定下来。', '她确认了眼前这个决定。', { 本步玩家许可: '确认' });
  const old = JSON.stringify(s.data.系统._不再留门);
  s.run(); assert.notEqual(JSON.stringify(s.data.系统._不再留门), old);
});

for (const topic of ['给自己改衣服', '重排201', '给自己留一笔生活钱']) {
  test(`离婚后日常：${topic}通过生产入口提交且不重复结算`, () => {
    const e = host(), schema = e.load('src/人妻公寓/schema.ts'), daily = e.load(game + '许曼君离婚后日常系统.ts');
    const f = extracted('./许曼君201离婚后日常.test.mjs', ['数据'], { ...schema, 离婚: e.load(game + '许曼君离婚系统.ts') });
    const data = f.数据();
    // 主题按正式轮转序号选定；保留真实动作、正文来源和提交锚。
    data.系统._许曼君离婚后日常.累计次数 = ['给自己改衣服', '重排201', '给自己留一笔生活钱'].indexOf(topic);
    const start = daily.执行许曼君离婚后日常动作(data, '把决定留给她', '201', 120);
    assert.equal(start.成功, true, start.提示);
    const s = setup({ e, data, event: start.事件, room: '201' });
    s.run(); assert.equal(s.data.系统._许曼君离婚后日常.当前主题, topic);
    assert.throws(s.run, /事务已经变化/);
    const count = s.data.系统._许曼君离婚后日常.累计次数;
    const d2 = daily.执行许曼君离婚后日常动作(s.data, '把今天这件事做完', '201', 124);
    assert.equal(d2.成功, true, d2.提示);
    const finish = setup({ e, data: s.data, event: d2.事件, room: '201', floor: 124 });
    finish.run();
    assert.equal(finish.data.系统._许曼君离婚后日常.累计次数, count + 1);
    assert.equal(finish.data.系统._许曼君离婚后日常.阶段, '空闲');
    assert.throws(finish.run, /事务已经变化/);
  });
}

test('双重继承：既有状态的钥匙收束由生产所有者结算', () => {
  const e = host();
  const deps = { assert, ...e.load('src/人妻公寓/schema.ts'), ...e.load(game + '双重继承系统.ts'),
    ...e.load(game + '母亲视频通话系统.ts'), ...e.load(game + '母亲视频通话CG语义.ts') };
  const f = extracted('./双重继承.test.mjs', ['建数据', '准备完整视频终幕', '完成到钥匙收束'], deps);
  const data = f.建数据(); f.完成到钥匙收束(data);
  const action = deps.执行双重继承地点动作(data, '归位总钥匙', '302', 120);
  assert.equal(action.成功, true, action.提示);
  const s = setup({ e, data, event: action.事件, room: '302' });
  s.run(); assert.equal(s.data.系统._双重继承.阶段, '已完成');
});

test('冷落安抚：依据玩家当前行动推进一次；角色自说自话不计入', () => {
  const e = host(), { Schema, 创建户节点 } = e.load('src/人妻公寓/schema.ts');
  const wire = e.load(game + '自然对话接入.ts'), p = e.load(game + '自然对话观察.ts');
  const data = Schema.parse({ 户: { 201: 创建户节点(0) } });
  Object.assign(data.户['201'].妻._冷落余波, { 状态: '安抚中', 需安抚楼: 3, 已安抚楼: 1 });
  const req = wire.构造安抚观察请求(data, '201', '我把手机放下，搬了把椅子坐到你旁边，听你慢慢说。', '她把今天的事情说给你听。', 'branch', '122');
  const base = { 版本: 1, 事件: req.事件, 阶段: req.阶段, 分支: req.分支, 批次: req.批次, 状态: '完成', 意向: '未明确', 意向依据: [], 选择: {}, 已谈主题: [] };
  const role = p.新建对话观察记录(req, { ...base, 依据: [{ 消息: req.消息[1].id, 原文: req.消息[1].文本 }] });
  assert.equal(p.自然对话可提交(role), false);
  const record = p.新建对话观察记录(req, { ...base, 依据: [{ 消息: req.消息[0].id, 原文: req.消息[0].文本 }] });
  record.提交上下文 = { 楼层: 122, 时段: 0, 妻在场: ['201'] };
  e.main.提交已保存自然对话(data, record);
  assert.equal(data.户['201'].妻._冷落余波.已安抚楼, 2);
  assert.throws(() => e.main.提交已保存自然对话(data, record), /阶段已经变化/);
});
