/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const require = createRequire(import.meta.url);
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
require('ts-node/register/transpile-only');

// 纯状态机模块：直接驱动，不依赖 SillyTavern 全局。owner 语义（2026-08-09 复审）：
// 开始票序号即租约 owner，认领返回 owner；正常释放按 owner 核对，旧 owner 对新票无效；
// 停止/切聊天/切分支/删楼走明确的全局作废入口。
const {
  正文租约生效中,
  读当前租约owner,
  读原生正文开始票,
  读原生正文令牌,
  登记原生正文开始票,
  认领正文租约,
  释放正文租约,
  作废原生正文租约,
  等待票匹配结束事件,
  租约owner仍有效,
  重置原生正文租约,
} = require('../../src/人妻公寓/脚本/游戏逻辑/原生正文租约.ts');
const {
  取得前台生成租约,
  取得手机生成租约,
  前台生成租约持有中,
  手机生成租约持有中,
  清空生成租约,
} = require('../../src/人妻公寓/脚本/游戏逻辑/生成通道互斥.ts');

const Index源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/index.ts', import.meta.url), 'utf8');

const 用户消息 = { id: 'user-12', name: '沈翊' };
const 建票 = (覆盖 = {}) => {
  const 票 = 登记原生正文开始票({
    聊天ID: 'chat-1',
    时间线世代: 7,
    开始类型: 'normal',
    用户楼层: 12,
    用户消息引用: 用户消息,
    ...覆盖,
  });
  assert.ok(票, '空闲共享槽时登记原生开始票必须成功');
  return 票;
};

const 认领当前票 = (覆盖 = {}) => {
  const 票 = 读原生正文开始票();
  assert.ok(票, '需要先登记原生开始票');
  return 认领正文租约({
    序号: 票.序号,
    聊天ID: 票.聊天ID,
    时间线世代: 票.时间线世代,
    用户楼层: 票.用户楼层,
    用户消息引用: 票.用户消息引用,
    ...覆盖,
  });
};

// ─────────────────────────────────────────────
// 行为测试：直接驱动纯状态机
// ─────────────────────────────────────────────

test('无宿主开始票的手机/数据库/隔离 PROMPT_READY 不能认领正文租约，失败/结束后时间门仍开放', () => {
  重置原生正文租约();
  const 令牌前 = 读原生正文令牌();
  // 模拟手机/数据库/隔离等无宿主 GENERATION_STARTED 的辅助请求：没有可认领的票。
  const 认领结果 = 认领正文租约({
    序号: 999,
    聊天ID: 'chat-1',
    时间线世代: 7,
    用户楼层: 12,
    用户消息引用: { id: 'user-12' },
  });
  assert.equal(认领结果, null, '无票认领必须拒绝，不得返回貌似有效的令牌');
  assert.equal(正文租约生效中(), false, '不得建立正文租约');
  assert.equal(读原生正文开始票(), null, '不得留下开始票');
  assert.equal(读当前租约owner(), null);
  assert.equal(读原生正文令牌(), 令牌前, '辅助请求不得改正文令牌/代数');
  // 失败/结束后时间门仍开放：小憩/时间推进查询不受阻塞。
  assert.equal(正文租约生效中(), false);
});

