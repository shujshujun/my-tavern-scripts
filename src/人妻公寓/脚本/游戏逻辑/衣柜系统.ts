import type { SchemaType } from '../../schema';
import { 户静态表, 查道具, 道具表, type 门牌 } from '../../stageConfig';
import { 是可见佩饰描述, 是完整外装道具, 衣柜可见妆容SKU, 读取衣柜造型 } from '../../衣柜造型配置';
import { 怀孕已公开 } from './怀孕系统';
import { 读取医院内容策略 } from './生产系统';

type 妻状态 = SchemaType['户'][string]['妻'];
export type 衣柜槽 = '外装' | '内衣' | '妆容' | '特殊';
export interface 衣柜动作 {
  门牌: 门牌;
  道具id: string;
  操作: '穿戴' | '卸下' | '脱下外装' | '套用造型';
}
export interface 衣柜物品 {
  id: string;
  名称: string;
  描述: string;
  槽: 衣柜槽;
  初始: boolean;
  已穿戴: boolean;
  可卸下: boolean;
  影响立绘: boolean;
}

const 单件槽 = ['外装', '内衣', '妆容'] as const;
const 商品们 = () => Object.values(道具表).filter(配 => 配.服饰);

/** 纯读取：旧档只恢复有穿戴凭据的 SKU，不扫描历史正文、不借用其他角色的库存。 */
export function 读取衣柜库存(妻: 妻状态): string[] {
  const id们 = [...(妻._衣柜 ?? [])];
  for (const 槽 of 单件槽) {
    const id = 妻._穿着SKU[槽];
    if (id && (查道具(id)?.服饰?.槽 === 槽 || (槽 === '外装' && 是完整外装道具(id)))) id们.push(id);
    // 没有 SKU 的早期档，只有被脚本锁住且描述精确匹配的槽可作为赠送证据。
    if (妻._穿戴锁.includes(槽)) {
      const 配 = 商品们().find(项 => 项.服饰!.槽 === 槽 && 项.服饰!.穿着描述 === 妻[槽]);
      if (配) id们.push(配.id);
    }
  }
  for (const 描述 of 妻.特殊) {
    const 配 = 商品们().find(项 => 项.服饰!.槽 === '特殊' && 项.服饰!.穿着描述 === 描述);
    if (配) id们.push(配.id);
  }
  return [...new Set(id们.filter(id => !!查道具(id)?.服饰))];
}

/** 在覆盖旧穿戴之前登记；与赠礼扣除一同随核心存档提交。 */
export function 登记衣柜赠礼(妻: 妻状态, id: string): void {
  if (!查道具(id)?.服饰) return;
  妻._衣柜 = [...new Set([...读取衣柜库存(妻), id])];
}

function 初始物品(m: 门牌): 衣柜物品[] {
  const 配 = 户静态表[m];
  return 单件槽.map(槽 => ({
    id: `初始${槽}_${配.妻名}`,
    名称: 槽 === '外装' ? '初始服装' : 槽 === '内衣' ? '默认内衣状态' : '初始妆容',
    描述: 槽 === '外装' ? (配.初始?.外装 ?? '') : 槽 === '妆容' ? (配.初始?.妆容 ?? '素颜') : '',
    槽,
    初始: true,
    已穿戴: false,
    可卸下: false,
    影响立绘: 槽 === '外装',
  }));
}

function 物品已穿戴(妻: 妻状态, 项: 衣柜物品): boolean {
  if (是完整外装道具(项.id) && 妻._穿着SKU.外装 === 项.id) return true;
  if (项.槽 === '特殊') return 妻.特殊.includes(项.描述);
  const id = 妻._穿着SKU[项.槽];
  return id ? id === 项.id : 妻[项.槽] === 项.描述;
}

/** 初始衣物来自静态配置，无需为每个存档重复保存描述和图片。 */
export function 读取衣柜物品(data: SchemaType, m: 门牌): 衣柜物品[] {
  const 妻 = data.户[m]?.妻;
  if (!妻 || !户静态表[m]) return [];
  const 项们: 衣柜物品[] = [
    ...初始物品(m),
    ...读取衣柜库存(妻).map(id => {
      const 配 = 查道具(id)!;
      const 服饰 = 配.服饰!;
      return {
        id,
        名称: 配.名称,
        描述: 服饰.穿着描述,
        槽: 服饰.槽,
        初始: false,
        已穿戴: false,
        可卸下: !服饰.不可卸下,
        影响立绘: 服饰.槽 === '外装' || 服饰.槽 === '内衣',
      };
    }),
  ];
  return 项们.map(项 => ({ ...项, 已穿戴: 物品已穿戴(妻, 项) }));
}

