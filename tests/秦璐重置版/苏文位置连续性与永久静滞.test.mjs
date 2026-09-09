/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = relative => readFileSync(path.join(root, relative), 'utf8');
const schemaPath = path.join(root, 'src/秦璐重置版/schema.ts');
const routinePath = path.join(root, 'src/秦璐重置版/脚本/游戏逻辑/suwenRoutine.ts');
const stasisPath = path.join(root, 'src/秦璐重置版/脚本/游戏逻辑/suwenStasis.ts');

const appSource = source('src/秦璐重置版/界面/状态栏/App.vue');
const charPanelSource = source('src/秦璐重置版/界面/状态栏/components/CharPanel.vue');
const shopPanelSource = source('src/秦璐重置版/界面/状态栏/components/ShopPanel.vue');
const shopSource = source('src/秦璐重置版/脚本/游戏逻辑/shopSystem.ts');
const schemaJson = JSON.parse(source('src/秦璐重置版/schema.json'));
const indexSource = source('src/秦璐重置版/脚本/游戏逻辑/index.ts');
const thoughtSource = source('src/秦璐重置版/脚本/游戏逻辑/thoughtEngine.ts');
const initvarSource = source('src/秦璐重置版/世界书/initvar.yaml');

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
  restoreSuwenStasisSnapshot,
} = loadTypeScriptModule(stasisPath);
const { SHOP_ITEMS, buyPrivilege, useConsumable } = loadTypeScriptModule(
  path.join(root, 'src/秦璐重置版/脚本/游戏逻辑/shopSystem.ts'),
);

function makeData() {
  return Schema.parse({});
}

test('修复仍建立在 Git 0.40 完整重置版架构上，没有换成缩水状态栏', () => {
  assert.match(appSource, /import CharPanel from '.\/components\/CharPanel\.vue'/);
  assert.match(appSource, /import ShopPanel from '.\/components\/ShopPanel\.vue'/);
  assert.match(appSource, /<CharPanel/);
  assert.match(appSource, /<ShopPanel/);
  assert.match(charPanelSource, /路线共鸣/);
  assert.match(charPanelSource, /苏文视角/);
  assert.match(shopPanelSource, /影像档案/);
  assert.match(shopPanelSource, /'装备', '体改', '消耗品', '特权', '特别'/);
  assert.match(shopSource, /名称: '刻印香炉'/);
  assert.match(shopSource, /名称: '云台微型相机'/);
  assert.match(shopSource, /ROUTE_FULLSTAR/);
});

test('新开局的苏文状态与作息游标从同一位置开始，Schema 三份来源同步', () => {
  const data = makeData();
  assert.equal(data.苏文状态.当前状态, '在家');
  assert.equal(data.苏文状态.当前位置, '客厅');
  assert.equal(data.系统._苏文作息游标, 11);
  assert.match(initvarSource, /_苏文作息游标:\s*11/);
  assert.equal(schemaJson.properties.系统.properties._苏文作息游标.default, 11);
  assert.deepEqual(
    Object.keys(schemaJson.properties.苏文状态.properties.位置数值冻结.properties),
    ['是否生效', '冻结状态', '冻结位置', '冻结对秦璐疑心值', '冻结对苏梦疑心值', '冻结作息游标', '启用楼层'],
  );
});

test('普通对白提到明天不会跳时段，只有明确推进才跳', () => {
  assert.equal(detectJumpMoment('你明天还要工作吗？'), null);
  assert.equal(detectJumpMoment('明天早上你还要工作吗？'), null);
  assert.equal(detectJumpMoment('明天记得早点回来。'), null);
  assert.equal(detectJumpMoment('等到明天早上再继续'), '次日早晨');
  assert.equal(detectJumpMoment('第二天晚上，继续行动。'), '次日晚间');
});

