# CaptureOS-Plus — 个人资产管理系统

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.137-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker">
</p>

> 一个全栈个人知识与资产管理平台，帮助你系统化地记录、关联、管理和复盘工作与学习中的各类信息。支持一键 Docker Compose 部署，开箱即用。

---

## 🎯 项目简介

在日常工作和学习中，我们经常会遇到以下问题：

- 做过的项目没有记录，下次遇到类似问题还要重新摸索
- 踩过的坑没有总结，同样的错误反复出现
- 学到的知识散落在各处，需要时找不到
- 重要决策的过程和理由没有保存，事后无法复盘
- 问题、方案、知识、决策之间缺少关联，信息成为孤岛

**CaptureOS** 就是为了解决这些问题而设计的。它是一个 **个人资产管理系统**，让你能够：

- 📁 管理项目全生命周期
- 💡 记录和沉淀经验教训
- ⚠️ 追踪和解决遇到的问题
- 🔧 保存有效的解决方案
- 📚 建立个人知识库
- 🎯 记录重要决策的过程
- 📝 定期复盘和持续改进
- 🔗 **将所有实体关联起来，形成完整的成长链路**

---

## ✨ 功能特性

### 核心模块

| 模块 | 功能描述 |
|------|----------|
| 📁 **项目管理** | 创建和跟踪项目，记录状态、优先级、时间线 |
| 💡 **经验记录** | 记录学习经验、背景、结果和教训 |
| ⚠️ **问题追踪** | 记录问题详情、状态、根本原因和发现时间 |
| 🔧 **解决方案** | 保存问题解决方法、实施效果和有效性评分 |
| 📚 **知识库** | 积累知识，按分类整理，记录来源和置信度 |
| 🎯 **决策记录** | 记录决策背景、选项、理由和最终结果 |
| 📝 **复盘总结** | 记录复盘摘要、成功/失败因素和改进措施 |

### 关联系统（核心能力）

| 功能 | 描述 |
|------|------|
| 🔗 **实体关联** | 任意实体之间可建立关联（问题→方案→知识→决策→复盘） |
| 📋 **详情页** | 每个实体都有独立详情页，展示完整信息和关联关系 |
| 💡 **智能推荐** | 基于共享标签自动推荐可能关联的实体 |
| 🔗 **关联管理** | 在详情页中创建、查看、删除关联关系 |
| 📁 **项目中心** | 项目详情页聚合展示该项目下的所有关联实体 |

### 辅助功能

| 功能 | 描述 |
|------|------|
| 🏷️ **标签系统** | 为任意实体添加标签，灵活分类，支持等级标记 |
| 📅 **时间线** | 支持链路视图（折叠展示关联链路）和列表视图 |
| 🔍 **全文搜索** | 基于 PostgreSQL tsvector 的高性能全文检索 |
| 📊 **仪表盘** | 查看各模块统计和最近更新 |

---

## 🛠️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (Next.js)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │ 仪表盘  │ │ CRUD页面│ │ 详情页  │ │  关联管理     │  │
│  │         │ │ + 列表  │ │ + 标签  │ │  推荐 + 搜索  │  │
│  └─────────┘ └─────────┘ └─────────┘ └───────────────┘  │
│                    React 19 + TailwindCSS                │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────┴───────────────────────────────┐
│                    后端 (FastAPI)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │   API   │ │Suggesti-│ │Entity   │ │   Timeline    │  │
│  │  CRUD   │ │ons API  │ │Relations│ │   Chains      │  │
│  └─────────┘ └─────────┘ └─────────┘ └───────────────┘  │
│              SQLAlchemy 2.0 (Async) + Pydantic           │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                   数据库 (PostgreSQL)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │ 7 实体  │ │  Tags   │ │Relations│ │  GIN 全文索引  │  │
│  │  表     │ │(多态)   │ │(多态图) │ │  + B-tree     │  │
│  └─────────┘ └─────────┘ └─────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 技术栈详情

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | Next.js | 15.x | React SSR/SSG 框架 |
| **UI 库** | React | 19.x | 用户界面组件 |
| **样式** | TailwindCSS | 3.4+ | 原子化 CSS 框架 |
| **数据获取** | SWR | 2.x | 数据缓存和实时更新 |
| **后端框架** | FastAPI | 0.137+ | 高性能异步 API |
| **ORM** | SQLAlchemy | 2.0+ | 异步数据库操作 |
| **数据验证** | Pydantic | 2.x | 请求/响应数据验证 |
| **数据库迁移** | Alembic | latest | 版本化数据库变更 |
| **数据库** | PostgreSQL | 16 | 关系型数据库 + GIN 全文索引 |
| **异步驱动** | asyncpg | latest | 异步 PostgreSQL 驱动 |
| **容器化** | Docker Compose | v2+ | 多服务编排部署 |

