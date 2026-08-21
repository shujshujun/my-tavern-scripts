/* eslint-disable import-x/no-nodejs-modules -- Node-only source matrix test */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const 仓库根 = fileURLToPath(new URL('../../', import.meta.url));
const 源码根 = path.join(仓库根, 'src/人妻公寓');
const App路径 = path.join(源码根, '界面/客户端/App.vue');
const App源码 = readFileSync(App路径, 'utf8');

function 递归源码(目录) {
  const 结果 = [];
  for (const 项 of readdirSync(目录, { withFileTypes: true })) {
    const 完整 = path.join(目录, 项.name);
    if (项.isDirectory()) 结果.push(...递归源码(完整));
    else if (项.isFile() && /\.(?:ts|vue)$/u.test(项.name)) 结果.push(完整);
  }
  return 结果;
}

function 事件名们(源码, 方法) {
  const 模式 = new RegExp(方法 + String.raw`\(\s*['"](人妻公寓:[^'"]+)['"]`, 'gu');
  return [...源码.matchAll(模式)].map(匹配 => 匹配[1]);
}

const 全部源码 = 递归源码(源码根).map(文件 => ({ 文件, 源码: readFileSync(文件, 'utf8') }));
const 监听者 = new Map();
const 生产者 = new Map();
for (const { 文件, 源码 } of 全部源码) {
  for (const 名 of 事件名们(源码, 'eventOn')) {
    if (!监听者.has(名)) 监听者.set(名, []);
    监听者.get(名).push(文件);
  }
  for (const 名 of 事件名们(源码, 'eventEmit')) {
    if (!生产者.has(名)) 生产者.set(名, []);
    生产者.get(名).push(文件);
  }
}

test('客户端发出的全部静态业务事件都有脚本消费者，客户端监听的全部事件都有生产者', () => {
  const 客户端发出 = [...new Set(事件名们(App源码, 'eventEmit'))];
  const 客户端监听 = [...new Set(事件名们(App源码, 'eventOn'))];
  assert.equal(客户端发出.length, 57, '新增或删除客户端事件时必须重新审查生产—消费矩阵');
  const 借种客户端事件 = [
    '人妻公寓:拆除借种摄像头',
    '人妻公寓:确认借种断线',
    '人妻公寓:启动借种',
    '人妻公寓:停止借种',
    '人妻公寓:查看借种阳性结果',
    '人妻公寓:拍摄借种三人合照',
    '人妻公寓:借种三人日常',
    '人妻公寓:借种朋友圈选择',
    '人妻公寓:拍摄借种产后家庭合照',
  ];
  assert.deepEqual(
    客户端发出.filter(事件 => 借种客户端事件.includes(事件)).sort(),
    [...借种客户端事件].sort(),
    '新增的九个借种事件必须全部留在受审矩阵，不能以动态字符串绕过生产—消费检查',
  );
  assert.equal(客户端监听.length, 22, '新增或删除客户端监听时必须重新审查生命周期所有者');
  assert.ok(客户端监听.includes('人妻公寓:借种CG'), '借种CG 必须作为显式客户端监听纳入生命周期审计');
  assert.deepEqual(
    客户端发出.filter(事件 => !监听者.has(事件)),
    [],
    '客户端不得发出无人消费的孤儿业务事件',
  );
  assert.deepEqual(
    客户端监听.filter(事件 => !生产者.has(事件)),
    [],
    '客户端不得监听永远不会生产的孤儿状态事件',
  );
});

test('客户端重复挂载由唯一入口和 App 卸载共同清理监听，多消费者只保留两项明确旁路', () => {
  assert.match(App源码, /onUnmounted\(\(\) => \{[\s\S]*?eventClearAll\(\)/u, 'App 卸载必须清空本 iframe 旧监听');
  const 客户端监听 = [...new Set(事件名们(App源码, 'eventOn'))];
  const 多消费者 = Object.fromEntries(
    客户端监听
      .map(事件 => [事件, 监听者.get(事件) ?? []])
      .filter(([, 文件们]) => 文件们.length > 1)
      .map(([事件, 文件们]) => [事件, 文件们.map(文件 => path.relative(仓库根, 文件).split(path.sep).join('/')).sort()]),
  );
  assert.deepEqual(Object.keys(多消费者).sort(), ['人妻公寓:回合完成', '人妻公寓:特殊场景状态']);
  assert.ok(
    多消费者['人妻公寓:回合完成'].some(文件 => 文件.endsWith('脚本/游戏逻辑/index.ts')),
    '回合完成的脚本消费者负责手机与后处理节拍',
  );
  assert.ok(
    多消费者['人妻公寓:特殊场景状态'].some(文件 => 文件.endsWith('手机/壳/挂载.ts')),
    '特殊场景状态的第二消费者只负责手机旁路刷新',
  );
});
