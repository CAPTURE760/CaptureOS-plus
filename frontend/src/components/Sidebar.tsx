'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BeijingTime from './BeijingTime';

const menuItems = [
  { href: '/', label: '仪表盘', icon: '📊' },
  { href: '/projects', label: '项目', icon: '📁' },
  { href: '/experiences', label: '经验', icon: '💡' },
  { href: '/issues', label: '问题', icon: '⚠️' },
  { href: '/solutions', label: '解决方案', icon: '🔧' },
  { href: '/knowledge', label: '知识', icon: '📚' },
  { href: '/decisions', label: '决策', icon: '🎯' },
  { href: '/reviews', label: '复盘', icon: '📝' },
  { href: '/tags', label: '标签', icon: '🏷️' },
  { href: '/timeline', label: '时间线', icon: '📅' },
  { href: '/search', label: '搜索', icon: '🔍' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">CaptureOS</h1>
        <p className="text-sm text-gray-400">个人资产管理系统</p>
      </div>

      <BeijingTime />

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
              item.href === '/'
                ? pathname === '/'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
                : pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
