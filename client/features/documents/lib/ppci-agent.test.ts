import { describe, expect, it } from "vitest";
import {
  changesFromToolOutput,
  currentGroup,
  GROUP_NOT_APPLICABLE_TOOL,
  MARK_ITEMS_TOOL,
  unansweredItems,
} from "./ppci-agent";
import {
  answersByItem,
  type Answer,
  type ChecklistGroup,
} from "./ppci-answers";

const item = (position: number) => ({
  position,
  section: null,
  text: `item ${position}`,
  reference: null,
});

const groups: ChecklistGroup[] = [
  { position: 1, name: "Extintores", items: [item(1), item(2)] },
  { position: 2, name: "GLP", items: [item(1), item(2), item(3)] },
];

const answer = (
  group_position: number,
  item_position: number,
  status: Answer["status"],
): Answer => ({
  group_position,
  item_position,
  status,
  note: null,
  updated_by_name: null,
  updated_at: "2026-11-11T10:00:00Z",
});

const none = answersByItem([]);

describe("unansweredItems", () => {
  it("leaves out the items that have a status", () => {
    const answers = answersByItem([answer(2, 1, "atende"), answer(2, 3, "na")]);
    expect(unansweredItems(groups[1], answers).map((i) => i.position)).toEqual([
      2,
    ]);
  });

  it("counts an item with only a cleared answer as unanswered", () => {
    const answers = answersByItem([answer(2, 1, null)]);
    expect(unansweredItems(groups[1], answers)).toHaveLength(3);
  });
});

describe("currentGroup", () => {
  it("is the first group with unanswered items", () => {
    const answers = answersByItem([
      answer(1, 1, "atende"),
      answer(1, 2, "atende"),
    ]);
    expect(currentGroup(groups, answers)?.name).toBe("GLP");
  });

  it("is the picked group even when it is complete", () => {
    const answers = answersByItem([
      answer(1, 1, "atende"),
      answer(1, 2, "atende"),
    ]);
    expect(currentGroup(groups, answers, 1)?.name).toBe("Extintores");
  });

  it("is the last group once everything is answered", () => {
    const all = answersByItem(
      groups.flatMap((g) =>
        g.items.map((i) => answer(g.position, i.position, "atende")),
      ),
    );
    expect(currentGroup(groups, all)?.name).toBe("GLP");
  });
});

describe("changesFromToolOutput", () => {
  it("turns marked items into answers, trimming the notes", () => {
    const changes = changesFromToolOutput(
      MARK_ITEMS_TOOL,
      { items: [{ position: 1, status: "adequar", note: " ver prancha " }] },
      groups[0],
      none,
    );
    expect(changes).toEqual([
      { itemPosition: 1, status: "adequar", note: "ver prancha" },
    ]);
  });

  it("drops items that are not in the current group", () => {
    const changes = changesFromToolOutput(
      MARK_ITEMS_TOOL,
      { items: [{ position: 9, status: "atende" }] },
      groups[0],
      none,
    );
    expect(changes).toEqual([]);
  });

  it("ignores a malformed tool output", () => {
    expect(
      changesFromToolOutput(MARK_ITEMS_TOOL, { items: "x" }, groups[0], none),
    ).toEqual([]);
  });

  it("marks only the unanswered items when the group does not apply", () => {
    const answers = answersByItem([answer(2, 1, "atende")]);
    const changes = changesFromToolOutput(
      GROUP_NOT_APPLICABLE_TOOL,
      {},
      groups[1],
      answers,
    );
    expect(changes.map((c) => c.itemPosition)).toEqual([2, 3]);
    expect(changes.every((c) => c.status === "na")).toBe(true);
  });

  it("ignores another tool", () => {
    expect(changesFromToolOutput("other", {}, groups[0], none)).toEqual([]);
  });
});
