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
  initialData?: Record<string, unknown>;
  submitLabel?: string;
}

export default function EntityForm({
  fields,
  onSubmit,
  initialData = {},
  submitLabel = '保存',
}: EntityFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'date' ? (
            <input
              type="date"
              name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : field.type === 'number' ? (
            <input
              type="number"
              name={field.name}
              value={(formData[field.name] as number) || ''}
              onChange={(e) => handleChange(field.name, Number(e.target.value))}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <input
              type="text"
              name={field.name}
              value={(formData[field.name] as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`请输入${field.label}...`}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}
