/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 内核源码 = readFileSync(new URL('./内核.ts', 手机目录), 'utf8');
const 旁路源码 = readFileSync(new URL('./静音会议旁路.ts', 手机目录), 'utf8');
const 通知桥源码 = readFileSync(new URL('./通知桥.ts', 手机目录), 'utf8');
const 冷落预警源码 = readFileSync(new URL('./冷落预警.ts', 手机目录), 'utf8');
const 父亲通话源码 = readFileSync(new URL('./交互/父亲通话.ts', 手机目录), 'utf8');
const 生成引擎源码 = readFileSync(new URL('./生成引擎.ts', 手机目录), 'utf8');
// P6:自动节拍对通知桥/冷落预警/共享提示纪律的消费点已迁至 ./节拍引擎,相关断言改读新所有者。
const 节拍引擎源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');
// P8:交互业务迁至 ./交互/邀约与发消息,旁路/冷落指纹/共享提示纪律的消费断言改读新所有者。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 门面源码 = readFileSync(new URL('../手机系统.ts', 手机目录), 'utf8');
// P7A:手机发送租约 类型与判据已迁至 ./壳/会话瞬态,相关断言改读新所有者。
const 会话瞬态源码 = readFileSync(new URL('./壳/会话瞬态.ts', 手机目录), 'utf8');
// P7B1:UI 刷新真实实现的注册职责迁至 ./壳/挂载。
const 挂载源码 = readFileSync(new URL('./壳/挂载.ts', 手机目录), 'utf8');
// P7B2:聊天列表迁至 ./壳/渲染/chats、父亲通话 UI 端口注册迁至 ./壳/渲染/index,消费断言改读新所有者。
const 渲染chats源码 = readFileSync(new URL('./壳/渲染/chats.ts', 手机目录), 'utf8');
const 渲染index源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');

