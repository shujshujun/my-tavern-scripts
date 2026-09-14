/* eslint-disable import-x/no-nodejs-modules -- 真实解析、落库、进度提交与恢复；只替换提供方及宿主I/O。 */
import assert from 'node:assert/strict';
import { createHost, clone, productionFunction } from './微信事务恢复环境.mjs';
import { consumerKit } from './微信余波消费环境.mjs';
import { 安装观察模型 } from './自然观察模型夹具.mjs';

export function fixture(lines, task = '回应回国', playerName = '林舟', observer) {
  const e = createHost();
  if (observer) {
    安装观察模型(e.globals, observer);
    e.adapt('手机/配置.ts', { 读配置: () => ({ ai来源: '正文' }) });
    e.adapt('数据库桥.ts', { 数据库状态: () => ({ 可调用AI: false }) });
  }
  e.st.name1 = playerName;
  const data = e.st.chat.at(-1).stat_data;
  data.户['302'] = clone(data.户['101']);
  Object.assign(data.系统._回国, {
    阶段: '姐妹茶话会进行中', 茶话会状态: '交代正事', 茶话会成员快照: ['101', '102'],
    群名反应已完成: true, 母亲已坦白: true, 正事已说明: true,
    已点评成员: ['101', '102'], 已回应点评成员: ['101', '102'], 已回应回国成员: [],
  });
  if (task === '坦白') Object.assign(data.系统._回国, {
    茶话会状态: '逐人调侃', 母亲已坦白: false, 正事已说明: false,
    已点评成员: [], 已回应点评成员: [],
  });
  if (task === '点评') Object.assign(data.系统._回国, { 茶话会状态: '逐人调侃', 已点评成员: [], 已回应点评成员: [], 正事已说明: false });
  if (task === '转正事') Object.assign(data.系统._回国, { 茶话会状态: '逐人调侃', 正事已说明: false });
  if (task === '收束') data.系统._回国.已回应回国成员 = ['101', '102'];
  e.lines = lines; e.events = []; e.active = true; e.calls = 0;
  const progressAPI = e.load('手机事件进度.ts');
  const normalize = productionFunction('手机/生成引擎.ts', '净化消息', {
    ...e.load('手机生成完整性.ts'), ...e.load('预设输出兼容.ts'), ...e.load('正文生成完整性.ts'),
  });
  const parse = productionFunction('手机/生成引擎.ts', '解析手机小生成原文', {
    ...e.load('手机生成完整性.ts'), ...progressAPI, 净化消息: normalize,
  });
  const kit = consumerKit(e, async (system, prompt, control) => {
    e.calls++; e.prompt = prompt;
    if (e.onGenerate) await e.onGenerate();
    const current = e.data.系统._回国;
    const actualTask = !current.群名反应已完成 ? '改名反应' : task;
    const target = actualTask === '点评' ? '101' : actualTask === '回应回国' ? '101,102' : '';
    const progress = e.progressOverride ?? { 任务: actualTask, 目标: target, 状态: e.progressState ?? '完成', 玩家意向: e.intent ?? '继续', 依据: e.lines };
    const raw = e.raw ?? e.lines.join('\n');
    const body = raw.includes('<回复>') ? raw : '<回复>' + raw + '</回复>';
    const metadata = e.metadataText ?? (e.omitProgress ? '' : '<事件进度>' + JSON.stringify(progress) + '</事件进度>');
    const result = parse(body.replace('</回复>', metadata + '</回复>'));
    if (e.active && result.文) control?.接收事件进度?.(result.进度);
    return result.文;
  });
  const timeline = e.load('手机时间线租约.ts');
  const proof = e.load('手机/回国提交凭据.ts');
  const floor = () => e.st.chat.length - 1;
  const lease = { 聊天ID: e.id, 楼: floor(), 绝对时段: e.clock(), 数据: clone(data),
    时间线租约: timeline.创建手机时间线租约(e.id, floor(), e.st.chat, e.clock()) };
  const valid = productionFunction('手机/壳/会话瞬态.ts', '手机发送租约仍有效', {
    ...e.globals, ...timeline, 当前聊天ID: () => e.id, 当前手机绝对时段: e.clock,
  });
  e.produce = () => { const db = e.api.读库(); return kit.回国茶话会一拍(data, db, floor(), '林舟连续说了：知道了。', {}, true, 'aPhone20').then(ok => ({ ok, db })); };
  const validation = e.load('手机/回国茶话会验收.ts');
  e.restore = productionFunction('手机/回国茶话会恢复.ts', '恢复回国茶话会主状态', {
    ...e.globals, ...timeline, ...validation, ...e.load('回国系统.ts'),
    ...e.load('手机/群聊进度补取.ts'),
    当前聊天ID: () => e.id, 读库: e.api.读库,
    排队MVU操作: async fn => { await e.onQueue?.(); return fn(); },
    读取: () => ({ raw: {}, data: clone(e.st.chat.at(-1).stat_data) }),
    脚本写入: async (_, next) => { if (e.failMvu) throw new Error('controlled MVU failure'); Object.assign(data, next); },
    登记MVU提交校验: check => { assert.equal(check(), true); return () => {}; },
    捕获保护快照: () => {},
  });
  let batch = 0;
  const send = productionFunction('手机/交互/邀约与发消息.ts', '手动群接话', {
    ...e.globals, ...proof, ...validation, 玩家名: () => e.st.name1, 恢复回国茶话会主状态: e.restore, Schema: e.load('../../schema.ts').Schema,
    手机发送租约仍有效: valid,
    手机小生成仍有效: productionFunction('手机/生成引擎.ts', '手机小生成仍有效', {}),
    恢复双重继承群聊余波主状态: async () => {}, 读最近有效stat: () => clone(data),
    末楼: floor, 读库: e.api.读库, 创建群聊引用响应约束: () => undefined,
    新回国茶话会批次标识: () => e.fixedBatch ?? ('aPhone20_' + (++batch)),
    姐妹群一拍: (stat, db, level, reason, control, options) => kit.回国茶话会一拍(stat, db, level, reason, control, options.玩家刚发言, options.回国批次标识),
    读取双重继承群聊余波收据: () => null,
    写库增量: (delta, allowed, stats) => e.api.写库增量(delta, () => !e.rejectWrite && allowed(), stats),
    排队刷新群聊进展摘要: () => {}, 请求手机重绘: () => {},
    eventEmit: (...args) => e.events.push(args),
    setTimeout: resolve => { e.onDelay?.(); resolve(); return 0; },
  });
  e.send = () => send('姐妹群', '林舟连续说了：知道了。', lease, { 仍有效: () => e.active });
  e.messages = () => e.api.读库().消息.filter(m => m.会话 === '姐妹群');
  e.commit = () => {
    assert.equal(e.events.length, 1);
    const [event, payload, receipt] = e.events[0];
    assert.equal(event, '人妻公寓:回国茶话会批次完成');
    assert.equal(proof.回国提交凭据有效(receipt, { 聊天ID: e.id, 世代: timeline.读取当前手机时间线租约世代(), 绝对时段: e.clock(), 聊天消息: e.st.chat, 微信消息: e.api.读库().消息 }), true);
    const result = e.load('回国系统.ts').提交回国茶话会批次(data, payload, receipt.消息, e.st.name1);
    return { result, payload, data };
  };
  e.data = data;
  return e;
}
