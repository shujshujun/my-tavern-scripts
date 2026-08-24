/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 数据库源 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
const 回合源 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const 节拍源 = 读('src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts');
const 孕情源 = 读('src/人妻公寓/脚本/游戏逻辑/手机/孕情AI通知.ts');
const 朋友圈记忆源 = 读('src/人妻公寓/脚本/游戏逻辑/手机/朋友圈长期记忆.ts');
const 模板 = JSON.parse(读('src/人妻公寓/人妻公寓数据库模板.json'));

function 截源(源码, 开始, 结束) {
  const 起 = 源码.indexOf(开始);
  const 止 = 源码.indexOf(结束, 起 + 开始.length);
  assert.ok(起 >= 0 && 止 > 起, `无法截取：${开始} -> ${结束}`);
  return 源码.slice(起, 止);
}

function 执行TS(源码, exports, globals = {}) {
  const js = ts.transpileModule(源码.replace(/^export\s+/gm, ''), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const names = Object.keys(globals);
  Function('module', 'exports', ...names, `${js}\nmodule.exports = { ${exports.join(', ')} };`)(
    module,
    module.exports,
    ...names.map(name => globals[name]),
  );
  return module.exports;
}

function 载入手动选择纯函数() {
  const 解析 = 截源(数据库源, 'function 解析数据库数据', '\nasync function 限时等待');
  const 选择 = 截源(数据库源, 'export interface 数据库手动填表安全选择', '\nfunction 当前数据库表数据');
  return 执行TS(
    `const 数据库脚本所有权表名 = ['RQ_剧情事件', 'RQ_社交轨迹'] as const;
const 数据库脚本所有权表名集 = new Set<string>(数据库脚本所有权表名);
const 游戏表头 = {
  RQ_剧情事件: ['row_id', '楼层', '时间', '地点', '参与者', '玩家行动', '结果摘要', '事件编码'],
  RQ_社交轨迹: ['row_id', '类型', '人物', '事件', '结果', '游戏时间', '最后楼层', '事件键'],
};
interface 数据表 { name?: string; content?: unknown[][]; }
${解析}
${选择}`,
    ['计算数据库手动填表安全选择'],
  );
}

function 载入手动API保护() {
  const 解析 = 截源(数据库源, 'function 解析数据库数据', '\nasync function 限时等待');
  const 保护 = 截源(数据库源, 'export interface 数据库手动填表安全选择', '\nfunction 收集可访问数据库文档');
  return 执行TS(
    `interface 数据表 { name?: string; content?: unknown[][]; }
interface 数据库API {
  exportTableAsJson?: () => unknown;
  getTableTemplate?: () => unknown;
  getManualSelectedTables?: () => { selectedTables?: unknown; hasManualSelection?: unknown };
  setManualSelectedTables?: (keys: string[]) => boolean;
  clearManualSelectedTables?: () => boolean;
}
interface 数据库V2API { manualUpdate?: () => Promise<boolean>; }
const 数据库脚本所有权表名 = ['RQ_剧情事件', 'RQ_社交轨迹'] as const;
const 数据库脚本所有权表名集 = new Set<string>(数据库脚本所有权表名);
const 游戏表头 = {
  RQ_剧情事件: ['row_id', '楼层', '时间', '地点', '参与者', '玩家行动', '结果摘要', '事件编码'],
  RQ_社交轨迹: ['row_id', '类型', '人物', '事件', '结果', '游戏时间', '最后楼层', '事件键'],
};
let 测试API: (数据库API & 数据库V2API) | null = null;
function 设置测试API(api: 数据库API & 数据库V2API) { 测试API = api; }
function 取数据库API() { return 测试API; }
${解析}
${保护}`,
    ['设置测试API', '确保数据库手动填表选择安全', '安装数据库手动填表API保护', '恢复数据库手动填表API保护'],
  );
}

function 载入朋友圈纯函数() {
  const 纯函数段 = 截源(朋友圈记忆源, 'export function 构造朋友圈长期记忆事件键', '\nexport async function 同步朋友圈长期记忆');
  const 执行键段 = 截源(朋友圈记忆源, 'export function 构造朋友圈长期记忆执行键', '\n/**\n * 手机核心提交完成后');
  return 执行TS(`${纯函数段}\n${执行键段}`, ['构造朋友圈长期记忆事件键', '构造朋友圈社交轨迹', '构造朋友圈长期记忆执行键'], {
    格式化游戏内时间: 时 => `第${Math.floor(时 / 6) + 1}天 时段${时 % 6}`,
  });
}

function 载入朋友圈队列(控制) {
  const 段 = 朋友圈记忆源.slice(朋友圈记忆源.indexOf('export function 构造朋友圈长期记忆事件键'));
  return 执行TS(
    段,
    ['构造朋友圈长期记忆事件键', '排队同步朋友圈长期记忆'],
    {
      格式化游戏内时间: 时 => `时段${时}`,
      当前聊天ID: () => 控制.聊天ID,
      读取当前手机时间线租约世代: () => 控制.世代,
      同步社交轨迹: async (条目, 仍有效) => {
        if (!仍有效()) return '失败';
        控制.调用.push(条目.事件键);
        return '已确认';
      },
    },
  );
}

test('手动填表选择：默认全选和显式选择都物理排除两张脚本表，同时保留自定义表', () => {
  const { 计算数据库手动填表安全选择 } = 载入手动选择纯函数();
  const data = {
    sheet_rq_events: { name: 'RQ_剧情事件', content: [['row_id', '楼层', '时间', '地点', '参与者', '玩家行动', '结果摘要', '事件编码']] },
    sheet_memory: { name: 'RQ_人物长期记忆' },
    sheet_promises: { name: 'RQ_承诺与伏笔' },
    sheet_social: { name: 'RQ_社交轨迹', content: [['row_id', '类型', '人物', '事件', '结果', '游戏时间', '最后楼层', '事件键']] },
    sheet_summary: { name: '纪要表' },
    sheet_custom: { name: '作者自定义表' },
    sheet_same_name_custom: { name: 'RQ_剧情事件', content: [['row_id', '作者自定义列']] },
    mate: { type: 'chatSheets' },
  };

  const 默认 = 计算数据库手动填表安全选择(data, [], false);
  assert.deepEqual(默认.受保护表键, ['sheet_rq_events', 'sheet_social']);
  assert.deepEqual(默认.安全选择, ['sheet_memory', 'sheet_promises', 'sheet_summary', 'sheet_custom', 'sheet_same_name_custom']);
  assert.equal(默认.需要写回, true);

  const 显式 = 计算数据库手动填表安全选择(
    JSON.stringify(data),
    ['sheet_custom', 'sheet_rq_events', 'sheet_social', 'sheet_memory'],
    true,
  );
  assert.deepEqual(显式.安全选择, ['sheet_custom', 'sheet_memory']);
  assert.equal(显式.需要写回, true);

  const 已安全 = 计算数据库手动填表安全选择(data, ['sheet_custom', 'sheet_memory'], true);
  assert.deepEqual(已安全.安全选择, ['sheet_custom', 'sheet_memory']);
  assert.equal(已安全.需要写回, false);
});

test('手动填表硬保护同时覆盖公开选择 API、旧设置页与新版 V2 面板执行按钮', () => {
  assert.match(数据库源, /getManualSelectedTables\?:/);
  assert.match(数据库源, /setManualSelectedTables\?:/);
  assert.match(数据库源, /clearManualSelectedTables\?:/);
  assert.match(数据库源, /registerTableFillStartCallback\?:/);
  assert.match(数据库源, /确保数据库手动填表选择安全/);
  assert.match(数据库源, /#form-fill-manual-panel/);
  assert.match(数据库源, /\[id\$="-manual-table-selector"\]/);
  assert.match(数据库源, /checkbox\.disabled = true/);
  assert.match(数据库源, /event\.stopImmediatePropagation\(\)/, '执行按钮必须在捕获阶段阻止带脚本表的旧点击再安全重放');
  assert.match(数据库源, /允许重放按钮/);
  assert.match(数据库源, /安装数据库手动填表保护\(\)/);
  assert.match(数据库源, /安装数据库手动填表API保护/);
  assert.match(数据库源, /包装手动更新/);
  assert.match(数据库源, /恢复进入本卡前的手动填表选择失败/);
});

test('公开 API 保护：全选、清空默认和直接 manualUpdate 都先过滤，离开本卡恢复原选择与原方法', async () => {
  const { 设置测试API, 确保数据库手动填表选择安全, 安装数据库手动填表API保护, 恢复数据库手动填表API保护 } =
    载入手动API保护();
  const 表 = {
    sheet_event: { name: 'RQ_剧情事件', content: [['row_id', '楼层', '时间', '地点', '参与者', '玩家行动', '结果摘要', '事件编码']] },
    sheet_memory: { name: 'RQ_人物长期记忆' },
    sheet_social: { name: 'RQ_社交轨迹', content: [['row_id', '类型', '人物', '事件', '结果', '游戏时间', '最后楼层', '事件键']] },
    sheet_custom: { name: '自定义表' },
  };
  let selectedTables = [];
  let hasManualSelection = false;
  let 手动捕获 = [];
  const 原设置 = keys => {
    selectedTables = [...keys];
    hasManualSelection = true;
    return true;
  };
  const 原清空 = () => {
    selectedTables = [];
    hasManualSelection = false;
    return true;
  };
  const 原手动 = async () => {
    手动捕获 = hasManualSelection ? [...selectedTables] : Object.keys(表);
    return true;
  };
  const api = {
    exportTableAsJson: () => 表,
    getManualSelectedTables: () => ({ selectedTables: [...selectedTables], hasManualSelection }),
    setManualSelectedTables: 原设置,
    clearManualSelectedTables: 原清空,
    manualUpdate: 原手动,
  };
  设置测试API(api);
  const state = {
    已清理: false,
    重试计时器: [],
    观察器: new Map(),
    点击监听: new Map(),
    允许重放按钮: new WeakSet(),
    回调API: null,
    包装API: null,
  };
  安装数据库手动填表API保护(api, state);
  assert.equal(确保数据库手动填表选择安全(), true);
  assert.deepEqual(selectedTables, ['sheet_memory', 'sheet_custom']);

  api.setManualSelectedTables(Object.keys(表));
  assert.deepEqual(selectedTables, ['sheet_memory', 'sheet_custom'], '公开全选不能重新加入脚本表');
  api.clearManualSelectedTables();
  assert.deepEqual(selectedTables, ['sheet_memory', 'sheet_custom'], '默认全选语义也必须排除脚本表');

  selectedTables = Object.keys(表);
  hasManualSelection = true;
  await api.manualUpdate();
  assert.deepEqual(手动捕获, ['sheet_memory', 'sheet_custom'], '直接调用 manualUpdate 也必须在捕获 targetKeys 前收敛');

  恢复数据库手动填表API保护(state);
  assert.equal(api.setManualSelectedTables, 原设置);
  assert.equal(api.clearManualSelectedTables, 原清空);
  assert.equal(api.manualUpdate, 原手动);
  assert.equal(hasManualSelection, false, '退出本卡应恢复进入前的默认全选语义，避免影响其他角色卡');
});

test('游戏后台填表不再调用无目标表的整批 triggerUpdate，改走尊重 updateFrequency 的自动调度事件', () => {
  const 触发段 = 截源(数据库源, 'export async function 触发数据库增量更新', '/** 同一聊天同一时刻只允许一个安装任务');
  assert.match(触发段, /脚本所有权模板已启用\) return '无接口'/);
  assert.match(触发段, /api\.triggerUpdate\.call\(api\)/, '旧模板兼容仍保留公开 triggerUpdate');

  const 广播段 = 截源(回合源, 'async function 广播生成完成事件', '\nlet 数据库记录失败提示签名');
  assert.match(广播段, /V2结果 === '无接口'|V2结果 !== '无接口'/);
  assert.match(广播段, /GENERATION_STARTED/);
  assert.match(广播段, /GENERATION_ENDED/);

  assert.equal(模板.sheet_rq_events.updateConfig.updateFrequency, 0);
  assert.equal(模板.sheet_rq_social_history.updateConfig.updateFrequency, 0);
});

test('朋友圈长期记忆：只有脚本标记的重要动态入社交轨迹，事件键稳定且不保存朋友圈原文', () => {
  const { 构造朋友圈长期记忆事件键, 构造朋友圈社交轨迹, 构造朋友圈长期记忆执行键 } = 载入朋友圈纯函数();
  const 事件键 = 构造朋友圈长期记忆事件键('仅你可见', '101', 8, 20, ' 含 空格/符号 ');
  assert.match(事件键, /^RQP-朋友圈-仅你可见-101-8-20-含_空格_符号$/u);

  const 普通动态 = { 楼: 8, 时: 20, 谁: '夏乔', 文: '今天做了饭。', 评: [] };
  assert.equal(构造朋友圈社交轨迹(普通动态), null, '普通日常动态不能污染长期记忆');

  const 重要动态 = {
    ...普通动态,
    文: '这句玩家可见原文绝不能写入数据库',
    长期记忆: {
      事件键,
      事件: '夏乔发布一条仅玩家可见的私密动态',
      结果: '两人的私密默契继续推进',
    },
  };
  const 条目 = 构造朋友圈社交轨迹(重要动态);
  assert.equal(条目.类型, '朋友圈');
  assert.equal(条目.人物, '夏乔');
  assert.equal(条目.事件键, 事件键);
  assert.doesNotMatch(JSON.stringify(条目), /这句玩家可见原文/);

  assert.equal(
    构造朋友圈社交轨迹({ ...重要动态, 长期记忆: { ...重要动态.长期记忆, 事件键: '朋友圈-坏键' } }),
    null,
  );
  const 本聊天 = 构造朋友圈长期记忆执行键('chat-a', 3, 事件键);
  assert.notEqual(本聊天, 构造朋友圈长期记忆执行键('chat-b', 3, 事件键), '切聊天后同业务键必须重新写当前聊天数据库');
  assert.notEqual(本聊天, 构造朋友圈长期记忆执行键('chat-a', 4, 事件键), '回档/swipe 世代变化后不得沿用旧分支确认缓存');
  assert.equal(构造朋友圈长期记忆执行键('', 3, 事件键), null);
});

test('重要朋友圈接线覆盖仅你可见、荣耀暗示、换装晒装与借种家庭计划公开动态', () => {
  assert.match(节拍源, /构造朋友圈长期记忆事件键\('荣耀暗示'/);
  assert.match(节拍源, /构造朋友圈长期记忆事件键\('晒装'/);
  assert.match(节拍源, /构造朋友圈长期记忆事件键\('仅你可见'/);
  assert.match(节拍源, /排队同步朋友圈长期记忆\(库\.圈, 时间线仍有效\)/, '下一拍必须补偿数据库暂不可用的旧动态');
  assert.match(节拍源, /排队同步朋友圈长期记忆\(新圈增量, 时间线仍有效\)/);
  assert.match(孕情源, /构造朋友圈长期记忆事件键\('家庭计划公开'/);
  assert.match(孕情源, /排队同步朋友圈长期记忆\(新圈, 时间线仍有效\)/);

  const 社交 = 模板.sheet_rq_social_history;
  assert.match(社交.sourceData.note, /重要朋友圈/);
  assert.match(社交.sourceData.note, /普通晒饭、天气和同质化日常动态不入表/);
  assert.match(社交.sourceData.note, /“朋友圈”/);
});

test('朋友圈同步去重按聊天与手机时间线世代隔离：同分支幂等，切聊或回档后同事件可重新落库', async () => {
  const 控制 = { 聊天ID: 'chat-a', 世代: 1, 调用: [] };
  const { 构造朋友圈长期记忆事件键, 排队同步朋友圈长期记忆 } = 载入朋友圈队列(控制);
  const 事件键 = 构造朋友圈长期记忆事件键('仅你可见', '101', 8, 20);
  const 动态 = {
    楼: 8,
    时: 20,
    谁: '夏乔',
    文: '不入库的原文',
    评: [],
    长期记忆: { 事件键, 事件: '夏乔发布私密动态', 结果: '两人的私密默契继续推进' },
  };
  const 等待队列 = () => new Promise(resolve => setTimeout(resolve, 0));

  排队同步朋友圈长期记忆([动态]);
  排队同步朋友圈长期记忆([动态]);
  await 等待队列();
  assert.equal(控制.调用.length, 1);

  控制.世代 = 2;
  排队同步朋友圈长期记忆([动态]);
  await 等待队列();
  assert.equal(控制.调用.length, 2, '回档/swipe 后数据库旧行可能已撤销，必须允许同业务键重建');

  控制.聊天ID = 'chat-b';
  排队同步朋友圈长期记忆([动态]);
  await 等待队列();
  assert.equal(控制.调用.length, 3, '数据库按聊天隔离，另一聊天不能沿用 chat-a 的确认缓存');
});
