export * from './types';
export { exportToCSV, generateCSVContent } from './csv';
export {
  exportToExcel,
  createSheet,
  createSheetFromAOA,
  createEmptyWorkbook,
  addSheetToWorkbook,
  createWorkbook,
  workbookToBlob,
} from './excel';
export { exportToJSON } from './json';
export { exportToPDF } from './pdf';
export { exportToWord } from './docx';

import type { ExportConfig, ExportFormat, ExportOptions, ExportResult } from './types';
import { exportToCSV } from './csv';
import { exportToExcel } from './excel';
import { exportToJSON } from './json';
import { exportToPDF } from './pdf';
import { exportToWord } from './docx';

/**
 * Универсальная функция экспорта
 */
export async function exportData<T>(
  data: T[],
  config: ExportConfig<T>,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<ExportResult> {
  switch (format) {
    case 'csv':
      return await exportToCSV(data, config, options);
    case 'xlsx':
    case 'xls':
      return await exportToExcel(data, config, options);
    case 'json':
      return await exportToJSON(data, config, options);
    case 'pdf':
      return await exportToPDF(data, config, options);
    case 'docx':
    case 'doc':
      return await exportToWord(data, config, options);
    default:
      return { success: false, error: `Unknown format: ${format}` };
  }
}
