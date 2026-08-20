import type { 门牌 } from '../../../../../stageConfig';
import { 查房间, 户静态表 } from '../../../../../stageConfig';
import { 已入住微信妻友门牌 } from '../../../微信好友规则';
import { 读取医院内容策略 } from '../../../生产系统';
import {
  多人邀约地点合法,
  手机多人邀约上限,
  邀约公共地点列表,
  邀约日期选项,
  构造目标绝对时段,
  邀约目标合法,
  type 手机多人邀约安排,
} from '../../邀约计划';
import { 头像块, el } from '../资源与皮肤';
import { 取渲染业务端口 } from './业务端口';
import { 渲染头, type 渲染上下文 } from './共享';

/**
 * 安排邀约页与列表选择页（v0.80：微信内置网页/设置页 WeUI 样式，不是聊天气泡弹层）。
 * 主页面：浅灰 `#ededed` 底、白色分组、约 52px 列表行、左标签右值灰箭头、顶部返回、
 * 角色头像/姓名、说明摘要、微信绿 `#07c160` 主按钮（未选完整禁用）、“取消”回原单聊零写入。
 * 返回链：选择页 → 安排页；安排页返回/取消 → 原妻单聊；发送后 → 原妻单聊并立即显示玩家绿色气泡。
 * 时间变化/变量未就绪时重新规范当前选择；无合法选项时失败关闭并提示，不提交陈旧目标。
 */

/** 地点显示文案：302（你家）/ 管理员室 / 妻名的房间（门牌）；公共场所保持原名。 */
function 邀约地点显示名(地点: string, m: 门牌): string {
  if (地点 === '302') return '302（你家）';
  if (地点 === '管理员室') return '管理员室';
  if (地点 === m) return `${户静态表[m]?.妻名 ?? `${m}室`}的房间（${m}）`;
  return (邀约公共地点列表 as readonly string[]).includes(地点) ? 地点 : (查房间(地点)?.名称 ?? 地点);
}

