'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime, formatBeijingDate } from '@/lib/time';
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
  status: string;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'background', label: '背景', type: 'textarea' as const, rows: 5 },
  { name: 'reason', label: '理由', type: 'textarea' as const, rows: 5 },
  { name: 'result', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'decision_date', label: '决策日期', type: 'date' as const },
  {
    name: 'status', label: '状态', type: 'select' as const,
    options: [
      { value: 'pending', label: '📋 待执行' },
      { value: 'in_progress', label: '🔄 执行中' },
      { value: 'completed', label: '✅ 已完成' },
      { value: 'deprecated', label: '❌ 已废弃' },
    ],
  },
  {
    name: 'confidence', label: '置信度 (0-10)', type: 'select' as const,
    options: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: `${i} (${i * 10}%)` })),
  },
];

const columns = [
  { key: 'title', label: '标题', width: '25%' },
  {
    key: 'confidence',
    label: '置信度',
    render: (item: Decision) => (
      <span className="font-mono">
        {item.confidence != null ? `${item.confidence * 10}%` : '-'}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'status',
    label: '状态',
    render: (item: Decision) => (
      <span className={`px-2 py-1 rounded text-xs ${
        item.status === 'completed' ? 'bg-green-100 text-green-800' :
        item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
        item.status === 'deprecated' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {item.status === 'completed' ? '✅ 已完成' :
         item.status === 'in_progress' ? '🔄 执行中' :
         item.status === 'deprecated' ? '❌ 已废弃' : '📋 待执行'}
      </span>
    ),
    width: '10%',
  },
  {
    key: 'decision_date',
    label: '决策日期',
    render: (item: Decision) => (
      <span className="whitespace-nowrap">📅 {formatBeijingDate(item.decision_date)}</span>
    ),
    width: '15%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Decision) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

export default function DecisionsPage() {
  const router = useRouter();
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
        <div>
          <h1 className="text-2xl font-bold">🎯 决策记录</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data?.length || 0} 条决策</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建决策</span>
        </button>
      </div>

      {showForm && (
        <EntityForm
          fields={fields}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          initialData={editingItem || {}}
          title={editingItem ? '✏️ 编辑决策' : '➕ 新建决策'}
        />
      )}

      <EntityList entityType="decision"
        data={data || []}
        columns={columns}
        onView={(item) => router.push(`/decisions/${item.id}`)}
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
