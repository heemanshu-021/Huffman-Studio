/**
 * Utility functions for formatting metrics and dates.
 */

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(absBytes) / Math.log(k)), sizes.length - 1);
  const formatted = `${parseFloat((absBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  return isNegative ? `-${formatted}` : formatted;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}
