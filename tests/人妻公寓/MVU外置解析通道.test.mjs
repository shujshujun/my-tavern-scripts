/* eslint-disable import-x/no-nodejs-modules -- Node-only regression + behavioral test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as MVU解析模式 from '../../src/人妻公寓/MVU解析模式.ts';
import {
  写入变量解析偏好,
  写入变量解析通道,
  内置变量解析开启,
  内置变量解析等待宿主刷新,
  规范OpenAI兼容API地址,
  规范变量解析通道,
  读取MVU解析状态,
  读取变量解析偏好,
  读取变量解析通道,
  安排宿主刷新以应用MVU设置,
  选择变量解析通道,
  自动代关MVU自动请求,
} from '../../src/人妻公寓/MVU解析模式.ts';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 引擎源码 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const 入口源码 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
const 设置源码 = 读('src/人妻公寓/界面/客户端/components/设置弹窗.vue');

test('旧版 MVU 顶层自动请求键也会被启动自愈关闭，避免与游戏内置解析双发', () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 原SillyTavern存在 = Object.prototype.hasOwnProperty.call(globalThis, 'SillyTavern');
  const 原SillyTavern = globalThis.SillyTavern;
  const 存储 = new Map();
  let 保存次数 = 0;
  const localStorage = {
    getItem: key => (存储.has(key) ? 存储.get(key) : null),
    setItem: (key, value) => 存储.set(key, String(value)),
  };
  const mvu设置 = {
    更新方式: '额外模型解析',
    自动触发额外模型解析: true,
  };
  const 宿主 = {
    localStorage,
    SillyTavern: {
      extensionSettings: { mvu_settings: mvu设置 },
      saveSettingsDebounced: () => {
        保存次数 += 1;
      },
    },
  };

  try {
    globalThis.window = { parent: 宿主, localStorage };
    delete globalThis.SillyTavern;
    assert.equal(读取MVU解析状态().自动请求, true, '前置条件：状态读取确实兼容旧键');
    assert.equal(自动代关MVU自动请求(), true, '内置解析开启时旧键也必须真正关闭');
    assert.equal(mvu设置.自动触发额外模型解析, false);
    assert.equal(读取MVU解析状态().自动请求, false);
    assert.equal(内置变量解析等待宿主刷新(), true, '持久层已改但 MVU Pinia 未重载时必须挂运行期闸门');
    assert.equal(内置变量解析开启(), false, '等待父页刷新期间游戏内置解析失败关闭，不能和旧 MVU 副本双发');
    assert.equal(保存次数, 1, '持久设置只保存一次');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
    if (原SillyTavern存在) globalThis.SillyTavern = 原SillyTavern;
    else delete globalThis.SillyTavern;
  }
});

test('MVU 自动请求键缺失时按上游默认开启处理，自愈必须显式写 false', () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 原SillyTavern存在 = Object.prototype.hasOwnProperty.call(globalThis, 'SillyTavern');
  const 原SillyTavern = globalThis.SillyTavern;
  const 存储 = new Map();
  let 保存次数 = 0;
  const localStorage = {
    getItem: key => (存储.has(key) ? 存储.get(key) : null),
    setItem: (key, value) => 存储.set(key, String(value)),
  };
  const mvu设置 = { 更新方式: '额外模型解析' };
  const 宿主 = {
    localStorage,
    SillyTavern: {
      extensionSettings: { mvu_settings: mvu设置 },
      saveSettingsDebounced: () => {
        保存次数 += 1;
      },
    },
  };

  try {
    globalThis.window = { parent: 宿主, localStorage };
    delete globalThis.SillyTavern;
    assert.equal(读取MVU解析状态().自动请求, true, '缺键按 MVU 当前默认值视为开启');
    assert.equal(自动代关MVU自动请求(), true);
    assert.equal(mvu设置.额外模型解析配置.启用自动请求, false, '必须创建最小覆盖值显式关闭默认开启');
    assert.equal(保存次数, 1);
    assert.equal(内置变量解析开启(), false, 'MVU 运行时副本刷新前继续失败关闭');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
    if (原SillyTavern存在) globalThis.SillyTavern = 原SillyTavern;
    else delete globalThis.SillyTavern;
  }
});

test('启动自愈保存失败必须原位回滚并抛错，不能挂着刷新闸门继续进入双解析风险态', () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 原SillyTavern存在 = Object.prototype.hasOwnProperty.call(globalThis, 'SillyTavern');
  const 原SillyTavern = globalThis.SillyTavern;
  const localStorage = { getItem: () => null, setItem: () => undefined };
  const 外置配置 = { 启用自动请求: true, 模型来源: '自定义' };
  const mvu设置 = {
    更新方式: '额外模型解析',
    自动触发额外模型解析: true,
    额外模型解析配置: 外置配置,
  };
  const 宿主 = {
    localStorage,
    SillyTavern: {
      extensionSettings: { mvu_settings: mvu设置 },
      saveSettingsDebounced() {
        assert.equal(this, 宿主.SillyTavern, '宿主保存必须保留方法 this');
        throw new Error('settings save rejected');
      },
    },
  };
  const 原设置引用 = mvu设置;
  const 原配置引用 = 外置配置;

  try {
    globalThis.window = { parent: 宿主, localStorage };
    delete globalThis.SillyTavern;
    assert.throws(() => 自动代关MVU自动请求(), /settings save rejected|保存/);
    assert.equal(宿主.SillyTavern.extensionSettings.mvu_settings, 原设置引用, 'MVU 设置对象必须原位恢复');
    assert.equal(mvu设置.额外模型解析配置, 原配置引用, '嵌套配置对象也必须原位恢复');
    assert.equal(mvu设置.额外模型解析配置.启用自动请求, true);
    assert.equal(mvu设置.自动触发额外模型解析, true);
    assert.equal(内置变量解析等待宿主刷新(), false, '保存失败不得留下永久等待刷新闸门');
    assert.equal(内置变量解析开启(), true, '失败后状态应保持原样，由调用方明确停止或回退开关');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
    if (原SillyTavern存在) globalThis.SillyTavern = 原SillyTavern;
    else delete globalThis.SillyTavern;
  }
});

test('自定义模型配置与解析通道原子提交：任一持久层失败都回滚，成功只保存一次', () => {
  const 保存自定义变量解析设置 = MVU解析模式.保存自定义变量解析设置;
  assert.equal(typeof 保存自定义变量解析设置, 'function', '必须由单一事务函数同时提交 MVU 配置与游戏通道');

  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 原SillyTavern存在 = Object.prototype.hasOwnProperty.call(globalThis, 'SillyTavern');
  const 原SillyTavern = globalThis.SillyTavern;
  const 存储 = new Map([
    ['人妻公寓_界面偏好', JSON.stringify({ 变量解析通道: '自动', 省流: true })],
  ]);
  let 拒绝偏好写入 = true;
  const localStorage = {
    getItem: key => (存储.has(key) ? 存储.get(key) : null),
    setItem: (key, value) => {
      if (拒绝偏好写入) throw new Error('quota exceeded');
      存储.set(key, String(value));
    },
    removeItem: key => 存储.delete(key),
  };
  let 保存次数 = 0;
  let 拒绝MVU保存 = false;
  const mvu设置 = {
    更新方式: '额外模型解析',
    保留字段: '不得丢',
    额外模型解析配置: { 模型来源: '与插头相同', api地址: 'https://old.example/v1', 保留配置: 7 },
  };
  const 宿主 = {
    localStorage,
    SillyTavern: {
      extensionSettings: { mvu_settings: mvu设置 },
      saveSettingsDebounced: () => {
        if (拒绝MVU保存) throw new Error('save failed');
        保存次数 += 1;
      },
    },
  };

  try {
    globalThis.window = { parent: 宿主, localStorage };
    delete globalThis.SillyTavern;
    const 初始MVU = structuredClone(mvu设置);
    const 初始偏好 = 存储.get('人妻公寓_界面偏好');
    assert.equal(
      保存自定义变量解析设置({ api地址: 'https://new.example/v1', 密钥: 'key', 模型名称: 'model-a' }),
      false,
      'localStorage 拒绝时整笔提交失败',
    );
    assert.deepEqual(mvu设置, 初始MVU, '通道偏好失败不得留下半份 MVU 配置');
    assert.equal(存储.get('人妻公寓_界面偏好'), 初始偏好);
    assert.equal(保存次数, 0);

    拒绝偏好写入 = false;
    assert.equal(
      保存自定义变量解析设置({ api地址: 'https://new.example/v1', 密钥: 'key', 模型名称: 'model-a' }),
      true,
    );
    assert.equal(mvu设置.额外模型解析配置.模型来源, '自定义');
    assert.equal(mvu设置.额外模型解析配置.api地址, 'https://new.example/v1');
    assert.equal(mvu设置.额外模型解析配置.保留配置, 7, '事务补丁不得覆盖 MVU 其他配置');
    assert.equal(JSON.parse(存储.get('人妻公寓_界面偏好')).变量解析通道, '自定义');
    assert.equal(JSON.parse(存储.get('人妻公寓_界面偏好')).省流, true, '事务写偏好必须合并保留 UI 字段');
    assert.equal(保存次数, 1, '成功事务只调一次宿主保存');

    const 成功后MVU = structuredClone(mvu设置);
    const 成功后偏好 = 存储.get('人妻公寓_界面偏好');
    拒绝MVU保存 = true;
    assert.equal(
      保存自定义变量解析设置({ api地址: 'https://late.example/v1', 密钥: 'late', 模型名称: 'model-b' }),
      false,
      '宿主保存同步拒绝时整笔提交失败',
    );
    assert.deepEqual(mvu设置, 成功后MVU, '宿主保存失败必须原位恢复 MVU 对象');
    assert.equal(存储.get('人妻公寓_界面偏好'), 成功后偏好, '宿主保存失败必须恢复通道偏好');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
    if (原SillyTavern存在) globalThis.SillyTavern = 原SillyTavern;
    else delete globalThis.SillyTavern;
  }
});

test('解析通道单独持久化必须报告成功或失败，不能在隐私模式中假装已经切换', () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const localStorage = {
    getItem: () => JSON.stringify({ 变量解析通道: '自定义' }),
    setItem: () => {
      throw new Error('blocked');
    },
  };
  try {
    globalThis.window = { parent: { localStorage }, localStorage };
    assert.equal(写入变量解析通道('自动'), false);
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
  }
});

test('解析开关偏好统一走父页存储、合并保留其他 UI 字段，并报告真实写入失败', () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 存储 = new Map([
    ['人妻公寓_界面偏好', JSON.stringify({ 省流: true, 内置变量解析: false })],
  ]);
  let 拒绝写入 = false;
  const localStorage = {
    getItem: key => (存储.has(key) ? 存储.get(key) : null),
    setItem: (key, value) => {
      if (拒绝写入) throw new Error('blocked');
      存储.set(key, String(value));
    },
  };
  try {
    globalThis.window = { parent: { localStorage }, localStorage: { getItem: () => null, setItem: () => undefined } };
    assert.deepEqual(读取变量解析偏好(), { 内置变量解析: false, 严格变量审计: false });
    assert.equal(写入变量解析偏好({ 内置变量解析: true, 严格变量审计: true }), true);
    assert.deepEqual(JSON.parse(存储.get('人妻公寓_界面偏好')), {
      省流: true,
      内置变量解析: true,
      严格变量审计: true,
    });
    拒绝写入 = true;
    assert.equal(写入变量解析偏好({ 内置变量解析: false }), false);
    assert.equal(JSON.parse(存储.get('人妻公寓_界面偏好')).内置变量解析, true, '失败不得改写旧偏好');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
  }
});

test('路由矩阵：自动 数据库可用优先于自定义', () => {
  assert.equal(选择变量解析通道('自动', true, true), '数据库');
  assert.equal(选择变量解析通道('自动', true, false), '数据库');
});

test('路由矩阵：自动 无数据库但有自定义 → 自定义；两者都没有 → null', () => {
  assert.equal(选择变量解析通道('自动', false, true), '自定义');
  assert.equal(选择变量解析通道('自动', false, false), null);
});

test('路由矩阵：显式自定义配置完整才走自定义，配置不完整绝不偷偷改走数据库', () => {
  assert.equal(选择变量解析通道('自定义', false, true), '自定义');
  assert.equal(选择变量解析通道('自定义', true, true), '自定义');
  assert.equal(选择变量解析通道('自定义', true, false), null);
  assert.equal(选择变量解析通道('自定义', false, false), null);
});

test('规范OpenAI兼容API地址：裸域名补 /v1', () => {
  assert.equal(规范OpenAI兼容API地址('https://api.example.com'), 'https://api.example.com/v1');
});

test('规范OpenAI兼容API地址：首尾空格与尾斜杠被清理', () => {
  assert.equal(规范OpenAI兼容API地址('  https://api.example.com///  '), 'https://api.example.com/v1');
  assert.equal(规范OpenAI兼容API地址('https://api.example.com/'), 'https://api.example.com/v1');
});

test('规范OpenAI兼容API地址：已是 /vN 版本路径原样保留', () => {
  assert.equal(规范OpenAI兼容API地址('https://api.example.com/v1'), 'https://api.example.com/v1');
  assert.equal(规范OpenAI兼容API地址('https://api.example.com/v2'), 'https://api.example.com/v2');
  // /models 终端路径剥离后版本号仍保留
  assert.equal(规范OpenAI兼容API地址('https://api.example.com/v2/models'), 'https://api.example.com/v2');
});

test('规范OpenAI兼容API地址：/v1/models 与 /v1/chat/completions 去掉终端路径', () => {
  assert.equal(规范OpenAI兼容API地址('https://api.example.com/v1/models'), 'https://api.example.com/v1');
  assert.equal(规范OpenAI兼容API地址('https://api.example.com/v1/chat/completions'), 'https://api.example.com/v1');
});

test('规范OpenAI兼容API地址：空白配置返回空字符串，绝不补成 /v1', () => {
  assert.equal(规范OpenAI兼容API地址(''), '');
  assert.equal(规范OpenAI兼容API地址('   '), '');
});

test('规范OpenAI兼容API地址：已规范地址幂等', () => {
  const 已规范 = 'https://api.example.com/v1';
  assert.equal(规范OpenAI兼容API地址(已规范), 已规范);
  assert.equal(规范OpenAI兼容API地址('https://api.example.com/v1'), 'https://api.example.com/v1');
});

test('旧偏好 正文 与非法值统一规范为 自动，读取默认也落回 自动', () => {
  assert.equal(规范变量解析通道('正文'), '自动');
  assert.equal(规范变量解析通道('自动'), '自动');
  assert.equal(规范变量解析通道('自定义'), '自定义');
  assert.equal(规范变量解析通道(undefined), '自动');
  assert.equal(规范变量解析通道('乱写的值'), '自动');
  // Node 无偏好存储时读取默认自动；旧档的 正文 同理落回 自动，不出现无选中态。
  assert.equal(读取变量解析通道(), '自动');
});

test('读取MVU外置模型配置 JSDoc 不再声称数据库/正文通道兜底', () => {
  const 解析模式源码 = 读('src/人妻公寓/MVU解析模式.ts');
  const 函数起点 = 解析模式源码.indexOf('export function 读取MVU外置模型配置');
  assert.ok(函数起点 !== -1, '读取MVU外置模型配置 应存在');
  const JSDoc段 = 解析模式源码.slice(Math.max(0, 函数起点 - 400), 函数起点);
  assert.doesNotMatch(JSDoc段, /数据库\/正文通道兜底/, 'JSDoc 不再声称走数据库/正文通道兜底');
  assert.doesNotMatch(JSDoc段, /正文通道/, 'JSDoc 不再提及正文通道');
  assert.match(JSDoc段, /绝不回落正文 API/, 'JSDoc 明确配置缺失绝不回落正文 API');
});

test('运行期闸门从安排刷新起保持失败关闭，并刷新真正的父页面', async () => {
  const 原window存在 = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const 原window = globalThis.window;
  const 存储 = new Map();
  let 刷新次数 = 0;
  const localStorage = {
    getItem: key => (存储.has(key) ? 存储.get(key) : null),
    setItem: (key, value) => 存储.set(key, String(value)),
  };
  const 宿主 = {
    localStorage,
    location: { reload: () => (刷新次数 += 1) },
  };
  try {
    globalThis.window = { parent: 宿主, localStorage };
    assert.equal(内置变量解析开启(), true);
    assert.equal(安排宿主刷新以应用MVU设置(0), true);
    assert.equal(内置变量解析等待宿主刷新(), true);
    assert.equal(内置变量解析开启(), false, '刷新回调执行前也不得短暂启用内置解析');
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(刷新次数, 1, '必须刷新父级酒馆页面，而不是只重载角色卡 iframe');
  } finally {
    if (原window存在) globalThis.window = 原window;
    else delete globalThis.window;
  }
});

test('设置页运行中重新打开内置解析时，先落盘，再失败关闭并安排宿主刷新', () => {
  const 解析模式源码 = 读('src/人妻公寓/MVU解析模式.ts');
  assert.match(设置源码, /自动代关MVU自动请求/, '设置组件必须接入统一自愈函数');
  assert.match(设置源码, /写入变量解析偏好/, '解析开关必须走可报告失败的共享父页持久层');
  assert.match(设置源码, /读取变量解析偏好/, '解析开关恢复必须与游戏逻辑共用同一默认值和存储锚点');
  assert.doesNotMatch(设置源码.replace(/<!--[^]*?-->/g, ''), /\blocalStorage\b/, '组件实现不得另写一套 iframe localStorage');
  assert.match(设置源码, /安排宿主刷新以应用MVU设置/, '设置组件必须刷新父页才能重载 MVU Pinia 副本');
  assert.match(解析模式源码, /export function 自动代关MVU自动请求/, '自愈函数保持单一事实来源');

  const 起点 = 设置源码.indexOf('function 切换内置变量解析()');
  const 终点 = 设置源码.indexOf('function 切换严格变量审计()', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位内置解析切换函数');
  const 段 = 设置源码.slice(起点, 终点);
  const 持久化位 = 段.indexOf('持久化解析字段()');
  const 自愈位 = 段.indexOf('自动代关MVU自动请求()');
  const 刷新位 = 段.indexOf('安排宿主刷新以应用MVU设置()');
  assert.ok(持久化位 >= 0 && 自愈位 > 持久化位, '必须先把新开关落盘，再让自愈读取最新内置解析状态');
  assert.ok(刷新位 > 自愈位, '确实代关后必须再安排完整宿主刷新');
  assert.match(段, /if \(!持久化解析字段\(\)\)[\s\S]*?内置变量解析\.value = 原值/, '第一步偏好保存失败必须恢复页面选中态');
  assert.match(段, /const 需要刷新宿主 = 内置变量解析\.value && 自动代关MVU自动请求\(\)/, '只在重新打开且确实代关时刷新');
  assert.match(段, /catch \{[\s\S]*?内置变量解析\.value = 原值[\s\S]*?const 已回滚 = 持久化解析字段\(\)/, '第二步 MVU 保存失败必须恢复旧开关');
  assert.match(段, /if \(!已回滚\) 挂起内置变量解析直至宿主刷新\(\)/, '连偏好回滚都失败时必须在本页失败关闭');
  assert.match(段.slice(刷新位), /return;/, '安排刷新后停止本次设置流程，不继续宣称运行时已完全同步');
});

test('启动自愈确实代关时停止后续挂载，等待父页刷新后才启用业务监听', () => {
  const pending起点 = 入口源码.indexOf('if (内置变量解析等待宿主刷新())');
  const 自愈起点 = 入口源码.indexOf('if (自动代关MVU自动请求())');
  const 终点 = 入口源码.indexOf('// 必须先于监听与 UI 操作恢复', 自愈起点);
  assert.ok(pending起点 >= 0 && 自愈起点 > pending起点 && 终点 > 自愈起点, '必须先检查遗留父页闸门，再进入启动自愈');
  const pending段 = 入口源码.slice(pending起点, 自愈起点);
  assert.match(pending段, /return;/, '只重载 iframe 时必须停止挂载，不能清掉父页闸门后继续');
  assert.match(pending段, /完整宿主刷新/, '给玩家明确的完整刷新提示');

  const 段 = 入口源码.slice(自愈起点, 终点);
  const 自愈位 = 段.indexOf('自动代关MVU自动请求()');
  const 刷新位 = 段.indexOf('安排宿主刷新以应用MVU设置()');
  const 返回位 = 段.indexOf('return;', 刷新位);
  assert.ok(刷新位 > 自愈位 && 返回位 > 刷新位, '代关后必须安排父页刷新并退出本轮初始化');
  assert.match(段, /timeOut: 0, extendedTimeOut: 0/, '自动刷新失败时必须留下不会自动消失的手动刷新提示');
});

test('设置页不再出现"正文API"按钮，文案说明无可用独立模型时提示配置', () => {
  assert.doesNotMatch(设置源码, />正文API</, '正文API分段按钮已删除');
  assert.doesNotMatch(设置源码, /选择解析通道\('正文'\)/, '正文通道点击已删除');
  assert.doesNotMatch(设置源码, /解析通道 === '正文'/, '正文通道选中态已删除');
  assert.match(设置源码, /不会占用正文 API/, '文案明确不会占用正文 API');
  assert.match(设置源码, /仅提示去配置/, '文案明确两者都没有时提示配置');
  assert.match(设置源码, /选择解析通道\('自动'\)/, '自动分段按钮仍在');
  assert.match(设置源码, /选择解析通道\('自定义'\)/, '自定义分段按钮仍在');
});

test('内置外置变量解析段内不存在正文通道与等待正文生成调用，使用路由矩阵纯函数', () => {
  const 段起点 = 引擎源码.indexOf('async function 内置外置变量解析');
  const 段终点 = 引擎源码.indexOf('async function 结算连续反感');
  assert.ok(段起点 !== -1 && 段终点 !== -1, '内置外置变量解析函数段应存在');
  const 段 = 引擎源码.slice(段起点, 段终点);
  assert.doesNotMatch(段, /'正文'/, '函数段内不存在正文通道字样');
  assert.doesNotMatch(段, /等待正文生成\(/, '内置外置变量解析不再调用等待正文生成');
  assert.match(段, /选择变量解析通道\(/, '内置外置变量解析使用路由矩阵纯函数');
  // 等待正文生成仍被正文主流程使用，不得被全文件删除
  assert.match(引擎源码, /等待正文生成\(/, '等待正文生成仍存在于正文主流程');
});

test('未配置结果不进入第二次请求，提示文案只有一个触发点', () => {
  const 提示文案 =
    '没有可用的外置变量模型。请在游戏设置 → 变量解析中填写自定义 API；本轮正文已保留，变量暂不更新。';
  assert.equal(引擎源码.split(提示文案).length - 1, 1, '未配置提示文案只有一个触发点');
  const 循环起点 = 引擎源码.indexOf('for (let 次 = 1; 次 <= 2 && !内置变量块; 次++)');
  assert.ok(循环起点 !== -1, '内置变量解析重试循环存在');
  const 循环段 = 引擎源码.slice(循环起点, 循环起点 + 1200);
  assert.match(循环段, /结果\.结果 === '未配置'/, '未配置分支存在');
  assert.match(循环段, /break;/, '未配置后直接跳出循环，不进入第二次请求');
});

test('原有官方 MVU 按钮路线仍存在', () => {
  assert.match(引擎源码, /MVU解析\.自动请求 &&[\s\S]*?await eventEmit\('人妻公寓:MVU外置模型重试'\)/, '官方外置模型重试事件保持');
  assert.match(引擎源码, /读取MVU解析状态/, 'MVU 状态读取保持');
});

test('自定义表单有明确“读取模型”按钮，走宿主 getModelList 代理而非 iframe 直接 fetch', () => {
  assert.match(设置源码, />读取模型<\/button>/, '存在明确读取模型按钮');
  assert.match(设置源码, /getModelList\(\{ apiurl: base, key \}\)/, '读取模型调用宿主 getModelList 代理');
  assert.doesNotMatch(设置源码, /\bfetch\s*\(/, '设置组件不得直接 fetch 外部 API');
});

test('模型列表逐项转字符串、trim、去空、去重并排序；下拉选择只写表单草稿', () => {
  assert.match(设置源码, /map\(String\)/, '逐项转字符串');
  assert.match(设置源码, /map\(模型 => 模型\.trim\(\)\)/, '逐项 trim');
  assert.match(设置源码, /filter\(Boolean\)/, '去空');
  assert.match(设置源码, /new Set\(/, '去重');
  assert.match(设置源码, /\.sort\(\(a, b\) => a\.localeCompare\(b\)\)/, '排序');
  assert.match(设置源码, /v-model="解析API表单\.模型名称"/, '下拉选择绑定表单草稿(模型名称)');
});

test('存在“保存并启用”按钮与独立提交函数：模型配置与自定义通道只走单一原子事务', () => {
  assert.match(设置源码, />保存并启用<\/button>/, '存在明确保存并启用按钮');
  assert.doesNotMatch(设置源码, /function 提交解析API表单/, '失焦自动提交函数已删除');
  assert.doesNotMatch(设置源码, /@change="提交解析API表单"|@blur="提交解析API表单"/, '不再有失焦自动提交');
  const 保存段 = 设置源码.slice(设置源码.indexOf('function 保存并启用'), 设置源码.indexOf('</script>'));
  assert.match(
    保存段,
    /const 成功 = 保存自定义变量解析设置\(\{/,
    '保存函数调用同时提交 MVU 配置与自定义通道的事务入口并保留返回值',
  );
  assert.match(保存段, /if \(成功\)[\s\S]{0,100}解析通道\.value = '自定义'/, '事务成功后才更新页面选中态');
  assert.doesNotMatch(保存段, /写入MVU设置\(|写入变量解析通道\('自定义'\)/, '保存函数不得恢复拆成两笔的半提交模式');
  // 切通道分段按钮不写 MVU 配置、不立即持久化自定义通道（自定义只走完整表单+保存）
  const 通道段 = 设置源码.slice(设置源码.indexOf('function 选择解析通道'), 设置源码.indexOf('function 保存并启用'));
  assert.doesNotMatch(通道段, /写入MVU设置/, '切通道按钮不写 MVU 配置');
  assert.doesNotMatch(通道段, /写入变量解析通道\('自定义'\)/, '切自定义按钮不立即写自定义通道');
  assert.equal(
    (设置源码.match(/写入变量解析通道\('自定义'\)/g) ?? []).length,
    0,
    '自定义通道不再存在独立第二笔写入',
  );
});

test('API 地址、Key、模型与数值输入框不再通过 @change／@blur 自动提交', () => {
  for (const 字段 of ['api地址', '密钥', '模型名称', '温度', 'top_p', '最大回复token数']) {
    assert.doesNotMatch(设置源码, new RegExp(`解析API表单\\.${字段}[^>]*@change`), `${字段} 输入框不得 @change 自动提交`);
    assert.doesNotMatch(设置源码, new RegExp(`解析API表单\\.${字段}[^>]*@blur`), `${字段} 输入框不得 @blur 自动提交`);
  }
  assert.doesNotMatch(设置源码, /提交解析API表单/, '自动提交逻辑已整体移除');
});

test('读取中禁用按钮；读取失败与保存失败都有可见反馈；失败不清空表单、不切换通道', () => {
  assert.match(设置源码, /:disabled="读取模型中"/, '读取中禁用读取按钮');
  assert.match(设置源码, /自定义反馈/, '存在可见反馈状态');
  assert.match(设置源码, /自定义反馈类型/, '反馈带类型(成功/失败)');
  assert.match(设置源码, /读取模型失败/, '读取失败有可见原因');
  assert.match(设置源码, /保存失败/, '保存失败有可见反馈');
  assert.match(设置源码, /已保存并启用/, '保存成功有可见反馈');
  assert.match(设置源码, /安全错误反馈\(e, key\)/, '宿主错误反馈先按当前 Key 脱敏');
  assert.match(设置源码, /\.split\(密钥\)\.join\('\*\*\*'\)/, '错误文本不会把 API Key 回显到界面');
  assert.match(设置源码, /const 地址 = 规范OpenAI兼容API地址\(解析API表单\.api地址\)/, '保存并启用统一使用规范函数');
});

test('设置页读取模型、保存并启用与回合引擎自定义请求都复用同一规范纯函数，不各写一套正则', () => {
  const 函数名 = '规范OpenAI兼容API地址';
  // 读取模型（草稿输入）用规范 base 请求 getModelList
  const 读取模型段 = 设置源码.slice(设置源码.indexOf('async function 读取模型'), 设置源码.indexOf('function 保存并启用'));
  assert.match(读取模型段, new RegExp(`const base = ${函数名}\\(解析API表单\\.api地址\\)`), '读取模型使用规范函数');
  assert.doesNotMatch(读取模型段, /api地址\.trim\(\)\.replace/, '读取模型不再单独去尾斜杠');
  // 保存并启用写穿规范地址，游戏内置解析立即读到可用地址
  const 保存段 = 设置源码.slice(设置源码.indexOf('function 保存并启用'), 设置源码.indexOf('</script>'));
  assert.match(保存段, new RegExp(`const 地址 = ${函数名}\\(解析API表单\\.api地址\\)`), '保存并启用写入规范地址');
  assert.doesNotMatch(保存段, /api地址\.trim\(\)\.replace/, '保存不再单独去尾斜杠');
  // 回合引擎自定义变量请求复用同一函数
  assert.match(引擎源码, new RegExp(`apiurl: ${函数名}\\(配置\\.api地址\\)`), '引擎自定义请求复用同一规范函数');
  assert.doesNotMatch(引擎源码, /配置\.api地址\.trim\(\)\.replace/, '引擎不再单独去尾斜杠');
  // 三个调用点必须来自同一导出，而不是各自实现
  assert.ok(读('src/人妻公寓/MVU解析模式.ts').includes(`export function ${函数名}`), '规范函数在 MVU解析模式 中导出');
});
