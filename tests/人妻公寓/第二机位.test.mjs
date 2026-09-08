/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import lodash from 'lodash';

globalThis._ = lodash;
let chatVars = {};
globalThis.getVariables = () => chatVars;
globalThis.insertOrAssignVariables = patch => {
  chatVars = lodash.merge({}, chatVars, patch);
};

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

// 商店／对饮／亲密账本不调用数据库，只隔离 webpack `?raw` 模板依赖。
const 数据库桥路径 = require.resolve('../../src/人妻公寓/脚本/游戏逻辑/数据库桥.ts');
require.cache[数据库桥路径] = {
  id: 数据库桥路径,
  filename: 数据库桥路径,
  loaded: true,
  exports: { 同步社交轨迹: () => undefined },
};

const YAML = require('yaml');
const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 道具表, 角色剧情占位表 } = require('../../src/人妻公寓/stageConfig.ts');
const { 购买, 取货架, 送礼 } = require('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts');
const { 对饮 } = require('../../src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');
const { 读取队首场景剧情 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
const { 解析事件角色绑定 } = require('../../src/人妻公寓/脚本/游戏逻辑/snapshotSystem.ts');
const { 丈夫在楼, 读取世界时间 } = require('../../src/人妻公寓/脚本/游戏逻辑/楼层时钟.ts');
const { 亲密收尾选项, 结算成功现场楼, 结算性爱突然离场 } = require('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts');
const {
  沈静仪母带ID,
  第二机位完整录制基准,
  第二机位REC显示,
  第二机位任务已上架,
  第二机位事件要求真实开录,
  第二机位事件禁止正式亲密,
  第二机位地点动作,
  第二机位房间背景文件,
  第二机位正文越拍原因,
  第二机位录制锁定中,
  第二机位离场锁提示,
  第二机位现场不可离开,
  第二机位真实录制已绑定,
  第二机位预约窗口有效,
  准备第二机位对饮,
  准备第二机位监控,
  排入第二机位后续剧情,
  提交第二机位剧情事件,
  提交第二机位监控,
  执行第二机位地点动作,
  读取第二机位档案提示,
  解析第二机位剧情事件,
  结算第二机位亲密收尾,
} = require('../../src/人妻公寓/脚本/游戏逻辑/第二机位系统.ts');

const initvar = YAML.parse(
  readFileSync(new URL('../../src/人妻公寓/世界书/变量/initvar.yaml', import.meta.url), 'utf8'),
);
const 路线源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/第二机位系统.ts', import.meta.url), 'utf8');
const 资源源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/玩家资源系统.ts', import.meta.url), 'utf8');
const index源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');
const 引擎源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', import.meta.url), 'utf8');
const 结算源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/结算系统.ts', import.meta.url), 'utf8');
const 商店源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/商店系统.ts', import.meta.url), 'utf8');
const 特殊场景源码 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/特殊场景系统.ts', import.meta.url), 'utf8');
const 客户端源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');
const 房间动作源码 = readFileSync(
  new URL('../../src/人妻公寓/界面/客户端/composables/useRoomActions.ts', import.meta.url),
  'utf8',
);
const 档案源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/components/档案卡.vue', import.meta.url), 'utf8');

function 递归源码(目录) {
  return readdirSync(目录)
    .flatMap(名称 => {
      const 路径 = join(目录, 名称);
      return statSync(路径).isDirectory()
        ? [递归源码(路径)]
        : /\.(?:ts|vue)$/.test(名称)
          ? [readFileSync(路径, 'utf8')]
          : [];
    })
    .join('\n');
}

const 手机源码 = [
  readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机系统.ts', import.meta.url), 'utf8'),
  递归源码(fileURLToPath(new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url))),
].join('\n');

function 建数据() {
  const data = Schema.parse({
    户: { 102: 创建户节点(0), 202: 创建户节点(0) },
    系统: { _绝对时段: 0 },
    现金: 12000,
  });
  data.户['102'].妻.当前阶段 = 5;
  data.户['102'].妻.阶段性癖 = 户静态表['102'].招牌性癖;
  data.户['202'].妻.当前阶段 = 5;
  data.户['202'].妻.阶段性癖 = 户静态表['202'].招牌性癖;
  data.系统._摄像头布设['102'] = true;
  data.玩家资源.精力.当前值 = 8;
  data.玩家资源.体力.当前值 = 8;
  return data;
}

function 克隆存档(data) {
  return Schema.parse(lodash.cloneDeep(data));
}

function 查动作时段(data, id, 起点, 终点) {
  for (let abs = 起点; abs < 终点; abs += 1) {
    data.系统._绝对时段 = abs;
    if (第二机位地点动作(data, '102').some(item => item.id === id)) return abs;
  }
  assert.fail(`绝对时段 ${起点}—${终点 - 1} 内找不到动作 ${id}`);
}

function 查丈夫在家时段(data, 起点, 终点) {
  for (let abs = 起点; abs < 终点; abs += 1) {
    data.系统._绝对时段 = abs;
    if (丈夫在楼(data.户['102'], '102', abs) === '在家') return abs;
  }
  assert.fail(`绝对时段 ${起点}—${终点 - 1} 内找不到顾国栋在家的时段`);
}

function 货架ID(data) {
  return 取货架(data).flatMap(页 => 页.商品.map(item => item.id));
}

function 提交剧情(data, 准备结果, 地点 = '102', 楼层 = 1) {
  if (Object.hasOwn(准备结果, '成功')) assert.equal(准备结果.成功, true);
  assert.ok(准备结果.事件, '有正文的第二机位动作必须生成稳定剧情票');
  const 结果 = 提交第二机位剧情事件(data, 准备结果.事件, 地点, 楼层);
  assert.equal(结果?.成功, true, 结果?.提示);
  return 结果;
}

function 推进第二机位连场(data, 首拍, 总拍, 地点 = '102', 起始楼层 = 1) {
  const 事件们 = [];
  const 结果们 = [];
  let 当前 = 首拍;
  for (let i = 1; i <= 总拍; i += 1) {
    assert.ok(当前?.事件, `第${i}拍缺少剧情事件`);
    事件们.push(当前.事件);
    const 结果 = 提交剧情(data, 当前, 地点, 起始楼层 + i - 1);
    结果们.push(结果);
    if (i < 总拍) {
      assert.ok(结果.后续剧情?.事件, `第${i}拍没有排出第${i + 1}拍`);
      当前 = { 成功: true, 事件: 结果.后续剧情.事件 };
    } else {
      assert.equal(结果.后续剧情, undefined, '最终拍不得继续排出同场下一拍');
    }
  }
  return { 事件们, 结果们 };
}

test('Schema、schema.json、initvar 与刷新序列化补齐第二机位及丈夫专属窗口', () => {
  const 空 = Schema.parse({ 户: { 102: 创建户节点(0) } });
  assert.deepEqual(空.系统._第二机位, {
    阶段: '未开始',
    最早继续日: -1,
    录制场次标识: '',
    完成楼层: -1,
  });
  assert.deepEqual(initvar.系统._第二机位, 空.系统._第二机位);
  assert.equal(空.户['102'].夫._剧情外出起, -1);
  assert.equal(空.户['102'].夫._剧情外出至, -1);

  const schemaJson = JSON.parse(readFileSync(new URL('../../src/人妻公寓/schema.json', import.meta.url), 'utf8'));
  assert.ok(schemaJson.properties.系统.properties._第二机位);
  const 夫属性 = schemaJson.properties.户.additionalProperties.properties.夫.properties;
  assert.equal(夫属性._剧情外出起.default, -1);
  assert.equal(夫属性._剧情外出至.default, -1);

  const data = 建数据();
  data.系统._第二机位 = { 阶段: '录制中', 最早继续日: 3, 录制场次标识: 'refresh-cam2', 完成楼层: -1 };
  data.户['102'].夫._剧情外出起 = 30;
  data.户['102'].夫._剧情外出至 = 33;
  data.系统._性爱场景.状态 = '进行中';
  data.系统._性爱场景.场次标识 = 'refresh-cam2';
  data.系统._性爱场景.主焦点门牌 = '102';
  data.系统._性爱场景.参与者['102'] = {
    满意度: 1,
    满意目标: 8,
    偏好命中: [],
    等级加成已用: false,
    有效楼数: 1,
    已退出: false,
  };
  const 刷新后 = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.equal(刷新后.系统._第二机位.录制场次标识, 'refresh-cam2');
  assert.equal(刷新后.户['102'].夫._剧情外出至, 33);
  assert.equal(第二机位真实录制已绑定(刷新后), true);
});

