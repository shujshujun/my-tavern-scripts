const 稳定版本格式 = /^\d+(?:\.\d+){1,3}$/;
const 构建标记格式 = /RQGY_GAME_VERSION:(\d+(?:\.\d+){1,3})/g;

export function 客户端构建版本标记(版本) {
  const 文本 = String(版本 ?? '').trim();
  if (!稳定版本格式.test(文本)) throw new Error(`非法游戏版本：${文本 || '<空>'}`);
  return `RQGY_GAME_VERSION:${文本}`;
}

export function 校验发布版本一致({ 版本, 标签 }) {
  const 标记 = 客户端构建版本标记(版本);
  if (标签 !== `rq${版本}`) throw new Error(`发布标签 ${标签} 与游戏版本 ${版本} 不一致`);
  return 标记;
}

export function 校验客户端构建版本(html, 版本) {
  const 预期标记 = 客户端构建版本标记(版本);
  const 实际版本 = [...String(html ?? '').matchAll(构建标记格式)].map(匹配 => 匹配[1]);
  const 唯一版本 = [...new Set(实际版本)];
  if (唯一版本.length !== 1 || 唯一版本[0] !== 版本) {
    throw new Error(
      `客户端构建版本不一致：期望 ${预期标记}，实际 ${唯一版本.length ? 唯一版本.join('、') : '未找到构建标记'}。请先重新生产构建客户端，再组卡。`,
    );
  }
  return 预期标记;
}