/** 安排邀约主页面；`invite-pick` 子页由 渲染invite选择 处理。 */
export function 渲染invite(上下文: 渲染上下文): void {
  const 当前页 = 上下文.读取当前页();
  if (当前页.名 === 'invite-pick') {
    渲染invite选择(上下文);
    return;
  }
  const { 屏 } = 上下文;
  const m = 当前页.会话 as 门牌;
  const 配 = 户静态表[m];
  const 钟 = 上下文.当前绝对时段;
  const 回单聊 = () => {
    上下文.写入当前页({ 名: 'chat', 会话: m });
    上下文.重绘();
  };
  // 变量未就绪（-1 哨兵）：失败关闭回原单聊并提示，零写入。
  if (!上下文.data || !配 || 钟 < 0) {
    回单聊();
    eventEmit('人妻公寓:提示', '微信数据未就绪，暂时无法安排邀约。');
    return;
  }
  // 静态配置存在但未入住：失败关闭回原单聊并提示，零写入。
  if (!上下文.data.户[m]) {
    回单聊();
    eventEmit('人妻公寓:提示', '她还没有入住公寓，暂时无法安排邀约。');
    return;
  }
  const 日期选项 = 邀约日期选项(钟);
  if (!日期选项.length) {
    // 理论上不会发生（今天至少有一个时段）；无合法选项时同样失败关闭。
    回单聊();
    eventEmit('人妻公寓:提示', '本周没有可预约的时间了。');
    return;
  }
  const 可邀约成员 = 已入住微信妻友门牌(上下文.data).filter(门牌号 =>
    读取医院内容策略(上下文.data!, 门牌号).允许手机邀约,
  );
  if (!可邀约成员.includes(m)) {
    回单聊();
    eventEmit('人妻公寓:提示', `${配.妻名}目前不能参加普通邀约。`);
    return;
  }
  const 规范成员 = (原值: readonly string[] | undefined): 门牌[] => {
    const 其余 = _.uniq(原值 ?? [])
      .filter((门牌号): 门牌号 is 门牌 => 门牌号 !== m && 可邀约成员.includes(门牌号 as 门牌))
      .slice(0, 手机多人邀约上限 - 1);
    return [m, ...其余];
  };

  // 时间变化/页面重绘时重新规范当前选择：星期已过去、时段已过去、成员失效、共同地点非法都清掉。
  let 选星期 = 当前页.邀约?.选星期;
  let 选时段 = 当前页.邀约?.选时段;
  let 选地点 = 当前页.邀约?.选地点;
  const 选成员 = 规范成员(当前页.邀约?.选成员);
  const 日选项 = 选星期 ? 日期选项.find(o => o.星期 === 选星期) : undefined;
  if (选星期 && !日选项) {
    选星期 = undefined;
    选时段 = undefined;
  }
  if (选时段 && (!日选项 || !日选项.时段选项.includes(选时段))) 选时段 = undefined;
  if (选地点 && !多人邀约地点合法(选地点, 选成员)) 选地点 = undefined;
  if (
    选星期 !== 当前页.邀约?.选星期 ||
    选时段 !== 当前页.邀约?.选时段 ||
    选地点 !== 当前页.邀约?.选地点 ||
    !_.isEqual(选成员, 当前页.邀约?.选成员)
  ) {
    上下文.写入当前页({ ...当前页, 邀约: { 选星期, 选时段, 选地点, 选成员 } });
  }
  const 目标 = 选星期 && 选时段 ? 构造目标绝对时段(选星期, 选时段, 钟) : null;
  const 完成 =
    !!选地点 &&
    目标 !== null &&
    邀约目标合法(目标, 钟) &&
    多人邀约地点合法(选地点, 选成员);
  const 地点名 = 选地点 ? 邀约地点显示名(选地点, m) : '';
  const 成员名 = 选成员.map(门牌号 => 户静态表[门牌号]?.妻名 ?? 门牌号);
  // 选择完成后显示共同名单、星期时段和地点；每个人仍独立接受或拒绝。
  const 摘要 = 完成 ? `${成员名.join('、')} / ${选星期}·${选时段} / ${地点名}` : '';

  渲染头(上下文, '安排邀约', 回单聊);
  const 体 = el('div', 'rqp-invite');
  const 用户行 = el('div', 'rqp-iuser');
  用户行.innerHTML = `${头像块(配.妻名)}<span class="txt"><b>${_.escape(
    选成员.length > 1 ? `${配.妻名}等${选成员.length}人` : 配.妻名,
  )}</b><p>${
    完成
      ? _.escape(摘要)
      : '选择一至五名角色和共同时间地点。每个人会独立回复；答应见面不等于答应亲密行为。'
  }</p></span>`;
  体.appendChild(用户行);

  const 成员组 = el('div', 'rqp-igroup');
  成员组.appendChild(el('div', 'rqp-ihead', `共同受邀（${选成员.length}/${手机多人邀约上限}）`));
  for (const 门牌号 of 可邀约成员) {
    const 已选 = 选成员.includes(门牌号);
    const 固定 = 门牌号 === m;
    const 角色行 = el('div', `rqp-irow${已选 ? ' on' : ''}`);
    角色行.innerHTML = `<span>${_.escape(户静态表[门牌号]?.妻名 ?? 门牌号)}${固定 ? '（当前会话）' : ''}</span><span class="v">${
      固定 ? '<small>必选</small>' : 已选 ? '<b class="ok">✓</b>' : ''
    }</span>`;
    if (!固定) {
      角色行.addEventListener('click', () => {
        let 下一成员: 门牌[];
        if (已选) {
          下一成员 = 选成员.filter(项 => 项 !== 门牌号);
        } else {
          if (选成员.length >= 手机多人邀约上限) {
            eventEmit('人妻公寓:提示', `一次共同邀约最多选择 ${手机多人邀约上限} 人。`);
            return;
          }
          下一成员 = [...选成员, 门牌号];
        }
        const 下一地点 = 选地点 && 多人邀约地点合法(选地点, 下一成员) ? 选地点 : undefined;
        上下文.写入当前页({
          ...上下文.读取当前页(),
          邀约: { 选星期, 选时段, 选地点: 下一地点, 选成员: 下一成员 },
        });
        上下文.重绘();
      });
    }
    成员组.appendChild(角色行);
  }
  体.appendChild(成员组);

  const 组 = el('div', 'rqp-igroup');
  const 行 = (标签: string, 值: string, 去: () => void) => {
    const r = el('div', 'rqp-irow');
    r.innerHTML = `<span>${标签}</span><span class="v">${_.escape(值)}<i class="arr">›</i></span>`;
    r.addEventListener('click', 去);
    组.appendChild(r);
  };
  行('日期', 选星期 ?? '', () => 打开选择页(上下文, '日期'));
  行('时段', 选时段 ?? '', () => 打开选择页(上下文, '时段'));
  行('地点', 地点名, () => 打开选择页(上下文, '地点'));
  体.appendChild(组);
  const 发 = el(
    'button',
    'rqp-ibtn',
    选成员.length > 1 ? `发送多人邀约（${选成员.length}人）` : '发送邀约',
  ) as HTMLButtonElement;
  发.disabled = !完成;
  if (完成) {
    发.addEventListener('click', () => {
      const 端口 = 取渲染业务端口();
      if (!端口) return;
      发.disabled = true;
      const 邀请成员 = [...选成员];
      const 共享安排: 手机多人邀约安排 = {
        创建楼: 上下文.楼,
        创建绝对时段: 钟,
        目标绝对时段: 目标!,
        地点: 选地点!,
      };
      // 批次循环归业务层所有：它会冻结聊天、楼层、时钟、锚消息与租约世代，
      // 切档、swipe、删楼或正文加楼后旧名单绝不能在新时间线继续发送。
      回单聊();
      void 端口.约多人出来(邀请成员, 共享安排);
    });
  }
  体.appendChild(发);
  const 取消 = el('button', 'rqp-ibtn-cancel', '取消') as HTMLButtonElement;
  取消.addEventListener('click', 回单聊);
  体.appendChild(取消);
  屏.appendChild(体);
}

