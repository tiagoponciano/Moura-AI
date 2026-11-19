import {
  buildingCheckTools,
  normSearchTools,
} from "@/features/classification/server";
import { createDocumentsChatHandler } from "@/features/documents/server";

export const maxDuration = 60;

export const POST = createDocumentsChatHandler({
  ...buildingCheckTools,
  ...normSearchTools,
});
