/**
 * 处理文件下载
 * @param url 文件URL
 * @param originalName 原始文件名（用于显示）
 * @param safeName 安全的文件名（实际存储的文件名）
 */
export async function downloadFile(
  url: string,
  originalName?: string,
  safeName?: string
): Promise<void> {
  try {
    // 构建完整的后端文件 URL
    let fileUrl: string;
    if (url.startsWith('http')) {
      // 已经是完整 URL
      fileUrl = url;
    } else {
      // 相对路径，需要拼接后端地址
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      fileUrl = `http://${hostname}:8001${url}`;
    }

    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    // 获取文件名
    let filename = originalName || 'file';

    // 确保文件名没有特殊字符
    filename = filename.replace(/[\\/:*?"<>|]/g, '_');

    // 获取blob
    const blob = await response.blob();

    // 创建下载链接
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放URL
    URL.revokeObjectURL(blobUrl);

  } catch (error) {
    console.error('下载失败:', error);
    throw error;
  }
}

/**
 * 处理API响应中的文件下载
 * @param data upload API返回的数据
 */
export async function handleUploadFileDownload(data: {
  name?: string;
  url?: string;
  safe_name?: string;
  size?: number;
  type?: string;
}): Promise<void> {
  if (!data.url) {
    throw new Error('文件URL不存在');
  }

  return downloadFile(data.url, data.name, data.safe_name);
}