import { describe, expect, it } from "vitest";
import { PROJECT_FIELD_GROUPS } from "@/lib/projects/fields";
import { groupChange, groupDraft } from "./project-data-edit";

const owner = PROJECT_FIELD_GROUPS.find((group) => group.id === "owner")!;
const data = { owner_name: "Ana Souza", owner_phone: "4899999" };

describe("groupDraft", () => {
  it("starts from the saved values and leaves the rest blank", () => {
    const draft = groupDraft(owner, data);
    expect(draft.owner_name).toBe("Ana Souza");
    expect(draft.owner_email).toBe("");
  });
});

describe("groupChange", () => {
  it("returns nothing when the draft equals what is saved", () => {
    expect(groupChange(owner, groupDraft(owner, data), data)).toBeUndefined();
  });

  it("returns only the fields that changed, trimmed", () => {
    const draft = { ...groupDraft(owner, data), owner_email: " a@b.com " };
    expect(groupChange(owner, draft, data)).toEqual({ owner_email: "a@b.com" });
  });

  it("removes the key of a field that was cleared", () => {
    const draft = { ...groupDraft(owner, data), owner_phone: "  " };
    expect(groupChange(owner, draft, data)).toEqual({ owner_phone: null });
  });

  it("ignores a key that is not in the group", () => {
    const draft = { ...groupDraft(owner, data), property_city: "Joinville" };
    expect(groupChange(owner, draft, data)).toBeUndefined();
  });
});