---

## 🚀 快速开始

### 前置要求

- **Docker** 20.10+
- **Docker Compose** v2.0+

---

### 部署方式一：预构建镜像（推荐，最快）

从阿里云镜像仓库直接拉取，国内 CDN 加速，无需本地构建。

```bash
# 1. 克隆项目
git clone https://github.com/CAPTURE760/CaptureOS-plus.git
cd CaptureOS-plus

# 2. 启动
docker compose -f docker-compose.pull.yml up -d

# 3. 运行数据库迁移
docker compose -f docker-compose.pull.yml exec backend alembic upgrade head
```

**后续更新：**

```bash
# 拉取最新版本并重启
docker compose -f docker-compose.pull.yml pull
docker compose -f docker-compose.pull.yml up -d

# 拉取指定版本（如 v1.1）
# Linux / macOS / WSL / Git Bash：
BACKEND_TAG=v1.1 FRONTEND_TAG=v1.1 docker compose -f docker-compose.pull.yml pull
BACKEND_TAG=v1.1 FRONTEND_TAG=v1.1 docker compose -f docker-compose.pull.yml up -d
# Windows PowerShell：
$env:BACKEND_TAG="v1.1"; $env:FRONTEND_TAG="v1.1"; docker compose -f docker-compose.pull.yml pull
$env:BACKEND_TAG="v1.1"; $env:FRONTEND_TAG="v1.1"; docker compose -f docker-compose.pull.yml up -d

# 查看所有可用版本
# Linux / macOS / WSL：
curl -s https://crpi-d5nm65il20pptret.cn-hangzhou.personal.cr.aliyuncs.com/v2/captureos/captureos-backend/tags/list
# Windows PowerShell：
curl.exe -s https://crpi-d5nm65il20pptret.cn-hangzhou.personal.cr.aliyuncs.com/v2/captureos/captureos-backend/tags/list
```

| 标签 | 含义 | 使用场景 |
|------|------|----------|
| `latest` | 最新版本（默认） | 日常使用，始终获取最新功能 |
| `v1.0`、`v1.1`... | 固定版本 | 回滚到稳定版本，或锁定特定版本 |

---

### 部署方式二：源码构建（适合开发者）

本地构建镜像，支持热重载，代码修改后自动生效。

```bash
# 1. 克隆项目
git clone https://github.com/CAPTURE760/CaptureOS-plus.git
cd CaptureOS-plus

# 2. 启动（首次构建约 5-10 分钟）
docker compose up -d

# 3. 运行数据库迁移
docker compose exec backend alembic upgrade head
```

**后续更新（代码有改动时）：**

```bash
git pull
docker compose up -d --build
docker compose exec backend alembic upgrade head  # 有新迁移时执行
```

**本地开发常用命令：**

```bash
docker compose logs -f backend     # 后端日志
docker compose logs -f frontend    # 前端日志
docker compose up -d --build backend  # 重建单个服务
docker compose down                # 停止所有服务
docker compose down -v             # 停止并删除数据（危险！）
```

---

### 两种部署方式对比

| | 预构建镜像 | 源码构建 |
|--|-----------|---------|
| **首次启动** | 2-3 分钟 | 5-10 分钟 |
| **后续更新** | `pull` 秒级 | `build` 1-2 分钟 |
| **热重载** | ❌ 改代码要重新推送 | ✅ 自动生效 |
| **适合谁** | 普通用户 | 需要改代码的开发者 |

---

## 🖥️ 运行方式

部署完成后，根据你的系统选择启动方式：

### Linux / macOS / WSL

```bash
cd ~/CaptureOS
docker compose up -d       # 预构建镜像用：docker compose -f docker-compose.pull.yml up -d
```

### Windows 一键启动

将 `start.bat` 放到桌面，双击即可自动完成：启动 Docker → 启动服务 → 打开浏览器。

> 首次使用需修改 bat 文件中 Docker Desktop 路径为你的实际安装路径。

**start.bat：**

