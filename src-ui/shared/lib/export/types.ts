export type ExportFormat = 'csv' | 'xlsx' | 'xls' | 'pdf' | 'docx' | 'doc' | 'json';

export interface ColumnConfig<T> {
  /** Ключ поля в данных */
  key: keyof T | string;
  /** Заголовок колонки */
  header: string;
  /** Ширина колонки (для Excel/PDF) */
  width?: number;
  /** Форматтер значения */
  formatter?: (value: any, row: T) => string | number;
  /** Выравнивание */
  align?: 'left' | 'center' | 'right';
}

export interface ExportConfig<T> {
  /** Имя файла (без расширения) */
  filename: string;
  /** Заголовок документа */
  title?: string;
  /** Конфигурация колонок */
  columns: ColumnConfig<T>[];
  /** Дополнительные метаданные */
  metadata?: Record<string, string>;
  /** Ориентация страницы для PDF */
  orientation?: 'portrait' | 'landscape';
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}

export interface ExportOptions {
  /** Включить заголовок */
  includeHeader?: boolean;
  /** Дата в имени файла */
  dateInFilename?: boolean;
  /** Локаль для форматирования */
  locale?: string;
}
