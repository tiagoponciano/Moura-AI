"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { fetchUsers, updateUser } from "../lib/client";
import type { AdminUser, AdminUsersResponse } from "../lib/types";

type UserChange = Partial<Pick<AdminUser, "status" | "role">>;

/** The user list, reloaded after every change; `busyId` is the row being saved. */
export function useAdminUsers() {
  const [data, setData] = useState<AdminUsersResponse>();
  const [error, setError] = useState<string>();
  const [busyId, setBusyId] = useState<string>();

  useEffect(() => {
    fetchUsers().then(setData, (cause) => setError(errorMessage(cause)));
  }, []);

  const change = useCallback(async (id: string, update: UserChange) => {
    setBusyId(id);
    try {
      await updateUser(id, update);
      setData(await fetchUsers());
      setError(undefined);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(undefined);
    }
  }, []);

  return { data, error, busyId, change };
}
