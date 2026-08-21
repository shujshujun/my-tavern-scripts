/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 契约式结构回归测试：验证 App A7b2 拆分（静音会议完整状态域 → composables/useMuteMeeting.ts）
// 等价外移：场景/筹备/手机派生/A-B-C Pointer 互动/组合图/散会-自由-收尾与全部 timer/资源清理迁入
// composable；App 只保留背包 wrapper、事件总线 6 事件名、发送锁/清流、store pull、toast、UI lock、
// 输入聚焦与跨 listener 接线。不依赖绝对行号/Prettier 行宽。
const 客户端目录 = new URL('../../src/人妻公寓/界面/客户端/', import.meta.url);
const App源码 = readFileSync(new URL('./App.vue', 客户端目录), 'utf8').replace(/\r\n/gu, '\n');
const composable源码 = readFileSync(new URL('./composables/useMuteMeeting.ts', 客户端目录), 'utf8');
const 舞台源码 = readFileSync(new URL('./components/静音会议舞台.vue', 客户端目录), 'utf8');
const 互动源码 = readFileSync(new URL('./components/静音会议互动.vue', 客户端目录), 'utf8');
const 锁定源码 = readFileSync(new URL('./components/静音会议锁定提示.vue', 客户端目录), 'utf8');
const 会后源码 = readFileSync(new URL('./components/静音会议会后.vue', 客户端目录), 'utf8');
const 回合输入源码 = readFileSync(new URL('./components/回合输入.vue', 客户端目录), 'utf8');

/** 只提取 <template>…</template> 段，避免把注释/字符串当模板。 */
const 提取模板 = 源码 => 源码.slice(源码.indexOf('<template>'), 源码.lastIndexOf('</template>'));

