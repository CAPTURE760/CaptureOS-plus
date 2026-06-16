'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Solution {
  id: number;
  title: string;
  description: string | null;
  approach: string | null;
  outcome: string | null;
  effectiveness: number | null;
  implemented_date: string | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 4 },
  { name: 'approach', label: '方法', type: 'textarea' as const, rows: 5 },
  { name: 'outcome', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'effectiveness', label: '有效性 (1-5)', type: 'number' as const },
  { name: 'implemented_date', label: '实施日期', type: 'date' as const },
];

const columns = [
  { key: 'title', label: '标题', width: '25%' },
  {
    key: 'effectiveness',
    label: '有效性',
    render: (item: Solution) => (
      <span>{item.effectiveness ? '⭐'.repeat(item.effectiveness) : '-'}</span>
    ),
    width: '15%',
  },
  {
    key: 'implemented_date',
    label: '实施日期',
    render: (item: Solution) => (
      <span className="whitespace-nowrap">
        📅 {item.implemented_date ? new Date(item.implemented_date).toLocaleDateString('zh-CN') : '-'}
      </span>
    ),
    width: '15%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Solution) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

export default function SolutionsPage() {
  const { data, error, isLoading, mutate } = useSWR<Solution[]>('/solutions/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Solution | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/solutions/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/solutions/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
  };

  const handleDelete = async (item: Solution) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/solutions/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🔧 解决方案</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data?.length || 0} 个方案</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建方案</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-green-500">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '✏️ 编辑方案' : '➕ 新建方案'}
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

      <EntityList entityType="solution"
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
