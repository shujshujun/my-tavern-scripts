/* eslint-disable import-x/no-nodejs-modules -- Node-only source alignment regression */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const 读 = 路径 => readFileSync(new URL(`../../${路径}`, import.meta.url), 'utf8');
const 回合引擎 = 读('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
const MVU解析模式 = 读('src/人妻公寓/MVU解析模式.ts');
const 游戏入口 = 读('src/人妻公寓/脚本/游戏逻辑/index.ts');
const 时间推进 = 读('src/人妻公寓/脚本/游戏逻辑/时间推进系统.ts');
const 侦探系统 = 读('src/人妻公寓/脚本/游戏逻辑/侦探系统.ts');
const 存档结构 = 读('src/人妻公寓/schema.ts');
const 当前入口说明 = 读('src/人妻公寓/新窗口入口_精简.md');
const 手机生成 = 读('src/人妻公寓/脚本/游戏逻辑/手机/生成引擎.ts');

test('v0.80运行时只允许外置变量解析，不保留正文变量直出或二次结算入口', () => {
  for (const 旧语义 of [
    '补模型变量结算',
    '二次变量结算开启',
    '二次变量结算',
    'GEMINI变量更新强制令',
    '正文模型变量路线',
    '随AI输出',
  ]) {
    assert.doesNotMatch(回合引擎, new RegExp(旧语义), `回合引擎不得保留：${旧语义}`);
  }
  assert.match(回合引擎, /const 正文模型覆盖 = \{ chat_history: \{ with_depth_entries: false \} \};/);
  assert.match(回合引擎, /async function 内置外置变量解析/);
  assert.equal((回合引擎.match(/content: 变量结算令/g) ?? []).length, 2, '只接数据库代发与自定义解析模型');
  assert.match(
    回合引擎,
    /if \(\(内置解析变量块已就绪 \|\| 官方外置变量块需本地应用\) && !变量解析已降级\)/,
    '本地只解析内置新块或官方桥尚未落地的标准 replace 块',
  );
});

test('v0.80写设置只能写额外模型解析，版本化初始化使用当前版本键', () => {
  assert.doesNotMatch(MVU解析模式, /'随AI输出'/);
  assert.match(MVU解析模式, /更新方式\?: '额外模型解析';/);
  assert.match(MVU解析模式, /MVU外置默认V080已初始化/);
  assert.doesNotMatch(MVU解析模式, /MVU外置默认V074/);
});

test('v0.80启动不再迁移旧存档电话软项或延迟时间票', () => {
  for (const 旧迁移 of ['清理旧版电话软事件', '是单一时间流逝事件', '遗留时间票', '有旧电话软事件']) {
    assert.doesNotMatch(游戏入口, new RegExp(旧迁移), `启动入口不得保留：${旧迁移}`);
  }
  assert.doesNotMatch(时间推进, /清理旧版电话软事件|是单一时间流逝事件|启动迁移已清掉旧版电话软项/);
  assert.doesNotMatch(侦探系统, /【母亲裂缝·父亲来电】/, '母亲来电线索不得再生产已退役的软事件');
  assert.doesNotMatch(游戏入口, /来电回流|线索\.事件/, '父亲电话收尾不得保留旧软事件消费者');
  assert.match(时间推进, /`_待发送事件` 队列只保存当前版本的强制剧情/);
});

test('当前存档错误明确兼容 v0.80-v0.83，并且维护说明不再声称正文变量路线仍需覆盖', () => {
  assert.match(存档结构, /v0\.84 仅兼容数据版本 7、8 和 9/);
  assert.match(存档结构, /v0\.80\/v0\.81\/v0\.82\/v0\.83 存档可直接继承/);
  assert.doesNotMatch(存档结构, /0\.62 后不兼容旧存档|rq0\.62或更早|旧档首见校准/);
  assert.doesNotMatch(当前入口说明, /正文二次结算必须关闭|正文变量路线与 MVU 外置路线|正文模型变量路线/);
  assert.match(当前入口说明, /数据库代发或自定义解析模型/);
});

test('对齐变量路线不误删主正文生成与当前手机小生成正文通道', () => {
  assert.match(回合引擎, /async function 等待正文生成/);
  assert.match(回合引擎, /原文 = await 等待正文生成\(/);
  assert.match(手机生成, /async function 正文API生成\(/);
});
