/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lodash = require('lodash');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 运行时源码 = readFileSync(new URL('./运行时上下文.ts', 手机目录), 'utf8');
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const 刷新镜像源码 = readFileSync(new URL('./刷新恢复镜像.ts', 手机目录), 'utf8');
const 渲染源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 红点源码 = readFileSync(new URL('./壳/红点与开合.ts', 手机目录), 'utf8');
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 父亲源码 = readFileSync(new URL('./交互/父亲通话.ts', 手机目录), 'utf8');
const 孕情通知源码 = readFileSync(new URL('./孕情AI通知.ts', 手机目录), 'utf8');
const 节拍源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');
const 楼务通知源码 = readFileSync(new URL('./通知桥.ts', 手机目录), 'utf8');
const 冷落预警源码 = readFileSync(new URL('./冷落预警.ts', 手机目录), 'utf8');
const 游戏逻辑源码 = readFileSync(new URL('../index.ts', 手机目录), 'utf8');
const 回合引擎源码 = readFileSync(new URL('../回合引擎.ts', 手机目录), 'utf8');

function 截源(源, 开始, 结束) {
  const 标准源 = 源.replace(/\r\n/g, '\n');
  const 起 = 标准源.indexOf(开始);
  const 止 = 标准源.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 标准源.slice(起, 止);
}

function 执行TS片段(片段, 导出名, 依赖 = {}) {
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(依赖), js)(module, module.exports, ...Object.values(依赖));
  return module.exports;
}

function 下一拍() {
  return new Promise(resolve => setImmediate(resolve));
}

class 内存会话存储 {
  #值 = new Map();

  getItem(键) {
    return this.#值.has(键) ? this.#值.get(键) : null;
  }

  setItem(键, 值) {
    this.#值.set(键, String(值));
  }

  removeItem(键) {
    this.#值.delete(键);
  }
}

function 创建刷新镜像测试环境() {
  const sessionStorage = new 内存会话存储();
  const chat = [
    { is_user: true, swipe_id: 0, extra: { _rqgy回合令牌: 'user-0' }, mes: '会被正则改写的正文' },
    { is_user: false, swipe_id: 1, extra: { _rqgy回合令牌: 'assistant-1' }, mes: '角色回复' },
  ];
  const context = {
    chatMetadata: { integrity: 'wechat-refresh-test-chat' },
    chatId: 'chat-a',
    characterId: 7,
    groupId: null,
  };
  const SillyTavern = {
    chat,
    getContext: () => context,
  };
  const parent = { sessionStorage, SillyTavern };
  const window = { parent, sessionStorage };
  const api = 执行TS片段(
    刷新镜像源码,
    [
      '读取微信持久修订',
      '推进微信持久修订',
      '写入微信刷新镜像',
      '写入微信清空镜像',
      '选择微信刷新恢复值',
      '计算微信刷新分支指纹',
    ],
    { SillyTavern, window },
  );
  return { api, SillyTavern, context, sessionStorage };
}

test('冷启动楼轴：宏尚未就绪返回假 0 时，不把高楼层微信记录误判成未来数据', () => {
  const 片段 = 截源(运行时源码, 'export function 末楼', 'export function 当前手机数据');
  const 宿主 = { chat: [] };
  const { 末楼, 手机楼轴已就绪 } = 执行TS片段(片段, ['末楼', '手机楼轴已就绪'], {
    SillyTavern: 宿主,
    getLastMessageId: () => 0,
  });

  assert.equal(手机楼轴已就绪(), false, '空聊天数组是宿主冷启动，不是合法第 0 楼');
  assert.equal(末楼(), -1, '宏把空串转成 0 时必须保留未就绪哨兵');

  宿主.chat = Array.from({ length: 9 }, (_, i) => ({ mes: String(i) }));
  assert.equal(手机楼轴已就绪(), true);
  assert.equal(末楼(), 8, '聊天数组已经恢复时以真实数组末楼为准，不信任仍为 0 的宏');
});

