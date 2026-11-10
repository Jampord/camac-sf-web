import { beforeEach, describe, expect, it, vi } from "vitest";

// The access checks with the session and database faked: who may see admin pages, and where
// everyone else is sent. redirect() throws in Next.js, so the fake throws too.

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));

const { getAdmin, getMember, requireAdmin, requirePeopleManager, requirePrayerTeam } = await import("./dal");

const ADMIN = {
  id: "a1",
  email: "admin@example.com",
  name: "Admin",
  canViewPrayer: false,
  canManagePeople: false,
  role: "ADMIN",
};
const MEMBER = { ...ADMIN, id: "m1", email: "member@example.com", role: "MEMBER" };

function signedInAs(user: typeof ADMIN | null) {
  mocks.auth.mockResolvedValue(user ? { user: { email: user.email } } : null);
  mocks.findUnique.mockResolvedValue(user);
}

beforeEach(() => vi.clearAllMocks());

describe("getAdmin", () => {
  it("returns the admin without their role", async () => {
    signedInAs(ADMIN);
    expect(await getAdmin()).toEqual({
      id: "a1",
      email: "admin@example.com",
      name: "Admin",
      canViewPrayer: false,
      canManagePeople: false,
    });
  });

  it("returns null for a member, so their opens still count", async () => {
    signedInAs(MEMBER);
    expect(await getAdmin()).toBeNull();
  });

  it("returns null when nobody is signed in", async () => {
    signedInAs(null);
    expect(await getAdmin()).toBeNull();
  });

  it("returns null for a session whose email is no longer on the list", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "removed@example.com" } });
    mocks.findUnique.mockResolvedValue(null);
    expect(await getAdmin()).toBeNull();
  });
});

describe("requireAdmin", () => {
  it("lets an admin through", async () => {
    signedInAs(ADMIN);
    await expect(requireAdmin()).resolves.toMatchObject({ id: "a1" });
  });

  it("sends a member to the serving schedule", async () => {
    signedInAs(MEMBER);
    await expect(requireAdmin()).rejects.toHaveProperty("message", "redirect:/schedule");
  });

  it("sends a signed-out visitor to sign-in", async () => {
    signedInAs(null);
    await expect(requireAdmin()).rejects.toHaveProperty("message", "redirect:/admin/sign-in");
  });
});

describe("requirePrayerTeam", () => {
  it("lets a prayer-team admin through", async () => {
    signedInAs({ ...ADMIN, canViewPrayer: true });
    await expect(requirePrayerTeam()).resolves.toMatchObject({ canViewPrayer: true });
  });

  it("keeps a member out even if canViewPrayer were set", async () => {
    signedInAs({ ...MEMBER, canViewPrayer: true });
    await expect(requirePrayerTeam()).rejects.toHaveProperty("message", "redirect:/schedule");
  });

  it("sends other admins back to admin home", async () => {
    signedInAs(ADMIN);
    await expect(requirePrayerTeam()).rejects.toHaveProperty("message", "redirect:/admin");
  });
});

describe("requirePeopleManager", () => {
  it("lets a people manager through, with or without prayer access", async () => {
    signedInAs({ ...ADMIN, canManagePeople: true });
    await expect(requirePeopleManager()).resolves.toMatchObject({ canManagePeople: true });
  });

  it("sends other admins back to the People page, even prayer-team ones", async () => {
    signedInAs({ ...ADMIN, canViewPrayer: true });
    await expect(requirePeopleManager()).rejects.toHaveProperty("message", "redirect:/admin/people");
  });

  it("keeps a member out even if canManagePeople were set", async () => {
    signedInAs({ ...MEMBER, canManagePeople: true });
    await expect(requirePeopleManager()).rejects.toHaveProperty("message", "redirect:/schedule");
  });
});

describe("getMember", () => {
  it("returns a member", async () => {
    signedInAs(MEMBER);
    expect(await getMember()).toEqual({ name: "Admin", email: "member@example.com", isAdmin: false });
  });

  it("returns an admin too, marked as one", async () => {
    signedInAs(ADMIN);
    expect(await getMember()).toMatchObject({ isAdmin: true });
  });

  it("returns null when nobody is signed in", async () => {
    signedInAs(null);
    expect(await getMember()).toBeNull();
  });
});
