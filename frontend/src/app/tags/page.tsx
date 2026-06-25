'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';
import Loading from '@/components/Loading';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

interface Tag {
  id: number;
  name: string;
  color: string | null;
  level: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// 等级文字
const levelLabels: Record<number, string> = {
  1: '轻微',
  2: '一般',
  3: '中等',
  4: '重要',
  5: '严重',
};

// 标签方块组件
function TagBlock({ tag }: { tag: Tag }) {
  const color = tag.color || '#6B7280';
  const level = tag.level || 1;

  return (
    <div className="flex items-center gap-3">
      {/* 方块 */}
      <div
        className="relative w-12 h-8 rounded border-2 overflow-hidden"
        style={{ borderColor: color }}
      >
        {/* 填充部分 */}
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{
            width: `${(level / 5) * 100}%`,
            backgroundColor: color,
          }}
        />
        {/* 等级数字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {level}
          </span>
        </div>
      </div>
      {/* 名称 */}
      <span className="font-medium">{tag.name}</span>
    </div>
  );
}

// 预选颜色
const presetColors = [
  { value: '#EF4444', label: '🔴 红色 - 紧急/Bug' },
  { value: '#F97316', label: '🟠 橙色 - 警告' },
  { value: '#EAB308', label: '🟡 黄色 - 注意' },
  { value: '#22C55E', label: '🟢 绿色 - 正常/完成' },
  { value: '#3B82F6', label: '🔵 蓝色 - 信息/进行中' },
  { value: '#8B5CF6', label: '🟣 紫色 - 知识/学习' },
  { value: '#EC4899', label: '🩷 粉色 - 创意/想法' },
  { value: '#6B7280', label: '⚪ 灰色 - 归档/其他' },
];

const fields = [
  { name: 'name', label: '名称', required: true },
  {
    name: 'color',
    label: '颜色',
    type: 'select' as const,
    options: presetColors,
  },
  {
    name: 'level',
    label: '等级',
    type: 'select' as const,
    options: [
      { value: '1', label: '1 - 轻微' },
      { value: '2', label: '2 - 一般' },
      { value: '3', label: '3 - 中等' },
      { value: '4', label: '4 - 重要' },
      { value: '5', label: '5 - 严重' },
    ],
  },
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 3 },
];

const columns = [
  {
    key: 'name',
    label: '标签',
    render: (item: Tag) => <TagBlock tag={item} />,
    width: '30%',
  },
  {
    key: 'level',
    label: '等级',
    render: (item: Tag) => (
      <span className="text-sm">
        {levelLabels[item.level] || '一般'}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'description',
    label: '描述',
    render: (item: Tag) => (
      <span className="line-clamp-2 text-gray-600" title={item.description || ''}>
        {item.description || '-'}
      </span>
    ),
    width: '35%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Tag) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '20%',
  },
];

export default function TagsPage() {
  const { data, error, isLoading, mutate } = useSWR<Tag[]>('/tags/', fetchAPI);
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Tag | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const submitData = {
      ...formData,
      level: Number(formData.level) || 1,
    };
    if (editingItem) {
      await fetchAPI(`/tags/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(submitData),
      });
    } else {
      await fetchAPI('/tags/', {
        method: 'POST',
        body: JSON.stringify(submitData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
    toast(editingItem ? '标签已更新' : '标签已创建', 'success');
  };

  const handleDelete = async (item: Tag) => {
    const { count } = await fetchAPI<{ count: number }>(`/tags/${item.id}/entity-count`);

    const ok = await confirm({
      title: '删除标签',
      message: count > 0
        ? `标签 "${item.name}" 已关联 ${count} 个实体，确定要停用此标签吗？`
        : `确定要删除标签 "${item.name}" 吗？`,
      confirmText: count > 0 ? '确定停用' : '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/tags/${item.id}`, { method: 'DELETE' });
    mutate();
    toast('标签已删除', 'success');
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🏷️ 标签管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data?.length || 0} 个标签</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建标签</span>
        </button>
      </div>

      {/* 标签预览 */}
      {data && data.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">标签预览</h3>
          <div className="flex flex-wrap gap-3">
            {data.map((tag) => (
              <TagBlock key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-gray-500">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '✏️ 编辑标签' : '➕ 新建标签'}
          </h2>
          <EntityForm
            fields={fields}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            initialData={editingItem || {}}
          />
        </div>
      )}

      <EntityList entityType="tag"
        data={data || []}
        columns={columns}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onRefresh={() => mutate()}
      />
    </div>
  );
}
