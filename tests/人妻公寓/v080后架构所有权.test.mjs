/* eslint-disable import-x/no-nodejs-modules -- Node-only architecture audit */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const 根 = path.resolve(import.meta.dirname, '../../src/人妻公寓');

function 递归文件(目录, 扩展 = new Set(['.ts', '.vue', '.mjs'])) {
  const 结果 = [];
  for (const 名 of readdirSync(目录)) {
    const 完整 = path.join(目录, 名);
    if (statSync(完整).isDirectory()) 结果.push(...递归文件(完整, 扩展));
    else if (扩展.has(path.extname(名))) 结果.push(完整);
  }
  return 结果;
}

const 源文件 = 递归文件(根);
const 相对 = 文件 => path.relative(根, 文件).replaceAll('\\', '/');
const 读 = 文件 => readFileSync(文件, 'utf8');

function 调用文件(函数名) {
  // `g` 正则会在 Array.filter 的不同文件之间保留 lastIndex，导致同一模式随机漏文件。
  const 模式 = new RegExp(`${函数名}\\s*\\(`);
  return 源文件
    .filter(文件 => 模式.test(读(文件)))
    .map(相对)
    .sort();
}

test('世界时段原语只有楼层时钟定义、时间推进事务消费，业务模块不得另开时间入口', () => {
  const 推进时段文件 = 调用文件('推进时段');
  assert.deepEqual(推进时段文件, ['脚本/游戏逻辑/时间推进系统.ts', '脚本/游戏逻辑/楼层时钟.ts']);
  const 睡眠文件 = 调用文件('推进到次日早晨');
  assert.deepEqual(睡眠文件, ['脚本/游戏逻辑/时间推进系统.ts', '脚本/游戏逻辑/楼层时钟.ts']);
});

test('RQ_剧情事件不允许普通 insertRow 兜底，SQLite mutation 仍是唯一写路线', () => {
  const 数据库桥 = 读(path.join(根, '脚本/游戏逻辑/数据库桥.ts'));
  assert.doesNotMatch(数据库桥, /\binsertRow\s*\(/);
  assert.match(数据库桥, /executeSqlMutation/);
  assert.match(数据库桥, /数据库脚本写入能力/);
});

test('手机拆分模块不反向 import 内核或旧门面，避免副作用重复注册与第二份状态', () => {
  const 手机目录 = path.join(根, '脚本/游戏逻辑/手机');
  for (const 文件 of 递归文件(手机目录, new Set(['.ts']))) {
    const 文件名 = 相对(文件);
    if (文件名.endsWith('/内核.ts')) continue;
    const 源码 = 读(文件);
    assert.doesNotMatch(源码, /from ['"][^'"]*手机系统['"]/, `${文件名} 不得反向依赖旧门面`);
    assert.doesNotMatch(源码, /from ['"][^'"]*\/内核['"]/, `${文件名} 不得反向依赖组合根`);
  }
});

test('游戏逻辑中的自定义 raw 生成只存在于三个受控所有者', () => {
  const 命中 = 调用文件('generateRaw').filter(文件 => 文件.startsWith('脚本/游戏逻辑/'));
  assert.deepEqual(命中, [
    '脚本/游戏逻辑/回合引擎.ts',
    '脚本/游戏逻辑/手机/生成引擎.ts',
    '脚本/游戏逻辑/隔离事件引擎.ts',
  ]);
  const 回合 = 读(path.join(根, '脚本/游戏逻辑/回合引擎.ts'));
  const 手机 = 读(path.join(根, '脚本/游戏逻辑/手机/生成引擎.ts'));
  const 隔离 = 读(path.join(根, '脚本/游戏逻辑/隔离事件引擎.ts'));
  assert.match(回合, /取得前台生成租约/);
  assert.match(手机, /取得手机生成租约/);
  assert.match(隔离, /取得前台生成租约/);
});

test('变量解析的现代候选全部进入统一协议规范器，提示词不再宣称外层单标签足够', () => {
  const 回合 = 读(path.join(根, '脚本/游戏逻辑/回合引擎.ts'));
  assert.match(回合, /import \{[^}]*规范变量协议候选[^}]*\} from '.\/变量块协议'/);
  assert.doesNotMatch(回合, /只输出一个完整且可解析的 <UpdateVariable>\.\.\.<\/UpdateVariable> 块/);
  assert.match(回合, /<JSONPatch> 是常驻且必需的内层标签/);
  assert.match(回合, /const 规范块 = 规范变量协议候选\(完整\)/);
  assert.match(回合, /const 规范块 = 规范变量协议候选\(裸补丁\)/);
});

test('源码与测试不得留下 skip/todo，只能以真实通过或失败表达审查结果', () => {
  const 测试根 = path.resolve(import.meta.dirname);
  for (const 文件 of 递归文件(测试根, new Set(['.mjs']))) {
    const 源码 = 读(文件);
    assert.doesNotMatch(源码, /\b(?:test|describe|it)\.(?:skip|todo|only)\s*\(/, 相对(文件));
  }
});
