/** Length of one rescue loop, in seconds. */
export const RESCUE_CYCLE = 34;

/** Moment shown as a still frame when the user prefers reduced motion. */
export const STATIC_RESCUE_TIME = 16.2;

export type ClimberState = {
  visible: boolean;
  /** 0 at the ladder base, 1 at the tip. */
  climb: number;
  /** 0 at the tip, 1 inside the window. */
  enter: number;
};

export type RescueState = {
  fire: number;
  smoke: number;
  truckArrive: number;
  truckLeave: number;
  siren: boolean;
  ladderYaw: number;
  ladderPitch: number;
  ladderExtension: number;
  climbers: ClimberState[];
  hose: number;
  hoseman: { visible: boolean; moving: boolean; returning: boolean };
  jet: number;
};

const CLIMB_SECONDS = 4.2;
const ENTER_SECONDS = 0.7;
const CLIMBER_STARTS = [14.8, 16.3];

function progress(t: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeIn = (x: number) => x * x * x;

/** Seconds since the scene started, folded into one cycle. */
export function cycleTime(seconds: number): number {
  return ((seconds % RESCUE_CYCLE) + RESCUE_CYCLE) % RESCUE_CYCLE;
}

/**
 * Everything that moves in the rescue story at cycle time `t`:
 * fire starts at 1.5 s, the truck arrives 3–9 s, the hose is laid 10–14 s,
 * the ladder turns, rises and extends 9.5–14.5 s, two firefighters climb from
 * 14.8 s, water sprays 18.5–24 s, the ladder stows 24–26.6 s and the truck
 * leaves 27.5–31.5 s.
 */
export function rescueState(t: number): RescueState {
  const deployed = (
    start: number,
    end: number,
    stowStart: number,
    stowEnd: number,
  ) =>
    easeInOut(progress(t, start, end)) -
    easeInOut(progress(t, stowStart, stowEnd));

  const hoseOut = easeInOut(progress(t, 10, 14));
  const hoseIn = easeInOut(progress(t, 25.5, 27.3));

  return {
    fire: progress(t, 1.5, 4) * (1 - easeInOut(progress(t, 19, 25))),
    smoke: progress(t, 2, 5) * (1 - progress(t, 21, 28)),
    truckArrive: easeOut(progress(t, 3, 9)),
    truckLeave: easeIn(progress(t, 27.5, 31.5)),
    siren: t > 2.8 && t < 31.5,
    ladderYaw: deployed(9.5, 11, 25.6, 26.6),
    ladderPitch: deployed(11, 12.8, 24.8, 25.6),
    ladderExtension: deployed(12.8, 14.5, 24, 24.8),
    climbers: CLIMBER_STARTS.map((start) => {
      const enter = progress(
        t,
        start + CLIMB_SECONDS,
        start + CLIMB_SECONDS + ENTER_SECONDS,
      );
      return {
        visible: t > start - 0.1 && enter < 1,
        climb: progress(t, start, start + CLIMB_SECONDS),
        enter,
      };
    }),
    hose: hoseOut * (1 - hoseIn),
    hoseman: {
      visible: t > 9.6 && t < 27.4,
      moving: (t > 10 && t < 14) || (t > 25.5 && t < 27.3),
      returning: t > 25.5,
    },
    jet: progress(t, 18.5, 19.2) * (1 - progress(t, 23.5, 24)),
  };
}
