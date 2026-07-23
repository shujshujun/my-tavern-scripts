import 数据库模板文本 from '../../人妻公寓数据库模板.json?raw';

type 数据库消息 = { role: 'system' | 'user' | 'assistant'; content: string };

interface 数据库API {
  callAI?: (messages: 数据库消息[], options?: { presetName?: string; max_tokens?: number }) => Promise<string | null>;
  importTemplateFromData?: (
    templateData: object | string,
    options?: { scope?: 'global' | 'chat'; presetName?: string },
  ) => Promise<{ success: boolean; message: string }>;
  exportTableAsJson?: () => unknown;
  insertRow?: (tableName: string, data: Record<string, unknown>) => Promise<number>;
  updateRow?: (tableName: string, rowIndex: number, data: Record<string, unknown>) => Promise<boolean>;
  openSettings?: () => Promise<boolean>;
  openVisualizer?: () => void;
  getTableTemplate?: () => unknown;
}

interface 数据表 {
  name?: string;
  content?: unknown[][];
  sourceData?: { ddl?: string };
}

const 数据库旗 = '__ACU_STAR_DB_III_LOADED__';
const 游戏表名 = ['RQ_剧情事件', 'RQ_人物长期记忆', 'RQ_承诺与伏笔', 'RQ_社交轨迹'] as const;
const 游戏表头: Record<(typeof 游戏表名)[number], readonly string[]> = {
  RQ_剧情事件: ['row_id', '楼层', '时间', '地点', '参与者', '玩家行动', '结果摘要', '事件编码'],
  RQ_人物长期记忆: ['row_id', '人物', '主题', '记忆', '未来影响', '最后楼层', '可信度'],
  RQ_承诺与伏笔: ['row_id', '事项', '相关人物', '内容', '状态', '最后进展', '最后楼层'],
  RQ_社交轨迹: ['row_id', '类型', '人物', '事件', '结果', '最后楼层', '事件键'],
};

