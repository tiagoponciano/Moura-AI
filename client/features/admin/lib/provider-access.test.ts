import { describe, expect, it } from "vitest";
import { accessChanged, describeAccess, toggleUser } from "./provider-access";

const saved = {
  provider: "openai",
  restricted: true,
  userIds: ["a", "b"],
} as const;

describe("toggleUser", () => {
  it("adds a user that is not listed and removes one that is", () => {
    expect(toggleUser(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleUser(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("accessChanged", () => {
  it("treats a provider with no saved row as open to everyone", () => {
    expect(accessChanged(undefined, false, [])).toBe(false);
    expect(accessChanged(undefined, true, [])).toBe(true);
  });

  it("ignores the order of the listed users", () => {
    expect(
      accessChanged({ ...saved, userIds: [...saved.userIds] }, true, [
        "b",
        "a",
      ]),
    ).toBe(false);
  });

  it("sees a user added or removed", () => {
    expect(
      accessChanged({ ...saved, userIds: [...saved.userIds] }, true, ["a"]),
    ).toBe(true);
    expect(
      accessChanged({ ...saved, userIds: [...saved.userIds] }, true, [
        "a",
        "b",
        "c",
      ]),
    ).toBe(true);
  });

  it("ignores the list while the provider is open to everyone", () => {
    expect(
      accessChanged(
        { provider: "openai", restricted: false, userIds: [] },
        false,
        ["a"],
      ),
    ).toBe(false);
  });
});

describe("describeAccess", () => {
  it("says who can use the provider", () => {
    expect(describeAccess(false, 0)).toBe(
      "Todos os usuários aprovados podem usar.",
    );
    expect(describeAccess(true, 0)).toBe("Ninguém pode usar este provedor.");
    expect(describeAccess(true, 1)).toBe("Só 1 usuário pode usar.");
    expect(describeAccess(true, 3)).toBe("Só 3 usuários podem usar.");
  });
});
