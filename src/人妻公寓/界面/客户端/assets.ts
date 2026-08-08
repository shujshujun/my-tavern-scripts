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
export const 成人CG基址 = 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg1/cg1';
export const CG解锁存储键 = '人妻公寓_成人CG解锁_cg1';
