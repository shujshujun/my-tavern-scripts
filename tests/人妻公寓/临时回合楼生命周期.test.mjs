/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  临时楼标记键,
  回合令牌键,
  回合角色键,
  合法回合令牌前缀,
  定位本轮临时楼,
  临时楼降序楼层,
  扫描遗留临时楼,
  构造转正更新负载,
  校验转正候选,
} = require('../../src/人妻公寓/脚本/游戏逻辑/临时回合楼.ts');
const { 数据库快照未越过楼层 } = require('../../src/人妻公寓/脚本/游戏逻辑/数据库时间线栅栏.ts');

const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
const index = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
const 数据库桥 = readFileSync('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts', 'utf8');

const 主回合 = engine.slice(engine.indexOf('export async function 执行回合'), engine.indexOf('export async function 重掷回合'));
const 重掷 = engine.slice(engine.indexOf('export async function 重掷回合'), engine.indexOf('export async function 回档至'));
const 回档 = engine.slice(engine.indexOf('export async function 回档至'), engine.indexOf('export async function 开始新游戏'));

const 令牌 = `${合法回合令牌前缀}1-123-456`;
const 令牌B = `${合法回合令牌前缀}2-999-888`;

let 楼序号 = 0;
function 建消息(extra, 正文 = '正文') {
  楼序号 += 1;
  return { extra, message: `${正文}-${楼序号}`, role: 'user' };
}
const 用户extra = (令牌值, 角色 = 'user', 临时 = true) => ({
  [回合令牌键]: 令牌值,
  [回合角色键]: 角色,
  ...(临时 !== undefined ? { [临时楼标记键]: 临时 } : {}),
});

// ── A:精确定位语义(纯函数动态测试) ──────────────────────────────

test('A1 登记楼层仍是同一对象时直接接受,不扫描不比较文本', () => {
  const 旧楼 = 建消息({});
  const user = 建消息(用户extra(令牌, 'user'));
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, user, assistant];

  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: user, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [2, 1]);
});

test('A2 楼号漂移时按对象引用重定位,不误删漂移后占据原号的其他正文', () => {
  const 旧楼 = 建消息({});
  const user = 建消息(用户extra(令牌, 'user'));
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 外置插楼 = 建消息({}, 'MVU外置模型插入的楼');
  // MVU 外置解析在正文已落楼、尚未转正窗口里插了一楼:assistant 从 2 漂到 3
  const 表 = [旧楼, user, 外置插楼, assistant];

  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: user, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [3, 1], '必须按引用重定位,不能删 2 楼的外置插楼');
});

test('A3 原楼号已被既有正文占用时,只删引用所在楼,绝不动原位替代消息', () => {
  const 旧楼 = 建消息({});
  const 既有正文 = 建消息({}, '之前回合已成功的正文');
  const user = 建消息(用户extra(令牌, 'user'));
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  // 登记时 user 在 1 楼;现在 1 楼住着之前回合的正文,user 实际漂到 2
  const 表 = [旧楼, 既有正文, user, assistant];

  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: user, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [3, 2], '1 楼既有正文必须原样保留');
});

test('A4 宿主重建对象导致引用丢失后,才按同一精确令牌+同角色兜底', () => {
  const 旧楼 = 建消息({});
  const 重建user = 建消息(用户extra(令牌, 'user'), '行动(宿主重建副本)');
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, 重建user, assistant];

  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: { 已回收: true }, 角色: 'user' }, // 原引用对象已被宿主销毁
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [2, 1], '按精确令牌+角色兜底到重建副本');
});

test('A5 错令牌:引用失效且同角色但令牌不同,不命中', () => {
  const 旧楼 = 建消息({});
  const 他轮user = 建消息(用户extra(令牌B, 'user'));
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, 他轮user, assistant];

  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: { 已回收: true }, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [2], '不能拿别的回合的 user 楼顶替');
});

test('A6 错角色:引用失效且同令牌但角色不符,不命中', () => {
  const 旧楼 = 建消息({});
  const 他角色楼 = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, 他角色楼];

  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: { 已回收: true }, 角色: 'user' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [], '同令牌但角色不同的楼不能顶替 user 楼');
});

