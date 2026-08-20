/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
const ts = require('typescript');

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 客户端入口源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/index.ts', import.meta.url), 'utf8');
const 游戏逻辑源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 静音会议源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/composables/useMuteMeeting.ts', import.meta.url),
  'utf8',
);
const 反馈提示源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/反馈提示.vue', import.meta.url), 'utf8');
const 客户端模板 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/index.html', import.meta.url), 'utf8');
const 客户端产物 = readFileSync(new URL('../../dist/人妻公寓/界面/客户端/index.html', import.meta.url), 'utf8');

function 载入纯函数片段(源码, 起始标记, 结束标记, 导出名) {
  const 起点 = 源码.indexOf(起始标记);
  const 终点 = 源码.indexOf(结束标记, 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, `无法定位行为片段：${起始标记}`);
  const 片段 = 源码.slice(起点, 终点);
  const js = ts.transpileModule(`${片段}\nmodule.exports = { ${导出名.join(', ')} };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const 模块 = { exports: {} };
  Function('module', 'exports', js)(模块, 模块.exports);
  return 模块.exports;
}

test('客户端启动等待覆盖 MVU 成功、拒绝、超时与 stat_data 缺失', async () => {
  const { 等待客户端启动依赖 } = require('../../src/人妻公寓/界面/客户端/启动等待.ts');

  const 正常 = await 等待客户端启动依赖(() => Promise.resolve(), () => Promise.resolve(), 20);
  assert.deepEqual(正常, { mvu就绪: true, statData就绪: true });

  let 拒绝后等待存档 = false;
  const 拒绝错误 = new Error('MVU 加载失败');
  const 拒绝 = await 等待客户端启动依赖(
    () => Promise.reject(拒绝错误),
    () => {
      拒绝后等待存档 = true;
      return Promise.resolve();
    },
    20,
  );
  assert.equal(拒绝.mvu就绪, false);
  assert.equal(拒绝.statData就绪, false);
  assert.equal(拒绝.mvu错误, 拒绝错误);
  assert.equal(拒绝后等待存档, false, 'MVU 未就绪时不应再额外空等 stat_data');

  let 超时后等待存档 = false;
  const 超时开始 = Date.now();
  const 超时 = await 等待客户端启动依赖(
    () => new Promise(() => {}),
    () => {
      超时后等待存档 = true;
      return Promise.resolve();
    },
    5,
  );
  assert.equal(超时.mvu就绪, false);
  assert.equal(超时.statData就绪, false);
  assert.match(String(超时.mvu错误), /等待 Mvu 初始化超时/);
  assert.equal(超时后等待存档, false);
  assert.ok(Date.now() - 超时开始 < 100, 'MVU 无响应必须在有界时间内返回');

  const 存档错误 = new Error('stat_data 超时');
  const 存档缺失 = await 等待客户端启动依赖(() => Promise.resolve(), () => Promise.reject(存档错误), 20);
  assert.equal(存档缺失.mvu就绪, true);
  assert.equal(存档缺失.statData就绪, false);
  assert.equal(存档缺失.statData错误, 存档错误);
});

test('客户端切聊天同步作废旧界面，下一任务拍只从新聊天重建场景、卷轴与特殊场景', () => {
  assert.match(App源码, /eventOn\(tavern_events\.CHAT_CHANGED, 客户端聊天切换\)/, 'App 必须拥有独立切聊消费者');
  const 起点 = App源码.indexOf('function 客户端聊天切换()');
  const 终点 = App源码.indexOf('// ── 挂载:事件接线', 起点);
  assert.ok(起点 >= 0 && 终点 > 起点, '必须能定位客户端切聊收口函数');
  const 段 = App源码.slice(起点, 终点);
  for (const 清理 of [
    '卷轴请求序号 += 1',
    '行动选项世代.value += 1',
    '场景剧情准备事件序号 += 1',
    '停止生成计时()',
    '重置录像带界面()',
    '重置静音会议时间线界面()',
    '清空当前成人CG()',
    '当前家庭计划CG.value = null',
    '当前生产CG.value = null',
    '显示地图.value = false',
    '显示商店.value = false',
    '显示背包.value = false',
    '显示监控.value = false',
    '显示史册.value = false',
    '设置开.value = false',
    '首次说明开.value = false',
    '清空编辑状态()',
  ]) {
    assert.match(段, new RegExp(清理.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `切聊当拍应执行 ${清理}`);
  }
  assert.match(段, /安排客户端延迟\(\(\) => \{[\s\S]*?void 重建客户端聊天界面\(切换世代\);[\s\S]*?\}, 0\)/, '宿主完成 chat 替换后再重建');
  assert.match(App源码, /async function 重建客户端聊天界面\(切换世代: number\)/, '重建函数冻结共享时间线世代');
  const 重建起点 = App源码.indexOf('async function 重建客户端聊天界面(');
  const 重建终点 = App源码.indexOf('function 客户端聊天切换()', 重建起点);
  const 重建段 = App源码.slice(重建起点, 重建终点);
  assert.match(重建段, /await Promise\.resolve\([\s\S]*?pull\?\.\(\)/, '先拉新聊天 Store');
  assert.match(重建段, /if \(切换世代 !== 当前时间线切换世代\(\)\) return;/, '每个异步阶段后复核共享世代');
  for (const 重建 of [
    '同步场景自变量()',
    'await 取卷轴()',
    '刷新可重掷()',
    '刷赴约()',
    '刷新在场()',
    '刷新行动选项()',
    '刷新待办()',
    '刷新偷窥待选()',
    '同步静音会议界面()',
    '恢复失败行动()',
  ]) {
    assert.match(重建段, new RegExp(重建.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `新聊天必须重建 ${重建}`);
  }
});

test('可选启动步骤只降级当前世代错误，失效世代必须交回总启动闸门', () => {
  const { 处理可降级启动错误 } = 载入纯函数片段(
    游戏逻辑源码,
    'export function 处理可降级启动错误(',
    'function 停止本模块脚本心跳()',
    ['处理可降级启动错误'],
  );
  const 普通错误 = new Error('worldbook unavailable');
  const 已报告 = [];
  处理可降级启动错误(() => true, 普通错误, 错误 => 已报告.push(错误));
  assert.deepEqual(已报告, [普通错误]);

  const 世代错误 = new Error('__RQGY_TIMELINE_CHANGED__');
  let 被误报告 = false;
  assert.throws(
    () => 处理可降级启动错误(() => false, 世代错误, () => (被误报告 = true)),
    错误 => 错误 === 世代错误,
  );
  assert.equal(被误报告, false);
  assert.match(游戏逻辑源码, /catch \(e\) \{\s*处理可降级启动错误\(启动仍有效, e,/);

  const 引导失败处理位 = 游戏逻辑源码.indexOf("处理可降级启动错误(启动仍有效, e, 错误 => console.error('[人妻公寓] 首批入住引导失败:'");
  const 最终复核位 = 游戏逻辑源码.indexOf('确认启动仍有效();', 引导失败处理位);
  const 心跳位 = 游戏逻辑源码.indexOf('停止当前脚本心跳 = 注册单例脚本心跳', 最终复核位);
  const 监听位 = 游戏逻辑源码.indexOf('挂载监听();', 心跳位);
  assert.ok(
    引导失败处理位 >= 0 && 最终复核位 > 引导失败处理位 && 心跳位 > 最终复核位 && 监听位 > 心跳位,
    '可取消启动同步完成并最终复核世代后，才对外声明心跳和挂载业务监听',
  );
});

test('游戏逻辑热重载只保留一个脚本心跳所有者，旧 interval 迟到不得继续续命', () => {
  const { 注册单例脚本心跳 } = 载入纯函数片段(
    游戏逻辑源码,
    'export function 注册单例脚本心跳(',
    'function 停止本模块脚本心跳()',
    ['注册单例脚本心跳'],
  );
  const 所有者 = {};
  const 周期任务 = new Map();
  const 已清除 = [];
  let 下个句柄 = 1;
  const 建立周期 = (任务, 毫秒) => {
    const 句柄 = 下个句柄++;
    周期任务.set(句柄, { 任务, 毫秒 });
    return 句柄;
  };
  const 清除周期 = 句柄 => {
    已清除.push(句柄);
    周期任务.delete(句柄);
  };
  let 甲心跳 = 0;
  const 停甲 = 注册单例脚本心跳(所有者, () => (甲心跳 += 1), 5000, 建立周期, 清除周期);
  const 甲任务 = 周期任务.get(1).任务;
  assert.equal(甲心跳, 1, '注册时立即写一次，客户端无需空等首个周期');
  assert.equal(周期任务.get(1).毫秒, 5000);

  let 乙心跳 = 0;
  const 停乙 = 注册单例脚本心跳(所有者, () => (乙心跳 += 1), 5000, 建立周期, 清除周期);
  assert.deepEqual(已清除, [1], '新实例必须先清掉旧 interval');
  assert.equal(乙心跳, 1);
  甲任务();
  assert.equal(甲心跳, 1, '即使旧宿主回调已经排队，失去所有权后也不得继续续命');
  周期任务.get(2).任务();
  assert.equal(乙心跳, 2);

  停甲();
  assert.equal(typeof 所有者.__rqgyGameHeartbeatStop, 'function', '旧停止器迟到不得删除新实例所有权');
  停乙();
  assert.deepEqual(已清除, [1, 2]);
  assert.equal(所有者.__rqgyGameHeartbeatStop, undefined);
  assert.match(游戏逻辑源码, /停止本模块脚本心跳\(\);[\s\S]{0,500}\$\(\(\) => \{/, '新启动任务登记前先撤销旧心跳');
});

test('客户端入口重复执行会先注销旧全局监听、画幅生命周期与待启动挂载', () => {
  assert.match(客户端入口源码, /__rqgyClientEntryCleanup/, '入口必须在 window 保存唯一清理句柄');
  assert.match(客户端入口源码, /入口全局\.__rqgyClientEntryCleanup\?\.\(\)/, '新入口启动前先清旧实例');
  assert.match(客户端入口源码, /window\.removeEventListener\('error', 窗口错误处理\)/, '错误监听必须具名并可移除');
  assert.match(
    客户端入口源码,
    /window\.removeEventListener\('unhandledrejection', 未处理拒绝处理\)/,
    'Promise 拒绝监听必须具名并可移除',
  );
  assert.match(客户端入口源码, /const 注销画幅生命周期 = 注册画幅页面生命周期\(\)/, '画幅生命周期清理句柄不得丢弃');
  assert.match(客户端入口源码, /注销画幅生命周期\(\)/, '重复执行或销毁时释放跨窗口监听');
  assert.match(客户端入口源码, /let 入口已作废 = false/, '异步启动必须有失效门');
  assert.match(客户端入口源码, /if \(入口已作废\) return;/, '旧启动等待返回后不得重新挂载');
  assert.match(客户端入口源码, /已挂载应用\?\.unmount\(\)/, '重复入口必须卸载旧 Vue 应用');
});

test('客户端不得从手机兼容门面引入宿主渲染副作用', () => {
  const 客户端手机依赖源码 = `${App源码}\n${静音会议源码}`;
  assert.doesNotMatch(
    客户端手机依赖源码,
    /from ['"][^'"]*脚本\/游戏逻辑\/手机系统['"]/,
    '手机系统门面会加载渲染调度器与交互组合根，客户端只能直连纯运行时上下文',
  );
  assert.match(App源码, /from ['"]\.\.\/\.\.\/脚本\/游戏逻辑\/手机\/运行时上下文['"]/);
  assert.match(静音会议源码, /from ['"]\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/手机\/静音会议旁路['"]/);
});

test('客户端生产包不含未声明的 webpack CJS 拼接运行时', () => {
  assert.doesNotMatch(
    客户端产物,
    /__webpack_require__\.cjs\s*=/,
    '该残留会在模块入口同步触发 ReferenceError，使 Vue 尚未挂载就只剩渐变背景',
  );
});

test('客户端启动前有可见占位，生产包不再内嵌大幅场景位图', () => {
  assert.match(客户端模板, /<meta\s+charset=["']utf-8["']/i);
  assert.match(客户端模板, /id=["']app["'][^>]*>[\s\S]*?游戏界面加载中/);
  assert.doesNotMatch(App源码, /(?:png|webp)\?url/);
  assert.doesNotMatch(客户端产物, /data:image\/(?:png|webp);base64,/);
  assert.ok(Buffer.byteLength(客户端产物, 'utf8') < 2_000_000, '移动端入口应保持在 2 MB 内');
});

test('新CG回合重置临时坏图集合，加载回调携带实际图片身份', () => {
  assert.match(App源码, /if \(!是加载重试\)[\s\S]{0,160}成人CG本次失效\.clear\(\)/);
  assert.match(App源码, /function 成人CG已加载\([^)]*(?:Event|事件)/);
  assert.match(App源码, /function 成人CG加载失败\([^)]*(?:Event|事件)/);
});

test('坏图会遍历候选池直到真正耗尽，不保留固定次数截断', () => {
  const 失败函数 = App源码.match(/function 成人CG加载失败\([\s\S]*?\n\}/)?.[0] ?? '';
  assert.doesNotMatch(失败函数, /重试次数|<\s*12/);
});

test('同一CG id 的迟到回调还必须匹配本次请求 epoch', () => {
  const {
    CG加载事件属于当前请求,
    创建CG加载槽位,
    完成CG槽位加载,
    选择CG显示槽位,
    替换失败CG槽位,
  } = require('../../src/人妻公寓/界面/客户端/cgLoadState.ts');
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-1', '8'), true);
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-1', '7'), false);
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-2', '8'), false);
  assert.equal(CG加载事件属于当前请求('101-active-1', 8, '101-active-1', '坏值'), false);

  const 甲 = { id: '101-active-1' };
  const 乙 = { id: '101-active-2' };
  const 丙 = { id: '101-active-3' };
  const 初始 = [创建CG加载槽位(甲, 8), 创建CG加载槽位(乙, 9)];
  assert.deepEqual(选择CG显示槽位(初始, false).map(槽 => 槽.项.id), [甲.id], '窄窗只挂载第一槽');
  assert.deepEqual(选择CG显示槽位(初始, true).map(槽 => 槽.项.id), [甲.id, 乙.id], '宽窗挂载两槽');

  const 甲完成 = 完成CG槽位加载(初始, 甲.id, '8');
  assert.equal(甲完成.已处理, true);
  assert.equal(甲完成.槽位[0].加载中, false);
  assert.equal(甲完成.槽位[1].加载中, true, '第一张完成不能替第二张结束 loading');
  const 双完成 = 完成CG槽位加载(甲完成.槽位, 乙.id, '9');
  assert.equal(双完成.槽位[0].加载中, false);
  assert.equal(双完成.槽位[1].加载中, false, '第二张成功应独立完成自己的 loading');

  const 乙失败 = 替换失败CG槽位(甲完成.槽位, 乙.id, '9', [甲, 丙], 10);
  assert.equal(乙失败.已处理, true);
  assert.equal(乙失败.槽位[0], 甲完成.槽位[0], '失败补位不能重建已经显示的另一槽');
  assert.equal(乙失败.槽位[1].项.id, 丙.id);
  assert.equal(乙失败.槽位[1].epoch, 10);
  assert.equal(乙失败.槽位[1].加载中, true);

  const 迟到乙 = 替换失败CG槽位(乙失败.槽位, 乙.id, '9', [甲], 11);
  assert.equal(迟到乙.已处理, false, '旧槽迟到 error 不得删除新补位');
  assert.deepEqual(迟到乙.槽位, 乙失败.槽位);

  const 丙耗尽 = 替换失败CG槽位(乙失败.槽位, 丙.id, '10', [甲], 12);
  assert.equal(丙耗尽.已处理, true);
  assert.deepEqual(丙耗尽.槽位.map(槽 => 槽.项.id), [甲.id], '补位耗尽自动降级单图');

  assert.match(App源码, /v-for="槽 in 当前成人CG显示槽位"/);
  assert.match(App源码, /:key="`\$\{槽\.项\.id\}:\$\{槽\.epoch\}`"/);
  assert.match(App源码, /:data-cg-epoch="槽\.epoch"/);
});

test('回档、离房与专属事件画面会原子清理整组成人 CG', () => {
  const 清空函数 = App源码.match(/function 清空当前成人CG\(\)[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(清空函数, /当前成人CG槽位\.value = \[\]/);
  assert.match(清空函数, /当前成人CG展示键 = ''/);

  const 回档清理 = App源码.match(/function 清理越界成人CG\(\)[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(回档清理, /清空当前成人CG\(\)/, '回档越界必须清整组而非只清第一张');
  assert.match(App源码, /if \(旧房间 !== 房间id\) \{[\s\S]{0,120}清空当前成人CG\(\)/, '离房清整组');
  assert.match(App源码, /eventOn\('人妻公寓:家庭计划CG'[\s\S]{0,180}清空当前成人CG\(\)/, '家庭计划画面互斥');
  assert.match(App源码, /eventOn\('人妻公寓:生产CG'[\s\S]{0,180}清空当前成人CG\(\)/, '生产画面互斥');
});

test('App 重挂载前显式清空本 iframe 事件订阅，并取消所有尚未触发的延迟任务', () => {
  const 卸载函数 = App源码.match(/onUnmounted\(\(\) => \{[\s\S]*?\n\}\);/)?.[0] ?? '';
  assert.match(卸载函数, /eventClearAll\(\)/, 'Vue 卸载不等于 iframe 关闭，旧 eventOn 回调必须显式注销');
  assert.match(App源码, /function 安排客户端延迟\(/, '所有 App 级延迟回调应进入统一生命周期登记');
  assert.match(卸载函数, /清空客户端延迟任务\(\)/, '卸载时必须取消键盘、自动重试、心跳等迟到回调');
});

test('重要反馈按 FIFO 驻留：连续结算不互相覆盖、重复项不刷屏、发送中后仍可继续收取', () => {
  const { 追加拾获提示, 收下首条拾获提示 } = 载入纯函数片段(
    App源码,
    'function 追加拾获提示(',
    '// ── 特殊场景「静音会议」完整状态域',
    ['追加拾获提示', '收下首条拾获提示'],
  );
  let 队列 = [];
  队列 = 追加拾获提示(队列, '【线索】第一条');
  队列 = 追加拾获提示(队列, '【房租】第二条');
  队列 = 追加拾获提示(队列, '【线索】第一条');
  队列 = 追加拾获提示(队列, '   ');
  assert.deepEqual(队列, ['【线索】第一条', '【房租】第二条']);
  assert.equal(队列[0], '【线索】第一条');
  队列 = 收下首条拾获提示(队列);
  assert.deepEqual(队列, ['【房租】第二条'], '手动收下第一条后必须展示下一条');

  const 生成开始段 = App源码.slice(
    App源码.indexOf("eventOn('人妻公寓:生成开始'"),
    App源码.indexOf("eventOn('人妻公寓:变量重生成状态'"),
  );
  assert.doesNotMatch(生成开始段, /拾获卡(?:队列)?\.value\s*=\s*(?:''|\[\])/, '发送中只能暂时隐藏，不得自动吞掉重要提示');
  const 切聊段 = App源码.slice(App源码.indexOf('function 客户端聊天切换()'), App源码.indexOf('// ── 挂载:事件接线'));
  assert.match(切聊段, /拾获卡队列\.value = \[\]/, '切聊天必须清掉上一聊天的反馈队列');
});

test('普通toast不会取消性爱结果卡自己的隐藏计时', () => {
  const toast函数 = App源码.match(/function 弹提示\([\s\S]*?\n\}/)?.[0] ?? '';
  assert.doesNotMatch(toast函数, /性爱结果timer/);
  assert.match(App源码, /性爱结果timer = 安排客户端延迟\(/, '性爱结果卡仍使用自己的独立句柄');
  const 卸载函数 = App源码.match(/onUnmounted\(\(\) => \{[\s\S]*?\n\}\);/)?.[0] ?? '';
  assert.match(卸载函数, /清空客户端延迟任务\(\)/, '统一生命周期清理必须包含性爱结果卡计时');
});

test('移动端点击反馈保留换行且不会横向溢出画幅', () => {
  // A2 拆分后 toast/loot 样式迁入 components/反馈提示.vue（.clue-card 仍属 App）
  const toast = 反馈提示源码.match(/\.toast\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.doesNotMatch(toast, /white-space:\s*nowrap/);
  assert.match(toast, /box-sizing:\s*border-box/);
  assert.match(toast, /max-width:\s*calc\(100%\s*-\s*24px\)/);
  assert.match(toast, /white-space:\s*pre-wrap/);
  assert.match(toast, /overflow-wrap:\s*anywhere/);

  const clue = App源码.match(/^\.clue-card\s*\{([^}]*)\}/m)?.[1] ?? '';
  assert.match(clue, /white-space:\s*pre-wrap/);
  assert.match(clue, /overflow-wrap:\s*anywhere/);

  const lootText = 反馈提示源码.match(/\.loot-card p\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(lootText, /white-space:\s*pre-wrap/);
  assert.match(lootText, /overflow-wrap:\s*anywhere/);
});

test('卷轴异步刷新只允许最新请求提交', () => {
  assert.match(App源码, /卷轴请求序号/);
  assert.match(App源码, /请求序号\s*!==\s*卷轴请求序号/);
});

test('画幅监听返回清理函数并成对移除父层监听', () => {
  const 记录 = [];
  const 视口 = {
    addEventListener: (类型, 处理) => 记录.push(['add-vv', 类型, 处理]),
    removeEventListener: (类型, 处理) => 记录.push(['remove-vv', 类型, 处理]),
  };
  const 假窗口 = {
    parent: null,
    top: null,
    visualViewport: 视口,
    addEventListener: (类型, 处理) => 记录.push(['add-win', 类型, 处理]),
    removeEventListener: (类型, 处理) => 记录.push(['remove-win', 类型, 处理]),
  };
  假窗口.parent = 假窗口;
  假窗口.top = 假窗口;
  globalThis.window = 假窗口;

  const { 注册画幅监听 } = require('../../src/人妻公寓/界面/客户端/viewport.ts');
  const 清理 = 注册画幅监听();
  assert.equal(typeof 清理, 'function');
  清理();
  assert.equal(记录.filter(([动作]) => 动作.startsWith('add')).length, 3);
  assert.equal(记录.filter(([动作]) => 动作.startsWith('remove')).length, 3);
});

test('BFCache pagehide 后停止监听，pageshow 恢复时重新注册并同步画幅', () => {
  const 页面监听 = new Map();
  const 页面记录 = [];
  const 页面 = {
    addEventListener: (类型, 处理) => {
      页面记录.push(['add-page', 类型, 处理]);
      页面监听.set(类型, 处理);
    },
    removeEventListener: (类型, 处理) => {
      页面记录.push(['remove-page', 类型, 处理]);
      if (页面监听.get(类型) === 处理) 页面监听.delete(类型);
    },
  };
  let 注册数 = 0;
  let 注销数 = 0;
  let 同步数 = 0;
  const { 注册画幅页面生命周期 } = require('../../src/人妻公寓/界面/客户端/viewport.ts');
  const 清理 = 注册画幅页面生命周期(
    页面,
    () => {
      注册数 += 1;
      let 已注销 = false;
      return () => {
        if (已注销) return;
        已注销 = true;
        注销数 += 1;
      };
    },
    () => {
      同步数 += 1;
    },
  );

  assert.equal(注册数, 1);
  页面监听.get('pagehide')({ persisted: true });
  assert.equal(注销数, 1);
  页面监听.get('pageshow')({ persisted: true });
  assert.equal(注册数, 2);
  assert.equal(同步数, 1);

  清理();
  assert.equal(注销数, 2);
  assert.equal(页面监听.has('pagehide'), false);
  assert.equal(页面监听.has('pageshow'), false);
});
