---
title: Vue 项目代码与 UI 规范：从团队约定到可落地实践
description: 总结一套面向 Vue + TypeScript + Element Plus 技术栈的项目级代码规范，覆盖组件架构、函数设计、TypeScript 约束、状态管理、API 请求层以及设计 Token 与布局模式，可直接作为团队开发约定与代码审查清单。
category: 工程化
tags: [vue, typescript, element-plus, 代码规范, 设计系统, 团队开发, ai-coding]
pubDate: 2026-06-16
---

> 这套规范来自一个实际 Vue + TypeScript + Element Plus 项目的迭代总结。它的目标不是写出一份“完美文档”，而是让团队里的每个开发者（包括 AI Agent）在写代码时，能做出一致且可维护的决策。文中既包含原则，也包含可直接执行的行数限制、命名约定、组件选择决策树和审查清单。

---

## 一、核心原则

在动笔写代码之前，先统一三条最基本的原则。它们会贯穿后续的每一条具体规则。

### 1.1 单一职责

一个组件只做一件事，一个函数只做一件事。当某个文件开始同时处理数据获取、数据转换、UI 渲染和事件分发时，它就具备了被拆分的信号。

### 1.2 禁止魔法数字

所有视觉值必须使用 CSS 变量（全局或组件级），所有逻辑中的硬编码值必须提取为具名常量。魔法数字是技术债中最隐蔽也最难批量替换的一种。

### 1.3 优先组合而非重复

复用项目组件、工具函数和组合式函数。不要复制粘贴相似代码。重复代码会在 AI 或新人参与开发时被再次复制，导致问题呈指数扩散。

---

## 二、代码架构规则

### 2.1 组件大小限制

| 目标 | 最大行数 | 超出后的处理 |
|------|---------|-------------|
| 单个 Vue SFC | 300–400 行 | 拆分为子组件，或将逻辑移到 composable / utils |
| 单个函数 | 50–60 行 | 提取为具有描述性名称的子函数 |
| `<script setup>` 块 | 应一眼可读 | 将复杂逻辑移到组合式函数或工具文件 |

组件太长往往意味着职责过多，阅读、测试和后续修改成本都会上升。

### 2.2 组件拆分原则

满足以下任一条件时，就应当拆分组件：

- **复用**：同一个 UI 模式出现在多个页面或模块中 → 提取到 `src/components/`。
- **复杂度**：一个组件同时承担数据获取、转换、渲染、事件处理，或拥有超过 3 个不同视觉区块 → 拆分为子组件。
- **视图分层**：页面包含多个由标题或分割线分隔的独立业务区块 → 每个区块下沉到页面 `components/` 目录。
- **逻辑过重**：一个组件中有超过 100 行纯逻辑（computed、watch、异步函数、数据转换）→ 移到 `composables/` 或 `utils/`。

推荐的目录结构：

```
src/
├── components/              → 全局可复用组件
│   ├── BaseDialog.vue
│   ├── StatCard.vue
│   └── ...
├── views/
│   ├── some-page/
│   │   ├── index.vue        → 页面入口（轻量，委托给子组件）
│   │   └── components/      → 页面局部组件
│   │       ├── SearchFilter.vue
│   │       └── DataTable.vue
│   └── ...
```

### 2.3 函数设计规则

- **一个函数，一个动作**：要么获取数据、要么转换数据、要么渲染、要么处理事件，不要同时做四件事。
- **尽早提取**：如果一个函数需要注释来解释其步骤，这些步骤应该成为独立函数。
- **优先纯函数**：`src/utils/` 中的工具函数应无副作用。副作用属于事件处理器、生命周期钩子、组合式函数或 Pinia actions。
- **按意图命名**：`fetchUserList` 优于 `getData`，`handleSubmit` 优于 `clickBtn`。

| 差的 | 好的 | 原因 |
|------|------|------|
| `getData()` | `fetchUserList()` | 意图清晰 |
| `clickBtn()` | `handleSubmit()` | 意图清晰 |
| `doSomething()` | `validateForm()` | 具体动作 |
| `tmp1`, `tmp2` | `filteredUsers`, `sortedColumns` | 自解释 |
| `flag` | `isLoading`, `hasError` | 布尔意图明确 |

### 2.4 命名约定

| 目标 | 约定 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `BaseDialog.vue`, `StatCard.vue` |
| TS 文件 / 组合式函数 | camelCase | `useUserStore.ts`, `formatDate.ts` |
| CSS 类 | kebab-case | `.base-dialog`, `.stat-card` |
| Props | camelCase | `modelValue`, `confirmText` |
| Emits | camelCase | `update:modelValue`, `confirm` |
| Pinia stores | camelCase，后缀 `Store` | `userStore`, `datasetStore` |

