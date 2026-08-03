/* eslint-disable import-x/no-nodejs-modules -- Node-only source regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');

test('MVU 更新方式按官方设置读取，并兼容旧自动请求键', () => {
  const 状态 = 读('src/人妻公寓/MVU解析模式.ts');

  assert.match(状态, /extensionSettings\?\.mvu_settings/);
  assert.match(状态, /设置\?\.更新方式 === '额外模型解析'/);
  assert.match(状态, /额外模型解析配置\?\.启用自动请求/);
  assert.match(状态, /自动触发额外模型解析/);
  assert.doesNotMatch(状态, /设置\?\.(?:密钥|api地址|模型来源)/);
});

test('设置页默认关闭正文二次结算，外置模式会强制关闭并禁用按钮', () => {
  const 客户端 = 读('src/人妻公寓/界面/客户端/App.vue');

  assert.match(客户端, /const 二次变量结算 = ref\(false\)/);
  assert.match(客户端, /:disabled="MVU解析\.外置模式"/);
  assert.match(客户端, /function 刷新MVU解析状态\(\)[\s\S]*?外置模式[\s\S]*?二次变量结算\.value = false/);
  assert.match(客户端, /默认关闭，不打开也不影响正常游玩/);
  assert.match(客户端, /发现变量多次没有更新时，才建议打开/);
  assert.match(客户端, /MVU 外置模型已接管变量，正文二次结算已自动关闭/);
  assert.doesNotMatch(客户端, /const 二次变量结算 = ref\(true\)/);
});

test('外置路线让正文模型退出变量处理，并只走一次 MVU 官方桥', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 世界书 = 读('src/人妻公寓/世界书/index.yaml');
  const MVU桥 = 读('src/人妻公寓/脚本/MVU/index.ts');

  assert.match(引擎, /const 使用MVU外置解析 = MVU解析\.外置模式/);
  assert.match(引擎, /with_depth_entries: false/);
  assert.match(引擎, /是Gemini && !使用MVU外置解析/);
  assert.match(
    引擎,
    /!使用MVU外置解析[\s\S]{0,160}本轮有可写演员[\s\S]{0,160}\(是DeepSeek \|\| 是Gemini\)[\s\S]{0,160}二次变量结算开启\(\)/,
  );
  assert.match(
    引擎,
    /本轮静音会议 \|\| 使用MVU外置解析 \|\| !本轮有可写演员[\s\S]{0,100}\? ''[\s\S]{0,100}流式兜底变量块 \?\? 取变量块\(原文\)/,
  );
  assert.match(
    引擎,
    /使用MVU外置解析 &&[\s\S]*?MVU解析\.自动请求 &&[\s\S]*?await eventEmit\('人妻公寓:MVU外置模型重试'\)/,
  );
  assert.match(
    引擎,
    /if \(!使用MVU外置解析 && !变量解析已降级\)[\s\S]{0,220}const 候选基准 = _\.cloneDeep\(解析基准\)[\s\S]{0,220}await Mvu\.parseMessage\(可重处理楼层正文, 候选基准\)/,
    '外置桥返回的数据已经由 MVU 解析，不得在终值上再应用一次 delta/add',
  );
  assert.doesNotMatch(引擎, /function 外置模型补变量开启/);
  assert.match(世界书, /名称: '\[mvu_update\]变量更新列表'/);
  assert.equal((MVU桥.match(/getButtonEvent\('重试额外模型解析'\)/g) ?? []).length, 1);
});

test('正文路线的二次结算偏好未设置时保持关闭', () => {
  const 引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const 读取偏好 = 引擎.slice(引擎.indexOf('function 二次变量结算开启'), 引擎.indexOf('/** 楼层尾部'));

  assert.match(读取偏好, /if \(!raw\) return false/);
  assert.match(读取偏好, /二次变量结算 === true/);
  assert.match(读取偏好, /catch \{[\s\S]*?return false/);
});
