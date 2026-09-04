import { 母亲视频通话全部CG } from './母亲视频通话CG语义';

export type 母亲视频通话素材发布状态 = '待不可变标签' | '已发布';

/**
 * 本地产品链的正式发布目标。`cg5` 当前只是一项待发布常量；在远端标签真实创建并核验前，
 * 运行时不会把它当成可用URL，也不会回退到 main、分支或本地 output 候选目录。
 */
export const 母亲视频通话素材发布配置 = Object.freeze({
  仓库: 'shujun8520-design/qgy-assets',
  不可变标签: 'cg5',
  产品目录: 'cg1/mother-video-call',
  状态: '待不可变标签' as 母亲视频通话素材发布状态,
});

export const 母亲视频通话待发布素材基址 =
  `https://testingcf.jsdelivr.net/gh/${母亲视频通话素材发布配置.仓库}` +
  `@${母亲视频通话素材发布配置.不可变标签}/${母亲视频通话素材发布配置.产品目录}`;

const 母亲视频通话运行ID = new Set(母亲视频通话全部CG.map(CG => CG.id));

function 规范母亲视频通话素材覆盖(): string {
  return String((globalThis as Record<string, unknown>).__RQGY_MOTHER_VIDEO_CALL_ASSET_BASE__ ?? '')
    .trim()
    .replace(/\/+$/, '');
}

/** 发布工具和验收测试共用的稳定产品相对路径；永远不含本地候选目录。 */
export function 母亲视频通话CG产品相对路径(CGid: string): string {
  return 母亲视频通话运行ID.has(CGid)
    ? `${母亲视频通话素材发布配置.产品目录}/${encodeURIComponent(CGid)}.webp`
    : '';
}

/**
 * 客户端与小手机共用的唯一URL解析器。
 *
 * - 已显式安装经过核验的不可变基址时，允许全局覆盖；
 * - 远端 `cg5` 尚未发布时默认安全失败为空串，避免把待发布常量伪装成线上资源；
 * - 标签发布并把配置状态改为“已发布”后，内置不可变基址立即成为默认生产路径。
 */
export function 母亲视频通话CG图片(CGid: string): string {
  if (!母亲视频通话运行ID.has(CGid)) return '';
  const 覆盖 = 规范母亲视频通话素材覆盖();
  const 基址 =
    覆盖 ||
    (母亲视频通话素材发布配置.状态 === '已发布' ? 母亲视频通话待发布素材基址 : '');
  return 基址 ? `${基址}/${encodeURIComponent(CGid)}.webp` : '';
}
