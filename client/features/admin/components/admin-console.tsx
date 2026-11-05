"use client";

import { Cpu, FileText, Globe, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { findCatalogProvider } from "@/lib/llm/catalog";
import { useAdminForms } from "../hooks/use-admin-forms";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { useAdminUsers } from "../hooks/use-admin-users";
import { useSiteCheck } from "../hooks/use-site-check";
import { formsSummary } from "../lib/forms";
import { getSetupProblem, summarizeSections } from "../lib/sections";
import { diffSiteCheck, siteCheckWarning } from "../lib/site-check";
import { countByStatus } from "../lib/users";
import { AccessPanel } from "./access-panel";
import { FormsSection } from "./forms-section";
import { ModelPanel } from "./model-panel";
import { SectionTab } from "./section-tab";
import { SetupBanner } from "./setup-banner";
import { UsersSection } from "./users-section";

type Section = "users" | "model" | "access" | "forms";

/** Setup banner, four section cards with their current state, and one section at a time. */
export function AdminConsole() {
  const users = useAdminUsers();
  const settings = useAdminSettings();
  const forms = useAdminForms();
  const site = useSiteCheck();
  const [section, setSection] = useState<Section>("users");

  const differences = useMemo(
    () =>
      forms.forms && site.check ? diffSiteCheck(forms.forms, site.check) : [],
    [forms.forms, site.check],
  );
  const siteWarning = siteCheckWarning(site.check, differences);

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
        className="gap-6"
      >
        <TabsList
          aria-label="Seções da administração"
          className="w-full flex-wrap items-stretch justify-start gap-3 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto"
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
          <SectionTab
            value="forms"
            icon={FileText}
            label="Formulários CBMSC"
            summary={siteWarning ?? formsSummary(forms.forms)}
            highlight={siteWarning !== undefined}
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

        <TabsContent value="forms">
          <FormsSection catalog={forms} site={site} differences={differences} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