test('旧档状态与游标失配时先按真实状态校准，不会从单位瞬移到主卧', () => {
  const data = makeData();
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.系统._苏文作息游标 = 0;
  data.系统._上次处理楼层 = -1;

  const preview = previewSuwenRoutine(data, 10, '继续观察秦璐', false);
  assert.deepEqual(
    { 状态: preview.状态, 位置: preview.位置 },
    { 状态: '外出', 位置: '外面' },
  );
  assert.doesNotMatch(preview.转场说明, /主卧/);

  advanceSuwenRoutine(data, 10, '继续观察秦璐');
  assert.equal(data.苏文状态.当前状态, preview.状态);
  assert.equal(data.苏文状态.当前位置, preview.位置);
});

test('正常下班先到餐厅，提示词预演与变量写回使用同一落点', () => {
  const data = makeData();
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.系统._苏文作息游标 = 8;
  data.系统._上次处理楼层 = -1;

  const preview = previewSuwenRoutine(data, 20, '继续', false);
  assert.equal(preview.状态, '在家');
  assert.equal(preview.位置, '餐厅');
  assert.match(preview.转场说明, /下班|返家|进门/);

  advanceSuwenRoutine(data, 20, '继续');
  assert.equal(data.苏文状态.当前状态, preview.状态);
  assert.equal(data.苏文状态.当前位置, preview.位置);
});

test('第二天晚上按最长语义落到晚间活动段', () => {
  const data = makeData();
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.系统._苏文作息游标 = 8;
  data.系统._上次处理楼层 = -1;

  const preview = previewSuwenRoutine(data, 21, '第二天晚上，回到客厅看看', false);
  assert.equal(preview.跳转类型, '次日晚间');
  assert.equal(preview.状态, '在家');
  assert.equal(preview.位置, '客厅');
});

test('0.40 完整网店保留原商品并新增静滞怀表，不另起缩水商店', () => {
  const names = new Set(SHOP_ITEMS.map(item => item.名称));
  assert.ok(SHOP_ITEMS.length >= 100, `完整网店商品数量异常：${SHOP_ITEMS.length}`);
  for (const name of ['刻印香炉', '云台微型相机', '植入扩容', '周末全家出游', SUWEN_STASIS_ITEM]) {
    assert.equal(names.has(name), true, `缺少 0.40 商品：${name}`);
  }
  const stasisItem = SHOP_ITEMS.find(item => item.名称 === SUWEN_STASIS_ITEM);
  assert.equal(stasisItem?.分类, '特权');
  assert.equal(stasisItem?.价格, 1000);
});

test('静滞怀表售价1000，购买后再启用并记录完整冻结锚点', () => {
  const data = makeData();
  data.系统.货币 = 1500;
  data.苏文状态.当前状态 = '外出';
  data.苏文状态.当前位置 = '外面';
  data.苏文状态.对秦璐疑心值 = 37;
  data.苏文状态.对苏梦疑心值 = 52;
  data.系统._苏文作息游标 = 5;

  assert.equal(SUWEN_STASIS_PRICE, 1000);
  assert.equal(purchaseSuwenStasisItem(data), null);
  assert.equal(data.系统.货币, 500);
  assert.equal(data.系统.道具状态[SUWEN_STASIS_ITEM], '已购买');
  assert.equal(activateSuwenStasisItem(data, 30), null);
  assert.equal(isSuwenStasisActive(data), true);
  assert.equal(data.系统.道具状态[SUWEN_STASIS_ITEM], '使用中');
  assert.deepEqual(data.苏文状态.位置数值冻结, {
    是否生效: true,
    冻结状态: '外出',
    冻结位置: '外面',
    冻结对秦璐疑心值: 37,
    冻结对苏梦疑心值: 52,
    冻结作息游标: 5,
    启用楼层: 30,
  });
  assert.match(data.系统._待发送道具事件, /永久/);
});

