/* eslint-disable import-x/no-nodejs-modules -- Node-only production wiring contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const 后效 = read('src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
const 快照 = read('src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const 节拍 = read('src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts');
const 私聊 = read('src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts');
const 结局期 = read('src/人妻公寓/脚本/游戏逻辑/手机/结局期语义.ts');

test('102、202、201与未来301结局后生活语义进入普通正文快照，而不是只存在于设计文档', () => {
  assert.match(快照, /角色结局后生活提示/);
  assert.match(快照, /\['102', '201', '202', '301'\]\.includes\(门牌号\)/);
  assert.match(快照, /if \(后效提示\) 行\.push\(后效提示\)/);
  assert.match(后效, /门牌号 === '102' && 阶段 === '录像带结局'/);
  assert.match(后效, /门牌号 === '202' && 阶段 === '录像带结局'/);
  assert.match(
    后效,
    /门牌号 === '201' && \(阶段 === '分居完成' \|\| 阶段 === '法律离婚待终幕' \|\| 阶段 === '正式离婚'\)/,
  );
  assert.match(后效, /门牌号 === '301' && 阶段 === '名义夫妻'/);
});

test('角色主动私聊、玩家发起私聊与姐妹群都消费结局后差分语义', () => {
  assert.match(节拍, /角色结局后主动私聊主题\(data, m\)/);
  assert.match(节拍, /本次只采用这个结局后生活方向/);
  assert.match(节拍, /构建角色结局后生活社交语义\(data, m\)/);
  assert.match(节拍, /长期话题: 后效\.姐妹群长期话题/);
  assert.match(结局期, /角色结局期私聊补充/);
  assert.match(私聊, /角色结局期私聊补充\(data, 门牌号\)/);
  assert.match(私聊, /验收母亲共居手机内容\(回复\.正文, '私密'\)/);
  assert.match(私聊, /for \(const \[序, 解析回复\] of 可提交回复们\.entries\(\)\)/);
});

test('母亲公开事件使用共同的阶段评论流程，私密事件继续没有公开评论', () => {
  assert.doesNotMatch(节拍, /function 母亲共居公开评论|角色对母亲共居动态评论池/);
  assert.match(节拍, /const 评 = await 结局日常动态评论\(data, '302', 文, 钟, 仍有效/);
  assert.match(节拍, /评: 私密 \? \[\] : await 结局日常动态评论/);
  assert.match(节拍, /const 已生成交接 = await 生成302公开交接朋友圈[\s\S]{0,130}if \(!时间线仍有效\(\)\) return/);
  assert.doesNotMatch(后效, /const 评论池|export function 角色对母亲共居动态评论池/);
});

test('母亲后效范围明确排除新增个人外出、共同出游与购物玩法', () => {
  assert.match(节拍, /不扩写她个人外出、共同出游或陪她购物/);
  assert.doesNotMatch(后效, /主动私聊主题:[\s\S]{0,500}(?:陪母亲购物|陪她挑选物品|共同出游)/);
});
