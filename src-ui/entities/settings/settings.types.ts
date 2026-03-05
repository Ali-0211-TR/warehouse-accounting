export type LangType = "uz" | "ru";
export type ThemeType = "dark" | "light" | "system";
export type PrinterWidthType = "58mm" | "80mm";

// App UI mode that changes navigation/sidebar
export type AppModeType = "fuel" | "warehouse";

export interface SettingsEntity {
  lang: LangType;
  theme: ThemeType;
  /**
   * @deprecated Use orderPrinterWidth / labelPrinterWidth.
   * Kept for backward compatibility with older persisted settings.
   */
  printerWidth?: PrinterWidthType;
  /** Paper width for order receipts */
  orderPrinterWidth: PrinterWidthType;
  /** Paper width for product labels */
  labelPrinterWidth: PrinterWidthType;
  /** Controls which sidebar/navigation set is used across the app */
  appMode?: AppModeType;
  /** @deprecated use orderPrinterName */
  printerName?: string; // Backward compatibility for older persisted settings
  /** Specific printer for order receipts */
  orderPrinterName?: string;
  /** Specific printer name for labels (e.g., Bluetooth label printer) */
  labelPrinterName?: string;
  printOnCloseOrder?: boolean; // Optional: auto-print receipt when closing order
}
