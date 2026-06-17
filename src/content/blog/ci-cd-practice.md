---
title: 从手动到自动化：前端项目 Commit 规范与 CI/CD 发布实践
description: 面向前端团队，从零搭建代码提交规范校验与自动化发布流水线，覆盖 Husky、Conventional Commits、语义化版本管理与 GitHub Actions 全链路
category: 工程化
tags: [cicd, git, commit, github-actions, 工程化]
pubDate: 2025-03-28
---

> 本文面向前端团队，从零搭建一套完整的代码提交规范校验与自动化发布流水线。适合 Monorepo 和单仓库项目，覆盖 Husky、Conventional Commits、语义化版本管理与 GitHub Actions 全链路。

---

## 前言：为什么要规范化发布流程

在团队规模扩大后，代码提交和版本发布往往会变成一场"灾难"：

- **提交信息随意** —— `fix bug`、`update`、`111` 这样的提交历史让 `git log` 几乎无法阅读
- **CHANGELOG 手写** —— 每次发版都要人工整理改了什么，既耗时又容易遗漏
- **版本号混乱** —— 有人用日期版本，有人随便升 major，依赖关系一团糟
- **发布全靠手工** —— 本地 build、手动改版本、打 tag、传 npm，一步出错就要重来

这套流程的核心目标是：**让开发者只关注代码，把重复且易出错的机械操作交给机器**。

我们将构建一条从代码提交到 npm 发布的完整自动化链路：

```
代码提交 → 规范校验 → CI 测试 → 版本选择 → CHANGELOG 生成 → Git 标签 → npm 发布 → GitHub Release
```

---

## 一、Commit Message 规范与校验

### 1.1 为什么选择 Conventional Commits

