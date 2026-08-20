/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const App源码 = readFileSync(new URL('../../src/人妻公寓/界面/客户端/App.vue', import.meta.url), 'utf8');

function 截函数(函数名, 下一个函数名) {
  const start = App源码.indexOf(`function ${函数名}`);
  const end = App源码.indexOf(`function ${下一个函数名}`, start + 1);
  assert.ok(start >= 0 && end > start, `未找到函数区间：${函数名} → ${下一个函数名}`);
  return App源码.slice(start, end);
}

test('商店、背包、档案与房内动作在脚本接管前共享同步提交门，双击不能排入两笔 MVU 事务', () => {
  assert.match(App源码, /import \{ MVU操作进行中 \} from '\.\.\/\.\.\/脚本\/游戏逻辑\/mvuIO';/, '客户端读取脚本同步排队忙态');
  assert.match(App源码, /const 界面事务提交中 = ref\(false\)/, '纯 UI 业务拥有本地同步提交锁');
  assert.match(
    App源码,
    /const 场景操作锁 = computed\(\(\) => 发送中\.value \|\| 场景剧情锁定\.value \|\| 界面事务提交中\.value\)/,
    '所有弹窗和房内动作共享同一锁',
  );
  const 提交门 = 截函数('提交界面事务', '继续场景剧情');
  assert.match(提交门, /MVU操作进行中\(\)/, '已有脚本事务同步在队时拒绝第二笔');
  assert.match(提交门, /界面事务提交中\.value = true;[\s\S]*任务\(\)/, '必须先占本地门再 eventEmit');
  assert.match(提交门, /Promise\.resolve\(派发结果\)\.then\(/, '事件监听可在微任务入队，不能在 eventEmit Promise 收口前提前解锁');
  assert.match(提交门, /观察界面事务收口\(本次世代\)/, '提交后按真实 MVU 队列收口释放，不能靠固定延迟猜测');

  for (const 事件 of [
    '购买',
    '送礼',
    '使用运作',
    '使用资源道具',
    '布设摄像头',
    '偷窥选细节',
    '读信',
    '要钱',
    '请求晋阶',
  ]) {
    assert.match(
      App源码,
      new RegExp(`提交界面事务\\(\\(\\) =>[\\s\\S]{0,220}?eventEmit\\('人妻公寓:${事件}'`),
      `${事件} 必须走同步提交门`,
    );
  }
  assert.match(
    App源码,
    /function 使用录像带\(\) \{[\s\S]*?提交界面事务\(\(\) => \{[\s\S]*?请求使用录像带\(\)/,
    '录像带票必须在打开特殊场景前占同步提交门',
  );
  assert.match(
    App源码,
    /function 打开静音会议筹备\(\) \{[\s\S]*?提交界面事务\(\(\) => \{[\s\S]*?请求打开静音会议筹备\(\)/,
    '静音会议票必须在打开筹备界面前占同步提交门',
  );
  const 房间动作区 = App源码.slice(App源码.indexOf('事件: {'), App源码.indexOf('});', App源码.indexOf('事件: {')) + 3);
  assert.match(房间动作区, /提交界面事务\(/, '房内动作必须显式占用共享提交门');
  assert.doesNotMatch(
    房间动作区,
    /:\s*(?:\([^)]*\)|[\w一-龥]+)\s*=>\s*eventEmit\(/,
    '房内动作属性回调不能绕过同步提交门直接 emit',
  );
});

test('垃圾轨迹预写失败可重试，监控移动成功后才经同步门提交，二者都不留首写副作用', () => {
  const 垃圾 = 截函数('选垃圾袋', '布设');
  assert.match(垃圾, /提交界面事务\(async \(\) => \{/, '垃圾轨迹写入与业务事件必须共用同一同步提交门');
  assert.match(
    垃圾,
    /await insertOrAssignVariables\([\s\S]*?垃圾选择开\.value = false;[\s\S]*?await eventEmit\('人妻公寓:翻垃圾', 门牌号\)/,
    '只有轨迹写成功才关闭弹窗并派发翻查；失败由提交门释放并保持可重试',
  );
  assert.doesNotMatch(
    垃圾,
    /垃圾选择开\.value = false;[\s\S]*?await insertOrAssignVariables/,
    '不可在核心预写成功前关闭弹窗制造假成功',
  );

  const 监控 = 截函数('看监控', '刷新偷窥待选');
  assert.match(监控, /if \(!\(await 确认已到达动作地点\('302'\)\)\) return;/, '监控先等待真实移动落盘');
  assert.match(
    监控,
    /if \(提交界面事务\(\(\) => eventEmit\('人妻公寓:查看摄像头', 门牌号\)\)\) 显示监控\.value = false;/,
    '移动成功后仍要先占同步门，只有事件受理才关闭监控',
  );
});

test('行动选项冻结聊天、末楼、消息签名和内容世代，移动后旧分支回调必须零启动', () => {
  const 刷新 = 截函数('刷新行动选项', '开始考验');
  const 时间线身份 = 截函数('当前行动选项时间线身份', '行动选项仍有效');
  assert.match(App源码, /const 行动选项世代 = ref\(0\)/, '选项 DOM 与回调需要可观测世代');
  assert.match(App源码, /function 当前行动选项时间线身份\(\)/, '身份必须包含当前聊天时间线而非只比文本');
  assert.match(时间线身份, /当前回合恢复上下文\(\)/, '复用聊天 ID、末楼与消息签名三重身份');
  assert.match(时间线身份, /上下文\.聊天ID[\s\S]*上下文\.锚楼[\s\S]*上下文\.锚签名/, '三重身份字段缺一不可');
  assert.match(刷新, /JSON\.stringify\(新选项\)/, '内容变更也必须推进世代');
  assert.match(刷新, /行动选项世代\.value \+= 1;/, '身份或内容变化时作废旧 DOM/回调');
  assert.match(App源码, /<ActionOptions[\s\S]{0,180}:key="行动选项世代"/, '旧按钮节点必须随世代销毁');

  const 点选项 = 截函数('点选项', '选择亲密收尾');
  assert.match(点选项, /const 本次选项世代 = 行动选项世代\.value;/, '点击冻结本次世代');
  assert.match(点选项, /if \(!行动选项仍有效\(文本, 本次选项世代\)\) return;/, '入口先拒绝过期文本');
  assert.match(
    点选项,
    /await 进入\(目标\)[\s\S]{0,140}if \(!行动选项仍有效\(文本, 本次选项世代\)\) return;[\s\S]{0,80}发出\(文本\)/,
    '异步移动完成后必须再次复核时间线与世代再启动回合',
  );
});

test('场景剧情开始、旧档登场检查与旧档认领共享同步提交门，但不被自身剧情功能锁反向拒绝', () => {
  const 提交门 = 截函数('提交界面事务', '继续场景剧情');
  assert.match(提交门, /允许场景剧情锁 = false/, '共享提交门必须显式声明剧情锁例外');
  assert.match(
    提交门,
    /!允许场景剧情锁 && 场景剧情锁定\.value/,
    '普通业务仍受剧情功能锁，只有专用续接入口可以例外',
  );
  for (const 函数名 of ['继续场景剧情', '检查入住登场地点', '恢复旧场景剧情']) {
    const 起点 = App源码.indexOf(`function ${函数名}`);
    const 终点 = App源码.indexOf('\nfunction ', 起点 + 1);
    const 段 = App源码.slice(起点, 终点 > 起点 ? 终点 : undefined);
    assert.match(段, /提交界面事务\([\s\S]*?eventEmit\('人妻公寓:继续场景剧情'/, `${函数名} 必须占同步门`);
    assert.match(段, /, true\)/, `${函数名} 只允许绕过自身剧情锁，不得绕过发送／移动／MVU 忙门`);
  }
  const 模板 = App源码.slice(App源码.indexOf('<template>'), App源码.lastIndexOf('</template>'));
  assert.equal((模板.match(/:disabled="发送中 \|\| 界面事务提交中"/g) ?? []).length >= 3, true, '三枚剧情按钮在本地提交缝隙立即禁用');
});

test('工具由头异步写入冻结聊天、消息分支与房间，切聊后旧文本不得恢复或发送到新界面', () => {
  const 发送 = 截函数('发送', '重掷');
  assert.match(发送, /const 提交时间线身份 = 当前行动选项时间线身份\(\)/, '输入提交前冻结聊天、末楼与消息签名');
  assert.match(发送, /const 提交房间 = 当前房间\.value;/, '输入提交前冻结现场房间');
  assert.match(发送, /保存待恢复行动\(文本\);[\s\S]*?await insertOrAssignVariables/, '异步预写前把原行动保存到旧聊天恢复缓存');
  assert.match(
    发送,
    /if \(提交时间线身份 !== 当前行动选项时间线身份\(\) \|\| 当前房间\.value !== 提交房间\) \{[\s\S]*?return;/,
    '预写返回后先复核聊天分支与房间，失效时零发送',
  );
  assert.match(
    发送,
    /catch \(e\) \{[\s\S]*?if \(提交时间线身份 === 当前行动选项时间线身份\(\) && 当前房间\.value === 提交房间\) \{[\s\S]*?输入文本\.value = 文本;/,
    '失败只允许在同一时间线和同一房间恢复输入，不能泄漏到新聊天',
  );
  const 发出位置 = 发送.lastIndexOf('发出(文本)');
  const 复核位置 = 发送.lastIndexOf('提交时间线身份 !== 当前行动选项时间线身份()');
  assert.ok(复核位置 >= 0 && 发出位置 > 复核位置, '最终发出必须位于迟到复核之后');
});

test('场景移动冻结共享世代与聊天身份，旧移动返回不得切新房间、开地图或清新 CG', () => {
  const 写场景 = 截函数('写场景', '启动阶段线路剧情');
  const 进入 = 截函数('进入', '离开房间');
  const 离开 = 截函数('离开房间', '同步场景自变量');
  const 同步 = 截函数('同步场景自变量', '闪转场');

  assert.match(App源码, /function 捕获客户端时间线身份\(\)/, '客户端移动必须冻结共享世代与聊天 ID');
  assert.match(App源码, /function 客户端时间线仍有效\(/, '所有异步移动收口复用同一身份判定');
  assert.match(写场景, /Promise<boolean>/, '场景持久化必须向调用方报告是否仍属于当前时间线');
  assert.match(写场景, /const 写入身份 = 捕获客户端时间线身份\(\)/, '写场景自身冻结身份');
  assert.match(
    写场景,
    /await insertOrAssignVariables[\s\S]*?if \(!客户端时间线仍有效\(写入身份\)\) return false;[\s\S]*?清空当前成人CG\(\)/,
    '旧写入返回必须在任何 CG 清理前失败关闭',
  );
  assert.match(写场景, /return true;/, '当前时间线写入成功才返回 true');

  assert.match(进入, /const 移动身份 = 捕获客户端时间线身份\(\)/, '进入操作冻结身份');
  assert.match(
    进入,
    /await 确认亲密离场\(\)[\s\S]*?if \(!客户端时间线仍有效\(移动身份\)\) \{[\s\S]*?同步场景自变量\(\);[\s\S]*?return false;/,
    '离场确认期间切聊必须零继续',
  );
  const 进入写入位置 = 进入.indexOf('await 写场景');
  const 进入写入失败同步位置 = 进入.indexOf('同步场景自变量()', 进入写入位置);
  const 进入写入失败返回位置 = 进入.indexOf('return false', 进入写入失败同步位置);
  assert.ok(
    进入写入位置 >= 0 && 进入写入失败同步位置 > 进入写入位置 && 进入写入失败返回位置 > 进入写入失败同步位置,
    '场景写入失去身份后必须同步当前真值并返回，不得更新本地房间',
  );
  assert.ok(进入.indexOf('当前房间.value = 房间id') > 进入写入位置, '本地房间只能在有效写入之后改变');

  assert.match(离开, /const 移动身份 = 捕获客户端时间线身份\(\)/, '离开操作冻结身份');
  assert.match(
    离开,
    /if \(!\(await 写场景\(null\)\)\) \{[\s\S]*?同步场景自变量\(\);[\s\S]*?return;/,
    '旧离开写入返回后不得清房间或打开地图',
  );
  assert.ok(离开.indexOf('显示地图.value = true') > 离开.indexOf('await 写场景(null)'), '地图只在有效离开后打开');

  assert.match(同步, /const 时间线变化 = 本次时间线世代 !== 场景同步时间线世代/, '同步识别同房间 ABA 时间线变化');
  assert.match(
    同步,
    /if \(下一状态\.房间变化 \|\| 时间线变化\) \{[\s\S]*?清空当前成人CG\(\);[\s\S]*?当前家庭计划CG\.value = null;[\s\S]*?当前生产CG\.value = null;[\s\S]*?最近CG信号 = null;/,
    '切聊、swipe 或换房都清理旧时间线的全部事件画面',
  );
});

test('异步场景移动未落盘时，自由输入与行动选项都不能按旧场景启动回合', () => {
  const 点选项 = 截函数('点选项', '选择亲密收尾');
  const 发出 = 截函数('发出', '发送');
  const 发送 = 截函数('发送', '重掷');

  assert.match(点选项, /if \(发送中\.value \|\| 场景移动中\) return;/, '选项入口必须拒绝并发移动');
  assert.match(发出, /if \(!文本 \|\| 发送中\.value \|\| 场景移动中\) return;/, '共享提交口必须拒绝并发移动');
  assert.match(
    发送,
    /if \(!文本 \|\| 发送中\.value \|\| 由头写入中\.value \|\| 场景移动中 \|\| !当前行动可提交\.value\) return;[\s\S]*?输入文本\.value = '';/,
    '自由输入必须在清空文本之前拒绝并发移动',
  );
});
