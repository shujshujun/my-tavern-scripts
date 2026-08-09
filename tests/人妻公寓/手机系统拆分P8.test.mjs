/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
const 门面源码 = readFileSync(new URL('../手机系统.ts', 手机目录), 'utf8');
const 会话瞬态源码 = readFileSync(new URL('./壳/会话瞬态.ts', 手机目录), 'utf8');
const 数据层源码 = readFileSync(new URL('./数据层.ts', 手机目录), 'utf8');
const 生成引擎源码 = readFileSync(new URL('./生成引擎.ts', 手机目录), 'utf8');
const 摘要系统源码 = readFileSync(new URL('./摘要系统.ts', 手机目录), 'utf8');
const 旁路源码 = readFileSync(new URL('./静音会议旁路.ts', 手机目录), 'utf8');
const 冷落预警源码 = readFileSync(new URL('./冷落预警.ts', 手机目录), 'utf8');
const 节拍引擎源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');
const 渲染index源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 渲染chat源码 = readFileSync(new URL('./壳/渲染/chat.ts', 手机目录), 'utf8');

/** 从源码按起止锚截取片段（与 tests/人妻公寓/手机并发原子提交.test.mjs 同款）。 */
function 截源(源码, 开始, 结束) {
  const 起 = 源码.indexOf(开始);
  const 止 = 源码.indexOf(结束, 起 + 开始.length);
  assert.notEqual(起, -1, `缺少开始锚:${开始}`);
  assert.notEqual(止, -1, `缺少结束锚:${结束}`);
  return 源码.slice(起, 止);
}