/** 只有脚本明确写入两个空值才表示脱外衣；旧档缺字段/空缓存不等于脱衣。 */
export function 外装已脱下(妻: 妻状态): boolean {
  return Object.hasOwn(妻._穿着SKU, '外装') && 妻._穿着SKU.外装 === '' && !妻.外装.trim();
}

function 可显示内衣SKU(妻: 妻状态): string {
  const id = 妻._穿着SKU.内衣;
  return id && 妻.内衣.trim() && 查道具(id)?.服饰?.槽 === '内衣' ? id : '';
}

/** 外衣优先；缓存 _立绘 不再拥有显示决定权，因而旧档不会错误露出内衣。 */
export function 当前可见立绘SKU(妻: 妻状态): string {
  if (外装已脱下(妻)) return 可显示内衣SKU(妻);
  const 外装 = 妻._穿着SKU.外装;
  if (外装?.startsWith('初始外装_')) return '';
  if (外装 && (查道具(外装)?.服饰?.槽 === '外装' || 是完整外装道具(外装))) return 外装;
  if (!外装 && 妻._穿戴锁.includes('外装')) {
    return 商品们().find(配 => 配.服饰!.槽 === '外装' && 配.服饰!.穿着描述 === 妻.外装)?.id ?? '';
  }
  return '';
}

export function 脱下外装阻止原因(妻: 妻状态): string {
  if (外装已脱下(妻)) return '她现在已经没有穿外衣。';
  if (!可显示内衣SKU(妻)) return '请先在衣柜里穿上一件内衣，再脱下外衣。';
  return '';
}

/** 预览应用后的可见衣物；外衣存在时，选择内衣不会另造“外衣+内衣”主图。 */
export function 衣柜预览SKU(妻: 妻状态, 项: 衣柜物品): string | undefined {
  if (项.槽 === '外装' || 项.槽 === '内衣') {
    if (项.槽 === '内衣' && 项.初始 && 外装已脱下(妻)) return 当前可见立绘SKU(妻);
    return 当前可见立绘SKU({ ...妻, [项.槽]: 项.描述, _穿着SKU: { ...妻._穿着SKU, [项.槽]: 项.id } });
  }
  return 当前可见立绘SKU(妻);
}

/** 只读预览当前服装与选中道具的完整组合，不把预览写进存档。 */
export function 衣柜预览穿戴(
  妻: 妻状态,
  项: 衣柜物品,
): {
  主立绘SKU: string | undefined;
  妆容SKU: string | undefined;
  特殊: string[];
} {
  const 主立绘SKU = 衣柜预览SKU(妻, 项);
  const 换衣 = 主立绘SKU !== 当前可见立绘SKU(妻);
  return {
    主立绘SKU,
    妆容SKU: 换衣 && 衣柜可见妆容SKU.includes(妻._穿着SKU.妆容) ? '' : 项.槽 === '妆容' ? 项.id : 妻._穿着SKU.妆容,
    特殊: 换衣
      ? 妻.特殊.filter(描述 => !是可见佩饰描述(描述))
      : 项.槽 === '特殊'
        ? [...new Set([...妻.特殊, 项.描述])]
        : [...妻.特殊],
  };
}

/** 造型是一次明确的整套应用；普通内衣、隐蔽物品和未知剧情记录继续保留。 */
export function 预览固定造型(妻: 妻状态, m: 门牌, id: string, 孕态 = false): 妻状态 | undefined {
  const 造型 = 读取衣柜造型(户静态表[m].妻名, id, 孕态);
  if (!造型) return undefined;
  const 候选 = {
    ...妻,
    _穿着SKU: { ...妻._穿着SKU },
    _穿戴锁: [...妻._穿戴锁],
    特殊: 妻.特殊.filter(描述 => !是可见佩饰描述(描述)),
  };
  const 基础 = 初始物品(m);
  候选.外装 = 造型.主服装 ? 查道具(造型.主服装)!.服饰!.穿着描述 : 基础[0].描述;
  候选._穿着SKU.外装 = 造型.主服装 || 基础[0].id;
  const 妆容id = 造型.妆容SKU || (妻._穿着SKU.妆容 === '浓香香水' ? '浓香香水' : 基础[2].id);
  候选.妆容 = 查道具(妆容id)?.服饰?.穿着描述 ?? 基础[2].描述;
  候选._穿着SKU.妆容 = 妆容id;
  for (const 槽 of ['外装', '妆容']) if (!候选._穿戴锁.includes(槽)) 候选._穿戴锁.push(槽);
  for (const 配件 of 造型.特殊SKU) 候选.特殊.push(查道具(配件)!.服饰!.穿着描述);
  更新最后佩饰SKU(候选);
  候选._穿着SKU._立绘 = 当前可见立绘SKU(候选);
  return 候选;
}

