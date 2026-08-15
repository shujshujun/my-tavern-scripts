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
  判定CG动作,
  当前CG可沿用,
  构造CG亲密上下文,
  角色CG列表,
  角色CG总数全部变体,
  应保留成人CG,
  选择成人CG,
  选择成人CG组,
} = require('../../src/人妻公寓/脚本/游戏逻辑/成人CG系统.ts');
const { 应使用怀孕CG } = require('../../src/人妻公寓/脚本/游戏逻辑/怀孕系统.ts');
const 清单JSON = require('../../src/人妻公寓/成人CG清单.json');

const 清单 = 清单JSON.items;

function 信号(覆盖 = {}) {
  return {
    门牌: '101',
    角色阶段: 3,
    行为等级: null,
    正文: '',
    行动: '',
    事件: '',
    楼层: 10,
    variant: 'normal',
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

function 场内亲密(覆盖 = {}) {
  return {
    状态: '进行中',
    主焦点门牌: '101',
    当前行为: '无插入',
    当前接触部位: '无',
    结束方式: '',
    最终位置: '',
    ...覆盖,
  };
}

test('cg3 五阶段清单结构：1070张普通CG与378张孕肚CG严格分线', () => {
  assert.equal(清单JSON.version, 'cg3');
  assert.equal(清单JSON.total, 1448);
  assert.deepEqual(清单JSON.variantCounts, { normal: 1070, pregnancy: 378 });
  assert.equal(清单.length, 1448);
  assert.equal(new Set(清单.map(项 => 项.id)).size, 1448);
  assert.equal(new Set(清单.map(项 => 项.path)).size, 1448);
  const 阶段数 = 清单.reduce((acc, 项) => ((acc[项.stage] = (acc[项.stage] ?? 0) + 1), acc), {});
  assert.deepEqual(阶段数, {
    intro_no_contact: 227,
    light_contact: 94,
    deep_foreplay: 471,
    active: 562,
    aftermath: 94,
  });
  assert.deepEqual(清单JSON.stageCounts, 阶段数);
  const 分库阶段数 = variant =>
    清单
      .filter(项 => 项.variant === variant)
      .reduce((acc, 项) => ((acc[项.stage] = (acc[项.stage] ?? 0) + 1), acc), {});
  assert.deepEqual(分库阶段数('normal'), {
    intro_no_contact: 186,
    light_contact: 62,
    deep_foreplay: 361,
    active: 426,
    aftermath: 35,
  });
  assert.deepEqual(分库阶段数('pregnancy'), {
    intro_no_contact: 41,
    light_contact: 32,
    deep_foreplay: 110,
    active: 136,
    aftermath: 59,
  });
  const 删除ID = ['ary_a7ab02454daf', 'mq_9c11652500b3', 'sjy_45fa8d2bc9f8', 'sjy_5b37d63bd04c', 'sjy_9a152e5a9ba7', 'xq_4eda72893947'];
  for (const id of 删除ID) assert.equal(清单.some(项 => 项.id === id), false, `${id} 不得回到清单`);
  assert.equal(清单.every(项 => ['normal', 'pregnancy'].includes(项.variant) && 项.width > 0 && 项.height > 0 && 项.path), true);
  assert.equal(
    清单.filter(项 => 项.variant === 'pregnancy').every(项 => 项.path === `assets/${项.door}/pregnancy/${项.stage}/${项.id}.webp`),
    true,
    '孕肚 CG 必须使用门牌/pregnancy/五阶段的公开路径',
  );
});

test('进行中只认前后穴进入：口交/乳交/未插入玩具一律算深度前戏', () => {
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) })), 'active');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '肛门插入', 当前接触部位: '屁穴' }) })), 'active');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '玩具', 当前接触部位: '小屄' }) })), 'active');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '玩具', 当前接触部位: '屁穴' }) })), 'active');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '口交', 当前接触部位: '嘴' }) })), 'deep_foreplay');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '乳交', 当前接触部位: '胸部' }) })), 'deep_foreplay');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '玩具', 当前接触部位: '其他' }) })), 'deep_foreplay');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '她含着你的阴茎吞吐。' })), 'deep_foreplay');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '她用双乳夹住你的肉棒。' })), 'deep_foreplay');
});

