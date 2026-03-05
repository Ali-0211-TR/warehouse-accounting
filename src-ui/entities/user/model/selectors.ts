import { UserEntity, UserFilterState } from "./types";

export const userSelectors = {
  filterUsers: (
    users: UserEntity[],
    filters: UserFilterState
  ): UserEntity[] => {
    return users.filter(user => {
      const matchesSearch =
        !filters.search ||
        user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone_number.toLowerCase().includes(filters.search.toLowerCase());

      const matchesRoles =
        !filters.roles?.length ||
        filters.roles.some(role => user.roles.includes(role));

      return matchesSearch && matchesRoles;
    });
  },

  getUserById: (users: UserEntity[], id: string): UserEntity | undefined => {
    return users.find(user => user.id === id);
  },

  getUsersByRole: (users: UserEntity[], role: string): UserEntity[] => {
    return users.filter(user => user.roles.includes(role as any));
  },

  getActiveUsers: (users: UserEntity[]): UserEntity[] => {
    return users.filter(user => user.id !== null);
  },
};
