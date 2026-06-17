---
title: 用 Node.js 从零构建一个 Agent 运行时：基于 aura-agent 的架构拆解
description: 基于真实开源项目 aura-agent，拆解 Agent 的六大核心要素：ReAct 循环、工具系统、记忆系统、MCP 协议、技能注入、流式传输。不讲故事，直接看代码。
pubDate: 2026-06-18
category: 工程化
tags: [nodejs, agent, ai, mcp, react, architecture]
---

> 本文基于开源项目 [aura-agent](https://github.com/nfap9/aura-agent) 的真实代码，逐层拆解一个 Node.js Agent 运行时的实现。所有代码片段均来自项目源码，不做虚构。

---

## 一、Agent 的本质：一个编排循环

Agent 不是魔法，它就是一个**带状态的循环**。

```
接收输入 → 注入上下文 → 调用 LLM → 解析响应 → 执行工具 → 把结果喂回去 → 再次调用 LLM
```

这个循环在 aura-agent 中叫做 `runLoop`，最大迭代 10 次：

```typescript
// packages/core/src/agent/agent.ts
const MAX_ITERATIONS = 10;

private async *runLoop(
  inputMessages: Message[],
  options?: ChatCompletionOptions,
  events?: AgentEvents
): AsyncGenerator<StreamChunk> {
  // 1. 注入记忆上下文
  if (this.memory && inputMessages.length > 0) {
    const memoryContext = await this.memory.getRelevantContext(query);
    // 把记忆塞进第一条用户消息前面
  }

  this.thread.addMessages(inputMessages);
  this.thread.trim(); // 截断超长的上下文

  let continueLoop = true;
  let iteration = 0;

  while (continueLoop && iteration < MAX_ITERATIONS) {
    iteration++;
    const messages = this.thread.getMessages();

    // 2. 匹配技能并注入
    const apiMessages = await this.buildMessagesWithSkills(userQuery, events);

    // 3. 调用 LLM（流式）
    const stream = this.provider.chatStream({
      model: this.model,
      messages: apiMessages,
      tools: this.tools.getToolSchemas(),
    });

    let content = "";
    let hasToolCall = false;

    for await (const chunk of stream) {
      if (chunk.type === "content") {
        content += chunk.delta;
        yield chunk; // 流式吐给外层
      } else if (chunk.type === "tool_call") {
        hasToolCall = true;
        // 收集工具调用参数
      }
    }

    // 4. 把 assistant 的回复加入对话历史
    this.thread.addMessages([assistantMessage]);

    if (!hasToolCall) {
      continueLoop = false; // 没有工具调用，任务结束
    } else {
      // 5. 执行工具，把结果以 tool 角色塞回历史
      for (const toolCall of toolCalls) {
        const result = await this.tools.execute(name, parseArgs);
        this.thread.addMessages([
          { role: "tool", content: result, tool_call_id: toolCall.id }
        ]);
      }
      // 循环继续，LLM 看到工具结果后再次推理
    }
  }
}
```

这就是 ReAct 的核心：**LLM 不直接给答案，而是输出 "我要调用某某工具"，Agent 执行工具后把结果还回去，LLM 基于结果再推理下一步**。一轮不够就再来一轮，直到 LLM 说"不用工具了，这就是答案"。

---

## 二、工具系统：让 LLM 能动手

### 2.1 工具的组成

一个工具 = 定义（告诉 LLM 有什么参数）+ 处理器（实际执行）。

```typescript
// packages/core/src/capabilities/tools/types.ts
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export type ToolHandler = (args: Record<string, any>) => Promise<string> | string;
```

注册时把两者绑定在一起：

```typescript
// packages/core/src/capabilities/tools/registry.ts
export class ToolRegistry implements ToolSource {
  private tools = new Map<string, Tool>();

  register(definition: ToolDefinition, handler: ToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
  }

  getToolSchemas(): ChatCompletionTool[] {
    return Array.from(this.tools.values()).map((t) => ({
      type: "function",
      function: {
        name: t.definition.name,
        description: t.definition.description,
        parameters: t.definition.parameters,
      },
    }));
  }

  async execute(name: string, args: Record<string, any>): Promise<string> {
    const tool = this.tools.get(name);
    return await tool.handler(args);
  }
}
```

`getToolSchemas()` 返回的格式就是 OpenAI 的 `tools` 参数，LLM 收到后就知道自己有哪些工具可用。

### 2.2 内置工具示例：bash

```typescript
// packages/core/src/capabilities/tools/native/bash.ts
export const bashDefinition: ToolDefinition = {
  name: "bash",
  description: "执行 shell 命令...",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "要执行的 shell 命令" },
      timeout: { type: "number", description: "超时时间（毫秒）" },
    },
    required: ["command"],
  },
};

export async function executeBash(args: Record<string, any>): Promise<string> {
  const { command, timeout = 60000 } = args;
  const { stdout, stderr } = await execAsync(command, { timeout, maxBuffer: 1024 * 1024 });
  return stdout || "(命令执行完成，无输出)";
}
```

注册时调用：

```typescript
registry.register(bashDefinition, (args) => executeBash(args));
```

---

## 三、MCP：连接外部工具生态

MCP（Model Context Protocol）是 Anthropic 推出的标准协议，让外部工具服务器和 Agent 之间用统一格式通信。aura-agent 的 MCP 实现支持 stdio 和 HTTP 两种传输方式。

### 3.1 连接 MCP 服务器

```typescript
// packages/core/src/capabilities/tools/mcp.ts
export class MCPClientManager {
  private connections: Map<string, ServerConnection> = new Map();

  async connect(config: MCPConfig): Promise<void> {
    for (const serverConfig of config.servers) {
      await this.connectServer(serverConfig);
    }
  }

  private async connectServer(config: MCPServerConfig): Promise<void> {
    const client = new Client({ name: "agent-mcp-client", version: "1.0.0" }, { capabilities: {} });

    let transport: Transport;
    if (config.transport === "stdio") {
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
      });
    } else {
      transport = new StreamableHTTPClientTransport(new URL(config.url!));
    }

    await client.connect(transport);

    // 获取服务器暴露的工具列表
    const toolsResult = await client.listTools();
    const tools: ToolDefinition[] = toolsResult.tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      parameters: {
        type: "object",
        properties: t.inputSchema.properties ?? {},
        required: t.inputSchema.required ?? [],
      },
    }));

    this.connections.set(config.name, { config, client, transport, tools });
  }
}
```

### 3.2 命名空间隔离

不同 MCP 服务器可能定义同名工具（比如两个服务器都有 `read_file`），所以 aura-agent 给工具名加上服务器前缀：

```typescript
private makeUniqueToolName(serverName: string, toolName: string): string {
  return `${serverName}_${toolName}`; // e.g. "filesystem_read_file"
}
```

LLM 看到的是 `filesystem_read_file`，调用时由 `MCPClientManager` 解析出原始服务器名和工具名，转发给对应的服务器。

### 3.3 执行与结果转换

MCP 工具返回的结果格式多样（text / resource / image），aura-agent 统一转成字符串：

```typescript
private async executeTool(uniqueName: string, args: Record<string, any>): Promise<string> {
  const result = await conn.client.callTool({ name: originalToolName, arguments: args });

  if ("content" in result && Array.isArray(result.content)) {
    const texts = result.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
    if (texts) return texts;

    const images = result.content
      .filter((c: any) => c.type === "image")
      .map((c: any) => `[image data: ${c.mimeType}]`)
      .join("\n");
    if (images) return images;
  }

  return JSON.stringify(result);
}
```

配置一个 MCP 服务器只需要一个 JSON 文件：

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/data"]
    }
  ]
}
```

---

## 四、记忆系统：让 Agent 有长期记忆

没有记忆的 Agent 每次对话都是白板。aura-agent 的记忆系统基于 **TF-IDF + 余弦相似度** 做检索，纯算法实现，不依赖向量数据库。

### 4.1 记忆的数据结构

```typescript
// packages/core/src/capabilities/memory/types.ts
export interface MemoryEntry {
  id: string;
  content: string;
  category: string;      // 分类，如 "fact", "preference"
  importance: number;    // 1-10，重要性评分
  createdAt: string;
  updatedAt: string;
  accessCount: number;   // 被检索次数
  metadata?: Record<string, any>;
}
```

### 4.2 检索：TF-IDF + 余弦相似度

```typescript
// packages/core/src/capabilities/memory/retriever.ts
export function retrieveMemories(
  query: string,
  entries: MemoryEntry[],
  limit: number = 5,
  minScore: number = 0.05
): MemoryResult[] {
  const queryTokens = tokenize(query);        // 分词
  const queryTf = termFrequency(queryTokens);  // 词频

  // 预计算所有文档的 TF
  const docTfs = entries.map((e) => termFrequency(tokenize(e.content)));

  // 计算 IDF（逆文档频率）
  const idf = computeIdf(docTfs);

  // 加权查询向量
  const weightedQuery = applyIdf(queryTf, idf);

  for (let i = 0; i < entries.length; i++) {
    const weightedDoc = applyIdf(docTfs[i]!, idf);
    let score = cosineSimilarity(weightedQuery, weightedDoc);

    // 时间衰减：越老的记忆权重越低（半衰期 30 天）
    score *= timeDecay(entry.createdAt);
    // 重要性加权
    score *= 0.5 + entry.importance / 10;
    // 访问频率加权
    score *= 1 + Math.log1p(entry.accessCount) * 0.1;

    if (score >= minScore) results.push({ entry, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
```

分词策略：英文按单词分，中文按字分。这样实现简单，在中小规模记忆库（几百条）上效果足够好。

### 4.3 自动合并与智能清理

保存记忆时，如果检测到相似度 > 0.8 的已有记忆，直接合并更新而不是新增：

```typescript
async saveMemory(content: string, category = "fact", importance = 5): Promise<MemoryEntry> {
  const similar = retrieveMemories(content, this.entries, 1, 0.8);
  if (similar.length > 0) {
    const existing = similar[0]!.entry;
    existing.content = this.mergeContent(existing.content, content);
    existing.updatedAt = now;
    existing.importance = Math.max(existing.importance, importance);
    existing.accessCount++;
    await this.persist();
    return existing;
  }
  // ... 创建新记忆
}
```

当记忆超过 500 条时，触发清理。评分公式：

```
score = 新鲜度(30%) + 重要性(40%) + 访问频率(30%)
```

```typescript
async cleanup(targetCount?: number): Promise<void> {
  const scored = this.entries.map((entry) => {
    const daysOld = (now - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.exp(-daysOld / 30);       // 指数衰减
    const importanceScore = entry.importance / 10;
    const accessScore = Math.log1p(entry.accessCount) / Math.log1p(100);
    const totalScore = recencyScore * 0.3 + importanceScore * 0.4 + accessScore * 0.3;
    return { entry, score: totalScore };
  });

  scored.sort((a, b) => b.score - a.score);
  this.entries = scored.slice(0, target).map((s) => s.entry);
}
```

存储层可插拔：默认 `InMemoryStorage`，生产环境用 `FileMemoryStorage` 持久化到 JSON 文件。

### 4.4 记忆如何注入对话

Agent 在每次循环开始前，用用户查询去检索记忆，把结果塞进第一条用户消息前面：

```typescript
const memoryContext = await this.memory.getRelevantContext(query);
// 结果格式：
// ## 相关历史记忆
// 1. [fact] 用户喜欢使用 Vue 3 Composition API
// 2. [preference] 项目使用 pnpm 管理依赖
```

这样 LLM 在推理时自然能看到相关背景，无需额外机制。

---

## 五、技能系统：动态注入领域知识

Skill 是从 `SKILL.md` 文件加载的领域知识片段，运行时根据用户查询语义匹配，注入到对话上下文中。

### 5.1 Skill 文件格式

```markdown
---
name: web-search
description: 网络搜索技能，帮助用户查找最新信息
---

## 使用场景

当用户询问实时信息、新闻、股价等需要联网查询的内容时，主动调用搜索工具。

## 搜索策略

1. 提取关键词
2. 使用 search_web 工具
3. 综合结果回答用户
```

### 5.2 匹配机制

基于关键词匹配，简单但有效：

```typescript
// packages/core/src/capabilities/skills/registry.ts
match(query: string): Skill[] {
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/).filter((w) => w.length >= 1 && !isStopWord(w));

  for (const skill of this.skills.values()) {
    if (skill.metadata.hidden === true) continue;

    const haystack = `${skill.name} ${skill.description} ${skill.content}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 1;
    }
    if (score > 0) scored.push({ skill, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, this.maxActiveSkills).map((s) => s.skill); // 默认最多 3 个
}
```

匹配到的 Skill 会作为一条 `system` 消息注入：

```typescript
const skillMsg: Message = {
  role: "system",
  content: `[Skills]\n## web-search\n网络搜索技能...\n\n## 使用场景\n...`,
};
```

放在已有 system prompt 之后，这样 LLM 既能看到全局指令，也能看到当前场景下的特定技能指导。

---

## 六、流式传输：实时响应

### 6.1 LLM 层：流式调用

```typescript
// packages/core/src/llm/openai.ts
async *chatStream(params: { ... }): AsyncGenerator<StreamChunk> {
  const requestOptions = {
    model: params.model,
    messages: params.messages,
    tools: params.tools,
    tool_choice: params.options?.tool_choice ?? "auto",
    stream: true, // 关键
  };

  const stream = await this.client.chat.completions.create(requestOptions);

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      yield { type: "content", delta: delta.content };
    }
    if (delta?.reasoning_content) {
      yield { type: "reasoning", delta: delta.reasoning_content };
    }
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        yield {
          type: "tool_call",
          delta: "",
          toolCall: { index: tc.index ?? 0, id: tc.id, name: tc.function?.name, arguments: tc.function?.arguments },
        };
      }
    }
  }
}
```

### 6.2 Agent 层：逐块转发

Agent 不缓存完整内容，而是把流式块逐块 yield 出去：

```typescript
for await (const chunk of stream) {
  if (chunk.type === "content") {
    content += chunk.delta;
    events?.onContentChunk?.(chunk.delta); // 触发外部事件
    yield chunk; // 继续流给更外层
  } else if (chunk.type === "tool_call") {
    hasToolCall = true;
    // 累加工具调用参数（流式拼接）
    yield chunk;
  }
}
```

### 6.3 CLI 层：实时展示

```typescript
// apps/cli/src/interfaces/cli/index.ts
for await (const chunk of chat.chatStream(userInput, preset, events)) {
  if (chunk.type === "reasoning") {
    io.write(`${C.gray}  💭 `);  // 灰色思考前缀
    io.write(chunk.delta);
  } else if (chunk.type === "content") {
    io.write(`${C.brightCyan}● AI:${C.reset} `);
    io.write(chunk.delta); // 逐字输出
  } else if (chunk.type === "tool_call") {
    io.output(`${C.gray}  🔧 准备调用工具...${C.reset}`);
  }
}
```

三层流式：`OpenAI SDK` → `Provider` → `Agent` → `CLI`，每一层都是 `AsyncGenerator`，没有中间缓存，用户感受到的是逐字输出。

---

## 七、Thread：对话历史与上下文截断

`Thread` 只负责一件事：管理消息列表和 Token 估算。

```typescript
// packages/core/src/agent/thread.ts
export class Thread {
  private messages: Message[] = [];
  private maxContextTokens: number;

  addSystemPrompt(content: string): void { ... }
  addMessages(messages: Message[]): void { ... }
  getMessages(): Message[] { ... }
  trim(): void { ... } // 截断超长上下文
}
```

Token 估算采用混合策略：有精确 tokenizer 就用，没有则按字符数估算（中文字符算 1 token，其他字符算 0.25 token）。

截断策略：保留 system prompt，从最早的消息开始删，但至少保留最近 2 条。这样避免上下文爆炸导致 API 费用飙升。

```typescript
trim(): void {
  let totalTokens = 0;
  for (const msg of this.messages) {
    totalTokens += this.estimateMessageTokens(msg);
  }
  if (totalTokens <= this.maxContextTokens) return;

  const startIndex = this.messages[0]?.role === "system" ? 1 : 0;
  const minKeepCount = 2;

  while (totalTokens > this.maxContextTokens && this.messages.length - startIndex > minKeepCount) {
    const removed = this.messages[startIndex]!;
    totalTokens -= this.estimateMessageTokens(removed);
    this.messages.splice(startIndex, 1); // 从头部删除
  }
}
```

---

## 八、架构总览

```
CLI 交互层
  └─ chatStream() → 消费 StreamChunk，实时渲染

Agent 编排层
  ├─ runLoop() → ReAct 循环，最多 10 轮
  ├─ buildMessagesWithSkills() → 动态注入技能
  ├─ Thread → 消息历史 + Token 截断
  └─ MemorySource → 检索相关记忆注入上下文

能力层
  ├─ ToolRegistry → 本地工具注册与执行
  ├─ MCPClientManager → 外部 MCP 服务器连接
  ├─ MemoryManager → TF-IDF 检索 + 自动合并/清理
  └─ SkillRegistry → 关键词匹配 + 动态注入

模型层
  └─ Provider → OpenAI / Anthropic / Gemini 统一抽象
```

---

## 九、关键设计决策

| 决策 | 理由 |
|------|------|
| TF-IDF 而非向量数据库 | 无需外部依赖，几百条记忆上效果足够，代码自包含 |
| 纯 AsyncGenerator 流式 | 无中间缓存，内存友好，三层直通 |
| 工具名加服务器前缀 | 避免 MCP 工具命名冲突，逻辑清晰 |
| 记忆合并阈值 0.8 | 平衡去重与保留细节，避免记忆膨胀 |
| Skill 关键词匹配 | 实现简单，运行时零依赖，效果在多数场景够用 |
| Thread 头部截断 | 保留 system + 最近消息，丢失的是 oldest 而非 newest |
| 最大 10 轮迭代 | 防止无限循环，同时覆盖绝大多数多步任务 |

---

## 十、如何运行

```bash
git clone https://github.com/nfap9/aura-agent.git
cd aura-agent
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API_KEY 和 BASE_URL

npm run dev:cli
```

输入问题，看 Agent 如何一步步思考、调用工具、返回结果。

---

> 本文所有代码均来自 [aura-agent](https://github.com/nfap9/aura-agent) 仓库，可直接对照阅读。Agent 的实现不需要框架，理解循环、工具、记忆、流式这几个核心概念后，用几十行代码就能搭出一个最小可用版本。