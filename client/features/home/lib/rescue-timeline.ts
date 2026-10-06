/** Length of one rescue loop, in seconds. */
export const RESCUE_CYCLE = 44;

/** Moment shown as a still frame when the user prefers reduced motion. */
export const STATIC_RESCUE_TIME = 16.2;

export type ClimberState = {
  visible: boolean;
  /** 0 at the ladder base, 1 at the tip. */
  climb: number;
  /** 0 at the tip, 1 inside the window. */
  enter: number;
  /** True from the moment the climber leaves the room until they are down. */
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
const CLIMBER_STARTS = [14.8, 16.3];
/** When each climber steps back out of the window onto the ladder. */
const CLIMBER_EXITS = [25.5, 27];

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
 * 9.5–14.5 s, two firefighters climb from 14.8 s, water sprays 18.5–24 s, the
 * climbers come back down 25.5–31.9 s, the ladder stows 32.3–34.9 s, the
 * hoseman disconnects and walks back 33–37.4 s and the truck leaves 37.8–41.8 s.
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
  const walkBack = easeInOut(progress(t, 33.6, 37.4));

  return {
    fire: progress(t, 1.5, 4) * (1 - easeInOut(progress(t, 19, 25))),
    smoke: progress(t, 2, 5) * (1 - progress(t, 21, 28)),
    truckArrive: easeOut(progress(t, 3, 9)),
    truckLeave: easeIn(progress(t, 37.8, 41.8)),
    siren: t > 2.8 && t < 41.8,
    ladderYaw: deployed(9.5, 11, 33.9, 34.9),
    ladderPitch: deployed(11, 12.8, 33.1, 33.9),
    ladderExtension: deployed(12.8, 14.5, 32.3, 33.1),
    climbers: CLIMBER_STARTS.map((start, k) => {
      const exit = CLIMBER_EXITS[k];
      const down = exit + ENTER_SECONDS + CLIMB_SECONDS;
      const descending = t >= exit;
      const enter = descending
        ? 1 - progress(t, exit, exit + ENTER_SECONDS)
        : progress(
            t,
            start + CLIMB_SECONDS,
            start + CLIMB_SECONDS + ENTER_SECONDS,
          );
      const climb = descending
        ? 1 - progress(t, exit + ENTER_SECONDS, down)
        : progress(t, start, start + CLIMB_SECONDS);
      return {
        visible: t > start - 0.1 && (descending ? t < down : enter < 1),
        climb,
        enter,
        descending,
      };
    }),
    hose: progress(t, 14, 14.5) * (1 - progress(t, 33, 33.5)),
    hoseman: {
      visible: t > 9.6 && t < 37.5,
      walk: walkOut * (1 - walkBack),
      moving: (t > 10 && t < 14) || (t > 33.6 && t < 37.4),
      returning: t > 33.6,
    },
    jet: progress(t, 18.5, 19.2) * (1 - progress(t, 23.5, 24)),
  };
}
