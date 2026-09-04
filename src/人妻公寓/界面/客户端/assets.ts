import {
  母亲视频通话CG产品相对路径,
  母亲视频通话CG图片,
  母亲视频通话待发布素材基址,
  母亲视频通话素材发布配置,
} from '../../脚本/游戏逻辑/母亲视频通话资源';
import { 住户答谢会图 as 住户答谢会道具图 } from '../../内嵌小图';
import { 衣柜普通重制图 } from './服装立绘资源';
import { 读取穿戴成品图, type 成品穿戴状态 } from './穿戴成品图';
export {
  住户答谢会道具图,
  母亲视频通话CG产品相对路径,
  母亲视频通话CG图片,
  母亲视频通话待发布素材基址,
  母亲视频通话素材发布配置,
};

// ── 素材(AI 生成,2026-07-17 入库;素材 TAG 与发布 TAG 解耦——素材没变就不用动这里) ──
// 0.69 位图随不可变 Tag 发布。不要通过 `?url` 把它们塞进客户端 module：
// 三张录像带原图就会把移动端入口从约 0.65 MB 撑到 11.7 MB，并显著增加 WebView 解析失败风险。

// 两套普通素材快照分工不同，不可合并为一个版本号：
// - 版本素材基址(rq0.70)只承载录像带三图、公寓外部/晨跑/健身背景与七张新道具等增量素材；
//   本地 src/人妻公寓/素材 也仅含该增量集合。
// - 素材基址固定使用含完整 720 个文件的 rq0.55 不可变快照，供头像/立绘等完整旧素材使用；
//   代码版本 Tag 不再承担素材仓职责。
// 成人 CG 来自独立 qgy-assets@cg3/cg1；cg3 同时承载普通/孕肚五阶段图库，与两套普通素材无关。
export const 版本素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.70/src/人妻公寓/素材';
export const 录像带双屏关闭图 = `${版本素材基址}/特殊场景/录像带/01_双屏关闭.png`;
export const 录像带左屏亮起图 = `${版本素材基址}/特殊场景/录像带/02_左屏亮起.png`;
export const 录像带双屏亮起图 = `${版本素材基址}/特殊场景/录像带/03_双屏亮起.png`;
export const 公寓外部背景图 = `${版本素材基址}/背景/公寓外部.webp`;
export const 晨跑公园背景图 = `${版本素材基址}/背景/晨跑公园.webp`;
export const 健身房背景图 = `${版本素材基址}/背景/健身房.webp`;
/**
 * 302结局后四张开场CG与五张基础背景已在本地完成，但用户将在正式发布前上传到独立素材仓。
 * 当前不把生图工作目录打进客户端，也不猜测尚未确定的仓库／标签；验收环境可显式注入基址。
 */
export const 共居302素材发布配置 = Object.freeze({
  路线: '302结局后亲密开场与共居9图包',
  仓库: '',
  不可变标签: '',
  产品目录: '',
  状态: '待独立素材仓' as '待独立素材仓' | '已发布',
});

const 共居302背景文件表: Readonly<Record<string, string>> = Object.freeze({
  早晨共居: '302_共居_早晨.webp',
  中午个人生活: '302_共居_白天.webp',
  傍晚等人: '302_共居_傍晚归家.webp',
  傍晚她先吃: '302_共居_夜晚.webp',
  晚饭后客厅: '302_共居_夜晚.webp',
  深夜共同休息: '302_共居_深夜.webp',
  轻微分歧: '302_共居_夜晚.webp',
});

const 共居302亲密开场文件 = new Set([
  '302_亲密开场_由我开始_夜晚',
  '302_亲密开场_由我开始_晨间',
  '302_亲密开场_让她开始_夜晚',
  '302_亲密开场_让她开始_晨间',
]);

