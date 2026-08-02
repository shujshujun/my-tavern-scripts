/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');
const jsonLoader = require.extensions['.json'];
delete require.extensions['.json'];
require.extensions['.json'] = jsonLoader;

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const {
  判定CG阶段,
  判定CG部位,
  构造CG亲密上下文,
  角色CG列表,
  应保留成人CG,
  选择成人CG,
} = require('../../src/人妻公寓/脚本/游戏逻辑/成人CG系统.ts');

function 信号(覆盖 = {}) {
  return {
    门牌: '101',
    角色阶段: 3,
    行为等级: null,
    正文: '',
    行动: '',
    事件: '',
    楼层: 10,
    亲密: {
      状态: '空闲',
      主焦点门牌: null,
      当前行为: '无插入',
      当前接触部位: '无',
      结束方式: '',
      最终位置: '',
    },
    ...覆盖,
  };
}

test('尺度、正文词表和脚本正戏是并联触发，不再要求同时命中', () => {
  assert.equal(判定CG阶段(信号({ 行为等级: 3, 正文: '她继续配合你的节奏。' })), 'active');
  assert.equal(判定CG阶段(信号({ 正文: '她继续承受着阴道插入。' })), 'active');
  assert.equal(判定CG阶段(信号({ 角色阶段: 2, 行为等级: 2, 行动: '吻她' })), 'foreplay');
  assert.equal(判定CG阶段(信号({ 事件: '【转折正戏】第一夜正式开始' })), 'foreplay');
  assert.equal(判定CG阶段(信号({ 行为等级: 0, 行动: '强行和她做爱', 正文: '她明确拒绝并推开了你。' })), null);
});

test('亲密状态是场内主真值，委婉对话楼保持进行中CG，结束楼强制事后图', () => {
  const 场内 = 信号({
    行动: '继续',
    正文: '她调整呼吸，仍配合着你的节奏。',
    亲密: {
      状态: '进行中',
      主焦点门牌: '101',
      当前行为: '阴道插入',
      当前接触部位: '小屄',
      结束方式: '',
      最终位置: '',
    },
  });
  assert.equal(判定CG阶段(场内), 'active');
  assert.equal(判定CG阶段(信号({ ...场内, 正文: '她在间隙里轻轻亲吻你。' })), 'active');
  assert.equal(判定CG部位('', 场内.亲密), 'vaginal');
  assert.equal(应保留成人CG(场内), true);

  const 结束楼 = 信号({
    亲密: {
      ...场内.亲密,
      状态: '已结束',
      结束方式: '主动收尾',
      最终位置: '体外',
    },
  });
  assert.equal(判定CG阶段(结束楼), 'climax_after');
  assert.equal(应保留成人CG(结束楼), true);
});

test('角色中止与突然离场会清空CG，正常三类结束仍显示事后图', () => {
  const 结束上下文 = {
    状态: '已结束',
    主焦点门牌: '101',
    当前行为: '阴道插入',
    当前接触部位: '小屄',
    结束方式: '',
    最终位置: '小屄',
  };
  for (const 结束方式 of ['角色中止', '突然离场']) {
    const 中止信号 = 信号({ 亲密: { ...结束上下文, 结束方式 } });
    assert.equal(判定CG阶段(中止信号), null, 结束方式);
    assert.equal(应保留成人CG(中止信号), false, 结束方式);
    assert.equal(选择成人CG(中止信号, new Set()), null, 结束方式);
  }
  for (const 结束方式 of ['主动收尾', '体力耗尽', '脚本收尾']) {
    const 正常信号 = 信号({ 亲密: { ...结束上下文, 结束方式 } });
    assert.equal(判定CG阶段(正常信号), 'climax_after', 结束方式);
    assert.equal(应保留成人CG(正常信号), true, 结束方式);
  }
});

test('场外普通楼不会保留旧CG，明确高潮词仍优先于进行中状态', () => {
  assert.equal(应保留成人CG(信号()), false);
  assert.equal(
    判定CG阶段(信号({ 正文: '她进入厨房，结束后清理并擦拭了桌面。' })),
    null,
    '进入、结束后、清理和擦拭都是场外弱词，不能独立触发成人CG',
  );
  assert.equal(判定CG阶段(信号({ 正文: '事后她复盘了会议安排。' })), null, '普通“事后”也不能独立触发');
  assert.equal(
    判定CG阶段(
      信号({
        正文: '她在高潮后瘫软下来。',
        亲密: {
          状态: '进行中',
          主焦点门牌: '101',
          当前行为: '阴道插入',
          当前接触部位: '小屄',
          结束方式: '',
          最终位置: '',
        },
      }),
    ),
    'climax_after',
  );
});