test('normal 开始票绑定聊天/世代/user 楼和对象引用后才能认领；认领后阻塞时间动作', () => {
  重置原生正文租约();
  const 票 = 建票();
  assert.equal(票.开始类型, 'normal');
  assert.equal(票.预期助手楼层, 13, '预期助手楼 = 用户楼层 + 1');
  assert.equal(正文租约生效中(), false, '等待 prompt 阶段不算正文结算，小憩/时间推进不受阻塞');
  assert.equal(读当前租约owner(), null, '未认领无 owner');

  // 错聊天、错世代、错用户楼层、错 user 消息引用、错序号都不能认领，且不改变代数。
  assert.equal(
    认领正文租约({ 序号: 票.序号, 聊天ID: 'chat-2', 时间线世代: 7, 用户楼层: 12, 用户消息引用: 用户消息 }),
    null,
    '错聊天不得认领',
  );
  assert.equal(
    认领正文租约({ 序号: 票.序号, 聊天ID: 'chat-1', 时间线世代: 8, 用户楼层: 12, 用户消息引用: 用户消息 }),
    null,
    '错时间线世代不得认领',
  );
  assert.equal(
    认领正文租约({ 序号: 票.序号, 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 13, 用户消息引用: 用户消息 }),
    null,
    '错用户楼层不得认领',
  );
  assert.equal(
    认领正文租约({ 序号: 票.序号, 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 12, 用户消息引用: { id: 'other' } }),
    null,
    '错用户消息对象引用不得认领',
  );
  assert.equal(
    认领正文租约({ 序号: 999, 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 12, 用户消息引用: 用户消息 }),
    null,
    '序号不符（票已被替换）不得认领',
  );
  assert.equal(正文租约生效中(), false, '失败认领不得建立租约');
  assert.equal(读原生正文令牌(), 0, '失败认领不得递增代数');

  const owner = 认领当前票();
  assert.equal(owner, 票.序号, '认领返回 owner = 票序号');
  assert.equal(正文租约生效中(), true, '认领后正文租约生效 → 小憩/时间推进被阻塞');
  assert.equal(读当前租约owner(), owner);
  assert.ok(读原生正文令牌() > 0, '认领递增本轮令牌作废旧轮回调身份');

  // 已认领后再次认领必须拒绝，不得重复递增代数。
  const 令牌前 = 读原生正文令牌();
  assert.equal(认领当前票(), null, '已认领后不得再次认领');
  assert.equal(读原生正文令牌(), 令牌前, '重复认领不得改代数');
});

test('旧 owner 不能释放或作废新 owner 的租约', () => {
  重置原生正文租约();
  建票({ 用户楼层: 10 });
  const owner1 = 认领当前票();
  assert.ok(owner1 !== null);
  作废原生正文租约(); // 切聊天/停止/切分支作废旧轮
  建票({ 用户楼层: 11 });
  const owner2 = 认领当前票();
  assert.ok(owner2 !== null && owner2 !== owner1, '新轮 owner 必须与旧轮不同');

  assert.equal(释放正文租约(owner1), false, '旧 owner 释放新票必须无效果');
  assert.equal(正文租约生效中(), true, '新租约不得被旧 owner 清掉');
  assert.equal(读当前租约owner(), owner2);
  assert.equal(读原生正文开始票()?.用户楼层, 11);
  // 旧 owner 的异步身份校验对新票也无效。
  assert.equal(
    租约owner仍有效(owner1, { 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 11, 用户消息引用: 用户消息 }),
    false,
    '旧 owner 不得通过新租约身份校验',
  );
  // 只有当前 owner 能释放。
  assert.equal(释放正文租约(owner2), true);
  assert.equal(正文租约生效中(), false);
});

test('API 失败（GENERATION_ENDED 无预期助手楼）作废释放租约并递增令牌；时间门重新开放', () => {
  重置原生正文租约();
  建票();
  认领当前票();
  assert.equal(正文租约生效中(), true);
  const 令牌前 = 读原生正文令牌();
  // 没有助手楼就不会有 MVU 正文结算：失败结束判定走全局作废入口，作废在途回调身份。
  作废原生正文租约();
  assert.equal(正文租约生效中(), false, '失败后租约必须释放');
  assert.equal(读原生正文开始票(), null);
  assert.equal(读当前租约owner(), null);
  assert.ok(读原生正文令牌() > 令牌前, '作废必须递增令牌以作废在途回调身份');
});

test('成功正文：GENERATION_ENDED 已落预期助手楼时不提前解锁，匹配 VARIABLE_UPDATE_ENDED 结算才释放', () => {
  重置原生正文租约();
  建票();
  const owner = 认领当前票();
  assert.ok(owner !== null);
  const 令牌前 = 读原生正文令牌();
  // 成功助手楼已落下：GENERATION_ENDED 不触碰租约（不提前释放，由 index.ts 源契约覆盖），
  // 状态机继续保持正文结算阶段，时间动作仍被阻塞。
  assert.equal(正文租约生效中(), true, '精确助手已落楼时不提前解锁');
  assert.equal(读原生正文令牌(), 令牌前, '成功结束不得递增令牌');
  // 匹配的 VARIABLE_UPDATE_ENDED 结算完成 → 按 owner 释放，时间动作恢复可用。
  assert.equal(释放正文租约(owner), true, '匹配 MVU 结算按 owner 释放');
  assert.equal(正文租约生效中(), false, '结算释放后小憩/时间推进恢复可用');
  assert.equal(读原生正文令牌(), 令牌前, '结算释放不得递增令牌（同轮迟到回调仍可识别）');
});

