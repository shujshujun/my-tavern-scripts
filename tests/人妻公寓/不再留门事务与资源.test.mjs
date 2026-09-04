/* eslint-disable import-x/no-nodejs-modules -- Node regression harness */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import lodash from 'lodash';
import { 填入本版周线完成夹具 } from './不再留门.fixture.mjs';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');
const { Schema, 创建户节点, 迁移MVU存档到当前版本, 验证当前MVU存档版本 } = require('../../src/人妻公寓/schema.ts');
const route = require('../../src/人妻公寓/脚本/游戏逻辑/不再留门系统.ts');
const queue = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const v4 = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4状态.ts');
const assets = require('../../src/人妻公寓/界面/客户端/不再留门资源.ts');
const { 创建受控生成等待 } = require('../../src/人妻公寓/脚本/游戏逻辑/受控生成等待.ts');
const read = file => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const 仓库根 = fileURLToPath(new URL('../..', import.meta.url));
const 证据根 = process.env.RQGY_CG_EVIDENCE_ROOT ? path.resolve(process.env.RQGY_CG_EVIDENCE_ROOT) : 仓库根;

function webpSize(bytes) {
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', 'WebP缺少RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', 'WebP签名无效');
  const kind = bytes.subarray(12, 16).toString('ascii');
  if (kind === 'VP8X') {
    return [
      1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    ];
  }
  if (kind === 'VP8L') {
    assert.equal(bytes[20], 0x2f, 'VP8L特征字节无效');
    return [
      1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    ];
  }
  const marker = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
  assert.notEqual(marker, -1, `无法解析${kind || '未知'} WebP尺寸`);
  return [bytes.readUInt16LE(marker + 3) & 0x3fff, bytes.readUInt16LE(marker + 5) & 0x3fff];
}

const indexSource = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
const ast = ts.createSourceFile('index.ts', indexSource, ts.ScriptTarget.Latest, true);
let handlerSource = '';
function visit(node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(ast) === 'eventOn' &&
    node.arguments[0]?.text === '人妻公寓:不再留门动作'
  )
    handlerSource = node.arguments[1].getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(handlerSource, '必须提取实际产品入口，不能在测试里复制业务分支');
