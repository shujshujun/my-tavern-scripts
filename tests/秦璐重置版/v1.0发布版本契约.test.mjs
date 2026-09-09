/* eslint-disable import-x/no-nodejs-modules -- Node-only release contract test */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = relative => readFileSync(new URL(relative, root));
const readText = relative => read(relative).toString('utf8');
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex').toUpperCase();

const config = JSON.parse(readText('src/秦璐重置版/发布配置.json'));
const manifest = JSON.parse(readText('dist/秦璐重置版/秦璐_v1.0_完结版.manifest.json'));
const cardText = readText('dist/秦璐重置版/秦璐_v1.0_完结版.json');
const card = JSON.parse(cardText);
const png = read('dist/秦璐重置版/秦璐_v1.0_完结版.png');
const checksums = readText('dist/秦璐重置版/秦璐_v1.0_完结版.sha256');
const statusbar = readText('dist/秦璐重置版/界面/状态栏/index.html');
const gameLogic = readText('dist/秦璐重置版/脚本/游戏逻辑/index.js');

function readCharaBlocks(buffer) {
  const signature = Buffer.from('89504e470d0a1a0a', 'hex');
  assert.equal(buffer.subarray(0, 8).equals(signature), true, '发布角色卡必须是有效 PNG');

  const blocks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    assert.ok(end <= buffer.length, `PNG 块 ${type} 越界`);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'tEXt' && data.subarray(0, 6).toString('latin1') === 'chara\0') {
      blocks.push(Buffer.from(data.subarray(6).toString('latin1'), 'base64').toString('utf8'));
    }
    offset = end;
  }
  return blocks;
}

test('发布配置、分支与标签统一为秦璐 v1.0 完结版', () => {
  assert.deepEqual(
    {
      name: config.name,
      version: config.version,
      edition: config.edition,
      tag: config.tag,
      releaseBranch: config.releaseBranch,
    },
    {
      name: '秦璐',
      version: '1.0',
      edition: '完结版',
      tag: 'qin1.0',
      releaseBranch: 'release/qin1.0',
    },
  );
  assert.equal(manifest.version, config.version);
  assert.equal(manifest.edition, config.edition);
  assert.equal(manifest.tag, config.tag);
  assert.equal(manifest.releaseBranch, config.releaseBranch);
});

test('JSON 角色卡升级为 v3，并保留原卡开场', () => {
  assert.equal(card.spec, 'chara_card_v3');
  assert.equal(card.spec_version, '3.0');
  assert.equal(card.data.name, '秦璐');
  assert.equal(card.data.character_version, '1.0');
  assert.equal(card.data.first_mes.length, 1369);
  assert.match(card.data.first_mes, /<StatusPlaceHolderImpl\/>/);
  assert.match(card.data.creator_notes, /v1\.0 完结版/);
  assert.match(card.data.creator_notes, /静滞怀表/);
  assert.match(card.data.creator_notes, /1000货币/);
  assert.match(card.data.creator_notes, /永久冻结/);
});

test('世界书、正则与酒馆助手脚本完整接入 qin1.0', () => {
  const entries = card.data.character_book.entries;
  assert.equal(entries.length, 9);
  assert.equal(entries.filter(entry => entry.enabled).length, 8);

  const regexes = card.data.extensions.regex_scripts;
  assert.deepEqual(regexes.map(item => item.scriptName), ['状态栏', '行动选项', '去除变量更新', '1.对AI隐藏状态栏']);
  const statusRegex = regexes.find(item => item.scriptName === '状态栏');
  const optionsRegex = regexes.find(item => item.scriptName === '行动选项');
  assert.match(statusRegex.replaceString, /@qin1\.0\/dist\/秦璐重置版\/界面\/状态栏\/index\.html/);
  assert.match(optionsRegex.replaceString, /@qin1\.0\/dist\/秦璐重置版\/界面\/行动选项\/index\.html/);

  const scripts = card.data.extensions.tavern_helper.scripts;
  assert.deepEqual(scripts.map(item => item.name), ['MVU', '变量结构', '游戏逻辑']);
  assert.match(scripts.find(item => item.name === '游戏逻辑').content, /@qin1\.0\/dist\/秦璐重置版\/脚本\/游戏逻辑\/index\.js/);
  assert.ok(scripts.find(item => item.name === 'MVU').content.length > 100);
  assert.ok(scripts.find(item => item.name === '变量结构').content.length > 1000);
});

test('正式构建已包含永久静滞与1000货币定价', () => {
  assert.match(statusbar, /静滞怀表/);
  assert.match(statusbar, /1000 货币/);
  assert.match(statusbar, /永久静滞/);
  assert.match(gameLogic, /静滞怀表/);
  assert.doesNotMatch(statusbar, /剩余\s*\d+\s*回合/);
});

test('PNG 只有一个 chara 块，且内嵌 JSON 与独立 JSON 逐字节一致', () => {
  const blocks = readCharaBlocks(png);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0], cardText);
});

test('发布清单、文件大小和 SHA-256 校验一致', () => {
  const jsonBytes = Buffer.from(cardText, 'utf8');
  assert.equal(manifest.files.json.bytes, jsonBytes.length);
  assert.equal(manifest.files.png.bytes, png.length);
  assert.equal(manifest.files.json.sha256, sha256(jsonBytes));
  assert.equal(manifest.files.png.sha256, sha256(png));
  assert.match(checksums, new RegExp(`^${manifest.files.json.sha256}  秦璐_v1\\.0_完结版\\.json`, 'm'));
  assert.match(checksums, new RegExp(`^${manifest.files.png.sha256}  秦璐_v1\\.0_完结版\\.png`, 'm'));
});
