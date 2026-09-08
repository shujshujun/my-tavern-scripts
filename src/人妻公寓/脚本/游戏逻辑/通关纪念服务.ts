import { cloneDeep } from 'lodash';
import type { SchemaType } from '../../schema';
import { 通关评级列表, type 通关成绩, type 通关评级 } from '../../通关纪念存档';
import {
  构造通关成绩,
  同步通关进度,
  准备通关结算,
  待庆祝通关成绩,
  确认通关庆祝,
  登记本局CG,
  通关结算可展示,
} from './通关结算';

export interface 通关纪念请求 {
  id: string;
  时间线: string;
  聊天ID?: string;
  查询身份?: boolean;
  CG: string[];
  允许展示: boolean;
  确认评级?: 通关评级;
}
export interface 通关纪念响应 {
  id: string;
  时间线: string;
  状态: '完成' | '等待' | '失败' | '身份' | '失效';
  聊天ID?: string;
  当前?: 通关成绩;
  首次?: 通关成绩 | null;
  庆祝?: 通关成绩 | null;
  已记录CG?: string[];
}
interface 依赖 {
  聊天ID: () => string;
  时间线: () => string;
  忙碌: () => boolean;
  写入忙碌: () => boolean;
  场景: () => string | null;
  读取: () => { raw: object; data: SchemaType } | null | undefined;
  排队: (任务: () => Promise<void>) => Promise<void>;
  登记提交校验: (校验: () => boolean) => () => void;
  写入: (raw: object, data: SchemaType) => Promise<void>;
  捕获保护: (data: SchemaType) => void;
  合法CG: (id: string) => boolean;
  响应: (结果: 通关纪念响应) => void | Promise<unknown>;
}

/** 非叙事记录服务：读取、候选、写入共享现有MVU租约，陈旧请求不改新分支。 */
export function 创建通关纪念服务(依赖: 依赖) {
  return async (原请求: unknown): Promise<void> => {
    if (!原请求 || typeof 原请求 !== 'object') return;
    const 请求 = 原请求 as 通关纪念请求;
    if (typeof 请求.id !== 'string' || 请求.id.length > 160 || typeof 请求.时间线 !== 'string') return;
    if (请求.查询身份) {
      if (请求.聊天ID !== 依赖.聊天ID()) return;
      await 依赖.响应({ id: 请求.id, 时间线: 依赖.时间线(), 聊天ID: 依赖.聊天ID(), 状态: '身份' });
      return;
    }
    if (请求.时间线 !== 依赖.时间线()) {
      await 依赖.响应({ id: 请求.id, 时间线: 请求.时间线, 状态: '失效' });
      return;
    }
    if (请求.确认评级 !== undefined && !通关评级列表.includes(请求.确认评级)) return;
    const 仍有效 = () => 请求.时间线 === 依赖.时间线();
    const 回复 = (状态: 通关纪念响应['状态'], 结果: Partial<通关纪念响应> = {}) => {
      if (仍有效()) return 依赖.响应({ id: 请求.id, 时间线: 请求.时间线, 状态, ...结果 });
      return undefined;
    };
    if (依赖.忙碌() || 依赖.写入忙碌()) {
      await 回复('等待');
      return;
    }
    try {
      await 依赖.排队(async () => {
        if (!仍有效()) return;
        if (依赖.忙碌()) {
          await 回复('等待');
          return;
        }
        const 最新 = 依赖.读取();
        if (!最新) {
          await 回复('等待');
          return;
        }
        const { raw, data } = cloneDeep(最新);
        const 取消校验 = 依赖.登记提交校验(仍有效);
        try {
          const CG = Array.isArray(请求.CG)
            ? [...new Set(请求.CG.filter(id => typeof id === 'string' && 依赖.合法CG(id)))].slice(0, 256)
            : [];
          let 变动 = 登记本局CG(data, CG);
          变动 = 同步通关进度(data) || 变动;
          if (请求.允许展示) 变动 = 准备通关结算(data, 依赖.场景()) || 变动;
          if (请求.确认评级) 变动 = 确认通关庆祝(data, 请求.确认评级) || 变动;
          if (变动) {
            if (!仍有效()) return;
            await 依赖.写入(raw, data);
            if (!仍有效()) return;
            依赖.捕获保护(data);
          }
          await 回复('完成', {
            当前: 构造通关成绩(data),
            首次: data.系统._通关纪念.首次成绩,
            已记录CG: CG,
            庆祝: 请求.允许展示 && 通关结算可展示(data, 依赖.场景()) ? 待庆祝通关成绩(data) : null,
          });
        } finally {
          取消校验();
        }
      });
    } catch (error) {
      console.warn('[人妻公寓] 通关纪念记录未提交：', error);
      await 回复('失败');
    }
  };
}
