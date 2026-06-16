'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
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
  { name: 'description', label: '描述', type: 'textarea' as const },
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
  { key: 'title', label: '标题' },
  {
    key: 'status',
    label: '状态',
    render: (item: Project) => (
      <span className={`px-2 py-1 rounded text-xs ${
        item.status === 'active' ? 'bg-green-100 text-green-800' :
        item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {item.status === 'active' ? '进行中' :
         item.status === 'completed' ? '已完成' :
         item.status === 'paused' ? '暂停' : '已取消'}
      </span>
    ),
  },
  { key: 'priority', label: '优先级' },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Project) => new Date(item.created_at).toLocaleDateString('zh-CN'),
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
        <h1 className="text-2xl font-bold">项目</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建项目
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '编辑项目' : '新建项目'}
          </h2>
          <EntityForm
            fields={fields}
            onSubmit={handleSubmit}
            initialData={editingItem || {}}
          />
          <button
            onClick={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
        </div>
      )}

      <EntityList
        data={data || []}
        columns={columns}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