test('正文租约生效期间后到的辅助 prompt 不覆盖令牌、不释放租约', () => {
  重置原生正文租约();
  建票();
  认领当前票();
  const owner = 读当前租约owner();
  const 令牌前 = 读原生正文令牌();
  // 辅助 PROMPT_READY 在租约期间到达：无等待票可认领（阶段已是正文结算）。
  assert.equal(认领当前票(), null, '租约期间辅助 prompt 不得认领');
  assert.equal(正文租约生效中(), true, '不得清掉正文租约');
  assert.equal(读当前租约owner(), owner, '不得覆盖 owner');
  assert.equal(读原生正文令牌(), 令牌前, '不得改正文令牌');
  // 旧 owner 之外的人（模拟辅助请求）更无法释放租约。
  assert.equal(释放正文租约(owner + 100), false);
  assert.equal(正文租约生效中(), true);
});

test('隔离事件期间认证原生正文被拒绝并按 owner 释放，隔离辅助 prompt 仍无法建租约', () => {
  重置原生正文租约();
  // 隔离辅助 prompt（无宿主开始票）：不能建租约，也不能改代数。
  assert.equal(
    认领正文租约({ 序号: 1, 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 12, 用户消息引用: 用户消息 }),
    null,
  );
  assert.equal(正文租约生效中(), false);
  // 认证原生正文在隔离事件运行时被明确拒绝 → 按 owner 释放这笔租约，隔离事务不受影响。
  建票();
  const owner = 认领当前票();
  assert.ok(owner !== null);
  assert.equal(正文租约生效中(), true);
  assert.equal(释放正文租约(owner), true, '被拒认证原生正文的租约必须释放');
  assert.equal(正文租约生效中(), false);
  // 释放后隔离辅助 prompt 仍不能误认领。
  assert.equal(
    认领正文租约({ 序号: owner, 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 12, 用户消息引用: 用户消息 }),
    null,
  );
  assert.equal(正文租约生效中(), false);
});

test('切聊天/切分支/停止作废旧票后，旧轮的身份与结束事件都不能消费新租约', () => {
  重置原生正文租约();
  建票({ 用户楼层: 10 });
  const 旧owner = 认领当前票();
  assert.ok(旧owner !== null);
  const 旧令牌 = 读原生正文令牌();
  作废原生正文租约(); // GENERATION_STOPPED / 排队宿主原生时间线切换 / CHAT_CHANGED
  建票({ 用户楼层: 11 });
  const 新owner = 认领当前票();
  assert.ok(新owner !== null);
  assert.ok(新owner > 旧owner, '新轮 owner 必须高于旧轮');
  assert.ok(读原生正文令牌() > 旧令牌, '新轮令牌必须高于旧轮');

  // 旧轮身份校验、旧轮释放均对新票无效果。
  assert.equal(
    租约owner仍有效(旧owner, { 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 11, 用户消息引用: 用户消息 }),
    false,
    '旧 owner 不得通过新租约身份校验',
  );
  assert.equal(释放正文租约(旧owner), false, '旧 owner 不得释放新票');
  assert.equal(正文租约生效中(), true);
  assert.equal(读当前租约owner(), 新owner);
  assert.equal(读原生正文开始票()?.用户楼层, 11);
  // 新票的预期助手楼已随用户楼层变更：旧票的预期助手楼引用不再生效。
  assert.equal(读原生正文开始票()?.预期助手楼层, 12);
});

test('租约身份校验：错聊天/错世代/错用户楼层/错用户引用都不能通过', () => {
  重置原生正文租约();
  建票();
  const owner = 认领当前票();
  assert.ok(owner !== null);
  assert.equal(
    租约owner仍有效(owner, { 聊天ID: 'chat-2', 时间线世代: 7, 用户楼层: 12, 用户消息引用: 用户消息 }),
    false,
    '错聊天不得通过',
  );
  assert.equal(
    租约owner仍有效(owner, { 聊天ID: 'chat-1', 时间线世代: 8, 用户楼层: 12, 用户消息引用: 用户消息 }),
    false,
    '错世代不得通过',
  );
  assert.equal(
    租约owner仍有效(owner, { 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 11, 用户消息引用: 用户消息 }),
    false,
    '错用户楼层不得通过',
  );
  assert.equal(
    租约owner仍有效(owner, { 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 12, 用户消息引用: { id: 'x' } }),
    false,
    '错用户消息引用不得通过',
  );
  assert.equal(
    租约owner仍有效(owner, { 聊天ID: 'chat-1', 时间线世代: 7, 用户楼层: 12, 用户消息引用: 用户消息 }),
    true,
    '全部相符的当前 owner 才通过',
  );
});