/** 剥离块注释与行注释，防说明性注释误命中“可执行源码不得反向引用”断言。 */
function 剥离注释(源码) {
  return 源码.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const 父亲通话可执行源码 = 剥离注释(父亲通话源码);

test('四个新模块真实拥有各自核心定义，内核无重复声明', () => {
  // 静音会议旁路
  assert.match(旁路源码, /export interface 静音会议手机状态 \{/);
  assert.match(旁路源码, /let 静音会议正文生成中 = false;/);
  assert.match(旁路源码, /export function 设置静音会议手机生成中\(生成中: boolean\): void \{/);
  assert.match(旁路源码, /export function 获取静音会议手机状态\(/);
  assert.match(旁路源码, /export function 获取会议会话禁用原因\(/);
  assert.match(旁路源码, /export interface 静音会议正文记忆 \{/);
  assert.match(旁路源码, /export function 取静音会议正文记忆\(/);
  assert.match(旁路源码, /export interface 会场私聊摘要租约 \{/);
  assert.match(旁路源码, /export function 创建会场私聊摘要租约\(/);
  assert.match(旁路源码, /export async function 写会场私聊摘要\(/);
  assert.match(旁路源码, /export function 取会场私聊摘要提示\(/);

  // 通知桥
  assert.match(通知桥源码, /export function 微信好友\(/);
  assert.match(通知桥源码, /export function 编译楼务群公开风闻摘要\(/);
  assert.match(通知桥源码, /function 是管理通知任务\(/);
  assert.match(通知桥源码, /function 管理任务显示文本\(/);
  assert.match(通知桥源码, /export function 编译管理任务微信通知\(/);
  assert.match(通知桥源码, /export async function 同步管理任务微信\(/);

  // 冷落预警
  assert.match(冷落预警源码, /export type 冷落指纹 = NonNullable<ReturnType<typeof 冷落语义指纹>>;/);
  assert.match(冷落预警源码, /export function 冷落指纹相同\(/);
  assert.match(冷落预警源码, /export function 扫描冷落私聊\(/);
  assert.match(冷落预警源码, /export function 当前冷落指纹\(/);
  assert.match(冷落预警源码, /let 冷落预警进行中 = false;/);
  assert.match(冷落预警源码, /export async function 冷落预警节拍\(\): Promise<void> \{/);

  // 父亲通话
  assert.match(父亲通话源码, /type 父亲通话状态 = SchemaType\['系统'\]\['_父亲通话'\];/);
  assert.match(父亲通话源码, /export function 活动父亲通话\(/);
  assert.match(父亲通话源码, /export function 母亲圆场手机提示\(/);
  assert.match(父亲通话源码, /async function 持久修改父亲通话\(/);
  assert.match(父亲通话源码, /export function 来电已接\(/);
  assert.match(父亲通话源码, /export async function 恢复父亲通话\(/);
  assert.match(父亲通话源码, /async function 父亲台词\(/);
  assert.match(父亲通话源码, /async function 推进父亲回复\(/);
  assert.match(父亲通话源码, /export async function 通话应答\(/);
  assert.match(父亲通话源码, /async function 确保父亲通话完成消息\(/);
  assert.match(父亲通话源码, /async function 完成父亲通话\(/);
  assert.match(父亲通话源码, /export async function 结束通话\(/);
  assert.match(父亲通话源码, /export function 父亲通话已清理\(/);

  // 内核不再重复声明这些实现
  const 内核禁止声明 = [
    /function 微信好友\(/,
    /function 编译楼务群公开风闻摘要\(/,
    /function 编译管理任务微信通知\(/,
    /async function 同步管理任务微信\(/,
    /async function 冷落预警节拍\(/,
    /function 扫描冷落私聊\(/,
    /function 当前冷落指纹\(/,
    /function 冷落指纹相同\(/,
    /function 持久修改父亲通话\(/,
    /function 父亲台词\(/,
    /async function 推进父亲回复\(/,
    /async function 通话应答\(/,
    /async function 结束通话\(/,
    /async function 完成父亲通话\(/,
    /function 父亲通话主题\(/,
    /function 母亲圆场手机提示\(/,
    /function 取会场私聊摘要提示\(/,
    /function 取静音会议正文记忆\(/,
    /function 写会场私聊摘要\(/,
    /function 创建会场私聊摘要租约\(/,
    /function 获取静音会议手机状态\(/,
    /function 设置静音会议手机生成中\(/,
    /function 称呼纪律\(\)/,
    /function 家庭事实\(/,
    /const 口吻纪律 =/,
    /interface 会场私聊摘要租约 \{/,
    /interface 静音会议手机状态 \{/,
    /type 冷落指纹 =/,
    /type 父亲通话状态 =/,
  ];
  for (const 模式 of 内核禁止声明) {
    assert.doesNotMatch(内核源码, 模式, `内核不应再自行声明:${模式}`);
  }
});

test('四模块均不 import 内核/旧门面，依赖方向无环', () => {
  const 模块表 = [
    ['静音会议旁路', 旁路源码],
    ['通知桥', 通知桥源码],
    ['冷落预警', 冷落预警源码],
    ['交互/父亲通话', 父亲通话源码],
  ];
  for (const [名称, 源码] of 模块表) {
    assert.doesNotMatch(源码, /from '\.\.\/内核'/, `${名称}不得反向 import 内核`);
    assert.doesNotMatch(源码, /from '\.\/内核'/, `${名称}不得反向 import 内核`);
    assert.doesNotMatch(源码, /from '\.\.\/手机系统'/, `${名称}不得反向 import 门面`);
    assert.doesNotMatch(源码, /from '\.\/手机系统'/, `${名称}不得反向 import 门面`);
  }
  // 单向依赖：冷落可依赖通知桥的好友表；父亲可依赖静音会议旁路；其余方向禁止。
  assert.match(冷落预警源码, /import \{ 微信好友 \} from '\.\/通知桥';/);
  assert.match(父亲通话源码, /import \{ 获取静音会议手机状态 \} from '\.\.\/静音会议旁路';/);
  assert.doesNotMatch(通知桥源码, /静音会议旁路|冷落预警|交互\/父亲通话/, '通知桥不得依赖其余 P5 模块');
  assert.doesNotMatch(旁路源码, /通知桥|冷落预警|交互\/父亲通话/, '静音会议旁路不得依赖其余 P5 模块');
  assert.doesNotMatch(冷落预警源码, /静音会议旁路|交互\/父亲通话/, '冷落预警不得依赖旁路或父亲通话');
  assert.doesNotMatch(父亲通话源码, /通知桥|冷落预警/, '父亲通话不得依赖通知桥或冷落预警');
});

test('内核正确 re-export 既有公共 API（P8 精确收口），旧门面仍是纯 re-export', () => {
  // P8:旁路五个业务符号的消费点迁至交互模块,内核只 re-export 设置/获取/取会场私聊摘要提示 三个。
  assert.match(
    交互源码,
    /import \{[\s\S]*获取会议会话禁用原因,[\s\S]*获取静音会议手机状态,[\s\S]*取静音会议正文记忆,[\s\S]*创建会场私聊摘要租约,[\s\S]*写会场私聊摘要,[\s\S]*\} from '\.\.\/静音会议旁路';/,
  );
  assert.doesNotMatch(内核源码, /获取会议会话禁用原因|取静音会议正文记忆/, '内核不得再消费被收口的旁路符号');
  // P7A:手机发送租约 类型迁至 ./壳/会话瞬态；其会场摘要租约字段改用旁路模块导出的类型。
  assert.match(会话瞬态源码, /import \{[\s\S]*type 会场私聊摘要租约[,]?[\s\S]*\} from '\.\.\/静音会议旁路';/);
  assert.match(会话瞬态源码, /会场摘要租约: 会场私聊摘要租约 \| null;/);
  // P7B2:聊天列表迁至 ./壳/渲染/chats 后,微信好友 改由节拍引擎/冷落预警/渲染chats 从各自正确相对路径消费,内核不再直接 import。
  assert.match(
    节拍引擎源码,
    /import \{[\s\S]*微信好友,[\s\S]*编译楼务群公开风闻摘要,[\s\S]*同步管理任务微信,?[\s\S]*\} from '\.\/通知桥';/,
  );
  assert.ok((节拍引擎源码.match(/微信好友\(/g) ?? []).length >= 1, '节拍引擎应在 import 之外调用 微信好友()');
  assert.match(冷落预警源码, /import \{ 微信好友 \} from '\.\/通知桥';/);
  assert.ok((冷落预警源码.match(/微信好友\(/g) ?? []).length >= 1, '冷落预警应在 import 之外调用 微信好友()');
  assert.match(渲染chats源码, /import \{ 微信好友 \} from '\.\.\/\.\.\/通知桥';/);
  assert.ok((渲染chats源码.match(/微信好友\(/g) ?? []).length >= 1, '渲染chats 应在 import 之外调用 微信好友()');
  // P6:自动节拍的 冷落预警节拍/扫描冷落私聊 由节拍引擎 import；P8:妻回复语义校验所需的两个指纹函数改由交互模块 import。
  assert.match(交互源码, /import \{[\s\S]*当前冷落指纹,[\s\S]*冷落指纹相同,?[\s\S]*\} from '\.\.\/冷落预警';/);
  assert.match(节拍引擎源码, /import \{[\s\S]*冷落预警节拍,[\s\S]*扫描冷落私聊,?[\s\S]*\} from '\.\/冷落预警';/);
  // P7B2:父亲通话 UI 端口注册迁至 ./壳/渲染/index,内核不再 import 活动父亲通话/注册父亲通话UI端口。
  assert.match(渲染index源码, /import \{[^}]*活动父亲通话[^}]*\} from '\.\.\/\.\.\/交互\/父亲通话';/);
  assert.match(渲染index源码, /import \{[^}]*恢复父亲通话[^}]*\} from '\.\.\/\.\.\/交互\/父亲通话';/);
  assert.match(渲染index源码, /import \{[^}]*注册父亲通话UI端口[^}]*\} from '\.\.\/\.\.\/交互\/父亲通话';/);
  assert.ok(
    (渲染index源码.match(/活动父亲通话\(/g) ?? []).length >= 1,
    '渲染index 应在 import 之外调用 活动父亲通话()',
  );
  assert.ok(
    (渲染index源码.match(/注册父亲通话UI端口\(/g) ?? []).length >= 1,
    '渲染index 应在 import 之外调用 注册父亲通话UI端口()',
  );
  assert.match(渲染index源码, /注册手机挂载端口\(\{[\s\S]*恢复父亲通话,/, '恢复父亲通话 应经渲染index 接入挂载端口');
  // P8 精确收口：保留 18 个真实消费者符号，移除 10 个无人从门面使用的导出；门面继续纯转发。
  assert.doesNotMatch(内核源码, /export type \{ 静音会议手机状态, 静音会议正文记忆 \}/);
  assert.doesNotMatch(
    内核源码,
    /export \{ 微信好友, 编译楼务群公开风闻摘要, 编译管理任务微信通知, 同步管理任务微信 \}/,
  );
  assert.doesNotMatch(内核源码, /export[^\n]{0,120}获取会议会话禁用原因/);
  assert.doesNotMatch(内核源码, /export[^\n]{0,120}取静音会议正文记忆/);
  assert.match(
    内核源码,
    /export \{[\s\S]*设置静音会议手机生成中,[\s\S]*获取静音会议手机状态,[\s\S]*取会场私聊摘要提示[\s\S]*\} from '\.\/静音会议旁路';/,
  );
  assert.match(内核源码, /export \{ 冷落预警节拍 \} from '\.\/冷落预警';/);
  assert.match(内核源码, /export \{ 来电已接, 父亲通话已清理 \} from '\.\/交互\/父亲通话';/);
  assert.match(门面源码, /export \* from '\.\/手机\/内核'/);
});

test('静音会议正文记忆、摘要租约、气口低信息回流和正文生成瞬时锁仍在', () => {
  assert.match(旁路源码, /上界固定为最新成功落库的 AI 楼/);
  assert.match(旁路源码, /const 启动楼层 = Math\.max\(0, Math\.min\(Math\.round\(场\.启动楼层\)/);
  assert.match(旁路源码, /冻结聊天与本场会议身份/);
  assert.match(旁路源码, /场\.会场私聊摘要\[门牌号\] = 气口;/);
  assert.match(旁路源码, /只保存固定枚举气口/);
  assert.match(旁路源码, /绝不把字段原文注入正文/);
  assert.match(旁路源码, /她刚留意到玩家发来的私下消息/);
  assert.match(旁路源码, /const 会场私聊气口 = \['收到消息', '克制紧张', '试探犹疑', '亲近默契'\] as const;/);
  // 瞬时锁：setter 不再直调内核 刷新红点，改走 UI 刷新注册表。
  assert.match(旁路源码, /if \(静音会议正文生成中 === 生成中\) return;/);
  assert.match(旁路源码, /请求刷新手机红点\(\);/);
  assert.doesNotMatch(旁路源码, /刷新红点\(\)/);
});

test('通知键 `楼务:${任务.id}`、公开风闻脱敏和好友规则仍在', () => {
  assert.match(通知桥源码, /键: `楼务:\$\{任务\.id\}`/);
  assert.match(通知桥源码, /任务\.公开摘要 \|\| 任务\.模板/);
  assert.match(通知桥源码, /严禁直接进入群聊提示词/);
  assert.match(通知桥源码, /有住户反映家中物品异常/);
  assert.doesNotMatch(通知桥源码, /事件\.摘要/);
  assert.match(通知桥源码, /已入住微信妻友门牌\(data\)/);
  assert.match(通知桥源码, /姐妹群成员\(data\)\.length >= 2/);
  // 消息落库只刷新 UI；孕情必须等会话页真实已读水位覆盖后才返回确认凭据。
  assert.match(
    通知桥源码,
    /if \(已写\) \{\s*请求刷新手机红点\(\);\s*请求手机重绘\(\);\s*\}/,
    '成功落库后只刷新红点与手机界面',
  );
  assert.match(通知桥源码, /export function 怀孕确认微信已读凭据[\s\S]*?消息已读\(/, '真实已读水位才生成孕情确认凭据');
  assert.doesNotMatch(通知桥源码, /通知孕情已送达/, '消息落库不得直接公开孕情或起算孕期');
  assert.doesNotMatch(通知桥源码, /刷新红点\(\)|渲染\(/);
});

test('冷落语义双重租约、重入补跑、一次一户和带联系周期的 `冷落:` 幂等键仍在', () => {
  assert.match(冷落预警源码, /构造微信联系保护表\(库\.消息, 钟\)/);
  assert.match(
    冷落预警源码,
    /键 = 构造冷落预警去重键\(门牌号, 指纹\.成长轮次, 档, 指纹\.冷落周期锚\)/,
  );
  assert.match(冷落预警源码, /const 兼容旧键 = 指纹\.冷落周期锚 === 上次成长锚/);
  assert.match(
    冷落预警源码,
    /消息 => \(消息\.键 === 键 \|\| \(兼容旧键 !== '' && 消息\.键 === 兼容旧键\)\) && 消息\.楼 <= 楼/,
  );
  assert.match(冷落预警源码, /待发候选\.sort\(\(a, b\) => b\.档 - a\.档/);
  assert.match(冷落预警源码, /\.待发候选\[0\]/);
  assert.match(冷落预警源码, /第一道语义租约/);
  assert.match(冷落预警源码, /第二道语义租约/);
  assert.match(冷落预警源码, /写库增量\([\s\S]*冷落语义仍有效/);
  assert.match(冷落预警源码, /if \(冷落预警进行中\) \{\s*冷落预警待补 = true;\s*return;\s*\}/);
  assert.match(冷落预警源码, /finally[\s\S]*冷落预警进行中 = false;[\s\S]*void 冷落预警节拍\(\)/);
  // 成功写入后经 UI 刷新注册表请求红点与重绘，不直调内核实现。
  assert.match(冷落预警源码, /if \(!已写\) return;\s*请求刷新手机红点\(\);\s*请求手机重绘\(\);/);
  assert.doesNotMatch(冷落预警源码, /刷新红点\(\)|渲染\(/);
});

test('父亲回复/收尾幂等键、MVU→父亲双锁顺序、完成消息键与社交轨迹事件键仍在', () => {
  assert.match(
    父亲通话源码,
    /const 生成键 = `\$\{预期聊天ID\}\|\$\{回复请求时间线世代\}\|\$\{通话\.标识\}:\$\{序号\}`/,
  );
  assert.match(父亲通话源码, /`待回复\.序号` 是持久幂等令牌/);
  assert.match(父亲通话源码, /const 本次收尾提交键 = `\$\{预期聊天ID\}\|\$\{预期时间线世代\}\|\$\{通话\.标识\}`/);
  assert.match(父亲通话源码, /父亲收尾提交键 === 本次收尾提交键/);
  // 双锁顺序：全局 MVU 外锁 → 父亲整表内锁 → 内锁后重读最新整表。
  const 持久写 = 父亲通话源码.slice(父亲通话源码.indexOf('async function 持久修改父亲通话'));
  const 外锁位 = 持久写.indexOf('排队MVU操作');
  const 内锁位 = 持久写.indexOf('排队父亲通话整表写');
  const 重读位 = 持久写.indexOf('读取最近有效()', 内锁位);
  assert.ok(外锁位 >= 0 && 内锁位 > 外锁位 && 重读位 > 内锁位, '双锁必须保持“全局 MVU → 父亲通话”并内锁后重读');
  assert.match(父亲通话源码, /全项目双锁顺序固定为“全局 MVU → 父亲通话”/);
  assert.match(父亲通话源码, /const 消息键 = `父亲通话:\$\{通话\.标识\}`/);
  assert.match(父亲通话源码, /事件键: `RQP-来电-\$\{最新\.标识\}`/);
  assert.match(父亲通话源码, /eventEmit\('人妻公寓:父亲通话结束', 通话\.标识, 预期聊天ID\)/);
  assert.match(父亲通话源码, /eventEmit\('人妻公寓:提示', '父亲那边信号断了一下；重新打开手机会继续这句。'\)/);
});

test('父亲模块通过端口导航且业务模块刷新均走 UI 注册表', () => {
  assert.match(父亲通话源码, /export interface 父亲通话UI端口 \{/);
  assert.match(父亲通话源码, /打开通话页\(\): void;/);
  assert.match(父亲通话源码, /返回会话页\(\): void;/);
  assert.match(父亲通话源码, /正在通话页\(\): boolean;/);
  assert.match(父亲通话源码, /export function 注册父亲通话UI端口\(端口: 父亲通话UI端口\): void \{/);
  assert.match(父亲通话源码, /已注册UI端口\?\.打开通话页\(\);/);
  assert.match(父亲通话源码, /已注册UI端口\?\.返回会话页\(\);/);
  assert.match(父亲通话源码, /已注册UI端口\?\.正在通话页\(\) \?\? false;/);
  assert.match(父亲通话源码, /if \(正在通话页\(\)\) 请求手机重绘\(\);/);
  // 先剥离注释再断言：说明性注释允许提到 当前页/渲染/刷新红点，可执行源码不得引用。
  assert.doesNotMatch(父亲通话可执行源码, /当前页|渲染\(|刷新红点\(\)/, '父亲业务不得反向引用 当前页/渲染/刷新红点');
  // P7B2:端口实现注册迁至渲染调度器 ./壳/渲染/index 的模块初始化处；P7B1:UI 刷新真实实现仍只由挂载层注册。
  assert.match(渲染index源码, /注册父亲通话UI端口\(\{/);
  assert.match(渲染index源码, /打开通话页\(\) \{\s*当前页 = \{ 名: 'talk' \};\s*\}/);
  assert.match(渲染index源码, /返回会话页\(\) \{\s*当前页 = \{ 名: 'chats' \};\s*\}/);
  assert.match(渲染index源码, /正在通话页\(\) \{\s*return 当前页\.名 === 'talk';\s*\}/);
  assert.match(挂载源码, /注册手机UI刷新实现\(端口\.重绘, 端口\.刷新红点\);/);
  assert.doesNotMatch(内核源码, /注册手机UI刷新实现\(/);
  // 业务模块刷新一律经 UI 刷新注册表。
  for (const [名称, 源码] of [
    ['静音会议旁路', 旁路源码],
    ['通知桥', 通知桥源码],
    ['冷落预警', 冷落预警源码],
    ['交互/父亲通话', 父亲通话源码],
  ]) {
    assert.match(
      源码,
      /import \{[^}]*请求刷新手机红点[^}]*\} from '\.\.?\/UI刷新'/,
      `${名称}应经 UI 刷新注册表请求红点`,
    );
  }
});

test('三个共享提示纪律只有一个定义，文本和调用点未弱化', () => {
  // 唯一所有者：生成引擎
  assert.match(生成引擎源码, /export function 称呼纪律\(\): string \{/);
  assert.match(生成引擎源码, /对方是公寓管理员,名叫"\$\{玩家名\(\)\}"/);
  assert.match(生成引擎源码, /严禁臆造别的姓氏或称呼\(如"王师傅\/李哥"\)/);
  assert.match(生成引擎源码, /export function 家庭事实\(m: 门牌\): string \{/);
  assert.match(生成引擎源码, /提到丈夫只能用这个名字,严禁写错或换成别人/);
  assert.match(生成引擎源码, /export const 口吻纪律 =/);
  assert.match(生成引擎源码, /口吻连续性:微信里的她必须和现实中的态度连续/);
  assert.match(生成引擎源码, /\$\{玩家名\(\)\}"或"管理员"\(关系近了可用由这个名字自然衍生的昵称\)/);
  // 调用点未弱化：冷落预警、自动节拍（节拍引擎）与内核都继续消费同一文本
  assert.match(冷落预警源码, /\$\{称呼纪律\(\)\}\$\{口吻纪律\}/);
  // P6:自动朋友圈/私聊/群聊调用点已迁至节拍引擎
  assert.match(节拍引擎源码, /\$\{称呼纪律\(\)\}[\s\S]{0,600}\$\{口吻纪律\}/);
  assert.match(节拍引擎源码, /称呼纪律\(\) \+/);
  assert.match(节拍引擎源码, /\$\{家庭事实\(m\)\}/);
  // P8:交互模块仍有手动邀约/私聊调用点：口吻纪律作为小生成系统提示拼接，家庭事实/称呼纪律可执行调用存在
  assert.match(交互源码, /\$\{家庭事实\(m\)\}/);
  assert.match(交互源码, /\$\{家庭事实\(门牌号\)\}/);
  assert.match(交互源码, /\$\{称呼纪律\(\)\}/);
  assert.match(交互源码, /await 小生成\([\s\S]{0,600}口吻纪律/);
  // 调用点仍从生成引擎 import（真实共享，不是各写一份）
  assert.match(交互源码, /import \{[\s\S]*称呼纪律,[\s\S]*家庭事实,[\s\S]*口吻纪律,[\s\S]*\} from '\.\.\/生成引擎';/);
  assert.match(节拍引擎源码, /import \{[\s\S]*称呼纪律,[\s\S]*家庭事实,[\s\S]*口吻纪律,[\s\S]*\} from '\.\/生成引擎';/);
  assert.match(冷落预警源码, /import \{ 称呼纪律, 家庭事实, 口吻纪律, 小生成, 微信短文本 \} from '\.\/生成引擎';/);
});