test('聊天变量硬保存：串行等待宿主 saveMetadata，同一聊天才执行，不能只等防抖定时器', async () => {
  assert.match(数据层源码, /export async function 立即持久保存手机聊天变量/);
  const 片段 = 截源(数据层源码, 'type 手机宿主保存接口', '/**\n * 宿主明确报告删楼');
  let 聊天ID = 'chat-a';
  const 调用 = [];
  const 放行 = [];
  const 直接上下文 = {
    saveMetadata: async () => {
      调用.push(`开始:${聊天ID}`);
      await new Promise(resolve => 放行.push(resolve));
      调用.push(`结束:${聊天ID}`);
    },
  };
  const window = { parent: {} };
  let 聊天变量 = {
    _微信: { 消息: [], 圈: [], 读到: {}, 读时: {}, 节拍: {}, 已发私聊图: {} },
  };
  const 选择当前值 = (当前值, 当前键存在) => ({
    值: 当前值,
    使用镜像: false,
    当前修订: 当前值?.__rqgy微信持久修订 ?? 0,
    镜像修订: 0,
    聊天身份: 当前键存在 ? `test:${聊天ID}` : '',
  });
  const { 立即持久保存手机聊天变量 } = 执行TS片段(片段, ['立即持久保存手机聊天变量'], {
    当前聊天ID: () => 聊天ID,
    当前手机绝对时段: () => 20,
    SillyTavern: 直接上下文,
    window,
    _: lodash,
    updateVariablesWith: async updater => {
      聊天变量 = updater(lodash.cloneDeep(聊天变量));
      return 聊天变量;
    },
    getVariables: () => lodash.cloneDeep(聊天变量),
    读取微信原始候选: vars => ({ 库: vars._微信, 选择: 选择当前值(vars._微信, '_微信' in vars) }),
    是普通对象: 值 => 值 !== null && typeof 值 === 'object' && !Array.isArray(值),
    读取微信持久修订: 微信 => 微信?.__rqgy微信持久修订 ?? 0,
    推进微信持久修订: 微信 => {
      微信.__rqgy微信持久修订 = (微信.__rqgy微信持久修订 ?? 0) + 1;
      return 微信.__rqgy微信持久修订;
    },
    写入微信刷新镜像: () => true,
    写入当前聊天微信刷新镜像: () => true,
    写入微信清空镜像: () => 1,
    选择微信刷新恢复值: 选择当前值,
  });

  const 第一 = 立即持久保存手机聊天变量('chat-a');
  const 第二 = 立即持久保存手机聊天变量('chat-a');
  await 下一拍();
  assert.deepEqual(调用, ['开始:chat-a'], '并发气泡只能有一个宿主保存正在执行');
  放行.shift()();
  assert.equal(await 第一, true);
  await 下一拍();
  assert.deepEqual(调用, ['开始:chat-a', '结束:chat-a', '开始:chat-a'], '第二次保存必须排在第一次之后');
  放行.shift()();
  assert.equal(await 第二, true);

  const 切聊前调用数 = 调用.length;
  const 旧聊天保存 = 立即持久保存手机聊天变量('chat-a');
  聊天ID = 'chat-b';
  assert.equal(await 旧聊天保存, false, '排队期间已经切聊时不得把旧聊天提交到新聊天');
  assert.equal(调用.length, 切聊前调用数, '失效聊天不得调用宿主保存');
});

test('宿主保存没有成功回执时：微信先写刷新恢复日志，并安排静默期补存，不能再把 Promise resolve 当成落盘', () => {
  const 保存段 = 截源(数据层源码, 'type 手机宿主保存接口', '/**\n * 宿主明确报告删楼');
  assert.match(保存段, /记录当前微信刷新恢复副本\(预期聊天ID\)/, '请求宿主保存前必须先同步留下刷新恢复副本');
  assert.match(
    保存段,
    /localStorage[\s\S]*sessionStorage|sessionStorage[\s\S]*localStorage/,
    '恢复副本必须同时覆盖关闭页面后的 localStorage 与同 tab 的 sessionStorage',
  );
  assert.match(保存段, /安排手机聊天变量延迟补存\(预期聊天ID\)/, '宿主保存占用或吞错时必须有静默期补存');
  assert.doesNotMatch(保存段, /本函数返回前真正落盘/, '宿主接口没有成功回执，注释和返回值不得继续伪称已经落盘');
});

