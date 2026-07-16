/**
 * 人妻公寓 组卡脚本(修道院组卡范式直迁)
 * 用法: node src/人妻公寓/组卡.mjs
 * 产出: dist/人妻公寓/人妻公寓.json (chara_card_v3,可直接导入酒馆)
 *
 * 组装内容:
 *  - 世界书: src/人妻公寓/世界书/index.yaml 及其引用文件([开场白]→alternate_greetings)
 *  - 界面: first_mes=<StatusPlaceHolderImpl/> 标记 → 正则换 dist 客户端(0楼=游戏画面,
 *    难度三档卡内建在客户端里,无独立主页)
 *  - 脚本: MVU 加载器(内嵌) + dist/人妻公寓/脚本/游戏逻辑/index.js(jsdelivr 引用)
 *
 * ⚠ 资源走 jsdelivr:测试前须把 dist 推到仓库并打 TAG(推 tag 要用户拍板);改代码后 bump TAG 重组卡
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

const 根 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const 项目 = path.join(根, 'src/人妻公寓');
const 产物 = path.join(根, 'dist/人妻公寓');

// ── 读取世界书 index ──
const index = parseYaml(readFileSync(path.join(项目, '世界书/index.yaml'), 'utf8'));

function 读内容文件(相对路径) {
  for (const ext of ['.yaml', '.md', '.txt', '']) {
    const p = path.join(项目, '世界书', 相对路径 + ext);
    if (existsSync(p)) return readFileSync(p, 'utf8').replaceAll('\r\n', '\n').trim();
  }
  throw new Error(`世界书内容文件不存在: ${相对路径}`);
}

const 位置映射 = {
  角色定义之前: { position: 'before_char', extpos: 0 },
  角色定义之后: { position: 'after_char', extpos: 1 },
  指定深度: { position: 'after_char', extpos: 4 },
};

let 序号 = 0;
let 开场白 = ''; // → alternate_greetings[0](0楼swipe1,逃生舱叙事开场)
const entries = [];

for (const 组 of index.条目) {
  const 列表 = 组.条目 ?? [组];
  for (const 条 of 列表) {
    const 内容 = 条.内容 !== undefined ? String(条.内容).trim() : 读内容文件(条.文件);
    if (条.名称.startsWith('[开场白]')) {
      开场白 = 内容;
      continue;
    }
    const 插 = 位置映射[条.插入位置.类型];
    if (!插) throw new Error(`未知插入位置: ${条.插入位置.类型}(${条.名称})`);
    const 绿灯 = 条.激活策略.类型 === '绿灯';
    entries.push({
      id: 序号,
      keys: 绿灯 ? (条.激活策略.关键字 ?? []).map(String) : [],
      secondary_keys: [],
      comment: 条.名称,
      content: 内容,
      constant: !绿灯,
      selective: true,
      insertion_order: 条.插入位置.顺序 ?? 100,
      enabled: 条.启用 !== false,
      position: 插.position,
      use_regex: true,
      extensions: {
        position: 插.extpos,
        exclude_recursion: false,
        display_index: 序号,
        probability: 100,
        useProbability: true,
        depth: 条.插入位置.深度 ?? 4,
        selectiveLogic: 0,
        group: '',
        group_override: false,
        group_weight: 100,
        prevent_recursion: false,
        delay_until_recursion: false,
        scan_depth: null,
        match_whole_words: null,
        use_group_scoring: false,
        case_sensitive: null,
        automation_id: '',
        role: 0,
        vectorized: false,
        sticky: 0,
        cooldown: 0,
        delay: 0,
        match_persona_description: false,
        match_character_description: false,
        match_character_personality: false,
        match_character_depth_prompt: false,
        match_scenario: false,
        match_creator_notes: false,
        triggers: [],
        outlet_name: '',
        ignore_budget: false,
      },
    });
    序号 += 1;
  }
}

if (!开场白) throw new Error('未找到 [开场白] 条目');

// ── 资源走 jsdelivr(手机友好;〔待用户拍板〕首个内测 tag 名,推送后此处生效) ──
const TAG = 'rq0.08';
const BASE = `https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@${TAG}`;

const 加载块 = url => '```\n<body>\n<script>\n$(\'body\').load(\'' + url + '\')\n</script>\n</body>\n```';

const 正则骨架 = {
  trimStrings: [],
  disabled: false,
  runOnEdit: true,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null,
};

const regex_scripts = [
  {
    id: randomUUID(),
    scriptName: '客户端界面(吞正文)',
    findRegex: String.raw`/^[\s\S]*<StatusPlaceHolderImpl\/>[\s\S]*$/`,
    replaceString: 加载块(`${BASE}/dist/人妻公寓/界面/客户端/index.html`),
    placement: [2],
    markdownOnly: true,
    promptOnly: false,
    ...正则骨架,
  },
  {
    id: randomUUID(),
    scriptName: '[不显示]玩家楼层(输入走游戏内)',
    findRegex: String.raw`/^[\s\S]*$/`,
    replaceString: '',
    placement: [1],
    markdownOnly: true,
    promptOnly: false,
    ...正则骨架,
  },
  {
    id: randomUUID(),
    scriptName: '[不发送]去除变量更新与占位符',
    findRegex: String.raw`/<UpdateVariable>[\s\S]*?<\/UpdateVariable>|<StatusPlaceHolderImpl\/>/g`,
    replaceString: '',
    placement: [2],
    markdownOnly: false,
    promptOnly: true,
    ...正则骨架,
  },
  {
    id: randomUUID(),
    scriptName: '[不显示]隐藏变量更新与协议标签',
    findRegex: String.raw`/<UpdateVariable>[\s\S]*?<\/UpdateVariable>|<options>[\s\S]*?<\/options>|<行为等级>[\s\S]*?<\/行为等级>/g`,
    replaceString: '',
    placement: [2],
    markdownOnly: true,
    promptOnly: false,
    ...正则骨架,
  },
];

const 脚本按钮 = (buttons = []) => ({ enabled: true, buttons });

const tavern_helper = {
  scripts: [
    {
      type: 'script',
      enabled: true,
      name: 'MVU',
      id: randomUUID(),
      info: '',
      button: 脚本按钮([
        { name: '重新处理变量', visible: false },
        { name: '重新读取初始变量', visible: false },
        { name: '快照楼层', visible: false },
        { name: '重演楼层', visible: false },
        { name: '重试额外模型解析', visible: false },
        { name: '清除旧楼层变量', visible: false },
      ]),
      content: readFileSync(path.join(项目, '脚本/MVU/index.ts'), 'utf8').trim(),
      data: {},
    },
    {
      type: 'script',
      enabled: true,
      name: '人妻公寓游戏逻辑',
      id: randomUUID(),
      info: '构建产物,源码见仓库 src/人妻公寓/脚本/游戏逻辑',
      button: 脚本按钮(),
      content: "import '" + BASE + "/dist/人妻公寓/脚本/游戏逻辑/index.js';",
      data: {},
    },
  ],
  variables: {},
};

// ── 卡体 ──
const 卡名 = '人妻公寓';
const 版本 = '0.06';
const data = {
  name: 卡名,
  description: '',
  personality: '',
  scenario: '',
  first_mes: '<StatusPlaceHolderImpl/>',
  mes_example: '',
  creator_notes: `人妻公寓 v${版本} 内测组包(P1+P2:核心循环+侦探层)。需酒馆助手(tavern_helper)启用。开局:0楼即游戏界面,选难度→接父亲电话进入到任首日;酒馆输入框不用,输入走游戏内。`,
  system_prompt: '',
  post_history_instructions: '',
  tags: ['人妻公寓'],
  creator: '',
  character_version: 版本,
  alternate_greetings: [开场白],
  group_only_greetings: [],
  extensions: {
    talkativeness: '0.5',
    fav: false,
    world: 卡名,
    depth_prompt: { prompt: '', depth: 4, role: 'system' },
    regex_scripts,
    tavern_helper,
  },
  character_book: { name: 卡名, entries },
};

const 卡 = {
  name: 卡名,
  description: '',
  personality: '',
  scenario: '',
  first_mes: data.first_mes,
  mes_example: '',
  creatorcomment: data.creator_notes,
  avatar: 'none',
  talkativeness: '0.5',
  fav: false,
  tags: data.tags,
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data,
  create_date: new Date().toISOString().slice(0, 10),
};

const 输出路径 = path.join(产物, `${卡名}.json`);
writeFileSync(输出路径, JSON.stringify(卡, null, 2), 'utf8');

// 自检
const 回读 = JSON.parse(readFileSync(输出路径, 'utf8'));
console.log(`✓ ${输出路径}`);
console.log(`  世界书条目: ${回读.data.character_book.entries.length}(启用 ${回读.data.character_book.entries.filter(e => e.enabled).length})`);
console.log(`  正则: ${回读.data.extensions.regex_scripts.length} | 脚本: ${回读.data.extensions.tavern_helper.scripts.length}`);
console.log(`  first_mes: ${回读.data.first_mes} | alternate_greetings: ${回读.data.alternate_greetings.length}`);
console.log(`  总大小: ${(readFileSync(输出路径).length / 1024).toFixed(1)} KB | 资源TAG: ${TAG}(须推送后生效)`);