test('任务只在L5、视奸欲完成、CAM-102有效时上架，且取代旧102操作占位', () => {
  const data = 建数据();
  assert.equal(Object.hasOwn(角色剧情占位表, '角色路线:102:操作性剧情'), false);
  assert.equal(Object.hasOwn(角色剧情占位表, '角色路线:102:结局剧情'), false, '共享录像带接管102结局入口');
  assert.equal(第二机位任务已上架(data), true);
  assert.ok(货架ID(data).includes('第二机位'));

  data.系统._摄像头布设['102'] = false;
  assert.equal(第二机位任务已上架(data), false);
  data.系统._摄像头布设['102'] = true;
  data.户['102'].妻.阶段性癖 = '';
  assert.equal(第二机位任务已上架(data), false);
});

test('完整流程按准备票与有效正文分离提交，重复点击幂等且不提前写入顾国栋结局', async () => {
  chatVars = {};
  const data = 建数据();
  const 初始现金 = data.现金;
  const 首买 = 购买(data, '第二机位');
  assert.equal(首买.成功, true);
  assert.equal(data.现金, 初始现金 - 道具表.第二机位.价格);
  assert.equal(data.系统._第二机位.阶段, '待门缝');

  // 第一日：点击只冻结票；失败、取消或刷新前都不能提前推进门缝状态。
  const 门缝时段 = 查动作时段(data, '门缝那一眼', 0, 42);
  const 门缝日 = Math.floor(门缝时段 / 6);
  const 门缝准备 = 执行第二机位地点动作(data, '门缝那一眼', '102');
  assert.equal(门缝准备.成功, true);
  assert.equal(data.系统._第二机位.阶段, '待门缝');
  assert.match(门缝准备.事件, /第二机位提交:D:1/);
  assert.match(门缝准备.事件, /4/);
  assert.match(门缝准备.事件, /寻常话|日常物件/);
  assert.doesNotMatch(门缝准备.事件, /钥匙声|顾国栋原本外出|看见短暂|事件关联夫|事件在场夫/);
  assert.equal(第二机位事件禁止正式亲密(门缝准备.事件), true);

  const 门缝连场 = 推进第二机位连场(data, 门缝准备, 4, '102', 11);
  assert.equal(门缝连场.结果们[0].变动, false);
  assert.equal(门缝连场.结果们[1].变动, false);
  assert.equal(门缝连场.结果们[2].变动, false);
  assert.match(门缝连场.事件们[1], /锁芯被钥匙碰动|这一声刚响/);
  assert.doesNotMatch(门缝连场.事件们[1], /门缝中看见/);
  assert.match(门缝连场.事件们[2], /事件在场夫:102/);
  assert.match(门缝连场.事件们[2], /门缝中看见|主动退开/);
  assert.doesNotMatch(门缝连场.事件们[2], /楼梯间等待|母带|共享结局/);
  assert.match(门缝连场.事件们[3], /没有把那扇半掩的门重新关死/);
  assert.equal(data.系统._第二机位.阶段, '待复核');
  assert.equal(门缝连场.结果们[2].CG, '第二机位_01_门缝那一眼');
  const 门缝最终事件 = 门缝连场.事件们[3];
  const 门缝重复 = 提交第二机位剧情事件(data, 门缝最终事件, '102', 14);
  assert.equal(门缝重复?.成功, true);
  assert.equal(门缝重复?.变动, false);

  const 监控票 = 准备第二机位监控(data, '102');
  assert.ok(监控票 && '第二机位节点' in 监控票);
  assert.equal(data.系统._第二机位.阶段, '待复核', '准备隔离监控只能出票，不能提前推进');
  assert.match(监控票.事件, /无声退出来|主动退出/);
  const 监控绑定 = 解析事件角色绑定(监控票.事件, data);
  assert.deepEqual(监控绑定.在场夫, [], '监控回放里的顾国栋不能被传送成302现场演员');
  assert.deepEqual(监控绑定.关联夫, ['102']);
  assert.equal(提交第二机位监控(data, 监控票.第二机位节点).成功, true);
  assert.equal(data.系统._第二机位.阶段, '待对饮');
  assert.ok(data.系统._第二机位.最早继续日 > 门缝日, '门缝与对饮必须分属不同日期');
  assert.equal(提交第二机位监控(data, 监控票.第二机位节点).成功, false, '重复监控票不能二次推进');

  // 第二日或以后：对饮先消耗原有酒局资源，但专属路线与未来作息只在正文成功后提交。
  const 对饮起点 = data.系统._第二机位.最早继续日 * 6;
  const 对饮时段 = 查丈夫在家时段(data, 对饮起点, 对饮起点 + 42);
  const 对饮日 = Math.floor(对饮时段 / 6);
  data.背包.push('好酒');
  const 通用外出旧值 = data.系统._绝对时段;
  data.户['102'].夫._外出至 = 通用外出旧值;
  const 对饮结果 = 对饮(data, '102', 12);
  assert.match(对饮结果.事件, /第二机位提交:W:[^】]+:1/);
  assert.match(对饮结果.事件, /寻常酒|维修|邻里小事|酒的味道/);
  assert.doesNotMatch(对饮结果.事件, /远差|过夜|照应静仪|母带|存储卡|观看预约/);
  assert.equal(data.系统._第二机位.阶段, '待对饮', '三拍酒局完成前路线不能提前推进');
  assert.equal(data.户['102'].夫._剧情外出起, -1, '三拍酒局完成前不能冻结丈夫未来作息');
  assert.equal(data.户['102'].夫._剧情外出至, -1);
  assert.notEqual(data.户['102'].夫.结局轨道, '观众席', '承接事件不能提前写入未来共享结局轨道');
  assert.equal(data.背包.includes('好酒'), false, '整场酒局只在入口消耗一瓶好酒');

  const 对饮初票 = 解析第二机位剧情事件(对饮结果.事件);
  assert.equal(对饮初票?.类型, '对饮空窗');
  assert.equal(对饮初票?.拍, 1);
  const 对饮连场 = 推进第二机位连场(data, 对饮结果, 3, '102', 12);
  assert.equal(对饮连场.结果们[0].变动, false);
  assert.equal(对饮连场.结果们[1].变动, false);
  assert.ok(
    对饮连场.事件们.every(事件 => !/事件关联妻/.test(事件)),
    '整顿酒不提前注入沈静仪角色上下文',
  );
  assert.match(对饮连场.事件们[1], /偏远项目点|当天大概赶不回来|住一夜/);
  assert.doesNotMatch(对饮连场.事件们[1], /次日早晨前不回102|请玩家照看/);
  assert.match(对饮连场.事件们[2], /临时事|照常处理/);
  assert.doesNotMatch(对饮连场.事件们[2], /沈静仪|我给你们留时间|门缝|录像/);
  assert.equal(data.系统._第二机位.阶段, '待告知');
  const 预约起 = data.户['102'].夫._剧情外出起;
  const 预约止 = data.户['102'].夫._剧情外出至;
  assert.ok(预约起 > data.系统._绝对时段);
  assert.equal(预约止 - 预约起, 3);
  assert.equal(data.户['102'].夫._外出至, 通用外出旧值, '专属窗口不能覆盖丈夫原有运作窗口');
  assert.equal(第二机位预约窗口有效(data), false);
  data.系统._绝对时段 = 预约起;
  assert.equal(第二机位预约窗口有效(data), true);
  assert.equal(丈夫在楼(data.户['102'], '102', 预约起), '外出');
  data.系统._绝对时段 = 预约止;
  assert.equal(第二机位预约窗口有效(data), false, '丈夫专属窗口必须保持右开区间');
  data.系统._绝对时段 = 对饮初票.请求时段;
  const 对饮最终事件 = 对饮连场.事件们[2];
  const 对饮重复 = 提交第二机位剧情事件(data, 对饮最终事件, '102', 14);
  assert.equal(对饮重复?.成功, true);
  assert.equal(对饮重复?.变动, false);
  assert.equal(data.户['102'].夫._剧情外出起, 预约起);
  await 对饮结果.提交后?.();

  // 第三日：告知同样先出票，正文完成后才上架套件。
  const 告知起点 = Math.max(data.系统._第二机位.最早继续日 * 6, data.系统._绝对时段 + 1);
  const 告知时段 = 查动作时段(data, '告知空窗', 告知起点, 预约起);
  assert.ok(Math.floor(告知时段 / 6) > 对饮日);
  const 告知准备 = 执行第二机位地点动作(data, '告知空窗', '102');
  assert.equal(告知准备.成功, true);
  assert.equal(data.系统._第二机位.阶段, '待告知');
  assert.match(告知准备.事件, /远差|一个具体问题/);
  assert.doesNotMatch(告知准备.事件, /设备必须离线|原始记录只能由她亲手取出|给丈夫看|观看规则|谁来送带/);
  const 告知连场 = 推进第二机位连场(data, 告知准备, 3, '102', 21);
  assert.equal(告知连场.结果们[0].变动, false);
  assert.equal(告知连场.结果们[1].变动, false);
  assert.match(告知连场.事件们[1], /复刻那道视线|第二角度/);
  assert.doesNotMatch(告知连场.事件们[1], /已经买到的设备|最终用途/);
  assert.match(告知连场.事件们[2], /设备必须离线|开始与停止由她亲自掌握|原始记录只能由她亲手取出/);
  assert.doesNotMatch(告知连场.事件们[2], /给谁看|谁送带|共享结局/);
  assert.equal(data.系统._第二机位.阶段, '待购套件');
  const 告知最终事件 = 告知连场.事件们[2];
  const 告知重复 = 提交第二机位剧情事件(data, 告知最终事件, '102', 23);
  assert.equal(告知重复?.成功, true);
  assert.equal(告知重复?.变动, false);

  const 套件购买 = 购买(data, '第二机位套件');
  assert.equal(套件购买.成功, true);
  assert.equal(data.系统._第二机位.阶段, '待赴约');
  assert.equal(data.背包.includes('第二机位套件'), true);

  // 第四日：安装是即时硬操作；开录正文则必须建立一场可继续游玩的真实102亲密账。
  const 赴约时段 = 查动作时段(data, '安装第二机位', 预约起, 预约止);
  assert.equal(Math.floor(赴约时段 / 6), Math.floor(预约起 / 6));
  const 安装 = 执行第二机位地点动作(data, '安装第二机位', '102');
  assert.equal(安装.成功, true);
  assert.equal(data.背包.includes('第二机位套件'), false);
  assert.equal(data.系统._第二机位.阶段, '待开录');
  assert.equal(第二机位房间背景文件(data, '102'), '第二机位_102_已安装');
  assert.equal(执行第二机位地点动作(data, '安装第二机位', '102').成功, false, '重复安装不能再次消费套件');

  data.玩家资源.体力.当前值 = 第二机位完整录制基准 - 1;
  const 体力不足 = 执行第二机位地点动作(data, '开始录制', '102');
  assert.equal(体力不足.成功, false);
  assert.match(体力不足.提示, /至少保留5点体力/);
  assert.equal(data.系统._第二机位.阶段, '待开录');
  data.玩家资源.体力.当前值 = 8;

  const 开录准备 = 执行第二机位地点动作(data, '开始录制', '102');
  assert.equal(开录准备.成功, true);
  assert.equal(data.系统._第二机位.阶段, '待开录');
  assert.equal(第二机位事件要求真实开录(开录准备.事件), false, '试机第一拍不能提前按下REC或建立亲密账');
  assert.equal(第二机位事件禁止正式亲密(开录准备.事件), true);
  assert.match(开录准备.事件, /REC仍然没有按下|等待玩家回应/);

  const 试机候选 = 克隆存档(data);
  const 试机旧态 = 克隆存档(试机候选);
  const 试机结算 = 结算成功现场楼(试机候选, 试机旧态, {
    楼层: 49,
    行动: '现在就按下REC并直接开始完整性交',
    正文: '旧模型错误地把试机写成了已经按下REC并发生完整性交。',
    本楼事件: 开录准备.事件,
    妻在场: ['102'],
    实际尺度: { 102: 3 },
    资源计费: true,
  });
  assert.equal(试机结算.性爱开始, false, '即使旧模型越级，试机第一拍也不能创建普通亲密账');

  const 开录第一提交 = 提交剧情(data, 开录准备, '102', 49);
  assert.equal(data.系统._第二机位.阶段, '待开录');
  assert.ok(开录第一提交.后续剧情?.事件);
  const 开录最终准备 = { 成功: true, 事件: 开录第一提交.后续剧情.事件 };
  assert.equal(第二机位事件要求真实开录(开录最终准备.事件), true);
  assert.equal(第二机位事件禁止正式亲密(开录最终准备.事件), false);

  const 持久基线 = 克隆存档(data);
  const 失败候选 = 克隆存档(data);
  assert.equal(提交剧情(失败候选, 开录最终准备, '102', 50).成功, true);
  assert.equal(失败候选.系统._第二机位.阶段, '录制中');
  assert.equal(第二机位真实录制已绑定(失败候选), false);
  assert.equal(持久基线.系统._第二机位.阶段, '待开录', '最终开录正文失败时丢弃候选态即可恢复，不得污染持久存档');

  const 开录旧态 = 克隆存档(data);
  提交剧情(data, 开录最终准备, '102', 50);
  const 开录结算 = 结算成功现场楼(data, 开录旧态, {
    楼层: 50,
    行动: '准备好了。',
    正文: '沈静仪听完回应后亲手按下REC，红点亮起，她回到玩家身边，让正式亲密的第一段真实接触开始。',
    本楼事件: 开录最终准备.事件,
    妻在场: ['102'],
    实际尺度: { 102: 3 },
    资源计费: true,
  });
  assert.equal(开录结算.性爱开始, true);
  assert.equal(开录结算.性爱结束, false, '开录楼不能被普通脚本正戏规则压成一楼收尾');
  assert.equal(data.系统._第二机位.阶段, '录制中');
  assert.equal(第二机位真实录制已绑定(data), true);
  assert.equal(第二机位REC显示(data), true);
  assert.equal(第二机位现场不可离开(data), true, 'REC亮起后到封存前必须锁住102离场');
  assert.match(第二机位离场锁提示(data), /CAM-2正在记录.*完成这场亲密/);
  const 已绑定场次 = data.系统._第二机位.录制场次标识;
  assert.equal(已绑定场次, data.系统._性爱场景.场次标识);
  assert.ok(已绑定场次);

  // 一楼开录后立刻收尾只能算太短，母带不得形成；持久主线继续走完整普通亲密账。
  const 过早收尾 = 克隆存档(data);
  const 过早位置 = 亲密收尾选项(过早收尾)[0];
  const 过早旧态 = 克隆存档(过早收尾);
  const 过早结果 = 结算成功现场楼(过早收尾, 过早旧态, {
    楼层: 51,
    行动: `【亲密收尾:${过早位置}】`,
    正文: '沈静仪仍然参与，但玩家在录像刚开始后便立刻收尾。',
    本楼事件: '',
    妻在场: ['102'],
    实际尺度: { 102: 3 },
    资源计费: true,
  });
  assert.equal(过早结果.性爱结束, true);
  assert.equal(过早收尾.系统._第二机位.阶段, '待开录');
  assert.equal(过早收尾.背包.includes(沈静仪母带ID), false);

  // 开录本身算第1个有效回合；再完成3个普通亲密回合，最后收尾回合构成沈静仪的5回合完整账。
  for (let 楼层 = 51; 楼层 <= 53; 楼层 += 1) {
    const 继续旧态 = 克隆存档(data);
    const 继续结果 = 结算成功现场楼(data, 继续旧态, {
      楼层,
      行动: '继续与沈静仪完成这一场由她掌握镜头的亲密互动',
      正文: '沈静仪仍在镜头内真实参与，她维持自己的节奏，也让这次亲密继续完整推进。',
      本楼事件: '',
      妻在场: ['102'],
      实际尺度: { 102: 3 },
      资源计费: true,
    });
    assert.equal(继续结果.性爱结束, false);
  }

  const 收尾位置 = 亲密收尾选项(data)[0];
  assert.ok(收尾位置);
  const 收尾旧态 = 克隆存档(data);
  const 收尾结算 = 结算成功现场楼(data, 收尾旧态, {
    楼层: 54,
    行动: `【亲密收尾:${收尾位置}】`,
    正文: '沈静仪仍然完整参与，双方按玩家选择正常结束本次亲密场景。',
    本楼事件: '',
    妻在场: ['102'],
    实际尺度: { 102: 3 },
    资源计费: true,
  });
  assert.equal(收尾结算.性爱结束, true);
  assert.equal(data.系统._性爱场景.状态, '空闲');
  assert.ok((data.系统._上次性爱结果.参与者['102']?.有效楼数 ?? 0) >= 第二机位完整录制基准);
  assert.ok(
    (data.系统._上次性爱结果.参与者['102']?.满意度 ?? 0) >=
      (data.系统._上次性爱结果.参与者['102']?.满意目标 ?? 第二机位完整录制基准),
  );
  assert.equal(data.系统._第二机位.阶段, '待封存');
  assert.equal(第二机位REC显示(data), false);
  assert.equal(第二机位现场不可离开(data), true, '正常收尾后仍须留在102完成实体封存');

  const 封存准备 = 执行第二机位地点动作(data, '封存母带', '102');
  assert.equal(封存准备.成功, true);
  assert.equal(data.系统._第二机位.阶段, '待封存');
  assert.match(封存准备.事件, /记录卡仍在设备内|尚未决定保留/);
  assert.equal(data.背包.includes(沈静仪母带ID), false, '停机回看第一拍不能生成剧情物件');
  const 封存第一提交 = 提交剧情(data, 封存准备, '102', 55);
  assert.equal(data.系统._第二机位.阶段, '待封存');
  assert.equal(第二机位现场不可离开(data), true, '回看以后仍须留在102回应她，再完成实体封存');
  assert.ok(封存第一提交.后续剧情?.事件);
  assert.match(封存第一提交.后续剧情.事件, /取出原始记录卡|压紧封条/);
  const 封存最终事件 = 封存第一提交.后续剧情.事件;
  提交剧情(data, { 成功: true, 事件: 封存最终事件 }, '102', 56);
  assert.equal(data.系统._第二机位.阶段, '待归档');
  assert.equal(第二机位现场不可离开(data), false, '记录卡封存完成后才解除102离场锁');
  assert.equal(data.背包.filter(id => id === 沈静仪母带ID).length, 1);
  const 封存重复 = 提交第二机位剧情事件(data, 封存最终事件, '102', 56);
  assert.equal(封存重复?.成功, true);
  assert.equal(data.背包.filter(id => id === 沈静仪母带ID).length, 1);

  assert.equal(
    第二机位地点动作(data, '102').some(x => x.id === '归档母带'),
    false,
  );
  const 归档 = 执行第二机位地点动作(data, '归档母带', '302', 88);
  assert.equal(归档.成功, true);
  assert.equal(data.系统._第二机位.阶段, '已完成');
  assert.equal(data.系统._第二机位.完成楼层, 88);
  assert.equal(data.背包.includes(沈静仪母带ID), false);
  assert.equal(data.系统._已完成特殊场景.includes('第二机位'), true);
  assert.equal(data.系统._特殊场景前置.includes('录像带结局:沈母带封存'), true);
  assert.equal(data.系统._已完成特殊场景.includes('录像带'), false, '新母带不能冒充旧录像带完成态');
  assert.equal(data.系统._特殊场景前置.includes('录像带:102'), false);
  assert.equal(data.系统._特殊场景前置.includes('录像带:202'), false);
  assert.notEqual(data.户['102'].夫.结局轨道, '观众席');
  assert.equal(第二机位房间背景文件(data, '302'), '第二机位_302_资料柜母带');
  assert.equal(执行第二机位地点动作(data, '归档母带', '302', 89).成功, false, '重复归档不能再次完成或复制母带');
});

