import type { SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 查考古, 门牌列表 } from '../../stageConfig';
import { 丈夫在楼, 妻位置推算, 当前时段, seededRandom } from './楼层时钟';
import { 读取最近有效, 读最近有效stat, 脚本写入 } from './mvuIO';
import { 妻状态包 } from './snapshotSystem';
import { 捕获保护快照 } from './守护系统';
import { 姐妹群成员, 雌竞火气, 雌竞资格, 读余波, 标余波, 余波缓冲楼 } from './雌竞系统';
import { Schema } from '../../schema';
import {
  安装人妻公寓数据库模板,
  打开数据库界面,
  打开数据库设置,
  读取数据库API预设名,
  数据库状态,
  通过数据库生成,
} from './数据库桥';

/**
 * 手机系统(P4:手机开机即微信,2026-07-18 用户拍板——不做主屏与独立App,
 * 底签 微信/朋友圈/我;动态集成朋友圈混排,点头像进"她的相册"=考古层,API设置藏"我")
 * 外观=柚月小手机(yuzuki, github.com/gaigai315/yuzuki-phone)授权砍装:华为全面屏壳/
 * 药丸双摄/状态栏 同构复刻;挂载范式参考玉子手机(yuzi83)。经双授权改造,谨此致谢。
 *
 * 挂载:注入酒馆页面文档(window.parent)——与游戏卡片 iframe 平级的独立手机(用户拍板,
 * 非游戏内浮层);玉子同款防重复加载。游戏界面只有"跳动来电指示/红点",点击唤起本机。
 *
 * 数据:chat 变量 `_微信`(跟档案走,不塞 MVU 防楼层快照膨胀);每条消息/动态带楼层戳,
 * 渲染按当前楼过滤——回档=微信也回到那一天。`_`与裸数值不进生成提示词(数据隔离照守)。
 *
 * 生成路由:默认优先调用数据库插件公开 callAI,无插件才用正文 generateRaw；玩家也可强制
 * 正文或配置独立 OpenAI 兼容 API。生成不占楼层；内容只传档位标签,不传裸数值。
 */

// ============================================
// 数据(chat 变量 _微信)
// ============================================

export interface 微信消息 {
  楼: number; // 楼层戳(真实楼层;渲染按 ≤当前末楼 过滤=回档跟随)
  会话: string; // 门牌 | '父亲' | '群'
  发: '我' | '对方' | '系统';
  文: string;
  类?: '文本' | '照片' | '撤回' | '通话';
}

export interface 朋友圈条 {
  楼: number;
  谁: string; // 妻名 | '附近的人'
  文: string;
  评: { 谁: string; 文: string }[];
  /** 配图(2026-07-19 用户拍板):`{妻名}/{类}_{n}` → 素材基址/微信圈/…webp;
   *  AI 只用 [图:类] marker 选类型,选哪张归脚本;图不存在 onerror 自净=图库可后补 */
  图?: string;
  /** 脚本预选主题，用于跨角色/跨回合去重；旧存档没有该字段时可从图片路径推断。 */
  题?: 朋友圈主题;
  /** 仅你可见(P5;spec:L4解锁低频,公开流永远贤妻——这条只有玩家刷得到);
   *  图走独立池 素材基址/微博/仅你可见/{角色}_{n}.webp(档位=堕落分档,母亲最厚1~5) */
  私?: { 图序: number };
}

interface 微信库 {
  消息: 微信消息[];
  圈: 朋友圈条[];
  读到: Record<string, number>; // 会话 → 已读到的楼层戳
  圈读到: number;
  节拍: Record<string, number>; // 内容引擎水位线(`圈:${门牌}`/`私:${门牌}`/`群`)
}

function 读库(): 微信库 {
  const v = (_.get(getVariables({ type: 'chat' }), '_微信') ?? {}) as Partial<微信库>;
  return { 消息: v.消息 ?? [], 圈: v.圈 ?? [], 读到: v.读到 ?? {}, 圈读到: v.圈读到 ?? -1, 节拍: v.节拍 ?? {} };
}

async function 写库(库: 微信库): Promise<void> {
  await insertOrAssignVariables({ _微信: 库 }, { type: 'chat' });
}

const 末楼 = () => {
  try {
    return getLastMessageId();
  } catch {
    return Math.max(0, (SillyTavern.chat?.length ?? 1) - 1);
  }
};

async function 限时请求(url: string, init: RequestInit, 毫秒 = 20000): Promise<Response> {
  const 控制器 = new AbortController();
  const 计时 = setTimeout(() => 控制器.abort(), 毫秒);
  try {
    return await fetch(url, { ...init, signal: 控制器.signal });
  } finally {
    clearTimeout(计时);
  }
}

// ============================================
// 手机配置(localStorage:AI来源 + 独立API + 动态频率总闸)
// ============================================

type 手机AI来源 = '自动' | '数据库' | '正文' | '自定义';

interface 手机配置 {
  ai来源: 手机AI来源;
  数据库预设: string;
  数据库失败回退: boolean;
  base: string;
  key: string;
  model: string;
  频率: '勤' | '普通' | '静' | '关';
}

const 配置KEY = '人妻公寓_手机配置';

function 读配置(): 手机配置 {
  const 默认: 手机配置 = {
    ai来源: '自动',
    数据库预设: '',
    数据库失败回退: false,
    base: '',
    key: '',
    model: '',
    频率: '普通',
  };
  try {
    const root = (window.parent ?? window) as Window;
    const raw = root.localStorage?.getItem(配置KEY);
    if (raw) {
      const 旧 = JSON.parse(raw) as Partial<手机配置>;
      // 0.27 及以前只有独立 API 三件套；已有完整配置的玩家迁移后继续走自定义 API。
      const 迁移来源: 手机AI来源 = 旧.ai来源 ?? (旧.base && 旧.key && 旧.model ? '自定义' : '自动');
      return { ...默认, ...旧, ai来源: 迁移来源 };
    }
  } catch {
    /* 读取失败走默认 */
  }
  return 默认;
}

function 存配置(c: 手机配置): void {
  try {
    ((window.parent ?? window) as Window).localStorage?.setItem(配置KEY, JSON.stringify(c));
  } catch {
    /* 存储失败静默 */
  }
}

// ============================================
// 手机 AI 路由(默认数据库优先；无插件才用正文API；也可强制正文或自定义)
// ============================================

/** 玩家名(酒馆 persona 名;手机生成不知道玩家叫啥时会自创"王师傅"式称呼——一律显式传入) */
function 玩家名(): string {
  return (SillyTavern as unknown as { name1?: string })?.name1 || '管理员';
}

function 称呼纪律(): string {
  return `对方是公寓管理员,名叫"${玩家名()}"——称呼他只能用"${玩家名()}"或"管理员"(关系近了可用由这个名字自然衍生的昵称),严禁臆造别的姓氏或称呼(如"王师傅/李哥")。`;
}

/** 家庭事实(2026-07-18 用户实测:夏乔在手机里把老公名字搞混)——提到丈夫只许用配置里的名 */
function 家庭事实(m: 门牌): string {
  const 夫 = 户静态表[m]?.夫名;
  return 夫 ? `她的丈夫叫"${夫}"——提到丈夫只能用这个名字,严禁写错或换成别人。` : '';
}

/** 口吻连续性纪律(2026-07-18 用户拍板:治"现实冷漠微信热情"的人格分裂) */
const 口吻纪律 =
  '口吻连续性:微信里的她必须和现实中的态度连续——现实里冷淡,微信就不许热络(已读慢回/句子短/敷衍都可以演);隔着屏幕可以比当面稍微放得开一点点,但绝不能像换了个人。';

// ── 世界书人设注入(2026-07-19 用户拍板:微信里她得"是她自己") ──
// 只给该妻自己的条目(数据隔离);外貌/穿衣段与微信无关,剥掉省token;
// 朋友圈刻意不接(公开流永远贤妻=设计);世界书游戏内静态,进程级缓存一次就够
const _人设缓存 = new Map<string, string>();

/** 从角色卡主世界书抽该妻人设YAML(剥外貌段+截长);拿不到返回空串,微信照旧不降级 */
async function 妻人设(m: 门牌): Promise<string> {
  const 妻名 = 户静态表[m]?.妻名;
  if (!妻名) return '';
  const 缓存 = _人设缓存.get(妻名);
  if (缓存 !== undefined) return 缓存;
  let 出 = '';
  try {
    const { primary } = getCharWorldbookNames('current');
    if (primary) {
      const 条目 = (await getWorldbook(primary)).find(e => e.enabled && e.name.includes(妻名));
      if (条目?.content) {
        出 = 条目.content
          // 剥外貌大段(顶格两空格缩进的段头到下一同级段头;YAML结构=角色卡格式约定)
          .replace(/^ {2}外貌特征:[\s\S]*?(?=^ {2}\S)/m, '')
          .trim();
        if (出.length > 3000) 出 = 出.slice(0, 3000) + '\n(人设节选)';
      }
    }
  } catch (e) {
    console.warn('[人妻公寓·手机] 读取世界书人设失败(微信照常,仅少人设):', e);
  }
  _人设缓存.set(妻名, 出);
  return 出;
}

/** 人设段包装:拼进微信prompt;人设=底色,当前状态数据永远是唯一权威 */
async function 人设段(m: 门牌): Promise<string> {
  const 设 = await 妻人设(m);
  return 设 ? `\n她的人设(性格与说话方式的底色;她此刻的真实状态以状态数据为唯一权威):\n${设}\n` : '';
}

/** 最近正文尾巴(截末段~300字,让微信接得上现实里刚发生的事;0楼占位/协议标签自然被净化剔掉) */
function 最近正文(): string {
  try {
    const chat = (SillyTavern as unknown as { chat?: { mes?: string; is_user?: boolean }[] }).chat ?? [];
    for (let i = chat.length - 1; i >= 0; i--) {
      if (!chat[i]?.is_user && chat[i]?.mes) {
        const 文 = 净化消息(String(chat[i].mes)).replace(/\s+/g, ' ').trim();
        if (文) return 文.slice(-300);
      }
    }
  } catch {
    /* 读不到就不带 */
  }
  return '';
}

/**
 * 手机消息净化(2026-07-18 用户实测:回复里长出 <行为等级>1</行为等级>)——
 * 独立API若走的是带破限注入的代理,模型会把主预设的协议标签/思维链原样吐进微信消息;
 * 手机侧不吃任何协议,一律剥干净只留人话。
 */
function 净化消息(原: string): string {
  return 原
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    .replace(/<options>[\s\S]*?<\/options>/gi, '')
    .replace(/<变量更新>[\s\S]*?<\/变量更新>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<\/?[a-zA-Z一-龥][^>]*>/g, '')
    .trim();
}

async function 正文API生成(系统提示: string, 用户提示: string): Promise<string> {
  try {
    const 原 = await generateRaw({
      ordered_prompts: [{ role: 'system', content: 系统提示 }, 'user_input'],
      user_input: 用户提示,
      should_stream: false,
    });
    return 净化消息(String(原 ?? ''));
  } catch (e) {
    console.warn('[人妻公寓·手机] 正文API生成失败,本拍跳过:', e);
    return '';
  }
}

