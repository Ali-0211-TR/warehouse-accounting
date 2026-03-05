import { GroupEntity } from "../../../shared/bindings/GroupEntity";
import { ipc_invoke } from "../../../shared/ipc/ipc";
import { IGroupRepository } from "./IGroupRepository";

export class DBGroupRepository implements IGroupRepository {
  async getGroupById(_id: string): Promise<GroupEntity> {
    throw new Error("Method not implemented.");
  }
  async getGroups(_whereClause: Partial<GroupEntity>): Promise<GroupEntity[]> {
    const result: GroupEntity[] = await ipc_invoke("get_groups");
    return result;
  }
  async saveGroup(data: GroupEntity): Promise<GroupEntity> {
    const result: GroupEntity = await ipc_invoke("save_group", data);
    return result;
  }
  async deleteGroup(id: string): Promise<void> {
    const result = await ipc_invoke("delete_group", { id });
    return result;
  }
}