```bat
@echo off
chcp 65001 >nul
title CaptureOS 启动器
set DOCKER_PATH=D:\Docker\Docker Desktop.exe

echo [1/4] 检查 Docker Desktop...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I "Docker Desktop.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    start "" "%DOCKER_PATH%"
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% NEQ 0 goto wait_docker
)

echo [2/4] 启动 CaptureOS 服务...
wsl -e bash -c "cd ~/CaptureOS && docker compose up -d"

echo [3/4] 等待服务就绪...
:wait_service
timeout /t 3 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto wait_service

echo [4/4] 打开浏览器...
start http://localhost:3000
pause
```

### 手机 / 局域网访问

同一局域网内的手机或其他设备可以通过电脑 IP 访问：

```bash
# 查看电脑局域网 IP
# Linux / macOS / WSL：
ip addr | grep "inet " | grep -v 127.0.0.1
# Windows PowerShell：
ipconfig | findstr "IPv4"

# 手机浏览器访问
http://192.168.1.100:3000
```

> 前端会自动检测访问地址，动态请求后端 API，无需额外配置。

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 🖥️ **前端界面** | http://localhost:3000 | 主应用界面 |
| 🔌 **后端 API** | http://localhost:8001/api | REST API |
| 📖 **API 文档** | http://localhost:8001/docs | Swagger 交互文档 |
| 📖 **API 文档** | http://localhost:8001/redoc | ReDoc 文档 |

---

## 📁 项目结构

```
CaptureOS-plus/
├── backend/                          # 后端服务
│   ├── app/
│   │   ├── api/                      # API 路由层
│   │   │   ├── __init__.py          # 路由注册
│   │   │   ├── base.py              # 通用 CRUD 工厂
│   │   │   ├── deps.py              # 依赖注入
│   │   │   ├── projects.py          # 项目接口 (+ /related)
│   │   │   ├── experiences.py       # 经验接口 (+ /related)
│   │   │   ├── issues.py            # 问题接口 (+ /related)
│   │   │   ├── solutions.py         # 解决方案接口 (+ /related)
│   │   │   ├── knowledge.py         # 知识接口 (+ /related)
│   │   │   ├── decisions.py         # 决策接口 (+ /related)
│   │   │   ├── reviews.py           # 复盘接口 (+ /related)
│   │   │   ├── tags.py              # 标签接口
│   │   │   ├── relations.py         # 关系接口
│   │   │   ├── suggestions.py       # 关联推荐接口
│   │   │   ├── entity_relations.py  # 实体关联公共逻辑
│   │   │   ├── search.py            # 全文搜索接口 (tsvector)
│   │   │   ├── timeline.py          # 时间线接口 (+ 链路聚合)
│   │   │   └── dashboard.py         # 仪表盘接口
│   │   ├── models/                   # 数据库模型
│   │   ├── schemas/                  # Pydantic 数据模式
│   │   ├── config.py                # 配置管理
│   │   ├── database.py              # 数据库连接
│   │   └── main.py                  # FastAPI 入口
│   ├── alembic/                      # 数据库迁移
│   │   └── versions/
│   │       ├── 001_initial_tables.py # 初始表结构
│   │       └── 002_add_indexes_and_fts.py  # 索引 + 全文检索
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/                         # 前端服务
│   ├── src/
│   │   ├── app/                      # Next.js 页面
│   │   │   ├── page.tsx             # 仪表盘
│   │   │   ├── layout.tsx           # 布局
│   │   │   ├── projects/            # 项目页面
│   │   │   │   ├── page.tsx         # 列表页
│   │   │   │   └── [id]/page.tsx    # 详情页 (Project Hub)
│   │   │   ├── issues/              # 问题页面
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx    # 详情页
│   │   │   ├── solutions/           # 解决方案页面
│   │   │   ├── knowledge/           # 知识页面
│   │   │   ├── decisions/           # 决策页面
│   │   │   ├── reviews/             # 复盘页面
│   │   │   ├── experiences/         # 经验页面
│   │   │   ├── tags/                # 标签页面
│   │   │   ├── timeline/            # 时间线页面 (链路/列表)
│   │   │   └── search/              # 搜索页面
│   │   ├── components/               # 共享组件
│   │   │   ├── Sidebar.tsx          # 侧边栏导航
│   │   │   ├── EntityForm.tsx       # 通用表单组件
│   │   │   ├── EntityList.tsx       # 通用列表组件
│   │   │   ├── EntityDetail.tsx     # 通用详情页组件
│   │   │   ├── RelationPicker.tsx   # 关联选择弹窗
│   │   │   ├── SuggestionBar.tsx    # 关联推荐提示栏
│   │   │   └── TagPicker.tsx        # 标签选择弹窗
│   │   └── lib/
│   │       ├── api.ts               # API 工具函数
│   │       └── time.ts              # 时间格式化
│   ├── Dockerfile
│   ├── next.config.js
│   └── package.json
├── docker-compose.yml              # 源码构建配置
├── docker-compose.pull.yml         # 预构建镜像配置
├── start.bat                       # Windows 一键启动脚本
├── push.sh                         # 构建+推送镜像脚本（开发者用）
├── .gitignore
└── README.md
```

