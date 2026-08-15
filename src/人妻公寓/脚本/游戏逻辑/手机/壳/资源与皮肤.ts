import { 户静态表, 门牌列表 } from '../../../../stageConfig';

/**
 * 手机壳资源与皮肤（拆分方案 P7）：ROOT_ID/素材基址/成人素材基址/私聊图片地址/
 * 手机图标路径与图标/完整手机CSS 模板串/头像块/群消息头像名 的唯一所有者，以及
 * 壳与渲染共用的纯 DOM 小工具（根文档/el）。
 * 内核与后续渲染页面只从本模块 import；本模块只依赖 stageConfig 等叶子，
 * 不 import 内核/门面/会话瞬态/挂载/红点开合或渲染入口。
 */

export const ROOT_ID = 'rq-phone-root';
// ⚠ 与 App.vue 素材基址同步：Discord 测试版发布 tag=rq0.55。
export const 素材基址 = 'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.55/dist/人妻公寓/素材';
export const 成人素材基址 = 'https://testingcf.jsdelivr.net/gh/shujun8520-design/qgy-assets@cg2/cg1';
export const 生产素材基址 =
  'https://testingcf.jsdelivr.net/gh/shujshujun/my-tavern-scripts@rq0.83/output/imagegen/production-system/final';

export function 私聊图片地址(图: string): string {
  if (图.startsWith('@production/')) {
    return `${生产素材基址}/${图
      .slice('@production/'.length)
      .split('/')
      .map(段 => encodeURIComponent(段))
      .join('/')}.webp`;
  }
  if (图.startsWith('@adult/')) {
    return `${成人素材基址}/${图
      .slice('@adult/'.length)
      .split('/')
      .map(段 => encodeURIComponent(段))
      .join('/')}`;
  }
  return `${素材基址}/微信圈/${图
    .split('/')
    .map(段 => encodeURIComponent(段))
    .join('/')}.webp`;
}

/** 手机挂在酒馆父页面，所有 DOM 一律在父文档上创建。 */
export function 根文档(): Document {
  return (window.parent ?? window).document;
}

