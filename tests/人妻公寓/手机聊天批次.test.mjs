/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { 手机聊天批次控制器, 收口手机聊天输入, 执行手机聊天批次任务 } = require(
  '../../src/人妻公寓/脚本/游戏逻辑/手机聊天批次.ts'
);

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
// P8:批次执行/发送/撤回收口等交互实现迁至 ./交互/邀约与发消息,会话清理在 壳/会话瞬态,收口在 壳/渲染。
const 交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 会话瞬态源码 = readFileSync(new URL('./壳/会话瞬态.ts', 手机目录), 'utf8');
const 渲染index源码 = readFileSync(new URL('./壳/渲染/index.ts', 手机目录), 'utf8');
const 渲染chat源码 = readFileSync(new URL('./壳/渲染/chat.ts', 手机目录), 'utf8');
const 红点开合源码 = readFileSync(new URL('./壳/红点与开合.ts', 手机目录), 'utf8');
const 挂载源码 = readFileSync(new URL('./壳/挂载.ts', 手机目录), 'utf8');
const 渲染共享源码 = readFileSync(new URL('./壳/渲染/共享.ts', 手机目录), 'utf8');
const 生成引擎源码 = readFileSync(new URL('./生成引擎.ts', 手机目录), 'utf8');
const 摘要系统源码 = readFileSync(new URL('./摘要系统.ts', 手机目录), 'utf8');

function 假时钟() {
  let 当前 = 0;
  let 下个 = 1;
  const 任务 = new Map();
  return {
    当前时间: () => 当前,
    设置定时: (回调, 延迟) => {
      const id = 下个++;
      任务.set(id, { 到期: 当前 + 延迟, 回调 });
      return id;
    },
    清除定时: id => 任务.delete(id),
    前进: 毫秒 => {
      当前 += 毫秒;
      for (;;) {
        const 到期 = [...任务.entries()]
          .filter(([, 项]) => 项.到期 <= 当前)
          .sort((a, b) => a[1].到期 - b[1].到期)[0];
        if (!到期) break;
        任务.delete(到期[0]);
        到期[1].回调();
      }
    },
  };
}

test('绿灯可连续登记多条消息，失焦满6秒后只触发一个批次请求', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  控制器.登记消息('chat-a', 'm1');
  控制器.登记消息('chat-a', 'm2');
  assert.deepEqual(控制器.状态('chat-a'), {
    灯: '绿',
    待回复数: 2,
    写入中数: 0,
    截止毫秒: 0,
    等待启动: false,
    请求序号: 0,
  });

  控制器.结束输入('chat-a');
  assert.equal(控制器.状态('chat-a').灯, '黄');
  时钟.前进(5999);
  assert.equal(请求.length, 0);
  时钟.前进(1);
  assert.equal(请求.length, 1);
  assert.deepEqual(请求[0].消息标识, ['m1', 'm2']);
  assert.equal(控制器.状态('chat-a').灯, '红');
});

test('黄灯期间重新聚焦会回绿灯并取消旧倒计时，再次失焦才重新计时', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  控制器.登记消息('chat-a', 'm1');
  控制器.结束输入('chat-a');
  时钟.前进(3000);
  控制器.继续输入('chat-a');
  时钟.前进(6000);
  assert.equal(请求.length, 0);

  控制器.结束输入('chat-a');
  时钟.前进(6000);
  assert.equal(请求.length, 1);
});

test('空输入催更立即转红；取消会让旧请求失效并清空本批消息', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  控制器.登记消息('chat-a', 'm1');
  控制器.结束输入('chat-a');
  控制器.立即发送('chat-a');
  assert.equal(请求.length, 1);
  assert.equal(控制器.请求仍有效('chat-a', 请求[0].请求序号), true);

  assert.equal(控制器.取消请求('chat-a'), true);
  assert.equal(控制器.请求仍有效('chat-a', 请求[0].请求序号), false);
  assert.equal(控制器.状态('chat-a').待回复数, 0);
  assert.equal(控制器.状态('chat-a').灯, '绿');
});

test('失焦先于异步消息落库时记住黄灯意图，登记成功后再开始倒计时', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  控制器.结束输入('chat-a');
  assert.equal(控制器.状态('chat-a').等待启动, true);
  控制器.登记消息('chat-a', 'm1');
  assert.equal(控制器.状态('chat-a').灯, '黄');
  时钟.前进(6000);
  assert.equal(请求.length, 1);
});

test('兼容登记在黄灯第5秒加入批次时沿用原截止点', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  控制器.登记消息('chat-a', 'm1');
  控制器.结束输入('chat-a');
  const 首次截止 = 控制器.状态('chat-a').截止毫秒;
  时钟.前进(5000);
  控制器.登记消息('chat-a', 'm2');
  assert.equal(控制器.状态('chat-a').截止毫秒, 首次截止);
  时钟.前进(1000);
  assert.deepEqual(请求[0].消息标识, ['m1', 'm2']);
});

