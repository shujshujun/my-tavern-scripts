/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const UI刷新源码 = readFileSync(new URL('./UI刷新.ts', 手机目录), 'utf8');
// P7B1:UI 刷新真实实现的注册职责迁至 ./壳/挂载。
const 挂载源码 = readFileSync(new URL('./壳/挂载.ts', 手机目录), 'utf8');
// P6:手机节拍水位已合并进 ./节拍引擎,水位源码断言改读新所有者。
const 节拍引擎源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');
// P8:交互业务迁至 ./交互/邀约与发消息,数据层消费断言改读新所有者。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 门面源码 = readFileSync(new URL('../手机系统.ts', 手机目录), 'utf8');

/** 把无 import 的 TS 片段转译为 CommonJS 并在隔离作用域执行（transpile-only）。 */
function 执行TS片段(片段, 导出名) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

test('数据层已真实接管 _微信 类型、读写与时间线/分支逻辑，内核无重复声明', () => {
  // 数据层真实声明 _微信 类型与读写/时间线逻辑
  assert.match(数据层源码, /export type 微信消息 = 微信消息记录;/);
  assert.match(数据层源码, /export interface 朋友圈条 \{/);
  assert.match(数据层源码, /export interface 微信库 \{/);
  assert.match(数据层源码, /export interface 手机余波身份 \{/);
  assert.match(数据层源码, /export type 手机余波标记 =/);
  assert.match(数据层源码, /export interface 手机余波消费 \{/);
  assert.match(数据层源码, /export interface 手机赴约提交 \{/);
  assert.match(数据层源码, /function 规范已读水位\(/);
  assert.match(数据层源码, /function 筛当前手机时间线</);
  assert.match(数据层源码, /export function 读库\(/);
  assert.match(数据层源码, /export async function 写库增量\(/);
  assert.match(数据层源码, /export async function 隔离当前手机分支\(/);
  assert.match(数据层源码, /export function 会话有未读\(/);
  assert.match(数据层源码, /export function 朋友圈有未读\(/);
  assert.match(数据层源码, /export function 带当前手机分支锚</);
  assert.match(数据层源码, /export function 按消息重建已发私聊图\(/);
  assert.match(数据层源码, /export const 手机可见单条硬上限 = 150;/);

  // 内核不再重复声明这些类型/函数/常量
  const 禁止声明 = [
    /interface 微信库 \{/,
    /interface 朋友圈条 \{/,
    /interface 手机余波身份 \{/,
    /interface 手机赴约提交 \{/,
    /interface 手机余波消费 \{/,
    /function 读库\(/,
    /async function 写库增量\(/,
    /async function 隔离当前手机分支\(/,
    /function 会话有未读\(/,
    /function 朋友圈有未读\(/,
    /function 筛当前手机时间线</,
    /function 规范已读水位\(/,
    /function 玩家名\(/,
    /function 验收短文本\(/,
    /const 手机可见单条硬上限 = 150;/,
  ];
  for (const 模式 of 禁止声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }

  // P8:数据层消费点迁至 交互/邀约与发消息；内核仅保留 按消息重建已发私聊图/隔离当前手机分支 的 re-export。
  assert.match(交互源码, /from '\.\.\/数据层'/);
  assert.match(交互源码, /读库\(/);
  assert.match(交互源码, /写库增量\(/);
  assert.match(交互源码, /手机可见单条硬上限/);
  assert.doesNotMatch(内核源码, /读库\(|写库增量\(|手机可见单条硬上限/, '内核不得再消费数据层业务符号');
});

test('数据层只请求 UI 刷新，不含内核 刷新红点/渲染 实现依赖', () => {
  assert.match(数据层源码, /import \{ 请求刷新手机红点 \} from '\.\/UI刷新'/);
  assert.match(数据层源码, /请求刷新手机红点\(\)/, '隔离当前手机分支完成后应请求红点刷新');
  assert.doesNotMatch(数据层源码, /刷新红点\(\)/, '数据层不得直接调用内核 刷新红点');
  assert.doesNotMatch(数据层源码, /渲染\(/, '数据层不得直接调用内核 渲染');
  assert.doesNotMatch(数据层源码, /from '\.\/内核'/, '数据层不得反向 import 内核');
  assert.doesNotMatch(数据层源码, /from '\.\.\/手机系统'/, '数据层不得反向 import 门面');
  assert.doesNotMatch(数据层源码, /from '\.\/节拍引擎'/, '数据层不得反向 import 节拍引擎');
});

test('UI 刷新注册表未注册安全 no-op，注册后准确转发', () => {
  const { 注册手机UI刷新实现, 请求手机重绘, 请求刷新手机红点 } = 执行TS片段(UI刷新源码, [
    '注册手机UI刷新实现',
    '请求手机重绘',
    '请求刷新手机红点',
  ]);
  let 重绘数 = 0;
  let 红点数 = 0;
  请求手机重绘();
  请求刷新手机红点();
  assert.equal(重绘数, 0, '未注册时请求手机重绘应安全 no-op');
  assert.equal(红点数, 0, '未注册时请求刷新红点应安全 no-op');

  注册手机UI刷新实现(
    () => {
      重绘数 += 1;
    },
    () => {
      红点数 += 1;
    },
  );
  请求手机重绘();
  请求刷新手机红点();
  assert.equal(重绘数, 1, '注册后请求手机重绘应准确转发');
  assert.equal(红点数, 1, '注册后请求刷新红点应准确转发');
});

test('所有节拍键构造结果与旧裸字符串逐字一致', () => {
  const 键起 = 数据层源码.indexOf('// 节拍键');
  assert.notEqual(键起, -1, '缺少节拍键段');
  const 键片段 = 数据层源码.slice(键起);
  const 键 = 执行TS片段(键片段, [
    '朋友圈节拍键',
    '私聊节拍键',
    '圈图节拍键',
    '邀约节拍键',
    '楼务群节拍键',
    '姐妹群节拍键',
    '荣耀洞动态节拍键',
    '解析荣耀洞动态节拍键',
  ]);
  assert.equal(键.朋友圈节拍键('101'), '圈:101');
  assert.equal(键.私聊节拍键('101'), '私:101');
  assert.equal(键.圈图节拍键('101', '美食'), '圈图:101:美食');
  assert.equal(键.邀约节拍键('101'), '约:101');
  assert.equal(键.楼务群节拍键, '群');
  assert.equal(键.姐妹群节拍键, '姐妹群');
  assert.equal(键.荣耀洞动态节拍键('101', 5), '荣耀洞动态:101:5');

  assert.deepEqual(键.解析荣耀洞动态节拍键('荣耀洞动态:101:5'), { 门牌: '101', 绝对时段: 5 });
  assert.equal(键.解析荣耀洞动态节拍键('荣耀洞动态:101:旧异常'), null, '异常旧键应解析失败');
  assert.equal(键.解析荣耀洞动态节拍键('荣耀洞动态::3'), null, '缺门牌应解析失败');
  assert.equal(键.解析荣耀洞动态节拍键('荣耀洞动态:101:-1'), null, '负时段应解析失败');
  assert.equal(键.解析荣耀洞动态节拍键('荣耀洞动态:缺时段'), null, '缺时段应解析失败');
});

test('手机节拍水位复用数据层集中键解析，原有裁剪行为保持', async () => {
  // P6:水位实现合并进 ./节拍引擎,由数据层集中键段与节拍引擎水位段拼成无 import 片段执行。
  assert.match(节拍引擎源码, /from '\.\/数据层'/);
  assert.match(节拍引擎源码, /解析荣耀洞动态节拍键/);
  assert.match(节拍引擎源码, /圈图节拍键前缀/);
  assert.doesNotMatch(节拍引擎源码, /const 圈图键前缀/, '不应再维护第二套圈图键前缀');
  assert.doesNotMatch(节拍引擎源码, /荣耀洞动态键\s*=\s*\/\^荣耀洞动态/, '不应再维护第二套荣耀洞正则');
  assert.match(节拍引擎源码, /const 圈图路径 =/, '朋友圈图片路径正则仍属于本文件');
  // 与 P3 键段同源的数据层节拍键段提供 解析荣耀洞动态节拍键/圈图节拍键前缀。
  const 键段 = 数据层源码.slice(数据层源码.indexOf('// 节拍键'));
  const 水位段 = 节拍引擎源码.slice(节拍引擎源码.indexOf('// 手机节拍水位'));
  const { 裁剪手机节拍水位 } = 执行TS片段(`${键段}\n${水位段}`, ['裁剪手机节拍水位']);
  const 结果 = 裁剪手机节拍水位(
    { '圈:101': 9, '私:101': 8, '圈图:101:美食': 3, '圈图:102:自拍': 3 },
    1,
    [
      { 谁: '夏乔', 图: '夏乔/美食_2' },
      { 谁: '沈静仪', 图: '沈静仪/居家_1' },
    ],
    { 101: '夏乔', 102: '沈静仪' },
  );
  assert.equal(结果['圈:101'], 1, '普通水位夹到目标绝对时段');
  assert.equal(结果['私:101'], 1);
  assert.equal(结果['圈图:101:美食'], 2, '圈图游标从存活朋友圈重建');
  assert.equal('圈图:102:自拍' in 结果, false, '无存活朋友圈时旧圈图游标应收掉');

  const 荣耀 = 裁剪手机节拍水位(
    {
      '荣耀洞动态:101:0': 9,
      '荣耀洞动态:101:1': 9,
      '荣耀洞动态:101:2': 9,
      '荣耀洞动态:101:旧异常': 9,
    },
    1,
    [],
    {},
  );
  assert.equal(荣耀['荣耀洞动态:101:0'], 1);
  assert.equal(荣耀['荣耀洞动态:101:1'], 1);
  assert.equal(Object.hasOwn(荣耀, '荣耀洞动态:101:2'), false, '键尾时段晚于回档点的未来键应删');
  assert.equal(荣耀['荣耀洞动态:101:旧异常'], 1, '异常旧键保守保留并夹 value');
});

test('内核 re-export 精确收口为 29 个公开符号，门面外部路径不变', () => {
  assert.match(内核源码, /export \{ 当前聊天ID \} from '\.\/运行时上下文'/);
  // P8:10 个无人从门面使用的导出不再 re-export（type 微信消息/朋友圈条 属其一）。
  assert.doesNotMatch(内核源码, /export type \{ 微信消息, 朋友圈条 \}/);

  const 公开符号 = [
    '当前聊天ID',
    '按消息重建已发私聊图',
    '隔离当前手机分支',
    '等待微信刷新宿主就绪',
    '恢复微信刷新恢复副本',
    '确认当前微信为刷新真值',
    '立即持久保存手机聊天变量',
    '当前微信联系保护表',
    '手机AI生成中',
    '手机生成请求标记',
    '当前微信摘要引用',
    '读取近期微信胶囊',
    '等待微信摘要任务',
    '设置静音会议手机生成中',
    '获取静音会议手机状态',
    '取会场私聊摘要提示',
    '冷落预警节拍',
    '同步管理任务微信',
    '家庭计划微信已读',
    '怀孕确认微信已读凭据',
    '预产微信已读凭据',
    '来电已接',
    '父亲通话已清理',
    '手机节拍',
    '手机节拍进行中',
    '静音会议私聊回复生成中',
    '挂载手机',
    '刷新红点',
    '打开手机',
  ];
  const 内核语法树 = ts.createSourceFile('内核.ts', 内核源码, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const 实际公开符号 = [];
  const 数据层公开符号 = [];
  for (const 声明 of 内核语法树.statements) {
    if (!ts.isExportDeclaration(声明) || !声明.exportClause || !ts.isNamedExports(声明.exportClause)) continue;
    for (const 元素 of 声明.exportClause.elements) {
      实际公开符号.push(元素.name.text);
      if (声明.moduleSpecifier?.text === './数据层') 数据层公开符号.push(元素.name.text);
    }
  }
  assert.deepEqual([...实际公开符号].sort(), [...公开符号].sort(), '内核公开符号必须精确，不得漏接恢复入口或重新泄露内部 API');
  assert.deepEqual(
    [...数据层公开符号].sort(),
    [
      '按消息重建已发私聊图',
      '隔离当前手机分支',
      '等待微信刷新宿主就绪',
      '恢复微信刷新恢复副本',
      '确认当前微信为刷新真值',
      '立即持久保存手机聊天变量',
      '当前微信联系保护表',
    ].sort(),
    '刷新恢复与硬保存入口必须继续通过原手机门面提供给启动和时间事务',
  );
  for (const 符号 of [
    '微信消息', '朋友圈条', '静音会议手机状态', '静音会议正文记忆',
    '获取会议会话禁用原因', '取静音会议正文记忆', '微信好友',
    '编译楼务群公开风闻摘要', '编译管理任务微信通知',
  ]) {
    assert.doesNotMatch(
      内核源码,
      new RegExp(`export[^\\n]{0,120}[,{\\s]${符号}(?=[,}\\s]|$)`),
      `内核不得再 re-export:${符号}`,
    );
  }
  assert.doesNotMatch(内核源码, /export \* /, '内核不得用 export * 重新泄露内部 API');
  // P7B1:UI 刷新真实实现改由挂载层注册（注册手机挂载端口 时经端口注入），内核不再直接注册。
  assert.match(挂载源码, /注册手机UI刷新实现\(端口\.重绘, 端口\.刷新红点\);/, '挂载层注册端口时应安装真实刷新实现');
  assert.doesNotMatch(内核源码, /注册手机UI刷新实现\(/);
  assert.match(门面源码, /export \* from '\.\/手机\/内核'/);
});
