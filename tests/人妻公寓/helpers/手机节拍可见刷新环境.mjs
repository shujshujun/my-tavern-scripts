/* eslint-disable import-x/no-nodejs-modules -- 完整生产节拍与真实数据层；外部I/O和候选内容受控。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { createHost, clone } from './微信事务恢复环境.mjs';

const product = fileURLToPath(new URL('../../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url));
const tickFile = product + '手机/节拍引擎.ts';
const source = readFileSync(tickFile, 'utf8');
const ast = ts.createSourceFile(tickFile, source, ts.ScriptTarget.Latest, true);
const names = ['频率倍率', '节拍进行中', '节拍待补', '手机节拍', '手机节拍进行中'];
const selected = ast.statements.filter(node =>
  (ts.isFunctionDeclaration(node) && names.includes(node.name?.text)) ||
  (ts.isVariableStatement(node) && node.declarationList.declarations.some(x => names.includes(x.name.getText(ast)))));
assert.equal(selected.length, names.length, '主函数及其全部原始调度状态必须完整提取');
const code = ts.transpileModule(selected.map(n => n.getText(ast)).join('\n'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const uiCode = ts.transpileModule(readFileSync(product + '手机/UI刷新.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

/** 候选入口只控制本拍产物，绝不模拟写库/去重/时间线/统计/刷新；真实生产者可另行接入。 */
export function createTickHost(options = {}) {
  const e = createHost(options);
  // 浏览器事件注册是宿主边界；记录监听器但不主动触发卸载等真实宿主事件。
  e.windowEvents = new Map();
  e.globals.window.addEventListener = (name, listener) => {
    if (!e.windowEvents.has(name)) e.windowEvents.set(name, new Set());
    e.windowEvents.get(name).add(listener);
  };
  e.globals.window.removeEventListener = (name, listener) => e.windowEvents.get(name)?.delete(listener);
  let mvuQueue = Promise.resolve();
  const mvu = {
    ...e.load('mvuIO.ts'),
    排队MVU操作: fn => {
      const result = mvuQueue.then(fn);
      mvuQueue = result.catch(() => undefined);
      return result;
    },
    读取: () => {
      const data = clone(e.st.chat.at(-1).stat_data);
      return { raw: { stat_data: data }, data };
    },
    脚本写入: async () => { throw new Error('UNEXPECTED_CROSS_TOPIC_MVU_WRITE'); },
  };
  // 缓存是原加载器公布的宿主替换入口；不替换业务恢复函数，非活动门仍由真实数据决定。
  e.modules.set(product + 'mvuIO.ts', { exports: mvu });
  e.refresh = { redraw: 0, badge: 0 };
  e.producerCalls = 0;
  e.candidates = { 新消息: [], 新圈: [] };
  e.queuedMemory = [];
  e.queuedSummaries = [];
  const ui = { exports: {} };
  Function('module', 'exports', uiCode)(ui, ui.exports);
  e.ui = ui.exports;
  e.ui.注册手机UI刷新实现(
    () => { e.refresh.redraw++; if (e.failRedraw) throw new Error('controlled renderer failure'); },
    () => { e.refresh.badge++; },
  );
  const inert = async () => undefined;
  const noContent = async () => '无新';
  const deps = {
    ...e.globals,
    ...e.load('../../schema.ts'),
    ...e.load('../../不再留门契约.ts'),
    ...e.load('场景剧情事务.ts'),
    ...e.load('手机时间线租约.ts'),
    ...e.load('楼层时钟.ts'),
    ...e.load('mvuIO.ts'),
    ...e.load('手机/运行时上下文.ts'),
    ...e.load('手机/父亲通话优先级.ts'),
    ...e.api, ...e.ui,
    ...e.load('手机/姐妹群跨容器事务.ts'),
    ...e.load('手机/母亲共居跨容器事务.ts'),
    门牌列表: e.load('../../stageConfig.ts').门牌列表,
    // 新局中不活动的专题通知与外部摘要排队不是本项被测入口；不代替接受/写入判定。
    同步管理任务微信: inert, 同步回国父亲微信: inert, 同步回国茶话会后私聊: inert,
    同步录像带V4微信: inert, 同步孕产与家庭计划AI微信: inert,
    孕产姐妹群必达拍: context => e.mandatoryProducer?.(context) ?? noContent(),
    生成302公开交接朋友圈: (...args) => e.handoverProducer?.(...args) ?? false,
    同步回国延迟改名与群名反应: inert, 冷落预警节拍: inert,
    读配置: () => ({ 频率: e.frequency ?? '普通' }), 扫描冷落私聊: () => ({ 冷落中门牌: new Set() }),
    排队同步朋友圈长期记忆: items => e.queuedMemory.push(items.length),
    排队刷新微信进展摘要: member => e.queuedSummaries.push(member),
    排队刷新群聊进展摘要: group => e.queuedSummaries.push(group),
    荣耀洞专属动态: noContent, 母亲共居事件朋友圈: noContent, 朋友圈近期流: noContent,
    主动私聊: async context => {
      e.producerCalls++;
      if (e.sourceProducer) return e.sourceProducer(context);
      if (e.producerGate) await e.producerGate;
      for (const message of e.candidates.新消息) context.库.消息.push({ 楼: context.楼, 时: context.钟, ...message });
      for (const moment of e.candidates.新圈) context.库.圈.unshift({ 楼: context.楼, 时: context.钟, ...moment });
      context.库.节拍['可见刷新诊断'] = (context.库.节拍['可见刷新诊断'] ?? 0) + 1;
      return e.candidates.新消息.length || e.candidates.新圈.length ? '有新' : '无新';
    },
    楼务群自动消息: noContent, 仅你可见动态: noContent, 姐妹群主动拍: noContent,
  };
  const module = { exports: {} };
  Function('deps', 'exports', `const {${Object.keys(deps).join(',')}} = deps;\n${code}`)(deps, module.exports);
  e.tick = module.exports.手机节拍;
  e.busy = module.exports.手机节拍进行中;
  assert.equal(typeof e.tick, 'function');
  e.visible = () => e.api.读库().消息;
  return e;
}

export const ordinary = (more = {}) => ({ 会话: '101', 发: '对方', 文: '收到，我晚点联系你。', ...more });
export const receipt = (key = 'diagnostic') => ({
  会话: '__RQP_SYSTEM_TX__', 发: '系统', 类: '文本', 文: 'isolated receipt', 键: `双重继承:姐妹群余波:收据:${key}`,
});
export const moment = (more = {}) => ({ 谁: '夏乔', 文: '楼道的灯修好了。', 评: [], ...more });
