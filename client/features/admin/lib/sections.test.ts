import { describe, expect, it } from "vitest";
import {
  canSaveModel,
  describeModelChoice,
  getSetupProblem,
  summarizeSections,
} from "./sections";
import type { AdminSettingsResponse, AdminUser } from "./types";

const settings = (
  overrides: Partial<AdminSettingsResponse["settings"]> = {},
  extra: Partial<Omit<AdminSettingsResponse, "settings">> = {},
): AdminSettingsResponse => ({
  settings: {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    allowedEmailDomain: "mourasengenharia.com",
    updatedAt: "2026-10-13T12:00:00Z",
    ...overrides,
  },
  keys: [
    {
      provider: "anthropic",
      lastFour: "7f3a",
      updatedAt: "2026-10-12T18:40:00Z",
    },
  ],
  serviceRoleConfigured: true,
  ...extra,
});

const user = (status: AdminUser["status"]): AdminUser => ({
  id: crypto.randomUUID(),
  email: "x@moura.com",
  name: null,
  avatarUrl: null,
  status,
  role: "member",
  approvedAt: null,
  createdAt: "2026-10-01",
});

describe("getSetupProblem", () => {
  it("reports the missing service role key first", () => {
    expect(
      getSetupProblem(
        settings(
          { provider: null, model: null },
          { serviceRoleConfigured: false },
        ),
      ),
    ).toBe("service_role");
  });

  it("reports a missing model before a missing key", () => {
    expect(
      getSetupProblem(settings({ provider: null, model: null }, { keys: [] })),
    ).toBe("no_model");
  });

  it("reports a saved provider without a key", () => {
    expect(
      getSetupProblem(settings({ provider: "openai", model: "gpt-5.5" })),
    ).toBe("no_key");
  });

  it("reports nothing when the chats can run", () => {
    expect(getSetupProblem(settings())).toBeUndefined();
  });
});

describe("summarizeSections", () => {
  it("counts the users awaiting approval when there are any", () => {
    const summary = summarizeSections(
      [user("pending"), user("pending"), user("approved")],
      settings(),
    );
    expect(summary.users).toBe("2 aguardando aprovação");
  });

  it("counts the users with access when nobody is pending", () => {
    const summary = summarizeSections(
      [user("approved"), user("approved"), user("rejected")],
      settings(),
    );
    expect(summary.users).toBe("2 com acesso");
  });

  it("names the saved model and its provider", () => {
    expect(summarizeSections([], settings()).model).toBe(
      "Claude Sonnet 4.6 · Anthropic",
    );
  });

  it("says when no model is saved", () => {
    expect(
      summarizeSections([], settings({ provider: null, model: null })).model,
    ).toBe("Nenhum modelo salvo");
  });

  it("shows the allowed domain with its @", () => {
    expect(summarizeSections([], settings()).access).toBe(
      "@mourasengenharia.com",
    );
  });

  it("falls back to the server's domain when none is saved", () => {
    expect(
      summarizeSections([], settings({ allowedEmailDomain: null })).access,
    ).toBe("Domínio do servidor");
  });

  it("says it is loading while users or settings are missing", () => {
    expect(summarizeSections(undefined, undefined)).toEqual({
      users: "Carregando…",
      model: "Carregando…",
      access: "Carregando…",
    });
  });
});

describe("canSaveModel", () => {
  const saved = { provider: "anthropic" as const, model: "claude-sonnet-4-6" };
  const keys = settings().keys;

  it("refuses when nothing changed", () => {
    expect(canSaveModel({ ...saved, saved, keys })).toBe(false);
  });

  it("refuses a provider without a key", () => {
    expect(
      canSaveModel({ provider: "openai", model: "gpt-5.5", saved, keys }),
    ).toBe(false);
  });

  it("refuses when no model is chosen", () => {
    expect(
      canSaveModel({ provider: "anthropic", model: undefined, saved, keys }),
    ).toBe(false);
  });

  it("accepts another model of a provider that has a key", () => {
    expect(
      canSaveModel({
        provider: "anthropic",
        model: "claude-opus-5-5",
        saved,
        keys,
      }),
    ).toBe(true);
  });
});

describe("describeModelChoice", () => {
  const saved = { provider: "anthropic" as const, model: "claude-sonnet-4-6" };
  const keys = settings().keys;

  it("names the model in use when nothing changed", () => {
    expect(describeModelChoice({ ...saved, saved, keys })).toEqual({
      text: "Em uso: Claude Sonnet 4.6.",
      tone: "muted",
    });
  });

  it("warns when the chosen provider has no key", () => {
    expect(
      describeModelChoice({
        provider: "openai",
        model: "gpt-5.5",
        saved,
        keys,
      }),
    ).toEqual({
      text: "Cadastre a chave da OpenAI para usar este provedor.",
      tone: "warning",
    });
  });

  it("flags unsaved changes otherwise", () => {
    expect(
      describeModelChoice({
        provider: "anthropic",
        model: "claude-opus-5-5",
        saved,
        keys,
      }),
    ).toEqual({ text: "Alterações não salvas.", tone: "muted" });
  });

  it("says when no model is saved and none is chosen", () => {
    expect(
      describeModelChoice({
        provider: undefined,
        model: undefined,
        saved: { provider: null, model: null },
        keys,
      }),
    ).toEqual({ text: "Nenhum modelo salvo.", tone: "muted" });
  });
});
