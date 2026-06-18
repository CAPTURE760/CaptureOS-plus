'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { formatBeijingTime } from '@/lib/time';

interface PendingItem {
  id: number;
  title: string;
  status?: string;
  priority?: string;
  created_at: string;
}

interface RiskItem {
  type: string;
  message: string;
  items: Array<{ id: number; title: string; updated_at?: string }>;
}

interface Overview {
  issues: Record<string, number>;
  projects: Record<string, number>;
  knowledge: Record<string, number>;
  decisions: Record<string, number>;
}

interface Activity {
  entity_type: string;
  entity_id: number;
  icon: string;
  title: string;
  created_at: string;
}

interface DashboardData {
  pending: {
    issues: PendingItem[];
    decisions: PendingItem[];
    knowledge: PendingItem[];
  };
  risks: RiskItem[];
  overview: Overview;
  recent_activity: Activity[];
}

const ENTITY_ROUTES: Record<string, string> = {
  project: '/projects', experience: '/experiences', issue: '/issues',
  solution: '/solutions', knowledge: '/knowledge', decision: '/decisions', review: '/reviews',
};

const PRIORITY_COLORS: Record<string, string> = {
  '紧急': 'text-red-600 font-bold', '高': 'text-orange-600',
  '中': 'text-yellow-600', '低': 'text-green-600',
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  issues: { open: '待解决', in_progress: '处理中', resolved: '已解决', closed: '已关闭' },
  projects: { active: '进行中', completed: '已完成', paused: '暂停', cancelled: '已取消' },
  knowledge: { unverified: '待确认', verified: '已验证', outdated: '已过时' },
  decisions: { pending: '待执行', in_progress: '执行中', completed: '已完成', deprecated: '已废弃' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const { data, error, isLoading } = useSWR<DashboardData>('/dashboard/', fetchAPI);

  const handleExport = async () => {
    setExporting(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API_BASE}/export/`);
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `captureos-export-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <div className="text-center py-8">加载中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">加载失败</div>;

  const pending = data?.pending || { issues: [], decisions: [], knowledge: [] };
  const risks = data?.risks || [];
  const overview = data?.overview || { issues: {}, projects: {}, knowledge: {}, decisions: {} };
  const activity = data?.recent_activity || [];

  const totalPending = pending.issues.length + pending.decisions.length + pending.knowledge.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CaptureOS</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? '导出中...' : '📥 导出数据'}
          </button>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>
      </div>

      {/* 待处理 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          📋 待处理
          {totalPending > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{totalPending}</span>
          )}
        </h2>

        {totalPending === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
            ✅ 没有待处理事项，干得漂亮！
          </div>
        ) : (
          <div className="space-y-3">
            {/* 待解决问题 */}
            {pending.issues.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">
                    ⚠️ {pending.issues.length} 个问题待解决
                  </h3>
                  <button onClick={() => router.push('/issues')}
                    className="text-xs text-blue-600 hover:text-blue-800">查看全部</button>
                </div>
                <div className="space-y-1">
                  {pending.issues.slice(0, 5).map((item) => (
                    <div key={item.id}
                      onClick={() => router.push(`/issues/${item.id}`)}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm">
                      <span className="truncate">{item.title}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.priority && (
                          <span className={`text-xs ${PRIORITY_COLORS[item.priority] || ''}`}>{item.priority}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatBeijingTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 待执行决策 */}
            {pending.decisions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">
                    🎯 {pending.decisions.length} 个决策待执行
                  </h3>
                  <button onClick={() => router.push('/decisions')}
                    className="text-xs text-blue-600 hover:text-blue-800">查看全部</button>
                </div>
                <div className="space-y-1">
                  {pending.decisions.slice(0, 5).map((item) => (
                    <div key={item.id}
                      onClick={() => router.push(`/decisions/${item.id}`)}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm">
                      <span className="truncate">{item.title}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {formatBeijingTime(item.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 待确认知识 */}
            {pending.knowledge.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">
                    📚 {pending.knowledge.length} 条知识待确认
                  </h3>
                  <button onClick={() => router.push('/knowledge')}
                    className="text-xs text-blue-600 hover:text-blue-800">查看全部</button>
                </div>
                <div className="space-y-1">
                  {pending.knowledge.slice(0, 5).map((item) => (
                    <div key={item.id}
                      onClick={() => router.push(`/knowledge/${item.id}`)}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm">
                      <span className="truncate">{item.title}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {formatBeijingTime(item.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 风险提醒 */}
      {risks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">⚠️ 风险提醒</h2>
          <div className="space-y-2">
            {risks.map((risk, idx) => (
              <div key={idx} className={`rounded-lg p-4 ${
                risk.type === 'warning' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`text-sm font-medium ${
                  risk.type === 'warning' ? 'text-red-700' : 'text-yellow-700'
                }`}>{risk.message}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {risk.items.map((item) => item.title).join('、')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 概览 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">📊 概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OverviewCard title="问题" icon="⚠️" data={overview.issues}
            labels={STATUS_LABELS.issues} route="/issues" router={router} />
          <OverviewCard title="项目" icon="📁" data={overview.projects}
            labels={STATUS_LABELS.projects} route="/projects" router={router} />
          <OverviewCard title="知识" icon="📚" data={overview.knowledge}
            labels={STATUS_LABELS.knowledge} route="/knowledge" router={router} />
          <OverviewCard title="决策" icon="🎯" data={overview.decisions}
            labels={STATUS_LABELS.decisions} route="/decisions" router={router} />
        </div>
      </section>

      {/* 最近动态 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">🕐 最近动态</h2>
        <div className="bg-white rounded-lg shadow divide-y">
          {activity.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">暂无动态</div>
          ) : activity.map((item, idx) => (
            <div key={idx}
              onClick={() => router.push(`${ENTITY_ROUTES[item.entity_type]}/${item.entity_id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 truncate text-sm">{item.title}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {formatBeijingTime(item.created_at)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewCard({
  title, icon, data, labels, route, router,
}: {
  title: string; icon: string; data: Record<string, number>;
  labels: Record<string, string>; route: string; router: ReturnType<typeof useRouter>;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(route)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-sm">{title}</span>
        <span className="text-xs text-gray-400 ml-auto">{total}</span>
      </div>
      <div className="space-y-1">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{labels[status] || status}</span>
            <span className="font-mono">{count}</span>
          </div>
        ))}
        {Object.keys(data).length === 0 && (
          <div className="text-xs text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  );
}
