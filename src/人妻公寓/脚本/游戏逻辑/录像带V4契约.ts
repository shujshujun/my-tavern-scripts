import 候选清单原始 from '../../生产契约/录像带V4/final-candidates-manifest-v2.json';
import 镜头卡原始 from '../../生产契约/录像带V4/shot-cards-v8.json';
import 上下文策略原始 from '../../生产契约/录像带V4/context-isolation-policy-v1.json';
import 监控覆盖层契约原始 from '../../生产契约/录像带V4/monitor-overlay-contract-v1.json';
import 微信前置契约原始 from '../../生产契约/录像带V4/wechat-prelude-flow-v2.json';
import 产品清单原始 from '../../素材/特殊场景/录像带V4/录像带V4CG.manifest.json';

import type { 录像带V4房间 } from './录像带V4状态';

export interface 录像带V4候选记录 {
  id: string;
  room: 录像带V4房间;
  beat: number;
  kind: string;
  output: string;
  outputSha256: string;
  provenance: string;
  userConfirmed: true;
  formalAccepted: true;
  installed: true;
  productionUnlocked: false;
  productFile: string;
  productPath: string;
  productSha256: string;
  productBytes: number;
}

export interface 录像带V4候选清单结构 {
  schemaVersion: string;
  createdAt: string;
  compositionPlan: string;
  compositionPlanSha256: string;
  count: number;
  uniqueOutputSha256: number;
  productCount: number;
  uniqueProductSha256: number;
  productManifest: string;
  productManifestSha256: string;
  records: 录像带V4候选记录[];
  formalAccepted: true;
  installed: true;
  productionUnlocked: false;
  [键: string]: unknown;
}

export interface 录像带V4产品记录 {
  id: string;
  room: 录像带V4房间;
  beat: number;
  semantic: string;
  kind: string;
  sourcePath: string;
  sourceSha256: string;
  sourceBytes: number;
  sourceProvenance: string;
  productFile: string;
  productSha256: string;
  productBytes: number;
  width: number;
  height: number;
  psnrDb: number;
  meanAbsoluteError: number;
}

export interface 录像带V4产品清单结构 {
  schemaVersion: string;
  status: string;
  runtimeSlots: number;
  acceptedFiles: number;
  format: 'webp';
  userAcceptance: {
    confirmedAt: string;
    decision: string;
    intentionalLegacyPixelReuseIds: string[];
    legacyReuseMeaning: string;
  };
  qualityEvidence: {
    sourceBytes: number;
    productBytes: number;
    savedBytes: number;
    savedPercent: number;
    [键: string]: unknown;
  };
  publish: {
    immutableTag: string;
    runtimeDirectory: string;
    globalPreviewOverride: string;
    [键: string]: unknown;
  };
  items: 录像带V4产品记录[];
  [键: string]: unknown;
}

export interface 录像带V4镜头卡 {
  id: string;
  beat: number;
  room: 录像带V4房间;
  title: string;
  image: string;
  imageSha256: string;
  visibleFacts: string;
  beforeState: string;
  performanceDirection: string;
  husbandReaction: string;
  stopBoundary: string;
  runtimeAiPrompt: string;
  userConfirmed: true;
  installed: true;
  productImage: string;
  productImageSha256: string;
  recentHumiliationAngle?: string;
  currentHumiliationFocus?: string;
  explicitLanguageDirection?: string;
  runtimeOutcome?: string;
  runtimeStopBoundary?: string;
  scenePreludeContext?: string;
  [键: string]: unknown;
}

export type 录像带V4微信卡阶段 = 'lock-confirmation' | 'watch-consent' | 'departure-ready';

export interface 录像带V4微信卡 {
  id: string;
  wifeRoom: 录像带V4房间;
  speaker: string;
  husband: string;
  stage: 录像带V4微信卡阶段;
  trigger: string;
  facts: string;
  direction: string;
  goal: string;
  stop: string;
  aiPrompt: string;
}

