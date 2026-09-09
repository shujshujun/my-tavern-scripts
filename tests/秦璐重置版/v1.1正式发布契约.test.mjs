/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const config = JSON.parse(readFileSync(path.join(root, 'src/秦璐重置版/发布配置.json'), 'utf8'));
const dist = path.join(root, 'dist/秦璐重置版');
const releaseBase = `秦璐_v${config.version}_${config.edition}`;
const localBase = `${releaseBase}_本地自包含测试`;

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase();
}

function readPngCards(file) {
  const png = readFileSync(file);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  let offset = 8;
  const cards = { chara: [], ccv3: [] };
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    assert.ok(end <= png.length, `PNG 块越界：${type}`);
    const data = png.subarray(offset + 8, offset + 8 + length);
    const nul = type === 'tEXt' ? data.indexOf(0) : -1;
    const keyword = nul >= 0 ? data.subarray(0, nul).toString('latin1').toLowerCase() : '';
    if (keyword === 'chara' || keyword === 'ccv3') {
      cards[keyword].push(Buffer.from(data.subarray(nul + 1).toString('latin1'), 'base64').toString('utf8'));
    }
    offset = end;
  }
  return cards;
}

function decodeInlinePage(replaceString) {
  const match = replaceString.match(/atob\('([^']+)'\)/);
  assert.ok(match, '本地自包含正则缺少内嵌页面载荷');
  return Buffer.from(match[1], 'base64').toString('utf8');
}

test(`${releaseBase} 四项交付文件齐全且 SHA 清单一致`, () => {
  for (const ext of ['json', 'png', 'sha256', 'manifest.json']) {
    assert.equal(existsSync(path.join(dist, `${releaseBase}.${ext}`)), true, `缺少 ${releaseBase}.${ext}`);
  }
  const checksum = readFileSync(path.join(dist, `${releaseBase}.sha256`), 'utf8');
  assert.match(checksum, new RegExp(`${sha256(path.join(dist, `${releaseBase}.json`))}  ${releaseBase}\\.json`));
  assert.match(checksum, new RegExp(`${sha256(path.join(dist, `${releaseBase}.png`))}  ${releaseBase}\\.png`));
});

test(`${releaseBase} PNG 的 chara/ccv3 各唯一一块并都与独立 JSON 逐字节一致`, () => {
  const json = readFileSync(path.join(dist, `${releaseBase}.json`), 'utf8');
  const cards = readPngCards(path.join(dist, `${releaseBase}.png`));
  assert.equal(cards.chara.length, 1);
  assert.equal(cards.ccv3.length, 1);
  assert.equal(cards.chara[0], json);
  assert.equal(cards.ccv3[0], json);
});

test('发布配置使用 Git 0.40 完整重置版基线和 v1.1 独立标签', () => {
  assert.equal(config.baselineTag, '0.40');
  assert.equal(config.version, '1.1');
  assert.equal(config.edition, '完结版');
  assert.equal(config.tag, 'qin1.1');
  assert.equal(config.resourceTag, 'qin1.1.1');
  assert.equal(config.releaseBranch, 'release/qin1.1');
});

test('正式卡保持 v1.1，并固定到唯一热修资源标签 qin1.1.1', () => {
  const card = readJson(path.join(dist, `${releaseBase}.json`));
  const text = JSON.stringify(card);
  assert.equal(card.spec, 'chara_card_v3');
  assert.equal(card.spec_version, '3.0');
  assert.equal(card.data.character_version, '1.1');
  assert.equal(card.data.first_mes.length, 1369);
  assert.equal(card.data.character_book.entries.length, 9);
  assert.equal(card.data.character_book.entries.filter(entry => entry.enabled).length, 8);
  assert.deepEqual(card.data.extensions.tavern_helper.scripts.map(script => script.name), [
    'MVU',
    '变量结构',
    '游戏逻辑',
  ]);
  assert.deepEqual(card.data.extensions.regex_scripts.map(regex => regex.scriptName), [
    '状态栏',
    '行动选项',
    '去除变量更新',
    '1.对AI隐藏状态栏',
  ]);
  assert.equal(text.includes('@qin1.1.1/'), true);
  assert.equal(text.includes('@qin1.1/'), false);
  assert.equal(text.includes('@qin1.0/'), false);
  assert.equal(text.includes('@qin1.0.1/'), false);
});

test('状态栏构建产物已正确导入 Pinia defineStore，不含会导致 TT 空白的裸调用', () => {
  const statusHtml = readFileSync(path.join(dist, '界面/状态栏/index.html'), 'utf8');
  const piniaImport = statusHtml.match(/import\{([^}]*)\}from['"][^'"]*pinia\/\+esm['"]/);
  assert.ok(piniaImport, '状态栏缺少 Pinia ESM 导入');
  assert.match(piniaImport[1], /defineStore/, '状态栏没有从 Pinia 导入 defineStore');
  assert.doesNotMatch(statusHtml, /\bdefineStore\s*\(/, '状态栏仍含未解析的 defineStore(...) 调用');
});

const localArtifactsExist = ['json', 'png', 'sha256', 'manifest.json'].every(ext =>
  existsSync(path.join(dist, `${localBase}.${ext}`)),
);

test('本地测试卡精确内嵌本次 v1.1 构建', { skip: !localArtifactsExist }, () => {
  const card = readJson(path.join(dist, `${localBase}.json`));
  const text = JSON.stringify(card);
  const statusRegex = card.data.extensions.regex_scripts.find(regex => regex.scriptName === '状态栏');
  const actionRegex = card.data.extensions.regex_scripts.find(regex => regex.scriptName === '行动选项');
  const logicScript = card.data.extensions.tavern_helper.scripts.find(script => script.name === '游戏逻辑');
  const statusHtml = readFileSync(path.join(dist, '界面/状态栏/index.html'), 'utf8');
  const actionHtml = readFileSync(path.join(dist, '界面/行动选项/index.html'), 'utf8');
  const logic = readFileSync(path.join(dist, '脚本/游戏逻辑/index.js'), 'utf8')
    .replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
    .trim();

  assert.equal(text.includes('@qin1.1.1/'), false);
  assert.equal(decodeInlinePage(statusRegex.replaceString), statusHtml);
  assert.equal(decodeInlinePage(actionRegex.replaceString), actionHtml);
  assert.equal(logicScript.content, logic);
  for (const marker of ['路线共鸣', '影像档案', '静滞怀表', '立即使用（永久）', '苏文视角']) {
    assert.equal(statusHtml.includes(marker), true, `完整状态栏缺少 ${marker}`);
  }
  assert.ok(Buffer.byteLength(statusHtml) >= 120_000);
});

test('世界书索引只引用当前存在的九项内容', () => {
  const index = readFileSync(path.join(root, 'src/秦璐重置版/世界书/index.yaml'), 'utf8');
  assert.equal(index.includes('系统设定/行动选项.yaml'), false);
});
