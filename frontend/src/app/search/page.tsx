'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

interface Tag {
  id: number;
  name: string;
  color: string | null;
  level: number;
}

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
  project: '项目', experience: '经验', issue: '问题',
  solution: '解决方案', knowledge: '知识', decision: '决策', review: '复盘',
};

const entityColors: Record<string, string> = {
  project: 'bg-blue-100 text-blue-800', experience: 'bg-yellow-100 text-yellow-800',
  issue: 'bg-red-100 text-red-800', solution: 'bg-green-100 text-green-800',
  knowledge: 'bg-purple-100 text-purple-800', decision: 'bg-indigo-100 text-indigo-800',
  review: 'bg-pink-100 text-pink-800',
};

const entityRoutes: Record<string, string> = {
  project: '/projects', experience: '/experiences', issue: '/issues',
  solution: '/solutions', knowledge: '/knowledge', decision: '/decisions', review: '/reviews',
};

// 关键词高亮组件
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // 获取所有标签
  const { data: tags } = useSWR<Tag[]>('/tags/', fetchAPI);

  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (entityFilter) params.set('entity_type', entityFilter);
  if (tagFilter) params.set('tag_id', tagFilter);

  // 有筛选条件或已提交搜索时触发请求
  const shouldFetch = submitted || entityFilter || tagFilter;
  const { data, error, isLoading } = useSWR<SearchResponse>(
    shouldFetch ? `/search/?${params.toString()}` : null,
    fetchAPI
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  // 按类型分组结果
  const grouped = data?.results.reduce((acc, r) => {
    acc[r.entity_type] = acc[r.entity_type] || [];
    acc[r.entity_type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>) || {};

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">搜索</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词，或直接选择类型/标签筛选"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部类型</option>
            {Object.entries(entityLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部标签</option>
            {tags?.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          <button type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
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
          <p className="text-gray-500 mb-4">找到 {data.total} 个结果</p>
          {data.results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">没有找到相关结果</div>
          ) : entityFilter ? (
            // 已筛选类型：平铺展示
            <div className="space-y-2">
              {data.results.map((result) => (
                <SearchResultItem key={`${result.entity_type}-${result.entity_id}`} result={result} query={data.query} />
              ))}
            </div>
          ) : (
            // 全局搜索：按类型分组展示
            <div className="space-y-6">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${entityColors[type]}`}>
                      {entityLabels[type]}
                    </span>
                    <span>({items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((result) => (
                      <SearchResultItem key={`${result.entity_type}-${result.entity_id}`} result={result} query={data.query} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchResultItem({ result, query }: { result: SearchResult; query: string }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`${entityRoutes[result.entity_type]}/${result.entity_id}`)}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-2 py-0.5 rounded text-xs ${entityColors[result.entity_type]}`}>
          {entityLabels[result.entity_type]}
        </span>
      </div>
      <h3 className="font-medium mb-1"><HighlightText text={result.title} query={query} /></h3>
      {result.snippet && (
        <p className="text-gray-600 text-sm"><HighlightText text={result.snippet} query={query} /></p>
      )}
    </div>
  );
}
