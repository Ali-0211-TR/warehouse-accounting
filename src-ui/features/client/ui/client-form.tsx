import { ClientEntity } from "@/entities/client";
import {
  clientEntityToFormData,
  clientFormDataToDTO,
  ClientFormSchema,
  createClientValidationSchema,
} from "@/entities/client/model/schemas";
import { ClientDTO } from "@/shared/bindings/ClientDTO";
import { getClientTypeOptions } from "@/shared/const/lists";
import { EntityForm } from "@/shared/ui/components/EntityForm";
import { Button } from "@/shared/ui/shadcn/button";
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
import { Textarea } from "@/shared/ui/shadcn/textarea";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ClientFormProps {
  visible: boolean;
  onHide: () => void;
  client: ClientEntity | null;
  onSave: (client: ClientDTO) => Promise<void>;
}

const ClientFormFields = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const clientTypeOptions = getClientTypeOptions();

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
      {/* Warning Alert for Login Credentials */}
      {/* <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    {t('client.credentials_warning')}
                </AlertDescription>
            </Alert> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("client.name_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="name_short"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.name_short")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("client.name_short_placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="client_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.client_type")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder={t("client.select_client_type")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientTypeOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
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
          name="document_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.document_code")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("client.document_code_placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {/* <div className="text-xs text-muted-foreground">
                                {t('client.document_code_help')}
                            </div> */}
            </FormItem>
          )}
        />

        <FormField
          name="tax_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.tax_code")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("client.tax_code_placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              {/* <div className="text-xs text-muted-foreground">
                                {t('client.tax_code_help')}
                            </div> */}
            </FormItem>
          )}
        />

        <FormField
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.contact")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("client.contact_placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <FormField
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.address")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("client.address_placeholder")}
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="bank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("client.bank")}</FormLabel>
              <FormControl>
                <Input placeholder={t("client.bank_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Login Credentials Section */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-4">{t("client.login_credentials")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="login"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("client.login")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("client.login_placeholder")}
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <div className="text-xs text-muted-foreground">
                  {t("client.login_help")}
                </div>
              </FormItem>
            )}
          />

          <FormField
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("client.password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("client.password_placeholder")}
                      autoComplete="new-password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                <div className="text-xs text-muted-foreground">
                  {t("client.password_help")}
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export function ClientForm({
  visible,
  onHide,
  client,
  onSave,
}: ClientFormProps) {
  const { t } = useTranslation();
  const header = client?.id ? t("client.edit_client") : t("client.add_client");

  // Create validation schema with translations
  const validationSchema = createClientValidationSchema(t);

  const initialData = clientEntityToFormData(client);
  const handleSave = async (formData: ClientFormSchema) => {
    const client = clientFormDataToDTO(formData);
    await onSave(client);
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
      <ClientFormFields />
    </EntityForm>
  );
}
