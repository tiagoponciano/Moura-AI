import { describe, expect, it } from "vitest";
import type { AdminUser } from "./types";
import { countPending, filterUsers, sortUsers } from "./users";

const user = (
  id: string,
  status: AdminUser["status"],
  createdAt = "2026-10-01",
): AdminUser => ({
  id,
  email: `${id}@moura.com`,
  name: null,
  avatarUrl: null,
  status,
  role: "member",
  approvedAt: null,
  createdAt,
});

describe("sortUsers", () => {
  it("lists pending users first, newest first within each status", () => {
    const sorted = sortUsers([
      user("a", "approved", "2026-10-01"),
      user("r", "rejected", "2026-10-05"),
      user("p1", "pending", "2026-10-02"),
      user("p2", "pending", "2026-10-03"),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(["p2", "p1", "a", "r"]);
  });
});

describe("filterUsers", () => {
  const users = [
    user("p", "pending"),
    user("a", "approved"),
    user("r", "rejected"),
  ];

  it("keeps every user for the all filter", () => {
    expect(filterUsers(users, "all")).toEqual(users);
  });

  it("keeps only users with the chosen status", () => {
    expect(filterUsers(users, "approved").map((entry) => entry.id)).toEqual([
      "a",
    ]);
  });
});

describe("countPending", () => {
  it("counts only users awaiting approval", () => {
    expect(
      countPending([
        user("p1", "pending"),
        user("p2", "pending"),
        user("a", "approved"),
      ]),
    ).toBe(2);
  });
});