function 打开选择页(上下文: 渲染上下文, 选择: '日期' | '时段' | '地点'): void {
  上下文.写入当前页({ ...上下文.读取当前页(), 名: 'invite-pick', 选择 });
  上下文.重绘();
}

/** 列表选择页：选中项右侧绿色 ✓，选中后返回安排页；地点按“私人地点/公共场所”分组。 */
function 渲染invite选择(上下文: 渲染上下文): void {
  const 当前页 = 上下文.读取当前页();
  const { 屏 } = 上下文;
  const m = 当前页.会话 as 门牌;
  const 配 = 户静态表[m];
  const 钟 = 上下文.当前绝对时段;
  const 栏 = 当前页.选择;
  const 选 = 当前页.邀约 ?? {};
  const 回安排 = () => {
    上下文.写入当前页({ 名: 'invite', 会话: m, 邀约: 当前页.邀约 });
    上下文.重绘();
  };
  // 选择页同样验证角色确实入住（静态配置存在但未入住时失败关闭零写入）。
  if (!栏 || !上下文.data?.户[m] || !配 || 钟 < 0) {
    回安排();
    return;
  }
  const 可邀约成员 = 已入住微信妻友门牌(上下文.data).filter(门牌号 =>
    读取医院内容策略(上下文.data!, 门牌号).允许手机邀约,
  );
  const 选成员 = [
    m,
    ..._.uniq(选.选成员 ?? []).filter(
      (门牌号): 门牌号 is 门牌 => 门牌号 !== m && 可邀约成员.includes(门牌号 as 门牌),
    ),
  ].slice(0, 手机多人邀约上限) as 门牌[];
  渲染头(上下文, 栏 === '日期' ? '选择日期' : 栏 === '时段' ? '选择时段' : '选择地点', 回安排);
  const 体 = el('div', 'rqp-ipick');
  const 组 = el('div', 'rqp-igroup');
  const 项 = (标签: string, 选中: boolean, 去: () => void) => {
    const r = el('div', `rqp-irow${选中 ? ' on' : ''}`);
    r.innerHTML = `<span>${_.escape(标签)}</span><span class="v">${选中 ? '<b class="ok">✓</b>' : ''}</span>`;
    r.addEventListener('click', 去);
    组.appendChild(r);
  };
  if (栏 === '日期') {
    for (const o of 邀约日期选项(钟)) {
      const 今天 = o.日起始绝对时段 <= 钟 && 钟 < o.日起始绝对时段 + 6;
      const 标签 = `${o.星期}${今天 ? '（今天）' : ''}`;
      项(标签, 选.选星期 === o.星期, () => {
        const 下一邀约 = { ...选, 选星期: o.星期 };
        // 换日期后旧时段可能不再可选（如换到今天且旧时段已过去），一并清掉。
        if (选.选时段 && !o.时段选项.includes(选.选时段)) delete 下一邀约.选时段;
        上下文.写入当前页({ 名: 'invite', 会话: m, 邀约: 下一邀约 });
        上下文.重绘();
      });
    }
  } else if (栏 === '时段') {
    // 未选日期时按今天给时段（选中时段同时隐式选中今天），保证任意顺序都能完成表单。
    const 日期们 = 邀约日期选项(钟);
    const 日选项 = 选.选星期 ? 日期们.find(o => o.星期 === 选.选星期) : 日期们[0];
    if (!日选项) {
      回安排();
      return;
    }
    for (const 时 of 日选项.时段选项) {
      项(时, 选.选时段 === 时, () => {
        上下文.写入当前页({ 名: 'invite', 会话: m, 邀约: { ...选, 选星期: 选.选星期 ?? 日选项.星期, 选时段: 时 } });
        上下文.重绘();
      });
    }
  } else {
    // 多人只能选择所有成员都合法的共同地点；角色私宅只在真正单人邀约时开放。
    const 私人 = [...new Set(['302', '管理员室', ...(选成员.length === 1 ? [m] : [])] as const)];
    for (const [组名, 地点们] of [
      ['私人地点', 私人 as string[]],
      ['公共场所', [...邀约公共地点列表]],
    ] as const) {
      const 头 = el('div', 'rqp-ihead', 组名);
      组.appendChild(头);
      for (const 地点 of 地点们.filter(地点 => 多人邀约地点合法(地点, 选成员))) {
        项(邀约地点显示名(地点, m), 选.选地点 === 地点, () => {
          上下文.写入当前页({ 名: 'invite', 会话: m, 邀约: { ...选, 选成员, 选地点: 地点 } });
          上下文.重绘();
        });
      }
    }
  }
  体.appendChild(组);
  屏.appendChild(体);
}
