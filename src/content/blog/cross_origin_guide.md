---
title: 跨域
description: 深入理解浏览器的同源策略及多种跨域解决方案
category: 网络
tags: [cors, 跨域, 同源策略]
pubDate: 2024-01-20
---

# 跨域（Cross-Origin）详解与解决方案

## 一、什么是跨域？

### 1.1 同源策略（Same-Origin Policy）

**同源策略**是浏览器最核心的安全策略之一，由 Netscape 公司于 1995 年引入。它限制了一个源（origin）的文档或脚本如何与另一个源的资源进行交互。这是一个用于隔离潜在恶意文件的重要安全机制。

> **同源的定义**：如果两个 URL 的**协议（protocol）、域名（host）、端口（port）**都相同，则它们是同源的。

| URL | 与 `http://www.example.com:80/page.html` 是否同源 | 原因 |
|:---|:---|:---|
| `http://www.example.com:80/page2.html` | 同源 | 协议、域名、端口均相同 |
| `http://www.example.com/page2.html` | 同源 | 默认端口 80 可省略 |
| `https://www.example.com/page.html` | 跨域 | 协议不同（http vs https） |
| `http://api.example.com/page.html` | 跨域 | 域名不同（子域不同） |
| `http://www.example.com:8080/page.html` | 跨域 | 端口不同（80 vs 8080） |
| `http://www.other.com/page.html` | 跨域 | 域名完全不同 |

### 1.2 跨域的场景

浏览器在执行以下操作时，会受到同源策略的限制：

- **AJAX/Fetch 请求**：XMLHttpRequest 和 Fetch API 默认只能请求同源资源
- **Cookie、LocalStorage、IndexedDB**：无法读取非同源的存储数据
- **DOM 操作**：无法获取非同源页面的 DOM 节点
- **Canvas/WebGL**：使用跨域图片时可能被污染（tainted canvas）

> **注意**：跨域限制是**浏览器的行为**，服务器之间或命令行工具（如 curl、Postman）请求不受同源策略限制。

---

## 二、AJAX 跨域解决方法

### 2.1 JSONP（JSON with Padding）

JSONP 是一种利用 `<script>` 标签不受同源策略限制特性的跨域解决方案。

**原理**：
- `<script>`、`<img>`、`<link>` 等标签的 `src` 属性可以加载跨域资源
- 服务端将数据包装在一个回调函数中返回
- 浏览器执行该回调函数，获取数据

**前端代码示例**：

```javascript
function handleResponse(data) {
  console.log('获取到的数据:', data);
}

// 动态创建 script 标签
function jsonpRequest(url, callbackName) {
  const script = document.createElement('script');
  script.src = `${url}?callback=${callbackName}`;
  document.body.appendChild(script);
  
  // 清理
  script.onload = function() {
    document.body.removeChild(script);
  };
}

// 使用
jsonpRequest('https://api.example.com/data', 'handleResponse');
```

**服务端返回格式**：

```javascript
handleResponse({ "name": "张三", "age": 25 });
```

**JSONP 的优缺点**：

| 优点 | 缺点 |
|:---|:---|
| 兼容性好，支持老旧浏览器 | 只支持 GET 请求，不支持 POST/PUT/DELETE |
| 实现简单，无需服务端复杂配置 | 存在 XSS 安全风险（服务端注入恶意代码） |
| 不需要浏览器端 CORS 支持 | 无法获取详细的错误信息 |
| | 需要服务端配合支持 |

> **安全提醒**：JSONP 存在被恶意网站利用的风险，现在已逐渐被 CORS 取代，建议优先使用 CORS。

### 2.2 跨域资源共享（CORS）

CORS（Cross-Origin Resource Sharing）是 W3C 标准，目前最主流的跨域解决方案。它允许服务器通过设置特定的 HTTP 响应头来告知浏览器是否允许跨域请求。

#### CORS 请求分类

**（1）简单请求（Simple Request）**

需同时满足以下条件：
- 方法为 `GET`、`HEAD`、`POST` 之一
- 头部字段仅限于：`Accept`、`Accept-Language`、`Content-Language`、`Content-Type`
- `Content-Type` 仅限于：`application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain`

简单请求流程：
```
浏览器直接发送请求，自动在请求头中添加 Origin 字段
服务器返回 Access-Control-Allow-Origin 响应头
浏览器判断该响应头是否允许当前源访问
```

