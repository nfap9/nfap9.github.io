---
title: agent-browser Skill 速查
description: 记录 agent-browser skill 的核心用法和常用命令
category: 工具
tags: [mcp, agent, browser, skill]
pubDate: 2025-05-19
---

## 核心能力

`agent-browser` 是用于浏览器自动化的 MCP 工具，支持导航、点击、填表、截图、数据提取等。

## 常用命令

| 命令 | 用途 |
|------|------|
| `browser_navigate` | 导航到 URL |
| `browser_click` | 点击元素 |
| `browser_type` | 在输入框中输入文本 |
| `browser_fill_form` | 批量填写表单 |
| `browser_snapshot` | 获取页面可访问性快照（比截图更适合 agent 理解） |
| `browser_take_screenshot` | 截图 |
| `browser_evaluate` | 执行 JavaScript |

## 使用建议

- 优先使用 `browser_snapshot` 而非截图来理解页面结构
- 填表时优先用 `browser_fill_form` 批量处理
- 截图用 `browser_take_screenshot` 保存到文件，方便后续查看
