import { GroupEntity } from "../../../shared/bindings/GroupEntity";
import { DBGroupRepository } from "./DatabaseGroupRepository";

export interface IGroupRepository {
  getGroupById(id: string): Promise<GroupEntity>;
  getGroups(whereClause: Partial<GroupEntity>): Promise<GroupEntity[]>;
  saveGroup(data: GroupEntity): Promise<GroupEntity>;
  deleteGroup(id: string): Promise<void>;
}

export let groupRepository = new DBGroupRepository();
