'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Decision {
  id: number;
  title: string;
  background: string | null;
  options: Record<string, unknown> | null;
  reason: string | null;
  result: string | null;
  decision_date: string | null;
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'background', label: '背景', type: 'textarea' as const },
  { name: 'reason', label: '理由', type: 'textarea' as const },
  { name: 'result', label: '结果', type: 'textarea' as const },
  { name: 'decision_date', label: '决策日期', type: 'date' as const },
  { name: 'confidence', label: '置信度 (0-1)', type: 'number' as const },
];

const columns = [
  { key: 'title', label: '标题' },
  {
    key: 'confidence',
    label: '置信度',
    render: (item: Decision) =>
      item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : '-',
  },
  {
    key: 'decision_date',
    label: '决策日期',
    render: (item: Decision) =>
      item.decision_date
        ? new Date(item.decision_date).toLocaleDateString('zh-CN')
        : '-',
  },
];

export default function DecisionsPage() {
  const { data, error, isLoading, mutate } = useSWR<Decision[]>('/decisions/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Decision | null>(null);

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
  };

  const handleDelete = async (item: Decision) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/decisions/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">决策</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建决策
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '编辑决策' : '新建决策'}
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
