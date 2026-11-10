import type { Access } from "./access";

// Who may change or remove whom on /admin/people (brief §4). The server checks this before
// every change; the page uses it too, so it only shows buttons that would work.
//
// The last people manager can never be demoted by these rules alone: only managers change
// managers, and nobody changes themselves, so whoever does it is still one. The actions also
// re-count managers inside a transaction, for two managers demoting each other at once.

type Viewer = { id: string; canManagePeople: boolean };
type Target = { id: string; access: Access };

export const OWN_ACCESS = "You can't change your own access. Ask another people manager.";
export const MANAGERS_ONLY = "Only people managers can change admins and the prayer team.";
export const LAST_MANAGER = "Someone has to be able to manage people, so this can't be saved.";

/** Why the viewer can't make this change, or null if they can. `next` is omitted for removal. */
export function changeProblem(viewer: Viewer, target: Target, next?: Access): string | null {
  if (viewer.id === target.id) return OWN_ACCESS;
  if (viewer.canManagePeople) return null;
  // Everyone else can rename or remove members, and nothing more.
  if (target.access !== "member" || (next !== undefined && next !== "member")) return MANAGERS_ONLY;
  return null;
}