test('医院硬锁冻结对饮、购买、监控与赴约，但已经拿到手的母带仍可回302归档', () => {
  chatVars = {};
  const data = 建数据();
  data.系统._第二机位.阶段 = '待对饮';
  data.系统._第二机位.最早继续日 = 0;
  查丈夫在家时段(data, 0, 42);
  data.背包.push('好酒');
  const 原信任 = data.户['102'].夫.信任值;
  data.户['102'].妻._生产.状态 = '住院中';

  const 住院对饮 = 对饮(data, '102', 1);
  assert.equal(住院对饮.事件, undefined);
  assert.match(住院对饮.提示, /医院|待产|恢复/);
  assert.equal(data.背包.includes('好酒'), true, '住院硬锁必须在扣酒以前失败关闭');
  assert.equal(data.户['102'].夫.信任值, 原信任);
  assert.equal(data.系统._第二机位.阶段, '待对饮');

  data.系统._第二机位.阶段 = '待购套件';
  const 原现金 = data.现金;
  const 住院购买 = 购买(data, '第二机位套件');
  assert.equal(住院购买.成功, false);
  assert.equal(data.现金, 原现金);
  assert.equal(data.背包.includes('第二机位套件'), false);

  data.系统._第二机位.阶段 = '待开录';
  data.户['102'].夫._剧情外出起 = data.系统._绝对时段;
  data.户['102'].夫._剧情外出至 = data.系统._绝对时段 + 3;
  assert.equal(第二机位录制锁定中(data), false, '住院时不能用第二机位无限锁死世界时间');
  assert.deepEqual(第二机位地点动作(data, '102'), []);

  data.系统._第二机位.阶段 = '待复核';
  const 监控准备冻结 = 准备第二机位监控(data, '102');
  assert.equal(监控准备冻结?.成功, false);
  assert.match(监控准备冻结?.提示 ?? '', /医院|待产|恢复/);
  assert.equal('事件' in (监控准备冻结 ?? {}), false, '住院时应在生成正文以前冻结监控复核');
  const 监控冻结 = 提交第二机位监控(data, '复核门缝');
  assert.equal(监控冻结.成功, false);
  assert.equal(data.系统._第二机位.阶段, '待复核');

  data.系统._第二机位.阶段 = '待归档';
  data.背包.push(沈静仪母带ID);
  assert.equal(
    第二机位地点动作(data, '302').some(item => item.id === '归档母带'),
    true,
  );

  data.户['102'].妻._生产.状态 = '无';
  data.系统._第二机位.阶段 = '待开录';
  let 恢复时段 = -1;
  for (let abs = 0; abs < 42; abs += 1) {
    data.系统._绝对时段 = abs;
    data.户['102'].夫._剧情外出起 = abs;
    data.户['102'].夫._剧情外出至 = abs + 3;
    if (第二机位地点动作(data, '102').some(item => item.id === '开始录制')) {
      恢复时段 = abs;
      break;
    }
  }
  assert.ok(恢复时段 >= 0, '出院后应能在人物真实在场的专属窗口恢复赴约');
  assert.equal(第二机位录制锁定中(data), true, '出院后仍在有效窗口内应恢复现场锁定');
});

