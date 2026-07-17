import type { SchemaType } from '../../schema';
import type { 门牌 } from '../../stageConfig';
import { 户静态表, 门牌列表 } from '../../stageConfig';
import { 妻位置推算, 当前时段, seededRandom } from './楼层时钟';
import { 读取, 读最近有效stat, 脚本写入 } from './mvuIO';
import { 捕获保护快照 } from './守护系统';
import { Schema } from '../../schema';

/**
 * 手机系统(P4:微信一 App;形态参考 玉子手机(yuzi83)·柚月,经双授权改造,谨此致谢)
 *
 * 挂载:注入酒馆页面文档(window.parent)——与游戏卡片 iframe 平级的独立手机(用户拍板,
 * 非游戏内浮层);玉子同款防重复加载。游戏界面只有"跳动来电指示/红点",点击唤起本机。
 *
 * 数据:chat 变量 `_微信`(跟档案走,不塞 MVU 防楼层快照膨胀);每条消息/动态带楼层戳,
 * 渲染按当前楼过滤——回档=微信也回到那一天。`_`与裸数值不进生成提示词(数据隔离照守)。
 *
 * 生成双档:独立API(手机设置页配 base/key/model)优先,主API静默 generateRaw 兜底;
 * 生成完全不占楼层、不耗正文 token。内容只传档位标签(如"好感高/堕落中段"),不传裸数值。
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

function 写库(库: 微信库): void {
  void Promise.resolve(insertOrAssignVariables({ _微信: 库 }, { type: 'chat' })).catch((e: unknown) =>
    console.error('[人妻公寓·手机] 微信库写入失败', e),
  );
}

const 末楼 = () => SillyTavern.chat?.length ?? 0;

// ============================================
// 手机配置(localStorage:独立API + 动态频率总闸)
// ============================================

interface 手机配置 {
  base: string;
  key: string;
  model: string;
  频率: '勤' | '普通' | '静' | '关';
}

const 配置KEY = '人妻公寓_手机配置';

function 读配置(): 手机配置 {
  try {
    const root = (window.parent ?? window) as Window;
    const raw = root.localStorage?.getItem(配置KEY);
    if (raw) return { base: '', key: '', model: '', 频率: '普通', ...(JSON.parse(raw) as Partial<手机配置>) };
  } catch {
    /* 读取失败走默认 */
  }
  return { base: '', key: '', model: '', 频率: '普通' };
}

function 存配置(c: 手机配置): void {
  try {
    ((window.parent ?? window) as Window).localStorage?.setItem(配置KEY, JSON.stringify(c));
  } catch {
    /* 存储失败静默 */
  }
}

// ============================================
// 生成双档(独立API优先,主API generateRaw 静默兜底;失败返回空串=本拍跳过不补发)
// ============================================

