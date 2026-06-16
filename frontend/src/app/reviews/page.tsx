'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Review {
  id: number;
  title: string;
  event_summary: string | null;
  success_factors: Record<string, unknown> | null;
  failure_factors: Record<string, unknown> | null;
  improvements: Record<string, unknown> | null;
  rating: number | null;
  period: string | null;
  review_date: string | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'event_summary', label: '事件摘要', type: 'textarea' as const },
  {
    name: 'rating',
    label: '评分 (1-5)',
    type: 'select' as const,
    options: [
      { value: '1', label: '1 - 很差' },
      { value: '2', label: '2 - 差' },
      { value: '3', label: '3 - 一般' },
      { value: '4', label: '4 - 好' },
      { value: '5', label: '5 - 很好' },
    ],
  },
  { name: 'period', label: '复盘周期' },
  { name: 'review_date', label: '复盘日期', type: 'date' as const },
];

const columns = [
  { key: 'title', label: '标题' },
  {
    key: 'rating',
    label: '评分',
    render: (item: Review) => (item.rating ? '⭐'.repeat(item.rating) : '-'),
  },
  { key: 'period', label: '周期' },
  {
    key: 'review_date',
    label: '复盘日期',
    render: (item: Review) =>
      item.review_date
        ? new Date(item.review_date).toLocaleDateString('zh-CN')
        : '-',
  },
];

export default function ReviewsPage() {
  const { data, error, isLoading, mutate } = useSWR<Review[]>('/reviews/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Review | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/reviews/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/reviews/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
  };

  const handleDelete = async (item: Review) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/reviews/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">复盘</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建复盘
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '编辑复盘' : '新建复盘'}
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