test('等待票匹配结束事件：只有消息数 === 预期助手楼层的精确结束才匹配本等待票', () => {
  重置原生正文租约();
  const 票 = 建票(); // user 12 → 预期助手楼层 13
  assert.equal(票.用户楼层, 12);
  assert.equal(票.预期助手楼层, 13);
  // 旧结束事件 messageCount = 12（= 用户楼层，不是预期助手楼层）：不得作废新票。
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 12), false, '旧结束事件 messageCount=12 不得匹配等待票');
  assert.equal(读原生正文开始票()?.序号, 票.序号, '新票不得被旧结束事件作废');
  // 等待票自己的结束事件 messageCount = 13（= 预期助手楼层 = user 尾楼时的 chat.length）：匹配。
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 13), true, '本票结束事件 messageCount=13 才匹配');
  // 缺失/非整数/大于预期：都不能证明属于本票，保守不清票。
  assert.equal(等待票匹配结束事件(读原生正文开始票(), undefined), false, '缺消息数不得匹配');
  assert.equal(等待票匹配结束事件(读原生正文开始票(), '13'), false, '字符串非整数不得匹配');
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 13.5), false, '小数非整数不得匹配');
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 14), false, '大于预期值不得匹配');
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 0), false, '0 不得匹配');
  assert.equal(等待票匹配结束事件(null, 13), false, '无票不得匹配');
  // 等待阶段不阻塞正文租约：等待票不建立正文锁，时间动作不受阻塞。
  assert.equal(正文租约生效中(), false, '等待阶段不得阻塞时间动作');
  assert.equal(读当前租约owner(), null);
  // 下一张真实 GENERATION_STARTED 仍可替换旧等待票；旧票/旧结束事件对其同样无效。
  建票({ 用户楼层: 20 }); // → 预期助手楼层 21
  assert.equal(读原生正文开始票()?.用户楼层, 20, '新开始票替换旧等待票');
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 13), false, '旧票的结束事件不得匹配新票');
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 20), false, '新票的 user 楼层值不得匹配新票');
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 21), true, '新票自己的结束事件 21 才匹配');
  // 已认领（进入正文结算）的租约不属于等待票匹配判据，由正文结算分支的失败/成功判据处理。
  assert.equal(认领当前票(), 读原生正文开始票()?.序号);
  assert.equal(等待票匹配结束事件(读原生正文开始票(), 21), false, '已认领租约不得被等待票判据匹配');
});

test('GENERATION_ENDED 等待分支用等待票匹配判据包裹作废；不匹配的旧结束事件不清票', () => {
  const 结束段 = Index源.slice(
    Index源.indexOf('eventOn(tavern_events.GENERATION_ENDED'),
    Index源.indexOf('function 排队宿主原生时间线切换'),
  );
  // 等待分支必须调用纯判据，而非无条件作废。
  assert.match(结束段, /等待票匹配结束事件\(原生票, 消息数\)/, '等待分支必须调用等待票匹配判据');
  // 等待分支内作废必须被判据包裹（不匹配时 return 不清票，也不落入正文结算失败分支）。
  const 等待分支 = 结束段.slice(
    结束段.indexOf("原生票.阶段 === '等待prompt'"),
    结束段.indexOf('if (Number.isInteger(消息数))'),
  );
  assert.match(等待分支, /等待票匹配结束事件\(原生票, 消息数\)/, '等待分支必须用判据包裹作废');
  assert.match(等待分支, /作废原生正文租约\(\)/, '匹配时才清票');
  assert.match(等待分支, /return/, '不匹配的结束事件不得落入正文结算失败分支');
  // 判据在 原生正文租约.ts 中实现，是可直接测试的纯函数。
  const 租约源 = readFileSync(new URL('../../src/人妻公寓/脚本/游戏逻辑/原生正文租约.ts', import.meta.url), 'utf8');
  assert.match(租约源, /export function 等待票匹配结束事件/, '等待票匹配判据必须是租约模块可测试纯函数');
});

