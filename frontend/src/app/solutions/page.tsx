'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';
import Pagination from '@/components/Pagination';

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
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 4 },
  { name: 'approach', label: '方法', type: 'textarea' as const, rows: 5 },
  { name: 'outcome', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'effectiveness', label: '有效性 (1-5)', type: 'number' as const },
  { name: 'implemented_date', label: '实施日期', type: 'date' as const },
];

const columns = [
  { key: 'title', label: '标题', width: '25%' },
  {
    key: 'effectiveness',
    label: '有效性',
    render: (item: Solution) => (
      <span>{item.effectiveness ? '⭐'.repeat(item.effectiveness) : '-'}</span>
    ),
    width: '15%',
  },
  {
    key: 'implemented_date',
    label: '实施日期',
    render: (item: Solution) => (
      <span className="whitespace-nowrap">
        📅 {item.implemented_date ? new Date(item.implemented_date).toLocaleDateString('zh-CN') : '-'}
      </span>
    ),
    width: '15%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Solution) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

const PAGE_SIZE = 20;

export default function SolutionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Solution[]>(
    `/solutions/?skip=${skip}&limit=${PAGE_SIZE}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>('/solutions/count/', fetchAPI);
  const { mutate: globalMutate } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Solution | null>(null);
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
      await fetchAPI(`/solutions/${id}`, { method: 'DELETE' });
    }
    setSelectedIds(new Set());
    mutate();
    globalMutate('/solutions/count/');
  };

  const handleBatchTag = async (tagId: number) => {
    for (const id of selectedIds) {
      await fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'solution', entity_id: id, tag_id: tagId }),
      });
    }
    setSelectedIds(new Set());
    mutate();
  };

  const total = countData?.count || 0;

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
    globalMutate('/solutions/count/');
  };

  const handleDelete = async (item: Solution) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/solutions/${item.id}`, { method: 'DELETE' });
      mutate();
      globalMutate('/solutions/count/');
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🔧 解决方案</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 个方案</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建方案</span>
        </button>
      </div>

      {showForm && (
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑方案' : '➕ 新建方案'}
        />
      )}

      <EntityList entityType="solution"
        data={data || []}
        columns={columns}
        onView={(item) => router.push(`/solutions/${item.id}`)}
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
