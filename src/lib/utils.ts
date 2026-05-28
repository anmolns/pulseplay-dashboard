import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export {
  formatRate,
  formatCpi,
  formatDuration,
  formatDate,
  formatDateTime,
  formatChartDate,
  timeAgo,
  formatChangeType,
  formatReportType,
  formatDateRange,
  formatLanguage,
  formatShortId,
  formatLabel,
} from './format'
