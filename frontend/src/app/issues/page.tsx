'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import ExportButton from '@/components/ExportButton';
import Loading from '@/components/Loading';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { issueStatusOptions, priorityOptions, statusBgClass, priorityBgClass } from '@/lib/constants';

interface Issue {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  root_cause: string | null;
  discovered_date: string | null;
  resolved_date: string | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'description', label: '描述', type: 'textarea' as const },
  {
    name: 'status',
    label: '状态',
    type: 'select' as const,
    options: issueStatusOptions.map(o => ({ value: o.value, label: o.label })),
  },
  {
    name: 'priority', label: '优先级', type: 'select' as const,
    options: priorityOptions,
  },
  { name: 'root_cause', label: '根本原因', type: 'textarea' as const },
  { name: 'discovered_date', label: '发现时间', type: 'datetime-local' as const },
  { name: 'resolved_date', label: '解决日期', type: 'date' as const },
];

const statusLabelMap: Record<string, string> = Object.fromEntries(
  issueStatusOptions.map(o => [o.value, o.label])
);

const columns = [
  { key: 'title', label: '标题' },
  {
    key: 'status',
    label: '状态',
    render: (item: Issue) => (
      <span className={`px-2 py-1 rounded text-xs ${statusBgClass[item.status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabelMap[item.status] || item.status}
      </span>
    ),
  },
  {
    key: 'priority', label: '优先级',
    render: (item: Issue) => (
      <span className={`px-2 py-1 rounded text-xs ${priorityBgClass[item.priority] || 'bg-gray-100 text-gray-800'}`}>
        {item.priority}
      </span>
    ),
  },
  {
    key: 'discovered_date',
    label: '发现时间',
    render: (item: Issue) =>
      item.discovered_date ? new Date(item.discovered_date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-',
  },
];

const PAGE_SIZE = 20;

export default function IssuesPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Issue[]>(
    `/issues/?skip=${skip}&limit=${PAGE_SIZE}${filterStatus ? `&status=${filterStatus}` : ''}${filterPriority ? `&priority=${encodeURIComponent(filterPriority)}` : ''}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>(
    `/issues/count/${filterStatus || filterPriority ? '?' : ''}${filterStatus ? `status=${filterStatus}` : ''}${filterStatus && filterPriority ? '&' : ''}${filterPriority ? `priority=${encodeURIComponent(filterPriority)}` : ''}`,
    fetchAPI
  );
  const { data: allCountData } = useSWR<{ count: number }>(
    filterStatus || filterPriority ? '/issues/count/' : null,
    fetchAPI
  );
  const { mutate: globalMutate } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Issue | null>(null);
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
      fetchAPI(`/issues/${id}`, { method: 'DELETE' })
    ));
    setSelectedIds(new Set());
    mutate();
    globalMutate('/issues/count/');
    toast(`已删除 ${selectedIds.size} 条记录`, 'success');
  };

  const handleBatchTag = async (tagId: number) => {
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'issue', entity_id: id, tag_id: tagId }),
      })
    ));
    setSelectedIds(new Set());
    mutate();
  };

  const handleBatchStatus = async (status: string) => {
    const label = statusLabelMap[status] || status;
    const ok = await confirm({
      title: '批量改状态',
      message: `确定要将选中的 ${selectedIds.size} 条记录状态改为「${label}」吗？`,
      confirmText: '确定修改',
    });
    if (!ok) return;
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI(`/issues/${id}`, {
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
      const res = await fetch(`${API_BASE}/export/word/issues/selected`, {
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
      a.download = `captureos-issues-selected-${today}.docx`;
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
      await fetchAPI(`/issues/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/issues/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
    globalMutate('/issues/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast(editingItem ? '问题已更新' : '问题已创建', 'success');
  };

  const handleDelete = async (item: Issue) => {
    const ok = await confirm({
      title: '删除问题',
      message: `确定要删除 "${item.title}" 吗？此操作不可撤销。`,
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/issues/${item.id}`, { method: 'DELETE' });
    mutate();
    globalMutate('/issues/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast('问题已删除', 'success');
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">⚠️ 问题管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 个问题</p>
        </div>
        <ExportButton entityType="issues" />
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建问题
        </button>
      </div>

      {showForm && (
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑问题' : '➕ 新建问题'}
        />
      )}

      <FilterBar
        statusFilters={issueStatusOptions.map(o => ({ value: o.value, label: o.label }))}
        priorityFilters={priorityOptions}
        activeStatus={filterStatus}
        activePriority={filterPriority}
        onStatusChange={(s) => { setFilterStatus(s); setPage(1); }}
        onPriorityChange={(p) => { setFilterPriority(p); setPage(1); }}
        filteredCount={filterStatus || filterPriority ? total : undefined}
        totalCount={filterStatus || filterPriority ? (allCountData?.count ?? total) : undefined}
      />

      <EntityList entityType="issue"
        data={data || []}
        columns={columns}
        mobileKeys={['status', 'priority']}
        onView={(item) => router.push(`/issues/${item.id}`)}
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
        statusOptions={issueStatusOptions}
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