async function 自定义API生成(c: 手机配置, 系统提示: string, 用户提示: string): Promise<string> {
  if (!c.base || !c.key || !c.model) {
    console.warn('[人妻公寓·手机] 自定义API配置不完整,本拍跳过。');
    return '';
  }
  try {
    const res = await 限时请求(`${c.base.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.key}` },
      body: JSON.stringify({
        model: c.model,
        messages: [
          { role: 'system', content: 系统提示 },
          { role: 'user', content: 用户提示 },
        ],
        max_tokens: 600,
        temperature: 0.9,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return 净化消息(j.choices?.[0]?.message?.content?.trim() ?? '');
  } catch (e) {
    console.warn('[人妻公寓·手机] 自定义API失败,本拍跳过:', e);
    return '';
  }
}

async function 小生成(系统提示: string, 用户提示: string): Promise<string> {
  const c = 读配置();
  if (c.ai来源 === '自定义') return 自定义API生成(c, 系统提示, 用户提示);
  if (c.ai来源 === '正文') return 正文API生成(系统提示, 用户提示);

  const db = 数据库状态();
  if (db.可调用AI) {
    try {
      const 原 = await 通过数据库生成(
        [
          { role: 'system', content: 系统提示 },
          { role: 'user', content: 用户提示 },
        ],
        c.数据库预设,
        600,
      );
      const 文 = 净化消息(String(原 ?? ''));
      if (文) return 文;
      throw new Error('数据库API返回空内容');
    } catch (e) {
      console.warn('[人妻公寓·手机] 数据库API调用失败:', e);
      // 默认不二次请求，避免数据库请求其实已计费/仍在执行时又调用正文API。
      if (c.ai来源 === '自动' && c.数据库失败回退) return 正文API生成(系统提示, 用户提示);
      return '';
    }
  }

  if (c.ai来源 === '数据库') {
    console.warn('[人妻公寓·手机] 已强制使用数据库，但未检测到公开 callAI 接口。');
    return '';
  }
  // 自动模式只在数据库能力不存在时无缝使用正文 API。
  return 正文API生成(系统提示, 用户提示);
}

// ============================================
// 好友表(联系方式=挣来的剧情资产:妻 阶段≥1 才互加;父亲/楼群常驻)
// ============================================

export function 微信好友(data: SchemaType): { id: string; 名: string; 类: '妻' | '父亲' | '群' }[] {
  const 友: { id: string; 名: string; 类: '妻' | '父亲' | '群' }[] = [{ id: '父亲', 名: '爸', 类: '父亲' }];
  for (const m of 门牌列表) {
    const 节点 = data.户[m];
    const 配 = 户静态表[m];
    if (!节点 || (配.隐身 && !data.系统._母亲入列)) continue;
    if (节点.妻.当前阶段 >= 1) 友.push({ id: m, 名: 配.妻名, 类: '妻' });
  }
  // 姐妹茶话会(2026-07-19 用户拍板):阶段3+的太太≥2人自动成群并把{{user}}拉进去;
  // 没有丈夫没有外人=骂战/拌嘴/攀比都在这;楼务群永远和睦(贤妻公开流)
  if (姐妹群成员(data).length >= 2) 友.push({ id: '姐妹群', 名: '姐妹茶话会', 类: '群' });
  友.push({ id: '群', 名: '梧桐里7号楼务群', 类: '群' });
  return 友;
}

// 快照侧联系方式行由 snapshotSystem 自行内联计算(同一判据:妻阶段≥1),避免模块环

// ============================================
// 内容引擎(近期流 v1 + 主动消息 v1 + 群聊 v1;回合完成后节拍驱动,全异步不占楼)
// ============================================

const 频率倍率: Record<手机配置['频率'], number> = { 勤: 0.6, 普通: 1, 静: 2, 关: Infinity };

/** 〔调参〕朋友圈图库每类张数(命名约定 素材/微信圈/{妻名}/{类}_{1..N}.webp) */
const 圈图每类张数 = 3;

type 朋友圈主题 = '美食' | '自拍' | '居家' | '窗外' | '购物' | '追剧' | '楼务';

/** 人物只是偏好不同，不把任何人锁死成单一生活标签。重复项代表轻权重。 */
const 发圈偏好: Record<门牌, 朋友圈主题[]> = {
  '101': ['楼务', '居家', '美食', '窗外', '楼务', '自拍'],
  '102': ['窗外', '居家', '追剧', '自拍', '窗外', '购物'],
  '201': ['购物', '自拍', '楼务', '居家', '购物', '美食'],
  '202': ['追剧', '居家', '窗外', '楼务', '美食', '追剧'],
  '301': ['自拍', '购物', '窗外', '追剧', '自拍', '楼务'],
  '302': ['居家', '美食', '楼务', '窗外', '居家', '追剧'],
};

const 主题提示: Record<朋友圈主题, string> = {
  美食: '主题已定为一顿具体但普通的吃喝；写食物、口味或一起吃饭的小插曲，避免精致摆拍腔。',
  自拍: '主题已定为本人出镜；可写发型、衣服、状态或出门前后的随手一拍，避免网红广告腔。',
  居家: '主题已定为居家生活；从收拾、洗晒、植物、宠物、修补或家里一个小麻烦中选一个具体切片。',
  窗外: '主题已定为窗外见闻；写天气、光线、楼下声音、路人或附近变化中的一个具体细节。',
  购物: '主题已定为购物或消费；可以是犹豫、踩雷、捡便宜、到货或缺货，不要写成带货文案。',
  追剧: '主题已定为休闲娱乐；从电视剧、短视频、音乐、游戏或睡前消遣中选一个具体片段。',
  楼务: '主题已定为公寓日常；写邻里、快递、停水、电梯、装修声、楼道或物业中的一件小事。',
};

function 圈主题(条?: 朋友圈条): 朋友圈主题 | undefined {
  if (条?.题) return 条.题;
  const 匹配 = 条?.图?.match(/\/(美食|自拍|居家|窗外|购物)_\d+$/);
  return 匹配?.[1] as 朋友圈主题 | undefined;
}

function 选发圈主题(库: 微信库, m: 门牌, 钟: number, 晒装: boolean): 朋友圈主题 {
  if (晒装) return '自拍';
  const 妻名 = 户静态表[m].妻名;
  const 上条个人 = 库.圈.find(x => x.谁 === 妻名 && !x.私);
  const 上题 = 圈主题(上条个人);
  const 近期题 = 库.圈
    .filter(x => !x.私)
    .slice(0, 4)
    .map(圈主题);
  const 时段 = 当前时段(钟);
  let 候选 = 发圈偏好[m].filter(x => x !== 上题);
  // 四条公开动态内最多一条美食；非饭点进一步降权，避免全楼跟着同一钟点晒饭。
  if (近期题.includes('美食') || !['早上', '中午', '晚上'].includes(时段)) 候选 = 候选.filter(x => x !== '美食');
  if (!候选.length) 候选 = ['居家', '窗外', '追剧', '楼务'];
  return 候选[Math.floor(seededRandom(钟, m, '朋友圈主题') * 候选.length)];
}

function 主题配图类(题: 朋友圈主题): '美食' | '自拍' | '居家' | '窗外' | '购物' | undefined {
  return ['美食', '自拍', '居家', '窗外', '购物'].includes(题)
    ? (题 as '美食' | '自拍' | '居家' | '窗外' | '购物')
    : undefined;
}

function 档位标签(阶段: number, 好感: number, 堕落: number): string {
  const 阶 = ['陌生', '贞淑', '动摇', '越界', '沉沦', '归属'][_.clamp(阶段, 0, 5)];
  const 感 = 好感 >= 60 ? '好感高' : 好感 >= 25 ? '好感中' : '好感浅';
  const 堕 = 堕落 >= 70 ? '堕落深' : 堕落 >= 35 ? '堕落中段' : '堕落浅';
  return `${阶}/${感}/${堕}`;
}

/** 回合完成后驱动一拍(fire-and-forget;每类内容独立水位线,种子错开相位) */
export async function 手机节拍(): Promise<void> {
  try {
    const rawStat = 读最近有效stat();
    if (!rawStat) return;
    const data = Schema.parse(rawStat) as SchemaType;
    if (data.系统._坏结局) return;
    const 倍 = 频率倍率[读配置().频率];
    if (!Number.isFinite(倍)) return;
    const 楼 = 末楼();
    const 钟 = 楼 + data.系统._时段偏移楼;
    const 库 = 读库();
    let 有新 = false;

    // ── 朋友圈近期流(每户 8~15 楼一条;一拍最多一条普通动态,避免同一时刻集体晒同类内容) ──
    const 普通到期 = 门牌列表.filter(m => {
      const 节点 = data.户[m];
      const 配 = 户静态表[m];
      if (!节点 || (配.隐身 && !data.系统._母亲入列)) return false;
      const 上次 = 库.节拍[`圈:${m}`] ?? -999;
      const 间隔 = Math.round((8 + Math.floor(seededRandom(m, '圈相位') * 8)) * 倍);
      return 钟 - 上次 >= 间隔;
    });
    const 本拍普通门牌 = 普通到期.length
      ? 普通到期[Math.floor(seededRandom(钟, '本拍发圈人') * 普通到期.length)]
      : undefined;
    for (const m of 门牌列表) {
      const 节点 = data.户[m];
      const 配 = 户静态表[m];
      if (!节点 || (配.隐身 && !data.系统._母亲入列)) continue;
      const 键 = `圈:${m}`;
      // 晒装拍(换装余波·2026-07-19):她得了外显新东西,缓冲后忍不住发圈晒(不点名);私密件不走公开流
      const 波 = 读余波(楼);
      const 晒装 = !!波 && 波.门牌 === m && !波.私密 && !波.圈晒 && 楼 - 波.起楼 >= 2 && 节点.妻.当前阶段 >= 3;
      if (!晒装 && m !== 本拍普通门牌) continue;
      库.节拍[键] = 钟;
      const 妻 = 节点.妻;
      const 题 = 选发圈主题(库, m, 钟, 晒装);
      const 原文 = await 小生成(
        '你替一款都市题材游戏生成一条中国已婚女性发的微信朋友圈文案。只输出文案本身(可含emoji),不超过60字,不要引号,不要解释。' +
          '纪律:按人物状态微调语气;绝不提及任何秘密、暧昧对象或游戏机制;不要输出图片标记或主题名。' +
          主题提示[题],
        `人物:${配.妻名},${配.初始?.气质描述 ?? '一位住在老公寓里的太太'}。${家庭事实(m)}当前状态档:${档位标签(妻.当前阶段, 妻.好感值, 妻.堕落值)};时段:${当前时段(钟)}。` +
          (晒装
            ? `她刚得了样新东西(${波!.物.replace(配.妻名, '')}),写她晒而不点名的一条朋友圈；高兴藏不住，但绝不提东西是谁给的。`
            : '生成她此刻发的一条朋友圈。'),
      );
      // 主题与配图类型都由脚本决定，AI 只写文字；追剧/楼务保留纯文字，打散图片密度。
      const 文 = 原文.replace(/\s*\[图:[^\]]*\]\s*/g, ' ').trim();
      if (文) {
        let 图: string | undefined;
        const 类 = 主题配图类(题);
        if (类) {
          const 键2 = `圈图:${m}:${类}`;
          let 选 = 1 + Math.floor(seededRandom(钟, m, '圈图') * 圈图每类张数);
          if (选 === (库.节拍[键2] ?? 0)) 选 = (选 % 圈图每类张数) + 1; // 同类连发不重图
          库.节拍[键2] = 选;
          图 = `${配.妻名}/${类}_${选}`;
        }
        const 条 = { 楼, 谁: 配.妻名, 文, 题, 评: [] as { 谁: string; 文: string }[], ...(图 ? { 图 } : {}) };
        库.圈.unshift(条);
        有新 = true;
        // 晒装的评论区=阴阳怪气主战场(换装余波扩展4):其他够格太太来1~2条表面客气的酸话
        if (晒装) {
          标余波({ 圈晒: true });
          const 评者 = (Object.keys(data.户) as 门牌[]).filter(x => x !== m && 雌竞资格(x, data.户[x]));
          if (评者.length) {
            const 评原 = await 小生成(
              '你替一款都市题材游戏生成微信朋友圈的评论。输出1~2行,每行格式"评论人:内容",内容不超过20字,表面客气实则阴阳怪气(酸/探/捧杀任选),不要引号不要解释。评论人只能从名单里选。',
              `动态(${配.妻名}发的):${文}\n可评论的人与各自路数:\n${评者.map(x => `${户静态表[x].妻名}(${户静态表[x].雌竞})`).join('\n')}`,
            );
            const 名集 = new Set(评者.map(x => 户静态表[x].妻名));
            for (const 行 of (评原 ?? '').split('\n')) {
              const mm = 行.trim().match(/^([^::]{1,8})[::]\s*(.+)$/);
              if (mm && 名集.has(mm[1])) 条.评.push({ 谁: mm[1], 文: mm[2] });
            }
          }
        }
      }
    }

    // ── 主动消息 v1(门槛表:L1~L2 偶发日常有借口 / L3 夜间试探+撤回 / L4 照片 / L5 随叫随到) ──
    for (const m of 门牌列表) {
      const 节点 = data.户[m];
      const 配 = 户静态表[m];
      if (!节点 || (配.隐身 && !data.系统._母亲入列) || 节点.妻.当前阶段 < 1) continue;
      const 键 = `私:${m}`;
      const 上次 = 库.节拍[键] ?? -999;
      const 阶段 = 节点.妻.当前阶段;
      const 基础间隔 = 阶段 >= 4 ? 10 : 阶段 >= 3 ? 14 : 20;
      if (钟 - 上次 < Math.round(基础间隔 * 倍)) continue;
      if (seededRandom(钟, m, '主动消息') > (阶段 >= 4 ? 0.5 : 0.3)) continue;
      库.节拍[键] = 钟;
      const 时段名 = 当前时段(钟);
      const 深夜档 = 阶段 === 3 && (时段名 === '晚上' || 时段名 === '深夜');
      const 撤回 = 深夜档 && seededRandom(钟, m, '撤回') < 0.4;
      if (撤回) {
        库.消息.push({ 楼, 会话: m, 发: '对方', 文: '', 类: '撤回' });
        有新 = true;
      } else {
        const 方向 =
          阶段 >= 5
            ? '大胆直接,毫不掩饰想念与归属感'
            : 阶段 >= 4
              ? '主动找借口约见/撒娇,可暗示"只给你看"'
              : 深夜档
                ? '夜里睡不着的试探,话说一半,欲言又止'
                : '找一个日常借口搭话(报修/快递/楼里琐事),借口本身站得住';
        const 文 = await 小生成(
          '你替一款都市题材游戏生成一条中国已婚女性发给公寓管理员的微信消息。只输出消息文本(口语,可含emoji),不超过40字,不要引号。',
          `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${家庭事实(m)}${妻状态包(m, data)}${await 人设段(m)}时段:${时段名}。消息方向:${方向}。${称呼纪律()}${口吻纪律}`,
        );
        if (文) {
          库.消息.push({ 楼, 会话: m, 发: '对方', 文 });
          有新 = true;
        }
      }
    }

    // ── 群聊 v1(安静是常态;风闻到档=含沙射影;换装余波=和睦探针) ──
    {
      const 上次 = 库.节拍['群'] ?? -999;
      const 间隔 = Math.round(30 * 倍);
      // 探针(换装余波扩展3):表面夸奖实则探路——丈夫们看着是邻里客气;私密件不走这口
      const 波2 = 读余波(楼);
      const 探针到点 = !!波2 && !波2.私密 && !波2.探针 && 楼 - 波2.起楼 >= 余波缓冲楼;
      if (钟 - 上次 >= 间隔 && (探针到点 || seededRandom(钟, '群聊') < (data.风闻 >= 50 ? 0.6 : 0.25))) {
        库.节拍['群'] = 钟;
        const 在群 = 微信好友(data).filter(f => f.类 === '妻');
        const 谁 = 在群.length ? 在群[Math.floor(seededRandom(钟, '群谁') * 在群.length)].名 : '';
        const 文 = await 小生成(
          '你替一款都市题材游戏生成一条老公寓楼务微信群里的群聊消息。只输出"发言人:内容"一行,内容不超过30字。',
          (探针到点
            ? `群成员:${在群.map(f => f.名).join('、') || '楼里太太们'}。最近${波2!.物},生成一条表面夸奖实则探来路的群消息("真好看,新买的呀?"这个方向,但别照抄),发言人从${
                波2!.门牌
                  ? 在群
                      .filter(f => f.名 !== 户静态表[波2!.门牌].妻名)
                      .map(f => f.名)
                      .join('、') || '太太们'
                  : '太太们'
              }里选。`
            : data.风闻 >= 50
              ? `群成员:${在群.map(f => f.名).join('、') || '楼里太太们'}。楼里最近闲话多(有人留意管理员的行踪),生成一条含沙射影但不点名的群消息${谁 ? `,发言人=${谁}` : ''}。`
              : `群成员:${在群.map(f => f.名).join('、') || '楼里太太们'}。生成一条最寻常的楼务群消息(报修/取快递/天气),发言人任选${谁 ? `(建议${谁})` : ''}。`) +
            称呼纪律() +
            `夫妻名册(提到谁家丈夫只能用这些名字):${门牌列表
              .filter(m => !户静态表[m].隐身 && 户静态表[m].夫名)
              .map(m => `${户静态表[m].妻名}的丈夫=${户静态表[m].夫名}`)
              .join(',')}。`,
        );
        if (文) {
          if (探针到点) 标余波({ 探针: true });
          库.消息.push({ 楼, 会话: '群', 发: '对方', 文 });
          有新 = true;
        }
      }
    }

    // ── 仅你可见(P5;L4解锁,低频=物以稀为贵;公开流永远贤妻,这一条只有你刷得到) ──
    for (const m of 门牌列表) {
      const 节点 = data.户[m];
      const 配 = 户静态表[m];
      if (!节点 || (配.隐身 && !data.系统._母亲入列) || 节点.妻.当前阶段 < 4) continue;
      const 键 = `私见:${m}`;
      const 上次 = 库.节拍[键] ?? -999;
      if (钟 - 上次 < Math.round(28 * 倍)) continue;
      if (seededRandom(钟, m, '仅你可见') > 0.3) continue;
      库.节拍[键] = 钟;
      const 妻 = 节点.妻;
      // 档位=堕落分档(五妻1~3;母亲1~5=最终boss奖励最厚)
      const 上限 = m === '302' ? 5 : 3;
      const 图序 = Math.min(上限, 1 + Math.floor((妻.堕落值 / 100) * 上限));
      const 首条 = !库.圈.some(c => c.谁 === 配.妻名 && c.私);
      const 文 = await 小生成(
        '你替一款成人向游戏生成一条已婚女性发的"仅你可见"朋友圈文案(只有情人一个人刷得到的那种)。只输出文案本身,不超过40字,不要引号。' +
          '方向:她不能公开的那一面——没头没尾的想念/穿着他送的东西/一句只有他懂的话;可以露骨但要像她本人。',
        `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${妻状态包(m, data)}${await 人设段(m)}生成这条只给他看的动态。`,
      );
      if (文) {
        库.圈.unshift({ 楼, 谁: 配.妻名, 文, 评: [], 私: { 图序 } });
        有新 = true;
        if (首条) eventEmit('人妻公寓:提示', `📱 ${配.妻名}发了一条「仅你可见」的动态`);
      }
    }

    // ── 姐妹群主动拍(阶段3+小群;2026-07-19 用户拍板提频:8楼×倍率65%;骂战拌嘴带记忆) ──
    {
      const 上次 = 库.节拍['姐妹群'] ?? -999;
      // 换装余波议论(缓冲后必聊一轮,不受频率门):私密件走"藏不住的春光"路线
      const 波3 = 读余波(楼);
      const 群议到点 = !!波3 && !波3.群议 && 楼 - 波3.起楼 >= 余波缓冲楼 && 姐妹群成员(data).length >= 2;
      if (群议到点) {
        const 妻名 = 户静态表[波3!.门牌].妻名;
        const 起因 = 波3!.私密
          ? `${妻名}最近那种藏不住的春光,大家都看在眼里——没人知道具体是什么,但女人的直觉不会错`
          : `${波3!.物},楼里都看见了——来路没人说得清`;
        if (await 姐妹群一拍(data, 库, 楼, 起因)) {
          标余波({ 群议: true });
          库.节拍['姐妹群'] = 钟;
          有新 = true;
        }
      } else if (钟 - 上次 >= Math.round(8 * 倍) && seededRandom(钟, '姐妹群拍') < 0.65) {
        if (await 姐妹群一拍(data, 库, 楼)) {
          库.节拍['姐妹群'] = 钟;
          有新 = true;
        }
      }
    }

    if (有新) {
      await 写库(库);
      刷新红点();
      渲染();
    }
  } catch (e) {
    console.error('[人妻公寓·手机] 节拍失败:', e);
  }
}

// ============================================
// 手机壳 UI(注入 window.parent 文档;玉子同款防重复;命名空间 #rq-phone)
// ============================================

const ROOT_ID = 'rq-phone-root';
// ⚠ 与 App.vue 素材基址同步：本轮测试发布 tag=rq0.30。
const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.30/dist/人妻公寓/素材';

let 当前页: {
  名: 'chats' | 'chat' | 'moments' | 'call' | 'talk' | 'settings';
  /** chat:单聊"+"面板是否展开(约出来入口) */
  加?: boolean;
  会话?: string;
  展开?: number; // moments:考古已加载条数(混排流)
  题?: string; // moments:展开中的"哪里不对劲?"(`门牌:序`)
} = { 名: 'chats' };
let 通话记录: { 谁: string; 文: string }[] = [];
let 通话上下文: { 分数段: string; 报表: string; 通牒: boolean } | null = null;

function 根文档(): Document {
  return (window.parent ?? window).document;
}

function el(tag: string, cls: string, html?: string): HTMLElement {
  const e = 根文档().createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

const 手机CSS = `
#${ROOT_ID}{position:fixed;right:18px;bottom:76px;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","HarmonyOS Sans","Segoe UI",Roboto,"Noto Sans SC",sans-serif;color:#111;color-scheme:light;text-shadow:none;}
/* 手机挂在酒馆父页面，部分深色主题会用 -webkit-text-fill-color 给所有表单和文字染成浅白色。
   在命名空间内恢复为各元素自己的 color，避免白底白字，同时保留通话页/绿色按钮等原有白字。 */
#${ROOT_ID},#${ROOT_ID} *{box-sizing:border-box;margin:0;padding:0;-webkit-text-fill-color:currentColor;}
#${ROOT_ID} .rqp-toggle{width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:#1a1c22;color:#fff;font-size:24px;box-shadow:0 6px 18px rgba(0,0,0,.35);position:relative;}
#${ROOT_ID} .rqp-toggle .dot{position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:#fa5151;display:none;}
#${ROOT_ID}.has-unread .rqp-toggle .dot{display:block;}
#${ROOT_ID}.ringing .rqp-toggle{animation:rqp-ring .6s ease-in-out infinite;}
@keyframes rqp-ring{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg) scale(1.06)}75%{transform:rotate(12deg) scale(1.06)}}
/* ── 手机壳(柚月小手机同款华为全面屏风:金属机身/药丸双摄/状态栏;yuzuki 授权改造) ── */
#${ROOT_ID} .rqp-shell{display:none;position:absolute;right:0;bottom:64px;width:min(320px,92vw);height:min(692px,80vh);background:#1a1a1a;border-radius:40px;padding:4px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 15px 50px rgba(0,0,0,.4),0 5px 20px rgba(0,0,0,.3);}
#${ROOT_ID}.open .rqp-shell{display:block;}
/* 手柄不放壳内:壳带transform自成层叠上下文,z-index再高也压不过后排的悬浮钮(2026-07-20
   玩家反馈:壳拖到和钮重叠后手柄被钮盖死)——改做钮的后排兄弟,永远浮在钮上;位置随壳右下角在应用位里算 */
#${ROOT_ID} .rqp-resize{display:none;position:absolute;right:-8px;bottom:56px;width:34px;height:34px;border-radius:50%;align-items:center;justify-content:center;background:rgba(26,28,34,.88);color:#9fb0c0;font-size:15px;box-shadow:0 4px 12px rgba(0,0,0,.35);cursor:nwse-resize;z-index:2;touch-action:none;user-select:none;}
#${ROOT_ID}.open .rqp-resize{display:flex;}
/* 滑入动画放内层屏幕:壳的 transform 留给拖动位移专用——动画接管壳transform会在
   结束瞬间跳回内联位移(2026-07-18 手机闪现即失真凶:动画期显示默认位,结束跳到屏外陈旧位移) */
#${ROOT_ID}.open .rqp-screen{animation:rqp-slidein .45s cubic-bezier(.4,0,.2,1);}
@keyframes rqp-slidein{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
#${ROOT_ID} .rqp-punch{position:absolute;top:12px;left:25px;width:44px;height:15px;background:#000;border-radius:9px;z-index:60;box-shadow:0 1px 3px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.05);}
#${ROOT_ID} .rqp-punch::before{content:'';position:absolute;top:50%;left:6px;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#1a3a52 0%,#0a1a2a 50%,#000 100%);box-shadow:0 0 2px rgba(26,77,122,.5),inset 0 1px 2px rgba(255,255,255,.15);}
#${ROOT_ID} .rqp-punch::after{content:'';position:absolute;top:50%;right:7px;transform:translateY(-50%);width:5px;height:5px;border-radius:50%;background:radial-gradient(circle,#2a2a2a 0%,#0a0a0a 100%);}
#${ROOT_ID} .rqp-status{position:absolute;top:8px;left:8px;right:8px;height:26px;display:flex;justify-content:space-between;align-items:center;padding:0 8px;z-index:55;pointer-events:none;font-weight:600;}
#${ROOT_ID} .rqp-status .tm{margin-left:66px;font-size:11px;letter-spacing:.3px;color:#000;}
#${ROOT_ID} .rqp-status .rt{display:flex;align-items:center;gap:4px;margin-right:6px;}
#${ROOT_ID} .rqp-status .bars{display:flex;align-items:flex-end;gap:1.5px;height:12px;}
#${ROOT_ID} .rqp-status .bars i{width:3px;background:#333;border-radius:1px;}
#${ROOT_ID} .rqp-status .bars i:nth-child(1){height:3px}#${ROOT_ID} .rqp-status .bars i:nth-child(2){height:5px}#${ROOT_ID} .rqp-status .bars i:nth-child(3){height:8px}#${ROOT_ID} .rqp-status .bars i:nth-child(4){height:11px}
#${ROOT_ID} .rqp-batt{width:12px;height:18px;border:1.5px solid #333;border-radius:3px;position:relative;display:flex;align-items:flex-end;overflow:hidden;}
#${ROOT_ID} .rqp-batt::before{content:'';position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:5px;height:2.5px;background:#333;border-radius:1px;}
#${ROOT_ID} .rqp-batt i{display:block;width:100%;height:78%;background:#4cd964;}
#${ROOT_ID} .rqp-screen{width:100%;height:100%;background:#ededed;border-radius:36px;overflow:hidden;display:flex;flex-direction:column;position:relative;padding-top:34px;}
/* ── 微信底部页签(手机开机即微信,2026-07-18 用户拍板;微信/朋友圈/我 三签) ── */
#${ROOT_ID} .rqp-tabs{flex:none;display:flex;background:#f7f7f7;border-top:.5px solid #ddd;}
#${ROOT_ID} .rqp-tabs button{flex:1;border:none;background:none;cursor:pointer;padding:7px 0 9px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:#7f7f7f;font-family:inherit;position:relative;}
#${ROOT_ID} .rqp-tabs button i{font-style:normal;font-size:20px;line-height:1;}
#${ROOT_ID} .rqp-tabs button.on{color:#07c160;}
#${ROOT_ID} .rqp-tabs button .dot{position:absolute;top:4px;right:26%;width:9px;height:9px;border-radius:50%;background:#fa5151;}
/* 朋友圈封面(壁纸作封面图,微信 moments 语法) */
#${ROOT_ID} .rqm-cover{height:132px;background:url('${素材基址}/界面/手机壁纸.webp') center/cover no-repeat,linear-gradient(160deg,#8fb8de,#c3a6d8);position:relative;margin-bottom:26px;}
#${ROOT_ID} .rqm-cover b{position:absolute;right:74px;bottom:-10px;color:#fff;font-size:15px;text-shadow:0 1px 4px rgba(0,0,0,.5);}
#${ROOT_ID} .rqm-cover .rqp-ava{position:absolute;right:12px;bottom:-22px;width:52px;height:52px;border-radius:8px;border:1.5px solid #fff;}
#${ROOT_ID} .rqp-head{flex:none;background:#ededed;padding:12px 14px 9px;display:flex;align-items:center;gap:8px;border-bottom:.5px solid #d9d9d9;}
#${ROOT_ID} .rqp-head b{font-size:16px;font-weight:600;color:#111;flex:1;text-align:center;}
#${ROOT_ID} .rqp-back{border:none;background:none;font-size:18px;cursor:pointer;color:#111;width:24px;font-weight:300;}
#${ROOT_ID} .rqp-gear{border:none;background:none;font-size:15px;cursor:pointer;color:#555;width:24px;}
#${ROOT_ID} .rqp-body{flex:1;overflow-y:auto;overscroll-behavior:contain;}
#${ROOT_ID} .rqp-body.chatlist{background:#fff;}
#${ROOT_ID} .rqp-row{display:flex;gap:11px;padding:10px 14px;background:#fff;cursor:pointer;align-items:center;position:relative;}
#${ROOT_ID} .rqp-row::after{content:'';position:absolute;left:71px;right:0;bottom:0;height:.5px;background:#e5e5e5;}
#${ROOT_ID} .rqp-row:active{background:#ececec;}
#${ROOT_ID} .rqp-ava{width:46px;height:46px;border-radius:4px;background:#c8cad0;flex:none;overflow:hidden;display:grid;place-items:center;font-weight:700;color:#fff;font-size:18px;}
#${ROOT_ID} .rqp-ava img{width:100%;height:100%;object-fit:cover;}
#${ROOT_ID} .rqp-row .mid{flex:1;min-width:0;}
#${ROOT_ID} .rqp-row .mid b{font-size:14.5px;font-weight:500;color:#111;display:block;}
#${ROOT_ID} .rqp-row .mid i{font-style:normal;font-size:12px;color:#9b9b9b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:200px;margin-top:2px;}
#${ROOT_ID} .rqp-row .dot{position:absolute;top:7px;left:50px;width:10px;height:10px;border-radius:50%;background:#fa5151;border:1.5px solid #fff;}
#${ROOT_ID} .rqp-bubbles{padding:12px 10px;display:flex;flex-direction:column;gap:12px;}
#${ROOT_ID} .rqp-line{display:flex;gap:9px;align-items:flex-start;}
#${ROOT_ID} .rqp-line.me{flex-direction:row-reverse;}
#${ROOT_ID} .rqp-line .rqp-ava{width:38px;height:38px;border-radius:4px;font-size:15px;}
#${ROOT_ID} .rqp-b{position:relative;max-width:72%;padding:8px 11px;border-radius:5px;font-size:13.5px;line-height:1.5;color:#111;word-break:break-word;}
#${ROOT_ID} .rqp-b.me{background:#95ec69;}
#${ROOT_ID} .rqp-b.me::after{content:'';position:absolute;top:13px;right:-5px;border-style:solid;border-width:5px 0 5px 6px;border-color:transparent transparent transparent #95ec69;}
#${ROOT_ID} .rqp-b.ta{background:#fff;}
#${ROOT_ID} .rqp-b.ta::before{content:'';position:absolute;top:13px;left:-5px;border-style:solid;border-width:5px 6px 5px 0;border-color:transparent #fff transparent transparent;}
#${ROOT_ID} .rqp-b.sys{align-self:center;background:none;color:#a8a8a8;font-size:11px;max-width:90%;}
#${ROOT_ID} .rqp-typing{display:flex;gap:4px;align-items:center;min-height:20px;}
#${ROOT_ID} .rqp-typing i{width:6px;height:6px;border-radius:50%;background:#b0b0b0;animation:rqp-tp 1.2s infinite;}
#${ROOT_ID} .rqp-typing i:nth-child(2){animation-delay:.2s;}
#${ROOT_ID} .rqp-typing i:nth-child(3){animation-delay:.4s;}
@keyframes rqp-tp{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
#${ROOT_ID} .rqp-input{flex:none;display:flex;gap:8px;padding:8px 10px;background:#f7f7f7;border-top:.5px solid #d9d9d9;align-items:flex-end;}
#${ROOT_ID} .rqp-input textarea{flex:1;resize:none;border:none;border-radius:4px;padding:8px 9px;font-size:13.5px;height:38px;font-family:inherit;background:#fff;color:#111!important;-webkit-text-fill-color:#111!important;caret-color:#111;opacity:1;}
#${ROOT_ID} .rqp-input textarea::placeholder{color:#8a8a8a!important;-webkit-text-fill-color:#8a8a8a!important;opacity:1;}
#${ROOT_ID} .rqp-input button{border:none;border-radius:4px;background:#07c160;color:#fff;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:500;}
#${ROOT_ID} .rqp-input button:disabled{opacity:.5;cursor:default;}
#${ROOT_ID} .rqp-plusbtn{border:none;background:none;font-size:24px;line-height:38px;color:#7a7a7a;cursor:pointer;padding:0 2px;flex:none;}
#${ROOT_ID} .rqp-plus{flex:none;background:#f7f7f7;border-top:.5px solid #e0e0e0;padding:16px 18px;display:flex;gap:20px;}
#${ROOT_ID} .rqp-plus button{border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:#555;font-family:inherit;padding:0;}
#${ROOT_ID} .rqp-plus button i{font-style:normal;width:54px;height:54px;border-radius:12px;background:#fff;display:grid;place-items:center;font-size:25px;border:.5px solid #e5e5e5;}
#${ROOT_ID} .rqp-plus button:disabled{opacity:.45;cursor:default;}
#${ROOT_ID} .rqp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:26px 20px;}
#${ROOT_ID} .rqp-app{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;border:none;background:none;position:relative;}
#${ROOT_ID} .rqp-app .ic{width:52px;height:52px;border-radius:12px;display:grid;place-items:center;font-size:26px;color:#fff;}
#${ROOT_ID} .rqp-app span{font-size:11px;color:#333;}
#${ROOT_ID} .rqp-app .dot{position:absolute;top:-3px;right:8px;width:10px;height:10px;border-radius:50%;background:#fa5151;}
/* ── 朋友圈(真微信样式校准 2026-07-18:白底连续流+发丝线分隔,左头像右内容两栏,
   名字微信蓝#576b95,时间行右侧两点评论钮,赞评进浅灰盒——不是微博卡片流) ── */
#${ROOT_ID} .rqw-feed{background:#fff;min-height:100%;}
#${ROOT_ID} .rqw-post{background:#fff;padding:12px 14px 10px;display:flex;gap:10px;align-items:flex-start;position:relative;}
#${ROOT_ID} .rqw-post::after{content:'';position:absolute;left:62px;right:0;bottom:0;height:.5px;background:#eee;}
#${ROOT_ID} .rqw-post>.rqp-ava{width:38px;height:38px;border-radius:4px;font-size:15px;flex:none;}
#${ROOT_ID} .rqw-r{flex:1;min-width:0;}
#${ROOT_ID} .rqw-name{font-size:13.5px;font-weight:600;color:#576b95;display:block;margin-bottom:2px;}
#${ROOT_ID} .rqw-only{font-style:normal;font-size:10.5px;color:#d64d8f;background:rgba(214,77,143,.1);border:1px solid rgba(214,77,143,.3);border-radius:999px;padding:1px 7px;margin-left:6px;vertical-align:1px;}
#${ROOT_ID} .rqw-tag{font-size:8px;padding:1px 3px;border-radius:2px;background:#fff3e0;color:#ff8200;}
#${ROOT_ID} .rqw-time{font-size:11px;color:#b2b2b2;}
#${ROOT_ID} .rqw-foot{display:flex;align-items:center;justify-content:space-between;margin-top:5px;}
#${ROOT_ID} .rqw-dots{flex:none;background:#f7f7f7;border-radius:3px;padding:1px 7px;color:#576b95;font-size:12px;font-weight:700;letter-spacing:1px;line-height:1.3;}
#${ROOT_ID} .rqw-text{font-size:13.5px;color:#111;line-height:1.55;word-break:break-word;}
#${ROOT_ID} .rqw-text .tp{color:#576b95;}
#${ROOT_ID} .rqw-box{margin-top:6px;background:#f7f7f7;border-radius:3px;padding:6px 8px;font-size:12px;color:#333;line-height:1.6;}
#${ROOT_ID} .rqw-box .lk{color:#576b95;}
#${ROOT_ID} .rqw-box .lk::before{content:'♡ ';}
#${ROOT_ID} .rqw-box b{color:#576b95;font-weight:400;}
#${ROOT_ID} .rqw-img{display:block;max-width:78%;max-height:190px;object-fit:cover;border-radius:2px;margin:6px 0 0;}
/* 个人主页(考古层:头图+历史流+加载更早) */
#${ROOT_ID} .rqw-hero{background:linear-gradient(160deg,#8fa6bd,#5c728c);padding:18px 14px 12px;display:flex;align-items:center;gap:10px;color:#fff;}
#${ROOT_ID} .rqw-hero .rqp-ava{width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.8);font-size:20px;}
#${ROOT_ID} .rqw-hero b{font-size:15px;display:block;}
#${ROOT_ID} .rqw-hero i{font-style:normal;font-size:11px;opacity:.85;}
#${ROOT_ID} .rqw-divider{padding:10px 0;font-size:11px;color:#b2b2b2;background:#fff;text-align:center;}
#${ROOT_ID} .rqw-post.key-open{box-shadow:inset 0 0 0 1.5px #ff8200;}
#${ROOT_ID} .rqw-quiz{margin-top:8px;border-top:.5px solid rgba(0,0,0,.06);padding-top:8px;}
#${ROOT_ID} .rqw-quiz p{font-size:11px;color:#ff8200;font-weight:600;margin-bottom:6px;}
#${ROOT_ID} .rqw-quiz button{display:block;width:100%;text-align:left;border:1px solid #eee;background:#fafafa;border-radius:5px;padding:6px 9px;font-size:11px;color:#333;cursor:pointer;margin-bottom:5px;font-family:inherit;}
#${ROOT_ID} .rqw-quiz button:hover{border-color:#ff8200;background:#fff7ef;}
#${ROOT_ID} .rqw-more{display:block;width:100%;margin:0;border:none;background:#fff;color:#576b95;padding:12px 0 16px;font-size:12.5px;cursor:pointer;font-family:inherit;}
#${ROOT_ID} .rqp-call{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:linear-gradient(180deg,#3a3f4b,#22252d);color:#fff;}
#${ROOT_ID} .rqp-call .rqp-ava{width:84px;height:84px;border-radius:14px;font-size:34px;}
#${ROOT_ID} .rqp-call b{font-size:18px;}
#${ROOT_ID} .rqp-call i{font-style:normal;font-size:12px;opacity:.7;}
#${ROOT_ID} .rqp-call .acts{display:flex;gap:46px;margin-top:26px;}
#${ROOT_ID} .rqp-call .acts button{width:60px;height:60px;border-radius:50%;border:none;font-size:24px;cursor:pointer;color:#fff;}
#${ROOT_ID} .rqp-call .acts .ok{background:#07c160;}
#${ROOT_ID} .rqp-call .acts .no{background:#fa5151;}
#${ROOT_ID} .rqp-set{padding:16px;display:flex;flex-direction:column;gap:10px;background:#fff;height:100%;}
#${ROOT_ID} .rqp-set .rqp-api-section{display:flex;flex-direction:column;gap:10px;}
#${ROOT_ID} .rqp-set .custom-api-fields{display:flex;flex-direction:column;gap:10px;}
#${ROOT_ID} .rqp-set .toggle-custom{text-align:left;width:100%;}
#${ROOT_ID} .rqp-set label{font-size:12px;color:#333!important;-webkit-text-fill-color:#333!important;display:flex;flex-direction:column;gap:4px;}
#${ROOT_ID} .rqp-set input,#${ROOT_ID} .rqp-set select{border:1px solid #ddd;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;background:#fff;color:#111!important;-webkit-text-fill-color:#111!important;caret-color:#111;opacity:1;}
#${ROOT_ID} .rqp-set input::placeholder{color:#8a8a8a!important;-webkit-text-fill-color:#8a8a8a!important;opacity:1;}
#${ROOT_ID} .rqp-set button:not(.save){border:1px solid #d4d4d4;border-radius:6px;background:#f5f5f5;color:#333!important;-webkit-text-fill-color:#333!important;padding:7px 10px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;}
#${ROOT_ID} .rqp-set button:not(.save):hover{background:#eaeaea;border-color:#bdbdbd;}
#${ROOT_ID} .rqp-set button:disabled{color:#777!important;-webkit-text-fill-color:#777!important;opacity:.7;cursor:default;}
#${ROOT_ID} .rqp-set .save{border:none;border-radius:6px;background:#07c160;color:#fff!important;-webkit-text-fill-color:#fff!important;padding:8px;cursor:pointer;font-size:13px;}
#${ROOT_ID} .rqp-set .credit{font-size:10px;color:#707070!important;-webkit-text-fill-color:#707070!important;margin-top:auto;line-height:1.6;}
`;

function 头像块(名: string): string {
  const 丈夫名 = new Set(门牌列表.map(m => 户静态表[m].夫名).filter(Boolean));
  const 文件 = 名 === '父亲' || 丈夫名.has(名) ? '影子' : 名; // 五夫+父亲=柯南影子头像(设计拍板共用)
  return `<span class="rqp-ava"><img src="${素材基址}/头像/${文件}.webp" onerror="this.remove();this.parentElement.textContent='${名[0] ?? '?'}'"/></span>`;
}

/** 群消息正文以「发言人:内容」保存；气泡头像必须跟发言人走，不能永远显示群头像。 */
function 群消息头像名(会话: string, 文: string, 默认名: string): string {
  if (会话 !== '群' && 会话 !== '姐妹群') return 默认名;
  const 发言人 = 文.match(/^([^::]{1,8})[::]/)?.[1]?.trim();
  if (!发言人) return 默认名;
  const 合法名 = new Set<string>();
  for (const m of 门牌列表) {
    合法名.add(户静态表[m].妻名);
    if (户静态表[m].夫名) 合法名.add(户静态表[m].夫名);
  }
  return 合法名.has(发言人) ? 发言人 : 默认名;
}

function 时段字(楼戳: number, 偏移: number): string {
  return `第${Math.floor(Math.max(0, 楼戳 + 偏移) / 18) + 1}天 ${当前时段(楼戳 + 偏移)}`;
}

let 挂好 = false;
/** 手机壳拉回视口(悬浮钮被拖到屏幕边缘后,弹开的壳可能在视口外;挂载时闭包赋值) */
let 拉回视口: () => void = () => {};
/** 正在输入(2026-07-18 用户提案:微信同款)——她生成回复期间,该会话顶栏+气泡显示打字中 */
let 正在输入: string | null = null;

/**
 * 开合防抖(2026-07-18 用户实测rq0.21:点一下手机闪一下就消失)——移动端一次点按会
 * 双触发(touch合成click+原生click);开关语义下第二发变成"关"。450ms 内只认第一发。
 */
let 上次开合 = 0;
function 开合防抖(): boolean {
  const now = Date.now();
  if (now - 上次开合 < 450) return false;
  上次开合 = now;
  return true;
}

export function 挂载手机(): void {
  if (挂好) return;
  const doc = 根文档();
  // 脚本 iframe 会随切聊天 reload:页面层残留的旧壳事件闭包已死,一律拆了重建(玉子 INSTANCE 范式变体)
  doc.getElementById(ROOT_ID)?.remove();
  doc.getElementById(`${ROOT_ID}-css`)?.remove();
  const style = doc.createElement('style');
  style.id = `${ROOT_ID}-css`;
  style.textContent = 手机CSS;
  doc.head.appendChild(style);
  const root = el('div', '');
  root.id = ROOT_ID;
  root.innerHTML =
    `<div class="rqp-shell"><div class="rqp-punch"></div>` +
    `<div class="rqp-status"><span class="tm"></span><span class="rt"><span class="bars"><i></i><i></i><i></i><i></i></span><span class="rqp-batt"><i></i></span></span></div>` +
    `<div class="rqp-screen"></div>` +
    `</div><button class="rqp-toggle" title="手机">📱<span class="dot"></span></button>` +
    `<div class="rqp-resize" title="按住拖动调节手机大小">⤡</div>`;
  doc.body.appendChild(root);
  // 状态栏时间(柚月同款真实时钟)
  const 走钟 = () => {
    const t = root.querySelector('.rqp-status .tm');
    if (t) t.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };
  走钟();
  setInterval(走钟, 30000);
  // 手机可拖动(柚月同款;抓顶部状态栏/挖孔区拖,位移记 localStorage,重建后复位)
  const 壳 = root.querySelector('.rqp-shell') as HTMLElement;
  const 位置键 = '人妻公寓_手机位置';
  const 夹 = (dx: number, dy: number): [number, number] => {
    const w = doc.documentElement.clientWidth;
    const h = doc.documentElement.clientHeight;
    const r = 壳.getBoundingClientRect();
    const 基x = r.left - 当前位.dx;
    const 基y = r.top - 当前位.dy;
    return [Math.min(Math.max(dx, -基x - r.width + 60), w - 基x - 60), Math.min(Math.max(dy, -基y), h - 基y - 60)];
  };
  const 当前位 = { dx: 0, dy: 0 };
  // 手机缩放(2026-07-20 玩家点单:手机端壳太大/太小自由调;并入拖动同一条transform防互踩)
  const 缩放键 = '人妻公寓_手机缩放';
  let 缩放 = 1;
  try {
    const v = parseFloat(localStorage.getItem(缩放键) ?? '1');
    if (Number.isFinite(v) && v >= 0.6 && v <= 1.6) 缩放 = v;
  } catch {
    /* 忽略 */
  }
  壳.style.transformOrigin = '100% 100%';
  const 手柄 = root.querySelector('.rqp-resize') as HTMLElement | null;
  const 应用位 = () => {
    壳.style.transform = `translate(${当前位.dx}px, ${当前位.dy}px) scale(${缩放})`;
    // 手柄在壳外(根容器直属,压得住悬浮钮),手动跟壳右下角:缩放原点=右下,角位只随拖动位移变
    if (手柄) {
      手柄.style.right = `${-8 - 当前位.dx}px`;
      手柄.style.bottom = `${56 - 当前位.dy}px`;
    }
  };
  应用位();
  // 右下角拖动缩放(2026-07-20 用户拍板交互形态):壳锚定右下,拖向右下=放大,向左上=缩小
  {
    const 柄 = 手柄;
    if (柄) {
      let 起 = { x: 0, y: 0, s: 1 };
      柄.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        起 = { x: ev.clientX, y: ev.clientY, s: 缩放 };
        柄.setPointerCapture(ev.pointerId);
      });
      柄.addEventListener('pointermove', ev => {
        if (!柄.hasPointerCapture(ev.pointerId)) return;
        const d = ev.clientX - 起.x + (ev.clientY - 起.y);
        缩放 = Math.min(1.6, Math.max(0.6, 起.s + d / 260));
        应用位();
      });
      柄.addEventListener('pointerup', ev => {
        if (柄.hasPointerCapture(ev.pointerId)) 柄.releasePointerCapture(ev.pointerId);
        try {
          localStorage.setItem(缩放键, String(Math.round(缩放 * 100) / 100));
        } catch {
          /* 忽略 */
        }
      });
    }
  }
  try {
    const 存 = JSON.parse(localStorage.getItem(位置键) ?? 'null') as { dx: number; dy: number } | null;
    if (存 && Number.isFinite(存.dx) && Number.isFinite(存.dy)) {
      当前位.dx = 存.dx;
      当前位.dy = 存.dy;
      应用位();
    }
  } catch {
    /* 位置记录坏了就回默认位 */
  }
  for (const 柄名 of ['.rqp-status', '.rqp-punch']) {
    const 柄 = root.querySelector(柄名) as HTMLElement | null;
    if (!柄) continue;
    柄.style.cursor = 'grab';
    柄.style.touchAction = 'none';
    柄.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      柄.setPointerCapture(ev.pointerId);
      柄.style.cursor = 'grabbing';
      const 起 = { x: ev.clientX, y: ev.clientY, dx: 当前位.dx, dy: 当前位.dy };
      const 动 = (e: PointerEvent) => {
        [当前位.dx, 当前位.dy] = 夹(起.dx + e.clientX - 起.x, 起.dy + e.clientY - 起.y);
        应用位();
      };
      const 停 = () => {
        柄.removeEventListener('pointermove', 动);
        柄.removeEventListener('pointerup', 停);
        柄.removeEventListener('pointercancel', 停);
        柄.style.cursor = 'grab';
        try {
          localStorage.setItem(位置键, JSON.stringify(当前位));
        } catch {
          /* 存不上就只影响下次复位 */
        }
      };
      柄.addEventListener('pointermove', 动);
      柄.addEventListener('pointerup', 停);
      柄.addEventListener('pointercancel', 停);
    });
  }
  拉回视口 = () => {
    const r = 壳.getBoundingClientRect();
    if (!r.width) return;
    const w = doc.documentElement.clientWidth;
    const h = doc.documentElement.clientHeight;
    let dx = 0;
    let dy = 0;
    if (r.right > w - 2) dx = w - 2 - r.right;
    if (r.left + dx < 2) dx = 2 - r.left;
    if (r.bottom > h - 2) dy = h - 2 - r.bottom;
    if (r.top + dy < 2) dy = 2 - r.top;
    if (dx || dy) {
      当前位.dx += dx;
      当前位.dy += dy;
      应用位();
      try {
        localStorage.setItem(位置键, JSON.stringify(当前位));
      } catch {
        /* 存不上只影响下次复位 */
      }
    }
  };
  // 悬浮钮:点=开合;拖(>8px)=挪位置(2026-07-18 用户反馈:手机端玩家挪不动按钮不友好)
  const 钮 = root.querySelector('.rqp-toggle') as HTMLElement;
  const 钮位置键 = '人妻公寓_手机钮位置';
  const 定根 = (left: number, top: number) => {
    const w = doc.documentElement.clientWidth;
    const h = doc.documentElement.clientHeight;
    root.style.left = `${Math.min(Math.max(left, 4), w - 60)}px`;
    root.style.top = `${Math.min(Math.max(top, 4), h - 60)}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  };
  try {
    const 存 = JSON.parse(localStorage.getItem(钮位置键) ?? 'null') as { left: number; top: number } | null;
    if (存 && Number.isFinite(存.left) && Number.isFinite(存.top)) 定根(存.left, 存.top);
  } catch {
    /* 记录坏了用默认位 */
  }
  let 拖过 = false;
  钮.style.touchAction = 'none';
  钮.addEventListener('pointerdown', ev => {
    const r0 = root.getBoundingClientRect();
    const 起 = { x: ev.clientX, y: ev.clientY };
    拖过 = false;
    钮.setPointerCapture(ev.pointerId);
    const 动 = (e: PointerEvent) => {
      const dx = e.clientX - 起.x;
      const dy = e.clientY - 起.y;
      if (!拖过 && Math.hypot(dx, dy) < 8) return;
      拖过 = true;
      定根(r0.left + dx, r0.top + dy);
    };
    const 停 = () => {
      钮.removeEventListener('pointermove', 动);
      钮.removeEventListener('pointerup', 停);
      钮.removeEventListener('pointercancel', 停);
      if (拖过) {
        try {
          localStorage.setItem(
            钮位置键,
            JSON.stringify({ left: parseFloat(root.style.left), top: parseFloat(root.style.top) }),
          );
        } catch {
          /* 存不上只影响下次复位 */
        }
      }
    };
    钮.addEventListener('pointermove', 动);
    钮.addEventListener('pointerup', 停);
    钮.addEventListener('pointercancel', 停);
  });
  钮.addEventListener('click', () => {
    if (拖过) {
      拖过 = false; // 拖完松手触发的 click 不当开合
      return;
    }
    if (!开合防抖()) return;
    root.classList.toggle('open');
    if (root.classList.contains('open')) {
      // 有来电先接来电,否则开机即微信(2026-07-18 用户拍板:不做主屏,手机=微信)
      当前页 = 有来电() ? { 名: 'call' } : 当前页.名 === 'call' || 当前页.名 === 'talk' ? { 名: 'chats' } : 当前页;
      渲染();
      拉回视口();
    } else {
      eventEmit('人妻公寓:手机收起'); // 客户端听它:开机时替玩家退过真全屏的,收起送回去
    }
  });
  挂好 = true;
  刷新红点();
  渲染();
  console.info('[人妻公寓] 手机已挂载(页面层;形态致谢:玉子手机·柚月)');
}

function 有来电(): boolean {
  try {
    const rawStat = 读最近有效stat();
    if (!rawStat) return false;
    const data = Schema.parse(rawStat) as SchemaType;
    return data.系统._待接来电.期 >= 0;
  } catch {
    return false;
  }
}

export function 刷新红点(): void {
  const root = 根文档().getElementById(ROOT_ID);
  if (!root) return;
  const 库 = 读库();
  const 楼 = 末楼();
  const 未读 = 库.消息.some(m => m.楼 <= 楼 && m.发 === '对方' && m.楼 > (库.读到[m.会话] ?? -1));
  const 圈新 = 库.圈.some(c => c.楼 <= 楼 && c.楼 > 库.圈读到);
  root.classList.toggle('has-unread', 未读 || 圈新);
  root.classList.toggle('ringing', 有来电());
  // 通知游戏界面同步跳动指示
  eventEmit('人妻公寓:手机状态', { 未读: 未读 || 圈新, 来电: 有来电() });
}

/** 游戏界面点了来电指示/手机按钮(再点一下=收起,2026-07-18 用户拍板;来电直达不收) */
export function 打开手机(直达来电 = false): void {
  挂载手机();
  const root = 根文档().getElementById(ROOT_ID);
  if (!root) return;
  if (!开合防抖()) return;
  if (root.classList.contains('open') && !直达来电) {
    root.classList.remove('open');
    eventEmit('人妻公寓:手机收起'); // 客户端听它:开机时替玩家退过真全屏的,收起送回去
    return;
  }
  root.classList.add('open');
  if (直达来电 && 有来电()) 当前页 = { 名: 'call' };
  渲染();
  拉回视口();
}

// ── 渲染(单函数状态机,页面小,直接整屏重绘) ──

function 渲染(): void {
  const root = 根文档().getElementById(ROOT_ID);
  if (!root || !root.classList.contains('open')) return;
  const 屏 = root.querySelector('.rqp-screen') as HTMLElement;
  if (!屏) return;
  屏.innerHTML = '';

  let data: SchemaType | null = null;
  try {
    const rawStat = 读最近有效stat();
    if (rawStat) data = Schema.parse(rawStat) as SchemaType;
  } catch {
    /* 变量未就绪时手机仍可开,只是没内容 */
  }
  const 库 = 读库();
  const 楼 = 末楼();
  const 偏移 = data?.系统._时段偏移楼 ?? 0;

  const 头 = (标题: string, 返回?: () => void, 齿轮 = false) => {
    const h = el('div', 'rqp-head');
    if (返回) {
      const b = el('button', 'rqp-back', '‹');
      b.addEventListener('click', 返回);
      h.appendChild(b);
    } else {
      h.appendChild(el('span', 'rqp-back'));
    }
    h.appendChild(el('b', '', 标题));
    if (齿轮) {
      const g = el('button', 'rqp-gear', '⚙');
      g.addEventListener('click', () => {
        当前页 = { 名: 'settings' };
        渲染();
      });
      h.appendChild(g);
    } else {
      h.appendChild(el('span', 'rqp-gear'));
    }
    屏.appendChild(h);
  };

  // 微信底部三签(2026-07-18 用户拍板:不做主屏与独立App,手机开机即微信;
  // 动态集成朋友圈混排,API设置藏"我"页签)
  const 底栏 = (当前: 'chats' | 'moments' | 'settings') => {
    const 未读 = 库.消息.some(m => m.楼 <= 楼 && m.发 === '对方' && m.楼 > (库.读到[m.会话] ?? -1));
    const 圈新 = 库.圈.some(c => c.楼 <= 楼 && c.楼 > 库.圈读到);
    const 栏 = el('div', 'rqp-tabs');
    const 签 = (键: 'chats' | 'moments' | 'settings', 名: string, 图: string, 点: boolean, 去: () => void) => {
      const b = el('button', 当前 === 键 ? 'on' : '', `<i>${图}</i>${名}${点 ? '<span class="dot"></span>' : ''}`);
      if (当前 !== 键) b.addEventListener('click', 去);
      栏.appendChild(b);
    };
    签('chats', '微信', '💬', 未读 || 有来电(), () => {
      当前页 = 有来电() ? { 名: 'call' } : { 名: 'chats' };
      渲染();
    });
    签('moments', '朋友圈', '🌁', 圈新, async () => {
      当前页 = { 名: 'moments' };
      const 库2 = 读库();
      库2.圈读到 = 楼;
      await 写库(库2);
      渲染();
      刷新红点();
    });
    签('settings', '我', '👤', false, () => {
      当前页 = { 名: 'settings' };
      渲染();
    });
    屏.appendChild(栏);
  };

  if (当前页.名 === 'chats') {
    头('微信');
    const 体 = el('div', 'rqp-body chatlist');
    const 友们 = data ? 微信好友(data) : [{ id: '父亲', 名: '爸', 类: '父亲' as const }];
    for (const 友 of 友们) {
      const 条 = 库.消息.filter(m => m.会话 === 友.id && m.楼 <= 楼);
      const 尾 = 条[条.length - 1];
      const 未读 = 条.some(m => m.发 === '对方' && m.楼 > (库.读到[友.id] ?? -1));
      const r = el(
        'div',
        'rqp-row',
        `${头像块(友.类 === '群' ? '群' : 友.类 === '父亲' ? '父亲' : 友.名)}<span class="mid"><b>${友.名}</b><i>${尾 ? (尾.类 === '撤回' ? '[她撤回了一条消息]' : 尾.类 === '通话' ? '[语音通话]' : _.escape(尾.文.slice(0, 24))) : ''}</i></span>${未读 ? '<span class="dot"></span>' : ''}`,
      );
      r.addEventListener('click', async () => {
        当前页 = { 名: 'chat', 会话: 友.id };
        const 库2 = 读库();
        库2.读到[友.id] = 楼;
        await 写库(库2);
        渲染();
        刷新红点();
      });
      体.appendChild(r);
    }
    屏.appendChild(体);
    底栏('chats');
    return;
  }

  if (当前页.名 === 'chat' && 当前页.会话) {
    const 会话 = 当前页.会话;
    const 名 =
      会话 === '父亲'
        ? '爸'
        : 会话 === '群'
          ? '梧桐里7号楼务群'
          : 会话 === '姐妹群'
            ? '姐妹茶话会'
            : (户静态表[会话 as 门牌]?.妻名 ?? 会话);
    头(正在输入 === 会话 ? (会话 === '群' || 会话 === '姐妹群' ? '群成员正在输入…' : '对方正在输入…') : 名, () => {
      当前页 = { 名: 'chats' };
      渲染();
    });
    const 体 = el('div', 'rqp-body');
    const 泡区 = el('div', 'rqp-bubbles');
    // 真微信排版:气泡带双侧头像+小尾巴;换楼即插一条居中的灰色时间字(微信的时间分组)
    const 对方头像名 =
      会话 === '父亲' ? '父亲' : 会话 === '群' || 会话 === '姐妹群' ? '群' : (户静态表[会话 as 门牌]?.妻名 ?? 会话);
    let 上楼 = -1;
    for (const m of 库.消息.filter(x => x.会话 === 会话 && x.楼 <= 楼)) {
      if (m.楼 !== 上楼) {
        泡区.appendChild(el('div', 'rqp-b sys', 时段字(m.楼, 偏移)));
        上楼 = m.楼;
      }
      if (m.类 === '撤回') {
        泡区.appendChild(el('div', 'rqp-b sys', '她撤回了一条消息'));
      } else if (m.类 === '通话') {
        泡区.appendChild(el('div', 'rqp-b sys', `[语音通话] ${_.escape(m.文)}`));
      } else {
        const 我方 = m.发 === '我';
        const 消息头像 = 我方 ? '主角' : 群消息头像名(会话, m.文, 对方头像名);
        泡区.appendChild(
          el(
            'div',
            `rqp-line ${我方 ? 'me' : 'ta'}`,
            `${头像块(消息头像)}<div class="rqp-b ${我方 ? 'me' : 'ta'}">${_.escape(m.文)}</div>`,
          ),
        );
      }
    }
    // 正在输入气泡(微信同款三点跳动;她的回复生成完自动消失)
    if (正在输入 === 会话) {
      泡区.appendChild(
        el(
          'div',
          'rqp-line ta',
          `${头像块(对方头像名)}<div class="rqp-b ta"><span class="rqp-typing"><i></i><i></i><i></i></span></div>`,
        ),
      );
    }
    体.appendChild(泡区);
    屏.appendChild(体);
    // 输入(群=只发物业通知;父亲单聊只读——他只打电话)
    if (会话 !== '父亲') {
      const 是妻 = 会话 !== '群' && 会话 !== '姐妹群';
      const 行 = el('div', 'rqp-input');
      if (是妻) {
        // "+"菜单(2026-07-18 用户提案:仿真微信;第一期只有"约出来")
        const 加 = el('button', 'rqp-plusbtn', 当前页.加 ? '⊗' : '⊕') as HTMLButtonElement;
        加.addEventListener('click', () => {
          当前页 = { ...当前页, 加: !当前页.加 };
          渲染();
        });
        行.appendChild(加);
      }
      const ta = el('textarea', '') as HTMLTextAreaElement;
      ta.placeholder = 会话 === '群' ? '发一条物业通知…' : 会话 === '姐妹群' ? '插一句…' : '发消息…';
      const 发钮 = el('button', '', '发送') as HTMLButtonElement;
      发钮.addEventListener('click', () => {
        const 文 = ta.value.trim();
        if (!文) return;
        ta.value = '';
        void 发消息(会话, 文);
      });
      行.appendChild(ta);
      行.appendChild(发钮);
      屏.appendChild(行);
      if (是妻 && 当前页.加) {
        const 偏 = data?.系统._时段偏移楼 ?? 0;
        const 钟 = 楼 + 偏;
        const 冷 = 钟 - (库.节拍[`约:${会话}`] ?? -999) < 8;
        const 已约 = !!读赴约条(楼);
        const 面 = el('div', 'rqp-plus');
        const b = el('button', '', `<i>📍</i>约出来${已约 ? '·已在身边' : 冷 ? '·刚约过' : ''}`) as HTMLButtonElement;
        b.disabled = 冷 || 已约;
        b.addEventListener('click', () => {
          当前页 = { ...当前页, 加: false };
          void 约出来(会话 as 门牌);
        });
        面.appendChild(b);
        屏.appendChild(面);
      }
    }
    体.scrollTop = 体.scrollHeight;
    return;
  }

  if (当前页.名 === 'moments') {
    // 动态广场载体=微信朋友圈(2026-07-18 用户二次改拍:独立微博App作废,好友动态混排时间流;
    // 非好友的动态(入住预告等)照混不较真——用户原话"不要在意这些细节")
    头('朋友圈', () => {
      当前页 = { 名: 'chats' };
      渲染();
    });
    const 体 = el('div', 'rqp-body rqw-feed');
    const 我名 = (SillyTavern as unknown as { name1?: string })?.name1 || '我';
    体.appendChild(el('div', 'rqm-cover', `<b>${_.escape(我名)}</b>${头像块('主角')}`));
    const 圈们 = 库.圈.filter(c => c.楼 <= 楼);
    if (!圈们.length)
      体.appendChild(
        el('div', 'rqw-post', '<div class="rqw-r"><p class="rqw-text" style="color:#999">朋友圈还静悄悄的。</p></div>'),
      );
    for (const c of 圈们) {
      const 赞 = 1 + Math.floor(seededRandom(c.楼, c.谁, '赞') * 9);
      const 正文 = _.escape(c.文).replace(/#([^#\s]{1,12})#/g, '<span class="tp">#$1#</span>');
      // 真微信排版:左头像右内容;时间行右侧两点钮(纯装饰);赞+评合进浅灰盒
      const 盒 =
        `<div class="rqw-box"><span class="lk">楼里的 ${赞} 位邻居</span>` +
        (c.评.length ? `<br/>${c.评.map(e => `<b>${_.escape(e.谁)}:</b>${_.escape(e.文)}`).join('<br/>')}` : '') +
        `</div>`;
      const 卡 = el(
        'div',
        'rqw-post',
        `${头像块(c.谁)}<div class="rqw-r"><span class="rqw-name">${_.escape(c.谁)}${c.私 ? '<i class="rqw-only">🔒仅你可见</i>' : ''}</span>` +
          `<div class="rqw-text">${正文}</div>` +
          (c.私
            ? `<img class="rqw-img" src="${素材基址}/微博/仅你可见/${encodeURIComponent(c.谁)}_${c.私.图序}.webp" loading="lazy" onerror="this.remove()"/>`
            : c.图
              ? `<img class="rqw-img" src="${素材基址}/微信圈/${c.图}.webp" loading="lazy" onerror="this.remove()"/>`
              : '') +
          `<div class="rqw-foot"><span class="rqw-time">${时段字(c.楼, 偏移)}</span><span class="rqw-dots">••</span></div>` +
          盒 +
          `</div>`,
      );
      体.appendChild(卡);
    }
    // 考古层直接混在朋友圈里(2026-07-18 用户拍板:不做个人相册——往下翻,
    // 众人的旧动态按年代交错混排,"加载更早"翻的是整栋楼的过去)
    体.appendChild(el('div', 'rqw-divider', '—— 更早以前 ——'));
    const 混史: { 门牌: 门牌; 序: number; 条: ReturnType<typeof 查考古>[number] }[] = [];
    {
      // 各户历史各自按近→远排;轮转合并近似年代混排(每条自带时间字样,观感自洽)
      const 各 = 门牌列表.map(m => ({ m, 史: 查考古(m) })).filter(x => x.史.length);
      const 最长 = Math.max(0, ...各.map(x => x.史.length));
      for (let i = 0; i < 最长; i++) {
        for (const { m, 史 } of 各) {
          if (史[i]) 混史.push({ 门牌: m, 序: i, 条: 史[i] });
        }
      }
    }
    const 展开 = Math.min(当前页.展开 ?? 6, 混史.length);
    for (const { 门牌: m, 序, 条 } of 混史.slice(0, 展开)) {
      const 妻名 = 户静态表[m].妻名;
      const 键 = `${m}:${序}`;
      const 开题 = 当前页.题 === 键;
      const 图块 = 条.图
        ? `<img class="rqw-img" src="${素材基址}/微博/${条.图}.webp" loading="lazy" onerror="this.remove()"/>`
        : '';
      const 卡 = el(
        'div',
        `rqw-post${开题 ? ' key-open' : ''}`,
        `${头像块(妻名)}<div class="rqw-r"><span class="rqw-name">${_.escape(妻名)}</span>` +
          `<div class="rqw-text">${_.escape(条.文).replace(/#([^#\s]{1,12})#/g, '<span class="tp">#$1#</span>')}</div>${图块}` +
          `<div class="rqw-foot"><span class="rqw-time">${_.escape(条.时间)}</span><span class="rqw-dots">••</span></div></div>`,
      );
      if (条.关键) {
        卡.style.cursor = 'pointer';
        卡.addEventListener('click', ev => {
          if ((ev.target as HTMLElement).closest('.rqw-quiz')) return;
          当前页 = { ...当前页, 题: 开题 ? undefined : 键 };
          渲染();
        });
        if (开题) {
          const 题区 = el('div', 'rqw-quiz', `<p>哪里不对劲?</p>`);
          条.关键.选项.forEach((文, i) => {
            const b = el('button', '', _.escape(文));
            b.addEventListener('click', () => {
              当前页 = { ...当前页, 题: undefined };
              eventEmit('人妻公寓:考古选细节', { 门牌: m, 序, 选项: i });
              渲染();
            });
            题区.appendChild(b);
          });
          (卡.querySelector('.rqw-r') as HTMLElement).appendChild(题区);
        }
      }
      体.appendChild(卡);
    }
    const 更 = el('button', 'rqw-more', 展开 < 混史.length ? '加载更早的动态…' : '翻到底了');
    更.addEventListener('click', () => {
      if (展开 < 混史.length) {
        当前页 = { ...当前页, 展开: 展开 + 6 };
        渲染();
      } else {
        eventEmit('人妻公寓:考古到底');
      }
    });
    体.appendChild(更);
    屏.appendChild(体);
    底栏('moments');
    return;
  }

  if (当前页.名 === 'call') {
    // 微信语音来电(父亲;跳动指示→点开手机→此屏接听)
    头('微信语音');
    const 区 = el('div', 'rqp-call');
    区.innerHTML = `${头像块('父亲')}<b>爸</b><i>邀请你进行语音通话…</i><div class="acts"><button class="no" title="挂断">✕</button><button class="ok" title="接听">✓</button></div>`;
    (区.querySelector('.no') as HTMLButtonElement).addEventListener('click', () => {
      // 挂断=未接红点继续挂着,下一期被覆盖时照扣(经济系统规则)
      当前页 = { 名: 'chats' };
      渲染();
    });
    (区.querySelector('.ok') as HTMLButtonElement).addEventListener('click', () => {
      eventEmit('人妻公寓:接听来电');
    });
    屏.appendChild(区);
    return;
  }

  if (当前页.名 === 'talk') {
    头('通话中 · 爸');
    const 体 = el('div', 'rqp-body');
    const 泡区 = el('div', 'rqp-bubbles');
    for (const t of 通话记录) {
      泡区.appendChild(el('div', `rqp-b ${t.谁 === '我' ? 'me' : 'ta'}`, _.escape(t.文)));
    }
    体.appendChild(泡区);
    屏.appendChild(体);
    const 行 = el('div', 'rqp-input');
    const ta = el('textarea', '') as HTMLTextAreaElement;
    ta.placeholder = '你开口说…';
    const 发钮 = el('button', '', '说') as HTMLButtonElement;
    发钮.addEventListener('click', () => {
      const 文 = ta.value.trim();
      if (!文) return;
      ta.value = '';
      void 通话应答(文);
    });
    const 挂 = el('button', '', '挂断') as HTMLButtonElement;
    挂.style.background = '#fa5151';
    挂.addEventListener('click', () => void 结束通话());
    行.appendChild(ta);
    行.appendChild(发钮);
    行.appendChild(挂);
    屏.appendChild(行);
    体.scrollTop = 体.scrollHeight;
    return;
  }

  if (当前页.名 === 'settings') {
    头('我', () => {
      当前页 = { 名: 'chats' };
      渲染();
    });
    const c = 读配置();
    const db = 数据库状态();
    const db预设名 = 读取数据库API预设名();
    const 区 = el('div', 'rqp-set');
    区.innerHTML = `
      <label>手机内容 API<select class="i-source">
        <option value="自动"${c.ai来源 === '自动' ? ' selected' : ''}>自动（数据库优先）</option>
        <option value="数据库"${c.ai来源 === '数据库' ? ' selected' : ''}>只用数据库</option>
        <option value="正文"${c.ai来源 === '正文' ? ' selected' : ''}>只用正文 API</option>
        <option value="自定义"${c.ai来源 === '自定义' ? ' selected' : ''}>自定义 OpenAI API</option>
      </select></label>
      <div class="rqp-api-section db-api-section">
        <p class="db-status" style="color:${db.可调用AI ? '#287a50' : '#666'};font-size:12px;margin:2px 0 8px">数据库：${
          db.可调用AI
            ? `已连接${db.已装游戏模板 ? '，人妻公寓表已安装' : '，尚未安装人妻公寓表'}`
            : '未检测到公开 API（自动模式会使用正文 API）'
        }</p>
        <label>手机专用数据库预设名（留空=数据库当前配置）<input class="i-db-preset" list="rq-db-presets" value="${_.escape(c.数据库预设)}" placeholder="例如：人妻公寓手机"/></label>
        <datalist id="rq-db-presets">${db预设名.map(name => `<option value="${_.escape(name)}"></option>`).join('')}</datalist>
        <p style="color:#666;font-size:11px;margin:0 0 6px">${
          db预设名.length
            ? `旧版数据库公开了 ${db预设名.length} 个预设名称，可直接选择。`
            : db.已安装
              ? '可在数据库里新建“人妻公寓手机”预设：沿用同一地址和 Key，但选择另一模型；这里填预设名即可。数据库 8.4 不向外公开预设列表，所以也可以留空使用当前配置。'
              : '安装数据库后可使用其 AI 配置；没有数据库也不影响游戏。'
        }</p>
        <label style="display:flex;align-items:center;gap:8px"><input class="i-db-fallback" type="checkbox" style="width:auto"${
          c.数据库失败回退 ? ' checked' : ''
        }/>数据库请求报错时再尝试正文 API（可能造成双请求）</label>
        <span style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="install-db">安装/更新本游戏表</button><button class="open-db">查看数据库表</button><button class="open-db-settings" style="grid-column:1/-1">配置手机专用模型</button></span>
      </div>
      <div class="rqp-api-section custom-api-section">
        <button type="button" class="toggle-custom">手机自定义 API（独立配置）</button>
        <div class="custom-api-fields">
          <p style="color:#666;font-size:11px">不经过数据库时使用。可以填写同一 API 的地址和 Key，再为手机选择不同模型。</p>
          <label>自定义API 地址（OpenAI兼容）<input class="i-base" value="${_.escape(c.base)}" placeholder="https://…/v1"/></label>
          <label>API Key<input class="i-key" type="password" value="${_.escape(c.key)}"/></label>
          <label>模型<span style="display:flex;gap:6px"><input class="i-model" style="flex:1" value="${_.escape(c.model)}" placeholder="gpt-4.1-mini 等"/><button class="fetch-models" style="flex:none;padding:0 10px">读取自定义模型</button></span></label>
          <select class="i-models" style="display:none"><option value="">— 从列表选择 —</option></select>
          <p class="models-tip" style="display:none;color:#666;font-size:12px;margin:2px 0 0"></p>
        </div>
      </div>
      <label>动态频率<select class="i-freq"><option${c.频率 === '勤' ? ' selected' : ''}>勤</option><option${c.频率 === '普通' ? ' selected' : ''}>普通</option><option${c.频率 === '静' ? ' selected' : ''}>静</option><option${c.频率 === '关' ? ' selected' : ''}>关</option></select></label>
      <button class="save">保存</button>
      <p class="credit">自动模式：检测到数据库公开API就由数据库代发；未安装数据库才使用正文API。数据库调用失败默认不二次请求，避免重复计费。游戏硬状态始终由MVU管理。<br/>手机外观:柚月小手机(yuzuki)授权砍装;挂载范式参考玉子手机(yuzi83)。经双授权改造,谨此致谢。</p>`;
    const 来源选择 = 区.querySelector('.i-source') as HTMLSelectElement;
    const 数据库区 = 区.querySelector('.db-api-section') as HTMLElement;
    const 自定义开关 = 区.querySelector('.toggle-custom') as HTMLButtonElement;
    const 自定义字段 = 区.querySelector('.custom-api-fields') as HTMLElement;
    let 自定义展开 = c.ai来源 === '自定义';
    const 刷新API分区 = () => {
      const 来源 = 来源选择.value as 手机AI来源;
      数据库区.style.display = 来源 === '自动' || 来源 === '数据库' ? 'flex' : 'none';
      if (来源 === '自定义') 自定义展开 = true;
      自定义字段.style.display = 自定义展开 ? 'flex' : 'none';
      自定义开关.textContent = `${自定义展开 ? '▾' : '▸'} 手机自定义 API（独立配置）`;
    };
    来源选择.addEventListener('change', 刷新API分区);
    自定义开关.addEventListener('click', () => {
      自定义展开 = !自定义展开;
      刷新API分区();
    });
    刷新API分区();
    (区.querySelector('.install-db') as HTMLButtonElement).addEventListener('click', () => {
      const 宿主 = window.parent ?? window;
      if (!db.已安装) {
        宿主.alert('未检测到数据库插件。游戏仍可正常运行；安装插件后再回来点此按钮即可。');
        return;
      }
      if (
        !宿主.confirm(
          '这会把《人妻公寓》的 RQ_ 表合并到当前聊天，并保留当前模板中的其他表；不会修改数据库的全局模板。继续吗？',
        )
      )
        return;
      const 按钮 = 区.querySelector('.install-db') as HTMLButtonElement;
      按钮.disabled = true;
      按钮.textContent = '安装中…';
      void 安装人妻公寓数据库模板().then(result => {
        宿主.alert(result.message || (result.success ? '安装完成' : '安装失败'));
        渲染();
      });
    });
    (区.querySelector('.open-db') as HTMLButtonElement).addEventListener('click', () => {
      void 打开数据库界面().then(ok => {
        if (!ok) (window.parent ?? window).alert('未检测到可打开的数据库界面。');
      });
    });
    (区.querySelector('.open-db-settings') as HTMLButtonElement).addEventListener('click', () => {
      void 打开数据库设置().then(ok => {
        if (!ok) (window.parent ?? window).alert('当前数据库版本没有提供可打开的设置页。');
      });
    });
    // 读取模型列表(OpenAI 兼容 GET {base}/models;与 小生成 同一 base 约定=填到 /v1)
    (区.querySelector('.fetch-models') as HTMLButtonElement).addEventListener('click', () => {
      const base = (区.querySelector('.i-base') as HTMLInputElement).value.trim().replace(/\/+$/, '');
      const key = (区.querySelector('.i-key') as HTMLInputElement).value.trim();
      const 选 = 区.querySelector('.i-models') as HTMLSelectElement;
      const 提 = 区.querySelector('.models-tip') as HTMLElement;
      const 说 = (t: string) => {
        提.style.display = 'block';
        提.textContent = t;
      };
      if (!base || !key) {
        说('先填好地址和 Key 再读取。');
        return;
      }
      说('读取中…');
      void 限时请求(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } })
        .then(async r => {
          if (!r.ok) {
            if (r.status === 401) throw new Error('HTTP 401：自定义 API 鉴权失败；这里不会读取数据库保存的密钥');
            throw new Error(`HTTP ${r.status}`);
          }
          const j = (await r.json()) as { data?: { id?: string }[] };
          const 们 = (j.data ?? []).map(m => m.id).filter((x): x is string => !!x);
          if (!们.length) throw new Error('列表为空');
          选.innerHTML =
            '<option value="">— 从列表选择 —</option>' +
            们.map(m => `<option value="${_.escape(m)}">${_.escape(m)}</option>`).join('');
          选.style.display = 'block';
          说(`读到 ${们.length} 个模型,从下拉里选一个。`);
        })
        .catch(e => 说(`读取失败:${String(e).slice(0, 100)}（请检查这里单独填写的地址和 Key；也可以直接手填模型名）`));
    });
    (区.querySelector('.i-models') as HTMLSelectElement).addEventListener('change', ev => {
      const v = (ev.target as HTMLSelectElement).value;
      if (v) (区.querySelector('.i-model') as HTMLInputElement).value = v;
    });
    (区.querySelector('.save') as HTMLButtonElement).addEventListener('click', () => {
      存配置({
        ai来源: (区.querySelector('.i-source') as HTMLSelectElement).value as 手机AI来源,
        数据库预设: (区.querySelector('.i-db-preset') as HTMLInputElement).value.trim(),
        数据库失败回退: (区.querySelector('.i-db-fallback') as HTMLInputElement).checked,
        base: (区.querySelector('.i-base') as HTMLInputElement).value.trim(),
        key: (区.querySelector('.i-key') as HTMLInputElement).value.trim(),
        model: (区.querySelector('.i-model') as HTMLInputElement).value.trim(),
        频率: (区.querySelector('.i-freq') as HTMLSelectElement).value as 手机配置['频率'],
      });
      当前页 = { 名: 'chats' };
      渲染();
    });
    屏.appendChild(区);
    底栏('settings');
    return;
  }
}

