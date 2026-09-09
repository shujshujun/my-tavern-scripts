/* eslint-disable import-x/no-nodejs-modules -- Node-only release builder */
/**
 * 《秦璐》v1.1 完结版组卡脚本。
 *
 * 权威基线：Git 标签 0.40 的完整“秦璐重置版”。
 * 在完整游戏架构上叠加苏文位置连续性修复与永久静滞怀表。
 *
 * 用法：node src/秦璐重置版/组卡.mjs
 * 可选：QIN_CARD_TEMPLATE=D:/path/to/秦璐.png node src/秦璐重置版/组卡.mjs
 * 可选：QIN_OUTPUT_DIR=D:/path/to/output node src/秦璐重置版/组卡.mjs
 * 可选：QIN_CARD_ONLY=1（目标目录只写 PNG 与 JSON）
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const 根 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const 项目 = path.join(根, 'src/秦璐重置版');
const 构建产物 = path.join(根, 'dist/秦璐重置版');
const 发布产物 = process.env.QIN_OUTPUT_DIR ? path.resolve(process.env.QIN_OUTPUT_DIR) : 构建产物;
const 配置 = JSON.parse(readFileSync(path.join(项目, '发布配置.json'), 'utf8'));
const 资源标签 = 配置.resourceTag ?? 配置.tag;
const 本地自包含 = process.env.QIN_SELF_CONTAINED === '1';
const 仅输出角色卡 = process.env.QIN_CARD_ONLY === '1';
const 发布文件基名 = `${配置.name}_v${配置.version}_${配置.edition}`;
const 文件基名 = 本地自包含 ? `${发布文件基名}_本地自包含测试` : 发布文件基名;
const JSON输出 = path.join(发布产物, `${文件基名}.json`);
const PNG输出 = path.join(发布产物, `${文件基名}.png`);
const 校验输出 = path.join(发布产物, `${文件基名}.sha256`);
const 清单输出 = path.join(发布产物, `${文件基名}.manifest.json`);

console.error('[qin-repack] 配置与输出路径已解析');
if (配置.baselineTag !== '0.40') throw new Error(`发布基线必须是 Git 0.40，实际为 ${配置.baselineTag}`);
if (配置.tag === 'qin1.0') throw new Error('正式发布必须使用当前版本独立标签');

const 本机卡路径 = 'D:/SillyTavern/SillyTavern-Launcher/SillyTavern/data/default-user/characters/秦璐.png';
const 模板候选 = [process.env.QIN_CARD_TEMPLATE, 本机卡路径, PNG输出].filter(Boolean);
const 模板路径 = 模板候选.find(candidate => existsSync(candidate));
if (!模板路径) {
  throw new Error(`未找到秦璐角色卡模板。请设置 QIN_CARD_TEMPLATE，已检查：${模板候选.join('、')}`);
}

const 必需产物 = [
  '界面/状态栏/index.html',
  '界面/行动选项/index.html',
  '脚本/MVU/index.js',
  '脚本/变量结构/index.js',
  '脚本/游戏逻辑/index.js',
];
for (const relative of 必需产物) {
  const file = path.join(构建产物, relative);
  if (!existsSync(file)) throw new Error(`缺少正式构建产物：${file}`);
}
console.error('[qin-repack] 模板与正式构建产物已确认');

// 直接钉住“必须仍是 0.40 完整状态栏”，防止再次把缩水界面误组进角色卡。
const 状态栏HTML = readFileSync(path.join(构建产物, '界面/状态栏/index.html'), 'utf8');
const 行动选项HTML = readFileSync(path.join(构建产物, '界面/行动选项/index.html'), 'utf8');
for (const marker of ['路线共鸣', '影像档案', '静滞怀表', '立即使用（永久）', '苏文视角']) {
  if (!状态栏HTML.includes(marker)) throw new Error(`状态栏缺少 0.40 完整架构/修复标记：${marker}`);
}
if (Buffer.byteLength(状态栏HTML) < 120_000) {
  throw new Error(`状态栏体积异常（${Buffer.byteLength(状态栏HTML)} bytes），疑似又组入缩水版本`);
}
const piniaImport = 状态栏HTML.match(/import\{([^}]*)\}from['"][^'"]*pinia\/\+esm['"]/);
if (!piniaImport?.[1].includes('defineStore')) {
  throw new Error('状态栏构建产物没有从 Pinia 导入 defineStore；该产物会在 TT 中加载成功后空白');
}
if (/\bdefineStore\s*\(/.test(状态栏HTML)) {
  throw new Error('状态栏构建产物仍含未解析的 defineStore(...) 调用，拒绝组卡');
}
console.error('[qin-repack] 状态栏完整性已确认');

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
  let ccv3块数 = 0;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > png.length) throw new Error(`模板 PNG 块损坏：${type}`);
    const data = png.subarray(offset + 8, offset + 8 + length);
    const keyword = type === 'tEXt' ? data.subarray(0, 6).toString('latin1') : '';
    if (keyword === 'chara\0') {
      chara块数 += 1;
      const decoded = Buffer.from(data.subarray(6).toString('latin1'), 'base64').toString('utf8');
      卡 = JSON.parse(decoded);
    } else if (keyword === 'ccv3\0') {
      ccv3块数 += 1;
    }
    offset = end;
  }
  if (!卡) throw new Error(`模板 PNG 不含 chara 数据：${pngPath}`);
  return { png, 卡, chara块数, ccv3块数 };
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
    const nul = type === 'tEXt' ? data.indexOf(0) : -1;
    const keyword = nul >= 0 ? data.subarray(0, nul).toString('latin1').toLowerCase() : '';
    const 是旧卡数据 = keyword === 'chara' || keyword === 'ccv3';
    if (type === 'IEND' && !已写入) {
      const 编码 = Buffer.from(Buffer.from(json, 'utf8').toString('base64'), 'latin1');
      for (const metadataKeyword of ['chara', 'ccv3']) {
        块们.push(
          png块('tEXt', Buffer.concat([Buffer.from(`${metadataKeyword}\0`, 'latin1'), 编码])),
        );
      }
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
  const cards = { chara: [], ccv3: [] };
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    const nul = type === 'tEXt' ? data.indexOf(0) : -1;
    const keyword = nul >= 0 ? data.subarray(0, nul).toString('latin1').toLowerCase() : '';
    if (keyword === 'chara' || keyword === 'ccv3') {
      cards[keyword].push(Buffer.from(data.subarray(nul + 1).toString('latin1'), 'base64').toString('utf8'));
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

/** 本地测试卡把构建后的完整页面写回当前状态栏 iframe，不依赖未发布的 Git 标签。 */
function 内嵌页面块(html) {
  const encoded = Buffer.from(html, 'utf8').toString('base64');
  return [
    '```',
    '<body>',
    '<script>',
    `const bytes=Uint8Array.from(atob('${encoded}'),c=>c.charCodeAt(0));`,
    'const page=new TextDecoder().decode(bytes);',
    'document.open();document.write(page);document.close();',
    '</script>',
    '</body>',
    '```',
  ].join('\n');
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
  if (!Array.isArray(index?.entries)) throw new Error('秦璐重置版世界书 index.yaml 缺少 entries 数组');

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

const {
  png: 模板PNG,
  卡: 模板卡,
  chara块数: 模板chara块数,
  ccv3块数: 模板ccv3块数,
} = 读取PNG卡(模板路径);
console.error('[qin-repack] 模板 PNG 元数据已读取');
if (!existsSync(发布产物)) throw new Error(`输出目录不存在：${发布产物}`);
const 卡 = structuredClone(模板卡);
const data = structuredClone(卡.data ?? 卡);
const BASE = `https://testingcf.jsdelivr.net/gh/${配置.repository}@${资源标签}`;

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
状态栏正则.replaceString = 本地自包含
  ? 内嵌页面块(状态栏HTML)
  : 加载块(`${BASE}/dist/秦璐重置版/界面/状态栏/index.html`);
状态栏正则.id = 稳定ID('regex', '状态栏');

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
行动选项正则.replaceString = 本地自包含
  ? 内嵌页面块(行动选项HTML)
  : 加载块(`${BASE}/dist/秦璐重置版/界面/行动选项/index.html`);
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
const mvuContent = 去源码映射(readFileSync(path.join(构建产物, '脚本/MVU/index.js'), 'utf8'));
const schemaContent = 去源码映射(readFileSync(path.join(构建产物, '脚本/变量结构/index.js'), 'utf8'));
const builtLogicContent = 去源码映射(readFileSync(path.join(构建产物, '脚本/游戏逻辑/index.js'), 'utf8'));
const logicContent = 本地自包含
  ? builtLogicContent
  : `import '${BASE}/dist/秦璐重置版/脚本/游戏逻辑/index.js';`;

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
  `权威源码基线为 Git ${配置.baselineTag} 的完整“秦璐重置版”，保留双角色面板、完整网店、路线共鸣、录像与苏文视角。`,
  '修复苏文位置连续性：普通对白提到明天不再误跳时段；旧档先按状态栏真值校准作息游标；下班必须经过返家转场。',
  '新增永久特权“静滞怀表”：售价1000，购买后需再次点击启用，永久冻结苏文状态、位置、作息游标与两项疑心值。',
  本地自包含
    ? '这是本地自包含测试卡：状态栏、行动选项和游戏逻辑均已内嵌，可在修正标签发布前直接测试。'
    : `资源固定到热修标签 ${资源标签}；发布版本仍为 ${配置.tag}。需要启用最新版酒馆助手与 MVU。`,
].join('\n');
data.tags = [...new Set([...(Array.isArray(data.tags) ? data.tags : []), '秦璐', '重置版', '完结版'])];
data.extensions.world = 配置.name;
data.character_book = {
  ...(data.character_book ?? {}),
  name: 配置.name,
  description: `《秦璐》v${配置.version} ${配置.edition}内嵌世界书（Git ${配置.baselineTag} 完整重置版）`,
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
console.error('[qin-repack] 新角色卡 JSON 已生成');
writeFileSync(JSON输出, 卡JSON, 'utf8');
console.error('[qin-repack] 独立 JSON 已写入');
写PNG角色卡(模板PNG, 卡JSON, PNG输出);
console.error('[qin-repack] PNG 元数据已重写');

const 回读JSON = readFileSync(JSON输出, 'utf8');
const PNG内嵌卡 = 读取内嵌卡(PNG输出);
for (const keyword of ['chara', 'ccv3']) {
  if (PNG内嵌卡[keyword].length !== 1) {
    throw new Error(`发布 PNG 的 ${keyword} 块数量不是1，而是 ${PNG内嵌卡[keyword].length}`);
  }
  if (PNG内嵌卡[keyword][0] !== 回读JSON) {
    throw new Error(`发布 PNG 的 ${keyword} 数据与独立 JSON 不一致`);
  }
}
const parsed = JSON.parse(回读JSON);
if (parsed.spec !== 'chara_card_v3' || parsed.spec_version !== '3.0') throw new Error('发布卡不是 chara_card_v3');
if (parsed.data.character_version !== 配置.version) throw new Error('角色卡版本与发布配置不一致');
if (本地自包含) {
  if (!logicContent.includes('静滞怀表') || !logicContent.includes('位置连续性')) {
    throw new Error('本地测试卡没有内嵌本次游戏逻辑');
  }
  if (!状态栏正则.replaceString.includes('document.open();document.write(page);document.close()')) {
    throw new Error('本地测试卡没有内嵌完整状态栏页面');
  }
} else {
  const 发布资源 = [
    ['状态栏正则', 状态栏正则.replaceString],
    ['行动选项正则', 行动选项正则.replaceString],
    ['游戏逻辑脚本', logicContent],
  ];
  for (const [name, content] of 发布资源) {
    if (!content.includes(`@${资源标签}/`)) throw new Error(`${name}未固定到资源标签 ${资源标签}`);
    if (content.includes('@0.40/')) throw new Error(`${name}仍残留旧 0.40 资源地址`);
  }
}
const helperScripts = parsed.data.extensions.tavern_helper.scripts;
if (helperScripts.map(item => item.name).join('|') !== 'MVU|变量结构|游戏逻辑') {
  throw new Error(`发布卡脚本清单异常：${helperScripts.map(item => item.name).join('、')}`);
}
const variableSchemaScript = helperScripts.find(item => item.name === '变量结构');
if (!variableSchemaScript?.content.includes('registerMvuSchema') || !variableSchemaScript.content.includes('位置数值冻结')) {
  throw new Error('发布卡变量结构脚本不是 qin1.1 完整版本');
}
for (const regex of parsed.data.extensions.regex_scripts) {
  if (String(regex.replaceString ?? '').includes('my-tavern-scripts@0.40/')) {
    throw new Error(`正则“${regex.scriptName}”仍残留旧 0.40 资源地址`);
  }
}
for (const script of helperScripts) {
  if (String(script.content ?? '').includes('my-tavern-scripts@0.40/')) {
    throw new Error(`脚本“${script.name}”仍残留旧 0.40 资源地址`);
  }
}
if (parsed.data.character_book.entries.length !== 9) throw new Error('0.40 实际角色卡世界书应有 9 项（已排除被删除文件留下的失效索引）');

const jsonBytes = readFileSync(JSON输出);
const pngBytes = readFileSync(PNG输出);
const checksums = { json: sha256(jsonBytes), png: sha256(pngBytes) };
if (!仅输出角色卡) {
  writeFileSync(
    校验输出,
    `${checksums.json}  ${path.basename(JSON输出)}\n${checksums.png}  ${path.basename(PNG输出)}\n`,
    'utf8',
  );
}

const manifest = {
  name: 配置.name,
  version: 配置.version,
  edition: 配置.edition,
  baselineTag: 配置.baselineTag,
  deliveryMode: 本地自包含 ? 'self-contained-local-test' : 'tagged-release',
  tag: 本地自包含 ? null : 配置.tag,
  resourceTag: 本地自包含 ? null : 资源标签,
  releaseBranch: 配置.releaseBranch,
  releaseDate: 配置.releaseDate,
  template: path.basename(模板路径),
  templateCharaChunks: 模板chara块数,
  templateCcv3Chunks: 模板ccv3块数,
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
    metadataChunks: { chara: PNG内嵌卡.chara.length, ccv3: PNG内嵌卡.ccv3.length },
    statusBarBytes: Buffer.byteLength(状态栏HTML),
    requiredStatusMarkers: ['路线共鸣', '影像档案', '静滞怀表', '立即使用（永久）', '苏文视角'],
  },
  files: {
    json: { name: path.basename(JSON输出), bytes: jsonBytes.length, sha256: checksums.json },
    png: { name: path.basename(PNG输出), bytes: pngBytes.length, sha256: checksums.png },
    checksums: { name: path.basename(校验输出) },
  },
};
if (!仅输出角色卡) writeFileSync(清单输出, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`✓ ${JSON输出}`);
console.log(`✓ ${PNG输出}（chara/ccv3 各唯一一块，均与独立 JSON 逐字节一致）`);
if (!仅输出角色卡) {
  console.log(`✓ ${校验输出}`);
  console.log(`✓ ${清单输出}`);
}
console.log(
  `  基线：Git ${配置.baselineTag} 完整重置版 | 版本：${配置.version} | ` +
    (本地自包含 ? '本地自包含测试卡' : `发布标签：${配置.tag} | 资源标签：${资源标签}`),
);
console.log(
  `  世界书：${manifest.card.worldbookEntries}项（启用${manifest.card.enabledWorldbookEntries}） | 正则：${manifest.card.regexScripts.length} | 脚本：${manifest.card.helperScripts.length}`,
);
console.log(`  状态栏：${manifest.card.statusBarBytes} bytes，0.40 完整架构标记齐全`);
console.log(`  JSON：${jsonBytes.length} bytes | SHA-256 ${checksums.json}`);
console.log(`  PNG：${pngBytes.length} bytes | SHA-256 ${checksums.png}`);
