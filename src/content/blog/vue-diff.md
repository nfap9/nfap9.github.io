---
title: Vue2和Vue3中diff算法对比
description: 详细对比 Vue2 和 Vue3 的 diff 算法实现原理
category: Vue
tags: [vue, diff, 算法, 虚拟DOM]
pubDate: 2024-03-01
---

# diff算法

Diff 算法是 Vue 虚拟 DOM（Virtual DOM）渲染器的核心机制，其目标是用**最小的性能代价**找出新旧虚拟节点（VNode）之间的差异，并高效地更新真实 DOM。完整对比两棵 DOM 树的差异时间复杂度为 O(n³)，这在实际应用中是性能灾难。Vue 通过一系列优化策略将复杂度降至 O(n)，而 Vue 3 在此基础上进一步优化了算法实现。

---

## vue2 diff算法

### 核心思想：双端比较（Double-Ended Diff）

Vue 2 的 diff 算法基于 snabbdom 修改而来，核心策略是**同层比较**和**双端比较**。算法通过四个指针分别指向新旧列表的头尾，进行四种假设性匹配，尽可能复用已有的 DOM 节点。

#### 四个核心指针

| 指针 | 含义 |
|------|------|
| `oldStartIdx` | 指向旧子节点列表头部 |
| `oldEndIdx` | 指向旧子节点列表尾部 |
| `newStartIdx` | 指向新子节点列表头部 |
| `newEndIdx` | 指向新子节点列表尾部 |

#### 五步匹配策略

算法在 `while` 循环中运行，终止条件是任一方的头指针越过尾指针。每一轮循环按**固定顺序**进行以下匹配：

**① 头-头匹配（oldStart vs newStart）**

检查两个列表的第一个节点是否相同（key 和 tag 均相同）。若匹配，调用 `patchVnode` 更新节点，两个 `Start` 指针同时后移（+1）。

**② 尾-尾匹配（oldEnd vs newEnd）**

检查两个列表的最后一个节点是否相同。若匹配，调用 `patchVnode` 更新节点，两个 `End` 指针同时前移（-1）。

**③ 旧头-新尾匹配（oldStart vs newEnd）**

适用于"首节点移到了尾部"的场景。若匹配，更新节点后将 `oldStart` 指向的 DOM 移动到 `oldEnd` 对应 DOM 的后面。`oldStartIdx++`，`newEndIdx--`。

**④ 旧尾-新头匹配（oldEnd vs newStart）**

适用于"尾节点移到了头部"的场景。若匹配，更新节点后将 `oldEnd` 指向的 DOM 移动到 `oldStart` 对应 DOM 的前面。`oldEndIdx--`，`newStartIdx++`。

**⑤ 乱序匹配**

若以上四种匹配全部失败，则以旧列表剩余节点的 `key` 建立哈希映射表，用新头节点的 `key` 去查找：

- **找到了**：复用该节点，将其 DOM 移动到 `oldStart` 前面
- **没找到**：创建新 DOM 节点插入到 `newStartIdx` 位置

#### 循环结束后的收尾

- **旧列表先遍历完**（`oldStartIdx > oldEndIdx`）：新列表剩余节点为新增，批量挂载
- **新列表先遍历完**（`newStartIdx > newEndIdx`）：旧列表剩余节点为多余，批量卸载

#### 代码流程示意

```javascript
function updateChildren(oldCh, newCh) {
  let oldStartIdx = 0, newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1, newEndIdx = newCh.length - 1;
  let oldStartVnode = oldCh[0], newStartVnode = newCh[0];
  let oldEndVnode = oldCh[oldEndIdx], newEndVnode = newCh[newEndIdx];

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (sameVnode(oldStartVnode, newStartVnode)) {
      // 头-头匹配
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 尾-尾匹配
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 旧头-新尾匹配（需要移动DOM）
      patchVnode(oldStartVnode, newEndVnode);
      parentElm.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 旧尾-新头匹配（需要移动DOM）
      patchVnode(oldEndVnode, newStartVnode);
      parentElm.insertBefore(oldEndVnode.el, oldStartVnode.el);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 乱序匹配：建立key映射表查找
      // ...
    }
  }

  // 处理新增或删除的节点
  if (oldStartIdx > oldEndIdx) {
    // 挂载新节点
  } else if (newStartIdx > newEndIdx) {
    // 卸载旧节点
  }
}
```

#### Vue 2 diff 算法的特点与局限

