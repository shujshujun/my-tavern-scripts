/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');
globalThis._ = require('lodash');

const { Schema, 创建户节点 } = require('../../src/人妻公寓/schema.ts');
const { 户静态表, 门牌列表 } = require('../../src/人妻公寓/stageConfig.ts');
const {
  待产图片键,
  产后图片键,
  微信母婴图片键,
  房间生产背景键,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生产系统.ts');

const 仓库根 = fileURLToPath(new URL('../../', import.meta.url));
const 生产素材目录 = path.join(仓库根, 'output/imagegen/production-system/final');
const 家庭计划素材目录 = path.join(仓库根, 'output/imagegen/family-plan');

function 递归文件(目录, 扩展名) {
  const 结果 = [];
  const 扫描 = (当前, 前缀 = '') => {
    for (const 条 of readdirSync(当前, { withFileTypes: true })) {
      const 相对 = 前缀 ? `${前缀}/${条.name}` : 条.name;
      if (条.isDirectory()) 扫描(path.join(当前, 条.name), 相对);
      else if (条.isFile() && 条.name.endsWith(扩展名)) 结果.push(相对);
    }
  };
  扫描(目录);
  return 结果.sort();
}

function 去扩展名(文件们, 扩展名) {
  return new Set(文件们.map(文件 => 文件.slice(0, -扩展名.length)));
}

function 建房间素材数据(门牌, 胎次) {
  const data = Schema.parse({ 户: { [门牌]: 创建户节点(0) } });
  for (let 序号 = 1; 序号 <= 胎次; 序号 += 1) {
    data.系统._家庭文档.孩子.push({
      id: `asset:${门牌}:${序号}`,
      母亲门牌: 门牌,
      胎次: 序号,
      性别: 序号 % 2 ? '女' : '男',
      出生绝对时段: 序号,
      结果: '完全缺席',
      玩家产后看望: false,
      获知生产路径: '私聊',
      叙事最小年龄: 0,
      年龄阶段: '新生儿',
      出生场次标识: `asset-scene-${序号}`,
    });
  }
  return data;
}

test('73张生产素材与六名角色×三胎×四阶段运行时ID双向完全一致', () => {
  const 期望 = new Set(['医院/医院_通用地点背景']);
  for (const 门牌 of 门牌列表) {
    const 妻名 = 户静态表[门牌].妻名;
    for (let 胎次 = 1; 胎次 <= 3; 胎次 += 1) {
      const 待产 = `待产/${妻名}/${门牌}_${妻名}_第${胎次}胎_待产`;
      const 产后 = `产后/${妻名}/${门牌}_${妻名}_第${胎次}胎_产后母婴`;
      const 微信 = `微信/${妻名}/${门牌}_${妻名}_第${胎次}胎_微信母婴照`;
      const 房间 = `房间/${妻名}/${门牌}_${妻名}_第${胎次}胎_房间宝宝用品`;
      assert.equal(待产图片键(门牌, 胎次), 待产);
      assert.equal(产后图片键(门牌, 胎次), 产后);
      assert.equal(微信母婴图片键(门牌, 胎次), 微信);
      assert.equal(房间生产背景键(建房间素材数据(门牌, 胎次), 门牌), 房间);
      for (const 键 of [待产, 产后, 微信, 房间]) 期望.add(键);
    }
  }

  const WebP = 去扩展名(递归文件(生产素材目录, '.webp'), '.webp');
  const PNG = 去扩展名(递归文件(生产素材目录, '.png'), '.png');
  assert.equal(期望.size, 73);
  assert.deepEqual(WebP, 期望, '运行时 WebP 不得有孤儿、缺图、重复所有权或错主角');
  assert.deepEqual(PNG, 期望, '生产源 PNG 与正式 WebP 必须保持一一对应');
});

test('家庭计划九张正式WebP与六个事务CG及三个101背景ID双向一致', () => {
  const 期望 = new Set([
    '101_家庭计划板_01初始',
    '101_家庭计划板_02资料',
    '101_家庭计划板_03人选',
    '家庭计划_D1_安装计划板',
    '家庭计划_D2_投放匿名资料',
    '家庭计划_D3_监控阅读资料',
    '家庭计划_D4_送出姓名磁贴',
    '家庭计划_D5_监控确认人选',
    '家庭计划_赴约_宣布决定',
  ]);
  const 正式WebP = 去扩展名(
    readdirSync(家庭计划素材目录).filter(文件 => 文件.endsWith('.webp')).sort(),
    '.webp',
  );
  const 系统源码 = readFileSync(
    path.join(仓库根, 'src/人妻公寓/脚本/游戏逻辑/家庭计划系统.ts'),
    'utf8',
  );
  const 源码ID = new Set(
    [...系统源码.matchAll(/'(家庭计划_(?:D[1-5]|赴约)_[^']+|101_家庭计划板_[^']+)'/gu)].map(匹配 => 匹配[1]),
  );

  assert.equal(正式WebP.size, 9);
  assert.deepEqual(正式WebP, 期望);
  assert.deepEqual(源码ID, 期望, '任何正式家庭计划画面都必须拥有唯一事务或背景消费者');
});

test('家庭计划旧图片的迟到失败只淘汰自己的请求，不得关闭新节点或生产画面', () => {
  const 客户端源码 = readFileSync(path.join(仓库根, 'src/人妻公寓/界面/客户端/App.vue'), 'utf8');
  const 舞台源码 = readFileSync(path.join(仓库根, 'src/人妻公寓/界面/客户端/components/家庭计划演出.vue'), 'utf8');

  assert.match(舞台源码, /imageError: \[imageUrl: string\]/u, '图片失败事件必须携带实际 DOM 请求身份');
  assert.match(舞台源码, /dataset\.imageUrl/u, '迟到回调不能临时读取已经切换的新 prop');
  assert.match(舞台源码, /:key="imageUrl"/u, '节点切换必须创建独立图片请求节点');
  assert.match(
    客户端源码,
    /function 当前事件CG加载失败\(失败地址: string\)[\s\S]{0,160}失败地址 !== 当前事件CG地址\.value[\s\S]{0,160}关闭当前事件CG\(\)/u,
    'App 只允许当前仍展示的事件 CG 失败回调关闭舞台',
  );
});

test('生产画面与家庭计划画面共用事件舞台时，生产候选拥有明确渲染优先级且资源仓不串线', () => {
  const 客户端源码 = readFileSync(path.join(仓库根, 'src/人妻公寓/界面/客户端/App.vue'), 'utf8');
  const 素材源码 = readFileSync(path.join(仓库根, 'src/人妻公寓/界面/客户端/assets.ts'), 'utf8');
  const 逻辑源码 = readFileSync(path.join(仓库根, 'src/人妻公寓/脚本/游戏逻辑/index.ts'), 'utf8');

  assert.match(
    客户端源码,
    /当前事件CG = computed\(\(\) => 当前生产CG\.value \?\? 当前家庭计划CG\.value\)/u,
  );
  assert.match(
    客户端源码,
    /当前事件CG地址 = computed\(\(\) => \(当前生产CG\.value \? 生产图片\([^)]+\) : 当前家庭计划CG地址\.value\)\)/u,
  );
  assert.match(客户端源码, /eventOn\('人妻公寓:生产CG',[\s\S]{0,220}当前家庭计划CG\.value = null/u);
  assert.match(逻辑源码, /当前事件尚未结束，家庭计划暂不能继续/u);
  assert.match(素材源码, /家庭计划素材基址[\s\S]{0,180}rq0\.83\/output\/imagegen\/family-plan/u);
  assert.match(素材源码, /生产素材基址[\s\S]{0,180}rq0\.83\/output\/imagegen\/production-system\/final/u);
});
