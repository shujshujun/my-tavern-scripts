// ── 素材(AI 生成,2026-07-17 入库;素材 TAG 与发布 TAG 解耦——素材没变就不用动这里) ──
// 0.69 位图随不可变 Tag 发布。不要通过 `?url` 把它们塞进客户端 module：
// 三张录像带原图就会把移动端入口从约 0.65 MB 撑到 11.7 MB，并显著增加 WebView 解析失败风险。

// 两套普通素材快照分工不同，不可合并为一个版本号：
// - 版本素材基址(rq0.70)只承载录像带三图、公寓外部/晨跑/健身背景与七张新道具等增量素材；
//   本地 src/人妻公寓/素材 也仅含该增量集合。
// - 素材基址固定使用含完整 720 个文件的 rq0.55 不可变快照，供头像/立绘等完整旧素材使用；
//   代码版本 Tag 不再承担素材仓职责。
// 成人 CG 仍来自独立 qgy-assets@cg1/cg1，与两套普通素材无关。
export const 版本素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.70/src/人妻公寓/素材';
export const 录像带双屏关闭图 = `${版本素材基址}/特殊场景/录像带/01_双屏关闭.png`;
export const 录像带左屏亮起图 = `${版本素材基址}/特殊场景/录像带/02_左屏亮起.png`;
export const 录像带双屏亮起图 = `${版本素材基址}/特殊场景/录像带/03_双屏亮起.png`;
export const 公寓外部背景图 = `${版本素材基址}/背景/公寓外部.webp`;
export const 晨跑公园背景图 = `${版本素材基址}/背景/晨跑公园.webp`;
export const 健身房背景图 = `${版本素材基址}/背景/健身房.webp`;
export const 清醒咖啡道具图 = `${版本素材基址}/道具/清醒咖啡.webp`;
export const 集中胶囊道具图 = `${版本素材基址}/道具/集中胶囊.webp`;
export const 运动饮料道具图 = `${版本素材基址}/道具/运动饮料.webp`;
export const 强效营养剂道具图 = `${版本素材基址}/道具/强效营养剂.webp`;
export const 安全套道具图 = `${版本素材基址}/道具/安全套.webp`;
export const 专注训练手册道具图 = `${版本素材基址}/道具/专注训练手册.webp`;
export const 蛋白粉道具图 = `${版本素材基址}/道具/蛋白粉.webp`;
export const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材';
/**
 * 与孕态服装发布记录保持同一命名契约：approved/<角色>/服装_<商店 SKU>_孕态.webp。
 * 生成计划已经封板：只支持下列 62 张，不再尝试其余角色/SKU 组合。
 */
export const 孕态服装立绘基址 =
  'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.81/output/imagegen/rqgy-reset/pregnancy-portraits/approved';
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
export function 角色立绘候选(妻名: string, sku: string | undefined, 怀孕公开: boolean): string[] {
  const 基础立绘 = `${素材基址}/立绘/${妻名}.webp`;
  const 常规服装立绘 = sku ? `${素材基址}/立绘/${妻名}_${sku}.webp` : '';
  const 孕态服装立绘 = 怀孕公开 && sku ? 孕态服装立绘图(妻名, sku) : '';
  const 候选 = [孕态服装立绘, 常规服装立绘, 基础立绘];
  return [...new Set(候选.filter(Boolean))];
}
export const 成人CG基址 = 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg1/cg1';
export const CG解锁存储键 = '人妻公寓_成人CG解锁_cg1';
