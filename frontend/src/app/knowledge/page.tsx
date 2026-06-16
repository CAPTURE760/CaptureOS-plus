'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Knowledge {
  id: number;
  title: string;
  content: string | null;
  category: string | null;
  source: string | null;
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'content', label: '内容', type: 'textarea' as const },
  { name: 'category', label: '分类' },
  { name: 'source', label: '来源' },
  { name: 'confidence', label: '置信度 (0-1)', type: 'number' as const },
];

const columns = [
  { key: 'title', label: '标题' },
  { key: 'category', label: '分类' },
  { key: 'source', label: '来源' },
  {
    key: 'confidence',
    label: '置信度',
    render: (item: Knowledge) =>
      item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : '-',
  },
];

export default function KnowledgePage() {
  const { data, error, isLoading, mutate } = useSWR<Knowledge[]>('/knowledge/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Knowledge | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/knowledge/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/knowledge/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
  };

  const handleDelete = async (item: Knowledge) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/knowledge/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">知识</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新建知识
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '编辑知识' : '新建知识'}
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
