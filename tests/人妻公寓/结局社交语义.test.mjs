/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  双重继承结局已成立,
  构建结局社交画像,
  结局期姐妹群纪律,
  结局期公开朋友圈纪律,
  结局期私密手机纪律,
  验收双重继承余波公开事实,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局社交语义.ts');
const {
  角色结局期画像,
  角色结局期私聊补充,
  结局期姐妹群成员画像,
  结局期姐妹群总纪律,
} = require('../../src/人妻公寓/脚本/游戏逻辑/手机/结局期语义.ts');
const {
  许曼君正式离婚完成ID,
  安若妍名义夫妻结局完成ID,
  构建角色结局后生活社交语义,
  母亲共居公开评论类别,
  角色对母亲共居动态评论池,
} = require('../../src/人妻公寓/脚本/游戏逻辑/结局后生活社交语义.ts');
const { 借种三人合照已拍键 } = require('../../src/人妻公寓/脚本/游戏逻辑/借种结局状态.ts');
const { 查角色剧情占位, 道具表 } = require('../../src/人妻公寓/stageConfig.ts');

function 数据() {
  const data = Schema.parse({
    户: {
      101: 创建户节点(0),
      102: 创建户节点(0),
      201: 创建户节点(0),
      202: 创建户节点(0),
      301: 创建户节点(0),
      302: 创建户节点(0),
    },
  });
  for (const 节点 of Object.values(data.户)) 节点.妻.当前阶段 = 5;
  return data;
}

test('关系公开级只从真实阶段、结局和群内消息派生，不把全员强行写成全知', () => {
  const data = 数据();
  assert.equal(构建结局社交画像(data, '101', []).关系公开级, '心知肚明');
  assert.equal(构建结局社交画像(data, '302', []).关系公开级, '心知肚明');

  data.系统._已完成特殊场景.push('借种');
  assert.equal(构建结局社交画像(data, '101', []).关系公开级, '结局稳定');

  const 泄漏本身 = [{ 会话: '姐妹群', 键: '普通AI群聊:1', 文: '夏乔:陆嘉明一直都知道，这是我们三个商量好的。' }];
  const 未公开 = 构建结局社交画像(data, '101', 泄漏本身);
  assert.equal(未公开.关系公开级, '结局稳定', '本次或历史AI泄漏正文不能反向成为公开证据');
  assert.doesNotMatch(未公开.群内允许事实.join('\n'), /陆嘉明始终知情|生物学父亲|三人关系/);

  const 已公开 = 构建结局社交画像(data, '101', [
    { 会话: '姐妹群', 键: '父亲确认:姐妹群:101:seed-1', 文: '夏乔:这件事是我们一家提前商量好的。' },
  ]);
  assert.equal(已公开.关系公开级, '家庭结构已公开', '只认脚本签发的真实公开键');
});

test('双重继承后母亲进入结局稳定层，但父亲不知情和机场隐私仍是硬边界', () => {
  const data = 数据();
  data.系统._回国.阶段 = '已完成';
  data.系统._回国.母亲已坦白 = true;
  data.系统._双重继承.阶段 = '已完成';
  data.系统._已完成特殊场景.push('回国', '双重继承');
  assert.equal(双重继承结局已成立(data), true);
  const 母亲 = 构建结局社交画像(data, '302', []);
  assert.equal(母亲.关系公开级, '结局稳定');
  assert.match(母亲.群内允许事实.join('\n'), /父亲始终不知道/);
  assert.match(母亲.群内允许事实.join('\n'), /机场视频.*不得进入群聊/);
  assert.match(结局期私密手机纪律(data, '302'), /不再退回|已经成立/);
});