test('丈夫专属空窗避开既有阶段预约，保持右开区间，并在错过后只重排不倒退路线', () => {
  const data = 建数据();
  data.系统._第二机位.阶段 = '待对饮';
  data.系统._第二机位.最早继续日 = 0;
  查丈夫在家时段(data, 0, 42);

  const 初始计划 = 准备第二机位对饮(data);
  assert.equal(初始计划?.成功, true);
  const 初始票 = 解析第二机位剧情事件(初始计划.事件);
  assert.equal(初始票?.类型, '对饮空窗');
  assert.equal(data.户['102'].夫._剧情外出起, -1, '计划函数必须保持只读');

  const 冲突时间 = 读取世界时间(初始票.外出起);
  Object.assign(data.户['102'].妻._阶段线路, {
    预约星期: 冲突时间.星期,
    预约时段: 冲突时间.时段,
    预约地点: '102',
    预约绝对时段: 初始票.外出起,
    预约丈夫状态: '在家',
  });
  const 避让计划 = 准备第二机位对饮(data);
  const 避让票 = 解析第二机位剧情事件(避让计划.事件);
  assert.equal(避让票?.类型, '对饮空窗');
  assert.notEqual(避让票.外出起, 初始票.外出起, '不能覆盖同一时段既有的丈夫在家硬预约');
  assert.equal(避让票.外出至 - 避让票.外出起, 3);

  const 通用外出旧值 = data.系统._绝对时段;
  data.户['102'].夫._外出至 = 通用外出旧值;
  const 避让连场 = 推进第二机位连场(data, 避让计划, 3, '102', 3);
  assert.equal(避让连场.结果们[0].变动, false);
  assert.equal(避让连场.结果们[1].变动, false);
  assert.equal(data.系统._第二机位.阶段, '待告知');
  assert.equal(data.户['102'].夫._外出至, 通用外出旧值);
  assert.equal(data.户['102'].夫._剧情外出起, 避让票.外出起);
  assert.equal(data.户['102'].夫._剧情外出至, 避让票.外出至);

  data.系统._绝对时段 = 避让票.外出起;
  assert.equal(第二机位预约窗口有效(data), true);
  data.系统._绝对时段 = 避让票.外出至 - 1;
  assert.equal(第二机位预约窗口有效(data), true);
  data.系统._绝对时段 = 避让票.外出至;
  assert.equal(第二机位预约窗口有效(data), false);
  assert.equal(
    第二机位录制锁定中({ ...data, 系统: { ...data.系统, _第二机位: { ...data.系统._第二机位, 阶段: '待开录' } } }),
    false,
  );

  data.系统._第二机位.阶段 = '待开录';
  查丈夫在家时段(data, 避让票.外出至, 避让票.外出至 + 42);
  const 原窗口 = [data.户['102'].夫._剧情外出起, data.户['102'].夫._剧情外出至];
  const 重排准备 = 准备第二机位对饮(data);
  assert.equal(重排准备?.成功, true);
  const 重排票 = 解析第二机位剧情事件(重排准备.事件);
  assert.equal(重排票?.类型, '对饮空窗');
  assert.deepEqual(
    [data.户['102'].夫._剧情外出起, data.户['102'].夫._剧情外出至],
    原窗口,
    '重排正文成功前必须保留旧窗口，刷新或失败可安全重试',
  );
  const 重排连场 = 推进第二机位连场(data, 重排准备, 3, '102', 4);
  assert.equal(重排连场.结果们[0].变动, false);
  assert.equal(重排连场.结果们[1].变动, false);
  assert.equal(data.系统._第二机位.阶段, '待开录', '错过窗口只重排，不倒退到告知或购置阶段');
  assert.ok(data.户['102'].夫._剧情外出起 > data.系统._绝对时段);
  assert.notDeepEqual([data.户['102'].夫._剧情外出起, data.户['102'].夫._剧情外出至], 原窗口);
});

