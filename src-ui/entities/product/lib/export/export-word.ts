import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  BorderStyle,
  TextRun,
} from "docx";
import type { ProductEntity } from "../../model/types";
import { TFunction } from "i18next";
import { getIncomePrice, getOutcomePrice, getSalePrice } from "../price-helpers";

/**
 * Форматирует цену для отображения
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Форматирует баланс с единицами измерения
 */
function formatBalance(
  balance: number,
  unit?: { short_name: string } | null
): string {
  return `${balance} ${unit?.short_name || ""}`;
}

/**
 * Создаёт таблицу Word с настройками границ
 */
function createWordTable(
  rows: string[][],
  hasHeader: boolean = false
): Table {
  const tableRows = rows.map((row, rowIndex) => {
    const isHeader = hasHeader && rowIndex === 0;
    return new TableRow({
      children: row.map(
        (cell) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: isHeader,
                  }),
                ],
                alignment:
                  rowIndex === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
            shading: isHeader
              ? { fill: "E8E8E8" }
              : undefined,
          })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

/**
 * Экспорт отчёта товаров в Word
 */
export async function exportProductsToWord(
  products: ProductEntity[],
  t: TFunction
): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Заголовок
  children.push(
    new Paragraph({
      text: t("menu.dictionary.products"),
      heading: "Heading1",
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Метаданные
  children.push(
    new Paragraph({
      text: `${t("common.generated_at", "Сформировано")}: ${new Date().toLocaleString("ru-RU")}`,
      spacing: { after: 400 },
    })
  );

  // Таблица товаров
  const headers = [
    t("product.name"),
    t("product.short_name"),
    t("product.article"),
    t("product.bar_code"),
    t("product.product_type"),
    t("product.balance"),
    t("product.sale"),
    t("product.income"),
    t("product.outcome"),
    t("product.unit"),
    t("product.group"),
  ];

  const productRows = products.map((product) => [
    product.name,
    product.short_name || "—",
    product.article || "—",
    product.bar_code || "—",
    t(`lists.product_type.${product.product_type}`),
    formatBalance(product.balance, product.unit),
    formatPrice(getSalePrice(product)),
    formatPrice(getIncomePrice(product)),
    formatPrice(getOutcomePrice(product)),
    product.unit?.short_name || "—",
    product.group?.name || "—",
  ]);

  children.push(createWordTable([headers, ...productRows], true));

  // Итоги
  children.push(
    new Paragraph({
      text: `${t("common.total")}: ${products.length} ${t("product.items", "товаров")}`,
      spacing: { before: 300 },
      alignment: AlignmentType.LEFT,
    })
  );

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
