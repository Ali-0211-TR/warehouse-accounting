"use client";

import { AlertTriangle, CheckCircle, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Progress } from "@/shared/ui/shadcn/progress";

import type { UpdateInfo, UpdateState } from "@/shared/hooks/use-updater";

interface UpdateProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  state: UpdateState;
  progress: number;
  error?: string;
  updateInfo?: UpdateInfo;
  onConfirmUpdate: () => Promise<void>;
  onCancelUpdate: () => void;
}

export function UpdateProgressDialog({
  isOpen,
  onOpenChange,
  state,
  progress,
  error,
  updateInfo,
  onConfirmUpdate,
  onCancelUpdate,
}: UpdateProgressDialogProps) {
  const { t } = useTranslation();

  const getStateIcon = () => {
    switch (state) {
      case "idle":
        return <Download className="h-6 w-6" />;
      case "checking":
        return <Download className="h-6 w-6 animate-spin" />;
      case "available":
        return <Download className="h-6 w-6 text-blue-500" />;
      case "downloading":
      case "installing":
        return <Download className="h-6 w-6 text-blue-500 animate-pulse" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case "not-available":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Download className="h-6 w-6" />;
    }
  };

  const getStateTitle = () => {
    switch (state) {
      case "idle":
        return t("update.title", "Software Update");
      case "checking":
        return t("update.checking_title", "Checking for Updates");
      case "available":
        return t("update.available_title", "Update Available");
      case "not-available":
        return t("update.not_available_title", "No Updates Available");
      case "downloading":
        return t("update.downloading_title", "Downloading Update");
      case "installing":
        return t("update.installing_title", "Installing Update");
      case "completed":
        return t("update.completed_title", "Update Completed");
      case "error":
        return t("update.error_title", "Update Error");
      default:
        return t("update.title", "Software Update");
    }
  };

  const getStateDescription = () => {
    switch (state) {
      case "idle":
        return t("update.idle_description", "Ready to check for updates.");
      case "checking":
        return t("update.checking_description", "Checking for available updates...");
      case "available":
        return updateInfo
          ? t("update.available_description", "A new version ({{version}}) is available. Would you like to download and install it?", { version: updateInfo.version })
          : t("update.available_description_generic", "A new version is available. Would you like to update?");
      case "not-available":
        return t("update.not_available_description", "You're running the latest version of the application.");
      case "downloading":
        return t("update.downloading_description", "Загрузка версии {{version}}... {{progress}}%", {
          version: updateInfo?.version || "",
          progress: typeof progress === "number" && !isNaN(progress) ? Math.round(Math.max(0, Math.min(100, progress))) : 0,
        });
      case "installing":
        return t("update.installing_description", "Installing the update... The application will restart automatically.");
      case "completed":
        return t("update.completed_description", "Update has been successfully installed. The application will restart now.");
      case "error":
        return (
          error ||
          t("update.error_description", "An error occurred while updating the application.")
        );
      default:
        return "";
    }
  };

  const showProgress = state === "downloading" || state === "installing";
  const showError = state === "error";
  const showActions =
    state === "available" || state === "not-available" || state === "error";
  const showUpdateButton = state === "available";
  const isProcessing =
    state === "checking" || state === "downloading" || state === "installing";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={!isProcessing ? onOpenChange : undefined}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStateIcon()}
            {getStateTitle()}
          </DialogTitle>
          <DialogDescription>{getStateDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Update Info */}
          {state === "available" && updateInfo && (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Version: {updateInfo.version}</div>
                <div className="text-muted-foreground">
                  Released: {updateInfo.date}
                </div>
              </div>

              {updateInfo.body && (
                <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground bg-muted p-3 rounded">
                  <div className="whitespace-pre-wrap">{updateInfo.body}</div>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {showProgress && (
            <div className="space-y-2">
              <Progress value={typeof progress === "number" && !isNaN(progress) ? Math.max(0, Math.min(100, progress)) : 0} className="w-full" />
              <div className="text-xs text-muted-foreground text-center">
                {typeof progress === "number" && !isNaN(progress) ? Math.round(Math.max(0, Math.min(100, progress))) : 0}%
              </div>
            </div>
          )}

          {/* Error Alert */}
          {showError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error ||
                  t(
                    "update.error_generic",
                    "Failed to update the application. Please try again later."
                  )}
              </AlertDescription>
            </Alert>
          )}

          {/* Success for no updates */}
          {state === "not-available" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {t("update.up_to_date", "Your application is up to date.")}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onCancelUpdate}
              className="order-2 sm:order-1"
            >
              {state === "error"
                ? t("common.close", "Close")
                : t("common.cancel", "Cancel")}
            </Button>

            {showUpdateButton && (
              <Button onClick={onConfirmUpdate} className="order-1 sm:order-2">
                <Download className="mr-2 h-4 w-4" />
                {t("update.install_now", "Install Update")}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