test('A7 当前分支完全不存在:引用与令牌都定位不到时零删除', () => {
  const 表 = [建消息({}), 建消息({})];
  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: { 已回收: true }, 角色: 'user' },
    { 楼层: 2, 引用: { 已回收: true }, 角色: 'assistant' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [], '分支已无本轮消息,不得删任何替代楼');
});

test('A8 命中去重并按楼层降序,避免删第一条后第二条移位', () => {
  const 旧楼 = 建消息({});
  const user = 建消息(用户extra(令牌, 'user'));
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, user, assistant];
  // 两条登记指向同一对象(极端防御场景)必须去重
  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.deepEqual(临时楼降序楼层(命中), [2]);
});

// ── B:临时→正式 转正(纯函数动态测试) ───────────────────────────

test('B1 构造转正更新负载:保留每条已有 extra,只把临时标记改为 false', () => {
  const 旧楼 = 建消息({});
  const user = 建消息(用户extra(令牌, 'user'), '行动');
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, user, assistant];
  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: user, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);

  const 负载 = 构造转正更新负载(表, 命中);
  assert.deepEqual(
    负载,
    [
      { message_id: 1, extra: { ...user.extra, [临时楼标记键]: false } },
      { message_id: 2, extra: { ...assistant.extra, [临时楼标记键]: false } },
    ],
    '除临时标记外其余 extra 必须原样保留(令牌/角色不丢)',
  );
  assert.equal(负载[0].extra[回合令牌键], 令牌);
  assert.equal(负载[0].extra[回合角色键], 'user');
  assert.equal(负载[0].extra[临时楼标记键], false);
});

test('B2 转正校验:user/assistant 两条必须齐,少任一条即拒绝', () => {
  const 旧楼 = 建消息({});
  const user = 建消息(用户extra(令牌, 'user'));
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, user, assistant];
  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: user, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.doesNotThrow(() => 校验转正候选(表, 令牌, 命中));

  assert.throws(() => 校验转正候选(表, 令牌, [命中[0]]), /转正失败/, '缺 assistant 必须拒绝转正');
});

test('B3 转正校验:标记非严格 true / 令牌不一致 一律拒绝,防误改非本轮消息', () => {
  const 旧楼 = 建消息({});
  // user 楼已被标为正式(旧版成功回合只有令牌没有新标记,同样视同正式)
  const 正式user = 建消息(用户extra(令牌, 'user', false));
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, 正式user, assistant];
  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: 正式user, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.throws(() => 校验转正候选(表, 令牌, 命中), /转正失败/, '临时标记非严格 true 的消息不得被标正式');

  const 异令牌assistant = 建消息(用户extra(令牌B, 'assistant'));
  const 表2 = [旧楼, 建消息(用户extra(令牌, 'user')), 异令牌assistant];
  const 命中2 = 定位本轮临时楼(表2, 令牌, [
    { 楼层: 1, 引用: 表2[1], 角色: 'user' },
    { 楼层: 2, 引用: 异令牌assistant, 角色: 'assistant' },
  ]);
  assert.throws(() => 校验转正候选(表2, 令牌, 命中2), /转正失败/, '令牌不一致必须拒绝转正');
});

test('B4 转正校验:extra 角色与命中角色必须一致,宿主替换对象后角色错位楼拒绝转正', () => {
  const 旧楼 = 建消息({});
  // 宿主异常把 user 楼的 extra 角色改写成 assistant(令牌与临时标记未动,对象引用未变)
  const 错位user = 建消息(用户extra(令牌, 'assistant'), '行动');
  const assistant = 建消息(用户extra(令牌, 'assistant'));
  const 表 = [旧楼, 错位user, assistant];
  const 命中 = 定位本轮临时楼(表, 令牌, [
    { 楼层: 1, 引用: 错位user, 角色: 'user' },
    { 楼层: 2, 引用: assistant, 角色: 'assistant' },
  ]);
  assert.throws(() => 校验转正候选(表, 令牌, 命中), /转正失败/, 'extra 角色与登记角色不符必须拒绝转正');
});

