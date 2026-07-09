'use client';

import { useState, useRef } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { fetchAPI } from '@/lib/api';

interface PendingFile {
  file: File;
  name: string;
  size: number;
  type?: string;
}

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local' | 'number' | 'attachments';
  options?: { value: string; label: string }[];
  required?: boolean;
  rows?: number;
  min?: number;
  max?: number;
}

interface EntityFormProps {
  fields: Field[];
  onSubmit: (data: Record<string, unknown>, pendingFiles?: PendingFile[]) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: Record<string, unknown>;
  submitLabel?: string;
  cancelLabel?: string;
  title?: string;
  entityInfo?: {
    type?: string;
    id?: number;
  };
  onUploadComplete?: () => void;
}

export default function EntityForm({
  fields,
  onSubmit,
  onCancel,
  initialData = {},
  submitLabel = '保存',
  cancelLabel = '取消',
  title,
  entityInfo,
  onUploadComplete,
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
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPendingFiles = (files: PendingFile[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 上传待处理的附件到已创建的实体
  const uploadPendingFiles = async (entityType: string, entityId: number) => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    try {
      for (const pf of pendingFiles) {
        const formDataObj = new FormData();
        formDataObj.append('file', pf.file);
        formDataObj.append('entity_type', entityType);
        formDataObj.append('entity_id', entityId.toString());

        await fetchAPI('/upload/to-entity', {
          method: 'POST',
          headers: {},  // 让浏览器自动设置 Content-Type (multipart/form-data)
          body: formDataObj,
        });
      }
      setPendingFiles([]);
    } catch (err) {
      console.error('附件上传失败:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, pendingFiles);
  };

  // 没有 onCancel 时直接渲染表单（兼容旧用法）
  if (!onCancel) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormFields
          fields={fields}
          formData={formData}
          handleChange={handleChange}
          entityInfo={entityInfo}
          pendingFiles={pendingFiles}
          onAddPendingFiles={handleAddPendingFiles}
          onRemovePendingFile={handleRemovePendingFile}
          uploading={uploading}
          onUploadComplete={onUploadComplete}
        />
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
            <FormFields
              fields={fields}
              formData={formData}
              handleChange={handleChange}
              entityInfo={entityInfo}
              pendingFiles={pendingFiles}
              onAddPendingFiles={handleAddPendingFiles}
              onRemovePendingFile={handleRemovePendingFile}
              uploading={uploading}
              onUploadComplete={onUploadComplete}
            />
          </div>

          {/* 按钮固定在底部 */}
          <div className="flex gap-3 pt-6 border-t mt-6">
            <button type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
              <span>✅</span><span>{uploading ? '上传中...' : submitLabel}</span>
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

interface FormFieldsProps {
  fields: Field[];
  formData: Record<string, unknown>;
  handleChange: (name: string, value: unknown) => void;
  entityInfo?: {
    type?: string;
    id?: number;
  };
  pendingFiles?: PendingFile[];
  onAddPendingFiles?: (files: PendingFile[]) => void;
  onRemovePendingFile?: (index: number) => void;
  uploading?: boolean;
  onUploadComplete?: () => void;
}

function FormFields({
  fields, formData, handleChange, entityInfo,
  pendingFiles, onAddPendingFiles, onRemovePendingFile, uploading, onUploadComplete,
}: FormFieldsProps) {
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
          ) : field.type === 'attachments' ? (
            <AttachmentsField
              name={field.name}
              pendingFiles={pendingFiles || []}
              onAddPendingFiles={onAddPendingFiles || (() => {})}
              onRemovePendingFile={onRemovePendingFile || (() => {})}
              entityType={entityInfo?.type || 'project'}
              entityId={entityInfo?.id}
              uploading={uploading}
              onUploadComplete={onUploadComplete}
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

/** 附件上传字段 — 集成在表单中，支持即时上传或延迟上传 */
interface AttachmentsFieldProps {
  name: string;
  pendingFiles: PendingFile[];
  onAddPendingFiles: (files: PendingFile[]) => void;
  onRemovePendingFile: (index: number) => void;
  entityType: string;
  entityId?: number;
  uploading?: boolean;
  onUploadComplete?: () => void;
}

function AttachmentsField({
  name, pendingFiles, onAddPendingFiles, onRemovePendingFile,
  entityType, entityId, uploading, onUploadComplete,
}: AttachmentsFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [instantUploading, setInstantUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 立即上传文件
    if (entityId) {
      setInstantUploading(true);
      try {
        for (const file of Array.from(files)) {
          const formDataObj = new FormData();
          formDataObj.append('file', file);
          formDataObj.append('entity_type', entityType);
          formDataObj.append('entity_id', entityId.toString());

          await fetchAPI('/upload/to-entity', {
            method: 'POST',
            headers: {},
            body: formDataObj,
          });
        }
        // 上传完成后通知父组件刷新
        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (err) {
        console.error('上传失败:', err);
      } finally {
        setInstantUploading(false);
      }
    } else {
      // 没有 entityId，暂存文件（新增时使用）
      const newFiles: PendingFile[] = Array.from(files).map((file) => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      onAddPendingFiles(newFiles);
    }

    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleRemoveFile = async (index: number) => {
    const file = pendingFiles[index];
    if (!file) return;

    // 如果是已上传的文件（有 id），调用删除 API
    if ('id' in file && (file as any).id) {
      try {
        await fetchAPI(`/file-attachments/${(file as any).id}`, { method: 'DELETE' });
        // 删除成功后通知父组件刷新
        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (err) {
        console.error('删除文件失败:', err);
      }
    }

    // 从列表中移除
    onRemovePendingFile(index);
  };

  const getFileIcon = (type?: string, name?: string) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf') || name?.endsWith('.pdf')) return '📕';
    if (type?.includes('word') || type?.includes('document') || name?.endsWith('.docx') || name?.endsWith('.doc')) return '📘';
    if (type?.includes('excel') || type?.includes('spreadsheet') || name?.endsWith('.xlsx') || name?.endsWith('.xls')) return '📗';
    if (type?.includes('powerpoint') || type?.includes('presentation') || name?.endsWith('.pptx') || name?.endsWith('.ppt')) return '📙';
    if (type?.includes('zip') || type?.includes('rar') || type?.includes('gzip')) return '📦';
    return '📄';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 待上传的文件列表 */}
      {pendingFiles.length > 0 && (
        <div className="px-3 py-2 space-y-1">
          {pendingFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1.5">
              <span className="text-base">{getFileIcon(file.type, file.name)}</span>
              <span className="flex-1 truncate text-gray-800">
                {file.name}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => onRemovePendingFile(index)}
                className="text-gray-400 hover:text-red-500 text-xs px-1"
                title="移除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      <div className="border-t border-gray-100 px-3 py-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id={`file-${name}`}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || instantUploading}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          {uploading || instantUploading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>上传中...</span>
            </>
          ) : (
            <>
              <span>📎</span>
              <span>添加附件</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
