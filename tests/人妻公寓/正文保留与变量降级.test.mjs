/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

const {
  提取纯控制协议尾段,
  是当前正文流事件,
  选择正文生成原文,
  更新有效流式正文,
} = require('../../src/人妻公寓/脚本/游戏逻辑/正文生成完整性.ts');
const { 严格清除协议残留, 清除末尾裸JSON补丁 } = require('../../src/人妻公寓/脚本/游戏逻辑/严格正文清洗.ts');
const 回合源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

const 清掉变量协议 = 原文 =>
  String(原文 ?? '')
    .replace(/<UpdateVariable\b[^>]*>[\s\S]*?(?:<\/UpdateVariable\s*>|$)/gi, '')
    .trim();

test('最终返回丢失正文时采用同一正文请求的完整流式缓存', () => {
  const 流式正文 = '夏乔把工具递了过来，等着玩家处理漏水。\n<UpdateVariable>[]</UpdateVariable>';
  assert.equal(选择正文生成原文('', 流式正文, 清掉变量协议), 流式正文);
  assert.equal(选择正文生成原文('<UpdateVariable>[]</UpdateVariable>', 流式正文, 清掉变量协议), 流式正文);
});

test('最终返回本身含有效正文时不让较早的流式片段覆盖它', () => {
  assert.equal(选择正文生成原文('最终完整正文', '较早的流式片段', 清掉变量协议), '最终完整正文');
});

test('正文模型只回传 JSONPatch 尾段与孤立外层闭标签时必须判为纯协议', () => {
  const 协议尾段 = `<JSONPatch>
[
  { "op": "replace", "path": "/户/101/妻/好感值", "value": 1 },
  { "op": "replace", "path": "/户/101/妻/当前情绪", "value": "愉快" }
]
</JSONPatch>
</UpdateVariable>`;
  const 完整流式正文 = '夏乔看着修好的水管，神情终于松了下来。';

  assert.equal(严格清除协议残留(协议尾段), '', '孤立 </UpdateVariable> 不能被误认成正文');
  const 采用结果 = 选择正文生成原文(协议尾段, 完整流式正文, 严格清除协议残留);
  assert.equal(采用结果, 完整流式正文, '应采用同 generation_id 的完整流式正文');
  assert.match(
    提取纯控制协议尾段(协议尾段),
    /<JSONPatch>[\s\S]*好感值[\s\S]*<\/JSONPatch>/,
    '正文模型同轮变量尾段应走独立控制协议通道',
  );
});

test('空 JSONPatch 尾段不得覆盖已经收到的完整正文', () => {
  const 协议尾段 = '[]\n</UpdateVariable>';
  const 完整流式正文 = '夏乔收起工具，屋里的漏水已经处理好了。';
  assert.equal(严格清除协议残留(协议尾段), '');
  assert.equal(选择正文生成原文(协议尾段, 完整流式正文, 严格清除协议残留), 完整流式正文);
  assert.equal(提取纯控制协议尾段(协议尾段), 协议尾段);
});

test('迟到的纯协议流式事件不得覆盖最后一份有效正文', () => {
  const 完整流式正文 = '夏乔把工具收回箱里，朝玩家点了点头。\n<UpdateVariable>[]</UpdateVariable>';
  const 协议尾段 = '<JSONPatch>[]</JSONPatch>\n</UpdateVariable>';

  assert.equal(更新有效流式正文('', 完整流式正文, 严格清除协议残留), 完整流式正文);
  assert.equal(更新有效流式正文(完整流式正文, 协议尾段, 严格清除协议残留), 完整流式正文);

  let 清洗次数 = 0;
  assert.equal(
    更新有效流式正文(完整流式正文, `${完整流式正文}\n后续正文`, 文本 => {
      清洗次数 += 1;
      return 文本;
    }),
    `${完整流式正文}\n后续正文`,
  );
  assert.equal(清洗次数, 0, '单调增长的累计流不应每个 token 都重跑全文清洗');
});

test('流式尚未进入正文时，半截标签不能成为兜底正文', () => {
  for (const 半截 of ['<', '<Upd', '<JSONP', '<think']) {
    assert.equal(更新有效流式正文('', 半截, 严格清除协议残留), '', 半截);
    assert.equal(选择正文生成原文('<JSONPatch>[]</JSONPatch>', 半截, 严格清除协议残留), '<JSONPatch>[]</JSONPatch>');
  }
  assert.equal(更新有效流式正文('', '<3', 严格清除协议残留), '<3', '爱心写法不是协议标签');
  assert.equal(更新有效流式正文('', '<10厘米的距离也让她紧张。', 严格清除协议残留), '<10厘米的距离也让她紧张。');
});

