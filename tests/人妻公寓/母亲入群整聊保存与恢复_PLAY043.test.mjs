/* eslint-disable import-x/no-nodejs-modules -- Whole-chat storage model with production notification/MVU/message owners. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { host, clone } from './helpers/离婚主入口环境.mjs';

function inviteHost(options = {}) {
  const e = host();
  const schema = e.load('src/人妻公寓/schema.ts');
  const data = schema.Schema.parse({ 户: { 101: schema.创建户节点(0), 102: schema.创建户节点(0), 302: schema.创建户节点(0) },
    系统: { _绝对时段: 20, _序章完成: true, _数据版本: schema.当前MVU数据版本 } });
  data.户['101'].妻.当前阶段 = 3; data.户['102'].妻.当前阶段 = 3;
  Object.assign(data.系统._回国, { 阶段: '待姐妹茶话会', 茶话会状态: '入群演绎' });
  e.st.chat[32].variables = [{ stat_data: data }]; e.vars = {}; e.id = 'play043-whole-chat';
  e.api = e.load('src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
  e.route = e.load('src/人妻公寓/脚本/游戏逻辑/回国系统.ts');
  e.notifications = e.load('src/人妻公寓/脚本/游戏逻辑/手机/通知桥.ts');
  e.server = clone({ chat: e.st.chat, vars: e.vars }); e.commonSaves = [];
  const saveWhole = channel => {
    const blocked = options.allFail || (channel === 'MVU' && options.mvuPersistenceFail);
    e.commonSaves.push({ channel, saved: !blocked });
    if (!blocked) e.server = clone({ chat: e.st.chat, vars: e.vars });
  };
  e.st.saveMetadata = e.st.saveChat = async () => {
    if (options.hardThrow || options.allFail) throw new Error('controlled hard-save failure');
    if (options.hardFalse) { e.commonSaves.push({ channel: 'hard', saved: false }); return false; }
    saveWhole('hard');
  };
  const replace = e.ctx.Mvu.replaceMvuData;
  e.ctx.Mvu.replaceMvuData = async (...args) => {
    await replace(...args);
    if (options.confirmFail && e.read().系统._回国.阶段 === '姐妹茶话会进行中') throw new Error('controlled confirm failure');
    saveWhole('MVU');
  };
  e.joinMessages = () => e.api.读库().消息.filter(m => m.键 === e.route.回国母亲入群消息键);
  e.reload = async () => {
    e.st.chat = clone(e.server.chat); e.vars = clone(e.server.vars);
    await e.api.恢复微信刷新恢复副本(e.id);
  };
  return e;
}

for (const options of [{}, { hardFalse: true }, { hardThrow: true }]) test(`PLAY043整聊模型 ${JSON.stringify(options)}：确认主状态保存时包含同一微信消息`, async () => {
  const e = inviteHost(options);
  assert.equal(await e.notifications.写回国母亲入群消息(), true, e.warnings.join('\n'));
  assert.equal(e.joinMessages().length, 1);
  assert.equal(e.read().系统._回国.阶段, '姐妹茶话会进行中');
  assert.equal(e.route.读取回国母亲邀请事务(e.read()), null);
  assert.equal(e.server.chat.at(-1).variables[0].stat_data.系统._回国.阶段, '姐妹茶话会进行中');
  assert.equal(e.server.vars._微信.消息.filter(m => m.键 === e.route.回国母亲入群消息键).length, 1);
  await e.reload();
  assert.equal(e.joinMessages().length, 1);
  assert.equal(await e.notifications.恢复回国母亲邀请事务(), false, '已确认的整聊重载不再创建邀请事务');
  assert.equal(e.joinMessages().length, 1);
});

test('PLAY043主确认持久化失败：已保存意图和气泡共同重载后可补确认，不重复入群', async () => {
  const options = { confirmFail: true }; const e = inviteHost(options);
  assert.equal(await e.notifications.写回国母亲入群消息(), false);
  assert.ok(e.route.读取回国母亲邀请事务(e.server.chat.at(-1).variables[0].stat_data));
  assert.equal(e.server.vars._微信.消息.length, 1);
  await e.reload(); options.confirmFail = false;
  assert.equal(await e.notifications.恢复回国母亲邀请事务(), true, e.warnings.join('\n'));
  assert.equal(e.joinMessages().length, 1);
  assert.equal(e.route.读取回国母亲邀请事务(e.read()), null);
});

test('PLAY043全部宿主持久通道失败：整聊共同回退，浏览器镜像保留消息供再邀请对齐', async () => {
  const options = { allFail: true }; const e = inviteHost(options);
  assert.equal(await e.notifications.写回国母亲入群消息(), true);
  assert.equal(e.server.chat.at(-1).variables[0].stat_data.系统._回国.阶段, '待姐妹茶话会');
  assert.equal(e.server.vars._微信, undefined);
  await e.reload();
  assert.equal(e.joinMessages().length, 1, '真实手机恢复镜像恢复已接受消息');
  options.allFail = false;
  assert.equal(await e.notifications.写回国母亲入群消息(), true, e.warnings.join('\n'));
  assert.equal(e.joinMessages().length, 1);
  assert.equal(e.read().系统._回国.阶段, '姐妹茶话会进行中');
});

test('PLAY043先返回false再恢复保存：真实静默期补存把最终主状态与消息共同写入', async () => {
  const options = { hardFalse: true, mvuPersistenceFail: true }; const e = inviteHost(options);
  assert.equal(await e.notifications.写回国母亲入群消息(), true);
  assert.equal(e.server.vars._微信, undefined);
  options.hardFalse = false;
  await new Promise(resolve => setTimeout(resolve, 4700));
  assert.equal(e.server.vars._微信.消息.filter(m => m.键 === e.route.回国母亲入群消息键).length, 1);
  assert.equal(e.server.chat.at(-1).variables[0].stat_data.系统._回国.阶段, '姐妹茶话会进行中');
  await e.reload();
  assert.equal(e.joinMessages().length, 1);
  assert.equal(e.route.读取回国母亲邀请事务(e.read()), null);
});
