'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime, formatBeijingDate } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Project {
  id: number;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  priority: number;
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
  { name: 'priority', label: '优先级', type: 'number' as const },
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
    render: (item: Project) => (
      <span className="font-mono">{item.priority}</span>
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

export default function ProjectsPage() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>('/projects/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);

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
  };

  const handleDelete = async (item: Project) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/projects/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📁 项目管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data?.length || 0} 个项目</p>
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
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '✏️ 编辑项目' : '➕ 新建项目'}
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

      <EntityList
        data={data || []}
        columns={columns}
        entityType="project"
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
