import {
  createBulkPriceSchema,
  createPriceFormSchema,
  createPriceValidationSchema,
  createProductValidationSchema,
  bulkPriceSchema as staticBulkPriceSchema,
  priceFormSchema as staticPriceFormSchema,
  priceValidationSchema as staticPriceSchema,
  productValidationSchema as staticProductSchema,
} from "@/entities/product/model/schemas";
import { TFunction } from "i18next";

// Export factory functions for creating translated schemas
export const getProductValidationSchema = (t: TFunction) =>
  createProductValidationSchema(t);
export const getPriceValidationSchema = (t: TFunction) =>
  createPriceValidationSchema(t);
export const getPriceFormSchema = (t: TFunction) => createPriceFormSchema(t);
export const getBulkPriceSchema = (t: TFunction) => createBulkPriceSchema(t);

// Export static schemas for backward compatibility (these won't be translated)
export const productValidationSchema = staticProductSchema;
export const priceValidationSchema = staticPriceSchema;
export const priceFormSchema = staticPriceFormSchema;
export const bulkPriceSchema = staticBulkPriceSchema;

// Utility function to get all product-related schemas with translations
export const getProductSchemas = (t: TFunction) => ({
  productValidation: createProductValidationSchema(t),
  priceValidation: createPriceValidationSchema(t),
  priceForm: createPriceFormSchema(t),
  bulkPrice: createBulkPriceSchema(t),
});

// Hook-like function for React components (assuming you're using react-i18next)
export const useTranslatedSchemas = (t: TFunction) => {
  return {
    productValidationSchema: createProductValidationSchema(t),
    priceValidationSchema: createPriceValidationSchema(t),
    priceFormSchema: createPriceFormSchema(t),
    bulkPriceSchema: createBulkPriceSchema(t),
  };
};
