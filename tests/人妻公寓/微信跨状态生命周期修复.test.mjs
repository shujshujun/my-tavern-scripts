/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
// `schema.json` 与 `schema.ts` 同名；让 Node 测试像 webpack 一样优先解析 TypeScript。
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;
globalThis._ = require('lodash');

// v0.80 微信跨状态生命周期 BUG 专项：同楼同时段未读顺序、部分气泡收尾、邀约可选数据库不阻塞核心。
const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 渲染chat源码 = readFileSync(new URL('./壳/渲染/chat.ts', 手机目录), 'utf8');
const 渲染moments源码 = readFileSync(new URL('./壳/渲染/moments.ts', 手机目录), 'utf8');
const 渲染chats源码 = readFileSync(new URL('./壳/渲染/chats.ts', 手机目录), 'utf8');
const 渲染共享源码 = readFileSync(new URL('./壳/渲染/共享.ts', 手机目录), 'utf8');

const {
  创建手机已读时锚,
  手机记录晚于已读,
  规范手机已读时锚,
  手机分支变更后已读时锚,
  较晚手机已读时锚,
  最后手机时间记录,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机已读水位.ts');
const { 创建手机时间线租约, 手机时间线租约仍有效 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机时间线租约.ts',
);

function 截源(源码, 开始, 结束) {
  const 起 = 源码.indexOf(开始);
  const 止 = 源码.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源码.slice(起, 止);
}

/** 把无 import 的 TS 片段转译为 CommonJS 并注入外部依赖执行（transpile-only，同 P7 测试模式）。 */
function 执行TS片段(片段, 导出名, 依赖 = {}) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(依赖), js)(module, module.exports, ...Object.values(依赖));
  return module.exports;
}

// ============================================
// BUG A：同楼同时段的单调顺序与旧档兼容
// ============================================

test('同楼同时：旧锚后新顺序消息未读；读到精确序号后同序/更早已读、更大序号未读', () => {
  const 旧锚 = 创建手机已读时锚(10, 3);
  // 旧 {楼,时} 锚（无序）：任何同楼同时的有序新记录都晚于它 → 未读。
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3, 序: 1 }, 10, 旧锚), true);
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3, 序: 2 }, 10, 旧锚), true);
  // 旧无序记录对旧无序锚仍保持旧兼容（同楼同时=已读）。
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3 }, 10, 旧锚), false);

  const 精确锚 = 创建手机已读时锚(10, 3, 2);
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3, 序: 2 }, 10, 精确锚), false, '同序=已读');
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3, 序: 1 }, 10, 精确锚), false, '更早=已读');
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3, 序: 3 }, 10, 精确锚), true, '更大序号=未读');
  // 旧无序记录面对有序锚 → 已读（新有序记录插入在其后）。
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3 }, 10, 精确锚), false);
  // 楼/时轴照旧：不同楼/时段仍按原语义。
  assert.equal(手机记录晚于已读({ 楼: 11, 时: 3, 序: 1 }, 10, 精确锚), true);
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 4, 序: 0 }, 10, 精确锚), true);
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 2, 序: 99 }, 10, 精确锚), false);
});

test('旧 {楼,时} 锚/旧无序记录兼容；新有序记录不被旧锚吞掉', () => {
  const 旧锚 = 创建手机已读时锚(10, 3);
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3 }, 10, 旧锚), false, '旧无序记录同楼同时=已读');
  assert.equal(手机记录晚于已读({ 楼: 10, 时: 3, 序: 5 }, 10, 旧锚), true, '新有序记录不被旧锚吞掉');
  // 无 序 键的旧锚保持原形状（不新增 序: undefined）。
  assert.deepEqual(创建手机已读时锚(10, 3), { 楼: 10, 时: 3 });
});

