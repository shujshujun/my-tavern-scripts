/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const nativeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

function resolveLocalModule(request, parentFile) {
  const base = path.resolve(path.dirname(parentFile), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')];
  const resolved = candidates.find(candidate => existsSync(candidate));
  if (!resolved) throw new Error(`无法解析 ${request}（来自 ${parentFile}）`);
  return resolved;
}

/** 只为本测试加载纯 TS 逻辑模块，避免依赖浏览器运行时。 */
function loadTypeScriptModule(filePath) {
  const absolutePath = path.resolve(filePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;

  const source = readFileSync(absolutePath, 'utf8');
  const output = transpileModule(source, {
    fileName: absolutePath,
    compilerOptions: {
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(absolutePath, module);
  const localRequire = request =>
    request.startsWith('.') ? loadTypeScriptModule(resolveLocalModule(request, absolutePath)) : nativeRequire(request);
  const execute = new Function('exports', 'require', 'module', '__filename', '__dirname', output);
  execute(module.exports, localRequire, module, absolutePath, path.dirname(absolutePath));
  return module.exports;
}

const schemaPath = fileURLToPath(new URL('../../src/秦璐重置版/schema.ts', import.meta.url));
const routinePath = fileURLToPath(
  new URL('../../src/秦璐重置版/脚本/游戏逻辑/suwenRoutine.ts', import.meta.url),
);
const itemPath = fileURLToPath(new URL('../../src/秦璐重置版/脚本/游戏逻辑/itemSystem.ts', import.meta.url));
const indexSource = readFileSync(
  new URL('../../src/秦璐重置版/脚本/游戏逻辑/index.ts', import.meta.url),
  'utf8',
);
const uiSource = readFileSync(new URL('../../src/秦璐重置版/界面/状态栏/App.vue', import.meta.url), 'utf8');
const initvarSource = readFileSync(new URL('../../src/秦璐重置版/世界书/initvar.yaml', import.meta.url), 'utf8');
const schemaJsonSource = readFileSync(new URL('../../src/秦璐重置版/schema.json', import.meta.url), 'utf8');

const { Schema } = loadTypeScriptModule(schemaPath);
const {
  advanceSuwenRoutine,
  detectJumpMoment,
  previewSuwenRoutine,
} = loadTypeScriptModule(routinePath);
const {
  SUWEN_STASIS_ITEM,
  SUWEN_STASIS_PRICE,
  activateSuwenStasisItem,
  isSuwenStasisActive,
  purchaseSuwenStasisItem,
} = loadTypeScriptModule(itemPath);

function makeData() {
  return Schema.parse({});
}

test('schema.json 与 schema.ts 的 Zod 输入结构完全同步', () => {
  const { toJSONSchema } = nativeRequire('zod');
  assert.deepEqual(JSON.parse(schemaJsonSource), toJSONSchema(Schema, { io: 'input', reused: 'ref' }));
});

test('initvar 与新 Schema 兼容，并为旧档缺省补齐怀表状态', () => {
  const { parse } = nativeRequire('yaml');
  const initialized = Schema.parse(parse(initvarSource));
  const legacy = Schema.parse({
    苏文状态: { 当前状态: '外出', 当前位置: '外面' },
    系统: { 货币: 100 },
  });
  const legacyActive = Schema.parse({
    苏文状态: {
      当前状态: '外出',
      当前位置: '外面',
      位置数值冻结: {
        是否生效: true,
        冻结状态: '外出',
        冻结位置: '外面',
        冻结对秦璐疑心值: 21,
        冻结对苏梦疑心值: 34,
        剩余结算回合: 2,
        上次结算楼层: 50,
      },
    },
    系统: { 道具状态: { 静滞怀表: '使用中' } },
  });

  assert.equal(initialized.系统.道具状态[SUWEN_STASIS_ITEM], '未购买');
  assert.equal(initialized.苏文状态.位置数值冻结.是否生效, false);
  assert.equal(initialized.系统._苏文作息游标, 11);
  assert.equal(initialized.苏文状态.当前位置, '客厅');
  assert.equal(legacy.系统._苏文作息游标, 11);
  assert.equal(isSuwenStasisActive(legacyActive), true);
  assert.equal('剩余结算回合' in legacyActive.苏文状态.位置数值冻结, false);
});

test('时间跳转只认明确推进；对白提到明天不会让苏文瞬移', () => {
  assert.equal(detectJumpMoment('你明天还要工作吗？'), null);
  assert.equal(detectJumpMoment('明天记得早点回来。'), null);
  assert.equal(detectJumpMoment('睡到明天早上'), '次日早晨');
  assert.equal(detectJumpMoment('第二天晚上，继续行动。'), '次日晚间');
});

test('旧档中状态=外出但游标=主卧时先自愈，不会下一回复直达卧室', () => {
  const data = makeData();
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.系统._苏文作息游标 = 0;
  data.系统._上次处理楼层 = -1;

  const preview = previewSuwenRoutine(data, 10, '继续观察秦璐');
  assert.deepEqual(
    { 状态: preview.状态, 位置: preview.位置 },
    { 状态: '外出', 位置: '外面' },
  );

  advanceSuwenRoutine(data, 10, '继续观察秦璐');
  assert.equal(data.苏文状态.当前状态, '外出');
  assert.equal(data.苏文状态.当前位置, '外面');
  assert.notEqual(data.苏文状态.当前位置, '主卧');
});

test('正常下班由单位先到餐厅，并把同一落点提供给提示词与写回', () => {
  const data = makeData();
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.系统._苏文作息游标 = 8;
  data.系统._上次处理楼层 = -1;

  const preview = previewSuwenRoutine(data, 20, '继续');
  assert.equal(preview.状态, '在家');
  assert.equal(preview.位置, '餐厅');
  assert.match(preview.转场说明, /下班、进门/);
  assert.match(preview.转场说明, /禁止无过渡直接出现在主卧/);

  advanceSuwenRoutine(data, 20, '继续');
  assert.equal(data.苏文状态.当前状态, preview.状态);
  assert.equal(data.苏文状态.当前位置, preview.位置);
});

test('“第二天晚上”最长语义落到晚间活动段，而不是被“第二天”截成主卧开场', () => {
  const data = makeData();
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.系统._苏文作息游标 = 8;
  data.系统._上次处理楼层 = -1;

  const preview = previewSuwenRoutine(data, 21, '第二天晚上，回到客厅看看');
  assert.equal(preview.跳转类型, '次日晚间');
  assert.equal(preview.状态, '在家');
  assert.equal(preview.位置, '客厅');
});

test('静滞怀表按1000货币购买，启用后永久冻结位置、状态和两项疑心值', () => {
  const data = makeData();
  data.系统.货币 = 1500;
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.苏文状态.对秦璐疑心值 = 37;
  data.苏文状态.对苏梦疑心值 = 52;
  data.系统._苏文作息游标 = 5;

  assert.equal(SUWEN_STASIS_PRICE, 1000);
  assert.equal(purchaseSuwenStasisItem(data).ok, true);
  assert.equal(data.系统.货币, 500);
  assert.equal(data.系统.道具状态[SUWEN_STASIS_ITEM], '已购买');
  assert.equal(activateSuwenStasisItem(data, 30).ok, true);
  assert.equal(isSuwenStasisActive(data), true);
  assert.equal(data.系统.道具状态[SUWEN_STASIS_ITEM], '使用中');
  assert.match(data.系统._待发送道具事件, /永久/);

  const frozenCursor = data.系统._苏文作息游标;
  data.苏文状态.当前状态 = '在家';
  data.苏文状态.当前位置 = '主卧';
  data.苏文状态.对秦璐疑心值 = 99;
  data.苏文状态.对苏梦疑心值 = 0;
  advanceSuwenRoutine(data, 31, '继续');

  assert.equal(data.苏文状态.当前状态, '外出');
  assert.equal(data.苏文状态.当前位置, '外面');
  assert.equal(data.苏文状态.对秦璐疑心值, 37);
  assert.equal(data.苏文状态.对苏梦疑心值, 52);
  assert.equal(data.系统._苏文作息游标, frozenCursor);
  assert.equal(data.苏文状态.位置数值冻结.是否生效, true);
});

test('静滞怀表跨任意楼层与同楼ROLL都永久生效，不会到期或重新开放购买', () => {
  const data = makeData();
  data.系统.货币 = 1000;
  data.苏文状态.当前状态 = '在家';
  data.苏文状态.当前位置 = '客厅';
  data.苏文状态.对秦璐疑心值 = 12;
  data.苏文状态.对苏梦疑心值 = 18;
  data.系统._苏文作息游标 = 11;
  purchaseSuwenStasisItem(data);
  activateSuwenStasisItem(data, 40);

  const frozenCursor = data.系统._苏文作息游标;
  for (const floor of [41, 41, 42, 50, 100, 999]) {
    data.苏文状态.当前状态 = '睡眠';
    data.苏文状态.当前位置 = '主卧';
    data.苏文状态.对秦璐疑心值 = 100;
    data.苏文状态.对苏梦疑心值 = 100;
    advanceSuwenRoutine(data, floor, floor === 41 ? '重新生成同一楼' : '继续');

    assert.equal(data.苏文状态.当前状态, '在家');
    assert.equal(data.苏文状态.当前位置, '客厅');
    assert.equal(data.苏文状态.对秦璐疑心值, 12);
    assert.equal(data.苏文状态.对苏梦疑心值, 18);
    assert.equal(data.系统._苏文作息游标, frozenCursor);
    assert.equal(isSuwenStasisActive(data), true);
    assert.equal(data.系统.道具状态[SUWEN_STASIS_ITEM], '使用中');
  }

  const farFuturePreview = previewSuwenRoutine(data, 10000, '推进到很多天以后');
  assert.equal(farFuturePreview.状态, '在家');
  assert.equal(farFuturePreview.位置, '客厅');
  assert.match(farFuturePreview.转场说明, /永久生效/);
  assert.equal(purchaseSuwenStasisItem(data).ok, false);
  assert.doesNotMatch(data.系统._待发送道具事件, /效果已经结束/);
});

test('提示词、保护回滚与状态栏都接入同一套位置预览和怀表接口', () => {
  assert.match(indexSource, /previewSuwenRoutine\(data, messageId, playerInput\)/);
  assert.match(indexSource, /buildStatusSnapshot\(data, suwenPlan\)/);
  assert.match(indexSource, /位置数值冻结: \{ \.\.\.data\.苏文状态\.位置数值冻结 \}/);
  assert.match(indexSource, /data\.苏文状态\.对秦璐疑心值 = snap\.苏文状态\.对秦璐疑心值/);
  assert.match(indexSource, /data\.系统\.道具状态 = \{ \.\.\.snap\.系统\.道具状态 \}/);
  assert.match(uiSource, /⌚ 静滞怀表/);
  assert.match(uiSource, /purchaseSuwenStasisItem/);
  assert.match(uiSource, /activateSuwenStasisItem/);
  assert.match(uiSource, /永久冻结苏文当前状态、位置及两项疑心值/);
  assert.match(uiSource, /永久静滞 · 位置、状态与疑心值已锁定/);
  assert.doesNotMatch(uiSource, /stasisRemaining|SUWEN_STASIS_TURNS/);
});