test('正文进行中词只认插入；普通接触与开场词分级判定', () => {
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '你挺入她的小屄，抽送起来。' })), 'active');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '她主动亲吻并拥抱了你。' })), 'light_contact');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '她轻轻揉捏你的手。' })), 'light_contact');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '她当着你的面脱下裙子。' })), 'intro_no_contact');
});

test('首楼开场：空闲进入进行中的首个成功楼优先显示开场图', () => {
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 本楼开始: true }) })), 'intro_no_contact');
  // 后续楼不再开场
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) })), 'active');
});

test('场外开场需要已发生正文与尺度证据，拒绝不能出图', () => {
  assert.equal(判定CG阶段(信号({ 正文: '她脱下了衣服。', 角色阶段: 2, 行为等级: 2 })), 'intro_no_contact');
  assert.equal(判定CG阶段(信号({ 正文: '她示意你过去。', 角色阶段: 2, 行为等级: 2 })), 'intro_no_contact');
  assert.equal(判定CG阶段(信号({ 行动: '强行脱她的衣服', 正文: '她明确拒绝并推开你。' })), null);
  assert.equal(判定CG阶段(信号({ 正文: '她脱下了衣服。' })), null, '尺度不足不能场外出图');
});

test('自然否定句不得被五阶段关键词反向触发，但同句后续真实行为仍可识别', () => {
  const 高尺度场外 = 正文 => 信号({ 正文, 角色阶段: 5, 行为等级: 5 });
  assert.equal(判定CG阶段(高尺度场外('她没有真的进行口交，而是摇头拒绝。')), null);
  assert.equal(判定CG阶段(高尺度场外('她明确说不接受肛交。')), null);
  assert.equal(判定CG阶段(高尺度场外('她不愿继续口交。')), null);
  assert.equal(判定CG阶段(高尺度场外('她拒绝进行插入。')), null);
  assert.equal(
    判定CG阶段(高尺度场外('她拒绝进行肛交，却低头为你口交。')),
    'deep_foreplay',
    '不能因为前一分句是否定就吞掉后一分句真实发生的行为',
  );
  const 转换行为 = 高尺度场外('她拒绝口交，转而用双乳夹住你的肉棒。');
  assert.equal(判定CG阶段(转换行为), 'deep_foreplay');
  assert.equal(判定CG动作(转换行为, 'deep_foreplay'), 'paizuri', '动作池也必须忽略已拒绝的前一行为');
});

test('口交与乳交绝不判定为 active，插入仍是 active', () => {
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '她低头为你口交。' })), 'deep_foreplay');
  assert.equal(判定CG阶段(信号({ 亲密: 场内亲密(), 正文: '她继续承受你的插入。' })), 'active');
  assert.equal(
    判定CG阶段(
      信号({
        行动: '把玩具插入她的小屄',
        正文: '她明确拒绝这个动作，只愿继续交谈。',
        行为等级: 0,
        亲密: 场内亲密(),
      }),
    ),
    null,
    '场内的玩家请求也不能覆盖正文拒绝与实际尺度',
  );
});

test('成功结束才出事后图；中止/离场/停下收尾/安全套内不显示', () => {
  const 结束上下文 = (覆盖 = {}) => ({
    状态: '已结束',
    主焦点门牌: '101',
    当前行为: '阴道插入',
    当前接触部位: '小屄',
    结束方式: '主动收尾',
    最终位置: '小屄',
    ...覆盖,
  });
  for (const 结束方式 of ['主动收尾', '体力耗尽', '脚本收尾']) {
    const 信号_ = 信号({ 亲密: 结束上下文({ 结束方式 }) });
    assert.equal(判定CG阶段(信号_), 'aftermath', 结束方式);
    assert.equal(应保留成人CG(信号_), true, 结束方式);
  }
  for (const 结束方式 of ['角色中止', '突然离场']) {
    const 信号_ = 信号({ 亲密: 结束上下文({ 结束方式 }) });
    assert.equal(判定CG阶段(信号_), null, 结束方式);
    assert.equal(应保留成人CG(信号_), false, 结束方式);
    assert.equal(选择成人CG(信号_, new Set()), null, 结束方式);
  }
  const 停下 = 信号({ 亲密: 结束上下文({ 结束方式: '主动收尾', 最终位置: '停下并收尾' }) });
  assert.equal(判定CG阶段(停下), null, '主动结束但没有射精时不显示事后图');
  assert.equal(应保留成人CG(停下), false);
  const 安全套 = 信号({ 亲密: 结束上下文({ 结束方式: '主动收尾', 最终位置: '安全套内' }) });
  assert.equal(判定CG阶段(安全套), null, '安全套内不显示事后图');
  const 未知位置 = 信号({ 亲密: 结束上下文({ 结束方式: '主动收尾', 最终位置: '停止动作' }) });
  assert.equal(判定CG阶段(未知位置), null, '没有射精位置证据时不显示事后图');
});