// ── 约出来(2026-07-18 用户提案:微信"+"菜单;应约与否由脚本按 阶段/好感/时段/丈夫在否 裁定,
//    AI 只照结果写回复;应约=写 _赴约(有效期2时段),期间她的位置=玩家的位置) ──

function 读赴约条(楼: number): { m: 门牌 } | null {
  const p = (_.get(getVariables({ type: 'chat' }), '_赴约') ?? null) as {
    m?: 门牌;
    起楼?: number;
    至楼?: number;
  } | null;
  if (!p?.m || (p.起楼 ?? 0) > 楼 || (p.至楼 ?? -1) < 楼) return null;
  return { m: p.m };
}

async function 约出来(m: 门牌): Promise<void> {
  const 楼 = 末楼();
  const 库 = 读库();
  库.消息.push({ 楼, 会话: m, 发: '我', 文: '在忙吗?想见你一面——我就在楼里,出来陪我走走?' });
  await 写库(库);
  正在输入 = m;
  渲染();
  try {
    const rawStat = 读最近有效stat();
    if (!rawStat) return;
    const data = Schema.parse(rawStat) as SchemaType;
    const 节点 = data.户[m];
    const 配 = 户静态表[m];
    if (!节点 || !配) return;
    const 钟 = 楼 + data.系统._时段偏移楼;
    const 时段名 = 当前时段(钟);
    const 阶段 = 节点.妻.当前阶段;
    // 应约率〔调参〕:阶段定底,好感加成,晚间低阶段打折,丈夫在家打折(L5=随叫随到基本必来)
    let 率 = [0.35, 0.55, 0.75, 0.9, 0.98][Math.max(0, 阶段 - 1)] ?? 0.35;
    if (节点.妻.好感值 >= 70) 率 += 0.1;
    if ((时段名 === '深夜' || 时段名 === '晚上') && 阶段 < 4) 率 *= 时段名 === '深夜' ? 0.15 : 0.6;
    if (丈夫在楼(节点, m, 钟) !== '外出' && 阶段 < 5) 率 *= 0.6;
    const 应 = seededRandom(楼, m, '赴约') < 率;
    {
      const 库2 = 读库();
      库2.节拍[`约:${m}`] = 钟;
      await 写库(库2);
    }
    const 尾 = 最近正文();
    const 回 = await 小生成(
      '你在扮演一款都市题材游戏中的已婚女性,刚收到公寓管理员发来的微信邀约。结果已由系统裁定,你只负责照结果写她的回复(口语,不超过40字,可含emoji,不要引号,不要旁白,不要任何标签)。' +
        口吻纪律,
      `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${家庭事实(m)}${妻状态包(m, data)}${await 人设段(m)}时段:${时段名}。${称呼纪律()}${尾 ? `\n刚刚现实里发生的事(正文节选,回复要接得上这口气):${尾}` : ''}\n裁定结果:${
        应
          ? '她答应出来见面(按她此刻的真实状态拿捏语气:关系浅=犹豫着答应,关系深=藏不住的高兴)'
          : '她婉拒了(给个合乎生活的理由:在做饭/家里有人/不太方便;按她此刻的真实状态拿捏惋惜程度)'
      }。生成她的回复。`,
    );
    {
      const 库3 = 读库();
      库3.消息.push({
        楼: 末楼(),
        会话: m,
        发: '对方',
        文: 回 || (应 ? '好呀,等我几分钟,我出来找你。' : '今天不太方便呢…改天好不好?'),
      });
      库3.读到[m] = 末楼();
      await 写库(库3);
    }
    if (应) {
      // 必须等赴约状态真正落库后再广播位置刷新；旧写法 fire-and-forget，客户端先读到旧值，
      // 要等后续几个回合的其他刷新才看见她到场。
      await Promise.resolve(insertOrAssignVariables({ _赴约: { m, 起楼: 楼, 至楼: 楼 + 6 } }, { type: 'chat' }));
    }
    渲染();
    刷新红点(); // 顺带发"手机状态"事件,游戏界面借它即时刷新赴约位置(约出来不产楼)
  } catch (e) {
    console.error('[人妻公寓·手机] 约出来失败:', e);
  } finally {
    正在输入 = null;
    渲染();
  }
}