test('带序锚对应记录被回档/swipe 裁掉后从存活记录重建；恢复同值不复活旧水位', () => {
  // 锚记录仍存活 → 原样保留。
  assert.deepEqual(
    规范手机已读时锚(10, { 楼: 10, 时: 3, 序: 5 }, [{ 楼: 10, 时: 3, 序: 5 }], 3),
    { 楼: 10, 时: 3, 序: 5 },
  );
  // 锚记录已被裁掉（存活只剩更早的序）→ 重建到存活最大序，不复活旧水位。
  assert.deepEqual(
    规范手机已读时锚(10, { 楼: 10, 时: 3, 序: 5 }, [{ 楼: 10, 时: 3, 序: 4 }, { 楼: 10, 时: 3, 序: 3 }], 3),
    { 楼: 10, 时: 3, 序: 4 },
  );
  // 锚时超前世界钟 → 重建按存活收口。
  assert.deepEqual(
    规范手机已读时锚(10, { 楼: 10, 时: 5, 序: 9 }, [{ 楼: 10, 时: 2, 序: 1 }], 3),
    { 楼: 10, 时: 2, 序: 1 },
  );
  // 分支变更强制从存活重建，序跟着存活最大。
  assert.deepEqual(
    手机分支变更后已读时锚(10, { 楼: 10, 时: 3, 序: 5 }, [{ 楼: 9, 时: 4, 序: 1 }, { 楼: 9, 时: 4, 序: 2 }], 4, 10, 10),
    { 楼: 9, 时: 4, 序: 2 },
  );
});

test('最后手机时间记录按 (楼,时,序) 取最晚；较晚手机已读时锚 同楼同时按序合并', () => {
  assert.deepEqual(
    最后手机时间记录([
      { 楼: 10, 时: 3, 序: 1 },
      { 楼: 10, 时: 3, 序: 2 },
    ]),
    { 楼: 10, 时: 3, 序: 2 },
  );
  // 旧无序 vs 新有序同楼同时 → 有序较晚。
  assert.deepEqual(
    最后手机时间记录([
      { 楼: 10, 时: 3 },
      { 楼: 10, 时: 3, 序: 2 },
    ]),
    { 楼: 10, 时: 3, 序: 2 },
  );
  assert.equal(最后手机时间记录([]), undefined);

  const a = { 楼: 10, 时: 3, 序: 1 };
  const b = { 楼: 10, 时: 3, 序: 2 };
  assert.deepEqual(较晚手机已读时锚(a, b), b);
  assert.deepEqual(较晚手机已读时锚({ 楼: 10, 时: 3 }, b), b, '有序锚较晚');
  assert.deepEqual(较晚手机已读时锚(a, { 楼: 10, 时: 3 }), a, '有序锚较晚');
  assert.deepEqual(较晚手机已读时锚({ 楼: 10, 时: 3 }, { 楼: 10, 时: 3 }), { 楼: 10, 时: 3 });
});