test('开发期掉队的第二机位对饮后续拍可按冻结酒局恢复，未来分支票仍拒绝', () => {
  const data = 建数据();
  data.系统._第二机位.阶段 = '待对饮';
  data.系统._第二机位.最早继续日 = 0;
  查丈夫在家时段(data, 2, 42);
  const 第一拍 = 准备第二机位对饮(data);
  const 第一拍提交 = 提交第二机位剧情事件(data, 第一拍.事件, '102', 10);
  assert.equal(第一拍提交?.成功, true);
  const 第二拍 = 第一拍提交.后续剧情.事件;

  data.系统._绝对时段 += 1;
  const 恢复 = 提交第二机位剧情事件(data, 第二拍, '102', 11);
  assert.equal(恢复?.成功, true, 恢复?.提示);

  const 回档 = 建数据();
  回档.系统._第二机位.阶段 = '待对饮';
  回档.系统._第二机位.最早继续日 = 0;
  回档.系统._绝对时段 = 解析第二机位剧情事件(第二拍).请求时段 - 1;
  const 未来 = 提交第二机位剧情事件(回档, 第二拍, '102', 9);
  assert.equal(未来?.成功, false);
  assert.match(未来?.提示 ?? '', /未来时间线/);
});

function 建已绑定录制(data, 场次标识 = 'cam2-active') {
  data.系统._第二机位.阶段 = '录制中';
  data.系统._第二机位.录制场次标识 = 场次标识;
  data.系统._性爱场景 = {
    ...lodash.cloneDeep(Schema.parse({}).系统._性爱场景),
    状态: '进行中',
    场次标识,
    开始楼层: 40,
    有效楼数: 2,
    主焦点门牌: '102',
    当前行为: '阴道插入',
    当前接触部位: '阴道',
    参与者: {
      102: {
        满意度: 2,
        满意目标: 8,
        偏好命中: [],
        等级加成已用: false,
        有效楼数: 2,
        已退出: false,
      },
    },
  };
}

test('待开录与待封存只在本时段确实可操作时锁时间，人物错位不会形成无按钮死锁', () => {
  const data = 建数据();
  data.系统._第二机位.阶段 = '待开录';

  let 可开录时段 = -1;
  for (let abs = 0; abs < 42; abs += 1) {
    data.系统._绝对时段 = abs;
    data.户['102'].夫._剧情外出起 = abs;
    data.户['102'].夫._剧情外出至 = abs + 3;
    if (第二机位地点动作(data, '102').some(item => item.id === '开始录制')) {
      可开录时段 = abs;
      break;
    }
  }
  assert.ok(可开录时段 >= 0);
  assert.equal(第二机位录制锁定中(data), true);

  Object.assign(data.户['102'].妻._阶段线路, {
    预约星期: 读取世界时间(可开录时段).星期,
    预约时段: 读取世界时间(可开录时段).时段,
    预约地点: '外出',
    预约绝对时段: 可开录时段,
    预约丈夫状态: '',
  });
  assert.equal(
    第二机位地点动作(data, '102').some(item => item.id === '开始录制'),
    false,
  );
  assert.equal(第二机位录制锁定中(data), false, '沈静仪不在102时必须允许时间继续，之后再重排');

  data.户['102'].妻._阶段线路.预约地点 = '102';
  data.户['102'].妻._阶段线路.预约丈夫状态 = '在家';
  assert.equal(
    第二机位地点动作(data, '102').some(item => item.id === '开始录制'),
    false,
  );
  assert.equal(第二机位录制锁定中(data), false, '更高优先级预约令丈夫在家时不能只凭专属窗口锁死时间');

  data.系统._第二机位.阶段 = '待封存';
  data.户['102'].妻._阶段线路.预约丈夫状态 = '';
  data.户['102'].妻._阶段线路.预约地点 = '外出';
  assert.equal(
    第二机位地点动作(data, '102').some(item => item.id === '封存母带'),
    false,
  );
  assert.equal(第二机位录制锁定中(data), false, '待封存但沈静仪不在102时同样不得无按钮锁死');

  data.户['102'].妻._阶段线路.预约地点 = '102';
  assert.equal(
    第二机位地点动作(data, '102').some(item => item.id === '封存母带'),
    true,
  );
  assert.equal(第二机位录制锁定中(data), true);
});

