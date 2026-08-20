/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const index源 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');

function 截源(起点, 终点) {
  const start = index源.indexOf(起点);
  const end = index源.indexOf(终点, start);
  assert.ok(start >= 0 && end > start, `未找到源码区间：${起点} → ${终点}`);
  return index源.slice(start, end);
}

test('原生逃生舱成功正文与固定回合共用完整确定性结算链', () => {
  const 原生结算 = 截源('// 5. 结算(逃生舱路径:与回合引擎同一套账', '// 6. 写回');
  const 必须调用 = [
    '节点.夫.状态 = 丈夫在楼',
    '结算焦点疑心(',
    '夜访结算(',
    '荣耀洞结算(',
    '经济结算(',
    '入住检测(',
    '换装起疑(',
    '打断检测(',
    '父亲来电打断(',
    '母亲撞见检测(',
    '绿帽线检测(',
  ];

  for (const 调用 of 必须调用) assert.ok(原生结算.includes(调用), `原生结算缺少：${调用}`);

  const 顺序 = ['荣耀洞结算(', '经济结算(', '入住检测(', '换装起疑(', '打断检测(', '父亲来电打断(', '母亲撞见检测(', '绿帽线检测('];
  for (let i = 1; i < 顺序.length; i += 1) {
    assert.ok(原生结算.indexOf(顺序[i - 1]) < 原生结算.indexOf(顺序[i]), `${顺序[i - 1]} 必须先于 ${顺序[i]}`);
  }
});
