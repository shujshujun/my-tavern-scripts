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

  const 提交段 = 回合源.slice(回合源.indexOf('await 排队父亲通话整表写'), 回合源.indexOf('await 记录数据库回合'));
  assert.ok((提交段.match(/排队父亲通话整表写/g) ?? []).length >= 3);
  assert.match(提交段, /const 提交最终整表 = \(\) =>\s*排队父亲通话整表写/);
  assert.match(提交段, /if \(选项\.已持MVU操作租约\) await 提交最终整表\(\);\s*else await 排队MVU操作\(提交最终整表\)/);
  assert.match(提交段, /读最近有效stat\(\)/);
  assert.match(提交段, /合并最新父亲通话/);
  assert.match(提交段, /Mvu\.replaceMvuData/);
});

test('父亲通话结束只向下一正文写抽象心绪，不拼接通话前四句原文', () => {
  const 开始 = index源.indexOf("eventOn('人妻公寓:父亲通话结束'");
  const 结束 = index源.indexOf('// ─────────────────────────────────────────────', 开始);
  const 段 = index源.slice(开始, 结束);
  assert.doesNotMatch(段, /记录\s*\.slice\(0,\s*4\)|内容大意:\$\{摘要/);
  assert.match(段, /刚挂了爸的电话|刚挂父亲电话/);
});
