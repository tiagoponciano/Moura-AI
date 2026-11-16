import {
  handleListProjectPlans,
  handleRecordProjectPlan,
} from "@/features/floor-plans/server";

export const GET = handleListProjectPlans;
export const POST = handleRecordProjectPlan;
