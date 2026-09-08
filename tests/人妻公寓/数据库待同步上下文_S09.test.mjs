/* eslint-disable import-x/no-nodejs-modules -- Production memory/summaries and source receipts, controlled database I/O */
import assert from 'node:assert/strict';
import test from 'node:test';
import { memoryHost, conversation } from './helpers/微信数据库故障上下文环境.mjs';

for (const room of ['101', '姐妹群']) for (const mode of ['失败', '待确认', '抛错']) {
  test(`S09 已安装数据库${mode}时${room}当前分支尚未同步的约定仍能有限承接`, async () => {
    const e = memoryHost(); e.mode = mode;
    await e.setMessages(conversation(room));
    await e.flush(room);
    assert.ok(e.writes.length, '必须实际进入生产摘要写入调用');
    assert.equal(e.records.size, 0);
    const before = structuredClone(e.api.读库());
    const context = e.compile(room);
    assert.equal(context.最近聊天.includes('周五'), false, '原约定应已超出32条近期窗口');
    const memory = room === '101' ? context.可知记忆 : context.群内记忆;
    assert.ok(memory.includes('周五'), '故障期间必要原文仍在库，但未进入可用上下文');
    assert.ok(memory.length <= (room === '101' ? 4000 : 5400));
    assert.deepEqual(e.api.读库(), before);
    assert.equal(e.records.size, 0, '只读过渡不能冒充数据库写入成功');
  });
}

test('S09 数据库恢复后由原稳定事件键补写，重复刷新不重复写入', async () => {
  const e = memoryHost(); await e.setMessages(conversation());
  await e.flush('101');
  e.mode = '已确认'; await e.flush('101');
  assert.equal(e.records.size, 1);
  const writes = e.writes.length;
  await e.flush('101');
  assert.equal(e.writes.length, writes);
  assert.ok(e.compile('101').可知记忆.includes('周五'));
});

test('S09 撤回原约定及回复后过渡上下文不复活旧事实', async () => {
  const e = memoryHost(); const messages = conversation();
  messages[0].类 = '撤回'; messages[1].类 = '撤回';
  await e.setMessages(messages);
  await e.flush('101');
  assert.equal(e.compile('101').可知记忆.includes('周五'), false);
});

test('S09 群消息只有实际接收者能获得未同步过渡', async () => {
  const e = memoryHost();
  e.st.chat.at(-1).stat_data.户['102'].妻.当前阶段 = 0;
  const messages = conversation('姐妹群').map(m => ({ ...m, 接收门牌: ['101'] }));
  await e.setMessages(messages); await e.flush('姐妹群');
  const one = e.summary.读取角色群聊见闻胶囊(['101'], 4, 1400, '姐妹群');
  const other = e.summary.读取角色群聊见闻胶囊(['102'], 4, 1400, '姐妹群');
  assert.ok(one.includes('周五'));
  assert.equal(other.includes('周五'), false);
});

test('S09 生成中新聊天替换原始库后旧请求和旧摘要不进入新会话', async () => {
  const e = memoryHost(); await e.setMessages(conversation());
  e.beforeWrite = async () => { e.id = 'new-chat'; e.vars._微信 = undefined; };
  await e.flush('101');
  assert.equal(e.records.size, 0);
  assert.equal(e.compile('101').可知记忆.includes('周五'), false);
});

test('S09 已确认版本不再走私聊过渡，读取不追加数据库任务', async () => {
  const e = memoryHost(); await e.setMessages(conversation());
  e.mode = '已确认'; await e.flush('101');
  const writes = e.writes.length;
  assert.equal(e.summary.读取私聊待同步进展('101', 4), '');
  e.compile('101'); e.compile('101');
  assert.equal(e.writes.length, writes);
});

test('S09 摘要关闭或模板未安装时不启用新的原文过渡', async () => {
  const e = memoryHost(); await e.setMessages(conversation());
  e.installed = false;
  assert.equal(e.summary.读取私聊待同步进展('101', 4), '');
  e.installed = true;
  e.window.localStorage.setItem('人妻公寓_手机配置', JSON.stringify({ 微信进展摘要: false }));
  assert.equal(e.summary.读取私聊待同步进展('101', 4), '');
  assert.equal(e.records.size, 0);
});
