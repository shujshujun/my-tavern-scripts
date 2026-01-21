# 赵霞项目 BUG 登记表

## BUG 列表

### BUG-001: 精神崩坏结局触发异常
- **状态**: 已修复
- **描述**: 除场景5外，其他场景1-4也可能触发精神崩坏结局
- **预期行为**: 场景1-4为可自由开发部位，不应触发精神崩坏结局

#### 根本原因分析
多个地方在检测到 `记忆混乱度 >= 100` 时直接触发精神崩溃结局，但**没有检查当前是否在场景5**。

#### 问题代码位置
1. **badEndingSystem.ts:357** - 直接检查混乱度>=100就触发精神崩溃
   ```typescript
   if (data.梦境数据.记忆混乱度 >= 100) {
     // 没有检查是否在场景5！
     return { triggered: true, type: '精神崩溃', ... };
   }
   ```

2. **boundaryInterruption.ts:971-975** - 境界打断系统在混乱度>=100时触发坏结局
   ```typescript
   if (data.梦境数据.记忆混乱度 >= 100) {
     data.结局数据.当前结局 = '坏结局';  // 没有检查场景5！
     data.世界.循环状态 = '结局判定';
   }
   ```

3. **stateValidation.ts:161** - 状态验证中也有类似检查（可能会触发）

#### 设计说明
场景1-4的混乱度增加是**设计意图**（给玩家紧张感/疑惑感），实际上只有场景5才会判定混乱度触发精神崩溃。

混乱度增加来源（场景1-4也会增加，但不应触发结局）：
- 境界打断惩罚（boundaryInterruption.ts 第948行）
- 错误场景选择惩罚（dreamKeywordDetection.ts 第729行）
- 危险内容检测惩罚（dangerousContentDetection.ts 第216、242行）

#### 修复建议
所有检测 `记忆混乱度 >= 100` 并触发精神崩溃的地方，都需要添加场景5检查：

```typescript
// 精神崩溃只在场景5中触发
const isInScene5 = data.梦境数据.场景5?.已进入 === true && data.世界.游戏阶段 === '梦境';
if (data.梦境数据.记忆混乱度 >= 100 && isInScene5) {
  // 触发精神崩溃
}
```

---

### BUG-002: 梦境后怀疑值豁免失效
- **状态**: 已修复
- **描述**: 数值异常，梦境出来后怀疑值没有豁免
- **预期行为**: 梦境结束后怀疑值应该有豁免机制

#### 根本原因分析
梦境退出豁免期（`上一轮梦境已退出`）只应用于"境界打断检测"，但没有应用于"怀疑度更新"。

#### 问题代码位置
**index.ts:1198** - 怀疑度更新缺少梦境退出豁免期检查
```typescript
// 缺少 isDreamExitMessage 检查！
const shouldSkipSuspicion = data.世界.当前天数 >= 5;
if (data.世界.游戏阶段 === '日常' && data.世界.已进入过梦境 && !shouldSkipSuspicion) {
  const newSuspicion = updateSuspicionLevel(data, userText);
}
```

对比：**promptInjection.ts:3536-3541** 境界打断检测有正确的豁免
```typescript
const isDreamExitMessage = data.世界.上一轮梦境已退出 !== undefined;
if (data.世界.游戏阶段 === '日常' && userInput && !isDreamExitMessage) {
  // 境界打断检测
}
```

#### 设计说明
玩家从梦境醒来后，第一轮应有"过渡期"豁免，避免：
- AI描写"赵霞从梦中惊醒，神情恍惚"等过渡场景时
- 因穿着睡衣（可能被判定为暴露）或妆容异常
- 立即触发怀疑度增加

#### 修复方案
在 **index.ts:1197-1203** 添加梦境退出豁免期检查：
```typescript
// Bug #002 修复：添加梦境退出豁免期，避免退出后立即触发怀疑度增加
const isDreamExitMessage = data.世界.上一轮梦境已退出 !== undefined;
if (isDreamExitMessage) {
  console.info(`[游戏逻辑] 梦境退出豁免期：跳过怀疑度更新（上一轮刚退出梦境）`);
}
const shouldSkipSuspicion = data.世界.当前天数 >= 5 || isDreamExitMessage;
```

---

### BUG-003: 单场景依存值异常增长
- **状态**: 已修复
- **描述**: 有可能在单个场景就把依存值升到最满，从单个场景出来后数值全部满级
- **预期行为**: 单场景内数值增长应有上限控制（每晚上限20%）

#### 根本原因分析
MVU监听器在梦境阶段只检查AI是否修改了"允许的部位"，但**没有限制单次修改幅度**。

