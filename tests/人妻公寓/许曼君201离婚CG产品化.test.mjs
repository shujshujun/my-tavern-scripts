/* eslint-disable import-x/no-nodejs-modules -- Node-only product contract test */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const ROOT = resolve(new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1'));
const SOURCE_ROOT = join(ROOT, 'output/imagegen/rqgy-reset/adult-completion/xumanjun-divorce-ending');
const SOURCE_MANIFEST = join(SOURCE_ROOT, 'manifest-v2.json');
const PRODUCT_ROOT = join(ROOT, 'src/人妻公寓/素材/特殊场景/许曼君离婚');
const PRODUCT_MANIFEST = join(ROOT, 'src/人妻公寓/素材/特殊场景/许曼君离婚CG.manifest.json');
const EXPECTED_IDS = Array.from({ length: 15 }, (_, index) => `XMJ-DIV-${String(index + 1).padStart(2, '0')}`);
const PRESENTATION_SHA = {
  'XMJ-DIV-11': '80FFCC4FBA142899E156A135D36EA124E430E83334715266DDF4956AE01B69BE',
  'XMJ-DIV-12': '47853B03100AC97424F2A40281BDE7A19C8AD1B1ADFAFB5A40CE0CDC204BB6DF',
  'XMJ-DIV-13': '02F3BE4B28D04BBDED6EBD58CB4C0657A15D7FF6195554FB2BA58D560A101A6A',
};

const json = path => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();

function productById() {
  const manifest = json(PRODUCT_MANIFEST);
  return new Map(manifest.items.map(item => [item.运行ID, item]));
}

test('产品目录恰好包含15张XMJ-DIV WebP和一份闭合manifest', () => {
  const files = readdirSync(PRODUCT_ROOT).sort();
  assert.deepEqual(files, EXPECTED_IDS.map(id => `${id}.webp`));
  const manifest = json(PRODUCT_MANIFEST);
  assert.equal(manifest.运行ID总数, 15);
  assert.equal(manifest.items.length, 15);
  assert.deepEqual(manifest.items.map(item => item.运行ID), EXPECTED_IDS);
  assert.equal(manifest.禁止运行时二次分镜, true);
  assert.equal(manifest.产品状态, '本地产品化·待不可变标签');
});

test('每张产品均为非空WebP，文件字节数和SHA与产品manifest双向一致', () => {
  const products = productById();
  for (const id of EXPECTED_IDS) {
    const item = products.get(id);
    assert.ok(item, `${id} missing in product manifest`);
    const path = join(PRODUCT_ROOT, `${id}.webp`);
    const bytes = readFileSync(path);
    assert.ok(statSync(path).size > 100_000, `${id} is unexpectedly small`);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
    assert.equal(item.产品文件路径.replaceAll('\\', '/'), `src/人妻公寓/素材/特殊场景/许曼君离婚/${id}.webp`);
    assert.equal(item.产品字节数, statSync(path).size);
    assert.equal(item.产品SHA256, sha256(path));
    assert.deepEqual(item.产品尺寸, { 宽: 1536, 高: 1024 });
  }
});

test('DIV-11/12/13只使用第二次封板presentation源和指定SHA，基础无分镜图未进入产品manifest', () => {
  const source = json(SOURCE_MANIFEST);
  const artifacts = new Map(source.generatedArtifacts.map(item => [item.id, item]));
  const products = productById();
  for (const id of EXPECTED_IDS) {
    const artifact = artifacts.get(id);
    const item = products.get(id);
    assert.ok(artifact && item);
    if (PRESENTATION_SHA[id]) {
      assert.equal(artifact.productPreferred, true);
      assert.equal(artifact.presentationSha256, PRESENTATION_SHA[id]);
      assert.equal(item.productPreferred, true);
      assert.equal(item.源选择规则, 'generatedArtifacts.presentationPath/presentationSha256');
      assert.equal(item.最终源SHA256, PRESENTATION_SHA[id]);
      assert.match(item.最终采用源路径, /presentation-with-inset\//u);
      assert.notEqual(item.最终源SHA256, artifact.sha256, `${id} must not use the clean base result`);
      assert.doesNotMatch(item.最终采用源路径, /built-in-reference-edits\//u);
    } else {
      assert.equal(item.productPreferred, false);
      assert.equal(item.源选择规则, 'generatedArtifacts.path/sha256');
      assert.equal(item.最终源SHA256, artifact.sha256);
      assert.ok(item.最终采用源路径.endsWith(artifact.path.replaceAll('\\', '/')));
    }
  }
});

test('产品manifest的15个实际源不登记local-insets、拒绝稿、实验图或审核文件', () => {
  const manifest = json(PRODUCT_MANIFEST);
  const actualSources = manifest.items.map(item => item.最终采用源路径).join('\n');
  assert.doesNotMatch(actualSources, /(?:^|[\\/])local-insets[\\/]/u);
  assert.doesNotMatch(actualSources, /rejectedAttempts|nonProductionExperiments|reviews[\\/]/u);
  assert.doesNotMatch(actualSources, /draw1.*(?:拒绝|rejected)/iu);
  assert.ok(manifest.禁止生产读取.some(path => path.includes('local-insets')), 'manifest应显式记录禁止读取local-insets');
});

test('DIV-04/05是唯一长期背景；运行时仅拼产品ID，不读取生成目录或再次合成右下分镜', () => {
  const manifest = json(PRODUCT_MANIFEST);
  assert.deepEqual(
    manifest.items.filter(item => item.允许长期背景).map(item => item.运行ID),
    ['XMJ-DIV-04', 'XMJ-DIV-05'],
  );
  const route = readFileSync(join(ROOT, 'src/人妻公寓/脚本/游戏逻辑/许曼君离婚系统.ts'), 'utf8');
  assert.doesNotMatch(route, /output\/imagegen|local-insets|presentation-with-inset|canvas|drawImage/u);
  const assets = readFileSync(join(ROOT, 'src/人妻公寓/界面/客户端/assets.ts'), 'utf8');
  const section = assets.slice(assets.indexOf('export const 许曼君离婚素材发布配置'), assets.indexOf('/**', assets.indexOf('export function 许曼君离婚图片')));
  assert.match(section, /产品目录: 'src\/人妻公寓\/素材\/特殊场景\/许曼君离婚'/u);
  assert.match(section, /__RQGY_XMJ_DIVORCE_ASSET_BASE__/u);
  assert.match(section, /不可变标签: ''/u);
  assert.doesNotMatch(section, /output\/imagegen|local-insets|presentation-with-inset|canvas|drawImage/u);
});

test('源manifest自身SHA被产品manifest记录，构建脚本强制验证全部15张源与三张presentation SHA', () => {
  const product = json(PRODUCT_MANIFEST);
  assert.equal(product.源manifestSHA256, sha256(SOURCE_MANIFEST));
  const script = readFileSync(join(ROOT, 'scripts/build-rqgy-xumanjun-divorce-assets.py'), 'utf8');
  assert.match(script, /EXPECTED_IDS = tuple\(f"XMJ-DIV-/u);
  assert.match(script, /EXPECTED_PRESENTATION_SHA/u);
  assert.match(script, /actual_sha != source_sha/u);
  assert.match(script, /presentationPath/u);
  assert.match(script, /presentationSha256/u);
});