test('CG关键词消除直接否定，但保留同句后续真实发生的动作', () => {
  for (const 正文 of ['她明确拒绝亲吻，只愿继续聊天。', '她拒绝让你插入，随即拉开距离。', '她没有高潮，也没有射精。']) {
    assert.equal(判定CG阶段(信号({ 正文 })), null, 正文);
  }
  assert.equal(判定CG阶段(信号({ 角色阶段: 2, 正文: '她起初拒绝亲吻，后来主动亲吻了你。' })), 'foreplay');
  assert.equal(判定CG阶段(信号({ 正文: '她没有高潮，随后真正达到高潮。' })), 'climax_after');
  assert.equal(判定CG阶段(信号({ 正文: '她拒绝继续肛交，转而主动口交。' })), 'active');
});

test('最终位置显式映射拥有最高部位优先级，不会被上一种行为覆盖', () => {
  const 旧行为 = {
    状态: '已结束',
    主焦点门牌: '101',
    当前行为: '肛门插入',
    当前接触部位: '屁穴',
    结束方式: '主动收尾',
    最终位置: '',
  };
  const 位置映射 = {
    脸部: 'other',
    小嘴: 'mouth',
    胸部: 'breast',
    小屄: 'vaginal',
    后穴: 'anal',
    体外: 'other',
  };
  for (const [最终位置, 预期部位] of Object.entries(位置映射)) {
    assert.equal(判定CG部位('', { ...旧行为, 最终位置 }), 预期部位, 最终位置);
  }
});

test('五类主动收尾会在有素材时直接限定到对应部位的事后CG池', () => {
  const 位置映射 = {
    脸部: 'other',
    小嘴: 'mouth',
    胸部: 'breast',
    小屄: 'vaginal',
    后穴: 'anal',
  };
  for (const [最终位置, 预期部位] of Object.entries(位置映射)) {
    const 图 = 选择成人CG(
      信号({
        门牌: '201',
        亲密: {
          状态: '已结束',
          主焦点门牌: '201',
          当前行为: '肛门插入',
          当前接触部位: '屁穴',
          结束方式: '主动收尾',
          最终位置,
        },
      }),
      new Set(),
    );
    assert.ok(图, `${最终位置}应能选出事后图`);
    assert.equal(图.phase, 'climax_after', 最终位置);
    assert.equal(图.bodyPart, 预期部位, `${最终位置}不得继续从全部事后图库任取`);
  }
});

test('对应部位素材缺失时保留角色事后图兜底，避免再次压低CG触发率', () => {
  const 图 = 选择成人CG(
    信号({
      门牌: '301',
      亲密: {
        状态: '已结束',
        主焦点门牌: '301',
        当前行为: '乳交',
        当前接触部位: '胸部',
        结束方式: '主动收尾',
        最终位置: '胸部',
      },
    }),
    new Set(),
  );
  assert.ok(图, '现有角色事后图仍应作为触发率兜底');
  assert.equal(图.phase, 'climax_after');
  assert.equal(图.bodyPart, 'vaginal', '301当前没有胸部事后素材，测试固定“优先匹配、缺图回退”政策');
});

test('亲密上下文使用本楼开始时的主焦点，自动轮换后不会把本楼CG错给下一人', () => {
  const 旧值 = Schema.parse({ 户: { 101: 创建户节点(3), 102: 创建户节点(3) } });
  旧值.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'scene',
    开始楼层: 8,
    有效楼数: 2,
    当前接触部位: '胸部',
    当前行为: '乳交',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: {
      101: { 满意度: 2, 满意目标: 3, 偏好命中: [], 等级加成已用: true },
      102: { 满意度: 1, 满意目标: 4, 偏好命中: [], 等级加成已用: true },
    },
  };
  const 新值 = structuredClone(旧值);
  新值.系统._性爱场景.主焦点门牌 = '102';
  新值.系统._性爱场景.当前接触部位 = '小屄';
  新值.系统._性爱场景.当前行为 = '阴道插入';

  const 上下文 = 构造CG亲密上下文(旧值, 新值, false);
  assert.equal(上下文.状态, '进行中');
  assert.equal(上下文.主焦点门牌, '101');
  assert.equal(上下文.当前行为, '阴道插入');
  assert.equal(上下文.当前接触部位, '小屄');
});

test('开场首楼即使结算后自动轮换，也仍把本楼CG归给开场实际焦点', () => {
  const 旧值 = Schema.parse({ 户: { 101: 创建户节点(3), 102: 创建户节点(3) } });
  const 新值 = structuredClone(旧值);
  新值.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'opening-rotated-scene',
    开始楼层: 8,
    有效楼数: 1,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '102',
    参与者: {
      101: { 满意度: 2, 满意目标: 2, 偏好命中: [], 等级加成已用: true },
      102: { 满意度: 1, 满意目标: 4, 偏好命中: [], 等级加成已用: true },
    },
  };

  const 上下文 = 构造CG亲密上下文(旧值, 新值, false);
  assert.equal(上下文.主焦点门牌, '101');
});

