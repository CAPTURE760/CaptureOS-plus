'use client';

import { useState } from 'react';
import { useToast } from './Toast';

const ENTITY_OPTIONS = [
  { key: 'projects', label: '📁 项目', icon: '📁' },
  { key: 'experiences', label: '💡 经验', icon: '💡' },
  { key: 'issues', label: '⚠️ 问题', icon: '⚠️' },
  { key: 'solutions', label: '🔧 解决方案', icon: '🔧' },
  { key: 'knowledge', label: '📚 知识', icon: '📚' },
  { key: 'decisions', label: '🎯 决策', icon: '🎯' },
  { key: 'reviews', label: '🔄 复盘', icon: '🔄' },
];

interface ExportButtonProps {
  /** 导出类型：不传则弹出选择弹窗，传模块名如 'projects' 则直接导出该模块 */
  entityType?: string;
  /** 按钮样式变体：'primary' 蓝色大按钮，'small' 小巧灰色按钮 */
  variant?: 'primary' | 'small';
  className?: string;
}

export default function ExportButton({ entityType, variant = 'small', className = '' }: ExportButtonProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(ENTITY_OPTIONS.map(e => e.key))
  );

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === ENTITY_OPTIONS.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ENTITY_OPTIONS.map(e => e.key)));
    }
  };

  const doExport = async (types?: string[]) => {
    setExporting(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
      let url: string;
      if (entityType) {
        url = `${API_BASE}/export/word/${entityType}`;
      } else if (types && types.length > 0 && types.length < ENTITY_OPTIONS.length) {
        url = `${API_BASE}/export/word/?types=${types.join(',')}`;
      } else {
        url = `${API_BASE}/export/word/`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      a.href = blobUrl;
      a.download = entityType
        ? `captureos-${entityType}-${today}.docx`
        : `captureos-export-${today}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast('导出成功', 'success');
    } catch (e) {
      toast('导出失败，请重试', 'error');
    } finally {
      setExporting(false);
      setShowModal(false);
    }
  };

  const handleExport = () => {
    if (entityType) {
      doExport();
    } else {
      setShowModal(true);
    }
  };

  // 小按钮（模块页用）— 直接导出
  if (variant === 'small') {
    return (
      <button
        onClick={handleExport}
        disabled={exporting}
        className={`px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 ${className}`}
      >
        <span>📄</span>
        <span>{exporting ? '导出中...' : '导出 Word'}</span>
      </button>
    );
  }

  // 主按钮（仪表盘用）— 弹出选择弹窗
  return (
    <>
      <button
        onClick={handleExport}
        disabled={exporting}
        className={`px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {exporting ? '导出中...' : '📄 导出 Word'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">📄 选择导出内容</h3>

            {/* 全选/全不选 */}
            <label className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer mb-2 border-b border-gray-100">
              <input
                type="checkbox"
                checked={selected.size === ENTITY_OPTIONS.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                {selected.size === ENTITY_OPTIONS.length ? '取消全选' : '全选'}
              </span>
            </label>

            {/* 各模块选项 */}
            <div className="space-y-1 mb-5">
              {ENTITY_OPTIONS.map(opt => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(opt.key)}
                    onChange={() => toggle(opt.key)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => doExport(Array.from(selected))}
                disabled={selected.size === 0 || exporting}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? '导出中...' : `导出 (${selected.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
