'use client';

import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const { data: entity, error, isLoading } = useSWR(`/reviews/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这个复盘吗？')) {
      await fetchAPI(`/reviews/${id}`, { method: 'DELETE' });
      router.push('/reviews');
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <EntityDetail
      entityType="review"
      entityId={id}
      entity={entity}
      onBack={() => router.push('/reviews')}
      onEdit={() => router.push('/reviews')}
      onDelete={handleDelete}
    />
  );
}
