/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 手机生成源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts', import.meta.url),
  'utf8',
);
const 手机节拍源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url),
  'utf8',
);

test('序章完成只同步确定性楼务微信，不启动会抢正文生成槽的手机 AI 节拍', () => {
  const 开局开始 = 回合源码.indexOf('export async function 开始新游戏');
  const 开局结束 = 回合源码.indexOf('export async function 重开一局', 开局开始);
  assert.match(回合源码.slice(开局开始, 开局结束), /回合完成', \{ 跳过手机节拍: true \}/);

  const 完成监听 = 入口源码.slice(
    入口源码.indexOf("eventOn('人妻公寓:回合完成'"),
    入口源码.indexOf("eventOn('人妻公寓:布设摄像头'"),
  );
  assert.match(完成监听, /跳过手机节拍[\s\S]{0,220}同步管理任务微信/);
  assert.match(完成监听, /else \{\s*void 手机节拍\(\)/);
});

test('手机自动节拍和每个手机 AI 请求都公开在途状态，主正文启动前执行双向生成互斥门', () => {
  assert.match(手机节拍源码, /export function 手机节拍进行中\(\): boolean \{\s*return 节拍进行中;/);
  const 手机小生成 = 手机生成源码.slice(
    手机生成源码.indexOf('export async function 小生成'),
    手机生成源码.indexOf('export async function 微信短文本'),
  );
  assert.match(手机小生成, /取得手机生成租约\(\)/);
  assert.match(手机小生成, /if \(!租约\) return '';/);
  assert.match(手机小生成, /finally \{[\s\S]*租约\.释放\(\)/);
  const 回合入口 = 回合源码.slice(
    回合源码.indexOf('export async function 执行回合'),
    回合源码.indexOf('const 回合时间线世代'),
  );
  assert.match(回合入口, /手机节拍进行中\(\) \|\| 手机AI生成中\(\)/);
  assert.match(回合入口, /手机后台消息正在生成/);
  assert.match(回合入口, /取得前台生成租约\(\)/);
});

test('手机小生成在取得手机租约/任一路由前同步检查数据库迟到租约；忙时空返回零 AI', () => {
  const 手机小生成 = 手机生成源码.slice(
    手机生成源码.indexOf('export async function 小生成'),
    手机生成源码.indexOf('export async function 微信短文本'),
  );
  const 数据库检查 = 手机小生成.indexOf('全局数据库AI租约.在结算()');
  const 获租约 = 手机小生成.indexOf('取得手机生成租约()');
  assert.ok(数据库检查 >= 0 && 获租约 > 数据库检查, '数据库迟到检查必须先于取得手机租约');
  const 首个await = 手机小生成.indexOf('await ');
  assert.ok(首个await === -1 || 数据库检查 < 首个await, '数据库检查必须早于任何 await');
  const 拒绝位 = 手机小生成.indexOf("if (全局数据库AI租约.在结算()) return '';");
  assert.ok(拒绝位 >= 0 && 拒绝位 < 获租约, '数据库忙时必须直接空返回，不产生新 token/AI 调用');
});
