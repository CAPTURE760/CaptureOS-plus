'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';
import EntityForm from '@/components/EntityForm';

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'content', label: '内容', type: 'textarea' as const, rows: 8 },
  { name: 'category', label: '分类' },
  { name: 'source', label: '来源' },
  { name: 'status', label: '状态', type: 'select' as const, options: [
    { value: 'unverified', label: '📋 待确认' },
    { value: 'verified', label: '✅ 已验证' },
    { value: 'outdated', label: '⚠️ 已过时' },
  ]},
  { name: 'confidence', label: '置信度 (0-10)', type: 'select' as const,
    options: Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: `${i} (${i * 10}%)` })),
  },
];

export default function KnowledgeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);

  const { data: entity, error, isLoading, mutate } = useSWR(`/knowledge/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这条知识吗？')) {
      await fetchAPI(`/knowledge/${id}`, { method: 'DELETE' });
      router.push('/knowledge');
    }
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    await fetchAPI(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <>
      <EntityDetail
        entityType="knowledge"
        entityId={id}
        entity={entity}
        onBack={() => router.push('/knowledge')}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑知识"
        />
      )}
    </>
  );
}