**优势：**
- 对于列表在两端增删的场景（最常见），双端对比能迅速收窄范围
- 通过头尾交叉检测，能有效优化"倒序"或"首尾互换"场景
- 时间复杂度为 O(n)，相比简单 diff 的 O(n²) 大幅优化

**局限：**
- 处理长列表的复杂乱序时，频繁创建 key 映射表存在额外性能开销
- 无法保证 DOM 移动次数是最少的，偶尔会产生多余的移动操作
- 全量对比属性，无法精准只对比变化的部分

---

## vue3 diff算法

### 核心思想：快速 Diff + 最长递增子序列（Quick Diff + LIS）

Vue 3 借鉴了 inferno 框架的算法思路，引入了**预处理**和**最长递增子序列（LIS）**算法。其核心思想是：先通过预处理缩小需要处理的乱序区间，再对剩余节点使用 LIS 算法找出相对顺序不需要改变的最大集合，只移动不在序列中的节点，从而将 DOM 移动次数降至理论上的最低值。

#### 五步优化策略

**① 预处理前置节点（从前往后比较）**

新旧列表从头部开始逐个比较，直到遇到不同类型的节点。所有匹配的前置节点直接 `patch` 复用。

```
旧列表：[A, B, C, D, E]
新列表：[A, B, D, C, E]
         ↑↑ 匹配，i = 2
```

**② 预处理后置节点（从后往前比较）**

跳过前置匹配后，从尾部继续向前比较，直到遇到不同类型节点。

```
旧列表：[A, B, C, D, E]
新列表：[A, B, D, C, E]
                     ↑ 匹配，E 相同，e1--, e2--
```

**③ 处理仅有新增节点的情况**

若旧节点已遍历完（`i > e1`），但新节点还有剩余，说明剩余部分为新增节点，批量挂载。

**④ 处理仅有卸载节点的情况**

若新节点已遍历完（`i > e2`），但旧节点还有剩余，说明剩余部分为多余节点，批量卸载。

**⑤ 处理混合复杂情况（核心 diff）**

当前后预处理后仍有未处理的节点，说明存在乱序、新增、删除、移动的混合场景。此时进入核心 diff 流程：

- **建立新节点索引表**（`keyToNewIndexMap`）：以 key 为键，新列表中的索引为值
- **构建新旧位置映射**（`newIndexToOldIndexMap`）：遍历旧节点，在映射表中查找可复用的节点，记录其在新列表中的位置
- **获取最长递增子序列**：对 `newIndexToOldIndexMap` 求 LIS，得到不需要移动的节点集合
- **逆向遍历移动节点**：从后向前遍历新节点列表，不在 LIS 中的节点执行移动操作

#### 最长递增子序列（LIS）的作用

最长递增子序列是 Vue 3 diff 算法最核心的优化点。其作用是：在乱序节点中，找出一个**相对顺序已经正确**的最大节点集合，这些节点不需要移动，只需要移动不在序列中的节点。

**示例：**

```
旧列表：[A, B, C, D, E]
新列表：[A, C, E, B, D]

// 预处理后（A 已匹配）
剩余旧：[B, C, D, E]
剩余新：[C, E, B, D]

// 新节点在旧列表中的位置映射
newIndexToOldIndexMap = [2, 4, 1, 3]  // C(2), E(4), B(1), D(3)

// 最长递增子序列
LIS = [1, 3]  // 对应 B(1), D(3) 或 C(2), E(4)

// 结果：不在 LIS 中的节点需要移动
```

LIS 使用**贪心 + 二分查找**算法实现，时间复杂度为 O(n log n)。

#### 完整代码流程