test('最终控制尾段只接受可验证协议，不采纳思维链或 HTML 中的伪变量', () => {
  const 尺度与变量 = `<尺度判定 模式="简">{"101":1}</尺度判定>
<JSONPatch>[{"op":"replace","path":"/户/101/妻/好感值","value":1}]</JSONPatch>
</UpdateVariable>`;
  assert.equal(提取纯控制协议尾段(尺度与变量), 尺度与变量);
  const 尺度与裸数组 = `<尺度判定>{"101":1}</尺度判定>
[{"op":"replace","path":"/户/101/妻/好感值","value":2}]
</UpdateVariable>`;
  assert.equal(提取纯控制协议尾段(尺度与裸数组), 尺度与裸数组);
  const 尺度与命令 = `<尺度判定>{"101":1}</尺度判定>
_.set('户.101.妻.好感值', 2)
</UpdateVariable>`;
  assert.equal(提取纯控制协议尾段(尺度与命令), 尺度与命令);
  assert.equal(提取纯控制协议尾段('<think>_.set("户.101.妻.好感值", 99)</think>'), '');
  assert.equal(
    提取纯控制协议尾段('<think><JSONPatch>[{"op":"replace","path":"/x","value":1}]</JSONPatch></think>'),
    '',
  );
  assert.equal(提取纯控制协议尾段('<html><JSONPatch>[]</JSONPatch></html>'), '');
});

test('无 generation_id 的兼容流只在当前主正文请求窗口内接纳', () => {
  assert.equal(是当前正文流事件('main-1', 'main-1', ''), true);
  assert.equal(是当前正文流事件('main-1', 'main-1', undefined), true);
  assert.equal(是当前正文流事件('main-1', 'main-1', 'main-1'), true);
  assert.equal(是当前正文流事件('main-1', 'vars-1', ''), false);
  assert.equal(是当前正文流事件('main-1', 'main-1', 'other-1'), false);
});

test('完整流监听位于事件队首时，异步前置插件不能让缓存晚于 generate 返回', async () => {
  const 模拟一次 = async 放队首 => {
    const 监听们 = [];
    let 放行前置;
    let 缓存 = '';
    let 分发完成;
    const 前置异步插件 = () => new Promise(resolve => (放行前置 = resolve));
    const 本卡监听 = 文本 => {
      缓存 = 文本;
    };
    监听们.push(前置异步插件);
    (放队首 ? 监听们.unshift.bind(监听们) : 监听们.push.bind(监听们))(本卡监听);

    const generate = async () => {
      分发完成 = (async () => {
        for (const 监听 of 监听们) await 监听('已经显示过的完整正文');
      })();
      return '<JSONPatch>[]</JSONPatch>';
    };

    const 最终返回 = await generate();
    const 返回时缓存 = 缓存;
    放行前置?.();
    await 分发完成;
    return { 最终返回, 返回时缓存 };
  };

  assert.deepEqual(await 模拟一次(false), { 最终返回: '<JSONPatch>[]</JSONPatch>', 返回时缓存: '' });
  assert.deepEqual(await 模拟一次(true), {
    最终返回: '<JSONPatch>[]</JSONPatch>',
    返回时缓存: '已经显示过的完整正文',
  });
});

test('普通正文与旧楼层末尾的裸 RFC6902 补丁会被剥离', () => {
  const 正文 = '夏乔把工具收好。';
  const 裸补丁 = '[{"op":"replace","path":"/户/101/妻/好感值","value":1}]';
  assert.equal(清除末尾裸JSON补丁(`${正文}\n${裸补丁}`), 正文);
  assert.equal(清除末尾裸JSON补丁(`${正文}\n[]`), 正文);
  assert.equal(清除末尾裸JSON补丁('她在纸上写下 []'), '她在纸上写下 []');
  assert.equal(清除末尾裸JSON补丁('[{"name":"普通清单"}]'), '[{"name":"普通清单"}]');
});