test('双重继承余波按既有脚本公开键动态验收，候选不能自我转正，机场隐秘与父亲知情永久拒绝', () => {
  const data = 数据();
  data.系统._双重继承.阶段 = '已完成';
  data.系统._已完成特殊场景.push('借种', '双重继承');
  const 未公开消息 = [];
  const 未公开画像 = ['101', '302'].map(门牌 => 构建结局社交画像(data, 门牌, 未公开消息));

  assert.equal(验收双重继承余波公开事实('母亲:你爸已经离开，楼以后正式交给管理员，我还是住在302。', 未公开画像), true);
  assert.equal(验收双重继承余波公开事实('夏乔:陆嘉明早就知道借种安排，孩子的生物学父亲就是管理员。', 未公开画像), false);
  assert.equal(验收双重继承余波公开事实('夏乔:我们三个早就是一家人了。', 未公开画像), false);
  assert.equal(验收双重继承余波公开事实('母亲:机场视频里发生的事你们都看到了。', 未公开画像), false);
  assert.equal(验收双重继承余波公开事实('母亲:他爸早就看穿并默许我和管理员了。', 未公开画像), false);

  const 候选第一次泄漏 = [
    ...未公开消息,
    { 会话: '姐妹群', 键: '双重继承:候选:1', 文: '夏乔:陆嘉明早就知道借种安排，孩子父亲就是管理员。' },
  ];
  const 候选后画像 = ['101', '302'].map(门牌 => 构建结局社交画像(data, 门牌, 候选第一次泄漏));
  assert.equal(验收双重继承余波公开事实('夏乔:陆嘉明早就知道借种安排。', 候选后画像), false);

  const 已公开消息 = [{ 会话: '姐妹群', 键: '父亲确认:姐妹群:101:seed-1', 文: '夏乔:这件事我们一家都商量过。' }];
  const 已公开画像 = ['101', '302'].map(门牌 => 构建结局社交画像(data, 门牌, 已公开消息));
  assert.equal(验收双重继承余波公开事实('夏乔:陆嘉明知道并接受我们的家庭安排。', 已公开画像), true);
  assert.equal(验收双重继承余波公开事实('夏乔:孩子的生物学父亲就是管理员。', 已公开画像), true);
});

test('结局期群聊从猜关系真假转向现实生活，公开朋友圈仍不能泄密', () => {
  const data = 数据();
  data.系统._双重继承.阶段 = '已完成';
  data.系统._已完成特殊场景.push('双重继承');
  const 画像 = ['101', '302'].map(门牌 => 构建结局社交画像(data, 门牌, []));
  const 群纪律 = 结局期姐妹群纪律(data, 画像);
  assert.match(群纪律, /时间、陪伴、邀约|生活安排/);
  assert.match(群纪律, /不得.*强行公开/);
  const 公开 = 结局期公开朋友圈纪律(data, '302');
  assert.match(公开, /社会可见层|公开动态/);
  assert.match(公开, /不能公开真实关系|绝不能出现/);
});

test('普通姐妹群与结局余波共用当前消息真值：拍照、私聊和朋友圈不能冒充群内公开', () => {
  const data = 数据();
  const 场次标识 = '借种结局:101:42:9';
  data.系统._已完成特殊场景.push('借种');
  data.系统._特殊场景前置.push(借种三人合照已拍键(场次标识));

  const 无群消息 = [];
  assert.equal(构建结局社交画像(data, '101', 无群消息).关系公开级, '结局稳定');
  assert.equal(角色结局期画像(data, '101', 无群消息).群内已公开关系, false, '只拍过照片不得让普通姐妹群提前全知');
  assert.equal(结局期姐妹群成员画像(data, ['101'], 无群消息)[0].群内已公开关系, false);

  const 私聊与朋友圈伪证 = [
    { 会话: '101', 键: `父亲确认:私聊:102:101:${场次标识}`, 文: '私聊知情' },
    { 会话: '朋友圈', 键: `父亲确认:姐妹群:101:${场次标识}`, 文: '错误容器中的同名键' },
  ];
  assert.equal(构建结局社交画像(data, '101', 私聊与朋友圈伪证).关系公开级, '结局稳定');
  assert.equal(角色结局期画像(data, '101', 私聊与朋友圈伪证).群内已公开关系, false);

  const 群公开键 = { 会话: '姐妹群', 键: `父亲确认:姐妹群:101:${场次标识}`, 文: '夏乔公开家庭安排' };
  assert.equal(构建结局社交画像(data, '101', [群公开键]).关系公开级, '家庭结构已公开');
  assert.equal(角色结局期画像(data, '101', [群公开键]).群内已公开关系, true);

  const 已撤回 = { ...群公开键, 类: '撤回', 文: '' };
  assert.equal(构建结局社交画像(data, '101', [已撤回]).关系公开级, '结局稳定');
  assert.equal(角色结局期画像(data, '101', [已撤回]).群内已公开关系, false, '当前分支只剩撤回墓碑时必须撤销公开结论');
  assert.equal(角色结局期画像(data, '101', []).群内已公开关系, false, '回档、删楼或切分支后缺键时必须重新变为未公开');
});

test('母亲坦白同样只认当前姐妹群脚本键，硬状态和候选泄漏不能自我转正', () => {
  const data = 数据();
  data.系统._回国.母亲已坦白 = true;
  data.系统._回国.茶话会状态 = '已完成';
  data.系统._双重继承.阶段 = '已完成';
  data.系统._已完成特殊场景.push('双重继承');

  assert.equal(构建结局社交画像(data, '302', []).关系公开级, '结局稳定');
  assert.equal(角色结局期画像(data, '302', []).群内已公开关系, false);

  const 候选泄漏 = [{ 会话: '姐妹群', 键: '普通AI群聊:302:1', 文: '母亲承认了秘密关系' }];
  assert.equal(构建结局社交画像(data, '302', 候选泄漏).关系公开级, '结局稳定');
  assert.equal(角色结局期画像(data, '302', 候选泄漏).群内已公开关系, false);

  const 坦白键 = [{ 会话: '姐妹群', 键: '回国茶话会:坦白:-:batch-1:1', 文: '母亲亲口坦白' }];
  assert.equal(构建结局社交画像(data, '302', 坦白键).关系公开级, '结局稳定');
  assert.equal(角色结局期画像(data, '302', 坦白键).群内已公开关系, true);
});

