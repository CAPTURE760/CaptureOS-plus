'use client';

import { useState, useMemo } from 'react';
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
  // 批量操作
  selectedIds?: Set<number>;
  onSelect?: (id: number) => void;
  onSelectAll?: () => void;
  onBatchDelete?: () => void;
  onBatchTag?: (tagId: number) => void;
  onBatchExport?: () => void;
  // 手机端卡片显示的列 key，不传则自动选前 2 列（跳过最后一列如创建时间）
  mobileKeys?: string[];
}

// 小标签方块
function TagBadge({ tag }: { tag: Tag }) {
  const color = tag.color || '#6B7280';
  const level = tag.level || 1;

  return (
    <div
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0"
      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
      title={`${tag.name} - 等级${level}`}
    >
      <div
        className="w-4 h-3 rounded-sm overflow-hidden relative shrink-0"
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
      <span className="text-xs whitespace-nowrap" style={{ color }}>{tag.name}</span>
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
  selectedIds,
  onSelect,
  onSelectAll,
  onBatchDelete,
  onBatchTag,
  onBatchExport,
  mobileKeys,
}: EntityListProps<T>) {
  const [tagPickerItem, setTagPickerItem] = useState<T | null>(null);
  const [showBatchTag, setShowBatchTag] = useState(false);
  const { data: allTags } = useSWR<Tag[]>('/tags/', fetchAPI, {
    dedupingInterval: 60000, // 标签数据很少变，60 秒内不去重
    revalidateOnFocus: false,
  });
  const { data: allEntityTags, mutate: mutateEntityTags } = useSWR<EntityTag[]>(
    `/tags/entity/${entityType}`,
    fetchAPI,
    { dedupingInterval: 30000 }
  );

  const hasBatchActions = !!onBatchDelete || !!onBatchTag || !!onBatchExport;
  const selectedCount = selectedIds?.size || 0;
  const allSelected = data.length > 0 && data.every(item => selectedIds?.has(item.id));

  // 预计算每个实体的标签映射
  const entityTagMap = useMemo(() => {
    if (!allEntityTags || !allTags) return new Map<number, Tag[]>();
    const tagMap = new Map<number, Tag[]>();
    // 按 entity_id 分组
    const grouped = new Map<number, number[]>();
    for (const et of allEntityTags) {
      const ids = grouped.get(et.entity_id) || [];
      ids.push(et.tag_id);
      grouped.set(et.entity_id, ids);
    }
    // 转换为 Tag 对象
    for (const [entityId, tagIds] of grouped) {
      tagMap.set(entityId, allTags.filter(t => tagIds.includes(t.id)));
    }
    return tagMap;
  }, [allEntityTags, allTags]);

  const getEntityTags = (entityId: number): Tag[] => entityTagMap.get(entityId) || [];

  return (
    <div>
      {/* 电脑端表格 */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {hasBatchActions && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">
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
                  className={`transition-colors ${
                    selectedIds?.has(item.id) ? 'bg-blue-50' :
                    onView ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onView?.(item)}
                >
                  {hasBatchActions && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(item.id) || false}
                        onChange={() => onSelect?.(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
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
                    <div className="flex items-center gap-1">
                      <div className="flex flex-wrap gap-1 min-w-0 flex-1">
                        {itemTags.map((tag) => (
                          <TagBadge key={tag.id} tag={tag} />
                        ))}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setTagPickerItem(item); }}
                        className="text-gray-400 hover:text-blue-500 text-xs border border-dashed border-gray-300 rounded px-1.5 py-0.5 hover:border-blue-500 shrink-0"
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
                          onClick={(e) => { e.stopPropagation(); onView(item); }}
                          className="text-green-600 hover:text-green-800"
                        >
                          查看
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          编辑
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
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
                  colSpan={columns.length + (hasBatchActions ? 3 : 2)}
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
      </div>

      {/* 手机端卡片列表 */}
      <div className="md:hidden space-y-3">
        {hasBatchActions && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">全选</span>
          </div>
        )}
        {data.map((item) => {
          const itemTags = getEntityTags(item.id);
          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow p-4 ${
                selectedIds?.has(item.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {hasBatchActions && (
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(item.id) || false}
                    onChange={() => onSelect?.(item.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
                <div className="flex-1 min-w-0" onClick={() => onView?.(item)}>
                  <div className="font-medium text-gray-900 truncate">
                    {(item as Record<string, unknown>)[columns[0]?.key] ?? '-'}
                  </div>
                  {(mobileKeys
                    ? columns.filter(c => mobileKeys.includes(c.key))
                    : columns.slice(1, Math.min(3, columns.length - 1))
                  ).map((col) => (
                    <div key={col.key} className="text-sm text-gray-500 mt-1 truncate">
                      <span className="text-gray-400">{col.label}：</span>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '-')}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {itemTags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); setTagPickerItem(item); }}
                    className="text-gray-400 hover:text-blue-500 text-xs border border-dashed border-gray-300 rounded px-1.5 py-0.5"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm shrink-0 ml-2">
                  {onView && (
                    <button onClick={(e) => { e.stopPropagation(); onView(item); }} className="text-green-600">查看</button>
                  )}
                  {onEdit && (
                    <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="text-blue-600">编辑</button>
                  )}
                  {onDelete && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="text-red-600">删除</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <span className="text-4xl mb-2 block">📭</span>
            <span>暂无数据</span>
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {hasBatchActions && selectedCount > 0 && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-4">
          <span className="text-sm text-blue-700 font-medium">已选 {selectedCount} 条</span>
          <div className="flex items-center gap-2">
            {onBatchDelete && (
              <button
                onClick={onBatchDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                🗑️ 批量删除
              </button>
            )}
            {onBatchTag && (
              <div className="relative">
                <button
                  onClick={() => setShowBatchTag(!showBatchTag)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  🏷️ 批量打标签
                </button>
                {showBatchTag && allTags && (
                  <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 w-56 max-h-60 overflow-y-auto">
                    {allTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          onBatchTag(tag.id);
                          setShowBatchTag(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: tag.color || '#6B7280' }}
                        />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {onBatchExport && (
              <button
                onClick={onBatchExport}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                📄 导出选中
              </button>
            )}
          </div>
          <button
            onClick={() => onSelect?.(-1)}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          >
            取消选择
          </button>
        </div>
      )}

      {/* 标签选择器弹窗（单条） */}
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
