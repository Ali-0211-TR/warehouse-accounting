import type { TFunction } from "i18next";
import { z } from "zod";
import type { CardEntity } from "./types";

export const emptyCard: CardEntity = {
  id: null,
  device_id: "",
  client: null,
  name: "",
  comment: "",
  d_begin: new Date().toISOString(),
  d_end: new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  ).toISOString(),
  state: "Ready",
  limits: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

const cardStateSchema = z.enum(["Ready", "Blocked", "Pour"]);

// Factory function to create validation schema with translations
export const createCardValidationSchema = (t: TFunction) =>
  z.object({
    id: z.string().nullable(),
    device_id: z.string(),
    client_id: z.string().nullable(),
    name: z.string().min(1, { message: t("card.name_required") }),
    comment: z.string(),
    d_begin: z.string(),
    d_end: z.string(),
    state: cardStateSchema,
  });

// Static schema for backward compatibility (will show translation keys)
export const cardValidationSchema = z.object({
  id: z.string().nullable(),
  device_id: z.string(),
  client_id: z.string().nullable(),
  name: z.string().min(1, { message: "card.name_required" }),
  comment: z.string(),
  d_begin: z.string(),
  d_end: z.string(),
  state: cardStateSchema,
});

export type CardFormSchema = z.infer<typeof cardValidationSchema>;

export const cardEntityToFormData = (
  card: CardEntity | null
): CardFormSchema => {
  return {
    id: card?.id || null,
    device_id: card?.device_id || "",
    client_id: card?.client?.id || null,
    name: card?.name || "",
    comment: card?.comment || "",
    d_begin: card?.d_begin || new Date().toISOString(),
    d_end:
      card?.d_end ||
      new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ).toISOString(),
    state: card?.state || "Ready",
  };
};

export const cardFormDataToEntity = (formData: CardFormSchema): CardEntity => {
  return {
    id: formData.id,
    device_id: formData.device_id,
    client: formData.client_id ? ({ id: formData.client_id } as any) : null,
    name: formData.name,
    comment: formData.comment || "",
    d_begin: formData.d_begin,
    d_end: formData.d_end,
    state: formData.state,
    limits: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
    version: BigInt(0),
  };
};