```typescript
function patchKeyedChildren(c1, c2, container, parentAnchor) {
  let i = 0;
  const e1 = c1.length - 1;
  const e2 = c2.length - 1;
  let e1p = e1, e2p = e2;

  // 1. 同步头部
  while (i <= e1p && i <= e2p) {
    if (isSameVNodeType(c1[i], c2[i])) {
      patch(c1[i], c2[i], container);
      i++;
    } else {
      break;
    }
  }

  // 2. 同步尾部
  while (i <= e1p && i <= e2p) {
    if (isSameVNodeType(c1[e1p], c2[e2p])) {
      patch(c1[e1p], c2[e2p], container);
      e1p--;
      e2p--;
    } else {
      break;
    }
  }

  // 3. 处理仅有新增
  if (i > e1p) {
    for (let j = i; j <= e2p; j++) {
      patch(null, c2[j], container, anchor);
    }
    return;
  }

  // 4. 处理仅有卸载
  if (i > e2p) {
    for (let j = i; j <= e1p; j++) {
      unmount(c1[j]);
    }
    return;
  }

  // 5. 处理未知序列（核心diff）
  const s1 = i, s2 = i;
  const keyToNewIndexMap = new Map();
  for (i = s2; i <= e2p; i++) {
    keyToNewIndexMap.set(c2[i].key, i);
  }

  const toBePatched = e2p - s2 + 1;
  const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

  // 遍历旧节点，寻找可复用节点
  for (i = s1; i <= e1p; i++) {
    const oldVNode = c1[i];
    const newIndex = keyToNewIndexMap.get(oldVNode.key);
    if (newIndex === undefined) {
      unmount(oldVNode); // 旧节点不存在于新列表中
    } else {
      newIndexToOldIndexMap[newIndex - s2] = i + 1; // +1 区分0（新增）
      patch(oldVNode, c2[newIndex], container);
    }
  }

  // 获取最长递增子序列
  const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
  let j = increasingNewIndexSequence.length - 1;

  // 逆向遍历移动节点
  for (i = toBePatched - 1; i >= 0; i--) {
    const nextIndex = s2 + i;
    const nextChild = c2[nextIndex];
    const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : parentAnchor;

    if (newIndexToOldIndexMap[i] === 0) {
      patch(null, nextChild, container, anchor); // 新增节点
    } else {
      if (j < 0 || i !== increasingNewIndexSequence[j]) {
        container.insertBefore(nextChild.el, anchor); // 移动节点
      } else {
        j--; // 在LIS中，不需要移动
      }
    }
  }
}
```

---

## Vue 2 与 Vue 3 diff 算法对比

### 核心差异

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| **算法核心** | 双端比较（Double-Ended Diff） | 快速 Diff + 最长递增子序列 |
| **对比方式** | 四个指针从两端向中间靠拢 | 先预处理前缀后缀，再处理中间乱序 |
| **节点移动策略** | 头尾交叉检测 + 乱序哈希查找 | LIS 算法找出最小移动集合 |
| **乱序处理** | 建立 key→index 映射表逐个查找 | 建立映射 + LIS 批量优化 |
| **DOM 移动次数** | 非最优，可能有多余移动 | 理论最少 |
| **属性对比** | 全量对比所有属性 | Patch Flags 精准对比动态属性 |
| **静态节点** | 每次渲染都重新生成 VNode | 静态提升，仅生成一次 |
| **时间复杂度** | O(n) | O(n) ~ O(n log n) |

### 为什么 Vue 3 更快？

1. **更少的 DOM 移动操作**：通过 LIS 算法，Vue 3 能计算出最少的节点移动次数，而 Vue 2 的双端比较在某些复杂乱序场景下会产生多余的移动

2. **预处理缩小范围**：Vue 3 的前后置预处理能快速排除不需要处理的节点，而 Vue 2 需要逐一轮询

3. **静态节点提升**：Vue 3 在编译阶段将静态节点提升，渲染时直接复用，不参与 diff 比较

4. **Patch Flags 靶向更新**：Vue 3 通过编译时标记动态节点，diff 时只对比变化的属性，而非全量对比

### 关键概念总结

**为什么 key 很重要？**

- `key` 是节点的唯一标识，帮助算法精准匹配新旧节点
- 有 `key` 时，算法将"销毁-再创建"变为"低开销的移动"
- 避免使用 `index` 作为 `key`，当列表排序、插入、删除时会导致误判

**Vue 2 的适用场景：**

- 列表变更主要在两端增删（性能已足够好）
- 简单倒序或首尾互换

**Vue 3 的优势场景：**

- 复杂乱序排列的长列表
- 包含大量静态内容的页面（静态提升收益大）
- 需要最少 DOM 操作的高频更新场景

---

## 总结

Vue 2 的双端 diff 算法是一种成熟且高效的实现，通过四个指针的巧妙配合，将时间复杂度从 O(n²) 优化到 O(n)，能很好地处理大多数列表更新场景。而 Vue 3 的快速 diff 算法在此基础上引入了最长递增子序列算法，进一步优化了乱序场景下的 DOM 移动次数，配合静态提升和 Patch Flags 等编译期优化，使得 Vue 3 在大型应用中的渲染性能有了显著提升。

从本质上讲，Vue 2 是在"勤奋"地对比每一处差异，而 Vue 3 是通过"聪明"的编译分析和数学优化，让自己**尽量少干活、只干精准的活**。
