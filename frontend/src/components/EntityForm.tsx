'use client';

import { useState } from 'react';
import { renderMarkdown } from '@/lib/markdown';

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local' | 'number';
  options?: { value: string; label: string }[];
  required?: boolean;
  rows?: number;
  min?: number;
  max?: number;
}

interface EntityFormProps {
  fields: Field[];
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  initialData?: Record<string, unknown>;
  submitLabel?: string;
  cancelLabel?: string;
  title?: string;
}

export default function EntityForm({
  fields,
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = '保存',
  cancelLabel = '取消',
  title,
}: EntityFormProps) {
  // 新建时，date 类型字段默认填今天日期，datetime-local 默认填当前时间
  const getDefaultData = () => {
    const data = { ...initialData };
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const localNow = `${today}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    fields.forEach((field) => {
      if (field.type === 'date' && !data[field.name]) {
        data[field.name] = today;
      }
      if (field.type === 'datetime-local' && !data[field.name]) {
        data[field.name] = localNow;
      }
    });
    return data;
  };
  const [formData, setFormData] = useState<Record<string, unknown>>(getDefaultData);

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // 没有 onCancel 时直接渲染表单（兼容旧用法）
  if (!onCancel) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFields fields={fields} formData={formData} handleChange={handleChange} />
        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <span>✅</span><span>{submitLabel}</span>
          </button>
        </div>
      </form>
    );
  }

  // 有 onCancel 时渲染弹窗
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg md:max-w-2xl mx-4 md:mx-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-semibold">{title || '新建'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <FormFields fields={fields} formData={formData} handleChange={handleChange} />
          </div>

          {/* 按钮固定在底部 */}
          <div className="flex gap-3 pt-6 border-t mt-6">
            <button type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <span>✅</span><span>{submitLabel}</span>
            </button>
            <button type="button" onClick={onCancel}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2">
              <span>❌</span><span>{cancelLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormFields({
  fields, formData, handleChange,
}: {
  fields: Field[];
  formData: Record<string, unknown>;
  handleChange: (name: string, value: unknown) => void;
}) {
  return (
    <>
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <MarkdownField
              name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={handleChange}
              required={field.required}
              rows={field.rows || 4}
              placeholder={`请输入${field.label}...`}
            />
          ) : field.type === 'select' ? (
            <select
              name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'date' ? (
            <input type="date" name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : field.type === 'datetime-local' ? (
            <input type="datetime-local" name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : field.type === 'number' ? (
            <input type="number" name={field.name}
              value={(formData[field.name] as number) || ''}
              onChange={(e) => handleChange(field.name, Number(e.target.value))}
              required={field.required}
              min={field.min}
              max={field.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <input type="text" name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`请输入${field.label}...`}
            />
          )}
        </div>
      ))}
    </>
  );
}

/** Markdown 文本域 — 支持编辑/预览切换 */
function MarkdownField({
  name, value, onChange, required, rows, placeholder,
}: {
  name: string;
  value: string;
  onChange: (name: string, value: unknown) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* 切换按钮栏 */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            !preview ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          编辑
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            preview ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          预览
        </button>
        <span className="ml-auto text-[10px] text-gray-400">支持 Markdown</span>
      </div>

      {/* 编辑/预览内容 */}
      {preview ? (
        <div
          className="px-3 py-2 min-h-[80px] bg-white prose prose-sm max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || '<span class="text-gray-400">暂无内容</span>' }}
        />
      ) : (
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          required={required}
          rows={rows || 4}
          placeholder={placeholder}
          className="w-full px-3 py-2 border-0 focus:ring-0 resize-y min-h-[80px]"
        />
      )}
    </div>
  );
}
