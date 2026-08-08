// 解析 delegate 的 JSON 日志，打印结果正文 + 按 DeepSeek 真实价算的花费。
// Claude Code 自带的 total_cost_usd 按 Anthropic 价算，对 DeepSeek 虚高约 100 倍，不可用。
import { readFileSync } from 'node:fs';

// deepseek-v4-flash，USD / 1M tokens
const RATE = { miss: 0.14, hit: 0.0028, out: 0.28 };

const raw = readFileSync(process.argv[2], 'utf8');
const start = raw.indexOf('{"');
if (start < 0) {
  console.log('[report] 日志里没有 JSON，原样输出：\n' + raw.slice(0, 2000));
  process.exit(0);
}

let j;
try {
  j = JSON.parse(raw.slice(start).split(/\r?\n/)[0]);
} catch (e) {
  console.log('[report] JSON 解析失败: ' + e.message + '\n' + raw.slice(0, 2000));
  process.exit(0);
}

const u = j.usage || {};
const miss = (u.cache_creation_input_tokens || 0) + (u.input_tokens || 0);
const hit = u.cache_read_input_tokens || 0;
const out = u.output_tokens || 0;
const cost = (miss * RATE.miss + hit * RATE.hit + out * RATE.out) / 1e6;
const total = miss + hit;
const hitRate = total ? ((hit / total) * 100).toFixed(1) : '0.0';

console.log(j.result || '(无正文)');
console.log('\n' + '─'.repeat(60));
if (j.is_error) {
  console.log(`⚠ 失败: ${j.terminal_reason || 'unknown'}${j.api_error_status ? ' / HTTP ' + j.api_error_status : ''}`);
}
const models = Object.keys(j.modelUsage || {});
const served = models.length ? models.join(', ') : '(未报告)';
console.log(`实际服务模型: ${served}`);
if (models.length && !models.every((m) => m.startsWith('deepseek'))) {
  console.log('⚠ 警告：请求没走 DeepSeek，可能被 ~/.claude/settings.json 的中转 env 劫持了');
}
const k = (n) => (n / 1000).toFixed(1) + 'k';
console.log(`轮数 ${j.num_turns ?? '?'} | 耗时 ${((j.duration_ms || 0) / 1000).toFixed(0)}s`);
console.log(`输入 未命中 ${k(miss)} / 命中 ${k(hit)}（命中率 ${hitRate}%）| 输出 ${k(out)}`);
console.log(`真实花费 ≈ $${cost.toFixed(4)}（Claude Code 报的 $${(j.total_cost_usd || 0).toFixed(2)} 是 Anthropic 价，忽略）`);
const longSession =
  (j.num_turns || 0) >= 80 ||
  (j.duration_ms || 0) >= 600_000 ||
  hit >= 5_000_000;
if (longSession) {
  console.log('⚠ 长会话预警：下一轮不要直接 -c；主代理审查 diff 后，优先写新的精简 spec 并启动新会话。');
}
if ((j.permission_denials || []).length) {
  console.log(`权限被拒 ${j.permission_denials.length} 次: ` +
    j.permission_denials.map((d) => d.tool_name).join(', '));
}
