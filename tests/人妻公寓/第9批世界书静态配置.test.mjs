/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const YAML = require('yaml');

const 测试目录 = path.dirname(fileURLToPath(import.meta.url));
const 项目根 = path.resolve(测试目录, '../..');
const 人妻根 = path.join(项目根, 'src/人妻公寓');
const 世界书根 = path.join(人妻根, '世界书');
const 读文本 = 相对路径 => readFileSync(path.join(项目根, 相对路径), 'utf8');
const 读世界书 = 相对路径 => YAML.parse(readFileSync(path.join(世界书根, `${相对路径}.yaml`), 'utf8'));

const { 户静态表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 作息公共位置列表, 作息门牌列表, 妻基础位置, 每周时段数 } = require('../../src/人妻公寓/周作息.ts');
const {
  生成静音会议组合键,
  获取静音会议回退状态序列,
  获取静音会议素材相对路径,
  静音会议候选门牌顺序,
} = require('../../src/人妻公寓/静音会议配置.ts');

function 组合(列表, 数量, 起点 = 0, 前缀 = [], 结果 = []) {
  if (前缀.length === 数量) {
    结果.push([...前缀]);
    return 结果;
  }
  for (let i = 起点; i < 列表.length; i += 1) 组合(列表, 数量, i + 1, [...前缀, 列表[i]], 结果);
  return 结果;
}

