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

test('自定义表单有明确“读取模型”按钮，走宿主 getModelList 代理而非 iframe 直接 fetch', () => {
  assert.match(设置源码, />读取模型<\/button>/, '存在明确读取模型按钮');
  assert.match(设置源码, /getModelList\(\{ apiurl: base, key \}\)/, '读取模型调用宿主 getModelList 代理');
  assert.doesNotMatch(设置源码, /\bfetch\s*\(/, '设置组件不得直接 fetch 外部 API');
});

test('模型列表逐项转字符串、trim、去空、去重并排序；下拉选择只写表单草稿', () => {
  assert.match(设置源码, /map\(String\)/, '逐项转字符串');
  assert.match(设置源码, /map\(模型 => 模型\.trim\(\)\)/, '逐项 trim');
  assert.match(设置源码, /filter\(Boolean\)/, '去空');
  assert.match(设置源码, /new Set\(/, '去重');
  assert.match(设置源码, /\.sort\(\(a, b\) => a\.localeCompare\(b\)\)/, '排序');
  assert.match(设置源码, /v-model="解析API表单\.模型名称"/, '下拉选择绑定表单草稿(模型名称)');
});

test('存在“保存并启用”按钮与独立提交函数：只有它写 MVU 配置，写入成功后才写自定义通道', () => {
  assert.match(设置源码, />保存并启用<\/button>/, '存在明确保存并启用按钮');
  assert.doesNotMatch(设置源码, /function 提交解析API表单/, '失焦自动提交函数已删除');
  assert.doesNotMatch(设置源码, /@change="提交解析API表单"|@blur="提交解析API表单"/, '不再有失焦自动提交');
  const 保存段 = 设置源码.slice(设置源码.indexOf('function 保存并启用'), 设置源码.indexOf('</script>'));
  assert.match(保存段, /const 成功 = 写入MVU设置\(\{/, '保存函数调用 写入MVU设置 并保留返回值');
  assert.match(保存段, /if \(成功\)[\s\S]{0,80}写入变量解析通道\('自定义'\)/, '写入成功后才写自定义解析通道');
  assert.doesNotMatch(保存段, /写入变量解析通道\('自动'\)/, '保存函数只写自定义通道');
  // 切通道分段按钮不写 MVU 配置、不立即写自定义通道（自定义只走完整表单+保存）
  const 通道段 = 设置源码.slice(设置源码.indexOf('function 选择解析通道'), 设置源码.indexOf('function 保存并启用'));
  assert.doesNotMatch(通道段, /写入MVU设置/, '切通道按钮不写 MVU 配置');
  assert.doesNotMatch(通道段, /写入变量解析通道\('自定义'\)/, '切自定义按钮不立即写自定义通道');
  assert.equal(
    (设置源码.match(/写入变量解析通道\('自定义'\)/g) ?? []).length,
    1,
    '自定义通道只由保存函数写入一次',
  );
});

test('API 地址、Key、模型与数值输入框不再通过 @change／@blur 自动提交', () => {
  for (const 字段 of ['api地址', '密钥', '模型名称', '温度', 'top_p', '最大回复token数']) {
    assert.doesNotMatch(设置源码, new RegExp(`解析API表单\\.${字段}[^>]*@change`), `${字段} 输入框不得 @change 自动提交`);
    assert.doesNotMatch(设置源码, new RegExp(`解析API表单\\.${字段}[^>]*@blur`), `${字段} 输入框不得 @blur 自动提交`);
  }
  assert.doesNotMatch(设置源码, /提交解析API表单/, '自动提交逻辑已整体移除');
});

test('读取中禁用按钮；读取失败与保存失败都有可见反馈；失败不清空表单、不切换通道', () => {
  assert.match(设置源码, /:disabled="读取模型中"/, '读取中禁用读取按钮');
  assert.match(设置源码, /自定义反馈/, '存在可见反馈状态');
  assert.match(设置源码, /自定义反馈类型/, '反馈带类型(成功/失败)');
  assert.match(设置源码, /读取模型失败/, '读取失败有可见原因');
  assert.match(设置源码, /保存失败/, '保存失败有可见反馈');
  assert.match(设置源码, /已保存并启用/, '保存成功有可见反馈');
  assert.match(设置源码, /安全错误反馈\(e, key\)/, '宿主错误反馈先按当前 Key 脱敏');
  assert.match(设置源码, /\.split\(密钥\)\.join\('\*\*\*'\)/, '错误文本不会把 API Key 回显到界面');
  assert.match(设置源码, /const 地址 = 解析API表单\.api地址\.trim\(\)\.replace\(\/\\\/\+\$\/, ''\)/, '保存与读取统一去掉末尾斜杠');
});
