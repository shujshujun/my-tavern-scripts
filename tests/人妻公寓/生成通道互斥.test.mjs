/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// A 组：纯租约动态行为，直接动态单测纯进程内状态机。
import {
  取得前台生成租约,
  取得手机生成租约,
  前台生成租约持有中,
  手机生成租约持有中,
  清空生成租约,
} from '../../src/人妻公寓/脚本/游戏逻辑/生成通道互斥.ts';

const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 入口源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 生成引擎源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts', import.meta.url),
  'utf8',
);
const 交互源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts', import.meta.url),
  'utf8',
);
const 会话瞬态源码 = readFileSync(
  new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/壳/会话瞬态.ts', import.meta.url),
  'utf8',
);

test('A1 空闲时前台可取得；前台占用时手机取得失败；前台释放后手机可取得', () => {
  清空生成租约();
  assert.equal(前台生成租约持有中(), false);
  assert.equal(手机生成租约持有中(), false);
  const 前台 = 取得前台生成租约();
  assert.ok(前台);
  assert.equal(前台生成租约持有中(), true);
  assert.equal(取得手机生成租约(), null, '前台占用时手机取得必须失败');
  assert.equal(手机生成租约持有中(), false);
  前台.释放();
  assert.equal(前台生成租约持有中(), false);
  const 手机 = 取得手机生成租约();
  assert.ok(手机, '前台释放后手机才可取得');
  手机.释放();
});

test('A2 手机租约可嵌套/计数；任一内层释放后只要仍有手机租约前台仍失败；全部释放后前台才成功', () => {
  清空生成租约();
  const 外层 = 取得手机生成租约();
  assert.ok(外层);
  const 内层 = 取得手机生成租约();
  assert.ok(内层, '手机租约应可嵌套（手动批次外层 + 小生成内层）');
  assert.equal(手机生成租约持有中(), true);
  assert.equal(取得前台生成租约(), null, '手机占用时前台必须失败');
  内层.释放();
  assert.equal(手机生成租约持有中(), true, '还有外层租约时手机仍在途');
  assert.equal(取得前台生成租约(), null, '任一内层释放后只要仍有手机租约，前台仍失败');
  外层.释放();
  assert.equal(手机生成租约持有中(), false);
  const 前台 = 取得前台生成租约();
  assert.ok(前台, '全部释放后前台才成功');
  前台.释放();
});

test('A3 手机占用时前台取得失败；前台租约至多一个', () => {
  清空生成租约();
  const 手机 = 取得手机生成租约();
  assert.ok(手机);
  assert.equal(取得前台生成租约(), null);
  手机.释放();

  const 前台一 = 取得前台生成租约();
  assert.ok(前台一);
  assert.equal(取得前台生成租约(), null, '前台租约至多一个');
  前台一.释放();
});

test('A4 release 幂等，重复释放不把别人的计数减掉，不得出现负数', () => {
  清空生成租约();
  const 手机甲 = 取得手机生成租约();
  const 手机乙 = 取得手机生成租约();
  assert.ok(手机甲 && 手机乙);
  手机甲.释放();
  手机甲.释放(); // 重复释放必须是无害 no-op
  assert.equal(手机生成租约持有中(), true, '重复释放不得把别人(乙)的租约一起清掉');
  手机乙.释放();
  assert.equal(手机生成租约持有中(), false);

  const 前台 = 取得前台生成租约();
  assert.ok(前台);
  前台.释放();
  前台.释放(); // 前台重复释放同样是 no-op
  assert.equal(前台生成租约持有中(), false);
  const 再取 = 取得前台生成租约();
  assert.ok(再取, '重复释放前台后应能再次取得');
  再取.释放();
});

test('A5 失败取得不得返回可释放的真租约', () => {
  清空生成租约();
  const 前台 = 取得前台生成租约();
  assert.ok(前台);
  const 失败手机 = 取得手机生成租约();
  assert.equal(失败手机, null);
  // 失败手机不应影响前台；释放前台后手机可正常取得。
  前台.释放();
  const 手机 = 取得手机生成租约();
  assert.ok(手机);
  手机.释放();
});

