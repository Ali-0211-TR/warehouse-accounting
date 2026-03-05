import { UserEntity, emptyUser, useUserStore } from "@/entities/user";
import { ChangePasswordDTO } from "@/shared/bindings/dtos/ChangePasswordDTO";
import { CreateUserDTO } from "@/shared/bindings/dtos/CreateUserDTO";
import { UpdateUserDTO } from "@/shared/bindings/dtos/UpdateUserDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserFilters } from "./use-user-filters";

export function useUser() {
  const { t } = useTranslation();

  // Form state
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
  const [createFormVisible, setCreateFormVisible] = useState(false);
  const [updateFormVisible, setUpdateFormVisible] = useState(false);
  const [changePasswordFormVisible, setChangePasswordFormVisible] =
    useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Store
  const {
    users,
    loading,
    loadUsers,
    createUser,
    updateUser,
    changeUserPassword,
    deleteUser,
    activeRole,
    currentUser,
    setActiveRole,
    login,
    logout,
  } = useUserStore();

  // Filters
  const { filters, filteredUsers, hasActiveFilters, setFilters, clearFilters } =
    useUserFilters(users);

  const { showErrorToast, showSuccessToast } = useToast();

  // Load users on mount
  // useEffect(() => {
  //   loadUsers().catch(showErrorToast);
  // }, [loadUsers, showErrorToast]);

  // CRUD Actions
  const onShowCreateForm = useCallback(() => {
    setSelectedUser(emptyUser);
    setCreateFormVisible(true);
  }, []);

  const onShowChangePasswordForm = useCallback((user: UserEntity) => {
    setSelectedUser(user);
    setChangePasswordFormVisible(true);
  }, []);

  const onShowUpdateForm = useCallback((user: UserEntity) => {
    setSelectedUser(user);
    setUpdateFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (user: UserEntity) => {
      if (user.id === null) {
        showErrorToast(t("user.cannot_delete_without_id"));
        return;
      }

      try {
        await deleteUser(user.id);
        showSuccessToast(t("user.deleted_successfully"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteUser, showErrorToast, showSuccessToast, t],
  );

  const onCreate = useCallback(
    async (userDTO: CreateUserDTO) => {
      try {
        await createUser(userDTO);
        setCreateFormVisible(false);
        setSelectedUser(null);
        showSuccessToast(t("user.created_successfully"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [createUser, showErrorToast, showSuccessToast],
  );

  const onUpdate = useCallback(
    async (userDTO: UpdateUserDTO) => {
      try {
        await updateUser(userDTO);
        setUpdateFormVisible(false);
        setSelectedUser(null);
        showSuccessToast(t("user.updated_successfully"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [updateUser, showErrorToast, showSuccessToast],
  );

  const onChangeUserPassword = useCallback(
    async (userDTO: ChangePasswordDTO) => {
      try {
        await changeUserPassword(userDTO);
        setChangePasswordFormVisible(false);
        setSelectedUser(null);
        showSuccessToast(t("user.password_changed_successfully"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [updateUser, showErrorToast, showSuccessToast],
  );

  const onCancel = useCallback(() => {
    setCreateFormVisible(false);
    setUpdateFormVisible(false);
    setChangePasswordFormVisible(false);
    setSelectedUser(null);
  }, []);

  // Filter Actions
  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
  }, []);

  return {
    // Data
    users: filteredUsers,
    allUsers: users,
    selectedUser,
    loading,
    loadUsers,
    // Form state
    createFormVisible,
    updateFormVisible,
    changePasswordFormVisible,
    filtersVisible,

    // Filter state
    filters,
    hasActiveFilters,

    // CRUD actions
    onShowCreateForm,
    onShowUpdateForm,
    onShowChangePasswordForm,
    onDelete,
    onCreate,
    onUpdate,
    onChangeUserPassword,
    onCancel,

    // Filter actions
    onShowFilters,
    onHideFilters,
    setFilters,
    clearFilters,

    // Utilities
    reload: loadUsers,
    activeRole,
    currentUser,
    setActiveRole,

    login,
    logout,
  };
}
