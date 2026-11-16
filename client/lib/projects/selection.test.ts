import { describe, expect, it } from "vitest";
import { readSelectedProject, writeSelectedProject } from "./selection";

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

describe("project selection", () => {
  it("remembers the chosen project for the next tab", () => {
    const store = memory();
    writeSelectedProject("p2", store);
    expect(readSelectedProject(["p1", "p2"], store)).toBe("p2");
  });

  it("forgets a project that is no longer in the list, such as an archived one", () => {
    const store = memory();
    writeSelectedProject("p9", store);
    expect(readSelectedProject(["p1", "p2"], store)).toBeUndefined();
  });

  it("forgets the choice when asked", () => {
    const store = memory();
    writeSelectedProject("p1", store);
    writeSelectedProject(undefined, store);
    expect(readSelectedProject(["p1"], store)).toBeUndefined();
  });

  it("works without storage, as in a private window", () => {
    expect(readSelectedProject(["p1"], undefined)).toBeUndefined();
    expect(() => writeSelectedProject("p1", undefined)).not.toThrow();
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readSelectedProject(["p1"], blocked)).toBeUndefined();
    expect(() => writeSelectedProject("p1", blocked)).not.toThrow();
  });
});