#### 问题代码位置
**index.ts:577-603**（修复前）- 梦境阶段只检查部位类型，不检查幅度
```typescript
// 回滚不允许修改的部位
for (const part of allParts) {
  if (oldValue !== newValue && !allowedParts.includes(part)) {
    // 只回滚不允许的部位，对允许的部位完全放行！
    _.set(new_variables, `...`, oldValue);
  }
}
```

#### 设计说明
- 依存度 = 部位进度平均值
- 境界 = 依存度 / 20（0-19→境界1，20-39→境界2，...80+→境界5）
- 设计意图：AI可以修改数值，但每次修改必须在允许幅度内（每晚上限20%）
- 目标：4天梦境把全部数值做到80-100%

#### 修复方案
在 **index.ts:593-623** 添加梦境阶段的幅度限制：
```typescript
// Bug #003 修复：梦境阶段也需要限制每次修改幅度（每晚上限20%）
// 允许修改的部位：限制幅度
if (newValue > oldValue) {
  const maxAllowed = Math.min(100, oldValue + DAILY_DEVELOPMENT_LIMIT);
  if (newValue > maxAllowed) {
    _.set(new_variables, `...`, maxAllowed);
    console.warn(`梦境阶段：${part}进度增幅过大，限制为 ${maxAllowed}`);
  }
} else if (newValue < oldValue) {
  // 不允许降低部位进度（防止AI回滚数值）
  _.set(new_variables, `...`, oldValue);
}
```

---

### BUG-004: 纯爱模式数值不增加
- **状态**: 已修复
- **描述**: 纯爱模式下数值不会增加
- **预期行为**: 纯爱模式应有对应的数值增长机制（每天最大增幅25，最快第4天达到100）

#### 根本原因分析
MVU监听器中**只处理了部位进度**，完全没有对`纯爱好感度`和`纯爱亲密度`的增幅限制逻辑。

1. **index.ts:628-667** - 纯爱模式逻辑只处理部位进度
   ```typescript
   // 纯爱模式：限制部位开发变动幅度，检测错误路线
   const parts = ['嘴巴', '胸部', '下体', '后穴', '精神'] as const;
   // ... 只处理部位进度，没有处理纯爱好感度和纯爱亲密度
   ```

2. **dataProtection.ts:652** - `applyPureLoveAffectionCap` 函数定义了但从未被调用

#### 设计说明
- 纯爱好感度初始值：5，目标最大值：100
- 纯爱亲密度初始值：0，目标最大值：100
- 设计意图：最快第4天才能达到满级
- 每天最大增幅：25（100/4=25）

#### 修复方案
在 **index.ts:657-689** 添加纯爱好感度和纯爱亲密度的增幅限制：
```typescript
// Bug #004 修复：纯爱模式下限制纯爱好感度和纯爱亲密度的增幅
// 设计：最快第4天才能达到100，每天最大增幅25
const PURE_LOVE_DAILY_LIMIT = 25;

// 纯爱好感度增幅限制
const oldAffection = oldData.赵霞状态?.纯爱好感度 ?? 5;
const newAffection = newData.赵霞状态?.纯爱好感度 ?? 5;
if (newAffection > oldAffection) {
  const maxAllowed = Math.min(100, oldAffection + PURE_LOVE_DAILY_LIMIT);
  if (newAffection > maxAllowed) {
    _.set(new_variables, 'stat_data.赵霞状态.纯爱好感度', maxAllowed);
  }
} else if (newAffection < oldAffection) {
  // 不允许降低纯爱好感度
  _.set(new_variables, 'stat_data.赵霞状态.纯爱好感度', oldAffection);
}

// 纯爱亲密度增幅限制（同样逻辑）
```

---

### BUG-005: 打断系统测试异常
- **状态**: 已修复
- **描述**: 打断系统存在多个问题：惩罚值过高、缺少降低机制、重复惩罚、危险内容检测时机不对
- **预期行为**: 打断系统应平衡运行，玩家有容错空间

#### 根本原因分析
1. **亲密行为惩罚过高**：原来+5/+10/+20，单次重度行为就可能叠加到危险区
2. **没有降低机制**：怀疑值只增不减，玩家容错空间太小
3. **重复惩罚**：境界打断和怀疑值更新系统都会检测亲密行为并惩罚
4. **危险内容检测时机错误**：在AI生成后执行，无法真正替换用户输入
5. **缺少豁免检查**：危险内容检测没有梦境退出豁免期

#### 修复内容

**1. 降低亲密行为惩罚值** (appearanceSystem.ts:1436)
```typescript
// 修改前：[0, 5, 10, 20]
// 修改后：[0, 3, 5, 10]
const 亲密增加 = [0, 3, 5, 10][亲密等级];
```

