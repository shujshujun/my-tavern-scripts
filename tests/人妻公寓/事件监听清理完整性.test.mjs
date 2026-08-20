/* eslint-disable import-x/no-nodejs-modules -- Node-only source regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

function 本地监听事件() {
  return new Set([...源码.matchAll(/eventOn\(\s*['"](人妻公寓:[^'"]+)['"]/g)].map(匹配 => 匹配[1]));
}

function 清理名单() {
  const 起点 = 源码.indexOf('for (const 名 of [');
  const 终点 = 源码.indexOf('  ]) {\n    eventClearEvent(名);', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位本模块 listener 清理名单');
  const 段 = 源码.slice(起点, 终点);
  return new Set([...段.matchAll(/['"](人妻公寓:[^'"]+)['"]/g)].map(匹配 => 匹配[1]));
}

test('所有本地人妻公寓事件监听都进入热挂载清理名单，重复初始化不会叠加执行', () => {
  const 监听 = 本地监听事件();
  const 清理 = 清理名单();
  const 漏项 = [...监听].filter(事件 => !清理.has(事件)).sort();
  assert.deepEqual(漏项, []);
});

test('高风险业务事件各只注册一次，避免一次点击重复结算或重复启动AI', () => {
  for (const 事件 of ['人妻公寓:切换性爱主焦点', '人妻公寓:查看旧动态', '人妻公寓:生产动作', '人妻公寓:家庭计划动作']) {
    const 次数 = [...源码.matchAll(new RegExp(`eventOn\\(\\s*['"]${事件}['"]`, 'g'))].length;
    assert.equal(次数, 1, `${事件} 只能有一个后端监听器`);
  }
});
