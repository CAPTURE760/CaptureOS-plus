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
  { name: 'description', label: '描述', type: 'textarea' as const },
  {
    name: 'status', label: '状态', type: 'select' as const,
    options: [
      { value: 'open', label: '待解决' },
      { value: 'in_progress', label: '处理中' },
      { value: 'resolved', label: '已解决' },
      { value: 'closed', label: '已关闭' },
    ],
  },
  {
    name: 'priority', label: '优先级', type: 'select' as const,
    options: [
      { value: '紧急', label: '🔴 紧急' },
      { value: '高', label: '🟠 高' },
      { value: '中', label: '🟡 中' },
      { value: '低', label: '🟢 低' },
    ],
  },
  { name: 'root_cause', label: '根本原因', type: 'textarea' as const },
  { name: 'discovered_date', label: '发现日期', type: 'date' as const },
  { name: 'resolved_date', label: '解决日期', type: 'date' as const },
];

export default function IssueDetailPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);

  const { data: entity, error, isLoading, mutate } = useSWR(`/issues/${id}`, fetchAPI);

  const handleDelete = async () => {
    const ok = await confirm({
      title: '删除问题',
      message: '确定要删除这个问题吗？此操作不可撤销。',
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/issues/${id}`, { method: 'DELETE' });
    toast('问题已删除', 'success');
    router.push('/issues');
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    await fetchAPI(`/issues/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
    toast('问题已更新', 'success');
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <>
      <EntityDetail
        entityType="issue"
        entityId={id}
        entity={entity}
        onBack={() => router.push('/issues')}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑问题"
        />
      )}
    </>
  );
}