**2. 添加怀疑值降低机制** (appearanceSystem.ts 新增函数)
- 与苏文相处/聊天时可降低怀疑度
- 每次互动降低3点
- 每天最多降低10点
- 新增 schema 字段：`今日怀疑度降低`、`上次降低日期`

**3. 统一检测入口** (promptInjection.ts:3537-3614)
- 将危险内容检测从 index.ts 移到 promptInjection.ts
- 在AI生成前执行，可以替换用户输入
- 添加梦境退出豁免期检查

**4. 避免重复惩罚** (boundaryInterruption.ts:517-525)
- 移除境界打断中的怀疑度惩罚
- 怀疑度增加统一由 updateSuspicionLevel 处理
- 境界打断只负责生成打断/拒绝场景

**5. 严重危险改为概率触发** (dangerousContentDetection.ts:54-98)
- 严重危险不再直接触发坏结局
- 怀疑度<50：0%概率，只修正+怀疑度+30
- 怀疑度50-99：(怀疑度-50)×2%概率（50→0%, 75→50%, 100→100%）
- 怀疑度≥100：100%坏结局
- 坏结局文本复用苏文打断系统的模板（苏文撞破场景）
- 给玩家降低怀疑度和改过自新的机会

---

### BUG-006: 时间跳跃描述导致AI时间混乱
- **状态**: 已修复
- **描述**: 玩家可能输入"几个小时后"、"第二天"、"三个小时后"等时间描述，AI可能会错误地描绘其他时间的内容
- **预期行为**: 检测到时间跳跃描述时，提醒AI根据当前游戏时间描绘，不要跳跃时间

#### 根本原因分析
游戏时间是固定推进的（每轮对话+1小时），但玩家可以在输入中使用时间跳跃描述词。AI可能会误解为真正的时间跳跃，并描绘几小时后或第二天的场景。

#### 问题示例
- 玩家输入："几个小时后，我再去找赵霞"
- AI错误行为：描绘几小时后的场景，与游戏时间不一致
- 正确行为：继续在当前时间描绘，委婉告知时间需要正常推进

#### 修复方案

**1. 添加时间跳跃检测函数** (timeSystem.ts 新增)
```typescript
static detectTimeJumpDescription(userInput: string, currentTime: string): {
  detected: boolean;
  matchedKeyword?: string;
  reminderPrompt?: string;
}
```

关键词库分类：
- 小时后: ['小时后', '几小时后', '一小时后', '两小时后'...]
- 天后: ['天后', '几天后', '第二天', '明天', '后天'...]
- 分钟后: ['分钟后', '半小时后', '一会儿后'...]
- 时间流逝: ['过了很久', '时间流逝', '到了晚上'...]

**2. 集成到promptInjection.ts**
```typescript
// 0.45 时间跳跃描述检测（BUG-006）
if (userInput) {
  const timeJumpResult = TimeSystem.detectTimeJumpDescription(userInput, data.世界.时间);
  if (timeJumpResult.detected && timeJumpResult.reminderPrompt) {
    // 将提醒追加到系统提示中（不替换用户消息，只是提醒AI）
    systemPrompt = (systemPrompt ? systemPrompt + '\n\n' : '') + timeJumpResult.reminderPrompt;
  }
}
```

**3. 提醒内容模板**
```
【系统提醒 - 时间一致性】
玩家输入中包含时间跳跃描述（"${keyword}"），但游戏时间无法跳跃。
当前游戏时间：${currentTime}

请注意：
1. 不要描绘"${keyword}"的场景，游戏时间不会因为玩家描述而跳跃
2. 继续在当前时间的背景下描绘场景
3. 如果玩家想要跳过时间，可以委婉地告知时间的流逝需要通过正常的游戏进程
4. 时间只会在每次对话后自动推进1小时，不能被玩家的描述跳过
```

---

### BUG-007: 时间随机跳动
- **状态**: 已修复
- **描述**: 时间会随机跳动，虽然重新roll可以解决
- **预期行为**: 时间应该稳定推进，不应随机跳动

---

### BUG-008: 时间推进偶尔跳2小时
- **状态**: 已修复
- **描述**: 虽然设计是固定1小时推进，但有时候会突然跳动2小时
- **预期行为**: 每次对话固定推进1小时

---

### BUG-009: 时间大幅跳跃
- **状态**: 已修复
- **描述**: 玩家反馈：刚刚突然跳时间，从下午四点跳到七点（跳了3小时）
- **预期行为**: 时间应该按1小时稳定推进，不应出现大幅跳跃

---

### BUG-010: 新聊天时间卡住不推进
- **状态**: 已修复（二次修正）
- **描述**: 重新开启新聊天后，时间无法推进，一直卡在8点；且第一条消息进入场景5时状态栏显示纯爱模式
- **预期行为**: 新聊天应正常初始化时间系统，时间能够正常推进，场景5入口应正确切换到梦境状态栏

