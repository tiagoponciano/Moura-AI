"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { AccessPanel } from "./access-panel";
import { ModelPanel } from "./model-panel";
import { UsersPanel } from "./users-panel";

/** Users on the left; AI model and access settings on the right. */
export function AdminConsole() {
  const settings = useAdminSettings();

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <UsersPanel />
      <div className="grid gap-4">
        {settings.error && (
          <p role="alert" className="text-sm text-destructive">
            {settings.error}
          </p>
        )}
        {settings.data ? (
          <>
            <ModelPanel data={settings.data} run={settings.run} />
            <AccessPanel data={settings.data} run={settings.run} />
          </>
        ) : (
          !settings.error && <Skeleton className="h-64 w-full" />
        )}
      </div>
    </div>
  );
}
