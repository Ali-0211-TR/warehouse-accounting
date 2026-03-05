import type { ExportConfig, ExportResult, ExportOptions, ColumnConfig } from './types';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } from 'docx';

/**
 * Получение значения из объекта по пути
 */
function getValueByPath<T>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
}

/**
 * Форматирование значения ячейки
 */
function formatCellValue<T>(row: T, column: ColumnConfig<T>): string {
  const rawValue = getValueByPath(row, column.key as string);

  if (column.formatter) {
    return String(column.formatter(rawValue, row));
  }

  return rawValue !== undefined && rawValue !== null ? String(rawValue) : '';
}

/**
 * Экспорт данных в Word (DOCX) файл
 */
export async function exportToWord<T>(
  data: T[],
  config: ExportConfig<T>,
  options: ExportOptions = {}
): Promise<ExportResult> {
  try {
    const { dateInFilename = true } = options;

    const children: (Paragraph | Table)[] = [];

    // Заголовок
    if (config.title) {
      children.push(
        new Paragraph({
          text: config.title,
          heading: 'Heading1',
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }

    // Метаданные
    if (config.metadata) {
      for (const [key, value] of Object.entries(config.metadata)) {
        children.push(
          new Paragraph({
            text: `${key}: ${value}`,
            spacing: { after: 100 },
          })
        );
      }
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 200 },
        })
      );
    }

    // Создание таблицы
    const headerCells = config.columns.map(
      col =>
        new TableCell({
          children: [new Paragraph({ text: col.header })],
          shading: { fill: 'E8E8E8' },
        })
    );

    const rows = [
      new TableRow({
        children: headerCells,
        tableHeader: true,
      }),
    ];

    // Добавление данных
    for (const row of data) {
      const cells = config.columns.map(
        col =>
          new TableCell({
            children: [new Paragraph({ text: formatCellValue(row, col) })],
          })
      );
      rows.push(new TableRow({ children: cells }));
    }

    const table = new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
    });

    children.push(table);

    // Создание документа
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children,
        },
      ],
    });

    // Генерация blob
    const blob = await Packer.toBlob(doc);

    // Генерация имени файла
    const date = dateInFilename
      ? `_${new Date().toISOString().split('T')[0]}`
      : '';
    const filename = `${config.filename}${date}.docx`;

    // Пробуем использовать Tauri API (работает только в Tauri окружении)
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      // Открываем диалог сохранения файла
      const filePath = await save({
        defaultPath: filename,
        filters: [{
          name: 'Word файлы',
          extensions: ['docx', 'doc']
        }]
      });
      if (filePath) {
        // Преобразуем blob в Uint8Array
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Сохраняем файл
        await writeFile(filePath, uint8Array);
        return { success: true };
      } else {
        return { success: false, error: 'File save cancelled' };
      }
    } catch (error) {
      // Браузерный fallback
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
