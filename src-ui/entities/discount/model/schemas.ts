import { z } from "zod";
import type { DiscountDTO, DiscountEntity } from "./types";

export const emptyDiscount: DiscountEntity = {
  id: null,
  device_id: "",
  name: "",
  discount_type: "Price" as const,
  discount_bound_type: "Volume" as const,
  discount_unit_type: "Percent" as const,
  product_type: null,
  bound: 0,
  value: 0,
  order_type: "Sale" as const,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

export const discountValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "validation.discount.name_required" }),
  discount_type: z.enum(["Price", "Card"], {
    errorMap: () => ({ message: "validation.discount.type_required" }),
  }),
  discount_bound_type: z.enum(["Volume", "Money"], {
    errorMap: () => ({ message: "validation.discount.bound_type_required" }),
  }),
  discount_unit_type: z.enum(["Percent", "MoneySum", "MoneyPrice", "Count"], {
    errorMap: () => ({ message: "validation.discount.unit_type_required" }),
  }),
  product_type: z
    .enum(["Service", "Product"])
    .nullable(),
  bound: z.coerce
    .number()
    .min(0, { message: "validation.discount.bound_positive" }),
  value: z.coerce
    .number()
    .min(0, { message: "validation.discount.value_positive" }),
  order_type: z.enum(
    ["Income", "Outcome", "Sale", "Returns"],
    {
      errorMap: () => ({ message: "validation.discount.order_type_required" }),
    }
  ),
});

export type DiscountFormSchema = z.infer<typeof discountValidationSchema>;

export const discountEntityToFormData = (
  discount: DiscountEntity | null
): DiscountFormSchema => ({
  id: discount?.id ?? null,
  name: discount?.name ?? "",
  discount_type: discount?.discount_type ?? "Price",
  discount_bound_type: discount?.discount_bound_type ?? "Volume",
  discount_unit_type: discount?.discount_unit_type ?? "Percent",
  product_type: discount?.product_type ?? null,
  bound: discount?.bound ?? 0,
  value: discount?.value ?? 0,
  order_type: discount?.order_type ?? "Sale",
});

export const discountFormDataToDTO = (
  formData: DiscountFormSchema
): DiscountDTO => {
  return {
    id: formData.id,
    name: formData.name,
    discount_type: formData.discount_type,
    discount_bound_type: formData.discount_bound_type,
    discount_unit_type: formData.discount_unit_type,
    product_type: formData.product_type,
    bound: formData.bound,
    value: formData.value,
    order_type: formData.order_type,
  };
};
