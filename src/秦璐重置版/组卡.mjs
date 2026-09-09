/* eslint-disable import-x/no-nodejs-modules -- Node-only release builder */
/**
 * 《秦璐》v1.0 完结版组卡脚本
 *
 * 用法：node src/秦璐重置版/组卡.mjs
 * 可选：QIN_CARD_TEMPLATE=D:/path/to/秦璐.png node src/秦璐重置版/组卡.mjs
 *
 * 产出：
 * - dist/秦璐重置版/秦璐_v1.0_完结版.json
 * - dist/秦璐重置版/秦璐_v1.0_完结版.png
 * - dist/秦璐重置版/秦璐_v1.0_完结版.sha256
 * - dist/秦璐重置版/秦璐_v1.0_完结版.manifest.json
 *
 * 组卡原则：
 * - 复用玩家本机现有秦璐卡的头像、开场与基础角色资料；
 * - 以 src/秦璐重置版/世界书 为世界书唯一来源；
 * - 状态栏、行动选项与游戏逻辑固定到 qin1.0 标签；
 * - 变量结构与 MVU 加载器直接内嵌，避免运行时版本漂移；
 * - 输出 chara_card_v3 JSON，并把同一 JSON 写入 PNG 唯一 chara tEXt 块。
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

const 根 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const 项目 = path.join(根, 'src/秦璐重置版');
const 产物 = path.join(根, 'dist/秦璐重置版');
const 配置 = JSON.parse(readFileSync(path.join(项目, '发布配置.json'), 'utf8'));
const 文件基名 = `${配置.name}_v${配置.version}_${配置.edition}`;
const JSON输出 = path.join(产物, `${文件基名}.json`);
const PNG输出 = path.join(产物, `${文件基名}.png`);
const 校验输出 = path.join(产物, `${文件基名}.sha256`);
const 清单输出 = path.join(产物, `${文件基名}.manifest.json`);

const 本机卡路径 = 'D:/SillyTavern/SillyTavern-Launcher/SillyTavern/data/default-user/characters/秦璐.png';
const 模板候选 = [process.env.QIN_CARD_TEMPLATE, 本机卡路径, PNG输出].filter(Boolean);
const 模板路径 = 模板候选.find(p => existsSync(p));
if (!模板路径) {
  throw new Error(
    `未找到秦璐角色卡模板。请设置 QIN_CARD_TEMPLATE，已检查：${模板候选.join('、')}`,
  );
}

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

function 读取PNG卡(pngPath) {
  const png = readFileSync(pngPath);
  const 签名 = Buffer.from('89504e470d0a1a0a', 'hex');
  if (!png.subarray(0, 8).equals(签名)) throw new Error(`模板不是有效 PNG：${pngPath}`);

  let offset = 8;
  let 卡 = null;
  let chara块数 = 0;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > png.length) throw new Error(`模板 PNG 块损坏：${type}`);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'tEXt' && data.subarray(0, 6).toString('latin1') === 'chara\0') {
      chara块数 += 1;
      const decoded = Buffer.from(data.subarray(6).toString('latin1'), 'base64').toString('utf8');
      卡 = JSON.parse(decoded);
    }
    offset = end;
  }
  if (!卡) throw new Error(`模板 PNG 不含 chara 数据：${pngPath}`);
  return { png, 卡, chara块数 };
}

function 写PNG角色卡(模板PNG, json, 输出) {
  const 签名 = Buffer.from('89504e470d0a1a0a', 'hex');
  const 块们 = [签名];
  let offset = 8;
  let 已写入 = false;
  while (offset < 模板PNG.length) {
    const length = 模板PNG.readUInt32BE(offset);
    const type = 模板PNG.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > 模板PNG.length) throw new Error(`头像 PNG 块损坏：${type}`);
    const 原块 = 模板PNG.subarray(offset, end);
    const data = 模板PNG.subarray(offset + 8, offset + 8 + length);
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

function 读取内嵌卡(pngPath) {
  const png = readFileSync(pngPath);
  let offset = 8;
  const cards = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'tEXt' && data.subarray(0, 6).toString('latin1') === 'chara\0') {
      cards.push(Buffer.from(data.subarray(6).toString('latin1'), 'base64').toString('utf8'));
    }
    offset += 12 + length;
  }
  return cards;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

/** 基于发布标签和用途生成稳定 UUID，保证重复组卡逐字节一致。 */
function 稳定ID(kind, name) {
  const chars = createHash('sha256').update(`${配置.tag}:${kind}:${name}`).digest('hex').slice(0, 32).split('');
  chars[12] = '5';
  chars[16] = ((Number.parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const hex = chars.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function 去源码映射(content) {
  return content.replace(/\n?\/\/# sourceMappingURL=.*$/m, '').trim();
}

function 加载块(url) {
  return "```\n<body>\n<script>\n$('body').load('" + url + "')\n</script>\n</body>\n```";
}

function 标准正则骨架() {
  return {
    trimStrings: [],
    disabled: false,
    runOnEdit: true,
    substituteRegex: 0,
    minDepth: null,
    maxDepth: null,
  };
}

function 标准脚本(name, content, oldScript) {
  return {
    type: 'script',
    enabled: true,
    name,
    id: 稳定ID('script', name),
    info: oldScript?.info ?? '',
    button: oldScript?.button ?? { enabled: true, buttons: [] },
    content,
    data: oldScript?.data ?? {},
  };
}

function 读取世界书() {
  const indexPath = path.join(项目, '世界书/index.yaml');
  const normalized = readFileSync(indexPath, 'utf8').replace(
    /^(\s*)content:\s*!include\s+(.+?)\s*$/gm,
    (_all, indent, file) => `${indent}content_file: ${JSON.stringify(file.trim())}`,
  );
  const index = parseYaml(normalized);
  if (!Array.isArray(index?.entries)) throw new Error('秦璐世界书 index.yaml 缺少 entries 数组');

  return index.entries.map((entry, id) => {
    const file = String(entry.content_file ?? '');
    if (!file) throw new Error(`世界书第 ${id + 1} 项缺少 !include 文件`);
    const contentPath = path.join(项目, '世界书', file);
    if (!existsSync(contentPath)) throw new Error(`世界书内容不存在：${contentPath}`);
    const constant = entry.constant === true;
    const comment = String(entry.comment ?? file.replace(/\.ya?ml$/i, ''));
    return {
      id,
      keys: Array.isArray(entry.keys) ? entry.keys.map(String) : [],
      secondary_keys: [],
      comment,
      content: readFileSync(contentPath, 'utf8').replaceAll('\r\n', '\n').trim(),
      constant,
      selective: !constant,
      insertion_order: Number(entry.insertion_order ?? 100),
      enabled: entry.enabled !== false,
      position: 'before_char',
      use_regex: true,
      extensions: {
        position: 0,
        exclude_recursion: false,
        display_index: id,
        probability: 100,
        useProbability: true,
        depth: 4,
        selectiveLogic: 0,
        group: '',
        group_override: false,
        group_weight: 100,
        prevent_recursion: false,
        delay_until_recursion: false,
        scan_depth: null,
        match_whole_words: null,
        use_group_scoring: false,
        case_sensitive: entry.case_sensitive ?? false,
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
        triggers: [],
        outlet_name: '',
        ignore_budget: false,
      },
    };
  });
}

const { png: 模板PNG, 卡: 模板卡, chara块数: 模板chara块数 } = 读取PNG卡(模板路径);
const 卡 = structuredClone(模板卡);
const data = structuredClone(卡.data ?? 卡);
const BASE = `https://testingcf.jsdelivr.net/gh/${配置.repository}@${配置.tag}`;

const 原正则 = Array.isArray(data.extensions?.regex_scripts) ? data.extensions.regex_scripts : [];
const 状态栏正则 = 原正则.find(item => item.scriptName === '状态栏') ?? {
  id: 稳定ID('regex', '状态栏'),
  scriptName: '状态栏',
  findRegex: String.raw`/<StatusPlaceHolderImpl\s*\/>|<StatusBlock\s*\/>/g`,
  placement: [2],
  markdownOnly: true,
  promptOnly: false,
  ...标准正则骨架(),
};
状态栏正则.replaceString = 加载块(`${BASE}/dist/秦璐重置版/界面/状态栏/index.html`);

const 行动选项正则 = 原正则.find(item => item.scriptName === '行动选项') ?? {
  id: 稳定ID('regex', '行动选项'),
  scriptName: '行动选项',
  findRegex: String.raw`/<options>[\s\S]*?<\/options>/gi`,
  replaceString: '',
  placement: [2],
  markdownOnly: true,
  promptOnly: false,
  ...标准正则骨架(),
};
行动选项正则.replaceString = 加载块(`${BASE}/dist/秦璐重置版/界面/行动选项/index.html`);

状态栏正则.id = 稳定ID('regex', '状态栏');
行动选项正则.id = 稳定ID('regex', '行动选项');
const 其余正则 = 原正则
  .filter(item => item.scriptName !== '状态栏' && item.scriptName !== '行动选项')
  .map(item => ({ ...item, id: 稳定ID('regex', item.scriptName) }));
data.extensions = data.extensions ?? {};
data.extensions.regex_scripts = [状态栏正则, 行动选项正则, ...其余正则];

const 原脚本 = Array.isArray(data.extensions?.tavern_helper?.scripts)
  ? data.extensions.tavern_helper.scripts
  : [];
const 找脚本 = names => 原脚本.find(item => names.includes(item.name));
const mvuContent = 去源码映射(readFileSync(path.join(产物, '脚本/MVU/index.js'), 'utf8'));
const schemaContent = 去源码映射(readFileSync(path.join(产物, '脚本/变量结构/index.js'), 'utf8'));
const logicContent = `import '${BASE}/dist/秦璐重置版/脚本/游戏逻辑/index.js';`;

data.extensions.tavern_helper = {
  ...(data.extensions.tavern_helper ?? {}),
  scripts: [
    标准脚本('MVU', mvuContent, 找脚本(['MVU', 'MUV'])),
    标准脚本('变量结构', schemaContent, 找脚本(['变量结构'])),
    标准脚本('游戏逻辑', logicContent, 找脚本(['游戏逻辑'])),
  ],
  variables: data.extensions.tavern_helper?.variables ?? {},
};

data.name = 配置.name;
data.character_version = 配置.version;
data.creator = data.creator || 'shujshujun';
data.creator_notes = [
  `《秦璐》v${配置.version} ${配置.edition}。`,
  '本版完成苏文位置连续性修复：正文与变量使用同拍位置，普通对白不再误触发跨时段跳转。',
  '新增永久道具“静滞怀表”：售价1000货币，启用后永久冻结苏文状态、位置及对秦璐/苏梦两项疑心值。',
  `资源固定到标签 ${配置.tag}；需要启用最新版酒馆助手与 MVU。`,
].join('\n');
data.tags = [...new Set([...(Array.isArray(data.tags) ? data.tags : []), '秦璐', '完结版'])];
data.extensions.world = 配置.name;
data.character_book = {
  ...(data.character_book ?? {}),
  name: 配置.name,
  description: `《秦璐》v${配置.version} ${配置.edition}内嵌世界书`,
  scan_depth: data.character_book?.scan_depth ?? 4,
  token_budget: data.character_book?.token_budget ?? 0,
  recursive_scanning: data.character_book?.recursive_scanning ?? false,
  extensions: data.character_book?.extensions ?? {},
  entries: 读取世界书(),
};

卡.spec = 'chara_card_v3';
卡.spec_version = '3.0';
卡.data = data;
卡.name = data.name;
卡.description = data.description ?? '';
卡.personality = data.personality ?? '';
卡.scenario = data.scenario ?? '';
卡.first_mes = data.first_mes ?? '';
卡.mes_example = data.mes_example ?? '';
卡.creatorcomment = data.creator_notes;
卡.tags = data.tags;
卡.create_date = 配置.releaseDate;

const 卡JSON = JSON.stringify(卡, null, 2);
writeFileSync(JSON输出, 卡JSON, 'utf8');
写PNG角色卡(模板PNG, 卡JSON, PNG输出);

const 回读JSON = readFileSync(JSON输出, 'utf8');
const PNG内嵌卡 = 读取内嵌卡(PNG输出);
if (PNG内嵌卡.length !== 1) throw new Error(`发布 PNG 的 chara 块数量不是1，而是 ${PNG内嵌卡.length}`);
if (PNG内嵌卡[0] !== 回读JSON) throw new Error('发布 PNG 内嵌 JSON 与独立 JSON 不一致');
const parsed = JSON.parse(回读JSON);
if (parsed.spec !== 'chara_card_v3' || parsed.spec_version !== '3.0') throw new Error('发布卡不是 chara_card_v3');
if (parsed.data.character_version !== 配置.version) throw new Error('角色卡版本与发布配置不一致');
if (!logicContent.includes(`@${配置.tag}/`)) throw new Error('游戏逻辑资源未固定到发布标签');

const jsonBytes = readFileSync(JSON输出);
const pngBytes = readFileSync(PNG输出);
const checksums = {
  json: sha256(jsonBytes),
  png: sha256(pngBytes),
};
writeFileSync(
  校验输出,
  `${checksums.json}  ${path.basename(JSON输出)}\n${checksums.png}  ${path.basename(PNG输出)}\n`,
  'utf8',
);

const manifest = {
  name: 配置.name,
  version: 配置.version,
  edition: 配置.edition,
  tag: 配置.tag,
  releaseBranch: 配置.releaseBranch,
  releaseDate: 配置.releaseDate,
  template: path.basename(模板路径),
  templateCharaChunks: 模板chara块数,
  card: {
    spec: parsed.spec,
    specVersion: parsed.spec_version,
    characterVersion: parsed.data.character_version,
    firstMesLength: String(parsed.data.first_mes ?? '').length,
    alternateGreetings: parsed.data.alternate_greetings?.length ?? 0,
    worldbookEntries: parsed.data.character_book.entries.length,
    enabledWorldbookEntries: parsed.data.character_book.entries.filter(entry => entry.enabled).length,
    regexScripts: parsed.data.extensions.regex_scripts.map(item => item.scriptName),
    helperScripts: parsed.data.extensions.tavern_helper.scripts.map(item => item.name),
  },
  files: {
    json: { name: path.basename(JSON输出), bytes: jsonBytes.length, sha256: checksums.json },
    png: { name: path.basename(PNG输出), bytes: pngBytes.length, sha256: checksums.png },
    checksums: { name: path.basename(校验输出) },
  },
};
writeFileSync(清单输出, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`✓ ${JSON输出}`);
console.log(`✓ ${PNG输出}（唯一 chara 块，内嵌 JSON 与独立 JSON 逐字节一致）`);
console.log(`✓ ${校验输出}`);
console.log(`✓ ${清单输出}`);
console.log(`  版本：${配置.version} ${配置.edition} | 标签：${配置.tag}`);
console.log(
  `  世界书：${manifest.card.worldbookEntries}项（启用${manifest.card.enabledWorldbookEntries}） | 正则：${manifest.card.regexScripts.length} | 脚本：${manifest.card.helperScripts.length}`,
);
console.log(`  JSON：${jsonBytes.length} bytes | SHA-256 ${checksums.json}`);
console.log(`  PNG：${pngBytes.length} bytes | SHA-256 ${checksums.png}`);
