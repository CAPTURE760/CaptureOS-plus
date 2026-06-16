'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

interface TimelineEvent {
  entity_type: string;
  entity_id: number;
  title: string;
  date: string;
  status?: string;
  rating?: number;
}

const entityLabels: Record<string, string> = {
  project: '项目',
  experience: '经验',
  issue: '问题',
  decision: '决策',
  review: '复盘',
};

const entityColors: Record<string, string> = {
  project: 'bg-blue-500',
  experience: 'bg-yellow-500',
  issue: 'bg-red-500',
  decision: 'bg-indigo-500',
  review: 'bg-pink-500',
};

export default function TimelinePage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entityType, setEntityType] = useState('');

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('start_date', startDate);
  if (endDate) queryParams.set('end_date', endDate);
  if (entityType) queryParams.set('entity_type', entityType);

  const queryString = queryParams.toString();
  const url = `/timeline/${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading } = useSWR<TimelineEvent[]>(url, fetchAPI);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">时间线</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">全部</option>
              <option value="project">项目</option>
              <option value="experience">经验</option>
              <option value="issue">问题</option>
              <option value="decision">决策</option>
              <option value="review">复盘</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center py-8">加载中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">加载失败</div>
      ) : !data?.length ? (
        <div className="text-center py-8 text-gray-500">暂无数据</div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />
          <div className="space-y-4">
            {data.map((event, idx) => (
              <div key={`${event.entity_type}-${event.entity_id}-${idx}`} className="flex items-start gap-4">
                <div
                  className={`w-4 h-4 rounded-full ${entityColors[event.entity_type]} mt-1.5 z-10`}
                />
                <div className="bg-white p-4 rounded-lg shadow flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs text-white ${entityColors[event.entity_type]}`}
                    >
                      {entityLabels[event.entity_type]}
                    </span>
                    {event.status && (
                      <span className="text-xs text-gray-500">{event.status}</span>
                    )}
                    {event.rating && (
                      <span className="text-xs">{'⭐'.repeat(event.rating)}</span>
                    )}
                  </div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