test('非法顺序不参与比较/锚定/重建；合法非负安全整数照常', () => {
  const 有序锚 = 创建手机已读时锚(10, 3, 2);
  // 非法序（小数/负数/NaN/Infinity/超安全整数）一律按无序遍历：同楼同时面对有序锚视为已读，不抬水位。
  for (const 坏序 of [2.5, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(
      手机记录晚于已读({ 楼: 10, 时: 3, 序: 坏序 }, 10, 有序锚),
      false,
      `非法序 ${坏序} 不参与序比较`,
    );
  }
  // 非法序不入锚：锚保持旧无序形状，不截断、不存负值/小数。
  assert.deepEqual(创建手机已读时锚(10, 3, 2.5), { 楼: 10, 时: 3 }, '小数序不得截断入锚');
  assert.deepEqual(创建手机已读时锚(10, 3, -1), { 楼: 10, 时: 3 }, '负序不得入锚');
  assert.deepEqual(创建手机已读时锚(10, 3, NaN), { 楼: 10, 时: 3 }, 'NaN 序不得入锚');
  // 0 是合法非负安全整数：正常入锚，且对旧无序锚按未读。
  assert.deepEqual(创建手机已读时锚(10, 3, 0), { 楼: 10, 时: 3, 序: 0 }, '0 是合法顺序');
  assert.equal(
    手机记录晚于已读({ 楼: 10, 时: 3, 序: 0 }, 10, 创建手机已读时锚(10, 3)),
    true,
    '0 序新记录面对旧无序锚仍未读',
  );
  // 重建时非法序不得充当存活最大序；带非法序的锚回退为无序锚。
  assert.deepEqual(
    规范手机已读时锚(10, { 楼: 10, 时: 3, 序: 9 }, [{ 楼: 10, 时: 3, 序: 2.5 }, { 楼: 10, 时: 3, 序: 2 }], 3),
    { 楼: 10, 时: 3, 序: 2 },
  );
  assert.deepEqual(
    规范手机已读时锚(10, { 楼: 10, 时: 3, 序: 2.5 }, [{ 楼: 10, 时: 3, 序: 2 }], 3),
    { 楼: 10, 时: 3 },
  );
  // 较晚合并：非法序锚按无序处理，有序锚较晚。
  assert.deepEqual(较晚手机已读时锚({ 楼: 10, 时: 3, 序: 2 }, { 楼: 10, 时: 3, 序: 2.5 }), {
    楼: 10,
    时: 3,
    序: 2,
  });
});

test('写实时手机已读 锚定最后一条实际记录（含序）；前台失效不写；无目标记录不预读', async () => {
  let 读库结果 = {
    消息: [
      { 楼: 8, 时: 3, 会话: '101', 发: '我', 文: '玩家消息' },
      { 楼: 8, 时: 3, 会话: '101', 发: '对方', 文: '第一泡', 序: 1 },
      { 楼: 8, 时: 3, 会话: '101', 发: '对方', 文: '第二泡', 序: 2 },
    ],
    圈: [{ 楼: 9, 时: 4, 谁: '夏乔', 文: '动态A', 序: 1 }],
  };
  let 写库调用 = null;
  const 写库增量桩 = async (增, 允许写入) => {
    写库调用 = { 增, 允许写入 };
    return 允许写入();
  };
  const 原SillyTavern = globalThis.SillyTavern;
  globalThis.SillyTavern = { chat: Array.from({ length: 10 }, (_, i) => ({ is_user: false, mes: `锚${i}`, swipe_id: 0 })) };
  try {
    const { 写实时手机已读 } = 执行TS片段(
      截源(数据层源码, 'export async function 写实时手机已读', 'function 赴约仍活动'),
      ['写实时手机已读'],
      {
        当前聊天ID: () => 'chat-a',
        末楼: () => 8,
        当前手机绝对时段: () => 3,
        创建手机时间线租约,
        手机时间线租约仍有效,
        创建手机已读时锚,
        最后手机时间记录,
        读库: () => 读库结果,
        写库增量: 写库增量桩,
        立即持久保存手机聊天变量: async () => true,
      },
    );

    // 会话：锚到最后一条对方消息的 (楼,时,序)，而不是“当前楼/当前时段”。
    assert.equal(await 写实时手机已读({ 会话: '101' }), true);
    assert.deepEqual(写库调用.增.读到改, { '101': { 楼: 8, 时: 3, 序: 2 } });
    assert.equal(写库调用.增.圈读到改, undefined);

    // 朋友圈：锚到最新一条（含序）。
    写库调用 = null;
    读库结果 = { ...读库结果, 圈: [{ 楼: 9, 时: 4, 谁: '夏乔', 文: '动态B', 序: 2 }, ...读库结果.圈] };
    assert.equal(await 写实时手机已读({ 朋友圈: true }), true);
    assert.deepEqual(写库调用.增.圈读到改, { 楼: 9, 时: 4, 序: 2 });
    assert.equal(写库调用.增.读到改, undefined);

    // 前台失效（关闭/切页/切联系人）：复核返回 false → 不写。
    写库调用 = null;
    assert.equal(await 写实时手机已读({ 会话: '101' }, () => false), false);
    assert.equal(写库调用.增.读到改['101'].序, 2, '写库调用仍在回调内复核前台校验');

    // 无目标记录：不预读未来消息，直接返回 false 且不调 写库增量。
    写库调用 = null;
    读库结果 = { 消息: [{ 楼: 8, 时: 3, 会话: '102', 发: '我', 文: '只有玩家消息' }], 圈: [] };
    assert.equal(await 写实时手机已读({ 会话: '102' }), false);
    assert.equal(写库调用, null, '无目标记录不得写水位');
  } finally {
    globalThis.SillyTavern = 原SillyTavern;
  }
});

// ============================================
// BUG A：已读所有权回渲染层 + 业务层不再无条件写已读
// ============================================

test('chat/moments 渲染层确认已读：前台仍有效 + 确有未读才异步确认并只刷新红点', () => {
  assert.match(渲染chat源码, /会话有未读\(库, 会话, 楼, 当前绝对时段\)/, 'chat 页确有未读才确认');
  assert.match(渲染chat源码, /写实时手机已读\(\{ 会话 \}, 前台仍有效\)/, 'chat 页带前台校验异步确认');
  assert.match(渲染chat源码, /root\.classList\.contains\('open'\)/, '手机仍开');
  assert.match(渲染chat源码, /上下文\.读取当前页\(\)\.名 === 'chat'/, '当前页仍是本会话');
  assert.match(渲染chat源码, /上下文\.读取当前页\(\)\.会话 === 会话/, '仍是本会话');
  assert.match(渲染chat源码, /if \(已写\) 请求刷新手机红点\(\)/, '已读成功只刷新红点不重绘');
  // v0.80 失败收口：末尾 catch 同时覆盖已读写入和成功回调异常；失败只告警，不得把失败当成功刷新红点。
  assert.match(
    渲染chat源码,
    /写实时手机已读\(\{ 会话 \}, 前台仍有效\)[\s\S]*?\.then\(已写 => \{[\s\S]*?if \(已写\) 请求刷新手机红点\(\);[\s\S]*?\}\)[\s\S]*?\.catch\(错误 => \{[\s\S]*?console\.warn\(/,
    'chat 已读链带拒绝收口，成功仅刷新红点',
  );

  assert.match(渲染moments源码, /朋友圈有未读\(库, 楼, 当前绝对时段\)/, '朋友圈确有未读才确认');
  assert.match(渲染moments源码, /写实时手机已读\(\{ 朋友圈: true \}, 前台仍有效\)/, '朋友圈带前台校验异步确认');
  assert.match(渲染moments源码, /root\.classList\.contains\('open'\)/, '手机仍开');
  assert.match(渲染moments源码, /上下文\.读取当前页\(\)\.名 === 'moments'/, '当前页仍是朋友圈');
  assert.match(渲染moments源码, /if \(已写\) 请求刷新手机红点\(\)/, '已读成功只刷新红点不重绘');
  assert.match(
    渲染moments源码,
    /写实时手机已读\(\{ 朋友圈: true \}, 前台仍有效\)[\s\S]*?\.then\(已写 => \{[\s\S]*?if \(已写\) 请求刷新手机红点\(\);[\s\S]*?\}\)[\s\S]*?\.catch\(错误 => \{[\s\S]*?console\.warn\(/,
    '朋友圈已读链带拒绝收口，成功仅刷新红点',
  );
});

test('chats/共享 不再点击即已读；已读所有权只在 chat/moments 渲染层', () => {
  assert.doesNotMatch(渲染chats源码, /写实时手机已读\s*\(/, '会话列表页不得预写已读');
  assert.doesNotMatch(渲染共享源码, /写实时手机已读\s*\(/, '底栏不得预写已读（注释提及不算调用）');
  assert.doesNotMatch(渲染chats源码, /创建手机已读时锚/, '会话列表页不得裸拼已读锚');
  assert.doesNotMatch(渲染共享源码, /创建手机已读时锚/, '底栏不得裸拼已读锚');
});

test('邀约/手动群/私聊回复不再无条件写已读；业务层不猜页面可见性', () => {
  assert.doesNotMatch(交互源码, /读到改/, '交互业务层不得携带无条件已读增量');
  assert.doesNotMatch(交互源码, /创建手机已读时锚/, '交互业务层不得裸拼已读锚');
  // 数据层实时入口仍同时写 会话/朋友圈 两类已读增量。
  const 实时已读段 = 截源(数据层源码, 'export async function 写实时手机已读', 'function 赴约仍活动');
  assert.match(实时已读段, /读到改/, '会话目标经数据层写 读到改');
  assert.match(实时已读段, /圈读到改/, '朋友圈目标经数据层写 圈读到改');
});

// ============================================
// BUG B：部分气泡收尾
// ============================================

test('私聊气泡循环统一收尾：取消/写失败/抛错都走收尾，摘要依据已写数与硬发送时间线', () => {
  const 回复段 = 截源(交互源码, 'async function 执行批次聊天回复', '// 本模块初始化完成时向渲染层注册 P8 业务端口与批次执行器');
  // 中断改为 break，不再从循环里提前越过收尾。
  assert.match(回复段, /if \(!回复语义仍有效\(\)\) break;/, '语义失效（含取消）→ break 统一收尾');
  assert.match(回复段, /if \(!已写\) break;/, '写入失败 → break 统一收尾');
  assert.match(回复段, /气泡落库抛错：已写内容仍保留/, '循环内写抛错被捕获');
  assert.equal((回复段.match(/return 已写回复\.length > 0;/g) ?? []).length, 1, '全函数只允许一个部分成功返回点');
  // 统一收尾：依据 已写回复 与 手机发送租约（硬发送时间线），不依赖生成控制令牌。
  assert.match(回复段, /if \(已写回复\.length && 手机发送租约仍有效\(发送租约\)\) \{/, '收尾依据已写数与硬发送时间线');
  assert.match(回复段, /写会场私聊摘要\(门牌号, 已写回复\.join\('\\n'\), 发送租约\.会场摘要租约\)/, '会场私聊把已写气泡写入会场摘要');
  assert.match(回复段, /排队刷新微信进展摘要\(门牌号\)/, '普通/会场私聊都排队刷新 SQLite 微信进展摘要');
  // 可选摘要失败不得把已落库回复改判失败。
  assert.match(回复段, /会场私聊摘要失败:/, '会场摘要失败被捕获不向外抛');
  assert.match(回复段, /私聊收尾摘要失败:/, '收尾摘要整体失败被捕获');
});

test('手动楼务群/姐妹群保留已写数>0 的部分成功，但不给群聊加个人 SQLite 摘要', () => {
  const 手动段 = 截源(交互源码, 'async function 手动群接话(', '// ── 单聊/群聊发送');
  assert.match(手动段, /群接话气泡落库失败:/, '群接话写抛错被捕获');
  assert.ok((手动段.match(/return 已写数 > 0;/g) ?? []).length >= 2, '取消/失败/抛错路径都保留已写数语义');
  assert.doesNotMatch(手动段, /排队刷新微信进展摘要/, '群聊不得加个人 SQLite 摘要');
  assert.doesNotMatch(手动段, /读到改/, '群聊不再无条件写已读');
});

// ============================================
// BUG C：邀约可选数据库不阻塞核心
// ============================================

test('邀约原子提交后先核心刷新，再 void 同步社交轨迹（可选数据库不阻塞核心）', () => {
  const 邀约段 = 截源(交互源码, 'async function 约出来(', '// ── 楼务群接话');
  const 核心位 = 邀约段.indexOf('请求刷新手机红点()');
  const 数据库位 = 邀约段.indexOf('void 同步社交轨迹(');
  assert.ok(核心位 >= 0 && 数据库位 > 核心位, '核心刷新必须先于可选数据库同步');
  assert.doesNotMatch(邀约段, /await 同步社交轨迹/, '邀约不得 await 同步社交轨迹（6 秒策略不得拖住核心）');
  assert.match(邀约段, /void 同步社交轨迹\(/, '数据库同步必须是 fire-and-forget');
  assert.match(邀约段, /排队刷新微信进展摘要\(m\)/, '微信进展摘要仍照常排队');
  assert.match(邀约段, /事件键: 邀约社交轨迹事件键\(m, 楼, 钟\)/, '邀约社交轨迹键冻结创建楼与世界钟');
});

// ============================================
// 数据层真实回调：坏旧库归一 + 写库增量单调序
// ============================================

test('无 Schema 的旧手机库缺评论或顶层数组损坏时只丢坏子字段，读写入口仍可恢复', async () => {
  const 原updateVariablesWith = globalThis.updateVariablesWith;
  const 原getLastMessageId = globalThis.getLastMessageId;
  const 原SillyTavern = globalThis.SillyTavern;
  const 原Mvu = globalThis.Mvu;
  const 原getVariables = globalThis.getVariables;
  const 测试聊天变量 = {
    _微信: {
      消息: { 损坏: true },
      圈: [{ 楼: 0, 时: 0, 谁: '夏乔', 文: '旧动态缺评论数组' }, null],
      读到: null,
      读时: '损坏',
      圈读到: -1,
      圈读时: null,
      节拍: '损坏',
      已发私聊图: 7,
    },
  };
  globalThis.updateVariablesWith = async cb => {
    cb(测试聊天变量);
  };
  globalThis.getLastMessageId = () => 0;
  globalThis.SillyTavern = { chat: [{ mes: '锚0', is_user: true, swipe_id: 0 }] };
  globalThis.Mvu = { getMvuData: () => ({ stat_data: { 系统: { _绝对时段: 0 } } }) };
  globalThis.getVariables = () => 测试聊天变量;
  try {
    const { 读库, 写库增量, 规范微信消息容器 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
    assert.deepEqual(规范微信消息容器('损坏消息容器'), [], '直接写者也必须复用同一消息容器边界');
    const 旧库 = 读库();
    assert.deepEqual(旧库.消息, []);
    assert.equal(旧库.圈.length, 1);
    assert.deepEqual(旧库.圈[0].评, [], '缺失评论数组按空数组兼容，合法正文继续保留');
    assert.deepEqual(旧库.节拍, {});

    测试聊天变量._微信.消息 = [
      { 楼: 0, 时: 0, 会话: '101', 发: '对方', 文: '合法回复' },
      { 楼: 0, 时: 0, 会话: '101', 发: '坏发送者', 文: '不能保留' },
      { 楼: 0, 时: 0, 会话: '101', 发: '对方', 文: null },
      null,
    ];
    测试聊天变量._微信.圈 = [
      { 楼: 0, 时: 0, 谁: '夏乔', 文: '合法动态', 评: [] },
      { 楼: 0, 时: 0, 谁: '夏乔', 文: null, 评: [] },
      { 楼: 0, 时: 0, 谁: 7, 文: '坏发布者', 评: [] },
    ];
    测试聊天变量._微信.节拍 = { '私:101': '损坏', 群: 3 };
    const 单条损坏库 = 读库();
    assert.deepEqual(单条损坏库.消息.map(消息 => 消息.文), ['合法回复'], '坏消息记录失败关闭');
    assert.deepEqual(单条损坏库.圈.map(动态 => 动态.文), ['合法动态'], '坏朋友圈记录失败关闭');
    assert.deepEqual(单条损坏库.节拍, { 群: 3 }, '坏节拍值不得让单个入口永久静默');

    // 再把两条顶层记录都损坏，证明实际增量回调不依赖一次只读归一也能自修并写入新内容。
    测试聊天变量._微信.消息 = '损坏消息容器';
    测试聊天变量._微信.圈 = { 损坏: true };
    const 已写 = await 写库增量({
      新圈: [{ 楼: 0, 时: 0, 谁: '夏乔', 文: '新动态', 评: [] }],
      新消息: [{ 楼: 0, 时: 0, 会话: '101', 发: '对方', 文: '新回复' }],
      节拍改: { '私:101': 0 },
    });
    assert.equal(已写, true);
    assert.equal(Array.isArray(测试聊天变量._微信.消息), true);
    assert.equal(Array.isArray(测试聊天变量._微信.圈), true);
    assert.equal(测试聊天变量._微信.消息[0].文, '新回复');
    assert.equal(测试聊天变量._微信.圈[0].文, '新动态');
  } finally {
    globalThis.updateVariablesWith = 原updateVariablesWith;
    globalThis.getLastMessageId = 原getLastMessageId;
    globalThis.SillyTavern = 原SillyTavern;
    globalThis.Mvu = 原Mvu;
    globalThis.getVariables = 原getVariables;
  }
});

test('网页刷新把缺失 swipe_id 补成 0 后，旧微信仍可读，下一次增量写不会覆盖旧历史', async () => {
  const 原updateVariablesWith = globalThis.updateVariablesWith;
  const 原getLastMessageId = globalThis.getLastMessageId;
  const 原SillyTavern = globalThis.SillyTavern;
  const 原Mvu = globalThis.Mvu;
  const 原getVariables = globalThis.getVariables;
  const 测试聊天变量 = {
    _微信: {
      消息: [
        {
          楼: 0,
          时: 0,
          会话: '101',
          发: '对方',
          文: '刷新前旧消息',
          序: 1,
          // rq0.65～rq0.85 可能在宿主尚未补 swipe_id 时把 undefined 序列化成 null。
          锚签名: JSON.stringify([false, '锚0', null, null, null, null]),
        },
      ],
      圈: [],
      读到: {},
      读时: {},
      圈读到: -1,
      圈读时: { 楼: -1, 时: -1 },
      节拍: {},
      已发私聊图: {},
    },
  };
  globalThis.updateVariablesWith = async cb => {
    cb(测试聊天变量);
  };
  globalThis.getLastMessageId = () => 0;
  // SillyTavern 刷新加载后会把助手楼缺失的 swipe_id 规范成首分支 0。
  globalThis.SillyTavern = { chat: [{ mes: '锚0', is_user: false, swipe_id: 0 }] };
  globalThis.Mvu = { getMvuData: () => ({ stat_data: { 系统: { _绝对时段: 0 } } }) };
  globalThis.getVariables = () => 测试聊天变量;
  try {
    const { 读库, 写库增量 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
    assert.deepEqual(读库().消息.map(消息 => 消息.文), ['刷新前旧消息'], '刷新后旧历史必须继续可见');

    const 已写 = await 写库增量({
      新圈: [],
      新消息: [{ 楼: 0, 时: 0, 会话: '101', 发: '我', 文: '刷新后新消息', 标识: 'after-reload-1' }],
      节拍改: {},
    });
    assert.equal(已写, true);
    assert.deepEqual(
      测试聊天变量._微信.消息.map(消息 => 消息.文),
      ['刷新前旧消息', '刷新后新消息'],
      '下一次写库不得用过滤后的空历史覆盖旧微信',
    );
    assert.deepEqual(读库().消息.map(消息 => 消息.文), ['刷新前旧消息', '刷新后新消息']);
  } finally {
    globalThis.updateVariablesWith = 原updateVariablesWith;
    globalThis.getLastMessageId = 原getLastMessageId;
    globalThis.SillyTavern = 原SillyTavern;
    globalThis.Mvu = 原Mvu;
    globalThis.getVariables = 原getVariables;
  }
});

test('写库增量 在最近回调内只给实际插入消息分配比存活更大的序；去重不重复落库', async () => {
  const 原updateVariablesWith = globalThis.updateVariablesWith;
  const 原getLastMessageId = globalThis.getLastMessageId;
  const 原SillyTavern = globalThis.SillyTavern;
  const 原Mvu = globalThis.Mvu;
  const 原getVariables = globalThis.getVariables;
  const 测试聊天变量 = {
    _微信: {
      消息: [{ 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '旧回复', 序: 1 }],
      圈: [],
      读到: {},
      读时: {},
      圈读到: -1,
      圈读时: {},
      节拍: {},
      已发私聊图: {},
    },
  };
  globalThis.updateVariablesWith = async cb => {
    cb(测试聊天变量);
  };
  globalThis.getLastMessageId = () => 10;
  // 楼 10 必须落在聊天数组内且有稳定真实锚消息，分支签名才能真实匹配，否则第二次写库会把
  // 第一条新消息当“越界分支”裁掉，序被重新分配回 2。
  globalThis.SillyTavern = {
    chat: Array.from({ length: 11 }, (_, i) => ({ mes: `锚${i}`, is_user: true, swipe_id: 0 })),
  };
  globalThis.Mvu = { getMvuData: () => ({ stat_data: { 系统: { _绝对时段: 20 } } }) };
  globalThis.getVariables = () => 测试聊天变量;
  try {
    const { 写库增量 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
    // 存活最大序 1 → 新插入消息序 2。
    await 写库增量({
      新圈: [],
      新消息: [{ 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '新回复A' }],
      节拍改: {},
    });
    assert.equal(测试聊天变量._微信.消息.find(m => m.文 === '新回复A').序, 2, '首条新消息序=存活最大+1');
    // 同楼同时再插 → 序 3；且必须证明 新回复A 仍存活、仍持序 2（未被重新分配）。
    await 写库增量({
      新圈: [],
      新消息: [{ 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '新回复B' }],
      节拍改: {},
    });
    assert.equal(测试聊天变量._微信.消息.find(m => m.文 === '新回复A').序, 2, '新回复A 保持序 2，未被重新分配');
    assert.equal(测试聊天变量._微信.消息.find(m => m.文 === '新回复B').序, 3, '同楼同时后到消息获得更大序');
    assert.equal(测试聊天变量._微信.消息.filter(m => m.文 === '新回复A').length, 1, '新回复A 未重复落库');
    // 同标识去重：重试迟到消息不得重新落库，也就不分配新序。
    const 再试数 = 测试聊天变量._微信.消息.length;
    await 写库增量({
      新圈: [],
      新消息: [{ 楼: 10, 时: 20, 会话: '101', 发: '我', 文: '重试玩家消息', 标识: 'retry-1' }],
      节拍改: {},
    });
    await 写库增量({
      新圈: [],
      新消息: [{ 楼: 10, 时: 20, 会话: '101', 发: '我', 文: '重试玩家消息', 标识: 'retry-1' }],
      节拍改: {},
    });
    assert.equal(测试聊天变量._微信.消息.length, 再试数 + 1, '重试去重掉的消息不得重复落库');
    assert.equal(测试聊天变量._微信.消息.filter(m => m.文 === '重试玩家消息').length, 1);
    // 新朋友圈也获得单调序（新在前）。
    await 写库增量({
      新圈: [{ 楼: 10, 时: 20, 谁: '夏乔', 文: '新动态' }],
      新消息: [],
      节拍改: {},
    });
    assert.ok(测试聊天变量._微信.圈[0].序 > 测试聊天变量._微信.消息[0].序, '朋友圈序与消息序共享单调递增空间');
  } finally {
    globalThis.updateVariablesWith = 原updateVariablesWith;
    globalThis.getLastMessageId = 原getLastMessageId;
    globalThis.SillyTavern = 原SillyTavern;
    globalThis.Mvu = 原Mvu;
    globalThis.getVariables = 原getVariables;
  }
});

test('写库增量 从合法安全整数最大序递增；小数/负数/超安全序记录不占最大序', async () => {
  const 原updateVariablesWith = globalThis.updateVariablesWith;
  const 原getLastMessageId = globalThis.getLastMessageId;
  const 原SillyTavern = globalThis.SillyTavern;
  const 原Mvu = globalThis.Mvu;
  const 原getVariables = globalThis.getVariables;
  const 测试聊天变量 = {
    _微信: {
      消息: [
        { 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '损坏小数序', 序: 2.5 },
        { 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '损坏负序', 序: -3 },
        { 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '损坏超界序', 序: Number.MAX_SAFE_INTEGER + 1 },
        { 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '合法大序', 序: 7 },
      ],
      圈: [],
      读到: {},
      读时: {},
      圈读到: -1,
      圈读时: {},
      节拍: {},
      已发私聊图: {},
    },
  };
  globalThis.updateVariablesWith = async cb => {
    cb(测试聊天变量);
  };
  globalThis.getLastMessageId = () => 10;
  globalThis.SillyTavern = {
    chat: Array.from({ length: 11 }, (_, i) => ({ mes: `锚${i}`, is_user: true, swipe_id: 0 })),
  };
  globalThis.Mvu = { getMvuData: () => ({ stat_data: { 系统: { _绝对时段: 20 } } }) };
  globalThis.getVariables = () => 测试聊天变量;
  try {
    const { 写库增量 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
    await 写库增量({
      新圈: [],
      新消息: [{ 楼: 10, 时: 20, 会话: '101', 发: '对方', 文: '新回复' }],
      节拍改: {},
    });
    // 合法最大序 7 → 新消息序 8；小数/负数/超安全整数不得抬最大序。
    assert.equal(测试聊天变量._微信.消息.find(m => m.文 === '新回复').序, 8, '分配从合法安全整数最大序递增');
    // 损坏序记录原样保留，不被改写。
    assert.equal(测试聊天变量._微信.消息.find(m => m.文 === '损坏小数序').序, 2.5, '损坏记录不被改写');
  } finally {
    globalThis.updateVariablesWith = 原updateVariablesWith;
    globalThis.getLastMessageId = 原getLastMessageId;
    globalThis.SillyTavern = 原SillyTavern;
    globalThis.Mvu = 原Mvu;
    globalThis.getVariables = 原getVariables;
  }
});
