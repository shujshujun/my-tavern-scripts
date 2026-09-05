/* eslint-disable import-x/no-nodejs-modules -- Node-only source contract */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('302结局后只有 `_302共居` 一份精简Schema与initvar真值，不保留未发布旧日常迁移', () => {
  const schema = read('src/人妻公寓/schema.ts');
  const schemaJson = JSON.parse(read('src/人妻公寓/schema.json'));
  const initvar = read('src/人妻公寓/世界书/变量/initvar.yaml');
  const properties = schemaJson.properties.系统.properties;

  assert.match(schema, /_302共居:\s*z/);
  assert.doesNotMatch(schema, /\n\s*_母亲共居:\s*z/);
  assert.equal(Boolean(properties._302共居), true);
  assert.equal('_母亲共居' in properties, false);
  assert.match(initvar, /\n\s*_302共居:/);
  assert.doesNotMatch(initvar, /\n\s*_母亲共居:/);
  assert.doesNotMatch(schema, /迁移母亲共居单一状态|补齐302共居反馈队列/);
  const keys = Object.keys(properties._302共居.properties);
  assert.deepEqual(keys, ['版本', '状态', '开始绝对时段', '最近事件', '最近事件时段', '里程碑', '事件序号', '事件记录', '待反馈事件']);
  assert.doesNotMatch(
    JSON.stringify(properties._302共居),
    /兼容迁移待保存|当前日|今日安排|安排时段|今日早餐|今日晚饭|今日夜晚|未解决事项/,
  );
});

test('真实地图与客户端只生产一套302共居动作，双重继承不再冒充共居门面', () => {
  const ending = read('src/人妻公寓/脚本/游戏逻辑/双重继承系统.ts');
  const room = read('src/人妻公寓/界面/客户端/composables/useRoomActions.ts');
  const app = read('src/人妻公寓/界面/客户端/App.vue');
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');

  assert.doesNotMatch(ending, /尝试读取母亲共居地点动作|尝试执行母亲共居动作|尝试提交母亲共居剧情事件/);
  assert.match(room, /母亲共居地点动作/);
  assert.match(app, /人妻公寓:302共居动作/);
  assert.match(index, /eventOn\('人妻公寓:302共居动作'/);
  assert.match(index, /'人妻公寓:302共居动作'/);
});

test('固定回合与原生正文共享302自由阶段历史封存，离开302仍由函数地点门保护', () => {
  const core = read('src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');
  const round = read('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');

  assert.match(core, /当前地点 !== '302'/);
  assert.match(core, /应用302自由阶段历史到原生请求/);
  assert.match(core, /最后用户索引 < 0\) return false/);
  assert.match(round, /构造302自由阶段聊天历史/);
  assert.match(index, /应用302自由阶段历史到原生请求\(演出data, 原生当前场景 \?\? '', chat\)/);
});

test('自由阶段变量视图封存堕落轴但保留真实亲密身体开发', () => {
  const io = read('src/人妻公寓/脚本/游戏逻辑/mvuIO.ts');
  assert.match(io, /母亲自由共居/);
  assert.match(io, /if \(!母亲自由共居\) 妻\.堕落值/);
  assert.match(io, /妻\.身体开发/);
  assert.doesNotMatch(io, /妻\.当前阶段\s*=/);
});

test('母亲共居硬反馈拥有独立待发队列、最终朋友圈CAS和持久收据回写', () => {
  const core = read('src/人妻公寓/脚本/游戏逻辑/302共居系统.ts');
  const phone = read('src/人妻公寓/脚本/游戏逻辑/手机/节拍引擎.ts');
  const data = read('src/人妻公寓/脚本/游戏逻辑/手机/数据层.ts');
  const cross = read('src/人妻公寓/脚本/游戏逻辑/手机/母亲共居跨容器事务.ts');

  assert.match(core, /待反馈事件/);
  assert.match(core, /提交母亲共居朋友圈反馈/);
  assert.match(phone, /恢复母亲共居朋友圈反馈主状态/);
  assert.match(cross, /读库\(\)\.圈\.map\(朋友圈稳定事件键\)/);
  assert.match(cross, /提交母亲共居朋友圈反馈\(data, 事件ID\)/);
  assert.match(data, /const 活朋友圈键 = new Set/);
  assert.match(data, /if \(活朋友圈键\.has\(事件键\)\) return false/);
  assert.doesNotMatch(phone, /人妻公寓:302共居手机反馈已持久化/);
});

test('当前聊天世界书使用聊天级API并在切聊时作废缓存，不写角色主世界书', () => {
  const worldbook = read('src/人妻公寓/脚本/游戏逻辑/302共居世界书.ts');
  const publisher = read('src/人妻公寓/脚本/游戏逻辑/阶段世界书同步器.ts');
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  assert.match(worldbook, /同步阶段世界书投影\(\[构造302阶段世界书投影\(data\)\]/);
  assert.match(publisher, /getOrCreateChatWorldbook\('current'\)/);
  assert.match(publisher, /updateWorldbookWith/);
  assert.doesNotMatch(worldbook + publisher, /getCharWorldbookNames|rebindCharWorldbooks/);
  assert.match(index, /作废全部角色阶段世界书缓存\(\)/);
});

test('302结局后冷落预警自身直接排除母亲，其他门牌继续走原扫描', () => {
  const cold = read('src/人妻公寓/脚本/游戏逻辑/手机/冷落预警.ts');
  assert.match(cold, /门牌号 === '302' && 母亲共居已开启\(data\)/);
  assert.match(cold, /计算妻冷落消息档/);
});

test('302九图包只保留独立素材仓映射，未发布时安全回退且优先级低于具体房间后果', () => {
  const assets = read('src/人妻公寓/界面/客户端/assets.ts');
  const app = read('src/人妻公寓/界面/客户端/App.vue');
  const index = read('src/人妻公寓/脚本/游戏逻辑/index.ts');
  for (const name of ['早晨', '白天', '傍晚归家', '夜晚', '深夜']) assert.match(assets, new RegExp(`302_共居_${name}\\.webp`));
  for (const name of [
    '302_亲密开场_由我开始_夜晚',
    '302_亲密开场_由我开始_晨间',
    '302_亲密开场_让她开始_夜晚',
    '302_亲密开场_让她开始_晨间',
  ]) assert.match(assets, new RegExp(name));
  assert.match(assets, /__RQGY_302_COHAB_ASSET_BASE__/);
  assert.match(assets, /状态: '待独立素材仓'/);
  assert.doesNotMatch(assets, /^import .*output\/imagegen|^import .*\.(?:png|webp)\?url/m);
  assert.match(app, /房间生产背景键[\s\S]*第二机位房间背景文件[\s\S]*共居302背景图/);
  assert.match(app, /人妻公寓:302亲密开场CG/);
  assert.match(app, /if \(!载荷\?.文件 \|\| !共居302亲密开场图\(载荷\.文件\)\) return/);
  assert.match(app, /进入亲密场景/);
  assert.match(index, /if \(成功 && 开场CG\)[\s\S]*人妻公寓:302亲密开场CG/);
});
