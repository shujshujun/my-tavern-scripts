/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
// 2026-08-04 玩家实测:在垃圾房按撤回后,舞台显示上一楼(102)的旧记录且"没有识别房间"。
// 根因:撤回复用通用回档路径,协调已删时间线 在无 恢复回合变量 时把 _场景/_在场 等全部清 null,
// 客户端 同步场景自变量 读到 _场景=null → 当前房间丢失。撤回是单回合撤销,回到的场景
// 记录在 _上次回合.chat快照 中,必须原位恢复;任意史册回档(目标楼未知)仍保守清场。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');

test('撤回(回档到上次回合前末楼)必须按回合快照恢复场景过程态', () => {
  assert.match(
    回合源码,
    /const 撤回快照 = 上次回合 && 上次回合\.回合前末楼 === 楼层 \? 上次回合\.chat快照 : undefined;/,
    '只有目标楼恰为上次成功回合的回合前末楼才算撤回,对不上一律退回保守清场',
  );
  // 断言源码位置顺序:撤回快照声明必须物理位于撤回路径删楼调用之前。
  // 中间夹杂 场景保留 等回档逻辑(2026-08-04 修复),距离不再固定,故用精确锚点定位而非短距离正则。
  const 撤回快照声明锚 = 'const 撤回快照 = 上次回合 && 上次回合.回合前末楼 === 楼层 ? 上次回合.chat快照 : undefined;';
  const 撤回删楼锚 = 'await 内部删除聊天消息(_.range(楼层 + 1, 末楼 + 1));';
  const 撤回快照声明位置 = 回合源码.indexOf(撤回快照声明锚);
  const 撤回删楼位置 = 回合源码.indexOf(撤回删楼锚);
  assert.ok(撤回快照声明位置 >= 0, '未找到撤回快照声明:' + 撤回快照声明锚);
  assert.ok(
    撤回删楼位置 >= 0,
    '未找到撤回路径物理删楼调用;锚须含 "楼层 + 1, 末楼 + 1" 以排除重掷/重开等其它内部删除聊天消息调用',
  );
  assert.ok(
    撤回快照声明位置 < 撤回删楼位置,
    '快照判定必须先于物理删楼读取,不得在删楼后拿旧变量冒充',
  );
  assert.match(
    回合源码,
    /撤回快照 \? \{ 恢复回合变量: 撤回快照, 清上次回合: true, 作废晋阶镜像: true \} : \{ 作废晋阶镜像: true \}/,
    '撤回按快照恢复并消费旧记录;晋阶镜像两条路径都必须作废(撤回不重演,与重掷不同)',
  );
});

test('回档后补写保留场景时必须在变量回调内部复核时间线，旧回档不得写进新分支', () => {
  const 回档起 = 回合源码.indexOf('export async function 回档至');
  const 开局起 = 回合源码.indexOf('export async function 开始新游戏', 回档起);
  const 回档段 = 回合源码.slice(回档起, 开局起);
  const 补写起 = 回档段.indexOf('if (回档前场景)');
  const 补写止 = 回档段.indexOf('console.info', 补写起);
  assert.ok(补写起 >= 0 && 补写止 > 补写起, '必须能定位回档后的场景补写段');
  const 补写段 = 回档段.slice(补写起, 补写止);
  assert.match(
    补写段,
    /vars => \{\s*确认回档仍有效\(\);\s*_\.set\(vars, '_场景', 回档前场景\)/,
    '异步等待期间若切聊或 swipe，回调必须在写入新分支之前失败关闭',
  );
});

test('协调已删时间线的恢复分支要能消费上次回合记录,通用分支仍整体清场', () => {
  assert.match(回合源码, /if \(选项\.清上次回合\) _\.set\(vars, '_上次回合', null\);/);
  assert.match(
    回合源码,
    /\} else \{\s*for \(const 键 of 时间线清场变量键\) _\.set\(vars, 键, null\);/,
    '史册任意楼回档与原生删楼的保守清场语义不得被撤回修复改掉',
  );
});