interface 录像带V4镜头卡清单结构 {
  schemaVersion: string;
  createdAt: string;
  count: number;
  cards: 录像带V4镜头卡[];
  formalAccepted: true;
  installed: true;
  productionUnlocked: false;
  productManifest: string;
  productManifestSha256: string;
  [键: string]: unknown;
}

interface 录像带V4上下文策略结构 {
  schemaVersion: string;
  runtimePromptSourceAllowlist: string[];
  requiredDiagnostics: {
    storeFullPromptSnapshotEachBeat: boolean;
    snapshotSourceLabels: string[];
    rejectUnknownPromptSource: boolean;
    poisonSentinelTests: string[];
  };
  installed: boolean;
  productionUnlocked: boolean;
  [键: string]: unknown;
}

interface 录像带V4覆盖层契约结构 {
  schemaVersion: string;
  assetPolicy: {
    rawPngOverlayBaked: boolean;
    runtimeOverlayRequired: boolean;
  };
  coverage: {
    rooms: string[];
    beatsPerRoom: number;
    candidateCount: number;
    displayedPerPlaythrough: number;
    exceptions: unknown[];
    includes: string[];
  };
  requiredRuntimeElements: Array<{ id: string; [键: string]: unknown }>;
  layoutSafety: Record<string, boolean>;
  installed: boolean;
  productionUnlocked: boolean;
  [键: string]: unknown;
}

interface 录像带V4微信前置契约结构 {
  schemaVersion: string;
  wechat: {
    cards: 录像带V4微信卡[];
    [键: string]: unknown;
  };
  gates: {
    monitorDoesNotAutoStart: boolean;
    manualTravelTo302Required: boolean;
    monitorClickAutoTransfersTo302: boolean;
    [键: string]: unknown;
  };
  installed: boolean;
  productionUnlocked: boolean;
  [键: string]: unknown;
}

export const 录像带V4候选清单 = 候选清单原始 as unknown as 录像带V4候选清单结构;
export const 录像带V4产品清单 = 产品清单原始 as unknown as 录像带V4产品清单结构;
const 镜头卡清单 = 镜头卡原始 as unknown as 录像带V4镜头卡清单结构;
export const 录像带V4镜头卡们 = 镜头卡清单.cards;
export const 录像带V4上下文策略 = 上下文策略原始 as unknown as 录像带V4上下文策略结构;
export const 录像带V4监控覆盖层契约 = 监控覆盖层契约原始 as unknown as 录像带V4覆盖层契约结构;
export const 录像带V4微信前置契约 = 微信前置契约原始 as unknown as 录像带V4微信前置契约结构;

function 是房间(值: unknown): 值 is 录像带V4房间 {
  return 值 === '102' || 值 === '202';
}

function 帧键(房间: 录像带V4房间, 幕次: number): string {
  return `${房间}:${幕次}`;
}

const 候选索引 = new Map(录像带V4候选清单.records.map(记录 => [帧键(记录.room, 记录.beat), 记录] as const));
const 产品索引 = new Map(录像带V4产品清单.items.map(记录 => [帧键(记录.room, 记录.beat), 记录] as const));
const 镜头卡索引 = new Map(录像带V4镜头卡们.map(卡 => [帧键(卡.room, 卡.beat), 卡] as const));
const 微信卡索引 = new Map(录像带V4微信前置契约.wechat.cards.map(卡 => [`${卡.wifeRoom}:${卡.stage}`, 卡] as const));

export function 读取录像带V4候选(房间: 录像带V4房间 | string, 幕次: number): 录像带V4候选记录 | undefined {
  if (!是房间(房间) || !Number.isInteger(幕次) || 幕次 < 1 || 幕次 > 19) return undefined;
  return 候选索引.get(帧键(房间, 幕次));
}

export function 读取录像带V4产品(房间: 录像带V4房间 | string, 幕次: number): 录像带V4产品记录 | undefined {
  if (!是房间(房间) || !Number.isInteger(幕次) || 幕次 < 1 || 幕次 > 19) return undefined;
  return 产品索引.get(帧键(房间, 幕次));
}

