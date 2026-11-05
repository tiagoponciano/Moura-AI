import {
  handleGetSiteCheck,
  handleRunSiteCheck,
} from "@/features/admin/server";

export const maxDuration = 60;

export const GET = handleGetSiteCheck;

export const POST = handleRunSiteCheck;
