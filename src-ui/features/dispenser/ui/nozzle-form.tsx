import { NozzleEntity } from "@/entities/dispenser";
import {
  nozzleEntityToFormData,
  nozzleFormDataToDTO,
  NozzleFormSchema,
  nozzleValidationSchema,
} from "@/entities/dispenser/model/schemas";
import { useTankStore } from "@/entities/tank";
import { NozzleDTO } from "@/shared/bindings/NozzleDTO";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/shadcn/form";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { t } from "i18next";
import { useMemo } from "react";

interface NozzleFormProps {
  visible: boolean;
  onHide: () => void;
  nozzle: NozzleEntity | null;
  dispenserId: string | null;
  onSave: (nozzle: NozzleDTO) => Promise<void>;
}

const NozzleFormFields = ({ dispenserId }: { dispenserId: string | null }) => {
  const { tanks } = useTankStore();

  // No need to load tanks here - they should be loaded by the parent component

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nozzle.address")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="255"
                  {...field}
                  placeholder={t("nozzle.address_placeholder")}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="tank_id"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>{t("nozzle.tank")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("nozzle.select_product")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tanks
                    .filter(tank => tank.id !== null)
                    .map(tank => (
                      <SelectItem key={tank.id} value={tank.id!}>
                        {tank.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden field for dispenser_id */}
        <FormField
          name="dispenser_id"
          render={({ field }) => (
            <input type="hidden" {...field} value={dispenserId || ""} />
          )}
        />
      </div>
    </div>
  );
};

export function NozzleForm({
  visible,
  onHide,
  nozzle,
  dispenserId,
  onSave,
}: NozzleFormProps) {
  const header = nozzle?.id ? t("nozzle.edit_nozzle") : t("nozzle.add_nozzle");

  // Create stable initial data that only changes when nozzle or dispenserId actually changes
  const initialData = useMemo(() => {
    return nozzleEntityToFormData(nozzle, dispenserId);
  }, [nozzle?.id, nozzle?.address, nozzle?.tank?.id, dispenserId]);

  // Debug logging

  const handleSave = async (formData: NozzleFormSchema) => {
    const nozzleDto = nozzleFormDataToDTO(formData);
    await onSave(nozzleDto);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={nozzleValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <NozzleFormFields dispenserId={dispenserId} />
    </EntityForm>
  );
}
