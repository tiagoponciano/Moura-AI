import { describe, expect, it } from "vitest";
import { themeLabel } from "./theme-options";

describe("themeLabel", () => {
  it("names the mode in use", () => {
    expect(themeLabel("light")).toBe("Modo claro");
    expect(themeLabel("dark")).toBe("Modo escuro");
    expect(themeLabel("system")).toBe("Modo do sistema");
  });

  it("falls back to a neutral word when the theme is not known", () => {
    expect(themeLabel(undefined)).toBe("Tema");
    expect(themeLabel("sepia")).toBe("Tema");
  });
});
