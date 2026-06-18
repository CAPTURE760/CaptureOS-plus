'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';
import Pagination from '@/components/Pagination';

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
    options: [
      { value: 'open', label: '待解决' },
      { value: 'in_progress', label: '处理中' },
      { value: 'resolved', label: '已解决' },
      { value: 'closed', label: '已关闭' },
    ],
  },
  {
    name: 'priority', label: '优先级', type: 'select' as const,
    options: [
      { value: '紧急', label: '🔴 紧急' },
      { value: '高', label: '🟠 高' },
      { value: '中', label: '🟡 中' },
      { value: '低', label: '🟢 低' },
    ],
  },
  { name: 'root_cause', label: '根本原因', type: 'textarea' as const },
  { name: 'discovered_date', label: '发现时间', type: 'datetime-local' as const },
  { name: 'resolved_date', label: '解决日期', type: 'date' as const },
];

const columns = [
  { key: 'title', label: '标题' },
  {
    key: 'status',
    label: '状态',
    render: (item: Issue) => (
      <span className={`px-2 py-1 rounded text-xs ${
        item.status === 'open' ? 'bg-red-100 text-red-800' :
        item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
        item.status === 'resolved' ? 'bg-green-100 text-green-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {item.status === 'open' ? '待解决' :
         item.status === 'in_progress' ? '处理中' :
         item.status === 'resolved' ? '已解决' : '已关闭'}
      </span>
    ),
  },
  {
    key: 'priority', label: '优先级',
    render: (item: Issue) => {
      const colors: Record<string, string> = {
        '紧急': 'bg-red-100 text-red-800', '高': 'bg-orange-100 text-orange-800',
        '中': 'bg-yellow-100 text-yellow-800', '低': 'bg-green-100 text-green-800',
      };
      return <span className={`px-2 py-1 rounded text-xs ${colors[item.priority] || 'bg-gray-100'}`}>{item.priority}</span>;
    },
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
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, error, isLoading, mutate } = useSWR<Issue[]>(
    `/issues/?skip=${skip}&limit=${PAGE_SIZE}`, fetchAPI
  );
  const { data: countData } = useSWR<{ count: number }>('/issues/count/', fetchAPI);
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
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;
    for (const id of selectedIds) {
      await fetchAPI(`/issues/${id}`, { method: 'DELETE' });
    }
    setSelectedIds(new Set());
    mutate();
    globalMutate('/issues/count/');
  };

  const handleBatchTag = async (tagId: number) => {
    for (const id of selectedIds) {
      await fetchAPI('/tags/assign', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'issue', entity_id: id, tag_id: tagId }),
      });
    }
    setSelectedIds(new Set());
    mutate();
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
  };

  const handleDelete = async (item: Issue) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/issues/${item.id}`, { method: 'DELETE' });
      mutate();
      globalMutate('/issues/count/');
      globalMutate('/dashboard/');
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">⚠️ 问题管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 个问题</p>
        </div>
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

      <EntityList entityType="issue"
        data={data || []}
        columns={columns}
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
      />

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
