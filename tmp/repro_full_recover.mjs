import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const { Schema, 创建户节点 } = require('../src/人妻公寓/schema.ts');
const 资 = require('../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');

const data = Schema.parse({ 户: { 101: 创建户节点(0) } });
资.完全恢复玩家资源(data);
console.log('满值前:', data.玩家资源.精力.当前值, data.玩家资源.体力.当前值,
  '上限:', 资.资源上限(data, '精力'), 资.资源上限(data, '体力'));
const 提示 = 资.结算普通等待恢复(data);
console.log('普通等待提示:', 提示);
console.log('满值后:', data.玩家资源.精力.当前值, data.玩家资源.体力.当前值);

// 道具在满值时
const data2 = Schema.parse({ 户: { 101: 创建户节点(0) } });
资.完全恢复玩家资源(data2);
data2.背包.push('清醒咖啡');
const r = 资.使用资源道具(data2, '清醒咖啡');
console.log('满值用咖啡:', JSON.stringify(r), '精力=', data2.玩家资源.精力.当前值, '背包=', data2.背包.length);
