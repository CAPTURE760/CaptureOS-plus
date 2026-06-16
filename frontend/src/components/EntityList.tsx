'use client';

import { formatBeijingTime } from '@/lib/time';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface EntityListProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
}

export default function EntityList<T extends { id: number }>({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
}: EntityListProps<T>) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete || onView) && (
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-24">
                操作
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                  {col.render ? (
                    col.render(item)
                  ) : (
                    <span className="line-clamp-2" title={String((item as Record<string, unknown>)[col.key] ?? '')}>
                      {String((item as Record<string, unknown>)[col.key] ?? '-')}
                    </span>
                  )}
                </td>
              ))}
              {(onEdit || onDelete || onView) && (
                <td className="px-4 py-3 text-sm space-x-2 whitespace-nowrap">
                  {onView && (
                    <button
                      onClick={() => onView(item)}
                      className="text-green-600 hover:text-green-800"
                    >
                      查看
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="text-red-600 hover:text-red-800"
                    >
                      删除
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                className="px-4 py-12 text-center text-gray-500"
              >
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">📭</span>
                  <span>暂无数据</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
