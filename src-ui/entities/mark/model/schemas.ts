import { z } from "zod";
import type { MarkDTO } from "./types";

export const emptyMark: MarkDTO = {
  id: null,
  name: "",
};

export const markValidationSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, { message: "mark.name_required" }),
});

export type MarkFormSchema = z.infer<typeof markValidationSchema>;

export const markEntityToFormData = (mark: MarkDTO | null): MarkFormSchema => ({
  id: mark?.id ?? null,
  name: mark?.name ?? "",
});

export const markFormDataToDTO = (formData: MarkFormSchema): MarkDTO => {
  return {
    id: formData.id,
    name: formData.name,
  };
};
