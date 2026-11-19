import {
  handleListProjectFiles,
  handleRecordProjectFile,
} from "@/features/projects/server";

export const GET = handleListProjectFiles;
export const POST = handleRecordProjectFile;