test('重置原生正文租约：热挂载/重入后令牌与序号归零、无租约', () => {
  重置原生正文租约();
  建票();
  认领当前票();
  assert.equal(正文租约生效中(), true);
  重置原生正文租约();
  assert.equal(正文租约生效中(), false);
  assert.equal(读原生正文开始票(), null);
  assert.equal(读当前租约owner(), null);
  assert.equal(读原生正文令牌(), 0);
});

// ─────────────────────────────────────────────
// 共享前台生成槽（生成通道互斥）接入：登记/释放/作废/重置 与手机 token 的双向互斥
// ─────────────────────────────────────────────

test('C1 手机 token 在途时登记原生票返回 null，且不改变手机 token', () => {
  清空生成租约();
  重置原生正文租约();
  const 手机 = 取得手机生成租约();
  assert.ok(手机);
  const 票 = 登记原生正文开始票({
    聊天ID: 'chat-1',
    时间线世代: 7,
    开始类型: 'normal',
    用户楼层: 12,
    用户消息引用: 用户消息,
  });
  assert.equal(票, null, '手机在途时登记原生票必须失败');
  assert.equal(手机生成租约持有中(), true, '失败登记不得改变手机 token');
  assert.equal(读原生正文开始票(), null, '失败登记不得留下开始票');
  手机.释放();
  assert.equal(手机生成租约持有中(), false);
});

test('C2 空闲登记返回票并持有共享前台 token；此时手机取得失败', () => {
  清空生成租约();
  重置原生正文租约();
  const 票 = 建票();
  assert.ok(票);
  assert.equal(前台生成租约持有中(), true, '登记后必须持有共享前台 token');
  assert.equal(取得手机生成租约(), null, '原生占槽时手机取得必须失败');
  assert.equal(手机生成租约持有中(), false);
});

test('C3 错 owner 释放返回 false 且共享 token 仍在；正确 owner 释放后 token 空闲', () => {
  清空生成租约();
  重置原生正文租约();
  建票();
  const owner = 认领当前票();
  assert.ok(owner !== null);
  assert.equal(前台生成租约持有中(), true);
  assert.equal(释放正文租约(owner + 100), false, '错 owner 释放必须失败');
  assert.equal(前台生成租约持有中(), true, '错 owner 释放不得释放共享 token');
  assert.equal(读当前租约owner(), owner, '错 owner 释放不得清新票');
  assert.equal(释放正文租约(owner), true, '正确 owner 释放成功');
  assert.equal(前台生成租约持有中(), false, '释放后共享 token 空闲');
});

test('C4 作废原生正文租约 与 重置原生正文租约 都幂等释放共享前台 token', () => {
  清空生成租约();
  重置原生正文租约();
  建票();
  assert.equal(前台生成租约持有中(), true);
  作废原生正文租约();
  assert.equal(前台生成租约持有中(), false, '作废必须释放共享 token');
  // 重置（热重入）同样释放共享 token。
  清空生成租约();
  建票();
  assert.equal(前台生成租约持有中(), true);
  重置原生正文租约();
  assert.equal(前台生成租约持有中(), false, '重置必须释放共享 token');
  // 释放后手机可正常取得：共享槽回到空闲。
  const 手机 = 取得手机生成租约();
  assert.ok(手机, '共享 token 释放后手机才可取得');
  手机.释放();
});

