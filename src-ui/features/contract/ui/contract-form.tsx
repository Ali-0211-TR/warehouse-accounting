import { ClientEntity } from "@/entities/client";
import { ClientSelector } from "@/entities/client/ui/ClientSelector";
import { ContractEntity } from "@/entities/contract";
import {
  contractEntityToFormData,
  contractFormDataToDTO,
  ContractFormSchema,
  contractValidationSchema,
} from "@/entities/contract/model/schemas";
import { ContractDTO } from "@/shared/bindings/ContractDTO";
import { DatePicker } from "@/shared/ui/components/DatePicker";
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
import { useEffect, useState } from "react";

interface ContractFormProps {
  visible: boolean;
  onHide: () => void;
  contract: ContractEntity | null;
  onSave: (contract: ContractDTO) => Promise<void>;
}

const ContractFormFields = ({
  contract,
}: {
  contract: ContractEntity | null;
}) => {
  const [selectedClient, setSelectedClient] = useState<ClientEntity | null>(
    null
  );

  // Initialize selected client when contract changes
  useEffect(() => {
    if (contract?.client) {
      setSelectedClient(contract.client);
    } else {
      setSelectedClient(null);
    }
  }, [contract]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contract.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("contract.name_placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="contract_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contract.contract_name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("contract.contract_name_placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contract.client")}</FormLabel>
              <FormControl>
                <ClientSelector
                  value={selectedClient}
                  onSelect={client => {
                    setSelectedClient(client);
                    field.onChange(client?.id || null);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="d_begin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contract.d_begin")}</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("contract.select_start_date")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="d_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contract.d_end")}</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("contract.select_end_date")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export function ContractForm({
  visible,
  onHide,
  contract,
  onSave,
}: ContractFormProps) {
  const header = contract?.id
    ? t("contract.edit_contract")
    : t("contract.add_contract");
  const initialData = contractEntityToFormData(contract);
  const handleSave = async (formData: ContractFormSchema) => {
    const contract = contractFormDataToDTO(formData);
    await onSave(contract);
  };

  return (
    <EntityForm
      visible={visible}
      onHide={onHide}
      header={header}
      schema={contractValidationSchema}
      initialData={initialData}
      onSave={handleSave}
    >
      <ContractFormFields contract={contract} />
    </EntityForm>
  );
}
