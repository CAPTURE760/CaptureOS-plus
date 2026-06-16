'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
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
  { name: 'description', label: '描述', type: 'textarea' as const },
];

const columns = [
  {
    key: 'name',
    label: '名称',
    render: (item: Tag) => (
      <div className="flex items-center gap-2">
        {item.color && (
          <span
            className="w-4 h-4 rounded-full inline-block"
            style={{ backgroundColor: item.color }}
          />
        )}
        {item.name}
      </div>
    ),
  },
  { key: 'description', label: '描述' },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Tag) => new Date(item.created_at).toLocaleDateString('zh-CN'),
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
        <h1 className="text-2xl font-bold">标签</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建标签
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '编辑标签' : '新建标签'}
          </h2>
          <EntityForm
            fields={fields}
            onSubmit={handleSubmit}
            initialData={editingItem || {}}
          />
          <button
            onClick={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
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
