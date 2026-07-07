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
  { name: 'summary', label: '摘要', type: 'textarea' as const, rows: 4 },
  { name: 'context', label: '背景', type: 'textarea' as const, rows: 5 },
  { name: 'result', label: '结果', type: 'textarea' as const, rows: 5 },
  { name: 'lesson', label: '教训', type: 'textarea' as const, rows: 5 },
  { name: 'event_date', label: '事件日期', type: 'date' as const },
  { name: 'attachments', label: '附件', type: 'attachments' as const },
];

export default function ExperienceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const { data: entity, error, isLoading, mutate } = useSWR(`/experiences/${id}`, fetchAPI);

  const handleDelete = async () => {
    const ok = await confirm({
      title: '删除经验',
      message: '确定要删除这条经验吗？此操作不可撤销。',
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/experiences/${id}`, { method: 'DELETE' });
    toast('经验已删除', 'success');
    router.push('/experiences');
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    await fetchAPI(`/experiences/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
    toast('经验已更新', 'success');
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <>
      <EntityDetail
        entityType="experience"
        entityId={id}
        entity={entity}
        onBack={() => router.push('/experiences')}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑经验"
        />
      )}
    </>
  );
}