test('aftermath 不读正文弱词，只认结构化成功结束', () => {
  assert.equal(判定CG阶段(信号({ 正文: '她事后瘫软，清理并擦拭身体。' })), null);
  assert.equal(判定CG阶段(信号({ 正文: '她达到高潮。' })), null, '正文高潮词不能独立触发事后图');
  const 结束 = 信号({ 亲密: { 状态: '已结束', 主焦点门牌: '101', 当前行为: '阴道插入', 当前接触部位: '小屄', 结束方式: '主动收尾', 最终位置: '小屄' } });
  assert.equal(判定CG阶段(结束), 'aftermath');
});

test('进行中动作四池精确匹配：阴茎/道具、前/后穴互不串用', () => {
  const 池 = 角色CG列表('302');
  const 动作计数 = 池.reduce((acc, 项) => ((acc[项.action] = (acc[项.action] ?? 0) + 1), acc), {});
  assert.ok(动作计数.penis_vaginal >= 10);
  assert.ok(动作计数.penis_anal >= 10);
  assert.ok(动作计数.toy_vaginal >= 3);
  assert.ok(动作计数.toy_anal >= 3);

  const 选 = (行为, 部位) =>
    选择成人CG(
      信号({
        门牌: '302',
        亲密: 场内亲密({ 当前行为: 行为, 当前接触部位: 部位 }),
      }),
      new Set(),
    );
  assert.equal(选('阴道插入', '小屄')?.action, 'penis_vaginal');
  assert.equal(选('肛门插入', '屁穴')?.action, 'penis_anal');
  assert.equal(选('玩具', '小屄')?.action, 'toy_vaginal');
  assert.equal(选('玩具', '屁穴')?.action, 'toy_anal');
});

test('active 缺池返回 null，不跨前/后穴或阴茎/道具兜底', () => {
  // 201 的进行中池没有“道具前穴”素材（但有阴茎前穴）：玩具进入前穴必须返回 null，不得从阴茎池兜底。
  assert.ok(角色CG列表('201').some(项 => 项.stage === 'active' && 项.action === 'penis_vaginal'), '201 应有阴茎前穴素材');
  assert.equal(
    角色CG列表('201').some(项 => 项.stage === 'active' && 项.action === 'toy_vaginal'),
    false,
    '201 应缺道具前穴素材',
  );
  const 隔离信号 = 信号({
    门牌: '201',
    亲密: 场内亲密({ 当前行为: '玩具', 当前接触部位: '小屄' }),
  });
  assert.equal(选择成人CG(隔离信号, new Set()), null, '缺池必须返回 null，不得从阴茎池兜底');
});

test('非 active 阶段先精确动作，再在同角色同图库同阶段内安全回退', () => {
  const 图 = 选择成人CG(
    信号({
      门牌: '101',
      亲密: 场内亲密({ 当前行为: '口交', 当前接触部位: '嘴' }),
    }),
    new Set(),
  );
  assert.ok(图);
  assert.equal(图.door, '101');
  assert.equal(图.stage, 'deep_foreplay');
  assert.equal(图.variant, 'normal');
  assert.equal(图.action, 'oral');
});

test('事后动作按最终位置映射，不读正文弱词', () => {
  const 判 = (最终位置, 行为 = '阴道插入') =>
    判定CG动作(
      信号({
        亲密: {
          状态: '已结束',
          主焦点门牌: '201',
          当前行为: 行为,
          当前接触部位: '小屄',
          结束方式: '主动收尾',
          最终位置,
        },
      }),
      'aftermath',
    );
  assert.equal(判('脸部'), 'mouth_or_face');
  assert.equal(判('小嘴'), 'mouth_or_face');
  assert.equal(判('胸部'), 'chest_or_body');
  assert.equal(判('小屄'), 'vaginal_leak');
  assert.equal(判('后穴'), 'anal_leak');
  assert.equal(判('体外'), 'bed_or_nearby');
  assert.equal(判('小屄', '肛门插入'), 'vaginal_leak', '显式最终位置优先，不得被上一轮行为覆盖');
});

