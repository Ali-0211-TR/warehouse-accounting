/**
 * Barcode Generator Utility
 *
 * Generates internal barcodes for products without manufacturer barcodes
 * Format: 29XXXXX
 * - 2: Internal barcode indicator
 * - 9: Category (9 = general products, can be customized per product type)
 * - XXXXX: 5-digit sequence number
 */

/**
 * Generate an internal barcode based on a sequence number
 * @param sequence - The sequence number (will be padded to 5 digits)
 * @param category - Optional category code (default: 9 for general products)
 * @returns A barcode string in format 29XXXXX
 */
export function generateInternalBarcode(
  _sequence: number,
  _category: number = 9
): string {
  const currentDate = Date.now();
  return `2${currentDate.toString().substring(3, 10)}`;
}

/**
 * Generate a barcode with EAN-13 check digit
 * @param baseCode - Base code without check digit (12 digits)
 * @returns Complete EAN-13 barcode with check digit
 */
export function generateEAN13WithCheckDigit(baseCode: string): string {
  // Ensure we have exactly 12 digits
  const base = baseCode.padStart(12, "0").slice(0, 12);

  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit;
}

/**
 * Generate a barcode for a product based on its ID and type
 * @param productId - The product's database ID or sequence number
 * @param productType - The product type (Fuel, Product, Service)
 * @returns Generated barcode string
 */
export function generateProductBarcode(
  productId: number,
  productType?: string
): string {
  // Map product types to category codes
  let category = 9; // Default: general products

  if (productType) {
    switch (productType.toUpperCase()) {
      case "FUEL":
        category = 1;
        break;
      case "PRODUCT":
      case "GOODS":
        category = 2;
        break;
      case "SERVICE":
        category = 3;
        break;
      default:
        category = 9;
    }
  }

  return generateInternalBarcode(productId, category);
}

/**
 * Validate if a barcode is an internal barcode
 * @param barcode - The barcode to validate
 * @returns true if it's an internal barcode (starts with 2)
 */
export function isInternalBarcode(barcode: string): boolean {
  return barcode.startsWith("2") && barcode.length === 7;
}

/**
 * Extract sequence number from internal barcode
 * @param barcode - The internal barcode
 * @returns The sequence number or null if invalid
 */
export function extractSequenceFromBarcode(barcode: string): number | null {
  if (!isInternalBarcode(barcode)) {
    return null;
  }

  const sequence = barcode.slice(2); // Skip '2' and category digit
  return parseInt(sequence, 10);
}

export function generateProductBarcodeEAN13(
  productId: number,
  productType?: string
) {
  const categoryMap: Record<string, string> = {
    FUEL: "1",
    PRODUCT: "2",
    GOODS: "2",
    SERVICE: "3",
  };

  const category = categoryMap[productType?.toUpperCase() ?? ""] ?? "9";

  // 12 цифр: 29 + category + productId (9 цифр)
  const base = `29${category}${productId.toString().padStart(9, "0")}`;

  return generateEAN13WithCheckDigit(base);
}
