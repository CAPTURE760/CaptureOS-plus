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
import { projectStatusOptions, priorityOptions, statusBgClass, priorityBgClass } from '@/lib/constants';

interface Project {
  id: number;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  priority: string;
  source_url: string | null;
  github_url: string | null;
  tool: string | null;
  run_command: string | null;
  tech_stack: string | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 6 },
  {
    name: 'status',
    label: '状态',
    type: 'select' as const,
    options: projectStatusOptions.map(o => ({ value: o.value, label: o.label })),
  },
  { name: 'start_date', label: '开始时间', type: 'datetime-local' as const },
  { name: 'end_date', label: '结束时间', type: 'datetime-local' as const },
  {
    name: 'priority', label: '优先级', type: 'select' as const,
    options: priorityOptions,
  },
  { name: 'source_url', label: '源文件地址', placeholder: 'D:\\projects\\xxx' },
  { name: 'github_url', label: 'GitHub 地址', placeholder: 'https://github.com/...' },
  {
    name: 'tool', label: '使用工具', type: 'select' as const,
    options: [
      { value: 'Claude Code', label: 'Claude Code' },
      { value: 'qclaw', label: 'qclaw' },
      { value: '手写', label: '手写' },
      { value: 'AI辅助', label: 'AI辅助' },
    ],
  },
  { name: 'run_command', label: '运行方式', type: 'textarea' as const, rows: 3, placeholder: 'docker compose up -d 等' },
  { name: 'tech_stack', label: '技术栈', placeholder: 'Next.js, FastAPI, PostgreSQL' },
  { name: 'attachments', label: '附件', type: 'attachments' as const },
];

const projectStatusLabelMap: Record<string, string> = Object.fromEntries(
  projectStatusOptions.map(o => [o.value, o.label])
);

const projectStatusEmoji: Record<string, string> = {
  active: '🟢', completed: '✅', paused: '⏸️', cancelled: '❌',
};

const columns = [
  { key: 'title', label: '标题', width: '25%' },
  {
    key: 'description',
    label: '描述',
    render: (item: Project) => (
      <span className="line-clamp-2 text-gray-600" title={item.description || ''}>
        {item.description || '-'}
      </span>
    ),
    width: '30%',
  },
  {
    key: 'status',
    label: '状态',
    render: (item: Project) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBgClass[item.status] || 'bg-gray-100 text-gray-800'}`}>
        {projectStatusEmoji[item.status] || ''} {projectStatusLabelMap[item.status] || item.status}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'priority',
    label: '优先级',
    render: (item: Project) => (
      <span className={`px-2 py-1 rounded text-xs ${priorityBgClass[item.priority] || 'bg-gray-100 text-gray-800'}`}>
        {item.priority}
      </span>
    ),
    width: '8%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Project) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

const PAGE_SIZE = 20;

export default function ProjectsPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    `/projects/?skip=${skip}&limit=${PAGE_SIZE}${filterStatus ? `&status=${filterStatus}` : ''}${filterPriority ? `&priority=${encodeURIComponent(filterPriority)}` : ''}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>(
    `/projects/count/${filterStatus || filterPriority ? '?' : ''}${filterStatus ? `status=${filterStatus}` : ''}${filterStatus && filterPriority ? '&' : ''}${filterPriority ? `priority=${encodeURIComponent(filterPriority)}` : ''}`,
    fetchAPI
  );
  const { data: allCountData } = useSWR<{ count: number }>(
    filterStatus || filterPriority ? '/projects/count/' : null,
    fetchAPI
  );
  const { mutate: globalMutate } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const total = countData?.count || 0;

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
      fetchAPI(`/projects/${id}`, { method: 'DELETE' })
    ));
    setSelectedIds(new Set());
    mutate();
    globalMutate('/projects/count/');
    toast(`已删除 ${selectedIds.size} 条记录`, 'success');
  };

  const handleBatchTag = async (tagId: number) => {
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'project', entity_id: id, tag_id: tagId }),
      })
    ));
    setSelectedIds(new Set());
    mutate();
  };

  const handleBatchStatus = async (status: string) => {
    const label = projectStatusLabelMap[status] || status;
    const ok = await confirm({
      title: '批量改状态',
      message: `确定要将选中的 ${selectedIds.size} 条记录状态改为「${label}」吗？`,
      confirmText: '确定修改',
    });
    if (!ok) return;
    await Promise.all(Array.from(selectedIds).map(id =>
      fetchAPI(`/projects/${id}`, {
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
      const res = await fetch(`${API_BASE}/export/word/projects/selected`, {
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
      a.download = `captureos-projects-selected-${today}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast('导出失败，请重试', 'error');
    }
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/projects/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/projects/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
    globalMutate('/projects/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast(editingItem ? '项目已更新' : '项目已创建', 'success');
  };

  const handleDelete = async (item: Project) => {
    const ok = await confirm({
      title: '删除项目',
      message: `确定要删除 "${item.title}" 吗？此操作不可撤销。`,
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/projects/${item.id}`, { method: 'DELETE' });
    mutate();
    globalMutate('/projects/count/');
    globalMutate('/dashboard/');
    globalMutate('/dashboard/counts');
    toast('项目已删除', 'success');
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📁 项目管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 个项目</p>
        </div>
        <ExportButton entityType="projects" />
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建项目</span>
        </button>
      </div>

      {showForm && (
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑项目' : '➕ 新建项目'}
        />
      )}

      <FilterBar
        statusFilters={projectStatusOptions.map(o => ({ value: o.value, label: o.label }))}
        priorityFilters={priorityOptions}
        activeStatus={filterStatus}
        activePriority={filterPriority}
        onStatusChange={(s) => { setFilterStatus(s); setPage(1); }}
        onPriorityChange={(p) => { setFilterPriority(p); setPage(1); }}
        filteredCount={filterStatus || filterPriority ? total : undefined}
        totalCount={filterStatus || filterPriority ? (allCountData?.count ?? total) : undefined}
      />

      <EntityList
        data={data || []}
        columns={columns}
        entityType="project"
        onView={(item) => router.push(`/projects/${item.id}`)}
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
        statusOptions={projectStatusOptions}
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
