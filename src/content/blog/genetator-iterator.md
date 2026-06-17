---
title: 生成器和可迭代对象
description: 学习js中的生成器和可迭代对象
category: JavaScript
tags: [Javascript]
pubDate: 2025-03-27
---

> JavaScript 中的**可迭代对象（Iterables）**和**生成器（Generators）**是处理序列数据的核心机制，它们让异步操作、惰性计算和数据流处理变得优雅。


## 一、可迭代对象

如果一个对象实现了 **`[Symbol.iterator]`** 方法，并且该方法返回一个遵循**迭代器协议**的对象（即具有 `next()` 方法，返回 `{ value, done }`），那么它就是可迭代的。

### 内置的可迭代对象

JavaScript 内置了多种可迭代对象，可以直接使用 `for...of` 遍历：

```js
// 字符串 —— 按 Unicode 字符遍历
for (const char of "hello") {
  console.log(char); // h, e, l, l, o
}

// 数组
for (const item of [10, 20, 30]) {
  console.log(item);
}

// Map（保留插入顺序）和 Set（去重）
const map = new Map([['a', 1], ['b', 2]]);
for (const [key, value] of map) {
  console.log(key, value);
}
```

### `for...of` 的底层原理

`for...of` 本质上是这样工作的：

```js
const iterable = [10, 20, 30];

// 1. 获取迭代器
const iterator = iterable[Symbol.iterator]();

// 2. 反复调用 next()，直到 done 为 true
let result = iterator.next();
while (!result.done) {
  console.log(result.value); // 10, 20, 30
  result = iterator.next();
}
```

理解这个机制，有助于你更好地自定义可迭代行为。

### 自定义可迭代对象

手动实现 `[Symbol.iterator]` 方法：

```js
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    return {
      current: this.from,
      last: this.to,
      next() {
        return this.current <= this.last
          ? { done: false, value: this.current++ }
          : { done: true, value: undefined };  // done: true 时 value 可省略，但建议显式写出
      }
    };
  }
};

console.log([...range]); // [1, 2, 3, 4, 5]
```

---

## 二、生成器

生成器是 ES6 引入的特殊函数，用 `function*` 声明。它最大的特点是**可以在执行过程中暂停和恢复**，通过 `yield` 关键字交出控制权。

### 基本语法

```js
function* idGenerator() {
  let id = 1;
  while (true) {
    yield id++; // 每次在这里暂停，返回当前 id
  }
}

const gen = idGenerator();
console.log(gen.next().value); // 1
console.log(gen.next().value); // 2
console.log(gen.next().value); // 3
// 不会无限循环，每次 yield 都会把控制权交还调用方
```

### 生成器与可迭代的关系

**生成器对象同时满足迭代器协议和可迭代协议**——它既是迭代器（有 `next()` 方法），也是可迭代对象（`[Symbol.iterator]` 返回自身）。这意味着生成器可以无缝接入任何需要可迭代对象的场景。

```js
function* countdown(n) {
  while (n >= 0) {
    yield n;
    n--;
  }
}

// 生成器可以直接用于 for...of
for (const num of countdown(5)) {
  console.log(num); // 5, 4, 3, 2, 1, 0
}

// 也可以展开
console.log([...countdown(3)]); // [3, 2, 1, 0]

// 还能解构
const [first, second] = countdown(10);
console.log(first, second); // 10, 9
```

### `return` 在生成器中的特殊行为

生成器内的 `return` 会结束迭代，将 `done` 设为 `true`：

```js
function* withReturn() {
  yield 1;
  yield 2;
  return 3;  // 结束生成器，value 3 通常被忽略
  yield 4;   // 不会执行
}

const g = withReturn();
console.log(g.next()); // { value: 1, done: false }
console.log(g.next()); // { value: 2, done: false }
console.log(g.next()); // { value: 3, done: true } ← return 的值
console.log(g.next()); // { value: undefined, done: true }
```

> 注意：`return` 的值虽然会出现在最后一个 `next()` 的结果中，但 `for...of` 和展开运算符会忽略它。

### 生成器的 `return()` 和 `throw()`

作为调用方，你可以主动控制生成器的生命周期：

```js
function* gen() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log('清理资源');  // finally 会在生成器被终止时执行
  }
}

const g = gen();
console.log(g.next());        // { value: 1, done: false }
console.log(g.return(100));   // { value: 100, done: true } —— 提前终止
// 输出："清理资源"

const g2 = gen();
g2.next();                    // 先启动到第一个 yield
g2.throw(new Error('出错了')); // 向生成器内部注入异常
// Error: 出错了
```

这两个方法在需要**提前终止生成器**或**处理生成器内部异常**时非常有用。

### `yield*` —— 委托迭代