test('待开录体力不足和录制断点缺少真实场次时不锁死时间，并提供原地恢复入口', () => {
  const data = 建数据();
  data.系统._第二机位.阶段 = '待开录';
  data.系统._绝对时段 = 1;
  data.户['102'].夫._剧情外出起 = 1;
  data.户['102'].夫._剧情外出至 = 4;
  data.玩家资源.体力.当前值 = 第二机位完整录制基准 - 1;
  assert.equal(第二机位录制锁定中(data), false, '体力不足时必须允许先休息，不能让档案提示与时间锁互相矛盾');

  data.玩家资源.体力.当前值 = 第二机位完整录制基准;
  data.系统._第二机位.阶段 = '录制中';
  data.系统._第二机位.录制场次标识 = '';
  data.系统._性爱场景 = lodash.cloneDeep(Schema.parse({}).系统._性爱场景);
  assert.equal(第二机位真实录制已绑定(data), false);
  assert.equal(第二机位录制锁定中(data), false, '没有真实场次的开发期/损坏档不能冒充硬生命周期');
  assert.match(读取第二机位档案提示(data)?.状态 ?? '', /中断|恢复|断点/);
  assert.equal(
    第二机位地点动作(data, '102').some(item => item.id === '开始录制'),
    true,
    '预约仍有效时应直接重新进入两拍试机，不要求玩家猜自由文本才能自救',
  );
  assert.equal(执行第二机位地点动作(data, '开始录制', '102').成功, true);

  data.系统._第二机位.录制场次标识 = 'lost-scene';
  assert.equal(第二机位录制锁定中(data), false, '路线票与当前空场次不匹配时同样视为可恢复断点');

  const 已过窗 = 建数据();
  已过窗.系统._第二机位.阶段 = '录制中';
  已过窗.系统._第二机位.录制场次标识 = 'lost-old-scene';
  已过窗.户['102'].夫._剧情外出起 = 0;
  已过窗.户['102'].夫._剧情外出至 = 1;
  查丈夫在家时段(已过窗, 2, 42);
  const 重排 = 准备第二机位对饮(已过窗);
  assert.equal(重排?.成功, true, 重排?.提示);
  const 重排完成 = 推进第二机位连场(已过窗, 重排, 3, '102', 30);
  assert.equal(重排完成.结果们.at(-1)?.成功, true);
  assert.equal(已过窗.系统._第二机位.阶段, '待开录', '断点过窗后只重排日期，不倒退设备与前置');
});

test('旧档录制场次存在但路线标识为空时，收尾会先认领真实102场次再按完整度结算', () => {
  const data = 建数据();
  建已绑定录制(data, 'legacy-live');
  data.系统._第二机位.录制场次标识 = '';
  结算第二机位亲密收尾(data, {
    场次标识: 'legacy-live',
    结束方式: '主动收尾',
    参与者: {
      102: {
        满意度: 8,
        满意目标: 8,
        有效楼数: 8,
        结束方式: '主动收尾',
        时长评价: '合适',
      },
    },
  });
  assert.equal(data.系统._第二机位.阶段, '待封存');
  assert.equal(data.系统._第二机位.录制场次标识, '');
});

test('远处普通等待票不吞第二机位纯硬归档，同场或活动剧情仍保持互斥', () => {
  const data = 建数据();
  data.系统._第二机位.阶段 = '待归档';
  data.背包.push(沈静仪母带ID);
  const { 追加等待场景剧情 } = require('../../src/人妻公寓/脚本/游戏逻辑/场景剧情事务.ts');
  追加等待场景剧情(data, '【远处剧情】留在101等待', '101', '远处剧情');
  assert.equal(第二机位地点动作(data, '302').some(item => item.id === '归档母带'), true);

  const 同场 = 克隆存档(data);
  同场.系统._待发送事件 = '';
  追加等待场景剧情(同场, '【同场剧情】先在302处理', '302', '同场剧情');
  assert.deepEqual(第二机位地点动作(同场, '302'), []);

  const 活动 = 克隆存档(data);
  活动.系统._待发送事件 = '';
  活动.系统._场景剧情事务.id = 'active-other';
  活动.系统._场景剧情事务.状态 = '生成中';
  assert.deepEqual(第二机位地点动作(活动, '302'), []);
});

test('录制只绑定本次102真实亲密场次；突然离场、角色中止和脚本收尾都不会生成母带', () => {
  const 突然离场 = 建数据();
  建已绑定录制(突然离场, 'cam2-leave');
  assert.equal(第二机位真实录制已绑定(突然离场), true);
  const 离场结果 = 结算性爱突然离场(突然离场);
  assert.equal(离场结果.成功, true);
  assert.equal(突然离场.系统._第二机位.阶段, '待开录');
  assert.equal(突然离场.系统._第二机位.录制场次标识, '');
  assert.equal(突然离场.系统._性爱场景.状态, '空闲');
  assert.equal(突然离场.背包.includes(沈静仪母带ID), false);

  const 其他场次 = 建数据();
  建已绑定录制(其他场次, 'cam2-owned');
  结算第二机位亲密收尾(其他场次, {
    场次标识: 'ordinary-102',
    结束方式: '主动收尾',
    参与者: { 102: { 有效楼数: 4, 结束方式: '主动收尾' } },
  });
  assert.equal(其他场次.系统._第二机位.阶段, '录制中', '未来普通102场次不能误消费CAM-2绑定');
  assert.equal(其他场次.系统._第二机位.录制场次标识, 'cam2-owned');

  const 角色中止 = 建数据();
  建已绑定录制(角色中止, 'cam2-stop');
  结算第二机位亲密收尾(角色中止, {
    场次标识: 'cam2-stop',
    结束方式: '主动收尾',
    参与者: { 102: { 有效楼数: 3, 结束方式: '角色中止' } },
  });
  assert.equal(角色中止.系统._第二机位.阶段, '待开录');
  assert.equal(角色中止.背包.includes(沈静仪母带ID), false);

  const 脚本收尾 = 建数据();
  建已绑定录制(脚本收尾, 'cam2-script');
  结算第二机位亲密收尾(脚本收尾, {
    场次标识: 'cam2-script',
    结束方式: '脚本收尾',
    参与者: { 102: { 有效楼数: 3, 结束方式: '脚本收尾' } },
  });
  assert.equal(脚本收尾.系统._第二机位.阶段, '待开录', '只有玩家主动收尾或真实体力耗尽才可形成待封存');

  const 体力耗尽 = 建数据();
  建已绑定录制(体力耗尽, 'cam2-energy');
  结算第二机位亲密收尾(体力耗尽, {
    场次标识: 'cam2-energy',
    结束方式: '体力耗尽',
    参与者: {
      102: {
        满意度: 第二机位完整录制基准,
        满意目标: 第二机位完整录制基准,
        有效楼数: 第二机位完整录制基准,
        结束方式: '体力耗尽',
        时长评价: '失控',
      },
    },
  });
  assert.equal(体力耗尽.系统._第二机位.阶段, '待封存');
  assert.equal(体力耗尽.系统._第二机位.录制场次标识, '');
});

