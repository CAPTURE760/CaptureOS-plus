'use client';

import { useState, useEffect } from 'react';
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
  const [open, setOpen] = useState(false);

  // 路由变化时自动收起移动端侧边栏
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 汉堡按钮 — 仅手机端显示 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-900 text-white p-2 rounded-lg shadow-lg"
        aria-label="菜单"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* 遮罩 — 仅手机端侧边栏打开时显示 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out
        md:static md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
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
    </>
  );
}
