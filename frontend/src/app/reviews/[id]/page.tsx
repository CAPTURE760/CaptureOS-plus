'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';
import EntityForm from '@/components/EntityForm';

const fields = [
  { name: 'title', label: '标题', required: true },
  { name: 'event_summary', label: '事件摘要', type: 'textarea' as const, rows: 5 },
  { name: 'rating', label: '评分 (1-5)', type: 'select' as const, options: [
    { value: '1', label: '1 - 很差' }, { value: '2', label: '2 - 差' },
    { value: '3', label: '3 - 一般' }, { value: '4', label: '4 - 好' },
    { value: '5', label: '5 - 很好' },
  ]},
  { name: 'period', label: '复盘周期', type: 'select' as const, options: [
    { value: '日复盘', label: '📅 日复盘 — 每天回顾' },
    { value: '周复盘', label: '📆 周复盘 — 每周总结' },
    { value: '月复盘', label: '🗓️ 月复盘 — 每月回顾' },
    { value: '季度复盘', label: '📊 季度复盘 — 三个月总结' },
    { value: '年度复盘', label: '📈 年度复盘 — 年终总结' },
    { value: '项目复盘', label: '📁 项目复盘 — 项目结束后' },
    { value: '临时复盘', label: '📝 临时复盘 — 单次事件' },
  ]},
  { name: 'review_date', label: '复盘时间', type: 'datetime-local' as const },
];

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showEdit, setShowEdit] = useState(false);

  const { data: entity, error, isLoading, mutate } = useSWR(`/reviews/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这个复盘吗？')) {
      await fetchAPI(`/reviews/${id}`, { method: 'DELETE' });
      router.push('/reviews');
    }
  };

  const handleEdit = async (formData: Record<string, unknown>) => {
    await fetchAPI(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    setShowEdit(false);
    mutate();
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <>
      <EntityDetail
        entityType="review"
        entityId={id}
        entity={entity}
        onBack={() => router.push('/reviews')}
        onEdit={() => setShowEdit(true)}
        onDelete={handleDelete}
      />
      {showEdit && (
        <EntityForm
          fields={fields}
          onSubmit={handleEdit}
          onCancel={() => setShowEdit(false)}
          initialData={entity}
          title="✏️ 编辑复盘"
        />
      )}
    </>
  );
}
