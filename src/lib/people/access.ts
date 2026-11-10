import type { Role } from "@/generated/prisma/client";

// The three access levels on /admin/people, and how each maps onto the User columns. "Can
// manage people" is separate from the level on purpose: whoever maintains the site can manage
// people without reading prayer requests (brief §4).

export const ACCESS_LEVELS = ["member", "admin", "prayer"] as const;
export type Access = (typeof ACCESS_LEVELS)[number];

export const ACCESS_INFO: Record<Access, { label: string; description: string }> = {
  member: { label: "Member", description: "Sees the serving schedule. Nothing else." },
  admin: { label: "Admin", description: "Events, the schedule and members. No prayer requests." },
  prayer: { label: "Admin + prayer team", description: "Everything, including prayer requests." },
};

type AccessColumns = { role: Role; canViewPrayer: boolean; canManagePeople: boolean };

export function accessOf(user: { role: Role; canViewPrayer: boolean }): Access {
  if (user.role !== "ADMIN") return "member";
  return user.canViewPrayer ? "prayer" : "admin";
}

/** The columns to save. A member never keeps admin permissions, whatever was ticked. */
export function accessColumns(access: Access, canManagePeople: boolean): AccessColumns {
  if (access === "member") return { role: "MEMBER", canViewPrayer: false, canManagePeople: false };
  return { role: "ADMIN", canViewPrayer: access === "prayer", canManagePeople };
}