// ── 姐妹群一拍(2026-07-19):2~4行你来我往,喂最近8条群记录=有上下文延续性 ──

async function 姐妹群一拍(data: SchemaType, 库: 微信库, 楼: number, 起因?: string): Promise<boolean> {
  const 成员 = 姐妹群成员(data);
  if (成员.length < 2) return false;
  const 近况 = 库.消息
    .filter(m => m.会话 === '姐妹群')
    .slice(-12)
    .map(m => (m.发 === '我' ? `${玩家名()}:${m.文}` : m.文))
    .join('\n');
  const 名单 = 成员.map(m => {
    const 配 = 户静态表[m];
    return `${配.妻名}(${配.雌竞};此刻:${雌竞火气(data.户[m], 楼)})`;
  });
  const 原 = await 小生成(
    '你替一款成人都市题材游戏生成一段微信小群"姐妹茶话会"的聊天。群里只有楼里几位太太和公寓管理员,没有丈夫没有外人。' +
      '太太们每人都与管理员有各自心照不宣的关系,彼此隐约有数却谁都不说破——这个群的日常=拌嘴/攀比/阴阳怪气/争风吃醋/互相调侃,火药味是真的,姐妹情也是真的。' +
      '输出2~4行,每行格式"发言人:内容",内容口语化不超过30字,可含emoji,不要引号不要旁白不要解释。' +
      '纪律:严禁任何人明说自己或指认别人与管理员的具体越界事实(全靠含沙射影和弦外之音);发言人只能从名单里选;不必每人都发言,按火气大小分配。',
    `群成员与各自路数:\n${名单.join('\n')}\n管理员${玩家名()}也在群里,平时潜水。${称呼纪律()}` +
      (近况 ? `\n最近群聊(接着这个气口往下聊,有恩怨接恩怨):\n${近况}` : '') +
      (起因 ? `\n刚刚:${起因}——太太们对此各自反应。` : '\n生成新的一轮群聊。'),
  );
  if (!原) return false;
  const 妻名集 = new Set(成员.map(m => 户静态表[m].妻名));
  let 有 = false;
  for (const 行 of 原.split('\n')) {
    const m = 行.trim().match(/^([^::]{1,8})[::]\s*(.+)$/);
    if (!m || !妻名集.has(m[1])) continue;
    库.消息.push({ 楼, 会话: '姐妹群', 发: '对方', 文: `${m[1]}:${m[2]}` });
    有 = true;
  }
  return 有;
}

