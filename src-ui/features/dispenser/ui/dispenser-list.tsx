import type { DispenserEntity } from "@/entities/dispenser";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/shadcn/table";
import { t } from "i18next";
import { Edit, GripVertical, Minus, Settings, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DispenserListProps {
  dispensers: DispenserEntity[];
  loading: boolean;
  onEdit: (dispenser: DispenserEntity) => void;
  onDelete: (dispenser: DispenserEntity) => void;
  onManageNozzles?: (dispenser: DispenserEntity) => void;
  onReorder?: (dispenserId: string, newPosition: number) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: DispenserEntity[]) => void;
  showOrderColumn?: boolean;
}

// Unified Row Component that handles both regular and draggable modes
function DispenserRow({
  dispenser,
  index,
  onEdit,
  onDelete,
  onManageNozzles,
  onMouseDownDrag,
  isDragOver,
  isDragging,
  showOrderColumn,
  selectable,
  isSelected,
  onSelectionChange,
}: {
  dispenser: DispenserEntity;
  index: number;
  onEdit: (dispenser: DispenserEntity) => void;
  onDelete: (dispenser: DispenserEntity) => void;
  onManageNozzles?: (dispenser: DispenserEntity) => void;
  onMouseDownDrag?: (index: number, e: React.MouseEvent) => void;
  isDragOver?: boolean;
  isDragging?: boolean;
  showOrderColumn?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (dispenser: DispenserEntity, selected: boolean) => void;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onMouseDownDrag || !showOrderColumn) return;

    // Stop all event propagation to prevent interfering with selection
    e.preventDefault();
    e.stopPropagation();

    onMouseDownDrag(index, e);
  };

  return (
    <TableRow
      ref={rowRef}
      data-index={index}
      className={`transition-all duration-200 ${isDragOver
          ? "bg-blue-100 dark:bg-blue-900/30 border-t-4 border-blue-500"
          : ""
        } ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Selection checkbox column */}
      {selectable && (
        <TableCell className="w-12 text-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={checked =>
              onSelectionChange?.(dispenser, !!checked)
            }
          />
        </TableCell>
      )}

      {/* Order column with draggable grip handle */}
      {showOrderColumn && (
        <TableCell className="w-20 text-center p-1">
          <div
            onMouseDown={handleMouseDown}
            onContextMenu={e => e.preventDefault()} // Prevent right-click menu
            className="flex items-center justify-center p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 select-none cursor-grab active:cursor-grabbing active:scale-95"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
            role="button"
            tabIndex={-1}
            aria-label={`Drag to reorder dispenser ${dispenser.name}`}
          >
            <GripVertical className="h-6 w-6 text-gray-400 hover:text-blue-500 pointer-events-none" />
          </div>
        </TableCell>
      )}

      {/* Regular columns - removed all onMouseDown handlers */}
      {/* ID Column - Hidden (UUID not user-friendly) */}
      {/* <TableCell className="w-16 text-center">{dispenser.id}</TableCell> */}
      <TableCell>{dispenser.name}</TableCell>
      <TableCell className="w-24 text-center">
        <span className="font-mono">{dispenser.base_address}</span>
      </TableCell>
      <TableCell className="w-24">
        {dispenser.port ? (
          <Badge variant="outline" className="text-xs">
            {dispenser.port.port_name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.none")}
          </span>
        )}
      </TableCell>
      <TableCell className="w-20 text-center">
        <span className="font-mono">{dispenser.nozzles.length}</span>
      </TableCell>
      <TableCell className="w-24">
        <Badge
          variant={
            dispenser.state === "Active"
              ? "default"
              : dispenser.state === "Blocked"
                ? "secondary"
                : "destructive"
          }
          className="text-xs"
        >
          {t(`lists.dispenser_state.${dispenser.state}`)}
        </Badge>
      </TableCell>
      <TableCell className="w-32 text-center">
        {dispenser.camera ? (
          <Badge variant="default" className="text-xs">
            {dispenser.camera.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.none")}
          </span>
        )}
      </TableCell>
      <TableCell className="w-32 text-center">
        <div className="flex gap-1 justify-center">
          {onManageNozzles && (
            <Button
              variant="outline"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onManageNozzles(dispenser);
              }}
              className="h-8 w-8 p-0"
              title={t("control.manage_nozzles")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="w-24 text-center">
        <div className="flex gap-1 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onEdit(dispenser);
            }}
            className="h-8 w-8 p-0"
            title={t("control.edit")}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onDelete(dispenser);
            }}
            className="h-8 w-8 p-0"
            title={t("control.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DispenserList({
  dispensers,
  loading,
  onEdit,
  onDelete,
  onManageNozzles,
  onReorder,
  selectable = false,
  onSelectionChange,
  showOrderColumn = false,
}: DispenserListProps) {
  const [deleteDispenser, setDeleteDispenser] =
    useState<DispenserEntity | null>(null);
  const [items, setItems] = useState(dispensers);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [isDragMoving, setIsDragMoving] = useState(false);

  // Update items when dispensers change
  useEffect(() => {
    setItems(dispensers);
  }, [dispensers]);

  const handleDeleteClick = (dispenser: DispenserEntity) => {
    setDeleteDispenser(dispenser);
  };

  const handleDeleteConfirm = () => {
    if (deleteDispenser) {
      onDelete(deleteDispenser);
      setDeleteDispenser(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDispenser(null);
  };

  // Selection handling
  const handleSelectionChange = (
    dispenser: DispenserEntity,
    selected: boolean
  ) => {
    // Prevent selection changes while dragging to avoid conflicts
    if (isDraggingActive) {
      return;
    }

    const newSelected = new Set(selectedItems);
    const dispenserId = dispenser.id!;

    if (selected) {
      newSelected.add(dispenserId);
    } else {
      newSelected.delete(dispenserId);
    }

    setSelectedItems(newSelected);

    // Call parent callback with selected dispensers
    const selectedDispensers = items.filter(item => newSelected.has(item.id!));
    onSelectionChange?.(selectedDispensers);
  };

  const handleSelectAll = (checked: boolean) => {
    // Prevent select all changes while dragging to avoid conflicts
    if (isDraggingActive) {
      return;
    }

    if (checked) {
      const allIds = new Set(items.map(item => item.id!));
      setSelectedItems(allIds);
      onSelectionChange?.(items);
    } else {
      setSelectedItems(new Set());
      onSelectionChange?.([]);
    }
  };

  // Mouse-based drag implementation
  const handleMouseDownDrag = (index: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    // Capture the dragged index in the closure - this is the key fix!
    const capturedDraggedIndex = index;

    setDraggedIndex(index);
    setIsDraggingActive(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();

      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);

      // Use smaller threshold for more responsive dragging
      if (deltaX > 2 || deltaY > 2) {
        // Mark that we're actually moving
        setIsDragMoving(true);

        // Find the element under the mouse
        const elementUnderMouse = document.elementFromPoint(
          moveEvent.clientX,
          moveEvent.clientY
        );
        const rowUnderMouse = elementUnderMouse?.closest(
          "[data-index]"
        ) as HTMLElement;

        if (rowUnderMouse) {
          const targetIndex = parseInt(
            rowUnderMouse.getAttribute("data-index") || "0"
          );
          if (
            targetIndex !== capturedDraggedIndex &&
            targetIndex !== dragOverIndex
          ) {
            setDragOverIndex(targetIndex);
          }
        } else {
          setDragOverIndex(null);
        }
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      // Check if we actually moved enough to consider this a drag operation
      const deltaX = Math.abs(upEvent.clientX - startX);
      const deltaY = Math.abs(upEvent.clientY - startY);
      const isActualDrag = deltaX > 2 || deltaY > 2;

      if (isActualDrag) {
        // Find the final drop target
        const elementUnderMouse = document.elementFromPoint(
          upEvent.clientX,
          upEvent.clientY
        );

        const rowUnderMouse = elementUnderMouse?.closest(
          "[data-index]"
        ) as HTMLElement;

        let dropIndex = null;

        if (rowUnderMouse) {
          dropIndex = parseInt(rowUnderMouse.getAttribute("data-index") || "0");
        } else {
          // Get the current dragOverIndex from state
          const currentDragOverIndex = dragOverIndex;
          if (currentDragOverIndex !== null) {
            dropIndex = currentDragOverIndex;
          }
        }

        // Perform reorder if we have a valid drop target
        // Use capturedDraggedIndex instead of draggedIndex from state
        if (
          dropIndex !== null &&
          capturedDraggedIndex !== null &&
          dropIndex !== capturedDraggedIndex
        ) {
          // Perform the reorder
          const newItems = [...items];
          const [draggedItem] = newItems.splice(capturedDraggedIndex, 1);
          newItems.splice(dropIndex, 0, draggedItem);

          setItems(newItems);

          // Call parent callback
          if (onReorder && draggedItem.id) {
            onReorder(draggedItem.id, dropIndex);
          }
        }
      }

      // Clean up
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsDraggingActive(false);
      setIsDragMoving(false);

      // Remove event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    // Add event listeners to document with options
    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp, { passive: false });
  };

  // Calculate selection states
  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isPartiallySelected =
    selectedItems.size > 0 && selectedItems.size < items.length;

  // Calculate column count for empty state
  const columnCount = (selectable ? 1 : 0) + (showOrderColumn ? 1 : 0) + 8;

  return (
    <>
      <div className="relative">
        {/* Instructions for drag and drop */}
        {showOrderColumn && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <GripVertical className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t("dispenser.reorder_info")}
              </span>
            </div>
          </div>
        )}

        {/* Responsive: show table on sm+ and card list on xs */}
        <div className="hidden sm:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Selection header */}
                {selectable && (
                  <TableHead className="w-12 text-center">
                    <div className="flex justify-center">
                      {isPartiallySelected ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleSelectAll(true)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      )}
                    </div>
                  </TableHead>
                )}

                {/* Order header */}
                {showOrderColumn && (
                  <TableHead className="w-20 text-center">
                    {t("dispenser.show_order_column")}
                  </TableHead>
                )}

                {/* Regular headers */}
                {/* ID Column - Hidden (UUID not user-friendly) */}
                {/* <TableHead className="w-16 text-center">
                  {t("dispenser.id")}
                </TableHead> */}
                <TableHead>{t("dispenser.name")}</TableHead>
                <TableHead className="w-24 text-center">
                  {t("dispenser.base_address")}
                </TableHead>
                <TableHead className="w-24">{t("dispenser.port")}</TableHead>
                <TableHead className="w-20 text-center">
                  {t("dispenser.nozzles")}
                </TableHead>
                <TableHead className="w-24">{t("dispenser.state")}</TableHead>
                <TableHead className="w-32 text-center">
                  {t("dispenser.camera")}
                </TableHead>
                <TableHead className="w-32 text-center">
                  {t("dispenser.nozzles")}
                </TableHead>
                <TableHead className="w-24 text-center">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-24 text-center">
                    {t("common.loading")}...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-24 text-center">
                    {t("message.no_data")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((dispenser, index) => (
                  <DispenserRow
                    key={`dispenser-${dispenser.id}-${index}`}
                    index={index}
                    dispenser={dispenser}
                    onEdit={onEdit}
                    onDelete={handleDeleteClick}
                    onManageNozzles={onManageNozzles}
                    onMouseDownDrag={
                      showOrderColumn ? handleMouseDownDrag : undefined
                    }
                    isDragOver={dragOverIndex === index}
                    isDragging={draggedIndex === index}
                    showOrderColumn={showOrderColumn}
                    selectable={selectable}
                    isSelected={
                      dispenser.id ? selectedItems.has(dispenser.id) : false
                    }
                    onSelectionChange={handleSelectionChange}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Card list for small screens */}
        <div className="sm:hidden">
          {loading ? (
            <div className="h-24 flex items-center justify-center text-center">
              {t("common.loading")}...
            </div>
          ) : items.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-center">
              {t("message.no_data")}
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {items.map((dispenser, index) => {
                const isDragOver = dragOverIndex === index;
                const isDragging = draggedIndex === index;

                return (
                  <div
                    key={`dispenser-card-${dispenser.id}-${index}`}
                    data-index={index}
                    className={`p-3 border rounded-lg transition-all duration-200 flex flex-col gap-2 ${isDragOver
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800"
                        : ""
                      } ${isDragging ? "opacity-50" : ""}`}
                    onClick={() => onEdit(dispenser)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {selectable && (
                          <Checkbox
                            checked={!!(dispenser.id && selectedItems.has(dispenser.id))}
                            onCheckedChange={(checked) =>
                              handleSelectionChange(dispenser, !!checked)
                            }
                          />
                        )}

                        {showOrderColumn && (
                          <div
                            onMouseDown={(e) => handleMouseDownDrag(index, e)}
                            onContextMenu={(e) => e.preventDefault()}
                            className="p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 select-none cursor-grab active:cursor-grabbing"
                            role="button"
                            tabIndex={-1}
                            aria-label={`Drag to reorder dispenser ${dispenser.name}`}
                          >
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                        )}

                        <div>
                          <div className="font-medium text-sm">{dispenser.name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{dispenser.base_address}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onManageNozzles && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onManageNozzles(dispenser);
                            }}
                            className="h-8 w-8 p-0"
                            title={t("control.manage_nozzles")}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(dispenser);
                          }}
                          className="h-8 w-8 p-0"
                          title={t("control.edit")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(dispenser);
                          }}
                          className="h-8 w-8 p-0"
                          title={t("control.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">{t("dispenser.port")}:</span>
                        {dispenser.port ? (
                          <Badge variant="outline" className="text-xs">
                            {dispenser.port.port_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t("common.none")}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">{t("dispenser.nozzles")}:</span>
                        <span className="font-mono text-xs">{dispenser.nozzles.length}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">{t("dispenser.state")}:</span>
                        <Badge
                          variant={
                            dispenser.state === "Active"
                              ? "default"
                              : dispenser.state === "Blocked"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {t(`lists.dispenser_state.${dispenser.state}`)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">{t("dispenser.camera")}:</span>
                        {dispenser.camera ? (
                          <Badge variant="default" className="text-xs">
                            {dispenser.camera.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t("common.none")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Enhanced drag indicator */}
        {draggedIndex !== null && (
          <div
            className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-xl z-50 text-sm font-medium transition-all ${isDragMoving
                ? "bg-green-500 text-white animate-pulse"
                : "bg-yellow-500 text-white animate-bounce"
              }`}
          >
            {isDragMoving ? "🚚 Moving" : "🖱️ Click & Drag"}:{" "}
            {items[draggedIndex]?.name || `Row ${draggedIndex + 1}`}
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteDispenser}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_dispenser_warning", {
              name: deleteDispenser?.name,
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