test('结束上下文读取最后结果并能从正式清单选出主焦点事后图', () => {
  const 旧值 = Schema.parse({ 户: { 101: 创建户节点(3) } });
  旧值.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'scene',
    开始楼层: 8,
    有效楼数: 3,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: { 101: { 满意度: 3, 满意目标: 3, 偏好命中: [], 等级加成已用: true } },
  };
  const 新值 = structuredClone(旧值);
  新值.系统._性爱场景 = {
    状态: '空闲',
    场次标识: '',
    开始楼层: -1,
    有效楼数: 0,
    当前接触部位: '无',
    当前行为: '无插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '',
    参与者: {},
  };
  新值.系统._上次性爱结果 = {
    场次标识: 'scene',
    结束方式: '主动收尾',
    最终位置: '体内',
    保护状态: '未使用',
    当前行为: '阴道插入',
    有效楼数: 4,
    参与者: {},
  };

  const 亲密 = 构造CG亲密上下文(旧值, 新值, true);
  assert.deepEqual(
    { 状态: 亲密.状态, 主焦点门牌: 亲密.主焦点门牌, 当前行为: 亲密.当前行为, 当前接触部位: 亲密.当前接触部位 },
    { 状态: '已结束', 主焦点门牌: '101', 当前行为: '阴道插入', 当前接触部位: '小屄' },
  );
  const 图 = 选择成人CG(信号({ 门牌: '101', 亲密 }), new Set());
  assert.ok(图);
  assert.equal(图.door, '101');
  assert.equal(图.phase, 'climax_after');
});

test('结束上下文按最终行为映射本楼接触部位，不继续读取上一楼旧部位', () => {
  const 旧值 = Schema.parse({ 户: { 101: 创建户节点(3) } });
  旧值.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'final-body-scene',
    开始楼层: 8,
    有效楼数: 2,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: { 101: { 满意度: 2, 满意目标: 3, 偏好命中: [], 等级加成已用: true } },
  };
  const 新值 = structuredClone(旧值);
  新值.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  新值.系统._上次性爱结果 = {
    场次标识: 'final-body-scene',
    结束方式: '主动收尾',
    最终位置: '胸部',
    保护状态: '未使用',
    当前行为: '口交',
    有效楼数: 3,
    参与者: {},
  };

  const 上下文 = 构造CG亲密上下文(旧值, 新值, true);
  assert.equal(上下文.当前行为, '口交');
  assert.equal(上下文.当前接触部位, '嘴');
  assert.equal(判定CG部位('', 上下文), 'breast', '最终位置仍应覆盖本楼行为对应的嘴部');
});

test('六名角色的结束楼都能选出本人事后图，坏图是硬排除而解锁图仍可复用', () => {
  for (const 门牌 of ['101', '102', '201', '202', '301', '302']) {
    const 结束信号 = 信号({
      门牌,
      亲密: {
        状态: '已结束',
        主焦点门牌: 门牌,
        当前行为: '阴道插入',
        当前接触部位: '小屄',
        结束方式: '主动收尾',
        最终位置: '体内',
      },
    });
    const 事后池 = 角色CG列表(门牌).filter(项 => 项.phase === 'climax_after');
    assert.ok(事后池.length > 0, `${门牌} 缺少事后图`);
    const 图 = 选择成人CG(结束信号, new Set());
    assert.ok(图);
    assert.equal(图.door, 门牌);
    assert.equal(图.phase, 'climax_after');

    const 全部已解锁 = new Set(事后池.map(项 => 项.id));
    assert.ok(选择成人CG(结束信号, 全部已解锁), `${门牌} 的已解锁图应允许复用`);
    assert.equal(选择成人CG(结束信号, new Set(), 全部已解锁), null, `${门牌} 的坏图不得重新入池`);
  }
});

test('单一大候选池能逐张淘汰到耗尽，候选数量可显著超过12', () => {
  const 进行中 = 信号({
    门牌: '302',
    亲密: {
      状态: '进行中',
      主焦点门牌: '302',
      当前行为: '阴道插入',
      当前接触部位: '小屄',
      结束方式: '',
      最终位置: '',
    },
  });
  const 坏图 = new Set();
  while (true) {
    const 图 = 选择成人CG(进行中, new Set(), 坏图);
    if (!图) break;
    assert.equal(坏图.has(图.id), false);
    坏图.add(图.id);
  }
  assert.ok(坏图.size > 12, `测试清单需要覆盖固定12次上限，实际只有 ${坏图.size} 张`);
  assert.equal(选择成人CG(进行中, new Set(), 坏图), null);
});
