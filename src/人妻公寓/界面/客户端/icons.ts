// ── 梧桐里主题图标库：统一 24×24 圆角描边，公寓门牌/钥匙孔/信件等语义贯穿全套 ──
// 本模块只承载图标数据与合成函数，不依赖 Vue、DOM 或 App.vue，不产生副作用。

const 图标库: Record<string, string> = {
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  bag: '<path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  cctv: '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>',
  map: '<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
  expand:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path class="ic-gem" d="M8.5 10.5h7M8.5 14h5"/>',
  door: '<rect x="5" y="2" width="14" height="20" rx="1"/><circle cx="15" cy="12" r="1"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  lock: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
  arrow: '<circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/>',
  trash:
    '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="m8.5 7.5 3.5 4 3.5-4M12 11.5V17M9.5 13.5h5M9.5 15.5h5"/>',
  ops: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle class="ic-gem" cx="16" cy="7" r="2"/><circle class="ic-gem" cx="8" cy="17" r="2"/>',
  tool: '<path d="m14.7 6.3 3-3a4.2 4.2 0 0 1-5.2 5.2L5 16l3 3 7.5-7.5a4.2 4.2 0 0 1 5.2-5.2l-3 3"/><path d="m4 17 3 3"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M2 9h20V5H2Z"/><path d="M12 5c-1.6 0-5-.2-5-2.1C7 1.6 8.2 1 9.2 1 11 1 12 5 12 5Zm0 0c1.6 0 5-.2 5-2.1C17 1.6 15.8 1 14.8 1 13 1 12 5 12 5Z"/>',
  letter:
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/><path class="ic-gem" d="m15.5 15.5 2 2 3.5-4"/>',
  search:
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path class="ic-gem" d="M8 10h5M10.5 7.5v5"/>',
  rewind: '<path d="m11 7-5 5 5 5"/><path d="M6 12h7a6 6 0 0 1 6 6v1"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle class="ic-gem" cx="8" cy="8" r="1"/><circle class="ic-gem" cx="16" cy="8" r="1"/><circle class="ic-gem" cx="12" cy="12" r="1"/><circle class="ic-gem" cx="8" cy="16" r="1"/><circle class="ic-gem" cx="16" cy="16" r="1"/>',
  dress: '<path d="M9 3h6l1 5-2 2 5 11H5l5-11-2-2 1-5Z"/><path class="ic-gem" d="M9 3c.5 2 5.5 2 6 0"/>',
  drug: '<path d="M8.5 4.5a4.2 4.2 0 0 1 6 0l5 5a4.2 4.2 0 0 1-6 6l-5-5a4.2 4.2 0 0 1 0-6Z"/><path d="m10 12 6-6"/><path class="ic-gem" d="M6 17h5M8.5 14.5v5"/>',
  favor:
    '<path d="M20.8 5.7c-1.8-2.1-5.1-1.8-6.8.4L12 8.5l-2-2.4C8.3 3.9 5 3.6 3.2 5.7 1.5 7.7 1.8 10.6 3.8 12.4L12 20l8.2-7.6c2-1.8 2.3-4.7.6-6.7Z"/><path class="ic-gem" d="M8 12h2l1-2 2 5 1-3h2"/>',
  kink: '<path d="M12 21a9 9 0 1 1 9-9c0 4-3 6-6 6-2.8 0-5-1.7-5-4 0-2 1.5-3.5 3.5-3.5 1.6 0 2.8 1 2.8 2.5 0 1.1-.8 2-1.8 2"/><circle class="ic-gem" cx="12" cy="4.5" r="1"/>',
  peep: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><path d="M12 9a3 3 0 1 1-1.2 5.8"/><path class="ic-gem" d="m12 12 5-5"/>',
  scene:
    '<path d="M3 8h18v12H3Z"/><path d="M3 8 5 3h16l-2 5M8 3 6 8M14 3l-2 5M20 3l-2 5"/><path class="ic-gem" d="m10 12 5 2.5-5 2.5Z"/>',
};

/** 每枚图标的暖白珐琅底：统一先铺底再叠 icon 笔画。 */
const 珐琅底plate = '<path class="ic-plate" d="M5 2.8h11.8L21.2 7v12A2.2 2.2 0 0 1 19 21.2H5A2.2 2.2 0 0 1 2.8 19V5A2.2 2.2 0 0 1 5 2.8Z"/>';

/** 按图标键合成 `<svg>` 内部内容（plate + 图标）；未知键回退 home（与旧内联实现一致）。 */
export function 合成图标SVG(n: string): string {
  return `${珐琅底plate}${图标库[n] ?? 图标库.home}`;
}
