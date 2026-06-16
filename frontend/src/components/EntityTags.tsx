'use client';

import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

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

interface EntityTagsProps {
  entityType: string;
  entityId: number;
  onClick?: () => void;
}

export default function EntityTags({ entityType, entityId, onClick }: EntityTagsProps) {
  const { data: entityTags } = useSWR<EntityTag[]>(
    `/tags/entity/${entityType}/${entityId}`,
    fetchAPI
  );
  const { data: allTags } = useSWR<Tag[]>('/tags/', fetchAPI);

  if (!entityTags || entityTags.length === 0) {
    return (
      <button
        onClick={onClick}
        className="text-gray-400 hover:text-blue-500 text-xs border border-dashed border-gray-300 rounded px-2 py-1 hover:border-blue-500"
        title="点击打标签"
      >
        +标签
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1" onClick={onClick}>
      {entityTags.map((et) => {
        const tag = allTags?.find((t) => t.id === et.tag_id);
        if (!tag) return null;
        const color = tag.color || '#6B7280';
        const level = tag.level || 1;

        return (
          <div
            key={et.id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
            title={`${tag.name} - 等级${level}`}
          >
            <div
              className="w-4 h-3 rounded-sm overflow-hidden relative"
              style={{ border: `1px solid ${color}` }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: `${(level / 5) * 100}%`, backgroundColor: color }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[7px] font-bold text-white drop-shadow">{level}</span>
              </div>
            </div>
            <span className="text-xs" style={{ color }}>{tag.name}</span>
          </div>
        );
      })}
    </div>
  );
}