test('保存失败后刷新：较新的完整微信镜像能覆盖旧对象或旧 null，并保留上下文与节拍水位', () => {
  const { api, SillyTavern } = 创建刷新镜像测试环境();
  const 最新微信 = {
    消息: [
      { id: 'old-context', 会话: '101', 发: '我', 文: '你上次说的那件事呢？' },
      { id: 'latest-reply', 会话: '101', 发: '对方', 文: '我当然记得。' },
    ],
    节拍: { '私聊:101': 37 },
    读到: { 101: 1 },
  };
  assert.equal(api.推进微信持久修订(最新微信, 'chat-a', 20), 1);
  assert.equal(api.写入微信刷新镜像('chat-a', 最新微信, 20), true);

  const 从旧对象恢复 = api.选择微信刷新恢复值({ 消息: [], 节拍: {} }, true, 'chat-a', 20);
  assert.equal(从旧对象恢复.使用镜像, true);
  assert.deepEqual(从旧对象恢复.值.消息, 最新微信.消息, '刷新后必须恢复完整上下文，而非只恢复最后一条气泡');
  assert.deepEqual(从旧对象恢复.值.节拍, 最新微信.节拍, '私聊水位必须一起恢复，避免角色再次走首次联系');

  const 从旧Null恢复 = api.选择微信刷新恢复值(null, true, 'chat-a', 20);
  assert.equal(从旧Null恢复.使用镜像, true, '旧存档中的 null 可能只是上次成功保存的基线，不能压过更高修订副本');
  assert.deepEqual(从旧Null恢复.值.消息, 最新微信.消息);

  SillyTavern.chat[1].mes = '刷新后由正则重写的显示正文';
  SillyTavern.chat[1].send_date = '刷新后格式化日期';
  assert.equal(
    api.选择微信刷新恢复值({ 消息: [] }, true, 'chat-a', 20).使用镜像,
    true,
    '正文、日期等非身份字段变化不能让同一时间线的恢复副本失配',
  );

  SillyTavern.chat.push({ is_user: true, swipe_id: 0, extra: { _rqgy回合令牌: 'user-2' } });
  assert.equal(
    api.选择微信刷新恢复值({ 消息: [] }, true, 'chat-a', 21).使用镜像,
    true,
    '镜像创建后正常增加楼层或推进时间，仍应允许恢复其已确认前缀',
  );
});

test('刷新镜像时间线门：回档、删楼、swipe 或切换聊天身份时拒绝旧副本', () => {
  const { api, SillyTavern, context } = 创建刷新镜像测试环境();
  const 原聊天 = structuredClone(SillyTavern.chat);
  const 微信 = { 消息: [{ id: 'future-message' }], 节拍: { '私聊:101': 9 } };
  api.推进微信持久修订(微信, 'chat-a', 20);
  api.写入微信刷新镜像('chat-a', 微信, 20);

  assert.equal(
    api.选择微信刷新恢复值({ 消息: [] }, true, 'chat-a', 19).使用镜像,
    false,
    '世界时间回到镜像之前时不得把未来微信复活',
  );

  SillyTavern.chat[1].swipe_id = 2;
  assert.equal(
    api.选择微信刷新恢复值({ 消息: [] }, true, 'chat-a', 20).使用镜像,
    false,
    '同楼换 swipe 后必须拒绝旧分支镜像',
  );

  SillyTavern.chat.splice(0, SillyTavern.chat.length, ...structuredClone(原聊天).slice(0, 1));
  assert.equal(
    api.选择微信刷新恢复值({ 消息: [] }, true, 'chat-a', 20).使用镜像,
    false,
    '物理删楼删到镜像锚点之前时不得恢复已删除时间线',
  );

  SillyTavern.chat.splice(0, SillyTavern.chat.length, ...structuredClone(原聊天));
  context.chatMetadata.integrity = 'another-chat-integrity';
  assert.equal(
    api.选择微信刷新恢复值({ 消息: [] }, true, 'chat-a', 20).使用镜像,
    false,
    '即使聊天 ID 文本相同，不同 integrity 也不能共享微信副本',
  );
});

