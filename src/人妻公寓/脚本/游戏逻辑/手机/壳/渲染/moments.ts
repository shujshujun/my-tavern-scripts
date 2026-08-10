import type { 门牌 } from '../../../../../stageConfig';
import { 查考古, 户静态表, 门牌列表 } from '../../../../../stageConfig';
import { seededRandom } from '../../../楼层时钟';
import { 列出阶段线路候选详情 } from '../../../阶段线路系统';
import { 手机记录时间字 } from '../../../手机时间显示';
import { 朋友圈有未读, 写实时手机已读 } from '../../数据层';
import { 请求刷新手机红点 } from '../../UI刷新';
import { 头像块, el, 手机图标, 素材基址 } from '../资源与皮肤';
import { 渲染底栏, 渲染头, type 渲染上下文 } from './共享';

/** 朋友圈/考古层：公开/仅你可见/历史混排、已读、滚动恢复、题目展开与回答、加载更早、图片/评论/门牌规则。 */
export function 渲染moments(上下文: 渲染上下文): void {
  const { 屏, root, data, 库, 楼, 当前绝对时段, 在当前时间线 } = 上下文;
  渲染头(上下文, '朋友圈', () => {
    上下文.写入当前页({ 名: 'chats' });
    上下文.重绘();
  });
  const 体 = el('div', 'rqp-body rqw-feed');
  const 我名 = (SillyTavern as unknown as { name1?: string })?.name1 || '我';
  体.appendChild(el('div', 'rqm-cover', `<b>${_.escape(我名)}</b>${头像块('主角')}`));
  const 圈们 = 库.圈.filter(c => 在当前时间线(c));
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
        `<div class="rqw-foot"><span class="rqw-time">${手机记录时间字(c.时)}</span><span class="rqw-dots">••</span></div>` +
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
    const 开题 = 上下文.当前页.题 === 键;
    // 历史动态可以在该户正式入住前作为长期伏笔出现，但裂缝调查必须等角色入列。
    // rq0.50 曾只判断“条目是否关键”，导致开局即可点开 301 的“哪里不对劲？”
    // （后台虽会拒绝发碎片，UI 仍然提前泄题）。母亲还需服从系统级入列门。
    const 可调查关键 = Boolean(条.关键 && data?.户[m]) && (m !== '302' || Boolean(data?.系统._母亲入列));
    const 线路候选 = data
      ? 列出阶段线路候选详情(data, {
          类型: '调查',
          门牌: m,
          标识: `旧动态复盘:${序}`,
        })[0]
      : undefined;
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
        上下文.写入当前页({ ...上下文.读取当前页(), 题: 开题 ? undefined : 键, 滚动: 体.scrollTop });
        上下文.重绘();
      });
      if (开题) {
        const 题区 = el('div', 'rqw-quiz', `<p>哪里不对劲?</p>`);
        条.关键.选项.forEach((文, i) => {
          const b = el('button', '', _.escape(文));
          b.addEventListener('click', () => {
            上下文.写入当前页({ ...上下文.读取当前页(), 题: undefined, 滚动: 体.scrollTop });
            eventEmit('人妻公寓:考古选细节', { 门牌: m, 序, 选项: i });
            上下文.重绘();
          });
          题区.appendChild(b);
        });
        (卡.querySelector('.rqw-r') as HTMLElement).appendChild(题区);
      }
    }
    if (条.关键 && 线路候选) {
      const 复盘 = el('button', 'rqw-more', '沿着这条旧动态复盘');
      复盘.addEventListener('click', ev => {
        ev.stopPropagation();
        eventEmit('人妻公寓:查看旧动态', {
          门牌: m,
          序,
          预期目标阶段: 线路候选.目标阶段,
          预期节点: 线路候选.节点,
        });
      });
      (卡.querySelector('.rqw-r') as HTMLElement).appendChild(复盘);
    }
    体.appendChild(卡);
  }
  const 更 = el('button', 'rqw-more', '翻到底了');
  更.addEventListener('click', () => eventEmit('人妻公寓:考古到底'));
  体.appendChild(更);
  屏.appendChild(体);
  体.scrollTop = Math.max(0, 上下文.当前页.滚动 ?? 0);
  // v0.80 已读所有权回渲染层：只有手机仍开着、当前页仍是朋友圈且确有未读时，
  // 才异步确认已读并只刷新红点（不重绘，避免 渲染→已读写→重绘 无限循环）。
  if (朋友圈有未读(库, 楼, 当前绝对时段)) {
    const 前台仍有效 = () => root.classList.contains('open') && 上下文.读取当前页().名 === 'moments';
    // v0.80 失败收口：变量层异常只记录不重绘，也不得把失败当成功刷新红点。
    void 写实时手机已读({ 朋友圈: true }, 前台仍有效)
      .then(已写 => {
        if (已写) 请求刷新手机红点();
      })
      .catch(错误 => {
        console.warn('朋友圈实时已读确认失败', 错误);
      });
  }
  渲染底栏(上下文, 'moments');
}
