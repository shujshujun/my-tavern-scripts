/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A6b 拆分（房间动作生成 → composables/useRoomActions.ts）
// 等价外移，不依赖空格/Prettier 行宽，不把注释当真实 import。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8');
const 合成源码 = readFileSync(new URL('./composables/useRoomActions.ts', 客户端目录), 'utf8');
const A6a测试源码 = readFileSync(new URL('../../../../tests/人妻公寓/App拆分A6a.test.mjs', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 按注释/函数哨兵截段，不依赖绝对行号。 */
function 段(源, 开始标记, 结束标记) {
  const 开始 = 源.indexOf(开始标记);
  assert.notEqual(开始, -1, `缺少开始标记：${开始标记}`);
  const 结束 = 结束标记 === undefined ? 源.length : 源.indexOf(结束标记, 开始);
  assert.notEqual(结束, -1, `缺少结束标记：${结束标记}`);
  return 源.slice(开始, 结束);
}

test('composable 非空；App 真实 import/call/解构；无反向依赖、直连总线与 any/Function 逃逸', () => {
  assert.ok(合成源码.length > 0, 'useRoomActions.ts 应为非空文件');
  assert.match(
    App源码,
    /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/,
    'App 应导入 useRoomActions',
  );
  assert.match(
    App源码,
    /const \{ 房间动作, 当前房间动作, 普通房间动作, 确认已到达动作地点 \} = useRoomActions\(\{/,
    'App 顶层应调用并解构 composable 返回值',
  );
  const 依赖 = 提取导入specifier(合成源码);
  assert.ok(!依赖.some(s => s.includes('App.vue') || s.includes('/App')), 'composable 不得反向导入 App');
  assert.ok(!依赖.some(s => s.includes('store')), 'composable 不得导入 store');
  assert.ok(
    !依赖.some(s => s.startsWith('./') || s.includes('components/')),
    'composable 不得导入客户端同级模块/组件',
  );
  assert.doesNotMatch(合成源码, /eventEmit\(|eventOn\(/, 'composable 不得直接读写事件总线');
  assert.doesNotMatch(合成源码, /\bany\b|\bFunction\b/, 'composable 不得出现 any/Function 类型逃逸');
});

test('破门三状态/敲撬门/确认到达/房间动作/两附加器/两动作 computed 全部迁出并由 composable 持有返回', () => {
  for (const 声明 of [
    'const 破门目标 = ref',
    'const 破门数 = ref',
    'function 敲撬门(',
    'async function 确认已到达动作地点(',
    'function 房间动作(',
    'function 添加管理任务动作(',
    'function 添加地点线路动作(',
    'const 当前房间动作 = computed',
    'const 普通房间动作 = computed',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(声明)), `App 不应再声明 ${声明}`);
    assert.match(合成源码, new RegExp(转义(声明)), `composable 应持有 ${声明}`);
  }
  assert.doesNotMatch(App源码, /破门目标|破门数|破门计时/, 'App 不应再声明破门连点状态与计时器');
  assert.match(
    合成源码,
    /let 破门计时: ReturnType<typeof setTimeout> \| undefined;/,
    '破门计时器归属 composable',
  );
  assert.match(
    合成源码,
    /return \{ 房间动作, 当前房间动作, 普通房间动作, 确认已到达动作地点 \};/,
    'composable 返回动作入口与确认到达',
  );
});

test('App 仍持有进入/同步/提示/时间推进/撤销/剧情启动，options 接线完整且八类业务回调保持原事件名与载荷', () => {
  for (const 声明 of [
    'async function 进入(',
    'function 同步场景自变量()',
    'function 弹提示(',
    'function 发起时间推进(',
    'function 发起时间撤销(',
    'function 启动阶段线路剧情(',
  ]) {
    assert.match(App源码, new RegExp(转义(声明)), `${声明} 应留 App`);
  }
  const 调用开始 = App源码.indexOf('useRoomActions({');
  const 调用结束 = App源码.indexOf('});', 调用开始);
  assert.ok(调用开始 >= 0 && 调用结束 > 调用开始, '应能找到 options 接线范围');
  const 接线区 = App源码.slice(调用开始, 调用结束);
  for (const 注入 of [
    'data,',
    '当前房间,',
    '时段,',
    '绝对时段,',
    '发送中: 场景操作锁,',
    '时间撤销可用,',
    '已破门进入,',
    '荣耀洞可用,',
    '房内有人在,',
    '妻现位,',
    '进入,',
    '同步场景自变量,',
    '弹提示,',
    '发起时间推进,',
    '发起时间撤销,',
    '启动阶段线路剧情,',
  ]) {
    assert.match(接线区, new RegExp(转义(注入)), `options 应注入 ${注入}`);
  }
  const 回调对 = [
    [/对饮: id => void 提交界面事务\(\(\) => eventEmit\('人妻公寓:对饮', id\)\)/, /事件\.对饮\(id\)/],
    [
      /丈夫礼物: \(\{ 门牌, 道具id \}\) =>\s*void 提交界面事务\(\(\) => eventEmit\('人妻公寓:丈夫礼物', \{ 门牌, 道具id \}\)\)/,
      /事件\.丈夫礼物\(\{ 门牌: id, 道具id: 礼物 \}\)/,
    ],
    [
      /催租: \(\{ 门牌, 选择 \}\) => void 提交界面事务\(\(\) => eventEmit\('人妻公寓:催租', \{ 门牌, 选择 \}\)\)/,
      /事件\.催租\(\{ 门牌: id, 选择 \}\)/,
    ],
    [/空房偷窃: id => void 提交界面事务\(\(\) => eventEmit\('人妻公寓:空房偷窃', id\)\)/, /事件\.空房偷窃\(id\)/],
    [/打听: m => void 提交界面事务\(\(\) => eventEmit\('人妻公寓:打听', m\)\)/, /事件\.打听\(m\)/],
    [/荣耀洞: \(\) => void 提交界面事务\(\(\) => eventEmit\('人妻公寓:荣耀洞'\)\)/, /事件\.荣耀洞\(\)/],
    [/捡金币: id => void 提交界面事务\(\(\) => eventEmit\('人妻公寓:捡金币', id\)\)/, /事件\.捡金币\(id\)/],
    [
      /处理管理任务: \(\{ 任务id, 选项id, 地点 \}\) =>\s*void 提交界面事务\(\(\) => eventEmit\('人妻公寓:处理管理任务', \{ 任务id, 选项id, 地点 \}\)\)/,
      /事件\.处理管理任务\(\{ 任务id: 任务\.id, 选项id: 选项\.id, 地点 \}\)/,
    ],
  ];
  for (const [app侧, 合成侧] of 回调对) {
    assert.match(App源码, app侧, 'App 回调应保留原事件名与载荷');
    assert.match(合成源码, 合成侧, 'composable 应经领域回调触发');
  }
  assert.doesNotMatch(接线区, /as any|as never/, 'options 接线不得以 as any/never 掩盖类型');
});

test('全部分支与关键动作契约保持：外部/晨跑/健身/住户/302/管理员室/公共区、训练门、撤销门、现场门、6 连点', () => {
  const 敲撬门段 = 段(合成源码, 'function 敲撬门(', 'async function 确认已到达动作地点(');
  assert.match(敲撬门段, /if \(破门目标\.value !== 房间id\) \{[\s\S]{0,80}破门数\.value = 0;/, '切目标重置连点数');
  assert.match(
    敲撬门段,
    /clearTimeout\(破门计时\);[\s\S]{0,80}破门计时 = setTimeout\(\(\) => \{[\s\S]{0,80}破门数\.value = 0;[\s\S]{0,40}破门目标\.value = '';[\s\S]{0,40}\}, 2500\);/,
    '2.5 秒无新连点超时重置',
  );
  assert.match(敲撬门段, /if \(破门数\.value >= 6\) \{[\s\S]{0,120}进入\(房间id, true\);/, '6 连点触发撬门进入');

  // 移动卡统一改为 async 等待进入，不得再直接 `做: () => 进入(...)` 返回 Promise<boolean>
  assert.doesNotMatch(合成源码, /做: \(\) => 进入\(/, '移动动作不得直接返回 Promise<boolean>');
  assert.match(
    合成源码,
    /做: async \(\) => \{[\s\S]{0,60}await 进入\(id\);[\s\S]{0,40}\}/,
    '移动卡改由 async 等待进入',
  );

  const 公寓外段 = 段(合成源码, "if (id === '公寓外部')", "if (id === '晨跑公园')");
  assert.match(公寓外段, /kicker: 'OUTING',[\s\S]{0,60}icon: 'sun',[\s\S]{0,60}文案: '走出公寓'/, '外部离开');
  assert.match(
    公寓外段,
    /kicker: 'RUN',[\s\S]{0,60}icon: 'sun',[\s\S]{0,60}文案: '去河畔晨跑',[\s\S]{0,80}做: async \(\) => \{[\s\S]{0,60}await 进入\('晨跑公园'\);[\s\S]{0,40}\}/,
    '外部晨跑入口',
  );
  assert.match(公寓外段, /kicker: 'GYM',[\s\S]{0,60}icon: 'favor',[\s\S]{0,60}文案: '去公寓健身房'/, '外部健身入口');
  assert.match(公寓外段, /kicker: 'RETURN',[\s\S]{0,60}icon: 'home',[\s\S]{0,60}文案: '返回公寓大堂'/, '外部返回大堂');

  const 晨跑段 = 段(合成源码, "if (id === '晨跑公园')", "if (id === '健身房')");
  assert.match(晨跑段, /时段\.value === '早上' && data\.value\.玩家资源\._晨跑训练日 !== 今日/, '晨跑仅早上且每日一次');
  assert.match(晨跑段, /发起时间推进\('晨跑'\)/, '晨跑推进方式');
  assert.match(晨跑段, /kicker: 'UNDO', icon: 'rewind', 文案: '撤销刚才的时间推进', 做: 发起时间撤销/, '晨跑撤销动作');
  assert.match(晨跑段, /kicker: 'RETURN',[\s\S]{0,60}icon: 'arrow',[\s\S]{0,60}文案: '回到公寓外'/, '晨跑返回');

  const 健身段 = 段(合成源码, "if (id === '健身房')", "if (房?.类型 === '户'");
  assert.match(健身段, /时段\.value !== '深夜' && data\.value\.玩家资源\._体力训练日 !== 今日/, '健身非深夜且每日一次');
  assert.match(健身段, /发起时间推进\('健身'\)/, '健身推进方式');
  assert.match(健身段, /kicker: 'UNDO', icon: 'rewind', 文案: '撤销刚才的时间推进'/, '健身撤销动作');

  const 住户段 = 段(合成源码, "if (房?.类型 === '户'", "if (id === '302')");
  assert.match(住户段, /if \(!data\.value\.户\[id\]\) return \[\];/, '招租中无动作');
  assert.match(住户段, /kicker: 'VISIT',[\s\S]{0,60}icon: 'door',[\s\S]{0,60}文案: '过去串门'/, '有人时串门');
  assert.match(
    住户段,
    /丈夫在楼\(data\.value\.户\[id\], id as 门牌, 绝对时段\.value\) === '在家'/,
    '对饮/礼物丈夫在楼门',
  );
  assert.match(住户段, /for \(const 礼物 of \['香烟', '球赛票'\] as const\)/, '礼物双选项');
  assert.match(住户段, /\(data\.value\.户\[id\]\?\._欠租笔数 \?\? 0\) > 0 && 妻现位\(id as 门牌\) === id/, '催租现场门');
  assert.match(住户段, /文案: '硬催房租', 类: 'risky'[\s\S]{0,80}文案: '批张宽限条'[\s\S]{0,80}文案: '悄悄垫上'/, '催租三选顺序');
  assert.match(住户段, /kicker: 'KNOCK',[\s\S]{0,60}icon: 'bell',[\s\S]{0,60}文案: '敲敲门'/, '无人时敲门');
  assert.match(住户段, /if \(当前房间\.value === id && 已破门进入\.value\)/, '空房偷窃必须撬进现场');
  assert.match(住户段, /if \(当前房间\.value === id\) 添加地点线路动作\(动作, id\)/, '住户线路动作只在原条件添加');

  const 三零二段 = 段(合成源码, "if (id === '302')", '// 管理员室世界时间');
  assert.match(三零二段, /kicker: 'HOME',[\s\S]{0,60}icon: 'home',[\s\S]{0,60}文案: '回家看看'/, '302 回家看看');
  assert.match(三零二段, /时段\.value !== '深夜'[\s\S]{0,120}文案: '小憩（推进一时段）'[\s\S]{0,80}发起时间推进\('小憩'\)/, '302 小憩门');
  assert.match(三零二段, /文案: '睡到次日早晨'[\s\S]{0,80}发起时间推进\('睡到次日早晨'\)/, '302 睡到次日早晨');
  assert.match(三零二段, /if \(时间撤销可用\.value\)[\s\S]{0,120}文案: '撤销刚才的时间推进'/, '302 撤销门');
  assert.doesNotMatch(三零二段, /发起时间推进\('推进一时段'\)/, '302 不得重新引入普通推进');

  const 管理员室段 = 段(合成源码, "if (id === '管理员室')", '// 公共区');
  assert.match(管理员室段, /kicker: 'GO',[\s\S]{0,60}icon: 'arrow',[\s\S]{0,60}文案: '走过去'[\s\S]{0,80}添加地点线路动作\(动作, id\)/, '管理员室走过去+线路');
  assert.match(管理员室段, /文案: '小憩（推进一时段）'[\s\S]{0,80}发起时间推进\('小憩'\)/, '管理员室小憩');
  assert.match(管理员室段, /文案: '睡到次日早晨'[\s\S]{0,80}发起时间推进\('睡到次日早晨'\)/, '管理员室睡到次日早晨');
  assert.doesNotMatch(管理员室段, /发起时间推进\('推进一时段'\)/, '管理员室不得引入普通推进');

  const 公共区段 = 段(合成源码, '// 公共区', 'return 动作;');
  assert.match(公共区段, /kicker: 'GO',[\s\S]{0,60}icon: 'arrow',[\s\S]{0,60}文案: '走过去'[\s\S]{0,80}添加地点线路动作\(动作, id\)/, '公共区走过去+线路');
  assert.match(
    公共区段,
    /id === '大堂' && 当前房间\.value === id && \(data\.value\?\.背包 \?\? \[\]\)\.includes\('伴手礼盒'\)/,
    '打听必须人在大堂且带伴手礼盒',
  );
  assert.match(公共区段, /id === '洗手间' && 当前房间\.value === id && 荣耀洞可用\.value/, '荣耀洞现场+冷却门');
  assert.match(公共区段, /const 零钱 = 查金币\(id, 绝对时段\.value\);[\s\S]{0,80}if \(零钱 > 0\)/, '零钱现场门');
  assert.match(公共区段, /kicker: 'PICK',[\s\S]{0,60}icon: 'coin',[\s\S]{0,60}文案: `捡起零钱\(¥\$\{零钱\}\)`/, '零钱文案');
  assert.doesNotMatch(公共区段, /kicker: 'GARBAGE'|'垃圾房'/, '垃圾动作仍不入地图房卡');
});

test('管理任务与地点线路的完整参数/门控/顺序；五个组合动作都走统一到达确认门', () => {
  const 管理任务段 = 段(合成源码, 'function 添加管理任务动作', 'function 添加地点线路动作');
  const 位置门 = 管理任务段.indexOf('if (当前房间.value !== 地点) return;');
  const 查询任务 = 管理任务段.indexOf('列出地点管理任务(data.value, 地点)');
  assert.ok(位置门 >= 0 && 位置门 < 查询任务, '楼务只能在玩家真实位于地点时出现');
  assert.match(管理任务段, /const 任务 = 列出地点管理任务\(data\.value, 地点\)\[0\];[\s\S]*?if \(!任务\) return;/, '取首个任务');
  assert.match(管理任务段, /const 剩余时段 = Math\.max\(0, 任务\.截止时段 - 绝对时段\.value\);/);
  assert.match(管理任务段, /任务\.逾期已扣 \? '逾期补办' : `剩\$\{剩余时段\}时段`/, '逾期/剩余文案');
  assert.match(管理任务段, /管理任务选项\(任务\)\.slice\(0, 2\)/, '前两个确定性选项');
  assert.match(管理任务段, /kicker: 任务\.逾期已扣 \? 'OVERDUE' : 'DUTY'/, '逾期 kicker');
  assert.match(管理任务段, /icon: 任务\.类型 === '投诉' \? 'ops' : 'tool'/, '投诉图标');
  assert.match(管理任务段, /`\$\{任务\.模板\} · \$\{状态文案\}｜\$\{选项\.文案\}`/, '瓷砖文案拼接');
  assert.match(
    管理任务段,
    /if \(发送中\.value\) return;[\s\S]{0,120}if \(当前房间\.value !== 地点\) return;[\s\S]{0,80}if \(发送中\.value\) return;/,
    '双重发送中/位置校验',
  );
  assert.match(管理任务段, /事件\.处理管理任务\(\{ 任务id: 任务\.id, 选项id: 选项\.id, 地点 \}\)/);
  assert.doesNotMatch(管理任务段, /await\s+进入\(地点/, '楼务瓷砖不得暗中替玩家进房后直接开工');

  const 线路段 = 段(合成源码, 'function 添加地点线路动作', 'const 当前房间动作');
  assert.match(
    线路段,
    /const 户门牌 = 门牌列表\.includes\(地点 as 门牌\) \? \(地点 as 门牌\) : undefined;/,
    '户门牌换算',
  );
  assert.match(
    线路段,
    /类型: '地点',[\s\S]{0,200}门牌: 户门牌,[\s\S]{0,80}地点,[\s\S]{0,80}时段: 时段\.value,[\s\S]{0,80}楼层: 绝对时段\.value,/,
    '候选参数类型/门牌/地点/时段/楼层',
  );
  assert.match(线路段, /kicker: 'STORY',/, '线路 kicker');
  assert.match(
    线路段,
    /当前房间\.value === 地点[\s\S]{0,60}\? `展开\$\{户静态表\[候选\.门牌\]\.妻名\}的关系剧情`[\s\S]{0,80}: `前往\$\{户静态表\[候选\.门牌\]\.妻名\}的线索地点`/,
    '在场展开/不在场前往文案',
  );
  assert.match(
    线路段,
    /做: async \(\) => \{[\s\S]{0,80}if \(当前房间\.value === 地点\) 启动阶段线路剧情\(地点, 候选\);[\s\S]{0,80}else await 进入\(地点\);[\s\S]{0,40}\}/,
    '已在地点启动剧情，否则只进入地点',
  );

  const 组合动作段 = 段(合成源码, "if (房?.类型 === '户'", 'function 添加管理任务动作');
  const 地点门 = 组合动作段.match(/if \(!\(await 确认已到达动作地点\(id\)\)\) return;/g) ?? [];
  assert.equal(地点门.length, 5, '对饮、丈夫礼物、催租、打听、捡零钱都必须走同一个到达确认门');
  assert.doesNotMatch(
    组合动作段,
    /if \(当前房间\.value !== (?:id|'垃圾房')\) await 进入\(/,
    '不得再忽略进入()返回的失败结果',
  );
});

test('当前动作两层过滤保持；App MapPopup 继续收房间动作函数且抽屉组件消费普通房间动作', () => {
  assert.match(
    合成源码,
    /const 当前房间动作 = computed<卡动作\[\]>\(\(\) =>[\s\S]{0,120}房间动作\(当前房间\.value\)\.filter\(a => !\['GO', 'VISIT', 'KNOCK', 'HOME'\]\.includes\(a\.kicker\)\)/,
    '当前房间动作过滤移动类',
  );
  assert.match(
    合成源码,
    /const 普通房间动作 = computed\(\(\) => 当前房间动作\.value\.filter\(a => a\.kicker !== 'SEARCH'\)\)/,
    '普通房间动作过滤 SEARCH',
  );
  const 模板段 = 提取模板(App源码);
  assert.match(模板段, /:room-actions="房间动作"/, 'MapPopup 继续接收房间动作函数');
  // 正文舞台的普通动作瓷砖已迁入 房内操作抽屉.vue；App 仍接线动作数组与录像带门控。
  assert.match(模板段, /<RoomActionsDrawer\b/, 'App 挂载抽屉组件');
  assert.match(模板段, /:actions="普通房间动作"/, 'App 继续把普通房间动作传给抽屉组件');
  assert.match(模板段, /:video-tape-active="录像带中"/, 'App 继续接线录像带门控');
});

test('破门计时器由 composable 作用域清理；App unmount 不再引用破门计时且其他清理不动', () => {
  assert.match(
    合成源码,
    /getCurrentScope\(\)[\s\S]{0,80}onScopeDispose\(\(\) => \{[\s\S]{0,120}破门计时[\s\S]{0,40}clearTimeout/,
    '破门计时器应随 composable 作用域销毁',
  );
  assert.doesNotMatch(App源码, /破门计时/, 'App 不得再引用破门计时');
  const 卸载 = App源码.match(/onUnmounted\(\(\) => \{[\s\S]*?\n\}\);/)?.[0] ?? '';
  assert.match(卸载, /clearInterval\(心跳timer\)/, '心跳 timer 清理保留');
  assert.match(卸载, /clearInterval\(生成等待timer\)/, '生成等待 timer 清理保留');
  assert.match(卸载, /清空客户端延迟任务\(\)/, '转场、提示、性爱结果等 App 延迟统一随生命周期清理');
  assert.match(App源码, /转场计时 = 安排客户端延迟\(/, '转场 timer 已纳入统一登记');
  assert.match(App源码, /提示timer = 安排客户端延迟\(/, '提示 timer 已纳入统一登记');
  assert.match(App源码, /性爱结果timer = 安排客户端延迟\(/, '性爱结果 timer 已纳入统一登记');
});

test('A6a 与 A1–A5b 边界未回退；无中文首字符组件 tag；不触碰 dist', () => {
  // A6a：动作实现迁移后 A6a 测试仍按 composable 读取并断言不弱化
  assert.match(A6a测试源码, /composables\/useRoomActions\.ts/, 'A6a 测试应读取 useRoomActions.ts');
  assert.ok(A6a测试源码.includes('当前房间仍留 App'), 'A6a 当前房间断言仍在');
  assert.ok(A6a测试源码.includes('房间动作实现应迁出 App'), 'A6a 动作所有权断言已切到 composable');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'A6a 地图组件导入保持');
  assert.match(App源码, /import DossierPopup from '\.\/components\/档案卡\.vue';/, 'A5b 档案卡导入保持');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'A5a 背包导入保持');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'A5a 商店导入保持');
  assert.match(App源码, /import PrologueTitleScreen from '\.\/components\/序章标题屏\.vue';/, 'A4 序章标题屏导入保持');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'A3 useUIPrefs 导入保持');
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'A1 Icon 导入保持');
  assert.match(App源码, /import CgLibrary from '\.\/components\/CG图库\.vue';/, 'A2 CG图库导入保持');
  const 模板段 = 提取模板(App源码);
  assert.doesNotMatch(模板段, /<\/?[一-鿿][^>]*>/, '组件 tag 不得以中文首字符');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  assert.doesNotMatch(合成源码, /dist\//, 'composable 不得引用 dist');
});
