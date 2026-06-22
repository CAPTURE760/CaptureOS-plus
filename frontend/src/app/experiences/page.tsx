'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import ExportButton from '@/components/ExportButton';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';
import Pagination from '@/components/Pagination';

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
  { name: 'summary', label: '摘要', type: 'textarea' as const, rows: 4 },
  { name: 'context', label: '背景', type: 'textarea' as const, rows: 5 },
  { name: 'result', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'lesson', label: '教训', type: 'textarea' as const, rows: 5 },
  { name: 'event_date', label: '事件时间', type: 'datetime-local' as const },
];

const columns = [
  { key: 'title', label: '标题', width: '20%' },
  {
    key: 'summary',
    label: '摘要',
    render: (item: Experience) => (
      <span className="line-clamp-2 text-gray-600" title={item.summary || ''}>
        {item.summary || '-'}
      </span>
    ),
    width: '25%',
  },
  {
    key: 'lesson',
    label: '教训',
    render: (item: Experience) => (
      <span className="line-clamp-2 text-orange-600" title={item.lesson || ''}>
        {item.lesson || '-'}
      </span>
    ),
    width: '25%',
  },
  {
    key: 'event_date',
    label: '事件时间',
    render: (item: Experience) => (
      <span className="whitespace-nowrap">📅 {item.event_date ? new Date(item.event_date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
    ),
    width: '12%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Experience) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

const PAGE_SIZE = 20;

export default function ExperiencesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Experience[]>(
    `/experiences/?skip=${skip}&limit=${PAGE_SIZE}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>('/experiences/count/', fetchAPI);
  const { mutate: globalMutate } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Experience | null>(null);
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
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI(`/experiences/${id}`, { method: 'DELETE' })
    ));
    setSelectedIds(new Set());
    mutate();
    globalMutate('/experiences/count/');
  };

  const handleBatchTag = async (tagId: number) => {
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'experience', entity_id: id, tag_id: tagId }),
      })
    ));
    setSelectedIds(new Set());
    mutate();
  };

  const handleBatchExport = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API_BASE}/export/word/experiences/selected`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `captureos-experiences-selected-${today}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败，请重试');
    }
  };

  const total = countData?.count || 0;

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
    globalMutate('/experiences/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
  };

  const handleDelete = async (item: Experience) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/experiences/${item.id}`, { method: 'DELETE' });
      mutate();
      globalMutate('/experiences/count/');
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
          <h1 className="text-2xl font-bold">💡 经验管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条经验</p>
        </div>
        <ExportButton entityType="experiences" />
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建经验</span>
        </button>
      </div>

      {showForm && (
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑经验' : '➕ 新建经验'}
        />
      )}

      <EntityList entityType="experience"
        data={data || []}
        columns={columns}
        onView={(item) => router.push(`/experiences/${item.id}`)}
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
        onBatchExport={handleBatchExport}
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
