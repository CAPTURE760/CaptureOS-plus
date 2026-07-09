'use client';

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';
import EntityForm from '@/components/EntityForm';
import Loading from '@/components/Loading';
import { useConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

interface PendingFile {
  file: File;
  name: string;
  size: number;
  type?: string;
}

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
  { name: 'attachments', label: '附件', type: 'attachments' as const },
];

export default function DecisionDetailPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);
  const filesMutateRef = useRef<(() => void) | null>(null);

  const { data: entity, error, isLoading, mutate } = useSWR(`/decisions/${id}`, fetchAPI);

  const handleDelete = async () => {
    const ok = await confirm({
      title: '删除决策',
      message: '确定要删除这个决策吗？此操作不可撤销。',
      confirmText: '确定删除',
      variant: 'danger',
    });
    if (!ok) return;
    await fetchAPI(`/decisions/${id}`, { method: 'DELETE' });
    toast('决策已删除', 'success');
    router.push('/decisions');
  };

  const handleEdit = async (formData: Record<string, unknown>, pendingFiles?: PendingFile[]) => {
    await fetchAPI(`/decisions/${id}`, { method: 'PUT', body: JSON.stringify(formData) });

    // 上传待处理的附件
    if (pendingFiles && pendingFiles.length > 0) {
      for (const pf of pendingFiles) {
        const formDataObj = new FormData();
        formDataObj.append('file', pf.file);
        formDataObj.append('entity_type', 'decision');
        formDataObj.append('entity_id', id.toString());

        await fetchAPI('/upload/to-entity', {
          method: 'POST',
          headers: {},
          body: formDataObj,
        });
      }
    }

    setShowEdit(false);
    mutate();
    toast('决策已更新', 'success');
  };

  if (isLoading) return <Loading />;
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
        onFilesUpdated={(filesMutate) => {
          filesMutateRef.current = filesMutate;
        }}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑决策"
          entityInfo={{ type: 'decision', id: id }}
          onUploadComplete={() => {
            // 刷新实体数据
            mutate();
            // 刷新附件列表
            if (filesMutateRef.current) {
              filesMutateRef.current();
            }
          }}
        />
      )}
    </>
  );
}
