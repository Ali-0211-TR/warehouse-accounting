import type { TankEntity } from "@/entities/tank";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Edit, Trash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface TankListProps {
  tanks: TankEntity[];
  loading: boolean;
  onEdit: (tank: TankEntity) => void;
  onDelete: (tank: TankEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: TankEntity[]) => void;
}

export function TankList({
  tanks,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: TankListProps) {
  const { t } = useTranslation();
  const [deleteTank, setDeleteTank] = useState<TankEntity | null>(null);

  const handleDeleteClick = (tank: TankEntity) => {
    setDeleteTank(tank);
  };

  const handleDeleteConfirm = () => {
    if (deleteTank) {
      onDelete(deleteTank);
      setDeleteTank(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTank(null);
  };

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //     key: 'id',
    //     header: t('tank.id'),
    //     accessor: (tank: TankEntity) => tank.id,
    //     width: 'w-16',
    //     align: 'center' as const
    // },
    {
      key: "name",
      header: t("tank.name"),
      accessor: (tank: TankEntity) => tank.name,
      render: (tank: TankEntity) => tank.name,
    },
    {
      key: "protocol",
      header: t("tank.protocol"),
      accessor: (tank: TankEntity) => tank.protocol,
      width: "w-24",
      render: (tank: TankEntity) =>
        tank.protocol ? (
          <Badge variant="secondary" className="text-xs">
            {t(`lists.tank_protocol.${tank.protocol}`)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.none")}
          </span>
        ),
    },
    {
      key: "address",
      header: t("tank.address"),
      accessor: (tank: TankEntity) => tank.address,
      width: "w-20",
      align: "center" as const,
      render: (tank: TankEntity) =>
        tank.address !== null ? (
          <span className="font-mono">{tank.address}</span>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.none")}
          </span>
        ),
    },
    {
      key: "product_name",
      header: t("tank.product"),
      accessor: (tank: TankEntity) => tank.product?.name || "",
      width: "w-32",
      render: (tank: TankEntity) =>
        tank.product ? (
          <Badge variant="default" className="text-xs">
            {tank.product.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.none")}
          </span>
        ),
    },
    {
      key: "balance",
      header: t("tank.balance"),
      accessor: (tank: TankEntity) => tank.balance,
      width: "w-24",
      align: "right" as const,
      render: (tank: TankEntity) => (
        <span className="font-mono">
          {Number(tank.balance ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: "volume_max",
      header: t("tank.max_volume"),
      accessor: (tank: TankEntity) => tank.volume_max,
      width: "w-24",
      align: "right" as const,
      render: (tank: TankEntity) => (
        <span className="font-mono">
          {Number(tank.volume_max ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: "port_info",
      header: t("tank.port"),
      accessor: (tank: TankEntity) => tank.port_name || "",
      width: "w-24",
      render: (tank: TankEntity) =>
        tank.port_name ? (
          <Badge variant="outline" className="text-xs">
            {tank.port_name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.none")}
          </span>
        ),
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <EntityTable
          data={tanks}
          columns={columns}
          loading={loading}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          emptyMessage={"message.no_data"}
          selectable={selectable}
          onSelectionChange={onSelectionChange}
          pageSize={25}
        />
      </div>

      {/* Small screens: render as cards */}
      <div className="md:hidden space-y-3 p-4">
        {tanks.length === 0 ? (
          <div className="text-muted-foreground p-4">{t("message.no_data")}</div>
        ) : (
          tanks.map((tank: TankEntity) => (
            <div
              key={tank.id}
              className="bg-card border border-input rounded-md p-4 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{tank.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {tank.protocol
                      ? t(`lists.tank_protocol.${tank.protocol}`)
                      : t("common.none")}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onEdit(tank)}
                    aria-label={t("control.edit")}
                    title={t("control.edit")}
                    className="p-1 rounded-md hover:bg-muted"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(tank)}
                    aria-label={t("control.delete")}
                    title={t("control.delete")}
                    className="p-1 rounded-md text-red-600 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">{t("tank.address")}</div>
                  <div className="font-mono">{tank.address ?? t("common.none")}</div>
                </div>

                <div>
                  <div className="text-muted-foreground text-xs">{t("tank.product")}</div>
                  <div>
                    {tank.product ? (
                      <Badge variant="default" className="text-xs">
                        {tank.product.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">{t("common.none")}</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground text-xs">{t("tank.balance")}</div>
                  <div className="font-mono">{Number(tank.balance ?? 0).toFixed(2)}</div>
                </div>

                <div>
                  <div className="text-muted-foreground text-xs">{t("tank.max_volume")}</div>
                  <div className="font-mono">{Number(tank.volume_max ?? 0).toFixed(2)}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-muted-foreground text-xs">{t("tank.port")}</div>
                  <div>
                    {tank.port_name ? (
                      <Badge variant="outline" className="text-xs">
                        {tank.port_name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">{t("common.none")}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteTank}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_tank_warning", { name: deleteTank?.name })}
            <br />
            <span className="text-red-600 font-medium">
              {t("message.action_irreversible")}
            </span>
          </>
        }
        confirmLabel={t("control.delete")}
        cancelLabel={t("control.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </>
  );
}
