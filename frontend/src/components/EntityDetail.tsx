'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import TagPicker from './TagPicker';
import RelationPicker from './RelationPicker';
import SuggestionBar from './SuggestionBar';
import { useConfirm } from './ConfirmDialog';
import { useToast } from './Toast';

interface Tag {
  id: number;
  name: string;
  color: string | null;
  level: number;
}

interface EntityTag {
  id: number;
  entity_type: string;
  entity_id: number;
  tag_id: number;
}

interface RelationType {
  name: string;
  description: string | null;
  reverse_name: string | null;
}

interface Relation {
  relation_id: number;
  source_type: string;
  source_id: number;
  target_type: string;
  target_id: number;
  relation_type: RelationType;
  target_title: string;
  target_entity_type: string;
  target_entity_id: number;
}

interface RelatedResponse {
  relations: Relation[];
  by_type: Record<string, Relation[]>;
}

interface EntityDetailProps {
  entityType: string;
  entityId: number;
  entity: Record<string, unknown>;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// entityType → API 路径前缀（复数）
const ENTITY_API_PATH: Record<string, string> = {
  project: 'projects', experience: 'experiences', issue: 'issues',
  solution: 'solutions', knowledge: 'knowledges', decision: 'decisions', review: 'reviews',
};

const ENTITY_ICONS: Record<string, string> = {
  project: '📁', experience: '💡', issue: '⚠️',
  solution: '🔧', knowledge: '📚', decision: '🎯', review: '📝',
};

const ENTITY_LABELS: Record<string, string> = {
  project: '项目', experience: '经验', issue: '问题',
  solution: '解决方案', knowledge: '知识', decision: '决策', review: '复盘',
};

const ENTITY_COLORS: Record<string, string> = {
  project: 'border-blue-500', experience: 'border-yellow-500',
  issue: 'border-red-500', solution: 'border-green-500',
  knowledge: 'border-purple-500', decision: 'border-indigo-500',
  review: 'border-pink-500',
};

// 字段名中文映射
const FIELD_LABELS: Record<string, string> = {
  description: '描述', status: '状态', start_date: '开始日期', end_date: '结束日期',
  priority: '优先级', root_cause: '根本原因', discovered_date: '发现日期',
  resolved_date: '解决日期', approach: '方案', outcome: '结果',
  effectiveness: '有效性', summary: '摘要', lesson: '经验教训',
  content: '内容', category: '分类', source: '来源', confidence: '置信度',
  background: '背景', reason: '原因', event_summary: '事件总结',
  result: '结果', context: '上下文', period: '复盘周期',
  success_factors: '成功因素', failure_factors: '失败因素',
  improvements: '改进措施', review_date: '复盘日期',
  event_date: '事件日期', implemented_date: '实施日期',
  options: '选项', decision_date: '决策日期',
  rating: '评分', run_command: '运行方式',
  tech_stack: '技术栈', source_url: '源文件地址', github_url: 'GitHub 地址',
  tool: '使用工具',
};

const TAG_COLORS: Record<string, string> = {
  project: 'bg-blue-100 text-blue-800', experience: 'bg-yellow-100 text-yellow-800',
  issue: 'bg-red-100 text-red-800', solution: 'bg-green-100 text-green-800',
  knowledge: 'bg-purple-100 text-purple-800', decision: 'bg-indigo-100 text-indigo-800',
  review: 'bg-pink-100 text-pink-800',
};

// 关系类型的中文标签
const RELATION_LABELS: Record<string, string> = {
  solved_by: '🔧 解决方案',
  caused_by: '🔍 原因',
  learned_from: '📚 来源知识',
  follows: '➡️ 后续',
  part_of: '📁 所属项目',
  related_to: '🔗 相关',
  depends_on: '⛓️ 依赖',
  blocks: '🚫 阻塞',
};

export default function EntityDetail({
  entityType, entityId, entity, onBack, onEdit, onDelete,
}: EntityDetailProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showRelationPicker, setShowRelationPicker] = useState(false);
  const [relationTargetType, setRelationTargetType] = useState('');

  // 获取标签
  const { data: allTags } = useSWR<Tag[]>('/tags/', fetchAPI);
  const { data: entityTags, mutate: mutateTags } = useSWR<EntityTag[]>(
    `/tags/entity/${entityType}`, fetchAPI
  );