**（2）预检请求（Preflight Request）**

对于非简单请求，浏览器会先发送 `OPTIONS` 预检请求：

```
OPTIONS /api/data HTTP/1.1
Origin: http://example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Content-Type,Authorization
```

服务端响应：
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400  // 预检结果缓存时间（秒）
```

#### 服务端 CORS 配置示例

**Node.js / Express**：
```javascript
const express = require('express');
const app = express();

// 方式一：使用 cors 中间件
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',  // 允许的源，* 表示允许所有
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // 允许的方法
  allowedHeaders: ['Content-Type', 'Authorization'],  // 允许的头部
  credentials: true  // 允许携带 Cookie
}));

// 方式二：手动设置响应头
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);  // 预检请求直接返回
  } else {
    next();
  }
});
```

**Nginx 配置**：
```nginx
server {
    listen 80;
    server_name api.example.com;
    
    location / {
        # 允许的源
        add_header 'Access-Control-Allow-Origin' 'https://app.example.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 1728000 always;
        
        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        proxy_pass http://backend_server;
    }
}
```

#### 前端 withCredentials 配置

当需要携带 Cookie 或认证信息时，前后端都需要配置：

```javascript
// XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/data');
xhr.withCredentials = true;  // 允许携带 Cookie
xhr.send();

// Fetch API
fetch('https://api.example.com/data', {
  method: 'GET',
  credentials: 'include'  // 允许携带 Cookie
})
.then(response => response.json())
.then(data => console.log(data));

// Axios
axios.defaults.withCredentials = true;
// 或单条请求
axios.get('https://api.example.com/data', { withCredentials: true });
```

> **重要**：当 `withCredentials: true` 时，服务端**不能**将 `Access-Control-Allow-Origin` 设置为 `*`，必须指定具体的域名！

### 2.3 Flash 跨域（已废弃）

Flash 曾经提供 `crossdomain.xml` 机制来实现跨域。由于 Flash 已于 2020 年底停止支持，**此方法已不再推荐使用**。

如果维护遗留系统，只需了解 Flash 会读取目标域名根目录下的 `crossdomain.xml`：

```xml
<?xml version="1.0"?>
<cross-domain-policy>
    <allow-access-from domain="*.example.com" />