test('C5 等待票与已认领票都持有共享 token；新票替换旧等待票后旧 owner 不清新票、不释放 token', () => {
  清空生成租约();
  重置原生正文租约();
  建票({ 用户楼层: 10 }); // 等待票 A
  assert.equal(前台生成租约持有中(), true, '等待票也持有共享 token');
  const 旧owner = 认领当前票();
  assert.ok(旧owner !== null);
  // 新登记替换旧票并转移共享 token：token 仍持有，票换成新票。
  建票({ 用户楼层: 11 }); // 等待票 B
  assert.equal(前台生成租约持有中(), true, '新票必须继续持有共享 token');
  assert.equal(读原生正文开始票()?.用户楼层, 11, '新登记必须替换旧票');
  assert.equal(释放正文租约(旧owner), false, '旧 owner 不得清新票');
  assert.equal(前台生成租约持有中(), true, '旧 owner 释放不得释放共享 token');
  const 新owner = 认领当前票();
  assert.ok(新owner !== null && 新owner !== 旧owner, '新轮 owner 必须与旧轮不同');
  // 已认领票（正文结算）仍持有共享 token；错 owner 释放不影响 token。
  assert.equal(前台生成租约持有中(), true, '已认领票同样持有共享 token');
  assert.equal(释放正文租约(旧owner), false);
  assert.equal(前台生成租约持有中(), true);
  assert.equal(释放正文租约(新owner), true);
  assert.equal(前台生成租约持有中(), false, '正确 owner 释放后共享 token 空闲');
});

// ─────────────────────────────────────────────
// 接线源契约（宿主事件无法在 Node 内运行，用紧范围断言补足宿主接线）
// ─────────────────────────────────────────────