test('事后图从正式清单限定到对应动作池', () => {
  const 图 = 选择成人CG(
    信号({
      门牌: '201',
      亲密: {
        状态: '已结束',
        主焦点门牌: '201',
        当前行为: '阴道插入',
        当前接触部位: '小屄',
        结束方式: '主动收尾',
        最终位置: '小屄',
      },
    }),
    new Set(),
  );
  assert.ok(图, '201 应有前穴流出事后图');
  assert.equal(图.stage, 'aftermath');
  assert.equal(图.action, 'vaginal_leak');
});

test('aftermath 精确匹配动作，缺池返回 null 不得跨动作兜底', () => {
  const 结束上下文 = (最终位置) => ({
    状态: '已结束',
    主焦点门牌: '101',
    当前行为: '阴道插入',
    当前接触部位: '小屄',
    结束方式: '主动收尾',
    最终位置,
  });
  const 事后动作集合 = [...new Set(角色CG列表('101').filter(项 => 项.stage === 'aftermath').map(项 => 项.action))];
  assert.deepEqual(事后动作集合, ['anal_leak'], '101 只有后穴流出事后图，便于验证缺池语义');
  // 小屄收尾缺 vaginal_leak：必须返回 null，不能从 anal_leak 兜底。
  assert.equal(选择成人CG(信号({ 亲密: 结束上下文('小屄') }), new Set()), null, '小屄收尾缺 vaginal_leak 必须返回 null');
  // 后穴收尾仍能精确选到 anal_leak。
  const 后穴图 = 选择成人CG(信号({ 亲密: 结束上下文('后穴') }), new Set());
  assert.ok(后穴图);
  assert.equal(后穴图.stage, 'aftermath');
  assert.equal(后穴图.action, 'anal_leak');
});

test('当前CG可沿用：角色/图库/阶段不符或 active/aftermath 动作不符必须清除', () => {
  // 301 无事后图库：小屄收尾选择器返回 null，旧 active 阴茎图被判定为不兼容。
  const 结束信号 = 信号({
    门牌: '301',
    亲密: {
      状态: '已结束',
      主焦点门牌: '301',
      当前行为: '阴道插入',
      当前接触部位: '小屄',
      结束方式: '主动收尾',
      最终位置: '小屄',
    },
  });
  assert.equal(角色CG列表('301').filter(项 => 项.stage === 'aftermath').length, 0, '301 应缺事后图库');
  assert.equal(选择成人CG(结束信号, new Set()), null, '301 无事后池必须返回 null');
  const 旧active图 = 角色CG列表('301').find(项 => 项.stage === 'active' && 项.action === 'penis_vaginal');
  assert.ok(旧active图, '301 应有旧 active 阴茎前穴图');
  assert.equal(当前CG可沿用(旧active图, 结束信号, 'aftermath', 'vaginal_leak'), false, '旧 active 图不得在事后目标下沿用');

  // active 从阴茎前穴切到缺池的玩具前穴：旧阴茎图判定不兼容。
  const 玩具目标 = 信号({
    门牌: '201',
    亲密: 场内亲密({ 当前行为: '玩具', 当前接触部位: '小屄' }),
  });
  assert.equal(选择成人CG(玩具目标, new Set()), null, '201 缺道具前穴池，选择器返回 null');
  const 旧阴茎图 = 角色CG列表('201').find(项 => 项.stage === 'active' && 项.action === 'penis_vaginal');
  assert.ok(旧阴茎图, '201 应有旧 active 阴茎前穴图');
  assert.equal(当前CG可沿用(旧阴茎图, 玩具目标, 'active', 'toy_vaginal'), false, '阴茎图不得在玩具前穴目标下沿用');

  // 软阶段对话允许沿用：同角色同图库同阶段，动作不同不清除。
  const 口交目标 = 信号({ 门牌: '101', 亲密: 场内亲密({ 当前行为: '口交', 当前接触部位: '嘴' }) });
  const 乳交图 = 角色CG列表('101').find(项 => 项.stage === 'deep_foreplay' && 项.action === 'paizuri');
  assert.ok(乳交图, '101 应有 deep_foreplay 乳交图');
  assert.equal(当前CG可沿用(乳交图, 口交目标, 'deep_foreplay', 'oral'), true, '软阶段动作不同仍可沿用');

  // 阶段不符、角色不符、图库不符必须清除。
  const active图 = 角色CG列表('101').find(项 => 项.stage === 'active' && 项.action === 'penis_vaginal');
  assert.ok(active图);
  assert.equal(当前CG可沿用(active图, 口交目标, 'deep_foreplay', 'oral'), false, '阶段不符必须清除');
  assert.equal(
    当前CG可沿用(active图, 信号({ 门牌: '102', 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) }), 'active', 'penis_vaginal'),
    false,
    '角色不符必须清除',
  );
  assert.equal(
    当前CG可沿用(active图, 信号({ variant: 'pregnancy', 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) }), 'active', 'penis_vaginal'),
    false,
    '图库不符必须清除',
  );

  // 同角色同图库同阶段同动作可沿用；阶段未知的纯对话楼可沿用。
  const 同目标 = 信号({ 门牌: '101', 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) });
  assert.equal(当前CG可沿用(active图, 同目标, 'active', 'penis_vaginal'), true, '同角色同图库同阶段同动作可沿用');
  assert.equal(当前CG可沿用(active图, 同目标, null, null), true, '阶段未知的纯对话楼可沿用');
});

