import { GROUP_A_RULES } from "./group-a";
import { GROUP_B_RULES } from "./group-b";
import { GROUP_C_RULES } from "./group-c";
import { GROUP_D_RULES } from "./group-d";
import { GROUP_E_RULES } from "./group-e";
import { BASEMENT_RULES } from "./basement";
import { GROUP_A1_RULES } from "./group-a1";
import { IN5_RULES } from "./in5";
import { GROUP_F_RULES } from "./group-f";
import { GROUP_K_RULES } from "./group-k";
import { GROUP_M_RULES } from "./group-m";
import { GROUP_M_DIVISIONS_RULES } from "./group-m-divisions";
import { GROUP_G_RULES } from "./group-g";
import { GROUP_H_RULES } from "./group-h";
import { GROUP_IJ_RULES } from "./group-ij";

/**
 * Every rule loaded. `GROUP_C_RULES` also holds the rules every covered group
 * shares (fire load class, regime, guards, risk V, I, II and IV).
 */
export const ALL_RULES = [
  ...GROUP_A_RULES,
  ...GROUP_B_RULES,
  ...GROUP_C_RULES,
  ...GROUP_D_RULES,
  ...GROUP_E_RULES,
  ...GROUP_F_RULES,
  ...GROUP_A1_RULES,
  ...GROUP_K_RULES,
  ...GROUP_M_RULES,
  ...GROUP_M_DIVISIONS_RULES,
  ...BASEMENT_RULES,
  ...IN5_RULES,
  ...GROUP_G_RULES,
  ...GROUP_H_RULES,
  ...GROUP_IJ_RULES,
];
