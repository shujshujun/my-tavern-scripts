#!/usr/bin/env bash
# 把一份 spec 交给 DeepSeek 落地执行。
# 用 Claude Code 本体当 agent 循环，模型走 DeepSeek 官方 Anthropic 兼容端点。
#
#   scripts/delegate-deepseek.sh .delegate/xxx.md        # 新会话，v4-flash（默认）
#   scripts/delegate-deepseek.sh --fresh spec.md         # 显式新会话
#   scripts/delegate-deepseek.sh -c spec.md              # 仅接同一 spec 的即时小修
#   scripts/delegate-deepseek.sh --effort max spec.md    # 提高思考预算
#   scripts/delegate-deepseek.sh --raw spec.md           # 附带打印原始 JSON 事件
#
# 每个 spec 有独立 session（id 存在 .delegate/.session-<slug>），不会和主会话串台。
# -c 会恢复完整历史并再次注入 spec；长实现、任务转段或响应变慢时，必须换新
# spec 文件名并且不带 -c。完整规则见 docs/DeepSeek委派会话控制.md。
#
# 必须带 --setting-sources project,local：~/.claude/settings.json 里的 env 块
# （主会话的中转 ANTHROPIC_BASE_URL）优先级高于进程环境变量，不排除掉的话
# 请求会被静默劫持到中转上，跑的根本不是 DeepSeek。
#
# 不用 --max-budget-usd：它按 Anthropic 价算（对 DeepSeek 虚高约 100 倍），而且是
# 按天跨会话累计的，主会话的花费会把它顶爆。跑完由 delegate-report.mjs 按
# DeepSeek 真实价算花费并打印。

set -euo pipefail

readonly MODEL="deepseek-v4-flash"   # 固定 flash，不切 pro
SPEC=""
RESUME=0
EFFORT=""
RAW=0
MODE_OPTION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -c|--continue)
      [[ -z "$MODE_OPTION" ]] || { echo "--continue 与 --fresh 不能同时使用" >&2; exit 2; }
      MODE_OPTION="continue"; RESUME=1; shift ;;
    --fresh)
      [[ -z "$MODE_OPTION" ]] || { echo "--continue 与 --fresh 不能同时使用" >&2; exit 2; }
      MODE_OPTION="fresh"; RESUME=0; shift ;;
    --effort)       EFFORT="$2"; shift 2 ;;
    --raw)          RAW=1; shift ;;
    -h|--help)      sed -n '2,16p' "$0"; exit 0 ;;
    -*)             echo "未知参数: $1" >&2; exit 2 ;;
    *)              SPEC="$1"; shift ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"

# ---- 前置检查 ----
command -v claude >/dev/null 2>&1 || { echo "未找到 claude CLI" >&2; exit 1; }
[[ -n "${DEEPSEEK_API_KEY:-}" ]] || { echo "未设置 DEEPSEEK_API_KEY" >&2; exit 1; }
[[ "$DEEPSEEK_API_KEY" == sk-* ]] || {
  echo "DEEPSEEK_API_KEY 格式不对：应以 sk- 开头，当前是 '${DEEPSEEK_API_KEY:0:3}...'（长度 ${#DEEPSEEK_API_KEY}）" >&2
  echo "多半是 setx 时多贴了字符。重设后需重启 VSCode 才生效。" >&2
  exit 1
}
[[ -n "$SPEC" ]] || { echo "缺少 spec 文件参数" >&2; exit 2; }
[[ -f "$SPEC" ]] || { echo "spec 文件不存在: $SPEC" >&2; exit 1; }
[[ -f docs/worker-rules.md ]] || { echo "缺少 docs/worker-rules.md" >&2; exit 1; }
[[ -f .claude/worker-settings.json ]] || { echo "缺少 .claude/worker-settings.json" >&2; exit 1; }

SLUG="$(basename "${SPEC%.*}")"
SESSION_FILE=".delegate/.session-$SLUG"
LOGDIR=".delegate/logs"
mkdir -p "$LOGDIR"
LOG="$LOGDIR/$SLUG-$(date +%Y%m%d-%H%M%S).log"

# ---- session：每个 spec 一个固定 id，避免和主会话串台 ----
SESSION_ARGS=()
if [[ "$RESUME" == 1 ]]; then
  [[ -f "$SESSION_FILE" ]] || { echo "没有 $SLUG 的历史会话，去掉 -c 重新开始" >&2; exit 1; }
  SESSION_ARGS=(--resume "$(cat "$SESSION_FILE")")
  echo "⚠ 正在恢复完整旧会话，并会再次注入 spec 全文。-c 仅适合即时小修。"
  echo "  若任务已转段、上一轮很长或响应变慢：中止本次，改写新的精简 spec，并且不带 -c。"
else
  SID="$(node -e 'process.stdout.write(require("crypto").randomUUID())')"
  printf '%s' "$SID" > "$SESSION_FILE"
  SESSION_ARGS=(--session-id "$SID")
fi

EFFORT_ARGS=()
[[ -n "$EFFORT" ]] && EFFORT_ARGS=(--effort "$EFFORT")

echo "模型:   $MODEL"
echo "spec:   $SPEC"
[[ "$RESUME" == 1 ]] && echo "模式:   续会话（完整历史）" || echo "模式:   新会话"
echo "session:$(cat "$SESSION_FILE")"
echo "日志:   $LOG"
echo "--- 交办前工作树基线 ---"
git status --porcelain | sed 's/^/  /'
echo "------------------------"

PROMPT="$(cat "$SPEC")

---
以上是本次任务 spec。严格按它执行。收尾输出：改动文件清单、关键决策、没做完的部分。不要 git commit/push。"

set +e
env -u ANTHROPIC_API_KEY \
    ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic" \
    ANTHROPIC_AUTH_TOKEN="$DEEPSEEK_API_KEY" \
    ANTHROPIC_MODEL="$MODEL" \
    ANTHROPIC_SMALL_FAST_MODEL="deepseek-v4-flash" \
    CLAUDE_CODE_SUBAGENT_MODEL="deepseek-v4-flash" \
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
  claude -p \
    --setting-sources project,local \
    --settings .claude/worker-settings.json \
    --append-system-prompt "$(cat docs/worker-rules.md)" \
    --exclude-dynamic-system-prompt-sections \
    --disable-slash-commands \
    --output-format json \
    "${SESSION_ARGS[@]}" \
    ${EFFORT_ARGS[@]+"${EFFORT_ARGS[@]}"} \
    "$PROMPT" \
  > "$LOG" 2>&1
STATUS=$?
set -e

[[ "$RAW" == 1 ]] && cat "$LOG"
node scripts/delegate-report.mjs "$LOG"

echo
echo "=== 交办后工作树（对比上面的基线，差集就是它的改动）==="
git status --porcelain | sed 's/^/  /'
echo
echo "日志: $LOG"
echo "复查: git diff --stat  然后逐个 git diff <file>"
if [[ "$RESUME" == 1 ]]; then
  echo "再返工前先判断会话是否已变长；变慢或任务转段时改用新的精简 spec，不再 -c。"
else
  echo "即时小修: scripts/delegate-deepseek.sh -c $SPEC"
  echo "较大返工/新阶段: 新建精简 spec 文件，并且不带 -c 启动。"
fi
exit "$STATUS"
