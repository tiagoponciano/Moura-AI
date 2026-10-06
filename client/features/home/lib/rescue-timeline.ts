/** Length of one rescue loop, in seconds. */
export const RESCUE_CYCLE = 48;

/** Moment shown as a still frame when the user prefers reduced motion. */
export const STATIC_RESCUE_TIME = 16.2;

export type ClimberState = {
  visible: boolean;
  /** 0 at the ladder base, 1 at the tip. */
  climb: number;
  /** 0 at the tip, 1 just inside the entry window. */
  enter: number;
  /** 0 just inside the entry window, 1 at the climber's attack position facing the fire. */
  advance: number;
  /** True from the moment the climber starts back toward the window until they are down. */
  descending: boolean;
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
  /** Opacity of the hose; it shows only while connected, never while being carried. */
  hose: number;
  hoseman: {
    visible: boolean;
    /** 0 at the pump panel, 1 at the inlet. */
    walk: number;
    moving: boolean;
    returning: boolean;
  };
  jet: number;
};

const CLIMB_SECONDS = 4.2;
const ENTER_SECONDS = 0.7;
const ADVANCE_SECONDS = 1.5;
const CLIMBER_STARTS = [14.8, 16.3];
/** When each climber turns back toward the entry window, after the fire is out. */
const CLIMBER_RETREATS = [28, 29.6];

function progress(t: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeIn = (x: number) => x * x * x;

/**
 * Climbing is rung by rung: the body rests on each rung and moves to the next
 * with an eased step. `travel` is the eased share of the ladder (0–1) and
 * `phase` advances by π per rung, to drive the alternating limbs.
 */
export function rungStep(
  progress: number,
  rungs: number,
): { travel: number; phase: number } {
  const steps = progress * rungs;
  const rung = Math.min(Math.floor(steps), rungs - 1);
  const within = steps - rung;
  return {
    travel: (rung + within * within * (3 - 2 * within)) / rungs,
    phase: steps * Math.PI,
  };
}

/** Seconds since the scene started, folded into one cycle. */
export function cycleTime(seconds: number): number {
  return ((seconds % RESCUE_CYCLE) + RESCUE_CYCLE) % RESCUE_CYCLE;
}

/**
 * Everything that moves in the rescue story at cycle time `t`:
 * fire starts at 1.5 s, the truck arrives 3–9 s, the hoseman walks to the inlet
 * 10–14 s and connects the hose, the ladder turns, rises and extends
 * 9.5–14.5 s, two firefighters climb from 14.8 s, enter through the window
 * next to the fire and advance to it, the first sprays 21.4–27 s, they retreat
 * from 28 s and come back down by 36 s, the ladder stows 36.4–39 s, the hoseman
 * disconnects and walks back 37–41.4 s and the truck leaves 41.8–45.8 s.
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

  const walkOut = easeInOut(progress(t, 10, 14));
  const walkBack = easeInOut(progress(t, 37.6, 41.4));

  return {
    fire: progress(t, 1.5, 4) * (1 - easeInOut(progress(t, 22, 27.5))),
    smoke: progress(t, 2, 5) * (1 - progress(t, 24, 31)),
    truckArrive: easeOut(progress(t, 3, 9)),
    truckLeave: easeIn(progress(t, 41.8, 45.8)),
    siren: t > 2.8 && t < 45.8,
    ladderYaw: deployed(9.5, 11, 38, 39),
    ladderPitch: deployed(11, 12.8, 37.2, 38),
    ladderExtension: deployed(12.8, 14.5, 36.4, 37.2),
    climbers: CLIMBER_STARTS.map((start, k) => {
      const atTip = start + CLIMB_SECONDS;
      const inside = atTip + ENTER_SECONDS;
      const retreat = CLIMBER_RETREATS[k];
      const exit = retreat + ADVANCE_SECONDS;
      const onLadder = exit + ENTER_SECONDS;
      const down = onLadder + CLIMB_SECONDS;
      const descending = t >= retreat;
      return {
        visible: t > start - 0.1 && t < down,
        climb: descending
          ? 1 - progress(t, onLadder, down)
          : progress(t, start, atTip),
        enter: descending
          ? 1 - progress(t, exit, onLadder)
          : progress(t, atTip, inside),
        advance: easeInOut(
          descending
            ? 1 - progress(t, retreat, exit)
            : progress(t, inside, inside + ADVANCE_SECONDS),
        ),
        descending,
      };
    }),
    hose: progress(t, 14, 14.5) * (1 - progress(t, 37, 37.5)),
    hoseman: {
      visible: t > 9.6 && t < 41.5,
      walk: walkOut * (1 - walkBack),
      moving: (t > 10 && t < 14) || (t > 37.6 && t < 41.4),
      returning: t > 37.6,
    },
    jet: progress(t, 21.4, 22) * (1 - progress(t, 26.5, 27)),
  };
}