export function 读取录像带V4镜头卡(房间: 录像带V4房间 | string, 幕次: number): 录像带V4镜头卡 | undefined {
  if (!是房间(房间) || !Number.isInteger(幕次) || 幕次 < 1 || 幕次 > 19) return undefined;
  return 镜头卡索引.get(帧键(房间, 幕次));
}

export function 读取录像带V4微信卡(房间: 录像带V4房间 | string, 阶段: 录像带V4微信卡阶段): 录像带V4微信卡 | undefined {
  if (!是房间(房间)) return undefined;
  return 微信卡索引.get(`${房间}:${阶段}`);
}

function 规范微信气泡文本(原文: unknown): string {
  return String(原文 ?? '')
    .normalize('NFKC')
    .replace(/\s+/gu, '');
}

function 含任一(文本: string, 词们: readonly string[]): boolean {
  return 词们.some(词 => 文本.includes(词));
}

/**
 * 手机AI只负责人物口吻，戴锁、知情同意和联合出发属于硬剧情凭据。格式正确但语义相反、
 * 漏丈夫姓名或漏“监控自动切302”的弱模型输出不能获得稳定消息键。
 */
export function 录像带V4微信气泡满足卡(卡: 录像带V4微信卡, 原文: unknown): boolean {
  const 文本 = 规范微信气泡文本(原文);
  if (!文本) return false;
  if (卡.stage === 'departure-ready') {
    const 已准备出发 = 含任一(文本, ['出发', '动身', '过去', '准备好了', '现在走']);
    const 有监控 = 文本.includes('监控');
    const 有302 = 文本.includes('302');
    const 自动切换 = /自动.{0,10}(?:切|回|到|进入)302/u.test(文本) || /(?:切|回)到302/u.test(文本);
    return 已准备出发 && 有监控 && 有302 && 自动切换;
  }

  if (!文本.includes(卡.husband)) return false;
  if (卡.stage === 'lock-confirmation') {
    const 本人操作 = 含任一(文本, ['自己', '本人', '亲自', '自愿']);
    const 锁具动作 = 含任一(文本, ['戴锁', '上锁', '锁好', '扣好', '装好', '戴好', '把锁戴']);
    const 提前正向同意 =
      /(?:已经|也|并且|还).{0,6}(?:同意|答应|愿意|接受).{0,8}(?:看|观看|录像|片子|带子)/u.test(文本) &&
      !含任一(文本, ['还没同意', '尚未同意', '没有同意', '没答应', '不代表同意', '还没有替他答应']);
    return 本人操作 && 锁具动作 && !提前正向同意;
  }

  const 明确同意 = 含任一(文本, [
    '明确同意',
    '已经同意',
    '本人同意',
    '答应观看',
    '愿意观看',
    '接受观看',
    '答应看',
    '愿意看',
  ]);
  const 观看对象 = 含任一(文本, ['观看', '录像', '片子', '带子', '看这盘', '看完整']);
  const 否定同意 = 含任一(文本, ['不同意', '没同意', '尚未同意', '没有同意', '不愿意', '拒绝', '没答应']);
  return 明确同意 && 观看对象 && !否定同意;
}

/** 弱模型气泡未通过语义验收时使用；只补当前卡，不越过停止边界。 */
export function 录像带V4微信卡安全兜底(卡: 录像带V4微信卡): string {
  if (卡.stage === 'lock-confirmation') {
    return `${卡.husband}已经自己把锁戴好。观看安排我还没有替他答应，你可以再问我。`;
  }
  if (卡.stage === 'watch-consent') {
    return `我已经把录像内容和现场条件说清，${卡.husband}本人听懂后明确同意观看。另一边确认完，我们再一起出发。`;
  }
  return '两边的戴锁与观看同意都确认好了，我们现在出发。你直接点击“监控”，系统会自动切到302并打开观看界面。';
}

