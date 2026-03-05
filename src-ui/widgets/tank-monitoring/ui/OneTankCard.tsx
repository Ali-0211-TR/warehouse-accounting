import { TankEntity } from "@/shared/bindings/TankEntity";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  Fuel,
  Signal,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Enhanced circular gauge component with better animations and colors
const CircularGauge = ({
  value = 0,
  max = 100,
  unit = "L",
  showSecondary = false,
  secondaryValue = 0,
}: {
  value?: number;
  max?: number;
  unit?: string;
  showSecondary?: boolean;
  secondaryValue?: number;
  t: (key: string) => string;
}) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const secondaryPercentage = showSecondary
    ? Math.min(Math.round((secondaryValue / max) * 100), 100)
    : 0;

  const getColor = (pct = percentage) => {
    if (pct > 75) return "text-green-600";
    if (pct > 50) return "text-blue-600";
    if (pct > 25) return "text-amber-600";
    return "text-red-600";
  };

  const getStrokeColor = (pct = percentage) => {
    if (pct > 75) return "stroke-green-500";
    if (pct > 50) return "stroke-blue-500";
    if (pct > 25) return "stroke-amber-500";
    return "stroke-red-500";
  };

  const getBackgroundColor = () => {
    if (percentage > 75) return "stroke-green-100";
    if (percentage > 50) return "stroke-blue-100";
    if (percentage > 25) return "stroke-amber-100";
    return "stroke-red-100";
  };

  // Calculate the circumference
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const secondaryStrokeDashoffset = showSecondary
    ? circumference - (secondaryPercentage / 100) * circumference
    : circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="w-full h-full -rotate-90 filter drop-shadow-lg">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          strokeWidth="10"
          className={`${getBackgroundColor()} fill-none`}
        />
        {/* Secondary value circle (if showing dual) */}
        {showSecondary && (
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="6"
            className={`fill-none ${getStrokeColor(
              secondaryPercentage
            )} opacity-40`}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={secondaryStrokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}
        {/* Primary value circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          strokeWidth="10"
          className={`fill-none ${getStrokeColor()}`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-neutral-900 rounded-full m-6 shadow-lg">
        <div className="text-center">
          <span className={`text-2xl font-bold ${getColor()}`}>
            {percentage}%
          </span>
          <div className="text-xs text-gray-600 mt-1 font-medium">
            {value.toLocaleString()} {unit}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            / {max.toLocaleString()} {unit}
          </div>
          {showSecondary && (
            <div className="text-xs text-gray-400 mt-1 border-t border-gray-200 pt-1">
              Alt: {secondaryPercentage}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Status indicator component
const StatusIndicator = ({ isOnline = false }) => {
  const { t } = useTranslation();

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-700">
        <div className="relative">
          <Signal className="h-4 w-4 text-green-600 dark:text-green-300" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm text-green-700 dark:text-green-200 font-medium">
          {t("tank.status_list.online")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-700">
      <WifiOff className="h-4 w-4 text-red-600 dark:text-red-300" />
      <span className="text-sm text-red-700 dark:text-red-200 font-medium">
        {t("tank.status_list.offline")}
      </span>
    </div>
  );
};

// Tank level warning component
const TankLevelWarning = ({ percentage }: { percentage: number }) => {
  const { t } = useTranslation();

  if (percentage <= 10) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-700 shadow-sm">
        <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-800 dark:text-red-200">
            {t("tank.monitoring.tank_level_warning.critical")}
          </div>
          <div className="text-xs text-red-600 dark:text-red-300 mt-1">
            {t("tank.monitoring.tank_level_warning.critical_message")}
          </div>
        </div>
      </div>
    );
  }

  if (percentage <= 25) {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-700 shadow-sm">
        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {t("tank.monitoring.tank_level_warning.low")}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-300 mt-1">
            {t("tank.monitoring.tank_level_warning.low_message")}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const OneTank = ({ tank }: { tank: TankEntity }) => {
  const { t } = useTranslation();

  // Tank balance from sensors (physical measurement)
  const sensorLevel = tank.balance || 0;
  // Product balance (calculated/theoretical from product entity)
  const productLevel = tank.product?.balance || 0;
  const maxLevel = tank.volume_max || 100;

  // Use sensor data if available, otherwise fallback to product balance
  const primaryLevel = sensorLevel > 0 ? sensorLevel : productLevel;
  const percentage = Math.round((primaryLevel / maxLevel) * 100);

  // Check if we have sensor data
  const hasSensorData = sensorLevel > 0;

  // Calculate difference between sensor and product balance
  const balanceDifference = Math.abs(sensorLevel - productLevel);
  const hasSignificantDifference =
    hasSensorData && productLevel > 0 && balanceDifference > maxLevel * 0.02; // 2% threshold

  // Mock connection status - in real app this would come from tank data
  // Use tank ID hash to create a stable "random" value
  const isOnline = tank.id ? tank.id.length % 10 > 2 : true; // 70% chance of being online

  // Calculate capacity utilization
  const getCapacityStatus = () => {
    if (percentage > 75)
      return { variant: "default" as const, label: "Optimal" };
    if (percentage > 50)
      return { variant: "secondary" as const, label: "Good" };
    if (percentage > 25) return { variant: "outline" as const, label: "Low" };
    return { variant: "destructive" as const, label: "Critical" };
  };

  const capacityStatus = getCapacityStatus();

  return (
    <Card className="h-full overflow-hidden bg-white dark:bg-neutral-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
      <CardHeader className="py-2 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Database className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <span className="text-gray-900 dark:text-gray-100">{tank.name}</span>
          </CardTitle>
          <StatusIndicator isOnline={isOnline} />
        </div>
        <div className="flex items-center gap-2 text-sm  mt-2">
          <Fuel className="h-4 w-4" />
          <span className="font-medium">
            {tank.product?.name || t("common.not_assigned")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col space-y-2">
          {/* Gauge Section */}
          <div className="flex justify-center items-center">
            <CircularGauge
              value={primaryLevel}
              max={maxLevel}
              unit="L"
              showSecondary={
                hasSensorData &&
                productLevel > 0 &&
                Math.abs(sensorLevel - productLevel) > 0
              }
              secondaryValue={hasSensorData ? productLevel : 0}
              t={t}
            />
          </div>

          {/* Gauge Legend for dual display */}
          {hasSensorData &&
            productLevel > 0 &&
            Math.abs(sensorLevel - productLevel) > 0 && (
              <div className="flex justify-center space-x-4 text-xs ">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 bg-blue-500 rounded"></div>
                  <span>{t("tank.sensor_level")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 bg-blue-300 rounded"></div>
                  <span>{t("tank.product_level")}</span>
                </div>
              </div>
            )}

          {/* Tank Level Warning */}
          <TankLevelWarning percentage={percentage} />

          {/* Balance Display Section */}
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 space-y-4">
            {/* Dual Balance Display */}
            <div className="grid grid-cols-2 gap-4">
              {/* Sensor Balance */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Signal className="h-3 w-3 " />
                  <div className="text-xs font-medium  dark: uppercase tracking-wider">
                    {t("tank.sensor_level")}
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    hasSensorData ? "text-blue-700" : "text-gray-400"
                  }`}
                >
                  {hasSensorData
                    ? `${sensorLevel.toLocaleString()} L`
                    : t("tank.no_data")}
                </div>
                {hasSensorData && (
                  <div className="text-xs ">
                    {Math.round((sensorLevel / maxLevel) * 100)}%{" "}
                    {t("tank.of_capacity")}
                  </div>
                )}
              </div>

              {/* Product Balance */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3 w-3 text-green-600" />
                  <div className="text-xs font-medium  dark: uppercase tracking-wider">
                    {t("tank.product_level")}
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    productLevel > 0 ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {productLevel > 0
                    ? `${productLevel.toLocaleString()} L`
                    : t("tank.no_data")}
                </div>
                {productLevel > 0 && (
                  <div className="text-xs text-gray-500">
                    {Math.round((productLevel / maxLevel) * 100)}%{" "}
                    {t("tank.of_capacity")}
                  </div>
                )}
              </div>
            </div>

            {/* Difference Warning */}
            {hasSignificantDifference && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-700">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t("tank.monitoring.balance_discrepancy.title")}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {t("tank.monitoring.balance_discrepancy.message", {
                      sensorLevel: sensorLevel.toLocaleString(),
                      productLevel: productLevel.toLocaleString(),
                      difference: balanceDifference.toLocaleString(),
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tank Capacity */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="text-xs font-medium  uppercase tracking-wider">
                {t("tank.capacity")}
              </div>
              <div className="text-xl font-bold ">
                {maxLevel.toLocaleString()} L
              </div>
            </div>

            {/* Status Badges with improved styling */}
            <div className="flex flex-wrap gap-3">
              <Badge
                variant={capacityStatus.variant}
                className="px-3 py-1 text-xs font-semibold rounded-full"
              >
                {t(`tank.capacity_status.${capacityStatus.label.toLowerCase()}`)}
              </Badge>

              {tank.protocol && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border-gray-300 dark:border-gray-600"
                >
                  <Activity className="h-3 w-3" />
                  {tank.protocol}
                </Badge>
              )}

              {tank.address && (
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs font-medium rounded-full border-gray-300 dark:border-gray-600"
                >
                  ID: {tank.address}
                </Badge>
              )}
            </div>

            {/* Connection Details with improved styling */}
            {(tank.server_address || tank.port_name) && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-2">
                  {tank.server_address && (
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3 w-3" />
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {tank.server_address}:{tank.server_port}
                      </span>
                    </div>
                  )}
                  {tank.port_name && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3" />
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {tank.port_name} @ {tank.port_speed}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OneTank;
