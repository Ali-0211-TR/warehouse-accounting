import { BaseApi } from "@/shared/api/base";
import { ChangePasswordDTO } from "@/shared/bindings/dtos/ChangePasswordDTO";
import { CreateUserDTO } from "@/shared/bindings/dtos/CreateUserDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { LoginDTO } from "@/shared/bindings/dtos/LoginDTO";
import { UpdateUserDTO } from "@/shared/bindings/dtos/UpdateUserDTO";
import { UserEntity } from "../model/types";

class UserApi extends BaseApi {
  // Match Rust backend: list_user
  async getUsers(): Promise<UserEntity[]> {
    return this.request<UserEntity[]>("list_user");
  }

  // Match Rust backend: save_user with UserDTO
  async createUser(userDto: CreateUserDTO): Promise<UserEntity> {
    return this.request<UserEntity>("create_user", userDto);
  }
  // Match Rust backend: save_user with UserDTO
  async updateUser(updateUserDTO: UpdateUserDTO): Promise<UserEntity> {
    return this.request<UserEntity>("update_user", updateUserDTO);
  }
  // Match Rust backend: save_user with UserDTO
  async changeUserPassword(
    changePasswordDTO: ChangePasswordDTO
  ): Promise<UserEntity> {
    return this.request<UserEntity>("change_user_password", changePasswordDTO);
  }

  // Match Rust backend: delete_user with IdDTO
  async deleteUser(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_user", idDto);
  }

  // // Match Rust backend: save_roles with UserDTO
  // async updateRoles(userDto: UserDTO): Promise<UserEntity> {
  //     return this.request<UserEntity>('save_roles', userDto)
  // }

  // Match Rust backend: login with LoginDTO
  async login(username: string, password: string): Promise<UserEntity | null> {
    const loginDto: LoginDTO = { username, password };
    return this.request<UserEntity>("login", loginDto);
  }

  // Match Rust backend: is_login
  async isLogin(): Promise<UserEntity | null> {
    return this.request<UserEntity | null>("is_login");
  }

  // Match Rust backend: logout
  async logout(): Promise<void> {
    await this.request("logout");
  }
}

export const userApi = new UserApi();