/** 提取真实静态 import 语句里的模块 specifier（只认 import 语句，不搜普通文本/注释）。 */
function 提取导入specifier(源码) {
  return [...源码.matchAll(/import[^;]*?from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
}

const 转义 = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('composable 非空；App 真实 import 并恰好调用一次、解构完整消费 API；无反向依赖与逃逸类型', () => {
  assert.ok(composable源码.length > 0, 'useMuteMeeting.ts 应为非空文件');
  assert.match(App源码, /import \{ useMuteMeeting \} from '\.\/composables\/useMuteMeeting';/, 'App 应导入 useMuteMeeting');
  assert.strictEqual((App源码.match(/useMuteMeeting\(/g) ?? []).length, 1, 'App 应恰好调用一次 useMuteMeeting');
  assert.match(App源码, /\} = useMuteMeeting\(\{[\s\S]*?\n {2}data,[\s\S]*?\n\}\);/, 'App 应解构消费 API 并注入 data');
  assert.match(
    App源码,
    /function 打开静音会议筹备\(\) \{[\s\S]*?提交界面事务\(\(\) => \{[\s\S]*?请求打开静音会议筹备\(\);[\s\S]*?\}\)[\s\S]*?\}/,
    'App 应保留带同步提交门的背包 wrapper',
  );
  const 依赖 = 提取导入specifier(composable源码);
  assert.ok(!依赖.some(s => s.includes('App.vue') || s === './App' || s === '../App'), 'composable 不得反向导入 App');
  assert.ok(!依赖.some(s => s.includes('store')), 'composable 不得导入 store');
  assert.doesNotMatch(composable源码, /eventEmit\(|eventOn\(/, 'composable 不直连事件总线');
  assert.doesNotMatch(composable源码, /: any|\bFunction\b|\bas never\b/, 'composable 不得有 any/Function/as never 逃逸');
  // composable 返回完整消费 API（抽样：模板/脚本两路都依赖的关键标识符）
  for (const 标识 of [
    '静音会议场景,',
    '静音会议正式中,',
    '静音会议参与妻,',
    '静音会议演出妻,',
    '静音会议筹备可确认,',
    '请求打开静音会议筹备,',
    '取消静音会议筹备,',
    '静音会议手机可打开,',
    '静音会议互动id,',
    '静音会议互动待操作,',
    '静音会议互动结果,',
    '静音会议A按下,',
    '静音会议B按下,',
    '静音会议C抬起,',
    '静音会议指针取消,',
    '静音会议画面状态,',
    '静音会议当前图地址,',
    '静音会议会后选择,',
    '静音会议待散会选择,',
    '同步静音会议界面,',
    '处理静音会议回合完成前,',
    '处理静音会议自由回合失败,',
    '处理静音会议提示,',
    '标记静音会议自由行动开始,',
  ]) {
    assert.match(composable源码, new RegExp(转义(标识)), `composable 应返回 ${标识}`);
  }
});

test('App 不再声明 meeting 空状态/refs/computed/timers/Pointer/组合图/会后状态机；只留 wrapper 与接线', () => {
  for (const 已迁出 of [
    'const 空静音会议状态',
    'const 静音会议场景 = computed',
    'const 静音会议筹备步骤 = ref',
    'let 静音会议筹备timer',
    'let 静音会议活动指针',
    'let 静音会议连点timer',
    'let 静音会议结果timer',
    'const 静音会议本地失败次数 = ref',
    'const 静音会议本地画面状态 = ref',
    'const 静音会议画面状态 = computed',
    'const 静音会议图回退序号 = ref',
    'const 静音会议图已加载 = ref',
    'const 静音会议会后选择 = ref',
    'const 静音会议继续已选 = ref',
    'const 静音会议自由行动进行中 = ref',
    'function 同步静音会议界面(',
    'function 释放静音会议指针(',
    'function 提交静音会议互动(',
    'function 静音会议窗口失焦(',
    'function 处理静音会议提示(',
  ]) {
    assert.doesNotMatch(App源码, new RegExp(转义(已迁出)), `App 不应再声明 ${已迁出}`);
  }
  assert.doesNotMatch(App源码, /window\.addEventListener\('blur', 静音会议窗口失焦\)/, 'App 不应再挂 window blur');
  assert.doesNotMatch(App源码, /clearTimeout\(静音会议筹备timer\)/, 'App 不应再清理筹备 timer');
  assert.doesNotMatch(App源码, /清理静音会议互动现场\(\)/, 'App 不应再清理互动现场');
  // App 只保留背包 wrapper 与跨区块接线
  assert.match(App源码, /function 打开静音会议筹备\(\)/, 'App 保留 打开静音会议筹备 wrapper');
  assert.match(
    App源码,
    /if \(发送中\.value \|\| 静音会议中\.value\) return;[\s\S]*?提交界面事务\(\(\) => \{[\s\S]*?请求打开静音会议筹备\(\);[\s\S]*?\}\)[\s\S]*?显示背包\.value = false/,
    'wrapper 保 guard，并在关背包前占同步提交门',
  );
  assert.match(App源码, /@prepare-meeting="打开静音会议筹备"/, 'InventoryPopup 背包票仍接 wrapper');
});

test('options 强类型：13 项注入能力逐项声明；App 接线含 6 事件名/发送锁/清流/pull/toast/UI lock/focus', () => {
  const 选项段 = composable源码.slice(composable源码.indexOf('export interface 静音会议选项'), composable源码.indexOf('export function useMuteMeeting'));
  for (const 声明 of [
    'data: Readonly<Ref<SchemaType>>',
    'sending: Ref<boolean>',
    'clearStream: () => void',
    'pullState: () => void | Promise<void>',
    'toast: (文本: string, 时长?: number) => void',
    'lockMeetingUI: () => void',
    'focusInput: () => void',
    'useMeeting: () => void',
    'cancelPreparation: () => void',
    'startMeeting: (载荷: { 参与妻: 静音会议候选门牌[]; 议题: string }) => void',
    'reportInteractionFailure: (载荷: { id: 静音会议互动ID }) => void',
    'submitInteraction: (载荷: 静音会议互动载荷, recovery: boolean) => void',
    'endMeeting: () => void',
  ]) {
    assert.match(选项段, new RegExp(转义(声明)), `options 应强类型 ${声明}`);
  }
  assert.match(composable源码, /export type 静音会议互动载荷 =\n {2}\| \{ id: 'A' \}\n {2}\| \{ id: 'B'; 目标妻: string \}\n {2}\| \{ id: 'C'; 模式: string \};/, '互动载荷为精确判别联合');
  // App 接线：6 事件名 + 发送锁 + 清流 + pull + toast + UI lock + focus
  for (const 事件名 of [
    '人妻公寓:使用静音会议',
    '人妻公寓:取消静音会议筹备',
    '人妻公寓:启动静音会议',
    '人妻公寓:静音会议互动失败',
    "eventEmit(recovery ? '人妻公寓:静音会议互动补偿' : '人妻公寓:静音会议互动', payload)",
    '人妻公寓:结束静音会议',
  ]) {
    assert.match(App源码, new RegExp(转义(事件名)), `App 应保留 ${事件名}`);
  }
  assert.match(App源码, /sending: 发送中,/, 'App 注入发送锁');
  assert.match(App源码, /clearStream: \(\) => \{\n {4}流式段\.value = \[\];\n {2}\},/, 'App 注入清流');
  assert.match(App源码, /pullState: \(\) => \(store as unknown as \{ pull\?: \(\) => void \}\)\.pull\?\.\(\)/, 'App 注入 store pull');
  assert.match(App源码, /toast: 弹提示,/, 'App 注入 toast');
  assert.match(App源码, /lockMeetingUI: \(\) => \{[\s\S]*?当前房间\.value = '管理员室';[\s\S]*?正文幕归属状态\.value = 创建正文幕归属\('管理员室'\);[\s\S]*?垃圾选择开\.value = false;\n {2}\},/, 'App 注入 UI lock 且集合/顺序保持');
  assert.match(App源码, /focusInput: \(\) => \{\n {4}回合输入\.value\?\.聚焦\(\);\n {2}\},/, 'App 注入输入聚焦(经回合输入组件公开接口)');
  assert.match(回合输入源码, /defineExpose\(\{ 聚焦 \}\)/, '回合输入组件公开聚焦接口');
  assert.match(回合输入源码, /输入框\.value\?\.focus\(\)/, '组件内聚焦经本地 textarea DOM ref');
});

test('场景/参与者/筹备/手机派生与全部门槛、800/1200ms 行为完整', () => {
  for (const 段 of [
    'const 空静音会议状态: 静音会议运行状态 = {',
    'const 静音会议场景 = computed<静音会议运行状态>',
    'const 静音会议中 = computed',
    'const 静音会议正式中 = computed',
    'const 静音会议当前拍 = computed',
    'function 是静音会议候选门牌(值: string): 值 is 静音会议候选门牌',
    'function 规范静音会议妻名单(原值: readonly string[])',
    'const 静音会议参与妻 = computed',
    'const 静音会议演出妻 = computed',
    'const 静音会议重点妻名 = computed',
    'const 静音会议阶段短名 = computed',
    'const 静音会议拍数文案 = computed',
    'const 静音会议筹备步骤 = ref<静音会议筹备步骤类型>',
    'const 静音会议候选列表 = computed',
    'const 静音会议筹备可确认 = computed',
    'const 静音会议筹备妻名 = computed',
    'const 静音会议筹备夫名 = computed',
  ]) {
    assert.match(composable源码, new RegExp(转义(段)), `composable 应声明 ${段}`);
  }
  assert.match(composable源码, /if \(!户\) 原因\.push\('尚未入住'\);/, '未入住门槛');
  assert.match(composable源码, /if \(户 && 户\.妻\.当前阶段 < 4\) 原因\.push\(`当前 L\$\{户\.妻\.当前阶段\}，需要 L4`\);/, 'L4 门槛');
  assert.match(composable源码, /未装载遥控跳蛋/, '遥控跳蛋门槛');
  assert.match(composable源码, /静音会议筹备妻\.value\.length >= 2 &&\n {6}静音会议筹备妻\.value\.length <= 3/, '筹备 2–3 人');
  assert.match(composable源码, /const 静音会议议题列表 = \['公共设施维修', '噪音与住户投诉', '物业费及公共账目'\] as const;/, '议题列表');
  assert.match(composable源码, /静音会议筹备timer = setTimeout\([\s\S]*?}, 800\)/, '打开筹备 800ms');
  assert.match(composable源码, /静音会议筹备timer = setTimeout\([\s\S]*?}, 1200\)/, '发送通知 1200ms');
  assert.match(composable源码, /useMeeting\(\);/, 'composable 经 useMeeting 事件进入筹备');
  assert.match(composable源码, /cancelPreparation\(\);/, 'composable 经 cancelPreparation 取消筹备');
  assert.match(composable源码, /const 静音会议手机状态 = computed\(\(\) => 获取静音会议手机状态\(data\.value \?\? null\)\)/, '手机判据走门面');
  assert.match(composable源码, /const 静音会议手机已开放 = computed/, '手机已开放');
  assert.match(composable源码, /const 静音会议手机可打开 = computed/, '手机可打开');
  assert.match(composable源码, /const 静音会议手机标题 = computed/, '手机标题');
  assert.match(composable源码, /'会场微信已开放'/, '手机标题已开放文案');
  assert.match(composable源码, /'会议微信暂不可用'/, '手机标题不可用回退文案');
});

test('A/B/C Pointer 行为：捕获/主指针/2 秒/6 秒/失败 720ms/成功 520ms/三败补偿/AI 重试与载荷完整', () => {
  for (const 段 of [
    'const 静音会议互动id = computed<静音会议互动ID>',
    'const 静音会议互动待操作 = computed',
    'const 静音会议等待AI重试 = computed',
    'const 静音会议长按中 = ref(false)',
    'const 静音会议连点计数 = ref(0)',
    'const 静音会议互动失败次数 = computed',
    'const 静音会议互动补偿可用 = computed',
    'const 静音会议交互幕 = computed',
    'const 静音会议连点目标 = computed',
    'const 静音会议连点点亮妻 = computed',
  ]) {
    assert.match(composable源码, new RegExp(转义(段)), `composable 应声明 ${段}`);
  }
  assert.match(composable源码, /!event\.isPrimary \|\| event\.button !== 0/, '只认主指针左键');
  assert.match(composable源码, /元素\.setPointerCapture\(event\.pointerId\)/, '设置 Pointer capture');
  assert.match(composable源码, /静音会议活动指针 = \{ id: event\.pointerId, 类型, 元素 \};/, '活动指针结构');
  assert.match(composable源码, /function 释放静音会议指针\(\)/, '释放指针');
  assert.match(composable源码, /function 静音会议A按下\(event: PointerEvent\)/, 'A 按下');
  assert.match(composable源码, /function 静音会议A抬起\(event: PointerEvent\)/, 'A 抬起');
  assert.match(composable源码, /function 静音会议B按下\(event: PointerEvent\)[\s\S]*?长按timer = setTimeout\([\s\S]*?}, 2000\);/, 'B 长按 2 秒');
  assert.match(composable源码, /'需要持续按住整整 2 秒；现在可以立即重试。'/, 'B 提前抬起失败文案');
  assert.match(composable源码, /function 静音会议C抬起\(event: PointerEvent\)[\s\S]*?没有在 6 秒内完成连续点击/, 'C 6 秒失败窗口');
  assert.match(composable源码, /静音会议连点计数\.value >= 静音会议连点目标\.value/, '连点达标提交');
  assert.match(composable源码, /静音会议C模式\.value === '同步' \? Math\.max\(6, 静音会议参与妻\.value\.length \* 3\) : 6/, '同步目标 max(6, 人数*3)');
  assert.match(composable源码, /function 静音会议指针取消\(event\?: PointerEvent, 记录失败 = false\)/, '指针取消');
  assert.match(composable源码, /function 静音会议窗口失焦\(\)/, '窗口失焦');
  assert.match(composable源码, /reportInteractionFailure\(\{ id \}\);/, '失败事件载荷');
  assert.match(composable源码, /静音会议结果timer = setTimeout\(\(\) => \{\n {6}静音会议互动结果\.value = undefined;\n {4}\}, 720\);/, '失败 720ms 结果时序');
  assert.match(composable源码, /sending\.value = true;\n {6}clearStream\(\);\n {6}submitInteraction\(静音会议互动载荷\(id\), 补偿\);\n {4}\}, 520\);/, '成功 520ms 后发送锁+清流+事件');
  assert.match(composable源码, /静音会议场景\.value\.交互\.补偿可用 \|\| 静音会议互动失败次数\.value >= 3/, '三败补偿可用');
  assert.match(composable源码, /function 重试静音会议互动续拍\(\)/, 'AI 重试续拍');
  assert.match(composable源码, /submitInteraction\(载荷, false\);/, '重试走非补偿事件');
  assert.match(composable源码, /'交互目标状态缺失，无法重放下一拍。'/, '重试缺失提示');
});

