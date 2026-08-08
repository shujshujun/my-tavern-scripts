/* eslint-disable import-x/no-nodejs-modules -- Node-only regression + behavioral test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { 规范变量解析通道, 读取变量解析通道, 选择变量解析通道 } from '../../src/人妻公寓/MVU解析模式.ts';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 引擎源码 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const 设置源码 = 读('src/人妻公寓/界面/客户端/components/设置弹窗.vue');

test('路由矩阵：自动 数据库可用优先于自定义', () => {
  assert.equal(选择变量解析通道('自动', true, true), '数据库');
  assert.equal(选择变量解析通道('自动', true, false), '数据库');
});

test('路由矩阵：自动 无数据库但有自定义 → 自定义；两者都没有 → null', () => {
  assert.equal(选择变量解析通道('自动', false, true), '自定义');
  assert.equal(选择变量解析通道('自动', false, false), null);
});

test('路由矩阵：显式自定义配置完整才走自定义，配置不完整绝不偷偷改走数据库', () => {
  assert.equal(选择变量解析通道('自定义', false, true), '自定义');
  assert.equal(选择变量解析通道('自定义', true, true), '自定义');
  assert.equal(选择变量解析通道('自定义', true, false), null);
  assert.equal(选择变量解析通道('自定义', false, false), null);
});

test('旧偏好 正文 与非法值统一规范为 自动，读取默认也落回 自动', () => {
  assert.equal(规范变量解析通道('正文'), '自动');
  assert.equal(规范变量解析通道('自动'), '自动');
  assert.equal(规范变量解析通道('自定义'), '自定义');
  assert.equal(规范变量解析通道(undefined), '自动');
  assert.equal(规范变量解析通道('乱写的值'), '自动');
  // Node 无偏好存储时读取默认自动；旧档的 正文 同理落回 自动，不出现无选中态。
  assert.equal(读取变量解析通道(), '自动');
});

test('读取MVU外置模型配置 JSDoc 不再声称数据库/正文通道兜底', () => {
  const 解析模式源码 = 读('src/人妻公寓/MVU解析模式.ts');
  const 函数起点 = 解析模式源码.indexOf('export function 读取MVU外置模型配置');
  assert.ok(函数起点 !== -1, '读取MVU外置模型配置 应存在');
  const JSDoc段 = 解析模式源码.slice(Math.max(0, 函数起点 - 400), 函数起点);
  assert.doesNotMatch(JSDoc段, /数据库\/正文通道兜底/, 'JSDoc 不再声称走数据库/正文通道兜底');
  assert.doesNotMatch(JSDoc段, /正文通道/, 'JSDoc 不再提及正文通道');
  assert.match(JSDoc段, /绝不回落正文 API/, 'JSDoc 明确配置缺失绝不回落正文 API');
});

test('设置页不再出现"正文API"按钮，文案说明无可用独立模型时提示配置', () => {
  assert.doesNotMatch(设置源码, />正文API</, '正文API分段按钮已删除');
  assert.doesNotMatch(设置源码, /选择解析通道\('正文'\)/, '正文通道点击已删除');
  assert.doesNotMatch(设置源码, /解析通道 === '正文'/, '正文通道选中态已删除');
  assert.match(设置源码, /不会占用正文 API/, '文案明确不会占用正文 API');
  assert.match(设置源码, /仅提示去配置/, '文案明确两者都没有时提示配置');
  assert.match(设置源码, /选择解析通道\('自动'\)/, '自动分段按钮仍在');
  assert.match(设置源码, /选择解析通道\('自定义'\)/, '自定义分段按钮仍在');
});

test('内置外置变量解析段内不存在正文通道与等待正文生成调用，使用路由矩阵纯函数', () => {
  const 段起点 = 引擎源码.indexOf('async function 内置外置变量解析');
  const 段终点 = 引擎源码.indexOf('async function 补模型变量结算');
  assert.ok(段起点 !== -1 && 段终点 !== -1, '内置外置变量解析函数段应存在');
  const 段 = 引擎源码.slice(段起点, 段终点);
  assert.doesNotMatch(段, /'正文'/, '函数段内不存在正文通道字样');
  assert.doesNotMatch(段, /等待正文生成\(/, '内置外置变量解析不再调用等待正文生成');
  assert.match(段, /选择变量解析通道\(/, '内置外置变量解析使用路由矩阵纯函数');
  // 等待正文生成仍被正文主流程使用，不得被全文件删除
  assert.match(引擎源码, /等待正文生成\(/, '等待正文生成仍存在于正文主流程');
});

test('未配置结果不进入第二次请求，提示文案只有一个触发点', () => {
  const 提示文案 =
    '没有可用的外置变量模型。请在游戏设置 → 变量解析中填写自定义 API；本轮正文已保留，变量暂不更新。';
  assert.equal(引擎源码.split(提示文案).length - 1, 1, '未配置提示文案只有一个触发点');
  const 循环起点 = 引擎源码.indexOf('for (let 次 = 1; 次 <= 2 && !内置变量块; 次++)');
  assert.ok(循环起点 !== -1, '内置变量解析重试循环存在');
  const 循环段 = 引擎源码.slice(循环起点, 循环起点 + 1200);
  assert.match(循环段, /结果\.结果 === '未配置'/, '未配置分支存在');
  assert.match(循环段, /break;/, '未配置后直接跳出循环，不进入第二次请求');
});

test('原有官方 MVU 按钮路线仍存在', () => {
  assert.match(引擎源码, /MVU解析\.自动请求 &&[\s\S]*?await eventEmit\('人妻公寓:MVU外置模型重试'\)/, '官方外置模型重试事件保持');
  assert.match(引擎源码, /读取MVU解析状态/, 'MVU 状态读取保持');
});
