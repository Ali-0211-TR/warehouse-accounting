// @ts-nocheck
import { useLicenseStore } from "@/shared/stores/license-store";
import { AlertTriangle, X, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { pathKeys } from "@/shared/lib/react-router";

export function LicenseExpiryBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { expiryWarning, dismissed, dismiss } = useLicenseStore();

  if (!expiryWarning || dismissed) {
    return null;
  }

  const { daysRemaining, licenseType } = expiryWarning;

  // Color scheme based on urgency
  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent
    ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
  const iconColor = isUrgent ? "text-red-500" : "text-amber-500";

  const getDaysText = (days: number) => {
    if (days <= 0) return t("license.expires_today", "Лицензия истекает сегодня!");
    if (days === 1) return t("license.expires_tomorrow", "Лицензия истекает завтра!");
    return t("license.expires_in_days", "До истечения лицензии: {{days}} дн.", { days });
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 border-b text-sm ${bgColor}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <span className="font-medium truncate">
          {getDaysText(daysRemaining)}
        </span>
        {licenseType && (
          <span className="text-xs opacity-70 hidden sm:inline">
            ({licenseType})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(pathKeys.licenseInfo())}
          className="flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          <Shield className="h-3 w-3" />
          {t("license.details", "Подробнее")}
        </button>
        <button
          onClick={dismiss}
          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title={t("common.close", "Закрыть")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
