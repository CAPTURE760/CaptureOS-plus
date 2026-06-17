'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';
import EntityForm from '@/components/EntityForm';

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 4 },
  { name: 'approach', label: '方法', type: 'textarea' as const, rows: 5 },
  { name: 'outcome', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'effectiveness', label: '有效性 (1-5)', type: 'number' as const },
  { name: 'implemented_date', label: '实施日期', type: 'date' as const },
];

export default function SolutionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);

  const { data: entity, error, isLoading, mutate } = useSWR(`/solutions/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这个方案吗？')) {
      await fetchAPI(`/solutions/${id}`, { method: 'DELETE' });
      router.push('/solutions');
    }
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    await fetchAPI(`/solutions/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <>
      <EntityDetail
        entityType="solution"
        entityId={id}
        entity={entity}
        onBack={() => router.push('/solutions')}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑方案"
        />
      )}
    </>
  );
}