// ── 楼务群接话：公开、克制、只谈住户共同可见的楼务，不泄露任何私下剧情 ──

async function 楼务群一拍(data: SchemaType, 库: 微信库, 楼: number, 起因: string): Promise<boolean> {
  const 成员 = 门牌列表.filter(m => {
    const 配 = 户静态表[m];
    return Boolean(data.户[m]) && (!配.隐身 || data.系统._母亲入列);
  });
  if (!成员.length) return false;
  const 名单 = 成员.map(m => `${户静态表[m].妻名}(${m}室住户)`).join('、');
  const 近况 = 库.消息
    .filter(m => m.会话 === '群' && m.类 !== '撤回')
    .slice(-12)
    .map(m => (m.发 === '我' ? `${玩家名()}:${m.文}` : m.文))
    .join('\n');
  const 原 = await 小生成(
    '你为都市公寓游戏生成一小段和睦、真实的楼务微信群回复。只允许当前已入住的住户妻子发言；她们把管理员当物业联系人。' +
      '回复应针对管理员刚发的通知，可以是确认收到、补充实际情况、提出一个简短问题或报告同类楼务问题。' +
      '只谈公共可见的物业与邻里事项，严禁暧昧、隐私、婚姻秘密、游戏机制，也严禁虚构名单外住户。' +
      '输出1~3行，每行严格为“发言人:内容”，每条不超过35字，不要旁白、引号或解释；发言人只能从给定名单选择。',
    `当前可发言住户:${名单}\n管理员:${玩家名()}\n最近楼务群记录:\n${近况 || '暂无'}\n刚刚:${起因}\n请让最相关的一至三人自然接话。`,
  );
  if (!原) return false;
  const 合法名 = new Set(成员.map(m => 户静态表[m].妻名));
  let 有 = false;
  for (const 行 of 原.split('\n')) {
    const m = 行.trim().match(/^([^::]{1,8})[::]\s*(.+)$/);
    if (!m || !合法名.has(m[1])) continue;
    库.消息.push({ 楼, 会话: '群', 发: '对方', 文: `${m[1]}:${m[2]}` });
    有 = true;
  }
  return 有;
}

