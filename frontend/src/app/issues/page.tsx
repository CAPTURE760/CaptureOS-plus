'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Issue {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: number;
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
  { name: 'priority', label: '优先级', type: 'number' as const },
  { name: 'root_cause', label: '根本原因', type: 'textarea' as const },
  { name: 'discovered_date', label: '发现日期', type: 'date' as const },
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
  { key: 'priority', label: '优先级' },
  {
    key: 'discovered_date',
    label: '发现日期',
    render: (item: Issue) =>
      item.discovered_date ? new Date(item.discovered_date).toLocaleDateString('zh-CN') : '-',
  },
];

export default function IssuesPage() {
  const { data, error, isLoading, mutate } = useSWR<Issue[]>('/issues/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Issue | null>(null);

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
  };

  const handleDelete = async (item: Issue) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/issues/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">问题</h1>
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
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-red-500">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '✏️ 编辑问题' : '➕ 新建问题'}
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

      <EntityList entityType="issue"
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
