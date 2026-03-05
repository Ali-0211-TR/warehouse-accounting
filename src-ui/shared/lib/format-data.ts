
/**
 * Конвертирует значение из тийинов/копеек в основную валюту
 * @param value - значение в тийинах (умноженное на 100)
 * @returns отформатированное значение
 */
export const fromMinorUnits = (value: number): number => {
  return value / 100;
};

/**
 * Форматирует денежное значение
 */
export const formatCurrency = (value: number, decimals = 2): string => {
  return fromMinorUnits(value).toFixed(decimals);
};

/**
 * Форматирует объем
 */
export const formatVolume = (value: number, decimals = 2): string => {
  return fromMinorUnits(value).toFixed(decimals);
};