### 2.5 TypeScript 规则

- 所有 `props` 必须用 `defineProps` 显式定义类型。
- 所有 `emit` 事件必须用 `defineEmits` 定义类型。
- 避免 `any`。类型不确定时使用 `unknown` + 类型守卫。
- 对象结构优先用 `interface`，联合类型 / 别名用 `type`。
- 可复用类型提取到模块目录的 `types.ts` 或 `models/` 中。

```typescript
// 好的
interface User {
  id: number;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

const props = defineProps<{
  title: string;
  width?: string;
  showFooter?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();
```

### 2.6 状态管理规则

| 范围 | 方案 | 示例 |
|------|------|------|
| 单个组件 | `ref`、`reactive`、`computed` | 表单输入值、本地开关、对话框可见性 |
| 父组件 + 直接子组件 | `provide` / `inject` | 深层表单数据、深层嵌套 UI 状态 |
| 跨组件 / 页面级 | Pinia store | 用户信息、应用配置、缓存数据 |
| 服务端缓存 | 请求层 + Pinia | API 响应列表、查询表 |

- **严禁**直接修改 props。使用 `emit` + `v-model` 或回调 props。
- **严禁**在组件中放置 API 响应缓存逻辑。

### 2.7 API 请求规则

- 所有 API 调用必须在 `src/request/` 中定义，不要在组件内直接写原生 axios。
- 每个请求模块按业务域组织，导出 DTO/VO 类型和请求函数。
- 统一使用 `async/await` + `try/catch` 处理加载和错误状态。

```typescript
// src/request/userRequest.ts
export interface LoginDTO {
  username: string;
  password: string;
}

export interface UserVO {
  id: number;
  username: string;
  role: string;
}

export function login(data: LoginDTO) {
  return request.post<UserVO>('/user/login', data);
}
```

错误处理示例：

```typescript
async function handleSubmit() {
  try {
    await login(formData);
    ElMessage.success('登录成功');
    router.push('/');
  } catch (error) {
    ElMessage.error('登录失败，请检查账号密码');
  }
}
```

---

## 三、UI 规则与设计系统

### 3.1 变量类别：只使用这些，禁止硬编码

编写样式时，从以下类别中选择变量，不要手写任何具体颜色、字号、间距或圆角值。

- **语义颜色**：`primary`、`success`、`warning`、`danger`、`error`、`info`，每种都有深浅变体
- **文本颜色**：`primary`、`regular`、`secondary`、`placeholder`、`disabled`
- **边框颜色**：`border`、`light`、`lighter`、`extra-light`、`dark`、`darker`
- **填充颜色**：`fill`、`light`、`lighter`、`extra-light`、`dark`、`darker`、`blank`
- **背景颜色**：`bg`、`page`、`overlay`
- **字号**：`extra-small`、`small`、`base`、`medium`、`large`、`extra-large`、`3xl`
- **字重**：`primary`（500）、`semibold`（600）、`bold`（700）
- **间距**：`3xs`、`2xs`、`xs`、`sm`、`md`、`lg`、`xl`、`2xl`、`3xl`、`4xl`
- **圆角**：`small`、`base`、`round`、`circle`
- **阴影**：`box-shadow`、`light`、`lighter`
- **过渡**：`fast`、`normal`
- **布局**：`form-control-height`、`content-padding`、`content-max-width`

### 3.2 颜色选择决策

按**含义**选择颜色，而非按外观：

| 含义 | 颜色族 |
|------|--------|
| 品牌 / 主操作 | `primary` |
| 完成 / 成功 / 正向 | `success` |
| 警告 / 需注意 | `warning` |
| 错误 / 删除 / 危险 | `danger` / `error` |
| 信息 / 链接 / 次要 | `info` |

同一颜色族内的深浅用法：

- 主色 → 主文字、按钮、浅色背景上的边框
- `light-3` → hover 状态、浅色点缀、次要边框
- `light-9` → 背景底色、标签背景、hover 背景
- `dark-2` → 按下 / 激活状态、浅色底色上的文字
- `rgb` → CSS `rgba()` 自定义透明度组合

### 3.3 间距选择决策

按**关系紧密程度**选择间距：

