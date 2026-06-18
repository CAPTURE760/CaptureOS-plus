'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime, formatBeijingDate } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';
import Pagination from '@/components/Pagination';

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
    options: [
      { value: 'active', label: '进行中' },
      { value: 'completed', label: '已完成' },
      { value: 'paused', label: '暂停' },
      { value: 'cancelled', label: '已取消' },
    ],
  },
  { name: 'start_date', label: '开始日期', type: 'date' as const },
  { name: 'end_date', label: '结束日期', type: 'date' as const },
  {
    name: 'priority', label: '优先级', type: 'select' as const,
    options: [
      { value: '紧急', label: '🔴 紧急' },
      { value: '高', label: '🟠 高' },
      { value: '中', label: '🟡 中' },
      { value: '低', label: '🟢 低' },
    ],
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
];

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
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        item.status === 'active' ? 'bg-green-100 text-green-800' :
        item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
        item.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {item.status === 'active' ? '🟢 进行中' :
         item.status === 'completed' ? '✅ 已完成' :
         item.status === 'paused' ? '⏸️ 暂停' : '❌ 已取消'}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'priority',
    label: '优先级',
    render: (item: Project) => {
      const colors: Record<string, string> = {
        '紧急': 'bg-red-100 text-red-800', '高': 'bg-orange-100 text-orange-800',
        '中': 'bg-yellow-100 text-yellow-800', '低': 'bg-green-100 text-green-800',
      };
      return <span className={`px-2 py-1 rounded text-xs ${colors[item.priority] || 'bg-gray-100'}`}>{item.priority}</span>;
    },
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
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    `/projects/?skip=${skip}&limit=${PAGE_SIZE}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>('/projects/count/', fetchAPI);
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
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;
    for (const id of selectedIds) {
      await fetchAPI(`/projects/${id}`, { method: 'DELETE' });
    }
    setSelectedIds(new Set());
    mutate();
    globalMutate('/projects/count/');
  };

  const handleBatchTag = async (tagId: number) => {
    for (const id of selectedIds) {
      await fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'project', entity_id: id, tag_id: tagId }),
      });
    }
    setSelectedIds(new Set());
    mutate();
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
  };

  const handleDelete = async (item: Project) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/projects/${item.id}`, { method: 'DELETE' });
      mutate();
      globalMutate('/projects/count/');
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📁 项目管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 个项目</p>
        </div>
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
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