function 解析数据库数据(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

async function 限时等待<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}超时(${Math.round(ms / 1000)}秒)`)), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function 宿主窗口(): Window & Record<string, unknown> {
  try {
    return (window.top ?? window.parent ?? window) as Window & Record<string, unknown>;
  } catch {
    return (window.parent ?? window) as Window & Record<string, unknown>;
  }
}

/**
 * 智脑 v5 没有公开数据 API；这里仅用其稳定的挂载节点检测是否启用。
 * 不读取智脑私有存储，也不与其抢记忆注入。
 */
export function 智脑状态(): { 已安装: boolean } {
  const 候选: Window[] = [];
  const 加入 = (scope: Window | null | undefined) => {
    if (scope && !候选.includes(scope)) 候选.push(scope);
  };
  try {
    加入(window);
    加入(window.parent);
    加入(window.top);
    加入(window.opener);
  } catch {
    /* 跨域窗口忽略 */
  }
  const 已安装 = 候选.some(scope => {
    try {
      return !!scope.document?.querySelector('.zhino-root, .zhino-fab, #zhino-panel');
    } catch {
      return false;
    }
  });
  return { 已安装 };
}


export function 取数据库API(): 数据库API | null {
  type 数据库宿主 = Window & { AutoCardUpdaterAPI?: 数据库API; autoCardUpdaterAPI?: 数据库API };
  const 候选: 数据库宿主[] = [];
  const 加入 = (scope: Window | null | undefined) => {
    if (scope && !候选.includes(scope as 数据库宿主)) 候选.push(scope as 数据库宿主);
  };
  try {
    加入(window);
  } catch {
    /* ignore */
  }
  try {
    加入(window.parent);
  } catch {
    /* ignore */
  }
  try {
    加入(window.top);
  } catch {
    /* ignore */
  }
  try {
    加入(window.opener);
  } catch {
    /* ignore */
  }
  for (const scope of 候选) {
    try {
      const api = scope.AutoCardUpdaterAPI ?? scope.autoCardUpdaterAPI;
      if (api && typeof api === 'object') return api;
    } catch {
      /* 跨域候选不可读时继续检查下一个。 */
    }
  }
  return null;
}

export function 数据库状态(): { 已安装: boolean; 可调用AI: boolean; 已装游戏模板: boolean } {
  const api = 取数据库API();
  let 已装游戏模板 = false;
  try {
    const 模板 = 解析数据库数据(api?.getTableTemplate?.());
    已装游戏模板 = 游戏表名.every(name => 表结构可用(取表(模板, name), 游戏表头[name]));
    // 一些旧版没有 getTableTemplate，但会通过导出接口返回当前聊天的完整表结构。
    if (!已装游戏模板 && typeof api?.exportTableAsJson === 'function') {
      const 数据 = 解析数据库数据(api.exportTableAsJson());
      已装游戏模板 = 游戏表名.every(name => 表结构可用(取表(数据, name), 游戏表头[name]));
    }
  } catch {
    /* 旧版没有模板查询接口时只显示未知/未装，不影响其他能力。 */
  }
  return { 已安装: !!api, 可调用AI: typeof api?.callAI === 'function', 已装游戏模板 };
}

export async function 清理数据库陈旧互斥旗(): Promise<void> {
  const 宿主 = 宿主窗口();
  if (取数据库API() || !宿主[数据库旗]) return;
  await new Promise(resolve => setTimeout(resolve, 1200));
  if (取数据库API() || !宿主[数据库旗]) return;
  try {
    delete 宿主[数据库旗];
    console.info('[人妻公寓·数据库] 清理了无活动API对应的陈旧互斥旗；未触碰活动中的数据库实例。');
  } catch {
    /* 无权限时保持原状。 */
  }
}

export async function 通过数据库生成(
  messages: 数据库消息[],
  presetName: string,
  maxTokens = 600,
): Promise<string | null> {
  const api = 取数据库API();
  if (typeof api?.callAI !== 'function') return null;
  const options: { presetName?: string; max_tokens: number } = { max_tokens: maxTokens };
  if (presetName.trim()) options.presetName = presetName.trim();
  return 限时等待(api.callAI(messages, options), 90000, '数据库AI调用');
}

export async function 安装人妻公寓数据库模板(): Promise<{ success: boolean; message: string }> {
  const api = 取数据库API();
  if (typeof api?.importTemplateFromData !== 'function') {
    return { success: false, message: '未检测到支持聊天级模板导入的数据库插件。' };
  }
  try {
    const 游戏模板 = JSON.parse(数据库模板文本) as Record<string, unknown>;
    const 当前 = 解析数据库数据(api.getTableTemplate?.());
    const 当前数据 = 解析数据库数据(api.exportTableAsJson?.());
    const 当前模板 =
      当前 && typeof 当前 === 'object' && (当前 as { mate?: { type?: string } }).mate?.type === 'chatSheets'
        ? (_.cloneDeep(当前) as Record<string, unknown>)
        : 当前数据 &&
            typeof 当前数据 === 'object' &&
            (当前数据 as { mate?: { type?: string } }).mate?.type === 'chatSheets'
          ? (_.cloneDeep(当前数据) as Record<string, unknown>)
          : { mate: 游戏模板.mate };
    // getTableTemplate 负责结构，exportTableAsJson 才是当前合并后的实值；导入前把所有同表头数据灌回模板，
    // 否则给现有数据库加 RQ_ 表时，可能把其他作者表格的游玩进度退回模板初始值。
    for (const value of Object.values(当前模板)) {
      const sheet = value as 数据表 | null;
      const 实值表 = sheet?.name ? 取表(当前数据, sheet.name) : undefined;
      if (实值表?.content?.length && sheet?.content?.length && _.isEqual(实值表.content[0], sheet.content[0])) {
        sheet.content = _.cloneDeep(实值表.content);
      }
    }
    // 只替换同名 RQ_ 表，保留玩家当前模板中的其他表；因此能与不同作者的数据库模板共生。
    // 同名表的表头未变化时保留已有数据行，避免玩家点“更新”后丢失长期记忆。
    const 旧游戏表 = new Map<string, 数据表>();
    for (const [key, value] of Object.entries(当前模板)) {
      const sheet = value as 数据表 | null;
      if (key.startsWith('sheet_') && 游戏表名.includes(sheet?.name as (typeof 游戏表名)[number])) {
        if (sheet?.name) 旧游戏表.set(sheet.name, _.cloneDeep(sheet));
        delete 当前模板[key];
      }
    }
    for (const [key, value] of Object.entries(游戏模板)) {
      if (!key.startsWith('sheet_')) continue;
      let targetKey = key;
      let suffix = 2;
      while (当前模板[targetKey]) targetKey = `${key}_${suffix++}`;
      const sheet = _.cloneDeep(value) as 数据表 & { uid?: string };
      sheet.uid = targetKey;
      const 旧表 = sheet.name ? 旧游戏表.get(sheet.name) : undefined;
      if (旧表?.content?.length && sheet.content?.length && _.isEqual(旧表.content[0], sheet.content[0])) {
        sheet.content = _.cloneDeep(旧表.content);
      }
      当前模板[targetKey] = sheet;
    }
    const result = await api.importTemplateFromData(当前模板, { scope: 'chat', presetName: '人妻公寓·长期记忆' });
    return result.success
      ? { ...result, message: `${result.message || '安装完成'}（已保留当前模板中的其他表）` }
      : result;
  } catch (error) {
    console.error('[人妻公寓·数据库] 安装聊天级模板失败:', error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function 打开数据库界面(): Promise<boolean> {
  const api = 取数据库API();
  try {
    if (typeof api?.openVisualizer === 'function') {
      api.openVisualizer();
      return true;
    }
    if (typeof api?.openSettings === 'function') return await api.openSettings();
  } catch (error) {
    console.warn('[人妻公寓·数据库] 打开数据库界面失败:', error);
  }
  return false;
}

export interface 数据库回合事件 {
  楼层: number;
  时间: string;
  地点: string;
  参与者: string[];
  玩家行动: string;
  结果摘要: string;
}

export async function 同步数据库回合(event: 数据库回合事件): Promise<boolean> {
  const api = 取数据库API();
  if (typeof api?.insertRow !== 'function' || !数据库状态().已装游戏模板) return false;
  try {
    const data: Record<string, unknown> = {
      楼层: event.楼层,
      时间: event.时间,
      地点: event.地点,
      参与者: event.参与者.join('、'),
      玩家行动: event.玩家行动.slice(0, 500),
      结果摘要: event.结果摘要.replace(/\s+/g, ' ').slice(0, 800),
      事件编码: `RQ-${event.楼层}`,
    };
    // 重写/回档的插件事件尚未完成合并时，旧楼层行可能短暂仍在运行态；此时原位更新，避免 UNIQUE 冲突。
    const tableData = 解析数据库数据(api.exportTableAsJson?.());
    const sheet = 取表(tableData, 'RQ_剧情事件');
    const headers = (sheet?.content?.[0] ?? []).map(String);
    const floorCol = headers.indexOf('楼层');
    const existingRow =
      floorCol < 0
        ? -1
        : (sheet?.content ?? []).findIndex((row, index) => index > 0 && Number(row[floorCol]) === event.楼层);
    if (existingRow >= 1 && typeof api.updateRow === 'function') {
      return await 限时等待(api.updateRow('RQ_剧情事件', existingRow, data), 4000, '数据库事件更新');
    }
    const row = await 限时等待(api.insertRow('RQ_剧情事件', data), 4000, '数据库事件写入');
    return row >= 1;
  } catch (error) {
    console.warn('[人妻公寓·数据库] 回合事件同步失败(不影响游戏):', error);
    return false;
  }
}

function 取表(data: unknown, name: string): 数据表 | undefined {
  if (!data || typeof data !== 'object') return undefined;
  return Object.values(data as Record<string, unknown>).find(value => {
    const sheet = value as 数据表 | null;
    return sheet?.name === name && Array.isArray(sheet.content);
  }) as 数据表 | undefined;
}

/** SP·数据库 8.4 会按 DDL 字段后的 `-- 中文表头` 注释做双向映射；缺任一映射会拒绝 hydrate。 */
function 表结构可用(sheet: 数据表 | undefined, expectedHeaders: readonly string[]): boolean {
  const headers = (sheet?.content?.[0] ?? []).map(String);
  if (!_.isEqual(headers, expectedHeaders)) return false;
  const ddl = sheet?.sourceData?.ddl ?? '';
  return expectedHeaders
    .slice(1)
    .every(header => new RegExp(`--\\s*${_.escapeRegExp(header)}\\s*(?:\\r?\\n|$)`).test(ddl));
}

function 行转文本(sheet: 数据表, focusNames: readonly string[], 只要未结 = false): string[] {
  const content = sheet.content ?? [];
  const headers = (content[0] ?? []).map(String);
  return content
    .slice(1)
    .filter(row => {
      const text = row.map(String).join('|');
      const 命中人物 = focusNames.length === 0 || focusNames.some(name => text.includes(name));
      const 未结 = !只要未结 || (!text.includes('已兑现') && !text.includes('已作废'));
      return 命中人物 && 未结;
    })
    .slice(-4)
    .map(row =>
      row
        .map((value, index) => `${headers[index] ?? index}:${String(value ?? '')}`)
        .filter(text => !text.endsWith(':'))
        .join('；'),
    );
}

export function 读取数据库记忆胶囊(focusNames: readonly string[]): string {
  const api = 取数据库API();
  if (typeof api?.exportTableAsJson !== 'function' || !数据库状态().已装游戏模板) return '';
  try {
    const data = 解析数据库数据(api.exportTableAsJson());
    const 人物表 = 取表(data, 'RQ_人物长期记忆');
    const 伏笔表 = 取表(data, 'RQ_承诺与伏笔');
    const 社交表 = 取表(data, 'RQ_社交轨迹');
    const rows = [
      ...(人物表 ? 行转文本(人物表, focusNames) : []),
      ...(伏笔表 ? 行转文本(伏笔表, focusNames, true) : []),
      ...(社交表 ? 行转文本(社交表, focusNames) : []),
    ].slice(-8);
    if (!rows.length) return '';
    return `\n<人妻公寓数据库记忆>\n以下是数据库中与本场人物相关的长期事实，只用于保持连续性；若与本楼MVU硬状态冲突，以MVU为准。\n${rows
      .map(row => `- ${row}`)
      .join('\n')}\n</人妻公寓数据库记忆>`.slice(0, 2200);
  } catch (error) {
    console.warn('[人妻公寓·数据库] 读取长期记忆失败(本轮不注入):', error);
    return '';
  }
}