| Token | 关系 | 典型用途 |
|-------|------|---------|
| `3xs` | 微 | 图标与文字间隙、微调 |
| `2xs` | 紧密 | 行内元素间隙、标签内部间距 |
| `xs` | 接近 | 小按钮内边距、紧凑列表项间距 |
| `sm` | 标准小 | 表单元素间隙、按钮图标间隙 |
| `md` | 标准 | 按钮水平内边距、表单项间距、对话框内部间隙 |
| `lg` | 标准大 | 卡片内边距、区块内部间距 |
| `xl` | 宽松 | 对话框内边距、区块间距 |
| `2xl` | 页面级 | 页面区块间距、大卡片内边距 |
| `3xl` | 主要 | 主要页面模块间隙 |
| `4xl` | 主区块 | 大布局间隙、页面边缘内边距 |

决策规则：**选择不感觉拥挤的最小 Token**。不要在 Token 之间使用任意 `px` 值。

### 3.4 组件选择优先级

```
项目自定义组件 → Element Plus 组件 → 手写 HTML
```

常见场景的决策：

- 标准对话框（标题 + 底部按钮）→ `BaseDialog`
- 标准列表 / 表格 → `BaseTable`
- 标准分页（带信息文本）→ `AppPagination`
- 单指标（标签 + 数值 + 副标签）→ `StatCard`
- 二进制状态（成功 / 危险）→ `StatusTag`
- 权限展示（部门 / 个人）→ `PermissionTag`
- 设置页头部（返回导航）→ `SettingPageHeader`
- 无自定义组件覆盖 → `Element Plus`
- Element Plus 无法覆盖 → 手写 HTML + CSS + JS

### 3.5 常用工具类

不需要完整组件但想复用标准视觉模式时，直接使用这些 CSS 类：

| 类 | 效果 | 使用场景 |
|----|------|---------|
| `.bg-model-card` | 白色背景、标准内边距、圆角、浅色边框、微妙阴影 | 标准卡片容器 |
| `.main-button` | 胶囊描边按钮，主色边框和文字 | 次要操作、筛选按钮、取消操作 |
| `.main-button-primary` | 胶囊渐变填充按钮，白色文字 | 主操作、提交、确认、创建 |
| `.flex-center` | Flex 水平垂直居中 | 任何需要居中的元素 |
| `.ellipsis` | 单行文本截断 | 列表、表格中的长文本 |
| `.text-white` | 白色文字 | 彩色背景上的文字 |

### 3.6 组件级变量

全局变量是默认选择。只有在以下场景下，才允许在组件内部定义局部 CSS 变量：

- 组件有独特的内边距 / 尺寸，不适合全局间距层级。
- 组件有特有的动画时长或缓动曲线。
- 组件需要局部计算值（如 `calc(100% - var(--spacing-lg))`）。
- 复杂组件的子元素需要统一的局部 token。

命名规范：

```
--{component-name}--{property}
--{component-name}__{element}--{property}
```

示例：

```css
--base-dialog--header-padding
--stat-card__value--font-size
```

禁止用组件级变量替代语义颜色，或用它逃避全局间距规范。如果一个值在多个组件中重复出现，应提取到全局变量。

决策流程：

```
需要定义一个值？
  → 全局变量已覆盖？→ 使用全局变量
  → 仅该组件需要？→ 定义组件级变量
  → 多个组件都需要但全局没有？→ 补充到全局变量，然后使用全局变量
```

### 3.7 全局默认值（不要在组件中重复）

这些已在 `src/main.ts` 中全局设置，重复声明会导致不一致：

| 设置 | 全局值 | 不要添加 |
|------|--------|---------|
| `el-table` 斑马纹 | `true`（默认） | 任何 `el-table` 的 `stripe` 属性 |
| `el-form` 标签位置 | `"top"`（默认） | 任何 `el-form` 的 `label-position` 属性 |
| 表单控件高度 | `44px` 通过变量 | 输入框的内联高度样式 |

---

## 四、Vue SFC 模板

每个新 Vue 组件必须遵循此结构：

```vue
<template>
  <!-- 组件标记，使用 Element Plus 或自定义组件 -->
</template>

<script setup lang="ts">
// TypeScript 逻辑：导入、props、emits、状态、computed、函数、生命周期
</script>

<style lang="less" scoped>
/* 所有样式使用 CSS 变量。禁止硬编码值。 */
</style>
```

- 组件特定样式用 `<style lang="less" scoped>`。
- 仅在覆盖 Element Plus 内部样式时，才使用无 scope 的 `<style lang="less">` 块。

---

## 五、典型布局模式

一个页面往往不是单一布局，每个由标题或分割线分隔的独立业务区块都是一个独立布局。

### 5.1 列表页（表格 + 操作）

```
页面头部
  ├─ 标题 + 副标题（左侧）
  └─ 主操作按钮（右侧）
筛选栏
  ├─ 筛选输入框
  ├─ 重置按钮（次要）
  └─ 查询按钮（主要）
数据表格
  ├─ 列（适当处可排序）
  └─ 操作列（小型文字按钮）
分页
  ├─ 信息文本（左侧）
  └─ 页码按钮（右侧）
```

