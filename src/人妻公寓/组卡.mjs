/**
 * 人妻公寓 组卡脚本(修道院组卡范式直迁)
 * 用法: node src/人妻公寓/组卡.mjs
 * 产出: dist/人妻公寓/人妻公寓.json + 人妻公寓.png (chara_card_v3,均可直接导入酒馆)
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

import { 校验发布版本一致, 校验客户端构建版本 } from './发布版本门禁.mjs';

const 根 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const 项目 = path.join(根, 'src/人妻公寓');
const 产物 = path.join(根, 'dist/人妻公寓');
const 头像源 = path.join(项目, '素材/游戏头像.png');
const 版本 = '0.90.1';
const TAG = 'rq0.90.1';
const 客户端构建路径 = path.join(产物, '界面/客户端/index.html');

校验发布版本一致({ 版本, 标签: TAG });
if (!existsSync(客户端构建路径)) throw new Error(`缺少客户端构建产物：${客户端构建路径}`);
校验客户端构建版本(readFileSync(客户端构建路径, 'utf8'), 版本);

const CRC32表 = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i += 1) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC32表[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function png块(type, data) {
  const 类型 = Buffer.from(type, 'ascii');
  const 长度 = Buffer.alloc(4);
  长度.writeUInt32BE(data.length);
  const 校验 = Buffer.alloc(4);
  校验.writeUInt32BE(crc32(Buffer.concat([类型, data])));
  return Buffer.concat([长度, 类型, data, 校验]);
}

/** 把 chara_card_v3 JSON 写入头像 PNG 的 chara tEXt 块，导入后图片本身就是游戏头像。 */
function 写PNG角色卡(头像, json, 输出) {
  const png = readFileSync(头像);
  const 签名 = Buffer.from('89504e470d0a1a0a', 'hex');
  if (!png.subarray(0, 8).equals(签名)) throw new Error(`头像不是有效 PNG:${头像}`);

  const 块们 = [签名];
  let offset = 8;
  let 已写入 = false;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > png.length) throw new Error(`头像 PNG 块损坏:${type}`);
    const 原块 = png.subarray(offset, end);
    const data = png.subarray(offset + 8, offset + 8 + length);
    const 是旧卡数据 = type === 'tEXt' && data.subarray(0, 6).toString('latin1') === 'chara\0';
    if (type === 'IEND' && !已写入) {
      const 编码 = Buffer.from(Buffer.from(json, 'utf8').toString('base64'), 'latin1');
      块们.push(png块('tEXt', Buffer.concat([Buffer.from('chara\0', 'latin1'), 编码])));
      已写入 = true;
    }
    if (!是旧卡数据) 块们.push(原块);
    offset = end;
  }
  if (!已写入) throw new Error('头像 PNG 缺少 IEND 块');
  writeFileSync(输出, Buffer.concat(块们));
}

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
      // 开场白文件是 raw 读取(不过 YAML 解析),文档分隔符与开发者注释会原样进
      // alternate_greetings 泄给玩家(审计 低危1)——剥掉开头的 `---` 与整行 `#` 注释
      开场白 = 内容
        .split('\n')
        .filter((行, i, 全) => {
          const 前面全是元行 = 全.slice(0, i).every(x => /^\s*(?:---\s*)?$/.test(x) || /^\s*#/.test(x));
          return !(前面全是元行 && (/^\s*---\s*$/.test(行) || /^\s*#/.test(行)));
        })
        .join('\n')
        .trim();
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

// ── 资源走 jsdelivr(手机友好；角色卡版本与正式发布 tag 同步) ──
const BASE = `https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@${TAG}`;

const 加载块 = url => "```\n<body>\n<script>\n$('body').load('" + url + "')\n</script>\n</body>\n```";

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
    findRegex: String.raw`/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable\s*>|<json_?patch\b[^>]*>[\s\S]*?<\/json_?patch\s*>|<\/?(?:UpdateVariable|json_?patch)\b[^>]*>|(?:^|\n)\s*\[\s*(?:\]|\{(?=[^{}]*"op"\s*:)(?=[^{}]*"path"\s*:)[\s\S]*\}\s*\])\s*$|<StatusPlaceHolderImpl\/>|<尺度判定(?:\s[^>]*)?>[\s\S]*?(?:<\/尺度判定\s*>|$)/gi`,
    replaceString: '',
    placement: [2],
    markdownOnly: false,
    promptOnly: true,
    ...正则骨架,
  },
  {
    id: randomUUID(),
    scriptName: '[不显示]隐藏变量更新与协议标签',
    findRegex: String.raw`/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable\s*>|<json_?patch\b[^>]*>[\s\S]*?<\/json_?patch\s*>|<\/?(?:UpdateVariable|json_?patch)\b[^>]*>|(?:^|\n)\s*\[\s*(?:\]|\{(?=[^{}]*"op"\s*:)(?=[^{}]*"path"\s*:)[\s\S]*\}\s*\])\s*$|<options>[\s\S]*?<\/options>|<行为等级>[\s\S]*?<\/行为等级>/gi`,
    replaceString: '',
    placement: [2],
    markdownOnly: true,
    promptOnly: false,
    ...正则骨架,
  },
  {
    id: randomUUID(),
    scriptName: '[不显示]隐藏稽查尺度判定',
    findRegex: String.raw`/<尺度判定(?:\s[^>]*)?>[\s\S]*?(?:<\/尺度判定\s*>|$)/g`,
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
      content: readFileSync(path.join(产物, '脚本/MVU/index.js'), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '').trim(),
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
const data = {
  name: 卡名,
  description: '',
  personality: '',
  scenario: '',
  first_mes: '<StatusPlaceHolderImpl/>',
  mes_example: '',
  creator_notes: `人妻公寓 v${版本}。支持继承 v0.80～v0.90 存档；需安装最新版酒馆助手、MVU 与数据库插件，并把数据库模式设为 SQLite；首次进入按引导安装五张游戏记忆表。v0.90.1 修复微信刷新后上下文丢失、强制剧情首次生成失败、数据库 RQ 摘要错楼、亲密底栏遮挡正文及监控／荣耀洞数据库空响应；监控与荣耀洞现统一使用当前正文 API，手机和隔离生成加入可取消的有界等待。强剧情优先于数据库与手机后台 AI，既有 RQ-1 固定开场错绑会按三重硬键安全修复。v0.90 收口多预设输出、移动端前台决策与完整提示词查看；v0.89 修复数据库物理表升级与 UPSERT 重绑定。游戏只采用酒馆显示正则后的纯文字，不复制预设 HTML、CSS、动画或折叠面板；真正未完成的输出显示为未结算残稿，不推进强制剧情、任务、资源、变量或数据库回合。变量解析已自动配置（默认走数据库代发），无需手动调整 MVU 面板；如需切换解析通道，进入游戏【设置 → 变量解析】调整即可。本作不再兼容智脑。开局：0楼进入游戏界面，选难度→接父亲电话进入到任首日；输入使用游戏内输入框。`,
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
const 卡JSON = JSON.stringify(卡, null, 2);
writeFileSync(输出路径, 卡JSON, 'utf8');
const PNG输出路径 = path.join(产物, `${卡名}.png`);
写PNG角色卡(头像源, 卡JSON, PNG输出路径);

// 自检
const 回读 = JSON.parse(readFileSync(输出路径, 'utf8'));
console.log(`✓ ${输出路径}`);
console.log(`✓ ${PNG输出路径}(内嵌卡数据 + 游戏头像)`);
console.log(
  `  世界书条目: ${回读.data.character_book.entries.length}(启用 ${回读.data.character_book.entries.filter(e => e.enabled).length})`,
);
console.log(
  `  正则: ${回读.data.extensions.regex_scripts.length} | 脚本: ${回读.data.extensions.tavern_helper.scripts.length}`,
);
console.log(`  first_mes: ${回读.data.first_mes} | alternate_greetings: ${回读.data.alternate_greetings.length}`);
console.log(`  总大小: ${(readFileSync(输出路径).length / 1024).toFixed(1)} KB | 资源TAG: ${TAG}(须推送后生效)`);
