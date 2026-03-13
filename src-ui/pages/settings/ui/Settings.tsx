import { useDeviceConfigStore } from "@/entities/device-config";
import {
  AppModeType,
  LangType,
  PrinterWidthType,
  ThemeType,
  useSettingsState,
} from "@/entities/settings";
import { useUserStore } from "@/entities/user";
import { useTheme } from "@/shared/providers/theme-provider";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Shadcn UI components
import useToast from "@/shared/hooks/use-toast";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/shadcn/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { Separator } from "@/shared/ui/shadcn/separator";
import { Switch } from "@/shared/ui/shadcn/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { Textarea } from "@/shared/ui/shadcn/textarea";
import {
  Building2,
  Boxes,
  FileImage,
  Fuel,
  Globe,
  Laptop,
  Moon,
  Palette,
  Printer,
  RotateCcw,
  Save,
  Sun,
  TestTube,
  Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pathKeys } from "@/shared/lib/react-router";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    data,
    setLanguage,
    setTheme: setStoredTheme,
    setOrderPrinterWidth,
    setLabelPrinterWidth,
    setPrintOnCloseOrder,
    setLabelPrinterName,
    setOrderPrinterName,
    setAppMode,
  } = useSettingsState();
  const { theme, setTheme } = useTheme();
  const { showSuccessToast, showErrorToast } = useToast();

  // User store for role checking
  const { currentUser } = useUserStore();

  // Available printers state
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  // Device config state
  const { deviceConfig, fetchDeviceConfig, updateDeviceConfig, isLoading } =
    useDeviceConfigStore();
  const [deviceConfigForm, setDeviceConfigForm] = useState({
    company_name: "",
    company_address: "",
    company_tax_code: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    receipt_footer: "",
    receipt_template_58mm: "58mm",
    receipt_template_80mm: "80mm",
    label_template: "",
    qr_code_url: "",
    logo_path: "",
  });

  // Check if user has admin or manager role
  const canEditDeviceConfig =
    currentUser?.roles?.some(
      role => role === "Administrator" || role === "Manager"
    ) ?? false;

  const languageOptions: { value: LangType; label: string; flag: string }[] = [
    { value: "uz", label: "O'zbekcha", flag: "🇺🇿" },
    { value: "ru", label: "Русский", flag: "🇷🇺" },
  ];

  const themeOptions: { value: ThemeType; label: string; icon: JSX.Element }[] = [
    {
      value: "light",
      label: t("settings.light"),
      icon: <Sun className="h-4 w-4" />,
    },
    {
      value: "dark",
      label: t("settings.dark"),
      icon: <Moon className="h-4 w-4" />,
    },
    {
      value: "system",
      label: t("settings.system"),
      icon: <Laptop className="h-4 w-4" />,
    },
  ];

  const printerOptions: {
    value: PrinterWidthType;
    label: string;
    icon: JSX.Element;
  }[] = [
      {
        value: "58mm",
        label: t("settings.printer_58mm"),
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        value: "80mm",
        label: t("settings.printer_80mm"),
        icon: <Receipt className="h-4 w-4" />,
      },
    ];

  // Handle language change
  const handleLanguageChange = async (lng: LangType) => {
    try {
      await i18n.changeLanguage(lng);
      setLanguage(lng);
      showSuccessToast(t("settings.language_changed"));
    } catch (error) {
      console.error("Language change error:", error);
      showErrorToast(t("settings.language_change_error"));
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme: ThemeType) => {
    try {
      setTheme(newTheme);
      setStoredTheme(newTheme);
      showSuccessToast(t("settings.theme_changed"));
    } catch (error) {
      console.error("Theme change error:", error);
      showErrorToast(t("settings.theme_change_error"));
    }
  };

  // Handle app mode change (fuel vs warehouse)
  const handleAppModeChange = (mode: AppModeType) => {
    try {
      setAppMode(mode);
      showSuccessToast(
        t(
          mode === "warehouse"
            ? "settings.mode_warehouse_enabled"
            : "settings.mode_fuel_enabled",
          mode === "warehouse" ? "Склад включен" : "Топливо включено"
        )
      );

      // Keep URL and UI mode consistent.
      if (mode === "warehouse") {
        if (!window.location.pathname.startsWith("/warehouse")) {
          navigate(pathKeys.warehouse());
        }
      } else {
        if (window.location.pathname.startsWith("/warehouse")) {
          navigate(pathKeys.home());
        }
      }
    } catch (error) {
      console.error("App mode change error:", error);
      showErrorToast(t("settings.mode_change_error", "Не удалось сменить режим"));
    }
  };

  // Handle printer width change
  const handleOrderPrinterWidthChange = (width: PrinterWidthType) => {
    try {
      // update new setting; keep legacy in sync via store
      setOrderPrinterWidth(width);
      showSuccessToast(t("settings.printer_changed"));
    } catch (error) {
      console.error("Printer change error:", error);
      showErrorToast(t("settings.printer_change_error"));
    }
  };

  const handleLabelPrinterWidthChange = (width: PrinterWidthType) => {
    try {
      setLabelPrinterWidth(width);
      showSuccessToast(t("settings.printer_changed"));
    } catch (error) {
      console.error("Label printer width change error:", error);
      showErrorToast(t("settings.printer_change_error"));
    }
  };

  // Fetch available printers
  const fetchPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const response = await invoke<{
        error: { message: string } | null;
        result: { data: string[] } | null;
      }>("get_printers");

      if (response.error) {
        showErrorToast(
          t("settings.printer_fetch_error", "Failed to fetch printers: ") +
          response.error.message
        );
        return;
      }

      if (response.result?.data) {
        setAvailablePrinters(response.result.data);
        showSuccessToast(
          t("settings.printers_loaded", {
            count: response.result.data.length,
            defaultValue: `Found ${response.result.data.length} printer(s)`,
          })
        );
      }
    } catch (error: any) {
      console.error("Failed to fetch printers:", error);
      showErrorToast(
        t("settings.printer_fetch_error", "Failed to fetch printers")
      );
    } finally {
      setLoadingPrinters(false);
    }
  };

  // Handle label printer change
  const handleLabelPrinterChange = (printerName: string) => {
    try {
      setLabelPrinterName(printerName);
      showSuccessToast(
        t("settings.label_printer_set", `Label printer set to: ${printerName}`)
      );
    } catch (error) {
      console.error("Label printer change error:", error);
      showErrorToast(t("settings.label_printer_error"));
    }
  };

  // Handle order receipt printer change
  const handleOrderPrinterChange = (printerName: string) => {
    try {
      setOrderPrinterName(printerName);
      showSuccessToast(
        t(
          "settings.order_printer_set",
          `Order printer set to: ${printerName}`
        )
      );
    } catch (error) {
      console.error("Order printer change error:", error);
      showErrorToast(t("settings.order_printer_error"));
    }
  };

  // Load printers on component mount
  useEffect(() => {
    fetchPrinters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved settings
  useEffect(() => {
    // Ensure UI language matches saved preference
    if (data.lang && i18n.language !== data.lang) {
      i18n.changeLanguage(data.lang).catch(error => {
        console.error("Failed to load language:", error);
        showErrorToast(t("settings.language_load_error"));
      });
    }
  }, [data.lang, i18n, t, showErrorToast]);

  // Load device config on mount
  useEffect(() => {
    fetchDeviceConfig().catch(error => {
      console.error("Failed to load device config:", error);
    });
  }, [fetchDeviceConfig]);

  // Update form when device config is loaded
  useEffect(() => {
    if (deviceConfig) {
      setDeviceConfigForm({
        company_name: deviceConfig.company_name || "",
        company_address: deviceConfig.company_address || "",
        company_tax_code: deviceConfig.company_tax_code || "",
        company_phone: deviceConfig.company_phone || "",
        company_email: deviceConfig.company_email || "",
        company_website: deviceConfig.company_website || "",
        receipt_footer: deviceConfig.receipt_footer || "",
        receipt_template_58mm: deviceConfig.receipt_template_58mm || "58mm",
        receipt_template_80mm: deviceConfig.receipt_template_80mm || "80mm",
        label_template: (deviceConfig as any).label_template || "",
        qr_code_url: deviceConfig.qr_code_url || "",
        logo_path: deviceConfig.logo_path || "",
      });
    }
  }, [deviceConfig]);

  // Handle device config save
  const handleSaveDeviceConfig = async () => {
    if (!deviceConfig) {
      showErrorToast(t("settings.device_config_not_loaded"));
      return;
    }

    try {
      // Merge form data with existing device config
      const updatedConfig = {
        ...deviceConfig,
        company_name: deviceConfigForm.company_name || null,
        company_address: deviceConfigForm.company_address || null,
        company_tax_code: deviceConfigForm.company_tax_code || null,
        company_phone: deviceConfigForm.company_phone || null,
        company_email: deviceConfigForm.company_email || null,
        company_website: deviceConfigForm.company_website || null,
        receipt_footer: deviceConfigForm.receipt_footer || null,
        receipt_template_58mm: deviceConfigForm.receipt_template_58mm || null,
        receipt_template_80mm: deviceConfigForm.receipt_template_80mm || null,
        label_template: (deviceConfigForm.label_template as any) || null,
        qr_code_url: deviceConfigForm.qr_code_url || null,
        logo_path: deviceConfigForm.logo_path || null,
      };

      await updateDeviceConfig(updatedConfig);
      showSuccessToast(t("settings.device_config_saved"));
    } catch (error) {
      console.error("Failed to save device config:", error);
      showErrorToast(t("settings.device_config_save_error"));
    }
  };

  // Handle reset templates to default
  const handleResetTemplates = async () => {
    try {
      const [template58mm, template80mm] = await invoke<[string, string]>(
        "get_default_receipt_templates"
      );

      const labelTemplate = await invoke<string>("get_default_label_template");

      setDeviceConfigForm({
        ...deviceConfigForm,
        receipt_template_58mm: template58mm,
        receipt_template_80mm: template80mm,
        label_template: labelTemplate,
      });

      showSuccessToast(t("settings.templates_reset"));
    } catch (error) {
      console.error("Failed to load default templates:", error);
      showErrorToast(t("settings.templates_reset_error"));
    }
  };

  // Handle logo file picker
  const handleSelectLogoFile = async () => {
    try {
      const selected = await open({
        filters: [
          {
            name: "Image",
            extensions: ["png", "jpg", "jpeg", "bmp"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setDeviceConfigForm({
          ...deviceConfigForm,
          logo_path: selected,
        });
        showSuccessToast(
          t("settings.logo_file_selected", "Logo file selected")
        );
      }
    } catch (error) {
      console.error("Failed to select logo file:", error);
      showErrorToast(t("settings.logo_file_select_error"));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("menu.settings.settings")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("settings.customize_your_experience")}
          </p>
        </div>

        <Card className="overflow-hidden border-muted/60 shadow-sm">
          <CardHeader className="hidden" />

          <CardContent className="p-0">
            <Tabs defaultValue="general" className="w-full">
              <div className="border-b bg-muted/30 px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  {/* SCROLL CONTAINER */}
                  <div className="w-full overflow-x-auto scrollbar-tabs-auto scroll-smooth">

                    <TabsList
                      className="
                        flex
                        w-max
                        min-w-full
                        gap-1
                        whitespace-nowrap
                      "
                    >
                      <TabsTrigger value="general" className="flex items-center gap-2">
                        <Palette className="h-4 w-4 shrink-0" />
                        {t("settings.general")}
                      </TabsTrigger>

                      {canEditDeviceConfig && (
                        <TabsTrigger value="device" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0" />
                          {t("settings.device_config")}
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                      <div className="min-w-0 text-xs text-muted-foreground">
                        {t("settings.language", "Language")}:{" "}
                        <span className="font-medium text-foreground">
                          {data.lang?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 text-xs text-muted-foreground">
                        {t("settings.theme", "Theme")}:{" "}
                        <span className="font-medium text-foreground">{theme}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <TabsContent value="general" className="p-4 sm:p-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Language Settings */}
                  <Card className="border-muted/60 shadow-none">
                    <CardHeader className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-4 w-4 text-primary" />
                        {t("settings.language")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t("settings.language_description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />
                      <RadioGroup
                        value={data.lang}
                        onValueChange={value =>
                          handleLanguageChange(value as LangType)
                        }
                        className="grid gap-2"
                      >
                        {languageOptions.map(option => (
                          <Label
                            key={option.value}
                            htmlFor={`lang-${option.value}`}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-muted/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem
                                value={option.value}
                                id={`lang-${option.value}`}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{option.flag}</span>
                                <span className="text-sm font-medium">
                                  {option.label}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {option.value.toUpperCase()}
                            </span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Theme Settings */}
                  <Card className="border-muted/60 shadow-none">
                    <CardHeader className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Palette className="h-4 w-4 text-primary" />
                        {t("settings.theme")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t("settings.theme_description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />
                      <RadioGroup
                        value={theme}
                        onValueChange={value =>
                          handleThemeChange(value as ThemeType)
                        }
                        className="grid gap-2"
                      >
                        {themeOptions.map(option => (
                          <Label
                            key={option.value}
                            htmlFor={`theme-${option.value}`}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-muted/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem
                                value={option.value}
                                id={`theme-${option.value}`}
                              />
                              <div className="flex items-center gap-2">
                                {option.icon}
                                <span className="text-sm font-medium">
                                  {option.label}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {option.value}
                            </span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* App Mode Settings */}
                  <Card className="border-muted/60 shadow-none">
                    <CardHeader className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Boxes className="h-4 w-4 text-primary" />
                        {t("settings.app_mode", "Режим приложения")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t(
                          "settings.app_mode_description",
                          "Переключает интерфейс (включая боковое меню) между режимами топливо/склад"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />
                      <RadioGroup
                        value={(data.appMode ?? "fuel") as AppModeType}
                        onValueChange={value =>
                          handleAppModeChange(value as AppModeType)
                        }
                        className="grid gap-2"
                      >
                        <Label
                          htmlFor="app-mode-fuel"
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-muted/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="fuel" id="app-mode-fuel" />
                            <div className="flex items-center gap-2">
                              <Fuel className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {t("settings.mode_fuel", "Топливо")}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            fuel
                          </span>
                        </Label>

                        <Label
                          htmlFor="app-mode-warehouse"
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-muted/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="warehouse"
                              id="app-mode-warehouse"
                            />
                            <div className="flex items-center gap-2">
                              <Boxes className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {t("settings.mode_warehouse", "Склад")}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            warehouse
                          </span>
                        </Label>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Printer Settings */}
                  <Card className="border-muted/60 shadow-none lg:col-span-2">
                    <CardHeader className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Printer className="h-4 w-4 text-primary" />
                        {t("settings.printer", "Printer")}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t("settings.printer_description")}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <Separator className="mb-5" />

                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              {t("settings.label_printer", "Label Printer")} {" "}
                              {t("settings.printer_width", "Paper width")}
                            </Label>
                            <RadioGroup
                              value={data.labelPrinterWidth ?? "58mm"}
                              onValueChange={handleLabelPrinterWidthChange}
                              className="grid gap-2"
                            >
                              {printerOptions.map(option => (
                                <Label
                                  key={`label-${option.value}`}
                                  htmlFor={`label-printer-${option.value}`}
                                  className="flex cursor-pointer items-center justify-between rounded-lg border border-muted/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                                >
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem
                                      value={option.value}
                                      id={`label-printer-${option.value}`}
                                    />
                                    <div className="flex items-center gap-2">
                                      {option.icon}
                                      <span className="text-sm font-medium">
                                        {option.label}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {option.value}
                                  </span>
                                </Label>
                              ))}
                            </RadioGroup>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              {t("settings.order_printer", "Order printer")} {" "}
                              {t("settings.printer_width", "Paper width")}
                            </Label>
                            <RadioGroup
                              value={data.orderPrinterWidth ?? data.printerWidth ?? "80mm"}
                              onValueChange={handleOrderPrinterWidthChange}
                              className="grid gap-2"
                            >
                              {printerOptions.map(option => (
                                <Label
                                  key={option.value}
                                  htmlFor={`printer-${option.value}`}
                                  className="flex cursor-pointer items-center justify-between rounded-lg border border-muted/60 bg-background px-3 py-2 transition-colors hover:bg-muted/40"
                                >
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem
                                      value={option.value}
                                      id={`printer-${option.value}`}
                                    />
                                    <div className="flex items-center gap-2">
                                      {option.icon}
                                      <span className="text-sm font-medium">
                                        {option.label}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {option.value}
                                  </span>
                                </Label>
                              ))}
                            </RadioGroup>
                          </div>



                          <div className="rounded-lg border border-muted/60 bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <Label
                                  htmlFor="print-on-close"
                                  className="cursor-pointer text-sm"
                                >
                                  {t("settings.print_on_close_order")}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {t(
                                    "settings.print_on_close_order_hint",
                                    "Automatically print when closing an order."
                                  )}
                                </p>
                              </div>
                              <Switch
                                id="print-on-close"
                                checked={data.printOnCloseOrder ?? false}
                                onCheckedChange={(checked: boolean) => {
                                  setPrintOnCloseOrder(checked);
                                  showSuccessToast(
                                    checked
                                      ? t("settings.print_on_close_enabled")
                                      : t("settings.print_on_close_disabled")
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="label-printer">
                              {t("settings.label_printer", "Label Printer")}
                            </Label>
                            <div className="flex gap-2">
                              <Select
                                value={data.labelPrinterName || ""}
                                onValueChange={handleLabelPrinterChange}
                                disabled={loadingPrinters}
                              >
                                <SelectTrigger
                                  id="label-printer"
                                  className="flex-1"
                                >
                                  <SelectValue
                                    placeholder={
                                      loadingPrinters
                                        ? t(
                                          "settings.loading_printers",
                                          "Loading..."
                                        )
                                        : t(
                                          "settings.select_label_printer",
                                          "Select label printer"
                                        )
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {availablePrinters.map(printer => (
                                    <SelectItem key={printer} value={printer}>
                                      {printer}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={fetchPrinters}
                                disabled={loadingPrinters}
                                title={t(
                                  "settings.refresh_printers",
                                  "Refresh printers"
                                )}
                              >
                                <RotateCcw
                                  className={`h-4 w-4 ${loadingPrinters ? "animate-spin" : ""
                                    }`}
                                />
                              </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {t(
                                "settings.label_printer_description",
                                "Select a dedicated printer for printing product labels. Supports both Bluetooth and wired printers."
                              )}
                            </p>

                            {data.labelPrinterName && (
                              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                {t("settings.current_label_printer", "Current:")}{" "}
                                <span className="font-medium">
                                  {data.labelPrinterName}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="order-printer">
                              {t(
                                "settings.order_printer",
                                "Order Receipt Printer"
                              )}
                            </Label>
                            <div className="flex gap-2">
                              <Select
                                value={data.orderPrinterName || data.printerName || ""}
                                onValueChange={handleOrderPrinterChange}
                                disabled={loadingPrinters}
                              >
                                <SelectTrigger id="order-printer" className="flex-1">
                                  <SelectValue
                                    placeholder={
                                      loadingPrinters
                                        ? t(
                                          "settings.loading_printers",
                                          "Loading..."
                                        )
                                        : t(
                                          "settings.select_order_printer",
                                          "Select order printer"
                                        )
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {availablePrinters.map(printer => (
                                    <SelectItem key={printer} value={printer}>
                                      {printer}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={fetchPrinters}
                                disabled={loadingPrinters}
                                title={t(
                                  "settings.refresh_printers",
                                  "Refresh printers"
                                )}
                              >
                                <RotateCcw
                                  className={`h-4 w-4 ${loadingPrinters ? "animate-spin" : ""
                                    }`}
                                />
                              </Button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {t(
                                "settings.order_printer_description",
                                "Select a dedicated printer for printing order receipts."
                              )}
                            </p>

                            {(data.orderPrinterName || data.printerName) && (
                              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                {t("settings.current_order_printer", "Current:")}{" "}
                                <span className="font-medium">
                                  {data.orderPrinterName || data.printerName}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-lg border border-muted/60 bg-background p-3">
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium">
                                {t("settings.test_printer", "Test Printer (Debug)")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "settings.test_printer_hint",
                                  "Open a diagnostic screen to validate your printer configuration."
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => navigate("/test-print")}
                              className="gap-2"
                            >
                              <TestTube className="h-4 w-4" />
                              {t("settings.open", "Open")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {canEditDeviceConfig && (
                <TabsContent value="device" className="p-4 sm:p-6">
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Company Information */}
                    <Card className="border-muted/60 shadow-none lg:col-span-1">
                      <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Building2 className="h-4 w-4 text-primary" />
                          {t("settings.company_info")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {t(
                            "settings.company_info_hint",
                            "These details appear on receipts and QR verification."
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />

                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="company_name">
                              {t("settings.company_name", "Company Name")}
                            </Label>
                            <Input
                              id="company_name"
                              value={deviceConfigForm.company_name}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  company_name: e.target.value,
                                })
                              }
                              placeholder={t(
                                "settings.company_name_placeholder",
                                "Sklad Uchot"
                              )}
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_address">
                              {t("settings.company_address", "Company Address")}
                            </Label>
                            <Input
                              id="company_address"
                              value={deviceConfigForm.company_address}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  company_address: e.target.value,
                                })
                              }
                              placeholder={t(
                                "settings.company_address_placeholder",
                                "Tashkent, ..."
                              )}
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_tax_code">
                              {t("settings.company_tax_code", "Tax Code (INN)")}
                            </Label>
                            <Input
                              id="company_tax_code"
                              value={deviceConfigForm.company_tax_code}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  company_tax_code: e.target.value,
                                })
                              }
                              placeholder="123456789"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_phone">
                              {t("settings.company_phone")}
                            </Label>
                            <Input
                              id="company_phone"
                              value={deviceConfigForm.company_phone}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  company_phone: e.target.value,
                                })
                              }
                              placeholder="+998 XX XXX XX XX"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_email">
                              {t("settings.company_email")}
                            </Label>
                            <Input
                              id="company_email"
                              type="email"
                              value={deviceConfigForm.company_email}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  company_email: e.target.value,
                                })
                              }
                              placeholder="info@company.com"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company_website">
                              {t("settings.company_website")}
                            </Label>
                            <Input
                              id="company_website"
                              type="url"
                              value={deviceConfigForm.company_website}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  company_website: e.target.value,
                                })
                              }
                              placeholder="https://company.com"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="logo_path">
                              {t("settings.logo_path", "Receipt Logo Path")}
                            </Label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                id="logo_path"
                                type="text"
                                value={deviceConfigForm.logo_path}
                                onChange={e =>
                                  setDeviceConfigForm({
                                    ...deviceConfigForm,
                                    logo_path: e.target.value,
                                  })
                                }
                                placeholder="/path/to/logo.png"
                                disabled={isLoading}
                                className="min-w-0 flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleSelectLogoFile}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                              >
                                <FileImage className="h-4 w-4 mr-2" />
                                <span className="truncate">{t("settings.browse", "Browse")}</span>
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t(
                                "settings.logo_path_description",
                                "Path to logo image file (PNG/JPG) for thermal printer receipts. Leave empty to use company name as text logo."
                              )}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="qr_code_url">
                              {t("settings.qr_code_url")}
                            </Label>
                            <Input
                              id="qr_code_url"
                              type="url"
                              value={deviceConfigForm.qr_code_url}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  qr_code_url: e.target.value,
                                })
                              }
                              placeholder="https://verify.company.com"
                              disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                              {t("settings.qr_code_description")}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="receipt_footer">
                              {t("settings.receipt_footer")}
                            </Label>
                            <Textarea
                              id="receipt_footer"
                              value={deviceConfigForm.receipt_footer}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  receipt_footer: e.target.value,
                                })
                              }
                              placeholder="Thank you for your purchase!"
                              rows={3}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Receipt Templates */}
                    <Card className="border-muted/60 shadow-none lg:col-span-2">
                      <CardHeader className="space-y-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Printer className="h-4 w-4 text-primary" />
                              {t("settings.receipt_templates")}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {t(
                                "settings.template_placeholder_hint",
                                "Use placeholders to inject order and company data."
                              )}
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetTemplates}
                            disabled={isLoading}
                            className="w-full sm:w-auto shrink-0"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            <span className="truncate">{t("settings.reset_to_default")}</span>
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <Separator className="mb-4" />

                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="receipt_template_58mm">
                              {t("settings.receipt_template_58mm")}
                            </Label>
                            <Textarea
                              id="receipt_template_58mm"
                              value={deviceConfigForm.receipt_template_58mm}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  receipt_template_58mm: e.target.value,
                                })
                              }
                              rows={14}
                              className="font-mono text-xs"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="receipt_template_80mm">
                              {t("settings.receipt_template_80mm")}
                            </Label>
                            <Textarea
                              id="receipt_template_80mm"
                              value={deviceConfigForm.receipt_template_80mm}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  receipt_template_80mm: e.target.value,
                                })
                              }
                              rows={14}
                              className="font-mono text-xs"
                              disabled={isLoading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="label_template">
                              {t("settings.label_template", "Label Template")}
                            </Label>
                            <Textarea
                              id="label_template"
                              value={deviceConfigForm.label_template}
                              onChange={e =>
                                setDeviceConfigForm({
                                  ...deviceConfigForm,
                                  label_template: e.target.value,
                                })
                              }
                              rows={10}
                              className="font-mono text-xs"
                              disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                              {t(
                                "settings.label_template_hint",
                                "Template for printing product labels (use placeholders like {{product_name}}, {{barcode}}, {{price}})."
                              )}
                            </p>
                          </div>

                          {/* Save Button */}
                          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end pt-2">
                            <div className="min-w-0 text-xs text-muted-foreground sm:mr-auto">
                              {t(
                                "settings.save_hint",
                                "Changes apply to this device configuration."
                              )}
                            </div>
                            <Button
                              onClick={handleSaveDeviceConfig}
                              disabled={isLoading}
                              className="w-full sm:w-auto sm:min-w-[140px]"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              <span className="truncate">{t("settings.save")}</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
