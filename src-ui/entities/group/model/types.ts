import type { GroupDTO } from "@/shared/bindings/GroupDTO";
import type { GroupEntity as GroupEntityBinding } from "@/shared/bindings/GroupEntity";
import type { GroupType } from "@/shared/bindings/GroupType";

export type GroupEntity = GroupEntityBinding;

export interface GroupFilterState {
  search: string;
  group_type?: GroupType;
  parent_id?: string;
}

export { GroupDTO, GroupType };
