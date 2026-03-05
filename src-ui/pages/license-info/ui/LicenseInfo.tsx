import { LicenseApi, LicenseInfo as LicenseInfoType } from "@/shared/api/license-api";
import useToast from "@/shared/hooks/use-toast";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  ArrowLeft,
  Calendar,
  Copy,
  Monitor,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function LicenseInfoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfoType | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLicenseInfo = async () => {
    try {
      setLoading(true);
      const info = await LicenseApi.getLicenseInfo();
      setLicenseInfo(info);
    } catch (error) {
      console.error("Failed to load license info:", error);
      showErrorToast(
        t("license.error_loading") || "Failed to load license information"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessToast(`${label} ${t("license.copied") || "copied to clipboard"}`);
    } catch (error) {
      showErrorToast(t("license.copy_failed") || "Failed to copy");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {t("license.title") || "License Information"}
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!licenseInfo) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {t("license.title") || "License Information"}
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {t("license.not_found") || "No license information available"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {t("license.title") || "License Information"}
          </h1>
        </div>
        <Button onClick={loadLicenseInfo} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("license.refresh") || "Refresh"}
        </Button>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("license.machine_info") || "Machine Information"}
              </CardTitle>
              <CardDescription>
                {t("license.license_details") || "License Details"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Machine ID */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {t("license.machine_id") || "Machine ID"}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  {licenseInfo.machine_id}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(licenseInfo.machine_id, t("license.machine_id") || "Machine ID")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Offline Runs */}
          {licenseInfo.offline_run_count !== undefined && licenseInfo.max_offline_runs !== undefined && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">
                {t("license.offline_runs") || "Offline Runs"}
              </p>
              <p className="text-2xl font-bold">
                {licenseInfo.offline_run_count} / {licenseInfo.max_offline_runs}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("license.offline_runs_description") || "Number of offline runs used"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("license.license_status") || "Статус лицензии"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* License Type */}
          {licenseInfo.license_type && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t("license.type") || "Тип лицензии"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {licenseInfo.license_type}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Issued To */}
          {licenseInfo.issued_to && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t("license.issued_to") || "Выдано"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {licenseInfo.issued_to}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expiry Date & Days Remaining */}
          {licenseInfo.expiry_date && (
            <div className={`p-3 rounded-lg border ${
              licenseInfo.days_remaining !== undefined && licenseInfo.days_remaining !== null
                ? licenseInfo.days_remaining <= 3
                  ? "bg-red-500/10 border-red-500/30"
                  : licenseInfo.days_remaining <= 10
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-green-500/10 border-green-500/30"
                : "bg-muted"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <p className="text-sm font-medium">
                  {t("license.expiry") || "Срок действия"}
                </p>
              </div>
              <p className="text-lg font-semibold">
                {new Date(licenseInfo.expiry_date).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {licenseInfo.days_remaining !== undefined && licenseInfo.days_remaining !== null && (
                <div className="flex items-center gap-1.5 mt-1">
                  {licenseInfo.days_remaining <= 0 ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {t("license.expired_label") || "Лицензия истекла"}
                      </p>
                    </>
                  ) : licenseInfo.days_remaining <= 10 ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        {t("license.days_remaining", {
                          count: licenseInfo.days_remaining,
                          defaultValue: `Осталось ${licenseInfo.days_remaining} дн.`,
                        })}
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {t("license.days_remaining", {
                          count: licenseInfo.days_remaining,
                          defaultValue: `Осталось ${licenseInfo.days_remaining} дн.`,
                        })}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No expiry = Perpetual */}
          {!licenseInfo.expiry_date && licenseInfo.license_type && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t("license.perpetual") || "Бессрочная лицензия"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
