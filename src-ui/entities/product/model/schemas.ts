import type { PriceDTO } from "@/shared/bindings/PriceDTO";
import type { PriceEntity } from "@/shared/bindings/PriceEntity";
import { z } from "zod";
import type { ProductDTO, ProductEntity } from "./types";

// ProductType enum validation
const productTypeSchema = z.enum([
  "Service",
  "Product",
]);

// PriceType enum validation
const priceTypeSchema = z.enum(["Sale", "Income", "Outcome"]);

export const emptyProductEntity: ProductEntity = {
  id: null,
  device_id: "",
  name: "",
  short_name: "",
  product_type: "Product",
  unit: null,
  bar_code: "",
  article: "",
  group: null,
  discounts: [],
  taxes: [],
  balance: 0,
  prices: [],
  sale_price: 0,
  income_price: 0,
  outcome_price: 0,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: 0 as unknown as bigint,
  image_paths: []
};

// Function to create validation schema with translations
export const createProductValidationSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().nullable().optional(),
    name: z.string().min(1, { message: t("product.name_required") }),
    short_name: z
      .string()
      .min(1, { message: t("product.short_name_required") }),
    product_type: productTypeSchema,
  unit_id: z.string().min(1, { message: t("product.unit_required") }),
  bar_code: z.string().min(1, { message: t("product.bar_code_required") }),
  article: z.string().min(1, { message: t("product.article_required") }),
    group_id: z.string().nullable(), // Make nullable for foreign key
    discount_ids: z.array(z.string()).default([]),
    tax_ids: z.array(z.string()).default([]),
    image_paths: z.any(),
  });

// Main validation schema that matches ProductDTO structure (for backward compatibility)
export const productValidationSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().min(1, { message: "product.name_required" }),
  short_name: z.string().min(1, { message: "product.short_name_required" }),
  product_type: productTypeSchema,
  unit_id: z.string().nullable(), // Make nullable for foreign key
  bar_code: z.string().default(""),
  article: z.string().default(""),
  group_id: z.string().nullable(), // Make nullable for foreign key
  discount_ids: z.array(z.string()).default([]),
  tax_ids: z.array(z.string()).default([]),
  image_paths: z.any(),
});

// Function to create price validation schema with translations
export const createPriceValidationSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().nullable().optional(),
    product_id: z.string().min(1, { message: t("price.product_id_required") }),
    start_time: z.string().datetime({ message: t("price.invalid_start_time") }),
    value: z.number().min(0, { message: t("price.value_must_be_positive") }),
    price_type: priceTypeSchema,
  });

// Function to create price form schema with translations
export const createPriceFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().nullable().optional(),
    product_id: z.string().min(1, { message: t("price.product_id_required") }),
    start_time: z.string().default(() => new Date().toISOString()),
    value: z.number().min(0, { message: t("price.value_must_be_positive") }),
    price_type: priceTypeSchema.default("Sale"),
  });

// Function to create bulk price schema with translations
export const createBulkPriceSchema = (t: (key: string) => string) =>
  z.object({
    product_id: z.string().min(1, { message: t("price.product_id_required") }),
    sale_price: z
      .number()
      .min(0, { message: t("price.sale_price_must_be_positive") })
      .default(0),
    income_price: z
      .number()
      .min(0, { message: t("price.income_price_must_be_positive") })
      .default(0),
    outcome_price: z
      .number()
      .min(0, { message: t("price.outcome_price_must_be_positive") })
      .default(0),
    start_time: z
      .string()
      .datetime()
      .default(() => new Date().toISOString()),
  });

// Price validation schema (for backward compatibility)
export const priceValidationSchema = z.object({
  id: z.string().nullable().optional(),
  product_id: z.string().min(1, { message: "price.product_id_required" }),
  start_time: z.string().datetime({ message: "price.invalid_start_time" }),
  value: z.number().min(0, { message: "price.value_must_be_positive" }),
  price_type: priceTypeSchema,
});

// Price form schema for creating/editing prices (for backward compatibility)
export const priceFormSchema = z.object({
  id: z.string().nullable().optional(),
  product_id: z.string().min(1, { message: "price.product_id_required" }),
  start_time: z.string().default(() => new Date().toISOString()),
  value: z.number().min(0, { message: "price.value_must_be_positive" }),
  price_type: priceTypeSchema.default("Sale"),
});

