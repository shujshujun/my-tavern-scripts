/* eslint-disable import-x/no-nodejs-modules -- 明确的模型返回夹具，仅验证业务接线，不测试模型语义能力。 */
export function 观察结果(req, { status = '完成', choices = {}, intent = '未明确' } = {}) {
  const player = req.消息.findLast(m => m.来源 === '玩家');
  const body = req.消息.findLast(m => m.来源 === '正文' || m.来源 === '角色');
  const evidence = m => m?.文本 ? [{ 消息: m.id, 原文: m.文本 }] : [];
  return { 版本: 1, 事件: req.事件, 阶段: req.阶段, 分支: req.分支, 批次: req.批次,
    状态: status, 意向: intent, 依据: evidence(req.类别 === '冷落安抚' ? player : body),
    意向依据: intent === '未明确' ? [] : evidence(player),
    选择: Object.fromEntries(Object.entries(choices).map(([key, 值]) => [key, { 值, 依据: evidence(player) }])), 已谈主题: [] };
}
export function 观察返回(req, options) { return '<自然观察>' + JSON.stringify(观察结果(req, options)) + '</自然观察>'; }

// 默认夹具只用于测试明确声明的成功场景；失败、选择、回档等由测试显式覆盖。
export function 安装观察模型(target, observer = req => 观察返回(req)) {
  target.crypto = crypto;
  target.setTimeout = setTimeout; target.clearTimeout = clearTimeout;
  target.generateRaw = options => observer(JSON.parse(options.ordered_prompts[1].content), options);
}
