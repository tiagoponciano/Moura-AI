import { describe, expect, it } from "vitest";
import { PROJECT_FIELD_GROUPS } from "@/lib/projects/fields";
import { PROJECT_TABS, groupsOfTab } from "./project-tabs";

describe("PROJECT_TABS", () => {
  it("shows every field group on exactly one tab", () => {
    const listed: string[] = PROJECT_TABS.flatMap((tab) => [...tab.groups]);
    expect([...listed].sort()).toEqual(
      PROJECT_FIELD_GROUPS.map((group) => group.id).sort(),
    );
  });

  it("gives the client tab the owner before the applicant", () => {
    expect(groupsOfTab("client").map((group) => group.id)).toEqual([
      "owner",
      "applicant",
    ]);
  });

  it("has no field groups on the summary tab", () => {
    expect(groupsOfTab("summary")).toEqual([]);
  });
});