async function 小生成(系统提示: string, 用户提示: string): Promise<string> {
  const c = 读配置();
  if (c.base && c.key && c.model) {
    try {
      const res = await fetch(`${c.base.replace(/\/+$/, '')}/chat/completions`, {
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
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const 文 = j.choices?.[0]?.message?.content?.trim();
      if (文) return 文;
    } catch (e) {
      console.warn('[人妻公寓·手机] 独立API失败,回落主API:', e);
    }
  }
  try {
    const 原 = await generateRaw({
      ordered_prompts: [{ role: 'system', content: 系统提示 }, 'user_input'],
      user_input: 用户提示,
      should_stream: false,
    });
    return String(原 ?? '').trim();
  } catch (e) {
    console.warn('[人妻公寓·手机] 主API兜底也失败,本拍跳过:', e);
    return '';
  }
}

// ============================================
// 好友表(联系方式=挣来的剧情资产:妻 阶段≥1 才互加;父亲/楼群常驻)
// ============================================

export function 微信好友(data: SchemaType): { id: string; 名: string; 类: '妻' | '父亲' | '群' }[] {
  const 友: { id: string; 名: string; 类: '妻' | '父亲' | '群' }[] = [{ id: '父亲', 名: '爸', 类: '父亲' }];
  for (const m of 门牌列表) {
    const 节点 = data.户[m];
    const 配 = 户静态表[m];
    if (!节点 || 配.隐身) continue;
    if (节点.妻.当前阶段 >= 1) 友.push({ id: m, 名: 配.妻名, 类: '妻' });
  }
  友.push({ id: '群', 名: '梧桐里7号楼务群', 类: '群' });
  return 友;
}

// 快照侧联系方式行由 snapshotSystem 自行内联计算(同一判据:妻阶段≥1),避免模块环

// ============================================
// 内容引擎(近期流 v1 + 主动消息 v1 + 群聊 v1;回合完成后节拍驱动,全异步不占楼)
// ============================================

const 频率倍率: Record<手机配置['频率'], number> = { 勤: 0.6, 普通: 1, 静: 2, 关: Infinity };

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

    // ── 朋友圈近期流(每户 8~15 楼一条,种子错开相位;纯演出永不承载伏笔) ──
    for (const m of 门牌列表) {
      const 节点 = data.户[m];
      const 配 = 户静态表[m];
      if (!节点 || 配.隐身) continue;
      const 键 = `圈:${m}`;
      const 上次 = 库.节拍[键] ?? -999;
      const 间隔 = Math.round((8 + Math.floor(seededRandom(m, '圈相位') * 8)) * 倍);
      if (钟 - 上次 < 间隔) continue;
      库.节拍[键] = 钟;
      const 妻 = 节点.妻;
      const 文 = await 小生成(
        '你替一款都市题材游戏生成一条中国已婚女性的微信朋友圈文案。只输出文案本身(可含emoji),不超过60字,不要引号,不要解释。' +
          '纪律:内容=日常生活切片(做饭/天气/追剧/楼里琐事),按人物状态微调语气;绝不提及任何秘密、暧昧对象或游戏机制。',
        `人物:${配.妻名},${配.初始?.气质描述 ?? '一位住在老公寓里的太太'}。当前状态档:${档位标签(妻.当前阶段, 妻.好感值, 妻.堕落值)};时段:${当前时段(钟)}。生成她此刻发的一条朋友圈。`,
      );
      if (文) {
        库.圈.unshift({ 楼, 谁: 配.妻名, 文, 评: [] });
        有新 = true;
      }
    }

    // ── 主动消息 v1(门槛表:L1~L2 偶发日常有借口 / L3 夜间试探+撤回 / L4 照片 / L5 随叫随到) ──
    for (const m of 门牌列表) {
      const 节点 = data.户[m];
      const 配 = 户静态表[m];
      if (!节点 || 配.隐身 || 节点.妻.当前阶段 < 1) continue;
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
          `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。状态档:${档位标签(阶段, 节点.妻.好感值, 节点.妻.堕落值)};时段:${时段名}。消息方向:${方向}。`,
        );
        if (文) {
          库.消息.push({ 楼, 会话: m, 发: '对方', 文 });
          有新 = true;
        }
      }
    }

    // ── 群聊 v1(安静是常态;风闻到档=含沙射影) ──
    {
      const 上次 = 库.节拍['群'] ?? -999;
      const 间隔 = Math.round(30 * 倍);
      if (钟 - 上次 >= 间隔 && seededRandom(钟, '群聊') < (data.风闻 >= 50 ? 0.6 : 0.25)) {
        库.节拍['群'] = 钟;
        const 在群 = 微信好友(data).filter(f => f.类 === '妻');
        const 谁 = 在群.length ? 在群[Math.floor(seededRandom(钟, '群谁') * 在群.length)].名 : '';
        const 文 = await 小生成(
          '你替一款都市题材游戏生成一条老公寓楼务微信群里的群聊消息。只输出"发言人:内容"一行,内容不超过30字。',
          data.风闻 >= 50
            ? `群成员:${在群.map(f => f.名).join('、') || '楼里太太们'}。楼里最近闲话多(有人留意管理员的行踪),生成一条含沙射影但不点名的群消息${谁 ? `,发言人=${谁}` : ''}。`
            : `群成员:${在群.map(f => f.名).join('、') || '楼里太太们'}。生成一条最寻常的楼务群消息(报修/取快递/天气),发言人任选${谁 ? `(建议${谁})` : ''}。`,
        );
        if (文) {
          库.消息.push({ 楼, 会话: '群', 发: '对方', 文 });
          有新 = true;
        }
      }
    }

    if (有新) {
      写库(库);
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
const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.16/dist/人妻公寓/素材';

let 当前页: { 名: 'home' | 'chats' | 'chat' | 'moments' | 'call' | 'talk' | 'settings'; 会话?: string } = {
  名: 'home',
};
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
#${ROOT_ID}{position:fixed;right:18px;bottom:76px;z-index:99990;font-family:-apple-system,"Segoe UI",Roboto,"Noto Sans SC",sans-serif;}
#${ROOT_ID} *{box-sizing:border-box;margin:0;padding:0;}
#${ROOT_ID} .rqp-toggle{width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:#1a1c22;color:#fff;font-size:24px;box-shadow:0 6px 18px rgba(0,0,0,.35);position:relative;}
#${ROOT_ID} .rqp-toggle .dot{position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:#fa5151;display:none;}
#${ROOT_ID}.has-unread .rqp-toggle .dot{display:block;}
#${ROOT_ID}.ringing .rqp-toggle{animation:rqp-ring .6s ease-in-out infinite;}
@keyframes rqp-ring{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg) scale(1.06)}75%{transform:rotate(12deg) scale(1.06)}}
#${ROOT_ID} .rqp-shell{display:none;position:absolute;right:0;bottom:64px;width:340px;height:640px;max-height:78vh;background:#111;border-radius:28px;padding:10px;box-shadow:0 18px 50px rgba(0,0,0,.5);}
#${ROOT_ID}.open .rqp-shell{display:block;}
#${ROOT_ID} .rqp-screen{width:100%;height:100%;background:#ededed;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;position:relative;}
#${ROOT_ID} .rqp-head{flex:none;background:#ededed;padding:12px 14px 8px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #ddd;}
#${ROOT_ID} .rqp-head b{font-size:15px;color:#111;flex:1;text-align:center;}
#${ROOT_ID} .rqp-back{border:none;background:none;font-size:16px;cursor:pointer;color:#111;width:24px;}
#${ROOT_ID} .rqp-gear{border:none;background:none;font-size:15px;cursor:pointer;color:#555;width:24px;}
#${ROOT_ID} .rqp-body{flex:1;overflow-y:auto;overscroll-behavior:contain;}
#${ROOT_ID} .rqp-row{display:flex;gap:10px;padding:11px 14px;background:#fff;border-bottom:1px solid #f2f2f2;cursor:pointer;align-items:center;}
#${ROOT_ID} .rqp-row:hover{background:#f7f7f7;}
#${ROOT_ID} .rqp-ava{width:42px;height:42px;border-radius:6px;background:#c8cad0;flex:none;overflow:hidden;display:grid;place-items:center;font-weight:700;color:#fff;font-size:18px;}
#${ROOT_ID} .rqp-ava img{width:100%;height:100%;object-fit:cover;}
#${ROOT_ID} .rqp-row .mid{flex:1;min-width:0;}
#${ROOT_ID} .rqp-row .mid b{font-size:14px;color:#111;display:block;}
#${ROOT_ID} .rqp-row .mid i{font-style:normal;font-size:12px;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:200px;}
#${ROOT_ID} .rqp-row .dot{width:9px;height:9px;border-radius:50%;background:#fa5151;flex:none;}
#${ROOT_ID} .rqp-bubbles{padding:12px;display:flex;flex-direction:column;gap:10px;}
#${ROOT_ID} .rqp-b{max-width:76%;padding:8px 11px;border-radius:8px;font-size:13px;line-height:1.5;color:#111;word-break:break-word;}
#${ROOT_ID} .rqp-b.me{align-self:flex-end;background:#95ec69;}
#${ROOT_ID} .rqp-b.ta{align-self:flex-start;background:#fff;}
#${ROOT_ID} .rqp-b.sys{align-self:center;background:none;color:#999;font-size:11px;}
#${ROOT_ID} .rqp-input{flex:none;display:flex;gap:8px;padding:8px;background:#f7f7f7;border-top:1px solid #ddd;}
#${ROOT_ID} .rqp-input textarea{flex:1;resize:none;border:1px solid #ddd;border-radius:6px;padding:6px 8px;font-size:13px;height:38px;font-family:inherit;}
#${ROOT_ID} .rqp-input button{border:none;border-radius:6px;background:#07c160;color:#fff;padding:0 14px;cursor:pointer;font-size:13px;}
#${ROOT_ID} .rqp-input button:disabled{opacity:.5;cursor:default;}
#${ROOT_ID} .rqp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:26px 20px;}
#${ROOT_ID} .rqp-app{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;border:none;background:none;position:relative;}
#${ROOT_ID} .rqp-app .ic{width:52px;height:52px;border-radius:12px;display:grid;place-items:center;font-size:26px;color:#fff;}
#${ROOT_ID} .rqp-app span{font-size:11px;color:#333;}
#${ROOT_ID} .rqp-app .dot{position:absolute;top:-3px;right:8px;width:10px;height:10px;border-radius:50%;background:#fa5151;}
#${ROOT_ID} .rqp-moment{background:#fff;padding:12px 14px;border-bottom:8px solid #ededed;}
#${ROOT_ID} .rqp-moment .who{display:flex;gap:8px;align-items:center;margin-bottom:6px;}
#${ROOT_ID} .rqp-moment .who b{font-size:13px;color:#576b95;}
#${ROOT_ID} .rqp-moment p{font-size:13px;color:#111;line-height:1.55;}
#${ROOT_ID} .rqp-moment .tm{font-size:11px;color:#aaa;margin-top:6px;}
#${ROOT_ID} .rqp-call{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:linear-gradient(180deg,#3a3f4b,#22252d);color:#fff;}
#${ROOT_ID} .rqp-call .rqp-ava{width:84px;height:84px;border-radius:14px;font-size:34px;}
#${ROOT_ID} .rqp-call b{font-size:18px;}
#${ROOT_ID} .rqp-call i{font-style:normal;font-size:12px;opacity:.7;}
#${ROOT_ID} .rqp-call .acts{display:flex;gap:46px;margin-top:26px;}
#${ROOT_ID} .rqp-call .acts button{width:60px;height:60px;border-radius:50%;border:none;font-size:24px;cursor:pointer;color:#fff;}
#${ROOT_ID} .rqp-call .acts .ok{background:#07c160;}
#${ROOT_ID} .rqp-call .acts .no{background:#fa5151;}
#${ROOT_ID} .rqp-set{padding:16px;display:flex;flex-direction:column;gap:10px;background:#fff;height:100%;}
#${ROOT_ID} .rqp-set label{font-size:12px;color:#333;display:flex;flex-direction:column;gap:4px;}
#${ROOT_ID} .rqp-set input,#${ROOT_ID} .rqp-set select{border:1px solid #ddd;border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;}
#${ROOT_ID} .rqp-set .save{border:none;border-radius:6px;background:#07c160;color:#fff;padding:8px;cursor:pointer;font-size:13px;}
#${ROOT_ID} .rqp-set .credit{font-size:10px;color:#bbb;margin-top:auto;line-height:1.6;}
`;

function 头像块(名: string): string {
  return `<span class="rqp-ava"><img src="${素材基址}/头像/${名}.webp" onerror="this.remove();this.parentElement.textContent='${名[0] ?? '?'}'"/></span>`;
}

function 时段字(楼戳: number, 偏移: number): string {
  return `第${Math.floor(Math.max(0, 楼戳 + 偏移) / 18) + 1}天 ${当前时段(楼戳 + 偏移)}`;
}

let 挂好 = false;

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
  root.innerHTML = `<div class="rqp-shell"><div class="rqp-screen"></div></div><button class="rqp-toggle" title="手机">📱<span class="dot"></span></button>`;
  doc.body.appendChild(root);
  root.querySelector('.rqp-toggle')!.addEventListener('click', () => {
    root.classList.toggle('open');
    if (root.classList.contains('open')) {
      // 有来电先接来电,否则回主屏
      当前页 = 有来电() ? { 名: 'call' } : 当前页.名 === 'call' || 当前页.名 === 'talk' ? { 名: 'home' } : 当前页;
      渲染();
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

/** 游戏界面点了来电指示/手机按钮 */
export function 打开手机(直达来电 = false): void {
  挂载手机();
  const root = 根文档().getElementById(ROOT_ID);
  if (!root) return;
  root.classList.add('open');
  if (直达来电 && 有来电()) 当前页 = { 名: 'call' };
  渲染();
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

  if (当前页.名 === 'home') {
    头('手机', undefined, true);
    const 体 = el('div', 'rqp-body');
    const 格 = el('div', 'rqp-grid');
    const 未读 = 库.消息.some(m => m.楼 <= 楼 && m.发 === '对方' && m.楼 > (库.读到[m.会话] ?? -1));
    const 圈新 = 库.圈.some(c => c.楼 <= 楼 && c.楼 > 库.圈读到);
    const 应用 = (名: string, 底色: string, 图: string, 点: boolean, 去: () => void) => {
      const a = el('button', 'rqp-app', `<span class="ic" style="background:${底色}">${图}</span><span>${名}</span>${点 ? '<span class="dot"></span>' : ''}`);
      a.addEventListener('click', 去);
      格.appendChild(a);
    };
    应用('微信', '#07c160', '💬', 未读 || 有来电(), () => {
      当前页 = 有来电() ? { 名: 'call' } : { 名: 'chats' };
      渲染();
    });
    应用('朋友圈', '#576b95', '🌁', 圈新, () => {
      当前页 = { 名: 'moments' };
      const 库2 = 读库();
      库2.圈读到 = 楼;
      写库(库2);
      渲染();
      刷新红点();
    });
    体.appendChild(格);
    屏.appendChild(体);
    return;
  }

  if (当前页.名 === 'chats') {
    头('微信', () => {
      当前页 = { 名: 'home' };
      渲染();
    });
    const 体 = el('div', 'rqp-body');
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
      r.addEventListener('click', () => {
        当前页 = { 名: 'chat', 会话: 友.id };
        const 库2 = 读库();
        库2.读到[友.id] = 楼;
        写库(库2);
        渲染();
        刷新红点();
      });
      体.appendChild(r);
    }
    屏.appendChild(体);
    return;
  }

  if (当前页.名 === 'chat' && 当前页.会话) {
    const 会话 = 当前页.会话;
    const 名 = 会话 === '父亲' ? '爸' : 会话 === '群' ? '梧桐里7号楼务群' : (户静态表[会话 as 门牌]?.妻名 ?? 会话);
    头(名, () => {
      当前页 = { 名: 'chats' };
      渲染();
    });
    const 体 = el('div', 'rqp-body');
    const 泡区 = el('div', 'rqp-bubbles');
    for (const m of 库.消息.filter(x => x.会话 === 会话 && x.楼 <= 楼)) {
      if (m.类 === '撤回') {
        泡区.appendChild(el('div', 'rqp-b sys', '她撤回了一条消息'));
      } else if (m.类 === '通话') {
        泡区.appendChild(el('div', 'rqp-b sys', `[语音通话] ${_.escape(m.文)}`));
      } else {
        泡区.appendChild(el('div', `rqp-b ${m.发 === '我' ? 'me' : 'ta'}`, _.escape(m.文)));
      }
    }
    体.appendChild(泡区);
    屏.appendChild(体);
    // 输入(群=只发物业通知;父亲单聊只读——他只打电话)
    if (会话 !== '父亲') {
      const 行 = el('div', 'rqp-input');
      const ta = el('textarea', '') as HTMLTextAreaElement;
      ta.placeholder = 会话 === '群' ? '发一条物业通知…' : '发消息…';
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
    }
    体.scrollTop = 体.scrollHeight;
    return;
  }

  if (当前页.名 === 'moments') {
    头('朋友圈', () => {
      当前页 = { 名: 'home' };
      渲染();
    });
    const 体 = el('div', 'rqp-body');
    const 圈们 = 库.圈.filter(c => c.楼 <= 楼);
    if (!圈们.length) 体.appendChild(el('div', 'rqp-moment', '<p style="color:#999">还没有动态。</p>'));
    for (const c of 圈们) {
      const 卡 = el(
        'div',
        'rqp-moment',
        `<div class="who">${头像块(c.谁)}<b>${_.escape(c.谁)}</b></div><p>${_.escape(c.文)}</p><div class="tm">${时段字(c.楼, 偏移)}</div>`,
      );
      体.appendChild(卡);
    }
    屏.appendChild(体);
    return;
  }

  if (当前页.名 === 'call') {
    // 微信语音来电(父亲;跳动指示→点开手机→此屏接听)
    头('微信语音');
    const 区 = el('div', 'rqp-call');
    区.innerHTML = `${头像块('父亲')}<b>爸</b><i>邀请你进行语音通话…</i><div class="acts"><button class="no" title="挂断">✕</button><button class="ok" title="接听">✓</button></div>`;
    (区.querySelector('.no') as HTMLButtonElement).addEventListener('click', () => {
      // 挂断=未接红点继续挂着,下一期被覆盖时照扣(经济系统规则)
      当前页 = { 名: 'home' };
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
    头('设置', () => {
      当前页 = { 名: 'home' };
      渲染();
    });
    const c = 读配置();
    const 区 = el('div', 'rqp-set');
    区.innerHTML = `
      <label>独立API 地址(OpenAI兼容,留空=用主API静默兜底)<input class="i-base" value="${_.escape(c.base)}" placeholder="https://…/v1"/></label>
      <label>API Key<input class="i-key" type="password" value="${_.escape(c.key)}"/></label>
      <label>模型<input class="i-model" value="${_.escape(c.model)}" placeholder="gpt-4.1-mini 等"/></label>
      <label>动态频率<select class="i-freq"><option${c.频率 === '勤' ? ' selected' : ''}>勤</option><option${c.频率 === '普通' ? ' selected' : ''}>普通</option><option${c.频率 === '静' ? ' selected' : ''}>静</option><option${c.频率 === '关' ? ' selected' : ''}>关</option></select></label>
      <button class="save">保存</button>
      <p class="credit">手机形态参考:玉子手机(yuzi83)与柚月手机方案,经作者授权改造,谨此致谢。<br/>本机内容由系统生成,不占用正文楼层与 token。</p>`;
    (区.querySelector('.save') as HTMLButtonElement).addEventListener('click', () => {
      存配置({
        base: (区.querySelector('.i-base') as HTMLInputElement).value.trim(),
        key: (区.querySelector('.i-key') as HTMLInputElement).value.trim(),
        model: (区.querySelector('.i-model') as HTMLInputElement).value.trim(),
        频率: (区.querySelector('.i-freq') as HTMLSelectElement).value as 手机配置['频率'],
      });
      当前页 = { 名: 'home' };
      渲染();
    });
    屏.appendChild(区);
    return;
  }
}

// ── 单聊/群聊发送(玩家侧;她的回复走独立API,不占楼) ──

async function 发消息(会话: string, 文: string): Promise<void> {
  const 楼 = 末楼();
  const 库 = 读库();
  库.消息.push({ 楼, 会话, 发: '我', 文 });
  写库(库);
  渲染();
  if (会话 === '群') return; // 群通知不强制回声
  try {
    const rawStat = 读最近有效stat();
    if (!rawStat) return;
    const data = Schema.parse(rawStat) as SchemaType;
    const 节点 = data.户[会话 as 门牌];
    const 配 = 户静态表[会话 as 门牌];
    if (!节点 || !配) return;
    const 近况 = 库.消息
      .filter(m => m.会话 === 会话 && m.类 !== '撤回')
      .slice(-8)
      .map(m => `${m.发 === '我' ? '管理员' : 配.妻名}:${m.文}`)
      .join('\n');
    const 回 = await 小生成(
      '你在扮演一款都市题材游戏中的已婚女性,正在和公寓管理员微信聊天。只输出她的下一条回复(口语,不超过50字,可含emoji,不要引号,不要旁白)。' +
        '纪律:按状态档把握亲疏分寸;不提及任何游戏机制;她此刻在自己的生活场景里(可自然带一句在做什么)。',
      `人物:${配.妻名},${配.初始?.气质描述 ?? ''}。状态档:${档位标签(节点.妻.当前阶段, 节点.妻.好感值, 节点.妻.堕落值)};她此刻大致在:${妻位置推算(会话 as 门牌, 楼 + data.系统._时段偏移楼)}。\n最近聊天:\n${近况}\n生成她的回复。`,
    );
    if (回) {
      const 库2 = 读库();
      库2.消息.push({ 楼: 末楼(), 会话, 发: '对方', 文: 回 });
      库2.读到[会话] = 末楼();
      写库(库2);
      渲染();
    }
  } catch (e) {
    console.error('[人妻公寓·手机] 回复生成失败:', e);
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
    `本期情况:${上?.报表 || '账目平平'}。谈话基调=${段}。\n通话记录:\n${记录 || '(刚接通)'}\n儿子刚说:${玩家说}\n父亲接话。`,
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
  写库(库);
  // 回流正文一句(排队事件,下一楼注入;通话内容本体只存在于手机里)
  try {
    const rawStat = 读最近有效stat();
    if (rawStat) {
      const { raw, data } = 读取();
      const 事件 = `【来电回流】{{user}}刚跟父亲通了个微信语音(内容大意:${摘要 || '例行问账'})。正文只按"刚挂了爸的电话"的程度带过他此刻的心绪,不要复述通话内容`;
      data.系统._待发送事件 = data.系统._待发送事件 ? `${data.系统._待发送事件}|${事件}` : 事件;
      脚本写入(raw, data);
      捕获保护快照(data);
    }
  } catch (e) {
    console.error('[人妻公寓·手机] 通话回流失败:', e);
  }
  通话上下文 = null;
  通话记录 = [];
  当前页 = { 名: 'home' };
  渲染();
  刷新红点();
}
