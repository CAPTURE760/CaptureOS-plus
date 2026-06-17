'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';
import EntityForm from '@/components/EntityForm';

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'description', label: '描述', type: 'textarea' as const, rows: 6 },
  { name: 'status', label: '状态', type: 'select' as const, options: [
    { value: 'active', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'paused', label: '暂停' },
    { value: 'cancelled', label: '已取消' },
  ]},
  { name: 'start_date', label: '开始日期', type: 'date' as const },
  { name: 'end_date', label: '结束日期', type: 'date' as const },
  { name: 'priority', label: '优先级', type: 'select' as const, options: [
    { value: '紧急', label: '🔴 紧急' }, { value: '高', label: '🟠 高' },
    { value: '中', label: '🟡 中' }, { value: '低', label: '🟢 低' },
  ]},
];

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);

  const { data: entity, error, isLoading, mutate } = useSWR(`/projects/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这个项目吗？')) {
      await fetchAPI(`/projects/${id}`, { method: 'DELETE' });
      router.push('/projects');
    }
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    await fetchAPI(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <>
      <EntityDetail
        entityType="project"
        entityId={id}
        entity={entity}
        onBack={() => router.push('/projects')}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑项目"
        />
      )}
    </>
  );
}
