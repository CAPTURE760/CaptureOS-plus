'use client';

import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import EntityDetail from '@/components/EntityDetail';

export default function ExperienceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const { data: entity, error, isLoading } = useSWR(`/experiences/${id}`, fetchAPI);

  const handleDelete = async () => {
    if (confirm('确定要删除这条经验吗？')) {
      await fetchAPI(`/experiences/${id}`, { method: 'DELETE' });
      router.push('/experiences');
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;
  if (!entity) return <div className="text-center py-8 text-gray-500">未找到</div>;

  return (
    <EntityDetail
      entityType="experience"
      entityId={id}
      entity={entity}
      onBack={() => router.push('/experiences')}
      onEdit={() => router.push('/experiences')}
      onDelete={handleDelete}
    />
  );
}