/** 剥离块注释与行注释，防说明性注释误命中“可执行源码不得反向引用”断言。 */
function 剥离注释(源码) {
  return 源码.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const 交互可执行源码 = 剥离注释(交互源码);

test('P8 交互模块真实拥有全部交互业务与模块级状态，两个注册各一次，内核无重复声明', () => {
  // 模块级状态与函数
  assert.match(交互源码, /function 最近正文\(\): string \{/);
  assert.match(交互源码, /const 微信撤回长按毫秒 = 520;/);
  assert.match(交互源码, /let 玩家微信消息序号 = 0;/);
  assert.match(交互源码, /const 手机邀约队列 = new Map<string, Promise<void>>\(\)/);
  for (const 符号 of [
    '新玩家微信消息标识', '持久化玩家微信撤回', '打开微信撤回菜单', '绑定玩家微信撤回',
    '排队手机邀约', '读赴约条', '约出来', '楼务群一拍', '手动群接话', '发消息',
    '执行待回复批次', '执行批次聊天回复',
  ]) {
    assert.ok(交互源码.includes(`function ${符号}`), `交互模块应真实声明:${符号}`);
  }
  // 两个注册各一次
  assert.match(交互源码, /注册手机渲染业务端口\(\{\s*绑定玩家微信撤回,\s*读赴约条,\s*约出来,\s*发消息,\s*\}/);
  assert.match(交互源码, /注册手机聊天批次执行器\(执行待回复批次\);/);
  assert.equal((交互源码.match(/注册手机渲染业务端口\(/g) ?? []).length, 1, '渲染业务端口只能注册一次');
  assert.equal((交互源码.match(/注册手机聊天批次执行器\(/g) ?? []).length, 1, '批次执行器只能注册一次');

  // 内核只做副作用接线，无重复声明
  assert.match(内核源码, /import '\.\/交互\/邀约与发消息';/);
  assert.equal((内核源码.match(/import '\.\/交互\/邀约与发消息';/g) ?? []).length, 1, '副作用接线只能有一次');
  for (const 模式 of [
    /function 最近正文\(/,
    /const 微信撤回长按毫秒/,
    /let 玩家微信消息序号/,
    /const 手机邀约队列/,
    /function 排队手机邀约\(/,
    /function 读赴约条\(/,
    /function 约出来\(/,
    /function 楼务群一拍\(/,
    /function 手动群接话\(/,
    /function 发消息\(/,
    /async function 执行待回复批次\(/,
    /async function 执行批次聊天回复\(/,
    /注册手机渲染业务端口\(/,
    /注册手机聊天批次执行器\(/,
  ]) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再声明/注册:${模式}`);
  }
  // 无第二份 Map/计数器：已知相邻模块不持有
  for (const [名称, 源码] of [
    ['内核', 内核源码],
    ['会话瞬态', 会话瞬态源码],
    ['数据层', 数据层源码],
    ['节拍引擎', 节拍引擎源码],
    ['生成引擎', 生成引擎源码],
    ['摘要系统', 摘要系统源码],
    ['旁路', 旁路源码],
    ['冷落预警', 冷落预警源码],
  ]) {
    assert.doesNotMatch(源码, /手机邀约队列/, `${名称}不应持有第二份邀约队列`);
    assert.doesNotMatch(源码, /玩家微信消息序号/, `${名称}不应持有第二份玩家消息序号`);
  }
});

test('门面导出精确收口：21 个真实消费者符号保留，无人使用导出不再泄露，无 export * 泄漏', () => {
  const 保留 = [
    '挂载手机', '打开手机', '刷新红点', '冷落预警节拍', '手机节拍', '当前聊天ID',
    '来电已接', '父亲通话已清理', '隔离当前手机分支', '按消息重建已发私聊图',
    '手机生成请求标记', '设置静音会议手机生成中', '静音会议私聊回复生成中',
    '获取静音会议手机状态', '取会场私聊摘要提示', '当前微信摘要引用', '读取近期微信胶囊', '等待微信摘要任务',
    '手机AI生成中', '手机节拍进行中', '同步管理任务微信',
  ];
  const 移除 = [
    '微信消息', '朋友圈条', '静音会议手机状态', '静音会议正文记忆',
    '获取会议会话禁用原因', '取静音会议正文记忆', '微信好友',
    '编译楼务群公开风闻摘要', '编译管理任务微信通知',
  ];
  assert.doesNotMatch(内核源码, /export \* /, '内核不得用 export * 重新泄露内部 API');
  for (const 符号 of 保留) {
    assert.ok(内核源码.includes(符号), `内核应显式 re-export:${符号}`);
  }
  for (const 符号 of 移除) {
    assert.doesNotMatch(
      内核源码,
      new RegExp(`export[^\\n]{0,120}[,{\\s]${符号}(?=[,}\\s]|$)`),
      `内核不得再 re-export:${符号}`,
    );
  }
  // 门面仍是纯 re-export，无实现残留
  assert.match(门面源码, /export \* from '\.\/手机\/内核';/);
  assert.doesNotMatch(门面源码, /function 约出来|function 发消息|const 手机邀约队列/);
});

test('宿主组合根仍走旧门面，客户端只直连无副作用的手机子模块', () => {
  const 游戏逻辑目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/', import.meta.url);
  const index源码 = readFileSync(new URL('./index.ts', 游戏逻辑目录), 'utf8');
  const 回合源码 = readFileSync(new URL('./回合引擎.ts', 游戏逻辑目录), 'utf8');
  const 特殊源码 = readFileSync(new URL('./特殊场景系统.ts', 游戏逻辑目录), 'utf8');
  const app源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
  const mute源码 = readFileSync(
    new URL('../../src/人妻公寓/界面/客户端/composables/useMuteMeeting.ts', import.meta.url),
    'utf8',
  );
  assert.match(index源码, /import \{[\s\S]*挂载手机,[\s\S]*打开手机,[\s\S]*刷新红点,[\s\S]*\} from '\.\/手机系统';/);
  assert.match(index源码, /import \{[\s\S]*冷落预警节拍,[\s\S]*手机节拍,[\s\S]*当前聊天ID,[\s\S]*来电已接,[\s\S]*父亲通话已清理,[\s\S]*隔离当前手机分支,[\s\S]*手机生成请求标记,[\s\S]*设置静音会议手机生成中,[\s\S]*静音会议私聊回复生成中,[\s\S]*\} from '\.\/手机系统';/);
  assert.match(回合源码, /import \{[\s\S]*按消息重建已发私聊图,[\s\S]*当前微信摘要引用,[\s\S]*当前聊天ID,[\s\S]*等待微信摘要任务,[\s\S]*读取近期微信胶囊,[\s\S]*设置静音会议手机生成中,[\s\S]*\} from '\.\/手机系统';/);
  // 客户端运行在独立 iframe，不能经旧门面触发内核的宿主渲染/交互副作用。
  assert.doesNotMatch(`${app源码}\n${mute源码}`, /from '[^']*脚本\/游戏逻辑\/手机系统';/);
  assert.match(app源码, /import \{ 当前聊天ID \} from '\.\.\/\.\.\/脚本\/游戏逻辑\/手机\/运行时上下文';/);
  assert.match(
    mute源码,
    /import \{ 获取静音会议手机状态 \} from '\.\.\/\.\.\/\.\.\/脚本\/游戏逻辑\/手机\/静音会议旁路';/,
  );
  assert.match(app源码, /import \{ useMuteMeeting \} from '\.\/composables\/useMuteMeeting';/);
  assert.match(app源码, /\} = useMuteMeeting\(\{/);
  assert.match(特殊源码, /import \{ 取会场私聊摘要提示 \} from '\.\/手机系统';/);
});

test('新交互模块不 import 内核/门面/渲染调度器/红点实现，改经 UI刷新 注册表请求重绘与红点', () => {
  assert.doesNotMatch(
    交互可执行源码,
    /from '\.\.\/\.\.\/内核'|from '\.\.\/内核'|from '\.\.\/手机系统'|from '\.\/手机系统'|from '\.\.\/壳\/渲染\/index'|from '\.\/壳\/渲染\/index'|from '\.\.\/壳\/红点与开合'|from '\.\/壳\/红点与开合'/,
    '交互模块不得反向 import 内核/门面/渲染调度器/红点实现',
  );
  assert.doesNotMatch(交互可执行源码, /渲染\(|刷新红点\(\)/, '交互模块不得直调渲染/刷新红点实现');
  assert.match(交互源码, /import \{ 请求手机重绘, 请求刷新手机红点 \} from '\.\.\/UI刷新';/);
  assert.match(交互源码, /请求手机重绘\(\)/);
  assert.match(交互源码, /请求刷新手机红点\(\)/);
  // 业务刷新全部经注册表：内核不得再直调渲染实现
  assert.doesNotMatch(内核源码, /渲染\(|刷新红点\(\)/);
  // 渲染业务端口与批次执行器各注册一次（P8 交互模块），页面仍经取渲染业务端口使用
  assert.match(渲染chat源码, /取渲染业务端口\(\)\?\.绑定玩家微信撤回/);
  assert.match(渲染chat源码, /取渲染业务端口\(\)\?\.发消息/);
  assert.match(渲染chat源码, /取渲染业务端口\(\)\?\.读赴约条/);
  assert.match(渲染chat源码, /取渲染业务端口\(\)\?\.约出来/);
});

test('撤回不变量：520ms 长按/右键、坐标缩放、红灯整批取消与绿黄灯精确移除仍保留', () => {
  const 撤回段 = 截源(交互源码, 'async function 持久化玩家微信撤回', 'function 打开微信撤回菜单');
  assert.match(撤回段, /手机聊天批次\.状态\(键\)\.灯 === '红'/);
  assert.match(撤回段, /取消手机聊天批次键\(键, false\)/);
  assert.match(撤回段, /手机聊天批次\.移除消息\(键, 定位\.标识\)/);
  assert.match(撤回段, /释放会话待回复\(键\)/);
  assert.match(撤回段, /撤回微信玩家消息\(原, 定位\)/, '只经 微信消息撤回 判定玩家普通消息');
  const 菜单段 = 截源(交互源码, 'function 打开微信撤回菜单', 'function 绑定玩家微信撤回');
  assert.match(菜单段, /横缩放 = 屏\.offsetWidth \/ Math\.max\(1, 屏框\.width\)/);
  assert.match(菜单段, /纵缩放 = 屏\.offsetHeight \/ Math\.max\(1, 屏框\.height\)/);
  const 绑定段 = 截源(交互源码, 'function 绑定玩家微信撤回', '// ── 约出来');
  assert.match(绑定段, /微信撤回长按毫秒/);
  assert.match(绑定段, /ev\.pointerType === 'mouse' && ev\.button !== 0/);
  assert.match(绑定段, /addEventListener\('contextmenu'/);
});

test('邀约不变量：聊天ID+世代串行、先占输入锁、每 await 后租约复核、概率公式与赴约单例 CAS 保留', () => {
  const 邀约段 = 截源(交互源码, 'const 手机邀约队列', '// ── 楼务群接话');
  assert.match(邀约段, /const 队列键 = `\$\{聊天ID\}\$\{String\.fromCharCode\(0\)\}\$\{手机租约世代\}`;/);
  assert.equal(交互源码.includes(String.fromCharCode(0)), false, '交互源码不得含真实 NUL 字节');
  const 双反斜杠u0000 = `${String.fromCharCode(92)}${String.fromCharCode(92)}u0000`;
  assert.equal(交互源码.includes(双反斜杠u0000), false, '队列键不得退化成可见的双反斜杠 u0000 文本');
  assert.match(邀约段, /前序\.catch\(\(\) => undefined\)\.then\(任务\)/);
  const 占锁位 = 邀约段.indexOf('开始会话输入');
  const 入队位 = 邀约段.indexOf('await 排队手机邀约(邀约聊天ID');
  const 首次写位 = 邀约段.indexOf('await 写库增量');
  assert.ok(占锁位 >= 0 && 入队位 > 占锁位 && 首次写位 > 入队位, '第一次 await 前必须已占会话输入锁');
  assert.ok(
    (邀约段.match(/if \(!邀约仍有效\(\)\) return;/g) ?? []).length >= 3,
    '每个 await 后都必须租约复核',
  );
  assert.match(邀约段, /await 同步社交轨迹\([\s\S]{0,400}邀约仍有效,\s*\);[\s\S]{0,80}if \(!邀约仍有效\(\)\) return;/);
  assert.match(邀约段, /let 率 = \[0\.35, 0\.55, 0\.75, 0\.9, 0\.98\]/);
  assert.match(邀约段, /节点\.妻\.好感值 >= 70/);
  assert.match(邀约段, /丈夫在楼\(节点, m, 钟\) !== '外出'/);
  assert.match(邀约段, /seededRandom\(钟, m, '赴约'\) < 率/);
  assert.match(邀约段, /!读赴约条\(楼\) && seededRandom/);
  assert.match(邀约段, /赴约提交: \{ m, 起楼: 回复楼, 至楼: 回复楼 \+ 2 \}/);
  assert.match(邀约段, /实际应 = false;/);
  assert.match(邀约段, /刚刚临时有点事，今天恐怕出不去了…改天好吗？/);
  assert.match(邀约段, /排队刷新微信进展摘要\(m\)/);
  assert.match(邀约段, /事件键: `RQP-约-\$\{m\}-\$\{楼\}`/);
});

test('群聊不变量：楼务公开边界、姐妹群复用共享一拍、逐气泡延迟与每气泡增量提交保留', () => {
  const 楼务段 = 截源(交互源码, 'async function 楼务群一拍', '/** 玩家手动群消息的 AI 接话');
  assert.match(楼务段, /只谈公共可见的物业与邻里事项/);
  assert.match(楼务段, /严禁虚构名单外住户/);
  assert.match(楼务段, /m\.会话 === '群' && m\.类 !== '撤回'/);
  const 手动段 = 截源(交互源码, '/** 玩家手动群消息的 AI 接话', '// ── 单聊/群聊发送');
  assert.match(手动段, /await 楼务群一拍\(data, 库, 楼, 起因, 控制\)/);
  assert.match(手动段, /await 姐妹群一拍\(data, 库, 楼, 起因, 控制\)/);
  assert.match(手动段, /Math\.min\(1800, 650 \+ 消息\.文\.length \* 28\)/);
  assert.match(手动段, /读到改: \{ \[会话\]: 创建手机已读时锚\(楼, 钟\) \}/);
});

test('玩家发送不变量：会议硬门、冻结聊天/楼/绝对时段、绿黄红灯、预留 ID 与 finally 收口保留', () => {
  const 发送段 = 截源(交互源码, 'async function 发消息(', 'async function 执行待回复批次(');
  assert.match(发送段, /const 冻结原因 = 获取会议会话禁用原因\(发送前数据, 会话\)/);
  assert.match(发送段, /聊天ID: 发送聊天ID,[\s\S]*时间线租约,[\s\S]*数据: 发送前数据,[\s\S]*楼: 发送楼,[\s\S]*绝对时段: 发送绝对时段/);
  assert.match(发送段, /会场摘要租约: 创建会场私聊摘要租约\(发送前数据, 发送聊天ID\)/);
  assert.match(发送段, /批次状态\.灯 === '红'/);
  assert.match(发送段, /登记会话待回复\(上下文\)/);
  const 预留位 = 发送段.indexOf('开始写入(键, 玩家消息标识)');
  const 首次写位 = 发送段.indexOf('await 写库增量');
  assert.ok(预留位 >= 0 && 首次写位 > 预留位, '必须在第一次异步写前预留消息 ID');
  assert.match(发送段, /finally\s*\{[\s\S]*手机聊天批次\.完成写入\(键, 玩家消息标识, 已成功落库\)/);
  assert.match(发送段, /释放会话待回复\(键\)/);
  assert.match(发送段, /写会场私聊摘要\(会话 as 门牌, undefined, 发送租约\.会场摘要租约\)/);
});

test('批次不变量：独立 generation_id、单次请求、按预留 ID 顺序组装、空批提示与全收口保留', () => {
  const 批次段 = 截源(交互源码, 'async function 执行待回复批次(', 'async function 执行批次聊天回复(');
  assert.match(批次段, /活动生成ID = `rq-phone-/);
  assert.match(批次段, /单次请求: true/);
  assert.match(批次段, /请求\.消息标识\s*\.map\(标识\s*=>/);
  assert.match(批次段, /手机记录在当前时间线\(m, 末楼\(\), 当前手机绝对时段\(\)\)/);
  assert.match(批次段, /m\.类 !== '撤回'/);
  assert.match(批次段, /这次手机回复没有生成成功。你发出的消息仍保留；重新发一条即可继续聊天。/);
  assert.match(批次段, /执行手机聊天批次任务\(/);
  // 无拒绝生命周期收口：完成请求/同批次身份校验释放/重绘/红点全部注册，即使前项抛错也继续
  assert.match(批次段, /手机聊天批次\.完成请求\(请求\.键, 请求\.请求序号, true\)/);
  assert.match(批次段, /取会话待回复\(请求\.键\) === 本次上下文/);
  assert.match(批次段, /释放会话待回复\(请求\.键\)/);
  assert.match(批次段, /\(\) => 请求手机重绘\(\)/);
  assert.match(批次段, /\(\) => 请求刷新手机红点\(\)/);
  // 取消只丢未显示气泡
  assert.match(交互源码, /取消只丢未展示部分，不清玩家消息和已展示回复/);
});

test('妻回复不变量：楼务有效性、会议只读记忆与知识边界、冷落双语义租约、纪律与逐气泡增量写保留', () => {
  const 回复段 = 截源(交互源码, 'async function 执行批次聊天回复', '// 本模块初始化完成时向渲染层注册 P8 业务端口与批次执行器');
  assert.match(回复段, /楼务微信消息仍有效\(m, 有效楼务任务id\)/);
  assert.match(回复段, /会议正文是只读时间线/);
  assert.match(回复段, /随丈夫离开管理员室/);
  assert.match(回复段, /当前聊天ID\(\) !== 回复聊天ID/);
  assert.match(回复段, /冷落指纹相同\(回复冷落指纹, 当前指纹\)/);
  assert.match(回复段, /本轮唯一冷落回复方向/);
  assert.match(回复段, /\$\{家庭事实\(门牌号\)\}/);
  assert.match(回复段, /口吻纪律/);
  assert.match(回复段, /解析微信私聊气泡\(回, 配\.妻名, 手机可见单条硬上限, 5\)/);
  assert.match(回复段, /延迟 = 序 === 0 \? 320 : Math\.min\(1800, 650 \+ 合法回复\.length \* 28\)/);
  assert.match(回复段, /读到改: \{ \[会话\]: 创建手机已读时锚\(回复楼, 回复钟\) \}/);
  assert.match(回复段, /写会场私聊摘要\(门牌号, 已写回复\.join\('\\n'\), 发送租约\.会场摘要租约\)/);
  assert.match(回复段, /排队刷新微信进展摘要\(门牌号\)/);
  // 冷落档与语义指纹只经冷落系统三个稳定 API 取
  assert.match(回复段, /计算妻冷落消息档\(data, 门牌号\)/);
  assert.match(回复段, /冷落语义指纹\(data, 门牌号\)/);
  assert.match(回复段, /冷落私聊方向\(门牌号, 回复冷落档\)/);
});