function 更新最后佩饰SKU(妻: 妻状态): void {
  const 最后 = 商品们().find(配 => 配.服饰!.槽 === '特殊' && 配.服饰!.穿着描述 === 妻.特殊.at(-1));
  if (最后) 妻._穿着SKU.特殊 = 最后.id;
  else delete 妻._穿着SKU.特殊;
}

function 剩余绑定佩饰(妻: 妻状态, 保留: readonly string[]): boolean {
  return 妻.特殊.some(
    描述 => !保留.includes(描述) && 商品们().some(配 => 配.服饰!.穿着描述 === 描述 && 配.服饰!.不可卸下),
  );
}

function 固定造型物品阻止原因(data: SchemaType, m: 门牌, id: string): string {
  const 妻 = data.户[m].妻;
  const 造型 = 读取衣柜造型(户静态表[m].妻名, id, 怀孕已公开(data, m));
  if (!造型) return 怀孕已公开(data, m) ? '这套造型暂未提供孕态成品图。' : '这套造型的成品图还在整理中。';
  const 库存 = 读取衣柜库存(妻);
  if ([id, 造型.主服装, 造型.妆容SKU, ...造型.特殊SKU].filter(Boolean).some(所需 => !库存.includes(所需))) {
    return '她还没有这套造型所需的物品，请先赠送。';
  }
  const 候选 = 预览固定造型(妻, m, id, 造型.孕态)!;
  const 当前物品 = 读取衣柜物品(data, m);
  for (const 槽 of ['外装', '妆容'] as const) {
    const 当前 = 当前物品.find(物品 => 物品.槽 === 槽 && 物品.已穿戴 && !物品.初始);
    if (当前 && !当前.可卸下 && 候选._穿着SKU[槽] !== 当前.id) return '当前穿戴有剧情限制，暂时不能套用其他造型。';
  }
  if (剩余绑定佩饰(妻, 候选.特殊)) return '当前佩饰有剧情限制，暂时不能套用其他造型。';
  if (候选.特殊.length > 4) return '保留剧情或隐蔽物品后，佩饰位置已满，请先摘下一件。';
  return '';
}

export function 固定造型阻止原因(data: SchemaType, m: 门牌, id: string): string {
  return 衣柜操作阻止原因(data, m) || 固定造型物品阻止原因(data, m, id);
}

export function 衣柜操作阻止原因(data: SchemaType, m: 门牌): string {
  const 妻 = data.户[m]?.妻;
  if (!妻 || !户静态表[m]) return '这个角色尚未入住。';
  if (!妻.裂缝.已确认 || 妻.当前阶段 === 0) return '先了解她、打开关系，再替她挑选穿戴。';
  if (!读取医院内容策略(data, m).允许普通礼物) return '她正在医院待产或恢复，暂时只可查看衣柜。';
  if (data.系统._特殊场景.id || data.系统._荣耀洞拍 >= 0 || data.系统._性爱场景.状态 !== '空闲') {
    return '请先结束当前场景，再更换穿戴。';
  }
  if (data.系统._父亲通话.标识 || data.系统._父亲通话.状态) return '请先处理当前通话，再更换穿戴。';
  return '';
}

/** 仅改候选存档；宿主负责在串行安全操作内验证同场并原子保存。没有 AI、奖励或余波。 */
export function 执行衣柜动作(data: SchemaType, 动作: 衣柜动作): { 成功: boolean; 提示: string; 变动?: boolean } {
  if (!动作 || !['穿戴', '卸下', '脱下外装', '套用造型'].includes(动作.操作) || typeof 动作.道具id !== 'string') {
    return { 成功: false, 提示: '衣柜操作无效，请重新选择。' };
  }
  const 阻止 = 衣柜操作阻止原因(data, 动作.门牌);
  if (阻止) return { 成功: false, 提示: 阻止 };
  return 执行穿戴变更(data, 动作);
}

