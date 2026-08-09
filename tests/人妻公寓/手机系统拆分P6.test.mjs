/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 游戏逻辑目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
const 节拍引擎源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
// P8:手动群接话与妻回复对 姐妹群一拍/攻略私聊提示 的消费点迁至 ./交互/邀约与发消息,断言改读新所有者。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const 生成引擎源码 = readFileSync(new URL('./生成引擎.ts', 手机目录), 'utf8');
const 摘要系统源码 = readFileSync(new URL('./摘要系统.ts', 手机目录), 'utf8');
const 旁路源码 = readFileSync(new URL('./静音会议旁路.ts', 手机目录), 'utf8');
const 通知桥源码 = readFileSync(new URL('./通知桥.ts', 手机目录), 'utf8');
const 冷落预警源码 = readFileSync(new URL('./冷落预警.ts', 手机目录), 'utf8');
const 父亲通话源码 = readFileSync(new URL('./交互/父亲通话.ts', 手机目录), 'utf8');
const 门面源码 = readFileSync(new URL('../手机系统.ts', 手机目录), 'utf8');
const 回合引擎源码 = readFileSync(new URL('./回合引擎.ts', 游戏逻辑目录), 'utf8');
const index源码 = readFileSync(new URL('./index.ts', 游戏逻辑目录), 'utf8');
const 旧水位路径 = new URL('./手机节拍水位.ts', 游戏逻辑目录);

function 截源(源, 开始, 结束) {
  const 起 = 源.indexOf(开始);
  const 止 = 源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源.slice(起, 止);
}

/** 把无 import 的 TS 片段转译为 CommonJS 并在隔离作用域执行（transpile-only）。 */
function 执行TS片段(片段, 导出名) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