// Bulk price creation schema (for backward compatibility)
export const bulkPriceSchema = z.object({
  product_id: z.string().min(1, { message: "price.product_id_required" }),
  sale_price: z
    .number()
    .min(0, { message: "price.sale_price_must_be_positive" })
    .default(0),
  income_price: z
    .number()
    .min(0, { message: "price.income_price_must_be_positive" })
    .default(0),
  outcome_price: z
    .number()
    .min(0, { message: "price.outcome_price_must_be_positive" })
    .default(0),
  start_time: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export type ProductFormSchema = z.infer<typeof productValidationSchema>;
export type PriceFormSchema = z.infer<typeof priceFormSchema>;
export type BulkPriceSchema = z.infer<typeof bulkPriceSchema>;

// Helper function to convert ProductEntity to form data
export const productEntityToFormData = (
  product: ProductEntity | null
): ProductFormSchema => ({
  id: product?.id ?? null,
  name: product?.name ?? "",
  short_name: product?.short_name ?? "",
  product_type: product?.product_type ?? "Product",
  unit_id: product?.unit?.id ? product.unit.id.toString() : "",
  bar_code: product?.bar_code ?? "",
  article: product?.article ?? "",
  group_id: product?.group?.id ?? null,
  discount_ids: product?.discounts?.map(d => d.id!).filter(Boolean) ?? [],
  tax_ids: product?.taxes?.map(t => t.id!).filter(Boolean) ?? [],
  image_paths: product?.image_paths ?? [],
});

// Helper function to convert form data to ProductDTO
export const productFormDataToDTO = (
  formData: ProductFormSchema
): ProductDTO => {
  return {
    id: formData.id ?? null,
    name: formData.name,
    short_name: formData.short_name,
    product_type: formData.product_type,
    unit_id: formData.unit_id,
    bar_code: formData.bar_code,
    article: formData.article,
    group_id: formData.group_id,
    discount_ids: formData.discount_ids,
    tax_ids: formData.tax_ids,
    image_paths: formData.image_paths ?? [],
  };
};

// Helper function to convert PriceEntity to form data
export const priceEntityToFormData = (
  price: PriceEntity | null
): PriceFormSchema => {
  if (!price) {
    return {
      id: null,
      product_id: "",
      start_time: new Date().toISOString(),
      value: 0,
      price_type: "Sale",
    };
  }

  return {
    id: price.id,
    product_id: price.product_id,
    start_time: price.start_time,
    value: price.value,
    price_type: price.price_type,
  };
};

// Helper function to convert price form data to PriceDTO
export const priceFormDataToDTO = (formData: PriceFormSchema): PriceDTO => {
  return {
    id: formData.id ?? null,
    product_id: formData.product_id,
    start_time: formData.start_time,
    value: formData.value,
    price_type: formData.price_type,
  };
};

// Helper function to convert price form data to PriceEntity
export const priceFormDataToEntity = (
  formData: PriceFormSchema
): PriceEntity => {
  return {
    id: formData.id ?? null,
    device_id: "",
    product_id: formData.product_id,
    start_time: formData.start_time,
    value: formData.value,
    price_type: formData.price_type,
    created_at: "",
    updated_at: "",
    deleted_at: null,
    version: BigInt(0),
  };
};

// Helper function to create multiple prices from bulk schema
// export const bulkPriceToEntities = (bulkData: BulkPriceSchema): PriceEntity[] => {
//     const prices: PriceEntity[] = []

//     if (bulkData.sale_price > 0) {
//         prices.push({
//             id: null,
//             product_id: bulkData.product_id,
//             start_time: bulkData.start_time,
//             value: bulkData.sale_price,
//             price_type: 'Sale'
//         })
//     }

//     if (bulkData.income_price > 0) {
//         prices.push({
//             id: null,
//             product_id: bulkData.product_id,
//             start_time: bulkData.start_time,
//             value: bulkData.income_price,
//             price_type: 'Income'
//         })
//     }

//     if (bulkData.outcome_price > 0) {
//         prices.push({
//             id: null,
//             product_id: bulkData.product_id,
//             start_time: bulkData.start_time,
//             value: bulkData.outcome_price,
//             price_type: 'Outcome'
//         })
//     }

//     return prices
// }

// Helper function to create multiple price DTOs from bulk schema
// export const bulkPriceToDTOs = (bulkData: BulkPriceSchema): PriceDTO[] => {
//     const prices: PriceDTO[] = []

//     if (bulkData.sale_price > 0) {
//         prices.push({
//             id: null,
//             product_id: bulkData.product_id,
//             start_time: bulkData.start_time,
//             value: bulkData.sale_price,
//             price_type: 'Sale'
//         })
//     }

//     if (bulkData.income_price > 0) {
//         prices.push({
//             id: null,
//             product_id: bulkData.product_id,
//             start_time: bulkData.start_time,
//             value: bulkData.income_price,
//             price_type: 'Income'
//         })
//     }

//     if (bulkData.outcome_price > 0) {
//         prices.push({
//             id: null,
//             product_id: bulkData.product_id,
//             start_time: bulkData.start_time,
//             value: bulkData.outcome_price,
//             price_type: 'Outcome'
//         })
//     }

//     return prices
// }

// Helper function to extract bulk price data from ProductEntity
// export const productEntityToBulkPrice = (product: ProductEntity): BulkPriceSchema => {
//     return {
//         product_id: product.id || 0,
//         sale_price: product.sale_price || 0,
//         income_price: product.income_price || 0,
//         outcome_price: product.outcome_price || 0,
//         start_time: new Date().toISOString()
//     }
// }

// Helper function to validate price data
// export const validatePriceData = (data: unknown): data is PriceFormSchema => {
//     try {
//         priceFormSchema.parse(data)
//         return true
//     } catch {
//         return false
//     }
// }

// Helper function to validate bulk price data
// export const validateBulkPriceData = (data: unknown): data is BulkPriceSchema => {
//     try {
//         bulkPriceSchema.parse(data)
//         return true
//     } catch {
//         return false
//     }
// }
