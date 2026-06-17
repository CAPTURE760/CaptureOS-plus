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

### 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/CAPTURE760/CaptureOS-plus.git
cd CaptureOS-plus

# 2. 启动所有服务（首次启动会自动构建镜像，约 5-10 分钟）
docker compose up -d

# 3. 运行数据库迁移（创建表结构 + 索引）
docker compose exec backend alembic upgrade head

# 4. 完成！访问应用
```

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
├── docker-compose.yml
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
# 启动服务（支持热重载）
docker compose up -d

# 查看日志
docker compose logs -f backend
docker compose logs -f frontend

# 停止服务
docker compose down

# 重建镜像（代码修改后）
docker compose up -d --build
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

修改 `docker-compose.yml` 中的端口映射：

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

使用国内镜像源（已在 Dockerfile 中配置）：
- 后端：阿里云 Debian 镜像
- 前端：淘宝 npm 镜像

### 3. 数据库连接失败

确保 PostgreSQL 容器已完全启动：

```bash
docker compose ps  # 检查容器状态
docker compose logs db  # 查看数据库日志
```

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
