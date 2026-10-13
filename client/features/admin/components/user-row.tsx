import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatChatDate } from "@/lib/chat-history/format";
import { ROLE_LABEL, STATUS_LABEL } from "../lib/labels";
import type { AdminUser } from "../lib/types";

type UserChange = Partial<Pick<AdminUser, "status" | "role">>;

type UserRowProps = {
  user: AdminUser;
  isSelf: boolean;
  busy: boolean;
  disabled: boolean;
  onChange: (change: UserChange) => void;
};

const STATUS_VARIANT = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
} as const;

/** One profile with the actions its status allows; none on the admin's own row. */
export function UserRow({
  user,
  isSelf,
  busy,
  disabled,
  onChange,
}: UserRowProps) {
  const displayName = user.name ?? user.email;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <Avatar className="size-8 rounded-lg">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-sm leading-tight">
        <span className="truncate font-medium">
          {displayName}
          {isSelf && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              (você)
            </span>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email} · entrou em {formatChatDate(user.createdAt)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant={STATUS_VARIANT[user.status]}>
          {STATUS_LABEL[user.status]}
        </Badge>
        <Badge variant="outline">{ROLE_LABEL[user.role]}</Badge>
      </div>
      {!isSelf && (
        <div className="flex items-center gap-1.5">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {user.status !== "approved" && (
            <Button
              size="sm"
              disabled={disabled}
              onClick={() => onChange({ status: "approved" })}
            >
              Aprovar
            </Button>
          )}
          {user.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onChange({ status: "rejected" })}
            >
              Rejeitar
            </Button>
          )}
          {user.status === "approved" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() =>
                  onChange({ role: user.role === "admin" ? "member" : "admin" })
                }
              >
                {user.role === "admin" ? "Tornar membro" : "Tornar admin"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={disabled}
                onClick={() => onChange({ status: "rejected" })}
              >
                Revogar
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