---

## 📡 API 接口

### 实体 CRUD 接口

每个实体模块都支持标准的 CRUD 操作 + 关联查询：

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/{entities}/` | `GET` | 获取列表（支持分页） |
| `/api/{entities}/` | `POST` | 创建 |
| `/api/{entities}/{id}` | `GET` | 获取单条 |
| `/api/{entities}/{id}` | `PUT` | 更新 |
| `/api/{entities}/{id}` | `DELETE` | 删除 |
| `/api/{entities}/count/` | `GET` | 获取总数 |
| `/api/{entities}/{id}/related` | `GET` | **获取所有关联实体** |

> `{entities}` 可选：projects, experiences, issues, solutions, knowledge, decisions, reviews

### 关联推荐接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/suggestions/{type}/{id}` | `GET` | 基于共享标签推荐可能关联的实体 |

### 关系管理接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/relations/` | `GET` | 查询关联（支持 source/target 过滤） |
| `/api/relations/` | `POST` | 创建关联 |
| `/api/relations/{id}` | `DELETE` | 删除关联 |
| `/api/relations/types/` | `GET` | 获取关系类型 |

### 其他接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/tags/` | `GET/POST` | 标签管理 |
| `/api/tags/assign` | `POST` | 给实体打标签 |
| `/api/search/?q=` | `GET` | 全文搜索（PostgreSQL tsvector） |
| `/api/timeline/` | `GET` | 时间线（扁平列表） |
| `/api/timeline/chains` | `GET` | **时间线链路聚合** |
| `/api/dashboard/` | `GET` | 仪表盘数据 |

### 预设关系类型

系统内置 8 种关系类型：

| 关系 | 说明 | 反向 |
|------|------|------|
| `related_to` | 通用关联 | `related_to` |
| `depends_on` | 依赖于 | `depended_by` |
| `blocks` | 阻塞 | `blocked_by` |
| `caused_by` | 导致 | `causes` |
| `solved_by` | 被...解决 | `solves` |
| `learned_from` | 从...学到 | `taught_to` |
| `part_of` | 属于 | `contains` |
| `follows` | 继...之后 | `precedes` |

---

## 🔧 开发指南

### 本地开发

```bash
# 启动服务（源码构建，支持热重载）
docker compose up -d

# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 停止服务
docker compose down

# 重建镜像（代码修改后）
docker compose up -d --build
```

### 发布新版本

```bash
# 1. 代码修改并测试通过后，提交到 GitHub
git add . && git commit -m "feat: 新功能" && git push

# 2. 构建并推送到阿里云镜像仓库（自动递增版本号）
bash push.sh

# 3. 别人更新
docker compose -f docker-compose.pull.yml pull
docker compose -f docker-compose.pull.yml up -d
```

### 数据库操作

```bash
# 进入后端容器
docker compose exec backend bash

# 运行迁移
alembic upgrade head

# 创建新迁移（自动生成）
alembic revision --autogenerate -m "add new field"

# 回滚迁移
alembic downgrade -1
```

### 重置数据库

```bash
# 停止服务并删除数据
docker compose down -v

# 重新启动
docker compose up -d

# 重新运行迁移
docker compose exec backend alembic upgrade head
```

---

## 🐛 常见问题

### 1. 端口被占用

修改 `docker-compose.yml` 或 `docker-compose.pull.yml` 中的端口映射：

```yaml
services:
  backend:
    ports:
      - "8002:8000"  # 改为其他端口
  frontend:
    ports:
      - "3001:3000"  # 改为其他端口
```

### 2. 构建速度慢

**推荐方案**：使用预构建镜像，无需本地构建：
```bash
docker compose -f docker-compose.pull.yml up -d
```

