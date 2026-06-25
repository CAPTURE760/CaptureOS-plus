'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
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

interface TagPickerProps {
  entityType: string;
  entityId: number;
  onClose: () => void;
  onUpdated: () => void;
}

// 标签方块
function TagBlockSmall({ tag, onClick, removable }: {
  tag: Tag;
  onClick?: () => void;
  removable?: boolean;
}) {
  const color = tag.color || '#6B7280';
  const level = tag.level || 1;

  return (
    <div
      className="relative group flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:opacity-80"
      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}` }}
      onClick={onClick}
    >
      <div
        className="w-6 h-4 rounded-sm overflow-hidden relative"
        style={{ border: `1px solid ${color}` }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${(level / 5) * 100}%`, backgroundColor: color }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white drop-shadow">{level}</span>
        </div>
      </div>
      <span className="text-sm">{tag.name}</span>
      {removable && (
        <span className="text-red-500 hover:text-red-700 ml-1">×</span>
      )}
    </div>
  );
}

export default function TagPicker({ entityType, entityId, onClose, onUpdated }: TagPickerProps) {
  const { data: allTags, mutate: mutateTags } = useSWR<Tag[]>('/tags/', fetchAPI);
  const { confirm } = useConfirm();
  const { toast } = useToast();

  // 获取实体的标签关系（EntityTag[]）
  const { data: entityTagRelations, mutate: mutateEntityTags } = useSWR<EntityTag[]>(
    `/tags/entity/${entityType}`,
    fetchAPI
  );

  const [selectedTagId, setSelectedTagId] = useState<string>('');

  // 过滤出当前实体的标签关系
  const currentEntityTags = entityTagRelations?.filter((et) => et.entity_id === entityId) || [];

  // 已打标签的 ID 列表
  const assignedTagIds = currentEntityTags.map((et) => et.tag_id);

  // 已打的标签对象列表
  const assignedTags = allTags?.filter((t) => assignedTagIds.includes(t.id)) || [];

  // 可添加的标签（排除已打的）
  const availableTags = allTags?.filter((t) => !assignedTagIds.includes(t.id)) || [];

  // 添加标签
  const handleAdd = async () => {
    if (!selectedTagId) return;
    await fetchAPI('/tags/assign', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        tag_id: Number(selectedTagId),
      }),
    });
    setSelectedTagId('');
    mutateEntityTags();
    onUpdated();
    toast('标签已添加', 'success');
  };

  // 移除标签
  const handleRemove = async (entityTagId: number, tagName: string) => {
    const ok = await confirm({
      title: '移除标签',
      message: `确定要移除标签 "${tagName}" 吗？`,
      confirmText: '确定移除',
      variant: 'warning',
    });
    if (!ok) return;
    await fetchAPI(`/tags/unassign/${entityTagId}`, { method: 'DELETE' });
    mutateEntityTags();
    onUpdated();
    toast('标签已移除', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 md:mx-0 max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold">🏷️ 管理标签</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="p-4">
          {/* 已打标签 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">已打标签</h4>
            {assignedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentEntityTags.map((et) => {
                  const tag = allTags?.find((t) => t.id === et.tag_id);
                  if (!tag) return null;
                  return (
                    <TagBlockSmall
                      key={et.id}
                      tag={tag}
                      removable
                      onClick={() => handleRemove(et.id, tag.name)}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无标签</p>
            )}
          </div>

          {/* 添加标签 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">添加标签</h4>
            <div className="flex gap-2">
              <select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">选择标签...</option>
                {availableTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name} (等级{tag.level})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!selectedTagId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