test('重开墓碑：高修订清空能阻止旧微信复活，新局第一次写入又能覆盖墓碑', () => {
  const { api } = 创建刷新镜像测试环境();
  const 旧微信 = { 消息: [{ id: 'old-game' }], 节拍: { '私聊:101': 30 } };
  assert.equal(api.推进微信持久修订(旧微信, 'chat-a', 20), 1);
  api.写入微信刷新镜像('chat-a', 旧微信, 20);

  assert.equal(api.写入微信清空镜像('chat-a', 0), 2);
  const 重开后 = api.选择微信刷新恢复值(旧微信, true, 'chat-a', 0);
  assert.equal(重开后.使用镜像, true);
  assert.equal(重开后.值, null, '新局清空墓碑必须高于宿主可能重新载入的旧微信');

  const 新局微信 = { 消息: [{ id: 'new-game-first-message' }], 节拍: { '私聊:101': 0 } };
  assert.equal(api.推进微信持久修订(新局微信, 'chat-a', 0), 3);
  api.写入微信刷新镜像('chat-a', 新局微信, 0);
  const 新局恢复 = api.选择微信刷新恢复值(null, true, 'chat-a', 0);
  assert.equal(新局恢复.使用镜像, true);
  assert.deepEqual(新局恢复.值.消息, 新局微信.消息, '新局真实写入必须取得更高修订并替代墓碑');
});