const handlerJS = ts.transpileModule(`const handler = ${handlerSource};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function fresh() {
  const d = Schema.parse({ 户: { 202: 创建户节点(0), 102: 创建户节点(0) }, 现金: 9999, 系统: { _绝对时段: 8 } });
  Object.assign(d.户['202'].妻, { 当前阶段: 5, 阶段性癖: '独占印记', 外装: '浅蓝色长裙、米色针织开衫', 妆容: '素颜' });
  return d;
}
function stateFor(action) {
  const d = 填入本版周线完成夹具(fresh());
  const r = d.系统._不再留门;
  const blank = fresh().系统._不再留门;
  d.背包 = ['不再留门', '何俊生的街外照片'];
  if (action !== '归档母带') r.母带 = lodash.cloneDeep(blank.母带);
  if (['拍照', '交付副本', '安装套件'].includes(action)) {
    r.记录 = lodash.cloneDeep(blank.记录);
    r.录制次数 = 0;
  }
  if (['拍照', '交付副本'].includes(action)) {
    r.动机已表达 = false;
    r.录制提议 = false;
    r.许可 = '未确认';
    r.停止默认等待 = false;
    r.设备位置 = '无';
  }
  if (action === '拍照') {
    r.阶段 = '可拍';
    r.照片 = lodash.cloneDeep(blank.照片);
    r.可拍时段 = 2;
    r.目击历史 = [2];
    d.系统._绝对时段 = 2;
    d.背包 = ['不再留门'];
  } else if (action === '交付副本') {
    r.阶段 = '待交付';
    r.照片.副本持有人 = '';
    r.照片.交付楼层 = -1;
  } else if (action === '安装套件') {
    r.阶段 = '待准备';
    r.设备位置 = '背包';
    d.背包.push('便携录制套件');
  } else if (action === '转存记录') {
    r.阶段 = '待转存';
    r.记录.位置 = '手机';
  } else if (action === '归档母带') {
    r.阶段 = '待归档';
    r.母带.位置 = '玩家背包';
    r.母带.归档楼层 = -1;
    d.背包.push('周小满母带（已封存）');
  }
  return d;
}
function deferred() {
  let resolve;
  const promise = new Promise(r => {
    resolve = r;
  });
  return { promise, resolve };
}

/** 实际index listener + 真路线/队列函数；仅替换宿主持久IO和可选通知。共享租约另由现有全生命周期专项覆盖。 */
function runtime(initial, place = '202') {
  const ctx = {
    data: lodash.cloneDeep(initial),
    place,
    branch: 'chat-A:branch-A',
    failWrite: false,
    failNotice: false,
    writes: 0,
    attempts: 0,
    errors: [],
    notices: [],
    gate: null,
    pending: Promise.resolve(),
  };
  const guards = new Set();
  let activeOwner = '';
  const env = {
    ...route,
    _时间推进中: false,
    隔离事件进行中: () => false,
    读场景: () => ({ 房间id: ctx.place }),
    当前楼层: () => 100,
    当前聊天ID: () => ctx.branch,
    当前时间线切换世代: () => 1,
    console: { warn: (...args) => ctx.notices.push(args), error: () => undefined },
    登记MVU提交校验: guard => {
      guards.add(guard);
      return () => guards.delete(guard);
    },
    eventEmit: (name, payload) => {
      if (ctx.failNotice && name === '人妻公寓:不再留门CG') throw Error('CG unavailable');
      ctx.notices.push([name, payload]);
    },
    安全操作: fn => {
      const owner = ctx.branch;
      ctx.pending = ctx.pending
        .then(async () => {
          if (owner !== ctx.branch) throw Error('stale owner');
          activeOwner = owner;
          const raw = { stat_data: lodash.cloneDeep(ctx.data) };
          await fn(raw, Schema.parse(raw.stat_data), () => owner === ctx.branch);
        })
        .catch(e => ctx.errors.push(e.message));
      return ctx.pending;
    },
    落地: async (result, raw, draft) => {
      if (!result.变动 && !result.事件) return false;
      ctx.attempts++;
      if (ctx.gate) await ctx.gate.promise;
      if (ctx.failWrite) throw Error('persist failed');
      if (activeOwner !== ctx.branch || [...guards].some(g => !g())) throw Error('stale transaction');
      ctx.data = lodash.cloneDeep(draft);
      ctx.writes++;
      return true;
    },
    执行回合: async () => undefined,
  };
  env.即时开演 = async (prepare, raw, data) => env.落地(prepare(), raw, data);
  const handler = Function(...Object.keys(env), `${handlerJS}\nreturn handler;`)(...Object.values(env));
  ctx.fire = action => handler(action);
  ctx.run = async action => {
    handler(action);
    await ctx.pending;
  };
  return ctx;
}

for (const action of ['拍照', '交付副本', '安装套件', '转存记录', '归档母带']) {
  test(`${action}：真实入口持久写入失败时原件、设备、现金与阶段一起保留`, async () => {
    const before = stateFor(action);
    const rt = runtime(before, action === '拍照' ? '公寓外部' : action === '归档母带' ? '302' : '202');
    rt.failWrite = true;
    await rt.run(action);
    assert.equal(rt.attempts, 1);
    assert.equal(rt.writes, 0);
    assert.deepEqual(rt.data, before);
    assert.deepEqual(rt.errors, ['persist failed']);
  });
  test(`${action}：并发重复点击只提交一次`, async () => {
    const rt = runtime(stateFor(action), action === '拍照' ? '公寓外部' : action === '归档母带' ? '302' : '202');
    rt.fire(action);
    rt.fire(action);
    await rt.pending;
    assert.equal(rt.writes, 1);
    assert.deepEqual(rt.errors, []);
    if (action === '归档母带') assert.equal(route.不再留门已完成(rt.data), true);
  });
}

test('归档等待IO期间切聊天、回档或离开地点，迟到写入不得认领新状态', async () => {
  for (const change of ['切聊天', '回档', '离开地点']) {
    const before = stateFor('归档母带');
    const rt = runtime(before, '302');
    rt.gate = deferred();
    rt.fire('归档母带');
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(rt.attempts, 1);
    if (change === '离开地点') rt.place = '202';
    else rt.branch = `changed:${change}`;
    rt.gate.resolve();
    await rt.pending;
    assert.equal(rt.writes, 0);
    assert.deepEqual(rt.data, before);
    assert.deepEqual(rt.errors, ['stale transaction']);
  }
});

test('归档已落库后CG通知失败不撤销母带位置、完成事实或核销结果', async () => {
  const rt = runtime(stateFor('归档母带'), '302');
  rt.failNotice = true;
  await rt.run('归档母带');
  assert.equal(rt.writes, 1);
  assert.equal(route.不再留门已完成(rt.data), true);
  assert.ok(!rt.data.背包.includes('不再留门'));
  assert.equal(rt.errors.length, 0);
});

test('当前拍超时/取消/时间线失效后，底层迟到结果不能推进当前票', async () => {
  for (const mode of ['超时', '取消', '切聊天']) {
    const d = fresh();
    d.背包.push('不再留门');
    const prep = route.执行不再留门动作(d, '使用道具', '202', 30, 'chat-test:branch', 'timeout-route');
    assert.equal(prep.成功, true);
    const frozen = lodash.cloneDeep(d),
      lower = deferred();
    let valid = true;
    const wait = 创建受控生成等待(lower.promise, {
      超时毫秒: 15,
      超时说明: '本拍超时',
      仍有效: () => valid,
      有效性检查间隔毫秒: 5,
    });
    const settled = wait.结果.then(() => route.提交不再留门剧情事件(d, prep.事件, '202', 31, '我问起今天的安排。'));
    if (mode === '取消') wait.取消();
    if (mode === '切聊天') valid = false;
    await assert.rejects(settled);
    lower.resolve('迟到的有效正文');
    await Promise.resolve();
    assert.deepEqual(d, frozen);
    assert.equal(d.系统._不再留门.道具已使用, false);
  }
});

test('受支持v7/v8/v9只补新线默认值；旧完成字符串与历史普通场次不生成照片', () => {
  for (const version of [7, 8, 9]) {
    const old = fresh();
    old.系统._数据版本 = version;
    old.现金 = 321;
    delete old.系统._不再留门;
    old.系统._已完成特殊场景.push('不再留门');
    const data = Schema.parse(迁移MVU存档到当前版本(old));
    assert.equal(data.系统._数据版本, 9);
    assert.equal(data.现金, 321);
    assert.equal(data.系统._不再留门.照片.id, '');
    assert.equal(route.不再留门已完成(data), false);
    assert.deepEqual(Schema.parse(data), data);
  }
  assert.throws(() => 验证当前MVU存档版本({ 系统: { _数据版本: 6 } }));
});

test('V4旧档仅购买保持未用；真实备锁、赠锁与活动场次按各自凭据继承', () => {
  const onlyBought = fresh();
  const v = onlyBought.系统._录像带V4;
  v.录像带已购买 = true;
  v.阶段 = '待购赠锁';
  onlyBought.背包.push('录像带');
  assert.equal(v4.录像带V4已经使用(onlyBought), false);
  assert.equal(v4.录像带V4贞操锁可购买数量(onlyBought), 0);
  const before = lodash.cloneDeep(onlyBought);
  assert.equal(v4.使用录像带V4(onlyBought).成功, false);
  assert.deepEqual(onlyBought, before);
  const prepared = lodash.cloneDeep(onlyBought);
  prepared.背包.push('男用贞操带');
  assert.equal(v4.录像带V4已经使用(prepared), true);
  for (const phase of ['等待两日', '微信确认中', '监控就绪']) {
    const old = lodash.cloneDeep(onlyBought);
    old.系统._录像带V4.阶段 = phase;
    old.系统._录像带V4.赠锁['102'] = { 已接收: true, 接收绝对时段: 4 };
    assert.equal(v4.录像带V4已经使用(old), true);
  }
  for (const phase of ['观看中', '已安全中断', '已完成']) {
    const old = lodash.cloneDeep(onlyBought);
    old.系统._录像带V4.阶段 = phase;
    old.系统._录像带V4.场景.状态 = phase;
    old.系统._录像带V4.场景.场次标识 = 'old-legal-scene';
    assert.equal(v4.录像带V4已经使用(old), true);
    assert.equal(old.系统._不再留门.照片.id, '');
  }
  const freshRule = lodash.cloneDeep(prepared);
  freshRule.系统._录像带V4.入口规则版本 = 1;
  assert.equal(v4.录像带V4已经使用(freshRule), false, '新版不能用背包锁具绕过主动使用');
  const stale = lodash.cloneDeep(onlyBought);
  v4.同步录像带V4微信收据(stale, []);
  assert.deepEqual(stale, onlyBought);
});

test('8张WebP产品图与审核源图双向闭合；照片唯一CG02，反应/造型/光照/地点/实例各自校验', () => {
  const verification = JSON.parse(
    readFileSync(path.join(证据根, 'output/imagegen/rqgy-no-more-door-20260902/verification.json'), 'utf8'),
  );
  const manifest = JSON.parse(read('src/人妻公寓/素材/特殊场景/不再留门/不再留门CG.manifest.json'));
  assert.equal(verification.finals.length, 8);
  assert.equal(assets.不再留门CG清单.length, 8);
  assert.equal(manifest.status, 'product-webp-ready-awaiting-external-publish');
  assert.equal(manifest.format, 'webp');
  assert.equal(manifest.encoder.quality, 93);
  assert.equal(manifest.encoder.method, 6);
  assert.equal(manifest.encoder.resize, false);
  assert.equal(manifest.items.length, 8);
  assert.equal(manifest.sourceEvidence.acceptedOriginalsPreserved, 8);
  assert.equal(manifest.sourceEvidence.rejectedOriginalsPreserved, 2);
  const productRoot = path.join(仓库根, 'src/人妻公寓/素材/特殊场景/不再留门');
  const productFiles = readdirSync(productRoot)
    .filter(file => /\.(?:png|webp)$/u.test(file))
    .sort();
  assert.deepEqual(productFiles, manifest.items.map(item => item.productFile).sort());
  for (const item of manifest.items) {
    const source = readFileSync(path.join(证据根, item.sourcePath));
    const product = readFileSync(path.join(productRoot, item.productFile));
    assert.equal(createHash('sha256').update(source).digest('hex').toUpperCase(), item.sourceSha256, item.id);
    assert.equal(source.length, item.sourceBytes, item.id);
    assert.deepEqual(webpSize(product), [1536, 1024], item.id);
    assert.equal(createHash('sha256').update(product).digest('hex').toUpperCase(), item.productSha256, item.id);
    assert.equal(product.length, item.productBytes, item.id);
    assert.equal(item.productFile, `${item.id}.webp`, item.id);
    assert.ok(item.productBytes < item.sourceBytes, `${item.id}产品图必须小于源图`);
  }
  assert.ok(manifest.qualityEvidence.savedPercent > 80);
  globalThis.__RQGY_NMD_ASSET_BASE__ = 'https://assets.example.test/no-more-door/';
  assert.equal(assets.不再留门图片('ZXM-NMD-01'), 'https://assets.example.test/no-more-door/ZXM-NMD-01.webp');
  delete globalThis.__RQGY_NMD_ASSET_BASE__;
  const d = stateFor('交付副本');
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-02'), true);
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-03', d.系统._不再留门.实例, '202'), true);
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-03', 'other-instance', '202'), false);
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-03', undefined, '302'), false);
  d.户['202'].妻._穿着SKU.外装 = '另一套衣服';
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-03'), false);
  d.户['202'].妻._穿着SKU = {};
  d.户['202'].妻._怀孕.状态 = '已告知';
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-03'), false);
  d.户['202'].妻._怀孕.状态 = '未孕';
  d.系统._绝对时段 = 11;
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-03'), false);
  assert.equal(assets.不再留门CG允许(d, 'ZXM-NMD-02'), true, '原件预览仍按拍摄时事实保留');
  const archived = 填入本版周线完成夹具(fresh());
  assert.equal(assets.不再留门CG允许(archived, 'ZXM-NMD-08'), true);
  assert.equal(archived.系统._第二机位.阶段, '未开始', '202专用格不要求沈线先完成');
});

test('现场、档案和两条正文通道接同一提交口；公开手机没有本线私有事实注入', () => {
  const engine = read('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const phone = read('src/人妻公寓/脚本/游戏逻辑/手机/微信记忆上下文.ts');
  const app = read('src/人妻公寓/界面/客户端/App.vue');
  assert.match(handlerSource, /安全操作/);
  assert.match(handlerSource, /登记MVU提交校验/);
  for (const source of [engine, indexSource]) {
    assert.match(source, /提交不再留门剧情事件/);
    assert.match(source, /不再留门真实录制已绑定/);
    assert.match(source, /不再留门正文越拍原因/);
  }
  assert.match(phone, /门牌号 === '202' \? 不再留门私下上下文/);
  assert.doesNotMatch(phone.slice(phone.indexOf('export function 读取群聊记忆上下文')), /不再留门私下上下文/);
  assert.match(app, /NoMoreDoorProgress/);
  assert.match(app, /不再留门动作/);
  assert.match(app, /不再留门CG允许/);
});

test('其他高优先级事件画面出现时，不再留门的残留候选不能抢标题或关闭文案', () => {
  const app = read('src/人妻公寓/界面/客户端/App.vue');
  const script = require('vue/compiler-sfc').parse(app).descriptor.scriptSetup.content;
  const sf = ts.createSourceFile('App.ts', script, ts.ScriptTarget.Latest, true);
  const expressions = {};
  function scan(node) {
    if (ts.isVariableDeclaration(node) && ['当前事件CG眉题', '当前事件CG关闭文案'].includes(node.name.getText(sf)))
      expressions[node.name.getText(sf)] = node.initializer.getText(sf);
    ts.forEachChild(node, scan);
  }
  scan(sf);
  for (const owner of ['借种', '生产']) {
    const shown = { 文件: owner },
      stale = { 文件: 'ZXM-NMD-03', 来源: '不再留门' };
    const args = [
      fn => ({ value: fn() }),
      { value: shown },
      { value: stale },
      { value: owner === '借种' ? shown : null },
      { value: owner === '生产' ? shown : null },
    ];
    for (const key of Object.keys(expressions)) {
      const result = Function(
        'computed',
        '当前事件CG',
        '当前家庭计划CG',
        '当前借种CG',
        '当前生产CG',
        `return (${expressions[key]});`,
      )(...args).value;
      assert.match(result, new RegExp(owner));
      assert.doesNotMatch(result, /不再留门/);
    }
  }
});

function actualFunction(file, name, env) {
  const source = read(file),
    sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  let declaration = '';
  ts.forEachChild(sf, node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name)
      declaration = node.getText(sf).replace(/^export\s+/, '');
  });
  assert.ok(declaration, name);
  const js = ts.transpileModule(`const run = ${declaration};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return Function(...Object.keys(env), `${js}\nreturn run;`)(...Object.values(env));
}

