'use client';

import { statusChipColor, priorityChipColor } from '@/lib/constants';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  statusFilters?: FilterOption[];
  priorityFilters?: FilterOption[];
  activeStatus?: string | null;
  activePriority?: string | null;
  onStatusChange?: (status: string | null) => void;
  onPriorityChange?: (priority: string | null) => void;
  filteredCount?: number;
  totalCount?: number;
}

const defaultChipColor = { active: 'bg-blue-600 text-white border-blue-600', idle: 'border-gray-300 text-gray-600 hover:bg-gray-50' };

function Chip({ label, active, colorSet, onClick }: {
  label: string;
  active: boolean;
  colorSet: { active: string; idle: string };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
        active ? colorSet.active : colorSet.idle
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterBar({
  statusFilters,
  priorityFilters,
  activeStatus,
  activePriority,
  onStatusChange,
  onPriorityChange,
  filteredCount,
  totalCount,
}: FilterBarProps) {
  const hasStatus = statusFilters && statusFilters.length > 0;
  const hasPriority = priorityFilters && priorityFilters.length > 0;
  const isFiltering = activeStatus !== null || activePriority !== null;

  if (!hasStatus && !hasPriority) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
      {hasStatus && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium shrink-0">状态：</span>
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                active={activeStatus === f.value}
                colorSet={statusChipColor[f.value] || defaultChipColor}
                onClick={() => onStatusChange?.(activeStatus === f.value ? null : f.value)}
              />
            ))}
          </div>
        </div>
      )}

      {hasStatus && hasPriority && <div className="w-px h-5 bg-gray-200" />}

      {hasPriority && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium shrink-0">优先级：</span>
          <div className="flex flex-wrap gap-1.5">
            {priorityFilters.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                active={activePriority === f.value}
                colorSet={priorityChipColor[f.value] || defaultChipColor}
                onClick={() => onPriorityChange?.(activePriority === f.value ? null : f.value)}
              />
            ))}
          </div>
        </div>
      )}

      {isFiltering && filteredCount != null && totalCount != null && (
        <>
          <div className="w-px h-5 bg-gray-200" />
          <span className="text-xs text-blue-600 font-medium shrink-0">
            筛选结果：{filteredCount} / {totalCount} 条
          </span>
        </>
      )}
    </div>
  );
}
