/**
 * 格式化时间为北京时间显示
 */
export function formatBeijingTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    // 转换为北京时间
    const beijingTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));

    const year = beijingTime.getFullYear();
    const month = (beijingTime.getMonth() + 1).toString().padStart(2, '0');
    const day = beijingTime.getDate().toString().padStart(2, '0');
    const hours = beijingTime.getHours().toString().padStart(2, '0');
    const minutes = beijingTime.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
}

/**
 * 格式化时间为北京时间（包含秒）
 */
export function formatBeijingTimeFull(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const beijingTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));

    const year = beijingTime.getFullYear();
    const month = (beijingTime.getMonth() + 1).toString().padStart(2, '0');
    const day = beijingTime.getDate().toString().padStart(2, '0');
    const hours = beijingTime.getHours().toString().padStart(2, '0');
    const minutes = beijingTime.getMinutes().toString().padStart(2, '0');
    const seconds = beijingTime.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return '-';
  }
}

/**
 * 格式化日期（不含时间）
 */
export function formatBeijingDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const beijingTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));

    const year = beijingTime.getFullYear();
    const month = (beijingTime.getMonth() + 1).toString().padStart(2, '0');
    const day = beijingTime.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return '-';
  }
}