test('已打开的手机在录制中也不能发送消息或绕过AI只读门，待机仍放行', async () => {
  const data = fresh();
  data.系统._不再留门.阶段 = '录制中';
  const notices = [];
  const env = {
    当前手机数据: () => data,
    当前聊天ID: () => 'phone-chat',
    获取会议会话禁用原因: () => '',
    eventEmit: (...args) => notices.push(args),
    不再留门手机只读原因: route.不再留门手机只读原因,
  };
  const file = 'src/人妻公寓/脚本/游戏逻辑/手机/交互/邀约与发消息.ts';
  env.普通手机场景剧情只读原因 = actualFunction(file, '普通手机场景剧情只读原因', env);
  const send = actualFunction(file, '发消息', env);
  await send('202', '这条消息不能在录制中发出');
  assert.match(notices.at(-1)[1], /录制/);
  const generate = actualFunction('src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts', '小生成', env);
  assert.equal(await generate('system', 'message', { 允许场景剧情期间: true }), '');
  assert.match(notices.at(-1)[1], /录制/);
  data.系统._不再留门.阶段 = '待开录';
  assert.equal(route.不再留门手机只读原因(data), '');
});

test('录制中旧手机面板仍可收起，收起后不能重新打开', () => {
  const data = fresh();
  data.系统._不再留门.阶段 = '录制中';
  const classes = new Set(['open']),
    notices = [];
  const root = {
    classList: { contains: v => classes.has(v), remove: v => classes.delete(v), add: v => classes.add(v) },
    querySelector: () => null,
  };
  const env = {
    当前手机数据: () => data,
    不再留门手机只读原因: route.不再留门手机只读原因,
    挂载手机: () => {},
    ROOT_ID: 'phone',
    根文档: () => ({ getElementById: () => root }),
    开合防抖: () => true,
    获取静音会议手机状态: () => ({ 场景中: false }),
    已注册端口: { 结束当前聊天输入: () => {} },
    eventEmit: (...args) => notices.push(args),
  };
  const toggle = actualFunction('src/人妻公寓/脚本/游戏逻辑/手机/壳/红点与开合.ts', '打开手机', env);
  toggle();
  assert.equal(classes.has('open'), false);
  assert.equal(notices.at(-1)[0], '人妻公寓:手机收起');
  toggle();
  assert.equal(classes.has('open'), false);
  assert.match(notices.at(-1)[1], /录制/);
});

