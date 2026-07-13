import { Schema, type SchemaType } from '../../schema';

/**
 * 脚本侧 MVU 读写共享模块
 *
 * 铁律:脚本/按钮要让 AI 下轮读到的写入,必须直写 message_id=-1,不能靠 store flush。
 */

/** 脚本自己写变量时置 true,安检机第二道(VARIABLE_UPDATE_ENDED)据此跳过 */
export let 脚本写入中 = false;

/** 读最新楼 stat_data(经 schema 消毒) */
export function 读取(): { raw: object; data: SchemaType } {
  const raw = Mvu.getMvuData({ type: 'message', message_id: -1 }) as object;
  const data = Schema.parse(_.get(raw, 'stat_data') ?? {});
  return { raw, data };
}

/** 带守卫的脚本写入(大额涨幅/机制字段更新只走这里) */
export function 脚本写入(raw: object, data?: SchemaType) {
  if (data) _.set(raw, 'stat_data', data);
  脚本写入中 = true;
  try {
    Mvu.replaceMvuData(raw as Mvu.MvuData, { type: 'message', message_id: -1 });
  } finally {
    脚本写入中 = false;
  }
}
