import { describe, expect, it } from "vitest";
import { isEmailAllowed, resolveGate } from "./gate";

const approved = { email: "ana@moura.com", status: "approved" } as const;

describe("isEmailAllowed", () => {
  it("accepts any email when no domain is set", () => {
    expect(isEmailAllowed("ana@gmail.com", undefined)).toBe(true);
    expect(isEmailAllowed("ana@gmail.com", "")).toBe(true);
  });

  it("compares the domain ignoring case", () => {
    expect(isEmailAllowed("Ana@Moura.COM", "moura.com")).toBe(true);
  });

  it("rejects other domains, including look-alike suffixes", () => {
    expect(isEmailAllowed("ana@gmail.com", "moura.com")).toBe(false);
    expect(isEmailAllowed("ana@evilmoura.com", "moura.com")).toBe(false);
  });

  it("accepts a domain written with a leading @", () => {
    expect(isEmailAllowed("ana@moura.com", "@moura.com")).toBe(true);
  });
});

describe("resolveGate", () => {
  it("sends a visitor without a session to the login page", () => {
    expect(
      resolveGate({ pathname: "/documents", email: null, status: null }),
    ).toEqual({ type: "redirect", to: "/login" });
  });

  it("shows the login page to a visitor without a session", () => {
    expect(
      resolveGate({ pathname: "/login", email: null, status: null }),
    ).toEqual({ type: "allow" });
  });

  it("answers API calls without a session with 401 instead of a redirect", () => {
    expect(
      resolveGate({
        pathname: "/api/documents/chat",
        email: null,
        status: null,
      }),
    ).toEqual({ type: "deny", status: 401, error: "Authentication required" });
  });

  it("lets anyone reach the Google sign-in API, with or without a session", () => {
    for (const status of [null, "pending", "rejected"] as const) {
      expect(
        resolveGate({
          pathname: "/api/auth/google",
          email: status ? "ana@moura.com" : null,
          status,
        }),
      ).toEqual({ type: "allow" });
    }
  });

  it("keeps gating paths that only start like the sign-in API", () => {
    expect(
      resolveGate({ pathname: "/api/auth/google/x", email: null, status: null }),
    ).toEqual({ type: "deny", status: 401, error: "Authentication required" });
  });

  it("sends an email outside the allowed domain to /unauthorized", () => {
    expect(
      resolveGate({
        pathname: "/",
        email: "ana@gmail.com",
        status: "approved",
        allowedDomain: "moura.com",
      }),
    ).toEqual({ type: "redirect", to: "/unauthorized" });
  });

  it("sends a rejected user to /unauthorized", () => {
    expect(
      resolveGate({
        pathname: "/",
        email: "ana@moura.com",
        status: "rejected",
      }),
    ).toEqual({ type: "redirect", to: "/unauthorized" });
  });

  it("sends a pending user to /pending", () => {
    expect(
      resolveGate({ pathname: "/", email: "ana@moura.com", status: "pending" }),
    ).toEqual({ type: "redirect", to: "/pending" });
  });

  it("treats a missing profile as pending", () => {
    expect(
      resolveGate({ pathname: "/", email: "ana@moura.com", status: null }),
    ).toEqual({ type: "redirect", to: "/pending" });
  });

  it("does not redirect a pending user who is already on /pending", () => {
    expect(
      resolveGate({
        pathname: "/pending",
        email: "ana@moura.com",
        status: "pending",
      }),
    ).toEqual({ type: "allow" });
  });

  it("answers API calls from a user who is not approved with 403", () => {
    expect(
      resolveGate({
        pathname: "/api/chats",
        email: "ana@moura.com",
        status: "pending",
      }),
    ).toEqual({ type: "deny", status: 403, error: "Access not approved" });
  });

  it("lets an approved user reach the app and the API", () => {
    expect(resolveGate({ pathname: "/documents", ...approved })).toEqual({
      type: "allow",
    });
    expect(resolveGate({ pathname: "/api/chats", ...approved })).toEqual({
      type: "allow",
    });
  });

  it("sends an approved user away from the auth pages to the home page", () => {
    for (const pathname of ["/login", "/pending", "/unauthorized"]) {
      expect(resolveGate({ pathname, ...approved })).toEqual({
        type: "redirect",
        to: "/",
      });
    }
  });

  it("lets an admin reach the admin page and the admin API", () => {
    const admin = { ...approved, role: "admin" } as const;
    expect(resolveGate({ pathname: "/admin", ...admin })).toEqual({
      type: "allow",
    });
    expect(resolveGate({ pathname: "/api/admin/users", ...admin })).toEqual({
      type: "allow",
    });
  });

  it("sends a member away from the admin page to the home page", () => {
    for (const role of ["member", null, undefined] as const) {
      expect(resolveGate({ pathname: "/admin", ...approved, role })).toEqual({
        type: "redirect",
        to: "/",
      });
    }
  });

  it("answers admin API calls from a member with 403", () => {
    expect(
      resolveGate({
        pathname: "/api/admin/users",
        ...approved,
        role: "member",
      }),
    ).toEqual({ type: "deny", status: 403, error: "Admin only" });
  });

  it("does not treat paths that only start with 'admin' as admin paths", () => {
    expect(
      resolveGate({ pathname: "/administrator", ...approved, role: "member" }),
    ).toEqual({ type: "allow" });
    expect(
      resolveGate({ pathname: "/api/administer", ...approved, role: "member" }),
    ).toEqual({ type: "allow" });
  });

  it("keeps the approval checks ahead of the admin check", () => {
    expect(
      resolveGate({
        pathname: "/admin",
        email: "ana@moura.com",
        status: "pending",
        role: "admin",
      }),
    ).toEqual({ type: "redirect", to: "/pending" });
  });
});
