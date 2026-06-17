<!-- From: /AGENTS.md -->
# AGENTS.md — 个人知识库使用指南

## 项目概述

这是一个**个人博客兼知识库**，使用 Next.js 构建，部署在 GitHub Pages。

- **技术栈**：Next.js 16 + React 19 + Tailwind CSS v4 + MDX
- **包管理器**：pnpm
- **构建方式**：静态导出（`output: 'export'`，产物在 `dist/`）
- **内容格式**：Markdown（博客长文）+ 碎片化笔记

## 知识库结构

```
src/
├── app/              # Next.js App Router 页面与路由
├── components/       # React 组件
├── content/
│   ├── blog/         # 技术博客文章（长文、教程、原理分析）
│   └── notes/        # 碎片化知识笔记（短笔记、代码片段、快速参考）
├── lib/              # 内容读取、工具封装
└── utils/            # 通用工具函数
```

### Frontmatter 字段说明

博客文章 (`src/content/blog/*.md`)：
- `title`: 文章标题
- `description`: 文章摘要/描述
- `pubDate`: 发布日期 (ISO 格式)
- `updatedDate`: 更新日期 (可选)
- `category`: 分类（如 Vue、网络、工程化）
- `tags`: 标签数组
- `draft`: 是否为草稿（默认 false）

笔记 (`src/content/notes/*.md`)：
- `title`: 笔记标题
- `description`: 简短描述
- `pubDate`: 记录日期
- `tags`: 标签数组
- `draft`: 是否为草稿

## Agent 检索入口

| 入口 | 地址 | 用途 |
|------|------|------|
| 站点概述 | `/llms.txt` | 了解知识库范围、分类、重要文章列表 |
| 全文聚合 | `/llms-full.txt` | 加载所有文章全文进行深度分析/问答 |
| 知识库索引 | `/kb/` | 按分类和标签浏览的人类可读索引 |
| 博客列表 | `/blog/` | 按时间排序的文章列表 |
| 标签页 | `/tags/[tag]` | 按标签筛选文章 |

## 使用建议

1. **快速了解**：先阅读 `/llms.txt`，掌握知识库的主题范围和核心文章
2. **深度检索**：如需基于全文内容回答问题，加载 `/llms-full.txt`
3. **定向查询**：已知分类或标签时，直接访问 `/kb/` 或 `/tags/[tag]`
4. **增量更新**：新文章遵循相同的 frontmatter 规范放入对应目录即可

## 开发说明

- 路由使用 Next.js App Router，页面位于 `src/app/`
- 内容读取逻辑封装在 `src/lib/content.ts`
- Markdown 渲染使用 `remark` + `remark-html` + `remark-gfm`
- 样式使用 Tailwind CSS v4，主题配置在 `src/app/globals.css`
- 常用命令：
  - `pnpm install` — 安装依赖
  - `pnpm dev` — 启动开发服务器
  - `pnpm build` — 构建静态站点
  - `pnpm lint` — 运行 ESLint
