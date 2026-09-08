/**
 * @deprecated 旧房间自由文本适配层。生产操作由房内动作按钮和两条正文提交链直接调用
 * `许曼君分居系统.ts`；保留本文件只为旧调试／测试兼容，不再注册第三个输入消费者。
 */
import type { SchemaType } from '../../schema';
import {
  解析许曼君初谈参与方式,
  解析许曼君最终关系选择,
  许曼君分居地点动作,
  执行许曼君分居地点动作,
  读取许曼君分居状态,
  type 许曼君分居动作ID,
  type 许曼君分居结果,
} from './许曼君分居系统';

export interface 许曼君分居输入桥结果 {
  已匹配: boolean;
  需要AI剧情: boolean;
  阻止普通输入: boolean;
  动作结果: 许曼君分居结果 | null;
  系统反馈: string;
}

function 归一化(text: unknown): string {
  return String(text ?? '').normalize('NFKC').replace(/\s+/gu, '').replace(/[“”‘’'"`]/gu, '');
}

/** 旧调用方兼容分类；新四幕的两个正式决定分别由权威解析器判定。 */
export function 解析许曼君分居玩家决定(input: unknown): '承担' | '拒绝' | '暂缓' | '中立' | '不明确' {
  const 文 = 归一化(input);
  if (!文) return '不明确';
  // 权威解析器必须看到原引号与说话者边界，不能先用旧归一化抹掉引用归属。
  const 初谈 = 解析许曼君初谈参与方式(input);
  if (初谈 === '当面在场' || 初谈 === '先夫妻谈') return '承担';
  if (初谈 === '暂缓') return '暂缓';
  const 最终 = 解析许曼君最终关系选择(input);
  if (最终 === '继续关系') return '承担';
  if (最终 === '退出关系') return '拒绝';
  if (最终 === '暂不承诺') return '暂缓';
  if (/(我只是管理员|只是房东|按租约|按规定|和我无关|你们夫妻的事|保持中立|不站任何一边)/u.test(文)) return '中立';
  if (/(继续瞒|别让他知道|不要让他知道|我不去|不出现|不承担|不负责|不承认|算了吧|我不管)/u.test(文)) return '拒绝';
  return '不明确';
}

function 需要人物剧情(id: 许曼君分居动作ID): boolean {
  return id.startsWith('开始') || id === '接受共同夜晚';
}

/** 可选输入桥只调用正式动作提供器；不存在第二套阶段或物件写入。 */
export function 尝试处理许曼君分居房间输入(
  data: SchemaType,
  input: unknown,
  options: { 地点?: string; 当前楼层?: number } = {},
): 许曼君分居输入桥结果 {
  const wanted = 归一化(input);
  if (!wanted) return { 已匹配: false, 需要AI剧情: false, 阻止普通输入: false, 动作结果: null, 系统反馈: '' };
  const 地点 = String(options.地点 ?? '');
  const item = 许曼君分居地点动作(data, 地点).find(candidate =>
    归一化(candidate.文案) === wanted || 归一化(candidate.id) === wanted,
  );
  if (!item) return { 已匹配: false, 需要AI剧情: false, 阻止普通输入: false, 动作结果: null, 系统反馈: '' };
  const result = 执行许曼君分居地点动作(data, item.id, 地点, options.当前楼层 ?? -1);
  return {
    已匹配: true,
    需要AI剧情: result.成功 && 需要人物剧情(item.id),
    阻止普通输入: !result.成功 || !需要人物剧情(item.id),
    动作结果: result,
    系统反馈: result.提示,
  };
}

export function 许曼君分居剧情票导演注入(ticket: { 阶段?: string; 当前拍?: number; 总拍?: number; 地点?: string }): string {
  return [
    '【许曼君《分居》四幕剧情】',
    `阶段：${ticket.阶段 ?? 读取许曼君分居状态({}).阶段}；第${Number(ticket.当前拍 ?? 0) + 1}/${ticket.总拍 ?? '?'}拍；地点：${ticket.地点 ?? '当前设计地点'}。`,
    '只完成当前拍，不替玩家作选择，不移动钥匙，不推进世界时间，不提前写入下一检查点。',
  ].join('\n');
}
