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
import Loading from '@/components/Loading';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

interface PendingFile {
  file: File;
  name: string;
  size: number;
  type?: string;
}

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
  { name: 'period', label: '复盘周期', type: 'select' as const, options: [
    { value: '日复盘', label: '📅 日复盘 — 每天回顾' },
    { value: '周复盘', label: '📆 周复盘 — 每周总结' },
    { value: '月复盘', label: '🗓️ 月复盘 — 每月回顾' },
    { value: '季度复盘', label: '📊 季度复盘 — 三个月总结' },
    { value: '年度复盘', label: '📈 年度复盘 — 年终总结' },
    { value: '项目复盘', label: '📁 项目复盘 — 项目结束后' },
    { value: '临时复盘', label: '📝 临时复盘 — 单次事件' },
  ]},
  { name: 'review_date', label: '复盘时间', type: 'datetime-local' as const },
  { name: 'attachments', label: '附件', type: 'attachments' as const },
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
  const { confirm } = useConfirm();
  const { toast } = useToast();
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
    const ok = await confirm({
      title: '批量删除',
      message: `确定要删除选中的 ${selectedIds.size} 条记录吗？此操作不可撤销。`,
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI(`/reviews/${id}`, { method: 'DELETE' })
    ));
    setSelectedIds(new Set());
    mutate();
    globalMutate('/reviews/count/');
    toast(`已删除 ${selectedIds.size} 条记录`, 'success');
  };

  const handleBatchTag = async (tagId: number) => {
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'review', entity_id: id, tag_id: tagId }),
      })
    ));
    setSelectedIds(new Set());
    mutate();
  };

  const handleBatchExport = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API_BASE}/export/word/reviews/selected`, {
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
      a.download = `captureos-reviews-selected-${today}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast('导出失败，请重试', 'error');
    }
  };

  const total = countData?.count || 0;

  const handleSubmit = async (formData: Record<string, unknown>, pendingFiles?: PendingFile[]) => {
    let entityId: number | undefined;

    if (editingItem) {
      await fetchAPI(`/reviews/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      entityId = editingItem.id;
    } else {
      const result = await fetchAPI<{ id: number }>('/reviews/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      entityId = result.id;
    }

    // 上传待处理的附件
    if (pendingFiles && pendingFiles.length > 0 && entityId) {
      for (const pf of pendingFiles) {
        const formDataObj = new FormData();
        formDataObj.append('file', pf.file);
        formDataObj.append('entity_type', 'review');
        formDataObj.append('entity_id', entityId.toString());

        await fetchAPI('/upload/to-entity', {
          method: 'POST',
          headers: {},
          body: formDataObj,
        });
      }
    }

    setShowForm(false);
    setEditingItem(null);
    mutate();
    globalMutate('/reviews/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast(editingItem ? '复盘已更新' : '复盘已创建', 'success');
  };

  const handleDelete = async (item: Review) => {
    const ok = await confirm({
      title: '删除复盘',
      message: `确定要删除 "${item.title}" 吗？此操作不可撤销。`,
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/reviews/${item.id}`, { method: 'DELETE' });
    mutate();
    globalMutate('/reviews/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast('复盘已删除', 'success');
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📝 复盘总结</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 次复盘</p>
        </div>
        <ExportButton entityType="reviews" />
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
          entityInfo={{
            type: 'review',
            id: editingItem?.id
          }}
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
        onClearSelection={() => setSelectedIds(new Set())}
        onBatchDelete={handleBatchDelete}
        onBatchTag={handleBatchTag}
        onBatchExport={handleBatchExport}
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