test('黄灯第5秒的迟到写入不延长截止，到期等待写入完成后按预留顺序转红', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  assert.equal(控制器.开始写入('chat-a', 'm1'), true);
  assert.equal(控制器.完成写入('chat-a', 'm1', true), true);
  控制器.结束输入('chat-a');
  const 首次截止 = 控制器.状态('chat-a').截止毫秒;
  assert.equal(首次截止, 6000);

  时钟.前进(5000);
  assert.equal(控制器.开始写入('chat-a', 'm2'), true);
  assert.equal(控制器.状态('chat-a').截止毫秒, 首次截止, '迟到消息不得把黄灯重新延长6秒');
  assert.equal(控制器.状态('chat-a').写入中数, 1);

  时钟.前进(1000);
  assert.equal(请求.length, 0, '黄灯到期时仍有写入，不能提前进入红灯');
  assert.equal(控制器.状态('chat-a').灯, '黄');
  assert.equal(控制器.完成写入('chat-a', 'm2', true), true);
  assert.equal(请求.length, 1);
  assert.deepEqual(请求[0].消息标识, ['m1', 'm2']);
  assert.equal(控制器.状态('chat-a').灯, '红');
  assert.equal(控制器.状态('chat-a').写入中数, 0);
  assert.equal(控制器.开始写入('chat-a', 'm3'), false, '红灯期间拒绝新写入预留');
});

test('并发落库按开始写入顺序排队，失败和移除会精确清理消息与黄灯时钟', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  assert.equal(控制器.开始写入('chat-a', 'm1'), true);
  assert.equal(控制器.开始写入('chat-a', 'm2'), true);
  assert.equal(控制器.完成写入('chat-a', 'm2', true), true);
  assert.equal(控制器.完成写入('chat-a', 'm1', false), true);
  assert.equal(控制器.含消息('chat-a', 'm1'), false);
  assert.equal(控制器.含消息('chat-a', 'm2'), true);
  assert.deepEqual(控制器.状态('chat-a'), {
    灯: '绿',
    待回复数: 1,
    写入中数: 0,
    截止毫秒: 0,
    等待启动: false,
    请求序号: 0,
  });

  控制器.结束输入('chat-a');
  assert.equal(控制器.状态('chat-a').灯, '黄');
  assert.equal(控制器.移除消息('chat-a', 'm2'), true);
  assert.equal(控制器.含消息('chat-a', 'm2'), false);
  assert.equal(控制器.状态('chat-a').灯, '绿');
  assert.equal(控制器.状态('chat-a').截止毫秒, 0);
  时钟.前进(6000);
  assert.equal(请求.length, 0);
});

test('两个写入逆序完成时，请求仍按点击预留顺序包含两条消息', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });

  控制器.开始写入('chat-a', 'm1');
  控制器.开始写入('chat-a', 'm2');
  控制器.结束输入('chat-a');
  控制器.完成写入('chat-a', 'm2', true);
  时钟.前进(6000);
  assert.equal(请求.length, 0);
  控制器.完成写入('chat-a', 'm1', true);
  assert.deepEqual(请求[0].消息标识, ['m1', 'm2']);
});

test('显式离开输入框只结算已发送消息，保留草稿；空批次立即释放', () => {
  const 时钟 = 假时钟();
  const 请求 = [];
  const 控制器 = new 手机聊天批次控制器(项 => 请求.push(项), { ...时钟, 延迟毫秒: 6000 });
  const 草稿 = new Map([['chat-a', '尚未发送的半句话']]);
  let 释放数 = 0;

  控制器.登记消息('chat-a', 'm1');
  assert.equal(收口手机聊天输入(控制器, 'chat-a', () => 释放数++), '等待回复');
  assert.equal(控制器.状态('chat-a').灯, '黄');
  assert.equal(控制器.状态('chat-a').待回复数, 1);
  assert.equal(草稿.get('chat-a'), '尚未发送的半句话', '收口不得删除或自动发送草稿');
  assert.equal(释放数, 0);

  控制器.继续输入('chat-empty');
  assert.equal(收口手机聊天输入(控制器, 'chat-empty', () => 释放数++), '已释放');
  assert.deepEqual(控制器.状态('chat-empty'), {
    灯: '绿',
    待回复数: 0,
    写入中数: 0,
    截止毫秒: 0,
    等待启动: false,
    请求序号: 0,
  });
  assert.equal(释放数, 1);
});