test('怀孕微信确认送达前仍用普通图库；已告知后才切孕肚图库', () => {
  const data = Schema.parse({ 户: { 101: 创建户节点(3) } });
  const 普通图 = 选择成人CG(
    信号({ 门牌: '101', variant: 'normal', 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) }),
    new Set(),
  );
  assert.ok(普通图);
  assert.equal(普通图.variant, 'normal');
  assert.equal(应使用怀孕CG(data, '101'), false, '未孕不用怀孕图库');

  for (const 状态 of ['已受孕', '待告知']) {
    const 孕数据 = Schema.parse({ 户: { 101: 创建户节点(3) } });
    孕数据.户['101'].妻._怀孕.状态 = 状态;
    assert.equal(应使用怀孕CG(孕数据, '101'), false, `${状态}尚未完成告知，不得提前展示孕肚CG`);
  }

  const 已告知数据 = Schema.parse({ 户: { 101: 创建户节点(3) } });
  已告知数据.户['101'].妻._怀孕.状态 = '已告知';
  assert.equal(应使用怀孕CG(已告知数据, '101'), true, '微信确认送达后才使用孕肚图库');

  // 已告知后能按同角色、同阶段、同动作选到孕肚图。
  const 孕信号 = 信号({ variant: 'pregnancy', 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) });
  const 孕图 = 选择成人CG(孕信号, new Set());
  assert.ok(孕图);
  assert.equal(孕图.variant, 'pregnancy');
  assert.equal(孕图.door, '101');
  assert.equal(孕图.stage, 'active');
  assert.equal(孕图.action, 'penis_vaginal');

  // 精确孕肚候选池全部不可用时必须返回 null，即使普通图库有同动作图也不能跨线回退。
  const 孕肚精确池 = 角色CG列表('101', 'pregnancy').filter(项 => 项.stage === 'active' && 项.action === 'penis_vaginal');
  const 普通精确池 = 角色CG列表('101', 'normal').filter(项 => 项.stage === 'active' && 项.action === 'penis_vaginal');
  assert.ok(孕肚精确池.length > 0 && 普通精确池.length > 0, '严格分线反例需要两边都有同动作素材');
  assert.equal(选择成人CG(孕信号, new Set(), new Set(孕肚精确池.map(项 => 项.id))), null);
});

test('variant 切换选到孕肚图，且不把旧普通图沿用到孕肚图库', () => {
  const 普通 = 选择成人CG(
    信号({ variant: 'normal', 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) }),
    new Set(),
  );
  assert.ok(普通);
  assert.equal(普通.variant, 'normal');
  const 孕信号 = 信号({ variant: 'pregnancy', 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) });
  const 孕肚 = 选择成人CG(孕信号, new Set());
  assert.ok(孕肚);
  assert.equal(孕肚.variant, 'pregnancy');
  assert.equal(当前CG可沿用(普通, 孕信号, 'active', 'penis_vaginal'), false, '普通图不得跨 variant 沿用');
});

