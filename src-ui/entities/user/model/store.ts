import { create } from "zustand";
import { userApi } from "../api/user-api";
import { UserEntity } from "./types";

import { ChangePasswordDTO } from "@/shared/bindings/dtos/ChangePasswordDTO";
import { CreateUserDTO } from "@/shared/bindings/dtos/CreateUserDTO";
import { UpdateUserDTO } from "@/shared/bindings/dtos/UpdateUserDTO";
import { RoleType } from "@/shared/bindings/RoleType";

interface UserStore {
  users: UserEntity[];
  currentUser: UserEntity | null;
  activeRole: RoleType | null;
  loading: boolean;
  error: string | null;

  // Basic state actions
  setUsers: (users: UserEntity[]) => void;
  setActiveRole: (user: RoleType) => void;
  removeUser: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearUsers: () => void;

  // API actions that useUserCrud expects
  loadUsers: () => Promise<void>;
  createUser: (userDto: CreateUserDTO) => Promise<UserEntity>;
  updateUser: (userDto: UpdateUserDTO) => Promise<UserEntity>;
  changeUserPassword: (userDto: ChangePasswordDTO) => Promise<UserEntity>;
  deleteUser: (id: string) => Promise<void>;
  // updateRoles: (userDto: UserDTO) => Promise<UserEntity>
  login: (username: string, password: string) => Promise<UserEntity | null>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  currentUser: null,
  activeRole: null, // Default role, can be changed based on login
  loading: false,
  error: null,

  // Basic state actions
  setUsers: users => set({ users, error: null }),
  setActiveRole: role => set({ activeRole: role }),
  removeUser: id =>
    set(state => ({
      users: state.users.filter(u => u.id !== id),
      error: null,
    })),

  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
  clearUsers: () => set({ users: [], error: null }),

  // API actions
  loadUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userApi.getUsers();
      set({ users, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createUser: async (userDto: CreateUserDTO) => {
    set({ loading: true, error: null });
    try {
      const savedUser = await userApi.createUser(userDto);

      const { users } = get();
      const updatedUsers = [...users, savedUser];
      set({ users: updatedUsers, loading: false });
      return savedUser;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUser: async (userDto: UpdateUserDTO) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await userApi.updateUser(userDto);
      const { users } = get();
      const updatedUsers = users.map(u =>
        u.id === updatedUser.id ? updatedUser : u
      );
      set({ users: updatedUsers, loading: false });
      return updatedUser;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      await userApi.deleteUser(id);

      const { users } = get();
      const updatedUsers = users.filter(u => u.id !== id);

      set({ users: updatedUsers });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  changeUserPassword: async (userDto: ChangePasswordDTO) => {
    try {
      const updatedUser = await userApi.changeUserPassword(userDto);
      const { users } = get();
      const updatedUsers = users.map(u =>
        u.id === updatedUser.id ? updatedUser : u
      );
      set({ users: updatedUsers });
      return updatedUser;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // updateRoles: async (userDto: UserDTO) => {
  //     try {
  //         const updatedUser = await userApi.updateRoles(userDto)

  //         const { users } = get()
  //         const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u)

  //         set({ users: updatedUsers })
  //         return updatedUser
  //     } catch (error: any) {
  //         set({ error: error.message })
  //         throw error
  //     }
  // },

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const loginUser = await userApi.login(username, password);
      set({
        currentUser: loginUser,
        loading: false,
        activeRole: loginUser?.roles[0] || null,
      });
      return loginUser;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      // If you have a logout API, call it here
      if (userApi.logout) {
        await userApi.logout();
      }
      set({ currentUser: null, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
