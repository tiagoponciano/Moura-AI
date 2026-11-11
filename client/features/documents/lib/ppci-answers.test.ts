import { describe, expect, it } from "vitest";
import {
  answerBody,
  answerKey,
  answersByItem,
  buildGroups,
  groupStats,
  type Answer,
  type ChecklistGroup,
} from "./ppci-answers";

const item = (position: number) => ({
  position,
  section: null,
  text: `item ${position}`,
  reference: null,
});

const group: ChecklistGroup = {
  position: 1,
  name: "Extintores",
  items: [item(1), item(2), item(3), item(4)],
};

const answer = (item_position: number, status: Answer["status"]): Answer => ({
  group_position: 1,
  item_position,
  status,
  note: null,
  updated_by_name: null,
  updated_at: "2026-11-11T10:00:00Z",
});

const stats = (answers: Answer[]) => groupStats(group, answersByItem(answers));

describe("groupStats", () => {
  it("counts every item as pending when nothing is answered", () => {
    expect(stats([])).toEqual({
      items: 4,
      concluded: 0,
      notApplicable: 0,
      pending: 4,
      progress: 0,
    });
  });

  it("keeps an item answered Adequar pending", () => {
    expect(stats([answer(1, "adequar")]).pending).toBe(4);
  });

  it("measures progress over the applicable items", () => {
    const result = stats([answer(1, "atende"), answer(2, "na")]);
    expect(result).toMatchObject({
      concluded: 1,
      notApplicable: 1,
      pending: 2,
    });
    expect(result.progress).toBe(33);
  });

  it("is complete when every item is concluded or not applicable", () => {
    const all = [
      answer(1, "atende"),
      answer(2, "na"),
      answer(3, "na"),
      answer(4, "na"),
    ];
    expect(stats(all).progress).toBe(100);
  });

  it("is complete when every item does not apply", () => {
    const all = [1, 2, 3, 4].map((position) => answer(position, "na"));
    expect(stats(all).progress).toBe(100);
  });

  it("ignores a cleared answer", () => {
    expect(stats([answer(1, null)]).pending).toBe(4);
  });

  it("has no progress in a group without items", () => {
    expect(
      groupStats({ position: 2, name: "Vazio", items: [] }, new Map()).progress,
    ).toBe(0);
  });
});

describe("buildGroups", () => {
  it("nests the items under their group, in order", () => {
    const groups = buildGroups(
      [
        { position: 2, name: "B" },
        { position: 1, name: "A" },
      ],
      [
        { ...item(2), group_position: 1 },
        { ...item(1), group_position: 1 },
        { ...item(1), group_position: 2 },
      ],
    );
    expect(groups.map((g) => [g.name, g.items.map((i) => i.position)])).toEqual(
      [
        ["A", [1, 2]],
        ["B", [1]],
      ],
    );
  });
});

describe("answerBody", () => {
  const base = { version: "v1", groupPosition: 1, itemPosition: 2, note: null };

  it("accepts a status", () => {
    expect(answerBody.safeParse({ ...base, status: "atende" }).success).toBe(
      true,
    );
  });

  it("accepts a null status to clear the answer", () => {
    expect(answerBody.safeParse({ ...base, status: null }).success).toBe(true);
  });

  it("refuses a status that is not one of the three", () => {
    expect(answerBody.safeParse({ ...base, status: "ok" }).success).toBe(false);
  });

  it("refuses a note over 2000 characters", () => {
    const note = "x".repeat(2001);
    expect(answerBody.safeParse({ ...base, status: null, note }).success).toBe(
      false,
    );
  });
});

it("keys an answer by group and item", () => {
  expect(answerKey(3, 12)).toBe("3.12");
});
