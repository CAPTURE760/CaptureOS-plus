from app.models.project import Project
from app.models.experience import Experience
from app.models.issue import Issue
from app.models.solution import Solution
from app.models.knowledge import Knowledge
from app.models.decision import Decision
from app.models.review import Review
from app.models.tag import Tag, EntityTag
from app.models.relation import Relation, RelationType

__all__ = [
    "Project",
    "Experience",
    "Issue",
    "Solution",
    "Knowledge",
    "Decision",
    "Review",
    "Tag",
    "EntityTag",
    "Relation",
    "RelationType",
]

# Entity type constants for polymorphic relations and tags
ENTITY_TYPES = {
    "project": "Project",
    "experience": "Experience",
    "issue": "Issue",
    "solution": "Solution",
    "knowledge": "Knowledge",
    "decision": "Decision",
    "review": "Review",
}

ENTITY_LABELS = {
    "project": "项目",
    "experience": "经验",
    "issue": "问题",
    "solution": "解决方案",
    "knowledge": "知识",
    "decision": "决策",
    "review": "复盘",
}
