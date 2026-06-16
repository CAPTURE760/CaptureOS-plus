'use client';

import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

interface DashboardData {
  counts: Record<string, number>;
  recent: Record<string, Array<{ id: number; title: string; created_at: string }>>;
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<DashboardData>('/dashboard/', fetchAPI);

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  const counts = data?.counts || {};
  const recent = data?.recent || {};

  const statCards = [
    { label: '项目', value: counts.projects || 0, icon: '📁', color: 'bg-blue-500' },
    { label: '经验', value: counts.experiences || 0, icon: '💡', color: 'bg-yellow-500' },
    { label: '问题', value: counts.issues || 0, icon: '⚠️', color: 'bg-red-500' },
    { label: '解决方案', value: counts.solutions || 0, icon: '🔧', color: 'bg-green-500' },
    { label: '知识', value: counts.knowledge || 0, icon: '📚', color: 'bg-purple-500' },
    { label: '决策', value: counts.decisions || 0, icon: '🎯', color: 'bg-indigo-500' },
    { label: '复盘', value: counts.reviews || 0, icon: '📝', color: 'bg-pink-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} text-white p-4 rounded-lg shadow`}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">进行中的项目</div>
          <div className="text-2xl font-bold text-blue-600">{counts.active_projects || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">待解决的问题</div>
          <div className="text-2xl font-bold text-red-600">{counts.open_issues || 0}</div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(recent).map(([type, items]) => (
          <div key={type} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3 capitalize">
              {type === 'projects' && '最近项目'}
              {type === 'experiences' && '最近经验'}
              {type === 'issues' && '最近问题'}
              {type === 'decisions' && '最近决策'}
              {type === 'reviews' && '最近复盘'}
            </h3>
            {items.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无数据</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="text-sm border-b pb-2 last:border-b-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
