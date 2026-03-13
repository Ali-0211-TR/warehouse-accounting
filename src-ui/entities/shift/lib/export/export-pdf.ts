import type { ShiftEntity } from "../../model/types";
import { format } from "date-fns";
import { TFunction } from "i18next";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Инициализируем шрифты (Roboto с поддержкой кириллицы)
(pdfMake as any).vfs = pdfFonts;

/**
 * Экспорт детального отчёта смены в PDF
 */
export async function exportShiftToPDF(
  shift: ShiftEntity,
  t: TFunction
): Promise<Blob> {
  const duration = shift.d_close
    ? calculateDuration(shift.d_open, shift.d_close)
    : t("shift.ongoing", "В работе");

  const content: any[] = [
    // Заголовок
    {
      text: `${t("shift.detailed_report", "Детальный отчёт по смене")} #${shift.id?.slice(-8) || ''}`,
      style: 'header',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    },
    // Метаданные
    {
      text: `${t("common.generated_at", "Сформировано")}: ${format(new Date(), "dd.MM.yyyy HH:mm")}`,
      style: 'metadata',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    },
    // Основная информация
    {
      text: t("shift.main_info", "Основная информация"),
      style: 'subheader',
      margin: [0, 10, 0, 5]
    },
    {
      table: {
        widths: ['40%', '60%'],
        body: [
          [{ text: t("shift.status", "Статус"), style: 'tableLabel' }, shift.d_close ? t("shift.closed", "Закрыта") : t("shift.open", "Открыта")],
          [{ text: t("shift.duration", "Продолжительность"), style: 'tableLabel' }, duration],
          [{ text: t("shift.opened_at", "Дата открытия"), style: 'tableLabel' }, format(new Date(shift.d_open), "dd.MM.yyyy HH:mm:ss")],
          [{ text: t("shift.closed_at", "Дата закрытия"), style: 'tableLabel' }, shift.d_close ? format(new Date(shift.d_close), "dd.MM.yyyy HH:mm:ss") : "-"],
          [{ text: t("shift.opened_by", "Открыл"), style: 'tableLabel' }, shift.user_open.full_name],
          [{ text: t("shift.closed_by", "Закрыл"), style: 'tableLabel' }, shift.user_close?.full_name || "-"],
        ]
      },
      margin: [0, 0, 0, 15]
    }
  ];

  // Данные резервуаров на начало смены
  if (shift.data_open && shift.data_open.length > 0) {
    content.push(
      {
        text: t("shift.data_at_open", "Данные резервуаров на начало смены"),
        style: 'subheader',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: t("tank.number", "№"), style: 'tableHeader' },
              { text: t("tank.product", "Продукт"), style: 'tableHeader' },
              { text: t("tank.temperature", "Темп. (°C)"), style: 'tableHeader' },
              { text: t("tank.density", "Плотность"), style: 'tableHeader' },
              { text: t("tank.level", "Уровень (мм)"), style: 'tableHeader' },
              { text: t("tank.volume", "Объём (л)"), style: 'tableHeader' },
            ],
            ...shift.data_open.map(tank => [
              tank.number.toString(),
              tank.gas,
              tank.temperature.toFixed(1),
              tank.density.toFixed(3),
              tank.level_current.toFixed(2),
              tank.volume_current.toFixed(2),
            ])
          ]
        },
        margin: [0, 0, 0, 15]
      }
    );
  }

  // Данные резервуаров на конец смены
  if (shift.data_close && shift.data_close.length > 0) {
    content.push(
      {
        text: t("shift.data_at_close", "Данные резервуаров на конец смены"),
        style: 'subheader',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: t("tank.number", "№"), style: 'tableHeader' },
              { text: t("tank.product", "Продукт"), style: 'tableHeader' },
              { text: t("tank.temperature", "Темп. (°C)"), style: 'tableHeader' },
              { text: t("tank.density", "Плотность"), style: 'tableHeader' },
              { text: t("tank.level", "Уровень (мм)"), style: 'tableHeader' },
              { text: t("tank.volume", "Объём (л)"), style: 'tableHeader' },
            ],
            ...shift.data_close.map(tank => [
              tank.number.toString(),
              tank.gas,
              tank.temperature.toFixed(1),
              tank.density.toFixed(3),
              tank.level_current.toFixed(2),
              tank.volume_current.toFixed(2),
            ])
          ]
        },
        margin: [0, 0, 0, 15]
      }
    );

    // Данные ТРК removed (dispensers no longer in backend)
  }

  // Изменение объёмов
  if (shift.data_open && shift.data_close) {
    content.push(
      {
        text: t("shift.volume_difference", "Изменение объёмов за смену"),
        style: 'subheader',
        margin: [0, 10, 0, 5]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: t("tank.number", "№"), style: 'tableHeader' },
              { text: t("tank.product", "Продукт"), style: 'tableHeader' },
              { text: t("shift.volume_start", "Объём начало (л)"), style: 'tableHeader' },
              { text: t("shift.volume_end", "Объём конец (л)"), style: 'tableHeader' },
              { text: t("shift.volume_diff", "Разница (л)"), style: 'tableHeader' },
            ],
            ...shift.data_open.map(tankOpen => {
              const tankClose = shift.data_close?.find(t => t.number === tankOpen.number);
              if (!tankClose) return null;

              const diff = tankOpen.volume_current - tankClose.volume_current;

              return [
                tankOpen.number.toString(),
                tankOpen.gas,
                tankOpen.volume_current.toFixed(2),
                tankClose.volume_current.toFixed(2),
                `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`,
              ];
            }).filter(Boolean)
          ]
        },
        margin: [0, 0, 0, 15]
      }
    );
  }

  const docDefinition: any = {
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#2c3e50'
      },
      metadata: {
        fontSize: 9,
        color: '#7f8c8d'
      },
      subheader: {
        fontSize: 12,
        bold: true,
        color: '#34495e'
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        fillColor: '#3498db',
        color: 'white'
      },
      tableLabel: {
        bold: true,
        fillColor: '#ecf0f1'
      }
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9
    },
    pageMargins: [40, 40, 40, 40]
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBlob((blob: Blob) => {
        resolve(blob);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Вычисление продолжительности смены
 */
function calculateDuration(openDate: string, closeDate: string): string {
  const start = new Date(openDate);
  const end = new Date(closeDate);
  const diff = end.getTime() - start.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}ч ${minutes}м`;
}
