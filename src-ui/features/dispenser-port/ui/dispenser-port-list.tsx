import type { DispenserPortEntity } from "@/entities/dispenser-port";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { useState, useEffect } from "react";
import { Edit, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";

// Hook to detect small screen (mobile)
function useIsSmallScreen(breakpoint = 640) {
  const [isSmall, setIsSmall] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const listener = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", listener);
    else mql.addListener(listener as any);
    setIsSmall(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", listener);
      else mql.removeListener(listener as any);
    };
  }, [breakpoint]);

  return isSmall;
}

interface DispenserPortListProps {
  dispenserPorts: DispenserPortEntity[];
  loading: boolean;
  onEdit: (dispenserPort: DispenserPortEntity) => void;
  onDelete: (dispenserPort: DispenserPortEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: DispenserPortEntity[]) => void;
}

export function DispenserPortList({
  dispenserPorts,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: DispenserPortListProps) {
  const { t } = useTranslation();
  const [deleteDispenserPort, setDeleteDispenserPort] =
    useState<DispenserPortEntity | null>(null);

  const isSmall = useIsSmallScreen(640);

  const handleDeleteClick = (dispenserPort: DispenserPortEntity) => {
    setDeleteDispenserPort(dispenserPort);
  };

  const handleDeleteConfirm = () => {
    if (deleteDispenserPort) {
      onDelete(deleteDispenserPort);
      setDeleteDispenserPort(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDispenserPort(null);
  };

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //     key: 'id',
    //     header: t('dispenser_port.id'),
    //     accessor: (dispenserPort: DispenserPortEntity) => dispenserPort.id,
    //     width: 'w-16',
    //     align: 'center' as const
    // },
    {
      key: "port_name",
      header: t("dispenser_port.port_name"),
      accessor: (dispenserPort: DispenserPortEntity) => dispenserPort.port_name,
      render: (dispenserPort: DispenserPortEntity) => dispenserPort.port_name,
    },
    {
      key: "protocol",
      header: t("dispenser_port.protocol"),
      accessor: (dispenserPort: DispenserPortEntity) => dispenserPort.protocol,
      width: "w-32",
      render: (dispenserPort: DispenserPortEntity) => (
        <Badge variant="secondary" className="text-xs">
          {dispenserPort.protocol}
        </Badge>
      ),
    },
    {
      key: "port_speed",
      header: t("dispenser_port.port_speed"),
      accessor: (dispenserPort: DispenserPortEntity) =>
        dispenserPort.port_speed,
      width: "w-24",
      align: "right" as const,
      render: (dispenserPort: DispenserPortEntity) => (
        <span className="font-mono">{dispenserPort.port_speed}</span>
      ),
    },
  ];

  // Small screen: cards
  if (isSmall) {
    return (
      <>
        <div className="space-y-3 p-4">
          {dispenserPorts.map((port) => (
            <div
              key={port.id ?? port.port_name}
              className="border rounded-lg p-4 bg-background shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">{port.port_name}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {port.protocol}
                    </Badge>
                    <span className="font-mono text-sm">{port.port_speed}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    aria-label={t("control.edit")}
                    title={t("control.edit")}
                    onClick={() => onEdit(port)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                    <span className="sr-only">{t("control.edit")}</span>
                  </button>

                  <button
                    type="button"
                    aria-label={t("control.delete")}
                    title={t("control.delete")}
                    onClick={() => handleDeleteClick(port)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <Trash className="w-4 h-4 text-red-600" />
                    <span className="sr-only">{t("control.delete")}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ConfirmationDialog
          open={!!deleteDispenserPort}
          title={t("message.confirm_delete")}
          description={
            <>
              {t("message.delete_dispenser_port_warning", {
                name: deleteDispenserPort?.port_name || "",
              })}
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

  // Default: table view
  return (
    <>
      <EntityTable
        data={dispenserPorts}
        columns={columns}
        loading={loading}
        onEdit={onEdit}
        onDelete={handleDeleteClick}
        emptyMessage={"message.no_data"}
        selectable={selectable}
        onSelectionChange={onSelectionChange}
        pageSize={25}
      />

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteDispenserPort}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_dispenser_port_warning", {
              name: deleteDispenserPort?.port_name || "",
            })}
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
