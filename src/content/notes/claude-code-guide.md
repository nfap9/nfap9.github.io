---
title: Claude Code 实战笔记
description: Claude Code 接入国产模型、工程化配置与高效使用指南
category: 工程化
tags: [claude-code, ai-coding, 工具, ccswitch, 国产模型]
pubDate: 2026-06-17
updatedDate: 2026-06-18
---

> 把 Claude Code 当 IDE 用，而不是当聊天工具。

---

## 接入国产模型

Anthropic Claude API 费用较高，生产环境推荐接入国产模型。编码能力与工程化效果已达到可用水平，成本却低一个数量级。

### 模型推荐排序（2026-06）

| 排名 | 模型 | 特点 | API 端点 |
|------|------|------|----------|
| 1 | **GLM-5.2** (智谱) | 编码能力最强，推理深度提升，适合大型工程 | `https://open.bigmodel.cn/api/paas/v4/` |
| 2 | **Kimi K2.7** (月之暗面) | 长文本+推理增强，代码理解能力大幅提升 | `https://api.moonshot.cn/v1` |
| 3 | **DeepSeek V4 Pro** | 数学/逻辑极强，性价比依然最高 | `https://api.deepseek.com/v1` |
| 4 | **MiniMax M3** | 多模态+工具调用稳定，适合复杂 Agent 场景 | `https://api.minimax.chat/v1` |

其他备选：Qwen3-Max、Baichuan5、Step-2。建议每个模型都重试 5 分钟自己的主力项目，看看哪个在自己代码库上表现最好。

### ccswitch 安装与配置

推荐用 `ccswitch` 管理多个模型配置，一键切换。

```bash
# 安装
npm install -g claude-settings-switch

# 添加 GLM 配置
ccs add glm https://open.bigmodel.cn/api/paas/v4/ <glm-api-key>

# 添加 Kimi 配置
ccs add kimi https://api.moonshot.cn/v1 <kimi-api-key>

# 添加 DeepSeek 配置
ccs add ds https://api.deepseek.com/v1 <deepseek-api-key>

# 查看已有配置
ccs list

# 切换到 GLM
ccs sw glm

# 查看当前使用的配置
ccs current
```

配置文件存储在 `~/.ccswitcher/configs.json`，Claude Code 配置在 `~/.claude/settings.json`。

### 手动配置（不用 ccswitch）

直接修改 `~/.claude/settings.json`：

```json
{
  "provider": "openai",
  "model": "glm-4",
  "apiKey": "<glm-api-key>",
  "apiUrl": "https://open.bigmodel.cn/api/paas/v4/"
}
```

各家提供商的 OpenAI 兼容格式略有不同，具体参考对方文档。一般只需改 `apiUrl` 和 `apiKey`，`model` 填对应模型名即可。

---

## 目录结构

Claude Code 会自动读取项目目录下的特定文件，作为项目级指令和自定义命令。

```
项目根目录/
├── .claude/
│   ├── CLAUDE.md          # 项目级系统指令，每次对话自动带入上下文
│   └── commands/          # 自定义命令，每个 .md 文件就是一个命令
│       ├── review.md      # 代码审查
│       ├── refactor.md    # 重构提示
│       └── test.md        # 生成测试
├── AGENTS.md               # 项目概述、架构说明
└── ...
```

### 文件作用

| 文件 | 作用 | 生效范围 |
|------|------|---------|
| `~/.claude/CLAUDE.md` | 全局系统指令 | 所有项目 |
| `.claude/CLAUDE.md` | 项目级系统指令 | 当前项目 |
| `.claude/commands/*.md` | 自定义命令 | 当前项目 |
| `CLAUDE.md` (根目录) | 项目级指令 | 当前项目 |

项目级 `CLAUDE.md` 会覆盖全局的内容。建议每个代码库都放一个 `.claude/CLAUDE.md`。

### AGENTS.md 链接到 CLAUDE.md

如果你已有 `AGENTS.md` 写了项目概述，不需要重复写一份。在 `CLAUDE.md` 中直接引用即可：

```markdown
# 项目指令

参见项目概述: [AGENTS.md](../AGENTS.md)

## 编码规约

- 使用 TypeScript，严格模式
- 不允许使用 `any`
- 所有 API 调用必须有类型定义
```

Claude Code 会自动跟踪相对路径并读取文件。也可以用符号链接：

```bash
ln -s AGENTS.md .claude/AGENTS.md
```

然后在 `CLAUDE.md` 中引用 `./AGENTS.md`。

### 自定义命令示例

创建 `.claude/commands/review.md`：

```markdown
# 代码审查

对当前文件进行代码审查，重点关注：
1. 类型安全性
2. 错误处理
3. 性能问题
4. 可读性

输出格式：每个问题一行，带具体代码位置。
```

使用时输入 `/review` 即可触发。命令名就是文件名（不含 `.md`）。

---

## 常用指令

### 内置命令

| 指令 | 作用 |
|------|------|
| `/clear` | 清空当前对话上下文，不影响文件系统状态 |
| `/compact` | 压缩对话历史，节省 token |
| `/cost` | 查看当前会话的费用 |
| `/exit` | 退出 Claude Code |
| `/help` | 查看命令帮助 |
| `/models` | 查看当前可用模型 |
| `/terminal` | 打开终端模式（只返回命令，不解释） |