export function el(tag: string, cls: string, html?: string): HTMLElement {
  const e = 根文档().createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

export const 手机图标路径: Record<string, string> = {
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

export function 手机图标(name: string): string {
  return `<svg class="rqp-svg" viewBox="0 0 24 24" aria-hidden="true">${手机图标路径[name] ?? 手机图标路径.phone}</svg>`;
}

export const 手机CSS = `
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
#${ROOT_ID}.mute-meeting-phone .rqp-toggle{background:linear-gradient(145deg,#10b768,#087a48);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 0 0 0 rgba(7,193,96,.35),0 6px 18px rgba(0,0,0,.32);animation:rqp-meeting-breathe 1.8s ease-in-out infinite;}
#${ROOT_ID}.mute-meeting-phone.ringing .rqp-toggle{animation:rqp-ring .6s ease-in-out infinite;}
@keyframes rqp-meeting-breathe{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 0 0 0 rgba(7,193,96,.28),0 6px 18px rgba(0,0,0,.32)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 0 0 10px rgba(7,193,96,0),0 8px 22px rgba(0,0,0,.38)}}
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
#${ROOT_ID} .rqp-tabs button:disabled{color:#b8b8b8;cursor:not-allowed;filter:grayscale(1);}
#${ROOT_ID} .rqp-tabs button .dot{position:absolute;top:4px;right:26%;width:9px;height:9px;border-radius:50%;background:#fa5151;}
/* 朋友圈封面(壁纸作封面图,微信 moments 语法) */
#${ROOT_ID} .rqm-cover{height:132px;background:url('${素材基址}/界面/手机壁纸.webp') center/cover no-repeat,linear-gradient(160deg,#8fb8de,#c3a6d8);position:relative;margin-bottom:26px;}
#${ROOT_ID} .rqm-cover b{position:absolute;right:74px;bottom:-10px;color:#fff;font-size:15px;text-shadow:0 1px 4px rgba(0,0,0,.5);}
#${ROOT_ID} .rqm-cover .rqp-ava{position:absolute;right:12px;bottom:-22px;width:52px;height:52px;border-radius:8px;border:1.5px solid #fff;}
#${ROOT_ID} .rqp-head{flex:none;background:#ededed;padding:12px 14px 9px;display:flex;align-items:center;gap:8px;border-bottom:.5px solid #d9d9d9;}
#${ROOT_ID} .rqp-head b{font-size:16px;font-weight:600;color:#111;flex:1;text-align:center;}
#${ROOT_ID} .rqp-head b.rqp-chat-title{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;}
#${ROOT_ID} .rqp-chat-title .rqp-chat-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
#${ROOT_ID} .rqp-chat-state{display:inline-flex;align-items:center;gap:3px;flex:none;font-size:9.5px;font-weight:500;color:#777;}
#${ROOT_ID} .rqp-chat-state i{display:block;width:7px;height:7px;border-radius:50%;background:#17b86a;box-shadow:0 0 0 2px rgba(23,184,106,.13);}
#${ROOT_ID} .rqp-chat-state.yellow i{background:#e7a313;box-shadow:0 0 0 2px rgba(231,163,19,.16);}
#${ROOT_ID} .rqp-chat-state.red i{background:#eb4d4d;box-shadow:0 0 0 2px rgba(235,77,77,.15);animation:rqp-chat-red 1s ease-in-out infinite;}
@keyframes rqp-chat-red{0%,100%{opacity:.55}50%{opacity:1}}
#${ROOT_ID} .rqp-back{border:none;background:none;font-size:18px;cursor:pointer;color:#111;width:24px;font-weight:300;}
#${ROOT_ID} .rqp-gear{border:none;background:none;font-size:17px;cursor:pointer;color:#555;width:24px;display:grid;place-items:center;}
#${ROOT_ID} .rqp-body{flex:1;overflow-y:auto;overscroll-behavior:contain;}
#${ROOT_ID} .rqp-body.chatlist{background:#fff;}
#${ROOT_ID} .rqp-row{display:flex;gap:11px;padding:10px 14px;background:#fff;cursor:pointer;align-items:center;position:relative;}
#${ROOT_ID} .rqp-row::after{content:'';position:absolute;left:71px;right:0;bottom:0;height:.5px;background:#e5e5e5;}
#${ROOT_ID} .rqp-row:active{background:#ececec;}
#${ROOT_ID} .rqp-row.meeting-participant{background:linear-gradient(90deg,rgba(7,193,96,.09),#fff 42%);}
#${ROOT_ID} .rqp-row.meeting-participant .rqp-ava{box-shadow:0 0 0 2px rgba(7,193,96,.32),inset 0 0 0 1px rgba(255,255,255,.72);}
#${ROOT_ID} .rqp-row.meeting-frozen{cursor:not-allowed;filter:grayscale(1);opacity:.46;}
#${ROOT_ID} .rqp-row.meeting-frozen:active{background:#fff;}
#${ROOT_ID} .rqp-meeting-note{flex:none;margin:9px 11px 3px;padding:8px 10px;border-radius:7px;background:rgba(7,193,96,.09);border:1px solid rgba(7,193,96,.22);color:#416052;font-size:11px;line-height:1.55;}
#${ROOT_ID} .rqp-meeting-lock{margin:auto 18px;padding:18px 15px;border-radius:12px;background:#fff;color:#555;text-align:center;font-size:13px;line-height:1.65;box-shadow:0 2px 12px rgba(0,0,0,.06);}
#${ROOT_ID} .rqp-meeting-lock b{display:block;color:#222;font-size:15px;margin-bottom:7px;}
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
#${ROOT_ID} .rqp-more{align-self:center;border:none;background:transparent;color:#576b95;padding:5px 12px;font-size:12px;line-height:1.4;cursor:pointer;font-family:inherit;}
#${ROOT_ID} .rqp-more:hover,#${ROOT_ID} .rqp-more:focus-visible{color:#32476f;text-decoration:underline;text-underline-offset:3px;}
#${ROOT_ID} .rqp-line{display:flex;gap:9px;align-items:flex-start;}
#${ROOT_ID} .rqp-line.me{flex-direction:row-reverse;}
#${ROOT_ID} .rqp-line .rqp-ava{width:38px;height:38px;border-radius:4px;font-size:15px;}
#${ROOT_ID} .rqp-b{position:relative;max-width:72%;padding:8px 11px;border-radius:5px;font-size:13.5px;line-height:1.5;color:#111;word-break:break-word;}
#${ROOT_ID} .rqp-b.me{background:#95ec69;}
#${ROOT_ID} .rqp-b.actionable{cursor:context-menu;touch-action:pan-y;user-select:none;-webkit-user-select:none;}
#${ROOT_ID} .rqp-b.me::after{content:'';position:absolute;top:13px;right:-5px;border-style:solid;border-width:5px 0 5px 6px;border-color:transparent transparent transparent #95ec69;}
#${ROOT_ID} .rqp-b.ta{background:#fff;}
#${ROOT_ID} .rqp-b.ta::before{content:'';position:absolute;top:13px;left:-5px;border-style:solid;border-width:5px 6px 5px 0;border-color:transparent #fff transparent transparent;}
#${ROOT_ID} .rqp-b.sys{align-self:center;background:none;color:#a8a8a8;font-size:11px;max-width:90%;}
#${ROOT_ID} .rqp-msg-menu-layer{position:absolute;inset:0;z-index:90;}
#${ROOT_ID} .rqp-msg-menu{position:absolute;width:68px;padding:4px;background:#303136;border-radius:6px;box-shadow:0 5px 16px rgba(0,0,0,.28);}
#${ROOT_ID} .rqp-msg-menu button{width:100%;border:none;background:transparent;color:#fff;padding:7px 5px;font-size:13px;line-height:1;cursor:pointer;font-family:inherit;}
#${ROOT_ID} .rqp-msg-menu button:hover{background:rgba(255,255,255,.1);}
#${ROOT_ID} .rqp-msg-quote{margin:-2px -3px 6px;padding:4px 7px;border-left:3px solid rgba(62,91,64,.45);border-radius:3px;background:rgba(0,0,0,.065);color:#667064;font-size:11px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px;}
#${ROOT_ID} .rqp-b.ta .rqp-msg-quote{border-left-color:#b6b6b6;color:#858585;background:#f2f2f2;}
#${ROOT_ID} .rqp-msg-quote.withdrawn{color:#999;font-style:italic;}
#${ROOT_ID} .rqp-msg-text{white-space:pre-wrap;}
#${ROOT_ID} .rqp-chat-photo{display:block;width:min(176px,100%);max-height:230px;object-fit:cover;border-radius:4px;margin-top:7px;background:#eee;}
#${ROOT_ID} .rqp-typing{display:flex;gap:4px;align-items:center;min-height:20px;}
#${ROOT_ID} .rqp-typing i{width:6px;height:6px;border-radius:50%;background:#b0b0b0;animation:rqp-tp 1.2s infinite;}
#${ROOT_ID} .rqp-typing i:nth-child(2){animation-delay:.2s;}
#${ROOT_ID} .rqp-typing i:nth-child(3){animation-delay:.4s;}
@keyframes rqp-tp{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
#${ROOT_ID} .rqp-input-wrap{flex:none;background:#f7f7f7;border-top:.5px solid #d9d9d9;}
#${ROOT_ID} .rqp-input{display:flex;gap:8px;padding:8px 10px;align-items:flex-end;}
#${ROOT_ID} .rqp-quote-draft{display:flex;align-items:center;gap:8px;padding:6px 10px 0;color:#777;font-size:11px;line-height:1.35;}
#${ROOT_ID} .rqp-quote-draft span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-left:3px solid #a9a9a9;padding-left:7px;}
#${ROOT_ID} .rqp-quote-draft b{font-weight:500;color:#576b95;margin-right:5px;}
#${ROOT_ID} .rqp-quote-draft button{border:none;background:transparent;color:#888;font-size:18px;line-height:1;cursor:pointer;padding:0 3px;}
#${ROOT_ID} .rqp-input textarea{flex:1;resize:none;border:none;border-radius:4px;padding:8px 9px;font-size:13.5px;height:38px;font-family:inherit;background:#fff;color:#111!important;-webkit-text-fill-color:#111!important;caret-color:#111;opacity:1;}
#${ROOT_ID} .rqp-input textarea::placeholder{color:#8a8a8a!important;-webkit-text-fill-color:#8a8a8a!important;opacity:1;}
#${ROOT_ID} .rqp-input button{border:none;border-radius:4px;background:#07c160;color:#fff;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:500;}
#${ROOT_ID} .rqp-input button.waiting{background:#d99a19;}
#${ROOT_ID} .rqp-input button.stop{background:#e64b4b;min-width:56px;}
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
/* ── 安排邀约(微信内置网页/设置页 WeUI 样式,v0.80;全部限定 ROOT_ID 作用域,
      窄手机画幅可滚动、触控行 ≥44px、文字不溢出) ── */
#${ROOT_ID} .rqp-invite{flex:1;display:flex;flex-direction:column;min-height:0;overflow-y:auto;background:#ededed;}
#${ROOT_ID} .rqp-invite .rqp-iuser{display:flex;align-items:center;gap:10px;padding:13px 16px;background:#fff;border-bottom:.5px solid #dcdcdc;flex:none;}
#${ROOT_ID} .rqp-invite .rqp-iuser .rqp-ava{width:44px;height:44px;border-radius:6px;overflow:hidden;flex:none;display:grid;place-items:center;background:#e5e5e5;color:#888;font-size:15px;}
#${ROOT_ID} .rqp-invite .rqp-iuser .rqp-ava img{width:100%;height:100%;object-fit:cover;display:block;}
#${ROOT_ID} .rqp-invite .rqp-iuser .txt{flex:1;min-width:0;display:flex;flex-direction:column;}
#${ROOT_ID} .rqp-invite .rqp-iuser b{font-size:16px;font-weight:600;color:#111;}
#${ROOT_ID} .rqp-invite .rqp-iuser p{font-size:12px;color:#999;margin-top:3px;line-height:1.5;word-break:break-word;}
#${ROOT_ID} .rqp-igroup{background:#fff;margin:10px 12px 0;border-radius:8px;overflow:hidden;flex:none;}
#${ROOT_ID} .rqp-igroup .rqp-irow{display:flex;align-items:center;justify-content:space-between;min-height:52px;padding:0 14px;border-bottom:.5px solid #ebebeb;cursor:pointer;}
#${ROOT_ID} .rqp-igroup .rqp-irow:last-child{border-bottom:none;}
#${ROOT_ID} .rqp-irow>span{font-size:15px;color:#111;flex:none;}
#${ROOT_ID} .rqp-irow .v{display:flex;align-items:center;justify-content:flex-end;gap:5px;min-width:0;margin-left:12px;font-size:14px;color:#999;}
#${ROOT_ID} .rqp-irow .v .arr{color:#c8c8c8;font-size:17px;line-height:1;flex:none;}
#${ROOT_ID} .rqp-irow .ok{color:#07c160;font-weight:700;font-size:15px;flex:none;line-height:1;}
#${ROOT_ID} .rqp-irow.on .v{color:#07c160;}
#${ROOT_ID} .rqp-igroup .rqp-ihead{padding:10px 14px 6px;font-size:12px;color:#888;}
#${ROOT_ID} .rqp-ibtn{flex:none;margin:14px 12px 0;background:#07c160;color:#fff!important;-webkit-text-fill-color:#fff!important;border:none;border-radius:6px;height:48px;font-size:16px;font-weight:600;cursor:pointer;}
#${ROOT_ID} .rqp-ibtn:disabled{background:#9ee0b7;cursor:not-allowed;}
#${ROOT_ID} .rqp-ibtn-cancel{flex:none;margin:10px 12px 16px;background:#fff;color:#111;border:none;border-radius:6px;height:46px;font-size:16px;cursor:pointer;}
#${ROOT_ID} .rqp-ipick{flex:1;display:flex;flex-direction:column;min-height:0;overflow-y:auto;background:#ededed;}
`;

export function 头像块(名: string): string {
  const 丈夫名 = new Set(门牌列表.map(m => 户静态表[m].夫名).filter(Boolean));
  const 文件 = 名 === '父亲' || 丈夫名.has(名) ? '影子' : 名 === '姐妹群' ? '姐妹群' : 名; // 五夫+父亲=柯南影子头像(设计拍板共用)
  const 语义框 =
    文件 === '主角'
      ? ' avatar-main'
      : 文件 === '影子'
        ? ' avatar-shadow'
        : 文件 === '群' || 文件 === '姐妹群'
          ? ' avatar-group'
          : '';
  return `<span class="rqp-ava${语义框}"><img src="${素材基址}/头像/${文件}.webp" onerror="this.remove();this.parentElement.textContent='${名[0] ?? '?'}'"/></span>`;
}

/** 群消息正文以「发言人:内容」保存；气泡头像必须跟发言人走，不能永远显示群头像。 */
export function 群消息头像名(会话: string, 文: string, 默认名: string): string {
  if (会话 !== '群' && 会话 !== '姐妹群') return 默认名;
  const 发言人 = 文.match(/^([^:：]{1,12})[:：]/u)?.[1]?.trim();
  if (!发言人) return 默认名;
  const 合法名 = new Set<string>();
  for (const m of 门牌列表) {
    合法名.add(户静态表[m].妻名);
    if (户静态表[m].夫名) 合法名.add(户静态表[m].夫名);
  }
  return 合法名.has(发言人) ? 发言人 : 默认名;
}
