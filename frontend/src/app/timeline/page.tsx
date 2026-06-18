'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

interface TimelineEvent {
  entity_type: string;
  entity_id: number;
  title: string;
  date: string;
  datetime?: string;
  status?: string;
  rating?: number;
  effectiveness?: number;
}

interface ChainEvent {
  type: 'single' | 'chain';
  title: string;
  date: string;
  datetime?: string;
  entity?: TimelineEvent;
  entities?: TimelineEvent[];
  entity_count?: number;
}

const entityLabels: Record<string, string> = {
  project: '项目', experience: '经验', issue: '问题',
  solution: '解决方案', knowledge: '知识', decision: '决策', review: '复盘',
};

const entityColors: Record<string, string> = {
  project: 'bg-blue-500', experience: 'bg-yellow-500',
  issue: 'bg-red-500', solution: 'bg-green-500',
  knowledge: 'bg-purple-500', decision: 'bg-indigo-500', review: 'bg-pink-500',
};

const entityRoutes: Record<string, string> = {
  project: '/projects', experience: '/experiences', issue: '/issues',
  solution: '/solutions', knowledge: '/knowledge', decision: '/decisions', review: '/reviews',
};

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function TimelinePage() {
  const router = useRouter();
  const today = fmt(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [entityType, setEntityType] = useState('');
  const [viewMode, setViewMode] = useState<'flat' | 'chains'>('chains');

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('start_date', startDate);
  if (endDate) queryParams.set('end_date', endDate);

  const queryString = queryParams.toString();
  const baseUrl = viewMode === 'chains' ? '/timeline/chains' : '/timeline/';
  const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading } = useSWR<ChainEvent[] | TimelineEvent[]>(url, fetchAPI);

  // 如果是 flat 模式且有 entity_type 过滤，在前端过滤
  const filteredData = viewMode === 'flat' && entityType
    ? (data as TimelineEvent[])?.filter((e) => e.entity_type === entityType)
    : data;

  // 快捷按钮 active 判断
  const now = new Date();
  const weekday = now.getDay() || 7;
  const monday = new Date(now); monday.setDate(now.getDate() - weekday + 1);
  const thisWeekStart = fmt(monday);
  const thisMonthStart = fmt(new Date(now.getFullYear(), now.getMonth(), 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">时间线</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('chains')}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === 'chains' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            🔗 链路视图
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === 'flat' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            📋 列表视图
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-end">
          {/* 快捷按钮 */}
          <div className="flex gap-1.5">
            <QuickBtn label="今天" onClick={() => { setStartDate(today); setEndDate(today); }}
              active={startDate === today && endDate === today} />
            <QuickBtn label="本周" onClick={() => { setStartDate(thisWeekStart); setEndDate(today); }}
              active={startDate === thisWeekStart && endDate === today} />
            <QuickBtn label="本月" onClick={() => { setStartDate(thisMonthStart); setEndDate(today); }}
              active={startDate === thisMonthStart && endDate === today} />
            <QuickBtn label="全部" onClick={() => { setStartDate(''); setEndDate(''); }}
              active={!startDate && !endDate} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">开始</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">结束</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          {viewMode === 'flat' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">类型</label>
              <select value={entityType} onChange={(e) => setEntityType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">全部</option>
                <option value="project">项目</option>
                <option value="experience">经验</option>
                <option value="issue">问题</option>
                <option value="solution">解决方案</option>
                <option value="knowledge">知识</option>
                <option value="decision">决策</option>
                <option value="review">复盘</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">加载失败</div>
      ) : !filteredData?.length ? (
        <div className="text-center py-8 text-gray-500">暂无数据</div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />
          <div className="space-y-4">
            {viewMode === 'chains'
              ? (filteredData as ChainEvent[]).map((item, idx) => (
                  <ChainItem key={idx} item={item} router={router} />
                ))
              : (filteredData as TimelineEvent[]).map((event, idx) => (
                  <FlatItem key={`${event.entity_type}-${event.entity_id}-${idx}`} event={event} router={router} />
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

function FlatItem({ event, router }: { event: TimelineEvent; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-4 h-4 rounded-full ${entityColors[event.entity_type]} mt-1.5 z-10`} />
      <div
        onClick={() => router.push(`${entityRoutes[event.entity_type]}/${event.entity_id}`)}
        className="bg-white p-4 rounded-lg shadow flex-1 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-xs text-white ${entityColors[event.entity_type]}`}>
            {entityLabels[event.entity_type]}
          </span>
          {event.status && <span className="text-xs text-gray-500">{event.status}</span>}
          {event.rating && <span className="text-xs">{'⭐'.repeat(event.rating)}</span>}
        </div>
        <h3 className="font-medium">{event.title}</h3>
        <p className="text-sm text-gray-500">
          {event.datetime
            ? new Date(event.datetime).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            : event.date
              ? new Date(event.date).toLocaleDateString('zh-CN')
              : '-'}
        </p>
      </div>
    </div>
  );
}

function ChainItem({ item, router }: { item: ChainEvent; router: ReturnType<typeof useRouter> }) {
  const [expanded, setExpanded] = useState(false);

  if (item.type === 'single' && item.entity) {
    return <FlatItem event={item.entity} router={router} />;
  }

  // 链路
  const primaryType = item.entities?.[0]?.entity_type || 'issue';
  return (
    <div className="flex items-start gap-4">
      <div className={`w-4 h-4 rounded-full ${entityColors[primaryType]} mt-1.5 z-10 ring-2 ring-white`} />
      <div
        onClick={() => setExpanded(!expanded)}
        className="bg-white p-4 rounded-lg shadow flex-1 border-l-4 border-blue-400 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium">
            🔗 链路 ({item.entity_count}步)
          </span>
          <span className="text-xs text-gray-400">{expanded ? '▲ 收起' : '▼ 点击展开'}</span>
        </div>
        <h3 className="font-medium">{item.title}</h3>
        <p className="text-sm text-gray-500">
          {item.datetime
            ? new Date(item.datetime).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            : item.date
              ? new Date(item.date + 'T00:00:00').toLocaleDateString('zh-CN')
              : '-'}
        </p>

        {expanded && item.entities && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {item.entities.map((e, i) => (
              <div key={i}
                onClick={(ev) => { ev.stopPropagation(); router.push(`${entityRoutes[e.entity_type]}/${e.entity_id}`); }}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
              >
                <span className={`w-2 h-2 rounded-full ${entityColors[e.entity_type]}`} />
                <span className={`px-1.5 py-0.5 rounded text-xs text-white ${entityColors[e.entity_type]}`}>
                  {entityLabels[e.entity_type]}
                </span>
                <span className="flex-1">{e.title}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {e.datetime
                    ? new Date(e.datetime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </span>
                {i < item.entities!.length - 1 && <span className="text-gray-400">→</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickBtn({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  );
}
