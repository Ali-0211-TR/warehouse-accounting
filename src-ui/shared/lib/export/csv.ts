import type { ColumnConfig, ExportConfig, ExportResult, ExportOptions } from './types';

/**
 * Экранирование значения для CSV
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Если содержит запятую, кавычки или перенос строки - оборачиваем в кавычки
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Получение значения из объекта по пути (поддержка вложенных полей)
 */
function getValueByPath<T>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
}

/**
 * Форматирование значения ячейки
 */
function formatCellValue<T>(
  row: T,
  column: ColumnConfig<T>
): string {
  const rawValue = getValueByPath(row, column.key as string);

  if (column.formatter) {
    return String(column.formatter(rawValue, row));
  }

  return rawValue !== undefined && rawValue !== null ? String(rawValue) : '';
}

/**
 * Генерация CSV контента
 */
export function generateCSVContent<T>(
  data: T[],
  config: ExportConfig<T>,
  options: ExportOptions = {}
): string {
  const { includeHeader = true } = options;
  const lines: string[] = [];

  // Заголовки
  if (includeHeader) {
    const headers = config.columns.map(col => escapeCSVValue(col.header));
    lines.push(headers.join(','));
  }

  // Данные
  for (const row of data) {
    const values = config.columns.map(col =>
      escapeCSVValue(formatCellValue(row, col))
    );
    lines.push(values.join(','));
  }

  // BOM для правильного отображения UTF-8 в Excel
  return '\uFEFF' + lines.join('\n');
}

/**
 * Экспорт данных в CSV файл
 */
export async function exportToCSV<T>(
  data: T[],
  config: ExportConfig<T>,
  options: ExportOptions = {}
): Promise<ExportResult> {
  try {
    const { dateInFilename = true } = options;

    const content = generateCSVContent(data, config, options);

    // Формирование имени файла
    const date = dateInFilename
      ? `_${new Date().toISOString().split('T')[0]}`
      : '';
    const filename = `${config.filename}${date}.csv`;

    // Пробуем использовать Tauri API (работает только в Tauri окружении)
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      // Открываем диалог сохранения файла
      const filePath = await save({
        defaultPath: filename,
        filters: [{
          name: 'CSV файлы',
          extensions: ['csv']
        }]
      });
      if (filePath) {
        await writeTextFile(filePath, content);
        return { success: true };
      } else {
        return { success: false, error: 'File save cancelled' };
      }
    } catch (error) {
      // Браузерный fallback
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      return { success: true, filename };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