// ── 单聊/群聊发送(玩家侧;她的回复走独立API,不占楼) ──

async function 发消息(会话: string, 文: string): Promise<void> {
  const 楼 = 末楼();
  const 库 = 读库();
  库.消息.push({ 楼, 会话, 发: '我', 文 });
  await 写库(库);
  渲染();
  if (会话 === '群') {
    正在输入 = 会话;
    渲染();
    try {
      const rawStat = 读最近有效stat();
      if (rawStat) {
        const data = Schema.parse(rawStat) as SchemaType;
        const 库2 = 读库();
        if (await 楼务群一拍(data, 库2, 末楼(), `${玩家名()}发布通知：“${文}”`)) {
          库2.读到['群'] = 末楼();
          await 写库(库2);
        }
      }
    } catch (e) {
      console.error('[人妻公寓·手机] 楼务群接话失败:', e);
    } finally {
      正在输入 = null;
      渲染();
    }
    return;
  }
  if (会话 === '姐妹群') {
    // 玩家插话=太太们接话一轮(带群记忆)
    正在输入 = 会话;
    渲染();
    try {
      const rawStat = 读最近有效stat();
      if (rawStat) {
        const data = Schema.parse(rawStat) as SchemaType;
        const 库2 = 读库();
        if (await 姐妹群一拍(data, 库2, 末楼(), `${玩家名()}在群里说:"${文}"`)) {
          库2.读到['姐妹群'] = 末楼();
          await 写库(库2);
        }
      }
    } catch (e) {
      console.error('[人妻公寓·手机] 姐妹群接话失败:', e);
    } finally {
      正在输入 = null;
      渲染();
    }
    return;
  }
  正在输入 = 会话;
  渲染();
  try {
    const rawStat = 读最近有效stat();
    if (!rawStat) return;
    const data = Schema.parse(rawStat) as SchemaType;
    const 节点 = data.户[会话 as 门牌];
    const 配 = 户静态表[会话 as 门牌];
    if (!节点 || !配) return;
    const 近况 = 库.消息
      .filter(m => m.会话 === 会话 && m.类 !== '撤回')
      .slice(-12)
      .map(m => `${m.发 === '我' ? 玩家名() : 配.妻名}:${m.文}`)
      .join('\n');
    const 尾 = 最近正文();
    const 回 = await 小生成(
      '你在扮演一款都市题材游戏中的已婚女性,正在和公寓管理员微信聊天。只输出她的下一条回复(口语,不超过50字,可含emoji,不要引号,不要旁白,不要任何标签或标记)。' +
        '纪律:下面给出的"她此刻的真实状态"是唯一权威,态度亲疏严格照此拿捏,不因单条消息内容自行升降关系;不提及任何游戏机制;她此刻在自己的生活场景里(可自然带一句在做什么)。' +
        口吻纪律,
      `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${家庭事实(会话 as 门牌)}${妻状态包(会话 as 门牌, data)}${await 人设段(会话 as 门牌)}她此刻大致在:${妻位置推算(会话 as 门牌, 楼 + data.系统._时段偏移楼)}。${称呼纪律()}${尾 ? `\n刚刚现实里发生的事(正文节选,她的微信口吻要接得上这口气):${尾}` : ''}\n最近聊天:\n${近况}\n生成她的回复。`,
    );
    if (回) {
      const 库2 = 读库();
      库2.消息.push({ 楼: 末楼(), 会话, 发: '对方', 文: 回 });
      库2.读到[会话] = 末楼();
      await 写库(库2);
      渲染();
    }
  } catch (e) {
    console.error('[人妻公寓·手机] 回复生成失败:', e);
  } finally {
    正在输入 = null;
    渲染();
  }
}