test('节拍引擎真实拥有手机节拍/重入状态/六入口/共享姐妹群拍与水位裁剪，内核与旧水位文件无重复所有者', () => {
  // 新所有者真实声明
  assert.match(节拍引擎源码, /export async function 手机节拍\(\): Promise<void> \{/);
  assert.match(节拍引擎源码, /let 节拍进行中 = false;/);
  assert.match(节拍引擎源码, /let 节拍待补 = false;/);
  for (const 入口 of ['荣耀洞专属动态', '朋友圈近期流', '主动私聊', '楼务群自动消息', '仅你可见动态', '姐妹群主动拍']) {
    assert.match(节拍引擎源码, new RegExp(`async function ${入口}\\(上下文: 节拍上下文\\)`), `${入口} 应为节拍引擎内的显式子函数`);
  }
  assert.match(节拍引擎源码, /export async function 姐妹群一拍\(/);
  assert.match(节拍引擎源码, /export interface 手机朋友圈图片记录 \{/);
  assert.match(节拍引擎源码, /export function 裁剪手机节拍水位\(/);

  // 内核不再重复声明
  const 内核禁止声明 = [
    /async function 手机节拍\(/,
    /let 节拍进行中/,
    /let 节拍待补/,
    /async function 姐妹群一拍\(/,
    /const 频率倍率/,
    /function 攻略动态提示\(/,
    /function 私聊照片提示\(/,
    /function 选私聊候选图\(/,
    /function 校验朋友圈文案\(/,
    /function 取朋友圈兜底\(/,
    /function 取攻略兜底\(/,
    /function 选攻略配图\(/,
    /function 圈主题\(/,
    /function 选发圈主题\(/,
    /function 主题配图类\(/,
    /function 档位标签\(/,
    /function 裁剪手机节拍水位\(/,
  ];
  for (const 模式 of 内核禁止声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }
  // 旧水位文件已删除，不再留门面。
  assert.equal(existsSync(旧水位路径), false, '旧 手机节拍水位.ts 必须删除');
});

test('六入口由主循环按原顺序逐一调用，而不是只定义不用', () => {
  const 主循环 = 截源(节拍引擎源码, 'const 上下文: 节拍上下文 =', '// 只有内容成功入库');
  assert.match(
    主循环,
    /for \(const 入口 of \[荣耀洞专属动态, 朋友圈近期流, 主动私聊, 楼务群自动消息, 仅你可见动态, 姐妹群主动拍\]\)/,
    '六入口必须按原顺序进入拍循环',
  );
  assert.match(主循环, /await 入口\(上下文\)/, '主循环必须逐个 await 子函数');
  assert.match(主循环, /if \(结果 === '中止'\) return;/);
  assert.match(主循环, /if \(结果 === '有新'\) 有新 = true;/);
});

test('入口结果能区分无新/有新/中止，时间线失效或余波身份冲突整拍退出', () => {
  assert.match(节拍引擎源码, /type 入口拍结果 = '无新' \| '有新' \| '中止';/);
  // 每个入口都必须显式返回协议值
  assert.match(节拍引擎源码, /return '中止';/);
  assert.match(节拍引擎源码, /return '无新';/);
  // 整拍退出语义不得降级成"只跳过当前入口"：朋友圈晒装余波冲突、楼务探针、群议、时间线失效都中止整拍
  const 朋友圈 = 截源(节拍引擎源码, 'async function 朋友圈近期流', 'async function 主动私聊');
  assert.match(朋友圈, /if \(!时间线仍有效\(\)\) return '中止';/);
  assert.match(朋友圈, /if \(!登记待提交余波\(波!,\s*\{\s*圈晒:\s*true\s*\}\)\) return '中止';/);
  const 楼务 = 截源(节拍引擎源码, 'async function 楼务群自动消息', 'async function 仅你可见动态');
  assert.match(楼务, /if \(!时间线仍有效\(\)\) return '中止';/);
  assert.match(楼务, /if \(探针到点 && !登记待提交余波\(波2!,\s*\{\s*探针:\s*true\s*\}\)\) return '中止';/);
  const 群拍 = 截源(节拍引擎源码, 'async function 姐妹群主动拍', 'let 节拍进行中');
  assert.match(群拍, /if \(!时间线仍有效\(\)\) return '中止';/);
  assert.match(群拍, /if \(!登记待提交余波\(波3!,\s*\{\s*群议:\s*true\s*\}\)\) return '中止';/);
  // 正常无新内容必须继续后续入口，只有"中止"才整拍退出
  assert.doesNotMatch(朋友圈, /return;/);
});

test('楼务通知、时间线复核、冷落预警、频率门顺序保持', () => {
  const 拍 = 截源(节拍引擎源码, 'export async function 手机节拍()', '// ── 姐妹群一拍');
  const 坏结局门 = 拍.indexOf('if (data.系统._坏结局) return');
  const 特殊场景门 = 拍.indexOf('if (data.系统._特殊场景.id) return');
  const 建租约 = 拍.indexOf('创建手机时间线租约(当前聊天ID()');
  const 楼务同步 = 拍.indexOf('await 同步管理任务微信(data)');
  const 验楼务 = 拍.indexOf('if (!时间线仍有效()) return;', 楼务同步);
  const 冷落预警 = 拍.indexOf('await 冷落预警节拍()');
  const 验冷落 = 拍.indexOf('if (!时间线仍有效()) return;', 冷落预警);
  const 频率门 = 拍.indexOf('const 倍 = 频率倍率[读配置().频率]');
  const 有限门 = 拍.indexOf('if (!Number.isFinite(倍)) return;');
  const 六入口 = 拍.indexOf('for (const 入口 of [');
  assert.ok(坏结局门 >= 0 && 特殊场景门 > 坏结局门);
  assert.ok(建租约 > 特殊场景门);
  assert.ok(楼务同步 > 建租约 && 验楼务 > 楼务同步, '确定性楼务必须最先落库并立即复核');
  assert.ok(冷落预警 > 验楼务 && 验冷落 > 冷落预警, '冷落预警在楼务之后并在进入频率门前复核');
  assert.ok(频率门 > 验冷落 && 有限门 > 频率门 && 六入口 > 有限门, '频率总闸在六入口之前');
});

test('增量基线、节拍差量、已发私聊图差量、余波同事务与成功后 UI 注册表刷新保持', () => {
  // 取完整 手机节拍 函数体：前置门/基线记账/六入口/收尾一次截全，避免边界锚把增量基线或六入口排除在外。
  const 收尾 = 截源(节拍引擎源码, 'export async function 手机节拍()', '// ── 姐妹群一拍');
  assert.match(收尾, /const 原圈数 = 库\.圈\.length;/);
  assert.match(收尾, /const 原消息数 = 库\.消息\.length;/);
  assert.match(收尾, /const 原节拍 = \{ \.\.\.库\.节拍 \};/);
  assert.match(收尾, /const 原已发私聊图 = JSON\.stringify\(库\.已发私聊图\);/);
  assert.match(收尾, /节拍改\[k\] = v;/);
  assert.match(收尾, /已发私聊图改 = JSON\.stringify\(库\.已发私聊图\) === 原已发私聊图 \? undefined : 库\.已发私聊图/);
  assert.match(收尾, /if \(有新 \|\| Object\.keys\(节拍改\)\.length \|\| 已发私聊图改\)/);
  assert.match(收尾, /新圈: 库\.圈\.slice\(0, 库\.圈\.length - 原圈数\)/);
  assert.match(收尾, /新消息: 库\.消息\.slice\(原消息数\)/);
  assert.match(收尾, /余波消费:\s*待提交余波/);
  // 只有写入成功才刷新 UI，顺序保持红点后重绘，且经注册表不直调内核实现
  assert.match(收尾, /if \(!已写\) return;\s*请求刷新手机红点\(\);\s*请求手机重绘\(\);/);
  assert.doesNotMatch(节拍引擎源码, /刷新红点\(\)|渲染\(/);
  // 余波消费仍先核对身份再合并标记（原子消费）
  assert.match(节拍引擎源码, /if \(待提交余波 && !余波身份相同\(待提交余波\.预期, 余波\)\) return false;/);
  assert.match(节拍引擎源码, /待提交余波 \?\?= \{ 预期: 取余波身份\(余波\), 标记: \{\} \};/);
});

test('荣耀洞失败仍推进事件去重水位，普通内容失败不推进对应冷却水位', () => {
  const 荣耀 = 截源(节拍引擎源码, 'async function 荣耀洞专属动态', 'async function 朋友圈近期流');
  assert.match(荣耀, /if \(节点 && 文 && !泄底\)/);
  assert.match(荣耀, /库\.节拍\[荣耀键\]\s*=\s*钟;/);
  assert.match(荣耀, /AI 异常时本次跳过[\s\S]*事件仍去重/);
  const 发圈位 = 荣耀.indexOf('库.圈.unshift');
  const 发圈尾 = 荣耀.indexOf('库.节拍[朋友圈节拍键(荣耀门牌)] = 钟;');
  const 去重位 = 荣耀.indexOf('库.节拍[荣耀键] = 钟;');
  assert.ok(发圈位 >= 0 && 发圈尾 > 发圈位 && 去重位 > 发圈尾, '事件去重水位必须与成功发圈同级推进，不受 AI 失败影响');
  // 成功发圈后不得提前返回：成功返回一旦位于荣耀键写入之前，该水位就成为不可达代码，
  // 后续每回合都会重复生成并计费。成功与异常两条路径必须统一在末尾按布尔返回。
  assert.doesNotMatch(荣耀.slice(发圈尾, 去重位), /return/, '成功发圈到写入事件去重水位之间不得有任何 return');
  assert.match(荣耀, /return 有新 \? '有新' : '无新';/, '成功与异常两条路径应统一在末尾按布尔返回');

  const 朋友圈 = 截源(节拍引擎源码, 'async function 朋友圈近期流', 'async function 主动私聊');
  const 节拍推进位 = 朋友圈.indexOf('库.节拍[键] = 钟;');
  const 文判定位 = 朋友圈.indexOf('if (文) {');
  assert.ok(文判定位 >= 0 && 节拍推进位 > 文判定位, '普通朋友圈水位只能在内容成功后才推进');
  const 主动 = 截源(节拍引擎源码, 'async function 主动私聊', 'async function 楼务群自动消息');
  const 撤回判定位 = 主动.indexOf('if (撤回) {');
  const 撤回推进位 = 主动.indexOf('库.节拍[键] = 钟;', 撤回判定位);
  const 合法判定位 = 主动.indexOf('if (合法私聊) {');
  const 私聊推进位 = 主动.indexOf('库.节拍[键] = 钟;', 合法判定位);
  assert.ok(撤回判定位 >= 0 && 撤回推进位 > 撤回判定位, '撤回消息落库才算成功并推进水位');
  assert.ok(合法判定位 >= 0 && 私聊推进位 > 合法判定位, '普通私聊水位只能在合法文本落库后才推进');
});

test('回档水位实现与回合引擎 import 已迁到新模块，旧手机节拍水位.ts 不存在', async () => {
  assert.match(节拍引擎源码, /export function 裁剪手机节拍水位\(/);
  assert.match(节拍引擎源码, /解析荣耀洞动态节拍键/);
  assert.match(节拍引擎源码, /圈图节拍键前缀/);
  assert.match(回合引擎源码, /import \{ 裁剪手机节拍水位 \} from '\.\/手机\/节拍引擎';/);
  assert.equal(existsSync(旧水位路径), false, '旧 手机节拍水位.ts 必须删除，不允许再留门面');

  // 行为不弱化：数据层集中键段 + 节拍引擎水位段拼成无 import 片段执行。
  const 键段 = 数据层源码.slice(数据层源码.indexOf('// 节拍键'));
  const 水位段 = 节拍引擎源码.slice(节拍引擎源码.indexOf('// 手机节拍水位'));
  const { 裁剪手机节拍水位 } = 执行TS片段(`${键段}\n${水位段}`, ['裁剪手机节拍水位']);
  const 结果 = 裁剪手机节拍水位(
    { '圈:101': 9, '私:101': 8, '圈图:101:美食': 3, '荣耀洞动态:101:2': 9, '荣耀洞动态:101:旧异常': 9 },
    1,
    [{ 谁: '夏乔', 图: '夏乔/美食_2' }],
    { 101: '夏乔' },
  );
  assert.equal(结果['圈:101'], 1, '普通水位夹到目标绝对时段');
  assert.equal(结果['私:101'], 1);
  assert.equal(结果['圈图:101:美食'], 2, '圈图游标从存活朋友圈重建');
  assert.equal(Object.hasOwn(结果, '荣耀洞动态:101:2'), false, '未来荣耀洞新格式键删除');
  assert.equal(结果['荣耀洞动态:101:旧异常'], 1, '异常旧键保守保留并夹 value');
});

test('姐妹群一拍导出并由交互模块 import，攻略私聊提示只有生成引擎一个定义', () => {
  assert.match(节拍引擎源码, /export async function 姐妹群一拍\(/);
  assert.match(交互源码, /import \{ 姐妹群一拍 \} from '\.\.\/节拍引擎';/);
  assert.match(交互源码, /await 姐妹群一拍\(data, 库, 楼, 起因, 控制\)/, '手动群接话仍消费共享姐妹群一拍');

  // 攻略私聊提示 定义唯一在生成引擎；节拍与交互模块都从生成引擎 import，不得复制。
  assert.match(生成引擎源码, /export function 攻略私聊提示\(m: 门牌, 阶段: number, 已确认: boolean\): string \{/);
  assert.match(生成引擎源码, /from '\.\/内容素材表'/);
  assert.match(生成引擎源码, /攻略动态方向\[m\]\.口吻/);
  assert.doesNotMatch(节拍引擎源码, /function 攻略私聊提示/);
  assert.doesNotMatch(内核源码, /function 攻略私聊提示/);
  assert.match(节拍引擎源码, /攻略私聊提示,/);
  assert.match(交互源码, /攻略私聊提示,/);
  assert.match(节拍引擎源码, /: 攻略私聊提示\(m, 阶段, 节点\.妻\.裂缝\.已确认\)/, '自动主动私聊仍消费共享提示');
  assert.match(交互源码, /: 攻略私聊提示\(门牌号, 节点\.妻\.当前阶段, 节点\.妻\.裂缝\.已确认\)/, '妻回复仍消费共享提示');
});

test('节拍引擎不 import 内核/门面，P2–P5 模块无反向依赖', () => {
  assert.doesNotMatch(节拍引擎源码, /from '\.\.\/内核'|from '\.\/内核'|from '\.\.\/手机系统'|from '\.\/手机系统'/, '节拍引擎不得反向 import 内核或门面');
  for (const [名称, 源码] of [
    ['数据层', 数据层源码],
    ['生成引擎', 生成引擎源码],
    ['摘要系统', 摘要系统源码],
    ['静音会议旁路', 旁路源码],
    ['通知桥', 通知桥源码],
    ['冷落预警', 冷落预警源码],
    ['交互/父亲通话', 父亲通话源码],
  ]) {
    assert.doesNotMatch(源码, /from '\.\/节拍引擎'/, `${名称}不得反向 import 节拍引擎`);
  }
  // P8:节拍引擎不得反向依赖交互业务（交互只单向消费 姐妹群一拍）。
  assert.doesNotMatch(节拍引擎源码, /邀约与发消息/, '节拍引擎不得反向依赖交互模块');
  // 依赖方向保持叶子向：节拍引擎只允许依赖 P2–P5 模块与公共叶子
  assert.match(节拍引擎源码, /from '\.\/数据层'/);
  assert.match(节拍引擎源码, /from '\.\/生成引擎'/);
  assert.match(节拍引擎源码, /from '\.\/通知桥'/);
  assert.match(节拍引擎源码, /from '\.\/冷落预警'/);
  assert.match(节拍引擎源码, /from '\.\/UI刷新'/);
});

test('内核显式 re-export 手机节拍与占用查询，旧门面路径不变', () => {
  assert.match(内核源码, /export \{ 手机节拍, 手机节拍进行中 \} from '\.\/节拍引擎';/);
  assert.match(门面源码, /export \* from '\.\/手机\/内核'/);
  assert.match(index源码, /import \{[\s\S]*手机节拍,[\s\S]*\} from '\.\/手机系统';/, 'index.ts 旧 import 路径不变');
  assert.match(index源码, /void 手机节拍\(\)/, '回合完成后仍驱动手机节拍');
});
