/**
 * 全局共享的颜色和选项常量
 * FilterBar、列表页 columns、表单 fields 共用，避免重复定义
 */

// ─── 状态 ────────────────────────────────────────────

export interface StatusOption {
  value: string;
  label: string;
}

// 列表/筛选栏用的 Tailwind class
export const statusBgClass: Record<string, string> = {
  // Issues
  open:         'bg-red-100 text-red-800',
  in_progress:  'bg-yellow-100 text-yellow-800',
  resolved:     'bg-green-100 text-green-800',
  closed:       'bg-gray-100 text-gray-800',
  // Projects
  active:       'bg-green-100 text-green-800',
  completed:    'bg-blue-100 text-blue-800',
  paused:       'bg-yellow-100 text-yellow-800',
  cancelled:    'bg-gray-100 text-gray-800',
  // Decisions
  pending:      'bg-gray-100 text-gray-800',
  deprecated:   'bg-red-100 text-red-800',
  // Knowledge
  unverified:   'bg-gray-100 text-gray-800',
  verified:     'bg-green-100 text-green-800',
  outdated:     'bg-yellow-100 text-yellow-800',
};

// 筛选栏 chip 用的 active/idle 颜色
export const statusChipColor: Record<string, { active: string; idle: string }> = {
  open:         { active: 'bg-red-600 text-white border-red-600',    idle: 'border-red-300 text-red-700 hover:bg-red-50' },
  in_progress:  { active: 'bg-yellow-500 text-white border-yellow-500', idle: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' },
  resolved:     { active: 'bg-green-600 text-white border-green-600', idle: 'border-green-300 text-green-700 hover:bg-green-50' },
  closed:       { active: 'bg-gray-500 text-white border-gray-500',  idle: 'border-gray-300 text-gray-600 hover:bg-gray-50' },
  active:       { active: 'bg-green-600 text-white border-green-600', idle: 'border-green-300 text-green-700 hover:bg-green-50' },
  completed:    { active: 'bg-blue-600 text-white border-blue-600',   idle: 'border-blue-300 text-blue-700 hover:bg-blue-50' },
  paused:       { active: 'bg-yellow-500 text-white border-yellow-500', idle: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' },
  cancelled:    { active: 'bg-gray-500 text-white border-gray-500',   idle: 'border-gray-300 text-gray-600 hover:bg-gray-50' },
  pending:      { active: 'bg-gray-500 text-white border-gray-500',   idle: 'border-gray-300 text-gray-600 hover:bg-gray-50' },
  deprecated:   { active: 'bg-red-600 text-white border-red-600',     idle: 'border-red-300 text-red-700 hover:bg-red-50' },
  unverified:   { active: 'bg-gray-500 text-white border-gray-500',   idle: 'border-gray-300 text-gray-600 hover:bg-gray-50' },
  verified:     { active: 'bg-green-600 text-white border-green-600', idle: 'border-green-300 text-green-700 hover:bg-green-50' },
  outdated:     { active: 'bg-yellow-500 text-white border-yellow-500', idle: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' },
};

// 中文标签 → Tailwind class（列表列用）
export const statusLabelClass: Record<string, string> = {
  '待解决':   'bg-red-100 text-red-800',
  '处理中':   'bg-yellow-100 text-yellow-800',
  '已解决':   'bg-green-100 text-green-800',
  '已关闭':   'bg-gray-100 text-gray-800',
  '进行中':   'bg-green-100 text-green-800',
  '已完成':   'bg-blue-100 text-blue-800',
  '暂停':     'bg-yellow-100 text-yellow-800',
  '已取消':   'bg-gray-100 text-gray-800',
  '待执行':   'bg-gray-100 text-gray-800',
  '执行中':   'bg-blue-100 text-blue-800',
  '已废弃':   'bg-red-100 text-red-800',
  '待确认':   'bg-gray-100 text-gray-800',
  '已验证':   'bg-green-100 text-green-800',
  '已过时':   'bg-yellow-100 text-yellow-800',
};

// ─── 优先级 ──────────────────────────────────────────

export const priorityOptions: StatusOption[] = [
  { value: '紧急', label: '🔴 紧急' },
  { value: '高',   label: '🟠 高' },
  { value: '中',   label: '🟡 中' },
  { value: '低',   label: '🟢 低' },
];

export const priorityBgClass: Record<string, string> = {
  '紧急': 'bg-red-100 text-red-800',
  '高':   'bg-orange-100 text-orange-800',
  '中':   'bg-yellow-100 text-yellow-800',
  '低':   'bg-green-100 text-green-800',
};

export const priorityChipColor: Record<string, { active: string; idle: string }> = {
  '紧急': { active: 'bg-red-600 text-white border-red-600', idle: 'border-red-300 text-red-700 hover:bg-red-50' },
  '高':   { active: 'bg-orange-500 text-white border-orange-500', idle: 'border-orange-300 text-orange-700 hover:bg-orange-50' },
  '中':   { active: 'bg-yellow-500 text-white border-yellow-500', idle: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' },
  '低':   { active: 'bg-green-600 text-white border-green-600', idle: 'border-green-300 text-green-700 hover:bg-green-50' },
};

// ─── 各模块的选项列表 ────────────────────────────────

export const issueStatusOptions: StatusOption[] = [
  { value: 'open',        label: '待解决' },
  { value: 'in_progress', label: '处理中' },
  { value: 'resolved',    label: '已解决' },
  { value: 'closed',      label: '已关闭' },
];

export const projectStatusOptions: StatusOption[] = [
  { value: 'active',    label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'paused',    label: '暂停' },
  { value: 'cancelled', label: '已取消' },
];

export const decisionStatusOptions: StatusOption[] = [
  { value: 'pending',     label: '待执行' },
  { value: 'in_progress', label: '执行中' },
  { value: 'completed',   label: '已完成' },
  { value: 'deprecated',  label: '已废弃' },
];

export const knowledgeStatusOptions: StatusOption[] = [
  { value: 'unverified', label: '待确认' },
  { value: 'verified',   label: '已验证' },
  { value: 'outdated',   label: '已过时' },
];
