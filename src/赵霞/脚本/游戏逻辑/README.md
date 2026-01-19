# 赵霞游戏 - 游戏逻辑模块

## 文档索引

| 文档 | 说明 |
|------|------|
| [赵霞_问题追踪.md](../../赵霞_问题追踪.md) | **主文档** - 进度追踪、设计决策、开发备忘 |
| [赵霞_状态系统设计.md](../../赵霞_状态系统设计.md) | **技术文档** - 核心机制、代码参考 |

## 核心文件

```
脚本/游戏逻辑/
├── index.ts                     # 主入口，事件监听
├── timeSystem.ts                # 时间系统（单一入口）
├── stateValidation.ts           # 状态验证
├── appearanceSystem.ts          # 外观与境界系统
├── promptInjection.ts           # Prompt注入（核心机制）
├── dreamKeywordDetection.ts     # 梦境关键词检测
├── scene5System.ts              # 场景5特殊逻辑
├── dangerousContentDetection.ts # 危险内容检测
├── boundaryInterruption.ts      # 境界打断系统
├── dualTrackSystem.ts           # 双轨系统
└── dataProtection.ts            # 数据保护
```

## 两种核心注入机制

> 详见 `赵霞_状态系统设计.md` 第12节

| 机制 | 用途 | 位置 |
|------|------|------|
| 输入修改注入 | 场景触发（梦境入口/退出） | 替换最后一条user消息 |
| 状态提示注入 | 影响AI行为（部位开发、D9引导） | 插入system消息 |

## 最近更新

- **D9剧情引导系统**：`promptInjection.ts:288-436`
- **依存度初始化**：`界面/状态栏/App.vue` confirmSelection函数
- **场景5系统**：`scene5System.ts` 12步线性剧情

---

*更新日期: 2026-01-14*