test('录像带完成后102与202进入不同的长期生活和社交后效，不重播结局或让丈夫失忆', () => {
  const data = 数据();
  data.系统._录像带V4.阶段 = '已完成';
  data.系统._已完成特殊场景.push('录像带结局');

  const 沈 = 构建角色结局后生活社交语义(data, '102');
  const 周 = 构建角色结局后生活社交语义(data, '202');
  assert.equal(沈.阶段, '录像带结局');
  assert.equal(周.阶段, '录像带结局');
  assert.match(沈.普通正文纪律, /秩序|边界/);
  assert.match(沈.丈夫边界, /知情自愿|不得失忆|第一次/);
  assert.match(周.普通正文纪律, /不再默认留饭守门|不再无限等待/);
  assert.match(周.玩家私聊纪律, /想要、拒绝|是否等待/);
  assert.notDeepEqual(沈.主动私聊主题, 周.主动私聊主题);
  assert.equal(构建结局社交画像(data, '102', []).关系公开级, '结局稳定');
  assert.equal(构建结局社交画像(data, '202', []).关系公开级, '结局稳定');
  assert.match(角色结局期私聊补充(data, '102'), /结局后私聊·录像带结局/);
  assert.match(角色结局期私聊补充(data, '202'), /不确定就不用她等|不再把需要咽回去/);
});

test('201分居、法律离婚待终幕与完整结局使用三层后效语义', () => {
  const data = 数据();
  data.系统._许曼君分居.阶段 = '已完成';
  const 分居 = 构建角色结局后生活社交语义(data, '201');
  assert.equal(分居.阶段, '分居完成');
  assert.match(分居.生活事实, /法律离婚尚未完成/);
  assert.match(分居.普通正文纪律, /不得写成已经领取离婚证/);
  assert.doesNotMatch(角色结局期私聊补充(data, '201'), /婚姻已经结束/);

  data.系统._许曼君离婚.阶段 = '待归档旧钥匙';
  data.系统._许曼君离婚.法律离婚已成立 = true;
  const 待终幕 = 构建角色结局后生活社交语义(data, '201');
  assert.equal(待终幕.阶段, '法律离婚待终幕');
  assert.match(待终幕.生活事实, /法律离婚已经成立/);
  assert.match(待终幕.普通正文纪律, /完整终幕尚未完成/);
  assert.match(待终幕.丈夫边界, /旧钥匙归档.*正式退居.*当前硬步骤/u);
  assert.doesNotMatch(待终幕.丈夫边界, /不再拥有201普通丈夫居住权/u);
  assert.doesNotMatch(`${待终幕.生活事实}${待终幕.普通正文纪律}${待终幕.丈夫边界}`, /法律离婚尚未完成|法律婚姻仍未正式解除/u);

  data.系统._许曼君离婚.赵国强正式退居 = true;
  data.系统._许曼君离婚.旧钥匙状态 = '前住户旧钥匙归档';
  assert.match(构建角色结局后生活社交语义(data, '201').丈夫边界, /不再拥有201普通丈夫居住权/u);

  data.系统._已完成特殊场景.push(许曼君正式离婚完成ID);
  const 离婚 = 构建角色结局后生活社交语义(data, '201');
  assert.equal(离婚.阶段, '正式离婚');
  assert.match(离婚.生活事实, /正式离婚结局已经完成/);
  assert.match(离婚.丈夫边界, /不再拥有201普通丈夫居住权/);
});

test('201正式结局沿用原稳定ID并已从占位升级为真实商品；301仍保留未来占位', () => {
  assert.equal(查角色剧情占位(许曼君正式离婚完成ID), undefined, '201结局占位必须移除，不能与真实商品并存');
  assert.deepEqual(
    {
      id: 道具表[许曼君正式离婚完成ID]?.id,
      名称: 道具表[许曼君正式离婚完成ID]?.名称,
      类别: 道具表[许曼君正式离婚完成ID]?.类别,
      价格: 道具表[许曼君正式离婚完成ID]?.价格,
    },
    {
      id: 许曼君正式离婚完成ID,
      名称: '许曼君 · 离婚',
      类别: '特殊场景',
      价格: 1500,
    },
  );
  assert.deepEqual(查角色剧情占位(安若妍名义夫妻结局完成ID), {
    id: 安若妍名义夫妻结局完成ID,
    门牌: '301',
    类型: '结局剧情',
  });
});

