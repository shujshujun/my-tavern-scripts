/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
// v0.80 正文完整性与两条外置变量解析时序回归锁。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const { 登记内部删楼租约, 消费内部删楼事件 } = require('../../src/人妻公寓/脚本/游戏逻辑/时间线切换协调.ts');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 协调源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/时间线切换协调.ts', import.meta.url), 'utf8');
const 预设兼容源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/预设输出兼容.ts', import.meta.url), 'utf8');

test('修1:预设期望标签缺失时回退通用清洗，不得整篇清空正文', () => {
  assert.match(预设兼容源码, /已回退通用清洗以保住正文/);
  assert.match(预设兼容源码, /已回退采用 <\$\{正文标签\}> 包裹的正文/, '模型混用其他预设正文标签时应就地采纳');
  assert.match(
    预设兼容源码,
    /正文已开始: 正文标签 !== null/,
    '回退时流式安全门必须保持关闭，开标签到达前不向界面放行',
  );
});

test('修2:完整空JSONPatch是合法完成信号，不让无变化回合白等120秒', () => {
  assert.match(回合源码, /function 取变量块\(文本: string\)/);
  assert.match(回合源码, /if \(完整\) return 完整;/, '完整标签块包含空数组时也应被提取');
  assert.match(回合源码, /Date\.now\(\) < 外置解析截止 &&\s*!取变量块\(外置后正文\) &&/);
  assert.doesNotMatch(回合源码, /function 有可用变量命令|function 含可改变量命令/);
});

test('修3:变量块被未闭合思考段连坐吞掉时启用防过删兜底', () => {
  assert.match(回合源码, /function 宽松提取完整变量块\(文本: string, 严格可解析文本: string\)/);
  assert.match(回合源码, /清除变量禁区\(文本, false\)/, '兜底只放过"吞未闭合尾段"，已闭合禁区仍必须清');
  assert.match(回合源码, /function 清除变量禁区\(文本: string, 吞未闭合尾段 = true\)/);
  assert.match(
    回合源码,
    /兜底④[\s\S]{0,260}宽松提取完整变量块\(文本, 可解析文本\)/,
    '取变量块 的最后一道兜底必须走宽松提取',
  );
  assert.match(
    回合源码,
    /const 宽松完整 = 宽松提取完整变量块\(文本, 可解析文本\);\s*if \(宽松完整\)/,
    '当前两条外置路线共用取变量块的防过删口径',
  );
});

test('修4:数据库代发与自定义解析都受同一超时门保护，超时只放弃变量更新', () => {
  assert.match(回合源码, /const 内置变量解析超时毫秒 = 180_000;/);
  assert.match(回合源码, /generateRaw\([\s\S]{0,900}超时门/);
  assert.match(回合源码, /Promise\.race\(\[\s*通过数据库生成\(/, '数据库代发也必须进入超时竞速');
  assert.match(回合源码, /stopGenerationById\(生成id\)/, '超时要主动停掉悬空的底层请求');
  assert.match(回合源码, /__RQGY_MVUVARS_TIMEOUT__/);
  assert.match(
    回合源码,
    /__RQGY_MVUVARS_TIMEOUT__[\s\S]{0,400}return \{ 结果: '失败' \};/,
    '超时路径返回解析失败，由回合保留正文与旧值',
  );
  assert.match(回合源码, /finally \{\s*clearTimeout\(超时句柄\);/);
  assert.doesNotMatch(回合源码, /补模型变量结算|二次变量结算开启/);
});

test('修5:外置解析走轮询等待，不得在跨脚本桥返回后立即读楼层', () => {
  assert.match(回合源码, /const 外置解析等待毫秒 = 120_000;/);
  assert.match(回合源码, /const 外置解析截止 = Date\.now\(\) \+ 外置解析等待毫秒;/);
  assert.match(
    回合源码,
    /while \(\s*Date\.now\(\) < 外置解析截止 &&\s*!取变量块\(外置后正文\) &&/,
    '楼层出现完整变量块或变量数据变化前必须持续等待',
  );
  assert.match(
    回合源码,
    /await new Promise\(resolve => setTimeout\(resolve, 500\)\);\s*确认本轮事务有效\(\);/,
    '每拍轮询都要复核事务有效性，玩家中途回档时立即放弃',
  );
});

test('修6:内部删楼迟到宽限放宽到10秒，迟到事件在宽限内仍被识别为内部删楼', () => {
  assert.match(协调源码, /const 内部删楼迟到宽限毫秒 = 10_000;/);

  const 租约 = 登记内部删楼租约([42, 42, 43]);
  租约.完成();
  // deleteChatMessages 的宿主事件晚于 Promise 结束到达:宽限期内必须逐一命中。
  assert.equal(消费内部删楼事件(42), true);
  assert.equal(消费内部删楼事件(42), true);
  assert.equal(消费内部删楼事件(43), true);
  assert.equal(消费内部删楼事件(43), false, '计数耗尽后同楼层的真实原生删除不得被吞');
  assert.equal(消费内部删楼事件(44), false, '未登记楼层的原生删除不得被吞');
});