test('固定 0 楼主回合不登记原生正文租约，仍由 回合进行中() 管理', () => {
  const 开始位置 = Index源.lastIndexOf('tavern_events.GENERATION_STARTED');
  const 开始段 = Index源.slice(开始位置, Index源.indexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY', 开始位置));
  const 回合门 = 开始段.indexOf('if (回合进行中()) return');
  const 登记 = 开始段.indexOf('登记原生正文开始票(');
  assert.ok(回合门 >= 0 && 登记 >= 0, 'GENERATION_STARTED 登记缺少回合门或登记调用');
  assert.ok(回合门 < 登记, '固定 0 楼主回合必须在登记开始票之前返回');
  assert.ok(开始段.includes("类型 !== 'normal'"), '只登记 normal 原生正文，不扩张 regenerate/swipe/continue');
  assert.ok(开始段.includes('选项?.automatic_trigger'), '自动后台触发不得登记');
  assert.ok(开始段.includes('!末楼.is_user'), '兼容广播/末楼非 user 不得登记');
});

test('GENERATION_STARTED 登记前先查数据库迟到租约；忙时先安排精确停止、再广播失败、不得登记', () => {
  const 开始位置 = Index源.lastIndexOf('tavern_events.GENERATION_STARTED');
  const 开始段 = Index源.slice(开始位置, Index源.indexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY', 开始位置));
  const 数据库检查 = 开始段.indexOf('全局数据库AI租约.在结算()');
  const 登记 = 开始段.indexOf('登记原生正文开始票(');
  assert.ok(数据库检查 >= 0 && 登记 > 数据库检查, '数据库迟到租约必须同步先于登记检查');
  // 登记失败的正常不变量是“无票”：忙时必须先安排精确停止、再广播失败提示，提示是可选呈现。
  const 停止位置 = 开始段.indexOf('原生拒绝停止(楼层, 末楼)', 数据库检查);
  const 失败位置 = 开始段.indexOf("eventEmit('人妻公寓:回合失败'", 数据库检查);
  assert.ok(停止位置 > 数据库检查, '数据库忙时必须按精确身份停止原生请求');
  assert.ok(失败位置 > 停止位置, '数据库忙时必须先安排停止、再广播失败：监听器异常不得阻断硬收口');
  assert.ok(失败位置 < 登记, '数据库忙时广播失败后直接 return，不得登记开始票');
  assert.match(开始段.slice(数据库检查, 登记), /return/, '数据库忙时不得登记开始票');
});

test('登记返回 null（共享槽冲突）时先安排精确停止、再广播失败；存在任何原生票即不得停止', () => {
  const 开始位置 = Index源.lastIndexOf('tavern_events.GENERATION_STARTED');
  const 开始段 = Index源.slice(开始位置, Index源.indexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY', 开始位置));
  const 登记 = 开始段.indexOf('登记原生正文开始票(');
  const 失败分支 = 开始段.slice(登记);
  assert.match(失败分支, /if \(!原生票\)/, '登记结果必须被消费');
  // 登记失败（共享槽冲突）先安排停止、再广播失败：广播是可选呈现，不得阻断硬收口。
  const 冲突停止位置 = 失败分支.indexOf('原生拒绝停止(楼层, 末楼)');
  const 冲突失败位置 = 失败分支.indexOf("eventEmit('人妻公寓:回合失败'");
  assert.ok(冲突停止位置 >= 0, '登记失败按精确身份延迟停止');
  assert.ok(冲突失败位置 > 冲突停止位置, '共享冲突分支必须先安排停止、再广播失败');
  // 原生拒绝停止 必须用聊天/世代/楼层/对象引用与“当前无任何原生票”保护 stopGeneration。
  const 停止起 = Index源.lastIndexOf('const 原生拒绝停止 = ');
  assert.ok(停止起 >= 0, '原生拒绝停止 助手必须存在');
  const 停止段 = Index源.slice(停止起, Index源.indexOf('\n  eventOn(', 停止起));
  assert.match(停止段, /当前聊天ID\(\) !== 聊天ID \|\| 当前时间线切换世代\(\) !== 时间线世代/, '切聊/切分支不得停止');
  assert.match(停止段, /当前楼层\(\) !== 楼层 \|\| SillyTavern\.chat\?\.\[楼层\] !== 用户消息引用/, 'user 引用变化不得停止');
  // 登记失败的正常不变量是“无票”：延迟执行时存在任何原生票（后来请求/不可证明归属）即不得停止。
  assert.match(停止段, /读原生正文开始票\(\) !== null/, '存在任何原生票即不得停止稍后请求');
  assert.doesNotMatch(停止段, /拒绝时票/, '不得用“仍等于拒绝时票”的无新票守卫');
  assert.match(停止段, /SillyTavern\.stopGeneration\(\)/, '最终按精确身份停止本笔原生请求');
});

test('PROMPT_READY：无票辅助请求先返回，文本标记不再旁路，认证后才进冲突门', () => {
  const prompt起 = Index源.lastIndexOf('tavern_events.CHAT_COMPLETION_PROMPT_READY');
  const prompt止 = Index源.indexOf('Mvu.events.VARIABLE_UPDATE_ENDED', prompt起);
  assert.ok(prompt起 >= 0 && prompt止 > prompt起);
  const prompt段 = Index源.slice(prompt起, prompt止);

  const 认领 = prompt段.indexOf('认领正文租约(');
  const 票检查 = prompt段.indexOf("原生票.阶段 !== '等待prompt'");
  const 楼层检查 = prompt段.indexOf('当前末楼层 !== 原生票.用户楼层');
  const 时间锁 = prompt段.indexOf('if (_时间推进中)');
  const 隔离拒绝 = prompt段.indexOf('if (隔离事件进行中())');
  assert.ok(认领 >= 0 && 票检查 >= 0 && 楼层检查 >= 0, '认领正文租约必须在身份与楼层检查之后');
  assert.ok(票检查 < 认领 && 楼层检查 < 认领, '无票/楼层不符的辅助请求不得进入认领');
  // 冲突门必须在认证（认领正文租约）之后，不得再当身份旁路。
  assert.ok(时间锁 > 认领 && 隔离拒绝 > 认领, '时间推进/隔离运行态拒绝必须在认证之后');
  // 认领按 owner 返回，票被替换/已认领时拒绝。
  assert.match(prompt段, /const 本次原生轮owner = 认领正文租约\(/);
  assert.match(prompt段, /if \(本次原生轮owner === null\) return/);
  assert.match(prompt段, /租约owner仍有效\(本次原生轮owner, \{/);
  // 隔离事件进行中() 不得再与文本标记并列作为辅助请求身份旁路。
  assert.doesNotMatch(
    prompt段.slice(0, 认领),
    /隔离事件进行中\(\)\s*\|\|\s*请求提示文本\.includes/,
    '隔离事件进行中() 不得再与文本标记并列旁路',
  );
  // 文本标记保留为无票辅助请求的防御证据，且位于正文认领之前。
  const 标记位置 = prompt段.indexOf('请求提示文本.includes(手机生成请求标记)');
  const 隔离标记位置 = prompt段.indexOf('请求提示文本.includes(隔离事件请求标记)');
  assert.ok(标记位置 >= 0 && 隔离标记位置 >= 0, '文本标记防御保留');
  assert.ok(标记位置 < 认领 && 隔离标记位置 < 认领, '短生成不得进入正文认领');
  // 冲突门拒绝必须按本轮 owner 释放，不能遗留锁。
  const 时间拒绝段 = prompt段.slice(时间锁, prompt段.indexOf('\n      }\n', 时间锁));
  assert.match(时间拒绝段, /释放正文租约\(本次原生轮owner\)/, '时间推进拒绝必须按 owner 释放租约');
  const 隔离拒绝段 = prompt段.slice(隔离拒绝, prompt段.indexOf('\n      }\n', 隔离拒绝));
  assert.match(隔离拒绝段, /释放正文租约\(本次原生轮owner\)/, '隔离运行态拒绝必须按 owner 释放租约');
});

test('GENERATION_STOPPED 忽略非空字符串生成 ID，原生无参停止才作废租约', () => {
  const 停止段 = Index源.slice(
    Index源.indexOf('eventOn(tavern_events.GENERATION_STOPPED'),
    Index源.indexOf('eventOn(tavern_events.GENERATION_ENDED'),
  );
  assert.match(停止段, /\(生成ID\?: unknown\)/, '处理器必须接收可选生成 ID');
  assert.match(停止段, /typeof 生成ID === 'string' && 生成ID.length > 0/, '辅助 generate/generateRaw 停止必须忽略');
  assert.match(停止段, /if \(回合进行中\(\)\) return/);
  assert.match(停止段, /if \(!读原生正文开始票\(\)\) return/, '无开始票的辅助停止不得误清真实正文租约');
  assert.match(停止段, /作废原生正文租约\(\)/);
});

test('GENERATION_ENDED 用 messageCount 精确判定：失败才作废，成功落楼不提前释放', () => {
  const 结束段 = Index源.slice(
    Index源.indexOf('eventOn(tavern_events.GENERATION_ENDED'),
    Index源.indexOf('function 排队宿主原生时间线切换'),
  );
  assert.match(结束段, /\(消息数\?: number\)/, '处理器必须接收宿主 messageCount 参数');
  assert.match(结束段, /Number\.isInteger\(消息数\)/, '必须读取宿主 messageCount 做精确结束判断');
  assert.match(结束段, /消息数 <= 原生票\.预期助手楼层/, 'messageCount <= 预期助手楼层 才是明确失败');
  assert.match(结束段, /预期楼已落/, '类型与运行时 messageCount 语义有差异时，以精确预期助手楼落座作地面真值兜底');
  assert.match(结束段, /if \(回合进行中\(\)\) return/, '固定 0 楼主回合兼容广播由回合引擎 finally 收口');
  assert.match(
    结束段,
    /原生票\.聊天ID !== 当前聊天ID\(\) \|\| 原生票\.时间线世代 !== 当前时间线切换世代\(\)/,
    '不同聊天/时间线的旧结束事件不得清新租约',
  );
  assert.match(结束段, /SillyTavern\.chat\?\.\[原生票\.用户楼层\] !== 原生票\.用户消息引用/, '楼层引用不符不得清新租约');
  assert.match(结束段, /原生票\.阶段 === '等待prompt'/, '只有等待 prompt 的未完成票在结束事件时清掉');
  const 失败判定位置 = 结束段.indexOf('消息数 <= 原生票.预期助手楼层');
  const 作废位置 = 结束段.lastIndexOf('作废原生正文租约()');
  assert.ok(失败判定位置 >= 0 && 作废位置 > 失败判定位置, '失败判定必须先于作废释放');
});

test('VARIABLE_UPDATE_ENDED 消费租约需 owner、聊天、时间线与预期助手楼全部相符', () => {
  const 回调 = Index源.slice(Index源.indexOf('eventOn(Mvu.events.VARIABLE_UPDATE_ENDED'), Index源.indexOf('// 原生酒馆生成被玩家停止时'));
  // 只有与租约同 owner、同聊天、同时间线、预期助手楼相符的事务才当作正文结算消费。
  assert.match(回调, /原生租约\.序号 !== 读当前租约owner\(\)/, '旧 owner 的迟到回调不得消费正文租约');
  assert.match(回调, /原生租约\.聊天ID !== 当前聊天ID\(\)/, '跨聊天的回调不得消费正文租约');
  assert.match(回调, /原生租约\.时间线世代 !== 当前时间线切换世代\(\)/, '跨时间线的回调不得消费正文租约');
  assert.match(回调, /末楼层 !== 原生租约\.预期助手楼层/, '错助手楼不得消费正文租约');
});
