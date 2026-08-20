/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 构造微信联系保护表 } = require('../../src/人妻公寓/脚本/游戏逻辑/微信每日联系.ts');
const { 创建成长账, 创建余波账 } = require('../../src/人妻公寓/脚本/游戏逻辑/冷落成长核心.ts');
const {
  冷落语义指纹,
  记录本轮有效成长,
  计算妻冷落预警档,
  结算妻冷落,
} = require('../../src/人妻公寓/脚本/游戏逻辑/冷落系统.ts');

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

function 建妻(覆盖 = {}) {
  const 基础 = {
    好感值: 10,
    堕落值: 70,
    当前阶段: 3,
    身体开发: { 小嘴: 0, 胸部: 0, 小屄: 0, 屁穴: 0 },
    _成长账: 创建成长账(0),
    _冷落余波: 创建余波账(),
  };
  return {
    ...基础,
    ...覆盖,
    身体开发: { ...基础.身体开发, ...(覆盖.身体开发 ?? {}) },
    _成长账: { ...基础._成长账, ...(覆盖._成长账 ?? {}) },
    _冷落余波: { ...基础._冷落余波, ...(覆盖._冷落余波 ?? {}) },
  };
}

function 建数据(妻, 绝对时段) {
  return {
    户: { 101: { 妻 } },
    系统: { _母亲入列: false, _绝对时段: 绝对时段 },
  };
}

test('每天任意时段成功写入一条妻子私聊，就保护到次日早晨；群聊、对方消息、未来消息不算', () => {
  const 表 = 构造微信联系保护表(
    [
      { 会话: '101', 发: '我', 时: 1, 文: '早上问候' },
      { 会话: '101', 发: '对方', 时: 7, 文: '她主动发来' },
      { 会话: '群', 发: '我', 时: 8, 文: '群里说话' },
      { 会话: '102', 发: '我', 时: 9, 文: '另一户私聊' },
      { 会话: '101', 发: '我', 时: 11, 文: '', 类: '撤回' },
      { 会话: '201', 发: '我', 时: 13, 文: '未来消息' },
      { 会话: '202', 发: '我', 时: Number.NaN, 文: '损坏时段' },
    ],
    11,
  );

  assert.deepEqual(表, { 101: 12, 102: 12 });
});

test('微信联系只重置冷落周期，不增加成长轮次、不改上次真实成长，也不返还已经扣掉的堕落', () => {
  const 妻 = 建妻({
    _成长账: { 上次有效成长钟楼: 0, 成长轮次: 2, 已结算冷落日: 0 },
  });

  const 联系日结束 = 结算妻冷落('101', 妻, 6, false, 6);
  assert.equal(联系日结束.实际下降, 0);
  assert.equal(妻.堕落值, 70);
  assert.deepEqual(妻._成长账, { 上次有效成长钟楼: 0, 成长轮次: 2, 已结算冷落日: 0 });

  const 漏掉一天 = 结算妻冷落('101', 妻, 12, false, 6);
  assert.equal(漏掉一天.实际下降, 2);
  assert.equal(妻.堕落值, 68);
  assert.equal(妻._成长账.已结算冷落日, 1);

  const 再次联系 = 结算妻冷落('101', 妻, 13, false, 18);
  assert.equal(再次联系.实际下降, 0);
  assert.equal(妻.堕落值, 68, '新联系只能防止以后继续恶化，不能返还此前下降');
  assert.equal(妻._成长账.已结算冷落日, 0, '新的联系周期必须重新计日');
  assert.equal(妻._成长账.成长轮次, 2, '微信联系不是关系成长');
  assert.equal(妻._成长账.上次有效成长钟楼, 0);

  const 再漏一天 = 结算妻冷落('101', 妻, 24, false, 18);
  assert.equal(再漏一天.实际下降, 2, '新联系后漏掉的第一天必须重新按第1日下降');
  assert.equal(妻.堕落值, 66);
});

