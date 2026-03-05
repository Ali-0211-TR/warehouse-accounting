import { z } from "zod";
import type { GroupDTO, GroupEntity } from "./types";

export const emptyGroup: GroupDTO = {
  id: null,
  group_type: "Client" as const,
  mark_id: null,
  name: "",
  parent_id: null,
  discount_ids: [],
};

export const emptyGroupEntity: GroupEntity = {
  id: null,
  device_id: "",
  group_type: "Client" as const,
  mark: null,
  name: "",
  parent_id: null,
  discounts: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};

const groupTypeSchema = z.enum(["No", "Client", "Product", "Idcard"]);

export const groupValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "validation.group.name_required" }),
  group_type: groupTypeSchema.refine(() => true, {
    message: "validation.group.type_required",
  }),
  mark_id: z.string().nullable(),
  parent_id: z.string().nullable(),
  discount_ids: z.array(z.string()).default([]),
});

export type GroupFormSchema = z.infer<typeof groupValidationSchema>;

export const groupEntityToFormData = (
  group: GroupEntity | null
): GroupFormSchema => ({
  id: group?.id ?? null,
  name: group?.name ?? "",
  group_type: group?.group_type ?? "Client",
  mark_id: group?.mark?.id ?? null,
  parent_id: group?.parent_id ?? null,
  discount_ids:
    group?.discounts
      ?.map(d => d.id)
      .filter((id): id is string => id !== null) ?? [],
});

export const groupFormDataToDTO = (formData: GroupFormSchema): GroupDTO => {
  return {
    id: formData.id,
    name: formData.name,
    group_type: formData.group_type,
    mark_id: formData.mark_id,
    parent_id: formData.parent_id,
    discount_ids: formData.discount_ids,
  };
};
