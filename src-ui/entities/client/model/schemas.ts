import type { ClientDTO } from "@/shared/bindings/ClientDTO";
import type { TFunction } from "i18next";
import { z } from "zod";
import type { ClientEntity } from "./types";

// Note: emptyClient should not be used for forms, use clientEntityToFormData instead
export const emptyClient: ClientEntity = {
  id: null,
  device_id: "",
  client_type: "Juridical",
  name: "",
  name_short: "",
  document_code: null,
  address: null,
  tax_code: null,
  bank: null,
  contact: null,
  login: "",
  password: "",
  cards: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

const clientTypeSchema = z.enum([
  "Juridical",
  "Physical",
  "Postpayment",
  "Prepayment",
  "Seller",
]);

// Factory function to create validation schema with translations
export const createClientValidationSchema = (t: TFunction) =>
  z.object({
    id: z.string().nullable(),
    client_type: clientTypeSchema,
    name: z.string().min(1, { message: t("client.name_required") }),
    name_short: z.string().min(1, { message: t("client.name_short_required") }),
    document_code: z.string(),
    address: z.string(),
    tax_code: z.string(),
    bank: z.string(),
    contact: z.string(),
    login: z.string().min(3, { message: t("client.login_required") }),
    password: z.string().min(6, { message: t("client.password_required") }),
  });

// Static schema for backward compatibility (will show translation keys)
export const clientValidationSchema = z.object({
  id: z.string().nullable(),
  client_type: clientTypeSchema,
  name: z.string().min(1, { message: "client.name_required" }),
  name_short: z.string().min(1, { message: "client.name_short_required" }),
  document_code: z.string(),
  address: z.string(),
  tax_code: z.string(),
  bank: z.string(),
  contact: z.string(),
  login: z.string().min(3, { message: "client.login_required" }),
  password: z.string().min(6, { message: "client.password_required" }),
});

export type ClientFormSchema = z.infer<typeof clientValidationSchema>;

export const clientEntityToFormData = (
  client: ClientEntity | null
): ClientFormSchema => {
  return {
    id: client?.id || null,
    client_type: client?.client_type || "Juridical",
    name: client?.name || "",
    name_short: client?.name_short || "",
    document_code: client?.document_code || "",
    address: client?.address || "",
    tax_code: client?.tax_code || "",
    bank: client?.bank || "",
    contact: client?.contact || "",
    login: client?.login || "",
    password: client?.password || "",
  };
};

export const clientFormDataToDTO = (formData: ClientFormSchema): ClientDTO => {
  return {
    id: formData.id,
    client_type: formData.client_type,
    name: formData.name,
    name_short: formData.name_short,
    document_code: formData.document_code || null,
    address: formData.address || null,
    tax_code: formData.tax_code || null,
    bank: formData.bank || null,
    contact: formData.contact || null,
    login: formData.login,
    password: formData.password,
  };
};
