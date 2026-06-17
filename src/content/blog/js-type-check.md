---
title: js中判断数据类型的方法
description: 介绍 JavaScript 中判断数据类型的多种方法，包括 typeof、constructor、instanceof、Object.prototype.toString 等
category: JavaScript
tags: [javascript, 数据类型]
pubDate: 2024-01-15
---

## 1、typeof运算符

typeof是最基本的判断数据类型的方法，它可以返回一个变量的数据类型。typeof对于基本数据类型（如字符串、数字、布尔值）非常有效，但对于引用类型（如对象、数组）就不太准确了。例如，typeof null会返回"object"，这是一个历史遗留问题。使用typeof时，需要注意这些特殊情况。

```js
console.log(typeof 123); // "number"
console.log(typeof "hello"); // "string"
console.log(typeof true); // "boolean"
console.log(typeof undefined); // "undefined"
console.log(typeof null); // "object"
console.log(typeof []); // "object"
console.log(typeof {}); // "object"
console.log(typeof function(){}); // "function"
```

## 2、constructor属性

constructor属性指向创建该对象的构造函数。
constructor属性可以被改写。

```js
const arr = [1, 2, 3];
console.log(arr.constructor === Array); // true

const obj = { name: "云牧", age: 18 };
console.log(obj.constructor === Object); // true
```
