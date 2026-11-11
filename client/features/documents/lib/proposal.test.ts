import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatPrice,
  proposalBody,
  proposalValues,
} from "./proposal";

const request = {
  planId: "complete-management",
  price: 4500,
  validityDays: 10,
  format: "pptx" as const,
};

describe("formatPrice", () => {
  it("writes reais with thousands and cents", () => {
    expect(formatPrice(4500)).toBe("R$ 4.500,00");
  });

  it("keeps the cents", () => {
    expect(formatPrice(1234.5)).toBe("R$ 1.234,50");
  });
});

it("formats the date in São Paulo time", () => {
  expect(formatDate(new Date("2026-11-12T01:30:00Z"))).toBe("11/11/2026");
});

describe("proposalValues", () => {
  const today = new Date("2026-11-11T15:00:00Z");

  it("takes the client and the place from the project's shared data", () => {
    const values = proposalValues(
      {
        name: "Obra 7",
        data: {
          owner_name: "Padaria Silva",
          property_building_name: "Edifício Aurora",
          property_city: "Florianópolis",
        },
      },
      request,
      today,
    );
    expect(values).toMatchObject({
      client: "Padaria Silva",
      project_name: "Edifício Aurora",
      city_state: "Florianópolis",
      date: "11/11/2026",
      price: "R$ 4.500,00",
    });
  });

  it("names the project after its own name when the building has none", () => {
    const values = proposalValues({ name: "Obra 7", data: {} }, request, today);
    expect(values.project_name).toBe("Obra 7");
    expect(values.client).toBe("");
  });

  it("states the validity chosen in the notes", () => {
    const values = proposalValues(
      { name: "x", data: {} },
      { ...request, validityDays: 30 },
      today,
    );
    expect(values.notes).toContain("Validade da proposta: 30 dias.");
  });

  it("lists the plan's items", () => {
    const values = proposalValues({ name: "x", data: {} }, request, today);
    expect(values.plan_items).toHaveLength(7);
  });
});

describe("proposalBody", () => {
  it("defaults the validity to 10 days", () => {
    const { validityDays: _ignored, ...rest } = request;
    expect(proposalBody.parse(rest).validityDays).toBe(10);
  });

  it("refuses an unknown plan", () => {
    expect(
      proposalBody.safeParse({ ...request, planId: "other" }).success,
    ).toBe(false);
  });

  it("refuses a price that is not positive", () => {
    expect(proposalBody.safeParse({ ...request, price: 0 }).success).toBe(
      false,
    );
  });

  it("refuses an unknown format", () => {
    expect(proposalBody.safeParse({ ...request, format: "docx" }).success).toBe(
      false,
    );
  });
});