function 校验已安装等待发布(名称: string, 值: { installed: boolean; productionUnlocked: boolean }): void {
  if (值.installed !== true || 值.productionUnlocked !== false) {
    throw new Error(`${名称}必须已完成本地安装，并在不可变素材标签发布前保持 productionUnlocked=false`);
  }
}

export function 校验录像带V4机器契约(): true {
  if (录像带V4候选清单.schemaVersion !== 'rqgy-vtr-v4-final-candidates-manifest-v2') {
    throw new Error('录像带V4候选清单版本不匹配');
  }
  if (录像带V4产品清单.schemaVersion !== 'rqgy-vtr-v4-product-manifest-v1') {
    throw new Error('录像带V4产品清单版本不匹配');
  }
  if (镜头卡清单.schemaVersion !== 'rqgy-vtr-v4-shot-cards-v8') throw new Error('录像带V4镜头卡版本不匹配');
  if (录像带V4上下文策略.schemaVersion !== 'rqgy-vtr-v4-context-isolation-policy-v1') {
    throw new Error('录像带V4上下文策略版本不匹配');
  }
  if (录像带V4监控覆盖层契约.schemaVersion !== 'rqgy-vtr-v4-monitor-overlay-contract-v1') {
    throw new Error('录像带V4监控覆盖层契约版本不匹配');
  }
  if (录像带V4微信前置契约.schemaVersion !== 'rqgy-vtr-v4-wechat-prelude-v2') {
    throw new Error('录像带V4微信前置契约版本不匹配');
  }
  if (
    录像带V4候选清单.count !== 38 ||
    录像带V4候选清单.records.length !== 38 ||
    录像带V4候选清单.uniqueOutputSha256 !== 38 ||
    录像带V4候选清单.productCount !== 38 ||
    录像带V4候选清单.uniqueProductSha256 !== 38 ||
    录像带V4产品清单.runtimeSlots !== 38 ||
    录像带V4产品清单.acceptedFiles !== 38 ||
    录像带V4产品清单.items.length !== 38 ||
    镜头卡清单.count !== 38 ||
    录像带V4镜头卡们.length !== 38
  ) {
    throw new Error('录像带V4候选、产品或镜头卡数量不是38');
  }
  if (录像带V4候选清单.formalAccepted !== true) throw new Error('录像带V4候选尚未得到用户正式接受');
  if (录像带V4产品清单.status !== 'product-webp-ready-awaiting-external-publish') {
    throw new Error('录像带V4产品清单状态不匹配');
  }
  if (录像带V4产品清单.format !== 'webp' || 录像带V4产品清单.publish.immutableTag !== '') {
    throw new Error('录像带V4必须使用WebP产品，并在外部发布前保持不可变标签为空');
  }
  if (
    录像带V4候选清单.productManifest !== 'src/人妻公寓/素材/特殊场景/录像带V4/录像带V4CG.manifest.json' ||
    镜头卡清单.productManifest !== 录像带V4候选清单.productManifest ||
    镜头卡清单.productManifestSha256 !== 录像带V4候选清单.productManifestSha256 ||
    录像带V4产品清单.publish.runtimeDirectory !== 'src/人妻公寓/素材/特殊场景/录像带V4' ||
    录像带V4产品清单.publish.globalPreviewOverride !== '__RQGY_VTR_V4_ASSET_BASE__'
  ) {
    throw new Error('录像带V4产品目录或预览基址契约不匹配');
  }
  const 有意复用旧像素 = ['VTR-V4-102-B01', 'VTR-V4-202-B01', 'VTR-V4-102-B17', 'VTR-V4-202-B17'];
  if (
    录像带V4产品清单.userAcceptance.decision !== 'all_38_v4_candidates_retained' ||
    JSON.stringify(录像带V4产品清单.userAcceptance.intentionalLegacyPixelReuseIds) !== JSON.stringify(有意复用旧像素)
  ) {
    throw new Error('录像带V4用户确认或四张有意复用旧像素记录不匹配');
  }
  校验已安装等待发布('录像带V4候选清单', 录像带V4候选清单);
  校验已安装等待发布('录像带V4镜头卡', 镜头卡清单);
  校验已安装等待发布('录像带V4上下文策略', 录像带V4上下文策略);
  校验已安装等待发布('录像带V4监控覆盖层契约', 录像带V4监控覆盖层契约);
  校验已安装等待发布('录像带V4微信前置契约', 录像带V4微信前置契约);

  const ids = new Set<string>();
  const 源哈希们 = new Set<string>();
  const 产品哈希们 = new Set<string>();
  for (const 房间 of ['102', '202'] as const) {
    for (let 幕次 = 1; 幕次 <= 19; 幕次 += 1) {
      const 候选 = 读取录像带V4候选(房间, 幕次);
      const 产品 = 读取录像带V4产品(房间, 幕次);
      const 卡 = 读取录像带V4镜头卡(房间, 幕次);
      if (!候选 || !产品 || !卡) throw new Error(`录像带V4缺少 ${房间} 第${幕次}幕`);
      if (
        候选.id !== 产品.id ||
        候选.id !== 卡.id ||
        候选.outputSha256.toUpperCase() !== 产品.sourceSha256.toUpperCase() ||
        候选.outputSha256.toUpperCase() !== 卡.imageSha256.toUpperCase() ||
        候选.productSha256.toUpperCase() !== 产品.productSha256.toUpperCase() ||
        候选.productSha256.toUpperCase() !== 卡.productImageSha256.toUpperCase() ||
        候选.productFile !== 产品.productFile ||
        候选.productPath !== 卡.productImage ||
        候选.productPath !== `${录像带V4产品清单.publish.runtimeDirectory}/${产品.productFile}` ||
        产品.width !== 1536 ||
        产品.height !== 1024 ||
        产品.productBytes <= 0 ||
        产品.productBytes >= 产品.sourceBytes
      ) {
        throw new Error(`录像带V4候选、产品与镜头卡不一致：${房间} 第${幕次}幕`);
      }
      if (!候选.userConfirmed || !候选.formalAccepted || !候选.installed || 候选.productionUnlocked) {
        throw new Error(`录像带V4候选安装状态不一致：${房间} 第${幕次}幕`);
      }
      if (!卡.userConfirmed || !卡.installed) throw new Error(`录像带V4镜头卡尚未安装：${房间} 第${幕次}幕`);
      if (ids.has(候选.id)) throw new Error(`录像带V4候选ID重复：${候选.id}`);
      if (源哈希们.has(候选.outputSha256.toUpperCase())) throw new Error(`录像带V4候选哈希重复：${候选.outputSha256}`);
      if (产品哈希们.has(产品.productSha256.toUpperCase()))
        throw new Error(`录像带V4产品哈希重复：${产品.productSha256}`);
      ids.add(候选.id);
      源哈希们.add(候选.outputSha256.toUpperCase());
      产品哈希们.add(产品.productSha256.toUpperCase());
    }
  }
  if (录像带V4微信前置契约.wechat.cards.length !== 6) throw new Error('录像带V4微信卡数量不是6');
  for (const 房间 of ['102', '202'] as const) {
    for (const 阶段 of ['lock-confirmation', 'watch-consent', 'departure-ready'] as const) {
      if (!读取录像带V4微信卡(房间, 阶段)) throw new Error(`录像带V4缺少微信卡 ${房间}:${阶段}`);
    }
  }
  if (
    录像带V4监控覆盖层契约.coverage.candidateCount !== 38 ||
    录像带V4监控覆盖层契约.coverage.exceptions.length !== 0 ||
    录像带V4监控覆盖层契约.assetPolicy.rawPngOverlayBaked !== false ||
    录像带V4监控覆盖层契约.assetPolicy.runtimeOverlayRequired !== true
  ) {
    throw new Error('录像带V4监控覆盖层覆盖范围不完整');
  }
  return true;
}

// 模块一旦被生产路径引用就立即失败关闭；这只读取冻结JSON，不会修改候选状态或源图片。
校验录像带V4机器契约();
