import { Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { AdminUser, UserChange } from "../lib/types";

type PendingUserCardProps = {
  user: AdminUser;
  busy: boolean;
  disabled: boolean;
  onChange: (change: UserChange) => void;
};

/** A sign-up waiting for an admin, with Rejeitar and Aprovar. */
export function PendingUserCard({
  user,
  busy,
  disabled,
  onChange,
}: PendingUserCardProps) {
  const displayName = user.name ?? user.email;

  return (
    <li className="flex flex-col gap-3.5 rounded-xl border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={displayName} avatarUrl={user.avatarUrl} />
        <div className="grid min-w-0 leading-snug">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="truncate text-[13px] text-muted-foreground">
            {user.email}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs text-muted-foreground">
          Pediu acesso em {formatDateTime(user.createdAt)}
        </span>
        {busy && <Loader2 className="size-4 animate-spin" />}
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange({ status: "rejected" })}
        >
          Rejeitar
        </Button>
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => onChange({ status: "approved" })}
        >
          Aprovar
        </Button>
      </div>
    </li>
  );
}