/** 只由已完成各自入口校验的衣柜/赠礼调用，共享物品、绑定与显示变更规则。 */
function 执行穿戴变更(data: SchemaType, 动作: 衣柜动作): { 成功: boolean; 提示: string; 变动?: boolean } {
  if (动作.操作 === '穿戴' && 是完整外装道具(动作.道具id)) return 执行穿戴变更(data, { ...动作, 操作: '套用造型' });
  const 妻 = data.户[动作.门牌].妻;
  const 项们 = 读取衣柜物品(data, 动作.门牌);
  const 项 = 项们.find(候选 => 候选.id === 动作.道具id);
  if (!项) return { 成功: false, 提示: '她的衣柜里没有这件物品，请先赠送。' };
  if (动作.操作 === '套用造型') {
    const 原因 = 固定造型物品阻止原因(data, 动作.门牌, 项.id);
    if (原因) return { 成功: false, 提示: 原因 };
    const 候选 = 预览固定造型(妻, 动作.门牌, 项.id, 怀孕已公开(data, 动作.门牌))!;
    const 字段们 = ['外装', '妆容', '特殊', '_穿着SKU', '_穿戴锁'] as const;
    if (字段们.every(键 => JSON.stringify(妻[键]) === JSON.stringify(候选[键])))
      return { 成功: true, 提示: '当前已经是这套造型。' };
    const 库存 = 读取衣柜库存(妻);
    Object.assign(妻, Object.fromEntries(字段们.map(键 => [键, 候选[键]])));
    妻._衣柜 = 库存;
    return { 成功: true, 变动: true, 提示: `已套用「${项.名称}」固定造型，换下的衣物和配件仍保留在衣柜中。` };
  }
  if (动作.操作 === '脱下外装') {
    const 当前完整外装 = 是完整外装道具(项.id) && 妻._穿着SKU.外装 === 项.id;
    if ((项.槽 !== '外装' && !当前完整外装) || !项.已穿戴 || (!项.初始 && !项.可卸下)) {
      return { 成功: false, 提示: '这件外衣当前不能脱下，穿戴没有改变。' };
    }
    const 原因 = 脱下外装阻止原因(妻);
    if (原因) return { 成功: false, 提示: 原因 };
  }
  if (项.槽 === '内衣' && 外装已脱下(妻) && (动作.操作 === '卸下' || 项.初始)) {
    return { 成功: false, 提示: '请先穿回外衣，再恢复默认内衣状态。' };
  }
  if (动作.操作 === '卸下' && (!项.已穿戴 || !项.可卸下)) {
    return { 成功: false, 提示: 项.已穿戴 ? '这件物品不能从衣柜中卸下。' : '她现在没有穿戴这件物品。' };
  }
  if (动作.操作 === '穿戴' && 项.槽 === '特殊' && !项.已穿戴 && 妻.特殊.length >= 4) {
    return { 成功: false, 提示: '最多同时佩戴四件物品，请先摘下一件。' };
  }
  if (项.槽 !== '特殊') {
    const 当前 = 项们.find(候选 => 候选.槽 === 项.槽 && 候选.已穿戴 && !候选.初始);
    if (当前 && !当前.可卸下 && 当前.id !== 项.id) return { 成功: false, 提示: '当前穿戴有剧情限制，暂时不能替换。' };
  }
  const 换回完整外装 = 动作.操作 === '卸下' && 是完整外装道具(项.id) && 妻._穿着SKU.外装 === 项.id;
  const 目标主图 =
    动作.操作 === '脱下外装'
      ? 可显示内衣SKU(妻)
      : 换回完整外装
        ? ''
        : 衣柜预览SKU(
            妻,
            动作.操作 === '卸下' && 项.槽 !== '特殊' ? 初始物品(动作.门牌).find(候选 => 候选.槽 === 项.槽)! : 项,
          );
  const 更换可见衣物 = 目标主图 !== 当前可见立绘SKU(妻);
  if (
    更换可见衣物 &&
    (剩余绑定佩饰(
      妻,
      妻.特殊.filter(描述 => !是可见佩饰描述(描述)),
    ) ||
      (衣柜可见妆容SKU.includes(妻._穿着SKU.妆容) && 查道具(妻._穿着SKU.妆容)?.服饰?.不可卸下))
  ) {
    return { 成功: false, 提示: '当前造型含有剧情绑定穿戴，暂时不能更换服装。' };
  }
  const 之前 = JSON.stringify([妻._穿着SKU, 妻._穿戴锁, 妻.外装, 妻.内衣, 妻.妆容, 妻.特殊]);
  // 先保留被换下的旧档物品；库存始终属于本角色，不返回玩家背包。
  const 库存 = 读取衣柜库存(妻);
  if (动作.操作 === '脱下外装') {
    妻.外装 = '';
    妻._穿着SKU.外装 = '';
    if (!妻._穿戴锁.includes('外装')) 妻._穿戴锁.push('外装');
  } else if (换回完整外装) {
    const 初始 = 初始物品(动作.门牌)[0];
    妻.外装 = 初始.描述;
    妻._穿着SKU.外装 = 初始.id;
    妻.特殊 = 妻.特殊.filter(描述 => 描述 !== 项.描述);
    更新最后佩饰SKU(妻);
  } else if (项.槽 === '特殊') {
    if (动作.操作 === '卸下') 妻.特殊 = 妻.特殊.filter(描述 => 描述 !== 项.描述);
    else if (!项.已穿戴) 妻.特殊.push(项.描述);
    更新最后佩饰SKU(妻);
  } else {
    const 使用项 = 动作.操作 === '卸下' ? 初始物品(动作.门牌).find(候选 => 候选.槽 === 项.槽)! : 项;
    妻[项.槽] = 使用项.描述;
    妻._穿着SKU[项.槽] = 使用项.id;
    if (!妻._穿戴锁.includes(项.槽)) 妻._穿戴锁.push(项.槽);
  }
  if (更换可见衣物) {
    妻.特殊 = 妻.特殊.filter(描述 => !是可见佩饰描述(描述));
    if (衣柜可见妆容SKU.includes(妻._穿着SKU.妆容)) {
      const 初始 = 初始物品(动作.门牌)[2];
      妻.妆容 = 初始.描述;
      妻._穿着SKU.妆容 = 初始.id;
      if (!妻._穿戴锁.includes('妆容')) 妻._穿戴锁.push('妆容');
    }
    更新最后佩饰SKU(妻);
  }
  妻._穿着SKU._立绘 = 当前可见立绘SKU(妻);
  const 之后 = JSON.stringify([妻._穿着SKU, 妻._穿戴锁, 妻.外装, 妻.内衣, 妻.妆容, 妻.特殊]);
  if (之前 === 之后) return { 成功: true, 提示: '当前已经是这个穿戴状态。' };
  妻._衣柜 = 库存;
  return {
    成功: true,
    变动: true,
    提示:
      动作.操作 === '脱下外装'
        ? '已脱下外衣，展示当前内衣；外衣仍保留在她的衣柜中。'
        : 动作.操作 === '卸下'
          ? `已卸下「${项.名称}」，仍保留在她的衣柜中。`
          : 项.槽 === '内衣' && !外装已脱下(妻)
            ? `已穿上「${项.名称}」，外衣仍会遮住内衣。`
            : `已换上「${项.名称}」。`,
  };
}

