import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from '@/components/Providers';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'CaptureOS - 个人资产管理系统',
  description: '记录和管理你的项目、经验、问题、解决方案、知识、决策和复盘',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">
        <Providers>
          <ToastProvider>
            <ConfirmProvider>
              <div className="flex h-screen">
                <Sidebar />
                <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
              </div>
            </ConfirmProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
