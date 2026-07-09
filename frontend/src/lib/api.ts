import useSWR from 'swr';

// 动态获取 API 地址：优先用环境变量，否则根据当前访问地址自动推断
function getApiBase(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL || '/api';
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl;
  // 用当前页面的 hostname，端口固定为 8001
  return `http://${window.location.hostname}:8001/api`;
}

const API_BASE = getApiBase();

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  // 如果path以/api开头，则不要重复添加API_BASE
  const url = path.startsWith('/api')
    ? path
    : `${API_BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      // 对于文件上传，让浏览器自动设置 Content-Type (multipart/form-data)
      ...(options && options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

export function useAPI<T>(path: string) {
  const fetcher = (url: string) => fetchAPI(url);
  return useSWR<T>(path, fetcher);
}
