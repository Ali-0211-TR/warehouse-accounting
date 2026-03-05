// src-ui/shared/components/EntityForm.tsx
import useToast from "@/shared/hooks/use-toast";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Form } from "@/shared/ui/shadcn/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

type EntityFormProps<TSchema extends z.ZodTypeAny> = {
  visible: boolean;
  onHide: () => void;
  header: string;
  schema: TSchema;
  initialData?: z.infer<TSchema>; // Only one data prop needed
  onSave: (data: z.infer<TSchema>) => Promise<void>;
  children: React.ReactNode;
};

export function EntityForm<TSchema extends z.ZodTypeAny>({
  visible,
  onHide,
  header,
  schema,
  initialData,
  onSave,
  children,
}: EntityFormProps<TSchema>) {
  const { t } = useTranslation();
  const { showErrorToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  type FormData = z.infer<TSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  // Track if form has been initialized to prevent unnecessary resets
  const [isInitialized, setIsInitialized] = useState(false);

  // Reset form when dialog becomes visible with initial data
  useEffect(() => {
    if (visible) {
      if (initialData && !isInitialized) {
        // Only reset on first open or when switching between add/edit
        form.reset(initialData);
        setFormError(null);
        setIsInitialized(true);
      }
    } else {
      // Reset initialization flag when dialog closes
      setIsInitialized(false);
    }
  }, [visible, initialData, form, isInitialized]);

  // Handle form submission
  const onSubmit = async (values: FormData) => {
    setFormError(null);

    try {
      setIsSubmitting(true);
      // Validate data with schema
      const validatedData = schema.parse(values);

      // Call the save function
      await onSave(validatedData);

      // showSuccessToast(t('success.data_saved'));
      onHide();
    } catch (error: any) {
      console.error("Form submission error:", error);

      if (error instanceof z.ZodError) {
        // For Zod validation errors we prefer to show field-level messages
        // under each input (FormMessage). Do not display the general form
        // error card which duplicates those messages. Still show a toast.
        showErrorToast(t("error.validation_failed"));
      } else {
        // Handle other errors
        const errorMessage = error?.message || t("error.unknown_error");
        setFormError(errorMessage);
        // showErrorToast(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setFormError(null);
    setIsInitialized(false);
    onHide();
  };

  return (
    <Dialog open={visible} onOpenChange={handleCancel}>
      <DialogContent className="max-w-xl w-full">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {children}

            {/* Display form errors if any */}
            {formError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {formError}
              </div>
            )}

            {/* Developer debug block removed: field-level errors are shown under inputs */}

            <DialogFooter className="mt-4 flex flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {t("control.cancel")}
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="relative"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? t("control.saving") : t("control.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
