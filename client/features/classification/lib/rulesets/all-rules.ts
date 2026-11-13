import { GROUP_C_RULES } from "./group-c";
import { GROUP_D_RULES } from "./group-d";

/**
 * Every rule loaded. `GROUP_C_RULES` also holds the rules every covered group
 * shares (fire load class, regime, guards, risk V, I, II and IV).
 */
export const ALL_RULES = [...GROUP_C_RULES, ...GROUP_D_RULES];