test('201离婚后的私聊与普通正文继续服从继续、暂不承诺、退出及旧档未知关系边界', () => {
  const build = choice => {
    const data = 数据();
    data.系统._许曼君分居.阶段 = '已完成';
    data.系统._许曼君分居.玩家最终关系选择 = choice;
    data.系统._许曼君离婚.阶段 = '已完成';
    data.系统._许曼君离婚.法律离婚已成立 = true;
    data.系统._已完成特殊场景.push(许曼君正式离婚完成ID);
    return 构建角色结局后生活社交语义(data, '201');
  };

  const keep = build('继续关系');
  assert.match(`${keep.主动私聊主题.join('；')}${keep.玩家私聊纪律}`, /私下关系|想见|过来|继续关系/u);

  const pending = build('暂不承诺');
  assert.match(pending.玩家私聊纪律, /暂不承诺|不能.*长期|不得.*独占/u);
  assert.match(pending.主动私聊主题.join('；'), /尚未答应长期独占|不替玩家补上长期承诺/u);

  const exit = build('退出关系');
  assert.match(`${exit.普通正文纪律}${exit.玩家私聊纪律}`, /退出关系|住户.*管理员|管理员.*住户/u);
  assert.doesNotMatch(exit.主动私聊主题.join('；'), /想留下|关系已经进入长期|亲密|留宿|复合/u);

  const unknown = build('未决定');
  assert.match(unknown.玩家私聊纪律, /旧档|关系.*未记录|不作.*推断/u);
  assert.doesNotMatch(unknown.主动私聊主题.join('；'), /亲密|留宿|独占|复合/u);
});

test('301名义夫妻后效在正式结局完成前保持休眠，完成后也不伪装成离婚或丈夫受骗', () => {
  const data = 数据();
  const 未完成 = 构建角色结局后生活社交语义(data, '301');
  assert.equal(未完成.已开启, false);
  assert.equal(角色结局期私聊补充(data, '301').includes('名义夫妻'), false);

  data.系统._已完成特殊场景.push(安若妍名义夫妻结局完成ID);
  const 完成 = 构建角色结局后生活社交语义(data, '301');
  assert.equal(完成.阶段, '名义夫妻');
  assert.match(完成.生活事实, /保留对外夫妻身份|私人生活互不干涉/);
  assert.match(完成.丈夫边界, /江辰知情/);
  assert.match(完成.生活事实, /这不是离婚/);
  assert.match(完成.丈夫边界, /不得写成受骗丈夫/);
});

test('母亲公开评论只区分正式交接与安全公开事实，仍按评论者性格变化且不泄露亲密内容', () => {
  const data = 数据();
  const 评论者 = ['101', '102', '201', '202', '301'];
  assert.equal(母亲共居公开评论类别('公开交接'), '公开交接');
  assert.equal(母亲共居公开评论类别('未来安全公开事实'), '普通公开');

  const 普通公开 = 评论者.map(门牌 => 角色对母亲共居动态评论池(data, 门牌, '未来安全公开事实'));
  assert.equal(普通公开.every(池 => 池.length >= 2), true);
  assert.equal(new Set(普通公开.map(池 => 池[0])).size, 评论者.length, '每位评论者第一句应保持人物差异');

  const 许交接 = 角色对母亲共居动态评论池(data, '201', '公开交接');
  const 许普通 = 角色对母亲共居动态评论池(data, '201', '未来安全公开事实');
  assert.notDeepEqual(许交接, 许普通);
  assert.match(许普通.join(''), /心里有账|拿定主意/);
  assert.match(角色对母亲共居动态评论池(data, '202', '未来安全公开事实').join(''), /过得安稳|照顾好自己/);
  assert.doesNotMatch(普通公开.flat().join('\n'), /和她亲密|由我开始|让她开始|亲密场次|真实关系/);
});

test('姐妹群长期纪律读取各角色结局后的态度与话题，但不把私密丈夫事实自动公开', () => {
  const data = 数据();
  data.系统._录像带V4.阶段 = '已完成';
  data.系统._许曼君分居.阶段 = '已完成';
  data.系统._已完成特殊场景.push('录像带结局');
  const 纪律 = 结局期姐妹群总纪律(data, []);
  assert.match(纪律, /承诺是否兑现|边界是否说清/);
  assert.match(纪律, /等人不是义务|温和不等于没有边界/);
  assert.match(纪律, /住开与正式离婚的区别|关系不能替代现实责任/);
  assert.match(纪律, /丈夫私下决定|不能.*自动带进姐妹群/);
});