### 3. 数据库连接失败

确保 PostgreSQL 容器已完全启动：

```bash
docker compose ps          # 检查容器状态
docker compose logs db     # 查看数据库日志
```

### 4. 手机/局域网访问加载不全

前端会自动根据访问地址请求后端 API。确保：
- 后端 CORS 已设置为允许所有来源（已默认配置）
- 使用电脑的局域网 IP 访问（如 `http://192.168.1.100:3000`）
- 不要用 `localhost`（手机上的 localhost 指向手机自身）

### 5. 如何回滚到旧版本

```bash
# 查看所有可用版本
# Linux / macOS / WSL：
curl -s https://crpi-d5nm65il20pptret.cn-hangzhou.personal.cr.aliyuncs.com/v2/captureos/captureos-backend/tags/list
# Windows PowerShell：
curl.exe -s https://crpi-d5nm65il20pptret.cn-hangzhou.personal.cr.aliyuncs.com/v2/captureos/captureos-backend/tags/list

# 回滚到指定版本（Linux / macOS / WSL / Git Bash）
BACKEND_TAG=v1.0 FRONTEND_TAG=v1.0 docker compose -f docker-compose.pull.yml pull
BACKEND_TAG=v1.0 FRONTEND_TAG=v1.0 docker compose -f docker-compose.pull.yml up -d

# 回滚到指定版本（Windows PowerShell）
$env:BACKEND_TAG="v1.0"; $env:FRONTEND_TAG="v1.0"; docker compose -f docker-compose.pull.yml pull
$env:BACKEND_TAG="v1.0"; $env:FRONTEND_TAG="v1.0"; docker compose -f docker-compose.pull.yml up -d

# 回滚到指定版本（Windows CMD）
set BACKEND_TAG=v1.0&& set FRONTEND_TAG=v1.0&& docker compose -f docker-compose.pull.yml pull
set BACKEND_TAG=v1.0&& set FRONTEND_TAG=v1.0&& docker compose -f docker-compose.pull.yml up -d
```

---

## 📋 项目演进记录

记录从项目启动到现在的每一次关键改动，以及背后的原因和效果。

### 第一阶段：基础 CRUD（v1）

**做了什么：** 建立了 7 个核心实体模块（项目、经验、问题、解决方案、知识、决策、复盘），每个模块支持标准的增删改查。使用通用 CRUD 工厂模式，后端一个函数生成 6 个 API 端点，前端一个 `EntityList` 组件渲染所有列表页。

**为什么：** 先把数据结构和基本操作跑通，再迭代优化。不追求一步到位。

**效果：** 能记录、能查看、能编辑、能删除。但各模块之间完全孤立，信息是散落的。

---

### 第二阶段：标签系统

**做了什么：** 建立了多态标签系统——任意实体都可以打标签。标签有名称、颜色、等级（1-5），通过 `entity_tags` 多态关联表连接。

**为什么：** 分类是组织信息的第一步。没有标签，7 个模块的数据就是一堆平铺的列表。

**效果：** 可以给问题打 `#部署`，给知识打 `#Docker`，给决策打 `#紧急`。标签成为后续关联推荐的基础。

---

### 第三阶段：实体关联 + 详情页

**做了什么：**
- 后端已有 `relations` 表和 8 种预置关系类型（solved_by、caused_by、learned_from 等），但前端从未使用
- 新建了 `EntityDetail` 通用详情页组件，展示实体完整信息 + 关联实体
- 新建了 `RelationPicker` 关联选择弹窗，支持创建和删除关联
- 新建了 `SuggestionBar` 推荐栏，基于共享标签自动推荐可能关联的实体
- 7 个实体都新增了 `GET /{id}/related` 聚合端点
- 列表页全部加入「查看」按钮，跳转到详情页

**为什么：** 信息孤岛是个人知识管理系统的致命问题。一个「Docker 502 问题」如果不能关联到「解决方案→知识→决策→复盘」，它就只是一条孤立的记录，没有形成成长链路。

**效果：** 问题详情页能看到"谁解决了它、沉淀了什么知识、做了什么决策"。信息从散点变成了网络。

---

### 第四阶段：数据库索引 + 全文搜索

**做了什么：**
- 为 7 张核心表创建了 GIN 全文索引（tsvector）
- 为 entity_tags.tag_id、issues.status、projects.status 等创建了 B-tree 索引
- 为所有日期字段创建了索引（Timeline 筛选用）
- 搜索 API 从 ILIKE 升级为 tsvector/tsquery 全文检索
- 后发现 tsvector 对中文分词无效（按空格分词，中文无空格），改回 ILIKE + pg_trgm 索引