test('时间线事务收口：回档裁剪、删楼协调、重开与失败补偿都会更新镜像并请求宿主保存', () => {
  const 裁剪段 = 截源(回合引擎源码, 'export function 裁手机时间线', 'interface 已删时间线协调选项');
  assert.match(
    裁剪段,
    /选择微信刷新恢复值\([\s\S]*?手机聊天ID,[\s\S]*?目标钟,[\s\S]*?\)/,
    '回档裁剪必须按目标世界时间选择恢复副本，不能先读入未来镜像',
  );
  assert.match(裁剪段, /推进微信持久修订\(库 as Record<string, unknown>, 手机聊天ID, 目标钟\)/);
  assert.doesNotMatch(裁剪段, /写入微信刷新镜像\(/, '变量回调可能失败，不能在提交前把未提交裁剪写入外部镜像');

  const 删楼协调段 = 截源(回合引擎源码, 'async function 协调已删时间线', '/** 宿主原生删楼与 swipe');
  assert.match(
    删楼协调段,
    /await updateVariablesWith\([\s\S]*?裁手机时间线\([\s\S]*?await 立即持久保存手机聊天变量\(手机聊天ID\)/,
    '物理删楼或 swipe 裁枝后必须把新分支真值写镜像并补存宿主',
  );

  const 重开起 = 回合引擎源码.indexOf('export async function 重开一局');
  assert.ok(重开起 >= 0, '缺少重开入口');
  const 出厂写入位 = 回合引擎源码.indexOf('await 脚本写入(旧raw, 出厂', 重开起);
  const 墓碑位 = 回合引擎源码.indexOf('写入微信清空镜像(重开聊天ID, 出厂.系统._绝对时段)', 重开起);
  const 重开保存位 = 回合引擎源码.indexOf('await 立即持久保存手机聊天变量(重开聊天ID)', 重开起);
  assert.ok(出厂写入位 >= 0 && 出厂写入位 < 墓碑位, '清空墓碑必须锚在出厂 stat 已写回后的新时间线');
  assert.ok(墓碑位 < 重开保存位, '重开墓碑创建后必须请求宿主保存');

  const 权威恢复段 = 截源(数据层源码, 'export async function 确认当前微信为刷新真值', '/**\n * 撤回和父亲通话');
  assert.match(
    权威恢复段,
    /if \(!键存在 \|\| !是普通对象\(当前值\)\) \{[\s\S]*?清空 = true/,
    '推进前没有 `_微信` 键或值异常时，失败补偿也必须生成高修订清空墓碑',
  );

  const 补偿起 = 游戏逻辑源码.indexOf('async function 恢复时间聊天备份');
  assert.ok(补偿起 >= 0, '缺少时间事务补偿入口');
  const 补偿片段 = 游戏逻辑源码.slice(补偿起, 补偿起 + 2600);
  assert.match(补偿片段, /keys\.includes\('_微信'\)/);
  assert.match(补偿片段, /await 确认当前微信为刷新真值\(预期聊天ID\)/, '精确快照恢复必须升修订覆盖旧镜像');
  assert.match(补偿片段, /await 立即持久保存手机聊天变量\(预期聊天ID\)/, '补偿后的权威快照必须补存宿主');
});

test('刷新启动：先等真实聊天楼轴，再冻结身份并恢复日志，不能让冷启动空库触发初始私聊', () => {
  const 等待段 = 截源(数据层源码, 'export async function 等待微信刷新宿主就绪', '/**\n * 游戏逻辑启动的第一阶段恢复');
  assert.match(等待段, /while \(!手机楼轴已就绪\(\)\)/, '启动门必须持续等待真实聊天数组，而不是把空数组当第 0 楼');
  assert.match(等待段, /等待宿主聊天与微信记录恢复超时/, '宿主异常时必须有限失败，不能永久挂住脚本启动');

  const 启动段 = 截源(游戏逻辑源码, "await Promise.race([waitGlobalInitialized('Mvu'), 超时]);", '挂载监听();');
  const 等待位 = 启动段.indexOf('await 等待微信刷新宿主就绪();');
  const 冻结位 = 启动段.indexOf('const 启动聊天ID = 当前聊天ID();');
  const 恢复位 = 启动段.indexOf('await 恢复微信刷新恢复副本(启动聊天ID)');
  const 首次手机读写风险位 = 启动段.indexOf('await 清理数据库陈旧互斥旗()');
  assert.ok(等待位 >= 0 && 等待位 < 冻结位, '必须先等宿主聊天恢复，再冻结聊天 ID/chat 引用/世代');
  assert.ok(冻结位 >= 0 && 冻结位 < 恢复位, '恢复日志必须受已冻结的同聊天启动租约保护');
  assert.ok(首次手机读写风险位 < 0 || 恢复位 < 首次手机读写风险位, '日志恢复必须早于可能派生手机内容的启动任务');
});

test('微信可见事务提交：发送、整批回复、邀约、撤回和父亲通话都在事务边界硬保存', () => {
  const 写库段 = 截源(数据层源码, 'export async function 写库增量', 'export async function 压缩微信会话记录');
  const 发送段 = 截源(交互源码, 'async function 发消息(', '/** 黄灯到时只消费本批');
  const 批次段 = 截源(交互源码, 'async function 执行待回复批次(', 'async function 执行批次聊天回复(');
  const 邀约段 = 截源(交互源码, 'async function 约出来(', '/**\n * 共同邀约的批次所有者');
  const 撤回段 = 截源(交互源码, 'async function 持久化玩家微信撤回', 'interface 微信消息菜单选项');
  const 通话段 = 截源(父亲源码, 'async function 确保父亲通话完成消息', 'function 父亲通话结论');

  assert.doesNotMatch(写库段, /立即持久保存手机聊天变量/, '底层增量也承担已读水位，不能每次都做整聊硬保存');

  const 落库位 = 发送段.indexOf('已成功落库 = true;');
  const 重绘位 = 发送段.indexOf('请求手机重绘();', 落库位);
  const 保存位 = 发送段.indexOf('await 立即持久保存手机聊天变量(发送聊天ID);', 落库位);
  assert.ok(落库位 >= 0 && 重绘位 > 落库位 && 保存位 > 重绘位, '玩家气泡先显示，再等待本聊天硬保存');

  assert.match(
    批次段,
    /if \(已生成 && 手机发送租约仍有效\(上下文\.发送租约\)\) \{[\s\S]*await 立即持久保存手机聊天变量\(上下文\.发送租约\.聊天ID\);[\s\S]*\}/,
    '整批 AI 回复完成后只在批次边界硬保存一次',
  );
  assert.match(邀约段, /await 立即持久保存手机聊天变量\(邀约聊天ID\);/, '邀约消息与回复提交后应硬保存');
  assert.match(撤回段, /await 立即持久保存手机聊天变量\(预期聊天ID\);/, '玩家撤回成功后应硬保存墓碑');
  assert.match(通话段, /await 立即持久保存手机聊天变量\(预期聊天ID\);/, '父亲通话结束气泡也不能只留在内存');
});

test('自动通知、必达群聊、普通节拍、冷落预警与实时已读都在各自批次边界硬保存一次', () => {
  assert.match(
    孕情通知源码,
    /if \(已写\) \{[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/,
    '孕产与家庭计划通知成功显示后必须硬保存',
  );
  assert.match(
    节拍源码,
    /if \(必达结果 === '有新'\)[\s\S]*?if \(!已写必达群\) return;[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/,
    '孕产必达群批次必须只在整批成功后保存一次',
  );
  assert.match(
    节拍源码,
    /if \(有新 \|\| Object\.keys\(节拍改\)\.length \|\| 已发私聊图改\)[\s\S]*?if \(!已写\) return;[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/,
    '普通自动节拍必须只在最终增量成功后保存一次',
  );
  assert.match(楼务通知源码, /if \(已写\) \{[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/);
  assert.match(
    冷落预警源码,
    /if \(!已写\) return;[\s\S]{0,180}await 立即持久保存手机聊天变量\(时间线租约\.聊天标识\);/,
  );
  assert.match(
    数据层源码,
    /const 已写 = await 写库增量\([\s\S]*?if \(已写\) await 立即持久保存手机聊天变量\(聊天ID\);[\s\S]*?return 已写;/,
    '实时已读水位也必须在成功写入后落盘，避免刷新后红点复活',
  );
});

test('手机早于酒馆聊天加载时显示恢复态并自动复查，而不是把空库当成真实聊天记录', () => {
  assert.match(渲染源码, /手机楼轴已就绪/);
  const 就绪判断 = 渲染源码.indexOf('if (!手机楼轴已就绪())');
  const 读库位置 = 渲染源码.indexOf('const 库 = 读库()');
  assert.ok(就绪判断 >= 0 && 就绪判断 < 读库位置, '必须先识别冷启动，再读取会被楼/分支过滤的微信库');
  assert.match(渲染源码, /正在恢复微信记录/);
  assert.match(渲染源码, /刷新红点\(\)/, '恢复态借红点调度器继续复查宿主就绪状态');

  assert.match(红点源码, /function 排队恢复手机冷启动/);
  assert.match(红点源码, /if \(!手机楼轴已就绪\(\)\)/);
  assert.match(红点源码, /手机冷启动恢复次数 < 手机冷启动快速恢复上限 \? 100 : 1000/, '超长冷启动应降频继续复查');
  assert.doesNotMatch(红点源码, /手机冷启动恢复次数 >= .*恢复上限.*return/, '超过快速窗口不得永久停止恢复');
  assert.match(红点源码, /已注册端口\?\.渲染\(\)/, '宿主恢复后必须主动重绘已打开的手机');
});
