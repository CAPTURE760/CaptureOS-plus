'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Experience {
  id: number;
  title: string;
  summary: string | null;
  context: string | null;
  result: string | null;
  lesson: string | null;
  event_date: string | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'summary', label: '摘要', type: 'textarea' as const },
  { name: 'context', label: '背景', type: 'textarea' as const },
  { name: 'result', label: '结果', type: 'textarea' as const },
  { name: 'lesson', label: '教训', type: 'textarea' as const },
  { name: 'event_date', label: '事件日期', type: 'date' as const },
];

const columns = [
  { key: 'title', label: '标题' },
  { key: 'summary', label: '摘要' },
  {
    key: 'event_date',
    label: '事件日期',
    render: (item: Experience) =>
      item.event_date ? new Date(item.event_date).toLocaleDateString('zh-CN') : '-',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Experience) => new Date(item.created_at).toLocaleDateString('zh-CN'),
  },
];

export default function ExperiencesPage() {
  const { data, error, isLoading, mutate } = useSWR<Experience[]>('/experiences/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Experience | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/experiences/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/experiences/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
  };

  const handleDelete = async (item: Experience) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/experiences/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">经验</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建经验
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '编辑经验' : '新建经验'}
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
