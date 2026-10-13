import type { Row } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import {
  compareText,
  matchesTeamFilter,
  matchesTeamQuery,
  type TEAM_TABLE_FEATURES,
} from "./team-table";
import type { AdminUser } from "./types";

type TeamRow = Row<typeof TEAM_TABLE_FEATURES, AdminUser>;

/** Just enough of a row for the filter and sort functions: the user and one column value. */
const row = (user: Partial<AdminUser>, value: unknown = user.status) =>
  ({
    original: {
      id: "id",
      email: "ana@moura.com",
      name: "Ana",
      avatarUrl: null,
      status: "approved",
      role: "member",
      approvedAt: null,
      createdAt: "2026-10-01",
      ...user,
    },
    getValue: () => value,
  }) as unknown as TeamRow;

describe("matchesTeamFilter", () => {
  it("keeps every row for the all filter", () => {
    expect(
      matchesTeamFilter(row({ status: "rejected" }), "status", "all"),
    ).toBe(true);
  });

  it("keeps rows whose status is the filter", () => {
    expect(
      matchesTeamFilter(row({ status: "rejected" }), "status", "rejected"),
    ).toBe(true);
  });

  it("drops rows with another status", () => {
    expect(
      matchesTeamFilter(row({ status: "approved" }), "status", "rejected"),
    ).toBe(false);
  });
});

describe("matchesTeamQuery", () => {
  it("searches the row's user, not the column value", () => {
    expect(
      matchesTeamQuery(row({ name: "Bruno" }, "Ana"), "user", "bruno"),
    ).toBe(true);
  });

  it("treats a missing query as blank", () => {
    expect(matchesTeamQuery(row({}), "user", undefined)).toBe(true);
  });
});

describe("compareText", () => {
  it("orders accented names alphabetically, ascending", () => {
    expect(compareText(row({}, "Élio"), row({}, "Fábio"), "user")).toBeLessThan(
      0,
    );
  });
});
