/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 数据库源 = 读('src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
const 回合源 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');

function 载入摘要纯函数() {
  const 起 = 数据库源.indexOf('const 游戏表名 =');
  const 止 = 数据库源.indexOf('export interface 微信进展数据');
  assert.notEqual(起, -1);
  assert.notEqual(止, -1);
  const ts片段 = `${数据库源.slice(起, 止)}
module.exports = { 规范玩家行动, 保守回合摘要, 判断结果摘要为正文, 规范事件摘要, 提取回合事件摘要, 迁移官方纪要表内容, 迁移游戏记忆表时间列, 规范旧数据库时间文本 };`;
  const js = ts.transpileModule(ts片段, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  Function('module', 'exports', js)(module, module.exports);
  return module.exports;
}

test('聊天模板固定为五张有用记忆表，七张默认硬状态/选项表不再安装', () => {
  const 模板 = JSON.parse(读('src/人妻公寓/人妻公寓数据库模板.json'));
  const 表 = Object.values(模板).filter(value => value && typeof value === 'object' && value.name);
  assert.deepEqual(
    表.map(sheet => sheet.name),
    ['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹', '纪要表'],
  );
  for (const name of ['全局数据表', '主角信息表', '重要角色表', '主角技能表', '背包物品表', '任务与事件表', '选项表']) {
    assert.equal(表.some(sheet => sheet.name === name), false, `${name} 不应继续安装`);
  }
  const 取 = name => 表.find(sheet => sheet.name === name);
  for (const sheet of 表) {
    assert.ok(sheet.content[0].length <= 8, `${sheet.name} 不得超过数据库官方建议的 7～8 列上限`);
  }
  assert.equal(取('RQ_剧情事件').updateConfig.updateFrequency, 0);
  assert.equal(取('纪要表').updateConfig.updateFrequency, 3);
  assert.equal(取('纪要表').updateConfig.batchSize, 3);
  assert.equal(取('RQ_人物长期记忆').updateConfig.groupId, 取('RQ_承诺与伏笔').updateConfig.groupId);
  assert.equal(取('纪要表').updateConfig.groupId, 取('RQ_人物长期记忆').updateConfig.groupId);
  assert.equal(取('RQ_社交轨迹').updateConfig.updateFrequency, 6);
  assert.equal(取('RQ_人物长期记忆').updateConfig.sendLatestRows, 60);
  assert.equal(取('RQ_承诺与伏笔').updateConfig.sendLatestRows, 60);
  assert.equal(取('RQ_社交轨迹').updateConfig.sendLatestRows, 60);
  assert.equal(取('RQ_剧情事件').updateConfig.sendLatestRows, undefined);
  assert.equal(取('纪要表').updateConfig.sendLatestRows, undefined);
  assert.match(取('纪要表').sourceData.initNode, /本批处理范围/);
  assert.equal(取('纪要表').exportConfig.keywords, '编码索引');
  assert.deepEqual(取('RQ_人物长期记忆').content[0], [
    'row_id',
    '人物',
    '主题',
    '记忆',
    '未来影响',
    '最后时间',
    '最后楼层',
    '可信度',
  ]);
  assert.deepEqual(取('RQ_承诺与伏笔').content[0], [
    'row_id',
    '事项',
    '相关人物',
    '内容',
    '状态',
    '最后进展',
    '最后时间',
    '最后楼层',
  ]);
  assert.deepEqual(取('RQ_社交轨迹').content[0], [
    'row_id',
    '类型',
    '人物',
    '事件',
    '结果',
    '时间',
    '最后楼层',
    '事件键',
  ]);
  assert.match(取('RQ_剧情事件').sourceData.note, /固定写“第N天 时段”/);
  assert.match(取('RQ_人物长期记忆').sourceData.ddl, /last_time TEXT, -- 最后时间/);
  assert.match(取('RQ_承诺与伏笔').sourceData.ddl, /last_time TEXT, -- 最后时间/);
  assert.match(取('RQ_社交轨迹').sourceData.ddl, /game_time TEXT, -- 时间/);
  for (const name of ['RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹']) {
    assert.match(取(name).sourceData.updateNode, /SQL示例: UPDATE[\s\S]* WHERE /, `${name} 的 UPDATE 示例必须带业务键 WHERE`);
  }
  assert.match(取('RQ_人物长期记忆').sourceData.deleteNode, /DELETE[\s\S]*WHERE character_name[\s\S]*topic/);
});

test('摘要边界拒绝正文截断、多块、漏块和超限值，合规短摘要保持原样', () => {
  const { 规范玩家行动, 保守回合摘要, 判断结果摘要为正文, 规范事件摘要, 提取回合事件摘要 } =
    载入摘要纯函数();
  assert.equal(规范玩家行动('行'.repeat(50)), '行'.repeat(40));
  assert.equal(
    提取回合事件摘要('正文。\n<rq_event_summary>玩家修好101室水管</rq_event_summary>'),
    '玩家修好101室水管',
  );
  assert.equal(提取回合事件摘要('正文。<rq_event_summary>未闭合'), null);
  assert.equal(
    提取回合事件摘要(
      '正文。<rq_event_summary>第一条</rq_event_summary><rq_event_summary>第二条</rq_event_summary>',
    ),
    null,
  );
  assert.equal(提取回合事件摘要(`正文。<rq_event_summary>${'长'.repeat(61)}</rq_event_summary>`), null);
  assert.equal(判断结果摘要为正文('长'.repeat(61)), true);
  assert.equal(规范事件摘要('长'.repeat(61), '去收租'), 保守回合摘要('去收租'));
  assert.equal(规范事件摘要('夏乔交付房租并提到停水。', '去收租'), '夏乔交付房租并提到停水。');
  assert.match(保守回合摘要('去收租'), /玩家尝试「去收租」；本轮结果未取得可靠摘要/);
  assert.ok(Array.from(保守回合摘要('行'.repeat(80))).length <= 60);
});

test('旧 RQ 事件只有半截时段时明确标记第几天未知，不能根据消息楼伪造日期', () => {
  const { 规范旧数据库时间文本 } = 载入摘要纯函数();
  assert.equal(规范旧数据库时间文本('傍晚'), '旧记录（第几天未知）·傍晚');
  assert.equal(规范旧数据库时间文本(' 第3天 晚上 '), '第3天 晚上', '已经完整的游戏时间必须保持原样');
  assert.equal(规范旧数据库时间文本(''), '');
  assert.match(数据库源, /row\[时间列\] = 规范旧数据库时间文本\(row\[时间列\]\)/);
});

test('旧版三张记忆表按列名保留全部旧行，只把无法可靠推算的完整时间留空', () => {
  const { 迁移游戏记忆表时间列 } = 载入摘要纯函数();
  const 案例 = [
    {
      名: 'RQ_人物长期记忆',
      旧表头: ['row_id', '人物', '主题', '记忆', '未来影响', '最后楼层', '可信度'],
      新表头: ['row_id', '人物', '主题', '记忆', '未来影响', '最后时间', '最后楼层', '可信度'],
      旧行: [7, '夏乔', '可乐偏好', '她开始主动备可乐。', '下次会先递可乐。', 12, '明确'],
      新行: [7, '夏乔', '可乐偏好', '她开始主动备可乐。', '下次会先递可乐。', '', 12, '明确'],
    },
    {
      名: 'RQ_承诺与伏笔',
      旧表头: ['row_id', '事项', '相关人物', '内容', '状态', '最后进展', '最后楼层'],
      新表头: ['row_id', '事项', '相关人物', '内容', '状态', '最后进展', '最后时间', '最后楼层'],
      旧行: [3, '修水管', '夏乔', '约好带工具再上门。', '待处理', '', 18],
      新行: [3, '修水管', '夏乔', '约好带工具再上门。', '待处理', '', '', 18],
    },
    {
      名: 'RQ_社交轨迹',
      旧表头: ['row_id', '类型', '人物', '事件', '结果', '最后楼层', '事件键'],
      新表头: ['row_id', '类型', '人物', '事件', '结果', '时间', '最后楼层', '事件键'],
      旧行: [9, '邀约', '夏乔', '约她看房。', '她答应了。', 22, '邀约-夏乔-看房'],
      新行: [9, '邀约', '夏乔', '约她看房。', '她答应了。', '', 22, '邀约-夏乔-看房'],
    },
  ];
  for (const 案例项 of 案例) {
    const 旧表 = { name: 案例项.名, content: [案例项.旧表头, 案例项.旧行] };
    const 新表 = { name: 案例项.名, content: [案例项.新表头] };
    assert.equal(迁移游戏记忆表时间列(旧表, 新表), true, 案例项.名);
    assert.deepEqual(新表.content, [案例项.新表头, 案例项.新行], 案例项.名);
  }
});

test('spv8.9.1 基础版纪要表按列名迁移，不因表头顺序与地点列差异丢行', () => {
  const { 迁移官方纪要表内容 } = 载入摘要纯函数();
  const 旧表 = {
    content: [
      ['row_id', '时间跨度', '地点', '纪要', '概览', '编码索引'],
      [1, '第1天 早上', '公寓门厅', '父亲来电交代管理要求。', '玩家开始接手公寓', 'AM0001'],
    ],
  };
  const 新表 = { content: [['row_id', '编码索引', '时间跨度', '概览', '纪要', '重要对话']] };
  assert.equal(迁移官方纪要表内容(旧表, 新表), true);
  assert.deepEqual(新表.content[1], [
    1,
    'AM0001',
    '第1天 早上',
    '玩家开始接手公寓',
    '地点：公寓门厅。父亲来电交代管理要求。',
    null,
  ]);
});

test('安装器只改当前聊天，以完整快照 replace，并校验运行态与聊天切换', () => {
  for (const name of ['全局数据表', '主角信息表', '重要角色表', '主角技能表', '背包物品表', '任务与事件表', '选项表']) {
    assert.match(数据库源, new RegExp(`${name}:`));
  }
  assert.match(数据库源, /表头是否命中默认通用表\(sheet, sheet\.name\)/);
  assert.match(数据库源, /scope:\s*'chat'/);
  assert.match(数据库源, /dataMode:\s*'replace'/);
  assert.match(数据库源, /result\.success !== true \|\| result\.runtimeReady === false/);
  assert.match(数据库源, /安装互斥\.get\(聊天标识\)/);
  assert.match(数据库源, /安装期间聊天已切换/);
  assert.doesNotMatch(数据库源, /scope:\s*'global'/);
  assert.doesNotMatch(数据库源, /\.slice\(0, 800\)|\.slice\(0, 500\)/);
  assert.match(数据库源, /游戏表名 = \['RQ_剧情事件',[\s\S]*?'纪要表'\]/);
});

test('回合数据库时间由世界绝对时段统一格式化，不能再只写早上/傍晚', () => {
  assert.match(回合源, /import \{[^\n]*格式化游戏内时间[^\n]*\} from '.\/楼层时钟'/);
  assert.match(回合源, /时间: 格式化游戏内时间\(data\)/);
  assert.doesNotMatch(回合源, /时间: 当前时段\(data\.系统\._绝对时段\)/);
  assert.match(数据库源, /game_time = excluded\.game_time/);
  assert.match(数据库源, /SELECT event_type, character_name, event_text, result, game_time, last_floor, event_key/);
});

test('最终采用稿提取机器摘要；清洗不放回残缺标签；固定序章不用正文冒充摘要', () => {
  const 重写结束 = 回合源.indexOf('const 事件摘要 = 提取回合事件摘要(原文)');
  const 落助手楼 = 回合源.indexOf("role: 'assistant'", 重写结束);
  assert.ok(重写结束 > 0 && 落助手楼 > 重写结束, '应在最终重写稿采用后、助手楼落地前提取摘要');
  assert.match(回合源, /事件摘要 \?\? 保守回合摘要\(行动\)/);
  assert.doesNotMatch(回合源, /记录数据库回合\(生成楼层,[^\n]+正文,/);
  assert.match(回合源, /父亲来电交代公寓管理与收租要求，玩家开始接手管理工作/);
  assert.match(回合源, /<rq_event_summary\\b\[\^>\]\*>\[\\s\\S\]\*\?<\\\/rq_event_summary/);
  assert.match(回合源, /<rq_event_summary\\b\[\^>\]\*>\[\\s\\S\]\*\$\/i/);
  assert.match(
    回合源,
    /return 闭合清\.replace\(\/<rq_event_summary[\s\S]*?\.replace\(\/<\\\/rq_event_summary/,
    '通用吞尾回退仍须再次清掉摘要协议',
  );
});

test('首次准备和手机设置都明确显示五表迁移，不再把旧四表判为完成文案', () => {
  const 首次准备 = 读('src/人妻公寓/界面/客户端/components/首次准备.vue');
  const 设置 = 读('src/人妻公寓/脚本/游戏逻辑/手机/壳/渲染/settings.ts');
  assert.match(首次准备, /五张游戏记忆表/);
  assert.match(设置, /人妻公寓五表已安装/);
  assert.doesNotMatch(`${首次准备}\n${设置}`, /四张 RQ_ 表|人妻公寓四表|更新四张表/);
});