`yield*` 可以将迭代工作委托给另一个可迭代对象，避免手动逐个 `yield`：

```js
function* combined() {
  yield* [1, 2, 3];
  yield 'end';
}

// 上面的代码等效于：
function* combinedManual() {
  yield 1;
  yield 2;
  yield 3;
  yield 'end';
}

console.log([...combined()]); // [1, 2, 3, 'end']
```

`yield*` 还可以递归委托给另一个生成器，常用于遍历树形结构。

### 双向通信

生成器不仅可以向外产出值，还可以通过 `next(value)` 向内部传入数据：

```js
function* chat() {
  const name = yield "你叫什么名字？";
  yield `你好，${name}！`;
}

const g = chat();
console.log(g.next().value);         // "你叫什么名字？"
console.log(g.next("Alice").value);  // "你好，Alice！"
```

第一次调用 `g.next()` 启动生成器，之后每次传入的参数会成为上一个 `yield` 表达式的返回值。这种双向通信让生成器可以实现**协程**模式。

---

## 三、异步生成器

ES2018 引入了异步生成器（`async function*`）和 `for await...of` 语法，用于处理异步数据流。它的核心是：

- 用 `async function*` 定义异步生成器
- 内部可以 `await` 异步操作，也可以 `yield` 值
- 外部用 `for await...of` 消费

```js
// 异步生成器：每 500ms 产出一个值
async function* asyncCounter() {
  let i = 0;
  while (i < 3) {
    await new Promise(resolve => setTimeout(resolve, 500));
    yield i++;
  }
}

// 消费异步生成器
(async () => {
  for await (const num of asyncCounter()) {
    console.log(num); // 0, 1, 2（每 500ms 输出一个）
  }
})();
```

异步生成器是连接"异步操作"与"迭代器模式"的桥梁，也是接下来两个实战场景的基础。

---

## 四、实际应用场景

掌握基础概念后，我们来看看生成器在真实项目中如何解决实际问题。

### 1. 无限滚动

将分页 API 封装成异步生成器后，调用方完全不需要关心分页逻辑：

```js
// 封装层：自动翻页，对调用方来说就像个无限数组
async function* fetchAllUsers(pageSize = 20) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`/api/users?page=${page}&size=${pageSize}`);
    const { data, total } = await response.json();

    for (const user of data) {
      yield user; // 每次产出一个用户，而不是一整页
    }

    hasMore = page * pageSize < total;
    page++;
  }
}

// 消费层：完全不需要关心分页逻辑
async function renderUserList() {
  const container = document.getElementById('users');

  // 甚至可以配合 Intersection Observer，每次滚动到底部只取 10 条
  for await (const user of fetchAllUsers()) {
    const div = document.createElement('div');
    div.textContent = `${user.name} - ${user.email}`;
    container.appendChild(div);

    // 控制节奏：每渲染 50 条暂停，等用户继续滚动
    if (container.children.length % 50 === 0) {
      await waitForScroll(); // 伪代码：等待用户滚动到底部再继续
    }
  }
}
```

### 2. 流式传输（SSE）

处理 ChatGPT 这类流式接口时，异步生成器可以将底层的 SSE（Server-Sent Events）格式封装成干净的数据流：

```js
// 封装层：把 fetch SSE 流转成异步生成器
async function* streamChatGPT(messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, stream: true })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // SSE 格式：每行以 "data: " 开头
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const json = line.slice(6);
          if (json === '[DONE]') return;

          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;  // 逐字/逐句产出
        }
      }
    }
  } finally {
    reader.releaseLock(); // 确保资源释放
  }
}

// 消费层：业务代码完全感知不到流的复杂性
async function chat() {
  const messages = [{ role: 'user', content: '讲个故事' }];

  // 就像在处理一个普通数组，但是是异步、流式的
  for await (const token of streamChatGPT(messages)) {
    process.stdout.write(token);  // 逐字打印，无需等待全部响应
  }
}
```

---

## 总结

| 特性 | 可迭代对象 | 生成器 | 异步生成器 |
|------|----------|--------|-----------|
| 定义方式 | 实现 `[Symbol.iterator]` | `function*` | `async function*` |
| 协议 | 迭代器协议 | 迭代器 + 可迭代协议 | 异步迭代器 + 异步可迭代协议 |
| 消费方式 | `for...of` / `...` | `for...of` / `...` | `for await...of` |
| 核心能力 | 遍历序列 | **暂停/恢复**、双向通信 | 暂停/恢复 + **异步操作** |

理解生成器的关键在于：**它把"遍历数据"变成了"控制流程"**。`yield` 不只是返回值，更是一种流程控制的工具——这让无限数据流、延迟计算、资源清理等场景变得异常优雅。