</cross-domain-policy>
```

### 2.4 服务端代理（反向代理）

通过在同源的服务器端设置代理，让服务器代替浏览器访问跨域资源，再将结果返回给浏览器。浏览器始终只与同源的代理服务器通信，完美避开跨域限制。

**实现方式**：

**（1）开发环境代理（Webpack DevServer）**：
```javascript
// vue.config.js 或 webpack.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',  // 目标 API 服务器
        changeOrigin: true,  // 改变请求源头
        pathRewrite: {
          '^/api': ''  // 重写路径：/api/users → /users
        },
        secure: false,  // 接受 https 自签名证书
        // 可选：添加自定义请求头
        headers: {
          'X-Custom-Header': 'foobar'
        }
      }
    }
  }
};
```

前端请求时代码无需任何特殊处理：
```javascript
// 直接请求同源的 /api 路径，实际被代理到 https://api.example.com
axios.get('/api/users').then(res => console.log(res));
```

**（2）生产环境 Nginx 反向代理**：
```nginx
server {
    listen 80;
    server_name app.example.com;
    
    # 前端静态资源
    location / {
        root /var/www/app;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api/ {
        proxy_pass https://api.example.com/;
        proxy_set_header Host api.example.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**（3）Node.js 代理服务器**：
```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', createProxyMiddleware({
  target: 'https://api.example.com',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  onProxyRes: function(proxyRes, req, res) {
    // 可在这里统一处理响应
  }
}));

app.listen(3000);
```

**代理方案的优缺点**：

| 优点 | 缺点 |
|:---|:---|
| 无需处理复杂的 CORS 配置 | 增加了一层网络转发，可能带来延迟 |
| 前端代码无需任何修改 | 需要额外的服务器资源 |
| 可以统一处理认证、日志、缓存等 | 需要配置和维护代理服务 |
| 隐藏了真实后端地址，更安全 | |

---

## 三、前端跨域通信（iframe 场景）

当页面中使用 `<iframe>` 嵌入不同源的页面时，两者之间直接的 JavaScript 访问会受到同源策略限制。以下是几种解决方案：

### 3.1 document.domain + iframe（仅限子域）

**适用场景**：主域相同，仅子域不同。如 `a.example.com` 和 `b.example.com`。

**原理**：将两个页面的 `document.domain` 都设置为主域 `example.com`，浏览器即认为它们同源。

**代码示例**：

`http://a.example.com/page.html`：
```html
<!DOCTYPE html>
<html>
<body>
  <iframe id="iframe" src="http://b.example.com/page.html"></iframe>
  <script>
    // 必须双方都设置
    document.domain = 'example.com';
    
    window.onload = function() {
      const iframe = document.getElementById('iframe');
      // 现在可以访问 iframe 的内容
      console.log(iframe.contentWindow.document.body.innerHTML);
    };
  </script>
</body>
</html>
```

`http://b.example.com/page.html`：
```html
<!DOCTYPE html>
<html>
<body>
  <p>我是 B 页面的内容</p>
  <script>
    document.domain = 'example.com';
    // 也可以访问父页面
    console.log(window.parent.document.title);
  </script>
</body>
</html>
```

> **限制**：
> - 只能用于**主域相同、子域不同**的场景
> - 设置 `document.domain` 后**不可逆**，且只能设置为当前域的父域
> - 现代浏览器中此方法逐渐被淘汰，建议优先使用 `postMessage`

### 3.2 location.hash + iframe

**原理**：利用 `location.hash` 的改变不会触发页面刷新，且可以被同域页面读取的特性。通过中间代理页实现跨域通信。

**架构**：
```
A页面 (a.com) 
  → iframe 嵌套 B页面 (b.com)
    → B页面 iframe 嵌套 C页面 (a.com/proxy.html)  // C与A同源
```

**代码示例**：

`http://a.com/a.html`（父页面）：
```html
<iframe id="iframe" src="http://b.com/b.html"></iframe>
<script>
  // 1. 向 B 页面传递数据
  const iframe = document.getElementById('iframe');
  
  function sendMessageToB(data) {
    // 通过修改 B 页面的 hash 来传递数据
    iframe.src = `http://b.com/b.html#${encodeURIComponent(JSON.stringify(data))}`;
  }
  
  // 2. 监听 C 代理页面传回的数据
  function checkHash() {
    const hash = location.hash;
    if (hash && hash.length > 1) {
      const data = JSON.parse(decodeURIComponent(hash.substring(1)));
      console.log('收到 B 页面的回复:', data);
      location.hash = '';  // 清理 hash
    }
  }
  
  setInterval(checkHash, 100);  // 轮询监听 hash 变化
  sendMessageToB({ action: 'getUserInfo', userId: 123 });
</script>
```

`http://b.com/b.html`（跨域子页面）：
```html
<script>
  // 1. 监听 hash 变化，获取 A 页面传来的数据
  window.onhashchange = function() {
    const hash = location.hash.substring(1);
    const data = JSON.parse(decodeURIComponent(hash));
    console.log('收到 A 页面的消息:', data);
    
    // 2. 处理数据后，通过同域的 C 页面将结果传回 A
    const result = { status: 'success', userInfo: { name: '张三', age: 25 } };
    
    // C 页面与 A 页面同源（都在 a.com 下）
    const proxyIframe = document.createElement('iframe');
    proxyIframe.src = `http://a.com/proxy.html#${encodeURIComponent(JSON.stringify(result))}`;
    document.body.appendChild(proxyIframe);
  };
</script>
```

`http://a.com/proxy.html`（代理页面，与 A 同源）：
```html
<script>
  // 读取 hash 数据，传递给父页面（A）
  const hash = location.hash;
  if (window.parent !== window) {
    window.parent.parent.location.hash = hash;  // 跨两层 iframe 传给 A
  }
</script>
```

> **缺点**：
> - 实现复杂，需要三个页面配合
> - 使用轮询监听 hash，性能较差
> - 数据暴露在 URL 中，有长度限制且不安全
> - **已过时**，仅作为了解

### 3.3 window.name

**原理**：`window.name` 属性有一个特殊特性——页面跳转后它的值保持不变，且没有同源限制。利用这一特性可以实现跨域数据传递。

**代码示例**：

`http://a.com/a.html`（父页面）：
```html
<iframe id="iframe" src="http://b.com/b.html"></iframe>
<script>
  let state = 0;
  const iframe = document.getElementById('iframe');
  
  iframe.onload = function() {
    if (state === 0) {
      // 第一次加载：B 页面正在设置 window.name
      // 将 iframe 指向同源的代理页面，以便读取 name
      iframe.src = 'http://a.com/proxy.html';
      state = 1;
    } else if (state === 1) {
      // 第二次加载：现在可以读取到 window.name 了
      console.log('获取到数据:', iframe.contentWindow.name);
      // 数据使用完后清理
      iframe.contentWindow.name = '';
    }
  };
</script>
```

`http://b.com/b.html`（数据页面）：
```html
<script>
  // 将要传递的数据写入 window.name
  window.name = JSON.stringify({
    users: [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' }
    ],
    total: 100
  });
</script>
```

`http://a.com/proxy.html`（空白代理页，仅用于切换同源）：
```html
<!DOCTYPE html>
<html>
<body></body>
</html>
```

> **缺点**：
> - 需要 iframe 两次加载，体验不佳
> - `window.name` 只能存储字符串，且有大小限制（约 2MB）
> - 安全性较低，其他脚本也能修改 `window.name`
> - **已过时**，建议用 `postMessage` 替代

### 3.4 postMessage（推荐）

`postMessage` 是 HTML5 引入的现代跨域通信 API，是目前**最推荐**的跨域通信方案。它安全、简洁、功能强大。

**API 说明**：

```javascript
// 发送消息
otherWindow.postMessage(message, targetOrigin, [transfer]);

/**
 * @param {any} message - 要发送的数据（会被结构化克隆算法序列化）
 * @param {string} targetOrigin - 目标窗口的源，如 'http://example.com'，'*' 表示不限制
 * @param {Transferable[]} [transfer] - 可选，可转移对象
 */

// 接收消息
window.addEventListener('message', function(event) {
  // event.source - 发送消息的窗口引用
  // event.origin - 发送消息的源（协议+域名+端口）
  // event.data - 接收到的数据
});
```

**代码示例**：

`http://a.com/parent.html`（父页面）：
```html
<iframe id="iframe" src="http://b.com/child.html"></iframe>
<script>
  const iframe = document.getElementById('iframe');
  
  // 等待 iframe 加载完成
  iframe.onload = function() {
    // 向子页面发送消息
    iframe.contentWindow.postMessage(
      { type: 'REQUEST_USER_INFO', userId: 123 },
      'http://b.com'  // 明确指定目标源，不要使用 *
    );
  };
  
  // 监听子页面的回复
  window.addEventListener('message', function(event) {
    // 必须验证消息来源！
    if (event.origin !== 'http://b.com') return;
    
    // 验证消息类型
    if (event.data.type === 'USER_INFO_RESPONSE') {
      console.log('收到用户信息:', event.data.payload);
    }
  });
</script>
```

`http://b.com/child.html`（iframe 子页面）：
```javascript
// 监听父页面的消息
window.addEventListener('message', function(event) {
  // 安全校验：验证消息来源
  if (event.origin !== 'http://a.com') {
    console.warn('收到来自未知源的消息:', event.origin);
    return;
  }
  
  const { type, userId } = event.data;
  
  if (type === 'REQUEST_USER_INFO') {
    // 处理请求
    const userInfo = getUserInfo(userId);
    
    // 回复父页面
    event.source.postMessage(
      { 
        type: 'USER_INFO_RESPONSE', 
        payload: userInfo 
      },
      event.origin  // 使用 event.origin 确保回复到正确的源
    );
  }
});

function getUserInfo(id) {
  return { id, name: '张三', email: 'zhangsan@example.com' };
}
```

**`postMessage` 安全最佳实践**：

```javascript
window.addEventListener('message', function(event) {
  // 1. 始终验证消息来源
  if (!['https://trusted-parent.com', 'https://partner.com'].includes(event.origin)) {
    return;
  }
  
  // 2. 验证数据格式（防止注入攻击）
  if (!event.data || typeof event.data !== 'object') return;
  
  // 3. 使用白名单校验消息类型
  const ALLOWED_TYPES = ['USER_INFO', 'SETTINGS', 'LOGOUT'];
  if (!ALLOWED_TYPES.includes(event.data.type)) return;
  
  // 4. 处理消息
  handleMessage(event.data, event.source, event.origin);
});
```

**各 iframe 跨域方案对比**：

| 方案 | 适用场景 | 双向通信 | 浏览器兼容性 | 推荐度 |
|:---|:---|:---|:---|:---|
| `document.domain` | 仅子域不同 | 支持 | 所有浏览器 | 逐渐淘汰 |
| `location.hash` | 任意跨域 | 支持 | 所有浏览器 | 已过时 |
| `window.name` | 任意跨域 | 单向 | 所有浏览器 | 已过时 |
| `postMessage` | 任意跨域 | 支持 | IE8+ | 强烈推荐 |

---

## 四、其他跨域解决方案

### 4.1 WebSocket

WebSocket 协议本身不受同源策略限制，它的跨域控制通过服务端在握手阶段检查 `Origin` 头部来实现。

```javascript
// 客户端
const ws = new WebSocket('wss://api.example.com/socket');

ws.onopen = () => {
  ws.send(JSON.stringify({ action: 'subscribe', channel: 'notifications' }));
};

ws.onmessage = (event) => {
  console.log('收到消息:', JSON.parse(event.data));
};

// Node.js 服务端（ws 库）
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  // 验证 Origin
  const origin = req.headers.origin;
  const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
  
  if (!allowedOrigins.includes(origin)) {
    ws.close();
    return;
  }
  
  ws.on('message', (message) => {
    console.log('收到:', message.toString());
  });
});
```

### 4.2 跨域图片与 Canvas

当 Canvas 使用跨域图片时，需要设置 `crossOrigin` 属性：

```javascript
const img = new Image();
img.crossOrigin = 'anonymous';  // 或使用 'use-credentials'
img.onload = function() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  // 如果未设置 crossOrigin，以下操作会抛出 SECURITY_ERR
  const dataURL = canvas.toDataURL();  // 导出图片
  const pixel = ctx.getImageData(0, 0, 1, 1);  // 读取像素
};
img.src = 'https://cdn.example.com/image.jpg';
```

服务端需要返回 CORS 图片头：
```
Access-Control-Allow-Origin: *
```

---

## 五、方案选择建议

### 5.1 决策流程图

```
是否需要 iframe 跨域通信？
├── 否（AJAX 请求跨域）
│   ├── 有服务端控制权？→ 使用 CORS（推荐）
│   ├── 仅开发环境？→ 配置开发服务器代理
│   ├── 生产环境无服务端权限？→ 搭建 Nginx/Node 代理
│   └── 兼容 IE9-？→ JSONP（不推荐）
│
└── 是（iframe 跨域通信）
    ├── 主域相同仅子域不同？→ document.domain 或 postMessage
    └── 完全不同域？→ postMessage（强烈推荐）
```

### 5.2 推荐方案总结

| 场景 | 首选方案 | 备选方案 |
|:---|:---|:---|
| 现代 Web 应用 API 请求 | CORS | 反向代理 |
| 前端开发调试 | DevServer Proxy | — |
| 微前端/嵌入第三方页面 | postMessage | — |
| 遗留系统维护（IE 兼容） | JSONP / Flash | — |
| 实时双向通信 | WebSocket | SSE（Server-Sent Events）|

---

## 六、安全注意事项

1. **CORS 不是安全机制**：CORS 只是浏览器的访问控制机制，不能替代身份认证和权限校验。服务端仍需验证用户身份。

2. **不要滥用 `Access-Control-Allow-Origin: ***`：在生产环境中，尽量明确指定允许的域名，尤其是涉及敏感数据或需要携带 Cookie 时。

3. **`postMessage` 必须验证 `origin`**：接收方一定要检查 `event.origin`，避免处理来自恶意网站的消息。

4. **避免使用已废弃的方案**：JSONP、`location.hash`、`window.name` 等方法存在安全风险或兼容性问题，新项目应避免使用。

5. **使用 HTTPS**：生产环境务必启用 HTTPS，防止中间人攻击篡改 CORS 头部。

---

## 参考与扩展阅读

- [MDN - 同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [MDN - 跨域资源共享（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [MDN - Window.postMessage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)
- [MDN - WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
