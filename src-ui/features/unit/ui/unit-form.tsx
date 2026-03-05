import { UnitDTO, UnitEntity } from "@/entities/unit";
import {
  uintEntityToFormData,
  unitFormDataToDTO,
  UnitFormSchema,
  unitValidationSchema,
} from "@/entities/unit/model/schemas";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/shadcn/form";
import { Input } from "@/shared/ui/shadcn/input";
import { t } from "i18next";

interface UnitFormProps {
  visible: boolean;
  onHide: () => void;
  unit: UnitEntity | null;
  onSave: (unit: UnitDTO) => Promise<void>;
}

const UnitFormFields = () => {
  // const handlePresetSelect = (presetValue: string, form: any) => {
  //     const preset = UNIT_PRESETS.find(p => p.value === presetValue)
  //     if (preset) {
  //         form.setValue('name', preset.name)
  //         form.setValue('short_name', preset.short_name)
  //         setSelectedPreset(presetValue)
  //     }
  // }

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      {/* <div className="space-y-2">
                <FormLabel>{t('unit.quick_presets')}</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {UNIT_PRESETS.map((preset) => (
                        <Button
                            key={preset.value}
                            type="button"
                            variant={selectedPreset === preset.value ? "default" : "outline"}
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                                // This would need access to form context
                                // We'll implement this differently
                            }}
                        >
                            <span className="font-mono mr-1">{preset.short_name}</span>
                            <span className="text-muted-foreground">{preset.name}</span>
                        </Button>
                    ))}
                </div>
                <div className="text-xs text-muted-foreground">
                    {t('unit.presets_help')}
                </div>
            </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("unit.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("unit.name_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="short_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("unit.short_name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("unit.short_name_placeholder")}
                  maxLength={10}
                  className="font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {/* <div className="text-xs text-muted-foreground">
                                {t('unit.short_name_help')}
                            </div> */}
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export function UnitForm({ visible, onHide, unit, onSave }: UnitFormProps) {
  const header = unit?.id ? t("unit.edit_unit") : t("unit.add_unit");
  const initialData = uintEntityToFormData(unit);
  const handleSave = async (formData: UnitFormSchema) => {
    const unit = unitFormDataToDTO(formData);
    await onSave(unit);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={unitValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <UnitFormFields />
    </EntityForm>
  );
}