test('B1 执行回合在回合锁/任何真实 await 之前同步取得前台租约，并保留既有手机门', () => {
  // 先剥离注释再定位可执行语句：注释里的“任何 await”文本不得被当成真实 await 误命中。
  const 剥离注释 = 源 => 源.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const 无注释 = 剥离注释(回合源码);
  const 函数起 = 无注释.indexOf('export async function 执行回合');
  const 获租约 = 无注释.indexOf('取得前台生成租约()', 函数起);
  const 回合锁 = 无注释.indexOf('进行中 = true;', 函数起);
  assert.ok(获租约 >= 0 && 回合锁 > 获租约, '前台租约必须同步先于回合锁取得');
  const 首个await = 无注释.indexOf('await ', 函数起);
  assert.ok(首个await === -1 || 获租约 < 首个await, '前台租约取得必须早于任何真实 await');
  // 保留既有门：数据库租约之外，手机节拍/手机在途仍是启动前的碰撞门。
  const 原函数起 = 回合源码.indexOf('export async function 执行回合');
  const 原回合锁 = 回合源码.indexOf('进行中 = true;', 原函数起);
  assert.match(回合源码.slice(原函数起, 原回合锁), /手机节拍进行中\(\) \|\| 手机AI生成中\(\)/);
  assert.match(回合源码.slice(原函数起, 原回合锁), /手机后台消息正在生成/);
});

test('B1b 主行动命中已有回合或时间线协调时必须广播失败，不能只返回 false 闩死客户端', () => {
  const 回合入口 = 回合源码.slice(
    回合源码.indexOf('export async function 执行回合'),
    回合源码.indexOf('// 普通购买、送礼、调查', 回合源码.indexOf('export async function 执行回合')),
  );
  assert.match(回合入口, /if \(回合进行中\(\)\)/);
  assert.match(
    回合入口,
    /释放预占租约\(\);\s*eventEmit\('人妻公寓:回合失败',[^)]*\);\s*return false;/,
    '客户端发出行动前已乐观置发送中，任何忙态拒绝都必须回失败事件解锁',
  );
});

