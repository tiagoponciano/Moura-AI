import { describe, expect, it } from "vitest";
import {
  RESCUE_CYCLE,
  cycleTime,
  rescueState,
  rungStep,
} from "./rescue-timeline";

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
    for (const t of [15, 23, 35.8]) {
      const state = rescueState(t);
      expect([
        state.ladderYaw,
        state.ladderPitch,
        state.ladderExtension,
      ]).toEqual([1, 1, 1]);
    }
  });

  it("stows the ladder before the truck starts to leave", () => {
    const state = rescueState(41.6);
    expect([state.ladderYaw, state.ladderPitch, state.ladderExtension]).toEqual(
      [0, 0, 0],
    );
    expect(state.truckLeave).toBe(0);
  });

  it("sprays water only after the climbers are up and puts the fire out", () => {
    expect(rescueState(17).jet).toBe(0);
    expect(rescueState(23).jet).toBe(1);
    expect(rescueState(27.6).fire).toBe(0);
    expect(rescueState(27.6).jet).toBe(0);
  });

  it("sends the first climber up before the second", () => {
    const state = rescueState(16);
    expect(state.climbers[0].visible).toBe(true);
    expect(state.climbers[0].climb).toBeGreaterThan(0);
    expect(state.climbers[0].climb).toBeLessThan(1);
    expect(state.climbers[1].visible).toBe(false);
  });

  it("has both climbers inside, in position, while the jet puts the fire out", () => {
    const state = rescueState(24);
    expect(state.fire).toBeGreaterThan(0);
    expect(state.jet).toBe(1);
    for (const climber of state.climbers) {
      expect(climber.visible).toBe(true);
      expect(climber.enter).toBe(1);
      expect(climber.advance).toBe(1);
    }
  });

  it("sprays only while the first climber is in position", () => {
    for (let t = 0; t < RESCUE_CYCLE; t += 0.1) {
      const state = rescueState(t);
      if (state.jet > 0) expect(state.climbers[0].advance).toBe(1);
    }
  });

  it("starts the retreat only after the fire is out", () => {
    for (let t = 0; t < RESCUE_CYCLE; t += 0.1) {
      const state = rescueState(t);
      for (const climber of state.climbers)
        if (climber.descending) expect(state.fire).toBe(0);
    }
    const state = rescueState(27.9);
    expect(state.fire).toBe(0);
    expect(state.climbers.every((c) => c.advance === 1)).toBe(true);
  });

  it("enters the second climber only after the first has moved in", () => {
    const [first, second] = rescueState(20.5).climbers;
    expect(first.advance).toBeGreaterThan(0);
    expect(second.enter).toBe(0);
  });

  it("brings both climbers back out and down after the fire is out", () => {
    const first = rescueState(32).climbers[0];
    expect(first.visible).toBe(true);
    expect(first.enter).toBe(0);
    expect(first.climb).toBeGreaterThan(0);
    expect(first.climb).toBeLessThan(1);
    expect(first.descending).toBe(true);
    expect(rescueState(33).climbers[0].climb).toBeLessThan(first.climb);
    const second = rescueState(32).climbers[1];
    expect(second.visible).toBe(true);
    expect(second.climb).toBeGreaterThan(first.climb);
  });

  it("gets both climbers off the ladder before it stows", () => {
    const state = rescueState(36.3);
    expect(state.climbers.every((c) => !c.visible)).toBe(true);
    expect(state.ladderExtension).toBe(1);
  });

  it("connects the hose only after the hoseman reaches the inlet", () => {
    for (const t of [10.5, 12, 13.9]) {
      const state = rescueState(t);
      expect(state.hoseman.moving).toBe(true);
      expect(state.hose).toBe(0);
    }
    expect(rescueState(20).hose).toBe(1);
    expect(rescueState(20).hoseman.walk).toBe(1);
  });

  it("disconnects the hose before the hoseman walks back", () => {
    for (const t of [38, 40]) {
      const state = rescueState(t);
      expect(state.hoseman.returning).toBe(true);
      expect(state.hose).toBe(0);
    }
    expect(rescueState(41.6).hoseman.visible).toBe(false);
  });

  it("ends the cycle with the truck gone and the siren off", () => {
    const state = rescueState(RESCUE_CYCLE - 1);
    expect(state.truckLeave).toBe(1);
    expect(state.siren).toBe(false);
  });
});

describe("rungStep", () => {
  it("rests on a rung at every whole step", () => {
    expect(rungStep(0, 10).travel).toBe(0);
    expect(rungStep(0.3, 10).travel).toBeCloseTo(0.3);
    expect(rungStep(1, 10).travel).toBe(1);
  });

  it("moves between rungs with an eased step, never backwards", () => {
    let previous = -1;
    for (let p = 0; p <= 1; p += 0.01) {
      const { travel } = rungStep(p, 10);
      expect(travel).toBeGreaterThanOrEqual(previous);
      previous = travel;
    }
    expect(rungStep(0.025, 10).travel).toBeLessThan(0.025);
  });
});
