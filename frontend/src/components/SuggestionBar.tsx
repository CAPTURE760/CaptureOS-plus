'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

interface Suggestion {
  entity_type: string;
  entity_id: number;
  title: string;
  shared_count: number;
  shared_tag_names: string[];
}

interface SuggestionResponse {
  suggestions: Suggestion[];
}

interface SuggestionBarProps {
  entityType: string;
  entityId: number;
  onRelated: () => void;
}

const ENTITY_ICONS: Record<string, string> = {
  project: '📁', experience: '💡', issue: '⚠️',
  solution: '🔧', knowledge: '📚', decision: '🎯', review: '📝',
};

const ENTITY_LABELS: Record<string, string> = {
  project: '项目', experience: '经验', issue: '问题',
  solution: '解决方案', knowledge: '知识', decision: '决策', review: '复盘',
};

export default function SuggestionBar({ entityType, entityId, onRelated }: SuggestionBarProps) {
  const { data } = useSWR<SuggestionResponse>(
    `/suggestions/${entityType}/${entityId}`,
    fetchAPI
  );
  const [dismissed, setDismissed] = useState(false);
  const [relatedIds, setRelatedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');

  if (!data?.suggestions?.length || dismissed) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handle关联 = async (suggestion: Suggestion) => {
    const key = `${suggestion.entity_type}-${suggestion.entity_id}`;
    if (relatedIds.has(key)) {
      showToast('⚠️ 已关联过，无需重复操作');
      return;
    }

    const relTypes = await fetchAPI<{ id: number; name: string }[]>('/relations/types/', {});
    const relatedTo = relTypes.find((rt) => rt.name === 'related_to');
    if (!relatedTo) return;

    await fetchAPI('/relations/', {
      method: 'POST',
      body: JSON.stringify({
        source_type: entityType,
        source_id: entityId,
        target_type: suggestion.entity_type,
        target_id: suggestion.entity_id,
        relation_type_id: relatedTo.id,
      }),
    });
    setRelatedIds((prev) => new Set(prev).add(key));
    showToast('✅ 关联成功');
    onRelated();
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
      {toast && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm shadow-lg animate-pulse">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-blue-800">💡 可能关联</h3>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600 text-xs"
        >
          隐藏
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.suggestions.map((s) => {
          const key = `${s.entity_type}-${s.entity_id}`;
          const isRelated = relatedIds.has(key);
          return (
            <div key={key}
              className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-sm">
              <span>{ENTITY_ICONS[s.entity_type]}</span>
              <span className="max-w-[200px] truncate">{s.title}</span>
              <span className="text-xs text-gray-400">
                共享: {s.shared_tag_names.join(', ')}
              </span>
              <button
                onClick={() => handle关联(s)}
                disabled={isRelated}
                className={`text-xs font-medium ${isRelated ? 'text-green-500 cursor-default' : 'text-blue-600 hover:text-blue-800'}`}
              >
                {isRelated ? '✅ 已关联' : '关联'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
