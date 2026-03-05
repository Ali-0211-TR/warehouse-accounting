import { GroupEntity } from "@/shared/bindings/GroupEntity";

export let emptyGroupEntity: GroupEntity = {
  id: null,
  device_id: "",
  group_type: "No",
  mark: null,
  name: "",
  parent_id: null,
  discounts: [],
  created_at: "",
  updated_at: "",
  deleted_at: null,
  version: BigInt(0),
};