test('完整网店公共购买入口也能购买怀表，永久生效后降疑道具不会扣钱', () => {
  const data = makeData();
  data.系统.货币 = 1500;
  assert.equal(buyPrivilege(data, SUWEN_STASIS_ITEM), null);
  assert.equal(data.系统.货币, 500);
  assert.equal(activateSuwenStasisItem(data, 35), null);
  const before = data.系统.货币;
  assert.match(useConsumable(data, '秦璐状态', '精心家宴', 36), /永久冻结/);
  assert.equal(data.系统.货币, before);
});

test('旧候选档缺少游标锚点时自动补齐，并删除旧限时字段', () => {
  const data = Schema.parse({
    苏文状态: {
      当前状态: '外出',
      当前位置: '外面',
      对秦璐疑心值: 22,
      对苏梦疑心值: 33,
      位置数值冻结: {
        是否生效: true,
        冻结状态: '外出',
        冻结位置: '外面',
        冻结对秦璐疑心值: 22,
        冻结对苏梦疑心值: 33,
        剩余结算回合: 2,
      },
    },
    系统: { _苏文作息游标: 6, 道具状态: { 静滞怀表: '使用中' } },
  });
  assert.equal(data.苏文状态.位置数值冻结.冻结作息游标, -1);
  assert.equal(restoreSuwenStasisSnapshot(data), true);
  assert.equal(data.苏文状态.位置数值冻结.冻结作息游标, 6);
  assert.equal('剩余结算回合' in data.苏文状态.位置数值冻结, false);
});

test('静滞怀表跨任意楼层与同楼重生成都永久生效，不存在倒计时', () => {
  const data = makeData();
  data.系统.货币 = 1000;
  data.苏文状态.当前状态 = '在家';
  data.苏文状态.当前位置 = '客厅';
  data.苏文状态.对秦璐疑心值 = 12;
  data.苏文状态.对苏梦疑心值 = 18;
  data.系统._苏文作息游标 = 11;
  assert.equal(purchaseSuwenStasisItem(data), null);
  assert.equal(activateSuwenStasisItem(data, 40), null);

  for (const floor of [41, 41, 42, 100, 999]) {
    data.苏文状态.当前状态 = '睡眠';
    data.苏文状态.当前位置 = '主卧';
    data.苏文状态.对秦璐疑心值 = 100;
    data.苏文状态.对苏梦疑心值 = 100;
    data.系统._苏文作息游标 = 99;
    advanceSuwenRoutine(data, floor, '继续');

    assert.equal(data.苏文状态.当前状态, '在家');
    assert.equal(data.苏文状态.当前位置, '客厅');
    assert.equal(data.苏文状态.对秦璐疑心值, 12);
    assert.equal(data.苏文状态.对苏梦疑心值, 18);
    assert.equal(data.系统._苏文作息游标, 11);
    assert.equal(data.系统.道具状态[SUWEN_STASIS_ITEM], '使用中');
  }

  data.苏文状态.对秦璐疑心值 = 88;
  restoreSuwenStasisSnapshot(data);
  assert.equal(data.苏文状态.对秦璐疑心值, 12);
  assert.equal(purchaseSuwenStasisItem(data), '静滞怀表已经永久生效，不能重复购买');
  assert.equal('剩余结算回合' in data.苏文状态.位置数值冻结, false);
});

test('完整商店、状态栏、提示词、疑心结算与培育加速均接入永久静滞', () => {
  assert.match(shopSource, /名称:\s*SUWEN_STASIS_ITEM/);
  assert.match(shopPanelSource, /立即使用（永久）/);
  assert.match(shopPanelSource, /activateSuwenStasisItem/);
  assert.match(appSource, /永久静滞/);
  assert.match(charPanelSource, /永久静滞/);
  assert.match(indexSource, /previewSuwenRoutine/);
  assert.match(indexSource, /位置数值冻结:\s*\{\s*\.\.\.data\.苏文状态\.位置数值冻结/);
  assert.match(indexSource, /isSuwenStasisActive\(data\)/);
  assert.match(indexSource, /restoreSuwenStasisSnapshot/);
  assert.match(thoughtSource, /isSuwenLocationAccelerationRoom\(data\.苏文状态\.当前位置\)/);
});