/** 商店先验证赠礼的阶段/场景；这里先在候选中登记和穿戴，拒绝时不入库也不改原人。 */
export function 应用赠礼穿戴(
  data: SchemaType,
  m: 门牌,
  id: string,
): { 成功: boolean; 提示: string; 固定造型?: boolean } {
  const 妻 = data.户[m]?.妻;
  if (!妻 || !查道具(id)?.服饰) return { 成功: false, 提示: '这件物品不能作为服饰穿戴。' };
  const 候选妻 = {
    ...妻,
    _衣柜: [...妻._衣柜],
    _穿着SKU: { ...妻._穿着SKU },
    _穿戴锁: [...妻._穿戴锁],
    特殊: [...妻.特殊],
  };
  const 候选数据 = { ...data, 户: { ...data.户, [m]: { ...data.户[m], 妻: 候选妻 } } };
  登记衣柜赠礼(候选妻, id);
  const 固定 = !!读取衣柜造型(户静态表[m].妻名, id, 怀孕已公开(data, m));
  const 结果 = 执行穿戴变更(候选数据, { 门牌: m, 道具id: id, 操作: 固定 ? '套用造型' : '穿戴' });
  if (!结果.成功) return 结果;
  const 字段们 = ['外装', '内衣', '妆容', '特殊', '_穿着SKU', '_穿戴锁', '_衣柜'] as const;
  Object.assign(妻, Object.fromEntries(字段们.map(键 => [键, 候选妻[键]])));
  return { 成功: true, 提示: 结果.提示, 固定造型: 固定 };
}