// ── 父亲来电(三段式第三段:接听→通话→挂断回流) ──

export function 来电已接(载荷: { 分数段: string; 报表: string; 通牒: boolean }): void {
  通话上下文 = 载荷;
  通话记录 = [];
  当前页 = { 名: 'talk' };
  刷新红点();
  渲染();
  void (async () => {
    const 开场 = await 父亲台词('(通话接通,父亲先开口)');
    if (开场) {
      通话记录.push({ 谁: '父', 文: 开场 });
      渲染();
    }
  })();
}

async function 父亲台词(玩家说: string): Promise<string> {
  const 上 = 通话上下文;
  const 段 = 上?.通牒
    ? '最后通牒:他动了真火,把话挑明——"下个收租季还这样,你就收拾东西滚去打工,楼我另请人管"'
    : 上?.分数段 === '满意'
      ? '满意:话不多,嗯两声,问候你妈,末了提一句"账目清楚就好"'
      : 上?.分数段 === '平淡'
        ? '平淡:例行公事地过一遍账,敲打一两句,让你多上心'
        : '不满:语气沉,逐条问账,话里带刺("这楼交给你是让你练手,不是让你练胆")';
  const 记录 = 通话记录.map(t => `${t.谁 === '我' ? '儿子' : '父亲'}:${t.文}`).join('\n');
  return 小生成(
    '你在扮演一位常年在海外做生意的中国父亲,正和管理公寓的儿子微信语音通话。只输出父亲的下一句话(口语,不超过60字,不要引号,不要旁白)。他务实、寡言、看重账目,爱藏在训话里。',
    `儿子名叫"${玩家名()}"(直呼其名或"你",不要用别的称呼)。本期情况:${上?.报表 || '账目平平'}。谈话基调=${段}。\n通话记录:\n${记录 || '(刚接通)'}\n儿子刚说:${玩家说}\n父亲接话。`,
  );
}

