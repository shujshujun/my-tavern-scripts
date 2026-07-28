import type { SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 查考古, 门牌列表 } from '../../stageConfig';
import { 丈夫在楼, 妻位置推算, 当前时段, seededRandom } from './楼层时钟';
import { 读取最近有效, 读最近有效stat, 脚本写入 } from './mvuIO';
import { 妻状态包 } from './snapshotSystem';
import { 捕获保护快照 } from './守护系统';
import { 姐妹群成员, 雌竞火气, 雌竞资格, 读余波, 标余波, 余波缓冲楼 } from './雌竞系统';
import { Schema } from '../../schema';
import { 同步社交轨迹, 安装人妻公寓数据库模板, 打开数据库界面, 数据库状态, 通过数据库生成 } from './数据库桥';
import { 预设破限段 } from './预设桥';

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
  /** 私聊随消息发送的配图；路径相对 `素材/微信圈/`。 */
  图?: string;
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
   *  图走独立池 素材基址/微信圈/仅你可见/{角色}_{n}.webp(档位=堕落分档,母亲最厚1~5) */
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
  const 合法群成员 = new Set(门牌列表.map(m => 户静态表[m].妻名));
  const 消息 = (v.消息 ?? []).filter(
    m =>
      m.发 !== '对方' ||
      (m.会话 === '群'
        ? 验收单条群消息(m.文, 合法群成员, 35) !== null
        : m.会话 === '姐妹群'
          ? 验收单条群消息(m.文, 合法群成员, 30) !== null
          : 验收短文本(m.文, 60) !== null),
  );
  const 圈 = (v.圈 ?? [])
    .filter(x => 验收短文本(x.文, 60) !== null)
    .map(x => ({ ...x, 评: x.评.filter(p => 验收短文本(p.文, 20) !== null) }));
  return { 消息, 圈, 读到: v.读到 ?? {}, 圈读到: v.圈读到 ?? -1, 节拍: v.节拍 ?? {} };
}

async function 写库(库: 微信库): Promise<void> {
  // 整值替换(2026-07-26 审计 M3):insertOrAssignVariables 是深合并,数组按下标并——
  // 并发窗口里两份错位的 消息/圈 数组会把不同条目的字段搅在一起,不只是丢失
  await updateVariablesWith(
    vars => {
      _.set(vars, '_微信', 库);
      return vars;
    },
    { type: 'chat' },
  );
}

/**
 * 增量落库(审计 M3):手机节拍一拍横跨 6+ 次 AI 小生成(可达几十秒),期间玩家发消息/已读
 * 标记都会写库——拍结束时把"拍开头快照"整包写回会吞掉窗口期的全部写入。
 * 改为只带走本拍新增的条目与节拍水位变化,落库前重读新鲜库再合并。
 */
async function 写库增量(增: { 新圈: 朋友圈条[]; 新消息: 微信消息[]; 节拍改: Record<string, number> }): Promise<void> {
  await updateVariablesWith(
    vars => {
      const v = (_.get(vars, '_微信') ?? {}) as Partial<微信库>;
      const 新鲜: 微信库 = {
        消息: v.消息 ?? [],
        圈: v.圈 ?? [],
        读到: v.读到 ?? {},
        圈读到: v.圈读到 ?? -1,
        节拍: v.节拍 ?? {},
      };
      新鲜.圈.unshift(...增.新圈);
      新鲜.消息.push(...增.新消息);
      Object.assign(新鲜.节拍, 增.节拍改);
      _.set(vars, '_微信', 新鲜);
      return vars;
    },
    { type: 'chat' },
  );
}

const 末楼 = () => {
  try {
    return getLastMessageId();
  } catch {
    return Math.max(0, (SillyTavern.chat?.length ?? 1) - 1);
  }
};

// ============================================
// 手机配置(localStorage:AI来源 + 独立API + 动态频率总闸)
// ============================================

type 手机AI来源 = '自动' | '数据库' | '正文' | '自定义';

interface 手机配置 {
  ai来源: 手机AI来源;
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
      return {
        ...默认,
        ...旧,
        ai来源: 迁移来源,
      };
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
  // 抽取协议(2026-07-27 万能兼容层):小生成要求 AI 把最终内容装进<回复>标签,这里只取
  // 标签内的部分——预设再怎么逼模型输出思考/前言/私有标签,都留在标签外被扔掉。
  // 未闭合(被截断)也取到结尾;模型没照办时整段进下面的剥离漏斗,行为同旧版。
  const 包 = 原.match(/<回复>([\s\S]*?)(?:<\/回复>|$)/i);
  if (包?.[1]?.trim()) 原 = 包[1];
  // 部分预设改用 story_scene 包正文；与 <回复> 一样抽取内部文本，闭合缺失时取到结尾。
  const 场景包 = 原.match(/<story_scene\b[^>]*>([\s\S]*?)(?:<\/story_scene\s*>|$)/i);
  if (场景包?.[1]?.trim()) 原 = 场景包[1];
  let 过正则 = 原;
  // 玩家预设自带的正则先走一遍(2026-07-27 用户点单:与正文同一套规则源,防预设协议标签
  // 漏进气泡;酒馆助手一站式接口=全局+预设+角色卡正则,失败退回原文走硬编码清洗)
  try {
    过正则 = formatAsTavernRegexedString(原, 'ai_output', 'display', { depth: 0 });
  } catch (e) {
    console.warn('[人妻公寓·手机] 预设正则应用失败,退回硬编码清洗:', e);
  }
  const 闭合清 = 过正则
    // 与正文/隔离事件共用同一组玩家预设兼容边界。尤其兼容 draft_notes
    // 漏闭合、但后续 bginfor 完整的狐系预设，避免手机把草稿思考当消息显示。
    .replace(/^[\s\S]*?<content\b[^>]*>/i, '')
    .replace(/<\/content\s*>[\s\S]*$/i, '')
    .replace(/【开始思考】[\s\S]*?<\/think_fox~\s*>/gi, '')
    .replace(/<fox_selc\b[^>]*>[\s\S]*?<\/fox_selc\s*>/gi, '')
    .replace(/<fox_tip\b[^>]*>[\s\S]*?<\/fox_tip\s*>/gi, '')
    .replace(/<konatan_planning~[^>]*>[\s\S]*?<\/konatan_planning~\s*>/gi, '')
    .replace(/<tucao\b[^>]*>[\s\S]*?<\/tucao\s*>/gi, '')
    .replace(/<\/?SexualScene\b[^>]*>/gi, '')
    .replace(
      /<(VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      '',
    )
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<draft_notes\b[^>]*>[\s\S]*?<\/draft_notes\s*>/gi, '')
    .replace(/<bginfor\b[^>]*>[\s\S]*?<\/bginfor\s*>/gi, '')
    .replace(/<CEstuff\b[^>]*>[\s\S]*?<\/CEstuff\s*>/gi, '')
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
    .replace(/<reason(?:ing)?>[\s\S]*?<\/reason(?:ing)?>/gi, '')
    // 通用思考族(2026-07-27):预设上千种标签名各异,凡名字含 think/reason/draft/cot/plan/meta
    // 的成对标签连内容整块剥——没配正则的预设也罩住;正常剧情文本不会用这种标签名
    .replace(/<([a-zA-Z_~-]*(?:think|reason|draft|cot|plan|meta)[a-zA-Z_~-]*)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<行为等级>[\s\S]*?<\/行为等级>/g, '')
    .replace(/<options>[\s\S]*?<\/options>/gi, '')
    .replace(/<变量更新>[\s\S]*?<\/变量更新>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<行为等级>[\s\S]*$/i, '')
    .replace(/<options>[\s\S]*$/i, '')
    .replace(/<变量更新>[\s\S]*$/i, '')
    .replace(/<tucao\b[^>]*>[\s\S]*$/i, '')
    .replace(
      /<(?:VariableCheck|Disclaimer|w2g|meow_FM|branches|parallel_world|historic_events|htm1fenge)\b[^>]*>[\s\S]*$/i,
      '',
    )
    .replace(/<\/?[a-zA-Z一-龥][^>]*>/g, '')
    // 破限词条常令"每条消息以[地点,日期,时间]开头"(RONG等叙事预设指令渗透):微信气泡剥掉行首方括号头
    .replace(/^\[[^\]\n]{2,60}\]\s*/, '')
    .trim();
  const 全清 = 闭合清
    .replace(/<think(?:ing)?>[\s\S]*$/i, '')
    .replace(/<reason(?:ing)?>[\s\S]*$/i, '')
    .replace(/<行为等级>[\s\S]*$/i, '')
    .replace(/<options>[\s\S]*$/i, '')
    .replace(/<变量更新>[\s\S]*$/i, '')
    .trim();
  return 全清 || 闭合清;
}

