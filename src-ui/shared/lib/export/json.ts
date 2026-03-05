import type { ExportConfig, ExportResult, ExportOptions } from './types';

/**
 * Экспорт данных в JSON файл
 */
export async function exportToJSON<T>(
  data: T[],
  config: ExportConfig<T>,
  options: ExportOptions = {}
): Promise<ExportResult> {
  try {
    const { dateInFilename = true } = options;

    const exportData = {
      title: config.title,
      exportedAt: new Date().toISOString(),
      metadata: config.metadata,
      count: data.length,
      data,
    };

    const content = JSON.stringify(exportData, null, 2);

    const date = dateInFilename
      ? `_${new Date().toISOString().split('T')[0]}`
      : '';
    const filename = `${config.filename}${date}.json`;

    // Пробуем использовать Tauri API (работает только в Tauri окружении)
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      // Открываем диалог сохранения файла
      const filePath = await save({
        defaultPath: filename,
        filters: [{
          name: 'JSON файлы',
          extensions: ['json']
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
      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
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