// ── C:中断恢复扫描(纯函数动态测试) ─────────────────────────────

test('C1 遗留扫描只认严格 true 标记:false/缺字段/旧版只有令牌/错令牌格式/错角色全部保留', () => {
  const 表 = [
    建消息({}, '正式旧楼'), // 无 extra
    建消息({ [回合令牌键]: 令牌, [回合角色键]: 'user' }, '旧版成功回合:只有令牌,无新临时标记=正式历史'),
    建消息(用户extra(令牌, 'user', false), '已转正的正式回合'),
    建消息(用户extra(令牌, 'user', 'yes'), '标记是字符串而非严格 true'),
    建消息(用户extra('别的令牌格式', 'user'), '令牌格式错误'),
    建消息(用户extra(令牌, 'system'), '角色格式错误'),
    建消息(用户extra(令牌, 'user'), '真正的遗留临时 user 楼'),
    建消息(用户extra(令牌, 'assistant'), '真正的遗留临时 assistant 楼'),
  ];

  assert.deepEqual(扫描遗留临时楼(表), [7, 6], '只删严格 true 且令牌/角色格式有效的两条,且降序');
});

test('C2 扫描后再次执行零命中:物理楼删掉后恢复入口幂等', () => {
  const 表 = [建消息({}), 建消息(用户extra(令牌, 'user'))];
  assert.deepEqual(扫描遗留临时楼(表), [1]);
  const 清理后 = 表.filter(楼 => 楼 !== 表[1]);
  assert.deepEqual(扫描遗留临时楼(清理后), [], '再次扫描必须零命中,不能按旧楼号再删别的消息');
});

test('C3 恢复入口组合:零命中零写入,有命中则冻结→删楼→等待数据库时间线,失败向上抛', () => {
  const 恢复函数 = engine.slice(
    engine.indexOf('export async function 恢复遗留临时回合楼'),
    engine.indexOf('export function 裁手机时间线'),
  );
  assert.match(恢复函数, /扫描遗留临时楼/);
  assert.match(恢复函数, /if \(!待删\.length\) return 0/, '没有命中必须零写入');
  assert.match(恢复函数, /标记数据库时间线将变更/);
  assert.match(恢复函数, /内部删除聊天消息/);
  assert.match(恢复函数, /等待数据库时间线就绪/);
  assert.doesNotMatch(恢复函数, /catch/, '删除失败必须向上抛错,不得吞掉');
});

test('C4 执行回合互斥期内与启动流程都调用恢复入口', () => {
  assert.match(主回合, /await 恢复遗留临时回合楼\(\)/, '执行回合 已取得互斥后必须先恢复遗留楼');
  const 执行回合恢复位置 = 主回合.indexOf('await 恢复遗留临时回合楼()');
  const 生成开始位置 = 主回合.indexOf("eventEmit('人妻公寓:生成开始')");
  assert.ok(执行回合恢复位置 >= 0 && 执行回合恢复位置 < 生成开始位置, '恢复必须早于本轮快照/建楼');

  // 启动区窄切片原本就切到 挂载监听() 之前,切片内再查 挂载监听 必为 -1;
  // 改用 index 全文绝对位置比较恢复调用与实际挂载监听,并保留窄切片存在性断言。
  const 恢复事务区位置 = index.indexOf('await 恢复中断隔离提交');
  const 启动恢复位置 = index.indexOf('await 恢复遗留临时回合楼();');
  const 挂载监听位置 = index.indexOf('挂载监听()');
  assert.ok(启动恢复位置 >= 0, '启动流程必须调用恢复入口');
  assert.ok(启动恢复位置 > 恢复事务区位置, '恢复必须位于中断恢复事务区之后');
  assert.ok(启动恢复位置 < 挂载监听位置, '恢复必须先于挂玩法监听/接受 UI 操作');
  const 启动区 = index.slice(恢复事务区位置, 挂载监听位置);
  assert.match(启动区, /await 恢复遗留临时回合楼\(\)/, '启动恢复调用落在恢复事务区与挂载监听之间');
});

