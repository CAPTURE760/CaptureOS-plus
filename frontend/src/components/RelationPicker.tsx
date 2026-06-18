'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

interface RelationType {
  id: number;
  name: string;
  description: string | null;
  reverse_name: string | null;
}

interface EntityItem {
  id: number;
  title: string;
}

interface RelationPickerProps {
  sourceType: string;
  sourceId: number;
  targetType: string;
  onClose: () => void;
  onCreated: () => void;
}

const ENTITY_LABELS: Record<string, string> = {
  project: '项目', experience: '经验', issue: '问题',
  solution: '解决方案', knowledge: '知识', decision: '决策', review: '复盘',
};

// 每种源实体对目标实体的默认关系类型
// entityType → API 路径前缀（复数）
const ENTITY_API_PATH: Record<string, string> = {
  project: 'projects', experience: 'experiences', issue: 'issues',
  solution: 'solutions', knowledge: 'knowledges', decision: 'decisions', review: 'reviews',
};

// 每种源实体对目标实体的默认关系类型
const DEFAULT_RELATION: Record<string, Record<string, string>> = {
  issue: { solution: 'solved_by', knowledge: 'learned_from', decision: 'follows', review: 'follows', project: 'part_of' },
  solution: { issue: 'caused_by', knowledge: 'learned_from', project: 'part_of' },
  knowledge: { issue: 'related_to', solution: 'related_to', project: 'part_of' },
  decision: { issue: 'caused_by', knowledge: 'learned_from', project: 'part_of' },
  review: { issue: 'caused_by', project: 'part_of' },
  project: { issue: 'related_to', solution: 'related_to', knowledge: 'related_to' },
  experience: { issue: 'related_to', knowledge: 'learned_from', project: 'part_of' },
};

export default function RelationPicker({
  sourceType, sourceId, targetType, onClose, onCreated,
}: RelationPickerProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [relationTypeId, setRelationTypeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState('');

  // 获取关系类型
  const { data: relationTypes } = useSWR<RelationType[]>('/relations/types/', fetchAPI);

  // 获取目标类型的实体列表
  const apiPath = ENTITY_API_PATH[targetType] || targetType;
  const { data: entities } = useSWR<EntityItem[]>(`/${apiPath}/?limit=100`, fetchAPI);

  // 获取当前实体已有的关联，用于去重
  const sourceApiPath = ENTITY_API_PATH[sourceType] || sourceType;
  const { data: relatedData } = useSWR<{ relations: { target_id: number; target_type: string }[] }>(
    `/${sourceApiPath}/${sourceId}/related`, fetchAPI
  );
  const relatedIds = new Set(
    relatedData?.relations
      ?.filter((r) => r.target_type === targetType)
      .map((r) => r.target_id) || []
  );

  // 过滤搜索
  const filteredEntities = entities?.filter((e) =>
    !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // 设置默认关系类型
  const defaultRel = DEFAULT_RELATION[sourceType]?.[targetType];
  const effectiveRelationTypeId = relationTypeId || relationTypes?.find((rt) => rt.name === defaultRel)?.id;

  const handleCreate = async () => {
    if (!selectedEntityId || !effectiveRelationTypeId) return;

    if (relatedIds.has(selectedEntityId)) {
      setToast('⚠️ 已关联过，无需重复操作');
      setTimeout(() => setToast(''), 2000);
      return;
    }

    await fetchAPI('/relations/', {
      method: 'POST',
      body: JSON.stringify({
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: selectedEntityId,
        relation_type_id: effectiveRelationTypeId,
      }),
    });
    setToast('✅ 关联成功');
    setTimeout(() => {
      onCreated();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 md:mx-0 max-h-[80vh] overflow-hidden relative">
        {toast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-10 animate-pulse">
            {toast}
          </div>
        )}
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold">
            🔗 关联{ENTITY_LABELS[targetType] || targetType}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="p-4">
          {/* 关系类型选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">关系类型</label>
            <select
              value={effectiveRelationTypeId || ''}
              onChange={(e) => setRelationTypeId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">选择关系类型...</option>
              {relationTypes?.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.description || rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* 搜索实体 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              搜索{ENTITY_LABELS[targetType] || targetType}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="输入标题搜索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* 实体列表 */}
          <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
            {filteredEntities.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">暂无数据</div>
            ) : (
              filteredEntities.map((entity) => {
                const isAlreadyRelated = relatedIds.has(entity.id);
                return (
                  <div
                    key={entity.id}
                    onClick={() => !isAlreadyRelated && setSelectedEntityId(entity.id)}
                    className={`px-3 py-2 border-b border-gray-100 last:border-0 text-sm ${
                      isAlreadyRelated
                        ? 'bg-gray-50 text-gray-400 cursor-default line-through'
                        : selectedEntityId === entity.id
                          ? 'bg-blue-50 border-l-2 border-l-blue-500 cursor-pointer'
                          : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    {entity.title}
                    {isAlreadyRelated && <span className="ml-2 text-green-500 line-through-none">✅ 已关联</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedEntityId || !effectiveRelationTypeId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            确认关联
          </button>
        </div>
      </div>
    </div>
  );
}
