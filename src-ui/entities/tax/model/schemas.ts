import { dateToISOString } from "@/shared/helpers";
import { z } from "zod";
import type { TaxDTO, TaxEntity } from "./types";

export const emptyTax: TaxDTO = {
  id: null,
  name: "",
  short_name: "",
  rate: 0,
  is_inclusive: false,
  d_begin: new Date().toISOString().split("T")[0],
  order_type: "Sale" as const,
};

export const emptyTaxEntity: TaxEntity = {
  id: null,
  device_id: "",
  name: "",
  short_name: "",
  rate: 0,
  is_inclusive: false,
  d_begin: new Date().toISOString().split("T")[0],
  order_type: "Sale" as const,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

export const taxValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "tax.name_required" }),
  short_name: z
    .string()
    .min(1, { message: "tax.short_name_required" })
    .max(10, { message: "tax.short_name_help" }),
  rate: z
    .number()
    .min(0, { message: "validation.tax.rate_min" })
    .max(100, { message: "validation.tax.rate_max" }),
  is_inclusive: z.boolean().default(false),
  d_begin: z.date(),
  order_type: z.enum(
    ["Income", "Outcome", "Sale", "Returns"],
    {
      errorMap: () => ({ message: "validation.tax.order_type_required" }),
    }
  ),
});

export type TaxFormSchema = z.infer<typeof taxValidationSchema>;

export const taxEntityToFormData = (tax: TaxDTO | null): TaxFormSchema => ({
  id: tax?.id ?? null,
  name: tax?.name ?? "",
  short_name: tax?.short_name ?? "",
  rate: tax?.rate ?? 0,
  is_inclusive: tax?.is_inclusive ?? false,
  d_begin: tax?.d_begin ? new Date(tax.d_begin) : new Date(),
  order_type: tax?.order_type ?? "Sale",
});

export const taxFormDataToDTO = (formData: TaxFormSchema): TaxDTO => {
  return {
    id: formData.id,
    name: formData.name,
    short_name: formData.short_name,
    rate: formData.rate,
    is_inclusive: formData.is_inclusive,
    d_begin: dateToISOString(formData.d_begin),
    order_type: formData.order_type,
  };
};
