/**
 * 禁忌修道院(重置版)组卡脚本
 * 用法: node src/禁忌修道院/组卡.mjs
 * 产出: dist/禁忌修道院/禁忌修道院.json (chara_card_v3,可直接导入酒馆)
 *
 * 组装内容:
 *  - 世界书: src/禁忌修道院/世界书/index.yaml 及其引用文件
 *  - 开场白: [开场白] 条目 → first_mes(不进世界书)
 *  - 界面: dist/禁忌修道院/界面/客户端/index.html → 状态栏正则(<StatusPlaceHolderImpl/> 替换)
 *  - 脚本: MVU 加载器 + dist/禁忌修道院/脚本/游戏逻辑/index.js(内嵌)
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

const 根 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const 项目 = path.join(根, 'src/禁忌修道院');
const 产物 = path.join(根, 'dist/禁忌修道院');

// ── 读取世界书 index ──
const index = parseYaml(readFileSync(path.join(项目, '世界书/index.yaml'), 'utf8'));

/** 解析 文件: 引用(通配扩展名,与 tavern_sync 同规) */
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
let 开场白 = '';
const entries = [];

for (const 组 of index.条目) {
  const 列表 = 组.条目 ?? [组];
  for (const 条 of 列表) {
    const 内容 = 条.内容 !== undefined ? String(条.内容).trim() : 读内容文件(条.文件);
    if (条.名称.startsWith('[开场白]')) {
      开场白 = 内容;
      continue; // 开场白只进 first_mes,不进世界书
    }
    const 插 = 位置映射[条.插入位置.类型];
    if (!插) throw new Error(`未知插入位置: ${条.插入位置.类型}(${条.名称})`);
    const 绿灯 = 条.激活策略.类型 === '绿灯';
    entries.push({
      id: 序号,
      keys: 绿灯 ? (条.激活策略.关键字 ?? []) : [],
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

// ── 界面与脚本产物 ──
const 客户端HTML = readFileSync(path.join(产物, '界面/客户端/index.html'), 'utf8');
const 游戏逻辑JS = readFileSync(path.join(产物, '脚本/游戏逻辑/index.js'), 'utf8');

const regex_scripts = [
  {
    id: randomUUID(),
    scriptName: '客户端界面',
    findRegex: '<StatusPlaceHolderImpl/>',
    replaceString: '```\n' + 客户端HTML + '\n```',
    trimStrings: [],
    placement: [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: false,
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: randomUUID(),
    scriptName: '[不发送]去除变量更新与占位符',
    findRegex: String.raw`/<UpdateVariable>[\s\S]*?<\/UpdateVariable>|<StatusPlaceHolderImpl\/>/g`,
    replaceString: '',
    trimStrings: [],
    placement: [2],
    disabled: false,
    markdownOnly: false,
    promptOnly: true,
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null,
  },
  {
    id: randomUUID(),
    scriptName: '[不显示]隐藏变量更新',
    findRegex: String.raw`/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g`,
    replaceString: '',
    trimStrings: [],
    placement: [2],
    disabled: false,
    markdownOnly: true,
    promptOnly: false,
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null,
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
      name: '禁忌修道院游戏逻辑',
      id: randomUUID(),
      info: '构建产物,源码见仓库 src/禁忌修道院/脚本/游戏逻辑',
      button: 脚本按钮(),
      content: 游戏逻辑JS,
      data: {},
    },
  ],
  variables: {},
};

// ── 卡体 ──
const 卡名 = '禁忌修道院';
const 版本 = '0.01';
const data = {
  name: 卡名,
  description: '',
  personality: '',
  scenario: '',
  first_mes: 开场白,
  mes_example: '',
  creator_notes: `禁忌修道院(重置版)v${版本} 内测组包。需酒馆助手(tavern_helper)启用。`,
  system_prompt: '',
  post_history_instructions: '',
  tags: ['禁忌修道院'],
  creator: '',
  character_version: 版本,
  alternate_greetings: [],
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
  first_mes: 开场白,
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
console.log(`  世界书条目: ${回读.data.character_book.entries.length}`);
console.log(`  正则: ${回读.data.extensions.regex_scripts.length} | 脚本: ${回读.data.extensions.tavern_helper.scripts.length}`);
console.log(`  first_mes: ${回读.data.first_mes.length} 字符 | 总大小: ${(readFileSync(输出路径).length / 1024).toFixed(1)} KB`);