function 联合类型字面量(源码, 起始标记, 结束标记) {
  const 起点 = 源码.indexOf(起始标记);
  const 终点 = 源码.indexOf(结束标记, 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, `找不到类型区段 ${起始标记}`);
  return new Set([...源码.slice(起点, 终点).matchAll(/'([^']+)'/g)].map(匹配 => 匹配[1]));
}

test('世界书索引只装载登记条目，变量协议固定为 100→99→98 的同深度顺序', () => {
  const 索引 = 读世界书('index');
  const 分组 = Object.fromEntries(索引.条目.map(项 => [项.文件夹, 项.条目]));
  const 全条目 = 索引.条目.flatMap(项 => 项.条目);
  const 文件条目 = 全条目.filter(项 => 项.文件);
  const 文件们 = 文件条目.map(项 => 项.文件);

  assert.equal(new Set(文件们).size, 文件们.length, 'index.yaml 不得重复 include 同一文件');
  for (const 文件 of 文件们) assert.equal(existsSync(path.join(世界书根, `${文件}.yaml`)), true, `${文件} 必须存在`);

  assert.deepEqual(
    分组.角色.map(项 => 项.文件),
    ['角色/主角', '角色/夏乔', '角色/沈静仪', '角色/顾国栋', '角色/许曼君', '角色/周小满', '角色/何俊生', '角色/安若妍'],
  );
  for (const 普通丈夫 of ['角色/陆嘉明', '角色/赵国强', '角色/江辰']) {
    assert.equal(文件们.includes(普通丈夫), false, `${普通丈夫} 已并入妻条目，不得双重注入`);
  }
  assert.deepEqual(
    分组.角色.filter(项 => 项.名称 === '顾国栋' || 项.名称 === '何俊生').map(项 => 项.激活策略.关键字[0]),
    ['丈夫焦点:顾国栋', '丈夫焦点:何俊生'],
  );

  const 变量协议 = 分组.变量.filter(项 => 项.名称.startsWith('[mvu_update]'));
  assert.deepEqual(
    变量协议.map(项 => ({ 名称: 项.名称, 深度: 项.插入位置.深度, 顺序: 项.插入位置.顺序, 启用: 项.启用 })),
    [
      { 名称: '[mvu_update]变量更新规则', 深度: 0, 顺序: 100, 启用: true },
      { 名称: '[mvu_update]变量输出格式', 深度: 0, 顺序: 99, 启用: true },
      { 名称: '[mvu_update]变量更新列表', 深度: 0, 顺序: 98, 启用: true },
    ],
  );
});

test('变量输出世界书与唯一双层 JSON Patch 协议一致，并保留 JSON 原始类型', () => {
  const 配置 = 读世界书('变量/变量输出格式').变量输出格式;
  const 规则 = 配置.rule.join('\n');
  const 格式 = 配置.format;

  assert.doesNotMatch(规则, /update analysis/i, '公开规则不得再要求兼容层会丢弃的 Analysis');
  assert.doesNotMatch(格式, /<Analysis>|<\/Analysis>/, 'UpdateVariable 内只能有 JSONPatch');
  assert.equal((格式.match(/<UpdateVariable>/g) ?? []).length, 1);
  assert.equal((格式.match(/<JSONPatch>/g) ?? []).length, 1);
  assert.match(格式, /<UpdateVariable>\s*<JSONPatch>[\s\S]*<\/JSONPatch>\s*<\/UpdateVariable>/);
  assert.doesNotMatch(格式, /"value"\s*:\s*"\$\{[^}]+\}"/, '通用带引号占位符会把数字误导成字符串');
  assert.match(规则, /preserve|原始类型|native JSON type/i, '规则必须明确保留 number/string/boolean/null 类型');
  assert.match(格式, /"path"\s*:\s*"\$\{\/户\/真实门牌\/妻\/允许字段\}"/);
  assert.match(格式, /"value"\s*:\s*\$\{new_value_as_json_literal\}/, '值占位符必须代表完整 JSON 字面量且不能预先加引号');
});

test('五户夫妻姓名、年龄、婚龄与职业在妻条目、丈夫条目和 stageConfig 三方一致', () => {
  const 配对 = [
    { 门牌: '101', 妻: '夏乔', 妻龄: '28岁', 夫: '陆嘉明', 夫龄: '30岁', 婚龄: '三年', 职业: '机械厂的技术员' },
    { 门牌: '102', 妻: '沈静仪', 妻龄: '33岁', 夫: '顾国栋', 夫龄: '45岁', 婚龄: '六年', 职业: '拍卖行部门经理' },
    { 门牌: '201', 妻: '许曼君', 妻龄: '36岁', 夫: '赵国强', 夫龄: '40岁', 婚龄: '十二年', 职业: '货运车队司机长' },
    { 门牌: '202', 妻: '周小满', 妻龄: '25岁', 夫: '何俊生', 夫龄: '32岁', 婚龄: '三年', 职业: '供应链主管' },
    { 门牌: '301', 妻: '安若妍', 妻龄: '28岁', 夫: '江辰', 夫龄: '35岁', 婚龄: '五年', 职业: '执业律师' },
  ];

  for (const 项 of 配对) {
    const 妻档 = 读世界书(`角色/${项.妻}`)[`${项.妻}人设`].基本信息;
    const 夫档 = 读世界书(`角色/${项.夫}`)[`${项.夫}人设`].基本信息;
    assert.equal(户静态表[项.门牌].妻名, 项.妻);
    assert.equal(户静态表[项.门牌].夫名, 项.夫);
    assert.equal(妻档.姓名, 项.妻);
    assert.equal(妻档.年龄, 项.妻龄);
    assert.equal(妻档.婚龄, 项.婚龄);
    assert.match(妻档.丈夫, new RegExp(`^${项.夫}\\(${项.夫龄},${项.职业}`));
    assert.equal(夫档.姓名, 项.夫);
    assert.equal(夫档.年龄, 项.夫龄);
    assert.match(夫档.身份, new RegExp(`^${项.门牌}室的男主人,${项.职业}`));
    assert.match(夫档.妻子, new RegExp(`^${项.妻}\\(${项.妻龄},结婚${项.婚龄}\\)$`));
  }
  assert.deepEqual([户静态表['302'].妻名, 户静态表['302'].夫名], ['母亲', '父亲']);
});

test('叙事世界书不向模型暴露脚本、注入、快照或内部状态实现术语', () => {
  const 文件们 = [
    '世界书/系统设定/世界观.yaml',
    '世界书/系统设定/开场白.yaml',
    '世界书/角色/主角.yaml',
    ...['何俊生', '周小满', '夏乔', '安若妍', '江辰', '沈静仪', '许曼君', '赵国强', '陆嘉明', '顾国栋'].map(
      名 => `世界书/角色/${名}.yaml`,
    ),
  ];
  const 禁止实现措辞 = /由脚本|脚本每轮|状态数据|由系统|系统注入|剧情节点注入|每轮快照|动态快照|snapshotSystem|\bMVU\b|\bSchema\b|数据库\s*SQL|_待发送事件|_特殊场景/;
  const 命中 = 文件们.flatMap(文件 => {
    const 行们 = 读文本(`src/人妻公寓/${文件}`).split(/\r?\n/);
    return 行们.flatMap((行, 索引) => (禁止实现措辞.test(行) ? [`${文件}:${索引 + 1}: ${行.trim()}`] : []));
  });
  assert.deepEqual(命中, [], `叙事条目出现实现层措辞：\n${命中.join('\n')}`);
});

test('成人 CG 清单的角色、五阶段、动作枚举和公开路径与运行时消费者双向一致', () => {
  const 清单 = JSON.parse(读文本('src/人妻公寓/成人CG清单.json'));
  const 消费者源 = 读文本('src/人妻公寓/脚本/游戏逻辑/成人CG系统.ts');
  const 阶段集合 = 联合类型字面量(消费者源, 'export type 亲密场景CG阶段', '/** 图库分线');
  const 动作集合 = 联合类型字面量(消费者源, 'export type CG动作 =', 'export interface 成人CG项');
  const 角色表 = { '101': '夏乔', '102': '沈静仪', '201': '许曼君', '202': '周小满', '301': '安若妍', '302': '母亲' };
  const 变体数 = {};
  const 阶段数 = {};

  assert.equal(清单.total, 清单.items.length);
  assert.equal(new Set(清单.items.map(项 => 项.id)).size, 清单.items.length);
  assert.equal(new Set(清单.items.map(项 => 项.path)).size, 清单.items.length);
  for (const 项 of 清单.items) {
    assert.equal(角色表[项.door], 项.role, `${项.id} 的门牌与角色错配`);
    assert.equal(阶段集合.has(项.stage), true, `${项.id} 使用消费者未知阶段 ${项.stage}`);
    assert.equal(动作集合.has(项.action), true, `${项.id} 使用消费者未知动作 ${项.action}`);
    assert.equal(['normal', 'pregnancy'].includes(项.variant), true);
    if (项.variant === 'pregnancy') {
      assert.equal(项.path, `assets/${项.door}/pregnancy/${项.stage}/${项.id}.webp`);
    } else {
      assert.match(项.path, new RegExp(`^assets/${项.door}/[^/]+/${项.id}\\.webp$`));
    }
    assert.doesNotMatch(项.path, /(^|\/)\.\.(\/|$)|\\/, '公开资源路径不得越级或使用反斜杠');
    变体数[项.variant] = (变体数[项.variant] ?? 0) + 1;
    阶段数[项.stage] = (阶段数[项.stage] ?? 0) + 1;
  }
  assert.deepEqual(变体数, 清单.variantCounts);
  assert.deepEqual(阶段数, 清单.stageCounts);
  assert.deepEqual(new Set(清单.items.map(项 => 项.stage)), 阶段集合);
  assert.deepEqual(new Set(清单.items.map(项 => 项.action)), 动作集合);
});

test('静音会议五户恰好覆盖全部 10 个双人和 10 个三人 CLEAN 素材，并按状态回退', () => {
  assert.deepEqual(静音会议候选门牌顺序, ['101', '102', '201', '202', '301']);
  const 全组合 = [...组合(静音会议候选门牌顺序, 2), ...组合(静音会议候选门牌顺序, 3)];
  const 键们 = 全组合.map(门牌们 => 生成静音会议组合键(门牌们));
  assert.equal(键们.length, 20);
  assert.equal(new Set(键们).size, 20);
  assert.equal(生成静音会议组合键(['302', '101']), null);
  assert.equal(生成静音会议组合键(['101', '101']), null);
  assert.equal(生成静音会议组合键(['101']), null);
  assert.deepEqual(获取静音会议回退状态序列('CLEAN'), ['CLEAN']);
  assert.deepEqual(获取静音会议回退状态序列('DETAIL'), ['DETAIL', 'CLEAN']);
  assert.deepEqual(获取静音会议回退状态序列('PEAK'), ['PEAK', 'CLEAN']);

  const 组合根 = path.join(人妻根, '素材/特殊场景/静音会议/组合');
  const 实际目录 = readdirSync(组合根, { withFileTypes: true })
    .filter(项 => 项.isDirectory())
    .map(项 => 项.name)
    .sort();
  assert.deepEqual(实际目录, [...键们].sort());
  for (const 门牌们 of 全组合) {
    const 相对路径 = 获取静音会议素材相对路径(门牌们, 'CLEAN');
    assert.equal(existsSync(path.join(人妻根, '素材', 相对路径)), true, `${相对路径} 必须存在`);
  }

  const 状态机源 = 读文本('src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts');
  const 界面源 = 读文本('src/人妻公寓/界面/客户端/composables/useMuteMeeting.ts');
  assert.match(状态机源, /静音会议候选门牌顺序\.filter/);
  assert.match(状态机源, /参与妻\.length < 2 \|\| 参与妻\.length > 3/);
  assert.match(界面源, /获取静音会议回退状态序列/);
  assert.match(界面源, /版本素材基址/);
});

test('六户周作息门牌与 stageConfig 完整对齐，每户都能生成 42 个合法时段', () => {
  assert.deepEqual(作息门牌列表, ['101', '102', '201', '202', '301', '302']);
  assert.deepEqual(Object.keys(户静态表).sort(), [...作息门牌列表].sort());
  assert.equal(每周时段数, 42);
  const 合法位置 = new Set([...作息门牌列表, ...作息公共位置列表]);
  for (const 门牌 of 作息门牌列表) {
    const 一周 = Array.from({ length: 每周时段数 }, (_, 时段) => 妻基础位置(门牌, 时段));
    assert.equal(一周.length, 42);
    assert.equal(一周.every(位置 => 合法位置.has(位置)), true, `${门牌} 有未登记作息位置`);
  }
});

test('数据库模板仍只含五张登记表，表名与数据库桥消费者完全一致', () => {
  const 模板 = JSON.parse(读文本('src/人妻公寓/人妻公寓数据库模板.json'));
  const 表们 = Object.values(模板).filter(项 => 项 && typeof 项 === 'object' && typeof 项.uid === 'string');
  const 表名 = 表们.map(项 => 项.name);
  const 预期 = ['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹', '纪要表'];
  assert.deepEqual(表名, 预期);
  assert.equal(new Set(表们.map(项 => 项.uid)).size, 5);
  for (const 表 of 表们) {
    assert.equal(Array.isArray(表.content) && 表.content.length === 1, true);
    assert.match(表.sourceData.ddl, /^CREATE TABLE /);
  }
  const 数据库桥源 = 读文本('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
  for (const 名 of 预期) assert.match(数据库桥源, new RegExp(`['"]${名}['"]`));
});