async function 通话应答(文: string): Promise<void> {
  通话记录.push({ 谁: '我', 文 });
  渲染();
  const 回 = await 父亲台词(文);
  if (回) {
    通话记录.push({ 谁: '父', 文: 回 });
    渲染();
  }
}

async function 结束通话(): Promise<void> {
  const 摘要 = 通话记录
    .slice(0, 4)
    .map(t => t.文)
    .join(' / ');
  const 楼 = 末楼();
  const 库 = 读库();
  库.消息.push({ 楼, 会话: '父亲', 发: '系统', 文: `通话结束(${通话记录.length}句)`, 类: '通话' });
  await 写库(库);
  // 回流正文一句(排队事件,下一楼注入;通话内容本体只存在于手机里)
  try {
    const 有效 = 读取最近有效();
    if (有效) {
      const { raw, data } = 有效;
      const 事件 = `【来电回流】{{user}}刚跟父亲通了个微信语音(内容大意:${摘要 || '例行问账'})。正文只按"刚挂了爸的电话"的程度带过他此刻的心绪,不要复述通话内容`;
      data.系统._待发送事件 = data.系统._待发送事件 ? `${data.系统._待发送事件}|${事件}` : 事件;
      await 脚本写入(raw, data);
      捕获保护快照(data);
    }
  } catch (e) {
    console.error('[人妻公寓·手机] 通话回流失败:', e);
  }
  通话上下文 = null;
  通话记录 = [];
  当前页 = { 名: 'chats' };
  渲染();
  刷新红点();
}
