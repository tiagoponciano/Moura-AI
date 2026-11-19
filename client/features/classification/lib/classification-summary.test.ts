import { describe, expect, it } from "vitest";
import { EMPTY_STATE, type ClassificationState } from "./classification-state";
import { summarizeClassification } from "./classification-summary";
import type { Facts } from "./engine/types";

const DATE = "2026-11-12";

const shop = (overrides: Facts = {}): ClassificationState => ({
  ...EMPTY_STATE,
  facts: {
    division: "C-2",
    area_m2: 700,
    storeys: 2,
    height_m: 8,
    single_block: true,
    single_use: true,
    storage_over_3_5m: false,
    special_risks: false,
    risk_exempt: false,
    has_basement: false,
    fire_load_class: "medium",
    ...overrides,
  },
});

describe("summarizeClassification", () => {
  it("is empty when nothing was saved", () => {
    expect(summarizeClassification(null, DATE)).toEqual({ status: "empty" });
  });

  it("is empty when the saved state holds no answer", () => {
    expect(summarizeClassification(EMPTY_STATE, DATE)).toEqual({
      status: "empty",
    });
  });

  it("gives the decided risk with its process and source", () => {
    const summary = summarizeClassification(shop(), DATE);

    expect(summary.status === "empty" ? undefined : summary.risk).toMatchObject(
      {
        status: "decided",
        level: "II",
        reason: { locator: "Anexo A, Quadro 1" },
      },
    );
  });

  it("lists the labels of the required systems", () => {
    const summary = summarizeClassification(shop(), DATE);

    expect(summary.status === "empty" ? [] : summary.required).toContain(
      "Extintores",
    );
  });

  it("lists the labels of what is still to be answered", () => {
    const summary = summarizeClassification(
      shop({ fire_load_class: undefined }),
      DATE,
    );

    expect(summary).toMatchObject({ status: "pending" });
    expect(summary.status === "empty" ? [] : summary.missing).toHaveLength(1);
  });

  it("counts the answers given", () => {
    const summary = summarizeClassification(shop(), DATE);

    expect(
      summary.status === "empty" ? undefined : summary.progress.answered,
    ).toBeGreaterThan(0);
  });
});
