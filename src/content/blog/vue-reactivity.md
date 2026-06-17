---
title: vue响应式原理
description: 从零实现一个简易 Vue，深入理解 Vue 响应式系统的核心原理
category: Vue
tags: [vue, 响应式, 原理, 源码]
pubDate: 2024-03-10
---

## VUE响应式原理

本文实现一个简单的Vue：

- 接收初始化的参数，这里只举几个简单的例子 el data options
- 通过私有方法 _proxyData 把data 注册到 Vue 中 转成getter setter
- 使用 observer 把 data 中的属性转为 响应式 添加到 自身身上
- 使用 observer 方法监听 data 的所有属性变化来 通过观察者模式 更新视图
- 使用 compiler 编译元素节点上面指令 和 文本节点差值表达式

### 1、vue.js

```ts
class Vue {
  constructor(options){
    
  }
}
```
