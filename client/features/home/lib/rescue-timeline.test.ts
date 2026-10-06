import { describe, expect, it } from "vitest";
import { RESCUE_CYCLE, cycleTime, rescueState } from "./rescue-timeline";

describe("cycleTime", () => {
  it("wraps elapsed seconds into the cycle", () => {
    expect(cycleTime(RESCUE_CYCLE + 5)).toBeCloseTo(5);
  });

  it("keeps negative input inside the cycle", () => {
    expect(cycleTime(-1)).toBeCloseTo(RESCUE_CYCLE - 1);
  });
});

describe("rescueState", () => {
  it("starts calm: no fire, truck away, ladder stowed", () => {
    const state = rescueState(0);
    expect(state.fire).toBe(0);
    expect(state.truckArrive).toBe(0);
    expect(state.siren).toBe(false);
    expect([state.ladderYaw, state.ladderPitch, state.ladderExtension]).toEqual(
      [0, 0, 0],
    );
  });

  it("parks the truck with the siren on while the rescue happens", () => {
    const state = rescueState(15);
    expect(state.truckArrive).toBe(1);
    expect(state.truckLeave).toBe(0);
    expect(state.siren).toBe(true);
  });

  it("keeps the ladder fully deployed while firefighters climb and spray", () => {
    for (const t of [15, 23]) {
      const state = rescueState(t);
      expect([
        state.ladderYaw,
        state.ladderPitch,
        state.ladderExtension,
      ]).toEqual([1, 1, 1]);
    }
  });

  it("stows the ladder before the truck starts to leave", () => {
    const state = rescueState(27.4);
    expect([state.ladderYaw, state.ladderPitch, state.ladderExtension]).toEqual(
      [0, 0, 0],
    );
    expect(state.truckLeave).toBe(0);
  });

  it("sprays water only after the climbers are up and puts the fire out", () => {
    expect(rescueState(17).jet).toBe(0);
    expect(rescueState(21).jet).toBe(1);
    expect(rescueState(26).fire).toBe(0);
    expect(rescueState(26).jet).toBe(0);
  });

  it("sends the first climber up before the second", () => {
    const state = rescueState(16);
    expect(state.climbers[0].visible).toBe(true);
    expect(state.climbers[0].climb).toBeGreaterThan(0);
    expect(state.climbers[0].climb).toBeLessThan(1);
    expect(state.climbers[1].visible).toBe(false);
  });

  it("hides the climbers once they enter the window", () => {
    expect(rescueState(22).climbers.every((c) => !c.visible)).toBe(true);
  });

  it("lays the hose out and back in around the rescue", () => {
    expect(rescueState(9).hose).toBe(0);
    expect(rescueState(20).hose).toBe(1);
    expect(rescueState(28).hose).toBe(0);
    expect(rescueState(28).hoseman.visible).toBe(false);
  });

  it("ends the cycle with the truck gone and the siren off", () => {
    const state = rescueState(33);
    expect(state.truckLeave).toBe(1);
    expect(state.siren).toBe(false);
  });
});
