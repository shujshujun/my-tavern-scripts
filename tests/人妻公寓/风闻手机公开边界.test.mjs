/* eslint-disable import-x/no-nodejs-modules -- Node-only source regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// P5:公开风闻摘要/管理任务通知已迁移至 ./手机/通知桥,父亲通话已迁移至 ./手机/交互/父亲通话,
// 相关断言改读新所有者。
// P6:自动群聊已迁至 ./手机/节拍引擎,该断言改读新所有者。
// P7B2:来电页/通话页已迁至 ./壳/渲染/call.ts 与 talk.ts。
const 节拍引擎源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', 'utf8');
const 通知桥源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts', 'utf8');
const 父亲通话源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts', 'utf8');
const 来电页源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/call.ts', 'utf8');
const 通话页源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/talk.ts', 'utf8');

function 截取(源, 开始, 结束) {
  const 起点 = 源.indexOf(开始);
  const 终点 = 源.indexOf(结束, 起点 + 开始.length);
  assert.ok(起点 >= 0 && 终点 > 起点, `找不到源码段：${开始}`);
  return 源.slice(起点, 终点);
}

test('高风闻楼务群只消费模糊公开议题，不读取事件原始摘要', () => {
  const 公开摘要 = 截取(通知桥源, 'export function 编译楼务群公开风闻摘要', 'function 是管理通知任务');
  const 自动群聊 = 截取(节拍引擎源, '// ── 群聊 v1', '// ── 仅你可见');

  assert.doesNotMatch(公开摘要, /事件\.摘要|事件\.门牌|事件\.地点/);
  assert.match(公开摘要, /管理员夜间出入频繁|公共设施和报修处理|个别住户往来过于频繁/);
  assert.match(自动群聊, /当前唯一可用的公开议题/);
  assert.match(自动群聊, /不得引用、猜测或暗示私人微信、私下场景、亲密行为、婚姻隐私/);
});

test('风闻投诉微信优先展示任务公开摘要', () => {
  const 通知 = 截取(通知桥源, 'export function 编译管理任务微信通知', 'export async function 同步管理任务微信');
  assert.match(通知, /任务\.公开摘要 \|\| 任务\.模板/);
  assert.match(通知, /事项原文/);
});

test('父亲通话消费冻结圆场事实且保持父亲单一说话者', () => {
  const 父亲段 = 截取(父亲通话源, '// ── 父亲来电', 'export function 父亲通话已清理');

  assert.match(父亲段, /通话\.母亲圆场/);
  assert.match(父亲段, /冻结事实:母亲此前已经替儿子解释/);
  assert.match(父亲段, /唯一允许输出的说话者是父亲/);
  assert.match(父亲段, /严禁输出母亲台词、母亲消息、母亲旁白或任何第三说话人/);
  assert.match(来电页源, /_待接来电\.母亲圆场/);
  assert.match(通话页源, /父亲通话\.母亲圆场/);
  assert.doesNotMatch(父亲段, /谁:\s*'母'/);
});

test('风闻危机紧急来电优先谈危机，圆场发生时父亲首句必须转述', () => {
  const 主题 = 截取(父亲通话源, 'function 父亲通话主题', '/**\n * 所有活动通话修改');
  const 台词 = 截取(父亲通话源, 'async function 父亲台词', '/**\n * `待回复.序号`');

  assert.match(主题, /通话\.紧急/);
  assert.match(主题, /风闻危机/);
  assert.match(台词, /首句.*必须.*父亲.*转述|本句必须.*你妈/);
  assert.match(来电页源, /_待接来电\.紧急/);
});
