# CaptureOS — 个人资产管理系统

## 项目概述

Personal Asset OS：管理项目、经验、问题、解决方案、知识、决策、复盘 7 种核心实体，支持标签、关联、时间线、全文搜索。

- GitHub: https://github.com/CAPTURE760/CaptureOS-plus

## 技术栈

| 层 | 技术 |
|---|------|
| 后端 | Python 3.13 + FastAPI + SQLAlchemy 2 (async) + Alembic + Pydantic 2 |
| 前端 | Next.js 15 + React 19 + TypeScript + Tailwind CSS 3 + SWR |
| 数据库 | PostgreSQL 16 (asyncpg) |
| 部署 | Docker Compose + 阿里云 ACR |

## 项目结构

```
backend/
  app/
    api/          # 路由：projects, issues, solutions, knowledge, decisions, experiences, reviews, tags, relations, entity_relations, timeline, search, dashboard, export, export_word, import_data, upload, suggestions
    models/       # SQLAlchemy 模型：project, issue, solution, knowledge, decision, experience, review, tag, relation
    schemas/      # Pydantic schemas（对应每个 model）
    main.py       # FastAPI 入口，CORS + static files (/uploads)
    config.py     # pydantic-settings，从 .env 读取
    database.py   # async engine + Base
  alembic/versions/  # 数据库迁移（001~010）
  pyproject.toml
frontend/
  src/
    app/          # Next.js App Router 页面：/, /projects, /issues, /solutions, /knowledge, /decisions, /experiences, /reviews, /tags, /timeline, /search（各有列表页 + [id] 详情页）
    components/   # Sidebar, EntityList, EntityDetail, EntityForm, EntityTags, FilterBar, TagPicker, RelationPicker, Pagination, Loading, Toast, ConfirmDialog, ExportButton, SuggestionBar, Providers, BeijingTime
    lib/          # api.ts (fetchAPI + useAPI), constants.ts (状态/优先级), markdown.ts, time.ts
  package.json
docker-compose.yml       # 开发模式（build from source）
docker-compose.pull.yml  # 生产模式（pull from ACR）
push.sh                  # 构建并推送到阿里云 ACR
```

## 关键架构模式

- **通用 CRUD 工厂**：`backend/app/api/base.py` — `create_crud_router()` 自动生成 list/get/create/update/delete/count 路由
- **前端 API 层**：`frontend/src/lib/api.ts` — `fetchAPI<T>()` + `useAPI<T>()` (SWR)，动态推断 API 地址
- **常量集中管理**：`frontend/src/lib/constants.ts` — 所有状态/优先级选项和颜色定义，组件共用
- **数据库迁移**：Alembic，迁移文件编号递增（001~010），在 `backend/alembic/versions/`

## 常用命令

```bash
# 开发
docker compose up -d                          # 启动全栈（前端 :3000, 后端 :8001, 数据库 :5432）

# 生产（预构建镜像）
docker compose -f docker-compose.pull.yml pull && docker compose -f docker-compose.pull.yml up -d

# 推送镜像
bash push.sh

# 数据库迁移
docker compose exec backend alembic revision --autogenerate -m "描述"
docker compose exec backend alembic upgrade head
```

## 重要约定 & 踩坑记录

- **NEXT_PUBLIC_API_URL** 默认 `http://localhost:8001/api`，不要随意修改（会导致 CORS 和构建缓存问题）
- **CORS**：后端 config.py 配置 `localhost:3000` 和 `localhost:8001`；main.py 当前 `allow_origins=["*"]`
- **FastAPI `redirect_slashes`** 保持默认 True，不要改
- **Docker 匿名卷** `/app/.next` 不要移除，否则编译缓存失效
- **Docker 匿名卷** `/app/node_modules` 同理
- **uploads 目录** 已在 .gitignore 排除，不进入镜像和仓库
- **ACR 镜像仓库**：`crpi-d5nm65il20pptret.cn-hangzhou.personal.cr.aliyuncs.com/captureos/`
- **npm 镜像**：Dockerfile 中使用淘宝 npmmirror，pip 使用阿里云镜像

## API 路由总览

所有路由前缀 `/api`，由 `backend/app/api/__init__.py` 聚合：

| 路由 | 说明 |
|------|------|
| `/api/projects` | 项目 CRUD |
| `/api/experiences` | 经验 CRUD |
| `/api/issues` | 问题 CRUD |
| `/api/solutions` | 解决方案 CRUD |
| `/api/knowledge` | 知识 CRUD |
| `/api/decisions` | 决策 CRUD |
| `/api/reviews` | 复盘 CRUD |
| `/api/tags` | 标签 CRUD（含软删除 is_active） |
| `/api/relations` | 实体关联（8 种关系类型） |
| `/api/entity-relations` | 实体关联（智能推荐） |
| `/api/timeline` | 时间线（Union-Find 链路聚合） |
| `/api/search` | 全文搜索（ILIKE + pg_trgm） |
| `/api/dashboard` | 仪表盘统计 |
| `/api/export` | 数据导出 |
| `/api/export/word` | Word 导出 |
| `/api/import` | 数据导入 |
| `/api/upload` | 文件上传 |
| `/api/suggestions` | 智能建议 |
| `/health` | 健康检查（无前缀） |

## 待办事项

1. **分页** — 列表一次性加载全部，数据多了会卡
2. **批量操作** — 不能同时选中多条记录删除或打标签
3. **移动端适配** — 侧边栏+表格在手机上体验待优化
4. **搜索高亮** — 搜索结果没有高亮关键词
5. **通知/提醒** — 待处理事项没有主动提醒

## 代码风格

- 后端：Python 类型注解（`Mapped[str]`、`str | None`），async/await，Pydantic v2 `model_dump()`
- 前端：TypeScript 严格模式，函数组件 + hooks，SWR 数据获取，Tailwind 原子类
- 中文 UI，代码注释可中可英
