export type 变量重生成事务阶段 = '可取消' | '提交中' | '已提交';

export interface 变量重生成事务门 {
  阶段: 变量重生成事务阶段;
  已取消: boolean;
}

export function 创建变量重生成事务门(): 变量重生成事务门 {
  return { 阶段: '可取消', 已取消: false };
}

/** 只有首次不可逆写入前允许取消；提交阶段的点击由调用方吸收，但不能再改写事务结论。 */
export function 请求取消变量重生成事务(事务: 变量重生成事务门): boolean {
  if (事务.阶段 !== '可取消' || 事务.已取消) return false;
  事务.已取消 = true;
  return true;
}

/** 在同一同步调用栈内关门，确保检查成功后不会再插入一次有效取消。 */
export function 尝试进入变量重生成提交(事务: 变量重生成事务门): boolean {
  if (事务.阶段 !== '可取消' || 事务.已取消) return false;
  事务.阶段 = '提交中';
  return true;
}

export function 标记变量重生成已提交(事务: 变量重生成事务门): boolean {
  if (事务.阶段 !== '提交中' || 事务.已取消) return false;
  事务.阶段 = '已提交';
  return true;
}
