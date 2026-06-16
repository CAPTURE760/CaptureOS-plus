'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime, formatBeijingDate } from '@/lib/time';
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
  { name: 'event_summary', label: '事件摘要', type: 'textarea' as const, rows: 5 },
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
  { key: 'title', label: '标题', width: '25%' },
  {
    key: 'rating',
    label: '评分',
    render: (item: Review) => (
      <span>{item.rating ? '⭐'.repeat(item.rating) : '-'}</span>
    ),
    width: '15%',
  },
  { key: 'period', label: '周期', width: '12%' },
  {
    key: 'review_date',
    label: '复盘日期',
    render: (item: Review) => (
      <span className="whitespace-nowrap">📅 {formatBeijingDate(item.review_date)}</span>
    ),
    width: '15%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Review) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
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
        <div>
          <h1 className="text-2xl font-bold">📝 复盘总结</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data?.length || 0} 次复盘</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建复盘</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-pink-500">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '✏️ 编辑复盘' : '➕ 新建复盘'}
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

      <EntityList entityType="review"
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