#### 根本原因分析（原始问题）

**问题代码位置：** [index.ts:737-742](src/赵霞/脚本/游戏逻辑/index.ts#L737)

```typescript
// 跳过初始化后的第一条消息
if (eventType === 'MESSAGE_RECEIVED' && isFirstMessageAfterInit) {
  isFirstMessageAfterInit = false;
  console.info(`[游戏逻辑] 跳过初始化后的第一条消息: ${message_id}`);
  return;  // ← 问题：直接返回，跳过了时间推进！
}
```

#### 首次修复的问题

首次修复让第一条消息执行时间推进后 return，但这引入了新问题：
- `promptInjection.ts` 在 `CHAT_COMPLETION_PROMPT_READY` 时设置梦境状态
- 但数据保存是在 `processGameLogic` 的末尾执行
- 第一条消息提前 return，导致 promptInjection 设置的场景5入口状态**没有被保存**
- 结果：状态栏显示纯爱模式而不是梦境模式

#### 二次修复方案

**完全移除第一条消息的特殊处理**，让它走完整流程：

```typescript
// BUG-010 修复（二次修正）：移除第一条消息的特殊处理
if (eventType === 'MESSAGE_RECEIVED' && isFirstMessageAfterInit) {
  isFirstMessageAfterInit = false;
  console.info(`[游戏逻辑] 初始化后的第一条消息: ${message_id}，执行完整处理流程`);
  // 不再 return，继续执行下面的完整流程
}
```

**为什么这样修复是安全的：**
1. 原来 `isFirstMessageAfterInit` 的目的是避免重复处理历史消息
2. 但第一条消息本来就应该被完整处理，不应该跳过
3. 时间推进会在正常位置执行，不会有问题
4. 场景5入口等状态会被正确保存

---

### BUG-011: 苦主视角显示AI思维链原文
- **状态**: 已修复
- **描述**: 某些预设情况下，苦主视角区域会显示AI的完整思维链原文（包含法语、中文混合的思考过程、core_memory标签、writing指令等），而不是正常的苦主心理活动
- **预期行为**: 苦主视角应该只显示苦主（丈夫苏文）的心理活动描写，不应该显示AI的内部思考过程
- **触发条件**: 特定预设配置下出现，重新ROLL可恢复正常
- **截图特征**:
  - 显示 `<think>` 标签内容
  - 显示 `<core_memory>` 标签
  - 显示 `<!-- writing antThinking: ... -->` 注释
  - 混合法语和中文的AI推理过程

#### 根本原因分析

**问题原因：**
1. AI可能在 `<HusbandThought>` 标签内放入思维链内容
2. AI可能直接将思维链写入 `丈夫心理活动` 变量（通过JSON Patch）
3. 原代码没有对提取的内容进行验证和清理

#### 修复方案

**1. 在 `parseHusbandThought` 函数中添加清理和验证逻辑** ([dualTrackSystem.ts](src/赵霞/脚本/游戏逻辑/dualTrackSystem.ts))

- 新增 `cleanThinkingContent()` 函数，移除各种AI思维链标记：
  - `<think>` 标签
  - `<core_memory>` 标签
  - `<!-- ... -->` HTML注释
  - `WAIT:`、`Variable check:` 等内部指令

- 新增 `isValidHusbandThought()` 函数，验证内容是否合法：
  - 拒绝超过500字符的内容
  - 拒绝包含AI内部标记的内容
  - 拒绝中文比例低于30%的内容（可能是外语思维链）

**2. 在MVU监听器中添加变量验证** ([index.ts](src/赵霞/脚本/游戏逻辑/index.ts))

- 检测AI直接写入的 `丈夫心理活动` 变量
- 如果检测到异常内容（思维链特征），回滚到旧值

---

### BUG-012: 场景5入口状态栏错误显示为场景1
- **状态**: 已修复
- **描述**: Day 1 上午9点通过安眠药入口进入场景5，但前端状态栏显示的是场景1的状态栏，而不是场景5
- **预期行为**: 通过安眠药进入场景5时，状态栏应该显示场景5相关信息
- **触发条件**: Day 1, 09:00，使用安眠药关键词进入场景5

#### 根本原因分析

**问题代码位置：** [App.vue:1596-1622](src/赵霞/界面/状态栏/App.vue#L1596)

```typescript
// 原代码：只检查 scene5Data?.已进入
if (scene5Data?.已进入 && currentHour >= 8 && currentHour < 20) {
  return 5;
}
// 如果 已进入 尚未设置，就会走到下面
const day = worldData.value._梦境入口天数 ?? worldData.value.当前天数;
return Math.min(day, 4);  // Day 1 返回 1，导致显示场景1
```

**问题原因：**
1. 状态栏的场景5判断只依赖 `scene5Data?.已进入` 字段
2. 在某些情况下（数据同步延迟、组件渲染时机等），`已进入` 字段可能尚未被设置为 `true`
3. 当 Day 1 上午进入场景5时，`_梦境入口天数 = 1`，导致返回 `Math.min(1, 4) = 1`

#### 修复方案

在 `currentSceneNumber` 计算中添加多重判断条件：

```typescript
// 条件1：明确标记已进入场景5（最准确）
if (scene5Data?.已进入 && currentHour >= 8 && currentHour < 20) {
  return 5;
}

// 条件2：白天进入梦境，隐含为场景5
// 场景1-4入口时间是 22:00（晚上），场景5入口时间是 08:00-19:59（白天）
// 如果当前时间是白天且处于梦境阶段，检查是否有场景5数据结构
if (currentHour >= 8 && currentHour < 20) {
  const entryDay = worldData.value._梦境入口天数;
  if (entryDay !== undefined && scene5Data !== undefined) {
    return 5;  // 有入口天数记录且有场景5数据，说明是场景5
  }
}
```

**修复逻辑说明：**
- 场景1-4都是夜间22:00后进入，白天时间（8:00-19:59）进入的只能是场景5
- 即使 `已进入` 标记尚未同步，只要存在 `scene5Data` 结构就说明脚本已开始处理场景5入口
- 这处理了数据同步延迟导致 `已进入` 尚未设置的边缘情况

---

### BUG-007/008/009 根本原因分析（时间跳跃问题）

#### 深入排查结论

经过对时间系统代码的全面排查，发现**时间推进逻辑本身没有问题**：

**✅ 已确认正常的部分：**
1. `TimeSystem.advance()` 是唯一的时间推进入口（[timeSystem.ts:29-86](src/赵霞/脚本/游戏逻辑/timeSystem.ts#L29)）
2. 时间推进只在 `MESSAGE_RECEIVED` 事件中执行（[index.ts:1047-1068](src/赵霞/脚本/游戏逻辑/index.ts#L1047)）
3. `GENERATION_ENDED` 和 `MESSAGE_SWIPED` 事件会跳过时间推进
4. 消息去重机制使用 `messageKey = message_id:swipeId:eventType`（[index.ts:732](src/赵霞/脚本/游戏逻辑/index.ts#L732)）
5. 数据保护系统将时间字段标记为 `SCRIPT_ONLY`（[dataProtection.ts:41-44](src/赵霞/脚本/游戏逻辑/dataProtection.ts#L41)）

**⚠️ 排除的可能原因：**
1. ~~多处直接修改时间~~ - `normalEndingSystem.ts:295` 和 `promptInjection.ts:4329` 只在触发结局时执行（重置到Day 1, 08:00），不会导致正常游戏中的时间跳跃
2. ~~去重机制失效~~ - 去重逻辑看起来完善，同一消息不会被重复处理
3. ~~场景5退出冲突~~ - 20:00退出逻辑只检测状态，不会多次推进时间

#### 最可能的根本原因

**AI篡改时间后被数据保护系统回滚，但回滚不完整导致不一致**

时间相关字段虽然被标记为 `SCRIPT_ONLY`，但数据保护系统的验证逻辑可能存在漏洞：
- `当前天数`、`当前小时`、`时间` 三个字段需要同时一致
- 如果AI修改了其中一个，回滚时可能只回滚了部分字段
- 导致 `时间` 字符串与 `当前小时` 数值不匹配

**验证方法：**
查看控制台是否有 `[数据保护] 检测到篡改: 世界.当前小时` 或类似日志。

#### 推荐修复方案

1. **在 `validateAndRestoreData` 中添加时间一致性校验**
   - 检查 `当前小时`、`当前天数`、`时间` 三者是否一致
   - 如果不一致，根据 `时间戳` 判断哪个是正确的

2. **在 `TimeSystem.advance()` 后添加一致性验证**
   ```typescript
   // 推进后验证一致性
   const expectedTime = TimeSystem.formatTime(data.世界.当前天数, data.世界.当前小时);
   if (data.世界.时间 !== expectedTime) {
     console.error(`时间不一致！强制修正: ${data.世界.时间} → ${expectedTime}`);
     data.世界.时间 = expectedTime;
   }
   ```

3. **添加时间推进防抖机制**
   - 记录上次推进的时间戳
   - 如果两次推进间隔小于1秒，跳过第二次

---

## 更新记录

| 日期 | 操作 | 说明 |
|------|------|------|
| 2026-01-19 | 创建 | 初始登记5个BUG |
| 2026-01-19 | 修复 | BUG-002: 在index.ts添加梦境退出豁免期检查 |
| 2026-01-19 | 修复 | BUG-003: 在MVU监听器添加梦境阶段幅度限制（每晚上限20%） |
| 2026-01-19 | 修复 | BUG-004: 在MVU监听器添加纯爱好感度/亲密度增幅限制（每天上限25，最快第4天满） |
| 2026-01-19 | 修复 | BUG-005: 打断系统全面修复（降低惩罚、添加降低机制、统一检测、避免重复惩罚） |
| 2026-01-19 | 修复 | BUG-006: 添加时间跳跃描述检测，提醒AI保持时间一致性 |
| 2026-01-19 | 登记 | BUG-007/008/009: 时间系统相关问题（随机跳动、偶尔跳2小时、大幅跳跃） |
| 2026-01-19 | 登记 | BUG-010: 新聊天时间卡住不推进 |
| 2026-01-19 | 修复 | BUG-007/008/009: 添加时间一致性验证、防抖机制、联动回滚 |
| 2026-01-19 | 修复 | BUG-010: 修改"跳过初始化后第一条消息"逻辑，确保第一条消息也推进时间 |
| 2026-01-19 | 登记 | BUG-011: 苦主视角显示AI思维链原文（特定预设下出现，ROLL可恢复） |
| 2026-01-19 | 修复 | BUG-011: 添加思维链内容清理和验证，防止AI内部内容显示在苦主视角 |
| 2026-01-19 | 登记 | BUG-012: 场景5入口状态栏错误显示为场景1 |
| 2026-01-19 | 修复 | BUG-012: 在状态栏场景判断中添加多重条件，白天梦境阶段+存在场景5数据即判断为场景5 |
| 2026-01-20 | 登记 | BUG-013: Gemini模型注入位置不适配，关键信息被放在低注意力区域 |
| 2026-01-20 | 修复 | BUG-013: 添加模型检测，Gemini自动切换到尾部注入，Claude保持头部注入 |
| 2026-01-20 | 登记 | BUG-014: 场景5首条消息状态栏不显示梦境模式 |
| 2026-01-20 | 修复 | BUG-014: 恢复 promptInjection.ts 中场景5的即时数据写入，移除 index.ts 中的重复逻辑 |
| 2026-01-20 | 登记 | BUG-015: 场景5步骤进度 ROLL 时会跳跃 |
| 2026-01-20 | 修复 | BUG-015: 修正 swipe_id 获取逻辑，改用 AI 回复楼层而非用户消息楼层 |
| 2026-01-20 | 二次修复 | BUG-015: swipe_id 方案在 PROMPT_READY 时刻不可靠，改用 rollOperationFlag 标志检测 |
| 2026-01-21 | 三/四次修复 | BUG-015: ROLL 检测统一在步骤推进时执行，添加重试检测防止思维链重试重复推进 |
| 2026-01-21 | 五次修复 | BUG-015: 入口时也记录楼层ID，防止模型重试时重复推进步骤 |
| 2026-01-21 | 六次修复 | BUG-015: 在MVU监听器中保护场景5核心字段，防止AI篡改当前步骤等数据 |

---

### BUG-014: 场景5首条消息状态栏不显示梦境模式
- **状态**: 已修复
- **描述**: 通过安眠药进入场景5时，首条消息的状态栏不显示梦境模式，时间也没有更新。重新 ROLL 后才能正常显示
- **预期行为**: 进入场景5后，状态栏应立即显示梦境模式和正确的时间
- **触发条件**: 任何时候通过安眠药关键词进入场景5

#### 根本原因分析

**问题原因：**
场景5的数据写入代码在 `promptInjection.ts` 中被注释掉了，导致进入逻辑只在 `index.ts` 的 `MESSAGE_RECEIVED` 事件中执行。

但状态栏是在 `CHAT_COMPLETION_PROMPT_READY` 事件后就渲染的，此时 `MESSAGE_RECEIVED` 还没触发，所以数据还没更新。

**对比场景1-4：**
场景1-4的进入逻辑在 `promptInjection.ts` 中有即时写入（4990-5115行），所以首条消息就能正确显示。

#### 修复方案

1. **恢复 `promptInjection.ts` 中的场景5即时数据写入**（4720-4895行）
   - 原本被注释的代码是为了避免"用户查看旧楼层时写入错误楼层"
   - 但实际上消息只能从最新楼层发送，不存在这种场景

2. **移除 `index.ts` 中的重复逻辑**（1005-1087行）
   - 避免场景5进入逻辑执行两次
   - 保留关键词检测的日志输出

#### 修改的文件

- [promptInjection.ts:4720-4895](src/赵霞/脚本/游戏逻辑/promptInjection.ts#L4720) - 恢复场景5即时数据写入
- [index.ts:1005-1018](src/赵霞/脚本/游戏逻辑/index.ts#L1005) - 移除重复的场景5进入逻辑

---

### BUG-015: 场景5步骤进度异常（ROLL跳跃/首次入口显示错误）
- **状态**: 已修复（六次修正）
- **描述**: 场景5步骤进度存在多个问题：
  1. ROLL 消息时步骤进度会跳跃（如从2跳到3）
  2. 首次进入场景5时状态栏显示 1/12 而不是 0/12
  3. 使用带思维链的模型（如Gemini）时步骤会多推进
- **预期行为**:
  - ROLL 操作应该跳过步骤推进
  - 首次进入时步骤应为 0
  - 步骤只在正常对话时推进，不受模型重试影响
- **触发条件**: 在场景5中进行各种操作

#### 根本原因分析（六次修复历程）

**首次/二次修复（swipe_id 方案）**：
尝试使用 `swipe_id` 检测 ROLL，但在 `PROMPT_READY` 时刻无法可靠获取。

**三/四次修复（标志系统 + 重试检测）**：
- 改用 `rollOperationFlag` 标志系统检测 ROLL
- 添加 `checkIsRetryOperation()` 检测模型重试，防止重复推进

**五次修复（入口时记录楼层ID）**：
发现模型重试时，第一次 PROMPT_READY 触发入口初始化（步骤=0），第二次 PROMPT_READY 检测到已在场景5中会错误推进步骤（0→1）。在入口完成后也调用 `recordProcessedMessageId()` 解决。

**六次修复（MVU监听器字段保护）**：
通过分析控制台日志发现**真正根本原因**：**AI 在回复时直接修改了 `当前步骤` 字段**（从0改成1），而之前没有任何代码阻止这种修改。

日志证据：
```
[Prompt注入] 场景5入口初始化完成：当前步骤=0, 完成度=0
[MVU监听] 梦境阶段（场景5）：只允许AI修改精神部位  ← AI写入变量时
schema.ts:272 Reconciling schema with current data state...
...
[Prompt注入诊断] data中当前步骤=1  ← 第二次请求时已被AI改成1
```

#### 六次修复方案

在 `VARIABLE_UPDATE_ENDED` 监听器中添加场景5核心字段保护：

```typescript
// Bug #15 修复（六次修正）：保护场景5核心字段，防止AI篡改
if (isInScene5) {
  const oldScene5 = oldData.梦境数据?.场景5;
  const newScene5 = newData.梦境数据?.场景5;

  // 保护的字段列表（这些只能由脚本修改）
  const protectedFields = ['当前步骤', '完成度', '步骤进度记录', '已完成步骤', '进入次数'];

  for (const field of protectedFields) {
    const oldValue = oldScene5?.[field];
    const newValue = newScene5?.[field];

    // 如果值发生了变化，回滚到旧值
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      _.set(new_variables, `stat_data.梦境数据.场景5.${field}`, oldValue);
      console.warn(`[MVU监听] 场景5字段保护：回滚AI对"${field}"的修改`);
    }
  }
}
```

#### 修改的文件

**六次修正：**
- [index.ts:626-649](src/赵霞/脚本/游戏逻辑/index.ts#L626) - MVU监听器中添加场景5核心字段保护

**五次修正：**
- [promptInjection.ts:4830-4835](src/赵霞/脚本/游戏逻辑/promptInjection.ts#L4830) - 入口时也记录楼层ID

**三/四次修正：**
- [promptInjection.ts:4944-4970](src/赵霞/脚本/游戏逻辑/promptInjection.ts#L4944) - ROLL检测统一在步骤推进时执行
- [promptInjection.ts:3040-3065](src/赵霞/脚本/游戏逻辑/promptInjection.ts#L3040) - 重试检测函数

**二次修正：**
- [promptInjection.ts:3012-3029](src/赵霞/脚本/游戏逻辑/promptInjection.ts#L3012) - rollOperationFlag 标志系统
- [index.ts:815-817](src/赵霞/脚本/游戏逻辑/index.ts#L815) - MESSAGE_SWIPED 事件中设置 ROLL 标志

---

### BUG-013: Gemini模型注入位置不适配
- **状态**: 已修复
- **描述**: Gemini 模型使用时，脚本注入的关键信息（如 `【梦境场景信息】`）被放在提示词头部（第一条 user 消息之前），而 Gemini 的注意力机制更侧重于尾部内容，导致 AI 可能忽略这些关键信息
- **预期行为**: 根据模型类型自动调整注入位置，Gemini 应将关键信息注入到尾部高注意力区域
- **现象**: 玩家发送"安眠药，入梦"进入场景5，但 Gemini 有时会输出场景1的内容而非场景5（ROLL 后可恢复正常）

#### 根本原因分析

**不同模型的注意力机制差异：**
- **Claude**: 对上下文的注意力较为均匀，头部和尾部都能较好理解
- **Gemini**: 注意力更集中在尾部（最近的内容），头部内容容易被忽略

**当前注入逻辑：** [promptInjection.ts:5144-5156](src/赵霞/脚本/游戏逻辑/promptInjection.ts#L5144)

```typescript
// 插入系统提示（在第一条 user 消息之前）
if (systemPrompt) {
  let firstUserIndex = -1;
  for (let i = 0; i < chat.length; i++) {
    if (chat[i].role === 'user') {
      firstUserIndex = i;
      break;
    }
  }
  const insertIndex = firstUserIndex === -1 ? chat.length : firstUserIndex;
  chat.splice(insertIndex, 0, { role: 'system', content: systemPrompt });
}
```

**问题：** 这会将 `systemPrompt` 插入到头部位置，对 Gemini 来说是低注意力区域。

#### 对比分析（.mdc 示例文件）

| 内容 | Claude 位置 | Gemini 位置 | 说明 |
|------|-------------|-------------|------|
| `【梦境场景信息】` | 行 612-619（中后部） | 行 22-30（头部） | Gemini 在低注意力区 |
| 步骤引导 | 行 1250-1284（尾部） | 无对应 | Claude 尾部有额外引导 |

#### 修复方案

**方案 A：单文件智能适配（推荐）**

在 `promptInjection.ts` 中添加模型检测，根据模型类型选择不同的注入策略：

```typescript
// 检测当前模型类型
function detectModelType(): 'claude' | 'gemini' | 'unknown' {
  try {
    // 通过酒馆 API 获取当前模型名称
    const context = SillyTavern.getContext?.();
    const modelName = (
      context?.API ||
      window.oai_settings?.openai_model ||
      ''
    ).toLowerCase();

    if (modelName.includes('gemini')) return 'gemini';
    if (modelName.includes('claude')) return 'claude';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// 修改注入逻辑
if (systemPrompt) {
  const modelType = detectModelType();

  if (modelType === 'gemini') {
    // Gemini：插入到尾部（最后一条消息之后）
    chat.push({ role: 'system', content: systemPrompt });
    console.info('[Prompt注入] Gemini模式：系统提示插入到尾部');
  } else {
    // Claude/其他：保持原逻辑，插入到第一条 user 消息之前
    let firstUserIndex = chat.findIndex(msg => msg.role === 'user');
    const insertIndex = firstUserIndex === -1 ? chat.length : firstUserIndex;
    chat.splice(insertIndex, 0, { role: 'system', content: systemPrompt });
    console.info(`[Prompt注入] Claude模式：系统提示插入到位置 ${insertIndex}`);
  }
}

// 同样处理 prefill
if (prefill) {
  // prefill 当前已经是 push 到尾部，这对 Gemini 有利
  // 但可能需要确认 Gemini 是否支持 assistant prefill
}
```

**方案 B：复制文件分离版本**

如果需要完全分离：
1. 复制 `promptInjection.ts` → `promptInjectionGemini.ts`
2. 修改 Gemini 版本的所有注入位置
3. 在入口处根据模型加载不同版本

#### 需要确认的问题

1. **Claude 当前的插入位置是否最优？**
   - 根据世界书文档："模型更愿意注意更顶部和更底部的提示词"
   - Claude 的 `systemPrompt` 在头部（第一条 user 前），`prefill` 在尾部
   - 头部位置对 Claude 来说是高优先级区域，应该是合适的

2. **是否需要调整 Claude 的策略？**
   - 可以考虑将最重要的信息（如 `【梦境场景信息】`）同时在头部和尾部都放一份（重复强调）
   - 或者使用世界书的深度插入（D0/D1）来增强注意力

3. **Gemini 是否支持 assistant prefill？**
   - 如果不支持，需要将 prefill 转换为其他形式

#### 相关文件

- [promptInjection.ts](src/赵霞/脚本/游戏逻辑/promptInjection.ts) - 核心注入逻辑
- [.cursor/rules/世界书插入.md](.cursor/rules/世界书插入.md) - 插入位置说明
- [.cursor/rules/gemini的酒馆提示词.mdc](.cursor/rules/gemini的酒馆提示词.mdc) - Gemini 示例
- [.cursor/rules/cladue的酒馆提示词.mdc](.cursor/rules/cladue的酒馆提示词.mdc) - Claude 示例
