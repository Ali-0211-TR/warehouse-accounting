import type { ExportConfig, ExportResult, ExportOptions, ColumnConfig } from './types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Транслитерация кириллицы в латиницу для PDF
 */
function transliterate(text: string): string {
  const map: Record<string, string> = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return text.split('').map(char => map[char] || char).join('');
}

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
 * Экспорт данных в PDF файл
 */
export async function exportToPDF<T>(
  data: T[],
  config: ExportConfig<T>,
  options: ExportOptions = {}
): Promise<ExportResult> {
  try {
    const { dateInFilename = true } = options;

    // Создаём PDF документ с поддержкой Unicode
    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
    });

    // ВАЖНО: Используем courier для кириллицы (один из немногих шрифтов jsPDF с поддержкой расширенной кодировки)
    // Или просто используем стандартный шрифт, но с правильной обработкой текста

    // Функция для безопасного добавления текста с кириллицей
    const addText = (text: string, x: number, y: number) => {
      try {
        // Пытаемся добавить текст как есть
        doc.text(text, x, y);
      } catch (e) {
        // Если не получается, используем латиницу
        doc.text(transliterate(text), x, y);
      }
    };

    // Заголовок
    if (config.title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      addText(config.title, 14, 15);
    }

    // Метаданные
    let yPosition = config.title ? 25 : 15;
    if (config.metadata) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      for (const [key, value] of Object.entries(config.metadata)) {
        addText(`${key}: ${value}`, 14, yPosition);
        yPosition += 6;
      }
      yPosition += 5;
    }

    // Подготовка данных для таблицы с транслитерацией
    const headers = config.columns.map(col => transliterate(String(col.header)));
    const rows = data.map(row =>
      config.columns.map(col => transliterate(formatCellValue(row, col)))
    );

    // Создание таблицы
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { top: 10, right: 14, bottom: 10, left: 14 },
    });

    // Генерация имени файла
    const date = dateInFilename
      ? `_${new Date().toISOString().split('T')[0]}`
      : '';
    const filename = `${config.filename}${date}.pdf`;

    // Пробуем использовать Tauri API (работает только в Tauri окружении)
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      // Открываем диалог сохранения файла
      const filePath = await save({
        defaultPath: filename,
        filters: [{
          name: 'PDF файлы',
          extensions: ['pdf']
        }]
      });
      if (filePath) {
        // Получаем PDF как ArrayBuffer
        const pdfData = doc.output('arraybuffer');
        const uint8Array = new Uint8Array(pdfData);

        // Сохраняем файл
        await writeFile(filePath, uint8Array);
        return { success: true };
      } else {
        return { success: false, error: 'File save cancelled' };
      }
    } catch (error) {
      // Браузерный fallback
      doc.save(filename);
      return { success: true, filename };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
