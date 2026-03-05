export interface PrintColumnConfig<T> {
  key: keyof T | string;
  header: string;
  width?: string; // CSS width (e.g., '100px', '20%')
  formatter?: (value: any, row: T) => string;
  align?: 'left' | 'center' | 'right';
}

export interface PrintConfig<T> {
  title: string;
  subtitle?: string;
  columns: PrintColumnConfig<T>[];
  metadata?: Record<string, string>;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A5' | 'Letter';
  showFooter?: boolean;
  footerText?: string;
  /** Пользовательский HTML для детального отчёта (вместо таблицы) */
  customHTML?: string;
}

export interface PrintStyles {
  /** CSS стили для печати */
  customStyles?: string;
  /** Размер шрифта */
  fontSize?: string;
  /** Шрифт */
  fontFamily?: string;
}