### 文件操作

| 指令 | 作用 |
|------|------|
| `find` | 搜索文件，支持正则 |
| `read` | 读取文件内容，支持行范围 |
| `edit` | 精确编辑文件，必须指定行号 |
| `write` | 全重写文件 |
| `grep` | 文件内容搜索 |
| `ls` | 列出目录 |

### 执行命令

| 指令 | 作用 |
|------|------|
| `bash` | 执行 shell 命令，需要确认 |
| `cat` | 查看文件内容 |
| `git` | Git 操作，需要确认 |
| `npm` / `pnpm` / `yarn` | 包管理操作 |

Claude Code 执行可能改变状态的命令（如 `git commit`、`npm install`）时会弹出确认提示，输入 `y` 确认。

### 实用模式

**仅读模式**

不想让 Claude 修改文件时：

```
只读查看这个文件的结构，不要改。
```

或者用带引号的问句，不包含修改指令。

**任务式对话**

对于复杂任务，先让 Claude 列出计划，确认后逐步执行：

```
实现用户登录功能，包含：1. JWT token 管理 2. 登录状态缓存 3. 登出逻辑。
请先列出实现步骤，我确认后你再开始写代码。
```

**结果限制**

限制输出长度，避免滚屏：

```
给出最重要的 3 个修改建议，每条不超过 50 字。
```

---

## 工程化配置

### 全局 CLAUDE.md

`~/.claude/CLAUDE.md` 里放通用编码规范：

```markdown
# 全局编码规范

## 通用原则

- 使用 TypeScript，严格模式
- 禁止使用 `any`
- 所有函数必须有返回类型
- 所有 API 调用必须有错误处理
- 优先使用显式返回而非隐式转换

## 文件操作

- 修改文件前先读取完整内容
- 使用精确的行号编辑，避免全重写
- 不要删除未使用的 import，除非确认无用
```

### 项目级 CLAUDE.md

`.claude/CLAUDE.md` 里放项目特定规范：

```markdown
# 项目指令

参见项目概述: [AGENTS.md](../AGENTS.md)

## 技术栈

- Next.js 15 + App Router
- Prisma ORM + PostgreSQL
- Tailwind CSS
- pnpm monorepo

## 架构约定

- API 放在 `apps/api/src`
- 组件放在 `apps/web/components`
- 工具函数放在 `packages/shared`
- 不跨应用直接引用内部路径

## 提交规范

- 使用 Conventional Commits
- 测试通过后才提交
```

### 自定义命令集

常用的自定义命令放在 `.claude/commands/`：

**review.md** —— 代码审查
```markdown
# 代码审查

对当前文件进行审查，重点：
1. 类型安全
2. 错误处理
3. 性能
4. 可读性

每个问题一行，带具体位置。
```

**refactor.md** —— 重构提示
```markdown
# 重构建议

分析当前代码，给出重构建议。
不要直接修改，只给出建议列表。
```

**test.md** —— 生成测试
```markdown
# 生成测试

为当前文件生成单元测试，覆盖主要路径。
使用 vitest，测试文件放在同目录的 __tests__ 下。
```

---

## 效率技巧

### 减少 Token 消耗

1. **使用 `/compact`** —— 对话变长后压缩历史，保留文件状态但清空对话记录
2. **小步进行** —— 每次只给一个具体任务，而非整个需求文档
3. **限制范围** —— 指定具体文件或目录，避免让 Claude 扫描整个代码库
4. **使用自定义命令** —— 封装常用模式，减少每次重复解释

### 多模型切换策略

**开发阶段**：用国产模型做大部分工作，成本极低，效率很高。

**复杂逻辑**：遇到国产模型反复出错的复杂算法/架构问题，切换到 Claude 或 GPT-4 处理。

**审查阶段**：重要代码审查用原版 Claude，确保没有潜在问题。

### 快捷键

| 快捷键 | 作用 |
|--------|------|
| Tab | 补全建议 |
| Ctrl+C | 取消当前操作 |
| Ctrl+D | 退出（等同 `/exit`） |
| ↑ / ↓ | 浏览历史记录 |
| Ctrl+R | 搜索历史记录 |

---

## 常见问题

### Claude Code 启动失败

```bash
# 检查 Node 版本
node -v  # 需要 18+

# 重新登录
claude auth login

# 清理配置
rm -rf ~/.claude
```

### 国产模型返回格式不对

部分国产模型的 OpenAI 兼容层不完整，可能出现：
- 不支持 function calling → 文件操作可能出问题
- 不支持流式输出 → 响应变慢
- 不支持某些系统提示 → 行为与原版不一致

解决方案：支持较完整的模型（GLM-5.2 / Kimi K2.7 / DeepSeek V4 Pro），开发环境可以尝试更多选择。

### 网络不稳定

国产模型 API 有时会出现超时或限流：
- 配置重试逻辑（大部分 ccswitch 已内置）
- 开发环境可以用本地模型（Ollama 等）
- 生产环境选择有 SLA 保障的提供商

### 文件编辑不精确

Claude Code 的编辑是基于行号的精确编辑，如果文件太大或结构复杂，可能会出现偏移。建议：
- 先让 Claude 列出要修改的行号，确认后再执行
- 对于大文件，先拆分成小任务
- 修改后用 `git diff` 检查结果
