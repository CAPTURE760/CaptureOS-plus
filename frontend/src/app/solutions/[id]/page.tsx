'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';
import EntityForm from '@/components/EntityForm';
import Loading from '@/components/Loading';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 4 },
  { name: 'approach', label: '方法', type: 'textarea' as const, rows: 5 },
  { name: 'outcome', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'effectiveness', label: '有效性', type: 'select' as const, options: [
    { value: '1', label: '⭐ 1 - 无效' },
    { value: '2', label: '⭐⭐ 2 - 效果一般' },
    { value: '3', label: '⭐⭐⭐ 3 - 有效果' },
    { value: '4', label: '⭐⭐⭐⭐ 4 - 效果很好' },
    { value: '5', label: '⭐⭐⭐⭐⭐ 5 - 非常有效' },
  ]},
  { name: 'implemented_date', label: '实施时间', type: 'datetime-local' as const },
];

export default function SolutionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);

  const { data: entity, error, isLoading, mutate } = useSWR(`/solutions/${id}`, fetchAPI);

  const handleDelete = async () => {
    const ok = await confirm({
      title: '删除方案',
      message: '确定要删除这个方案吗？此操作不可撤销。',
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/solutions/${id}`, { method: 'DELETE' });
    toast('方案已删除', 'success');
    router.push('/solutions');
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    if (formData.effectiveness != null) {
      formData.effectiveness = Number(formData.effectiveness);
    }
    await fetchAPI(`/solutions/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
    toast('方案已更新', 'success');
  };

  if (isLoading) return <Loading />;
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