test('红灯前置步骤抛错时仍依次执行全部收口且不向外拒绝', async () => {
  const 收口 = [];
  const 错误 = [];

  await 执行手机聊天批次任务(
    () => {
      throw new Error('前置读库失败');
    },
    [
      () => 收口.push('状态'),
      () => {
        收口.push('重绘失败');
        throw new Error('重绘失败');
      },
      () => 收口.push('锁'),
    ],
    error => 错误.push(error instanceof Error ? error.message : String(error)),
  );

  assert.deepEqual(收口, ['状态', '重绘失败', '锁']);
  assert.deepEqual(错误, ['前置读库失败', '重绘失败']);
});

test('手机实装使用独立 generation_id 与定向停止，并把一次私聊结果拆成多气泡', () => {
  // P8:执行待回复批次/批次聊天回复迁至 交互/邀约与发消息；活动生成ID 的定向停止归 壳/会话瞬态。
  assert.match(交互源码, /async function 执行待回复批次\(请求: 手机聊天批次请求\)/);
  assert.match(生成引擎源码, /generation_id: 生成ID/);
  assert.match(生成引擎源码, /if \(外部ID\) return 外部ID;/, '手动批次的定向停止 ID 必须原样进入底层请求');
  assert.match(会话瞬态源码, /stopGenerationById\(上下文\.活动生成ID\)/);
  assert.doesNotMatch(交互源码, /stopAllGeneration\(/, '手机停止不得中断正文或其他生成');
  assert.match(交互源码, /单次请求:\s*true/);
  // v0.74 第 8 项：数据库失败不再跨来源补发第二次请求（避免双请求/二次计费）。
  assert.doesNotMatch(生成引擎源码, /数据库失败回退/, '手动聊天批次不再有数据库失败回退正文 API 的开关');
  assert.match(生成引擎源码, /控制\?\.单次请求[\s\S]{0,180}return '';/, '格式异常时手动批次应放弃而不是暗中重试');
  assert.match(交互源码, /解析微信私聊气泡\(回, 配\.妻名, 手机可见单条硬上限, 5\)/);
  assert.match(交互源码, /新消息: \[消息\]/, '群聊回复也应逐气泡落库，而不是一次整批闪现');
});

test('系统在首次异步写库前预留消息，并按预留ID顺序组装一次请求', () => {
  const 发送段 = 交互源码.slice(交互源码.indexOf('async function 发消息('), 交互源码.indexOf('/** 黄灯到时'));
  assert.ok(发送段.indexOf('开始写入(键, 玩家消息标识)') < 发送段.indexOf('await 写库增量'));
  assert.match(发送段, /finally\s*\{[\s\S]*完成写入\(键, 玩家消息标识, 已成功落库\)/);

  const 批次段 = 交互源码.slice(交互源码.indexOf('async function 执行待回复批次('), 交互源码.indexOf('async function 执行批次聊天回复('));
  assert.match(批次段, /请求\.消息标识\s*\.map\(标识\s*=>/);
  assert.match(批次段, /活动消息标识\s*=\s*\[\.\.\.请求\.消息标识\]/);
});

test('撤回、换时间线和收起手机都能收口尚未完成的聊天批次', () => {
  // P8:撤回收口在交互模块；失效批次清理在 壳/会话瞬态；结束当前聊天输入 与 compositionend 收口在 壳/渲染。
  assert.match(交互源码, /手机聊天批次\.含消息\(键, 定位\.标识\)/);
  assert.match(交互源码, /取消手机聊天批次键\(键, false\)/);
  assert.match(会话瞬态源码, /function 清理失效手机聊天批次\(\)/);
  assert.match(渲染index源码, /function 结束当前聊天输入\(\)/);
  assert.match(渲染chat源码, /compositionend[\s\S]{0,360}activeElement\s*===\s*ta[\s\S]{0,220}收口手机聊天输入/);
  assert.doesNotMatch(渲染chat源码, /if \(!\(会话草稿\.get\(键\) \?\? ''\)\.trim\(\)\) 手机聊天批次\.结束输入\(键\)/);
  const 壳收口点 = `${红点开合源码}\n${挂载源码}\n${渲染chat源码}\n${渲染index源码}\n${渲染共享源码}`;
  assert.ok((壳收口点.match(/结束当前聊天输入\(\);/g) ?? []).length >= 4, '关闭、返回和数据库让位都应显式结束输入');
});

test('手动批次保留本地微信进展记忆，但整条链路不再追加第二次数据库AI', () => {
  const 摘要段 = 摘要系统源码.slice(摘要系统源码.indexOf('async function 刷新微信进展摘要('), 摘要系统源码.indexOf('/** 正文若紧接在手机回复之后开始'));
  assert.match(摘要段, /合并本地微信进展摘要/);
  assert.match(摘要段, /同步社交轨迹/);
  assert.doesNotMatch(摘要段, /通过数据库生成/);
});
