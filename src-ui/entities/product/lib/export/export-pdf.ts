import type { ProductEntity } from "../../model/types";
import { TFunction } from "i18next";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { getIncomePrice, getOutcomePrice, getSalePrice } from "../price-helpers";

// Инициализируем шрифты (Roboto с поддержкой кириллицы)
(pdfMake as any).vfs = pdfFonts;

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
 * Экспорт отчёта товаров в PDF
 */
export async function exportProductsToPDF(
  products: ProductEntity[],
  t: TFunction
): Promise<Blob> {
  const content: any[] = [
    // Заголовок
    {
      text: t("menu.dictionary.products"),
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 10],
    },
    // Метаданные
    {
      text: `${t("common.generated_at", "Сформировано")}: ${new Date().toLocaleString("ru-RU")}`,
      style: "metadata",
      alignment: "center",
      margin: [0, 0, 0, 20],
    },
    // Таблица товаров
    {
      table: {
        headerRows: 1,
        widths: ["auto", "*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
        body: [
          [
            { text: t("product.name"), style: "tableHeader" },
            { text: t("product.article"), style: "tableHeader" },
            { text: t("product.bar_code"), style: "tableHeader" },
            { text: t("product.product_type"), style: "tableHeader" },
            { text: t("product.balance"), style: "tableHeader", alignment: "right" },
            { text: t("product.sale"), style: "tableHeader", alignment: "right" },
            { text: t("product.income"), style: "tableHeader", alignment: "right" },
            { text: t("product.outcome"), style: "tableHeader", alignment: "right" },
            { text: t("product.group"), style: "tableHeader" },
          ],
          ...products.map((product) => [
            product.name,
            product.article || "—",
            product.bar_code || "—",
            t(`lists.product_type.${product.product_type}`),
            { text: formatBalance(product.balance, product.unit), alignment: "right" },
            { text: formatPrice(getSalePrice(product)), alignment: "right" },
            { text: formatPrice(getIncomePrice(product)), alignment: "right" },
            { text: formatPrice(getOutcomePrice(product)), alignment: "right" },
            product.group?.name || "—",
          ]),
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#cccccc",
        vLineColor: () => "#cccccc",
      },
    },
    // Итоги
    {
      text: `${t("common.total")}: ${products.length} ${t("product.items", "товаров")}`,
      style: "footer",
      margin: [0, 20, 0, 0],
    },
  ];

  const docDefinition: any = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [20, 40, 20, 40],
    content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
      subheader: {
        fontSize: 14,
        bold: true,
      },
      metadata: {
        fontSize: 10,
        italics: true,
        color: "#666666",
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: "black",
        fillColor: "#eeeeee",
      },
      tableLabel: {
        bold: true,
      },
      footer: {
        fontSize: 11,
        bold: true,
      },
    },
    defaultStyle: {
      fontSize: 9,
    },
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
