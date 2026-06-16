'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Tag {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
  created_at: string;
}

const fields = [
  { name: 'name', label: '名称', required: true },
  { name: 'color', label: '颜色 (HEX)' },
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 3 },
];

const columns = [
  {
    key: 'name',
    label: '名称',
    render: (item: Tag) => (
      <div className="flex items-center gap-2">
        {item.color && (
          <span
            className="w-4 h-4 rounded-full inline-block border"
            style={{ backgroundColor: item.color }}
          />
        )}
        <span className="font-medium">{item.name}</span>
      </div>
    ),
    width: '25%',
  },
  {
    key: 'description',
    label: '描述',
    render: (item: Tag) => (
      <span className="line-clamp-2 text-gray-600" title={item.description || ''}>
        {item.description || '-'}
      </span>
    ),
    width: '40%',
  },
  {
    key: 'created_at',
    label: '创建时间 (北京时间)',
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
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Tag | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/tags/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/tags/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
  };

  const handleDelete = async (item: Tag) => {
    if (confirm(`确定要删除标签 "${item.name}" 吗？`)) {
      await fetchAPI(`/tags/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
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

      <EntityList
        data={data || []}
        columns={columns}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
