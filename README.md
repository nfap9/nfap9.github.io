# shen 的博客

使用 Next.js + MDX + Tailwind CSS 构建的个人博客与知识库。

## 技术栈

- [Next.js](https://nextjs.org/) - React 全栈框架，静态导出
- [React](https://react.dev/) - UI 组件库
- [MDX](https://mdxjs.com/) - 支持 JSX 的 Markdown
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [gray-matter](https://github.com/jonschlinkert/gray-matter) - Markdown frontmatter 解析
- [remark](https://remark.js.org/) - Markdown 处理器

## 项目结构

```
├── src/
│   ├── app/              # Next.js App Router 路由与布局
│   ├── components/       # 可复用 React 组件
│   ├── content/          # 内容目录
│   │   ├── blog/         # 博客文章
│   │   └── notes/        # 碎片化笔记
│   ├── lib/              # 工具库（内容读取等）
│   ├── styles/           # 全局样式
│   └── utils/            # 工具函数
├── public/               # 静态资源
├── next.config.ts        # Next.js 配置
├── tailwind.config.ts    # Tailwind CSS 配置
└── postcss.config.mjs    # PostCSS 配置
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 部署

通过 GitHub Actions 自动部署到服务器。构建产物输出到 `dist/` 目录。
