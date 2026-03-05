import { useCameraStore } from "@/entities/camera";
import {
  createDispenserValidationSchema,
  DispenserEntity,
} from "@/entities/dispenser";
import { useDispenserPortStore } from "@/entities/dispenser-port";
import {
  dispenserEntityToFormData,
  dispenserFormDataToDTO,
  DispenserFormSchema,
} from "@/entities/dispenser/model/schemas";
import { DispenserDTO } from "@/shared/bindings/DispenserDTO";
import { DISPENSER_STATE_OPTIONS } from "@/shared/const/options";
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
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface DispenserFormProps {
  visible: boolean;
  onHide: () => void;
  dispenser: DispenserEntity | null;
  onSave: (dispenser: DispenserDTO) => Promise<void>;
}

const DispenserFormFields = () => {
  const { cameras, loadCameras } = useCameraStore(); // Add cameras here
  const { dispenserPorts, loadDispenserPorts } = useDispenserPortStore();

  useEffect(() => {
    loadCameras();
    loadDispenserPorts().catch(console.error);
  }, [loadCameras, loadDispenserPorts]);

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dispenser.name")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("dispenser.name_placeholder")}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="base_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dispenser.base_address")}</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="port_id"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>{t("dispenser.port")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("dispenser.select_port")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dispenserPorts
                    .filter(port => port.id !== null)
                    .map(port => (
                      <SelectItem key={port.id} value={port.id!}>
                        {port.port_name} ({port.protocol})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="camera_id"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>{t("dispenser.camera")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "none" ? null : value)
                }
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("dispenser.select_camera")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {cameras
                    .filter(camera => camera.id !== null)
                    .map(camera => (
                      <SelectItem key={camera.id} value={camera.id!}>
                        {camera.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="state"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>{t("dispenser.state")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("dispenser.select_state")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISPENSER_STATE_OPTIONS.map(option => (
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
    </div>
  );
};

export function DispenserForm({
  visible,
  onHide,
  dispenser,
  onSave,
}: DispenserFormProps) {
  const { t } = useTranslation();
  const header = dispenser?.id
    ? t("dispenser.edit_dispenser")
    : t("dispenser.add_dispenser");
  const initialData = dispenserEntityToFormData(dispenser);

  // Create schema with translations
  const validationSchema = createDispenserValidationSchema(t);

  const handleSave = async (formData: DispenserFormSchema) => {
    const dispenser = dispenserFormDataToDTO(formData);
    await onSave(dispenser);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={validationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <DispenserFormFields />
    </EntityForm>
  );
}