test('第二机位套件、母带及其他特殊场景票据不能被普通送礼入口吞掉', async () => {
  const 套件 = 建数据();
  套件.系统._第二机位.阶段 = '待赴约';
  套件.背包.push('第二机位套件');
  const 套件送礼 = await 送礼(套件, '第二机位套件', '102');
  assert.equal(套件送礼.成功, false);
  assert.match(套件送礼.提示, /亲手安装|不能当作普通礼物/);
  assert.equal(套件.背包.includes('第二机位套件'), true);
  assert.equal(套件.系统._第二机位.阶段, '待赴约');

  const 母带 = 建数据();
  母带.系统._第二机位.阶段 = '待归档';
  母带.背包.push(沈静仪母带ID);
  const 母带送礼 = await 送礼(母带, 沈静仪母带ID, '102');
  assert.equal(母带送礼.成功, false);
  assert.match(母带送礼.提示, /302资料柜归档/);
  assert.equal(母带.背包.includes(沈静仪母带ID), true);
  assert.equal(母带.系统._第二机位.阶段, '待归档');

  const 普通场景票 = 建数据();
  普通场景票.背包.push('静音会议');
  const 场景票送礼 = await 送礼(普通场景票, '静音会议', '102');
  assert.equal(场景票送礼.成功, false);
  assert.equal(普通场景票.背包.includes('静音会议'), true);

  assert.match(客户端源码, /配\?\.类别 !== '特殊场景' \|\| id === '男用贞操带'/);
  assert.match(客户端源码, /id !== 第二机位套件ID/);
  assert.match(客户端源码, /id !== 沈静仪母带ID/);
});

