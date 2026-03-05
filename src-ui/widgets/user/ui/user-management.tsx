import {
  UserList,
  UserFilters,
  useUser,
  UserCreateForm,
  UserUpdateForm,
} from "@/features/user";
import { t } from "i18next";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { UserEntity } from "@/entities/user";
import { useEffect, useState } from "react";
import useToast from "@/shared/hooks/use-toast";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { ChangePasswordForm } from "@/features/user/ui/change-password-form";

export function UserManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<UserEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleBulkDelete = async () => {
    try {
      for (const discount of selectedItems) {
        if (discount.id) {
          await onDelete(discount);
        }
      }
      showSuccessToast(t("success.data_deleted"));
      setSelectedItems([]); // Clear selection after successful delete
      setBulkDeleteOpen(false);
    } catch (error: any) {
      showErrorToast(error.message);
      setBulkDeleteOpen(false);
    }
  };
  const {
    users,
    selectedUser,
    createFormVisible,
    updateFormVisible,
    changePasswordFormVisible,
    filtersVisible,
    loading,
    hasActiveFilters,
    onShowCreateForm,
    onShowUpdateForm,
    onShowChangePasswordForm,
    onDelete,
    onCreate,
    onUpdate,
    onChangeUserPassword,
    onCancel,
    onShowFilters,
    onHideFilters,
    filters,
    setFilters,
    clearFilters,
    loadUsers,
  } = useUser();
  useEffect(() => {
    loadUsers();
    // Optionally, add error handling if needed:
    // loadUsers().catch(showErrorToast);
  }, [loadUsers]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.dictionary.users"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          onAdd={onShowCreateForm}
          clearFilters={clearFilters}
          selectedCount={selectedItems.length} // This will now show the correct count
          onBulkDelete={() => setBulkDeleteOpen(true)}
        />
      </div>

      <UserList
        users={users}
        loading={loading}
        onEdit={onShowUpdateForm}
        onDelete={onDelete}
        onChangePassword={onShowChangePasswordForm}
      />

      {/* Filters Dialog */}
      <UserFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Form Dialog */}
      {createFormVisible && (
        <UserCreateForm
          visible={createFormVisible}
          onHide={onCancel}
          onSave={onCreate}
        />
      )}
      {updateFormVisible && selectedUser && (
        <UserUpdateForm
          visible={updateFormVisible}
          onHide={onCancel}
          user={selectedUser}
          onSave={onUpdate}
        />
      )}
      {changePasswordFormVisible && selectedUser && (
        <ChangePasswordForm
          visible={changePasswordFormVisible}
          user={selectedUser}
          onHide={onCancel}
          onSave={onChangeUserPassword}
        />
      )}

      {/* Bulk Delete Confirmation */}
      <ConfirmationDialog
        open={bulkDeleteOpen}
        title={t("message.confirm_bulk_delete")}
        description={
          <>
            {t("message.bulk_delete_warning", { count: selectedItems.length })}
            <br />
            <span className="text-red-600 font-medium">
              {t("message.action_irreversible")}
            </span>
          </>
        }
        confirmLabel={`${t("control.delete")} (${selectedItems.length})`}
        cancelLabel={t("control.cancel")}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
