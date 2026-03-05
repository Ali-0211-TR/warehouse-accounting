import { useTankStore } from "@/entities/tank";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { Label } from "@/shared/ui/shadcn/label";
import { Switch } from "@/shared/ui/shadcn/switch";
import { Droplets, RefreshCw, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import OneTank from "./OneTankCard";

export function TankMonitoringList() {
  const { t } = useTranslation();
  const { tanks, loadTanks } = useTankStore();

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadTanks();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load tanks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadTanks]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(handleRefresh, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, handleRefresh]);

  const filteredTanks = tanks.filter((tank) => {
    const matchesSearch =
      tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tank.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const currentLevel = tank.product?.balance || 0;
    const maxLevel = tank.volume_max || 100;
    const percentage = Math.round((currentLevel / maxLevel) * 100);

    let matchesLevel = true;
    if (levelFilter === "critical") matchesLevel = percentage <= 10;
    else if (levelFilter === "low") matchesLevel = percentage <= 25;
    else if (levelFilter === "good")
      matchesLevel = percentage > 25 && percentage <= 75;
    else if (levelFilter === "optimal") matchesLevel = percentage > 75;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("menu.main.tanks")}
          </h1>
          <p className="text-muted-foreground">
            {t("tank.level_monitoring")} – {filteredTanks.length}
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          {/* Auto refresh */}
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm flex items-center">
              <Timer className="h-4 w-4 mr-1" />
              {t("tank.monitoring.auto_refresh")}
            </Label>
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              {t("tank.monitoring.last_updated")}:{" "}
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          {/* Refresh button */}
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? t("common.loading") : t("tank.monitoring.refresh")}
          </Button>
        </div>
      </div>

      {/* Tank Grid */}
      {filteredTanks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Droplets className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("tank.monitoring.no_tanks_found")}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm || levelFilter !== "all"
                ? t("tank.monitoring.no_tanks_message")
                : t("tank.monitoring.no_tanks_empty")}
            </p>
            {(searchTerm || levelFilter !== "all") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setLevelFilter("all");
                }}
              >
                {t("tank.monitoring.clear_filters")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="responsive-grid">
          {filteredTanks.map((tank, index) => (
            <OneTank key={tank.id || index} tank={tank} />
          ))}
        </div>
      )}
    </div>
  );
}
