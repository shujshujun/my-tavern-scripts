/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

test('失败事件只在临时楼删除、chat 快照恢复和事务解锁后广播', () => {
  const catch位置 = 回合源码.indexOf('} catch (e) {', 回合源码.indexOf('export async function 执行回合'));
  const finally位置 = 回合源码.indexOf('} finally {', catch位置);
  const 恢复位置 = 回合源码.indexOf('await 恢复回合变量快照(chat快照, 本轮时间线仍有效)', finally位置);
  const 解锁位置 = 回合源码.indexOf('标记回合事务结束()', finally位置);
  const 广播位置 = 回合源码.indexOf("eventEmit('人妻公寓:回合失败', 待广播失败原因)", finally位置);

  assert.ok(catch位置 >= 0 && finally位置 > catch位置);
  assert.doesNotMatch(回合源码.slice(catch位置, finally位置), /eventEmit\('人妻公寓:回合失败'/);
  assert.ok(恢复位置 > finally位置 && 解锁位置 > 恢复位置 && 广播位置 > 解锁位置);
});

test('失败回滚必须动态复核时间线并在变量回调内部关门，不能用清理开始时的旧布尔', () => {
  const 主起 = 回合源码.indexOf('export async function 执行回合');
  const 主止 = 回合源码.indexOf('export async function 重掷回合', 主起);
  const 主回合 = 回合源码.slice(主起, 主止);
  const 恢复函数起 = 回合源码.indexOf('async function 恢复回合变量快照');
  const 恢复函数止 = 回合源码.indexOf('export function 裁手机时间线', 恢复函数起);
  const 恢复函数 = 回合源码.slice(恢复函数起, 恢复函数止);

  assert.doesNotMatch(主回合, /const 时间线已改变 = 本轮时间线已改变\(\)/, '不能把动态世代冻结成旧布尔');
  assert.match(
    主回合,
    /await 恢复回合变量快照\(chat快照, 本轮时间线仍有效\)/,
    '失败 finally 必须把当前世代校验传入真正写回入口（取消仍需恢复同分支快照）',
  );
  assert.match(
    恢复函数,
    /vars => \{\s*if \(!提交校验\(\)\) throw new Error\('__RQGY_TIMELINE_CHANGED__'\)/,
    '切聊或 swipe 若发生在 await 期间，回调必须在写入新分支前失败关闭',
  );
});

test('阶段线、经济、登门和资源成功提示只在核心提交后广播，保存失败不得先报成功', () => {
  const 结算起 = 回合源码.indexOf('function 回合结算');
  const 主循环起 = 回合源码.indexOf('/** 主循环:', 结算起);
  const 结算段 = 回合源码.slice(结算起, 主循环起);
  for (const 旧直发 of [
    /母亲线路消息\.length\) eventEmit/,
    /地点线路消息\.length\) eventEmit/,
    /eventEmit\('人妻公寓:提示', 阶段演出消息/,
    /eventEmit\('人妻公寓:提示', 提交结果\.提示/,
    /经提示\.length\) eventEmit/,
  ]) {
    assert.doesNotMatch(结算段, 旧直发, '回合结算只能排队提示，不能在最终整表落库前直接显示');
  }
  assert.match(结算段, /提交后任务\.push\(\(\) => eventEmit\('人妻公寓:提示'/);

  const 资源起 = 回合源码.indexOf('const 资源结算 = 结算成功现场楼');
  const 最终提交起 = 回合源码.indexOf('const 提交最终整表', 资源起);
  const 提交前段 = 回合源码.slice(资源起, 最终提交起);
  assert.doesNotMatch(提交前段, /if \(登门推进\?\.提示 && !登门推进\.事件\) eventEmit/);
  assert.doesNotMatch(提交前段, /if \(资源结算\.提示\) eventEmit/);
  assert.ok(
    (提交前段.match(/回合提交后任务\.push\(\(\) => eventEmit\('人妻公寓:提示'/g) ?? []).length >= 2,
    '登门与资源提示都必须排入核心提交后任务',
  );
});

test('客户端失败收口重拉消息、MVU、行动选项和两套在场真值后才允许自动重试', () => {
  const 开始 = App源码.indexOf("eventOn('人妻公寓:回合失败', async");
  const 结束 = App源码.indexOf("eventOn('人妻公寓:已重开'", 开始);
  const 片段 = App源码.slice(开始, 结束);

  assert.match(片段, /await 取卷轴\(\)/);
  assert.match(片段, /刷新在场\(\)/);
  assert.match(片段, /刷新行动选项\(\)/);
  assert.match(片段, /await Promise\.resolve\([\s\S]{0,120}\.pull\?\.\(\)\)/);
  const 渲染完成位 = 片段.indexOf('await nextTick()');
  const 自动重试位 = 片段.indexOf('发出(待重试)');
  assert.ok(渲染完成位 >= 0 && 自动重试位 > 渲染完成位, '自动重试必须等待 MVU 拉取与 Vue 渲染完成');
});

test('失败快照覆盖连续反感会提前改写的全部 chat 状态，共同邀约成员不能在失败楼中永久消失', () => {
  const 键表起点 = 回合源码.indexOf('const 回合变量键 = [');
  const 键表终点 = 回合源码.indexOf('] as const;', 键表起点);
  const 键表 = 回合源码.slice(键表起点, 键表终点);
  const 连续反感起点 = 回合源码.indexOf('async function 结算连续反感');
  const 连续反感终点 = 回合源码.indexOf('function 补离场正文', 连续反感起点);
  const 连续反感 = 回合源码.slice(连续反感起点, 连续反感终点);

  for (const 键 of ['_反感连续', '_粘滞', '_在场', '_赴约', '_手机邀约计划']) {
    assert.match(连续反感, new RegExp(`['"]${键}['"]`), `连续反感应确实改写 ${键}`);
    assert.match(键表, new RegExp(`['"]${键}['"]`), `失败／取消与重掷快照必须恢复 ${键}`);
  }
});

test('连续反感按同一次进房标识计数，换房重访不接旧链；真实离场同步熄灭头像', () => {
  const 开始 = 回合源码.indexOf('async function 结算连续反感');
  const 结束 = 回合源码.indexOf('function 补离场正文', 开始);
  const 片段 = 回合源码.slice(开始, 结束);

  assert.match(片段, /旧记录\?\.位置 === 当前场景\.房间id/);
  assert.match(片段, /旧记录\.进房末楼[\s\S]{0,80}当前进房末楼/);
  assert.match(片段, /仍是同次拜访[\s\S]{0,120}上次次数/);
  assert.match(片段, /\['焦点', '在场', '妻在场', '可写妻'\]/);
  assert.match(片段, /演员\[键\] = 列表\.filter\(m => !离场\.includes/);
});
