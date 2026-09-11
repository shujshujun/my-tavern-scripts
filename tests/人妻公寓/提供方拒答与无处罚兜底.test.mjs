/* eslint-disable import-x/no-nodejs-modules -- Complete production-turn refusal and fallback regressions. */
import assert from 'node:assert/strict';
import test from 'node:test';

import { assertReleased, clone, host } from './helpers/离婚主入口环境.mjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
process.env.TS_NODE_PREFER_TS_EXTS = 'true';
require('ts-node/register/transpile-only');
const { 是提供方拒答正文, 判定正文提交 } = require('../../src/人妻公寓/脚本/游戏逻辑/正文生成完整性.ts');

function 清普通场景票(data) {
  data.系统._待发送事件 = '';
  data.系统._场景剧情事务 = {
    id: '', 标题: '', 目标场景: '', 行动: '', 内容: '',
    触发绝对时段: -1, 触发楼层: -1, 请求世代: 0, 状态: '',
  };
  data.系统._已注入事件 = { 楼层: -1, 内容: '' };
  data.系统._特殊场景 = {
    id: '', 阶段: '', 地点: '', 参与妻: [], 演出妻: [], 演出夫: [], 启动楼层: -1,
    当前拍: 0, 议题: '', 重点妻: '', 峰值模式: '', 会后妻: [], 自由循环次数: 0,
    交互: { id: '', 类型: '', 状态: '', 失败次数: 0, 补偿可用: false },
    会场私聊摘要: {}, 会场私聊摘要楼层: -1,
  };
}

function 普通亲密主机() {
  const e = host();
  const data = e.read();
  清普通场景票(data);
  data.系统._性爱场景 = {
    状态: '进行中', 场次标识: 'fallback-session', 开始楼层: 30, 有效楼数: 3,
    本场等级加成: 0, 当前接触部位: '小屄', 当前行为: '阴道插入', 保护状态: '安全套',
    待收尾位置: '', 主焦点门牌: '201',
    参与者: {
      '201': { 满意度: 2, 满意目标: 5, 偏好命中: [], 等级加成已用: true, 有效楼数: 3 },
    },
  };
  data.玩家资源.精力.当前值 = 8;
  data.玩家资源.体力.当前值 = 8;
  data.玩家资源.精力.训练经验 = 8;
  data.玩家资源.体力.训练经验 = 8;
  e.vars._场景 = { 房间id: '201' };
  e.st.chat.at(-1).variables = [{ stat_data: clone(data) }];
  e.requests = [];
  e.trace = [];
  e.warnings = [];
  return e;
}

test('提供方拒答识别只认元层服务语义，不吞掉角色自己的拒绝', () => {
  for (const text of [
    '抱歉，我无法继续这项请求。',
    '很抱歉，我不能协助生成此类内容。',
    '作为一个AI语言模型，我无法完成这个任务。',
    '该内容不符合平台安全政策，因此无法提供。',
    "I'm sorry, but I can't assist with that request.",
  ]) assert.equal(是提供方拒答正文(text), true, text);

  for (const text of [
    '抱歉，我不能继续这段关系。',
    '我不能答应你的要求，但愿意留下来谈。',
    '她摇头说自己不愿继续，随后把门关上。',
    '许曼君拒绝了这次亲密请求，把账本收回包里。',
  ]) assert.equal(是提供方拒答正文(text), false, text);

  assert.deepEqual(
    判定正文提交('抱歉，我无法继续这项请求。', value => value, value => value),
    { 显示正文: '抱歉，我无法继续这项请求。', 成功正文: '', 失败残稿: '抱歉，我无法继续这项请求。', 可提交: false },
  );
});

test('普通主回合收到提供方拒答只请求一次，不建楼、不结算、不改亲密检查点', async () => {
  const e = 普通亲密主机();
  const before = clone(e.read());
  const rows = e.st.chat.length;
  e.provider = () => '抱歉，我无法生成涉及成人内容的回复。';

  assert.equal(await e.main.执行回合('继续和许曼君亲密'), false);
  assertReleased(e);
  assert.equal(e.requests.length, 1);
  assert.equal(e.st.chat.length, rows);
  const after = e.read();
  assert.deepEqual(after.系统._性爱场景, before.系统._性爱场景);
  assert.deepEqual(after.玩家资源, before.玩家资源);
  assert.doesNotMatch(e.st.chat.at(-1)?.mes ?? '', /无法生成涉及成人内容/u);
});

test('两稿均为真实尺度坏稿时可以使用本地无处罚收束，但体力、有效楼、满意度和偏好完全不动', async () => {
  const e = 普通亲密主机();
  const before = clone(e.read());
  const 坏稿 =
    '许曼君与你继续性交。\n' +
    '<尺度判定 模式="简">{"201":{"请求":3,"实际":3,"结果":"成功"}}</尺度判定>';
  e.provider = () => 坏稿;

  assert.equal(await e.main.执行回合('继续和许曼君亲密'), true, e.warnings.join('\n'));
  assertReleased(e);
  assert.equal(e.requests.length, 2);
  assert.match(e.st.chat.at(-1)?.mes ?? '', /许曼君在最后一步到来前按住了你的手/u);
  const after = e.read();
  assert.equal(after.玩家资源.体力.当前值, before.玩家资源.体力.当前值);
  assert.equal(after.玩家资源.精力.当前值, before.玩家资源.精力.当前值);
  assert.deepEqual(after.系统._性爱场景, before.系统._性爱场景);
});