test('组合图状态：版本素材基址、回退序列、图地址与 load/error 行为完整', () => {
  for (const 段 of [
    'const 静音会议画面状态 = computed<静音会议画面状态类型>',
    'const 静音会议显示组合图 = computed',
    'const 静音会议图回退序号 = ref(0)',
    'const 静音会议图已加载 = ref(false)',
    'const 静音会议图状态序列 = computed',
    'const 静音会议当前图地址 = computed',
    'function 静音会议图加载成功(加载地址: string)',
    'function 静音会议图加载失败(失败地址: string)',
  ]) {
    assert.match(composable源码, new RegExp(转义(段)), `composable 应声明 ${段}`);
  }
  assert.match(composable源码, /静音会议当前拍\.value >= 1 &&\n {6}静音会议当前拍\.value <= 12 &&\n {6}\(静音会议参与妻\.value\.length === 2 \|\| 静音会议参与妻\.value\.length === 3\)/, '组合图 1–12 拍且 2–3 人');
  assert.match(composable源码, /import \{ 版本素材基址 \} from '\.\.\/assets';/, 'composable 引入版本素材基址');
  assert.match(composable源码, /获取静音会议素材相对路径/, '主仓相对路径');
  assert.match(composable源码, /获取静音会议回退状态序列/, '回退序列');
  assert.match(composable源码, /`\$\{版本素材基址\}\/\$\{相对路径\}`/, '图地址拼基址');
  assert.match(composable源码, /加载地址 !== 静音会议当前图地址\.value\) return;/, '旧图 load 不得认领新拍');
  assert.match(composable源码, /失败地址 !== 静音会议当前图地址\.value\) return;/, '旧图 error 不得推进新拍');
  assert.match(composable源码, /静音会议图回退序号\.value < 静音会议图状态序列\.value\.length\) 静音会议图回退序号\.value \+= 1/, '当前图 error 推进回退序号');
  assert.match(composable源码, /静音会议图回退序号\.value = 0;\n {6}静音会议图已加载\.value = false;/, '状态切换复位回退');
});

