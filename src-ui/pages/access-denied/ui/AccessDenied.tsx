import { Button } from "@/shared/ui/shadcn/button";
import { pathKeys } from "@/shared/lib/react-router";
import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";

export function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
      <ShieldX className="h-24 w-24 text-muted-foreground" />
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Доступ запрещен</h1>
        <p className="text-muted-foreground">
          У вас нет прав доступа к этой странице.
        </p>
      </div>
      <Button onClick={() => navigate(pathKeys.home())}>
        Вернуться на главную
      </Button>
    </div>
  );
}