test('B2 前台租约取得失败发回合失败并返回 false，不建临时楼', () => {
  const 回合入口 = 回合源码.slice(
    回合源码.indexOf('export async function 执行回合'),
    回合源码.indexOf('const 回合时间线世代'),
  );
  const 获租约 = 回合入口.indexOf('取得前台生成租约()');
  assert.ok(获租约 >= 0);
  const 失败路径 = 回合入口.slice(获租约);
  assert.match(失败路径, /if \(!前台租约\)/);
  assert.match(失败路径, /eventEmit\('人妻公寓:回合失败'/);
  assert.match(失败路径, /return false/);
  // 失败路径发生在任何临时楼/ await 之前：回合时间线世代之前的切片内不应出现 生成开始。
  const 事件开始 = 回合入口.indexOf("eventEmit('人妻公寓:生成开始'");
  assert.equal(事件开始, -1, '前台租约失败路径发生在建临时楼/生成开始之前');
});

test('B3 前台租约随主 finally 在临时楼/变量回滚完成后释放，且早于最终回合失败广播', () => {
  const 主收口 = 回合源码.slice(
    回合源码.indexOf('export async function 执行回合'),
    回合源码.indexOf('export async function 重掷回合'),
  );
  const 临时楼清理 = 主收口.indexOf('定位本轮临时楼');
  const 变量回滚 = 主收口.indexOf('恢复回合变量快照', 临时楼清理);
  const 事务结束 = 主收口.indexOf('标记回合事务结束();', 变量回滚);
  const 释放租约 = 主收口.indexOf('前台租约.释放()', 事务结束);
  const 失败广播 = 主收口.lastIndexOf("eventEmit('人妻公寓:回合失败'");
  assert.ok(
    临时楼清理 >= 0 && 变量回滚 > 临时楼清理 && 事务结束 > 变量回滚 && 释放租约 > 事务结束,
    '前台租约必须随主 finally 在所有临时楼/变量回滚/回合事务标记之后释放',
  );
  // 失败广播必须在释放之后：监听器若同步重试，会先看到共享槽已空闲；监听器抛错也不阻塞释放。
  assert.ok(失败广播 > 释放租约, '最终回合失败广播必须在前台租约释放之后发出');
});

test('B4 即时演出先预占前台租约再调用业务结算；翻垃圾以惰性函数接线且空手不生成', () => {
  const 即时起 = 入口源码.indexOf('async function 即时开演');
  const 即时止 = 入口源码.indexOf('async function 运行荣耀洞隔离拍', 即时起);
  const 即时入口 = 入口源码.slice(即时起, 即时止);
  const 预占租约 = 即时入口.indexOf('取得前台生成租约()');
  const 业务结算 = 即时入口.indexOf('await 结算()');
  assert.ok(即时起 >= 0 && 即时止 > 即时起, '必须能定位共享即时演出入口');
  assert.ok(预占租约 >= 0 && 业务结算 > 预占租约, '共享入口必须在任何业务副作用前预占前台槽');
  assert.match(即时入口.slice(预占租约, 业务结算), /if \(!前台租约\)[\s\S]*return;/);
  assert.match(即时入口, /预占前台生成租约: 前台租约/);
  assert.match(
    即时入口,
    /let 租约已移交 = false;[\s\S]*try \{[\s\S]*await 结算\(\)[\s\S]*finally \{[\s\S]*if \(!租约已移交\) 前台租约\.释放\(\)/,
    '纯脚本结果与结算异常也必须释放预占租约',
  );

  const 事件起 = 入口源码.indexOf("eventOn('人妻公寓:翻垃圾'");
  const 事件止 = 入口源码.indexOf("eventOn('人妻公寓:开启阶段性癖'", 事件起);
  const 翻垃圾入口 = 入口源码.slice(事件起, 事件止);
  assert.ok(事件起 >= 0 && 事件止 > 事件起, '必须能定位翻垃圾入口');
  assert.match(翻垃圾入口, /即时开演\(\s*\(\) =>\s*接入线路\(翻垃圾\(data/);
  assert.match(翻垃圾入口, /结果 => Boolean\(结果\.事件\)/, '空手/零钱仍只落库提示，不白跑正文生成');

  const 回合入口 = 回合源码.slice(
    回合源码.indexOf('export async function 执行回合'),
    回合源码.indexOf('const 回合时间线世代'),
  );
  assert.match(回合入口, /预占前台生成租约\?: 生成通道租约/);
  assert.match(回合入口, /选项\.预占前台生成租约\s*\?\?\s*取得前台生成租约\(\)/);
});

test('B5 普通业务写与正文启动双向互斥，生成中商店和背包不能留下可点击入口', () => {
  const 安全操作起 = 入口源码.indexOf('function 安全操作(');
  const 安全操作止 = 入口源码.indexOf('/**\n   * 当面交互的脚本终审', 安全操作起);
  const 安全操作源码 = 入口源码.slice(安全操作起, 安全操作止);
  const 入队位 = 安全操作源码.indexOf('return 排队MVU操作');
  const 回合忙门 = 安全操作源码.indexOf('回合进行中()');
  const 前台忙门 = 安全操作源码.indexOf('前台生成租约持有中()');
  assert.ok(安全操作起 >= 0 && 安全操作止 > 安全操作起, '必须能定位普通业务操作壳');
  assert.ok(
    回合忙门 >= 0 && 前台忙门 >= 0 && Math.max(回合忙门, 前台忙门) < 入队位,
    '正文、重掷准备或变量重生成已经开始时，普通业务必须在入队前失败关闭',
  );
  assert.match(
    安全操作源码.slice(Math.min(回合忙门, 前台忙门), 入队位),
    /本次操作没有发生|正文正在生成|剧情正在生成|内容正在生成/,
  );

  const 回合入口 = 回合源码.slice(
    回合源码.indexOf('export async function 执行回合'),
    回合源码.indexOf('const 回合时间线世代'),
  );
  const MVU忙门 = 回合入口.indexOf('MVU操作进行中()');
  const 前台租约 = 回合入口.indexOf('取得前台生成租约()');
  assert.ok(MVU忙门 >= 0 && MVU忙门 < 前台租约, '已有普通业务入队时，正文必须在取得前台槽前拒绝抢跑');
  assert.match(回合入口, /!选项\.已持MVU操作租约[\s\S]*MVU操作进行中\(\)/, '安全操作内部移交的生成允许复用已持 MVU 租约');

  const 重生成入口 = 回合源码.slice(
    回合源码.indexOf('export async function 重新生成最近回合变量'),
    回合源码.indexOf('const 时间线世代', 回合源码.indexOf('export async function 重新生成最近回合变量')),
  );
  assert.ok(
    重生成入口.indexOf('MVU操作进行中()') >= 0 &&
      重生成入口.indexOf('MVU操作进行中()') < 重生成入口.indexOf('取得前台生成租约()'),
    '变量重生成也必须在取得前台槽前拒绝已有普通业务事务',
  );

  const dock起 = 客户端源码.indexOf('<nav v-if="!录像带中 && !前台硬决策中" class="dock"');
  const dock止 = 客户端源码.indexOf('</nav>', dock起);
  const dock源码 = 客户端源码.slice(dock起, dock止);
  const 商店按钮 = dock源码.slice(dock源码.indexOf('<span>商店</span>') - 700, dock源码.indexOf('<span>商店</span>') + 100);
  const 背包按钮 = dock源码.slice(dock源码.indexOf('<span>背包</span>') - 500, dock源码.indexOf('<span>背包</span>') + 100);
  assert.match(商店按钮, /:disabled="[^"]*发送中/, '正文生成中商店入口必须禁用');
  assert.match(背包按钮, /:disabled="[^"]*发送中/, '正文生成中背包入口必须禁用');
});

test('B6 等待生产在时间与孩子硬结算前预占前台槽，失败前不半结算，移交后由执行回合收口', () => {
  const 生产起 = 入口源码.indexOf("eventOn('人妻公寓:生产动作'");
  const 生产止 = 入口源码.indexOf("eventOn('人妻公寓:同步家庭计划微信已读'", 生产起);
  const 生产入口 = 入口源码.slice(生产起, 生产止);
  const 等待起 = 生产入口.indexOf("if (动作 === '等待生产')");
  const 等待止 = 生产入口.indexOf('const 胎次 =', 等待起);
  const 等待生产 = 生产入口.slice(等待起, 等待止);
  assert.ok(生产起 >= 0 && 生产止 > 生产起 && 等待起 >= 0 && 等待止 > 等待起, '必须能定位等待生产入口');

  const 数据库忙 = 等待生产.indexOf('全局数据库AI租约.在结算()');
  const 手机节拍忙 = 等待生产.indexOf('手机节拍进行中()');
  const 手机AI忙 = 等待生产.indexOf('手机AI生成中()');
  const 预占 = 等待生产.indexOf('取得前台生成租约()');
  const 硬结算 = 等待生产.indexOf('执行等待生产事务(data');
  assert.ok(数据库忙 >= 0 && 手机节拍忙 > 数据库忙 && 手机AI忙 > 手机节拍忙, '三类后台生成忙门必须齐全');
  assert.ok(预占 > 手机AI忙 && 硬结算 > 预占, '共享前台槽必须先于时间与孩子硬结算取得');
  assert.match(等待生产.slice(0, 硬结算), /if \(!前台租约\)[\s\S]*return;/);
  assert.match(等待生产, /预占前台生成租约: 前台租约/);
  assert.match(
    等待生产,
    /let 租约已移交 = false;[\s\S]*try \{[\s\S]*执行等待生产事务\(data[\s\S]*租约已移交 = true;[\s\S]*执行回合\([\s\S]*finally \{[\s\S]*if \(!租约已移交\) 前台租约\.释放\(\)/,
    '事务失败或硬写失败由入口释放，进入正文后统一移交执行回合',
  );
  assert.match(等待生产, /生产硬结算已经保存；可在医院用“继续生产剧情”重试文案/);
});

test('C1 小生成在任意 AI 路由/await 之前取得手机租约；前台占用时返回空串且不调用三路生成', () => {
  const 手机小生成 = 生成引擎源码.slice(
    生成引擎源码.indexOf('export async function 小生成'),
    生成引擎源码.indexOf('export async function 微信短文本'),
  );
  const 获租约 = 手机小生成.indexOf('取得手机生成租约()');
  assert.ok(获租约 >= 0, '小生成必须取得共享手机租约');
  const 拒绝 = 手机小生成.indexOf("if (!租约) return '';", 获租约);
  assert.ok(拒绝 > 获租约, '前台占用时小生成直接返回空串');
  for (const 路由 of ['正文API生成(', '自定义API生成(', '通过数据库生成(']) {
    assert.ok(手机小生成.indexOf(路由, 获租约) > 获租约, `${路由} 必须发生在租约取得之后`);
  }
  const 首个await = 手机小生成.indexOf('await ', 获租约);
  assert.ok(首个await === -1 || 获租约 < 首个await, '手机租约取得必须早于任何 await');
  const finally位 = 手机小生成.lastIndexOf('finally');
  const 释放位 = 手机小生成.indexOf('租约.释放()', finally位);
  assert.ok(释放位 > finally位, '所有返回/异常路径都随 finally 幂等释放手机租约');
});

test('C2 手机AI生成中() 反映共享手机租约（含手动等待批次），不保留第二份独立计数真值', () => {
  assert.match(生成引擎源码, /export function 手机AI生成中\(\): boolean \{\s*return 手机生成租约持有中\(\);\s*\}/);
  assert.doesNotMatch(生成引擎源码, /手机AI生成计数/, '不得保留第二份独立计数真值');
  assert.match(
    生成引擎源码,
    /import \{[\s\S]*取得手机生成租约,[\s\S]*手机生成租约持有中[\s\S]*\} from '\.\.\/生成通道互斥';/,
  );
});

test('D1 新建会话待回复上下文前同步取得手机租约；前台占用时在玩家消息写库前拒绝并给可见提示', () => {
  const 发送段 = 交互源码.slice(
    交互源码.indexOf('async function 发消息('),
    交互源码.indexOf('async function 执行待回复批次('),
  );
  const 新上下文位 = 发送段.indexOf('if (!上下文) {');
  assert.ok(新上下文位 >= 0);
  const 获租约 = 发送段.indexOf('取得手机生成租约()', 新上下文位);
  assert.ok(获租约 > 新上下文位, '只有新建上下文才取得手机租约');
  // 同一批次后续追加复用原上下文/原租约：复用分支不得再次取得。
  assert.doesNotMatch(发送段.slice(0, 新上下文位), /取得手机生成租约/);
  // 前台占用时在任何玩家消息写库前同步拒绝并给可见提示。
  const 拒绝位 = 发送段.indexOf('if (!生成租约) {', 获租约);
  const 提示位 = 发送段.indexOf('eventEmit', 拒绝位);
  const 返回位 = 发送段.indexOf('return;', 提示位);
  const 首次写库 = 发送段.indexOf('await 写库增量');
  assert.ok(
    拒绝位 > 获租约 && 提示位 > 拒绝位 && 返回位 > 提示位 && 首次写库 > 返回位,
    '前台占用时必须在任何玩家消息写库前同步拒绝并给可见提示',
  );
  // 上下文登记在租约取得之后、写库之前。
  const 登记位 = 发送段.indexOf('登记会话待回复(上下文)', 获租约);
  assert.ok(登记位 > 获租约 && 首次写库 > 登记位);
});

test('D2 释放会话待回复 是手机批次租约的唯一释放所有者，幂等释放生成租约', () => {
  const 释放段 = 会话瞬态源码.slice(
    会话瞬态源码.indexOf('export function 释放会话待回复('),
    会话瞬态源码.indexOf('type 批次执行器'),
  );
  assert.match(
    释放段,
    /if \(!上下文\.已释放\)[\s\S]*结束会话输入\(上下文\.输入租约\)[\s\S]*上下文\.生成租约\?\.释放\(\)[\s\S]*会话待回复\.delete\(键\)/,
  );
  // 会话待回复上下文 显式携带生成租约字段。
  assert.match(会话瞬态源码, /生成租约\?: 生成通道租约/);
});

test('D3 开始会话输入或上下文登记前发生同步异常时，刚取得的手机租约也必须释放', () => {
  const 发送段 = 交互源码.slice(
    交互源码.indexOf('async function 发消息('),
    交互源码.indexOf('async function 执行待回复批次('),
  );
  const 获租约 = 发送段.indexOf('取得手机生成租约()');
  const 登记位 = 发送段.indexOf('登记会话待回复(上下文)', 获租约);
  assert.ok(获租约 >= 0 && 登记位 > 获租约);
  // 从取得租约到上下文登记后的收口（含 catch 释放）整段校验。
  const 包裹 = 发送段.slice(获租约, 发送段.indexOf('上下文.发送租约 = 发送租约;', 获租约));
  const try位 = 包裹.indexOf('try {');
  const catch位 = 包裹.indexOf('catch (e) {');
  const 释放位 = 包裹.indexOf('生成租约.释放();');
  assert.ok(try位 >= 0 && catch位 > try位 && 释放位 > catch位, '上下文登记前的同步异常必须释放刚取得的手机租约');
});