test('录制中接听来电在后端硬写入之前失败关闭，来电保持待接', async () => {
  const data = fresh();
  data.系统._不再留门.阶段 = '录制中';
  data.系统._待接来电.期 = 4;
  let callback = '',
    consumed = 0;
  const notices = [];
  const sf = ts.createSourceFile('index.ts', indexSource, ts.ScriptTarget.Latest, true);
  function scan(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sf) === 'eventOn' &&
      node.arguments[0]?.text === '人妻公寓:接听来电'
    )
      callback = node.arguments[1].getText(sf);
    ts.forEachChild(node, scan);
  }
  scan(sf);
  assert.ok(callback);
  const env = {
    安全操作: fn => fn(),
    排队父亲通话整表写: fn => fn(),
    读取最近有效: () => ({ raw: {}, data }),
    当前聊天ID: () => 'phone-chat',
    不再留门手机只读原因: route.不再留门手机只读原因,
    接听来电: () => {
      consumed++;
    },
    eventEmit: (...args) => notices.push(args),
  };
  const js = ts.transpileModule(`const run = ${callback};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  await Function(...Object.keys(env), `${js}\nreturn run;`)(...Object.values(env))('phone-chat');
  assert.equal(consumed, 0);
  assert.equal(data.系统._待接来电.期, 4);
  assert.equal(data.系统._父亲通话.标识, '');
  assert.match(notices.at(-1)[1], /录制/);
});
