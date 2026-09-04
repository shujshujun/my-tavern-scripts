/* eslint-disable import-x/no-nodejs-modules -- source-level production wiring regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 读 = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const 宿主 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
const 客户端 = 读('src/人妻公寓/界面/客户端/App.vue');
const 组合器 = 读('src/人妻公寓/界面/客户端/composables/useVideoTapeV4.ts');
const 舞台 = 读('src/人妻公寓/界面/客户端/components/录像带V4舞台.vue');
const 操作 = 读('src/人妻公寓/界面/客户端/components/录像带V4操作.vue');
const 运行时 = 读('src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');
const 商店 = 读('src/人妻公寓/脚本/游戏逻辑/商店系统.ts');

test('宿主把监控启动、逐幕AI事务、失败回滚和最终完成真正接到V4状态机', () => {
  assert.match(宿主, /生成录像带V4隔离草稿/u);
  assert.match(宿主, /准备录像带V4监控/u);
  assert.match(宿主, /规划录像带V4操作/u);
  assert.match(宿主, /提交录像带V4操作/u);
  assert.match(宿主, /记录录像带V4操作失败/u);
  assert.match(宿主, /安全中断录像带V4/u);
  assert.match(宿主, /完成录像带V4/u);
  assert.match(宿主, /eventOn\('人妻公寓:启动录像带V4监控'/u);
  assert.match(宿主, /eventOn\('人妻公寓:录像带V4操作'/u);
  assert.match(宿主, /eventOn\('人妻公寓:安全中断录像带V4'/u);
  assert.match(宿主, /eventOn\('人妻公寓:完成录像带V4'/u);
  const 准备位置 = 宿主.indexOf('准备隔离事件事务({', 宿主.indexOf('执行录像带V4操作'));
  const 生成位置 = 宿主.indexOf('生成录像带V4隔离草稿({', 宿主.indexOf('执行录像带V4操作'));
  const 提交位置 = 宿主.indexOf('顺序提交隔离事件({', 宿主.indexOf('执行录像带V4操作'));
  assert.ok(准备位置 >= 0 && 生成位置 > 准备位置 && 提交位置 > 生成位置, 'V4必须先持久准备事务，再生成，最后原子提交');
});

test('客户端货架与后端使用同一V4顺序门，先录像带再按剩余数量出售两把锁', () => {
  assert.match(客户端, /录像带V4录像带可购买/u);
  assert.match(客户端, /录像带V4贞操锁可购买数量/u);
  assert.match(客户端, /function 录像带剧情商品可见/u);
  assert.match(客户端, /录像带剧情商品可见\(d\.id\)/u);
  assert.match(客户端, /function 录像带贞操锁可送门牌/u);
  assert.match(客户端, /V4\.阶段 === '待购赠锁' && !V4\.赠锁\[门牌号\]\.已接收/u);
  assert.match(客户端, /id !== '男用贞操带' \|\| 录像带贞操锁可送门牌\(m\)/u);
  assert.match(客户端, /商品\.id === '录像带' && !旧录像带遗留商品可见\(\)/u);
  const V4购买起点 = 商店.indexOf("if (道具id === '录像带' && !旧录像带遗留路线可见(data))");
  const V4购买终点 = 商店.indexOf('const 场景 = 查特殊场景', V4购买起点);
  const V4购买段 = 商店.slice(V4购买起点, V4购买终点);
  assert.ok(V4购买起点 >= 0 && V4购买终点 > V4购买起点, '必须能定位V4录像带购买分支');
  assert.match(V4购买段, /提示: `买下了\$\{配\.名称\}。\$\{登记\.提示\}`/u, '商品名已有书名括号，成功文案不得再包一层');
  assert.doesNotMatch(V4购买段, /买下了「\$\{配\.名称\}」/u, '录像带购买提示不得出现双重书名括号');
});

test('客户端从任意普通地点点击监控后复用真实移动到302，并进入独立V4舞台', () => {
  assert.match(客户端, /useVideoTapeV4/u);
  assert.match(客户端, /VideoTapeV4Stage/u);
  assert.match(客户端, /VideoTapeV4Controls/u);
  assert.match(客户端, /录像带V4监控就绪/u);
  assert.match(客户端, /async function 打开监控入口/u);
  assert.match(客户端, /确认已到达动作地点\('302'\)[\s\S]{0,260}启动录像带V4监控/u);
  assert.match(客户端, /录像带任一中/u);
  assert.match(客户端, /<VideoTapeV4Stage/u);
  assert.match(客户端, /<VideoTapeV4Controls/u);
});

test('V4舞台的每张产品图或失败占位都经过同一REC、CAM、时间码和监控框', () => {
  assert.match(舞台, />REC</u);
  assert.match(舞台, /CAM-\{\{ snapshot\.当前房间 \}\}/u);
  assert.match(舞台, /格式化时间码/u);
  assert.match(舞台, /vtr-v4-scanlines/u);
  assert.match(舞台, /vtr-v4-fallback/u);
  assert.match(舞台, /aspect-ratio:\s*3\s*\/\s*2/u);
  assert.doesNotMatch(舞台, /第\s*\{\{\s*snapshot\.共享幕次/u, '界面不得泄露全局幕次');
});

test('操作区保留102、202与下一幕/结束，并提供生成取消和不结算安全退出', () => {
  assert.match(操作, />102</u);
  assert.match(操作, />202</u);
  assert.match(操作, /下一幕/u);
  assert.match(操作, /结束监控/u);
  assert.match(操作, /取消本幕/u);
  assert.match(操作, /安全退出本场/u);
  assert.match(操作, /emit\('cancel'\)/u);
  assert.match(操作, /emit\('abort'\)/u);
  assert.match(客户端, /@cancel="取消回合"/u);
  assert.match(客户端, /@abort="安全退出录像带V4"/u);
  assert.match(客户端, /eventEmit\('人妻公寓:安全中断录像带V4'\)/u);
  assert.match(组合器, /V4\.阶段 === '已安全中断'/u, '安全退出后监控入口必须允许从头重开');
  assert.match(组合器, /data\.value\.背包\.includes\('录像带'\)/u, '只有退回的同一盘录像带仍在背包时才显示重开入口');
  assert.match(组合器, /选择房间/u);
  assert.match(组合器, /请求V4操作\('切房'\)/u);
  assert.match(组合器, /请求V4操作\('下一幕'\)/u);
  assert.match(组合器, /请求V4操作\('开始'\)/u);
});

test('38张WebP产品已本地安装但不静态打包，外部发布前只允许显式素材基址', () => {
  assert.match(运行时, /__RQGY_VTR_V4_ASSET_BASE__/u);
  assert.doesNotMatch(运行时, /__RQGY_VTR_V4_CANDIDATE_BASE__/u);
  assert.match(运行时, /formalAccepted:\s*true/u);
  assert.match(运行时, /installed:\s*true/u);
  assert.match(运行时, /productionUnlocked:\s*false/u);
  assert.doesNotMatch(客户端 + 组合器 + 舞台, /final-candidates\/VTR-V4-[^'"`]+\.png/u);
  assert.doesNotMatch(客户端 + 组合器 + 舞台 + 运行时, /\.(?:png|webp)\?url/u);
});
