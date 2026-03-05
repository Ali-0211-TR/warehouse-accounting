import * as XLSX from 'xlsx';
import type { ColumnConfig, ExportConfig, ExportResult, ExportOptions } from './types';
import { saveFile } from '../file-helpers';

/**
 * Получение значения из объекта по пути
 */
function getValueByPath<T>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
}

/**
 * Форматирование значения ячейки
 */
function formatCellValue<T>(row: T, column: ColumnConfig<T>): string | number {
  const rawValue = getValueByPath(row, column.key as string);

  if (column.formatter) {
    return column.formatter(rawValue, row);
  }

  return rawValue !== undefined && rawValue !== null ? rawValue : '';
}

/**
 * Создание листа XLSX из данных и конфига колонок
 */
export function createSheet<T>(
  data: T[],
  columns: ColumnConfig<T>[],
  options: { includeHeader?: boolean } = {}
): XLSX.WorkSheet {
  const { includeHeader = true } = options;
  const rows: (string | number)[][] = [];

  if (includeHeader) {
    rows.push(columns.map(col => col.header));
  }

  for (const row of data) {
    rows.push(columns.map(col => formatCellValue(row, col)));
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Установка ширин колонок
  ws['!cols'] = columns.map(col => ({
    wch: col.width || Math.max(
      col.header.length + 2,
      14
    ),
  }));

  return ws;
}

/**
 * Создание пустой книги XLSX
 */
export function createEmptyWorkbook(): XLSX.WorkBook {
  return XLSX.utils.book_new();
}

/**
 * Добавление листа в книгу
 */
export function addSheetToWorkbook(
  wb: XLSX.WorkBook,
  ws: XLSX.WorkSheet,
  name: string
): void {
  // Excel ограничивает название листа 31 символом
  const safeName = name.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeName);
}

/**
 * Создание листа из массива массивов (для произвольных таблиц)
 */
export function createSheetFromAOA(
  data: (string | number | null | undefined)[][],
  colWidths?: number[]
): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(data);

  if (colWidths) {
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
  }

  return ws;
}

/**
 * Создание книги XLSX с одним листом из ExportConfig
 */
export function createWorkbook<T>(
  data: T[],
  config: ExportConfig<T>,
  options: ExportOptions = {}
): XLSX.WorkBook {
  const wb = createEmptyWorkbook();

  // Если есть metadata — добавим инфолист
  if (config.metadata && Object.keys(config.metadata).length > 0) {
    const metaRows: (string | number)[][] = [];
    if (config.title) {
      metaRows.push([config.title]);
      metaRows.push([]);
    }
    for (const [key, value] of Object.entries(config.metadata)) {
      metaRows.push([key, String(value)]);
    }
    const metaSheet = createSheetFromAOA(metaRows, [25, 40]);
    addSheetToWorkbook(wb, metaSheet, 'Информация');
  }

  // Основной лист с данными
  const ws = createSheet(data, config.columns, options);
  const sheetName = config.title ? config.title.substring(0, 31) : 'Данные';
  addSheetToWorkbook(wb, ws, sheetName);

  return wb;
}

/**
 * Конвертация WorkBook в Blob
 */
export function workbookToBlob(wb: XLSX.WorkBook): Blob {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Экспорт данных в Excel файл (настоящий .xlsx)
 */
export async function exportToExcel<T>(
  data: T[],
  config: ExportConfig<T>,
  options: ExportOptions = {}
): Promise<ExportResult> {
  try {
    const { dateInFilename = true } = options;
    const date = dateInFilename
      ? `_${new Date().toISOString().split('T')[0]}`
      : '';
    const filename = `${config.filename}${date}.xlsx`;

    const wb = createWorkbook(data, config, options);
    const blob = workbookToBlob(wb);

    await saveFile(blob, filename);

    return { success: true, filename };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
