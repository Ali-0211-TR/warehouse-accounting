import { DispenserPortEntity } from "@/entities/dispenser-port";
import {
  dispenserPortEntityToFormData,
  dispenserPortFormDataToDTO,
  DispenserPortFormSchema,
  dispenserPortValidationSchema,
} from "@/entities/dispenser-port/model/schemas";
import { useSerialPortStore } from "@/entities/serial-ports";
import type { DispenserPortDTO } from "@/shared/bindings/DispenserPortDTO";
import {
  DISPENSER_PROTOCOL_OPTIONS,
  PORT_SPEED_OPTIONS,
} from "@/shared/const/options";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/shadcn/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { t } from "i18next";
import { useEffect } from "react";

interface DispenserPortFormProps {
  visible: boolean;
  onHide: () => void;
  dispenserPort: DispenserPortEntity | null;
  onSave: (dispenserPort: DispenserPortDTO) => Promise<void>;
}

const DispenserPortFormFields = () => {
  const { ports, getPorts } = useSerialPortStore();
  useEffect(() => {
    getPorts();
  }, [getPorts]);

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <FormField
          name="port_name"
          render={({ field }) => (
            <FormItem className="w-full min-w-0">
              <FormLabel>{t("dispenser_port.port_name")}</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(value === "null" ? null : value)
                }
                value={field.value || "null"}
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue
                      placeholder={t("dispenser_port.select_port")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">{t("common.none")}</SelectItem>
                  {ports.map(option => (
                    <SelectItem
                      key={option.toString()}
                      value={option.toString()}
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="protocol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dispenser_port.protocol")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue
                      placeholder={t("dispenser_port.select_protocol")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISPENSER_PROTOCOL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="port_speed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("dispenser_port.port_speed")}</FormLabel>
              <Select
                onValueChange={value => field.onChange(Number(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue
                      placeholder={t("dispenser_port.select_port_speed")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PORT_SPEED_OPTIONS.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
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

export function DispenserPortForm({
  visible,
  onHide,
  dispenserPort,
  onSave,
}: DispenserPortFormProps) {
  const header = dispenserPort?.id
    ? t("dispenser_port.edit_dispenser_port")
    : t("dispenser_port.add_dispenser_port");
  const initialData = dispenserPortEntityToFormData(dispenserPort);

  const handleSave = async (formData: DispenserPortFormSchema) => {
    const dispenserPort = dispenserPortFormDataToDTO(formData);
    await onSave(dispenserPort);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={dispenserPortValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <DispenserPortFormFields />
    </EntityForm>
  );
}