Token 要点：页面标题用 `font-size-large` + `font-weight-bold` + `text-color-primary`；主要区块间距用 `spacing-2xl`；表格使用 `el-table`（斑马纹已全局，不要加 `stripe`）。

### 5.2 表单页

```
页面头部
  ├─ 返回按钮（左侧）
  ├─ 标题
  └─ 副标题（可选）
表单容器
  ├─ 表单字段（标签在输入框上方）
  └─ 提交按钮
      ├─ 取消（次要）
      └─ 提交（主要）
```

Token 要点：表单容器限制最大宽度 `content-max-width`；字段间距用 `spacing-xl`；提交按钮用 `main-button-primary` 或 `el-button type="primary"`。

### 5.3 卡片网格 / 仪表盘

```
页面头部
  ├─ 标题
  └─ 操作按钮（可选）
卡片网格
  ├─ 卡片 1（.bg-model-card）
  ├─ 卡片 2（.bg-model-card）
  └─ 卡片 N（.bg-model-card）
```

响应式策略：小屏单列，中屏 2 列，大屏 3 列或更多。卡片网格间距用 `spacing-lg` 或 `spacing-xl`。

### 5.4 仪表盘 / 概览（统计 + 图表 + 列表）

```
页面标题
统计行
  ├─ 统计卡片 1（StatCard）
  ├─ 统计卡片 2
  └─ ...
内容行
  ├─ 左侧面板（图表或表格）
  └─ 右侧面板（列表或详情）
```

统计卡片使用语义颜色（`primary`、`success`、`danger`、`info`），面板容器使用 `.bg-model-card`。

### 5.5 通用布局规则

1. 主要页面区块间使用 `spacing-2xl` 或 `spacing-3xl`。
2. 标准页面内容内边距为 `content-padding`（24px）或 `spacing-2xl`。
3. 内容区域遵守 `content-max-width`（72rem），超宽时居中。
4. 背景层级：页面根节点用 `bg-color-page`，卡片 / 浮层面板用 `bg-color`，微妙区块用 `fill-color` 或 `fill-color-light`。

---

## 六、代码审查清单

审查 AI 生成或人工编写的代码时，逐条检查：

- [ ] 无硬编码 CSS 值（颜色、尺寸、间距、圆角）
- [ ] 无组件超过 300–400 行
- [ ] 无函数超过 50–60 行
- [ ] Props 和 emits 已显式类型化
- [ ] 无无正当理由的 `any` 类型
- [ ] 无 `.vue` 文件中的原生 `axios` 调用
- [ ] 未直接修改 props
- [ ] 在适用时优先使用自定义组件而非 Element Plus 等价物
- [ ] 未冗余声明全局默认值（表格斑马纹、表单标签位置）
- [ ] 可复用逻辑已提取到组合式函数或工具，未重复

---

## 七、文件结构提示

```
src/styles/variables.less          → 自定义 Design Tokens（无 --el- 前缀）
src/styles/element-plus-theme.less → Element Plus 变量覆盖（桥接层）
src/styles/legacy-variables.less   → 向后兼容别名
src/styles/components.less         → 可复用 CSS 类（.bg-model-card、.main-button）
src/styles/utilities.less          → 工具类（.ellipsis、.flex-center、.text-white）
src/components/                    → 全局可复用组件（BaseDialog、StatCard 等）
src/request/                       → API 请求模块（按业务域）
src/store/modules/                 → Pinia stores（按业务域）
src/composables/                   → 可复用 Vue 组合式逻辑
src/utils/                         → 纯工具函数
src/index.less                     → 全局样式入口
src/main.ts                        → 全局默认 props、应用启动
```

桥接层说明：自定义 Token 通过 `src/styles/element-plus-theme.less` 映射到 Element Plus 变量。项目代码中始终使用不带 `--el-` 前缀的自定义 Token，让 Element Plus 组件在不需要逐个覆盖的情况下自动匹配品牌规范。

---

## 八、写在最后

这套规范的价值不在于“约束 creativity”，而在于**把低层次的重复决策交给规则，把高层次的创造性工作留给开发者**。当颜色、间距、组件选择、目录结构都有默认答案时，团队就能把更多精力放在业务逻辑和用户体验上。

如果你在 AI Coding 场景下使用这套规范，建议把它进一步编码为 Skill 文件，通过“禁止 + 必须”的命令式语句、决策树和代码示例，让 Agent 在每次生成代码时都能自动遵循这些约定。
