/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 组卡源码 = readFileSync(new URL('../../src/人妻公寓/组卡.mjs', import.meta.url), 'utf8');

function 读取正则项(名称) {
  const 起点 = 组卡源码.indexOf(`scriptName: '${名称}'`);
  if (起点 < 0) return '';
  const 终点 = 组卡源码.indexOf('\n  },', 起点);
  return 组卡源码.slice(起点, 终点 < 0 ? undefined : 终点);
}

function 构造角色卡正则(正则项) {
  const 匹配 = 正则项.match(/findRegex:\s*String\.raw`\/((?:\\\/|[^/])*)\/([dgimsuvy]*)`/);
  assert.ok(匹配, '应能从组卡项读取真实正则表达式');
  return new RegExp(匹配[1], 匹配[2]);
}

test('稽查 v2 的尺度判定以独立命名正则随角色卡发布', () => {
  const 旧协议项 = 读取正则项('[不显示]隐藏变量更新与协议标签');
  const 不发送项 = 读取正则项('[不发送]去除变量更新与占位符');
  const 稽查项 = 读取正则项('[不显示]隐藏稽查尺度判定');

  assert.ok(稽查项, '玩家应能在酒馆正则列表中看到独立的稽查尺度判定项');
  assert.match(稽查项, /markdownOnly: true/);
  assert.match(稽查项, /promptOnly: false/);
  assert.doesNotMatch(旧协议项, /尺度判定/);

  const 样本 = [
    '正文<尺度判定>{"101":1}</尺度判定>续文',
    '正文<尺度判定 模式="简">{"101":1}</尺度判定>续文',
    '正文<尺度判定 模式="详">{"101":{"实际":1}}</尺度判定>续文',
    '正文\n<尺度判定 模式="简">{"101":',
  ];
  for (const 正则项 of [不发送项, 稽查项]) {
    const 正则 = 构造角色卡正则(正则项);
    assert.equal(样本[0].replace(正则, ''), '正文续文');
    assert.equal(样本[1].replace(正则, ''), '正文续文');
    assert.equal(样本[2].replace(正则, ''), '正文续文');
    assert.equal(样本[3].replace(正则, '').trim(), '正文');
  }
});

test('角色卡发送层与显示层都隐藏裸 JSONPatch 和孤立变量闭标签', () => {
  const 不发送 = 构造角色卡正则(读取正则项('[不发送]去除变量更新与占位符'));
  const 不显示 = 构造角色卡正则(读取正则项('[不显示]隐藏变量更新与协议标签'));
  const 样本 = `正文
<JSONPatch>
[{"op":"replace","path":"/户/101/妻/好感值","value":1}]
</JSONPatch>
</UpdateVariable>`;

  assert.equal(样本.replace(不发送, '').trim(), '正文');
  assert.equal(样本.replace(不显示, '').trim(), '正文');

  const 裸数组 = `正文
[{"op":"replace","path":"/户/101/妻/好感值","value":1}]`;
  assert.equal(裸数组.replace(不发送, '').trim(), '正文');
  assert.equal(裸数组.replace(不显示, '').trim(), '正文');

  const 空补丁 = `正文
[]`;
  assert.equal(空补丁.replace(不发送, '').trim(), '正文');
  assert.equal(空补丁.replace(不显示, '').trim(), '正文');

  const 前置普通数组 = `正文
[{"name":"普通清单"}]
中间正文
[{"op":"replace","path":"/户/101/妻/好感值","value":1}]`;
  assert.equal(前置普通数组.replace(不发送, '').trim(), '正文\n[{"name":"普通清单"}]\n中间正文');
  assert.equal(前置普通数组.replace(不显示, '').trim(), '正文\n[{"name":"普通清单"}]\n中间正文');

  const 漏闭合但有剧情 = '<UpdateVariable>标签后的剧情不能被整楼吞掉';
  assert.equal(漏闭合但有剧情.replace(不发送, ''), '标签后的剧情不能被整楼吞掉');
  assert.equal(漏闭合但有剧情.replace(不显示, ''), '标签后的剧情不能被整楼吞掉');
  const 裸补丁漏闭合但有剧情 = '<JSONPatch>这里是在正文里提到 JSONPatch，不应吞掉剧情';
  assert.equal(裸补丁漏闭合但有剧情.replace(不发送, ''), '这里是在正文里提到 JSONPatch，不应吞掉剧情');
  assert.equal(裸补丁漏闭合但有剧情.replace(不显示, ''), '这里是在正文里提到 JSONPatch，不应吞掉剧情');
});
