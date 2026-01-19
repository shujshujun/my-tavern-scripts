import { defineMvuDataStore } from '@/util/mvu';
import { Schema } from '../../schema';

// Bug #32 修复：旧楼层状态栏也被更新的问题
//
// 问题分析：
// - 原代码：export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });
// - getCurrentMessageId() 在模块加载时（ES module 解析时）执行，只执行一次
// - 由于 ES module 缓存，后续 iframe 导入时复用已缓存的模块，不会重新执行
// - 这导致所有 iframe 的状态栏都使用第一个 iframe 加载时的 message_id
// - 结果：所有楼层的状态栏都显示同一个楼层的数据
//
// 解决方案：
// - 将 variable_option 改为函数形式：() => ({ type: 'message', message_id: getCurrentMessageId() })
// - defineMvuDataStore 会在 store 初始化时调用这个函数
// - 这确保每个 iframe 实例都能获取到自己的 message_id
//
// 注意：
// - 这依赖于 mvu.ts 中 defineMvuDataStore 对函数类型 variable_option 的支持（Bug #32 同时修复）
export const useDataStore = defineMvuDataStore(Schema, () => ({ type: 'message', message_id: getCurrentMessageId() }));