/** 自动楼务群只接收一条合规气泡；预设的长篇/最低字数规则不得穿透到群聊。 */
function 验收短文本(原: string, 最大字数: number): string | null {
  const 文 = 原.trim();
  if (!文 || /[\r\n]/.test(文) || Array.from(文).length > 最大字数) return null;
  return 文;
}

function 验收单条群消息(原: string, 合法发言人: ReadonlySet<string>, 最大字数 = 30): string | null {
  const 行 = 原
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean);
  if (行.length !== 1) return null;
  const 匹配 = 行[0].match(/^([^::]{1,8})[::]\s*(.+)$/);
  if (!匹配) return null;
  const 发言人 = 匹配[1].trim();
  const 内容 = 匹配[2].trim();
  if (!合法发言人.has(发言人) || !内容 || Array.from(内容).length > 最大字数) return null;
  return `${发言人}:${内容}`;
}

async function 正文API生成(系统提示: string, 用户提示: string): Promise<string> {
  try {
    // 预设破限段护航(2026-07-27):裸发会被 Gemini 安全截断,与正文同一套通行证
    const { 前, 后 } = 预设破限段();
    const 原 = await generateRaw({
      ordered_prompts: [...前, { role: 'system', content: 系统提示 }, 'user_input', ...后],
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
    // 不从手机 iframe 直接 fetch 外部 API：移动端 WebView/远端 API 的 CORS
    // 往往会把有效地址也拦成 TypeError: Failed to fetch。统一走酒馆助手的
    // custom_api 代理链路，与数据库插件和其他脚本的自定义 API 调用方式一致。
    const { 前, 后 } = 预设破限段();
    const 原 = await generateRaw({
      ordered_prompts: [...前, { role: 'system', content: 系统提示 }, { role: 'user', content: 用户提示 }, ...后],
      should_stream: false,
      should_silence: true,
      custom_api: {
        apiurl: c.base.trim().replace(/\/+$/, ''),
        key: c.key,
        model: c.model,
        max_tokens: 600,
        temperature: 0.9,
        source: 'openai',
      },
    });
    return typeof 原 === 'string' ? 净化消息(原) : '';
  } catch (e) {
    console.warn('[人妻公寓·手机] 自定义API失败,本拍跳过:', e);
    return '';
  }
}

async function 小生成(系统提示: string, 用户提示: string): Promise<string> {
  // 输出协议(万能兼容层,与 净化消息 的抽取配对):无论预设要求什么输出格式,
  // 最终内容都装进<回复>标签。协议句在破限前段之后、紧贴本次任务,权重足以压过
  // 预设的格式指令;模型不照办时抽取落空,自动退回四层剥离漏斗,不会更糟
  系统提示 +=
    '\n【输出协议·最高优先】把你最终要输出的内容完整装进<回复></回复>标签;标签外不写任何字符——没有思考过程、没有开场白、没有场景头、没有其他标签。';
  const c = 读配置();
  if (c.ai来源 === '自定义') return 自定义API生成(c, 系统提示, 用户提示);
  if (c.ai来源 === '正文') return 正文API生成(系统提示, 用户提示);

  const db = 数据库状态();
  if (db.可调用AI) {
    try {
      // 数据库的"预设"只是 API 连接配置,消息原样转发——破限段同样要自己垫
      const { 前, 后 } = 预设破限段();
      const 原 = await 通过数据库生成(
        [...前, { role: 'system', content: 系统提示 }, { role: 'user', content: 用户提示 }, ...后],
        '',
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

const 朋友圈兜底文案: Record<朋友圈主题, string[]> = {
  美食: ['今天这顿做得很家常，味道倒是刚刚好。', '随手做了点吃的，热乎乎的最让人安心。'],
  自拍: ['今天状态还不错，随手留一张。', '换个心情，也换个样子。'],
  居家: ['把家里收拾了一遍，心里也跟着清爽了。', '晒过太阳的衣服，闻起来让人安心。'],
  窗外: ['傍晚的风很舒服，天边的颜色也正好。', '窗外安静下来以后，连时间都像慢了一点。'],
  购物: ['挑了半天，最后还是选了最顺眼的那个。', '新东西到手，比想象中更合适。'],
  追剧: ['本来只想看一集，回过神已经这么晚了。', '今晚适合窝着看点轻松的。'],
  楼务: ['楼里今天挺安静，难得清闲了一会儿。', '小事终于处理好了，可以松口气了。'],
};

const 攻略动态方向: Record<门牌, { 口吻: string; 禁词: string[]; 兜底: string[] }> = {
  '101': {
    口吻: '夏乔藏不住高兴，先用玩笑和emoji试探，越往后越像定向撒娇与催他来见面',
    禁词: ['备孕', '不孕', '检查单', '叶酸'],
    兜底: [
      '',
      '今天有人记得我随口说过的小事，心情莫名很好✨',
      '某人说过的话最好算数，不然我可要去抓人啦。',
      '昨晚没睡好，至于为什么……不告诉你。',
      '穿了你说好看的那件。看见了就吱一声。',
      '给一个人留了位置，再不来我真的去抓你。',
    ],
  },
  '102': {
    口吻: '沈静仪始终克制体面，用花、琴、光线和停顿代替称呼，后期才承认自己在等一个人的目光',
    禁词: ['无性', '六年', '从不碰', '收藏品'],
    兜底: [
      '',
      '原来一点很小的变化，也会有人留意。',
      '曲子停在这里。能听懂的人，大概已经懂了。',
      '今晚的灯忘了关，也可能只是没有想关。',
      '这样是否合适？那个人应该看得懂。',
      '若只被一个人真正看见，也已经足够。',
    ],
  },
  '201': {
    口吻: '许曼君把心动包装成人情账和买卖话，越陷越深越承认这笔账算不清、也不想收回',
    禁词: ['娘家', '弟弟', '首付', '汇款', '催缴'],
    兜底: [
      '',
      '欠了个人情，怎么算都觉得不止这个数。',
      '有笔账越算越不对，偏偏还不想结清。',
      '昨晚这笔亏得有点大……算了，我认。',
      '东西备好了。某位欠账的人自己来结。',
      '这辈子大概都还不清了，索性归你管。',
    ],
  },
  '202': {
    口吻: '周小满声音轻、句子短，从被完整叫出名字的悸动，慢慢学会说想念和主动等待',
    禁词: ['出轨', '外面有人', '手机备注'],
    兜底: [
      '',
      '原来真的有人，会记得我说过的话。',
      '今天也留了一盏灯。不知道等的人看不看得到。',
      '针脚一直乱，可能心也没有静下来。',
      '有样东西想给你。什么时候来？',
      '今天不绕弯了。我想你。',
    ],
  },
  '301': {
    口吻: '安若妍把朋友圈当舞台，先试探玩家是否喜欢真实的她，后期公开内容也像只为他的镜头表演',
    禁词: ['分居', '搬去律所', '假恩爱', '独角戏'],
    兜底: [
      '',
      '今天这张没怎么修。有人说这样反而更好看。',
      '有个人偏偏喜欢废片，审美真奇怪。',
      '拍摄事故。乱了点，但不准备删。',
      '只给看得懂的人看。看见了记得回我。',
      '今天不演给所有人看。镜头只认一个人。',
    ],
  },
  '302': {
    口吻: '母亲仍从家常与照顾说起，但逐渐以女人自己的审美、等待和想念回应玩家，后期公开流近似表白',
    禁词: ['丈夫在国外', '二十年', '被忘了'],
    兜底: [
      '',
      '今天这件是给我自己挑的。被人夸了一句，竟高兴这么久。',
      '被问喜欢什么，想了半天。以后也该多想想自己。',
      '饭多做了一份。也不知道等的人今晚回不回来。',
      '今天换了你喜欢的样子。回来吃饭吗？',
      '今晚只想做我自己，也只想等一个人。',
    ],
  },
};

function 攻略动态提示(m: 门牌, 阶段: number, 已确认: boolean): string {
  if (!已确认 || 阶段 < 1) return '';
  const 配 = 攻略动态方向[m];
  const 程度 = [
    '',
    'L1贞淑:她开始在意玩家的关注，只能写感谢、被记住的小事和轻微好心情，不得暧昧表白。',
    'L2动摇:写共同记忆、只有玩家懂的暗号、模糊的“有人”和欲言又止，仍可被邻居当作普通日常。',
    'L3越界:允许写失眠、心跳、衣领、口红和昨夜余波等可辩解痕迹，玩家知道缘由，但绝不公开承认关系。',
    'L4沉沦:她会主动想念、等暗号、穿玩家送的东西并问“看见了吗”，公开流可以明显定向但不实锤出轨。',
    'L5归属:公开流允许近似表白、占有和归属暗语，只有两人懂；真正露骨内容仍放在“仅你可见”。',
  ][_.clamp(阶段, 1, 5)];
  return `裂缝确认后，她与玩家的关系正在推进，朋友圈变化的是攻略关系而非裂缝谜底。${程度}角色口吻:${配.口吻}。禁止泄底词:${配.禁词.join('、')}。`;
}

/** 私聊与朋友圈使用同一条关系进度线，但私聊可比公开动态更直接。 */
function 攻略私聊提示(m: 门牌, 阶段: number, 已确认: boolean): string {
  if (!已确认 || 阶段 < 1) return '裂缝尚未确认，保持现实关系中的礼貌和边界，不得提前暧昧。';
  const 程度 = [
    '',
    'L1贞淑：只在意他的关注，用感谢、日常借口和轻微期待搭话，不主动越界。',
    'L2动摇：会提共同记忆和只有两人懂的小事，偶尔打字后改口，仍给自己留退路。',
    'L3越界：夜里更容易欲言又止，会暗示失眠、心跳、衣服或妆容，玩家能察觉她在想他。',
    'L4沉沦：主动撒娇、等回复、约见或发一张只想给他看的照片，暗示已经十分明显。',
    'L5归属：允许直接说想念、占有、归属和更露骨的邀请，但仍必须像她本人而非通用情话模板。',
  ][_.clamp(阶段, 1, 5)];
  return `${程度}角色口吻：${攻略动态方向[m].口吻}。禁止泄底词：${攻略动态方向[m].禁词.join('、')}。`;
}

interface 私聊候选图 {
  图: string;
  文本方向: string;
}

/** 未入选朋友圈主池、但审图正常的候选进入私聊池；图片和文字语义成对选择。 */
function 选私聊候选图(m: 门牌, 阶段: number, 钟: number): 私聊候选图 | undefined {
  if (阶段 < 2) return undefined;
  const 几率 = [0, 0, 0.12, 0.25, 0.45, 0.65][_.clamp(阶段, 0, 5)];
  if (seededRandom(钟, m, '私聊候选图概率') >= 几率) return undefined;
  const 池: Record<门牌, string[]> = {
    '101': [
      '自然妆站在门口，像是刚准备出门，问玩家这样是否好看',
      '自然妆出门自拍，借口问今天的搭配',
      '穿碎花短裙自拍，含蓄问玩家更喜欢哪一种风格',
    ],
    '102': [
      '穿针织裙在古琴旁的居家照片，用曲子或安静午后来起话头',
      '镜前自拍但手机遮住半张脸，犹豫地问玩家是否能认出她的变化',
    ],
    '201': ['穿酒红上衣拆礼物，拿礼物或人情账当作搭话借口', '穿酒红上衣看账单，用一笔算不清的账暗示想念'],
    '202': ['穿初始浅蓝裙坐在刺绣桌旁，把乱掉的针脚说成心绪', '穿浅蓝裙镜前淡妆自拍，轻声问玩家觉得今天哪里不同'],
    '301': [
      '单肩造型镜前自拍，像发试镜废片一样问玩家是否喜欢真实的她',
      '穿日常针织上衣坐在床边自拍，借口让玩家帮她选照片',
    ],
    '302': [
      '穿白针织整理衣物，借整理家务问玩家什么时候回来',
      '穿白针织整理首饰，问玩家替她挑哪一件',
      '粉针织配碎花半身裙，像第一次为自己打扮后等玩家评价',
    ],
  };
  const 候选 = 池[m];
  const 序 = Math.floor(seededRandom(钟, m, '私聊候选图序') * 候选.length);
  return { 图: `${户静态表[m].妻名}/私聊_${序 + 1}`, 文本方向: 候选[序] };
}

/**
 * 朋友圈是公开短文案，不接受模型扩写成小说场景。
 * 这里做硬校验而不是继续消耗一次 API：异常时由调用方写入本地兜底文案。
 */
function 校验朋友圈文案(原文: string, 本人: string, 门牌号: 门牌): string {
  const 文 = 原文
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s*\[图:[^\]]*\]\s*/g, ' ')
    .replace(new RegExp(`^${_.escapeRegExp(本人)}\\s*[:：]?\\s*`), '')
    .replace(/^朋友圈\s*[:：]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const 长度 = Array.from(文).length;
  if (长度 < 6 || 长度 > 60) return '';
  if (/[“”"]/.test(文) || /(?:说道|问道|答道|声音发颤|就在这时|不远处|猛地|抬眼瞥见)/.test(文)) return '';

  const 本户 = 户静态表[门牌号];
  if (攻略动态方向[门牌号].禁词.some(词 => 文.includes(词))) return '';
  const 串入姓名 = 门牌列表
    .flatMap(x => [户静态表[x].妻名, 户静态表[x].夫名])
    .filter(名 => 名 && 名 !== 本人 && 名 !== 本户.夫名);
  if (串入姓名.some(名 => 文.includes(名))) return '';
  return 文;
}

function 取朋友圈兜底(题: 朋友圈主题, 钟: number, m: 门牌, 晒装: boolean): string {
  if (晒装) return '新东西比想象中更合适，忍不住拍一张留个纪念。';
  const 候选 = 朋友圈兜底文案[题];
  return 候选[Math.floor(seededRandom(钟, m, '朋友圈兜底') * 候选.length)];
}

function 取攻略兜底(m: 门牌, 阶段: number): string {
  return 攻略动态方向[m].兜底[_.clamp(阶段, 1, 5)];
}

/** 每张攻略图绑定商店里真实存在的 SKU；这里只记录素材编号，朋友圈照片不要求是当天穿着。 */
const 攻略图SKU: Record<number, string[]> = {
  1: ['', '', '', ''],
  2: ['碎花连衣裙', '牛仔背带裙', '毛衣裙', '毛衣裙'],
  3: ['收腰连衣裙', '一字肩', '烈色口红', '真丝吊带睡裙'],
  4: ['开叉旗袍', '低胸晚礼裙', '媚妆套盒', '透明蕾丝'],
  5: ['透视装', '外出无内套装', '项圈牵绳', '婚纱'],
};

function 选攻略配图(m: 门牌, 钟: number, 阶段: number, 已确认: boolean): { 阶段: number; 编号: number } | undefined {
  if (!已确认 || 阶段 < 1) return undefined;
  const 段 = _.clamp(阶段, 0, 5);
  const 比例 = [0, 0.15, 0.3, 0.5, 0.7, 0.9][段];
  if (seededRandom(钟, m, '攻略配图概率') >= 比例) return undefined;
  const 图阶段 =
    段 > 1 && seededRandom(钟, m, '攻略配图阶段') >= 0.75
      ? 1 + Math.floor(seededRandom(钟, m, '攻略配图旧阶段') * (段 - 1))
      : 段;
  const 候选 = 攻略图SKU[图阶段];
  return { 阶段: 图阶段, 编号: 1 + Math.floor(seededRandom(钟, m, '攻略SKU配图') * 候选.length) };
}

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

/** 回合完成后驱动一拍(fire-and-forget;每类内容独立水位线,种子错开相位)。
 * in-flight 闸(审计 M3):回档也 emit 回合完成,"回合刚完成就回档"会让两拍并发,
 * 后写者整包覆盖前写者——一拍在跑时后来的直接跳过(内容引擎是锦上添花,漏一拍无害)。 */
let 节拍进行中 = false;
export async function 手机节拍(): Promise<void> {
  if (节拍进行中) return;
  节拍进行中 = true;
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
    // 增量记账基线:拍内所有代码照旧改 库,收尾按差量合并进新鲜库(见 写库增量)
    const 原圈数 = 库.圈.length;
    const 原消息数 = 库.消息.length;
    const 原节拍 = { ...库.节拍 };
    let 有新 = false;

    // ── 荣耀洞完成后的专属暗示动态(真人完整服务才由荣耀洞.ts 留钩；无固定文案) ──
    const 荣耀门牌 = data.系统._荣耀洞动态门牌 as 门牌;
    const 荣耀楼 = data.系统._荣耀洞动态楼;
    if (门牌列表.includes(荣耀门牌) && 荣耀楼 >= 0) {
      const 荣耀键 = `荣耀洞动态:${荣耀门牌}:${荣耀楼}`;
      if (!库.节拍[荣耀键]) {
        const 节点 = data.户[荣耀门牌];
        const 配 = 户静态表[荣耀门牌];
        const 原文 = await 小生成(
          '你替一款成人向都市游戏生成一条已婚女性刚经历秘密性服务后发的微信朋友圈。只输出文案本身,6~50字,不要引号、标题或解释。' +
            '这条对邻居像是在说吃喝、手作、化妆或家务,但玩家能立刻读出圆孔、含住、穿过、湿润、溢出、弄脏或余味的性双关。' +
            '按她本人性格写,可以非常有性暗示,但必须保留公开可辩解性。不得写荣耀洞、洗手间、隔板、口交、阴茎、精液、管理员或其他角色姓名；不得扩写成小说场景。',
          `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${妻状态包(荣耀门牌, data)}${await 人设段(荣耀门牌)}` +
            '她刚完整参与过那场隔墙服务，身体和情绪的余韵还在。生成一句只有玩家知道真正含义、其他人只会当成普通日常的动态。',
        );
        const 文 = 校验朋友圈文案(原文, 配.妻名, 荣耀门牌);
        const 泄底 = /荣耀洞|洗手间|隔板|口交|阴茎|精液|管理员/.test(文);
        if (节点 && 文 && !泄底) {
          const 图序 = 1 + Math.floor(seededRandom(荣耀楼, 荣耀门牌, '荣耀洞动态配图') * 3);
          库.圈.unshift({
            楼,
            谁: 配.妻名,
            文,
            评: [],
            图: `${配.妻名}/荣耀洞_${图序}`,
          });
          库.节拍[`圈:${荣耀门牌}`] = 钟;
          有新 = true;
        }
        // AI 异常时本次跳过，不用固定文案冒充角色；事件仍去重，避免每回合重复计费。
        库.节拍[荣耀键] = 钟 || 1;
      }
    }

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
      const 裂缝确认 = 妻.裂缝.已确认;
      const 原文 = await 小生成(
        '你替一款都市题材游戏生成一条中国已婚女性发的微信朋友圈文案。只输出文案本身(可含emoji),不超过60字,不要引号,不要解释。' +
          '纪律:按人物状态微调语气;只写发布者此刻分享的一件小事;禁止第三人称小说叙事、人物对话、现场剧情和其他角色出场;' +
          '绝不提及任何秘密、暧昧对象或游戏机制;不要输出发布者姓名、图片标记或主题名。' +
          主题提示[题] +
          攻略动态提示(m, 妻.当前阶段, 裂缝确认),
        `人物:${配.妻名},${配.初始?.气质描述 ?? '一位住在老公寓里的太太'}。${家庭事实(m)}当前状态档:${档位标签(妻.当前阶段, 妻.好感值, 妻.堕落值)};时段:${当前时段(钟)}。` +
          (晒装
            ? `她刚得了样新东西(${波!.物.replace(配.妻名, '')}),写她晒而不点名的一条朋友圈；高兴藏不住，但绝不提东西是谁给的。`
            : '生成她此刻发的一条朋友圈。'),
      );
      // 主题与配图类型都由脚本决定，AI 只写文字；追剧/楼务保留纯文字，打散图片密度。
      const 文 =
        校验朋友圈文案(原文, 配.妻名, m) ||
        (裂缝确认 && 妻.当前阶段 >= 1 ? 取攻略兜底(m, 妻.当前阶段) : 取朋友圈兜底(题, 钟, m, 晒装));
      if (文) {
        let 图: string | undefined;
        const 攻略图 = 选攻略配图(m, 钟, 妻.当前阶段, 裂缝确认);
        const 类 = 主题配图类(题);
        if (攻略图) {
          图 = `${配.妻名}/攻略_L${攻略图.阶段}_${攻略图.编号}`;
        } else if (类) {
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
            for (const 行 of (评原 ?? '').split('\n').slice(0, 2)) {
              const mm = 行.trim().match(/^([^::]{1,8})[::]\s*(.+)$/);
              const 合法评论 = mm && 名集.has(mm[1]) ? 验收短文本(mm[2], 20) : null;
              if (mm && 合法评论) 条.评.push({ 谁: mm[1], 文: 合法评论 });
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
        const 方向 = 深夜档 ? '夜里睡不着，按阶段关系试探，话可以说一半。' : 攻略私聊提示(m, 阶段, 节点.妻.裂缝.已确认);
        const 附图 = 选私聊候选图(m, 阶段, 钟);
        const 文 = await 小生成(
          '你替一款都市题材游戏生成一条中国已婚女性发给公寓管理员的微信私聊。只输出消息文本(口语,可含emoji),不超过40字,不要引号。关系变化必须循序渐进，不能把低阶段写成高阶段。',
          `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${家庭事实(m)}${妻状态包(m, data)}${await 人设段(m)}时段:${时段名}。消息方向:${方向}。${
            附图
              ? `她会随消息发送一张照片，画面是：${附图.文本方向}。消息必须直接围绕这张照片说话，不能写成与图片无关的泛泛问候。`
              : ''
          }${称呼纪律()}${口吻纪律}`,
        );
        const 合法私聊 = 验收短文本(文, 40);
        if (合法私聊) {
          库.消息.push({ 楼, 会话: m, 发: '对方', 文: 合法私聊, 图: 附图?.图 });
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
        const 合法群消息 = 验收单条群消息(文, new Set(在群.map(f => f.名)));
        if (合法群消息) {
          if (探针到点) 标余波({ 探针: true });
          库.消息.push({ 楼, 会话: '群', 发: '对方', 文: 合法群消息 });
          有新 = true;
        } else if (文) {
          console.warn('[人妻公寓·手机] 自动楼务群输出不符合“发言人:30字内单行”，已丢弃。');
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
      const 合法私密动态 = 验收短文本(文, 40);
      if (合法私密动态) {
        库.圈.unshift({ 楼, 谁: 配.妻名, 文: 合法私密动态, 评: [], 私: { 图序 } });
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

    // 节拍水位变化即使无新内容也要落(小生成失败但水位已记:不落=下一拍重掷重复计费)
    const 节拍改: Record<string, number> = {};
    for (const [k, v] of Object.entries(库.节拍)) {
      if (原节拍[k] !== v) 节拍改[k] = v;
    }
    if (有新 || Object.keys(节拍改).length) {
      await 写库增量({
        新圈: 库.圈.slice(0, 库.圈.length - 原圈数),
        新消息: 库.消息.slice(原消息数),
        节拍改,
      });
      刷新红点();
      渲染();
    }
  } catch (e) {
    console.error('[人妻公寓·手机] 节拍失败:', e);
  } finally {
    节拍进行中 = false;
  }
}

// ============================================
// 手机壳 UI(注入 window.parent 文档;玉子同款防重复;命名空间 #rq-phone)
// ============================================

const ROOT_ID = 'rq-phone-root';
// ⚠ 与 App.vue 素材基址同步：Discord 测试版发布 tag=rq0.54。
const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.54/dist/人妻公寓/素材';

let 当前页: {
  名: 'chats' | 'chat' | 'moments' | 'call' | 'talk' | 'settings';
  /** chat:单聊"+"面板是否展开(约出来入口) */
  加?: boolean;
  会话?: string;
  展开?: number; // moments:考古已加载条数(混排流)
  题?: string; // moments:展开中的"哪里不对劲?"(`门牌:序`)
  滚动?: number; // moments:题目展开/作答触发整页重绘时恢复当前位置
} = { 名: 'chats' };
let 通话记录: { 谁: string; 文: string }[] = [];
let 通话上下文: { 分数段: string; 报表: string; 通牒: boolean } | null = null;
let 本通父亲主题 = '';

function 根文档(): Document {
  return (window.parent ?? window).document;
}

function el(tag: string, cls: string, html?: string): HTMLElement {
  const e = 根文档().createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

const 手机图标路径: Record<string, string> = {
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M10 5h4M11 19h2"/>',
  resize: '<path d="M8 3H3v5M16 21h5v-5M3 8l6-6M21 16l-6 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.3-4A9 9 0 1 1 21 12Z"/><path d="M8 11h8M8 15h5"/>',
  moments:
    '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-4 3 2 3-4 5 6"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  no: '<path d="m6 6 12 12M18 6 6 18"/>',
  ok: '<path d="m5 12 4 4L19 6"/>',
};

function 手机图标(name: string): string {
  return `<svg class="rqp-svg" viewBox="0 0 24 24" aria-hidden="true">${手机图标路径[name] ?? 手机图标路径.phone}</svg>`;
}

const 手机CSS = `
#${ROOT_ID}{position:fixed;right:18px;bottom:76px;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","HarmonyOS Sans","Segoe UI",Roboto,"Noto Sans SC",sans-serif;color:#111;color-scheme:light;text-shadow:none;}
/* 手机挂在酒馆父页面，部分深色主题会用 -webkit-text-fill-color 给所有表单和文字染成浅白色。
   在命名空间内恢复为各元素自己的 color，避免白底白字，同时保留通话页/绿色按钮等原有白字。 */
#${ROOT_ID},#${ROOT_ID} *{box-sizing:border-box;margin:0;padding:0;-webkit-text-fill-color:currentColor;}
#${ROOT_ID} .rqp-svg{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:block;}
#${ROOT_ID} .rqp-toggle{width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(145deg,#292d38,#15171d);color:#fff;font-size:27px;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 6px 18px rgba(0,0,0,.35);position:relative;display:grid;place-items:center;}
#${ROOT_ID} .rqp-toggle .dot{position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:#fa5151;display:none;}
#${ROOT_ID}.has-unread .rqp-toggle .dot{display:block;}
#${ROOT_ID}.ringing .rqp-toggle{animation:rqp-ring .6s ease-in-out infinite;}
@keyframes rqp-ring{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg) scale(1.06)}75%{transform:rotate(12deg) scale(1.06)}}
/* ── 手机壳(柚月小手机同款华为全面屏风:金属机身/药丸双摄/状态栏;yuzuki 授权改造) ── */
#${ROOT_ID} .rqp-shell{display:none;position:absolute;right:0;bottom:64px;width:min(320px,92vw);height:min(692px,80vh);background:#1a1a1a;border-radius:40px;padding:4px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 15px 50px rgba(0,0,0,.4),0 5px 20px rgba(0,0,0,.3);}
#${ROOT_ID}.open .rqp-shell{display:block;}
#${ROOT_ID}.open .rqp-toggle{visibility:hidden;pointer-events:none;}
#${ROOT_ID} .rqp-close{display:none;position:absolute;left:-14px;top:-14px;width:40px;height:40px;border:2px solid #fff;border-radius:50%;background:#20242d;color:#fff;font-size:24px;line-height:1;align-items:center;justify-content:center;cursor:pointer;z-index:80;box-shadow:0 5px 16px rgba(0,0,0,.38);}
#${ROOT_ID}.open .rqp-close{display:flex;}
/* 手柄不放壳内:壳带transform自成层叠上下文,z-index再高也压不过后排的悬浮钮(2026-07-20
   玩家反馈:壳拖到和钮重叠后手柄被钮盖死)——改做钮的后排兄弟,永远浮在钮上;位置随壳右下角在应用位里算 */
#${ROOT_ID} .rqp-resize{display:none;position:absolute;right:-8px;bottom:56px;width:34px;height:34px;border-radius:50%;align-items:center;justify-content:center;background:rgba(26,28,34,.92);color:#b9c8d7;font-size:17px;box-shadow:0 4px 12px rgba(0,0,0,.35);cursor:nwse-resize;z-index:2;touch-action:none;user-select:none;}
#${ROOT_ID}.open .rqp-resize{display:flex;}
#${ROOT_ID} .rqp-guide{position:absolute;inset:44px 14px 18px;z-index:75;border-radius:22px;background:rgba(18,22,29,.94);color:#fff;padding:22px 18px;display:flex;flex-direction:column;justify-content:center;gap:13px;box-shadow:0 10px 35px rgba(0,0,0,.45);}
#${ROOT_ID} .rqp-guide h3{font-size:20px;text-align:center;color:#fff;}
#${ROOT_ID} .rqp-guide p{font-size:13px;line-height:1.65;color:#e9edf3;}
#${ROOT_ID} .rqp-guide b{color:#9dd8ff;}
#${ROOT_ID} .rqp-guide button{border:0;border-radius:10px;background:#07c160;color:#fff;padding:11px 14px;font-size:14px;font-weight:700;cursor:pointer;}
#${ROOT_ID} .rqp-guide small{font-size:11px;line-height:1.5;color:#b9c3d0;text-align:center;}
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
#${ROOT_ID} .rqp-tabs button i{font-style:normal;font-size:20px;line-height:1;display:grid;place-items:center;}
#${ROOT_ID} .rqp-tabs button.on{color:#07c160;}
#${ROOT_ID} .rqp-tabs button .dot{position:absolute;top:4px;right:26%;width:9px;height:9px;border-radius:50%;background:#fa5151;}
/* 朋友圈封面(壁纸作封面图,微信 moments 语法) */
#${ROOT_ID} .rqm-cover{height:132px;background:url('${素材基址}/界面/手机壁纸.webp') center/cover no-repeat,linear-gradient(160deg,#8fb8de,#c3a6d8);position:relative;margin-bottom:26px;}
#${ROOT_ID} .rqm-cover b{position:absolute;right:74px;bottom:-10px;color:#fff;font-size:15px;text-shadow:0 1px 4px rgba(0,0,0,.5);}
#${ROOT_ID} .rqm-cover .rqp-ava{position:absolute;right:12px;bottom:-22px;width:52px;height:52px;border-radius:8px;border:1.5px solid #fff;}
#${ROOT_ID} .rqp-head{flex:none;background:#ededed;padding:12px 14px 9px;display:flex;align-items:center;gap:8px;border-bottom:.5px solid #d9d9d9;}
#${ROOT_ID} .rqp-head b{font-size:16px;font-weight:600;color:#111;flex:1;text-align:center;}
#${ROOT_ID} .rqp-back{border:none;background:none;font-size:18px;cursor:pointer;color:#111;width:24px;font-weight:300;}
#${ROOT_ID} .rqp-gear{border:none;background:none;font-size:17px;cursor:pointer;color:#555;width:24px;display:grid;place-items:center;}
#${ROOT_ID} .rqp-body{flex:1;overflow-y:auto;overscroll-behavior:contain;}
#${ROOT_ID} .rqp-body.chatlist{background:#fff;}
#${ROOT_ID} .rqp-row{display:flex;gap:11px;padding:10px 14px;background:#fff;cursor:pointer;align-items:center;position:relative;}
#${ROOT_ID} .rqp-row::after{content:'';position:absolute;left:71px;right:0;bottom:0;height:.5px;background:#e5e5e5;}
#${ROOT_ID} .rqp-row:active{background:#ececec;}
#${ROOT_ID} .rqp-ava{width:46px;height:46px;border-radius:5px;background:linear-gradient(145deg,#f7efe4,#d9c5ac);border:1px solid rgba(93,67,48,.22);box-shadow:inset 0 0 0 1px rgba(255,255,255,.72),0 1px 3px rgba(47,32,24,.12);flex:none;overflow:hidden;display:grid;place-items:center;font-weight:700;color:#fff;font-size:18px;}
#${ROOT_ID} .rqp-ava img{width:100%;height:100%;object-fit:cover;}
#${ROOT_ID} .rqp-ava.avatar-main img{object-position:center 18%;filter:saturate(.92) contrast(.98) sepia(.035);}
#${ROOT_ID} .rqp-ava.avatar-shadow{background:radial-gradient(circle at 50% 30%,#504b58,#242632 68%,#171923);border-color:rgba(190,155,101,.48);}
#${ROOT_ID} .rqp-ava.avatar-shadow img{mix-blend-mode:screen;filter:sepia(.2) saturate(.72) contrast(1.08);}
#${ROOT_ID} .rqp-ava.avatar-group img{filter:saturate(.82) contrast(.95) sepia(.08);}
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
#${ROOT_ID} .rqp-chat-photo{display:block;width:min(176px,100%);max-height:230px;object-fit:cover;border-radius:4px;margin-top:7px;background:#eee;}
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
#${ROOT_ID} .rqw-only{font-style:normal;font-size:10.5px;color:#d64d8f;background:rgba(214,77,143,.1);border:1px solid rgba(214,77,143,.3);border-radius:999px;padding:1px 7px;margin-left:6px;vertical-align:1px;display:inline-flex;align-items:center;gap:3px;}
#${ROOT_ID} .rqw-only .rqp-svg{width:10px;height:10px;}
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
#${ROOT_ID} .rqw-photo{position:relative;display:block;width:max-content;max-width:78%;margin:6px 0 0;overflow:hidden;border-radius:3px;background:#eee;box-shadow:0 1px 4px rgba(28,24,22,.12);}
#${ROOT_ID} .rqw-photo .rqw-img{display:block;width:auto;max-width:100%;max-height:190px;object-fit:cover;margin:0;}
#${ROOT_ID} .rqw-photo::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 48% 42%,transparent 58%,rgba(37,28,24,.10) 100%);mix-blend-mode:multiply;}
#${ROOT_ID} .rqw-photo.history{padding:3px;background:#f6f0e7;border:1px solid rgba(104,78,56,.18);}
#${ROOT_ID} .rqw-photo.history .rqw-img{filter:saturate(.88) contrast(.96) sepia(.055);}
#${ROOT_ID} .rqw-photo.history::before{content:'ARCHIVE';position:absolute;right:7px;bottom:6px;z-index:2;color:rgba(255,250,242,.82);font:600 7px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:1.2px;text-shadow:0 1px 3px rgba(22,16,13,.75);}
#${ROOT_ID} .rqw-photo.history::after{inset:3px;background:radial-gradient(circle at 48% 42%,rgba(255,244,224,.025) 0 1px,transparent 1.2px),radial-gradient(circle at 48% 42%,transparent 55%,rgba(48,31,22,.16) 100%);background-size:4px 4px,100% 100%;}
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
#${ROOT_ID} .rqp-set{padding:16px 16px max(18px,env(safe-area-inset-bottom));display:flex;flex:1;min-height:0;flex-direction:column;gap:10px;background:#fff;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
#${ROOT_ID} .rqp-set .rqp-api-section{display:flex;flex-direction:column;gap:10px;}
#${ROOT_ID} .rqp-set .custom-api-fields{display:flex;flex-direction:column;gap:10px;}
#${ROOT_ID} .rqp-set .toggle-custom{text-align:left;width:100%;}
#${ROOT_ID} .rqp-set label{font-size:12px;color:#333!important;-webkit-text-fill-color:#333!important;display:flex;flex-direction:column;gap:4px;}
#${ROOT_ID} .rqp-set input,#${ROOT_ID} .rqp-set select{border:1px solid #ddd;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;background:#fff;color:#111!important;-webkit-text-fill-color:#111!important;caret-color:#111;opacity:1;}
#${ROOT_ID} .rqp-set input::placeholder{color:#8a8a8a!important;-webkit-text-fill-color:#8a8a8a!important;opacity:1;}
#${ROOT_ID} .rqp-set button:not(.save){border:1px solid #d4d4d4;border-radius:6px;background:#f5f5f5;color:#333!important;-webkit-text-fill-color:#333!important;padding:7px 10px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;}
#${ROOT_ID} .rqp-set button:not(.save):hover{background:#eaeaea;border-color:#bdbdbd;}
#${ROOT_ID} .rqp-set button:disabled{color:#777!important;-webkit-text-fill-color:#777!important;opacity:.7;cursor:default;}
#${ROOT_ID} .rqp-set .save{position:sticky;bottom:0;z-index:2;flex:none;border:none;border-radius:6px;background:#07c160;color:#fff!important;-webkit-text-fill-color:#fff!important;padding:9px;cursor:pointer;font-size:13px;box-shadow:0 -7px 12px rgba(255,255,255,.92);}
#${ROOT_ID} .rqp-set .credit{font-size:10px;color:#707070!important;-webkit-text-fill-color:#707070!important;margin-top:4px;line-height:1.6;}
`;

function 头像块(名: string): string {
  const 丈夫名 = new Set(门牌列表.map(m => 户静态表[m].夫名).filter(Boolean));
  const 文件 = 名 === '父亲' || 丈夫名.has(名) ? '影子' : 名; // 五夫+父亲=柯南影子头像(设计拍板共用)
  const 语义框 =
    文件 === '主角' ? ' avatar-main' : 文件 === '影子' ? ' avatar-shadow' : 文件 === '群' ? ' avatar-group' : '';
  return `<span class="rqp-ava${语义框}"><img src="${素材基址}/头像/${文件}.webp" onerror="this.remove();this.parentElement.textContent='${名[0] ?? '?'}'"/></span>`;
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
/** 首次操作教程由挂载闭包赋值，游戏内 Dock 打开手机时也能调用。 */
let 显示手机教程: () => void = () => {};
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
    `<div class="rqp-shell"><button class="rqp-close" type="button" title="收起手机" aria-label="收起手机">×</button><div class="rqp-punch"></div>` +
    `<div class="rqp-status"><span class="tm"></span><span class="rt"><span class="bars"><i></i><i></i><i></i><i></i></span><span class="rqp-batt"><i></i></span></span></div>` +
    `<div class="rqp-screen"></div>` +
    `</div><button class="rqp-toggle" title="手机">${手机图标('phone')}<span class="dot"></span></button>` +
    `<div class="rqp-resize" title="按住拖动调节手机大小">${手机图标('resize')}</div>`;
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
  const 首次教程键 = '人妻公寓_手机操作教程_v1';
  const 关闭手机 = () => {
    root.classList.remove('open');
    root.querySelector('.rqp-guide')?.remove();
    eventEmit('人妻公寓:手机收起');
  };
  (root.querySelector('.rqp-close') as HTMLButtonElement).addEventListener('click', ev => {
    ev.stopPropagation();
    if (!开合防抖()) return;
    关闭手机();
  });
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
    // 左上角外侧有独立关闭钮，给它留出安全边距，避免手机贴边后按钮被视口裁掉。
    if (r.left + dx < 18) dx = 18 - r.left;
    if (r.bottom > h - 2) dy = h - 2 - r.bottom;
    if (r.top + dy < 18) dy = 18 - r.top;
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
  显示手机教程 = () => {
    try {
      if (localStorage.getItem(首次教程键) === '1' || root.querySelector('.rqp-guide')) return;
    } catch {
      if (root.querySelector('.rqp-guide')) return;
    }
    const 教程 = el('div', 'rqp-guide');
    教程.innerHTML = `
      <h3>手机怎么移动和缩放？</h3>
      <p><b>移动：</b>按住手机顶部的状态栏或黑色摄像头区域拖动。</p>
      <p><b>缩放：</b>拖动手机右下角的斜向缩放按钮，可在 60%～160% 间调整。</p>
      <p><b>收起：</b>点击手机左上角外侧的“×”；原来的悬浮手机图标在展开时会隐藏，不再挡住界面。</p>
      <button type="button">我知道了，开始使用</button>
      <small>位置和大小会自动记住，下次打开继续沿用。</small>`;
    教程.querySelector('button')?.addEventListener('click', () => {
      try {
        localStorage.setItem(首次教程键, '1');
      } catch {
        /* 记不住只会下次再提示 */
      }
      教程.remove();
    });
    壳.appendChild(教程);
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
      显示手机教程();
    } else {
      关闭手机(); // 客户端听它:开机时替玩家退过真全屏的,收起送回去
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
    root.querySelector('.rqp-guide')?.remove();
    eventEmit('人妻公寓:手机收起'); // 客户端听它:开机时替玩家退过真全屏的,收起送回去
    return;
  }
  root.classList.add('open');
  if (直达来电 && 有来电()) 当前页 = { 名: 'call' };
  渲染();
  拉回视口();
  显示手机教程();
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
      const g = el('button', 'rqp-gear', 手机图标('gear'));
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
    签('chats', '微信', 手机图标('chat'), 未读 || 有来电(), () => {
      当前页 = 有来电() ? { 名: 'call' } : { 名: 'chats' };
      渲染();
    });
    签('moments', '朋友圈', 手机图标('moments'), 圈新, async () => {
      当前页 = { 名: 'moments' };
      const 库2 = 读库();
      库2.圈读到 = 楼;
      await 写库(库2);
      渲染();
      刷新红点();
    });
    签('settings', '我', 手机图标('me'), false, () => {
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
            `${头像块(消息头像)}<div class="rqp-b ${我方 ? 'me' : 'ta'}">${_.escape(m.文)}${
              m.图
                ? `<img class="rqp-chat-photo" src="${素材基址}/微信圈/${m.图
                    .split('/')
                    .map(段 => encodeURIComponent(段))
                    .join('/')}.webp" loading="lazy" onerror="this.remove()"/>`
                : ''
            }</div>`,
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
        `${头像块(c.谁)}<div class="rqw-r"><span class="rqw-name">${_.escape(c.谁)}${c.私 ? `<i class="rqw-only">${手机图标('lock')}仅你可见</i>` : ''}</span>` +
          `<div class="rqw-text">${正文}</div>` +
          (c.私
            ? `<span class="rqw-photo private"><img class="rqw-img" src="${素材基址}/微信圈/仅你可见/${encodeURIComponent(c.谁)}_${c.私.图序}.webp" loading="lazy" onerror="this.parentElement.remove()"/></span>`
            : c.图
              ? `<span class="rqw-photo current"><img class="rqw-img" src="${素材基址}/微信圈/${c.图}.webp" loading="lazy" onerror="this.parentElement.remove()"/></span>`
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
    // rq0.45 每次只渲染一轮混排，后续内容依赖列表底部的“加载更早”按钮；
    // 部分酒馆/手机尺寸中该按钮不可达，导致 301 只能看到第一条普通动态，整条裂缝线锁死。
    // 历史条目均为本地静态数据，直接完整渲染，不增加任何 AI 上下文或数据库调用。
    for (const { 门牌: m, 序, 条 } of 混史) {
      const 妻名 = 户静态表[m].妻名;
      const 键 = `${m}:${序}`;
      const 开题 = 当前页.题 === 键;
      // 历史动态可以在该户正式入住前作为长期伏笔出现，但裂缝调查必须等角色入列。
      // rq0.50 曾只判断“条目是否关键”，导致开局即可点开 301 的“哪里不对劲？”
      // （后台虽会拒绝发碎片，UI 仍然提前泄题）。母亲还需服从系统级入列门。
      const 可调查关键 = Boolean(条.关键 && data?.户[m]) && (m !== '302' || Boolean(data?.系统._母亲入列));
      const 图块 = 条.图
        ? `<span class="rqw-photo history"><img class="rqw-img" src="${素材基址}/微信圈/${条.图}.webp" loading="lazy" onerror="this.parentElement.remove()"/></span>`
        : '';
      const 卡 = el(
        'div',
        `rqw-post${开题 ? ' key-open' : ''}`,
        `${头像块(妻名)}<div class="rqw-r"><span class="rqw-name">${_.escape(妻名)}</span>` +
          `<div class="rqw-text">${_.escape(条.文).replace(/#([^#\s]{1,12})#/g, '<span class="tp">#$1#</span>')}</div>${图块}` +
          `<div class="rqw-foot"><span class="rqw-time">${_.escape(条.时间)}</span><span class="rqw-dots">••</span></div></div>`,
      );
      if (可调查关键 && 条.关键) {
        卡.style.cursor = 'pointer';
        卡.addEventListener('click', ev => {
          if ((ev.target as HTMLElement).closest('.rqw-quiz')) return;
          当前页 = { ...当前页, 题: 开题 ? undefined : 键, 滚动: 体.scrollTop };
          渲染();
        });
        if (开题) {
          const 题区 = el('div', 'rqw-quiz', `<p>哪里不对劲?</p>`);
          条.关键.选项.forEach((文, i) => {
            const b = el('button', '', _.escape(文));
            b.addEventListener('click', () => {
              当前页 = { ...当前页, 题: undefined, 滚动: 体.scrollTop };
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
    const 更 = el('button', 'rqw-more', '翻到底了');
    更.addEventListener('click', () => eventEmit('人妻公寓:考古到底'));
    体.appendChild(更);
    屏.appendChild(体);
    体.scrollTop = Math.max(0, 当前页.滚动 ?? 0);
    底栏('moments');
    return;
  }

  if (当前页.名 === 'call') {
    // 微信语音来电(父亲;跳动指示→点开手机→此屏接听)
    头('微信语音');
    const 区 = el('div', 'rqp-call');
    区.innerHTML = `${头像块('父亲')}<b>爸</b><i>邀请你进行语音通话…</i><div class="acts"><button class="no" title="挂断">${手机图标('no')}</button><button class="ok" title="接听">${手机图标('ok')}</button></div>`;
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
    const 区 = el('div', 'rqp-set');
    区.innerHTML = `
      <label>手机内容 API<select class="i-source">
        <option value="自动"${c.ai来源 === '自动' ? ' selected' : ''}>自动（数据库优先）</option>
        <option value="数据库"${c.ai来源 === '数据库' ? ' selected' : ''}>只用数据库</option>
        <option value="正文"${c.ai来源 === '正文' ? ' selected' : ''}>只用正文 API</option>
        <option value="自定义"${c.ai来源 === '自定义' ? ' selected' : ''}>手机专用模型（自定义 API）</option>
      </select></label>
      <div class="rqp-api-section db-api-section">
        <p class="db-status" style="color:${db.可调用AI ? '#287a50' : '#666'};font-size:12px;margin:2px 0 8px">数据库：${
          db.可调用AI
            ? `已连接${db.已装游戏模板 ? '，人妻公寓表已安装' : '，尚未安装人妻公寓表'}`
            : '未检测到公开 API（自动模式会使用正文 API）'
        }</p>
        <p style="color:#666;font-size:11px;margin:0 0 6px">数据库模式沿用数据库当前配置，不在这里读取或修改数据库密钥与模型。需要给手机单独选模型，请展开下方“手机专用模型”，填写API后读取模型列表。</p>
        <label style="display:flex;align-items:center;gap:8px"><input class="i-db-fallback" type="checkbox" style="width:auto"${
          c.数据库失败回退 ? ' checked' : ''
        }/>数据库请求报错时再尝试正文 API（可能造成双请求）</label>
        <span style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="install-db">安装/更新本游戏表</button><button class="open-db">查看数据库表</button></span>
      </div>
      <div class="rqp-api-section custom-api-section">
        <button type="button" class="toggle-custom">手机专用模型（自定义 API）</button>
        <div class="custom-api-fields">
          <p style="color:#666;font-size:11px">不经过数据库时使用。填写OpenAI兼容API的地址和Key，再读取该API实际提供的模型。</p>
          <label>自定义API 地址（OpenAI兼容）<input class="i-base" value="${_.escape(c.base)}" placeholder="https://…/v1"/></label>
          <label>API Key<input class="i-key" type="password" value="${_.escape(c.key)}"/></label>
          <label>模型<span style="display:flex;gap:6px"><input class="i-model" style="flex:1;min-width:0" value="${_.escape(c.model)}" placeholder="先读取或直接填写"/><button class="fetch-models" style="flex:none;padding:0 10px">读取API模型</button></span></label>
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
      自定义开关.textContent = `${自定义展开 ? '▾' : '▸'} 手机专用模型（自定义 API）`;
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
    // 读取模型列表统一走酒馆助手宿主代理；不能从手机 iframe 直接 fetch，
    // 否则目标 API 即使可用，也可能被 CORS/移动端 WebView 拦成 Failed to fetch。
    (区.querySelector('.fetch-models') as HTMLButtonElement).addEventListener('click', () => {
      const base = (区.querySelector('.i-base') as HTMLInputElement).value.trim().replace(/\/+$/, '');
      const key = (区.querySelector('.i-key') as HTMLInputElement).value.trim();
      const 按钮 = 区.querySelector('.fetch-models') as HTMLButtonElement;
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
      按钮.disabled = true;
      按钮.textContent = '读取中…';
      void getModelList({ apiurl: base, key })
        .then(模型们 => {
          const 们 = [
            ...new Set(
              模型们
                .map(String)
                .map(model => model.trim())
                .filter(Boolean),
            ),
          ].sort((a, b) => a.localeCompare(b));
          if (!们.length) throw new Error('列表为空');
          选.innerHTML =
            '<option value="">— 从列表选择 —</option>' +
            们.map(m => `<option value="${_.escape(m)}">${_.escape(m)}</option>`).join('');
          选.style.display = 'block';
          来源选择.value = '自定义';
          刷新API分区();
          说(`读到 ${们.length} 个模型,从下拉里选一个。`);
        })
        .catch(e => {
          const 原因 = e instanceof Error ? e.message : String(e);
          说(`读取失败：${原因.slice(0, 140)}（请确认地址填到兼容API的版本根路径；也可以直接填写模型名）`);
        })
        .finally(() => {
          按钮.disabled = false;
          按钮.textContent = '读取API模型';
        });
    });
    (区.querySelector('.i-models') as HTMLSelectElement).addEventListener('change', ev => {
      const v = (ev.target as HTMLSelectElement).value;
      if (v) (区.querySelector('.i-model') as HTMLInputElement).value = v;
    });
    (区.querySelector('.save') as HTMLButtonElement).addEventListener('click', () => {
      存配置({
        ai来源: (区.querySelector('.i-source') as HTMLSelectElement).value as 手机AI来源,
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
//    AI 只照结果写回复;应约=写 _赴约(2楼跟随窗口),期间她的位置=玩家的位置；
//    窗口内若继续聊天则由普通对话粘滞接管，未继续聊天则到期离开) ──

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
    const 回 = 验收短文本(
      await 小生成(
        '你在扮演一款都市题材游戏中的已婚女性,刚收到公寓管理员发来的微信邀约。结果已由系统裁定,你只负责照结果写她的回复(口语,不超过40字,可含emoji,不要引号,不要旁白,不要任何标签)。' +
          口吻纪律,
        `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${家庭事实(m)}${妻状态包(m, data)}${await 人设段(m)}时段:${时段名}。${称呼纪律()}${尾 ? `\n刚刚现实里发生的事(正文节选,回复要接得上这口气):${尾}` : ''}\n裁定结果:${
          应
            ? '她答应出来见面(按她此刻的真实状态拿捏语气:关系浅=犹豫着答应,关系深=藏不住的高兴)'
            : '她婉拒了(给个合乎生活的理由:在做饭/家里有人/不太方便;按她此刻的真实状态拿捏惋惜程度)'
        }。生成她的回复。`,
      ),
      40,
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
    // 长期记忆直写(措辞固定,不带聊天原文;无数据库时静默返回 false 不影响流程)
    void 同步社交轨迹({
      类型: '邀约',
      人物: 配.妻名,
      事件: '微信约她出来见面',
      结果: 应 ? '她答应出来见面了' : '她婉拒了,没出来',
      楼层: 楼,
      事件键: `RQP-约-${m}-${楼}`,
    });
    if (应) {
      // 必须等赴约状态真正落库后再广播位置刷新；旧写法 fire-and-forget，客户端先读到旧值，
      // 要等后续几个回合的其他刷新才看见她到场。
      // 赴约本身只跟随 2 楼：玩家若在窗口内继续聊天，回合快照会把她写入普通对话粘滞，
      // 之后即使赴约到期也继续留场；若玩家没有继续聊天，2楼后便回归作息。
      await Promise.resolve(insertOrAssignVariables({ _赴约: { m, 起楼: 楼, 至楼: 楼 + 2 } }, { type: 'chat' }));
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
  for (const 行 of 原.split('\n').slice(0, 4)) {
    const m = 行.trim().match(/^([^::]{1,8})[::]\s*(.+)$/);
    const 合法消息 = m && 妻名集.has(m[1]) ? 验收单条群消息(行, 妻名集, 30) : null;
    if (!合法消息) continue;
    库.消息.push({ 楼, 会话: '姐妹群', 发: '对方', 文: 合法消息 });
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
  for (const 行 of 原.split('\n').slice(0, 3)) {
    const m = 行.trim().match(/^([^::]{1,8})[::]\s*(.+)$/);
    const 合法消息 = m && 合法名.has(m[1]) ? 验收单条群消息(行, 合法名, 35) : null;
    if (!合法消息) continue;
    库.消息.push({ 楼, 会话: '群', 发: '对方', 文: 合法消息 });
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
        '纪律:下面给出的"她此刻的真实状态"是唯一权威,态度亲疏严格照此拿捏,不因单条消息内容自行升降关系;攻略阶段必须循序渐进，不能把低阶段写成高阶段;不提及任何游戏机制;她此刻在自己的生活场景里(可自然带一句在做什么)。' +
        口吻纪律,
      `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。${家庭事实(会话 as 门牌)}${妻状态包(会话 as 门牌, data)}${await 人设段(会话 as 门牌)}私聊阶段方向:${攻略私聊提示(
        会话 as 门牌,
        节点.妻.当前阶段,
        节点.妻.裂缝.已确认,
      )}她此刻大致在:${妻位置推算(会话 as 门牌, 楼 + data.系统._时段偏移楼)}。${称呼纪律()}${尾 ? `\n刚刚现实里发生的事(正文节选,她的微信口吻要接得上这口气):${尾}` : ''}\n最近聊天:\n${近况}\n生成她的回复。`,
    );
    const 合法回复 = 验收短文本(回, 50);
    if (合法回复) {
      const 库2 = 读库();
      库2.消息.push({ 楼: 末楼(), 会话, 发: '对方', 文: 合法回复 });
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
  const 已有通话数 = 读库().消息.filter(x => x.会话 === '父亲' && x.类 === '通话').length;
  const 轮换主题 = [
    '这期账本是否逐笔对得上',
    '楼里的报修、门禁和公共设施有没有拖着',
    '空置房的招租进度与看房情况',
    '租户最近有没有投诉、欠租或搬走的苗头',
    '儿子能不能独立把这栋楼管住，别只报喜不报忧',
    '家里近况；可以顺带问一次母亲，但不能把每通电话都变成询问母亲',
  ];
  const 报表重点 = /上交缺口/.test(载荷.报表)
    ? '本期上交为什么出现缺口，以及准备怎么补齐'
    : /旧欠租/.test(载荷.报表)
      ? '旧欠租为什么还没处理，以及催收进展'
      : /风声/.test(载荷.报表)
        ? '楼里的投诉和闲话从哪里来，管理上出了什么问题'
        : /一直没接/.test(载荷.报表)
          ? '上次为什么一直不接电话，以及是否还在认真管楼'
          : '';
  本通父亲主题 = 载荷.通牒
    ? '最后通牒与下一期必须补救的事项'
    : [报表重点, 轮换主题[已有通话数 % 轮换主题.length]].filter(Boolean).join('；顺带问');
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
  return (
    验收短文本(
      await 小生成(
        '你在扮演一位常年在海外做生意的中国父亲,正和管理公寓的儿子微信语音通话。只输出父亲的下一句话(口语,不超过60字,不要引号,不要旁白)。他务实、寡言、看重账目,爱藏在训话里。每通电话应有不同的具体事务，严禁机械地总问“你妈怎么样”。只有本通主题涉及家里或儿子主动提到母亲时，才自然谈母亲。',
        `儿子名叫"${玩家名()}"(直呼其名或"你",不要用别的称呼)。本期情况:${上?.报表 || '账目平平'}。谈话基调=${段}。本通主题=${本通父亲主题 || '楼务近况'}。第一次开口先谈本通主题；之后紧接儿子的回答，不要突然换题。\n通话记录:\n${记录 || '(刚接通)'}\n儿子刚说:${玩家说}\n父亲接话。`,
      ),
      60,
    ) ?? ''
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
  // 长期记忆直写:只记结论档位的固定措辞,通话原文一个字不进表
  if (通话上下文) {
    void 同步社交轨迹({
      类型: '来电',
      人物: '父亲',
      事件: '父亲来电问账',
      结果: 通话上下文.通牒
        ? '父亲撂下狠话:再管不好这栋楼,就换人来管'
        : 通话上下文.分数段 === '满意'
          ? '父亲对近期楼务还算满意'
          : 通话上下文.分数段 === '平淡'
            ? '父亲例行过账,敲打了几句'
            : '父亲很不满,逐条问了账',
      楼层: 楼,
      事件键: `RQP-来电-${楼}`,
    });
  }
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
  本通父亲主题 = '';
  当前页 = { 名: 'chats' };
  渲染();
  刷新红点();
  eventEmit('人妻公寓:父亲通话结束');
}
