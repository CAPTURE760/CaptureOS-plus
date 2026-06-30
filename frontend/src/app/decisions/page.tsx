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
import FilterBar from '@/components/FilterBar';
import Loading from '@/components/Loading';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { decisionStatusOptions, statusBgClass } from '@/lib/constants';

interface Decision {
  id: number;
  title: string;
  background: string | null;
  options: Record<string, unknown> | null;
  reason: string | null;
  result: string | null;
  decision_date: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'background', label: '背景', type: 'textarea' as const, rows: 5 },
  { name: 'reason', label: '理由', type: 'textarea' as const, rows: 5 },
  { name: 'result', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'decision_date', label: '决策时间', type: 'datetime-local' as const },
  {
    name: 'status', label: '状态', type: 'select' as const,
    options: decisionStatusOptions.map(o => ({ value: o.value, label: o.label })),
  },
  {
    name: 'confidence', label: '置信度 (0-10)', type: 'select' as const,
    options: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: `${i} (${i * 10}%)` })),
  },
];

const decisionStatusLabelMap: Record<string, string> = Object.fromEntries(
  decisionStatusOptions.map(o => [o.value, o.label])
);

const columns = [
  { key: 'title', label: '标题', width: '25%' },
  {
    key: 'confidence',
    label: '置信度',
    render: (item: Decision) => (
      <span className="font-mono">
        {item.confidence != null ? `${item.confidence * 10}%` : '-'}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'status',
    label: '状态',
    render: (item: Decision) => (
      <span className={`px-2 py-1 rounded text-xs ${statusBgClass[item.status] || 'bg-gray-100 text-gray-800'}`}>
        {decisionStatusLabelMap[item.status] || item.status}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'decision_date',
    label: '决策时间',
    render: (item: Decision) => (
      <span className="whitespace-nowrap">📅 {item.decision_date ? new Date(item.decision_date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
    ),
    width: '15%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Decision) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

const PAGE_SIZE = 20;

export default function DecisionsPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Decision[]>(
    `/decisions/?skip=${skip}&limit=${PAGE_SIZE}${filterStatus ? `&status=${filterStatus}` : ''}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>(
    `/decisions/count/${filterStatus ? `?status=${filterStatus}` : ''}`,
    fetchAPI
  );
  const { data: allCountData } = useSWR<{ count: number }>(
    filterStatus ? '/decisions/count/' : null,
    fetchAPI
  );
  const { mutate: globalMutate } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Decision | null>(null);
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
      fetchAPI(`/decisions/${id}`, { method: 'DELETE' })
    ));
    setSelectedIds(new Set());
    mutate();
    globalMutate('/decisions/count/');
    toast(`已删除 ${selectedIds.size} 条记录`, 'success');
  };

  const handleBatchTag = async (tagId: number) => {
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'decision', entity_id: id, tag_id: tagId }),
      })
    ));
    setSelectedIds(new Set());
    mutate();
  };

  const handleBatchStatus = async (status: string) => {
    const label = decisionStatusLabelMap[status] || status;
    const ok = await confirm({
      title: '批量改状态',
      message: `确定要将选中的 ${selectedIds.size} 条记录状态改为「${label}」吗？`,
      confirmText: '确定修改',
    });
    if (!ok) return;
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI(`/decisions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
    ));
    setSelectedIds(new Set());
    mutate();
    toast(`已将 ${selectedIds.size} 条记录状态改为「${label}」`, 'success');
  };

  const handleBatchExport = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API_BASE}/export/word/decisions/selected`, {
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
      a.download = `captureos-decisions-selected-${today}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast('导出失败，请重试', 'error');
    }
  };

  const total = countData?.count || 0;

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/decisions/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/decisions/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
    globalMutate('/decisions/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast(editingItem ? '决策已更新' : '决策已创建', 'success');
  };

  const handleDelete = async (item: Decision) => {
    const ok = await confirm({
      title: '删除决策',
      message: `确定要删除 "${item.title}" 吗？此操作不可撤销。`,
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/decisions/${item.id}`, { method: 'DELETE' });
    mutate();
    globalMutate('/decisions/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast('决策已删除', 'success');
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎯 决策记录</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条决策</p>
        </div>
        <ExportButton entityType="decisions" />
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建决策</span>
        </button>
      </div>

      {showForm && (
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑决策' : '➕ 新建决策'}
        />
      )}

      <FilterBar
        statusFilters={decisionStatusOptions.map(o => ({ value: o.value, label: o.label }))}
        activeStatus={filterStatus}
        onStatusChange={(s) => { setFilterStatus(s); setPage(1); }}
        filteredCount={filterStatus ? total : undefined}
        totalCount={filterStatus ? (allCountData?.count ?? total) : undefined}
      />

      <EntityList entityType="decision"
        data={data || []}
        columns={columns}
        onView={(item) => router.push(`/decisions/${item.id}`)}
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
        onBatchStatus={handleBatchStatus}
        statusOptions={decisionStatusOptions}
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
