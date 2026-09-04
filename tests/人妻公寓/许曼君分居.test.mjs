/* eslint-disable import-x/no-nodejs-modules -- Node-only behavior regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({ _场景: { 房间id: '201' } });
globalThis.insertOrAssignVariables = () => undefined;
globalThis.getLastMessageId = () => 90;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const db = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[db] = { id: db, filename: db, loaded: true, exports: { 同步社交轨迹: () => undefined } };

const YAML = require('yaml');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买, 取货架 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const {
  许曼君分居任务ID,
  许曼君会面通知ID,
  许曼君钥匙封存袋ID,
  许曼君分居已上架,
  许曼君分居地点动作,
  执行许曼君分居地点动作,
  提交许曼君分居剧情事件,
  解析许曼君分居剧情事件,
  排入许曼君分居后续剧情,
  读取许曼君分居档案提示,
  许曼君分居时间动作阻断原因,
  许曼君分居房间背景文件,
  许曼君分居正文越拍原因,
} = require('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts');

const initvar = YAML.parse(readFileSync(new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url), 'utf8'));
const schemaJson = JSON.parse(readFileSync(new URL('../../src/人妻公寓/schema.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/许曼君分居系统.ts', import.meta.url), 'utf8');
const roomSource = readFileSync(new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function fresh() {
  const data = Schema.parse({ 户: { 201: 创建户节点(0) }, 现金: 12000 });
  data.户['201'].妻.当前阶段 = 5;
  data.户['201'].妻.阶段性癖 = 户静态表['201'].招牌性癖;
  data.系统._已完成特殊场景.push('肉偿账本');
  return data;
}

function clone(data) {
  return Schema.parse(lodash.cloneDeep(data));
}

function findInitialWindow(data) {
  for (let abs = 0; abs < 6 * 42; abs += 1) {
    data.系统._绝对时段 = abs;
    if (许曼君分居地点动作(data, '201').some(item => item.id === '开始第一幕初谈')) return abs;
  }
  assert.fail('必须能找到许曼君在201、丈夫真实外出的初谈窗口');
}

test('Schema、schema.json与initvar共用四幕版本2默认值，不保留旧33阶段字段', () => {
  const parsed = Schema.parse({}).系统._许曼君分居;
  assert.deepEqual(parsed, initvar.系统._许曼君分居);
  assert.equal(parsed.方案版本, 2);
  assert.equal(parsed.阶段, '未开始');
  assert.equal(parsed.共同夜晚状态, '未邀请');
  assert.equal(parsed.会面通知位置, undefined);
  assert.equal(parsed.封存袋位置, undefined);
  const routeJson = schemaJson.properties.系统.properties._许曼君分居;
  assert.equal(routeJson.properties.方案版本.const, 2);
  assert.deepEqual(routeJson.properties.阶段.enum, [
    '未开始', '待初谈', '待三人摊牌', '待登记外住', '独住观察中', '待独住后谈话',
    '待最终取物', '等待私下决定', '待私下决定', '待管理员室交接', '待钥匙转交接', '已完成',
  ]);
  assert.equal(routeJson.properties.会面通知位置, undefined);
  assert.equal(routeJson.properties.封存袋位置, undefined);
});

test('L5、交易快感与肉偿账本后零元上架；购买只进入待初谈且不生成旧路线物件', () => {
  const data = fresh();
  assert.equal(许曼君分居已上架(data), true);
  assert.ok(取货架(data).flatMap(page => page.商品.map(item => item.id)).includes(许曼君分居任务ID));
  assert.equal(购买(data, 许曼君分居任务ID).成功, true);
  assert.equal(data.系统._许曼君分居.阶段, '待初谈');
  assert.equal(data.背包.includes(许曼君会面通知ID), false);
  assert.equal(data.背包.includes(许曼君钥匙封存袋ID), false);
  assert.equal(许曼君分居已上架(data), false);
});

test('第一幕只能在201且丈夫真实外出时出现；医院和错场失败不改写当前检查点', () => {
  const data = fresh();
  购买(data, 许曼君分居任务ID);
  findInitialWindow(data);
  assert.equal(许曼君分居地点动作(data, '管理员室').some(item => item.id === '开始第一幕初谈'), false);
  const opening = 执行许曼君分居地点动作(data, '开始第一幕初谈', '201');
  const before = clone(data);
  const wrong = 提交许曼君分居剧情事件(data, opening.事件, '管理员室', 1, '我在听。');
  assert.equal(wrong.成功, false);
  assert.deepEqual(data, before);
  data.户['201'].妻._生产.状态 = '住院中';
  const hospital = 提交许曼君分居剧情事件(data, opening.事件, '201', 1, '我在听。');
  assert.equal(hospital.成功, false);
  assert.equal(data.系统._许曼君分居.当前拍, 0);
});

test('剧情票逐拍排队且旧A1/A3/A5/A6票不能认领四幕状态', () => {
  const data = fresh();
  购买(data, 许曼君分居任务ID);
  findInitialWindow(data);
  const opening = 执行许曼君分居地点动作(data, '开始第一幕初谈', '201');
  const first = 提交许曼君分居剧情事件(data, opening.事件, '201', 1, '我在听。');
  assert.equal(first.成功, true);
  assert.ok(first.后续剧情?.事件);
  排入许曼君分居后续剧情(data, first);
  排入许曼君分居后续剧情(data, first);
  const tickets = data.系统._待发送事件.split('|').filter(Boolean);
  assert.equal(tickets.length, 1, '重复排队必须幂等');
  assert.equal(解析许曼君分居剧情事件(tickets[0]).场景, '第一幕初谈');
  assert.equal(解析许曼君分居剧情事件('【许曼君分居提交:A3:2】旧票'), null);
});

test('跨检查点只有登记外住和最终改钥匙会锁时间，正常跨日等待仍释放其他玩法', () => {
  const data = fresh();
  data.系统._许曼君分居.阶段 = '待登记外住';
  assert.match(许曼君分居时间动作阻断原因(data), /管理员室|封存/);
  data.系统._许曼君分居.阶段 = '独住观察中';
  data.系统._许曼君分居.独住夜起点 = 10;
  assert.equal(许曼君分居时间动作阻断原因(data), '');
  data.系统._许曼君分居.阶段 = '等待私下决定';
  assert.equal(许曼君分居时间动作阻断原因(data), '');
  data.系统._许曼君分居.阶段 = '待钥匙转交接';
  assert.match(许曼君分居时间动作阻断原因(data), /待离婚交接/);
});

test('背景、档案和生产接线都读取新检查点，不再要求信箱、大堂、公寓外部或第二次封存', () => {
  const data = fresh();
  data.系统._许曼君分居.阶段 = '待最终取物';
  data.系统._许曼君分居.钥匙位置 = '管理员室201钥匙格';
  data.系统._许曼君分居.钥匙用途 = '临时外住';
  data.系统._许曼君分居.封条完整 = true;
  data.系统._许曼君分居.封条修订 = 1;
  data.系统._许曼君分居.独住环境已确认 = true;
  data.系统._许曼君分居.共同夜晚状态 = '待接受';
  assert.equal(许曼君分居房间背景文件(data, '201'), '201_分居_独住');
  assert.match(读取许曼君分居档案提示(data).补充, /共同夜晚/);
  assert.match(source, /登记201临时外住并封存住户钥匙/);
  assert.doesNotMatch(source, /待A3取袋|待A5大堂|待第二次封存|确认最终离楼/);
  assert.match(roomSource, /许曼君分居地点动作/);
  assert.match(indexSource, /执行许曼君分居地点动作/);
});

test('越拍检查区分四幕边界，取物当天不能直接替妻子或丈夫完成最终决定', () => {
  assert.match(许曼君分居正文越拍原因('【许曼君分居提交:第一幕初谈:1】', '赵国强已经外住，钥匙已经封存。'), /第一幕/);
  assert.match(许曼君分居正文越拍原因('【许曼君分居提交:第四幕取物提案:3】', '许曼君决定离婚，赵国强也同意离婚。'), /取物当天/);
  assert.match(许曼君分居正文越拍原因('【许曼君分居提交:第四幕私下决定:2】', '丈夫已经同意办理，钥匙改成待离婚交接。'), /管理员室/);
  assert.equal(许曼君分居正文越拍原因('【许曼君分居提交:第四幕取物提案:2】', '他提出减少长途和固定参与生活。'), '');
});