[Conventional Commits](https://www.conventionalcommits.org/) 是目前业界广泛采用的提交规范。它不仅能让提交历史清晰可读，更重要的是**可以被工具解析**，自动生成 CHANGELOG 和确定版本号。

一条规范的提交信息长这样：

```
feat(compiler): add template optimization for v-if
```

格式分解：`type(scope): subject`

| 字段 | 说明 | 示例 |
|------|------|------|
| `type` | 提交类型（必填） | feat, fix, docs... |
| `scope` | 影响范围（可选） | compiler, api, docs |
| `subject` | 简短描述（必填） | add template optimization |

### 1.2 完整的类型定义

不同团队对类型的划分略有差异，建议从以下 13 种类型中选择，避免过度设计：

| 类型 | 含义 | 是否生成 CHANGELOG | 版本号变化 |
|------|------|:------------------:|-----------|
| `feat` | 新功能 | ✅ 是 | minor +1 |
| `fix` | 修复 Bug | ✅ 是 | patch +1 |
| `perf` | 性能优化 | ✅ 是 | patch +1 |
| `refactor` | 重构（不影响功能） | ❌ 否 | — |
| `docs` | 文档变更 | ❌ 否 | — |
| `style` | 代码格式（空格、分号等） | ❌ 否 | — |
| `test` | 补充或修改测试 | ❌ 否 | — |
| `chore` | 构建工具、依赖更新 | ❌ 否 | — |
| `ci` | CI/CD 配置变更 | ❌ 否 | — |
| `build` | 构建脚本变更 | ❌ 否 | — |
| `dx` | 开发者体验改进 | ❌ 否 | — |
| `types` | 类型定义变更 | ❌ 否 | — |
| `wip` | 工作中（临时提交） | ❌ 否 | — |

> 💡 **建议**：团队刚开始推行时，可以先只要求 `feat` 和 `fix` 出现在 CHANGELOG 中，降低上手门槛。

### 1.3 用 Husky 拦截不规范提交

光有规范还不够，必须通过工具强制执行。[Husky](https://typicode.github.io/husky/) 是 Git hooks 的管理工具，可以在提交前自动校验。

#### 安装与配置

```bash
# 安装 husky（v9 语法）
npm install -D husky
npx husky init

# 添加 commit-msg hook
echo 'node scripts/verify-commit.js' > .husky/commit-msg
```

> ⚠️ **注意版本差异**：Husky v9+ 的初始化语法发生了变化。如果你使用的是 v8，命令是 `npx husky install && npx husky add .husky/commit-msg 'node scripts/verify-commit.js'`。建议直接升级到 v9，配置更简洁。

#### 校验脚本实现

创建 `scripts/verify-commit.js`：

```javascript
const fs = require('fs')
const path = require('path')

// 读取 Git 临时文件中的提交信息
const msgPath = path.resolve('.git/COMMIT_EDITMSG')
const msg = fs.readFileSync(msgPath, 'utf-8').trim()

// 匹配规则：可选 revert: 前缀 + type(可选scope) + : + 1-50字符描述
const commitRE = /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.error('\n❌ Invalid commit message format.\n')
  console.error('Expected format: type(scope): subject')
  console.error('Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, types, wip')
  console.error('\nExamples:')
  console.error('  feat(compiler): add template optimization')
  console.error('  fix(v-model): handle blur event correctly')
  console.error('  docs: update installation guide\n')
  process.exit(1)
}
```

关键设计说明：

- **读取 `.git/COMMIT_EDITMSG`** —— Git 在提交时会将消息写入这个临时文件，hook 从中读取
- **支持 `revert:` 前缀** —— 回滚操作需要特殊处理，避免误判为不规范
- **限制 subject 长度 50 字符** —— 保证 `git log --oneline` 的可读性
- **失败时输出帮助信息** —— 不要只抛错误，告诉开发者正确的格式是什么

---

## 二、自动化版本管理与发布

### 2.1 语义化版本（SemVer）策略

版本号格式为 `MAJOR.MINOR.PATCH`，增量规则如下：

| 场景 | 版本变化 | 示例 | 触发方式 |
|------|---------|------|---------|
| 修复 Bug | patch +1 | `1.2.0` → `1.2.1` | `fix:` 提交 |
| 新增功能 | minor +1 | `1.2.0` → `1.3.0` | `feat:` 提交 |
| 破坏性变更 | major +1 | `1.2.0` → `2.0.0` | `BREAKING CHANGE` 声明 |
| 手动指定 | 自定义 | 任意版本 | 交互式选择 |

**如何声明破坏性变更**（在提交信息 footer 中）：

```
fix(api): remove deprecated /old/endpoint

BREAKING CHANGE: The /old/endpoint has been removed.
Please migrate to /v2/endpoint before upgrading.
```

### 2.2 交互式发布脚本

下面是一个完整的 `release.js` 实现，包含版本选择、CHANGELOG 生成和 Git 操作：

```javascript
// scripts/release.js
const { prompt } = require('enquirer')
const semver = require('semver')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

async function main() {
  // 读取当前版本
  const pkgPath = path.resolve('package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const currentVersion = pkg.version

  console.log(`Current version: ${currentVersion}\n`)

  // 交互式选择版本类型
  const versionIncrements = ['patch', 'minor', 'major']
  const { release } = await prompt({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements.map(i => {
      const nextVer = semver.inc(currentVersion, i)
      return { name: `${i} (${nextVer})`, value: i }
    })
  })

  // 提取版本类型（从选择中解析）
  const releaseType = release.match(/^(\w+)/)[1]
  const targetVersion = semver.inc(currentVersion, releaseType)

  // 确认发布
  const { confirm } = await prompt({
    type: 'confirm',
    name: 'confirm',
    message: `Releasing v${targetVersion}. Confirm?`,
    initial: true
  })

  if (!confirm) {
    console.log('Cancelled.')
    process.exit(0)
  }

  // ========== 发布流程 ==========

  // 1. 更新版本号
  updatePackageVersion(targetVersion)
  console.log(`✅ Version updated to ${targetVersion}`)

  // 2. 生成 CHANGELOG
  execSync('pnpm run changelog', { stdio: 'inherit' })
  console.log('✅ CHANGELOG generated')

  // 3. 提交版本变更
  execSync(
    `git add -A && git commit -m "release: v${targetVersion}"`,
    { stdio: 'inherit' }
  )
  console.log('✅ Version commit created')

  // 4. 打 Git 标签
  execSync(`git tag v${targetVersion}`)
  console.log(`✅ Tag v${targetVersion} created`)

  // 5. 推送代码和标签（触发 CI/CD）
  console.log('🚀 Pushing to remote...')
  execSync('git push && git push --tags', { stdio: 'inherit' })

  console.log(`\n🎉 Release v${targetVersion} is on its way!`)
}

/**
 * 更新 package.json 版本号
 * 如果是 Monorepo，需要同步更新所有子包的版本
 */
function updatePackageVersion(version) {
  // 更新根 package.json
  const rootPkgPath = path.resolve('package.json')
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'))
  rootPkg.version = version
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n')

  // Monorepo 场景：同步更新 packages/* 下的所有子包
  const packagesDir = path.resolve('packages')
  if (fs.existsSync(packagesDir)) {
    const packages = fs.readdirSync(packagesDir)
    for (const dir of packages) {
      const pkgPath = path.join(packagesDir, dir, 'package.json')
      if (!fs.existsSync(pkgPath)) continue

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      pkg.version = version

      // 同时更新子包之间的相互引用
      updateInternalDeps(pkg, version)

      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    }
  }
}

/**
 * 更新子包之间的内部依赖版本
 * 例如 packages/a 依赖 packages/b，需要同步版本号
 */
function updateInternalDeps(pkg, version) {
  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies']
  for (const depType of depTypes) {
    const deps = pkg[depType]
    if (!deps) continue

    // 假设内部包都以 @scope/ 开头
    for (const depName of Object.keys(deps)) {
      if (deps[depName].startsWith('workspace:') || deps[depName].startsWith('^0.0.0')) {
        deps[depName] = '^' + version
      }
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
```

### 2.3 package.json 脚本配置

```json
{
  "scripts": {
    "release": "node scripts/release.js",
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "conventional-changelog-cli": "^4.0.0",
    "enquirer": "^2.4.0",
    "semver": "^7.6.0"
  }
}
```

---

## 三、GitHub Actions 自动化流水线

### 3.1 CI 工作流：持续集成

每次 push 或 PR 时自动运行测试，确保代码质量。

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ['**']      # 所有分支的 push
  pull_request:
    branches: [main]      # 针对 main 分支的 PR

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true    # 同一分支的新提交取消旧任务

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'    # 从文件读取版本，统一管理
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile    # 锁定依赖版本，保证一致性

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

**关键设计点**：

- **`--frozen-lockfile`** —— CI 环境必须锁定依赖版本，避免锁文件不一致导致的构建问题
- **`concurrency` 配置** —— 快速迭代时避免队列堆积，节省 CI 分钟数
- **`.node-version` 文件** —— 将 Node 版本纳入版本控制，团队开发环境保持一致

### 3.2 Release 工作流：自动发布

当发布脚本推送 tag 后，自动执行构建、发布到 npm、创建 GitHub Release。

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'     # 只匹配 v 开头的标签，如 v1.2.0

permissions:
  contents: write    # 创建 GitHub Release 需要写入权限

jobs:
  # 第一步：运行完整测试，确保发布质量
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test

  # 第二步：发布到 npm 并创建 GitHub Release
  publish:
    needs: [test]              # 测试通过后才执行
    runs-on: ubuntu-latest
    environment: Release       # 可配置审批流（如需要人工确认）
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0       # 获取完整历史，CHANGELOG 生成需要

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          registry-url: 'https://registry.npmjs.org'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Publish to npm
        run: pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: ${{ github.ref_name }}
          body: |
            See [CHANGELOG.md](https://github.com/${{ github.repository }}/blob/main/CHANGELOG.md) for details.
```

**关键设计点**：

- **`needs: [test]`** —— 发布强依赖测试通过，防止有问题的代码流入生产
- **`environment: Release`** —— GitHub Environments 支持设置审批人和保护规则，适合需要人工确认的发布流程
- **`permissions: contents: write`** —— `actions/create-release` 需要写入仓库内容的权限，显式声明更安全
- **`fetch-depth: 0`** —— `conventional-changelog` 需要完整的 Git 历史来生成 CHANGELOG

---

## 四、完整工作流图解

以下是开发者从编码到发布的完整操作链路：

```
┌──────────┐     git commit      ┌──────────────┐
│          │ ──────────────────> │              │
│ 开发者   │                     │  commit-msg  │
│          │ <────────────────── │   hook 校验   │
│          │      ✓ 通过         │              │
└──────────┘                     └──────────────┘
     │                                  │
     │         git push                 │
     │ ─────────────────────────────────────────>
     │                              ┌──────────────┐
     │                              │  GitHub CI   │
     │                              │  lint/test   │
     │                              │   build      │
     │ <────────────────────────────────────────── │
     │                                   ✓ 通过    │
     │                              └──────────────┘
     │         pnpm release
     │         1. 选择版本类型
     │         2. 更新版本号
     │         3. 生成 CHANGELOG
     │         4. git commit "release: v1.2.0"
     │         5. git tag v1.2.0
     │         6. git push --tags
     │ ─────────────────────────────────────────>
     │                              ┌──────────────┐
     │                              │ Release 流程  │
     │                              │ test → build │
     │                              │ → publish    │
     │                              │ → GitHub Rel │
     │ <────────────────────────────────────────── │
     │                                   ✅ 完成    │
                                  └──────────────┘
```

---

## 五、快速上手指南

### 5.1 初始化步骤

```bash
# 1. 安装依赖
pnpm add -D husky conventional-changelog-cli enquirer semver

# 2. 初始化 Husky（v9）
npx husky init

# 3. 创建 commit-msg hook
echo 'node scripts/verify-commit.js' > .husky/commit-msg

# 4. 将 verify-commit.js 和 release.js 复制到 scripts/ 目录
#    （参考上方完整代码）

# 5. 在 package.json 中添加 scripts
#    "release": "node scripts/release.js"
#    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"

# 6. 创建 .github/workflows/ 下的 CI 和 Release workflow 文件
```

### 5.2 日常开发流程

```bash
# 正常开发提交（自动校验）
git commit -m "feat(compiler): add template optimization for v-if"

# 推送触发 CI
git push

# 准备发布（交互式选择版本）
pnpm release
# ? Select release type
#   patch (1.2.1)
#   minor (1.3.0)
#   major (2.0.0)
# ? Releasing v1.3.0. Confirm? Yes
```

---

## 六、常见问题与踩坑记录

### Q1: Husky hook 不生效，提交没有触发校验

```bash
# 检查 hook 是否已注册
cat .git/hooks/commit-msg

# 确保 Husky 已初始化
npx husky init

# 旧版本升级后可能需要重新安装
git config core.hooksPath .husky
```

### Q2: CI 中 pnpm install 失败，提示 lockfile 不匹配

CI 环境必须使用 `--frozen-lockfile`，确保 lock 文件与 package.json 一致：

```bash
# 本地更新 lock 文件后重新提交
pnpm install

# 如果确实需要更新
pnpm install --no-frozen-lockfile
```

### Q3: GitHub Actions 创建 Release 失败（403 错误）

检查 workflow 是否声明了正确的权限：

```yaml
permissions:
  contents: write    # 必须有这一行
```

或者在仓库 Settings → Actions → General → Workflow permissions 中选择 "Read and write permissions"。

### Q4: 发布到 npm 时 401 Unauthorized

需要配置 `NPM_TOKEN` secret：

1. 在 [npm](https://www.npmjs.com/) 生成 Access Token（选择 "Automation" 类型）
2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加 `NPM_TOKEN`
3. 确认 workflow 中设置了 `registry-url` 和 `NODE_AUTH_TOKEN`

### Q5: CHANGELOG 生成不完整

`conventional-changelog` 依赖 tag 来计算变更范围。确保：

1. 本地有完整的 Git 历史（`git fetch --tags`）
2. CI 中 checkout 使用 `fetch-depth: 0`
3. 已存在至少一个 `v*` 格式的 tag 作为基准

---

## 七、总结

本文搭建了一套完整的自动化发布体系，核心链路可以概括为：

| 环节 | 工具/方案 | 解决的问题 |
|------|----------|-----------|
| 提交校验 | Husky + verify-commit.js | 强制规范提交信息 |
| 版本管理 | semver + 交互式脚本 | 语义化版本，避免人为错误 |
| CHANGELOG | conventional-changelog | 自动生成，不再手写 |
| CI 测试 | GitHub Actions | 每次提交自动验证 |
| 自动发布 | GitHub Actions + npm | tag 推送后全自动发布 |

这套流程的优势在于：

- **开发者体验好** —— 提交时即时反馈，发布时一键完成
- **可追溯性强** —— 每个版本都有清晰的提交历史和变更记录
- **错误率低** —— 机械操作交给机器，减少人为失误
- **团队对齐** —— 统一的规范让协作更顺畅

建议团队在实际落地时，可以先从 **Commit 规范** 和 **CI 测试** 开始，这是投入产出比最高的两个环节。等团队适应后再逐步引入自动发布流程。

---

## 参考与延伸阅读

- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Semantic Versioning 语义化版本](https://semver.org/)
- [Husky 官方文档](https://typicode.github.io/husky/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [conventional-changelog 配置](https://github.com/conventional-changelog/conventional-changelog)
