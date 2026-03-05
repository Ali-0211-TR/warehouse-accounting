import { z } from "zod";
import type { UnitDTO, UnitEntity } from "./types";

export const emptyUnit: UnitDTO = {
  id: null,
  name: "",
  short_name: "",
};

export const emptyUnitEntity: UnitEntity = {
  id: null,
  device_id: "",
  name: "",
  short_name: "",
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

export const unitValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "unit.name_required" }),
  short_name: z.string().min(1, { message: "unit.short_name_required" }),
});

export type UnitFormSchema = z.infer<typeof unitValidationSchema>;

export const uintEntityToFormData = (unit: UnitDTO | null): UnitFormSchema => ({
  id: unit?.id ?? null,
  name: unit?.name ?? "",
  short_name: unit?.short_name ?? "",
});

export const unitFormDataToDTO = (formData: UnitFormSchema): UnitDTO => {
  return {
    id: formData.id,
    name: formData.name,
    short_name: formData.short_name,
  };
};