test('散会/自由/收尾状态与 handler、App 六处 listener 调用顺序契约完整', () => {
  for (const 段 of [
    'const 静音会议会后选择 = ref<静音会议候选门牌[]>',
    'const 静音会议继续已选 = ref(false)',
    'const 静音会议待散会选择 = computed',
    'const 静音会议会后选择合法 = computed',
    'const 静音会议会后选择提示 = computed',
    'const 静音会议自由待选择 = computed',
    'const 静音会议收尾待重试 = computed',
    'function 切换静音会议会后妻(',
    'function 继续静音会议会后活动()',
    'function 请求结束静音会议()',
    'function 同步静音会议界面()',
    'function 处理静音会议回合完成前()',
    'function 处理静音会议回合失败前()',
    'function 处理静音会议自由回合失败(将自动重试: boolean)',
    'function 处理静音会议提示()',
    'function 标记静音会议自由行动开始()',
  ]) {
    assert.match(composable源码, new RegExp(转义(段)), `composable 应声明 ${段}`);
  }
  assert.match(composable源码, /静音会议会后选择\.value\.length >= 1 &&\n {6}静音会议会后选择\.value\.length <= 静音会议参与妻\.value\.length/, '散会至少一人');
  assert.match(composable源码, /静音会议当前拍\.value === 12 &&\n {6}!静音会议交互幕\.value/, '第 12 拍散会门');
  assert.match(composable源码, /静音会议自由行动进行中\.value && 静音会议场景\.value\.阶段\.includes\('自由'\) && 新次数 > 旧次数/, '自由循环闩锁 watch');
  assert.match(composable源码, /function 请求结束静音会议\(\) \{[\s\S]*?endMeeting\(\);/, '结束走 endMeeting 事件');
  assert.match(composable源码, /lockMeetingUI\(\);\n {2}\}\n\n {2}\/\*\* 回合完成收口/, '同步界面正式分支委托 lockMeetingUI');
  // App 六处 listener 调用顺序契约
  assert.match(App源码, /eventOn\('人妻公寓:生成开始', \(\) => \{[\s\S]*?if \(静音会议中\.value\) 同步静音会议界面\(\);/, '生成开始仍同步界面');
  assert.match(App源码, /eventOn\('人妻公寓:回合完成', async \(选项\?: 回合完成正文选项\) => \{[\s\S]*?处理静音会议回合完成前\(\);[\s\S]*?await nextTick\(\);[\s\S]*?同步静音会议界面\(\);/, '回合完成在 pull+nextTick 后同步界面');
  assert.match(App源码, /eventOn\('人妻公寓:回合失败', async \(原因: string\) => \{[\s\S]*?处理静音会议回合失败前\(\);[\s\S]*?const 将自动重试 = 取消后自动重试\.value && !!待重试;\n {4}处理静音会议自由回合失败\(将自动重试\);/, '回合失败清现场后按将自动重试复位自由闩锁');
  assert.match(App源码, /eventOn\('人妻公寓:特殊场景状态', \(\) => \{[\s\S]*?nextTick\(同步静音会议界面\);/, '特殊场景状态 pull 后 nextTick 同步');
  assert.match(App源码, /eventOn\('人妻公寓:提示', \(消息: string\) => \{[\s\S]*?处理静音会议提示\(\);/, '提示开头调用处理静音会议提示');
  assert.match(App源码, /标记静音会议自由行动开始\(\);\n {2}\}\n {2}发送中\.value = true;/, '发出在原时点标记自由行动开始');
  assert.match(App源码, /同步静音会议界面\(\);\n\n {2}\/\/ 恢复界面偏好/, '初始化恢复同步界面');
  assert.match(App源码, /if \(静音会议待散会选择\.value\) \{\n {4}eventEmit\('人妻公寓:静音会议散会', \{[\s\S]*?会后妻: \[\.\.\.静音会议会后选择\.value\],/, '散会 payload 仍由 App 读取并发送');
});

test('scope 自清理全部资源；App 不再重复清理；内部 watch flush post 保持', () => {
  assert.match(composable源码, /onMounted\(\(\) => \{\n {4}window\.addEventListener\('blur', 静音会议窗口失焦\);\n {2}\}\);/, 'composable mount 挂 window blur');
  assert.match(composable源码, /onScopeDispose\(\(\) => \{[\s\S]*?clearTimeout\(静音会议筹备timer\);\n {6}清理静音会议互动现场\(\);\n {6}window\.removeEventListener\('blur', 静音会议窗口失焦\);/, 'scope 清筹备 timer/互动现场/blur');
  assert.match(composable源码, /function 清理静音会议互动现场\(保留结果 = false\) \{\n {4}释放静音会议指针\(\);\n {4}清理静音会议连点\(\);\n {4}clearTimeout\(静音会议结果timer\);/, '互动现场清指针/连点/结果 timer');
  assert.match(composable源码, /function 清理静音会议连点\(\) \{[\s\S]*?clearTimeout\(静音会议连点timer\);/, '连点 timer 自清');
  assert.match(composable源码, /watch\([\s\S]*?`\$\{静音会议场景\.value\.id\}\|\$\{静音会议场景\.value\.阶段\}`,[\s\S]*?\{ flush: 'post' \}/, '场景阶段 watch flush post 保持');
  assert.doesNotMatch(App源码, /window\.addEventListener\('blur', 静音会议窗口失焦\)/, 'App 不再挂 blur');
  assert.doesNotMatch(App源码, /window\.removeEventListener\('blur', 静音会议窗口失焦\)/, 'App 不再卸 blur');
});

test('meeting 模板/CSS 与 A7b1/A7a 组件挂载仍在；四组件(A7b3)导入挂载、原标志模板迁入组件、专属 CSS 迁出；A1–A7b2 边界未回退；无中文首字符 tag；不碰 dist', () => {
  const App模板 = 提取模板(App源码);
  // App 真实导入并恰好挂载四个 A7b3 组件
  for (const [别名, 文件名] of [
    ['MuteMeetingStage', '静音会议舞台'],
    ['MuteMeetingInteraction', '静音会议互动'],
    ['MuteMeetingLockNote', '静音会议锁定提示'],
    ['MuteMeetingAfter', '静音会议会后'],
  ]) {
    assert.match(App源码, new RegExp(转义(`import ${别名} from './components/${文件名}.vue';`)), `App 应导入 ${别名}`);
    assert.strictEqual((App模板.match(new RegExp(`<${别名}\\b`, 'g')) ?? []).length, 1, `App 模板应恰好渲染一次 ${别名}`);
  }
  // 原 track/visual/interaction/lock/after 标志模板不再内联 App，而在对应组件
  for (const 标志 of [
    'class="mute-meeting-track"',
    'class="mute-meeting-visual"',
    'class="mute-interaction-panel"',
    'class="mute-meeting-lock-note"',
    'class="mute-after-panel mute-dismiss-panel"',
    'class="mute-after-panel mute-free-panel"',
  ]) {
    assert.doesNotMatch(App模板, new RegExp(转义(标志)), `App 不应再内联 ${标志}`);
  }
  for (const [标志, 组件源码] of [
    ['class="mute-meeting-track"', 舞台源码],
    ['class="mute-meeting-visual"', 舞台源码],
    ['class="mute-interaction-panel"', 互动源码],
    ['class="mute-meeting-lock-note"', 锁定源码],
    ['class="mute-after-panel mute-dismiss-panel"', 会后源码],
    ['class="mute-after-panel mute-free-panel"', 会后源码],
  ]) {
    assert.match(提取模板(组件源码), new RegExp(转义(标志)), `组件应持有 ${标志}`);
  }
  // App 不再持有其专属 CSS；四组件持有
  for (const css of ['.mute-meeting-track {', '.mute-meeting-visual {', '.mute-interaction-panel {', '.mute-after-panel {']) {
    assert.doesNotMatch(App源码, new RegExp(转义(css)), `App 不应再持有 ${css}`);
  }
  for (const css of ['.mute-meeting-track {', '.mute-meeting-visual {']) {
    assert.match(舞台源码, new RegExp(转义(css)), `舞台组件应持有 ${css}`);
  }
  assert.match(互动源码, /\.mute-interaction-panel \{/, '互动组件应持有 .mute-interaction-panel');
  assert.match(会后源码, /\.mute-after-panel \{/, '会后组件应持有 .mute-after-panel');
  // dock 静态 class + 动态 mute-meeting-dock 绑定、dock CSS、筹备组件、录像带组件与 A1–A6 边界仍在
  assert.match(App模板, /<nav v-if="!录像带中" class="dock"[\s\S]*?:class="\{ 'mute-meeting-dock': 静音会议正式中 \}">/, 'dock nav 保留动态 mute-meeting-dock 绑定');
  assert.match(App源码, /\.dock\.mute-meeting-dock \{/, 'App 仍保留 .dock.mute-meeting-dock');
  assert.match(App模板, /<MuteMeetingPreparation/, 'App 模板仍挂载 A7b1 筹备组件');
  assert.match(App源码, /import MuteMeetingPreparation from '\.\/components\/静音会议筹备\.vue';/, 'App 仍导入 A7b1 组件');
  assert.match(App源码, /import VideoTapeStage from '\.\/components\/录像带舞台\.vue';/, 'App 仍导入 A7a 录像带舞台');
  assert.match(App源码, /import VideoTapeControls from '\.\/components\/录像带操作\.vue';/, 'App 仍导入 A7a 录像带操作');
  assert.match(App源码, /import \{ useVideoTape \} from '\.\/composables\/useVideoTape';/, 'App 仍导入 A7a useVideoTape');
  assert.match(App源码, /import \{ useRoomActions \} from '\.\/composables\/useRoomActions';/, 'App 仍导入 A6b useRoomActions');
  assert.match(App源码, /import \{ useUIPrefs \} from '\.\/composables\/useUIPrefs';/, 'App 仍导入 A3 useUIPrefs');
  assert.match(App源码, /import InventoryPopup from '\.\/components\/背包\.vue';/, 'App 仍导入 A5a 背包');
  assert.match(App源码, /import ShopPopup from '\.\/components\/商店\.vue';/, 'App 仍导入 A5a 商店');
  assert.match(App源码, /import MapPopup from '\.\/components\/地图\.vue';/, 'App 仍导入 A6a 地图');
  assert.match(App源码, /import Ic from '\.\/components\/Icon\.vue';/, 'App 仍导入 A1 Icon');
  assert.doesNotMatch(App模板, /<\/?[一-鿿][^>]*>/, 'App 模板不得有中文首字符 tag');
  assert.doesNotMatch(App源码, /from ['"]\.\.\/dist/, 'App 不得 import dist');
  assert.doesNotMatch(composable源码, /dist\//, 'composable 不得引用 dist');
});
