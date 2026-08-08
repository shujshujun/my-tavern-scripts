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

test('设置页已移除正文“随AI输出”路线与二次结算控件，保留外置通道/内置解析/自定义 API 与恢复按钮', () => {
  // A3 拆分后 MVU 解析设置整体在 设置弹窗.vue（App 只接线）；0.74 起正文路线整体移除。
  const 设置弹窗 = 读('src/人妻公寓/界面/客户端/components/设置弹窗.vue');

  assert.doesNotMatch(设置弹窗, /随AI输出/, '正文随AI输出按钮已移除');
  assert.doesNotMatch(设置弹窗, /二次变量结算/, '模型二次变量结算控件与状态已移除');
  assert.doesNotMatch(设置弹窗, /route-locked|route-hint/, '外置锁死提示已移除');
  assert.match(设置弹窗, /变量解析：外置模型（默认）/, '只读外置状态说明保持');
  assert.match(设置弹窗, /恢复外置解析/, '非外置时恢复按钮保持');
  assert.match(设置弹窗, /写入MVU设置\(\{ 更新方式: '额外模型解析' \}\)/, '恢复只写外置，不提供正文按钮');
  assert.match(设置弹窗, /内置变量解析/, '内置变量解析开关保留');
  assert.match(设置弹窗, /解析模型通道/, '解析模型通道保留');
  assert.match(设置弹窗, /mvu-api-form/, '自定义 API 表单保留');
  assert.match(设置弹窗, /切换内置变量解析/, '内置解析交互保留');
  assert.doesNotMatch(设置弹窗, /切换二次变量结算/, '二次结算交互函数已移除');
});

test('0.74 默认外置迁移用版本化新键，只在已是外置或写入成功后记录，失败可重试', () => {
  const 状态 = 读('src/人妻公寓/MVU解析模式.ts');

  assert.match(状态, /MVU外置默认V074已初始化/, 'V074 版本化初始化键存在');
  assert.match(状态, /读界面偏好\(\)\[MVU外置默认V074初始化键\] === true/, '已标记时直接返回');
  assert.match(状态, /设置\?\.更新方式 === '额外模型解析'/, '已是外置判定保持');
  assert.match(状态, /const 成功 = 写入MVU设置\(\{ 更新方式: '额外模型解析' \}\)/, '写入结果先保存再判断');
  assert.match(状态, /if \(成功\) 写界面偏好\(\{ \[MVU外置默认V074初始化键\]: true \}\)/, '写入成功才记录标记');
  assert.match(状态, /return 成功/, '只在实际写成外置时返回 true');
  assert.doesNotMatch(状态, /写界面偏好\(\{ MVU外置默认已初始化: true \}\)/, '旧键不再提前标记');
  assert.doesNotMatch(状态, /MVU外置默认已初始化 === true/, '初始化判定不再依赖旧键');
});

test('外置路线让正文模型退出变量处理：官方桥已解析结果不重复应用，内置外置原始变量块本地应用一次', () => {
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

  // 按语义用 indexOf/slice 切出三个小段，避免跨全文件的脆弱超长距离正则：
  // 内置解析分支（原始变量块就绪标记）→ 官方桥分支（读回外置已解析结果）→ 最终本地解析段。
  const 内置解析起点 = 引擎.indexOf('let 内置解析变量块已就绪 = false;');
  const 官方桥起点 = 引擎.indexOf("console.info('[人妻公寓] 调用 MVU 官方外置模型解析');");
  const 最终本地解析起点 = 引擎.indexOf('let 新 = _.cloneDeep(解析基准) as Mvu.MvuData;');
  assert.ok(内置解析起点 !== -1, '内置解析分支存在');
  assert.ok(官方桥起点 !== -1, '官方桥分支存在');
  assert.ok(最终本地解析起点 !== -1, '最终本地解析段存在');
  assert.ok(内置解析起点 < 官方桥起点 && 官方桥起点 < 最终本地解析起点, '三分支按引擎实际顺序排列');
  const 内置解析分支 = 引擎.slice(内置解析起点, 官方桥起点);
  const 官方桥分支 = 引擎.slice(官方桥起点, 最终本地解析起点);
  const 最终本地解析段 = 引擎.slice(最终本地解析起点);

  // 内置解析分支：就绪标记初始为 false，只有内置解析成功取得原始变量块后才置 true
  assert.match(内置解析分支, /let 内置解析变量块已就绪 = false;/, '内置解析就绪标记初始为 false');
  assert.match(
    内置解析分支,
    /使用MVU外置解析 && MVU解析\.内置解析 && 本轮有可写演员/,
    '内置外置解析仅在外置模式下启用',
  );
  assert.match(
    内置解析分支,
    /if \(内置变量块\) \{[\s\S]{0,160}内置解析变量块已就绪 = true;/,
    '只有内置解析成功取得变量块后才置就绪标记',
  );
  assert.equal(
    (内置解析分支.match(/内置解析变量块已就绪 = true;/g) ?? []).length,
    1,
    '就绪标记只出现一次置 true，失败/待补路径不置位',
  );

  // 官方桥分支：MVU 官方桥已自带"生成变量块 → parse → 写回该楼"，引擎只读回结果
  assert.match(官方桥分支, /await eventEmit\('人妻公寓:MVU外置模型重试'\)/);
  assert.match(
    官方桥分支,
    /let 外置后数据 = Mvu\.getMvuData\(\{ type: 'message', message_id: 临时助手楼层 \}\)/,
    '官方桥读回外置模型已解析的楼层数据',
  );
  assert.match(官方桥分支, /解析基准 = _\.cloneDeep\(外置后数据\)/, '官方桥结果写入解析基准');
  assert.doesNotMatch(
    官方桥分支,
    /内置解析变量块已就绪 = true/,
    '官方桥不置就绪标记，其已解析结果不得再走本地 parse 二次应用',
  );

  // 最终本地解析段：正文路线（!使用MVU外置解析）可直接进入；外置模式只允许
  // 内置外置解析产出的原始变量块（就绪标记为 true）进入；变量解析已降级一律禁止。
  assert.match(
    最终本地解析段,
    /if \(\(!使用MVU外置解析 \|\| 内置解析变量块已就绪\) && !变量解析已降级\)[\s\S]{0,220}const 候选基准 = _\.cloneDeep\(解析基准\)[\s\S]{0,220}await Mvu\.parseMessage\(可重处理楼层正文, 候选基准\)/,
    '官方桥结果已由 MVU 解析不重复应用；内置外置原始变量块本地应用一次；降级不得进入',
  );

  // 本地 Mvu.parseMessage 在回合引擎源码中只有一个调用点，锁住"本地最多解析一次"
  assert.equal(
    (引擎.match(/Mvu\.parseMessage\(可重处理楼层正文, 候选基准\)/g) ?? []).length,
    1,
    '本地 Mvu.parseMessage 只调用一次，官方桥已解析结果不会二次应用',
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
