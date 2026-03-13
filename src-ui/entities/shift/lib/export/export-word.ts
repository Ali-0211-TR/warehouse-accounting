import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle, TextRun } from 'docx';
import type { ShiftEntity } from "../../model/types";
import { format } from "date-fns";
import { TFunction } from "i18next";

/**
 * Экспорт детального отчёта смены в Word
 */
export async function exportShiftToWord(
  shift: ShiftEntity,
  t: TFunction
): Promise<Blob> {
  const duration = shift.d_close
    ? calculateDuration(shift.d_open, shift.d_close)
    : t("shift.ongoing", "В работе");

  const children: (Paragraph | Table)[] = [];

  // Заголовок
  children.push(
    new Paragraph({
      text: `${t("shift.detailed_report", "Детальный отчёт по смене")} #${shift.id?.slice(-8) || ''}`,
      heading: 'Heading1',
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Метаданные
  children.push(
    new Paragraph({
      text: `${t("common.generated_at", "Сформировано")}: ${format(new Date(), "dd.MM.yyyy HH:mm")}`,
      spacing: { after: 200 },
    })
  );

  // Основная информация
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: t("shift.main_info", "Основная информация"),
          bold: true,
          size: 28,
        })
      ],
      spacing: { before: 300, after: 200 },
    })
  );

  const mainInfoRows = [
    [t("shift.status", "Статус"), shift.d_close ? t("shift.closed", "Закрыта") : t("shift.open", "Открыта")],
    [t("shift.duration", "Продолжительность"), duration],
    [t("shift.opened_at", "Дата открытия"), format(new Date(shift.d_open), "dd.MM.yyyy HH:mm:ss")],
    [t("shift.closed_at", "Дата закрытия"), shift.d_close ? format(new Date(shift.d_close), "dd.MM.yyyy HH:mm:ss") : "-"],
    [t("shift.opened_by", "Открыл"), shift.user_open.full_name],
    [t("shift.closed_by", "Закрыл"), shift.user_close?.full_name || "-"],
  ];

  children.push(createWordTable(mainInfoRows));

  // Данные резервуаров на начало смены
  if (shift.data_open && shift.data_open.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: t("shift.data_at_open", "Данные резервуаров на начало смены"),
            bold: true,
            size: 28,
          })
        ],
        spacing: { before: 400, after: 200 },
      })
    );

    const tankOpenHeaders = [
      t("tank.number", "№"),
      t("tank.product", "Продукт"),
      t("tank.temperature", "Темп. (°C)"),
      t("tank.density", "Плотность"),
      t("tank.level", "Уровень (мм)"),
      t("tank.volume", "Объём (л)"),
    ];

    const tankOpenRows = shift.data_open.map(tank => [
      tank.number.toString(),
      tank.gas,
      tank.temperature.toFixed(1),
      tank.density.toFixed(3),
      tank.level_current.toFixed(2),
      tank.volume_current.toFixed(2),
    ]);

    children.push(createWordTable([tankOpenHeaders, ...tankOpenRows], true));
  }

  // Данные резервуаров на конец смены
  if (shift.data_close && shift.data_close.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: t("shift.data_at_close", "Данные резервуаров на конец смены"),
            bold: true,
            size: 28,
          })
        ],
        spacing: { before: 400, after: 200 },
      })
    );

    const tankCloseHeaders = [
      t("tank.number", "№"),
      t("tank.product", "Продукт"),
      t("tank.temperature", "Темп. (°C)"),
      t("tank.density", "Плотность"),
      t("tank.level", "Уровень (мм)"),
      t("tank.volume", "Объём (л)"),
    ];

    const tankCloseRows = shift.data_close.map(tank => [
      tank.number.toString(),
      tank.gas,
      tank.temperature.toFixed(1),
      tank.density.toFixed(3),
      tank.level_current.toFixed(2),
      tank.volume_current.toFixed(2),
    ]);

    children.push(createWordTable([tankCloseHeaders, ...tankCloseRows], true));
  }

  // Изменение объёмов
  if (shift.data_open && shift.data_close) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: t("shift.volume_difference", "Изменение объёмов за смену"),
            bold: true,
            size: 28,
          })
        ],
        spacing: { before: 400, after: 200 },
      })
    );

    const diffHeaders = [
      t("tank.number", "№"),
      t("tank.product", "Продукт"),
      t("shift.volume_start", "Объём начало (л)"),
      t("shift.volume_end", "Объём конец (л)"),
      t("shift.volume_diff", "Разница (л)"),
    ];

    const diffRows = shift.data_open.map(tankOpen => {
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
    }).filter(Boolean) as string[][];

    children.push(createWordTable([diffHeaders, ...diffRows], true));
  }

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

  return await Packer.toBlob(doc);
}

/**
 * Создание таблицы Word
 */
function createWordTable(data: string[][], hasHeader: boolean = false): Table {
  const rows = data.map((rowData, index) => {
    const cells = rowData.map(cellData =>
      new TableCell({
        children: [new Paragraph({ text: cellData })],
        shading: index === 0 && hasHeader ? { fill: 'E8E8E8' } : undefined,
      })
    );
    return new TableRow({ children: cells, tableHeader: index === 0 && hasHeader });
  });

  return new Table({
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
