import { MarkDTO } from "@/entities/mark";
import {
  markEntityToFormData,
  markFormDataToDTO,
  MarkFormSchema,
  markValidationSchema,
} from "@/entities/mark/model/schemas";
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

interface MarkFormProps {
  visible: boolean;
  onHide: () => void;
  mark: MarkDTO | null;
  onSave: (mark: MarkDTO) => Promise<void>;
}

const MarkFormFields = () => {
  // const getPresetIcon = (category: string) => {
  //     switch (category) {
  //         case 'premium': return <Award className="h-3 w-3 text-yellow-500" />
  //         case 'eco': return <div className="text-green-500 text-xs">🌱</div>
  //         case 'standard': return <Tag className="h-3 w-3 text-blue-500" />
  //         case 'vip': return <Star className="h-3 w-3 text-purple-500" />
  //         default: return <Tag className="h-3 w-3 text-gray-500" />
  //     }
  // }

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      {/* <div className="space-y-3">
                <FormLabel>{t('mark.quick_presets')}</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {MARK_PRESETS.map((preset) => (
                        <Button
                            key={preset.value}
                            type="button"
                            variant={selectedPreset === preset.value ? "default" : "outline"}
                            size="sm"
                            className="h-auto p-2 flex flex-col items-center space-y-1"
                            onClick={() => {
                                setSelectedPreset(preset.value)
                                // This would need access to form context
                                // We'll implement this differently in a real scenario
                            }}
                        >
                            <div className="flex items-center space-x-1">
                                {getPresetIcon(preset.category)}
                                <span className="text-xs font-medium">{preset.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {t(`mark.category.${preset.category}`)}
                            </Badge>
                        </Button>
                    ))}
                </div>
                <div className="text-xs text-muted-foreground">
                    {t('mark.presets_help')}
                </div>
            </div> */}

      <div className="space-y-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("mark.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("mark.name_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-muted-foreground">
                {t("mark.name_help")}
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Preview */}
      {/* <div className="space-y-2">
                <FormLabel>{t('mark.preview')}</FormLabel>
                <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                        {t('mark.preview_help')}
                    </div>
                </div>
            </div> */}
    </div>
  );
};

export function MarkForm({ visible, onHide, mark, onSave }: MarkFormProps) {
  const header = mark?.id ? t("mark.edit_mark") : t("mark.add_mark");

  const initialData = markEntityToFormData(mark);
  const handleSave = async (formData: MarkFormSchema) => {
    const mark = markFormDataToDTO(formData);
    await onSave(mark);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={markValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <MarkFormFields />
    </EntityForm>
  );
}
