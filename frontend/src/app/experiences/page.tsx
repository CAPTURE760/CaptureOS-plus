'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime, formatBeijingDate } from '@/lib/time';
import EntityList from '@/components/EntityList';
import EntityForm from '@/components/EntityForm';

interface Experience {
  id: number;
  title: string;
  summary: string | null;
  context: string | null;
  result: string | null;
  lesson: string | null;
  event_date: string | null;
  created_at: string;
  updated_at: string;
}

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'summary', label: '摘要', type: 'textarea' as const, rows: 4 },
  { name: 'context', label: '背景', type: 'textarea' as const, rows: 5 },
  { name: 'result', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'lesson', label: '教训', type: 'textarea' as const, rows: 5 },
  { name: 'event_date', label: '事件日期', type: 'date' as const },
];

const columns = [
  { key: 'title', label: '标题', width: '20%' },
  {
    key: 'summary',
    label: '摘要',
    render: (item: Experience) => (
      <span className="line-clamp-2 text-gray-600" title={item.summary || ''}>
        {item.summary || '-'}
      </span>
    ),
    width: '25%',
  },
  {
    key: 'lesson',
    label: '教训',
    render: (item: Experience) => (
      <span className="line-clamp-2 text-orange-600" title={item.lesson || ''}>
        {item.lesson || '-'}
      </span>
    ),
    width: '25%',
  },
  {
    key: 'event_date',
    label: '事件日期',
    render: (item: Experience) => (
      <span className="whitespace-nowrap">📅 {formatBeijingDate(item.event_date)}</span>
    ),
    width: '12%',
  },
  {
    key: 'created_at',
    label: '创建时间',
    render: (item: Experience) => (
      <span className="text-gray-500 text-xs whitespace-nowrap">
        🕐 {formatBeijingTime(item.created_at)}
      </span>
    ),
    width: '15%',
  },
];

export default function ExperiencesPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<Experience[]>('/experiences/', fetchAPI);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Experience | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editingItem) {
      await fetchAPI(`/experiences/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
    } else {
      await fetchAPI('/experiences/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditingItem(null);
    mutate();
  };

  const handleDelete = async (item: Experience) => {
    if (confirm(`确定要删除 "${item.title}" 吗？`)) {
      await fetchAPI(`/experiences/${item.id}`, { method: 'DELETE' });
      mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">💡 经验管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {data?.length || 0} 条经验</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建经验</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-yellow-500">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? '✏️ 编辑经验' : '➕ 新建经验'}
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

      <EntityList entityType="experience"
        data={data || []}
        columns={columns}
        onView={(item) => router.push(`/experiences/${item.id}`)}
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
