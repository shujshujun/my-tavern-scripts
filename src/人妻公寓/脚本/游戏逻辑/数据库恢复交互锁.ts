/** 官方导入接口没有取消参数；在同页持久导入期间阻止用户切换聊天。 */
export function 取得数据库恢复交互锁(doc: Document): () => void {
  const dialog = doc.createElement('dialog');
  if (typeof dialog.showModal !== 'function') throw new Error('当前浏览器不支持数据库恢复所需的页面事务锁');
  dialog.setAttribute('aria-label', '正在恢复数据库');
  dialog.style.cssText =
    'padding:24px;max-width:360px;border:0;border-radius:12px;background:#fff;color:#222;box-shadow:0 8px 36px #0005;font:16px/1.7 sans-serif';
  dialog.textContent = '正在恢复当前聊天的数据库，请稍候。完成后会自动继续；如果长时间没有响应，可刷新页面后重试。';
  const cancel = (event: Event) => event.preventDefault();
  const keys = (event: KeyboardEvent) => {
    // 浏览器刷新始终可用；页面内快捷键不能越过正在执行的持久导入。
    if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  dialog.addEventListener('cancel', cancel);
  doc.body.append(dialog);
  try {
    dialog.showModal();
  } catch (error) {
    dialog.remove();
    throw error;
  }
  doc.defaultView?.addEventListener('keydown', keys, true);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    doc.defaultView?.removeEventListener('keydown', keys, true);
    dialog.removeEventListener('cancel', cancel);
    dialog.close();
    dialog.remove();
  };
}
