'use client';

import { useState } from 'react';

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  required?: boolean;
  rows?: number;
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
  // 新建时，date 类型字段默认填今天日期
  const getDefaultData = () => {
    const data = { ...initialData };
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    fields.forEach((field) => {
      if (field.type === 'date' && !data[field.name]) {
        data[field.name] = today;
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
            <textarea
              name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
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
          ) : field.type === 'number' ? (
            <input type="number" name={field.name}
              value={(formData[field.name] as number) || ''}
              onChange={(e) => handleChange(field.name, Number(e.target.value))}
              required={field.required}
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