test('回合只缓存正文请求流，并在正文清洗前完成流式兜底', () => {
  assert.match(回合源码, /正文流式生成id/);
  assert.match(回合源码, /正文流式原文/);
  assert.match(
    回合源码,
    /eventMakeFirst\(iframe_events\.STREAM_TOKEN_RECEIVED_FULLY,\s*\(文本: string, generation_id: string\) =>/,
    '完整流监听必须位于宿主事件队首；否则前置异步监听会让 generate 先返回并清空缓存',
  );
  assert.doesNotMatch(回合源码, /eventOn\(iframe_events\.STREAM_TOKEN_RECEIVED_FULLY/);
  assert.match(回合源码, /generation_id && generation_id !== 本回合生成id/);
  assert.match(回合源码, /更新有效流式正文\(正文流式原文,\s*文本,\s*清洗严格正文\)/);
  assert.match(回合源码, /提取纯控制协议尾段\(最终返回原文\)/);
  assert.match(回合源码, /流式兜底变量块 \?\? 取变量块\(原文\)/);
  assert.match(回合源码, /const 数组 = 提取末尾裸JSON补丁\(/, '裸空数组也必须能被包装成变量块');
  assert.match(
    回合源码,
    /function 有可用变量命令\(文本: string\)[\s\S]{0,900}提取末尾裸JSON补丁\(/,
    '裸空数组应算作有效的无变化结算，不触发二次请求',
  );
  assert.match(回合源码, /function 取变量块\(文本: string\)[\s\S]{0,120}清除变量禁区\(文本\)/);
  assert.match(回合源码, /function 有可用变量命令\(文本: string\)[\s\S]{0,120}清除变量禁区\(文本\)/);
  assert.match(客户端源码, /const 当前净文 = 流式段\.value\.join\(['"]\\n['"]\)/);
  assert.match(客户端源码, /更新有效流式正文\(当前净文,\s*清洗\(文本, true\),\s*内容 => 内容\)/);
  assert.match(客户端源码, /eventOn\('人妻公寓:生成开始',[\s\S]{0,260}流式段\.value = \[\]/);
  const 客户端尺度完整块 = 客户端源码.indexOf('.replace(/<尺度判定(?:\\s[^>]*)?>[\\s\\S]*?(?:<\\/尺度判定\\s*>|$)/gi');
  const 客户端孤立闭标签 = 客户端源码.indexOf('.replace(/<\\/(?:UpdateVariable|json_?patch|options|行为等级|尺度判定)');
  assert.ok(客户端尺度完整块 >= 0 && 客户端尺度完整块 < 客户端孤立闭标签, '客户端必须先删完整控制块再删孤立闭标签');
  assert.match(客户端源码, /return 清除末尾裸JSON补丁\(清除末尾残缺协议标签\(全清\)\)/);
  const 生成开始 = 回合源码.indexOf('本回合生成id = `rqgy-');
  const 清洗开始 = 回合源码.indexOf('const 已清洗正文', 生成开始);
  const 选择位置 = 回合源码.indexOf('选择正文生成原文(', 生成开始);
  const 尾段位置 = 回合源码.indexOf('提取纯控制协议尾段(最终返回原文)', 选择位置);
  const 清生成id位置 = 回合源码.indexOf("正文流式生成id = '';", 选择位置);
  const 清原文位置 = 回合源码.indexOf("正文流式原文 = '';", 清生成id位置);
  assert.ok(选择位置 > 生成开始 && 选择位置 < 清洗开始);
  assert.ok(
    选择位置 < 尾段位置 && 尾段位置 < 清生成id位置 && 清生成id位置 < 清原文位置 && 清原文位置 < 清洗开始,
    '必须先选取流式正文并提取最终控制尾段，之后才能清空本次正文缓存',
  );
});

test('AI变量解析异常降级到可信基准并保留正文，最终整表写入失败仍不得伪装成功', () => {
  assert.match(回合源码, /变量解析已降级/);
  assert.match(回合源码, /变量解析失败[\s\S]{0,500}解析基准/);
  assert.match(回合源码, /正文已保留[\s\S]{0,160}变量/);

  const 提交开始 = 回合源码.indexOf('const 提交最终整表');
  const 转正位置 = 回合源码.indexOf('临时用户已转正 = true', 提交开始);
  const 最终写入 = 回合源码.indexOf('Mvu.replaceMvuData', 提交开始);
  assert.ok(最终写入 > 提交开始 && 转正位置 > 最终写入, '最终存储成功前不能把半事务标记为成功');
});
