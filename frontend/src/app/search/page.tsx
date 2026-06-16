'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

interface SearchResult {
  entity_type: string;
  entity_id: number;
  title: string;
  snippet: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

const entityLabels: Record<string, string> = {
  project: '项目',
  experience: '经验',
  issue: '问题',
  solution: '解决方案',
  knowledge: '知识',
  decision: '决策',
  review: '复盘',
};

const entityColors: Record<string, string> = {
  project: 'bg-blue-100 text-blue-800',
  experience: 'bg-yellow-100 text-yellow-800',
  issue: 'bg-red-100 text-red-800',
  solution: 'bg-green-100 text-green-800',
  knowledge: 'bg-purple-100 text-purple-800',
  decision: 'bg-indigo-100 text-indigo-800',
  review: 'bg-pink-100 text-pink-800',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, error, isLoading } = useSWR<SearchResponse>(
    searchQuery ? `/search/?q=${encodeURIComponent(searchQuery)}` : null,
    fetchAPI
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">搜索</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索所有实体..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            搜索
          </button>
        </div>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-8">搜索中...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">搜索失败</div>
      ) : data ? (
        <div>
          <p className="text-gray-500 mb-4">
            找到 {data.total} 个结果
          </p>
          {data.results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">没有找到相关结果</div>
          ) : (
            <div className="space-y-4">
              {data.results.map((result) => (
                <div
                  key={`${result.entity_type}-${result.entity_id}`}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${entityColors[result.entity_type]}`}
                    >
                      {entityLabels[result.entity_type]}
                    </span>
                  </div>
                  <h3 className="font-medium text-lg mb-1">{result.title}</h3>
                  {result.snippet && (
                    <p className="text-gray-600 text-sm">{result.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