function 共居302素材基址(): string {
  const 覆盖 = String((globalThis as Record<string, unknown>).__RQGY_302_COHAB_ASSET_BASE__ ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (覆盖) return 覆盖;
  if (
    共居302素材发布配置.状态 !== '已发布' ||
    !共居302素材发布配置.仓库 ||
    !共居302素材发布配置.不可变标签 ||
    !共居302素材发布配置.产品目录
  ) {
    return '';
  }
  return (
    `https://testingcf.jsdelivr.net/gh/${共居302素材发布配置.仓库}` +
    `@${共居302素材发布配置.不可变标签}/${共居302素材发布配置.产品目录}`
  ).replace(/\/+$/, '');
}

export const 共居302背景图 = (状态: string): string => {
  const 基址 = 共居302素材基址();
  const 文件 = 共居302背景文件表[状态];
  return 基址 && 文件 ? `${基址}/${encodeURIComponent(文件)}` : '';
};

export const 共居302亲密开场图 = (文件: string): string => {
  const 基址 = 共居302素材基址();
  return 基址 && 共居302亲密开场文件.has(文件) ? `${基址}/${encodeURIComponent(文件)}.webp` : '';
};
export const 清醒咖啡道具图 = `${版本素材基址}/道具/清醒咖啡.webp`;
export const 集中胶囊道具图 = `${版本素材基址}/道具/集中胶囊.webp`;
export const 运动饮料道具图 = `${版本素材基址}/道具/运动饮料.webp`;
export const 强效营养剂道具图 = `${版本素材基址}/道具/强效营养剂.webp`;
export const 安全套道具图 = `${版本素材基址}/道具/安全套.webp`;
export const 专注训练手册道具图 = `${版本素材基址}/道具/专注训练手册.webp`;
export const 蛋白粉道具图 = `${版本素材基址}/道具/蛋白粉.webp`;
/** 家庭计划九张专属画面随 v0.83 发布，不并入客户端模块。 */
export const 家庭计划素材基址 =
  'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.83/output/imagegen/family-plan';
export const 家庭计划图片 = (文件: string): string => `${家庭计划素材基址}/${文件}.webp`;
/**
 * 《第二机位》保留原剧情事件覆盖键，避免破坏现有本地预览；其发布状态不再控制母亲线或201。
 */
export const 剧情事件素材发布配置 = Object.freeze({
  路线: '第二机位',
  仓库: 'shujshujun/my-tavern-scripts',
  不可变标签: 'rq0.91',
  产品目录: 'src/人妻公寓/素材/特殊场景',
  状态: '待不可变标签' as '待不可变标签' | '已发布',
});
export const 剧情事件待发布素材基址 =
  `https://testingcf.jsdelivr.net/gh/${剧情事件素材发布配置.仓库}` +
  `@${剧情事件素材发布配置.不可变标签}/${剧情事件素材发布配置.产品目录}`;

/** 《回国》9图与《双重继承》11图的独立发布闭环；201未封板不会再连坐这个开关。 */
export const 母亲线剧情素材发布配置 = Object.freeze({
  路线: '母亲线:回国+双重继承',
  仓库: 'shujshujun/my-tavern-scripts',
  不可变标签: 'rq0.91',
  产品目录: 'src/人妻公寓/素材/特殊场景',
  manifest: '母亲线剧情CG.manifest.json',
  状态: '待不可变标签' as '待不可变标签' | '已发布',
});
export const 母亲线剧情待发布素材基址 =
  `https://testingcf.jsdelivr.net/gh/${母亲线剧情素材发布配置.仓库}` +
  `@${母亲线剧情素材发布配置.不可变标签}/${母亲线剧情素材发布配置.产品目录}`;

/** 201方案仍待用户确认；即使同一仓库以后出现rq0.91，也不得由母亲线发布状态误解锁。 */
export const 许曼君201素材发布配置 = Object.freeze({
  路线: '许曼君201分居/留宿',
  仓库: 'shujshujun/my-tavern-scripts',
  不可变标签: '',
  产品目录: 'src/人妻公寓/素材/特殊场景/许曼君分居',
  manifest: '许曼君分居CG.manifest.json',
  状态: '待设计/未发布' as '待设计/未发布' | '待不可变标签' | '已发布',
});

function 规范剧情素材基址(覆盖键: string, 配置: { 状态: string }, 待发布基址: string): string {
  const 覆盖 = String((globalThis as Record<string, unknown>)[覆盖键] ?? '')
    .trim()
    .replace(/\/+$/, '');
  return 覆盖 || (配置.状态 === '已发布' ? 待发布基址 : '');
}

export const 剧情事件素材基址 = 规范剧情素材基址(
  '__RQGY_STORY_EVENT_ASSET_BASE__',
  剧情事件素材发布配置,
  剧情事件待发布素材基址,
);
export const 母亲线剧情素材基址 = 规范剧情素材基址(
  '__RQGY_MOTHER_LINE_STORY_ASSET_BASE__',
  母亲线剧情素材发布配置,
  母亲线剧情待发布素材基址,
);

function 拼剧情事件图片(基址: string, 目录: string, 文件: string): string {
  if (!基址 || !文件) return '';
  return `${基址}/${encodeURIComponent(目录)}/${文件
    .split('/')
    .map(段 => encodeURIComponent(段))
    .join('/')}.webp`;
}

export const 第二机位图片 = (文件: string): string =>
  拼剧情事件图片(
    规范剧情素材基址('__RQGY_STORY_EVENT_ASSET_BASE__', 剧情事件素材发布配置, 剧情事件待发布素材基址),
    '第二机位',
    文件,
  );
export const 回国图片 = (文件: string): string =>
  拼剧情事件图片(
    规范剧情素材基址(
      '__RQGY_MOTHER_LINE_STORY_ASSET_BASE__',
      母亲线剧情素材发布配置,
      母亲线剧情待发布素材基址,
    ),
    '回国',
    文件,
  );
export const 双重继承图片 = (文件: string): string =>
  拼剧情事件图片(
    规范剧情素材基址(
      '__RQGY_MOTHER_LINE_STORY_ASSET_BASE__',
      母亲线剧情素材发布配置,
      母亲线剧情待发布素材基址,
    ),
    '双重继承',
    文件,
  );
export const 许曼君分居图片 = (文件: string): string => {
  const 覆盖 = 规范剧情素材基址('__RQGY_XMJ_201_ASSET_BASE__', 许曼君201素材发布配置, '');
  return 拼剧情事件图片(覆盖, '许曼君分居', 文件);
};

/**
 * 安若妍301《不必停》18张封板图（14个运行镜头，06/09/10/13含普通与孕态差分）。
 * 生图工作目录不是产品URL；发布前只接受显式预览基址，避免客户端请求不存在的标签。
 */
export const 安若妍不必停素材发布配置 = Object.freeze({
  路线: '安若妍301承接线:不必停',
  仓库: 'shujshujun/my-tavern-scripts',
  不可变标签: '',
  产品目录: 'src/人妻公寓/素材/特殊场景/安若妍不必停',
  manifest: '安若妍不必停CG.manifest.json',
  状态: '待不可变标签' as '待不可变标签' | '已发布',
});
const 安若妍不必停待发布素材基址 = 安若妍不必停素材发布配置.不可变标签
  ? `https://testingcf.jsdelivr.net/gh/${安若妍不必停素材发布配置.仓库}` +
    `@${安若妍不必停素材发布配置.不可变标签}/${安若妍不必停素材发布配置.产品目录}`
  : '';
const 安若妍不必停CG白名单 =
  /^(?:ARY-NBS-(?:0[1-5]|0[78]|1[124])|ARY-NBS-(?:06|09|10|13)-(?:N|P))$/u;
export function 安若妍不必停图片(文件: string): string {
  if (!安若妍不必停CG白名单.test(文件)) return '';
  const 基址 = 规范剧情素材基址(
    '__RQGY_ARY_301_NO_STOP_ASSET_BASE__',
    安若妍不必停素材发布配置,
    安若妍不必停待发布素材基址,
  );
  return 基址 ? `${基址}/${文件}.webp` : '';
}

/** 《离婚》15张封板产品独立发布；发布前只接受显式全局覆盖，不请求虚构标签。 */
export const 许曼君离婚素材发布配置 = Object.freeze({
  路线: '许曼君201正式结局:离婚',
  仓库: 'shujshujun/my-tavern-scripts',
  不可变标签: '',
  产品目录: 'src/人妻公寓/素材/特殊场景/许曼君离婚',
  manifest: '许曼君离婚CG.manifest.json',
  状态: '待不可变标签' as '待不可变标签' | '已发布',
});
const 许曼君离婚待发布素材基址 = 许曼君离婚素材发布配置.不可变标签
  ? `https://testingcf.jsdelivr.net/gh/${许曼君离婚素材发布配置.仓库}` +
    `@${许曼君离婚素材发布配置.不可变标签}/${许曼君离婚素材发布配置.产品目录}`
  : '';
export function 许曼君离婚图片(文件: string): string {
  if (!/^XMJ-DIV-(?:0[1-9]|1[0-5])$/u.test(文件)) return '';
  const 基址 = 规范剧情素材基址(
    '__RQGY_XMJ_DIVORCE_ASSET_BASE__',
    许曼君离婚素材发布配置,
    许曼君离婚待发布素材基址,
  );
  return 基址 ? `${基址}/${文件}.webp` : '';
}
/**
 * 《录像带》丈夫结局的 v1 十张试播图、v2 二十张平板图与十八张外层图
 * 均独立于旧“特殊场景/录像带”三态素材。
 * 发布前保持空基址，避免请求不存在的标签；本地验收可用显式全局基址预览。
 */
export const 录像带双承接素材发布配置 = Object.freeze({
  路线: '丈夫结局:录像带双承接',
  仓库: 'shujshujun/my-tavern-scripts',
  不可变标签: 'rq0.91',
  产品目录: 'src/人妻公寓/素材/丈夫结局/录像带',
  状态: '待不可变标签' as '待不可变标签' | '已发布',
});
export const 录像带双承接待发布素材基址 =
  `https://testingcf.jsdelivr.net/gh/${录像带双承接素材发布配置.仓库}` +
  `@${录像带双承接素材发布配置.不可变标签}/${录像带双承接素材发布配置.产品目录}`;
export const 录像带双承接素材基址 = String(
  (globalThis as Record<string, unknown>).__RQGY_VTR_ENDING_ASSET_BASE__ ??
    (录像带双承接素材发布配置.状态 === '已发布' ? 录像带双承接待发布素材基址 : ''),
)
  .trim()
  .replace(/\/+$/, '');
export const 录像带双承接平板图片 = (文件: string): string =>
  录像带双承接素材基址 && /^SCREEN-(?:102|202)-0[1-5]$/u.test(文件) ? `${录像带双承接素材基址}/${文件}.png` : '';
/**
 * v1 无版本五格保留根目录；v2 平板与外层分别进入版本目录。
 * 严格白名单防止事件载荷把任意相对路径拼进素材基址。
 */
export const 录像带双承接图片 = (文件: string): string => {
  if (!录像带双承接素材基址) return '';
  if (/^SCREEN-(?:102|202)-0[1-5]$/u.test(文件)) return `${录像带双承接素材基址}/${文件}.png`;
  if (/^SCREEN-V2-(?:102|202)-(?:0[1-9]|10)$/u.test(文件)) return `${录像带双承接素材基址}/v2/${文件}.png`;
  if (
    /^OUTER-V2-(?:102|202)-0[1-9]-(?:LOCKED|AUTHORIZATION|SELF-UNLOCK|VIEW-EARLY|VIEW-ESCALATION|SELF-COMPLETION|SELF-RELOCK|VISUAL-VERIFICATION|HANDOFF)$/u.test(
      文件,
    )
  ) {
    return `${录像带双承接素材基址}/v2/outer/${文件}.png`;
  }
  return '';
};
/** 生产／医院73张非成人图片随 v0.83 发布，与普通素材及成人CG仓隔离。 */
export const 生产素材基址 =
  'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.83/output/imagegen/production-system/final';
export const 生产图片 = (文件: string): string =>
  `${生产素材基址}/${文件
    .split('/')
    .map(段 => encodeURIComponent(段))
    .join('/')}.webp`;
/** 夏乔借种结局事件画面与手机合照共享同一不可变发布目录。 */
export const 借种结局素材基址 =
  'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg4/cg1/borrow-seed-ending';
export const 借种结局图片 = (文件: string): string =>
  `${借种结局素材基址}/${文件
    .split('/')
    .map(段 => encodeURIComponent(段))
    .join('/')}.webp`;
export const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材';
/**
 * 与孕态服装发布记录保持同一命名契约：approved/<角色>/服装_<商店 SKU>_孕态.webp。
 * 生成计划已经封板：只支持下列 62 张，不再尝试其余角色/SKU 组合。
 */
export const 孕态服装立绘基址 =
  'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.82/output/imagegen/rqgy-reset/pregnancy-portraits/approved';
const 通用孕态服装SKU = [
  '碎花连衣裙',
  '牛仔背带裙',
  '毛衣裙',
  '收腰连衣裙',
  '一字肩',
  '开叉旗袍',
  '低胸晚礼裙',
  '露背装',
  '女仆装',
  'JK水手服',
] as const;
export const 孕态服装白名单: Readonly<Record<string, readonly string[]>> = {
  安若妍: 通用孕态服装SKU,
  母亲: 通用孕态服装SKU,
  沈静仪: 通用孕态服装SKU,
  许曼君: 通用孕态服装SKU,
  周小满: 通用孕态服装SKU,
  夏乔: [...通用孕态服装SKU, '透视装', '露出装'],
};
export const 孕态服装立绘图 = (妻名: string, sku: string): string =>
  孕态服装白名单[妻名]?.includes(sku) ? `${孕态服装立绘基址}/${妻名}/服装_${sku}_孕态.webp` : '';

/**
 * 角色立绘的统一优先级。怀孕未公开或当前服装不在白名单时，只使用普通服装/基础立绘。
 */
export function 角色立绘候选(妻名: string, sku: string | undefined, 怀孕公开: boolean, 穿戴?: 成品穿戴状态): string[] {
  // 衣柜的初始服饰是静态配置项，不存在对应商品差分文件。
  if (sku?.startsWith('初始')) sku = undefined;
  const 基础立绘 = `${素材基址}/立绘/${妻名}.webp`;
  const 常规服装立绘 = 衣柜普通重制图(妻名, sku) || (sku ? `${素材基址}/立绘/${妻名}_${sku}.webp` : '');
  const 孕态服装立绘 = 怀孕公开 && sku ? 孕态服装立绘图(妻名, sku) : '';
  const 成品立绘 = 穿戴 ? 读取穿戴成品图(妻名, sku, 怀孕公开, 穿戴) : '';
  const 候选 = [成品立绘, 孕态服装立绘, 常规服装立绘, 基础立绘];
  return [...new Set(候选.filter(Boolean))];
}
export const 成人CG基址 = 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg3/cg1';
// 存储键保持 cg1，兼容旧档已经解锁的稳定 CG ID；资源标签升级不能清空玩家进度。
export const CG解锁存储键 = '人妻公寓_成人CG解锁_cg1';
