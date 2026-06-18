'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import TagPicker from './TagPicker';

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

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface EntityListProps<T> {
  data: T[];
  columns: Column<T>[];
  entityType: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onRefresh?: () => void;
}

// 小标签方块
function TagBadge({ tag }: { tag: Tag }) {
  const color = tag.color || '#6B7280';
  const level = tag.level || 1;

  return (
    <div
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
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
}

export default function EntityList<T extends { id: number }>({
  data,
  columns,
  entityType,
  onEdit,
  onDelete,
  onView,
  onRefresh,
}: EntityListProps<T>) {
  const [tagPickerItem, setTagPickerItem] = useState<T | null>(null);
  const { data: allTags } = useSWR<Tag[]>('/tags/', fetchAPI);
  const { data: allEntityTags, mutate: mutateEntityTags } = useSWR<EntityTag[]>(
    `/tags/entity/${entityType}`,
    fetchAPI
  );

  // 获取某个实体的标签
  const getEntityTags = (entityId: number): Tag[] => {
    if (!allEntityTags || !allTags) return [];
    const tagIds = allEntityTags
      .filter((et) => et.entity_id === entityId)
      .map((et) => et.tag_id);
    return allTags.filter((t) => tagIds.includes(t.id));
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">
              标签
            </th>
            {(onEdit || onDelete || onView) && (
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                操作
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => {
            const itemTags = getEntityTags(item.id);
            return (
              <tr key={item.id}
                className={`transition-colors ${onView ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'}`}
                onClick={() => onView?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                    {col.render ? (
                      col.render(item)
                    ) : (
                      <span className="line-clamp-2" title={String((item as Record<string, unknown>)[col.key] ?? '')}>
                        {String((item as Record<string, unknown>)[col.key] ?? '-')}
                      </span>
                    )}
                  </td>
                ))}
                {/* 标签列 */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 items-center">
                    {itemTags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                    <button
                      onClick={() => setTagPickerItem(item)}
                      className="text-gray-400 hover:text-blue-500 text-xs border border-dashed border-gray-300 rounded px-1.5 py-0.5 hover:border-blue-500"
                      title="打标签"
                    >
                      +
                    </button>
                  </div>
                </td>
                {/* 操作列 */}
                {(onEdit || onDelete || onView) && (
                  <td className="px-4 py-3 text-sm space-x-2 whitespace-nowrap">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className="text-green-600 hover:text-green-800"
                      >
                        查看
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="px-4 py-12 text-center text-gray-500"
              >
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">📭</span>
                  <span>暂无数据</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 标签选择器弹窗 */}
      {tagPickerItem && (
        <TagPicker
          entityType={entityType}
          entityId={tagPickerItem.id}
          onClose={() => setTagPickerItem(null)}
          onUpdated={() => {
            mutateEntityTags();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
