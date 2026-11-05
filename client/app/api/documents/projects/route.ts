import {
  handleCreateProject,
  handleListProjects,
} from "@/features/documents/server";

export const GET = handleListProjects;

export const POST = handleCreateProject;
