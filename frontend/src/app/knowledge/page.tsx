'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Knowledge {
  id: number;
  title: string;
  content: string | null;
  category: string | null;
  source: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'content', label: '内容', type: 'textarea' as const, rows: 8 },
  { name: 'category', label: '分类' },
  { name: 'source', label: '来源' },
  {
    name: 'status', label: '状态', type: 'select' as const,
    options: [
      { value: 'unverified', label: '📋 待确认' },
      { value: 'verified', label: '✅ 已验证' },
      { value: 'outdated', label: '⚠️ 已过时' },
    ],
  },
  {
    name: 'confidence', label: '置信度 (0-10)', type: 'select' as const,
    options: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: `${i} (${i * 10}%)` })),
  },
];

const columns = [
  { key: 'title', label: '标题', width: '25%' },
  { key: 'category', label: '分类', width: '12%' },
  { key: 'source', label: '来源', width: '20%' },
  {
    key: 'confidence',
    label: '置信度',
    render: (item: Knowledge) => (
      <span className="font-mono">
        {item.confidence != null ? `${item.confidence * 10}%` : '-'}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'status',
    label: '状态',
    render: (item: Knowledge) => (
      <span className={`px-2 py-1 rounded text-xs ${
        item.status === 'verified' ? 'bg-green-100 text-green-800' :
        item.status === 'outdated' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {item.status === 'verified' ? '✅ 已验证' :
         item.status === 'outdated' ? '⚠️ 已过时' : '📋 待确认'}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Knowledge) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

export default function KnowledgePage() {
  const router = useRouter();
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
        <div>
          <h1 className="text-2xl font-bold">📚 知识库</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data?.length || 0} 条知识</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建知识</span>
        </button>
      </div>

      {showForm && (
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑知识' : '➕ 新建知识'}
        />
      )}

      <EntityList entityType="knowledge"
        data={data || []}
        columns={columns}
        onView={(item) => router.push(`/knowledge/${item.id}`)}
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
