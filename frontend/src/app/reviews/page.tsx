'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';
import Pagination from '@/components/Pagination';

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
  { name: 'review_date', label: '复盘时间', type: 'datetime-local' as const },
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
    label: '复盘时间',
    render: (item: Review) => (
      <span className="whitespace-nowrap">📅 {item.review_date ? new Date(item.review_date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
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

const PAGE_SIZE = 20;

export default function ReviewsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Review[]>(
    `/reviews/?skip=${skip}&limit=${PAGE_SIZE}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>('/reviews/count/', fetchAPI);
  const { mutate: globalMutate } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Review | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!data) return;
    setSelectedIds(prev => {
      const allOnPage = data.every(item => prev.has(item.id));
      if (allOnPage) return new Set();
      return new Set(data.map(item => item.id));
    });
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;
    for (const id of selectedIds) {
      await fetchAPI(`/reviews/${id}`, { method: 'DELETE' });
    }
    setSelectedIds(new Set());
    mutate();
    globalMutate('/reviews/count/');
  };

  const handleBatchTag = async (tagId: number) => {
    for (const id of selectedIds) {
      await fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'review', entity_id: id, tag_id: tagId }),
      });
    }
    setSelectedIds(new Set());
    mutate();
  };

  const total = countData?.count || 0;

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
    globalMutate('/reviews/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
  };

  const handleDelete = async (item: Review) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/reviews/${item.id}`, { method: 'DELETE' });
      mutate();
      globalMutate('/reviews/count/');
      globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📝 复盘总结</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 次复盘</p>
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
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑复盘' : '➕ 新建复盘'}
        />
      )}

      <EntityList entityType="review"
        data={data || []}
        columns={columns}
        onView={(item) => router.push(`/reviews/${item.id}`)}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onRefresh={() => mutate()}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onBatchDelete={handleBatchDelete}
        onBatchTag={handleBatchTag}
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
