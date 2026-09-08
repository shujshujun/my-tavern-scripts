// Available database contract with controlled persistence responses.
import { createHost } from './微信事务恢复环境.mjs';

export function memoryHost() {
  const e = createHost();
  // 群收件名单由真实写库函数按当前阶段派生；两名角色实际达到姐妹群准入阶段。
  for (const row of e.st.chat) for (const house of Object.values(row.stat_data.户)) house.妻.当前阶段 = 3;
  const events = new EventTarget();
  e.window.addEventListener = events.addEventListener.bind(events);
  e.window.removeEventListener = events.removeEventListener.bind(events);
  e.window.document = Object.assign(new EventTarget(), { querySelectorAll: () => [], documentElement: null });
  const actual = e.load('数据库桥.ts');
  for (const [file, module] of e.modules) if (module.exports === actual) e.modules.delete(file);
  e.records = new Map(); e.mode = '失败'; e.writes = []; e.installed = true;
  const read = (who, keys) => keys.map(key => e.records.get(`${who}\n${key}`)).find(Boolean) ?? null;
  e.adapt('数据库桥.ts', {
    ...actual,
    数据库状态: () => ({ 已装游戏模板: e.installed, 可写表格: e.installed }),
    探测数据库SQLite模式: async () => true,
    刷新SQLite能力缓存() {},
    读取微信进展摘要: (who, keys) => read(who, keys),
    读取数据库记忆胶囊: () => '',
    读取微信进展胶囊: refs => refs.map(ref => {
      const record = read(ref.人物, ref.有效事件键);
      if (!record) return '';
      const data = actual.规范微信进展数据(JSON.parse(record.摘要));
      return data ? '\n' + [...data.a, ...data.b, ...data.p, ...data.f].map(x => '- ' + x).join('\n') : '';
    }).join(''),
    同步社交轨迹: async (row, valid) => {
      e.writes.push(structuredClone(row));
      if (e.beforeWrite) await e.beforeWrite(row);
      if (!valid()) return '失败';
      if (e.mode === '抛错') throw new Error('controlled optional database write failure');
      if (e.mode === '已确认') e.records.set(`${row.人物}\n${row.事件键}`, { 事件键: row.事件键, 摘要: row.结果 });
      return e.mode;
    },
  });
  e.summary = e.load('手机/摘要系统.ts');
  e.memory = e.load('手机/微信记忆上下文.ts');
  e.setMessages = async messages => {
    e.vars._微信 = undefined;
    await e.api.写库增量({ 新消息: messages, 新圈: [], 节拍改: {} });
  };
  e.compile = room => room === '101'
    ? e.memory.读取私聊记忆上下文('101', e.st.chat.at(-1).stat_data, e.api.读库(), 4, { 包含见证正文: false })
    : e.memory.读取群聊记忆上下文(room, e.api.读库(), 4, ['101', '102']);
  e.flush = async room => {
    e.summary.重置微信摘要SQLite能力();
    if (room === '101') e.summary.排队刷新微信进展摘要('101');
    else e.summary.排队刷新群聊进展摘要(room);
    await e.summary.等待微信摘要任务();
  };
  return e;
}

export function conversation(room = '101') {
  const say = (text, index, mine) => ({ 楼: 4, 时: 20, 会话: room, 发: mine ? '我' : '对方',
    文: !mine && room !== '101' ? '夏乔:' + text : text,
    序: index, 标识: `${room}-${index}`, 接收门牌: ['101', '102'],
  });
  return [say('周五晚上一起见面，说定了。', 0, true), say('好，说定了，别迟到。', 1, false),
    ...Array.from({ length: 40 }, (_, i) => say(`普通天气消息${i}。`, i + 2, i % 2 === 0))];
}
