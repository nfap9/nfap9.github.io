---
title: Docker 与 Docker Compose 实战指南
description: 以 tenant-hub 项目为例，讲解 Docker 容器化与 Docker Compose 多容器编排的实际应用
category: 工程化
tags: [docker, docker-compose, 容器化, 部署, 运维, 工程化]
pubDate: 2026-06-17
updatedDate: 2026-06-17
---

> 本文以 [tenant-hub](https://github.com/nfap9/tenant-hub) 项目（公寓物业管理系统）为例，讲解 Docker 和 Docker Compose 的实际使用。该项目使用 pnpm monorepo 架构，包含后端 API、前端 Web 和小程序三个应用。

---

## 核心概念

**镜像（Image）**

镜像是一个只读模板，包含运行应用所需的完整文件系统、依赖库和配置。基于 Dockerfile 构建生成。每一层构建指令创建一个新层，Docker 通过层缓存加速重复构建。

**容器（Container）**

容器是镜像的运行实例。拥有独立的进程空间、文件系统和网络，但共享宿主机内核。相比虚拟机，容器启动更快、资源占用更少。

**卷（Volume）**

容器停止后数据会丢失。卷用于将容器内的数据持久化到宿主机，或者在容器之间共享数据。

---

## 安装配置

### Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### macOS

```bash
brew install --cask docker
```

安装完启动 Docker Desktop 应用，确保 daemon 在运行。

### 验证

```bash
docker --version
docker compose version
```

### 免 sudo 使用

```bash
sudo usermod -aG docker $USER
newgrp docker
```

`newgrp docker` 使当前终端立即生效，其他终端需重新登录。

---

## Docker 核心命令

### 镜像操作

```bash
docker search nginx          # 搜索镜像
docker pull nginx:latest     # 拉取镜像
docker images                # 列出本地镜像
docker rmi nginx:latest      # 删除镜像
docker history nginx:latest  # 查看构建层
```

### 容器操作

```bash
# 前台运行
docker run -it nginx

# 后台运行，端口映射
docker run -d -p 8080:80 --name my-nginx nginx

# 参数说明
# -it      交互式 + 伪终端
# -d       后台运行
# -p 8080:80  端口映射（宿主机:容器）
# -v       卷挂载
# --name   指定容器名
# --rm     停止后自动删除
# -e       环境变量

docker ps                    # 查看运行中容器
docker ps -a                 # 查看所有容器

docker stop my-nginx         # 停止
docker start my-nginx        # 启动
docker restart my-nginx      # 重含

docker logs -f my-nginx      # 查看日志
docker exec -it my-nginx /bin/bash  # 进入容器

docker rm my-nginx           # 删除
docker rm -f my-nginx        # 强制删除运行中容器
```

### 卷管理

```bash
docker volume create my-data          # 创建命名卷
docker volume ls                      # 列表
docker run -d -v my-data:/data nginx  # 挂载卷
docker run -d -v $(pwd)/data:/app/data nginx  # 绑定挂载
docker volume prune                   # 清理未使用卷
```

绑定挂载将宿主机目录直接映射到容器，开发时常用。生产环境建议使用 Docker 管理的命名卷，避免宿主机与容器权限不一致的问题。

### 网络管理

```bash
docker network ls                              # 列表
docker network create my-network               # 创建
docker run -d --network my-network --name web nginx  # 指定网络
docker network inspect my-network              # 详情
```

自定义网络中，容器通过服务名互访，无需记录 IP。

---

## Dockerfile 编写

以 tenant-hub 项目的后端 API 为例。该项目使用 pnpm monorepo，需要在工作空间中管理多个子项目的依赖。

### 后端 API Dockerfile

```dockerfile
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN sed -i 's|dl-cdn.alpinelinux.org|mirrors.aliyun.com|g' /etc/apk/repositories \
  && corepack enable \
  && apk add --no-cache openssl wget
WORKDIR /app

FROM base AS deps
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS development
COPY apps/api apps/api
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @tenant-hub/api prisma generate && pnpm --filter @tenant-hub/api dev"]

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @tenant-hub/api prisma generate
RUN pnpm --filter @tenant-hub/api build

FROM base AS production
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --prod
RUN pnpm --filter @tenant-hub/api prisma generate
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]
```

### 关键细节

**多阶段构建**

该 Dockerfile 定义了 5 个阶段：

1. **base** —— 基础镜像，设置 pnpm 环境和安装系统依赖（openssl、wget）
2. **deps** —— 安装生产依赖，利用缓存加速
3. **development** —— 开发环境，包含 Prisma generate 和 dev 命令
4. **build** —— 构建产物
5. **production** —— 生产环境，仅包含构建产物和生产依赖，体积最小

**层缓存优化**

先复制依赖文件（`package.json`、`pnpm-lock.yaml`），再复制代码。这样代码修改时，依赖层缓存不会失效，构建速度大幅提升。

**生产环境启动**

```
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]
```

生产环境启动时先执行数据库迁移，确保数据库 schema 与代码一致，然后启动应用。

### 前端 Web Dockerfile

```dockerfile
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/tenant-web/package.json apps/tenant-web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS development
COPY apps/tenant-web apps/tenant-web
EXPOSE 5173
CMD ["pnpm", "--filter", "@tenant-hub/tenant-web", "dev"]

FROM deps AS build
ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY apps/tenant-web apps/tenant-web
RUN pnpm --filter @tenant-hub/tenant-web build

FROM nginx:1.27-alpine AS production
COPY apps/tenant-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/tenant-web/dist /usr/share/nginx/html
EXPOSE 80
```

前端构建产物是静态文件，最终用 Nginx 作为静态服务器。构建时通过 `ARG` 传入 API 基础地址，生成环境相关的静态资源。

---

## Docker Compose 多容器编排

### 基础结构

以下是 tenant-hub 项目的生产环境 Compose 配置：

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: tenant-hub-postgres
    restart: unless-stopped
    env_file:
      - .env.production
    environment:
      POSTGRES_DB: tenant_hub
      POSTGRES_USER: postgres
    volumes:
      - /home/ubuntu/tenant-hub-data/postgres:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: production
    container_name: tenant-hub-api
    restart: unless-stopped
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/tenant_hub?schema=public
    ports:
      - '4000:4000'
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD-SHELL', 'wget -qO- http://localhost:4000/health || exit 1']
      interval: 10s
      timeout: 3s
      retries: 12

  tenant-web:
    build:
      context: .
      dockerfile: apps/tenant-web/Dockerfile
      target: production
      args:
        - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    container_name: tenant-hub-tenant-web
    restart: unless-stopped
    ports:
      - '80:80'
    depends_on:
      api:
        condition: service_healthy
    healthcheck:
      test: ['CMD-SHELL', 'wget -qO- http://localhost:80/ || exit 1']
      interval: 10s
      timeout: 3s
      retries: 12
```

### 服务依赖

配置中使用了 `depends_on` 的 `condition: service_healthy` 语法：

- `tenant-web` 等待 `api` 健康后才启动
- `api` 等待 `postgres` 健康后才启动

这样确保服务启动顺序正确，应用不会在数据库还未就绪时尝试连接。

### 环境变量管理

敏感配置放在 `.env.production` 文件中：

```
POSTGRES_PASSWORD=*** =***
```

通过 `env_file` 引入到各个服务，配置与代码分离。

---

## 核心命令

```bash
# 启动所有服务（前台）
docker compose up

# 后台启动
docker compose up -d

# 重新构建镜像并启动（代码变更后）
docker compose up -d --build

# 查看日志
docker compose logs -f
docker compose logs -f api  # 仅查看 api 服务

# 停止并删除容器
docker compose down

# 停止并删除容器 + 卷（数据丢失）
docker compose down -v

# 查看状态
docker compose ps

# 进入容器
docker compose exec api /bin/sh

# 重启单个服务
docker compose restart api
```

---

## 生产环境注意事项

### 日志限制

Docker 默认日志驱动无限增长，必须限制：

```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

或全局配置 `/etc/docker/daemon.json`：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

修改后 `sudo systemctl restart docker` 生效。注意此操作会停止所有容器。

### 数据库备份

```bash
# 备份
docker compose exec db pg_dump -U postgres tenant_hub > backup.sql

# 恢复
docker compose exec -T db psql -U postgres tenant_hub < backup.sql
```

`-T` 禁用 TTY 分配，避免 stdin 交互问题。

定时备份脚本：

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T db pg_dump -U postgres tenant_hub > /backup/tenant_hub_${DATE}.sql
find /backup -name "tenant_hub_*.sql" -mtime +7 -delete
```

### 时区配置

容器默认 UTC 时区。同步宿主机时区：

```yaml
services:
  api:
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
```

### 端口冲突

如果 80/443 被宿主机进程占用，可修改端口映射：

```yaml
ports:
  - "8080:80"
```

或者停止宿主机已有服务：

```bash
sudo lsof -i :80
sudo ss -tlnp | grep 80
```

### 数据库连接问题

`depends_on` 仅保证容器启动顺序，不保证服务 ready。如果应用在数据库初始化期间尝试连接，会报错。

解决方案：

1. 在应用层实现重试逻辑
2. 添加 wait 脚本：

```bash
#!/bin/sh
until nc -z postgres 5432; do
  echo "Waiting for PostgreSQL..."
  sleep 1
done
exec "$@"
```

在 Dockerfile 中 CMD 改为 `CMD ["./wait-for-db.sh", "node", "dist/server.js"]`

### 权限管理

生产环境不建议使用绑定挂载。宿主机目录权限与容器内用户可能不一致，导致应用无法读写文件。优先使用 Docker 管理的命名卷。

---

## 常用维护

### 清理空间

```bash
docker container prune     # 删除已停止容器
docker image prune -a      # 删除未使用镜像
docker volume prune        # 删除未使用卷
docker system prune -a --volumes  # 一键清理（慎用）
```

执行前建议 `docker system df` 查看磁盘占用。

### 查看资源占用

```bash
docker stats
```

实时显示所有容器的 CPU、内存、网络、IO 使用情况。

### 镜像导出导入

```bash
docker save -o tenant-hub.tar tenant-hub-api:latest

# 在目标机器加载
docker load -i tenant-hub.tar
```

适用于内网环境无法直接 `docker pull` 的场景。

---

## 总结

Docker 的核心价值在于环境一致性和快速部署。以 tenant-hub 项目为例，实际使用流程为：

1. 编写 Dockerfile 定义构建流程（多阶段构建、层缓存优化）
2. 编写 docker-compose.yml 定义服务编排（应用、数据库、前端、依赖关系）
3. 使用 `docker compose up -d --build` 构建并启动整个技术栈
4. 生产环境配置日志限制、健康检查、数据备份

学习路径建议先掌握单容器运行，再引入 Compose 处理多服务协作。具体问题查阅官方文档比通读大全更有效。
