/** In-memory 売り切れ (nhóm mì) khi không có Supabase */
import type { MainNoodleGroupId } from "@/lib/menu-main-noodle";

const soldOutGroups = new Set<MainNoodleGroupId>();

export function getDevSoldOutGroupIds(): MainNoodleGroupId[] {
  return Array.from(soldOutGroups);
}

export function setDevGroupSoldOut(groupId: MainNoodleGroupId, soldOut: boolean): void {
  if (soldOut) soldOutGroups.add(groupId);
  else soldOutGroups.delete(groupId);
}
