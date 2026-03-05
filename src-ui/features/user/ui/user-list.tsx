import { UserEntity } from "@/entities/user";
import {
  EntityTable,
  EntityTableColumn,
} from "@/shared/ui/components/EntityTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Badge } from "@/shared/ui/shadcn/badge";
import { DropdownMenuItem } from "@/shared/ui/shadcn/dropdown-menu";
import { t } from "i18next";
import { Users, Edit, Trash } from "lucide-react";
import { useEffect, useState } from "react";

interface UserListProps {
  users: UserEntity[];
  loading?: boolean;
  onEdit: (user: UserEntity) => void;
  onDelete: (user: UserEntity) => void;
  onChangePassword?: (user: UserEntity) => void;
}

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

export function UserList({
  users,
  loading,
  onEdit,
  onDelete,
  onChangePassword,
}: UserListProps) {
  const [deleteUser, setDeleteUser] = useState<UserEntity | null>(null);
  const isSmall = useIsSmallScreen(640);

  const handleDeleteClick = (user: UserEntity) => {
    setDeleteUser(user);
  };

  const handleDeleteConfirm = () => {
    if (deleteUser) {
      onDelete(deleteUser);
      setDeleteUser(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteUser(null);
  };

  const columns: EntityTableColumn<UserEntity>[] = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //     key: 'id',
    //     header: t('user.id'),
    //     accessor: 'id',
    //     width: 'w-16',
    //     align: 'center'
    // },
    {
      key: "full_name",
      header: t("user.full_name"),
      accessor: "full_name",
      width: "w-48",
    },
    {
      key: "username",
      header: t("user.username"),
      accessor: "username",
      width: "w-36",
    },
    {
      key: "phone_number",
      header: t("user.phone_number"),
      accessor: "phone_number",
      width: "w-36",
    },
    {
      key: "roles",
      header: t("user.roles"),
      accessor: "roles",
      width: "w-48",
      sortable: false,
      render: (user: UserEntity) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map(role => (
            <Badge key={role} variant="secondary" className="text-xs">
              {t(`lists.role_type.${role}`)}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  const actions = onChangePassword
    ? (user: UserEntity) => (

      <DropdownMenuItem
        onClick={() => onChangePassword(user)}
        className="text-destructive focus:text-destructive"
      >
        <Users className="h-4 w-4" />
        {t("user.change_password")}
      </DropdownMenuItem>


    )
    : undefined;

  return (
    <>
      {isSmall ? (
        <div className="space-y-3 p-4">
          {users.map((user) => (
            <div
              key={(user as any).id ?? user.username}
              className="border rounded-lg p-4 bg-background shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">{user.full_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{user.username}</div>
                  <div className="mt-2 text-sm">{user.phone_number}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {t(`lists.role_type.${role}`)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {onChangePassword && (
                    <button
                      type="button"
                      aria-label={t("user.change_password")}
                      title={t("user.change_password")}
                      onClick={() => onChangePassword(user)}
                      className="p-2 rounded-md hover:bg-gray-100"
                    >
                      <Users className="w-4 h-4 text-gray-700" />
                      <span className="sr-only">{t("user.change_password")}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    aria-label={t("control.edit")}
                    title={t("control.edit")}
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                    <span className="sr-only">{t("control.edit")}</span>
                  </button>

                  <button
                    type="button"
                    aria-label={t("control.delete")}
                    title={t("control.delete")}
                    onClick={() => handleDeleteClick(user)}
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
      ) : (
        <EntityTable<UserEntity>
          data={users}
          columns={columns}
          loading={loading}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          actions={actions}
          emptyMessage="message.no_users"
          selectable={true}
          pageSize={25}
        />
      )}

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("message.confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("message.delete_user_warning", {
                name: deleteUser?.full_name,
              })}
              <br />
              <span className="text-red-600 font-medium">
                {t("message.action_irreversible")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              {t("control.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("control.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