test('真实成长发生在联系保护日内时仍正常增加成长轮次，但当天保护不会缩短', () => {
  const 旧妻 = 建妻({
    _成长账: { 上次有效成长钟楼: 0, 成长轮次: 3, 已结算冷落日: 0 },
  });
  const 新妻 = 建妻({
    好感值: 11,
    _成长账: { ...旧妻._成长账 },
  });

  const 结果 = 记录本轮有效成长('101', 旧妻, 新妻, 8, false);

  assert.equal(结果.有效, true);
  assert.equal(新妻._成长账.上次有效成长钟楼, 8);
  assert.equal(新妻._成长账.成长轮次, 4);
  assert.equal(计算妻冷落预警档('101', 新妻, 11, false, 12), 0);
  assert.equal(计算妻冷落预警档('101', 新妻, 16, false, 12), 1);
});

test('联系立即改变预警语义周期并压住当天预警，但已经触发的诉苦或安抚不会被手机清除', () => {
  const 普通 = 建妻({
    _成长账: { 上次有效成长钟楼: 0, 成长轮次: 4, 已结算冷落日: 0 },
  });
  assert.equal(计算妻冷落预警档('101', 普通, 10, false), 2);
  assert.equal(计算妻冷落预警档('101', 普通, 10, false, 12), 0);

  const 指纹 = 冷落语义指纹(建数据(普通, 10), '101', { 101: 12 });
  assert.equal(指纹?.冷落周期锚, 12);
  assert.equal(指纹?.当前档, 0);

  for (const 状态 of ['待诉苦', '安抚中']) {
    const 有余波 = 建妻({
      _冷落余波: { 状态, 触发钟楼: 6, 需安抚楼: 3, 已安抚楼: 1 },
    });
    const 结果 = 结算妻冷落('101', 有余波, 10, false, 12);
    assert.equal(结果.实际下降, 0);
    assert.equal(有余波._冷落余波.状态, 状态);
    assert.equal(有余波._冷落余波.已安抚楼, 1);
  }
});

test('手机以当前分支存活消息为唯一联系来源，压缩时保留每户最后一条玩家私聊', () => {
  const 数据层 = 读('src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
  const 内核 = 读('src/人妻公寓/脚本/游戏逻辑/手机/内核.ts');
  const 交互 = 读('src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts');
  const 预警 = 读('src/人妻公寓/脚本/游戏逻辑/手机/冷落预警.ts');

  assert.match(数据层, /当前微信联系保护表\(\)[\s\S]{0,220}构造微信联系保护表\(读库\(\)\.消息/);
  assert.match(数据层, /const 最新玩家联系 = \[\.\.\.原消息\]\.reverse\(\)\.find/);
  assert.match(数据层, /消息 === 最新玩家联系/);
  assert.match(内核, /export \{ 当前微信联系保护表 \} from '\.\/数据层'/);
  assert.match(交互, /const 微信联系保护 = 构造微信联系保护表\(库\.消息, 回复钟\)/);
  assert.match(交互, /计算妻冷落消息档\(data, 门牌号, 微信联系保护\)/);
  assert.match(预警, /构造微信联系保护表\(库\.消息, 钟\)/);
  assert.match(预警, /a\.冷落周期锚 === b\.冷落周期锚/);
});

test('正文、原生、时间推进、等待生产和变量重生成都消费同一份联系保护', () => {
  const 回合 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 入口 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
  const 时间 = 读('src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
  const 重生成 = 读('src/人妻公寓/脚本/游戏逻辑/变量重新生成核心.ts');

  assert.match(回合, /const 本轮微信联系保护 = 当前微信联系保护表\(\)/);
  assert.match(回合, /微信联系保护: _\.cloneDeep\(本轮微信联系保护\)/);
  assert.match(回合, /结算全楼冷落\(newStat, 本轮微信联系保护\)/);
  assert.match(入口, /结算全楼冷落\(newData, 当前微信联系保护表\(\)\)/);
  assert.match(入口, /执行时间推进事务\(候选,[\s\S]{0,220}微信联系保护: 当前微信联系保护表\(\)/);
  assert.match(入口, /执行等待生产事务\(data,[\s\S]{0,220}微信联系保护: 当前微信联系保护表\(\)/);
  assert.equal((时间.match(/结算全楼冷落\(候选, 请求\.微信联系保护\)/g) ?? []).length, 2);
  assert.match(重生成, /票据\.微信联系保护\?\.\[门牌号\]/);
});
