/* eslint-disable import-x/no-nodejs-modules -- Node-only ending social regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const 共居 = require('../../src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');
const 社交 = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');

function 基础数据(绝对时段 = 6) {
  const data = Schema.parse({
    户: {
      '101': 创建户节点(0),
      '102': 创建户节点(0),
      '201': 创建户节点(0),
      '202': 创建户节点(0),
      '301': 创建户节点(0),
      '302': 创建户节点(0),
    },
    系统: {
      _数据版本: 9,
      _序章完成: true,
      _绝对时段: 绝对时段,
      _母亲入列: true,
      _已完成特殊场景: ['双重继承'],
      _双重继承: { 阶段: '已完成', 完成楼层: 20 },
    },
  });
  data.户['302'].妻.当前阶段 = 5;
  data.户['302'].妻.好感值 = 78;
  data.户['302'].妻.堕落值 = 91;
  共居.同步302共居状态(data);
  return data;
}

test('302普通RP承接当前关系与言行，界面仍保留原有两种开场动作', () => {
  const data = 基础数据();
  const semantics = 社交.构建角色结局后生活社交语义(data, '302');
  assert.equal(semantics.阶段, '双重继承共居');
  assert.equal(semantics.已开启, true);
  assert.match(semantics.生活事实, /稳定的结局后私人关系/);
  assert.match(semantics.普通正文纪律, /当下的言行/);
  assert.match(semantics.普通正文纪律, /本轮输入继续/);
  assert.match(semantics.普通正文纪律, /现有场次推进/);
  assert.doesNotMatch(semantics.普通正文纪律, /只通过.*入口|日常操作菜单/u);
  assert.deepEqual([...共居.共居动作列表], ['由我开始', '让她开始']);
});

test('302公开层只保留管理交接；亲密入口、开场与结果不会进入姐妹群或公开朋友圈', () => {
  const data = 基础数据();
  const semantics = 社交.构建角色结局后生活社交语义(data, '302');
  assert.match(semantics.姐妹群态度, /不在群里公开302的真实关系或亲密场次/);
  assert.match(semantics.群内可见后效, /亲密入口与场次结果永远不会自动公开/);
  assert.match(semantics.公开朋友圈纪律, /管理交接/);
  assert.match(semantics.公开朋友圈纪律, /不公开真实关系、亲密开场或场次结果/);
  assert.match(semantics.私密朋友圈纪律, /真实余韵、邀请/);
  assert.match(semantics.丈夫边界, /父亲始终不知情/);
});

test('母亲主动与玩家主动私聊承接真实亲密结果，但不能远程完成场次', () => {
  const data = 基础数据();
  const invitation = 共居.母亲共居主动私聊主题(data, 6);
  assert.match(invitation, /亲密暗示|想见|想由自己先开始|什么时候回302/);
  assert.match(共居.母亲共居玩家私聊纪律(data), /不能远程创建、推进或收束亲密场景/);
  assert.match(共居.母亲共居玩家私聊纪律(data), /回302点击“和她亲密”/);

  data.系统._上次性爱结果 = {
    场次标识: 'post-302-result',
    结束方式: '主动收尾',
    最终位置: '胸部',
    收尾对象门牌: '302',
    保护状态: '未使用',
    当前行为: '乳交',
    有效楼数: 5,
    参与者: {
      '302': {
        满意度: 5,
        满意目标: 5,
        偏好命中: ['胸前哺育'],
        有效楼数: 5,
        结束方式: '主动收尾',
        时长评价: '合适',
        结局态度: '安稳满足',
      },
    },
  };
  assert.match(共居.母亲共居主动私聊主题(data), /上一场已经完成的亲密结果/);
  assert.match(共居.母亲共居主动私聊主题(data), /不把私密内容升级为公开事实/);
});

test('手机节拍不再从旧饭桌日常生成302主动私聊或仅你可见内容', () => {
  const source = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts', import.meta.url), 'utf8');
  assert.match(source, /结局后玩家发起亲密/);
  assert.match(source, /结局后母亲主动亲密/);
  assert.match(source, /最近真实亲密结果、下一次想由谁先开始/);
  assert.match(source, /真实完成场次的余韵、下一次想由谁先开始/);
  assert.match(source, /不得从结局状态推断302亲密入口、开场、具体场次、收尾结果/);
  assert.doesNotMatch(source, /从真实饭桌、回家时间、已发生的普通陪伴或尚未谈开的分歧中主动联系/);
  assert.doesNotMatch(source, /重点是饭桌、回家时间、衣物、杯子、夜灯/);
  assert.doesNotMatch(
    source.slice(source.indexOf('function 共居事件长期记忆重要'), source.indexOf('async function 母亲共居事件朋友圈')),
    /一起吃早饭|一起做晚饭|陪她坐一会儿|谈开晚饭爽约|共同休息/,
  );
});

test('302公开评论池只区分正式交接与安全普通公开，不再维护旧日常事件分类', () => {
  const data = 基础数据();
  assert.equal(社交.母亲共居公开评论类别('公开交接'), '公开交接');
  assert.equal(社交.母亲共居公开评论类别('其他安全公开事实'), '普通公开');
  for (const room of ['101', '102', '201', '202', '301']) {
    const handover = 社交.角色对母亲共居动态评论池(data, room, '公开交接');
    const generic = 社交.角色对母亲共居动态评论池(data, room, '其他安全公开事实');
    assert.equal(handover.length, 2);
    assert.equal(generic.length, 2);
    assert.notDeepEqual(handover, generic);
    assert.doesNotMatch([...handover, ...generic].join('\n'), /真实关系|亲密场次|机场视频/);
  }
});

test('102与202共享录像带完成事实，但生活、丈夫和社交方向保持角色差异', () => {
  const data = 基础数据();
  data.系统._录像带V4.阶段 = '已完成';
  const shen = 社交.构建角色结局后生活社交语义(data, '102');
  const zhou = 社交.构建角色结局后生活社交语义(data, '202');
  assert.equal(shen.阶段, '录像带结局');
  assert.equal(zhou.阶段, '录像带结局');
  assert.match(shen.普通正文纪律, /秩序|边界|不得失忆/);
  assert.match(zhou.普通正文纪律, /不再默认留饭守门|自己的时间|不得复活/);
  assert.notDeepEqual(shen.主动私聊主题, zhou.主动私聊主题);
  assert.notEqual(shen.丈夫边界, zhou.丈夫边界);
  assert.notEqual(shen.姐妹群态度, zhou.姐妹群态度);
});

test('201只承认真实分居；301后效在正式结局凭据出现前保持休眠', () => {
  const data = 基础数据();
  data.系统._许曼君分居.阶段 = '已完成';
  const xumanjun = 社交.构建角色结局后生活社交语义(data, '201');
  assert.equal(xumanjun.阶段, '分居完成');
  assert.match(xumanjun.生活事实, /分居|法律离婚尚未完成/);
  assert.match(xumanjun.普通正文纪律, /不得写成已经领取离婚证/);
  assert.match(xumanjun.丈夫边界, /外住|法律婚姻仍未正式解除/);

  const dormant = 社交.构建角色结局后生活社交语义(data, '301');
  assert.equal(dormant.已开启, false);
  data.系统._已完成特殊场景.push(社交.安若妍名义夫妻结局完成ID);
  const active = 社交.构建角色结局后生活社交语义(data, '301');
  assert.equal(active.阶段, '名义夫妻');
  assert.match(active.普通正文纪律, /镜头|私人生活|不得.*受骗/);
});

test('姐妹群长期话题按各角色后效改变，私聊与录像画面不能升级成群事实', () => {
  const data = 基础数据();
  data.系统._录像带V4.阶段 = '已完成';
  data.系统._许曼君分居.阶段 = '已完成';
  const shen = 社交.角色结局后姐妹群长期方向(data, '102');
  const zhou = 社交.角色结局后姐妹群长期方向(data, '202');
  const xu = 社交.角色结局后姐妹群长期方向(data, '201');
  const mother = 社交.角色结局后姐妹群长期方向(data, '302');
  assert.match(shen, /承诺|边界/);
  assert.match(zhou, /等待|温和不等于没有边界/);
  assert.match(xu, /承诺和兑现|住开与正式离婚/);
  assert.match(mother, /公开家庭口径与私下边界/);
  assert.match(mother, /亲密入口与场次结果永远不会自动公开/);
  assert.notEqual(shen, zhou);
});

test('其他角色结局后入口将沿用同一极简模板，但当前既有后效不被提前改写', () => {
  const data = 基础数据();
  const design = require('node:fs').readFileSync(
    new URL('../../src/人妻公寓/结局后成人入口统一设计_2026-09-04.md', import.meta.url),
    'utf8',
  );
  assert.match(design, /102、202、201、301及其他角色/);
  assert.match(design, /由玩家开始／让角色开始/);
  assert.match(design, /第一楼后全部回到共用亲密场景|后续完全复用既有亲密场景/);
  assert.equal(社交.构建角色结局后生活社交语义(data, '301').已开启, false);
  assert.equal(社交.构建角色结局后生活社交语义(data, '201').已开启, false);
});
