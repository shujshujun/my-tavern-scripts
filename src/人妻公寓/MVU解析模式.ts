export type MVU解析状态 = {
  /** MVU 已向宿主窗口暴露运行时对象。 */
  已加载: boolean;
  /** 玩家在 MVU 中选择了“额外模型解析”。 */
  外置模式: boolean;
  /** MVU 是否允许正常回复自动发起额外模型请求。 */
  自动请求: boolean;
};

type MVU设置 = {
  更新方式?: unknown;
  自动触发额外模型解析?: unknown;
  额外模型解析配置?: {
    启用自动请求?: unknown;
  };
};

/**
 * 只读取 MVU 的路线开关，不读取或复制它的模型地址、密钥等配置。
 *
 * MVU 暂未公开“当前更新方式”的全局 API；官方设置保存在
 * `SillyTavern.extensionSettings.mvu_settings`。旧版的自动请求键也在这里兼容。
 */
export function 读取MVU解析状态(): MVU解析状态 {
  try {
    const 宿主 = (window.parent ?? window) as Window & {
      Mvu?: unknown;
      SillyTavern?: { extensionSettings?: Record<string, unknown> };
    };
    const 设置 = 宿主.SillyTavern?.extensionSettings?.mvu_settings as MVU设置 | undefined;
    const 自动请求原值 = 设置?.额外模型解析配置?.启用自动请求 ?? 设置?.自动触发额外模型解析;
    return {
      已加载: Boolean(宿主.Mvu),
      外置模式: 设置?.更新方式 === '额外模型解析',
      自动请求: 自动请求原值 === undefined ? true : 自动请求原值 === true,
    };
  } catch {
    return { 已加载: false, 外置模式: false, 自动请求: true };
  }
}
