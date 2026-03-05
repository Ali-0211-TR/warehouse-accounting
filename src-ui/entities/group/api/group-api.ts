import { BaseApi } from "@/shared/api/base";
import { GroupDTO } from "@/shared/bindings/GroupDTO";
import { IdDTO } from "@/shared/bindings/dtos/IdDTO";
import { GroupEntity } from "../model/types";

class GroupApi extends BaseApi {
  async getGroups(): Promise<GroupEntity[]> {
    return this.request<GroupEntity[]>("get_groups");
  }

  async saveGroup(groupDto: GroupDTO): Promise<GroupEntity> {
    return this.request<GroupEntity>("save_group", groupDto);
  }

  async deleteGroup(id: string): Promise<void> {
    const idDto: IdDTO = { id };
    await this.request<number>("delete_group", idDto);
  }
}

export const groupApi = new GroupApi();
