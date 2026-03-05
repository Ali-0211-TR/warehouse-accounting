import {
  CameraEntity,
  CameraFormSchema,
  cameraValidationSchema,
} from "@/entities/camera";
import {
  cameraEntityToFormData,
  cameraFormDataToDTO,
} from "@/entities/camera/model/schemas";
import { CameraDTO } from "@/shared/bindings/CameraDTO";
import { CAMERA_TYPE_OPTIONS } from "@/shared/const/options";
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

interface CameraFormProps {
  visible: boolean;
  onHide: () => void;
  camera: CameraEntity | null;
  onSave: (camera: CameraDTO) => Promise<void>;
}

const CameraFormFields = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("camera.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("camera.name_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="camera_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("camera.type")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("camera.select_type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CAMERA_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("camera.address")}</FormLabel>
            <FormControl>
              <Input placeholder={t("camera.address_placeholder")} {...field} />
            </FormControl>
            <FormMessage />
            <div className="text-xs text-muted-foreground">
              {t("camera.address_help")}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export function CameraForm({
  visible,
  onHide,
  camera,
  onSave,
}: CameraFormProps) {
  const header = camera?.id ? t("camera.edit_camera") : t("camera.add_camera");
  // Convert entity to form data for initial values
  const initialData = cameraEntityToFormData(camera);

  // Use store saveProduct directly
  const handleSave = async (formData: CameraFormSchema) => {
    const camera = cameraFormDataToDTO(formData);
    await onSave(camera);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={cameraValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <CameraFormFields />
    </EntityForm>
  );
}
