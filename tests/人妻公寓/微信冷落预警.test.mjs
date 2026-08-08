/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// P8:发消息/妻回复迁至 ./手机/交互/邀约与发消息,相关断言改读新所有者。
const 手机源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts', import.meta.url), 'utf8');
// P5:冷落指纹/扫描/预警节拍已迁移至 ./手机/冷落预警,相关断言改读新所有者。
const 冷落预警源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/冷落预警.ts', import.meta.url), 'utf8');
// P6:普通主动私聊与手机主拍顺序已迁至 ./手机/节拍引擎,相关断言改读新所有者。
const 节拍引擎源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');

function 截函数(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少函数锚:${开始}`);
  assert.notEqual(止, -1, `缺少函数结束锚:${结束}`);
  return 源.slice(起, 止);
}

/** 冷落预警.ts 内从锚点截到文件尾（迁移后该块即模块主体，无后续内核注释锚）。 */
function 截到尾(源, 开始) {
  const 起 = 源.indexOf(开始);
  assert.notEqual(起, -1, `缺少函数锚:${开始}`);
  return 源.slice(起);
}

test('手机侧只通过冷落系统的三个稳定API取档、取唯一方向和验语义', () => {
  assert.match(手机源, /from '\.\.\/\.\.\/冷落系统'/);
  assert.match(手机源, /计算妻冷落消息档/);
  assert.match(手机源, /冷落私聊方向/);
  assert.match(手机源, /冷落语义指纹/);
});

test('预警用成长轮次与档位稳定去重，只把当前分支活消息当成已发', () => {
  const 预警 = 截到尾(冷落预警源, 'type 冷落指纹');
  assert.match(预警, /`冷落:\$\{门牌[^}]*\}:\$\{[^}]*成长轮次[^}]*\}:\$\{[^}]*档[^}]*\}`/);
  assert.match(预警, /消息\.键\s*===/);
  assert.match(预警, /消息\.楼\s*<=\s*楼/);
});

test('候选按高档、冷落更久、门牌排序，一拍只取一户', () => {
  const 预警 = 截到尾(冷落预警源, 'type 冷落指纹');
  assert.match(预警, /b\.档\s*-\s*a\.档/);
  assert.match(预警, /b\.冷落钟楼数\s*-\s*a\.冷落钟楼数/);
  assert.match(预警, /localeCompare/);
  assert.match(预警, /\[0\]/);
});

test('冷落预警有独立导出，并在普通内容频率总闸之前运行', () => {
  const 手机拍 = 截函数(节拍引擎源, 'export async function 手机节拍', '// 手机节拍水位');
  assert.match(冷落预警源, /export async function 冷落预警节拍/);
  const 预警位置 = 手机拍.indexOf('await 冷落预警节拍()');
  const 频率位置 = 手机拍.indexOf('频率倍率[读配置().频率]');
  assert.ok(预警位置 >= 0 && 频率位置 > 预警位置);
});

test('冷落户整个冷落期都不进普通主动私聊循环', () => {
  const 普通私聊 = 截函数(节拍引擎源, '// ── 主动消息 v1', '// ── 群聊 v1');
  assert.match(冷落预警源, /冷落中门牌/);
  assert.match(冷落预警源, /_冷落余波\.状态\s*!==\s*'无'[^\n]*冷落中门牌\.add/);
  assert.match(普通私聊, /冷落中门牌\.has\(m\)/);
});

test('预警只注入当前唯一方向，禁止照片和撤回', () => {
  const 预警 = 截到尾(冷落预警源, 'export async function 冷落预警节拍');
  assert.match(预警, /本条唯一/);
  assert.match(预警, /不得发照片|禁止照片/);
  assert.match(预警, /不得撤回|禁止撤回/);
  assert.match(预警, /节拍改:\s*\{\s*\[私聊节拍键\([^}]*\)\]\s*:\s*钟\s*\}/);
  assert.doesNotMatch(预警, /攻略私聊提示\(/);
});

test('预警在AI返回后与真正写库回调内都重读MVU复核语义指纹', () => {
  const 预警 = 截到尾(冷落预警源, 'export async function 冷落预警节拍');
  assert.match(预警, /冷落语义仍有效\(\)/);
  assert.match(预警, /写库增量\([\s\S]*冷落语义仍有效/);
});

test('玩家在冷落期回信只获得当前档方向，并明确需要当面解决', () => {
  const 回信 = 截函数(手机源, 'async function 发消息(', '// 本模块初始化完成时向渲染层注册 P8 业务端口与批次执行器');
  assert.match(回信, /冷落私聊方向/);
  assert.match(回信, /_冷落余波\.状态\s*===\s*'安抚中'/);
  assert.match(回信, /(?:微信|手机)[^\n]{0,50}不能[^\n]{0,50}当面|当面[^\n]{0,50}(?:微信|手机)/);
  assert.match(回信, /回复语义仍有效/);
  assert.doesNotMatch(回信, /记录有效成长|推进冷落余波/);
});

test('静音会议手动私聊也优先采用冷落方向，同时保留会议隔离纪律', () => {
  const 回信 = 截函数(手机源, 'async function 发消息(', '// 本模块初始化完成时向渲染层注册 P8 业务端口与批次执行器');
  assert.doesNotMatch(回信, /const 冷落回复方向\s*=\s*会场私聊\s*\?/);
  assert.match(回信, /回复冷落档\s*!==\s*0[\s\S]{0,160}冷落私聊方向/);
  assert.match(回信, /同处会场[^\n]{0,40}不算[^\n]{0,40}当面解决/);
  assert.match(回信, /会场位置纪律/);
  assert.match(回信, /会议正文是只读时间线/);
  assert.match(回信, /会议记忆\?\.文本/);
  assert.match(回信, /冷落回复纪律\s*\+\s*口吻纪律/);
});
