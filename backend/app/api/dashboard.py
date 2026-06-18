"""Dashboard API — 行动导向的首页数据。"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.decision import Decision
from app.models.experience import Experience
from app.models.issue import Issue
from app.models.knowledge import Knowledge
from app.models.project import Project
from app.models.relation import Relation
from app.models.review import Review
from app.models.solution import Solution

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/counts")
async def get_counts(db: AsyncSession = Depends(get_db)):
    """轻量端点：只返回侧边栏角标需要的 3 个数字。"""
    issues = await db.execute(
        select(func.count(Issue.id)).where(Issue.status.in_(["open", "in_progress"]))
    )
    decisions = await db.execute(
        select(func.count(Decision.id)).where(Decision.status == "pending")
    )
    knowledge = await db.execute(
        select(func.count(Knowledge.id)).where(Knowledge.status == "unverified")
    )
    return {
        "issues": issues.scalar() or 0,
        "decisions": decisions.scalar() or 0,
        "knowledge": knowledge.scalar() or 0,
    }


@router.get("/")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # ── 待处理 ──
    # 待解决问题 (open + in_progress)
    result = await db.execute(
        select(Issue)
        .where(Issue.status.in_(["open", "in_progress"]))
        .order_by(Issue.created_at.desc())
        .limit(10)
    )
    pending_issues = [
        {"id": i.id, "title": i.title, "status": i.status, "priority": i.priority,
         "created_at": i.created_at.isoformat()}
        for i in result.scalars().all()
    ]

    # 待执行决策
    result = await db.execute(
        select(Decision)
        .where(Decision.status == "pending")
        .order_by(Decision.created_at.desc())
        .limit(10)
    )
    pending_decisions = [
        {"id": d.id, "title": d.title, "created_at": d.created_at.isoformat()}
        for d in result.scalars().all()
    ]

    # 待确认知识
    result = await db.execute(
        select(Knowledge)
        .where(Knowledge.status == "unverified")
        .order_by(Knowledge.created_at.desc())
        .limit(10)
    )
    pending_knowledge = [
        {"id": k.id, "title": k.title, "created_at": k.created_at.isoformat()}
        for k in result.scalars().all()
    ]

    # ── 风险提醒 ──
    risks = []

    # 问题没有解决方案 (open 问题且没有 solved_by 关系)
    result = await db.execute(
        select(Issue.id)
        .where(Issue.status.in_(["open", "in_progress"]))
    )
    open_issue_ids = [row[0] for row in result.all()]

    if open_issue_ids:
        result = await db.execute(
            select(Relation.source_id)
            .where(
                Relation.source_type == "issue",
                Relation.source_id.in_(open_issue_ids),
                Relation.target_type == "solution",
            )
        )
        issues_with_solutions = {row[0] for row in result.all()}
        orphan_issues = [iid for iid in open_issue_ids if iid not in issues_with_solutions]

        if orphan_issues:
            # 获取标题
            result = await db.execute(
                select(Issue.id, Issue.title).where(Issue.id.in_(orphan_issues))
            )
            items = [{"id": r[0], "title": r[1]} for r in result.all()]
            risks.append({
                "type": "warning",
                "message": f"{len(items)} 个问题没有解决方案",
                "items": items[:5],
            })

    # 项目超过7天没更新
    result = await db.execute(
        select(Project)
        .where(
            Project.status == "active",
            Project.updated_at < seven_days_ago,
        )
        .order_by(Project.updated_at.asc())
        .limit(5)
    )
    stale_projects = [
        {"id": p.id, "title": p.title, "updated_at": p.updated_at.isoformat()}
        for p in result.scalars().all()
    ]
    if stale_projects:
        risks.append({
            "type": "info",
            "message": f"{len(stale_projects)} 个项目超过7天没更新",
            "items": stale_projects,
        })

    # 知识没有来源
    result = await db.execute(
        select(Knowledge)
        .where(or_(Knowledge.source == None, Knowledge.source == ""))  # noqa: E711
        .order_by(Knowledge.created_at.desc())
        .limit(5)
    )
    no_source = [
        {"id": k.id, "title": k.title}
        for k in result.scalars().all()
    ]
    if no_source:
        risks.append({
            "type": "info",
            "message": f"{len(no_source)} 条知识没有来源",
            "items": no_source,
        })

    # ── 概览（按状态分组计数）──
    overview = {}

    result = await db.execute(
        select(Issue.status, func.count(Issue.id)).group_by(Issue.status)
    )
    overview["issues"] = {row[0]: row[1] for row in result.all()}

    result = await db.execute(
        select(Project.status, func.count(Project.id)).group_by(Project.status)
    )
    overview["projects"] = {row[0]: row[1] for row in result.all()}

    result = await db.execute(
        select(Knowledge.status, func.count(Knowledge.id)).group_by(Knowledge.status)
    )
    overview["knowledge"] = {row[0]: row[1] for row in result.all()}

    result = await db.execute(
        select(Decision.status, func.count(Decision.id)).group_by(Decision.status)
    )
    overview["decisions"] = {row[0]: row[1] for row in result.all()}

    # ── 最近动态（跨实体合并）──
    activity = []

    entity_configs = [
        ("project", "📁", Project, Project.created_at),
        ("experience", "💡", Experience, Experience.created_at),
        ("issue", "⚠️", Issue, Issue.created_at),
        ("solution", "🔧", Solution, Solution.created_at),
        ("knowledge", "📚", Knowledge, Knowledge.created_at),
        ("decision", "🎯", Decision, Decision.created_at),
        ("review", "📝", Review, Review.created_at),
    ]

    for etype, icon, model, date_field in entity_configs:
        result = await db.execute(
            select(model).order_by(date_field.desc()).limit(3)
        )
        for item in result.scalars().all():
            activity.append({
                "entity_type": etype,
                "entity_id": item.id,
                "icon": icon,
                "title": item.title,
                "created_at": item.created_at.isoformat(),
            })

    activity.sort(key=lambda x: x["created_at"], reverse=True)
    activity = activity[:10]

    return {
        "pending": {
            "issues": pending_issues,
            "decisions": pending_decisions,
            "knowledge": pending_knowledge,
        },
        "risks": risks,
        "overview": overview,
        "recent_activity": activity,
    }