test('六名角色的普通进行中池可用、坏图硬排除而已解锁图仍可复用', () => {
  for (const 门牌 of ['101', '102', '201', '202', '301', '302']) {
    const 进行中信号 = 信号({
      门牌,
      亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }),
    });
    const 池 = 角色CG列表(门牌).filter(项 => 项.stage === 'active' && 项.action === 'penis_vaginal');
    assert.ok(池.length > 0, `${门牌} 缺少进行中普通池`);
    const 图 = 选择成人CG(进行中信号, new Set());
    assert.ok(图, `${门牌} 应能选出进行中图`);
    assert.equal(图.door, 门牌);
    assert.equal(图.stage, 'active');
    assert.equal(图.action, 'penis_vaginal');

    const 全部已解锁 = new Set(池.map(项 => 项.id));
    assert.ok(选择成人CG(进行中信号, 全部已解锁), `${门牌} 的已解锁图应允许复用`);
    assert.equal(选择成人CG(进行中信号, new Set(), 全部已解锁), null, `${门牌} 的坏图不得重新入池`);
  }
});

test('单一大候选池能逐张淘汰到耗尽，坏图淘汰与确定性哈希不退化', () => {
  const 进行中 = 信号({
    门牌: '302',
    亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }),
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

test('空闲进入进行中的首楼标记 本楼开始；已开始场景后续楼不标记', () => {
  const 建 = () => {
    const 旧值 = Schema.parse({ 户: { 101: 创建户节点(3) } });
    const 新值 = structuredClone(旧值);
    return { 旧值, 新值 };
  };

  let { 旧值, 新值 } = 建();
  新值.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'opening',
    开始楼层: 8,
    有效楼数: 1,
    当前接触部位: '胸部',
    当前行为: '乳交',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: { 101: { 满意度: 0, 满意目标: 3, 偏好命中: [], 等级加成已用: true } },
  };
  assert.equal(构造CG亲密上下文(旧值, 新值, false).本楼开始, true, '旧空闲→新进行中=首楼开场');

  ({ 旧值, 新值 } = 建());
  旧值.系统._性爱场景 = {
    状态: '进行中',
    场次标识: 'mid',
    开始楼层: 8,
    有效楼数: 3,
    当前接触部位: '小屄',
    当前行为: '阴道插入',
    保护状态: '未使用',
    待收尾位置: '',
    主焦点门牌: '101',
    参与者: { 101: { 满意度: 2, 满意目标: 3, 偏好命中: [], 等级加成已用: true } },
  };
  新值.系统._性爱场景 = structuredClone(旧值.系统._性爱场景);
  新值.系统._性爱场景.当前接触部位 = '屁穴';
  新值.系统._性爱场景.当前行为 = '肛门插入';
  assert.equal(构造CG亲密上下文(旧值, 新值, false).本楼开始, false, '已进行中的后续楼不开场');
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
  新值.系统._性爱场景 = Schema.parse({}).系统._性爱场景;
  新值.系统._上次性爱结果 = {
    场次标识: 'scene',
    结束方式: '主动收尾',
    最终位置: '后穴',
    保护状态: '未使用',
    当前行为: '阴道插入',
    有效楼数: 4,
    参与者: {},
  };

  const 亲密 = 构造CG亲密上下文(旧值, 新值, true);
  assert.equal(亲密.状态, '已结束');
  assert.equal(亲密.主焦点门牌, '101');
  assert.equal(亲密.最终位置, '后穴');
  // 101 只有后穴流出事后图：后穴收尾按最终位置精确选到 anal_leak。
  const 图 = 选择成人CG(信号({ 门牌: '101', 亲密 }), new Set());
  assert.ok(图);
  assert.equal(图.door, '101');
  assert.equal(图.stage, 'aftermath');
  assert.equal(图.action, 'anal_leak');
});

test('脸胸组合与其他体外位置可精确到达正式事后动作池', () => {
  const 结束亲密 = 最终位置 => ({
    状态: '已结束',
    主焦点门牌: '201',
    当前行为: '阴道插入',
    当前接触部位: '小屄',
    结束方式: '主动收尾',
    最终位置,
  });

  const 脸胸信号 = 信号({ 门牌: '201', 亲密: 结束亲密('脸部和胸部') });
  assert.equal(判定CG动作(脸胸信号, 'aftermath'), 'face_and_body');
  assert.equal(选择成人CG(脸胸信号, new Set())?.action, 'face_and_body');

  const 其他信号 = 信号({ 门牌: '201', 亲密: 结束亲密('其他体外位置') });
  assert.equal(判定CG动作(其他信号, 'aftermath'), 'other_or_unspecified');
  assert.equal(选择成人CG(其他信号, new Set())?.action, 'other_or_unspecified');
});

test('档案总数等于普通与怀孕图库之和', () => {
  const 孕肚角色数 = { 101: 65, 102: 62, 201: 56, 202: 61, 301: 59, 302: 75 };
  for (const 门牌号 of ['101', '102', '201', '202', '301', '302']) {
    assert.equal(
      角色CG总数全部变体(门牌号),
      角色CG列表(门牌号, 'normal').length + 角色CG列表(门牌号, 'pregnancy').length,
    );
    assert.equal(角色CG列表(门牌号, 'pregnancy').length, 孕肚角色数[门牌号], `${门牌号} 的孕肚CG数量应匹配用户终审`);
  }
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
    最终位置: '小嘴',
    保护状态: '未使用',
    当前行为: '口交',
    有效楼数: 3,
    参与者: {},
  };

  const 上下文 = 构造CG亲密上下文(旧值, 新值, true);
  assert.equal(上下文.当前行为, '口交');
  assert.equal(上下文.当前接触部位, '嘴');
  assert.equal(判定CG动作(信号({ 亲密: 上下文 }), 'aftermath'), 'mouth_or_face', '最终位置应覆盖本楼行为对应的嘴部');
});

