import { Button } from "@/shared/ui/shadcn/button";
import { Printer } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PrintButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PrintButton({
  onClick,
  disabled = false,
  loading = false,
  className,
  variant = "outline",
  size = "sm",
}: PrintButtonProps) {
  const { t } = useTranslation();

  const handleClick = async () => {
    try {
      await onClick();
    } catch (error) {
      console.error('PrintButton error:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
    >
      <Printer className="h-4 w-4 mr-2" />
      {t("common.print", "Печать")}
    </Button>
  );
}
