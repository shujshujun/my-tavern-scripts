/* eslint-disable import-x/no-nodejs-modules -- Source-boundary regression for dedicated VTR generator */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts', import.meta.url), 'utf8');

function 函数片段(名称, 下一个名称) {
  const 起 = 源.indexOf(`export async function ${名称}`);
  assert.ok(起 >= 0, `缺少${名称}`);
  const 止 = 下一个名称 ? 源.indexOf(`export ${下一个名称}`, 起 + 1) : 源.length;
  return 源.slice(起, 止 > 起 ? 止 : 源.length);
}

test('VTR V4拥有专用隔离生成入口并复用统一取消、超时和前台租约', () => {
  const 片段 = 函数片段('生成录像带V4隔离草稿', 'function 写入隔离事件草稿');
  assert.match(片段, /构造录像带V4提示词包/u);
  assert.match(片段, /取得前台生成租约/u);
  assert.match(片段, /创建受控生成等待/u);
  assert.match(片段, /当前隔离正文等待/u);
  assert.match(片段, /受控生成超时错误前缀/u);
  assert.match(片段, /rqgy-vtr-v4/u);
});

test('专用VTR生成函数不读取普通预设、普通隔离历史、日常提示快照或最终显示正则', () => {
  const 片段 = 函数片段('生成录像带V4隔离草稿', 'function 写入隔离事件草稿');
  assert.doesNotMatch(
    片段,
    /预设破限段|构造隔离事件完整提示词快照|最近线程|当前预设名称|应用酒馆最终显示正则|妻状态|位置推算|朋友圈|数据库记忆/u,
  );
  assert.match(片段, /提示词快照/u);
});

test('VTR原文和提示词只进入专用隔离日志，V4被列入提示词留存白名单', () => {
  assert.match(源, /export type 隔离事件类型[^;]*录像带V4/su);
  const 写入起 = 源.indexOf('export function 写入隔离事件草稿');
  const 写入止 = 源.indexOf('export const 隔离提交聊天键', 写入起);
  const 写入片段 = 源.slice(写入起, 写入止);
  assert.match(写入片段, /\['荣耀洞', '监控', '录像带V4'\]\.includes\(草稿\.参数\.类型\)/u);
  assert.doesNotMatch(写入片段, /系统\._录像带V4|脚本写入/u);
});
