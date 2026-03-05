import { t } from "i18next";
import { toast } from "sonner";
import { create } from "zustand";

interface GlobalToastState {
  showErrorToast: (message: string) => void;
  showSuccessToast: (message: string) => void;
  showErrorWithAction: (
    message: string,
    actionLabel: string,
    onAction: () => void
  ) => void;
}

export const useToast = create<GlobalToastState>(() => ({
  showErrorToast: (message: string) => {
    toast.error(t("title.error"), {
      description: t(message),
      position: 'top-right',
      duration: 3000,
      className: "toast-error",
      action: {
        label: "✕",
        onClick: () => console.log("Undo"),
      },
    });
  },
  showSuccessToast: (message: string) => {
    toast.success(t("title.success"), {
      description: t(message),
      position: 'top-right',
      duration: 3000,
      className: "toast-success",
      action: {
        label: "✕",
        onClick: () => console.log("Close"),
      },
    });
  },
  showErrorWithAction: (
    message: string,
    actionLabel: string,
    onAction: () => void
  ) => {
    toast.error(t("title.error"), {
      description: t(message),
      position: 'top-right',
      duration: 3000, // Longer duration for action toasts
      className: "toast-error",
      action: {
        label: actionLabel,
        onClick: onAction,
      },
    });
  },
}));

export default useToast;