test('弱模型越拍正文会被精确识别，当前拍合法内容与否定句不会误伤', () => {
  const data = 建数据();
  assert.equal(购买(data, '第二机位').成功, true);
  查动作时段(data, '门缝那一眼', 0, 42);
  const 门缝一 = 执行第二机位地点动作(data, '门缝那一眼', '102').事件;
  assert.equal(第二机位正文越拍原因(门缝一, '沈静仪开门，让玩家坐下。几句寻常话以后，她主动把人留在里间。'), '');
  assert.match(第二机位正文越拍原因(门缝一, '顾国栋的钥匙已经在外门转动。'), /提前引入/);
  assert.equal(第二机位正文越拍原因(门缝一, '屋里很安静，并没有听见钥匙转动。'), '', '明确否定句不能误判成已经发生');

  const 门缝一提交 = 提交剧情(data, { 成功: true, 事件: 门缝一 }, '102', 1);
  const 门缝二 = 门缝一提交.后续剧情.事件;
  assert.match(第二机位正文越拍原因(门缝二, '顾国栋已经站在门缝外看见两人。'), /提前完成了撞见/);

  const 对饮数据 = 建数据();
  对饮数据.系统._第二机位.阶段 = '待对饮';
  对饮数据.系统._第二机位.最早继续日 = 0;
  查丈夫在家时段(对饮数据, 0, 42);
  const 酒一 = 准备第二机位对饮(对饮数据).事件;
  assert.equal(第二机位正文越拍原因(酒一, '顾国栋谈起楼道漏水和这瓶酒的味道。'), '');
  assert.match(第二机位正文越拍原因(酒一, '顾国栋忽然说起明晚要去偏远项目住一夜。'), /提前说出了远差/);

  const 试机数据 = 建数据();
  试机数据.系统._第二机位.阶段 = '待开录';
  试机数据.户['102'].夫._剧情外出起 = 0;
  试机数据.户['102'].夫._剧情外出至 = 3;
  查动作时段(试机数据, '开始录制', 0, 3);
  const 试机一 = 执行第二机位地点动作(试机数据, '开始录制', '102').事件;
  assert.equal(第二机位正文越拍原因(试机一, '她检查监看画面，遥控器仍握在手中，红点尚未亮起。'), '');
  assert.match(第二机位正文越拍原因(试机一, '她按下REC，红点亮起，两人立刻开始性交。'), /提前开录/);

  const 试机一提交 = 提交剧情(试机数据, { 成功: true, 事件: 试机一 }, '102', 2);
  const 开录二 = 试机一提交.后续剧情.事件;
  assert.equal(第二机位正文越拍原因(开录二, '她按下REC，回到玩家身边，第一段真实接触刚刚开始。'), '');
  assert.match(第二机位正文越拍原因(开录二, '她按下REC后很快高潮，玩家射精收尾。'), /写到了结束/);

  assert.match(引擎源码, /第二机位正文越拍原因\(本楼事件/);
  assert.match(引擎源码, /第二机位当前剧情回合两次未能停在正确节点/);
  assert.match(index源码, /第二机位当前剧情回合越拍/);
});

test('多回合票在每拍成功后持久排队，后续必须由玩家回应且刷新、重复排队都不丢不叠', () => {
  const data = 建数据();
  assert.equal(购买(data, '第二机位').成功, true);
  查动作时段(data, '门缝那一眼', 0, 42);
  const 第一拍 = 执行第二机位地点动作(data, '门缝那一眼', '102');
  const 第一拍提交 = 提交剧情(data, 第一拍, '102', 9);
  assert.equal(data.系统._第二机位.阶段, '待门缝');
  assert.ok(第一拍提交.后续剧情?.事件);
  assert.match(第一拍提交.后续剧情.事件, /第二机位提交:D:2/);
  assert.match(第一拍提交.后续剧情.事件, /场景剧情需回应/);

  排入第二机位后续剧情(data, 第一拍提交);
  const 首次队列 = data.系统._待发送事件;
  const 队首 = 读取队首场景剧情(首次队列);
  assert.ok(队首);
  assert.match(队首.内容, /第二机位提交:D:2/);
  assert.match(队首.内容, /场景剧情需回应/);
  assert.equal(第二机位现场不可离开(data), true, '两拍之间等待玩家回应时也必须锁住102');
  assert.match(第二机位离场锁提示(data), /现场还没有收束|输入框回应/);
  assert.doesNotMatch(第二机位离场锁提示(data), /CAM-2正在记录/);

  排入第二机位后续剧情(data, 第一拍提交);
  assert.equal(data.系统._待发送事件, 首次队列, '同一下一拍重复排队必须幂等');

  const 刷新后 = Schema.parse(JSON.parse(JSON.stringify(data)));
  assert.match(读取队首场景剧情(刷新后.系统._待发送事件)?.内容 ?? '', /第二机位提交:D:2/);
  assert.equal(第二机位现场不可离开(刷新后), true);
  const 档案提示 = 读取第二机位档案提示(刷新后);
  assert.equal(档案提示?.进度, '剧情回合 2/4');
  assert.match(档案提示?.下一步 ?? '', /输入框回应/);

  const 越级候选 = 克隆存档(刷新后);
  const 越级旧态 = 克隆存档(越级候选);
  const 越级结果 = 结算成功现场楼(越级候选, 越级旧态, {
    楼层: 10,
    行动: '不等钥匙声，直接完成性交并收尾',
    正文: '较弱模型错误地把门缝第二拍写成完整性交。',
    本楼事件: 队首.内容,
    妻在场: ['102'],
    实际尺度: { 102: 3 },
    资源计费: true,
  });
  assert.equal(越级结果.性爱开始, false, '门缝中间拍即使模型越级也不能创建普通亲密账');
});

test('沈静仪档案常驻显示第二机位下一步、预约恢复和录制完整度', () => {
  const data = 建数据();
  const 未开始 = 读取第二机位档案提示(data);
  assert.match(未开始?.下一步 ?? '', /商店.*特殊场景.*第二机位/);

  data.系统._第二机位.阶段 = '待复核';
  const 待复核 = 读取第二机位档案提示(data);
  assert.match(待复核?.下一步 ?? '', /回302.*监控.*102/);

  data.系统._第二机位.阶段 = '录制中';
  data.系统._第二机位.录制场次标识 = 'dossier-cam2';
  data.系统._性爱场景.状态 = '进行中';
  data.系统._性爱场景.场次标识 = 'dossier-cam2';
  data.系统._性爱场景.主焦点门牌 = '102';
  data.系统._性爱场景.参与者['102'] = {
    满意度: 3,
    满意目标: 第二机位完整录制基准,
    偏好命中: [],
    等级加成已用: true,
    有效楼数: 2,
    已退出: false,
  };
  const 录制 = 读取第二机位档案提示(data);
  assert.match(录制?.下一步 ?? '', /普通亲密玩法/);
  assert.equal(录制?.进度, '有效回合 2/5 · 满意 3/5');

  data.系统._第二机位.阶段 = '待归档';
  data.背包.push(沈静仪母带ID);
  const 归档 = 读取第二机位档案提示(data);
  assert.match(归档?.下一步 ?? '', /返回302.*资料柜/);

  assert.match(档案源码, /读取第二机位档案提示/);
  assert.match(档案源码, /class="dsec second-camera-task"/);
  assert.match(档案源码, /选中第二机位提示\.进度/);
});

test('旧录像带存档保持历史隔离：未完成旧票可续，已完成旧线不再重复上架，新母带不冒充旧ID', () => {
  const 新档 = 建数据();
  assert.equal(货架ID(新档).includes('男用贞操带'), false);
  assert.equal(货架ID(新档).includes('录像带'), false);

  const 旧前置 = 建数据();
  旧前置.系统._特殊场景前置.push('录像带:102');
  assert.equal(货架ID(旧前置).includes('男用贞操带'), true);
  assert.equal(货架ID(旧前置).includes('录像带'), true);

  const 旧进行中 = 建数据();
  旧进行中.系统._特殊场景.id = '录像带前置';
  assert.equal(货架ID(旧进行中).includes('男用贞操带'), true);
  assert.equal(货架ID(旧进行中).includes('录像带'), true);

  const 旧已完成 = 建数据();
  旧已完成.系统._特殊场景前置.push('录像带:102', '录像带:202');
  旧已完成.系统._已完成特殊场景.push('录像带');
  assert.equal(货架ID(旧已完成).includes('男用贞操带'), false, '已完成历史路线不能因遗留前置再次显示商品');
  assert.equal(货架ID(旧已完成).includes('录像带'), false);

  const 新母带 = 建数据();
  新母带.系统._特殊场景前置.push('录像带结局:沈母带封存');
  新母带.系统._已完成特殊场景.push('第二机位');
  assert.equal(货架ID(新母带).includes('男用贞操带'), false);
  assert.equal(货架ID(新母带).includes('录像带'), false);
  assert.ok(商店源码.includes("key === '录像带:102' || key === '录像带:202'"));
  assert.ok(特殊场景源码.includes("_已完成特殊场景.includes('录像带')"));
});

test('怀孕与微信保持原系统所有权，旧随机门缝生产者消失，两条正文路径共用同一提交口', () => {
  const 受孕位置 = 资源源码.indexOf('判定受孕(data, data.系统._上次性爱结果)');
  const 母带位置 = 资源源码.indexOf('结算第二机位亲密收尾(data, data.系统._上次性爱结果)');
  assert.ok(受孕位置 >= 0 && 母带位置 > 受孕位置, '录制当晚必须先走现有真实受孕规则，再推进母带生命周期');

  assert.doesNotMatch(路线源码, /手机系统|通知桥|母带内容知情|母带存在知情/);
  assert.doesNotMatch(手机源码, /沈静仪母带|CAM-2/);
  assert.match(手机源码, /回国茶话会[\s\S]*角色线路事实[\s\S]*第二机位/);
  assert.doesNotMatch(路线源码, /结局轨道\s*=\s*['"]观众席['"]/);
  const 绿帽检测函数 = 结算源码.match(/export function 绿帽线检测[\s\S]*?\r?\n}/)?.[0] ?? '';
  assert.ok(绿帽检测函数);
  assert.doesNotMatch(绿帽检测函数, /户\['102'\]|结局轨道\s*=\s*['"]观众席['"]|Math\.random/);

  assert.ok(引擎源码.includes('提交第二机位剧情事件(newStat, 本楼事件, 回合场景, 楼层)'));
  assert.ok(index源码.includes("提交第二机位剧情事件(newData, 本楼事件, 读场景().房间id ?? '', 楼层)"));
  assert.ok(引擎源码.includes('第二机位真实录制已绑定(newStat)'));
  assert.ok(index源码.includes('第二机位真实录制已绑定(newData)'));
  assert.ok(资源源码.includes('第二机位事件要求真实开录(输入.本楼事件)) return false'));
  assert.ok(资源源码.includes('第二机位事件禁止正式亲密'));
  assert.ok(index源码.includes('此刻REC还没有按下'));
  assert.match(引擎源码, /正戏免检[\s\S]{0,180}第二机位事件要求真实开录\(本楼事件\)/);
  assert.ok(引擎源码.includes('排入第二机位后续剧情(newStat, 第二机位提交结果)'));
  assert.ok(index源码.includes('排入第二机位后续剧情(newData, 原生第二机位提交)'));
  assert.ok(index源码.includes("门缝那一眼: '第二机位 · 102赴约'"));
  assert.ok(index源码.includes("开始录制: '第二机位 · 最后试机'"));
  assert.doesNotMatch(index源码, /标题: `第二机位 · \$\{动作\}`/);
});

test('客户端契约覆盖102/302瓷砖、事件CG、REC叠层和物理归档，不新增室内琴房瓷砖', () => {
  assert.match(房间动作源码, /添加第二机位动作\(动作, id\)/);
  assert.match(房间动作源码, /事件\.第二机位动作\(候选\.id\)/);
  assert.match(客户端源码, /eventEmit\('人妻公寓:第二机位动作', 动作\)/);
  assert.match(客户端源码, /eventOn\('人妻公寓:第二机位CG'/);
  assert.match(客户端源码, /second-camera-rec/);
  assert.match(客户端源码, /第二机位房间背景文件\(data\.value, 房间id\)/);
  assert.match(客户端源码, /第二机位现场锁定/);
  assert.match(客户端源码, /第二机位离场锁提示/);
  assert.match(客户端源码, /弹提示\(第二机位现场锁提示\.value/);
  assert.doesNotMatch(客户端源码, /CAM-2已经开始记录。先在102完成亲密收尾/);
  assert.match(客户端源码, /房间id !== 当前房间\.value && 第二机位现场锁定\.value/);
  assert.match(客户端源码, /d\.id === 第二机位任务ID.*第二机位任务已上架\(data\.value\)/s);
  assert.match(客户端源码, /d\.id === 第二机位套件ID.*第二机位套件已上架\(data\.value\)/s);
  assert.match(客户端源码, /d\.id === '录像带' \|\| d\.id === '男用贞操带'.*旧录像带遗留商品可见\(\)/s);
  assert.doesNotMatch(房间动作源码, /琴房瓷砖|进入琴房|琴房内门/);
});

test('第二机位九张正式WebP进入源素材，运行时路由不再依赖output目录', () => {
  const 目录 = fileURLToPath(new URL('../../src/人妻公寓/素材/特殊场景/第二机位/', import.meta.url));
  const 文件 = readdirSync(目录).sort();
  assert.equal(文件.filter(名 => 名.endsWith('.webp')).length, 9);
  assert.equal(
    文件.some(名 => 名.includes('联系表')),
    false,
  );
  const 资源路由 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/assets.ts', import.meta.url), 'utf8');
  assert.match(资源路由, /rq091\/story/);
  assert.doesNotMatch(资源路由, /output\/imagegen\/second-camera/);
  assert.match(资源路由, /第二机位图片/);
});