// ── D:六类生命周期(源码契约) ────────────────────────────────────

test('D1 成功:最终整表写入后先持久转正,之后才置内存转正标志', () => {
  assert.match(主回合, /await 持久转正本轮临时楼\(\)/);
  const 最终整表位置 = 主回合.indexOf('Mvu.replaceMvuData');
  const 转正调用位置 = 主回合.indexOf('await 持久转正本轮临时楼()');
  const 转正标志位置 = 主回合.indexOf('临时用户已转正 = true');
  assert.ok(
    最终整表位置 >= 0 && 最终整表位置 < 转正调用位置 && 转正调用位置 < 转正标志位置,
    '顺序必须为:replaceMvuData → 持久转正 → 内存标志置真',
  );
  assert.match(主回合, /await 校验转正候选\(|校验转正候选\(/, '转正前必须按精确令牌/角色校验两条齐全');
  assert.match(主回合, /setChatMessages\(构造转正更新负载/, '转正必须调用纯函数构造负载(保留每条已有 extra 只改标记,标记置 false 由 B1 动态验证)');
});

test('D2 普通失败/取消:未转正分支按精确令牌/引用清理,既有正文不动', () => {
  assert.match(主回合, /if \(!临时用户已转正\)/);
  assert.match(主回合, /定位本轮临时楼\(SillyTavern\.chat/);
  assert.match(主回合, /临时楼降序楼层\(/);
  assert.match(主回合, /__RQGY_CANCELLED__/, '取消仍抛同一哨兵');
  assert.match(主回合, /确认回合未取消\(\)/, '取消经确认入口抛出,统一进入 finally 清理');
});

test('D3 变量解析超时:按设计保留正文继续提交,绝不走临时楼全删', () => {
  const 解析块 = engine.slice(engine.indexOf('async function 内置外置变量解析'), engine.indexOf('async function 补模型变量结算'));
  assert.match(解析块, /__RQGY_MVUVARS_TIMEOUT__/, '超时哨兵存在');
  assert.match(解析块, /reject\(new Error\('__RQGY_MVUVARS_TIMEOUT__'\)\)/);
  assert.match(解析块, /return \{ 结果: '失败' \}/, '超时被捕获并返回失败,不向回合抛错');
  const 失败处理 = 主回合.slice(主回合.indexOf('if (内置变量块)'), 主回合.indexOf('const 父亲电话正文基准'));
  assert.doesNotMatch(失败处理, /内置解析待补/, '失败不再挂跨轮待补标记,不留跨轮内存状态');
  assert.match(失败处理, /本轮变量解析失败，数值未更新；可重试本回合/, '两次失败只提示一次本轮结果,不再承诺下一轮自动补');
  assert.match(失败处理, /保留正文与旧变量/, '未配置与失败路径都保留正文,不作废回合');
  assert.match(失败处理, /绝不降级成随AI输出[\s\S]{0,120}不 throw/, '失败链承诺不 throw 作废回合(否则已输出的正文会被 finally 全删)');
});

test('D4 回档/原生删楼/分支切换:定位不到即零删除,不得删当前位置替代消息', () => {
  // 纯函数已覆盖定位不到零删除(A7);这里锁定回档与原生协调不按旧楼号盲删的契约
  assert.match(回档, /标记数据库时间线将变更\(楼层, `回档至\$\{楼层\}楼`\)/);
  assert.match(回档, /内部删除聊天消息\(_\.range\(楼层 \+ 1, 末楼 \+ 1\)\)/);
  assert.match(重掷, /标记数据库时间线将变更\(记录\.回合前末楼, '重掷回合'\)/);
  const 协调块 = engine.slice(engine.indexOf('async function 协调已删时间线'), engine.indexOf('export async function 协调原生时间线切换'));
  assert.match(协调块, /等待数据库时间线就绪\(\)/, '删楼后必须等待数据库时间线就绪');
});

// ── E:自定义输入框是否仍受数据库随楼撤回保护(源契约) ─────────────

test('E1 自定义输入框全链:组件 submit → App 发送/发出 → 玩家行动事件 → 执行回合 创建真实双楼', () => {
  const 回合输入 = readFileSync('src/人妻公寓/界面/客户端/components/回合输入.vue', 'utf8');
  const app = readFileSync('src/人妻公寓/界面/客户端/App.vue', 'utf8');

  // 组件层:纯展示+纯 emit,submit 由 Enter 与发送按钮触发,组件不自发游戏事件
  assert.match(回合输入, /defineEmits<[\s\S]*submit/, '组件必须声明 submit 事件');
  assert.match(回合输入, /@keydown\.enter\.exact\.prevent="emit\('submit'\)"/, 'Enter 发送走 emit(submit)');
  assert.match(回合输入, /@click="emit\('submit'\)"/, '发送按钮走 emit(submit)');
  assert.doesNotMatch(回合输入, /\beventEmit\s*\(/, '组件不得直接调用发游戏事件(注释里提及 eventEmit 不算)');

  // App 层:模板把 submit 绑到 发送,发送 经 发出 发 人妻公寓:玩家行动
  assert.match(app, /@submit="发送"/);
  const 发出函数 = app.slice(app.indexOf('function 发出'), app.indexOf('async function 发送'));
  assert.match(发出函数, /eventEmit\('人妻公寓:玩家行动', 文本\)/, '发出 必须发 人妻公寓:玩家行动 事件');

  // 脚本层:index 监听直达 执行回合,且 执行回合 创建真实消息而非只画游戏卷轴
  const 行动监听 = index.slice(index.indexOf("eventOn('人妻公寓:玩家行动'"), index.indexOf("eventOn('人妻公寓:重掷'"));
  assert.match(行动监听, /执行回合\(行动\.trim\(\)\)/, '客户端 人妻公寓:玩家行动 事件必须直达 执行回合');
  assert.match(主回合, /createChatMessages\(/, '主回合必须创建真实消息而非只画游戏卷轴');
  assert.match(主回合, /role: 'user'/);
  assert.match(主回合, /role: 'assistant'/);
});

test('E2 成功路径在双楼/最终 stat 提交后才广播生成完成事件,且不发 MESSAGE_SENT', () => {
  const 广播函数 = engine.slice(engine.indexOf('async function 广播生成完成事件'), engine.indexOf('async function 记录数据库回合'));
  assert.match(广播函数, /GENERATION_ENDED/, '必须补发正常生成完成事件唤醒数据库插件扫楼');
  assert.match(广播函数, /GENERATION_STARTED/, '先发 STARTED 覆盖可能残留的 quiet 生成记录');
  assert.doesNotMatch(广播函数, /\.emit\([^)]*MESSAGE_SENT/, '刻意不发 MESSAGE_SENT,避免惊醒 MVU 对玩家楼无条件跑一轮=双重记账');
  const 广播调用位置 = 主回合.indexOf('广播生成完成事件(本轮事务仍有效)');
  const 转正标志位置 = 主回合.indexOf('临时用户已转正 = true');
  assert.ok(广播调用位置 > 转正标志位置, '广播必须在双楼转正/最终整表提交之后');
});

test('E3 同步数据库回合禁止普通 insertRow 兜底,只走 SQLite mutation', () => {
  const 同步函数 = 数据库桥.slice(数据库桥.indexOf('export async function 同步数据库回合'), 数据库桥.indexOf('export interface 社交轨迹条目'));
  assert.match(同步函数, /执行SQLite写入\(/, '回合事件只走 SQLite mutation 路径');
  assert.doesNotMatch(同步函数, /insertRow/, '普通行 API 兜底被禁止(回档后旧消息存活会把记录挂错楼)');
  assert.match(同步函数, /return false/, '非 SQLite 模式失败闭合');
});

test('E4 临时失败清理/重掷/回档都是 先标记冻结目标→物理删楼→等待数据库时间线', () => {
  // 主回合 finally 清理窄切片:未转正分支到快照恢复之间,必须 标记→删楼→等待 完整顺序
  const 未转正位置 = 主回合.indexOf('if (!临时用户已转正)');
  const finally清理 = 主回合.slice(未转正位置, 主回合.indexOf('恢复回合变量快照(chat快照)', 未转正位置));
  const 标记1 = finally清理.indexOf('标记数据库时间线将变更');
  const 删楼1 = finally清理.indexOf('内部删除聊天消息');
  const 等待1 = finally清理.indexOf('等待数据库时间线就绪');
  assert.ok(标记1 >= 0 && 标记1 < 删楼1 && 删楼1 < 等待1, '主回合 finally 必须 标记→删楼→等待数据库时间线');

  // 重掷窄切片:从冻结标记到 协调已删时间线 调用之间,必须 标记→删楼,随后经协调等待
  const 重掷起点 = 重掷.indexOf("标记数据库时间线将变更(记录.回合前末楼, '重掷回合')");
  const 重掷切片 = 重掷.slice(重掷起点, 重掷.indexOf('await 协调已删时间线(记录.回合前末楼', 重掷起点));
  const 标记2 = 重掷切片.indexOf('标记数据库时间线将变更');
  const 删楼2 = 重掷切片.indexOf('内部删除聊天消息');
  assert.ok(标记2 >= 0 && 标记2 < 删楼2, '重掷必须 标记→删楼,随后经 协调已删时间线 等待数据库时间线');

  // 回档窄切片:从冻结标记到 协调已删时间线 调用之间,必须 标记→删楼,随后经协调等待
  const 回档起点 = 回档.indexOf('标记数据库时间线将变更(楼层, ');
  const 回档切片 = 回档.slice(回档起点, 回档.indexOf('await 协调已删时间线(', 回档起点));
  const 标记3 = 回档切片.indexOf('标记数据库时间线将变更');
  const 删楼3 = 回档切片.indexOf('内部删除聊天消息');
  assert.ok(标记3 >= 0 && 标记3 < 删楼3, '回档必须 标记→删楼,随后经 协调已删时间线 等待数据库时间线');

  // 等待数据库时间线就绪 在 协调已删时间线 定义内(三条路径共用该收口)
  const 协调块 = engine.slice(engine.indexOf('async function 协调已删时间线'), engine.indexOf('export async function 协调原生时间线切换'));
  assert.match(协调块, /等待数据库时间线就绪\(\)/, '删楼后必须经协调函数等待数据库时间线就绪');
});

test('E5 数据库桥对宿主 MESSAGE_DELETED/MESSAGE_SWIPED 的独立监听仍存在', () => {
  assert.match(数据库桥, /eventOn\(tavern_events\.MESSAGE_DELETED/, '删除消息的独立监听必须在');
  assert.match(数据库桥, /eventOn\(tavern_events\.MESSAGE_SWIPED/, '滑动消息的独立监听必须在');
  assert.match(数据库桥, /eventOn\(tavern_events\.CHAT_CHANGED/);
  assert.match(数据库桥, /接入宿主时间线事件\(\)/, '模块顶层必须接线,不能被游戏逻辑的内部删楼租约监听消费掉');
});

test('E6 栅栏拒绝任何四表中楼层超过冻结目标的旧快照', () => {
  const 四表快照 = 楼层数 => ({
    sheet_events: { name: 'RQ_剧情事件', content: [['row_id', '楼层', '内容'], [1, 楼层数, 'A']] },
    sheet_memory: { name: 'RQ_人物长期记忆', content: [['row_id', '最后楼层', '内容'], [1, 楼层数, 'A']] },
    sheet_promises: { name: 'RQ_承诺与伏笔', content: [['row_id', '最后楼层', '内容'], [1, 楼层数, 'A']] },
    sheet_social: { name: 'RQ_社交轨迹', content: [['row_id', '最后楼层', '内容'], [1, 楼层数, 'A']] },
  });
  assert.equal(数据库快照未越过楼层(四表快照(10), 10), true);
  assert.equal(数据库快照未越过楼层(四表快照(11), 10), false, '事件表越界必须拒绝');
  assert.equal(数据库快照未越过楼层(四表快照(10), null), true);
});
