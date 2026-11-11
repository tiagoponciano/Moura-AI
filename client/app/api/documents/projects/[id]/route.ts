import {
  handleArchiveProject,
  handleUpdateProject,
} from "@/features/documents/server";

export const PATCH = handleUpdateProject;
export const DELETE = handleArchiveProject;
