import type { PrintColumnConfig, PrintConfig, PrintStyles } from './types';

/**
 * Получение значения из объекта по пути
 */
function getValueByPath<T>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
}

/**
 * Форматирование значения ячейки
 */
function formatCellValue<T>(row: T, column: PrintColumnConfig<T>): string {
  const rawValue = getValueByPath(row, column.key as string);

  if (column.formatter) {
    return column.formatter(rawValue, row);
  }

  return rawValue !== undefined && rawValue !== null ? String(rawValue) : '';
}

/**
 * Генерация стилей для печати
 */
function generatePrintStyles(
  config: PrintConfig<any>,
  styles: PrintStyles = {}
): string {
  const {
    fontSize = '12px',
    fontFamily = 'Arial, sans-serif',
    customStyles = ''
  } = styles;

  return `
    @media print {
      @page {
        size: ${config.pageSize || 'A4'} ${config.orientation || 'portrait'};
        margin: 15mm;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: ${fontFamily};
      font-size: ${fontSize};
      margin: 0;
      padding: 20px;
      color: #000;
      background: #fff;
    }

    .print-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }

    .print-title {
      font-size: 1.5em;
      font-weight: bold;
      margin: 0;
    }

    .print-subtitle {
      font-size: 1em;
      color: #666;
      margin: 5px 0 0 0;
    }

    .print-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 15px;
      font-size: 0.9em;
    }

    .print-metadata-item {
      display: flex;
      gap: 5px;
    }

    .print-metadata-label {
      font-weight: bold;
    }

    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .print-table th,
    .print-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }

    .print-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    .print-table tr:nth-child(even) {
      background-color: #fafafa;
    }

    .align-left { text-align: left; }
    .align-center { text-align: center; }
    .align-right { text-align: right; }

    .print-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      font-size: 0.8em;
      color: #666;
      display: flex;
      justify-content: space-between;
    }

    ${customStyles}
  `;
}

/**
 * Генерация HTML для печати
 */
export function generatePrintHTML<T>(
  data: T[],
  config: PrintConfig<T>,
  styles: PrintStyles = {}
): string {
  const css = generatePrintStyles(config, styles);
  const now = new Date().toLocaleString();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${config.title}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="print-header">
        <h1 class="print-title">${config.title}</h1>
        ${config.subtitle ? `<p class="print-subtitle">${config.subtitle}</p>` : ''}
      </div>
  `;

  // Метаданные
  if (config.metadata && Object.keys(config.metadata).length > 0) {
    html += '<div class="print-metadata">';
    for (const [key, value] of Object.entries(config.metadata)) {
      html += `
        <div class="print-metadata-item">
          <span class="print-metadata-label">${key}:</span>
          <span>${value}</span>
        </div>
      `;
    }
    html += '</div>';
  }

  // Если есть кастомный HTML, используем его вместо таблицы
  if (config.customHTML) {
    html += config.customHTML;
  } else if (config.columns && config.columns.length > 0) {
    // Таблица
    html += '<table class="print-table"><thead><tr>';

    for (const col of config.columns) {
      const width = col.width ? `style="width: ${col.width}"` : '';
      html += `<th ${width}>${col.header}</th>`;
    }

    html += '</tr></thead><tbody>';

    for (const row of data) {
      html += '<tr>';
      for (const col of config.columns) {
        const align = col.align || 'left';
        const value = formatCellValue(row, col);
        html += `<td class="align-${align}">${value}</td>`;
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
  }

  // Футер
  if (config.showFooter !== false) {
    html += `
      <div class="print-footer">
        <span>${config.footerText || ''}</span>
        <span>Напечатано: ${now}${!config.customHTML ? ` | Записей: ${data.length}` : ''}</span>
      </div>
    `;
  }

  html += '</body></html>';

  return html;
}

/**
 * Открытие окна печати (кроссплатформенное)
 */
export async function openPrintWindow<T>(
  data: T[],
  config: PrintConfig<T>,
  styles: PrintStyles = {}
): Promise<void> {
  const html = generatePrintHTML(data, config, styles);
  // Пробуем использовать Tauri API (работает только в Tauri окружении)
  try {
    // Для Tauri создаем временный файл и открываем его
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const { open } = await import('@tauri-apps/plugin-shell');
    const { tempDir } = await import('@tauri-apps/api/path');

    // Создаем временный файл без диалога сохранения
    const tmpDir = await tempDir();
    const filePath = `${tmpDir}/print_${Date.now()}.html`;
    // Сохраняем HTML файл во временную директорию
    await writeTextFile(filePath, html);
    // Открываем файл в браузере по умолчанию для печати
    await open(filePath);
  } catch (error) {
    // Браузерный метод через iframe
    openPrintWindowWithIframe(html);
  }
}

/**
 * Открытие окна печати через iframe (Tauri-safe fallback)
 */
function openPrintWindowWithIframe(html: string): void {
  // Создаем скрытый iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow!.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Используем setTimeout вместо onload для большей надежности
  setTimeout(() => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        console.error('iframe.contentWindow is null');
      }
    } catch (error) {
      console.error('Error printing:', error);
    }

    // Удаляем iframe после печати
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 100); // Небольшая задержка для загрузки содержимого
}


/**
 * Печать содержимого элемента
 */
export function printElement(
  elementId: string,
  title: string,
  styles: PrintStyles = {}
): void {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const {
    fontSize = '12px',
    fontFamily = 'Arial, sans-serif',
    customStyles = ''
  } = styles;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: ${fontFamily};
          font-size: ${fontSize};
          padding: 20px;
        }
        ${customStyles}
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
