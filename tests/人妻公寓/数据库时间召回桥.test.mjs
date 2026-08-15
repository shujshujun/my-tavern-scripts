/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const {
  取消当前数据库剧情规划,
  构造数据库剧情规划输入,
  经数据库剧情规划生成,
} = require('../../src/人妻公寓/脚本/游戏逻辑/数据库剧情规划桥.ts');

function 建数据库运行时(包装逻辑) {
  const 原始调用 = [];
  const 原始生成 = async 参数 => {
    原始调用.push(参数);
    return '数据库下游原始生成结果';
  };
  const 运行时 = {
    original_TavernHelper_generate_ACU: 原始生成,
    TavernHelper: {},
    frames: [],
  };
  运行时.TavernHelper.generate = 参数 => 包装逻辑(运行时, 参数);
  const 根窗口 = { frames: [运行时] };
  根窗口.parent = 根窗口;
  根窗口.top = 根窗口;
  return { 根窗口, 运行时, 原始生成, 原始调用 };
}

test('规划检索锚显式携带游戏日期、时段、地点和人物边界，不伪造公历', () => {
  const 输入 = 构造数据库剧情规划输入('敲响 101 的房门', {
    日期: '第3天',
    时段: '傍晚',
    地点: '101',
    当前角色: ['林婉清', '林婉清', '周明远'],
    焦点角色: ['林婉清'],
  });

  assert.match(输入, /当前游戏日期=第3天/);
  assert.match(输入, /当前游戏时段=傍晚/);
  assert.match(输入, /当前地点=101/);
  assert.match(输入, /当前在场角色=林婉清、周明远/);
  assert.match(输入, /其他角色的记忆只有与本轮存在明确因果/);
  assert.match(输入, /当前角色未亲历、未目击且未被转告/);
  assert.match(输入, /<rqgy_player_action>\n敲响 101 的房门/);
  assert.doesNotMatch(输入, /\d{4}-\d{2}-\d{2}/, '游戏没有公历，不得为迎合数据库格式伪造现实日期');
});

test('成功路径只运行官方规划，不发出伪非流式正文；规划结果进入原流式请求且保留卡片注入', async () => {
  const 规划入参 = [];
  const { 根窗口, 运行时, 原始生成, 原始调用 } = 建数据库运行时(async (scope, 参数) => {
    规划入参.push({ ...参数 });
    参数.user_input = `<数据库规划>召回 AM0007 后回应：${参数.user_input}</数据库规划>`;
    参数._qrf_processed_by_hook = true;
    return scope.original_TavernHelper_generate_ACU(参数);
  });
  const 正文调用 = [];
  const 卡片注入 = [{ role: 'system', content: '公寓快照与行动锚', position: 'in_chat', depth: 0, should_scan: true }];
  const 规划检索输入 = 构造数据库剧情规划输入('敲响 101 的房门', {
    日期: '第3天',
    时段: '傍晚',
    地点: '101',
    当前角色: ['林婉清'],
    焦点角色: ['林婉清'],
  });

  const 结果 = await 经数据库剧情规划生成(
    {
      user_input: '敲响 101 的房门',
      should_stream: true,
      injects: 卡片注入,
      generation_id: 'rqgy-turn-1',
    },
    {
      启用: true,
      根窗口,
      规划输入: 规划检索输入,
      调用正文: async 参数 => {
        正文调用.push(参数);
        return '流式正文';
      },
    },
  );

  assert.equal(结果, '流式正文');
  assert.equal(规划入参.length, 1);
  assert.equal(规划入参[0].should_stream, false, '官方钩子必须看到非流式规划请求');
  assert.equal(规划入参[0].user_input, 规划检索输入, '官方规划必须收到带日期、时段与人物范围的检索锚');
  assert.equal('injects' in 规划入参[0], false, '规划只看真实玩家行动，不能误把整份公寓快照当 userMessage');
  assert.deepEqual(原始调用, [], '规划阶段必须截住数据库即将发出的伪正文请求');
  assert.equal(正文调用.length, 1);
  assert.equal(正文调用[0].should_stream, true, '最终正文必须保留原流式传输');
  assert.equal(正文调用[0].automatic_trigger, true, '数据库前置已经完成，正文阶段必须阻止同一动作被重复处理');
  assert.equal(正文调用[0].generation_id, 'rqgy-turn-1');
  assert.equal(正文调用[0].user_input.includes('AM0007'), true, '最终正文请求必须携带数据库召回编码');
  assert.strictEqual(正文调用[0].injects, 卡片注入, '卡片快照、行动锚与系统注入必须原样保留');
  assert.strictEqual(运行时.original_TavernHelper_generate_ACU, 原始生成, '临时截获结束后必须恢复数据库原始生成器');
});