**为什么：** 数据量增长后，没有索引的查询会变慢。全文搜索是找信息的核心能力。

**效果：** 搜索能精确匹配中文子串（搜"睡觉"能找到"早点睡觉"）。所有常见查询都有索引加速。

---

### 第五阶段：时间线 + 链路聚合

**做了什么：**
- 时间线从 5 种实体扩展到 7 种（加入 Solution 和 Knowledge）
- 新增 `/timeline/chains` 端点，用 Union-Find 算法把有关系的实体聚合成链路
- 前端支持「链路视图」和「列表视图」切换
- 链路视图中，关联的实体折叠成一条，点击展开看完整链路
- 加入快捷日期按钮（今天/本周/本月/全部）

**为什么：** 时间线不应该是散点图，而应该是成长轨迹。链路聚合让用户一眼看到"问题→方案→知识→决策→复盘"的完整因果链。

**效果：** 时间线从"一堆按时间排列的条目"变成了"有因有果的成长故事"。

---

### 第六阶段：仪表盘升级

**做了什么：**
- 从"数字墙"（7 个模块各显示一个总数）改为行动导向的四区块布局
- **待处理**：自动筛选待解决问题、待执行决策、待确认知识，可直接点击跳转
- **风险提醒**：自动检测孤立问题（无方案）、长期未更新项目、无来源知识
- **概览**：按状态分组计数（替代纯数字统计）
- **最近动态**：跨所有实体合并，按时间倒序

**为什么：** 仪表盘应该回答"我现在最应该关注什么"，而不是"数据库里有多少条数据"。

**效果：** 每次打开系统，第一眼就能看到需要处理的事项和被遗漏的风险。

---

### 第七阶段：字段优化

**做了什么：**
- 优先级从数字改为汉字标签（🔴紧急 🟠高 🟡中 🟢低），下拉选择
- 置信度从 0-1 小数改为 0-10 整数（输入 7 = 70%）
- 知识新增状态：待确认 / 已验证 / 已过时
- 决策新增状态：待执行 / 执行中 / 已完成 / 已废弃
- 新建时日期字段自动填今天
- 新建/编辑表单从内联卡片改为居中弹窗，支持点 × 和空白区域关闭

**为什么：** 数字优先级不直觉（1 是高还是低？），0-1 置信度要心算百分比，没有状态的知识和决策无法追踪生命周期。

**效果：** 表单填写更快更直觉，数据有状态流转，仪表盘能按状态筛选待处理事项。

---

### 第八阶段：搜索优化

**做了什么：**
- 搜索页加入类型筛选下拉框，可锁定只搜某一类实体
- 搜索结果按类型分组展示
- 搜索结果可点击跳转到详情页

**为什么：** 全局搜索结果混在一起时，找特定类型的内容很困难。

**效果：** 搜"Docker"可以只看问题，或只看知识，精准定位。

---

### 第九阶段：标签增强 + 交互优化 + 项目字段扩展

**做了什么：**
- **标签软删除**：新增 `is_active` 字段，有关联的标签删除时自动停用而非物理删除，保留历史数据完整性
- **删除前确认**：点击删除标签时显示关联实体数量，让用户知道影响范围
- **标签创建智能恢复**：创建同名标签时自动恢复已停用的标签，而非报错
- **搜索支持标签筛选**：搜索页新增标签下拉框，可按标签、类型、关键词任意组合搜索
- **搜索无关键词模式**：不输入关键词也能通过类型/标签筛选浏览所有内容
- **列表行直接点击**：所有列表行可直接点击跳转详情页，悬停有视觉反馈
- **操作按钮事件隔离**：打标签、编辑、删除等按钮不再误触发行跳转
- **时间线点击跳转**：时间线的事件卡片和链路子事件均可点击进入详情
- **标签数字优化**：标签等级数字改为 `text-sm font-extrabold`，更醒目
- **标签加号固定**：打标签的 "+" 按钮固定在右侧，不再随标签换行
- **详情页字段中文化**：所有详情页字段名显示中文（描述、状态、优先级等）
- **项目新字段**：新增源文件地址、GitHub 地址、使用工具（下拉框：Claude Code/qclaw/手写/AI辅助）、运行方式、技术栈
- **修复 API 路由**：统一 knowledge 前缀为复数，修复 EntityDetail 和 RelationPicker 的 API 路径映射

