/* eslint-disable import-x/no-nodejs-modules -- Node-only cold-start wiring regression test */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const 手机目录 = fileURLToPath(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url));
const 内核路径 = resolve(手机目录, '内核.ts');
const 调度器路径 = resolve(手机目录, '壳/渲染/index.ts');
const 内核源码 = readFileSync(内核路径, 'utf8');

/** 剥离块注释与行注释，防注释文本误判为 import/export 语句（与 P8 测试同款）。 */
function 剥离注释(源码) {
  return 源码.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** 是否本地静态相对/绝对导入（./、../ 或 /）；裸标识符（外部包）不计入本地运行时依赖图。 */
function 是否本地导入(目标) {
  return 目标.startsWith('./') || 目标.startsWith('../') || 目标.startsWith('/');
}

/** 把模块说明符解析为 .ts 文件路径（支持直接 .ts、无扩展名与目录 index.ts），解析不出返回 null。 */
function 解析导入(当前文件, 目标) {
  if (!是否本地导入(目标)) return null;
  const 基 = 目标.startsWith('/') ? 目标 : resolve(dirname(当前文件), 目标);
  if (基.endsWith('.ts')) return existsSync(基) ? 基 : null;
  if (/\.(js|mjs|cjs)$/.test(基)) {
    const ts候选 = 基.replace(/\.(js|mjs|cjs)$/, '.ts');
    return existsSync(ts候选) ? ts候选 : null;
  }
  const ts文件 = `${基}.ts`;
  if (existsSync(ts文件)) return ts文件;
  const index文件 = resolve(基, 'index.ts');
  return existsSync(index文件) ? index文件 : null;
}

/** 按顶层逗号切分说明符列表（type { X } 的内层花括号不计）。 */
function 按顶层逗号切分(s) {
  const 结果 = [];
  let 深度 = 0;
  let 起 = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{' || c === '[' || c === '(') 深度 += 1;
    else if (c === '}' || c === ']' || c === ')') 深度 -= 1;
    else if (c === ',' && 深度 === 0) {
      结果.push(s.slice(起, i));
      起 = i + 1;
    }
  }
  结果.push(s.slice(起));
  return 结果;
}

/** import/export 的说明符段是否纯类型（import type ... / export type ... / 全 type 列表）；
 *  纯类型在编译期被擦除，不构成运行时模块加载边。 */
function 纯类型说明符(段) {
  const s = 段.trim();
  if (s === 'type' || s.startsWith('type ')) return true;
  if (s.startsWith('{') && s.endsWith('}')) {
    const 内 = s.slice(1, -1).trim();
    if (内 === '') return false; // import {} from —— 空列表仍加载模块（罕见）
    return 按顶层逗号切分(内).every(元素 => 元素.trim().startsWith('type '));
  }
  return false;
}

/** 提取一个文件里所有会在运行时加载本地模块的 import/export 边（解析为绝对路径数组）。 */
function 运行时本地边(文件) {
  const 源码 = 剥离注释(readFileSync(文件, 'utf8'));
  const 结果 = [];
  // 纯副作用导入：import '...';
  const 副作用 = /\bimport\s+['"]([^'"]+)['"]\s*;?/g;
  for (const 命中 of 源码.matchAll(副作用)) {
    const 解析后 = 解析导入(文件, 命中[1]);
    if (解析后) 结果.push(解析后);
  }
  // import/export ... from '...';
  const from声明 = /\b(?:import|export)\s+([\s\S]*?)\s*from\s+['"]([^'"]+)['"]\s*;?/g;
  for (const 命中 of 源码.matchAll(from声明)) {
    if (纯类型说明符(命中[1])) continue; // import type / export type 不加载模块
    const 解析后 = 解析导入(文件, 命中[2]);
    if (解析后) 结果.push(解析后);
  }
  return 结果;
}

/** 从公开组合根（手机/内核.ts）出发递归解析运行时依赖图（去重、防环）。 */
function 从内核收集运行时依赖图() {
  const 已访问 = new Set([内核路径]);
  const 队列 = [内核路径];
  while (队列.length) {
    const 当前 = 队列.shift();
    for (const 边 of 运行时本地边(当前)) {
      if (!已访问.has(边)) {
        已访问.add(边);
        队列.push(边);
      }
    }
  }
  return 已访问;
}

/** 递归列出手机模块下所有 .ts 文件（供“端口注册全局唯一”断言）。 */
function 手机全部TS文件() {
  const 结果 = [];
  const 遍历 = dir => {
    for (const 项 of readdirSync(dir)) {
      const 全 = resolve(dir, 项);
      if (statSync(全).isDirectory()) 遍历(全);
      else if (全.endsWith('.ts')) 结果.push(全);
    }
  };
  遍历(手机目录);
  return 结果;
}

test('公开组合根 手机/内核.ts 的运行时依赖图必须可达渲染调度器 ./壳/渲染/index.ts（冷启动接线）', () => {
  const 依赖图 = 从内核收集运行时依赖图();
  assert.ok(
    依赖图.has(调度器路径),
    `冷启动接线断裂：${内核路径} 的运行时依赖图未加载渲染调度器（壳/渲染/index.ts）。\n` +
      `挂载/红点开合/父亲通话三个页面端口只在渲染调度器模块初始化时注册（注册手机挂载端口、` +
      `注册手机红点开合端口、注册父亲通话UI端口），未加载时 UI 刷新注册表保持空，` +
      `请求手机重绘()/请求刷新手机红点() 经 optional chaining 静默 no-op，微信聊天/朋友圈/设置整屏白屏。`,
  );
});

test('三个页面端口注册全局唯一由渲染调度器持有，内核不得复制，接线只能出现一次', () => {
  const 调度器源码 = readFileSync(调度器路径, 'utf8');
  const 注册们 = ['注册手机挂载端口({', '注册手机红点开合端口({', '注册父亲通话UI端口({'];
  // 调度器真实持有三个注册，且各只注册一次
  for (const 注册 of 注册们) {
    const 次数 = 调度器源码.split(注册).length - 1;
    assert.equal(次数, 1, `渲染调度器应持有 ${注册} 恰好一次，实际 ${次数} 次`);
  }
  // 手机模块全局只有渲染调度器调用这三个注册（唯一页面组合所有者）
  for (const 注册 of 注册们) {
    const 拥有者 = [];
    for (const 文件 of 手机全部TS文件()) {
      if (readFileSync(文件, 'utf8').includes(注册)) 拥有者.push(文件);
    }
    assert.deepEqual(拥有者, [调度器路径], `${注册} 应全局唯一由渲染调度器持有，实际出现在:${拥有者.join('；')}`);
  }
  // 内核不得复制注册实现
  for (const 注册 of 注册们) {
    assert.doesNotMatch(内核源码, new RegExp(注册.replace(/[{}()]/g, '\\$&')), `内核不得复制页面端口注册:${注册}`);
  }
  // 接线只能出现一次：内核以一次性副作用 import 加载渲染调度器
  const 接线次数 = (内核源码.match(/import '\.\/壳\/渲染\/index';/g) ?? []).length;
  assert.equal(接线次数, 1, `渲染调度器副作用接线应恰好出现一次，实际 ${接线次数} 次`);
  // 内核只做副作用接线，不得改走具名 import/再导出把组合职责搬回内核
  assert.doesNotMatch(内核源码, /from '\.\/壳\/渲染\/index'/, '内核应以裸副作用 import 加载渲染调度器，不得具名再导出');
});
