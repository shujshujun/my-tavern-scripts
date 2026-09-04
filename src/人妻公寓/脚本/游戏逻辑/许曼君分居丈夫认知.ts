/**
 * @deprecated 仅保留给旧调试面板与测试读取。生产丈夫风险、作息与登门已经分别由
 * `丈夫线路风险策略.ts`、`楼层时钟.ts`和`丈夫登门系统.ts`消费同一权威分居状态；
 * 不得把本投影重新接成另一套状态写入或首次对质入口。
 */
import { 读取许曼君分居状态 } from './许曼君分居系统';

export interface 赵国强关系认知状态 {
  已知玩家关系: boolean;
  正在分居: boolean;
  钥匙受控: boolean;
  允许通用首次对质: boolean;
  后续反应语义: '普通未知' | '已知且分居' | '待离婚交接' | '正式退居';
}

function 是201(value: unknown): boolean {
  return String(value ?? '').replace(/[^0-9]/g, '') === '201';
}

export function 读取赵国强关系认知(data: unknown): 赵国强关系认知状态 {
  const state = 读取许曼君分居状态(data);
  const known = state.丈夫已知玩家关系;
  const away = ['路线外住', '预约回楼', '待离婚交接', '正式退居'].includes(state.丈夫居住模式);
  const controlled = state.钥匙位置 !== '赵国强持有' || state.钥匙用途 !== '普通住户';
  const semantic = state.丈夫居住模式 === '正式退居'
    ? '正式退居'
    : state.钥匙用途 === '待离婚交接'
      ? '待离婚交接'
      : known && away
        ? '已知且分居'
        : '普通未知';
  return {
    已知玩家关系: known,
    正在分居: away,
    钥匙受控: controlled,
    允许通用首次对质: !known,
    后续反应语义: semantic,
  };
}

/** 只关闭201“第一次才发现关系”的通用模板；其他门牌原样放行。 */
export function 允许通用首次丈夫对质(data: unknown, 门牌: unknown): boolean {
  return !是201(门牌) || 读取赵国强关系认知(data).允许通用首次对质;
}

/** 新孕情仍可有丈夫反应，但必须消费已经知情／分居事实，不能重演首次发现。 */
export function 读取201丈夫孕情反应语义(data: unknown): string {
  const state = 读取赵国强关系认知(data);
  if (state.后续反应语义 === '普通未知') return '沿用普通丈夫孕情知情与首次对质流程';
  if (state.后续反应语义 === '正式退居') return '赵国强已正式退居；只通过合法联系或结局后果回应新孕情';
  if (state.后续反应语义 === '待离婚交接') return '赵国强已知关系且钥匙待离婚交接；不得以普通丈夫身份突然回201首次对质';
  return '赵国强已知关系并正在分居；新孕情反应必须从既有知情与外住现实继续';
}
