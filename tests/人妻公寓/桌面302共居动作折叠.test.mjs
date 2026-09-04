/* eslint-disable import-x/no-nodejs-modules -- Node-only component contract regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('302不再为一块核心瓷砖增加电脑端第二层折叠', () => {
  const component = read('src/人妻公寓/界面/客户端/components/房内操作抽屉.vue');
  assert.doesNotMatch(component, /划分桌面302共居动作|桌面共居展开|room-actions-desktop-cohab-toggle/);
  assert.match(component, /v-for="\(动作, i\) in actions"/);
  assert.match(component, /class="scene-acts"/);
});

test('手机继续只有原房内操作总抽屉，内部选择留在同一面板', () => {
  const component = read('src/人妻公寓/界面/客户端/components/房内操作抽屉.vue');
  assert.equal((component.match(/class="drawer-handle"/g) ?? []).length, 1);
  assert.match(component, /房内操作 · \{\{ actionCount \}\}项/);
  assert.match(component, /id="in-room-acts-panel"/);
  assert.match(component, /当前选择动作\?\.选项\?\.length/);
  assert.match(component, /class="action-choice"/);
  assert.match(component, /class="action-choice-grid"/);
  assert.doesNotMatch(component, /room-actions-desktop-cohab|桌面共居折叠ID|划分桌面302共居动作/);
});

test('一块父瓷砖只在同层展开两个开场选择，选择后调用原业务回调', () => {
  const room = read('src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
  const types = read('src/人妻公寓/界面/客户端/types.ts');
  const cohab = read('src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');

  assert.match(types, /export interface 卡动作选项/);
  assert.match(types, /选项\?: readonly 卡动作选项\[\]/);
  assert.match(room, /选项: 候选\.选项\.map/);
  assert.match(room, /事件\.母亲共居动作\(选项\.id\)/);
  assert.match(cohab, /id: '和她亲密'/);
  assert.match(cohab, /id: '由我开始'/);
  assert.match(cohab, /id: '让她开始'/);
  assert.equal((room.match(/分组:\s*'302共居'\s+as const/g) ?? []).length, 1);
});

test('父瓷砖与子选项都沿用禁用、提示和发送中保护，不复制亲密状态机', () => {
  const room = read('src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
  const component = read('src/人妻公寓/界面/客户端/components/房内操作抽屉.vue');
  assert.match(room, /禁用: !候选\.可执行/);
  assert.match(room, /发送中\.value \|\| 当前房间\.value !== 地点/);
  assert.match(component, /if \(动作\.禁用\) return/);
  assert.match(component, /void 选项\.做\(\)/);
  assert.doesNotMatch(`${room}\n${component}`, /满意度.*创建|体力.*创建|主导权.*状态|_性爱场景\s*=/);
});