test('场外普通楼不保留旧CG，委婉对话楼保留当前CG', () => {
  assert.equal(应保留成人CG(信号()), false);
  assert.equal(判定CG阶段(信号({ 正文: '她进入厨房，结束后清理并擦拭了桌面。' })), null, '进入、结束后、清理是场外弱词');
  const 场内 = 信号({ 亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }) });
  assert.equal(应保留成人CG(场内), true);
});

test('同一回合最多选择两张不重复 CG，第一张保持旧单选结果且不跨语义池', () => {
  const 进行中 = 信号({
    门牌: '101',
    亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }),
  });
  const 单图 = 选择成人CG(进行中, new Set());
  const 双图 = 选择成人CG组(进行中, new Set());

  assert.ok(单图);
  assert.equal(双图.length, 2);
  assert.equal(双图[0].id, 单图.id, '升级双图不能改变原有第一张的确定性选择');
  assert.equal(new Set(双图.map(项 => 项.id)).size, 2, '两槽不得重复同一张');
  for (const 项 of 双图) {
    assert.equal(项.door, '101');
    assert.equal(项.variant, 'normal');
    assert.equal(项.stage, 'active');
    assert.equal(项.action, 'penis_vaginal');
  }
});

test('未解锁 CG 优先填充双图，只有一个未解锁时才以同池旧图补第二槽', () => {
  const 进行中 = 信号({
    门牌: '101',
    亲密: 场内亲密({ 当前行为: '阴道插入', 当前接触部位: '小屄' }),
  });
  const 精确池 = 清单.filter(
    项 => 项.door === '101' && 项.variant === 'normal' && 项.stage === 'active' && 项.action === 'penis_vaginal',
  );
  assert.ok(精确池.length >= 2);
  const 唯一未解锁 = 精确池[0];
  const 已解锁 = new Set(精确池.slice(1).map(项 => 项.id));
  const 双图 = 选择成人CG组(进行中, 已解锁);

  assert.equal(双图.length, 2);
  assert.equal(双图[0].id, 唯一未解锁.id);
  assert.ok(已解锁.has(双图[1].id), '未解锁不足时第二槽才允许复用同池旧图');
});

test('强动作单例池自动降级单图，坏图后耗尽也不得跨动作凑第二张', () => {
  const 单例信号 = 信号({
    门牌: '301',
    亲密: 场内亲密({ 主焦点门牌: '301', 当前行为: '玩具', 当前接触部位: '屁穴' }),
  });
  const 单例组 = 选择成人CG组(单例信号, new Set());
  assert.equal(单例组.length, 1);
  assert.equal(单例组[0].stage, 'active');
  assert.equal(单例组[0].action, 'toy_anal');
  assert.deepEqual(选择成人CG组(单例信号, new Set(), new Set([单例组[0].id])), []);
});