test('剧情推进关闭或规划失败时安全降级为原流式正文，不吞玩家行动', async () => {
  const { 根窗口, 运行时, 原始生成, 原始调用 } = 建数据库运行时((_scope, 参数) =>
    运行时.original_TavernHelper_generate_ACU(参数),
  );
  const 正文调用 = [];
  const 原参数 = {
    user_input: '去公共厨房看看',
    should_stream: true,
    injects: [{ role: 'system', content: '快照', position: 'in_chat', depth: 0, should_scan: true }],
    generation_id: 'rqgy-turn-2',
  };

  const 结果 = await 经数据库剧情规划生成(原参数, {
    启用: true,
    根窗口,
    调用正文: async 参数 => {
      正文调用.push(参数);
      return '无召回正文';
    },
  });

  assert.equal(结果, '无召回正文');
  assert.deepEqual(原始调用, [], '即使规划透传，也不能真的生成一次隐藏非流式正文');
  assert.equal(正文调用.length, 1);
  assert.equal(正文调用[0].user_input, 原参数.user_input);
  assert.equal(正文调用[0].should_stream, true);
  assert.strictEqual(运行时.original_TavernHelper_generate_ACU, 原始生成);
});

test('截获窗口内的无关生成继续转发，只截取带本轮身份的规划请求', async () => {
  const { 根窗口, 运行时, 原始调用 } = 建数据库运行时(async (scope, 参数) => {
    await scope.original_TavernHelper_generate_ACU({ user_input: '其他插件后台请求', should_stream: false });
    参数.user_input = '<recall>AM0003</recall>';
    参数._qrf_processed_by_hook = true;
    return scope.original_TavernHelper_generate_ACU(参数);
  });
  const 正文调用 = [];

  await 经数据库剧情规划生成(
    { user_input: '本轮行动', should_stream: true, generation_id: 'rqgy-turn-3' },
    {
      启用: true,
      根窗口,
      调用正文: async 参数 => {
        正文调用.push(参数);
        return '正文';
      },
    },
  );

  assert.deepEqual(
    原始调用.map(item => item.user_input),
    ['其他插件后台请求'],
    '无关请求必须继续送到数据库原始生成器，不能被本轮捕获器吞掉',
  );
  assert.equal(正文调用[0].user_input, '<recall>AM0003</recall>');
});

test('规划期间取消会请求官方中止，并在规划迟到返回后拒绝启动正文', async () => {
  let 释放规划;
  const 规划门 = new Promise(resolve => {
    释放规划 = resolve;
  });
  const { 根窗口, 运行时, 原始生成 } = 建数据库运行时(async (scope, 参数) => {
    await 规划门;
    参数.user_input = '<recall>AM0012</recall>';
    参数._qrf_processed_by_hook = true;
    return scope.original_TavernHelper_generate_ACU(参数);
  });
  let 中止请求数 = 0;
  let 正文调用数 = 0;

  const 等待 = 经数据库剧情规划生成(
    { user_input: '取消这轮', should_stream: true, generation_id: 'rqgy-turn-4' },
    {
      启用: true,
      根窗口,
      请求中止规划: () => {
        中止请求数 += 1;
      },
      调用正文: async () => {
        正文调用数 += 1;
        return '不应生成';
      },
    },
  );

  await new Promise(resolve => setImmediate(resolve));
  assert.equal(取消当前数据库剧情规划(), true, '规划在途时取消必须由数据库规划桥认领');
  assert.equal(中止请求数, 1);
  const 取消结果 = await Promise.race([
    等待.then(
      () => '意外完成',
      错误 => String(错误),
    ),
    new Promise(resolve => setTimeout(() => resolve('取消后仍悬空'), 100)),
  ]);
  assert.match(取消结果, /__RQGY_CANCELLED__/, '底层忽略中止时，取消门也必须立即释放本轮等待');
  assert.equal(正文调用数, 0, '取消后的迟到规划结果绝不能复活正文生成');
  assert.equal(取消当前数据库剧情规划(), false, '外层取消完成后必须立即释放取消权');

  // 底层迟到前，安全转发器仍要保护本轮规划参数，同时不能阻塞无关生成。
  assert.equal(await 运行时.original_TavernHelper_generate_ACU({ user_input: '无关请求' }), '数据库下游原始生成结果');
  释放规划();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(运行时.original_TavernHelper_generate_ACU, 原始生成, '取消路径同样必须恢复官方生成器');
});

