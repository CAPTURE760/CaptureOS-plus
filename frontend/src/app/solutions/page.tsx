'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Solution {
  id: number;
  title: string;
  description: string | null;
  approach: string | null;
  outcome: string | null;
  effectiveness: number | null;
  implemented_date: string | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'description', label: '描述', type: 'textarea' as const },
  { name: 'approach', label: '方法', type: 'textarea' as const },
  { name: 'outcome', label: '结果', type: 'textarea' as const },
  { name: 'effectiveness', label: '有效性 (1-5)', type: 'number' as const },
  { name: 'implemented_date', label: '实施日期', type: 'date' as const },
];

const columns = [
  { key: 'title', label: '标题' },
  {
    key: 'effectiveness',
    label: '有效性',
    render: (item: Solution) =>
      item.effectiveness ? '⭐'.repeat(item.effectiveness) : '-',
  },
  {
    key: 'implemented_date',
    label: '实施日期',
    render: (item: Solution) =>
      item.implemented_date
        ? new Date(item.implemented_date).toLocaleDateString('zh-CN')
        : '-',
  },
];

export default function SolutionsPage() {
  const { data, error, isLoading, mutate } = useSWR<Solution[]>('/solutions/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Solution | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/solutions/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/solutions/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
  };

  const handleDelete = async (item: Solution) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/solutions/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">解决方案</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建解决方案
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '编辑解决方案' : '新建解决方案'}
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
