/* eslint-disable import-x/no-nodejs-modules -- Node-only role guide and chat worldbook regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import lodash from 'lodash';

globalThis._ = lodash;
globalThis.getVariables = () => ({});
globalThis.insertOrAssignVariables = () => undefined;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍换掉系统.ts');
const nbs = require('../../src/人妻公寓/脚本/游戏逻辑/安若妍不必停系统.ts');
const book = require('../../src/人妻公寓/脚本/游戏逻辑/301换掉世界书.ts');
function fresh(stage = '未开始') {
  const d = Schema.parse({ 户: { 301: 创建户节点(0) } });
  Object.assign(d.户['301'].妻, { 当前阶段: 5, 阶段性癖: '镜头高潮' });
  Object.assign(d.户['301'].夫, { _居住模式: '提前通知', 状态: '外出' });
  Object.assign(d.系统._安若妍不必停, { 阶段: '已完成', 江辰已明确看见: true, 江辰已接受互不干涉: true, 提前通知已约定: true });
  d.系统._已完成特殊场景.push('不必停');
  d.系统._安若妍换掉.阶段 = stage;
  return d;
}
function complete() {
  const d = fresh('已完成');
  d.系统._已完成特殊场景.push(route.安若妍换掉商品ID);
  Object.assign(d.系统._安若妍换掉, { 最终照片体态: '普通', 最终照片素材ID: 'ARY-RPL-10-N', 完成楼层: 40 });
  return d;
}

test('换掉攻略逐阶段给出真实操作与地点，读取不推进路线', () => {
  for (const [stage, expected] of [
    ['未开始', /商店.*换掉/], ['已购买', /301.*使用/], ['待购买拍立得', /公寓外部.*拍立得/],
    ['等待试机日', /301.*试机/], ['待预约', /301.*预约江辰/], ['待登记', /管理员室.*登记/],
    ['等待预约夜', /预约夜.*301/], ['待递相机', /递给江辰/], ['待开场', /7点体力.*镜头前/],
    ['前半', /4.*有效楼/], ['待P1', /摆姿势/], ['中段', /1.*有效楼/], ['待P2', /做鬼脸/],
    ['后半', /2.*有效楼/], ['待收尾', /普通.*收尾/], ['待显影', /照片显影/],
    ['待回客厅', /回到301客厅/], ['待询问', /听她询问換照|听她询问换照/], ['待换照', /把客厅结婚照换成刚拍的照片/],
  ]) {
    const d = fresh(stage);
    d.现金 = 5000; d.背包.push(route.安若妍换掉商品ID, route.安若妍拍立得ID);
    Object.assign(d.系统._安若妍换掉, { 购买绝对时段: 0, 预约夜绝对时段: 17, 拍立得状态: '背包' });
    const before = lodash.cloneDeep(d);
    const guide = route.读取安若妍换掉档案提示(d);
    assert.match(guide.下一步, expected, stage);
    assert.deepEqual(d, before, stage);
  }
});
test('固定剧情、改约、免费收尾和冻结照片均使用当前进度提示', () => {
  const d = fresh('固定剧情中');
  d.系统._安若妍换掉.当前场景 = 'P2';
  assert.match(route.读取安若妍换掉档案提示(d).下一步, /一起做鬼脸.*重试|一起做鬼脸/);
  d.系统._安若妍换掉.阶段 = '待开场';
  d.玩家资源.体力.当前值 = 6;
  assert.match(route.读取安若妍换掉档案提示(d).补充, /暂缓.*休息/);
  d.系统._安若妍换掉.阶段 = '待收尾';
  d.系统._性爱场景.状态 = '收尾中';
  assert.match(route.读取安若妍换掉档案提示(d).下一步, /免费.*收尾/);
  const done = complete();
  assert.equal(route.读取安若妍换掉档案提示(done).完成, true);
  assert.match(route.读取安若妍换掉档案提示(done).状态, /结局后自由生活/);
  assert.doesNotMatch(route.读取安若妍换掉档案提示(done).下一步, /购买|预约江辰/);
  done.系统._安若妍换掉 = Schema.parse({}).系统._安若妍换掉;
  assert.equal(route.读取安若妍换掉档案提示(done).完成, true);
  assert.match(route.读取安若妍换掉档案提示(done).补充, /未记录/);
});
test('后半攻略显示P2后独立进度，承接攻略不重复要求购买已持有的结局票', () => {
  const d = fresh('后半');
  Object.assign(d.系统._安若妍换掉, { 绑定亲密场次标识: 's', P2完成: true, 最终照片素材ID: 'ARY-RPL-10-N',
    拍摄历史: [{ 场次: 's', 照片: 'ARY-RPL-10-N', 楼层: 20 }], 已登记亲密楼层: [11,12,13,14,15,18,21] });
  assert.match(route.读取安若妍换掉档案提示(d).进度, /1\s*\/\s*2/);
  d.系统._安若妍换掉.阶段 = '已购买';
  assert.doesNotMatch(nbs.读取安若妍不必停档案提示(d).下一步, /去商店购买/);
  const archive = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url), 'utf8');
  assert.match(archive, /读取安若妍换掉档案提示\(props.data\)/);
  assert.match(archive, /aria-label="换掉下一步"/);
  assert.equal(route.读取安若妍换掉档案提示(Schema.parse({})), null);
});

test('完成硬操作在保存后刷新阶段，保存前冻结聊天归属', () => {
  const src = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
  const from = src.indexOf("eventOn('人妻公寓:安若妍换掉动作'");
  const to = src.indexOf("eventOn('人妻公寓:许曼君分居动作'", from);
  const block = src.slice(from, to);
  assert.ok((block.match(/await 落地\(/g) ?? []).length >= 2);
  assert.match(block, /const chat = 当前聊天ID\(\)[\s\S]*const saved = await 落地[\s\S]*saved && 结果.成功/);
  const writer = src.slice(src.indexOf('async function 落地('), src.indexOf('const 家庭计划CG标题'));
  assert.match(writer, /const 落地聊天 = 当前聊天ID\(\)[\s\S]*await 脚本写入[\s\S]*同步全部角色阶段世界书\(data, 落地仍有效\)/);
});

test('游戏阶段由当前事实派生，正式完成后替换为自由生活且回档可逆', () => {
  const d = fresh();
  assert.equal(route.读取安若妍游戏阶段(d), '承接完成');
  d.系统._安若妍换掉.阶段 = '待P1';
  assert.equal(route.读取安若妍游戏阶段(d), '结局进行中');
  const finished = complete();
  assert.equal(route.读取安若妍游戏阶段(finished), '结局后自由生活');
  const text = book.构造301换掉阶段世界书内容(finished);
  assert.match(text, /当前游戏阶段[：:]结局后自由生活/);
  assert.doesNotMatch(text, /尚未完成|当前步骤：待|去商店购买/);
  assert.match(book.构造301换掉阶段世界书内容(d), /当前游戏阶段[：:]结局进行中/);
});

function host() {
  let chat = 'a', binding = 'book-a';
  const books = new Map([['book-a', []], ['book-b', []]]);
  book.作废301换掉阶段世界书同步缓存();
  globalThis.SillyTavern = { getCurrentChatId: () => chat };
  globalThis.getChatWorldbookName = () => binding;
  globalThis.updateWorldbookWith = async (name, update) => { books.set(name, update(lodash.cloneDeep(books.get(name)))); };
  return { books, setBinding: value => { binding = value; }, setChat: value => { chat = value; } };
}
test('相同聊天更换绑定世界书后重新同步，不被上一世界书的缓存跳过', async () => {
  const env = host(), d = complete();
  assert.equal(await book.同步301换掉阶段世界书(d), true);
  env.setBinding('book-b');
  assert.equal(await book.同步301换掉阶段世界书(d), true);
  assert.equal(env.books.get('book-b').filter(e => e.name === book.换掉阶段世界书条目名).length, 1);
});
test('原条目原位替换完整阶段内容，旧重复条目停用，其他住户不变', async () => {
  const env = host();
  await book.同步301换掉阶段世界书(fresh());
  const first = env.books.get('book-a')[0], other = { uid: 99, name: '其他住户', content: '保留', enabled: true };
  env.books.get('book-a').push({ ...first, uid: 88 }, other);
  assert.equal(await book.同步301换掉阶段世界书(complete()), true);
  const entries = env.books.get('book-a');
  const active = entries.filter(e => e.name === book.换掉阶段世界书条目名 && e.enabled);
  assert.equal(active.length, 1); assert.equal(active[0].uid, first.uid);
  assert.match(active[0].content, /当前游戏阶段：结局后自由生活/);
  assert.deepEqual(entries.find(e => e.uid === 99), other);
  await book.同步301换掉阶段世界书(fresh(), () => true, true);
  assert.match(env.books.get('book-a')[0].content, /当前游戏阶段：承接完成/);
  assert.doesNotMatch(env.books.get('book-a')[0].content, /当前游戏阶段：结局后自由生活/);
});
test('未入住的新局停用当前聊天的301阶段条目，旧请求不跨新绑定写回', async () => {
  const env = host();
  await book.同步301换掉阶段世界书(complete());
  await book.同步301换掉阶段世界书(Schema.parse({}), () => true, true);
  assert.equal(env.books.get('book-a')[0].enabled, false);
  let release;
  globalThis.updateWorldbookWith = async (name, update) => {
    await new Promise(resolve => { release = resolve; });
    env.books.set(name, update(lodash.cloneDeep(env.books.get(name))));
  };
  const pending = book.同步301换掉阶段世界书(complete(), () => true, true);
  await new Promise(resolve => setImmediate(resolve));
  const before = lodash.cloneDeep(env.books.get('book-a'));
  env.setBinding('book-b'); release();
  assert.equal(await pending, false);
  assert.deepEqual(env.books.get('book-a'), before);
});
