---
title: vue3和vue2的区别
description: 全面解析 Vue3 与 Vue2 的差异，包括响应式原理、Composition API、编译优化等
category: Vue
tags: [vue, vue3, vue2, 对比]
pubDate: 2024-03-05
---

# vue3和vue2的区别

1、vue3使用ts重写。

2、支持composition Api

3、响应式原理改用proxy实现，可监听动态新增删除属性，以及数组变化。

```js
// vue2的响应式使用defineProperty实现
const data = {
  name: '123',
  age: 18
}
const obj = {}
function proxyData(){
  Object.keys(data).forEach(key => {
    Object.defineProperty(obj, key, {
      get(){
        return data[key]
      },
      set(value){
        if(newValue === data[key]) return 
        data[key] = value
        // 附加响应式逻辑
      }
    })
  })
}
proxyData()

// vue3

const data = {
  name: '123',
  age: 18,
}

const vm = new Proxy(data, {
  get(target, key){
    return target[key]
  },
  set(target, key, value){
    if(target[key] === value) return
    target[key] = value
    // 响应式逻辑
  }
})
```

4、编译优化，vue2通过编辑静态根节点优化diff，vue3标记和提升所有静态根节点，diff的时候只需要对比动态节点内容

5、移除了一些不常用的api（inline-template、filter）

6、生命周期的变化：使用setup代替了之前的beforeCreate和created

7、vue3的template模板支持多个根标签

8、Vuex状态管理：创建实例的方式改变，vue2为new Store，vue3为createStore

9、Route获取页面实例与路由信息：vue2通过**this**获取router实例，vue3通过使用getCurrentInstance/useRoute和useRouter方法获取当前组件实例

10、Props的使用变化：vue2通过this获取props里面的内容，vue3直接通过defineProps

11、父子组件传值：vue3向父组件传回数据时，如使用自定义名称需要使用defineEmits
