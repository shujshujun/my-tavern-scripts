/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const { 合并最新父亲通话, 排队父亲通话整表写 } = await import('../../src/人妻公寓/脚本/游戏逻辑/父亲通话写租约.ts');
const index源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/index.ts', 'utf8');
const 回合源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts', 'utf8');

test('正文候选提交前保留并发写入的最新父亲通话整表', () => {
  const 候选 = { 系统: { _父亲通话: { 标识: 'call', 记录: [{ 谁: '父', 文: '旧句' }] } } };
  const 最新 = {
    系统: {
      _父亲通话: {
        标识: 'call',
        记录: [
          { 谁: '父', 文: '旧句' },
          { 谁: '我', 文: '新答复' },
        ],
      },
    },
  };
  合并最新父亲通话(候选, 最新);
  assert.deepEqual(
    候选.系统._父亲通话.记录.map(x => x.文),
    ['旧句', '新答复'],
  );
});

test('父亲通话写与正文最终整表提交严格串行，后到写不能穿过提交窗口', async () => {
  const 顺序 = [];
  let 放行;
  const 门 = new Promise(resolve => {
    放行 = resolve;
  });
  const 正文提交 = 排队父亲通话整表写(async () => {
    顺序.push('正文开始');
    await 门;
    顺序.push('正文结束');
  });
  const 父亲回复 = 排队父亲通话整表写(async () => {
    顺序.push('父亲写入');
  });
  await Promise.resolve();
  assert.deepEqual(顺序, ['正文开始']);
  放行();
  await Promise.all([正文提交, 父亲回复]);
  assert.deepEqual(顺序, ['正文开始', '正文结束', '父亲写入']);

  const 提交段 = 回合源.slice(回合源.indexOf('await 排队父亲通话整表写'), 回合源.indexOf('const CG亲密'));
  assert.ok((提交段.match(/排队父亲通话整表写/g) ?? []).length >= 3);
  assert.match(提交段, /const 提交最终整表 = \(\) =>\s*排队父亲通话整表写/);
  assert.match(提交段, /if \(选项\.已持MVU操作租约\) await 提交最终整表\(\);\s*else await 排队MVU操作\(提交最终整表\)/);
  assert.match(提交段, /读最近有效stat\(\)/);
  assert.match(提交段, /合并最新父亲通话/);
  assert.match(提交段, /Mvu\.replaceMvuData/);
});

test('父亲通话结束事务不再把来电回流/线索事件写进待发送事件，仍原子归档线索并清锁', () => {
  const 开始 = index源.indexOf("eventOn('人妻公寓:父亲通话结束'");
  const 结束 = index源.indexOf('// ─────────────────────────────────────────────', 开始);
  const 段 = index源.slice(开始, 结束);
  assert.doesNotMatch(段, /记录\s*\.slice\(0,\s*4\)|内容大意:\$\{摘要/);
  assert.doesNotMatch(段, /【来电回流】/, '不再向 _待发送事件 写入来电回流');
  assert.doesNotMatch(段, /线索\?\.事件/, '线索.事件 不再排进 _待发送事件');
  assert.match(段, /const 线索 = 母亲来电线索\(data\)/, '仍调用母亲来电线索推进碎片进度/镜像/toast');
  assert.match(段, /data\.系统\._父亲通话 = 空父亲通话\(\)/, '仍与玩法归档同原子清空 _父亲通话');
  assert.match(段, /线索\?\.提示/, '线索.提示 仍是完整可见的玩法反馈');
});

test('父亲回复提交必须校验生成时冻结的硬事实，危机原地升级后丢弃旧回复并立即重试', () => {
  const 父亲通话源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts', 'utf8');
  const 推进段 = 父亲通话源.slice(
    父亲通话源.indexOf('async function 推进父亲回复'),
    父亲通话源.indexOf('export async function 通话应答'),
  );
  assert.match(推进段, /const 回复事实版本 = 父亲回复事实版本\(通话\)/, '生成前必须冻结影响父亲台词的硬事实');
  assert.match(
    推进段,
    /父亲回复事实版本\(最新\) !== 回复事实版本/,
    '提交时必须拒绝报表、主题、紧急或通牒已经变化的旧回复',
  );
  assert.match(推进段, /需要按新事实重试 = true/, '事实变化但待回复仍有效时必须保留并标记重试');
  assert.match(推进段, /if \(需要按新事实重试\) void 推进父亲回复/, '释放旧生成键后必须立刻按新事实重新生成');
});

test('父亲收尾先触发核心结束事件，数据库同步为后置非阻塞副作用', () => {
  const 父亲通话源 = readFileSync('src/人妻公寓/脚本/游戏逻辑/手机/交互/父亲通话.ts', 'utf8');
  const 完成段 = 父亲通话源.slice(
    父亲通话源.indexOf('async function 完成父亲通话'),
    父亲通话源.indexOf('export async function 结束通话'),
  );
  const 结束事件位 = 完成段.indexOf("eventEmit('人妻公寓:父亲通话结束'");
  // 注释里也会出现“同步社交轨迹”，必须按真实调用定位，避免先匹配到结束事件前的注释文本。
  const 数据库位 = 完成段.indexOf('void 同步社交轨迹(');
  assert.ok(结束事件位 >= 0 && 数据库位 > 结束事件位, '核心结束事件必须先于数据库同步触发');
  assert.match(完成段, /void 同步社交轨迹\(/, '数据库同步必须是 fire-and-forget，不得 await');
  assert.doesNotMatch(完成段, /await 同步社交轨迹/, '数据库失败不得阻塞或延长通话收尾');
  assert.match(完成段, /事件键: `RQP-来电-\$\{最新\.标识\}`/, '数据库事件键保持幂等');
  assert.match(完成段, /写入结果\s*=>\s*\{[\s\S]{0,120}写入结果 === '失败'/, '三态结果只把真正失败记为不可用');
  assert.doesNotMatch(完成段, /if \(!已写\)/, '字符串三态不得再按旧布尔值判断，否则“失败”也会被当成真');
  assert.match(完成段, /console\.(info|warn)\([^\n]*长期记忆/, '数据库失败只记录日志，不弹“电话没保存完整”');
});
