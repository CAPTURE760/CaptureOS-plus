const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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
  const { default: useSWR } = require('swr');
  const fetcher = (url: string) => fetchAPI(url);
  return useSWR<T>(path, fetcher);
}
