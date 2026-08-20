/* eslint-disable import-x/no-nodejs-modules -- Node-only regression + behavioral test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { 严格变量审计开启 } from '../../src/人妻公寓/MVU解析模式.ts';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 设置源码 = 读('src/人妻公寓/界面/客户端/components/设置弹窗.vue');
const 引擎源码 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');

test('严格变量审计旧偏好默认关闭，只有布尔 true 才开启', () => {
  const 原window = globalThis.window;
  let 当前值;
  const localStorage = { getItem: () => 当前值 };
  globalThis.window = { parent: { localStorage }, localStorage };
  try {
    当前值 = null;
    assert.equal(严格变量审计开启(), false);
    当前值 = JSON.stringify({ 严格变量审计: false });
    assert.equal(严格变量审计开启(), false);
    当前值 = JSON.stringify({ 严格变量审计: 'true' });
    assert.equal(严格变量审计开启(), false);
    当前值 = JSON.stringify({ 严格变量审计: true });
    assert.equal(严格变量审计开启(), true);
  } finally {
    if (原window === undefined) delete globalThis.window;
    else globalThis.window = 原window;
  }
});

test('设置页提供默认关闭开关，合并持久化且只在v0.80内置外置解析路线显示', () => {
  assert.match(设置源码, /const 严格变量审计 = ref\(false\)/, '默认关闭');
  assert.match(
    设置源码,
    /return 写入变量解析偏好\(\{[\s\S]*?严格变量审计: 严格变量审计\.value,/,
    '通过共享父页持久层与既有偏好合并写入，并报告真实写入结果',
  );
  assert.match(
    设置源码,
    /const 偏好 = 读取变量解析偏好\(\);[\s\S]*?严格变量审计\.value = 偏好\.严格变量审计;/,
    '恢复时复用共享层的严格布尔默认与校验语义',
  );
  assert.match(设置源码, /<div class="set-label">严格变量审计<\/div>/, '设置页有明确标签');
  assert.match(设置源码, /不会增加模型请求/, '向玩家说明不新增请求');
  assert.match(
    设置源码,
    /<div v-if="MVU解析\.外置模式 && MVU解析\.内置解析" class="set-group row">\s*<div>\s*<div class="set-label">严格变量审计<\/div>/,
    '严格审计行受当前内置外置解析条件控制',
  );
  assert.match(
    设置源码,
    /<div v-if="MVU解析\.外置模式" class="set-group row">\s*<div>\s*<div class="set-label">内置变量解析<\/div>/,
    '内置解析开关关闭后仍可见并可重新开启',
  );
  assert.match(设置源码, /function 切换严格变量审计\(\)/, '有独立切换函数');
});

test('精简审计只逐叶判断合法可写视图，不复制通用世界书的危险联动', () => {
  const 起点 = 引擎源码.indexOf('const 严格变量审计令 = [');
  const 终点 = 引擎源码.indexOf("].join('\\n');", 起点);
  assert.ok(起点 !== -1 && 终点 !== -1, '严格审计令存在');
  const 审计令 = 引擎源码.slice(起点, 终点);
  assert.match(审计令, /实际存在的每个叶子/);
  assert.match(审计令, /审计只强制判断，不强制改值/);
  assert.match(审计令, /只用 RFC 6902 replace/);
  assert.match(审计令, /禁止 delta\/add\/remove/);
  assert.match(审计令, /不得输出 <BianLiang>/);
  assert.match(审计令, /户 为空，JSON Patch 必须是 \[\]/);
  assert.doesNotMatch(审计令, /经验进度结算|关系值衰减|新NPC必须|高潮系统|受孕系统/);
});

test('开关只接入v0.80内置外置解析，不回接已移除的正文路线', () => {
  assert.match(引擎源码, /function 当前变量结算令\(\): string/);
  assert.match(
    引擎源码,
    /严格变量审计开启\(\)[\s\S]{0,220}\? `\$\{变量结算基础令\}[^`]*\$\{严格变量审计令\}[^`]*\$\{变量结算格式收口令\}`[\s\S]{0,120}: `\$\{变量结算基础令\}[^`]*\$\{变量结算格式收口令\}`/,
    '开关只决定是否追加严格审计，开启与关闭都必须在末尾保留标准格式收口令',
  );
  const 内置外置起点 = 引擎源码.indexOf('async function 内置外置变量解析');
  const 内置外置终点 = 引擎源码.indexOf('async function 结算连续反感');
  const 内置外置段 = 引擎源码.slice(内置外置起点, 内置外置终点);
  assert.equal((内置外置段.match(/content: 变量结算令/g) ?? []).length, 2, '只覆盖自定义与数据库两条当前通道');
  assert.doesNotMatch(引擎源码, /补模型变量结算|二次变量结算开启|GEMINI变量更新强制令/, '旧正文结算已物理删除');
  assert.equal((引擎源码.match(/async function 内置外置变量解析/g) ?? []).length, 1, '没有新增解析请求函数');
  assert.doesNotMatch(设置源码, /generateRaw\(|通过数据库生成\(/, '设置开关本身不发请求');
});
