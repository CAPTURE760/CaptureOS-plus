'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';
import EntityForm from '@/components/EntityForm';

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'background', label: '背景', type: 'textarea' as const, rows: 5 },
  { name: 'reason', label: '理由', type: 'textarea' as const, rows: 5 },
  { name: 'result', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'decision_date', label: '决策日期', type: 'date' as const },
  { name: 'status', label: '状态', type: 'select' as const, options: [
    { value: 'pending', label: '📋 待执行' },
    { value: 'in_progress', label: '🔄 执行中' },
    { value: 'completed', label: '✅ 已完成' },
    { value: 'deprecated', label: '❌ 已废弃' },
  ]},
  { name: 'confidence', label: '置信度 (0-10)', type: 'select' as const,
    options: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: `${i} (${i * 10}%)` })),
  },
];

export default function DecisionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);

  const { data: entity, error, isLoading, mutate } = useSWR(`/decisions/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这个决策吗？')) {
      await fetchAPI(`/decisions/${id}`, { method: 'DELETE' });
      router.push('/decisions');
    }
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    await fetchAPI(`/decisions/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <>
      <EntityDetail
        entityType="decision"
        entityId={id}
        entity={entity}
        onBack={() => router.push('/decisions')}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑决策"
        />
      )}
    </>
  );
}
