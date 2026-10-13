"use client";

import { Cpu, Globe, Users } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { findCatalogProvider } from "@/lib/llm/catalog";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { useAdminUsers } from "../hooks/use-admin-users";
import { getSetupProblem, summarizeSections } from "../lib/sections";
import { countByStatus } from "../lib/users";
import { AccessPanel } from "./access-panel";
import { ModelPanel } from "./model-panel";
import { SectionTab } from "./section-tab";
import { SetupBanner } from "./setup-banner";
import { UsersSection } from "./users-section";

type Section = "users" | "model" | "access";

/** Setup banner, three section cards with their current state, and one section at a time. */
export function AdminConsole() {
  const users = useAdminUsers();
  const settings = useAdminSettings();
  const [section, setSection] = useState<Section>("users");

  const summaries = summarizeSections(users.data?.users, settings.data);
  const pendingCount = users.data ? countByStatus(users.data.users).pending : 0;
  const problem = settings.data && getSetupProblem(settings.data);
  const savedProvider = settings.data?.settings.provider;

  const settingsFallback = settings.error ? (
    <p role="alert" className="text-sm text-destructive">
      {settings.error}
    </p>
  ) : (
    <Skeleton className="h-64 w-full" />
  );

  return (
    <div className="flex flex-col gap-6">
      {problem && (
        <SetupBanner
          problem={problem}
          providerLabel={
            savedProvider
              ? findCatalogProvider(savedProvider)?.label
              : undefined
          }
          onFix={() => setSection("model")}
        />
      )}

      <Tabs
        value={section}
        onValueChange={(value) => setSection(value as Section)}
        className="flex-col gap-6"
      >
        <TabsList
          aria-label="Seções da administração"
          className="h-auto w-full flex-wrap items-stretch justify-start gap-3 rounded-none bg-transparent p-0"
        >
          <SectionTab
            value="users"
            icon={Users}
            label="Usuários"
            summary={summaries.users}
            highlight={pendingCount > 0}
          />
          <SectionTab
            value="model"
            icon={Cpu}
            label="Modelo de IA"
            summary={summaries.model}
          />
          <SectionTab
            value="access"
            icon={Globe}
            label="Acesso"
            summary={summaries.access}
          />
        </TabsList>

        <TabsContent value="users" className="flex flex-col gap-3">
          {users.error && (
            <p role="alert" className="text-sm text-destructive">
              {users.error}
            </p>
          )}
          {users.data ? (
            <UsersSection
              data={users.data}
              busyId={users.busyId}
              onChange={users.change}
            />
          ) : (
            !users.error && <Skeleton className="h-64 w-full" />
          )}
        </TabsContent>

        <TabsContent value="model">
          {settings.data ? (
            <ModelPanel data={settings.data} run={settings.run} />
          ) : (
            settingsFallback
          )}
        </TabsContent>

        <TabsContent value="access">
          {settings.data ? (
            <AccessPanel data={settings.data} run={settings.run} />
          ) : (
            settingsFallback
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
