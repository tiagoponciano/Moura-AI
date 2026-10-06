import { Vector3 } from "three";

/** Building and street layout, in meters. The building is centered on the origin; +z faces the street. */
export const FLOORS = 5;
export const FLOOR_HEIGHT = 3.2;
export const SLAB = 0.3;
export const HALF_X = 12;
export const HALF_Z = 7;
export const ROOF = FLOORS * FLOOR_HEIGHT;
export const CORE = { x0: 5, x1: 10, z0: -3, z1: 3 } as const;
export const STREET = { z0: 12, z1: 20 } as const;
export const TRUCK_Z = 15.2;
export const EXIT_X = 7.5;

export const FIRE_FLOOR = 3;
export const FIRE_X = -6;
const fireFloorY = FIRE_FLOOR * FLOOR_HEIGHT + SLAB;
/** Where the ladder tip stops, just outside the glass of the burning room. */
export const WINDOW = new Vector3(FIRE_X, fireFloorY + 1.35, HALF_Z + 0.55);
/** Center of the burning room. */
export const ROOM = new Vector3(FIRE_X, fireFloorY + 1.3, HALF_Z - 2.2);
export const RISER = { x: CORE.x0 - 0.5, z: 2.4 } as const;
/** Fire department inlet (registro de recalque) on the sidewalk. */
export const INLET = new Vector3(RISER.x, 0.35, HALF_Z + 2.4);
