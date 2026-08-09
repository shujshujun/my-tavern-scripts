import { el } from '../资源与皮肤';
import {
  应用数据库填表兼容设置,
  安装人妻公寓数据库模板,
  打开数据库界面,
  打开数据库设置,
  数据库状态,
} from '../../../数据库桥';
import { 读配置, 存配置, type 手机AI来源, type 手机配置 } from '../../配置';
import { 确认微信摘要SQLite可写, 重置微信摘要SQLite能力 } from '../../摘要系统';
import { 收起手机以显示数据库 } from '../红点与开合';
import { 渲染底栏, 渲染头, type 渲染上下文 } from './共享';

/** 设置页(藏"我"页签)：数据库状态/安装/打开/设置、AI 来源与回退/摘要/频率、
 *  API 字段折叠、模型列表走宿主 getModelList（不得 iframe fetch）、保存与收起手机显示数据库。 */
export function 渲染settings(上下文: 渲染上下文): void {
  const { 屏 } = 上下文;
  渲染头(上下文, '我', () => {
    上下文.写入当前页({ 名: 'chats' });
    上下文.重绘();
  });
  重置微信摘要SQLite能力();
  const c = 读配置();
  const db = 数据库状态();
  const 填表兼容颜色 =
    !db.已安装 || db.填表最短回复 === null ? '#666' : db.填表最短回复 === 0 ? '#287a50' : '#a35f00';
  const 填表兼容文案 = !db.已安装
    ? '数据库未连接'
    : db.填表最短回复 === null
      ? '当前版本未开放读取；请在数据库高级参数中手动把“AI 回复最小长度”设为 0'
      : db.填表最短回复 === 0
        ? '已兼容（AI 回复最小长度 = 0）'
        : `需调整：AI 回复最小长度 = ${db.填表最短回复}，可能把合法的简短或空更新误判为“AI回复过短”`;
  const 填表尝试文案 = !db.已安装
    ? '数据库未连接'
    : db.填表最大尝试 === null
      ? '插件未开放读取；建议在高级参数中把“填表最大重试”手动设为 2（表示总共尝试两次）'
      : `当前总尝试次数 = ${db.填表最大尝试}${db.填表最大尝试 === 2 ? '，已是建议值' : '，建议改为 2'}`;
  const 可一键修复填表 = db.填表最短回复 !== null && db.填表最短回复 > 0 && db.可设置填表参数;
  const 区 = el('div', 'rqp-set');
  区.innerHTML = `
    <label>手机内容 API<select class="i-source">
      <option value="自动"${c.ai来源 === '自动' ? ' selected' : ''}>自动（数据库优先）</option>
      <option value="数据库"${c.ai来源 === '数据库' ? ' selected' : ''}>只用数据库</option>
      <option value="正文"${c.ai来源 === '正文' ? ' selected' : ''}>只用正文 API</option>
      <option value="自定义"${c.ai来源 === '自定义' ? ' selected' : ''}>手机专用模型（自定义 API）</option>
    </select></label>
    <div class="rqp-api-section db-api-section">
      <p class="db-status" style="color:${db.已安装 ? '#287a50' : '#666'};font-size:12px;margin:2px 0 5px">数据库：${
        db.已安装
          ? `已连接${db.已装游戏模板 ? '，人妻公寓五表已安装' : '，尚未安装人妻公寓五表'}${
              db.可调用AI ? '' : '，未开放AI代理'
            }`
          : '未检测到公开 API（自动模式会使用正文 API）'
      }</p>
      <p class="sql-status" style="color:#666;font-size:11px;margin:0 0 5px">SQLite SQL：${
        !db.已安装
          ? '数据库未连接'
          : !db.有SQL接口
            ? '查询接口尚未就绪（可能未开启 SQLite，或当前版本不支持）'
            : '正在检测当前模式…'
      }</p>
      <p class="fill-threshold-status" style="color:${填表兼容颜色};font-size:11px;margin:0 0 5px">自动填表防短回复：${填表兼容文案}</p>
      <p style="color:#666;font-size:11px;margin:0 0 5px">填表最大尝试：${填表尝试文案}</p>
      <p class="wechat-memory-status" style="color:#666;font-size:11px;margin:0 0 6px">微信记忆：${
        !c.微信进展摘要
          ? '已由玩家关闭'
          : !db.已安装
            ? '不可用'
            : !db.已装游戏模板
              ? '需先安装/更新五张表'
              : !db.可写表格
                ? '表可读，但无法保存本地进展'
                : '正在检测 SQLite 写入能力…'
      }</p>
      <p style="color:#666;font-size:11px;margin:0 0 6px">数据库模式沿用数据库当前配置，不在这里读取或修改数据库密钥与模型。需要给手机单独选模型，请展开下方“手机专用模型”，填写API后读取模型列表。</p>
      <p style="color:#666;font-size:11px;margin:0 0 6px">建议开启 SQLite 模式：记忆读取仍可回退完整表格快照；剧情事件和微信摘要的脚本直写仅在 SQLite 模式运行，普通表格模式不会用可能挂到旧消息的行接口冒险写入。数据库插件自身对正文回复的自动长期记忆与承诺仍照常运行。</p>
      <p style="color:#666;font-size:11px;margin:0 0 6px">“AI 回复最小长度”是数据库全局项，且当前同时控制短正文是否跳过填表与填表模型输出长度。本游戏只检测，不会在安装或启动时自动修改；微信可见回复仍只调用一次所选 AI，微信进展由本地脚本整理，不追加模型请求。</p>
      <p style="color:#666;font-size:11px;margin:0 0 6px">仅在检测到 SQLite 可写时，开启微信记忆会把上一版结构化进展与最多24条尚未整理的私聊在本地确定性合并，再写入当前分支；普通表格模式会暂停脚本直写，原文不会写入数据库。</p>
      <label style="display:flex;align-items:center;gap:8px"><input class="i-wechat-summary" type="checkbox" style="width:auto"${
        c.微信进展摘要 ? ' checked' : ''
      }/>本地整理并保存微信进展（仅 SQLite 模式，可单独关闭）</label>
      <span style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="install-db">安装/更新本游戏表</button><button class="open-db">查看数据库表</button>${
        可一键修复填表
          ? '<button class="fix-db-fill" style="grid-column:1 / -1">修复填表短回复（数据库全局设 0）</button>'
          : ''
      }<button class="open-sql-settings" style="grid-column:1 / -1">打开数据库设置（SQLite / 填表）</button></span>
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
    <p class="credit">自动模式：检测到数据库公开API就由数据库代发；未安装数据库才使用正文API。数据库调用失败一律不二次请求，避免重复计费。游戏硬状态始终由MVU管理。<br/>手机外观:柚月小手机(yuzuki)授权砍装;挂载范式参考玉子手机(yuzi83)。经双授权改造,谨此致谢。</p>`;
  const 来源选择 = 区.querySelector('.i-source') as HTMLSelectElement;
  const 数据库区 = 区.querySelector('.db-api-section') as HTMLElement;
  const 自定义开关 = 区.querySelector('.toggle-custom') as HTMLButtonElement;
  const 自定义字段 = 区.querySelector('.custom-api-fields') as HTMLElement;
  let 自定义展开 = c.ai来源 === '自定义';
  const 刷新API分区 = () => {
    const 来源 = 来源选择.value as 手机AI来源;
    // 微信摘要始终使用数据库当前 AI，与手机回复选用正文/自定义 API 无关，因此数据库说明不能隐藏。
    数据库区.style.display = 'flex';
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
  const SQL状态 = 区.querySelector('.sql-status') as HTMLElement;
  const 微信记忆状态 = 区.querySelector('.wechat-memory-status') as HTMLElement;
  if (db.已安装 && db.有SQL接口) {
    void 确认微信摘要SQLite可写().then(已启用 => {
      SQL状态.style.color = 已启用 ? '#287a50' : '#9a6420';
      SQL状态.textContent = 已启用
        ? `SQLite SQL：查询接口已就绪${db.已装游戏模板 ? '，已安装的 RQ_ 表会优先走 SQL' : ''}`
        : 'SQLite SQL：尚未开启；建议点下方按钮，在数据库设置中切换';
      if (c.微信进展摘要 && db.已装游戏模板 && db.可写表格) {
        微信记忆状态.style.color = 已启用 ? '#287a50' : '#9a6420';
        微信记忆状态.textContent = 已启用
          ? '微信记忆：已启用（按当前聊天分支保存结构化进展版本）'
          : '微信记忆：脚本摘要已暂停（仅 SQLite 可写）；数据库插件自身的正文长期记忆/承诺仍运行';
      }
    });
  } else if (c.微信进展摘要 && db.已装游戏模板 && db.可写表格) {
    微信记忆状态.style.color = '#9a6420';
    微信记忆状态.textContent =
      '微信记忆：脚本摘要已暂停（没有 SQLite 写入接口）；数据库插件自身的正文长期记忆/承诺仍运行';
  }
  (区.querySelector('.install-db') as HTMLButtonElement).addEventListener('click', () => {
    const 宿主 = window.parent ?? window;
    if (!db.已安装) {
      宿主.alert('未检测到数据库插件。游戏仍可正常运行；安装插件后再回来点此按钮即可。');
      return;
    }
    if (
      !宿主.confirm(
        '这会把《人妻公寓》的五张游戏记忆表应用到当前聊天（默认通用表不再保留，作者自定义表保留）；不会修改数据库的全局模板。继续吗？',
      )
    )
      return;
    const 按钮 = 区.querySelector('.install-db') as HTMLButtonElement;
    按钮.disabled = true;
    按钮.textContent = '安装中…';
    void 安装人妻公寓数据库模板().then(result => {
      重置微信摘要SQLite能力();
      宿主.alert(result.message || (result.success ? '安装完成' : '安装失败'));
      上下文.重绘();
    });
  });
  (区.querySelector('.fix-db-fill') as HTMLButtonElement | null)?.addEventListener('click', () => {
    const 宿主 = window.parent ?? window;
    if (
      !宿主.confirm(
        `这会把数据库插件的全局“AI 回复最小长度”从 ${db.填表最短回复} 设为 0，影响所有角色卡和聊天。\n\n` +
          '数据库当前也用这个值决定短正文是否跳过自动填表；设为 0 后，其他角色卡的短正文可能增加填表请求。\n\n' +
          '本操作只修改这一项，不修改模型、密钥、SQLite、表格、更新频率或重试次数。确定继续吗？',
      )
    )
      return;
    const 按钮 = 区.querySelector('.fix-db-fill') as HTMLButtonElement;
    按钮.disabled = true;
    按钮.textContent = '正在设置并回读验证…';
    void 应用数据库填表兼容设置().then(result => {
      宿主.alert(result.message);
      上下文.重绘();
    });
  });
  (区.querySelector('.open-db') as HTMLButtonElement).addEventListener('click', () => {
    收起手机以显示数据库();
    void 打开数据库界面().then(ok => {
      if (!ok) (window.parent ?? window).alert('未检测到可打开的数据库界面。');
    });
  });
  (区.querySelector('.open-sql-settings') as HTMLButtonElement).addEventListener('click', () => {
    收起手机以显示数据库();
    重置微信摘要SQLite能力();
    void 打开数据库设置().then(ok => {
      if (!ok) {
        (window.parent ?? window).alert(
          '当前数据库版本没有开放设置入口。请直接打开数据库插件；SQLite 在存储模式中开启，填表参数位于“填表工作台 → 自动更新设置 → 高级参数”。',
        );
      }
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
      微信进展摘要: (区.querySelector('.i-wechat-summary') as HTMLInputElement).checked,
      base: (区.querySelector('.i-base') as HTMLInputElement).value.trim(),
      key: (区.querySelector('.i-key') as HTMLInputElement).value.trim(),
      model: (区.querySelector('.i-model') as HTMLInputElement).value.trim(),
      频率: (区.querySelector('.i-freq') as HTMLSelectElement).value as 手机配置['频率'],
    });
    上下文.写入当前页({ 名: 'chats' });
    上下文.重绘();
  });
  屏.appendChild(区);
  渲染底栏(上下文, 'settings');
}
