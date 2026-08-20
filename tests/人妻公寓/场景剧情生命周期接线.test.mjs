/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const 读 = path => readFileSync(path, 'utf8');
const schema = 读('src/人妻公寓/schema.ts');
const schemaJson = JSON.parse(读('src/人妻公寓/schema.json'));
const initvar = 读('src/人妻公寓/世界书/变量/initvar.yaml');
const index = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
const engine = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const snapshot = 读('src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const app = 读('src/人妻公寓/界面/客户端/App.vue');
const phone = 读('src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts');
const phoneBeat = 读('src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts');
const phoneCold = 读('src/人妻公寓/脚本/游戏逻辑/手机/冷落预警.ts');
const phoneInteraction = 读('src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts');
const husband = 读('src/人妻公寓/脚本/游戏逻辑/丈夫登门系统.ts');
const moveIn = 读('src/人妻公寓/脚本/游戏逻辑/入住系统.ts');
const mvuIO = 读('src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
const economy = 读('src/人妻公寓/脚本/游戏逻辑/经济系统.ts');
const special = 读('src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts');

function 递归文件(dir) {
  return readdirSync(dir).flatMap(name => {
    const full = `${dir}/${name}`;
    return statSync(full).isDirectory() ? 递归文件(full) : [full];
  });
}

function 段(source, startText, endText) {
  const start = source.indexOf(startText);
  assert.ok(start >= 0, `缺少开始标记：${startText}`);
  const end = source.indexOf(endText, start + startText.length);
  assert.ok(end > start, `缺少结束标记：${endText}`);
  return source.slice(start, end);
}

function 载入手机生成行为(data, 当前场景 = '垃圾房') {
  const js = ts.transpileModule(phone, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  let 请求数 = 0;
  const 提示 = [];
  const stubs = {
    './运行时上下文': { 当前手机数据: () => data },
    '../../../stageConfig': { 户静态表: {} },
    './配置': { 读配置: () => ({ ai来源: '正文', base: '', key: '', model: '' }) },
    './数据层': {
      验收短文本: value => value,
      手机可见单条硬上限: 150,
      玩家名: () => '测试玩家',
    },
    '../数据库桥': { 数据库状态: () => ({ 可调用AI: false }), 通过数据库生成: async () => '' },
    '../数据库AI租约': { 全局数据库AI租约: { 在结算: () => false } },
    '../预设输出兼容': { 清洗预设输出: value => ({ 文本: String(value ?? '') }) },
    '../手机输出安全': { 验收群聊隐私: value => value },
    '../手机生成完整性': {
      手机回复封套未闭合: () => false,
      手机回复封套状态: value => (/<回复>[\s\S]*<\/回复>/i.test(String(value ?? '')) ? '完整' : '空'),
    },
    '../手机群聊格式': { 汉字数: value => String(value ?? '').length, 解析微信群消息: () => [] },
    './内容素材表': { 攻略动态方向: () => '' },
    '../生成通道互斥': {
      取得手机生成租约: () => ({ 释放() {} }),
      手机生成租约持有中: () => false,
    },
    '../场景剧情事务': {
      读取活动场景剧情: value => (value?.系统?._场景剧情事务?.id ? value.系统._场景剧情事务 : null),
      读取队首场景剧情: () => null,
      等待场景剧情阻塞当前场景: () => false,
    },
  };
  const module = { exports: {} };
  const require = id => {
    assert.ok(id in stubs, `手机生成行为桩缺少依赖：${id}`);
    return stubs[id];
  };
  Function(
    'module',
    'exports',
    'require',
    '_',
    'getVariables',
    'eventEmit',
    'generateRaw',
    'formatAsTavernRegexedString',
    js,
  )(
    module,
    module.exports,
    require,
    {
      get(value, path) {
        return path.split('.').reduce((current, key) => current?.[key], value);
      },
    },
    () => ({ _场景: { 房间id: 当前场景 } }),
    (_name, text) => 提示.push(String(text ?? '')),
    async () => {
      请求数 += 1;
      return '<回复>父亲继续把这通电话说完</回复>';
    },
    value => String(value ?? ''),
  );
  return { api: module.exports, 请求数: () => 请求数, 提示 };
}

test('Schema、schema.json 与初始变量只有一套活动场景事务', () => {
  assert.match(schema, /_场景剧情序号:\s*nonNegInt\(0\)/);
  assert.match(schema, /_场景剧情事务:[\s\S]*目标场景:[\s\S]*内容:[\s\S]*请求世代:[\s\S]*状态:/);
  assert.doesNotMatch(schema, /_场景剧情:\s*z/);
  assert.match(initvar, /_场景剧情序号: 0/);
  assert.match(initvar, /_场景剧情事务: \{ id: "", 标题: "", 目标场景:/);
  assert.doesNotMatch(initvar, /_场景剧情: \{ 活动:/);

  const props = schemaJson.properties?.系统?.properties ?? {};
  assert.ok(props._场景剧情序号);
  assert.ok(props._场景剧情事务?.properties?.目标场景);
  assert.ok(props._场景剧情事务?.properties?.请求世代);
  assert.equal(props._场景剧情, undefined);
});

test('即时业务严格按“通道→结算→建票→持久化→正文”顺序执行', () => {
  const body = 段(index, 'async function 即时开演', 'async function 到场触发场景剧情');
  const lease = body.indexOf('取得前台生成租约()');
  const settle = body.indexOf('const 结果 = await 结算()');
  const activate = body.indexOf('激活新增场景剧情');
  const persist = body.indexOf('await 落地');
  const generate = body.indexOf('await 执行回合');
  assert.ok(lease >= 0 && settle > lease && activate > settle && persist > activate && generate > persist);
  assert.match(body, /预占前台生成租约/);
  assert.match(body, /const 起始等待队列 = data\.系统\._待发送事件/);
  assert.match(body, /data\.系统\._待发送事件 = 起始等待队列/);
  assert.match(body, /起始等待项\.length && !候选保留前缀/);
  assert.match(body, /候选结果已放弃，没有写回/);
  assert.match(body, /绝不能清掉旧剧情/);
  assert.match(body, /场景剧情事务ID/);
  assert.match(body, /场景剧情请求世代/);
});

test('翻垃圾、送礼、读信、晋阶与可能暴露的偷窃都接入即时场景事务', () => {
  for (const name of ['翻垃圾', '送礼', '读信', '请求晋阶', '空房偷窃']) {
    const start = index.indexOf(`eventOn('人妻公寓:${name}'`);
    assert.ok(start >= 0, `缺少${name}入口`);
    assert.match(index.slice(start, start + 2600), /即时开演\(/, `${name}没有接入即时场景事务`);
  }
});

test('空房偷窃的聊天冷却只在核心结果确认后提交，生成失败可原地重试且不重复结算', () => {
  const theft = economy.slice(economy.indexOf('export function 空房偷窃'));
  const deferred = theft.slice(
    theft.indexOf('const 完成偷窃'),
    theft.indexOf("if (seededRandom(现钟, 门牌号, '偷窃')"),
  );
  assert.match(deferred, /提交后: async/);
  assert.match(deferred, /写计数\(c\)/);
  assert.match(deferred, /await 结果\.提交后\?\.\(\)/);
  assert.doesNotMatch(theft.slice(0, theft.indexOf('const 完成偷窃')), /写计数\(c\)/);

  const entry = 段(index, "eventOn('人妻公寓:空房偷窃'", "eventOn('人妻公寓:使用运作'");
  assert.match(entry, /即时开演\(/);
  assert.match(entry, /\(\) => 空房偷窃\(data, 门牌号, 当前楼层\(\)\)/);
  assert.match(entry, /场景: 门牌号/);
  assert.doesNotMatch(entry, /落地\(空房偷窃/);
});

test('到场激活与睡前丈夫登门都在改变业务前取得前台租约', () => {
  const arrival = 段(index, 'async function 到场触发场景剧情', 'async function 运行荣耀洞隔离拍');
  assert.ok(arrival.indexOf('取得前台生成租约()') < arrival.indexOf('激活队首场景剧情'));
  assert.ok(arrival.indexOf('激活队首场景剧情') < arrival.indexOf('await 脚本写入'));
  assert.match(arrival, /到场检查期间玩家已经离开/);
  assert.match(arrival, /当前场景已锁定/);

  const time = 段(index, 'function 处理时间推进', 'function 处理撤销时间推进');
  const visit = time.indexOf('读取待触发丈夫登门(data)');
  const immediate = time.indexOf('await 即时开演(', visit);
  const visitSettle = time.indexOf('准备睡前丈夫登门(', visit);
  assert.ok(visit >= 0 && immediate > visit && visitSettle > immediate);
  assert.doesNotMatch(time.slice(visit, immediate), /准备睡前丈夫登门\(/);
});

test('取消、swipe 与切聊天后的旧失败收口不跨时间线改写新分支', () => {
  const immediate = 段(index, 'async function 即时开演', 'async function 到场触发场景剧情');
  assert.match(immediate, /const 即时操作世代 = 当前时间线切换世代\(\)/);
  assert.match(immediate, /const 即时操作聊天ID = 当前聊天ID\(\)/);
  assert.match(immediate, /即时操作世代 === 当前时间线切换世代\(\)/);
  assert.match(immediate, /即时操作聊天ID === 当前聊天ID\(\)/);
  assert.match(immediate, /持久标记场景剧情待重试\([\s\S]{0,220}即时操作仍有效/);

  const arrival = 段(index, 'async function 到场触发场景剧情', 'async function 运行荣耀洞隔离拍');
  assert.match(arrival, /操作仍有效: \(\) => boolean = \(\) => true/);
  assert.match(arrival, /持久标记场景剧情待重试\([\s\S]{0,220}操作仍有效/);
  assert.match(index, /到场触发场景剧情\(raw, data, String\(场景 \|\| '楼道'\), 操作仍有效\)/);
  assert.match(index, /eventOn\('人妻公寓:取消生成'[\s\S]{0,180}取消本回合\(\)/);
  assert.match(engine, /消息分支已经变化，本轮旧操作未提交/);
});

test('父亲通话与时间推进遵守同一场景事务边界', () => {
  const time = 读('src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
  assert.match(index, /父亲电话仍未结束。请先完成并挂断这通电话，本次业务尚未发生/);
  assert.match(index, /父亲电话仍未结束。当前剧情保持等待，请先完成并挂断电话/);
  assert.match(time, /取阻塞时间的待发送事件\(data\.系统\._待发送事件\)/);
  assert.match(
    time,
    /function 场景剧情阻塞当前时间动作\(data: SchemaType, 当前地点: string\)[\s\S]{0,260}读取活动场景剧情\(data\)[\s\S]{0,260}等待场景剧情阻塞当前场景\(读取队首场景剧情\(data\.系统\._待发送事件\), 当前地点\)/,
    '活动事务全局阻塞；等待票只在同场或未知地点时阻塞当前时间动作',
  );
  assert.match(time, /场景剧情阻塞当前时间动作\(data, 请求\.当前地点\)/);
  assert.match(time, /还有尚未完成的强制事件/);
});

test('回合提交校验场景、事务 ID 与请求世代，失败后保留票据', () => {
  assert.match(engine, /校验场景剧情位置/);
  assert.match(engine, /场景剧情事务ID\?: string/);
  assert.match(engine, /场景剧情请求世代\?: number/);
  assert.match(engine, /提交场景剧情成功/);
  assert.match(engine, /正文生成期间玩家场景已经变化，本轮不会把剧情和结算写到另一个地点/);
  assert.match(engine, /生成期间场景已经变化，本轮正文不会在错误地点提交/);
  assert.match(index, /原生正文生成期间玩家场景已经变化/);
  assert.match(engine, /回合基准data = _\.cloneDeep\(data\)/);
  assert.match(index, /持久标记场景剧情待重试/);
});

test('场景剧情重掷先取得共享生成租约，再增加请求世代；失败仍回到待重试', () => {
  const reroll = 段(engine, 'export async function 重掷回合', 'export async function 回档至');
  const active = reroll.indexOf('if (恢复后 && 活动剧情)');
  const lease = reroll.indexOf('取得前台生成租约()', active);
  const prepare = reroll.indexOf('准备重试场景剧情(', active);
  const generate = reroll.indexOf('await 执行回合(', prepare);
  assert.ok(active >= 0 && lease > active && prepare > lease && generate > prepare);
  assert.match(reroll, /标记场景剧情待重试\([\s\S]{0,160}重试\.事务\.请求世代/);
  assert.match(reroll, /预占前台生成租约: 前台租约/);
});

test('远处等待票不注入当前互动；新本地硬剧情可排到远处等待票之前', () => {
  assert.match(snapshot, /const 队首剧情 = 读取队首场景剧情\(待发送快照\)/);
  assert.match(snapshot, /场景剧情目标匹配\(队首剧情\.目标场景, 当前场景\)/);
  assert.match(snapshot, /\? 队首剧情\.内容\s*:\s*''/);
  const transaction = 读('src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
  assert.match(transaction, /当前回合刚产生的本地硬剧情不能被它长期饿死/);
  assert.match(transaction, /\.\.\.localTail, \.\.\.before/);
});

test('无关脚本写不会把旧档未知 pending 猜成玩家当前房间', () => {
  assert.match(mvuIO, /绝不能因一次无关脚本写[\s\S]{0,180}旧档未知地点/);
  assert.match(mvuIO, /if \(!待发送 \|\| 已有活动票\)/);
  assert.doesNotMatch(mvuIO, /if \(!待发送 \|\| 已有结构票 \|\| 有显式场景\)/);
});

test('当前版本入住预约在合法公共场景创建时就冻结目标，只有旧档才需要重新检查地点', () => {
  assert.match(moveIn, /追加等待场景剧情\(data, 事件, 目标场景/);
  assert.match(moveIn, /const 目标场景 = 读场景\(\)\.房间id \?\? ''/);
  assert.doesNotMatch(moveIn, /data\.系统\._待发送事件\s*=\s*\n?\s*`\$\{事件角色标记/);
  assert.match(index, /是入住等待 && head\.目标场景 === null/);
});

test('丈夫登门下一拍追加为同场景等待票，不覆盖当前提交票', () => {
  assert.match(husband, /追加等待场景剧情\(data, 事件, 目标场景, '丈夫登门', true\)/);
  const progress = husband.slice(husband.indexOf('export function 推进丈夫登门'));
  assert.doesNotMatch(progress, /data\.系统\._待发送事件\s*=\s*事件/);
});

test('客户端显示持久锁场与专用入口：活动票硬锁，未激活等待票离开前明确确认且不改演', () => {
  assert.match(app, /v-if="场景剧情状态"/);
  assert.match(app, /开始本段剧情/);
  assert.match(app, /重试本段剧情/);
  assert.match(app, /v-if="场景剧情旧档入住等待"/);
  assert.match(app, /场景剧情旧档入住等待[\s\S]{0,180}目标场景 === null/);
  assert.match(app, /现在离开只会让它留在原地等待，不会改到新地点演出/);
  assert.match(app, /async function 进入[\s\S]{0,1500}场景剧情活动\.value/);
  assert.match(app, /async function 离开房间[\s\S]{0,900}确认离开等待场景剧情/);
  const movementLock = 段(app, 'const 普通场景剧情移动锁', 'const 场景剧情锁定');
  assert.match(movementLock, /场景剧情活动\.value && 场景剧情在目标地点\.value/);
  assert.doesNotMatch(movementLock, /场景剧情等待当前处理/);
  assert.match(
    app,
    /安排客户端延迟\(\(\) => eventEmit\('人妻公寓:检查场景剧情', 当前房间\.value \|\| '楼道'\), 0\)/,
    '后续同场票必须走 App 生命周期可清理的下一帧延迟',
  );
  assert.match(app, /当前强制剧情尚未完成，商店暂不可用/);
  assert.match(app, /当前强制剧情尚未完成，手机暂不可用/);
});

test('远处等待票不打断普通互动，但会阻止录像带、荣耀洞和静音会议等另一套连场状态机', () => {
  for (const [name, guard] of [
    ['打开静音会议筹备', '有场景剧情阻塞'],
    ['启动静音会议', '有普通场景剧情阻塞'],
    ['开始录像带首送', '有场景剧情阻塞'],
    ['启动录像带', '有场景剧情阻塞'],
  ]) {
    const start = special.indexOf(`export function ${name}`);
    assert.ok(start >= 0, `缺少${name}`);
    const block = special.slice(start, start + 1600);
    assert.match(block, new RegExp(`${guard}\\(data\\)`));
    assert.match(block, /不能同时开启另一场连场剧情/);
  }
  const glory = index.slice(index.indexOf("eventOn('人妻公寓:荣耀洞'"), index.indexOf("eventOn('人妻公寓:荣耀洞离场'"));
  assert.match(glory, /有场景剧情阻塞\(data\)/);
  assert.match(glory, /不能同时开启荣耀洞连场/);
});

test('手机在活动事务、同场等待或未知旧档时保持只读，远处结构票仍不打断当前互动', () => {
  assert.match(phone, /读取活动场景剧情\(场景剧情数据\)/);
  assert.match(phone, /读取队首场景剧情\(场景剧情数据\.系统\._待发送事件\)/);
  assert.match(phone, /等待场景剧情阻塞当前场景\(等待场景剧情, 当前场景\)/);
  assert.match(phone, /等待票阻塞手机/);
  assert.match(phone, /旧档根本没有可靠目标时冻结/);
  assert.match(phone, /手机暂时保持只读/);
  assert.doesNotMatch(phone, /有场景剧情阻塞/);

  const 自动节拍入口 = 段(phoneBeat, 'export async function 手机节拍()', 'type 孕产群后私聊类型');
  assert.match(自动节拍入口, /读取活动场景剧情\(data\)/);
  assert.match(自动节拍入口, /读取队首场景剧情\(data\.系统\._待发送事件\)/);
  assert.match(自动节拍入口, /等待场景剧情阻塞当前场景\(等待剧情, 当前场景\)/);
  assert.doesNotMatch(自动节拍入口, /if \(data\.系统\._待发送事件\) return/);

  const 冷落预警入口 = phoneCold.slice(phoneCold.indexOf('export async function 冷落预警节拍()'));
  assert.match(冷落预警入口, /读取活动场景剧情\(data\)/);
  assert.match(冷落预警入口, /读取队首场景剧情\(data\.系统\._待发送事件\)/);
  assert.match(冷落预警入口, /等待场景剧情阻塞当前场景\(等待剧情, 当前场景\)/);
  assert.doesNotMatch(冷落预警入口, /if \(data\.系统\._待发送事件\) return/);
});

test('强剧情只读门先于玩家微信发送、邀约与撤回的首次持久写，邀约先占手机生成租约', () => {
  const 撤回入口 = 段(phoneInteraction, 'async function 持久化玩家微信撤回(', 'interface 微信消息菜单选项');
  const 撤回只读门 = 撤回入口.indexOf('普通手机场景剧情只读原因');
  const 撤回首次写 = 撤回入口.indexOf('await updateVariablesWith');
  assert.ok(撤回只读门 >= 0 && 撤回只读门 < 撤回首次写, '撤回必须在首次 chat 写入前复核强剧情只读门');

  const 邀约入口 = 段(phoneInteraction, 'async function 约出来(', '// ── 楼务群接话');
  const 邀约只读门 = 邀约入口.indexOf('普通手机场景剧情只读原因');
  const 邀约手机租约 = 邀约入口.indexOf('取得手机生成租约');
  const 邀约首次写 = 邀约入口.indexOf('await 写库增量');
  assert.ok(邀约只读门 >= 0 && 邀约只读门 < 邀约首次写, '邀约必须在写入玩家邀请前复核强剧情只读门');
  assert.ok(邀约手机租约 >= 0 && 邀约手机租约 < 邀约首次写, '邀约必须在写入玩家邀请前占用手机生成租约');
  assert.match(邀约入口, /手机生成租约\.释放\(\)/);

  const 发送入口 = 段(phoneInteraction, 'async function 发消息(', '/** 黄灯到时');
  const 发送只读门 = 发送入口.indexOf('普通手机场景剧情只读原因');
  const 发送手机租约 = 发送入口.indexOf('取得手机生成租约');
  const 发送首次写 = 发送入口.indexOf('await 写库增量');
  assert.ok(发送只读门 >= 0 && 发送只读门 < 发送手机租约, '发送必须先复核强剧情，再占用手机生成租约');
  assert.ok(发送手机租约 >= 0 && 发送手机租约 < 发送首次写, '发送必须在写入玩家消息前占用手机生成租约');
});

test('已经接通的父亲电话可穿过场景只读门继续收尾，普通手机生成仍被活动票阻断', async () => {
  const 开手机 = 段(app, 'async function 开手机()', 'function 窗灯');
  assert.match(开手机, /const 父亲通话已接通 = Boolean\(data\.value\?\.系统\?\._父亲通话\.标识\)/);
  assert.match(开手机, /if \(场景剧情活动\.value && !父亲通话已接通\)/);
  assert.match(开手机, /if \(场景剧情等待当前处理\.value && !父亲通话已接通\)/);

  const data = {
    系统: {
      _待发送事件: '【场景剧情:v1:txn:%E5%9E%83%E5%9C%BE%E6%88%BF:%E7%BF%BB%E5%9E%83%E5%9C%BE】剧情',
      _场景剧情事务: { id: 'txn', 标题: '翻垃圾', 目标场景: '垃圾房' },
    },
  };

  const 普通 = 载入手机生成行为(data);
  assert.equal(await 普通.api.小生成('系统', '用户'), '');
  assert.equal(普通.请求数(), 0);
  assert.match(普通.提示.join('\n'), /手机暂时保持只读/);

  const 已接通电话 = 载入手机生成行为(data);
  assert.equal(
    await 已接通电话.api.小生成('系统', '用户', { 允许场景剧情期间: true }),
    '父亲继续把这通电话说完',
  );
  assert.equal(已接通电话.请求数(), 1);
  assert.equal(已接通电话.提示.length, 0);
});

test('全量扫描强剧情生产者：新增直接写入点必须进入事务、回合绑定或独立特殊场景白名单', () => {
  const root = 'src/人妻公寓/脚本/游戏逻辑';
  const directWriters = 递归文件(root)
    .filter(file => file.endsWith('.ts'))
    .filter(file => /_待发送事件\s*=/.test(读(file)))
    .map(file => file.replace(`${root}/`, ''))
    .sort();
  const allowed = [
    'index.ts',
    '商店系统.ts',
    '场景剧情事务.ts',
    '打断系统.ts',
    '时间推进系统.ts',
    '特殊场景系统.ts',
    '父亲通话写租约.ts',
    '结算系统.ts',
    '阶段线路系统.ts',
  ].sort();
  assert.deepEqual(directWriters, allowed);
  assert.doesNotMatch(moveIn, /_待发送事件\s*=/, '入住生产者必须直接创建带目标的等待票');
  assert.match(engine, /绑定新增待发送事件到场景/);
  assert.match(index, /绑定新增待发送事件到场景/);
});

test('源码不再残留竞争的第二套场景剧情模型或旧函数名', () => {
  const legacy =
    /读取首个待触发剧情|当前活动场景剧情|首个等待场景剧情|激活当前场景待触发剧情|规范场景剧情状态|场景剧情场景相同|激活首个到场剧情|标记活动场景剧情生成中|收纳并激活当前场景剧情|整理场景剧情|场景剧情活动锁|场景剧情目标场景|场景剧情需要返回|场景剧情冻结当前场景|活动场景剧情\.value|待到场场景剧情\.value|场景剧情标题\.value|系统\._场景剧情\b/;
  assert.doesNotMatch(index, legacy);
  assert.doesNotMatch(app, legacy);
  assert.doesNotMatch(engine, legacy);
});

test('快照和时间提示都会清理内部协议，不再把第一个机器标签展示给玩家', () => {
  const time = 读('src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
  assert.match(snapshot, /清除场景剧情机器标记\(ev\)/);
  assert.match(time, /描述场景剧情事件/);
  assert.doesNotMatch(time, /match\(\/【\[\^】\]\+】\//);
});
