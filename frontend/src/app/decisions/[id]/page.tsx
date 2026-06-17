'use client';

import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';

export default function DecisionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const { data: entity, error, isLoading } = useSWR(`/decisions/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这个决策吗？')) {
      await fetchAPI(`/decisions/${id}`, { method: 'DELETE' });
      router.push('/decisions');
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <EntityDetail
      entityType="decision"
      entityId={id}
      entity={entity}
      onBack={() => router.push('/decisions')}
      onEdit={() => router.push('/decisions')}
      onDelete={handleDelete}
    />
  );
}
