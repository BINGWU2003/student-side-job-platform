/**
 * 格式化日期为中文格式
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN');
}