test('规划超时会中止官方请求并降级正文，迟到规划不得额外生成隐藏正文', async () => {
  let 释放规划;
  const 规划门 = new Promise(resolve => {
    释放规划 = resolve;
  });
  const { 根窗口, 运行时, 原始生成, 原始调用 } = 建数据库运行时(async (scope, 参数) => {
    await 规划门;
    参数.user_input = '<recall>迟到规划</recall>';
    参数._qrf_processed_by_hook = true;
    return scope.original_TavernHelper_generate_ACU(参数);
  });
  let 中止请求数 = 0;
  const 正文调用 = [];

  const 结果 = await 经数据库剧情规划生成(
    { user_input: '超时后继续', should_stream: true, generation_id: 'rqgy-turn-timeout' },
    {
      启用: true,
      根窗口,
      规划超时毫秒: 20,
      请求中止规划: () => {
        中止请求数 += 1;
      },
      调用正文: async 参数 => {
        正文调用.push(参数);
        return '超时降级正文';
      },
    },
  );

  assert.equal(结果, '超时降级正文');
  assert.equal(中止请求数, 1);
  assert.equal(正文调用.length, 1);
  assert.equal(正文调用[0].user_input, '超时后继续');
  assert.equal(正文调用[0].automatic_trigger, true, '超时降级正文不得再次进入同一个数据库规划钩子');
  assert.equal(取消当前数据库剧情规划(), false);

  释放规划();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(原始调用, [], '超时后的目标规划请求必须由迟到保护器吞掉，不能生成第二份隐藏正文');
  assert.strictEqual(运行时.original_TavernHelper_generate_ACU, 原始生成);
});

test('官方规划已完成改写与截获但收尾悬空时，超时正文采用已冻结结果且不重跑规划', async () => {
  let 释放收尾;
  const 收尾门 = new Promise(resolve => {
    释放收尾 = resolve;
  });
  const { 根窗口, 运行时, 原始生成, 原始调用 } = 建数据库运行时(async (scope, 参数) => {
    参数.user_input = '<recall>已完成的规划</recall>';
    参数._qrf_processed_by_hook = true;
    await scope.original_TavernHelper_generate_ACU(参数);
    await 收尾门;
    return '';
  });
  const 正文调用 = [];

  const 结果 = await 经数据库剧情规划生成(
    { user_input: '采用已规划结果', should_stream: true },
    {
      启用: true,
      根窗口,
      规划超时毫秒: 20,
      请求中止规划: () => undefined,
      调用正文: async 参数 => {
        正文调用.push(参数);
        return '已规划正文';
      },
    },
  );

  assert.equal(结果, '已规划正文');
  assert.equal(正文调用[0].user_input, '<recall>已完成的规划</recall>');
  assert.equal(正文调用[0].automatic_trigger, true);
  assert.deepEqual(原始调用, []);
  释放收尾();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(运行时.original_TavernHelper_generate_ACU, 原始生成);
});

test('规划开始回调异常时也恢复锁与原始生成器，不留下永久兼容层', async () => {
  const { 根窗口, 运行时, 原始生成 } = 建数据库运行时(async (scope, 参数) =>
    scope.original_TavernHelper_generate_ACU(参数),
  );

  await assert.rejects(
    经数据库剧情规划生成(
      { user_input: '启动异常', should_stream: true },
      {
        启用: true,
        根窗口,
        规划开始: () => {
          throw new Error('测试启动异常');
        },
        调用正文: async () => '不应生成',
      },
    ),
    /测试启动异常/,
  );
  assert.strictEqual(运行时.original_TavernHelper_generate_ACU, 原始生成);
  assert.equal('__rqgy_database_plot_planning_lock__' in 运行时, false);
});

test('数据库运行时不存在时不做私有探测写入，直接走原正文', async () => {
  const 调用 = [];
  const 根窗口 = { frames: [] };
  根窗口.parent = 根窗口;
  根窗口.top = 根窗口;

  const 结果 = await 经数据库剧情规划生成(
    { user_input: '普通行动', should_stream: true },
    {
      启用: true,
      根窗口,
      调用正文: async 参数 => {
        调用.push(参数);
        return '直接正文';
      },
    },
  );

  assert.equal(结果, '直接正文');
  assert.equal(调用.length, 1);
  assert.equal(调用[0].user_input, '普通行动');
});

test('主回合接线：首稿仅在数据库时间线就绪时启用规划桥，取消优先中止规划，稽查重写明确绕过重复规划', () => {
  const engine = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');
  assert.match(engine, /经数据库剧情规划生成/);
  assert.match(engine, /取消当前数据库剧情规划/);
  assert.match(engine, /本轮数据库时间线可用\s*=\s*await 等待数据库时间线就绪\(\)/);
  assert.match(engine, /启用数据库规划:\s*本轮数据库已安装\s*&&\s*本轮数据库时间线可用/);
  assert.match(engine, /数据库正在进行时间召回/);
  assert.match(engine, /automatic_trigger:\s*true/, '稽查重写不是新用户行动，不能再次触发时间召回');
});