  // 获取关联
  const apiPath = ENTITY_API_PATH[entityType] || entityType;
  const { data: relatedData, mutate: mutateRelated } = useSWR<RelatedResponse>(
    `/${apiPath}/${entityId}/related`, fetchAPI
  );

  const currentTags = entityTags
    ?.filter((et) => et.entity_id === entityId)
    .map((et) => allTags?.find((t) => t.id === et.tag_id))
    .filter(Boolean) || [];

  const handleDeleteRelation = async (relationId: number) => {
    const ok = await confirm({
      title: '移除关联',
      message: '确定要移除这个关联吗？',
      confirmText: '确定移除',
      variant: 'warning',
    });
    if (!ok) return;
    await fetchAPI(`/relations/${relationId}`, { method: 'DELETE' });
    mutateRelated();
    toast('关联已移除', 'success');
  };

  const openRelationPicker = (targetType: string) => {
    setRelationTargetType(targetType);
    setShowRelationPicker(true);
  };

  // 渲染字段值
  const renderField = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-400">-</span>;
    if (key.includes('date') || key === 'created_at' || key === 'updated_at') {
      return formatBeijingTime(value as string);
    }
    if (key === 'status') {
      const statusMap: Record<string, { label: string; color: string }> = {
        open: { label: '待解决', color: 'bg-red-100 text-red-800' },
        in_progress: { label: '处理中', color: 'bg-yellow-100 text-yellow-800' },
        resolved: { label: '已解决', color: 'bg-green-100 text-green-800' },
        closed: { label: '已关闭', color: 'bg-gray-100 text-gray-800' },
        active: { label: '进行中', color: 'bg-green-100 text-green-800' },
        completed: { label: '已完成', color: 'bg-blue-100 text-blue-800' },
        paused: { label: '暂停', color: 'bg-yellow-100 text-yellow-800' },
        cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
        pending: { label: '待执行', color: 'bg-gray-100 text-gray-800' },
        deprecated: { label: '已废弃', color: 'bg-red-100 text-red-800' },
        unverified: { label: '待确认', color: 'bg-gray-100 text-gray-800' },
        verified: { label: '已验证', color: 'bg-green-100 text-green-800' },
        outdated: { label: '已过时', color: 'bg-yellow-100 text-yellow-800' },
      };
      const s = statusMap[value as string] || { label: value as string, color: 'bg-gray-100' };
      return <span className={`px-2 py-1 rounded text-xs ${s.color}`}>{s.label}</span>;
    }
    if (key === 'priority') {
      const priorityMap: Record<string, { label: string; color: string }> = {
        '紧急': { label: '🔴 紧急', color: 'bg-red-100 text-red-800' },
        '高': { label: '🟠 高', color: 'bg-orange-100 text-orange-800' },
        '中': { label: '🟡 中', color: 'bg-yellow-100 text-yellow-800' },
        '低': { label: '🟢 低', color: 'bg-green-100 text-green-800' },
      };
      const p = priorityMap[value as string] || { label: String(value), color: 'bg-gray-100' };
      return <span className={`px-2 py-1 rounded text-xs ${p.color}`}>{p.label}</span>;
    }
    if (key === 'effectiveness' || key === 'rating') {
      const v = Number(value);
      return <span>{'⭐'.repeat(v)} <span className="text-gray-500">({v})</span></span>;
    }
    if (key === 'confidence') {
      const v = Number(value);
      return <span className="font-mono">{v != null ? `${v * 10}%` : '-'}</span>;
    }
    if (typeof value === 'string' && value.length > 100) {
      return <span className="whitespace-pre-wrap">{value}</span>;
    }
    return <span>{String(value)}</span>;
  };

  // 过滤掉不需要在详情中显示的字段
  const skipFields = ['id', 'created_at', 'updated_at'];

  return (
    <div>
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-blue-600">首页</a>
        <span>/</span>
        <a href={`/${entityType === 'issue' ? 'issues' : entityType === 'experience' ? 'experiences' : entityType + 's'}`}
          className="hover:text-blue-600">
          {ENTITY_ICONS[entityType]} {ENTITY_LABELS[entityType]}
        </a>
        <span>/</span>
        <span className="text-gray-800 font-medium">{String(entity.title)}</span>
      </nav>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
          ← 返回列表
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            ✏️ 编辑
          </button>
          <button onClick={onDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            🗑️ 删除
          </button>
        </div>
      </div>

      {/* 推荐关联 */}
      <SuggestionBar entityType={entityType} entityId={entityId} onRelated={() => mutateRelated()} />

      {/* 实体信息卡片 */}
      <div className={`bg-white rounded-lg shadow border-l-4 ${ENTITY_COLORS[entityType] || 'border-gray-500'} p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{ENTITY_ICONS[entityType]}</span>
          <h1 className="text-2xl font-bold">{String(entity.title)}</h1>
        </div>

        {/* 短字段：2-3列网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(entity).map(([key, value]) => {
            if (skipFields.includes(key) || key === 'title') return null;
            // 长文本字段跳过，下面单独渲染
            if (['description', 'root_cause', 'content', 'approach', 'outcome', 'lesson',
                 'background', 'reason', 'event_summary', 'result', 'context',
                 'success_factors', 'failure_factors', 'improvements', 'summary',
                 'options', 'source_url', 'github_url', 'tech_stack', 'run_command'].includes(key)) return null;
            return (
              <div key={key}>
                <span className="text-sm text-gray-500 block">
                  {FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <div className="text-sm">{renderField(key, value)}</div>
              </div>
            );
          })}
        </div>

        {/* 长文本字段：独占整行，完全展开 */}
        {Object.entries(entity).map(([key, value]) => {
          if (skipFields.includes(key) || key === 'title') return null;
          if (!['description', 'root_cause', 'content', 'approach', 'outcome', 'lesson',
                'background', 'reason', 'event_summary', 'result', 'context',
                'success_factors', 'failure_factors', 'improvements', 'summary',
                'options', 'source_url', 'github_url', 'tech_stack', 'run_command'].includes(key)) return null;
          if (value === null || value === undefined || value === '') return null;
          return (
            <div key={key} className="mb-4">
              <span className="text-sm text-gray-500 block mb-1">
                {FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{renderField(key, value)}</div>
            </div>
          );
        })}

        {/* 标签 */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">标签</span>
            <button
              onClick={() => setShowTagPicker(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + 管理标签
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentTags.length > 0 ? currentTags.map((tag) => tag && (
              <span key={tag.id} className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: `${tag.color}20`, border: `1px solid ${tag.color}40`, color: tag.color }}>
                {tag.name}
              </span>
            )) : <span className="text-sm text-gray-400">暂无标签</span>}
          </div>
        </div>
      </div>

      {/* 关联实体 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">关联实体</h2>

        {relatedData && relatedData.relations.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(relatedData.by_type).map(([type, rels]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">
                    {ENTITY_ICONS[type]} {ENTITY_LABELS[type] || type} ({rels.length})
                  </h3>
                  <button
                    onClick={() => openRelationPicker(type)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    + 关联{ENTITY_LABELS[type] || type}
                  </button>
                </div>
                <div className="space-y-2">
                  {rels.map((rel) => (
                    <div key={rel.relation_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{rel.target_title}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({RELATION_LABELS[rel.relation_type.name] || rel.relation_type.description})
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteRelation(rel.relation_id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="mb-2">暂无关联实体</p>
            <p className="text-sm">点击下方按钮添加关联</p>
          </div>
        )}

        {/* 添加关联按钮 */}
        <div className="mt-4 border-t pt-4">
          <span className="text-sm text-gray-500 mr-2">添加关联：</span>
          {Object.keys(ENTITY_LABELS).filter((t) => t !== entityType).map((type) => (
            <button key={type}
              onClick={() => openRelationPicker(type)}
              className="inline-flex items-center gap-1 px-2 py-1 mr-2 mb-2 text-xs border border-dashed border-gray-300 rounded hover:border-blue-500 hover:text-blue-600">
              {ENTITY_ICONS[type]} {ENTITY_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* 弹窗 */}
      {showTagPicker && (
        <TagPicker entityType={entityType} entityId={entityId}
          onClose={() => setShowTagPicker(false)}
          onUpdated={() => { mutateTags(); }} />
      )}
      {showRelationPicker && (
        <RelationPicker
          sourceType={entityType}
          sourceId={entityId}
          targetType={relationTargetType}
          onClose={() => setShowRelationPicker(false)}
          onCreated={() => { mutateRelated(); setShowRelationPicker(false); }}
        />
      )}
    </div>
  );
}