**为什么：** 标签是分类和关联的基础，但删除标签会丢失历史关联数据。搜索缺少标签维度导致筛选不灵活。列表和时间线不能直接点击导致操作路径过长。项目缺少源文件和工具信息导致无法追溯开发过程。

**效果：** 标签数据更安全，搜索更灵活，交互更直觉，项目信息更完整。

---

### 第十阶段：数据导出 + 分页 + 批量操作 + 移动端适配

**做了什么：**
- **数据导出**：仪表盘新增「📥 导出数据」按钮，一键导出全部数据为 JSON 备份文件
- **列表分页**：7 个实体列表页全部支持分页（每页 20 条），底部显示页码导航
- **批量操作**：列表页支持多选 checkbox，可批量删除和批量打标签
- **移动端适配**：侧边栏手机端抽屉式展开、列表变卡片布局、弹窗响应式宽度

**为什么：** 没有备份功能数据不安全，列表一次加载全部数据会卡顿，逐条操作效率低，手机端完全不可用。

**效果：** 数据可备份，大数据量下流畅，批量操作高效，手机端可用。

---

### 第十一阶段：搜索高亮 + 通知提醒

**做了什么：**
- **搜索关键词高亮**：搜索结果的标题和摘要中，匹配关键词用黄色背景高亮
- **侧边栏角标**：问题、决策、知识菜单项旁显示待处理数量（红色圆点）
- **仪表盘提醒横幅**：有待处理事项时，顶部显示提醒条

**为什么：** 搜索结果看不出关键词在哪，待处理事项没有主动提醒容易遗漏。

**效果：** 搜索定位更精准，待处理事项一目了然。

---

### 第十二阶段：时间线优化 + 全量 datetime 升级

**做了什么：**
- **时间线精确到分钟**：显示记录创建的实际时间，不再只显示日期
- **时间线按模块排序**：先按实体类型分组，再按时间倒序
- **链路视图时间**：收起显示最新创建时间，展开显示每步创建时间
- **全量 datetime 升级**：所有日期字段（项目开始/结束、经验事件、方案实施、决策、复盘）从 DATE 改为 DateTime，支持精确到分钟
- **新建记录默认当前时间**：datetime 字段新建时自动填入当前时间
- **时间线默认显示今天**：打开时间线默认筛选今天的记录
- **搜索添加日期范围**：搜索页新增日期筛选（今天/本周/本月/自定义）

**为什么：** 日期只精确到天不够用，时间线排序逻辑不清晰，搜索缺少时间维度。

**效果：** 时间精确到分钟，时间线按模块清晰分组，搜索支持任意条件组合。

---

### 第十三阶段：性能优化

**做了什么：**
- **BeijingTime 防重渲染**：改用 ref 直接更新 DOM，不再触发整个侧边栏每秒重渲染
- **SWR 全局配置**：添加 SWRConfig Provider，dedupingInterval 5 秒，revalidateOnFocus 关闭
- **tags 缓存优化**：/tags/ 60 秒不去重，/tags/entity/ 30 秒不去重
- **getEntityTags memo**：用 useMemo 预计算标签映射，避免每次渲染重复计算
- **批量操作并行化**：Promise.all 并行发送请求，批量删除/打标签速度提升 10 倍
- **侧边栏轻量 API**：新增 /dashboard/counts 端点，只返回 3 个数字
- **时间线加载限制**：链路视图和列表视图最多加载 200 条记录

**为什么：** 数据增多后页面切换卡顿，BeijingTime 每秒重渲染是主要瓶颈，批量操作串行太慢。

**效果：** 页面切换流畅，批量操作秒级完成，侧边栏加载从 7+ 查询降到 3 个 COUNT。

---

### 设计原则

在整个开发过程中，我们遵循了几个原则：

1. **不加新模块**：7 个实体已经够用，通过关联和标签建立连接，而不是加第 8 个模块
2. **后端先行**：每次都是先把数据结构和 API 设计好，再做前端展示
3. **渐进增强**：先跑通基本功能，再加索引、加推荐、加链路聚合
4. **个人系统思维**：不做团队协作功能，不做权限管理，保持单用户简单高效
5. **行动导向**：仪表盘回答"该做什么"，而不是"有多少数据"

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/CAPTURE760">CAPTURE760</a>
</p>
